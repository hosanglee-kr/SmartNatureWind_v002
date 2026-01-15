/*  
 * ------------------------------------------------------  
 * 소스명 : C10_Config_Schedule_049.cpp  
 * 모듈 약어 : C10  
 * 모듈명 : Smart Nature Wind Configuration Manager - Schedule (Only)  
 * ------------------------------------------------------  
 * 기능 요약:  
 *  - Schedules Load/Save  
 *  - Schedules JSON Export / Patch  
 *  - Schedule CRUD (add/update/delete)  
 *  - schId/schNo/segId/segNo 운영 규칙 반영  
 *    - File Load: schId/segId를 "신뢰 가능한 소스"로 간주하고 읽기 허용(필수/중복/0금지/범위 검증)  
 *    - API patch/add: schId/segId 입력 무시(서버 발급)  
 *    - update=PUT 고정: schId 유지 + segId 서버 재발급 + 필수/중복검증 강화  
 *    - Save: schId/schNo/segId/segNo 필수/중복검증을 save 직전 마지막 방어선으로 재검증  
 *  - camelCase only  
 * ------------------------------------------------------  
 * [구현 규칙]  
 *  - 항상 소스 시작 주석 체계 유지  
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)  
 *  - JsonDocument 단일 타입만 사용  
 *  - createNestedArray/Object/containsKey 사용 금지  
 *  - memset + strlcpy 기반 안전 초기화  
 *  - 주석/필드명은 JSON 구조와 동일하게 유지  
 *  - 모듈별 헤더(h) + 목적물별 cpp 분리 구성 (Core/System/Schedule)  
 * ------------------------------------------------------  
 * [코드 네이밍 규칙]  
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사  
 *   - 전역 변수             : g_모듈약어_ 접두사  
 *   - 전역 함수             : 모듈약어_ 접두사  
 *   - type                  : T_모듈약어_ 접두사  
 *   - typedef               : _t  접미사  
 *   - enum 상수             : EN_모듈약어_ 접두사  
 *   - 구조체                : ST_모듈약어_ 접두사  
 *   - 클래스명              : CL_모듈약어_ 접두사  
 *   - 클래스 private 멤버   : _ 접두사  
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용  
 *   - 클래스 정적 멤버      : s_ 접두사  
 *   - 함수 로컬 변수        : v_ 접두사  
 *   - 함수 인자             : p_ 접두사  
 * ------------------------------------------------------  
 */  

#include <new>
#include <Arduino.h>

#include "C10_Config_042.h"

// ✅ A40 공통 유틸/IO/Mutex/Dirty Helper 직접 포함 보장(간접 include 누락 대비)
// #include "A40_Com_Func_052.h"

// ------------------------------------------------------  
// Schedule ID/NO 정책 (최종)  
//  - schId: uint8_t, 필수, 0 금지, 중복 금지, 서버 발급(기본: 1부터 1씩 증가)  
//    * File Load에서는 신뢰 가능한 소스로 간주하여 읽기 허용(검증은 수행)  
//    * API patch/add에서는 입력 무시(서버 발급)  
//    * update=PUT: schId 유지(요청 body의 schId/segId는 무시)  
//  - schNo: uint16_t, 필수, 0 금지, 중복 금지, 사용자 변경 가능(정렬/제어순서 목적)  
//    * 기본 증가 규칙: 10부터 10씩(서버가 자동발급할 수 있는 경우에만 사용)  
//  - segId: uint8_t, 필수, 0 금지, 중복 금지(스케줄 내), 서버 발급(1부터 1씩)  
//    * File Load에서는 신뢰 가능한 소스로 간주하여 읽기 허용(검증은 수행)  
//    * API patch/add/update(PUT)에서는 입력 무시(서버 발급)  
//  - segNo: uint16_t, 필수, 0 금지, 중복 금지(스케줄 내), 사용자 변경 가능(정렬 목적)  
//    * 기본 증가 규칙: 10부터 10씩(서버가 자동발급할 수 있는 경우에만 사용)  
// ------------------------------------------------------  
#ifndef G_C10_SCH_ID_START
# define G_C10_SCH_ID_START 1
#endif
#ifndef G_C10_SCH_ID_STEP
# define G_C10_SCH_ID_STEP 1
#endif
#ifndef G_C10_SCH_NO_START
# define G_C10_SCH_NO_START 10
#endif
#ifndef G_C10_SCH_NO_STEP
# define G_C10_SCH_NO_STEP 10
#endif

#ifndef G_C10_SEG_ID_START
# define G_C10_SEG_ID_START 1
#endif
#ifndef G_C10_SEG_ID_STEP
# define G_C10_SEG_ID_STEP 1
#endif
#ifndef G_C10_SEG_NO_START
# define G_C10_SEG_NO_START 10
#endif
#ifndef G_C10_SEG_NO_STEP
# define G_C10_SEG_NO_STEP 10
#endif

// =====================================================
// 내부 Helper (Schedule 전용)
// =====================================================

static uint8_t C10_nextScheduleId_u8(const ST_A20_SchedulesRoot_t& p_root) {
    uint8_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (p_root.items[v_i].schId > v_max) v_max = p_root.items[v_i].schId;
    }

    uint16_t v_next = (uint16_t)v_max + (uint16_t)G_C10_SCH_ID_STEP;
    if (v_next == 0u) v_next = (uint16_t)G_C10_SCH_ID_START; // wrap 방어
    if (v_next > 255u) return (uint8_t)G_C10_SCH_ID_START;   // wrap 정책: start로
    if (v_next < (uint16_t)G_C10_SCH_ID_START) return (uint8_t)G_C10_SCH_ID_START;
    return (uint8_t)v_next;
}

static bool C10_isSchIdDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint8_t p_schId, uint8_t p_excludeIndex) {
    if (p_schId == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].schId == p_schId) return true;
    }
    return false;
}

static bool C10_isSchNoDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint16_t p_schNo, uint8_t p_excludeIndex) {
    if (p_schNo == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].schNo == p_schNo) return true;
    }
    return false;
}

static uint8_t C10_nextSegId_u8(const ST_A20_ScheduleItem_t& p_s) {
    uint8_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        if (p_s.segments[v_i].segId > v_max) v_max = p_s.segments[v_i].segId;
    }

    uint16_t v_next = (uint16_t)v_max + (uint16_t)G_C10_SEG_ID_STEP;
    if (v_next == 0u) v_next = (uint16_t)G_C10_SEG_ID_START;
    if (v_next > 255u) return (uint8_t)G_C10_SEG_ID_START;
    if (v_next < (uint16_t)G_C10_SEG_ID_START) return (uint8_t)G_C10_SEG_ID_START;
    return (uint8_t)v_next;
}

static bool C10_isSegIdDuplicatedInSchedule(const ST_A20_ScheduleItem_t& p_s, uint8_t p_segId, uint8_t p_excludeIndex) {
    if (p_segId == 0) return true;
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_s.segments[v_i].segId == p_segId) return true;
    }
    return false;
}

static bool C10_isSegNoDuplicatedInSchedule(const ST_A20_ScheduleItem_t& p_s, uint16_t p_segNo, uint8_t p_excludeIndex) {
    if (p_segNo == 0) return true;
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_s.segments[v_i].segNo == p_segNo) return true;
    }
    return false;
}

