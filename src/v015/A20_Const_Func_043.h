#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : A20_Const_Func_043.h
 * 모듈약어 : A20
 * 모듈명 : Smart Nature Wind 공용 헬퍼/기본값 함수 구현 전용 헤더 (v041)
 * ------------------------------------------------------
 * 기능 요약
 *  - 공용 헬퍼(Clamp/SafeCopy/Random)
 *  - Segment Mode String 매핑 유틸 (A20_modeFromString / A20_modeToString)
 *  - 하위 구조체 단위 Reset(Period/Segment/AutoOff/Motion/Adjust 등)
 *  - Default Reset (System/WiFi/Motion/WindDict/NvsSpec/WebPage/Schedules/UserProfiles/Root)
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
// 1) 공용 헬퍼
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
// ======================================================
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

// ======================================================
// 3) 하위 구조체 단위 Reset (누락 방지 목적)
// ======================================================

// -------------------------
// WebSocketConfig
// -------------------------
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

    p_ws.wsCleanupMs = G_A20_WS_DEFAULT_CLEANUP_MS;
}

// -------------------------
// Motion / AutoOff (Schedule/UserProfile 공통)
// -------------------------
static inline void A20_resetPirDefault(ST_A20_PIR_t& p_pir) {
    p_pir.enabled = false;
    p_pir.holdSec = 0;
}

static inline void A20_resetBleDefault(ST_A20_BLE_t& p_ble) {
    p_ble.enabled       = false;
    p_ble.rssiThreshold = -70;
    p_ble.holdSec       = 0;
}

static inline void A20_resetMotionCommonDefault(ST_A20_Motion_t& p_motion) {
    A20_resetPirDefault(p_motion.pir);
    A20_resetBleDefault(p_motion.ble);
}

static inline void A20_resetAutoOffDefault(ST_A20_AutoOff_t& p_autoOff) {
    p_autoOff.timer.enabled = false;
    p_autoOff.timer.minutes = 0;

    p_autoOff.offTime.enabled = false;
    memset(p_autoOff.offTime.time, 0, sizeof(p_autoOff.offTime.time)); // "HH:MM"

    p_autoOff.offTemp.enabled = false;
    p_autoOff.offTemp.temp    = 0.0f;
}

static inline void A20_resetSchAutoOffDefault(ST_A20_SchAutoOff_t& p_autoOff) {
    A20_resetAutoOffDefault(p_autoOff);
}

// -------------------------
// AdjustDelta
// -------------------------
static inline void A20_resetAdjustDeltaDefault(ST_A20_AdjustDelta_t& p_adj) {
    p_adj.windIntensity            = 0.0f;
    p_adj.gustFrequency            = 0.0f;
    p_adj.windVariability          = 0.0f;
    p_adj.fanLimit                 = 0.0f;
    p_adj.minFan                   = 0.0f;
    p_adj.turbulenceLengthScale    = 0.0f;
    p_adj.turbulenceIntensitySigma = 0.0f;
    p_adj.thermalBubbleStrength    = 0.0f;
    p_adj.thermalBubbleRadius      = 0.0f;
}

// -------------------------
// SchedulePeriod
// -------------------------
static inline void A20_resetSchedulePeriodDefault(ST_A20_SchedulePeriod_t& p_period) {
    for (uint8_t v_d = 0; v_d < 7; v_d++) {
        p_period.days[v_d] = 1;
    }
    A20_safe_strlcpy(p_period.startTime, "00:00", sizeof(p_period.startTime));
    A20_safe_strlcpy(p_period.endTime, "23:59", sizeof(p_period.endTime));
}

// -------------------------
// ScheduleSegment / UserProfileSegment
// -------------------------
static inline void A20_resetScheduleSegmentDefault(ST_A20_ScheduleSegment_t& p_seg) {
    memset(&p_seg, 0, sizeof(p_seg));

    p_seg.segId      = 0;
    p_seg.segNo      = 0;
    p_seg.onMinutes  = 0;
    p_seg.offMinutes = 0;

    p_seg.mode = EN_A20_SEG_MODE_PRESET;

    memset(p_seg.presetCode, 0, sizeof(p_seg.presetCode));
    memset(p_seg.styleCode, 0, sizeof(p_seg.styleCode));
    A20_resetAdjustDeltaDefault(p_seg.adjust);

    p_seg.fixedSpeed = 0.0f;
}

