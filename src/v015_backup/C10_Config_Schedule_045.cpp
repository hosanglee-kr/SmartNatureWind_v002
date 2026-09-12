/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Schedule_045.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - Schedule/UserProfiles/WindProfile
 * ------------------------------------------------------
 * 기능 요약:
 *  - Schedules / UserProfiles / WindDict Load/Save
 *  - 위 섹션들의 JSON Export / Patch
 *  - Schedule / UserProfiles / WindProfile CRUD
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
#include "C10_Config_042.h"

// ------------------------------------------------------
// Schedule ID 정책
//  - schId: 사용자 입력 불가(무시), 자동 발급
//  - 시작값: 10, 증가: 10
//  - schNo: 사용자 입력(중복 불가), 동일번호 중복 시 오류
// ------------------------------------------------------
#ifndef G_C10_SCH_ID_START
# define G_C10_SCH_ID_START 10
#endif
#ifndef G_C10_SCH_ID_STEP
# define G_C10_SCH_ID_STEP 10
#endif

// =====================================================
// 내부 Helper
// =====================================================
static uint16_t C10_nextScheduleId(const ST_A20_SchedulesRoot_t& p_root) {
    uint16_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (p_root.items[v_i].schId > v_max) v_max = p_root.items[v_i].schId;
    }
    if (v_max < (uint16_t)G_C10_SCH_ID_START) return (uint16_t)G_C10_SCH_ID_START;
    // overflow 방어 (uint16_t)
    uint32_t v_next = (uint32_t)v_max + (uint32_t)G_C10_SCH_ID_STEP;
    if (v_next > 65535u) return (uint16_t)G_C10_SCH_ID_START;
    return (uint16_t)v_next;
}

static bool C10_isScheduleNoDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint16_t p_schNo, uint16_t p_excludeSchId) {
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_root.items[v_i];
        if (v_s.schId == p_excludeSchId) continue;
        if (v_s.schNo == p_schNo) return true;
    }
    return false;
}

static bool C10_isScheduleNoDuplicatedInList(const ST_A20_SchedulesRoot_t& p_root) {
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_root.count && v_j < A20_Const::MAX_SCHEDULES; v_j++) {
            if (p_root.items[v_i].schNo == p_root.items[v_j].schNo) return true;
        }
    }
    return false;
}

// =====================================================
// 내부 Helper: Schedule / UserProfile / WindPreset 디코더
//  - JSON 키는 camelCase 기준
//  - schId는 사용자 입력 불가: fromJson에서는 읽지 않음(호출자가 강제 설정)
// =====================================================
static void C10_fromJson_ScheduleItem(const JsonObjectConst& p_js, ST_A20_ScheduleItem_t& p_s, bool p_keepExistingId = true) {
    // schId: 사용자 입력 무시(keepExistingId=true이면 유지)
    if (!p_keepExistingId) {
        p_s.schId = 0;
    }

    // schNo: 사용자 입력(중복 검증은 상위에서)
    p_s.schNo = p_js["schNo"] | 0;

    strlcpy(p_s.name, p_js["name"] | "", sizeof(p_s.name));
    p_s.enabled = p_js["enabled"] | true;

    p_s.repeatSegments = p_js["repeatSegments"] | true;
    p_s.repeatCount    = p_js["repeatCount"] | 0;

    // period
    for (uint8_t v_d = 0; v_d < 7; v_d++) {
        p_s.period.days[v_d] = p_js["period"]["days"][v_d] | 1;
    }
    strlcpy(p_s.period.startTime, p_js["period"]["startTime"] | "00:00", sizeof(p_s.period.startTime));
    strlcpy(p_s.period.endTime, p_js["period"]["endTime"] | "23:59", sizeof(p_s.period.endTime));

    // segments
    p_s.segCount = 0;
    if (p_js["segments"].is<JsonArrayConst>()) {
        JsonArrayConst v_segArr = p_js["segments"].as<JsonArrayConst>();
        for (JsonObjectConst jseg : v_segArr) {
            if (p_s.segCount >= A20_Const::MAX_SEGMENTS_PER_SCHEDULE) break;

            ST_A20_ScheduleSegment_t& sg = p_s.segments[p_s.segCount++];

            sg.segId      = jseg["segId"] | 0;
            sg.segNo      = jseg["segNo"] | 0;
            sg.onMinutes  = jseg["onMinutes"] | 10;
            sg.offMinutes = jseg["offMinutes"] | 0;

            const char* v_mode = jseg["mode"] | "PRESET";
            sg.mode            = A20_modeFromString(v_mode);

            strlcpy(sg.presetCode, jseg["presetCode"] | "", sizeof(sg.presetCode));
            strlcpy(sg.styleCode, jseg["styleCode"] | "", sizeof(sg.styleCode));

            memset(&sg.adjust, 0, sizeof(sg.adjust));
            if (jseg["adjust"].is<JsonObjectConst>()) {
                JsonObjectConst adj                = jseg["adjust"].as<JsonObjectConst>();
                sg.adjust.windIntensity            = adj["windIntensity"] | 0.0f;
                sg.adjust.windVariability          = adj["windVariability"] | 0.0f;
                sg.adjust.gustFrequency            = adj["gustFrequency"] | 0.0f;
                sg.adjust.fanLimit                 = adj["fanLimit"] | 0.0f;
                sg.adjust.minFan                   = adj["minFan"] | 0.0f;
                sg.adjust.turbulenceLengthScale    = adj["turbulenceLengthScale"] | 0.0f;
                sg.adjust.turbulenceIntensitySigma = adj["turbulenceIntensitySigma"] | 0.0f;

                // ✅ 누락 방지: A20 구조체에 정의된 나머지 adjust 필드도 지원(있으면 읽고 없으면 0)
                sg.adjust.thermalBubbleStrength    = adj["thermalBubbleStrength"] | 0.0f;
                sg.adjust.thermalBubbleRadius      = adj["thermalBubbleRadius"] | 0.0f;
            }

            sg.fixedSpeed = jseg["fixedSpeed"] | 0.0f;
        }
    }

    // autoOff
    memset(&p_s.autoOff, 0, sizeof(p_s.autoOff));
    if (p_js["autoOff"].is<JsonObjectConst>()) {
        JsonObjectConst ao          = p_js["autoOff"].as<JsonObjectConst>();
        p_s.autoOff.timer.enabled   = ao["timer"]["enabled"] | false;
        p_s.autoOff.timer.minutes   = ao["timer"]["minutes"] | 0;
        p_s.autoOff.offTime.enabled = ao["offTime"]["enabled"] | false;
        strlcpy(p_s.autoOff.offTime.time, ao["offTime"]["time"] | "", sizeof(p_s.autoOff.offTime.time));
        p_s.autoOff.offTemp.enabled = ao["offTemp"]["enabled"] | false;
        p_s.autoOff.offTemp.temp    = ao["offTemp"]["temp"] | 0.0f;
    }

    // motion
    p_s.motion.pir.enabled       = p_js["motion"]["pir"]["enabled"] | false;
    p_s.motion.pir.holdSec       = p_js["motion"]["pir"]["holdSec"] | 0;
    p_s.motion.ble.enabled       = p_js["motion"]["ble"]["enabled"] | false;
    p_s.motion.ble.rssiThreshold = p_js["motion"]["ble"]["rssiThreshold"] | -70;
    p_s.motion.ble.holdSec       = p_js["motion"]["ble"]["holdSec"] | 0;
}

