/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_Ctl_050.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, Control)
 * ------------------------------------------------------
 * 기능 요약:
 * - begin/tick 및 Override/Profile/Schedule 제어 루프 구현
 * - Segment 시퀀스 오버로드 구현(템플릿 제거)
 * - applySegmentOn 로그 포맷 개선(이름 출력)
 * ------------------------------------------------------
 */

#include "CT10_Control_050.h"

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
	if (!v_ok)
		return false;

	CL_CT10_ControlManager& v_inst = instance();

	v_inst.runSource			   = EN_CT10_RUN_NONE;
	v_inst.curScheduleIndex		   = -1;
	v_inst.curProfileIndex		   = -1;
	v_inst.useProfileMode		   = false;

	memset(&v_inst.overrideState, 0, sizeof(v_inst.overrideState));
	memset(&v_inst.autoOffRt, 0, sizeof(v_inst.autoOffRt));
	memset(&v_inst.scheduleSegRt, 0, sizeof(v_inst.scheduleSegRt));
	memset(&v_inst.profileSegRt, 0, sizeof(v_inst.profileSegRt));
	v_inst.scheduleSegRt.index = -1;
	v_inst.profileSegRt.index  = -1;

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
	memset(&profileSegRt, 0, sizeof(profileSegRt));
	memset(&autoOffRt, 0, sizeof(autoOffRt));
	memset(&runCtx, 0, sizeof(runCtx)); 

	scheduleSegRt.index = -1;
	profileSegRt.index	= -1;

	useProfileMode		= false;
	runSource			= EN_CT10_RUN_NONE;
	lastTickMs			= 0;
	lastMetricsPushMs	= 0;
	
	// ✅ runCtx 기본 상태(SSOT)
	runCtx.state            = EN_CT10_STATE_IDLE;
	runCtx.reason           = EN_CT10_REASON_NONE;
	runCtx.lastDecisionMs   = millis();
	runCtx.lastStateChangeMs= runCtx.lastDecisionMs;

	runCtx.activeSchId      = 0;
	runCtx.activeSchNo      = 0;
	runCtx.activeSegId      = 0;
	runCtx.activeSegNo      = 0;
	runCtx.activeProfileNo  = 0;
	

	sim.begin(p_pwm);

	active = true;

	markDirty("state");
	markDirty("metrics");

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
	if (!g_A20_config_root.userProfiles)
		return false;

	ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;

	for (uint8_t v_i = 0; v_i < v_cfg.count; v_i++) {
		const ST_A20_UserProfileItem_t& v_p = v_cfg.items[v_i];
		if (!v_p.enabled)
			continue;

		if (v_p.profileNo == p_profileNo) {
			runSource				  = EN_CT10_RUN_USER_PROFILE;
			curProfileIndex			  = (int8_t)v_i;
			profileSegRt.index		  = -1;
			profileSegRt.onPhase	  = true;
			profileSegRt.phaseStartMs = millis();
			profileSegRt.loopCount	  = 0;

			initAutoOffFromUserProfile(v_p);

			CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Start UserProfile #%u (%s)", (unsigned)p_profileNo, v_p.name);

			markDirty("state");
			markDirty("metrics");
			return true;
		}
	}

	return false;
}

void CL_CT10_ControlManager::stopUserProfile() {
	if (runSource != EN_CT10_RUN_USER_PROFILE)
		return;

	runSource		   = EN_CT10_RUN_NONE;
	curProfileIndex	   = -1;
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
	overrideState.active	   = true;
	overrideState.useFixed	   = true;
	overrideState.fixedPercent = constrain(p_percent, 0.0f, 100.0f);
	overrideState.endMs		   = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

	markDirty("state");
	markDirty("metrics");

	CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override FIXED %.1f%% (sec=%lu)", overrideState.fixedPercent, (unsigned long)p_seconds);
}

