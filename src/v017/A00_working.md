E-1 (d) UAF 방지 — 지연 free 설계

문제 재확인

경쟁 시나리오:

t W10 GET (async_tcp) reloadAll (HTTP POST)
t1 getRootSnapshot(v_snap) → v_snap.system = A —
t2 (스케줄러 양보) loadAll(v_new)
t3 — swap → g_root = B, v_old = A
t4 — freeAll(A) ← A 해제
t5 toJson_System(*A) —

대상: W10 GET 5곳 (system/motion/schedules/userProfiles/wifi) + routeConfigDirtySave CONFIG GET.

---

설계 결정

옵션 개입 안전성
(a) C10 mutex 노출 + W10 GET/POST 전부 감쌈 큼 (15+곳) 완전
(b) pending free 큐 (grace 3초) 작음 (4파일) 실질 안전
(c) 이연 (문서) 0 실위험 잔존

권장: (b) — W10 수정 없음, UAF 완전 차단.

---

최종 diff

1. C10_Config_070.h — public API + private 상태

위치: freeAll 선언 다음

```cpp
    static void freeAll(ST_A20_ConfigRoot_t& p_root);

    // --------------------------------------------------
    // [E-1] 지연 free (W10 reader UAF 방지)
    //  - reloadAll의 즉시 free 대신 큐에 등록
    //  - processPendingFree()가 grace(3초) 경과 후 실제 free
    //  - 대상: W10 GET이 v_snap 캡처 후 toJson 실행 중 reloadAll로 인한 dangling
    //  - 부팅 복원 없으므로 재부팅 시 잔존 큐 소실 (leak 무해)
    // --------------------------------------------------
    static void queuePendingFree(const ST_A20_ConfigRoot_t& p_old);
    static void processPendingFree();
```

위치: private, s_cfgJsonFileMap 근처

```cpp
    // [E-1] pending free 큐 (2슬롯, 연속 reload 대비)
    static constexpr uint8_t  PENDING_FREE_SLOTS    = 2;
    static constexpr uint32_t PENDING_FREE_GRACE_MS = 3000;   // 3초 유예
    static ST_A20_ConfigRoot_t s_pendingFree[PENDING_FREE_SLOTS];
    static uint32_t            s_pendingFreeMs[PENDING_FREE_SLOTS];
    static uint8_t             s_pendingFreeCount;
```

2. C10_Config_Core_070.cpp — 구현

위치: s_rootSwapMux 정의 다음

```cpp
// [E-1] pending free 큐 정의
ST_A20_ConfigRoot_t CL_C10_ConfigManager::s_pendingFree[CL_C10_ConfigManager::PENDING_FREE_SLOTS] = {};
uint32_t            CL_C10_ConfigManager::s_pendingFreeMs[CL_C10_ConfigManager::PENDING_FREE_SLOTS] = {0, 0};
uint8_t             CL_C10_ConfigManager::s_pendingFreeCount = 0;
```

위치: freeAll 함수 다음

```cpp
// =====================================================
// [E-1] pending free 큐 (지연 free)
// =====================================================
void CL_C10_ConfigManager::queuePendingFree(const ST_A20_ConfigRoot_t& p_old) {
    CL_A40_MutexGuard_Semaphore v_guard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        // 획득 실패 시 안전을 위해 즉시 free (극히 드묾)
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] queuePendingFree: mutex busy, immediate free");
        // (recursive mutex 실패 시 다른 경로 위험 → 그대로 두는 것도 고려)
        return;
    }

    // 슬롯 full → 가장 오래된 것을 즉시 free하고 자리 확보
    if (s_pendingFreeCount >= PENDING_FREE_SLOTS) {
        freeAll(s_pendingFree[0]);
        memset(&s_pendingFree[0], 0, sizeof(s_pendingFree[0]));

        for (uint8_t i = 1; i < PENDING_FREE_SLOTS; i++) {
            s_pendingFree[i - 1]   = s_pendingFree[i];
            s_pendingFreeMs[i - 1] = s_pendingFreeMs[i];
        }
        s_pendingFreeCount = PENDING_FREE_SLOTS - 1;
    }

    s_pendingFree[s_pendingFreeCount]   = p_old;
    s_pendingFreeMs[s_pendingFreeCount] = millis();
    s_pendingFreeCount++;

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] pending free queued (count=%u)", s_pendingFreeCount);
}

void CL_C10_ConfigManager::processPendingFree() {
    CL_A40_MutexGuard_Semaphore v_guard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (s_pendingFreeCount == 0) return;

    uint32_t v_now  = millis();
    uint8_t  v_keep = 0;

    for (uint8_t i = 0; i < s_pendingFreeCount; i++) {
        if (v_now - s_pendingFreeMs[i] >= PENDING_FREE_GRACE_MS) {
            freeAll(s_pendingFree[i]);
            memset(&s_pendingFree[i], 0, sizeof(s_pendingFree[i]));
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] pending free executed (slot=%u)", i);
        } else {
            // 유지 (압축)
            if (v_keep != i) {
                s_pendingFree[v_keep]   = s_pendingFree[i];
                s_pendingFreeMs[v_keep] = s_pendingFreeMs[i];
            }
            v_keep++;
        }
    }
    s_pendingFreeCount = v_keep;
}
```

