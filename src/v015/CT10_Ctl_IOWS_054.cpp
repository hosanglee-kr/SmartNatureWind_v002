/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_IOWS_054.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (WS Scheduler + IO 통합)
 *      CT10_Ctl_WS_051.cpp + CT10_Ctl_IO_053.cpp 통합
 * ------------------------------------------------------
 * 기능 요약:
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)
 * - 전송 스로틀 + pending 플래그 (필수/즉효)
 * - 정책 기반 우선순위 전송 (wsChConfig[].priority → order 산출)
 * - payload 크기 측정(measureJson) → chart 대형이면 자동 강스로틀
 * - W10 cleanupClients 주기 호출(권장)
 * - CT10 제어 상태 / 요약 / 메트릭 / 차트 JSON Export 구현
 * - sim JSON/차트는 S10 책임을 우선하고 CT10은 meta만 병합
 * ------------------------------------------------------

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

#include "CT10_Ctl_051.h"
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

static bool CT10_WS_trySendOne_v03(uint8_t p_ch, uint32_t p_nowMs) {
    if (p_ch >= (uint8_t)EN_A20_WS_CH_COUNT) return false;
    if (!s_pending[p_ch]) return false;

    uint16_t v_itv = s_itvMs[p_ch];

    // chart는 payload 크기에 따라 추가 스로틀
    if (p_ch == (uint8_t)EN_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t v_mul = (s_chartThrottleMul > 0) ? (uint32_t)s_chartThrottleMul : 2UL;
        v_itv = (uint16_t)((uint32_t)v_itv * v_mul);
    }

    if ((uint32_t)(p_nowMs - s_lastSendMs[p_ch]) < (uint32_t)v_itv) return false;

    // 채널별 static JsonDocument 재사용
    static JsonDocument s_doc_state;
    static JsonDocument s_doc_metrics;
    static JsonDocument s_doc_chart;
    static JsonDocument s_doc_summary;

    bool v_sent = false;

    switch ((EN_A20_WS_CH_INDEX_t)p_ch) {
        case EN_A20_WS_CH_STATE: {
            s_doc_state.clear();
            CL_CT10_ControlManager::toStateJson(s_doc_state);
            if (s_bcast_state) s_bcast_state(s_doc_state, true);
            v_sent = true;
        } break;

        case EN_A20_WS_CH_METRICS: {
            s_doc_metrics.clear();
            CL_CT10_ControlManager::toMetricsJson(s_doc_metrics);
            if (s_bcast_metrics) s_bcast_metrics(s_doc_metrics, true);
            v_sent = true;
        } break;

        case EN_A20_WS_CH_CHART: {
            s_doc_chart.clear();
            CL_CT10_ControlManager::toChartJson(s_doc_chart, true);
            s_chartLastPayload = CT10_WS_measurePayloadBytes(s_doc_chart);
            if (s_bcast_chart) s_bcast_chart(s_doc_chart, true);
            v_sent = true;
        } break;

        case EN_A20_WS_CH_SUMMARY: {
            s_doc_summary.clear();
            CL_CT10_ControlManager::toSummaryJson(s_doc_summary);
            if (s_bcast_summary) s_bcast_summary(s_doc_summary, true);
            v_sent = true;
        } break;

        default:
            return false;
    }

    if (!v_sent) return false;

    s_lastSendMs[p_ch] = p_nowMs;
    s_pending[p_ch]    = false;
    return true;
}



