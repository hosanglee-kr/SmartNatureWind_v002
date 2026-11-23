# `CT10_Ctl_Ctl_Seg_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_Ctl_Seg_0203.cpp

`CL_CT10_ControlManager`의 **오버라이드/사용자 프로필/스케줄 틱(`tickOverride`, `tickUserProfile`, `tickSchedule`)**, **세그먼트 시퀀스 진행(`tickSegmentSequence`)**, 및 **세그먼트 ON/OFF 적용(`applySegmentOn`, `applySegmentOff`)**을 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_ScheduleSegment_t` / `ST_A20_UserProfileSegment_t`**
    *   **설명:** 스케줄 및 사용자 프로필의 개별 스텝(`onMinutes`, `offMinutes`, 프리셋/고정/휴지) 구조체입니다.
    *   **사용처:** `tickSegmentSequence()`, `applySegmentOn()`에서 스텝 전환 및 풍속 적용에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`tickOverride` / `tickUserProfile` / `tickSchedule`** | `bool` | 각 실행 모드(오버라이드/프로필/스케줄)의 시간 만료 및 세그먼트 전환을 평가합니다. | 1. 만료 시 다음 세그먼트로 전이하거나 종료 처리를 수행합니다. |
| **`tickSegmentSequence`** | `bool` | `onMinutes`/`offMinutes` 타이머와 `p_repeat`/`p_repeatCount`에 따라 8스텝 시퀀스를 순환합니다. | 1. 스케줄 세그먼트용과 사용자 프로필 세그먼트용 오버로드 2종을 제공합니다. |
| **`applySegmentOn` / `applySegmentOff`** | `void` | 세그먼트 시작 시 `S20_resolveWindParams`로 바람을 적용하고, 종료 시 팬을 정지합니다. | 1. `updateRunCtxOnSegmentOn_*` / `Off`를 호출해 `runCtx` 스냅샷을 동기화합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"S20_WindSolver_0203.h"`**:
    *   `runCtx` 상태 갱신 및 세그먼트별 프리셋·스타일 해석에 사용됩니다.
