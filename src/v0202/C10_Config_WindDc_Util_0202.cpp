/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_WindDc_Util_0202.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - WindDict (Util)
 * ------------------------------------------------------
 * [E-2.7] 원본의 helper 5종 이관
 * ------------------------------------------------------
 */

#include "C10_Config_WindDc_Internal_0202.h"

#include "A25_Com_Utils_0202.h"
#include "A22_Com_Lookup_0202.h"
#include "A23_Com_ResetCfg_0202.h"

#include <string.h>
#include <strings.h>

// =====================================================
// 문자열 검증 + trim
// =====================================================
bool C10_sanitizeAndValidateText(const char* p_src,
                                 char* p_dst,
                                 size_t p_dstSize,
                                 bool p_disallowInnerSpace,
                                 const char* p_tagForLog,
                                 bool p_required) {
    if (!p_dst || p_dstSize == 0) return false;
    memset(p_dst, 0, p_dstSize);

    if (!p_src) {
        if (p_required) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s missing(null)", (p_tagForLog ? p_tagForLog : "text"));
            return false;
        }
        return true;
    }

    const char* v_p = p_src;
    while (*v_p == ' ' || *v_p == '\t' || *v_p == '\r' || *v_p == '\n') v_p++;

    size_t  v_w            = 0;
    int32_t v_lastNonSpace = -1;

    while (*v_p && v_w + 1 < p_dstSize) {
        unsigned char c = (unsigned char)(*v_p);
        if (c < 32 || c > 126) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s invalid char(0x%02X)",
                               (p_tagForLog ? p_tagForLog : "text"), (unsigned)c);
            return false;
        }
        if (c == '\t' || c == '\r' || c == '\n') {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s invalid whitespace(0x%02X)",
                               (p_tagForLog ? p_tagForLog : "text"), (unsigned)c);
            return false;
        }
        if (p_disallowInnerSpace && c == ' ') {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s space not allowed",
                               (p_tagForLog ? p_tagForLog : "text"));
            return false;
        }
        p_dst[v_w++] = (char)c;
        if (c != ' ') v_lastNonSpace = (int32_t)(v_w - 1);
        v_p++;
    }
    p_dst[v_w] = '\0';

    if (v_lastNonSpace >= 0 && (size_t)(v_lastNonSpace + 1) < p_dstSize) {
        p_dst[(size_t)(v_lastNonSpace + 1)] = '\0';
    } else if (v_lastNonSpace < 0) {
        p_dst[0] = '\0';
    }

    if (p_required && p_dst[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s empty after trim",
                           (p_tagForLog ? p_tagForLog : "text"));
        return false;
    }
    return true;
}

// =====================================================
// Preset / Style decode
// =====================================================
void C10_fromJson_WindPreset(const JsonObjectConst& p_js, ST_A20_PresetEntry_t& p_p) {
    memset(&p_p, 0, sizeof(p_p));

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
    p_p.factors.baseMinWind              = A40_ComFunc::Json_getNum<float>(v_b, "baseMinWind", 1.8f);
    p_p.factors.baseMaxWind              = A40_ComFunc::Json_getNum<float>(v_b, "baseMaxWind", 5.5f);
    p_p.factors.gustProbBase             = A40_ComFunc::Json_getNum<float>(v_b, "gustProbBase", 0.040f);
    p_p.factors.gustStrengthMax          = A40_ComFunc::Json_getNum<float>(v_b, "gustStrengthMax", 2.10f);
    p_p.factors.thermalFreqBase          = A40_ComFunc::Json_getNum<float>(v_b, "thermalFreqBase", 0.022f);
}

void C10_fromJson_WindStyle(const JsonObjectConst& p_js, ST_A20_StyleEntry_t& p_s) {
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
// WindDict JSON → struct + 운영 검증
// =====================================================
bool C10_loadWindDictFromJsonChecked(const JsonObjectConst& p_windDictObj, ST_A20_WindDict_t& p_out) {
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

            if (!v_jsonObj_preset["idx"].isNull()) {
                uint8_t v_fileIdx = v_jsonObj_preset["idx"].as<uint8_t>();
                if (v_fileIdx != p_out.presetCount) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN,
                                       "[C10] windDict preset idx mismatch: file=%u, arrayPos=%u (code=%s)",
                                       (unsigned)v_fileIdx, (unsigned)p_out.presetCount, v_preset.code);
                }
            }

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

            A40_ComFunc::copyStr2Buffer_safe(v_preset.code, v_code, sizeof(v_preset.code), __func__);
            A40_ComFunc::copyStr2Buffer_safe(v_preset.name, v_name, sizeof(v_preset.name), __func__);
            A40_ComFunc::copyStr2Buffer_safe(v_seenPresetCodes[p_out.presetCount], v_code,
                                             sizeof(v_seenPresetCodes[p_out.presetCount]), __func__);

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

            if (!v_jsonObj_style["idx"].isNull()) {
                uint8_t v_fileIdx = v_jsonObj_style["idx"].as<uint8_t>();
                if (v_fileIdx != p_out.styleCount) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN,
                                       "[C10] windDict style idx mismatch: file=%u, arrayPos=%u (code=%s)",
                                       (unsigned)v_fileIdx, (unsigned)p_out.styleCount, v_s.code);
                }
            }

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
            A40_ComFunc::copyStr2Buffer_safe(v_seenStyleCodes[p_out.styleCount], v_code,
                                             sizeof(v_seenStyleCodes[p_out.styleCount]), __func__);

            p_out.styleCount++;
        }
    }
    return true;
}
