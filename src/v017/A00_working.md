Web API 누락/차이 점검

1. 선언 vs 등록 전수 대조

36개 Const vs 등록 확인

# Const 값 등록 위치 상태
1 HTTP_API_VERSION /api/v001/version routeVersion ✅
2 HTTP_API_STATE /api/v001/state routeState ✅
3 HTTP_API_SYSTEM /api/v001/system routeSystem (GET/POST/PATCH) ✅
4 HTTP_API_WIFI_SCAN /api/v001/wifi/scan routeScan ✅
5 HTTP_API_WIFI_CONFIG /api/v001/wifi/config routeWifiConfig (GET/POST/PATCH) ✅
6 HTTP_API_DIAG /api/v001/diag routeDiag ✅
7 HTTP_API_AUTH_TEST /api/v001/auth/test routeAuthTest ✅
8 HTTP_API_TIME_SET /api/v001/system/time/set routeTimeSet ✅
9 HTTP_API_FW_CHECK /api/v001/system/firmware/check routeFirmwareCheck ✅
10 HTTP_API_MOTION /api/v001/motion routeMotion (GET/POST) ✅
11 HTTP_API_SIMULATION /api/v001/simulation routeSimulation (GET/POST) ✅
12 HTTP_API_SIM_STATE /api/v001/sim/state routeSimState ✅
13 HTTP_API_CONTROL_SUMMARY /api/v001/control/summary routeControlSummary ✅
14 HTTP_API_CONFIG /api/v001/config routeConfigDirtySave ✅
15 HTTP_API_CONFIG_SAVE /api/v001/config/save routeConfigDirtySave ✅
16 HTTP_API_CONFIG_DIRTY /api/v001/config/dirty routeConfigDirtySave ✅
17 HTTP_API_CONFIG_INIT /api/v001/config/init routeConfigInit ✅
18 HTTP_API_RELOAD /api/v001/reload routeReload ✅
19 HTTP_API_WIND_PROFILE /api/v001/windProfile routeWindProfile ✅
20 HTTP_API_SCHEDULES /api/v001/schedules routeSchedules ✅
21 HTTP_API_USER_PROFILES /api/v001/user_profiles routeUserProfiles ✅
22 HTTP_API_USER_PROFILES_PATCH /api/v001/user_profiles/patch routeUserProfilesPatch ✅
23 HTTP_API_CTL_REBOOT /api/v001/control/reboot routeControl ✅
24 HTTP_API_CTL_FACTORY /api/v001/control/factoryReset routeControl ✅
25 HTTP_API_CTL_PROF_SEL /api/v001/control/profile/select routeControl ✅
26 HTTP_API_CTL_PROF_STOP /api/v001/control/profile/stop routeControl ✅
27 HTTP_API_CTL_OVR_FIXED /api/v001/control/override/fixed routeControl ✅
28 HTTP_API_CTL_OVR_PRESET /api/v001/control/override/preset routeControl ✅
29 HTTP_API_CTL_OVR_CLEAR /api/v001/control/override/clear routeControl ✅
30 HTTP_API_GEMINI_PROXY /api/v001/ai/gemini routeGeminiProxy ✅
31 HTTP_API_FEED_PIR /api/v001/motion/pir/feed routeMotionFeed ✅
32 HTTP_API_METRICS /api/v001/metrics routeMetrics ✅
33 HTTP_API_LOGS /api/v001/logs routeLogs ✅
34 HTTP_API_FILE_UPLOAD /api/v001/fileUpload routeUpload ✅
35 HTTP_API_FW_UPDATE /api/v001/fwUpdate routeUpdate ✅
36 HTTP_API_MENU /api/v001/menu routeStaticAssets ✅

결과: 36/36 전부 등록됨. API 누락 없음.

---

2. 🔴 주석 vs 실제 경로 불일치 (혼란 유발)

2-1. W10_Web_070.h 라우팅 선언 주석