// 스케줄 단위 segNo 자동발급(필요한 경우)
static uint16_t C10_nextSegNo_u16_byStep(const ST_A20_ScheduleItem_t& p_s) {
    uint16_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        if (p_s.segments[v_i].segNo > v_max) v_max = p_s.segments[v_i].segNo;
    }
    uint32_t v_next = (uint32_t)v_max + (uint32_t)G_C10_SEG_NO_STEP;
    if (v_next == 0u || v_next > 65535u) return (uint16_t)G_C10_SEG_NO_START;
    if (v_next < (uint32_t)G_C10_SEG_NO_START) return (uint16_t)G_C10_SEG_NO_START;
    return (uint16_t)v_next;
}

// -----------------------------------------------------
// JSON -> struct decode (Schedule PUT/ADD/PATCH 공통)
//  - p_allowIdRead=true  : schId/segId/segNo 읽기 허용(=file load)
//  - p_allowIdRead=false : schId/segId 입력 무시(=API add/patch/update)
//  - p_forceSchIdKeep=true: 호출자가 미리 set한 schId 유지(=update PUT)
//  - segments에서 segId는 allowIdRead일 때만 읽고, 아니면 서버에서 재발급
// -----------------------------------------------------
static bool C10_fromJson_ScheduleItem(
    const JsonObjectConst& p_js,
    ST_A20_ScheduleItem_t& p_s,
    bool                   p_allowIdRead,
    bool                   p_forceSchIdKeep,
    bool                   p_forceReissueSegId,
    const char*            p_callerForLog
) {
    // schId
    if (!p_forceSchIdKeep) {
        if (p_allowIdRead) {
            uint16_t v_inId = (uint16_t)(p_js["schId"] | 0);
            if (v_inId == 0u || v_inId > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: invalid schId=%u",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)v_inId);
                return false;
            }
            p_s.schId = (uint8_t)v_inId;
        } else {
            // API 입력 무시: 호출자가 set하거나 외부에서 발급
            // 여기서는 건드리지 않음
        }
    }

    // schNo (필수)
    {
        uint32_t v_no = (uint32_t)(p_js["schNo"] | 0u);
        if (v_no == 0u || v_no > 65535u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: invalid schNo=%u",
                               (p_callerForLog ? p_callerForLog : "?"),
                               (unsigned)v_no);
            return false;
        }
        p_s.schNo = (uint16_t)v_no;
    }

    // name / enabled / repeat
    // ✅ A40 공통 안전 copy 정책 적용(로그 정책 포함)
    A40_ComFunc::Json_copyStr_LogPolicy(p_js, "name", p_s.name, sizeof(p_s.name), "", p_callerForLog);
    p_s.enabled = p_js["enabled"] | true;

    p_s.repeatSegments = p_js["repeatSegments"] | true;
    p_s.repeatCount    = p_js["repeatCount"] | 0;

    // period
    for (uint8_t v_d = 0; v_d < 7; v_d++) {
        p_s.period.days[v_d] = p_js["period"]["days"][v_d] | 1;
    }
    A40_ComFunc::copyStr2Buffer_safe(p_s.period.startTime, p_js["period"]["startTime"] | "00:00", sizeof(p_s.period.startTime), p_callerForLog);
    A40_ComFunc::copyStr2Buffer_safe(p_s.period.endTime,   p_js["period"]["endTime"]   | "23:59", sizeof(p_s.period.endTime),   p_callerForLog);

    // segments
    p_s.segCount = 0;
    if (p_js["segments"].is<JsonArrayConst>()) {
        JsonArrayConst v_segArr = p_js["segments"].as<JsonArrayConst>();
        for (JsonObjectConst jseg : v_segArr) {
            if (p_s.segCount >= A20_Const::MAX_SEGMENTS_PER_SCHEDULE) break;

            ST_A20_ScheduleSegment_t& sg = p_s.segments[p_s.segCount];
            memset(&sg, 0, sizeof(sg));

            // segId
            if (!p_forceReissueSegId && p_allowIdRead) {
                uint16_t v_segIdIn = (uint16_t)(jseg["segId"] | 0);
                if (v_segIdIn == 0u || v_segIdIn > 255u) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] %s: invalid segId=%u",
                                       (p_callerForLog ? p_callerForLog : "?"),
                                       (unsigned)v_segIdIn);
                    return false;
                }
                sg.segId = (uint8_t)v_segIdIn;
            } else {
                // API/update PUT: segId 입력 무시(재발급은 상위에서 수행)
                sg.segId = 0;
            }

            // segNo (필수)
            {
                uint32_t v_segNoIn = (uint32_t)(jseg["segNo"] | 0u);
                if (v_segNoIn == 0u || v_segNoIn > 65535u) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] %s: invalid segNo=%u",
                                       (p_callerForLog ? p_callerForLog : "?"),
                                       (unsigned)v_segNoIn);
                    return false;
                }
                sg.segNo = (uint16_t)v_segNoIn;
            }

            sg.onMinutes  = (uint16_t)(jseg["onMinutes"] | 10);
            sg.offMinutes = (uint16_t)(jseg["offMinutes"] | 0);

            const char* v_mode = jseg["mode"] | "PRESET";
            sg.mode            = A20_modeFromString(v_mode);

            // ✅ A40 공통 copy 정책 적용(예시 요청 반영)
            A40_ComFunc::copyStr2Buffer_safe(sg.presetCode, jseg["presetCode"] | "", sizeof(sg.presetCode), p_callerForLog);
            A40_ComFunc::copyStr2Buffer_safe(sg.styleCode,  jseg["styleCode"]  | "", sizeof(sg.styleCode),  p_callerForLog);

            // adjust (✅ float은 double 기본값 + float 캐스팅으로 안정화)
            memset(&sg.adjust, 0, sizeof(sg.adjust));
            if (jseg["adjust"].is<JsonObjectConst>()) {
                JsonObjectConst adj = jseg["adjust"].as<JsonObjectConst>();
                sg.adjust.windIntensity            = (float)(adj["windIntensity"]            | 0.0);
                sg.adjust.windVariability          = (float)(adj["windVariability"]          | 0.0);
                sg.adjust.gustFrequency            = (float)(adj["gustFrequency"]            | 0.0);
                sg.adjust.fanLimit                 = (float)(adj["fanLimit"]                 | 0.0);
                sg.adjust.minFan                   = (float)(adj["minFan"]                   | 0.0);
                sg.adjust.turbulenceLengthScale    = (float)(adj["turbulenceLengthScale"]    | 0.0);
                sg.adjust.turbulenceIntensitySigma = (float)(adj["turbulenceIntensitySigma"] | 0.0);
                sg.adjust.thermalBubbleStrength    = (float)(adj["thermalBubbleStrength"]    | 0.0);
                sg.adjust.thermalBubbleRadius      = (float)(adj["thermalBubbleRadius"]      | 0.0);
            }

            sg.fixedSpeed = (float)(jseg["fixedSpeed"] | 0.0);

            p_s.segCount++;
        }
    }

    // autoOff
    memset(&p_s.autoOff, 0, sizeof(p_s.autoOff));
    if (p_js["autoOff"].is<JsonObjectConst>()) {
        JsonObjectConst ao          = p_js["autoOff"].as<JsonObjectConst>();
        p_s.autoOff.timer.enabled   = ao["timer"]["enabled"] | false;
        p_s.autoOff.timer.minutes   = ao["timer"]["minutes"] | 0;
        p_s.autoOff.offTime.enabled = ao["offTime"]["enabled"] | false;
        A40_ComFunc::copyStr2Buffer_safe(p_s.autoOff.offTime.time, ao["offTime"]["time"] | "", sizeof(p_s.autoOff.offTime.time), p_callerForLog);
        p_s.autoOff.offTemp.enabled = ao["offTemp"]["enabled"] | false;
        p_s.autoOff.offTemp.temp    = (float)(ao["offTemp"]["temp"] | 0.0);
    }

    // motion
    p_s.motion.pir.enabled       = p_js["motion"]["pir"]["enabled"] | false;
    p_s.motion.pir.holdSec       = p_js["motion"]["pir"]["holdSec"] | 0;
    p_s.motion.ble.enabled       = p_js["motion"]["ble"]["enabled"] | false;
    p_s.motion.ble.rssiThreshold = p_js["motion"]["ble"]["rssiThreshold"] | -70;
    p_s.motion.ble.holdSec       = p_js["motion"]["ble"]["holdSec"] | 0;

    return true;
}

