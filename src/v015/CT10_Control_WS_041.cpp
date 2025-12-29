/*    
 * ------------------------------------------------------    
 * 소스명 : CT10_Control_WS_041.cpp    
 * 모듈약어 : CT10    
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, WS Scheduler + Broker 통합)    
 * ------------------------------------------------------    
 * 기능 요약:    
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)    
 * - 전송 스로틀 + pending 플래그 (필수/즉효)    
 * - priorityOrder[4] 정책 기반 우선순위 전송    
 * - payload 크기 측정(measureJson) → chart 대형이면 자동 강스로틀    
 * - W10 cleanupClients 주기 호출(권장)    
 * - W10 setWsIntervals(setter)로 CT10 policy.itv 반영(통합)    
 * - W10 브로커(브로드캐스트/cleanup/setIntervals) 바인딩 포함(현재 파일 통합 유지)    
 * ------------------------------------------------------    
 */    

#include "CT10_Control_040.h"
#include "W10_Web_050.h"
#include "A20_Const_040.h"

// --------------------------------------------------
// Broker 함수 포인터 (CT10_WS_bindToW10 또는 외부 setBrokers로 주입)
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

static uint32_t s_lastCleanupMs = 0;

// 기본 인터벌 (fallback) - 실제는 system.webSocket 정책으로 덮어씀
static uint16_t s_itvMs[G_A20_WS_CH_COUNT] = {
    G_A20_WS_DEFAULT_ITV_STATE_MS,
    G_A20_WS_DEFAULT_ITV_METRICS_MS,
    G_A20_WS_DEFAULT_ITV_CHART_MS,
    G_A20_WS_DEFAULT_ITV_SUMMARY_MS
};

// cleanup interval (fallback) - 실제는 system.webSocket.wsCleanupMs로 덮어씀
static uint16_t s_cleanupMs = G_A20_WS_DEFAULT_CLEANUP_MS;

// priority order (0~3 채널 인덱스)
static uint8_t s_prio[G_A20_WS_CH_COUNT] = {
    G_A20_WS_CH_STATE,
    G_A20_WS_CH_METRICS,
    G_A20_WS_CH_CHART,
    G_A20_WS_CH_SUMMARY
};

// chart payload 기반 강스로틀 정책
static uint16_t s_chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES; // 이 이상이면 "대형"
static uint8_t  s_chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL; // 대형일 때 chart itv * mul
static uint32_t s_chartLastPayload = 0;

// --------------------------------------------------
// 외부에 노출되는 Broker 주입 API
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
// W10 브로커 기본 바인딩 (현재 파일 통합 유지)
// --------------------------------------------------
static void CT10_broadcastState(JsonDocument& p_doc, bool p_diffOnly) {
    CL_W10_WebAPI::broadcastState(p_doc, p_diffOnly);
}
static void CT10_broadcastMetrics(JsonDocument& p_doc, bool p_diffOnly) {
    CL_W10_WebAPI::broadcastMetrics(p_doc, p_diffOnly);
}
static void CT10_broadcastChart(JsonDocument& p_doc, bool p_diffOnly) {
    CL_W10_WebAPI::broadcastChart(p_doc, p_diffOnly);
}
static void CT10_broadcastSummary(JsonDocument& p_doc, bool p_diffOnly) {
    CL_W10_WebAPI::broadcastSummary(p_doc, p_diffOnly);
}
static void CT10_wsCleanup() {
    CL_W10_WebAPI::wsCleanupTick();
}
static void CT10_setWsIntervals(const uint16_t p_itvMs[G_A20_WS_CH_COUNT]) {
    CL_W10_WebAPI::setWsIntervals(p_itvMs);
}

void CT10_WS_bindToW10() {
    CT10_WS_setBrokers(
        CT10_broadcastState,
        CT10_broadcastMetrics,
        CT10_broadcastChart,
        CT10_broadcastSummary,
        CT10_wsCleanup,
        CT10_setWsIntervals
    );
}

// --------------------------------------------------
// policy 로드: system.webSocket → s_itvMs / priority / chart 정책 / cleanupMs
// --------------------------------------------------
static void CT10_WS_applyPolicyFromSystem() {
    if (!g_A20_config_root.system) return;

    const ST_A20_SystemConfig_t& v_sys = *g_A20_config_root.system;
    const ST_A20_WebSocketConfig_t& v_ws = v_sys.system.webSocket;

    // intervals
    for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
        uint16_t v = v_ws.wsIntervalMs[i];
        if (v > 0) s_itvMs[i] = v;
    }

    // priority order
    for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
        uint8_t v = v_ws.wsPriority[i];
        if (v < G_A20_WS_CH_COUNT) s_prio[i] = v;
    }

    // chart payload policy
    if (v_ws.chartLargeBytes > 0)  s_chartLargeBytes  = v_ws.chartLargeBytes;
    if (v_ws.chartThrottleMul > 0) s_chartThrottleMul = v_ws.chartThrottleMul;

    // cleanup tick (고정 제거)
    if (v_ws.wsCleanupMs > 0) s_cleanupMs = v_ws.wsCleanupMs;

    // W10 setter로도 전달(통합 요구사항)
    if (s_setIntervals) s_setIntervals(s_itvMs);
}

