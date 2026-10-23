#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : TM10_TimeMg_0201.h
 * 모듈 약어 : TM10
 * 모듈명 : Smart Nature Wind Time Manager (v0201)
 * ------------------------------------------------------
 * 기능 요약:
 *  - system.time 설정(TZ/NTP/주기)을 런타임에 반영
 *  - SNTP "콜백 기반" 동기화(긴 블로킹 폴링 금지)
 *  - NTP 서버 실패 시 fallback 서버로 자동 전환
 *  - 시간 유효성 검증(localtime_r NULL 방어 + sanity check)
 *  - Wi-Fi 연결/끊김 이벤트 기반으로 동기화 재요청/상태 리셋
 *
 * [E-2.1] 헤더 분리 (선언 전용)
 *  - 이전: 헤더에 인라인 구현 전체 포함 (~700줄)
 *  - 이후: 선언만 헤더, 구현은 TM10_TimeMg_0201.cpp (~600줄)
 *  - 효과: 헤더 include TU 재컴파일 범위 축소 (5개 → 1개)
 *  - inline static 멤버는 C++17 규칙상 헤더 유지 (자동 정의)
 *
 * [Batch C] epoch sanity 상수화
 *  - _isTimeSane에서 A20_Const::G_TIME_EPOCH_SANE_MIN 사용
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사
 *   - 클래스 private 멤버   : _ 접두사
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

#include "A20_Const_0201.h"
#include "D10_Logger_0201.h"
#include "A25_Com_Utils_0201.h"

// ------------------------------------------------------
// 운영급 튜닝 상수
// ------------------------------------------------------
#ifndef G_TM10_SYNC_TIMEOUT_MS
# define G_TM10_SYNC_TIMEOUT_MS (15000UL)
#endif

#ifndef G_TM10_RETRY_BACKOFF_MS
# define G_TM10_RETRY_BACKOFF_MS (2000UL)
#endif

#ifndef G_TM10_MIN_SYNC_INTERVAL_MS
# define G_TM10_MIN_SYNC_INTERVAL_MS (5UL * 60UL * 1000UL)
#endif

#ifndef G_TM10_MAX_SYNC_INTERVAL_MS
# define G_TM10_MAX_SYNC_INTERVAL_MS (24UL * 60UL * 60UL * 1000UL)
#endif

// ------------------------------------------------------
// TM10 Time Manager (선언 전용)
// ------------------------------------------------------
class CL_TM10_TimeManager {
  public:
    // 상태 (외부 조회용, inline static = C++17 자동 정의)
    inline static bool     s_timeValid       = false;
    inline static bool     s_wifiUp          = false;
    inline static uint32_t s_lastSyncMs      = 0;
    inline static uint32_t s_lastRequestMs   = 0;
    inline static uint8_t  s_activeServerIdx = 0;

  public:
    // --------------------------------------------------
    // 공개 API (구현은 .cpp)
    // --------------------------------------------------
    static void begin();
    static void onWiFiConnected(const ST_A20_SystemConfig_t& p_sys);
    static void onWiFiDisconnected();
    static void requestTimeSync();
    static void applyTimeConfig(const ST_A20_SystemConfig_t& p_sys);
    static void tick(const ST_A20_SystemConfig_t* p_sysOrNull);
    static void toJson(JsonDocument& p_doc);

    // 외부 조회 API
    static bool isTimeValid();
    static bool isTimeSyncedRecently(uint32_t p_windowMs = 0);
    static bool getLocalTime(struct tm& p_outTm);
    static void requestTimeSync(bool p_force);

  private:
#ifndef G_TM10_SYNC_RECENT_WINDOW_MS
# define G_TM10_SYNC_RECENT_WINDOW_MS (10UL * 60UL * 1000UL)
#endif

    // 내부 상태 (inline static)
    inline static bool s_timeSyncedRecently = false;
    inline static SemaphoreHandle_t s_mutex = nullptr;

    // 설정 캐시 (inline static)
    inline static char     s_tz[64]         = {0};
    inline static char     s_primary[64]    = {0};
    inline static uint32_t s_syncIntervalMs = (6UL * 60UL * 60UL * 1000UL);

    // fallback 서버 풀 (inline static)
    inline static const char* s_fallbackServers[3] = {
        "time.google.com",
        "time.cloudflare.com",
        "pool.ntp.org",
    };
    inline static char s_serverList[4][64] = {{0}};

    // 내부 상태 (inline static)
    inline static bool     s_running         = false;
    inline static bool     s_waitingCallback = false;
    inline static uint32_t s_waitStartMs     = 0;
    inline static uint32_t s_nextActionMs    = 0;

    // --------------------------------------------------
    // 내부 유틸 (구현은 .cpp)
    // --------------------------------------------------
    static void _setDefaults();
    static void _copySysTime(const ST_A20_SystemConfig_t& p_sys);
    static void _startSntpWithServer(uint8_t p_idx);
    static void _stopSntp();
    static bool _isTimeSane();
    static void _onSntpTimeSync(struct timeval* p_tv);
    static void _requestSync();
    static void _switchToNextServer();
    static void _updateSyncedRecently(uint32_t p_nowMs);
};

// ------------------------------------------------------
// 호환 전역 함수 (inline 유지, 각 TU 내부 링크)
// ------------------------------------------------------
static inline void TM10_applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_sys) {
    CL_TM10_TimeManager::applyTimeConfig(p_sys);
}

static inline void TM10_requestTimeSync(bool p_force = false) {
    CL_TM10_TimeManager::requestTimeSync(p_force);
}
