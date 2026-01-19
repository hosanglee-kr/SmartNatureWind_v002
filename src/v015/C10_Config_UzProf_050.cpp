/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_050.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - UserProfiles (Only)
 * ------------------------------------------------------
 * 기능 요약:
 *  - UserProfiles Load/Save
 *  - UserProfiles JSON Export / Patch
 *  - UserProfiles CRUD (add/update/delete)
 *  - profileId/profileNo/segId/segNo 운영 규칙 반영
 *    - File Load: profileId/segId를 "신뢰 가능한 소스"로 간주하고 읽기 허용(필수/중복/0금지/범위 검증)
 *    - API patch/add: profileId/segId 입력 무시(서버 발급)
 *    - update=PUT 고정: profileId 유지 + segId 서버 재발급 + 필수/중복검증 강화
 *    - Save: profileId/profileNo/segId/segNo 필수/중복검증을 save 직전 마지막 방어선으로 재검증
 *  - camelCase only
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 체계 유지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 모듈별 헤더(h) + 목적물별 cpp 분리 구성 (Core/System/Schedule)
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <new>
#include <Arduino.h>
#include "C10_Config_050.h"
#include "A40_Com_Func_052.h"

// ------------------------------------------------------
// UserProfile ID/NO 정책 (Schedules와 동일)
//  - profileId: uint8_t, 필수, 0 금지, 중복 금지, 서버 발급(기본: 1부터 1씩 증가)
//    * File Load에서는 신뢰 가능한 소스로 간주하여 읽기 허용(검증은 수행)
//    * API patch/add에서는 입력 무시(서버 발급)
//    * update=PUT: profileId 유지(요청 body의 profileId/segId는 무시)
//  - profileNo: uint16_t, 필수, 0 금지, 중복 금지, 사용자 변경 가능(정렬/제어순서 목적)
//    * 기본 증가 규칙: 10부터 10씩(서버가 자동발급할 수 있는 경우에만 사용)
//  - segId: uint8_t, 필수, 0 금지, 중복 금지(프로필 내), 서버 발급(1부터 1씩)
//    * File Load에서는 신뢰 가능한 소스로 간주하여 읽기 허용(검증은 수행)
//    * API patch/add/update(PUT)에서는 입력 무시(서버 발급)
//  - segNo: uint16_t, 필수, 0 금지, 중복 금지(프로필 내), 사용자 변경 가능(정렬 목적)
//    * 기본 증가 규칙: 10부터 10씩(서버가 자동발급할 수 있는 경우에만 사용)
// ------------------------------------------------------
#ifndef G_C10_PROFILE_ID_START
# define G_C10_PROFILE_ID_START 1
#endif
#ifndef G_C10_PROFILE_ID_STEP
# define G_C10_PROFILE_ID_STEP 1
#endif
#ifndef G_C10_PROFILE_NO_START
# define G_C10_PROFILE_NO_START 10
#endif
#ifndef G_C10_PROFILE_NO_STEP
# define G_C10_PROFILE_NO_STEP 10
#endif

#ifndef G_C10_PROFILE_SEG_ID_START
# define G_C10_PROFILE_SEG_ID_START 1
#endif
#ifndef G_C10_PROFILE_SEG_ID_STEP
# define G_C10_PROFILE_SEG_ID_STEP 1
#endif
#ifndef G_C10_PROFILE_SEG_NO_START
# define G_C10_PROFILE_SEG_NO_START 10
#endif
#ifndef G_C10_PROFILE_SEG_NO_STEP
# define G_C10_PROFILE_SEG_NO_STEP 10
#endif

// =====================================================
// 내부 Helper (UserProfiles 전용)
// =====================================================

static uint8_t C10_nextProfileId_u8(const ST_A20_UserProfilesRoot_t& p_root) {
    uint8_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        uint16_t v_id = (uint16_t)p_root.items[v_i].profileId;
        if (v_id > 255u) continue;
        if ((uint8_t)v_id > v_max) v_max = (uint8_t)v_id;
    }

    uint16_t v_next = (uint16_t)v_max + (uint16_t)G_C10_PROFILE_ID_STEP;
    if (v_next == 0u) v_next = (uint16_t)G_C10_PROFILE_ID_START;
    if (v_next > 255u) return (uint8_t)G_C10_PROFILE_ID_START;
    if (v_next < (uint16_t)G_C10_PROFILE_ID_START) return (uint8_t)G_C10_PROFILE_ID_START;
    return (uint8_t)v_next;
}

