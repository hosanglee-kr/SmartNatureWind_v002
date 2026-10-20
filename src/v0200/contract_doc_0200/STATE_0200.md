# STATE_0200.md — 상태 소유권 및 FSM 명세

> **단일 기록자 원칙**: 각 런타임 상태 변수는 원칙적으로 단 하나의 태스크만 쓰기 권한을 가진다. 다중 태스크 쓰기 시 전용 뮤텍스 또는 `std::atomic`으로 격리.  
> F-01~F-10, I-1~I-6, N-1~N-4, A-1~A-3, B-1~B-6, C-1~C-8, D-1~D-5, E-1~E-10, E-2.1~E-2.7, F-1~F-10 반영.  
> **파일명 정책**: 계약 문서 `_0200.md` 유지, 코드 참조 `_0201` 접미사.

---

## 1. 상태 변수 소유권 및 접근 매트릭스

| 상태 변수 | 단독 Writer | 허용 Reader | 보호 기제 | 비고 |
|---|---|---|---|---|
| `runCtx` | T-loop (`CT10::tickLoop`) | T-async (`exportStateJson_v02`), T-loop | `CT10::s_stateMutex` (100ms) | FSM 상태/이유/홀드 |
| `overrideState` | T-loop, T-async (`startOverride*`) | T-loop (`tickOverride`, `decideRunSource`) | `CT10::s_stateMutex` | 수동/오버라이드 |
| `autoOffRt` | T-loop (`tickLoop`) | T-loop | `CT10::s_stateMutex` | AutoOff 런타임 |
| `scheduleSegRt` / `profileSegRt` | T-loop (`tickSegmentSequence`) | T-loop | `CT10::s_stateMutex` | 세그먼트 스텝/경과 |
| `_persistOffTimeLastYday` | T-loop (`reloadAll` 리셋) | T-loop (`checkAutoOff`) | `CT10::s_stateMutex` | offTime 재트리거 방지 |
| `_autoOffLatched` | T-loop (발동 시 `true`), T-async (해제 시 `false`) | T-loop (`decideRunSource`) | `CT10::s_stateMutex` | 사용자 확인 전 재진입 차단 |
| `_pendingMotionSimApply` | T-async (`requestMotionSimApply`) | T-loop (`tickLoop` 최상단) | `std::atomic<bool>` | **F-06** 위임 |
| `s_pendingReload` | T-async (`requestReload` CAS) | T-loop (`consumePendingReload`), 모든 태스크 (`isReloadPending`) | `std::atomic<bool>` | **F-05, I-1** |
| `s_lastReloadOk` | T-loop (`reloadAll`) | T-async, 모든 태스크 | `std::atomic<bool>` | **N-1** 성공/실패 |
| `sim.*` | T-loop (`tickLoop`), T-loop (`patchSimFromJson` 경유) | T-async (`exportSimJson` 경유) | `S10::_recursiveMutex` (100ms) | **A-2** 위임 필수 |
| `_pir`, `_state` (M10) | T-async (`notifyPIRDetected`), T-loop (`tick`) | T-loop (`isActive`, `toJson`) | `M10::s_stateMutex` (100ms) | **A-2** 위임 필수 |
| `s_state` (N10) | T-loop (CT10 setter / `tick` flush) | T-async (`getState`, `toJson`) | `N10::s_mutex` (100ms) | NVS 런타임 |
| `s_dirty.runtime` (N10) | T-loop (setter 호출 시 `true`) | T-loop (`tick` flush 시 `false`) | `N10::s_mutex` | **F-04** 게이트 |
| `s_staConnected` (WF10) | T-sys_evt (이벤트), T-wf (`startSTA`) | T-loop (LED), T-async | `std::atomic<bool>` (**D-4**) | Wi-Fi 연결 |
| `s_timeValid`, `s_wifiUp` (TM10) | T-sys_evt, T-wf, T-loop (`tick`) | 모든 태스크 | `TM10::s_mutex` | **F-01** NTP |
| `g_A20_config_root` | T-loop (`reloadAll` 스왑) | 모든 태스크 (`getRootSnapshot`) | `s_rootSwapMux` | LittleFS 루트 |
| `_dirtyState/Metrics/Chart/Summary` (CT10) | T-loop (`markDirty`), T-loop (`consumeAllDirty` 소비) | T-loop (`CT10_WS_tick`) | `CT10::s_stateMutex` (**D-1** 배치) | WS 채널 dirty |