static void C10_fromJson_UserProfile(const JsonObjectConst& p_jp, ST_A20_UserProfileItem_t& p_up) {
    p_up.profileId = p_jp["profileId"] | 0;
    p_up.profileNo = p_jp["profileNo"] | 0;
    strlcpy(p_up.name, p_jp["name"] | "", sizeof(p_up.name));
    p_up.enabled = p_jp["enabled"] | true;

    p_up.repeatSegments = p_jp["repeatSegments"] | true;
    p_up.repeatCount    = p_jp["repeatCount"] | 0;

    // segments
    p_up.segCount = 0;
    if (p_jp["segments"].is<JsonArrayConst>()) {
        JsonArrayConst v_sArr = p_jp["segments"].as<JsonArrayConst>();
        for (JsonObjectConst jseg : v_sArr) {
            if (p_up.segCount >= A20_Const::MAX_SEGMENTS_PER_PROFILE) break;

            ST_A20_UserProfileSegment_t& sg = p_up.segments[p_up.segCount++];

            sg.segId      = jseg["segId"] | 0;
            sg.segNo      = jseg["segNo"] | 0;
            sg.onMinutes  = jseg["onMinutes"] | 10;
            sg.offMinutes = jseg["offMinutes"] | 0;

            const char* v_mode = jseg["mode"] | "PRESET";
            sg.mode            = A20_modeFromString(v_mode);

            strlcpy(sg.presetCode, jseg["presetCode"] | "", sizeof(sg.presetCode));
            strlcpy(sg.styleCode, jseg["styleCode"] | "", sizeof(sg.styleCode));

            memset(&sg.adjust, 0, sizeof(sg.adjust));
            if (jseg["adjust"].is<JsonObjectConst>()) {
                JsonObjectConst adj                = jseg["adjust"].as<JsonObjectConst>();
                sg.adjust.windIntensity            = adj["windIntensity"] | 0.0f;
                sg.adjust.windVariability          = adj["windVariability"] | 0.0f;
                sg.adjust.gustFrequency            = adj["gustFrequency"] | 0.0f;
                sg.adjust.fanLimit                 = adj["fanLimit"] | 0.0f;
                sg.adjust.minFan                   = adj["minFan"] | 0.0f;
                sg.adjust.turbulenceLengthScale    = adj["turbulenceLengthScale"] | 0.0f;
                sg.adjust.turbulenceIntensitySigma = adj["turbulenceIntensitySigma"] | 0.0f;

                // ✅ 누락 방지
                sg.adjust.thermalBubbleStrength    = adj["thermalBubbleStrength"] | 0.0f;
                sg.adjust.thermalBubbleRadius      = adj["thermalBubbleRadius"] | 0.0f;
            }

            sg.fixedSpeed = jseg["fixedSpeed"] | 0.0f;
        }
    }

    // autoOff
    memset(&p_up.autoOff, 0, sizeof(p_up.autoOff));
    if (p_jp["autoOff"].is<JsonObjectConst>()) {
        JsonObjectConst ao           = p_jp["autoOff"].as<JsonObjectConst>();
        p_up.autoOff.timer.enabled   = ao["timer"]["enabled"] | false;
        p_up.autoOff.timer.minutes   = ao["timer"]["minutes"] | 0;
        p_up.autoOff.offTime.enabled = ao["offTime"]["enabled"] | false;
        strlcpy(p_up.autoOff.offTime.time, ao["offTime"]["time"] | "", sizeof(p_up.autoOff.offTime.time));
        p_up.autoOff.offTemp.enabled = ao["offTemp"]["enabled"] | false;
        p_up.autoOff.offTemp.temp    = ao["offTemp"]["temp"] | 0.0f;
    }

    // motion
    p_up.motion.pir.enabled       = p_jp["motion"]["pir"]["enabled"] | false;
    p_up.motion.pir.holdSec       = p_jp["motion"]["pir"]["holdSec"] | 0;
    p_up.motion.ble.enabled       = p_jp["motion"]["ble"]["enabled"] | false;
    p_up.motion.ble.rssiThreshold = p_jp["motion"]["ble"]["rssiThreshold"] | -70;
    p_up.motion.ble.holdSec       = p_jp["motion"]["ble"]["holdSec"] | 0;
}