static bool C10_isProfileIdDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint8_t p_id, uint8_t p_excludeIndex) {
    if (p_id == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        uint16_t v_id = (uint16_t)p_root.items[v_i].profileId;
        if (v_id > 255u) continue;
        if ((uint8_t)v_id == p_id) return true;
    }
    return false;
}

static bool C10_isProfileNoDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint16_t p_no, uint8_t p_excludeIndex) {
    if (p_no == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].profileNo == p_no) return true;
    }
    return false;
}

static bool C10_isProfileSegNoDuplicated(const ST_A20_UserProfileItem_t& p_p, uint16_t p_segNo, uint8_t p_excludeIndex) {
    if (p_segNo == 0) return true;
    for (uint8_t v_i = 0; v_i < p_p.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_p.segments[v_i].segNo == p_segNo) return true;
    }
    return false;
}

static bool C10_isProfileSegIdDuplicated(const ST_A20_UserProfileItem_t& p_p, uint8_t p_segId, uint8_t p_excludeIndex) {
    if (p_segId == 0) return true;
    for (uint8_t v_i = 0; v_i < p_p.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        if (v_i == p_excludeIndex) continue;
        uint16_t v_id = (uint16_t)p_p.segments[v_i].segId;
        if (v_id > 255u) continue;
        if ((uint8_t)v_id == p_segId) return true;
    }
    return false;
}

// -----------------------------------------------------
// JSON -> struct decode (UserProfile PUT/ADD/PATCH 공통)
//  - p_allowIdRead=true  : profileId/segId 읽기 허용(=file load)
//  - p_allowIdRead=false : profileId/segId 입력 무시(=API add/patch/update)
//  - p_forceProfileIdKeep=true: 호출자가 미리 set한 profileId 유지(=update PUT)
//  - segments에서 segId는 allowIdRead일 때만 읽고, 아니면 서버에서 재발급
// -----------------------------------------------------
static bool C10_fromJson_UserProfileItem(const JsonObjectConst&    p_jp,
                                        ST_A20_UserProfileItem_t& p_up,
                                        bool                      p_allowIdRead,
                                        bool                      p_forceProfileIdKeep,
                                        bool                      p_forceReissueSegId,
                                        const char*               p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    // profileId
    if (!p_forceProfileIdKeep) {
        if (p_allowIdRead) {
            uint16_t v_inId = (uint16_t)(p_jp["profileId"] | 0u);
            if (v_inId == 0u || v_inId > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileId=%u", v_caller, (unsigned)v_inId);
                return false;
            }
            p_up.profileId = (uint16_t)v_inId;
        } else {
            // API 입력 무시
        }
    }

    // profileNo (필수)
    {
        uint32_t v_no = (uint32_t)(p_jp["profileNo"] | 0u);
        if (v_no == 0u || v_no > 65535u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileNo=%u", v_caller, (unsigned)v_no);
            return false;
        }
        p_up.profileNo = (uint16_t)v_no;
    }

    // name / enabled
    A40_ComFunc::Json_copyStr(p_jp, "name", p_up.name, sizeof(p_up.name), "", v_caller);
    p_up.enabled = A40_ComFunc::Json_getBool(p_jp, "enabled", true);

    p_up.repeatSegments = A40_ComFunc::Json_getBool(p_jp, "repeatSegments", true);
    p_up.repeatCount    = (uint16_t)(p_jp["repeatCount"] | 0u);

    // segments
    p_up.segCount = 0;
    if (p_jp["segments"].is<JsonArrayConst>()) {
        JsonArrayConst v_sArr = p_jp["segments"].as<JsonArrayConst>();
        for (JsonObjectConst jseg : v_sArr) {
            if (p_up.segCount >= A20_Const::MAX_SEGMENTS_PER_PROFILE) break;

            ST_A20_UserProfileSegment_t& sg = p_up.segments[p_up.segCount];
            memset(&sg, 0, sizeof(sg));

            // segId
            if (!p_forceReissueSegId && p_allowIdRead) {
                uint16_t v_segIdIn = (uint16_t)(jseg["segId"] | 0u);
                if (v_segIdIn == 0u || v_segIdIn > 255u) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid segId=%u", v_caller, (unsigned)v_segIdIn);
                    return false;
                }
                sg.segId = (uint16_t)v_segIdIn;
            } else {
                sg.segId = 0; // 재발급 예정
            }

            // segNo (필수)
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
            A40_ComFunc::Json_copyStr(jseg, "styleCode", sg.styleCode, sizeof(sg.styleCode), "", v_caller);

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

            sg.fixedSpeed = (float)(jseg["fixedSpeed"] | 0.0f);

            p_up.segCount++;
        }
    }

    // autoOff (A40 공통 writer가 있으나, 여기서는 decode)
    memset(&p_up.autoOff, 0, sizeof(p_up.autoOff));
    if (p_jp["autoOff"].is<JsonObjectConst>()) {
        JsonObjectConst ao              = p_jp["autoOff"].as<JsonObjectConst>();
        JsonObjectConst aoTimer         = ao["timer"].as<JsonObjectConst>();
        JsonObjectConst aoOffTime       = ao["offTime"].as<JsonObjectConst>();
        JsonObjectConst aoOffTemp       = ao["offTemp"].as<JsonObjectConst>();

        p_up.autoOff.timer.enabled      = A40_ComFunc::Json_getBool(aoTimer, "enabled", false);
        p_up.autoOff.timer.minutes      = (uint16_t)(aoTimer["minutes"] | 0u);

        p_up.autoOff.offTime.enabled    = A40_ComFunc::Json_getBool(aoOffTime, "enabled", false);
        A40_ComFunc::Json_copyStr(aoOffTime, "time", p_up.autoOff.offTime.time, sizeof(p_up.autoOff.offTime.time), "", v_caller);

        p_up.autoOff.offTemp.enabled    = A40_ComFunc::Json_getBool(aoOffTemp, "enabled", false);
        p_up.autoOff.offTemp.temp       = A40_ComFunc::Json_getNum<float>(aoOffTemp, "temp", 0.0f);
    }

    // motion
    JsonObjectConst m          = p_jp["motion"].as<JsonObjectConst>();
    JsonObjectConst mpir       = m["pir"].as<JsonObjectConst>();
    JsonObjectConst mble       = m["ble"].as<JsonObjectConst>();

    p_up.motion.pir.enabled       = A40_ComFunc::Json_getBool(mpir, "enabled", false);
    p_up.motion.pir.holdSec       = (uint16_t)(mpir["holdSec"] | 0u);

    p_up.motion.ble.enabled       = A40_ComFunc::Json_getBool(mble, "enabled", false);
    p_up.motion.ble.rssiThreshold = (int16_t)(mble["rssiThreshold"] | -70);
    p_up.motion.ble.holdSec       = (uint16_t)(mble["holdSec"] | 0u);

    return true;
}