```cpp
// 1. 시스템 정보 조회 및 진단 (GET)
static void routeVersion();  // GET /api/version          ← 실제 /api/v001/version
static void routeState();    // GET /api/state            ← 실제 /api/v001/state
static void routeDiag();     // GET /api/diag             ← 실제 /api/v001/diag
static void routeMetrics();  // GET /api/metrics          ← 실제 /api/v001/metrics
static void routeLogs();     // GET /api/logs             ← 실제 /api/v001/logs
static void routeAuthTest(); // GET /api/auth/test        ← 실제 /api/v001/auth/test

// 2. 설정 조회 및 패치/CRUD
static void routeSystem(); // GET/POST /api/system         ← 실제 /api/v001/system
static void routeMotion(); // GET/POST /api/motion         ← 실제 /api/v001/motion
static void routeUserProfiles();      // GET/POST /api/user_profiles     ← 실제 /api/v001/user_profiles
static void routeUserProfilesID();    // PUT/DELETE /api/user_profiles/{id}  ← 실제 /api/v001/...
static void routeUserProfilesPatch(); // POST /api/user_profiles/patch   ← 실제 /api/v001/...

// 4. 네트워크 및 펌웨어 관리
static void routeScan();          // GET /api/scan                ← 실제 /api/v001/wifi/scan
static void routeWifiConfig();    // POST /api/network/wifi/config ← 실제 /api/v001/wifi/config
static void routeTimeSet();       // POST /api/system/time/set    ← 실제 /api/v001/system/time/set
static void routeFirmwareCheck(); // GET /api/system/firmware/check ← 실제 /api/v001/system/firmware/check
static void routeUpload();        // POST /upload                 ← 실제 /api/v001/fileUpload
static void routeUpdate();        // POST /update                 ← 실제 /api/v001/fwUpdate

// 5. 제어 및 상태 요약
static void routeControl();        // 여러 제어용 /api/control/*  ← 실제 /api/v001/control/*
static void routeControlSummary(); // GET /api/control/summary   ← 실제 /api/v001/control/summary
static void routeMotionFeed();     // POST /api/motion/pir/feed  ← 실제 /api/v001/motion/pir/feed

// 6. 시뮬레이션 제어
static void routeSimulation(); // GET/POST /api/simulation     ← 실제 /api/v001/simulation
static void routeSimState();   // GET /api/sim/state           ← 실제 /api/v001/sim/state

// 7. CRUD: Wind Profiles
static void routeWindProfile();   // GET/POST /api/windProfile       ← 실제 /api/v001/...
static void routeWindProfileID(); // PUT/DELETE /api/windProfile/{id} ← 실제 /api/v001/...

// 8. CRUD: Schedules
static void routeSchedules();   // GET/POST /api/schedules       ← 실제 /api/v001/...
static void routeSchedulesID(); // PUT/DELETE /api/schedules/{id} ← 실제 /api/v001/...

// 9. 정적 파일 및 웹소켓
static void routeStaticAssets(); // JSON 기반 static routes
static void routeWebSocket();    // WS 라우트 초기화
```

모든 주석이 /v001 prefix 누락 → 신규 개발자/프론트 개발자 혼란.

2-2. W10_Web_Routes_070.cpp 섹션 주석

```cpp
// --------------------------------------------------
// 통합된 /api/network/wifi/config (GET/POST/PATCH)   ← 실제 /api/v001/wifi/config
// --------------------------------------------------
```

```cpp
// --------------------------------------------------
// /update (OTA 펌웨어 업데이트)                       ← 실제 /api/v001/fwUpdate
// --------------------------------------------------
```

---

3.  실제 결(2건)



3-2. routeMotion — PATCH 누락

```cpp
void CL_W10_WebAPI::routeMotion() {
    // GET  ✅
    s_server->on(W10_Const::HTTP_API_MOTION, HTTP_GET, ...);
    // POST ✅
    s_server->on(W10_Const::HTTP_API_MOTION, HTTP_POST, ...);
    // PATCH ❌ (routeSystem / routeWifiConfig에는 있음)
}
```

일관성: /api/v001/system, /api/v001/wifi/config는 GET/POST/PATCH 지원, /api/v001/motion은 GET/POST만.

프론트엔드가 PATCH로 호출하면 405 (Method Not Allowed).

수정 (옵션, 선택):

```cpp
s_server->on(W10_Const::HTTP_API_MOTION, HTTP_PATCH, 
    [](AsyncWebServerRequest* p_request){}, nullptr,
    [](AsyncWebServerRequest* p_request, uint8_t* p_data, size_t p_len, size_t p_index, size_t p_total) {
        // POST와 동일 로직
    });
```

영향: 프론트가 POST만 사용하면 무해. 확인 필요.

---

3-3. routeReload — 무효화된 파일 참조

