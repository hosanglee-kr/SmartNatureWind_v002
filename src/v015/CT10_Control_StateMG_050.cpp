// CT10_Control_StateMG_050.cpp



#include "CT10_Control_042.h"



// ======================================================
// [CT10] Minimal State-Management Patch Set (Function Unit Full)
// - 추가 목적: "지금 CT10이 왜/무엇을/어떤 소스로 제어 중인지"를 SSOT로 관리
// - 포함: 1) decideRunSource()  2) applyDecision()  3) exportStateJson() 확장
// - 전제:
//   * TM10 제공 함수 사용:
//       - CL_TM10_TimeManager::isTimeValid()
//       - CL_TM10_TimeManager::getLocalTime(struct tm& out)
//   * A40_Com_Func_052.h 는 전체 include (strlcpy/memset/A40_parseHHMMtoMin_24h 등 사용 가능)
//
// ⚠️ 아래 코드는 "함수 단위 완전체"이며,
//    헤더(CT10_Control_042.h)에 추가해야 하는 타입/멤버는 맨 아래에 따로 제공.
// ======================================================




// --------------------------------------------------
// [CT10] decideRunSource()
// - 우선순위: Override > (ProfileMode)ProfileRun/Idle > UserProfile > Schedule > Idle
// - 여기서는 "Motion/AUTO-OFF"는 'tickRun 단계에서 발생'하는 이벤트이므로
//   decide에서는 "현재 조건으로 무엇을 시도할지"까지만 결정.
// - 단, "시간 미유효" 같은 운영 차단 조건은 여기서 TIME_INVALID로 결정 가능.
// --------------------------------------------------
ST_CT10_Decision_t CL_CT10_ControlManager::decideRunSource() {
	ST_CT10_Decision_t v_d;
	memset(&v_d, 0, sizeof(v_d));

	// 기본값
	v_d.nextState		  = EN_CT10_STATE_IDLE;
	v_d.reason			  = EN_CT10_REASON_NONE;
	v_d.nextRunSource	  = EN_CT10_RUN_NONE;
	v_d.nextScheduleIndex = -1;
	v_d.nextProfileIndex  = -1;
	v_d.wantSimStop		  = false;
	v_d.wantResetSegRt	  = false;
	v_d.wantResetAutoOff  = false;

	// --------------------------------------------------
	// 0) 시간 유효성(운영 차단)
	//   - 스케줄/오프타임 기반은 시간 없으면 의미가 없으므로 TIME_INVALID 상태로 관리
	//   - 단, Override/Profile FIXED 같은 건 시간 없어도 동작 가능할 수 있음
	//   - 최소 패치 정책: "스케줄 선택"만 시간 유효 필요로 본다.
	// --------------------------------------------------
	bool v_timeValid = true;
	{
		// TM10 제공
		v_timeValid = CL_TM10_TimeManager::isTimeValid();
	}

	// --------------------------------------------------
	// 1) Override
	// --------------------------------------------------
	if (overrideState.active) {
		v_d.nextState	 = EN_CT10_STATE_OVERRIDE;
		v_d.reason		 = EN_CT10_REASON_OVERRIDE_ACTIVE;
		v_d.nextRunSource = runSource; // runSource는 override랑 독립 유지(원복 위해)
		// override는 tickOverride()에서 실제 반영/timeout 처리
		return v_d;
	}

	// --------------------------------------------------
	// 2) ProfileMode 전용
	//   - ProfileMode 켜진 경우 schedule은 항상 배제
	// --------------------------------------------------
	if (useProfileMode) {
		if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
			v_d.nextState	  = EN_CT10_STATE_PROFILE_RUN;
			v_d.reason		  = EN_CT10_REASON_PROFILE_MODE;
			v_d.nextRunSource  = EN_CT10_RUN_USER_PROFILE;
			v_d.nextProfileIndex = curProfileIndex;
			return v_d;
		}

		// ProfileMode인데 실행할 프로파일 없으면 Idle
		v_d.nextState	 = EN_CT10_STATE_IDLE;
		v_d.reason		 = EN_CT10_REASON_PROFILE_MODE;
		v_d.nextRunSource = EN_CT10_RUN_NONE;
		// profileMode에서는 schedule 금지
		return v_d;
	}

	// --------------------------------------------------
	// 3) UserProfile (schedule과 별개로 실행)
	// --------------------------------------------------
	if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
		v_d.nextState	  = EN_CT10_STATE_PROFILE_RUN;
		v_d.reason		  = EN_CT10_REASON_USER_PROFILE_ACTIVE;
		v_d.nextRunSource  = EN_CT10_RUN_USER_PROFILE;
		v_d.nextProfileIndex = curProfileIndex;
		return v_d;
	}

	// --------------------------------------------------
	// 4) Schedule
	//   - 시간 유효해야만 선택 가능(운영)
	// --------------------------------------------------
	if (!v_timeValid) {
		v_d.nextState	 = EN_CT10_STATE_TIME_INVALID;
		v_d.reason		 = EN_CT10_REASON_TIME_NOT_VALID;
		v_d.nextRunSource = EN_CT10_RUN_NONE;
		v_d.wantSimStop	 = true;
		return v_d;
	}

	if (!g_A20_config_root.schedules) {
		v_d.nextState	 = EN_CT10_STATE_IDLE;
		v_d.reason		 = EN_CT10_REASON_NO_SCHEDULES;
		v_d.nextRunSource = EN_CT10_RUN_NONE;
		return v_d;
	}

	{
		ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;

		// ✅ 겹침 허용 기본 (이미 findActiveScheduleIndex에 파라미터 추가 완료)
		int v_activeIdx = findActiveScheduleIndex(v_cfg, true /* overlapAllowed default */);

		if (v_activeIdx >= 0) {
			v_d.nextState			= EN_CT10_STATE_SCHEDULE_RUN;
			v_d.reason				= EN_CT10_REASON_SCHEDULE_ACTIVE;
			v_d.nextRunSource		= EN_CT10_RUN_SCHEDULE;
			v_d.nextScheduleIndex	= (int8_t)v_activeIdx;
			return v_d;
		}
	}

	// --------------------------------------------------
	// 5) Idle
	// --------------------------------------------------
	v_d.nextState	 = EN_CT10_STATE_IDLE;
	v_d.reason		 = EN_CT10_REASON_NO_ACTIVE_SCHEDULE;
	v_d.nextRunSource = EN_CT10_RUN_NONE;
	return v_d;
}


