# `C10_Config_Extras_0203.cpp` 상세 Spec

## ⚙️ C10_Config_Extras_0203.cpp 분석 Spec

본 파일은 NvsSpec 및 WebPage 설정의 로드/저장 기능을 담당하는 핵심 구성 관리자 모듈입니다. 주요 클래스, 구조체, 함수 및 동기화 특이사항을 다음과 같이 정리합니다.

---

### 📚 클래스 (Classes)

| 이름 | 역할 및 설명 | 상세 내용 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | **[핵심]** 스마트 네이처 풍력 구성 관리자(Smart Nature Wind Configuration Manager)의 핵심 로직을 담고 있는 클래스입니다. NvsSpec 및 WebPage 설정 데이터를 로드, 저장, 패치하는 기능을 구현합니다. | `loadNvsSpecConfig` 등의 멤버 함수를 포함하며, 모듈 전반의 설정을 제어합니다. |
| `CL_A40_MutexGuard_Semaphore` | **[유틸리티]** RAII(Resource Acquisition Is Initialization) 패턴을 사용하여 뮤텍스(Mutex) 자원을 안전하게 관리하는 가드 객체입니다. 스코프를 벗어날 때 자동으로 락 해제(Unlock)가 보장됩니다. | 동시성 제어를 위해 사용되며, `s_recursiveMutex`와 같은 뮤텍스를 보호합니다. |
| `CL_D10_Logger` | **[유틸리티]** 시스템 로깅 기능을 제공하는 클래스입니다. 에러 메시지나 디버그 정보를 기록할 때 사용됩니다. | 정적 메서드인 `log()`를 통해 로그 레벨(예: `EN_L10_LOG_ERROR`)과 함께 메시지를 출력합니다. |

### 🧱 구조체 및 타입 (Structs & Types)

| 이름 | 역할 및 설명 | 상세 내용 |
| :--- | :--- | :--- |
| `ST_A20_NvsSpecConfig_t` | **[데이터]** NVS(Non-Volatile Storage)에 저장되는 특정 스펙(Spec) 설정을 담는 구조체입니다. 이 구조체를 통해 설정 데이터를 읽고 처리합니다. | `loadNvsSpecConfig` 함수의 입력 파라미터로 사용됩니다. |
| `JsonDocument` | **[데이터]** ArduinoJson 라이브러리 v7.x.x에서 제공하는 단일 JSON 데이터 컨테이너 타입입니다. 모든 설정 데이터는 이 타입을 기반으로 처리됩니다. | Json 구조를 메모리에 표현하고 조작하는 데 사용됩니다. |

### ⚙️ 함수 (Functions)

| 이름 | 클래스/범위 | 반환형 | 매개변수 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `loadNvsSpecConfig` | `CL_C10_ConfigManager` | `bool` | `ST_A20_NvsSpecConfig_t& p_cfg` (참조) | NVS에 저장된 스펙 설정을 로드하여 주어진 구조체(`p_cfg`)에 채워 넣는 핵심 함수입니다. 뮤텍스 보호가 필수적

## 🛠️ 코드 분석 Spec 요약 (C10_Config_Extras_0203.cpp)

본 코드는 NVS(Non-Volatile Storage) 스펙을 JSON 파일에서 로드하고 애플리케이션 설정 구조체(`p_cfg`)에 반영하는 핵심 초기화 로직입니다. 명시적인 락 메커니즘은 사용되지 않았으며, 주로 데이터 구조체와 공통 유틸리티 함수를 활용합니다.

---

### 📚 주요 데이터 구조체 및 타입 (Classes & Structs)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `p_cfg` | 포인터/구조체 | 최종 설정 값을 담는 메인 구조체입니다. (`namespaceName`, `entries[]`, `entryCount` 등의 멤버를 가짐). |
| `ST_A20_NvsEntry_t` | 구조체 | NVS의 개별 항목(Key-Value 쌍)을 정의하는 구조체입니다. |
| `s_cfgJsonFileMap` | 구조체/클래스 | JSON 파일 경로 정보를 담는 설정 맵 구조체입니다. (`nvsSpec` 멤버를 통해 실제 파일 경로 문자열에 접근). |
| `JsonObjectConst` | 타입 (JSON) | JSON 객체를 상수 형태로 참조하는 타입

