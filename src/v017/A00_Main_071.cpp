/*
 * ------------------------------------------------------
 * 소스명 : A00_Main_071.cpp
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
 * [분리 이력 (Track 3-A)]
 * - A00_Main_070.h에서 이관:
 *    * g_M10_motionLogic / g_A00_server / g_P10_pwm /
 *      g_A00_ledController 전역 정의
 *    * g_A00_control (reference) → A00_getControl() 접근자
 *    * A00_init / A00_run 구현
 * - 효과: 헤더 다중 include 시 링크 안전
 * ------------------------------------------------------
 * [구현 규칙]
 * - 주석 구조, 네이밍 규칙, ArduinoJson v7 단일 문서 정책 준수
 * - 초기화 순서는 A00_init 내에서 의존성 순으로 유지
 * ------------------------------------------------------
 */

#include "A00_Main_071.h"

// ─────────────────────────────────────────────
// 구현에 필요한 추가 의존성
// ─────────────────────────────────────────────
#include <LittleFS.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <esp_task_wdt.h>

#include "C10_Config_070.h"
#include "D10_Logger_070.h"
#include "M10_MotionLogic_070.h"
#include "N10_NvsManager_070.h"
#include "W10_Web_070.h"
#include "WF10_WiFiMgr_070.h"
#include "TM10_TimeMg_070.h"

// ======================================================
// 전역 변수 정의 (헤더 extern에 대응)
// ======================================================
CL_M10_MotionLogic* g_M10_motionLogic = nullptr;

AsyncWebServer      g_A00_server(80);
CL_P10_PWM          g_P10_pwm;
CL_A30_LED*         g_A00_ledController = nullptr;

// ======================================================
// CT10 접근자
//  - 매 호출마다 싱글톤 인스턴스 반환 (내부 static 지역변수)
//  - g_A00_control 변수 대체
// ======================================================
CL_CT10_ControlManager& A00_getControl() {
    return CL_CT10_ControlManager::instance();
}

// ======================================================
// 메인 초기화 (A00_init)
// ======================================================
void A00_init() {
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

    // LED 객체 생성 (pin, numPixels 전달)
    //  - 함수-로컬 static: A00_init이 1회만 호출되므로 안전
    //  - g_A00_ledController는 수명 동안 이 객체를 가리킴
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
    //  - localtime() null 방어는 TM10 내부에서도 해야 하지만,
    //    여기서도 "시간 준비 전" 상태를 전제로 동작하도록 함
    //  - TM10::begin()은 멱등 가드(running/wifiUp) 보유
    //    → WF10 init 내부의 begin() 호출과 중복 안전
    // ------------------------------------------------------
    CL_TM10_TimeManager::begin();

    // ------------------------------------------------------
    // 6. PWM + Control + Simulation
    // ------------------------------------------------------
    g_P10_pwm.P10_begin(*g_A20_config_root.system);

    CL_CT10_ControlManager::begin();

    // ------------------------------------------------------
    // 7. Motion Logic
    //  - M10_begin() 내부에서 singleton/정적 관리
    //  - 전역 포인터(g_M10_motionLogic)는 M10_begin()에서 세팅됨
    // ------------------------------------------------------
    CL_M10_MotionLogic::M10_begin();
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[M10] Motion Logic started");

    // [A-1] CT10에 M10 주입 (누락 시 motion blocking 무력)
    //  - 접근자(A00_getControl) 로 참조 획득
    //  - CT10::begin() 이후에 호출 (begin에서 멤버 초기화 순서 고려)
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
    // 10. Watchdog 초기화
    //  - init 후 add(NULL) 순서 유지
    //  - 마지막 배치: 초기화 도중 블로킹(WiFi 재시도 등) 회피
    // ------------------------------------------------------
    esp_task_wdt_init(10, true);
    esp_task_wdt_add(NULL);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A00] Init complete. Ready.");
}

// ======================================================
// 메인 루프 (A00_run)
// ======================================================
void A00_run() {
    uint32_t v_now = millis();
    (void)v_now;   // [W-2] N10 flush 이연으로 현재 미사용 (TODO 블록 활성화 시 사용)

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

    // ------------------------------------------------------
    // [E-1] pending free 처리 (reloadAll의 지연 free)
    //  - 3초 grace 경과 후 실제 freeAll 실행
    //  - 매 loopTask 주기(≤10ms) 호출 → 3초 후 자연 정리
    // ------------------------------------------------------
    CL_C10_ConfigManager::processPendingFree();

    //// // NVS Dirty Flush (10초마다)
    //// if (v_now - v_lastFlush >= 10000) {
    ////     v_lastFlush = v_now;
    ////     CL_N10_NvsManager::flushIfNeeded();
    //// }

    // ------------------------------------------------------
    // 4) LED 업데이트
    // ------------------------------------------------------
    bool v_wifiStatus = CL_WF10_WiFiManager::isStaConnected();

    if (g_A00_ledController) {
        g_A00_ledController->run(v_wifiStatus);
    }

    delay(10);
}
