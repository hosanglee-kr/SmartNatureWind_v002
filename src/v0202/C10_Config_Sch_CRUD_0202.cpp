/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Sch_CRUD_0202.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - Schedule (CRUD)
 * ------------------------------------------------------
 * [E-2.3] add/update/delete 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0202.h"
#include "C10_Config_Sch_Internal_0202.h"

#include "A40_Com_Utils_0202.h"
#include "A23_Com_ResetCfg_0202.h"

#include <new>
#include <string.h>

// ---------- Add ----------
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

    if (v_root.count >= A20_Const::MAX_SCHEDULES) return -1;

    JsonObjectConst js = p_doc["schedule"].is<JsonObjectConst>()
                             ? p_doc["schedule"].as<JsonObjectConst>()
                             : p_doc.as<JsonObjectConst>();

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

    s.schId = C10_nextScheduleId_u8(v_root);

    if (!C10_fromJson_ScheduleItem(js, s, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: decode failed");
        return -4;
    }

    if (!C10_reissueSegIdsAndValidateSegNos(s, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: segment validation failed");
        return -5;
    }

    if (C10_isSchIdDuplicated(v_root, s.schId, v_root.count)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: duplicated schId=%u", (unsigned)s.schId);
        return -6;
    }

    int v_index = (int)v_root.count;
    v_root.count++;

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule added (index=%d, schId=%u, schNo=%u)",
                       v_index, (unsigned)s.schId, (unsigned)s.schNo);
    return v_index;
}

// ---------- Update (PUT) ----------
bool CL_C10_ConfigManager::updateScheduleFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.schedules) return false;
    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_root.items[v_i].schId == (uint8_t)p_id) { v_idx = (int)v_i; break; }
    }
    if (v_idx < 0) return false;

    JsonObjectConst js = p_patch["schedule"].is<JsonObjectConst>()
                             ? p_patch["schedule"].as<JsonObjectConst>()
                             : p_patch.as<JsonObjectConst>();

    uint32_t v_schNo32 = (uint32_t)(js["schNo"] | 0u);
    if (v_schNo32 == 0u || v_schNo32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: invalid schNo=%u", (unsigned)v_schNo32);
        return false;
    }
    uint16_t v_newSchNo = (uint16_t)v_schNo32;

    if (C10_isSchNoDuplicated(v_root, v_newSchNo, (uint8_t)v_idx)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: duplicated schNo=%u (schId=%u)",
                           (unsigned)v_newSchNo, (unsigned)p_id);
        return false;
    }

    uint8_t v_keepId = v_root.items[(uint8_t)v_idx].schId;

    static ST_A20_ScheduleItem_t v_new;
    memset(&v_new, 0, sizeof(v_new));
    v_new.schId = v_keepId;

    if (!C10_fromJson_ScheduleItem(js, v_new, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: decode failed (schId=%u)", (unsigned)v_keepId);
        return false;
    }

    if (!C10_reissueSegIdsAndValidateSegNos(v_new, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: segment validation failed (schId=%u)", (unsigned)v_keepId);
        return false;
    }

    memcpy(&v_root.items[(uint8_t)v_idx], &v_new, sizeof(ST_A20_ScheduleItem_t));

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule updated (PUT, schId=%u, index=%d, schNo=%u)",
                       (unsigned)p_id, v_idx, (unsigned)v_root.items[(uint8_t)v_idx].schNo);
    return true;
}

// ---------- Delete ----------
bool CL_C10_ConfigManager::deleteSchedule(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.schedules) return false;
    ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        if (v_root.items[v_i].schId == (uint8_t)p_id) { v_idx = (int)v_i; break; }
    }
    if (v_idx < 0) return false;

    for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        v_root.items[v_i - 1] = v_root.items[v_i];
    }
    if (v_root.count > 0) v_root.count--;

    A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule deleted (schId=%u, index=%d)", (unsigned)p_id, v_idx);
    return true;
}
