# `C10_Config_Core_0203.cpp` 상세 Spec

## C10_Config_Core_0203.cpp 분석 Spec Sheet (파트 1/12)

본 파일은 Smart Nature Wind Configuration Manager의 핵심 설정 관리 로직을 담당하며, 전역 상태 및 동기화 메커니즘을 정의합니다.

---

### ⚙️ 클래스/구조체 정의 (Types & Structs)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `ST_A20_ConfigRoot_t` | 구조체 | 전체 시스템의 설정(Configuration) 루트를 담는 데이터 구조체입니다. 여러 서브 모듈의 설정을 통합 관리하는 역할을 합니다. |
| `ST_A20_cfg_jsonFile_t` | 구조체 | JSON 파일 경로 매핑 정보를 저장하는 구조체입니다. (예: 어떤 논리적 설정이 물리적 어느 파일에 저장되는지 정의) |

### 🌐 전역 변수 및 상태 (Global Variables & State)

| 이름 | 타입 | 범위 | 설명 |
| :--- | :--- | :--- | :--- |
| `g_A20_config_root` | `ST_A20_ConfigRoot_t` | Global | 시스템 전체의 현재 설정 상태를 담는 전역 루트 구조체입니다. 모든 모듈이 이 객체를 통해 설정을 읽고 씁니다. |

### 🔒 CL_C10_ConfigManager 멤버 변수 (Static Members)

