

/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_IO_052.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, IO)
 * ------------------------------------------------------
 * 기능 요약:
 * - CT10 제어 상태 / 요약 / 메트릭 / 차트 JSON Export 구현
 * - sim JSON/차트는 S10 책임을 우선하고 CT10은 meta만 병합
 * ------------------------------------------------------
 */

#include "CT10_Control_050.h"


// --------------------------------------------------
// 싱글톤
// --------------------------------------------------
CL_CT10_ControlManager& CL_CT10_ControlManager::instance() {
    static CL_CT10_ControlManager v_inst;
    return v_inst;
}

void CL_CT10_ControlManager::toStateJson(JsonDocument& p_doc) {
    instance().exportStateJson_v02(p_doc);
}

void CL_CT10_ControlManager::toChartJson(JsonDocument& p_doc, bool p_diffOnly) {
     instance().exportChartJson(p_doc, p_diffOnly);
}
void CL_CT10_ControlManager::toSummaryJson(JsonDocument& p_doc) {
	instance().exportSummaryJson(p_doc);
}

void CL_CT10_ControlManager::toMetricsJson(JsonDocument& p_doc) {
	instance().exportMetricsJson(p_doc);
}

	
// --------------------------------------------------
// [CT10] exportStateJson_v02()
// - 웹/WS 상태에서 "왜 멈췄는지/무엇이 도는지"가 보이도록 확장
// - JsonDocument 단일 사용, containsKey/createNested* 금지 준수
// --------------------------------------------------
void CL_CT10_ControlManager::exportStateJson_v02(JsonDocument& p_doc) {
    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_ctl  = A40_ComFunc::Json_ensureObject(v_root["control"]);

    // 1) Core flags
    v_ctl["active"]      = active;
    v_ctl["profileMode"] = useProfileMode;

    // 2) State/Reason (string + enum)
    v_ctl["state"]      = CT10_stateToString(runCtx.state);
    v_ctl["reason"]     = CT10_reasonToString(runCtx.reason);
    v_ctl["stateCode"]  = (uint8_t)runCtx.state;
    v_ctl["reasonCode"] = (uint8_t)runCtx.reason;

    v_ctl["runSource"]         = (uint8_t)runSource;
    v_ctl["lastDecisionMs"]    = (uint32_t)runCtx.lastDecisionMs;
    v_ctl["lastStateChangeMs"] = (uint32_t)runCtx.lastStateChangeMs;

    // 2-1) Event hold/ack (UI-friendly)
    {
        JsonObject v_evt = A40_ComFunc::Json_ensureObject(v_ctl["event"]);

        v_evt["ackRequired"] = runCtx.stateAckRequired;
        v_evt["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

        uint32_t v_now = (uint32_t)millis();
        uint32_t v_remain = 0;
        if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
            v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
        }
        v_evt["holdRemainMs"] = v_remain;
    }

    // 3) Time status (TM10)
    {
        JsonObject v_time = A40_ComFunc::Json_ensureObject(v_ctl["time"]);
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

    // 4) Schedule snapshot (SSOT: runCtx 중심)
    {
        JsonObject v_sch = A40_ComFunc::Json_ensureObject(v_ctl["schedule"]);
        v_sch["index"] = (int)curScheduleIndex;
        v_sch["schId"] = (uint8_t)runCtx.activeSchId;
        v_sch["schNo"] = (uint16_t)runCtx.activeSchNo;

        const char* v_name = "";
        if (g_A20_config_root.schedules) {
            ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
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

    // 5) Profile snapshot (SSOT)
    {
        JsonObject v_prof = A40_ComFunc::Json_ensureObject(v_ctl["profile"]);
        v_prof["index"]     = (int)curProfileIndex;
        v_prof["profileNo"] = (uint8_t)runCtx.activeProfileNo;

        const char* v_name = "";
        if (g_A20_config_root.userProfiles) {
            ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;
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
        v_seg["segId"] = (uint8_t)runCtx.activeSegId;
        v_seg["segNo"] = (uint16_t)runCtx.activeSegNo;

        JsonObject v_srt = A40_ComFunc::Json_ensureObject(v_seg["scheduleRt"]);
        v_srt["index"]        = (int)scheduleSegRt.index;
        v_srt["onPhase"]      = scheduleSegRt.onPhase;
        v_srt["phaseStartMs"] = (uint32_t)scheduleSegRt.phaseStartMs;
        v_srt["loopCount"]    = (uint8_t)scheduleSegRt.loopCount;

        JsonObject v_prt = A40_ComFunc::Json_ensureObject(v_seg["profileRt"]);
        v_prt["index"]        = (int)profileSegRt.index;
        v_prt["onPhase"]      = profileSegRt.onPhase;
        v_prt["phaseStartMs"] = (uint32_t)profileSegRt.phaseStartMs;
        v_prt["loopCount"]    = (uint8_t)profileSegRt.loopCount;
    }

    // 7) Override snapshot
    {
        JsonObject v_ov = A40_ComFunc::Json_ensureObject(v_ctl["override"]);
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

    // 8) AutoOff runtime snapshot  (✅ autoOffRt만 유지)
    {
        JsonObject v_ao = A40_ComFunc::Json_ensureObject(v_ctl["autoOffRt"]);
        v_ao["timerArmed"]     = autoOffRt.timerArmed;
        v_ao["timerStartMs"]   = (uint32_t)autoOffRt.timerStartMs;
        v_ao["timerMinutes"]   = (uint32_t)autoOffRt.timerMinutes;
        v_ao["offTimeEnabled"] = autoOffRt.offTimeEnabled;
        v_ao["offTimeMinutes"] = (uint16_t)autoOffRt.offTimeMinutes;
        v_ao["offTempEnabled"] = autoOffRt.offTempEnabled;
        v_ao["offTemp"]        = autoOffRt.offTemp;

        v_ao["offTimeLastYday"] = (int)autoOffRt.offTimeLastYday;
        v_ao["offTimeLastMin"]  = (int)autoOffRt.offTimeLastMin;
    }

    // 9) Dirty flags
    {
        JsonObject v_dirty = A40_ComFunc::Json_ensureObject(v_ctl["dirty"]);
        v_dirty["state"]   = _dirtyState;
        v_dirty["metrics"] = _dirtyMetrics;
        v_dirty["chart"]   = _dirtyChart;
        v_dirty["summary"] = _dirtySummary;
    }
}


void CL_CT10_ControlManager::exportStateJson_v01(JsonDocument& p_doc) {
    // control root
    JsonObject v_control = A40_ComFunc::Json_ensureObject(p_doc["control"]);

    v_control["active"]         = active;
    v_control["useProfileMode"] = useProfileMode;
    v_control["runSource"]      = (int)runSource;
    v_control["scheduleIdx"]    = curScheduleIndex;
    v_control["profileIdx"]     = curProfileIndex;

    // runCtx 최소 포함(레거시 UI에서도 원인 표시 가능)
    v_control["state"]      = CT10_stateToString(runCtx.state);
    v_control["reason"]     = CT10_reasonToString(runCtx.reason);
    v_control["stateCode"]  = (uint8_t)runCtx.state;
    v_control["reasonCode"] = (uint8_t)runCtx.reason;

    // snapshot
    {
        JsonObject v_snap = A40_ComFunc::Json_ensureObject(v_control["snapshot"]);
        v_snap["schId"]     = (uint8_t)runCtx.activeSchId;
        v_snap["schNo"]     = (uint16_t)runCtx.activeSchNo;
        v_snap["segId"]     = (uint8_t)runCtx.activeSegId;
        v_snap["segNo"]     = (uint16_t)runCtx.activeSegNo;
        v_snap["profileNo"] = (uint8_t)runCtx.activeProfileNo;
    }

    // time (v01에도 최소)
    {
        JsonObject v_time = A40_ComFunc::Json_ensureObject(v_control["time"]);
        v_time["valid"] = CL_TM10_TimeManager::isTimeValid();
    }

    // override
    {
        JsonObject v_override = A40_ComFunc::Json_ensureObject(v_control["override"]);
        v_override["active"]    = overrideState.active;
        v_override["useFixed"]  = overrideState.useFixed;
        v_override["resolved"]  = (!overrideState.useFixed && overrideState.active);
        v_override["remainSec"] = calcOverrideRemainSec();

        if (overrideState.active) {
            if (overrideState.useFixed) {
                v_override["fixedPercent"] = overrideState.fixedPercent;
            } else if (overrideState.resolved.valid) {
                v_override["presetCode"] = overrideState.resolved.presetCode;
                v_override["styleCode"]  = overrideState.resolved.styleCode;
            }
        }
    }

    // pwm
    v_control["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

    // event (v01 최소)
    {
        JsonObject v_evt = A40_ComFunc::Json_ensureObject(v_control["event"]);
        v_evt["ackRequired"] = runCtx.stateAckRequired;
        v_evt["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

        uint32_t v_now = (uint32_t)millis();
        uint32_t v_remain = 0;
        if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
            v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
        }
        v_evt["holdRemainMs"] = v_remain;
    }

    // autoOffRt (✅ autoOff 제거)
    {
        JsonObject v_ao = A40_ComFunc::Json_ensureObject(v_control["autoOffRt"]);
        v_ao["timerArmed"]     = autoOffRt.timerArmed;
        v_ao["timerStartMs"]   = (uint32_t)autoOffRt.timerStartMs;
        v_ao["timerMinutes"]   = (uint32_t)autoOffRt.timerMinutes;
        v_ao["offTimeEnabled"] = autoOffRt.offTimeEnabled;
        v_ao["offTimeMinutes"] = (uint16_t)autoOffRt.offTimeMinutes;
        v_ao["offTempEnabled"] = autoOffRt.offTempEnabled;
        v_ao["offTemp"]        = autoOffRt.offTemp;

        v_ao["offTimeLastYday"] = (int)autoOffRt.offTimeLastYday;
        v_ao["offTimeLastMin"]  = (int)autoOffRt.offTimeLastMin;
    }

    // sim
    sim.toJson(p_doc);
}


void CL_CT10_ControlManager::exportChartJson(JsonDocument& p_doc, bool p_diffOnly) {
    // 1) S10 차트 생성 (p_doc["sim"] 구조는 S10이 책임)
    sim.toChartJson(p_doc, p_diffOnly);

    // 2) CT10 메타 병합: p_doc["sim"]["meta"] 안전 확보
    JsonObject v_sim  = A40_ComFunc::Json_ensureObject(p_doc["sim"]);
    JsonObject v_meta = A40_ComFunc::Json_ensureObject(v_sim["meta"]);

    v_meta["pwmDuty"]   = pwm ? pwm->P10_getDutyPercent() : 0.0f;
    v_meta["active"]    = active;
    v_meta["runSource"] = (int)runSource;
    v_meta["override"]  = overrideState.active ? (overrideState.useFixed ? "fixed" : "resolved") : "none";

    // ✅ runCtx 최소 병합 (차트에서도 "왜/무엇" 표시)
    {
        JsonObject v_ctx = A40_ComFunc::Json_ensureObject(v_meta["ctx"]);

        v_ctx["state"]      = CT10_stateToString(runCtx.state);
        v_ctx["reason"]     = CT10_reasonToString(runCtx.reason);
        v_ctx["stateCode"]  = (uint8_t)runCtx.state;
        v_ctx["reasonCode"] = (uint8_t)runCtx.reason;

        // snapshot 최소
        v_ctx["schNo"]     = (uint16_t)runCtx.activeSchNo;
        v_ctx["profileNo"] = (uint8_t)runCtx.activeProfileNo;
        v_ctx["segNo"]     = (uint16_t)runCtx.activeSegNo;
    }
}


void CL_CT10_ControlManager::exportSummaryJson(JsonDocument& p_doc) {
    JsonObject v_sum = A40_ComFunc::Json_ensureObject(p_doc["summary"]);

    v_sum["state"]  = CT10_stateToString(runCtx.state);
    v_sum["reason"] = CT10_reasonToString(runCtx.reason);

    v_sum["schNo"]     = (uint16_t)runCtx.activeSchNo;
    v_sum["profileNo"] = (uint8_t)runCtx.activeProfileNo;
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

    v_sum["scheduleIdx"] = curScheduleIndex;
    v_sum["profileIdx"]  = curProfileIndex;
}

void CL_CT10_ControlManager::exportMetricsJson(JsonDocument& p_doc) {
    JsonObject v_m = A40_ComFunc::Json_ensureObject(p_doc["metrics"]);

    v_m["active"]         = active;
    v_m["runSource"]      = (int)runSource;
    v_m["useProfileMode"] = useProfileMode;
    v_m["scheduleIdx"]    = curScheduleIndex;
    v_m["profileIdx"]     = curProfileIndex;

    v_m["overrideActive"] = overrideState.active;
    v_m["overrideFixed"]  = overrideState.useFixed;
    v_m["overrideRemain"] = calcOverrideRemainSec();

    v_m["pwmDuty"] = pwm ? pwm->P10_getDutyPercent() : 0.0f;

    // Sim metrics
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

    // AutoOff metrics
    v_m["autoOffTimerArmed"]   = autoOffRt.timerArmed;
    v_m["autoOffTimerMinutes"] = autoOffRt.timerMinutes;
    v_m["autoOffOffTime"]      = autoOffRt.offTimeEnabled ? autoOffRt.offTimeMinutes : 0;
    v_m["autoOffOffTemp"]      = autoOffRt.offTempEnabled ? autoOffRt.offTemp : 0.0f;

    // runCtx (상태/원인 + event hold)
    v_m["stateCode"]  = (uint8_t)runCtx.state;
    v_m["reasonCode"] = (uint8_t)runCtx.reason;
    v_m["state"]      = CT10_stateToString(runCtx.state);
    v_m["reason"]     = CT10_reasonToString(runCtx.reason);

    v_m["ackRequired"] = runCtx.stateAckRequired;
    v_m["holdUntilMs"] = (uint32_t)runCtx.stateHoldUntilMs;

    uint32_t v_now = (uint32_t)millis();
    uint32_t v_remain = 0;
    if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
        v_remain = (uint32_t)(runCtx.stateHoldUntilMs - v_now);
    }
    v_m["holdRemainMs"] = v_remain;

    // snapshot 최소
    v_m["activeSchId"]     = (uint8_t)runCtx.activeSchId;
    v_m["activeSchNo"]     = (uint16_t)runCtx.activeSchNo;
    v_m["activeProfileNo"] = (uint8_t)runCtx.activeProfileNo;
    v_m["activeSegId"]     = (uint8_t)runCtx.activeSegId;
    v_m["activeSegNo"]     = (uint16_t)runCtx.activeSegNo;

    // time valid (1회만)
    v_m["timeValid"] = CL_TM10_TimeManager::isTimeValid();
}


