/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_AILive_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API – Gemini Live Voice & Cost Guardrails
 * ------------------------------------------------------
 * 기능 요약:
 *  - POST /api/v001/ai/live-token: Live 세션 토큰 발급 및 일일 30분 상한(1800초) 차단 게이트
 *  - POST /api/v001/ai/live-function: Live 클라이언트 toolCall 위임 브리지 (CT10_AI::executeAIAction)
 *  - GET  /api/v001/ai/live-config: Live WS 초기 설정 스키마 및 프롬프트 제공
 *  - GET  /api/v001/ai/cost-status: 현재 누적 오디오/턴/비용 및 경고/차단 레벨
 *  - POST /api/v001/ai/usage: 클라이언트 30초 주기 사용량 보고 수신 및 NVS 영속화
 *  - POST /api/v001/ai/cost-reset: 일일 사용량 수동 초기화
 * ------------------------------------------------------
 * [구현 규칙]
 *  - ArduinoJson v7.x.x 단일 JsonDocument
 *  - NVS 30분(1800초) 비용 가드레일 엄격 검증
 *  - async_tcp 안전 버퍼 관리
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"
#include "W10_Web_Const_0203.h"
#include "CT10_Ctl_0203.h"
#include "N10_NvsManager_0203.h"
#include "C10_Config_0203.h"
#include "D10_Logger_0203.h"

using namespace W10_Const;

// Live WS 기본 엔드포인트
static const char* G_W10_LIVE_WS_URL =
    "wss://generativelanguage.googleapis.com/ws/"
    "google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";
static const char*        G_W10_LIVE_DEFAULT_VOICE = "Aoede";
static constexpr uint32_t G_W10_LIVE_DAILY_CAP_SEC = 1800; // 30분

// API Key 스냅샷 조회
static const char* W10_getGeminiApiKeySnapshot() {
    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    static char s_keyBuf[64];
    memset(s_keyBuf, 0, sizeof(s_keyBuf));

    if (v_snap.system && v_snap.system->security.geminiApiKey[0] != '\0') {
        strlcpy(s_keyBuf, v_snap.system->security.geminiApiKey, sizeof(s_keyBuf));
    }
    return s_keyBuf;
}

