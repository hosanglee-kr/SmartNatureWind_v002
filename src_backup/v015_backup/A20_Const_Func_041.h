#pragma once
// A20_Const_Func_041.h
// 함수 구현 전용 헤더
// (A20_Const_041.h에서 include 하여 사용)

#include <Arduino.h>      // esp_random() 등 사용시 필요
#include <string.h>
#include <strings.h>


/* ======================================================
 * 헬퍼 함수 선언
 * ====================================================== */
inline float A20_clampf(float v, float lo, float hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

inline void A20_safe_strlcpy(char* dst, const char* src, size_t n) {
    if (!dst || n == 0) return;
    if (!src) {
        dst[0] = '\0';
        return;
    }
    strlcpy(dst, src, n);
}

// ------------------------------------------------------
// 랜덤 유틸
// ------------------------------------------------------
inline float A20_getRandom01() {
    return (float)esp_random() / (float)UINT32_MAX;
}

inline float A20_randRange(float p_min, float p_max) {
    return p_min + (A20_getRandom01() * (p_max - p_min));
}

// ======================================================
// Default 초기화 헬퍼
// ======================================================

// // ------------------------------------------------------
// // 기본값 세팅 예시 (memset 이후)
// // ------------------------------------------------------
// static inline void A20_applyDefaultWebSocketConfig(ST_A20_WebSocketConfig_t& p_web) {
//     // intervals
//     p_web.wsIntervalMs[G_A20_WS_CH_STATE]   = G_A20_WS_DEFAULT_ITV_STATE_MS;
//     p_web.wsIntervalMs[G_A20_WS_CH_METRICS] = G_A20_WS_DEFAULT_ITV_METRICS_MS;
//     p_web.wsIntervalMs[G_A20_WS_CH_CHART]   = G_A20_WS_DEFAULT_ITV_CHART_MS;
//     p_web.wsIntervalMs[G_A20_WS_CH_SUMMARY] = G_A20_WS_DEFAULT_ITV_SUMMARY_MS;

//     // priority default: state -> metrics -> chart -> summary
//     p_web.wsPriority[0] = G_A20_WS_CH_STATE;
//     p_web.wsPriority[1] = G_A20_WS_CH_METRICS;
//     p_web.wsPriority[2] = G_A20_WS_CH_CHART;
//     p_web.wsPriority[3] = G_A20_WS_CH_SUMMARY;

//     // chart payload throttle
//     p_web.chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES;
//     p_web.chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL;

//     // cleanup tick
//     p_web.wsCleanupMs = G_A20_WS_DEFAULT_CLEANUP_MS;
// }

static inline void A20_resetWebSocketDefault(ST_A20_WebSocketConfig_t& p_ws) {
  p_ws.wsIntervalMs[G_A20_WS_CH_STATE]   = G_A20_WS_DEFAULT_ITV_STATE_MS;
  p_ws.wsIntervalMs[G_A20_WS_CH_METRICS] = G_A20_WS_DEFAULT_ITV_METRICS_MS;
  p_ws.wsIntervalMs[G_A20_WS_CH_CHART]   = G_A20_WS_DEFAULT_ITV_CHART_MS;
  p_ws.wsIntervalMs[G_A20_WS_CH_SUMMARY] = G_A20_WS_DEFAULT_ITV_SUMMARY_MS;

  p_ws.wsPriority[0] = G_A20_WS_CH_STATE;
  p_ws.wsPriority[1] = G_A20_WS_CH_METRICS;
  p_ws.wsPriority[2] = G_A20_WS_CH_CHART;
  p_ws.wsPriority[3] = G_A20_WS_CH_SUMMARY;

  p_ws.chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES;
  p_ws.chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL;
  p_ws.wsCleanupMs      = G_A20_WS_DEFAULT_CLEANUP_MS;
}

// System 기본값
inline void A20_resetSystemDefault(ST_A20_SystemConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    A20_safe_strlcpy(p_cfg.meta.version, A20_Const::FW_VERSION, sizeof(p_cfg.meta.version));
    A20_safe_strlcpy(p_cfg.meta.deviceName, "SmartNatureWind", sizeof(p_cfg.meta.deviceName));
    A20_safe_strlcpy(p_cfg.meta.lastUpdate, "", sizeof(p_cfg.meta.lastUpdate));

    A20_safe_strlcpy(p_cfg.system.logging.level, "INFO", sizeof(p_cfg.system.logging.level));
    p_cfg.system.logging.maxEntries = 300;


	A20_resetWebSocketDefault(p_cfg.system.webSocket);

	/*
	    // intervals
    p_cfg.system.webSocket.wsIntervalMs[G_A20_WS_CH_STATE]   = G_A20_WS_DEFAULT_ITV_STATE_MS;
    p_cfg.system.webSocket.wsIntervalMs[G_A20_WS_CH_METRICS] = G_A20_WS_DEFAULT_ITV_METRICS_MS;
    p_cfg.system.webSocket.wsIntervalMs[G_A20_WS_CH_CHART]   = G_A20_WS_DEFAULT_ITV_CHART_MS;
    p_cfg.system.webSocket.wsIntervalMs[G_A20_WS_CH_SUMMARY] = G_A20_WS_DEFAULT_ITV_SUMMARY_MS;

    // priority default: state -> metrics -> chart -> summary
    p_cfg.system.webSocket.wsPriority[0] = G_A20_WS_CH_STATE;
    p_cfg.system.webSocket.wsPriority[1] = G_A20_WS_CH_METRICS;
    p_cfg.system.webSocket.wsPriority[2] = G_A20_WS_CH_CHART;
    p_cfg.system.webSocket.wsPriority[3] = G_A20_WS_CH_SUMMARY;

    // chart payload throttle
    p_cfg.system.webSocket.chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES;
    p_cfg.system.webSocket.chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL;

    // cleanup tick
    p_cfg.system.webSocket.wsCleanupMs = G_A20_WS_DEFAULT_CLEANUP_MS;
	*/

    // HW: fanPwm
    p_cfg.hw.fanPwm.pin     = 6;
    p_cfg.hw.fanPwm.channel = 0;
    p_cfg.hw.fanPwm.freq    = 25000;
    p_cfg.hw.fanPwm.res     = 10;

    // HW: fanConfig
    p_cfg.hw.fanConfig.startPercentMin   = 10;
    p_cfg.hw.fanConfig.comfortPercentMin = 20;
    p_cfg.hw.fanConfig.comfortPercentMax = 80;
    p_cfg.hw.fanConfig.hardPercentMax    = 95;

    // HW: pir
    p_cfg.hw.pir.enabled     = true;
    p_cfg.hw.pir.pin         = 13;
    p_cfg.hw.pir.debounceSec = 5;
    p_cfg.hw.pir.holdSec     = 120;

    // HW: tempHum
    p_cfg.hw.tempHum.enabled = true;
    A20_safe_strlcpy(p_cfg.hw.tempHum.type, "DHT22", sizeof(p_cfg.hw.tempHum.type));
    p_cfg.hw.tempHum.pin         = 23;
    p_cfg.hw.tempHum.intervalSec = 30;

    // HW: ble
    p_cfg.hw.ble.enabled      = true;
    p_cfg.hw.ble.scanInterval = 5;

    // security
    A20_safe_strlcpy(p_cfg.security.apiKey, "", sizeof(p_cfg.security.apiKey));

    // time
    A20_safe_strlcpy(p_cfg.time.ntpServer, "pool.ntp.org", sizeof(p_cfg.time.ntpServer));
    A20_safe_strlcpy(p_cfg.time.timezone, "Asia/Seoul", sizeof(p_cfg.time.timezone));
    p_cfg.time.syncIntervalMin = 60;
}

// WiFi 기본값
inline void A20_resetWifiDefault(ST_A20_WifiConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    p_cfg.wifiMode = EN_A20_WIFI_MODE_AP_STA;
    A20_safe_strlcpy(p_cfg.wifiModeDesc, "0=AP,1=STA,2=AP+STA", sizeof(p_cfg.wifiModeDesc));

    A20_safe_strlcpy(p_cfg.ap.ssid, "NatureWind", sizeof(p_cfg.ap.ssid));
    A20_safe_strlcpy(p_cfg.ap.pass, "2540", sizeof(p_cfg.ap.pass));

    p_cfg.staCount = 0;
}

// Motion 기본값
inline void A20_resetMotionDefault(ST_A20_MotionConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    p_cfg.pir.enabled = true;
    p_cfg.pir.holdSec = 120;

    p_cfg.ble.enabled      = true;
    p_cfg.ble.trustedCount = 0;

    p_cfg.ble.rssi.on           = -65;
    p_cfg.ble.rssi.off          = -75;
    p_cfg.ble.rssi.avgCount     = 8;
    p_cfg.ble.rssi.persistCount = 5;
    p_cfg.ble.rssi.exitDelaySec = 12;

    // Timing 기본값
    p_cfg.timing.simIntervalMs     = 500;  // 0.5초
    p_cfg.timing.gustIntervalMs    = 2000; // 2초
    p_cfg.timing.thermalIntervalMs = 3000; // 3초
}

// WindProfile Dict 기본값
inline void A20_resetWindProfileDictDefault(ST_A20_WindProfileDict_t& p_dict) {
    memset(&p_dict, 0, sizeof(p_dict));

    p_dict.presetCount = 1;
    A20_safe_strlcpy(p_dict.presets[0].code, "OCEAN", sizeof(p_dict.presets[0].code));
    A20_safe_strlcpy(p_dict.presets[0].name, "Ocean Breeze", sizeof(p_dict.presets[0].name));

    p_dict.presets[0].base.windIntensity            = 70.0f;
    p_dict.presets[0].base.windVariability          = 50.0f;
    p_dict.presets[0].base.gustFrequency            = 45.0f;
    p_dict.presets[0].base.fanLimit                 = 90.0f;
    p_dict.presets[0].base.minFan                   = 10.0f;
    p_dict.presets[0].base.turbulenceLengthScale    = 40.0f;
    p_dict.presets[0].base.turbulenceIntensitySigma = 0.5f;
    p_dict.presets[0].base.thermalBubbleStrength    = 2.0f;
    p_dict.presets[0].base.thermalBubbleRadius      = 18.0f;

    p_dict.styleCount = 1;
    A20_safe_strlcpy(p_dict.styles[0].code, "BALANCE", sizeof(p_dict.styles[0].code));
    A20_safe_strlcpy(p_dict.styles[0].name, "Balance", sizeof(p_dict.styles[0].name));

    p_dict.styles[0].factors.intensityFactor   = 1.0f;
    p_dict.styles[0].factors.variabilityFactor = 1.0f;
    p_dict.styles[0].factors.gustFactor        = 1.0f;
    p_dict.styles[0].factors.thermalFactor     = 1.0f;
}

// Schedules 기본값
inline void A20_resetSchedulesDefault(ST_A20_SchedulesRoot_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));
    p_cfg.count = 0;
}

