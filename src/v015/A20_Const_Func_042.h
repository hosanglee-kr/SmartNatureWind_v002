#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : A20_Const_Func_042.h
 * 모듈약어 : A20
 * 모듈명 : Smart Nature Wind 공용 헬퍼/기본값 함수 구현 전용 헤더 (v042)
 * ------------------------------------------------------
 * 기능 요약
 *  - 공용 헬퍼(Clamp/SafeCopy/Random)
 *  - Mode String 매핑 유틸
 *  - Default Reset 함수들 (Root/Config/Item/Dict)
 *  - WindProfileDict 검색 유틸
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 *  - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 변수명은 가능한 해석 가능하게
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - namespace 명        : 모듈약어_ 접두사
 *   - namespace 내 상수    : 모둘약어 접두시 미사용
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사 , 버전 제거
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <string.h>
#include <strings.h>

// NOTE:
// - 본 헤더는 A20_Const_041.h에서 include하여 사용합니다.
// - A20_Const_041.h에 정의된 타입/상수/전역(예: A20_Const::*, ST_A20_*, EN_A20_*)에 의존합니다.

// ======================================================
// 1) 공용 헬퍼 (Clamp/SafeCopy/Random)
// ======================================================
inline float A20_clampf(float p_v, float p_lo, float p_hi) {
    if (p_v < p_lo) return p_lo;
    if (p_v > p_hi) return p_hi;
    return p_v;
}

inline void A20_safe_strlcpy(char* p_dst, const char* p_src, size_t p_n) {
    if (!p_dst || p_n == 0) return;
    if (!p_src) {
        p_dst[0] = '\0';
        return;
    }
    strlcpy(p_dst, p_src, p_n);
}

inline float A20_getRandom01() {
    return (float)esp_random() / (float)UINT32_MAX;
}

inline float A20_randRange(float p_min, float p_max) {
    return p_min + (A20_getRandom01() * (p_max - p_min));
}

// ======================================================
// 2) Segment Mode <-> String 매핑 유틸
//    (A20_Const_041.h에 이미 존재하면 중복 정의 방지 필요)
// ======================================================
#ifndef A20_SEG_MODE_UTIL_DEFINED
#define A20_SEG_MODE_UTIL_DEFINED

// g_A20_SEG_MODE_NAMES / A20_modeFromString / A20_modeToString 가
// A20_Const_041.h에 이미 정의되어 있다면 이 블록은 컴파일 중복이 될 수 있습니다.
// 그 경우 A20_Const_041.h에서 A20_SEG_MODE_UTIL_DEFINED 를 먼저 define 하거나,
// 아래 블록을 제거하세요.

inline EN_A20_segment_mode_t A20_modeFromString(const char* p_str) {
    if (!p_str) return EN_A20_SEG_MODE_PRESET;
    for (uint8_t v_i = 0; v_i < EN_A20_SEG_MODE_COUNT; v_i++) {
        if (strcasecmp(p_str, g_A20_SEG_MODE_NAMES[v_i]) == 0) return static_cast<EN_A20_segment_mode_t>(v_i);
    }
    return EN_A20_SEG_MODE_PRESET;
}

inline const char* A20_modeToString(EN_A20_segment_mode_t p_mode) {
    if (p_mode >= EN_A20_SEG_MODE_COUNT) return "PRESET";
    return g_A20_SEG_MODE_NAMES[p_mode];
}
#endif

// ======================================================
// 3) Default Reset - WebSocket/System/WiFi/Motion/WindDict
// ======================================================
static inline void A20_resetWebSocketDefault(ST_A20_WebSocketConfig_t& p_ws) {
    // intervals
    p_ws.wsIntervalMs[G_A20_WS_CH_STATE]   = G_A20_WS_DEFAULT_ITV_STATE_MS;
    p_ws.wsIntervalMs[G_A20_WS_CH_METRICS] = G_A20_WS_DEFAULT_ITV_METRICS_MS;
    p_ws.wsIntervalMs[G_A20_WS_CH_CHART]   = G_A20_WS_DEFAULT_ITV_CHART_MS;
    p_ws.wsIntervalMs[G_A20_WS_CH_SUMMARY] = G_A20_WS_DEFAULT_ITV_SUMMARY_MS;

    // priority default: state -> metrics -> chart -> summary
    p_ws.wsPriority[0] = G_A20_WS_CH_STATE;
    p_ws.wsPriority[1] = G_A20_WS_CH_METRICS;
    p_ws.wsPriority[2] = G_A20_WS_CH_CHART;
    p_ws.wsPriority[3] = G_A20_WS_CH_SUMMARY;

    // chart payload throttle
    p_ws.chartLargeBytes  = G_A20_WS_DEFAULT_CHART_LARGE_BYTES;
    p_ws.chartThrottleMul = G_A20_WS_DEFAULT_CHART_THROTTLE_MUL;

    // cleanup tick
    p_ws.wsCleanupMs = G_A20_WS_DEFAULT_CLEANUP_MS;
}