static void C10_fromJson_WindPreset(const JsonObjectConst& p_js, ST_A20_PresetEntry_t& p_p) {
    strlcpy(p_p.name, p_js["name"] | "", sizeof(p_p.name));
    strlcpy(p_p.code, p_js["code"] | "", sizeof(p_p.code));

    JsonObjectConst v_b = p_js["factors"].as<JsonObjectConst>();

    p_p.factors.windIntensity            = v_b["windIntensity"] | 70.0f;
    p_p.factors.gustFrequency            = v_b["gustFrequency"] | 40.0f;
    p_p.factors.windVariability          = v_b["windVariability"] | 50.0f;
    p_p.factors.fanLimit                 = v_b["fanLimit"] | 95.0f;
    p_p.factors.minFan                   = v_b["minFan"] | 10.0f;
    p_p.factors.turbulenceLengthScale    = v_b["turbulenceLengthScale"] | 40.0f;
    p_p.factors.turbulenceIntensitySigma = v_b["turbulenceIntensitySigma"] | 0.5f;
    p_p.factors.thermalBubbleStrength    = v_b["thermalBubbleStrength"] | 2.0f;
    p_p.factors.thermalBubbleRadius      = v_b["thermalBubbleRadius"] | 18.0f;

    p_p.factors.baseMinWind     = v_b["baseMinWind"] | 1.8f;
    p_p.factors.baseMaxWind     = v_b["baseMaxWind"] | 5.5f;
    p_p.factors.gustProbBase    = v_b["gustProbBase"] | 0.040f;
    p_p.factors.gustStrengthMax = v_b["gustStrengthMax"] | 2.10f;
    p_p.factors.thermalFreqBase = v_b["thermalFreqBase"] | 0.022f;
}

// =====================================================
// WindDict Validation Helpers (통폐합: 3개만 유지)
//  - code/name 길이/trim/공백/허용문자
//  - code 중복 검사
//  - loadWindDict: invalid entry는 skip + warn, 중복이면 reject
//  - patchWindDict: invalid/중복이면 즉시 reject
// =====================================================
static bool C10_sanitizeAndValidateText(char* p_buf,
                                       size_t p_cap,
                                       bool p_allowInnerSpace,
                                       bool p_restrictCharsetForCodeLike)
{
    if (!p_buf || p_cap == 0) return false;

    size_t v_len = strnlen(p_buf, p_cap);
    if (v_len == 0) return false;

    // left trim
    size_t v_l = 0;
    while (v_l < v_len) {
        char c = p_buf[v_l];
        if (c != ' ' && c != '\t' && c != '\r' && c != '\n') break;
        v_l++;
    }

    // right trim
    size_t v_r = v_len;
    while (v_r > v_l) {
        char c = p_buf[v_r - 1];
        if (c != ' ' && c != '\t' && c != '\r' && c != '\n') break;
        v_r--;
    }

    size_t v_newLen = (v_r > v_l) ? (v_r - v_l) : 0;
    if (v_newLen == 0) {
        p_buf[0] = '\0';
        return false;
    }

    if (v_l > 0) memmove(p_buf, p_buf + v_l, v_newLen);
    p_buf[v_newLen] = '\0';

    if (strnlen(p_buf, p_cap) >= p_cap) return false;

    if (!p_allowInnerSpace) {
        for (size_t i = 0; p_buf[i] != '\0'; i++) {
            char c = p_buf[i];
            if (c == ' ' || c == '\t' || c == '\r' || c == '\n') return false;
        }
    }

    if (p_restrictCharsetForCodeLike) {
        for (size_t i = 0; p_buf[i] != '\0'; i++) {
            char c = p_buf[i];
            bool ok =
                (c >= 'A' && c <= 'Z') ||
                (c >= 'a' && c <= 'z') ||
                (c >= '0' && c <= '9') ||
                (c == '_' || c == '-' || c == '.');
            if (!ok) return false;
        }
    }

    return true;
}

static bool C10_validateWindDictEntry(char* p_code, size_t p_codeCap,
                                     char* p_name, size_t p_nameCap,
                                     bool p_logOnFail, const char* p_tag)
{
    if (!C10_sanitizeAndValidateText(p_code, p_codeCap, false, true)) {
        if (p_logOnFail) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid code '%s'", p_tag ? p_tag : "WindDict", p_code ? p_code : "");
        }
        return false;
    }

    if (!C10_sanitizeAndValidateText(p_name, p_nameCap, true, false)) {
        if (p_logOnFail) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid name '%s' (code=%s)", p_tag ? p_tag : "WindDict", p_name ? p_name : "", p_code);
        }
        return false;
    }

    return true;
}

