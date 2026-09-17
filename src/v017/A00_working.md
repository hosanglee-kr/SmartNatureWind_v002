Override 기본 20분 + 모순 3/4/5 기능 관점 설명

---

Part 1. Override 기본 20분 — diff

의도

Override 시작 시 durationSec 미지정(0)이면 20분(1200초) 기본 적용. 무기한 override 제거.

수정 대상 3곳

1) CT10_Ctl_070.h — 상수 추가

위치: S_EVENT_HOLD_MS 다음

```cpp
    static constexpr uint32_t S_EVENT_HOLD_MS            = 3000UL; // 이벤트 상태 hold
    static constexpr uint32_t S_OVERRIDE_DEFAULT_SEC     = 1200UL; // [Policy] Override 기본 지속 시간 (20분)
```

2) CT10_Ctl_Ctl_070.cpp::startOverrideFixed — 기본값 적용

```cpp
// BEFORE
void CL_CT10_ControlManager::startOverrideFixed(float p_percent, uint32_t p_seconds) {
    ...
    overrideState.endMs = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;  // 0 = 무기한
    ...
}

// AFTER
void CL_CT10_ControlManager::startOverrideFixed(float p_percent, uint32_t p_seconds) {
    ...
    // [Policy] durationSec=0 → 20분 기본
    uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
    overrideState.endMs = millis() + (v_sec * 1000UL);
    ...
}
```

3) CT10_Ctl_Ctl_070.cpp::applyManualResolved — 동일

```cpp
// BEFORE
    overrideState.endMs = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

// AFTER
    // [Policy] durationSec=0 → 20분 기본
    uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
    overrideState.endMs = millis() + (v_sec * 1000UL);
```

효과

호출 이전 이후
startOverrideFixed(50, 30) 30초 30초 (변화 없음)
startOverrideFixed(50, 0) 무기한 20분
CT10::applyManual(wind) 무기한 (0 전달) 20분
W10 /override/fixed?seconds=0 무기한 20분

부수 확인

_autoOffLatched 해제 로직은 그대로 유지 → Override 시작 시 AutoOff 래치 해제.

---

Part 2. 모순 3 — Override 중 AutoOff 무시

기능 관점

두 개념의 본질:

· Override = "지금 이 순간 팬을 X%로 돌려라" (사용자 즉각 개입)
· AutoOff = "특정 조건에서 팬 정지" (시스템 조건부 안전/편의)

현재 동작 (tickOverride는 checkAutoOff 미호출):

```
Override active → AutoOff 조건(timer 만료, offTime 도달, offTemp 초과) 무시 → Override 지속
Override 종료 → 원 소스 재진입 → AutoOff 재평가
```

20분 기본 적용 후 재평가

이제 Override는 최대 20분 후 자동 종료. 그동안 AutoOff 무시는 실질 영향이 크지 않음:

AutoOff 유형 Override 20분 중 위험
timer 짧은 시간 → 무시 무해
offTime 20분 이내 도달 시 미발동, 최대 20분 지연 후 발동
offTemp ⚠️ 온도 초과 상태로 20분 팬 가동 — 안전 관점 우려

정책 결정 관점

옵션 Override 20분 중 offTemp 판단
(a) 무시 (현재) 사용자 명시 override 우선 명확한 UX, 온도 안전은 팬 자체가 냉각
(b) offTemp만 override 중에도 적용 안전 우선 온도 임계값 초과 시 override 중단

의견: (a) 유지. 팬은 냉각 방향 → override 중 팬 가동은 안전 상 유리. offTemp 트리거는 "온도가 높으면 정지"가 아니라 "높으면 팬 정지" — 이미 반대 방향. 실제로 offTemp가 의도한 건 "더울 때 사용자가 자지 말고 꺼라"는 부하 감소 목적. Override 20분 중 offTemp 발동은 드묾.

결론: 현재 코드 유지. 문서화만.

---

Part 3. 모순 4 — onTimeInvalid dead code

기능 관점

onTimeInvalid의 원래 의도:

```cpp
void CL_CT10_ControlManager::onTimeInvalid(...) {
    runCtx.state = TIME_INVALID;
    runCtx.stateHoldUntilMs = now + 3000;  // 3초 hold
    runCtx.activeSegId/No = 0;              // seg 리셋
    ...
}
```

→ TIME_INVALID 상태를 3초 유지 + seg 스냅샷 리셋 의도.

실제 동작 (decideRunSource → applyDecision 경로):

· decideRunSource: TIME_INVALID + wantSimStop = true 반환
· applyDecision:
  · runSource = NONE (전환)
  · runCtx.state = TIME_INVALID
  · stateHoldUntilMs 설정 안 됨 (이전 값 유지)
  · activeSegId/No 리셋 안 됨
  · v_stateChanged → dirty 마킹

