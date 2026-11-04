/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_Session_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Session)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeSession : /api/v001/session/*
 *   - POST /api/v001/session/start
 *   - POST /api/v001/session/pause
 *   - POST /api/v001/session/resume
 *   - POST /api/v001/session/stop
 *   - GET  /api/v001/session/current
 *
 * [v0203 Stage 3 신규 모듈]
 * - CL_CT10_ControlManager Session 생명주기 관리 인터페이스 연동
 * - ArduinoJson v7 단일 JsonDocument 규약 준수
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"

void CL_W10_WebAPI::routeSession() {
    if (!s_server) return;

    // ======================================================
    // 1. POST /api/v001/session/start
    // Body: { "type": "PLAYLIST"|"PRESET"|"FIXED", "trigger": "MANUAL", "payload": {...} }
    // ======================================================
    s_server->on(
        W10_Const::HTTP_API_SESSION_START,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) {},
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }
            if (p_index + p_len != p_total) return;

            JsonDocument v_doc;
            if (!parseJsonBody(p_request, p_data, p_len, v_doc)) {
                p_request->send(400, "application/json", "{\"error\":\"json parse error\"}");
                return;
            }

            const char*            v_typeStr = v_doc["type"] | "";
            EN_CT10_session_type_t v_type    = EN_CT10_SESSION_NONE;

            if (strcasecmp(v_typeStr, "PLAYLIST") == 0) {
                v_type = EN_CT10_SESSION_PLAYLIST;
            } else if (strcasecmp(v_typeStr, "PRESET") == 0) {
                v_type = EN_CT10_SESSION_PRESET;
            } else if (strcasecmp(v_typeStr, "FIXED") == 0) {
                v_type = EN_CT10_SESSION_FIXED;
            } else {
                JsonDocument v_err;
                v_err["error"] = "invalid_session_type";
                sendJson(p_request, v_err, 400);
                return;
            }

            const char*       v_triggerStr = v_doc["trigger"] | "MANUAL";
            EN_CT10_trigger_t v_trigger    = EN_CT10_TRIGGER_MANUAL;
            if (strcasecmp(v_triggerStr, "SCHEDULE") == 0) {
                v_trigger = EN_CT10_TRIGGER_SCHEDULE;
            }

            JsonObjectConst v_payload = v_doc["payload"].as<JsonObjectConst>();
            JsonDocument    v_payloadDoc;
            v_payloadDoc.set(v_payload);

            bool v_ok = CL_CT10_ControlManager::startSession(v_type, v_trigger, v_payloadDoc);

            JsonDocument v_res;
            v_res["ok"] = v_ok;
            if (v_ok) {
                v_res["result"] = "session_started";
                v_res["type"]   = v_typeStr;
                sendJson(p_request, v_res, 200);
                CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Session started: type=%s, trigger=%s", v_typeStr, v_triggerStr);
            } else {
                v_res["error"] = "start_failed";
                sendJson(p_request, v_res, 400);
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10] Session start failed for type=%s", v_typeStr);
            }
        });

    // ======================================================
    // 2. POST /api/v001/session/pause
    // ======================================================
    s_server->on(W10_Const::HTTP_API_SESSION_PAUSE, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        bool         v_ok = CL_CT10_ControlManager::pauseSession();
        JsonDocument v_res;
        v_res["ok"] = v_ok;
        if (v_ok) {
            v_res["result"] = "session_paused";
            sendJson(p_request, v_res, 200);
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Session paused");
        } else {
            v_res["error"] = "not_active_or_already_paused";
            sendJson(p_request, v_res, 400);
        }
    });

    // ======================================================
    // 3. POST /api/v001/session/resume
    // ======================================================
    s_server->on(W10_Const::HTTP_API_SESSION_RESUME, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        bool         v_ok = CL_CT10_ControlManager::resumeSession();
        JsonDocument v_res;
        v_res["ok"] = v_ok;
        if (v_ok) {
            v_res["result"] = "session_resumed";
            sendJson(p_request, v_res, 200);
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Session resumed");
        } else {
            v_res["error"] = "not_paused";
            sendJson(p_request, v_res, 400);
        }
    });

    // ======================================================
    // 4. POST /api/v001/session/stop
    // ======================================================
    s_server->on(W10_Const::HTTP_API_SESSION_STOP, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        bool         v_ok = CL_CT10_ControlManager::stopSession();
        JsonDocument v_res;
        v_res["ok"]     = v_ok;
        v_res["result"] = "session_stopped";
        sendJson(p_request, v_res, 200);
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Session stopped");
    });

    // ======================================================
    // 5. GET /api/v001/session/current
    // ======================================================
    s_server->on(W10_Const::HTTP_API_SESSION_CURRENT, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        auto         s = CL_CT10_ControlManager::getSessionSnapshot();
        JsonDocument v_res;

        v_res["active"]        = (s.state == EN_SESSION_ACTIVE || s.state == EN_SESSION_PAUSED);
        v_res["type"]          = (uint8_t)s.type;
        v_res["trigger"]       = (uint8_t)s.trigger;
        v_res["state"]         = (s.state == EN_SESSION_ACTIVE)  ? "ACTIVE"
                                 : (s.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                                  : "COMPLETED";
        v_res["pausedAccumMs"] = s.pausedAccumMs;

        if (s.type == EN_CT10_SESSION_PLAYLIST) {
            v_res["typeName"]    = "PLAYLIST";
            v_res["profileId"]   = s.payload.playlist.profileId;
            v_res["profileNo"]   = s.payload.playlist.profileNo;
            v_res["currentStep"] = s.payload.playlist.currentStepIdx + 1;
            v_res["totalSteps"]  = s.payload.playlist.totalSteps;
            v_res["loopCount"]   = s.payload.playlist.loopCount;
        } else if (s.type == EN_CT10_SESSION_PRESET) {
            v_res["typeName"]   = "PRESET";
            v_res["presetCode"] = s.payload.preset.presetCode;
            v_res["styleCode"]  = s.payload.preset.styleCode;
        } else if (s.type == EN_CT10_SESSION_FIXED) {
            v_res["typeName"] = "FIXED";
            v_res["percent"]  = s.payload.fixed.percent;
        } else {
            v_res["typeName"] = "NONE";
        }

        sendJson(p_request, v_res, 200);
    });

    // ======================================================
    // 6. POST /api/v001/session/schedule-override [Stage 5 신규]
    // ======================================================
    s_server->on(
        W10_Const::HTTP_API_SESSION_SCH_OVERRIDE,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) {},
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }
            if (p_index + p_len != p_total) return;

            JsonDocument v_in;
            if (!parseJsonBody(p_request, p_data, p_len, v_in)) {
                p_request->send(400, "application/json", "{\"error\":\"json parse error\"}");
                return;
            }

            bool v_override = v_in["override"] | false;
            CL_N10_NvsManager::setManualOvrSchedule(v_override);

            JsonDocument v_out;
            v_out["ok"] = true;
            v_out["override"] = v_override;
            sendJson(p_request, v_out, 200);
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Schedule override set: %d", v_override);
        });

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Session routes registered");
}
