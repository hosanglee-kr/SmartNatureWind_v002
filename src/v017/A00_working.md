B-2 AutoOff 상태 지속성 — Latch 설계 및 diff

문제 재확인

Timer AutoOff 시나리오:

시각 이벤트 state timerStartMs
t=0 스케줄 진입 SCHEDULE_RUN now
t=480분 AutoOff timer 트리거 AUTOOFF_STOPPED -
t+3초 hold 만료 → decide → SCHEDULE_RUN SCHEDULE_RUN now (리셋!)
t+3초+ 팬 재작동 SCHEDULE_RUN —

→ AutoOff가 "3초 일시 정지"로 동작. 사용자 재개 전까지 유지가 의도.

설계 — AutoOff 래치

원칙:

· AutoOff 트리거 → latch = true
· Latch 활성 시 decideRunSource가 강제 AUTOOFF_STOPPED 반환 → 자동 재진입 차단
· 사용자 명시적 재개에서만 latch 해제

---

1) CT10_Ctl_070.h — private 멤버 1개 추가

위치: _persistOffTimeLastYday 다음

```cpp
    // [A-2] offTime 재트리거 방지 영속 필드
    int16_t _persistOffTimeLastYday = -1;

    // --------------------------------------------------
    // [B-2] AutoOff 래치
    //  - AutoOff(timer/offTime/offTemp) 트리거 시 true
    //  - decideRunSource가 강제 AUTOOFF_STOPPED 반환 → 자동 재진입 차단
    //  - 사용자 명시적 재개(setMode/startOverride/ackEvent)에서 해제
    // --------------------------------------------------
    bool _autoOffLatched = false;
```

---

2) CT10_Ctl_Basic_070.cpp::onAutoOffTriggered — Latch set

위치: 함수 끝, 마지막 로그 다음

```cpp
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff STOPPED (reason=%u, hold=3000ms)", (unsigned)p_reason);

    // [B-2] AutoOff 래치 (사용자 재개 전까지 자동 재진입 차단)
    _autoOffLatched = true;
}
```

---

3) CT10_Ctl_Basic_070.cpp::ackEventState — Latch clear

위치: hold/ack 초기화 다음

```cpp
    if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED) {
        return;
    }

    runCtx.stateAckRequired = false;
    runCtx.stateHoldUntilMs = 0;

    // [B-2] 사용자 ACK → AutoOff 래치 해제 (재개 허용)
    _autoOffLatched = false;

    markDirty("state");
    markDirty("summary");
```

---

4) CT10_Ctl_StMG_070.cpp::decideRunSource — Latch 우선 처리

위치: Override 분기 다음, ProfileMode 분기 이전

```cpp
    // --------------------------------------------------
    // 1) Override
    // --------------------------------------------------
    if (overrideState.active) {
        ...
        return v_d;
    }

    // --------------------------------------------------
    // [B-2] AutoOff 래치 우선 처리
    //  - 트리거 후 사용자 재개 없이는 자동 재진입 차단
    //  - reason은 onAutoOffTriggered의 값 유지
    // --------------------------------------------------
    if (_autoOffLatched) {
        v_d.nextState     = EN_CT10_STATE_AUTOOFF_STOPPED;
        v_d.reason        = runCtx.reason;      // 기존 reason 유지
        v_d.nextRunSource = EN_CT10_RUN_NONE;
        v_d.wantSimStop   = true;
        return v_d;
    }

    // --------------------------------------------------
    // 2) ProfileMode 전용
    // --------------------------------------------------
    ...
```

효과: latch 활성 시 매 tick 동일 결과 반환 → v_stateChanged == false → flip 없음 ✅

---

5) CT10_Ctl_Ctl_070.cpp — Latch clear 4곳

5-1. setProfileMode

```cpp
void CL_CT10_ControlManager::setProfileMode(bool p_profileMode) {
    CL_A40_MutexGuard_Semaphore v_guard(...);
    if (!v_guard.isAcquired()) return;

    // [B-2] 사용자 모드 변경 → AutoOff 래치 해제
    _autoOffLatched = false;

    useProfileMode = p_profileMode;
    ...
}
```

5-2. startUserProfileByNo

위치: 매칭 성공 블록, runSource 갱신 직전

```cpp
        if (v_p.profileNo == p_profileNo) {
            // [B-2] 사용자 프로파일 시작 → AutoOff 래치 해제
            _autoOffLatched = false;

            runSource                  = EN_CT10_RUN_USER_PROFILE;
            ...
```

