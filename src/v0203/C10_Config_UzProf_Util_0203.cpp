/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_Util_0203.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - UserProfiles (Util)
 * ------------------------------------------------------
 * [E-2.6] 원본의 모든 helper (C10_*, profileId/no 검증, decode, validate)
 * ------------------------------------------------------
 */

#include "C10_Config_UzProf_Internal_0203.h"

#include "A40_Com_Utils_0203.h"
#include "A22_Com_Lookup_0203.h"
#include "A23_Com_ResetCfg_0203.h"

#include <string.h>

// ═══════════════════════════════════════════════════════════
// [Phase 2] TriggerRule 파싱 헬퍼 (extern, 3개)
// ═══════════════════════════════════════════════════════════
EN_A20_ruleMode_t C10_parseRuleMode(const char* p_str) {
    if (!p_str || !p_str[0]) return EN_A20_RULE_MODE_PAUSE;
    if (strcasecmp(p_str, "STOP") == 0) return EN_A20_RULE_MODE_STOP;
    return EN_A20_RULE_MODE_PAUSE;
}

const char* C10_ruleModeToString(EN_A20_ruleMode_t p_mode) {
    return (p_mode == EN_A20_RULE_MODE_STOP) ? "STOP" : "PAUSE";
}

void C10_fromJson_TriggerRule(const JsonObjectConst& p_js, ST_A20_TriggerRule_t& p_out, const char* p_caller) {
    const char* v_caller = p_caller ? p_caller : "?";

    // 초기화 (기본값 강제)
    A20_resetTriggerRuleDefault(p_out);

    if (p_js.isNull()) return;

    // ─── timer ───
    {
        JsonObjectConst v_t = p_js["timer"].as<JsonObjectConst>();
        if (!v_t.isNull()) {
            p_out.timer.enabled = A40_ComFunc::Json_getBool(v_t, "enabled", false);
            p_out.timer.minutes = A40_ComFunc::Json_getNum<uint32_t>(v_t, "minutes", 0);
        }
    }

    // ─── offTime ───
    {
        JsonObjectConst v_ot = p_js["offTime"].as<JsonObjectConst>();
        if (!v_ot.isNull()) {
            p_out.offTime.enabled = A40_ComFunc::Json_getBool(v_ot, "enabled", false);
            A40_ComFunc::Json_copyStr(v_ot, "time", p_out.offTime.time, sizeof(p_out.offTime.time), "00:00", v_caller);
        }
    }

    // ─── tempLow ───
    {
        JsonObjectConst v_tl = p_js["tempLow"].as<JsonObjectConst>();
        if (!v_tl.isNull()) {
            p_out.tempLow.enabled    = A40_ComFunc::Json_getBool(v_tl, "enabled", false);
            p_out.tempLow.mode       = C10_parseRuleMode(A40_ComFunc::Json_getStr(v_tl, "mode", "PAUSE"));
            p_out.tempLow.threshold  = A40_ComFunc::Json_getNum<float>(v_tl, "threshold", 22.0f);
            p_out.tempLow.hysteresis = A40_ComFunc::Json_getNum<float>(v_tl, "hysteresis", 0.5f);

            // [검증] mode=PAUSE 시 hysteresis 최소값 강제
            if (p_out.tempLow.mode == EN_A20_RULE_MODE_PAUSE && p_out.tempLow.hysteresis < 0.5f) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10][%s] tempLow.hysteresis < 0.5 clamped to 0.5", v_caller);
                p_out.tempLow.hysteresis = 0.5f;
            }
        }
    }

    // ─── diLow ───
    {
        JsonObjectConst v_dl = p_js["diLow"].as<JsonObjectConst>();
        if (!v_dl.isNull()) {
            p_out.diLow.enabled    = A40_ComFunc::Json_getBool(v_dl, "enabled", false);
            p_out.diLow.mode       = C10_parseRuleMode(A40_ComFunc::Json_getStr(v_dl, "mode", "PAUSE"));
            p_out.diLow.threshold  = A40_ComFunc::Json_getNum<float>(v_dl, "threshold", 65.0f);
            p_out.diLow.hysteresis = A40_ComFunc::Json_getNum<float>(v_dl, "hysteresis", 3.0f);

            if (p_out.diLow.mode == EN_A20_RULE_MODE_PAUSE && p_out.diLow.hysteresis < 3.0f) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10][%s] diLow.hysteresis < 3.0 clamped to 3.0", v_caller);
                p_out.diLow.hysteresis = 3.0f;
            }
        }
    }

    // ─── pirPause ───
    {
        JsonObjectConst v_pp = p_js["pirPause"].as<JsonObjectConst>();
        if (!v_pp.isNull()) {
            p_out.pirPause.enabled = A40_ComFunc::Json_getBool(v_pp, "enabled", false);
            p_out.pirPause.holdSec = A40_ComFunc::Json_getNum<uint16_t>(v_pp, "holdSec", 120);
        }
    }

    // ─── smartComfort ───
    {
        JsonObjectConst v_sc = p_js["smartComfort"].as<JsonObjectConst>();
        if (!v_sc.isNull()) {
            p_out.smartComfort.enabled     = A40_ComFunc::Json_getBool(v_sc, "enabled", false);
            p_out.smartComfort.intervalMin = A40_ComFunc::Json_getNum<uint16_t>(v_sc, "intervalMin", 5);
            p_out.smartComfort.level       = A40_ComFunc::Json_getNum<uint8_t>(v_sc, "level", 2);
        }
    }
}

