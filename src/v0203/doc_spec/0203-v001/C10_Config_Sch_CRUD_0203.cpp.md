# `C10_Config_Sch_CRUD_0203.cpp` 상세 Spec

## ⚙️ 시스템 아키텍처 스펙 분석 (C10_Config_Sch_CRUD_0203.cpp)

본 소스 파일은 스마트 네이처 풍력 설비의 설정 관리 모듈 중 '일정(Schedule)' 데이터를 CRUD(Create, Read, Update, Delete) 방식으로 처리하는 로직을 담당합니다. 특히 JSON 형태의 외부 입력 데이터를 내부 구조체로 변환하고 전역 상태를 안전하게 업데이트하는 것이 핵심입니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 설정 관리 기능을 구현하는 메인 클래스. 스케줄 추가(`addScheduleFromJson`)와 같은 핵심 비즈니스 로직을 포함합니다. | 전역 상태 접근 시 동기화(Mutex)가 필수적입니다. |
| `JsonDocument` | Type (JSON Library) | JSON 형태의 입력 데이터를 파싱하고 접근하기 위한 컨테이너 객체입니다. | `const` 참조로 전달되어 불변성을 유지합니다. |
| `JsonObjectConst` | Type (JSON Library) | JSON 문서 내 특정 객체를 읽기 전용(Constant)으로 접근할 때 사용됩니다. | 데이터 무결성 보장에 기여합니다. |
| `ST_A20_SchedulesRoot_t` | Struct | 시스템의 모든 스케줄 항목들을 담는 루트 구조체입니다. (전역 상태 관리 대상) | 내부적으로 배열(`items`)과 현재 항목 개수(`count`)를 관리하며, 동적 할당(Dynamic Allocation)을 통해 메모리에 존재합니다. |
| `ST_A20_ScheduleItem_t` | Struct | 단일 스케줄 항목의 데이터를 담는 구조체입니다. (예: 스케줄 ID, 시작 시간 등) | JSON 파싱 결과가 이 구조체에 매핑됩니다. |

### 🔒 동기화 및 상태 관리 (Synchronization & State Management)

