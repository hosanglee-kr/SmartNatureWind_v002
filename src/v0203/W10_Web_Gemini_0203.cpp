/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Gemini_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API – Gemini AI Proxy & 2-turn Function Controller
 * ------------------------------------------------------
 * 기능 요약:
 *  - POST /api/v001/ai/gemini 엔드포인트
 *    * 자연어 제어 모드 (message 필드): 시스템 프롬프트 + 12개 도구 2-turn 실행 및 TTS 힌트 반환
 *    * 레거시 프록시 모드 (contents 필드): Gemini API 투명 중계
 *  - POST /api/v001/ai/execute-action 엔드포인트: 단일 도구 직접 실행 브리지
 *  - API 키 노출 방지, 레이트 리밋, 메모리 보호 상한 (W10_AI_Limits)
 * ------------------------------------------------------
 * [구현 규칙]
 *  - ArduinoJson v7.x.x 사용 (단일 JsonDocument, createNested 금지)
 *  - memset + strlcpy 기반 안전 초기화
 *  - async_tcp 스택 보호: 큰 버퍼 static화
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"
#include "CT10_Ctl_0203.h"
#include "D10_Logger_0203.h"
#include "C10_Config_0203.h"
#include <WiFiClientSecure.h>

// ------------------------------------------------------
// Gemini API 상수
// ------------------------------------------------------
#define G_W10_GEMINI_HOST          "generativelanguage.googleapis.com"
#define G_W10_GEMINI_PORT          443
#define G_W10_GEMINI_TIMEOUT       W10_AI_Limits::G_GEMINI_TIMEOUT_MS
#define G_W10_GEMINI_RATE_LIMIT_MS W10_AI_Limits::G_RATE_LIMIT_MS
#define G_W10_GEMINI_MAX_RESP      W10_AI_Limits::G_MAX_RESPONSE_BYTES

static unsigned long s_lastGeminiCallMs = 0;

// ------------------------------------------------------
// Gemini API Key 조회 (스냅샷 안전 조회)
// ------------------------------------------------------
static const char* W10_getGeminiApiKey() {
    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    static char s_keyBuf[64];
    memset(s_keyBuf, 0, sizeof(s_keyBuf));

    if (v_snap.system) {
        if (v_snap.system->security.geminiApiKey[0] != '\0') {
            strlcpy(s_keyBuf, v_snap.system->security.geminiApiKey, sizeof(s_keyBuf));
            return s_keyBuf;
        }
        if (v_snap.system->security.apiKey[0] != '\0') {
            strlcpy(s_keyBuf, v_snap.system->security.apiKey, sizeof(s_keyBuf));
            return s_keyBuf;
        }
    }
    return nullptr;
}

// ------------------------------------------------------
// Gemini API 직접 호출 (HTTPS POST)
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

    if (!v_client.connect(G_W10_GEMINI_HOST, G_W10_GEMINI_PORT)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][Gemini] Connection failed");
        r_httpCode = 503;
        return "{\"error\":\"Gemini connection failed\"}";
    }

    String v_request  = "POST /v1beta/models/gemini-2.5-flash:generateContent?key=";
    v_request        += v_apiKey;
    v_request        += " HTTP/1.1\r\n";
    v_request        += "Host: " G_W10_GEMINI_HOST "\r\n";
    v_request        += "Content-Type: application/json\r\n";
    v_request        += "Connection: close\r\n";
    v_request        += "Content-Length: " + String(p_len) + "\r\n\r\n";

    v_client.print(v_request);
    v_client.print(p_body);

    String        v_resp;
    unsigned long v_startMs     = millis();
    bool          v_headersDone = false;
    bool          v_truncated   = false;

    static constexpr size_t S_LINE_BUF_SZ = 512;
    static char             s_lineBuf[S_LINE_BUF_SZ];
    static uint8_t          s_chunk[256];

    while (v_client.connected() || v_client.available()) {
        if (millis() - v_startMs > (unsigned long)G_W10_GEMINI_TIMEOUT) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][Gemini] Timeout reading response");
            r_httpCode = 504;
            v_client.stop();
            return "{\"error\":\"Gemini timeout\"}";
        }

        if (!v_client.available()) {
            delay(5);
            continue;
        }

        // 헤더 파싱
        if (!v_headersDone) {
            memset(s_lineBuf, 0, S_LINE_BUF_SZ);
            size_t v_n     = v_client.readBytesUntil('\n', s_lineBuf, S_LINE_BUF_SZ - 1);
            s_lineBuf[v_n] = '\0';

            if (v_n >= 5 && strncmp(s_lineBuf, "HTTP/", 5) == 0) {
                const char* v_sp = strchr(s_lineBuf, ' ');
                if (v_sp) r_httpCode = atoi(v_sp + 1);
            }
            if (v_n == 0 || (v_n == 1 && s_lineBuf[0] == '\r')) {
                v_headersDone = true;
            }
            continue;
        }

        // 본문 청크 누적
        size_t v_n = v_client.readBytes(s_chunk, sizeof(s_chunk));
        if (v_n == 0) continue;

        size_t v_avail = (v_resp.length() < G_W10_GEMINI_MAX_RESP) ? (G_W10_GEMINI_MAX_RESP - v_resp.length()) : 0;

        if (v_avail == 0) {
            v_truncated = true;
            continue; // drain
        }

        size_t v_append = (v_n < v_avail) ? v_n : v_avail;
        v_resp.concat((const char*)s_chunk, v_append);

        if (v_append < v_n) v_truncated = true;
    }

    v_client.stop();

    if (v_truncated) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10][Gemini] Response truncated at %u bytes", (unsigned)v_resp.length());
    }
    return v_resp;
}