#### 1. Dirty Flag (상태 플래그)
설정 데이터가 변경되었는지 여부를 추적하는 불리언(Boolean) 상태 플래그들입니다. 이 플래그들이 `true`인 경우, 해당 모듈의 설정은 저장(Save)이 필요함을 의미합니다.

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `_dirty_system` | `bool` | 시스템 기본 설정 변경 여부 플래그입니다. |
| `_dirty_wifi` | `bool` | Wi-Fi 관련 설정 변경 여부 플래그입니다. |
| `_dirty_motion` | `bool` | 모션 감지(Motion) 관련 설정 변경 여부 플래그입니다. |
| `_dirty_schedules

## C10\_Config\_Core\_0203.cpp 분석 Spec Sheet

본 파일은 `CL_C10_ConfigManager` 클래스의 핵심 로직을 담당하며, 설정(Configuration) 데이터의 안전한 초기화 및 로딩을 관리합니다.

---

### ⚙️ 멤버 변수 (Static Members & Global State)

| 식별자 | 타입/종류 | 접근 범위 | 설명 |
| :--- | :--- | :--- | :--- |
| `eeMs[PENDING_FREE_SLOTS]` | 구조체 배열 요소 | 전역/정적 | 대기 중인 프리 슬롯(Pending Free Slots) 관련 상태를 저장합니다. 초기값은 `{0, 0}`으로 설정됩니다. |
| `s_pendingFreeCount` | `uint8_t` | 정적 멤버 변수 | 현재 대기 중인 프리 슬롯의 개수를 카운트합니다. (초기값: 0) |
| `s_pendingFreeMux` | `portMUX_TYPE` | 정적 멤버 변수 | `s_pendingFreeCount` 접근을 보호하는 뮤텍스입니다. 초기 상태는 잠금 해제(UNLOCKED)입니다. |
| `s_recursiveMutex` | (뮤텍스 타입) | 정적 멤버 변수 | 클래스의 주요 리소스 접근을 제어하는 재귀 뮤텍스입니다. (`begin()` 함수에서 생성됨). |
| `s_rootSwapMux` | (뮤텍스 타입) | 정적 멤버 변수 | 전역 설정 루트(`g_A20_config_root`)를 스냅샷 방식으로 안전하게 복사할 때 사용되는 뮤텍스입니다. |

### 🛠️ 함수 및 메서드 (Functions & Methods)

#### 1. `C10_allocSection`
*   **종류:** 정적 템플릿 유틸리티 함수 (`template <typename T> static bool`)
*   **목적:** 특정 메모리 섹션에 객체를 할당하는 헬퍼 함수입니다. C++의 `new` 연산자를 사용하여 메모리를 확보하고, 포인터(`p_ptr`)를 안전하게 초기화합니다.
*   **매개변수:**
    *   `T*& p_ptr`: 참조로 전달되어

## 🛠️ 시스템 아키텍처 Spec 분석 보고서 (C10_Config_Core_0203.cpp)

본 코드는 설정 파일(JSON)의 로딩 및 관리 기능을 담당하는 핵심 모듈로 보입니다. C++ RAII 패턴과 뮤텍스 기반 동기화가 명확하게 사용되고 있습니다.

---

### 📚 클래스 (Classes)

| 이름 | 역할/설명 | 특이사항 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | **[핵심 관리자]** 시스템 설정(Configuration) 전체를 로드, 초기화 및 관리하는 메인 클래스입니다. `loadAll()`과 같은 공용 인터페이스를 제공합니다. | 멤버 변수 `s_recursiveMutex`와 관련하여 스레드 안전성을 보장해야 합니다. |
| `CL_A40_MutexGuard_Semaphore` | **[동기화 도구]** 뮤텍스(Mutex) 접근을 RAII(Resource Acquisition Is Initialization) 방식으로 관리하는 가드 객체입니다. 자원 해제(Unlock)를 보장합니다. | 생성자에서 락 획득 시도 및 타임아웃 처리가 핵심 로직입니다. |
| `CL_D10_Logger` | **[로깅 유틸리티]** 시스템의 상태 변화, 오류, 정보 등을 기록하는 전역 또는 싱글톤 로거 클래스입니다. | 다양한 로그 레벨(`EN_L10_LOG_INFO`, `EN_L10_LOG_ERROR`)을 지원합니다. |
| `A40_ComFunc` | **[공통 기능]** JSON 구조체에서 문자열 값을 복사하는 공통 함수를 제공하는 네임스페이스 또는 클래스로 보입니다. | 데이터 추출 및 검증 로직이 포함되어 있습니다. |

### 🧱 구조체 (Structs)

| 이름 | 역할/설명 | 특이사항 |
| :--- | :--- | :--- |
| `ST_A20_ConfigRoot_t` | **[최상위 설정 루트]** 모든 하위 설정 섹션(system, wifi, motion 등)을 담는 최상위 컨테이너 구조체입니다. | 각 필드(`system`, `wifi`, `motion` 등)가 별도의 설정 데이터를 포함하는 서브-섹션을 나타냅니다. |
| `s_cfgJsonFileMap` | **[멤버 변수]** JSON 파일의 키(Key)와 해당 섹션이 저장될 경로를 매핑한 맵 구조체입니다. (실제 타입은 명시되지 않았으나, Map 또는 Struct 형태가 예상됨). | 설정 항목 이름과 관련된 문자열 데이터를 저장합니다. |

### ⚙️ 함수 및 메서드 (Functions & Methods)

#### `CL_C10_ConfigManager` 멤버 함수
*   **`loadAll(ST_A20_ConfigRoot_t& p_root)`**:
    *   **역할:** 시스템

## 📝 코드 분석 Spec (C10_Config_Core_0203.cpp - 파트 4/12)

### 📂 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `CL_D10_Logger` | Class | 로깅 기능을 제공하는 유틸리티 클래스. 로그 레벨(`EN_L10_LOG_ERROR`, `EN_L10_LOG_INFO`)을 사용하여 메시지를 기록함. |
| `CL_C10_ConfigManager` | Class | 시스템 설정 관리(Configuration Management)를 담당하는 핵심 매니저 클래스. |
| `ST_A20_ConfigRoot_t` | Struct | 전체 구성 설정을 담는 루트 구조체. 각 모듈별 섹션 포인터(`system`, `wifi`, `motion` 등)와 할당된 데이터를 포함함. |

### ⚙️ 함수 및 메서드 (Functions & Methods)

#### **[Config 초기화/로드 관련]**
| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `C10_allocSection` | Function | 지정된 섹션 이름을 사용하여 `ST_A20_ConfigRoot_t` 내에 메모리 영역을 할당하고 초기화하는 함수. |
| `freeAll` | Function | 루트 구조체(`p_root`)가 가지고 있는 모든 동적 할당 섹션을 해제(Free)하여 메모리를 정리함. |
| `A20_reset*Default` | Function (Group) | 시스템, Wi-Fi, 모션 등 각 하위 모듈의 설정을 공장 초기값(Default Value)으로 리셋하는 함수 그룹. (예: `A20_resetSystemDefault`) |
| `load*Config` | Function (Group) | 시스템, Wi-Fi, 스케줄 등 각 섹션별로 실제 설정 파일이나 NVS에서 데이터를 로드하여 메모리에 반영하는 함수 그룹. (예: `loadWifiConfig`, `loadSchedules`) |

#### **[CL_C10_ConfigManager 멤버 메서드]**
| 이름 | 반환형 | 매개변수 | 설명 |
| :--- | :--- | :--- | :--- |
| `freeLazySection` | `bool` | `const char* p_section`, `ST_A20_ConfigRoot_t& p_root` | 특정 섹션 이름(`p_section`)을 받아 해당 섹션을 동적으로 해제(Delete)하는 함수. 메모리 누수 방지 및 부분 초기화에 사용됨. |

### 🔒 상태 및 동기화 특이사항 (State & Synchronization)

| 요소 | 유형 | 역할/설명 |
| :--- | :--- | :--- |
| `s_recursiveMutex` | Static Member Variable | `CL_C10_ConfigManager` 클래스의 정적 멤버 변수로, 다중 스레드 환경에서 설정 해제(`freeLazySection`) 작업의 원자성(Atomicity)을

## ⚙️ 코드 분석 명세서 (C10\_Config\_Core\_0203.cpp)

**아키텍트:** ESP32-S3 C++17 임베디드 시스템 아키텍트
**분석 대상:** `CL_C10_ConfigManager` 클래스 관련 메서드 및 구조체
**언어/규약:** C++, 한국어 마크다운

---

### 📚 주요 타입 정의 (Structs & Classes)

| 이름 | 유형 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `CL_C10_ConfigManager` | 클래스 | 시스템 설정 관리자 역할을 수행하는 핵심 클래스. 메모리 해제 및 임시 대기 큐 관리를 담당합니다. | - |
| `ST_A20_ConfigRoot_t` | 구조체 | 전체 시스템 설정을 담는 루트 컨테이너 구조체입니다. 동적으로 할당된 다양한 서브 모듈(시스템, Wi-Fi 등)의 포인터를 포함합니다. | **멤버 변수:** `system`, `wifi`, `motion`, `nvsSpec`, `windDict`, `schedules`, `userProfiles`, `webPage` (모두 포인터 타입) |
| `CL_A40_MutexGuard_Semaphore` | RAII 가드 | 뮤텍스(Mutex)를 안전하게 획득하고 해제하는 자원 관리 객체입니다. 스레드 간 동기화에 사용됩니다. | **특징:** Scope Guard 패턴 적용 (RAII). |

### 🛠️ 함수 및 메서드 명세 (Functions & Methods)

#### 1. `CL_C10_ConfigManager::freeAll(ST_A20_ConfigRoot_t& p_root)`
*   **기능:** 주어진 설정 루트 구조체(`p_root`) 내에 포함된 모든 동적 할당 객체들을 순차적으로 해제합니다.
*   **동작 원리:** 멤버 포인터가 가리키는 객체들이 `nullptr`이 아닌 경우, 해당 객체를 `delete` 연산자로 메모리에서 해제하고, 이후 포인터를 `nullptr`로 설정하여 이중 해제를 방지합니다.
*   **사용되는 동기화 장치:** `s_recursiveMutex` (재귀 뮤텍스)를 사용하며, `CL_A40_MutexGuard_Semaphore`를 통해 접근을 보호합니다.

#### 2

## 💻 C10_Config_Core_0203.cpp 분석 결과 (파트 6/12)

본 코드는 `CL_C10_ConfigManager` 클래스 내에서 시스템의 설정(Configuration) 상태를 관리하고, 주기적으로 만료되거나 변경된 설정을 저장 및 처리하는 로직을 담당합니다. 임베디드 환경에 최적화된 동기화 메커니즘과 원자적 연산이 다수 사용되었습니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 설정 관리의 핵심 로직을 담는 메인 클래스. 설정을 저장하고 만료된 항목을 처리하는 기능을 제공합니다. |
| `ST_A20_ConfigRoot_t` | Struct | 만료되거나 처리가 필요한 임시 설정 루트 구조체입니다. (Expired Config Root) |
| `ST_A20_SystemConfig_t` | Struct | 시스템 전반의 설정을 담는 구조체입니다. (`saveSystemConfig`에서 사용됨) |

### ⚙️ 멤버 변수 및 상태 (State Variables & Members)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `s_pendingFreeMux` | Mutex/Lock | 대기 중인 Free 설정 항목(`s_pendingFree`, `s_pendingFreeMs`)에 대한 접근을 보호하는 뮤텍스입니다. (Critical Section 제어) |
| `s_pendingFreeCount` | `uint8_t` | 현재 유효하게 남아있는 대기 Free 설정 항목의 개수입니다. |
| `s_pendingFree[]` | Array (`s_pendingFree[i]`) | 만료 처리가 지연되어 보관 중인 실제 설정 데이터 배열입니다. |
| `s_pendingFreeMs[]` | Array (`s_pendingFreeMs[i]`) | 각 대기 Free 항목이 등록된 시간(밀리초)을 저장하는 배열입니다. |
| `s_recursiveMutex` | Mutex/Lock | 재귀적 잠금 메커니즘을 사용하는

## 🛠️ C++17 임베디드 시스템 아키텍처 분석 Spec

### 📂 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입/역할 | 설명 |
| :--- | :--- | :--- |
| `ConfigManager` | Class | 설정(Configuration) 관리의 핵심 로직을 담당하는 클래스. 다양한 모듈의 설정을 저장하고 상태를 확인합니다. (멤버 함수: `saveWifiConfig`, `trySave`, `getDirtyStatus`) |
| `ST_A20_WifiConfig_t` | Struct/Type | Wi-Fi 관련 설정 데이터를 담는 구조체입니다. |
| `ST_A20_MotionConfig_t` | Struct/Type | 모션 감지(Motion) 관련 설정 데이터를 담는 구조체입니다. |
| `ST_A20_NvsSpecConfig_t` | Struct/Type | NVS (Non-Volatile Storage) 사양 설정을 담는 구조체입니다. |
| `ST_A20_SchedulesRoot_t` | Struct/Type | 스케줄링(Schedules) 관련 루트 설정 데이터를 담는 구조체입니다. |
| `ST_A20_UserProfilesRoot_t` | Struct/Type | 사용자 프로필(User Profiles) 관련 루트 설정 데이터를 담는 구조체입니다. |
| `ST_A20_WindDict_t` | Struct/Type | 풍향 사전(Wind Dictionary) 설정을 담는 구조체입니다. |
| `ST_A20_WebPageConfig_