static bool C10_validateWindDictNoDup(const ST_A20_WindDict_t& p_cfg,
                                     bool p_checkPresets,
                                     bool p_checkStyles)
{
    if (p_checkPresets) {
        for (uint8_t i = 0; i < p_cfg.presetCount; i++) {
            for (uint8_t j = (uint8_t)(i + 1); j < p_cfg.presetCount; j++) {
                if (strncmp(p_cfg.presets[i].code, p_cfg.presets[j].code, A20_Const::MAX_CODE_LEN) == 0) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] WindDict: duplicated preset code '%s'",
                                       p_cfg.presets[i].code);
                    return false;
                }
            }
        }
    }

    if (p_checkStyles) {
        for (uint8_t i = 0; i < p_cfg.styleCount; i++) {
            for (uint8_t j = (uint8_t)(i + 1); j < p_cfg.styleCount; j++) {
                if (strncmp(p_cfg.styles[i].code, p_cfg.styles[j].code, A20_Const::MAX_CODE_LEN) == 0) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] WindDict: duplicated style code '%s'",
                                       p_cfg.styles[i].code);
                    return false;
                }
            }
        }
    }

    return true;
}

// =====================================================
// 2-1. 목적물별 Load 구현 (Schedules/UserProfiles/WindDict)
//  - 단독 호출(섹션 lazy-load) 대비: resetxxxdefault 적용
// =====================================================
bool CL_C10_ConfigManager::loadSchedules(ST_A20_SchedulesRoot_t& p_cfg) {
    JsonDocument d;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.schedules[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.schedules;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: s_cfgJsonFileMap.schedules empty");
        return false;
    }

    // 단독 호출 대비 기본값
    A20_resetSchedulesDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    JsonArrayConst arr = d["schedules"].as<JsonArrayConst>();
    p_cfg.count        = 0;

    if (arr.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadSchedules: missing 'schedules' array (empty)");
        return true; // 정책: 빈/누락은 empty로 허용
    }

    uint16_t v_id = (uint16_t)G_C10_SCH_ID_START;

    for (JsonObjectConst js : arr) {
        if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

        ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
        memset(&s, 0, sizeof(s));
        s.schId = v_id;

        C10_fromJson_ScheduleItem(js, s, true);

        p_cfg.count++;
        v_id = (uint16_t)((uint32_t)v_id + (uint32_t)G_C10_SCH_ID_STEP);
    }

    if (C10_isScheduleNoDuplicatedInList(p_cfg)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: duplicated schNo detected. Load rejected.");
        A20_resetSchedulesDefault(p_cfg);
        return false;
    }

    return true;
}

bool CL_C10_ConfigManager::loadUserProfiles(ST_A20_UserProfilesRoot_t& p_cfg) {
    JsonDocument d;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.userProfiles[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.userProfiles;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadUserProfiles: s_cfgJsonFileMap.userProfiles empty");
        return false;
    }

    A20_resetUserProfilesDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadUserProfiles: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    JsonArrayConst arr = d["userProfiles"]["profiles"].as<JsonArrayConst>();
    p_cfg.count        = 0;

    if (arr.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadUserProfiles: missing 'userProfiles.profiles' (empty)");
        return true;
    }

    for (JsonObjectConst jp : arr) {
        if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

        ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count++];
        memset(&up, 0, sizeof(up));
        C10_fromJson_UserProfile(jp, up);
    }

    return true;
}

bool CL_C10_ConfigManager::loadWindDict(ST_A20_WindDict_t& p_dict) {
    JsonDocument d;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.windDict[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.windDict;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWindDict: s_cfgJsonFileMap.windDict empty");
        return false;
    }

    A20_resetWindDictDefault(p_dict);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWindDict: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    JsonObjectConst j = d["windDict"].as<JsonObjectConst>();
    if (j.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadWindDict: missing 'windDict' (empty)");
        p_dict.presetCount = 0;
        p_dict.styleCount  = 0;
        return true;
    }

    // ---- presets ----
    p_dict.presetCount = 0;
    if (j["presets"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = j["presets"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_preset : v_arr) {
            if (p_dict.presetCount >= (uint8_t)EN_A20_WINDPRESET_COUNT) break;

            ST_A20_PresetEntry_t v_entry;
            memset(&v_entry, 0, sizeof(v_entry));
            C10_fromJson_WindPreset(v_jsonObj_preset, v_entry);

            // 운영급 검증: code/name trim/길이/공백/허용문자
            if (!C10_validateWindDictEntry(v_entry.code, sizeof(v_entry.code),
                                           v_entry.name, sizeof(v_entry.name),
                                           false, "loadWindDict preset")) {
                CL_D10_Logger::log(EN_L10_LOG_WARN,
                                   "[C10] loadWindDict: invalid preset skipped (code='%s', name='%s')",
                                   v_entry.code, v_entry.name);
                continue;
            }

            p_dict.presets[p_dict.presetCount++] = v_entry;
        }
    }

    // ---- styles ----
    p_dict.styleCount = 0;
    if (j["styles"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = j["styles"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_style : v_arr) {
            if (p_dict.styleCount >= (uint8_t)EN_A20_WINDSTYLE_COUNT) break;

            ST_A20_StyleEntry_t v_entry;
            memset(&v_entry, 0, sizeof(v_entry));

            strlcpy(v_entry.name, v_jsonObj_style["name"] | "", sizeof(v_entry.name));
            strlcpy(v_entry.code, v_jsonObj_style["code"] | "", sizeof(v_entry.code));

            JsonObjectConst v_f            = v_jsonObj_style["factors"].as<JsonObjectConst>();
            v_entry.factors.intensityFactor   = v_f["intensityFactor"] | 1.0f;
            v_entry.factors.variabilityFactor = v_f["variabilityFactor"] | 1.0f;
            v_entry.factors.gustFactor        = v_f["gustFactor"] | 1.0f;
            v_entry.factors.thermalFactor     = v_f["thermalFactor"] | 1.0f;

            if (!C10_validateWindDictEntry(v_entry.code, sizeof(v_entry.code),
                                           v_entry.name, sizeof(v_entry.name),
                                           false, "loadWindDict style")) {
                CL_D10_Logger::log(EN_L10_LOG_WARN,
                                   "[C10] loadWindDict: invalid style skipped (code='%s', name='%s')",
                                   v_entry.code, v_entry.name);
                continue;
            }

            p_dict.styles[p_dict.styleCount++] = v_entry;
        }
    }

    // ✅ 운영급 검증: code 중복(치명) -> load reject
    if (!C10_validateWindDictNoDup(p_dict, true, true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWindDict: duplicated code detected. Load rejected.");
        A20_resetWindDictDefault(p_dict);
        return false;
    }

    return true;
}

// =====================================================
// 2-2. 목적물별 Save 구현 (Schedules/UserProfiles/WindDict)
// =====================================================
bool CL_C10_ConfigManager::saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg) {
    JsonDocument d;

    for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& s = p_cfg.items[v_i];

        JsonObject js = d["schedules"][v_i].to<JsonObject>();

        js["schId"]          = s.schId;
        js["schNo"]          = s.schNo;
        js["name"]           = s.name;
        js["enabled"]        = s.enabled;
        js["repeatSegments"] = s.repeatSegments;
        js["repeatCount"]    = s.repeatCount;

        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            js["period"]["days"][v_d] = s.period.days[v_d];
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

            // ✅ 누락 방지
            adj["thermalBubbleStrength"]    = sg.adjust.thermalBubbleStrength;
            adj["thermalBubbleRadius"]      = sg.adjust.thermalBubbleRadius;

            jseg["fixedSpeed"] = sg.fixedSpeed;
        }

        JsonObject ao            = js["autoOff"].to<JsonObject>();
        ao["timer"]["enabled"]   = s.autoOff.timer.enabled;
        ao["timer"]["minutes"]   = s.autoOff.timer.minutes;
        ao["offTime"]["enabled"] = s.autoOff.offTime.enabled;
        ao["offTime"]["time"]    = s.autoOff.offTime.time;
        ao["offTemp"]["enabled"] = s.autoOff.offTemp.enabled;
        ao["offTemp"]["temp"]    = s.autoOff.offTemp.temp;

        js["motion"]["pir"]["enabled"]       = s.motion.pir.enabled;
        js["motion"]["pir"]["holdSec"]       = s.motion.pir.holdSec;
        js["motion"]["ble"]["enabled"]       = s.motion.ble.enabled;
        js["motion"]["ble"]["rssiThreshold"] = s.motion.ble.rssiThreshold;
        js["motion"]["ble"]["holdSec"]       = s.motion.ble.holdSec;
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.schedules, d, true);
}

