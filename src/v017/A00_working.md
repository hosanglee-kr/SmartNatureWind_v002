B-1 MOTION_BLOCKED flip-flop — 최종 diff

문제 재확인

· decideRunSource: motion 무시 → 항상 SCHEDULE_RUN/PROFILE_RUN 반환
· tickSchedule/tickUserProfile: isMotionBlocked → onMotionBlocked → 상태 flip
· 다음 tick decide가 다시 RUN 반환 → 40ms 주기 flip-flop

수정: motion 판정을 decideRunSource로 이동 + tickSegmentSequence self-heal (motion 해제 후 seg 재적용).

---


수정 1 — CT10_Ctl_StMG_070.cpp::decideRunSource

1-1. ProfileMode 분기 (motion 검사 추가)

```cpp
    if (useProfileMode) {
        if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
            // [B-1] profile motion 검사 (flip-flop 방지)
            if (g_A20_config_root.userProfiles) {
                ST_A20_UserProfilesRoot_t& v_up = *g_A20_config_root.userProfiles;
                if ((uint8_t)curProfileIndex < v_up.count) {
                    if (isMotionBlocked(v_up.items[(uint8_t)curProfileIndex].motion)) {
                        v_d.nextState        = EN_CT10_STATE_MOTION_BLOCKED;
                        v_d.reason           = EN_CT10_REASON_MOTION_NO_PRESENCE;
                        v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
                        v_d.nextProfileIndex = curProfileIndex;
                        v_d.wantSimStop      = true;
                        return v_d;
                    }
                }
            }
            v_d.nextState        = EN_CT10_STATE_PROFILE_RUN;
            v_d.reason           = EN_CT10_REASON_PROFILE_MODE;
            v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
            v_d.nextProfileIndex = curProfileIndex;
            return v_d;
        }
        ...
    }
```

1-2. UserProfile 분기 (motion 검사 추가)

```cpp
    if (runSource == EN_CT10_RUN_USER_PROFILE && curProfileIndex >= 0) {
        // [B-1] profile motion 검사
        if (g_A20_config_root.userProfiles) {
            ST_A20_UserProfilesRoot_t& v_up = *g_A20_config_root.userProfiles;
            if ((uint8_t)curProfileIndex < v_up.count) {
                if (isMotionBlocked(v_up.items[(uint8_t)curProfileIndex].motion)) {
                    v_d.nextState        = EN_CT10_STATE_MOTION_BLOCKED;
                    v_d.reason           = EN_CT10_REASON_MOTION_NO_PRESENCE;
                    v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
                    v_d.nextProfileIndex = curProfileIndex;
                    v_d.wantSimStop      = true;
                    return v_d;
                }
            }
        }
        v_d.nextState        = EN_CT10_STATE_PROFILE_RUN;
        v_d.reason           = EN_CT10_REASON_USER_PROFILE_ACTIVE;
        v_d.nextRunSource    = EN_CT10_RUN_USER_PROFILE;
        v_d.nextProfileIndex = curProfileIndex;
        return v_d;
    }
```

1-3. Schedule 분기 (motion 검사 추가)

```cpp
    {
        ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
        int v_activeIdx = findActiveScheduleIndex(v_cfg, true);

        if (v_activeIdx >= 0) {
            // [B-1] schedule motion 검사
            if ((uint8_t)v_activeIdx < v_cfg.count) {
                ST_A20_ScheduleItem_t& v_s = v_cfg.items[(uint8_t)v_activeIdx];
                if (isMotionBlocked(v_s.motion)) {
                    v_d.nextState         = EN_CT10_STATE_MOTION_BLOCKED;
                    v_d.reason            = EN_CT10_REASON_MOTION_NO_PRESENCE;
                    v_d.nextRunSource     = EN_CT10_RUN_SCHEDULE;
                    v_d.nextScheduleIndex = (int8_t)v_activeIdx;
                    v_d.wantSimStop       = true;
                    return v_d;
                }
            }
            v_d.nextState         = EN_CT10_STATE_SCHEDULE_RUN;
            v_d.reason            = EN_CT10_REASON_SCHEDULE_ACTIVE;
            v_d.nextRunSource     = EN_CT10_RUN_SCHEDULE;
            v_d.nextScheduleIndex = (int8_t)v_activeIdx;
            return v_d;
        }
    }
```

