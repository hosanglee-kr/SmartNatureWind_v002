/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_StMG_0202.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (State Machine)
 * ------------------------------------------------------
 * [Batch F-5] decideRunSource() profile fall-through 차단
 *  - useProfileMode=true + profile 미선택 시 명시적 IDLE 반환
 *  - schedule 진입 경로 완전 차단
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0202.h"
#include "N10_NvsManager_0202.h"

// ======================================================
// 상태/이유 문자열
// ======================================================
const char* CT10_stateToString(EN_CT10_state_t p_s) {
    switch (p_s) {
        case EN_CT10_STATE_IDLE:            return "IDLE";
        case EN_CT10_STATE_OVERRIDE:        return "OVERRIDE";
        case EN_CT10_STATE_PROFILE_RUN:     return "PROFILE_RUN";
        case EN_CT10_STATE_SCHEDULE_RUN:    return "SCHEDULE_RUN";
        case EN_CT10_STATE_MOTION_BLOCKED:  return "MOTION_BLOCKED";
        case EN_CT10_STATE_AUTOOFF_STOPPED: return "AUTOOFF_STOPPED";
        case EN_CT10_STATE_TIME_INVALID:    return "TIME_INVALID";
        default:                            return "UNKNOWN";
    }
}

const char* CT10_reasonToString(EN_CT10_reason_t p_r) {
    switch (p_r) {
        case EN_CT10_REASON_NONE:                return "NONE";
        case EN_CT10_REASON_OVERRIDE_ACTIVE:     return "OVERRIDE_ACTIVE";
        case EN_CT10_REASON_PROFILE_MODE:        return "PROFILE_MODE";
        case EN_CT10_REASON_USER_PROFILE_ACTIVE: return "USER_PROFILE_ACTIVE";
        case EN_CT10_REASON_SCHEDULE_ACTIVE:     return "SCHEDULE_ACTIVE";
        case EN_CT10_REASON_NO_ACTIVE_SCHEDULE:  return "NO_ACTIVE_SCHEDULE";
        case EN_CT10_REASON_NO_SCHEDULES:        return "NO_SCHEDULES";
        case EN_CT10_REASON_TIME_NOT_VALID:      return "TIME_NOT_VALID";
        case EN_CT10_REASON_MOTION_NO_PRESENCE:  return "MOTION_NO_PRESENCE";
        case EN_CT10_REASON_AUTOOFF_TIMER:       return "AUTOOFF_TIMER";
        case EN_CT10_REASON_AUTOOFF_TIME:        return "AUTOOFF_TIME";
        case EN_CT10_REASON_AUTOOFF_TEMP:        return "AUTOOFF_TEMP";
        default:                                 return "UNKNOWN";
    }
}

