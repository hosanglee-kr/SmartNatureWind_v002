/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Sch_LoadSave_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - Schedule (LoadSave)
 * ------------------------------------------------------
 * [E-2.3] loadSchedules / saveSchedules 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0201.h"
#include "C10_Config_Sch_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A23_Com_ResetCfg_0201.h"

#include <string.h>

// =====================================================
// Load
// =====================================================
bool CL_C10_ConfigManager::loadSchedules(ST_A20_SchedulesRoot_t& p_cfg) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument d;
    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.schedules[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.schedules;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: s_cfgJsonFileMap.schedules empty", __func__);
        return false;
    }

    A20_resetSchedulesDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Load_File2JsonDoc_V21 failed (%s)", __func__, v_cfgJsonPath);
        return false;
    }

    JsonArrayConst arr = d["schedules"].as<JsonArrayConst>();
    p_cfg.count        = 0;

    if (arr.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] %s: missing 'schedules' array (keep defaults)", __func__);
        return true;
    }

    for (JsonObjectConst js : arr) {
        if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

        ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
        memset(&s, 0, sizeof(s));

        if (!C10_fromJson_ScheduleItem(js, s, true, false, false, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: schedule decode failed (idx=%u). Load rejected.",
                               __func__, (unsigned)p_cfg.count);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }
        p_cfg.count++;
    }

    if (!C10_validateSchedulesLoaded(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Load rejected.", __func__);
        A20_resetSchedulesDefault(p_cfg);
        return false;
    }
    return true;
}

// =====================================================
// Save
// =====================================================
bool CL_C10_ConfigManager::saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg, bool p_failOnOverlap) {
    CL_A40_MutexGuard_Semaphore v_guard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.schedules[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: path empty (cfg map not loaded?)", __func__);
        return false;
    }

    if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Save aborted.", __func__);
        return false;
    }

    if (!C10_validateNoOverlapByDay(p_cfg, p_failOnOverlap, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: overlap validation failed. Save aborted.", __func__);
        return false;
    }

    static ST_A20_SchedulesRoot_t v_sorted;
    memcpy(&v_sorted, &p_cfg, sizeof(ST_A20_SchedulesRoot_t));
    C10_sortSchedulesBySchNoDesc(v_sorted);

    JsonDocument d;
    JsonObject   v_root = d.to<JsonObject>();
    v_root["version"]   = "070";
    v_root["jsonFile"]  = "cfg_schedules_0200.json";

    JsonArray v_jsSchedules = v_root["schedules"].to<JsonArray>();
    const uint8_t v_maxSch = (v_sorted.count < A20_Const::MAX_SCHEDULES) ? v_sorted.count : A20_Const::MAX_SCHEDULES;

    for (uint8_t v_i = 0; v_i < v_maxSch; v_i++) {
        const ST_A20_ScheduleItem_t& s = v_sorted.items[v_i];
        JsonObject js = v_jsSchedules.add<JsonObject>();

        js["schId"]          = s.schId;
        js["schNo"]          = s.schNo;
        js["name"]           = s.name;
        js["enabled"]        = s.enabled;
        js["repeatSegments"] = s.repeatSegments;
        js["repeatCount"]    = s.repeatCount;

        JsonObject jp = js["period"].to<JsonObject>();
        JsonArray  jd = jp["days"].to<JsonArray>();
        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            jd.add((uint8_t)(s.period.days[v_d] ? 1 : 0));
        }
        jp["startTime"] = s.period.startTime;
        jp["endTime"]   = s.period.endTime;

        JsonArray v_jsSegs = js["segments"].to<JsonArray>();
        const uint8_t v_maxSeg =
            (s.segCount < A20_Const::MAX_SEGMENTS_PER_SCHEDULE) ? s.segCount : A20_Const::MAX_SEGMENTS_PER_SCHEDULE;

        for (uint8_t v_k = 0; v_k < v_maxSeg; v_k++) {
            const ST_A20_ScheduleSegment_t& sg = s.segments[v_k];
            JsonObject jseg = v_jsSegs.add<JsonObject>();

            jseg["segId"]      = sg.segId;
            jseg["segNo"]      = sg.segNo;
            jseg["onMinutes"]  = sg.onMinutes;
            jseg["offMinutes"] = sg.offMinutes;
            jseg["mode"]       = A20_modeToString(sg.mode);
            jseg["presetCode"] = sg.presetCode;
            jseg["styleCode"]  = sg.styleCode;

            JsonObject adj                  = jseg["adjust"].to<JsonObject>();
            adj["windIntensity"]            = sg.adjust.windIntensity;
            adj["windVariability"]          = sg.adjust.windVariability;
            adj["gustFrequency"]            = sg.adjust.gustFrequency;
            adj["fanLimit"]                 = sg.adjust.fanLimit;
            adj["minFan"]                   = sg.adjust.minFan;
            adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;
            adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;
            adj["thermalBubbleStrength"]    = sg.adjust.thermalBubbleStrength;
            adj["thermalBubbleRadius"]      = sg.adjust.thermalBubbleRadius;

            jseg["fixedSpeed"] = sg.fixedSpeed;
        }

        A40_ComFunc::Json_writeAutoOff(js["autoOff"].to<JsonObject>(), s.autoOff);
        A40_ComFunc::Json_writeMotion(js, s.motion);
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.schedules, d, true, true, __func__);
}
