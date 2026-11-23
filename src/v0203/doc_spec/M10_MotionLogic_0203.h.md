# `M10_MotionLogic_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: M10_MotionLogic_0203.h

PIR 인체감지 센서 입력의 **디바운스(Debounce)**, **유지 시간(`holdSec`) 단일 판정(C-3)**, **재실/부재 상태 전이 콜백** 및 **`s_stateMutex` 기반 스레드 안전 상태 조회**를 담당하는 `CL_M10_MotionLogic` 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_M10_MotionLogic`** (`class`)
    *   **설명:** PIR 센서 핀 상태, 마지막 감지 시각(`_pir.lastDetected_ms`), 활성 상태(`_state`) 및 변경 콜백(`T_M10_OnChangeCallback_t`)을 캡슐화한 모션 로직 클래스입니다.
    *   **사용처:** `A00_Main_0203.cpp`의 전역 인스턴스 `g_M10_motionLogic` 및 `CT10_Ctl`의 인체감지 자동 제어에서 사용됩니다.
*   **`s_stateMutex`** (`inline static SemaphoreHandle_t`)
    *   **설명:** 모션 상태(`_state`, `_pir`)의 멀티태스크 동시 접근을 보호하는 FreeRTOS 뮤텍스입니다.
    *   **사용처:** `isActive()`, JSON 상태 직렬화(`toJson`) 등 외부 태스크에서 상태를 읽을 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`isActive`** | `bool` | 현재 인체감지 활성(재실) 여부를 반환합니다. | 1. `s_stateMutex` 보호 하에 현재 활성 상태를 안전하게 조회합니다. |
| **`setOnChangeCallback`** | `void` | 재실/부재 상태 변경 시 호출할 콜백을 등록합니다. | 1. `T_M10_OnChangeCallback_t` 함수 포인터를 저장해 상태 전이 시 알림을 전달합니다. |
| **`toJson`** | `void` | 현재 모션 상태, 마지막 변경 경과 시간(`v_lastSec`), PIR 잔여 유지 시간(`v_pirRemain`)을 `JsonDocument`에 기록합니다. | 1. `millis()` 기준으로 `lastChange_ms` 및 `lastDetected_ms` 경과 시간을 계산합니다. <br>2. 웹 대시보드/WS 상태 브로드캐스트용 JSON 필드를 채웁니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>` / `<ArduinoJson.h>`**:
    *   GPIO 디지털 입력, `millis()` 타이밍 및 JSON 상태 직렬화에 사용됩니다.
*   **`<freertos/FreeRTOS.h>` / `<freertos/semphr.h>`**:
    *   `s_stateMutex` 뮤텍스 생성 및 보호에 사용됩니다.
