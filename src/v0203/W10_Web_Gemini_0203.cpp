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
#include <HTTPClient.h>
#include <esp_heap_caps.h>

// ------------------------------------------------------
// Gemini API 상수
// ------------------------------------------------------
#define G_W10_GEMINI_HOST          A20_Const::G_GEMINI_HOST
#define G_W10_GEMINI_PORT          A20_Const::G_GEMINI_PORT
#define G_W10_GEMINI_TIMEOUT       W10_AI_Limits::G_GEMINI_TIMEOUT_MS
#define G_W10_GEMINI_RATE_LIMIT_MS W10_AI_Limits::G_RATE_LIMIT_MS
#define G_W10_GEMINI_MAX_RESP      W10_AI_Limits::G_MAX_RESPONSE_BYTES

static unsigned long s_lastGeminiCallMs = 0;

// ------------------------------------------------------
// [0203_015] 비동기 AI 워커 (gemini_worker) 및 단일 Job 슬롯
// ------------------------------------------------------
enum EN_W10_AiJobState_t : uint8_t {
    EN_W10_AI_JOB_IDLE = 0,
    EN_W10_AI_JOB_RUNNING,
    EN_W10_AI_JOB_DONE,
    EN_W10_AI_JOB_ERROR
};

struct ST_W10_AiJobSlot_t {
    EN_W10_AiJobState_t state;
    char                jobId[32];
    unsigned long       enqueuedMs;
    unsigned long       finishedMs;
    int                 httpStatus;
    char*               reqBuf;
    size_t              reqLen;
    char*               respBuf;
    size_t              respLen;
};

static ST_W10_AiJobSlot_t s_aiJob        = {};
static SemaphoreHandle_t  s_aiJobMutex   = nullptr;
static TaskHandle_t       s_aiWorkerTask = nullptr;
static uint32_t           s_aiJobSeq     = 0;

/**
 * [스레드 안전성] static buffer 반환 — gemini_worker(T-ai) 단일 태스크 컨텍스트 전용.
 *  - 호출자는 반환 포인터를 "즉시 사용 후 폐기"해야 함
 *  - async_tcp 등 타 태스크에서 직접 호출 금지 (W10_callGeminiApi 내부 전용)
 */
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
// Gemini API 직접 호출 (HTTPS POST via HTTPClient)
// ------------------------------------------------------
static String W10_callGeminiApi(const char* p_body, size_t p_len, int& r_httpCode) {
    const char* v_apiKey = W10_getGeminiApiKey();
    if (!v_apiKey || v_apiKey[0] == '\0') {
        r_httpCode = 503;
        return "{\"error\":\"Gemini API key not configured\"}";
    }

    WiFiClientSecure v_client;
    // ======================================================
    // [결정사항 2-A] setInsecure 유지 + 문서화
    //  - 사유: LittleFS 공간 제약 + 인증서 갱신 주기 운영 부담
    //  - 위험: MITM 공격 시 Gemini API Key 탈취 가능
    //  - 완화:
    //    1) API Key를 URL이 아닌 헤더로 이동 (x-goog-api-key, 로그 노출 제거)
    //    2) 클라이언트는 사내 WiFi(AP 모드)만 사용 권장
    //    3) 향후 인증서 탑재 시 loadCACert()로 교체 예정
    // ======================================================
    v_client.setInsecure(); // [결정 2-A] 문서화된 예외
    v_client.setTimeout(G_W10_GEMINI_TIMEOUT / 1000);

    HTTPClient v_http;
    v_http.setTimeout(G_W10_GEMINI_TIMEOUT);

    // [신규 P0] API Key를 URL이 아닌 헤더로 (로그 노출 + MITM 위험 제거)
    String v_url = A20_Const::G_GEMINI_REST_URL;

    if (!v_http.begin(v_client, v_url)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][Gemini] HTTPClient begin failed");
        r_httpCode = 503;
        return "{\"error\":\"Gemini connection failed\"}";
    }

    v_http.addHeader("Content-Type", "application/json");
    v_http.addHeader("x-goog-api-key", v_apiKey);
    v_http.addHeader("Connection", "close");

    int v_code = v_http.POST((uint8_t*)p_body, p_len);
    r_httpCode = v_code;

    String v_resp;
    if (v_code > 0) {
        v_resp = v_http.getString();
        if (v_resp.length() > G_W10_GEMINI_MAX_RESP) {
            CL_D10_Logger::log(EN_L10_LOG_WARN,
                               "[W10][Gemini] Response size %u exceeds max %u",
                               (unsigned)v_resp.length(),
                               (unsigned)G_W10_GEMINI_MAX_RESP);
        }
    } else {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[W10][Gemini] HTTP POST failed: %s (code %d)",
                           v_http.errorToString(v_code).c_str(),
                           v_code);
        r_httpCode = 502;
        v_resp     = "{\"error\":\"Gemini HTTP failed\"}";
    }

    v_http.end();
    return v_resp;
}

