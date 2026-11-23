# `CT10_Ctl_StMG_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_StMG_0203.cpp

`CL_CT10_ControlManager`의 **7-State `runCtx` FSM 상태 전이 엔진(`applyDecision`)**, **PIR/온습도 트리거 평가 및 히스테리시스**, **Auto-Off 래치 및 이벤트 홀드(`S_EVENT_HOLD_MS=3000ms`)**를 구현하는 상태 머신 관리 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_CT10_Decision_t`**
    *   **설명:** 다음 상태(`nextState`), 전이 사유(`reason`), 실행 소스(`nextRunSource`)를 담는 FSM 전이 결정 구조체입니다.
    *   **사용처:** `applyDecision()`에서 `runCtx` 상태를 단일 Writer 원칙으로 전이할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`applyDecision`** | `void` | 결정된 `ST_CT10_Decision_t`를 검증하고 `runCtx.state`, `reason`, `runSource`를 전이합니다. | 1. `v_stateChanged` / `v_sourceChanged` 발생 시 타임스탬프를 갱신하고 WS Dirty 플래그를 세웁니다. <br>2. 7-State FSM 불변 조건을 유지합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"A20_Const_0203.h"`**:
    *   `EN_CT10_STATE_*` 열거형 및 `runCtx` 구조체 정의에 사용됩니다.