static bool CT10_WS_trySendOne_v02(uint8_t p_ch, uint32_t p_nowMs) {
    if (p_ch >= (uint8_t)EN_A20_WS_CH_COUNT) return false;
    if (!s_pending[p_ch]) return false;

    uint16_t v_itv = s_itvMs[p_ch];

    // chart는 payload 크기에 따라 추가 스로틀
    if (p_ch == (uint8_t)EN_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t v_mul = (s_chartThrottleMul > 0) ? (uint32_t)s_chartThrottleMul : 2UL;
        v_itv = (uint16_t)((uint32_t)v_itv * v_mul);
    }

    if ((uint32_t)(p_nowMs - s_lastSendMs[p_ch]) < (uint32_t)v_itv) return false;

    // --------------------------------------------------
    // [PATCH] 채널별 static JsonDocument 재사용
    // - clear() 후 재사용
    // --------------------------------------------------
    static JsonDocument s_doc_state;
    static JsonDocument s_doc_metrics;
    static JsonDocument s_doc_chart;
    static JsonDocument s_doc_summary;

    JsonDocument* v_doc = nullptr;
    if (p_ch == (uint8_t)EN_A20_WS_CH_STATE) {
        v_doc = &s_doc_state;
    } else if (p_ch == (uint8_t)EN_A20_WS_CH_METRICS) {
        v_doc = &s_doc_metrics;
    } else if (p_ch == (uint8_t)EN_A20_WS_CH_CHART) {
        v_doc = &s_doc_chart;
    } else { // summary
        v_doc = &s_doc_summary;
    }

    if (!v_doc) return false;
    v_doc->clear();

    // “인스턴스 오타 호출(v_ctrl.toJson)” 금지
    // static wrapper(toJsonxxx)만 사용
    if (p_ch == (uint8_t)EN_A20_WS_CH_STATE) {
        CL_CT10_ControlManager::toStateJson(*v_doc);
        if (s_bcast_state) s_bcast_state(*v_doc, true);
    } else if (p_ch == (uint8_t)EN_A20_WS_CH_METRICS) {
        CL_CT10_ControlManager::toMetricsJson(*v_doc);
        if (s_bcast_metrics) s_bcast_metrics(*v_doc, true);
    } else if (p_ch == (uint8_t)EN_A20_WS_CH_CHART) {
        CL_CT10_ControlManager::toChartJson(*v_doc, true);
        s_chartLastPayload = CT10_WS_measurePayloadBytes(*v_doc);
        if (s_bcast_chart) s_bcast_chart(*v_doc, true);
    } else { // summary
        CL_CT10_ControlManager::toSummaryJson(*v_doc);
        if (s_bcast_summary) s_bcast_summary(*v_doc, true);
    }

    s_lastSendMs[p_ch] = p_nowMs;
    s_pending[p_ch]    = false;
    return true;
}


/*
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

    // “인스턴스 오타 호출(v_ctrl.toJson)” 금지
    // static wrapper(toJsonxxx)만 사용
    if (p_ch == (uint8_t)EN_A20_WS_CH_STATE) {
        CL_CT10_ControlManager::toStateJson(v_doc);
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
*/
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
        if (CT10_WS_trySendOne_v03(v_ch, v_nowMs)) break;
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



/*
 * ------------------------------------------------------
 * 예전소스명 : CT10_Ctl_IO_053.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, IO)
 * ------------------------------------------------------
 * 기능 요약:
 * - CT10 제어 상태 / 요약 / 메트릭 / 차트 JSON Export 구현
 * - sim JSON/차트는 S10 책임을 우선하고 CT10은 meta만 병합
 * ------------------------------------------------------
 */



// --------------------------------------------------
// 싱글톤
// --------------------------------------------------
CL_CT10_ControlManager& CL_CT10_ControlManager::instance() {
    static CL_CT10_ControlManager v_inst;
    return v_inst;
}

void CL_CT10_ControlManager::toStateJson(JsonDocument& p_doc) {
    instance().exportStateJson_v02(p_doc);
}

void CL_CT10_ControlManager::toChartJson(JsonDocument& p_doc, bool p_diffOnly) {
     instance().exportChartJson(p_doc, p_diffOnly);
}
void CL_CT10_ControlManager::toSummaryJson(JsonDocument& p_doc) {
	instance().exportSummaryJson(p_doc);
}

