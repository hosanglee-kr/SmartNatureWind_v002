A-2 반영 — offTime 재트리거 방지 (영속 필드)

1) CT10_Ctl_070.h — private 멤버 1개 추가

위치: runCtx 선언 다음, private: 영역

```cpp
    ST_CT10_RunContext_t runCtx;

    // --------------------------------------------------
    // [A-2] offTime 재트리거 방지 영속 필드
    //  - source 재진입(initAutoOffFromSchedule/FromUserProfile)에도 유지
    //  - yday 기반: 같은 날 1회만 트리거, yday가 바뀌면 자연 재활성화
    //  - reloadAll()에서만 리셋 (설정 재적용 대비)
    // --------------------------------------------------
    int16_t _persistOffTimeLastYday = -1;
```

---

2) CT10_Ctl_Basic_070.cpp::checkAutoOff — offTime 블록 교체

BEFORE:

```cpp
    // 2) offTime (TM10)
    if (autoOffRt.offTimeEnabled) {
        struct tm v_tm;
        memset(&v_tm, 0, sizeof(v_tm));

        if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
            // 시간 불능이면 여기서 트리거하지 않음
        } else {
            int16_t  v_yday   = (int16_t)v_tm.tm_yday;
            int16_t  v_curMin = (int16_t)((uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min);

            // 정책: 같은 (yday + minute)일 때만 재트리거 방지
            bool v_already = (autoOffRt.offTimeLastYday == v_yday && autoOffRt.offTimeLastMin == v_curMin);

            if (!v_already) {
                if ((uint16_t)v_curMin >= autoOffRt.offTimeMinutes) {
                    autoOffRt.offTimeLastYday = v_yday;
                    autoOffRt.offTimeLastMin  = v_curMin;

                    if (p_reasonOrNull) *p_reasonOrNull = EN_CT10_REASON_AUTOOFF_TIME;

                    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(time %u) triggered",
                                       (unsigned)autoOffRt.offTimeMinutes);
                    return true;
                }
            }
        }
    }
```

AFTER:

```cpp
    // 2) offTime (TM10)
    //  [A-2] 영속 필드 기반 재트리거 방지
    //   - 이전: autoOffRt.offTimeLastYday/LastMin 사용 → source 재진입 시 리셋되어 3초 주기 무한 루프
    //   - 이후: _persistOffTimeLastYday (CT10 클래스 멤버) 사용
    //   - 정책: 같은 yday에서 offTimeMinutes 도달 시 1회만 트리거, yday 바뀌면 자연 재활성화
    if (autoOffRt.offTimeEnabled) {
        struct tm v_tm;
        memset(&v_tm, 0, sizeof(v_tm));

        if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
            // 시간 불능이면 여기서 트리거하지 않음(상위 tick에서 TIME_INVALID로 처리 권장)
        } else {
            int16_t v_yday   = (int16_t)v_tm.tm_yday;
            int16_t v_curMin = (int16_t)((uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min);

            if ((uint16_t)v_curMin >= autoOffRt.offTimeMinutes) {
                if (_persistOffTimeLastYday != v_yday) {
                    _persistOffTimeLastYday = v_yday;

                    // export/UI 표시용 (autoOffRt 필드는 참고용으로만 유지)
                    autoOffRt.offTimeLastYday = v_yday;
                    autoOffRt.offTimeLastMin  = v_curMin;

                    if (p_reasonOrNull) *p_reasonOrNull = EN_CT10_REASON_AUTOOFF_TIME;

                    CL_D10_Logger::log(EN_L10_LOG_INFO,
                                       "[CT10] AutoOff(time %u) triggered (yday=%d)",
                                       (unsigned)autoOffRt.offTimeMinutes,
                                       (int)v_yday);
                    return true;
                }
            }
        }
    }
```

---

3) CT10_Ctl_Ctl_070.cpp::reloadAll — 영속 필드 리셋 1줄

위치: memset(&v_inst.runCtx, 0, sizeof(v_inst.runCtx)); 다음

```cpp
    memset(&v_inst.scheduleSegRt, 0, sizeof(v_inst.scheduleSegRt));
    memset(&v_inst.profileSegRt,  0, sizeof(v_inst.profileSegRt));
    memset(&v_inst.runCtx,        0, sizeof(v_inst.runCtx));

    // [A-2] 영속 필드 리셋 (설정 재적용이므로 offTime 트리거 이력 초기화)
    v_inst._persistOffTimeLastYday = -1;
```

---

변경 요약

파일 변경
CT10_Ctl_070.h private _persistOffTimeLastYday +4줄
CT10_Ctl_Basic_070.cpp::checkAutoOff offTime 블록 교체 (~20줄)
CT10_Ctl_Ctl_070.cpp::reloadAll 리셋 1줄

변경 없음:

· A20_Const_070.h (struct 그대로)
· CT10_Ctl_IOWS_070.cpp (export 그대로, autoOffRt 필드 표시)
· initAutoOffFromSchedule/FromUserProfile (autoOffRt 초기화 유지, 영속 필드는 안 건드림)
· onAutoOffTriggered (autoOffRt memset 유지, 영속 필드는 유지)

---

검증 시나리오

정책: offTime = "06:30" → 그날 06:30 이후 1회 트리거 → 다음 날 06:30까지 재진입 없음.

시각 yday curMin persistYday 트리거?
06:30 100 390 -1 ✅ (persistYday=100)
06:30:03 (hold 만료, source 재진입) 100 390 100 ❌
06:31 100 391 100 ❌
23:59 100 1439 100 ❌
00:00 101 0 100 ❌ (0 < 390)
06:30 (다음 날) 101 390 100 ✅ (persistYday=101)

이전 로직과의 차이:

· 이전: 매 분(yday+minute 변화)마다 재트리거 + source 재진입마다 리셋 → 3초 주기 루프
· 이후: yday당 1회만 트리거

---

회귀 리스크

리스크 대응
사용자가 그날 offTime 이전으로 스케줄 변경 reloadAll 경로에서 리셋
WiFi 재연결 시 리셋? 안 됨 (의도적, offTime 정책 유지)
NTP 시간 재동기화로 yday 오차 드묾, 실질 영향 없음
initAutoOffFromSchedule에서 autoOffRt만 초기화 export 표시 일관성 유지, 실제 판정은 영속 필드

---

적용 후 컴파일 결과 알려주세요. 통과 시 실기 테스트:

· 스케줄 offTime=06:30 설정 → 시각 도달 후 로그에 3초 주기 재트리거 없는지 확인