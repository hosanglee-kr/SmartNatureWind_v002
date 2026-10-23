/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Sch_JSON_0202.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - Schedule (JSON Export/Patch)
 * ------------------------------------------------------
 * [E-2.3] toJson_Schedules / patchSchedulesFromJson 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0202.h"
#include "C10_Config_Sch_Internal_0202.h"

#include "A25_Com_Utils_0202.h"
#include "A22_Com_Lookup_0202.h"    // [FIX] A20_modeToString
#include "A23_Com_ResetCfg_0202.h"

#include <string.h>

// =====================================================
// toJson_Schedules
// =====================================================
void CL_C10_ConfigManager::toJson_Schedules(const ST_A20_SchedulesRoot_t& p_cfg, JsonDocument& d) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    A40_ComFunc::Json_removeKey(d, "schedules");

    if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Export aborted.", __func__);
        return;
    }

    for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& s  = p_cfg.items[v_i];
        JsonObject                   js = d["schedules"][v_i].to<JsonObject>();

        js["schId"]          = s.schId;
        js["schNo"]          = s.schNo;
        js["name"]           = s.name;
        js["enabled"]        = s.enabled;
        js["repeatSegments"] = s.repeatSegments;
        js["repeatCount"]    = s.repeatCount;

        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            js["period"]["days"][v_d] = (uint8_t)(s.period.days[v_d] ? 1 : 0);
        }
        js["period"]["startTime"] = s.period.startTime;
        js["period"]["endTime"]   = s.period.endTime;

        for (uint8_t v_k = 0; v_k < s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
            const ST_A20_ScheduleSegment_t& sg   = s.segments[v_k];
            JsonObject                      jseg = js["segments"][v_k].to<JsonObject>();

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
}

// =====================================================
// patchSchedulesFromJson (PUT, 전체 replace)
// =====================================================
bool CL_C10_ConfigManager::patchSchedulesFromJson(ST_A20_SchedulesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonArrayConst arr = p_patch["schedules"].as<JsonArrayConst>();
    if (arr.isNull()) return false;

    A20_resetSchedulesDefault(p_cfg);
    p_cfg.count = 0;

    uint8_t v_nextSchId = (uint8_t)G_C10_SCH_ID_START;

    for (JsonObjectConst js : arr) {
        if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

        ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
        memset(&s, 0, sizeof(s));

        s.schId = v_nextSchId;

        if (!C10_fromJson_ScheduleItem(js, s, false, true, true, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: decode failed. Patch rejected.", __func__);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        if (C10_isSchNoDuplicated(p_cfg, s.schNo, p_cfg.count)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated schNo=%u. Patch rejected.", __func__, (unsigned)s.schNo);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        if (!C10_reissueSegIdsAndValidateSegNos(s, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segment validation failed. Patch rejected.", __func__);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        p_cfg.count++;

        {
            uint16_t v_tmp = (uint16_t)v_nextSchId + (uint16_t)G_C10_SCH_ID_STEP;
            if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_SCH_ID_START;
            v_nextSchId = (uint8_t)v_tmp;
        }
    }

    if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed after patch. Rejected.", __func__);
        A20_resetSchedulesDefault(p_cfg);
        return false;
    }

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedules patched (PUT). Dirty=true");
    return true;
}
