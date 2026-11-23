# `CT10_Ctl_IOWS_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_IOWS_0203.cpp

`CL_CT10_ControlManager`의 **Dirty-Flag 기반 4대 WebSocket 채널(State/Metrics/Chart/Summary) 우선순위 스케줄링(`CT10_WS_tick`)**, **대용량 차트 스로틀링(`s_chartLargeBytes`, `s_chartThrottleMul`)**, 및 **JSON 상태 직렬화(`exportStateJson_v02`, `exportChartJson`, `exportSummaryJson`, `exportMetricsJson`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WS_CH_CONFIG_t`**
    *   **설명:** WebSocket 채널별 전송 간격(`chIntervalMs`) 및 우선순위(`priority`) 설정 구조체입니다.
    *   **사용처:** `CT10_WS_buildPriorityOrderFromConfig()`에서 채널 전송 순서를 결정할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CT10_WS_setBrokers` / `CT10_WS_begin` / `CT10_WS_tick`** | `void` | `W10_WebAPI` 브로커 콜백을 연결하고 우선순위·간격에 따라 WS 메시지를 전송합니다. | 1. `CT10_WS_trySendOne_v03`에서 페이로드 크기(`s_chartLargeBytes`) 초과 시 `s_chartThrottleMul` 배수로 전송 주기를 완화합니다. |
| **`markDirty` / `consumeDirty*` / `consumeAllDirty`** | `void` / `bool` / `uint8_t` | 상태·메트릭·차트·요약 변경 플래그를 설정하고 원자적으로 소비합니다. | 1. 변경된 채널만 선별 전송해 불필요한 WS 트래픽을 차단합니다. |
| **`exportStateJson_v02` / `exportChartJson` / `exportSummaryJson` / `exportMetricsJson`** | `void` | 각 WS 채널 및 REST API용 JSON 페이로드를 생성합니다. | 1. 현재 FSM 상태, 세션, 120-entry 차트, 힙/태스크 메트릭을 직렬화합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"A20_Const_0203.h"`**:
    *   제어 상태 조회 및 WS 기본 채널 설정(`G_A20_WS_CH_Base_Arr`)에 사용됩니다.
