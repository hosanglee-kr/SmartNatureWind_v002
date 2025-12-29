/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_WS_043.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, WS Scheduler)
 * ------------------------------------------------------
 * 기능 요약:
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)
 * - 전송 스로틀 + pending 플래그 (필수/즉효)
 * - priorityOrder[4] 정책 기반 우선순위 전송
 * - payload 크기 측정(measureJson) → chart 대형이면 자동 강스로틀
 * - W10 cleanupClients 주기 호출(권장)
 * - W10 setWsIntervals(setter)로 CT10 policy.itv 반영(통합)
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

#include "CT10_Control_041.h"


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
static void (*s_setIntervals)(const uint16_t p_itvMs[G_A20_WS_CH_COUNT]) = nullptr;

// --------------------------------------------------
// 내부 상태
// --------------------------------------------------
static uint32_t s_lastSendMs[G_A20_WS_CH_COUNT] = {0, 0, 0, 0};
static bool     s_pending[G_A20_WS_CH_COUNT]    = {false, false, false, false};

static uint32_t s_lastCleanupMs    = 0;
static uint32_t s_lastPolicyApplyMs = 0; // (권장) 런타임 정책 재적용 가드

// 기본 인터벌(ms) (fallback) - 실제는 system.webSocket 정책으로 덮어씀
static uint16_t s_itvMs[G_A20_WS_CH_COUNT] = {
    G_A20_WS_DEFAULT_ITV_STATE_MS,
    G_A20_WS_DEFAULT_ITV_METRICS_MS,
    G_A20_WS_DEFAULT_ITV_CHART_MS,
    G_A20_WS_DEFAULT_ITV_SUMMARY_MS
};

// priority order (0~3 채널 인덱스)
static uint8_t s_prio[G_A20_WS_CH_COUNT] = {
    G_A20_WS_CH_STATE,
    G_A20_WS_CH_METRICS,
    G_A20_WS_CH_CHART,
    G_A20_WS_CH_SUMMARY
};

// chart payload 기반 강스로틀 정책
static uint16_t s_chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES;
static uint8_t  s_chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL;
static uint32_t s_chartLastPayload = 0;

// cleanupClients 호출 주기
static uint16_t s_cleanupMs = G_A20_WS_DEFAULT_CLEANUP_MS;

// --------------------------------------------------
// 브로커 주입 API (CT10_Control_WS_Broker_xxx.cpp에서 호출)
// --------------------------------------------------
void CT10_WS_setBrokers(
    void (*p_state)(JsonDocument&, bool),
    void (*p_metrics)(JsonDocument&, bool),
    void (*p_chart)(JsonDocument&, bool),
    void (*p_summary)(JsonDocument&, bool),
    void (*p_cleanup)(),
    void (*p_setIntervalsFn)(const uint16_t p_itvMs[G_A20_WS_CH_COUNT])
) {
    s_bcast_state   = p_state;
    s_bcast_metrics = p_metrics;
    s_bcast_chart   = p_chart;
    s_bcast_summary = p_summary;
    s_ws_cleanup    = p_cleanup;
    s_setIntervals  = p_setIntervalsFn;
}

// --------------------------------------------------
// priority 정규화: 중복 제거 + 누락 채움(운영급 방어)
// --------------------------------------------------
/*
static void CT10_WS_fillDefaultPriority(uint8_t p_out[G_A20_WS_CH_COUNT]) {
    p_out[0] = G_A20_WS_CH_STATE;
    p_out[1] = G_A20_WS_CH_METRICS;
    p_out[2] = G_A20_WS_CH_CHART;
    p_out[3] = G_A20_WS_CH_SUMMARY;
}
*/

static void CT10_WS_normalizePriority(
    const uint8_t p_in[G_A20_WS_CH_COUNT],
    uint8_t       p_out[G_A20_WS_CH_COUNT]
) {
    bool v_used[G_A20_WS_CH_COUNT] = {false,false,false,false};
    uint8_t v_w = 0;

    // 1) 유효 + 미사용만 순서 유지
    for (uint8_t i = 0; i < G_A20_WS_CH_COUNT && v_w < G_A20_WS_CH_COUNT; i++) {
        uint8_t ch = p_in[i];
        if (ch >= G_A20_WS_CH_COUNT) continue;
        if (v_used[ch]) continue;
        p_out[v_w++] = ch;
        v_used[ch] = true;
    }

    // 2) 누락 채우기
    for (uint8_t ch = 0; ch < G_A20_WS_CH_COUNT && v_w < G_A20_WS_CH_COUNT; ch++) {
        if (!v_used[ch]) {
            p_out[v_w++] = ch;
            v_used[ch] = true;
        }
    }
}





