# STATE_0203.md — 상태 소유권 및 FSM 명세 (v3.6)

> **단일 기록자 원칙**: 각 런타임 상태 변수는 원칙적으로 단 하나의 태스크만 쓰기 권한을 가진다. 다중 태스크 쓰기 시 전용 뮤텍스 또는 `std::atomic`으로 격리.  
> F-01~F-10, I-1~I-6, N-1~N-4, A-1~A-3, B-1~B-6, C-1~C-8, D-1~D-5, E-1~E-10, E-2.1~E-2.7, F-1~F-10, Batch G 반영.  
> **파일명 정책**: 계약 문서 `_0203.md` 유지, 코드 참조 `_0203` 접미사.

---

## 🔍 AI 빠른 참조 (섹션 트리거)

| 변경 대상 | §섹션 |
|---|---|
| 상태 변수 소유권 매트릭스 | [§1](#1-상태-변수-소유권-및-접근-매트릭스) |
| runCtx FSM (7-State) | [§2.1](#21-상태-정의)~[§2.4](#24-batch-f-5-profile-fall-through-차단) |
| Session ↔ runCtx FSM 관계 (ADR-1) | [§2.5](#25-session-fsm--runctx-fsm-관계-adr-1-확정) |
| S10 물리 엔진 | [§3](#3-s10-시뮬레이션-물리-엔진-상태) |
| M10 PIR 단일 판정 (C-3) | [§3.1](#31-m10-모션-감지-상태-c-3-반영) |
| WF10 Wi-Fi / TM10 SNTP | [§4](#4-wf10-wi-fi-상태머신), [§5](#5-tm10-시간-동기화-상태) |
| 위임 플래그 라이프사이클 (F-05/F-06/D-1) | [§6.1](#61-f-05-pending-reload)~[§6.3](#63-batch-d-1-dirty-배치-소비) |
| Session Pause/Resume/Stop | [§6.4](#64-session-pauseresumestop-위임-라이프사이클) |
| AutoOff 래치·이벤트 ACK | [§7](#7-autooff-래치-및-이벤트-상태) |
| E-2 분할 파일 소유권 | [§8](#8-e-2-분할-파일-상태-소유권-신규) |


---

## 📋 목차 (Table of Contents)

1. [상태 변수 소유권 및 접근 매트릭스](#1-상태-변수-소유권-및-접근-매트릭스)
2. [CT10 메인 제어 상태머신 (7-State FSM)](#2-ct10-메인-제어-상태머신-7-state-fsm)
   - [2.1 상태 정의](#21-상태-정의)
   - [2.2 상태 전이 우선순위 (`decideRunSource`)](#22-상태-전이-우선순위-deciderunsource)
   - [2.3 상태 전이표](#23-상태-전이표)
   - [2.4 Batch F-5: profile fall-through 차단](#24-batch-f-5-profile-fall-through-차단)
   - [2.5 Session FSM ↔ runCtx FSM 관계 (ADR-1 확정)](#25-session-fsm--runctx-fsm-관계-adr-1-확정)
     - [2.5.1 이중 상태의 명확한 분리](#251-이중-상태의-명확한-분리)
     - [2.5.2 핵심 계약](#252-핵심-계약)
     - [2.5.3 세션 전이 매트릭스](#253-세션-전이-매트릭스)
     - [2.5.4 타임라인 예시 (PLAYLIST)](#254-타임라인-예시-playlist)
     - [2.5.5 금지 패턴](#255-금지-패턴)
3. [S10 시뮬레이션 물리 엔진 상태](#3-s10-시뮬레이션-물리-엔진-상태)
   - [3.1 M10 모션 감지 상태 (C-3 반영)](#31-m10-모션-감지-상태-c-3-반영)
4. [WF10 Wi-Fi 상태머신](#4-wf10-wi-fi-상태머신)
5. [TM10 시간 동기화 상태](#5-tm10-시간-동기화-상태)
6. [위임 플래그 라이프사이클 (F-05, F-06)](#6-위임-플래그-라이프사이클-f-05-f-06)
   - [6.1 F-05 Pending Reload](#61-f-05-pending-reload)
   - [6.2 F-06 Pending Motion.Sim Apply](#62-f-06-pending-motionsim-apply)
   - [6.3 Batch D-1 Dirty 배치 소비](#63-batch-d-1-dirty-배치-소비)
   - [6.4 Session Pause/Resume/Stop 위임 라이프사이클](#64-session-pauseresumestop-위임-라이프사이클)
7. [AutoOff 래치 및 이벤트 상태](#7-autooff-래치-및-이벤트-상태)
   - [7.1 래치 해제 경로](#71-래치-해제-경로)
   - [7.2 AutoOff offTime 재트리거 방지](#72-autooff-offtime-재트리거-방지)
   - [7.3 이벤트 상태 hold/ACK](#73-이벤트-상태-holdack)
8. [E-2 분할 파일 상태 소유권 (신규)](#8-e-2-분할-파일-상태-소유권-신규)
9. [개정 이력](#9-개정-이력)

---

## 1. 상태 변수 소유권 및 접근 매트릭스

| 상태 변수 | 단독 Writer | 허용 Reader | 보호 기제 | 비고 |
|---|---|---|---|---|
| `runCtx` | T-loop (`CT10::tickLoop`) | T-async (`exportStateJson_v02`), T-loop | `CT10::s_stateMutex` (100ms) | FSM 상태/이유/홀드 |
| `overrideState` | T-loop, T-async (`startOverride*`) | T-loop (`tickOverride`, `decideRunSource`) | `CT10::s_stateMutex` | 수동/오버라이드 |
| `autoOffRt` | T-loop (`tickLoop`) | T-loop | `CT10::s_stateMutex` | AutoOff 런타임 |
| `scheduleSegRt` / `profileSegRt` | T-loop (`tickSegmentSequence`) | T-loop | `CT10::s_stateMutex` | 세그먼트 스텝/경과 |
| `_persistOffTimeLastYday` | T-loop (`reloadAll` 리셋) | T-loop (`checkAutoOff`) | `CT10::s_stateMutex` | offTime 재트리거 방지 |
| `_autoOffLatched` | T-loop (발동 시 `true`), T-async (`POST /api/v001/control/ack` 해제 시 `false`) | T-loop (`decideRunSource`) | `CT10::s_stateMutex` | 사용자 확인 전 재진입 차단 |
| `_pendingMotionSimApply` | T-async (`requestMotionSimApply`) | T-loop (`tickLoop` 최상단) | `std::atomic<bool>` | **F-06** 위임 |
| `s_pendingReload` | T-async (`requestReload` CAS) | T-loop (`consumePendingReload`), 모든 태스크 (`isReloadPending`) | `std::atomic<bool>` | **F-05, I-1** |
| `s_lastReloadOk` | T-loop (`reloadAll`) | T-async, 모든 태스크 | `std::atomic<bool>` | **N-1** 성공/실패 |
| `sim.*` | T-loop (`tickLoop`), T-loop (`patchSimFromJson` 경유) | T-async (`exportSimJson` 경유) | `S10::_recursiveMutex` (100ms) | **A-2** 위임 필수 |
| `_pir`, `_state` (M10) | T-async (`notifyPIRDetected`), T-loop (`tick`) | T-loop (`isActive`, `toJson`) | `M10::s_stateMutex` (100ms) | **A-2** 위임 필수. **[C-3]** `isActive()` 판정은 `_state.pirActive` 단일 — `lastChange_ms` 재계산 금지 (2×hold 버그) |
| `s_state` (N10) | T-loop (CT10 setter / `tick` flush) | T-async (`getState`, `toJson`) | `N10::s_mutex` (100ms) | NVS 런타임 |
| `s_dirty.runtime` (N10) | T-loop (setter 호출 시 `true`) | T-loop (`tick` flush 시 `false`) | `N10::s_mutex` | **F-04** 게이트 |
| `s_staConnected` (WF10) | T-sys_evt (이벤트), T-wf (`startSTA`) | T-loop (LED), T-async | `std::atomic<bool>` (**D-4**) | Wi-Fi 연결 |
| `s_timeValid`, `s_wifiUp` (TM10) | T-sys_evt, T-wf, T-loop (`tick`) | 모든 태스크 | `TM10::s_mutex` | **F-01** NTP |
| `g_A20_config_root` | T-loop (`reloadAll` 스왑) | 모든 태스크 (`getRootSnapshot`) | `s_rootSwapMux` | LittleFS 루트 |
| `_dirtyState/Metrics/Chart/Summary` (CT10) | T-loop (`markDirty`), T-loop (`consumeAllDirty` 소비) | T-loop (`CT10_WS_tick`) | `CT10::s_stateMutex` (**D-1** 배치) | WS 채널 dirty |
| `_session` | T-async (start/pause/resume/stop) | T-async (`exportStateJson_v02`), T-loop | `CT10::s_stateMutex` | **mirror 전용** — FSM 결정 미참여 (ADR-1) |
| `_pausedExec` | T-async (`pauseSession`) | T-async (`resumeSession`) | `CT10::s_stateMutex` | Pause 시 실행 컨텍스트 백업 |
| `_session.payload.playlist.profileName` | T-async (`startSession` PLAYLIST) | T-async (`exportStateJson_v02`) | `CT10::s_stateMutex` | NowPlaying Bar 제목 (Phase 3) |
| `_session.payload.playlist.currentStepStartMs` | T-loop (startSession), T-async (pause/resume 시 시프트) | T-async (`exportStateJson_v02`) | `CT10::s_stateMutex` | stepRemainSec 계산 기준점 |
| `runCtx.state` | T-loop (`applyDecision`) | T-async (`exportStateJson_v02`), T-loop | `CT10::s_stateMutex` | FSM 실제 상태 (session과 별개) |
| `s_aiDailyUsage` (N10) | T-async (`reportAIUsage`, `resetAICost`) | T-async (`getAIDailyUsage`) | `N10::s_mutex` | 당일 비용 누적 및 자정 자동 리셋 (NVS 4키 영구화) |
| `s_promptCache` (CT10_AI) | T-async (`buildAIPromptStrict`) | T-async | 30초 유효 타임스탬프 | I2C 센서 블로킹 및 힙 파편화 방지 |
| `runtimeAutoOff` (CT10 `_session.runtimeAutoOffMin`, `runtimeAutoOffStartMs`) | T-async (`setSessionAutoOff`, `POST /control/timer`, `AI set_timer`), T-loop (`tickLoop` 만료) | T-async (`getTimerDurationMin`, `getSessionAutoOffRemainSec`), T-loop | `CT10::s_stateMutex` | 하드웨어 백엔드 타이머 런타임 상태 (만료 시 stopSession + setAutoComfort(false)) |
| `s_autoComfortEnabled` (CT10) | T-async (`POST /comfort/auto`), T-loop (`begin()`) | T-loop (`tickAutoComfort`), T-async (`GET /comfort/auto`) | `CT10::s_stateMutex` + NVS | Comfort 자동 모드 활성 플래그 |

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


## 2.5 Session FSM ↔ runCtx FSM 관계 (ADR-1 확정)

### 2.5.1 이중 상태의 명확한 분리

| 계층 | 상태 | 소유 | 목적 |
|---|---|---|---|
| **`runCtx.state`** | `EN_CT10_STATE_*` (7종) | T-loop (`applyDecision`) | **제어 로직 판단** — 팬 on/off, override/schedule 결정 |
| **`_session.state`** | `EN_SESSION_runtime_t` (3종) | T-async (`start/pause/resume/stop`) | **API 응답 계층** — 프론트 NowPlaying Bar |

### 2.5.2 핵심 계약
1. `decideRunSource()`는 **절대 `_session`을 참조하지 않음**.
2. `_session`은 `startSession`에서 위임된 실행 컨텍스트(`runSource`/`overrideState`/`curProfileIndex`)의 "사용자 명시 세션 여부"만 미러링.
3. `_session.trigger`: 1=MANUAL, 2=SCHEDULE, 3=AUTO_COMFORT (Comfort 자동 모드에 의한 세션 기동 식별).
4. **하드웨어 타이머 만료 (Stage 10.1)**: `runtimeAutoOffMin` 경과 시 `runCtx.reason = EN_CT10_REASON_AUTOOFF_TIMER` (9) 설정 후 `stopSession()` 및 `setAutoComfort(false)`를 호출하여 Comfort 자동 모드를 영구 해제한다.
5. 따라서 **FSM이 IDLE이어도 `_session.state=PAUSED`일 수 있음** (pause 시 실행 상태 해제 → FSM IDLE, 하지만 _session은 PAUSED 유지).
6. **resume 시**:
   - `_pausedExec.valid == true` → 실행 컨텍스트 복원 → 다음 tick에서 FSM이 OVERRIDE/PROFILE_RUN 진입
   - `_session.state = ACTIVE`

### 2.5.3 세션 전이 매트릭스
```text
[IDLE/COMPLETED] ── startSession() ──► [ACTIVE]
                       │                  ▲
                 pauseSession()      resumeSession()
                 (물리정지+백업)     (백업복원+Smart Resume)
                       ▼                  │
                   [PAUSED] ──────────────┘
                       │
                  stopSession()
                  (물리정지+초기화)
                       ▼
               [IDLE/COMPLETED]
```

### 2.5.4 타임라인 예시 (PLAYLIST)
```text
t=0    : startSession(PLAYLIST) → startUserProfileByNo 위임
         _session.state=ACTIVE, runCtx.state=IDLE (다음 tick에서 PROFILE_RUN)
t=10ms : tickLoop → decideRunSource → PROFILE_RUN
         runCtx.state=PROFILE_RUN, sim.active=true
t=60s  : pauseSession() → 백업(_pausedExec) + sim.stop + overrideState 해제
         _session.state=PAUSED, runCtx.state=IDLE (다음 tick)
t=65s  : resumeSession() → 백업 복원 + Smart Resume (<5min: phaseStart 시프트)
         _session.state=ACTIVE, runCtx.state=IDLE (다음 tick)
t=65ms : tickLoop → decideRunSource → PROFILE_RUN
         runCtx.state=PROFILE_RUN, sim.active=true, phaseStart 재개
```

### 2.5.5 금지 패턴
- ❌ `decideRunSource`에서 `_session.state` 조건 분기
- ❌ `_session.state == ACTIVE`일 때 `overrideState.active` 자동 설정 (이미 위임 시점에 설정됨)
- ❌ `_session` 직접 쓰기 (반드시 startSession/pauseSession 경유)

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

## 3.1 M10 모션 감지 상태 (C-3 반영)

| 필드 | Writer | 판정 규약 |
|---|---|---|
| `_pir.lastDetected_ms` | `notifyPIRDetected()` (감지 시점) | - |
| `_pir.active` | `notifyPIRDetected()` (true), `tick()` (holdSec 경과 시 false) | - |
| `_state.pirActive` | `tick()` (상태 변경 시) | - |
| `_state.lastChange_ms` | `tick()` (상태 변경 시) | - |

**`isActive()` 판정 규약 (C-3)**:
- **단일 조건**: `return _state.pirActive;`
- **금지**: `_state.lastChange_ms` 기준 `holdSec` 재계산 (2×hold 버그)
- **근거**: `tick()`이 이미 `holdSec` 경과 시 `pirActive=false` 전환. `isActive()`는 상태 조회만.

**타임라인 (holdSec=120, 정상)**:
```
t=0     : PIR 감지 → pirActive=true,  lastDetected=0
t=120s  : tick() → pirActive=false,   lastChange=120s
t=120s+ : isActive()==false (단일 판정) ✓
```

**타임라인 (이전 버그)**:
```
t=120s  : pirActive=false, lastChange=120s
t=120s+ : isActive()==true (lastChange 기준 120s 미경과) ← 2×버그
t=240s  : isActive()==false
```

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

### 6.4 Session Pause/Resume/Stop 위임 라이프사이클

#### 6.4.1 Pause (T-async, `s_stateMutex` 보유)
```text
pauseSession()
  ├─ ① 검증: _session.type != NONE, _session.state == ACTIVE
  ├─ ② 백업 (_pausedExec):
  │     valid=true, runSource, profileIndex, override, profileSegRt, autoOffRt
  ├─ ③ 물리 정지: sim.stop() + pwm 0%
  ├─ ④ 실행 상태 해제:
  │     overrideState = 0, runSource = NONE, curProfileIndex = -1, profileSegRt.index = -1
  │     (→ 다음 tick에서 decideRunSource = IDLE)
  ├─ ⑤ 세션 상태: _session.state = PAUSED, pausedAtMs = millis()
  └─ ⑥ Dirty: state/metrics
```

#### 6.4.2 Resume (T-async, `s_stateMutex` 보유)
```text
resumeSession()
  ├─ ① 검증: _session.state == PAUSED, _pausedExec.valid == true
  ├─ ② 일시정지 시간 계산: pauseDuration = millis() - pausedAtMs
  ├─ ③ 백업 복원: runSource, curProfileIndex, overrideState, profileSegRt, autoOffRt
  ├─ ④ Smart Resume (PLAYLIST만):
  │     ├─ > 30분 (S_PAUSE_STEP_RESET_MS):  step=1, phaseStart=millis()
  │     ├─ 5~30분 (S_PAUSE_CONTINUE_MS):    phaseStart=millis() (step 유지)
  │     └─ < 5분:                            phaseStart += pauseDuration (연속 재개)
  ├─ ⑤ 세션 상태: _session.state = ACTIVE, _pausedExec.valid = false
  └─ ⑥ Dirty: state
```

#### 6.4.3 Stop (T-async, `s_stateMutex` 보유)
```text
stopSession()
  ├─ ① 멱등 확인: 이미 모든 상태가 NONE/IDLE이면 return false (no-op)
  ├─ ② 물리 정지: sim.stop() + pwm 0%
  ├─ ③ 위임 경로 정리 (재귀 mutex):
  │     ├─ overrideState.active → stopOverride()
  │     └─ runSource == USER_PROFILE → stopUserProfile()
  ├─ ④ 실행 상태 전체 리셋
  ├─ ⑤ 세션 리셋: _session = 0, _session.type = NONE
  ├─ ⑥ NVS 해제: setManualSession(0, false) + setManualOvrSchedule(false)
  └─ ⑦ Monitor 로그 + Dirty: state/metrics/summary
```

**Safe Resume 정책 (S-2)**:

| 일시정지 시간 | 정책 | 재개 시점 |
|---|---|---|
| `< 5분` | 연속 재개 | phaseStart 시프트 (일시정지 시간만큼) |
| `5~30분` | Step 유지, phase 재시작 | Step은 유지, 현재 Step 처음부터 |
| `> 30분` | Step 1 리셋 | Step 1 처음부터 |

---

## 7. AutoOff 래치 및 이벤트 상태

### 7.1 래치 해제 경로

`_autoOffLatched = false` 설정 위치 (모두 `s_stateMutex` 하):
1. `ackEventState()` — 사용자 ACK (`POST /api/v001/control/ack`, UI 모달 확인 버튼)
2. `setProfileMode()` — 모드 변경 (`POST /api/v001/control/mode`)
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
| `CT10_Ctl_Ctl_0203.cpp` | `_pendingMotionSimApply`, static wrapper | - |
| `CT10_Ctl_Ctl_Seg_0203.cpp` | `scheduleSegRt`, `profileSegRt`, `runCtx.activeSeg*` | - |
| `CT10_Ctl_Ctl_Ovr_0203.cpp` | `overrideState` | - |
| `CT10_Ctl_Ctl_Mode_0203.cpp` | `useProfileMode`, `curProfileIndex` | - |
| `CT10_Ctl_StMG_0203.cpp` | `runCtx` (decide/apply) | - |
| `CT10_Ctl_IOWS_0203.cpp` | `_dirty*`, `s_lastReloadOk`, WS static doc | - |
| `C10_Config_Sch_*` | 스케줄 CRUD | `G_C10_SCH_*` (Internal 헤더, **F-10**) |
| `C10_Config_UzProf_*` | 프로파일 CRUD | `G_C10_PROFILE_*` (Internal 헤더, **F-10**) |
| `C10_Config_WindDc_*` | 프리셋 CRUD | - |
| `TM10_TimeMg_0203.cpp` | SNTP 상태 | (모두 헤더 inline static) |
| `CT10_Ctl_AIPrompt_0203.cpp` | `s_promptCache`, `s_promptCacheValidUntil` (30초 캐시) | - |
| `CT10_Ctl_AIAction_0203.cpp` | 13개 안전 도구 디스패처 (set_timer 포함, CT10 공개 함수 위임) | - |
| `W10_Web_Routes_AILive_0203.cpp` | Live 토큰 / 30분 상한 판정 및 일일 비용 라우팅 핸들러 | - |

> **F-10 계약**: 분할 .cpp 간 공유 매크로는 `*_Internal_0203.h` 승격 필수. 파일 스코프 정의 금지.

---

## 9. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-11-10** | **v3.6** | **웹 UI/UX 클라이언트 상태 관리 및 히스토리/스튜디오 격리 규정 (b3d06c2)**: 모니터 '히스토리' 탭의 타임라인 레인 분기(lane 0/1) 순수 뷰 상태 격리, Wind Studio 진입 시 바텀바 뷰 상태와 AI FAB 토글 상태 무결성 확인, `SNW.CFG.LS_KEY` 내 AI 키 통합에 따른 단일 클라이언트 상태 소유권 보장 | Antigravity AI |
| **2026-11-09** | **v3.5** | **Stage 10.1 결함 패치 및 하드웨어 백엔드 타이머 구현 (0203_013_20_02)**: `runtimeAutoOff` 백엔드 소유권 확장, `EN_CT10_TRIGGER_AUTO_COMFORT=3` 세션 트리거 추가, 타이머 만료 시 정지 사유 9번(AUTOOFF_TIMER) 및 `setAutoComfort(false)` 부수효과 명세, 13개 안전 도구 현행화 | Antigravity AI |
| **2026-11-09** | **v3.4** | **Stage 10 IA 재설계 및 Comfort 자동 모드 (0203_013)**: §1 `s_autoComfortEnabled` NVS 소유권 및 접근 매트릭스 명세 반영 | Antigravity AI |
| **2026-11-09** | **v3.3** | **AI 빠른 참조 §링크 강화 (Phase B)**: TOC anchor 기반 [§N.M](#anchor) 자동 변환, src/v0203/tools_0203/enhance_index_links_0203.py 추가, --verify로 anchor 유효성 검증 | Antigravity AI |
| **2026-11-08** | **v3.2** | **통합 감사 28대 이슈 해결 상태 정합성 반영 (0203_012)**: 오프라인 FSM 종료 이유 'POWER_OFF' ➔ 'NONE' C++ SSOT 일치, `ST_A20_ScheduleSegment_t` 독립 구조체 유지로 오버로드 충돌 방지, `_persistOffTimeLastYday` 리셋 무결성 보장, `C10_Config_Sch_Internal_0203.h` 안전 인라인 브릿지 명세 | Antigravity AI |
| **2026-11-06** | **v3.1** | **Stage 8 AI 제어 및 Live 음성 상태 소유권 반영**: §1 3행 확장(`s_aiDailyUsage`, `s_promptCache`, `runtimeAutoOff`), §8 분할 소유권에 AI 프롬프트/액션/라우트 모듈 3종 추가, 자정 리셋 및 30분 상한 상태 수명주기 명시 | Antigravity AI |
| **2026-11-05** | **v3.0** | **Phase 1~6 통합 (v0203_011) — Session 위임 엔진 반영**: §1 5행 확장 (`_session`, `_pausedExec`, `profileName`, `currentStepStartMs`, `runCtx.state` vs `_session.state`), §2.5 신규 (Session FSM ↔ runCtx FSM 관계, ADR-1), §6.4 신규 (Pause/Resume/Stop 위임 라이프사이클, Smart Resume). | Antigravity AI |
| 2026-10-27 | v2.5 | Batch H 웹 UI 고도화/오프라인 로더 동기화 상태 무결성 확인 (C++ FSM 변경 없음) | Antigravity AI |
| 2026-10-26 | v2.4 | **Batch G — §1 M10 `_state.pirActive` 판정 규약 명시, §3.1 신규 (C-3 타임라인)** | Antigravity AI |
| 2026-10-21 | v2.3 | AutoOff 래치 해제 엔드포인트 `/control/ack` (`HTTP_API_CTL_ACK`) 명시 및 현행화 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §1 `_dirty*`/`s_staConnected` atomic 명시, §2.4 F-5 profile fall-through, §3 S10 상수, §4 WF10 C-7/C-8/D-4, §6.3 D-1 배치, §7 AutoOff, §8 E-2 분할 상태 소유권 신규 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1, G-2/G-4, N-3 현행화 | Antigravity AI |
| 2026-10-19 | v2.0 | v0203 승격 + (v1.2의 번들 상태 규격 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | `_0203` 상태 규격 동기화 | Antigravity AI |
| 2026-10-19 | v1.1 | Enum/변수명 동기화, `_persistOffTimeLastYday` 추가 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 상태 명세 | 개발팀 |
