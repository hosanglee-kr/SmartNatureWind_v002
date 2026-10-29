/*
 * ------------------------------------------------------
 * 소스명 : TM10_TimeMg_0202.cpp
 * 모듈 약어 : TM10
 * 모듈명 : Smart Nature Wind Time Manager (Implementation)
 * ------------------------------------------------------
 * [E-2.1] 헤더에서 구현 분리 (인라인 → 외부 링크)
 *  - 원본 TM10_TimeMg_0202.h 인라인 함수 전부 이관
 *  - C++17 inline static 멤버는 헤더에 그대로 유지 (여기서 재정의 금지)
 * [Batch C] _isTimeSane: epoch sanity 상수화 (A20_Const::G_TIME_*)
 * ------------------------------------------------------
 */

#include "TM10_TimeMg_0202.h"

// ESP32 SNTP (Arduino-ESP32) - 헤더에서 이동 (구현에서만 필요)
#include <esp_sntp.h>

// ======================================================
// _setDefaults
// ======================================================
void CL_TM10_TimeManager::_setDefaults() {
    memset(s_tz, 0, sizeof(s_tz));
    memset(s_primary, 0, sizeof(s_primary));
    strlcpy(s_tz, "Asia/Seoul", sizeof(s_tz));
    strlcpy(s_primary, "pool.ntp.org", sizeof(s_primary));
    s_syncIntervalMs = (6UL * 60UL * 60UL * 1000UL);

    for (uint8_t i = 0; i < 4; i++) {
        memset(s_serverList[i], 0, sizeof(s_serverList[i]));
    }
    strlcpy(s_serverList[0], s_primary, sizeof(s_serverList[0]));
    for (uint8_t i = 0; i < 3; i++) {
        strlcpy(s_serverList[i + 1], s_fallbackServers[i], sizeof(s_serverList[i + 1]));
    }
}

// ======================================================
// _copySysTime
// ======================================================
void CL_TM10_TimeManager::_copySysTime(const ST_A20_SystemConfig_t& p_sys) {
    // TZ
    if (p_sys.timeCfg.timezone[0]) {
        memset(s_tz, 0, sizeof(s_tz));
        strlcpy(s_tz, p_sys.timeCfg.timezone, sizeof(s_tz));
    }

    // primary NTP
    if (p_sys.timeCfg.ntpServer[0]) {
        memset(s_primary, 0, sizeof(s_primary));
        strlcpy(s_primary, p_sys.timeCfg.ntpServer, sizeof(s_primary));
    }

    // interval (min -> ms)
    uint32_t v_ms = (uint32_t)p_sys.timeCfg.syncIntervalMin * 60000UL;
    if (v_ms == 0) v_ms = (6UL * 60UL * 60UL * 1000UL);
    v_ms = A40_ComFunc::clampVal(v_ms,
                                 (uint32_t)G_TM10_MIN_SYNC_INTERVAL_MS,
                                 (uint32_t)G_TM10_MAX_SYNC_INTERVAL_MS);
    s_syncIntervalMs = v_ms;

    // 서버 리스트 재구성
    for (uint8_t i = 0; i < 4; i++) {
        memset(s_serverList[i], 0, sizeof(s_serverList[i]));
    }
    strlcpy(s_serverList[0], s_primary, sizeof(s_serverList[0]));
    for (uint8_t i = 0; i < 3; i++) {
        strlcpy(s_serverList[i + 1], s_fallbackServers[i], sizeof(s_serverList[i + 1]));
    }
}

// ======================================================
// _isTimeSane (Batch C: 상수화)
// ======================================================
bool CL_TM10_TimeManager::_isTimeSane() {
    time_t v_now = time(nullptr);
    if ((uint32_t)v_now < A20_Const::G_TIME_EPOCH_SANE_MIN) return false;

    struct tm v_tm;
    memset(&v_tm, 0, sizeof(v_tm));

    if (localtime_r(&v_now, &v_tm) == nullptr) return false;

    int v_year = v_tm.tm_year + 1900;
    if (v_year < A20_Const::G_TIME_YEAR_MIN || v_year > A20_Const::G_TIME_YEAR_MAX) return false;

    return true;
}

// ======================================================
// _onSntpTimeSync (SNTP 콜백)
// ======================================================
void CL_TM10_TimeManager::_onSntpTimeSync(struct timeval* p_tv) {
    (void)p_tv;

    if (!s_mutex) return;
    if (xSemaphoreTakeRecursive(s_mutex, 0) != pdTRUE) return;

    bool v_ok = _isTimeSane();
    if (v_ok) {
        s_timeValid       = true;
        s_waitingCallback = false;
        s_lastSyncMs      = millis();

        _updateSyncedRecently(millis());

        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[TM10] SNTP synced OK (server=%s)",
                           s_serverList[s_activeServerIdx]);
    } else {
        s_timeValid = false;
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[TM10] SNTP callback but time is not sane (server=%s)",
                           s_serverList[s_activeServerIdx]);
    }

    xSemaphoreGiveRecursive(s_mutex);
}

