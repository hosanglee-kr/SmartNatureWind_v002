# `W10_Web_Util_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Util_0203.cpp

`CL_W10_WebAPI`의 **공통 HTTP 유틸리티**를 구현하는 파일로, CORS/캐시 헤더 적용(`_applyHeaders`), JSON/텍스트 응답 전송(`sendJson`/`sendText`), API Key 인증(`checkApiKey`/`requireApiKey`), 및 비동기 청크 JSON 바디 누적·파싱(`beginBody`/`appendBody`/`takeBodyBuf`/`freeBody`/`parseJsonBody`)을 담당합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`AsyncWebServerRequest*` / `AsyncWebServerResponse*`**
    *   **설명:** `ESPAsyncWebServer`의 비동기 요청/응답 컨텍스트 포인터입니다.
    *   **사용처:** 모든 `W10_Web_Routes_*` 핸들러가 요청 본문 누적 및 JSON 응답 전송 시 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`_applyHeaders`** | `void` | 응답 객체에 CORS 및 `no-cache` 헤더를 일괄 추가합니다. | 1. `p_nocache=true` 시 `Cache-Control: no-cache, no-store`를 설정합니다. |
| **`sendJson` / `sendText`** | `void` | `JsonDocument` 또는 문자열을 지정 HTTP 상태 코드(`p_code`)로 응답합니다. | 1. `_applyHeaders()` 적용 후 `application/json` 또는 `text/plain`으로 전송합니다. |
| **`checkApiKey` / `requireApiKey`** | `bool` | 요청 헤더/파라미터의 API Key를 검증하고 미인증 시 `401` 응답을 반환합니다. | 1. 보안 키가 설정된 경우에만 검증하며 실패 시 즉시 요청을 종료합니다. |
| **`beginBody` / `appendBody` / `takeBodyBuf` / `freeBody`** | `bool` / `uint8_t*` / `void` | `onBody` 콜백에서 분할 수신되는 HTTP 요청 바디를 누적·회수·해제합니다. | 1. `p_request->_tempObject`에 버퍼를 관리해 메모리 누수를 방지합니다. |
| **`parseJsonBody`** | `bool` | 누적된 바디 버퍼를 `deserializeJson`으로 파싱하고 오류 시 `400`을 응답합니다. | 1. 파싱 성공 시 `true`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `<ESPAsyncWebServer.h>` / `<ArduinoJson.h>`**:
    *   비동기 HTTP 바디 버퍼링 및 JSON 직렬화/역직렬화에 사용됩니다.
