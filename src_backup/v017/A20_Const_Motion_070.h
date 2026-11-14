// 소스명 : A20_Const_Motion_070.h

#pragma once

#include "A20_Const_Const_070.h"

// ------------------------------------------------------
// MOTION 설정 (cfg_motion_xxx.json) : camelCase 정합
// ------------------------------------------------------

typedef struct {
    bool     enabled;
    uint16_t holdSec;
} ST_A20_MotPirCfg_t;

typedef struct {
    uint16_t simIntervalMs;
    uint16_t gustIntervalMs;
    uint16_t thermalIntervalMs;
} ST_A20_MotTiming_t;

// [NEW] 시뮬레이션 파라미터 (영구 저장 대상)
//  - 이전에는 S10 런타임 메모리만 → 재부팅 시 소실
//  - 이제 config 파일에 저장 + 부팅 시 복원
typedef struct {
    char  presetCode[A20_Const::MAX_CODE_LEN];
    char  styleCode[A20_Const::MAX_CODE_LEN];
    bool  fanPowerEnabled;
    float intensity;
    float variability;
    float gustFreq;
    float fanLimit;
    float minFan;
    float turbSigma;
    float turbLenScale;
    float thermalStrength;
    float thermalRadius;
} ST_A20_MotSimCfg_t;

typedef struct {
    ST_A20_MotPirCfg_t  pir;
    ST_A20_MotTiming_t  timing;
    ST_A20_MotSimCfg_t  sim;     
} ST_A20_MotionConfig_t;

