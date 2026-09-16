즉시 개입 

C-1. isStaConnected timeout=0 (WF10_WiFiMgr_070.cpp)

수정 위치: CL_WF10_WiFiManager::isStaConnected()

```cpp
// BEFORE
bool CL_WF10_WiFiManager::isStaConnected() {
    CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, 0, __func__); // 즉시 확인
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[WF10] %s: Mutex timeout", __func__);
        return false;
    }
    return s_staConnected && (WiFi.status() == WL_CONNECTED);
}

// AFTER
bool CL_WF10_WiFiManager::isStaConnected() {
    // [C-1] timeout 10ms: applyConfig 재연결 중에도 LED 폴링이 정상 반환
    //  - 0ms는 mutex 보유 중 즉시 false 반환 → LED 오표시(빨강)
    //  - s_staConnected 값은 원자적 읽기로도 안전하나, WiFi.status()까지
    //    일관 조회를 위해 mutex 획득 유지
    CL_A40_MutexGuard_Semaphore v_guard(s_wifiMutex, 10, __func__);
    if (!v_guard.isAcquired()) {
        // mutex 미획득 시 stale 값이라도 반환 (LED 빨강 오표시 방지)
        return s_staConnected;
    }
    return s_staConnected && (WiFi.status() == WL_CONNECTED);
}
```

근거:

· 기존 0ms → applyConfig 중 LED가 반드시 false (빨강)
· 10ms 대기 + 실패 시 stale 값 사용 → 정상 연결 상태 유지 표시

검증:

· WiFi 재연결 중 LED가 빨강으로 즉시 바뀌지 않음 (초록 유지)
· 재연결 실패 확정 시에만 빨강

---

적용 순서

1. A-1: A00_Main_070.h — 2줄 추가
2. A-3: TM10_TimeMg_070.h — 멱등 가드 8줄
3. C-1: WF10_WiFiMgr_070.cpp — timeout 0→10, fallback 1줄

총 3파일, ~12줄.

---

통합 검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 부팅 로그 [A00] M10 wired to CT10 (ptr=0x...) (not 0x0)
3 PIR 감지 중단 → holdSec 경과 [CT10] MOTION_BLOCKED 로그
4 [TM10] begin 로그 부팅 시 1회만
5 WiFi applyConfig 중 [TM10] begin ignored 로그 1회
6 재연결 중 LED 빨강 안 됨 (초록 유지)
7 재연결 실패 확정 빨강 전환

#3이 A-1의 기능 검증, #6이 C-1 검증, #5가 A-3 검증.

---

이후

즉시 개입 3건 완료 후 A-2 (AutoOff offTime 무한 재트리거) — 최대 위험 이슈. 설계 필요 (영속 필드 도입).

적용 후 컴파일 및 검증 결과 알려주세요.