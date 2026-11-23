# `W10_Web_Routes_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_0203.cpp

`CL_W10_WebAPI`의 **초기화 진입점(`begin`)**과 **시스템 설정 런타임 반영(`applySystemRuntimeFromConfig`)**을 구현하여 모든 REST 라우트·WebSocket·정적 에셋을 `AsyncWebServer`에 일괄 등록하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_W10_WebAPI`** (`class`)
    *   **설명:** `s_server`, `s_control` 정적 포인터를 바인딩하고 전체 라우트를 등록하는 웹 API 총괄 클래스입니다.
    *   **사용처:** `A00_Main_0203.cpp` 부팅 시 `CL_W10_WebAPI::begin(server, control)`로 호출됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`applySystemRuntimeFromConfig`** | `void` | `ST_A20_SystemConfig_t`의 보안(API Key) 및 웹 런타임 설정을 반영합니다. | 1. 설정 재로드 시에도 웹 인증/런타임 파라미터를 즉시 동기화합니다. |
| **`begin`** | `void` | `AsyncWebServer`와 `CL_CT10_ControlManager`를 연결하고 40여 종의 라우트를 등록합니다. | 1. `routeVersion`, `routeState`, `routeSystem`, `routeControl`, `routeSession`, `routeAILive`, `routeStaticAssets`, `routeWebSocket` 등을 순차 등록합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"`**:
    *   모든 `route*()` 선언 및 제어 매니저 바인딩에 사용됩니다.
