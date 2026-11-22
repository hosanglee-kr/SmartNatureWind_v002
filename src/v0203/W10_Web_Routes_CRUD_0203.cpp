/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_CRUD_0203.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Resource CRUD)
 * ------------------------------------------------------
 * 기능 요약:
 * - routeWindProfile        : GET/POST   /api/v001/windProfile
 * - routeWindProfileID      : PUT/DELETE /api/v001/windProfile/{id}
 * - routeSchedules          : GET/POST   /api/v001/schedules
 * - routeSchedulesID        : PUT/DELETE /api/v001/schedules/{id}
 * - routeUserProfiles       : GET/POST   /api/v001/user_profiles
 * - routeUserProfilesID     : PUT/DELETE /api/v001/user_profiles/{id}
 * - routeUserProfilesPatch  : POST       /api/v001/user_profiles/patch
 *
 * [E-2.2.6] W10_Web_Routes_0203.cpp에서 이관
 * ------------------------------------------------------
 */

#include "W10_Web_0203.h"

// ======================================================
// [Stage 13 P0] CRUD URL 끝 /{id} 파싱 헬퍼
//  - ESPAsyncWebServer 기본 매처(BackwardCompatible)는 /:id 미지원
//  - 베이스 경로(/api/v001/{resource}) prefix 매칭 + URL tail 숫자 ID 추출
// ======================================================
static bool _crudExtractTailId(AsyncWebServerRequest* p_request, const char* p_prefix, int& r_id) {
    if (!p_request || !p_prefix) return false;
    if (p_request->hasParam("id")) {
        r_id = p_request->getParam("id")->value().toInt();
        return r_id > 0;
    }
    const String& v_url  = p_request->url();
    const size_t  v_plen = strlen(p_prefix);
    if (v_url.length() <= v_plen + 1 || v_url.charAt(v_plen) != '/') return false;
    String v_tail = v_url.substring(v_plen + 1);
    if (v_tail.length() == 0 || v_tail.indexOf('/') >= 0) return false;
    for (size_t i = 0; i < v_tail.length(); i++) {
        if (!isDigit((unsigned char)v_tail.charAt(i))) return false;
    }
    r_id = v_tail.toInt();
    return r_id > 0;
}

// ======================================================
// [Stage 13 P0] CRUD 공통 빈 body(onRequest) + 단편화 JSON 누적(onBody) 헬퍼
// ======================================================
static void _crudOnReqEmptyCheck(AsyncWebServerRequest* p_request) {
    if (!CL_W10_WebAPI::requireApiKey(p_request)) return;
    if (p_request->contentLength() == 0) {
        p_request->send(400, "application/json", "{\"error\":\"empty body\"}");
    }
}

