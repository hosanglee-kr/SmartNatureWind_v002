/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_IO_043.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, IO)
 * ------------------------------------------------------
 * 기능 요약:
 * - CT10 제어 상태 / 요약 / 메트릭 / 차트 JSON Export 구현
 * - sim JSON/차트는 S10 책임을 우선하고 CT10은 meta만 병합
 * ------------------------------------------------------
 */

#include "CT10_Control_042.h"

// --------------------------------------------------
// 내부 Helper: safe JsonObject 확보 (타입 꼬임 방지)
// --------------------------------------------------
static JsonObject CT10_ensureObject(JsonVariant p_v) {
    if (p_v.is<JsonObject>()) {
        return p_v.as<JsonObject>();
    }
    return p_v.to<JsonObject>();
}

// --------------------------------------------------
// 싱글톤
// --------------------------------------------------
CL_CT10_ControlManager& CL_CT10_ControlManager::instance() {
    static CL_CT10_ControlManager v_inst;
    return v_inst;
}

void CL_CT10_ControlManager::toJson(JsonDocument& p_doc) {
    instance().exportStateJson_v02(p_doc);
}

void CL_CT10_ControlManager::toChartJson(JsonDocument& p_doc, bool p_diffOnly) {
     instance().exportChartJson(p_doc, p_diffOnly);
}

