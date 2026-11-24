# `W10_Web_Routes_Config_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_Config_0203.cpp

**Dirty 설정 조회/일괄 저장(`routeConfigDirtySave`)**, **공장 초기화(`routeConfigInit`)**, 및 **무중단 설정 재로드(`routeReload`)** 엔드포인트를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_C10_ConfigManager`** (`class`)
    *   **설명:** LittleFS 설정 Dirty 플래그, 원자적 일괄 저장 및 기본값 공장 초기화를 담당하는 매니저입니다.
    *   **사용처:** `/api/v001/config*` 및 `/api/v001/reload` 라우트에서 호출됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_W10_WebAPI::routeConfigDirtySave`** | `void` | `/api/v001/config`, `/config/save`, `/config/dirty` 요청을 처리해 변경된 설정을 LittleFS에 저장합니다. | 1. `CL_C10_ConfigManager::saveDirtyConfigs()`를 호출하고 결과를 JSON으로 반환합니다. |
| **`CL_W10_WebAPI::routeConfigInit`** | `void` | `POST /api/v001/config/init` 요청으로 설정을 공장 기본값으로 초기화합니다. | 1. `CL_C10_ConfigManager::factoryResetFromDefault()`를 실행합니다. |
| **`CL_W10_WebAPI::routeReload`** | `void` | `POST /api/v001/reload` 요청으로 설정 재로드를 예약합니다. | 1. `CL_CT10_ControlManager::requestReload()` 위임 플래그를 설정합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"C10_Config_0203.h"` / `"CT10_Ctl_0203.h"`**:
    *   설정 저장/초기화 및 재로드 위임에 사용됩니다.
