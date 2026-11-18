/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_Network_0203.cpp
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

#include "W10_Web_0203.h"

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
// [F-3][Stage 13 P0] routeWifiConfig POST/PATCH 공통 헬퍼
//  - CONTRACT §3.1 준수: async_tcp → getRootSnapshot 필수
//  - 단편화 body 누적 + 빈 body/다중 청크 보완
// ======================================================
static void _netOnReqEmptyCheck(AsyncWebServerRequest* p_request) {
    if (!CL_W10_WebAPI::requireApiKey(p_request)) return;
    if (p_request->contentLength() == 0) {
        p_request->send(400, "application/json", "{\"error\":\"empty body\"}");
    }
}

static bool _netAccumJson(AsyncWebServerRequest* p_request,
                          uint8_t*               p_data,
                          size_t                 p_len,
                          size_t                 p_index,
                          size_t                 p_total,
                          JsonDocument&          r_doc) {
    if (p_index == 0) {
        if (!CL_W10_WebAPI::requireApiKey(p_request)) return false;
        if (p_total == 0) {
            p_request->send(400, "application/json", "{\"error\":\"empty body\"}");
            return false;
        }
        if (p_total > (1024 * 1024)) {
            p_request->send(413, "application/json", "{\"error\":\"payload too large\"}");
            return false;
        }
        if (!CL_W10_WebAPI::beginBody(p_request, p_total)) {
            p_request->send(500, "application/json", "{\"error\":\"oom\"}");
            return false;
        }
    }
    if (!CL_W10_WebAPI::appendBody(p_request, p_data, p_len, p_index, p_total)) return false;

    size_t   v_bodyLen = 0;
    uint8_t* v_bodyBuf = CL_W10_WebAPI::takeBodyBuf(p_request, v_bodyLen);
    if (!v_bodyBuf) {
        CL_W10_WebAPI::freeBody(p_request);
        p_request->send(500, "application/json", "{\"error\":\"acc\"}");
        return false;
    }

    if (!CL_W10_WebAPI::parseJsonBody(p_request, v_bodyBuf, v_bodyLen, r_doc)) {
        CL_W10_WebAPI::freeBody(p_request);
        p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
        return false;
    }
    CL_W10_WebAPI::freeBody(p_request);
    return true;
}

static void _routeWifiConfigPatchBody(AsyncWebServerRequest* p_request,
                                      uint8_t* p_data, size_t p_len,
                                      size_t p_index, size_t p_total) {
    JsonDocument v_doc;
    if (!_netAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    bool v_changed = false;
    if (v_snap.wifi) {
        v_changed = CL_C10_ConfigManager::patchWifiFromJson(*v_snap.wifi, v_doc);
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
        if (!requireApiKey(p_request)) return;

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
                 _netOnReqEmptyCheck, nullptr, _routeWifiConfigPatchBody);
    s_server->on(W10_Const::HTTP_API_WIFI_CONFIG, HTTP_PATCH,
                 _netOnReqEmptyCheck, nullptr, _routeWifiConfigPatchBody);
}

// --------------------------------------------------
// 2. /api/system/time/set
// --------------------------------------------------
void CL_W10_WebAPI::routeTimeSet() {
    s_server->on(
        W10_Const::HTTP_API_TIME_SET,
        HTTP_POST,
        _netOnReqEmptyCheck,
        nullptr,
        [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
            JsonDocument v_doc;
            if (!_netAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

            ST_A20_ConfigRoot_t v_snap;
            CL_C10_ConfigManager::getRootSnapshot(v_snap);

            bool v_changed = false;
            if (v_snap.system) {
                v_changed = CL_C10_ConfigManager::patchSystemFromJson(*v_snap.system, v_doc);
                if (v_changed) {
                    CL_W10_WebAPI::applySystemRuntimeFromConfig(*v_snap.system);
                }
            }

            JsonDocument v_res;
            v_res["updated"] = v_changed;

            if (v_changed && v_snap.system) {
                CL_C10_ConfigManager::saveDirtyConfigs();

                TM10_applyTimeConfigFromSystem(*v_snap.system);
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
        if (!requireApiKey(p_request)) return;
        JsonDocument v_doc;

        // [B] SSOT: 표시용(FW_VERSION) / 비교용(FW_VERSION_SEMVER) 분리
        const char* v_current_version = A20_Const::FW_VERSION;
        const char* v_current_semver  = A20_Const::FW_VERSION_SEMVER;

        // TODO: 실제 OTA 서버 연동 시 서버 응답으로 대체
        const char* v_latest_semver   = "2.0.3";
        const char* v_latest_version  = "FW_Ver_2.0.3";

        v_doc["current_version"] = v_current_version;

        int v_cmp = _w10_compareSemVer(v_current_semver, v_latest_semver);
        if (v_cmp < 0) {
            v_doc["status"]         = "available";
            v_doc["latest_version"] = v_latest_version;
            v_doc["url"]            = W10_Const::HTTP_API_FW_UPDATE;
        } else {
            v_doc["status"]         = "latest";
            v_doc["latest_version"] = v_current_version;
        }

        sendJson(p_request, v_doc);
    });
}
