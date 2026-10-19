/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_CRUD_0201.cpp
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
 * [E-2.2.6] W10_Web_Routes_0201.cpp에서 이관
 * ------------------------------------------------------
 */

#include "W10_Web_0201.h"

// --------------------------------------------------
// 1. /api/windProfile (GET/POST)
// --------------------------------------------------
void CL_W10_WebAPI::routeWindProfile() {
    // GET: 전체 목록
    s_server->on(W10_Const::HTTP_API_WIND_PROFILE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        // [P0-1] async_tcp 스택 보호: WindDict(~1.5KB) static 승격
        static ST_A20_WindDict_t s_dict;
        memset(&s_dict, 0, sizeof(s_dict));

        JsonDocument v_doc;

        if (CL_C10_ConfigManager::loadWindDict(s_dict)) {
            CL_C10_ConfigManager::toJson_WindDict(s_dict, v_doc);
            sendJson(p_request, v_doc);
        } else {
            p_request->send(500, "application/json", "{\"error\":\"load failed\"}");
        }
    });

    // POST: 신규 생성
    s_server->on(
        W10_Const::HTTP_API_WIND_PROFILE,
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
    s_server->on((String(W10_Const::HTTP_API_WIND_PROFILE) + "/([0-9]+)").c_str(),
                 HTTP_PUT,
                 [](AsyncWebServerRequest* p_request) {},
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     if (!checkApiKey(p_request)) {
                         p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                         return;
                     }
                     if (p_index + p_len != p_total) return;

                     int v_id = p_request->pathArg(0).toInt();

                     JsonDocument v_doc;
                     if (!parseJsonBody(p_request, p_data, p_len, v_doc)) {
                         p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
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
    s_server->on((String(W10_Const::HTTP_API_WIND_PROFILE) + "/([0-9]+)").c_str(),
                 HTTP_DELETE,
                 [](AsyncWebServerRequest* p_request) {
                     if (!checkApiKey(p_request)) {
                         p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                         return;
                     }
                     int  v_id      = p_request->pathArg(0).toInt();
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
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.schedules) {
            CL_C10_ConfigManager::toJson_Schedules(*v_snap.schedules, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // POST: 신규 생성
    s_server->on(
        W10_Const::HTTP_API_SCHEDULES,
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
    s_server->on((String(W10_Const::HTTP_API_SCHEDULES) + "/([0-9]+)").c_str(),
                 HTTP_PUT,
                 [](AsyncWebServerRequest* p_request) {},
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     if (!checkApiKey(p_request)) {
                         p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                         return;
                     }
                     if (p_index + p_len != p_total) return;

                     int v_id = p_request->pathArg(0).toInt();

                     JsonDocument v_doc;
                     if (!parseJsonBody(p_request, p_data, p_len, v_doc)) {
                         p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
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
    s_server->on((String(W10_Const::HTTP_API_SCHEDULES) + "/([0-9]+)").c_str(),
                 HTTP_DELETE,
                 [](AsyncWebServerRequest* p_request) {
                     if (!checkApiKey(p_request)) {
                         p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                         return;
                     }
                     int  v_id      = p_request->pathArg(0).toInt();
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
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }

        JsonDocument v_doc;
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.userProfiles) {
            CL_C10_ConfigManager::toJson_UserProfiles(*v_snap.userProfiles, v_doc);
        }
        sendJson(p_request, v_doc);
    });

    // POST: 신규 생성
    s_server->on(
        W10_Const::HTTP_API_USER_PROFILES,
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
    s_server->on((String(W10_Const::HTTP_API_USER_PROFILES) + "/([0-9]+)").c_str(),
                 HTTP_PUT,
                 [](AsyncWebServerRequest* p_request) {},
                 nullptr,
                 [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
                     if (!checkApiKey(p_request)) {
                         p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                         return;
                     }
                     if (p_index + p_len != p_total) return;

                     int v_id = p_request->pathArg(0).toInt();

                     JsonDocument v_doc;
                     if (!parseJsonBody(p_request, p_data, p_len, v_doc)) {
                         p_request->send(400, "application/json", "{\"error\":\"json parse\"}");
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
    s_server->on((String(W10_Const::HTTP_API_USER_PROFILES) + "/([0-9]+)").c_str(),
                 HTTP_DELETE,
                 [](AsyncWebServerRequest* p_request) {
                     if (!checkApiKey(p_request)) {
                         p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                         return;
                     }
                     int  v_id      = p_request->pathArg(0).toInt();
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
    s_server->on(
        W10_Const::HTTP_API_USER_PROFILES_PATCH,
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
            if (g_A20_config_root.userProfiles) {
                v_changed = CL_C10_ConfigManager::patchUserProfilesFromJson(*g_A20_config_root.userProfiles, v_doc);
            }

            if (v_changed) {
                CL_C10_ConfigManager::saveDirtyConfigs();
            }

            JsonDocument v_res;
            v_res["updated"] = v_changed;
            sendJson(p_request, v_res);
        });
}
