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
CL_M10_MotionLogic* 		g_M10_motionLogic = nullptr;

AsyncWebServer   			g_A00_server(80);
static WiFiMulti 			g_A00_wifiMulti;

CL_CT10_ControlManager& 	g_A00_control = CL_CT10_ControlManager::instance();
CL_P10_PWM              	g_P10_pwm;


CL_A30_LED 					g_A00_ledController;


// ------------------------------------------------------
// 메인 초기화
// ------------------------------------------------------
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
    const ST_A20_WifiConfig_t&   v_wifi = *g_A20_config_root.wifi;
    const ST_A20_SystemConfig_t& v_sys  = *g_A20_config_root.system;
    bool v_wifiOk = CL_WF10_WiFiManager::init(v_wifi, v_sys, g_A00_wifiMulti);

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
    CT10_WS_setBrokers(
        CL_W10_WebAPI::broadcastState,
        CL_W10_WebAPI::broadcastMetrics,
        CL_W10_WebAPI::broadcastChart,
        CL_W10_WebAPI::broadcastSummary,
        CL_W10_WebAPI::wsCleanupTick
    );
    CT10_WS_begin();

    // 8. Watchdog 초기화 (10초)
    esp_task_wdt_init(10, true);
    esp_task_wdt_add(NULL);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Init complete. Ready.");
}

// ------------------------------------------------------
// 메인 루프
// ------------------------------------------------------
void A00_run() {

    uint32_t v_now = millis();

    esp_task_wdt_reset(); // Watchdog feed

    CL_CT10_ControlManager::tick();

    // CT10 Dirty 플래그 기반 브로드캐스트 (책임 위임)
    CL_CT10_ControlManager& v_ctrl = g_A00_control;

	// ✅ CT10 WS 스케줄러가 dirty 기반으로 전송/스로틀/우선순위를 수행
    CT10_WS_tick();

    // --------------------------------------------------
	/*
    // NVS Dirty Flush (10초마다)
    if (v_now - v_lastFlush >= 10000) {
        v_lastFlush = v_now;
        CL_N10_NvsManager::flushIfNeeded();
    }
	*/

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
