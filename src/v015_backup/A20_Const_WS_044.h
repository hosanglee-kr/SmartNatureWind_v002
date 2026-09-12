// 소스명 : A20_Const_WS_044.h

#pragma once

#include <Arduino.h>
#include <string.h>

// ------------------------------------------------------
// 1. Enum 및 타입 정의
// ------------------------------------------------------

typedef enum {
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

// C10_Config_SysWS_044.cpp
// ------------------------------------------------------
// 3. 전역 변수 설정 (RAM)
// ------------------------------------------------------

static ST_A20_WebSocketConfig_t g_A20_wsConfig = {
    .wsChConfig = {
        { EN_A20_WS_CH_STATE,   G_A20_WS_CH_Base_Arr[0].chName, G_A20_WS_CH_Base_Arr[0].chDefaultIntervalMs, G_A20_WS_CH_Base_Arr[0].defaultPriority },
        { EN_A20_WS_CH_METRICS, G_A20_WS_CH_Base_Arr[1].chName, G_A20_WS_CH_Base_Arr[1].chDefaultIntervalMs, G_A20_WS_CH_Base_Arr[1].defaultPriority },
        { EN_A20_WS_CH_CHART,   G_A20_WS_CH_Base_Arr[2].chName, G_A20_WS_CH_Base_Arr[2].chDefaultIntervalMs, G_A20_WS_CH_Base_Arr[2].defaultPriority },
        { EN_A20_WS_CH_SUMMARY, G_A20_WS_CH_Base_Arr[3].chName, G_A20_WS_CH_Base_Arr[3].chDefaultIntervalMs, G_A20_WS_CH_Base_Arr[3].defaultPriority }
    },
    .wsEtcConfig = G_A20_WS_ETC_DEFAULT_CONFIG
};

// ------------------------------------------------------
// 4. Getter 및 Setter 함수
// ------------------------------------------------------

// ** @brief 채널 설정 포인터 획득 (Index 기반) * /
inline ST_A20_WS_CH_CONFIG_t* A20_GetWsChConfig(EN_A20_WS_CH_INDEX_t p_idx) {
    if (p_idx < 0 || p_idx >= EN_A20_WS_CH_COUNT) return nullptr;
    return &g_A20_wsConfig.wsChConfig[p_idx];
}

// ** @brief 채널 설정 포인터 획득 (Name 기반) * //
inline ST_A20_WS_CH_CONFIG_t* A20_GetWsChConfig(const char* p_chName) {
    if (p_chName == nullptr) return nullptr;
    for (int v_i = 0; v_i < EN_A20_WS_CH_COUNT; v_i++) {
        if (strcmp(g_A20_wsConfig.wsChConfig[v_i].chName, p_chName) == 0) return &g_A20_wsConfig.wsChConfig[v_i];
    }
    return nullptr;
}

// ** @brief 인터벌 수정 (Index 기반) * /
inline bool A20_SetWsInterval(EN_A20_WS_CH_INDEX_t p_idx, uint16_t p_ms) {
    ST_A20_WS_CH_CONFIG_t* v_cfg = A20_GetWsChConfig(p_idx);
    if (!v_cfg || p_ms < 100) return false; // 최소 100ms 제한 예시
    v_cfg->chIntervalMs = p_ms;
    return true;
}

// ** @brief 인터벌 수정 (Name 기반) * /
inline bool A20_SetWsInterval(const char* p_chName, uint16_t p_ms) {
    ST_A20_WS_CH_CONFIG_t* v_cfg = A20_GetWsChConfig(p_chName);
    if (!v_cfg || p_ms < 100) return false;
    v_cfg->chIntervalMs = p_ms;
    return true;
}

// ** @brief 우선순위 수정 * /
inline bool A20_SetWsPriority(EN_A20_WS_CH_INDEX_t p_idx, uint8_t p_priority) {
    ST_A20_WS_CH_CONFIG_t* v_cfg = A20_GetWsChConfig(p_idx);
    if (!v_cfg) return false;
    v_cfg->priority = p_priority;
    return true;
}

// ** @brief Etc 설정 일괄 수정 * /
inline void A20_SetWsEtcConfig(uint16_t p_largeBytes, uint8_t p_throttleMul, uint16_t p_cleanupMs) {
    g_A20_wsConfig.wsEtcConfig.chartLargeBytes = p_largeBytes;
    g_A20_wsConfig.wsEtcConfig.chartThrottleMul = p_throttleMul;
    g_A20_wsConfig.wsEtcConfig.wsCleanupMs = p_cleanupMs;
}

// ** @brief 세부 설정 포인터 획득 * /
inline ST_A20_wsEtcConfig_t* A20_GetWsEtcConfig() {
    return &g_A20_wsConfig.wsEtcConfig;
}

// ** @brief 전체 설정 초기화 (ROM 기본값으로 복구) * /
inline void A20_ResetWsConfig() {
    for (int v_i = 0; v_i < EN_A20_WS_CH_COUNT; v_i++) {
        g_A20_wsConfig.wsChConfig[v_i].chIntervalMs = G_A20_WS_CH_Base_Arr[v_i].chDefaultIntervalMs;
        g_A20_wsConfig.wsChConfig[v_i].priority     = G_A20_WS_CH_Base_Arr[v_i].defaultPriority;
    }
    g_A20_wsConfig.wsEtcConfig = G_A20_WS_ETC_DEFAULT_CONFIG;
}

*/



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