## ⚙️ 시스템 아키텍처 명세서 (C10_Config_Core_0203.cpp - 파트 8/12)

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 시스템 설정 관리 기능을 담당하는 핵심 클래스. `saveAll` 메서드를 포함합니다. |
| `ST_A20_ConfigRoot_t` | Struct/Type | 모든 구성 설정을 담는 루트 구조체입니다. (시스템, Wi-Fi, 모션 등 개별 설정 블록을 포인터로 가짐) |
| `CL_D10_Logger` | Class | 로깅 기능을 제공하는 클래스. 로그 레벨(에러, 정보)과 메시지를 기록합니다. |

### 🛠️ 함수 및 메서드 (Functions & Methods)

#### **클래스 멤버/유틸리티 함수**
*   `CL_C10_ConfigManager::saveAll(const ST_A20_ConfigRoot_t& p_root)`:
    *   **기능:** `p_root`에 담긴 모든 개별 구성 설정들을 순차적으로 저장하는 메인 로직을 수행합니다.
    *   **반환값:** 성공 시 `true`, 실패(뮤텍스 타임아웃 또는 일부 설정 저장 실패) 시 `false`.
    *   **주요 동작:** 각 설정을 개별 함수(`saveSystemConfig` 등)를 통해 저장하고, 전체 성공/실패 여부를 집계합니다.

