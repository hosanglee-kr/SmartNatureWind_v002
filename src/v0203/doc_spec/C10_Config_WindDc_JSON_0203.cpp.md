# `C10_Config_WindDc_JSON_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_WindDc_JSON_0203.cpp

`CL_C10_ConfigManager`의 **바람 사전(`ST_A20_WindDict_t`) JSON 직렬화(`toJson_WindDict`) 및 JSON 패치(`patchWindDictFromJson`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t`**
    *   **설명:** `presetCount`개 프리셋과 `styleCount`개 스타일을 담는 바람 사전 구조체입니다.
    *   **사용처:** `toJson_WindDict`, `patchWindDictFromJson`의 대상 구조체로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_C10_ConfigManager::toJson_WindDict`** | `void` | `ST_A20_WindDict_t` 전체 프리셋과 스타일을 `JsonDocument`로 직렬화합니다. | 1. `presets[]`와 `styles[]` 배열을 순회하며 모든 물리 파라미터를 JSON으로 출력합니다. |
| **`CL_C10_ConfigManager::patchWindDictFromJson`** | `bool` | JSON 패치(`p_patch`)를 검증해 `p_cfg`에 반영합니다. | 1. `C10_loadWindDictFromJsonChecked`로 유효성을 검증한 뒤 변경 시 `true`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_0203.h"` / `"C10_Config_WindDc_Internal_0203.h"`**:
    *   `CL_C10_ConfigManager` 및 WindDict JSON 검증 헬퍼를 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"A23_Com_ResetCfg_0203.h"`**:
    *   JSON 유틸리티 및 기본값 폴백에 사용됩니다.
