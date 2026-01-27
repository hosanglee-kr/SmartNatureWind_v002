/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_System_046.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - System/Wifi/Motion
 * ------------------------------------------------------
 * 기능 요약:
 *  - System / Wifi / Motion 설정 Load/Save
 *  - System / Wifi / Motion 설정 JSON Patch 적용
 *  - System / Wifi / Motion 설정 JSON Export
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 체계 유지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 모듈별 헤더(h) + 목적물별 cpp 분리 구성 (Core/System/Schedule)
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include "C10_Config_042.h"
#include <cstring>

// =====================================================
// 내부 Helper: 단일 key 전용 (fallback 금지)
//  - containsKey 사용 금지 -> JsonVariantConst null 체크 기반
// =====================================================
static const char* C10_getStr1(JsonObjectConst p_obj, const char* p_k1, const char* p_def) {
    if (p_obj.isNull()) return p_def;

    JsonVariantConst v1 = p_obj[p_k1];
    if (v1.isNull()) return p_def;

    const char* s = v1.as<const char*>();
    return (s && s[0]) ? s : p_def;
}

template <typename T>
static T C10_getNum1(JsonObjectConst p_obj, const char* p_k1, T p_def) {
    if (p_obj.isNull()) return p_def;

    JsonVariantConst v1 = p_obj[p_k1];
    if (v1.isNull()) return p_def;

    return (T)(v1.as<T>());
}

static bool C10_getBool1(JsonObjectConst p_obj, const char* p_k1, bool p_def) {
    if (p_obj.isNull()) return p_def;

    JsonVariantConst v1 = p_obj[p_k1];
    if (v1.isNull()) return p_def;

    return v1.as<bool>();
}

// =====================================================
// WebSocket 채널 유틸 (A20_Const_WS_040 기반)
//  - 현재 config는 wsChConfig[*].priority 숫자 기반이라
//    priority(string[]) 파싱은 제거됨
// =====================================================
static int8_t C10_wsChannelFromName(const char* p_name) {
    if (!p_name || !p_name[0]) return -1;

    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        if (strcasecmp(p_name, G_A20_WS_CH_Base_Arr[v_i].chName) == 0) {
            return (int8_t)v_i;
        }
    }
    return -1;
}