// UserProfiles 기본값
inline void A20_resetUserProfilesDefault(ST_A20_UserProfilesRoot_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));
    p_cfg.count = 0;
}

// ------------------------------------------------------
// NVS Spec 기본값
// ------------------------------------------------------
inline void A20_resetNvsSpecDefault(ST_A20_NvsSpecConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // namespace
    A20_safe_strlcpy(p_cfg.namespaceName, "SNW", sizeof(p_cfg.namespaceName));

    // entries (기본 스펙)
    p_cfg.entryCount = 0;

    auto addEntry = [&](const char* p_key, const char* p_type, const char* p_def) {
        if (p_cfg.entryCount >= A20_Const::MAX_NVS_ENTRIES) return;
        ST_A20_NvsEntry_t& v_e = p_cfg.entries[p_cfg.entryCount];
        memset(&v_e, 0, sizeof(v_e));
        A20_safe_strlcpy(v_e.key, p_key, sizeof(v_e.key));
        A20_safe_strlcpy(v_e.type, p_type, sizeof(v_e.type));
        A20_safe_strlcpy(v_e.defaultValue, p_def, sizeof(v_e.defaultValue));
        p_cfg.entryCount++;
    };

    addEntry("runMode", "uint8", "0");
    addEntry("activeProfileNo", "uint8", "0");
    addEntry("activeSegmentNo", "uint8", "0");
    addEntry("presetCode", "string", "");
    addEntry("styleCode", "string", "");
    addEntry("wifiConnected", "bool", "false");
}