#### **헬퍼 함수 (Helper Functions)**
*   `track`: `saveAll` 내부에서 정의된 람다(Lambda) 함수입니다. 특정 설정 항목의 저장 성공/실패 여부를 기록하고 카운트를 증가시키는 역할을 합니다.
*   `A40_ComFunc::Dirty_readAtomic(...)`: (Static Method) 해당 키-값 쌍의 변경 플래그(`dirty`)를 원자적으로 읽어오는 통신 유틸리티 함수입니다.

### 🔒 동기화 및 상태 관리 특이사항 (Synchronization & State Management)

| 이름 | 타입/유형 | 역할 | 상세 설명 |
| :--- | :--- | :--- | :--- |
| `s_recursiveMutex` | Recursive Mutex | **재귀 뮤텍스** | 전체 설정 저장 과정(`saveAll`)을 보호하는 데 사용됩니다. 재진입이 가능하여 안전성을 높입니다. |
| `CL_A40_MutexGuard_Semaphore v_MutxGuard` | RAII Guard | **뮤텍스 획득 관리자** | `s_recursiveMutex`를 RAII(Resource Acquisition Is Initialization) 방식으로 획득하고, 스코프를 벗어날 때 자동으로 해제합니다.

## ⚙️ 코드 분석 Spec: `C10_Config_Core_0203.cpp` (파트 9/12)