// ======================================================
// decideRunSource()
// ======================================================
ST_CT10_Decision_t CL_CT10_ControlManager::decideRunSource() {
    ST_CT10_Decision_t v_d;
    memset(&v_d, 0, sizeof(v_d));

    v_d.nextState         = EN_CT10_STATE_IDLE;
    v_d.reason            = EN_CT10_REASON_NONE;
    v_d.nextRunSource     = EN_CT10_RUN_NONE;
    v_d.nextScheduleIndex = -1;
    v_d.nextProfileIndex  = -1;
    v_d.wantSimStop       = false;
    v_d.wantResetSegRt    = false;
    v_d.wantResetAutoOff  = false;

    // 0) 시간 유효성
    bool v_timeValid = CL_TM10_TimeManager::isTimeValid();

    // 1) Override 최우선
    if (overrideState.active) {
        v_d.nextState     = EN_CT10_STATE_OVERRIDE;
        v_d.reason        = EN_CT10_REASON_OVERRIDE_ACTIVE;
        v_d.nextRunSource = runSource;
        return v_d;
    }

    // 2) AutoOff 래치
    if (_autoOffLatched) {
        v_d.nextState     = EN_CT10_STATE_AUTOOFF_STOPPED;
        v_d.reason        = runCtx.reason;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    // --------------------------------------------------
    // 3) ProfileMode (schedule 완전 배제)
    //  [F-5] profile mode + 미선택 시 명시적 IDLE 반환
    // --------------------------------------------------
    if (useProfileMode) {
        if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
            // profile motion 검사
            if (g_A20_config_root.userProfiles) {
                ST_A20_UserProfilesRoot_t& v_up = *g_A20_config_root.userProfiles;
                if ((uint8_t)curProfileIndex < v_up.count) {
                    if (isMotionBlocked(v_up.items[(uint8_t)curProfileIndex].motion)) {
                        v_d.nextState        = EN_CT10_STATE_MOTION_BLOCKED;
                        v_d.reason           = EN_CT10_REASON_MOTION_NO_PRESENCE;
                        v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
                        v_d.nextProfileIndex = curProfileIndex;
                        v_d.wantSimStop      = true;
                        return v_d;
                    }
                }
            }
            v_d.nextState        = EN_CT10_STATE_PROFILE_RUN;
            v_d.reason           = EN_CT10_REASON_PROFILE_MODE;
            v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
            v_d.nextProfileIndex = curProfileIndex;
            return v_d;
        }

        // [F-5] profile 모드인데 선택된 profile 없음 → IDLE
        v_d.nextState     = EN_CT10_STATE_IDLE;
        v_d.reason        = EN_CT10_REASON_PROFILE_MODE;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    // 4) UserProfile (schedule과 별개 실행)
    if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
        if (g_A20_config_root.userProfiles) {
            ST_A20_UserProfilesRoot_t& v_up = *g_A20_config_root.userProfiles;
            if ((uint8_t)curProfileIndex < v_up.count) {
                if (isMotionBlocked(v_up.items[(uint8_t)curProfileIndex].motion)) {
                    v_d.nextState        = EN_CT10_STATE_MOTION_BLOCKED;
                    v_d.reason           = EN_CT10_REASON_MOTION_NO_PRESENCE;
                    v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
                    v_d.nextProfileIndex = curProfileIndex;
                    v_d.wantSimStop      = true;
                    return v_d;
                }
            }
        }
        v_d.nextState        = EN_CT10_STATE_PROFILE_RUN;
        v_d.reason           = EN_CT10_REASON_USER_PROFILE_ACTIVE;
        v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
        v_d.nextProfileIndex = curProfileIndex;
        return v_d;
    }

    // 5) Schedule
    if (!v_timeValid) {
        v_d.nextState     = EN_CT10_STATE_TIME_INVALID;
        v_d.reason        = EN_CT10_REASON_TIME_NOT_VALID;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    if (!g_A20_config_root.schedules) {
        v_d.nextState     = EN_CT10_STATE_IDLE;
        v_d.reason        = EN_CT10_REASON_NO_SCHEDULES;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        return v_d;
    }

    {
        ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;

        int v_activeIdx = findActiveScheduleIndex(v_cfg, true);

        if (v_activeIdx >= 0) {
            if ((uint8_t)v_activeIdx < v_cfg.count) {
                ST_A20_ScheduleItem_t& v_s = v_cfg.items[(uint8_t)v_activeIdx];
                if (isMotionBlocked(v_s.motion)) {
                    v_d.nextState         = EN_CT10_STATE_MOTION_BLOCKED;
                    v_d.reason            = EN_CT10_REASON_MOTION_NO_PRESENCE;
                    v_d.nextRunSource     = EN_CT10_RUN_SCHEDULE;
                    v_d.nextScheduleIndex = (int8_t)v_activeIdx;
                    v_d.wantSimStop       = true;
                    return v_d;
                }
            }
            v_d.nextState         = EN_CT10_STATE_SCHEDULE_RUN;
            v_d.reason            = EN_CT10_REASON_SCHEDULE_ACTIVE;
            v_d.nextRunSource     = EN_CT10_RUN_SCHEDULE;
            v_d.nextScheduleIndex = (int8_t)v_activeIdx;
            return v_d;
        }
    }

    // 6) Idle
    v_d.nextState     = EN_CT10_STATE_IDLE;
    v_d.reason        = EN_CT10_REASON_NO_ACTIVE_SCHEDULE;
    v_d.nextRunSource = EN_CT10_RUN_NONE;
    return v_d;
}

// ======================================================
// applyDecision()
// ======================================================
void CL_CT10_ControlManager::applyDecision(const ST_CT10_Decision_t& p_d) {
    // OVERRIDE 분기
    if (p_d.nextState == EN_CT10_STATE_OVERRIDE) {
        bool v_changed = false;
        if (runCtx.state != p_d.nextState) v_changed = true;
        if (runCtx.reason != p_d.reason) v_changed = true;

        runCtx.state          = p_d.nextState;
        runCtx.reason         = p_d.reason;
        runCtx.lastDecisionMs = millis();

        if (v_changed) {
            runCtx.stateHoldUntilMs = 0;
            runCtx.stateAckRequired = false;

            runCtx.lastStateChangeMs = runCtx.lastDecisionMs;
            markDirty("state");
            markDirty("metrics");
            markDirty("summary");
        }
        return;
    }

    bool v_stateChanged  = (runCtx.state != p_d.nextState) || (runCtx.reason != p_d.reason);
    bool v_sourceChanged = (runSource != p_d.nextRunSource) || (curScheduleIndex != p_d.nextScheduleIndex) ||
                           (curProfileIndex != p_d.nextProfileIndex);

    if (p_d.wantSimStop) {
        if (sim.active) sim.stop();
    }

    if (v_sourceChanged) {
        if (sim.active) sim.stop();

        runSource        = p_d.nextRunSource;
        curScheduleIndex = p_d.nextScheduleIndex;
        curProfileIndex  = p_d.nextProfileIndex;

        if (runSource == EN_CT10_RUN_SCHEDULE) {
            scheduleSegRt.index        = -1;
            scheduleSegRt.onPhase      = true;
            scheduleSegRt.phaseStartMs = millis();
            scheduleSegRt.loopCount    = 0;

            if (g_A20_config_root.schedules && curScheduleIndex >= 0) {
                ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
                if ((uint8_t)curScheduleIndex < v_cfg.count) {
                    initAutoOffFromSchedule(v_cfg.items[(uint8_t)curScheduleIndex]);

                    runCtx.activeSchId     = v_cfg.items[(uint8_t)curScheduleIndex].schId;
                    runCtx.activeSchNo     = v_cfg.items[(uint8_t)curScheduleIndex].schNo;
                    runCtx.activeProfileNo = 0;

                    CL_N10_NvsManager::setRunMode(1, 0);
                    CL_N10_NvsManager::setLastSchedule((int16_t)v_cfg.items[(uint8_t)curScheduleIndex].schNo);
                } else {
                    memset(&autoOffRt, 0, sizeof(autoOffRt));
                }
            } else {
                memset(&autoOffRt, 0, sizeof(autoOffRt));
            }

        } else if (runSource == EN_CT10_RUN_USER_PROFILE) {
            profileSegRt.index        = -1;
            profileSegRt.onPhase      = true;
            profileSegRt.phaseStartMs = millis();
            profileSegRt.loopCount    = 0;

            if (g_A20_config_root.userProfiles && curProfileIndex >= 0) {
                ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
                if ((uint8_t)curProfileIndex < v_cfg.count) {
                    initAutoOffFromUserProfile(v_cfg.items[(uint8_t)curProfileIndex]);

                    runCtx.activeProfileNo = v_cfg.items[(uint8_t)curProfileIndex].profileNo;
                    runCtx.activeSchId     = 0;
                    runCtx.activeSchNo     = 0;
                } else {
                    memset(&autoOffRt, 0, sizeof(autoOffRt));
                }
            } else {
                memset(&autoOffRt, 0, sizeof(autoOffRt));
            }
        } else {
            memset(&autoOffRt, 0, sizeof(autoOffRt));
            scheduleSegRt.index = -1;
            profileSegRt.index  = -1;
        }
    }

    runCtx.state          = p_d.nextState;
    runCtx.reason         = p_d.reason;
    runCtx.lastDecisionMs = millis();
    if (v_stateChanged || v_sourceChanged) {
        runCtx.lastStateChangeMs = runCtx.lastDecisionMs;
    }

    // TIME_INVALID 진입 시 hold + seg 리셋
    if (v_stateChanged && runCtx.state == EN_CT10_STATE_TIME_INVALID) {
        runCtx.stateHoldUntilMs = runCtx.lastDecisionMs + S_EVENT_HOLD_MS;
        runCtx.stateAckRequired = false;
        runCtx.activeSegId = 0;
        runCtx.activeSegNo = 0;
    }

    if (v_stateChanged || v_sourceChanged) {
        markDirty("state");
        markDirty("metrics");
        markDirty("summary");
    }

    if (v_stateChanged || v_sourceChanged) {
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[CT10] State=%s Reason=%s Source=%u schIdx=%d profIdx=%d",
                           CT10_stateToString(runCtx.state),
                           CT10_reasonToString(runCtx.reason),
                           (unsigned)runSource,
                           (int)curScheduleIndex,
                           (int)curProfileIndex);
    }
}
