/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_0202.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (Core)
 * ------------------------------------------------------
 * [E-2.4] 파일 분할 (4분할)
 *  - 유지: singleton wrappers, begin, setMotion, reloadAll,
 *          applyMotionSimConfigToSim, tickLoop, A-2 위임 메서드 3종
 *  - 이관:
 *    · Seg: tickOverride/tickUserProfile/tickSchedule/tickSegmentSequence/
 *           applySegmentOn/Off/updateRunCtx* (CT10_Ctl_Ctl_Seg_0202.cpp)
 *    · Ovr: startOverrideFixed/Preset/applyManualResolved/stopOverride
 *           (CT10_Ctl_Ctl_Ovr_0202.cpp)
 *    · Mode: setProfileMode/startUserProfileByNo/stopUserProfile
 *           (CT10_Ctl_Ctl_Mode_0202.cpp)
 * ------------------------------------------------------
 * [주의]
 * - AutoOff 초기화/체크/Motion/TimeInvalid 등은 CT10_Ctl_Basic_0202.cpp 유지
 * - runCtx snapshot helpers는 Seg 파일 (applySegmentOn/Off에서만 사용)
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0202.h"

#include "A25_Com_Utils_0202.h"     // A40_ComFunc / CL_A40_MutexGuard_Semaphore
#include "N10_NvsManager_0202.h"

// 외부 전역(프로젝트 기존 전역 PWM)
extern CL_P10_PWM g_P10_pwm;

// --------------------------------------------------
// Singleton wrappers
// --------------------------------------------------
bool CL_CT10_ControlManager::begin() {
    instance().begin(g_P10_pwm);
    return true;
}

void CL_CT10_ControlManager::tick() {
    instance().tickLoop();
}

void CL_CT10_ControlManager::setMode(bool p_profileMode) {
    instance().setProfileMode(p_profileMode);
}

bool CL_CT10_ControlManager::setActiveUserProfile(uint16_t p_profileNo) {
    return instance().startUserProfileByNo(p_profileNo);
}

void CL_CT10_ControlManager::applyManual(const ST_A20_ResolvedWind_t& p_wind) {
    instance().applyManualResolved(p_wind, 0);
}

void CL_CT10_ControlManager::clearManual() {
    instance().stopOverride();
}

// --------------------------------------------------
// reloadAll (F-05 loopTask 위임 실행)
// --------------------------------------------------
bool CL_CT10_ControlManager::reloadAll() {
    // [A-min] 새 root를 로컬에 로드 (기존 g_A20_config_root는 손대지 않음)
    ST_A20_ConfigRoot_t v_new;
    bool v_ok = CL_C10_ConfigManager::loadAll(v_new);
    if (!v_ok) {
        CL_C10_ConfigManager::freeAll(v_new);
        s_lastReloadOk.store(false, std::memory_order_release);
        return false;
    }

    // CT10 mutex 하에서 swap (CT10 reader와 배타)
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_C10_ConfigManager::freeAll(v_new);
        s_lastReloadOk.store(false, std::memory_order_release);
        return false;
    }

    // CT10 mutex + root swap mutex
    portENTER_CRITICAL(&CL_C10_ConfigManager::s_rootSwapMux);
    ST_A20_ConfigRoot_t v_old = g_A20_config_root;
    g_A20_config_root = v_new;
    portEXIT_CRITICAL(&CL_C10_ConfigManager::s_rootSwapMux);

    // CT10 멤버 초기화
    CL_CT10_ControlManager& v_inst = instance();

    v_inst.runSource         = EN_CT10_RUN_NONE;
    v_inst.curScheduleIndex  = -1;
    v_inst.curProfileIndex   = -1;
    v_inst.useProfileMode    = false;

    memset(&v_inst.overrideState, 0, sizeof(v_inst.overrideState));
    memset(&v_inst.autoOffRt,     0, sizeof(v_inst.autoOffRt));
    memset(&v_inst.scheduleSegRt, 0, sizeof(v_inst.scheduleSegRt));
    memset(&v_inst.profileSegRt,  0, sizeof(v_inst.profileSegRt));
    memset(&v_inst.runCtx,        0, sizeof(v_inst.runCtx));

    // [A-2] 영속 필드 리셋
    v_inst._persistOffTimeLastYday = -1;

    // [B-2] AutoOff 래치 리셋
    v_inst._autoOffLatched = false;

    // [C-3] N10 런타임 상태 리셋
    CL_N10_NvsManager::resetRuntime();

    v_inst.scheduleSegRt.index = -1;
    v_inst.profileSegRt.index  = -1;

    // runCtx 기본 상태(SSOT)
    v_inst.runCtx.state             = EN_CT10_STATE_IDLE;
    v_inst.runCtx.reason            = EN_CT10_REASON_NONE;
    v_inst.runCtx.lastDecisionMs    = millis();
    v_inst.runCtx.lastStateChangeMs = v_inst.runCtx.lastDecisionMs;

    v_inst.sim.stop();

    v_inst.markDirty("state");
    v_inst.markDirty("metrics");

    // [I-3] pending motion.sim apply 리셋
    v_inst._pendingMotionSimApply.store(false, std::memory_order_release);

    // [A-min] CT10 mutex 해제 후 구버전 root 해제 (E-1 지연 free)
    v_guard.unlock();
    CL_C10_ConfigManager::queuePendingFree(v_old);

    s_lastReloadOk.store(true, std::memory_order_release);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] reloadAll done (lastReloadOk=true)");
    return true;
}

