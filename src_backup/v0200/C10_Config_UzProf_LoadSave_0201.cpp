/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_LoadSave_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - UserProfiles (LoadSave)
 * ------------------------------------------------------
 * [E-2.6] loadUserProfiles / saveUserProfiles 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0201.h"
#include "C10_Config_UzProf_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A23_Com_ResetCfg_0201.h"
#include "A22_Com_Lookup_0201.h"    // [FIX] A20_modeToString

#include <string.h>

bool CL_C10_ConfigManager::loadUserProfiles(ST_A20_UserProfilesRoot_t& p_cfg) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument d;
    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.userProfiles[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.userProfiles;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: s_cfgJsonFileMap.userProfiles empty", __func__);
        return false;
    }

    A20_resetUserProfilesDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Load_File2JsonDoc_V21 failed (%s)", __func__, v_cfgJsonPath);
        return false;
    }

    JsonArrayConst arr = d["userProfiles"]["profiles"].as<JsonArrayConst>();
    p_cfg.count        = 0;

    if (arr.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] %s: missing 'userProfiles.profiles' (keep defaults)", __func__);
        return true;
    }

    for (JsonObjectConst jp : arr) {
        if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

        ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count];
        memset(&up, 0, sizeof(up));

        if (!C10_fromJson_UserProfileItem(jp, up, true, false, false, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: profile decode failed (idx=%u). Load rejected.",
                               __func__, (unsigned)p_cfg.count);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }
        p_cfg.count++;
    }

    if (!C10_validateUserProfilesLoaded(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Load rejected.", __func__);
        A20_resetUserProfilesDefault(p_cfg);
        return false;
    }
    return true;
}

bool CL_C10_ConfigManager::saveUserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.userProfiles[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: path empty (cfg map not loaded?)", __func__);
        return false;
    }

    if (!C10_validateUserProfilesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Save aborted.", __func__);
        return false;
    }

    JsonDocument d;

    for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        const ST_A20_UserProfileItem_t& up = p_cfg.items[v_i];
        JsonObject                      jp = d["userProfiles"]["profiles"][v_i].to<JsonObject>();

        jp["profileId"]      = up.profileId;
        jp["profileNo"]      = up.profileNo;
        jp["name"]           = up.name;
        jp["enabled"]        = up.enabled;
        jp["repeatSegments"] = up.repeatSegments;
        jp["repeatCount"]    = up.repeatCount;

        for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_k++) {
            const ST_A20_UserProfileSegment_t& sg   = up.segments[v_k];
            JsonObject                         jseg = jp["segments"][v_k].to<JsonObject>();

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

        A40_ComFunc::Json_writeAutoOff(jp["autoOff"].to<JsonObject>(), up.autoOff);
        A40_ComFunc::Json_writeMotion(jp, up.motion);
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.userProfiles, d, true, true, __func__);
}
