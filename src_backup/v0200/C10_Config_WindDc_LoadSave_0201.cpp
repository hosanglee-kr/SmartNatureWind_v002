/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_WindDc_LoadSave_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - WindDict (LoadSave)
 * ------------------------------------------------------
 * [E-2.7] loadWindDict / saveWindDict 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0201.h"
#include "C10_Config_WindDc_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A23_Com_ResetCfg_0201.h"

#include <string.h>

bool CL_C10_ConfigManager::loadWindDict(ST_A20_WindDict_t& p_dict) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument d;
    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.windDict[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.windDict;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: s_cfgJsonFileMap.windDict empty", __func__);
        return false;
    }

    A20_resetWindDictDefault(p_dict);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Load_File2JsonDoc_V21 failed (%s)", __func__, v_cfgJsonPath);
        return false;
    }

    JsonObjectConst j = d["windDict"].as<JsonObjectConst>();
    if (j.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] %s: missing 'windDict' (empty)", __func__);
        p_dict.presetCount = 0;
        p_dict.styleCount  = 0;
        return true;
    }

    if (!C10_loadWindDictFromJsonChecked(j, p_dict)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Load rejected.", __func__);
        A20_resetWindDictDefault(p_dict);
        return false;
    }
    return true;
}

bool CL_C10_ConfigManager::saveWindDict(const ST_A20_WindDict_t& p_cfg) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.windDict[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: path empty (cfg map not loaded?)", __func__);
        return false;
    }

    JsonDocument d;

    uint8_t v_presetCount = p_cfg.presetCount;
    uint8_t v_styleCount  = p_cfg.styleCount;

    if (v_presetCount > (uint8_t)EN_A20_WINDPRESET_COUNT) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: presetCount overflow(%u > %u)",
                           __func__, (unsigned)v_presetCount, (unsigned)EN_A20_WINDPRESET_COUNT);
        return false;
    }
    if (v_styleCount > (uint8_t)EN_A20_WINDSTYLE_COUNT) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: styleCount overflow(%u > %u)",
                           __func__, (unsigned)v_styleCount, (unsigned)EN_A20_WINDSTYLE_COUNT);
        return false;
    }

    char v_seenPresetCodes[EN_A20_WINDPRESET_COUNT][A20_Const::MAX_CODE_LEN];
    char v_seenStyleCodes[EN_A20_WINDSTYLE_COUNT][A20_Const::MAX_CODE_LEN];
    memset(v_seenPresetCodes, 0, sizeof(v_seenPresetCodes));
    memset(v_seenStyleCodes, 0, sizeof(v_seenStyleCodes));

    // presets validation
    for (uint8_t v_i = 0; v_i < v_presetCount; v_i++) {
        const ST_A20_PresetEntry_t& v_p = p_cfg.presets[v_i];
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_p.code, v_code, sizeof(v_code), true, "windDict.presets.code", true))
            return false;
        if (!C10_sanitizeAndValidateText(v_p.name, v_name, sizeof(v_name), false, "windDict.presets.name", true))
            return false;

        if (C10_hasDupCode(v_code, v_seenPresetCodes, v_i)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated preset.code=%s", __func__, v_code);
            return false;
        }
        A40_ComFunc::copyStr2Buffer_safe(v_seenPresetCodes[v_i], v_code, sizeof(v_seenPresetCodes[v_i]), __func__);
    }

    // styles validation
    for (uint8_t v_i = 0; v_i < v_styleCount; v_i++) {
        const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true, "windDict.styles.code", true))
            return false;
        if (!C10_sanitizeAndValidateText(v_s.name, v_name, sizeof(v_name), false, "windDict.styles.name", true))
            return false;

        if (C10_hasDupCode(v_code, v_seenStyleCodes, v_i)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated style.code=%s", __func__, v_code);
            return false;
        }
        A40_ComFunc::copyStr2Buffer_safe(v_seenStyleCodes[v_i], v_code, sizeof(v_seenStyleCodes[v_i]), __func__);
    }

    // presets write
    for (uint8_t v_i = 0; v_i < v_presetCount && v_i < (uint8_t)EN_A20_WINDPRESET_COUNT; v_i++) {
        const ST_A20_PresetEntry_t& v_preset = p_cfg.presets[v_i];
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true, "windDict.presets.code", false))
            return false;
        if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", false))
            return false;

        JsonObject v_jsonObj_preset = d["windDict"]["presets"][v_i].to<JsonObject>();

        v_jsonObj_preset["idx"]  = v_i;
        v_jsonObj_preset["name"] = v_name;
        v_jsonObj_preset["code"] = v_code;

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

    // styles write
    for (uint8_t v_i = 0; v_i < v_styleCount && v_i < (uint8_t)EN_A20_WINDSTYLE_COUNT; v_i++) {
        const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true, "windDict.styles.code", false))
            return false;
        if (!C10_sanitizeAndValidateText(v_s.name, v_name, sizeof(v_name), false, "windDict.styles.name", false))
            return false;

        JsonObject v_jsonObj_style = d["windDict"]["styles"][v_i].to<JsonObject>();

        v_jsonObj_style["idx"]  = v_i;
        v_jsonObj_style["name"] = v_name;
        v_jsonObj_style["code"] = v_code;

        JsonObject v_f           = v_jsonObj_style["factors"].to<JsonObject>();
        v_f["intensityFactor"]   = v_s.factors.intensityFactor;
        v_f["variabilityFactor"] = v_s.factors.variabilityFactor;
        v_f["gustFactor"]        = v_s.factors.gustFactor;
        v_f["thermalFactor"]     = v_s.factors.thermalFactor;
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.windDict, d, true, true, __func__);
}