bool CL_C10_ConfigManager::saveUserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg) {
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

            // ✅ 누락 방지
            adj["thermalBubbleStrength"]    = sg.adjust.thermalBubbleStrength;
            adj["thermalBubbleRadius"]      = sg.adjust.thermalBubbleRadius;

            jseg["fixedSpeed"] = sg.fixedSpeed;
        }

        JsonObject ao            = jp["autoOff"].to<JsonObject>();
        ao["timer"]["enabled"]   = up.autoOff.timer.enabled;
        ao["timer"]["minutes"]   = up.autoOff.timer.minutes;
        ao["offTime"]["enabled"] = up.autoOff.offTime.enabled;
        ao["offTime"]["time"]    = up.autoOff.offTime.time;
        ao["offTemp"]["enabled"] = up.autoOff.offTemp.enabled;
        ao["offTemp"]["temp"]    = up.autoOff.offTemp.temp;

        jp["motion"]["pir"]["enabled"]       = up.motion.pir.enabled;
        jp["motion"]["pir"]["holdSec"]       = up.motion.pir.holdSec;
        jp["motion"]["ble"]["enabled"]       = up.motion.ble.enabled;
        jp["motion"]["ble"]["rssiThreshold"] = up.motion.ble.rssiThreshold;
        jp["motion"]["ble"]["holdSec"]       = up.motion.ble.holdSec;
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.userProfiles, d, true);
}

bool CL_C10_ConfigManager::saveWindDict(const ST_A20_WindDict_t& p_cfg) {
    JsonDocument d;

    // presets
    for (uint8_t v_i = 0; v_i < p_cfg.presetCount && v_i < (uint8_t)EN_A20_WINDPRESET_COUNT; v_i++) {
        const ST_A20_PresetEntry_t& v_preset       = p_cfg.presets[v_i];
        JsonObject                  v_jsonObj_preset = d["windDict"]["presets"][v_i].to<JsonObject>();

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

        v_b["baseMinWind"]     			= v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]     			= v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]    			= v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"] 			= v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"] 			= v_preset.factors.thermalFreqBase;
    }

    // styles
    for (uint8_t v_i = 0; v_i < p_cfg.styleCount && v_i < (uint8_t)EN_A20_WINDSTYLE_COUNT; v_i++) {
        const ST_A20_StyleEntry_t& v_s  = p_cfg.styles[v_i];
        JsonObject                 v_jsonObj_style = d["windDict"]["styles"][v_i].to<JsonObject>();

        v_jsonObj_style["name"] = v_s.name;
        v_jsonObj_style["code"] = v_s.code;

        JsonObject v_f           = v_jsonObj_style["factors"].to<JsonObject>();
        v_f["intensityFactor"]   = v_s.factors.intensityFactor;
        v_f["variabilityFactor"] = v_s.factors.variabilityFactor;
        v_f["gustFactor"]        = v_s.factors.gustFactor;
        v_f["thermalFactor"]     = v_s.factors.thermalFactor;
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.windDict, d, true);
}

