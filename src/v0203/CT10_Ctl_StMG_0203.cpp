/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_StMG_0203.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (State Machine)
 * ------------------------------------------------------
 * [Phase 2] checkTriggers() 기반 Pause/Stop 우선순위 재조정
 *  - MOTION_BLOCKED 분기 완전 제거 (checkTriggers로 이전)
 *  - applyDecision에서 nextPauseReason 반영
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"
#include "N10_NvsManager_0203.h"

// ======================================================
// 상태/이유 문자열
// ======================================================
const char* CT10_stateToString(EN_CT10_state_t p_s) {
    switch (p_s) {
        case EN_CT10_STATE_IDLE:            return "IDLE";
        case EN_CT10_STATE_OVERRIDE:        return "OVERRIDE";
        case EN_CT10_STATE_PROFILE_RUN:     return "PROFILE_RUN";
        case EN_CT10_STATE_SCHEDULE_RUN:    return "SCHEDULE_RUN";
        case EN_CT10_STATE_AUTOOFF_STOPPED: return "AUTOOFF_STOPPED";
        case EN_CT10_STATE_TIME_INVALID:    return "TIME_INVALID";
        case EN_CT10_STATE_ENV_PAUSED:      return "ENV_PAUSED";
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
        case EN_CT10_REASON_USER_STOP:           return "USER_STOP";
        case EN_CT10_REASON_TEMP_LOW_STOP:       return "TEMP_LOW_STOP";
        case EN_CT10_REASON_DI_LOW_STOP:         return "DI_LOW_STOP";
        default:                                 return "UNKNOWN";
    }
}

// ======================================================
// decideRunSource()
// ═══════════════════════════════════════════════════════════
// [Phase 2] decideRunSource() 우선순위 (`15_01` §5.1 반영):
//  [1] _autoOffLatched           → AUTOOFF_STOPPED
//  [2] ENV_PAUSED                → checkTriggers() (Stop/지속/재개)
//  [3] 실행 중(OVERRIDE/PROFILE/SCHEDULE) → checkTriggers() (Stop/Pause)
//  [4] overrideState.active      → OVERRIDE
//  [5] useProfileMode + profile  → PROFILE_RUN (미선택 시 IDLE)
//  [6] UserProfile               → PROFILE_RUN
//  [7] TIME_INVALID              → TIME_INVALID
//  [8] Schedule 매칭             → SCHEDULE_RUN
//  [9] IDLE
// ═══════════════════════════════════════════════════════════
ST_CT10_Decision_t CL_CT10_ControlManager::decideRunSource() {
    ST_CT10_Decision_t v_d;
    memset(&v_d, 0, sizeof(v_d));

    v_d.nextState         = EN_CT10_STATE_IDLE;
    v_d.reason            = EN_CT10_REASON_NONE;
    v_d.nextPauseReason   = EN_CT10_PAUSE_NONE;
    v_d.nextRunSource     = EN_CT10_RUN_NONE;
    v_d.nextScheduleIndex = -1;
    v_d.nextProfileIndex  = -1;
    v_d.wantSimStop       = false;

    // [1] AutoOff 래치 (최우선)
    if (_autoOffLatched) {
        v_d.nextState     = EN_CT10_STATE_AUTOOFF_STOPPED;
        v_d.reason        = runCtx.reason;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    // [2] ENV_PAUSED 또는 [3] 활성 실행 중 통합 트리거 검사 (OVERRIDE 포함)
    bool v_hasRunningContext = (runCtx.state == EN_CT10_STATE_ENV_PAUSED) ||
                               overrideState.active ||
                               (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) ||
                               (runSource == EN_CT10_RUN_SCHEDULE && curScheduleIndex >= 0);
    if (v_hasRunningContext) {
        EN_CT10_pause_t  v_pauseOut = EN_CT10_PAUSE_NONE;
        EN_CT10_reason_t v_stopOut  = EN_CT10_REASON_NONE;
        if (checkTriggers(&v_pauseOut, &v_stopOut)) {
            if (v_stopOut != EN_CT10_REASON_NONE) {
                v_d.nextState       = EN_CT10_STATE_AUTOOFF_STOPPED;
                v_d.reason          = v_stopOut;
                v_d.nextRunSource   = EN_CT10_RUN_NONE;
                v_d.wantSimStop     = true;
                return v_d;
            }
            if (v_pauseOut != EN_CT10_PAUSE_NONE) {
                v_d.nextState       = EN_CT10_STATE_ENV_PAUSED;
                v_d.reason          = runCtx.reason;
                v_d.nextPauseReason = v_pauseOut;
                v_d.nextRunSource   = runSource;
                v_d.wantSimStop     = true;
                return v_d;
            }
        }
        if (runCtx.state == EN_CT10_STATE_ENV_PAUSED) {
            CL_D10_Logger::log(EN_L10_LOG_INFO,
                "[CT10] PAUSE resumed (was reason=%u)", (unsigned)runCtx.pauseReason);
        }
    }

    // [4] Override (Pause 조건 해소 후 OVERRIDE로 자동 복귀 포함)
    if (overrideState.active) {
        v_d.nextState     = EN_CT10_STATE_OVERRIDE;
        v_d.reason        = EN_CT10_REASON_OVERRIDE_ACTIVE;
        v_d.nextRunSource = runSource;
        return v_d;
    }

    // [5] Profile mode
    if (useProfileMode && runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
        v_d.nextState        = EN_CT10_STATE_PROFILE_RUN;
        v_d.reason           = EN_CT10_REASON_PROFILE_MODE;
        v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
        v_d.nextProfileIndex = curProfileIndex;
        return v_d;
    }

    // useProfileMode + profile 미선택 → IDLE (F-5)
    if (useProfileMode) {
        v_d.nextState     = EN_CT10_STATE_IDLE;
        v_d.reason        = EN_CT10_REASON_PROFILE_MODE;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    // [6] UserProfile (schedule과 별개 실행)
    if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
        v_d.nextState        = EN_CT10_STATE_PROFILE_RUN;
        v_d.reason           = EN_CT10_REASON_USER_PROFILE_ACTIVE;
        v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
        v_d.nextProfileIndex = curProfileIndex;
        return v_d;
    }

    // [7] TimeInvalid
    if (!CL_TM10_TimeManager::isTimeValid()) {
        v_d.nextState     = EN_CT10_STATE_TIME_INVALID;
        v_d.reason        = EN_CT10_REASON_TIME_NOT_VALID;
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    // [8] Schedule
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
            v_d.nextState         = EN_CT10_STATE_SCHEDULE_RUN;
            v_d.reason            = EN_CT10_REASON_SCHEDULE_ACTIVE;
            v_d.nextRunSource     = EN_CT10_RUN_SCHEDULE;
            v_d.nextScheduleIndex = (int8_t)v_activeIdx;
            return v_d;
        }
    }

    // [9] Idle
    v_d.nextState     = EN_CT10_STATE_IDLE;
    v_d.reason        = EN_CT10_REASON_NO_ACTIVE_SCHEDULE;
    v_d.nextRunSource = EN_CT10_RUN_NONE;
    return v_d;
}