5-3. startOverrideFixed

```cpp
void CL_CT10_ControlManager::startOverrideFixed(float p_percent, uint32_t p_seconds) {
    CL_A40_MutexGuard_Semaphore v_guard(...);
    if (!v_guard.isAcquired()) return;

    // [B-2] 사용자 override 시작 → AutoOff 래치 해제
    _autoOffLatched = false;

    memset(&overrideState, 0, sizeof(overrideState));
    ...
}
```

5-4. applyManualResolved

```cpp
void CL_CT10_ControlManager::applyManualResolved(const ST_A20_ResolvedWind_t& p_wind, uint32_t p_seconds) {
    CL_A40_MutexGuard_Semaphore v_guard(...);
    if (!v_guard.isAcquired()) return;

    if (!p_wind.valid) { ... return; }
    if (p_wind.fixedMode) { startOverrideFixed(...); return; }

    // [B-2] 사용자 override(resolved) 시작 → AutoOff 래치 해제
    _autoOffLatched = false;

    memset(&overrideState, 0, sizeof(overrideState));
    ...
}
```

5-5. reloadAll (static 함수)

위치: v_inst._persistOffTimeLastYday = -1; 다음

```cpp
    // [A-2] 영속 필드 리셋
    v_inst._persistOffTimeLastYday = -1;

    // [B-2] AutoOff 래치 리셋 (설정 재적용)
    v_inst._autoOffLatched = false;
```

---

변경 요약

파일 변경
CT10_Ctl_070.h _autoOffLatched 선언
CT10_Ctl_Basic_070.cpp onAutoOffTriggered set, ackEventState clear
CT10_Ctl_StMG_070.cpp decideRunSource latch 분기
CT10_Ctl_Ctl_070.cpp setProfileMode/startUserProfileByNo/startOverrideFixed/applyManualResolved/reloadAll clear

총 4파일, ~15줄.

---

시나리오 검증

시나리오 1: Timer AutoOff (핵심)

시각 이벤트 state latch
t=0 스케줄 진입 SCHEDULE_RUN false
t=480분 AutoOff 트리거 AUTOOFF_STOPPED true
t+3초 hold 만료 → decide: latch → AUTOOFF_STOPPED AUTOOFF_STOPPED (변화 없음) true
t+10분 decide: latch → AUTOOFF_STOPPED 유지 true
t+1시간 decide: latch → AUTOOFF_STOPPED 유지 true
팬 정지 유지 ✅  

시나리오 2: 사용자 재개

시각 이벤트 state latch
t=0 AUTOOFF_STOPPED  true
t=1 startUserProfileByNo(10) (변화 없음) false
t+40ms decide: profile → PROFILE_RUN PROFILE_RUN false
→ 팬 재작동 ✅

시나리오 3: Override가 AutoOff 도중

시각 이벤트 state latch
t=0 AUTOOFF_STOPPED  true
t=1 startOverrideFixed(50, 30) (변화 없음) false
t+40ms decide: override → OVERRIDE OVERRIDE false
t=31초 override timeout → AUTOOFF 아님, 이후 decide → SCHEDULE_RUN false

시나리오 4: ACK

시각 이벤트 latch
t=0 AUTOOFF_STOPPED true
t=1 ackEvent() false → 다음 tick decide가 자연 복귀

---

회귀 리스크

리스크 대응
AutoOff 후 사용자 재개 경로 없음? setProfileMode/startUserProfileByNo/startOverride/ackEvent 모두 지원
offTime(A-2)와 상호작용 offTime 트리거도 onAutoOffTriggered 경유 → latch set. 정합 ✅
_autoOffLatched vs _persistOffTimeLastYday 독립적 (latch = 사용자 재개 차단, persist = yday 재트리거 방지)
reloadAll 정합성 latch 리셋 + persist 리셋 + state 초기화

---

검증 체크리스트 (실기)

# 시나리오 기대
1 컴파일 에러 0
2 timer AutoOff 후 1분 관찰 state가 AUTOOFF_STOPPED 유지
3 offTime AutoOff 후 관찰 동일
4 startUserProfileByNo 호출 팬 재개
5 startOverrideFixed 호출 팬 재개 (override)
6 ackEvent 호출 다음 tick 자연 복귀
7 로그 AutoOff STOPPED 1회 (3초 주기 재트리거 없음)

---

적용 후 컴파일 결과 알려주세요.