inline void A20_resetSystemDefault(ST_A20_SystemConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // meta
    A20_safe_strlcpy(p_cfg.meta.version, A20_Const::FW_VERSION, sizeof(p_cfg.meta.version));
    A20_safe_strlcpy(p_cfg.meta.deviceName, "SmartNatureWind", sizeof(p_cfg.meta.deviceName));
    A20_safe_strlcpy(p_cfg.meta.lastUpdate, "", sizeof(p_cfg.meta.lastUpdate));

    // logging
    A20_safe_strlcpy(p_cfg.system.logging.level, "INFO", sizeof(p_cfg.system.logging.level));
    p_cfg.system.logging.maxEntries = 300;

    // webSocket
    A20_resetWebSocketDefault(p_cfg.system.webSocket);

    // hw: fanPwm
    p_cfg.hw.fanPwm.pin     = 6;
    p_cfg.hw.fanPwm.channel = 0;
    p_cfg.hw.fanPwm.freq    = 25000;
    p_cfg.hw.fanPwm.res     = 10;

    // hw: fanConfig
    p_cfg.hw.fanConfig.startPercentMin   = 10;
    p_cfg.hw.fanConfig.comfortPercentMin = 20;
    p_cfg.hw.fanConfig.comfortPercentMax = 80;
    p_cfg.hw.fanConfig.hardPercentMax    = 95;

    // hw: pir
    p_cfg.hw.pir.enabled     = true;
    p_cfg.hw.pir.pin         = 13;
    p_cfg.hw.pir.debounceSec = 5;
    p_cfg.hw.pir.holdSec     = 120;

    // hw: tempHum
    p_cfg.hw.tempHum.enabled = true;
    A20_safe_strlcpy(p_cfg.hw.tempHum.type, "DHT22", sizeof(p_cfg.hw.tempHum.type));
    p_cfg.hw.tempHum.pin         = 23;
    p_cfg.hw.tempHum.intervalSec = 30;

    // hw: ble
    p_cfg.hw.ble.enabled      = true;
    p_cfg.hw.ble.scanInterval = 5;

    // security
    A20_safe_strlcpy(p_cfg.security.apiKey, "", sizeof(p_cfg.security.apiKey));

    // time
    A20_safe_strlcpy(p_cfg.time.ntpServer, "pool.ntp.org", sizeof(p_cfg.time.ntpServer));
    A20_safe_strlcpy(p_cfg.time.timezone, "Asia/Seoul", sizeof(p_cfg.time.timezone));
    p_cfg.time.syncIntervalMin = 60;
}

inline void A20_resetWifiDefault(ST_A20_WifiConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    p_cfg.wifiMode = EN_A20_WIFI_MODE_AP_STA;
    A20_safe_strlcpy(p_cfg.wifiModeDesc, "0=AP,1=STA,2=AP+STA", sizeof(p_cfg.wifiModeDesc));

    A20_safe_strlcpy(p_cfg.ap.ssid, "NatureWind", sizeof(p_cfg.ap.ssid));
    A20_safe_strlcpy(p_cfg.ap.pass, "2540", sizeof(p_cfg.ap.pass));

    // sta[]
    p_cfg.staCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_STA_NETWORKS; v_i++) {
        memset(&p_cfg.sta[v_i], 0, sizeof(p_cfg.sta[v_i]));
    }
}