```cpp
void CL_W10_WebAPI::routeReload() {
    ...
    ST_A20_ConfigRoot_t v_root;                      // ← 이전 버전 잔재
    bool v_ok = CL_C10_ConfigManager::loadAll(v_root);   // ← v_root 갱신
    if (!v_ok) { ... }
    g_A20_config_root = v_root;                       // ← A-min 이전 방식
    ...
}
```

그러나 실제 코드 (제공 소스):

```cpp
void CL_W10_WebAPI::routeReload() {
    s_server->on(W10_Const::HTTP_API_RELOAD, HTTP_POST, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) { ... }
        // [A-min] CT10::reloadAll로 통합 위임
        bool v_ok = CL_CT10_ControlManager::reloadAll();
        ...
    });
}
```

✅ 수정 완료 상태 (A-min 반영).

이상 없음 — 초기 분석에서 잘못 봄.

---

4. 🟡 누락 API (설계 의도 확인 필요)

4-1. /api/v001/wifi (기본) 미등록

```cpp
// W10_Web_070.h
// static void routeWifi();          // GET/POST /api/wifi    ← 주석 처리됨
```

결과: WiFi 설정은 /api/v001/wifi/config만 사용.

의도 여부: 확인 필요. WiFi 조회/저장 통합 경로로 wifi/config만 쓰는 것은 정상.

---

4-2. /api/v001/schedules/patch 부재

· user_profiles/patch (POST) 존재 ✅
· schedules/patch 없음

비대칭: 스케줄도 batch patch 필요할 수 있음.

조치: 사용 패턴 확인 후 결정.

---

4-3. BLE API 부재

M10에 ST_M10_BLE_rt_t 구조체 존재하나 BLE 관련 API/라우트 0건.

판정: 미구현 or 정책상 제외. 확인 필요.

---

4-4. routeConfigSave() 미등록 (주석 상태)

```cpp
// --------------------------------------------------
// 21. /api/config/save & /api/config/dirty
// --------------------------------------------------
// void CL_W10_WebAPI::routeConfigSave() {
//}
```

→ routeConfigDirtySave()가 HTTP_API_CONFIG_SAVE를 처리하므로 실질 문제 없음.

---

5. WS 채널 검증

# Const 값 등록
1 WS_API_LOG /ws/log routeWebSocket ✅
2 WS_API_STATE /ws/state routeWebSocket ✅
3 WS_API_CHART /ws/chart routeWebSocket ✅
4 WS_API_METRICS /ws/metrics routeWebSocket ✅
5 WS_API_SUMMARY /ws/summary routeWebSocket ✅

5/5 등록 완료 ✅

---

📋 조치 요약


🟠 검토 필요 (2건)

# 항목 조치
2 routeMotion PATCH 추가 프론트 사용 확인 후
3 /api/v001/schedules/patch 추가 프론트 사용 확인 후

🟡 문서 (필수, 다수)

# 항목
4 W10_Web_070.h 라우팅 선언 주석 — /api/v001/ prefix 추가
5 W10_Web_Routes_070.cpp 섹션 헤더 주석 — 실제 경로로 정정
6 routeUpload/routeUpdate 섹션 주석 — 실제 경로 정정

ℹ️ 정책 확인 (2건)

# 항목
7 BLE API 구현 여부
8 /api/v001/wifi 기본 경로 필요 여부

---

검증 체크리스트

# 시나리오 기대
1 curl /api/v001/version 200
2 curl /api/v001/system (GET) 200
3 curl -X PATCH /api/v001/system 200
4 curl -X PATCH /api/v001/motion 405 (PATCH 미등록)
5 프론트가 /api/update/latest 호출 404 (F/W 확인 응답)
6 프론트가 /api/v001/fwUpdate 호출 200 (OTA)
7 curl -X POST /api/v001/reload 200 (routeReload → reloadAll)

---

필수 조치 (#1 fwUpdate URL) 는 프론트 OTA 호출 실패를 유발하므로 즉시 수정 권장.

프론트엔드 (P001_API_070.js)의 실제 호출 경로 확인 가능하면 PATCH/schedules-patch 필요 여부 확정 가능.

다음 단계:

· (1) 필수 1건 + 문서 3건 반영
· (2) 프론트엔드 소스 확인 후 PATCH/patch 추가 결정
· (3) BLE//wifi 정책 확인

어느 방향으로 갈까요?