# STATE_0200.md — 상태 소유권 및 FSM 명세

> **단일 기록자 원칙 (Single-Writer Principle)**: 각 런타임 상태 변수는 원칙적으로 단 하나의 태스크(컨텍스트)만 쓰기 권한을 가진다.  
> 다중 태스크 쓰기가 불가피한 경우 전용 뮤텍스 또는 `std::atomic` 원자적 연산으로 완벽히 격리한다.  
> F-01~F-10, I-1~I-5 반영 완료.

---

## 1. 상태 변수 소유권 및 접근 매트릭스

| 상태 변수 / 객체 | 단독 기록자 (Writer) | 허용된 조회자 (Reader) | 동시성 보호 기제 | 비고 |
|---|---|---|---|---|
| 2026-10-19 | v2.0 | v0200 승격: 소스/문서/에셋 전체 접미사 _0200 단일화 및 LittleFS/main.cpp 빌드 전환 | Antigravity AI |
| `runCtx` (`CL_CT10_ControlManager`) | T-loop (`CT10::tickLoop`) | T-async (`exportStateJson_v02`), T-loop | `CT10::s_stateMutex` (100ms) | 제어 상태(FSM) 및 이유, 홀드 시간 |
| `overrideState` | T-loop, T-async (`startOverride*`) | T-loop (`tickOverride`, `decideRunSource`) | `CT10::s_stateMutex` | 수동/오버라이드 풍속 및 잔여시간 |
| `autoOffRt` | T-loop (`CT10::tickLoop`) | T-loop | `CT10::s_stateMutex` | 타이머/시간/온도 자동종료 런타임 |
| `scheduleSegRt` / `profileSegRt` | T-loop (`tickSegmentSequence`) | T-loop | `CT10::s_stateMutex` | 세그먼트 스텝 번호 및 경과 시간 |
| `_persistOffTimeLastYday` | T-loop (`reloadAll`에서만 리셋) | T-loop (`checkAutoOff`) | `CT10::s_stateMutex` | offTime 당일 중복 트리거 방지 (yday) |
| `_autoOffLatched` | T-loop (AutoOff 발동 시 `true`), T-async (`ackEvent` 등 해제 시 `false`) | T-loop (`decideRunSource`) | `CT10::s_stateMutex` | 사용자 확인 전 자동 재시작 방지 래치 |
| `_pendingMotionSimApply` | T-async (`requestMotionSimApply`) | T-loop (`tickLoop` 최상단) | `std::atomic<bool>` | [F-06] 비동기 모션 패치 위임 플래그 |
| `s_pendingReload` | T-async (`requestReload` CAS) | T-loop (`consumePendingReload` exchange), 모든 태스크 (`isReloadPending`) | `std::atomic<bool>` | [F-05, I-1] 설정 재로드 위임 플래그 |
| `sim.*` (`CL_S10_Simulation`) | T-loop (`CT10::tickLoop`), T-async (`patchFromJson`) | T-async (`toJson`, `toChartJson`) | `S10::_recursiveMutex` (100ms) | 풍속, 위상, 난류, 돌풍, 열기포 |
| `_pir`, `_state` (`CL_M10_MotionLogic`)| T-async (`notifyPIRDetected`), T-loop (`tick`) | T-loop (`isActive`, `toJson`) | `M10::s_stateMutex` (100ms) | [F-03] PIR 감지 타임스탬프 및 상태 |
| `s_state` (`CL_N10_NvsManager`) | T-loop (CT10 setter / `tick` flush) | T-async (`getState`, `toJson`) | `N10::s_mutex` (100ms) | NVS 비휘발성 저장 런타임 데이터 |
| `s_dirty.runtime` (`CL_N10_NvsManager`) | T-loop (CT10 setter 호출 시 `true`) | T-loop (`tick` flush 시 `false`) | `N10::s_mutex` | [F-04] 10초 주기 플러시 트리거 |
| `s_staConnected` (`CL_WF10_WiFiManager`)| T-sys_evt (이벤트 콜백), T-wf (`startSTA`) | T-loop (`A00_run` LED), T-async | `WF10::s_wifiMutex` (10ms) | Wi-Fi STA 모드 연결 플래그 |
| `s_timeValid`, `s_wifiUp` (`CL_TM10_TimeManager`)| T-sys_evt, T-wf, T-loop (`tick`) | 모든 태스크 (`isTimeValid`) | `TM10::s_mutex` | [F-01] NTP 시간 동기화 완료 여부 |
| `g_A20_config_root` (8개 포인터) | T-loop (`reloadAll` 스왑) | 모든 태스크 (`getRootSnapshot`) | `s_rootSwapMux` (Spinlock) | LittleFS 설정 루트 포인터 구조체 |

---