void CL_CT10_ControlManager::startOverridePreset(const char* p_presetCode, const char* p_styleCode, const ST_A20_AdjustDelta_t* p_adj, uint32_t p_seconds) {
	if (!g_A20_config_root.windDict)
		return;

	ST_A20_ResolvedWind_t v_resolved;
	memset(&v_resolved, 0, sizeof(v_resolved));

	bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict, p_presetCode, p_styleCode, p_adj, v_resolved);

	if (!v_ok || !v_resolved.valid) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] startOverridePreset resolve failed (%s,%s)", p_presetCode ? p_presetCode : "", p_styleCode ? p_styleCode : "");
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
	overrideState.active		  = true;
	overrideState.useFixed		  = false;
	overrideState.resolvedApplied = false;
	overrideState.fixedPercent	  = 0.0f;
	overrideState.resolved		  = p_wind;
	overrideState.endMs			  = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

	markDirty("state");
	markDirty("metrics");
	markDirty("chart");

	CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] applyManual: preset=%s style=%s (sec=%lu)", p_wind.presetCode, p_wind.styleCode, (unsigned long)p_seconds);
}

void CL_CT10_ControlManager::stopOverride() {
	if (!overrideState.active)
		return;

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

    // ✅ 이벤트 상태(AUTOOFF_STOPPED / TIME_INVALID) hold/ack 유지 중이면 실행 최소화
    if (shouldHoldEventState()) {
        maybePushMetricsDirty();
        return;
    }

    // 1) Override (시간 불능이어도 override는 동작)
    if (tickOverride()) {
        sim.tick();
        maybePushMetricsDirty();
        return;
    }

    // 2) Profile 전용 모드
    if (useProfileMode) {
        if (runSource == EN_CT10_RUN_USER_PROFILE && tickUserProfile()) {
            sim.tick();
            maybePushMetricsDirty();
        } else if (sim.active) {
            sim.stop();
            maybePushMetricsDirty();
        }
        return;
    }

    // 3) UserProfile
    if (runSource == EN_CT10_RUN_USER_PROFILE && tickUserProfile()) {
        sim.tick();
        maybePushMetricsDirty();
        return;
    }

    // ✅ 4) Schedule 진입 전: 시간 유효성 선체크(SSOT)
    // - 시간 불능이면 스케줄 판정을 못하므로 TIME_INVALID 이벤트 상태로 전환
    // - schedule이 아니더라도, "스케줄 기반 운용"에서 가장 치명적인 상태라 UI에 즉시 표시
    if (!CL_TM10_TimeManager::isTimeValid()) {
        onTimeInvalid(EN_CT10_REASON_TIME_NOT_VALID);
        maybePushMetricsDirty();
        return;
    }

    // 4) Schedule
    if (tickSchedule()) {
        sim.tick();
        maybePushMetricsDirty();
        return;
    }

    // 5) Idle
    if (sim.active) {
        sim.stop();
        maybePushMetricsDirty();
        markDirty("state");
    }

    // idle 상태 기록(SSOT: state/reason)
    runCtx.state  = EN_CT10_STATE_IDLE;
    runCtx.reason = EN_CT10_REASON_NONE;
}

/*
void CL_CT10_ControlManager::tickLoop() {
    if (!active || !pwm) return;

    unsigned long v_nowMs = millis();
    if (v_nowMs - lastTickMs < S_TICK_MIN_INTERVAL_MS) return;
    lastTickMs = v_nowMs;

    // ✅ 이벤트성 상태(AUTOOFF_STOPPED 등) hold/ack 유지 중이면
    // - 바람은 이미 stop 되어있고(runSource NONE)
    // - 불필요한 start/stop 반복을 방지
    // - metrics push는 정상 동작
    if (shouldHoldEventState()) {
        maybePushMetricsDirty();
        return;
    }

    // 1) Override
    if (tickOverride()) {
        sim.tick();
        maybePushMetricsDirty();
        return;
    }

    // 2) Profile 전용 모드
    if (useProfileMode) {
        if (runSource == EN_CT10_RUN_USER_PROFILE && tickUserProfile()) {
            sim.tick();
            maybePushMetricsDirty();
        } else if (sim.active) {
            sim.stop();
            maybePushMetricsDirty();
        }
        return;
    }

    // 3) UserProfile
    if (runSource == EN_CT10_RUN_USER_PROFILE && tickUserProfile()) {
        sim.tick();
        maybePushMetricsDirty();
        return;
    }

    // 4) Schedule
    if (tickSchedule()) {
        sim.tick();
        maybePushMetricsDirty();
        return;
    }

    // 5) Idle
    if (sim.active) {
        sim.stop();
        maybePushMetricsDirty();
        markDirty("state");
    }

    // (선택) idle 상태 기록
    runCtx.state  = EN_CT10_STATE_IDLE;
    runCtx.reason = EN_CT10_REASON_NONE;
}
*/

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

	// Running 상태(선택: segment 적용 직후에 찍히지만, 여기서도 갱신 가능)
    runCtx.state  = EN_CT10_STATE_OVERRIDE;
    runCtx.reason = EN_CT10_REASON_OVERRIDE_ACTIVE;

	return true;
}


