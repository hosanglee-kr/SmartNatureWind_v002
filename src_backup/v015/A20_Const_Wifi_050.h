 // 소스명 : A20_Const_Wifi_044.h


#pragma once
#include <Arduino.h>

#include "A20_Const_Const_050.h"


typedef enum : uint8_t {
    EN_A20_WIFI_MODE_AP     = 0,
    EN_A20_WIFI_MODE_STA    = 1,
    EN_A20_WIFI_MODE_AP_STA = 2,
} EN_A20_WIFI_MODE_t;

// ------------------------------------------------------
// WIFI 설정 (cfg_wifi_xxx.json) : camelCase 정합
//   wifi.wifiMode, wifi.wifiModeDesc
//   wifi.ap{ssid,pass}
//   wifi.sta[]{ssid,pass}
// -----------------------------------------------------
typedef struct {
    char ssid[A20_Const::LEN_SSID];
    char pass[A20_Const::LEN_PASS];
} ST_A20_WifiCredentials_t;


typedef struct {
    EN_A20_WIFI_MODE_t wifiMode;
    char               wifiModeDesc[48];

    ST_A20_WifiCredentials_t ap;

    ST_A20_WifiCredentials_t sta[A20_Const::MAX_STA_NETWORKS];
    uint8_t             staCount; // 파싱 시 채움
} ST_A20_WifiConfig_t;
