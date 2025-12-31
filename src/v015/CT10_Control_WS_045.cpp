/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_WS_045.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, WS Scheduler)
 * ------------------------------------------------------
 * 기능 요약:
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)
 * - 전송 스로틀 + pending 플래그 (필수/즉효)
 * - 정책 기반 우선순위 전송 (wsChConfig[].priority → order 산출)
 * - payload 크기 측정(measureJson) → chart 대형이면 자동 강스로틀
 * - W10 cleanupClients 주기 호출(권장)
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 *  - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 변수명은 가능한 해석 가능하게
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - namespace 명        : 모듈약어_ 접두사
 *   - namespace 내 상수    : 모둘약어 접두시 미사용
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사 , 버전 제거
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include "CT10_Control_042.h"
#include <string.h>

// --------------------------------------------------
// 외부 진입: 시뮬레이터 등에서 Dirty 마킹
// --------------------------------------------------
void CT10_markDirtyFromSim(const char* p_key) {
    if (!p_key || !p_key[0]) return;
    CL_CT10_ControlManager::instance().markDirty(p_key);
}

// --------------------------------------------------
// Broker 함수 포인터 (CT10_WS_bindToW10에서 주입)
// --------------------------------------------------
static void (*s_bcast_state)(JsonDocument&, bool)   = nullptr;
static void (*s_bcast_metrics)(JsonDocument&, bool) = nullptr;
static void (*s_bcast_chart)(JsonDocument&, bool)   = nullptr;
static void (*s_bcast_summary)(JsonDocument&, bool) = nullptr;
static void (*s_ws_cleanup)()                       = nullptr;

// --------------------------------------------------
// 내부 상태
// --------------------------------------------------
static uint32_t s_lastSendMs[EN_A20_WS_CH_COUNT] = {0, 0, 0, 0};
static bool     s_pending[EN_A20_WS_CH_COUNT]    = {false, false, false, false};

static uint32_t s_lastCleanupMs     = 0;
static uint32_t s_lastPolicyApplyMs = 0;

// interval(ms) - 기본값은 BaseArr, 이후 system.webSocket 정책으로 덮어씀
static uint16_t s_itvMs[EN_A20_WS_CH_COUNT] = {
    (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_STATE].chDefaultIntervalMs,
    (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_METRICS].chDefaultIntervalMs,
    (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_CHART].chDefaultIntervalMs,
    (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_SUMMARY].chDefaultIntervalMs
};

// 우선순위 전송 order(채널 인덱스 배열)
static uint8_t s_prio[EN_A20_WS_CH_COUNT] = {
    (uint8_t)EN_A20_WS_CH_STATE,
    (uint8_t)EN_A20_WS_CH_METRICS,
    (uint8_t)EN_A20_WS_CH_CHART,
    (uint8_t)EN_A20_WS_CH_SUMMARY
};

// chart payload 기반 강스로틀 정책
static uint16_t s_chartLargeBytes  = (uint16_t)G_A20_WS_ETC_DEFAULT_CONFIG.chartLargeBytes;
static uint8_t  s_chartThrottleMul = (uint8_t)G_A20_WS_ETC_DEFAULT_CONFIG.chartThrottleMul;
static uint32_t s_chartLastPayload = 0;

// cleanupClients 호출 주기
static uint16_t s_cleanupMs = (uint16_t)G_A20_WS_ETC_DEFAULT_CONFIG.wsCleanupMs;

// --------------------------------------------------
// 브로커 주입 API (CT10_Control_WS_Broker_xxx.cpp에서 호출)
// --------------------------------------------------
void CT10_WS_setBrokers(
    void (*p_state)(JsonDocument&, bool),
    void (*p_metrics)(JsonDocument&, bool),
    void (*p_chart)(JsonDocument&, bool),
    void (*p_summary)(JsonDocument&, bool),
    void (*p_cleanup)()
) {
    s_bcast_state   = p_state;
    s_bcast_metrics = p_metrics;
    s_bcast_chart   = p_chart;
    s_bcast_summary = p_summary;
    s_ws_cleanup    = p_cleanup;
}

