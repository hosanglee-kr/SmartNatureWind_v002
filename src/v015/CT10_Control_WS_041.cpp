/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_WS_041.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, WS Scheduler)
 * ------------------------------------------------------
 * 기능 요약:
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)
 * - 전송 스로틀 + pending 플래그 (필수/즉효)
 * - priorityOrder[4] 정책 기반 우선순위 전송
 * - payload 크기 측정(serializeJson length) → chart 대형이면 자동 강스로틀
 * - W10 cleanupClients 주기 호출(권장)
 * - W10 setWsIntervals(setter)로 CT10 policy.itv 반영(통합)
 * ------------------------------------------------------
 */

/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_WS_Broker_040.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, WS Broker)
 * ------------------------------------------------------
 * 기능 요약:
 * - W10 WebAPI(WebSocket) 브로드캐스트/cleanup/setIntervals 브로커를 CT10 모듈로 이동
 * - CT10 WS Scheduler(CT10_Control_WS_040.cpp)에 W10 브로커 바인딩 제공
 * ------------------------------------------------------
 */

#include "CT10_Control_040.h"
#include "W10_Web_050.h"

// ---- CT10 WS Scheduler API (CT10_Control_WS_040.cpp) ----
void CT10_WS_setBrokers(
    void (*p_state)(JsonDocument&, bool),
    void (*p_metrics)(JsonDocument&, bool),
    void (*p_chart)(JsonDocument&, bool),
    void (*p_summary)(JsonDocument&, bool),
    void (*p_cleanup)(),
    void (*p_setIntervals)(const uint16_t p_itvMs[4])
);

static void CT10_broadcastState(JsonDocument& p_doc, bool p_diffOnly)   { 
  CL_W10_WebAPI::broadcastState(p_doc, p_diffOnly); 
}
static void CT10_broadcastMetrics(JsonDocument& p_doc, bool p_diffOnly) { 
  CL_W10_WebAPI::broadcastMetrics(p_doc, p_diffOnly); 
}
static void CT10_broadcastChart(JsonDocument& p_doc, bool p_diffOnly)   { 
  CL_W10_WebAPI::broadcastChart(p_doc, p_diffOnly); 
}
static void CT10_broadcastSummary(JsonDocument& p_doc, bool p_diffOnly) { 
  CL_W10_WebAPI::broadcastSummary(p_doc, p_diffOnly); 
}

static void CT10_wsCleanup() { 
  CL_W10_WebAPI::wsCleanupTick(); 
}
static void CT10_setWsIntervals(const uint16_t p_itvMs[4]) { 
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
// Broker 함수 포인터 (CT10_WS_bindToW10에서 주입)
// --------------------------------------------------
static void (*s_bcast_state)(JsonDocument&, bool)   = nullptr;
static void (*s_bcast_metrics)(JsonDocument&, bool) = nullptr;
static void (*s_bcast_chart)(JsonDocument&, bool)   = nullptr;
static void (*s_bcast_summary)(JsonDocument&, bool) = nullptr;
static void (*s_ws_cleanup)()                       = nullptr;
static void (*s_setIntervals)(const uint16_t p_itvMs[4]) = nullptr;

void CT10_WS_setBrokers(
    void (*p_state)(JsonDocument&, bool),
    void (*p_metrics)(JsonDocument&, bool),
    void (*p_chart)(JsonDocument&, bool),
    void (*p_summary)(JsonDocument&, bool),
    void (*p_cleanup)(),
    void (*p_setIntervalsFn)(const uint16_t p_itvMs[4])
) {
    s_bcast_state   = p_state;
    s_bcast_metrics = p_metrics;
    s_bcast_chart   = p_chart;
    s_bcast_summary = p_summary;
    s_ws_cleanup    = p_cleanup;
    s_setIntervals  = p_setIntervalsFn;
}

// --------------------------------------------------
// 내부 상태
// --------------------------------------------------
static uint32_t s_lastSendMs[G_WS_CH_COUNT] = {0,0,0,0};
static bool     s_pending[G_WS_CH_COUNT]    = {false,false,false,false};

static uint32_t s_lastCleanupMs = 0;

// 기본 인터벌 (fallback) - 실제는 system.web 정책으로 덮어씀
static uint16_t s_itvMs[G_WS_CH_COUNT] = { 800, 1500, 1200, 1500 };

// priority order (0~3 채널 인덱스)
static uint8_t  s_prio[G_WS_CH_COUNT] = { G_WS_CH_STATE, G_WS_CH_METRICS, G_WS_CH_CHART, G_WS_CH_SUMMARY };

// chart payload 기반 강스로틀 정책
static uint16_t s_chartLargeBytes   = 3500; // 이 이상이면 "대형"으로 간주
static uint8_t  s_chartThrottleMul  = 2;    // 대형일 때 chart itv * 2
static uint32_t s_chartLastPayload  = 0;

// --------------------------------------------------
// policy 로드: system.web → s_itvMs / priority / chart 정책
// (구조체/필드명은 프로젝트 실제 system.web 구조에 맞춰서 연결)
// --------------------------------------------------
static void CT10_WS_applyPolicyFromSystem() {
    if (!g_A20_config_root.system) return;

    // 예: p->system.web.wsIntervalMs[4]
    // 예: p->system.web.wsPriority[4] (0~3 채널 인덱스)
    // 예: p->system.web.chartLargeBytes / chartThrottleMul

    const ST_A20_SystemConfig_t& v_sys = *g_A20_config_root.system;

    // ✅ 아래는 “필드가 존재한다”는 전제로 작성.
    // 실제 구조체 필드명이 다르면 여기만 맞추면 됩니다.
    // ------------------------------
    // intervals
    for (uint8_t i = 0; i < G_WS_CH_COUNT; i++) {
        uint16_t v = v_sys.system.web.wsIntervalMs[i];
        if (v > 0) s_itvMs[i] = v;
    }

    // priority order
    for (uint8_t i = 0; i < G_WS_CH_COUNT; i++) {
        uint8_t v = v_sys.system.web.wsPriority[i];
        if (v < G_WS_CH_COUNT) s_prio[i] = v;
    }

    // chart payload policy
    if (v_sys.system.web.chartLargeBytes > 0)  s_chartLargeBytes  = v_sys.system.web.chartLargeBytes;
    if (v_sys.system.web.chartThrottleMul > 0) s_chartThrottleMul = v_sys.system.web.chartThrottleMul;

    // W10 setter로도 전달(통합 요구사항)
    if (s_setIntervals) s_setIntervals(s_itvMs);
}

// --------------------------------------------------
// begin/tick
// --------------------------------------------------
void CT10_WS_begin() {
    // policy 반영
    CT10_WS_applyPolicyFromSystem();

    for (uint8_t i = 0; i < G_WS_CH_COUNT; i++) {
        s_lastSendMs[i] = 0;
        s_pending[i]    = false;
    }
    s_lastCleanupMs = 0;

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10][WS] Scheduler begin: itv(state=%u metrics=%u chart=%u summary=%u)",
                       (unsigned)s_itvMs[0], (unsigned)s_itvMs[1], (unsigned)s_itvMs[2], (unsigned)s_itvMs[3]);
}

