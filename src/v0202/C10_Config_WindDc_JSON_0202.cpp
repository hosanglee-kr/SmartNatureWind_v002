/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_WindDc_JSON_0202.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - WindDict (JSON Export/Patch)
 * ------------------------------------------------------
 * [E-2.7] toJson_WindDict / patchWindDictFromJson 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0202.h"
#include "C10_Config_WindDc_Internal_0202.h"

#include "A40_Com_Utils_0202.h"
#include "A23_Com_ResetCfg_0202.h"

#include <string.h>

void CL_C10_ConfigManager::toJson_WindDict(const ST_A20_WindDict_t& p_cfg, JsonDocument& d) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    A40_ComFunc::Json_removeKey(d, "windDict");

    uint8_t v_presetCount = p_cfg.presetCount;
    uint8_t v_styleCount  = p_cfg.styleCount;

    if (v_presetCount > (uint8_t)EN_A20_WINDPRESET_COUNT) v_presetCount = (uint8_t)EN_A20_WINDPRESET_COUNT;
    if (v_styleCount > (uint8_t)EN_A20_WINDSTYLE_COUNT) v_styleCount = (uint8_t)EN_A20_WINDSTYLE_COUNT;

    for (uint8_t v_i = 0; v_i < v_presetCount; v_i++) {
        const ST_A20_PresetEntry_t& v_preset         = p_cfg.presets[v_i];
        JsonObject                  v_jsonObj_preset = d["windDict"]["presets"][v_i].to<JsonObject>();

        v_jsonObj_preset["idx"]  = v_i;
        v_jsonObj_preset["name"] = v_preset.name;
        v_jsonObj_preset["code"] = v_preset.code;

        JsonObject v_b                  = v_jsonObj_preset["factors"].to<JsonObject>();
        v_b["windIntensity"]            = v_preset.factors.windIntensity;
        v_b["gustFrequency"]            = v_preset.factors.gustFrequency;
        v_b["windVariability"]          = v_preset.factors.windVariability;
        v_b["fanLimit"]                 = v_preset.factors.fanLimit;
        v_b["minFan"]                   = v_preset.factors.minFan;
        v_b["turbulenceLengthScale"]    = v_preset.factors.turbulenceLengthScale;
        v_b["turbulenceIntensitySigma"] = v_preset.factors.turbulenceIntensitySigma;
        v_b["thermalBubbleStrength"]    = v_preset.factors.thermalBubbleStrength;
        v_b["thermalBubbleRadius"]      = v_preset.factors.thermalBubbleRadius;
        v_b["baseMinWind"]              = v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]              = v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]             = v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"]          = v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"]          = v_preset.factors.thermalFreqBase;
    }

    for (uint8_t v_i = 0; v_i < v_styleCount; v_i++) {
        const ST_A20_StyleEntry_t& v_s             = p_cfg.styles[v_i];
        JsonObject                 v_jsonObj_style = d["windDict"]["styles"][v_i].to<JsonObject>();

        v_jsonObj_style["idx"]  = v_i;
        v_jsonObj_style["name"] = v_s.name;
        v_jsonObj_style["code"] = v_s.code;

        JsonObject v_f           = v_jsonObj_style["factors"].to<JsonObject>();
        v_f["intensityFactor"]   = v_s.factors.intensityFactor;
        v_f["variabilityFactor"] = v_s.factors.variabilityFactor;
        v_f["gustFactor"]        = v_s.factors.gustFactor;
        v_f["thermalFactor"]     = v_s.factors.thermalFactor;
    }
}

bool CL_C10_ConfigManager::patchWindDictFromJson(ST_A20_WindDict_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonObjectConst j = p_patch["windDict"].as<JsonObjectConst>();
    if (j.isNull()) return false;

    A20_resetWindDictDefault(p_cfg);

    if (!C10_loadWindDictFromJsonChecked(j, p_cfg)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] WindDict patched: validation failed. Rejected.");
        A20_resetWindDictDefault(p_cfg);
        return false;
    }

    A40_ComFunc::Dirty_setAtomic(_dirty_windDict, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindDict patched (PUT). Dirty=true");
    return true;
}