// ------------------------------------------------------
// 2-turn Function Calling 자연어 제어 파이프라인 (gemini_worker 전용)
// ------------------------------------------------------
static void W10_appendHistoryAndMessage(JsonArray& p_contents, const JsonDocument& p_inDoc, const char* p_message) {
    if (p_inDoc["history"].is<JsonArray>()) {
        JsonArrayConst v_hist     = p_inDoc["history"].as<JsonArrayConst>();
        size_t         v_startIdx = (v_hist.size() > 6) ? (v_hist.size() - 6) : 0;
        for (size_t i = v_startIdx; i < v_hist.size(); ++i) {
            JsonObjectConst h      = v_hist[i];
            const char*     v_role = h["role"] | "user";
            const char*     v_text = h["text"] | "";
            if (v_text[0]) {
                JsonObject c = p_contents.add<JsonObject>();
                c["role"]    = (strcmp(v_role, "assistant") == 0) ? "model" : "user";
                c["parts"].to<JsonArray>().add<JsonObject>()["text"] = v_text;
            }
        }
    }
    JsonObject v_userCur                                         = p_contents.add<JsonObject>();
    v_userCur["role"]                                            = "user";
    v_userCur["parts"].to<JsonArray>().add<JsonObject>()["text"] = p_message;
}

