# `C10_Config_UzProf_Util_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_UzProf_Util_0203.cpp

`C10_Config_UzProf_Internal_0203.h`에 선언된 **TriggerRule JSON 파싱, 프로필 ID/NO 채번·중복 검사, `UserProfileItem` (`steps[]` 단일 규격) 디코딩, 세그먼트 ID 재발급 및 로드/저장 전 무결성 검증**을 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_TriggerRule_t` / `ST_A20_UserProfilesRoot_t` / `ST_A20_UserProfileItem_t`**
    *   **설명:** 트리거 규칙, 사용자 프로필 루트 및 개별 프로필 항목 구조체입니다.
    *   **사용처:** `C10_fromJson_TriggerRule`, `C10_fromJson_UserProfileItem`, `C10_validateUserProfiles*`의 입출력 매개변수로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_ruleModeToString` / `C10_fromJson_TriggerRule`** | `const char*` / `void` | 트리거 규칙 모드를 문자열로 변환하고 JSON에서 `ST_A20_TriggerRule_t`를 파싱합니다. | 1. Phase 2 `extern` 승격으로 `CT10_Ctl` 등 외부에서도 재사용됩니다. |
| **`C10_nextProfileId_u8` / `C10_isProfileIdDuplicated` / `C10_isProfileNoDuplicated`** | `uint8_t` / `bool` | 다음 프로필 ID를 채번하고 `profileId`/`profileNo` 중복을 검사합니다. | 1. `p_excludeIndex`를 제외하고 순회하며 중복 여부를 판정합니다. |
| **`C10_fromJson_UserProfileItem`** | `bool` | JSON에서 단일 사용자 프로필과 `steps[]` 배열(`PRESET`/`FIXED`/`REST`)을 디코딩합니다. | 1. `p_allowIdRead`, `p_forceProfileIdKeep`, `p_forceReissueSegId` 플래그로 ID 정책을 제어합니다. |
| **`C10_reissueProfileSegIdsAndValidateSegNos`** | `bool` | 프로필 내 세그먼트 ID를 재발급하고 `segNo` 중복/범위를 검증합니다. | 1. `G_C10_PROFILE_SEG_ID_START`/`STEP` 정책으로 ID를 순차 부여합니다. |
| **`C10_validateUserProfilesLoaded` / `C10_validateUserProfilesBeforeSave`** | `bool` | 로드 직후 및 저장 직전 전체 프로필 루트의 무결성을 검증합니다. | 1. ID/NO 중복, 스텝 수, 필수 필드 오류 시 `false`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_UzProf_Internal_0203.h"`**:
    *   내부 헬퍼 선언 및 ID/NO 정책 매크로를 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"A22_Com_Lookup_0203.h"` / `"A23_Com_ResetCfg_0203.h"`**:
    *   JSON 헬퍼, 모드 룩업 및 기본값 초기화에 사용됩니다.
