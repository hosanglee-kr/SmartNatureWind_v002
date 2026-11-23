# `S10_Simul_IO_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: S10_Simul_IO_0203.cpp

`CL_S10_Simulation`의 **상태 JSON 직렬화(`toJson`)**, **120-entry 차트 링버퍼 스냅샷 및 증분 직렬화(`toChartJson`)**, **JSON 패치 반영(`patchFromJson`)**, **60초 이동 평균 풍속 캐시(`_updateWindHistory` / `_getAvgWindFast`)**를 구현하는 I/O 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_ChartEntry`** (`struct`)
    *   **설명:** `CHART_CAPACITY = 120` 크기의 정적 차트 링버퍼(`s_chartBuffer`) 원소 구조체입니다.
    *   **사용처:** `toChartJson()`에서 `s_snapshot[CHART_CAPACITY]`로 복사한 뒤 락 없이 JSON 직렬화할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`toJson`** | `void` | 현재 풍속, 목표 풍속, PWM 듀티, 난류/열기포/돌풍 상태를 `JsonDocument`에 기록합니다. | 1. 웹 UI 대시보드 및 REST 상태 조회 응답에 사용됩니다. |
| **`toChartJson`** | `void` | 차트 링버퍼를 전체 또는 증분(`p_diffOnly=true`) JSON 배열로 직렬화합니다. | 1. `s_snapshot`에 버퍼를 빠르게 복사해 뮤텍스 점유 시간을 최소화합니다. <br>2. `p_diffOnly` 여부에 따라 최신 샘플 또는 전체 링버퍼를 출력합니다. |
| **`patchFromJson`** | `bool` | JSON 패치에서 프리셋/스타일/오버라이드/`fanPowerEnabled` 변경을 적용합니다. | 1. `S20_resolveWindParams()`로 파라미터를 재해석하고 변경 시 `true`를 반환합니다. |
| **`_updateWindHistory` / `_getAvgWindFast`** | `void` / `float` | 60초(`HISTORY_SIZE=60`) 순환 버퍼의 누적합(`sumWindHistory`)을 O(1)로 갱신·평균 계산합니다. | 1. 이전 값을 빼고 새 값을 더해 `avgWindCached`를 즉시 산출합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"S10_Simul_0203.h"` / `"A40_Com_Utils_0203.h"`**:
    *   `CL_S10_Simulation` 멤버 및 JSON 안전 추출 헬퍼(`A40_ComFunc`)에 사용됩니다.
*   **`<ArduinoJson.h>` / `<freertos/semphr.h>`**:
    *   차트 배열 직렬화 및 스냅샷 복사 시 동시성 보호에 사용됩니다.