// -----------------------------------------------------
// 서버 발급: segId 재발급(1..), segNo는 유지(사용자 정렬 목적)
// + segNo 중복/0 검증
// -----------------------------------------------------
static bool C10_reissueSegIdsAndValidateSegNos(ST_A20_ScheduleItem_t& p_s, const char* p_callerForLog) {
    // segNo 필수/0금지/중복금지
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        if (p_s.segments[v_i].segNo == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: segNo is 0 (idx=%u)",
                               (p_callerForLog ? p_callerForLog : "?"),
                               (unsigned)v_i);
            return false;
        }
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_s.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_j++) {
            if (p_s.segments[v_i].segNo == p_s.segments[v_j].segNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated segNo=%u",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)p_s.segments[v_i].segNo);
                return false;
            }
        }
    }

    // segId 서버 재발급(1..)
    uint8_t v_nextId = (uint8_t)G_C10_SEG_ID_START;
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        p_s.segments[v_i].segId = v_nextId;

        uint16_t v_tmp = (uint16_t)v_nextId + (uint16_t)G_C10_SEG_ID_STEP;
        if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_SEG_ID_START;
        v_nextId = (uint8_t)v_tmp;
    }

    // 재발급 후 segId 중복 마지막 방어
    for (uint8_t v_i = 0; v_i < p_s.segCount && v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        if (p_s.segments[v_i].segId == 0) return false;
        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_s.segCount && v_j < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_j++) {
            if (p_s.segments[v_i].segId == p_s.segments[v_j].segId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated segId=%u after reissue",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)p_s.segments[v_i].segId);
                return false;
            }
        }
    }

    return true;
}

// -----------------------------------------------------
// File Load 검증 (schId/schNo/segId/segNo 필수/0금지/중복/범위)
//  - 정렬/스텝 강제는 "선택"이므로 여기서는 강제하지 않음.
// -----------------------------------------------------
static bool C10_validateSchedulesLoaded(const ST_A20_SchedulesRoot_t& p_root, const char* p_callerForLog) {
    if (p_root.count > A20_Const::MAX_SCHEDULES) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] %s: schedules.count overflow(%u)",
                           (p_callerForLog ? p_callerForLog : "?"),
                           (unsigned)p_root.count);
        return false;
    }

    // schedule-level required + duplicates
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_root.items[v_i];

        if (v_s.schId == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: schId is 0 (idx=%u)",
                               (p_callerForLog ? p_callerForLog : "?"),
                               (unsigned)v_i);
            return false;
        }
        if (v_s.schNo == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: schNo is 0 (idx=%u)",
                               (p_callerForLog ? p_callerForLog : "?"),
                               (unsigned)v_i);
            return false;
        }

        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_root.count && v_j < A20_Const::MAX_SCHEDULES; v_j++) {
            if (p_root.items[v_i].schId == p_root.items[v_j].schId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated schId=%u",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)v_s.schId);
                return false;
            }
            if (p_root.items[v_i].schNo == p_root.items[v_j].schNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: duplicated schNo=%u",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)v_s.schNo);
                return false;
            }
        }

        // segment validation per schedule
        if (v_s.segCount > A20_Const::MAX_SEGMENTS_PER_SCHEDULE) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: segCount overflow(schId=%u, segCount=%u)",
                               (p_callerForLog ? p_callerForLog : "?"),
                               (unsigned)v_s.schId,
                               (unsigned)v_s.segCount);
            return false;
        }

        for (uint8_t v_k = 0; v_k < v_s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
            const ST_A20_ScheduleSegment_t& sg = v_s.segments[v_k];
            if (sg.segId == 0) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: segId is 0 (schId=%u, idx=%u)",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)v_s.schId,
                                   (unsigned)v_k);
                return false;
            }
            if (sg.segNo == 0) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[C10] %s: segNo is 0 (schId=%u, idx=%u)",
                                   (p_callerForLog ? p_callerForLog : "?"),
                                   (unsigned)v_s.schId,
                                   (unsigned)v_k);
                return false;
            }

            for (uint8_t v_m = (uint8_t)(v_k + 1); v_m < v_s.segCount && v_m < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_m++) {
                const ST_A20_ScheduleSegment_t& sg2 = v_s.segments[v_m];
                if (sg.segId == sg2.segId) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] %s: duplicated segId=%u (schId=%u)",
                                       (p_callerForLog ? p_callerForLog : "?"),
                                       (unsigned)sg.segId,
                                       (unsigned)v_s.schId);
                    return false;
                }
                if (sg.segNo == sg2.segNo) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[C10] %s: duplicated segNo=%u (schId=%u)",
                                       (p_callerForLog ? p_callerForLog : "?"),
                                       (unsigned)sg.segNo,
                                       (unsigned)v_s.schId);
                    return false;
                }
            }
        }
    }

    return true;
}

// -----------------------------------------------------
// Save 직전 마지막 방어선 검증
//  - runtime에서 CRUD/patch 등 다양한 경로가 있어도 저장 직전 재확인
// -----------------------------------------------------
static bool C10_validateSchedulesBeforeSave(const ST_A20_SchedulesRoot_t& p_cfg, const char* p_callerForLog) {
    return C10_validateSchedulesLoaded(p_cfg, p_callerForLog);
}


