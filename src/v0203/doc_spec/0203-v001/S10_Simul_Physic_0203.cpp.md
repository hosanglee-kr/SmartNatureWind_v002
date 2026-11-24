# `S10_Simul_Physic_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: S10_Simul_Physic_0203.cpp

`CL_S10_Simulation`의 **대기역학 물리 수치 연산**을 구현하는 파일로, 프리셋 적용(`applyPresetCore`), 기류 위상 전이(`initPhaseFromBase`/`updatePhase`), **12밴드 von Kármán 난류 스펙트럼(`calcTurb`)**, **열기포 포락선(`calcThermalEnvelope`/`updateThermal`)**, **확률적 돌풍(`updateGust`)**, **목표 풍속 생성(`generateTarget`)**을 수행합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_S10_Simulation`** (`class`)
    *   **설명:** 기저 풍속(`baseMinWind`~`baseMaxWind`), 위상 범위(`phaseMinWind`~`phaseMaxWind`), 난류·열기포·돌풍 상태 변수를 보유한 물리 엔진 클래스입니다.
    *   **사용처:** `S10_Simul_Core_0203.cpp`의 `tick()`에서 매 프레임 호출됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`S10_probFromRatePerSec`** | `static inline float` | 초당 발생률(`p_ratePerSec`)과 시간 간격(`p_dtSec`)으로 이벤트 발생 확률을 계산합니다. | 1. 포아송 근사(`1 - exp(-rate * dt)`)로 프레임 레이트 독립적 확률을 산출합니다. |
| **`applyPresetCore`** | `void` | 프리셋 코드를 조회해 기저 풍속과 물리 파라미터를 초기화합니다. | 1. `A22_Com_Lookup_0203.h`로 프리셋을 찾고 `initPhaseFromBase()`를 호출합니다. |
| **`initPhaseFromBase` / `updatePhase`** | `void` | 기저 풍속 스팬(`baseMaxWind - baseMinWind`)을 바탕으로 Calm/Norm/Strong 위상을 전이합니다. | 1. 각 위상별 지속시간(`90~300s`) 만료 시 다음 위상과 목표 풍속 범위를 재설정합니다. |
| **`calcTurb`** | `void` | 12밴드 von Kármán 난류 스펙트럼을 합성해 순간 난류 변동(`p_dt` 기반)을 계산합니다. | 1. `G_S10_TURB_BAND_COUNT=12` 주파수 대역의 위상·진폭을 합산합니다. |
| **`calcThermalEnvelope` / `updateThermal`** | `void` | 열기포 상승 기류의 지속시간(`8~14s`) 및 포락선 곡선을 연산합니다. | 1. `G_S10_THERM_EVAL_MIN_MS`(700ms) 간격으로 열기포 발생 여부를 평가합니다. |
| **`updateGust`** | `void` | `G_S10_GUST_EVAL_MIN_MS`(500ms) 간격으로 돌풍(Gust) 발생·감쇠를 갱신합니다. | 1. `S10_probFromRatePerSec()` 확률 판정으로 돌풍을 트리거합니다. |
| **`generateTarget`** | `void` | 현재 위상 범위(`phaseMinWind`~`phaseMaxWind`) 내에서 새로운 목표 풍속을 생성합니다. | 1. 난수 편향(`v_bias`)과 중간값(`v_mid`)을 조합해 자연스러운 목표치를 만듭니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"S10_Simul_0203.h"` / `"A20_Const_0203.h"` / `"A40_Com_Utils_0203.h"`**:
    *   물리 상수(`S10_Simul_Const_0203.h`), 난수 생성(`getRandom01`, `getRandomRange`) 및 로깅에 사용됩니다.
