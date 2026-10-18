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
    // Watchdog feed
    esp_task_wdt_reset();

    // ======================================================
    // [F-05] Pending reload 처리 (loopTask 위임)
    //  - W10 routeReload는 async_tcp에서 flag만 세팅 → 여기서 실행
    //  - reloadAll은 C10 mutex + CT10 mutex + portMUX + 파일 I/O(100~500ms)
    //  - async_tcp 블로킹 회피 목적. fan은 reload 전 sim.stop 상태
    //  - 이 블록은 tickLoop 이전 (CT10 mutex 미보유) 에서 실행
    // ======================================================
    if (CL_CT10_ControlManager::consumePendingReload()) {
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[A00] Executing pending reload (loopTask)...");
        bool v_reloadOk = CL_CT10_ControlManager::reloadAll();
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[A00] Pending reload done (ok=%d)", (int)v_reloadOk);

        // 재로드된 system 설정을 런타임 반영 (Logger level, hostname)
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
    //  - 이전: 호출자 부재로 PIR 상태 영구 미갱신 (holdSec 만료 안 됨)
    //  - 이후: 매 loop tick → holdSec 초과 시 _pir.active=false 반영
    //  - isActive() 부팅 직후 false-positive (F-09) 도 자연 해소
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
    //  - 이전: 호출자 부재로 NVS 런타임 정보 영구 미저장
    //  - 이후: 매 loop 호출, N10::tick 내부에서 s_dirty + 10s 체크
    // ------------------------------------------------------
    CL_N10_NvsManager::tick();

    // ------------------------------------------------------
    // 4) LED 업데이트
    // ------------------------------------------------------
    bool v_wifiStatus = CL_WF10_WiFiManager::isStaConnected();

    if (g_A00_ledController) {
        g_A00_ledController->run(v_wifiStatus);
    }

    delay(10);
}