// --------------------------------------------------
// [CT10] 상태 전환 시 내부 컨텍스트 업데이트(공통)
// --------------------------------------------------
static const char* CT10_stateToString(EN_CT10_state_t p_s) {
	switch (p_s) {
		case EN_CT10_STATE_IDLE:		  return "IDLE";
		case EN_CT10_STATE_OVERRIDE:	  return "OVERRIDE";
		case EN_CT10_STATE_PROFILE_RUN:  return "PROFILE_RUN";
		case EN_CT10_STATE_SCHEDULE_RUN: return "SCHEDULE_RUN";
		case EN_CT10_STATE_MOTION_BLOCKED:return "MOTION_BLOCKED";
		case EN_CT10_STATE_AUTOOFF_STOPPED:return "AUTOOFF_STOPPED";
		case EN_CT10_STATE_TIME_INVALID: return "TIME_INVALID";
		default:						  return "UNKNOWN";
	}
}
static const char* CT10_reasonToString(EN_CT10_reason_t p_r) {
	switch (p_r) {
		case EN_CT10_REASON_NONE:				return "NONE";
		case EN_CT10_REASON_OVERRIDE_ACTIVE:	return "OVERRIDE_ACTIVE";
		case EN_CT10_REASON_PROFILE_MODE:		return "PROFILE_MODE";
		case EN_CT10_REASON_USER_PROFILE_ACTIVE:return "USER_PROFILE_ACTIVE";
		case EN_CT10_REASON_SCHEDULE_ACTIVE:	return "SCHEDULE_ACTIVE";
		case EN_CT10_REASON_NO_ACTIVE_SCHEDULE: return "NO_ACTIVE_SCHEDULE";
		case EN_CT10_REASON_NO_SCHEDULES:		return "NO_SCHEDULES";
		case EN_CT10_REASON_TIME_NOT_VALID:		return "TIME_NOT_VALID";
		case EN_CT10_REASON_MOTION_NO_PRESENCE: return "MOTION_NO_PRESENCE";
		case EN_CT10_REASON_AUTOOFF_TIMER:		return "AUTOOFF_TIMER";
		case EN_CT10_REASON_AUTOOFF_TIME:		return "AUTOOFF_TIME";
		case EN_CT10_REASON_AUTOOFF_TEMP:		return "AUTOOFF_TEMP";
		default:								return "UNKNOWN";
	}
}