// =====================================================
// 2-1. 목적물별 Load 구현 (System/Wifi/Motion)
// =====================================================
bool CL_C10_ConfigManager::loadSystemConfig(ST_A20_SystemConfig_t& p_cfg) {
    // ✅ 0) 기본값 1회 선행 (누락 키 대응)
    A20_resetSystemDefault(p_cfg);

    JsonDocument v_doc;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.system[0] != '\0') {
        v_cfgJsonPath = s_cfgJsonFileMap.system;
    } else {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSystemConfig: s_cfgJsonFileMap.system is empty");
        return false; // 기본값 상태 유지
    }

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, v_doc, true)) {
    // if (!ioLoadJson(v_cfgJsonPath, v_doc)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSystemConfig: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false; // 기본값 상태 유지
    }

    JsonObjectConst j_root = v_doc.as<JsonObjectConst>();
    JsonObjectConst j_meta = j_root["meta"].as<JsonObjectConst>();
    JsonObjectConst j_sys  = j_root["system"].as<JsonObjectConst>();

    // hw는 루트 우선, 없으면 system.hw fallback (구조 fallback이 아니라 위치 fallback만 허용)
    JsonObjectConst j_hw = j_root["hw"].as<JsonObjectConst>();
    if (j_hw.isNull() && !j_sys.isNull()) {
        j_hw = j_sys["hw"].as<JsonObjectConst>();
    }

    if (j_sys.isNull() || j_hw.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSystemConfig: missing 'system' or 'hw'");
        return false; // 기본값 유지
    }

    // -------------------------
    // meta (있으면 덮어쓰기)
    // -------------------------
    if (!j_meta.isNull()) {
        const char* v_ver = C10_getStr1(j_meta, "version", nullptr);
        if (v_ver && v_ver[0]) strlcpy(p_cfg.meta.version, v_ver, sizeof(p_cfg.meta.version));

        const char* v_dn = C10_getStr1(j_meta, "deviceName", nullptr);
        if (v_dn && v_dn[0]) strlcpy(p_cfg.meta.deviceName, v_dn, sizeof(p_cfg.meta.deviceName));

        const char* v_lu = C10_getStr1(j_meta, "lastUpdate", nullptr);
        if (v_lu && v_lu[0]) strlcpy(p_cfg.meta.lastUpdate, v_lu, sizeof(p_cfg.meta.lastUpdate));
    }

    // -------------------------
    // system.logging (있으면 덮어쓰기)
    // -------------------------
    JsonObjectConst j_log = j_sys["logging"].as<JsonObjectConst>();
    if (!j_log.isNull()) {
        const char* v_lv = C10_getStr1(j_log, "level", nullptr);
        if (v_lv && v_lv[0]) strlcpy(p_cfg.system.logging.level, v_lv, sizeof(p_cfg.system.logging.level));

        if (!j_log["maxEntries"].isNull()) {
            uint16_t v_me = j_log["maxEntries"].as<uint16_t>();
            if (v_me > 0) p_cfg.system.logging.maxEntries = v_me;
        }
    }

    // -------------------------
    // system.webSocket (있으면 덮어쓰기) - NEW SCHEMA (wsChConfig/wsEtcConfig)
    // -------------------------
    JsonObjectConst j_ws = j_sys["webSocket"].as<JsonObjectConst>();
    if (!j_ws.isNull()) {
        // 1) wsChConfig[]
        JsonArrayConst j_chArr = j_ws["wsChConfig"].as<JsonArrayConst>();
        if (!j_chArr.isNull()) {
            for (JsonObjectConst j_ch : j_chArr) {
                if (j_ch.isNull()) continue;

                uint8_t v_idx = (uint8_t)C10_getNum1<uint8_t>(j_ch, "chIdx", 255);
                if (v_idx >= (uint8_t)EN_A20_WS_CH_COUNT) continue;

                // chIntervalMs
                if (!j_ch["chIntervalMs"].isNull()) {
                    uint16_t v_new = A40_ComFunc::clampVal<uint16_t>(j_ch["chIntervalMs"].as<uint16_t>(), 20, 60000);
                    p_cfg.system.webSocket.wsChConfig[v_idx].chIntervalMs = v_new;
                }

                // priority
                if (!j_ch["priority"].isNull()) {
					uint8_t v_new = A40_ComFunc::clampVal<uint8_t>(j_ch["priority"].as<uint8_t>(), 0, 10);
                    p_cfg.system.webSocket.wsChConfig[v_idx].priority = v_new;
                }

                // chName은 로딩 시 강제 덮지 않음 (표준 이름 유지)
                // 필요 시 검증만: 이름이 들어오면 매핑 가능한지 체크 정도
                JsonVariantConst v_nm = j_ch["chName"];
                if (!v_nm.isNull()) {
                    const char* v_name = v_nm.as<const char*>();
                    if (v_name && v_name[0]) {
                        int8_t v_map = C10_wsChannelFromName(v_name);
                        if (v_map < 0) {
                            CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadSystemConfig: unknown ws chName=%s", v_name);
                        }
                    }
                }
            }
        }

        // 2) wsEtcConfig
        JsonObjectConst j_etc = j_ws["wsEtcConfig"].as<JsonObjectConst>();
        if (!j_etc.isNull()) {
            if (!j_etc["chartLargeBytes"].isNull()) {
                uint16_t v_new = A40_ComFunc::clampVal<uint16_t>(j_etc["chartLargeBytes"].as<uint16_t>(), 256, 60000);
                p_cfg.system.webSocket.wsEtcConfig.chartLargeBytes = v_new;
            }
            if (!j_etc["chartThrottleMul"].isNull()) {
                uint8_t v_new = A40_ComFunc::clampVal<uint8_t>(j_etc["chartThrottleMul"].as<uint8_t>(), 1, 10);
                p_cfg.system.webSocket.wsEtcConfig.chartThrottleMul = v_new;
            }
            if (!j_etc["wsCleanupMs"].isNull()) {
                uint16_t v_new = A40_ComFunc::clampVal<uint16_t>(j_etc["wsCleanupMs"].as<uint16_t>(), 200, 60000);
                p_cfg.system.webSocket.wsEtcConfig.wsCleanupMs = v_new;
            }
        }
    }

    // -------------------------
    // hw.fanPwm (있으면 덮어쓰기)
    // -------------------------
    JsonObjectConst j_pwm = j_hw["fanPwm"].as<JsonObjectConst>();
    if (!j_pwm.isNull()) {
        if (!j_pwm["pin"].isNull()) p_cfg.hw.fanPwm.pin = j_pwm["pin"].as<uint8_t>();
        if (!j_pwm["channel"].isNull()) p_cfg.hw.fanPwm.channel = j_pwm["channel"].as<uint8_t>();
        if (!j_pwm["freq"].isNull()) p_cfg.hw.fanPwm.freq = j_pwm["freq"].as<uint32_t>();
        if (!j_pwm["res"].isNull()) p_cfg.hw.fanPwm.res = j_pwm["res"].as<uint8_t>();
    }

    // hw.fanConfig
    JsonObjectConst j_fcfg = j_hw["fanConfig"].as<JsonObjectConst>();
    if (!j_fcfg.isNull()) {
        if (!j_fcfg["startPercentMin"].isNull())
            p_cfg.hw.fanConfig.startPercentMin = j_fcfg["startPercentMin"].as<uint8_t>();
        if (!j_fcfg["comfortPercentMin"].isNull())
            p_cfg.hw.fanConfig.comfortPercentMin = j_fcfg["comfortPercentMin"].as<uint8_t>();
        if (!j_fcfg["comfortPercentMax"].isNull())
            p_cfg.hw.fanConfig.comfortPercentMax = j_fcfg["comfortPercentMax"].as<uint8_t>();
        if (!j_fcfg["hardPercentMax"].isNull())
            p_cfg.hw.fanConfig.hardPercentMax = j_fcfg["hardPercentMax"].as<uint8_t>();
    }

    // hw.pir
    JsonObjectConst j_pir = j_hw["pir"].as<JsonObjectConst>();
    if (!j_pir.isNull()) {
        if (!j_pir["enabled"].isNull()) p_cfg.hw.pir.enabled = j_pir["enabled"].as<bool>();
        if (!j_pir["pin"].isNull()) p_cfg.hw.pir.pin = j_pir["pin"].as<uint8_t>();
        if (!j_pir["debounceSec"].isNull()) p_cfg.hw.pir.debounceSec = j_pir["debounceSec"].as<uint16_t>();
        if (!j_pir["holdSec"].isNull()) p_cfg.hw.pir.holdSec = j_pir["holdSec"].as<uint16_t>();
    }

    // hw.tempHum
    JsonObjectConst j_th = j_hw["tempHum"].as<JsonObjectConst>();
    if (!j_th.isNull()) {
        if (!j_th["enabled"].isNull()) p_cfg.hw.tempHum.enabled = j_th["enabled"].as<bool>();
        const char* v_type = C10_getStr1(j_th, "type", nullptr);
        if (v_type && v_type[0]) strlcpy(p_cfg.hw.tempHum.type, v_type, sizeof(p_cfg.hw.tempHum.type));
        if (!j_th["pin"].isNull()) p_cfg.hw.tempHum.pin = j_th["pin"].as<uint8_t>();
        if (!j_th["intervalSec"].isNull()) p_cfg.hw.tempHum.intervalSec = j_th["intervalSec"].as<uint16_t>();
    }

    // hw.ble
    JsonObjectConst j_ble = j_hw["ble"].as<JsonObjectConst>();
    if (!j_ble.isNull()) {
        if (!j_ble["enabled"].isNull()) p_cfg.hw.ble.enabled = j_ble["enabled"].as<bool>();
        if (!j_ble["scanInterval"].isNull()) p_cfg.hw.ble.scanInterval = j_ble["scanInterval"].as<uint16_t>();
    }

    // security
    JsonObjectConst j_sec = j_root["security"].as<JsonObjectConst>();
    if (!j_sec.isNull()) {
        const char* v_key = C10_getStr1(j_sec, "apiKey", nullptr);
        if (v_key && v_key[0]) strlcpy(p_cfg.security.apiKey, v_key, sizeof(p_cfg.security.apiKey));
    }

    // time
    JsonObjectConst j_time = j_root["time"].as<JsonObjectConst>();
    if (!j_time.isNull()) {
        const char* v_ntp = C10_getStr1(j_time, "ntpServer", nullptr);
        if (v_ntp && v_ntp[0]) strlcpy(p_cfg.time.ntpServer, v_ntp, sizeof(p_cfg.time.ntpServer));

        const char* v_tz = C10_getStr1(j_time, "timezone", nullptr);
        if (v_tz && v_tz[0]) strlcpy(p_cfg.time.timezone, v_tz, sizeof(p_cfg.time.timezone));

        if (!j_time["syncIntervalMin"].isNull()) p_cfg.time.syncIntervalMin = j_time["syncIntervalMin"].as<uint16_t>();
    }

    return true;
}

