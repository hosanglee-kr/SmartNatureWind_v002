/*
 * ------------------------------------------------------
 * 소스명 : S10_Simul_Physic_0201.cpp
 * 모듈약어 : S10
 * 모듈명 : Smart Nature Wind 풍속 시뮬레이션 Manager (Physic)
 * ------------------------------------------------------
 * 기능 요약:
 * - Von Kármán 난류(12-band 근사), 관성/목표 풍속 생성
 * - Phase(CALM/NORMAL/STRONG) 확률 전환 + 지속시간 정책
 * - 돌풍(Gust) / 열기포(Thermal Bubble) 확률(초당 rate) 모델 + dt 자동 보정
 *
 * [Batch C] 물리 상수화 (P4-6~P4-9)
 *  - von Kármán: G_S10_VON_KARMAN_COEF / VK_NUMER_COEF / VK_EXPONENT /
 *                TURB_BAND_* / TURB_TS_MIN / SPECTRAL_PHASE_RATE / TWO_PI
 *  - WindChangeRate: G_S10_WCR_* / G_S10_RESOLVED_WCR_*
 *  - 풍속 최소: G_S10_WCR_TS_MIN_SPEED
 * ------------------------------------------------------
 * [잔여 유보 (C-NOTE-1~4)]
 *  - 열기포 envelope 계수 / 돌풍 강도 계수 / 열기포 발생 계수 / Phase 범위 계수
 *  - 프리셋 튜닝 대상값이므로 상수화 유보 (Batch F/G 재검토)
 * ------------------------------------------------------
 */

#include "S10_Simul_0201.h"

#include "A20_Const_0201.h"
#include "A25_Com_Utils_0201.h"
#include "A22_Com_Lookup_0201.h"
#include "C10_Config_0201.h"
#include "D10_Logger_0201.h"

// ==================================================
// [확률 헬퍼] rate → dt 보정 확률
// ==================================================
static inline float S10_probFromRatePerSec(float p_ratePerSec, float p_dtSec) {
    if (p_ratePerSec <= 0.0f || p_dtSec <= 0.0f) {
        return 0.0f;
    }
    const float v_p = 1.0f - expf(-p_ratePerSec * p_dtSec);
    return A40_ComFunc::clampVal<float>(v_p, 0.0f, 1.0f);
}

// ==================================================
// Preset / Phase
// ==================================================
void CL_S10_Simulation::applyPresetCore(const char* p_code) {
    if (g_A20_config_root.windDict != nullptr) {
        int16_t v_idx = A20_findPresetIndexByCode(*g_A20_config_root.windDict, p_code);
        if (v_idx >= 0) {
            const ST_A20_WindPresetFactors_t& v_presetFactors = g_A20_config_root.windDict->presets[v_idx].factors;
            baseMinWind     = v_presetFactors.baseMinWind;
            baseMaxWind     = v_presetFactors.baseMaxWind;
            gustProbBase    = v_presetFactors.gustProbBase;
            gustStrengthMax = v_presetFactors.gustStrengthMax;
            thermalFreqBase = v_presetFactors.thermalFreqBase;
            return;
        }
    }

    // Fallback (WindDict 로드 전)
    baseMinWind		= 1.8f;
    baseMaxWind		= 5.5f;
    gustProbBase	= 0.040f;
    gustStrengthMax = 2.10f;
    thermalFreqBase = 0.022f;
}

void CL_S10_Simulation::initPhaseFromBase() {
    phase		  = EN_A20_WIND_PHASE_NORMAL;
    phaseStartSec = _tickNowSec;

    float v_span  = baseMaxWind - baseMinWind;
    if (v_span < 0.5f) {
        v_span = 0.5f;
    }

    phaseMinWind	  = baseMinWind + v_span * 0.15f;
    phaseMaxWind	  = baseMinWind + v_span * 0.85f;

    phaseDurationSec  = A40_ComFunc::getRandomRange(G_S10_PHASE_NORM_DUR_MIN_S, G_S10_PHASE_NORM_DUR_MAX_S);

    const float v_mid = (baseMinWind + baseMaxWind) * 0.5f;
    currentWindSpeed  = v_mid;
    targetWindSpeed	  = v_mid;

    spectralEnergyBuf = 0.0f;
    spectralPhaseAcc  = 0.0f;
    windMomentum	  = 0.0f;

    phaseMinWind	  = max(0.2f, phaseMinWind);
    phaseMaxWind	  = min(11.0f, phaseMaxWind);
    if (phaseMaxWind < phaseMinWind + 0.2f) {
        phaseMaxWind = phaseMinWind + 0.2f;
    }
}

