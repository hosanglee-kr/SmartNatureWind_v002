# `W10_Web_Gemini_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Gemini_0203.cpp

Stage 8 **Gemini AI 텍스트 프록시(`POST /api/v001/ai/gemini`)**, **비동기 AI 워커 태스크(`W10_aiWorkerTask`)**, **Tool Call 2-Turn 실행 루프(`handleNaturalLanguageTurnWorker`)**, 및 **단일 AI 액션 실행(`POST /api/v001/ai/execute-action`)**을 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`s_aiJob`** (전역 AI 작업 버퍼)
    *   **설명:** `async_tcp` 콜백 블로킹을 피하기 위해 요청 본문(`reqBuf`, `reqLen`)과 응답(`respBuf`)을 비동기 워커 태스크로 전달하는 작업 슬롯입니다.
    *   **사용처:** `routeGeminiProxy()`, `W10_processSingleAiJob()`에서 `jobId` 폴링 및 결과 반환에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`W10_getGeminiApiKey`** | `static const char*` | 시스템 설정에서 `geminiApiKey`를 안전하게 조회합니다. | 1. 미설정 시 `nullptr`을 반환해 API 호출을 차단합니다. |
| **`W10_callGeminiApi`** | `static String` | HTTPS `HTTPClient`로 Google Gemini REST 엔드포인트에 POST 요청을 보냅니다. | 1. 응답 코드(`r_httpCode`)와 JSON 본문을 반환합니다. |
| **`handleNaturalLanguageTurnWorker`** | `static void` | 1턴 Gemini 호출 → Tool Call 파싱 → `CT10_AI::executeAIAction` → 2턴 자연어 요약 응답을 수행합니다. | 1. 대화 이력(`W10_appendHistoryAndMessage`)과 12대 제어도구 스키마를 포함해 호출합니다. |
| **`W10_aiWorkerTask` / `W10_ensureAiWorker` / `W10_processSingleAiJob`** | `static void` / `bool` | 전용 FreeRTOS 워커 태스크에서 AI HTTP 요청을 비동기로 처리합니다. | 1. `async_tcp` 워치독 타임아웃을 방지합니다. |
| **`routeGeminiProxy`** | `void` | `POST /api/v001/ai/gemini` 요청을 큐잉하거나 `jobId`로 결과를 조회합니다. | 1. `takeBodyBuf`로 본문을 받아 워커에 전달합니다. |
| **`routeAIExecuteAction`** | `void` | `POST /api/v001/ai/execute-action`으로 단일 AI 도구를 즉시 실행합니다. | 1. `CT10_AI::executeAIAction(v_name, v_args)` 결과를 JSON으로 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"`**:
    *   웹 API 클래스 선언 및 `CT10_AI` 도구 실행/프롬프트 빌더에 사용됩니다.
*   **`<HTTPClient.h>` / `<WiFiClientSecure.h>`**:
    *   Google Gemini HTTPS API 통신에 사용됩니다.
