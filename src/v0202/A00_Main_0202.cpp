/*
 * ------------------------------------------------------
 * 소스명 : A00_Main_0202.cpp
 * 모듈 약어 : A00
 * 모듈명 : Smart Nature Wind Main Entrypoint (Implementation)
 * ------------------------------------------------------
 * 기능 요약:
 * - A00_init(): 시스템 부팅 시퀀스 (LittleFS → Config → NVS → WiFi
 *               → Time → PWM → Control → Motion → Web → WS → WDT)
 * - A00_run() : 메인 루프 (CT10 tick, WS tick, TM10 tick,
 *               pending free 처리, LED 상태 갱신)
 * - 전역 인스턴스 정의 (헤더 extern에 대응)
 * ------------------------------------------------------
 * [설계 원칙]
 * - 선언/정의 분리: A00_Main_0202.h (선언) ↔ A00_Main_0202.cpp (정의)
 *   → 다중 TU include 시 링크 안전
 * - g_A00_control (reference) → A00_getControl() 접근자
 *   → static init order fiasco 회피
 * ------------------------------------------------------
 * [Batch C] 매직넘버 상수화
 *  - esp_task_wdt_init(10) → A20_Const::G_A00_WDT_TIMEOUT_SEC
 *  - delay(10)            → A20_Const::G_A00_LOOP_DELAY_MS
 * ------------------------------------------------------
 * [Batch E] Dead Code 정리
 *  - <WiFiMulti.h> include 제거 (WF10 경유 transitive 포함)
 *  - commented factory reset 블록 제거
 *  - "=== Boot (v002) ===" → v0201 표기
 * ------------------------------------------------------
 */

#include "A00_Main_0202.h"

// ─────────────────────────────────────────────
// 구현에 필요한 추가 의존성
// ─────────────────────────────────────────────
#include <LittleFS.h>
#include <WiFi.h>
// [E-1] <WiFiMulti.h> 제거 (WF10_WiFiMgr_0202.h가 transitive 포함, A00 자체 사용 없음)
#include <esp_task_wdt.h>

#include "C10_Config_0202.h"
#include "D10_Logger_0202.h"
#include "M10_MotionLogic_0202.h"
#include "N10_NvsManager_0202.h"
#include "W10_Web_0202.h"
#include "WF10_WiFiMgr_0202.h"
#include "TM10_TimeMg_0202.h"
#include "A20_Const_Const_0202.h"   // [C] G_A00_WDT_TIMEOUT_SEC, G_A00_LOOP_DELAY_MS

// ======================================================
// 전역 변수 정의 (헤더 extern에 대응)
// ======================================================
CL_M10_MotionLogic* g_M10_motionLogic = nullptr;

AsyncWebServer g_A00_server(80);
CL_P10_PWM     g_P10_pwm;
CL_A30_LED*    g_A00_ledController = nullptr;

// ======================================================
// CT10 접근자
// ======================================================
CL_CT10_ControlManager& A00_getControl() {
    return CL_CT10_ControlManager::instance();
}