void CL_S10_Simulation::updatePhase() {
    if (!active) {
        return;
    }

    const float v_nowSec = _tickNowSec;

    if (v_nowSec - phaseStartSec < phaseDurationSec) {
        return;
    }

    const EN_A20_WindPhase_t v_old = phase;
    const float				v_r	  = A40_ComFunc::getRandom01();

    if (v_old == EN_A20_WIND_PHASE_CALM) {
        phase = (v_r < 0.7f) ? EN_A20_WIND_PHASE_NORMAL : EN_A20_WIND_PHASE_STRONG;
    } else if (v_old == EN_A20_WIND_PHASE_STRONG) {
        phase = (v_r < 0.7f) ? EN_A20_WIND_PHASE_NORMAL : EN_A20_WIND_PHASE_CALM;
    } else {
        if (v_r < 0.4f) {
            phase = EN_A20_WIND_PHASE_CALM;
        } else if (v_r < 0.8f) {
            phase = EN_A20_WIND_PHASE_NORMAL;
        } else {
            phase = EN_A20_WIND_PHASE_STRONG;
        }
    }

    phaseStartSec = v_nowSec;

    float v_span  = baseMaxWind - baseMinWind;
    if (v_span < 0.5f) {
        v_span = 0.5f;
    }

    if (phase == EN_A20_WIND_PHASE_CALM) {
        phaseDurationSec = A40_ComFunc::getRandomRange(G_S10_PHASE_CALM_DUR_MIN_S, G_S10_PHASE_CALM_DUR_MAX_S);
        phaseMinWind	 = baseMinWind;
        phaseMaxWind	 = baseMinWind + v_span * 0.6f;
    } else if (phase == EN_A20_WIND_PHASE_NORMAL) {
        phaseDurationSec = A40_ComFunc::getRandomRange(G_S10_PHASE_NORM_DUR_MIN_S, G_S10_PHASE_NORM_DUR_MAX_S);
        phaseMinWind	 = baseMinWind + v_span * 0.15f;
        phaseMaxWind	 = baseMinWind + v_span * 0.85f;
    } else {
        phaseDurationSec = A40_ComFunc::getRandomRange(G_S10_PHASE_STRONG_DUR_MIN_S, G_S10_PHASE_STRONG_DUR_MAX_S);
        phaseMinWind	 = baseMinWind + v_span * 0.4f;
        phaseMaxWind	 = baseMaxWind;
    }

    phaseMinWind = max(0.2f, phaseMinWind);
    phaseMaxWind = min(11.0f, phaseMaxWind);
    if (phaseMaxWind < phaseMinWind + 0.2f) {
        phaseMaxWind = phaseMinWind + 0.2f;
    }

    generateTarget();
}