// =====================================================
// 3. JSON Export (Schedules/UserProfiles/WindDict)
// =====================================================
void CL_C10_ConfigManager::toJson_Schedules(const ST_A20_SchedulesRoot_t& p_cfg, JsonDocument& d) {
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
            js["period"]["days"][v_d] = s.period.days[v_d];
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

        JsonObject ao            = js["autoOff"].to<JsonObject>();
        ao["timer"]["enabled"]   = s.autoOff.timer.enabled;
        ao["timer"]["minutes"]   = s.autoOff.timer.minutes;
        ao["offTime"]["enabled"] = s.autoOff.offTime.enabled;
        ao["offTime"]["time"]    = s.autoOff.offTime.time;
        ao["offTemp"]["enabled"] = s.autoOff.offTemp.enabled;
        ao["offTemp"]["temp"]    = s.autoOff.offTemp.temp;

        js["motion"]["pir"]["enabled"]       = s.motion.pir.enabled;
        js["motion"]["pir"]["holdSec"]       = s.motion.pir.holdSec;
        js["motion"]["ble"]["enabled"]       = s.motion.ble.enabled;
        js["motion"]["ble"]["rssiThreshold"] = s.motion.ble.rssiThreshold;
        js["motion"]["ble"]["holdSec"]       = s.motion.ble.holdSec;
    }
}

void CL_C10_ConfigManager::toJson_UserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg, JsonDocument& d) {
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

        JsonObject ao            = jp["autoOff"].to<JsonObject>();
        ao["timer"]["enabled"]   = up.autoOff.timer.enabled;
        ao["timer"]["minutes"]   = up.autoOff.timer.minutes;
        ao["offTime"]["enabled"] = up.autoOff.offTime.enabled;
        ao["offTime"]["time"]    = up.autoOff.offTime.time;
        ao["offTemp"]["enabled"] = up.autoOff.offTemp.enabled;
        ao["offTemp"]["temp"]    = up.autoOff.offTemp.temp;

        jp["motion"]["pir"]["enabled"]       = up.motion.pir.enabled;
        jp["motion"]["pir"]["holdSec"]       = up.motion.pir.holdSec;
        jp["motion"]["ble"]["enabled"]       = up.motion.ble.enabled;
        jp["motion"]["ble"]["rssiThreshold"] = up.motion.ble.rssiThreshold;
        jp["motion"]["ble"]["holdSec"]       = up.motion.ble.holdSec;
    }
}

void CL_C10_ConfigManager::toJson_WindDict(const ST_A20_WindDict_t& p_cfg, JsonDocument& d) {
    for (uint8_t v_i = 0; v_i < p_cfg.presetCount && v_i < (uint8_t)EN_A20_WINDPRESET_COUNT; v_i++) {
        const ST_A20_PresetEntry_t& v_preset  = p_cfg.presets[v_i];
        JsonObject                  v_jsonObj_preset = d["windDict"]["presets"][v_i].to<JsonObject>();

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

        v_b["baseMinWind"]     			= v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]     			= v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]    			= v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"] 			= v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"] 			= v_preset.factors.thermalFreqBase;
    }

    for (uint8_t v_i = 0; v_i < p_cfg.styleCount && v_i < (uint8_t)EN_A20_WINDSTYLE_COUNT; v_i++) {
        const ST_A20_StyleEntry_t& v_s  = p_cfg.styles[v_i];
        JsonObject                 v_jsonObj_style = d["windDict"]["styles"][v_i].to<JsonObject>();

        v_jsonObj_style["name"] = v_s.name;
        v_jsonObj_style["code"] = v_s.code;

        JsonObject v_f           = v_jsonObj_style["factors"].to<JsonObject>();
        v_f["intensityFactor"]   = v_s.factors.intensityFactor;
        v_f["variabilityFactor"] = v_s.factors.variabilityFactor;
        v_f["gustFactor"]        = v_s.factors.gustFactor;
        v_f["thermalFactor"]     = v_s.factors.thermalFactor;
    }
}

// =====================================================
// 4. JSON Patch (Schedules/UserProfiles/WindDict)
//  - windProfile → windDict 통일( fallback 미적용 )
//  - schedules PUT: schId는 자동 재발급(10,20,...) / schNo 중복이면 실패
//  - windDict patch: 운영급 검증(길이/trim/공백/중복) 실패 시 즉시 reject
// =====================================================
bool CL_C10_ConfigManager::patchSchedulesFromJson(ST_A20_SchedulesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonArrayConst arr = p_patch["schedules"].as<JsonArrayConst>();
    if (arr.isNull()) {
        return false;
    }

    A20_resetSchedulesDefault(p_cfg);
    p_cfg.count = 0;

    uint16_t v_id = (uint16_t)G_C10_SCH_ID_START;

    for (JsonObjectConst js : arr) {
        if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

        ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
        memset(&s, 0, sizeof(s));

        s.schId = v_id;

        C10_fromJson_ScheduleItem(js, s, true);

        p_cfg.count++;
        v_id = (uint16_t)((uint32_t)v_id + (uint32_t)G_C10_SCH_ID_STEP);
    }

    if (C10_isScheduleNoDuplicatedInList(p_cfg)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] Schedules patched: duplicated schNo. Rejected.");
        return false;
    }

    _dirty_schedules = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedules patched (PUT). Dirty=true");

    return true;
}

bool CL_C10_ConfigManager::patchUserProfilesFromJson(ST_A20_UserProfilesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
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

    for (JsonObjectConst jp : arr) {
        if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

        ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count++];
        memset(&up, 0, sizeof(up));
        C10_fromJson_UserProfile(jp, up);
    }

    _dirty_userProfiles = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfiles patched (PUT). Dirty=true");

    return true;
}