void CL_CT10_ControlManager::toMetricsJson(JsonDocument& p_doc) {
	instance().exportMetricsJson(p_doc);
}

	
// --------------------------------------------------
// [CT10] exportStateJson_v02()
// - 웹/WS 상태에서 "왜 멈췄는지/무엇이 도는지"가 보이도록 확장
// - JsonDocument 단일 사용, containsKey/createNested* 금지 준수
// --------------------------------------------------
void CL_CT10_ControlManager::exportStateJson_v02(JsonDocument& p_doc) {
    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_ctl  = A40_ComFunc::Json_ensureObject(v_root["control"]);

    // 1) Core flags
    v_ctl["active"]      = active;
    v_ctl["profileMode"] = useProfileMode;

    // 2) State/Reason (string + enum)
    v_ctl["state"]      = CT10_stateToString(runCtx.state);
    v_ctl["reason"]     = CT10_reasonToString(runCtx.reason);
    v_ctl["stateCode"]  = (uint8_t)runCtx.state;
    v_ctl["reasonCode"] = (uint8_t)runCtx.reason;

    v_ctl["runSource"]         = (uint8_t)runSource;
    v_ctl["lastDecisionMs"]    = (uint32_t)runCtx.lastDecisionMs;
    v_ctl["lastStateChangeMs"] = (uint32_t)runCtx.lastStateChangeMs;

    // 2-1) Event hold/ack (UI-friendly)
    {
        JsonObject v_evt = A40_ComFunc::Json_ensureObject(v_ctl["event"]);

        v_evt["ackRequired"] = runCtx.stateAckRequired;
        v_evt["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

        uint32_t v_now = (uint32_t)millis();
        uint32_t v_remain = 0;
        if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
            v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
        }
        v_evt["holdRemainMs"] = v_remain;
    }

    // 3) Time status (TM10)
    {
        JsonObject v_time = A40_ComFunc::Json_ensureObject(v_ctl["time"]);
        v_time["valid"] = CL_TM10_TimeManager::isTimeValid();

        struct tm v_tm;
        memset(&v_tm, 0, sizeof(v_tm));
        if (CL_TM10_TimeManager::getLocalTime(v_tm)) {
            v_time["hour"] = (int)v_tm.tm_hour;
            v_time["min"]  = (int)v_tm.tm_min;
            v_time["wday"] = (int)v_tm.tm_wday; // 0=Sun
        } else {
            v_time["hour"] = -1;
            v_time["min"]  = -1;
            v_time["wday"] = -1;
        }
    }

    // 4) Schedule snapshot (SSOT: runCtx 중심)
    {
        JsonObject v_sch = A40_ComFunc::Json_ensureObject(v_ctl["schedule"]);
        v_sch["index"] = (int)curScheduleIndex;
        v_sch["schId"] = (uint8_t)runCtx.activeSchId;
        v_sch["schNo"] = (uint16_t)runCtx.activeSchNo;

        const char* v_name = "";
        if (g_A20_config_root.schedules) {
            ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
            for (uint8_t i = 0; i < v_cfg.count; i++) {
                if (v_cfg.items[i].schId == runCtx.activeSchId) {
                    v_name = v_cfg.items[i].name;
                    break;
                }
            }
        }
        v_sch["name"]          = v_name;
        v_sch["fromRunSource"] = (runSource == EN_CT10_RUN_SCHEDULE);
    }

    // 5) Profile snapshot (SSOT)
    {
        JsonObject v_prof = A40_ComFunc::Json_ensureObject(v_ctl["profile"]);
        v_prof["index"]     = (int)curProfileIndex;
        v_prof["profileNo"] = (uint16_t)runCtx.activeProfileNo;

        const char* v_name = "";
        if (g_A20_config_root.userProfiles) {
            ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
            for (uint8_t i = 0; i < v_cfg.count; i++) {
                if (v_cfg.items[i].profileNo == runCtx.activeProfileNo) {
                    v_name = v_cfg.items[i].name;
                    break;
                }
            }
        }
        v_prof["name"]          = v_name;
        v_prof["fromRunSource"] = (runSource == EN_CT10_RUN_USER_PROFILE);
    }

    // 6) Segment runtime snapshot
    {
        JsonObject v_seg = A40_ComFunc::Json_ensureObject(v_ctl["segment"]);
        v_seg["segId"] = (uint8_t)runCtx.activeSegId;
        v_seg["segNo"] = (uint16_t)runCtx.activeSegNo;

        JsonObject v_srt = A40_ComFunc::Json_ensureObject(v_seg["scheduleRt"]);
        v_srt["index"]        = (int)scheduleSegRt.index;
        v_srt["onPhase"]      = scheduleSegRt.onPhase;
        v_srt["phaseStartMs"] = (uint32_t)scheduleSegRt.phaseStartMs;
        v_srt["loopCount"]    = (uint8_t)scheduleSegRt.loopCount;

        JsonObject v_prt = A40_ComFunc::Json_ensureObject(v_seg["profileRt"]);
        v_prt["index"]        = (int)profileSegRt.index;
        v_prt["onPhase"]      = profileSegRt.onPhase;
        v_prt["phaseStartMs"] = (uint32_t)profileSegRt.phaseStartMs;
        v_prt["loopCount"]    = (uint8_t)profileSegRt.loopCount;
    }

    // 7) Override snapshot
    {
        JsonObject v_ov = A40_ComFunc::Json_ensureObject(v_ctl["override"]);
        v_ov["active"]       = overrideState.active;
        v_ov["useFixed"]     = overrideState.useFixed;
        v_ov["remainSec"]    = (uint32_t)calcOverrideRemainSec();
        v_ov["fixedPercent"] = overrideState.fixedPercent;

        if (!overrideState.useFixed && overrideState.resolved.valid) {
            v_ov["presetCode"] = overrideState.resolved.presetCode;
            v_ov["styleCode"]  = overrideState.resolved.styleCode;
        } else {
            v_ov["presetCode"] = "";
            v_ov["styleCode"]  = "";
        }
    }

    // 8) AutoOff runtime snapshot  (autoOffRt만 유지)
    {
        JsonObject v_ao = A40_ComFunc::Json_ensureObject(v_ctl["autoOffRt"]);
        v_ao["timerArmed"]     = autoOffRt.timerArmed;
        v_ao["timerStartMs"]   = (uint32_t)autoOffRt.timerStartMs;
        v_ao["timerMinutes"]   = (uint32_t)autoOffRt.timerMinutes;
        v_ao["offTimeEnabled"] = autoOffRt.offTimeEnabled;
        v_ao["offTimeMinutes"] = (uint16_t)autoOffRt.offTimeMinutes;
        v_ao["offTempEnabled"] = autoOffRt.offTempEnabled;
        v_ao["offTemp"]        = autoOffRt.offTemp;

        v_ao["offTimeLastYday"] = (int)autoOffRt.offTimeLastYday;
        v_ao["offTimeLastMin"]  = (int)autoOffRt.offTimeLastMin;
    }

    // 9) Dirty flags
    {
        JsonObject v_dirty = A40_ComFunc::Json_ensureObject(v_ctl["dirty"]);
        v_dirty["state"]   = _dirtyState;
        v_dirty["metrics"] = _dirtyMetrics;
        v_dirty["chart"]   = _dirtyChart;
        v_dirty["summary"] = _dirtySummary;
    }
}


