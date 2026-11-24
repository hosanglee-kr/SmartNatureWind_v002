# `W10_Web_Routes_CRUD_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_CRUD_0203.cpp

**바람 프로필(`windProfile`)**, **주간 스케줄(`schedules`)**, 및 **사용자 프로필(`user_profiles`)**의 **목록 조회/생성/수정/삭제/패치(REST CRUD)** 엔드포인트를 일괄 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_C10_ConfigManager`** (`class`)
    *   **설명:** `WindProfile`, `Schedules`, `UserProfiles`에 대한 `add*`, `update*`, `delete*` 메서드를 제공하는 설정 매니저입니다.
    *   **사용처:** 각 REST CRUD 라우트에서 영구 설정 변경 시 호출됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`_crudExtractTailId` / `_crudAccumJson`** | `static bool` | URL 경로 끝의 정수 ID(`/{id}`)를 추출하고 JSON 요청 바디를 누적 파싱합니다. | 1. 유효하지 않은 ID 또는 JSON 오류 시 `400`을 반환합니다. |
| **`routeWindProfile` / `routeWindProfileID`** | `void` | `/api/v001/windProfile` GET/POST 및 `/{id}` PUT/DELETE를 처리합니다. | 1. `addWindProfileFromJson`, `updateWindProfileFromJson`, `deleteWindProfile`을 호출합니다. |
| **`routeSchedules` / `routeSchedulesID`** | `void` | `/api/v001/schedules` GET/POST 및 `/{id}` PUT/DELETE를 처리합니다. | 1. `addScheduleFromJson`, `updateScheduleFromJson`, `deleteSchedule`을 호출합니다. |
| **`routeUserProfiles` / `routeUserProfilesID` / `routeUserProfilesPatch`** | `void` | `/api/v001/user_profiles` GET/POST, `/{id}` PUT/DELETE 및 `/patch`를 처리합니다. | 1. `addUserProfilesFromJson`, `updateUserProfilesFromJson`, `deleteUserProfiles`를 호출합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"C10_Config_0203.h"`**:
    *   REST 라우트 바인딩 및 설정 CRUD 위임에 사용됩니다.
