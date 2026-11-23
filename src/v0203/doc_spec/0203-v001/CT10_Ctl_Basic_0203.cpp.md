# `CT10_Ctl_Basic_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_Basic_0203.cpp

`CL_CT10_ControlManager`의 **기본 센서(DHT22 온습도) 캐시 조회**, **활성 스케줄 탐색(`findActiveScheduleIndex`)**, **프리셋/스타일 이름 룩업(`findPresetNameByCode`/`findStyleNameByCode`)** 등 기초 헬퍼 메서드를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_SchedulesRoot_t` / `ST_A20_ScheduleItem_t`**
    *   **설명:** 주간 스케줄 루트 및 개별 스케줄(요일 비트마스크, `startTime`/`endTime`) 구조체입니다.
    *   **사용처:** `findActiveScheduleIndex()`에서 현재 시각에 해당하는 활성 스케줄을 탐색할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`getCurrentTemperatureMock` / `getCurrentHumidityMock`** | `float` | `s_dhtCache`에 캐시된 현재 실내 온도(°C) 및 습도(%)를 반환합니다. | 1. 센서 미연결 또는 오류 시 안전 폴백 값을 제공합니다. |
| **`findActiveScheduleIndex`** | `int` | 현재 요일(`tm_wday`)과 시각(`v_curMin`)에 일치하는 최우선 스케줄 인덱스를 반환합니다. | 1. 자정 넘김(야간) 스케줄 판정을 위해 오늘(`v_today`)과 어제(`v_yday`)를 함께 검사합니다. <br>2. `p_allowOverlap` 및 `schNo` 우선순위(`v_bestNo`)로 최적 스케줄을 선택합니다. |
| **`findPresetNameByCode` / `findStyleNameByCode`** | `const char*` | 프리셋/스타일 코드에 해당하는 한글·영문 표시 이름을 반환합니다. | 1. `A22_Com_Lookup_0203.h` 룩업 테이블을 조회합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"A40_Com_Utils_0203.h"`**:
    *   `CL_CT10_ControlManager` 선언 및 `A40_parseHHMMtoMin_24h` 시각 파싱에 사용됩니다.
