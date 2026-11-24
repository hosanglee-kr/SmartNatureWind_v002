# `CT10_Ctl_Ctl_Mode_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_Ctl_Mode_0203.cpp

`CL_CT10_ControlManager`의 **사용자 프로필 모드 전환(`setProfileMode`)**, **특정 프로필 번호 시작(`startUserProfileByNo`)**, 및 **프로필 중지(`stopUserProfile`)**를 구현하는 모드 제어 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_CT10_ControlManager`** (`class`)
    *   **설명:** `useProfileMode` 플래그 및 `runCtx` 상태를 관리하는 제어 매니저 클래스입니다.
    *   **사용처:** 스케줄 모드 ↔ 사용자 프로필 모드 전환 시 `s_stateMutex` 보호 하에 상태를 갱신합니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`setProfileMode`** | `void` | 스케줄 모드(`false`)와 사용자 프로필 모드(`true`) 간 전환을 수행합니다. | 1. 모드 변경 시 기존 실행 컨텍스트를 정리하고 Dirty 플래그를 세웁니다. |
| **`startUserProfileByNo`** | `bool` | 지정 프로필 번호(`p_profileNo`)의 사용자 프로필을 즉시 시작합니다. | 1. 설정에서 해당 프로필을 찾아 세그먼트 0부터 실행하고 NVS에 기록합니다. |
| **`stopUserProfile`** | `void` | 현재 실행 중인 사용자 프로필을 중지하고 팬을 정지합니다. | 1. `applySegmentOff()`를 호출하고 상태를 `IDLE`/정지로 전이합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"N10_NvsManager_0203.h"`**:
    *   제어 매니저 상태 전이 및 NVS 마지막 프로필/모드 영구 저장에 사용됩니다.
