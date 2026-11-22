# `C10_Config_Sch_LoadSave_0203.cpp` 상세 Spec

## 파트 1/3

## 📚 시스템 아키텍처 명세서: C10_Config_Sch_LoadSave_0203.cpp (Part 1/3)

### 🧩 클래스 및 모듈
*   **`CL_C10_ConfigManager`**:
    *   설명: 스마트 네이처 풍력 설정 관리자(Smart Nature Wind Config Manager)의 핵심 로직을 담당하는 클래스로, 스케줄 데이터를 로드하고 저장하는 기능을 포함합니다.
    *   주요 기능: `loadSchedules()` 메서드를 통해 JSON 파일에서 스케줄 설정을 읽어와 메모리 구조체에 반영합니다.

### 🧱 구조체 및 타입 정의 (Structs & Types)
| 이름 | 유형/역할 | 설명 |
| :--- | :--- | :--- |
| **`ST_A20_SchedulesRoot_t`** | 구조체 (Configuration Root) | 로드된 전체 스케줄 설정을 담는 최상위 컨테이너입니다. `count`와 `items` 배열을 포함합니다. |
| **`ST_A20_ScheduleItem_t`** | 구조체 (Data Item) | 개별 스케줄 항목(시간, 조건 등)의 데이터를 정의하는 구조체입니다. |
| **`JsonDocument`** | JSON 파서 타입 | 로드된 전체 JSON 파일 내용을 메모리상에서 표현하는 객체입니다. |
| **`JsonArrayConst`** | 상수 배열 뷰 (JSON View) | `schedules` 키 아래에 존재하는 스케줄 항목들의 배열(Array)을 읽기 전용으로 접근할 때 사용합니다. |
| **`JsonObjectConst`** | 상수 객체 뷰 (JSON View) | 개별 스케줄 항목(`JsonArrayConst`의 요소) 하나를 Key-Value 쌍 형태로 읽기 전용으로 접근할 때 사용합니다. |

### ⚙️ 함수 및 메서드 시그니처
*   **`bool CL_C10_ConfigManager::loadSchedules(ST_A20_SchedulesRoot_t& p_cfg)`**:
    *   역할: 지정된 JSON 파일 경로에서 스케줄 데이터를 로드하여 `p_cfg` 구조체에 파싱하고 초기화합니다.
    *   반환값: 성공 시 `true`, 실패 또는 타임아웃 발생 시 `false`.
*   **`A20_resetSchedulesDefault(ST_A20_SchedulesRoot_t& p_cfg)`**:
    *   역할: 스케줄 설정 구조체(`p_cfg`)를 공장 초기값(Factory Default)으로## 📚 시스템 아키텍처 명세서: C10_Config_Sch_LoadSave_0203.cpp (계속)

### ⚙️ 함수 및 메서드 시그니처 (계속)
*   **`A20_resetSchedulesDefault(ST_A20_SchedulesRoot_t& p_cfg)`**:
    *   역할: 스케줄 설정 구조체(`p_cfg`)를 공장 초기값(Factory Default)으로 재설정합니다. 데이터 무결성을 보장하기 위해 사용됩니다.
*   **`bool C10_fromJson_ScheduleItem(JsonObjectConst js, ST_A20_ScheduleItem_t& s, bool b_is_active, bool b_has_condition, bool b_has_time)`**:
    *   역할: JSON 객체(`js`)로부터 단일 스케줄 항목의 데이터를 파싱하여 구조체 `s`에 채워 넣습니다.
    *   매개변수:
        *   `js`: 파싱할 개별 스케줄 항목을 담은 상수 JSON 객체 뷰.
        *   `s`: 파싱된 결과를 저장할 참조 구조체 (`ST_A20_ScheduleItem_t&`).
        *   `b_is_active`, `b_has_condition`, `b_has_time`: 해당 항목의 특정 플래그 유무를 체크하는 부울 값 (파싱 로직에 사용됨).
    *   반환값: 파싱 성공 시 `true`, 실패 시 `false`.

