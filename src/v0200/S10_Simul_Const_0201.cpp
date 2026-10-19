// S10_Simul_Const_0201.h
#pragma once
#include <Arduino.h>

// ==================================================
// [S10 주기 정책 상수] (ms 단위)
// ==================================================
static const uint32_t G_S10_TICK_MIN_BASE_MS       = 40u;
static const uint32_t G_S10_TICK_JITTER_RANGE_MS   = 60u;

static const uint32_t G_S10_GUST_EVAL_MIN_MS       = 500u;
static const uint32_t G_S10_THERM_EVAL_MIN_MS      = 700u;

static const uint32_t G_S10_CHART_HZ1_MS           = 1000u;
static const uint32_t G_S10_CHART_HZ2_MS           = 500u;
static const uint32_t G_S10_CHART_FULL_MIN_MS      = 10000u;

// ==================================================
// [S10 초 정책 상수] (Phase / Thermal duration)
// ==================================================
static const float    G_S10_PHASE_CALM_DUR_MIN_S   = 90.0f;
static const float    G_S10_PHASE_CALM_DUR_MAX_S   = 210.0f;
static const float    G_S10_PHASE_NORM_DUR_MIN_S   = 120.0f;
static const float    G_S10_PHASE_NORM_DUR_MAX_S   = 300.0f;
static const float    G_S10_PHASE_STRONG_DUR_MIN_S = 60.0f;
static const float    G_S10_PHASE_STRONG_DUR_MAX_S = 150.0f;

static const float    G_S10_THERM_DUR_MIN_S        = 8.0f;
static const float    G_S10_THERM_DUR_MAX_S        = 14.0f;

static const float    G_S10_THERM_DUR_MUL_CALM     = 1.3f;
static const float    G_S10_THERM_DUR_MUL_STRONG   = 0.8f;

// ==================================================
// [Batch C] S10 물리 시뮬레이션 상수 (P4-1~P4-9)
// ==================================================

// --- 풍속 → PWM 변환 ---
static constexpr float G_S10_WIND_TO_PWM_SCALE   = 10.0f;  // [%/m·s]
static constexpr float G_S10_WIND_TO_PWM_BIAS    = 10.0f;  // [%]
static constexpr float G_S10_THERMAL_TO_PWM_MUL  = 5.0f;   // [%/-]

// --- 관성 필터 ---
static constexpr float G_S10_MOMENTUM_DECAY      = 0.85f;
static constexpr float G_S10_MOMENTUM_INPUT      = 0.15f;
static constexpr float G_S10_MOMENTUM_CLAMP      = 0.5f;

// --- 풍속 물리 한계 (STATE_0201.md §3 불변식) ---
static constexpr float G_S10_WIND_MIN_MS         = 0.2f;   // [m/s]
static constexpr float G_S10_WIND_MAX_MS         = 11.0f;  // [m/s]

// --- 목표 수렴 임계 ---
static constexpr float G_S10_CONVERGE_BASE       = 0.5f;
static constexpr float G_S10_CONVERGE_WIND_DIV   = 20.0f;

// --- 목표 재생성 확률 ---
static constexpr float G_S10_TARGET_REGEN_NEAR_PCT = 30.0f;
static constexpr float G_S10_TARGET_REGEN_FAR_PCT  = 6.0f;

// --- WindChangeRate: generateTarget() 경로 ---
static constexpr float G_S10_WCR_CALM_BASE       = 0.08f;
static constexpr float G_S10_WCR_CALM_RANGE      = 0.12f;
static constexpr float G_S10_WCR_NORM_BASE       = 0.15f;
static constexpr float G_S10_WCR_NORM_RANGE      = 0.25f;
static constexpr float G_S10_WCR_STRONG_BASE     = 0.25f;
static constexpr float G_S10_WCR_STRONG_RANGE    = 0.35f;
static constexpr float G_S10_WCR_RANDOM_MIN      = 0.7f;
static constexpr float G_S10_WCR_RANDOM_MAX      = 1.7f;
static constexpr float G_S10_WCR_CLAMP_MIN       = 0.04f;
static constexpr float G_S10_WCR_CLAMP_MAX       = 0.5f;
static constexpr float G_S10_WCR_TSCALE_MUL      = 0.1f;
static constexpr float G_S10_WCR_TS_MIN_SPEED    = 0.1f;
static constexpr float G_S10_WCR_VRANGE_MIN      = 0.2f;
static constexpr float G_S10_WCR_VMID_MUL        = 0.5f;

// --- WindChangeRate: applyResolvedWind() 경로 ---
static constexpr float G_S10_RESOLVED_WCR_BASE      = 0.10f;
static constexpr float G_S10_RESOLVED_WCR_VAR_MUL   = 0.20f;
static constexpr float G_S10_RESOLVED_WCR_CLAMP_MIN = 0.06f;
static constexpr float G_S10_RESOLVED_WCR_CLAMP_MAX = 0.34f;

// --- von Kármán 난류 스펙트럼 ---
static constexpr int   G_S10_TURB_BAND_COUNT     = 12;
static constexpr float G_S10_TURB_BAND_FREQ_STEP = 0.1f;
static constexpr float G_S10_VON_KARMAN_COEF     = 70.8f;
static constexpr float G_S10_VK_NUMER_COEF       = 4.0f;
static constexpr float G_S10_VK_EXPONENT         = 5.0f / 6.0f;
static constexpr float G_S10_TURB_BAND_WIDTH     = 0.083f;
static constexpr float G_S10_TURB_BAND_AMP_MUL   = 2.0f;
static constexpr float G_S10_TURB_TS_MIN         = 0.001f;
static constexpr float G_S10_SPECTRAL_PHASE_RATE = 0.5f;
static constexpr float G_S10_TWO_PI              = 6.283185307179586f;

// ==================================================
// [Batch F-8] S10 팬 제어 임계
// ==================================================
static constexpr float G_S10_FAN_ZERO_THRESHOLD = 0.01f;   // [%] 이 값 이하면 0% 강제