bool CL_C10_ConfigManager::loadWifiConfig(ST_A20_WifiConfig_t& p_cfg) {
    // ✅ 기본값 선행
    A20_resetWifiDefault(p_cfg);

    JsonDocument d;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.wifi[0] != '\0')
        v_cfgJsonPath = s_cfgJsonFileMap.wifi;
    else {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWifiConfig: s_cfgJsonFileMap.wifi is empty");
        return false;
    }

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true)) {
    // if (!ioLoadJson(v_cfgJsonPath, d)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWifiConfig: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    JsonObjectConst j = d["wifi"].as<JsonObjectConst>();
    if (j.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWifiConfig: missing 'wifi' object");
        return false;
    }

    // 있는 키만 덮어쓰기
    if (!j["wifiMode"].isNull()) p_cfg.wifiMode = (EN_A20_WIFI_MODE_t)j["wifiMode"].as<uint8_t>();

    const char* v_desc = j["wifiModeDesc"] | nullptr;
    if (v_desc && v_desc[0]) strlcpy(p_cfg.wifiModeDesc, v_desc, sizeof(p_cfg.wifiModeDesc));

    JsonObjectConst j_ap = j["ap"].as<JsonObjectConst>();
    if (!j_ap.isNull()) {
        const char* v_ssid = j_ap["ssid"] | nullptr;
        if (v_ssid && v_ssid[0]) strlcpy(p_cfg.ap.ssid, v_ssid, sizeof(p_cfg.ap.ssid));

        const char* v_pass = C10_getStr1(j_ap, "pass", nullptr);
        if (v_pass && v_pass[0]) strlcpy(p_cfg.ap.pass, v_pass, sizeof(p_cfg.ap.pass));
    }

    // sta[]는 “있으면 교체”, 없으면 default 유지
    JsonArrayConst j_sta = j["sta"].as<JsonArrayConst>();
    if (!j_sta.isNull()) {
        p_cfg.staCount = 0;
        for (JsonObjectConst v_js : j_sta) {
            if (p_cfg.staCount >= A20_Const::MAX_STA_NETWORKS) break;

            ST_A20_STANetwork_t& v_net = p_cfg.sta[p_cfg.staCount];
            memset(&v_net, 0, sizeof(v_net)); // ✅ 찌꺼기 방지

            const char* v_ssid = v_js["ssid"] | "";
            const char* v_pass = v_js["pass"] | "";

            if (v_ssid[0] != '\0') {
                strlcpy(v_net.ssid, v_ssid, sizeof(v_net.ssid));
                strlcpy(v_net.pass, v_pass, sizeof(v_net.pass));

                // 💡 데이터 로드 직후 즉시 확인 로그 출력
                CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] Loaded STA[%d]: %s", p_cfg.staCount, v_net.ssid);

                p_cfg.staCount++;
            }
        }
    }

    return true;
}

bool CL_C10_ConfigManager::loadMotionConfig(ST_A20_MotionConfig_t& p_cfg) {
    // ✅ 기본값 선행
    A20_resetMotionDefault(p_cfg);

    JsonDocument d;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.motion[0] != '\0')
        v_cfgJsonPath = s_cfgJsonFileMap.motion;
    else {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadMotionConfig: s_cfgJsonFileMap.motion is empty");
        return false;
    }

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, d, true)) {
    // if (!ioLoadJson(v_cfgJsonPath, d)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadMotionConfig: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    JsonObjectConst j = d["motion"].as<JsonObjectConst>();
    if (j.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadMotionConfig: missing 'motion' object");
        return false;
    }

    // pir
    JsonObjectConst j_pir = j["pir"].as<JsonObjectConst>();
    if (!j_pir.isNull()) {
        if (!j_pir["enabled"].isNull()) p_cfg.pir.enabled = j_pir["enabled"].as<bool>();
        if (!j_pir["holdSec"].isNull()) p_cfg.pir.holdSec = j_pir["holdSec"].as<uint16_t>();
    }

    // ble
    JsonObjectConst j_ble = j["ble"].as<JsonObjectConst>();
    if (!j_ble.isNull()) {
        if (!j_ble["enabled"].isNull()) p_cfg.ble.enabled = j_ble["enabled"].as<bool>();

        JsonObjectConst r = j_ble["rssi"].as<JsonObjectConst>();
        if (!r.isNull()) {
            if (!r["on"].isNull()) p_cfg.ble.rssi.on = r["on"].as<int8_t>();
            if (!r["off"].isNull()) p_cfg.ble.rssi.off = r["off"].as<int8_t>();

            uint8_t  v_avg  = C10_getNum1<uint8_t>(r, "avgCount", p_cfg.ble.rssi.avgCount);
            uint8_t  v_pst  = C10_getNum1<uint8_t>(r, "persistCount", p_cfg.ble.rssi.persistCount);
            uint16_t v_exit = C10_getNum1<uint16_t>(r, "exitDelaySec", p_cfg.ble.rssi.exitDelaySec);

            p_cfg.ble.rssi.avgCount     = v_avg;
            p_cfg.ble.rssi.persistCount = v_pst;
            p_cfg.ble.rssi.exitDelaySec = v_exit;
        }

        // trustedDevices[] : 있으면 교체, 없으면 default 유지
        JsonArrayConst v_arr = j_ble["trustedDevices"].as<JsonArrayConst>();
        if (!v_arr.isNull()) {
            p_cfg.ble.trustedCount = 0;
            for (JsonObjectConst v_js : v_arr) {
                if (p_cfg.ble.trustedCount >= A20_Const::MAX_BLE_DEVICES) break;

                ST_A20_BLETrustedDevice_t& v_d = p_cfg.ble.trustedDevices[p_cfg.ble.trustedCount++];
                memset(&v_d, 0, sizeof(v_d)); // ✅ 찌꺼기 방지

                const char* v_alias = v_js["alias"] | nullptr;
                if (v_alias) strlcpy(v_d.alias, v_alias, sizeof(v_d.alias));

                const char* v_name = v_js["name"] | nullptr;
                if (v_name) strlcpy(v_d.name, v_name, sizeof(v_d.name));

                const char* v_mac = v_js["mac"] | nullptr;
                if (v_mac) strlcpy(v_d.mac, v_mac, sizeof(v_d.mac));

                const char* v_mp = C10_getStr1(v_js, "manufPrefix", nullptr);
                if (v_mp) strlcpy(v_d.manufPrefix, v_mp, sizeof(v_d.manufPrefix));

                v_d.prefixLen = C10_getNum1<uint8_t>(v_js, "prefixLen", 0);
                v_d.enabled   = C10_getBool1(v_js, "enabled", true);
            }
        }
    }

    // timing (있으면 덮어쓰기)
    JsonObjectConst j_timing = j["timing"].as<JsonObjectConst>();
    if (!j_timing.isNull()) {
        if (!j_timing["simIntervalMs"].isNull()) p_cfg.timing.simIntervalMs = j_timing["simIntervalMs"].as<uint16_t>();
        if (!j_timing["gustIntervalMs"].isNull())
            p_cfg.timing.gustIntervalMs = j_timing["gustIntervalMs"].as<uint16_t>();
        if (!j_timing["thermalIntervalMs"].isNull())
            p_cfg.timing.thermalIntervalMs = j_timing["thermalIntervalMs"].as<uint16_t>();
    }

    return true;
}

