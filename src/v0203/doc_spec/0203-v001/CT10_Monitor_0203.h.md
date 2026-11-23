# `CT10_Monitor_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Monitor_0203.h

**1시간 PSRAM Warm 버퍼(1초 원본)**, **7일 LittleFS Cold 이력(1시간 배치 flush)**, **64-event 세션 회고 타임라인** 및 **CSV 내보내기**를 관리하는 모니터링 매니저(`CL_CT10_Monitor`) 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_CT10_Monitor`** (`class`)
    *   **설명:** 실시간 1초 샘플을 PSRAM Warm 버퍼에 적재하고, 주기적으로 LittleFS Cold 파일로 플러시하며 세션 이벤트를 기록하는 모니터링 클래스입니다.
    *   **사용처:** `CT10_Ctl` 틱 루프에서 샘플/이벤트를 기록하고 `W10_Web_Routes_Monitor`에서 `/api/v001/monitor` 조회 시 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin` / `tick`** | `void` | PSRAM Warm 버퍼를 할당·초기화하고 1초 샘플링 및 1시간 Cold 플러시를 수행합니다. | 1. PSRAM 가용 여부에 따라 버퍼를 안전하게 할당합니다. <br>2. 배치 플러시 주기에 도달하면 LittleFS에 이력을 기록합니다. |
| **`recordEvent`** | `void` | 세션 시작/일시정지/재개/정지 등 주요 이벤트를 64-event 타임라인에 기록합니다. | 1. 타임스탬프와 이벤트 타입·사유를 순환 버퍼에 저장합니다. |
| **`exportJson` / `exportCsv`** | `void` | Warm/Cold 이력 및 이벤트 타임라인을 JSON 또는 CSV 형식으로 내보냅니다. | 1. `W10_Web_Routes_Monitor`의 차트 조회 및 CSV 다운로드 요청에 응답합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>` / `<ArduinoJson.h>` / `<LittleFS.h>`**:
    *   PSRAM 할당, JSON 직렬화 및 Cold 이력 파일 저장에 사용됩니다.
*   **`"A20_Const_0203.h"` / `"D10_Logger_0203.h"`**:
    *   모니터링 버퍼 크기 상수 및 오류 로깅에 사용됩니다.
