/*
 * ------------------------------------------------------
 * 소스명 : WF10_WiFiMgr_0201.cpp
 * 모듈약어 : WF10
 * 모듈명 : Smart Nature Wind Wi-Fi Manager + NTP Sync (v0201)
 * ------------------------------------------------------
 * [Batch C-8] 백오프/재연결 매직넘버 상수화
 * [Batch D-4] s_staConnected atomic store/load
 *  - GOT_IP / DISCONNECTED / startSTA / getWifiStateJson / isStaConnected
 * ------------------------------------------------------
 */

#include "WF10_WiFiMgr_0201.h"

#include "A25_Com_Utils_0201.h"

#include <esp_netif.h>
#include <lwip/dns.h>
#include <lwip/ip_addr.h>

extern ST_A20_ConfigRoot_t g_A20_config_root;

// --------------------------------------------------
// Static Members Definition
// --------------------------------------------------
// [D-4] s_staConnected는 inline static std::atomic<bool>로 헤더에서 초기화됨
wl_status_t       CL_WF10_WiFiManager::s_lastStaStatus     = WL_IDLE_STATUS;
uint8_t           CL_WF10_WiFiManager::s_reconnectAttempts = 0;
SemaphoreHandle_t CL_WF10_WiFiManager::s_wifiMutex         = nullptr;

TaskHandle_t      CL_WF10_WiFiManager::s_wifiTaskHandle    = nullptr;
SemaphoreHandle_t CL_WF10_WiFiManager::s_wifiRequestSem    = nullptr;

// --------------------------------------------------
// 이벤트 등록
// --------------------------------------------------
void CL_WF10_WiFiManager::attachWiFiEvents() {
    static bool v_attached = false;
    if (v_attached) return;

    WiFi.onEvent(
        [](arduino_event_id_t, arduino_event_info_t) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] STA start");
        },
        ARDUINO_EVENT_WIFI_STA_START);

    WiFi.onEvent(
        [](arduino_event_id_t, arduino_event_info_t) {
            CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, G_A40_MUTEX_TIMEOUT_100, "WF10::EVT_STA_GOT_IP");
            if (!v_guard.isAcquired()) {
                CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[WF10] %s: Mutex busy (GOT_IP)", "WF10::EVT_STA_GOT_IP");
                return;
            }

            CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] STA got IP: %s", WiFi.localIP().toString().c_str());
            // [D-4] atomic store
            s_staConnected.store(true, std::memory_order_release);
            s_lastStaStatus     = WL_CONNECTED;
            s_reconnectAttempts = 0;

            if (g_A20_config_root.system) {
                CL_TM10_TimeManager::onWiFiConnected(*g_A20_config_root.system);
            }
        },
        ARDUINO_EVENT_WIFI_STA_GOT_IP);

    WiFi.onEvent(
        [](arduino_event_id_t event, arduino_event_info_t info) {
            if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
                CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, G_A40_MUTEX_TIMEOUT_100, "WF10::EVT_STA_DISCONNECTED");
                if (!v_guard.isAcquired()) {
                    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[WF10] %s: Mutex busy (DISCONN)", __func__);
                    return;
                }

                CL_D10_Logger::log(EN_L10_LOG_WARN, "[WF10] STA disconnected (reason=%d)", info.wifi_sta_disconnected.reason);
                // [D-4] atomic store
                s_staConnected.store(false, std::memory_order_release);
                s_lastStaStatus = WL_DISCONNECTED;

                CL_TM10_TimeManager::onWiFiDisconnected();

                // [C-8] 재연결 횟수 상수화
                if (s_reconnectAttempts < G_WF10_RECONNECT_MAX) {
                    s_reconnectAttempts++;
                    CL_D10_Logger::log(EN_L10_LOG_INFO,
                                       "[WF10] Reconnect attempt %d/%d...",
                                       s_reconnectAttempts,
                                       (int)G_WF10_RECONNECT_MAX);
                    WiFi.reconnect();
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] Reconnect limit exceeded.");
                }
            }
        },
        ARDUINO_EVENT_WIFI_STA_DISCONNECTED);

    v_attached = true;
}

