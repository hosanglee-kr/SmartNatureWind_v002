#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : A00_Main_041.h
 * 모듈 약어 : A00
 * 모듈명 : Smart Nature Wind Main Entrypoint (v002)
 * ------------------------------------------------------
 * 기능 요약:
 * - OTA 제외 모든 보완 사항 적용 버전
 * - 모션센서, Watchdog, FactoryReset, LittleFS WebUI 포함
 * - Wi-Fi LED 상태표시 및 완전 초기화 지원
 * - [Refactored] CT10의 제어 상태 변경 시 브로드캐스트 책임을 위임받음
 * ------------------------------------------------------
 * [구현 규칙]
 * - 주석 구조, 네이밍 규칙, ArduinoJson v7 단일 문서 정책 준수
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <esp_task_wdt.h>

#include "A20_Const_044.h"
#include "C10_Config_042.h"
#include "CT10_Control_042.h"
#include "D10_Logger_040.h"
#include "M10_MotionLogic_040.h"
#include "N10_NvsManager_040.h"
#include "P10_PWM_ctrl_040.h"
#include "S10_Simul_041.h"
#include "S20_WindSolver_040.h"
#include "W10_Web_051.h"
#include "WF10_WiFiManager_043.h"
#include "TM10_TimeManager_003.h"

#include "A30_LED_041.h"

// [main.cpp] 또는 [MotionLogic.cpp] 파일에 추가
CL_M10_MotionLogic* 	g_M10_motionLogic = nullptr;

AsyncWebServer   		g_A00_server(80);
static WiFiMulti 		g_A00_wifiMulti;

CL_CT10_ControlManager& g_A00_control = CL_CT10_ControlManager::instance();
CL_P10_PWM              g_P10_pwm;

CL_A30_LED g_A00_ledController;

// ------------------------------------------------------
// 메인 초기화
// ------------------------------------------------------
void A00_init() {
    // ------------------------------------------------------
    // 0. LED 초기화
    // ------------------------------------------------------
    g_A00_ledController.begin();

    CL_D10_Logger::log(EN_L10_LOG_INFO, "=== Smart Nature Wind Boot (v002) ===");

    // ------------------------------------------------------
    // 1. LittleFS 마운트
    // ------------------------------------------------------
    if (!LittleFS.begin(true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[FS] LittleFS mount failed");
    } else {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[FS] LittleFS mounted OK");
    }

    // ------------------------------------------------------
    // 2. Config + NVS 초기화
    // ------------------------------------------------------
    if (!CL_C10_ConfigManager::begin()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A00] C10 begin failed. Abort init.");
        return;
    }

    bool v_cfgOk = CL_C10_ConfigManager::loadAll(g_A20_config_root);
    if (!v_cfgOk) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A00] C10 loadAll returned false (partial/default may be used).");
    }

    // NVS begin (Config 이후가 자연스러움)
    CL_N10_NvsManager::begin();

    // ------------------------------------------------------
    // 3. 필수 섹션 null 방어
    // ------------------------------------------------------
    if (!g_A20_config_root.system || !g_A20_config_root.wifi) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A00] Config root invalid (system or wifi is null).");

        // 선택: 여기서 factoryReset 시도 가능(정책에 따라)
        // CL_D10_Logger::log(EN_L10_LOG_WARN, "[A00] Trying factory reset due to invalid config.");
        // if (CL_C10_ConfigManager::factoryResetFromDefault()) {
        //     ESP.restart();
        // }
        return;
    }

    const ST_A20_WifiConfig_t&   v_wifi = *g_A20_config_root.wifi;
    const ST_A20_SystemConfig_t& v_sys  = *g_A20_config_root.system;

    // ------------------------------------------------------
    // 4. Wi-Fi 초기화
    // ------------------------------------------------------
    bool v_wifiOk = CL_WF10_WiFiManager::init(v_wifi, v_sys, g_A00_wifiMulti);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] WiFi init result=%d", v_wifiOk ? 1 : 0);

    // ------------------------------------------------------
    // 5. Time Manager 초기화
    //  - localtime() null 방어는 TM10 내부에서도 해야 하지만,
    //    여기서도 "시간 준비 전" 상태를 전제로 동작하도록 함
    // ------------------------------------------------------
    CL_TM10_TimeManager::begin();

    // ------------------------------------------------------
    // 6. PWM + Control + Simulation
    // ------------------------------------------------------
    g_P10_pwm.P10_begin(*g_A20_config_root.system);

    CL_CT10_ControlManager::begin();

    // ------------------------------------------------------
    // 7. Motion Logic
    //  - 전역 포인터(g_M10_motionLogic)는 여기서 직접 new 하지 않는 정책이면 nullptr 유지
    //  - M10_begin() 내부에서 singleton/정적 관리라면 OK
    // ------------------------------------------------------
    CL_M10_MotionLogic::M10_begin();
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[M10] Motion Logic started");

    // ------------------------------------------------------
    // 8. Web API + Web UI
    // ------------------------------------------------------
    CL_W10_WebAPI::begin(g_A00_server, g_A00_control, g_A00_wifiMulti);
    g_A00_server.begin();

    // ------------------------------------------------------
    // 9. CT10 WS Broker 주입 + Scheduler 시작
    // ------------------------------------------------------
    CT10_WS_setBrokers(CL_W10_WebAPI::broadcastState,
                       CL_W10_WebAPI::broadcastMetrics,
                       CL_W10_WebAPI::broadcastChart,
                       CL_W10_WebAPI::broadcastSummary,
                       CL_W10_WebAPI::wsCleanupTick);
    CT10_WS_begin();

    // ------------------------------------------------------
    // 10. Watchdog 초기화
    //  - init 후 add(NULL) 순서 유지
    // ------------------------------------------------------
    esp_task_wdt_init(10, true);
    esp_task_wdt_add(NULL);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Init complete. Ready.");
}