// =====================================================
// 2-2. 목적물별 Save 구현 (System/Wifi/Motion) - camelCase 저장
// =====================================================
bool CL_C10_ConfigManager::saveSystemConfig(const ST_A20_SystemConfig_t& p_cfg) {
    JsonDocument v;

    v["meta"]["version"]    = p_cfg.meta.version;
    v["meta"]["deviceName"] = p_cfg.meta.deviceName;
    v["meta"]["lastUpdate"] = p_cfg.meta.lastUpdate;

    v["system"]["logging"]["level"]      = p_cfg.system.logging.level;
    v["system"]["logging"]["maxEntries"] = p_cfg.system.logging.maxEntries;

    JsonObject v_ws = v["system"]["webSocket"].to<JsonObject>();

    // wsChConfig[]
    JsonArray v_chArr = v_ws["wsChConfig"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        const ST_A20_WS_CH_CONFIG_t& v_ch = p_cfg.system.webSocket.wsChConfig[v_i];

        JsonObject o = v_chArr.add<JsonObject>();
        o["chIdx"]        = (uint8_t)v_ch.chIdx;
        o["chName"]       = v_ch.chName;
        o["chIntervalMs"] = v_ch.chIntervalMs;
        o["priority"]     = v_ch.priority;
    }

    // wsEtcConfig
    v_ws["wsEtcConfig"]["chartLargeBytes"]  = p_cfg.system.webSocket.wsEtcConfig.chartLargeBytes;
    v_ws["wsEtcConfig"]["chartThrottleMul"] = p_cfg.system.webSocket.wsEtcConfig.chartThrottleMul;
    v_ws["wsEtcConfig"]["wsCleanupMs"]      = p_cfg.system.webSocket.wsEtcConfig.wsCleanupMs;

    // hw.fanPwm (camelCase)
    v["hw"]["fanPwm"]["pin"]     = p_cfg.hw.fanPwm.pin;
    v["hw"]["fanPwm"]["channel"] = p_cfg.hw.fanPwm.channel;
    v["hw"]["fanPwm"]["freq"]    = p_cfg.hw.fanPwm.freq;
    v["hw"]["fanPwm"]["res"]     = p_cfg.hw.fanPwm.res;

    v["hw"]["fanConfig"]["startPercentMin"]   = p_cfg.hw.fanConfig.startPercentMin;
    v["hw"]["fanConfig"]["comfortPercentMin"] = p_cfg.hw.fanConfig.comfortPercentMin;
    v["hw"]["fanConfig"]["comfortPercentMax"] = p_cfg.hw.fanConfig.comfortPercentMax;
    v["hw"]["fanConfig"]["hardPercentMax"]    = p_cfg.hw.fanConfig.hardPercentMax;

    v["hw"]["pir"]["enabled"]     = p_cfg.hw.pir.enabled;
    v["hw"]["pir"]["pin"]         = p_cfg.hw.pir.pin;
    v["hw"]["pir"]["debounceSec"] = p_cfg.hw.pir.debounceSec;
    v["hw"]["pir"]["holdSec"]     = p_cfg.hw.pir.holdSec;

    v["hw"]["tempHum"]["enabled"]     = p_cfg.hw.tempHum.enabled;
    v["hw"]["tempHum"]["type"]        = p_cfg.hw.tempHum.type;
    v["hw"]["tempHum"]["pin"]         = p_cfg.hw.tempHum.pin;
    v["hw"]["tempHum"]["intervalSec"] = p_cfg.hw.tempHum.intervalSec;

    v["hw"]["ble"]["enabled"]      = p_cfg.hw.ble.enabled;
    v["hw"]["ble"]["scanInterval"] = p_cfg.hw.ble.scanInterval;

    v["security"]["apiKey"] = p_cfg.security.apiKey;

    v["time"]["ntpServer"]       = p_cfg.time.ntpServer;
    v["time"]["timezone"]        = p_cfg.time.timezone;
    v["time"]["syncIntervalMin"] = p_cfg.time.syncIntervalMin;

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.system, v, true);
	// return ioSaveJson(s_cfgJsonFileMap.system, v);
}

bool CL_C10_ConfigManager::saveWifiConfig(const ST_A20_WifiConfig_t& p_cfg) {
    JsonDocument d;

    d["wifi"]["wifiMode"]     = p_cfg.wifiMode;
    d["wifi"]["wifiModeDesc"] = p_cfg.wifiModeDesc;
    d["wifi"]["ap"]["ssid"]   = p_cfg.ap.ssid;

    // JSON 키 pass 로 통일
    d["wifi"]["ap"]["pass"] = p_cfg.ap.pass;

    JsonArray v_staArr = d["wifi"]["sta"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.staCount; v_i++) {
        JsonObject v_net = v_staArr.add<JsonObject>();
        v_net["ssid"]    = p_cfg.sta[v_i].ssid;
        v_net["pass"]    = p_cfg.sta[v_i].pass;
    }

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.wifi, d, true);
	// return ioSaveJson(s_cfgJsonFileMap.wifi, d);
}

bool CL_C10_ConfigManager::saveMotionConfig(const ST_A20_MotionConfig_t& p_cfg) {
    JsonDocument d;

    d["motion"]["pir"]["enabled"] = p_cfg.pir.enabled;
    d["motion"]["pir"]["holdSec"] = p_cfg.pir.holdSec;

    d["motion"]["ble"]["enabled"]     = p_cfg.ble.enabled;
    d["motion"]["ble"]["rssi"]["on"]  = p_cfg.ble.rssi.on;
    d["motion"]["ble"]["rssi"]["off"] = p_cfg.ble.rssi.off;

    // camelCase
    d["motion"]["ble"]["rssi"]["avgCount"]     = p_cfg.ble.rssi.avgCount;
    d["motion"]["ble"]["rssi"]["persistCount"] = p_cfg.ble.rssi.persistCount;
    d["motion"]["ble"]["rssi"]["exitDelaySec"] = p_cfg.ble.rssi.exitDelaySec;

    JsonArray v_tdArr = d["motion"]["ble"]["trustedDevices"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.ble.trustedCount; v_i++) {
        const ST_A20_BLETrustedDevice_t& v_d  = p_cfg.ble.trustedDevices[v_i];
        JsonObject                       v_td = v_tdArr.add<JsonObject>();

        v_td["alias"]       = v_d.alias;
        v_td["name"]        = v_d.name;
        v_td["mac"]         = v_d.mac;
        v_td["manufPrefix"] = v_d.manufPrefix;
        v_td["prefixLen"]   = v_d.prefixLen;
        v_td["enabled"]     = v_d.enabled;
    }

    // Timing (camelCase)
    d["motion"]["timing"]["simIntervalMs"]     = p_cfg.timing.simIntervalMs;
    d["motion"]["timing"]["gustIntervalMs"]    = p_cfg.timing.gustIntervalMs;
    d["motion"]["timing"]["thermalIntervalMs"] = p_cfg.timing.thermalIntervalMs;

    return A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.motion, d, true);
	// return ioSaveJson(s_cfgJsonFileMap.motion, d);
}

