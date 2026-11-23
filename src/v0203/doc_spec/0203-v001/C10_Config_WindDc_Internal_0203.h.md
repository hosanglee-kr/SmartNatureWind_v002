# `C10_Config_WindDc_Internal_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_WindDc_Internal_0203.h

`C10_Config_WindDc_*` 분할 파일들이 공유하는 **바람 사전(`WindDict`: 프리셋·스타일) 텍스트 정제·검증, 코드 중복 검사 템플릿, JSON 디코딩 내부 헬퍼**를 선언하는 내부 전용 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t` / `ST_A20_PresetEntry_t` / `ST_A20_StyleEntry_t`**
    *   **설명:** 바람 사전 루트 및 개별 프리셋·스타일 항목 구조체입니다.
    *   **사용처:** `C10_fromJson_WindPreset`, `C10_fromJson_WindStyle`, `C10_loadWindDictFromJsonChecked`의 입출력 매개변수로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_sanitizeAndValidateText`** | `bool` | 프리셋/스타일 코드·이름 문자열을 정제하고 유효성을 검사합니다. | 1. 앞뒤 공백 및 `p_disallowInnerSpace` 옵션에 따른 내부 공백을 검증합니다. <br>2. 필수값(`p_required`) 누락 시 `p_tagForLog`로 에러를 로깅합니다. |
| **`C10_hasDupCode`** | `bool` | 템플릿 배열(`p_seen[N][L]`) 내에서 코드 중복 여부를 검사합니다. | 1. `p_countSoFar` 범위까지 대소문자 무시(`strcasecmp`)로 중복을 확인합니다. |
| **`C10_fromJson_WindPreset` / `C10_fromJson_WindStyle`** | `void` | JSON 객체에서 단일 프리셋 또는 스타일 항목을 파싱합니다. | 1. 코드, 이름, 기저 풍속/난류/돌풍 배수를 추출합니다. |
| **`C10_loadWindDictFromJsonChecked`** | `bool` | `windDict` JSON 객체 전체를 검증하며 `ST_A20_WindDict_t`로 로드합니다. | 1. 프리셋·스타일 코드 중복 및 필수 필드를 일괄 검증합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>` / `<ArduinoJson.h>`**:
    *   기본 타입 및 `JsonObjectConst` 파싱에 사용됩니다.
*   **`"C10_Config_0203.h"` / `"A20_Const_0203.h"`**:
    *   ConfigManager 인터페이스 및 `ST_A20_WindDict_t` 구조체 정의를 제공합니다.
