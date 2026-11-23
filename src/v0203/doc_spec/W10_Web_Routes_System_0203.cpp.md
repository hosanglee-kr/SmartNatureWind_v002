# `W10_Web_Routes_System_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_System_0203.cpp

**버전(`routeVersion`), 기기 상태(`routeState`), 시스템 설정(`routeSystem`), 모션 설정(`routeMotion`), 진단(`routeDiag`), 메트릭(`routeMetrics`), 로그(`routeLogs`), 인증 테스트(`routeAuthTest`), Wi-Fi 스캔/상태(`routeScan`, `routeWifiState`)** API를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_SystemConfig_t` / `ST_A20_MotionConfig_t`**
    *   **설명:** 시스템 및 모션 설정 구조체입니다.
    *   **사용처:** `routeSystem()`, `routeMotion()`에서 조회 및 패치 반영 시 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`routeVersion` / `routeState` / `routeDiag` / `routeMetrics` / `routeLogs`** | `void` | 펌웨어 버전, 현재 상태, 시스템 진단, 힙/태스크 메트릭, 로그 버퍼를 JSON으로 반환합니다. | 1. `CL_CT10_ControlManager` 및 `CL_D10_Logger`에서 실시간 스냅샷을 직렬화합니다. |
| **`routeSystem` / `_routeSystemPatchBody`** | `void` | `/api/v001/system` GET 조회 및 POST/PATCH 설정 변경을 처리합니다. | 1. `patchSystemFromJson` 후 `applySystemRuntimeFromConfig()`로 즉시 반영합니다. |
| **`routeMotion` / `_routeMotionPatchBody`** | `void` | `/api/v001/motion` GET 조회 및 POST/PATCH 모션 설정 변경을 처리합니다. | 1. 변경 후 `requestMotionSimApply()`로 시뮬레이션에 반영합니다. |
| **`routeAuthTest` / `routeScan` / `routeWifiState`** | `void` | API Key 인증 확인, 주변 Wi-Fi AP 스캔 및 현재 Wi-Fi 상태를 반환합니다. | 1. `CL_WF10_WiFiManager::scanNetworksToJson()` 및 `getWifiStateJson()`을 호출합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"` / `"C10_Config_0203.h"` / `"WF10_WiFiMgr_0203.h"`**:
    *   시스템/모션 설정, 상태 조회 및 Wi-Fi 스캔에 사용됩니다.