static inline void A20_resetUserProfileSegmentDefault(ST_A20_UserProfileSegment_t& p_seg) {
    memset(&p_seg, 0, sizeof(p_seg));

    p_seg.segId      = 0;
    p_seg.segNo      = 0;
    p_seg.onMinutes  = 0;
    p_seg.offMinutes = 0;

    p_seg.mode = EN_A20_SEG_MODE_PRESET;

    memset(p_seg.presetCode, 0, sizeof(p_seg.presetCode));
    memset(p_seg.styleCode, 0, sizeof(p_seg.styleCode));
    A20_resetAdjustDeltaDefault(p_seg.adjust);

    p_seg.fixedSpeed = 0.0f;
}

// -------------------------
// ResolvedWind (시뮬 전달용)
// -------------------------
static inline void A20_resetResolvedWindDefault(ST_A20_ResolvedWind_t& p_r) {
    memset(&p_r, 0, sizeof(p_r));

    memset(p_r.presetCode, 0, sizeof(p_r.presetCode));
    memset(p_r.styleCode, 0, sizeof(p_r.styleCode));

    p_r.valid      = false;
    p_r.fixedMode  = false;
    p_r.fixedSpeed = 0.0f;

    p_r.windIntensity            = 0.0f;
    p_r.gustFrequency            = 0.0f;
    p_r.windVariability          = 0.0f;
    p_r.fanLimit                 = 0.0f;
    p_r.minFan                   = 0.0f;
    p_r.turbulenceLengthScale    = 0.0f;
    p_r.turbulenceIntensitySigma = 0.0f;
    p_r.thermalBubbleStrength    = 0.0f;
    p_r.thermalBubbleRadius      = 0.0f;

    p_r.baseMinWind     = 0.0f;
    p_r.baseMaxWind     = 0.0f;
    p_r.gustProbBase    = 0.0f;
    p_r.gustStrengthMax = 0.0f;
    p_r.thermalFreqBase = 0.0f;
}

// -------------------------
// Wind Dict entries
// -------------------------
static inline void A20_resetWindBaseDefault(ST_A20_WindBase_t& p_b) {
    p_b.windIntensity            = 70.0f;
    p_b.gustFrequency            = 40.0f;
    p_b.windVariability          = 50.0f;
    p_b.fanLimit                 = 95.0f;
    p_b.minFan                   = 10.0f;
    p_b.turbulenceLengthScale    = 40.0f;
    p_b.turbulenceIntensitySigma = 0.5f;
    p_b.thermalBubbleStrength    = 2.0f;
    p_b.thermalBubbleRadius      = 18.0f;

    p_b.baseMinWind     = 1.8f;
    p_b.baseMaxWind     = 5.5f;
    p_b.gustProbBase    = 0.040f;
    p_b.gustStrengthMax = 2.10f;
    p_b.thermalFreqBase = 0.022f;
}

static inline void A20_resetPresetEntryDefault(ST_A20_PresetEntry_t& p_p) {
    memset(&p_p, 0, sizeof(p_p));
    A20_safe_strlcpy(p_p.code, "", sizeof(p_p.code));
    A20_safe_strlcpy(p_p.name, "", sizeof(p_p.name));
    A20_resetWindBaseDefault(p_p.base);
}

static inline void A20_resetStyleFactorsDefault(ST_A20_StyleFactors_t& p_f) {
    p_f.intensityFactor   = 1.0f;
    p_f.variabilityFactor = 1.0f;
    p_f.gustFactor        = 1.0f;
    p_f.thermalFactor     = 1.0f;
}