/*
static void CT10_WS_normalizePriority(const uint8_t p_in[G_A20_WS_CH_COUNT], uint8_t p_out[G_A20_WS_CH_COUNT]) {
    bool v_used[G_A20_WS_CH_COUNT];
    memset(v_used, 0, sizeof(v_used));

    uint8_t v_w = 0;

    // 1) 유효 + 미사용만 순서대로 반영
    for (uint8_t v_i = 0; v_i < G_A20_WS_CH_COUNT && v_w < G_A20_WS_CH_COUNT; v_i++) {
        uint8_t v_ch = p_in[v_i];
        if (v_ch >= G_A20_WS_CH_COUNT) continue;
        if (v_used[v_ch]) continue;
        p_out[v_w++] = v_ch;
        v_used[v_ch] = true;
    }

    // 2) 누락은 기본 순서로 채움
    uint8_t v_def[G_A20_WS_CH_COUNT];
    CT10_WS_fillDefaultPriority(v_def);

    for (uint8_t v_i = 0; v_i < G_A20_WS_CH_COUNT && v_w < G_A20_WS_CH_COUNT; v_i++) {
        uint8_t v_ch = v_def[v_i];
        if (v_used[v_ch]) continue;
        p_out[v_w++] = v_ch;
        v_used[v_ch] = true;
    }
}
*/


static uint16_t s_lastAppliedItv[G_A20_WS_CH_COUNT] = {0,0,0,0};

static bool CT10_WS_intervalsChanged() {
    for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
        if (s_lastAppliedItv[i] != s_itvMs[i]) return true;
    }
    return false;
}



// --------------------------------------------------
// policy 로드: system.webSocket → s_itvMs / priority / chart 정책 / cleanupMs
// --------------------------------------------------
static void CT10_WS_applyPolicyFromSystem() {
    if (!g_A20_config_root.system) return;

    const ST_A20_SystemConfig_t&     v_sys = *g_A20_config_root.system;
    const ST_A20_WebSocketConfig_t&  v_ws  = v_sys.system.webSocket;

    // intervals
    for (uint8_t v_i = 0; v_i < G_A20_WS_CH_COUNT; v_i++) {
        uint16_t v_itv = v_ws.wsIntervalMs[v_i];
        if (v_itv > 0) s_itvMs[v_i] = v_itv;
    }

    // priority order (normalize)
    {
        uint8_t v_tmp[G_A20_WS_CH_COUNT];
        for (uint8_t v_i = 0; v_i < G_A20_WS_CH_COUNT; v_i++) {
            v_tmp[v_i] = v_ws.wsPriority[v_i];
        }

		CT10_WS_normalizePriority(v_tmp, s_prio);

        // CT10_WS_normalizePriority(v_tmp, s_prio);
    }

    // chart payload policy
    if (v_ws.chartLargeBytes > 0)  s_chartLargeBytes  = v_ws.chartLargeBytes;
    if (v_ws.chartThrottleMul > 0) s_chartThrottleMul = v_ws.chartThrottleMul;

    // cleanup tick
    if (v_ws.wsCleanupMs > 0) s_cleanupMs = v_ws.wsCleanupMs;

    // W10 setter로도 전달(통합 요구사항)
    // if (s_setIntervals) s_setIntervals(s_itvMs);

	if (CT10_WS_intervalsChanged() && s_setIntervals) {
		s_setIntervals(s_itvMs);
		for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
			s_lastAppliedItv[i] = s_itvMs[i];
		}

		CL_D10_Logger::log(
			EN_L10_LOG_INFO,
			"[CT10][WS] policy applied: itv(%u/%u/%u/%u) prio(%u,%u,%u,%u) chart(%u,mul=%u) cleanup=%u",
			(unsigned)s_itvMs[G_A20_WS_CH_STATE],
			(unsigned)s_itvMs[G_A20_WS_CH_METRICS],
			(unsigned)s_itvMs[G_A20_WS_CH_CHART],
			(unsigned)s_itvMs[G_A20_WS_CH_SUMMARY],
			(unsigned)s_prio[0], (unsigned)s_prio[1], (unsigned)s_prio[2], (unsigned)s_prio[3],
			(unsigned)s_chartLargeBytes, (unsigned)s_chartThrottleMul,
			(unsigned)s_cleanupMs
		);

	}


}

