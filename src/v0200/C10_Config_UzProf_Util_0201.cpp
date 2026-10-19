/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_Util_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - UserProfiles (Util)
 * ------------------------------------------------------
 * [E-2.6] 원본의 모든 helper (C10_*, profileId/no 검증, decode, validate)
 * ------------------------------------------------------
 */

#include "C10_Config_UzProf_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A22_Com_Lookup_0201.h"
#include "A23_Com_ResetCfg_0201.h"

#include <string.h>

#ifndef G_C10_PROFILE_ID_START
# define G_C10_PROFILE_ID_START 1
#endif
#ifndef G_C10_PROFILE_ID_STEP
# define G_C10_PROFILE_ID_STEP 1
#endif
#ifndef G_C10_PROFILE_SEG_ID_START
# define G_C10_PROFILE_SEG_ID_START 1
#endif
#ifndef G_C10_PROFILE_SEG_ID_STEP
# define G_C10_PROFILE_SEG_ID_STEP 1
#endif

// =====================================================
// profileId (uint8) 자동 발급
// =====================================================
uint8_t C10_nextProfileId_u8(const ST_A20_UserProfilesRoot_t& p_root) {
    uint8_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (p_root.items[v_i].profileId > v_max) v_max = (uint8_t)p_root.items[v_i].profileId;
    }

    uint16_t v_next = (uint16_t)v_max + (uint16_t)G_C10_PROFILE_ID_STEP;
    if (v_next == 0u) v_next = (uint16_t)G_C10_PROFILE_ID_START;
    if (v_next > 255u) return (uint8_t)G_C10_PROFILE_ID_START;
    return (uint8_t)v_next;
}

bool C10_isProfileIdDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint8_t p_id, uint8_t p_excludeIndex) {
    if (p_id == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if ((uint8_t)p_root.items[v_i].profileId == p_id) return true;
    }
    return false;
}

bool C10_isProfileNoDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint16_t p_no, uint8_t p_excludeIndex) {
    if (p_no == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].profileNo == p_no) return true;
    }
    return false;
}

