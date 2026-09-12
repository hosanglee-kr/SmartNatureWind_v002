/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_WindDc_050.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - WindDict
 * ------------------------------------------------------
 * 기능 요약:
 *  - WindDict Load/Save
 *  - WindDict JSON Export / Patch
 *  - WindDict CRUD (Preset 중심)
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

#include "C10_Config_050.h"
#include "A40_Com_Func_052.h"

// =====================================================
// 내부 Helper (WindDict 전용)
// =====================================================

// ------------------------------------------------------
// 문자열 운영급 검증 + trim 복사 (code/name 공통)
//  - trim(leading/trailing space/tab/CR/LF)
//  - 내부 공백 허용 여부 선택(code는 보통 불허)
//  - 비가시/제어문자/한글 등(ASCII 32~126 밖)은 reject(운영 정책)
//  - 빈 문자열 reject(필수)
// ------------------------------------------------------
static bool C10_sanitizeAndValidateText(const char* p_src,
                                       char*       p_dst,
                                       size_t      p_dstSize,
                                       bool        p_disallowInnerSpace,
                                       const char* p_tagForLog,
                                       bool        p_required) {
    if (!p_dst || p_dstSize == 0) return false;
    memset(p_dst, 0, p_dstSize);

    if (!p_src) {
        if (p_required) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s missing(null)",
                               (p_tagForLog ? p_tagForLog : "text"));
            return false;
        }
        return true;
    }

    // skip leading space/tab/cr/lf
    const char* v_p = p_src;
    while (*v_p == ' ' || *v_p == '\t' || *v_p == '\r' || *v_p == '\n') v_p++;

    // copy while tracking last non-space
    size_t  v_w            = 0;
    int32_t v_lastNonSpace = -1;

    while (*v_p && v_w + 1 < p_dstSize) {
        unsigned char c = (unsigned char)(*v_p);

        // 허용 문자 정책: ASCII printable (32~126), 단 \t/\r/\n은 불허
        if (c < 32 || c > 126) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s invalid char(0x%02X)",
                               (p_tagForLog ? p_tagForLog : "text"),
                               (unsigned)c);
            return false;
        }
        if (c == '\t' || c == '\r' || c == '\n') {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s invalid whitespace(0x%02X)",
                               (p_tagForLog ? p_tagForLog : "text"),
                               (unsigned)c);
            return false;
        }
        if (p_disallowInnerSpace && c == ' ') {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s space not allowed",
                               (p_tagForLog ? p_tagForLog : "text"));
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
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] %s empty after trim",
                           (p_tagForLog ? p_tagForLog : "text"));
        return false;
    }

    return true;
}

// ------------------------------------------------------
// code 중복 체크(간단 버전: 이전까지 수집된 배열과 비교)
// ------------------------------------------------------
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
// 내부 Helper: WindPreset / WindStyle 디코더
//  - JSON 키는 camelCase 기준
//  - 문자열은 A40 공통함수로 안전 복사
//  - 운영급 trim/문자/중복 검증은 상위 로더에서 수행
// =====================================================
static void C10_fromJson_WindPreset(const JsonObjectConst& p_js, ST_A20_PresetEntry_t& p_p) {
    memset(&p_p, 0, sizeof(p_p));

    // 문자열: A40 JSON 헬퍼 사용(키 없음/타입불일치 => default)
    A40_ComFunc::Json_copyStr(p_js, "name", p_p.name, sizeof(p_p.name), "", __func__);
    A40_ComFunc::Json_copyStr(p_js, "code", p_p.code, sizeof(p_p.code), "", __func__);

    JsonObjectConst v_b = p_js["factors"].as<JsonObjectConst>();

    p_p.factors.windIntensity            = A40_ComFunc::Json_getNum<float>(v_b, "windIntensity", 70.0f);
    p_p.factors.gustFrequency            = A40_ComFunc::Json_getNum<float>(v_b, "gustFrequency", 40.0f);
    p_p.factors.windVariability          = A40_ComFunc::Json_getNum<float>(v_b, "windVariability", 50.0f);
    p_p.factors.fanLimit                 = A40_ComFunc::Json_getNum<float>(v_b, "fanLimit", 95.0f);
    p_p.factors.minFan                   = A40_ComFunc::Json_getNum<float>(v_b, "minFan", 10.0f);
    p_p.factors.turbulenceLengthScale    = A40_ComFunc::Json_getNum<float>(v_b, "turbulenceLengthScale", 40.0f);
    p_p.factors.turbulenceIntensitySigma = A40_ComFunc::Json_getNum<float>(v_b, "turbulenceIntensitySigma", 0.5f);
    p_p.factors.thermalBubbleStrength    = A40_ComFunc::Json_getNum<float>(v_b, "thermalBubbleStrength", 2.0f);
    p_p.factors.thermalBubbleRadius      = A40_ComFunc::Json_getNum<float>(v_b, "thermalBubbleRadius", 18.0f);

    p_p.factors.baseMinWind     = A40_ComFunc::Json_getNum<float>(v_b, "baseMinWind", 1.8f);
    p_p.factors.baseMaxWind     = A40_ComFunc::Json_getNum<float>(v_b, "baseMaxWind", 5.5f);
    p_p.factors.gustProbBase    = A40_ComFunc::Json_getNum<float>(v_b, "gustProbBase", 0.040f);
    p_p.factors.gustStrengthMax = A40_ComFunc::Json_getNum<float>(v_b, "gustStrengthMax", 2.10f);
    p_p.factors.thermalFreqBase = A40_ComFunc::Json_getNum<float>(v_b, "thermalFreqBase", 0.022f);
}

