# `C10_Config_Sch_Util_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_Sch_Util_0203.cpp

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_SchedulesRoot_t`**
    *   **설명:** 전체 스케줄 데이터를 담는 루트 구조체입니다. (Schedule Root Data Structure)
    *   **사용처:** `C10_nextScheduleId_u8`, `C10_isSchIdDuplicated`, `C10_isSchNoDuplicated` 함수의 입력 매개변수(`p_root`)로 사용됩니다.
*   **`ST_A20_ScheduleIt`**
    *   **설명:** 스케줄 루트 내의 개별 스케줄 항목(Item)을 나타내는 구조체입니다.
    *   **사용처:** `C10_fromJson_ScheduleItem` 함수의 출력 매개변수 또는 내부 처리 대상으로 사용됩니다.
*   **`JsonObjectConst`**
    *   **설명:** 상수 JSON 객체를 참조하는 타입입니다. (Constant reference to a JSON Object)
    *   **사용처:** `C10_fromJson_ScheduleItem` 함수의 입력 매개변수(`p_js`)로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_nextScheduleId_u8`** | `uint8_t` | 다음 사용 가능한 스케줄 ID를 계산합니다. | 1. 입력된 루트(`p_root`)에서 최대 `schId`를 찾습니다. <br>2. 이 값에 전역 증가분 (`G_C10_SCH_ID_STEP`)을 더하여 다음 값을 결정합니다. <br>3. 오버플로우/언더플로우 및 경계 조건(`A20_Const::MAX_SCHEDULES`, `G_C10_SCH_ID_START`) 검증 로직이 포함되어 있습니다. |
| **`C10_isSchIdDuplicated`** | `bool` | 주어진 스케줄 ID가 루트 내에 중복되는지 확인합니다. | 1. 입력된 ID(`p_schId`)가 0일 경우 즉시 `true`를 반환합니다. <br>2. 제외할 인덱스(`p_excludeIndex`)를 고려하여 순회하며 일치 여부를 검사합니다. |
| **`C10_isSchNoDuplicated`** | `bool` | 주어진 스케줄 번호가 루트 내에 중복되는지 확인합니다. | 1. 입력된 번호(`p_schNo`)가 0일 경우 즉시 `true`를 반환합니다. <br>2. 제외할 인덱스(`p_excludeIndex`)를 고려하여 순회하며 일치 여부를 검사합니다. |
| **`C10_fromJson_ScheduleItem`** | `bool` | JSON 객체에서 단일 스케줄 항목을 디코딩하고 구조체에 저장합니다. | 1. 입력된 JSON(`p_js`)의 필드들을 읽어와 `ST_A20_ScheduleIt` 구조체를 채웁니다. <br>2. 파싱 과정 중 데이터 유효성 검사(예: 필수 필드 누락, 타입 불일치)를 수행하며, 실패 시 `false`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`C10_Config_Sch_Internal_0203.h`**:
    *   스케줄 관리 유틸리티 함수들의 선언(Declarations)을 포함하는 내부 헤더 파일입니다.
*   **`C10_Config_UzProf_Internal_0203.h`**:
    *   사용자 프로필 관련 로직 및 JSON 파싱과 관련된 의존성을 가집니다. (Phase 2 업데이트 반영)
*   **`A40_Com_Utils_0203.h`**:
    *   통신 유틸리티 함수 (`A40_ComFunc`)와 뮤텍스/세마포어 보호 메커니즘 (`CL_A40_MutexGuard_Semaphore`)을 제공합니다. (동시성 제어 관련)
*   **`A22_Com_Lookup_0203.h`**:
    *   문자열을 특정 열거형(Enum) 값으로 변환하는 룩업 함수 (`A20_modeFromString`)를 제공합니다. (데이터 변환 유틸리티)
*   **`A23_Com_ResetCfg_0203.h`**:
    *   특정 설정값의 기본값(Default Value)을 초기화하는 기능을 제공합니다.