// =====================================================
// JSON → struct decode
// =====================================================
bool C10_fromJson_UserProfileItem(const JsonObjectConst&    p_jp,
                                  ST_A20_UserProfileItem_t& p_up,
                                  bool                      p_allowIdRead,
                                  bool                      p_forceProfileIdKeep,
                                  bool                      p_forceReissueSegId,
                                  const char*               p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    if (!p_forceProfileIdKeep) {
        if (p_allowIdRead) {
            uint16_t v_inId = (uint16_t)(p_jp["profileId"] | 0u);
            if (v_inId == 0u || v_inId > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileId=%u", v_caller, (unsigned)v_inId);
                return false;
            }
            p_up.profileId = (uint16_t)v_inId;
        }
    }

    {
        uint16_t v_no = (uint16_t)(p_jp["profileNo"] | 0u);
        if (v_no == 0u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileNo=%u", v_caller, (unsigned)v_no);
            return false;
        }
        p_up.profileNo = v_no;
    }

    A40_ComFunc::Json_copyStr(p_jp, "name", p_up.name, sizeof(p_up.name), "", v_caller);
    p_up.enabled = A40_ComFunc::Json_getBool(p_jp, "enabled", true);

    p_up.repeatSegments = A40_ComFunc::Json_getBool(p_jp, "repeatSegments", true);
    p_up.repeatCount    = (uint16_t)(p_jp["repeatCount"] | 0u);

    p_up.segCount = 0;
    if (p_jp["segments"].is<JsonArrayConst>()) {
        JsonArrayConst v_sArr = p_jp["segments"].as<JsonArrayConst>();
        for (JsonObjectConst jseg : v_sArr) {
            if (p_up.segCount >= A20_Const::MAX_SEGMENTS_PER_PROFILE) break;

            ST_A20_UserProfileSegment_t& sg = p_up.segments[p_up.segCount];
            memset(&sg, 0, sizeof(sg));

            if (!p_forceReissueSegId && p_allowIdRead) {
                uint16_t v_segIdIn = (uint16_t)(jseg["segId"] | 0u);
                if (v_segIdIn == 0u || v_segIdIn > 255u) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid segId=%u", v_caller, (unsigned)v_segIdIn);
                    return false;
                }
                sg.segId = v_segIdIn;
            } else {
                sg.segId = 0;
            }

            {
                uint32_t v_segNoIn = (uint32_t)(jseg["segNo"] | 0u);
                if (v_segNoIn == 0u || v_segNoIn > 65535u) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid segNo=%u", v_caller, (unsigned)v_segNoIn);
                    return false;
                }
                sg.segNo = (uint16_t)v_segNoIn;
            }

            sg.onMinutes  = (uint16_t)(jseg["onMinutes"] | 10u);
            sg.offMinutes = (uint16_t)(jseg["offMinutes"] | 0u);

            const char* v_mode = A40_ComFunc::Json_getStr(jseg, "mode", "PRESET");
            sg.mode            = A20_modeFromString(v_mode);

            A40_ComFunc::Json_copyStr(jseg, "presetCode", sg.presetCode, sizeof(sg.presetCode), "", v_caller);
            A40_ComFunc::Json_copyStr(jseg, "styleCode",  sg.styleCode,  sizeof(sg.styleCode),  "", v_caller);

            memset(&sg.adjust, 0, sizeof(sg.adjust));
            if (jseg["adjust"].is<JsonObjectConst>()) {
                JsonObjectConst adj                = jseg["adjust"].as<JsonObjectConst>();
                sg.adjust.windIntensity            = A40_ComFunc::Json_getNum<float>(adj, "windIntensity", 0.0f);
                sg.adjust.windVariability          = A40_ComFunc::Json_getNum<float>(adj, "windVariability", 0.0f);
                sg.adjust.gustFrequency            = A40_ComFunc::Json_getNum<float>(adj, "gustFrequency", 0.0f);
                sg.adjust.fanLimit                 = A40_ComFunc::Json_getNum<float>(adj, "fanLimit", 0.0f);
                sg.adjust.minFan                   = A40_ComFunc::Json_getNum<float>(adj, "minFan", 0.0f);
                sg.adjust.turbulenceLengthScale    = A40_ComFunc::Json_getNum<float>(adj, "turbulenceLengthScale", 0.0f);
                sg.adjust.turbulenceIntensitySigma = A40_ComFunc::Json_getNum<float>(adj, "turbulenceIntensitySigma", 0.0f);
                sg.adjust.thermalBubbleStrength    = A40_ComFunc::Json_getNum<float>(adj, "thermalBubbleStrength", 0.0f);
                sg.adjust.thermalBubbleRadius      = A40_ComFunc::Json_getNum<float>(adj, "thermalBubbleRadius", 0.0f);
            }

            sg.fixedSpeed = A40_ComFunc::Json_getNum<float>(jseg, "fixedSpeed", 0.0f);
            p_up.segCount++;
        }
    }

    memset(&p_up.autoOff, 0, sizeof(p_up.autoOff));
    if (p_jp["autoOff"].is<JsonObjectConst>()) {
        JsonObjectConst ao              = p_jp["autoOff"].as<JsonObjectConst>();
        JsonObjectConst aoTimer         = ao["timer"].as<JsonObjectConst>();
        JsonObjectConst aoOffTime       = ao["offTime"].as<JsonObjectConst>();
        JsonObjectConst aoOffTemp       = ao["offTemp"].as<JsonObjectConst>();

        p_up.autoOff.timer.enabled      = A40_ComFunc::Json_getBool(aoTimer, "enabled", false);
        p_up.autoOff.timer.minutes      = A40_ComFunc::Json_getNum<uint32_t>(aoTimer, "minutes", 0u);
        p_up.autoOff.offTime.enabled    = A40_ComFunc::Json_getBool(aoOffTime, "enabled", false);
        A40_ComFunc::Json_copyStr(aoOffTime, "time",
                                  p_up.autoOff.offTime.time, sizeof(p_up.autoOff.offTime.time), "", v_caller);
        p_up.autoOff.offTemp.enabled    = A40_ComFunc::Json_getBool(aoOffTemp, "enabled", false);
        p_up.autoOff.offTemp.temp       = A40_ComFunc::Json_getNum<float>(aoOffTemp, "temp", 0.0f);
    }

    JsonObjectConst m    = p_jp["motion"].as<JsonObjectConst>();
    JsonObjectConst mpir = m["pir"].as<JsonObjectConst>();

    p_up.motion.pir.enabled = A40_ComFunc::Json_getBool(mpir, "enabled", false);
    p_up.motion.pir.holdSec = (uint16_t)(mpir["holdSec"] | 0u);

    return true;
}

