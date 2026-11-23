# `CT10_Ctl_Ctl_Ovr_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_Ctl_Ovr_0203.cpp

`CL_CT10_ControlManager`의 **수동 오버라이드(고정 풍속 `startOverrideFixed`, 프리셋 `startOverridePreset`, 직접 해석값 `applyManualResolved`, 중지 `stopOverride`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_SegmentOverride_t` / `ST_A20_ResolvedWind_t`**
    *   **설명:** 세그먼트 오버라이드 배수/절대값 및 `S20_WindSolver`가 해석한 최종 바람 파라미터 구조체입니다.
    *   **사용처:** `startOverridePreset()`, `applyManualResolved()`에서 오버라이드 풍속을 계산·적용할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`startOverrideFixed`** | `void` | 지정 고정 풍속(`p_percent`)으로 오버라이드를 시작합니다. | 1. `p_seconds == 0`이면 기본 `S_OVERRIDE_DEFAULT_SEC`(1200초)을 적용하고 `p_forever` 시 무제한 유지합니다. |
| **`startOverridePreset`** | `void` | 프리셋·스타일·오버라이드 조합으로 자연풍 오버라이드를 시작합니다. | 1. `S20_resolveWindParams()`로 파라미터를 해석한 뒤 시뮬레이션 엔진에 적용합니다. |
| **`applyManualResolved`** | `void` | 이미 해석된 `ST_A20_ResolvedWind_t`를 수동 오버라이드로 즉시 적용합니다. | 1. 대시보드 슬라이더 수동 튜닝 값을 즉시 반영하고 NVS에 기록합니다. |
| **`stopOverride`** | `void` | 활성 오버라이드를 중지하고 기존 스케줄/프로필 또는 대기 상태로 복귀합니다. | 1. 오버라이드 플래그를 해제하고 `CL_N10_NvsManager::clearOverride()`를 호출합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"S20_WindSolver_0203.h"` / `"N10_NvsManager_0203.h"`**:
    *   오버라이드 상태 관리, 바람 파라미터 해석 및 NVS 영구 저장에 사용됩니다.
