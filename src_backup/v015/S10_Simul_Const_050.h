// S10_Simul_Const_050.h

#pragma once

#include <Arduino.h>

// ==================================================
// [S10 주기 정책 상수] (시간 단위 주석 필수)
// - Core/IO/Physic CPP에서 동일 상수를 공유하기 위해 Header로 승격
// ==================================================

// tick() 업데이트 최소 간격 정책(ms)
// - BASE(40ms) + jitter(0~59ms) => 40~99ms 범위
// - 자연풍 “미세 불규칙성”을 만들되, 과도한 루프/부하를 제한
static const uint32_t G_S10_TICK_MIN_BASE_MS	   = 40u;  // [ms]
static const uint32_t G_S10_TICK_JITTER_RANGE_MS   = 60u;  // [ms] (0~59)

// 돌풍/열기포 “발생 여부 평가” 최소 간격(ms)
// - 확률은 평가 주기(dt)에 의해 자동 보정되어야 함(초당 rate 기반)
static const uint32_t G_S10_GUST_EVAL_MIN_MS	   = 500u;	// [ms]
static const uint32_t G_S10_THERM_EVAL_MIN_MS	   = 700u;	// [ms]

// 차트 샘플링 간격(ms)
static const uint32_t G_S10_CHART_HZ1_MS		   = 1000u;	 // [ms] 평상시 1Hz
static const uint32_t G_S10_CHART_HZ2_MS		   = 500u;	 // [ms] 이벤트 중 2Hz

// 차트 Full Dump 최소 전송 간격(ms) (Web 부하 제어)
static const uint32_t G_S10_CHART_FULL_MIN_MS	   = 10000u;  // [ms] 10s

// ==================================================
// [S10 초(Seconds) 정책 상수] (Phase/Thermal duration)
// - "초" 계열은 정책화하여 Physic CPP에서 사용
// ==================================================

// Phase 지속시간 범위(초)
static const float	  G_S10_PHASE_CALM_DUR_MIN_S   = 90.0f;	  // [s]
static const float	  G_S10_PHASE_CALM_DUR_MAX_S   = 210.0f;  // [s]
static const float	  G_S10_PHASE_NORM_DUR_MIN_S   = 120.0f;  // [s]
static const float	  G_S10_PHASE_NORM_DUR_MAX_S   = 300.0f;  // [s]
static const float	  G_S10_PHASE_STRONG_DUR_MIN_S = 60.0f;	  // [s]
static const float	  G_S10_PHASE_STRONG_DUR_MAX_S = 150.0f;  // [s]

// Thermal(열기포) 지속시간 범위(초)
static const float	  G_S10_THERM_DUR_MIN_S		   = 8.0f;	 // [s]
static const float	  G_S10_THERM_DUR_MAX_S		   = 14.0f;	 // [s]

// Thermal phase 보정 배율(지속시간에 적용)
static const float	  G_S10_THERM_DUR_MUL_CALM	   = 1.3f;	// [-]
static const float	  G_S10_THERM_DUR_MUL_STRONG   = 0.8f;	// [-]