## 2. CT10 메인 제어 상태머신 (7-State FSM)

`CL_CT10_ControlManager`는 단일화된 상태 판정 엔진인 `decideRunSource()`를 통해 현재 시스템의 제어 상태를 결정한다.

### 2.1 정의된 상태 (States)
1. **`EN_CT10_STATE_IDLE`**: 대기 상태 (팬 정지)
2. **`EN_CT10_STATE_OVERRIDE`**: 사용자 수동 조작 또는 강제 풍속 실행 상태
3. **`EN_CT10_STATE_PROFILE_RUN`**: 사용자 정의 바람 프로파일 시퀀스 실행 상태
4. **`EN_CT10_STATE_SCHEDULE_RUN`**: 요일/시간 기반 스케줄 세그먼트 실행 상태
5. **`EN_CT10_STATE_MOTION_BLOCKED`**: PIR 모션 미감지(부재)로 인한 동작 일시 중지 상태
6. **`EN_CT10_STATE_AUTOOFF_STOPPED`**: 자동 종료(타이머/시간/온도) 조건 충족으로 래치된 정지 상태
7. **`EN_CT10_STATE_TIME_INVALID`**: NTP 시간 동기화 전으로 스케줄링 불가 상태

---

### 2.2 상태 전이 우선순위 (`decideRunSource`)
매 `tickLoop` 주기(40ms 스로틀)마다 다음 엄격한 우선순위 규칙에 따라 상태를 판정한다:

```text
[우선순위 1] overrideState.active == true
             └──► EN_CT10_STATE_OVERRIDE (최우선: 수동 제어가 모든 자동 제어를 압도)

[우선순위 2] _autoOffLatched == true
             └──► EN_CT10_STATE_AUTOOFF_STOPPED (사용자 재개 조작 전까지 자동 재시작 차단)

[우선순위 3] useProfileMode && profileIndex >= 0
             ├── motionBlocked == true  ──► EN_CT10_STATE_MOTION_BLOCKED
             └── motionBlocked == false ──► EN_CT10_STATE_PROFILE_RUN

[우선순위 4] !TM10::isTimeValid()
             └──► EN_CT10_STATE_TIME_INVALID (스케줄 판정 불가, 팬 정지 및 3초 홀드)

[우선순위 5] findActiveScheduleIndex() >= 0
             ├── motionBlocked == true  ──► EN_CT10_STATE_MOTION_BLOCKED
             └── motionBlocked == false ──► EN_CT10_STATE_SCHEDULE_RUN

[우선순위 6] 일치 조건 없음
             └──► EN_CT10_STATE_IDLE
```

---

### 2.3 상태 전이표 (State Transition Table)

| 이전 상태 (From) | 전이 상태 (To) | 진입 조건 (Entry Trigger) | 수반 액션 (Side Effect) | 이탈 조건 (Exit Condition) |
|---|---|---|---|---|
| 2026-10-19 | v2.0 | v0200 승격: 소스/문서/에셋 전체 접미사 _0200 단일화 및 LittleFS/main.cpp 빌드 전환 | Antigravity AI |
| Any | **OVERRIDE** | 수동 조작 API 호출 (`startOverride*`) | 기존 세그먼트 런타임 클리어, 팬 즉시 구동 | 오버라이드 시간 만료 또는 명시적 정지 |
| Any | **AUTOOFF_STOPPED**| 타이머 만료, offTime 도달, 한계온도 초과 | `sim.stop()`, `_autoOffLatched = true` | `ackEvent()`, `setMode()`, `startOverride()` |
| Any | **MOTION_BLOCKED** | 활성 스케줄/프로파일 중 `isMotionBlocked()` | `sim.stop()` | 재실 감지 회복 (F-03 M10 tick으로 갱신) |
| Any | **TIME_INVALID** | Wi-Fi/NTP 미동기 상태에서 스케줄 진입 | `sim.stop()`, 3초 최소 홀드 | NTP 동기화 완료 (`s_timeValid = true`) |
| Any | **SCHEDULE_RUN** | 활성 시간대 진입 + 재실 확인 | 스케줄 세그먼트 시퀀스 구동, PWM 반영 | 스케줄 종료 시간 도달 또는 모션 차단 |
| Any | **PROFILE_RUN** | 프로파일 모드 선택 + 재실 확인 | 프로파일 세그먼트 시퀀스 구동, PWM 반영 | 프로파일 종료 또는 수동 정지 |
| Any | **IDLE** | 모든 활성 조건 부재 | `sim.stop()` | 신규 이벤트 발생 |

> **부수효과 분리 원칙**: `applyDecision()` 함수만 실제 `runCtx.state`를 갱신하며, 각 `tickOverride()`, `tickSchedule()` 등은 결정된 상태에 따른 연산 및 하드웨어 출력만 담당한다.

