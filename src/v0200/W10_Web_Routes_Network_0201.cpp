/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_Network_0201.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Network & Time & Firmware)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeWifiConfig    : GET/POST/PATCH /api/v001/wifi/config
 * - routeTimeSet       : POST /api/v001/system/time/set
 * - routeFirmwareCheck : GET  /api/v001/system/firmware/check
 *
 * [Batch B] SemVer 비교 (FW_VERSION_SEMVER 분리)
 * [Batch F-3] routeWifiConfig POST/PATCH 공통 헬퍼 추출
 * ------------------------------------------------------
 */

#include "W10_Web_0201.h"

// ======================================================
// [B] SemVer 비교 헬퍼 (x.y.z 형식)
//  - 반환: a < b → -1 / a == b → 0 / a > b → 1
//  - 파싱 실패 시 0 반환 (안전: 같음으로 판정 → "latest")
// ======================================================
static int _w10_compareSemVer(const char* p_a, const char* p_b) {
    if (!p_a || !p_b) return 0;

    int v_amaj = 0, v_amin = 0, v_apat = 0;
    int v_bmaj = 0, v_bmin = 0, v_bpat = 0;

    if (sscanf(p_a, "%d.%d.%d", &v_amaj, &v_amin, &v_apat) != 3) return 0;
    if (sscanf(p_b, "%d.%d.%d", &v_bmaj, &v_bmin, &v_bpat) != 3) return 0;

    if (v_amaj != v_bmaj) return (v_amaj < v_bmaj) ? -1 : 1;
    if (v_amin != v_bmin) return (v_amin < v_bmin) ? -1 : 1;
    if (v_apat != v_bpat) return (v_apat < v_bpat) ? -1 : 1;
    return 0;
}

// ======================================================
// [F-3] routeWifiConfig POST/PATCH 공통 헬퍼
// ======================================================
static void _routeWifiConfigPatchBody(AsyncWebServerRequest* p_request,
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
    if (g_A20_config_root.wifi) {
        v_changed = CL_C10_ConfigManager::patchWifiFromJson(*g_A20_config_root.wifi, v_doc);
    }

    JsonDocument v_res;
    v_res["updated"] = v_changed;

    if (v_changed) {
        CL_C10_ConfigManager::saveDirtyConfigs();

        auto v_req = CL_WF10_WiFiManager::requestReconnect();
        switch (v_req) {
            case CL_WF10_WiFiManager::EN_WF10_REQ_OK:
                v_res["status"] = "requested";
                break;
            case CL_WF10_WiFiManager::EN_WF10_REQ_COALESCED:
                v_res["status"] = "coalesced";
                break;
            case CL_WF10_WiFiManager::EN_WF10_REQ_FAILED:
            default:
                v_res["status"] = "task_failed";
                break;
        }
        v_res["need_reboot"] = false;
        v_res["note"]        = "WiFi reconnect signaled to background task";
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WiFi config saved, reconnect signaled to WiFi task.");
    } else {
        v_res["status"]      = "no_change";
        v_res["need_reboot"] = false;
    }

    CL_W10_WebAPI::sendJson(p_request, v_res);
}

// --------------------------------------------------
// 1. /api/wifi/config (GET/POST/PATCH)
// --------------------------------------------------
void CL_W10_WebAPI::routeWifiConfig() {
    // GET: 현재 설정 조회
    s_server->on(W10_Const::HTTP_API_WIFI_CONFIG, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.wifi) {
            CL_C10_ConfigManager::toJson_Wifi(*v_snap.wifi, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // [F-3] POST + PATCH 공통 헬퍼
    s_server->on(W10_Const::HTTP_API_WIFI_CONFIG, HTTP_POST,
                 [](AsyncWebServerRequest*) {}, nullptr, _routeWifiConfigPatchBody);
    s_server->on(W10_Const::HTTP_API_WIFI_CONFIG, HTTP_PATCH,
                 [](AsyncWebServerRequest*) {}, nullptr, _routeWifiConfigPatchBody);
}

// --------------------------------------------------
// 2. /api/system/time/set
// --------------------------------------------------
void CL_W10_WebAPI::routeTimeSet() {
    s_server->on(
        W10_Const::HTTP_API_TIME_SET,
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
            if (g_A20_config_root.system) {
                v_changed = CL_C10_ConfigManager::patchSystemFromJson(*g_A20_config_root.system, v_doc);
                if (v_changed) {
                    CL_W10_WebAPI::applySystemRuntimeFromConfig(*g_A20_config_root.system);
                }
            }

            JsonDocument v_res;
            v_res["updated"] = v_changed;

            if (v_changed && g_A20_config_root.system) {
                CL_C10_ConfigManager::saveDirtyConfigs();

                TM10_applyTimeConfigFromSystem(*g_A20_config_root.system);
                TM10_requestTimeSync();

                v_res["status"] = "applied";
                CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Time config updated and applied (TM10).");
            } else {
                v_res["status"] = "no_change";
            }

            sendJson(p_request, v_res);
        });
}

// --------------------------------------------------
// 3. /api/system/firmware/check
// --------------------------------------------------
void CL_W10_WebAPI::routeFirmwareCheck() {
    s_server->on(W10_Const::HTTP_API_FW_CHECK, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;

        // [B] SSOT: 표시용(FW_VERSION) / 비교용(FW_VERSION_SEMVER) 분리
        const char* v_current_version = A20_Const::FW_VERSION;
        const char* v_current_semver  = A20_Const::FW_VERSION_SEMVER;

        // TODO: 실제 OTA 서버 연동 시 서버 응답으로 대체
        const char* v_latest_semver   = "2.0.0";
        const char* v_latest_version  = "FW_Ver_2.0.0";

        v_doc["current_version"] = v_current_version;

        int v_cmp = _w10_compareSemVer(v_current_semver, v_latest_semver);
        if (v_cmp < 0) {
            v_doc["status"]         = "available";
            v_doc["latest_version"] = v_latest_version;
            v_doc["url"]            = "/api/v001/fwUpdate";
        } else {
            v_doc["status"]         = "latest";
            v_doc["latest_version"] = v_current_version;
        }

        sendJson(p_request, v_doc);
    });
}
