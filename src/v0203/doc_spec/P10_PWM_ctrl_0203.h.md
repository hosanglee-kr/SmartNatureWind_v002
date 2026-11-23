# `P10_PWM_ctrl_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: P10_PWM_ctrl_0203.h

PC 4핀 팬 표준 **25kHz 하드웨어 PWM(LEDC)** 출력을 제어하는 `CL_P10_PWM` 헤더입니다. Arduino-ESP32 v2(`ledcSetup`)와 v3(`ledcAttach`) API 호환을 모두 지원하며, 비선형 팬 커브 보정(`G_P10_CURVE_*`)을 통해 0~100% 풍속을 정밀 제어합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_P10_PwmState_t`** (`typedef struct`)
    *   **설명:** PWM 초기화 여부(`initialized`), 출력 활성(`enabled`), LEDC 채널(`channel`), 주파수(`freq`), 해상도(`resolutionBits`), 최대 듀티(`maxDuty`)를 보관하는 상태 구조체입니다.
    *   **사용처:** `CL_P10_PWM::_state` 멤버로 선언되어 `begin()`, `setDutyPercent()`, `getRawDuty()`에서 참조됩니다.
*   **`CL_P10_PWM`** (`class`)
    *   **설명:** 25kHz LEDC 타이머 설정, 3구간 커브 보정(`G_P10_CURVE_SPLIT1=0.33f`, `SPLIT2=0.66f`), 듀티 비율 변환 및 하드웨어 출력을 담당하는 클래스입니다.
    *   **사용처:** `A00_Main_0203.cpp`에서 초기화되며 `CT10_Ctl` 제어 루프가 매 틱마다 풍속(%)을 출력할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin`** | `void` | 시스템 설정(`ST_A20_SystemConfig_t`)을 바탕으로 25kHz LEDC PWM을 초기화합니다. | 1. ESP32 코어 버전에 따라 `ledcAttach` 또는 `ledcSetup`을 호출합니다. <br>2. 초기 듀티를 0으로 설정하고 `_state.initialized = true`로 마킹합니다. |
| **`setEnabled` / `isEnabled` / `isInitialized`** | `void` / `bool` | PWM 출력을 활성화/비활성화하거나 초기화 상태를 조회합니다. | 1. 비활성화 시 즉시 0 듀티를 출력해 팬을 정지시킵니다. |
| **`setDutyPercent`** | `void` | 목표 풍속(0~100%)을 커브 보정 후 LEDC raw 듀티로 변환해 출력합니다. | 1. `G_P10_CURVE_ZERO_THRESHOLD` 이하면 0을 출력합니다. <br>2. 3구간(`0.33`, `0.66`) 비선형 보정 후 `v_ratio * maxDuty + 0.5f`로 반올림해 `_setRawDuty()`를 호출합니다. |
| **`getRawDuty`** | `uint32_t` | 현재 LEDC 하드웨어에서 출력 중인 raw 듀티 값을 읽습니다. | 1. 초기화 상태일 때 `ledcRead` 결과를 반환합니다. |
| **`_setRawDuty`** | `void` | 계산된 `uint32_t` raw 듀티를 LEDC 레지스터에 직접 기록합니다. | 1. `ledcWrite`를 호출해 실제 PWM 핀 출력을 갱신합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>` / `<string.h>`**:
    *   ESP32 LEDC PWM API(`ledcAttach`/`ledcSetup`/`ledcWrite`/`ledcRead`) 및 메모리 유틸리티를 제공합니다.
*   **`"A20_Const_0203.h"`**:
    *   `ST_A20_SystemConfig_t` 내 팬 핀 번호, 최소/최대 듀티 제한치를 참조합니다.
*   **`"D10_Logger_0203.h"` / `"A40_Com_Utils_0203.h"`**:
    *   PWM 초기화 오류 로깅 및 `clampVal` 범위 보정에 사용됩니다.
