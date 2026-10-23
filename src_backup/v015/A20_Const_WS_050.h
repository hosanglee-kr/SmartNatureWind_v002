// 소스명 : A20_Const_WS_045.h

#pragma once

#include <Arduino.h>
#include <string.h>

// ------------------------------------------------------
// 1. Enum 및 타입 정의
// ------------------------------------------------------

typedef enum : uint8_t {
    EN_A20_WS_CH_STATE = 0,
    EN_A20_WS_CH_METRICS,
    EN_A20_WS_CH_CHART,
    EN_A20_WS_CH_SUMMARY,
    EN_A20_WS_CH_COUNT
} EN_A20_WS_CH_INDEX_t;

typedef struct {
    const EN_A20_WS_CH_INDEX_t chIdx;
    const char* chName;
    const uint16_t             chDefaultIntervalMs;
    const uint8_t              defaultPriority;
} ST_A20_WS_CH_Base_t;

typedef struct {
    EN_A20_WS_CH_INDEX_t chIdx;
    const char* chName;
    uint16_t             chIntervalMs;
    uint8_t              priority;
} ST_A20_WS_CH_CONFIG_t;

typedef struct {
    uint16_t chartLargeBytes;
    uint8_t  chartThrottleMul; // 2 (interval * 2)
    uint16_t wsCleanupMs;
} ST_A20_wsEtcConfig_t;

typedef struct {
    ST_A20_WS_CH_CONFIG_t wsChConfig[EN_A20_WS_CH_COUNT];
    ST_A20_wsEtcConfig_t  wsEtcConfig;
} ST_A20_WebSocketConfig_t;

// ------------------------------------------------------
// 2. 고정 상수 데이터 (Flash/ROM)
// ------------------------------------------------------

inline constexpr ST_A20_WS_CH_Base_t G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_COUNT] = {
    { EN_A20_WS_CH_STATE,   "state",   800,  0 },
    { EN_A20_WS_CH_METRICS, "metrics", 1500, 1 },
    { EN_A20_WS_CH_CHART,   "chart",   1200, 2 },
    { EN_A20_WS_CH_SUMMARY, "summary", 1500, 3 }
};

inline constexpr ST_A20_wsEtcConfig_t G_A20_WS_ETC_DEFAULT_CONFIG = {
    3500,
    2,
    10000
};




/*
// cfg_system_031.json

{
  ...
  "system": {
    ...
    "webSocket": {
      "wsChConfig": [
        {
          "chIdx": 0,
          "chName": "state",
          "chIntervalMs": 800,
          "priority": 0
        },
        {
          "chIdx": 1,
          "chName": "metrics",
          "chIntervalMs": 1500,
          "priority": 1
        },
        {
          "chIdx": 2,
          "chName": "chart",
          "chIntervalMs": 1200,
          "priority": 2
        },
        {
          "chIdx": 3,
          "chName": "summary",
          "chIntervalMs": 1500,
          "priority": 3
        }
      ],
      "wsEtcConfig": {
        "chartLargeBytes": 3500,
        "chartThrottleMul": 2,
        "wsCleanupMs": 10000
      }
    }
    ...
  }
  ...
}


*/