// =====================================================
// profileId (uint8) 자동 발급
// =====================================================
uint8_t C10_nextProfileId_u8(const ST_A20_UserProfilesRoot_t& p_root) {
    uint8_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (p_root.items[v_i].profileId > v_max) v_max = (uint8_t)p_root.items[v_i].profileId;
    }

    uint16_t v_next = (uint16_t)v_max + (uint16_t)G_C10_PROFILE_ID_STEP;
    if (v_next == 0u) v_next = (uint16_t)G_C10_PROFILE_ID_START;
    if (v_next > 255u) return (uint8_t)G_C10_PROFILE_ID_START;
    return (uint8_t)v_next;
}

bool C10_isProfileIdDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint8_t p_id, uint8_t p_excludeIndex) {
    if (p_id == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if ((uint8_t)p_root.items[v_i].profileId == p_id) return true;
    }
    return false;
}

bool C10_isProfileNoDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint16_t p_no, uint8_t p_excludeIndex) {
    if (p_no == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].profileNo == p_no) return true;
    }
    return false;
}

// =====================================================
// JSON → struct decode
// =====================================================
bool C10_fromJson_UserProfileItem(const JsonObjectConst&    p_jp,
                                  ST_A20_UserProfileItem_t& p_up,
                                  bool                      p_allowIdRead,
                                  bool                      p_forceProfileIdKeep,
                                  bool                      p_forceReissueSegId,
                                  const char*               p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    if (!p_forceProfileIdKeep) {
        if (p_allowIdRead) {
            uint16_t v_inId = (uint16_t)(p_jp["profileId"] | 0u);
            if (v_inId == 0u || v_inId > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileId=%u", v_caller, (unsigned)v_inId);
                return false;
            }
            p_up.profileId = (uint16_t)v_inId;
        }
    }

    {
        uint16_t v_no = (uint16_t)(p_jp["profileNo"] | 0u);
        if (v_no == 0u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid profileNo=%u", v_caller, (unsigned)v_no);
            return false;
        }
        p_up.profileNo = v_no;
    }

    A40_ComFunc::Json_copyStr(p_jp, "name", p_up.name, sizeof(p_up.name), "", v_caller);
    p_up.enabled = A40_ComFunc::Json_getBool(p_jp, "enabled", true);

    p_up.repeatSegments = A40_ComFunc::Json_getBool(p_jp, "repeatSegments", true);
    p_up.repeatCount    = (uint16_t)(p_jp["repeatCount"] | 0u);

    p_up.segCount = 0;
    // ======================================================
    // [Phase4 ADR-2] steps[] 단일 표준 파싱 (하위 호환성 제외)
    // ======================================================
    if (p_jp["steps"].is<JsonArrayConst>()) {
        JsonArrayConst v_sArr = p_jp["steps"].as<JsonArrayConst>();
        for (JsonObjectConst jstep : v_sArr) {
            if (p_up.segCount >= A20_Const::MAX_STEPS_PER_PROFILE) break;

            ST_A20_Step_t& sg = p_up.segments[p_up.segCount];
            memset(&sg, 0, sizeof(sg));

            // 1. stepNo 단일화
            uint16_t v_stepNoIn = (uint16_t)(jstep["stepNo"] | (uint32_t)(p_up.segCount + 1));
            sg.stepNo           = (uint8_t)(v_stepNoIn > 255u ? 255u : v_stepNoIn);
            sg.segNo            = v_stepNoIn;
            sg.segId            = (uint8_t)sg.stepNo;

            // 2. durationMin 단일화
            sg.durationMin = (uint16_t)(jstep["durationMin"] | 20u);
            if (sg.durationMin < A20_Const::MIN_STEP_DURATION_MIN) sg.durationMin = A20_Const::MIN_STEP_DURATION_MIN;
            if (sg.durationMin > A20_Const::MAX_STEP_DURATION_MIN) sg.durationMin = A20_Const::MAX_STEP_DURATION_MIN;
            sg.onMinutes  = sg.durationMin;
            sg.offMinutes = 0;

            // 3. type 단일화
            const char* v_typeStr = jstep["type"] | "PRESET";
            sg.type               = A20_stepTypeFromString(v_typeStr);
            sg.mode = (sg.type == EN_A20_STEP_TYPE_FIXED) ? EN_A20_SEG_MODE_FIXED : EN_A20_SEG_MODE_PRESET;

            // 4. 프리셋/스타일 코드
            A40_ComFunc::Json_copyStr(jstep,
                                      "presetCode",
                                      sg.presetCode,
                                      sizeof(sg.presetCode),
                                      A20_Const::DEFAULT_PRESET_CODE,
                                      v_caller);
            A40_ComFunc::Json_copyStr(jstep, "styleCode", sg.styleCode, sizeof(sg.styleCode), A20_Const::DEFAULT_STYLE_CODE, v_caller);

            // 5. 물리 Override
            memset(&sg.override, 0, sizeof(sg.override));
            sg.override.windIntensity   = -1.0f;
            sg.override.windVariability = -1.0f;
            sg.override.gustFrequency   = -1.0f;

            if (jstep["override"].is<JsonObjectConst>()) {
                JsonObjectConst ovr = jstep["override"].as<JsonObjectConst>();
                sg.override.enabled = ovr["enabled"] | false;
                if (ovr["windIntensity"].is<float>()) {
                    sg.override.windIntensity = ovr["windIntensity"].as<float>();
                }
                if (ovr["windVariability"].is<float>()) {
                    sg.override.windVariability = ovr["windVariability"].as<float>();
                }
                if (ovr["gustFrequency"].is<float>()) {
                    sg.override.gustFrequency = ovr["gustFrequency"].as<float>();
                }
            }

            // 6. fixedSpeed
            sg.fixedSpeed = A40_ComFunc::Json_getNum<float>(jstep, "fixedSpeed", 50.0f);
            p_up.segCount++;
        }
    }

    // [Phase 2] rule 파싱 (신규 단일 스키마)
    if (p_jp["rule"].is<JsonObjectConst>()) {
        C10_fromJson_TriggerRule(p_jp["rule"].as<JsonObjectConst>(), p_up.rule, v_caller);
    } else {
        // rule 없으면 기본값 (자동 정지 규칙 미설정)
        A20_resetTriggerRuleDefault(p_up.rule);
    }

    // [deprecated] 레거시 autoOff/motion 감지 경고 (파싱은 무시)
    if (p_jp["autoOff"].is<JsonObjectConst>() || p_jp["motion"].is<JsonObjectConst>()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10][%s] legacy autoOff/motion detected (ignored, use 'rule')", v_caller);
    }

    return true;
}

