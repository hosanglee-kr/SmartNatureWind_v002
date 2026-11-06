/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_CRUD_0201.cpp
 * 모듈 약어 : C10
 * 모듈명 : Config Manager - UserProfiles (CRUD)
 * ------------------------------------------------------
 * [E-2.6] add/update/delete 이관
 * ------------------------------------------------------
 */

#include "C10_Config_0201.h"
#include "C10_Config_UzProf_Internal_0201.h"

#include "A25_Com_Utils_0201.h"
#include "A23_Com_ResetCfg_0201.h"

#include <new>
#include <string.h>

int CL_C10_ConfigManager::addUserProfilesFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return -1;
    }

    if (!g_A20_config_root.userProfiles) {
        g_A20_config_root.userProfiles = new (std::nothrow) ST_A20_UserProfilesRoot_t();
        if (!g_A20_config_root.userProfiles) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: new failed (out of memory)");
            return -1;
        }
        A20_resetUserProfilesDefault(*g_A20_config_root.userProfiles);
    }

    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    if (v_root.count >= A20_Const::MAX_USER_PROFILES) return -1;

    JsonObjectConst jp = p_doc["profile"].is<JsonObjectConst>()
                             ? p_doc["profile"].as<JsonObjectConst>()
                             : p_doc.as<JsonObjectConst>();

    uint32_t v_no32 = (uint32_t)(jp["profileNo"] | 0u);
    if (v_no32 == 0u || v_no32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: invalid profileNo=%u", (unsigned)v_no32);
        return -2;
    }
    uint16_t v_no = (uint16_t)v_no32;

    if (C10_isProfileNoDuplicated(v_root, v_no, 255)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: duplicated profileNo=%u", (unsigned)v_no);
        return -3;
    }

    ST_A20_UserProfileItem_t& up = v_root.items[v_root.count];
    memset(&up, 0, sizeof(up));

    uint8_t v_newId = C10_nextProfileId_u8(v_root);
    up.profileId    = (uint16_t)v_newId;

    if (!C10_fromJson_UserProfileItem(jp, up, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: decode failed");
        return -4;
    }

    if (!C10_reissueProfileSegIdsAndValidateSegNos(up, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: segment validation failed");
        return -5;
    }

    if (C10_isProfileIdDuplicated(v_root, v_newId, v_root.count)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: duplicated profileId=%u", (unsigned)v_newId);
        return -6;
    }

    int v_index = (int)v_root.count;
    v_root.count++;

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] UserProfile added (index=%d, profileId=%u, profileNo=%u)",
                       v_index, (unsigned)v_newId, (unsigned)up.profileNo);
    return v_index;
}

bool CL_C10_ConfigManager::updateUserProfilesFromJson(uint16_t p_id, const JsonDocument& p_patch) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.userProfiles) return false;
    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if ((uint16_t)v_root.items[v_i].profileId == (uint16_t)p_id) { v_idx = (int)v_i; break; }
    }
    if (v_idx < 0) return false;

    JsonObjectConst jp = p_patch["profile"].is<JsonObjectConst>()
                             ? p_patch["profile"].as<JsonObjectConst>()
                             : p_patch.as<JsonObjectConst>();

    uint32_t v_no32 = (uint32_t)(jp["profileNo"] | 0u);
    if (v_no32 == 0u || v_no32 > 65535u) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: invalid profileNo=%u", (unsigned)v_no32);
        return false;
    }
    uint16_t v_newNo = (uint16_t)v_no32;

    if (C10_isProfileNoDuplicated(v_root, v_newNo, (uint8_t)v_idx)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: duplicated profileNo=%u (profileId=%u)",
                           (unsigned)v_newNo, (unsigned)p_id);
        return false;
    }

    uint16_t v_keepId = (uint16_t)v_root.items[(uint8_t)v_idx].profileId;
    if (v_keepId == 0u || v_keepId > 255u) return false;

    ST_A20_UserProfileItem_t v_new;
    memset(&v_new, 0, sizeof(v_new));
    v_new.profileId = v_keepId;

    if (!C10_fromJson_UserProfileItem(jp, v_new, false, true, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: decode failed (profileId=%u)", (unsigned)v_keepId);
        return false;
    }

    if (!C10_reissueProfileSegIdsAndValidateSegNos(v_new, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateUserProfile: segment validation failed (profileId=%u)", (unsigned)v_keepId);
        return false;
    }

    v_root.items[(uint8_t)v_idx] = v_new;

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] UserProfile updated (PUT, profileId=%u, index=%d, profileNo=%u)",
                       (unsigned)p_id, v_idx, (unsigned)v_root.items[(uint8_t)v_idx].profileNo);
    return true;
}

bool CL_C10_ConfigManager::deleteUserProfiles(uint16_t p_id) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!g_A20_config_root.userProfiles) return false;
    ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

    int v_idx = -1;
    for (uint8_t v_i = 0; v_i < v_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        if ((uint16_t)v_root.items[v_i].profileId == (uint16_t)p_id) { v_idx = (int)v_i; break; }
    }
    if (v_idx < 0) return false;

    for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        v_root.items[v_i - 1] = v_root.items[v_i];
    }
    if (v_root.count > 0) v_root.count--;

    A40_ComFunc::Dirty_setAtomic(_dirty_userProfiles, s_dirtyflagSpinlock);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile deleted (profileId=%u, index=%d)", (unsigned)p_id, v_idx);
    return true;
}
