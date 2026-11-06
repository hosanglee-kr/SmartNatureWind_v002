#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_WindDc_Internal_0202.h
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - WindDict (Internal)
 * ------------------------------------------------------
 * [E-2.7] C10_Config_WindDc_0202.cpp → 4파일 분할 internal helper
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>

#include "C10_Config_0202.h"
#include "A20_Const_0202.h"

// ------------------------------------------------------
// Helper declarations (C10_Config_WindDc_Util_0202.cpp 정의)
// ------------------------------------------------------

// 문자열 검증 + trim
bool C10_sanitizeAndValidateText(const char* p_src,
                                 char* p_dst,
                                 size_t p_dstSize,
                                 bool p_disallowInnerSpace,
                                 const char* p_tagForLog,
                                 bool p_required);

// code 중복 검사 (template)
template <size_t N, size_t L>
bool C10_hasDupCode(const char* p_code, char (&p_seen)[N][L], uint8_t p_countSoFar);

// Preset / Style decode
void C10_fromJson_WindPreset(const JsonObjectConst& p_js, ST_A20_PresetEntry_t& p_p);
void C10_fromJson_WindStyle(const JsonObjectConst& p_js, ST_A20_StyleEntry_t& p_s);

// WindDict JSON → struct + 운영 검증
bool C10_loadWindDictFromJsonChecked(const JsonObjectConst& p_windDictObj, ST_A20_WindDict_t& p_out);

// ------------------------------------------------------
// C10_hasDupCode template 구현 (헤더에 필요)
// ------------------------------------------------------
template <size_t N, size_t L>
bool C10_hasDupCode(const char* p_code, char (&p_seen)[N][L], uint8_t p_countSoFar) {
    if (!p_code || !p_code[0]) return true;
    for (uint8_t v_i = 0; v_i < p_countSoFar && v_i < (uint8_t)N; v_i++) {
        if (p_seen[v_i][0] == '\0') continue;
        if (strncmp(p_seen[v_i], p_code, L) == 0) return true;
    }
    return false;
}
