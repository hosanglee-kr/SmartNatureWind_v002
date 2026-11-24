# `W10_Web_Routes_Network_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_Network_0203.cpp

**Wi-Fi 설정 조회/패치(`routeWifiConfig`)**, **수동 시각 설정(`routeTimeSet`)**, 및 **펌웨어 버전 비교·업데이트 확인(`routeFirmwareCheck`)** 엔드포인트를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WifiConfig_t`**
    *   **설명:** SoftAP/STA SSID, 비밀번호 및 Wi-Fi 모드 설정 구조체입니다.
    *   **사용처:** `routeWifiConfig()`에서 현재 Wi-Fi 설정을 조회하거나 패치할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`_w10_compareSemVer`** | `static int` | 두 SemVer 버전 문자열(`p_a`, `p_b`)을 비교합니다. | 1. Major/Minor/Patch 정수를 파싱해 대소를 판정합니다. |
| **`_netOnReqEmptyCheck` / `_netAccumJson` / `_routeWifiConfigPatchBody`** | `static void` / `bool` | 네트워크 API 요청의 빈 바디를 검사하고 Wi-Fi 설정 패치를 적용합니다. | 1. 설정 반영 후 비동기 Wi-Fi 재연결을 트리거합니다. |
| **`routeWifiConfig`** | `void` | `/api/v001/wifi/config` GET/POST/PATCH 요청을 처리합니다. | 1. `CL_C10_ConfigManager`와 연동해 Wi-Fi 설정을 조회·갱신합니다. |
| **`routeTimeSet`** | `void` | `POST /api/v001/system/time/set`으로 수동/브라우저 시각 동기화를 수행합니다. | 1. NTP 미연결 환경에서도 기기 시각을 맞출 수 있습니다. |
| **`routeFirmwareCheck`** | `void` | `GET /api/v001/system/firmware/check`로 현재 펌웨어와 최신 버전(`_w10_compareSemVer`)을 비교합니다. | 1. 업데이트 가능 여부를 JSON으로 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"WF10_WiFiMgr_0203.h"` / `"C10_Config_0203.h"` / `"TM10_TimeMg_0203.h"`**:
    *   Wi-Fi 재연결, 설정 저장 및 시간 동기화 API에 사용됩니다.
