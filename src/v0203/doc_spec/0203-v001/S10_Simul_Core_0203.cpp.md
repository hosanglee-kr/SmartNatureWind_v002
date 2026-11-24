# `S10_Simul_Core_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: S10_Simul_Core_0203.cpp

`CL_S10_Simulation`의 **생명주기(`begin`/`stop`/`resetDefaults`)**, **메인 물리 틱(`tick`)**, **해석된 바람 파라미터 적용(`applyResolvedWind`)** 및 **최종 PWM 팬 출력(`applyFan`)**을 구현하는 코어 실행 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_S10_Simulation`** (`class`)
    *   **설명:** `S10_Simul_0203.h`에 정의된 물리 시뮬레이션 엔진 클래스입니다.
    *   **사용처:** `begin()`으로 `CL_P10_PWM&`를 바인딩하고 `tick()`에서 매 프레임 풍속·차트 버퍼를 갱신합니다.
*   **`ST_A20_ResolvedWind_t`** (`struct`)
    *   **설명:** `S20_WindSolver`가 산출한 최종 바람 파라미터(`fanLimit`, `minFan`, 강도, 변동성, 돌풍) 구조체입니다.
    *   **사용처:** `applyResolvedWind()`의 입력 매개변수로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`S10_millis2EpochMs`** | `static uint64_t` | `millis()`를 SNTP 동기화 기준 Epoch ms(`uint64_t`)로 변환합니다. | 1. 최초 유효 시각(`s_baseSec`, `s_baseMs`)을 기준점으로 차분 계산합니다. <br>2. 시간 미동기화 시 `p_okOut = false`를 반환합니다. |
| **`begin` / `stop` / `resetDefaults`** | `void` | 시뮬레이션 엔진 초기화, 정지(0% 출력) 및 기본값 복원을 수행합니다. | 1. `_pwm = &p_pwm` 바인딩 후 기본 프리셋/위상을 초기화합니다. |
| **`tick`** | `void` | 최소 틱 간격(`G_S10_TICK_MIN_BASE_MS`)마다 물리 연산과 차트 로깅을 실행합니다. | 1. `v_dt` 경과 시간으로 난류·위상·돌풍·열기포를 갱신합니다. <br>2. `currentWindSpeed * G_S10_WIND_TO_PWM_SCALE + G_S10_WIND_TO_PWM_BIAS`로 PWM(%)을 산출해 `applyFan()`을 호출합니다. |
| **`applyResolvedWind`** | `void` | `ST_A20_ResolvedWind_t` 파라미터를 엔진 내부 상태에 반영합니다. | 1. `fanLimit`과 `minFan`을 `constrain(..., 0.0f, 100.0f)`로 클램프해 적용합니다. |
| **`applyFan`** | `void` | 계산된 풍속(%)을 `minFanPct`~`fanLimitPct` 범위로 제한해 `CL_P10_PWM`에 출력합니다. | 1. `G_S10_FAN_ZERO_THRESHOLD` 이하이면 0%로 강제 정지시킵니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"S10_Simul_0203.h"` / `"P10_PWM_ctrl_0203.h"`**:
    *   시뮬레이션 클래스 선언 및 25kHz PWM 출력 인터페이스에 사용됩니다.
*   **`"A20_Const_0203.h"` / `"A40_Com_Utils_0203.h"` / `"A22_Com_Lookup_0203.h"`**:
    *   상수, `clampVal` 보정 및 프리셋 룩업에 사용됩니다.
*   **`<time.h>`**:
    *   `S10_millis2EpochMs`의 `time()` 기준 Epoch 시각 변환에 사용됩니다.