// ======================================================
// _stopSntp / _startSntpWithServer
// ======================================================
void CL_TM10_TimeManager::_stopSntp() {
    if (!s_running) return;
    esp_sntp_stop();
    s_running = false;
}

void CL_TM10_TimeManager::_startSntpWithServer(uint8_t p_idx) {
    if (p_idx >= 4) p_idx = 0;

    setenv("TZ", s_tz, 1);
    tzset();

    _stopSntp();

    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, s_serverList[p_idx]);
    esp_sntp_set_time_sync_notification_cb(&CL_TM10_TimeManager::_onSntpTimeSync);
    esp_sntp_set_sync_interval((uint32_t)s_syncIntervalMs);
    esp_sntp_init();

    s_running         = true;
    s_activeServerIdx = p_idx;
    s_waitingCallback = true;
    s_waitStartMs     = millis();
    s_lastRequestMs   = s_waitStartMs;

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[TM10] SNTP start: tz=%s, server=%s, intervalMs=%lu",
                       s_tz,
                       s_serverList[p_idx],
                       (unsigned long)s_syncIntervalMs);
}

// ======================================================
// _requestSync / _switchToNextServer
// ======================================================
void CL_TM10_TimeManager::_requestSync() {
    _startSntpWithServer(s_activeServerIdx);
}

void CL_TM10_TimeManager::_switchToNextServer() {
    uint8_t v_next = (uint8_t)(s_activeServerIdx + 1);
    if (v_next >= 4) v_next = 0;

    CL_D10_Logger::log(EN_L10_LOG_WARN,
                       "[TM10] NTP fallback switch: %s -> %s",
                       s_serverList[s_activeServerIdx],
                       s_serverList[v_next]);

    _startSntpWithServer(v_next);
}

// ======================================================
// begin
// ======================================================
void CL_TM10_TimeManager::begin() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    // 멱등 가드: SNTP 진행 중이거나 WiFi up 상태면 상태 리셋 금지
    if (s_running || s_wifiUp) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG,
                           "[TM10] begin ignored (running=%d wifiUp=%d)",
                           (int)s_running, (int)s_wifiUp);
        return;
    }

    _setDefaults();

    s_timeValid       = _isTimeSane();
    s_wifiUp          = false;
    s_lastSyncMs      = 0;
    s_lastRequestMs   = 0;
    s_activeServerIdx = 0;
    s_running         = false;
    s_waitingCallback = false;
    s_waitStartMs     = 0;
    s_nextActionMs    = 0;

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[TM10] begin (timeValid=%d)", (int)s_timeValid);
}

// ======================================================
// requestTimeSync() / requestTimeSync(bool)
// ======================================================
void CL_TM10_TimeManager::requestTimeSync() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    if (!s_wifiUp) return;
    if (s_waitingCallback) return;

    s_waitingCallback = true;
    s_waitStartMs     = millis();
    s_nextActionMs    = 0;

    _requestSync();
}

void CL_TM10_TimeManager::requestTimeSync(bool p_force) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    if (!s_wifiUp) return;
    if (s_waitingCallback && !p_force) return;

    s_waitingCallback = true;
    s_waitStartMs     = millis();
    s_nextActionMs    = 0;

    _requestSync();
}

// ======================================================
// applyTimeConfig
// ======================================================
void CL_TM10_TimeManager::applyTimeConfig(const ST_A20_SystemConfig_t& p_sys) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    _copySysTime(p_sys);

    bool v_wifiUp = s_wifiUp;

    s_activeServerIdx = 0;

    if (v_wifiUp) {
        _startSntpWithServer(s_activeServerIdx);
    }
}

// ======================================================
// onWiFiConnected / onWiFiDisconnected
// ======================================================
void CL_TM10_TimeManager::onWiFiConnected(const ST_A20_SystemConfig_t& p_sys) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    s_wifiUp = true;

    _copySysTime(p_sys);

    s_activeServerIdx = 0;

    _startSntpWithServer(s_activeServerIdx);
}

void CL_TM10_TimeManager::onWiFiDisconnected() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    s_wifiUp          = false;
    s_waitingCallback = false;
    s_lastRequestMs   = 0;
    s_waitStartMs     = 0;
    s_nextActionMs    = 0;

    s_timeValid = _isTimeSane();
    _updateSyncedRecently(millis());

    _stopSntp();

    CL_D10_Logger::log(EN_L10_LOG_WARN,
                       "[TM10] WiFi down -> SNTP stopped (timeValid=%d, syncedRecently=%d)",
                       (int)s_timeValid,
                       (int)s_timeSyncedRecently);
}