// --------------------------------------------------
// 유틸: priority 숫자 기반 order 산출 (작을수록 먼저, tie는 chIdx 오름차순)
//  - Count=4 이므로 단순 안정 정렬로 충분
// --------------------------------------------------
static void CT10_WS_buildPriorityOrderFromConfig(
    const ST_A20_WS_CH_CONFIG_t p_cfg[EN_A20_WS_CH_COUNT],
    uint8_t                    p_out[EN_A20_WS_CH_COUNT]
) {
    // 초기값: 0..3
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        p_out[v_i] = v_i;
    }

    // 안정 정렬(Count=4)
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < (uint8_t)EN_A20_WS_CH_COUNT; v_j++) {
            uint8_t a = p_out[v_i];
            uint8_t b = p_out[v_j];

            uint8_t pa = p_cfg[a].priority;
            uint8_t pb = p_cfg[b].priority;

            bool v_swap = false;
            if (pb < pa) v_swap = true;
            else if (pb == pa && b < a) v_swap = true;

            if (v_swap) {
                uint8_t t  = p_out[v_i];
                p_out[v_i] = p_out[v_j];
                p_out[v_j] = t;
            }
        }
    }
}

// --------------------------------------------------
// policy 로드: system.webSocket → s_itvMs / priority order / chart 정책 / cleanupMs
//  - 구조: v_sys.system.webSocket.wsChConfig[] + wsEtcConfig
// --------------------------------------------------
static void CT10_WS_applyPolicyFromSystem() {
    if (!g_A20_config_root.system) return;

    const ST_A20_SystemConfig_t&    v_sys = *g_A20_config_root.system;
    const ST_A20_WebSocketConfig_t& v_ws  = v_sys.system.webSocket;

    // 1) intervals(ms)
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        const ST_A20_WS_CH_CONFIG_t& v_ch = v_ws.wsChConfig[v_i];

        // chIdx 방어: 배열 인덱스와 chIdx 불일치해도, "배열 인덱스 기준"으로만 반영
        uint16_t v_itv = v_ch.chIntervalMs;
        if (v_itv > 0) {
            s_itvMs[v_i] = v_itv;
        }
    }

    // 2) priority order: wsChConfig[].priority 기반 산출
    CT10_WS_buildPriorityOrderFromConfig(v_ws.wsChConfig, s_prio);

    // 3) chart policy / cleanup
    if (v_ws.wsEtcConfig.chartLargeBytes > 0) {
        s_chartLargeBytes = v_ws.wsEtcConfig.chartLargeBytes;
    }
    if (v_ws.wsEtcConfig.chartThrottleMul > 0) {
        s_chartThrottleMul = v_ws.wsEtcConfig.chartThrottleMul;
    }
    if (v_ws.wsEtcConfig.wsCleanupMs > 0) {
        s_cleanupMs = v_ws.wsEtcConfig.wsCleanupMs;
    }
}

// --------------------------------------------------
// begin/tick
// --------------------------------------------------
void CT10_WS_begin() {
    CT10_WS_applyPolicyFromSystem();

    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        s_lastSendMs[v_i] = 0;
        s_pending[v_i]    = false;
    }

    s_lastCleanupMs     = 0;
    s_lastPolicyApplyMs = millis();

    CL_D10_Logger::log(
        EN_L10_LOG_INFO,
        "[CT10][WS] Scheduler begin: itv(state=%u metrics=%u chart=%u summary=%u) cleanup=%u",
        (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_STATE],
        (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_METRICS],
        (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_CHART],
        (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_SUMMARY],
        (unsigned)s_cleanupMs
    );
}

// --------------------------------------------------
// 채널별 dirty 소비 → pending 적립
// --------------------------------------------------
static void CT10_WS_collectPending(CL_CT10_ControlManager& p_ctrl) {
    if (p_ctrl.consumeDirtyState())   s_pending[(uint8_t)EN_A20_WS_CH_STATE]   = true;
    if (p_ctrl.consumeDirtyMetrics()) s_pending[(uint8_t)EN_A20_WS_CH_METRICS] = true;
    if (p_ctrl.consumeDirtyChart())   s_pending[(uint8_t)EN_A20_WS_CH_CHART]   = true;
    if (p_ctrl.consumeDirtySummary()) s_pending[(uint8_t)EN_A20_WS_CH_SUMMARY] = true;
}

// --------------------------------------------------
// payload 크기 측정
// --------------------------------------------------
static uint32_t CT10_WS_measurePayloadBytes(JsonDocument& p_doc) {
    return (uint32_t)measureJson(p_doc);
}

