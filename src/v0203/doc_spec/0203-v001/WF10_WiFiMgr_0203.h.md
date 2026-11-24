# `WF10_WiFiMgr_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: WF10_WiFiMgr_0203.h

ESP32-S3의 **Wi-Fi SoftAP / STA(`WiFiMulti`) 연결**, **지수 백오프(500ms→4000ms) 재연결**, **lock-free 연결 상태(`std::atomic<bool> s_staConnected`)**, 및 **비동기 재연결 전용 FreeRTOS 태스크(`_wifiTask`)**를 관리하는 `CL_WF10_WiFiManager` 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`EN_WF10_req_result_t`** (`typedef enum : uint8_t`)
    *   **설명:** `requestReconnect()` 비동기 재연결 요청 결과 열거형입니다.
    *   **사용처:** 웹 API/제어 요청 시 재연결 큐잉 성공/중복/실패 상태를 반환하는 데 사용됩니다.
*   **`CL_WF10_WiFiManager`** (`class`)
    *   **설명:** `s_staConnected`(atomic), `s_wifiMulti`, `s_wifiMutex`, `s_wifiTaskHandle`, `s_wifiRequestSem` 및 지수 백오프 상수(`G_WF10_BACKOFF_*`)를 캡슐화한 정적 Wi-Fi 매니저입니다.
    *   **사용처:** `A00_Main_0203.cpp` 부팅, `W10_Web_Routes_Network` 네트워크 설정 API, `TM10_TimeManager` 연동에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`attachWiFiEvents`** | `static void` | Wi-Fi 시스템 이벤트 핸들러(연결/IP 획득/해제)를 등록합니다. | 1. IP 획득 시 `s_staConnected = true` 설정 및 `CL_TM10_TimeManager::onWiFiConnected()`를 호출합니다. |
| **`init` / `applyConfig`** | `static bool` | Wi-Fi 설정(`ST_A20_WifiConfig_t`)에 따라 SoftAP 및 STA 모드를 초기화·적용합니다. | 1. AP 채널/DHCP/최대 재시도 횟수를 적용해 `startAP()` 및 `startSTA()`를 호출합니다. |
| **`startAP` / `startSTA`** | `static bool` | SoftAP(`NatureWind`) 또는 STA(`WiFiMulti`) 연결을 시작합니다. | 1. STA는 지수 백오프(`500ms * 2^n`, 최대 `4000ms`)로 최대 `p_maxTries`회 재시도합니다. |
| **`requestReconnect`** | `static EN_WF10_req_result_t` | 비동기 Wi-Fi 재연결을 `_wifiTask`에 요청합니다. | 1. `_ensureWifiTask()`로 전용 태스크를 보장한 뒤 `s_wifiRequestSem` 세마포어를 시그널링합니다. |
| **`getWifiStateJson` / `scanNetworksToJson`** | `static void` | 현재 Wi-Fi 상태(IP, RSSI, 모드) 또는 주변 AP 스캔 결과를 JSON으로 채웁니다. | 1. 웹 UI 네트워크 페이지 조회 API에 사용됩니다. |
| **`isStaConnected` / `getStaStatusString`** | `static bool` / `const char*` | lock-free `s_staConnected` 상태 및 상태 문자열을 반환합니다. | 1. [D-4] `std::atomic<bool>`로 락 없이 빠른 상태 조회를 지원합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<WiFi.h>` / `<WiFiMulti.h>` / `<lwip/dns.h>`**:
    *   ESP32 Wi-Fi 드라이버, 다중 AP 자동 선택 및 DNS 설정에 사용됩니다.
*   **`<freertos/FreeRTOS.h>` / `<freertos/semphr.h>` / `<freertos/task.h>` / `<atomic>`**:
    *   비동기 재연결 태스크(`_wifiTask`), 뮤텍스/세마포어 및 lock-free 상태 관리에 사용됩니다.
*   **`"A20_Const_0203.h"` / `"C10_Config_0203.h"` / `"D10_Logger_0203.h"` / `"TM10_TimeMg_0203.h"`**:
    *   Wi-Fi 설정 구조체, 로깅 및 연결 시 NTP 동기화 트리거에 사용됩니다.
