# `A22_Com_Lookup_0203.h` 상세 Spec

```cpp
#pragma once

/*
 * ------------------------------------------------------
 * 소스 파일 역할 요약 (1~2줄)
 * 모듈약어 : A20
 * 모듈명 : Smart Nature Wind Dict 공용값 구현 전역(예: A20_Const_070.h, EN_A20_*)에 의존합니다.
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <string.h>

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_getPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;

    for (uint8_t v_i = 0; v_i < EN_A20_STEP_TYPE_COUNT; v_i++) {
        const char* v_code = G_A20_StepType_Arr[v_i].code;
        if (v_code && (strcasecmp(p_code, v_code) == 0)) return v_i;
    }
    return -1;
}

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_getStaticPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;

    for (uint8_t v_i = 0; v_i < EN_A20_WINDPRESET_COUNT; v_i++) {
        const char* v_code = G_A20_WindDict_t[v_i].code;
        if (v_code && (strcasecmp(p_code, v_code) == 0)) return v_i;
    }
    return -1;
}

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_findPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;

    for (uint8_t v_i = 0; v_i < EN_A20_WINDSTYLE_COUNT; v_i++) {
        const char* v_code = G_A20_WindStyle_Arr[v_i].code;
        if (v_code && (strcasecmp(p_code, v_code) == 0)) return v_i;
    }
    return -1;
}

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_findPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;

    for (uint8_t v_i = 0; v_i < EN_A20_WINDPRESET_COUNT; v_i++) {
        const char* v_code = G_A20_WindStyle_Arr[v_i].code;
        if (v_code && (strcasecmp(p_code, v_code) == 0)) return v_i;
    }
    return -1;
}

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_findPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;

    for (uint8_t v_i = 0; v_i < EN_A20_WINDSTYLE_COUNT; v_i++) {
        const char* v_code = G_A20_WindStyle_Arr[v_i].code;
        if (v_code && (strcasecmp(p_code, v_code) == 0)) return v_i;
    }
    return -1;
}

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_findPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;

    for (uint8_t v_i = 0; v_i < EN_A20_WINDPRESET_COUNT; v_i++) {
        const char* v_code = G_A20_WindStyle_Arr[v_i].code;
        if (v_code && (strcasecmp(p_code, v_code) == 0)) return v_i;
    }
    return -1;
}

// [A20_Const_070.h] 정적 프리셋(code) -> 정적 인덱스 반환(없으면 -1)
inline int A20_findPresetIndexByCode(const char* p_code) {
    if (!p_code ||