// ------------------------------------------------------
// 2-turn Function Calling 자연어 제어 파이프라인
// ------------------------------------------------------
static void handleNaturalLanguageTurn(AsyncWebServerRequest* p_request, JsonDocument& p_inDoc) {
    const char* v_message = p_inDoc["message"] | "";
    const char* v_lang    = p_inDoc["lang"] | "ko";
    bool        v_voice   = p_inDoc["voiceMode"] | false;

    if (!v_message[0]) {
        p_request->send(400, "application/json", "{\"error\":\"empty message\"}");
        return;
    }

    // ─── Turn 1 요청 조립 ───
    JsonDocument v_turn1Req;
    JsonObject   v_sys = v_turn1Req["system_instruction"].to<JsonObject>();
    v_sys["parts"].to<JsonArray>().add(CT10_AI::buildAIPromptStrict(v_lang, v_voice));

    JsonArray  v_tools   = v_turn1Req["tools"].to<JsonArray>();
    JsonObject v_toolObj = v_tools.add<JsonObject>();
    JsonArray  v_decls   = v_toolObj["function_declarations"].to<JsonArray>();
    CT10_AI::appendAIFunctionDeclarations(v_decls);

    JsonArray v_contents = v_turn1Req["contents"].to<JsonArray>();

    // 대화 이력 주입 (최근 6턴)
    if (p_inDoc["history"].is<JsonArray>()) {
        JsonArrayConst v_hist     = p_inDoc["history"].as<JsonArrayConst>();
        size_t         v_startIdx = (v_hist.size() > 6) ? (v_hist.size() - 6) : 0;
        for (size_t i = v_startIdx; i < v_hist.size(); ++i) {
            JsonObjectConst h      = v_hist[i];
            const char*     v_role = h["role"] | "user";
            const char*     v_text = h["text"] | "";
            if (v_text[0]) {
                JsonObject c = v_contents.add<JsonObject>();
                c["role"]    = (strcmp(v_role, "assistant") == 0) ? "model" : "user";
                c["parts"].to<JsonArray>().add(v_text);
            }
        }
    }

    // 현재 사용자 메시지 추가
    JsonObject v_userCur = v_contents.add<JsonObject>();
    v_userCur["role"]    = "user";
    v_userCur["parts"].to<JsonArray>().add(v_message);

    String v_t1Body;
    serializeJson(v_turn1Req, v_t1Body);

    int    v_httpCode = 0;
    String v_t1Resp   = W10_callGeminiApi(v_t1Body.c_str(), v_t1Body.length(), v_httpCode);

    if (v_httpCode != 200 || v_t1Resp.length() == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][AI] Turn1 Gemini call failed (HTTP %d)", v_httpCode);
        JsonDocument v_err;
        v_err["ok"]          = false;
        v_err["error"]       = "gemini_failed";
        v_err["_speechHint"] = (strcmp(v_lang, "en") == 0) ? "AI service is currently unavailable."
                                                           : "AI 서비스 응답이 지연되고 있습니다.";
        v_err["_lang"]       = v_lang;
        CL_W10_WebAPI::sendJson(p_request, v_err, 502);
        return;
    }

    // ─── Turn 1 응답 파싱 ───
    JsonDocument v_t1Doc;
    if (deserializeJson(v_t1Doc, v_t1Resp)) {
        p_request->send(502, "application/json", "{\"error\":\"invalid upstream json\"}");
        return;
    }

    JsonObject v_candidate = v_t1Doc["candidates"][0].as<JsonObject>();
    JsonObject v_content   = v_candidate["content"].as<JsonObject>();
    JsonArray  v_parts     = v_content["parts"].as<JsonArray>();

    bool         v_hasFnCall = false;
    String       v_fnName;
    JsonDocument v_fnArgsDoc;
    String       v_textResponse;

    for (JsonObject p : v_parts) {
        if (p["functionCall"].is<JsonObject>()) {
            v_hasFnCall = true;
            v_fnName    = p["functionCall"]["name"].as<String>();
            v_fnArgsDoc.set(p["functionCall"]["args"]);
            break;
        } else if (p["text"].is<const char*>()) {
            v_textResponse += p["text"].as<const char*>();
        }
    }

    JsonDocument v_finalDoc;
    v_finalDoc["_lang"] = v_lang;

    // 도구 호출이 없는 일반 대화인 경우
    if (!v_hasFnCall) {
        v_finalDoc["ok"]          = true;
        v_finalDoc["text"]        = v_textResponse.length() > 0 ? v_textResponse : "명령을 이해했습니다.";
        v_finalDoc["_speechHint"] = v_finalDoc["text"];
        v_finalDoc["actions"].to<JsonArray>();
        CL_W10_WebAPI::sendJson(p_request, v_finalDoc, 200);
        return;
    }

    // ─── 도구 실행 (Turn 1 Function Call) ───
    JsonObjectConst v_argsConst    = v_fnArgsDoc.as<JsonObjectConst>();
    String          v_actionResult = CT10_AI::executeAIAction(v_fnName.c_str(), v_argsConst);
    bool            v_actionOk     = (v_actionResult == "ok" || v_actionResult.startsWith("{"));

    JsonObject v_actObj = v_finalDoc["actions"].to<JsonArray>().add<JsonObject>();
    v_actObj["name"]    = v_fnName;
    v_actObj["args"]    = v_argsConst;
    v_actObj["result"]  = v_actionResult;

    String v_speechHint       = CT10_AI::buildSpeechHint(v_fnName.c_str(), v_argsConst, v_actionOk);
    v_finalDoc["_speechHint"] = v_speechHint;

    // ─── Turn 2 자연어 요약 호출 (FunctionResponse 전달) ───
    JsonDocument v_turn2Req;
    JsonObject   v_t2Sys = v_turn2Req["system_instruction"].to<JsonObject>();
    v_t2Sys["parts"].to<JsonArray>().add(CT10_AI::buildAIPromptStrict(v_lang, v_voice));

    JsonArray v_t2Contents = v_turn2Req["contents"].to<JsonArray>();
    for (JsonObject c : v_contents) {
        v_t2Contents.add(c);
    }
    // model의 functionCall part 추가
    v_t2Contents.add(v_content);

    // user의 functionResponse part 추가
    JsonObject v_fnRespObj      = v_t2Contents.add<JsonObject>();
    v_fnRespObj["role"]         = "user";
    JsonObject v_fnPart         = v_fnRespObj["parts"].to<JsonArray>().add<JsonObject>();
    JsonObject v_fr             = v_fnPart["functionResponse"].to<JsonObject>();
    v_fr["name"]                = v_fnName;
    v_fr["response"]["content"] = v_actionResult;

    String v_t2Body;
    serializeJson(v_turn2Req, v_t2Body);

    int    v_t2Code = 0;
    String v_t2Resp = W10_callGeminiApi(v_t2Body.c_str(), v_t2Body.length(), v_t2Code);

    String v_naturalText;
    if (v_t2Code == 200 && v_t2Resp.length() > 0) {
        JsonDocument v_t2Doc;
        if (!deserializeJson(v_t2Doc, v_t2Resp)) {
            const char* v_txt = v_t2Doc["candidates"][0]["content"]["parts"][0]["text"] | "";
            if (v_txt[0]) v_naturalText = v_txt;
        }
    }

    v_finalDoc["ok"]   = v_actionOk;
    v_finalDoc["text"] = (v_naturalText.length() > 0) ? v_naturalText : v_speechHint;

    // 세션 스냅샷 첨부
    ST_CT10_SessionContext_t v_curSession = CL_CT10_ControlManager::getSessionSnapshot();
    JsonObject               v_sess       = v_finalDoc["session"].to<JsonObject>();
    v_sess["type"]                        = (v_curSession.type == EN_CT10_SESSION_FIXED)      ? "FIXED"
                                            : (v_curSession.type == EN_CT10_SESSION_PRESET)   ? "PRESET"
                                            : (v_curSession.type == EN_CT10_SESSION_PLAYLIST) ? "PLAYLIST"
                                                                                              : "NONE";
    v_sess["state"]                       = (v_curSession.state == EN_SESSION_ACTIVE)   ? "ACTIVE"
                                            : (v_curSession.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                                                        : "COMPLETED";

    CL_W10_WebAPI::sendJson(p_request, v_finalDoc, 200);
}

