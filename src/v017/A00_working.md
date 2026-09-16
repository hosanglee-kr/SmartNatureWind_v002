


16. resetRuntime

```cpp
void CL_N10_NvsManager::resetRuntime() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (!s_initialized)
        begin();
    memset(&s_state, 0, sizeof(s_state));
    s_state.lastScheduleNo	  = -1;
    s_state.lastUserProfileNo = -1;
    s_dirty.runtime			  = true;
    flush(true);   // 재귀 mutex → 안전

    CL_D10_Logger::log(EN_L10_LOG_WARN, "[N10] Runtime state reset");
}
```

---

안전성 재확인

함수 begin() 재귀 flush() 재귀 recursive 필요
setRunMode ✅ (begin) — yes
setLastSchedule ✅ — yes
setLastUserProfile ✅ — yes
setAutoOff ✅ — yes
setOverrideFixed ✅ — yes
setOverridePreset ✅ — yes
clearOverride ✅ — yes
resetRuntime ✅ ✅ (flush) yes

→ 모두 재귀 mutex 필요. CL_A40_MutexGuard_Semaphore가 이미 재귀 생성 → 안전.

---

검증 체크리스트

# 시나리오 기대
1 컴파일 에러 0
2 grep -c "CL_A40_MutexGuard_Semaphore v_guard(s_mutex" N10*.cpp 15건 (begin/end/clearAll/markDirty/flushIfNeeded/getState/toJson/tick/setRunMode/setLastSchedule/setLastUserProfile/setAutoOff/setOverrideFixed/setOverridePreset/clearOverride/resetRuntime/flush)
3 HTTP /api/v001/control/override/fixed 즉시 반영, race 없음
4 resetRuntime → flush(true) 재귀 정상
5 setter 다중 동시 호출 mutex 대기 → 정상
6 Flash 크기 미미한 증가

참고: 위 grep 결과로 15건 이상이어야 함. 누락 7건 반영 후 재확인.

---

7개 함수 guard 추가 후 재컴파일 → 결과 알려주시면 P1-1(WF10 race)로 진행하겠습니다.