static void handleNaturalLanguageTurnWorker(const JsonDocument& p_inDoc,
                                          String&             r_outJson,
                                          int&                r_outHttp,
                                          uint32_t&           r_turn1Ms,
                                          uint32_t&           r_actionMs,
                                          uint32_t&           r_turn2Ms) {
    const char* v_message = p_inDoc["message"] | "";
    const char* v_lang    = p_inDoc["lang"] | "ko";
    bool        v_voice   = p_inDoc["voiceMode"] | false;

    if (!v_message[0]) {
        r_outHttp = 400;
        r_outJson = "{\"error\":\"empty message\"}";
        return;
    }

    // ─── Turn 1 요청 조립 (직렬화 후 v_turn1Req 조기 해제로 TLS 힙 피크 최소화) ───
    String v_t1Body;
    {
        JsonDocument v_turn1Req;
        JsonObject   v_sys                                       = v_turn1Req["system_instruction"].to<JsonObject>();
        v_sys["parts"].to<JsonArray>().add<JsonObject>()["text"] = CT10_AI::buildAIPromptStrict(v_lang, v_voice);

        JsonArray  v_tools   = v_turn1Req["tools"].to<JsonArray>();
        JsonObject v_toolObj = v_tools.add<JsonObject>();
        JsonArray  v_decls   = v_toolObj["function_declarations"].to<JsonArray>();
        CT10_AI::appendAIFunctionDeclarations(v_decls);

        JsonArray v_contents = v_turn1Req["contents"].to<JsonArray>();
        W10_appendHistoryAndMessage(v_contents, p_inDoc, v_message);

        serializeJson(v_turn1Req, v_t1Body);
    }

    uint32_t v_t1Start  = millis();
    int      v_httpCode = 0;
    String   v_t1Resp   = W10_callGeminiApi(v_t1Body.c_str(), v_t1Body.length(), v_httpCode);
    v_t1Body            = String(); // 요청 바디 즉시 해제
    r_turn1Ms           = millis() - v_t1Start;

    if (v_httpCode != 200 || v_t1Resp.length() == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10][AI] Turn1 Gemini call failed (HTTP %d)", v_httpCode);
        JsonDocument v_err;
        v_err["ok"]          = false;
        v_err["error"]       = "gemini_failed";
        v_err["_speechHint"] = (strcmp(v_lang, "en") == 0) ? "AI service is currently unavailable."
                                                           : "AI 서비스 응답이 지연되고 있습니다.";
        v_err["_lang"]       = v_lang;
        r_outHttp            = 502;
        serializeJson(v_err, r_outJson);
        return;
    }

    // ─── Turn 1 응답 파싱 ───
    JsonDocument v_t1Doc;
    if (deserializeJson(v_t1Doc, v_t1Resp)) {
        r_outHttp = 502;
        r_outJson = "{\"error\":\"invalid upstream json\"}";
        return;
    }
    v_t1Resp = String(); // 원본 응답 문자열 조기 해제

    JsonObject v_candidate = v_t1Doc["candidates"][0].as<JsonObject>();
    JsonObject v_content   = v_candidate["content"].as<JsonObject>();
    JsonArray  v_parts     = v_content["parts"].as<JsonArray>();

    struct ST_FnCallItem {
        String       name;
        JsonDocument argsDoc;
        String       result;
    };
    std::vector<ST_FnCallItem> v_fnCalls;
    String                     v_textResponse;

    for (JsonObject p : v_parts) {
        if (p["functionCall"].is<JsonObject>()) {
            v_fnCalls.emplace_back();
            ST_FnCallItem& item = v_fnCalls.back();
            item.name           = p["functionCall"]["name"].as<String>();
            item.argsDoc.set(p["functionCall"]["args"]);
        } else if (p["text"].is<const char*>()) {
            v_textResponse += p["text"].as<const char*>();
        }
    }

    JsonDocument v_finalDoc;
    v_finalDoc["_lang"] = v_lang;

    // 도구 호출이 없는 일반 대화인 경우
    if (v_fnCalls.empty()) {
        v_finalDoc["ok"]          = true;
        v_finalDoc["text"]        = v_textResponse.length() > 0 ? v_textResponse : "명령을 이해했습니다.";
        v_finalDoc["_speechHint"] = v_finalDoc["text"];
        v_finalDoc["actions"].to<JsonArray>();
        r_outHttp = 200;
        serializeJson(v_finalDoc, r_outJson);
        return;
    }

    // ─── 도구 실행 (Turn 1 Function Calls — 다중 호출 순차 실행) ───
    uint32_t  v_actStart   = millis();
    JsonArray v_actionsArr = v_finalDoc["actions"].to<JsonArray>();
    bool      v_anyOk      = false;
    bool      v_needTurn2  = false;
    String    v_speechHint;

    for (auto& item : v_fnCalls) {
        JsonObjectConst v_argsConst = item.argsDoc.as<JsonObjectConst>();
        item.result                 = CT10_AI::executeAIAction(item.name.c_str(), v_argsConst);
        bool v_ok = (item.result == "ok" || item.result.startsWith("{") || item.result.startsWith("["));
        if (v_ok) v_anyOk = true;
        if (!v_ok || item.result.startsWith("{") || item.result.startsWith("[")) v_needTurn2 = true;

        JsonObject v_actObj = v_actionsArr.add<JsonObject>();
        v_actObj["name"]    = item.name;
        v_actObj["args"]    = v_argsConst;
        v_actObj["result"]  = item.result;

        if (v_speechHint.length() == 0) {
            v_speechHint = CT10_AI::buildSpeechHint(item.name.c_str(), v_argsConst, v_ok);
        }
    }
    r_actionMs = millis() - v_actStart;

    bool v_actionOk           = v_anyOk;
    v_finalDoc["_speechHint"] = v_speechHint;

    // ─── Turn 2 지연 생성 (Lazy Init: 조회/실패 시에만 조립 및 호출) ───
    String v_naturalText;
    if (v_needTurn2) {
        uint32_t v_t2Start = millis();
        String   v_t2Body;
        {
            JsonDocument v_turn2Req;
            JsonObject   v_t2Sys                                       = v_turn2Req["system_instruction"].to<JsonObject>();
            v_t2Sys["parts"].to<JsonArray>().add<JsonObject>()["text"] = CT10_AI::buildAIPromptStrict(v_lang, v_voice);

            JsonArray v_t2Contents = v_turn2Req["contents"].to<JsonArray>();
            W10_appendHistoryAndMessage(v_t2Contents, p_inDoc, v_message);
            v_t2Contents.add(v_content);

            JsonObject v_fnRespObj   = v_t2Contents.add<JsonObject>();
            v_fnRespObj["role"]      = "user";
            JsonArray v_fnRespParts  = v_fnRespObj["parts"].to<JsonArray>();
            for (const auto& item : v_fnCalls) {
                JsonObject v_fnPart        = v_fnRespParts.add<JsonObject>();
                JsonObject v_fr            = v_fnPart["functionResponse"].to<JsonObject>();
                v_fr["name"]               = item.name;
                v_fr["response"]["result"] = item.result;
            }
            serializeJson(v_turn2Req, v_t2Body);
        }

        int    v_t2Code = 0;
        String v_t2Resp = W10_callGeminiApi(v_t2Body.c_str(), v_t2Body.length(), v_t2Code);
        v_t2Body        = String();

        if (v_t2Code == 200 && v_t2Resp.length() > 0) {
            JsonDocument v_t2Doc;
            if (!deserializeJson(v_t2Doc, v_t2Resp)) {
                const char* v_txt = v_t2Doc["candidates"][0]["content"]["parts"][0]["text"] | "";
                if (v_txt[0]) v_naturalText = v_txt;
            }
        }
        r_turn2Ms = millis() - v_t2Start;
    }

    v_finalDoc["ok"]   = v_actionOk;
    v_finalDoc["text"] = (v_naturalText.length() > 0) ? v_naturalText : v_speechHint;

    // 세션 스냅샷 첨부 (type 숫자 및 typeName 문자열 모두 제공하여 FE와 100% 정합)
    ST_CT10_SessionContext_t v_curSession = CL_CT10_ControlManager::getSessionSnapshot();
    JsonObject               v_sess       = v_finalDoc["session"].to<JsonObject>();
    v_sess["type"]                        = (uint8_t)v_curSession.type;
    v_sess["typeName"]                    = (v_curSession.type == EN_CT10_SESSION_FIXED)      ? "FIXED"
                                            : (v_curSession.type == EN_CT10_SESSION_PRESET)   ? "PRESET"
                                            : (v_curSession.type == EN_CT10_SESSION_PLAYLIST) ? "PLAYLIST"
                                                                                              : "NONE";
    v_sess["state"]                       = (v_curSession.state == EN_SESSION_ACTIVE)   ? "ACTIVE"
                                            : (v_curSession.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                                                        : "COMPLETED";

    r_outHttp = 200;
    serializeJson(v_finalDoc, r_outJson);
}