// --------------------------------------------------
// [CT10] applyDecision()
// - decide 결과에 따라 runSource/인덱스/런타임을 "결정적으로" 맞춤
// - 상태 변화 시 dirty/state/metrics/summary를 강제 세팅
// - segment/autoff 초기화는 "source 전환"에서만 수행(불필요 재초기화 방지)
// --------------------------------------------------
void CL_CT10_ControlManager::applyDecision(const ST_CT10_Decision_t& p_d) {
	// 0) override는 "상태 표기"만 하고 runSource를 강제로 바꾸지 않음
	//    (override 종료 후 원래 source로 자연 복귀 가능하게 유지)
	if (p_d.nextState == EN_CT10_STATE_OVERRIDE) {
		bool v_changed = false;

		if (runCtx.state != p_d.nextState) v_changed = true;
		if (runCtx.reason != p_d.reason)   v_changed = true;

		runCtx.state			  = p_d.nextState;
		runCtx.reason			  = p_d.reason;
		runCtx.lastDecisionMs	  = millis();
		if (v_changed) {
			runCtx.lastStateChangeMs = runCtx.lastDecisionMs;
			markDirty("state");
			markDirty("metrics");
			markDirty("summary");
		}
		return;
	}

	// 1) 현재 runCtx vs next 비교
	bool v_stateChanged	 = (runCtx.state != p_d.nextState) || (runCtx.reason != p_d.reason);
	bool v_sourceChanged = (runSource != p_d.nextRunSource) ||
						   (curScheduleIndex != p_d.nextScheduleIndex) ||
						   (curProfileIndex != p_d.nextProfileIndex);

	// 2) TIME_INVALID/IDLE로 갈 때 sim 정지 정책
	if (p_d.wantSimStop) {
		if (sim.active) sim.stop();
	}

	// 3) source 전환이면 세그먼트 런타임/autoOff 런타임 초기화/재설정
	if (v_sourceChanged) {
		// 공통: 이전 소스에서 빠져나올 때 sim 정지(운영 안전)
		if (sim.active) {
			sim.stop();
		}

		// runSource/idx 적용
		runSource		= p_d.nextRunSource;
		curScheduleIndex = p_d.nextScheduleIndex;
		curProfileIndex  = p_d.nextProfileIndex;

		// seg rt reset (필요한 것만)
		if (runSource == EN_CT10_RUN_SCHEDULE) {
			scheduleSegRt.index		 = -1;
			scheduleSegRt.onPhase	 = true;
			scheduleSegRt.phaseStartMs = millis();
			scheduleSegRt.loopCount	 = 0;

			// autoOff init
			if (g_A20_config_root.schedules && curScheduleIndex >= 0) {
				ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
				if ((uint8_t)curScheduleIndex < v_cfg.count) {
					initAutoOffFromSchedule(v_cfg.items[(uint8_t)curScheduleIndex]);
				} else {
					memset(&autoOffRt, 0, sizeof(autoOffRt));
				}
			} else {
				memset(&autoOffRt, 0, sizeof(autoOffRt));
			}

		} else if (runSource == EN_CT10_RUN_USER_PROFILE) {
			profileSegRt.index		  = -1;
			profileSegRt.onPhase	  = true;
			profileSegRt.phaseStartMs = millis();
			profileSegRt.loopCount	  = 0;

			if (g_A20_config_root.userProfiles && curProfileIndex >= 0) {
				ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
				if ((uint8_t)curProfileIndex < v_cfg.count) {
					initAutoOffFromUserProfile(v_cfg.items[(uint8_t)curProfileIndex]);
				} else {
					memset(&autoOffRt, 0, sizeof(autoOffRt));
				}
			} else {
				memset(&autoOffRt, 0, sizeof(autoOffRt));
			}
		} else {
			// NONE
			memset(&autoOffRt, 0, sizeof(autoOffRt));
			scheduleSegRt.index = -1;
			profileSegRt.index	= -1;
		}
	}

	// 4) runCtx 업데이트
	runCtx.state		   = p_d.nextState;
	runCtx.reason		   = p_d.reason;
	runCtx.lastDecisionMs  = millis();
	if (v_stateChanged || v_sourceChanged) {
		runCtx.lastStateChangeMs = runCtx.lastDecisionMs;
	}

	// 5) runCtx에 "현재 선택된 개체 정보" 캐시(웹 상태 출력/디버그용)
	runCtx.activeSchId = 0;
	runCtx.activeSchNo = 0;
	runCtx.activeSegId = 0;
	runCtx.activeSegNo = 0;
	runCtx.activeProfileNo = 0;

	if (runSource == EN_CT10_RUN_SCHEDULE && g_A20_config_root.schedules && curScheduleIndex >= 0) {
		ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
		if ((uint8_t)curScheduleIndex < v_cfg.count) {
			const ST_A20_ScheduleItem_t& v_s = v_cfg.items[(uint8_t)curScheduleIndex];
			runCtx.activeSchId = v_s.schId;
			runCtx.activeSchNo = v_s.schNo;

			// seg rt index가 유효하면 segId/segNo도 캐시 (아직 시작 전이면 0)
			if (scheduleSegRt.index >= 0 && scheduleSegRt.index < (int8_t)v_s.segCount) {
				const ST_A20_ScheduleSegment_t& v_seg = v_s.segments[(uint8_t)scheduleSegRt.index];
				runCtx.activeSegId = v_seg.segId;
				runCtx.activeSegNo = v_seg.segNo;
			}
		}
	} else if (runSource == EN_CT10_RUN_USER_PROFILE && g_A20_config_root.userProfiles && curProfileIndex >= 0) {
		ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
		if ((uint8_t)curProfileIndex < v_cfg.count) {
			const ST_A20_UserProfileItem_t& v_p = v_cfg.items[(uint8_t)curProfileIndex];
			runCtx.activeProfileNo = v_p.profileNo;

			if (profileSegRt.index >= 0 && profileSegRt.index < (int8_t)v_p.segCount) {
				const ST_A20_UserProfileSegment_t& v_seg = v_p.segments[(uint8_t)profileSegRt.index];
				runCtx.activeSegId = v_seg.segId;
				runCtx.activeSegNo = v_seg.segNo;
			}
		}
	}

	// 6) Dirty 처리 정책
	if (v_stateChanged || v_sourceChanged) {
		markDirty("state");
		markDirty("metrics");
		markDirty("summary");
		// chart는 실제 바람 적용 시점(applySegmentOn/off, override apply)에서만 올리는 정책 유지
	}

	// (로그는 과하지 않게, 상태 변화시에만)
	if (v_stateChanged || v_sourceChanged) {
		CL_D10_Logger::log(EN_L10_LOG_INFO,
			"[CT10] State=%s Reason=%s Source=%u schIdx=%d profIdx=%d",
			CT10_stateToString(runCtx.state),
			CT10_reasonToString(runCtx.reason),
			(unsigned)runSource,
			(int)curScheduleIndex,
			(int)curProfileIndex
		);
	}
}


