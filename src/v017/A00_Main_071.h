#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : A00_Main_071.h
 * 모듈 약어 : A00
 * 모듈명 : Smart Nature Wind Main Entrypoint (Interface)
 * ------------------------------------------------------
 * 기능 요약:
 * - 메인 엔트리포인트 인터페이스 (선언 전용)
 * - 구현부는 A00_Main_070.cpp로 분리 (다중 TU 안전)
 * - 노출 범위:
 *    * 초기화/루프 함수 (A00_init / A00_run)
 *    * 전역 인스턴스 (extern 선언)
 *    * CT10 접근자 (A00_getControl)
 * ------------------------------------------------------
 * [분리 이력 (Track 3-A)]
 * - 기존: A00_Main_070.h에 전역 정의 + 함수 구현 포함
 *   → 다중 TU include 시 'multiple definition' 링크 에러 위험
 * - 변경: 선언/정의 분리 (extern + .cpp)
 *   → g_M10_motionLogic / g_A00_server / g_P10_pwm /
 *      g_A00_ledController / A00_init / A00_run 모두 이관
 *   → reference 타입 g_A00_control은 접근자 함수로 대체
 * ------------------------------------------------------
 * [구현 규칙]
 * - 주석 구조, 네이밍 규칙, ArduinoJson v7 단일 문서 정책 준수
 * - 이 헤더는 "선언만" 포함 (인라인 구현 금지)
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ESPAsyncWebServer.h>

// ─────────────────────────────────────────────
// 타입 노출용 include (extern/prototype에 필요)
// ─────────────────────────────────────────────
#include "A20_Const_070.h"       // g_M10_motionLogic extern 선언
#include "CT10_Ctl_070.h"        // CL_CT10_ControlManager (접근자 반환형)
#include "P10_PWM_ctrl_070.h"    // CL_P10_PWM
#include "A30_LED_070.h"         // CL_A30_LED

// ======================================================
// 전역 인스턴스 (extern 선언)
//  - 실제 정의는 A00_Main_070.cpp에서 단 한 번만 수행
//  - g_M10_motionLogic은 A20_Const_070.h에 extern이 이미 존재
// ======================================================
extern AsyncWebServer      g_A00_server;
extern CL_P10_PWM          g_P10_pwm;
extern CL_A30_LED*         g_A00_ledController;

// ======================================================
// CT10 접근자
//  - 기존 g_A00_control (reference) 를 함수로 대체
//  - 사유: reference 변수는 extern 선언이 불가하고,
//          초기화 순서 문제(static init order fiasco) 위험
//  - 사용: A00_getControl().xxx() 형태로 호출
// ======================================================
CL_CT10_ControlManager& A00_getControl();

// ======================================================
// 메인 엔트리포인트 (프로토타입)
//  - 구현은 A00_Main_070.cpp
// ======================================================
void A00_init();
void A00_run();