---

## 3. S10 시뮬레이션 물리 엔진 상태

| 상태 필드 | 기록자 (Writer) | 전이 및 갱신 조건 |
|---|---|---|
| `active` | CT10 (`applyResolvedWind` 또는 `stop`) | 상위 CT10 FSM 상태에 종속 |
| `fanPowerEnabled` | CT10 / Web API | 전원 토글 시 |
| `phase` (CALM / NORMAL / STRONG) | `updatePhase()` | `_tickNowSec - phaseStartSec ≥ phaseDurationSec` |
| `gustActive` | `updateGust()` | 난수 및 프리셋 돌풍 발생 확률 (1/sec 주기 판정) |
| `thermalActive` | `updateThermal()` | 난수 및 열기포 발생 확률 (1/sec 주기 판정) |
| `s_chartBuffer[120]` (링버퍼) | `tick()` (`_recursiveMutex` 내) | 1Hz / 2Hz 주기로 풍속 샘플 기록 |
| `s_chartHead`, `s_chartCount` | `tick()`, `toChartJson` | 링버퍼 삽입 및 120개 상한 유지 |

**불변식 (Invariants)**:
- `currentWindSpeed ∈ [0.2 m/s, 11.0 m/s]` (물리적 한계 클램핑)
- `s_chartCount ≤ CHART_CAPACITY (= 120)`

---

## 4. WF10 Wi-Fi 연결 및 상태머신

```text
[IDLE]
  │
  ├─► (초기화) ──► [WIFI_AP_STA / WIFI_STA / WIFI_AP]
  │
  ├─► (연결 시도) ──► [CONNECTED (GOT_IP)] ──► TM10 통지 (F-01)
  │
  └─► (5회 재시도 실패) ──► [AP Fallback] ──► 복구 대기
```

- `s_staConnected`: GOT_IP 수신 시 `true`, DISCONNECTED 시 `false`.
- `s_reconnectAttempts`: 연속 실패 횟수 (최대 5회 후 지수 백오프).

---

## 5. TM10 시간 동기화 상태

- `s_timeValid`: 유효 시간(2024년 이후) 여부. `s_wifiUp == false`일 때는 SNTP를 실행하지 않음.
- `s_timeSyncedRecently`: 최근 10분(`G_TM10_SYNC_RECENT_WINDOW_MS`) 내 동기화 성공 여부.
- `s_waitingCallback`: SNTP 응답 대기 중 플래그 (15초 초과 시 다음 fallback 서버로 자동 전환).

---

## 6. 위임 플래그 라이프사이클 (F-05, F-06 상세)

### 6.1 F-05 Pending Reload 플래그
```text
T-async (async_tcp)                          T-loop (loopTask / A00_run)
─────────────────────────────────────────────────────────────────────────────
[HTTP POST /api/v001/reload]
  CL_CT10_ControlManager::requestReload()
    compare_exchange_strong(false, true)
    ├─ 실패(이미 true) ──► 409 Conflict 반환
    └─ 성공 ──────────► 202 Accepted 반환 (< 1ms)
                                             (다음 루프 시작부)
                                             consumePendingReload()
                                               exchange(false) == true
                                               ├──► reloadAll() [T-loop 실행]
                                               └──► applySystemRuntimeFromConfig()

isReloadPending() (상태 폴링)
  load(acquire) ──► true/false
```

### 6.2 F-06 Pending Motion.Sim Apply 플래그
```text
T-async (async_tcp)                          T-loop (loopTask / CT10::tickLoop)
─────────────────────────────────────────────────────────────────────────────
[HTTP POST /api/v001/motion]
  patchMotionFromJson() (메모리만 갱신)
  requestMotionSimApply()
    _pendingMotionSimApply.store(true)
  ──► 200 OK 즉시 반환 (< 5ms)
                                             (다음 제어 주기 ≤ 40ms)
                                             _pendingMotionSimApply.exchange(false) == true
                                               └──► applyMotionSimConfigToSim()
                                                    (s_stateMutex 보유 상태에서 적용)
```

---

## 7. 개정 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-19 | v2.0 | v0200 승격: 소스/문서/에셋 전체 접미사 _0200 단일화 및 LittleFS/main.cpp 빌드 전환 | Antigravity AI |
| 2026-10-19 | v1.2 | W10 정적 파일 서빙 시 `.gz` 사전 압축 탐색 및 `P010_bundle_0200.js` 번들 상태 규격 동기화 | Antigravity AI |
| 2026-10-19 | v1.1 | v0200 소스 코드 Enum 및 런타임 변수명 전면 동기화, `_persistOffTimeLastYday` 추가, 문서 링크 체계 현행화 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 상태 소유권 및 FSM 명세 작성 | 개발팀 |