// --------------------------------------------------
// begin
// --------------------------------------------------
void CT10_WS_begin() {
    // fallback defaults (A20 default 사용)
    s_itvMs[G_A20_WS_CH_STATE]   = G_A20_WS_DEFAULT_ITV_STATE_MS;
    s_itvMs[G_A20_WS_CH_METRICS] = G_A20_WS_DEFAULT_ITV_METRICS_MS;
    s_itvMs[G_A20_WS_CH_CHART]   = G_A20_WS_DEFAULT_ITV_CHART_MS;
    s_itvMs[G_A20_WS_CH_SUMMARY] = G_A20_WS_DEFAULT_ITV_SUMMARY_MS;

    s_prio[0] = G_A20_WS_CH_STATE;
    s_prio[1] = G_A20_WS_CH_METRICS;
    s_prio[2] = G_A20_WS_CH_CHART;
    s_prio[3] = G_A20_WS_CH_SUMMARY;

    s_chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES;
    s_chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL;
    s_cleanupMs        = G_A20_WS_DEFAULT_CLEANUP_MS;

    // policy 반영(있으면 override)
    CT10_WS_applyPolicyFromSystem();

    for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
        s_lastSendMs[i] = 0;
        s_pending[i]    = false;
    }
    s_lastCleanupMs = 0;

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
// payload 크기 측정 (chart는 특히 중요)
// --------------------------------------------------
static uint32_t CT10_WS_measurePayloadBytes(JsonDocument& p_doc) {
    return (uint32_t)measureJson(p_doc);
}

// --------------------------------------------------
// 채널 1회 전송 시도 (스로틀 + pending 해소)
// --------------------------------------------------
static bool CT10_WS_trySendOne(uint8_t p_ch, uint32_t p_nowMs, CL_CT10_ControlManager& p_ctrl) {
    if (p_ch >= G_A20_WS_CH_COUNT) return false;
    if (!s_pending[p_ch]) return false;

    uint16_t v_itv = s_itvMs[p_ch];

    // chart는 payload 크기에 따라 추가 스로틀
    if (p_ch == G_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t v_mul = (s_chartThrottleMul > 0) ? (uint32_t)s_chartThrottleMul : 2UL;
        v_itv = (uint16_t)((uint32_t)v_itv * v_mul);
    }

    if ((p_nowMs - s_lastSendMs[p_ch]) < v_itv) return false;

    // 전송 준비
    JsonDocument v_doc;

    if (p_ch == G_A20_WS_CH_STATE) {
        p_ctrl.toJson(v_doc);
        if (s_bcast_state) s_bcast_state(v_doc, true);

    } else if (p_ch == G_A20_WS_CH_METRICS) {
        p_ctrl.toMetricsJson(v_doc);
        if (s_bcast_metrics) s_bcast_metrics(v_doc, true);

    } else if (p_ch == G_A20_WS_CH_CHART) {
        p_ctrl.toChartJson(v_doc, true);

        // payload bytes 측정
        s_chartLastPayload = CT10_WS_measurePayloadBytes(v_doc);

        if (s_bcast_chart) s_bcast_chart(v_doc, true);

    } else { // summary
        p_ctrl.toSummaryJson(v_doc);
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
    // 브로커 바인딩 전이면 아무것도 하지 않음
    if (!s_bcast_state || !s_bcast_metrics || !s_bcast_chart || !s_bcast_summary) return;

    uint32_t v_nowMs = millis();

    CL_CT10_ControlManager& v_ctrl = CL_CT10_ControlManager::instance();

    // 1) dirty → pending 적립
    CT10_WS_collectPending(v_ctrl);

    // 2) 우선순위대로 "최대 1개"만 전송 (큐 폭주 방지)
    for (uint8_t i = 0; i < G_A20_WS_CH_COUNT; i++) {
        uint8_t v_ch = s_prio[i];
        if (CT10_WS_trySendOne(v_ch, v_nowMs, v_ctrl)) break;
    }

    // 3) cleanupClients 주기 호출 (config 반영)
    if (s_ws_cleanup && ((v_nowMs - s_lastCleanupMs) >= (uint32_t)s_cleanupMs)) {
        s_lastCleanupMs = v_nowMs;
        s_ws_cleanup();
    }
}