실질 영향

상황 onTimeInvalid 있었으면 현재 (dead)
TIME_INVALID 진입 3초 hold (state 표시 유지) hold 없음 → 다음 tick 즉시 재판정
time valid 회복 시 3초 후 자동 복귀 즉시 자동 복귀
seg 스냅샷 0으로 리셋 (UI "정지" 표현) 유지 (마지막 seg 표시)

결과

· TIME_INVALID는 매우 짧은 순간 상태 (SNTP 재동기화 중 등)
· UI가 TIME_INVALID 상태를 거의 못 봄 (즉시 SCHEDULE_RUN으로 flip 가능)
· 정책상 "hold 후 안정화"가 사라짐

기능 관점 판단

TIME_INVALID는 이벤트성 상태로 표시할 필요 있음:

· "시간 없음 → 팬 정지" 순간을 사용자에게 알림
· 3초 hold로 UI 표시 가능

개입 옵션

옵션 내용
(a) onTimeInvalid 호출 복원 decideRunSource에서 TIME_INVALID 반환 시 applyDecision이 onTimeInvalid 호출
(b) applyDecision에 hold 로직 내장 if (p_d.nextState == TIME_INVALID) runCtx.stateHoldUntilMs = now + S_EVENT_HOLD_MS;
(c) dead code 삭제 이벤트 표시 포기

의견: (b). applyDecision에 통합하고 onTimeInvalid 삭제. hold + seg 리셋 로직을 통합.

applyDecision 수정

위치: runCtx.state = p_d.nextState; 다음

```cpp
    runCtx.state          = p_d.nextState;
    runCtx.reason         = p_d.reason;
    runCtx.lastDecisionMs = millis();

    // [Fix-4] TIME_INVALID 진입 시 hold + seg 리셋 (onTimeInvalid 통합)
    if (v_stateChanged && runCtx.state == EN_CT10_STATE_TIME_INVALID) {
        runCtx.stateHoldUntilMs = runCtx.lastDecisionMs + S_EVENT_HOLD_MS;
        runCtx.stateAckRequired = false;
        runCtx.activeSegId = 0;
        runCtx.activeSegNo = 0;
    }
```

onTimeInvalid 삭제: 선언(CT10_Ctl_070.h) + 구현(CT10_Ctl_Basic_070.cpp).

---

Part 4. 모순 5 — AutoOff timer source별 정책

기능 관점

Timer AutoOff의 두 해석:

해석 동작 사례
(a) 세션별 (현재) source 진입마다 timerStartMs 리셋 "이 스케줄 8시간 돌면 정지"
(b) 누적 세션 간 누적 "오늘 총 8시간 사용 시 정지"

현재 동작 (a)

```
17:00 Schedule A 진입 → timerStartMs = 17:00 (480분)
19:00 A → B 전환 → initAutoOffFromSchedule(B) → timerStartMs = 19:00 (B의 480분)
21:00 B → A 재진입 → timerStartMs = 21:00 (A의 480분 다시 시작)
```

A의 타이머가 세 번 리셋 → A가 하루 여러 번 실행되면 각 세션마다 8시간 = 최대 24시간 가능.

사용자 의도 관점

cfg_schedules_070.json의 "Night Sleep" 스케줄:

```json
"autoOff": { "timer": { "enabled": true, "minutes": 480 } }
```

사용자 의도 추정: "야간 수면 스케줄이 8시간 이상 돌지 마라". 세션별 리셋이 자연스러움 — 스케줄이 하룻밤 한 번만 실행되므로.

문제 시나리오

repeatSegments=true, repeatCount=3 세그먼트 반복 중 timer가 리셋되면:

· 세그먼트 내 반복은 source 변화 없음 → timer 유지 ✅
· 스케줄 자체가 재진입하면 리셋 → 의도일 가능성 높음

결론

현재 동작 (a)가 자연스러움. 다만 문서화 부족.

문서화 (주석)

initAutoOffFromSchedule / initAutoOffFromUserProfile:

```cpp
// --------------------------------------------------
// [Policy] AutoOff timer 정책
//  - source(schedule/profile) 진입 시마다 timerStartMs 재설정
//  - 세션별 독립 타이머 (누적 아님)
//  - source 전환 시 이전 타이머 무효화
//  - 사유: 각 스케줄/프로파일의 "1회 실행 최대 시간" 제한 목적
// --------------------------------------------------
```

---

통합 개입 요약

# 항목 개입 우선순위
1 Override 기본 20분 상수 + 2함수 🟠
2 모순 3 (문서) 주석만 🟡
3 모순 4 (TIME_INVALID hold) applyDecision 확장 + onTimeInvalid 삭제 🟠
4 모순 5 (문서) 주석만 🟡

