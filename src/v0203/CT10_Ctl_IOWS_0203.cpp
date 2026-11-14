/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_IOWS_0203.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (WS Scheduler + IO 통합)
 * ------------------------------------------------------
 * 기능 요약:
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)
 * - 전송 스로틀 + pending 플래그
 * - 정책 기반 우선순위 전송 (wsChConfig[].priority → order 산출)
 * - payload 크기 측정 → chart 대형이면 자동 강스로틀
 * - W10 cleanupClients 주기 호출
 * - CT10 제어 상태/요약/메트릭/차트 JSON Export
 *
 * [Batch D] 성능 최적화 (D-1)
 *  - consumeAllDirty() 신규: 4개 dirty 플래그를 mutex 1회로 배치 소비
 *  - CT10_WS_collectPending: consumeDirtyX() 4회 → consumeAllDirty() 1회
 *  - WS tick당 mutex 4회 → 1회 (loopTask 지터 감소)
 *
 * [Batch E] Dead Code 정리 (E-8)
 *  - commented toXxxJson() 블록 제거
 *
 * [Batch E-2.4] 파일 분할
 *  - CT10_Ctl_Ctl_* 구현은 별도 파일로 이관됨
 *  - 이 파일은 WS 스케줄러 + State/Metrics/Chart/Summary Export 전담
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"
#include "N10_NvsManager_0203.h"

#include "A40_Com_Utils_0203.h"

#include <string.h>

// ======================================================
// WS tick 전용 파일-스태틱 doc
//  - loopTask에서만 호출되는 CT10_WS_trySendOne_v03 내부에서만 사용
//  - HTTP/WS-connect (async_tcp) 경로는 caller-owned doc 사용
// ======================================================
static JsonDocument s_doc_state;
static JsonDocument s_doc_metrics;
static JsonDocument s_doc_chart;
static JsonDocument s_doc_summary;

static constexpr uint32_t S_WS_MAX_INTERVAL_MS = 600000UL; // 10분

// ======================================================
// CT10 상태 mutex 정의 (lazy-init은 CL_A40_MutexGuard_Semaphore가 담당)
// ======================================================
SemaphoreHandle_t CL_CT10_ControlManager::s_stateMutex = nullptr;

// --------------------------------------------------
// Singleton
// --------------------------------------------------
CL_CT10_ControlManager& CL_CT10_ControlManager::instance() {
    static CL_CT10_ControlManager v_inst;
    return v_inst;
}

// [E-8] commented toXxxJson() 블록 제거

// --------------------------------------------------
// 외부 진입: 시뮬레이터 등에서 Dirty 마킹
// --------------------------------------------------
void CT10_markDirtyFromSim(const char* p_key) {
    if (!p_key || !p_key[0]) return;
    CL_CT10_ControlManager::instance().markDirty(p_key);
}

// --------------------------------------------------
// Broker 함수 포인터
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

static uint16_t s_itvMs[EN_A20_WS_CH_COUNT] = {(uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_STATE].chDefaultIntervalMs,
                                               (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_METRICS].chDefaultIntervalMs,
                                               (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_CHART].chDefaultIntervalMs,
                                               (uint16_t)G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_SUMMARY].chDefaultIntervalMs};

static uint8_t s_prio[EN_A20_WS_CH_COUNT] = {
    (uint8_t)EN_A20_WS_CH_STATE, (uint8_t)EN_A20_WS_CH_METRICS, (uint8_t)EN_A20_WS_CH_CHART, (uint8_t)EN_A20_WS_CH_SUMMARY};

static uint16_t s_chartLargeBytes  = (uint16_t)G_A20_WS_ETC_DEFAULT_CONFIG.chartLargeBytes;
static uint8_t  s_chartThrottleMul = (uint8_t)G_A20_WS_ETC_DEFAULT_CONFIG.chartThrottleMul;
static uint32_t s_chartLastPayload = 0;

static uint16_t s_cleanupMs = (uint16_t)G_A20_WS_ETC_DEFAULT_CONFIG.wsCleanupMs;