// ==================================================
// Turbulence / Thermal Envelope
// ==================================================
void CL_S10_Simulation::calcTurb(float p_dt) {
    if (!active) return;
    if (p_dt <= 0.0f) return;

    const float v_L		= max(1.0f, turbLenScale);
    const float v_sigma = max(0.0f, turbSigma);
    // [C] 풍속 최소 상수화
    const float v_U		= max(G_S10_WCR_TS_MIN_SPEED, currentWindSpeed);

    float		v_sum	= 0.0f;

    // [C] Band 수 상수화
    for (int v_i = 1; v_i <= G_S10_TURB_BAND_COUNT; v_i++) {
        // [C] Band 주파수 스텝 상수화
        const float v_n			= (float)v_i * G_S10_TURB_BAND_FREQ_STEP;
        const float v_f			= v_n * v_U / v_L;
        const float v_fLU		= v_f * v_L / v_U;

        // [C] von Kármán 계수 상수화
        const float v_term		= G_S10_VON_KARMAN_COEF * v_fLU * v_fLU;
        const float v_numer		= G_S10_VK_NUMER_COEF * v_sigma * v_sigma * (v_L / v_U) * (1.0f + v_term);
        const float v_denom		= powf(1.0f + v_term, G_S10_VK_EXPONENT);
        const float v_S			= (v_denom > 0.0f) ? (v_numer / v_denom) : 0.0f;

        // [C] 2π 상수화
        const float v_phaseRate = G_S10_TWO_PI * v_f;
        const float v_phaseInc	= v_phaseRate * p_dt;

        const float v_phase		= spectralPhaseAcc * (float)v_i + v_phaseInc + A40_ComFunc::getRandomRange(-0.1f, 0.1f);

        // [C] Band폭/Amp 상수화
        const float v_amp		= sqrtf(max(0.0f, G_S10_TURB_BAND_AMP_MUL * v_S * G_S10_TURB_BAND_WIDTH));

        v_sum += v_amp * sinf(v_phase);
    }

    // [C] SpectralPhase rate 상수화
    spectralPhaseAcc += p_dt * G_S10_SPECTRAL_PHASE_RATE;
    if (spectralPhaseAcc > G_S10_TWO_PI) {
        spectralPhaseAcc -= G_S10_TWO_PI;
    }

    // [C] TimeScale 최소 상수화
    const float v_tscale = max(G_S10_TURB_TS_MIN, turbTimeScale);
    const float v_corr	 = expf(-p_dt / v_tscale);

    spectralEnergyBuf	 = spectralEnergyBuf * v_corr + v_sum * (1.0f - v_corr);
}

void CL_S10_Simulation::calcThermalEnvelope() {
    if (!active || !thermalActive) {
        return;
    }

    const float v_age = _tickNowSec - thermalStartSec;

    if (thermalDuration <= 0.0f) {
        thermalActive		= false;
        thermalContribution = 0.0f;
        return;
    }

    if (v_age >= thermalDuration) {
        thermalActive		= false;
        thermalContribution = 0.0f;
        return;
    }

    // [C-NOTE-1] 열기포 envelope 계수는 프리셋 튜닝 대상 → 상수화 유보
    const float v_prog = A40_ComFunc::clampVal<float>(v_age / thermalDuration, 0.0f, 1.0f);
    float		v_env  = 0.0f;

    if (v_prog < 0.2f) {
        const float v_r = v_prog / 0.2f;
        v_env			= 1.0f - powf(1.0f - v_r, 2.0f);
    } else if (v_prog < 0.6f) {
        v_env = 1.0f;
        v_env += sinf(v_age * (0.8f + (float)phase * 0.2f) * 2.0f * (float)M_PI) * 0.15f;
    } else {
        const float v_r = (v_prog - 0.6f) / 0.4f;
        v_env			= 1.0f - powf(v_r, 1.3f);
    }

    if (v_env < 0.0f) {
        v_env = 0.0f;
    }

    const float v_strength = max(1.0f, thermalStrength);
    thermalContribution	   = (v_strength - 1.0f) * v_env;
}