// =====================================================
// segId 재발급 + segNo 검증
// =====================================================
bool C10_reissueProfileSegIdsAndValidateSegNos(ST_A20_UserProfileItem_t& p_up, const char* p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        if (p_up.segments[v_i].segNo == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segNo is 0 (idx=%u)", v_caller, (unsigned)v_i);
            return false;
        }
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_up.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_j++) {
            if (p_up.segments[v_i].segNo == p_up.segments[v_j].segNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated segNo=%u",
                                   v_caller,
                                   (unsigned)p_up.segments[v_i].segNo);
                return false;
            }
        }
    }

    uint8_t v_nextId = (uint8_t)G_C10_PROFILE_SEG_ID_START;
    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        p_up.segments[v_i].segId = (uint16_t)v_nextId;

        uint16_t v_tmp = (uint16_t)v_nextId + (uint16_t)G_C10_PROFILE_SEG_ID_STEP;
        if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_PROFILE_SEG_ID_START;
        v_nextId = (uint8_t)v_tmp;
    }

    for (uint8_t v_i = 0; v_i < p_up.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        if ((uint16_t)p_up.segments[v_i].segId == 0u) return false;
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_up.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_j++) {
            if (p_up.segments[v_i].segId == p_up.segments[v_j].segId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated segId=%u after reissue",
                                   v_caller,
                                   (unsigned)p_up.segments[v_i].segId);
                return false;
            }
        }
    }
    return true;
}