static void W10_processSingleAiJob() {
    uint32_t v_startMs    = millis();
    uint32_t v_queueWait  = v_startMs - s_aiJob.enqueuedMs;
    uint32_t v_turn1Ms    = 0;
    uint32_t v_actionMs   = 0;
    uint32_t v_turn2Ms    = 0;
    int      v_outHttp    = 500;
    String   v_outJson;

    JsonDocument v_inDoc;
    auto         v_err = deserializeJson(v_inDoc, (const char*)s_aiJob.reqBuf, s_aiJob.reqLen);
    if (v_err) {
        v_outHttp = 400;
        v_outJson = "{\"error\":\"invalid JSON\"}";
    } else if (v_inDoc["message"].is<const char*>()) {
        handleNaturalLanguageTurnWorker(v_inDoc, v_outJson, v_outHttp, v_turn1Ms, v_actionMs, v_turn2Ms);
    } else {
        // 레거시 프록시 모드 (contents 직접 전달)
        uint32_t v_t1Start = millis();
        int      v_httpCode = 0;
        String   v_resp     = W10_callGeminiApi((const char*)s_aiJob.reqBuf, s_aiJob.reqLen, v_httpCode);
        v_turn1Ms           = millis() - v_t1Start;

        if (v_httpCode == 200) {
            v_outHttp = 200;
            v_outJson = v_resp;
        } else {
            JsonDocument v_errDoc;
            v_errDoc["error"]         = "upstream failed";
            v_errDoc["upstream_http"] = v_httpCode;
            if (v_resp.length() > 0) {
                v_errDoc["upstream_body"] = v_resp.substring(0, 200);
            }
            v_outHttp = 502;
            serializeJson(v_errDoc, v_outJson);
        }
    }

    if (s_aiJobMutex && xSemaphoreTake(s_aiJobMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        if (v_outJson.length() > W10_AI_Limits::G_MAX_JOB_RESP_BYTES) {
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10][AI] Response truncated (%u > %u)",
                               (unsigned)v_outJson.length(), (unsigned)W10_AI_Limits::G_MAX_JOB_RESP_BYTES);
            v_outHttp = 502;
            v_outJson = "{\"error\":\"response too large\"}";
        }
        strlcpy(s_aiJob.respBuf, v_outJson.c_str(), W10_AI_Limits::G_MAX_JOB_RESP_BYTES + 1);
        s_aiJob.respLen    = strlen(s_aiJob.respBuf);
        s_aiJob.httpStatus = v_outHttp;
        s_aiJob.finishedMs = millis();
        s_aiJob.state      = (v_outHttp == 200) ? EN_W10_AI_JOB_DONE : EN_W10_AI_JOB_ERROR;
        xSemaphoreGive(s_aiJobMutex);
    }

    uint32_t v_totalMs = millis() - v_startMs;
    UBaseType_t v_hwm  = uxTaskGetStackHighWaterMark(nullptr);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[AI_PROF] bodyLen=%u http=%d queueWaitMs=%lu turn1Ms=%lu actionMs=%lu turn2Ms=%lu totalMs=%lu stackHwm=%u",
                       (unsigned)s_aiJob.reqLen,
                       v_outHttp,
                       (unsigned long)v_queueWait,
                       (unsigned long)v_turn1Ms,
                       (unsigned long)v_actionMs,
                       (unsigned long)v_turn2Ms,
                       (unsigned long)v_totalMs,
                       (unsigned)v_hwm);
}