inline void A20_resetMotionDefault(ST_A20_MotionConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // pir
    p_cfg.pir.enabled = true;
    p_cfg.pir.holdSec = 120;

    // ble
    p_cfg.ble.enabled      = true;
    p_cfg.ble.trustedCount = 0;

    // trustedDevices[] clear
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_BLE_DEVICES; v_i++) {
        memset(&p_cfg.ble.trustedDevices[v_i], 0, sizeof(p_cfg.ble.trustedDevices[v_i]));
    }

    // rssi
    p_cfg.ble.rssi.on           = -65;
    p_cfg.ble.rssi.off          = -75;
    p_cfg.ble.rssi.avgCount     = 8;
    p_cfg.ble.rssi.persistCount = 5;
    p_cfg.ble.rssi.exitDelaySec = 12;

    // timing
    p_cfg.timing.simIntervalMs     = 500;
    p_cfg.timing.gustIntervalMs    = 2000;
    p_cfg.timing.thermalIntervalMs = 3000;
}

inline void A20_resetPresetEntryDefault(ST_A20_PresetEntry_t& p_p) {
    memset(&p_p, 0, sizeof(p_p));

    A20_safe_strlcpy(p_p.name, "", sizeof(p_p.name));
    A20_safe_strlcpy(p_p.code, "", sizeof(p_p.code));

    // base defaults (C10_fromJson_WindPreset의 | 기본값과 동일)
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

inline void A20_resetStyleEntryDefault(ST_A20_StyleEntry_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));

    A20_safe_strlcpy(p_s.name, "", sizeof(p_s.name));
    A20_safe_strlcpy(p_s.code, "", sizeof(p_s.code));

    p_s.factors.intensityFactor   = 1.0f;
    p_s.factors.variabilityFactor = 1.0f;
    p_s.factors.gustFactor        = 1.0f;
    p_s.factors.thermalFactor     = 1.0f;
}

inline void A20_resetWindProfileDictDefault(ST_A20_WindProfileDict_t& p_dict) {
    memset(&p_dict, 0, sizeof(p_dict));

    // 전체 엔트리 기본값(안전)
    for (uint8_t v_i = 0; v_i < A20_Const::WIND_PRESETS_MAX; v_i++) {
        A20_resetPresetEntryDefault(p_dict.presets[v_i]);
    }
    for (uint8_t v_i = 0; v_i < A20_Const::WIND_STYLES_MAX; v_i++) {
        A20_resetStyleEntryDefault(p_dict.styles[v_i]);
    }

    // 샘플 기본 1개
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

    p_dict.presets[0].base.baseMinWind     = 1.8f;
    p_dict.presets[0].base.baseMaxWind     = 5.5f;
    p_dict.presets[0].base.gustProbBase    = 0.040f;
    p_dict.presets[0].base.gustStrengthMax = 2.10f;
    p_dict.presets[0].base.thermalFreqBase = 0.022f;

    p_dict.styleCount = 1;
    A20_safe_strlcpy(p_dict.styles[0].code, "BALANCE", sizeof(p_dict.styles[0].code));
    A20_safe_strlcpy(p_dict.styles[0].name, "Balance", sizeof(p_dict.styles[0].name));

    p_dict.styles[0].factors.intensityFactor   = 1.0f;
    p_dict.styles[0].factors.variabilityFactor = 1.0f;
    p_dict.styles[0].factors.gustFactor        = 1.0f;
    p_dict.styles[0].factors.thermalFactor     = 1.0f;
}

// ======================================================
// 4) Default Reset - NVS Spec / WebPage
// ======================================================
inline void A20_resetNvsSpecDefault(ST_A20_NvsSpecConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // namespace
    A20_safe_strlcpy(p_cfg.namespaceName, "SNW", sizeof(p_cfg.namespaceName));

    // entries
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

    // reDirect[] : 기본 홈 리다이렉트
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

// ======================================================
// 5) Default Reset - Schedule/UserProfile Item/Root
// ======================================================
static inline void A20_applyDefaultScheduleSegments(ST_A20_ScheduleItem_t& p_s) {
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        p_s.segments[v_i].mode = EN_A20_SEG_MODE_PRESET;
    }
}

static inline void A20_applyDefaultUserProfileSegments(ST_A20_UserProfileItem_t& p_up) {
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        p_up.segments[v_i].mode = EN_A20_SEG_MODE_PRESET;
    }
}

