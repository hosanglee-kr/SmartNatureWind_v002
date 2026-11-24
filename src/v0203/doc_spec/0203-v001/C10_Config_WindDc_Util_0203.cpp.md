# `C10_Config_WindDc_Util_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_WindDc_Util_0203.cpp

`C10_Config_WindDc_Internal_0203.h`에 선언된 **바람 사전(`WindDict`) 텍스트 정제/검증, 프리셋·스타일 JSON 디코딩 및 전체 무결성 검사 로드** 유틸리티 구현부입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t` / `ST_A20_PresetEntry_t` / `ST_A20_StyleEntry_t`**
    *   **설명:** 바람 사전 루트 및 개별 프리셋·스타일 항목 구조체입니다.
    *   **사용처:** `C10_fromJson_WindPreset`, `C10_fromJson_WindStyle`, `C10_loadWindDictFromJsonChecked`의 출력 매개변수로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_sanitizeAndValidateText`** | `bool` | 프리셋/스타일 코드 및 이름 문자열의 공백·필수 여부를 검증합니다. | 1. `p_disallowInnerSpace=true`일 때 코드 내 공백 포함 시 실패 처리합니다. <br>2. 필수값(`p_required`) 누락 시 `p_tagForLog` 태그로 로깅합니다. |
| **`C10_fromJson_WindPreset`** | `void` | `JsonObjectConst`에서 단일 프리셋(`ST_A20_PresetEntry_t`)을 디코딩합니다. | 1. 코드, 이름, 기저 풍속·난류·돌풍 파라미터를 추출합니다. |
| **`C10_fromJson_WindStyle`** | `void` | `JsonObjectConst`에서 단일 스타일(`ST_A20_StyleEntry_t`)을 디코딩합니다. | 1. 스타일 코드, 이름 및 강도/변동성/돌풍 배수를 추출합니다. |
| **`C10_loadWindDictFromJsonChecked`** | `bool` | `windDict` JSON 객체에서 프리셋·스타일 배열을 인덱스(`idx`) 및 코드 중복 검사 후 로드합니다. | 1. `C10_hasDupCode`로 프리셋/스타일 코드 중복을 차단합니다. <br>2. 모든 항목 검증 통과 시 `true`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_WindDc_Internal_0203.h"`**:
    *   내부 헬퍼 선언을 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"A22_Com_Lookup_0203.h"` / `"A23_Com_ResetCfg_0203.h"`**:
    *   JSON 헬퍼, 코드 룩업 및 기본값 초기화에 사용됩니다.
