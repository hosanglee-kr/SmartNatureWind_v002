/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_Comfort_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Comfort & Recommendation)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeComfort : GET /api/v001/comfort
 *   - 일본 기상청 표준 DI(불쾌지수) 및 4단계 쾌적도 레벨 응답
 *   - 실시간 온·습도 센서 측정값 포함
 *   - 현재 기상 환경에 최적화된 추천 Preset/Style 및 매칭 Profile ID 반환
 *
 * [v0203 Stage 6 신규 모듈]
 * - ArduinoJson v7 단일 JsonDocument 규약 준수
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"
#include <math.h>

void CL_W10_WebAPI::routeComfort() {
    if (!s_server) return;

    // ======================================================
    // GET /api/v001/comfort
    // ======================================================
    s_server->on(W10_Const::HTTP_API_COMFORT, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        float v_di       = CL_CT10_ControlManager::getDiscomfortIndex();
        uint8_t v_level  = CL_CT10_ControlManager::getComfortLevel();
        float v_tempC    = CL_CT10_ControlManager::getCurrentTemperatureMock();
        float v_hum      = CL_CT10_ControlManager::getCurrentHumidityMock();

        JsonDocument v_doc;
        v_doc["di"]       = roundf(v_di * 10.0f) / 10.0f;
        v_doc["level"]    = v_level;
        v_doc["tempC"]    = roundf(v_tempC * 10.0f) / 10.0f;
        v_doc["humidity"] = roundf(v_hum * 10.0f) / 10.0f;

        const char* v_levelText = "쾌적";
        switch (v_level) {
            case 0: v_levelText = "쾌적"; break;
            case 1: v_levelText = "약간 덥네요"; break;
            case 2: v_levelText = "끈적이는 날씨"; break;
            case 3: v_levelText = "숨이 막혀요"; break;
            default: v_levelText = "쾌적"; break;
        }
        v_doc["levelText"] = v_levelText;

        JsonObject v_rec = v_doc["recommend"].to<JsonObject>();
        v_rec["profileId"]  = CL_CT10_ControlManager::getRecommendedProfileId();
        v_rec["presetCode"] = CL_CT10_ControlManager::getRecommendedPresetCode();
        v_rec["styleCode"]  = CL_CT10_ControlManager::getRecommendedStyleCode();

        sendJson(p_request, v_doc, 200);
    });
}

