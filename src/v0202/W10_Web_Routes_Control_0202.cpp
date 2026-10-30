/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_Control_0202.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Control & Simulation)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeControl        : /api/v001/control/ * (profile, override, reboot, factoryReset)
 * - routeControlSummary : GET  /api/v001/control/summary
 * - routeSimulation     : GET/POST /api/v001/simulation
 * - routeSimState       : GET  /api/v001/sim/state
 * - routeMotionFeed     : POST /api/v001/motion/pir/feed
 *
 * [E-2.2.3] W10_Web_Routes_0202.cpp에서 이관
 * [A-2]    feedPIR / patchSimFromJson / exportSimJson 위임 경유
 * ------------------------------------------------------
 */

#include "W10_Web_0202.h"

// --------------------------------------------------
// 1. /api/control (프로필/오버라이드/리부트/팩토리리셋)
// --------------------------------------------------
void CL_W10_WebAPI::routeControl() {
    // profile/select
    s_server->on(
        W10_Const::HTTP_API_CTL_PROF_SEL,
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
                p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
                return;
            }

            int v_id = v_doc["id"] | -1;

            JsonDocument v_res;
            if (v_id > 0 && s_control && s_control->startUserProfileByNo((uint8_t)v_id)) {
                v_res["result"] = "profile_started";
                v_res["id"]     = v_id;
                sendJson(p_request, v_res, 200);
            } else {
                v_res["error"] = "invalid_profile_id";
                sendJson(p_request, v_res, 400);
            }
        });

    // reboot
    s_server->on(W10_Const::HTTP_API_CTL_REBOOT, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        p_request->send(200, "application/json", "{\"result\":\"rebooting\"}");
        delay(500);
        ESP.restart();
    });

    // factoryReset + reboot
    s_server->on(W10_Const::HTTP_API_CTL_FACTORY, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10] Factory Reset requested via %s", W10_Const::HTTP_API_CTL_FACTORY);
        bool v_ok = CL_C10_ConfigManager::factoryResetFromDefault();

        JsonDocument v_doc;
        v_doc["factory"] = v_ok;
        sendJson(p_request, v_doc);

        if (v_ok) {
            delay(500);
            ESP.restart();
        }
    });

    // profile/stop
    s_server->on(W10_Const::HTTP_API_CTL_PROF_STOP, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        if (!s_control) {
            p_request->send(500, "application/json", "{\"error\":\"control not ready\"}");
            return;
        }
        s_control->stopUserProfile();
        p_request->send(200, "application/json", "{\"result\":\"ok\"}");
    });

    // override/fixed
    s_server->on(W10_Const::HTTP_API_CTL_OVR_FIXED, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        if (!p_request->hasParam("percent", true)) {
            p_request->send(400, "application/json", "{\"error\":\"missing param: percent\"}");
            return;
        }

        float    v_pct = p_request->getParam("percent", true)->value().toFloat();
        uint32_t v_sec =
            p_request->hasParam("seconds", true) ? (uint32_t)p_request->getParam("seconds", true)->value().toInt() : 0;

        bool v_forever = false;
        if (p_request->hasParam("forever", true)) {
            String f = p_request->getParam("forever", true)->value();
            f.toLowerCase();
            v_forever = (f == "true" || f == "1");
        }

        if (s_control) {
            s_control->startOverrideFixed(v_pct, v_sec, v_forever);
        }
        p_request->send(200, "application/json", "{\"result\":\"ok\"}");
    });

    // override/preset (JSON Body)
    s_server->on(
        W10_Const::HTTP_API_CTL_OVR_PRESET,
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
                p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
                return;
            }

            const char* v_preset  = v_doc["presetCode"] | "";
            const char* v_style   = v_doc["styleCode"] | "BALANCE";
            uint32_t    v_sec     = v_doc["durationSec"] | 0;
            bool        v_forever = v_doc["forever"] | false;

            ST_A20_SegmentOverride_t v_ovr;
            memset(&v_ovr, 0, sizeof(v_ovr));
            v_ovr.windIntensity   = -1.0f;
            v_ovr.windVariability = -1.0f;
            v_ovr.gustFrequency   = -1.0f;

            if (v_doc["override"].is<JsonObject>()) {
                JsonObject v_o        = v_doc["override"];
                v_ovr.enabled         = v_o["enabled"] | true;
                v_ovr.windIntensity   = v_o["windIntensity"] | -1.0f;
                v_ovr.windVariability = v_o["windVariability"] | -1.0f;
                v_ovr.gustFrequency   = v_o["gustFrequency"] | -1.0f;
            }

            if (s_control) {
                s_control->startOverridePreset(v_preset, v_style, &v_ovr, v_sec, v_forever);
            }
            p_request->send(200, "application/json", "{\"result\":\"ok\"}");
        });

    // override/clear
    s_server->on(W10_Const::HTTP_API_CTL_OVR_CLEAR, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        if (s_control) {
            s_control->stopOverride();
        }
        p_request->send(200, "application/json", "{\"result\":\"ok\"}");
    });

    // [v0202] AUTOOFF_STOPPED 이벤트 ACK
    //  - 프론트엔드 "확인" 버튼 → s_control->ackEvent() (기존 CT10 API 재사용)
    //  - ackEventState()는 s_stateMutex 보유 후 _autoOffLatched=false 설정
    s_server->on(W10_Const::HTTP_API_CTL_ACK, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        if (s_control) {
            CL_CT10_ControlManager::ackEvent();
        }
        JsonDocument v_res;
        v_res["result"] = "ok";
        sendJson(p_request, v_res);
    });

    // [v0202] 작동 모드 조회 (GET /api/v001/control/mode)
    s_server->on(W10_Const::HTTP_API_CTL_MODE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        bool         v_profMode = s_control ? s_control->useProfileMode : false;
        JsonDocument v_res;
        v_res["profileMode"] = v_profMode;
        v_res["mode"]        = v_profMode ? "PROFILE" : "SCHEDULE";
        sendJson(p_request, v_res);
    });

    // [v0202] 작동 모드 전환 (POST /api/v001/control/mode)
    s_server->on(
        W10_Const::HTTP_API_CTL_MODE,
        HTTP_POST,
        [](AsyncWebServerRequest* p_request) {},
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }
            if (p_index + p_len != p_total) return;

            bool v_mode   = false;
            bool v_parsed = false;

            if (p_len > 0) {
                JsonDocument v_doc;
                if (parseJsonBody(p_request, p_data, p_len, v_doc)) {
                    if (v_doc["profileMode"].is<bool>()) {
                        v_mode   = v_doc["profileMode"].as<bool>();
                        v_parsed = true;
                    } else if (v_doc["mode"].is<const char*>()) {
                        const char* m = v_doc["mode"];
                        v_mode        = (strcasecmp(m, "profile") == 0 || strcasecmp(m, "user_profile") == 0);
                        v_parsed      = true;
                    }
                }
            }

            if (!v_parsed && p_request->hasParam("profileMode", true)) {
                String f = p_request->getParam("profileMode", true)->value();
                f.toLowerCase();
                v_mode   = (f == "true" || f == "1");
                v_parsed = true;
            }

            if (!v_parsed && p_request->hasParam("mode", true)) {
                String m = p_request->getParam("mode", true)->value();
                m.toLowerCase();
                v_mode   = (m == "profile" || m == "user_profile" || m == "true" || m == "1");
                v_parsed = true;
            }

            if (!v_parsed) {
                p_request->send(400, "application/json", "{\"error\":\"missing param: profileMode or mode\"}");
                return;
            }

            if (s_control) {
                CL_CT10_ControlManager::setMode(v_mode);
                CL_N10_NvsManager::setRunMode(v_mode ? 2 : 1, 2); // 1=SCHEDULE, 2=USER_PROFILE, source=WEB
            }

            JsonDocument v_res;
            v_res["result"]      = "ok";
            v_res["profileMode"] = v_mode;
            v_res["mode"]        = v_mode ? "PROFILE" : "SCHEDULE";
            sendJson(p_request, v_res);
        });
}

