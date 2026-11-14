/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_WindDict_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (WindDict)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeWindDict : GET /api/v001/windDict
 *   - Studio UI에서 10대 자연풍 프리셋 및 5대 스타일 factors 조회
 *   - ConfigManager 메모리 스냅샷 우선 직렬화, fallback으로 LittleFS 파일 서빙
 *
 * [v0203 Stage 4 신규 모듈]
 * - ArduinoJson v7 단일 JsonDocument 규약 준수
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"

void CL_W10_WebAPI::routeWindDict() {
    if (!s_server) return;

    // ======================================================
    // GET /api/v001/windDict
    // ======================================================
    s_server->on(W10_Const::HTTP_API_WIND_DICT, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        // 1) 메모리 캐시 스냅샷 확인
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);

        if (v_snap.windDict) {
            JsonDocument v_doc;
            CL_C10_ConfigManager::toJson_WindDict(*v_snap.windDict, v_doc);
            sendJson(p_request, v_doc, 200);
            return;
        }

        // 2) Fallback: LittleFS 직접 파일 서빙
        if (LittleFS.exists("/json/cfg_windDict_0203.json")) {
            File f = LittleFS.open("/json/cfg_windDict_0203.json", "r");
            if (f) {
                String content = f.readString();
                f.close();
                p_request->send(200, "application/json", content);
                return;
            }
        }

        p_request->send(404, "application/json", "{\"error\":\"windDict_not_found\"}");
    });

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WindDict routes registered");
}