bool CL_CT10_ControlManager::tickUserProfile() {
    if (!g_A20_config_root.userProfiles) return false;
    if (curProfileIndex < 0) return false;

    ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
    if ((uint8_t)curProfileIndex >= v_cfg.count) return false;

    ST_A20_UserProfileItem_t& v_profile = v_cfg.items[(uint8_t)curProfileIndex];
    if (!v_profile.enabled || v_profile.segCount == 0) return false;

    // AutoOff (이미 반영된 버전)
    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    // ✅ Motion blocked 이벤트성 상태 전환
    if (isMotionBlocked(v_profile.motion)) {
        onMotionBlocked(EN_CT10_REASON_MOTION_NO_PRESENCE);
        return true;
    }

    // Running 상태(선택: segment 적용 직후에 찍히지만, 여기서도 갱신 가능)
    runCtx.state  = EN_CT10_STATE_PROFILE_RUN;
    runCtx.reason = EN_CT10_REASON_USER_PROFILE_ACTIVE;

    return tickSegmentSequence(
        v_profile.repeatSegments,
        v_profile.repeatCount,
        v_profile.segments,
        v_profile.segCount,
        profileSegRt
    );
}


bool CL_CT10_ControlManager::tickSchedule() {
    // schedules 자체가 없으면: 이유만 세팅하고 false
    if (!g_A20_config_root.schedules) {
        runCtx.state  = EN_CT10_STATE_IDLE;
        runCtx.reason = EN_CT10_REASON_NO_SCHEDULES;
        markDirty("state");
        markDirty("summary");
        return false;
    }

    ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;

    int v_activeIdx = findActiveScheduleIndex(v_cfg, true); // 겹침 허용 기본
    if (v_activeIdx < 0) {
        // 활성 스케줄 없음
        curScheduleIndex = -1;

        // 스케줄이 "없어서" 안 도는 상태를 UI에 명확히
        runCtx.state  = EN_CT10_STATE_IDLE;
        runCtx.reason = EN_CT10_REASON_NO_ACTIVE_SCHEDULE;

        markDirty("state");
        markDirty("summary");
        return false;
    }

    // 스케줄 전환(새 활성 스케줄 시작)
    if (curScheduleIndex != (int8_t)v_activeIdx) {
        curScheduleIndex           = (int8_t)v_activeIdx;
        runSource                  = EN_CT10_RUN_SCHEDULE;
        scheduleSegRt.index        = -1;
        scheduleSegRt.onPhase      = true;
        scheduleSegRt.phaseStartMs = millis();
        scheduleSegRt.loopCount    = 0;

        initAutoOffFromSchedule(v_cfg.items[(uint8_t)curScheduleIndex]);

        markDirty("state");
        markDirty("metrics");
        markDirty("summary");
    }

    ST_A20_ScheduleItem_t& v_schedule = v_cfg.items[(uint8_t)curScheduleIndex];
    if (!v_schedule.enabled || v_schedule.segCount == 0) {
        // 구성은 있지만 비활성/세그 없음 -> 스케줄 구동 불가
        runCtx.state  = EN_CT10_STATE_IDLE;
        runCtx.reason = EN_CT10_REASON_NO_ACTIVE_SCHEDULE;
        markDirty("state");
        markDirty("summary");
        return false;
    }

    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    // Motion blocked 이벤트성 상태 전환
    if (isMotionBlocked(v_schedule.motion)) {
        onMotionBlocked(EN_CT10_REASON_MOTION_NO_PRESENCE);
        return true;
    }

    // schedule running(SSOT: state/reason은 tick에서만)
    runCtx.state  = EN_CT10_STATE_SCHEDULE_RUN;
    runCtx.reason = EN_CT10_REASON_SCHEDULE_ACTIVE;

    return tickSegmentSequence(
        v_schedule.repeatSegments,
        v_schedule.repeatCount,
        v_schedule.segments,
        v_schedule.segCount,
        scheduleSegRt
    );
}