// --------------------------------------------------
// 채널별 dirty 소비 → pending 적립
// --------------------------------------------------
static void CT10_WS_collectPending(CL_CT10_ControlManager& v_ctrl) {
    if (v_ctrl.consumeDirtyState())   s_pending[G_WS_CH_STATE]   = true;
    if (v_ctrl.consumeDirtyMetrics()) s_pending[G_WS_CH_METRICS] = true;
    if (v_ctrl.consumeDirtyChart())   s_pending[G_WS_CH_CHART]   = true;
    if (v_ctrl.consumeDirtySummary()) s_pending[G_WS_CH_SUMMARY] = true;
}

// --------------------------------------------------
// payload 크기 측정 (chart는 특히 중요)
// --------------------------------------------------
static uint32_t CT10_WS_measurePayloadBytes(JsonDocument& p_doc) {
    // serializeJson(doc, String)보다 빠르게 하려면 measureJson(doc) 사용 가능
    return (uint32_t)measureJson(p_doc);
}

// --------------------------------------------------
// 채널 1회 전송 시도 (스로틀 + pending 해소)
// --------------------------------------------------
static bool CT10_WS_trySendOne(uint8_t ch, uint32_t nowMs, CL_CT10_ControlManager& v_ctrl) {
    if (ch >= G_WS_CH_COUNT) return false;
    if (!s_pending[ch]) return false;

    uint16_t itv = s_itvMs[ch];

    // chart는 payload 크기에 따라 추가 스로틀
    if (ch == G_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t mul = (s_chartThrottleMul > 0) ? s_chartThrottleMul : 2;
        itv = (uint16_t)((uint32_t)itv * mul);
    }

    if (nowMs - s_lastSendMs[ch] < itv) return false;

    // 전송 준비
    JsonDocument v_doc;

    if (ch == G_WS_CH_STATE) {
        v_ctrl.toJson(v_doc);
        if (s_bcast_state) s_bcast_state(v_doc, true);
    } else if (ch == G_WS_CH_METRICS) {
        v_ctrl.toMetricsJson(v_doc);
        if (s_bcast_metrics) s_bcast_metrics(v_doc, true);
    } else if (ch == G_WS_CH_CHART) {
        v_ctrl.toChartJson(v_doc, true);

        // payload bytes 측정
        s_chartLastPayload = CT10_WS_measurePayloadBytes(v_doc);

        if (s_bcast_chart) s_bcast_chart(v_doc, true);

        // 관찰 로그(빈도 제한은 필요시 추가)
        // CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10][WS] chart payload=%lu bytes", (unsigned long)s_chartLastPayload);
    } else { // summary
        v_ctrl.toSummaryJson(v_doc);
        if (s_bcast_summary) s_bcast_summary(v_doc, true);
    }

    s_lastSendMs[ch] = nowMs;
    s_pending[ch]    = false;
    return true;
}

// --------------------------------------------------
// tick
// --------------------------------------------------
void CT10_WS_tick() {
    if (!s_bcast_state || !s_bcast_metrics || !s_bcast_chart || !s_bcast_summary) {
        // 브로커 바인딩 전이면 아무것도 하지 않음
        return;
    }

    uint32_t nowMs = millis();

    CL_CT10_ControlManager& v_ctrl = CL_CT10_ControlManager::instance();

    // 1) dirty → pending 적립
    CT10_WS_collectPending(v_ctrl);

    // 2) 우선순위대로 "최대 1개"만 전송 (큐 폭주 방지)
    //    필요 시 "최대 N개"로 늘릴 수 있으나, 안정성 우선이면 1개가 가장 효과적
    for (uint8_t i = 0; i < G_WS_CH_COUNT; i++) {
        uint8_t ch = s_prio[i];
        if (CT10_WS_trySendOne(ch, nowMs, v_ctrl)) break;
    }

    // 3) cleanupClients 주기 호출 (권장)
    if (s_ws_cleanup && (nowMs - s_lastCleanupMs >= 2000)) {
        s_lastCleanupMs = nowMs;
        s_ws_cleanup();
    }
}