---

## 2. CT10 메인 제어 상태머신 (7-State FSM)

### 2.1 상태 정의

1. **`EN_CT10_STATE_IDLE`**: 대기 (팬 정지)
2. **`EN_CT10_STATE_OVERRIDE`**: 수동/강제 풍속 실행
3. **`EN_CT10_STATE_PROFILE_RUN`**: 사용자 프로파일 시퀀스 실행
4. **`EN_CT10_STATE_SCHEDULE_RUN`**: 요일/시간 스케줄 세그먼트 실행
5. **`EN_CT10_STATE_MOTION_BLOCKED`**: PIR 미감지(부재) 일시 중지
6. **`EN_CT10_STATE_AUTOOFF_STOPPED`**: AutoOff 래치 정지
7. **`EN_CT10_STATE_TIME_INVALID`**: NTP 미동기화로 스케줄 판정 불가

### 2.2 상태 전이 우선순위 (`decideRunSource`)

```text
[1] overrideState.active == true
    └──► OVERRIDE (수동이 모든 자동 제어 압도)

[2] _autoOffLatched == true
    └──► AUTOOFF_STOPPED (사용자 재개 전 재시작 차단)

[3] useProfileMode == true
    ├── profile 선택됨 (curProfileIndex >= 0)
    │   ├── motionBlocked == true  ──► MOTION_BLOCKED
    │   └── motionBlocked == false ──► PROFILE_RUN
    └── profile 미선택  ──► IDLE (F-5: schedule fall-through 차단)

[4] runSource == USER_PROFILE && curProfileIndex >= 0
    ├── motionBlocked == true  ──► MOTION_BLOCKED
    └── motionBlocked == false ──► PROFILE_RUN

[5] !TM10::isTimeValid()
    └──► TIME_INVALID (스케줄 판정 불가, 3초 홀드)

[6] findActiveScheduleIndex() >= 0
    ├── motionBlocked == true  ──► MOTION_BLOCKED
    └── motionBlocked == false ──► SCHEDULE_RUN

[7] 일치 없음
    └──► IDLE
```

### 2.3 상태 전이표

| From | To | 조건 | 부수효과 | 이탈 |
|---|---|---|---|---|
| Any | OVERRIDE | 수동 API 호출 | 세그먼트 런타임 클리어, 팬 즉시 구동 | 시간 만료/명시 정지 |
| Any | AUTOOFF_STOPPED | 타이머/offTime/offTemp | `sim.stop()`, `_autoOffLatched=true` | `ackEvent`/`setMode`/`startOverride` |
| Any | MOTION_BLOCKED | `isMotionBlocked()` | `sim.stop()` | 재실 감지 회복 |
| Any | TIME_INVALID | NTP 미동기 + 스케줄 진입 | `sim.stop()`, 3초 홀드 | `s_timeValid=true` |
| Any | SCHEDULE_RUN | 활성 시간대 + 재실 | 세그먼트 시퀀스, PWM | 스케줄 종료/모션 차단 |
| Any | PROFILE_RUN | 프로파일 모드 + 재실 | 프로파일 시퀀스 | 종료/수동 정지 |
| Any | IDLE | 모든 활성 조건 부재 | `sim.stop()` | 이벤트 발생 |

> **부수효과 분리**: `applyDecision()`만 `runCtx.state` 갱신. 각 `tickOverride/tickSchedule`은 결정 상태에 따른 연산만.

### 2.4 Batch F-5: profile fall-through 차단

- **이전**: `useProfileMode=true` + `curProfileIndex<0` 시 schedule 블록으로 fall-through
- **이후**: profile mode + 미선택 시 명시적 IDLE 반환
- **근거**: 사용자가 profile 모드를 선택했다면 schedule 실행은 UX 위반

---

## 3. S10 시뮬레이션 물리 엔진 상태