// =====================================================
// 4. JSON Patch (System/Wifi/Motion)
//  - patch는 "부분 반영"이므로 reset default 호출 금지
// =====================================================
bool CL_C10_ConfigManager::patchSystemFromJson(ST_A20_SystemConfig_t& p_config, const JsonDocument& p_patch) {
    bool v_changed = false;


	// Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonObjectConst j_meta = p_patch["meta"].as<JsonObjectConst>();
    JsonObjectConst j_sys  = p_patch["system"].as<JsonObjectConst>();
    JsonObjectConst j_sec  = p_patch["security"].as<JsonObjectConst>();
    JsonObjectConst j_hw   = p_patch["hw"].as<JsonObjectConst>();
    JsonObjectConst j_time = p_patch["time"].as<JsonObjectConst>();

    if (j_meta.isNull() && j_sys.isNull() && j_sec.isNull() && j_hw.isNull() && j_time.isNull()) {

        return false;
    }

    // meta
    if (!j_meta.isNull()) {
        const char* v_dn = C10_getStr1(j_meta, "deviceName", "");
        if (v_dn && v_dn[0] && strcmp(v_dn, p_config.meta.deviceName) != 0) {
            strlcpy(p_config.meta.deviceName, v_dn, sizeof(p_config.meta.deviceName));
            v_changed = true;
        }

        const char* v_lu = C10_getStr1(j_meta, "lastUpdate", "");
        if (v_lu && v_lu[0] && strcmp(v_lu, p_config.meta.lastUpdate) != 0) {
            strlcpy(p_config.meta.lastUpdate, v_lu, sizeof(p_config.meta.lastUpdate));
            v_changed = true;
        }
    }

    // system + logging + websocket
    if (!j_sys.isNull()) {
        JsonObjectConst j_log = j_sys["logging"].as<JsonObjectConst>();
        if (!j_log.isNull()) {
            const char* v_lv = C10_getStr1(j_log, "level", "");
            if (v_lv && v_lv[0] && strcmp(v_lv, p_config.system.logging.level) != 0) {
                strlcpy(p_config.system.logging.level, v_lv, sizeof(p_config.system.logging.level));
                v_changed = true;
            }

            uint16_t v_max = C10_getNum1<uint16_t>(j_log, "maxEntries", p_config.system.logging.maxEntries);
            if (v_max != p_config.system.logging.maxEntries) {
                p_config.system.logging.maxEntries = v_max;
                v_changed                          = true;
            }
        }

        // webSocket (NEW SCHEMA)
        JsonObjectConst j_ws = j_sys["webSocket"].as<JsonObjectConst>();
        if (!j_ws.isNull()) {
            // wsChConfig[] : 부분 반영
            JsonArrayConst j_chArr = j_ws["wsChConfig"].as<JsonArrayConst>();
            if (!j_chArr.isNull()) {
                for (JsonObjectConst j_ch : j_chArr) {
                    if (j_ch.isNull()) continue;

                    uint8_t v_idx = (uint8_t)C10_getNum1<uint8_t>(j_ch, "chIdx", 255);
                    if (v_idx >= (uint8_t)EN_A20_WS_CH_COUNT) continue;

                    if (!j_ch["chIntervalMs"].isNull()) {
                        uint16_t v_new = A40_ComFunc::clampVal<uint16_t>(j_ch["chIntervalMs"].as<uint16_t>(), 20, 60000);
                        if (v_new != p_config.system.webSocket.wsChConfig[v_idx].chIntervalMs) {
                            p_config.system.webSocket.wsChConfig[v_idx].chIntervalMs = v_new;
                            v_changed = true;
                        }
                    }

                    if (!j_ch["priority"].isNull()) {
						uint8_t v_new = A40_ComFunc::clampVal<uint8_t>(j_ch["priority"].as<uint8_t>(), 0, 10);
                        if (v_new != p_config.system.webSocket.wsChConfig[v_idx].priority) {
                            p_config.system.webSocket.wsChConfig[v_idx].priority = v_new;
                            v_changed = true;
                        }
                    }

                    // chName은 patch로 덮지 않음 (표준 이름 유지)
                }
            }

            // wsEtcConfig : 부분 반영
            JsonObjectConst j_etc = j_ws["wsEtcConfig"].as<JsonObjectConst>();
            if (!j_etc.isNull()) {
                if (!j_etc["chartLargeBytes"].isNull()) {
                    uint16_t v_new = A40_ComFunc::clampVal<uint16_t>(j_etc["chartLargeBytes"].as<uint16_t>(), 256, 60000);
                    if (v_new != p_config.system.webSocket.wsEtcConfig.chartLargeBytes) {
                        p_config.system.webSocket.wsEtcConfig.chartLargeBytes = v_new;
                        v_changed = true;
                    }
                }
                if (!j_etc["chartThrottleMul"].isNull()) {
                    uint8_t v_new = A40_ComFunc::clampVal<uint8_t>(j_etc["chartThrottleMul"].as<uint8_t>(), 1, 10);
                    if (v_new != p_config.system.webSocket.wsEtcConfig.chartThrottleMul) {
                        p_config.system.webSocket.wsEtcConfig.chartThrottleMul = v_new;
                        v_changed = true;
                    }
                }
                if (!j_etc["wsCleanupMs"].isNull()) {
                    uint16_t v_new = A40_ComFunc::clampVal<uint16_t>(j_etc["wsCleanupMs"].as<uint16_t>(), 200, 60000);
                    if (v_new != p_config.system.webSocket.wsEtcConfig.wsCleanupMs) {
                        p_config.system.webSocket.wsEtcConfig.wsCleanupMs = v_new;
                        v_changed = true;
                    }
                }
            }
        }
    }

    // security.apiKey
    if (!j_sec.isNull()) {
        const char* v_key = C10_getStr1(j_sec, "apiKey", "");
        if (v_key && v_key[0] && strcmp(v_key, p_config.security.apiKey) != 0) {
            strlcpy(p_config.security.apiKey, v_key, sizeof(p_config.security.apiKey));
            v_changed = true;
        }
    }

    // hw
    if (!j_hw.isNull()) {
        // fanConfig
        JsonObjectConst j_fan = j_hw["fanConfig"].as<JsonObjectConst>();
        if (!j_fan.isNull()) {
            if (!j_fan["startPercentMin"].isNull()) {
                uint8_t v_val = j_fan["startPercentMin"].as<uint8_t>();
                if (v_val != p_config.hw.fanConfig.startPercentMin) {
                    p_config.hw.fanConfig.startPercentMin = v_val;
                    v_changed                             = true;
                }
            }
            if (!j_fan["comfortPercentMin"].isNull()) {
                uint8_t v_val = j_fan["comfortPercentMin"].as<uint8_t>();
                if (v_val != p_config.hw.fanConfig.comfortPercentMin) {
                    p_config.hw.fanConfig.comfortPercentMin = v_val;
                    v_changed                               = true;
                }
            }
            if (!j_fan["comfortPercentMax"].isNull()) {
                uint8_t v_val = j_fan["comfortPercentMax"].as<uint8_t>();
                if (v_val != p_config.hw.fanConfig.comfortPercentMax) {
                    p_config.hw.fanConfig.comfortPercentMax = v_val;
                    v_changed                               = true;
                }
            }
            if (!j_fan["hardPercentMax"].isNull()) {
                uint8_t v_val = j_fan["hardPercentMax"].as<uint8_t>();
                if (v_val != p_config.hw.fanConfig.hardPercentMax) {
                    p_config.hw.fanConfig.hardPercentMax = v_val;
                    v_changed                            = true;
                }
            }
        }

        // pir
        JsonObjectConst j_pir = j_hw["pir"].as<JsonObjectConst>();
        if (!j_pir.isNull()) {
            if (!j_pir["enabled"].isNull()) {
                bool v_en = j_pir["enabled"].as<bool>();
                if (v_en != p_config.hw.pir.enabled) {
                    p_config.hw.pir.enabled = v_en;
                    v_changed               = true;
                }
            }
            if (!j_pir["pin"].isNull()) {
                uint8_t v_pin = j_pir["pin"].as<uint8_t>();
                if (v_pin != p_config.hw.pir.pin) {
                    p_config.hw.pir.pin = v_pin;
                    v_changed           = true;
                }
            }
            uint16_t v_db = C10_getNum1<uint16_t>(j_pir, "debounceSec", p_config.hw.pir.debounceSec);
            if (v_db != p_config.hw.pir.debounceSec) {
                p_config.hw.pir.debounceSec = v_db;
                v_changed                   = true;
            }

            if (!j_pir["holdSec"].isNull()) {
                uint16_t v_hold = j_pir["holdSec"].as<uint16_t>();
                if (v_hold != p_config.hw.pir.holdSec) {
                    p_config.hw.pir.holdSec = v_hold;
                    v_changed               = true;
                }
            }
        }

        // tempHum
        JsonObjectConst j_th = j_hw["tempHum"].as<JsonObjectConst>();
        if (!j_th.isNull()) {
            if (!j_th["enabled"].isNull()) {
                bool v_en = j_th["enabled"].as<bool>();
                if (v_en != p_config.hw.tempHum.enabled) {
                    p_config.hw.tempHum.enabled = v_en;
                    v_changed                   = true;
                }
            }
            const char* v_type = j_th["type"] | "";
            if (v_type && v_type[0] && strcmp(v_type, p_config.hw.tempHum.type) != 0) {
                strlcpy(p_config.hw.tempHum.type, v_type, sizeof(p_config.hw.tempHum.type));
                v_changed = true;
            }
            if (!j_th["pin"].isNull()) {
                uint8_t v_pin = j_th["pin"].as<uint8_t>();
                if (v_pin != p_config.hw.tempHum.pin) {
                    p_config.hw.tempHum.pin = v_pin;
                    v_changed               = true;
                }
            }
            uint16_t v_itv = C10_getNum1<uint16_t>(j_th, "intervalSec", p_config.hw.tempHum.intervalSec);
            if (v_itv != p_config.hw.tempHum.intervalSec) {
                p_config.hw.tempHum.intervalSec = v_itv;
                v_changed                       = true;
            }
        }

        // fanPwm
        JsonObjectConst j_pwm = j_hw["fanPwm"].as<JsonObjectConst>();
        if (!j_pwm.isNull()) {
            if (!j_pwm["pin"].isNull()) {
                uint8_t v_pin = j_pwm["pin"].as<uint8_t>();
                if (v_pin != p_config.hw.fanPwm.pin) {
                    p_config.hw.fanPwm.pin = v_pin;
                    v_changed              = true;
                }
            }
            if (!j_pwm["channel"].isNull()) {
                uint8_t v_ch = j_pwm["channel"].as<uint8_t>();
                if (v_ch != p_config.hw.fanPwm.channel) {
                    p_config.hw.fanPwm.channel = v_ch;
                    v_changed                  = true;
                }
            }
            if (!j_pwm["freq"].isNull()) {
                uint32_t v_fr = j_pwm["freq"].as<uint32_t>();
                if (v_fr != p_config.hw.fanPwm.freq) {
                    p_config.hw.fanPwm.freq = v_fr;
                    v_changed               = true;
                }
            }
            if (!j_pwm["res"].isNull()) {
                uint8_t v_res = j_pwm["res"].as<uint8_t>();
                if (v_res != p_config.hw.fanPwm.res) {
                    p_config.hw.fanPwm.res = v_res;
                    v_changed              = true;
                }
            }
        }

        // ble
        JsonObjectConst j_ble = j_hw["ble"].as<JsonObjectConst>();
        if (!j_ble.isNull()) {
            if (!j_ble["enabled"].isNull()) {
                bool v_en = j_ble["enabled"].as<bool>();
                if (v_en != p_config.hw.ble.enabled) {
                    p_config.hw.ble.enabled = v_en;
                    v_changed               = true;
                }
            }
            uint16_t v_si = C10_getNum1<uint16_t>(j_ble, "scanInterval", p_config.hw.ble.scanInterval);
            if (v_si != p_config.hw.ble.scanInterval) {
                p_config.hw.ble.scanInterval = v_si;
                v_changed                    = true;
            }
        }
    }

    // time
    if (!j_time.isNull()) {
        const char* v_ntp = C10_getStr1(j_time, "ntpServer", "");
        if (v_ntp && v_ntp[0] && strcmp(v_ntp, p_config.time.ntpServer) != 0) {
            strlcpy(p_config.time.ntpServer, v_ntp, sizeof(p_config.time.ntpServer));
            v_changed = true;
        }

        const char* v_tz = C10_getStr1(j_time, "timezone", "");
        if (v_tz && v_tz[0] && strcmp(v_tz, p_config.time.timezone) != 0) {
            strlcpy(p_config.time.timezone, v_tz, sizeof(p_config.time.timezone));
            v_changed = true;
        }

        uint16_t v_si = C10_getNum1<uint16_t>(j_time, "syncIntervalMin", p_config.time.syncIntervalMin);
        if (v_si != p_config.time.syncIntervalMin) {
            p_config.time.syncIntervalMin = v_si;
            v_changed                     = true;
        }
    }

    if (v_changed) {
        _dirty_system = true;
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] System config patched (Memory Only, camelCase). Dirty=true");
    }


    return v_changed;
}