/*
bool CL_CT10_ControlManager::tickSchedule() {
    if (!g_A20_config_root.schedules) return false;

    ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;

    int v_activeIdx = findActiveScheduleIndex(v_cfg, true); // 겹침 허용 기본
    if (v_activeIdx < 0) {
        curScheduleIndex = -1;
        return false;
    }

    if (curScheduleIndex != (int8_t)v_activeIdx) {
        curScheduleIndex           = (int8_t)v_activeIdx;
        runSource                  = EN_CT10_RUN_SCHEDULE;
        scheduleSegRt.index        = -1;
        scheduleSegRt.onPhase      = true;
        scheduleSegRt.phaseStartMs = millis();
        scheduleSegRt.loopCount    = 0;

        initAutoOffFromSchedule(v_cfg.items[(uint8_t)curScheduleIndex]);

        markDirty("state");
        markDirty("metrics");
    }

    ST_A20_ScheduleItem_t& v_schedule = v_cfg.items[(uint8_t)curScheduleIndex];
    if (!v_schedule.enabled || v_schedule.segCount == 0) return false;

    EN_CT10_reason_t v_reason = EN_CT10_REASON_NONE;
    if (checkAutoOff(&v_reason)) {
        onAutoOffTriggered(v_reason);
        return true;
    }

    // ✅ Motion blocked 이벤트성 상태 전환
    if (isMotionBlocked(v_schedule.motion)) {
        onMotionBlocked(EN_CT10_REASON_MOTION_NO_PRESENCE);
        return true;
    }

    runCtx.state  = EN_CT10_STATE_SCHEDULE_RUN;
    runCtx.reason = EN_CT10_REASON_NONE;

    return tickSegmentSequence(
        v_schedule.repeatSegments,
        v_schedule.repeatCount,
        v_schedule.segments,
        v_schedule.segCount,
        scheduleSegRt
    );
}
*/


// --------------------------------------------------
// segment sequence (schedule)
// --------------------------------------------------
bool CL_CT10_ControlManager::tickSegmentSequence(bool p_repeat, uint8_t p_repeatCount, ST_A20_ScheduleSegment_t* p_segs, uint8_t p_count, ST_CT10_SegmentRuntime_t& p_rt) {
	unsigned long v_nowMs = millis();

	if (p_count == 0 || !p_segs) {
		sim.stop();
		return false;
	}

	if (p_rt.index < 0) {
		p_rt.index		  = 0;
		p_rt.onPhase	  = true;
		p_rt.phaseStartMs = v_nowMs;
		p_rt.loopCount	  = 0;
		applySegmentOn(p_segs[0]);
		return true;
	}

	if ((uint8_t)p_rt.index >= p_count) {
		sim.stop();
		return false;
	}

	ST_A20_ScheduleSegment_t& v_seg	  = p_segs[(uint8_t)p_rt.index];

	uint32_t				  v_onMs  = (uint32_t)v_seg.onMinutes * 60000UL;
	uint32_t				  v_offMs = (uint32_t)v_seg.offMinutes * 60000UL;

	if (p_rt.onPhase && v_onMs > 0 && v_nowMs - p_rt.phaseStartMs >= v_onMs) {
		p_rt.onPhase	  = false;
		p_rt.phaseStartMs = v_nowMs;
		applySegmentOff();
	} else if (!p_rt.onPhase && v_offMs > 0 && v_nowMs - p_rt.phaseStartMs >= v_offMs) {
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

		p_rt.onPhase	  = true;
		p_rt.phaseStartMs = v_nowMs;
		applySegmentOn(p_segs[(uint8_t)p_rt.index]);
	}

	return true;
}

