/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Schedule_046.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - Schedule/UserProfiles/WindDict
 * ------------------------------------------------------
 * 기능 요약:
 *  - Schedules / UserProfiles / WindDict Load/Save
 *  - 위 섹션들의 JSON Export / Patch
 *  - Schedule / UserProfiles / WindDict CRUD
 *  - windDict 운영급 검증(코드/이름 trim, 길이/공백/문자, code 중복)
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
// 내부 Helper (통폐합 최소화)
// =====================================================

// 1) schId 생성
static uint16_t C10_nextScheduleId(const ST_A20_SchedulesRoot_t& p_root) {
    uint16_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (p_root.items[v_i].schId > v_max) v_max = p_root.items[v_i].schId;
    }
    if (v_max < (uint16_t)G_C10_SCH_ID_START) return (uint16_t)G_C10_SCH_ID_START;
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

// 2) 문자열 운영급 검증 + trim 복사 (code/name 공통)
//  - trim(leading/trailing space/tab)
//  - 내부 공백은 허용(단, code는 정책상 내부공백 불허 가능)
//  - 비가시/제어문자/한글 등(32~126 범위 밖)은 reject(운영 정책)
//  - 빈 문자열 reject(필수)
static bool C10_sanitizeAndValidateText(
    const char* p_src,
    char* p_dst,
    size_t p_dstSize,
    bool p_disallowInnerSpace,
    const char* p_tagForLog,
    bool p_required
) {
    if (!p_dst || p_dstSize == 0) return false;
    memset(p_dst, 0, p_dstSize);

    if (!p_src) {
        if (p_required) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s missing(null)", (p_tagForLog ? p_tagForLog : "text"));
            return false;
        }
        return true;
    }

    // skip leading space/tab
    const char* v_p = p_src;
    while (*v_p == ' ' || *v_p == '\t' || *v_p == '\r' || *v_p == '\n') v_p++;

    // copy while tracking last non-space
    size_t v_w = 0;
    int32_t v_lastNonSpace = -1;

    while (*v_p && v_w + 1 < p_dstSize) {
        unsigned char c = (unsigned char)(*v_p);

        // 허용 문자 정책: ASCII printable (32~126), 단 \t/\r/\n은 불허
        if (c < 32 || c > 126) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s invalid char(0x%02X)", (p_tagForLog ? p_tagForLog : "text"), (unsigned)c);
            return false;
        }
        if (c == '\t' || c == '\r' || c == '\n') {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s invalid whitespace(0x%02X)", (p_tagForLog ? p_tagForLog : "text"), (unsigned)c);
            return false;
        }
        if (p_disallowInnerSpace && c == ' ') {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s space not allowed", (p_tagForLog ? p_tagForLog : "text"));
            return false;
        }

        p_dst[v_w++] = (char)c;
        if (c != ' ') v_lastNonSpace = (int32_t)(v_w - 1);
        v_p++;
    }
    p_dst[v_w] = '\0';

    // trim trailing spaces
    if (v_lastNonSpace >= 0 && (size_t)(v_lastNonSpace + 1) < p_dstSize) {
        p_dst[(size_t)(v_lastNonSpace + 1)] = '\0';
    } else if (v_lastNonSpace < 0) {
        // all spaces or empty
        p_dst[0] = '\0';
    }

    if (p_required && p_dst[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s empty after trim", (p_tagForLog ? p_tagForLog : "text"));
        return false;
    }

    // length guard(overflow는 위에서 막힘) - 여기서는 1 이상이면 OK
    return true;
}

// 3) code 중복 체크(간단 버전: 이전까지 수집된 배열과 비교)
template <size_t N, size_t L>
static bool C10_hasDupCode(const char* p_code, char (&p_seen)[N][L], uint8_t p_countSoFar) {
    if (!p_code || !p_code[0]) return true; // code는 필수
    for (uint8_t v_i = 0; v_i < p_countSoFar && v_i < (uint8_t)N; v_i++) {
        if (p_seen[v_i][0] == '\0') continue;
        if (strncmp(p_seen[v_i], p_code, L) == 0) return true;
    }
    return false;
}