static void W10_aiWorkerTask(void* p_arg) {
    (void)p_arg;
    for (;;) {
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
        W10_processSingleAiJob();
    }
}

static bool W10_ensureAiWorker() {
    if (!s_aiJobMutex) {
        s_aiJobMutex = xSemaphoreCreateMutex();
        if (!s_aiJobMutex) return false;
    }
    if (!s_aiJob.reqBuf) {
        s_aiJob.reqBuf = (char*)heap_caps_malloc(W10_AI_Limits::G_MAX_REQUEST_BODY + 1, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
        if (!s_aiJob.reqBuf) {
            s_aiJob.reqBuf = (char*)malloc(W10_AI_Limits::G_MAX_REQUEST_BODY + 1);
        }
        if (!s_aiJob.reqBuf) return false;
        s_aiJob.reqBuf[0] = '\0';
    }
    if (!s_aiJob.respBuf) {
        s_aiJob.respBuf = (char*)heap_caps_malloc(W10_AI_Limits::G_MAX_JOB_RESP_BYTES + 1, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
        if (!s_aiJob.respBuf) {
            s_aiJob.respBuf = (char*)malloc(W10_AI_Limits::G_MAX_JOB_RESP_BYTES + 1);
        }
        if (!s_aiJob.respBuf) return false;
        s_aiJob.respBuf[0] = '\0';
    }
    if (!s_aiWorkerTask) {
        BaseType_t v_rc = xTaskCreatePinnedToCore(
            W10_aiWorkerTask,
            "gemini_worker",
            W10_AI_Limits::G_AI_WORKER_STACK_BYTES,
            nullptr,
            1,
            &s_aiWorkerTask,
            1);
        if (v_rc != pdPASS) {
            s_aiWorkerTask = nullptr;
            return false;
        }
    }
    return true;
}

// ------------------------------------------------------
// POST /api/v001/ai/gemini (202 비동기 접수) & GET ?jobId= (폴링)
// ------------------------------------------------------
void CL_W10_WebAPI::routeGeminiProxy() {
    W10_ensureAiWorker();

    s_server->on(
        W10_Const::HTTP_API_GEMINI_PROXY,
        HTTP_GET,
        [](AsyncWebServerRequest* p_request) {
            if (!requireApiKey(p_request)) return;
            if (!p_request->hasParam("jobId")) {
                p_request->send(400, "application/json", "{\"error\":\"missing jobId\"}");
                return;
            }
            String v_jobId = p_request->getParam("jobId")->value();
            if (!s_aiJobMutex || xSemaphoreTake(s_aiJobMutex, pdMS_TO_TICKS(100)) != pdTRUE) {
                p_request->send(503, "application/json", "{\"error\":\"busy\"}");
                return;
            }

            if (s_aiJob.state == EN_W10_AI_JOB_IDLE || strcmp(s_aiJob.jobId, v_jobId.c_str()) != 0) {
                xSemaphoreGive(s_aiJobMutex);
                p_request->send(404, "application/json", "{\"error\":\"job_not_found\"}");
                return;
            }
            if (s_aiJob.state == EN_W10_AI_JOB_RUNNING) {
                char v_pending[96];
                snprintf(v_pending, sizeof(v_pending), "{\"ok\":true,\"jobId\":\"%s\",\"status\":\"pending\"}", s_aiJob.jobId);
                xSemaphoreGive(s_aiJobMutex);
                p_request->send(202, "application/json", v_pending);
                return;
            }
            if (millis() - s_aiJob.finishedMs > W10_AI_Limits::G_AI_JOB_TTL_MS) {
                s_aiJob.state    = EN_W10_AI_JOB_IDLE;
                s_aiJob.jobId[0] = '\0';
                xSemaphoreGive(s_aiJobMutex);
                p_request->send(404, "application/json", "{\"error\":\"job_expired\"}");
                return;
            }

            int    v_httpStatus = s_aiJob.httpStatus;
            String v_respStr(s_aiJob.respBuf ? s_aiJob.respBuf : "{}");
            xSemaphoreGive(s_aiJobMutex);
            sendText(p_request, v_respStr, v_httpStatus, "application/json; charset=utf-8");
        });

    s_server->on(
        W10_Const::HTTP_API_GEMINI_PROXY,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) {
            if (!requireApiKey(p_request)) return;
            if (p_request->contentLength() == 0) {
                p_request->send(400, "application/json", "{\"error\":\"Empty body\"}");
            }
        },
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            // [신규 P0] 단편화 body 누적 (p_index==0에서 인증 + 크기 사전 검사)
            if (p_index == 0) {
                if (!requireApiKey(p_request)) return;
                if (p_total == 0) {
                    p_request->send(400, "application/json", "{\"error\":\"Empty body\"}");
                    return;
                }
                if (p_total > W10_AI_Limits::G_MAX_REQUEST_BODY) {
                    p_request->send(413, "application/json", "{\"error\":\"payload too large\"}");
                    return;
                }
                if (!beginBody(p_request, p_total)) {
                    p_request->send(500, "application/json", "{\"error\":\"oom\"}");
                    return;
                }
            }
            if (!appendBody(p_request, p_data, p_len, p_index, p_total)) return;

            size_t   v_bodyLen = 0;
            uint8_t* v_bodyBuf = takeBodyBuf(p_request, v_bodyLen);
            if (!v_bodyBuf) {
                freeBody(p_request);
                p_request->send(500, "application/json", "{\"error\":\"acc\"}");
                return;
            }

            // 레이트 리밋 검사 (W10_AI_Limits::G_RATE_LIMIT_MS)
            unsigned long v_now = millis();
            if (v_now - s_lastGeminiCallMs < G_W10_GEMINI_RATE_LIMIT_MS) {
                freeBody(p_request);
                p_request->send(429, "application/json", "{\"error\":\"rate limited, please wait a few seconds\"}");
                return;
            }

            if (!W10_ensureAiWorker()) {
                freeBody(p_request);
                p_request->send(503, "application/json", "{\"error\":\"ai_worker_unavailable\"}");
                return;
            }

            if (xSemaphoreTake(s_aiJobMutex, pdMS_TO_TICKS(100)) != pdTRUE) {
                freeBody(p_request);
                p_request->send(503, "application/json", "{\"error\":\"busy\"}");
                return;
            }

            if (s_aiJob.state == EN_W10_AI_JOB_RUNNING) {
                xSemaphoreGive(s_aiJobMutex);
                freeBody(p_request);
                p_request->send(429, "application/json", "{\"error\":\"ai_busy\"}");
                return;
            }

            memcpy(s_aiJob.reqBuf, v_bodyBuf, v_bodyLen);
            s_aiJob.reqBuf[v_bodyLen] = '\0';
            s_aiJob.reqLen            = v_bodyLen;
            s_aiJob.respBuf[0]        = '\0';
            s_aiJob.respLen           = 0;
            s_aiJob.enqueuedMs        = v_now;
            s_aiJob.finishedMs        = 0;
            s_aiJob.httpStatus        = 202;
            s_aiJob.state             = EN_W10_AI_JOB_RUNNING;
            snprintf(s_aiJob.jobId, sizeof(s_aiJob.jobId), "ai_%lu_%lu", v_now, (unsigned long)(++s_aiJobSeq));
            s_lastGeminiCallMs = v_now;

            char v_accepted[96];
            snprintf(v_accepted, sizeof(v_accepted), "{\"ok\":true,\"jobId\":\"%s\",\"status\":\"pending\"}", s_aiJob.jobId);
            xSemaphoreGive(s_aiJobMutex);

            freeBody(p_request);
            xTaskNotifyGive(s_aiWorkerTask);
            p_request->send(202, "application/json", v_accepted);
        });
}

