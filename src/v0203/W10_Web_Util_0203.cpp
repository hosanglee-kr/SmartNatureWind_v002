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

    // [신규 P0] MIME 스니핑 차단 (W10_guessMime endsWith 패치와 반드시 함께 적용)
    p_response->addHeader("X-Content-Type-Options", "nosniff");

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

    // [신규] 컴파일 타임 API Key 강제 여부 (W10_USE_API_KEY=0 → 무조건 통과)
#if defined(W10_USE_API_KEY) && (W10_USE_API_KEY == 0)
    return true;
#endif

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

// ======================================================
// [신규 P0] API Key 검사 + 실패 시 401 즉시 응답 (hang 방지)
// ======================================================
bool CL_W10_WebAPI::requireApiKey(AsyncWebServerRequest* p_request) {
    if (checkApiKey(p_request)) return true;
    if (p_request) {
        p_request->send(401, "application/json; charset=utf-8",
                        "{\"error\":\"unauthorized\",\"hint\":\"X-API-Key header required\"}");
    }
    return false;
}

// --------------------------------------------------
// JSON Body 파싱
// --------------------------------------------------
bool CL_W10_WebAPI::parseJsonBody(AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, JsonDocument& p_doc) {
    // [신규] null/empty 방어 (ArduinoJson 내부 strnlen(nullptr) 크래시 방지)
    if (!p_data || p_len == 0) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10] parseJsonBody: empty body");
        return false;
    }

    // [신규] 크기 한도 (DoS 방지) — 일반 body 1MB
    static constexpr size_t W10_MAX_GENERIC_BODY = 1024 * 1024;
    if (p_len > W10_MAX_GENERIC_BODY) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[W10] parseJsonBody: body too large (%u > %u)",
                           (unsigned)p_len, (unsigned)W10_MAX_GENERIC_BODY);
        return false;
    }

    // [신규] contentLength 사전 검사
    if (p_request) {
        const size_t v_cl = p_request->contentLength();
        if (v_cl > 0 && v_cl > W10_MAX_GENERIC_BODY) {
            CL_D10_Logger::log(EN_L10_LOG_WARN,
                               "[W10] parseJsonBody: contentLength %u exceeds limit",
                               (unsigned)v_cl);
            return false;
        }
    }

    auto v_err = deserializeJson(p_doc, (const char*)p_data, p_len);
    if (v_err) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10] JSON parse error: %s", v_err.c_str());
        return false;
    }
    return true;
}

// ======================================================
// [신규 P0] 단편화 body 누적 헬퍼 (단일 블록 할당: 연결 끊김 시 _tempObject 자동 free 누수 방지)
// ======================================================
namespace {
    struct ST_W10_BodyAccum {
        size_t cap;
        size_t written;
        uint8_t buf[];
    };
    static constexpr size_t W10_MAX_ACCUM_BODY = 1024 * 1024;
}

bool CL_W10_WebAPI::beginBody(AsyncWebServerRequest* r, size_t total) {
    if (!r || total == 0 || total > W10_MAX_ACCUM_BODY) return false;
    if (r->_tempObject) freeBody(r);
    auto* acc = (ST_W10_BodyAccum*)malloc(sizeof(ST_W10_BodyAccum) + total);
    if (!acc) return false;
    acc->cap          = total;
    acc->written      = 0;
    r->_tempObject    = acc;
    return true;
}

bool CL_W10_WebAPI::appendBody(AsyncWebServerRequest* r, uint8_t* data, size_t len, size_t index, size_t total) {
    if (!r || !data) return false;
    auto* acc = (ST_W10_BodyAccum*)r->_tempObject;
    if (!acc) return false;
    if (index + len > acc->cap) return false;
    memcpy(acc->buf + index, data, len);
    acc->written = index + len;
    return (acc->written >= total);
}

uint8_t* CL_W10_WebAPI::takeBodyBuf(AsyncWebServerRequest* r, size_t& r_len) {
    auto* acc = r ? (ST_W10_BodyAccum*)r->_tempObject : nullptr;
    if (!acc) {
        r_len = 0;
        return nullptr;
    }
    r_len = acc->written;
    return acc->buf;
}

void CL_W10_WebAPI::freeBody(AsyncWebServerRequest* r) {
    if (!r || !r->_tempObject) return;
    free(r->_tempObject);
    r->_tempObject = nullptr;
}
