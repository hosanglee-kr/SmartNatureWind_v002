/*
 * ------------------------------------------------------
 * 소스명 : S10_Simul_Core_0202.cpp
 * 모듈약어 : S10
 * 모듈명 : Smart Nature Wind 풍속 시뮬레이션 Manager (Core)
 * ------------------------------------------------------
 * [Batch C] 매직넘버 → 상수 (G_S10_*)
 * [Batch F-8] applyFan 0% 판정 임계 → G_S10_FAN_ZERO_THRESHOLD
 * ------------------------------------------------------
 */

#include "S10_Simul_0202.h"

#include "A20_Const_0202.h"
#include "A40_Com_Utils_0202.h"
#include "A22_Com_Lookup_0202.h"
#include "C10_Config_0202.h"
#include "D10_Logger_0202.h"
#include "P10_PWM_ctrl_0202.h"

#include <time.h>

// ==================================================
// Epoch 변환 헬퍼
// ==================================================
static uint64_t S10_millis2EpochMs(uint32_t p_millis, bool* p_okOut) {
    static time_t   s_baseSec = 0;
    static uint32_t s_baseMs  = 0;

    if (s_baseSec == 0) {
        time_t v_now = time(nullptr);
        if ((uint32_t)v_now > A20_Const::G_TIME_EPOCH_SANE_MIN) {
            s_baseSec = v_now;
            s_baseMs  = p_millis;
        } else {
            if (p_okOut) *p_okOut = false;
            return 0;
        }
    }

    if (p_okOut) *p_okOut = true;
    return (uint64_t)s_baseSec * 1000ULL + (uint64_t)(p_millis - s_baseMs);
}

// ==================================================
// 초기화 / 정지 / 리셋
// ==================================================
void CL_S10_Simulation::begin(CL_P10_PWM& p_pwm) {
    _pwm = &p_pwm;

    if (_recursiveMutex == nullptr) {
        _recursiveMutex = xSemaphoreCreateRecursiveMutex();
    }

    s_chartHead  = 0;
    s_chartCount = 0;

    _fanCfgSnap = nullptr;

    resetDefaults();

    if (g_A20_config_root.motion) {
        const ST_A20_MotSimCfg_t& v_src = g_A20_config_root.motion->sim;

        userIntensity   = A40_ComFunc::clampVal<float>(v_src.intensity,   0.0f, 100.0f);
        userVariability = A40_ComFunc::clampVal<float>(v_src.variability, 0.0f, 100.0f);
        userGustFreq    = A40_ComFunc::clampVal<float>(v_src.gustFreq,    0.0f, 100.0f);
        fanLimitPct     = A40_ComFunc::clampVal<float>(v_src.fanLimit,    0.0f, 100.0f);
        minFanPct       = A40_ComFunc::clampVal<float>(v_src.minFan,      0.0f, 100.0f);
        turbSigma       = v_src.turbSigma;
        turbLenScale    = v_src.turbLenScale;
        thermalStrength = v_src.thermalStrength;
        thermalRadius   = v_src.thermalRadius;
        fanPowerEnabled = v_src.fanPowerEnabled;

        if (v_src.presetCode[0]) {
            memset(presetCode, 0, sizeof(presetCode));
            strlcpy(presetCode, v_src.presetCode, sizeof(presetCode));
        }
        if (v_src.styleCode[0]) {
            memset(styleCode, 0, sizeof(styleCode));
            strlcpy(styleCode, v_src.styleCode, sizeof(styleCode));
        }

        applyPresetCore(presetCode);
        initPhaseFromBase();

        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[S10] Config applied: preset=%s intensity=%.1f",
                           presetCode, userIntensity);
    }

    memset(history, 0, sizeof(history));
    historyIndex   = 0;
    historyCount   = 0;
    avgWindCached  = 0.0f;
    sumWindHistory = 0.0f;

    (void)esp_random();

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[S10] begin()");
}

