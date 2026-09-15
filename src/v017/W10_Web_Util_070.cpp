/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Util_070.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Utility Implementation
 * ------------------------------------------------------
 * 기능 요약:
 * - HTTP 응답 공통 유틸리티 구현 (헤더 적용 / JSON / 텍스트)
 * - 헤더 inline 제거: 코드 크기 축소 + 단일 정의
 * ------------------------------------------------------
 * [구현 규칙]
 * - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 * - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 * - JsonDocument 단일 타입만 사용
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 * - 전역 상수,매크로      : G_모듈약어_ 접두사
 * - 전역 변수             : g_모듈약어_ 접두사
 * - 전역 함수             : 모듈약어_ 접두사
 * - 클래스명              : CL_모듈약어_ 접두사
 * - 클래스 private 멤버   : _ 접두사
 * - 클래스 정적 멤버      : s_ 접두사
 * ------------------------------------------------------
 */

#include "W10_Web_070.h"

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
//  - UTF-8 강제
//  - 캐시 금지 헤더 포함
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
