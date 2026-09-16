
---

🟡 P2 — _wifiTask 파일-스코프 static s_wifiSnap

_wifiTask 내부 static ST_A20_WifiConfig_t s_wifiSnap; — 함수-로컬 static. task 1개라 경쟁 없음 ✅.

다만 향후 task 2개 이상 확장 시 문제. 지금은 무해.

---

✅ 안전성 확인 (race 외)

항목 상태
WDT (WiFi task 미등록) ✅
Priority 1 = loopTask ✅
Stack 8192 ✅ (peak ~2KB)
Semaphore 이중 give → coalesce ✅
_ensureWifiTask 멱등 ✅
s_wifiMutex 순서 (CT10과 무교차) ✅
esp_task_wdt.h include 삭제 (미사용) ✅

---

검증 체크리스트 (수정 후)

# 시나리오 기대
1 컴파일 에러 0
2 부팅 로그 [WF10] Reconnect task created 1회
3 POST /api/network/wifi/config 즉시 200 (status=requested)
4 재연결 중 WS /state push 정상
5 재연결 중 CT10 tick 정상
6 재연결 중 /api/v001/reload 크래시 없음 (race fix 검증)
7 연속 재요청 (2회) 1회만 (status=coalesced)
8 ESP32 리셋 없음
9 heap drift 30분 안정

#6이 새 race의 핵심 검증.

---

우선순위

순위 항목 개입
1 WiFi task g_A20_config_root race 5줄
2 응답 문구 stale 3줄
3 주석 [WF10-defer] → [WF10-task] 1줄

1번 먼저 반영 → 컴파일 → 실기 테스트.

수정 결과 알려주세요.
