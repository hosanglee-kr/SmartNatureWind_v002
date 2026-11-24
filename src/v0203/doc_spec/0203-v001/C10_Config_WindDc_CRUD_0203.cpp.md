# `C10_Config_WindDc_CRUD_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_WindDc_CRUD_0203.cpp

`CL_C10_ConfigManager`의 **바람 프로필(`WindProfile` / `WindDict` 프리셋) 추가·수정·삭제(CRUD)** API를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t`**
    *   **설명:** `presetCount` 및 `presets[]` 배열을 관리하는 바람 사전 구조체입니다.
    *   **사용처:** `addWindProfileFromJson`, `updateWindProfileFromJson`, `deleteWindProfile`에서 프리셋 항목을 추가·수정·삭제할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_C10_ConfigManager::addWindProfileFromJson`** | `int` | JSON에서 새 바람 프로필(프리셋)을 추가하고 생성된 ID를 반환합니다. | 1. `C10_sanitizeAndValidateText` 및 `C10_hasDupCode`로 코드 유효성·중복을 검사합니다. <br>2. `v_root.presetCount` 위치에 추가 후 Dirty 플래그를 세웁니다. |
| **`CL_C10_ConfigManager::updateWindProfileFromJson`** | `bool` | 지정 ID(`p_id`)의 기존 바람 프로필을 부분 패치(`p_patch`)로 수정합니다. | 1. 대상 인덱스를 찾아 전달된 필드만 갱신하고 유효성을 검증합니다. |
| **`CL_C10_ConfigManager::deleteWindProfile`** | `bool` | 지정 ID(`p_id`)의 바람 프로필을 삭제하고 배열을 압축합니다. | 1. 삭제 후 뒤쪽 항목을 당겨 `presetCount`를 감소시킵니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_0203.h"` / `"C10_Config_WindDc_Internal_0203.h"`**:
    *   `CL_C10_ConfigManager` 선언 및 WindDict 내부 검증 헬퍼를 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"A23_Com_ResetCfg_0203.h"`**:
    *   뮤텍스 가드 및 기본값 초기화에 사용됩니다.