### 💡 핵심 아키텍처 및 구현 특징 (Architectural Notes)

*   **데이터 구조:** 스케줄 데이터는 `ST_A20_SchedulesRoot_t`를 중심으로 관리되며, 이는 JSON 파싱의 최종 목표 구조체입니다.
*   **ID/번호 할당 전략:** 다음 ID 계산(`C10_nextScheduleId_u8`)은 단순 증가가 아닌, **최대값 기반 + 고정 스텝 값 (`G_C10_SCH_ID_STEP`)**을 사용하는 방식을 채택하여 충돌을 최소화합니다.
*   **안전성:** 모든 유틸리티 함수는 경계 조건(Boundary Conditions) 및 널/제로 입력(`p_schId == 0`, `v_next > 255u` 등)에 대한 엄격한 검증 로직을 포함하고 있습니다.
*   **동시성 제어:** 외부 모듈 의존성을 통해 뮤텍스 가드 (`CL_A40_MutexGuard_Semaphore`)를 사용하여 공유 자원 접근 시 스레드 안전성을 보장합니다.

### ⚙️ 함수 및 파라미터 스펙

| 구분 | 항목 | 타입 | 설명 |
| :--- | :--- | :--- | :--- |
| **함수** | `(p_s, p_allowIdRead, ...)` | N/A | JSON 데이터(`p_js`)를 기반으로 스케줄 설정 구조체(`em_t`)의 멤버들을 초기화하고 유효성을 검사하는 로직. |
| **파라미터** | `p_s` | `em_t&` | 설정을 저장할 대상 구조체 (Reference). |
| **파라미터** | `p_allowIdRead` | `bool` | 스케줄 ID(schId) 읽기 허용 여부. |
| **파라미터** | `p_forceSchIdKeep` | `bool` | 기존 스케줄 ID 유지 강제 여부 (true 시 schId 덮어쓰지 않음). |
| **파라미터** | `p_forceReissueSegId` | `bool` | 세그먼트 ID 재발행 강제 여부. |
| **파라미터** | `p_callerForLog` | `const char*` | 로그 기록 시 호출자 정보를 제공하는 문자열 포인터. |

### 📚 외부 의존성 및 유틸리티 함수

*   **JSON 입력:** 모든 설정 값은 JSON 객체(`p_js`)에서 추출됨.
*   **로깅:** `CL_D10_Logger::log(level, format, ...)`: 오류 발생 시 로그 기록에 사용됨.
*   **문자열 복사 (정책 기반):** `A40_ComFunc::Json_copyStr_LogPolicy(json, key, dest, size, defaultVal, caller)`: JSON에서 문자열을 구조체 멤버로 안전하게 복사.
*   **불리언 추출:** `A40_ComFunc::Json_getBool(json, key, defaultValue)`: JSON에서 부울 값을 가져옴.
*   **버퍼 복사 (안전):** `A40_ComFunc::copyStr2Buffer_safe(dest, source, size, caller)`: JSON 문자열을 지정된 크기의 버퍼에 안전하게 복사.

### 💾 데이터 구조체 스펙 (`em_t` 내부 멤버)

#### **1. 최상위 레벨 필드**

*   `schId`: `uint8_t` (스케줄 ID).
    *   *유효성 검사:* `p_forceSchIdKeep`이 false이고, `p_allowIdRead`가 true일 때만 읽기 시도. 값은 1~255 범위여야 함.
*   `schNo`: `uint16_t` (스케줄 번호).
    *   *필수:* 필수 필드이며, 값이 0이거나 최대값(65535)을 초과하면 오류 처리됨.
### 💾 데이터 구조체 스펙 (`em_t` 내부 멤버) - 계속

#### **2. 시간 및 주기 관련 필드**

*   `period`: `PeriodStruct`
    *   `enabled`: `bool` (주기 설정 활성화 여부). JSON에서 가져오며 기본값은 `true`.
    *   `days`: `uint8_t[7]` (요일별 동작 값). 0부터 6까지의 요일에 대해 각각의 동작 상태(1 또는 0)를 저장.