파일별 변경

파일 변경
CT10_Ctl_070.h S_OVERRIDE_DEFAULT_SEC 추가, onTimeInvalid 선언 삭제
CT10_Ctl_Ctl_070.cpp startOverrideFixed/applyManualResolved 기본값
CT10_Ctl_StMG_070.cpp applyDecision TIME_INVALID hold
CT10_Ctl_Basic_070.cpp onTimeInvalid 삭제, initAutoOff* 주석
CT10_Ctl_070.h 클래스 상단 Override/AutoOff 정책 주석

---

적용 후 컴파일 결과 알려주세요.



최종 diff 확정 — Part 1 + 모순 3/4/5

---

Part 1. Override 기본 20분

1-1. CT10_Ctl_070.h — 상수 추가

위치: S_EVENT_HOLD_MS 다음

```cpp
    static constexpr uint32_t S_EVENT_HOLD_MS            = 3000UL; // 이벤트 상태(AUTOOFF/TIME_INVALID) hold 시간
    // [Policy] Override 지속 시간: durationSec=0 시 20분 기본 적용 (무기한 없음)
    static constexpr uint32_t S_OVERRIDE_DEFAULT_SEC     = 1200UL;
```

1-2. CT10_Ctl_Ctl_070.cpp::startOverrideFixed

```cpp
// BEFORE
    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active        = true;
    overrideState.useFixed      = true;
    overrideState.fixedPercent  = constrain(p_percent, 0.0f, 100.0f);
    overrideState.endMs         = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

// AFTER
    memset(&overrideState, 0, sizeof(overrideState));
    overrideState.active        = true;
    overrideState.useFixed      = true;
    overrideState.fixedPercent  = constrain(p_percent, 0.0f, 100.0f);
    // [Policy] durationSec=0 → 20분 기본
    {
        uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
        overrideState.endMs = millis() + (v_sec * 1000UL);
    }
```

1-3. CT10_Ctl_Ctl_070.cpp::applyManualResolved

```cpp
// BEFORE
    overrideState.endMs           = (p_seconds > 0) ? (millis() + (p_seconds * 1000UL)) : 0;

// AFTER
    // [Policy] durationSec=0 → 20분 기본
    {
        uint32_t v_sec = (p_seconds > 0) ? p_seconds : S_OVERRIDE_DEFAULT_SEC;
        overrideState.endMs = millis() + (v_sec * 1000UL);
    }
```

---

Part 2 (모순 3). Override 중 AutoOff 무시 — 문서화

2-1. CT10_Ctl_070.h 클래스 상단 (기능 요약 확장)

위치: 클래스 주석의 - 구현은 cpp 3개로 분리: 다음

```cpp
 * - 구현은 cpp 3개로 분리:
 *    1) json 처리, 2) control 처리, 3) misc/유틸/보조
 *
 * [Policy] 주요 운영 정책 요약
 *  - Override vs AutoOff:
 *    * tickOverride는 checkAutoOff를 호출하지 않는다.
 *    * Override는 사용자 명시적 개입 → AutoOff 조건보다 우선.
 *    * Override 종료 후 원 소스 재진입 시 AutoOff 재평가.
 *    * AutoOff(특히 offTemp)가 override 중 무시되어도 팬 가동은 안전 방향.
 *  - Override 지속시간:
 *    * durationSec=0이면 S_OVERRIDE_DEFAULT_SEC(20분) 기본 적용.
 *    * 무기한 override는 지원하지 않음 (재부팅/타임아웃 정책 단순화).
 *  - AutoOff timer:
 *    * source(schedule/profile) 진입 시마다 timerStartMs 재설정.
 *    * 세션별 독립 타이머 (누적 아님). source 전환 시 이전 타이머 무효화.
 *    * 사유: 각 스케줄/프로파일의 "1회 실행 최대 시간" 제한 목적.
 *  - 부팅 복원:
 *    * N10(NVS)은 저장만. 부팅 시 Override/UserProfile 자동 복원 안 함.
 *    * Schedule은 시간 조건 재평가, AutoOff는 source 진입 시 자동 로드.
```

2-2. CT10_Ctl_Ctl_070.cpp::tickOverride 상단 주석

```cpp
// --------------------------------------------------
// [Policy] Override 중 AutoOff
//  - 본 함수는 checkAutoOff를 호출하지 않는다.
//  - Override는 사용자 명시적 개입 → AutoOff 조건보다 우선.
//  - Override 종료 후 원 소스 재진입 시 AutoOff 재평가.
//  - AutoOff(특히 offTemp)가 override 중 무시되어도 팬 가동은 안전 방향.
// --------------------------------------------------
bool CL_CT10_ControlManager::tickOverride() {
```