// ======================================================
// 메인 초기화 (A00_init)
// ======================================================
void A00_init() {
    CL_D10_Logger::log(EN_L10_LOG_INFO, "=== Smart Nature Wind Boot (v0202) ===");

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

    // NVS begin (Config 이후)
    CL_N10_NvsManager::begin();

    // ------------------------------------------------------
    // 3. 필수 섹션 null 방어
    //  - [E-2] commented factory reset 블록 제거
    //  - 정책: A00은 부팅 실패만 보고. factoryReset은 사용자 명시 호출
    //         (POST /api/v001/control/factoryReset 또는 /config/init)
    // ------------------------------------------------------
    if (!g_A20_config_root.system || !g_A20_config_root.wifi) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A00] Config root invalid (system or wifi is null).");
        return;
    }

    const ST_A20_WifiConfig_t&   v_wifi = *g_A20_config_root.wifi;
    const ST_A20_SystemConfig_t& v_sys  = g_A20_config_root.system ? *g_A20_config_root.system : ST_A20_SystemConfig_t{};

    // LED 객체 생성 (pin, numPixels 전달)
    static CL_A30_LED s_led(v_sys.hw.led.pin, v_sys.hw.led.numPixels);
    g_A00_ledController = &s_led;
    g_A00_ledController->begin(v_sys.hw.led.defaultBrightness);

    // ------------------------------------------------------
    // 4. Wi-Fi 초기화
    // ------------------------------------------------------
    bool v_wifiOk = CL_WF10_WiFiManager::init(v_wifi, v_sys);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] WiFi init result=%d", v_wifiOk ? 1 : 0);

    // ------------------------------------------------------
    // 5. Time Manager 초기화
    // ------------------------------------------------------
    CL_TM10_TimeManager::begin();

    // ------------------------------------------------------
    // 6. PWM + Control + Simulation
    // ------------------------------------------------------
    g_P10_pwm.P10_begin(*g_A20_config_root.system);

    CL_CT10_ControlManager::begin();

    // ------------------------------------------------------
    // 7. Motion Logic
    // ------------------------------------------------------
    CL_M10_MotionLogic::M10_begin();
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[M10] Motion Logic started");

    // CT10에 M10 주입
    A00_getControl().setMotion(g_M10_motionLogic);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] M10 wired to CT10 (ptr=%p)", (void*)g_M10_motionLogic);

    // ------------------------------------------------------
    // 8. Web API + Web UI
    // ------------------------------------------------------
    CL_W10_WebAPI::begin(g_A00_server, A00_getControl());
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
    // 10. Watchdog 초기화 (마지막 배치)
    //  - [C] esp_task_wdt_init(10) → A20_Const::G_A00_WDT_TIMEOUT_SEC
    // ------------------------------------------------------
    esp_task_wdt_init(A20_Const::G_A00_WDT_TIMEOUT_SEC, true);
    esp_task_wdt_add(NULL);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Init complete. Ready.");
}

// ======================================================
// 메인 루프 (A00_run)
// ======================================================
void A00_run() {
    // Watchdog feed
    esp_task_wdt_reset();

    // ======================================================
    // [F-05] Pending reload 처리 (loopTask 위임)
    // ======================================================
    if (CL_CT10_ControlManager::consumePendingReload()) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Executing pending reload (loopTask)...");
        bool v_reloadOk = CL_CT10_ControlManager::reloadAll();
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Pending reload done (ok=%d)", (int)v_reloadOk);

        if (v_reloadOk && g_A20_config_root.system) {
            CL_W10_WebAPI::applySystemRuntimeFromConfig(*g_A20_config_root.system);
        }
    }

    // ------------------------------------------------------
    // 1) Control tick
    // ------------------------------------------------------
    CL_CT10_ControlManager::tick();

    // ------------------------------------------------------
    // 2) CT10 WS 스케줄러 tick
    // ------------------------------------------------------
    CT10_WS_tick();

    // ------------------------------------------------------
    // [F-03] M10 tick (PIR holdSec 감쇠 + 상태 전이)
    // ------------------------------------------------------
    if (g_M10_motionLogic) {
        g_M10_motionLogic->tick();
    }

    // ------------------------------------------------------
    // 3) Time Manager tick
    // ------------------------------------------------------
    if (g_A20_config_root.system) {
        CL_TM10_TimeManager::tick(g_A20_config_root.system);
    } else {
        CL_TM10_TimeManager::tick(nullptr);
    }

    // ------------------------------------------------------
    // [E-1] pending free 처리 (reloadAll의 지연 free)
    // ------------------------------------------------------
    CL_C10_ConfigManager::processPendingFree();

    // ------------------------------------------------------
    // [F-04] N10 dirty flush (10s 주기, 내부 게이트)
    // ------------------------------------------------------
    CL_N10_NvsManager::tick();

    // ------------------------------------------------------
    // 4) LED 업데이트
    // ------------------------------------------------------
    bool v_wifiStatus = CL_WF10_WiFiManager::isStaConnected();

    if (g_A00_ledController) {
        g_A00_ledController->run(v_wifiStatus);
    }

    // [C] delay(10) → A20_Const::G_A00_LOOP_DELAY_MS
    delay(A20_Const::G_A00_LOOP_DELAY_MS);
}
