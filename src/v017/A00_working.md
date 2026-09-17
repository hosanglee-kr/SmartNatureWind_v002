E-2, E-3, E-4 — 통합 diff

---

E-2. WiFi task 실패 → "coalesced" 오인

문제

requestReconnect()가 실패(task 미생성) / coalesce(pending) 두 경우 모두 false 반환 → W10 라우트가 둘 다 "coalesced" 응답.

수정 — 3상태 반환

WF10_WiFiMgr_070.h — 반환 타입 확장:

```cpp
  public:
    // --------------------------------------------------
    // [WF10-task] 재연결 요청 상태 (E-2)
    //  - OK        : 요청 성공 (task signaled)
    //  - COALESCED : 이미 pending (중복 요청)
    //  - FAILED    : task 생성 실패
    // --------------------------------------------------
    typedef enum : uint8_t {
        EN_WF10_REQ_OK        = 0,
        EN_WF10_REQ_COALESCED = 1,
        EN_WF10_REQ_FAILED    = 2
    } EN_WF10_req_result_t;

    static EN_WF10_req_result_t requestReconnect();   // ← 반환 타입 확장
```

WF10_WiFiMgr_070.cpp::requestReconnect

```cpp
// BEFORE
bool CL_WF10_WiFiManager::requestReconnect() {
    if (!_ensureWifiTask()) return false;

    if (xSemaphoreGive(s_wifiRequestSem) != pdTRUE) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect already pending (coalesced)");
        return false;
    }

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect requested (WiFi task signaled)");
    return true;
}

// AFTER
CL_WF10_WiFiManager::EN_WF10_req_result_t CL_WF10_WiFiManager::requestReconnect() {
    // [E-2] task 생성 실패는 COALESCED로 오인되지 않도록 구분 반환
    if (!_ensureWifiTask()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] Reconnect request failed: task unavailable");
        return EN_WF10_REQ_FAILED;
    }

    if (xSemaphoreGive(s_wifiRequestSem) != pdTRUE) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect already pending (coalesced)");
        return EN_WF10_REQ_COALESCED;
    }

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Reconnect requested (WiFi task signaled)");
    return EN_WF10_REQ_OK;
}
```

W10_Web_Routes_070.cpp::routeWifiConfig (POST/PATCH 공통)

```cpp
// BEFORE
bool v_reqOk = CL_WF10_WiFiManager::requestReconnect();
v_res["status"] = v_reqOk ? "requested" : "coalesced";

// AFTER
auto v_req = CL_WF10_WiFiManager::requestReconnect();
switch (v_req) {
    case CL_WF10_WiFiManager::EN_WF10_REQ_OK:
        v_res["status"] = "requested";
        break;
    case CL_WF10_WiFiManager::EN_WF10_REQ_COALESCED:
        v_res["status"] = "coalesced";
        break;
    case CL_WF10_WiFiManager::EN_WF10_REQ_FAILED:
    default:
        v_res["status"] = "task_failed";
        break;
}
```

---

E-3. Mutex timeout 로그 폭주

문제

reloadAll 실행 중 (수 초) → 매 tick마다 ERROR 로그. 4개 모듈 × 초당 ~10회 = 로그 폭주.

수정 — 3파일, ERROR → DEBUG

CT10_Ctl_Ctl_070.cpp::tickLoop:

```cpp
// BEFORE
if (!v_guard.isAcquired()) {
    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[CT10] %s: Mutex timeout", __func__);
    return;
}

// AFTER
if (!v_guard.isAcquired()) {
    // [E-3] reloadAll 등 정상 상황에서도 발생 → DEBUG 하향
    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
    return;
}
```

CT10_Ctl_IOWS_070.cpp — export 함수 5곳 (exportStateJson_v02, exportChartJson, exportSummaryJson, exportMetricsJson + markDirty/consume 4곳):

```cpp
// 모든 ERROR → DEBUG, "Mutex timeout" → "Mutex busy"
CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
```

