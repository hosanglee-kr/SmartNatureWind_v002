/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_070.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (Control)
 * ------------------------------------------------------
 * 기능 요약:
 * - begin/tick 및 Override/Profile/Schedule 제어 루프 구현
 * - Segment 시퀀스 오버로드 구현(템플릿 제거)
 * - applySegmentOn 로그 포맷 개선(이름 출력)
 *
 * [주의]
 * - AutoOff/Motion/TimeInvalid/findActiveScheduleIndex/Dirty/export JSON 등은
 *   다른 cpp(CT10_Control_Basic_xxx.cpp / CT10_Control_Json_xxx.cpp)에서 구현된다.
 * - 본 파일은 "제어 루프/segment 실행" 중심(Control)이다.
 * ------------------------------------------------------
 */

#include "CT10_Ctl_070.h"

// [o-2] explicit include (A20_Const_070.h에서 제거됨)
#include "A25_Com_Utils_070.h"     // A40_ComFunc / A40_IO / CL_A40_MutexGuard_Semaphore

#include "N10_NvsManager_070.h"

// --------------------------------------------------
// [CT10] runCtx snapshot helpers (최소)
// - SegmentOn/Off에서만 호출
// - schedule/profile 공통으로 "현재 구동 중 대상"을 UI에 보여주기 위한 목적
// --------------------------------------------------
static inline void CT10_resetActiveSegSnapshot(ST_CT10_RunContext_t& p_ctx) {
    p_ctx.activeSegId = 0;
    p_ctx.activeSegNo = 0;
}

// 외부 전역(프로젝트 기존 전역 PWM 가정)
extern CL_P10_PWM g_P10_pwm;

// --------------------------------------------------
// singleton / static wrappers
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


bool CL_CT10_ControlManager::reloadAll() {
    // [A-min] 새 root를 로컬에 로드 (기존 g_A20_config_root는 손대지 않음)
    ST_A20_ConfigRoot_t v_new;
    bool v_ok = CL_C10_ConfigManager::loadAll(v_new);
    if (!v_ok) {
        CL_C10_ConfigManager::freeAll(v_new);
        return false;
    }

    // [A-min] CT10 mutex 하에서 swap (CT10 reader와 배타)
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_C10_ConfigManager::freeAll(v_new);
        return false;
    }
    
    // [A-min + A-mid] CT10 mutex + root swap mutex
    portENTER_CRITICAL(&CL_C10_ConfigManager::s_rootSwapMux);
    ST_A20_ConfigRoot_t v_old = g_A20_config_root;
    g_A20_config_root = v_new;
    portEXIT_CRITICAL(&CL_C10_ConfigManager::s_rootSwapMux);

    // CT10 멤버 초기화 (기존 로직)
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
    
    // [A-2] 영속 필드 리셋 (설정 재적용이므로 offTime 트리거 이력 초기화)
    v_inst._persistOffTimeLastYday = -1;
    
    // [B-2] AutoOff 래치 리셋 (설정 재적용)
    v_inst._autoOffLatched = false;
    
    // [C-3] N10 런타임 상태 리셋 (설정 재적용)
    //  - reload는 설정 전면 교체이므로 이전 NVS 런타임 무효
    //  - 즉시 flush(true)로 NVS 반영
    //  - [Policy] 부팅 복원은 하지 않으므로 N10 상태는 순수 "정보 기록" 목적
    //    → reload 시에도 이전 상태 초기화가 정합적
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
    
    // [A-min] CT10 mutex 해제 후 구버전 root 해제
    //  - [E-1] 즉시 free 하지 않고 pending 큐에 등록 (W10 reader UAF 방지)
    //  - processPendingFree()가 grace(3초) 경과 후 실제 free
    //  - 사유: W10 GET이 getRootSnapshot 후 toJson 실행 사이에 v_old 참조
    //          → 즉시 free 시 dangling pointer 접근
    v_guard.unlock();
    CL_C10_ConfigManager::queuePendingFree(v_old);
    

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] reloadAll done");
    return true;
}

