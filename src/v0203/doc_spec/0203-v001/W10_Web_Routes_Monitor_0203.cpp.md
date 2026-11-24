# `W10_Web_Routes_Monitor_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_Monitor_0203.cpp

`[MON-B]` **모니터링 이력 조회 및 CSV 내보내기 API(`GET /api/v001/monitor`)**를 구현하는 파일로, `type`(wind/state/config/sensor/timeline) 및 `range`(1h/6h/24h/7d) 파라미터에 따라 `CL_MON_Monitor` 데이터를 반환합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_MON_Monitor`** (`class`)
    *   **설명:** PSRAM Warm 버퍼 및 LittleFS Cold 이력을 조회하는 모니터링 매니저입니다.
    *   **사용처:** `routeMonitor()`에서 JSON 조회 및 CSV 스트리밍 시 호출됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_W10_WebAPI::routeMonitor`** | `void` | `/api/v001/monitor` 및 CSV 다운로드 요청을 처리합니다. | 1. 쿼리 파라미터 `type`, `range`, `all=1`을 파싱합니다. <br>2. `queryWind`/`queryState`/`queryConfig`/`querySensor` 또는 CSV 응답을 생성합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Monitor_0203.h"`**:
    *   웹 응답 유틸리티 및 모니터링 이력 조회 API에 사용됩니다.