bool CL_C10_ConfigManager::patchWifiFromJson(ST_A20_WifiConfig_t& p_config, const JsonDocument& p_patch) {
    bool v_changed = false;


	// Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonObjectConst j_wifi = p_patch["wifi"].as<JsonObjectConst>();
    if (j_wifi.isNull()) {

        return false;
    }

    if (!j_wifi["wifiMode"].isNull()) {
        uint8_t v_mode = j_wifi["wifiMode"].as<uint8_t>();
        if (v_mode != p_config.wifiMode) {
            if (v_mode >= EN_A20_WIFI_MODE_AP && v_mode <= EN_A20_WIFI_MODE_AP_STA) {
                p_config.wifiMode = (EN_A20_WIFI_MODE_t)v_mode;
                v_changed         = true;
            } else {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] Invalid wifiMode value: %d", v_mode);
            }
        }
    }

    JsonObjectConst j_ap = j_wifi["ap"].as<JsonObjectConst>();
    if (!j_ap.isNull()) {
        const char* v_ssid = j_ap["ssid"] | "";
        if (v_ssid && v_ssid[0] && strcmp(v_ssid, p_config.ap.ssid) != 0) {
            strlcpy(p_config.ap.ssid, v_ssid, sizeof(p_config.ap.ssid));
            v_changed = true;
        }

        const char* v_pwd = C10_getStr1(j_ap, "pass", "");
        if (v_pwd && v_pwd[0] && strcmp(v_pwd, p_config.ap.pass) != 0) {
            strlcpy(p_config.ap.pass, v_pwd, sizeof(p_config.ap.pass));
            v_changed = true;
        }
    }

    // sta 배열은 있으면 "전체 교체"
    JsonArrayConst j_sta = j_wifi["sta"].as<JsonArrayConst>();
    if (!j_sta.isNull()) {
        p_config.staCount = 0;
        for (JsonObjectConst v_js : j_sta) {
            if (p_config.staCount >= A20_Const::MAX_STA_NETWORKS) break;

            ST_A20_STANetwork_t& v_net = p_config.sta[p_config.staCount];
            memset(&v_net, 0, sizeof(v_net)); // ✅ 찌꺼기 방지

            strlcpy(v_net.ssid, v_js["ssid"] | "", sizeof(v_net.ssid));
            strlcpy(v_net.pass, v_js["pass"] | "", sizeof(v_net.pass));

            p_config.staCount++;
        }
        v_changed = true;
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] WiFi STA array fully replaced.");
    }

    if (v_changed) {
        _dirty_wifi = true;
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WiFi config patched (Memory Only, camelCase). Dirty=true");
    }


    return v_changed;
}