void CL_CT10_ControlManager::exportStateJson_v01(JsonDocument& p_doc) {
    // control root
    JsonObject v_control = A40_ComFunc::Json_ensureObject(p_doc["control"]);

    v_control["active"]         = active;
    v_control["useProfileMode"] = useProfileMode;
    v_control["runSource"]      = (int)runSource;
    v_control["scheduleIdx"]    = curScheduleIndex;
    v_control["profileIdx"]     = curProfileIndex;

    // runCtx 최소 포함(레거시 UI에서도 원인 표시 가능)
    v_control["state"]      = CT10_stateToString(runCtx.state);
    v_control["reason"]     = CT10_reasonToString(runCtx.reason);
    v_control["stateCode"]  = (uint8_t)runCtx.state;
    v_control["reasonCode"] = (uint8_t)runCtx.reason;

    // snapshot
    {
        JsonObject v_snap = A40_ComFunc::Json_ensureObject(v_control["snapshot"]);
        v_snap["schId"]     = (uint8_t)runCtx.activeSchId;
        v_snap["schNo"]     = (uint16_t)runCtx.activeSchNo;
        v_snap["segId"]     = (uint8_t)runCtx.activeSegId;
        v_snap["segNo"]     = (uint16_t)runCtx.activeSegNo;
        v_snap["profileNo"] = (uint16_t)runCtx.activeProfileNo;
    }

    // time (v01에도 최소)
    {
        JsonObject v_time = A40_ComFunc::Json_ensureObject(v_control["time"]);
        v_time["valid"] = CL_TM10_TimeManager::isTimeValid();
    }

    // override
    {
        JsonObject v_override = A40_ComFunc::Json_ensureObject(v_control["override"]);
        v_override["active"]    = overrideState.active;
        v_override["useFixed"]  = overrideState.useFixed;
        v_override["resolved"]  = (!overrideState.useFixed && overrideState.active);
        v_override["remainSec"] = calcOverrideRemainSec();

        if (overrideState.active) {
            if (overrideState.useFixed) {
                v_override["fixedPercent"] = overrideState.fixedPercent;
            } else if (overrideState.resolved.valid) {
                v_override["presetCode"] = overrideState.resolved.presetCode;
                v_override["styleCode"]  = overrideState.resolved.styleCode;
            }
        }
    }

    // pwm
    v_control["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

    // event (v01 최소)
    {
        JsonObject v_evt = A40_ComFunc::Json_ensureObject(v_control["event"]);
        v_evt["ackRequired"] = runCtx.stateAckRequired;
        v_evt["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

        uint32_t v_now = (uint32_t)millis();
        uint32_t v_remain = 0;
        if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
            v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
        }
        v_evt["holdRemainMs"] = v_remain;
    }

    // autoOffRt (autoOff 제거)
    {
        JsonObject v_ao = A40_ComFunc::Json_ensureObject(v_control["autoOffRt"]);
        v_ao["timerArmed"]     = autoOffRt.timerArmed;
        v_ao["timerStartMs"]   = (uint32_t)autoOffRt.timerStartMs;
        v_ao["timerMinutes"]   = (uint32_t)autoOffRt.timerMinutes;
        v_ao["offTimeEnabled"] = autoOffRt.offTimeEnabled;
        v_ao["offTimeMinutes"] = (uint16_t)autoOffRt.offTimeMinutes;
        v_ao["offTempEnabled"] = autoOffRt.offTempEnabled;
        v_ao["offTemp"]        = autoOffRt.offTemp;

        v_ao["offTimeLastYday"] = (int)autoOffRt.offTimeLastYday;
        v_ao["offTimeLastMin"]  = (int)autoOffRt.offTimeLastMin;
    }

    // sim
    sim.toJson(p_doc);
}


void CL_CT10_ControlManager::exportChartJson(JsonDocument& p_doc, bool p_diffOnly) {
    // 1) S10 차트 생성 (p_doc["sim"] 구조는 S10이 책임)
    sim.toChartJson(p_doc, p_diffOnly);

    // 2) CT10 메타 병합: p_doc["sim"]["meta"] 안전 확보
    JsonObject v_sim  = A40_ComFunc::Json_ensureObject(p_doc["sim"]);
    JsonObject v_meta = A40_ComFunc::Json_ensureObject(v_sim["meta"]);

    v_meta["pwmDuty"]   = pwm ? pwm->P10_getDutyPercent() : 0.0f;
    v_meta["active"]    = active;
    v_meta["runSource"] = (int)runSource;
    v_meta["override"]  = overrideState.active ? (overrideState.useFixed ? "fixed" : "resolved") : "none";

    // runCtx 최소 병합 (차트에서도 "왜/무엇" 표시)
    {
        JsonObject v_ctx = A40_ComFunc::Json_ensureObject(v_meta["ctx"]);

        v_ctx["state"]      = CT10_stateToString(runCtx.state);
        v_ctx["reason"]     = CT10_reasonToString(runCtx.reason);
        v_ctx["stateCode"]  = (uint8_t)runCtx.state;
        v_ctx["reasonCode"] = (uint8_t)runCtx.reason;

        // snapshot 최소
        v_ctx["schNo"]     = (uint16_t)runCtx.activeSchNo;
        v_ctx["profileNo"] = (uint16_t)runCtx.activeProfileNo;
        v_ctx["segNo"]     = (uint16_t)runCtx.activeSegNo;
    }
}


void CL_CT10_ControlManager::exportSummaryJson(JsonDocument& p_doc) {
    JsonObject v_sum = A40_ComFunc::Json_ensureObject(p_doc["summary"]);

    v_sum["state"]  = CT10_stateToString(runCtx.state);
    v_sum["reason"] = CT10_reasonToString(runCtx.reason);

    v_sum["schNo"]     = (uint16_t)runCtx.activeSchNo;
    v_sum["profileNo"] = (uint16_t)runCtx.activeProfileNo;
    v_sum["segNo"]     = (uint16_t)runCtx.activeSegNo;

    uint8_t v_phaseIdx = static_cast<uint8_t>(sim.phase);
    if (v_phaseIdx >= EN_A20_WIND_PHASE_COUNT) {
        v_phaseIdx = static_cast<uint8_t>(EN_A20_WIND_PHASE_CALM);
    }

    v_sum["phase"]      = G_A20_WindPhase_Arr[v_phaseIdx].code;
    v_sum["wind"]       = sim.currentWindSpeed;
    v_sum["target"]     = sim.targetWindSpeed;
    v_sum["pwmDuty"]    = pwm ? pwm->P10_getDutyPercent() : 0.0f;
    v_sum["override"]   = overrideState.active;
    v_sum["useProfile"] = useProfileMode;

    v_sum["scheduleIdx"] = curScheduleIndex;
    v_sum["profileIdx"]  = curProfileIndex;
}

void CL_CT10_ControlManager::exportMetricsJson(JsonDocument& p_doc) {
    JsonObject v_m = A40_ComFunc::Json_ensureObject(p_doc["metrics"]);

    v_m["active"]         = active;
    v_m["runSource"]      = (int)runSource;
    v_m["useProfileMode"] = useProfileMode;
    v_m["scheduleIdx"]    = curScheduleIndex;
    v_m["profileIdx"]     = curProfileIndex;

    v_m["overrideActive"] = overrideState.active;
    v_m["overrideFixed"]  = overrideState.useFixed;
    v_m["overrideRemain"] = calcOverrideRemainSec();

    v_m["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

    // Sim metrics
    uint8_t v_phaseIdx = static_cast<uint8_t>(sim.phase);
    if (v_phaseIdx >= EN_A20_WIND_PHASE_COUNT) {
        v_phaseIdx = static_cast<uint8_t>(EN_A20_WIND_PHASE_CALM);
    }

    v_m["simActive"]  = sim.active;
    v_m["simPhase"]   = G_A20_WindPhase_Arr[v_phaseIdx].code;
    v_m["simWind"]    = sim.currentWindSpeed;
    v_m["simTarget"]  = sim.targetWindSpeed;
    v_m["simGust"]    = sim.gustActive;
    v_m["simThermal"] = sim.thermalActive;

    // AutoOff metrics
    v_m["autoOffTimerArmed"]   = autoOffRt.timerArmed;
    v_m["autoOffTimerMinutes"] = autoOffRt.timerMinutes;
    v_m["autoOffOffTime"]      = autoOffRt.offTimeEnabled ? autoOffRt.offTimeMinutes : 0;
    v_m["autoOffOffTemp"]      = autoOffRt.offTempEnabled ? autoOffRt.offTemp : 0.0f;

    // runCtx (상태/원인 + event hold)
    v_m["stateCode"]  = (uint8_t)runCtx.state;
    v_m["reasonCode"] = (uint8_t)runCtx.reason;
    v_m["state"]      = CT10_stateToString(runCtx.state);
    v_m["reason"]     = CT10_reasonToString(runCtx.reason);

    v_m["ackRequired"] = runCtx.stateAckRequired;
    v_m["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

    uint32_t v_now = (uint32_t)millis();
    uint32_t v_remain = 0;
    if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
        v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
    }
    v_m["holdRemainMs"] = v_remain;

    // snapshot 최소
    v_m["activeSchId"]     = (uint8_t)runCtx.activeSchId;
    v_m["activeSchNo"]     = (uint16_t)runCtx.activeSchNo;
    v_m["activeProfileNo"] = (uint8_t)runCtx.activeProfileNo;
    v_m["activeSegId"]     = (uint8_t)runCtx.activeSegId;
    v_m["activeSegNo"]     = (uint16_t)runCtx.activeSegNo;

    // time valid (1회만)
    v_m["timeValid"] = CL_TM10_TimeManager::isTimeValid();
}


