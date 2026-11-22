# `C10_Config_Sch_JSON_0203.cpp` 상세 Spec

## 파트 1/2

## 🛠️ C10_Config_Sch_JSON_0203.cpp 분석 Spec Sheet

본 파일은 스마트 네이처(Smart Nature)의 스케줄 설정 데이터를 JSON 형식으로 직렬화하거나 패치하는 기능을 담당합니다. 임베디드 시스템 아키텍트 관점에서 핵심 구성 요소들을 정리했습니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 스케줄 설정 관리의 핵심 로직을 담고 있는 매니저 클래스입니다. JSON 직렬화 및 패치 기능을 제공합니다. | 정적 멤버 변수(`s_recursiveMutex`)를 포함하며, 여러 공통 유틸리티 함수를 호출합니다. |
| `ST_A20_SchedulesRoot_t` | Struct | 전체 스케줄 목록을 담는 루트 구조체입니다. 이 배열의 데이터를 JSON으로 변환하는 대상이 됩니다. | 내부적으로 `items` (스케줄 항목 배열)와 `count` (실제 항목 개수)를 가집니다. |
| `ST_A20_ScheduleItem_t` | Struct | 단일 스케줄 항목을 정의합니다. ID, 이름, 활성화 여부, 주기(Period), 트리거 규칙(Rule) 등의 상세 정보를 포함합니다. | 직렬화 과정에서 가장 많은 필드가 처리됩니다. |
| `JsonDocument` | Type | JSON 데이터를 담는 컨테이너 객체입니다. (외부 라이브러리 의존성) | 스케줄 데이터가 최종적으로 이 객체에 기록됩니다. |
| `JsonObject` | Type | `JsonDocument` 내의 특정 JSON 객체를 나타내는 타입입니다. | 반복적인 키-값 할당을 통해 구조화된 데이터를 만듭니다. |

### ⚙️ 함수 (Functions)

#### 1. 멤버 함수 (Member Functions of `CL_C10_ConfigManager`)

| 이름 | 반환형 | 매개변수 | 설명 |
| :--- | :--- | :--- | :--- |
| `toJson_Schedules` | `void` | `const ST_A20_SchedulesRoot_t& p_cfg`, `JsonDocument& d` | **[JSON Export]** 스케줄 설정 구조체(`p_cfg`)의 데이터를 JSON 문서(`d`)

---

## 파트 2/2

## 🛠️ 코드 분석 Spec Sheet (C10_Config_Sch_JSON_0203.cpp - Part 2/2)

본 코드는 JSON 패치 데이터를 기반으로 스케줄 설정을 파싱하고 유효성을 검증하는 로직을 포함합니다. 주요 컴포넌트와 특이사항은 다음과 같습니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입/역할 | 상세 설명 |
| :--- | :--- | :--- |
| `CL_A40_MutexGuard_Semaphore` | **RAII Guard** | 재귀 뮤텍스(`s_recursiveMutex`)를 획득하고 해제하는 RAII(Resource Acquisition Is Initialization) 패턴을 구현