// --------------------------------------------------
// [CT10] exportStateJson_v02()
// - 웹/WS 상태에서 "왜 멈췄는지/무엇이 도는지"가 보이도록 확장
// - JsonDocument 단일 사용, containsKey/createNested* 금지 준수
// --------------------------------------------------
void CL_CT10_ControlManager::exportStateJson_v01(JsonDocument& p_doc) {
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



void CL_CT10_ControlManager::exportStateJson_v01(JsonDocument& p_doc) {
    // control root
    JsonObject v_control        = CT10_ensureObject(p_doc["control"]);
    v_control["active"]         = active;
    v_control["useProfileMode"] = useProfileMode;
    v_control["runSource"]      = (int)runSource;
    v_control["scheduleIdx"]    = curScheduleIndex;
    v_control["profileIdx"]     = curProfileIndex;

    // override
    JsonObject v_override   = CT10_ensureObject(v_control["override"]);
    v_override["active"]    = overrideState.active;
    v_override["useFixed"]  = overrideState.useFixed;
    v_override["resolved"]  = (!overrideState.useFixed && overrideState.active);
    v_override["remainSec"] = calcOverrideRemainSec();

    if (overrideState.active) {
        if (overrideState.useFixed) {
            v_override["fixedPercent"] = overrideState.fixedPercent;
        } else if (overrideState.resolved.valid) {
            // preset/style은 빈 문자열일 수 있으므로 그대로 Export (UI에서 처리 가능)
            v_override["presetCode"] = overrideState.resolved.presetCode;
            v_override["styleCode"]  = overrideState.resolved.styleCode;
        }
    }

    // autoOff
    JsonObject v_autoOff        = CT10_ensureObject(v_control["autoOff"]);
    v_autoOff["timerArmed"]     = autoOffRt.timerArmed;
    v_autoOff["timerMinutes"]   = autoOffRt.timerMinutes;
    v_autoOff["offTimeEnabled"] = autoOffRt.offTimeEnabled;
    v_autoOff["offTimeMinutes"] = autoOffRt.offTimeMinutes;
    v_autoOff["offTempEnabled"] = autoOffRt.offTempEnabled;
    v_autoOff["offTemp"]        = autoOffRt.offTemp;

    // pwm
    v_control["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

    // sim 상태(책임: S10) - S10이 p_doc 내부 sim 구조를 채움
    // CT10은 sim 호출 트리거 역할만 수행(구조/키는 S10에서 유지)
    sim.toJson(p_doc);
}



// void CL_CT10_ControlManager::toChartJson(JsonDocument& p_doc, bool p_diffOnly) {
void CL_CT10_ControlManager::exportChartJson(JsonDocument& p_doc, bool p_diffOnly) {


    // 1) S10 차트 생성 (p_doc["sim"] 구조는 S10이 책임)
    sim.toChartJson(p_doc, p_diffOnly);

    // 2) CT10 메타 병합: p_doc["sim"]["meta"] 안전 확보
    JsonObject v_sim  = CT10_ensureObject(p_doc["sim"]);
    JsonObject v_meta = CT10_ensureObject(v_sim["meta"]);

    v_meta["pwmDuty"]   = pwm ? pwm->P10_getDutyPercent() : 0.0f;
    v_meta["active"]    = active;
    v_meta["runSource"] = (int)runSource;
    v_meta["override"]  = overrideState.active ? (overrideState.useFixed ? "fixed" : "resolved") : "none";
}

void CL_CT10_ControlManager::exportSummaryJson(JsonDocument& p_doc) {
    JsonObject v_sum = CT10_ensureObject(p_doc["summary"]);

	// 1. Phase 인덱스 범위 방어 및 매핑 (A20_Const_Sch_044.h 기반)
    uint8_t v_phaseIdx = static_cast<uint8_t>(sim.phase);
    if (v_phaseIdx >= EN_A20_WIND_PHASE_COUNT) {
        v_phaseIdx = static_cast<uint8_t>(EN_A20_WIND_PHASE_CALM);
    }

	// // phase index range 방어
    // uint8_t v_phase = (uint8_t)sim.phase;
    // if (v_phase >= (uint8_t)EN_A20_WIND_PHASE_COUNT) v_phase = 0;

    // 2. 구조체 배열 G_A20_WindPhase_Arr에서 코드명 추출
    // UI에서 "CALM", "NORMAL" 등을 원하면 .code를, "Calm", "Normal"을 원하면 .name 사용
    v_sum["phase"]       = G_A20_WindPhase_Arr[v_phaseIdx].code;
    //v_sum["phase"]       = g_A20_WEATHER_PHASE_NAMES_Arr[v_phase];

    v_sum["wind"]        = sim.currentWindSpeed;
    v_sum["target"]      = sim.targetWindSpeed;
    v_sum["pwmDuty"]     = pwm ? pwm->P10_getDutyPercent() : 0.0f;
    v_sum["override"]    = overrideState.active;
    v_sum["useProfile"]  = useProfileMode;
    v_sum["scheduleIdx"] = curScheduleIndex;
    v_sum["profileIdx"]  = curProfileIndex;
}

void CL_CT10_ControlManager::exportMetricsJson(JsonDocument& p_doc) {
    JsonObject v_m = CT10_ensureObject(p_doc["metrics"]);

    v_m["active"]         = active;
    v_m["runSource"]      = (int)runSource;
    v_m["useProfileMode"] = useProfileMode;
    v_m["scheduleIdx"]    = curScheduleIndex;
    v_m["profileIdx"]     = curProfileIndex;

    v_m["overrideActive"] = overrideState.active;
    v_m["overrideFixed"]  = overrideState.useFixed;
    v_m["overrideRemain"] = calcOverrideRemainSec();

    v_m["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

	////////////
	// 1. Sim metrics: Phase 범위 방어 및 신규 구조체 매핑 적용
    uint8_t v_phaseIdx = static_cast<uint8_t>(sim.phase);
    if (v_phaseIdx >= EN_A20_WIND_PHASE_COUNT) {
        v_phaseIdx = static_cast<uint8_t>(EN_A20_WIND_PHASE_CALM);
    }
	// sim metrics (phase 범위 방어)
    // uint8_t v_phase = (uint8_t)sim.phase;
    // if (v_phase >= (uint8_t)EN_A20_WIND_PHASE_COUNT) v_phase = 0;


    v_m["simActive"]  = sim.active;

	v_m["simPhase"]   = G_A20_WindPhase_Arr[v_phaseIdx].code;
	//v_m["simPhase"]   = g_A20_WEATHER_PHASE_NAMES_Arr[v_phase];

	v_m["simWind"]    = sim.currentWindSpeed;
    v_m["simTarget"]  = sim.targetWindSpeed;
    v_m["simGust"]    = sim.gustActive;
    v_m["simThermal"] = sim.thermalActive;

    // AutoOff metrics
    v_m["autoOffTimerArmed"]   = autoOffRt.timerArmed;
    v_m["autoOffTimerMinutes"] = autoOffRt.timerMinutes;
    v_m["autoOffOffTime"]      = autoOffRt.offTimeEnabled ? autoOffRt.offTimeMinutes : 0;
    v_m["autoOffOffTemp"]      = autoOffRt.offTempEnabled ? autoOffRt.offTemp : 0.0f;
}
