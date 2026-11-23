# `WF10_WiFiMgr_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: WF10_WiFiMgr_0203.cpp

`WF10_WiFiMgr_0203.h`에 선언된 `CL_WF10_WiFiManager`의 구현부로, Wi-Fi 이벤트 리스너, SoftAP/STA 기동, 지수 백오프 재연결, 주변 AP 스캔, 설정 스냅샷 기반 비동기 재연결 태스크(`_wifiTask`)를 구현합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_WF10_WiFiManager`** (`class`)
    *   **설명:** `WF10_WiFiMgr_0203.h`에 정의된 정적 Wi-Fi 매니저 클래스입니다.
    *   **사용처:** `s_reconnectAttempts`, `s_wifiTaskHandle`, `s_wifiRequestSem` 정적 멤버를 통해 재연결 태스크와 상태를 관리합니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`attachWiFiEvents`** | `void` | `WiFi.onEvent`를 1회 등록해 연결/IP 획득/연결 해제 이벤트를 처리합니다. | 1. `v_attached` 가드로 중복 등록을 방지하고 `s_staConnected` 및 `TM10` 콜백을 연동합니다. |
| **`init` / `applyConfig`** | `bool` | 설정 구조체(`ST_A20_WifiConfig_t`)를 검증하고 AP/STA 모드를 초기화·적용합니다. | 1. `C10_ConfigManager` 스냅샷과 함께 `init(p_cfg, ..., 1, 15, true)`를 호출합니다. |
| **`startAP` / `startSTA`** | `bool` | SoftAP(`WiFi.softAP`) 및 STA(`WiFiMulti`) 연결을 수행합니다. | 1. STA는 `G_WF10_BACKOFF_INIT_MS`(500ms)부터 지수 백오프로 재시도합니다. |
| **`getWifiStateJson` / `scanNetworksToJson`** | `void` | 현재 Wi-Fi 연결 상태 및 `WiFi.scanNetworks(false, true)` 결과를 JSON으로 직렬화합니다. | 1. 암호화 방식은 `_encTypeToString()`으로 문자열 변환합니다. |
| **`isStaConnected` / `getStaStatusString`** | `bool` / `const char*` | 현재 STA 연결 여부 및 상태 문자열을 반환합니다. | 1. `s_staConnected` atomic 플래그를 락 없이 읽습니다. |
| **`_ensureWifiTask` / `_wifiTask`** | `bool` / `void` | 비동기 재연결 전용 FreeRTOS 태스크를 생성하고 세마포어 대기 루프를 실행합니다. | 1. `s_wifiRequestSem` 수신 시 정적 스냅샷 `s_wifiSnap`을 복사해 `applyConfig(s_wifiSnap)`를 실행합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"WF10_WiFiMgr_0203.h"`**:
    *   `CL_WF10_WiFiManager` 클래스 및 백오프 상수 선언을 제공합니다.
*   **`"A40_Com_Utils_0203.h"` / `"C10_Config_0203.h"`**:
    *   뮤텍스 가드 및 최신 Wi-Fi/시스템 설정 스냅샷 조회에 사용됩니다.
*   **`<esp_netif.h>` / `<lwip/dns.h>` / `<lwip/ip_addr.h>`**:
    *   ESP-IDF 네트워크 인터페이스 및 DNS/IP 주소 처리에 사용됩니다.