void CL_S10_Simulation::stop() {
    memset(&_overrideState, 0, sizeof(_overrideState));
    _overrideState.windIntensity = _overrideState.windVariability = _overrideState.gustFrequency = -1.0f;

    active      = false;
    _fanCfgSnap = nullptr;

    phase            = EN_A20_WIND_PHASE_CALM;
    targetWindSpeed  = 0.0f;
    currentWindSpeed = 0.0f;

    gustActive          = false;
    gustIntensity       = 1.0f;
    thermalActive       = false;
    thermalContribution = 0.0f;

    if (_pwm) {
        _pwm->P10_setDutyPercent(0.0f);
    }
}

void CL_S10_Simulation::resetDefaults() {
    memset(&_overrideState, 0, sizeof(_overrideState));
    _overrideState.windIntensity = _overrideState.windVariability = _overrideState.gustFrequency = -1.0f;

    active      = false;
    _fanCfgSnap = nullptr;

    fanPowerEnabled = true;

    memset(presetCode, 0, sizeof(presetCode));
    memset(styleCode, 0, sizeof(styleCode));

    A40_ComFunc::copyStr2Buffer_safe(presetCode, A20_Const::DEFAULT_PRESET_CODE, sizeof(presetCode));
    A40_ComFunc::copyStr2Buffer_safe(styleCode,  A20_Const::DEFAULT_STYLE_CODE,  sizeof(styleCode));

    userIntensity   = 70.0f;
    userVariability = 50.0f;
    userGustFreq    = 45.0f;
    minFanPct       = 10.0f;
    fanLimitPct     = 90.0f;

    turbLenScale    = 40.0f;
    turbSigma       = 0.5f;
    thermalStrength = 2.0f;
    thermalRadius   = 18.0f;

    baseMinWind = 1.8f;
    baseMaxWind = 5.5f;

    gustProbBase    = 0.040f;
    gustStrengthMax = 2.10f;
    thermalFreqBase = 0.022f;

    currentWindSpeed = 3.6f;
    targetWindSpeed  = 3.6f;
    windMomentum     = 0.0f;

    spectralEnergyBuf = 0.0f;
    spectralPhaseAcc  = 0.0f;
    turbTimeScale     = 5.0f;

    gustActive          = false;
    gustIntensity       = 1.0f;
    thermalActive       = false;
    thermalContribution = 0.0f;

    _tickNowMs   = millis();
    _tickNowSec  = (float)_tickNowMs / 1000.0f;
    lastUpdateMs = _tickNowMs;

    lastGustCheckMs    = 0;
    lastThermalCheckMs = 0;

    applyPresetCore(presetCode);
    initPhaseFromBase();
}