## 🛠️ 임베디드 시스템 아키텍처 분석 보고서 (C10_Config_Extras_0203.cpp)

본 코드는 JSON 파싱을 통해 웹 페이지 설정(Web Page Configuration) 및 리다이렉트 목록을 로드하는 기능을 수행합니다. 주요 구조체 정의, 컴포넌트 함수 호출, 그리고 데이터 처리 흐름에 초점을 맞추어 분석했습니다.

---

### 📚 핵심 자료구조 (Structs & Types)

| 이름 | 유형 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `ST_A20_PageAsset_t` | 구조체 | 페이지에 포함되는 개별 에셋(이미지, 파일 등)의 정보를 저장합니다. | `uri`, `path` 등의 문자열 멤버를 가집니다. |
| `ST_A20_ReDirectItem_t` | 구조체 | 리다이렉트 규칙을 정의하는 항목입니다. | 원본 URI (`uriFrom`)와 목적지 URI (`uriTo`)를 저장합니다. |
| `p_cfg` | (구조체) | 전체 설정(Configuration) 데이터를 담는 메인 컨테이너입니다. | `reDirect[]`, `assets[]` 등 배열 멤버를 포함하며, 로드된 항목의 개수(`reDirectCount`, `pageCount`)도 관리합니다. |
| `v_p` | (구조체) | 현재 처리 중인 페이지 설정 데이터를 임시로 담는 구조체입니다. | `pageAssets[]`와 해당 카운트(`pageAssetCount`)를 가집니다. |

### ⚙️ 주요 함수 및 컴포넌트 (Functions & Components)

| 이름 | 유형 | 역할 | 상세 설명 |
| :--- | :--- | :--- | :--- |
| `A40_ComFunc::Json_getNum<T>` | 정적 메서드 | JSON 객체에서 지정된 키의 숫자 값을 추출합니다. | 템플릿 매개변수 `<T>`를 사용하여 데이터 타입을 유연하게 처리합니다 (예: `uint16_t`). |
| `A40_ComFunc::Json_getArr` | 정적 메서드 | JSON 객체에서 지정된 키의 배열(JSON Array)을 추출합니다. | 파싱할 항목이 존재하는지 여부를 확인하는 로직(`!j_assets.isNull()`)이 필수적으로 사용됩니다. |
| `A40_ComFunc::Json_copyStrReq` | 정적 메서드 | JSON 객체에서 문자열 값을 읽어 구조체의 멤버 변수로 복사합니다. | 성공/실패 여부(Boolean)를 반환하며, 에러 로깅 및 데이터 유효성 검사에 사용됩니다. |
| `CL_D10_Logger::log` | 정적 메서드 | 시스템 로그를 기록하는 함수입니다. | 경고 메시지(`EN_L10_LOG_WARN`)와 함께 모듈 정보를 출력합니다. |

### 🔒 상태 및 동기화 특이사항 (State & Synchronization)

*   **락(Locking):** 본 코드 스니펫 내에서는 명시적인 뮤텍스(Mutex)나 임계 영역(Critical Section) 관리가 없습니다. JSON 파싱과 구조체 초기화는 단일 쓰

## ⚙️ 코드 분석 Spec: C10_Config_Extras_0203.cpp (파트 6/11)

본 코드는 구조화된 설정 데이터(`p_cfg`)를 JSON 형식으로 직렬화(Serialization)하고, 이를 파일 시스템에 저장하는 로직을 담당합니다. 주요 구성 요소는 다음과 같습니다.