// --------------------------------------------------
// begin / motion
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

    // segment rt 초기 진입 안정화(권장)
    uint32_t v_now = (uint32_t)millis();
    scheduleSegRt.onPhase      = true;
    scheduleSegRt.phaseStartMs = v_now;
    scheduleSegRt.loopCount    = 0;

    profileSegRt.onPhase       = true;
    profileSegRt.phaseStartMs  = v_now;
    profileSegRt.loopCount     = 0;

    // offTime 재트리거 방지 런타임 기본값
    autoOffRt.offTimeLastYday = -1;
    autoOffRt.offTimeLastMin  = -1;

    useProfileMode     = false;
    runSource          = EN_CT10_RUN_NONE;
    curScheduleIndex   = -1;
    curProfileIndex    = -1;
    lastTickMs         = 0;
    lastMetricsPushMs  = 0;

    // runCtx 기본 상태(SSOT)
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
// mode/profile
// --------------------------------------------------
void CL_CT10_ControlManager::setProfileMode(bool p_profileMode) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    
    // [B-2] 사용자 모드 변경 → AutoOff 래치 해제
    _autoOffLatched = false;
    
    useProfileMode = p_profileMode;

    if (!p_profileMode) {
        stopUserProfile();
    } else {
        curScheduleIndex = -1;
        if (runSource == EN_CT10_RUN_SCHEDULE) {
            runSource = EN_CT10_RUN_NONE;
        }
    }

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] setMode(profileMode=%d)", p_profileMode ? 1 : 0);
}

bool CL_CT10_ControlManager::startUserProfileByNo(uint16_t p_profileNo) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    if (!g_A20_config_root.userProfiles) return false;

    ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;

    for (uint8_t v_i = 0; v_i < v_cfg.count; v_i++) {
        const ST_A20_UserProfileItem_t& v_p = v_cfg.items[v_i];
        if (!v_p.enabled) continue;

        if (v_p.profileNo == p_profileNo) {
            // [B-2] 사용자 프로파일 시작 → AutoOff 래치 해제
            _autoOffLatched = false;
            
            runSource                  = EN_CT10_RUN_USER_PROFILE;
            curProfileIndex            = (int8_t)v_i;

            profileSegRt.index         = -1;
            profileSegRt.onPhase       = true;
            profileSegRt.phaseStartMs  = millis();
            profileSegRt.loopCount     = 0;

            initAutoOffFromUserProfile(v_p);
            
            // [B-3] N10 런타임 상태 저장 (profile)
            CL_N10_NvsManager::setRunMode(2, 2);   // mode=USER_PROFILE, source=WEB
            CL_N10_NvsManager::setLastUserProfile((int16_t)p_profileNo);

            // UI 혼선 방지: 스케줄 인덱스는 프로필 구동 시 무의미
            curScheduleIndex = -1;

            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Start UserProfile #%u (%s)",
                               (unsigned)p_profileNo, v_p.name);

            markDirty("state");
            markDirty("metrics");
            return true;
        }
    }

    return false;
}

void CL_CT10_ControlManager::stopUserProfile() {

    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    
    if (runSource != EN_CT10_RUN_USER_PROFILE) return;

    runSource         = EN_CT10_RUN_NONE;
    curProfileIndex   = -1;
    profileSegRt.index = -1;

    sim.stop();
    
    // [B-3] N10 런타임 상태 저장 (OFF)
    CL_N10_NvsManager::setRunMode(0, 2);

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] UserProfile stopped");
}