/*

// =====================================================
// [C10] 내부 Helper: "HH:MM" → minutes (0..1440)
// - CT10 parseHHMMtoMin 정책과 동일(24:00=1440 허용)
// - C10 모듈은 CT10 의존 금지 → 로컬 함수로 유지
// =====================================================
static uint16_t C10_parseHHMMtoMin_24h(const char* p_time) {
	if (!p_time || p_time[0] == '\0') return 0;

	while (*p_time == ' ' || *p_time == '\t' || *p_time == '\r' || *p_time == '\n') p_time++;
	if (p_time[0] == '\0') return 0;

	const char* v_colon = strchr(p_time, ':');
	if (!v_colon) return 0;

	char v_hhBuf[4];
	memset(v_hhBuf, 0, sizeof(v_hhBuf));
	size_t v_hhLen = (size_t)(v_colon - p_time);
	if (v_hhLen == 0 || v_hhLen >= sizeof(v_hhBuf)) return 0;
	memcpy(v_hhBuf, p_time, v_hhLen);

	const char* v_mmStr = v_colon + 1;
	if (!v_mmStr || v_mmStr[0] == '\0') return 0;

	char v_mmBuf[4];
	memset(v_mmBuf, 0, sizeof(v_mmBuf));

	size_t v_mmLen = strlen(v_mmStr);
	while (v_mmLen > 0) {
		char c = v_mmStr[v_mmLen - 1];
		if (c == ' ' || c == '\t' || c == '\r' || c == '\n') v_mmLen--;
		else break;
	}
	if (v_mmLen == 0 || v_mmLen > 2) return 0;
	memcpy(v_mmBuf, v_mmStr, v_mmLen);

	int v_hh = atoi(v_hhBuf);
	int v_mm = atoi(v_mmBuf);

	if (v_hh < 0) v_hh = 0;
	if (v_mm < 0) v_mm = 0;

	if (v_hh == 24) {
		if (v_mm == 0) return 1440;
		return 0;
	}

	if (v_hh > 23) v_hh = 23;
	if (v_mm > 59) v_mm = 59;

	return (uint16_t)(v_hh * 60 + v_mm);
}

*/


// ------------------------------------------------------
// C10_validateNoOverlapByDay()
//  - Schedules의 "요일별 시간 구간 겹침"을 검증한다.
//  - cross-midnight(자정 넘김)을 정확히 분해하여 요일별로 검사한다.
//  - p_failOnOverlap:
//      * true  : 겹치면 false 반환(저장 중단)
//      * false : warning 로그만 남기고 true 반환(저장 허용)
//
// 전제:
//  - A40_parseHHMMtoMin_24h()를 사용(24:00=1440 허용)
//  - start==end : "항상 OFF"로 처리하여 검증 대상에서 제외
//  - 구간은 [start,end) (end 미포함)으로 해석
// ------------------------------------------------------
static bool C10_validateNoOverlapByDay(const ST_A20_SchedulesRoot_t& p_root,
                                      bool p_failOnOverlap,
                                      const char* p_callerFunc = nullptr) {
    const char* v_caller = p_callerFunc ? p_callerFunc : "?";

    // 요일: 0=Mon..6=Sun (Config의 days[] 기준)
    // 분 단위 타임라인: 0..1440
    typedef struct {
        uint16_t startMin;
        uint16_t endMin;     // end는 1..1440 가능(24:00 포함)
        uint16_t schNo;
        uint8_t  schId;
        char     name[A20_Const::LEN_NAME];
    } ST_C10_Range_t;

    // day별 수집 버퍼 (스케줄 개수 * 최대 2구간)
    // 동적할당 피하려면 상한 기반 정적 배열로 처리
    ST_C10_Range_t v_ranges[7][A20_Const::MAX_SCHEDULES * 2];
    uint16_t       v_counts[7];
    memset(v_counts, 0, sizeof(v_counts));
    memset(v_ranges, 0, sizeof(v_ranges));

    // 1) day별 구간 수집
    for (uint8_t v_i = 0; v_i < p_root.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_root.items[v_i];
        if (!v_s.enabled) continue;

        uint16_t v_start = A40_parseHHMMtoMin_24h(v_s.period.startTime);
        uint16_t v_end   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

        // start/end 둘 중 하나라도 파싱 실패(0)인 경우 방어 로그 (단, "00:00"은 0이므로 구분 필요)
        // A40 파서의 반환 0은 "00:00"도 가능하므로 문자열을 같이 확인.
        // 여기서는 최소한 colon 여부가 없는 등 포맷 오류가 있을 수 있으니,
        // 포맷 검증은 C10 parse 레벨에서 이미 했다는 전제를 권장.
        // (운영: 필요하면 A40 파서 실패 구분을 별도 함수로 강화)
        // 정책: start==end는 항상OFF로 스킵
        if (v_start == v_end) {
            continue;
        }

        // end가 0이 되는 입력(예: "00:00")은 정상 -> end==0이면 다음날 0시 의미(허용)
        // 단, end==0이면 구간 계산은 [start,1440) 또는 [0,0) 등이 될 수 있어 정책이 필요.
        // 여기서는 end==0도 허용하며, cross-midnight 규칙으로 자연 처리됨.

        for (uint8_t v_day = 0; v_day < 7; v_day++) {
            if (!v_s.period.days[v_day]) continue;

            // same-day
            if (v_start < v_end) {
                uint16_t& v_cnt = v_counts[v_day];
                if (v_cnt < (A20_Const::MAX_SCHEDULES * 2)) {
                    ST_C10_Range_t& r = v_ranges[v_day][v_cnt++];
                    r.startMin = v_start;
                    r.endMin   = v_end;
                    r.schNo    = v_s.schNo;
                    r.schId    = v_s.schId;
                    memset(r.name, 0, sizeof(r.name));
                    strlcpy(r.name, v_s.name, sizeof(r.name));
                }
            } else {
                // cross-midnight: [start,1440) + [0,end)
                // part1
                {
                    uint16_t& v_cnt = v_counts[v_day];
                    if (v_cnt < (A20_Const::MAX_SCHEDULES * 2)) {
                        ST_C10_Range_t& r = v_ranges[v_day][v_cnt++];
                        r.startMin = v_start;
                        r.endMin   = 1440;
                        r.schNo    = v_s.schNo;
                        r.schId    = v_s.schId;
                        memset(r.name, 0, sizeof(r.name));
                        strlcpy(r.name, v_s.name, sizeof(r.name));
                    }
                }
                // part2
                {
                    uint16_t& v_cnt = v_counts[v_day];
                    if (v_cnt < (A20_Const::MAX_SCHEDULES * 2)) {
                        ST_C10_Range_t& r = v_ranges[v_day][v_cnt++];
                        r.startMin = 0;
                        r.endMin   = v_end;   // v_end가 0이면 [0,0)이라 의미없으니 아래에서 스킵될 수 있음
                        r.schNo    = v_s.schNo;
                        r.schId    = v_s.schId;
                        memset(r.name, 0, sizeof(r.name));
                        strlcpy(r.name, v_s.name, sizeof(r.name));
                    }
                }
            }
        }
    }

    // 2) day별 overlap 검사
    bool v_anyOverlap = false;

    for (uint8_t v_day = 0; v_day < 7; v_day++) {
        uint16_t v_cnt = v_counts[v_day];
        if (v_cnt <= 1) continue;

        // day 범위들을 startMin 기준 오름차순으로 정렬
        // (간단 삽입정렬: 데이터가 작고 임베디드에서 충분)
        for (uint16_t a = 1; a < v_cnt; a++) {
            ST_C10_Range_t key = v_ranges[v_day][a];
            int16_t b = (int16_t)a - 1;
            while (b >= 0) {
                ST_C10_Range_t& cur = v_ranges[v_day][(uint16_t)b];
                bool move = false;
                if (cur.startMin > key.startMin) move = true;
                else if (cur.startMin == key.startMin) {
                    // tie-breaker: endMin 큰 것 먼저로 두면 overlap 검사가 더 직관적
                    if (cur.endMin < key.endMin) move = true;
                }
                if (!move) break;
                v_ranges[v_day][(uint16_t)(b + 1)] = cur;
                b--;
            }
            v_ranges[v_day][(uint16_t)(b + 1)] = key;
        }

        // 정렬 후, 인접 구간만 보면 overlap 여부 판정 가능
        // overlap 조건: next.start < prev.end (half-open)
        for (uint16_t i = 0; i + 1 < v_cnt; i++) {
            const ST_C10_Range_t& r1 = v_ranges[v_day][i];
            const ST_C10_Range_t& r2 = v_ranges[v_day][i + 1];

            // [0,0) 같은 무의미 구간 방어
            if (r1.startMin >= r1.endMin) continue;
            if (r2.startMin >= r2.endMin) continue;

            if (r2.startMin < r1.endMin) {
                v_anyOverlap = true;

                // 요일 로그용 문자열
                static const char* s_dayName[7] = {"Mon","Tue","Wed","Thu","Fri","Sat","Sun"};

                CL_D10_Logger::log(
                    EN_L10_LOG_WARN,
                    "[C10][%s] Overlap detected day=%s: "
                    "A(schId=%u schNo=%u name=%s %u-%u) vs "
                    "B(schId=%u schNo=%u name=%s %u-%u)",
                    v_caller,
                    s_dayName[v_day],
                    (unsigned)r1.schId, (unsigned)r1.schNo, r1.name, (unsigned)r1.startMin, (unsigned)r1.endMin,
                    (unsigned)r2.schId, (unsigned)r2.schNo, r2.name, (unsigned)r2.startMin, (unsigned)r2.endMin
                );

                if (p_failOnOverlap) {
                    return false;
                }
            }
        }
    }

    if (v_anyOverlap && !p_failOnOverlap) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10][%s] Overlap exists but allowed by policy(warn-only)", v_caller);
    }

    return true;
}

