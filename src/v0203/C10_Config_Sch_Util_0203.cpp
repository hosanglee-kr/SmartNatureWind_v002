/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Sch_Util_0203.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - Schedule (Util/Validators)
 * ------------------------------------------------------
 * [E-2.3] C10_Config_Sch_0203.cpp에서 helper 이관
 *  - 9개 helper 정의 (declarations: C10_Config_Sch_Internal_0203.h)
 *  - Dead code 정리: 4개 helper (segId/segNo auto-issuance) 제거
 * ------------------------------------------------------
 */

#include "C10_Config_Sch_Internal_0203.h"

#include "A40_Com_Utils_0203.h"    // A40_ComFunc / CL_A40_MutexGuard_Semaphore
#include "A22_Com_Lookup_0203.h"   // A20_modeFromString
#include "A23_Com_ResetCfg_0203.h" // A20_resetXxxDefault

#include <string.h>

// =====================================================
// Helper 구현
// =====================================================

uint8_t C10_nextScheduleId_u8(const ST_A20_SchedulesRoot_t& p_root) {
    uint8_t v_max = 0;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (p_root.items[v_i].schId > v_max) v_max = p_root.items[v_i].schId;
    }

    uint16_t v_next = (uint16_t)v_max + (uint16_t)G_C10_SCH_ID_STEP;
    if (v_next == 0u) v_next = (uint16_t)G_C10_SCH_ID_START;
    if (v_next > 255u) return (uint8_t)G_C10_SCH_ID_START;
    if (v_next < (uint16_t)G_C10_SCH_ID_START) return (uint8_t)G_C10_SCH_ID_START;
    return (uint8_t)v_next;
}

bool C10_isSchIdDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint8_t p_schId, uint8_t p_excludeIndex) {
    if (p_schId == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].schId == p_schId) return true;
    }
    return false;
}

bool C10_isSchNoDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint16_t p_schNo, uint8_t p_excludeIndex) {
    if (p_schNo == 0) return true;
    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_i == p_excludeIndex) continue;
        if (p_root.items[v_i].schNo == p_schNo) return true;
    }
    return false;
}

// -----------------------------------------------------
// JSON → struct decode
// -----------------------------------------------------
bool C10_fromJson_ScheduleItem(const JsonObjectConst& p_js,
                               ST_A20_ScheduleItem_t& p_s,
                               bool                   p_allowIdRead,
                               bool                   p_forceSchIdKeep,
                               bool                   p_forceReissueSegId,
                               const char*            p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    // schId
    if (!p_forceSchIdKeep) {
        if (p_allowIdRead) {
            uint16_t v_inId = (uint16_t)(p_js["schId"] | 0);
            if (v_inId == 0u || v_inId > 255u) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid schId=%u", v_caller, (unsigned)v_inId);
                return false;
            }
            p_s.schId = (uint8_t)v_inId;
        }
    }

    // schNo (필수)
    {
        uint32_t v_no = (uint32_t)(p_js["schNo"] | 0u);
        if (v_no == 0u || v_no > 65535u) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: invalid schNo=%u", v_caller, (unsigned)v_no);
            return false;
        }
        p_s.schNo = (uint16_t)v_no;
    }

    A40_ComFunc::Json_copyStr_LogPolicy(p_js, "name", p_s.name, sizeof(p_s.name), "", p_callerForLog);
    p_s.enabled = p_js["enabled"] | true;

    // [v0203 단일 규격] profileId 참조 디코딩 (트리거만 유지)
    p_s.profileId = (uint8_t)(p_js["profileId"] | 0u);

    // period
    p_s.period.enabled = A40_ComFunc::Json_getBool(p_js["period"], "enabled", true);

    {
        JsonArrayConst jDays = p_js["period"]["days"].as<JsonArrayConst>();
        for (uint8_t v_d = 0; v_d < 7; v_d++) {
            uint8_t v_val = 1;
            if (!jDays.isNull() && v_d < jDays.size()) {
                JsonVariantConst vv = jDays[v_d];
                if (vv.is<bool>())
                    v_val = vv.as<bool>() ? 1 : 0;
                else if (vv.is<int>())
                    v_val = (vv.as<int>() != 0) ? 1 : 0;
            }
            p_s.period.days[v_d] = v_val;
        }
    }

    A40_ComFunc::copyStr2Buffer_safe(p_s.period.startTime,
                                     p_js["period"]["startTime"] | "00:00",
                                     sizeof(p_s.period.startTime),
                                     p_callerForLog);
    A40_ComFunc::copyStr2Buffer_safe(p_s.period.endTime,
                                     p_js["period"]["endTime"] | "23:59",
                                     sizeof(p_s.period.endTime),
                                     p_callerForLog);

    return true;
}