#### **3. 규칙 및 오버라이드 필드**

*   `r`: (Rule/Override 관련 구조체)
    *   **파싱 로직:** `[Phase 2] ruleOverride + rule 파싱` 섹션에서 처리됨.
    *   JSON 객체 내의 `ruleOverride`와 `rules` 배열을 순회하며 복잡한 규칙 세트를 초기화하는 역할을 수행함. (구체적인 내부 필드는 코드 미제공으로 생략)

### ⚙️ 함수 및 파라미터 스펙 - 계속

| 구분 | 항목 | 타입 | 설명 |
| :--- | :--- | :--- | :--- |
| **로직 흐름** | `p_s.r` 이후 로직 | N/A | 규칙(Rule) 오버라이드 및 일반 규칙 세트 파싱을 수행하며, 복잡한 조건부 데이터를 구조체에 매핑함. 이 단계는 스케줄의 핵심 동작 조건을 정의합니다. |

### 📝 요약된 처리 흐름 (Initialization Flow Summary)

1.  **ID 설정:** `schId`와 필수 필드인 `schNo`를 JSON에서 추출하고 유효성 검사 수행.
2.  **기본 속성 설정:** `name`, `enabled`, `profileId` 등 기본 메타데이터를 초기화.
3.  **주기(Period) 설정:**
    *   전체 주기 활성화 여부(`period.enabled`)를 확인.
    *   요일별 동작 값(`period.days[0..6]`)을 JSON 배열에서 순회하며 추출 및 변환 (Boolean/Integer 처리).
    *   시작 시간(`startTime`)과 종료 시간(`endTime`) 문자열을 안전하게 버퍼에 복사.
4.  **규칙 파싱:** `ruleOverride`와 일반 규칙 목록을 파싱하여 스케줄의 세부 동작 로직을 구조체에 저장 (가장 복잡한 데이터 매핑 단계).

### 🛠️ 구조체 및 타입 정의 (Structs & Types)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `ST_A20_SchedulesRoot_t` | `struct` | 스케줄 루트 데이터 컨테이너. 전체 스케줄 목록(`items`)과 개수(`count`)를 포함합니다. |
| `ST_A20_ScheduleItem_t` | `struct` | 단일 스케줄 항목을 정의하며, 고유 ID (`schId`), 번호 (`schNo`) 등의 필드를 가집니다. |
| `JsonObjectConst` | 타입 | 읽기 전용 JSON 객체(JSON Object)를 나타내는 상수 참조 타입입니다. |

### ⚙️ 클래스 및 네임스페이스 (Classes & Namespaces)

*   **`A40_ComFunc`**:
    *   정적 유틸리티 함수 집합으로, 주로 JSON 파싱 관련 기능을 제공합니다.
    *   사용 예: `Json_getBool(p_js, "ruleOverride", false)`를 통해 JSON 값의 부울 여부를 안전하게 추출합니다.
*   **`CL_D10_Logger`**:
    *   시스템 로깅 유틸리티 클래스입니다. 에러 로그(`EN_L10_LOG_ERROR`) 기록에 사용됩니다.

### 🚀 함수 및 메서드 (Functions & Methods)

#### **1. `C10_validateSchedulesLoaded`**
*   **시그니처**: `bool C10_validateSchedulesLoaded(const ST_A20_SchedulesRoot_t& p_root, const char* p_callerForLog)`
*   **기능**: 로드된 스케줄 데이터(`p_root`)의 유효성을 검증합니다.
    *   **검증 항목**:
        *   전체 스케줄 개수 오버플로우 체크 (`count > A20_Const::MAX_SCHEDULES`).
        *   각 스케줄 항목별 `schId`와 `schNo`가 0인지 확인 (필수 값 검사).
        *   모든 스케줄 항목 간의 `schId` 중복 및 `schNo` 중복 여부를 교차 검증합니다.
    *   **반환값**: 유효하면 `true`, 오류 발생 시 `false`.

