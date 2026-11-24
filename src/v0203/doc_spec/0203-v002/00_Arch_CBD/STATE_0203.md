# STATE_0203.md — 상태 머신 및 단일 쓰기 원칙 명세서

## 1. 문서 메타데이터 및 개정 이력
- **문서 ID / 명칭**: `STATE_0203` / 단일 기록자(Single-Writer) 소유권, 복합 FSM 전이 및 비동기 위임 플래그 소비 규약
- **대상 펌웨어**: Smart Nature Wind `FW_Ver_2.0.3` (`79`개 백엔드 소스 파일 기준)
- **관련 소스 파일**: `CT10_Ctl_0203.h`, `CT10_Ctl_StMG_0203.cpp`, `CT10_Ctl_Ctl_0203.cpp`, `CT10_Ctl_Basic_0203.cpp`, `C10_Config_0203.h/cpp`, `WF10_WiFiMgr_0203.h/cpp`, `TM10_TimeMg_0203.h/cpp`, `M10_MotionLogic_0203.h`, `N10_NvsManager_0203.h/cpp`, `W10_Web_Gemini_0203.cpp`, `W10_Web_Upload_0203.cpp`
- **개정 이력**:
  - `v0203.1` (2026-11-23): `v0203` 코드 기준 Single-Writer 상태 소유권 표, 7-State/Session/AI Job FSM 및 `exchange(false)` 위임 플래그 소비 순서 정립

---

## 2. 상태 변수 단일 기록자(Single-Writer) 소유권 매트릭스
데이터 경합(Data Race)과 찢어진 읽기(Torn Read)를 방지하기 위해 핵심 공유 상태 변수별 **단독 기록자(Writer)**를 1개로 고정함.

| 상태 변수 / 구조체 | 단독 기록자 (Single-Writer) | 다중 읽기 (Reader) 및 보호 수단 | 원자성 / 동기화 메커니즘 |
| :--- | :--- | :--- | :--- |
| `g_A20_config_root` (`ST_A20_ConfigRoot_t`) | `loopTask` (`CL_CT10_ControlManager::reloadAll`) | `loopTask`(화이트리스트 직접 접근), `async_tcp`/`T-sys_evt`/`T-wf`/`T-ai` (`getRootSnapshot` 스냅샷) | `s_rootSwapMux` (`portMUX_TYPE`) 포인터 스왑 + `s_pendingFree` 3초 지연 해제 |
| `runCtx` (`ST_CT10_RunContext_t`) | `loopTask` (`CL_CT10_ControlManager::applyDecision` / `onTrigger*`) | `async_tcp` (`exportStateJson_v02`, `exportMetricsJson`, `exportSummaryJson`) | `CT10::s_stateMutex` (`100ms` 타임아웃) |
| `_session` (`ST_CT10_SessionContext_t`) | `CL_CT10_ControlManager` (`startSession`, `pauseSession`, `resumeSession`, `stopSession`, `tickLoop`) | `async_tcp` (`getSessionSnapshot`, `exportStateJson_v02`), `gemini_worker` (`sessionStatusJson`) | `CT10::s_stateMutex` (`100ms` 타임아웃) |
| `s_staConnected` (`std::atomic<bool>`) | `WF10` 이벤트 핸들러(`GOT_IP`/`DISCONNECTED`) 및 `startSTA` | `loopTask` (`A00_run` → `isStaConnected()` 100Hz LED 갱신), `async_tcp` (`getWifiStateJson`) | `std::memory_order_release` / `acquire` (lock-free 판정) |
| `s_timeValid` / `s_serverList` (`TM10`) | `TM10` (`_onSntpTimeSync`, `tick`, `onWiFiConnected/Disconnected`, `applyTimeConfig`) | `loopTask` (`CT10::decideRunSource`, `getLocalTime`), `async_tcp` (`exportStateJson_v02`) | `TM10::s_mutex` (`100ms` 타임아웃) |
| `s_dhtCache` (`ST_CT10_DhtCache`) | `dht_task` (`_ct10_readDhtOnce`) | `loopTask` / `async_tcp` (`getCurrentTemperatureMock`, `getCurrentHumidityMock`) | `s_dhtMux` (`portMUX_TYPE` 스핀락) |
| `_state` / `_pir` (`M10_MotionLogic`) | `loopTask` (`M10::tick` 타이머 만료) 및 `notifyPIRDetected` (`feedPIR` 경유) | `loopTask` (`CT10::checkTriggers`), `async_tcp` (`M10::toJson`, `exportStateJson_v02`) | `M10::s_stateMutex` (`100ms` 재귀 뮤텍스) |
| `s_aiJob` (`ST_W10_AiJobSlot_t`) | `async_tcp`(접수 `RUNNING`), `gemini_worker`(완료 `DONE`/`ERROR`), 폴링(`IDLE` 만료) | `async_tcp` (`GET /api/v001/ai/gemini?jobId=...`), `gemini_worker` (`W10_processSingleAiJob`) | `s_aiJobMutex` (`100ms` 타임아웃) |
| `s_uploadOwner` (`W10_Upload`) | `async_tcp` (`routeUpload` / `routeUpdate` `p_index==0` 및 `onDisconnect`/완료 핸들러) | `async_tcp` (동시 요청 시 `G_W10_UPLOAD_BUSY_TAG` 비교) | 단일 세션 소유권 포인터 + `onDisconnect` 자동 해제 |