// -----------------------------------------------------
// 서버 발급: segId 재발급(1..), segNo는 유지(사용자 정렬 목적)
// + segNo 중복/0 검증
// -----------------------------------------------------
static bool C10_reissueProfileSegIdsAndValidateSegNos(ST_A20_UserProfileItem_t& p_up, const char* p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    // segNo 필수/0금지/중복금지
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

    // segId 서버 재발급(1..)
    uint8_t v_nextId = (uint8_t)G_C10_PROFILE_SEG_ID_START;
    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        p_up.segments[v_i].segId = (uint16_t)v_nextId;

        uint16_t v_tmp = (uint16_t)v_nextId + (uint16_t)G_C10_PROFILE_SEG_ID_STEP;
        if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_PROFILE_SEG_ID_START;
        v_nextId = (uint8_t)v_tmp;
    }

    // 재발급 후 segId 중복 마지막 방어
    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        uint16_t v_id = (uint16_t)p_up.segments[v_i].segId;
        if (v_id == 0u || v_id > 255u) return false;
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_up.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_j++) {
            if (p_up.segments[v_i].segId == p_up.segments[v_j].segId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated segId=%u after reissue", v_caller, (unsigned)p_up.segments[v_i].segId);
                return false;
            }
        }
    }

    return true;
}