// ======================================================
// tick
// ======================================================
void CL_TM10_TimeManager::tick(const ST_A20_SystemConfig_t* p_sysOrNull) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    uint32_t v_now = millis();

    _updateSyncedRecently(v_now);

    if (!s_wifiUp) return;

    if (p_sysOrNull) {
        uint32_t v_ms = (uint32_t)p_sysOrNull->timeCfg.syncIntervalMin * 60000UL;
        if (v_ms == 0) v_ms = (6UL * 60UL * 60UL * 1000UL);
        v_ms = A40_ComFunc::clampVal(v_ms,
                                     (uint32_t)G_TM10_MIN_SYNC_INTERVAL_MS,
                                     (uint32_t)G_TM10_MAX_SYNC_INTERVAL_MS);
        s_syncIntervalMs = v_ms;
        esp_sntp_set_sync_interval((uint32_t)s_syncIntervalMs);
    }

    if (s_waitingCallback) {
        if (s_nextActionMs != 0 && v_now < s_nextActionMs) return;

        if (v_now - s_waitStartMs >= (uint32_t)G_TM10_SYNC_TIMEOUT_MS) {
            s_nextActionMs = v_now + (uint32_t)G_TM10_RETRY_BACKOFF_MS;

            _switchToNextServer();
            return;
        }
    }

    if (s_timeValid) {
        if (!_isTimeSane()) {
            s_timeValid       = false;
            s_waitingCallback = true;
            s_waitStartMs     = v_now;
            s_nextActionMs    = v_now + (uint32_t)G_TM10_RETRY_BACKOFF_MS;

            _requestSync();
            return;
        }
    }
}

// ======================================================
// toJson
// ======================================================
void CL_TM10_TimeManager::toJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return;
    }

    JsonObject v_root = p_doc.to<JsonObject>();
    JsonObject v_time = v_root["time"].to<JsonObject>();

    v_time["wifiUp"]          = s_wifiUp;
    v_time["timeValid"]       = s_timeValid;
    v_time["activeServerIdx"] = s_activeServerIdx;
    v_time["activeServer"]    = s_serverList[s_activeServerIdx];
    v_time["syncIntervalMs"]  = (uint32_t)s_syncIntervalMs;
    v_time["lastSyncMs"]      = (uint32_t)s_lastSyncMs;
    v_time["lastRequestMs"]   = (uint32_t)s_lastRequestMs;
    v_time["waitingCallback"] = s_waitingCallback;
    v_time["syncedRecently"]  = s_timeSyncedRecently;
}

// ======================================================
// isTimeValid / isTimeSyncedRecently / getLocalTime
// ======================================================
bool CL_TM10_TimeManager::isTimeValid() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return false;
    }
    return s_timeValid;
}

bool CL_TM10_TimeManager::isTimeSyncedRecently(uint32_t p_windowMs) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return false;
    }

    uint32_t v_win = (p_windowMs == 0) ? (uint32_t)G_TM10_SYNC_RECENT_WINDOW_MS : p_windowMs;
    if (s_lastSyncMs == 0) return false;

    uint32_t v_now = millis();
    if (v_now >= s_lastSyncMs && (v_now - s_lastSyncMs) <= v_win) return true;

    return false;
}

bool CL_TM10_TimeManager::getLocalTime(struct tm& p_outTm) {
    memset(&p_outTm, 0, sizeof(p_outTm));

    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
        return false;
    }

    if (!_isTimeSane()) {
        s_timeValid          = false;
        s_timeSyncedRecently = false;
        return false;
    }

    time_t v_now = time(nullptr);
    if (v_now <= 0) {
        s_timeValid          = false;
        s_timeSyncedRecently = false;
        return false;
    }

    if (localtime_r(&v_now, &p_outTm) == nullptr) {
        s_timeValid          = false;
        s_timeSyncedRecently = false;
        return false;
    }

    s_timeValid = true;
    _updateSyncedRecently(millis());

    return true;
}

// ======================================================
// _updateSyncedRecently
// ======================================================
void CL_TM10_TimeManager::_updateSyncedRecently(uint32_t p_nowMs) {
    if (s_lastSyncMs == 0) {
        s_timeSyncedRecently = false;
        return;
    }

    uint32_t v_win = (uint32_t)G_TM10_SYNC_RECENT_WINDOW_MS;

    if (p_nowMs >= s_lastSyncMs && (p_nowMs - s_lastSyncMs) <= v_win) {
        s_timeSyncedRecently = true;
    } else {
        s_timeSyncedRecently = false;
    }
}
