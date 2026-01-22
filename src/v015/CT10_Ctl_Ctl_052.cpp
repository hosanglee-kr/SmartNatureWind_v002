/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_052.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v050, Control)
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

#include "CT10_Ctl_051.h"

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

bool CL_CT10_ControlManager::setActiveUserProfile(uint8_t p_profileNo) {
    return instance().startUserProfileByNo(p_profileNo);
}

void CL_CT10_ControlManager::applyManual(const ST_A20_ResolvedWind_t& p_wind) {
    instance().applyManualResolved(p_wind, 0);
}

void CL_CT10_ControlManager::clearManual() {
    instance().stopOverride();
}

bool CL_CT10_ControlManager::reloadAll() {
    bool v_ok = CL_C10_ConfigManager::loadAll(g_A20_config_root);
    if (!v_ok) return false;

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

bool CL_CT10_ControlManager::startUserProfileByNo(uint8_t p_profileNo) {
    if (!g_A20_config_root.userProfiles) return false;

    ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;

    for (uint8_t v_i = 0; v_i < v_cfg.count; v_i++) {
        const ST_A20_UserProfileItem_t& v_p = v_cfg.items[v_i];
        if (!v_p.enabled) continue;

        if (v_p.profileNo == p_profileNo) {
            runSource                  = EN_CT10_RUN_USER_PROFILE;
            curProfileIndex            = (int8_t)v_i;

            profileSegRt.index         = -1;
            profileSegRt.onPhase       = true;
            profileSegRt.phaseStartMs  = millis();
            profileSegRt.loopCount     = 0;

            initAutoOffFromUserProfile(v_p);

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
    if (runSource != EN_CT10_RUN_USER_PROFILE) return;

    runSource         = EN_CT10_RUN_NONE;
    curProfileIndex   = -1;
    profileSegRt.index = -1;

    sim.stop();

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] UserProfile stopped");
}

// --------------------------------------------------
// override
// --------------------------------------------------
void CL_CT10_ControlManager::startOverrideFixed(float p_percent, uint32_t p_seconds) {
    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active        = true;
    overrideState.useFixed      = true;
    overrideState.fixedPercent  = constrain(p_percent, 0.0f, 100.0f);
    overrideState.endMs         = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override FIXED %.1f%% (sec=%lu)",
                       overrideState.fixedPercent, (unsigned long)p_seconds);
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
    if (!p_wind.valid) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] applyManual: invalid ResolvedWind");
        return;
    }

    if (p_wind.fixedMode) {
        startOverrideFixed(p_wind.fixedSpeed, p_seconds);
        return;
    }

    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active          = true;
    overrideState.useFixed        = false;
    overrideState.resolvedApplied = false;
    overrideState.fixedPercent    = 0.0f;
    overrideState.resolved        = p_wind;
    overrideState.endMs           = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

    markDirty("state");
    markDirty("metrics");
    markDirty("chart");

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[CT10] applyManual: preset=%s style=%s (sec=%lu)",
                       p_wind.presetCode,
                       p_wind.styleCode,
                       (unsigned long)p_seconds);
}

void CL_CT10_ControlManager::stopOverride() {
    if (!overrideState.active) return;

    memset(&overrideState, 0, sizeof(overrideState));

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override cleared");
}

// --------------------------------------------------
// tick loop
// --------------------------------------------------
void CL_CT10_ControlManager::tickLoop() {
    if (!active || !pwm) return;

    unsigned long v_nowMs = millis();
    if (v_nowMs - lastTickMs < S_TICK_MIN_INTERVAL_MS) return;
    lastTickMs = v_nowMs;

    // 0) 이벤트 상태 hold/ack 유지
    if (shouldHoldEventState()) {
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

    // Motion blocked (이벤트성 상태 전환)
    if (isMotionBlocked(v_profile.motion)) {
        onMotionBlocked(EN_CT10_REASON_MOTION_NO_PRESENCE);
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

    // Motion blocked (이벤트성 상태 전환)
    if (isMotionBlocked(v_schedule.motion)) {
        onMotionBlocked(EN_CT10_REASON_MOTION_NO_PRESENCE);
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