/*
// =====================================================
// [C10] Save 직전 겹침 검증: 요일 단위로 시간구간 overlap 금지(운영 정책)
// -----------------------------------------------------
// [기능/정책]
// - 같은 요일에 활성(enabled) 스케줄들 사이에 시간 구간이 겹치면 false
// - 구간 판정: [start, end)  (end 미포함)
// - start==end: 24시간(0..1440) 활성로 간주(CT10 정책과 일치)
// - overnight(start > end): 두 조각으로 분해
//    1) (해당 요일) [start, 1440)
//    2) (다음 요일) [0, end)
// - days[]는 Config 기준: 0=Mon..6=Sun
//
// [왜 C10에서?]
// - 데이터 무결성/운영 안전을 위해 "저장 시점" 마지막 방어선에서 차단.
// - CT10은 런타임 우선순위(schNo 큰 것)로 1개 선택 가능하지만,
//   겹침 데이터는 UI/운영 혼선을 유발하므로 저장 자체를 거부하는 정책 권장.
// =====================================================
static bool C10_validateNoOverlapByDay(const ST_A20_SchedulesRoot_t& p_cfg, const char* p_callerForLog) {
	if (p_cfg.count <= 1) return true;

	auto v_isOverlap = [](uint16_t a0, uint16_t a1, uint16_t b0, uint16_t b1) -> bool {
		// empty guard
		if (a0 == a1 || b0 == b1) return false;
		return (a0 < b1) && (b0 < a1);
	};

	// 요일 0..6 각각 검사
	for (uint8_t v_day = 0; v_day < 7; v_day++) {
		for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
			const ST_A20_ScheduleItem_t& A = p_cfg.items[v_i];
			if (!A.enabled) continue;

			uint16_t A_start = A40_parseHHMMtoMin_24h(A.period.startTime);
			uint16_t A_end   = A40_parseHHMMtoMin_24h(A.period.endTime);

			struct _Seg { uint8_t day; uint16_t s; uint16_t e; };
			_Seg A_segs[2];
			uint8_t A_segCnt = 0;

			// 24h
			if (A_start == A_end) {
				if (A.period.days[v_day]) A_segs[A_segCnt++] = {v_day, 0, 1440};
			}
			// same-day
			else if (A_start < A_end) {
				if (A.period.days[v_day]) A_segs[A_segCnt++] = {v_day, A_start, A_end};
			}
			// overnight
			else {
				// today part
				if (A.period.days[v_day]) A_segs[A_segCnt++] = {v_day, A_start, 1440};

				// next-day part: v_day가 "A가 체크된 전날의 다음날"인 경우에 해당
				uint8_t v_prev = (v_day == 0) ? 6 : (uint8_t)(v_day - 1);
				if (A.period.days[v_prev]) A_segs[A_segCnt++] = {v_day, 0, A_end};
			}

			if (A_segCnt == 0) continue;

			for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_cfg.count && v_j < A20_Const::MAX_SCHEDULES; v_j++) {
				const ST_A20_ScheduleItem_t& B = p_cfg.items[v_j];
				if (!B.enabled) continue;

				uint16_t B_start = A40_parseHHMMtoMin_24h(B.period.startTime);
				uint16_t B_end   = A40_parseHHMMtoMin_24h(B.period.endTime);

				_Seg B_segs[2];
				uint8_t B_segCnt = 0;

				if (B_start == B_end) {
					if (B.period.days[v_day]) B_segs[B_segCnt++] = {v_day, 0, 1440};
				} else if (B_start < B_end) {
					if (B.period.days[v_day]) B_segs[B_segCnt++] = {v_day, B_start, B_end};
				} else {
					if (B.period.days[v_day]) B_segs[B_segCnt++] = {v_day, B_start, 1440};
					uint8_t v_prev2 = (v_day == 0) ? 6 : (uint8_t)(v_day - 1);
					if (B.period.days[v_prev2]) B_segs[B_segCnt++] = {v_day, 0, B_end};
				}

				if (B_segCnt == 0) continue;

				for (uint8_t a = 0; a < A_segCnt; a++) {
					for (uint8_t b = 0; b < B_segCnt; b++) {
						if (v_isOverlap(A_segs[a].s, A_segs[a].e, B_segs[b].s, B_segs[b].e)) {
							CL_D10_Logger::log(
								EN_L10_LOG_ERROR,
								"[C10] %s: schedule overlap day=%u "
								"(A schId=%u schNo=%u %s~%s, B schId=%u schNo=%u %s~%s)",
								(p_callerForLog ? p_callerForLog : "?"),
								(unsigned)v_day,
								(unsigned)A.schId, (unsigned)A.schNo, A.period.startTime, A.period.endTime,
								(unsigned)B.schId, (unsigned)B.schNo, B.period.startTime, B.period.endTime
							);
							return false;
						}
					}
				}
			}
		}
	}

	return true;
}

*/

// ------------------------------------------------------
// C10_sortSchedulesBySchNoDesc()
//  - schedules.items[]를 schNo 내림차순으로 정렬한다.
//  - tie-breaker: schId 내림차순 (결정성 확보)
// ------------------------------------------------------
static void C10_sortSchedulesBySchNoDesc(ST_A20_SchedulesRoot_t& p_root) {
    if (p_root.count <= 1) return;

    // 삽입정렬 (임베디드에서 단순/안전)
    for (uint8_t i = 1; i < p_root.count; i++) {
        ST_A20_ScheduleItem_t key = p_root.items[i];
        int16_t j = (int16_t)i - 1;

        while (j >= 0) {
            ST_A20_ScheduleItem_t& cur = p_root.items[(uint8_t)j];

            bool move = false;
            if (cur.schNo < key.schNo) move = true;                 // schNo desc
            else if (cur.schNo == key.schNo) {
                if (cur.schId < key.schId) move = true;             // schId desc
            }

            if (!move) break;

            p_root.items[(uint8_t)(j + 1)] = cur;
            j--;
        }

        p_root.items[(uint8_t)(j + 1)] = key;
    }
}