// -----------------------------------------------------
// segId 재발급 + segNo 필수/중복 검증 (단일 규격: No-op)
// -----------------------------------------------------
bool C10_reissueSegIdsAndValidateSegNos(ST_A20_ScheduleItem_t& p_s, const char* p_callerForLog) {
    (void)p_s;
    (void)p_callerForLog;
    return true;
}

// -----------------------------------------------------
// File Load 검증
// -----------------------------------------------------
bool C10_validateSchedulesLoaded(const ST_A20_SchedulesRoot_t& p_root, const char* p_callerForLog) {
    const char* v_caller = (p_callerForLog ? p_callerForLog : "?");

    if (p_root.count > A20_Const::MAX_SCHEDULES) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: schedules.count overflow(%u)", v_caller, (unsigned)p_root.count);
        return false;
    }

    for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_root.items[v_i];

        if (v_s.schId == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: schId is 0 (idx=%u)", v_caller, (unsigned)v_i);
            return false;
        }
        if (v_s.schNo == 0) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: schNo is 0 (idx=%u)", v_caller, (unsigned)v_i);
            return false;
        }

        for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_root.count && v_j < A20_Const::MAX_SCHEDULES; v_j++) {
            if (p_root.items[v_i].schId == p_root.items[v_j].schId) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated schId=%u", v_caller, (unsigned)v_s.schId);
                return false;
            }
            if (p_root.items[v_i].schNo == p_root.items[v_j].schNo) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: duplicated schNo=%u", v_caller, (unsigned)v_s.schNo);
                return false;
            }
        }
    }
    return true;
}

bool C10_validateSchedulesBeforeSave(const ST_A20_SchedulesRoot_t& p_cfg, const char* p_callerForLog) {
    return C10_validateSchedulesLoaded(p_cfg, p_callerForLog);
}