N10_NvsManager_070.cpp — 모든 guard 실패 로그:

```cpp
// BEFORE (10곳)
CL_D10_Logger::log(EN_L10_LOG_ERROR, "[N10] %s: Mutex timeout", __func__);

// AFTER
CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[N10] %s: Mutex busy", __func__);
```

M10_MotionLogic_070.h — 해당 없음 (현재 실패 로그 없음).

WF10_WiFiMgr_070.cpp — 6곳:

```cpp
// 모든 "[WF10] %s: Mutex timeout" → DEBUG "Mutex busy"
CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[WF10] %s: Mutex busy", __func__);
```

TM10_TimeMg_070.h — 다수:

```cpp
// 모든 "[TM10] %s: Mutex timeout" → DEBUG
CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[TM10] %s: Mutex busy", __func__);
```

---

E-4. /override/fixed seconds 파라미터 optional

문제

seconds 누락 시 400. seconds=0 명시해야 20분 기본.

W10_Web_Routes_070.cpp::routeControl — override/fixed 핸들러

```cpp
// BEFORE
s_server->on(W10_Const::HTTP_API_CTL_OVR_FIXED, HTTP_POST, [](AsyncWebServerRequest* p_request) {
    if (!checkApiKey(p_request)) { ... }
    if (!p_request->hasParam("percent", true) || !p_request->hasParam("seconds", true)) {
        p_request->send(400, "application/json", "{\"error\":\"missing param\"}");
        return;
    }
    float    v_pct = p_request->getParam("percent", true)->value().toFloat();
    uint32_t v_sec = (uint32_t)p_request->getParam("seconds", true)->value().toInt();
    if (s_control) {
        s_control->startOverrideFixed(v_pct, v_sec);
    }
    p_request->send(200, "application/json", "{\"result\":\"ok\"}");
});

// AFTER
s_server->on(W10_Const::HTTP_API_CTL_OVR_FIXED, HTTP_POST, [](AsyncWebServerRequest* p_request) {
    if (!checkApiKey(p_request)) {
        p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
        return;
    }

    // [E-4] percent만 필수, seconds는 optional (누락/0 → CT10 기본 20분)
    if (!p_request->hasParam("percent", true)) {
        p_request->send(400, "application/json", "{\"error\":\"missing param: percent\"}");
        return;
    }

    float    v_pct = p_request->getParam("percent", true)->value().toFloat();
    uint32_t v_sec = p_request->hasParam("seconds", true)
                        ? (uint32_t)p_request->getParam("seconds", true)->value().toInt()
                        : 0;

    if (s_control) {
        s_control->startOverrideFixed(v_pct, v_sec);
    }
    p_request->send(200, "application/json", "{\"result\":\"ok\"}");
});
```

---

검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 WiFi task 정상 + 요청 status: "requested"
3 WiFi task 정상 + 재요청 status: "coalesced"
4 task 생성 실패 (시뮬) status: "task_failed"
5 reload 5초 중 시리얼 Mutex busy DEBUG (ERROR 아님)
6 POST /override/fixed?percent=50 (seconds 누락) 200, 20분 기본
7 POST /override/fixed?percent=50&seconds=30 200, 30초
8 POST /override/fixed?percent=50&seconds=0 200, 20분
9 POST /override/fixed (percent 누락) 400

---

변경 요약

파일 E-2 E-3 E-4
WF10_WiFiMgr_070.h enum + 시그니처 — —
WF10_WiFiMgr_070.cpp 3상태 반환 + 6곳 로그 하향 ✓ —
W10_Web_Routes_070.cpp switch 분기 — 4줄
CT10_Ctl_Ctl_070.cpp — tickLoop 1곳 —
CT10_Ctl_IOWS_070.cpp — 8곳 —
N10_NvsManager_070.cpp — 10곳 —
TM10_TimeMg_070.h — 다수 —

순 삭제 없음, 로그 레벨/시그니처/파라미터 개선.

---

적용 후 컴파일 결과 알려주세요.