// =====================================================
// 내부 Helper: Schedule / UserProfile / WindPreset 디코더
//  - JSON 키는 camelCase 기준
//  - schId는 사용자 입력 불가: fromJson에서는 읽지 않음(호출자가 강제 설정)
// =====================================================
static void C10_fromJson_ScheduleItem(const JsonObjectConst& p_js, ST_A20_ScheduleItem_t& p_s, bool p_keepExistingId = true) {
    if (!p_keepExistingId) {
        p_s.schId = 0;
    }

    p_s.schNo = p_js["schNo"] | 0;

    strlcpy(p_s.name, p_js["name"] | "", sizeof(p_s.name));
    p_s.enabled = p_js["enabled"] | true;

    p_s.repeatSegments = p_js["repeatSegments"] | true;
    p_s.repeatCount    = p_js["repeatCount"] | 0;

    for (uint8_t v_d = 0; v_d < 7; v_d++) {
        p_s.period.days[v_d] = p_js["period"]["days"][v_d] | 1;
    }
    strlcpy(p_s.period.startTime, p_js["period"]["startTime"] | "00:00", sizeof(p_s.period.startTime));
    strlcpy(p_s.period.endTime,   p_js["period"]["endTime"]   | "23:59", sizeof(p_s.period.endTime));

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
            strlcpy(sg.styleCode,  jseg["styleCode"]  | "", sizeof(sg.styleCode));

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
            strlcpy(sg.styleCode,  jseg["styleCode"]  | "", sizeof(sg.styleCode));

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

// 4) windDict JSON -> struct + 운영급 검증(통합)
static bool C10_loadWindDictFromJsonChecked(const JsonObjectConst& p_windDictObj, ST_A20_WindDict_t& p_out) {
    // 기본값을 이미 reset한 상태를 전제. 여기서는 카운트/엔트리만 채움.
    p_out.presetCount = 0;
    p_out.styleCount  = 0;

    char v_seenPresetCodes[EN_A20_WINDPRESET_COUNT][A20_Const::MAX_CODE_LEN];
    char v_seenStyleCodes[EN_A20_WINDSTYLE_COUNT][A20_Const::MAX_CODE_LEN];
    memset(v_seenPresetCodes, 0, sizeof(v_seenPresetCodes));
    memset(v_seenStyleCodes, 0, sizeof(v_seenStyleCodes));

    // presets
    if (p_windDictObj["presets"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = p_windDictObj["presets"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_preset : v_arr) {
            if (p_out.presetCount >= (uint8_t)EN_A20_WINDPRESET_COUNT) break;

            ST_A20_PresetEntry_t& v_preset = p_out.presets[p_out.presetCount];
            memset(&v_preset, 0, sizeof(v_preset));
            C10_fromJson_WindPreset(v_jsonObj_preset, v_preset);

            // 운영급 검증: code/name trim+길이+문자+공백/중복
            char v_code[A20_Const::MAX_CODE_LEN];
            char v_name[A20_Const::MAX_NAME_LEN];

            if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true, "windDict.presets.code", true)) return false;
            if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", true)) return false;

            if (C10_hasDupCode(v_code, v_seenPresetCodes, p_out.presetCount)) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] windDict preset code duplicated: %s", v_code);
                return false;
            }

            // 정규화된 값으로 저장(운영 일관성)
            strlcpy(v_preset.code, v_code, sizeof(v_preset.code));
            strlcpy(v_preset.name, v_name, sizeof(v_preset.name));
            strlcpy(v_seenPresetCodes[p_out.presetCount], v_code, sizeof(v_seenPresetCodes[p_out.presetCount]));

            p_out.presetCount++;
        }
    }

    // styles
    if (p_windDictObj["styles"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = p_windDictObj["styles"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_style : v_arr) {
            if (p_out.styleCount >= (uint8_t)EN_A20_WINDSTYLE_COUNT) break;

            ST_A20_StyleEntry_t& v_s = p_out.styles[p_out.styleCount];
            memset(&v_s, 0, sizeof(v_s));

            strlcpy(v_s.name, v_jsonObj_style["name"] | "", sizeof(v_s.name));
            strlcpy(v_s.code, v_jsonObj_style["code"] | "", sizeof(v_s.code));

            JsonObjectConst v_f           = v_jsonObj_style["factors"].as<JsonObjectConst>();
            v_s.factors.intensityFactor   = v_f["intensityFactor"] | 1.0f;
            v_s.factors.variabilityFactor = v_f["variabilityFactor"] | 1.0f;
            v_s.factors.gustFactor        = v_f["gustFactor"] | 1.0f;
            v_s.factors.thermalFactor     = v_f["thermalFactor"] | 1.0f;

            // 운영급 검증
            char v_code[A20_Const::MAX_CODE_LEN];
            char v_name[A20_Const::MAX_NAME_LEN];

            if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true, "windDict.styles.code", true)) return false;
            if (!C10_sanitizeAndValidateText(v_s.name, v_name, sizeof(v_name), false, "windDict.styles.name", true)) return false;

            if (C10_hasDupCode(v_code, v_seenStyleCodes, p_out.styleCount)) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] windDict style code duplicated: %s", v_code);
                return false;
            }

            strlcpy(v_s.code, v_code, sizeof(v_s.code));
            strlcpy(v_s.name, v_name, sizeof(v_s.name));
            strlcpy(v_seenStyleCodes[p_out.styleCount], v_code, sizeof(v_seenStyleCodes[p_out.styleCount]));

            p_out.styleCount++;
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

    A20_resetSchedulesDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    JsonArrayConst arr = d["schedules"].as<JsonArrayConst>();
    p_cfg.count        = 0;

    if (arr.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadSchedules: missing 'schedules' array (empty)");
        return true;
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

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
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

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
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

    // 운영급 검증 + 로드
    if (!C10_loadWindDictFromJsonChecked(j, p_dict)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWindDict: validation failed. Load rejected.");
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

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.schedules, d, true, __func__);
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

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.userProfiles, d, true, __func__);
}