bool CL_C10_ConfigManager::patchMotionFromJson(ST_A20_MotionConfig_t& p_config, const JsonDocument& p_patch) {

	// Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_C10_MUTEX_TIMEOUT);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    bool v_changed = false;

    JsonObjectConst j_motion = p_patch["motion"].as<JsonObjectConst>();
    if (j_motion.isNull()) {

        return false;
    }

    // pir
    JsonObjectConst j_pir = j_motion["pir"].as<JsonObjectConst>();
    if (!j_pir.isNull()) {
        if (!j_pir["enabled"].isNull() && j_pir["enabled"].as<bool>() != p_config.pir.enabled) {
            p_config.pir.enabled = j_pir["enabled"].as<bool>();
            v_changed            = true;
        }
        if (!j_pir["holdSec"].isNull() && j_pir["holdSec"].as<uint16_t>() != p_config.pir.holdSec) {
            p_config.pir.holdSec = j_pir["holdSec"].as<uint16_t>();
            v_changed            = true;
        }
    }

    // ble
    JsonObjectConst j_ble = j_motion["ble"].as<JsonObjectConst>();
    if (!j_ble.isNull()) {
        if (!j_ble["enabled"].isNull() && j_ble["enabled"].as<bool>() != p_config.ble.enabled) {
            p_config.ble.enabled = j_ble["enabled"].as<bool>();
            v_changed            = true;
        }

        JsonObjectConst j_rssi = j_ble["rssi"].as<JsonObjectConst>();
        if (!j_rssi.isNull()) {
            if (!j_rssi["on"].isNull() && j_rssi["on"].as<int8_t>() != p_config.ble.rssi.on) {
                p_config.ble.rssi.on = j_rssi["on"].as<int8_t>();
                v_changed            = true;
            }
            if (!j_rssi["off"].isNull() && j_rssi["off"].as<int8_t>() != p_config.ble.rssi.off) {
                p_config.ble.rssi.off = j_rssi["off"].as<int8_t>();
                v_changed             = true;
            }

            uint8_t v_avg = C10_getNum1<uint8_t>(j_rssi, "avgCount", p_config.ble.rssi.avgCount);
            if (v_avg != p_config.ble.rssi.avgCount) {
                p_config.ble.rssi.avgCount = v_avg;
                v_changed                  = true;
            }

            uint8_t v_pst = C10_getNum1<uint8_t>(j_rssi, "persistCount", p_config.ble.rssi.persistCount);
            if (v_pst != p_config.ble.rssi.persistCount) {
                p_config.ble.rssi.persistCount = v_pst;
                v_changed                      = true;
            }

            uint16_t v_exit = C10_getNum1<uint16_t>(j_rssi, "exitDelaySec", p_config.ble.rssi.exitDelaySec);
            if (v_exit != p_config.ble.rssi.exitDelaySec) {
                p_config.ble.rssi.exitDelaySec = v_exit;
                v_changed                      = true;
            }
        }

        // trustedDevices[] : 있으면 "전체 교체"
        JsonArrayConst j_tdArr = j_ble["trustedDevices"].as<JsonArrayConst>();
        if (!j_tdArr.isNull()) {
            p_config.ble.trustedCount = 0;
            for (JsonObjectConst v_js : j_tdArr) {
                if (p_config.ble.trustedCount >= A20_Const::MAX_BLE_DEVICES) break;

                ST_A20_BLETrustedDevice_t& v_d = p_config.ble.trustedDevices[p_config.ble.trustedCount++];
                memset(&v_d, 0, sizeof(v_d)); // ✅ 찌꺼기 방지

                strlcpy(v_d.alias, v_js["alias"] | "", sizeof(v_d.alias));
                strlcpy(v_d.name, v_js["name"] | "", sizeof(v_d.name));
                strlcpy(v_d.mac, v_js["mac"] | "", sizeof(v_d.mac));

                const char* v_mp = C10_getStr1(v_js, "manufPrefix", "");
                strlcpy(v_d.manufPrefix, v_mp, sizeof(v_d.manufPrefix));

                v_d.prefixLen = C10_getNum1<uint8_t>(v_js, "prefixLen", 0);
                v_d.enabled   = C10_getBool1(v_js, "enabled", true);
            }
            v_changed = true;
            CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] Motion Trusted Devices array fully replaced.");
        }
    }

    // timing (fallback 적용 금지: camelCase만)
    JsonObjectConst j_timing = j_motion["timing"].as<JsonObjectConst>();
    if (!j_timing.isNull()) {
        uint16_t v_sim = C10_getNum1<uint16_t>(j_timing, "simIntervalMs", p_config.timing.simIntervalMs);
        if (v_sim != p_config.timing.simIntervalMs && v_sim > 0) {
            p_config.timing.simIntervalMs = v_sim;
            v_changed                     = true;
        }

        uint16_t v_gust = C10_getNum1<uint16_t>(j_timing, "gustIntervalMs", p_config.timing.gustIntervalMs);
        if (v_gust != p_config.timing.gustIntervalMs && v_gust > 0) {
            p_config.timing.gustIntervalMs = v_gust;
            v_changed                      = true;
        }

        uint16_t v_thermal = C10_getNum1<uint16_t>(j_timing, "thermalIntervalMs", p_config.timing.thermalIntervalMs);
        if (v_thermal != p_config.timing.thermalIntervalMs && v_thermal > 0) {
            p_config.timing.thermalIntervalMs = v_thermal;
            v_changed                         = true;
        }
    }

    if (v_changed) {
        _dirty_motion = true;
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Motion config patched (Memory Only, camelCase). Dirty=true");
    }


    return v_changed;
}