// --------------------------------------------------
// 브로커 주입 API
// --------------------------------------------------
void CT10_WS_setBrokers(void (*p_state)(JsonDocument&, bool),
                        void (*p_metrics)(JsonDocument&, bool),
                        void (*p_chart)(JsonDocument&, bool),
                        void (*p_summary)(JsonDocument&, bool),
                        void (*p_cleanup)()) {
    s_bcast_state   = p_state;
    s_bcast_metrics = p_metrics;
    s_bcast_chart   = p_chart;
    s_bcast_summary = p_summary;
    s_ws_cleanup    = p_cleanup;
}

// --------------------------------------------------
// 우선순위 정렬
// --------------------------------------------------
static void CT10_WS_buildPriorityOrderFromConfig(const ST_A20_WS_CH_CONFIG_t p_cfg[EN_A20_WS_CH_COUNT],
                                                 uint8_t                     p_out[EN_A20_WS_CH_COUNT]) {
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        p_out[v_i] = v_i;
    }

    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < (uint8_t)EN_A20_WS_CH_COUNT; v_j++) {
            uint8_t a = p_out[v_i];
            uint8_t b = p_out[v_j];

            uint8_t pa = p_cfg[a].priority;
            uint8_t pb = p_cfg[b].priority;

            bool v_swap = false;
            if (pb < pa)
                v_swap = true;
            else if (pb == pa && b < a)
                v_swap = true;

            if (v_swap) {
                uint8_t t  = p_out[v_i];
                p_out[v_i] = p_out[v_j];
                p_out[v_j] = t;
            }
        }
    }
}

// --------------------------------------------------
// Policy 로드
// --------------------------------------------------
static void CT10_WS_applyPolicyFromSystem() {
    // [F-2] 원자 스냅샷 (swap 중 torn read 방지)
    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    if (!v_snap.system) return;

    const ST_A20_SystemConfig_t&    v_sys = *v_snap.system;
    const ST_A20_WebSocketConfig_t& v_ws  = v_sys.system.webSocket;

    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        const ST_A20_WS_CH_CONFIG_t& v_ch  = v_ws.wsChConfig[v_i];
        uint16_t                     v_itv = v_ch.chIntervalMs;
        if (v_itv > 0) {
            s_itvMs[v_i] = v_itv;
        }
    }

    CT10_WS_buildPriorityOrderFromConfig(v_ws.wsChConfig, s_prio);

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
// Begin
// --------------------------------------------------
void CT10_WS_begin() {
    CT10_WS_applyPolicyFromSystem();

    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        s_lastSendMs[v_i] = 0;
        s_pending[v_i]    = false;
    }

    s_lastCleanupMs     = 0;
    s_lastPolicyApplyMs = millis();

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[CT10][WS] Scheduler begin: itv(state=%u metrics=%u chart=%u summary=%u) cleanup=%u",
                       (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_STATE],
                       (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_METRICS],
                       (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_CHART],
                       (unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_SUMMARY],
                       (unsigned)s_cleanupMs);
}

// --------------------------------------------------
// [D-1] 배치 dirty 소비 (mutex 1회)
// --------------------------------------------------
static void CT10_WS_collectPending(CL_CT10_ControlManager& p_ctrl) {
    uint8_t v_dirty = p_ctrl.consumeAllDirty();
    if (v_dirty & 0x01) s_pending[(uint8_t)EN_A20_WS_CH_STATE] = true;
    if (v_dirty & 0x02) s_pending[(uint8_t)EN_A20_WS_CH_METRICS] = true;
    if (v_dirty & 0x04) s_pending[(uint8_t)EN_A20_WS_CH_CHART] = true;
    if (v_dirty & 0x08) s_pending[(uint8_t)EN_A20_WS_CH_SUMMARY] = true;
}

// --------------------------------------------------
// payload 크기 측정
// --------------------------------------------------
static uint32_t CT10_WS_measurePayloadBytes(JsonDocument& p_doc) {
    return (uint32_t)measureJson(p_doc);
}