static bool _crudAccumJson(
    AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total, JsonDocument& r_doc) {
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

// --------------------------------------------------
// 1. /api/windProfile (GET/POST)
// --------------------------------------------------
void CL_W10_WebAPI::routeWindProfile() {
    // GET: 전체 목록
    s_server->on(W10_Const::HTTP_API_WIND_PROFILE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!requireApiKey(p_request)) return;

        // [B-9] FS 재로드 → getRootSnapshot (메모리 캐시) 사용
        //  - 이전: static 공유 버퍼 + 매 요청 LittleFS read(~50-100ms)
        //         + 동시 요청 race + 다른 GET 라우트와 불일치
        //  - 이후: 원자 스냅샷 + O(1) 메모리 접근
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);

        JsonDocument v_doc;
        if (v_snap.windDict) {
            CL_C10_ConfigManager::toJson_WindDict(*v_snap.windDict, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // POST: 신규 생성
    s_server->on(W10_Const::HTTP_API_WIND_PROFILE,
                 HTTP_POST,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     int v_new_id = CL_C10_ConfigManager::addWindProfileFromJson(v_doc);

                     JsonDocument v_res;
                     if (v_new_id > 0) {
                         v_res["result"] = "created";
                         v_res["id"]     = v_new_id;

                         CL_C10_ConfigManager::saveDirtyConfigs();
                         sendJson(p_request, v_res, 201);
                     } else {
                         v_res["error"] = "creation failed or validation error";
                         sendJson(p_request, v_res, 400);
                     }
                 });
}

// --------------------------------------------------
// 2. /api/windProfile/{id} (PUT/DELETE)
// --------------------------------------------------
void CL_W10_WebAPI::routeWindProfileID() {
    // PUT
    s_server->on(W10_Const::HTTP_API_WIND_PROFILE,
                 HTTP_PUT,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     int v_id = 0;
                     if (!_crudExtractTailId(p_request, W10_Const::HTTP_API_WIND_PROFILE, v_id)) {
                         p_request->send(400, "application/json", "{\"error\":\"missing id\"}");
                         return;
                     }

                     bool v_updated = CL_C10_ConfigManager::updateWindProfileFromJson((uint16_t)v_id, v_doc);

                     JsonDocument v_res;
                     v_res["updated"] = v_updated;
                     if (v_updated) {
                         CL_C10_ConfigManager::saveDirtyConfigs();
                     }
                     sendJson(p_request, v_res, v_updated ? 200 : 404);
                 });

    // DELETE
    s_server->on(W10_Const::HTTP_API_WIND_PROFILE, HTTP_DELETE, [](AsyncWebServerRequest* p_request) {
        if (!requireApiKey(p_request)) return;
        int v_id = 0;
        if (!_crudExtractTailId(p_request, W10_Const::HTTP_API_WIND_PROFILE, v_id)) {
            p_request->send(400, "application/json", "{\"error\":\"missing id\"}");
            return;
        }
        bool v_deleted = CL_C10_ConfigManager::deleteWindProfile((uint16_t)v_id);

        JsonDocument v_res;
        v_res["deleted"] = v_deleted;
        if (v_deleted) {
            CL_C10_ConfigManager::saveDirtyConfigs();
        }
        sendJson(p_request, v_res, v_deleted ? 200 : 404);
    });
}

// --------------------------------------------------
// 3. /api/schedules (GET/POST)
// --------------------------------------------------
void CL_W10_WebAPI::routeSchedules() {
    // GET
    s_server->on(W10_Const::HTTP_API_SCHEDULES, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!requireApiKey(p_request)) return;

        JsonDocument        v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.schedules) {
            CL_C10_ConfigManager::toJson_Schedules(*v_snap.schedules, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // POST: 신규 생성
    s_server->on(W10_Const::HTTP_API_SCHEDULES,
                 HTTP_POST,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     int v_new_id = CL_C10_ConfigManager::addScheduleFromJson(v_doc);

                     JsonDocument v_res;
                     if (v_new_id > 0) {
                         v_res["result"] = "created";
                         v_res["id"]     = v_new_id;
                         CL_C10_ConfigManager::saveDirtyConfigs();
                         sendJson(p_request, v_res, 201);
                     } else {
                         v_res["error"] = "creation failed or validation error";
                         sendJson(p_request, v_res, 400);
                     }
                 });
}

// --------------------------------------------------
// 4. /api/schedules/{id} (PUT/DELETE)
// --------------------------------------------------
void CL_W10_WebAPI::routeSchedulesID() {
    // PUT
    s_server->on(W10_Const::HTTP_API_SCHEDULES,
                 HTTP_PUT,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     int v_id = 0;
                     if (!_crudExtractTailId(p_request, W10_Const::HTTP_API_SCHEDULES, v_id)) {
                         p_request->send(400, "application/json", "{\"error\":\"missing id\"}");
                         return;
                     }

                     bool v_updated = CL_C10_ConfigManager::updateScheduleFromJson((uint16_t)v_id, v_doc);

                     JsonDocument v_res;
                     v_res["updated"] = v_updated;
                     if (v_updated) {
                         CL_C10_ConfigManager::saveDirtyConfigs();
                     }
                     sendJson(p_request, v_res, v_updated ? 200 : 404);
                 });

    // DELETE
    s_server->on(W10_Const::HTTP_API_SCHEDULES, HTTP_DELETE, [](AsyncWebServerRequest* p_request) {
        if (!requireApiKey(p_request)) return;
        int v_id = 0;
        if (!_crudExtractTailId(p_request, W10_Const::HTTP_API_SCHEDULES, v_id)) {
            p_request->send(400, "application/json", "{\"error\":\"missing id\"}");
            return;
        }
        bool v_deleted = CL_C10_ConfigManager::deleteSchedule((uint16_t)v_id);

        JsonDocument v_res;
        v_res["deleted"] = v_deleted;
        if (v_deleted) {
            CL_C10_ConfigManager::saveDirtyConfigs();
        }
        sendJson(p_request, v_res, v_deleted ? 200 : 404);
    });
}