// --------------------------------------------------
// [CT10] exportStateJson()
// - 웹/WS 상태에서 "왜 멈췄는지/무엇이 도는지"가 보이도록 확장
// - JsonDocument 단일 사용, containsKey/createNested* 금지 준수
// --------------------------------------------------
void CL_CT10_ControlManager::exportStateJson(JsonDocument& p_doc) {
	JsonObject v_root = p_doc.to<JsonObject>();

	JsonObject v_ctl = v_root["control"].to<JsonObject>();

	// 1) Core flags
	v_ctl["active"]			= active;
	v_ctl["profileMode"]	= useProfileMode;

	// 2) State/Reason (string + enum 둘 다)
	v_ctl["state"]			= CT10_stateToString(runCtx.state);
	v_ctl["reason"]			= CT10_reasonToString(runCtx.reason);
	v_ctl["stateCode"]		= (uint8_t)runCtx.state;
	v_ctl["reasonCode"]		= (uint8_t)runCtx.reason;

	v_ctl["runSource"]		= (uint8_t)runSource;

	v_ctl["lastDecisionMs"]		= (uint32_t)runCtx.lastDecisionMs;
	v_ctl["lastStateChangeMs"]	= (uint32_t)runCtx.lastStateChangeMs;

	// 3) Time status (TM10)
	{
		JsonObject v_time = v_ctl["time"].to<JsonObject>();
		v_time["valid"] = CL_TM10_TimeManager::isTimeValid();

		struct tm v_tm;
		memset(&v_tm, 0, sizeof(v_tm));
		if (CL_TM10_TimeManager::getLocalTime(v_tm)) {
			v_time["hour"] = (int)v_tm.tm_hour;
			v_time["min"]  = (int)v_tm.tm_min;
			v_time["wday"] = (int)v_tm.tm_wday; // 0=Sun
		} else {
			v_time["hour"] = -1;
			v_time["min"]  = -1;
			v_time["wday"] = -1;
		}
	}

	// 4) Selected Schedule/Profile snapshot
	{
		JsonObject v_sch = v_ctl["schedule"].to<JsonObject>();
		v_sch["index"] = (int)curScheduleIndex;
		v_sch["schId"] = (uint8_t)runCtx.activeSchId;
		v_sch["schNo"] = (uint16_t)runCtx.activeSchNo;

		// name은 가능하면 넣되, 포인터/인덱스 방어
		const char* v_name = "";
		if (runSource == EN_CT10_RUN_SCHEDULE &&
			g_A20_config_root.schedules &&
			curScheduleIndex >= 0) {
			ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
			if ((uint8_t)curScheduleIndex < v_cfg.count) {
				v_name = v_cfg.items[(uint8_t)curScheduleIndex].name;
			}
		}
		v_sch["name"] = v_name;
	}

	{
		JsonObject v_prof = v_ctl["profile"].to<JsonObject>();
		v_prof["index"]		= (int)curProfileIndex;
		v_prof["profileNo"] = (uint8_t)runCtx.activeProfileNo;

		const char* v_name = "";
		if (runSource == EN_CT10_RUN_USER_PROFILE &&
			g_A20_config_root.userProfiles &&
			curProfileIndex >= 0) {
			ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
			if ((uint8_t)curProfileIndex < v_cfg.count) {
				v_name = v_cfg.items[(uint8_t)curProfileIndex].name;
			}
		}
		v_prof["name"] = v_name;
	}

	// 5) Segment runtime snapshot
	{
		JsonObject v_seg = v_ctl["segment"].to<JsonObject>();

		// 공통 캐시
		v_seg["segId"] = (uint8_t)runCtx.activeSegId;
		v_seg["segNo"] = (uint16_t)runCtx.activeSegNo;

		// scheduleSegRt / profileSegRt 둘 다 노출(디버그에 유리)
		JsonObject v_srt = v_seg["scheduleRt"].to<JsonObject>();
		v_srt["index"]		= (int)scheduleSegRt.index;
		v_srt["onPhase"]	= scheduleSegRt.onPhase;
		v_srt["phaseStartMs"]= (uint32_t)scheduleSegRt.phaseStartMs;
		v_srt["loopCount"]	= (uint8_t)scheduleSegRt.loopCount;

		JsonObject v_prt = v_seg["profileRt"].to<JsonObject>();
		v_prt["index"]		= (int)profileSegRt.index;
		v_prt["onPhase"]	= profileSegRt.onPhase;
		v_prt["phaseStartMs"]= (uint32_t)profileSegRt.phaseStartMs;
		v_prt["loopCount"]	= (uint8_t)profileSegRt.loopCount;
	}

	// 6) Override snapshot
	{
		JsonObject v_ov = v_ctl["override"].to<JsonObject>();
		v_ov["active"] = overrideState.active;
		v_ov["useFixed"] = overrideState.useFixed;
		v_ov["remainSec"] = (uint32_t)calcOverrideRemainSec();
		v_ov["fixedPercent"] = overrideState.fixedPercent;

		// resolved 요약(민감/과다 출력 방지: code만)
		if (!overrideState.useFixed && overrideState.resolved.valid) {
			v_ov["presetCode"] = overrideState.resolved.presetCode;
			v_ov["styleCode"]  = overrideState.resolved.styleCode;
		} else {
			v_ov["presetCode"] = "";
			v_ov["styleCode"]  = "";
		}
	}

	// 7) AutoOff runtime snapshot
	{
		JsonObject v_ao = v_ctl["autoOffRt"].to<JsonObject>();
		v_ao["timerArmed"]		 = autoOffRt.timerArmed;
		v_ao["timerStartMs"]	 = (uint32_t)autoOffRt.timerStartMs;
		v_ao["timerMinutes"]	 = (uint32_t)autoOffRt.timerMinutes;

		v_ao["offTimeEnabled"]	 = autoOffRt.offTimeEnabled;
		v_ao["offTimeMinutes"]	 = (uint16_t)autoOffRt.offTimeMinutes;

		v_ao["offTempEnabled"]	 = autoOffRt.offTempEnabled;
		v_ao["offTemp"]			 = autoOffRt.offTemp;
	}

	// 8) Dirty flags (상태 확인용)
	{
		JsonObject v_dirty = v_ctl["dirty"].to<JsonObject>();
		v_dirty["state"]	= _dirtyState;
		v_dirty["metrics"]	= _dirtyMetrics;
		v_dirty["chart"]	= _dirtyChart;
		v_dirty["summary"]	= _dirtySummary;
	}
}

