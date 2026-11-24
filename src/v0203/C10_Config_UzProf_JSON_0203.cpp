/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_JSON_0203.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - UserProfiles (JSON Export/Patch)
 * ------------------------------------------------------
 * [E-2.6] toJson_UserProfiles / patchUserProfilesFromJson 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0203.h"
#include "C10_Config_UzProf_Internal_0203.h"

#include "A40_Com_Utils_0203.h"
#include "A23_Com_ResetCfg_0203.h"

#include "A22_Com_Lookup_0203.h" // [FIX] A20_modeToString

#include <string.h>

// ═══════════════════════════════════════════════════════════
// [Phase 2] TriggerRule 직렬화 헬퍼 (extern)
// ═══════════════════════════════════════════════════════════
void C10_toJson_TriggerRule(JsonObject p_js, const ST_A20_TriggerRule_t& p_rule) {
    // timer
    p_js["timer"]["enabled"] = p_rule.timer.enabled;
    p_js["timer"]["minutes"] = p_rule.timer.minutes;

    // offTime
    p_js["offTime"]["enabled"] = p_rule.offTime.enabled;
    p_js["offTime"]["time"]    = p_rule.offTime.time;

    // tempLow
    p_js["tempLow"]["enabled"]    = p_rule.tempLow.enabled;
    p_js["tempLow"]["mode"]       = C10_ruleModeToString(p_rule.tempLow.mode);
    p_js["tempLow"]["threshold"]  = p_rule.tempLow.threshold;
    p_js["tempLow"]["hysteresis"] = p_rule.tempLow.hysteresis;

    // diLow
    p_js["diLow"]["enabled"]    = p_rule.diLow.enabled;
    p_js["diLow"]["mode"]       = C10_ruleModeToString(p_rule.diLow.mode);
    p_js["diLow"]["threshold"]  = p_rule.diLow.threshold;
    p_js["diLow"]["hysteresis"] = p_rule.diLow.hysteresis;

    // pirPause
    p_js["pirPause"]["enabled"] = p_rule.pirPause.enabled;
    p_js["pirPause"]["holdSec"] = p_rule.pirPause.holdSec;

    // smartComfort
    p_js["smartComfort"]["enabled"]     = p_rule.smartComfort.enabled;
    p_js["smartComfort"]["intervalMin"] = p_rule.smartComfort.intervalMin;
    p_js["smartComfort"]["level"]       = p_rule.smartComfort.level;
}

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

        // [v0203] steps[] 배열 생성 (단일 JsonDocument 규격)
        for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_STEPS_PER_PROFILE; v_k++) {
            const ST_A20_Step_t& sg    = up.segments[v_k];
            JsonObject           jstep = jp["steps"][v_k].to<JsonObject>();

            jstep["stepNo"]      = sg.stepNo ? sg.stepNo : (v_k + 1);
            jstep["durationMin"] = sg.durationMin ? sg.durationMin : (sg.onMinutes + sg.offMinutes);
            jstep["type"]        = A20_stepTypeToString(sg.type);
            jstep["presetCode"]  = sg.presetCode;
            jstep["styleCode"]   = sg.styleCode;
            jstep["fixedSpeed"]  = sg.fixedSpeed;

            JsonObject ovr = jstep["override"].to<JsonObject>();
            ovr["enabled"] = sg.override.enabled;
            if (sg.override.enabled) {
                ovr["windIntensity"]   = sg.override.windIntensity;
                ovr["windVariability"] = sg.override.windVariability;
                ovr["gustFrequency"]   = sg.override.gustFrequency;
            }
        }

        // [Phase 2] rule 직렬화 (단일 스키마)
        C10_toJson_TriggerRule(jp["rule"].to<JsonObject>(), up.rule);
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
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: duplicated profileNo=%u. Patch rejected.",
                               __func__,
                               (unsigned)up.profileNo);
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