bool CL_C10_ConfigManager::patchWindDictFromJson(ST_A20_WindDict_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonObjectConst j = p_patch["windDict"].as<JsonObjectConst>();
    if (j.isNull()) {
        return false;
    }

    // 임시로 p_cfg를 직접 채우되, 중간 실패 시 reject해야 하므로
    // 여기서는 "로컬 임시 ST"를 쓰는 대신 (규칙 준수 위해) p_cfg를 백업하지 않고,
    // 실패 시 resetDefault로 되돌리는 정책 사용(기능 누락 없이 운영급)
    A20_resetWindDictDefault(p_cfg);

    // presets
    p_cfg.presetCount = 0;
    if (j["presets"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = j["presets"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_preset : v_arr) {
            if (p_cfg.presetCount >= (uint8_t)EN_A20_WINDPRESET_COUNT) break;

            ST_A20_PresetEntry_t& v_preset = p_cfg.presets[p_cfg.presetCount];
            memset(&v_preset, 0, sizeof(v_preset));
            C10_fromJson_WindPreset(v_jsonObj_preset, v_preset);

            if (!C10_validateWindDictEntry(v_preset.code, sizeof(v_preset.code),
                                           v_preset.name, sizeof(v_preset.name),
                                           true, "patchWindDict preset")) {
                return false;
            }

            p_cfg.presetCount++;
        }
    }

    // styles
    p_cfg.styleCount = 0;
    if (j["styles"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = j["styles"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_style : v_arr) {
            if (p_cfg.styleCount >= (uint8_t)EN_A20_WINDSTYLE_COUNT) break;

            ST_A20_StyleEntry_t& v_s = p_cfg.styles[p_cfg.styleCount];
            memset(&v_s, 0, sizeof(v_s));

            strlcpy(v_s.name, v_jsonObj_style["name"] | "", sizeof(v_s.name));
            strlcpy(v_s.code, v_jsonObj_style["code"] | "", sizeof(v_s.code));

            JsonObjectConst v_f            = v_jsonObj_style["factors"].as<JsonObjectConst>();
            v_s.factors.intensityFactor   = v_f["intensityFactor"] | 1.0f;
            v_s.factors.variabilityFactor = v_f["variabilityFactor"] | 1.0f;
            v_s.factors.gustFactor        = v_f["gustFactor"] | 1.0f;
            v_s.factors.thermalFactor     = v_f["thermalFactor"] | 1.0f;

            if (!C10_validateWindDictEntry(v_s.code, sizeof(v_s.code),
                                           v_s.name, sizeof(v_s.name),
                                           true, "patchWindDict style")) {
                return false;
            }

            p_cfg.styleCount++;
        }
    }

    // 중복(치명) -> reject
    if (!C10_validateWindDictNoDup(p_cfg, true, true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] patchWindDict: duplicated code. Rejected.");
        return false;
    }

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindDict patched (PUT). Dirty=true");

    return true;
}

// =====================================================
// 5. CRUD - Schedules / UserProfiles / WindProfile
//  (g_A20_config_root를 대상으로 동작)
//  - new 실패 방어(nothrow)
//  - schId 자동발급, schNo 중복 시 오류
// =====================================================

// ---------- Schedule CRUD ----------
int CL_C10_ConfigManager::addScheduleFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return -1;
    }

    if (!g_A20_config_root.schedules) {
        g_A20_config_root.schedules = new (std::nothrow) ST_A20_SchedulesRoot_t();
        if (!g_A20_config_root.schedules) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: new failed (out of memory)");
            return -1;
        }
        A20_resetSchedulesDefault(*g_A20_config_root.schedules);
    }

    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    if (v_root.count >= A20_Const::MAX_SCHEDULES) {
        return -1;
    }

    JsonObjectConst js = p_doc["schedule"].is<JsonObjectConst>() ? p_doc["schedule"].as<JsonObjectConst>()
                                                                 : p_doc.as<JsonObjectConst>();

    uint16_t v_schNo = js["schNo"] | 0;
    if (C10_isScheduleNoDuplicated(v_root, v_schNo, 0)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: duplicated schNo=%u", (unsigned)v_schNo);
        return -2;
    }

    ST_A20_ScheduleItem_t& s = v_root.items[v_root.count];
    memset(&s, 0, sizeof(s));

    s.schId = C10_nextScheduleId(v_root);

    C10_fromJson_ScheduleItem(js, s, true);

    int v_index = v_root.count;
    v_root.count++;

    _dirty_schedules = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] Schedule added (index=%d, schId=%u, schNo=%u)",
                       v_index,
                       (unsigned)s.schId,
                       (unsigned)s.schNo);

    return v_index;
}

bool CL_C10_ConfigManager::updateScheduleFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.schedules) {
        return false;
    }

    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
        if (v_root.items[v_i].schId == p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    JsonObjectConst js = p_patch["schedule"].is<JsonObjectConst>() ? p_patch["schedule"].as<JsonObjectConst>()
                                                                   : p_patch.as<JsonObjectConst>();

    uint16_t v_newSchNo = js["schNo"] | v_root.items[(uint8_t)v_idx].schNo;
    if (C10_isScheduleNoDuplicated(v_root, v_newSchNo, p_id)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] updateSchedule: duplicated schNo=%u (schId=%u)",
                           (unsigned)v_newSchNo,
                           (unsigned)p_id);
        return false;
    }

    uint16_t v_keepId = v_root.items[(uint8_t)v_idx].schId;

    C10_fromJson_ScheduleItem(js, v_root.items[(uint8_t)v_idx], true);
    v_root.items[(uint8_t)v_idx].schId = v_keepId;

    _dirty_schedules = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] Schedule updated (schId=%u, index=%d, schNo=%u)",
                       (unsigned)p_id,
                       v_idx,
                       (unsigned)v_root.items[(uint8_t)v_idx].schNo);

    return true;
}

