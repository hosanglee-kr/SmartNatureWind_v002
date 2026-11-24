# `W10_Web_Routes_Session_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_Session_0203.cpp

`[v0203 Stage 3]` **Session FSM 제어 API(`/api/v001/session/*`)**를 구현하는 파일로, 세션 시작(`start`), 일시정지(`pause`), 재개(`resume`), 정지(`stop`), 및 실행 중 트리거 규칙 갱신(`rule`)을 처리합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`EN_CT10_session_type_t` / `EN_CT10_trigger_t`**
    *   **설명:** 세션 유형(Playlist/Preset/Fixed/AutoFull/AutoSelect) 및 트리거 소스(Manual/Schedule/Auto) 열거형입니다.
    *   **사용처:** `W10_parseSessionType()`, `W10_parseTrigger()`에서 JSON 문자열을 열거형으로 변환할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`_sessOnReqEmptyCheck` / `_sessAccumJson`** | `static void` / `bool` | 세션 API 요청 바디를 누적하고 JSON으로 파싱합니다. | 1. `takeBodyBuf` + `parseJsonBody` 공통 처리를 수행합니다. |
| **`W10_parseSessionType` / `W10_parseTrigger`** | `static EN_CT10_*` | 문자열을 세션 유형 및 트리거 열거형으로 변환합니다. | 1. 미지정 시 기본값으로 폴백합니다. |
| **`CL_W10_WebAPI::routeSession`** | `void` | `/api/v001/session/start|pause|resume|stop|rule` 엔드포인트를 처리합니다. | 1. `CL_CT10_ControlManager::startSession()`, `pauseSession()`, `resumeSession()`, `stopSession()`, `updateActiveSessionRule()`을 호출합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"`**:
    *   Session FSM 상태 전이 위임 및 JSON 응답에 사용됩니다.
