# `W10_Web_Routes_Comfort_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_Comfort_0203.cpp

Stage 6 **일본 기상청 표준 DI(불쾌지수) 기반 Comfort 조회 및 Auto-Comfort 자동 제어 토글 API(`GET/POST /api/v001/comfort*`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_CT10_ControlManager`** (`class`)
    *   **설명:** DI 계산, 쾌적도 레벨(0~3), 추천 프리셋/스타일/프로필 및 Auto-Comfort 상태를 제공하는 제어 매니저입니다.
    *   **사용처:** `routeComfort()` 핸들러가 상태 조회 및 `setAutoComfort()` 호출 시 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_W10_WebAPI::routeComfort`** | `void` | `/api/v001/comfort` GET 조회 및 Auto-Comfort 활성화/비활성화 POST 요청을 처리합니다. | 1. GET: `getDiscomfortIndex()`, `getComfortLevel()`, 추천 프리셋·스타일·프로필 ID 및 잔여 평가 시간을 JSON으로 반환합니다. <br>2. POST: `takeBodyBuf` + `parseJsonBody` 후 `enabled` 값으로 `setAutoComfort()`를 호출합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"`**:
    *   HTTP 바디 파싱 유틸리티 및 Comfort 제어 매니저 호출에 사용됩니다.
