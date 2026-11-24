# `C10_Config_UzProf_CRUD_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_UzProf_CRUD_0203.cpp

`CL_C10_ConfigManager`의 **사용자 프로필(`UserProfiles`, ADR-2 `steps[]` 단일 규격) 추가·수정·삭제(CRUD)** API를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_UserProfilesRoot_t` / `ST_A20_UserProfileItem_t`**
    *   **설명:** 사용자 프로필 루트(`count`, `items[]`) 및 개별 프로필(`profileId`, `profileNo`, `steps[]`) 구조체입니다.
    *   **사용처:** `addUserProfilesFromJson`, `updateUserProfilesFromJson`, `deleteUserProfiles`에서 CRUD 조작 대상으로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_C10_ConfigManager::addUserProfilesFromJson`** | `int` | JSON에서 새 사용자 프로필을 추가하고 생성된 `profileId`를 반환합니다. | 1. `C10_nextProfileId_u8`로 신규 ID를 채번하고 `profileNo` 중복을 검사합니다. <br>2. `C10_fromJson_UserProfileItem` 파싱 후 `v_root.count` 위치에 저장합니다. |
| **`CL_C10_ConfigManager::updateUserProfilesFromJson`** | `bool` | 지정 `profileId`(`p_id`)의 기존 프로필을 부분 패치로 수정합니다. | 1. 기존 `profileId`(`v_keepId`)를 유지한 채 `profileNo` 중복 및 스텝 유효성을 검증합니다. |
| **`CL_C10_ConfigManager::deleteUserProfiles`** | `bool` | 지정 `profileId`(`p_id`)의 사용자 프로필을 삭제합니다. | 1. 대상 인덱스를 찾아 제거한 뒤 뒤쪽 항목을 당겨 `count`를 감소시킵니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_0203.h"` / `"C10_Config_UzProf_Internal_0203.h"`**:
    *   `CL_C10_ConfigManager` 선언 및 `UzProf` 내부 검증·채번 헬퍼를 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"A23_Com_ResetCfg_0203.h"`**:
    *   뮤텍스 가드 및 기본 프로필 초기화에 사용됩니다.