// =====================================================
// 2-1. Load (Schedules)
//  - 단독 호출(섹션 lazy-load) 대비: reset default 적용
//  - mutex 보호 / path empty 방어
//  - File Load에서는 schId/segId를 신뢰 가능한 소스로 간주하고 읽기 허용(검증은 수행)
// =====================================================
bool CL_C10_ConfigManager::loadSchedules(ST_A20_SchedulesRoot_t& p_cfg) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument d;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.schedules[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.schedules;

    if (!v_cfgJsonPath) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: s_cfgJsonFileMap.schedules empty", __func__);
        return false;
    }

    // default 먼저 적용
    A20_resetSchedulesDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Load_File2JsonDoc_V21 failed (%s)", __func__, v_cfgJsonPath);
        return false;
    }

    JsonArrayConst arr = d["schedules"].as<JsonArrayConst>();
    p_cfg.count        = 0;

    if (arr.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] %s: missing 'schedules' array (keep defaults)", __func__);
        return true;
    }

    for (JsonObjectConst js : arr) {
        if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

        ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
        memset(&s, 0, sizeof(s));

        // File Load: schId/segId 읽기 허용 + 필수/중복/0/범위 검증
        if (!C10_fromJson_ScheduleItem(js, s, true, false, false, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[C10] %s: schedule decode failed (idx=%u). Load rejected.",
                               __func__,
                               (unsigned)p_cfg.count);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        p_cfg.count++;
    }

    if (!C10_validateSchedulesLoaded(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Load rejected.", __func__);
        A20_resetSchedulesDefault(p_cfg);
        return false;
    }

    return true;
}

// =====================================================
// 2-2. Save (Schedules)
//  - mutex 보호 / path empty 방어
//  - save 직전 마지막 방어선 검증(schId/schNo/segId/segNo 필수/중복)
//  - overlap 검증(cross-midnight 분해 포함, C10 구현)
//    - p_failOnOverlap=true  -> 겹치면 저장 실패
//    - p_failOnOverlap=false -> warning만 남기고 저장은 진행
//  - 저장 시 schNo desc 정렬 저장(결정성/가독성/향후 정책 변경 대비)
// =====================================================
bool CL_C10_ConfigManager::saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg, bool p_failOnOverlap = false) {
    CL_A40_MutexGuard_Semaphore v_guard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.schedules[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: path empty (cfg map not loaded?)", __func__);
        return false;
    }

    // --------------------------------------------------
    // ✅ 마지막 방어선 1) 필수/0금지/중복 검증
    //  - schId/schNo/segId/segNo: 필수 + 0 금지 + 중복 금지
    //  - segNo/schNo는 사용자 정렬 목적이므로 중복 금지가 특히 중요(정렬/우선순위 불명확 방지)
    // --------------------------------------------------
    if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Save aborted.", __func__);
        return false;
    }

    // --------------------------------------------------
    // ✅ 마지막 방어선 2) 요일/시간 구간 overlap 검증
    //  - C10_validateNoOverlapByDay()는 cross-midnight를 [start,1440)+[0,end)로 분해하여 검사
    //  - 정책:
    //     * failOnOverlap=true  -> 저장 실패(운영 강제)
    //     * failOnOverlap=false -> 경고만 로그, 저장은 허용(운영 완화)
    // --------------------------------------------------
    if (!C10_validateNoOverlapByDay(p_cfg, p_failOnOverlap, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] %s: overlap validation failed (failOnOverlap=1). Save aborted.",
                           __func__);
        return false;
    }

    // --------------------------------------------------
    // ✅ 저장 순서 결정성: schNo desc 정렬 저장
    //  - p_cfg는 const 이므로 로컬 복사본을 만들어 정렬 후 사용
    //  - (향후) CT10 우선순위 정책 변경/디버깅 시 파일이 항상 우선순위 순으로 보여 유리
    // --------------------------------------------------
    ST_A20_SchedulesRoot_t v_sorted = p_cfg;
    C10_sortSchedulesBySchNoDesc(v_sorted);

    // --------------------------------------------------
    // JSON 구성
    //  - ArduinoJson v7 단일 JsonDocument 정책 준수
    //  - createNestedArray/Object 금지: .to<JsonObject>(), .to<JsonArray>() 사용은 허용 정책으로 간주
    // --------------------------------------------------
    JsonDocument d;
    JsonObject v_root = d.to<JsonObject>();

    // 샘플 cfg 형식 반영(있어도 되고 없어도 되는 메타이지만, 파일 식별/호환성에 도움)
    v_root["version"]  = "025";
    v_root["jsonFile"] = "cfg_schedules_025.json";

    // schedules 배열
    JsonArray v_jsSchedules = v_root["schedules"].to<JsonArray>();

    const uint8_t v_maxSch = (v_sorted.count < A20_Const::MAX_SCHEDULES) ? v_sorted.count : A20_Const::MAX_SCHEDULES;

    for (uint8_t v_i = 0; v_i < v_maxSch; v_i++) {
        const ST_A20_ScheduleItem_t& s = v_sorted.items[v_i];

        JsonObject js = v_jsSchedules.add().to<JsonObject>();

        js["schId"]          = s.schId;
        js["schNo"]          = s.schNo;
        js["name"]           = s.name;
        js["enabled"]        = s.enabled;
        js["repeatSegments"] = s.repeatSegments;
        js["repeatCount"]    = s.repeatCount;

        // period
        JsonObject jp = js["period"].to<JsonObject>();
        JsonArray  jd = jp["days"].to<JsonArray>();
        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            jd.add((bool)s.period.days[v_d]);
        }
        jp["startTime"] = s.period.startTime;
        jp["endTime"]   = s.period.endTime;

        // segments
        JsonArray v_jsSegs = js["segments"].to<JsonArray>();
        const uint8_t v_maxSeg = (s.segCount < A20_Const::MAX_SEGMENTS_PER_SCHEDULE) ? s.segCount : A20_Const::MAX_SEGMENTS_PER_SCHEDULE;

        for (uint8_t v_k = 0; v_k < v_maxSeg; v_k++) {
            const ST_A20_ScheduleSegment_t& sg = s.segments[v_k];

            JsonObject jseg = v_jsSegs.add().to<JsonObject>();

            jseg["segId"]      = sg.segId;
            jseg["segNo"]      = sg.segNo;
            jseg["onMinutes"]  = sg.onMinutes;
            jseg["offMinutes"] = sg.offMinutes;

            // mode/preset/style
            jseg["mode"]       = A20_modeToString(sg.mode);
            jseg["presetCode"] = sg.presetCode;
            jseg["styleCode"]  = sg.styleCode;

            // adjust
            JsonObject adj = jseg["adjust"].to<JsonObject>();
            adj["windIntensity"]            = sg.adjust.windIntensity;
            adj["windVariability"]          = sg.adjust.windVariability;
            adj["gustFrequency"]            = sg.adjust.gustFrequency;
            adj["fanLimit"]                 = sg.adjust.fanLimit;
            adj["minFan"]                   = sg.adjust.minFan;
            adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;
            adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;
            adj["thermalBubbleStrength"]    = sg.adjust.thermalBubbleStrength;
            adj["thermalBubbleRadius"]      = sg.adjust.thermalBubbleRadius;

            // fixed
            jseg["fixedSpeed"] = sg.fixedSpeed;
        }

        // ✅ A40 공통 writer 사용(필드 누락/오타 방지)
        A40_ComFunc::Json_writeAutoOff(js["autoOff"].to<JsonObject>(), s.autoOff);
        A40_ComFunc::Json_writeMotion(js, s.motion);
    }

    // --------------------------------------------------
    // 파일 저장(.tmp atomic + .bak) - A40 IO
    // --------------------------------------------------
    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.schedules, d, true, true, __func__);
}

