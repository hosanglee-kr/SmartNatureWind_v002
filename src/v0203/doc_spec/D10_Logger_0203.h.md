# `D10_Logger_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: D10_Logger_0203.h

시리얼 출력, ANSI 컬러 태깅, 256-entry 순환 버퍼(`s_buffer`) 저장, 및 `AsyncWebSocket` 실시간 로그 브로드캐스트를 담당하는 정적 싱글턴 로거 클래스(`CL_D10_Logger`)를 정의하는 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`EN_L10_LogLevel_t`** (`enum : uint8_t`)
    *   **설명:** 로그 심각도 레벨 열거형입니다.
    *   **사용처:** `CL_D10_Logger::log`, `setLevel`, `getLevel`, `_getColor`, `_getTag`의 레벨 필터링 및 태깅에 사용됩니다.
*   **`ST_D10_LogEntry`** (`struct`)
    *   **설명:** 순환 버퍼에 저장되는 개별 로그 엔트리(타임스탬프, 레벨, 메시지) 구조체입니다.
    *   **사용처:** `CL_D10_Logger::s_buffer[BUFFER_SIZE]` 및 `getLogsAsJson`에서 최근 로그 이력을 보관·직렬화할 때 사용됩니다.
*   **`CL_D10_Logger`** (`class`)
    *   **설명:** `BUFFER_SIZE = 256` 크기의 정적 순환 버퍼와 시리얼/WebSocket 출력 상태를 관리하는 정적 로거 클래스입니다.
    *   **사용처:** `A40_LOGE/W/I/D` 매크로 및 전 모듈의 진단 로깅 진입점으로 사용됩니다.
*   **`G_D10_COLOR_*`** (`RESET`, `RED`, `YELLOW`, `GREEN`, `CYAN`, `WHITE`)
    *   **설명:** 시리얼 터미널 출력용 ANSI 이스케이프 컬러 매크로입니다.
    *   **사용처:** `_getColor(EN_L10_LogLevel_t)`에서 로그 레벨별 색상 매핑에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin`** | `static void` | 시리얼 포트와 보드레이트(기본 `115200`)를 초기화합니다. | 1. `_serial` 포인터를 바인딩합니다. <br>2. 초기 로그 출력 준비를 완료합니다. |
| **`setLevel` / `getLevel`** | `static void` / `EN_L10_LogLevel_t` | 현재 출력 로그 레벨을 설정하거나 조회합니다. | 1. `_logLevel` 정적 멤버를 갱신/반환하여 출력 필터 기준을 제어합니다. |
| **`enableTimestamp` / `enableMemUsage`** | `static void` | 타임스탬프 및 `ESP.getFreeHeap()` 메모리 사용량 표시 여부를 설정합니다. | 1. `_showTimestamp`, `_showMemUsage` 플래그를 토글합니다. |
| **`attachWebSocket`** | `static void` | 실시간 로그 전송용 `AsyncWebSocket*` 인스턴스를 연결합니다. | 1. `s_wsLogs` 포인터를 등록해 `broadcastLog`가 웹 클라이언트로 전송할 수 있게 합니다. |
| **`log`** | `static void` | 가변 인자(`...`) 포맷 로그를 시리얼·버퍼·WS로 출력합니다. | 1. `_logLevel` 필터 통과 시 `vsnprintf`로 메시지를 포맷합니다. <br>2. `s_buffer` 순환 버퍼(`s_head`, `s_count`)에 저장하고 시리얼 및 `broadcastLog`로 출력합니다. |
| **`broadcastLog`** | `static void` | 연결된 `AsyncWebSocket` 클라이언트에 로그를 브로드캐스트합니다. | 1. `s_wsLogs`가 유효할 때 실시간 로그 페이로드를 전송합니다. |
| **`getLogsAsJson`** | `static void` | 순환 버퍼(`s_buffer`)에 저장된 로그를 `JsonDocument`로 직렬화합니다. | 1. `s_head`부터 `s_count`개 엔트리를 순회하며 JSON 배열로 채웁니다. |
| **`printBanner`** | `static void` | 부팅 시 시스템 배너를 시리얼로 출력합니다. | 1. 펌웨어 시작 구분용 배너 텍스트를 출력합니다. |
| **`_getColor` / `_getTag`** | `static const char*` | 로그 레벨에 대응하는 ANSI 컬러 코드 및 문자열 태그를 반환합니다. | 1. `EN_L10_LogLevel_t` 값에 따라 색상(`G_D10_COLOR_*`)과 태그를 매핑합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>`**:
    *   `Serial`, `ESP.getFreeHeap()`, 기본 정수형(`uint8_t`, `uint16_t`, `uint32_t`) 제공.
*   **`<ArduinoJson.h>`**:
    *   `getLogsAsJson(JsonDocument&)`에서 로그 버퍼 JSON 직렬화에 사용.
*   **`<ESPAsyncWebServer.h>`**:
    *   `AsyncWebSocket*` 타입 및 실시간 웹 로그 브로드캐스트에 사용.
*   **`<Stream.h>`**:
    *   시리얼 출력 대상 추상화(`Stream& p_serial`)에 사용.
*   **`<stdarg.h>` / `<stdio.h>`**:
    *   `log()`의 가변 인자 처리(`va_list`, `vsnprintf`)에 사용.
