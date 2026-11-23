# `C10_Config_0203.h` 상세 Spec

## 📝 `C10_Config_0203.h` 분석 보고서 (파트 1/2)

본 파일은 Smart Nature Wind 전체 설정을 관리하는 핵심 매니저 클래스 및 관련 정의들을 포함하고 있습니다. 특히 FreeRTOS의 동기화 프리미티브(Mutex, Semaphore)와 지연 처리 로직(`queuePendingFree`)이 복잡하게 얽혀 있어, 각 구성 요소의 역할과 사용 규칙을 명확히 파악하는 것이 중요합니다.

---

### ⚙️ 전역 및 타입 정의 (Global & Type Definitions)

#### 1. 열거형 (Enums)
| 이름 | 유형 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `EN_C10_NoOverlapPolicy_t` | `enum` | **[C10] NoOverlap 검증 정책 플래그**<br>스케줄 간의 시간 중복(Overlap)을 처리하는 정책을 정의합니다. | - `FAIL_ON_OVERLAP`: 겹치면 실패 반환 (저장 중단).<br>- `WARN_ONLY`: 겹쳐도 계속 진행하며 경고만 발생.<br>- `SKIP_DISABLED`: 비활성화된 스케줄은 검사에서 제외. |

#### 2. 구조체 (Structs)
| 이름 | 유형 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `ST_C10_NoOverlapResult_t` | `struct` | **[C10] NoOverlap 검증 결과**<br>스케줄 중복 검사(Validation)의 결과를 담는 구조체입니다. | - `ok`: 최종 검증 성공 여부 (`bool`).<br>- `overlapCount`: 발견된 중복 개수 (대략적인 값).<br>- `checkedCount`: 실제로 검사한 스케줄 항목 수. |
| `ST_A20_ConfigRoot_t` | `struct` | **(외부 정의)**<br>전체 설정의 루트 구조체입니다. 다양한 모듈별 설정을 포함하는 최상위 컨테이너 역할을 합니다. | - 이 파일에서는 `extern`으로 선언되어 외부(`A20_Const_0203.h`)에서 정의됩니다.<br>- **핵심 데이터**: 모든 구성 요소 설정의 집합체입니다. |

#### 3. 전역 변수 (Global Variables)
| 이름 | 유형 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `g_A20_config_root` | `ST_A20_ConfigRoot_t` | **(외부 정의)**<br>시스템 전체의 현재 설정 상태를 담는 전역 루트 구조체입니다. 모든 모듈이 이 데이터를 참조합니다. | - `extern`으로 선언되어 외부에서 초기화 및 접근됩니다.<br>- 데이터 무결성 유지를 위해 복잡한 동기화 메커니즘(Mutex, Critical Section)이 적용됨을 암시합니다. |

---

### 💻 클래스 정의 (Class Definition)

#### CL_C10_ConfigManager
**역할:** Smart Nature Wind의 모든 설정 데이터를 로드, 저장, 패치, JSON 변환하는 중앙 관리자(Manager) 역할을 수행합니다.