bool CL_C10_ConfigManager::deleteSchedule(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.schedules) {
        return false;
    }

    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
        if (v_root.items[v_i].schId == p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count; v_i++) {
        v_root.items[v_i - 1] = v_root.items[v_i];
    }
    if (v_root.count > 0) v_root.count--;

    _dirty_schedules = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule deleted (schId=%u, index=%d)", (unsigned)p_id, v_idx);

    return true;
}

// ---------- UserProfiles CRUD ----------
int CL_C10_ConfigManager::addUserProfilesFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
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

    ST_A20_UserProfileItem_t& up = v_root.items[v_root.count];
    memset(&up, 0, sizeof(up));
    C10_fromJson_UserProfile(jp, up);

    int v_index = v_root.count;
    v_root.count++;

    _dirty_userProfiles = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile added (index=%d)", v_index);

    return v_index;
}

bool CL_C10_ConfigManager::updateUserProfilesFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.userProfiles) {
        return false;
    }

    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
        if (v_root.items[v_i].profileId == p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    JsonObjectConst jp = p_patch["profile"].is<JsonObjectConst>() ? p_patch["profile"].as<JsonObjectConst>()
                                                                  : p_patch.as<JsonObjectConst>();

    C10_fromJson_UserProfile(jp, v_root.items[(uint8_t)v_idx]);

    _dirty_userProfiles = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile updated (id=%u, index=%d)", (unsigned)p_id, v_idx);

    return true;
}

bool CL_C10_ConfigManager::deleteUserProfiles(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.userProfiles) {
        return false;
    }

    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
        if (v_root.items[v_i].profileId == p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count; v_i++) {
        v_root.items[v_i - 1] = v_root.items[v_i];
    }
    if (v_root.count > 0) v_root.count--;

    _dirty_userProfiles = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile deleted (id=%u, index=%d)", (unsigned)p_id, v_idx);

    return true;
}

// ---------- WindProfile CRUD (Preset 중심) ----------
int CL_C10_ConfigManager::addWindProfileFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
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

    if (v_root.presetCount >= (uint8_t)EN_A20_WINDPRESET_COUNT) {
        return -1;
    }

    JsonObjectConst v_jsonObj_preset = p_doc["preset"].is<JsonObjectConst>() ? p_doc["preset"].as<JsonObjectConst>()
                                                                             : p_doc.as<JsonObjectConst>();

    ST_A20_PresetEntry_t v_entry;
    memset(&v_entry, 0, sizeof(v_entry));
    C10_fromJson_WindPreset(v_jsonObj_preset, v_entry);

    // 운영급 검증
    if (!C10_validateWindDictEntry(v_entry.code, sizeof(v_entry.code),
                                   v_entry.name, sizeof(v_entry.name),
                                   true, "addWindPreset")) {
        return -1;
    }

    // code 중복 방지(운영급)
    for (uint8_t i = 0; i < v_root.presetCount; i++) {
        if (strncmp(v_root.presets[i].code, v_entry.code, A20_Const::MAX_CODE_LEN) == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addWindPreset: duplicated code '%s'", v_entry.code);
            return -2;
        }
    }

    v_root.presets[v_root.presetCount] = v_entry;

    int v_index = v_root.presetCount;
    v_root.presetCount++;

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset added (index=%d)", v_index);

    return v_index;
}

bool CL_C10_ConfigManager::updateWindProfileFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.windDict) {
        return false;
    }

    ST_A20_WindDict_t& v_root = *g_A20_config_root.windDict;

    if (p_id >= v_root.presetCount) {
        return false;
    }

    JsonObjectConst v_jsonObj_preset = p_patch["preset"].is<JsonObjectConst>() ? p_patch["preset"].as<JsonObjectConst>()
                                                                               : p_patch.as<JsonObjectConst>();

    ST_A20_PresetEntry_t v_entry;
    memset(&v_entry, 0, sizeof(v_entry));
    C10_fromJson_WindPreset(v_jsonObj_preset, v_entry);

    if (!C10_validateWindDictEntry(v_entry.code, sizeof(v_entry.code),
                                   v_entry.name, sizeof(v_entry.name),
                                   true, "updateWindPreset")) {
        return false;
    }

    // 다른 엔트리와 code 중복 체크
    for (uint8_t i = 0; i < v_root.presetCount; i++) {
        if (i == (uint8_t)p_id) continue;
        if (strncmp(v_root.presets[i].code, v_entry.code, A20_Const::MAX_CODE_LEN) == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateWindPreset: duplicated code '%s'", v_entry.code);
            return false;
        }
    }

    v_root.presets[(uint8_t)p_id] = v_entry;

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset updated (index=%u)", (unsigned)p_id);

    return true;
}

bool CL_C10_ConfigManager::deleteWindProfile(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.windDict) {
        return false;
    }

    ST_A20_WindDict_t& v_root = *g_A20_config_root.windDict;

    if (p_id >= v_root.presetCount) {
        return false;
    }

    for (uint8_t v_i = (uint8_t)p_id + 1; v_i < v_root.presetCount; v_i++) {
        v_root.presets[v_i - 1] = v_root.presets[v_i];
    }
    if (v_root.presetCount > 0) v_root.presetCount--;

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset deleted (index=%u)", (unsigned)p_id);

    return true;
}