// --------------------------------------------------
// override
// --------------------------------------------------
void CL_CT10_ControlManager::startOverrideFixed(float p_percent, uint32_t p_seconds) {

    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    
    // [B-2] 사용자 override 시작 → AutoOff 래치 해제
    _autoOffLatched = false;
    
    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active        = true;
    overrideState.useFixed      = true;
    overrideState.fixedPercent  = constrain(p_percent, 0.0f, 100.0f);
    
    // [Policy] durationSec=0 → 20분 기본
    uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
    overrideState.endMs = millis() + (v_sec * 1000UL);
    
    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override FIXED %.1f%% (sec=%lu, applied=%lu)",
                   overrideState.fixedPercent,
                   (unsigned long)p_seconds,
                   (unsigned long)v_sec);
                   
    // [B-3] N10 override 저장 (fixed)
    CL_N10_NvsManager::setOverrideFixed(true, overrideState.fixedPercent);
    
}

void CL_CT10_ControlManager::startOverridePreset(const char* p_presetCode,
                                                 const char* p_styleCode,
                                                 const ST_A20_AdjustDelta_t* p_adj,
                                                 uint32_t p_seconds) {
    if (!g_A20_config_root.windDict) return;

    ST_A20_ResolvedWind_t v_resolved;
    memset(&v_resolved, 0, sizeof(v_resolved));

    bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict,
                                     p_presetCode,
                                     p_styleCode,
                                     p_adj,
                                     v_resolved);

    if (!v_ok || !v_resolved.valid) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] startOverridePreset resolve failed (%s,%s)",
                           p_presetCode ? p_presetCode : "",
                           p_styleCode ? p_styleCode : "");
        return;
    }

    applyManualResolved(v_resolved, p_seconds);
}

void CL_CT10_ControlManager::applyManualResolved(const ST_A20_ResolvedWind_t& p_wind, uint32_t p_seconds) {

    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    
    if (!p_wind.valid) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] applyManual: invalid ResolvedWind");
        return;
    }

    if (p_wind.fixedMode) {
        startOverrideFixed(p_wind.fixedSpeed, p_seconds);
        return;
    }
    
    // [B-2] 사용자 override(resolved) 시작 → AutoOff 래치 해제
    _autoOffLatched = false;

    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active          = true;
    overrideState.useFixed        = false;
    overrideState.resolvedApplied = false;
    overrideState.fixedPercent    = 0.0f;
    overrideState.resolved        = p_wind;
    
    // [Policy] durationSec=0 → 20분 기본
    uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
    overrideState.endMs = millis() + (v_sec * 1000UL);
    
    markDirty("state");
    markDirty("metrics");
    markDirty("chart");

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                   "[CT10] applyManual: preset=%s style=%s (sec=%lu, applied=%lu)",
                   p_wind.presetCode,
                   p_wind.styleCode,
                   (unsigned long)p_seconds,
                   (unsigned long)v_sec);
    
    // [B-3] N10 override 저장 (resolved/preset)
    CL_N10_NvsManager::setOverridePreset(true, p_wind.presetCode, p_wind.styleCode);
}

void CL_CT10_ControlManager::stopOverride() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (!overrideState.active) return;

    memset(&overrideState, 0, sizeof(overrideState));
    
    // [B-3] N10 override 해제
    CL_N10_NvsManager::clearOverride();
    
    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override cleared");
}

// --------------------------------------------------
// tick loop
// --------------------------------------------------