// --------------------------------------------------
// begin/tick
// --------------------------------------------------
void CT10_WS_begin() {
    CT10_WS_applyPolicyFromSystem();

    for (uint8_t v_i = 0; v_i < G_A20_WS_CH_COUNT; v_i++) {
        s_lastSendMs[v_i] = 0;
        s_pending[v_i]    = false;
    }

    s_lastCleanupMs     = 0;
    s_lastPolicyApplyMs = millis();

	for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
		s_lastAppliedItv[i] = s_itvMs[i];
	}

    CL_D10_Logger::log(
        EN_L10_LOG_INFO,
        "[CT10][WS] Scheduler begin: itv(state=%u metrics=%u chart=%u summary=%u) cleanup=%u",
        (unsigned)s_itvMs[G_A20_WS_CH_STATE],
        (unsigned)s_itvMs[G_A20_WS_CH_METRICS],
        (unsigned)s_itvMs[G_A20_WS_CH_CHART],
        (unsigned)s_itvMs[G_A20_WS_CH_SUMMARY],
        (unsigned)s_cleanupMs
    );
}

// --------------------------------------------------
// 채널별 dirty 소비 → pending 적립
// --------------------------------------------------
static void CT10_WS_collectPending(CL_CT10_ControlManager& p_ctrl) {
    if (p_ctrl.consumeDirtyState())   s_pending[G_A20_WS_CH_STATE]   = true;
    if (p_ctrl.consumeDirtyMetrics()) s_pending[G_A20_WS_CH_METRICS] = true;
    if (p_ctrl.consumeDirtyChart())   s_pending[G_A20_WS_CH_CHART]   = true;
    if (p_ctrl.consumeDirtySummary()) s_pending[G_A20_WS_CH_SUMMARY] = true;
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
    if (p_ch >= G_A20_WS_CH_COUNT) return false;
    if (!s_pending[p_ch]) return false;

    uint16_t v_itv = s_itvMs[p_ch];

    // chart는 payload 크기에 따라 추가 스로틀
    if (p_ch == G_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t v_mul = (s_chartThrottleMul > 0) ? s_chartThrottleMul : 2;
        v_itv = (uint16_t)((uint32_t)v_itv * v_mul);
    }

    if (p_nowMs - s_lastSendMs[p_ch] < v_itv) return false;

    JsonDocument v_doc;

    // ✅ “인스턴스 오타 호출(v_ctrl.toJson)” 금지
    // ✅ static wrapper(toJsonxxx)만 사용
    if (p_ch == G_A20_WS_CH_STATE) {
        CL_CT10_ControlManager::toJson(v_doc);
        if (s_bcast_state) s_bcast_state(v_doc, true);
    } else if (p_ch == G_A20_WS_CH_METRICS) {
        CL_CT10_ControlManager::toMetricsJson(v_doc);
        if (s_bcast_metrics) s_bcast_metrics(v_doc, true);
    } else if (p_ch == G_A20_WS_CH_CHART) {
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
    if (v_nowMs - s_lastPolicyApplyMs >= 3000UL) {
        s_lastPolicyApplyMs = v_nowMs;
        CT10_WS_applyPolicyFromSystem();
    }

    // 1) dirty → pending 적립
    CL_CT10_ControlManager& v_ctrl = CL_CT10_ControlManager::instance();
    CT10_WS_collectPending(v_ctrl);

    // 2) 우선순위대로 "최대 1개"만 전송
    for (uint8_t v_i = 0; v_i < G_A20_WS_CH_COUNT; v_i++) {
        uint8_t v_ch = s_prio[v_i];
        if (CT10_WS_trySendOne(v_ch, v_nowMs)) break;
    }

    // 3) cleanupClients 주기 호출
    if (s_ws_cleanup && (v_nowMs - s_lastCleanupMs >= (uint32_t)s_cleanupMs)) {
        s_lastCleanupMs = v_nowMs;
        s_ws_cleanup();
    }
}