| 상태 필드 | Writer | 전이 조건 |
|---|---|---|
| `active` | CT10 (`applyResolvedWind`/`stop`) | 상위 FSM 종속 |
| `fanPowerEnabled` | CT10/Web API | 전원 토글 |
| `phase` (CALM/NORMAL/STRONG) | `updatePhase()` | `_tickNowSec - phaseStartSec ≥ phaseDurationSec` |
| `gustActive` | `updateGust()` | rate 기반 확률 판정 |
| `thermalActive` | `updateThermal()` | rate 기반 확률 판정 |
| `s_chartBuffer[120]` | `tick()` (`_recursiveMutex` 내) | 1Hz/2Hz 샘플 |
| `s_chartHead`, `s_chartCount` | `tick()`, `toChartJson` | 링버퍼 삽입/상한 120 |

**불변식 (Invariants)**:
- `currentWindSpeed ∈ [G_S10_WIND_MIN_MS, G_S10_WIND_MAX_MS]` = `[0.2, 11.0]` m/s (**Batch C 상수**)
- `s_chartCount ≤ CHART_CAPACITY (= 120)`
- **Batch D-5**: `toChartJson` static `s_snapshot[120]`은 `_recursiveMutex` 보유 중 채우고, 락 해제 후 읽음

---

## 4. WF10 Wi-Fi 상태머신

```text
[IDLE]
  │
  ├─► (init) ──► [AP / STA / AP_STA]
  │
  ├─► (연결 시도) ──► [CONNECTED (GOT_IP)] ──► TM10 통지 (F-01)
  │                                              │
  │                                              └─► s_staConnected.store(true) (D-4)
  │
  └─► (5회 실패) ──► [AP Fallback] ──► 복구 대기
```

- `s_staConnected`: `std::atomic<bool>` (**D-4**). GOT_IP 시 `store(true)`, DISCONNECTED 시 `store(false)`.
- `s_reconnectAttempts`: 연속 실패 (최대 `G_WF10_RECONNECT_MAX=5`, **C-7**)
- 재연결 백오프: `G_WF10_BACKOFF_INIT_MS=500` × `G_WF10_BACKOFF_MUL=2` → `G_WF10_BACKOFF_MAX_MS=4000` 상한 (**C-8**)

---

## 5. TM10 시간 동기화 상태

- `s_timeValid`: 유효 시간 (2023-11-15 이후) 여부
- `s_timeSyncedRecently`: 최근 10분 (`G_TM10_SYNC_RECENT_WINDOW_MS`) 내 동기화 성공
- `s_waitingCallback`: SNTP 응답 대기 (15초 초과 시 다음 fallback 서버)
- `s_wifiUp == false` 시 SNTP 실행 안 함
- **Batch C**: `_isTimeSane()`이 `A20_Const::G_TIME_EPOCH_SANE_MIN` / `G_TIME_YEAR_MIN/MAX` 사용

---

## 6. 위임 플래그 라이프사이클 (F-05, F-06)

### 6.1 F-05 Pending Reload

```text
T-async (async_tcp)                          T-loop (loopTask)
─────────────────────────────────────────────────────────────────
[HTTP POST /api/v001/reload]
  requestReload()
    compare_exchange_strong(false, true)
    ├─ 실패(이미 true) ──► 409 Conflict
    └─ 성공 ──────────► 202 Accepted (< 1ms)
                                             (다음 루프)
                                             consumePendingReload()
                                               exchange(false) == true
                                               ├──► reloadAll()
                                               └──► applySystemRuntimeFromConfig()

isReloadPending() (상태 폴링)
  load(acquire) ──► true/false
```

### 6.2 F-06 Pending Motion.Sim Apply

```text
T-async (async_tcp)                          T-loop (CT10::tickLoop)
─────────────────────────────────────────────────────────────────
[HTTP POST /api/v001/motion]
  patchMotionFromJson() (메모리만)
  requestMotionSimApply()
    _pendingMotionSimApply.store(true)
  ──► 200 OK (< 5ms)
                                             (다음 제어 주기 ≤ 40ms)
                                             exchange(false) == true
                                               └──► applyMotionSimConfigToSim()
                                                    (s_stateMutex 보유 상태)
```