void CL_CT10_ControlManager::tickLoop() {
    // [B-1b] tickLoop 최상단 락 (loopTask 진입점, 재귀 mutex)
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        // [E-3] reloadAll 등 정상 상황에서도 발생 → DEBUG 하향
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    if (!active || !pwm) return;

    unsigned long v_nowMs = millis();
    if (v_nowMs - lastTickMs < S_TICK_MIN_INTERVAL_MS) return;
    lastTickMs = v_nowMs;

    // 0) 이벤트 상태 hold/ack 유지
    // override는 사용자 명시 입력이므로 이벤트 hold보다 우선한다.
    //  - AutoOff/TimeInvalid 직후 override를 시작해도 즉시 반영되어야 함
    //  - override 진입 시 decideRunSource()가 OVERRIDE 상태를 선택 → 이후 tick에서
    //    shouldHoldEventState()는 runCtx.state 조건으로 자연 false가 됨
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
        } else {
            // override가 방금 종료되면 다음 tick에서 decide가 자연 복귀
        }
        maybePushMetricsDirty();
        return;
    }

    if (runCtx.state == EN_CT10_STATE_PROFILE_RUN) {
        // runSource/curProfileIndex는 applyDecision에서 확정됨
        if (tickUserProfile()) {
            sim.tick();
        } else if (sim.active) {
            sim.stop();
        }
        maybePushMetricsDirty();
        return;
    }

    if (runCtx.state == EN_CT10_STATE_SCHEDULE_RUN) {
        // runSource/curScheduleIndex는 applyDecision에서 확정됨
        if (tickSchedule()) {
            sim.tick();
        } else if (sim.active) {
            sim.stop();
        }
        maybePushMetricsDirty();
        return;
    }

    // TIME_INVALID / IDLE / 기타: applyDecision에서 wantSimStop이면 이미 stop 됨
    if (sim.active) sim.stop();
    maybePushMetricsDirty();
}

// --------------------------------------------------
// override tick
// --------------------------------------------------
// [Policy] Override 중 AutoOff
//  - 본 함수는 checkAutoOff를 호출하지 않는다.
//  - Override는 사용자 명시적 개입 → AutoOff 조건보다 우선.
//  - Override 종료 후 원 소스 재진입 시 AutoOff 재평가.
//  - AutoOff(특히 offTemp)가 override 중 무시되어도 팬 가동은 안전 방향.
//
// [E-7] Override 중 Motion
//  - 본 함수는 isMotionBlocked를 호출하지 않는다.
//  - decideRunSource가 Override를 1순위로 반환 → motion 검사 skip.
//  - 정책: 사용자 override > motion presence gate.
//  - Override 종료 후 decide가 motion 재평가 → MOTION_BLOCKED 가능.
// --------------------------------------------------
bool CL_CT10_ControlManager::tickOverride() {
    if (!overrideState.active)
        return false;

    unsigned long v_nowMs = millis();

    // timeout
    if (overrideState.endMs != 0 && v_nowMs >= overrideState.endMs) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override timeout");
        memset(&overrideState, 0, sizeof(overrideState));
        markDirty("state");
        markDirty("metrics");
        return false;
    }

    // fixed
    if (overrideState.useFixed) {
        sim.stop();
        if (pwm) {
            pwm->P10_setDutyPercent(overrideState.fixedPercent);
        }
        return true;
    }

    // resolved
    if (!overrideState.resolved.valid) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] Override resolved invalid, clear");
        memset(&overrideState, 0, sizeof(overrideState));
        markDirty("state");
        markDirty("metrics");
        return false;
    }

    if (!overrideState.resolvedApplied) {
        sim.applyResolvedWind(overrideState.resolved);
        overrideState.resolvedApplied = true;
        markDirty("chart");
    }

    return true;
}

// --------------------------------------------------
// profile tick
// --------------------------------------------------
bool CL_CT10_ControlManager::tickUserProfile() {
    if (runSource != EN_CT10_RUN_USER_PROFILE) return false;
    if (!g_A20_config_root.userProfiles) return false;
    if (curProfileIndex < 0) return false;

    ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
    if ((uint8_t)curProfileIndex >= v_cfg.count) return false;

    ST_A20_UserProfileItem_t& v_profile = v_cfg.items[(uint8_t)curProfileIndex];
    if (!v_profile.enabled || v_profile.segCount == 0) return false;

    // AutoOff
    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    // state/reason은 SSOT(applyDecision)에서만
    
    return tickSegmentSequence(
        v_profile.repeatSegments,
        v_profile.repeatCount,
        v_profile.segments,
        v_profile.segCount,
        profileSegRt
    );
}