static inline void A20_resetStyleEntryDefault(ST_A20_StyleEntry_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));
    A20_safe_strlcpy(p_s.code, "", sizeof(p_s.code));
    A20_safe_strlcpy(p_s.name, "", sizeof(p_s.name));
    A20_resetStyleFactorsDefault(p_s.factors);
}

// -------------------------
// WebPage entries
// -------------------------
static inline void A20_resetPageAssetDefault(ST_A20_PageAsset_t& p_a) {
    memset(&p_a, 0, sizeof(p_a));
    memset(p_a.uri, 0, sizeof(p_a.uri));
    memset(p_a.path, 0, sizeof(p_a.path));
}

static inline void A20_resetPageItemDefault(ST_A20_PageItem_t& p_p) {
    memset(&p_p, 0, sizeof(p_p));

    memset(p_p.uri, 0, sizeof(p_p.uri));
    memset(p_p.path, 0, sizeof(p_p.path));
    memset(p_p.label, 0, sizeof(p_p.label));

    p_p.enable = true;
    p_p.isMain = false;
    p_p.order  = 0;

    p_p.pageAssetCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_PAGE_ASSETS; v_i++) {
        A20_resetPageAssetDefault(p_p.pageAssets[v_i]);
    }
}

static inline void A20_resetRedirectItemDefault(ST_A20_ReDirectItem_t& p_r) {
    memset(&p_r, 0, sizeof(p_r));
    memset(p_r.uriFrom, 0, sizeof(p_r.uriFrom));
    memset(p_r.uriTo, 0, sizeof(p_r.uriTo));
}

static inline void A20_resetCommonAssetDefault(ST_A20_CommonAsset_t& p_a) {
    memset(&p_a, 0, sizeof(p_a));
    memset(p_a.uri, 0, sizeof(p_a.uri));
    memset(p_a.path, 0, sizeof(p_a.path));
    p_a.isCommon = false;
}

// ======================================================
// 4) Default Reset - 상위 Config (System/WiFi/Motion/Dict...)
// ======================================================

// -------------------------
// System
// -------------------------
inline void A20_resetSystemDefault(ST_A20_SystemConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // meta
    A20_safe_strlcpy(p_cfg.meta.version, A20_Const::FW_VERSION, sizeof(p_cfg.meta.version));
    A20_safe_strlcpy(p_cfg.meta.deviceName, "SmartNatureWind", sizeof(p_cfg.meta.deviceName));
    A20_safe_strlcpy(p_cfg.meta.lastUpdate, "", sizeof(p_cfg.meta.lastUpdate));

    // logging
    A20_safe_strlcpy(p_cfg.system.logging.level, "INFO", sizeof(p_cfg.system.logging.level));
    p_cfg.system.logging.maxEntries = 300;

    // websocket
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

// -------------------------
// WiFi
// -------------------------
inline void A20_resetWifiDefault(ST_A20_WifiConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    p_cfg.wifiMode = EN_A20_WIFI_MODE_AP_STA;
    A20_safe_strlcpy(p_cfg.wifiModeDesc, "0=AP,1=STA,2=AP+STA", sizeof(p_cfg.wifiModeDesc));

    // ap
    A20_safe_strlcpy(p_cfg.ap.ssid, "NatureWind", sizeof(p_cfg.ap.ssid));
    A20_safe_strlcpy(p_cfg.ap.pass, "2540", sizeof(p_cfg.ap.pass));

    // sta list clear
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_STA_NETWORKS; v_i++) {
        memset(&p_cfg.sta[v_i], 0, sizeof(p_cfg.sta[v_i]));
    }
    p_cfg.staCount = 0;
}

