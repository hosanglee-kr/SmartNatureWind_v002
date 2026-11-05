/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Util_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Utility Implementation
 * ------------------------------------------------------
 * 기능 요약:
 * - HTTP 응답 공통 유틸리티 구현 (헤더 적용 / JSON / 텍스트)
 * - API Key 검사 (A-3 null 방어)
 * - JSON Body 파싱
 *
 * [Batch A-3] checkApiKey null 역참조 방어
 *  - Null Deref → Core Dump 방지
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"

// --------------------------------------------------
// 공통 헤더 적용
// --------------------------------------------------
void CL_W10_WebAPI::_applyHeaders(AsyncWebServerResponse* p_response, bool p_nocache) {
    if (!p_response) return;

    if (p_nocache) {
        p_response->addHeader("Cache-Control", "no-store");
        p_response->addHeader("Pragma", "no-cache");
    }
    p_response->addHeader("Access-Control-Allow-Origin", "*");
    p_response->addHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
    p_response->addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

// --------------------------------------------------
// JSON 응답
// --------------------------------------------------
void CL_W10_WebAPI::sendJson(AsyncWebServerRequest* p_request, JsonDocument& p_doc, int p_code) {
    if (!p_request) return;

    String v_out;
    serializeJson(p_doc, v_out);

    auto* v_resp = p_request->beginResponse(p_code, "application/json; charset=utf-8", v_out);

    _applyHeaders(v_resp, true);
    p_request->send(v_resp);
}

// --------------------------------------------------
// 텍스트 응답
// --------------------------------------------------
void CL_W10_WebAPI::sendText(AsyncWebServerRequest* p_request,
                             const String&          p_msg,
                             int                    p_code,
                             const char*            p_mime) {
    if (!p_request) return;

    auto* v_resp = p_request->beginResponse(p_code, p_mime, p_msg);

    _applyHeaders(v_resp, true);
    p_request->send(v_resp);
}

// --------------------------------------------------
// API Key 검사
// --------------------------------------------------
bool CL_W10_WebAPI::checkApiKey(AsyncWebServerRequest* p_request) {
    // [A-3] null 방어 (Null Deref → Core Dump 방지)
    if (!p_request) return false;

    // ======================================================
    // [N-10] B-2 규약 준수: async_tcp 컨텍스트에서 g_A20_config_root
    //         직접 참조 금지 → getRootSnapshot 원자 스냅샷 사용
    // ======================================================
    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    char v_keyBuf[64];
    memset(v_keyBuf, 0, sizeof(v_keyBuf));

    const char* v_key = nullptr;
    if (v_snap.system && v_snap.system->security.apiKey[0] != '\0') {
        strlcpy(v_keyBuf, v_snap.system->security.apiKey, sizeof(v_keyBuf));
        v_key = v_keyBuf;
    }

    if (!v_key || v_key[0] == '\0') {
        return true; // API 키 비활성화 상태
    }

    if (!p_request->hasHeader("X-API-Key")) return false;
    String v_val = p_request->getHeader("X-API-Key")->value();
    return (v_val == v_key);
}

// --------------------------------------------------
// JSON Body 파싱
// --------------------------------------------------
bool CL_W10_WebAPI::parseJsonBody(AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, JsonDocument& p_doc) {
    auto v_err = deserializeJson(p_doc, (const char*)p_data, p_len);
    if (v_err) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10] JSON parse error: %s", v_err.c_str());
        return false;
    }
    return true;
}