// ------------------------------------------------------
// POST /api/v001/ai/gemini
// ------------------------------------------------------
void CL_W10_WebAPI::routeGeminiProxy() {
    s_server->on(
        W10_Const::HTTP_API_GEMINI_PROXY,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) { p_request->send(400, "application/json", "{\"error\":\"empty body\"}"); },
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }

            if (p_index + p_len != p_total) return;

            // 레이트 리밋 검사 (W10_AI_Limits::G_RATE_LIMIT_MS)
            unsigned long v_now = millis();
            if (v_now - s_lastGeminiCallMs < G_W10_GEMINI_RATE_LIMIT_MS) {
                p_request->send(429, "application/json", "{\"error\":\"rate limited, please wait a few seconds\"}");
                return;
            }
            s_lastGeminiCallMs = v_now;

            if (p_len > W10_AI_Limits::G_MAX_REQUEST_BODY) {
                p_request->send(413, "application/json", "{\"error\":\"payload too large\"}");
                return;
            }

            JsonDocument v_doc;
            auto         v_err = deserializeJson(v_doc, (const char*)p_data, p_len);
            if (v_err) {
                p_request->send(400, "application/json", "{\"error\":\"invalid JSON\"}");
                return;
            }

            // 분기 1: 자연어 제어 모드 (message 필드 존재 시)
            if (v_doc["message"].is<const char*>()) {
                handleNaturalLanguageTurn(p_request, v_doc);
                return;
            }

            // 분기 2: 레거시 프록시 모드 (기존 투명 중계)
            int    v_httpCode = 0;
            String v_resp     = W10_callGeminiApi((const char*)p_data, p_len, v_httpCode);

            if (v_httpCode == 200) {
                sendText(p_request, v_resp, 200, "application/json; charset=utf-8");
            } else {
                JsonDocument v_errDoc;
                v_errDoc["error"]         = "upstream failed";
                v_errDoc["upstream_http"] = v_httpCode;
                if (v_resp.length() > 0) {
                    v_errDoc["upstream_body"] = v_resp.substring(0, 200);
                }
                CL_W10_WebAPI::sendJson(p_request, v_errDoc, 502);
            }
        });
}