### 🔒 상태 및 동기화 특이사항 (State & Synchronization)
| 요소 | 유형/역할 | 설명 |
| :--- | :--- | :--- |
| **`CL_A40_MutexGuard_Semaphore`** | 뮤텍스 가드 (RAII) | `s_recursiveMutex`를 사용하여 스레드 안전성을 확보합니다. 함수 시작 시 락을 획득하고, 범위를 벗어날 때 자동으로 해제(Scope Exit)하여 데드락 위험을 방지합니다. |
| **`s_recursiveMutex`** | 정적 멤버 뮤텍스 | `CL_C10_ConfigManager` 클래스의 전역 자원 접근 시 사용되는 재귀적 뮤텍스입니다. (재진입 가능성 고려) |

### 🛠️ 유틸리티 및 외부 의존성 (Utilities & Dependencies)
| 요소 | 유형/역할 | 설명 |
| :--- | :--- | :--- |
| **`CL_D10_Logger::log(level, format, ...)`** | 로깅 함수 | 시스템의 상태 변화, 경고, 오류 등을 기록하는 전역 로거 유틸리티입니다. (예: `EN_L10_LOG_ERROR`, `EN_L10_LOG_WARN`) |
| **`A40_IO::Load_File2JsonDoc_V21(path, doc, ...)`** | 파일 I/O 함수 | 지정된 경로(`v_cfgJsonPath`)의 파일을 읽어와 메모리상의 `JsonDocument` 객체로 파싱하는 핵심 기능을 수행합니다. |
| **`s_cfgJsonFileMap`** | 정적 멤버 맵 (Config Path) | 설정 파일의 JSON 경로를 관리하는 내부 매핑 구조체입니다. 스케줄 데이터가 저장된 실제 파일 경로(`schedules`)를 제공합니다. |

***

*(참고: 위 분석은 제공된 코드 블록(Part 1/3)에 포함된 모든 핵심 로직과 의존성을 기반으로 작성되었으며, 나머지 파트에는 `saveSchedules`와 같은 다른 메서드 및 구현 세부 사항이 포함될 것으로 예상됩니다.)*

---

## 파트 2/3

## 💻 시스템 구성 요소 명세 (C10_Config_Sch_LoadSave)

### 🧩 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입/역할 | 상세 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 스케줄 설정 관리자. `saveSchedules`와 같은 핵심 로직을 포함하는 클래스입니다. |
| `ST_A20_SchedulesRoot_t` | Struct | 전체 스케줄 데이터의 루트 구조체. 스케줄 목록 및 메타데이터를 담고 있습니다. (예: `count`, `schedules[]`) |
| `JsonDocument` | Type/Library | JSON 데이터를 파싱하고 조작하는 라이브러리 객체입니다. |
| `JsonObject` | Type/JSON Element | JSON 객체 형태의 데이터 컨테이너 (`v_root`). |

### ⚙️ 함수 및 메서드 (Functions & Methods)

#### **1. `CL_C10_ConfigManager::saveSchedules`**
*   **시그니처:** `bool CL_C10_ConfigManager::saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg, bool p_failOnOverlap)`
*   **기능:** 현재 스케줄 데이터를 JSON 형식으로 직렬화하여 저장하는 핵심 로직입니다.
*   **파라미터:**
    *   `p_cfg`: 저장할 스케줄 데이터의 루트 구조체 참조.
    *   `p_failOnOverlap`: 중복 검사 실패 시 저장을 중단할지 여부 (Boolean 플래그).

#### **2. `C10_validateSchedulesLoaded`**
*   **기능:** 로드된 스케줄 데이터의 유효성을 검증합니다. (Load 과정에서 사용)
*   **파라미터:**
    *   `p_cfg`: 검증할 스케줄 루트 구조체.
    *   `__func__`: 현재 함수 이름 (로깅용).

#### **3. `A20_resetSchedulesDefault`**
*   **기능:** 스케줄 데이터를 기본값(Default)으로 초기화합니다.
*   **파라미터:**
    *   `p_cfg`: 초기화할 스케줄 루트 구조체 참조.