// --------------------------------------------------
// 초기화
// --------------------------------------------------
bool CL_WF10_WiFiManager::init(const ST_A20_WifiConfig_t&   p_cfg_wifi,
                               const ST_A20_SystemConfig_t& p_cfg_system,
                               uint8_t                      p_apChannel,
                               uint8_t                      p_staMaxTries,
                               bool                         p_enableApDhcp) {
    CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[WF10] %s: Mutex busy", __func__);
        return false;
    }

    attachWiFiEvents();
    CL_TM10_TimeManager::begin();

    WiFi.persistent(false);
    WiFi.setAutoReconnect(true);
    WiFi.setSleep(false);

    char v_hostname[32];
    snprintf(v_hostname, sizeof(v_hostname), "NatureWind-%04X", (uint16_t)(esp_random() & 0xFFFF));
    WiFi.setHostname(v_hostname);

    _ensureWifiTask();

    bool v_ap_ok  = false;
    bool v_sta_ok = false;

    s_wifiMulti = WiFiMulti();

    switch (p_cfg_wifi.wifiMode) {
        case 0: // AP Only
            WiFi.mode(WIFI_AP);
            return startAP(p_cfg_wifi, p_apChannel, p_enableApDhcp);

        case 1: // STA Only
            WiFi.mode(WIFI_STA);
            v_sta_ok = startSTA(p_cfg_wifi, p_staMaxTries);
            if (!v_sta_ok) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[WF10] %s: STA fail -> Fallback AP", __func__);
                WiFi.mode(WIFI_AP_STA);
                startAP(p_cfg_wifi, p_apChannel, p_enableApDhcp);
            }
            return true;

        default: // AP+STA
            WiFi.mode(WIFI_AP_STA);
            v_ap_ok  = startAP(p_cfg_wifi, p_apChannel, p_enableApDhcp);
            v_sta_ok = startSTA(p_cfg_wifi, p_staMaxTries);
            return v_ap_ok || v_sta_ok;
    }
}

// --------------------------------------------------
// AP 시작
// --------------------------------------------------
bool CL_WF10_WiFiManager::startAP(const ST_A20_WifiConfig_t& p_cfg_wifi, uint8_t p_channel, bool p_enableDhcp) {
    char v_pass[A20_Const::LEN_PASS + 1];
    memset(v_pass, 0, sizeof(v_pass));
    strlcpy(v_pass, p_cfg_wifi.ap.pass, sizeof(v_pass));

    if (strlen(v_pass) < 8) v_pass[0] = '\0';

    WiFi.softAPdisconnect(true);
    WiFi.disconnect(true, true);

    WiFi.softAPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));

    bool v_ok = WiFi.softAP(p_cfg_wifi.ap.ssid, v_pass, p_channel, false, 4);

    if (!p_enableDhcp) {
        esp_netif_t* v_apNetif = esp_netif_get_handle_from_ifkey("WIFI_AP_DEF");
        if (v_apNetif) {
            esp_err_t v_err = esp_netif_dhcps_stop(v_apNetif);
            CL_D10_Logger::log((v_err == ESP_OK) ? EN_L10_LOG_INFO : EN_L10_LOG_WARN,
                               "[WF10] AP DHCP disable: %s (err=0x%X)",
                               (v_err == ESP_OK) ? "OK" : "FAIL",
                               (unsigned int)v_err);
        } else {
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[WF10] AP DHCP disable requested but esp_netif handle is null");
        }
    }

    CL_D10_Logger::log(v_ok ? EN_L10_LOG_INFO : EN_L10_LOG_ERROR,
                       v_ok ? "[WF10] AP started (%s)" : "[WiFi] AP start ERR",
                       WiFi.softAPIP().toString().c_str());
    return v_ok;
}

// --------------------------------------------------
// STA 시작 (지수 백오프 상수화)
// --------------------------------------------------
bool CL_WF10_WiFiManager::startSTA(const ST_A20_WifiConfig_t& p_cfg_wifi, uint8_t p_maxTries) {
    CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[WF10] %s: Mutex busy", __func__);
        return false;
    }

    // [D-4] atomic store
    s_staConnected.store(false, std::memory_order_release);
    s_lastStaStatus     = WL_IDLE_STATUS;
    s_reconnectAttempts = 0;

    if (p_cfg_wifi.staCount == 0) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[WF10] %s: No STA entries", __func__);
        return false;
    }

    for (uint8_t i = 0; i < p_cfg_wifi.staCount; i++) {
        if (p_cfg_wifi.sta[i].ssid[0] == '\0') continue;
        s_wifiMulti.addAP(p_cfg_wifi.sta[i].ssid, p_cfg_wifi.sta[i].pass);
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] %s: candidate: %s", __func__, p_cfg_wifi.sta[i].ssid);
    }

    v_guard.unlock();

    // [C-8] 지수 백오프 상수화
    uint8_t  v_try  = 0;
    uint32_t v_wait = G_WF10_BACKOFF_INIT_MS;
    while (WiFi.status() != WL_CONNECTED && v_try < p_maxTries) {
        if (s_wifiMulti.run(G_WF10_MULTI_RUN_TIMEOUT_MS) == WL_CONNECTED) break;
        v_try++;
        delay(v_wait);
        v_wait = (v_wait < G_WF10_BACKOFF_MAX_MS)
                     ? (v_wait * G_WF10_BACKOFF_MUL)
                     : G_WF10_BACKOFF_MAX_MS;
    }

    if (!v_guard.acquireTicks(G_A40_MUTEX_TIMEOUT_100)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] %s: Mutex re-acquire fail", __func__);
        return false;
    }

    if (WiFi.status() == WL_CONNECTED) {
        const ip_addr_t* v_dns = dns_getserver(0);
        if (v_dns) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] %s: DNS: %s", __func__, ipaddr_ntoa(v_dns));
        }
        // [D-4] atomic store
        s_staConnected.store(true, std::memory_order_release);
        s_lastStaStatus = WL_CONNECTED;

        // [FIX-1] 부팅 경로 GOT_IP 콜백 누락 방어 → TM10 명시 통지
        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);
        if (v_snap.system) {
            CL_TM10_TimeManager::onWiFiConnected(*v_snap.system);
            CL_D10_Logger::log(EN_L10_LOG_INFO,
                               "[WF10] %s: TM10 notified (explicit, STA up)",
                               __func__);
        }

        return true;
    }

    CL_D10_Logger::log(EN_L10_LOG_WARN, "[WF10] %s: STA connect fail", __func__);
    return false;
}