// ------------------------------------------------------
// WebPage 기본값
// ------------------------------------------------------
inline void A20_resetWebPageDefault(ST_A20_WebPageConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // pages[] : 최소 1개 메인 페이지 기본값
    if (A20_Const::MAX_PAGES > 0) {
        p_cfg.pageCount = 1;

        ST_A20_PageItem_t& v_p = p_cfg.pages[0];
        memset(&v_p, 0, sizeof(v_p));

        A20_safe_strlcpy(v_p.uri, "/P010_main_021.html", sizeof(v_p.uri));
        A20_safe_strlcpy(v_p.path, "/html_v2/P010_main_021.html", sizeof(v_p.path));
        A20_safe_strlcpy(v_p.label, "Main", sizeof(v_p.label));

        v_p.enable = true;
        v_p.isMain = true;
        v_p.order  = 10;

        // pageAssets[] : css/js (있으면)
        v_p.pageAssetCount = 0;
        if (A20_Const::MAX_PAGE_ASSETS >= 1) {
            ST_A20_PageAsset_t& v_a0 = v_p.pageAssets[v_p.pageAssetCount++];
            memset(&v_a0, 0, sizeof(v_a0));
            A20_safe_strlcpy(v_a0.uri, "/P010_main_021.css", sizeof(v_a0.uri));
            A20_safe_strlcpy(v_a0.path, "/html_v2/P010_main_021.css", sizeof(v_a0.path));
        }
        if (A20_Const::MAX_PAGE_ASSETS >= 2) {
            ST_A20_PageAsset_t& v_a1 = v_p.pageAssets[v_p.pageAssetCount++];
            memset(&v_a1, 0, sizeof(v_a1));
            A20_safe_strlcpy(v_a1.uri, "/P010_main_021.js", sizeof(v_a1.uri));
            A20_safe_strlcpy(v_a1.path, "/html_v2/P010_main_021.js", sizeof(v_a1.path));
        }
    }

    // reDirect[] : 최소 홈 리다이렉트
    p_cfg.reDirectCount = 0;
    auto addRedirect    = [&](const char* p_from, const char* p_to) {
        if (p_cfg.reDirectCount >= A20_Const::MAX_REDIRECTS) return;
        ST_A20_ReDirectItem_t& v_r = p_cfg.reDirect[p_cfg.reDirectCount];
        memset(&v_r, 0, sizeof(v_r));
        A20_safe_strlcpy(v_r.uriFrom, p_from, sizeof(v_r.uriFrom));
        A20_safe_strlcpy(v_r.uriTo, p_to, sizeof(v_r.uriTo));
        p_cfg.reDirectCount++;
    };

    addRedirect("/", "/P010_main_021.html");
    addRedirect("/index.html", "/P010_main_021.html");
    addRedirect("/P010_main", "/P010_main_021.html");

    // assets[] : 공통 자산 기본값
    p_cfg.assetCount    = 0;
    auto addCommonAsset = [&](const char* p_uri, const char* p_path, bool p_isCommon) {
        if (p_cfg.assetCount >= A20_Const::MAX_COMMON_ASSETS) return;
        ST_A20_CommonAsset_t& v_c = p_cfg.assets[p_cfg.assetCount];
        memset(&v_c, 0, sizeof(v_c));
        A20_safe_strlcpy(v_c.uri, p_uri, sizeof(v_c.uri));
        A20_safe_strlcpy(v_c.path, p_path, sizeof(v_c.path));
        v_c.isCommon = p_isCommon;
        p_cfg.assetCount++;
    };

    addCommonAsset("/P000_common_001.css", "/html_v2/P000_common_001.css", true);
    addCommonAsset("/P000_common_006.js", "/html_v2/P000_common_006.js", true);
}