// --------------------------------------------------
// begin (실제 초기화)
// --------------------------------------------------
void CL_CT10_ControlManager::begin(CL_P10_PWM& p_pwm) {
    pwm = &p_pwm;

    memset(&overrideState, 0, sizeof(overrideState));
    memset(&scheduleSegRt, 0, sizeof(scheduleSegRt));
    memset(&profileSegRt,  0, sizeof(profileSegRt));
    memset(&autoOffRt,     0, sizeof(autoOffRt));
    memset(&runCtx,        0, sizeof(runCtx));

    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;

    // segment rt 초기 진입 안정화
    uint32_t v_now = (uint32_t)millis();
    scheduleSegRt.onPhase      = true;
    scheduleSegRt.phaseStartMs = v_now;
    scheduleSegRt.loopCount    = 0;

    profileSegRt.onPhase       = true;
    profileSegRt.phaseStartMs  = v_now;
    profileSegRt.loopCount     = 0;

    autoOffRt.offTimeLastYday = -1;
    autoOffRt.offTimeLastMin  = -1;

    useProfileMode     = false;
    runSource          = EN_CT10_RUN_NONE;
    curScheduleIndex   = -1;
    curProfileIndex    = -1;
    lastTickMs         = 0;
    lastMetricsPushMs  = 0;

    runCtx.state             = EN_CT10_STATE_IDLE;
    runCtx.reason            = EN_CT10_REASON_NONE;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    runCtx.stateHoldUntilMs  = 0;
    runCtx.stateAckRequired  = false;

    runCtx.activeSchId     = 0;
    runCtx.activeSchNo     = 0;
    runCtx.activeSegId     = 0;
    runCtx.activeSegNo     = 0;
    runCtx.activeProfileNo = 0;

    // [I-3] pending motion.sim apply 리셋
    _pendingMotionSimApply.store(false, std::memory_order_release);

    sim.begin(p_pwm);

    active = true;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] begin()");
}

void CL_CT10_ControlManager::setMotion(CL_M10_MotionLogic* p_motion) {
    motion = p_motion;
}