static void C10_fromJson_WindStyle(const JsonObjectConst& p_js, ST_A20_StyleEntry_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));

    A40_ComFunc::Json_copyStr(p_js, "name", p_s.name, sizeof(p_s.name), "", __func__);
    A40_ComFunc::Json_copyStr(p_js, "code", p_s.code, sizeof(p_s.code), "", __func__);

    JsonObjectConst v_f           = p_js["factors"].as<JsonObjectConst>();
    p_s.factors.intensityFactor   = A40_ComFunc::Json_getNum<float>(v_f, "intensityFactor", 1.0f);
    p_s.factors.variabilityFactor = A40_ComFunc::Json_getNum<float>(v_f, "variabilityFactor", 1.0f);
    p_s.factors.gustFactor        = A40_ComFunc::Json_getNum<float>(v_f, "gustFactor", 1.0f);
    p_s.factors.thermalFactor     = A40_ComFunc::Json_getNum<float>(v_f, "thermalFactor", 1.0f);
}

// =====================================================
// windDict JSON -> struct + 운영급 검증(통합)
// =====================================================
static bool C10_loadWindDictFromJsonChecked(const JsonObjectConst& p_windDictObj, ST_A20_WindDict_t& p_out) {
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
            C10_fromJson_WindPreset(v_jsonObj_preset, v_preset);

            // 운영급 검증: code/name trim+길이+문자+공백/중복
            char v_code[A20_Const::MAX_CODE_LEN];
            char v_name[A20_Const::MAX_NAME_LEN];

            if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true, "windDict.presets.code", true))
                return false;
            if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", true))
                return false;

            if (C10_hasDupCode(v_code, v_seenPresetCodes, p_out.presetCount)) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] windDict preset code duplicated: %s", v_code);
                return false;
            }

            // 정규화된 값으로 저장(운영 일관성) - A40 공통 함수로 복사
            A40_ComFunc::copyStr2Buffer_safe(v_preset.code, v_code, sizeof(v_preset.code), __func__);
            A40_ComFunc::copyStr2Buffer_safe(v_preset.name, v_name, sizeof(v_preset.name), __func__);
            A40_ComFunc::copyStr2Buffer_safe(v_seenPresetCodes[p_out.presetCount],
                                             v_code,
                                             sizeof(v_seenPresetCodes[p_out.presetCount]),
                                             __func__);

            p_out.presetCount++;
        }
    }

    // styles
    if (p_windDictObj["styles"].is<JsonArrayConst>()) {
        JsonArrayConst v_arr = p_windDictObj["styles"].as<JsonArrayConst>();
        for (JsonObjectConst v_jsonObj_style : v_arr) {
            if (p_out.styleCount >= (uint8_t)EN_A20_WINDSTYLE_COUNT) break;

            ST_A20_StyleEntry_t& v_s = p_out.styles[p_out.styleCount];
            C10_fromJson_WindStyle(v_jsonObj_style, v_s);

            // 운영급 검증
            char v_code[A20_Const::MAX_CODE_LEN];
            char v_name[A20_Const::MAX_NAME_LEN];

            if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true, "windDict.styles.code", true))
                return false;
            if (!C10_sanitizeAndValidateText(v_s.name, v_name, sizeof(v_name), false, "windDict.styles.name", true))
                return false;

            if (C10_hasDupCode(v_code, v_seenStyleCodes, p_out.styleCount)) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] windDict style code duplicated: %s", v_code);
                return false;
            }

            A40_ComFunc::copyStr2Buffer_safe(v_s.code, v_code, sizeof(v_s.code), __func__);
            A40_ComFunc::copyStr2Buffer_safe(v_s.name, v_name, sizeof(v_s.name), __func__);
            A40_ComFunc::copyStr2Buffer_safe(v_seenStyleCodes[p_out.styleCount],
                                             v_code,
                                             sizeof(v_seenStyleCodes[p_out.styleCount]),
                                             __func__);

            p_out.styleCount++;
        }
    }

    return true;
}