| 멤버 유형 | 이름 | 반환/인자 타입 | 설명 및 특이사항 |
| :--- | :--- | :--- | :--- |
| **Public Static Method** | `begin()` | `bool` | 클래스 초기화 및 시스템 시작 여부를 확인하는 진입점 함수입니다. (정적 팩토리 패턴 사용 예상) |
| **Public Static Getter** | `getCfgJsonFileMap()` | `const ST_A20_cfg_jsonFile_t&` | 설정 파일 매핑 정보를 제공합니다. 이 맵을 통해 어떤 섹션이 JSON 기반으로 관리되는지 확인합니다. |
| **Public Static Method** | `loadAll(p_root)` | `bool` | 모든 모듈의 설정을 로드하여 주어진 루트 구조체(`p_root`)에 채웁니다. (전체 설정 초기화) |
| **Public Static Method** | `freeLazySection(p_section, p_root)` | `bool` | 특정 섹션만 메모리에서 해제합니다. Lazy-Load 하이브리드 구성의 핵심 로직입니다. |
| **Public Static Method** | `freeAll(p_root)` | `void` | 모든 설정 데이터를 메모리에서 즉시 해제합니다. (주의: 지연 Free와 상호작용) |
| **Public Static Method** | `queuePendingFree(p_old)` | `void` | **[지연 Free 로직]** 설정을 즉시 해제하는 대신, 나중에 안전하게 해제할 큐에 등록합니다. (W10 GET 요청 등 비동기 작업 중 UAF 방지 목적) |
| **Public Static Method** | `processPendingFree()` | `void` | **[지연 Free 로직]** 일정 시간(grace period, 예: 3초)이 경과한 후 등록된 설정을 실제로 해제하는 함수입니다. |
| **Public Static Method** | `factoryResetFromDefault()` | `bool` | 공장 초기화(Factory Reset)를 수행하고 기본값으로 설정을 재설정합니다. |
| **Public Static Method** | `loadSystemConfig(p_cfg)` | `bool` | 시스템 관련 설정(`ST_A20_SystemConfig_t`)을 로드합니다. |
| **Public Static Method** | `loadWifiConfig(p_cfg)` | `bool` | Wi-Fi 관련 설정을 로드합니다. |
| **Public Static Method** | `loadMotionConfig(p_cfg)` | `bool` | 모션 센서 관련 설정을 로드합니다. |
| **Public Static Method** | `loadSchedules(p_cfg)` | `bool` | 스케줄링 설정을 로드합니다. |
| **Public Static Method** | `loadUserProfiles(p_cfg)` | `bool` | 사용자 프로필 설정을 로드합니다. |
| **Public Static Method** | `loadWindDict(p_cfg)` | `bool` | 풍향/풍속 사전(Dictionary) 설정을 로드합니다. |
| **Public Static Method** | `loadNvsSpecConfig(p_cfg)` | `bool` | NVS (Non-Volatile Storage) 관련 설정을 로드합니다. |
| **Public Static Method** | `loadWebPageConfig(p_cfg)` | `bool` | 웹 페이지 관련 설정을 로드합니다. |
| **Public Static Method** | `saveSystemConfig(p_cfg)` | `bool` | 시스템 설정을 저장합니다. |
| **Public Static Method** | `saveWifiConfig(p_cfg)` | `bool` | Wi-Fi 설정을 저장합니다. |
| **Public Static Method** | `saveMotionConfig(p_cfg)` | `bool` | 모션 설정을 저장합니다. |
| **Public Static Method** | `saveSchedules(p_cfg, p_failOnOverlap)` | `bool` | 스케줄 설정을 저장합니다. 오버랩 실패 정책(`p_failOnOverlap`)을 인자로 받습니다. |
| **Public Static Method** | `saveUserProfiles(p_cfg)` | `bool` | 사용자 프로필 설정을 저장합니다. |
| **Public Static Method** | `saveWindDict(p_cfg)` | `bool` | 풍향/풍속 사전 설정을 저장합니다. |
| **Public Static Method** | `saveNvsSpecConfig(p_cfg)` | `bool` | NVS 관련 설정을 저장합니다. |
| **Public Static Method** | `saveWebPageConfig(p_cfg)` | `bool` | 웹 페이지 설정을 저장합니다. |
| **Public Static Method** | `saveDirtyConfigs()` | `bool` | 변경된 부분만(`dirty`) 저장하여 효율성을 높입니다. |
| **Public Static Method** | `getDirtyStatus(p_doc)` | `void` | 현재 설정의 Dirty 상태를 JSON 문서에 기록합니다. |
| **Public Static Method** | `saveAll(p_root)` | `bool` | 모든 설정을 한 번에 저장합니다. (전체 동기화) |
| **Public Static Method** | `toJson_All(...)` | `void` | **[JSON Export]** 주어진 루트 구조체를 포함하여 지정된 모듈들의 전체 설정 내용을 JSON 문서로 변환합니다. (매우 많은 오버로드 인자 사용) |
| **Public Static Method** | `toJson_System(p_cfg, p_doc)` | `void` | 시스템 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_Wifi(p_cfg, p_doc)` | `void` | Wi-Fi 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_Motion(p_cfg, p_doc)` | `void` | 모션 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_Schedules(p_cfg, p_doc)` | `void` | 스케줄 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_UserProfiles(p_cfg, p_doc)` | `void` | 사용자 프로필 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_WindDict(p_cfg, p_doc)` | `void` | 풍향/풍속 사전 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_NvsSpec(p_cfg, p_doc)` | `void` | NVS 관련 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `toJson_WebPage(p_cfg, p_doc)` | `void` | 웹 페이지 설정을 JSON으로 변환합니다. |
| **Public Static Method** | `patchSystemFromJson(p_config, p_patch)` | `bool` | 시스템 설정에 JSON 패치(`p_patch`)를 적용하여 부분 업데이트를 수행합니다. |
| **Public Static Method** | `patchWifiFromJson(p_config, p_patch)` | `bool` | Wi-Fi 설정에 JSON 패치를 적용하여 부분 업데이트를 수행합니다. |