본 파트에는 시스템 설정 구조체(`ST_A20_ConfigRoot_t`)의 모든 구성 요소를 JSON 형식으로 직렬화(Serialization)하여 외부로 내보내는 핵심 로직이 포함되어 있습니다. 다수의 서브 모듈 설정을 안전하게 접근하기 위해 뮤텍스 보호 메커니즘을 사용합니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입/역할 | 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 시스템의 전체 설정(Configuration) 관리를 담당하는 매니저 클래스. JSON 내보내기(`toJson_All`)와 같은 핵심 기능을 포함합니다. |
| `ST_A20_ConfigRoot_t` | Struct/Type | 애플리케이션의 모든 구성 요소(System, Wi-Fi, Motion 등)를 담고 있는 최상위 루트 설정 구조체입니다. (포인터 멤버 변수를 가짐) |
| `JsonDocument&` | Reference Type | JSON 데이터를 저장하고 조작하는 객체 참조입니다. 이 파라미터를 통해 모든 서브 모듈의 데이터가 하나의 통합된 JSON 문서로 병합됩니다. |

### 🛠️ 함수 (Functions)

#### 1. `CL_C10_ConfigManager::toJson_All`
*   **시그니처:** `void CL_C10_ConfigManager::toJson_All(const ST_A20_ConfigRoot_t& p, JsonDocument& p_doc, bool p_includeSystem, ..., bool p_includeWebPage)`
*   **역할:** 루트 설정 구조체(`p`)에 포함된 모든 서브 모듈의 설정을 지정된 플래그(Boolean)를 기반으로 선택적으로 JSON 문서(`p_doc`)에 직렬화합니다.
*   **핵심 로직:**
    1.  `CL_A40_MutexGuard_Semaphore`를 사용하여 재귀 뮤텍스(`s_recursiveMutex`)를 획득하여 데이터 무결성을 보장합니다.
    2.  각 서브 모듈별로 포함 여부 플래그와 해당 포인터가 유효한지(NULL 체크)를 확인하고, 조건에 따라 전용 `toJson_*` 함수들을 호출하여 데이터를 JSON 문서에 추가합니다.

