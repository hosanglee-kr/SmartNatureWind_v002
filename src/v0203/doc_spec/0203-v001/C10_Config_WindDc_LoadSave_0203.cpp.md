# `C10_Config_WindDc_LoadSave_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_WindDc_LoadSave_0203.cpp

`CL_C10_ConfigManager`의 **바람 사전(`WindDict`) LittleFS JSON 파일 로드(`loadWindDict`) 및 원자적 저장(`saveWindDict`)**을 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t`**
    *   **설명:** 10종 프리셋과 5종 스타일을 보관하는 바람 사전 구조체입니다.
    *   **사용처:** `loadWindDict`, `saveWindDict`에서 파일 I/O 대상으로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_C10_ConfigManager::loadWindDict`** | `bool` | LittleFS에서 `windDict` JSON 파일을 로드해 `p_dict`에 채웁니다. | 1. `A40_IO::Load_File2JsonDoc_V21`로 백업 포함 로드를 수행합니다. <br>2. `C10_loadWindDictFromJsonChecked` 검증 실패 시 `A23` 기본값으로 폴백합니다. |
| **`CL_C10_ConfigManager::saveWindDict`** | `bool` | `ST_A20_WindDict_t`를 JSON으로 직렬화해 LittleFS에 원자적 저장합니다. | 1. `A40_IO::Save_JsonDoc2File_V21`로 `.tmp` → `.bak` → 교체를 수행합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_0203.h"` / `"C10_Config_WindDc_Internal_0203.h"`**:
    *   `CL_C10_ConfigManager` 및 WindDict 내부 검증 헬퍼를 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"A23_Com_ResetCfg_0203.h"`**:
    *   원자적 파일 I/O(`A40_IO`) 및 기본 바람 사전 초기화에 사용됩니다.