// =====================================================
// 1) Load WindDict
//  - mutex 보호 / path empty 방어 / 실패 시 default 복구
// =====================================================
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

    // default 먼저 적용
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

    // 운영급 검증 + 로드
    if (!C10_loadWindDictFromJsonChecked(j, p_dict)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Load rejected.", __func__);
        A20_resetWindDictDefault(p_dict);
        return false;
    }

    return true;
}

// =====================================================
// 2) Save WindDict
//  - save 직전 마지막 방어선: code/name 필수/trim/문자/중복 검증
//  - mutex 보호 / path empty 방어
// =====================================================
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
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] %s: presetCount overflow(%u > %u)",
                           __func__,
                           (unsigned)v_presetCount,
                           (unsigned)EN_A20_WINDPRESET_COUNT);
        return false;
    }
    if (v_styleCount > (uint8_t)EN_A20_WINDSTYLE_COUNT) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] %s: styleCount overflow(%u > %u)",
                           __func__,
                           (unsigned)v_styleCount,
                           (unsigned)EN_A20_WINDSTYLE_COUNT);
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

        // seen 저장도 A40로
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

    // presets write (정규화된 code/name 저장)
    for (uint8_t v_i = 0; v_i < v_presetCount && v_i < (uint8_t)EN_A20_WINDPRESET_COUNT; v_i++) {
        const ST_A20_PresetEntry_t& v_preset = p_cfg.presets[v_i];

        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        // 저장 직전도 정규화(필수 아님으로 호출하지만, 위에서 이미 필수검증은 통과한 상태)
        if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true, "windDict.presets.code", false))
            return false;
        if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", false))
            return false;

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

        v_b["baseMinWind"]     = v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]     = v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]    = v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"] = v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"] = v_preset.factors.thermalFreqBase;
    }

    // styles write (정규화된 code/name 저장)
    for (uint8_t v_i = 0; v_i < v_styleCount && v_i < (uint8_t)EN_A20_WINDSTYLE_COUNT; v_i++) {
        const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];

        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_s.code, v_code, sizeof(v_code), true, "windDict.styles.code", false)) return false;
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

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.windDict, d, true, true, __func__);
}

