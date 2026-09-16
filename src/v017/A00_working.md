B-3 + C-2 + C-3 — 통합 diff

---

C-2. exportStateJson_v01 삭제 (dead code)

C-2-1. CT10_Ctl_070.h — 선언 삭제

```cpp
// BEFORE
    void exportStateJson_v02(JsonDocument& p_doc);
    void exportStateJson_v01(JsonDocument& p_doc);   // ← 삭제
    void exportChartJson(JsonDocument& p_doc, bool p_diffOnly);

// AFTER
    void exportStateJson_v02(JsonDocument& p_doc);
    // [C-2] exportStateJson_v01 삭제 (호출자 0건)
    void exportChartJson(JsonDocument& p_doc, bool p_diffOnly);
```

C-2-2. CT10_Ctl_IOWS_070.cpp — 함수 전체 삭제

```cpp
// 삭제 대상 함수 (약 70줄)
void CL_CT10_ControlManager::exportStateJson_v01(JsonDocument& p_doc) {
    ...
    sim.toJson(p_doc);
}
```

검증: grep exportStateJson_v01 → 0건.

---

C-3. reloadAll에 N10 리셋

CT10_Ctl_Ctl_070.cpp::reloadAll

위치: v_inst._autoOffLatched = false; 다음

```cpp
    // [A-2] 영속 필드 리셋 (설정 재적용이므로 offTime 트리거 이력 초기화)
    v_inst._persistOffTimeLastYday = -1;

    // [B-2] AutoOff 래치 리셋 (설정 재적용)
    v_inst._autoOffLatched = false;

    // [C-3] N10 런타임 상태 리셋 (설정 재적용)
    //  - reload는 설정 전면 교체이므로 이전 NVS 런타임 무효
    //  - 즉시 flush(true)로 NVS 반영
    CL_N10_NvsManager::resetRuntime();
```

---

B-3. N10 setter 배선

B-3-0. Include 추가 (3개 cpp)

```cpp
// CT10_Ctl_Ctl_070.cpp
// CT10_Ctl_Basic_070.cpp
// CT10_Ctl_StMG_070.cpp
#include "N10_NvsManager_070.h"
```

B-3-1. CT10_Ctl_Ctl_070.cpp::startUserProfileByNo

위치: initAutoOffFromUserProfile(v_p); 다음

```cpp
            initAutoOffFromUserProfile(v_p);

            // [B-3] N10 런타임 상태 저장 (profile)
            CL_N10_NvsManager::setRunMode(2, 2);   // mode=USER_PROFILE, source=WEB
            CL_N10_NvsManager::setLastUserProfile((int16_t)p_profileNo);
```

B-3-2. CT10_Ctl_Ctl_070.cpp::stopUserProfile

위치: sim.stop(); 다음

```cpp
    sim.stop();

    // [B-3] N10 런타임 상태 저장 (OFF)
    CL_N10_NvsManager::setRunMode(0, 2);
```

B-3-3. CT10_Ctl_Ctl_070.cpp::startOverrideFixed

위치: 함수 끝, 로그 다음

```cpp
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Override FIXED %.1f%% (sec=%lu)",
                       overrideState.fixedPercent, (unsigned long)p_seconds);

    // [B-3] N10 override 저장 (fixed)
    CL_N10_NvsManager::setOverrideFixed(true, overrideState.fixedPercent);
}
```

B-3-4. CT10_Ctl_Ctl_070.cpp::applyManualResolved

위치: 함수 끝, 로그 다음

```cpp
    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[CT10] applyManual: preset=%s style=%s (sec=%lu)",
                       p_wind.presetCode,
                       p_wind.styleCode,
                       (unsigned long)p_seconds);

    // [B-3] N10 override 저장 (resolved/preset)
    CL_N10_NvsManager::setOverridePreset(true, p_wind.presetCode, p_wind.styleCode);
}
```

참고: p_wind.fixedMode인 경우 상단에서 startOverrideFixed로 위임 → 이 경로는 도달하지 않음.

B-3-5. CT10_Ctl_Ctl_070.cpp::stopOverride

위치: memset(&overrideState, 0, ...); 다음

```cpp
    memset(&overrideState, 0, sizeof(overrideState));

    // [B-3] N10 override 해제
    CL_N10_NvsManager::clearOverride();

    markDirty("state");
    markDirty("metrics");
```

