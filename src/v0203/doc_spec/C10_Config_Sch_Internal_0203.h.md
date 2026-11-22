# `C10_Config_Sch_Internal_0203.h` 상세 Spec

## 파트 1/2

## 🛠️ C10\_Config\_Sch\_Internal\_0203.h 분석 Spec

본 헤더 파일은 스케줄(Schedule) 관련 내부 유틸리티 함수들의 선언을 포함하며, 주로 데이터 구조체(`ST_A20_SchedulesRoot_t`, `ST_A20_ScheduleItem_t`)를 기반으로 ID 및 번호의 중복 검사, 재발급, 그리고 JSON 파싱 기능을 제공합니다.

---

### ⚙️ 전역 상태/플래그 정의 (Preprocessor Macros)

이 매크로들은 컴파일 타임에 스케줄 ID 및 시퀀스 관리를 위한 기본 시작 값(Start Value)을 설정하는 역할을 합니다. 이는 파일 분할 구조에서 일관된 초기화 값을 보장합니다.

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `G_C10_SCH_ID_START` | `#define` | 스케줄 ID(Schedule ID)의 기본 시작 값 (1). |
| `G_C10_SCH_ID_STEP` | `#define` | 스케줄 ID 증가 간격 (1). |
| `G_C10_SEG_ID_START` | `#define` | 세그먼트 ID(Segment ID)의 기본 시작 값 (1). |
| `G_C10_SEG_ID_STEP` | `#define` | 세그먼트 ID 증가 간격 (1). |

### 💻 함수 선언 (Function Declarations)

#### 1. 스케줄 및 시퀀스 관리 유틸리티 함수

| 이름 | 반환 타입 | 매개변수 | 설명 |
| :--- | :--- | :--- | :--- |
| `C10_nextScheduleId_u8` | `uint8_t` | `const ST_A20_SchedulesRoot_t& p_root` | 주어진 스케줄 루트 구조체(`p_root`)를 기반으로 다음 사용 가능한 스케줄 ID를

---

## 파트 2/2

## 📚 C10_Config_Sch_Internal_0203.h 분석 Spec

### 📂 구조체/타입 정의 (Structs/Types)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `ST_A20_SchedulesRoot_t` | `struct` | 스케줄(Schedule) 설정을 담는 루트 데이터 구조체입니다. 모든 검증 및 정렬 작업의 대상이 됩니다. |

### ⚙️ 함수 프로토타입 (Function Prototypes)

#### 1. `C10_validateSchedulesLoaded`
*   **반환형:** `bool`
*   **매개변수:**
    *   `const ST_A20_SchedulesRoot_t& p_root`: 검증할 스케줄 데이터의 루트 구조체 (읽기 전용).
    *   `const char* p_callerForLog`: 로그 기록을 위한 호출자 정보 문자열.
*   **설명:** 시스템에 로드된 스케줄 데이터를 최종적으로 검증합니다. 필수 필드 존재 여부, 0 값 금지, 중복 데이터 유무, 그리고 설정 범위 내 포함 여부를 종합적으로 확인하는 역할을 수행합니다.

#### 2. `C10_validateSchedulesBeforeSave`
*   **반환형:** `bool`
*   **매개변수:**
    *   `const ST_A20_SchedulesRoot_t& p_cfg`: 저장 직전 검증할 스케줄 데이터의 루트 구조체 (읽기 전용).
    *   `const char* p_callerForLog`: 로그 기록을 위한 호출자 정보 문자열.
*   **설명:** 데이터를 실제로 저장(Save)하기 직전에 수행하는 최종 검증 함수입니다. 내부적으로 `C10_validateSchedulesLoaded`를 위임하여 데이터의 무결성을 재확인합니다.

#### 3. `C10_validateNoOverlapByDay`
*   **반환형:** `bool`
*   **매개변수:**
    *   `const ST_A20_SchedulesRoot_t& p_root`: 시간 중복 검증을 수행할 스케줄 데이터의 루트 구조체 (읽기 전용).
    *   `bool p_failOnOverlap`: 시간 구간 겹침(Overlap) 발생 시 오류 처리를 할지 여부를 결정하는 플래그. (`true`일 경우 실패 처리).
    *   `const char* p_callerFunc`: 로그 기록을 위한 호출자 함수명 문자열.
*   **설명:** 날짜 경계를 넘나드는(cross-midnight) 시간 구간에 대해 스케줄 간의 중복 여부를 검증합니다.

#### 4. `C10_sortSchedulesBySchNoDesc`
*   **반환형:** `void`
*   **매개변수:**

