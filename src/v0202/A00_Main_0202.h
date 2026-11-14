#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : A00_Main_0202.h
 * 모듈 약어 : A00
 * 모듈명 : Smart Nature Wind Main Entrypoint (Interface)
 * ------------------------------------------------------
 * 기능 요약:
 * - 메인 엔트리포인트 인터페이스 (선언 전용)
 * - 구현부는 A00_Main_0202.cpp로 분리 (다중 TU 안전)
 * - 노출 범위:
 *    * 초기화/루프 함수 (A00_init / A00_run)
 *    * 전역 인스턴스 (extern 선언)
 *    * CT10 접근자 (A00_getControl)
 * ------------------------------------------------------
 * [설계 원칙]
 * - 선언/정의 분리 (extern + .cpp) → multiple definition 방지
 * - reference 타입 g_A00_control → A00_getControl() 접근자
 *   → static init order fiasco 회피
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
#include "A20_Const_0202.h"    // g_M10_motionLogic extern 선언
#include "CT10_Ctl_0202.h"     // CL_CT10_ControlManager (접근자 반환형)
#include "P10_PWM_ctrl_0202.h" // CL_P10_PWM
#include "A30_LED_0202.h"      // CL_A30_LED

// ======================================================
// 전역 인스턴스 (extern 선언)
//  - 실제 정의는 A00_Main_0202.cpp에서 단 한 번만 수행
//  - g_M10_motionLogic은 A20_Const_0202.h에 extern이 이미 존재
// ======================================================
extern AsyncWebServer g_A00_server;
extern CL_P10_PWM     g_P10_pwm;
extern CL_A30_LED*    g_A00_ledController;

// ======================================================
// CT10 접근자
//  - reference 변수는 extern 선언 불가 + static init order fiasco 회피
//  - 사용: A00_getControl().xxx()
// ======================================================
CL_CT10_ControlManager& A00_getControl();

// ======================================================
// 메인 엔트리포인트 (프로토타입)
//  - 구현은 A00_Main_0202.cpp
// ======================================================
void A00_init();
void A00_run();
