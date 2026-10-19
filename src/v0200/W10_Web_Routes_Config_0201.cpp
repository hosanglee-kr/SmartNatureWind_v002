/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_Config_0201.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Config Life Cycle)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeConfigDirtySave : GET  /api/v001/config
 *                          POST /api/v001/config/save
 *                          GET  /api/v001/config/dirty
 * - routeConfigInit      : POST /api/v001/config/init  (factoryReset + reboot)
 * - routeReload          : POST /api/v001/reload       (F-05 loopTask 위임)
 *
 * [E-2.2.4] W10_Web_Routes_0201.cpp에서 이관
 * ------------------------------------------------------
 */

#include "W10_Web_0201.h"

// --------------------------------------------------
// 1. /api/config, /config/save, /config/dirty
// --------------------------------------------------
void CL_W10_WebAPI::routeConfigDirtySave() {
    // GET /api/v001/config (전체 설정 조회)
    s_server->on(W10_Const::HTTP_API_CONFIG, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        CL_C10_ConfigManager::toJson_All(g_A20_config_root, v_doc);
        sendJson(p_request, v_doc);
    });

    // POST /api/v001/config/save
    s_server->on(W10_Const::HTTP_API_CONFIG_SAVE, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        bool v_ok = CL_C10_ConfigManager::saveDirtyConfigs();

        JsonDocument v_res;
        v_res["result"] = v_ok ? "saved" : "partial_failure";
        v_res["status"] = v_ok ? "clean" : "dirty";
        sendJson(p_request, v_res, v_ok ? 200 : 500);
    });

    // GET /api/v001/config/dirty
    s_server->on(W10_Const::HTTP_API_CONFIG_DIRTY, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        CL_C10_ConfigManager::getDirtyStatus(v_doc);
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 2. /api/config/init (factoryReset + reboot)
// --------------------------------------------------
void CL_W10_WebAPI::routeConfigInit() {
    s_server->on(W10_Const::HTTP_API_CONFIG_INIT, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[W10] Config Init requested via /api/config/init.");
        bool v_ok = CL_C10_ConfigManager::factoryResetFromDefault();

        JsonDocument v_doc;
        v_doc["factory"] = v_ok;
        sendJson(p_request, v_doc);

        if (v_ok) {
            delay(200);
            ESP.restart();
        }
    });
}

// --------------------------------------------------
// 3. /api/reload (F-05 loopTask 위임)
// --------------------------------------------------
void CL_W10_WebAPI::routeReload() {
    s_server->on(W10_Const::HTTP_API_RELOAD, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        // [F-05] Deferred reload: async_tcp → loopTask 위임
        if (!CL_CT10_ControlManager::requestReload()) {
            p_request->send(409, "application/json",
                            "{\"error\":\"reload already pending\"}");
            return;
        }

        JsonDocument v_res;
        v_res["result"] = "queued";
        v_res["note"]   = "reload executes on next loopTask cycle";
        sendJson(p_request, v_res, 202);
    });
}