#### **2. `C10_validateSchedulesBeforeSave`**
*   **시그니처**: `bool#### **2. `C10_validateSchedulesBeforeSave`**
*   **시그니처**: `bool C10_validateSchedulesBeforeSave(const ST_A20_SchedulesRoot_t& p_cfg, const char* p_callerForLog)`
*   **기능**: 스케줄 데이터를 저장하기 전에 최종 유효성을 검증하는 래퍼 함수입니다. 내부적으로 `C10_validateSchedulesLoaded`를 호출하여 동일한 로직을 수행합니다.

#### **3. `C10_validateNoOverlapByDay`**
*   **시그니처**: `bool C10_validateNoOverlapByDay(const ST_A20_SchedulesRoot_t& p_root, bool p_failOnOverlap, const char* p_callerFunc)`
*   **기능**: 스케줄 항목들 간의 시간 중복(Overlap) 여부를 검증합니다. 특히 자정(cross-midnight)을 넘는 경우를 분해하여 정확하게 비교하는 로직이 포함됩니다.
    *   **매개변수**:
        *   `p_root`: 검증할 스케줄 데이터 루트 구조체.
        *   `p_failOnOverlap`: 중복 발생 시 오류로 처리할지 여부를 결정하는 플래그 (Boolean).
        *   `p_callerFunc`: 로깅을 위한 호출자 함수 이름 문자열.
    *   **반환값**: 모든 스케줄이 겹치지 않으면 `true`, 중복 또는 검증 실패 시 `false`.

### 🧩 상수 및 열거형 (Constants & Enums)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `A20_Const::MAX_SCHEDULES` | `const uint8_t` | 시스템이 처리할 수 있는 최대 스케줄 개수 제한 상수입니다. |
| `EN_L10_LOG_ERROR` | `enum` | 로거에 기록될 에러 레벨을 정의합니다. |

### 💡 특이사항 (Special Notes)

*   **JSON 파싱**: JSON 관련 함수 호출 시, 안전한 값 추출(`Json_getBool`) 및 타입 캐스팅(`as<JsonObjectConst>()`)을 통해 런타임 오류를 방지하고 있습니다.
*   **로깅**: 모든 유효성 검증 실패 지점에서는 `CL_D10_Logger::log`를 사용하여 에러 레벨의 로그를 기록하며, 호출자 정보(`v_caller`)와 발생 위치(Index)를 함께 남깁니다.
*   **데이터 무결성**: 스케줄 ID (`schId`) 및 번호 (`schNo`)는 0이 아니어야 하며, 전체 목록에서 중복되지 않아야 한다는 강력한 제약 조건이 존재합니다.

## ⚙️ 시스템 아키텍처 명세서 (C10_Config_Sch_Util_0203.cpp - Part 4/6)

### 📚 구조체 정의 (Struct Definitions)

| 이름 | 타입 | 멤버 변수 | 설명 |
| :--- | :--- | :--- | :--- |
| `ST_C10_Range_t` | `struct` | `int16_t startMin`: 시작 시간 (분 단위). | 스케줄링 범위의 최소 분 값. |
| | | `uint16_t endMin`: 종료 시간 (분 단위). | 스케줄링 범위의 최대 분 값. |
| | | `uint8_t itemIdx`: 원본 항목 인덱스. | 해당 범위를 생성한 원본 스케줄 아이템의 인덱스. |
| `ST_A20_ScheduleItem_t` | `struct` (추정) | `enabled`: 부울 플래그. | 스케줄 아이템 활성화 여부. |
| | | `period`: 기간 정보 구조체. | 시간 및 요일 정보를 포함하는 서브 구조체. |

### 💾 전역/정적 변수 및 상수 (Global/Static Variables & Constants)

*   **`v_ranges[7][A20_Const::MAX_SCHEDULES * 2]`**:
    *   **타입:** `static ST_C10_Range_t` 배열.
    *   **크기:** 요일(7개) $\times$ 최대 스케줄 개수 $\times 2$.
    *   **용도:** 각 요일별로 파싱된 시간 범위(`ST_C10_Range_t`)를 저장하는 버퍼.
*   **`v_counts[7]`**:
    *   **타입:** `static uint16_t` 배열.
    *   **크기:** 7 (요일별).
    *   **용도:** 각 요일(`v_day`)에 현재까지 저장된 유효한 범위의 개수(인덱스 카운터)를 추적합니다. 초기화 시 `memset`을 통해 0으로 설정됩니다.

### 🛠️ 함수 및 라이브러## ⚙️ 시스템 아키텍처 명세서 (C10_Config_Sch_Util_0203.cpp - Part 4/6)

*(이전 섹션: 구조체 정의 및 전역 변수 목록은 생략하고, 남은 코드 블록의 로직 흐름을 이어 작성합니다.)*

### 🔄 주요 처리 로직 (Core Processing Logic)

#### 1. 스케줄 범위 파싱 및 저장 루프 (Schedule Range Parsing & Storage Loop)
*   **목적:** 입력된 스케줄 아이템 목록(`p_root.items`)을 순회하며, 각 요일별로 시간 범위를 계산하고 `v_ranges` 배열에 저장합니다.
*   **흐름 제어:**
    *   `for (uint8_t v_i = 0; ...)`: 모든 스케줄 아이템(`p_root`)을 순회합니다.
    *   `if (!v_s.enabled) continue`: 비활성화된 항목은 건너뜁니다.
    *   **시간 변환:** `A40_parseHHMMtoMin_24h()` 함수를 사용하여 시작/종료 시간을 분 단위(`uint16_t`)로 변환합니다.
    *   `for (uint8_t v_day = 0; ...)`: 요일별(월요일~일요일) 처리 루프입니다.
    *   **범위 계산:**
        *   **Case 1 (`v_start < v_end`):** 당일 범위가 자정(Midnight)을 넘지 않는 경우 (예: 09:00 ~ 17:00).
            *   `r.startMin = v_start`, `r.endMin = v_end`.
        *   **Case 2 (`v_start > v_end`):** 당일 범위가 자정(Midnight)을 넘는 경우 (예: 22:00 ~ 06:00). 이 경우 두 개의 범위로 분리하여 저장합니다.
            1.  자정까지의 범위: `r.startMin = v_start`, `r.endMin = 1440` (하루 총 분).
            2.  자정 이후의 범위: `r.startMin = 0`, `r.endMin = v_end`.

#### 2. 중복/겹침 검사 루프 (Overlap Detection Loop)
*   **목적:** 저장된 모든 스케줄 범위(`v_ranges`)에 대해 시간적 충돌(Overlap)이 발생하는지 확인합니다.
*   **흐름 제어:**
    *   `for (uint8_t v_day = 0; ...)`: 요일별로 루프를 시작합니다.
    *   `if (v_cnt <= 1) continue`: 범위가 하나 이하인 요일은 검사할 필요가 없어 건너뜁니다.
    *   **이중 반복문:** `a`와 `b` 인덱스를 사용하여 모든 가능한 범위 쌍을 비교합니다 (`a=1`부터 시작하여 이전 요소들과 비교).
    *   **겹침 조건 확인 (Overlap Check):** 현재 검사 대상 범위(`key`)와 이전에 저장된 범위(`cur`) 간의 시간적 관계를 분석합니다.
        *   `if (cur.startMin > key.startMin)`: `cur`가 `key`보다 시작 시간이 늦으면, 충돌 가능성이 높습니다.
        *   `else if (cur.startMin == key.startMin)`: 두 범위의 시작 시간이 같으면, 충돌이 발생합니다.

### 💡 특이 사항 및 상수 정의 (Special Notes & Constants)

*   **시간 단위:** 모든 시간 값은 분(Minute) 단위로 처리됩니다.
    *   `1440`: 하루 총 분 수 ($24 \times 60$).
*   **인덱스 관리:** `v_counts[v_day]`는 해당 요일의 유효 범위 개수를 나타내며, 새로운 범위가## ⚙️ 시스템 아키텍처 명세서 (C10_Config_Sch_Util_0203.cpp - Part 4/6)

### 🔄 주요 처리 로직 (Core Processing Logic)

#### 1. 스케줄 범위 파싱 및 저장 루프 (Schedule Range Parsing & Storage Loop)
*(이전 섹션에서 설명된 내용에 이어, 자정(Midnight)을 넘는 경우의 상세 처리를 완료합니다.)*

*   **목적:** 입력된 스케줄 아이템 목록(`p_root.items`)을 순회하며, 각 요일별로 시간 범위를 계산하고 `v_ranges` 배열에 저장합니다.
*   **흐름 제어 (Case 2: 자정 초과 범위):**
    *   스케줄 시작 시간이 종료 시간보다 큰 경우 (`v_start > v_end`), 해당 스케줄은 두 개의 독립적인 시간 구간으로 분리되어 처리됩니다.
    1.  **첫 번째 범위 (당일 ~ 자정):** `r.startMin = v_start`, `r.endMin = 1440` (하루 총 분).
    2.  **두 번째 범위 (자정 ~ 다음 날):** `r.startMin = 0`, `r.endMin = v_end`.

#### 2. 중복/겹침 검사 루프 (Overlap Detection Loop)
*   **목적:** 저장된 모든 스케줄 범위(`v_ranges`)에 대해 시간적 충돌(Overlap)이 발생하는지 확인합니다. 이 과정은 **모든 가능한 범위 쌍**을 비교하는 $O(N^2)$ 복잡도를 가집니다.
*   **흐름 제어:**
    *   `for (uint8_t v_day = 0; ...)`: 요일별로 루프를 시작합니다.
    *   `for (uint16_t a = 1; a < v_cnt; a++)`: 현재 검사 대상 범위 (`key`)를 지정합니다.
    *   `while (b >= 0)`: `a`보다 인덱스가 작은 모든 이전 범위 (`cur`)와 비교합니다.
    *   **겹침 조건 확인 (Overlap Check):** 두 범위 $R_{key} = [S_k, E_k]$ 와 $R_{cur} = [S_c, E_c]$ 가 겹치는지 검사하는 로직입니다.

| 조건 | 설명 | 의미하는 바 |
| :--- | :--- | :--- |
| `if (cur.startMin > key.startMin)` | 이전 범위가 현재 범위보다 시작 시간이 늦을 때. | 두 범위의 종료 시간(`E_c`, `E_k`) 중 더 큰 값이 다른 쪽의 시작 시간과 비교되어야 완전한 검사가 가능합니다. (코드 흐름상 다음 조건에서 처리됨) |
| `else if (cur.startMin == key.startMin)` | 두 범위가 같은 시점에 시작할 때. | **충돌 발생** (`move = true`로 설정될 가능성이 높음). |

*   **종료 및 플래그 설정:**
    *   만약 겹침이 감지되면, `v_anyOverlap` 플래그를 `true`로 설정합니다. (코드의 나머지 부분에서 이 로직을 통해 최종적으로 충돌 여부를 판단하고 루프가 종료됩니다.)

### 💡 특이 사항 및 상수 정의 (Special Notes & Constants)

*

## 🛠️ 시스템 아키텍처 명세 (C10_Config_Sch_Util_0203.cpp)

### 📚 사용된 자료 구조체 및 타입 정의 (Structs & Types)

| 이름 | 유형 | 주요 멤버 변수 | 설명 |
| :--- | :--- | :--- | :--- |
| `ST_C10_Range_t` | 구조체 | `startMin`, `endMin` (`uint16_t`), `itemIdx` (`uint16_t`) | 스케줄링 기간 범위를 정의합니다. 시간 최소값과 최대값을 포함하며, 해당 범위가 참조하는 아이템의 인덱스를 가집니다. |
| `ST_A20_ScheduleItem_t` | 구조체 | `schId`, `schNo`, `name` (타입 추정) | 개별 스케줄 항목의 상세 정보를 담는 구조체입니다. (`schId`: 스케줄 ID, `schNo`: 스케줄 번호 등). |
| `ST_A20_SchedulesRoot_t` | 구조체 | `count` (`uint16_t`), `items[]` (배열) | 모든 스케줄 항목을 담는 루트 컨테이너입니다. 전체 항목의 개수와 실제 아이템 배열을 포함합니다. |

### 💻 클래스 및 유틸리티 (Classes & Utilities)

*   **`CL_D10_Logger`**:
    *   **역할:** 로깅 기능을 제공하는 클래스입니다. 시스템 경고(WARN), 정보 등을 기록하는 데 사용됩니다.
    *   **주요 메서드:** `log()`
        *   **사용 패턴:** 로그 레벨(`EN_L10_LOG_WARN`)과 포맷 문자열을 사용하여 상세한 컨텍스트 정보를 출력합니다.

### ⚙️ 함수 정의 (Functions)

#### 1. `C10_sortSchedulesBySchNoDesc`
*   **시그니처:** `void C10_sortSchedulesBySchNoDesc(ST_A20_SchedulesRoot_t& p_root)`
*   **기능:** 스케줄 루트 구조체(`p_root`) 내의 모든 스케줄 항목들을 **스케줄 번호(`schNo`)를 기준으로 내림차순 정렬**합니다.
*   **특이사항:** `count`가 1 이하일 경우 즉시 리턴합니다.

#### 2. (Overlap Detection Logic) - *명시적 함수## 🛠️ 시스템 아키텍처 명세 (C10_Config_Sch_Util_0203.cpp) - 계속

### ⚙️ 함수 정의 (Functions)

#### 1. `C10_sortSchedulesBySchNoDesc`
*   **시그니처:** `void C10_sortSchedulesBySchNoDesc(ST_A20_SchedulesRoot_t& p_root)`
*   **기능:** 스케줄 루트 구조체(`p_root`) 내의 모든 스케줄 항목들을 **스케줄 번호(`schNo`)를 기준으로 내림차순 정렬**합니다.
*   **로직 상세 (현재 코드 기반):**
    *   `p_root.count <= 1`일 경우 종료됩니다.
    *   반복문은 인덱스 `i = 1`부터 시작하며, 각 항목의 데이터를 임시 키(`key`)에 복사합니다.
    *   *(주의: 제공된 코드 스니펫이 비교 및 교환 로직을 포함하지 않아 전체 정렬 알고리즘 분석은 불가능하나, 목적은 명확하게 '내림차순 정렬'입니다.)*

### 💡 전역 상수 및 매크로 (Constants & Macros)

| 이름 | 유형 | 값/용도 | 설명 |
| :--- | :--- | :--- | :--- |
| `EN_L10_LOG_WARN` | Enum | 로그 레벨 | 경고(Warning) 메시지를 기록하는 데 사용되는 상수입니다. |
| `s_dayName[7]` | Static Array | `"Mon", "Tue", ..., "Sun"` | 요일 인덱스(`v_day`)를 문자열 이름으로 변환하여 로깅에 사용됩니다. |

### 📌 특이사항 및 전역 상태 (Special Notes & State)

*   **`p_root`**: 스케줄 데이터를 담는 핵심 구조체 포인터/참조입니다. 이 객체의 `items` 배열과 `count` 멤버가 모든 스케줄 데이터의 범위를 정의합니다.
*   **Overlap Detection Logic**: 코드 중간에 존재하는 오버랩(겹침) 검사 로직은 다음과 같은 중요한 흐름을 가집니다:
    1.  인접한 두 범위(`r1`, `r2`)를 순회하며 비교합니다.
    2.  `r2.startMin < r1.endMin` 조건을 만족하면 시간적 오버랩이 발생했다고 판단합니다.
    3.  오버랩 감지 시, **로그(WARN)**를 기록하고, 만약 `p_failOnOverlap` 플래그가 참(`true`)이면 즉시 `false`를 반환하여 실패 처리합니다.
*   **Policy Flag (`p_failOnOverlap`)**: 이 불리언 플래그는 시스템 정책을 반영하며, 오버랩 감지 시 오류 처리를 할지(Fail) 아니면 경고만 남길지(Warn-only) 결정하는 핵심 제어 변수입니다.

---
***요약:*** *이 코드는 스케줄 데이터의 유효성 검사 (Overlap Detection)와 정렬 (`C10_sortSchedulesBySchNoDesc`)이라는 두 가지 주요 기능을 수행하며, `CL_D10_Logger`를 통해 시스템 상태 변화 및 오류를 기록합니다.*

### 💾 데이터 구조체 및 타입 정의 (Structs & Types)

| 이름 | 유형 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| `ST_A20_ScheduleItem_t` | `struct` | 스케줄 항목의 기본 데이터를 담는 구조체. 시간 및 식별자 정보를 포함함. | 읽기 전용 참조(`const&`)로 사용됨. |
| `key` | `struct` 또는 타입 별칭 | 삽입되거나 이동할 새로운 스케줄 항목을 임시 저장하는 변수/구조체. | 비교 기준이 됨 (`schNo`, `schId`). |
| `p_root` | 구조체 (Container) | 전체 스케줄 목록을 관리하는 루트 컨테이너. 내부적으로 배열(`items`)을 가짐. | 데이터 이동의 대상이 되는 핵심 메모리 영역. |

### ⚙️ 주요 멤버 변수 및 필드 (Members & Fields)

*   **`p_root.items`**:
    *   **유형:** `ST_A20_ScheduleItem_t` 배열 (`uint8_t` 인덱스 기반).
    *   **역할:** 스케줄 항목들이 순차적으로 저장되는 물리적 메모리 배열.

### 🛠️ 함수 및 로직 특이사항 (Functions & Logic)

*   **`memcpy()`**:
    *   **유형:** C 표준 라이브러리 함수.
    *   **역할:** 지정된 메모리 영역의 바이트 단위 복사(Copy). 스케줄 항목을 배열 내에서 한 위치로 이동시키는 핵심 메커니즘으로 사용됨.

### 🔄 로직 흐름 및 동작 원리 (Algorithm Flow)

*   **기능**: 삽입 정렬(Insertion Sort) 기반의 배열 요소 이동/삽입 로직 구현.
*   **동작 방식**:
    1.  `j = i - 1`로 시작하여, 현재 위치(`key`)보다 크거나 같은 스케줄 항목들을 발견할 때까지 역방향으로 순회합니다.
    2.  순회 중 만나는 기존 요소 (`cur`)가 삽입될 `key`보다 **작은** 경우에만 (즉, 이동이 필요한 경우) 해당 요소를 한 칸 뒤로 복사(`memcpy`)하여 공간을 확보합니다.
    3.  반복문 종료 후, 확보된 빈 공간(인덱스 `j+1`)에 새로운 요소 (`key`)를 최종적으로 삽입합니다.

### 🔒 동기화 및 상태 관리 (Synchronization & State)

*   **특이사항**: 해당 코드 스니펫 내에서는 명시적인 뮤텍스(`std::mutex`), 락(Lock), 또는 원자적 연산(Atomic Operation)을 사용하는 부분이 관찰되지 않습니다.
*   **가정**: 이 로직은 이미 외부에서 적절한 임계 영역(Critical Section) 보호 메커니즘에 의해 호출되고 있다고 가정합니다.