// --------------------------------------------------
// 채널 1회 전송 시도
// --------------------------------------------------
static bool CT10_WS_trySendOne_v03(uint8_t p_ch, uint32_t p_nowMs) {
    if (p_ch >= (uint8_t)EN_A20_WS_CH_COUNT) return false;
    if (!s_pending[p_ch]) return false;

    uint32_t v_itv = (uint32_t)s_itvMs[p_ch];
    if (p_ch == (uint8_t)EN_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
        uint32_t v_mul    = (s_chartThrottleMul > 0) ? (uint32_t)s_chartThrottleMul : 2UL;
        uint32_t v_mulItv = v_itv * v_mul;
        if (v_mulItv > S_WS_MAX_INTERVAL_MS) v_mulItv = S_WS_MAX_INTERVAL_MS;
        v_itv = v_mulItv;
    }
    if ((uint32_t)(p_nowMs - s_lastSendMs[p_ch]) < v_itv) return false;

    bool v_sent = false;

    switch ((EN_A20_WS_CH_INDEX_t)p_ch) {
        case EN_A20_WS_CH_STATE: {
            s_doc_state.clear();
            CL_CT10_ControlManager::instance().exportStateJson_v02(s_doc_state);
            if (s_bcast_state) s_bcast_state(s_doc_state, true);
            v_sent = true;
        } break;

        case EN_A20_WS_CH_METRICS: {
            s_doc_metrics.clear();
            CL_CT10_ControlManager::instance().exportMetricsJson(s_doc_metrics);
            if (s_bcast_metrics) s_bcast_metrics(s_doc_metrics, true);
            v_sent = true;
        } break;

        case EN_A20_WS_CH_CHART: {
            s_doc_chart.clear();
            CL_CT10_ControlManager::instance().exportChartJson(s_doc_chart, true);
            s_chartLastPayload = CT10_WS_measurePayloadBytes(s_doc_chart);
            if (s_bcast_chart) s_bcast_chart(s_doc_chart, true);
            v_sent = true;
        } break;

        case EN_A20_WS_CH_SUMMARY: {
            s_doc_summary.clear();
            CL_CT10_ControlManager::instance().exportSummaryJson(s_doc_summary);
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

// --------------------------------------------------
// Tick
// --------------------------------------------------
void CT10_WS_tick() {
    if (!s_bcast_state || !s_bcast_metrics || !s_bcast_chart || !s_bcast_summary) {
        return;
    }

    uint32_t v_nowMs = millis();

    if ((uint32_t)(v_nowMs - s_lastPolicyApplyMs) >= 3000UL) {
        s_lastPolicyApplyMs = v_nowMs;
        CT10_WS_applyPolicyFromSystem();
    }

    // 1) dirty → pending 적립 (D-1 배치)
    CL_CT10_ControlManager& v_ctrl = CL_CT10_ControlManager::instance();
    CT10_WS_collectPending(v_ctrl);

    // 2) 우선순위 순 최대 1개 전송
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

    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

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
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    bool v_ret  = _dirtyState;
    _dirtyState = false;
    return v_ret;
}

bool CL_CT10_ControlManager::consumeDirtyMetrics() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    bool v_ret    = _dirtyMetrics;
    _dirtyMetrics = false;
    return v_ret;
}

bool CL_CT10_ControlManager::consumeDirtyChart() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    bool v_ret  = _dirtyChart;
    _dirtyChart = false;
    return v_ret;
}

bool CL_CT10_ControlManager::consumeDirtySummary() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    bool v_ret    = _dirtySummary;
    _dirtySummary = false;
    return v_ret;
}

// ======================================================
// [D-1] 배치 소비 (WS 스케줄러 전용)
//  - bit0=state, bit1=metrics, bit2=chart, bit3=summary
// ======================================================
uint8_t CL_CT10_ControlManager::consumeAllDirty() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return 0;

    uint8_t v_ret = 0;
    if (_dirtyState) {
        v_ret       |= 0x01;
        _dirtyState  = false;
    }
    if (_dirtyMetrics) {
        v_ret         |= 0x02;
        _dirtyMetrics  = false;
    }
    if (_dirtyChart) {
        v_ret       |= 0x04;
        _dirtyChart  = false;
    }
    if (_dirtySummary) {
        v_ret         |= 0x08;
        _dirtySummary  = false;
    }
    return v_ret;
}

// --------------------------------------------------
// metrics dirty push (1.5초 주기)
// --------------------------------------------------
void CL_CT10_ControlManager::maybePushMetricsDirty() {
    unsigned long v_nowMs = millis();
    if ((uint32_t)(v_nowMs - lastMetricsPushMs) < (uint32_t)S_METRICS_PUSH_INTERVAL_MS) return;

    lastMetricsPushMs = v_nowMs;
    markDirty("metrics");
}