// -----------------------------------------------------
// File Load 검증 (profileId/profileNo/segId/segNo 필수/0/중복/범위)
// -----------------------------------------------------
static bool C10_validateUserProfilesLoaded(const ST_A20_UserProfilesRoot_t& p_root, const char* p_callerForLog) {
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
            uint16_t v_pid2 = (uint16_t)p_root.items[v_j].profileId;
            if (v_pid2 == v_pid) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileId=%u", v_caller, (unsigned)v_pid);
                return false;
            }
            if (p_root.items[v_j].profileNo == up.profileNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileNo=%u", v_caller, (unsigned)up.profileNo);
                return false;
            }
        }

        if (up.segCount > A20_Const::MAX_SEGMENTS_PER_PROFILE) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segCount overflow(profileId=%u, segCount=%u)", v_caller, (unsigned)v_pid, (unsigned)up.segCount);
            return false;
        }

        for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_k++) {
            const ST_A20_UserProfileSegment_t& sg = up.segments[v_k];

            uint16_t v_sid = (uint16_t)sg.segId;
            if (v_sid == 0u || v_sid > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid segId=%u (profileId=%u)", v_caller, (unsigned)v_sid, (unsigned)v_pid);
                return false;
            }
            if (sg.segNo == 0u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segNo is 0 (profileId=%u, segId=%u)", v_caller, (unsigned)v_pid, (unsigned)v_sid);
                return false;
            }

            for (uint8_t v_m = (uint8_t)(v_k + 1); v_m < up.segCount && v_m < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_m++) {
                const ST_A20_UserProfileSegment_t& sg2 = up.segments[v_m];
                if (sg.segId == sg2.segId) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated segId=%u (profileId=%u)", v_caller, (unsigned)sg.segId, (unsigned)v_pid);
                    return false;
                }
                if (sg.segNo == sg2.segNo) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated segNo=%u (profileId=%u)", v_caller, (unsigned)sg.segNo, (unsigned)v_pid);
                    return false;
                }
            }
        }
    }

    return true;
}

static bool C10_validateUserProfilesBeforeSave(const ST_A20_UserProfilesRoot_t& p_cfg, const char* p_callerForLog) {
    return C10_validateUserProfilesLoaded(p_cfg, p_callerForLog);
}

// =====================================================
// Load (UserProfiles)
//  - File Load에서는 profileId/segId 읽기 허용(검증은 수행)
// =====================================================
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

        // File Load: profileId/segId 읽기 허용 + 필수/중복/0/범위 검증
        if (!C10_fromJson_UserProfileItem(jp, up, true, false, false, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: profile decode failed (idx=%u). Load rejected.", __func__, (unsigned)p_cfg.count);
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

// =====================================================
// Save (UserProfiles)
//  - save 직전 마지막 방어선 검증(profileId/profileNo/segId/segNo)
// =====================================================
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

        // A40 공통 writer 사용
        A40_ComFunc::Json_writeAutoOff(jp["autoOff"].to<JsonObject>(), up.autoOff);
        A40_ComFunc::Json_writeMotion(jp, up.motion);
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.userProfiles, d, true, true, __func__);
}

// =====================================================
// JSON Export (UserProfiles)
// =====================================================
void CL_C10_ConfigManager::toJson_UserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg, JsonDocument& d) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    // 공통 remove helper
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