// =====================================================
// validate
// =====================================================
bool C10_validateUserProfilesLoaded(const ST_A20_UserProfilesRoot_t& p_root, const char* p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    if (p_root.count > A20_Const::MAX_USER_PROFILES) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: userProfiles.count overflow(%u)", v_caller, (unsigned)p_root.count);
        return false;
    }

    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        const ST_A20_UserProfileItem_t& up = p_root.items[v_i];

        uint16_t v_pid = (uint16_t)up.profileId;
        if (v_pid == 0u || v_pid > 255u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: invalid profileId=%u (idx=%u)",
                               v_caller,
                               (unsigned)v_pid,
                               (unsigned)v_i);
            return false;
        }
        if (up.profileNo == 0u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: profileNo is 0 (profileId=%u)", v_caller, (unsigned)v_pid);
            return false;
        }

        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_root.count && v_j < A20_Const::MAX_USER_PROFILES; v_j++) {
            if (p_root.items[v_j].profileId == up.profileId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileId=%u", v_caller, (unsigned)v_pid);
                return false;
            }
            if (p_root.items[v_j].profileNo == up.profileNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated profileNo=%u", v_caller, (unsigned)up.profileNo);
                return false;
            }
        }

        if (up.segCount > A20_Const::MAX_SEGMENTS_PER_PROFILE) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segCount overflow(profileId=%u)", v_caller, (unsigned)v_pid);
            return false;
        }

        for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_k++) {
            const ST_A20_UserProfileSegment_t& sg = up.segments[v_k];
            if (sg.segId == 0u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: invalid segId=%u (profileId=%u)",
                                   v_caller,
                                   (unsigned)sg.segId,
                                   (unsigned)v_pid);
                return false;
            }
            if (sg.segNo == 0u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segNo is 0 (profileId=%u)", v_caller, (unsigned)v_pid);
                return false;
            }

            for (uint8_t v_m = (uint8_t)(v_k + 1); v_m < up.segCount && v_m < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_m++) {
                const ST_A20_UserProfileSegment_t& sg2 = up.segments[v_m];
                if (sg.segId == sg2.segId) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] %s: duplicated segId=%u (profileId=%u)",
                                       v_caller,
                                       (unsigned)sg.segId,
                                       (unsigned)v_pid);
                    return false;
                }
                if (sg.segNo == sg2.segNo) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] %s: duplicated segNo=%u (profileId=%u)",
                                       v_caller,
                                       (unsigned)sg.segNo,
                                       (unsigned)v_pid);
                    return false;
                }
            }
        }
    }
    return true;
}

bool C10_validateUserProfilesBeforeSave(const ST_A20_UserProfilesRoot_t& p_cfg, const char* p_callerForLog) {
    return C10_validateUserProfilesLoaded(p_cfg, p_callerForLog);
}