static inline void A20_resetScheduleItemDefault(ST_A20_ScheduleItem_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));

    // id/no/name/enabled
    p_s.schId   = 0;
    p_s.schNo   = 0;
    A20_safe_strlcpy(p_s.name, "", sizeof(p_s.name));
    p_s.enabled = true;

    // repeat
    p_s.repeatSegments = true;
    p_s.repeatCount    = 0;

    // period defaults
    for (uint8_t v_d = 0; v_d < 7; v_d++) {
        p_s.period.days[v_d] = 1;
    }
    A20_safe_strlcpy(p_s.period.startTime, "00:00", sizeof(p_s.period.startTime));
    A20_safe_strlcpy(p_s.period.endTime, "23:59", sizeof(p_s.period.endTime));

    // segments
    p_s.segCount = 0;
    A20_applyDefaultScheduleSegments(p_s);

    // autoOff defaults
    p_s.autoOff.timer.enabled   = false;
    p_s.autoOff.timer.minutes   = 0;
    p_s.autoOff.offTime.enabled = false;
    A20_safe_strlcpy(p_s.autoOff.offTime.time, "", sizeof(p_s.autoOff.offTime.time));
    p_s.autoOff.offTemp.enabled = false;
    p_s.autoOff.offTemp.temp    = 0.0f;

    // motion defaults
    p_s.motion.pir.enabled = false;
    p_s.motion.pir.holdSec = 0;

    p_s.motion.ble.enabled       = false;
    p_s.motion.ble.rssiThreshold = -70;
    p_s.motion.ble.holdSec       = 0;
}

static inline void A20_resetUserProfileItemDefault(ST_A20_UserProfileItem_t& p_up) {
    memset(&p_up, 0, sizeof(p_up));

    // id/no/name/enabled
    p_up.profileId = 0;
    p_up.profileNo = 0;
    A20_safe_strlcpy(p_up.name, "", sizeof(p_up.name));
    p_up.enabled = true;

    // repeat
    p_up.repeatSegments = true;
    p_up.repeatCount    = 0;

    // segments
    p_up.segCount = 0;
    A20_applyDefaultUserProfileSegments(p_up);

    // autoOff defaults
    p_up.autoOff.timer.enabled   = false;
    p_up.autoOff.timer.minutes   = 0;
    p_up.autoOff.offTime.enabled = false;
    A20_safe_strlcpy(p_up.autoOff.offTime.time, "", sizeof(p_up.autoOff.offTime.time));
    p_up.autoOff.offTemp.enabled = false;
    p_up.autoOff.offTemp.temp    = 0.0f;

    // motion defaults
    p_up.motion.pir.enabled = false;
    p_up.motion.pir.holdSec = 0;

    p_up.motion.ble.enabled       = false;
    p_up.motion.ble.rssiThreshold = -70;
    p_up.motion.ble.holdSec       = 0;
}

inline void A20_resetSchedulesDefault(ST_A20_SchedulesRoot_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));
    p_cfg.count = 0;

    for (uint8_t v_i = 0; v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        A20_resetScheduleItemDefault(p_cfg.items[v_i]);
    }
}

inline void A20_resetUserProfilesDefault(ST_A20_UserProfilesRoot_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));
    p_cfg.count = 0;

    for (uint8_t v_i = 0; v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        A20_resetUserProfileItemDefault(p_cfg.items[v_i]);
    }
}

// ======================================================
// 6) Default Reset - Root
// ======================================================
inline void A20_resetToDefault(ST_A20_ConfigRoot_t& p_root) {
    if (p_root.system) A20_resetSystemDefault(*p_root.system);
    if (p_root.wifi) A20_resetWifiDefault(*p_root.wifi);
    if (p_root.motion) A20_resetMotionDefault(*p_root.motion);
    if (p_root.nvsSpec) A20_resetNvsSpecDefault(*p_root.nvsSpec);
    if (p_root.windDict) A20_resetWindProfileDictDefault(*p_root.windDict);
    if (p_root.schedules) A20_resetSchedulesDefault(*p_root.schedules);
    if (p_root.userProfiles) A20_resetUserProfilesDefault(*p_root.userProfiles);
    if (p_root.webPage) A20_resetWebPageDefault(*p_root.webPage);
}

// ======================================================
// 7) WindProfileDict 유틸 (Index Find / PresetCode Legacy)
// ======================================================
inline int8_t A20_getPresetIndexByCode(const char* p_code) {
    if (!p_code) return -1;
    for (int8_t v_i = 0; v_i < EN_A20_PRESET_COUNT; v_i++) {
        if (strcasecmp(p_code, g_A20_PRESET_CODES[v_i]) == 0) return v_i;
    }
    return -1;
}

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