### 📂 클래스 및 타입 정의 (Classes & Types)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `JsonDocument` | JSON 라이브러리 객체 | 최종적으로 저장될 웹 페이지 설정 전체를 담는 루트 JSON 구조체입니다. |
| `JsonArray` | JSON 라이브러리 타입 | 배열 형태의 데이터를 처리하는 데 사용됩니다 (예: `pages`, `reDirect`, `assets`). |
| `JsonObject` | JSON 라이브러리 타입 | 키-값 쌍으로 이루어진 단일 객체를 나타냅니다. |
| `CL_D10_Logger` | 클래스 | 시스템 로깅 기능을 제공하는 전역/정적 클래스로, 오류 및 정보 메시지를 기록합니다. |
| `A40_IO` | 클래스 | 파일 입출력(I/O) 관련 유틸리티를 담당하는 클래스입니다. JSON 문서를 실제 파일로 저장하는 역할을 수행합니다. |

### 💾 구조체 정의 (Structs & Data Models)

이들은 입력 설정 데이터(`p_cfg`)의 각 섹션을 구성하는 모델들입니다.

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `ST_A20_PageItem_t` | 구조체 | 웹 페이지 항목 하나를 정의합니다. (URI, Path, Label, Enable, IsMain, Order 포함) |
| `ST_A20_PageAsset_t` | 구조체 | 특정 페이지에 속하는 개별 에셋(파일)을 정의합니다. (URI, Path 포함) |
| `ST_A20_ReDirectItem_t` | 구조체 | 리다이렉트 규칙 하나를 정의합니다. (`uriFrom`, `uriTo` 필드를 가집니다.) |
| `ST_A20_CommonAsset_t` | 구조체 | 모든 페이지에서 공통으로 사용되는 에셋을 정의합니다. (URI, Path, IsCommon 포함) |

### 🔒 동기화 및 상태 관리 (Synchronization & State)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `v_MutxGuard` | 뮤텍스 가드 객체 | 공유 자원 접근 시 데드락을 방지하기 위해 사용되는 뮤텍스(Mutex) 래퍼입니다. `isAcquired()`를 통해 획득 여부를 확인합니다. |

### 🌐 전역/정적 멤버 및 상수 (Global/Static Members & Constants)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `s_cfgJsonFileMap`

## ⚙️ 시스템 아키텍처 명세서: `C10_Config_Extras_0203.cpp` 파트 7/11 분석

본 코드는 JSON Patch 형식의 데이터를 사용하여 NVS(Non-Volatile Storage) 스펙 설정을 업데이트하는 기능을 구현합니다. 다중 스레드 환경에서 데이터 무결성을 보장하기 위해 뮤텍스 보호가 필수적으로 적용되었습니다.

---

### 📂 클래스 및 구조체 (Classes & Structs)

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 설정 관리(Configuration Management) 기능을 담당하는 핵심 클래스입니다. NVS 스펙 패치 로직을 포함합니다. |
| `ST_A20_NvsSpecConfig_t` | Struct | NVS 스펙 설정을 담는 구조체입니다. 이 구조체가 JSON Patch를 통해 업데이트되는 대상(Target) 데이터입니다. (`namespaceName`, `entries`, `entryCount` 등의 멤버를 가짐). |
| `JsonDocument` | Type (JSON Library) | 입력으로 사용되는 전체 JSON 데이터를 나타내는 타입입니다. (예: ArduinoJson 라이브러리 기반) |
| `JsonObjectConst` | Type (JSON Library) | 읽기 전용(Constant) JSON 객체 뷰를 나타냅니다. 키-값 쌍 접근에 사용됩니다. |
| `JsonArrayConst` | Type (JSON Library) | 읽기 전용(Constant) JSON 배열 뷰를 나타냅니다. 반복 처리 대상이 됩니다. |
| `JsonVariantConst` | Type (JSON Library) | JSON의 다양한 타입(객체, 배열, 문자열 등)을 공통적으로 다루는 읽기 전용 변형(Variant)입니다. |

### 🛠️ 함수 및 메서드 (Functions & Methods)

