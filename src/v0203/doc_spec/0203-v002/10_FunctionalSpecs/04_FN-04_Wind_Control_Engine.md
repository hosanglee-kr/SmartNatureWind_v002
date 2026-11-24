# FN-04. 바람 제어 엔진 및 상태 머신 기능 명세서

> 📑 [FN-00. 마스터 인덱스로 돌아가기](./00_FN_Master_Index.md)

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-04` / 바람 제어 엔진 및 상태 머신 (`Wind Control Engine & FSM`)
- **관련 소스 파일**:
  - 헤더/공통: `CT10_Ctl_0203.h`, `P10_PWM_ctrl_0203.h`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)
  - 코어/세션/루프: `CT10_Ctl_Ctl_0203.cpp`[span_2](start_span)[span_2](end_span)
  - 상태머신/트리거: `CT10_Ctl_StMG_0203.cpp`, `CT10_Ctl_Basic_0203.cpp`[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)
  - 모드/오버라이드/세그먼트: `CT10_Ctl_Ctl_Mode_0203.cpp`, `CT10_Ctl_Ctl_Ovr_0203.cpp`, `CT10_Ctl_Ctl_Seg_0203.cpp`[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)
  - 쾌적도/WS 동기화: `CT10_Ctl_Comfort_0203.cpp`, `CT10_Ctl_IOWS_0203.cpp`[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span)
- **실행 컨텍스트**:
  - 제어 루프: `loopTask` (`A00_run` → `CL_CT10_ControlManager::tick()` → `tickLoop()`), 최소 호출 주기 `40ms` (`S_TICK_MIN_INTERVAL_MS = 40UL`)[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
  - 센서 폴링: `dht_task` (FreeRTOS Task, Core 1, Stack `3072B`, Prio `1`, 기본 주기 `30s` / 최소 `2s`)[span_13](start_span)[span_13](end_span)
  - 외부 명령 진입: `async_tcp` (REST/WS 핸들러 → `s_stateMutex` 경유 위임)[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)
- **선행 조건 (Pre-condition)**:
  - `CL_C10_ConfigManager::loadAll()` 및 `CL_N10_NvsManager::begin()` 완료[span_16](start_span)[span_16](end_span)
  - `g_P10_pwm.begin(*g_A20_config_root.system)` 및 `CL_CT10_ControlManager::begin()` 초기화 완료[span_17](start_span)[span_17](end_span)
  - 스케줄 기반 자동 운전 시 `CL_TM10_TimeManager::isTimeValid() == true` 충족[span_18](start_span)[span_18](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- 수동 세션(플레이리스트/프리셋/고정 PWM/완전자동/선택자동), 수동 오버라이드, 사용자 프로필, 주간 스케줄, 환경 트리거(온도·불쾌지수·PIR·타이머), 쾌적도 자동 보정(`Auto-Comfort`) 간의 **실행 우선순위를 단일 상태 머신(7-State FSM)으로 중재**하고, 산출된 목표 풍속을 **3구간 비선형 팬 커브 보정을 거쳐 25kHz 하드웨어 PWM으로 출력**함[span_19](start_span)[span_19](end_span)[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span).

### 2.2 세부 기능 분할 (`FN-04-01` ~ `FN-04-08`)
- **`FN-04-01` 제어 모드 전환 및 우선순위 중재 (`Mode` / `StMG`)**: 스케줄 모드(`SCHEDULE`)와 사용자 프로필 모드(`PROFILE`) 전환 및 9단계 우선순위 판정(`decideRunSource`)[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span)
- **`FN-04-02` 통합 세션 생명주기 및 Smart Resume (`Ctl`)**: `PLAYLIST`/`PRESET`/`FIXED`/`AUTO_FULL`/`AUTO_SELECT` 세션 실행 및 일시정지 경과 시간별(5분/30분) 스마트 재개[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span)
- **`FN-04-03` 수동 오버라이드 제어 (`Ovr`)**: 고정 듀티(`startOverrideFixed`) 및 자연풍 프리셋(`startOverridePreset`) 임시 덮어쓰기(기본 `1200초` 또는 `forever`)[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span)
- **`FN-04-04` 8스텝 세그먼트 시퀀스 실행 (`Seg`)**: `PRESET` / `FIXED` / `REST` 타입별 스텝 전환, 반복(`repeatSegments`, `repeatCount`), `onMinutes`/`offMinutes` 타이머 및 self-heal 복구[span_30](start_span)[span_30](end_span)[span_31](start_span)[span_31](end_span)
- **`FN-04-05` 통합 환경 트리거 검사 (`Basic`)**: `STOP`(타이머·종료시각·저온·저DI) 및 `PAUSE`(PIR 부재·저온·저DI 히스테리시스) 이원화 판정[span_32](start_span)[span_32](end_span)
- **`FN-04-06` 불쾌지수(DI) 산출 및 Auto-Comfort (`Comfort`)**: 일본 기상청 DI 수식 기반 4단계 쾌적도 판정 및 5분(`300,000ms`) 주기 자동 프리셋/스타일 전환[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span)
- **`FN-04-07` 25kHz 하드웨어 PWM 출력 및 커브 보정 (`P10`)**: 3구간 비선형 커브(`startPercentMin`, `comfortPercentMin/Max`, `hardPercentMax`) 적용 및 LEDC 듀티 출력[span_35](start_span)[span_35](end_span)[span_36](start_span)[span_36](end_span)
- **`FN-04-08` 제어-웹 Dirty-Flag 실시간 동기화 (`IOWS`)**: 원자적 Dirty 플래그(`consumeAllDirty`) 기반 4대 WS 채널 우선순위 전송 및 대형 차트 스로틀링[span_37](start_span)[span_37](end_span)

### 2.3 핵심 연산 수식 및 비즈니스 규칙
1. **일본 기상청 표준 불쾌지수(DI) 산출식 (`getDiscomfortIndex`)**[span_38](start_span)[span_38](end_span):
   $$DI = 0.81 \cdot T + 0.01 \cdot H \cdot (0.99 \cdot T - 14.3) + 46.3$$
   - 센서 이상치 클램핑: $T \in [-20.0, 60.0]^\circ\text{C}$ (`NaN` 시 `24.0`), $H \in [0.0, 100.0]\%$ (`NaN` 시 `50.0`), 최종 $DI \in [0.0, 100.0]$[span_39](start_span)[span_39](end_span)
   - 4단계 쾌적도 매핑 (`getComfortLevel` → 추천 조합)[span_40](start_span)[span_40](end_span):
     - Level `0` ($DI < 68.0$, 쾌적): `FOREST_CANOPY` + `RELAX`[span_41](start_span)[span_41](end_span)
     - Level `1` ($68.0 \le DI < 75.0$, 약간 덥네요): `COUNTRY_BREEZE` + `BALANCE`[span_42](start_span)[span_42](end_span)[span_43](start_span)[span_43](end_span)
     - Level `2` ($75.0 \le DI < 80.0$, 끈적이는 날씨): `OCEAN` + `ACTIVE`[span_44](start_span)[span_44](end_span)[span_45](start_span)[span_45](end_span)
     - Level `3` ($DI \ge 80.0$, 숨이 막혀요): `MOUNTAIN` + `ACTIVE`[span_46](start_span)[span_46](end_span)[span_47](start_span)[span_47](end_span)
2. **3구간 비선형 팬 PWM 커브 보정 (`CL_P10_PWM::applyFanConfigCurve`)**[span_48](start_span)[span_48](end_span):
   - 입력 요청 비율 $r \in [0.0, 1.0]$ (`r <= 0.0001f`이면 즉시 `0.0f` 반환)[span_49](start_span)[span_49](end_span)
   - 설정 정규화: $s = \text{startPercentMin}/100$ (`0.10`), $c_2 = \text{comfortPercentMax}/100$ (`0.80`), $h = \text{hardPercentMax}/100$ (`0.95`)[span_50](start_span)[span_50](end_span)[span_51](start_span)[span_51](end_span)
   - 분할 구간 매핑 (`SPLIT1 = 0.33f`, `SPLIT2 = 0.66f`)[span_52](start_span)[span_52](end_span):
     - $0 < r < 0.33$: $\text{out} = s \cdot \left(\frac{r}{0.33}\right)$ (기동 토크 확보 구간)[span_53](start_span)[span_53](end_span)
     - $0.33 \le r < 0.66$: $\text{out} = s + (c_2 - s) \cdot \left(\frac{r - 0.33}{0.33}\right)$ (쾌적 제어 주력 구간)[span_54](start_span)[span_54](end_span)
     - $0.66 \le r \le 1.0$: $\text{out} = c_2 + (h - c_2) \cdot \left(\frac{r - 0.66}{0.34}\right)$ (고출력 상한 구간)[span_55](start_span)[span_55](end_span)
   - 최종 출력은 $[v_{\min}, v_{\max}]$로 클램핑 후 `uint32_t raw = (uint32_t)(ratio * maxDuty + 0.5f)`로 LEDC 레지스터에 기록[span_56](start_span)[span_56](end_span).
3. **일시정지 누적 시간 보정 타이머 계산 (`getSessionAutoOffRemainSec`)**[span_57](start_span)[span_57](end_span):
   - `livePausedMs = pausedAccumMs + (pauseStartedMs ? (now - pauseStartedMs) : 0)`[span_58](start_span)[span_58](end_span)[span_59](start_span)[span_59](end_span)
   - `netElapsedSec = (now - startMs > livePausedMs) ? (now - startMs - livePausedMs) / 1000 : 0`[span_60](start_span)[span_60](end_span)
   - 일시정지(`PAUSED` 또는 `ENV_PAUSED`) 중에는 자동 종료 카운트다운이 정지되어 실제 가동 시간만 차감함[span_61](start_span)[span_61](end_span)[span_62](start_span)[span_62](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 주요 런타임 구조체 (`CT10_Ctl_0203.h`)[span_63](start_span)[span_63](end_span)
- **`ST_CT10_RunContext_t` (중앙 제어 컨텍스트)**[span_64](start_span)[span_64](end_span):
  - `state` (`EN_CT10_state_t`), `reason` (`EN_CT10_reason_t`), `pauseReason` (`EN_CT10_pause_t`), `pauseSinceMs` (`uint32_t`)[span_65](start_span)[span_65](end_span)
  - `lastDecisionMs`, `lastStateChangeMs`, `stateHoldUntilMs`, `stateAckRequired` (`bool`)[span_66](start_span)[span_66](end_span)
  - 활성 식별자: `activeSchId`, `activeSchNo`, `activeSegId`, `activeSegNo`, `activeProfileNo`[span_67](start_span)[span_67](end_span)
  - 대기 스케줄 정보(Stage 5): `pendingScheduleActive`, `pendingSchId`, `pendingSchNo`, `pendingSchName[32]`, `pendingSchStart[8]`, `pendingProfileNo`, `pendingRemainMin`, `manualOverrideSchedule`[span_68](start_span)[span_68](end_span)
- **`ST_CT10_SessionContext_t` (통합 세션 컨텍스트)**[span_69](start_span)[span_69](end_span):
  - `type` (`EN_CT10_session_type_t`: `NONE=0, PLAYLIST=1, PRESET=2, FIXED=3, AUTO_FULL=4, AUTO_SELECT=5`)[span_70](start_span)[span_70](end_span)
  - `trigger` (`EN_CT10_trigger_t`: `NONE=0, MANUAL=1, SCHEDULE=2, AUTO_COMFORT=3, MANUAL_AUTO_FULL=4, MANUAL_AUTO_SELECT=5`)[span_71](start_span)[span_71](end_span)
  - `state` (`EN_SESSION_runtime_t`: `ACTIVE=0, PAUSED=1, COMPLETED=2`)[span_72](start_span)[span_72](end_span)
  - `payload`: `playlist{profileId, profileNo, profileName[32], currentStepIdx, totalSteps, currentStepDurationMs, currentStepStartMs, loopCount}`, `preset{presetCode, styleCode, override}`, `fixed{percent}`[span_73](start_span)[span_73](end_span)
  - `rule` (`ST_A20_TriggerRule_t`), `autoSelect{baseType, basePresetCode[24], baseProfileId}`, `runtimeAutoOffMin`, `pausedAccumMs`[span_74](start_span)[span_74](end_span)
- **`ST_CT10_TriggerRuntime_t` (트리거 평가 상태)**[span_75](start_span)[span_75](end_span):
  - `timerArmed`, `timerStartMs`, `timerMinutes`, `offTimeEnabled`, `offTimeMinutes`, `offTimeCrossMidnight`[span_76](start_span)[span_76](end_span)
  - `pauseMask` (`bit0=MOTION(0x01)`, `bit1=TEMP(0x02)`, `bit2=DI(0x04)`), `pauseBypassUntilMs`, `lastCheckTempC`, `lastCheckDI`[span_77](start_span)[span_77](end_span)
- **`ST_A20_Step_t` (`ST_A20_UserProfileSegment_t`) & FSM 레거시 브릿지 매핑 (`A20_Const_Sch_0203.h` / `C10_Config_UzProf_Util_0203.cpp`)**:
  - 외부 JSON/API는 `stepNo`, `durationMin`, `type`(`PRESET`/`FIXED`/`REST`) 단일 규격을 사용하며, JSON 디코딩 시 `tickSegmentSequence()` FSM 호환을 위해 아래 미러 필드가 자동 동기화됨:
    - `stepNo` (`uint8`) → `segId` (`uint8`) 및 `segNo` (`uint16`)
    - `durationMin` (`uint16`, `1..1440`분) → `onMinutes = durationMin`, `offMinutes = 0`
    - `type` (`EN_A20_step_type_t`) → `EN_A20_STEP_TYPE_FIXED`이면 `mode = EN_A20_SEG_MODE_FIXED`, `PRESET`/`REST`이면 `mode = EN_A20_SEG_MODE_PRESET` (`REST`는 `applySegmentOn()` 진입 시 즉시 `applySegmentOff()` 분기 처리)

### 3.2 입력 및 출력 데이터
- **입력 (Input)**:
  - 설정 스냅샷: `g_A20_config_root` (`schedules`, `userProfiles`, `windDict`, `motion`, `system`)[span_78](start_span)[span_78](end_span)
  - 센서 데이터: `s_dhtCache` (온도 °C, 습도 %), `CL_M10_MotionLogic::getLastDetectedMs()` (PIR 감지 타임스탬프)[span_79](start_span)[span_79](end_span)[span_80](start_span)[span_80](end_span)
  - 시간 정보: `CL_TM10_TimeManager::isTimeValid()`, `getLocalTime(struct tm&)`[span_81](start_span)[span_81](end_span)
  - 제어 명령: `startSession()`, `pauseSession()`, `resumeSession()`, `stopSession()`, `startOverrideFixed/Preset()`, `setAutoComfort()`, `ackEvent()`[span_82](start_span)[span_82](end_span)
- **출력 (Output)**:
  - 하드웨어 PWM: `CL_P10_PWM::setDutyPercent(0.0f ~ 100.0f)` → GPIO LEDC 듀티 출력[span_83](start_span)[span_83](end_span)
  - NVS 영속화: `CL_N10_NvsManager` (`run_mode`, `ovr_en`, `man_active`, `man_ovr_sch`, `auto_comfort`)[span_84](start_span)[span_84](end_span)
  - 모니터 이벤트: `CL_MON_Monitor::pushSessionEvent()` (64-entry 세션 타임라인 기록)[span_85](start_span)[span_85](end_span)
  - WS/REST JSON: `exportStateJson_v02()`, `exportMetricsJson()`, `exportChartJson()`, `exportSummaryJson()`[span_86](start_span)[span_86](end_span)[span_87](start_span)[span_87](end_span)

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 7-State 제어 FSM 우선순위 전이표 (`decideRunSource` / `CT10_Ctl_StMG_0203.cpp`)[span_88](start_span)[span_88](end_span)
| 평가 순서 | 검사 조건 | 결정 상태 (`nextState`) | 전이 사유 (`reason`) | 물리 동작 (`wantSimStop`) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `_autoOffLatched == true`[span_89](start_span)[span_89](end_span) | `EN_CT10_STATE_AUTOOFF_STOPPED`[span_90](start_span)[span_90](end_span) | 기존 `runCtx.reason` 유지[span_91](start_span)[span_91](end_span) | `true` (팬 정지 유지)[span_92](start_span)[span_92](end_span) |
| **2** | 실행 중 또는 `ENV_PAUSED` 상태에서 `checkTriggers()`가 `v_stopOut != NONE` 반환[span_93](start_span)[span_93](end_span) | `EN_CT10_STATE_AUTOOFF_STOPPED`[span_94](start_span)[span_94](end_span) | `AUTOOFF_TIMER` / `AUTOOFF_TIME` / `TEMP_LOW_STOP` / `DI_LOW_STOP`[span_95](start_span)[span_95](end_span) | `true` (`_autoOffLatched = true` 설정)[span_96](start_span)[span_96](end_span)[span_97](start_span)[span_97](end_span) |
| **3** | 실행 중 또는 `ENV_PAUSED` 상태에서 `checkTriggers()`가 `v_pauseOut != NONE` 반환[span_98](start_span)[span_98](end_span) | `EN_CT10_STATE_ENV_PAUSED`[span_99](start_span)[span_99](end_span) | `nextPauseReason` (`MOTION` / `TEMP_LOW` / `DI_LOW`)[span_100](start_span)[span_100](end_span) | `true` (`pauseStartedMs` 기록)[span_101](start_span)[span_101](end_span) |
| **4** | `overrideState.active == true`[span_102](start_span)[span_102](end_span) | `EN_CT10_STATE_OVERRIDE`[span_103](start_span)[span_103](end_span) | `EN_CT10_REASON_OVERRIDE_ACTIVE`[span_104](start_span)[span_104](end_span) | `false` (`tickOverride` 실행)[span_105](start_span)[span_105](end_span)[span_106](start_span)[span_106](end_span) |
| **5** | `useProfileMode && runSource == USER_PROFILE && curProfileIndex >= 0`[span_107](start_span)[span_107](end_span) | `EN_CT10_STATE_PROFILE_RUN`[span_108](start_span)[span_108](end_span) | `EN_CT10_REASON_PROFILE_MODE`[span_109](start_span)[span_109](end_span) | `false` (`tickUserProfile` 실행)[span_110](start_span)[span_110](end_span)[span_111](start_span)[span_111](end_span) |
| **6** | `useProfileMode == true` (프로필 미선택 상태)[span_112](start_span)[span_112](end_span) | `EN_CT10_STATE_IDLE`[span_113](start_span)[span_113](end_span) | `EN_CT10_REASON_PROFILE_MODE`[span_114](start_span)[span_114](end_span) | `true` (스케줄 개입 차단)[span_115](start_span)[span_115](end_span) |
| **7** | `runSource == USER_PROFILE && curProfileIndex >= 0`[span_116](start_span)[span_116](end_span) | `EN_CT10_STATE_PROFILE_RUN`[span_117](start_span)[span_117](end_span) | `EN_CT10_REASON_USER_PROFILE_ACTIVE`[span_118](start_span)[span_118](end_span) | `false`[span_119](start_span)[span_119](end_span) |
| **8** | `!CL_TM10_TimeManager::isTimeValid()`[span_120](start_span)[span_120](end_span) | `EN_CT10_STATE_TIME_INVALID`[span_121](start_span)[span_121](end_span) | `EN_CT10_REASON_TIME_NOT_VALID`[span_122](start_span)[span_122](end_span) | `true` (`3000ms` 홀드)[span_123](start_span)[span_123](end_span) |
| **9** | `findActiveScheduleIndex(*g_A20_config_root.schedules, true) >= 0`[span_124](start_span)[span_124](end_span) | `EN_CT10_STATE_SCHEDULE_RUN`[span_125](start_span)[span_125](end_span) | `EN_CT10_REASON_SCHEDULE_ACTIVE`[span_126](start_span)[span_126](end_span) | `false` (`tickSchedule` 실행)[span_127](start_span)[span_127](end_span)[span_128](start_span)[span_128](end_span) |
| **10** | 위 모든 조건 불충족[span_129](start_span)[span_129](end_span) | `EN_CT10_STATE_IDLE`[span_130](start_span)[span_130](end_span) | `EN_CT10_REASON_NO_ACTIVE_SCHEDULE` (또는 `NO_SCHEDULES`)[span_131](start_span)[span_131](end_span) | `false` (`sim.stop()`)[span_132](start_span)[span_132](end_span)[span_133](start_span)[span_133](end_span) |

### 4.2 메인 제어 루프 처리 시퀀스 (`CL_CT10_ControlManager::tickLoop`)[span_134](start_span)[span_134](end_span)
1. **Mutex 획득**: `CL_A40_MutexGuard_Semaphore(s_stateMutex, 100ms)`로 제어 상태 보호[span_135](start_span)[span_135](end_span).
2. **지연 설정 반영**: `_pendingMotionSimApply` 플래그가 참이면 `applyMotionSimConfigToSim()`으로 시뮬레이터 파라미터 갱신[span_136](start_span)[span_136](end_span).
3. **틱 주기 게이트**: `millis() - lastTickMs < 40ms` (`S_TICK_MIN_INTERVAL_MS`)이면 조기 반환[span_137](start_span)[span_137](end_span)[span_138](start_span)[span_138](end_span).
4. **런타임 AutoOff 검사**: AI `set_timer` 등으로 설정된 `runtimeAutoOffMin` 만료 시 `_autoOffLatched = true`, `stopSession()`, `setAutoComfort(false)` 수행[span_139](start_span)[span_139](end_span).
5. **Auto-Comfort 주기 평가**: `tickAutoComfort()` 호출(5분 간격으로 `AUTO_FULL`, `AUTO_SELECT`, 또는 `IDLE` 자동 쾌적 전환)[span_140](start_span)[span_140](end_span)[span_141](start_span)[span_141](end_span).
6. **이벤트 홀드 유지**: `!overrideState.active && shouldHoldEventState()`이면 `3000ms` 동안 현재 이벤트 상태를 유지하고 리턴[span_142](start_span)[span_142](end_span)[span_143](start_span)[span_143](end_span)[span_144](start_span)[span_144](end_span).
7. **상태 결정 및 전이**: `decideRunSource()` → `applyDecision()` 실행하여 상태 변경 시 Dirty 플래그(`state`, `metrics`, `summary`) 마킹[span_145](start_span)[span_145](end_span)[span_146](start_span)[span_146](end_span).
8. **상태별 구동**: `OVERRIDE` → `tickOverride()`, `PROFILE_RUN` → `tickUserProfile()`, `SCHEDULE_RUN` → `tickSchedule()` 실행 후 활성 시 `sim.tick()`으로 물리 연산 및 PWM 출력[span_147](start_span)[span_147](end_span).
9. **메트릭스 갱신**: `maybePushMetricsDirty()`로 `1500ms`마다 `metrics` Dirty 마킹 후 함수 종료 시 Mutex 자동 해제[span_148](start_span)[span_148](end_span)[span_149](start_span)[span_149](end_span)[span_150](start_span)[span_150](end_span).

---

## 5. 외부 인터페이스 명세 (API / WS / NVS 연동)
상세 페이로드 스키마는 `APP-01` 및 `APP-02`를 참조하며, 본 모듈과 직결되는 핵심 접점은 아래와 같음.
- **REST 제어 접점 (`W10_Web_Routes_Session_0203.cpp`, `W10_Web_Routes_Control_0203.cpp`, `W10_Web_Routes_Comfort_0203.cpp`)**:
  - `POST /api/v001/session/start|pause|resume|stop`, `PATCH /api/v001/session/rule`, `GET /api/v001/session/current`, `POST /api/v001/session/schedule-override`[span_151](start_span)[span_151](end_span)
  - `POST /api/v001/control/override/fixed|preset|clear`, `POST /api/v001/control/ack`, `GET|POST /api/v001/control/mode`, `GET|POST|DELETE /api/v001/control/timer`[span_152](start_span)[span_152](end_span)
  - `GET /api/v001/comfort`, `GET|POST /api/v001/comfort/auto`[span_153](start_span)[span_153](end_span)
- **WebSocket 브로드캐스트 (`CT10_Ctl_IOWS_0203.cpp`)**:
  - `exportStateJson_v02()` → `/ws/state` (800ms), `exportMetricsJson()` → `/ws/metrics` (1500ms), `exportChartJson()` → `/ws/chart` (1200ms), `exportSummaryJson()` → `/ws/summary` (1500ms)[span_154](start_span)[span_154](end_span)[span_155](start_span)[span_155](end_span)[span_156](start_span)[span_156](end_span)
- **NVS 영속화 (`CL_N10_NvsManager`)**:
  - `setRunMode()`, `setOverrideFixed/Preset()`, `setManualSession()`, `setManualOvrSchedule()`, `setAutoComfort()` 호출 시 `SNW_RUN` 네임스페이스에 10초 배치 커밋[span_157](start_span)[span_157](end_span)[span_158](start_span)[span_158](end_span)

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | 로그 코드 (`D10_Logger`) |
| :--- | :--- | :--- | :--- |
| **Mutex 획득 타임아웃** | `CL_A40_MutexGuard_Semaphore` `100ms` 초과[span_159](start_span)[span_159](end_span)[span_160](start_span)[span_160](end_span) | 상태 변경을 건너뛰고 다음 40ms 틱에 재시도하여 `loopTask` WDT(10s) 리셋 방지[span_161](start_span)[span_161](end_span)[span_162](start_span)[span_162](end_span)[span_163](start_span)[span_163](end_span) | `[CT10] tickLoop: Mutex busy` (`DEBUG`)[span_164](start_span)[span_164](end_span) |
| **DHT22 센서 단선 / 이상치** | `isnan(v_t)` / `isnan(v_h)` 또는 범위 이탈[span_165](start_span)[span_165](end_span)[span_166](start_span)[span_166](end_span) | 직전 유효 캐시 유지, 초기 미수신 시 안전 기본값(`24.0°C`, `55%` / `50%`) 사용하여 DI 오동작 차단[span_167](start_span)[span_167](end_span)[span_168](start_span)[span_168](end_span) | `[CT10] DHT temperature/humidity read failed` (`WARN`)[span_169](start_span)[span_169](end_span) |
| **자정 넘김 스케줄 / OffTime** | `startMin > endMin` 또는 `offTimeMinutes <= startMin`[span_170](start_span)[span_170](end_span) | `offTimeCrossMidnight` 플래그 및 전날(`v_yday`) 요일 비트마스크 검사로 자정 경계에서 조기 종료/미실행 방지[span_171](start_span)[span_171](end_span) | `[CT10] STOP: ...` (`INFO`)[span_172](start_span)[span_172](end_span) |
| **환경 Pause 채터링(Flapping)** | `tempLow` / `diLow` 임계값 부근 진동[span_173](start_span)[span_173](end_span)[span_174](start_span)[span_174](end_span) | `evalLowPauseHysteresis()` 적용: `val < threshold` 시 Pause 진입, `val >= threshold + hysteresis` (`temp>=0.5°C`, `DI>=3.0`) 도달 시에만 재개[span_175](start_span)[span_175](end_span)[span_176](start_span)[span_176](end_span) | `[CT10] PAUSE entered` / `PAUSE resumed` (`INFO`)[span_177](start_span)[span_177](end_span)[span_178](start_span)[span_178](end_span) |
| **세그먼트 시뮬레이터 예기치 않은 정지** | `p_rt.onPhase && !sim.active && mode == PRESET`[span_179](start_span)[span_179](end_span) | `tickSegmentSequence()` 내 self-heal 로직이 `applySegmentOn()`을 자동 재호출하여 바람 출력 복구 (`FIXED` 모드는 무한 재호출 제외)[span_180](start_span)[span_180](end_span) | `[CT10] SegmentOn(...)` (`INFO`)[span_181](start_span)[span_181](end_span) |
| **무중단 설정 리로드 (`reloadAll`)** | `consumePendingReload() == true`[span_182](start_span)[span_182](end_span) | 로컬 `v_new` 로드 성공 시에만 `s_rootSwapMux`로 원자 스왑, 기존 `v_old`는 3초 유예 큐(`queuePendingFree`) 등록 후 해제[span_183](start_span)[span_183](end_span) | `[CT10] reloadAll done` (`INFO`)[span_184](start_span)[span_184](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **타이밍 및 지터**:
  - 메인 제어 주기 `40ms` (`25Hz`), Watchdog 타임아웃 `10s` (`G_A00_WDT_TIMEOUT_SEC`) 이내 완료 보장[span_185](start_span)[span_185](end_span)[span_186](start_span)[span_186](end_span)
  - 센서 폴링(`dht_task`)을 별도 FreeRTOS 태스크(Core 1)로 분리하여 DHT22 1-Wire 통신 지연(~250ms)이 `loopTask` 제어 루프를 블로킹하지 않도록 격리[span_187](start_span)[span_187](end_span)
- **메모리 안전성**:
  - `tickLoop()` 핫 패스 내 동적 힙 할당(`new`/`malloc`) 금지, 정적 `JsonDocument` 및 고정 크기 구조체 사용[span_188](start_span)[span_188](end_span)[span_189](start_span)[span_189](end_span)
  - 모든 문자열 조작은 `strlcpy` / `copyStr2Buffer_safe` 기반 버퍼 오버플로우 차단[span_190](start_span)[span_190](end_span)
- **동시성 및 락 순서**:
  - `exportStateJson_v02()` 등 Config와 Control 상태를 함께 읽을 때 반드시 `C10::getRootSnapshot()`(L1) 선행 후 `s_stateMutex`(L2) 획득 순서를 준수함[span_191](start_span)[span_191](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-04-01** | 우선순위 중재 | 스케줄 활성 시간대에 `POST /api/v001/control/override/fixed` (`percent=60`) 호출 | `runCtx.state`가 `SCHEDULE_RUN`에서 `OVERRIDE`로 즉시 전이되고 PWM 듀티 60% 출력, `pendingSchedule.active == true` 표시[span_192](start_span)[span_192](end_span)[span_193](start_span)[span_193](end_span) |
| **TC-04-02** | 히스테리시스 Pause/재개 | `tempLow` (`threshold=22.0`, `hysteresis=0.5`, `mode=PAUSE`) 설정 후 온도 `21.8°C` → `22.2°C` → `22.6°C` 변화 | `21.8°C`에서 `ENV_PAUSED`(`PAUSE_TEMP_LOW`) 진입 및 팬 정지, `22.2°C`에서는 정지 유지, `22.6°C` 도달 시 원 상태로 자동 재개[span_194](start_span)[span_194](end_span)[span_195](start_span)[span_195](end_span) |
| **TC-04-03** | Smart Resume (5분/30분) | 3스텝 플레이리스트 실행 중 `pauseSession()` 후 (A) 2분 뒤, (B) 10분 뒤, (C) 35분 뒤 `resumeSession()` 호출 | (A) 잔여 스텝 시간 이어서 재개, (B) 현재 스텝 처음부터 재개, (C) Step 1(`index=0`)부터 전체 리셋 재개[span_196](start_span)[span_196](end_span) |
| **TC-04-04** | 타이머 일시정지 보정 | 10분 타이머 설정 후 3분 경과 시점에 4분간 `pauseSession()` 후 재개 | 일시정지 4분은 차감되지 않아 재개 후 남은 가동 시간 `7분`(`420초`) 유지[span_197](start_span)[span_197](end_span) |
| **TC-04-05** | Auto-Comfort 5분 평가 | `POST /api/v001/comfort/auto` (`enabled=true`) 후 실내 온습도 상승으로 $DI = 77.5$ 도달 | Level `2` 판정, 5분 평가 주기 도래 시 `OCEAN` 프리셋 + `ACTIVE` 스타일로 자동 세션 시작[span_198](start_span)[span_198](end_span) |
| **TC-04-06** | PWM 3구간 커브 & 0% 차단 | 기본 팬 설정(`10/20/80/95%`)에서 목표 비율 `0.0`, `0.165`, `0.495`, `1.0` 입력 | 각각 `0%`, `5%`(기동 구간 중간), `45%`(쾌적 구간 중간), `95%`(`hardPercentMax` 상한) 듀티 출력[span_199](start_span)[span_199](end_span)[span_200](start_span)[span_200](end_span) |

