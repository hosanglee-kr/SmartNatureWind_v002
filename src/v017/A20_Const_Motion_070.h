 // 소스명 : A20_Const_Motion_070.h

#pragma once

#include "A20_Const_Const_070.h"



// ------------------------------------------------------
// MOTION 설정 (cfg_motion_xxx.json) : camelCase 정합
//  motion.pir.enabled, motion.pir.holdSec
// ------------------------------------------------------

typedef struct {
    bool     enabled;
    uint16_t holdSec;
} ST_A20_MotPirCfg_t;



// Timing 설정 
typedef struct {
        uint16_t simIntervalMs;     // Simulation tick interval (ms)
        uint16_t gustIntervalMs;    // Gust evaluation interval (ms)
        uint16_t thermalIntervalMs; // Thermal evaluation interval (ms)
} ST_A20_MotTiming_t;



typedef struct {
    ST_A20_MotPirCfg_t pir;
    ST_A20_MotTiming_t timing;
} ST_A20_MotionConfig_t;