// --------------------------------------------------
// segment sequence (profile)
// --------------------------------------------------
bool CL_CT10_ControlManager::tickSegmentSequence(bool p_repeat, uint8_t p_repeatCount, ST_A20_UserProfileSegment_t* p_segs, uint8_t p_count, ST_CT10_SegmentRuntime_t& p_rt) {
	unsigned long v_nowMs = millis();

	if (p_count == 0 || !p_segs) {
		sim.stop();
		return false;
	}

	if (p_rt.index < 0) {
		p_rt.index		  = 0;
		p_rt.onPhase	  = true;
		p_rt.phaseStartMs = v_nowMs;
		p_rt.loopCount	  = 0;
		applySegmentOn(p_segs[0]);
		return true;
	}

	if ((uint8_t)p_rt.index >= p_count) {
		sim.stop();
		return false;
	}

	ST_A20_UserProfileSegment_t& v_seg	 = p_segs[(uint8_t)p_rt.index];

	uint32_t					 v_onMs	 = (uint32_t)v_seg.onMinutes * 60000UL;
	uint32_t					 v_offMs = (uint32_t)v_seg.offMinutes * 60000UL;

	if (p_rt.onPhase && v_onMs > 0 && v_nowMs - p_rt.phaseStartMs >= v_onMs) {
		p_rt.onPhase	  = false;
		p_rt.phaseStartMs = v_nowMs;
		applySegmentOff();
	} else if (!p_rt.onPhase && v_offMs > 0 && v_nowMs - p_rt.phaseStartMs >= v_offMs) {
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

		p_rt.onPhase	  = true;
		p_rt.phaseStartMs = v_nowMs;
		applySegmentOn(p_segs[(uint8_t)p_rt.index]);
	}

	return true;
}



// --------------------------------------------------
// runCtx snapshot helpers (SSOT: state/reason는 tick/applyDecision에서만)
// --------------------------------------------------
void CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Schedule(
    const ST_A20_ScheduleItem_t& p_s,
    const ST_A20_ScheduleSegment_t& p_seg
) {
    // ✅ Snapshot only (state/reason은 tick/applyDecision에서만)
    runCtx.activeSchId = p_s.schId;
    runCtx.activeSchNo = p_s.schNo;

    // profile 값은 의미 없으므로 0
    runCtx.activeProfileNo = 0;

    runCtx.activeSegId = p_seg.segId;
    runCtx.activeSegNo = p_seg.segNo;

    // ✅ "최근 변화" 시각화용 (운영/WS)
    runCtx.lastDecisionMs = millis();
}


void CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Profile(
    const ST_A20_UserProfileItem_t& p_p,
    const ST_A20_UserProfileSegment_t& p_seg
) {
    // ✅ Snapshot only
    runCtx.activeProfileNo = p_p.profileNo;

    // schedule은 의미 없으므로 0
    runCtx.activeSchId = 0;
    runCtx.activeSchNo = 0;

    runCtx.activeSegId = p_seg.segId;
    runCtx.activeSegNo = p_seg.segNo;

    // ✅ "최근 변화" 시각화용 (운영/WS)
    runCtx.lastDecisionMs = millis();
}



void CL_CT10_ControlManager::updateRunCtxOnSegmentOff() {
    // ✅ Off phase 정책: seg는 0으로 리셋 (UI에서 “지금은 OFF phase” 표현 가능)
    // schedule/profile 자체가 활성인지는 tick의 state/runSource로 판단
    CT10_resetActiveSegSnapshot(runCtx);

    // ✅ 이벤트 타임스탬프만 갱신(최근 변화 표시)
    runCtx.lastDecisionMs = millis();
    // state/reason/lastStateChangeMs는 여기서 변경 금지
}