// --------------------------------------------------
// 상태 JSON (atomic read)
// --------------------------------------------------
void CL_WF10_WiFiManager::getWifiStateJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[WF10] %s: Mutex busy", __func__);
        return;
    }

    JsonObject v_wifi = p_doc["wifi"].to<JsonObject>();
    JsonObject v      = v_wifi["state"].to<JsonObject>();

    v["mode"]      = (int)WiFi.getMode();
    v["mode_name"] = (WiFi.getMode() == WIFI_STA ? "STA" : WiFi.getMode() == WIFI_AP ? "AP" : "AP+STA");
    v["status"]    = getStaStatusString();
    v["ssid"]      = WiFi.SSID();
    v["ip"]        = WiFi.localIP().toString();
    v["mac"]       = WiFi.macAddress();
    v["rssi"]      = WiFi.RSSI();
    v["hostname"]  = WiFi.getHostname();

    // [D-4] atomic load
    v["connected"] = s_staConnected.load(std::memory_order_acquire);

    bool   v_timeOk  = false;
    time_t v_nowTime = time(nullptr);
    // [C] epoch sanity 상수화
    if ((uint32_t)v_nowTime > A20_Const::G_TIME_EPOCH_SANE_MIN) v_timeOk = true;

    v["timeSynced"]        = v_timeOk;
    v["reconnectAttempts"] = s_reconnectAttempts;
}

// --------------------------------------------------
// 스캔 JSON
// --------------------------------------------------
void CL_WF10_WiFiManager::scanNetworksToJson(JsonDocument& p_doc) {
    int v_found = WiFi.scanNetworks(false, true);

    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_wifi = v_root["wifi"].to<JsonObject>();
    JsonArray  arr    = v_wifi["scan"].to<JsonArray>();

    for (int i = 0; i < v_found; i++) {
        JsonObject o = arr.add<JsonObject>();
        o["ssid"]    = WiFi.SSID(i);
        o["rssi"]    = WiFi.RSSI(i);
        o["chan"]    = WiFi.channel(i);
        o["bssid"]   = WiFi.BSSIDstr(i);
        o["enc"]     = _encTypeToString(WiFi.encryptionType(i));
    }
    WiFi.scanDelete();
}

// --------------------------------------------------
// [D-4] lock-free isStaConnected
// --------------------------------------------------
bool CL_WF10_WiFiManager::isStaConnected() {
    return s_staConnected.load(std::memory_order_acquire)
        && (WiFi.status() == WL_CONNECTED);
}

const char* CL_WF10_WiFiManager::getStaStatusString() {
    switch (WiFi.status()) {
        case WL_CONNECTED:      return "CONNECTED";
        case WL_NO_SSID_AVAIL:  return "NO_SSID";
        case WL_CONNECT_FAILED: return "FAILED";
        case WL_IDLE_STATUS:    return "IDLE";
        case WL_DISCONNECTED:   return "DISCONNECTED";
        default:                return "UNKNOWN";
    }
}

const char* CL_WF10_WiFiManager::_encTypeToString(wifi_auth_mode_t p_mode) {
    switch (p_mode) {
        case WIFI_AUTH_OPEN:            return "OPEN";
        case WIFI_AUTH_WEP:             return "WEP";
        case WIFI_AUTH_WPA_PSK:         return "WPA_PSK";
        case WIFI_AUTH_WPA2_PSK:        return "WPA2_PSK";
        case WIFI_AUTH_WPA_WPA2_PSK:    return "WPA_WPA2_PSK";
        case WIFI_AUTH_WPA3_PSK:        return "WPA3_PSK";
        case WIFI_AUTH_WPA2_WPA3_PSK:   return "WPA2_WPA3_PSK";
        default:                        return "UNKNOWN";
    }
}

