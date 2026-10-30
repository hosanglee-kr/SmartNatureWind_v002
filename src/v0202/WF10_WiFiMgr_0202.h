#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : WF10_WiFiMgr_0202.h
 * 모듈약어 : WF10
 * 모듈명 : Smart Nature Wind Wi-Fi Manager + NTP Sync (v0202)
 * ------------------------------------------------------
 * 기능 요약:
 * - Wi-Fi AP/STA/AP+STA 모드 자동 연결 및 폴백 지원
 * - STA 우선 연결 / 실패 시 Soft AP 백업 모드 전환
 * - Disconnect 이벤트 기반 자동 복구 (delay 제거 및 횟수 제한 적용)
 * - DHCP 재할당 지연 대응 및 SoftAP 고정 IP 설정
 * - WiFiMulti 기반 다중 네트워크 연결 및 재시도 로직
 * - DNS 서버 확인 및 NTP 시간 주기 동기화 (TM10 위임)
 * - SoftAP DHCP 서버 활성/비활성 제어 옵션
 * - Wi-Fi 상태 및 스캔 JSON 출력
 * - 공유 자원 보호를 위한 Mutex 적용
 *
 * [Batch C-7] 재연결/백오프 상수 (class static)
 *  - G_WF10_RECONNECT_MAX / BACKOFF_INIT_MS / BACKOFF_MUL /
 *    BACKOFF_MAX_MS / MULTI_RUN_TIMEOUT_MS
 *
 * [Batch D-4] s_staConnected atomic 전환
 *  - isStaConnected() 10ms mutex 대기 → lock-free atomic load
 *  - A00_run(LED) 100Hz 폴링 시 loopTask 지터 제거
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>
#include <lwip/dns.h>
#include <time.h>
#include <atomic>   // [D-4] s_staConnected lock-free

#include "A20_Const_0202.h"
#include "C10_Config_0202.h"
#include "D10_Logger_0202.h"
#include "TM10_TimeMg_0202.h"

class CL_WF10_WiFiManager {
  public:
    // ======================================================
    // [D-4] s_staConnected atomic 전환
    //  - isStaConnected() 10ms mutex 대기 → lock-free atomic load
    //  - A00_run(LED) 100Hz 폴링 시 loopTask 지터 제거
    //  - 쓰기는 이벤트 콜백/startSTA에서 발생, 원자성 보장
    // ======================================================
    inline static std::atomic<bool> s_staConnected{false};
    static wl_status_t s_lastStaStatus;

    static uint8_t           s_reconnectAttempts;
    static SemaphoreHandle_t s_wifiMutex;

    // WF10이 WiFiMulti를 소유 (A00 전역 제거)
    inline static WiFiMulti s_wifiMulti;

    // ======================================================
    // [Batch C-7] 재연결/백오프 상수
    //  - 이벤트 콜백 람다에서도 접근 (static constexpr)
    // ======================================================
    static constexpr uint8_t  G_WF10_RECONNECT_MAX        = 5;
    static constexpr uint32_t G_WF10_BACKOFF_INIT_MS      = 500;
    static constexpr uint32_t G_WF10_BACKOFF_MUL          = 2;
    static constexpr uint32_t G_WF10_BACKOFF_MAX_MS       = 4000;
    static constexpr uint32_t G_WF10_MULTI_RUN_TIMEOUT_MS = 2000;

  public:
    // --------------------------------------------------
    // [WF10-task] 재연결 요청 상태
    // --------------------------------------------------
    typedef enum : uint8_t {
        EN_WF10_REQ_OK        = 0,
        EN_WF10_REQ_COALESCED = 1,
        EN_WF10_REQ_FAILED    = 2
    } EN_WF10_req_result_t;

    static bool applyConfig(const ST_A20_WifiConfig_t& p_cfg);
    static void attachWiFiEvents();

    static bool init(const ST_A20_WifiConfig_t&   p_cfg_wifi,
                     const ST_A20_SystemConfig_t& p_cfg_system,
                     uint8_t                      p_apChannel    = 1,
                     uint8_t                      p_staMaxTries  = 5,
                     bool                         p_enableApDhcp = true);

    static bool startAP(const ST_A20_WifiConfig_t& p_cfg_wifi, uint8_t p_channel, bool p_enableDhcp);
    static bool startSTA(const ST_A20_WifiConfig_t& p_cfg_wifi, uint8_t p_maxTries);

    static void syncTimeIfNeeded(const ST_A20_WifiConfig_t&   p_cfg_wifi,
                                 const ST_A20_SystemConfig_t& p_cfg_system,
                                 uint32_t                     p_interval_ms = 21600000);

    static void getWifiStateJson(JsonDocument& p_doc);
    static void scanNetworksToJson(JsonDocument& p_doc);

    // [D-4] lock-free isStaConnected
    static bool        isStaConnected();
    static const char* getStaStatusString();

    // --------------------------------------------------
    // [WF10-task] 재연결 요청
    // --------------------------------------------------
    static EN_WF10_req_result_t requestReconnect();

  private:
    static const char* _encTypeToString(wifi_auth_mode_t p_mode);

    // --------------------------------------------------
    // [WF10-task] WiFi 재연결 전용 태스크
    // --------------------------------------------------
    static TaskHandle_t      s_wifiTaskHandle;
    static SemaphoreHandle_t s_wifiRequestSem;
    static void              _wifiTask(void* p_param);
    static bool              _ensureWifiTask();
};
