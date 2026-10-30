/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_JSON_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - UserProfiles (JSON Export/Patch)
 * ------------------------------------------------------
 * [E-2.6] toJson_UserProfiles / patchUserProfilesFromJson 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0201.h"
#include "C10_Config_UzProf_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A23_Com_ResetCfg_0201.h"

#include "A22_Com_Lookup_0201.h"    // [FIX] A20_modeToString

#include <string.h>

void CL_C10_ConfigManager::toJson_UserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg, JsonDocument& d) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    A40_ComFunc::Json_removeKey(d, "userProfiles");

    if (!C10_validateUserProfilesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Export aborted.", __func__);
        return;
    }

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
}

bool CL_C10_ConfigManager::patchUserProfilesFromJson(ST_A20_UserProfilesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonArrayConst arr = p_patch["userProfiles"]["profiles"].as<JsonArrayConst>();
    if (arr.isNull()) return false;

    A20_resetUserProfilesDefault(p_cfg);
    p_cfg.count = 0;

    uint8_t v_nextProfileId = (uint8_t)G_C10_PROFILE_ID_START;

    for (JsonObjectConst jp : arr) {
        if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

        ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count];
        memset(&up, 0, sizeof(up));

        up.profileId = (uint16_t)v_nextProfileId;

        if (!C10_fromJson_UserProfileItem(jp, up, false, true, true, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: decode failed. Patch rejected.", __func__);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }

        if (C10_isProfileNoDuplicated(p_cfg, up.profileNo, p_cfg.count)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileNo=%u. Patch rejected.",
                               __func__, (unsigned)up.profileNo);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }

        if (!C10_reissueProfileSegIdsAndValidateSegNos(up, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segment validation failed. Patch rejected.", __func__);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }

        p_cfg.count++;

        {
            uint16_t v_tmp = (uint16_t)v_nextProfileId + (uint16_t)G_C10_PROFILE_ID_STEP;
            if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_PROFILE_ID_START;
            v_nextProfileId = (uint8_t)v_tmp;
        }
    }

    if (!C10_validateUserProfilesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed after patch. Rejected.", __func__);
        A20_resetUserProfilesDefault(p_cfg);
        return false;
    }

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfiles patched (PUT). Dirty=true");
    return true;
}