// ==================================================
// 메인 tick
// ==================================================
void CL_S10_Simulation::tick() {
    // [B-10] 브로드캐스트용 임시 변수 정리 (dead code)
    //  - 이전: JsonDocument 생성 + 채우기 → 미사용 (WS는 dirty 플래그만 통지)
    //  - 이후: 플래그만 유지
    bool v_needBroadcast = false;
    
    CL_A40_MutexGuard_Semaphore v_MutxGuard(_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);

    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[S10] %s: Mutex timeout", __func__);
        return;
    }

    if (!active) return;

    _fanCfgSnap = nullptr;
    if (g_A20_config_root.system != nullptr) {
        _fanCfgSnap = &g_A20_config_root.system->hw.fanConfig;
    }

    _tickNowMs  = millis();
    _tickNowSec = (float)_tickNowMs / 1000.0f;

    uint32_t v_baseMs = G_S10_TICK_MIN_BASE_MS;
    if (g_A20_config_root.motion != nullptr) {
        v_baseMs = (uint32_t)g_A20_config_root.motion->timing.simIntervalMs;
    }

    const uint32_t v_jitterMs = (G_S10_TICK_JITTER_RANGE_MS > 0u) ? (esp_random() % G_S10_TICK_JITTER_RANGE_MS) : 0u;
    const uint32_t v_minIntervalMs = v_baseMs + v_jitterMs;

    if (_tickNowMs - lastUpdateMs < (unsigned long)v_minIntervalMs) {
        return;
    }

    float v_dt   = (_tickNowMs - lastUpdateMs) / 1000.0f;
    v_dt         = A40_ComFunc::clampVal<float>(v_dt, 0.001f, 0.5f);
    lastUpdateMs = _tickNowMs;

    const float              v_prevWind  = currentWindSpeed;
    const EN_A20_WindPhase_t v_prevPhase = phase;

    updatePhase();
    calcTurb(v_dt);
    calcThermalEnvelope();
    updateGust();
    updateThermal();

    // [C] 관성 필터 상수화
    const float v_diff   = targetWindSpeed - currentWindSpeed;
    const float v_change = v_diff * windChangeRate * v_dt;

    windMomentum = windMomentum * G_S10_MOMENTUM_DECAY + v_change * G_S10_MOMENTUM_INPUT;
    windMomentum = constrain(windMomentum, -G_S10_MOMENTUM_CLAMP, G_S10_MOMENTUM_CLAMP);

    // [C] 풍속 물리 한계 상수화
    const float v_new = currentWindSpeed + windMomentum + spectralEnergyBuf;
    currentWindSpeed  = constrain(v_new, G_S10_WIND_MIN_MS, G_S10_WIND_MAX_MS);

    // [C] 수렴 임계/재생성 확률 상수화
    const float v_th = G_S10_CONVERGE_BASE + (currentWindSpeed / G_S10_CONVERGE_WIND_DIV);
    if (fabsf(v_diff) < v_th) {
        if (A40_ComFunc::getRandomRange(0.0f, 100.0f) < G_S10_TARGET_REGEN_NEAR_PCT) {
            generateTarget();
        }
    } else {
        if (A40_ComFunc::getRandomRange(0.0f, 100.0f) < G_S10_TARGET_REGEN_FAR_PCT) {
            generateTarget();
        }
    }

    // [C] PWM 변환 상수화
    float v_pwmPct  = currentWindSpeed * G_S10_WIND_TO_PWM_SCALE + G_S10_WIND_TO_PWM_BIAS;
    v_pwmPct       *= gustIntensity;
    v_pwmPct       += thermalContribution * G_S10_THERMAL_TO_PWM_MUL;
    applyFan(v_pwmPct);

    _updateWindHistory(currentWindSpeed);

    const float v_delta = fabsf(currentWindSpeed - v_prevWind);
    if (phase != v_prevPhase || v_delta > 2.0f) {
        v_needBroadcast = true;
    }

    // 차트 샘플링
    const uint32_t v_chartIntervalMs = (gustActive || thermalActive) ? G_S10_CHART_HZ2_MS : G_S10_CHART_HZ1_MS;

    if (_tickNowMs - s_lastChartLogMs > (unsigned long)v_chartIntervalMs) {
        s_lastChartLogMs = _tickNowMs;

        bool     v_epochOk = false;
        uint64_t v_epochMs = S10_millis2EpochMs(_tickNowMs, &v_epochOk);

        if (v_epochOk) {
            ST_ChartEntry v_e{};
            v_e.timestamp        = v_epochMs;
            v_e.wind_speed       = currentWindSpeed;
            v_e.target_wind      = targetWindSpeed;
            v_e.pwm_duty         = _pwm ? _pwm->P10_getDutyPercent() : 0.0f;
            v_e.intensity        = userIntensity;
            v_e.variability      = userVariability;
            v_e.turbulence_sigma = turbSigma;
            v_e.preset_index     = static_cast<uint8_t>(A20_getStaticPresetIndexByCode(presetCode));
            v_e.gust_active      = gustActive;
            v_e.thermal_active   = thermalActive;

            s_chartBuffer[s_chartHead] = v_e;
            s_chartHead = (uint8_t)((s_chartHead + 1u) % CHART_CAPACITY);
            if (s_chartCount < CHART_CAPACITY) s_chartCount++;
        }
    }
    
    if (v_needBroadcast) {
        // 실제 브로드캐스트는 CT10_WS_tick이 dirty 소비 후 담당
        CT10_markDirtyFromSim("chart");
        CT10_markDirtyFromSim("metrics");
    }
}