// --------------------------------------------------
// 2. /api/control/summary
// --------------------------------------------------
void CL_W10_WebAPI::routeControlSummary() {
    s_server->on(W10_Const::HTTP_API_CONTROL_SUMMARY, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        if (s_control) {
            s_control->exportSummaryJson(v_doc);
            JsonDocument v_metrics;
            s_control->exportMetricsJson(v_metrics);
            for (auto kv : v_metrics.as<JsonObject>()) {
                v_doc[kv.key()] = kv.value();
            }
        }
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 3. /api/simulation (GET/POST)
// --------------------------------------------------
void CL_W10_WebAPI::routeSimulation() {
    s_server->on(W10_Const::HTTP_API_SIMULATION, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        if (s_control) {
            s_control->exportSimJson(v_doc); // [A-2] 위임
        }
        sendJson(p_request, v_doc);
    });

    s_server->on(
        W10_Const::HTTP_API_SIMULATION,
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
                p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
                return;
            }

            bool v_changed = false;
            if (s_control) {
                v_changed = s_control->patchSimFromJson(v_doc); // [A-2] 위임
            }

            JsonDocument v_res;
            v_res["updated"] = v_changed;
            if (v_changed && s_control) {
                s_control->exportSimJson(v_res); // [Q8-A] 최종 확정값 반환
            }
            sendJson(p_request, v_res);
        });
}

// --------------------------------------------------
// 4. /api/sim/state
// --------------------------------------------------
void CL_W10_WebAPI::routeSimState() {
    s_server->on(W10_Const::HTTP_API_SIM_STATE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        if (s_control) {
            s_control->exportSimJson(v_doc); // [A-2] 위임

            JsonDocument v_summary;
            JsonDocument v_metrics;
            s_control->exportSummaryJson(v_summary);
            s_control->exportMetricsJson(v_metrics);

            for (auto kv : v_summary.as<JsonObject>()) v_doc[kv.key()] = kv.value();
            for (auto kv : v_metrics.as<JsonObject>()) v_doc[kv.key()] = kv.value();
        }
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 5. /api/motion/pir/feed
// --------------------------------------------------
void CL_W10_WebAPI::routeMotionFeed() {
    s_server->on(
        W10_Const::HTTP_API_FEED_PIR,
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
                p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
                return;
            }

            if (s_control) {
                bool v_pir = v_doc["pir"] | false;
                s_control->feedPIR(v_pir); // [A-2] 위임
            }

            JsonDocument v_res;
            v_res["fed"]  = true;
            v_res["type"] = "pir";
            sendJson(p_request, v_res);
        });
}

// [U-002] 차트 120초 이력 REST API
void CL_W10_WebAPI::routeChartHistory() {
    s_server->on(W10_Const::HTTP_API_CHART_HISTORY, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        if (!s_control) {
            p_request->send(500, "application/json", "{\"error\":\"control not ready\"}");
            return;
        }
        JsonDocument v_doc;
        s_control->exportChartJson(v_doc, /*p_diffOnly=*/false);
        sendJson(p_request, v_doc);
    });
}