#### **4. `C10_validateSchedulesBeforeSave`**
*   **기능:** 저장 직전에 스케줄 데이터의 전반적인 유효성을 검증합니다. (### ⚙️ 함수 및 메서드 (Functions & Methods) - 계속

#### **4. `C10_validateSchedulesBeforeSave`**
*   **기능:** 저장 직전에 스케줄 데이터의 전반적인 유효성을 검증합니다. (예: 필수 필드 누락, 형식 오류 등).
*   **파라미터:**
    *   `p_cfg`: 저장할 스케줄 루트 구조체 참조.
    *   `__func__`: 현재 함수 이름 (로깅용).

#### **5. `C10_validateNoOverlapByDay`**
*   **시그니처:** `bool C10_validateNoOverlapByDay(const ST_A20_SchedulesRoot_t& p_cfg, bool p_failOnOverlap, const char* funcName)`
*   **기능:** 스케줄 간 시간 중복 여부를 검증합니다.
*   **파라미터:**
    *   `p_cfg`: 검사할 스케줄 루트 구조체 참조.
    *   `p_failOnOverlap`: 중복 발견 시 저장을 실패 처리할지 여부 (Boolean 플래그).
    *   `funcName`: 현재 함수 이름 (로깅용).

#### **6. `C10_sortSchedulesBySchNoDesc`**
*   **시그니처:** `void C10_sortSchedulesBySchNoDesc(ST_A20_SchedulesRoot_t& p_cfg)`
*   **기능:** 스케줄 데이터를 스케줄 번호(`SchNo`)를 기준으로 내림차순 정렬합니다. (JSON 직렬화 순서 보장 목적)
*   **파라미터:**
    *   `p_cfg`: 정렬할 스케줄 루트 구조체 참조 (인자로 전달되어 내부적으로 수정됨).

### 🔒 상태 및 동기화 특이사항 (State & Synchronization Details)

| 이름 | 타입/역할 | 상세 설명 |
| :--- | :--- | :--- |
| `s_recursiveMutex` | Mutex | 클래스 멤버 변수로, 스케줄 설정 데이터에 대한 접근을 제어하는 재귀적 뮤텍스입니다. (쓰기 작업 시 사용) |
| `CL_A40_MutexGuard_Semaphore` | RAII Guard | 뮤텍스를 안전하게 획득하고 해제하기 위한 가드 객체입니다. 타임아웃(`G_A40_MUTEX_TIMEOUT_100`)을 설정하여 데드락 방지 및 시간 초과 처리를 합니다. |
| `s_cfgJsonFileMap` | Struct/Member | 현재 사용 중인 JSON 파일 경로 정보를 담고 있는 멤버 변수입니다. (`schedules` 필드를 통해 실제 파일 경로를 관리합니다.) |

### 💡 상수 및 매크로 (Constants & Macros)

*   **`__func__`**: 컴파일러가 제공하는 매크로로, 현재 함수 이름을 문자열 리터럴 형태로 가져와 로깅에 사용됩니다.
*   **`EN_L10_LOG_ERROR`**: 로그 레벨 상수. 에러 메시지를 기록할 때 사용되는 플래그입니다.
*   **`A20_Const::G_JSON_VERSION`**: JSON 파일의 버전 정보를 나타내는 전역 상수입니다. (저장 시 메타데이터로 삽입됨)
*   **`A20_Const::MAX_SCHEDULES`**: 구조체 `ST_A20_SchedulesRoot_t`가 가질 수 있는 최대 스케줄 개수를 정의하는 상수로, 배열 크기 제한에 사용됩니다.

---

## 파트 3/3

### 💾 데이터 타입 및 구조체 (Data Types & Structs)

*   **`ScheduleItem_t`**:
    *   스케줄 항목의 데이터를 담는 구조체입니다.
    *   **멤버 변수:**
        *   `schId`: 스케줄 고유 ID (`uint32_t` 또는 유사 타입).
        *   `schNo`: 스케줄 번호 (정수형).
        *   `name`: 스케줄 이름 (문자열).
        *   `enabled`: 활성화 여부 (Boolean).
        *   `profileId`: 프로필 ID.
        *   `ruleOverride`: 규칙 오버라이드 플래그/값.
        *   `period`: 시간 주기 정보를 담는 구조체 (`Period_t`로 추정).
            *   **멤버 변수:**
                *   `days[]`: 요일별 작동 여부 배열 (7개 요소, `uint8_t`).
                *   `startTime`: 시작 시간 정보.
                *   `endTime`: 종료 시간 정보.

*   **`JsonObject`**: JSON 객체(Key-Value 쌍)를 표현하는 타입입니다. (JSON 라이브러리 의존성).
*   **`JsonArray`**: JSON 배열을 표현하는 타입입니다. (JSON 라이브러리 의존성).
*   **`s_cfgJsonFileMap`**: 전체 설정 정보를 관리하는 맵 또는 구조체입니다.
    *   **멤버 변수:**
        *   `schedules`: 저장할 스케줄 데이터 배열/컨테이너 (`JsonArray` 형태의 데이터를 포함할 것으로 추정).

### ⚙️ 클래스 및 함수 (Classes & Functions)

*   **`A40_IO::Save_JsonDoc2File_V21(...)`**:
    *   JSON 문서 구조체(`s_cfgJsonFileMap.schedules`)를 지정된 파일 경로에 저장하는 정적 메서드입니다.
    *   **매개변수:**
        *   `schedules`: 저장할 JSON 데이터 컨테이너.
        *   `d`: 대상 디렉토리 또는 파일 이름 (문자열).
        *   `bool1`, `bool2`: 추가적인 플래그 값 (저장 옵션).
        *   `__func__`: 현재 함수 이름을 문자열로 전달합니다.

*   **`C10_toJson_TriggerRule(JsonObject& jsonObj, const Rule_t& rule)`**:
    *   규칙(`rule`) 구조체 데이터를 JSON 객체(`jsonObj`)에 직렬화하는 헬퍼 함수입니다. (Phase 2 로직 처리).

### 🔗 특이사항 및 동작 흐름 (Special Notes & Flow)

*   **데이터 직렬### 🔗 특이사항 및 동작 흐름 (Special Notes & Flow)

*   **데이터 직렬화 과정 (Serialization Process)**:
    *   `v_sorted.items[v_i]`를 순회하며 각 `ScheduleItem_t` 구조체(`s`)의 데이터를 JSON 객체로 변환합니다.
    *   새로운 스케줄 항목별 JSON 객체를 생성하고 (`JsonObject js`), 기본 필드(ID, 이름, 활성화 여부 등)를 매핑합니다.
    *   **주기 정보 처리**: `period` 구조체의 요일 배열(`days`)은 7개의 요소로 구성된 JSON 배열로 변환됩니다 (요일별 Boolean 값). 시작 시간과 종료 시간도 별도로 직렬화됩니다.
    *   **규칙 오버라이드 및 규칙 직렬화**: `ruleOverride` 플래그를 직접 매핑하고, 복잡한 `rule` 구조체는 전용 헬퍼 함수인 `C10_toJson_TriggerRule`을 사용하여 JSON 객체에 포함됩니다.

*   **최종 저장 로직 (Final Save Logic)**:
    *   모든 스케줄 항목의 직렬화가 완료된 후, 최종적으로 수집된 모든 스케줄 데이터(`s_cfgJsonFileMap.schedules`)를 파일 시스템에 기록합니다.
    *   `A40_IO::Save_JsonDoc2File_V21` 함수 호출을 통해 JSON 문서 전체를 지정된 경로와 옵션 플래그(디렉토리, 압축 등)를 사용하여 저장하고 성공 여부를 반환합니다.

### ⚠️ 사용된 라이브러리 및 의존성 (Dependencies & Libraries)

*   **JSON 라이브러리**: `JsonObject`, `JsonArray` 타입의 사용으로 보아 Arduino JSON 또는 유사한 임베디드 환경용 JSON 파싱/생성 라이브러리에 강하게 의존합니다.
*   **파일 시스템 I/O**: `A40_IO::Save_JsonDoc2File_V21` 호출을 통해 파일 시스템(FS) 및 직렬화된 데이터를 디스크에 쓰는 기능이 필수적입니다.
