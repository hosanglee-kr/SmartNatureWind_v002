#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : TM10_TimeMg_050.h
 * 모듈 약어 : TM10
 * 모듈명 : Smart Nature Wind Time Manager (SNTP Callback Only + Fallback) (v001)
 * ------------------------------------------------------
 * 기능 요약:
 *  - system.time 설정(TZ/NTP/주기)을 런타임에 반영
 *  - SNTP "콜백 기반" 동기화(긴 블로킹 폴링 금지)
 *  - NTP 서버 실패 시 fallback 서버로 자동 전환
 *  - 시간 유효성 검증(localtime_r NULL 방어 + sanity check)
 *  - Wi-Fi 연결/끊김 이벤트 기반으로 동기화 재요청/상태 리셋
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

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "A20_Const_050.h"
#include "D10_Logger_050.h"

// ESP32 SNTP (Arduino-ESP32)
#include <esp_sntp.h>

// ------------------------------------------------------
// 운영급 튜닝 상수
// ------------------------------------------------------
// #ifndef G_TM10_MUTEX_TIMEOUT
// # define G_TM10_MUTEX_TIMEOUT pdMS_TO_TICKS(100)
// #endif

#ifndef G_TM10_SYNC_TIMEOUT_MS
// 서버 1개당 콜백을 기다리는 시간(블로킹X, tick에서 체크)
# define G_TM10_SYNC_TIMEOUT_MS (15000UL)
#endif

#ifndef G_TM10_RETRY_BACKOFF_MS
// fallback 서버 전환 후 다음 체크까지 최소 대기
# define G_TM10_RETRY_BACKOFF_MS (2000UL)
#endif

#ifndef G_TM10_MIN_SYNC_INTERVAL_MS
// SNTP 주기 하한(너무 짧으면 네트워크/서버 부하)
# define G_TM10_MIN_SYNC_INTERVAL_MS (5UL * 60UL * 1000UL) // 5분
#endif

#ifndef G_TM10_MAX_SYNC_INTERVAL_MS
# define G_TM10_MAX_SYNC_INTERVAL_MS (24UL * 60UL * 60UL * 1000UL) // 24시간
#endif

// ------------------------------------------------------
// TM10 Time Manager
// ------------------------------------------------------
class CL_TM10_TimeManager {
  public:
    // 상태 (외부 조회용)
    inline static bool     s_timeValid       = false; // "유효한 로컬 시간" 확보 여부
    inline static bool     s_wifiUp          = false; // Wi-Fi 연결 여부
    inline static uint32_t s_lastSyncMs      = 0;     // 마지막 성공 콜백 시점(ms)
    inline static uint32_t s_lastRequestMs   = 0;     // 마지막 동기화 요청 시점(ms)
    inline static uint8_t  s_activeServerIdx = 0;     // 현재 사용 중인 서버 인덱스

  public:
    // 초기화 (1회 호출 권장)
    static void begin();

    // Wi-Fi 연결/끊김 이벤트에서 호출
    static void onWiFiConnected(const ST_A20_SystemConfig_t& p_sys);
    static void onWiFiDisconnected();

    // (추가) 외부에서 "즉시 동기화 요청" (콜백 only, 블로킹X)
    static void requestTimeSync();

    // system.time 설정 변경 후 반영(콜백만, 블로킹X)
    static void applyTimeConfig(const ST_A20_SystemConfig_t& p_sys);

    // 메인루프에서 주기 호출(블로킹X)
    static void tick(const ST_A20_SystemConfig_t* p_sysOrNull);

    // 상태 JSON(디버그/웹)
    static void toJson(JsonDocument& p_doc);

    // ------------------------------------------------------
    // (추가) 외부 조회 API
    // ------------------------------------------------------
    static bool isTimeValid();
    static bool isTimeSyncedRecently(uint32_t p_windowMs = 0);
    static bool getLocalTime(struct tm& p_outTm);
    static void requestTimeSync(bool p_force);