// ==================================================
// applyResolvedWind
// ==================================================
void CL_S10_Simulation::applyResolvedWind(const ST_A20_ResolvedWind_t& p_resolved) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);

    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[S10] %s: Mutex timeout", __func__);
        return;
    }

    memset(&_overrideState, 0, sizeof(_overrideState));
    _overrideState.windIntensity = _overrideState.windVariability = _overrideState.gustFrequency = -1.0f;

    _tickNowMs  = millis();
    _tickNowSec = (float)_tickNowMs / 1000.0f;

    _fanCfgSnap = nullptr;
    if (g_A20_config_root.system != nullptr) {
        _fanCfgSnap = &g_A20_config_root.system->hw.fanConfig;
    }

    memset(presetCode, 0, sizeof(presetCode));
    memset(styleCode, 0, sizeof(styleCode));
    strlcpy(presetCode, p_resolved.presetCode, sizeof(presetCode));
    strlcpy(styleCode, p_resolved.styleCode, sizeof(styleCode));

    userIntensity   = constrain(p_resolved.windIntensity, 0.0f, 100.0f);
    userVariability = constrain(p_resolved.windVariability, 0.0f, 100.0f);
    userGustFreq    = constrain(p_resolved.gustFrequency, 0.0f, 100.0f);

    float v_limit = constrain(p_resolved.fanLimit, 0.0f, 100.0f);
    float v_min   = constrain(p_resolved.minFan, 0.0f, 100.0f);
    if (v_min > v_limit) v_min = v_limit;
    fanLimitPct = v_limit;
    minFanPct   = v_min;

    turbLenScale    = max(1.0f, p_resolved.turbulenceLengthScale);
    turbSigma       = max(0.0f, p_resolved.turbulenceIntensitySigma);
    thermalStrength = max(1.0f, p_resolved.thermalBubbleStrength);
    thermalRadius   = max(0.0f, p_resolved.thermalBubbleRadius);

    baseMinWind     = p_resolved.baseMinWind;
    baseMaxWind     = p_resolved.baseMaxWind;
    gustProbBase    = p_resolved.gustProbBase;
    gustStrengthMax = p_resolved.gustStrengthMax;
    thermalFreqBase = p_resolved.thermalFreqBase;

    applyPresetCore(presetCode);

    // [C] resolved WCR 상수화
    const float v_varNorm = userVariability / 100.0f;
    windChangeRate        = constrain(
        G_S10_RESOLVED_WCR_BASE + v_varNorm * G_S10_RESOLVED_WCR_VAR_MUL,
        G_S10_RESOLVED_WCR_CLAMP_MIN,
        G_S10_RESOLVED_WCR_CLAMP_MAX);

    initPhaseFromBase();

    active              = true;
    gustActive          = false;
    thermalActive       = false;
    gustIntensity       = 1.0f;
    thermalContribution = 0.0f;

    generateTarget();
}

// ==================================================
// applyFan
// ==================================================
void CL_S10_Simulation::applyFan(float p_pct) {
    if (!_pwm) return;

    float v_reqPct = A40_ComFunc::clampVal<float>(p_pct, 0.0f, 100.0f);
    const float v_intPct = A40_ComFunc::clampVal<float>(userIntensity, 0.0f, 100.0f);

    // [F-8] 0% 임계 상수화
    if (!fanPowerEnabled || v_intPct <= G_S10_FAN_ZERO_THRESHOLD) {
        _pwm->P10_setDutyPercent(0.0f);
        return;
    }

    if (active) {
        v_reqPct = (v_reqPct * v_intPct) / 100.0f;
    }

    float v_minPct = A40_ComFunc::clampVal<float>(minFanPct, 0.0f, 100.0f);
    float v_maxPct = A40_ComFunc::clampVal<float>(fanLimitPct, 0.0f, 100.0f);
    if (v_minPct > v_maxPct) v_minPct = v_maxPct;

    const ST_A20_FanConfig_t* v_fc = _fanCfgSnap;

    const float v_phy01 = _pwm->applyFanConfigCurve(
        v_fc,
        v_reqPct / 100.0f,
        v_minPct / 100.0f,
        v_maxPct / 100.0f
    );

    _pwm->P10_setDutyPercent(v_phy01 * 100.0f);
}