// --------------------------------------------------
// Wi-Fi 설정 적용
// --------------------------------------------------
bool CL_WF10_WiFiManager::applyConfig(const ST_A20_WifiConfig_t& p_cfg) {
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WiFi] Applying new configuration...");

    WiFi.disconnect(true);
    WiFi.softAPdisconnect(true);

    s_wifiMulti = WiFiMulti();

    ST_A20_ConfigRoot_t v_snap;
    CL_C10_ConfigManager::getRootSnapshot(v_snap);

    if (!v_snap.system) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[WiFi] applyConfig: system config is null. "
                           "Proceeding without system-time integration (TM10 will be limited).");

        ST_A20_SystemConfig_t v_sys;
        memset(&v_sys, 0, sizeof(v_sys));
        strlcpy(v_sys.timeCfg.ntpServer, "pool.ntp.org", sizeof(v_sys.timeCfg.ntpServer));
        strlcpy(v_sys.timeCfg.timezone,  "Asia/Seoul",   sizeof(v_sys.timeCfg.timezone));
        v_sys.timeCfg.syncIntervalMin = 360;

        bool v_ok = init(p_cfg, v_sys, 1, 15, true);
        return v_ok;
    }

    bool v_ok = init(p_cfg, *v_snap.system, 1, 15, true);

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[WiFi] Configuration applied (ok=%d, mode=%d)",
                       (int)v_ok, (int)p_cfg.wifiMode);
    return v_ok;
}

// ==================================================
// [WF10-task] 재연결 요청
// ==================================================
CL_WF10_WiFiManager::EN_WF10_req_result_t CL_WF10_WiFiManager::requestReconnect() {
    if (!_ensureWifiTask()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] Reconnect request failed: task unavailable");
        return EN_WF10_REQ_FAILED;
    }

    if (xSemaphoreGive(s_wifiRequestSem) != pdTRUE) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect already pending (coalesced)");
        return EN_WF10_REQ_COALESCED;
    }

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect requested (WiFi task signaled)");
    return EN_WF10_REQ_OK;
}

// ==================================================
// [WF10-task] 태스크 생성
// ==================================================
bool CL_WF10_WiFiManager::_ensureWifiTask() {
    // Fast path
    if (s_wifiTaskHandle != nullptr) return true;

    CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG,
                           "[WF10] %s: Mutex busy (task creating?)",
                           __func__);
        return (s_wifiTaskHandle != nullptr);
    }

    // Double-check
    if (s_wifiTaskHandle != nullptr) return true;

    if (s_wifiRequestSem == nullptr) {
        s_wifiRequestSem = xSemaphoreCreateBinary();
        if (s_wifiRequestSem == nullptr) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] semaphore create failed");
            return false;
        }
    }

    BaseType_t v_ret = xTaskCreate(
        _wifiTask,
        "WF10_Reconnect",
        8192,
        nullptr,
        1,
        &s_wifiTaskHandle
    );

    if (v_ret != pdPASS) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] task create failed (ret=%d)", (int)v_ret);
        vSemaphoreDelete(s_wifiRequestSem);
        s_wifiRequestSem = nullptr;
        s_wifiTaskHandle = nullptr;
        return false;
    }

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect task created (prio=1, stack=8192)");
    return true;
}

void CL_WF10_WiFiManager::_wifiTask(void* p_param) {
    (void)p_param;

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10][Task] started, waiting for requests...");

    static ST_A20_WifiConfig_t s_wifiSnap;

    while (true) {
        if (xSemaphoreTake(s_wifiRequestSem, portMAX_DELAY) != pdTRUE) continue;

        ST_A20_ConfigRoot_t v_snap;
        CL_C10_ConfigManager::getRootSnapshot(v_snap);

        if (!v_snap.wifi || !v_snap.system) {
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[WF10][Task] skip: config null");
            continue;
        }
        memcpy(&s_wifiSnap, v_snap.wifi, sizeof(s_wifiSnap));

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10][Task] applying WiFi config...");
        bool v_ok = applyConfig(s_wifiSnap);

        UBaseType_t v_hwm = uxTaskGetStackHighWaterMark(NULL);
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                          "[WF10][Task] done (ok=%d, stack_free_min=%u bytes / %u words)",
                          (int)v_ok,
                          (unsigned)(v_hwm * sizeof(StackType_t)),
                          (unsigned)v_hwm);
    }
}