  private:
    #ifndef G_TM10_SYNC_RECENT_WINDOW_MS
        // “최근 동기화”로 인정할 시간 창(기본 10분)
        # define G_TM10_SYNC_RECENT_WINDOW_MS (10UL * 60UL * 1000UL)
    #endif

    // (추가) “최근 동기화” 플래그 (timeValid와 분리)
    inline static bool     s_timeSyncedRecently = false;


    // Mutex (이제 초기화 로직은 가드 클래스가 담당)
    inline static SemaphoreHandle_t s_mutex = nullptr;

    // 설정 캐시
    inline static char     s_tz[64]         = {0};
    inline static char     s_primary[64]    = {0};
    inline static uint32_t s_syncIntervalMs = (6UL * 60UL * 60UL * 1000UL);

    // fallback 서버 풀 (primary + fixed fallbacks)
    inline static const char* s_fallbackServers[3] = {
        "time.google.com",
        "time.cloudflare.com",
        "pool.ntp.org",
    };
    inline static char s_serverList[4][64] = {{0}}; // [0]=primary, [1..3]=fallbacks

    // 내부 상태
    inline static bool     s_running         = false;
    inline static bool     s_waitingCallback = false;
    inline static uint32_t s_waitStartMs     = 0;
    inline static uint32_t s_nextActionMs    = 0;

  private:
    static void _setDefaults();
    static void _copySysTime(const ST_A20_SystemConfig_t& p_sys);

    static void _startSntpWithServer(uint8_t p_idx);
    static void _stopSntp();

    static bool _isTimeSane();
    static void _onSntpTimeSync(struct timeval* p_tv);

    static void _requestSync();        // "지금 동기화 해줘" 요청(블로킹X)
    static void _switchToNextServer(); // fallback 전환(블로킹X)

    static void _updateSyncedRecently(uint32_t p_nowMs); // 최근동기화 플래그 갱신
};

// ------------------------------------------------------
// TM10 호환/유틸 전역 함수 (라우트/타 모듈에서 직접 호출)
// ------------------------------------------------------
static inline void TM10_applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_sys);

//static inline void TM10_requestTimeSync();

// // ======================================================
// // Implementation (header-only)
// // - ⚠️ 여러 cpp에서 include되어도 링크 중복 심볼이 안 나도록
// //   모든 멤버 함수 정의를 inline 처리한다.
// // ======================================================

inline void CL_TM10_TimeManager::_setDefaults() {
    memset(s_tz, 0, sizeof(s_tz));
    memset(s_primary, 0, sizeof(s_primary));
    strlcpy(s_tz, "Asia/Seoul", sizeof(s_tz));
    strlcpy(s_primary, "pool.ntp.org", sizeof(s_primary));
    s_syncIntervalMs = (6UL * 60UL * 60UL * 1000UL);

    // 서버 리스트 구성
    for (uint8_t i = 0; i < 4; i++) {
        memset(s_serverList[i], 0, sizeof(s_serverList[i]));
    }
    strlcpy(s_serverList[0], s_primary, sizeof(s_serverList[0]));
    for (uint8_t i = 0; i < 3; i++) {
        strlcpy(s_serverList[i + 1], s_fallbackServers[i], sizeof(s_serverList[i + 1]));
    }
}