// =====================================================
// JSON Patch (UserProfiles)
//  - PUT(전체 replace) 고정
//    * API 입력 profileId/segId 무시(서버 발급)
//    * profileNo/segNo 필수/0금지/중복검증
//    * segId 서버 재발급(1..)
// =====================================================
bool CL_C10_ConfigManager::patchUserProfilesFromJson(ST_A20_UserProfilesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonArrayConst arr = p_patch["userProfiles"]["profiles"].as<JsonArrayConst>();
    if (arr.isNull()) {
        return false;
    }

    A20_resetUserProfilesDefault(p_cfg);
    p_cfg.count = 0;

    uint8_t v_nextProfileId = (uint8_t)G_C10_PROFILE_ID_START;

    for (JsonObjectConst jp : arr) {
        if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

        ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count];
        memset(&up, 0, sizeof(up));

        // profileId 발급(입력 무시)
        up.profileId = (uint16_t)v_nextProfileId;

        // decode (profileId keep, segId ignore)
        if (!C10_fromJson_UserProfileItem(jp, up, false, true, true, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: decode failed. Patch rejected.", __func__);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }

        // profileNo 중복 즉시 검증
        if (C10_isProfileNoDuplicated(p_cfg, up.profileNo, p_cfg.count)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileNo=%u. Patch rejected.", __func__, (unsigned)up.profileNo);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }

        // segId 재발급 + segNo 중복 검증
        if (!C10_reissueProfileSegIdsAndValidateSegNos(up, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segment validation failed. Patch rejected.", __func__);
            A20_resetUserProfilesDefault(p_cfg);
            return false;
        }

        p_cfg.count++;

        // next profileId
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

// =====================================================
// CRUD - UserProfiles
//  - add: profileId 서버 발급 / profileNo 필수/중복검증 / segId 서버 발급 / segNo 필수/중복검증
//  - update=PUT: profileId 유지 + segId 서버 재발급 + profileNo/segNo 필수/중복검증 강화
// =====================================================

int CL_C10_ConfigManager::addUserProfilesFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return -1;
    }

    if (!g_A20_config_root.userProfiles) {
        g_A20_config_root.userProfiles = new (std::nothrow) ST_A20_UserProfilesRoot_t();
        if (!g_A20_config_root.userProfiles) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: new failed (out of memory)");
            return -1;
        }
        A20_resetUserProfilesDefault(*g_A20_config_root.userProfiles);
    }

    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    if (v_root.count >= A20_Const::MAX_USER_PROFILES) {
        return -1;
    }

    JsonObjectConst jp = p_doc["profile"].is<JsonObjectConst>() ? p_doc["profile"].as<JsonObjectConst>()
                                                                : p_doc.as<JsonObjectConst>();

    // profileNo 필수/0금지/중복검증
    uint32_t v_no32 = (uint32_t)(jp["profileNo"] | 0u);
    if (v_no32 == 0u || v_no32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: invalid profileNo=%u", (unsigned)v_no32);
        return -2;
    }
    uint16_t v_no = (uint16_t)v_no32;

    if (C10_isProfileNoDuplicated(v_root, v_no, 255)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: duplicated profileNo=%u", (unsigned)v_no);
        return -3;
    }

    ST_A20_UserProfileItem_t& up = v_root.items[v_root.count];
    memset(&up, 0, sizeof(up));

    // profileId 서버 발급
    uint8_t v_newId = C10_nextProfileId_u8(v_root);
    up.profileId    = (uint16_t)v_newId;

    // decode (profileId keep, segId ignore)
    if (!C10_fromJson_UserProfileItem(jp, up, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: decode failed");
        return -4;
    }

    // segId 재발급 + segNo 검증
    if (!C10_reissueProfileSegIdsAndValidateSegNos(up, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: segment validation failed");
        return -5;
    }

    // profileId 중복 방어
    if (C10_isProfileIdDuplicated(v_root, v_newId, v_root.count)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: duplicated profileId=%u", (unsigned)v_newId);
        return -6;
    }

    int v_index = (int)v_root.count;
    v_root.count++;

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] UserProfile added (index=%d, profileId=%u, profileNo=%u)",
                       v_index,
                       (unsigned)v_newId,
                       (unsigned)up.profileNo);

    return v_index;
}

bool CL_C10_ConfigManager::updateUserProfilesFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.userProfiles) {
        return false;
    }

    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if ((uint16_t)v_root.items[v_i].profileId == (uint16_t)p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    JsonObjectConst jp = p_patch["profile"].is<JsonObjectConst>() ? p_patch["profile"].as<JsonObjectConst>()
                                                                  : p_patch.as<JsonObjectConst>();

    // PUT: profileNo 필수 + 중복검증
    uint32_t v_no32 = (uint32_t)(jp["profileNo"] | 0u);
    if (v_no32 == 0u || v_no32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: invalid profileNo=%u", (unsigned)v_no32);
        return false;
    }
    uint16_t v_newNo = (uint16_t)v_no32;

    if (C10_isProfileNoDuplicated(v_root, v_newNo, (uint8_t)v_idx)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] updateUserProfile: duplicated profileNo=%u (profileId=%u)",
                           (unsigned)v_newNo,
                           (unsigned)p_id);
        return false;
    }

    // profileId 유지
    uint16_t v_keepId = (uint16_t)v_root.items[(uint8_t)v_idx].profileId;
    if (v_keepId == 0u || v_keepId > 255u) return false;

    // PUT: 통째 replace
    ST_A20_UserProfileItem_t v_new;
    memset(&v_new, 0, sizeof(v_new));
    v_new.profileId = v_keepId;

    if (!C10_fromJson_UserProfileItem(jp, v_new, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: decode failed (profileId=%u)", (unsigned)v_keepId);
        return false;
    }

    if (!C10_reissueProfileSegIdsAndValidateSegNos(v_new, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: segment validation failed (profileId=%u)", (unsigned)v_keepId);
        return false;
    }

    v_root.items[(uint8_t)v_idx] = v_new;

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] UserProfile updated (PUT, profileId=%u, index=%d, profileNo=%u)",
                       (unsigned)p_id,
                       v_idx,
                       (unsigned)v_root.items[(uint8_t)v_idx].profileNo);

    return true;
}

bool CL_C10_ConfigManager::deleteUserProfiles(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.userProfiles) {
        return false;
    }

    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if ((uint16_t)v_root.items[v_i].profileId == (uint16_t)p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        v_root.items[v_i - 1] = v_root.items[v_i];
    }
    if (v_root.count > 0) v_root.count--;

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile deleted (profileId=%u, index=%d)", (unsigned)p_id, v_idx);

    return true;
}