// --------------------------------------------------
// 5. /api/user_profiles (GET/POST)
// --------------------------------------------------
void CL_W10_WebAPI::routeUserProfiles() {
    // GET
    s_server->on(W10_Const::HTTP_API_USER_PROFILES, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!requireApiKey(p_request)) return;

        JsonDocument        v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.userProfiles) {
            CL_C10_ConfigManager::toJson_UserProfiles(*v_snap.userProfiles, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // POST: 신규 생성
    s_server->on(W10_Const::HTTP_API_USER_PROFILES,
                 HTTP_POST,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     int v_new_id = CL_C10_ConfigManager::addUserProfilesFromJson(v_doc);

                     JsonDocument v_res;
                     if (v_new_id > 0) {
                         v_res["result"] = "created";
                         v_res["id"]     = v_new_id;
                         CL_C10_ConfigManager::saveDirtyConfigs();
                         sendJson(p_request, v_res, 201);
                     } else {
                         v_res["error"] = "creation failed or validation error";
                         sendJson(p_request, v_res, 400);
                     }
                 });
}

// --------------------------------------------------
// 6. /api/user_profiles/{id} (PUT/DELETE)
// --------------------------------------------------
void CL_W10_WebAPI::routeUserProfilesID() {
    // PUT
    s_server->on(W10_Const::HTTP_API_USER_PROFILES,
                 HTTP_PUT,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     int v_id = 0;
                     if (!_crudExtractTailId(p_request, W10_Const::HTTP_API_USER_PROFILES, v_id)) {
                         p_request->send(400, "application/json", "{\"error\":\"missing id\"}");
                         return;
                     }

                     bool v_updated = CL_C10_ConfigManager::updateUserProfilesFromJson((uint16_t)v_id, v_doc);

                     JsonDocument v_res;
                     v_res["updated"] = v_updated;
                     if (v_updated) {
                         CL_C10_ConfigManager::saveDirtyConfigs();
                     }
                     sendJson(p_request, v_res, v_updated ? 200 : 404);
                 });

    // DELETE
    s_server->on(W10_Const::HTTP_API_USER_PROFILES, HTTP_DELETE, [](AsyncWebServerRequest* p_request) {
        if (!requireApiKey(p_request)) return;
        int v_id = 0;
        if (!_crudExtractTailId(p_request, W10_Const::HTTP_API_USER_PROFILES, v_id)) {
            p_request->send(400, "application/json", "{\"error\":\"missing id\"}");
            return;
        }
        bool v_deleted = CL_C10_ConfigManager::deleteUserProfiles((uint16_t)v_id);

        JsonDocument v_res;
        v_res["deleted"] = v_deleted;
        if (v_deleted) {
            CL_C10_ConfigManager::saveDirtyConfigs();
        }
        sendJson(p_request, v_res, v_deleted ? 200 : 404);
    });
}

// --------------------------------------------------
// 7. /api/user_profiles/patch (배치 패치)
// --------------------------------------------------
void CL_W10_WebAPI::routeUserProfilesPatch() {
    s_server->on(W10_Const::HTTP_API_USER_PROFILES_PATCH,
                 HTTP_POST,
                 _crudOnReqEmptyCheck,
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     JsonDocument v_doc;
                     if (!_crudAccumJson(p_request, p_data, p_len, p_index, p_total, v_doc)) return;

                     // [B-2] async_tcp → getRootSnapshot 필수 (CONTRACT §3.1)
                     ST_A20_ConfigRoot_t v_snap;
                     CL_C10_ConfigManager::getRootSnapshot(v_snap);

                     bool v_changed = false;
                     if (v_snap.userProfiles) {
                         v_changed = CL_C10_ConfigManager::patchUserProfilesFromJson(*v_snap.userProfiles, v_doc);
                     }

                     if (v_changed) {
                         CL_C10_ConfigManager::saveDirtyConfigs();
                     }

                     JsonDocument v_res;
                     v_res["updated"] = v_changed;
                     sendJson(p_request, v_res);
                 });
}