#### 1. 주요 로직 함수
| 이름 | 시그니처 | 설명 |
| :--- | :--- | :--- |
| `patchNvsSpecFromJson` | `bool CL_C10_ConfigManager::patchNvsSpecFromJson(ST_A20_NvsSpecConfig_t& p_cfg, const JsonDocument& p_patch)` | JSON Patch (`p_patch`)를 분석하여 대상 구조체(`p_cfg`)의 NVS 스펙 설정을 업데이트합니다. 성공적으로 패치가 완료되면 `true`를 반환하고, 실패 시 `false`를 반환합니다. **(핵심 기능)** |

#### 2. 유틸리티 함수 (Utility Functions)
| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `A40_ComFunc::Json_copyStrReq` | Static Method | JSON 객체에서 특정 키의 문자열 값을 읽어와, 대상 구조체의 버퍼에 **필수적으로** 복사합니다. (복사 성공 여부 및 유효성 검사가 포함됨) |
| `A4

## 💻 코드 분석 Spec Sheet (C10_Config_Extras_0203.cpp - Part 8/11)

본 코드는 JSON 패치 데이터를 사용하여 웹 페이지 설정(`WebPageConfig`)을 업데이트하는 로직을 포함하고 있습니다. 다수의 유틸리티 함수와 임베디드 환경의 동기화 메커니즘이 사용되었습니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 웹 페이지 설정 관리자 클래스. JSON 패치 데이터를 파싱하여 내부 설정을 업데이트하는 핵심 로직을 담당합니다. | 정적 멤버 변수(`s_recursiveMutex`)를 가집니다. |
| `ST_A20_WebPageConfig_t` | Struct | 전체 웹 페이지 구성을 담는 구조체입니다. 여러 개의 페이지 항목 배열과 총 페이지 개수를 관리합니다. | 설정 데이터의 주 저장소 역할을 합니다. |
| `ST_A20_PageItem_t` | Struct | 단일 웹 페이지를 정의하는 항목 구조체입니다. URI, 경로, 레이블 등의 기본 정보를 포함합니다. | `WebPageConfig` 내 배열 요소로 사용됩니다. |
| `ST_A20_PageAsset_t` | Struct | 특정 페이지에 속한 개별 에셋(자산)을 정의하는 구조체입니다. | `PageItem` 내의 자산 목록 요소로 사용됩니다. |
| `JsonDocument`, `JsonObjectConst`, `JsonArrayConst` | Type Alias/Type | JSON 파싱 라이브러리에서 제공하는 타입으로, 메모리 효율적인 읽기 전용(Const) 접근을 보장합니다. | JSON 데이터 구조를 나타냅니다. |

### ⚙️ 동기화 및 상태 관리 (Synchronization & State Management)

| 이름 | 타입 | 설명 | 특이사항 |
| :--- | :--- | :--- | :--- |
| `s_recursiveMutex` | Mutex Object | 재귀적 잠금(Recursive Lock) 기능을 갖는 정적 뮤텍스 객체입니다. 여러 스레드가 동시에 설정 데이터를 수정하는 것을 방지합니다. | **임계 영역 보호:** `patchWebPageFromJson` 함수 시작 시 반드시 획득되어야 합니다. |
| `CL_A40_MutexGuard_Semaphore` | RAII Guard | 뮤텍스(`s_recursiveMutex`)를 안전하게 획득하고, 스코프를 벗어날 때 자동으로 해제(Release)하는 RAII 패턴의 가드 객체입니다. | **안전성:** 예외 발생 시에도 잠금 해제를 보장합니다. |
| `Dirty_set

## 🛠️ 시스템 아키텍처 명세서: C10\_Config\_Extras\_0203.cpp 파트 9/11 분석

본 코드는 JSON 구조체에서 웹 페이지 설정(WebPage) 데이터를 읽어와 내부 구성체(`p_cfg`)에 매핑하고, 변경 사항을 감지하여 시스템 상태를 업데이트하는 로직을 담당합니다.

---

### 📚 데이터 구조체 (Structs) 및 타입 정의

