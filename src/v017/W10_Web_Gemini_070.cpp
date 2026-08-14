/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Gemini_070.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API – Gemini AI Proxy
 * ------------------------------------------------------
 * 기능 요약:
 *  - POST /api/v001/ai/gemini 엔드포인트
 *  - 프론트엔드의 Gemini API 호출을 백엔드가 대리 수행
 *  - API 키 노출 방지, 레이트 리밋, 응답 최적화
 * ------------------------------------------------------
 * [구현 규칙]
 *  - ArduinoJson v7.x.x 사용
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 * ------------------------------------------------------
 */

#include "W10_Web_070.h"
#include <WiFiClientSecure.h>

// ------------------------------------------------------
// Gemini API 상수
// ------------------------------------------------------
#define G_W10_GEMINI_HOST          "generativelanguage.googleapis.com"
#define G_W10_GEMINI_PORT          443
#define G_W10_GEMINI_TIMEOUT       15000 // 15초 (ESP32 메모리/CPU 부하 고려)

// 최소 호출 간격 (ms) – 무료 티어 레이트 리밋 방지
#define G_W10_GEMINI_RATE_LIMIT_MS 3000

// ------------------------------------------------------
// 전역 레이트 리밋 타이머
// ------------------------------------------------------
static unsigned long s_lastGeminiCallMs = 0;

// ------------------------------------------------------
// Gemini API Key 조회
// ------------------------------------------------------
// ------------------------------------------------------
// Gemini API Key 조회 (전용 필드 사용)
// ------------------------------------------------------
static const char* W10_getGeminiApiKey() {
    if (g_A20_config_root.system) {
        // 1순위: Gemini 전용 키
        if (g_A20_config_root.system->security.geminiApiKey[0] != '\0') {
            return g_A20_config_root.system->security.geminiApiKey;
        }
        // 2순위: 일반 API Key로 폴백 (geminiApiKey가 비어있을 경우)
        if (g_A20_config_root.system->security.apiKey[0] != '\0') {
            return g_A20_config_root.system->security.apiKey;
        }
    }
    return nullptr;
}

// ------------------------------------------------------
// Gemini API 호출 (POST)
// ------------------------------------------------------
static String W10_callGeminiApi(const char* p_body, size_t p_len, int& r_httpCode) {
    const char* v_apiKey = W10_getGeminiApiKey();
    if (!v_apiKey || v_apiKey[0] == '\0') {
        r_httpCode = 503;
        return "{\"error\":\"Gemini API key not configured\"}";
    }

    WiFiClientSecure v_client;
    v_client.setInsecure(); // ESP32 제약: 인증서 검증 생략
    v_client.setTimeout(G_W10_GEMINI_TIMEOUT / 1000);

    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[W10][Gemini] Connecting to %s:%d...", G_W10_GEMINI_HOST, G_W10_GEMINI_PORT);

    if (!v_client.connect(G_W10_GEMINI_HOST, G_W10_GEMINI_PORT)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][Gemini] Connection failed");
        r_httpCode = 503;
        return "{\"error\":\"Gemini connection failed\"}";
    }

    // 요청 라인 + 헤더
    String v_request  = "POST /v1beta/models/gemini-2.5-flash:generateContent?key=";
    v_request        += v_apiKey;
    v_request        += " HTTP/1.1\r\n";
    v_request        += "Host: " G_W10_GEMINI_HOST "\r\n";
    v_request        += "Content-Type: application/json\r\n";
    v_request        += "Connection: close\r\n";
    v_request        += "Content-Length: " + String(p_len) + "\r\n\r\n";

    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[W10][Gemini] Sending request (%u bytes body)", (unsigned)p_len);

    v_client.print(v_request);
    v_client.print(p_body);

    // 응답 읽기
    String        v_resp;
    unsigned long v_startMs     = millis();
    bool          v_headersDone = false;

    while (v_client.connected() || v_client.available()) {
        if (millis() - v_startMs > (unsigned long)G_W10_GEMINI_TIMEOUT) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][Gemini] Timeout reading response");
            r_httpCode = 504;
            v_client.stop();
            return "{\"error\":\"Gemini timeout\"}";
        }

        if (v_client.available()) {
            String v_line = v_client.readStringUntil('\n');

            if (!v_headersDone) {
                if (v_line.startsWith("HTTP/")) {
                    // 예: "HTTP/1.1 200 OK"
                    int v_space = v_line.indexOf(' ');
                    if (v_space > 0) {
                        r_httpCode = v_line.substring(v_space + 1, v_line.indexOf(' ', v_space + 1)).toInt();
                    }
                }
                if (v_line == "\r" || v_line.length() <= 1) {
                    v_headersDone = true;
                }
            } else {
                v_resp += v_line + "\n";
            }
        }
    }

    v_client.stop();
    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[W10][Gemini] HTTP %d, response: %u bytes", r_httpCode, (unsigned)v_resp.length());

    return v_resp;
}

// ------------------------------------------------------
// POST /api/v001/ai/gemini
// ------------------------------------------------------
void CL_W10_WebAPI::routeGeminiProxy() {
    s_server->on(
        W10_Const::HTTP_API_GEMINI_PROXY,
        HTTP_POST,
        // ─── 완료 핸들러 (빈 바디 시) ───
        [](AsyncWebServerRequest* p_request) { p_request->send(400, "application/json", "{\"error\":\"empty body\"}"); },
        // ─── 업로드 핸들러 없음 ───
        nullptr,
        // ─── 바디 핸들러 ───
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }

            // 마지막 청크만 처리
            if (p_index + p_len != p_total) return;

            // ─── 레이트 리밋 ───
            unsigned long v_now = millis();
            if (v_now - s_lastGeminiCallMs < G_W10_GEMINI_RATE_LIMIT_MS) {
                p_request->send(429,
                                "application/json",
                                "{\"error\":\"rate limited, retry after " +
                                    String((G_W10_GEMINI_RATE_LIMIT_MS - (v_now - s_lastGeminiCallMs)) / 1000) + "s\"}");
                return;
            }
            s_lastGeminiCallMs = v_now;

            // ─── 요청 검증 ───
            if (p_len > 8192) { // 8KB 제한
                p_request->send(413, "application/json", "{\"error\":\"payload too large (max 8KB)\"}");
                return;
            }

            JsonDocument v_doc;
            auto         v_err = deserializeJson(v_doc, (const char*)p_data, p_len);
            if (v_err) {
                p_request->send(400, "application/json", "{\"error\":\"invalid JSON\"}");
                return;
            }

            // ─── Gemini 호출 ───
            int    v_httpCode = 0;
            String v_resp     = W10_callGeminiApi((const char*)p_data, p_len, v_httpCode);

            CL_D10_Logger::log(EN_L10_LOG_INFO,
                               "[W10][Gemini] Proxy call: HTTP %d, response %u bytes",
                               v_httpCode,
                               (unsigned)v_resp.length());

            // ─── 응답 ───
            if (v_httpCode == 200) {
                sendText(p_request, v_resp, 200, "application/json; charset=utf-8");
            } else {
                JsonDocument v_errDoc;
                v_errDoc["error"]         = "upstream failed";
                v_errDoc["upstream_http"] = v_httpCode;
                if (v_resp.length() > 0) {
                    v_errDoc["upstream_body"] = v_resp.substring(0, 200); // 최대 200자만
                }
                sendJson(p_request, v_errDoc, 502);
            }
        });
}