// ------------------------------------------------------
// routeAILive() 라우트 정의
// ------------------------------------------------------
void CL_W10_WebAPI::routeAILive() {
    // ==================================================
    // 1. POST /api/v001/ai/live-token
    // ==================================================
    s_server->on(HTTP_API_AI_LIVE_TOKEN, HTTP_POST, [](AsyncWebServerRequest* request) {
        if (!checkApiKey(request)) return;

        // 날짜 파라미터가 있으면 리셋 검사
        if (request->hasParam("today")) {
            String v_today = request->getParam("today")->value();
            CL_N10_NvsManager::resetAIDailyUsageIfNeeded(v_today.c_str());
        }

        ST_N10_AIDailyUsage_t v_usage = CL_N10_NvsManager::getAIDailyUsage();
        if (v_usage.audioSec >= G_W10_LIVE_DAILY_CAP_SEC) {
            CL_D10_Logger::log(EN_L10_LOG_WARN,
                               "[W10:Live] Token denied: Daily limit reached (%lu s)",
                               (unsigned long)v_usage.audioSec);
            JsonDocument v_errDoc;
            v_errDoc["error"]        = "Daily live audio limit exceeded (30 min)";
            v_errDoc["level"]        = "cap";
            v_errDoc["audioSec"]     = v_usage.audioSec;
            v_errDoc["capSec"]       = G_W10_LIVE_DAILY_CAP_SEC;
            v_errDoc["remainingSec"] = 0;
            String v_out;
            serializeJson(v_errDoc, v_out);
            request->send(403, "application/json", v_out);
            return;
        }

        const char* v_apiKey = W10_getGeminiApiKeySnapshot();
        if (!v_apiKey || v_apiKey[0] == '\0') {
            request->send(400, "application/json", "{\"error\":\"Gemini API Key is not configured\"}");
            return;
        }

        JsonDocument v_resDoc;
        v_resDoc["token"]     = v_apiKey;
        v_resDoc["wsUrl"]     = G_W10_LIVE_WS_URL;
        v_resDoc["voiceName"] = G_W10_LIVE_DEFAULT_VOICE;
        v_resDoc["audioSec"]  = v_usage.audioSec;
        v_resDoc["capSec"]    = G_W10_LIVE_DAILY_CAP_SEC;
        v_resDoc["remainingSec"] =
            (G_W10_LIVE_DAILY_CAP_SEC > v_usage.audioSec) ? (G_W10_LIVE_DAILY_CAP_SEC - v_usage.audioSec) : 0;
        v_resDoc["level"] = (v_usage.audioSec >= 1500) ? "warn" : "normal";

        String v_out;
        serializeJson(v_resDoc, v_out);
        request->send(200, "application/json", v_out);
    });

    // ==================================================
    // 2. POST /api/v001/ai/live-function
    // ==================================================
    s_server->on(
        HTTP_API_AI_LIVE_FUNC,
        HTTP_POST,
        [](AsyncWebServerRequest* request) {
            if (!checkApiKey(request)) return;
            if (!request->_tempObject) {
                request->send(400, "application/json", "{\"error\":\"Empty body\"}");
            }
        },
        nullptr,
        [](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
            if (!checkApiKey(request)) return;
            if (index == 0) request->_tempObject = reinterpret_cast<void*>(1);
            if (index + len != total) return; // 단편화 패킷 완결 대기

            if (len == 0 || total > W10_AI_Limits::G_MAX_REQUEST_BODY) {
                request->send(400, "application/json", "{\"error\":\"Invalid payload size\"}");
                return;
            }

            JsonDocument         v_inDoc;
            DeserializationError v_err = deserializeJson(v_inDoc, data, len);
            if (v_err) {
                request->send(400, "application/json", "{\"error\":\"JSON parse error\"}");
                return;
            }

            JsonDocument v_outDoc;
            JsonArray    v_responses = v_outDoc["functionResponses"].to<JsonArray>();

            // 멀티 함수 호출 지원 (functionCalls 배열)
            if (v_inDoc["functionCalls"].is<JsonArray>()) {
                JsonArray v_calls = v_inDoc["functionCalls"].as<JsonArray>();
                for (JsonObject v_call : v_calls) {
                    const char*     v_id      = v_call["id"] | "";
                    const char*     v_name    = v_call["name"] | "";
                    JsonObjectConst v_argsObj = v_call["args"].is<JsonObject>() ? v_call["args"].as<JsonObjectConst>()
                                                                                : JsonObjectConst();

                    String v_result = CT10_AI::executeAIAction(v_name, v_argsObj);
                    bool   v_ok     = (v_result == "ok");

                    JsonObject v_respItem             = v_responses.add<JsonObject>();
                    v_respItem["id"]                  = v_id;
                    v_respItem["name"]                = v_name;
                    v_respItem["response"]["result"]  = v_result;
                    v_respItem["response"]["success"] = v_ok;
                }
            } else if (v_inDoc["name"].is<const char*>()) {
                // 단일 함수 호출 포맷
                const char*     v_id      = v_inDoc["id"] | "call_0";
                const char*     v_name    = v_inDoc["name"].as<const char*>();
                JsonObjectConst v_argsObj = v_inDoc["args"].is<JsonObject>() ? v_inDoc["args"].as<JsonObjectConst>()
                                                                             : JsonObjectConst();

                String v_result = CT10_AI::executeAIAction(v_name, v_argsObj);
                bool   v_ok     = (v_result == "ok");

                JsonObject v_respItem             = v_responses.add<JsonObject>();
                v_respItem["id"]                  = v_id;
                v_respItem["name"]                = v_name;
                v_respItem["response"]["result"]  = v_result;
                v_respItem["response"]["success"] = v_ok;
            } else {
                request->send(400, "application/json", "{\"error\":\"Missing functionCalls or name\"}");
                return;
            }

            String v_responseStr;
            serializeJson(v_outDoc, v_responseStr);
            request->send(200, "application/json", v_responseStr);
        });

    // ==================================================
    // 3. GET /api/v001/ai/live-config
    // ==================================================
    s_server->on(HTTP_API_AI_LIVE_CFG, HTTP_GET, [](AsyncWebServerRequest* request) {
        if (!checkApiKey(request)) return;

        JsonDocument v_cfgDoc;
        v_cfgDoc["voiceName"] = G_W10_LIVE_DEFAULT_VOICE;

        // 시스템 엄격 프롬프트 주입
        String v_sysPrompt            = CT10_AI::buildAIPromptStrict("ko", false);
        v_cfgDoc["systemInstruction"] = v_sysPrompt;

        // 12개 Gemini 도구 스키마 리스트 (CT10_AI 단일 진실 공급원 위임)
        JsonArray  v_tools  = v_cfgDoc["tools"].to<JsonArray>();
        JsonObject v_fdRoot = v_tools.add<JsonObject>();
        JsonArray  v_decl   = v_fdRoot["function_declarations"].to<JsonArray>();

        CT10_AI::appendAIFunctionDeclarations(v_decl);

        String v_out;
        serializeJson(v_cfgDoc, v_out);
        request->send(200, "application/json", v_out);
    });

    // ==================================================
    // 4. GET /api/v001/ai/cost-status
    // ==================================================
    s_server->on(HTTP_API_AI_COST_STATUS, HTTP_GET, [](AsyncWebServerRequest* request) {
        if (!checkApiKey(request)) return;

        if (request->hasParam("today")) {
            String v_today = request->getParam("today")->value();
            CL_N10_NvsManager::resetAIDailyUsageIfNeeded(v_today.c_str());
        }

        ST_N10_AIDailyUsage_t v_usage = CL_N10_NvsManager::getAIDailyUsage();
        JsonDocument          v_doc;
        v_doc["resetDate"]       = v_usage.resetDate;
        v_doc["audioSec"]        = v_usage.audioSec;
        v_doc["turnCount"]       = v_usage.turnCount;
        v_doc["estCostUsdX1000"] = v_usage.estCostUsdX1000;
        v_doc["capSec"]          = G_W10_LIVE_DAILY_CAP_SEC;
        v_doc["remainingSec"] =
            (G_W10_LIVE_DAILY_CAP_SEC > v_usage.audioSec) ? (G_W10_LIVE_DAILY_CAP_SEC - v_usage.audioSec) : 0;
        v_doc["level"] =
            (v_usage.audioSec >= G_W10_LIVE_DAILY_CAP_SEC) ? "cap" : ((v_usage.audioSec >= 1500) ? "warn" : "normal");

        String v_out;
        serializeJson(v_doc, v_out);
        request->send(200, "application/json", v_out);
    });

    // ==================================================
    // 5. POST /api/v001/ai/usage
    // ==================================================
    s_server->on(
        HTTP_API_AI_USAGE,
        HTTP_POST,
        [](AsyncWebServerRequest* request) {
            if (!checkApiKey(request)) return;
            if (!request->_tempObject) {
                request->send(400, "application/json", "{\"error\":\"Empty body\"}");
            }
        },
        nullptr,
        [](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
            if (!checkApiKey(request)) return;
            if (index == 0) request->_tempObject = reinterpret_cast<void*>(1);
            if (index + len != total) return; // 단편화 패킷 완결 대기

            JsonDocument v_inDoc;
            if (deserializeJson(v_inDoc, data, total)) {
                request->send(400, "application/json", "{\"error\":\"JSON parse error\"}");
                return;
            }

            if (v_inDoc["todayDate"].is<const char*>()) {
                CL_N10_NvsManager::resetAIDailyUsageIfNeeded(v_inDoc["todayDate"].as<const char*>());
            }

            uint32_t v_addSec  = v_inDoc["audioSec"] | 0;
            uint16_t v_addTurn = v_inDoc["turnCount"] | 0;
            uint32_t v_addCost = v_inDoc["costUsdX1000"] | 0;

            if (v_addSec > 0 || v_addTurn > 0 || v_addCost > 0) {
                CL_N10_NvsManager::addAIAudioUsage(v_addSec, v_addTurn, v_addCost);
            }

            ST_N10_AIDailyUsage_t v_usage = CL_N10_NvsManager::getAIDailyUsage();
            JsonDocument          v_outDoc;
            v_outDoc["resetDate"]       = v_usage.resetDate;
            v_outDoc["audioSec"]        = v_usage.audioSec;
            v_outDoc["turnCount"]       = v_usage.turnCount;
            v_outDoc["estCostUsdX1000"] = v_usage.estCostUsdX1000;
            v_outDoc["capSec"]          = G_W10_LIVE_DAILY_CAP_SEC;
            v_outDoc["remainingSec"] =
                (G_W10_LIVE_DAILY_CAP_SEC > v_usage.audioSec) ? (G_W10_LIVE_DAILY_CAP_SEC - v_usage.audioSec) : 0;
            v_outDoc["level"] =
                (v_usage.audioSec >= G_W10_LIVE_DAILY_CAP_SEC) ? "cap" : ((v_usage.audioSec >= 1500) ? "warn" : "normal");

            String v_out;
            serializeJson(v_outDoc, v_out);
            request->send(200, "application/json", v_out);
        });

    // ==================================================
    // 6. POST /api/v001/ai/cost-reset
    // ==================================================
    s_server->on(
        HTTP_API_AI_COST_RESET,
        HTTP_POST,
        [](AsyncWebServerRequest* request) {
            if (!checkApiKey(request)) return;
            CL_N10_NvsManager::forceResetAIDailyUsage("");
            request->send(200, "application/json", "{\"success\":true}");
        },
        nullptr,
        [](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
            if (!checkApiKey(request)) return;
            JsonDocument v_inDoc;
            deserializeJson(v_inDoc, data, len);
            const char* v_today = v_inDoc["todayDate"] | "";
            CL_N10_NvsManager::forceResetAIDailyUsage(v_today);
            request->send(200, "application/json", "{\"success\":true}");
        });

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] AI Live endpoints registered (token/func/config/cost/usage)");
}