---

수정 2 — CT10_Ctl_Ctl_070.cpp::tickSegmentSequence (self-heal)

Schedule 오버로드와 Profile 오버로드 모두에 동일 패턴 삽입.

위치: ST_A20_ScheduleSegment_t& v_seg = p_segs[(uint8_t)p_rt.index]; 다음, v_onMs 계산 이전.

```cpp
    ST_A20_ScheduleSegment_t& v_seg = p_segs[(uint8_t)p_rt.index];

    // [B-1] self-heal: MOTION_BLOCKED 등으로 sim이 죽어있으면 onPhase에 대해 재적용
    //  - 이전: motion 해제 후 segRt.index >= 0 유지 → tickSegmentSequence 초기 분기 skip
    //         → applySegmentOn 미호출 → sim 영구 정지
    //  - 이후: onPhase && !sim.active 시 즉시 재적용
    //  - phaseStartMs는 유지 (타이머 계속 진행)
    if (p_rt.onPhase && !sim.active) {
        applySegmentOn(v_seg);
        return true;
    }

    uint32_t v_onMs  = (uint32_t)v_seg.onMinutes  * 60000UL;
    ...
```

Profile 오버로드도 동일하게 (ST_A20_UserProfileSegment_t& v_seg = ... 다음).

---

수정 3 (선택) — tickSchedule/tickUserProfile 내 isMotionBlocked 제거

이 시점부터 decideRunSource가 motion을 처리하므로 tick 내부 검사는 dead code. 남겨두면 race로 인한 중복 호출만 발생 (무해). 삭제 권장.

tickSchedule:

```cpp
    // (B-1) 삭제 — decideRunSource에서 motion 처리
    // if (isMotionBlocked(v_schedule.motion)) {
    //     onMotionBlocked(EN_CT10_REASON_MOTION_NO_PRESENCE);
    //     return true;
    // }
```

tickUserProfile: 동일 삭제.

onMotionBlocked 자체는 유지 (다른 경로에서 사용 가능성 대비).

---

흐름 검증

Case 1: Motion blocked 진입

시각 상태 동작
t0 SCHEDULE_RUN, sim.active —
t1 decide: motion blocked → MOTION_BLOCKED + wantSimStop applyDecision → state 변경, sim.stop()
t2 MOTION_BLOCKED fall-through → sim.stop()
t3 decide: 여전히 MOTION_BLOCKED applyDecision: 변화 없음 → flip 없음 ✅

Case 2: Motion 해제

시각 상태 동작
t0 MOTION_BLOCKED —
t1 decide: motion resolved → SCHEDULE_RUN applyDecision → state 변경, source 변화 없음
t2 SCHEDULE_RUN tickSchedule → tickSegmentSequence → self-heal → applySegmentOn → sim 활성 ✅

Case 3: Override 중 motion 변화

시각 상태 동작
t0 OVERRIDE motion 무시 (우선순위)
t1 override timeout decide → motion blocked → MOTION_BLOCKED
t2 MOTION_BLOCKED segRt 이전 인덱스 유지
t3 motion resolved self-heal로 재개 ✅

---

검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 PIR 감지 중단 → 로그 State=MOTION_BLOCKED 1회만 (flip 없음)
3 PIR 재감지 State=SCHEDULE_RUN 1회, sim 재개
4 팬 동작 motion block 동안 정지, 해제 후 재개 (self-heal)
5 lastStateChangeMs 상태 변화 시에만 갱신 (40ms마다 X)
6 5분 지속 부하 flip-flop 로그 0건

---

적용 순서:

1. decideRunSource 3개 분기 수정
2. tickSegmentSequence self-heal (2 오버로드)
3. (선택) tickSchedule/tickUserProfile dead code 제거

컴파일 결과 알려주세요.