// --------------------------------------------------
// apply segment on/off + 로그 개선(이름 출력)
// --------------------------------------------------
void CL_CT10_ControlManager::applySegmentOn(const ST_A20_ScheduleSegment_t& p_seg) {
    // ✅ snapshot only (schedule item + seg)
    bool v_snapshotOk = false;
    if (g_A20_config_root.schedules && curScheduleIndex >= 0) {
        ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;
        if ((uint8_t)curScheduleIndex < v_root.count) {
            updateRunCtxOnSegmentOn_Schedule(v_root.items[(uint8_t)curScheduleIndex], p_seg);
            v_snapshotOk = true;
        }
    }
    if (!v_snapshotOk) {
        // 스케줄 컨텍스트가 깨진 경우 UI 혼선 방지
        runCtx.activeSchId = 0;
        runCtx.activeSchNo = 0;
        runCtx.activeSegId = 0;
        runCtx.activeSegNo = 0;
        runCtx.activeProfileNo = 0;
        runCtx.lastDecisionMs = millis();
    }

    if (!g_A20_config_root.windDict) return;

    if (p_seg.mode == EN_A20_SEG_MODE_FIXED) {
        sim.stop();
        if (pwm) pwm->P10_setDutyPercent(p_seg.fixedSpeed);

        markDirty("state");
        markDirty("chart");

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] SegmentOn(SCH) FIXED duty=%.1f%%", p_seg.fixedSpeed);
        return;
    }

    ST_A20_ResolvedWind_t v_resolved;
    memset(&v_resolved, 0, sizeof(v_resolved));

    bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict, p_seg.presetCode, p_seg.styleCode, &p_seg.adjust, v_resolved);

    if (v_ok && v_resolved.valid) {
        sim.applyResolvedWind(v_resolved);

        markDirty("state");
        markDirty("chart");

        const char* v_presetName = findPresetNameByCode(p_seg.presetCode);
        const char* v_styleName  = findStyleNameByCode(p_seg.styleCode);

        CL_D10_Logger::log(EN_L10_LOG_INFO,
            "[CT10] SegmentOn(SCH) PRESET=%s(%s) STYLE=%s(%s) on=%u off=%u",
            p_seg.presetCode, v_presetName, p_seg.styleCode, v_styleName,
            (unsigned)p_seg.onMinutes, (unsigned)p_seg.offMinutes
        );
    } else {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] SegmentOn(SCH) resolve failed preset=%s style=%s", p_seg.presetCode, p_seg.styleCode);
    }
}



void CL_CT10_ControlManager::applySegmentOn(const ST_A20_UserProfileSegment_t& p_seg) {
    // ✅ snapshot only (profile item + seg)
    bool v_snapshotOk = false;
    if (g_A20_config_root.userProfiles && curProfileIndex >= 0) {
        ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;
        if ((uint8_t)curProfileIndex < v_root.count) {
            updateRunCtxOnSegmentOn_Profile(v_root.items[(uint8_t)curProfileIndex], p_seg);
            v_snapshotOk = true;
        }
    }
    if (!v_snapshotOk) {
        runCtx.activeProfileNo = 0;
        runCtx.activeSchId = 0;
        runCtx.activeSchNo = 0;
        runCtx.activeSegId = 0;
        runCtx.activeSegNo = 0;
        runCtx.lastDecisionMs = millis();
    }

    if (!g_A20_config_root.windDict) return;

    if (p_seg.mode == EN_A20_SEG_MODE_FIXED) {
        sim.stop();
        if (pwm) pwm->P10_setDutyPercent(p_seg.fixedSpeed);

        markDirty("state");
        markDirty("chart");

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] SegmentOn(PROFILE) FIXED duty=%.1f%%", p_seg.fixedSpeed);
        return;
    }

    ST_A20_ResolvedWind_t v_resolved;
    memset(&v_resolved, 0, sizeof(v_resolved));

    bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict, p_seg.presetCode, p_seg.styleCode, &p_seg.adjust, v_resolved);

    if (v_ok && v_resolved.valid) {
        sim.applyResolvedWind(v_resolved);

        markDirty("state");
        markDirty("chart");

        const char* v_presetName = findPresetNameByCode(p_seg.presetCode);
        const char* v_styleName  = findStyleNameByCode(p_seg.styleCode);

        CL_D10_Logger::log(EN_L10_LOG_INFO,
            "[CT10] SegmentOn(PROFILE) PRESET=%s(%s) STYLE=%s(%s) on=%u off=%u",
            p_seg.presetCode, v_presetName, p_seg.styleCode, v_styleName,
            (unsigned)p_seg.onMinutes, (unsigned)p_seg.offMinutes
        );
    } else {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] SegmentOn(PROFILE) resolve failed preset=%s style=%s", p_seg.presetCode, p_seg.styleCode);
    }
}



void CL_CT10_ControlManager::applySegmentOff() {
    // ✅ runCtx snapshot: seg off
	updateRunCtxOnSegmentOff();
	
	sim.stop();
	markDirty("state");
	markDirty("chart");
}
