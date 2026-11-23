# `CT10_Monitor_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Monitor_0203.cpp

`CL_MON_Monitor`의 **PSRAM Warm 링버퍼(1시간 @ 1초 풍속 `WIND_CAP=3600`, 30초 센서 `SENSOR_CAP=120`, 200-entry 상태/설정/시스템)** 할당, **5분 버킷 집계(`_aggregateWind`/`_aggregateSensor`)**, **LittleFS Cold 파일 배치 플러시(`flushCold`)** 및 **범위별 조회(`queryWind`/`queryState`/`queryConfig`/`querySensor`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_MON_Snapshot_t` / `ST_MON_WindRaw_t` / `ST_MON_SensorRaw_t` / `ST_MON_FileHeader_t`**
    *   **설명:** 실시간 틱 스냅샷, 1초 풍속/PWM/돌풍/열기포 원본 샘플, 30초 온습도/PIR 샘플, LittleFS 바이너리 링버퍼 파일 헤더 구조체입니다.
    *   **사용처:** `tick()`, `_captureWind()`, `flushCold()`, `queryWind()`에서 Warm/Cold 이력 저장 및 조회에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin`** | `bool` | `_allocPsram`으로 PSRAM Warm 링버퍼를 할당하고 LittleFS Cold 파일 헤더를 초기화합니다. | 1. PSRAM 미지원 시 안전하게 비활성화(`s_enabled = false`)합니다. |
| **`tick`** | `void` | 매 틱마다 풍속(1초), 센서(30초), 상태/설정 변경을 캡처하고 1시간마다 `flushCold()`를 실행합니다. | 1. `_captureWind`, `_captureSensor`, `_captureStateChange`, `_captureConfigChanges`를 순차 호출합니다. |
| **`_aggregateWind` / `_aggregateSensor`** | `void` | 1초/30초 원본 샘플을 5분(300초) 버킷으로 집계합니다. | 1. `bucket = (t / 300) * 300` 기준으로 평균/최소/최대 및 돌풍·열기포 카운트를 누적합니다. |
| **`flushCold`** | `void` | Warm 버퍼의 상태·설정·시스템 이벤트 및 5분 집계 데이터를 LittleFS Cold 파일에 기록합니다. | 1. `_appendFile()`로 바이너리 링버퍼 파일 헤더(`h.head`)를 갱신하며 순환 저장합니다. |
| **`queryWind` / `queryState` / `queryConfig` / `querySensor`** | `void` | 요청 범위(`p_range`: 1h/6h/24h/7d)에 맞는 이력 데이터를 `JsonDocument`로 반환합니다. | 1. `_rangeToIntervalSec()`로 해상도를 결정해 Warm 또는 Cold 데이터를 병합 출력합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Monitor_0203.h"` / `<esp_heap_caps.h>`**:
    *   `CL_MON_Monitor` 선언 및 `heap_caps_malloc(..., MALLOC_CAP_SPIRAM)` PSRAM 할당에 사용됩니다.
*   **`<LittleFS.h>` / `<FS.h>` / `<time.h>`**:
    *   7일 Cold 이력 바이너리 파일 I/O 및 Epoch 타임스탬프(`_nowEpoch`) 기록에 사용됩니다.
*   **`"A40_Com_Utils_0203.h"` / `"D10_Logger_0203.h"`**:
    *   유틸리티 및 PSRAM/파일 오류 로깅에 사용됩니다.
