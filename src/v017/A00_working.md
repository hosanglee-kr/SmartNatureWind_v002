최종 확정 — handleHandshake() 방식

확인 감사합니다. 결론에 맞춰 ws.handleHandshake() 방식을 채택합니다. onEvent 쪽엔 손 안 대도 되고, 핸드셰이크 단계에서 바로 거부되어 로그·구조 모두 깔끔합니다.

---

📦 작업 A — WiFi state 신설

A-1. W10_Web_Const_070.h

```cpp
constexpr const char* HTTP_API_WIFI_SCAN   = HTTP_API_BASE "/wifi/scan";
constexpr const char* HTTP_API_WIFI_STATE  = HTTP_API_BASE "/wifi/state";   // ← 신규
constexpr const char* HTTP_API_WIFI_CONFIG = HTTP_API_BASE "/wifi/config";
```

A-2. W10_Web_070.h

```cpp
    // 4. 네트워크 및 펌웨어 관리 (GET/POST)
    static void routeScan();          // GET  /api/v001/wifi/scan
    static void routeWifiState();     // GET  /api/v001/wifi/state      ← 신규
    static void routeWifiConfig();    // GET/POST/PATCH /api/v001/wifi/config
```

A-3. W10_Web_Routes_070.cpp

등록부 (begin() 내):

```cpp
    routeScan();
    routeWifiState();      // ← 신규
    routeAuthTest();
```

구현부 (routeScan() 바로 뒤):

```cpp
// --------------------------------------------------
// 17-1. /api/v001/wifi/state  (Wi-Fi 런타임 상태)
//  - WF10_WiFiManager::getWifiStateJson 재사용
//  - 응답: {"wifi":{"state":{...}}}
// --------------------------------------------------
void CL_W10_WebAPI::routeWifiState() {
    s_server->on(W10_Const::HTTP_API_WIFI_STATE, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        JsonDocument v_doc;
        CL_WF10_WiFiManager::getWifiStateJson(v_doc);
        sendJson(p_request, v_doc);
    });
}
```

---

📦 작업 B — WS 인증 (handleHandshake)

B-1. W10_Web_WS_070.cpp — 파일 상단 helper

#include "W10_Web_070.h" 바로 아래에:

```cpp
// --------------------------------------------------
// [WS 인증] 핸드셰이크 단계 쿼리 파라미터 apiKey 검사
//  - ESPAsyncWebServer 3.12.1: AsyncWebSocketClient::request() 부재
//  - handleHandshake()가 유일하게 AsyncWebServerRequest* 접근 가능
//  - 반환 false → 연결 거부 (서버가 401 상당 응답 후 종료)
//  - API Key 미설정 시 통과 (개발/개방 모드)
// --------------------------------------------------
static bool _wsHandshakeAuth(AsyncWebServerRequest* p_request) {
    if (!p_request) return false;

    // 1) API Key 미설정 → 개방 모드
    const char* v_key = nullptr;
    if (g_A20_config_root.system && g_A20_config_root.system->security.apiKey[0] != '\0') {
        v_key = g_A20_config_root.system->security.apiKey;
    }
    if (!v_key || v_key[0] == '\0') return true;

    // 2) 쿼리 파라미터 apiKey
    if (!p_request->hasParam("apiKey")) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[W10][WS] handshake reject: missing apiKey (uri=%s)",
                           p_request->url().c_str());
        return false;
    }

    const String& v_val = p_request->getParam("apiKey")->value();
    if (v_val != v_key) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[W10][WS] handshake reject: invalid apiKey (uri=%s)",
                           p_request->url().c_str());
        return false;
    }

    return true;
}
```

B-2. W10_Web_WS_070.cpp — routeWebSocket() 상단에 일괄 등록

if (!s_wsServerLogs || ...) return; 방어 블록 바로 뒤에 5줄 삽입:

```cpp
void CL_W10_WebAPI::routeWebSocket() {
    if (!s_server) return;
    if (!s_wsServerLogs || !s_wsServerState || !s_wsServerChart || !s_wsServerSummary || !s_wsServerMetrics) return;

    // ─────────────────────────────────────────────
    // [WS 인증] 핸드셰이크 단계에서 쿼리 apiKey 검증
    //  - ESPAsyncWebServer 3.12.1: request() 부재 → handleHandshake 유일
    //  - 각 WS 인스턴스에 공통 정책 적용 (개별 onEvent 수정 불필요)
    // ─────────────────────────────────────────────
    s_wsServerLogs   ->handleHandshake(_wsHandshakeAuth);
    s_wsServerState  ->handleHandshake(_wsHandshakeAuth);
    s_wsServerChart  ->handleHandshake(_wsHandshakeAuth);
    s_wsServerSummary->handleHandshake(_wsHandshakeAuth);
    s_wsServerMetrics->handleHandshake(_wsHandshakeAuth);

    // 이하 기존 onEvent / addHandler 블록 그대로 유지
    s_wsServerLogs->onEvent(...);
    s_server->addHandler(s_wsServerLogs);
    ...
}
```

기존 onEvent 람다들은 손대지 않습니다. 거부는 이미 핸드셰이크 단계에서 처리되므로 WS_EVT_CONNECT는 인증 통과한 클라이언트만 도달합니다.

---

📦 프론트 수정 (백엔드 배포 후)

F-1. P001_API_070.js

```js
get API_HTTP_WIFI_SCAN()   { return `${BASE}/wifi/scan`; },
get API_HTTP_WIFI_STATE()  { return `${BASE}/wifi/state`; },   // ← 신규
get API_HTTP_WIFI_CONFIG() { return `${BASE}/wifi/config`; },
```

F-2. P010_main_070.js — WiFi 상태 별도 로드

```js
async function loadWifiStateOnce() {
    const data = await apiFetch(SNW_API.API_HTTP_WIFI_STATE, { method: "GET" }, true);
    if (!data) return;

    const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : {};

    const elWM = elWifiMode();
    if (elWM) elWM.textContent = (wifi.mode_name || wifi.mode || "-").toString();

    const elWS = elCurSsid();
    if (elWS) elWS.textContent = wifi.ssid || "-";

    const elIP = elIp();
    if (elIP) elIP.textContent = wifi.ip || "-";
}
```

loadStateOnce() 내 WiFi 부분 삭제 (sim 처리만 남김).

DOMContentLoaded 호출 순서:

```js
await loadFwVersion();
await loadConfig();
await loadStateOnce();
await loadWifiStateOnce();   // ← 추가
```

F-3. P000_common_070.js — 변경 없음

buildWsUrl()이 이미 ?apiKey=xxx 형식으로 전송 중이라 그대로 동작합니다.

---

✅ 검증

```bash
# A. WiFi state
curl -H "X-API-Key: <key>" http://<ip>/api/v001/wifi/state
# 기대: 200 {"wifi":{"state":{"mode_name":"AP+STA","ssid":"...",...}}}

# B. WS 인증
# 실패 케이스: 연결 즉시 종료
wscat -c ws://<ip>/ws/state
# 성공 케이스
wscat -c "ws://<ip>/ws/state?apiKey=<key>"
```

브라우저 콘솔(F12):

```js
// 핸드셰이크 거부 시 즉시 onclose
const ws = new WebSocket("ws://<ip>/ws/state");                 // → onclose
const ws2 = new WebSocket("ws://<ip>/ws/state?apiKey=<key>");   // → onopen
```

백엔드 시리얼 로그:

```
[W10][WS] handshake reject: missing apiKey (uri=/ws/state)
[W10][WS] handshake reject: invalid apiKey (uri=/ws/state)
```

---

📋 최종 변경 요약

# 파일 변경
1 W10_Web_Const_070.h HTTP_API_WIFI_STATE 상수 1줄 추가
2 W10_Web_070.h routeWifiState() 선언 1줄
3 W10_Web_Routes_070.cpp 등록 1줄 + 함수 12줄
4 W10_Web_WS_070.cpp helper 함수 25줄 + handleHandshake 5줄
5 P001_API_070.js 상수 1줄
6 P010_main_070.js 함수 추가 + WiFi 파트 이관

핵심 포인트:

· handleHandshake는 onEvent 이전에 실행됨 → 기존 WS 핸들러 코드 완전 보존
· 프론트 buildWsUrl()이 이미 ?apiKey= 형식이라 프론트 WS 코드 변경 0줄
· API Key 미설정 시 개방 모드 유지 → 개발 편의성 보존

---

다음

이대로 반영하시면 됩니다. 원하시면:

· (A) 위 4개 백엔드 파일의 완성본을 한 번에 드리기 (해당 함수만 발췌한 patch 형태)
· (B) 그대로 진행하시고 컴파일 에러 발생 시 대응

어떻게 할까요?