/*
// =====================================================
// 2-2. Save (Schedules)
//  - mutex 보호 / path empty 방어
//  - save 직전 마지막 방어선 검증(schId/schNo/segId/segNo 필수/중복)
//    - p_failOnOverlap=true  -> 겹치면 저장 실패
//    - p_failOnOverlap=false -> warning만 남기고 저장은 진행
// =====================================================
bool CL_C10_ConfigManager::saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg, bool p_failOnOverlap=false) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.schedules[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: path empty (cfg map not loaded?)", __func__);
        return false;
    }

    
    // ✅ 마지막 방어선 1) 필수/0금지/중복 검증
	if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Save aborted.", __func__);
		return false;
	}

	// ✅ 마지막 방어선 2) 요일/시간 구간 overlap 금지(운영 정책)
	if (!C10_validateNoOverlapByDay(p_cfg, p_failOnOverlap, __func__)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveSchedules: overlap validation failed (failOnOverlap=1)");
		return false;
	}
	
    // --------------------------------------------------
    // 2) schNo desc 정렬 저장
    //    - 향후 정책 변경 대비(우선순위 시각화/결정성)
    // --------------------------------------------------
    C10_sortSchedulesBySchNoDesc(p_cfg);

    JsonDocument d;

    for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& s = p_cfg.items[v_i];

        JsonObject js = d["schedules"][v_i].to<JsonObject>();

        js["schId"]          = s.schId;
        js["schNo"]          = s.schNo;
        js["name"]           = s.name;
        js["enabled"]        = s.enabled;
        js["repeatSegments"] = s.repeatSegments;
        js["repeatCount"]    = s.repeatCount;

        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            js["period"]["days"][v_d] = s.period.days[v_d];
        }
        js["period"]["startTime"] = s.period.startTime;
        js["period"]["endTime"]   = s.period.endTime;

        for (uint8_t v_k = 0; v_k < s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
            const ST_A20_ScheduleSegment_t& sg   = s.segments[v_k];
            JsonObject                      jseg = js["segments"][v_k].to<JsonObject>();

            jseg["segId"]      = sg.segId;
            jseg["segNo"]      = sg.segNo;
            jseg["onMinutes"]  = sg.onMinutes;
            jseg["offMinutes"] = sg.offMinutes;

            jseg["mode"]       = A20_modeToString(sg.mode);
            jseg["presetCode"] = sg.presetCode;
            jseg["styleCode"]  = sg.styleCode;

            JsonObject adj                  = jseg["adjust"].to<JsonObject>();
            adj["windIntensity"]            = sg.adjust.windIntensity;
            adj["windVariability"]          = sg.adjust.windVariability;
            adj["gustFrequency"]            = sg.adjust.gustFrequency;
            adj["fanLimit"]                 = sg.adjust.fanLimit;
            adj["minFan"]                   = sg.adjust.minFan;
            adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;
            adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;
            adj["thermalBubbleStrength"]    = sg.adjust.thermalBubbleStrength;
            adj["thermalBubbleRadius"]      = sg.adjust.thermalBubbleRadius;

            jseg["fixedSpeed"] = sg.fixedSpeed;
        }

        // ✅ A40 공통 writer 사용(필드 누락/오타 방지)
        A40_ComFunc::Json_writeAutoOff(js["autoOff"].to<JsonObject>(), s.autoOff);
        A40_ComFunc::Json_writeMotion(js, s.motion);
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.schedules, d, true, true, __func__);
}
*/
// =====================================================
// 3. JSON Export (Schedules)
//  - mutex 보호 / doc 잔재 방지(remove)
//  - (선택) export 직전 검증도 수행(운영 안정)
// =====================================================
void CL_C10_ConfigManager::toJson_Schedules(const ST_A20_SchedulesRoot_t& p_cfg, JsonDocument& d) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    // 잔재 방지
    A40_ComFunc::Json_removeKey(d, "schedules");

    // export 전 검증(운영 안정 목적)
    if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed. Export aborted.", __func__);
        return;
    }

    for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& s  = p_cfg.items[v_i];
        JsonObject                   js = d["schedules"][v_i].to<JsonObject>();

        js["schId"]          = s.schId;
        js["schNo"]          = s.schNo;
        js["name"]           = s.name;
        js["enabled"]        = s.enabled;
        js["repeatSegments"] = s.repeatSegments;
        js["repeatCount"]    = s.repeatCount;

        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            js["period"]["days"][v_d] = s.period.days[v_d];
        }
        js["period"]["startTime"] = s.period.startTime;
        js["period"]["endTime"]   = s.period.endTime;

        for (uint8_t v_k = 0; v_k < s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
            const ST_A20_ScheduleSegment_t& sg   = s.segments[v_k];
            JsonObject                      jseg = js["segments"][v_k].to<JsonObject>();

            jseg["segId"]      = sg.segId;
            jseg["segNo"]      = sg.segNo;
            jseg["onMinutes"]  = sg.onMinutes;
            jseg["offMinutes"] = sg.offMinutes;
            jseg["mode"]       = A20_modeToString(sg.mode);
            jseg["presetCode"] = sg.presetCode;
            jseg["styleCode"]  = sg.styleCode;

            JsonObject adj                  = jseg["adjust"].to<JsonObject>();
            adj["windIntensity"]            = sg.adjust.windIntensity;
            adj["windVariability"]          = sg.adjust.windVariability;
            adj["gustFrequency"]            = sg.adjust.gustFrequency;
            adj["fanLimit"]                 = sg.adjust.fanLimit;
            adj["minFan"]                   = sg.adjust.minFan;
            adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;
            adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;
            adj["thermalBubbleStrength"]    = sg.adjust.thermalBubbleStrength;
            adj["thermalBubbleRadius"]      = sg.adjust.thermalBubbleRadius;

            jseg["fixedSpeed"] = sg.fixedSpeed;
        }

        // ✅ A40 공통 writer 사용
        A40_ComFunc::Json_writeAutoOff(js["autoOff"].to<JsonObject>(), s.autoOff);
        A40_ComFunc::Json_writeMotion(js, s.motion);
    }
}

