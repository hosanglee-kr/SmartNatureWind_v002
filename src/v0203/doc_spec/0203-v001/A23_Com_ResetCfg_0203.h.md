# `A23_Com_ResetCfg_0203.h` 상세 Spec

## 🛠️ A23_Com_ResetCfg_0203.h 상세 기술 명세서

**작성자:** ESP32-S3 임베디드 시스템 아키텍트
**대상 파일:** `A23_Com_ResetCfg_0203.h`
**버전:** 1.0 (분석 기반)
**목적:** Smart Nature Wind 관련 복잡한 설정 구조체(Configuration Structs)를 공통적으로 초기화하거나 기본값으로 리셋하는 역할을 수행합니다.

---

### 📄 1. 파일 역할 요약 (File Role Summary)

본 헤더 파일은 시스템의 다양한 기능 영역(WebSocket, PIR 감지, 스케줄링, 환경 제어 등)에 걸쳐 사용되는 복잡한 설정 구조체(`ST_A20_*`)들을 공통적으로 **안전하고 예측 가능한 기본값(Default State)**으로 초기화하는 정적 인라인 함수들의 집합입니다. 시스템의 부팅 시 또는 특정 리셋 이벤트 발생 시, 설정을 일관되게 재설정하는 핵심 역할을 담당합니다.

### 🧩 2. 주요 구조체 및 타입 (Major Structures and Types)

본 파일은 직접적인 클래스 정의를 포함하지 않으며, 외부에서 정의된 다음의 복잡한 설정 구조체들을 인자로 받아 초기화 작업을 수행합니다.

| 구조체 이름 | 역할/설정 영역 | 설명 |
| :--- | :--- | :--- |
| `ST_A20_WebSocketConfig_t` | WebSocket 통신 설정 | 여러 개의 채널(Channel)별 연결 간격 및 우선순위 등 WS 관련 설정을 관리합니다. |
| `ST_A20_PIR_t` | PIR 센서 감지 설정 | 적외선 센서(PIR)의 활성화 여부, 유지 시간 등을 제어하는 구조체입니다. |
| `ST_A20_TriggerRule_t` | 트리거 규칙 (자동화 로직) | 타이머, 온도 변화, 습도 변화 등 다양한 조건에 기반한 자동 실행 규칙을 정의합니다. 가장 복잡도가 높은 설정 블록 중 하나입니다. |
| `ST_A20_SegmentOverride_t` | 구간 오버라이드 설정 | 특정 시간/구간에 대한 풍속 강도나 변동성 같은 환경 제어 값을 덮어쓰는 설정을 관리합니다. |
| `ST_A20_SchedulePeriod_t` | 스케줄 주기 설정 | 요일별(Day) 작동 여부와 전체 시작/종료 시간을 정의하는 상위 스케줄 구조체입니다. |
| `ST_A20_ScheduleSegment_t` | 스케줄 세그먼트 설정 | 특정 시간대(Minutes)에 대한 상세한 동작을 정의합니다. |

### ⚙️ 3. 주요 함수 및 동작 (Functions and Behavior)

모든 함수는 `static inline` 키워드를 사용하여 컴파일러 레벨에서 인라인 처리를 유도하며, 성능 최적화와 코드 가독성을 동시에 확보하려는 의도가 반영되어 있습니다.

#### 1. `A20_resetWebSocketDefault(ST_A20_WebSocketConfig_t& p_ws)`
*   **동작:** WebSocket 설정 구조체 전체를 기본값으로 초기화합니다.
*   **세부 동작:**
    *   `p_ws.wsChConfig`: 전역 배열 `G_A20_WS_CH_Base_Arr`에 정의된 각 채널의 기본 간격(`chIntervalMs`)과 우선순위(`defaultPriority`)를 순회하며 설정합니다.
    *   `p_ws.wsEtcConfig`: 별도의 전역 상수 `G_A20_WS_ETC_DEFAULT_CONFIG` 값을 할당하여 기타 설정을 초기화합니다.

#### 2. `A20_resetPirDefault(ST_A20_PIR_t& p_pir)`
*   **동작:** PIR 센서 관련 설정을 비활성화하고 기본 상태로 리셋합니다.
*   **세부 동작:**
    *   `p_pir.enabled`: `false`로 설정하여 감지 기능을 즉시 중단시킵니다.
    *   `p_pir.holdSec`: 유지 시간을 0초로 초기화합니다.