// ------------------------------------------------------
// A20_resetToDefault
// ------------------------------------------------------
inline void A20_resetToDefault(ST_A20_ConfigRoot_t& p_root) {

    if (p_root.system) A20_resetSystemDefault(*p_root.system);
    if (p_root.wifi) A20_resetWifiDefault(*p_root.wifi);
    if (p_root.motion) A20_resetMotionDefault(*p_root.motion);
    if (p_root.windDict) A20_resetWindProfileDictDefault(*p_root.windDict);
    if (p_root.schedules) A20_resetSchedulesDefault(*p_root.schedules);
    if (p_root.userProfiles) A20_resetUserProfilesDefault(*p_root.userProfiles);

    if (p_root.webPage) A20_resetWebPageDefault(*p_root.webPage);
    if (p_root.nvsSpec) A20_resetNvsSpecDefault(*p_root.nvsSpec);
}

// 프리셋 코드 → 인덱스 매핑 (참고용)
inline int8_t A20_getPresetIndexByCode(const char* code) {
    if (!code) return -1;
    for (int8_t i = 0; i < EN_A20_PRESET_COUNT; i++) {
        if (strcasecmp(code, g_A20_PRESET_CODES[i]) == 0) return i;
    }
    return -1;
}

// ------------------------------------------------------
// WindProfileDict 검색 유틸리티
// ------------------------------------------------------
inline int16_t A20_findPresetIndexByCode(const ST_A20_WindProfileDict_t& p_dict, const char* p_code) {
    if (!p_code || !p_code[0]) return -1;
    for (uint8_t v_i = 0; v_i < p_dict.presetCount; v_i++) {
        if (strcasecmp(p_dict.presets[v_i].code, p_code) == 0) return (int16_t)v_i;
    }
    return -1;
}