// =====================================================
// segId 재발급 + segNo 검증
// =====================================================
bool C10_reissueProfileSegIdsAndValidateSegNos(ST_A20_UserProfileItem_t& p_up, const char* p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        if (p_up.segments[v_i].segNo == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segNo is 0 (idx=%u)", v_caller, (unsigned)v_i);
            return false;
        }
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_up.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_j++) {
            if (p_up.segments[v_i].segNo == p_up.segments[v_j].segNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated segNo=%u", v_caller, (unsigned)p_up.segments[v_i].segNo);
                return false;
            }
        }
    }

    uint8_t v_nextId = (uint8_t)G_C10_PROFILE_SEG_ID_START;
    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        p_up.segments[v_i].segId = (uint16_t)v_nextId;

        uint16_t v_tmp = (uint16_t)v_nextId + (uint16_t)G_C10_PROFILE_SEG_ID_STEP;
        if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_PROFILE_SEG_ID_START;
        v_nextId = (uint8_t)v_tmp;
    }

    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        if ((uint16_t)p_up.segments[v_i].segId == 0u) return false;
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_up.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_j++) {
            if (p_up.segments[v_i].segId == p_up.segments[v_j].segId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated segId=%u after reissue",
                                   v_caller, (unsigned)p_up.segments[v_i].segId);
                return false;
            }
        }
    }
    return true;
}

// =====================================================
// validate
// =====================================================
bool C10_validateUserProfilesLoaded(const ST_A20_UserProfilesRoot_t& p_root, const char* p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    if (p_root.count > A20_Const::MAX_USER_PROFILES) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: userProfiles.count overflow(%u)", v_caller, (unsigned)p_root.count);
        return false;
    }

    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        const ST_A20_UserProfileItem_t& up = p_root.items[v_i];

        uint16_t v_pid = (uint16_t)up.profileId;
        if (v_pid == 0u || v_pid > 255u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileId=%u (idx=%u)", v_caller, (unsigned)v_pid, (unsigned)v_i);
            return false;
        }
        if (up.profileNo == 0u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: profileNo is 0 (profileId=%u)", v_caller, (unsigned)v_pid);
            return false;
        }

        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_root.count && v_j < A20_Const::MAX_USER_PROFILES; v_j++) {
            if (p_root.items[v_j].profileId == up.profileId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileId=%u", v_caller, (unsigned)v_pid);
                return false;
            }
            if (p_root.items[v_j].profileNo == up.profileNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileNo=%u", v_caller, (unsigned)up.profileNo);
                return false;
            }
        }

        if (up.segCount > A20_Const::MAX_SEGMENTS_PER_PROFILE) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segCount overflow(profileId=%u)", v_caller, (unsigned)v_pid);
            return false;
        }

        for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_k++) {
            const ST_A20_UserProfileSegment_t& sg = up.segments[v_k];
            if ((uint16_t)sg.segId == 0u || (uint16_t)sg.segId > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid segId=%u (profileId=%u)",
                                   v_caller, (unsigned)sg.segId, (unsigned)v_pid);
                return false;
            }
            if (sg.segNo == 0u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segNo is 0 (profileId=%u)", v_caller, (unsigned)v_pid);
                return false;
            }

            for (uint8_t v_m = (uint8_t)(v_k + 1); v_m < up.segCount && v_m < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_m++) {
                const ST_A20_UserProfileSegment_t& sg2 = up.segments[v_m];
                if (sg.segId == sg2.segId) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated segId=%u (profileId=%u)",
                                       v_caller, (unsigned)sg.segId, (unsigned)v_pid);
                    return false;
                }
                if (sg.segNo == sg2.segNo) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated segNo=%u (profileId=%u)",
                                       v_caller, (unsigned)sg.segNo, (unsigned)v_pid);
                    return false;
                }
            }
        }
    }
    return true;
}

bool C10_validateUserProfilesBeforeSave(const ST_A20_UserProfilesRoot_t& p_cfg, const char* p_callerForLog) {
    return C10_validateUserProfilesLoaded(p_cfg, p_callerForLog);
}