bool CL_C10_ConfigManager::saveWindDict(const ST_A20_WindDict_t& p_cfg) {
    JsonDocument d;

    uint8_t v_presetCount = p_cfg.presetCount;
    uint8_t v_styleCount  = p_cfg.styleCount;

    if (v_presetCount > (uint8_t)EN_A20_WINDPRESET_COUNT) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveWindDict: presetCount overflow(%u > %u)",
                           (unsigned)v_presetCount, (unsigned)EN_A20_WINDPRESET_COUNT);
        return false;
    }
    if (v_styleCount > (uint8_t)EN_A20_WINDSTYLE_COUNT) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveWindDict: styleCount overflow(%u > %u)",
                           (unsigned)v_styleCount, (unsigned)EN_A20_WINDSTYLE_COUNT);
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

        if (!C10_sanitizeAndValidateText(v_p.code, v_code, sizeof(v_code), true,  "windDict.presets.code", true)) return false;
        if (!C10_sanitizeAndValidateText(v_p.name, v_name, sizeof(v_name), false, "windDict.presets.name", true)) return false;

        if (C10_hasDupCode(v_code, v_seenPresetCodes, v_i)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveWindDict: duplicated preset.code=%s", v_code);
            return false;
        }
        strlcpy(v_seenPresetCodes[v_i], v_code, sizeof(v_seenPresetCodes[v_i]));
    }

    // styles validation
    for (uint8_t v_i = 0; v_i < v_styleCount; v_i++) {
        const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];

        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true,  "windDict.styles.code", true)) return false;
        if (!C10_sanitizeAndValidateText(v_s.name, v_name, sizeof(v_name), false, "windDict.styles.name", true)) return false;

        if (C10_hasDupCode(v_code, v_seenStyleCodes, v_i)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveWindDict: duplicated style.code=%s", v_code);
            return false;
        }
        strlcpy(v_seenStyleCodes[v_i], v_code, sizeof(v_seenStyleCodes[v_i]));
    }

    // presets write (정규화된 code/name 저장)
    for (uint8_t v_i = 0; v_i < v_presetCount && v_i < (uint8_t)EN_A20_WINDPRESET_COUNT; v_i++) {
        const ST_A20_PresetEntry_t& v_preset = p_cfg.presets[v_i];

        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];
        if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true,  "windDict.presets.code", false)) return false;
        if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", false)) return false;

        JsonObject v_jsonObj_preset = d["windDict"]["presets"][v_i].to<JsonObject>();

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

        v_b["baseMinWind"]      = v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]      = v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]     = v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"]  = v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"]  = v_preset.factors.thermalFreqBase;
    }

    // styles write
    for (uint8_t v_i = 0; v_i < v_styleCount && v_i < (uint8_t)EN_A20_WINDSTYLE_COUNT; v_i++) {
        const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];

        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];
        if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true,  "windDict.styles.code", false)) return false;
        if (!C10_sanitizeAndValidateText(v_s.name, v_name, sizeof(v_name), false, "windDict.styles.name", false)) return false;

        JsonObject v_jsonObj_style = d["windDict"]["styles"][v_i].to<JsonObject>();

        v_jsonObj_style["name"] = v_name;
        v_jsonObj_style["code"] = v_code;

        JsonObject v_f           = v_jsonObj_style["factors"].to<JsonObject>();
        v_f["intensityFactor"]   = v_s.factors.intensityFactor;
        v_f["variabilityFactor"] = v_s.factors.variabilityFactor;
        v_f["gustFactor"]        = v_s.factors.gustFactor;
        v_f["thermalFactor"]     = v_s.factors.thermalFactor;
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.windDict, d, true, __func__);
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
    uint8_t v_presetCount = p_cfg.presetCount;
    uint8_t v_styleCount  = p_cfg.styleCount;

    if (v_presetCount > (uint8_t)EN_A20_WINDPRESET_COUNT) v_presetCount = (uint8_t)EN_A20_WINDPRESET_COUNT;
    if (v_styleCount > (uint8_t)EN_A20_WINDSTYLE_COUNT)  v_styleCount  = (uint8_t)EN_A20_WINDSTYLE_COUNT;

    for (uint8_t v_i = 0; v_i < v_presetCount; v_i++) {
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

        v_b["baseMinWind"]      = v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]      = v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]     = v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"]  = v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"]  = v_preset.factors.thermalFreqBase;
    }

    for (uint8_t v_i = 0; v_i < v_styleCount; v_i++) {
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
//  - schedules PUT: schId는 자동 재발급(10,20,...) / schNo 중복이면 실패
//  - windDict는 운영급 검증(코드/이름 trim, 길이/문자/공백, code 중복)
// =====================================================
bool CL_C10_ConfigManager::patchSchedulesFromJson(ST_A20_SchedulesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonObjectConst j = p_patch["windDict"].as<JsonObjectConst>();
    if (j.isNull()) {
        return false;
    }

    A20_resetWindDictDefault(p_cfg);

    if (!C10_loadWindDictFromJsonChecked(j, p_cfg)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] WindDict patched: validation failed. Rejected.");
        A20_resetWindDictDefault(p_cfg);
        return false;
    }

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindDict patched (PUT). Dirty=true");

    return true;
}