#### 2. 내부 직렬화 Helper Functions (Implied)
*   **`toJson_System`**: 시스템 관련 설정을 JSON으로 변환합니다.
*   **`toJson_Wifi`**: Wi-Fi 관련 설정을 JSON으로 변환합니다.
*   **`toJson_Motion`**: 모션 감지(Motion) 관련 설정을 JSON으로 변환합니다.
*   **`toJson_NvsSpec`**: NVS (Non-Volatile Storage) 스펙 관련 설정을 JSON으로 변환합니다.
*   **`toJson_Schedules`**: 예약 스케줄링 관련 설정을 JSON으로 변환합니다.
*   **`toJson_UserProfiles`**: 사용자 프로필 관련 설정을 JSON으로 변환합니다.
*   **`toJson_WindDict`**: 풍향

## 🛠️ 코드 분석 Spec: `CL_C10_ConfigManager::factoryResetFromDefault()`

본 코드는 설정 파일(Configuration)을 기본값으로 초기화하고 저장하는 핵심 로직을 담고 있습니다. 임베디드 시스템의 안정적인 리소스 접근과 데이터 직렬화/역직렬화를 다루는 부분이 많으므로, 각 요소의 역할 정의가 중요합니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 설정 관리 기능을 담당하는 메인 매니저 클래스. 이 함수는 해당 클래스의 멤버 함수입니다. | 핵심 로직 수행 주체 |
| `JsonDocument` | Type/Class | JSON 데이터를 메모리상에서 표현하고 조작하기 위한 구조체 또는 클래스 타입 (예: nlohmann::json 라이브러리 기반). | 데이터 직렬화/역직렬화 사용 |
| `CL_A40_MutexGuard_Semaphore` | Class | 뮤텍스(Mutex)를 안전하게 획득하고 해제하는 RAII(Resource Acquisition Is Initialization) 가드 객체. 스레드 간 동시 접근을 제어합니다. | **락 메커니즘** |
| `s_cfgJsonFileMap` | Static Member/Struct | 시스템의 다양한 설정 영역(system, wifi, motion 등)별로 저장된 JSON 파일 경로 또는 관련 정보를 담고 있는 구조체입니다. | 전역 상태 관리 |

### ⚙️ 함수 및 메서드 (Functions & Methods)

| 이름 | 유형 | 호출 주체 | 설명 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `CL_C10_ConfigManager::factoryResetFromDefault()` | Member Function | `CL_C10_ConfigManager` | 시스템 설정을 기본값으로 초기화하고, 이를 파일에 저장하는 메인 진입점 함수입니다. 뮤

## ⚙️ C10_Config_Core_0203.cpp 파트 11/12 분석 Spec

