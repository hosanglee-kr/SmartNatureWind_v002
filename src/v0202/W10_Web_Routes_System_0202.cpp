/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_System_0202.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (System & Status)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeVersion    : GET  /api/v001/version
 * - routeState      : GET  /api/v001/state
 * - routeSystem     : GET/POST/PATCH /api/v001/system
 * - routeMotion     : GET/POST/PATCH /api/v001/motion
 * - routeDiag       : GET  /api/v001/diag
 * - routeMetrics    : GET  /api/v001/metrics
 * - routeLogs       : GET  /api/v001/logs
 * - routeAuthTest   : GET  /api/v001/auth/test
 * - routeScan       : GET  /api/v001/wifi/scan
 * - routeWifiState  : GET  /api/v001/wifi/state
 *
 * [Batch A-2] routeMotion: s_control->requestMotionSimApply() 위임
 * [Batch F-2] routeSystem POST/PATCH 공통 헬퍼 추출
 * ------------------------------------------------------
 */

#include "W10_Web_0202.h"

// ======================================================
// [F-2] routeSystem POST/PATCH 공통 헬퍼
//  - 중복 람다 본문 1개로 통합
//  - public 정적 메서드(checkApiKey/parseJsonBody/sendJson)만 참조
// ======================================================
static void _routeSystemPatchBody(AsyncWebServerRequest* p_request,
                                  uint8_t* p_data, size_t p_len,
                                  size_t p_index, size_t p_total) {
    if (!CL_W10_WebAPI::checkApiKey(p_request)) {
        p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
        return;
    }
    if (p_index + p_len != p_total) return;

    JsonDocument v_doc;
    if (!CL_W10_WebAPI::parseJsonBody(p_request, p_data, p_len, v_doc)) {
        p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
        return;
    }

    bool v_changed = false;
    if (g_A20_config_root.system) {
        v_changed = CL_C10_ConfigManager::patchSystemFromJson(*g_A20_config_root.system, v_doc);
        if (v_changed) {
            CL_W10_WebAPI::applySystemRuntimeFromConfig(*g_A20_config_root.system);
        }
    }

    JsonDocument v_res;
    v_res["updated"] = v_changed;
    CL_W10_WebAPI::sendJson(p_request, v_res);
}

