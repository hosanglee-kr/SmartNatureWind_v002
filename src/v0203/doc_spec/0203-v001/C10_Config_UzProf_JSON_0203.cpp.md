# `C10_Config_UzProf_JSON_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_UzProf_JSON_0203.cpp

`CL_C10_ConfigManager`의 **사용자 프로필(`ST_A20_UserProfilesRoot_t`) 및 트리거 규칙(`ST_A20_TriggerRule_t`) JSON 직렬화·패치**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_TriggerRule_t` / `ST_A20_UserProfilesRoot_t`**
    *   **설명:** 트리거 규칙 및 사용자 프로필 루트 구조체입니다.
    *   **사용처:** `C10_toJson_TriggerRule`, `toJson_UserProfiles`, `patchUserProfilesFromJson`에서 JSON 직렬화/역직렬화 대상으로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_toJson_TriggerRule`** | `void` | `ST_A20_TriggerRule_t`를 `JsonObject`로 직렬화합니다. | 1. 규칙 모드(`C10_ruleModeToString`)와 온습도·PIR 임계값을 기록합니다. |
| **`CL_C10_ConfigManager::toJson_UserProfiles`** | `void` | 전체 사용자 프로필 목록과 `steps[]` 배열을 `JsonDocument`로 직렬화합니다. | 1. ADR-2 단일 규격(`steps[]`, `repeatSegments`)에 맞춰 JSON을 생성합니다. |
| **`CL_C10_ConfigManager::patchUserProfilesFromJson`** | `bool` | JSON 패치(`p_patch`)를 파싱·검증해 `p_cfg`에 반영합니다. | 1. `G_C10_PROFILE_ID_START`/`STEP` 정책으로 ID를 정리하고 변경 시 `true`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_0203.h"` / `"C10_Config_UzProf_Internal_0203.h"`**:
    *   `CL_C10_ConfigManager` 및 `UzProf` 내부 헬퍼를 제공합니다.
*   **`"A22_Com_Lookup_0203.h"` / `"A40_Com_Utils_0203.h"`**:
    *   `A20_modeToString` 모드 문자열 변환 및 JSON 유틸리티에 사용됩니다.