// --------------------------------------------------
// 채널 1회 전송 시도 (스로틀 + pending 해소)
// --------------------------------------------------
static bool CT10_WS_trySendOne(uint8_t p_ch, uint32_t p_nowMs) {
    if (p_ch >= (uint8_t)EN_A20_WS_CH_COUNT) return false;
    if (!s_pending[p_ch]) return false;

    uint16_t v_itv = s_itvMs[p_ch];

    // chart는 payload 크기에 따라 추가 스로틀
    if (p_ch == (uint8_t)EN_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t v_mul = (s_chartThrottleMul > 0) ? (uint32_t)s_chartThrottleMul : 2UL;
        v_itv = (uint16_t)((uint32_t)v_itv * v_mul);
    }

    if ((uint32_t)(p_nowMs - s_lastSendMs[p_ch]) < (uint32_t)v_itv) return false;

    JsonDocument v_doc;

    // ✅ “인스턴스 오타 호출(v_ctrl.toJson)” 금지
    // ✅ static wrapper(toJsonxxx)만 사용
    if (p_ch == (uint8_t)EN_A20_WS_CH_STATE) {
        CL_CT10_ControlManager::toJson(v_doc);
        if (s_bcast_state) s_bcast_state(v_doc, true);
    } else if (p_ch == (uint8_t)EN_A20_WS_CH_METRICS) {
        CL_CT10_ControlManager::toMetricsJson(v_doc);
        if (s_bcast_metrics) s_bcast_metrics(v_doc, true);
    } else if (p_ch == (uint8_t)EN_A20_WS_CH_CHART) {
        CL_CT10_ControlManager::toChartJson(v_doc, true);
        s_chartLastPayload = CT10_WS_measurePayloadBytes(v_doc);
        if (s_bcast_chart) s_bcast_chart(v_doc, true);
    } else { // summary
        CL_CT10_ControlManager::toSummaryJson(v_doc);
        if (s_bcast_summary) s_bcast_summary(v_doc, true);
    }

    s_lastSendMs[p_ch] = p_nowMs;
    s_pending[p_ch]    = false;
    return true;
}

// --------------------------------------------------
// tick
// --------------------------------------------------
void CT10_WS_tick() {
    if (!s_bcast_state || !s_bcast_metrics || !s_bcast_chart || !s_bcast_summary) {
        return; // broker 미바인딩
    }

    uint32_t v_nowMs = millis();

    // (권장) 정책 변경 반영: 3초마다 1회 재적용 (가벼운 복사)
    if ((uint32_t)(v_nowMs - s_lastPolicyApplyMs) >= 3000UL) {
        s_lastPolicyApplyMs = v_nowMs;
        CT10_WS_applyPolicyFromSystem();
    }

    // 1) dirty → pending 적립
    CL_CT10_ControlManager& v_ctrl = CL_CT10_ControlManager::instance();
    CT10_WS_collectPending(v_ctrl);

    // 2) 우선순위대로 "최대 1개"만 전송
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        uint8_t v_ch = s_prio[v_i];
        if (CT10_WS_trySendOne(v_ch, v_nowMs)) break;
    }

    // 3) cleanupClients 주기 호출
    if (s_ws_cleanup && ((uint32_t)(v_nowMs - s_lastCleanupMs) >= (uint32_t)s_cleanupMs)) {
        s_lastCleanupMs = v_nowMs;
        s_ws_cleanup();
    }
}

// --------------------------------------------------
// Dirty flags
// --------------------------------------------------
void CL_CT10_ControlManager::markDirty(const char* p_key) {
    if (!p_key || p_key[0] == '\0') return;

    if (strcmp(p_key, "state") == 0) {
        _dirtyState = true;
    } else if (strcmp(p_key, "chart") == 0) {
        _dirtyChart = true;
    } else if (strcmp(p_key, "metrics") == 0) {
        _dirtyMetrics = true;
    } else if (strcmp(p_key, "summary") == 0) {
        _dirtySummary = true;
    } else {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] markDirty: unknown key=%s", p_key);
    }
}

bool CL_CT10_ControlManager::consumeDirtyState() {
    bool v_ret = _dirtyState;
    _dirtyState = false;
    return v_ret;
}

bool CL_CT10_ControlManager::consumeDirtyMetrics() {
    bool v_ret = _dirtyMetrics;
    _dirtyMetrics = false;
    return v_ret;
}

bool CL_CT10_ControlManager::consumeDirtyChart() {
    bool v_ret = _dirtyChart;
    _dirtyChart = false;
    return v_ret;
}

bool CL_CT10_ControlManager::consumeDirtySummary() {
    bool v_ret = _dirtySummary;
    _dirtySummary = false;
    return v_ret;
}

// --------------------------------------------------
// metrics dirty push
// --------------------------------------------------
void CL_CT10_ControlManager::maybePushMetricsDirty() {
    unsigned long v_nowMs = millis();
    if ((uint32_t)(v_nowMs - lastMetricsPushMs) < (uint32_t)S_METRICS_PUSH_INTERVAL_MS) return;

    lastMetricsPushMs = v_nowMs;
    markDirty("metrics");
}