본 코드는 설정 파일(Configuration)의 로딩, 저장 및 초기화 과정을 담당하는 핵심 로직을 포함하고 있습니다. 주로 JSON 데이터 구조 처리와 시스템 리소스 할당에 초점을 맞추고 있습니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 유형 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `JsonDocument` | 구조체/클래스 | JSON 데이터를 메모리상에서 표현하고 조작하는 핵심 데이터 컨테이너입니다. 설정값 로딩 및 저장 과정의 주체가 됩니다. | 내부적으로 JSON 파싱 라이브러리를 사용합니다. |
| `A40_IO` | 클래스 | 파일 입출력(I/O) 관련 유틸리티를 제공하는 정적(Static) 클래스로 추정됩니다. 특히 JSON 데이터를 실제 파일 시스템에 저장하는 기능을 담당합니다. | **핵심 기능:** `Save_JsonDoc2File_V21`을 통해 구현됩니다. |
| `CL_D10_Logger` | 클래스 | 애플리케이션 전반의 로깅(Logging) 기능을 제공하는 유틸리티입니다. 다양한 심각도 레벨로 로그를 기록합니다. | **사용:** 정적 메서드 호출(`::log`)을 통해 사용됩니다. |
| `g_A20_config_root` | 전역 구조체/객체 | 시스템의 모든 설정 섹션(System, WiFi, Motion 등)을 담고 있는 최상위 루트 컨테이너입니다. 이 객체의 멤버들이 개별 설정을 관리합니다. | **특징:** 여러 하위 모듈의 설정을 통합적으로 관리하는 역할을 수행하며, 초기화 시 `C10_allocSection`이 호출됩니다. |

### 🛠️ 함수 및 메서드 (Functions & Methods)

| 이름 | 클래스/범위 | 반환값 | 설명 |
| :--- | :--- | :--- | :--- |
| `A40_IO::Save_JsonDoc2File_V21` | `A40_IO` | `bool` | 주어진 JSON 문서(`v_doc`)를 지정된 파일 경로에 저장합니다. 성공 여부를 반환하며, 설정값 저장의 핵심 로직입니다. |
| `C10_allocSection` | (Scope) | `bool` | 전역 설정 루트 객체 내부에 특정 이름과 목적을 가진 설정을 위한 섹션(Section)을 할당하고 초기화합니다. 성공 시 `true`, 실패 시 `false`를 반환합니다. |
| `CL_D10_Logger::log` | `CL_D10_Logger` | (void) | 지정된 로그 레벨과 메시지 포맷에 따라 시스템 로그를 기록합니다. 오류, 경고 등 상황별로

## ⚙️ 코드 분석 명세서 (C10\_Config\_Core\_0203.cpp - Part 12/12)

본 파트에서는 시스템의 최종적인 초기화 및 정리(Factory Reset) 로직이 구현되어 있습니다. 주로 메모리 해제, 설정 파일 로드 실패 처리, 기본값 적용, 그리고 NVS 상태를 안전하게 정리하는 과정에 초점을 맞추고 있습니다.

---

### 📚 클래스/구조체 (Classes / Structs)

| 식별자 | 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `CL_D10_Logger` | Class | 디바이스 로거(Device Logger) 유틸리티 클래스. 시스템 로그 기록에 사용됩니다. | 정적 메서드(`log`)를 통해 접근합니다. |
| `CL_N10_NvsManager` | Class | Non-Volatile Storage (NVS) 관리를 담당하는 매니저 클래스입니다. | NVS 상태 초기화 및 정리 로직을 포함합니다. |
| `s_cfgJsonFileMap` | Struct/Global | 시스템 설정 JSON 파일 경로 맵 구조체입니다. | `system` 멤버를 통해 현재 시스템의 설정 파일 유무를 확인하는 데 사용됩니다. |

### 🛠️ 함수/메서드 (Functions / Methods)

| 식별자 | 유형 | 매개변수 | 설명 |
| :--- | :--- | :--- | :--- |
| `freeAll` | Function | `g_A20_config_root` | A20 설정 구조체(`g_A20_config_root`)가 할당한 모든 메모리를 해제합니다. (메모리 누수 방지) |
| `_loadCfgJsonFile` | Function | 없음 | JSON 형식의 설정 파일을 로드하는 내부 함수입니다. 파일 로드 실패 시 처리가 필요합니다. |
| `CL_D10_Logger::log` | Static Method | 로그 레벨, 메시지 문자열 | 지정된 로그 레벨(ERROR, INFO 등)로 시스템 메시지를 기록합니다. |
| `A20_resetToDefault` | Function | `g_A20_config_root` | A20 관련 설정을 공장 출하 기본값(Hardcoded Defaults)으로 초기화합니다. |
|
