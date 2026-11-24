# `S10_Simul_Const_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: S10_Simul_Const_0203.h

`CL_S10_Simulation` 물리 엔진에서 사용하는 **틱/차트 타이밍, 기류 위상(Calm/Norm/Strong) 지속시간, von Kármán 난류 스펙트럼 계수, 열기포/모멘텀/풍속-PWM 변환 상수**를 정의하는 상수 전용 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **틱·평가·차트 타이밍 상수** (`G_S10_TICK_*`, `G_S10_GUST_EVAL_MIN_MS`, `G_S10_THERM_EVAL_MIN_MS`, `G_S10_CHART_*`)
    *   **설명:** 최소 틱(40ms+지터60ms), 돌풍(500ms)/열기포(700ms) 평가 주기, 차트 샘플링(1Hz/2Hz) 및 전체 동기화(10s) 주기 상수입니다.
    *   **사용처:** `S10_Simul_Core_0203.cpp` 및 `S10_Simul_IO_0203.cpp`의 타이머 게이트에 사용됩니다.
*   **위상·열기포 지속시간 상수** (`G_S10_PHASE_*_DUR_*`, `G_S10_THERM_DUR_*`)
    *   **설명:** Calm(90~210s), Norm(120~300s), Strong(60~150s) 위상 지속시간 및 열기포 지속시간(8~14s) 상수입니다.
    *   **사용처:** `S10_Simul_Physic_0203.cpp`의 `updatePhase()`, `calcThermalEnvelope()`에 사용됩니다.
*   **von Kármán 난류 및 물리 변환 상수** (`G_S10_TURB_BAND_COUNT=12`, `G_S10_VON_KARMAN_COEF=70.8f`, `G_S10_WIND_TO_PWM_*`, `G_S10_MOMENTUM_*`, `G_S10_WCR_*`)
    *   **설명:** 12밴드 난류 스펙트럼 계수, 풍속(0.2~11.0 m/s)→PWM 변환(`10.0f * v + 10.0f`), 모멘텀 감쇠(`0.85f`) 및 WCR 클램프 상수입니다.
    *   **사용처:** `S10_Simul_Physic_0203.cpp`의 `calcTurb()`, `generateTarget()`, `applyFan()`에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| *(상수 전용 헤더)* | - | 별도 함수 선언 없이 `static const` / `static constexpr` 물리 상수만 제공합니다. | 1. 컴파일 타임 상수 인라인 치환으로 RAM 점유 없이 물리 연산 계수를 공유합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>`**:
    *   `uint32_t` 등 고정 폭 정수형 타입 정의에 사용됩니다.
