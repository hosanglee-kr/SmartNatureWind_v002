# `CT10_Ctl_AIAction_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_AIAction_0203.cpp

Stage 8 **Gemini AI & Live 12대 제어도구(Tool Calls) 실행기**, **15종 위험 명령 차단 가드레일(`isForbiddenAIFunction`)**, 및 **도구 스키마 단일 진실 공급원(`appendAIFunctionDeclarations`)**을 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`S_BLOCKED[]`** (`static const char* const[]`)
    *   **설명:** `reboot`, `factory_reset`, `wifi_reset`, `ota_update` 등 음성/AI로 실행을 금지하는 15종 위험 명령 블랙리스트입니다.
    *   **사용처:** `isForbiddenAIFunction()`에서 AI 도구 호출 전 보안 차단에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`isForbiddenAIFunction`** | `bool` | 요청된 AI 함수명이 15종 위험 명령 블랙리스트에 포함되는지 검사합니다. | 1. `S_BLOCKED[]` 배열과 비교해 일치 시 `true`를 반환해 실행을 차단합니다. |
| **`appendAIFunctionDeclarations`** | `void` | Gemini API에 전달할 12대 제어도구 JSON 스키마를 `JsonArray`에 추가합니다. | 1. AUDIT2-2 규약에 따라 텍스트/Live 공용 단일 스키마 소스로 동작합니다. |
| **제어도구 실행 핸들러** (`set_preset`, `set_style`, `set_speed`, `set_auto_off`, `create_profile`, `create_schedule` 등) | `bool` | AI가 호출한 도구 인자(`p_args`)를 검증해 `CT10_Ctl`/`C10_Config` 동작을 실행합니다. | 1. 프리셋/스타일 전환, 고정 풍속(%), 수면 타이머(분), 8스텝 프로필/스케줄 생성을 처리합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"C10_Config_0203.h"` / `"S20_WindSolver_0203.h"`**:
    *   제어 매니저 실행 위임, 프로필/스케줄 저장 및 바람 파라미터 해석에 사용됩니다.
*   **`"N10_NvsManager_0203.h"` / `"D10_Logger_0203.h"`**:
    *   상태 영구 저장 및 AI 도구 실행 감사 로깅에 사용됩니다.