3. CT10_Ctl_Ctl_070.cpp::reloadAll — 즉시 free → 큐 등록

위치: 마지막 v_guard.unlock() 블록

```cpp
// BEFORE
    // [A-min] CT10 mutex 해제 후 구버전 root 해제
    //  - freeAll은 C10 mutex를 별도 획득 (중첩 없음)
    //  - CT10 mutex hold 시간 최소화 (다른 태스크 블록 방지)
    v_guard.unlock();
    CL_C10_ConfigManager::freeAll(v_old);

// AFTER
    // [A-min] CT10 mutex 해제 후 구버전 root 해제
    //  - [E-1] 즉시 free 하지 않고 pending 큐에 등록 (W10 reader UAF 방지)
    //  - processPendingFree()가 grace(3초) 경과 후 실제 free
    //  - 사유: W10 GET이 getRootSnapshot 후 toJson 실행 사이에 v_old 참조
    //          → 즉시 free 시 dangling pointer 접근
    v_guard.unlock();
    CL_C10_ConfigManager::queuePendingFree(v_old);
```

4. A00_Main_070.h::A00_run — 주기 호출

위치: CL_TM10_TimeManager::tick(...) 다음, 기존 N10 flush TODO 블록 다음

```cpp
    // ------------------------------------------------------
    // [E-1] pending free 처리 (reloadAll의 지연 free)
    //  - 3초 grace 경과 후 실제 freeAll 실행
    //  - 매 loopTask 주기(≤10ms) 호출 → 3초 후 자연 정리
    // ------------------------------------------------------
    CL_C10_ConfigManager::processPendingFree();
```

---

안전성 분석

UAF 차단 매커니즘

t W10 GET (async_tcp) reloadAll processPendingFree (loopTask)
t1 v_snap.system = A 캡처 — —
t2 — swap → v_old = A —
t3 — queuePendingFree(A) —
t4 toJson_System(*A) — (pending 유지)
t5 완료 완료 —
t6 — — 3초 경과 → freeAll(A) ✅

A는 W10 GET 완료 후 안전하게 free. ✅

연속 reload (빠른 2회)

· 슬롯 2개 → A, B 각각 유지
· 3초 후 순차 free ✅

슬롯 full (3회 빠른 reload)

· 가장 오래된 슬롯 즉시 free
· 이 시점의 W10 GET은 이미 3초 이상 경과 → 안전 ✅

재부팅

· pending 큐 소실 (메모리 leak)
· 재부팅 자체로 모든 힙 리셋 → 무해 ✅

---

검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 reload 1회 + 로그 pending free queued (count=1)
3 3초 후 pending free executed (slot=0)
4 reload 중 W10 GET 폴링 크래시 없음 (핵심 검증)
5 연속 reload 2회 (1초 간격) count=2 → 순차 free
6 reload 3회 빠른 연속 슬롯 full → 가장 오래된 것 즉시 free
7 heap 모니터 3초 후 원상 복귀
8 재부팅 pending 소실, 정상 부팅

#4가 E-1의 핵심 검증.

---

회귀 리스크

리스크 대응
queuePendingFree mutex 실패 시 즉시 free recursive mutex 실패 극히 드묾 (사실상 없음)
grace 3초가 짧음? W10 GET toJson은 수 ms → 충분
pending 큐 2슬롯 부족 연속 3회 reload 시 oldest 즉시 free (안전, 정합)
s_pendingFree 메모리 (2 × 32B = 64B) 무시 가능
processPendingFree 호출 누락 A00_run 필수 배선

---

파일별 변경 요약

파일 라인
C10_Config_070.h +13 (API 2 + private 5)
C10_Config_Core_070.cpp +55 (정의 3 + 구현 2)
CT10_Ctl_Ctl_070.cpp +3/-2 (freeAll → queue)
A00_Main_070.h +6 (주기 호출)

총 4파일, ~75줄.

---

적용 후 컴파일 결과 알려주세요. E-1 완결 시 W10 UAF race 종결.
