# `C10_Config_UzProf_Internal_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_UzProf_Internal_0203.h

`C10_Config_UzProf_0203.cpp`를 4개 파일로 분할(Batch E-2.6)하면서 내부 헬퍼 함수와 ID/NO 정책 매크로를 공유하기 위한 **내부 전용 헤더**입니다. (외부 모듈은 이 헤더를 직접 include하지 않고 `C10_Config_0203.h`만 사용합니다.)

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`G_C10_PROFILE_ID_START` / `G_C10_PROFILE_ID_STEP`** (`1` / `1`)
    *   **설명:** 사용자 프로필(`UserProfile`) ID 자동 채번 시작값 및 증가폭 정책 매크로입니다.
    *   **사용처:** `C10_nextProfileId_u8` 등 프로필 ID 생성·검증 로직에서 사용됩니다.
*   **`G_C10_PROFILE_SEG_ID_START` / `G_C10_PROFILE_SEG_ID_STEP`** (`1` / `1`)
    *   **설명:** 프로필 내 세그먼트(`segId`) 자동 재발급 시작값 및 증가폭 정책 매크로입니다.
    *   **사용처:** `C10_reissueProfileSegIdsAndValidateSegNos`에서 세그먼트 ID 일괄 재발급 시 사용됩니다.
*   **`ST_A20_TriggerRule_t` / `EN_A20_ruleMode_t`**
    *   **설명:** 온습도·PIR 등 트리거 규칙 구조체 및 규칙 모드 열거형입니다.
    *   **사용처:** `C10_fromJson_TriggerRule`, `C10_toJson_TriggerRule`, `C10_parseRuleMode`, `C10_ruleModeToString`의 입출력 매개변수로 사용됩니다.
*   **`ST_A20_UserProfilesRoot_t` / `ST_A20_UserProfileItem_t`**
    *   **설명:** 전체 사용자 프로필 루트 및 개별 프로필 항목 구조체입니다.
    *   **사용처:** 프로필 ID/NO 중복 검사, JSON 디코딩, 로드/저장 전 무결성 검증 함수의 매개변수로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_fromJson_TriggerRule`** | `void` | JSON 객체에서 트리거 규칙(`ST_A20_TriggerRule_t`)을 파싱합니다. | 1. Phase 2에서 `extern`으로 승격되어 `CT10_Ctl_Ctl_0203.cpp` 등 외부에서도 재사용됩니다. <br>2. `p_caller`를 전달받아 파싱 오류 시 호출자 태그와 함께 로깅합니다. |
| **`C10_toJson_TriggerRule`** | `void` | `ST_A20_TriggerRule_t` 구조체를 JSON 객체로 직렬화합니다. | 1. `C10_ruleModeToString` 등을 활용해 규칙 필드를 `JsonObject`에 기록합니다. |
| **`C10_parseRuleMode`** | `EN_A20_ruleMode_t` | 문자열을 `EN_A20_ruleMode_t` 열거형으로 변환합니다. | 1. 트리거 규칙 JSON 파싱 시 모드 문자열 매핑에 사용됩니다. |
| **`C10_ruleModeToString`** | `const char*` | `EN_A20_ruleMode_t` 열거형을 문자열로 변환합니다. | 1. 트리거 규칙 JSON 직렬화 시 사용됩니다. |
| **`C10_nextProfileId_u8`** | `uint8_t` | 다음 사용 가능한 프로필 ID를 계산합니다. | 1. `p_root` 내 기존 프로필의 최대 ID를 탐색합니다. <br>2. `G_C10_PROFILE_ID_START` 및 `G_C10_PROFILE_ID_STEP` 정책에 따라 다음 ID를 반환합니다. |
| **`C10_isProfileIdDuplicated`** | `bool` | 프로필 ID 중복 여부를 검사합니다. | 1. `p_excludeIndex`를 제외한 나머지 프로필들과 `p_id` 일치 여부를 확인합니다. |
| **`C10_isProfileNoDuplicated`** | `bool` | 프로필 번호(`no`) 중복 여부를 검사합니다. | 1. `p_excludeIndex`를 제외한 나머지 프로필들과 `p_no` 일치 여부를 확인합니다. |
| **`C10_fromJson_UserProfileItem`** | `bool` | JSON 객체에서 단일 사용자 프로필을 디코딩합니다. | 1. `p_allowIdRead`, `p_forceProfileIdKeep`, `p_forceReissueSegId` 플래그로 ID 유지/재발급 정책을 제어합니다. <br>2. 실패 시 `p_callerForLog`를 포함해 에러를 기록하고 `false`를 반환합니다. |
| **`C10_reissueProfileSegIdsAndValidateSegNos`** | `bool` | 프로필 내 세그먼트 ID를 재발급하고 세그먼트 번호(`segNo`)를 검증합니다. | 1. `G_C10_PROFILE_SEG_ID_START`/`STEP` 기준으로 세그먼트 ID를 순차 재발급합니다. <br>2. 번호 중복 또는 범위 오류 시 `false`를 반환합니다. |
| **`C10_validateUserProfilesLoaded`** | `bool` | 파일에서 로드된 사용자 프로필 루트의 무결성을 검증합니다. | 1. 로드 직후 ID/NO 중복, 필수 필드 및 세그먼트 유효성을 일괄 점검합니다. |
| **`C10_validateUserProfilesBeforeSave`** | `bool` | 저장 직전 사용자 프로필 설정의 유효성을 검증합니다. | 1. 잘못된 설정이 LittleFS에 기록되지 않도록 사전 차단합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>`**:
    *   기본 정수형(`uint8_t`, `uint16_t`) 및 Arduino 표준 타입을 제공합니다.
*   **`<ArduinoJson.h>`**:
    *   `JsonObject`, `JsonObjectConst` 등 JSON 파싱/직렬화 인터페이스에 사용됩니다.
*   **`"C10_Config_0203.h"`**:
    *   ConfigManager 공개 인터페이스 및 공통 설정 컨텍스트를 참조합니다.
*   **`"A20_Const_0203.h"`**:
    *   `ST_A20_UserProfilesRoot_t`, `ST_A20_UserProfileItem_t`, `ST_A20_TriggerRule_t`, `EN_A20_ruleMode_t` 등 전역 데이터 구조체와 열거형을 제공합니다.