// ======================================================
// applyDecision()
// ═══════════════════════════════════════════════════════════
//  - ENV_PAUSED 진입 시 nextPauseReason 반영
//  - AUTOOFF_STOPPED 진입 시 onTriggerStop 호출
// ======================================================
void CL_CT10_ControlManager::applyDecision(const ST_CT10_Decision_t& p_d) {
    // ─── [M2 수정] ENV_PAUSED 해소 시 pauseReason 리셋 및 복귀 처리 (최우선) ───
    if (runCtx.state == EN_CT10_STATE_ENV_PAUSED && p_d.nextState != EN_CT10_STATE_ENV_PAUSED) {
        if (triggerRt.pauseStartedMs != 0) {
            triggerRt.pausedAccumMs += (uint32_t)millis() - triggerRt.pauseStartedMs;
            triggerRt.pauseStartedMs = 0;
        }
        runCtx.pauseReason  = EN_CT10_PAUSE_NONE;
        runCtx.pauseSinceMs = 0;
        if (p_d.nextState == EN_CT10_STATE_OVERRIDE) {
            overrideState.resolvedApplied = false; // 시뮬레이터 즉시 재기동
        }
        CL_D10_Logger::log(EN_L10_LOG_INFO,
            "[CT10] ENV_PAUSED → %s (pauseReason cleared)",
            CT10_stateToString(p_d.nextState));
    }

    // ─── ENV_PAUSED 진입/유지 처리 (overrideState.active 유지, pauseStartedMs 기록) ───
    if (p_d.nextState == EN_CT10_STATE_ENV_PAUSED) {
        if (runCtx.state != EN_CT10_STATE_ENV_PAUSED) {
            uint32_t now = (uint32_t)millis();
            runCtx.pauseReason  = p_d.nextPauseReason;
            runCtx.pauseSinceMs = now;
            if (triggerRt.pauseStartedMs == 0) {
                triggerRt.pauseStartedMs = now;
            }
            onTriggerPause(p_d.nextPauseReason);
        } else if (p_d.nextPauseReason != EN_CT10_PAUSE_NONE) {
            runCtx.pauseReason = p_d.nextPauseReason;
        }
        runCtx.state          = p_d.nextState;
        runCtx.reason         = p_d.reason;
        runCtx.lastDecisionMs = (uint32_t)millis();
        return;
    }

    // ─── AUTOOFF_STOPPED 진입 처리 ───
    if (p_d.nextState == EN_CT10_STATE_AUTOOFF_STOPPED) {
        if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED) {
            overrideState.active = false;
            onTriggerStop(p_d.reason);
            memset(&triggerRt, 0, sizeof(triggerRt));
        }
        return;
    }

    // ─── OVERRIDE 진입 처리 (기존 유지) ───
    if (p_d.nextState == EN_CT10_STATE_OVERRIDE) {
        bool v_changed = false;
        if (runCtx.state != p_d.nextState) v_changed = true;
        if (runCtx.reason != p_d.reason) v_changed = true;

        runCtx.state          = p_d.nextState;
        runCtx.reason         = p_d.reason;
        runCtx.lastDecisionMs = (uint32_t)millis();

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

    // ─── 일반 상태 전이 ───
    bool v_stateChanged  = (runCtx.state != p_d.nextState) || (runCtx.reason != p_d.reason);
    bool v_sourceChanged = (runSource != p_d.nextRunSource) ||
                           (curScheduleIndex != p_d.nextScheduleIndex) ||
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
            scheduleSegRt.phaseStartMs = (unsigned long)millis();
            scheduleSegRt.loopCount    = 0;

            if (g_A20_config_root.schedules && curScheduleIndex >= 0) {
                ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
                if ((uint8_t)curScheduleIndex < v_cfg.count) {
                    initRuleFromSchedule(v_cfg.items[(uint8_t)curScheduleIndex]);
                    runCtx.activeSchId     = v_cfg.items[(uint8_t)curScheduleIndex].schId;
                    runCtx.activeSchNo     = v_cfg.items[(uint8_t)curScheduleIndex].schNo;
                    runCtx.activeProfileNo = 0;

                    CL_N10_NvsManager::setRunMode(1, 0);
                    CL_N10_NvsManager::setLastSchedule(
                        (int16_t)v_cfg.items[(uint8_t)curScheduleIndex].schNo);
                } else {
                    memset(&triggerRt, 0, sizeof(triggerRt));
                }
            } else {
                memset(&triggerRt, 0, sizeof(triggerRt));
            }

        } else if (runSource == EN_CT10_RUN_USER_PROFILE) {
            profileSegRt.index        = -1;
            profileSegRt.onPhase      = true;
            profileSegRt.phaseStartMs = (unsigned long)millis();
            profileSegRt.loopCount    = 0;

            if (g_A20_config_root.userProfiles && curProfileIndex >= 0) {
                ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
                if ((uint8_t)curProfileIndex < v_cfg.count) {
                    initRuleFromProfile(v_cfg.items[(uint8_t)curProfileIndex]);
                    runCtx.activeProfileNo = v_cfg.items[(uint8_t)curProfileIndex].profileNo;
                    runCtx.activeSchId     = 0;
                    runCtx.activeSchNo     = 0;
                } else {
                    memset(&triggerRt, 0, sizeof(triggerRt));
                }
            } else {
                memset(&triggerRt, 0, sizeof(triggerRt));
            }
        } else {
            memset(&triggerRt, 0, sizeof(triggerRt));
            scheduleSegRt.index = -1;
            profileSegRt.index  = -1;
        }
    }

    runCtx.state          = p_d.nextState;
    runCtx.reason         = p_d.reason;
    runCtx.lastDecisionMs = (uint32_t)millis();
    if (v_stateChanged || v_sourceChanged) {
        runCtx.lastStateChangeMs = runCtx.lastDecisionMs;
    }

    // TIME_INVALID 진입 시 hold + seg 리셋
    if (v_stateChanged && runCtx.state == EN_CT10_STATE_TIME_INVALID) {
        runCtx.stateHoldUntilMs = runCtx.lastDecisionMs + S_EVENT_HOLD_MS;
        runCtx.stateAckRequired = false;
        runCtx.activeSegId      = 0;
        runCtx.activeSegNo      = 0;
    }

    if (v_stateChanged || v_sourceChanged) {
        markDirty("state");
        markDirty("metrics");
        markDirty("summary");

        CL_D10_Logger::log(EN_L10_LOG_INFO,
            "[CT10] State=%s Reason=%s Source=%u schIdx=%d profIdx=%d",
            CT10_stateToString(runCtx.state),
            CT10_reasonToString(runCtx.reason),
            (unsigned)runSource,
            (int)curScheduleIndex,
            (int)curProfileIndex);
    }
}