// -------------------------
// Motion (cfg_motion_xxx.json)
// -------------------------
inline void A20_resetMotionDefault(ST_A20_MotionConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // pir
    p_cfg.pir.enabled = true;
    p_cfg.pir.holdSec = 120;

    // ble
    p_cfg.ble.enabled      = true;
    p_cfg.ble.trustedCount = 0;

    // trustedDevices clear
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

// -------------------------
// WindProfileDict (cfg_windDict_xxx.json)
// -------------------------
inline void A20_resetWindProfileDictDefault(ST_A20_WindProfileDict_t& p_dict) {
    memset(&p_dict, 0, sizeof(p_dict));

    // 전체 엔트리 기본값(누락 방지)
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
    // base는 resetWindBaseDefault로 이미 채워졌지만, 일부 값을 덮어씌울 수 있음(필요 시)
    p_dict.presets[0].base.gustFrequency = 45.0f;
    p_dict.presets[0].base.fanLimit      = 90.0f;

    p_dict.styleCount = 1;
    A20_safe_strlcpy(p_dict.styles[0].code, "BALANCE", sizeof(p_dict.styles[0].code));
    A20_safe_strlcpy(p_dict.styles[0].name, "Balance", sizeof(p_dict.styles[0].name));
    A20_resetStyleFactorsDefault(p_dict.styles[0].factors);
}

// -------------------------
// Schedules root/item
// -------------------------
static inline void A20_resetScheduleItemDefault(ST_A20_ScheduleItem_t& p_s) {
    memset(&p_s, 0, sizeof(p_s));

    p_s.schId   = 0;
    p_s.schNo   = 0;
    A20_safe_strlcpy(p_s.name, "", sizeof(p_s.name));
    p_s.enabled = true;

    A20_resetSchedulePeriodDefault(p_s.period);

    p_s.segCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_i++) {
        A20_resetScheduleSegmentDefault(p_s.segments[v_i]);
    }

    p_s.repeatSegments = true;
    p_s.repeatCount    = 0;

    A20_resetSchAutoOffDefault(p_s.autoOff);
    A20_resetMotionCommonDefault(p_s.motion);
}

inline void A20_resetSchedulesDefault(ST_A20_SchedulesRoot_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));
    p_cfg.count = 0;

    for (uint8_t v_i = 0; v_i < A20_Const::MAX_SCHEDULES; v_i++) {
        A20_resetScheduleItemDefault(p_cfg.items[v_i]);
    }
}

// -------------------------
// UserProfiles root/item
// -------------------------
static inline void A20_resetUserProfileItemDefault(ST_A20_UserProfileItem_t& p_up) {
    memset(&p_up, 0, sizeof(p_up));

    p_up.profileId = 0;
    p_up.profileNo = 0;
    A20_safe_strlcpy(p_up.name, "", sizeof(p_up.name));
    p_up.enabled = true;

    p_up.repeatSegments = true;
    p_up.repeatCount    = 0;

    p_up.segCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_i++) {
        A20_resetUserProfileSegmentDefault(p_up.segments[v_i]);
    }

    A20_resetAutoOffDefault(p_up.autoOff);
    A20_resetMotionCommonDefault(p_up.motion);
}

inline void A20_resetUserProfilesDefault(ST_A20_UserProfilesRoot_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));
    p_cfg.count = 0;

    for (uint8_t v_i = 0; v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        A20_resetUserProfileItemDefault(p_cfg.items[v_i]);
    }
}

