# `CT10_Ctl_Comfort_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_Comfort_0203.cpp

일본 기상청 표준 **불쾌지수(DI: Discomfort Index) 산출**, **4단계 쾌적도 판정(`getComfortLevel`)**, **최적 프리셋/스타일/프로필 추천**, 및 **5분 주기 Auto-Comfort 자동 제어(`tickAutoComfort`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_CT10_ControlManager`** (`class`)
    *   **설명:** `s_autoComfortEnabled`, `s_autoComfortLastEvalMs`, `AUTO_COMFORT_INTERVAL_MS(300,000ms)` 정적 상태를 관리합니다.
    *   **사용처:** `setAutoComfort()`, `tickAutoComfort()`에서 5분마다 DI를 재평가해 바람을 자동 전환할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`getDiscomfortIndex`** | `float` | 현재 온·습도(`getCurrentTemperatureMock`, `getCurrentHumidityMock`)로 DI를 계산합니다. | 1. 공식 `0.81*T + 0.01*H*(0.99*T - 14.3) + 46.3`을 적용합니다. |
| **`getComfortLevel`** | `uint8_t` | 산출된 DI 값에 따라 4단계 쾌적도 레벨(0~3)을 판정합니다. | 1. 구간별 임계값으로 쾌적/보통/불쾌/매우불쾌를 구분합니다. |
| **`getRecommendedPresetCode` / `getRecommendedStyleCode` / `getRecommendedProfileId`** | `const char*` / `uint8_t` | 현재 DI 단계에 가장 적합한 프리셋·스타일·사용자 프로필 ID를 추천합니다. | 1. `getDiscomfortIndex()` 결과에 따라 최적 조합을 매핑합니다. |
| **`setAutoComfort` / `isAutoComfortEnabled` / `getAutoComfortRemainSec`** | `void` / `bool` / `uint32_t` | Auto-Comfort 모드를 켜고 끄며 다음 평가까지 남은 초를 반환합니다. | 1. NVS(`CL_N10_NvsManager::setAutoComfort`)에 상태를 영구 저장합니다. |
| **`tickAutoComfort`** | `void` | 5분(`300초`) 주기로 DI를 재평가해 추천 프리셋/스타일을 자동 적용합니다. | 1. `s_autoComfortEnabled`가 참일 때만 동작하며 변경 시 이벤트를 기록합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"N10_NvsManager_0203.h"`**:
    *   제어 매니저 상태 및 Auto-Comfort NVS 영구 저장에 사용됩니다.
*   **`"A20_Const_0203.h"` / `"A40_Com_Utils_0203.h"` / `"D10_Logger_0203.h"`**:
    *   DI 임계 상수 및 로깅에 사용됩니다.