// ==================================================
// Gust
// ==================================================
void CL_S10_Simulation::updateGust() {
    if (!active) {
        return;
    }

    const float v_nowSec = _tickNowSec;

    // (1) 진행 중이면: 포락선 기반 강도 갱신
    if (gustActive) {
        const float v_age = v_nowSec - gustStartSec;

        if (gustDuration <= 0.0f || v_age >= gustDuration) {
            gustActive	  = false;
            gustIntensity = 1.0f;
            return;
        }

        // [C-NOTE-2] 돌풍 강도 계수는 프리셋 튜닝 대상 → 상수화 유보
        const float v_prog = A40_ComFunc::clampVal<float>(v_age / gustDuration, 0.0f, 1.0f);
        float		v_env  = 0.0f;

        if (v_prog < 0.25f) {
            const float v_r = v_prog / 0.25f;
            v_env			= 1.0f - powf(1.0f - v_r, 1.8f);
        } else if (v_prog < 0.65f) {
            v_env = 1.0f;
            v_env += sinf(v_age * (1.5f + (float)phase * 0.5f)) * 0.08f;
        } else {
            const float v_r = (v_prog - 0.65f) / 0.35f;
            v_env			= 1.0f - powf(v_r, 1.5f);
        }

        if (v_env < 0.0f) {
            v_env = 0.0f;
        }

        const float v_maxMul = max(1.0f, gustStrengthMax);
        gustIntensity		 = 1.0f + (v_maxMul - 1.0f) * v_env;
        return;
    }

    // (2) 새 돌풍 트리거: 평가 간격 + dt 기반 확률 보정
    const unsigned long v_nowMs		= _tickNowMs;
    const unsigned long v_elapsedMs = (v_nowMs >= lastGustCheckMs) ? (v_nowMs - lastGustCheckMs) : 0UL;

    uint32_t v_minGustEvalMs = G_S10_GUST_EVAL_MIN_MS;
    if (g_A20_config_root.motion != nullptr) {
        v_minGustEvalMs = (uint32_t)g_A20_config_root.motion->timing.gustIntervalMs;
    }

    if (v_elapsedMs < v_minGustEvalMs) {
        return;
    }

    lastGustCheckMs		= v_nowMs;

    const float v_dtSec = (float)v_elapsedMs / 1000.0f;
    if (v_dtSec <= 0.0f) {
        return;
    }

    // (3) rate 구성
    const float v_user	   = A40_ComFunc::clampVal<float>(userGustFreq, 0.0f, 100.0f) / 100.0f;
    const float v_wfac	   = 1.0f + (currentWindSpeed / 8.9f) * 0.5f;

    float		v_phaseMul = 1.0f;
    if (phase == EN_A20_WIND_PHASE_CALM) {
        v_phaseMul = 0.3f * v_wfac;
    } else if (phase == EN_A20_WIND_PHASE_STRONG) {
        v_phaseMul = 2.2f * v_wfac;
    } else {
        v_phaseMul = 0.9f * v_wfac;
    }

    const float v_ratePerSec = max(0.0f, gustProbBase) * v_user * v_phaseMul;
    const float v_p			 = S10_probFromRatePerSec(v_ratePerSec, v_dtSec);

    if (A40_ComFunc::getRandom01() < v_p) {
        gustActive			 = true;
        gustStartSec		 = v_nowSec;

        const float v_speedF = currentWindSpeed / 6.7f;

        // [C-NOTE-2] 돌풍 강도 계수 유보
        if (phase == EN_A20_WIND_PHASE_CALM) {
            gustDuration  = A40_ComFunc::getRandomRange(3.0f, 8.0f);
            gustIntensity = A40_ComFunc::getRandomRange(1.08f, 1.33f);
        } else if (phase == EN_A20_WIND_PHASE_STRONG) {
            gustDuration  = A40_ComFunc::getRandomRange(0.8f, 3.3f);
            gustIntensity = A40_ComFunc::getRandomRange(1.3f, 1.3f + 0.9f * (1.0f + v_speedF * 0.3f));
        } else {
            gustDuration  = A40_ComFunc::getRandomRange(1.8f, 5.8f);
            gustIntensity = A40_ComFunc::getRandomRange(1.15f, 1.15f + 0.5f * (1.0f + v_speedF * 0.2f));
        }

        const float v_maxMul = max(1.0f, gustStrengthMax);
        if (gustIntensity > v_maxMul) {
            gustIntensity = v_maxMul;
        }
    }
}