| 이름 | 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `s_recursiveMutex` | Mutex Object | 전역 스케줄 데이터(`g_A20_config

## ⚙️ 시스템 아키텍처 명세서: `C10_Config_Sch_CRUD_0203.cpp` (파트 2/3)

### 📚 클래스 및 구조체 정의 (Classes & Structs)

| 이름 | 타입 | 역할 및 설명 |
| :--- | :--- | :--- |
| **`CL_C10_ConfigManager`** | Class | 스케줄 설정(Schedule)의 생성, 조회, 수정, 삭제(CRUD) 로직을 관리하는 핵심 매니저 클래스. `updateScheduleFromJson` 등의 비즈니스 로직이 포함됨. |
| **`JsonDocument`** | Type (External) | JSON 형식 데이터를 파싱하고 접근하기 위한 구조체 또는 인터페이스. (`p_patch`, `js` 등에서 사용). |
| **`CL_A40_MutexGuard_Semaphore`** | RAII Guard | 뮤텍스(Mutex)를 안전하게 획득하고 해제하는 RAII(Resource Acquisition Is Initialization) 패턴의 가드 객체. 스레드 간 동시성 제어에 사용됨. |
| **`ST_A20_SchedulesRoot_t`** | Struct | 전체 스케줄 목록을 담는 루트 구조체. `count` (개수), `items` (실제 데이터 배열) 등의 멤버를 가짐. |
| **`ST_A20_ScheduleItem_t`** | Struct | 개별 스케줄 항목(Schedule Item)의 데이터를 저장하는 구조체. `schId`, `schNo` 등 핵심 속성을 포함함. |

### 💾 전역 및 멤버 상태 변수 (Global & Member State Variables)

| 이름 | 타입 | 접근 범위 | 역할 및 특이사항 |
| :--- | :--- | :--- | :--- |
| **`s_recursiveMutex`** | Mutex Type | `CL_C10_ConfigManager` 멤버 | 스케줄 데이터 구조체(`g_A20_config_root`)에 대한 쓰기 접근을 제어하는 재귀적 뮤텍스(Recursive Mutex). 동시성 제어의 핵심 자원. |
| **`s_dirtyflagSpinlock`** | Spinlock Type | `CL_C10_ConfigManager` 멤버 | 시스템 상태 플래그(`_dirty_schedules`)를 원자적으로 업데이트하기 위해 사용되는 스핀락(Spinlock). 인터럽트 환경에서의 빠른 동기화에 적합. |
| **`g_A20_config_root`** | Global Struct | 전역 변수 | 시스템의 모든 설정 데이터를 담는 루트 구조체. `schedules` 멤버를 통해 실제 스케줄 데이터(`ST_A20_SchedulesRoot_t`)에 접근함. |
| **`v_dirty_schedules`** | State Flag | Local/Member | 현재 설정 상태 중 변경된(Dirty) 스케줄 플래그를 저장하는 변수. `Dirty_setAtomic`을 통해 원자적으로 업데이트됨. |

### 🚀 함수 및 메서

## 🛠️ C10_Config_Sch_CRUD_0203.cpp 파트 3/3 분석 Spec

### 🎯 개요
본 코드는 `CL_C10_ConfigManager` 클래스 내에서 스케줄(Schedule) 데이터를 삭제하는 로직을 구현합니다. 데이터 무결성을 유지하기 위해 뮤텍스와 원자적 플래그 설정을 사용하며, 배열 요소 이동 및 카운트 감소 과정을 포함합니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입/역할 | 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | C10 모듈의 설정 관리자 역할을 수행하는 핵심 클래스. 스케줄 CRUD 작업(삭제 포함)을 담당합니다. |
| `ST_A20_SchedulesRoot_t` | Struct (Implied) | A20 영역에 저장되는 전체 스케줄 목록의 루트 구조체입니다. 실제 스케줄 배열(`items`)과 현재 항목 개수(`count`)를 관리합니다. |
| `g_A20_config_root` | Global/Static | 전역적으로 접근 가능한 A20 설정 데이터의 최상위 포인터 또는 객체입니다. 이 구조체가 모든 스케줄 데이터를 포함합니다. |

### ⚙️ 함수 (Functions)

#### 1. `CL_C10_ConfigManager::deleteSchedule(uint16_t p_id)`
*   **반환 타입:** `bool`
*   **매개변수:**
    *   `p_id` (`uint16_t`): 삭제하고자 하는 스케줄 항목의 고유 ID (Primary Key).
*   **기능 설명:**
    1.  **뮤텍스 획득:** 재귀 뮤텍스(`s_recursiveMutex`)를 사용하여 설정 데이터에 대한 배타적 접근을 확보합니다. 타임아웃 처리가 포함되어 있습니다.
    2.  **검색:** 전역 스케줄 루트 구조체(`g_A20_config_root`) 내에서 `p_id`와 일치하는 스케줄 항목의 인덱스(`v_idx`)를 선형 검색합니다.
    3.  **삭제 및 이동:** 해당 인덱스를 찾으면, 그 뒤에 위치한 모든 요소들을 한 칸씩 앞으로 이동(Shift Left)시켜 배열의 연속성을 유지합니다.
    4.  **카운트 감소:** 스케줄 항목 개수(`v_root.count`)를 1 감소시킵니다.
    5.  **플래그 설정 및 로깅:** 데이터 변경을 알리기 위해 더티 플래그를 원자적으로 설정하고, 성공/실패 여부를 로그로 기록합니다.
*   **특이사항:** 스케줄 삭제 시 배열의 연속성을 유지하기 위해 요소 이동(Shifting) 로직이 필수적입니다.

### 🔒 상태