inline void CL_TM10_TimeManager::_copySysTime(const ST_A20_SystemConfig_t& p_sys) {
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
    v_ms = A40_ComFunc::clampVal(v_ms, (uint32_t)G_TM10_MIN_SYNC_INTERVAL_MS, (uint32_t)G_TM10_MAX_SYNC_INTERVAL_MS);
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

inline bool CL_TM10_TimeManager::_isTimeSane() {
    time_t v_now = time(nullptr);
    if (v_now < 1700000000) return false; // 2023-11-15 전이면 동기화 실패로 간주

    struct tm v_tm;
    memset(&v_tm, 0, sizeof(v_tm));

    // ✅ localtime_r NULL 방어 (요구사항 반영)
    if (localtime_r(&v_now, &v_tm) == nullptr) return false;

    // sanity check
    int v_year = v_tm.tm_year + 1900;
    if (v_year < 2023 || v_year > 2099) return false;

    return true;
}

inline void CL_TM10_TimeManager::_onSntpTimeSync(struct timeval* p_tv) {
    (void)p_tv;

    // 콜백은 ISR은 아니지만, 짧게 처리
    if (!s_mutex) return;
    if (xSemaphoreTakeRecursive(s_mutex, 0) != pdTRUE) return;

    bool v_ok = _isTimeSane();
    if (v_ok) {
        s_timeValid       = true;
        s_waitingCallback = false;
        s_lastSyncMs      = millis();

        _updateSyncedRecently(millis());

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[TM10] SNTP synced OK (server=%s)", s_serverList[s_activeServerIdx]);
    } else {
        // 콜백이 왔어도 시간이 이상하면 실패로 본다.
        s_timeValid = false;
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[TM10] SNTP callback but time is not sane (server=%s)",
                           s_serverList[s_activeServerIdx]);
    }

    xSemaphoreGiveRecursive(s_mutex);
}

inline void CL_TM10_TimeManager::_stopSntp() {
    if (!s_running) return;
    sntp_stop();
    s_running = false;
}

inline void CL_TM10_TimeManager::_startSntpWithServer(uint8_t p_idx) {
    if (p_idx >= 4) p_idx = 0;

    // TZ 적용
    setenv("TZ", s_tz, 1);
    tzset();

    _stopSntp();

    // SNTP 구성
    sntp_setoperatingmode(SNTP_OPMODE_POLL);

    // 서버 설정: Arduino-ESP32는 0..N 서버 슬롯 제공
    sntp_setservername(0, s_serverList[p_idx]);

    // 콜백 등록 (콜백 only)
    sntp_set_time_sync_notification_cb(&CL_TM10_TimeManager::_onSntpTimeSync);

    // 주기 설정 (ms)
    sntp_set_sync_interval((uint32_t)s_syncIntervalMs);

    // 시작
    sntp_init();

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

inline void CL_TM10_TimeManager::_requestSync() {
    // 콜백 only 정책이므로, "즉시 동기화"는 SNTP를 재시작해서 서버에 요청을 강제한다.
    // (긴 블로킹 폴링 금지)
    _startSntpWithServer(s_activeServerIdx);
}

inline void CL_TM10_TimeManager::_switchToNextServer() {
    uint8_t v_next = (uint8_t)(s_activeServerIdx + 1);
    if (v_next >= 4) v_next = 0;

    CL_D10_Logger::log(EN_L10_LOG_WARN,
                       "[TM10] NTP fallback switch: %s -> %s",
                       s_serverList[s_activeServerIdx],
                       s_serverList[v_next]);

    _startSntpWithServer(v_next);
}

inline void CL_TM10_TimeManager::begin() {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
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

inline void CL_TM10_TimeManager::requestTimeSync() {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    // Wi-Fi가 살아있을 때만 요청 (운영 안전)
    if (!s_wifiUp) {
        return;
    }

    // 이미 콜백 대기중이면 중복 재시작을 줄이기 위해 그냥 유지(운영급)
    // 단, 강제 재요청이 꼭 필요하면 아래 if를 제거하면 됨.
    if (s_waitingCallback) {
        return;
    }

    // "즉시 동기화 요청"은 SNTP 재시작으로 강제 (콜백 only)
    s_waitingCallback = true;
    s_waitStartMs     = millis();
    s_nextActionMs    = 0;

    _requestSync();
}

inline void CL_TM10_TimeManager::requestTimeSync(bool p_force) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    // Wi-Fi가 살아있을 때만 요청 (운영 안전)
    if (!s_wifiUp) {
        return;
    }

    // 기존 정책: waitingCallback이면 중복 재시작 방지
    // 개선: force=true면 즉시 재요청 허용
    if (s_waitingCallback && !p_force) {
        return;
    }

    s_waitingCallback = true;
    s_waitStartMs     = millis();
    s_nextActionMs    = 0;

    // ✅ force 또는 wait가 아니면 즉시 재시작으로 “즉시 동기화” 강제
    _requestSync();
}


inline void CL_TM10_TimeManager::applyTimeConfig(const ST_A20_SystemConfig_t& p_sys) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    _copySysTime(p_sys);

    // 동기화 상태는 유지하되, 설정이 바뀌었으면 즉시 재요청(콜백 only)
    // Wi-Fi가 살아있을 때만
    bool v_wifiUp = s_wifiUp;

    // 서버 인덱스는 primary부터 재시작
    s_activeServerIdx = 0;

    if (v_wifiUp) {
        _startSntpWithServer(s_activeServerIdx);
    }
}