| 이름 | 유형 | 설명 | 주요 멤버 변수 |
| :--- | :--- | :--- | :--- |
| `ST_A20_ReDirectItem_t` | 구조체 | 리다이렉트(Redirect) 항목을 저장하는 구조체입니다. JSON의 `reDirect` 배열 요소 하나를 나타냅니다. | `uriFrom` (원본 URI), `uriTo` (대상 URI) |
| `ST_A20_CommonAsset_t` | 구조체 | 공통 에셋(Common Asset) 항목을 저장하는 구조체입니다. JSON의 `assets` 배열 요소 하나를 나타냅니다. | `uri` (URI 경로), `path` (파일 시스템 경로), `isCommon` (공통 여부 플래그) |
| `p_cfg` | 포인터/객체 | 웹 페이지 전체 설정을 담는 핵심 구성체입니다. 이 객체의 멤버 변수들이 데이터를 누적합니다. | `pageAssetCount`, `pageCount`, `reDirect[N]`, `assetCount`, `assets[M]` 등 |

### ⚙️ 함수 및 유틸리티 (Functions & Utilities)

| 이름 | 유형 | 설명 | 역할/특징 |
| :--- | :--- | :--- | :--- |
| `c::Json_copyStrReq` | 정적 메서드 | JSON 객체에서 문자열 값을 읽어 지정된 버퍼로 복사하는 유틸리티 함수입니다. 성공 여부와 메모리 복사 과정을 처리합니다. | **인자:** JSON 노드, 키 이름, 대상 버퍼 포인터, 버퍼 크기, 기본값, 호출자 함수명(`__func__`). |
| `A40_ComFunc::Json_getBool` | 정적 메서드 | JSON 객체에서 부울(Boolean) 값을 안전하게 읽어오는 유틸리티 함수입니다. 값이 없을 경우 지정된 기본값을 반환합니다. | **특징:** 데이터 타입 변환 및 기본값 처리를 담당합니다. |
| `CL_D10_Logger::log` | 정적 메서드 | 시스템 로그를 기록하는 로깅 함수입니다. 디버그 레벨의 메시지를 출력하여 현재 처리 단계를 추적할 수 있게 합니다. | **

## ⚙️ 코드 분석 Spec Sheet (C10_Config_Extras_0203.cpp)

본 코드는 설정(Configuration) 데이터를 JSON 형식으로 내보내기(Export)하는 로직을 담당하며, 다중 스레드 환경에서 데이터 무결성을 보장하기 위해 뮤텍스 보호 메커니즘이 핵심적으로 사용되었습니다.

---

### 📚 클래스 및 구조체 (Classes & Structs)

| 이름 | 타입 | 설명 |
| :--- | :--- | :--- |
| `CL_C10_ConfigManager` | Class | 설정 관리(Configuration Management)를 담당하는 메인 클래스. JSON Export 기능을 구현하며, 내부 상태(`s_recursiveMutex`) 보호에 책임을 집니다. |
| `ST_A20_NvsSpecConfig_t` | Struct | NVS (Non-Volatile Storage) 스펙 정보를 담는 구조체. 전체 네임스페이스와 엔트리 배열을 포함합니다. |
| `ST_A20_WebPageConfig_t` | Struct | 웹 페이지 구성을 담는 구조체. 페이지 목록, URI, 경로 등 웹 관련 메타데이터를 관리합니다. |
| `ST_A20_NvsEntry_t` | Struct | NVS 스펙의 개별 항목(Key-Value Pair)을 정의하는 구조체. 키, 타입, 기본값을 포함합니다. |
| `ST_A20_PageItem_t` | Struct | 웹 페이지 목록의 개별 아이템을 정의하는 구조체. URI, 경로, 레이블 등 페이지 속성을 가집니다. |
| `JsonDocument` | Type (Library) | JSON 데이터를 메모리상에서 생성하고 조작하기 위한 라이브러리 객체입니다. Export 결과물이 이 객체에 담깁니다. |

### 🛠️ 함수 및 메서드 (Functions & Methods)

