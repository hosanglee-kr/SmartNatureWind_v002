#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : A20_Com_Func_045.h
 * 모듈약어 : A20
 * 모듈명 : Smart Nature Wind 공용 헬퍼/기본값 함수 구현 전용 헤더
 * ------------------------------------------------------
 * 기능 요약
 *  - Segment Mode String 매핑 유틸 (A20_modeFromString / A20_modeToString)
 *  - 하위 구조체 단위 Reset(Period/Segment/AutoOff/Motion/Adjust 등)
 *  - Default Reset (System/WiFi/Motion/WindDict/NvsSpec/WebPage/Schedules/UserProfiles/Root)
 *  - WindDict 검색 유틸
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 *  - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 변수명은 가능한 해석 가능하게
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - namespace 명        : 모듈약어_ 접두사
 *   - namespace 내 상수    : 모둘약어 접두시 미사용
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사 , 버전 제거
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <string.h>
#include <strings.h>

#include "D10_Logger_040.h"

// NOTE:
// - 본 헤더는 A20_Const_044.h에서 include하여 사용합니다.
// - A20_Const_044.h에 정의된 타입/상수/전역(예: A20_Const::*, ST_A20_*, EN_A20_*)에 의존합니다.



// ======================================================
// 2) Segment Mode <-> String 매핑 유틸
// ======================================================
inline EN_A20_segment_mode_t A20_modeFromString(const char* p_str) {
    if (!p_str || !p_str[0]) return EN_A20_SEG_MODE_PRESET;

    for (uint8_t v_i = 0; v_i < EN_A20_SEG_MODE_COUNT; v_i++) {
        // 구조체 배열의 .code 필드와 비교
        if (strcasecmp(p_str, G_A20_SegmentMode_Arr[v_i].code) == 0) {
            return G_A20_SegmentMode_Arr[v_i].idx;
        }
    }
    return EN_A20_SEG_MODE_PRESET;
}


inline const char* A20_modeToString(EN_A20_segment_mode_t p_mode) {
    if (p_mode >= EN_A20_SEG_MODE_COUNT) return G_A20_SegmentMode_Arr[EN_A20_SEG_MODE_PRESET].code;
    return G_A20_SegmentMode_Arr[p_mode].code;
}



// ======================================================
// 6) WindDict 검색 유틸 (누락/축소 방지)
// ======================================================

inline int8_t A20_getStaticPresetIndexByCode(const char* p_code) {
    if (!p_code || !p_code[0]) return -1;
    for (uint8_t v_i = 0; v_i < EN_A20_WINDPRESET_COUNT; v_i++) {
        if (strcasecmp(p_code, G_A20_WindPreset_Arr[v_i].code) == 0) return (int8_t)v_i;
    }
    return -1;
}

// ======================================================
// 7) 유틸리티: 코드로부터 이름을 즉시 반환 (UI 표시용)
// ======================================================
inline const char* A20_getPresetNameByCode(const char* p_code) {
    int8_t v_idx = A20_getStaticPresetIndexByCode(p_code);
    if (v_idx >= 0) return G_A20_WindPreset_Arr[v_idx].name;
    return "Unknown";
}


inline int16_t A20_findPresetIndexByCode(const ST_A20_WindDict_t& p_dict, const char* p_code) {
    if (!p_code || !p_code[0]) return -1;
    for (uint8_t v_i = 0; v_i < p_dict.presetCount; v_i++) {
        if (strcasecmp(p_dict.presets[v_i].code, p_code) == 0) return (int16_t)v_i;
    }
    return -1;
}


inline int16_t A20_findStyleIndexByCode(const ST_A20_WindDict_t& p_dict, const char* p_code) {
    if (!p_code || !p_code[0]) return -1;
    for (uint8_t v_i = 0; v_i < p_dict.styleCount; v_i++) {
        if (strcasecmp(p_dict.styles[v_i].code, p_code) == 0) return (int16_t)v_i;
    }
    return -1;
}


