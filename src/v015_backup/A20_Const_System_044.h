 // 소스명 : A20_Const_System_044.h


#pragma once

#include "A20_Const_Const_044.h"

//#include "A20_Const_WS_044.h"


// ------------------------------------------------------
// configJsonFile (10_cfg_jsonFile.json) : camelCase 정합
//   configJsonFile.system
//   configJsonFile.wifi
//   configJsonFile.motion
//   configJsonFile.nvsSpec
//   configJsonFile.schedules
//   configJsonFile.userProfiles
//   configJsonFile.windDict
//   configJsonFile.webPage
// ------------------------------------------------------
typedef struct ST_A20_cfg_jsonFile_t {
    char system[A20_Const::LEN_PATH];
    char wifi[A20_Const::LEN_PATH];
    char motion[A20_Const::LEN_PATH];
    char nvsSpec[A20_Const::LEN_PATH];
    char schedules[A20_Const::LEN_PATH];
    char userProfiles[A20_Const::LEN_PATH];
    char windDict[A20_Const::LEN_PATH];
    char webPage[A20_Const::LEN_PATH];
} ST_A20_cfg_jsonFile_t;



//  ======================================================
// Web Page (cfg_pages_xxx.json) : camelCase 정합
typedef struct ST_A20_PageAsset_t {
    char uri[A20_Const::LEN_URI];   // "/P010_main_021.css"
    char path[A20_Const::LEN_PATH]; // "/html_v2/P010_main_021.css"
} ST_A20_PageAsset_t;

typedef struct ST_A20_PageItem_t {
    char     uri[A20_Const::LEN_URI];     // "/P010_main_021.html"
    char     path[A20_Const::LEN_PATH];   // "/html_v2/P010_main_021.html"
    char     label[A20_Const::LEN_LABEL]; // "Main"
    bool     enable = true;               // JSON tag: "enable"
    bool     isMain = false;              // JSON tag: "isMain"
    uint16_t order  = 0;                  // JSON tag: "order"

    uint8_t            pageAssetCount = 0;                     // pageAssets[] 개수
    ST_A20_PageAsset_t pageAssets[A20_Const::MAX_PAGE_ASSETS]; // JSON tag: "pageAssets"
} ST_A20_PageItem_t;

typedef struct ST_A20_ReDirectItem_t {
    char uriFrom[A20_Const::LEN_URI];
    char uriTo[A20_Const::LEN_URI];
} ST_A20_ReDirectItem_t;

typedef struct ST_A20_CommonAsset_t {
    char uri[A20_Const::LEN_URI];
    char path[A20_Const::LEN_PATH];
    bool isCommon = false; // JSON tag: "isCommon"
} ST_A20_CommonAsset_t;

typedef struct ST_A20_WebPageConfig_t {
    // JSON 루트 그대로: pages[], reDirect[], assets[]
    uint8_t           		pageCount = 0;
    ST_A20_PageItem_t 		pages[A20_Const::MAX_PAGES];

    uint8_t               	reDirectCount = 0;
    ST_A20_ReDirectItem_t 	reDirect[A20_Const::MAX_REDIRECTS]; // JSON tag: "reDirect"

    uint8_t              	assetCount = 0;
    ST_A20_CommonAsset_t 	assets[A20_Const::MAX_COMMON_ASSETS];
} ST_A20_WebPageConfig_t;

// ------------------------------------------------------
// SYSTEM 설정 (cfg_system_xxx.json) : camelCase 정합
//   meta.version, meta.deviceName, meta.lastUpdate
//   system.logging.level, system.logging.maxEntries
//   hw.fanPwm{pin,channel,freq,res}
//   hw.fanConfig{startPercentMin,comfortPercentMin,comfortPercentMax,hardPercentMax}
//   hw.pir{enabled,pin,debounceSec,holdSec}
//   hw.tempHum{enabled,type,pin,intervalSec}
//   hw.ble{enabled,scanInterval}
//   security.apiKey
//   time.ntpServer, time.timezone, time.syncIntervalMin
// ------------------------------------------------------
typedef struct {
    uint8_t startPercentMin;   // 시동이 확실히 거는 최소 구간 (예: 18)
    uint8_t comfortPercentMin; // “편안한 바람” 구간 시작 (예: 22), “체감 바람” 시작점 (예: 22%)
    uint8_t comfortPercentMax; // “편안한 바람” 구간 끝   (예: 65)  소음/체감 균형 좋은 상한 (예: 65%)
    uint8_t hardPercentMax;    // 팬/소음/내구성 상으로 무리 없는 상한 (예: 90)
} ST_A20_FanConfig_t;

typedef struct {
    int16_t  pin;
    uint8_t  channel;
    uint32_t freq;
    uint8_t  res;
} ST_A20_SysFanPwmHWCfg;

typedef struct {
    bool     enabled;
    int16_t  pin;
    uint16_t debounceSec;
    uint16_t holdSec;
} ST_A20_SysPirHWCfg;

typedef struct {
    bool     enabled;
    char     type[16];
    int16_t  pin;
    uint16_t intervalSec;
} ST_A20_SysDhtHWCfg;

typedef struct {
    bool     enabled;
    uint16_t scanInterval;
} ST_A20_SysBLECfg;

typedef struct {
    char     ntpServer[64];
    char     timezone[64];
    uint16_t syncIntervalMin;
} ST_A20_SysTimeConfig_t;

typedef struct {
    struct {
        char version[A20_Const::LEN_NAME];
        char deviceName[A20_Const::LEN_NAME];
        char lastUpdate[A20_Const::LEN_NAME];
    } meta;

    struct {
        struct {
            char     level[A20_Const::LEN_LEVEL];
            uint16_t maxEntries;
        } logging;
        ST_A20_WebSocketConfig_t webSocket;
    } system;

    struct {
        ST_A20_SysFanPwmHWCfg fanPwm;
        /*
        struct {
            int16_t  pin;
            uint8_t  channel;
            uint32_t freq;
            uint8_t  res;
        } fanPwm;
        */

        ST_A20_FanConfig_t fanConfig;

        struct {
            bool     enabled;
            int16_t  pin;
            uint16_t debounceSec;
            uint16_t holdSec;
        } pir;

        struct {
            bool     enabled;
            char     type[16];
            int16_t  pin;
            uint16_t intervalSec;
        } tempHum;

        struct {
            bool     enabled;
            uint16_t scanInterval;
        } ble;
    } hw;

    struct {
        char apiKey[64];
    } security;
   
    ST_A20_SysTimeConfig_t timeCfg;
    //// struct {
     /////   char     ntpServer[64];
     ////   char     timezone[32];
     ////   uint16_t syncIntervalMin;
    ////} time;
} ST_A20_SystemConfig_t;




// NVS Spec (cfg_nvsSpec_xxx.json) : camelCase 정합
typedef struct ST_A20_NvsEntry_t {
    char key[A20_Const::LEN_NVS_KEY];                  // "runMode"
    char type[A20_Const::LEN_NVS_TYPE];                // "uint8" | "bool" | "string" ...
    char defaultValue[A20_Const::LEN_NVS_DEFAULT_STR]; // 숫자/불리언/문자열 모두 문자열로 저장("0","false","")
} ST_A20_NvsEntry_t;

typedef struct ST_A20_NvsSpecConfig_t {
    char              namespaceName[A20_Const::LEN_NVS_NAMESPACE]; // JSON tag: "namespace"
    uint8_t           entryCount = 0;                              // entries[] 개수
    ST_A20_NvsEntry_t entries[A20_Const::MAX_NVS_ENTRIES];
} ST_A20_NvsSpecConfig_t;