B-3-6. CT10_Ctl_StMG_070.cpp::applyDecision — SCHEDULE 진입

위치: applyDecision의 v_sourceChanged 블록, SCHEDULE 브랜치

```cpp
        if (runSource == EN_CT10_RUN_SCHEDULE) {
            scheduleSegRt.index        = -1;
            scheduleSegRt.onPhase      = true;
            scheduleSegRt.phaseStartMs = millis();
            scheduleSegRt.loopCount    = 0;

            // autoOff init
            if (g_A20_config_root.schedules && curScheduleIndex >= 0) {
                ST_A20_SchedulesRoot_t& v_cfg = *g_A20_config_root.schedules;
                if ((uint8_t)curScheduleIndex < v_cfg.count) {
                    initAutoOffFromSchedule(v_cfg.items[(uint8_t)curScheduleIndex]);

                    // [B-3] N10 런타임 저장 (schedule)
                    CL_N10_NvsManager::setRunMode(1, 0);   // mode=SCHEDULE, source=UNKNOWN(자동)
                    CL_N10_NvsManager::setLastSchedule((int16_t)v_cfg.items[(uint8_t)curScheduleIndex].schNo);
                } else {
                    memset(&autoOffRt, 0, sizeof(autoOffRt));
                }
            } else {
                memset(&autoOffRt, 0, sizeof(autoOffRt));
            }

        } else if (runSource == EN_CT10_RUN_USER_PROFILE) {
            ...
        } else {
            ...
        }
```

성능: setRunMode/setLastSchedule 내부에서 동일 값 비교 후 early return → 동일 스케줄 유지 시 NVS 부담 없음.

B-3-7. onAutoOffTriggered — 배선 생략

사유: AutoOff 정보는 source(스케줄/프로파일) 설정에서 매번 initAutoOff*로 복원됨. 별도 N10 저장 불필요.

---

부팅 시 복원 정책 — 별도 결정

현재 B-3는 "저장"만 배선. 복원은 정책 결정 필요:

옵션 내용 UX
(A) 자동 복원 A00_init에서 N10 상태 → override/profile 재개 재부팅 후 즉시 이전 상태
(B) UI 조회 프론트가 /api/v1/state의 N10 정보 확인 후 사용자 재개 명시적 재개
(C) 없음 N10은 정보 기록만, 복원 없음 무상태

의견: (A) override만 자동 복원이 자연 (WiFi 재부팅 등에도 유지 기대). schedule/profile은 시간 조건 재평가가 필요하므로 자동.

A00_init 확장 (옵션 A) — 추후 별도 배치:

```cpp
// CT10::begin() 이후
ST_N10_RuntimeState_t v_n10 = CL_N10_NvsManager::getState();
if (v_n10.overrideEnabled) {
    if (v_n10.overrideMode == 1) {
        g_A00_control.startOverrideFixed(v_n10.overrideFixedPercent, 0);
    } else if (v_n10.overrideMode == 2) {
        g_A00_control.startOverridePreset(v_n10.overridePresetCode, v_n10.overrideStyleCode, nullptr, 0);
    }
}
```

이번 diff에서는 배선만, 복원은 별도 결정 요청.

---

변경 요약

파일 C-2 C-3 B-3
CT10_Ctl_070.h v01 선언 삭제 — —
CT10_Ctl_IOWS_070.cpp v01 함수 삭제 — —
CT10_Ctl_Ctl_070.cpp — N10 reset include + 4곳 setter
CT10_Ctl_StMG_070.cpp — — include + schedule setter
CT10_Ctl_Basic_070.cpp — — include (향후 확장 대비)

순 삭제 약 70줄, 신규 약 20줄.

---

검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 grep exportStateJson_v01 0건
3 프로파일 시작 후 재부팅 NVS에 profileNo 저장
4 override 후 재부팅 NVS에 override 상태 저장
5 schedule 진입 시 setRunMode(1, ...) (동일 스케줄 유지 시 early return)
6 reload 호출 N10 상태 초기화
7 flash 부담 초기 설정 이후 변경 시에만 write (dirty + 10초 flush)

---

적용 후 컴파일 결과 알려주세요. 부팅 복원 정책은 별도로 결정 원하시면 말씀 부탁드립니다.