// =====================================================
// 3-1. JSON Export (System/Wifi/Motion) - camelCase Export
// =====================================================
void CL_C10_ConfigManager::toJson_System(const ST_A20_SystemConfig_t& p, JsonDocument& d) {
    d["meta"]["version"]    = p.meta.version;
    d["meta"]["deviceName"] = p.meta.deviceName;
    d["meta"]["lastUpdate"] = p.meta.lastUpdate;

    d["system"]["logging"]["level"]      = p.system.logging.level;
    d["system"]["logging"]["maxEntries"] = p.system.logging.maxEntries;

    JsonObject d_ws = d["system"]["webSocket"].to<JsonObject>();

    // wsChConfig[]
    JsonArray d_chArr = d_ws["wsChConfig"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < (uint8_t)EN_A20_WS_CH_COUNT; v_i++) {
        const ST_A20_WS_CH_CONFIG_t& v_ch = p.system.webSocket.wsChConfig[v_i];

        JsonObject o = d_chArr.add<JsonObject>();
        o["chIdx"]        = (uint8_t)v_ch.chIdx;
        o["chName"]       = v_ch.chName;
        o["chIntervalMs"] = v_ch.chIntervalMs;
        o["priority"]     = v_ch.priority;
    }

    d_ws["wsEtcConfig"]["chartLargeBytes"]  = p.system.webSocket.wsEtcConfig.chartLargeBytes;
    d_ws["wsEtcConfig"]["chartThrottleMul"] = p.system.webSocket.wsEtcConfig.chartThrottleMul;
    d_ws["wsEtcConfig"]["wsCleanupMs"]      = p.system.webSocket.wsEtcConfig.wsCleanupMs;

    d["hw"]["fanPwm"]["pin"]     = p.hw.fanPwm.pin;
    d["hw"]["fanPwm"]["channel"] = p.hw.fanPwm.channel;
    d["hw"]["fanPwm"]["freq"]    = p.hw.fanPwm.freq;
    d["hw"]["fanPwm"]["res"]     = p.hw.fanPwm.res;

    d["hw"]["fanConfig"]["startPercentMin"]   = p.hw.fanConfig.startPercentMin;
    d["hw"]["fanConfig"]["comfortPercentMin"] = p.hw.fanConfig.comfortPercentMin;
    d["hw"]["fanConfig"]["comfortPercentMax"] = p.hw.fanConfig.comfortPercentMax;
    d["hw"]["fanConfig"]["hardPercentMax"]    = p.hw.fanConfig.hardPercentMax;

    d["hw"]["pir"]["enabled"]     = p.hw.pir.enabled;
    d["hw"]["pir"]["pin"]         = p.hw.pir.pin;
    d["hw"]["pir"]["debounceSec"] = p.hw.pir.debounceSec;
    d["hw"]["pir"]["holdSec"]     = p.hw.pir.holdSec;

    d["hw"]["tempHum"]["enabled"]     = p.hw.tempHum.enabled;
    d["hw"]["tempHum"]["type"]        = p.hw.tempHum.type;
    d["hw"]["tempHum"]["pin"]         = p.hw.tempHum.pin;
    d["hw"]["tempHum"]["intervalSec"] = p.hw.tempHum.intervalSec;

    d["hw"]["ble"]["enabled"]      = p.hw.ble.enabled;
    d["hw"]["ble"]["scanInterval"] = p.hw.ble.scanInterval;

    d["security"]["apiKey"] = p.security.apiKey;

    d["time"]["ntpServer"]       = p.time.ntpServer;
    d["time"]["timezone"]        = p.time.timezone;
    d["time"]["syncIntervalMin"] = p.time.syncIntervalMin;
}

void CL_C10_ConfigManager::toJson_Wifi(const ST_A20_WifiConfig_t& p, JsonDocument& d) {
    d["wifi"]["wifiMode"]     = p.wifiMode;
    d["wifi"]["wifiModeDesc"] = p.wifiModeDesc;
    d["wifi"]["ap"]["ssid"]   = p.ap.ssid;
    d["wifi"]["ap"]["pass"]   = p.ap.pass;

    JsonArray v_staArr = d["wifi"]["sta"].to<JsonArray>();
    for (uint8_t i = 0; i < p.staCount; i++) {
        JsonObject v_net = v_staArr.add<JsonObject>();
        v_net["ssid"]    = p.sta[i].ssid;
        v_net["pass"]    = p.sta[i].pass;
    }
}

void CL_C10_ConfigManager::toJson_Motion(const ST_A20_MotionConfig_t& p, JsonDocument& d) {
    d["motion"]["pir"]["enabled"] = p.pir.enabled;
    d["motion"]["pir"]["holdSec"] = p.pir.holdSec;

    d["motion"]["ble"]["enabled"]     = p.ble.enabled;
    d["motion"]["ble"]["rssi"]["on"]  = p.ble.rssi.on;
    d["motion"]["ble"]["rssi"]["off"] = p.ble.rssi.off;

    d["motion"]["ble"]["rssi"]["avgCount"]     = p.ble.rssi.avgCount;
    d["motion"]["ble"]["rssi"]["persistCount"] = p.ble.rssi.persistCount;
    d["motion"]["ble"]["rssi"]["exitDelaySec"] = p.ble.rssi.exitDelaySec;

    JsonArray v_tdArr = d["motion"]["ble"]["trustedDevices"].to<JsonArray>();
    for (uint8_t i = 0; i < p.ble.trustedCount; i++) {
        const ST_A20_BLETrustedDevice_t& v_d  = p.ble.trustedDevices[i];
        JsonObject                       v_td = v_tdArr.add<JsonObject>();

        v_td["alias"]       = v_d.alias;
        v_td["name"]        = v_d.name;
        v_td["mac"]         = v_d.mac;
        v_td["manufPrefix"] = v_d.manufPrefix;
        v_td["prefixLen"]   = v_d.prefixLen;
        v_td["enabled"]     = v_d.enabled;
    }

    // Timing
    d["motion"]["timing"]["simIntervalMs"]     = p.timing.simIntervalMs;
    d["motion"]["timing"]["gustIntervalMs"]    = p.timing.gustIntervalMs;
    d["motion"]["timing"]["thermalIntervalMs"] = p.timing.thermalIntervalMs;
}