inline int16_t A20_findStyleIndexByCode(const ST_A20_WindProfileDict_t& p_dict, const char* p_code) {
    if (!p_code || !p_code[0]) return -1;
    for (uint8_t v_i = 0; v_i < p_dict.styleCount; v_i++) {
        if (strcasecmp(p_dict.styles[v_i].code, p_code) == 0) return (int16_t)v_i;
    }
    return -1;
}






// Schedule item default
static inline void A20_resetScheduleItemDefault(ST_A20_ScheduleItem_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));

    p_s.schId = 0;
    p_s.schNo = 0;
    strlcpy(p_s.name, "", sizeof(p_s.name));
    p_s.enabled = true;

    p_s.repeatSegments = true;
    p_s.repeatCount    = 0;

    // period defaults
    for (uint8_t v_d = 0; v_d < 7; v_d++) {
        p_s.period.days[v_d] = 1;
    }
    strlcpy(p_s.period.startTime, "00:00", sizeof(p_s.period.startTime));
    strlcpy(p_s.period.endTime, "23:59", sizeof(p_s.period.endTime));

    // segments
    p_s.segCount = 0;
    // (배열 자체는 memset으로 이미 0)

    // autoOff defaults
    p_s.autoOff.timer.enabled = false;
    p_s.autoOff.timer.minutes = 0;
    p_s.autoOff.offTime.enabled = false;
    strlcpy(p_s.autoOff.offTime.time, "", sizeof(p_s.autoOff.offTime.time));
    p_s.autoOff.offTemp.enabled = false;
    p_s.autoOff.offTemp.temp = 0.0f;

    // motion defaults
    p_s.motion.pir.enabled = false;
    p_s.motion.pir.holdSec = 0;
    p_s.motion.ble.enabled = false;
    p_s.motion.ble.rssiThreshold = -70; // 기존 기본값 유지 의도
    p_s.motion.ble.holdSec = 0;
}

// UserProfile item default
static inline void A20_resetUserProfileItemDefault(ST_A20_UserProfileItem_t& p_up) {
    memset(&p_up, 0, sizeof(p_up));

    p_up.profileId = 0;
    p_up.profileNo = 0;
    strlcpy(p_up.name, "", sizeof(p_up.name));
    p_up.enabled = true;

    p_up.repeatSegments = true;
    p_up.repeatCount    = 0;

    p_up.segCount = 0;

    p_up.autoOff.timer.enabled = false;
    p_up.autoOff.timer.minutes = 0;
    p_up.autoOff.offTime.enabled = false;
    strlcpy(p_up.autoOff.offTime.time, "", sizeof(p_up.autoOff.offTime.time));
    p_up.autoOff.offTemp.enabled = false;
    p_up.autoOff.offTemp.temp = 0.0f;

    p_up.motion.pir.enabled = false;
    p_up.motion.pir.holdSec = 0;
    p_up.motion.ble.enabled = false;
    p_up.motion.ble.rssiThreshold = -70;
    p_up.motion.ble.holdSec = 0;
}



static inline void A20_resetPresetEntryDefault(ST_A20_PresetEntry_t& p_p) {
    memset(&p_p, 0, sizeof(p_p));

    strlcpy(p_p.name, "", sizeof(p_p.name));
    strlcpy(p_p.code, "", sizeof(p_p.code));

    // base defaults (기존 fromJson의 | 기본값과 동일하게 맞춰주는 게 안정적)
    p_p.base.windIntensity            = 70.0f;
    p_p.base.gustFrequency            = 40.0f;
    p_p.base.windVariability          = 50.0f;
    p_p.base.fanLimit                 = 95.0f;
    p_p.base.minFan                   = 10.0f;
    p_p.base.turbulenceLengthScale    = 40.0f;
    p_p.base.turbulenceIntensitySigma = 0.5f;
    p_p.base.thermalBubbleStrength    = 2.0f;
    p_p.base.thermalBubbleRadius      = 18.0f;

    p_p.base.baseMinWind     = 1.8f;
    p_p.base.baseMaxWind     = 5.5f;
    p_p.base.gustProbBase    = 0.040f;
    p_p.base.gustStrengthMax = 2.10f;
    p_p.base.thermalFreqBase = 0.022f;
}

static inline void A20_resetStyleEntryDefault(ST_A20_StyleEntry_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));

    strlcpy(p_s.name, "", sizeof(p_s.name));
    strlcpy(p_s.code, "", sizeof(p_s.code));

    // factors defaults
    p_s.factors.intensityFactor   = 1.0f;
    p_s.factors.variabilityFactor = 1.0f;
    p_s.factors.gustFactor        = 1.0f;
    p_s.factors.thermalFactor     = 1.0f;
}