---

## 3. 복합 상태 머신(FSM) 명세

### 3.1 제어 상태 머신 (`EN_CT10_state_t`) 전이 및 부수효과 (`CT10_Ctl_StMG_0203.cpp`, `CT10_Ctl_Basic_0203.cpp`)
| 상태 (`EN_CT10_state_t`) | 진입 조건 (Entry) | 이탈 / 복귀 조건 (Exit / Transition) | 전이 시 부수효과 (Action) |
| :--- | :--- | :--- | :--- |
| `EN_CT10_STATE_AUTOOFF_STOPPED` (`5`) | `_autoOffLatched == true` 또는 `checkTriggers()`에서 Stop 조건(`timer`, `offTime`, `tempLow[STOP]`, `diLow[STOP]`) 성립 | `ackEvent()` 호출, 모드/세션 시작, 또는 수동 오버라이드 입력 시 해제 | `sim.stop()`, PWM `0%`, `_autoOffLatched = true`, `stateHoldUntilMs = now + 3000ms` |
| `EN_CT10_STATE_ENV_PAUSED` (`7`) | 실행 중 `checkTriggers()`에서 `pauseMask != 0` (`MOTION`, `TEMP_LOW`, `DI_LOW`) 감지 | `pauseMask == 0` 회복 시 이전 활성 상태 자동 복귀; 수동 `resumeSession()` 시 `pauseBypassUntilMs = now + 3,600,000ms`(1시간) 부여 | `sim.stop()`, `pauseStartedMs = now` 기록하여 타이머 일시정지 시간 누적 보정 |
| `EN_CT10_STATE_OVERRIDE` (`1`) | `overrideState.active == true` (고정 PWM 또는 프리셋/세션 오버라이드) | `endMs` 타임아웃 도달, `stopOverride()`, 또는 `stopSession()` | `useFixed ? pwm->setDutyPercent() : sim.applyResolvedWind()` 및 `sim.tick()` |
| `EN_CT10_STATE_PROFILE_RUN` (`2`) | `runSource == EN_CT10_RUN_USER_PROFILE` 및 `curProfileIndex >= 0` | 프로필 반복 종료, `stopUserProfile()`, `stopSession()`, 또는 우선순위 상위 상태 진입 | `tickUserProfile()` 스텝 순환(`PRESET`/`FIXED`/`REST`) 및 `sim.tick()` |
| `EN_CT10_STATE_TIME_INVALID` (`6`) | `!useProfileMode`이고 `!CL_TM10_TimeManager::isTimeValid()` | SNTP 동기화 성공(`isTimeValid() == true`) 또는 프로필/수동 모드 전환 | `sim.stop()`, `stateHoldUntilMs = now + 3000ms`, `activeSegId/No = 0` |
| `EN_CT10_STATE_SCHEDULE_RUN` (`3`) | 시간 유효 상태에서 `findActiveScheduleIndex()`가 활성 스케줄 인덱스(`>= 0`) 반환 | 스케줄 시간 창 종료 또는 수동 세션/오버라이드 개입 | `tickSchedule()`(참조 `profileId` 실행) 및 `sim.tick()` |
| `EN_CT10_STATE_IDLE` (`0`) | 활성 오버라이드·프로필·스케줄 없음 (또는 `useProfileMode`에서 프로필 미선택) | 스케줄 진입, 수동 세션/오버라이드 시작, 또는 `AutoComfort` 활성화 시 전환 | `sim.stop()`, PWM `0%`, `runSource = EN_CT10_RUN_NONE` |

### 3.2 세션 FSM (`EN_SESSION_runtime_t`) 및 Smart Resume 전이 (`CT10_Ctl_Ctl_0203.cpp`)
- **`EN_SESSION_ACTIVE` (`0`) ↔ `EN_SESSION_PAUSED` (`1`) → `EN_SESSION_COMPLETED` (`2`)**:
  - `pauseSession()` 진입 시 `_pausedExec` 구조체에 `runSource`, `profileIndex`, `overrideState`, `profileSegRt`, `triggerRt` 스냅샷을 백업하고 `sim.stop()` 및 PWM `0%`를 적용함.
  - `resumeSession()` 실행 시 정지 경과 시간(`v_pauseDuration = millis() - pausedAtMs`)에 따라:
    - `<= 300,000ms` (5분 이하): `phaseStartMs += v_pauseDuration` (연속 재개)