/*
void A00_init() {
    // LED 초기화
    g_A00_ledController.begin();

    CL_D10_Logger::log(EN_L10_LOG_INFO, "=== Smart Nature Wind Boot (v002) ===");

    // 2. LittleFS 마운트
    if (!LittleFS.begin(true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[FS] LittleFS mount failed");
    } else {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[FS] LittleFS mounted OK");
    }

    // 3. Config + NVS 초기화
	CL_C10_ConfigManager::begin();
    CL_C10_ConfigManager::loadAll(g_A20_config_root);
    CL_N10_NvsManager::begin();

    if (!g_A20_config_root.system || !g_A20_config_root.wifi) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A00] Config root invalid (system or wifi is null).");
        // 필요에 따라 FactoryReset 시도 or 안전 모드 진입
        // CL_D10_Logger::log(EN_L10_LOG_WARN, "[A00] Trying factory reset due to invalid config.");
        // CL_C10_ConfigManager::factoryResetFromDefault();
        // ESP.restart();
        return; // 일단 초기화 중단
    }

    // 4. Wi-Fi 초기화
    const ST_A20_WifiConfig_t&   v_wifi   = *g_A20_config_root.wifi;
    const ST_A20_SystemConfig_t& v_sys    = *g_A20_config_root.system;
    bool                         v_wifiOk = CL_WF10_WiFiManager::init(v_wifi, v_sys, g_A00_wifiMulti);

    CL_TM10_TimeManager::begin();

    // 5. PWM + Control + Simulation
    g_P10_pwm.P10_begin(*g_A20_config_root.system);

    CL_CT10_ControlManager::begin();

    // 6. Motion Logic (PIR/BLE 감지 활성)
    CL_M10_MotionLogic::M10_begin();
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[M10] Motion Logic started");

    // 7. Web API + Web UI
    CL_W10_WebAPI::begin(g_A00_server, g_A00_control, g_A00_wifiMulti);

    g_A00_server.begin();

    // ✅ 7.5 CT10 WS Broker 주입 + Scheduler 시작
    // - 이제 CT10_WS_bindToW10()는 완전히 제거해도 됨
    CT10_WS_setBrokers(CL_W10_WebAPI::broadcastState,
                       CL_W10_WebAPI::broadcastMetrics,
                       CL_W10_WebAPI::broadcastChart,
                       CL_W10_WebAPI::broadcastSummary,
                       CL_W10_WebAPI::wsCleanupTick);
    CT10_WS_begin();

    // 8. Watchdog 초기화 (10초)
    esp_task_wdt_init(10, true);
    esp_task_wdt_add(NULL);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Init complete. Ready.");
}
*/

// ------------------------------------------------------
// 메인 루프
// ------------------------------------------------------
void A00_run() {
    uint32_t v_now = millis();

    // Watchdog feed
    esp_task_wdt_reset();

    // ------------------------------------------------------
    // 1) Control tick
    // ------------------------------------------------------
    CL_CT10_ControlManager::tick();

    // ------------------------------------------------------
    // 2) CT10 WS 스케줄러 tick
    // ------------------------------------------------------
    CT10_WS_tick();

    // ------------------------------------------------------
    // 3) Time Manager tick
    //  - localtime() null 방어는 TM10 내부에서도 필수
    //  - system nullptr 방어 유지
    // ------------------------------------------------------
    if (g_A20_config_root.system) {
        CL_TM10_TimeManager::tick(g_A20_config_root.system);
    } else {
        CL_TM10_TimeManager::tick(nullptr);
    }

	 //// // NVS Dirty Flush (10초마다)
   //// if (v_now - v_lastFlush >= 10000) {
   ////     v_lastFlush = v_now;
   ////     CL_N10_NvsManager::flushIfNeeded();
   //// }

    // ------------------------------------------------------
    // 4) LED 업데이트
    // ------------------------------------------------------
    bool v_wifiStatus = CL_WF10_WiFiManager::isStaConnected();
    g_A00_ledController.run(v_wifiStatus);

    delay(10);
}


/*
void A00_run() {
    uint32_t v_now = millis();

    esp_task_wdt_reset(); // Watchdog feed

    CL_CT10_ControlManager::tick();

    // CT10 Dirty 플래그 기반 브로드캐스트 (책임 위임)
    CL_CT10_ControlManager& v_ctrl = g_A00_control;

    // ✅ CT10 WS 스케줄러가 dirty 기반으로 전송/스로틀/우선순위를 수행
    CT10_WS_tick();

    // --------------------------------------------------
    


    // TM10 시간 상태 감시/서버 fallback 처리(블로킹X)
    if (g_A20_config_root.system) {
        CL_TM10_TimeManager::tick(g_A20_config_root.system);
    } else {
        CL_TM10_TimeManager::tick(nullptr);
    }

    // 2. LED 업데이트
    bool v_wifiStatus = CL_WF10_WiFiManager::isStaConnected();
    g_A00_ledController.run(v_wifiStatus);

    delay(10);
}


*/