// --------------------------------------------------
// 1. /api/version
// --------------------------------------------------
void CL_W10_WebAPI::routeVersion() {
    s_server->on(W10_Const::HTTP_API_VERSION, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        v_doc["module"] = "SmartNatureWind";
        v_doc["fw"]     = A20_Const::FW_VERSION;

        v_doc["control"] = A20_Const::VER_CONTROL;
        v_doc["config"]  = A20_Const::VER_CONFIG;
        v_doc["api"]     = A20_Const::VER_API;
        v_doc["simul"]   = A20_Const::VER_SIMUL;

        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 2. /api/state
// --------------------------------------------------
void CL_W10_WebAPI::routeState() {
    s_server->on(W10_Const::HTTP_API_STATE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        if (!s_control) {
            p_request->send(500, "application/json", "{\"error\":\"control not ready\"}");
            return;
        }

        JsonDocument v_doc;
        s_control->exportStateJson_v02(v_doc);
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 3. /api/system (시스템 설정 GET/POST/PATCH)
// --------------------------------------------------
void CL_W10_WebAPI::routeSystem() {
    // GET
    s_server->on(W10_Const::HTTP_API_SYSTEM, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.system) {
            CL_C10_ConfigManager::toJson_System(*v_snap.system, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // [F-2] POST + PATCH 공통 헬퍼
    s_server->on(W10_Const::HTTP_API_SYSTEM, HTTP_POST,
                 [](AsyncWebServerRequest*) {}, nullptr, _routeSystemPatchBody);
    s_server->on(W10_Const::HTTP_API_SYSTEM, HTTP_PATCH,
                 [](AsyncWebServerRequest*) {}, nullptr, _routeSystemPatchBody);
}

// ======================================================
// [B-6] routeMotion POST/PATCH 공통 헬퍼
// ======================================================
static void _routeMotionPatchBody(AsyncWebServerRequest* p_request,
                                  uint8_t* p_data, size_t p_len,
                                  size_t p_index, size_t p_total) {
    if (!CL_W10_WebAPI::checkApiKey(p_request)) {
        p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
        return;
    }
    if (p_index + p_len != p_total) return;

    JsonDocument v_doc;
    if (!CL_W10_WebAPI::parseJsonBody(p_request, p_data, p_len, v_doc)) {
        p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
        return;
    }

    // [B-2] async_tcp → 스냅샷 필수
    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    bool v_changed = false;
    if (v_snap.motion) {
        v_changed = CL_C10_ConfigManager::patchMotionFromJson(*v_snap.motion, v_doc);
        if (v_changed) {
            CL_CT10_ControlManager::instance().requestMotionSimApply();
        }
    }

    JsonDocument v_res;
    v_res["updated"] = v_changed;
    CL_W10_WebAPI::sendJson(p_request, v_res);
}

// --------------------------------------------------
// 4. /api/v001/motion (GET/POST/PATCH)
// --------------------------------------------------
void CL_W10_WebAPI::routeMotion() {
    // GET
    s_server->on(W10_Const::HTTP_API_MOTION, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.motion) {
            CL_C10_ConfigManager::toJson_Motion(*v_snap.motion, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // [B-6] POST + PATCH 공통 헬퍼 (60→1)
    s_server->on(W10_Const::HTTP_API_MOTION, HTTP_POST,
                 [](AsyncWebServerRequest*) {}, nullptr, _routeMotionPatchBody);
    s_server->on(W10_Const::HTTP_API_MOTION, HTTP_PATCH,
                 [](AsyncWebServerRequest*) {}, nullptr, _routeMotionPatchBody);
}


// --------------------------------------------------
// 5. /api/diag
// --------------------------------------------------
void CL_W10_WebAPI::routeDiag() {
    s_server->on(W10_Const::HTTP_API_DIAG, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        v_doc["heap"]     = ESP.getFreeHeap();
        v_doc["fs_used"]  = LittleFS.usedBytes();
        v_doc["fs_total"] = LittleFS.totalBytes();
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 6. /api/metrics
// --------------------------------------------------
void CL_W10_WebAPI::routeMetrics() {
    s_server->on(W10_Const::HTTP_API_METRICS, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        if (s_control) {
            JsonDocument v_doc;
            s_control->exportMetricsJson(v_doc);
            sendJson(p_request, v_doc);
        }
    });
}

// --------------------------------------------------
// 7. /api/logs
// --------------------------------------------------
void CL_W10_WebAPI::routeLogs() {
    s_server->on(W10_Const::HTTP_API_LOGS, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        CL_D10_Logger::getLogsAsJson(v_doc);
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 8. /api/auth/test
// --------------------------------------------------
void CL_W10_WebAPI::routeAuthTest() {
    s_server->on(W10_Const::HTTP_API_AUTH_TEST, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"result\":\"unauthorized\"}");
            return;
        }
        p_request->send(200, "application/json", "{\"result\":\"authorized\"}");
    });
}

// --------------------------------------------------
// 9. /api/wifi/scan
// --------------------------------------------------
void CL_W10_WebAPI::routeScan() {
    s_server->on(W10_Const::HTTP_API_WIFI_SCAN, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        CL_WF10_WiFiManager::scanNetworksToJson(v_doc);
        sendJson(p_request, v_doc);
    });
}

// --------------------------------------------------
// 10. /api/wifi/state
// --------------------------------------------------
void CL_W10_WebAPI::routeWifiState() {
    s_server->on(W10_Const::HTTP_API_WIFI_STATE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        CL_WF10_WiFiManager::getWifiStateJson(v_doc);
        sendJson(p_request, v_doc);
    });
}