// -----------------------------------------------------
// NoOverlap 검증 (cross-midnight 분해)
// -----------------------------------------------------
bool C10_validateNoOverlapByDay(const ST_A20_SchedulesRoot_t& p_root, bool p_failOnOverlap, const char* p_callerFunc) {
    const char* v_caller = p_callerFunc ? p_callerFunc : "?";

    typedef struct {
        uint16_t startMin;
        uint16_t endMin;
        uint8_t  itemIdx;
    } ST_C10_Range_t;

    static ST_C10_Range_t v_ranges[7][A20_Const::MAX_SCHEDULES * 2];
    static uint16_t       v_counts[7];
    memset(v_counts, 0, sizeof(v_counts));

    for (uint8_t v_i = 0; v_i < p_root.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_root.items[v_i];
        if (!v_s.enabled) continue;

        uint16_t v_start = A40_parseHHMMtoMin_24h(v_s.period.startTime);
        uint16_t v_end   = A40_parseHHMMtoMin_24h(v_s.period.endTime);
        if (v_start == v_end) continue;

        for (uint8_t v_day = 0; v_day < 7; v_day++) {
            if (!v_s.period.days[v_day]) continue;

            if (v_start < v_end) {
                uint16_t& v_cnt = v_counts[v_day];
                if (v_cnt < (A20_Const::MAX_SCHEDULES * 2)) {
                    ST_C10_Range_t& r = v_ranges[v_day][v_cnt++];
                    r.startMin        = v_start;
                    r.endMin          = v_end;
                    r.itemIdx         = v_i;
                }
            } else {
                {
                    uint16_t& v_cnt = v_counts[v_day];
                    if (v_cnt < (A20_Const::MAX_SCHEDULES * 2)) {
                        ST_C10_Range_t& r = v_ranges[v_day][v_cnt++];
                        r.startMin        = v_start;
                        r.endMin          = 1440;
                        r.itemIdx         = v_i;
                    }
                }
                {
                    uint16_t& v_cnt = v_counts[v_day];
                    if (v_cnt < (A20_Const::MAX_SCHEDULES * 2)) {
                        ST_C10_Range_t& r = v_ranges[v_day][v_cnt++];
                        r.startMin        = 0;
                        r.endMin          = v_end;
                        r.itemIdx         = v_i;
                    }
                }
            }
        }
    }

    bool v_anyOverlap = false;

    for (uint8_t v_day = 0; v_day < 7; v_day++) {
        uint16_t v_cnt = v_counts[v_day];
        if (v_cnt <= 1) continue;

        for (uint16_t a = 1; a < v_cnt; a++) {
            ST_C10_Range_t key = v_ranges[v_day][a];
            int16_t        b   = (int16_t)a - 1;
            while (b >= 0) {
                ST_C10_Range_t& cur  = v_ranges[v_day][(uint16_t)b];
                bool            move = false;
                if (cur.startMin > key.startMin)
                    move = true;
                else if (cur.startMin == key.startMin) {
                    if (cur.endMin < key.endMin) move = true;
                }
                if (!move) break;
                v_ranges[v_day][(uint16_t)(b + 1)] = cur;
                b--;
            }
            v_ranges[v_day][(uint16_t)(b + 1)] = key;
        }

        for (uint16_t i = 0; i + 1 < v_cnt; i++) {
            const ST_C10_Range_t& r1 = v_ranges[v_day][i];
            const ST_C10_Range_t& r2 = v_ranges[v_day][i + 1];

            if (r1.startMin >= r1.endMin) continue;
            if (r2.startMin >= r2.endMin) continue;

            if (r2.startMin < r1.endMin) {
                v_anyOverlap = true;

                static const char*           s_dayName[7] = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
                const ST_A20_ScheduleItem_t& v_s1         = p_root.items[r1.itemIdx];
                const ST_A20_ScheduleItem_t& v_s2         = p_root.items[r2.itemIdx];

                CL_D10_Logger::log(EN_L10_LOG_WARN,
                                   "[C10][%s] Overlap detected day=%s: "
                                   "A(schId=%u schNo=%u name=%s %u-%u) vs "
                                   "B(schId=%u schNo=%u name=%s %u-%u)",
                                   v_caller,
                                   s_dayName[v_day],
                                   (unsigned)v_s1.schId,
                                   (unsigned)v_s1.schNo,
                                   v_s1.name,
                                   (unsigned)r1.startMin,
                                   (unsigned)r1.endMin,
                                   (unsigned)v_s2.schId,
                                   (unsigned)v_s2.schNo,
                                   v_s2.name,
                                   (unsigned)r2.startMin,
                                   (unsigned)r2.endMin);

                if (p_failOnOverlap) return false;
            }
        }
    }

    if (v_anyOverlap && !p_failOnOverlap) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10][%s] Overlap exists but allowed by policy(warn-only)", v_caller);
    }
    return true;
}

// -----------------------------------------------------
// schNo desc 정렬
// -----------------------------------------------------
void C10_sortSchedulesBySchNoDesc(ST_A20_SchedulesRoot_t& p_root) {
    if (p_root.count <= 1) return;

    static ST_A20_ScheduleItem_t key;

    for (uint8_t i = 1; i < p_root.count; i++) {
        memcpy(&key, &p_root.items[i], sizeof(key));

        int16_t j = (int16_t)i - 1;
        while (j >= 0) {
            const ST_A20_ScheduleItem_t& cur = p_root.items[(uint8_t)j];

            bool move = false;
            if (cur.schNo < key.schNo)
                move = true;
            else if (cur.schNo == key.schNo) {
                if (cur.schId < key.schId) move = true;
            }
            if (!move) break;

            memcpy(&p_root.items[(uint8_t)(j + 1)], &cur, sizeof(ST_A20_ScheduleItem_t));
            j--;
        }
        memcpy(&p_root.items[(uint8_t)(j + 1)], &key, sizeof(key));
    }
}
