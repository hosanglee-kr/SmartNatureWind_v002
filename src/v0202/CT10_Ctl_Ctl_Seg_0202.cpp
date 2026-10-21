/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_Seg_0202.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 Manager (Segment Execution)
 * ------------------------------------------------------
 * [E-2.4] 이관: tickOverride/tickUserProfile/tickSchedule/
 *               tickSegmentSequence ×2/applySegmentOn ×2/applySegmentOff/
 *               updateRunCtx* ×3
 * [A-1]   반영: self-heal 조건에 mode==PRESET 추가 (FIXED 무한 재호출 차단)
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0202.h"

#include "A25_Com_Utils_0202.h"

// --------------------------------------------------
// runCtx snapshot helper (이 파일 전용)
// --------------------------------------------------
static inline void CT10_resetActiveSegSnapshot(ST_CT10_RunContext_t& p_ctx) {
    p_ctx.activeSegId = 0;
    p_ctx.activeSegNo = 0;
}

// --------------------------------------------------
// override tick
//  [Policy] Override 중 AutoOff/Motion 우회 (사용자 명시 개입 우선)
// --------------------------------------------------
bool CL_CT10_ControlManager::tickOverride() {
    if (!overrideState.active) return false;

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

    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    return tickSegmentSequence(
        v_profile.repeatSegments,
        v_profile.repeatCount,
        v_profile.segments,
        v_profile.segCount,
        profileSegRt);
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

    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    return tickSegmentSequence(
        v_schedule.repeatSegments,
        v_schedule.repeatCount,
        v_schedule.segments,
        v_schedule.segCount,
        scheduleSegRt);
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

    // [A-1] self-heal: PRESET 모드 전용 (FIXED는 sim 미사용 → 무한 재호출 차단)
    if (p_rt.onPhase && !sim.active && v_seg.mode == EN_A20_SEG_MODE_PRESET) {
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

    // [A-1] self-heal: PRESET 모드 전용
    if (p_rt.onPhase && !sim.active && v_seg.mode == EN_A20_SEG_MODE_PRESET) {
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
// runCtx snapshot helpers
// --------------------------------------------------
void CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Schedule(const ST_A20_ScheduleItem_t& p_s,
                                                             const ST_A20_ScheduleSegment_t& p_seg) {
    runCtx.activeSchId = p_s.schId;
    runCtx.activeSchNo = p_s.schNo;
    runCtx.activeProfileNo = 0;
    runCtx.activeSegId = p_seg.segId;
    runCtx.activeSegNo = p_seg.segNo;
}

void CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Profile(const ST_A20_UserProfileItem_t& p_p,
                                                            const ST_A20_UserProfileSegment_t& p_seg) {
    runCtx.activeProfileNo = p_p.profileNo;
    runCtx.activeSchId = 0;
    runCtx.activeSchNo = 0;
    runCtx.activeSegId = p_seg.segId;
    runCtx.activeSegNo = p_seg.segNo;
}

void CL_CT10_ControlManager::updateRunCtxOnSegmentOff() {
    CT10_resetActiveSegSnapshot(runCtx);
    runCtx.lastDecisionMs = (uint32_t)millis();
}

// --------------------------------------------------
// apply segment on/off
// --------------------------------------------------
void CL_CT10_ControlManager::applySegmentOn(const ST_A20_ScheduleSegment_t& p_seg) {
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
                           p_seg.presetCode, p_seg.styleCode);
    }
}

void CL_CT10_ControlManager::applySegmentOn(const ST_A20_UserProfileSegment_t& p_seg) {
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
                           p_seg.presetCode, p_seg.styleCode);
    }
}

void CL_CT10_ControlManager::applySegmentOff() {
    updateRunCtxOnSegmentOff();
    sim.stop();
    markDirty("state");
    markDirty("chart");
}