inline void CL_TM10_TimeManager::onWiFiConnected(const ST_A20_SystemConfig_t& p_sys) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    s_wifiUp = true;

    _copySysTime(p_sys);

    // 연결 직후: primary부터 시작, 즉시 요청(콜백 only)
    s_activeServerIdx = 0;

    _startSntpWithServer(s_activeServerIdx);
}

inline void CL_TM10_TimeManager::onWiFiDisconnected() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    s_wifiUp          = false;
    s_waitingCallback = false;
    s_lastRequestMs   = 0;
    s_waitStartMs     = 0;
    s_nextActionMs    = 0;

    // ✅ 완화 정책:
    // - Wi-Fi가 끊겨도 현재 시간이 sane이면 timeValid는 유지
    // - 다만 “최근 동기화”는 시간이 지나면 false가 되도록 별도 플래그로 관리
    s_timeValid = _isTimeSane();
    _updateSyncedRecently(millis());

    _stopSntp();

    CL_D10_Logger::log(EN_L10_LOG_WARN,
                       "[TM10] WiFi down -> SNTP stopped (timeValid=%d, syncedRecently=%d)",
                       (int)s_timeValid,
                       (int)s_timeSyncedRecently);
}

/*

inline void CL_TM10_TimeManager::onWiFiDisconnected() {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    s_wifiUp          = false;
    s_timeValid       = false;
    s_waitingCallback = false;
    s_lastRequestMs   = 0;
    s_waitStartMs     = 0;
    s_nextActionMs    = 0;

    _stopSntp();

    CL_D10_Logger::log(EN_L10_LOG_WARN, "[TM10] WiFi down -> SNTP stopped, time invalidated");
}
*/


inline void CL_TM10_TimeManager::tick(const ST_A20_SystemConfig_t* p_sysOrNull) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return;
    }

    uint32_t v_now = millis();

    _updateSyncedRecently(v_now);



    // Wi-Fi 없으면 아무 것도 하지 않음
    if (!s_wifiUp) {
        return;
    }

    // 운영급: system 설정이 주기 중 바뀐 경우 외부에서 applyTimeConfig()로 반영하는 게 정석.
    // 하지만 안전하게 sysOrNull이 들어오면 interval만 sanity 체크 정도는 가능.
    if (p_sysOrNull) {
        // syncIntervalMin이 비정상(0 포함)이면 기본으로 강제
        uint32_t v_ms = (uint32_t)p_sysOrNull->timeCfg.syncIntervalMin * 60000UL;
        if (v_ms == 0) v_ms = (6UL * 60UL * 60UL * 1000UL);
        v_ms = A40_ComFunc::clampVal(v_ms, (uint32_t)G_TM10_MIN_SYNC_INTERVAL_MS, (uint32_t)G_TM10_MAX_SYNC_INTERVAL_MS);
        s_syncIntervalMs = v_ms;
        sntp_set_sync_interval((uint32_t)s_syncIntervalMs);
    }

    // 콜백 대기 중인데 너무 오래 걸리면 fallback 전환(블로킹X)
    if (s_waitingCallback) {
        // 다음 액션 제한(backoff)
        if (s_nextActionMs != 0 && v_now < s_nextActionMs) {
            return;
        }

        if (v_now - s_waitStartMs >= (uint32_t)G_TM10_SYNC_TIMEOUT_MS) {
            s_nextActionMs = v_now + (uint32_t)G_TM10_RETRY_BACKOFF_MS;

            _switchToNextServer();
            return;
        }
    }

    // timeValid가 false인데도 콜백이 안 오면 wait 상태가 유지되면서 timeout fallback이 동작
    // timeValid가 true면 콜백 주기(SNTP)가 알아서 갱신, 우리는 감시만.
    if (s_timeValid) {
        // 혹시라도 time이 깨졌으면 재요청
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

inline void CL_TM10_TimeManager::toJson(JsonDocument& p_doc) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장, 가드 생성 시 s_mutex가 nullptr이면 내부에서 Recursive Mutex를 자동 생성함)
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
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

    v_time["syncedRecently"] = s_timeSyncedRecently;

}