// -------------------------
// NVS Spec
// -------------------------
inline void A20_resetNvsSpecDefault(ST_A20_NvsSpecConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    A20_safe_strlcpy(p_cfg.namespaceName, "SNW", sizeof(p_cfg.namespaceName));
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

// -------------------------
// WebPage
// -------------------------
inline void A20_resetWebPageDefault(ST_A20_WebPageConfig_t& p_cfg) {
    memset(&p_cfg, 0, sizeof(p_cfg));

    // clear all arrays (누락 방지)
    p_cfg.pageCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_PAGES; v_i++) {
        A20_resetPageItemDefault(p_cfg.pages[v_i]);
    }

    p_cfg.reDirectCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_REDIRECTS; v_i++) {
        A20_resetRedirectItemDefault(p_cfg.reDirect[v_i]);
    }

    p_cfg.assetCount = 0;
    for (uint8_t v_i = 0; v_i < A20_Const::MAX_COMMON_ASSETS; v_i++) {
        A20_resetCommonAssetDefault(p_cfg.assets[v_i]);
    }

    // 기본 메인 페이지 1개
    if (A20_Const::MAX_PAGES > 0) {
        p_cfg.pageCount = 1;

        ST_A20_PageItem_t& v_p = p_cfg.pages[0];
        A20_safe_strlcpy(v_p.uri, "/P010_main_021.html", sizeof(v_p.uri));
        A20_safe_strlcpy(v_p.path, "/html_v2/P010_main_021.html", sizeof(v_p.path));
        A20_safe_strlcpy(v_p.label, "Main", sizeof(v_p.label));
        v_p.enable = true;
        v_p.isMain = true;
        v_p.order  = 10;

        v_p.pageAssetCount = 0;
        if (A20_Const::MAX_PAGE_ASSETS >= 1) {
            ST_A20_PageAsset_t& v_a0 = v_p.pageAssets[v_p.pageAssetCount++];
            A20_safe_strlcpy(v_a0.uri, "/P010_main_021.css", sizeof(v_a0.uri));
            A20_safe_strlcpy(v_a0.path, "/html_v2/P010_main_021.css", sizeof(v_a0.path));
        }
        if (A20_Const::MAX_PAGE_ASSETS >= 2) {
            ST_A20_PageAsset_t& v_a1 = v_p.pageAssets[v_p.pageAssetCount++];
            A20_safe_strlcpy(v_a1.uri, "/P010_main_021.js", sizeof(v_a1.uri));
            A20_safe_strlcpy(v_a1.path, "/html_v2/P010_main_021.js", sizeof(v_a1.path));
        }
    }

    // 기본 redirect
    auto addRedirect = [&](const char* p_from, const char* p_to) {
        if (p_cfg.reDirectCount >= A20_Const::MAX_REDIRECTS) return;
        ST_A20_ReDirectItem_t& v_r = p_cfg.reDirect[p_cfg.reDirectCount++];
        A20_safe_strlcpy(v_r.uriFrom, p_from, sizeof(v_r.uriFrom));
        A20_safe_strlcpy(v_r.uriTo, p_to, sizeof(v_r.uriTo));
    };

    addRedirect("/", "/P010_main_021.html");
    addRedirect("/index.html", "/P010_main_021.html");
    addRedirect("/P010_main", "/P010_main_021.html");

    // 기본 common assets
    auto addCommonAsset = [&](const char* p_uri, const char* p_path, bool p_isCommon) {
        if (p_cfg.assetCount >= A20_Const::MAX_COMMON_ASSETS) return;
        ST_A20_CommonAsset_t& v_c = p_cfg.assets[p_cfg.assetCount++];
        A20_safe_strlcpy(v_c.uri, p_uri, sizeof(v_c.uri));
        A20_safe_strlcpy(v_c.path, p_path, sizeof(v_c.path));
        v_c.isCommon = p_isCommon;
    };

    addCommonAsset("/P000_common_001.css", "/html_v2/P000_common_001.css", true);
    addCommonAsset("/P000_common_006.js", "/html_v2/P000_common_006.js", true);
}

// ======================================================
// 5) Default Reset - Config Root
// ======================================================
inline void A20_resetToDefault(ST_A20_ConfigRoot_t& p_root) {
    if (p_root.system)       A20_resetSystemDefault(*p_root.system);
    if (p_root.wifi)         A20_resetWifiDefault(*p_root.wifi);
    if (p_root.motion)       A20_resetMotionDefault(*p_root.motion);
    if (p_root.nvsSpec)      A20_resetNvsSpecDefault(*p_root.nvsSpec);
    if (p_root.windDict)     A20_resetWindProfileDictDefault(*p_root.windDict);
    if (p_root.schedules)    A20_resetSchedulesDefault(*p_root.schedules);
    if (p_root.userProfiles) A20_resetUserProfilesDefault(*p_root.userProfiles);
    if (p_root.webPage)      A20_resetWebPageDefault(*p_root.webPage);
}

// ======================================================
// 6) WindProfileDict 검색 유틸 (누락/축소 방지)
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
