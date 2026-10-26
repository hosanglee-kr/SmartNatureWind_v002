/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_Ovr_0202.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 Manager (Override)
 * ------------------------------------------------------
 * [E-2.4] 이관: startOverrideFixed / startOverridePreset /
 *               applyManualResolved / stopOverride
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0202.h"

#include "A40_Com_Utils_0202.h"
#include "N10_NvsManager_0202.h"

// --------------------------------------------------
// override: fixed (PWM 고정 %)
// --------------------------------------------------
void CL_CT10_ControlManager::startOverrideFixed(float p_percent, uint32_t p_seconds, bool p_forever) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    _autoOffLatched = false;

    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active       = true;
    overrideState.useFixed     = true;
    overrideState.fixedPercent = constrain(p_percent, 0.0f, 100.0f);

    if (p_forever) {
        overrideState.endMs = 0;
    } else {
        uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
        overrideState.endMs = millis() + (v_sec * 1000UL);
    }

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override FIXED %.1f%% (%s)",
                       overrideState.fixedPercent, p_forever ? "forever" : "timed");

    CL_N10_NvsManager::setOverrideFixed(true, overrideState.fixedPercent);
}

// --------------------------------------------------
// override: preset (resolved WindDict)
// --------------------------------------------------
void CL_CT10_ControlManager::startOverridePreset(const char* p_presetCode,
                                                 const char* p_styleCode,
                                                 const ST_A20_AdjustDelta_t* p_adj,
                                                 uint32_t p_seconds,
                                                 bool p_forever) {
    if (!g_A20_config_root.windDict) return;

    ST_A20_ResolvedWind_t v_resolved;
    memset(&v_resolved, 0, sizeof(v_resolved));

    bool v_ok = S20_resolveWindParams(*g_A20_config_root.windDict,
                                     p_presetCode, p_styleCode, p_adj, v_resolved);

    if (!v_ok || !v_resolved.valid) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] startOverridePreset resolve failed (%s,%s)",
                           p_presetCode ? p_presetCode : "",
                           p_styleCode  ? p_styleCode  : "");
        return;
    }

    applyManualResolved(v_resolved, p_seconds, p_forever);
}

// --------------------------------------------------
// override: resolved manual
// --------------------------------------------------
void CL_CT10_ControlManager::applyManualResolved(const ST_A20_ResolvedWind_t& p_wind,
                                                 uint32_t p_seconds,
                                                 bool p_forever) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (!p_wind.valid) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] applyManual: invalid ResolvedWind");
        return;
    }

    if (p_wind.fixedMode) {
        startOverrideFixed(p_wind.fixedSpeed, p_seconds, p_forever);
        return;
    }

    _autoOffLatched = false;

    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active          = true;
    overrideState.useFixed        = false;
    overrideState.resolvedApplied = false;
    overrideState.fixedPercent    = 0.0f;
    overrideState.resolved        = p_wind;

    if (p_forever) {
        overrideState.endMs = 0;
    } else {
        uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
        overrideState.endMs = millis() + (v_sec * 1000UL);
    }

    markDirty("state");
    markDirty("metrics");
    markDirty("chart");

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[CT10] applyManual: preset=%s style=%s (%s)",
                       p_wind.presetCode, p_wind.styleCode,
                       p_forever ? "forever" : "timed");

    CL_N10_NvsManager::setOverridePreset(true, p_wind.presetCode, p_wind.styleCode);
}

// --------------------------------------------------
// override: stop
// --------------------------------------------------
void CL_CT10_ControlManager::stopOverride() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (!overrideState.active) return;

    memset(&overrideState, 0, sizeof(overrideState));

    CL_N10_NvsManager::clearOverride();

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override cleared");
}
