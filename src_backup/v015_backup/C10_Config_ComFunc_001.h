#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_ComFunc_001.h
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - Common Util
 * ------------------------------------------------------
 * 기능 요약:
 *  - C10 공통 JSON getter / 랩핑 루트 선택
 *  - Dirty Flag 원자적 set/clear (portMUX)
 *  - containsKey 사용 금지 준수(variant null 체크 방식)
 * ------------------------------------------------------
 */

#include <ArduinoJson.h>

static inline const char* C10U_getStr(JsonObjectConst p_obj, const char* p_key, const char* p_def) {
    if (p_obj.isNull()) return p_def;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return p_def;
    const char* s = v.as<const char*>();
    return (s && s[0]) ? s : p_def;
}

template <typename T>
static inline T C10U_getNum(JsonObjectConst p_obj, const char* p_key, T p_def) {
    if (p_obj.isNull()) return p_def;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return p_def;
    return v.as<T>();
}

static inline bool C10U_getBool(JsonObjectConst p_obj, const char* p_key, bool p_def) {
    if (p_obj.isNull()) return p_def;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return p_def;
    return v.as<bool>();
}

static inline JsonArrayConst C10U_getArr(JsonObjectConst p_obj, const char* p_key) {
    if (p_obj.isNull()) return JsonArrayConst();
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return JsonArrayConst();
    return v.as<JsonArrayConst>();
}

// 랩핑 키가 있으면 우선 사용, 없으면 루트 자체를 사용
static inline JsonObjectConst C10U_pickRootObject(JsonDocument& p_doc, const char* p_wrapKey) {
    JsonObjectConst v_wrapped = p_doc[p_wrapKey].as<JsonObjectConst>();
    if (!v_wrapped.isNull()) return v_wrapped;
    return p_doc.as<JsonObjectConst>();
}

// Dirty flag atomic set/clear
static inline void C10U_setDirtyAtomic(bool& p_flag) {
    static portMUX_TYPE s_mux = portMUX_INITIALIZER_UNLOCKED;
    portENTER_CRITICAL(&s_mux);
    p_flag = true;
    portEXIT_CRITICAL(&s_mux);
}

static inline void C10U_clearDirtyAtomic(bool& p_flag) {
    static portMUX_TYPE s_mux = portMUX_INITIALIZER_UNLOCKED;
    portENTER_CRITICAL(&s_mux);
    p_flag = false;
    portEXIT_CRITICAL(&s_mux);
}

static inline bool C10U_readDirtyAtomic(const bool& p_flag) {
    static portMUX_TYPE s_mux = portMUX_INITIALIZER_UNLOCKED;
    bool v = false;
    portENTER_CRITICAL(&s_mux);
    v = p_flag;
    portEXIT_CRITICAL(&s_mux);
    return v;
}

