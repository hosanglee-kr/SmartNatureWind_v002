 // 소스명 : A20_Const_Motion_044.h

#pragma once

#include "A20_Const_Const_044.h"



// ------------------------------------------------------
// MOTION 설정 (cfg_motion_xxx.json) : camelCase 정합
//  motion.pir.enabled, motion.pir.holdSec
//  motion.ble.enabled, motion.ble.trustedDevices[], motion.ble.rssi{on,off,avgCount,persistCount,exitDelaySec}
// ------------------------------------------------------
typedef struct {
    char    alias[A20_Const::LEN_ALIAS];
    char    name[A20_Const::LEN_NAME];
    char    mac[20];
    char    manufPrefix[9];
    uint8_t prefixLen;
    bool    enabled;
} ST_A20_BLETrustedDevice_t;

typedef struct {
    struct {
        bool     enabled;
        uint16_t holdSec;
    } pir;

    struct {
        bool enabled;

        ST_A20_BLETrustedDevice_t trustedDevices[A20_Const::MAX_BLE_DEVICES];
        uint8_t                   trustedCount;

        struct {
            int16_t  on;
            int16_t  off;
            uint8_t  avgCount;
            uint8_t  persistCount;
            uint16_t exitDelaySec;
        } rssi;
    } ble;

    // Timing 설정 (Frontend P060/P010 지원)
    struct {
        uint16_t simIntervalMs;     // Simulation tick interval (ms)
        uint16_t gustIntervalMs;    // Gust evaluation interval (ms)
        uint16_t thermalIntervalMs; // Thermal evaluation interval (ms)
    } timing;
} ST_A20_MotionConfig_t;


