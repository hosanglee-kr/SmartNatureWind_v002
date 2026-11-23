# `W10_Web_Routes_Control_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_Control_0203.cpp

**실시간 팬 제어(`routeControl`)**, **제어 요약(`routeControlSummary`)**, **시뮬레이션 설정·상태·차트 이력(`routeSimulation`, `routeSimState`, `routeChartHistory`)**, 및 **PIR 모션 피드(`routeMotionFeed`)** 엔드포인트를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_CT10_ControlManager`** (`class`)
    *   **설명:** 오버라이드, 시뮬레이션 패치, 차트 익스포트 및 PIR 피드를 처리하는 제어 매니저입니다.
    *   **사용처:** 모든 `/api/v001/control/*`, `/api/v001/sim/*`, `/api/v001/motion/pir/feed` 라우트에서 호출됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`_ctlOnReqEmptyCheck` / `_ctlAccumJson`** | `static void` / `bool` | 제어 API 요청의 빈 바디를 검사하고 청크 JSON을 누적 파싱합니다. | 1. `takeBodyBuf` + `parseJsonBody` 공통 패턴을 캡슐화합니다. |
| **`routeControl` / `routeControlSummary`** | `void` | `/api/v001/control/*` 제어 명령(풍속, 프리셋, 타이머, 공장초기화 등) 및 요약을 처리합니다. | 1. 요청 분기별 유효성 검증 후 `CT10_ControlManager`에 제어 명령을 위임합니다. |
| **`routeSimulation` / `routeSimState` / `routeChartHistory`** | `void` | 시뮬레이션 파라미터 조회/패치, 현재 상태 및 120-entry 차트 이력을 반환합니다. | 1. `exportSimJson()`, `exportChartJson()`을 호출해 JSON 응답을 생성합니다. |
| **`routeMotionFeed`** | `void` | `POST /api/v001/motion/pir/feed`로 외부/테스트 PIR 감지 신호를 주입합니다. | 1. `feedPIR()`를 호출해 재실 타이머를 갱신합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"` / `"C10_Config_0203.h"`**:
    *   제어 위임, 시뮬레이션 상태 조회 및 설정 초기화에 사용됩니다.
