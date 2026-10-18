# STATE.md — 상태 소유권 및 FSM 명세

> 단일 기록자 원칙(Single-Writer). 다중 writer는 뮤텍스로 격리 명시.

## 1. 상태 변수 소유권 매트릭스
| 변수 | Writer (단독) | Reader (허용) | 보호 |
|---|---|---|---|
| `runCtx` (CT10) | T-loop (CT10::tickLoop) | T-async (export) | `CT10::s_stateMutex` |
| `overrideState` | T-loop / T-async(start) | T-loop | `s_stateMutex` |
| `autoOffRt` | T-loop | T-loop | `s_stateMutex` |
| `scheduleSegRt` / `profileSegRt` | T-loop | T-loop | `s_stateMutex` |
| `_autoOffLatched` | T-loop / ack | T-loop | `s_stateMutex` |
| `sim.*` (S10) | T-loop (CT10 tick) | T-async (`patchFromJson`) | `S10::_recursiveMutex` |
| `_pir`, `_state` (M10) | T-async(`notifyPIR`) / T-loop(`tick`) | T-loop | `M10::s_stateMutex` (tick 미호출 GAP) |
| `s_state` (N10) | T-loop(CT10 setter) | T-async(getter) | `N10::s_mutex` |
| `s_staConnected` (WF10) | T-sys_evt / T-wf | T-loop(LED) | `WF10::s_wifiMutex` (10ms) |
| `s_timeValid`, `s_wifiUp` (TM10) | T-sys_evt / T-loop(tick) | 모든 태스크 | `TM10::s_mutex` |
| `g_A20_config_root` (8 ptr) | CT10::reloadAll | `getRootSnapshot()` | `s_rootSwapMux` + `s_stateMutex` |

## 2. CT10 제어 상태머신 (메인 FSM)

**States**: IDLE / OVERRIDE / PROFILE_RUN / SCHEDULE_RUN / MOTION_BLOCKED / AUTOOFF_STOPPED / TIME_INVALID

**전이 우선순위 (`decideRunSource`)**
1. `overrideState.active` → OVERRIDE
2. `_autoOffLatched` → AUTOOFF_STOPPED
3. `useProfileMode && profile` → PROFILE_RUN (또는 MOTION_BLOCKED)
4. `runSource==USER_PROFILE` → PROFILE_RUN (또는 MOTION_BLOCKED)
5. `!timeValid` → TIME_INVALID
6. `findActiveScheduleIndex>0` → SCHEDULE_RUN (또는 MOTION_BLOCKED)
7. 그 외 → IDLE

**전이표 (요약)**
| From → To | 진입 조건 | 액션 | 이탈 |
|---|---|---|---|
| * → OVERRIDE | `overrideState.active` | 이전 hold/ack 클리어 | timeout/stopOverride |
| * → AUTOOFF_STOPPED | `_autoOffLatched` | sim.stop | ack/setMode/startOverride |
| * → MOTION_BLOCKED | `isMotionBlocked()` true | sim.stop | 센서 presence 회복 |
| * → TIME_INVALID | `!TM10::isTimeValid()` | sim.stop + hold 3s | 시간 복구 |
| * → SCHEDULE_RUN | 활성 스케줄 존재 | 세그먼트 시퀀스 | 스케줄 종료 |
| * → PROFILE_RUN | 활성 프로파일 | 세그먼트 시퀀스 | 세그먼트 종료 |

**부수효과 원칙**: `applyDecision()`만 상태를 씀. `tickOverride/tickSchedule/tickUserProfile`은 실행만.

## 3. S10 시뮬레이션 상태
| 상태 | Writer | 전이 조건 |
|---|---|---|
| `active` | CT10 (applyResolvedWind/stop) | CT10 상태 종속 |
| `phase` (CALM/NORMAL/STRONG) | `updatePhase()` | `_tickNowSec - phaseStartSec ≥ phaseDurationSec` |
| `gustActive` | `updateGust()` | rate 기반 확률 (1/sec) |
| `thermalActive` | `updateThermal()` | rate 기반 확률 (1/sec) |
| `s_chartBuffer[120]` ring | `tick()` (락 내) | 1Hz/2Hz 샘플링 |
| `s_chartHead/Count` | `tick()`/`toChartJson` (락 내) | - |

**핵심 불변식**
- `phaseMinWind ≤ targetWindSpeed ≤ phaseMaxWind`
- `minFanPct ≤ fanLimitPct`
- `currentWindSpeed ∈ [0.2, 11.0]`
- `s_chartCount ≤ CHART_CAPACITY(=120)`

## 4. WF10 연결 상태
| 필드 | Writer | 보호 |
|---|---|---|
| `s_staConnected` | GOT_IP / DISCONN 콜백, startSTA | `s_wifiMutex` (일부 stale read 허용) |
| `s_lastStaStatus` | 동일 | 동일 |
| `s_reconnectAttempts` | DISCONN 콜백 (5회 리밋) | 동일 |

**연결 상태 전이**
IDLE → (init/applyConfig) → WIFI_AP or WIFI_STA or WIFI_AP_STA → CONNECTED | FAILED(→AP fallback)

## 5. TM10 시간 상태
| 플래그 | Writer | 의미 |
|---|---|---|
| `s_timeValid` | SNTP 콜백 / `getLocalTime()` | sane check 통과 여부 |
| `s_timeSyncedRecently` | `_updateSyncedRecently` (tick) | 최근 10분 내 sync |
| `s_wifiUp` | onWiFiConnected/Disconnected | SNTP 허용 게이트 |
| `s_waitingCallback` | `_startSntpWithServer` / 콜백 | 콜백 대기중 |
| `s_activeServerIdx` | `_switchToNextServer` | fallback 인덱스 |

**핵심 불변식**: `s_wifiUp == false` ⇒ SNTP 미실행 + sync 요청 무시.
**GAP-F01**: GOT_IP 콜백 누락 → `s_wifiUp=false` 영구화 (§7 참조).

## 6. 위임 플래그 / 큐 라이프사이클
| 이름 | Set | Read+Clear | Execute |
|---|---|---|---|
| `_dirtyState/Metrics/Chart/Summary` | `markDirty()` | `consumeDirty*()` (mutex) | `CT10_WS_tick` → W10 브로드캐스트 |
| `s_pendingFree[2]` | `queuePendingFree` | `processPendingFree` (portMUX) | `freeAll` (loopTask) |
| `s_dirty.runtime` (N10) | `set*` | `flushIfNeeded` | 호출자 부재 (F-04) |
| `_autoOffLatched` | `onAutoOffTriggered` | `ackEvent`/`setMode`/`startOverride` | `decideRunSource` |

## 7. 관측된 상태 계약 위반
| ID | 대상 | 내용 | 완화책 |
|---|---|---|---|
| F-03 | M10 `_state` | tick 미호출 → `lastChange_ms` 0 고정 → 부팅 후 `holdSec` 초과 시 `isActive()` 오작동 | A00_run()에 M10 tick 추가 |
| F-04 | N10 `s_dirty` | flush 미호출 → reboot 시 런타임 정보 유실 | A00_run()에 N10 tick 추가 |
| F-09 | M10 `isActive()` 부팅 직후 | `(millis() - 0) < holdSec*1000` → 부팅 후 holdSec 동안 false-positive | F-03 해결 시 자연 해소 |


