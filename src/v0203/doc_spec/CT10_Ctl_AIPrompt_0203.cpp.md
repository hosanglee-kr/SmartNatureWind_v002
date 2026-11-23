# `CT10_Ctl_AIPrompt_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_AIPrompt_0203.cpp

Stage 8 **Gemini AI 시스템 프롬프트 동적 생성 및 30초/세션 해시 기반 캐싱(`s_cachedPrompt`, `computeSessionHash`)**, **한국어 프리셋명 매핑(`presetCodeToKorean`)**, 및 **도구 실행 결과 자연어 응답 포맷팅**을 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`s_cachedPrompt` / `s_cachedPromptMs` / `s_cachedSessionHash`**
    *   **설명:** 현재 기기 상태(실행 중인 프로필/프리셋/타이머/온습도) 해시 기반의 시스템 프롬프트 캐시 변수입니다.
    *   **사용처:** 매 AI 턴마다 프롬프트를 재조합하는 비용을 줄이기 위해 해시 일치 시 캐시를 재사용합니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`computeSessionHash`** | `uint32_t` | 현재 세션·바람·타이머·센서 상태를 FNV-1a(`2166136261u`) 해시로 계산합니다. | 1. 상태 변경 여부를 O(1)로 감지해 프롬프트 캐시 무효화 기준으로 사용합니다. |
| **`presetCodeToKorean`** | `const char*` | 영문 프리셋 코드(`OCEAN` 등)를 한국어 감성 명칭(`바다 바람` 등)으로 변환합니다. | 1. AI 음성 응답 시 자연스러운 한국어 안내를 위해 사용됩니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"D10_Logger_0203.h"`**:
    *   현재 세션 상태(`getSessionAutoOffRemainSec` 등) 조회 및 로깅에 사용됩니다.