// =====================================================
// 5. CRUD - Schedules / UserProfiles / WindDict
//  (g_A20_config_root를 대상으로 동작)
//  - new 실패 방어(nothrow)
//  - schId 자동발급, schNo 중복 시 오류
//  - windDict preset/style 상한: EN_A20_WINDPRESET_COUNT / EN_A20_WINDSTYLE_COUNT
// =====================================================

// ---------- Schedule CRUD ----------
int CL_C10_ConfigManager::addScheduleFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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

// ---------- WindDict CRUD (Preset 중심) ----------
int CL_C10_ConfigManager::addWindProfileFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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

    ST_A20_PresetEntry_t& v_preset = v_root.presets[v_root.presetCount];
    memset(&v_preset, 0, sizeof(v_preset));
    C10_fromJson_WindPreset(v_jsonObj_preset, v_preset);

    // CRUD 시점에도 최소 운영검증(중복은 저장/patch/load에서 강제하지만, 입력 품질은 여기서도 최소 보장)
    {
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];
        if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true,  "windDict.presets.code", true)) return -2;
        if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", true)) return -2;
        strlcpy(v_preset.code, v_code, sizeof(v_preset.code));
        strlcpy(v_preset.name, v_name, sizeof(v_preset.name));
    }

    int v_index = v_root.presetCount;
    v_root.presetCount++;

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset added (index=%d)", v_index);

    return v_index;
}

bool CL_C10_ConfigManager::updateWindProfileFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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

    C10_fromJson_WindPreset(v_jsonObj_preset, v_root.presets[p_id]);

    // 최소 운영검증
    {
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];
        if (!C10_sanitizeAndValidateText(v_root.presets[p_id].code, v_code, sizeof(v_code), true,  "windDict.presets.code", true)) return false;
        if (!C10_sanitizeAndValidateText(v_root.presets[p_id].name, v_name, sizeof(v_name), false, "windDict.presets.name", true)) return false;
        strlcpy(v_root.presets[p_id].code, v_code, sizeof(v_root.presets[p_id].code));
        strlcpy(v_root.presets[p_id].name, v_name, sizeof(v_root.presets[p_id].name));
    }

    _dirty_windDict = true;
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset updated (index=%u)", (unsigned)p_id);

    return true;
}

bool CL_C10_ConfigManager::deleteWindProfile(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
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