// =====================================================
// 4. JSON Patch (Schedules)
//  - PUT(전체 replace) 고정
//    * API 입력 schId/segId 무시(서버 발급)
//    * schNo/segNo 필수/0금지/중복검증
//    * segId 서버 재발급(1..)
// =====================================================
bool CL_C10_ConfigManager::patchSchedulesFromJson(ST_A20_SchedulesRoot_t& p_cfg, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonArrayConst arr = p_patch["schedules"].as<JsonArrayConst>();
    if (arr.isNull()) {
        return false;
    }

    // defaults + reset
    A20_resetSchedulesDefault(p_cfg);
    p_cfg.count = 0;

    // schId 서버 발급(1..)
    uint8_t v_nextSchId = (uint8_t)G_C10_SCH_ID_START;

    for (JsonObjectConst js : arr) {
        if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

        ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
        memset(&s, 0, sizeof(s));

        // schId 발급(입력 무시)
        s.schId = v_nextSchId;

        // decode (schId는 keep, segId는 무시/재발급 예정)
        if (!C10_fromJson_ScheduleItem(js, s, false, true, true, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: decode failed. Patch rejected.", __func__);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        // schNo 중복 즉시 검증
        if (C10_isSchNoDuplicated(p_cfg, s.schNo, p_cfg.count)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated schNo=%u. Patch rejected.", __func__, (unsigned)s.schNo);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        // segId 재발급 + segNo 중복 검증
        if (!C10_reissueSegIdsAndValidateSegNos(s, __func__)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: segment validation failed. Patch rejected.", __func__);
            A20_resetSchedulesDefault(p_cfg);
            return false;
        }

        p_cfg.count++;

        // next schId
        {
            uint16_t v_tmp = (uint16_t)v_nextSchId + (uint16_t)G_C10_SCH_ID_STEP;
            if (v_tmp == 0u || v_tmp > 255u) v_tmp = (uint16_t)G_C10_SCH_ID_START;
            v_nextSchId = (uint8_t)v_tmp;
        }
    }

    // 마지막 전체 검증(필수/중복/0)
    if (!C10_validateSchedulesBeforeSave(p_cfg, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: validation failed after patch. Rejected.", __func__);
        A20_resetSchedulesDefault(p_cfg);
        return false;
    }

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedules patched (PUT). Dirty=true");

    return true;
}

// =====================================================
// 5. CRUD - Schedules
//  (g_A20_config_root.schedules 대상으로 동작)
//  - new 실패 방어(nothrow)
//  - add: schId 서버 발급 / schNo 필수/중복검증 / segId 서버 발급 / segNo 필수/중복검증
//  - update=PUT: schId 유지 + segId 서버 재발급 + schNo/segNo 필수/중복검증 강화
// =====================================================

// ---------- Schedule CRUD ----------
int CL_C10_ConfigManager::addScheduleFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return -1;
    }

    if (!g_A20_config_root.schedules) {
        g_A20_config_root.schedules = new (std::nothrow) ST_A20_SchedulesRoot_t();
        if (!g_A20_config_root.schedules) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: new failed (out of memory)");
            return -1;
        }
        A20_resetSchedulesDefault(*g_A20_config_root.schedules);
    }

    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    if (v_root.count >= A20_Const::MAX_SCHEDULES) {
        return -1;
    }

    JsonObjectConst js = p_doc["schedule"].is<JsonObjectConst>() ? p_doc["schedule"].as<JsonObjectConst>()
                                                                 : p_doc.as<JsonObjectConst>();

    // schNo 필수/0금지/중복검증
    uint32_t v_schNo32 = (uint32_t)(js["schNo"] | 0u);
    if (v_schNo32 == 0u || v_schNo32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: invalid schNo=%u", (unsigned)v_schNo32);
        return -2;
    }
    uint16_t v_schNo = (uint16_t)v_schNo32;

    if (C10_isSchNoDuplicated(v_root, v_schNo, 255)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: duplicated schNo=%u", (unsigned)v_schNo);
        return -3;
    }

    ST_A20_ScheduleItem_t& s = v_root.items[v_root.count];
    memset(&s, 0, sizeof(s));

    // schId 서버 발급
    s.schId = C10_nextScheduleId_u8(v_root);

    // decode (schId keep, segId ignore)
    if (!C10_fromJson_ScheduleItem(js, s, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: decode failed");
        return -4;
    }

    // segId 재발급 + segNo 검증
    if (!C10_reissueSegIdsAndValidateSegNos(s, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: segment validation failed");
        return -5;
    }

    // schId 중복 방어(랩/충돌 시)
    if (C10_isSchIdDuplicated(v_root, s.schId, v_root.count)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: duplicated schId=%u", (unsigned)s.schId);
        return -6;
    }

    int v_index = (int)v_root.count;
    v_root.count++;

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] Schedule added (index=%d, schId=%u, schNo=%u)",
                       v_index,
                       (unsigned)s.schId,
                       (unsigned)s.schNo);

    return v_index;
}

// update=PUT 고정: 요청은 "전체 replace" 의미
//  - schId 유지(요청 schId 무시)
//  - segId 서버 재발급
//  - schNo/segNo 필수/0금지/중복검증 강화
bool CL_C10_ConfigManager::updateScheduleFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.schedules) {
        return false;
    }

    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_root.items[v_i].schId == (uint8_t)p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    JsonObjectConst js = p_patch["schedule"].is<JsonObjectConst>() ? p_patch["schedule"].as<JsonObjectConst>()
                                                                   : p_patch.as<JsonObjectConst>();

    // schNo 필수(요청에서 반드시 있어야 함) + 중복검증
    uint32_t v_schNo32 = (uint32_t)(js["schNo"] | 0u);
    if (v_schNo32 == 0u || v_schNo32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: invalid schNo=%u", (unsigned)v_schNo32);
        return false;
    }
    uint16_t v_newSchNo = (uint16_t)v_schNo32;

    // 다른 스케줄과 schNo 중복 금지
    if (C10_isSchNoDuplicated(v_root, v_newSchNo, (uint8_t)v_idx)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[C10] updateSchedule: duplicated schNo=%u (schId=%u)",
                           (unsigned)v_newSchNo,
                           (unsigned)p_id);
        return false;
    }

    // schId 유지
    uint8_t v_keepId = v_root.items[(uint8_t)v_idx].schId;

    // PUT: 기존 항목을 통째로 replace
    ST_A20_ScheduleItem_t v_new;
    memset(&v_new, 0, sizeof(v_new));
    v_new.schId = v_keepId;

    // decode (schId keep, segId ignore)
    if (!C10_fromJson_ScheduleItem(js, v_new, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: decode failed (schId=%u)", (unsigned)v_keepId);
        return false;
    }

    // segId 재발급 + segNo 검증
    if (!C10_reissueSegIdsAndValidateSegNos(v_new, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: segment validation failed (schId=%u)", (unsigned)v_keepId);
        return false;
    }

    // apply
    v_root.items[(uint8_t)v_idx] = v_new;

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] Schedule updated (PUT, schId=%u, index=%d, schNo=%u)",
                       (unsigned)p_id,
                       v_idx,
                       (unsigned)v_root.items[(uint8_t)v_idx].schNo);

    return true;
}

bool CL_C10_ConfigManager::deleteSchedule(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.schedules) {
        return false;
    }

    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_root.items[v_i].schId == (uint8_t)p_id) {
            v_idx = (int)v_i;
            break;
        }
    }
    if (v_idx < 0) {
        return false;
    }

    for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        v_root.items[v_i - 1] = v_root.items[v_i];
    }
    if (v_root.count > 0) v_root.count--;

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule deleted (schId=%u, index=%d)", (unsigned)p_id, v_idx);

    return true;
}