2-3. CT10_Ctl_Basic_070.cpp::initAutoOffFromSchedule 상단 주석

```cpp
// --------------------------------------------------
// [Policy] AutoOff timer 정책
//  - source(schedule/profile) 진입 시마다 timerStartMs 재설정
//  - 세션별 독립 타이머 (누적 아님)
//  - source 전환 시 이전 타이머 무효화
//  - 사유: 각 스케줄/프로파일의 "1회 실행 최대 시간" 제한 목적
// --------------------------------------------------
void CL_CT10_ControlManager::initAutoOffFromSchedule(const ST_A20_ScheduleItem_t& p_s) {
```

initAutoOffFromUserProfile도 동일 주석.

---

Part 3 (모순 4). TIME_INVALID hold — applyDecision 통합

3-1. CT10_Ctl_StMG_070.cpp::applyDecision — hold 로직 삽입

위치: runCtx.state = p_d.nextState; 이후, if (v_stateChanged || v_sourceChanged) { runCtx.lastStateChangeMs = ... 이전

```cpp
    // 4) runCtx 업데이트
    runCtx.state          = p_d.nextState;
    runCtx.reason         = p_d.reason;
    runCtx.lastDecisionMs = millis();
    if (v_stateChanged || v_sourceChanged) {
        runCtx.lastStateChangeMs = runCtx.lastDecisionMs;
    }

    // [Fix-4] TIME_INVALID 진입 시 hold + seg 리셋 (이전 onTimeInvalid 기능 통합)
    //  - stateHoldUntilMs: 3초 hold (이벤트 상태 UI 표시)
    //  - activeSegId/No: 0 리셋 (정지 표현)
    //  - 이미 shouldHoldEventState가 hold 동안 tickLoop을 우회
    if (v_stateChanged && runCtx.state == EN_CT10_STATE_TIME_INVALID) {
        runCtx.stateHoldUntilMs = runCtx.lastDecisionMs + S_EVENT_HOLD_MS;
        runCtx.stateAckRequired = false;
        runCtx.activeSegId = 0;
        runCtx.activeSegNo = 0;
    }
```

3-2. CT10_Ctl_070.h — onTimeInvalid 선언 삭제

```cpp
// BEFORE
    // time invalid 이벤트 상태 전환(SSOT: tick에서 호출)
    void onTimeInvalid(EN_CT10_reason_t p_reason = EN_CT10_REASON_TIME_NOT_VALID);

// AFTER (삭제)
    // [Fix-4] onTimeInvalid 삭제 (applyDecision에 통합)
```

3-3. CT10_Ctl_Basic_070.cpp — onTimeInvalid 구현 삭제

삭제 대상 함수 (약 35줄):

```cpp
// --------------------------------------------------
// [CT10] TIME_INVALID 이벤트 상태 전환(SSOT)
// - tickLoop()에서 schedule 진입 전에 선체크하여 호출하는 것을 권장
// - 정책: 실행 소스는 종료(=NONE), UI엔 마지막 snapshot은 유지(단 seg는 0)
// --------------------------------------------------
void CL_CT10_ControlManager::onTimeInvalid(EN_CT10_reason_t p_reason) {
    ...
    CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] TIME_INVALID (reason=%u, hold=3000ms)", (unsigned)p_reason);
}
```

검증: grep onTimeInvalid → 0건.

---

Part 4 (모순 5). AutoOff timer source별 — 문서화만

2-3 주석이 Part 4까지 커버. 추가 diff 없음.

---

통합 검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 grep onTimeInvalid 0건
3 grep S_OVERRIDE_DEFAULT_SEC 3건 (선언 + 2 사용)
4 POST /override/fixed (seconds=0) 20분 후 자동 종료
5 POST /override/fixed (seconds=30) 30초 후 종료 (변화 없음)
6 POST /api/v001/control/override/preset (durationSec=0) 20분
7 시간 미동기 상태 → TIME_INVALID state 유지 3초
8 TIME_INVALID 중 UI 조회 state=TIME_INVALID, holdRemainMs 표시
9 Override 중 AutoOff 조건 override 지속 (문서화된 정책)

---

파일별 변경 요약

파일 Part 라인
CT10_Ctl_070.h 1-1 상수, 2-1 클래스 주석, 3-2 onTimeInvalid 삭제 +10/−2
CT10_Ctl_Ctl_070.cpp 1-2, 1-3 기본값, 2-2 tickOverride 주석 +8
CT10_Ctl_StMG_070.cpp 3-1 hold 로직 +8
CT10_Ctl_Basic_070.cpp 2-3 주석 2곳, 3-3 onTimeInvalid 삭제 −35

순 삭제 ~20줄, 신규 ~26줄.

---

적용 후 컴파일 결과 알려주세요.