/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_AIAction_0203.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind AI Action Dispatcher & Safety Guard
 * ------------------------------------------------------
 * 기능 요약:
 *  - 15종 위험 명령(reboot, factoryReset 등) 최우선 차단
 *  - 12개 Gemini 도구(Function Calling) 실행 및 디스패치
 *  - 자연어 프로필 생성 (_executeAddProfile)
 *  - 스케줄 무중단 복귀 (release_manual_to_schedule)
 *  - Gemini Function Declarations 스키마 등록
 * ------------------------------------------------------
 * [구현 규칙]
 *  - ArduinoJson v7 규격 준수
 *  - g_A20_config_root 직접 역참조 금지 (스냅샷 API 사용)
 *  - CL_D10_Logger 표준 로깅
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"
#include "C10_Config_0203.h"
#include "N10_NvsManager_0203.h"
#include "D10_Logger_0203.h"

namespace {

// [S1] 자연어 프로필 생성 헬퍼
String executeAddProfile(JsonObjectConst p_args) {
    const char* v_name = p_args["name"] | "";
    if (!v_name[0]) return "error:missing_name";

    JsonArrayConst v_steps = p_args["steps"].as<JsonArrayConst>();
    if (v_steps.isNull() || v_steps.size() == 0 || v_steps.size() > 8) {
        return "error:invalid_steps";
    }

    // 스냅샷 기반 안전 복사
    ST_A20_ConfigRoot_t v_rootSnap;
    CL_C10_ConfigManager::getRootSnapshot(v_rootSnap);
    if (!v_rootSnap.userProfiles) return "error:config_unavailable";

    ST_A20_UserProfilesRoot_t v_profiles = *v_rootSnap.userProfiles;
    if (v_profiles.count >= A20_Const::MAX_USER_PROFILES) {
        return "error:max_profiles_reached";
    }

    // 새 profileNo 산출 (최대 번호 + 1)
    uint16_t v_nextNo = 1;
    for (uint8_t i = 0; i < v_profiles.count; ++i) {
        if (v_profiles.items[i].profileNo >= v_nextNo) {
            v_nextNo = v_profiles.items[i].profileNo + 1;
        }
    }

    ST_A20_UserProfileItem_t& v_newProf = v_profiles.items[v_profiles.count];
    memset(&v_newProf, 0, sizeof(v_newProf));
    v_newProf.profileId = v_profiles.count + 1;
    v_newProf.profileNo = v_nextNo;
    strlcpy(v_newProf.name, v_name, sizeof(v_newProf.name));
    v_newProf.enabled        = true;
    v_newProf.repeatSegments = p_args["repeat"] | false;
    v_newProf.repeatCount    = (uint8_t)(p_args["repeatCount"] | 0);

    uint8_t v_stepIdx = 0;
    for (JsonObjectConst s : v_steps) {
        if (v_stepIdx >= A20_Const::MAX_SEGMENTS_PER_PROFILE) break;
        ST_A20_UserProfileSegment_t& v_seg = v_newProf.segments[v_stepIdx];
        memset(&v_seg, 0, sizeof(v_seg));
        v_seg.stepNo      = v_stepIdx + 1;
        v_seg.segId       = v_stepIdx + 1;
        v_seg.segNo       = v_stepIdx + 1;
        v_seg.durationMin = (uint16_t)(s["durationMin"] | 20);

        const char* v_type = s["type"] | "PRESET";
        if (strcmp(v_type, "FIXED") == 0) {
            v_seg.type              = EN_A20_STEP_TYPE_FIXED;
            v_seg.fixedSpeed        = (float)(s["fixedSpeed"] | 50.0f);
        } else {
            v_seg.type          = EN_A20_STEP_TYPE_PRESET;
            const char* v_code  = s["presetCode"] | "OCEAN";
            const char* v_style = s["styleCode"] | "BALANCE";
            strlcpy(v_seg.presetCode, v_code, sizeof(v_seg.presetCode));
            strlcpy(v_seg.styleCode, v_style, sizeof(v_seg.styleCode));
        }
        v_stepIdx++;
    }
    v_newProf.segCount     = v_stepIdx;
    v_profiles.count++;

    if (!CL_C10_ConfigManager::saveUserProfiles(v_profiles)) {
        return "error:save_failed";
    }

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[AI] Created profile '%s' (No=%u)", v_name, v_nextNo);
    return "ok";
}

// 상태 JSON 생성 헬퍼
String sessionStatusJson() {
    ST_CT10_SessionContext_t v_s = CL_CT10_ControlManager::getSessionSnapshot();
    JsonDocument             v_doc;
    v_doc["state"] = (v_s.state == EN_SESSION_ACTIVE)   ? "ACTIVE"
                     : (v_s.state == EN_SESSION_PAUSED) ? "PAUSED"
                                                        : "COMPLETED";
    v_doc["type"]  = (v_s.type == EN_CT10_SESSION_FIXED)      ? "FIXED"
                     : (v_s.type == EN_CT10_SESSION_PRESET)   ? "PRESET"
                     : (v_s.type == EN_CT10_SESSION_PLAYLIST) ? "PLAYLIST"
                                                              : "NONE";
    if (v_s.type == EN_CT10_SESSION_FIXED) {
        v_doc["percent"] = (int)v_s.payload.fixed.percent;
    } else if (v_s.type == EN_CT10_SESSION_PRESET) {
        v_doc["preset"] = v_s.payload.preset.presetCode;
        v_doc["style"]  = v_s.payload.preset.styleCode;
    } else if (v_s.type == EN_CT10_SESSION_PLAYLIST) {
        v_doc["profile"] = v_s.payload.playlist.profileName;
        v_doc["step"]    = v_s.payload.playlist.currentStepIdx + 1;
        v_doc["total"]   = v_s.payload.playlist.totalSteps;
    }
    if (v_s.runtimeAutoOffMin > 0) {
        v_doc["timerRemainSec"] = CL_CT10_ControlManager::getSessionAutoOffRemainSec();
    }
    String v_out;
    serializeJson(v_doc, v_out);
    return v_out;
}

// 프로필 목록 JSON 생성 헬퍼
String listProfilesJson() {
    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);
    if (!v_snap.userProfiles) return "[]";