inline bool CL_TM10_TimeManager::isTimeValid() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return false;
    }
    return s_timeValid;
}

inline bool CL_TM10_TimeManager::isTimeSyncedRecently(uint32_t p_windowMs) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return false;
    }

    uint32_t v_win = (p_windowMs == 0) ? (uint32_t)G_TM10_SYNC_RECENT_WINDOW_MS : p_windowMs;

    // lastSyncMs==0이면 최근 동기화 아님
    if (s_lastSyncMs == 0) return false;

    uint32_t v_now = millis();
    if (v_now >= s_lastSyncMs && (v_now - s_lastSyncMs) <= v_win) return true;

    return false;
}

inline bool CL_TM10_TimeManager::getLocalTime(struct tm& p_outTm) {
    memset(&p_outTm, 0, sizeof(p_outTm));

    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] %s: Mutex timeout", __func__);
        return false;
    }

    // 운영 정책:
    // - timeValid가 true라도, 실제 time이 깨졌을 수 있으므로 _isTimeSane() 재확인
    // - 완화 정책: Wi-Fi down이어도 time이 sane면 허용
    if (!_isTimeSane()) {
        s_timeValid = false;
        s_timeSyncedRecently = false;
        return false;
    }

    time_t v_now = time(nullptr);
    if (v_now <= 0) {
        s_timeValid = false;
        s_timeSyncedRecently = false;
        return false;
    }

    // ✅ localtime_r NULL 방어
    if (localtime_r(&v_now, &p_outTm) == nullptr) {
        s_timeValid = false;
        s_timeSyncedRecently = false;
        return false;
    }

    // 여기는 “로컬 타임을 얻을 수 있었다”는 의미
    // timeValid는 sane check 통과 시 true 유지
    s_timeValid = true;

    // 최근동기화 플래그는 tick/_updateSyncedRecently에서 갱신되지만,
    // 호출 시점에서도 한번 보정해둔다.
    _updateSyncedRecently(millis());

    return true;
}

inline void CL_TM10_TimeManager::_updateSyncedRecently(uint32_t p_nowMs) {
    // 최근 동기화 창 기준으로 flag 갱신
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


// ------------------------------------------------------
// TM10 호환 전역 함수
// ------------------------------------------------------
static inline void TM10_applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_sys) {
    // system.time 설정을 런타임에 반영 (콜백 only, 블로킹X)
    CL_TM10_TimeManager::applyTimeConfig(p_sys);
}

/*
static inline void TM10_requestTimeSync() {
    // "즉시 동기화 요청" (콜백 only, 블로킹X)
    CL_TM10_TimeManager::requestTimeSync();
}
*/


static inline void TM10_requestTimeSync(bool p_force = false) {
    CL_TM10_TimeManager::requestTimeSync(p_force);
}