// ======================================================
// IO Export
// ======================================================

// --------------------------------------------------
// exportStateJson_v02
// --------------------------------------------------
void CL_CT10_ControlManager::exportStateJson_v02(JsonDocument& p_doc) {
    // 락 순서 준수 (CONTRACT §3.1 / AGENTS.md §4.2):
    // s_stateMutex(L2) 획득 전 s_rootSwapMux(L1)를 경유하여 안전한 스냅샷 원자 캡처
    ST_A20_ConfigRoot_t v_cfgSnap;
    CL_C10_ConfigManager::getRootSnapshot(v_cfgSnap);

    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_ctl  = A40_ComFunc::Json_ensureObject(v_root["control"]);

    // 1) Core flags
    v_ctl["active"]      = active;
    v_ctl["profileMode"] = useProfileMode;
    v_ctl["mode"]        = useProfileMode ? "PROFILE" : "SCHEDULE";

    // 2) State/Reason
    v_ctl["state"]      = CT10_stateToString(runCtx.state);
    v_ctl["reason"]     = CT10_reasonToString(runCtx.reason);
    v_ctl["stateCode"]  = (uint8_t)runCtx.state;
    v_ctl["reasonCode"] = (uint8_t)runCtx.reason;

    v_ctl["runSource"]         = (uint8_t)runSource;
    v_ctl["lastDecisionMs"]    = (uint32_t)runCtx.lastDecisionMs;
    v_ctl["lastStateChangeMs"] = (uint32_t)runCtx.lastStateChangeMs;

    // 2-1) Event hold/ack
    {
        JsonObject v_evt     = A40_ComFunc::Json_ensureObject(v_ctl["event"]);
        v_evt["ackRequired"] = runCtx.stateAckRequired;
        v_evt["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

        uint32_t v_now    = (uint32_t)millis();
        uint32_t v_remain = 0;
        if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
            v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
        }
        v_evt["holdRemainMs"] = v_remain;
    }

    // 3) Time status
    {
        JsonObject v_time = A40_ComFunc::Json_ensureObject(v_ctl["time"]);
        v_time["valid"]   = CL_TM10_TimeManager::isTimeValid();

        struct tm v_tm;
        memset(&v_tm, 0, sizeof(v_tm));
        if (CL_TM10_TimeManager::getLocalTime(v_tm)) {
            v_time["hour"] = (int)v_tm.tm_hour;
            v_time["min"]  = (int)v_tm.tm_min;
            v_time["wday"] = (int)v_tm.tm_wday;
        } else {
            v_time["hour"] = -1;
            v_time["min"]  = -1;
            v_time["wday"] = -1;
        }
    }

    // 4) Schedule snapshot
    {
        JsonObject v_sch = A40_ComFunc::Json_ensureObject(v_ctl["schedule"]);
        v_sch["index"]   = (int)curScheduleIndex;
        v_sch["schId"]   = (uint8_t)runCtx.activeSchId;
        v_sch["schNo"]   = (uint16_t)runCtx.activeSchNo;

        const char* v_name = "";
        if (v_cfgSnap.schedules) {
            ST_A20_SchedulesRoot_t& v_cfg = *v_cfgSnap.schedules;
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

    // 5) Profile snapshot
    {
        JsonObject v_prof   = A40_ComFunc::Json_ensureObject(v_ctl["profile"]);
        v_prof["index"]     = (int)curProfileIndex;
        v_prof["profileNo"] = (uint16_t)runCtx.activeProfileNo;

        const char* v_name = "";
        if (v_cfgSnap.userProfiles) {
            ST_A20_UserProfilesRoot_t& v_cfg = *v_cfgSnap.userProfiles;
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
        v_seg["segId"]   = (uint8_t)runCtx.activeSegId;
        v_seg["segNo"]   = (uint16_t)runCtx.activeSegNo;

        JsonObject v_srt      = A40_ComFunc::Json_ensureObject(v_seg["scheduleRt"]);
        v_srt["index"]        = (int)scheduleSegRt.index;
        v_srt["onPhase"]      = scheduleSegRt.onPhase;
        v_srt["phaseStartMs"] = (uint32_t)scheduleSegRt.phaseStartMs;
        v_srt["loopCount"]    = (uint8_t)scheduleSegRt.loopCount;

        JsonObject v_prt      = A40_ComFunc::Json_ensureObject(v_seg["profileRt"]);
        v_prt["index"]        = (int)profileSegRt.index;
        v_prt["onPhase"]      = profileSegRt.onPhase;
        v_prt["phaseStartMs"] = (uint32_t)profileSegRt.phaseStartMs;
        v_prt["loopCount"]    = (uint8_t)profileSegRt.loopCount;
    }

    // 7) Override snapshot
    {
        JsonObject v_ov      = A40_ComFunc::Json_ensureObject(v_ctl["override"]);
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

    // 7-1) [v0203 Stage 5] Pending Schedule snapshot (수동 재생 중 스케줄 대기 상태)
    {
        JsonObject v_ps = A40_ComFunc::Json_ensureObject(v_ctl["pendingSchedule"]);
        v_ps["active"]  = runCtx.pendingScheduleActive;
        if (runCtx.pendingScheduleActive) {
            v_ps["schId"]               = runCtx.pendingSchId;
            v_ps["schNo"]               = runCtx.pendingSchNo;
            v_ps["name"]                = runCtx.pendingSchName;
            v_ps["startTime"]           = runCtx.pendingSchStart;
            v_ps["profileNo"]           = runCtx.pendingProfileNo;
            v_ps["remainMin"]           = runCtx.pendingRemainMin;
            v_ps["inactiveDueToManual"] = true;
            v_ps["manualOverride"]      = CL_N10_NvsManager::isManualOvrSchedule();
        }
    }

    // 8) Trigger runtime snapshot (Clean Break: autoOffRt 제거)
    {
        JsonObject v_tr        = A40_ComFunc::Json_ensureObject(v_ctl["triggerRt"]);
        v_tr["timerArmed"]     = triggerRt.timerArmed;
        v_tr["timerStartMs"]   = (uint32_t)triggerRt.timerStartMs;
        v_tr["timerMinutes"]   = (uint32_t)triggerRt.timerMinutes;
        v_tr["pausedAccumMs"]  = (uint32_t)triggerRt.pausedAccumMs;
        v_tr["offTimeEnabled"] = triggerRt.offTimeEnabled;
        v_tr["offTimeMinutes"] = (uint16_t)triggerRt.offTimeMinutes;
        v_tr["offTimeLastYday"] = (int)triggerRt.offTimeLastYday;
        v_tr["offTimeLastMin"]  = (int)triggerRt.offTimeLastMin;
        v_tr["pauseMask"]      = (uint8_t)triggerRt.pauseMask;
        v_tr["lastCheckTempC"] = triggerRt.lastCheckTempC;
        v_tr["lastCheckDI"]    = triggerRt.lastCheckDI;
    }

    // 8-1) Sensor snapshot
    {
        JsonObject v_sensor  = A40_ComFunc::Json_ensureObject(v_ctl["sensor"]);
        v_sensor["tempC"]    = getCurrentTemperatureMock();
        v_sensor["humidity"] = getCurrentHumidityMock();

        bool v_motionAct = false;
        if (motion) v_motionAct = motion->isActive();
        v_sensor["motionActive"] = v_motionAct;
    }

    // 9) Dirty flags
    {
        JsonObject v_dirty = A40_ComFunc::Json_ensureObject(v_ctl["dirty"]);
        v_dirty["state"]   = _dirtyState;
        v_dirty["metrics"] = _dirtyMetrics;
        v_dirty["chart"]   = _dirtyChart;
        v_dirty["summary"] = _dirtySummary;
    }

    // ======================================================
    // [v0203] 시간 기준점 노출 (millis ↔ epochms 변환용)
    //  - uptimeMs: 부팅 후 경과 (millis)
    //  - epochNowMs: SNTP 동기화 완료 시점의 epoch ms (0이면 미동기)
    //  - 프론트엔드는 serverBootEpochMs = epochNowMs - uptimeMs 로 기준점 확보 후
    //    각 *Ms 필드(millis)를 절대 시각으로 변환 가능
    //  - SNTP 미동기 시 epochNowMs=0 → 프론트는 상대 시간 표시만 사용
    // ======================================================
    {
        JsonObject v_sys    = A40_ComFunc::Json_ensureObject(v_ctl["system"]);
        v_sys["uptimeMs"]   = (uint32_t)millis();
        v_sys["epochNowMs"] = CL_TM10_TimeManager::isTimeValid() ? (uint64_t)time(nullptr) * 1000ULL : 0ULL;
    }

    // [I-1] Pending reload 상태
    v_ctl["pendingReload"] = CL_CT10_ControlManager::isReloadPending();

    // [B-N-1] 마지막 reloadAll 결과
    v_ctl["lastReloadOk"] = CL_CT10_ControlManager::isLastReloadOk();

    // ======================================================
    // [N-7] Runtime (NVS) 스냅샷 노출 (/diagnostics 연동)
    // ======================================================
    {
        JsonObject            v_rt = A40_ComFunc::Json_ensureObject(v_root["runtime"]);
        ST_N10_RuntimeState_t v_st = CL_N10_NvsManager::getState();

        v_rt["runMode"]           = v_st.runMode;
        v_rt["runSource"]         = v_st.runSource;
        v_rt["lastScheduleNo"]    = v_st.lastScheduleNo;
        v_rt["lastUserProfileNo"] = v_st.lastUserProfileNo;
        v_rt["overrideEnabled"]   = v_st.overrideEnabled;
        v_rt["overrideMode"]      = v_st.overrideMode;
    }

    // 9-1) [v0203 Stage 3] Session runtime snapshot
    {
        JsonObject               v_sess = A40_ComFunc::Json_ensureObject(v_ctl["session"]);
        // 이미 s_stateMutex를 쥐고 있으므로 getSessionSnapshot() 재귀 호출 대신 내부 _session 직접 복사
        ST_CT10_SessionContext_t s      = _session;
        v_sess["active"]                = (s.state == EN_SESSION_ACTIVE || s.state == EN_SESSION_PAUSED);
        v_sess["type"]                  = (uint8_t)s.type;
        v_sess["trigger"]               = (uint8_t)s.trigger;
        v_sess["state"]                 = (s.state == EN_SESSION_ACTIVE)   ? "ACTIVE"
                                          : (s.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                                           : "COMPLETED";
        v_sess["pausedAccumMs"]         = s.pausedAccumMs;

        if (s.type == EN_CT10_SESSION_PLAYLIST) {
            v_sess["typeName"]    = "PLAYLIST";
            v_sess["profileId"]   = s.payload.playlist.profileId;
            v_sess["profileNo"]   = s.payload.playlist.profileNo;
            v_sess["profileName"] = s.payload.playlist.profileName; // [Phase3 신규]
            v_sess["currentStep"] = s.payload.playlist.currentStepIdx + 1;
            v_sess["totalSteps"]  = s.payload.playlist.totalSteps;
            v_sess["loopCount"]   = s.payload.playlist.loopCount;

            // [Phase3 신규] stepRemainSec 계산
            uint32_t v_remain = 0;
            if (s.payload.playlist.currentStepDurationMs > 0) {
                uint32_t v_elapsed = 0;
                if (s.state == EN_SESSION_ACTIVE) {
                    v_elapsed = (uint32_t)millis() - s.payload.playlist.currentStepStartMs;
                } else if (s.state == EN_SESSION_PAUSED && s.pausedAtMs > 0) {
                    v_elapsed = s.pausedAtMs - s.payload.playlist.currentStepStartMs;
                }
                if (v_elapsed < s.payload.playlist.currentStepDurationMs) {
                    v_remain = (s.payload.playlist.currentStepDurationMs - v_elapsed) / 1000UL;
                }
            }
            v_sess["stepRemainSec"] = v_remain;
        } else if (s.type == EN_CT10_SESSION_PRESET) {
            v_sess["typeName"]   = "PRESET";
            v_sess["presetCode"] = s.payload.preset.presetCode;
            v_sess["styleCode"]  = s.payload.preset.styleCode;
        } else if (s.type == EN_CT10_SESSION_FIXED) {
            v_sess["typeName"] = "FIXED";
            v_sess["percent"]  = s.payload.fixed.percent;
        } else {
            v_sess["typeName"] = "NONE";
        }

        // ─── [M1 수정] 세션 스냅샷 rule 노출 ───
        {
            JsonObject v_rule = A40_ComFunc::Json_ensureObject(v_sess["rule"]);

            // timer
            v_rule["timer"]["enabled"] = _session.rule.timer.enabled;
            v_rule["timer"]["minutes"] = _session.rule.timer.minutes;

            // offTime
            v_rule["offTime"]["enabled"] = _session.rule.offTime.enabled;
            v_rule["offTime"]["time"]    = _session.rule.offTime.time;

            // tempLow
            v_rule["tempLow"]["enabled"]    = _session.rule.tempLow.enabled;
            v_rule["tempLow"]["mode"]       = (_session.rule.tempLow.mode == EN_A20_RULE_MODE_STOP)
                                                ? "STOP" : "PAUSE";
            v_rule["tempLow"]["threshold"]  = _session.rule.tempLow.threshold;
            v_rule["tempLow"]["hysteresis"] = _session.rule.tempLow.hysteresis;

            // diLow
            v_rule["diLow"]["enabled"]    = _session.rule.diLow.enabled;
            v_rule["diLow"]["mode"]       = (_session.rule.diLow.mode == EN_A20_RULE_MODE_STOP)
                                                ? "STOP" : "PAUSE";
            v_rule["diLow"]["threshold"]  = _session.rule.diLow.threshold;
            v_rule["diLow"]["hysteresis"] = _session.rule.diLow.hysteresis;

            // pirPause
            v_rule["pirPause"]["enabled"] = _session.rule.pirPause.enabled;
            v_rule["pirPause"]["holdSec"] = _session.rule.pirPause.holdSec;

            // smartComfort
            v_rule["smartComfort"]["enabled"]     = _session.rule.smartComfort.enabled;
            v_rule["smartComfort"]["intervalMin"] = _session.rule.smartComfort.intervalMin;
            v_rule["smartComfort"]["level"]       = _session.rule.smartComfort.level;
        }

        // [M1 수정] pauseReason / pauseSinceMs 노출 (ENV_PAUSED 시)
        if (runCtx.state == EN_CT10_STATE_ENV_PAUSED) {
            v_sess["pauseReason"]  = (uint8_t)runCtx.pauseReason;
            v_sess["pauseSinceMs"] = runCtx.pauseSinceMs;
        }

        if (_session.autoSwitchReason[0] != '\0') {
            v_sess["autoSwitchReason"] = _session.autoSwitchReason;
            v_sess["autoSwitchAtMs"]   = _session.autoSwitchAtMs;
        }
    }

    // 10) Simulation snapshot 병합
    sim.toJson(p_doc);
}

// --------------------------------------------------
// exportChartJson
// --------------------------------------------------
void CL_CT10_ControlManager::exportChartJson(JsonDocument& p_doc, bool p_diffOnly) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    sim.toChartJson(p_doc, p_diffOnly);

    JsonObject v_sim  = A40_ComFunc::Json_ensureObject(p_doc["sim"]);
    JsonObject v_meta = A40_ComFunc::Json_ensureObject(v_sim["meta"]);

    v_meta["pwmDuty"]   = pwm ? pwm->P10_getDutyPercent() : 0.0f;
    v_meta["active"]    = active;
    v_meta["runSource"] = (int)runSource;
    v_meta["override"]  = overrideState.active ? (overrideState.useFixed ? "fixed" : "resolved") : "none";

    {
        JsonObject v_ctx    = A40_ComFunc::Json_ensureObject(v_meta["ctx"]);
        v_ctx["state"]      = CT10_stateToString(runCtx.state);
        v_ctx["reason"]     = CT10_reasonToString(runCtx.reason);
        v_ctx["stateCode"]  = (uint8_t)runCtx.state;
        v_ctx["reasonCode"] = (uint8_t)runCtx.reason;

        v_ctx["schNo"]     = (uint16_t)runCtx.activeSchNo;
        v_ctx["profileNo"] = (uint16_t)runCtx.activeProfileNo;
        v_ctx["segNo"]     = (uint16_t)runCtx.activeSegNo;
    }
}

// --------------------------------------------------
// exportSummaryJson
// --------------------------------------------------
void CL_CT10_ControlManager::exportSummaryJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_sum  = A40_ComFunc::Json_ensureObject(v_root["summary"]);

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
    v_sum["mode"]       = useProfileMode ? "PROFILE" : "SCHEDULE";

    v_sum["scheduleIdx"] = curScheduleIndex;
    v_sum["profileIdx"]  = curProfileIndex;
}

// --------------------------------------------------
// exportMetricsJson
// --------------------------------------------------
void CL_CT10_ControlManager::exportMetricsJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_m    = A40_ComFunc::Json_ensureObject(v_root["metrics"]);

    v_m["active"]         = active;
    v_m["runSource"]      = (int)runSource;
    v_m["useProfileMode"] = useProfileMode;
    v_m["scheduleIdx"]    = curScheduleIndex;
    v_m["profileIdx"]     = curProfileIndex;

    v_m["overrideActive"] = overrideState.active;
    v_m["overrideFixed"]  = overrideState.useFixed;
    v_m["overrideRemain"] = calcOverrideRemainSec();

    v_m["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

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

    v_m["triggerTimerArmed"]   = triggerRt.timerArmed;
    v_m["triggerTimerMinutes"] = triggerRt.timerMinutes;
    v_m["triggerOffTime"]      = triggerRt.offTimeEnabled ? triggerRt.offTimeMinutes : 0;
    v_m["pauseMask"]           = (uint8_t)triggerRt.pauseMask;

    v_m["stateCode"]  = (uint8_t)runCtx.state;
    v_m["reasonCode"] = (uint8_t)runCtx.reason;
    v_m["state"]      = CT10_stateToString(runCtx.state);
    v_m["reason"]     = CT10_reasonToString(runCtx.reason);

    v_m["ackRequired"] = runCtx.stateAckRequired;
    v_m["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

    uint32_t v_now    = (uint32_t)millis();
    uint32_t v_remain = 0;
    if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
        v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
    }
    v_m["holdRemainMs"] = v_remain;

    v_m["activeSchId"]     = (uint8_t)runCtx.activeSchId;
    v_m["activeSchNo"]     = (uint16_t)runCtx.activeSchNo;
    v_m["activeProfileNo"] = (uint8_t)runCtx.activeProfileNo;
    v_m["activeSegId"]     = (uint8_t)runCtx.activeSegId;
    v_m["activeSegNo"]     = (uint16_t)runCtx.activeSegNo;

    v_m["timeValid"] = CL_TM10_TimeManager::isTimeValid();
}

// --------------------------------------------------
// [MON-A] Monitor Snapshot (Phase 1)
// --------------------------------------------------
ST_MON_Snapshot_t CL_CT10_ControlManager::getMonitorSnapshot() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    ST_MON_Snapshot_t           s = {};

    if (v_guard.isAcquired()) {
        s.state           = (uint8_t)runCtx.state;
        s.reason          = (uint8_t)runCtx.reason;
        s.activeSchId     = runCtx.activeSchId;
        s.activeSegNo     = runCtx.activeSegNo;
        s.activeProfileNo = runCtx.activeProfileNo;

        s.windSpeed           = sim.currentWindSpeed;
        s.targetWind          = sim.targetWindSpeed;
        s.pwmDuty             = pwm ? pwm->P10_getDutyPercent() : 0.0f;
        s.intensity           = sim.userIntensity;
        s.variability         = sim.userVariability;
        s.gustFreq            = sim.userGustFreq;
        s.presetIdx           = 0;
        s.styleIdx            = 0;
        s.gustActive          = sim.gustActive;
        s.thermalActive       = sim.thermalActive;
        s.overrideActive      = overrideState.active;
        s.triggerTimerArmed   = triggerRt.timerArmed;
        s.triggerTimerMinutes = triggerRt.timerMinutes;
        s.tempC               = getCurrentTemperatureMock();
        s.humidity            = getCurrentHumidityMock();
        s.motionActive        = (motion != nullptr) ? motion->isActive() : false;
    }
    return s;
}