    JsonDocument v_doc;
    JsonArray    v_arr = v_doc.to<JsonArray>();
    for (uint8_t i = 0; i < v_snap.userProfiles->count; ++i) {
        JsonObject v_p = v_arr.add<JsonObject>();
        v_p["no"]      = v_snap.userProfiles->items[i].profileNo;
        v_p["name"]    = v_snap.userProfiles->items[i].name;
        v_p["step"]    = v_snap.userProfiles->items[i].segCount;
    }
    String v_out;
    serializeJson(v_doc, v_out);
    return v_out;
}
} // namespace

namespace CT10_AI {

// [S3] 위험 명령 화이트리스트 차단 (최우선)
bool isForbiddenAIFunction(const char* p_fn) {
    if (!p_fn) return true;
    static const char* const S_BLOCKED[] = {"reboot",
                                            "restart",
                                            "reset",
                                            "factoryReset",
                                            "factory_reset",
                                            "format",
                                            "clearAll",
                                            "erase",
                                            "shutdown",
                                            "fwUpdate",
                                            "firmware_update",
                                            "ota",
                                            "fileUpload",
                                            "upload",
                                            "erase_nvs",
                                            nullptr};
    for (int i = 0; S_BLOCKED[i] != nullptr; ++i) {
        if (strcasecmp(p_fn, S_BLOCKED[i]) == 0) return true;
    }
    return false;
}

// 12개 도구 실행 디스패처
String executeAIAction(const char* p_fn, JsonObjectConst p_args) {
    if (!p_fn || !p_fn[0]) return "error:null_fn";

    // 위험 명령 보안 검사
    if (isForbiddenAIFunction(p_fn)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[AI] Blocked forbidden function: %s", p_fn);
        return "error:forbidden";
    }

    // 1. 프로필(플레이리스트) 재생
    if (strcmp(p_fn, "start_playlist") == 0) {
        uint16_t v_no = p_args["profileNo"] | 0;
        if (v_no == 0) {
            // profileId 또는 이름으로 번호 탐색
            uint8_t             v_id   = p_args["profileId"] | 0;
            const char*         v_name = p_args["profileName"] | "";
            ST_A20_ConfigRoot_t v_snap;
            CL_C10_ConfigManager::getRootSnapshot(v_snap);
            if (v_snap.userProfiles) {
                for (uint8_t i = 0; i < v_snap.userProfiles->count; ++i) {
                    if ((v_id > 0 && v_snap.userProfiles->items[i].profileId == v_id) ||
                        (v_name[0] && strcasecmp(v_snap.userProfiles->items[i].name, v_name) == 0)) {
                        v_no = v_snap.userProfiles->items[i].profileNo;
                        break;
                    }
                }
            }
        }
        if (v_no == 0) return "error:profile_not_found";
        return CL_CT10_ControlManager::setActiveUserProfile(v_no) ? "ok" : "error:start_failed";
    }

    // 2. 프리셋 바람 재생
    if (strcmp(p_fn, "start_preset") == 0) {
        const char* v_code  = p_args["presetCode"] | "OCEAN";
        const char* v_style = p_args["styleCode"] | "BALANCE";
        CL_CT10_ControlManager::instance().startOverridePreset(v_code, v_style, nullptr, 0, true);
        return "ok";
    }

    // 3. 고정 PWM 바람 재생
    if (strcmp(p_fn, "start_fixed") == 0) {
        float v_pct = p_args["percent"] | 50.0f;
        if (v_pct < 0.0f) v_pct = 0.0f;
        if (v_pct > 100.0f) v_pct = 100.0f;
        CL_CT10_ControlManager::instance().startOverrideFixed(v_pct, 0, true);
        return "ok";
    }

    // 4. 일시 정지
    if (strcmp(p_fn, "pause_session") == 0) {
        return CL_CT10_ControlManager::pauseSession() ? "ok" : "error:pause_failed";
    }

    // 5. 재개
    if (strcmp(p_fn, "resume_session") == 0) {
        return CL_CT10_ControlManager::resumeSession() ? "ok" : "error:resume_failed";
    }

    // 6. 완전 정지
    if (strcmp(p_fn, "stop_session") == 0) {
        return CL_CT10_ControlManager::stopSession() ? "ok" : "error:stop_failed";
    }

    // 7. 자동 꺼짐 타이머 (런타임 AutoOff)
    if (strcmp(p_fn, "set_timer") == 0) {
        uint32_t v_m = p_args["minutes"] | 0;
        if (v_m == 0 || v_m > 1440) return "error:invalid_minutes";
        // 정지 상태라면 50% 바람으로 우선 가동
        if (!CL_CT10_ControlManager::isSessionActive()) {
            CL_CT10_ControlManager::instance().startOverrideFixed(50.0f, 0, true);
        }
        return CL_CT10_ControlManager::setSessionAutoOff(v_m) ? "ok" : "error:timer_failed";
    }

    // 8. 상태 조회
    if (strcmp(p_fn, "get_status") == 0) {
        return sessionStatusJson();
    }

    // 9. 프로필 목록 조회
    if (strcmp(p_fn, "list_profiles") == 0) {
        return listProfilesJson();
    }

    // 10. 프로필 생성 (S1)
    if (strcmp(p_fn, "add_profile") == 0) {
        return executeAddProfile(p_args);
    }

    // 11. 스케줄 복귀 (S7: 수동 해제 ➔ 스케줄 무중단 전환)
    if (strcmp(p_fn, "release_manual_to_schedule") == 0) {
        CL_N10_NvsManager::setManualOvrSchedule(false);
        CL_CT10_ControlManager::clearManual();
        return "ok";
    }

    // 12. 스케줄 추가
    if (strcmp(p_fn, "add_schedule") == 0) {
        // [A-2] 스케줄 스냅샷 기반 추가
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (!v_snap.schedules) return "error:schedules_unavailable";
        ST_A20_SchedulesRoot_t v_sch = *v_snap.schedules;
        if (v_sch.count >= A20_Const::MAX_SCHEDULES) return "error:max_schedules_reached";

        const char* v_name   = p_args["name"] | "새 스케줄";
        uint16_t    v_profId = p_args["profileId"] | 1;
        uint16_t    v_sMin   = p_args["startMinute"] | 540; // 09:00
        uint16_t    v_eMin   = p_args["endMinute"] | 1080;  // 18:00

        ST_A20_ScheduleItem_t& v_item = v_sch.items[v_sch.count];
        memset(&v_item, 0, sizeof(v_item));
        v_item.schId = v_sch.count + 1;
        v_item.schNo = v_sch.count + 1;
        strlcpy(v_item.name, v_name, sizeof(v_item.name));
        v_item.profileId   = v_profId;
        v_item.enabled     = true;

        char v_sTime[6];
        char v_eTime[6];
        snprintf(v_sTime, sizeof(v_sTime), "%02u:%02u", v_sMin / 60, v_sMin % 60);
        snprintf(v_eTime, sizeof(v_eTime), "%02u:%02u", v_eMin / 60, v_eMin % 60);
        strlcpy(v_item.period.startTime, v_sTime, sizeof(v_item.period.startTime));
        strlcpy(v_item.period.endTime, v_eTime, sizeof(v_item.period.endTime));
        v_item.period.enabled = true;
        memset(v_item.period.days, 1, sizeof(v_item.period.days)); // 매일
        v_sch.count++;

        return CL_C10_ConfigManager::saveSchedules(v_sch) ? "ok" : "error:save_failed";
    }

    return "error:unknown_function";
}

// Gemini 도구 스키마 선언
void appendAIFunctionDeclarations(JsonArray& r_decls) {
    // 1. start_playlist
    {
        JsonObject d                 = r_decls.add<JsonObject>();
        d["name"]                    = "start_playlist";
        d["description"]             = "Play a user wind playlist profile by name or number.";
        JsonObject p                 = d["parameters"].to<JsonObject>();
        p["type"]                    = "OBJECT";
        JsonObject props             = p["properties"].to<JsonObject>();
        props["profileName"]["type"] = "STRING";
        props["profileNo"]["type"]   = "NUMBER";
    }
    // 2. start_preset
    {
        JsonObject d                = r_decls.add<JsonObject>();
        d["name"]                   = "start_preset";
        d["description"]            = "Start a nature wind preset like OCEAN, VALLEY_BREEZE, FOREST_RUSTLE, etc.";
        JsonObject p                = d["parameters"].to<JsonObject>();
        p["type"]                   = "OBJECT";
        JsonObject props            = p["properties"].to<JsonObject>();
        props["presetCode"]["type"] = "STRING";
        props["styleCode"]["type"]  = "STRING";
        JsonArray req               = p["required"].to<JsonArray>();
        req.add("presetCode");
    }
    // 3. start_fixed
    {
        JsonObject d             = r_decls.add<JsonObject>();
        d["name"]                = "start_fixed";
        d["description"]         = "Run normal fan mode with fixed power percentage (1 to 100).";
        JsonObject p             = d["parameters"].to<JsonObject>();
        p["type"]                = "OBJECT";
        JsonObject props         = p["properties"].to<JsonObject>();
        props["percent"]["type"] = "NUMBER";
        JsonArray req            = p["required"].to<JsonArray>();
        req.add("percent");
    }
    // 4. pause_session
    {
        JsonObject d     = r_decls.add<JsonObject>();
        d["name"]        = "pause_session";
        d["description"] = "Temporarily pause the currently running fan session.";
    }
    // 5. resume_session
    {
        JsonObject d     = r_decls.add<JsonObject>();
        d["name"]        = "resume_session";
        d["description"] = "Resume a paused fan session.";
    }
    // 6. stop_session
    {
        JsonObject d     = r_decls.add<JsonObject>();
        d["name"]        = "stop_session";
        d["description"] = "Turn off or completely stop the fan.";
    }
    // 7. set_timer
    {
        JsonObject d             = r_decls.add<JsonObject>();
        d["name"]                = "set_timer";
        d["description"]         = "Set automatic off countdown timer in minutes for the fan.";
        JsonObject p             = d["parameters"].to<JsonObject>();
        p["type"]                = "OBJECT";
        JsonObject props         = p["properties"].to<JsonObject>();
        props["minutes"]["type"] = "NUMBER";
        JsonArray req            = p["required"].to<JsonArray>();
        req.add("minutes");
    }
    // 8. get_status
    {
        JsonObject d     = r_decls.add<JsonObject>();
        d["name"]        = "get_status";
        d["description"] = "Get current fan status including speed, active profile, and timer.";
    }
    // 9. list_profiles
    {
        JsonObject d     = r_decls.add<JsonObject>();
        d["name"]        = "list_profiles";
        d["description"] = "List all available wind profiles.";
    }
    // 10. add_profile
    {
        JsonObject d                  = r_decls.add<JsonObject>();
        d["name"]                     = "add_profile";
        d["description"]              = "Create a new customized wind playlist profile from description.";
        JsonObject p                  = d["parameters"].to<JsonObject>();
        p["type"]                     = "OBJECT";
        JsonObject props              = p["properties"].to<JsonObject>();
        props["name"]["type"]         = "STRING";
        JsonObject steps              = props["steps"].to<JsonObject>();
        steps["type"]                 = "ARRAY";
        JsonObject items              = steps["items"].to<JsonObject>();
        items["type"]                 = "OBJECT";
        JsonObject iprops             = items["properties"].to<JsonObject>();
        iprops["durationMin"]["type"] = "NUMBER";
        iprops["type"]["type"]        = "STRING";
        iprops["presetCode"]["type"]  = "STRING";
        iprops["styleCode"]["type"]   = "STRING";
        iprops["fixedSpeed"]["type"]  = "NUMBER";
        JsonArray req                 = p["required"].to<JsonArray>();
        req.add("name");
        req.add("steps");
    }
    // 11. release_manual_to_schedule
    {
        JsonObject d     = r_decls.add<JsonObject>();
        d["name"]        = "release_manual_to_schedule";
        d["description"] = "Release manual override and return to automatic schedule execution.";
    }
    // 12. add_schedule
    {
        JsonObject d                 = r_decls.add<JsonObject>();
        d["name"]                    = "add_schedule";
        d["description"]             = "Register a new automatic schedule.";
        JsonObject p                 = d["parameters"].to<JsonObject>();
        p["type"]                    = "OBJECT";
        JsonObject props             = p["properties"].to<JsonObject>();
        props["name"]["type"]        = "STRING";
        props["profileId"]["type"]   = "NUMBER";
        props["startMinute"]["type"] = "NUMBER";
        props["endMinute"]["type"]   = "NUMBER";
    }
}
} // namespace CT10_AI