#### 1. `D10_Logger::log`
*   **역할:** 시스템 로그를 기록하는 정적(Static) 로깅 유틸리티 함수입니다.
*   **사용 목적:** 설정 패치 성공/실패, 뮤텍스 타임아웃 등 다양한 이벤트 발생 시 상태 정보를 출력합니다.

#### 2. `CL_C10_ConfigManager::toJson_NvsSpec`
*   **시그니처:** `void toJson_NvsSpec(const ST_A20_NvsSpecConfig_t& p_cfg, JsonDocument& p_doc)`
*   **역할:** NVS 스펙 구조체(`p_cfg`)의 내용을 JSON 형식으로 변환하여 `p_doc`에 기록합니다.
*   **주요 로직:**
    1.  뮤텍스 획득을 시도하고 실패 시 로그를 남기며 종료합니다.
    2.  JSON 문서에서 기존의 `"nvsSpec"` 키가 존재할 경우, 데이터 잔재 방지(Stale Data Prevention)를 위해 해당 키를 먼저 제거(`remove`)합니다.
    3.  루트 객체에 `namespace`와 `entries` 배열을 순차적으로 추가하며 데이터를 매핑합니다.

#### 3. `CL_C10_ConfigManager::toJson_WebPage`
*   **시그니처:** `void toJson_WebPage(const ST_A20_WebPage

## ⚙️ 코드 분석 Spec: `C10_Config_Extras_0203.cpp` (Part 11/11)

본 코드는 구조화된 설정 데이터(Page Assets, Redirects, Common Assets)를 JSON 형식으로 직렬화하는 로직을 구현합니다.

### 📚 사용되는 주요 타입 및 상수

| 이름 | 유형 | 설명 |
| :--- | :--- | :--- |
| `JsonArray` | Type Alias/Class | 여러 항목을 담는 JSON 배열 객체입니다. (예: `v_pa`, `v_red`, `v_as`) |
| `JsonObject` | Type Alias/Class | 키-값 쌍으로 이루어진 단일 JSON 객체입니다. (예: `v_ao`, `v_ro`, `v_co`) |
| `uint8_t` | 기본 타입 | 0부터 255까지의 부호 없는 정수형입니다. 루프 인덱스에 사용됩니다. |
| `A20_Const::MAX_PAGE_ASSETS` | 상수 | 페이지 에셋 배열의 최대 허용 크기 제한 값입니다. |
| `A20_Const::MAX_REDIRECTS` | 상수 | 리다이렉트 항목 배열의 최대 허용 크기 제한 값입니다. |
| `A20_Const::MAX_COMMON_ASSETS` | 상수 | 공통 에셋 배열의 최대 허용 크기 제한 값입니다. |

### 🧩 구조체 (Structs) 및 데이터 모델

이 코드에서 사용되는 핵심 설정 데이터를 담는 구조체들입니다.

#### 1. `ST_A20_PageAsset_t`
*   **역할:** 페이지별 에셋 정보를 정의합니다.
*   **멤버 변수:**
    *   `uri`: 리소스의 URI 문자열 (C-style string).
    *   `path`: 파일 시스템 경로 문자열 (C-style string).

#### 2. `ST_A20_ReDirectItem_t`
*   **역할:** URL 리다이렉트 규칙을 정의합니다.
*   **멤버 변수:**
    *   `uriFrom`: 원본 URI (리다이렉트 시작점) 문자열.
    *   `uriTo`: 대상 URI (리다이렉트 도착점) 문자열.

#### 3. `ST_A20_CommonAsset_t`
*   **역할:** 모든 페이지에서 공통으로 사용되는 에셋 정보를 정의합니다.
*   **멤버 변수:**
    *   `uri`: 리소스의 URI 문자열.
    *   `path`: 파일 시스템 경로 문자열.
    *   `isCommon`: 해당 에셋이 공통 에셋인지 여부를 나타내는 부울 값 (Boolean).

### ⚙️ 함수 및 로직 흐름 (Functionality)
