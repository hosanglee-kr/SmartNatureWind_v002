WF10 defer 반영 검토 — 🔴 필수 누락 2건

반영 매트릭스

# 항목 상태
① Gemini 스택 static (이전 배치) ✅
② W10_Web_Routes_070.cpp::routeWifiConfig → requestReconnect (POST/PATCH) ✅
③ WF10_WiFiMgr_070.h — API 2개 + 상태 2개 ✅
④ WF10_WiFiMgr_070.cpp — 구현 2개 ✅
⑤ A00_Main_070.h::A00_run() — tickDeferredReconnect 호출 ❌ 누락
⑥ tickDeferredReconnect 내 WDT feed ❌ 누락

---

🔴 누락-1: A00_run() 호출 없음

증상: requestReconnect()가 플래그만 set → 아무도 처리 안 함 → WiFi 재연결 영구 미실행.

파일: A00_Main_070.h::A00_run()

수정 위치 — Time Manager tick 이후, LED 업데이트 이전:

```cpp
// AFTER (기존)
    // 3) Time Manager tick
    if (g_A20_config_root.system) {
        CL_TM10_TimeManager::tick(g_A20_config_root.system);
    } else {
        CL_TM10_TimeManager::tick(nullptr);
    }

    //// // NVS Dirty Flush (10초마다)
    //// if (v_now - v_lastFlush >= 10000) {
    ////     v_lastFlush = v_now;
    ////     CL_N10_NvsManager::flushIfNeeded();
    //// }

// [신규 추가]
    // ------------------------------------------------------
    // 3-1) [WF10-defer] 지연 WiFi 재연결 처리
    //  - async_tcp에서 플래그만 set한 재연결 요청을 loopTask에서 실행
    //  - startSTA가 블로킹될 수 있으나 loopTask는 제어/WS보다 우선순위 낮음
    // ------------------------------------------------------
    CL_WF10_WiFiManager::tickDeferredReconnect();

    // ------------------------------------------------------
    // 4) LED 업데이트
    // ------------------------------------------------------
    bool v_wifiStatus = CL_WF10_WiFiManager::isStaConnected();
    ...
```

---

🔴 누락-2: WDT timeout 위험

문제:

· A00_init에서 esp_task_wdt_init(10, true) — 10초 timeout
· tickDeferredReconnect → applyConfig → init → startSTA 최대 ~90초 블로킹
· loopTask 내에서 WDT feed 불가 → 10초 후 ESP32 리셋

수정 — WF10_WiFiMgr_070.cpp::tickDeferredReconnect에 WDT feed 추가:

```cpp
// AFTER
void CL_WF10_WiFiManager::tickDeferredReconnect() {
    portENTER_CRITICAL(&s_reconnectMux);
    bool v_do = s_reconnectRequested;
    if (v_do) s_reconnectRequested = false;
    portEXIT_CRITICAL(&s_reconnectMux);

    if (!v_do) return;

    if (!g_A20_config_root.wifi || !g_A20_config_root.system) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[WF10] Deferred reconnect skipped: config null");
        return;
    }

   // [WF10-defer] WDT 보호
    //  - startSTA 블로킹이 WDT timeout(10초)을 초과할 수 있음
    //  - 블로킹 진입 전/후 feed (내부 지속 feed는 applyConfig 수정 없이 불가)
    esp_task_wdt_reset();

    bool v_ok = applyConfig(*g_A20_config_root.wifi);

    esp_task_wdt_reset();   // 완료 후 즉시 feed

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[WF10] Deferred apply done (ok=%d)", (int)v_ok);
}
```

A00_Main_070.h에 #include <esp_task_wdt.h> 이미 있음 ✅.

추가 헤더 필요 여부: WF10_WiFiMgr_070.cpp에 #include <esp_task_wdt.h> 필요.

```cpp
// WF10_WiFiMgr_070.cpp 상단 (기존 include 다음)
#include <esp_task_wdt.h>   // [WF10-defer] WDT 보호
```

---

⚠️ 잔존 위험 (별도 이슈, 이연)

loopTask 90초 블로킹 — 이번 개입으로 async_tcp는 보호되나, loopTask가 90초 멈춤:

· CT10 tick 정지 → 제어/시뮬레이션 90초 정지
· WS push 정지
· A00_run의 다른 tick 정지

WDT feed만으로 리셋은 회피되지만 기능 정지는 남음.

권장 개선 (별도 배치):

· startSTA를 별도 FreeRTOS task로 이관
· 또는 applyConfig에서 timeout 단축 (maxTries 조정, wait 500→2000)

이번 배치는 WDT 회피까지만 (실 사용 시 문제 발생하면 후속).

---

최종 적용 요약

# 파일 변경
⑤ A00_Main_070.h A00_run()에 tickDeferredReconnect() 호출 1줄
⑥-a WF10_WiFiMgr_070.cpp 상단 #include <esp_task_wdt.h>
⑥-b WF10_WiFiMgr_070.cpp tickDeferredReconnect에 esp_task_wdt_reset() 2회

---

검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 HTTP POST /api/network/wifi/config 즉시 200 (status=requested)
3 다음 loop tick 실제 재연결 시도
4 재연결 중 다른 HTTP 요청 정상 응답
5 WDT 리셋 로그 0건 (WDT feed 확인)
6 ESP32 재부팅 없음
7 WiFi 재연결 성공 IP 획득, 상태 정상
8 재연결 중 CT10/WS tick (loopTask 블로킹 동안 정지) — 이연

---

5, 6번이 이번 diff의 핵심 검증. 컴파일 후 결과 알려주세요.