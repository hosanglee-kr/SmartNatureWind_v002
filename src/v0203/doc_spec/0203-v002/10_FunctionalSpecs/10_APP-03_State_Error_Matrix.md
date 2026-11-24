# APP-03. 전역 상태머신, 동시성(Mutex) 규약 및 Fail-safe 매트릭스

> 📑 [FN-00. 마스터 인덱스로 돌아가기](./00_FN_Master_Index.md)

## 1. 문서 메타데이터
- **문서 ID / 명칭**: `APP-03` / 전역 상태머신(`EN_*`), Mutex 점유 규칙, 에러 코드 및 Fail-safe 매트릭스[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)
- **기준 펌웨어 버전**: `FW_Ver_2.0.3`[span_2](start_span)[span_2](end_span)
- **관련 소스 파일**:
  - 상태머신/트리거: `CT10_Ctl_0203.h`, `CT10_Ctl_StMG_0203.cpp`, `CT10_Ctl_Ctl_0203.cpp`, `CT10_Ctl_Basic_0203.cpp`[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)
  - 동시성/락/스냅샷: `A20_Const_0203.h`, `A40_Com_Utils_0203.h`, `C10_Config_0203.h`, `C10_Config_Core_0203.cpp`, `M10_MotionLogic_0203.h`, `WF10_WiFiMgr_0203.h`, `N10_NvsManager_0203.h`[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
  - 로깅/복구: `D10_Logger_0203.h`, `A00_Main_0203.cpp`, `A40_Com_Utils_IO_0203.cpp`, `CT10_Ctl_AIAction_0203.cpp`[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)

---

## 2. 전역 상태머신(FSM) 및 열거형 정의

### 2.1 메인 제어 상태 (`EN_CT10_state_t` / `CT10_Ctl_0203.h`)[span_17](start_span)[span_17](end_span)
`CL_CT10_ControlManager::decideRunSource()`가 매 틱(40ms)마다 아래 우선순위로 평가하여 `applyDecision()`으로 단일 전이를 수행함[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span).

| 우선순위 | 상태 코드 (`EN_CT10_state_t`) | 문자열 (`CT10_stateToString`) | 진입 조건 (`decideRunSource`) | 유지 동작 및 물리 출력 | 탈출 / 복귀 조건 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `EN_CT10_STATE_AUTOOFF_STOPPED` (`5`)[span_20](start_span)[span_20](end_span) | `"AUTOOFF_STOPPED"`[span_21](start_span)[span_21](end_span) | `_autoOffLatched == true` 또는 `checkTriggers()`에서 Stop 조건(`timer`, `offTime`, `tempLow[STOP]`, `diLow[STOP]`) 충족[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span) | `sim.stop()`, PWM 0% 강제 정지, `S_EVENT_HOLD_MS`(3000ms) 홀드[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span) | 사용자 ACK(`POST /api/v001/control/ack`), 모드 변경, 새 세션 시작, 또는 수동 오버라이드 입력[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span)[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span) |
| **2** | `EN_CT10_STATE_ENV_PAUSED` (`7`)[span_30](start_span)[span_30](end_span) | `"ENV_PAUSED"`[span_31](start_span)[span_31](end_span) | 활성 실행 중(`OVERRIDE`/`PROFILE`/`SCHEDULE`) `checkTriggers()`의 `pauseMask != 0` (`PIR` 부재, `tempLow[PAUSE]`, `diLow[PAUSE]`)[span_32](start_span)[span_32](end_span)[span_33](start_span)[span_33](end_span) | `sim.stop()`, `pauseStartedMs` 누적 시간 기록 시작(타이머 차감 보정용)[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span) | 히스테리시스 회복(`pauseMask == 0`) 시 원 상태 자동 복귀, 또는 사용자 수동 재개 시 **1시간(`3,600,000ms`) 유예**(`pauseBypassUntilMs`) 후 즉시 복귀[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span)[span_38](start_span)[span_38](end_span) |
| **3** | `EN_CT10_STATE_OVERRIDE` (`1`)[span_39](start_span)[span_39](end_span) | `"OVERRIDE"`[span_40](start_span)[span_40](end_span) | `overrideState.active == true` (수동 고정 PWM 또는 수동 프리셋/세션)[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span) | `useFixed ? pwm->setDutyPercent() : sim.tick()`[span_43](start_span)[span_43](end_span)[span_44](start_span)[span_44](end_span) | `endMs` 타임아웃 만료, `stopOverride()`, 또는 `stopSession()`[span_45](start_span)[span_45](end_span)[span_46](start_span)[span_46](end_span) |
| **4** | `EN_CT10_STATE_PROFILE_RUN` (`2`)[span_47](start_span)[span_47](end_span) | `"PROFILE_RUN"`[span_48](start_span)[span_48](end_span) | `runSource == EN_CT10_RUN_USER_PROFILE` 및 유효한 `curProfileIndex >= 0`[span_49](start_span)[span_49](end_span) | `tickUserProfile()` (8스텝 시퀀스 순환) + `sim.tick()`[span_50](start_span)[span_50](end_span)[span_51](start_span)[span_51](end_span) | 프로필 스텝 완료(`repeatSegments==false` 또는 `repeatCount` 도달), `stopUserProfile()`[span_52](start_span)[span_52](end_span)[span_53](start_span)[span_53](end_span) |
| **5** | `EN_CT10_STATE_TIME_INVALID` (`6`)[span_54](start_span)[span_54](end_span) | `"TIME_INVALID"`[span_55](start_span)[span_55](end_span) | `useProfileMode == false`이고 `!CL_TM10_TimeManager::isTimeValid()` (SNTP 미동기화)[span_56](start_span)[span_56](end_span) | `sim.stop()`, `S_EVENT_HOLD_MS`(3000ms) 홀드[span_57](start_span)[span_57](end_span) | `TM10` NTP 동기화 성공(`s_timeValid = true`) 또는 사용자 수동/프로필 모드 전환[span_58](start_span)[span_58](end_span)[span_59](start_span)[span_59](end_span) |
| **6** | `EN_CT10_STATE_SCHEDULE_RUN` (`3`)[span_60](start_span)[span_60](end_span) | `"SCHEDULE_RUN"`[span_61](start_span)[span_61](end_span) | 시간 유효 + `findActiveScheduleIndex()`에서 현재 요일/시각 매칭 스케줄 발견[span_62](start_span)[span_62](end_span) | `tickSchedule()` (참조 `profileId`의 스텝 실행) + `sim.tick()`[span_63](start_span)[span_63](end_span)[span_64](start_span)[span_64](end_span) | 스케줄 종료 시각(`endTime`) 경과 또는 수동 개입[span_65](start_span)[span_65](end_span)[span_66](start_span)[span_66](end_span) |
| **7** | `EN_CT10_STATE_IDLE` (`0`)[span_67](start_span)[span_67](end_span) | `"IDLE"`[span_68](start_span)[span_68](end_span) | 활성 오버라이드/프로필/매칭 스케줄 없음 (기본 대기 상태)[span_69](start_span)[span_69](end_span) | `sim.stop()`, PWM 0%[span_70](start_span)[span_70](end_span)[span_71](start_span)[span_71](end_span) | 스케줄 시간 도래, 사용자 수동 실행, 또는 `AutoComfort` 트리거[span_72](start_span)[span_72](end_span)[span_73](start_span)[span_73](end_span) |

### 2.2 세션 FSM (`EN_SESSION_runtime_t`) 및 Smart Resume 정책 (`CT10_Ctl_Ctl_0203.cpp`)[span_74](start_span)[span_74](end_span)[span_75](start_span)[span_75](end_span)
- **상태 열거형**: `EN_SESSION_ACTIVE` (`0`), `EN_SESSION_PAUSED` (`1`), `EN_SESSION_COMPLETED` (`2`)[span_76](start_span)[span_76](end_span)
- **일시정지 경과 시간(`v_pauseDuration = millis() - pausedAtMs`)별 `resumeSession()` 복귀 정책**:
  - **5분 이하 (`<= 300,000ms`, `S_PAUSE_CONTINUE_MS`)**: 잔여 스텝 시간 그대로 연속 재개 (`phaseStartMs += v_pauseDuration`)[span_77](start_span)[span_77](end_span)[span_78](start_span)[span_78](end_span)
  - **5분 초과 ~ 30분 이하 (`300,001ms ~ 1,800,000ms`)**: 현재 실행 중이던 스텝의 시작 시각만 리셋하여 해당 스텝 처음부터 재개[span_79](start_span)[span_79](end_span)[span_80](start_span)[span_80](end_span)
  - **30분 초과 (`> 1,800,000ms`, `S_PAUSE_STEP_RESET_MS`)**: 전체 플레이리스트를 **Step 1(`index = 0`)부터 초기화**하여 재시작[span_81](start_span)[span_81](end_span)[span_82](start_span)[span_82](end_span)

### 2.3 전이 사유(`EN_CT10_reason_t`) 및 일시정지 사유(`EN_CT10_pause_t`) 코드표[span_83](start_span)[span_83](end_span)
| `EN_CT10_reason_t` | 코드 | 문자열 | 설명 |
| :--- | :--- | :--- | :--- |
| `EN_CT10_REASON_NONE` | `0`[span_84](start_span)[span_84](end_span) | `"NONE"`[span_85](start_span)[span_85](end_span) | 기본/초기 상태[span_86](start_span)[span_86](end_span)[span_87](start_span)[span_87](end_span) |
| `EN_CT10_REASON_OVERRIDE_ACTIVE` | `1`[span_88](start_span)[span_88](end_span) | `"OVERRIDE_ACTIVE"`[span_89](start_span)[span_89](end_span) | 수동 오버라이드 실행 중[span_90](start_span)[span_90](end_span)[span_91](start_span)[span_91](end_span) |
| `EN_CT10_REASON_PROFILE_MODE` | `2`[span_92](start_span)[span_92](end_span) | `"PROFILE_MODE"`[span_93](start_span)[span_93](end_span) | 사용자 프로필 모드 활성[span_94](start_span)[span_94](end_span)[span_95](start_span)[span_95](end_span) |
| `EN_CT10_REASON_USER_PROFILE_ACTIVE` | `3`[span_96](start_span)[span_96](end_span) | `"USER_PROFILE_ACTIVE"`[span_97](start_span)[span_97](end_span) | 사용자 프로필 재생 중[span_98](start_span)[span_98](end_span)[span_99](start_span)[span_99](end_span) |
| `EN_CT10_REASON_SCHEDULE_ACTIVE` | `4`[span_100](start_span)[span_100](end_span) | `"SCHEDULE_ACTIVE"`[span_101](start_span)[span_101](end_span) | 주간 스케줄 매칭 실행 중[span_102](start_span)[span_102](end_span)[span_103](start_span)[span_103](end_span) |
| `EN_CT10_REASON_NO_ACTIVE_SCHEDULE` | `5`[span_104](start_span)[span_104](end_span) | `"NO_ACTIVE_SCHEDULE"`[span_105](start_span)[span_105](end_span) | 현재 시각에 해당하는 활성 스케줄 없음[span_106](start_span)[span_106](end_span)[span_107](start_span)[span_107](end_span) |
| `EN_CT10_REASON_NO_SCHEDULES` | `6`[span_108](start_span)[span_108](end_span) | `"NO_SCHEDULES"`[span_109](start_span)[span_109](end_span) | 등록된 스케줄 데이터 없음[span_110](start_span)[span_110](end_span)[span_111](start_span)[span_111](end_span) |
| `EN_CT10_REASON_TIME_NOT_VALID` | `7`[span_112](start_span)[span_112](end_span) | `"TIME_NOT_VALID"`[span_113](start_span)[span_113](end_span) | SNTP 미동기화 상태로 스케줄 판정 불가[span_114](start_span)[span_114](end_span)[span_115](start_span)[span_115](end_span) |
| `EN_CT10_REASON_MOTION_NO_PRESENCE` | `8`[span_116](start_span)[span_116](end_span) | `"MOTION_NO_PRESENCE"`[span_117](start_span)[span_117](end_span) | PIR 부재 상태[span_118](start_span)[span_118](end_span)[span_119](start_span)[span_119](end_span) |
| `EN_CT10_REASON_AUTOOFF_TIMER` | `9`[span_120](start_span)[span_120](end_span) | `"AUTOOFF_TIMER"`[span_121](start_span)[span_121](end_span) | 카운트다운 타이머 만료 정지[span_122](start_span)[span_122](end_span)[span_123](start_span)[span_123](end_span) |
| `EN_CT10_REASON_AUTOOFF_TIME` | `10`[span_124](start_span)[span_124](end_span) | `"AUTOOFF_TIME"`[span_125](start_span)[span_125](end_span) | 지정 시각(`offTime`) 도달 정지[span_126](start_span)[span_126](end_span)[span_127](start_span)[span_127](end_span) |
| `EN_CT10_REASON_USER_STOP` | `11`[span_128](start_span)[span_128](end_span) | `"USER_STOP"`[span_129](start_span)[span_129](end_span) | 사용자 명시적 정지[span_130](start_span)[span_130](end_span)[span_131](start_span)[span_131](end_span) |
| `EN_CT10_REASON_TEMP_LOW_STOP` | `12`[span_132](start_span)[span_132](end_span) | `"TEMP_LOW_STOP"`[span_133](start_span)[span_133](end_span) | 온도 하한(`tempLow.mode=STOP`) 도달 정지[span_134](start_span)[span_134](end_span)[span_135](start_span)[span_135](end_span) |
| `EN_CT10_REASON_DI_LOW_STOP` | `13`[span_136](start_span)[span_136](end_span) | `"DI_LOW_STOP"`[span_137](start_span)[span_137](end_span) | 불쾌지수 하한(`diLow.mode=STOP`) 도달 정지[span_138](start_span)[span_138](end_span)[span_139](start_span)[span_139](end_span) |

- **일시정지 비트마스크 (`triggerRt.pauseMask`) & `EN_CT10_pause_t`**[span_140](start_span)[span_140](end_span)[span_141](start_span)[span_141](end_span):
  - `CT10_PAUSE_MASK_MOTION` (`0x01`) → `EN_CT10_PAUSE_MOTION` (`1`)[span_142](start_span)[span_142](end_span)[span_143](start_span)[span_143](end_span)
  - `CT10_PAUSE_MASK_TEMP` (`0x02`) → `EN_CT10_PAUSE_TEMP_LOW` (`2`)[span_144](start_span)[span_144](end_span)[span_145](start_span)[span_145](end_span)
  - `CT10_PAUSE_MASK_DI` (`0x04`) → `EN_CT10_PAUSE_DI_LOW` (`3`)[span_146](start_span)[span_146](end_span)[span_147](start_span)[span_147](end_span)

---

## 3. 멀티태스크 컨텍스트 및 Mutex 점유 규약 (Deadlock 방지 SSOT)

### 3.1 실행 태스크 구조
| 태스크명 | 실행 주체 / 코어 | 주요 역할 | `g_A20_config_root` 접근 규칙 |
| :--- | :--- | :--- | :--- |
| `loopTask` (`T-loop`) | Arduino `loop()` (`A00_run`)[span_148](start_span)[span_148](end_span)[span_149](start_span)[span_149](end_span) | 제어 루프(`CT10`), WS 스케줄러, `M10`/`TM10`/`MON` 틱, 지연 메모리 해제(`processPendingFree`), NVS 플러시, LED 갱신[span_150](start_span)[span_150](end_span) | 화이트리스트 모듈(`A00`, `CT10`, `M10`)에 한해 직접 접근 허용[span_151](start_span)[span_151](end_span) |
| `async_tcp` (`T-async`) | `ESPAsyncWebServer` 비동기 콜백[span_152](start_span)[span_152](end_span)[span_153](start_span)[span_153](end_span) | 모든 REST API 라우트(`W10_Web_Routes_*`), WebSocket 핸드셰이크/전송[span_154](start_span)[span_154](end_span)[span_155](start_span)[span_155](end_span) | **직접 역참조 엄격 금지** — 반드시 `CL_C10_ConfigManager::getRootSnapshot()` 원자 스냅샷 경유[span_156](start_span)[span_156](end_span) |
| `gemini_worker` (`T-ai`) | FreeRTOS Task (`Core 1`, Stack `10KB`, Prio `1`)[span_157](start_span)[span_157](end_span)[span_158](start_span)[span_158](end_span) | Gemini HTTPS 2-Turn 호출 및 Tool Calling 비동기 처리[span_159](start_span)[span_159](end_span) | `getRootSnapshot()` 스냅샷 경유[span_160](start_span)[span_160](end_span) |
| `WF10_Reconnect` (`T-wf`) | FreeRTOS Task (Stack `8KB`, Prio `1`)[span_161](start_span)[span_161](end_span) | Wi-Fi 설정 변경 시 백그라운드 재연결 수행[span_162](start_span)[span_162](end_span) | `getRootSnapshot()` 스냅샷 경유[span_163](start_span)[span_163](end_span)[span_164](start_span)[span_164](end_span) |
| `dht_task` | FreeRTOS Task (`Core 1`, Stack `3KB`, Prio `1`)[span_165](start_span)[span_165](end_span) | DHT22 온습도 주기 폴링 및 `s_dhtCache` 갱신[span_166](start_span)[span_166](end_span) | `getRootSnapshot()` 스냅샷 경유[span_167](start_span)[span_167](end_span) |

### 3.2 전역 동기화 프리미티브 및 계층적 락 순서 (Lock Hierarchy)
데드락(Deadlock) 원천 차단을 위해 다중 락 획득 시 반드시 **상위 계층(L1) → 하위 계층(L3)** 순서만 허용함(역순 획득 금지).

| 계층 | 락 핸들 / 스핀락 | 소유 모듈 | 보호 대상 자원 | 기본 타임아웃 |
| :--- | :--- | :--- | :--- | :--- |
| **L1 (Spinlock)** | `s_rootSwapMux`, `s_dirtyflagSpinlock`, `s_pendingFreeMux` (`portMUX_TYPE`)[span_168](start_span)[span_168](end_span) | `CL_C10_ConfigManager`[span_169](start_span)[span_169](end_span) | 8개 설정 포인터 스왑/스냅샷, Dirty 플래그, Pending Free 큐[span_170](start_span)[span_170](end_span) | Critical Section (힙 할당 금지)[span_171](start_span)[span_171](end_span) |
| **L1 (Mutex)** | `s_recursiveMutex` (`SemaphoreHandle_t`)[span_172](start_span)[span_172](end_span) | `CL_C10_ConfigManager`[span_173](start_span)[span_173](end_span) | LittleFS 설정 파일 Load/Save/Patch/CRUD 트랜잭션[span_174](start_span)[span_174](end_span) | `100ms` (`G_A40_MUTEX_TIMEOUT_100`)[span_175](start_span)[span_175](end_span)[span_176](start_span)[span_176](end_span) |
| **L2 (Mutex)** | `s_stateMutex` (`SemaphoreHandle_t`)[span_177](start_span)[span_177](end_span) | `CL_CT10_ControlManager`[span_178](start_span)[span_178](end_span) | `runCtx`, `_session`, `overrideState`, `triggerRt`, `scheduleSegRt`, `profileSegRt`[span_179](start_span)[span_179](end_span) | `100ms` (`G_A40_MUTEX_TIMEOUT_100`)[span_180](start_span)[span_180](end_span) |
| **L3 (Mutex)** | `_recursiveMutex` (`S10`), `s_stateMutex` (`M10`), `s_monitorMutex` (`MON`), `s_mutex` (`N10`/`TM10`/`WF10`), `s_aiJobMutex` (`W10`)[span_181](start_span)[span_181](end_span)[span_182](start_span)[span_182](end_span)[span_183](start_span)[span_183](end_span)[span_184](start_span)[span_184](end_span)[span_185](start_span)[span_185](end_span)[span_186](start_span)[span_186](end_span)[span_187](start_span)[span_187](end_span) | 각 서브 매니저[span_188](start_span)[span_188](end_span)[span_189](start_span)[span_189](end_span)[span_190](start_span)[span_190](end_span)[span_191](start_span)[span_191](end_span)[span_192](start_span)[span_192](end_span)[span_193](start_span)[span_193](end_span)[span_194](start_span)[span_194](end_span) | 각 모듈 내부 상태 버퍼 및 NVS/PSRAM 자원 (주의: `M10::_onChange` 콜백 내부에서 L2 `CT10` 락 획득 금지)[span_195](start_span)[span_195](end_span) | `100ms` (`G_A40_MUTEX_TIMEOUT_100`)[span_196](start_span)[span_196](end_span)[span_197](start_span)[span_197](end_span)[span_198](start_span)[span_198](end_span)[span_199](start_span)[span_199](end_span)[span_200](start_span)[span_200](end_span)[span_201](start_span)[span_201](end_span) |

---

## 4. 로깅 레벨 및 시스템 에러 코드 / Fail-safe 대응 매트릭스

### 4.1 로거 규격 (`CL_D10_Logger` / `D10_Logger_0203.h`)[span_202](start_span)[span_202](end_span)
- **순환 버퍼**: `BUFFER_SIZE = 256` 엔트리 (`timestamp`, `level`, `message[128]`)[span_203](start_span)[span_203](end_span)
- **로그 레벨 (`EN_L10_LogLevel_t`)**: `NONE(0)`, `ERROR(1)`(`[ERR]`), `WARN(2)`(`[WRN]`), `INFO(3)`(`[INF]`), `DEBUG(4)`(`[DBG]`)[span_204](start_span)[span_204](end_span)
- **출력 경로**: 시리얼 콘솔(ANSI 컬러) + `/api/v001/logs` JSON + `/ws/log` 실시간 스트림[span_205](start_span)[span_205](end_span)

### 4.2 장애 시나리오별 감지 및 Fail-safe 복구 매트릭스
| 도메인 | 장애 / 예외 시나리오 | 감지 메커니즘 | 자동 Fail-safe / 폴백 동작 | 관련 로그 태그 |
| :--- | :--- | :--- | :--- | :--- |
| **부팅 / 파일시스템** | LittleFS 마운트 실패 또는 `10_cfg_jsonFile.json` 손상/누락[span_206](start_span)[span_206](end_span) | `LittleFS.begin(true)` / `_loadCfgJsonFile()` 실패[span_207](start_span)[span_207](end_span)[span_208](start_span)[span_208](end_span) | In-memory 기본값(`A20_resetSystem/WifiDefault`) 할당 후 부팅 강행 → 웹 UI 접속 복구 경로 확보[span_209](start_span)[span_209](end_span) | `[FS]`, `[A00]`[span_210](start_span)[span_210](end_span) |
| **부팅 / 메모리** | 심각한 OOM으로 `system`/`wifi` 기본 구조체 동적 할당마저 실패[span_211](start_span)[span_211](end_span) | `new (std::nothrow)` 반환 `nullptr`[span_212](start_span)[span_212](end_span) | 최후 안전망으로 복구 전용 SoftAP(`NatureWind_Recovery` / `2540`)만 단독 기동[span_213](start_span)[span_213](end_span)[span_214](start_span)[span_214](end_span) | `[A00]`[span_215](start_span)[span_215](end_span) |
| **설정 영속화** | 설정 JSON 저장 중 전원 차단 또는 메인 파일 손상[span_216](start_span)[span_216](end_span) | `deserializeJson()` 에러 또는 `.tmp` 쓰기 0바이트[span_217](start_span)[span_217](end_span) | `.tmp` 원자적 교체 + 2중 백업(`.bak` → `.bak.old`) 순차 자동 복구 후 원본 파일 복원[span_218](start_span)[span_218](end_span) | `[A40][Save/Load]`[span_219](start_span)[span_219](end_span) |
| **설정 재로드** | `POST /api/v001/reload` 실행 중 웹 GET 직렬화 경합[span_220](start_span)[span_220](end_span)[span_221](start_span)[span_221](end_span) | `reloadAll()` 포인터 스왑 시점[span_222](start_span)[span_222](end_span)[span_223](start_span)[span_223](end_span) | 구버전 `ConfigRoot`를 `s_pendingFree` 큐(2슬롯)에 등록 후 `3,000ms`(`PENDING_FREE_GRACE_MS`) 유예 뒤 해제하여 UAF 차단[span_224](start_span)[span_224](end_span)[span_225](start_span)[span_225](end_span) | `[C10]`[span_226](start_span)[span_226](end_span) |
| **Wi-Fi 연결** | STA 공유기 연결 실패 또는 런타임 연결 끊김[span_227](start_span)[span_227](end_span) | `WiFiMulti` 타임아웃 또는 `ARDUINO_EVENT_WIFI_STA_DISCONNECTED`[span_228](start_span)[span_228](end_span) | `500ms → 1000ms → 2000ms → 4000ms` 지수 백오프 재시도(최대 5회) 후 실패 시 SoftAP 폴백 유지[span_229](start_span)[span_229](end_span)[span_230](start_span)[span_230](end_span) | `[WF10]`[span_231](start_span)[span_231](end_span) |
| **시간 동기화** | 주 NTP 서버(`kr.pool.ntp.org`) 응답 없음 또는 비정상 Epoch[span_232](start_span)[span_232](end_span)[span_233](start_span)[span_233](end_span) | `15,000ms` 타임아웃 또는 `_isTimeSane()` (`epoch < 1700000000`)[span_234](start_span)[span_234](end_span)[span_235](start_span)[span_235](end_span)[span_236](start_span)[span_236](end_span) | 3개 폴백 NTP 서버(`time.google.com` 등) 순환 전환, 미동기화 시 `TIME_INVALID` 상태로 스케줄 오동작 방지[span_237](start_span)[span_237](end_span)[span_238](start_span)[span_238](end_span)[span_239](start_span)[span_239](end_span) | `[TM10]`[span_240](start_span)[span_240](end_span) |
| **센서 / 쾌적도** | DHT22 온습도 센서 단선 또는 `NaN` 이상치 수신[span_241](start_span)[span_241](end_span)[span_242](start_span)[span_242](end_span) | `isnan(v_t)` / `isnan(v_h)` 또는 범위 이탈(`<-20°C`, `>60°C`)[span_243](start_span)[span_243](end_span)[span_244](start_span)[span_244](end_span) | 직전 유효 캐시(`s_dhtCache`) 유지, 캐시 부재 시 안전 기본값(`24.0°C`, `50%` / `55%`) 적용하여 DI 연산 보호[span_245](start_span)[span_245](end_span)[span_246](start_span)[span_246](end_span) | `[CT10]`[span_247](start_span)[span_247](end_span)[span_248](start_span)[span_248](end_span) |
| **PSRAM / 모니터링** | PSRAM 미탑재 보드(ESP32-C3 등) 또는 `heap_caps_malloc` 실패[span_249](start_span)[span_249](end_span) | `MALLOC_CAP_SPIRAM` 할당 반환 `nullptr`[span_250](start_span)[span_250](end_span) | `CL_MON_Monitor::s_enabled = false`로 안전 비활성화, `/api/v001/monitor` 요청 시 `503` 응답 반환 후 메인 제어 계속[span_251](start_span)[span_251](end_span)[span_252](start_span)[span_252](end_span) | `[MON]`[span_253](start_span)[span_253](end_span) |
| **AI 제어 보안** | AI가 시스템 재부팅/초기화/OTA 등 위험 명령 호출 시도[span_254](start_span)[span_254](end_span) | `CT10_AI::isForbiddenAIFunction()` 15종 블랙리스트 매칭[span_255](start_span)[span_255](end_span) | 실행 즉시 차단 및 `"error:forbidden"` 반환[span_256](start_span)[span_256](end_span) | `[AI]`[span_257](start_span)[span_257](end_span) |
| **AI 과금 / 한도** | Gemini Live 음성 세션 일일 누적 사용량 과다[span_258](start_span)[span_258](end_span) | `CL_N10_NvsManager::getAIDailyUsage().audioSec`[span_259](start_span)[span_259](end_span) | 25분(`1500s`) 도달 시 `"warn"` 경고, 30분(`1800s`) 도달 시 `403 Forbidden` (`"cap"`)으로 신규 토큰 발급 차단[span_260](start_span)[span_260](end_span) | `[W10:Live]`[span_261](start_span)[span_261](end_span) |
| **파일 업로드 / OTA** | 동시 다중 업로드 요청, 2MB 초과, 또는 경로 탐색(`../`) 시도[span_262](start_span)[span_262](end_span) | `s_uploadOwner` 점유 검사, `contentLength() > 2MB`, `extractSafeFileName()`[span_263](start_span)[span_263](end_span) | 동시 요청 `429 Busy` 차단, `../` 및 선행 `.` 제거, 오류 시 `.tmp`/`Update.abort()` 즉시 정리[span_264](start_span)[span_264](end_span) | `[W10]`[span_265](start_span)[span_265](end_span) |

