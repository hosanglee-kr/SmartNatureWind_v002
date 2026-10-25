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
 * [Batch E] 매직넘버 상수화 (E-10)
 *  - delay(1500) → A20_Const::G_A00_SERIAL_INIT_DELAY_MS
 *  - delay(100)  → A20_Const::G_A00_USB_CDC_POLL_MS
 * ------------------------------------------------------
 * [Batch F] Logger 초기 레벨 정책 (F-4)
 *  - DEBUG → INFO (config 로드 후 applySystemRuntimeFromConfig가 오버라이드)
 * ------------------------------------------------------
 * [API / WS 진입점]
 *  - REST     : /api/v001/*
 *  - WebSocket: /ws/{log|state|chart|metrics|summary}
 *  - Web UI   : /  →  /P010_main_0202.html (reDirect)
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 본 파일은 엔트리포인트 역할만 수행 (비즈니스 로직 금지)
 *  - 실제 초기화/루프 구현은 A00_Main_0202 로 위임
 *  - Logger 는 A00_init 이전에 초기화 (부팅 로그 확보 목적)
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <LittleFS.h>

#include "v0202/A00_Main_0202.h"
#include "v0202/A20_Const_Const_0202.h"   // [E-10] 부트 지연 상수

// ======================================================
// Arduino setup() — 부팅 시 1회 실행
// ======================================================
void setup() {
    // --------------------------------------------------
    // 1) Serial 콘솔 초기화
    // --------------------------------------------------
    Serial.begin(115200);
    delay(A20_Const::G_A00_SERIAL_INIT_DELAY_MS);

    // ESP32-S3 Native USB CDC: PC와 동기화 대기 (타임아웃 적용)
    // - 스탠드얼론 배포(USB 미연결) 시 setup() 무한 정지 방지
    // - 3초 내 미연결이면 부팅 계속 진행
    {
        uint32_t v_waitStartMs = millis();
        while (!Serial && (millis() - v_waitStartMs < A20_Const::G_A00_USB_CDC_TIMEOUT_MS)) {
            delay(A20_Const::G_A00_USB_CDC_POLL_MS);
        }
    }


    Serial.println();
    Serial.println("=====================================");
    Serial.println(" Smart Nature Wind - Boot Sequence ");
    Serial.println("=====================================");

    delay(1000);

    // --------------------------------------------------
    // 2) Logger 초기화 + 로그 레벨 설정
    //  - [F-4] 초기 레벨은 안전값 INFO.
    //    system.logging.level config 로드 후
    //    W10::applySystemRuntimeFromConfig가 자동 재설정.
    //  - 개발 디버깅 시 EN_L10_LOG_DEBUG로 임시 변경 후 사용.
    // --------------------------------------------------
    CL_D10_Logger::begin(Serial);
    CL_D10_Logger::setLevel(EN_L10_LOG_INFO);

    delay(1000);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[BOOT] Logger ready");

    Serial.println("[BOOT] A00_init Start");

    // --------------------------------------------------
    // 3) 시스템 초기화 (FS / Config / NVS / WiFi / Time /
    //    PWM / Control / Motion / Web / WS / WDT)
    // --------------------------------------------------
    A00_init();

    // --------------------------------------------------
    // 4) 부팅 완료 안내
    // --------------------------------------------------
    Serial.println();
    Serial.println("[BOOT] Initialization complete");
    Serial.println("Access endpoints:");
    Serial.println("   REST      : /api/v001/{version|state|system|motion|config|...}");
    Serial.println("   WebSocket : /ws/{log|state|chart|metrics|summary}");
    Serial.println("   Web UI    : /  (→ /P010_main_0202.html)");
    Serial.println();
}

// ======================================================
// Arduino loop() — 무한 반복
//  - 실제 로직은 A00_run() 에 위임
//  - A00_run() 내부에서 WDT feed + delay 수행
// ======================================================
void loop() {
    A00_run();
}