// ==================================================
// Thermal
// ==================================================
void CL_S10_Simulation::updateThermal() {
    if (!active || thermalActive) {
        return;
    }

    const unsigned long v_nowMs		= _tickNowMs;
    const unsigned long v_elapsedMs = (v_nowMs >= lastThermalCheckMs) ? (v_nowMs - lastThermalCheckMs) : 0UL;

    uint32_t v_minThermEvalMs = G_S10_THERM_EVAL_MIN_MS;
    if (g_A20_config_root.motion != nullptr) {
        v_minThermEvalMs = (uint32_t)g_A20_config_root.motion->timing.thermalIntervalMs;
    }

    if (v_elapsedMs < v_minThermEvalMs) {
        return;
    }

    lastThermalCheckMs	= v_nowMs;

    const float v_dtSec = (float)v_elapsedMs / 1000.0f;
    if (v_dtSec <= 0.0f) {
        return;
    }

    // [C-NOTE-3] 열기포 발생 계수 유보
    const float v_strength	  = max(1.0f, thermalStrength);
    const float v_strengthMul = (0.6f + 0.4f * min(3.0f, max(0.5f, v_strength)));

    const float v_wfac		  = 1.0f + (currentWindSpeed / 8.0f) * 0.3f;
    const float v_phaseMul	  = (phase == EN_A20_WIND_PHASE_CALM) ? 1.2f : (phase == EN_A20_WIND_PHASE_STRONG ? 0.7f : 1.0f);

    const float v_ratePerSec  = max(0.0f, thermalFreqBase) * v_strengthMul * v_wfac * v_phaseMul;
    const float v_p			  = S10_probFromRatePerSec(v_ratePerSec, v_dtSec);

    if (A40_ComFunc::getRandom01() < v_p) {
        thermalActive	= true;
        thermalStartSec = _tickNowSec;

        float v_d		= A40_ComFunc::getRandomRange(G_S10_THERM_DUR_MIN_S, G_S10_THERM_DUR_MAX_S);
        if (phase == EN_A20_WIND_PHASE_CALM) {
            v_d *= G_S10_THERM_DUR_MUL_CALM;
        } else if (phase == EN_A20_WIND_PHASE_STRONG) {
            v_d *= G_S10_THERM_DUR_MUL_STRONG;
        }

        thermalDuration		= max(0.1f, v_d);
        thermalContribution = 0.0f;
    }
}

// ==================================================
// generateTarget (WindChangeRate 상수화)
// ==================================================
void CL_S10_Simulation::generateTarget() {
    if (!active) {
        return;
    }

    // [C] VRange 최소 상수화
    float v_range = phaseMaxWind - phaseMinWind;
    if (v_range < G_S10_WCR_VRANGE_MIN) {
        v_range = G_S10_WCR_VRANGE_MIN;
    }

    // [C] VMid 계수 상수화
    float v_w		   = phaseMinWind + A40_ComFunc::getRandom01() * v_range;
    float v_mid		   = (phaseMinWind + phaseMaxWind) * G_S10_WCR_VMID_MUL;
    float v_bias	   = A40_ComFunc::getRandomRange(0.0f, 1.0f);

    v_w				   = (v_w + v_mid * v_bias) / (1.0f + v_bias);
    targetWindSpeed	   = v_w;

    const float v_var  = A40_ComFunc::clampVal<float>(userVariability, 0.0f, 100.0f) / 100.0f;

    // [C] Phase별 Base/Range 상수화
    float		v_base = G_S10_WCR_NORM_BASE;

    if (phase == EN_A20_WIND_PHASE_CALM) {
        v_base = G_S10_WCR_CALM_BASE + v_var * G_S10_WCR_CALM_RANGE;
    } else if (phase == EN_A20_WIND_PHASE_STRONG) {
        v_base = G_S10_WCR_STRONG_BASE + v_var * G_S10_WCR_STRONG_RANGE;
    } else {
        v_base = G_S10_WCR_NORM_BASE + v_var * G_S10_WCR_NORM_RANGE;
    }

    // [C] TScale 상수화
    const float v_U		 = max(G_S10_WCR_TS_MIN_SPEED, currentWindSpeed);
    const float v_tscale = turbLenScale / v_U;
    v_base *= (1.0f + v_tscale * G_S10_WCR_TSCALE_MUL);

    // [C] Random/Clamp 상수화
    windChangeRate = constrain(
        v_base * A40_ComFunc::getRandomRange(G_S10_WCR_RANDOM_MIN, G_S10_WCR_RANDOM_MAX),
        G_S10_WCR_CLAMP_MIN,
        G_S10_WCR_CLAMP_MAX);
}