// --------------------------------------------------
// schedule tick
// --------------------------------------------------
bool CL_CT10_ControlManager::tickSchedule() {
    if (runSource != EN_CT10_RUN_SCHEDULE) return false;
    if (!g_A20_config_root.schedules) return false;
    if (curScheduleIndex < 0) return false;

    ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
    if ((uint8_t)curScheduleIndex >= v_cfg.count) return false;

    ST_A20_ScheduleItem_t& v_schedule = v_cfg.items[(uint8_t)curScheduleIndex];
    if (!v_schedule.enabled || v_schedule.segCount == 0) return false;

    // AutoOff
    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    // state/reason은 SSOT(applyDecision)에서만
    return tickSegmentSequence(
        v_schedule.repeatSegments,
        v_schedule.repeatCount,
        v_schedule.segments,
        v_schedule.segCount,
        scheduleSegRt
    );
}



// --------------------------------------------------
// segment sequence (schedule)
// --------------------------------------------------
bool CL_CT10_ControlManager::tickSegmentSequence(bool p_repeat,
                                                 uint8_t p_repeatCount,
                                                 ST_A20_ScheduleSegment_t* p_segs,
                                                 uint8_t p_count,
                                                 ST_CT10_SegmentRuntime_t& p_rt) {
    unsigned long v_nowMs = millis();

    if (p_count == 0 || !p_segs) {
        sim.stop();
        return false;
    }

    if (p_rt.index < 0) {
        p_rt.index         = 0;
        p_rt.onPhase       = true;
        p_rt.phaseStartMs  = v_nowMs;
        p_rt.loopCount     = 0;
        applySegmentOn(p_segs[0]);
        return true;
    }

    if ((uint8_t)p_rt.index >= p_count) {
        sim.stop();
        return false;
    }

    ST_A20_ScheduleSegment_t& v_seg = p_segs[(uint8_t)p_rt.index];
    
    // [B-1] self-heal: MOTION_BLOCKED 등으로 sim이 죽어있으면 onPhase에 대해 재적용
    //  - 이전: motion 해제 후 segRt.index >= 0 유지 → tickSegmentSequence 초기 분기 skip
    //         → applySegmentOn 미호출 → sim 영구 정지
    //  - 이후: onPhase && !sim.active 시 즉시 재적용
    //  - phaseStartMs는 유지 (타이머 계속 진행)
    if (p_rt.onPhase && !sim.active) {
        applySegmentOn(v_seg);
        return true;
    }
    
    uint32_t v_onMs  = (uint32_t)v_seg.onMinutes  * 60000UL;
    uint32_t v_offMs = (uint32_t)v_seg.offMinutes * 60000UL;

    if (p_rt.onPhase && v_onMs > 0 && (v_nowMs - p_rt.phaseStartMs) >= v_onMs) {
        p_rt.onPhase      = false;
        p_rt.phaseStartMs = v_nowMs;
        applySegmentOff();
    } else if (!p_rt.onPhase && v_offMs > 0 && (v_nowMs - p_rt.phaseStartMs) >= v_offMs) {
        p_rt.index++;

        if ((uint8_t)p_rt.index >= p_count) {
            if (!p_repeat) {
                sim.stop();
                return true;
            }

            if (p_repeatCount > 0) {
                if (p_rt.loopCount + 1 >= p_repeatCount) {
                    sim.stop();
                    return true;
                }
                p_rt.loopCount++;
            }

            p_rt.index = 0;
        }

        p_rt.onPhase      = true;
        p_rt.phaseStartMs = v_nowMs;
        applySegmentOn(p_segs[(uint8_t)p_rt.index]);
    }

    return true;
}