// --------------------------------------------------
// config → S10 runtime 반영 (F-06 위임 실행)
// --------------------------------------------------
void CL_CT10_ControlManager::applyMotionSimConfigToSim() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    if (!g_A20_config_root.motion) return;

    const ST_A20_MotSimCfg_t& v_src = g_A20_config_root.motion->sim;

    sim.userIntensity   = A40_ComFunc::clampVal<float>(v_src.intensity,   0.0f, 100.0f);
    sim.userVariability = A40_ComFunc::clampVal<float>(v_src.variability, 0.0f, 100.0f);
    sim.userGustFreq    = A40_ComFunc::clampVal<float>(v_src.gustFreq,    0.0f, 100.0f);
    sim.fanLimitPct     = A40_ComFunc::clampVal<float>(v_src.fanLimit,    0.0f, 100.0f);
    sim.minFanPct       = A40_ComFunc::clampVal<float>(v_src.minFan,      0.0f, 100.0f);
    sim.turbSigma       = v_src.turbSigma;
    sim.turbLenScale    = v_src.turbLenScale;
    sim.thermalStrength = v_src.thermalStrength;
    sim.thermalRadius   = v_src.thermalRadius;
    sim.fanPowerEnabled = v_src.fanPowerEnabled;

    if (v_src.presetCode[0]) {
        memset(sim.presetCode, 0, sizeof(sim.presetCode));
        strlcpy(sim.presetCode, v_src.presetCode, sizeof(sim.presetCode));
    }

    sim.reapplyPresetCore();

    if (v_src.styleCode[0]) {
        memset(sim.styleCode, 0, sizeof(sim.styleCode));
        strlcpy(sim.styleCode, v_src.styleCode, sizeof(sim.styleCode));
    }

    CL_D10_Logger::log(EN_L10_LOG_DEBUG,
                       "[CT10] S10 runtime updated from motion.sim (intensity=%.1f)",
                       sim.userIntensity);
}

// --------------------------------------------------
// tickLoop (메인 제어 루프)
// --------------------------------------------------
void CL_CT10_ControlManager::tickLoop() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    // [F-06] Deferred: pending motion.sim apply
    if (_pendingMotionSimApply.exchange(false, std::memory_order_acq_rel)) {
        applyMotionSimConfigToSim();
        CL_D10_Logger::log(EN_L10_LOG_DEBUG,
                           "[CT10] MotionSim apply consumed (loopTask)");
    }

    if (!active || !pwm) return;

    unsigned long v_nowMs = millis();
    if (v_nowMs - lastTickMs < S_TICK_MIN_INTERVAL_MS) return;
    lastTickMs = v_nowMs;

    // 0) 이벤트 상태 hold/ack 유지
    if (!overrideState.active && shouldHoldEventState()) {
        maybePushMetricsDirty();
        return;
    }

    // 1) Decide + Apply (SSOT)
    ST_CT10_Decision_t v_d = decideRunSource();
    applyDecision(v_d);

    // 2) Execute by decided state
    if (runCtx.state == EN_CT10_STATE_OVERRIDE) {
        if (tickOverride()) {
            sim.tick();
        }
        maybePushMetricsDirty();
        return;
    }

    if (runCtx.state == EN_CT10_STATE_PROFILE_RUN) {
        if (tickUserProfile()) {
            sim.tick();
        } else if (sim.active) {
            sim.stop();
        }
        maybePushMetricsDirty();
        return;
    }

    if (runCtx.state == EN_CT10_STATE_SCHEDULE_RUN) {
        if (tickSchedule()) {
            sim.tick();
        } else if (sim.active) {
            sim.stop();
        }
        maybePushMetricsDirty();
        return;
    }

    if (sim.active) sim.stop();
    maybePushMetricsDirty();
}

// ======================================================
// [A-2] 캡슐화 위임 메서드 (W10 async_tcp 전용)
// ======================================================
bool CL_CT10_ControlManager::feedPIR(bool p_detected) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] feedPIR: Mutex busy");
        return false;
    }
    if (!motion) return false;
    motion->feedPIR(p_detected);
    return true;
}

bool CL_CT10_ControlManager::patchSimFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] patchSimFromJson: Mutex busy");
        return false;
    }
    return sim.patchFromJson(p_doc);
}

void CL_CT10_ControlManager::exportSimJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    sim.toJson(p_doc);
}
