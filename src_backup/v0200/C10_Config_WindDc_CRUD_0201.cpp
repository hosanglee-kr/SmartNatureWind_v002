/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_WindDc_CRUD_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - WindDict (CRUD)
 * ------------------------------------------------------
 * [E-2.7] addWindProfileFromJson / updateWindProfileFromJson /
 *         deleteWindProfile 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0201.h"
#include "C10_Config_WindDc_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A23_Com_ResetCfg_0201.h"

#include <new>
#include <string.h>
#include <strings.h>

int CL_C10_ConfigManager::addWindProfileFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return -1;
    }

    if (!g_A20_config_root.windDict) {
        g_A20_config_root.windDict = new (std::nothrow) ST_A20_WindDict_t();
        if (!g_A20_config_root.windDict) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addWindPreset: new failed (out of memory)");
            return -1;
        }
        A20_resetWindDictDefault(*g_A20_config_root.windDict);
    }

    ST_A20_WindDict_t& v_root = *g_A20_config_root.windDict;
    if (v_root.presetCount >= (uint8_t)EN_A20_WINDPRESET_COUNT) return -1;

    JsonObjectConst v_jsonObj_preset =
        p_doc["preset"].is<JsonObjectConst>() ? p_doc["preset"].as<JsonObjectConst>()
                                              : p_doc.as<JsonObjectConst>();

    ST_A20_PresetEntry_t& v_preset = v_root.presets[v_root.presetCount];
    C10_fromJson_WindPreset(v_jsonObj_preset, v_preset);

    {
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true, "windDict.presets.code", true))
            return -2;
        if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", true))
            return -2;

        char v_seen[EN_A20_WINDPRESET_COUNT][A20_Const::MAX_CODE_LEN];
        memset(v_seen, 0, sizeof(v_seen));
        for (uint8_t v_i = 0; v_i < v_root.presetCount && v_i < (uint8_t)EN_A20_WINDPRESET_COUNT; v_i++) {
            A40_ComFunc::copyStr2Buffer_safe(v_seen[v_i], v_root.presets[v_i].code, sizeof(v_seen[v_i]), __func__);
        }
        if (C10_hasDupCode(v_code, v_seen, v_root.presetCount)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addWindPreset: duplicated code=%s", v_code);
            return -3;
        }

        A40_ComFunc::copyStr2Buffer_safe(v_preset.code, v_code, sizeof(v_preset.code), __func__);
        A40_ComFunc::copyStr2Buffer_safe(v_preset.name, v_name, sizeof(v_preset.name), __func__);
    }

    int v_index = v_root.presetCount;
    v_root.presetCount++;

    A40_ComFunc::Dirty_setAtomic(_dirty_windDict, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset added (index=%d)", v_index);
    return v_index;
}

bool CL_C10_ConfigManager::updateWindProfileFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.windDict) return false;
    ST_A20_WindDict_t& v_root = *g_A20_config_root.windDict;
    if (p_id >= v_root.presetCount) return false;

    JsonObjectConst v_jsonObj_preset =
        p_patch["preset"].is<JsonObjectConst>() ? p_patch["preset"].as<JsonObjectConst>()
                                                : p_patch.as<JsonObjectConst>();

    C10_fromJson_WindPreset(v_jsonObj_preset, v_root.presets[p_id]);

    {
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_root.presets[p_id].code, v_code, sizeof(v_code),
                                         true, "windDict.presets.code", true))
            return false;
        if (!C10_sanitizeAndValidateText(v_root.presets[p_id].name, v_name, sizeof(v_name),
                                         false, "windDict.presets.name", true))
            return false;

        for (uint8_t v_i = 0; v_i < v_root.presetCount; v_i++) {
            if (v_i == (uint8_t)p_id) continue;
            if (v_root.presets[v_i].code[0] == '\0') continue;
            if (strncmp(v_root.presets[v_i].code, v_code, sizeof(v_root.presets[v_i].code)) == 0) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateWindPreset: duplicated code=%s (idx=%u)",
                                   v_code, (unsigned)v_i);
                return false;
            }
        }

        A40_ComFunc::copyStr2Buffer_safe(v_root.presets[p_id].code, v_code, sizeof(v_root.presets[p_id].code), __func__);
        A40_ComFunc::copyStr2Buffer_safe(v_root.presets[p_id].name, v_name, sizeof(v_root.presets[p_id].name), __func__);
    }

    A40_ComFunc::Dirty_setAtomic(_dirty_windDict, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset updated (index=%u)", (unsigned)p_id);
    return true;
}

bool CL_C10_ConfigManager::deleteWindProfile(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.windDict) return false;
    ST_A20_WindDict_t& v_root = *g_A20_config_root.windDict;
    if (p_id >= v_root.presetCount) return false;

    for (uint8_t v_i = (uint8_t)p_id + 1; v_i < v_root.presetCount; v_i++) {
        v_root.presets[v_i - 1] = v_root.presets[v_i];
    }
    if (v_root.presetCount > 0) v_root.presetCount--;

    A40_ComFunc::Dirty_setAtomic(_dirty_windDict, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset deleted (index=%u)", (unsigned)p_id);
    return true;
}