// --------------------------------------------------
// segment sequence (profile)
// --------------------------------------------------
bool CL_CT10_ControlManager::tickSegmentSequence(bool p_repeat,
                                                 uint8_t p_repeatCount,
                                                 ST_A20_UserProfileSegment_t* p_segs,
                                                 uint8_t p_count,
                                                 ST_CT10_SegmentRuntime_t& p_rt) {
    unsigned long v_nowMs = millis();

    if (p_count == 0 || !p_segs) {
        sim.stop();
        return false;
    }

    if (p_rt.index < 0) {
        p_rt.index         = 0;
        p_rt.onPhase       = true;
        p_rt.phaseStartMs  = v_nowMs;
        p_rt.loopCount     = 0;
        applySegmentOn(p_segs[0]);
        return true;
    }

    if ((uint8_t)p_rt.index >= p_count) {
        sim.stop();
        return false;
    }

    ST_A20_UserProfileSegment_t& v_seg = p_segs[(uint8_t)p_rt.index];
    
    // [B-1] self-heal: MOTION_BLOCKED 등으로 sim이 죽어있으면 onPhase에 대해 재적용
    //  - 이전: motion 해제 후 segRt.index >= 0 유지 → tickSegmentSequence 초기 분기 skip
    //         → applySegmentOn 미호출 → sim 영구 정지
    //  - 이후: onPhase && !sim.active 시 즉시 재적용
    //  - phaseStartMs는 유지 (타이머 계속 진행)
    if (p_rt.onPhase && !sim.active) {
        applySegmentOn(v_seg);
        return true;
    }

    uint32_t v_onMs  = (uint32_t)v_seg.onMinutes  * 60000UL;
    uint32_t v_offMs = (uint32_t)v_seg.offMinutes * 60000UL;

    if (p_rt.onPhase && v_onMs > 0 && (v_nowMs - p_rt.phaseStartMs) >= v_onMs) {
        p_rt.onPhase      = false;
        p_rt.phaseStartMs = v_nowMs;
        applySegmentOff();
    } else if (!p_rt.onPhase && v_offMs > 0 && (v_nowMs - p_rt.phaseStartMs) >= v_offMs) {
        p_rt.index++;

        if ((uint8_t)p_rt.index >= p_count) {
            if (!p_repeat) {
                sim.stop();
                return true;
            }

            if (p_repeatCount > 0) {
                if (p_rt.loopCount + 1 >= p_repeatCount) {
                    sim.stop();
                    return true;
                }
                p_rt.loopCount++;
            }

            p_rt.index = 0;
        }

        p_rt.onPhase      = true;
        p_rt.phaseStartMs = v_nowMs;
        applySegmentOn(p_segs[(uint8_t)p_rt.index]);
    }

    return true;
}

// --------------------------------------------------
// runCtx snapshot helpers (snapshot only)
// --------------------------------------------------
void CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Schedule(const ST_A20_ScheduleItem_t& p_s,
                                                             const ST_A20_ScheduleSegment_t& p_seg) {
    runCtx.activeSchId = p_s.schId;
    runCtx.activeSchNo = p_s.schNo;

    // schedule 구동 시 profile은 0(혼선 방지)
    runCtx.activeProfileNo = 0;

    runCtx.activeSegId = p_seg.segId;
    runCtx.activeSegNo = p_seg.segNo;
}

void CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Profile(const ST_A20_UserProfileItem_t& p_p,
                                                            const ST_A20_UserProfileSegment_t& p_seg) {
    runCtx.activeProfileNo = p_p.profileNo;

    // profile 구동 시 schedule은 0(혼선 방지)
    runCtx.activeSchId = 0;
    runCtx.activeSchNo = 0;

    runCtx.activeSegId = p_seg.segId;
    runCtx.activeSegNo = p_seg.segNo;
}

void CL_CT10_ControlManager::updateRunCtxOnSegmentOff() {
    // 정책: OFF phase에서 seg는 0 (현재 OFF 표현)
    CT10_resetActiveSegSnapshot(runCtx);

    // 이벤트 타임스탬프(최근 변화 표시)
    runCtx.lastDecisionMs = (uint32_t)millis();
    // state/reason/lastStateChangeMs는 여기서 변경 금지
}