### 6.3 Batch D-1 Dirty 배치 소비

```text
markDirty("state")   ──┐
markDirty("metrics") ──┤  (각각 mutex 1회 = 4회)
markDirty("chart")   ──┤       ↓
markDirty("summary") ──┘  [D-1] 개선

CT10_WS_tick (T-loop)
  consumeAllDirty() 1회 = mutex 1회
    bit0=state, bit1=metrics, bit2=chart, bit3=summary
    각 pending 채널 true로 적립
```

---

## 7. AutoOff 래치 및 이벤트 상태

### 7.1 래치 해제 경로

`_autoOffLatched = false` 설정 위치 (모두 `s_stateMutex` 하):
1. `ackEventState()` — 사용자 ACK
2. `setProfileMode()` — 모드 변경
3. `startOverrideFixed()` / `applyManualResolved()` — 수동 개입

### 7.2 AutoOff offTime 재트리거 방지

- `_persistOffTimeLastYday` (CT10 멤버) — **yday 기반 1일 1회**
- 리셋 시점: 오직 `reloadAll()` (설정 재적용)
- **A-2**: 이전 `autoOffRt.offTimeLastYday`는 source 재진입 시 매번 리셋되어 3초 주기 무한 루프 위험 → 영속 필드로 승격

### 7.3 이벤트 상태 hold/ACK

| 상태 | hold | ACK 필수 | 해제 조건 |
|---|---|---|---|
| `AUTOOFF_STOPPED` | 3초 (`S_EVENT_HOLD_MS`) | 선택 | `ackEvent` / 사용자 재개 |
| `TIME_INVALID` | 3초 | ❌ | NTP 회복 |
| `MOTION_BLOCKED` | 없음 | ❌ | 재실 감지 |

---

## 8. E-2 분할 파일 상태 소유권 (신규)

| 파일 | 소유 상태 | 공유 심볼 |
|---|---|---|
| `CT10_Ctl_Ctl_0201.cpp` | `_pendingMotionSimApply`, static wrapper | - |
| `CT10_Ctl_Ctl_Seg_0201.cpp` | `scheduleSegRt`, `profileSegRt`, `runCtx.activeSeg*` | - |
| `CT10_Ctl_Ctl_Ovr_0201.cpp` | `overrideState` | - |
| `CT10_Ctl_Ctl_Mode_0201.cpp` | `useProfileMode`, `curProfileIndex` | - |
| `CT10_Ctl_StMG_0201.cpp` | `runCtx` (decide/apply) | - |
| `CT10_Ctl_IOWS_0201.cpp` | `_dirty*`, `s_lastReloadOk`, WS static doc | - |
| `C10_Config_Sch_*` | 스케줄 CRUD | `G_C10_SCH_*` (Internal 헤더, **F-10**) |
| `C10_Config_UzProf_*` | 프로파일 CRUD | `G_C10_PROFILE_*` (Internal 헤더, **F-10**) |
| `C10_Config_WindDc_*` | 프리셋 CRUD | - |
| `TM10_TimeMg_0201.cpp` | SNTP 상태 | (모두 헤더 inline static) |

> **F-10 계약**: 분할 .cpp 간 공유 매크로는 `*_Internal_0201.h` 승격 필수. 파일 스코프 정의 금지.

---

## 9. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-20 | v2.2 | Batch A~F 반영: §1 `_dirty*`/`s_staConnected` atomic 명시, §2.4 F-5 profile fall-through, §3 S10 상수, §4 WF10 C-7/C-8/D-4, §6.3 D-1 배치, §7 AutoOff, §8 E-2 분할 상태 소유권 신규 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1, G-2/G-4, N-3 현행화 | Antigravity AI |
| 2026-10-19 | v2.0 | v0200 승격 + (v1.2의 번들 상태 규격 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | `_0201` 상태 규격 동기화 | Antigravity AI |
| 2026-10-19 | v1.1 | Enum/변수명 동기화, `_persistOffTimeLastYday` 추가 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 상태 명세 | 개발팀 |
