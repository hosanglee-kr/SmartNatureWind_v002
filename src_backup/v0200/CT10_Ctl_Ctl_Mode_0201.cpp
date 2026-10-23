/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_Mode_0201.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 Manager (Profile Mode)
 * ------------------------------------------------------
 * [E-2.4] 이관: setProfileMode / startUserProfileByNo / stopUserProfile
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0201.h"

#include "A25_Com_Utils_0201.h"
#include "N10_NvsManager_0201.h"

// --------------------------------------------------
// mode 변경 (schedule ↔ profile)
// --------------------------------------------------
void CL_CT10_ControlManager::setProfileMode(bool p_profileMode) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    // [B-2] 사용자 모드 변경 → AutoOff 래치 해제
    _autoOffLatched = false;

    useProfileMode = p_profileMode;

    if (!p_profileMode) {
        stopUserProfile();
    } else {
        curScheduleIndex = -1;
        if (runSource == EN_CT10_RUN_SCHEDULE) {
            runSource = EN_CT10_RUN_NONE;
        }
    }

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] setMode(profileMode=%d)", p_profileMode ? 1 : 0);
}

// --------------------------------------------------
// user profile 시작
// --------------------------------------------------
bool CL_CT10_ControlManager::startUserProfileByNo(uint16_t p_profileNo) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    if (!g_A20_config_root.userProfiles) return false;

    ST_A20_UserProfilesRoot_t& v_cfg = *g_A20_config_root.userProfiles;

    for (uint8_t v_i = 0; v_i < v_cfg.count; v_i++) {
        const ST_A20_UserProfileItem_t& v_p = v_cfg.items[v_i];
        if (!v_p.enabled) continue;

        if (v_p.profileNo == p_profileNo) {
            _autoOffLatched = false;

            runSource                  = EN_CT10_RUN_USER_PROFILE;
            curProfileIndex            = (int8_t)v_i;

            profileSegRt.index         = -1;
            profileSegRt.onPhase       = true;
            profileSegRt.phaseStartMs  = millis();
            profileSegRt.loopCount     = 0;

            initAutoOffFromUserProfile(v_p);

            CL_N10_NvsManager::setRunMode(2, 2);   // mode=USER_PROFILE, source=WEB
            CL_N10_NvsManager::setLastUserProfile((int16_t)p_profileNo);

            curScheduleIndex = -1;

            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Start UserProfile #%u (%s)",
                               (unsigned)p_profileNo, v_p.name);

            markDirty("state");
            markDirty("metrics");
            return true;
        }
    }
    return false;
}

// --------------------------------------------------
// user profile 정지
// --------------------------------------------------
void CL_CT10_ControlManager::stopUserProfile() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (runSource != EN_CT10_RUN_USER_PROFILE) return;

    runSource          = EN_CT10_RUN_NONE;
    curProfileIndex    = -1;
    profileSegRt.index = -1;

    sim.stop();

    CL_N10_NvsManager::setRunMode(0, 2);

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] UserProfile stopped");
}