#### 3. `A20_resetTriggerRuleDefault(ST_A20_TriggerRule_t& p_rule)`
*   **동작:** 자동화 트리거 규칙 구조체 전체를 기본값으로 리셋하는 가장 복잡한 함수입니다.
*   **세부 동작:**
    *   **전역 초기화:** `memset(&p_rule, 0, sizeof(p_rule))`을 통해 메모리 블록의 대부분을 0으로 초기화합니다.
    *   **타이머/시간 설정:** 타이머(`timer`) 및 Off 시간(`offTime`) 관련 필드를 비활성화하고 시간을 0으로 리셋합니다.
    *   **환경 센서 로직 (TempLow, DiLow):** 온도(Temperature)와 습도(Humidity) 기반의 임계값 감지 기능을 `enabled = false`로 설정하며, 기본 동작 모드(`PAUSE`) 및 초기 임계값을 할당합니다.
    *   **PIR Pause:** PIR 기능 일시 정지 시간을 120초로 고정합니다.
    *   **Smart Comfort:** 스마트 컴포트 기능을 비활성화하고 기본 간격(5분)과 레벨(2)을 설정합니다.

#### 4. `A20_resetSegmentOverrideDefault(ST_A20_SegmentOverride_t & p_ovr)`
*   **동작:** 구간별 환경 제어 오버라이드 설정을 기본값으로 리셋합니다.
*   **세부 동작:**
    *   `p_ovr.enabled`: `false`로 설정하여 오버라이드를 비활성화합니다.
    *   환경 변수 값(풍속 강도, 변동성, 돌풍 빈도)을 `-1.0f`와 같은 **Sentinel Value**를 사용하여 '설정되지 않음' 상태를 명확히 합니다.

#### 5. `A20_resetSchedulePeriodDefault(ST_A20_SchedulePeriod_t & p_period)`
*   **동작:** 스케줄링의 전체 주기 설정을 기본값으로 리셋합니다.
*   **세부 동작:**
    *   `p_period.days`: 모든 요일(`v_d = 0`부터 `6`)에 대해 작동 플래그를 `1`로 설정하여, 주간 활동을 기본적으로 활성화합니다.
    *   시간 범위: 시작 시간은 "00:00", 종료 시간은 "23:59" 문자열을 사용하여 하루 종일 동작하는 기본 범위를 설정합니다. (안전한 문자열 복사 유틸리티 `A40_ComFunc::copyStr2Buffer_safe` 사용)

#### 6. `A20_resetScheduleSegmentDefault(ST_A20_ScheduleSegment_t & p_seg)`
*   **동작:** 스케줄 세그먼트의 기본값을 리셋합니다.
*   **세부 동작:** 구조체 전체를 초기화하고, ID 및 분 단위 설정을 0으로 설정하여 비활성화된 상태로 만듭니다.

### ⚠️ 4. 외부 의존성 / 공유 상태 / 동시성 특이사항 (Dependencies & Constraints)

#### A. 외부 의존성 (External Dependencies)
1.  **헤더 파일:** 프로젝트 내부의 상수 정의 및 유틸리티 함수에 크게 의존합니다. (`A20_Const_*`, `D10_Logger_0203.h`, `A40_Com_Utils_0203.h` 등).
2.  **라이브러리:** Arduino 프레임워크 및 표준 C 라이브러리 함수(`memset`, `strlcpy`)를 사용합니다.
3.  **전역 상수:** 여러 리셋 함수는 전역으로 정의된 배열 또는 상수를 참조하여 기본값을 가져옵니다 (예: `G_A20_WS_CH_Base_Arr`).

#### B. 공유 상태 및 동시성 (Shared State & Concurrency)
*   **공유 상태:** 이 파일의 함수들은 **인자로 받은 구조체(`p_ws`, `p_rule` 등)**를 수정하는 방식으로 동작합니다. 따라서, 만약 여러 태스크(Task)가 동시에 동일한 설정 객체를 참조하여 리셋을 시도할 경우 데이터 경쟁(Data Race)이 발생할 수 있습니다.
*   **권장 사항:** 이 함수들을 호출하기 전에는 해당 구조체에 대한 **뮤텍스(Mutex)** 보호를 적용하거나, 반드시 메인 스레드 또는 단일 제어 태스크 내에서만 실행되도록 보장해야 합니다.

#### C. 구현 규칙 및 아키텍처 제약 (Implementation Constraints)
*   **JSON 처리:** `ArduinoJson v7.x.x` 사용이 필수적이며, JSON 관련 복잡한 함수(예: `createNestedArray`, `containsKey`)의 직접적인 사용은 금지되어 있습니다. 이는 메모리 안전성과 성능 최적화를 위한 제약입니다.
*   **초기화 방식:** 구조체 초기화는 주로 **`memset()` (메모리 0 채우기)**와 **직접 할당(Direct Assignment)** 방식을 조합하여 수행합니다.
*   **안전성:** 문자열 복사 시에는 `A40_ComFunc::copyStr2Buffer_safe`와 같은 안전한 유틸리티 함수를 사용하여 버퍼 오버플로우를 방지하고 있습니다.
