/*
 * ------------------------------------------------------
 * 소스명 : main.cpp
 * 프로젝트 : Smart Nature Wind
 * 모듈 약어 : (없음 - 엔트리포인트)
 * 모듈명 : Arduino Entry (setup / loop)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Serial 콘솔 초기화 + Native USB 동기화 대기 (ESP32-S3)
 *  - Logger 초기화 및 로그 레벨 설정
 *  - A00_init() 호출로 시스템 부팅 시퀀스 수행
 *  - A00_run() 을 loop() 에서 주기 호출 (메인 루프 위임)
 * ------------------------------------------------------
 * [A00 초기화 순서 요약]
 *   1) LittleFS mount
 *   2) Config(C10) + NVS(N10)
 *   3) LED (A30)
 *   4) Wi-Fi(WF10) + Time(TM10)
 *   5) PWM(P10) + Control(CT10) + Motion(M10)
 *   6) Web(W10) + CT10 WS Broker
 *   7) Watchdog (init 후 add)
 * ------------------------------------------------------
 * [API / WS 진입점]
 *  - REST     : /api/v001/*
 *  - WebSocket: /ws/{log|state|chart|metrics|summary}
 *  - Web UI   : /  →  /P010_main_071.html (reDirect)
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 본 파일은 엔트리포인트 역할만 수행 (비즈니스 로직 금지)
 *  - 실제 초기화/루프 구현은 A00_Main_071 로 위임
 *  - Logger 는 A00_init 이전에 초기화 (부팅 로그 확보 목적)
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <LittleFS.h>

#include "v017/A00_Main_071.h"


// ======================================================
// Arduino setup() — 부팅 시 1회 실행
// ======================================================
void setup() {

    // --------------------------------------------------
    // 1) Serial 콘솔 초기화
    // --------------------------------------------------
    Serial.begin(115200);
    delay(1500);

    // ESP32-S3 Native USB CDC: PC와 동기화될 때까지 대기
    //  - 이 블록이 없으면 초기 1~2초 로그가 유실됨
    while (!Serial) {
        delay(100);
    }

    Serial.println();
    Serial.println("=====================================");
    Serial.println(" Smart Nature Wind - Boot Sequence ");
    Serial.println("=====================================");

    delay(1000);

    // --------------------------------------------------
    // 2) Logger 초기화 + 로그 레벨 설정
    //  - Logger 는 A00_init() 이전에 준비 (부팅 로그 확보)
    //  - 운영 시 EN_L10_LOG_INFO / 디버깅 시 EN_L10_LOG_DEBUG
    // --------------------------------------------------
    CL_D10_Logger::begin(Serial);

    CL_D10_Logger::setLevel(EN_L10_LOG_DEBUG);
    // CL_D10_Logger::setLevel(EN_L10_LOG_INFO);

    delay(1000);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[BOOT] Logger ready");

    Serial.println("[BOOT] A00_init Start");

    // --------------------------------------------------
    // 3) 시스템 초기화 (FS / Config / NVS / WiFi / Time /
    //    PWM / Control / Motion / Web / WS / WDT)
    // --------------------------------------------------
    A00_init();

    // --------------------------------------------------
    // 4) 부팅 완료 안내 (콘솔)
    // --------------------------------------------------
    Serial.println();
    Serial.println("[BOOT] Initialization complete");
    Serial.println("Access endpoints:");
    Serial.println("   REST      : /api/v001/{version|state|system|motion|config|...}");
    Serial.println("   WebSocket : /ws/{log|state|chart|metrics|summary}");
    Serial.println("   Web UI    : /  (→ /P010_main_071.html)");
    Serial.println();
}


// ======================================================
// Arduino loop() — 무한 반복
//  - 실제 로직은 A00_run() 에 위임
//  - A00_run() 내부에서 WDT feed + delay(10) 수행
// ======================================================
void loop() {
    A00_run();
}