// ------------------------------------------------------
// POST /api/v001/ai/execute-action (단일 도구 직접 실행 브리지)
// ------------------------------------------------------
void CL_W10_WebAPI::routeAIExecuteAction() {
    s_server->on(
        W10_Const::HTTP_API_GEMINI_EXECUTE,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) { p_request->send(400, "application/json", "{\"error\":\"empty body\"}"); },
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }

            if (p_index + p_len != p_total) return;

            JsonDocument v_in;
            if (deserializeJson(v_in, (const char*)p_data, p_len)) {
                p_request->send(400, "application/json", "{\"error\":\"invalid JSON\"}");
                return;
            }

            const char*     v_name = v_in["name"] | "";
            JsonObjectConst v_args = v_in["args"].as<JsonObjectConst>();

            String v_res = CT10_AI::executeAIAction(v_name, v_args);
            bool   v_ok  = (v_res == "ok" || v_res.startsWith("{"));

            JsonDocument v_out;
            v_out["ok"]          = v_ok;
            v_out["name"]        = v_name;
            v_out["result"]      = v_res;
            v_out["_speechHint"] = CT10_AI::buildSpeechHint(v_name, v_args, v_ok);

            ST_CT10_SessionContext_t v_s    = CL_CT10_ControlManager::getSessionSnapshot();
            JsonObject               v_sess = v_out["session"].to<JsonObject>();
            v_sess["type"]                  = (v_s.type == EN_CT10_SESSION_FIXED)      ? "FIXED"
                                              : (v_s.type == EN_CT10_SESSION_PRESET)   ? "PRESET"
                                              : (v_s.type == EN_CT10_SESSION_PLAYLIST) ? "PLAYLIST"
                                                                                       : "NONE";
            v_sess["state"]                 = (v_s.state == EN_SESSION_ACTIVE)   ? "ACTIVE"
                                              : (v_s.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                                                 : "COMPLETED";

            CL_W10_WebAPI::sendJson(p_request, v_out, 200);
        });
}