// =====================================================
// 3) JSON Export - WindDict
//  - mutex 보호 / doc 잔재 방지(remove)
// =====================================================
void CL_C10_ConfigManager::toJson_WindDict(const ST_A20_WindDict_t& p_cfg, JsonDocument& d) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    // 잔재 제거(공통헬퍼)
    A40_ComFunc::Json_removeKey(d, "windDict");

    uint8_t v_presetCount = p_cfg.presetCount;
    uint8_t v_styleCount  = p_cfg.styleCount;

    if (v_presetCount > (uint8_t)EN_A20_WINDPRESET_COUNT) v_presetCount = (uint8_t)EN_A20_WINDPRESET_COUNT;
    if (v_styleCount > (uint8_t)EN_A20_WINDSTYLE_COUNT) v_styleCount = (uint8_t)EN_A20_WINDSTYLE_COUNT;

    for (uint8_t v_i = 0; v_i < v_presetCount; v_i++) {
        const ST_A20_PresetEntry_t& v_preset         = p_cfg.presets[v_i];
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

        v_b["baseMinWind"]     = v_preset.factors.baseMinWind;
        v_b["baseMaxWind"]     = v_preset.factors.baseMaxWind;
        v_b["gustProbBase"]    = v_preset.factors.gustProbBase;
        v_b["gustStrengthMax"] = v_preset.factors.gustStrengthMax;
        v_b["thermalFreqBase"] = v_preset.factors.thermalFreqBase;
    }

    for (uint8_t v_i = 0; v_i < v_styleCount; v_i++) {
        const ST_A20_StyleEntry_t& v_s             = p_cfg.styles[v_i];
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
// 4) JSON Patch - WindDict (PUT 성격: 전체 replace + 운영급 검증)
//  - mutex 보호 / dirty flag 원자성(setAtomic)
// =====================================================
bool CL_C10_ConfigManager::patchWindDictFromJson(ST_A20_WindDict_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
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

    A40_ComFunc::Dirty_setAtomic(_dirty_windDict, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindDict patched (PUT). Dirty=true");

    return true;
}

// =====================================================
// 5) CRUD - WindDict (Preset 중심)
//  (g_A20_config_root를 대상으로 동작)
//  - new 실패 방어(nothrow)
//  - preset/style 상한: EN_A20_WINDPRESET_COUNT / EN_A20_WINDSTYLE_COUNT
//  - CRUD에서도 최소 운영 검증(코드/이름 trim/문자/공백 정책)
// =====================================================

// ---------- Preset CRUD ----------
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

    if (v_root.presetCount >= (uint8_t)EN_A20_WINDPRESET_COUNT) {
        return -1;
    }

    JsonObjectConst v_jsonObj_preset =
        p_doc["preset"].is<JsonObjectConst>() ? p_doc["preset"].as<JsonObjectConst>() : p_doc.as<JsonObjectConst>();

    ST_A20_PresetEntry_t& v_preset = v_root.presets[v_root.presetCount];
    C10_fromJson_WindPreset(v_jsonObj_preset, v_preset);

    // CRUD 시점 최소 운영검증 + 정규화 저장
    {
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_preset.code, v_code, sizeof(v_code), true, "windDict.presets.code", true))
            return -2;
        if (!C10_sanitizeAndValidateText(v_preset.name, v_name, sizeof(v_name), false, "windDict.presets.name", true))
            return -2;

        // 중복 체크(현재 root 기준)
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

    if (!g_A20_config_root.windDict) {
        return false;
    }

    ST_A20_WindDict_t& v_root = *g_A20_config_root.windDict;

    if (p_id >= v_root.presetCount) {
        return false;
    }

    JsonObjectConst v_jsonObj_preset =
        p_patch["preset"].is<JsonObjectConst>() ? p_patch["preset"].as<JsonObjectConst>() : p_patch.as<JsonObjectConst>();

    // 업데이트(전체 replace 성격) - JSON -> struct
    C10_fromJson_WindPreset(v_jsonObj_preset, v_root.presets[p_id]);

    // 최소 운영검증 + 정규화 + 중복 방지(자기 자신 제외)
    {
        char v_code[A20_Const::MAX_CODE_LEN];
        char v_name[A20_Const::MAX_NAME_LEN];

        if (!C10_sanitizeAndValidateText(v_root.presets[p_id].code,
                                         v_code,
                                         sizeof(v_code),
                                         true,
                                         "windDict.presets.code",
                                         true))
            return false;
        if (!C10_sanitizeAndValidateText(v_root.presets[p_id].name,
                                         v_name,
                                         sizeof(v_name),
                                         false,
                                         "windDict.presets.name",
                                         true))
            return false;

        // 중복 체크 (p_id 제외)
        for (uint8_t v_i = 0; v_i < v_root.presetCount; v_i++) {
            if (v_i == (uint8_t)p_id) continue;
            if (v_root.presets[v_i].code[0] == '\0') continue;
            if (strncmp(v_root.presets[v_i].code, v_code, sizeof(v_root.presets[v_i].code)) == 0) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] updateWindPreset: duplicated code=%s (idx=%u)",
                                   v_code,
                                   (unsigned)v_i);
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

    A40_ComFunc::Dirty_setAtomic(_dirty_windDict, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset deleted (index=%u)", (unsigned)p_id);

    return true;
}