// ------------------------------------------------------
// POST /api/v001/ai/execute-action (단일 도구 직접 실행 브리지)
// ------------------------------------------------------
void CL_W10_WebAPI::routeAIExecuteAction() {
    s_server->on(
        W10_Const::HTTP_API_GEMINI_EXECUTE,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) {
            if (!requireApiKey(p_request)) return;
            if (p_request->contentLength() == 0) {
                p_request->send(400, "application/json", "{\"error\":\"Empty body\"}");
            }
        },
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (p_index == 0) {
                if (!requireApiKey(p_request)) return;
                if (p_total == 0) {
                    p_request->send(400, "application/json", "{\"error\":\"Empty body\"}");
                    return;
                }
                if (p_total > W10_AI_Limits::G_MAX_REQUEST_BODY) {
                    p_request->send(413, "application/json", "{\"error\":\"payload too large\"}");
                    return;
                }
                if (!beginBody(p_request, p_total)) {
                    p_request->send(500, "application/json", "{\"error\":\"oom\"}");
                    return;
                }
            }
            if (!appendBody(p_request, p_data, p_len, p_index, p_total)) return;

            size_t   v_bodyLen = 0;
            uint8_t* v_bodyBuf = takeBodyBuf(p_request, v_bodyLen);
            if (!v_bodyBuf) {
                freeBody(p_request);
                p_request->send(500, "application/json", "{\"error\":\"acc\"}");
                return;
            }

            JsonDocument v_in;
            if (deserializeJson(v_in, (const char*)v_bodyBuf, v_bodyLen)) {
                freeBody(p_request);
                p_request->send(400, "application/json", "{\"error\":\"invalid JSON\"}");
                return;
            }

            const char*     v_name = v_in["name"] | "";
            JsonObjectConst v_args = v_in["args"].as<JsonObjectConst>();

            String v_res = CT10_AI::executeAIAction(v_name, v_args);
            bool   v_ok  = (v_res == "ok" || v_res.startsWith("{"));
            freeBody(p_request);

            JsonDocument v_out;
            v_out["ok"]          = v_ok;
            v_out["name"]        = v_name;
            v_out["result"]      = v_res;
            v_out["_speechHint"] = CT10_AI::buildSpeechHint(v_name, v_args, v_ok);

            // [신규 P1] 세션 계약 통일 (routeGeminiProxy와 동일: type=숫자 + typeName=문자열)
            ST_CT10_SessionContext_t v_s    = CL_CT10_ControlManager::getSessionSnapshot();
            JsonObject               v_sess = v_out["session"].to<JsonObject>();
            v_sess["type"]                  = (uint8_t)v_s.type;
            v_sess["typeName"]              = (v_s.type == EN_CT10_SESSION_FIXED)      ? "FIXED"
                                              : (v_s.type == EN_CT10_SESSION_PRESET)   ? "PRESET"
                                              : (v_s.type == EN_CT10_SESSION_PLAYLIST) ? "PLAYLIST"
                                                                                       : "NONE";
            v_sess["state"]                 = (v_s.state == EN_SESSION_ACTIVE)   ? "ACTIVE"
                                              : (v_s.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                                                 : "COMPLETED";

            CL_W10_WebAPI::sendJson(p_request, v_out, 200);
        });
}