// --------------------------------------------------
// apply segment on/off + 로그 개선(이름 출력)
// --------------------------------------------------
void CL_CT10_ControlManager::applySegmentOn(const ST_A20_ScheduleSegment_t& p_seg) {
    // snapshot only (schedule item + seg)
    if (g_A20_config_root.schedules && curScheduleIndex >= 0) {
        ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;
        if ((uint8_t)curScheduleIndex < v_root.count) {
            updateRunCtxOnSegmentOn_Schedule(v_root.items[(uint8_t)curScheduleIndex], p_seg);
        }
    }

    if (!g_A20_config_root.windDict) return;

    if (p_seg.mode == EN_A20_SEG_MODE_FIXED) {
        sim.stop();
        if (pwm) {
            pwm->P10_setDutyPercent(p_seg.fixedSpeed);
        }

        markDirty("state");
        markDirty("chart");

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] SegmentOn(SCH) FIXED duty=%.1f%%", p_seg.fixedSpeed);
        return;
    }

    ST_A20_ResolvedWind_t v_resolved;
    memset(&v_resolved, 0, sizeof(v_resolved));

    bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict,
                                     p_seg.presetCode,
                                     p_seg.styleCode,
                                     &p_seg.adjust,
                                     v_resolved);

    if (v_ok && v_resolved.valid) {
        sim.applyResolvedWind(v_resolved);

        markDirty("state");
        markDirty("chart");

        const char* v_presetName = findPresetNameByCode(p_seg.presetCode);
        const char* v_styleName  = findStyleNameByCode(p_seg.styleCode);

        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[CT10] SegmentOn(SCH) PRESET=%s(%s) STYLE=%s(%s) on=%u off=%u",
                           p_seg.presetCode, v_presetName,
                           p_seg.styleCode,  v_styleName,
                           (unsigned)p_seg.onMinutes,
                           (unsigned)p_seg.offMinutes);
    } else {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] SegmentOn(SCH) resolve failed preset=%s style=%s",
                           p_seg.presetCode,
                           p_seg.styleCode);
    }
}

void CL_CT10_ControlManager::applySegmentOn(const ST_A20_UserProfileSegment_t& p_seg) {
    // snapshot only (profile item + seg)
    if (g_A20_config_root.userProfiles && curProfileIndex >= 0) {
        ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;
        if ((uint8_t)curProfileIndex < v_root.count) {
            updateRunCtxOnSegmentOn_Profile(v_root.items[(uint8_t)curProfileIndex], p_seg);
        }
    }

    if (!g_A20_config_root.windDict) return;

    if (p_seg.mode == EN_A20_SEG_MODE_FIXED) {
        sim.stop();
        if (pwm) {
            pwm->P10_setDutyPercent(p_seg.fixedSpeed);
        }

        markDirty("state");
        markDirty("chart");

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] SegmentOn(PROFILE) FIXED duty=%.1f%%", p_seg.fixedSpeed);
        return;
    }

    ST_A20_ResolvedWind_t v_resolved;
    memset(&v_resolved, 0, sizeof(v_resolved));

    bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict,
                                     p_seg.presetCode,
                                     p_seg.styleCode,
                                     &p_seg.adjust,
                                     v_resolved);

    if (v_ok && v_resolved.valid) {
        sim.applyResolvedWind(v_resolved);

        markDirty("state");
        markDirty("chart");

        const char* v_presetName = findPresetNameByCode(p_seg.presetCode);
        const char* v_styleName  = findStyleNameByCode(p_seg.styleCode);

        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[CT10] SegmentOn(PROFILE) PRESET=%s(%s) STYLE=%s(%s) on=%u off=%u",
                           p_seg.presetCode, v_presetName,
                           p_seg.styleCode,  v_styleName,
                           (unsigned)p_seg.onMinutes,
                           (unsigned)p_seg.offMinutes);
    } else {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] SegmentOn(PROFILE) resolve failed preset=%s style=%s",
                           p_seg.presetCode,
                           p_seg.styleCode);
    }
}

void CL_CT10_ControlManager::applySegmentOff() {
    // runCtx snapshot: seg off
    updateRunCtxOnSegmentOff();

    sim.stop();
    markDirty("state");
    markDirty("chart");
}