***참고:** 나머지 섹션 (Motion/Schedules/UserProfiles/WindDict/NvsSpec/WebPage)의 `patch*FromJson` 함수는 코드 스니펫이 잘려나갔으나, 구조적 패턴상 동일하게 존재한다고 추론됩니다.*

---

### 🔑 핵심 아키텍처 및 동기화 특이사항 (Critical Architecture Notes)

1.  **동기화 메커니즘:**
    *   `portMUX critical section`: 전역 설정 데이터(`g_A20_config_root`)에 대한 원자적(Atomic) 접근을 보장하기 위해 사용됩니다. 여러 포인터를 한 번의 트랜잭션으로 캡처할 때 필수적입니다.
    *   `s_recursiveMutex`: 모든 로드/저장/해제/패치 경로에서 데이터 무결성을 보호하는 재귀(Recursive) 뮤텍스입니다. (예: `setXxx` 내부에서 다시 `begin()`을 호출해야 할 경우).
2.  **지연 해제 (Delayed Free, E-1):**
    *   일반적인 `freeAll()` 대신 `queuePendingFree()`를 사용합니다. 이는 Wi-Fi 등 외부 요청(W10 GET)이 데이터를 읽는 과정(`v_snap` 캡처 후 JSON 실행)과 설정 데이터 해제 시점 사이에 **Use After Free (UAF)** 취약점을 방지하기 위함입니다.
    *   실제 메모리 해제는 `processPendingFree()`가 호출되고, 시스템에 충분한 시간(grace period, 예: 3초)이 지난 후에 이루어집니다.
3.  **데이터 흐름:**
    *   **Load/Save:** 구조체(`ST_A20_*`) $\leftrightarrow$ JSON Document (`JsonDocument`).
    *   **Patching:** `JsonDocument` (패치 데이터) $\rightarrow$ 구조체 (`p_config`)로 부분 업데이트.
4.  **설정 관리 원칙:**
    *   **Lazy-Load:** 모든 섹션을 한 번에 로드하지 않고, 필요할 때만 동적으로 로드하는 하이브리드 방식을 채택했습니다.
    *   **Dirty Flag:** 변경된 데이터만 추적하여 저장(`saveDirtyConfigs()`)함으로써 I/O 효율성을 극대화합니다.

## C10\_Config\_0203.h 파트 2/2 스펙 요약

본 파일은 시스템 설정(Configuration) 데이터를 JSON 패치 및 CRUD 작업을 통해 관리하고, 메모리 상태를 동기화하며, 재로드(Reload) 과정을 안전하게 처리하는 로직을 담당합니다. 모든 멤버는 클래스 레벨의 정적(Static) 특성을 가집니다.

---

### 🛠️ 공용 정적 함수 (Public Static Methods)

#### 1. JSON 패치 및 초기화 함수 (Patching Functions)
시스템의 특정 설정 영역에 외부 JSON 데이터를 적용하여 업데이트하는 역할을 수행합니다.

| 함수 시그니처 | 반환 타입 | 설명 | 주요 기능 |
| :--- | :--- | :--- | :--- |
| `static bool patchMotionFromJson(...)` | `bool` | 모션(Motion) 설정 영역을 JSON 패치로 업데이트합니다. | `ST_A20_MotionConfig_t` 구조체 사용. |
| `static bool patchSchedulesFromJson(...)` | `bool` | 스케줄(Schedules) 설정 영역을 JSON 패치로 업데이트합니다. | `ST_A20_SchedulesRoot_t` 구조체 사용. |
| `static bool patchUserProfilesFromJson(...)` | `bool` | 사용자 프로필(User Profiles) 설정 영역을 JSON 패치로 업데이트합니다. | `ST_A20_UserProfilesRoot_t` 구조체 사용. |
| `static bool patchWindDictFromJson(...)` | `bool` | 풍향 사전(Wind Dictionary) 설정 영역을 JSON 패치로 업데이트합니다. | `ST_A20_WindDict_t` 구조체 사용. |
| `static bool patchNvsSpecFromJson(...)` | `bool` | NVS 스펙(Non-Volatile Storage Specification) 설정을 JSON 패치로 업데이트합니다. | `ST_A20_NvsSpecConfig_t` 구조체 사용. |
| `static bool patchWebPageFromJson(...)` | `bool` | 웹 페이지 설정 영역을 JSON 패치로 업데이트합니다. | `ST_A20_WebPageConfig_t` 구조체 사용. |

#### 2. CRUD 작업 함수 (Create, Read, Update, Delete)
전역 설정 루트(`g_A20_config_root`)를 대상으로 개별 설정을 관리하는 기능을 제공합니다.

| 함수 시그니처 | 반환 타입 | 설명 | 동작 범위 |
| :--- | :--- | :--- | :--- |
| `static int addScheduleFromJson(...)` | `int` | JSON 문서로부터 새로운 스케줄을 추가하고 ID를 반환합니다. | 전역 설정 루트 (Schedules) |
| `static bool updateScheduleFromJson(...)` | `bool` | 특정 ID의 스케줄 설정을 패치로 업데이트합니다. | 전역 설정 루트 (Schedules) |
| `static bool deleteSchedule(uint16_t p_id)` | `bool` | 특정 ID의 스케줄을 삭제합니다. | 전역 설정 루트 (Schedules) |
| `static int addUserProfilesFromJson(...)` | `int` | JSON 문서로부터 새로운 사용자 프로필을 추가하고 ID를 반환합니다. | 전역 설정 루트 (User Profiles) |
| `static bool updateUserProfilesFromJson(...)` | `bool` | 특정 ID의 사용자 프로필 설정을 패치로 업데이트합니다. | 전역 설정 루트 (User Profiles) |
| `static bool deleteUserProfiles(uint16_t p_id)` | `bool` | 특정 ID의 사용자 프로필을 삭제합니다. | 전역 설정 루트 (User Profiles) |
| `static int addWindProfileFromJson(...)` | `int` | JSON 문서로부터 새로운 풍향 프로필을 추가하고 ID를 반환합니다. | 전역 설정 루트 (Wind Profile) |
| `static bool updateWindProfileFromJson(...)` | `bool` | 특정 ID의 풍향 프로필 설정을 패치로 업데이트합니다. | 전역 설정 루트 (Wind Profile) |
| `static bool deleteWindProfile(uint16_t p_id)` | `bool` | 특정 ID의 풍향 프로필을 삭제합니다. | 전역 설정 루트 (Wind Profile) |

#### 3. 시스템 상태 관리 함수 (System State Management)

| 함수 시그니처 | 반환 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `static void getRootSnapshot(ST_A20_ConfigRoot_t& p_out)` | `void` | 전역 설정 루트의 현재 상태를 원자적으로 스냅샷 캡처하여 출력 구조체에 저장합니다. | **원자성 보장:** 내부적으로 `s_rootSwapMux` 뮤텍스를 사용하여 8개 포인터 배열을 한 번에 안전하게 복사합니다. W10 읽기 경로에서 사용됩니다. |
| `static bool _loadCfgJsonFile()` | `bool` | 설정 파일(`cfg_jsonFile.json`)을 로드하는 내부 유틸리티 함수입니다. | 시스템 초기화 또는 재로드 시 호출됩니다. |

---

### 🔒 동기화 및 잠금 메커니즘 (Synchronization Primitives)

| 멤버 이름 | 타입 | 역할 및 설명 | 사용 목적 |
| :--- | :--- | :--- | :--- |
| `s_rootSwapMux` | `portMUX_TYPE` | **Root 스냅샷 뮤텍스:** 전역 설정 루트의 포인터 배열을 원자적으로 교체(swap)하거나 읽기 위해 사용되는 뮤텍스입니다. | `getRootSnapshot()` 호출 시 동시성 제어. |
| `s_dirtyflagSpinlock` | `portMUX_TYPE` | **Dirty 플래그 스핀락:** 시스템의 여러 설정 영역 중 변경된 상태(`_dirty_*`)를 읽거나 쓸 때 상호 배타성을 보장합니다. | 모든 Dirty Flag 접근 시 사용. |
| `s_recursiveMutex` | `SemaphoreHandle_t` | **전역 재귀 뮤텍스:** 전체 설정 구조체에 대한 복잡한 쓰기/읽기 작업(예: 대규모 업데이트)을 보호하는 재귀적 세마포어입니다. | 전반적인 설정 데이터 무결성 유지. |
| `s_pendingFreeMux` | `portMUX_TYPE` | **Pending Free 뮤텍스:** 시스템이 메모리 해제(freeAll)를 처리할 때, 이 과정에서 발생하는 리소스 누수(leak)를 방지하기 위해 사용되는 보호용 뮤텍스입니다. | 재로드/해제 로직의 안전성 확보. |

---

### 💾 상태 및 캐싱 변수 (State and Caching Variables)

#### 1. Dirty 플래그 (Dirty Flags)
각 설정 영역이 마지막으로 변경되었는지 여부를 나타내는 불리언(Boolean) 정적 멤버입니다. 시스템 재로드 시 어떤 영역을 다시 로드해야 하는지 판단하는 데 사용됩니다.

*   `_dirty_system`: 시스템 전반의 설정 변경 플래그.
*   `_dirty_wifi`: Wi-Fi 관련 설정 변경 플래그.
*   `_dirty_motion`: 모션(Motion) 설정 변경 플래그.
*   `_dirty_schedules`: 스케줄(Schedules) 설정 변경 플래그.
*   `_dirty_userProfiles`: 사용자 프로필(User Profiles) 설정 변경 플래그.
*   `_dirty_windDict`: 풍향 사전(Wind Dictionary) 설정 변경 플래그.
*   `_dirty_nvsSpec`: NVS 스펙(NVS Spec) 설정 변경 플래그.
*   `_dirty_webPage`: 웹 페이지(Web Page) 설정 변경 플래그.

#### 2. 매핑 및 캐시 구조체 (Mapping and Cache Structures)

| 멤버 이름 | 타입 | 역할 및 설명 | 용도 |
| :--- | :--- | :--- | :--- |
| `s_cfgJsonFileMap` | `ST_A20_cfg_jsonFile_t` | 설정 파일(`cfg_jsonFile.json`)의 구조체 매핑 정보를 저장합니다. | JSON 로딩 및 파싱 시 참조. |
| **[Pending Free 큐]** | | 재로드(Reload) 과정에서 메모리 해제 리소스를 안전하게 관리하기 위한 임시 캐시 영역입니다. | 연속적인 설정 변경에 대비하여 자원 누수를 방지합니다. |
| `PENDING_FREE_SLOTS` | `constexpr uint8_t` | 큐의 최대 슬롯 크기 (2). | 상수 정의. |
| `PENDING_FREE_GRACE_MS` | `constexpr uint32_t` | 리소스를 해제할 수 있는 유예 시간 (3000ms = 3초). | 상수 정의. |
| `s_pendingFree[2]` | `ST_A20_ConfigRoot_t` | 실제 캐시된 설정 루트 구조체 배열. | 재로드 시 임시 저장소. |
| `s_pendingFreeMs[2]` | `uint32_t` | 각 슬롯의 유효 시간(Timestamp)을 기록합니다. | 만료 시간 체크용. |
| `s_pendingFreeCount` | `uint8_t` | 현재 사용 중인 큐 슬롯의 개수. | 상태 추적. |
