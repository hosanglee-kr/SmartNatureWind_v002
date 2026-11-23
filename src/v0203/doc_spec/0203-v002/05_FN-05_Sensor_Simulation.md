# FN-05. 센서 모니터링 및 물리 시뮬레이션 기능 명세서

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-05` / 센서 모니터링 및 물리 시뮬레이션 (`Sensor Monitoring, Motion Logic & Physics Wind Simulation`)
- **관련 소스 파일**:
  - 이력 모니터링: `CT10_Monitor_0203.h`, `CT10_Monitor_0203.cpp`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)
  - 모션 감지 로직: `M10_MotionLogic_0203.h`, `A20_Const_Motion_0203.h`[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span)
  - 자연풍 물리 시뮬레이터: `S10_Simul_0203.h`, `S10_Simul_Const_0203.h`, `S10_Simul_Core_0203.cpp`, `S10_Simul_Physic_0203.cpp`, `S10_Simul_IO_0203.cpp`[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)
  - 바람 파라미터 솔버: `S20_WindSolver_0203.h`[span_9](start_span)[span_9](end_span)
- **실행 컨텍스트**:
  - 시뮬레이션 물리 틱: `loopTask` (`CL_CT10_ControlManager::tickLoop()` → `sim.tick()`), 기본 평가 간격 `40ms + jitter(0~59ms)` (`G_S10_TICK_MIN_BASE_MS = 40u`, `G_S10_TICK_JITTER_RANGE_MS = 60u`)[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
  - 모션/모니터 틱: `loopTask` (`A00_run()` → `g_M10_motionLogic->tick()` 및 `CL_MON_Monitor::tick()` 1초/30초 샘플링)[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span)
  - 외부 PIR 주입 및 이력 조회: `async_tcp` (`POST /api/v001/motion/pir/feed`, `GET /api/v001/monitor*`)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)
- **선행 조건 (Pre-condition)**:
  - `g_P10_pwm.begin()` 완료 후 `CL_S10_Simulation::begin(g_P10_pwm)` 바인딩 완료[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)
  - `CL_M10_MotionLogic::M10_begin()` 및 `CL_MON_Monitor::begin()`(PSRAM Warm 버퍼 + LittleFS Cold 파일 헤더 초기화) 완료[span_19](start_span)[span_19](end_span)[span_20](start_span)[span_20](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- 대기 경계층 미기상학 모델(**3단계 기류 위상 + 12밴드 von Kármán 난류 스펙트럼 + 확률적 돌풍 + 열기포 포락선 + 관성 필터**)로 자연풍 파형을 실시간 생성하고, PIR 재실 판정(`M10`) 및 **2계층(PSRAM Warm 1시간 + LittleFS Cold 7일/30일) 시계열 이력 저장소(`MON`)**를 운영함[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span).

### 2.2 세부 기능 분할 (`FN-05-01` ~ `FN-05-04`)
- **`FN-05-01` 바람 파라미터 해석 솔버 (`S20_WindSolver`)**: 10종 프리셋(`ST_A20_PresetEntry_t`) × 5종 스타일 배수(`ST_A20_StyleEntry_t`) × 세그먼트 오버라이드(`ST_A20_SegmentOverride_t`)를 결합해 `ST_A20_ResolvedWind_t` 산출[span_26](start_span)[span_26](end_span)
- **`FN-05-02` 대기역학 자연풍 물리 시뮬레이션 (`S10_Simul`)**: 위상 전이(`CALM`/`NORMAL`/`STRONG`), 12밴드 난류, 돌풍/열기포, 관성 필터, 60초 이동 평균 및 120-entry 차트 링버퍼 관리[span_27](start_span)[span_27](end_span)[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span)[span_30](start_span)[span_30](end_span)
- **`FN-05-03` PIR 모션 재실 판정 로직 (`M10_MotionLogic`)**: 감지 시각(`lastDetected_ms`) 기반 `holdSec` 단일 유지 타이머 관리 및 상태 전이 콜백(`_onChange`) 발행[span_31](start_span)[span_31](end_span)
- **`FN-05-04` 2계층 Warm/Cold 모니터링 이력 관리자 (`CT10_Monitor`)**: 1초/30초 PSRAM 링버퍼 적재, 5분 버킷 집계(`_aggregateWind`/`Sensor`), 1시간 주기 LittleFS 바이너리 순환 파일 플러시(`flushCold`), CSV 내보내기 및 64-event 세션 타임라인 관리[span_32](start_span)[span_32](end_span)[span_33](start_span)[span_33](end_span)

### 2.3 핵심 물리 수식 및 비즈니스 규칙
1. **바람 파라미터 결합 규칙 (`S20_resolveWindParams`)**[span_34](start_span)[span_34](end_span):
   - 프리셋 기본값(`windIntensity`, `windVariability`, `gustFrequency`, `thermalBubbleStrength`)에 스타일 배수(`intensityFactor`, `variabilityFactor`, `gustFactor`, `thermalFactor`)를 곱함[span_35](start_span)[span_35](end_span).
   - `p_override->enabled == true`이고 각 파라미터가 `>= 0.0f`인 경우 프리셋×스타일 연산 결과를 사용자 지정 절대값(`0.0 ~ 100.0%`)으로 덮어씀[span_36](start_span)[span_36](end_span).
   - `minFan <= fanLimit` 관계 보정 및 `turbulenceLengthScale >= 1.0f`, `thermalBubbleStrength >= 0.1f` 하한 보장[span_37](start_span)[span_37](end_span).
2. **프레임 레이트 독립적 포아송 이벤트 확률 (`S10_probFromRatePerSec`)**[span_38](start_span)[span_38](end_span):
   $$P = 1 - e^{-\lambda \cdot \Delta t}$$
   - 돌풍(`gustProbBase`, 기본 `0.040/s`) 및 열기포(`thermalFreqBase`, 기본 `0.022/s`)는 틱당 확률이 아닌 초당 발생률($\lambda$)로 정의되어, 틱 지터나 주기가 변해도 단위 시간당 발생 빈도가 일정하게 유지됨[span_39](start_span)[span_39](end_span)[span_40](start_span)[span_40](end_span).
3. **12밴드 von Kármán 난류 스펙트럼 합성 (`calcTurb`)**[span_41](start_span)[span_41](end_span):
   - 주파수 대역 $i = 1 \dots 12$ ($n = 0.1i$, $f = n U / L$)에 대해 스펙트럼 밀도 $S(f) = \frac{4 \sigma^2 (L/U)(1 + 70.8 (fL/U)^2)}{(1 + 70.8 (fL/U)^2)^{5/6}}$ 를 계산하고 지수 이동 상관 필터($e^{-\Delta t / \tau}$)로 `spectralEnergyBuf`를 갱신함[span_42](start_span)[span_42](end_span)[span_43](start_span)[span_43](end_span).
4. **관성 필터 및 풍속 → PWM 변환 (`S10_Simul_Core_0203.cpp`)**[span_44](start_span)[span_44](end_span):
   - 관성 모멘텀: $M_t = \text{clamp}(0.85 \cdot M_{t-1} + 0.15 \cdot (V_{\text{target}} - V_{\text{cur}}) \cdot r_{\text{change}} \cdot \Delta t, -0.5, 0.5)$[span_45](start_span)[span_45](end_span)[span_46](start_span)[span_46](end_span)
   - 순간 풍속: $V_{\text{cur}} = \text{clamp}(V_{\text{cur}} + M_t + E_{\text{turb}}, 0.2, 11.0)\text{ [m/s]}$[span_47](start_span)[span_47](end_span)[span_48](start_span)[span_48](end_span)
   - PWM 변환: $\text{PWM}_{\%} = ((10.0 \cdot V_{\text{cur}} + 10.0) \cdot I_{\text{gust}} + C_{\text{thermal}} \cdot 5.0) \cdot \frac{\text{userIntensity}}{100}$ 후 `CL_P10_PWM::applyFanConfigCurve()` 적용[span_49](start_span)[span_49](end_span)[span_50](start_span)[span_50](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 주요 데이터 구조체 (`S10_Simul_0203.h`, `CT10_Monitor_0203.h`, `M10_MotionLogic_0203.h`)[span_51](start_span)[span_51](end_span)[span_52](start_span)[span_52](end_span)[span_53](start_span)[span_53](end_span)
- **`CL_S10_Simulation::ST_ChartEntry` (120-entry 차트 링버퍼 원소)**[span_54](start_span)[span_54](end_span):
  - `timestamp` (`uint64_t` Epoch ms), `wind_speed`, `target_wind`, `pwm_duty`, `intensity`, `variability`, `turbulence_sigma` (`float`), `preset_index` (`uint8_t`), `gust_active`, `thermal_active` (`bool`)[span_55](start_span)[span_55](end_span)
- **Warm PSRAM 링버퍼 구조체 (`CT10_Monitor_0203.h`)**:
  - `ST_MON_WindRaw_t` (`16B` × `3,600` = `57.6KB`, 1시간 @ 1초): `t`, `wind_x10`, `target_x10`, `pwm_x10`, `preset_idx`, `flags` (`bit0=gust`, `bit1=thermal`)[span_56](start_span)[span_56](end_span)[span_57](start_span)[span_57](end_span)
  - `ST_MON_SensorRaw_t` (`8B` × `120` = `960B`, 1시간 @ 30초): `t`, `temp_x10`, `humidity`, `motion`[span_58](start_span)[span_58](end_span)[span_59](start_span)[span_59](end_span)
  - `ST_MON_StateEvent_t` (`20B` × `200`), `ST_MON_ConfigEvent_t` (`12B` × `200`), `ST_MON_SystemEvent_t` (`12B` × `200`)[span_60](start_span)[span_60](end_span)[span_61](start_span)[span_61](end_span)
  - `ST_MON_TimelineEvent_t` (`TIMELINE_CAP = 64` 내부 SRAM 링버퍼): `t`, `eventType(0..7)`, `sessionType`, `trigger`, `stepIdx`, `totalSteps`, `profileNo`, `schNo`, `label[32]`[span_62](start_span)[span_62](end_span)
- **Cold LittleFS 바이너리 파일 구조 (`ST_MON_FileHeader_t` 64B + 순환 레코드)**[span_63](start_span)[span_63](end_span):
  - 파일 헤더: `magic = 0x4D4E5731` (`"MNW1"`), `version = 1`, `entry_size`, `capacity`, `head`, `count`, `first_epoch`, `last_epoch`[span_64](start_span)[span_64](end_span)[span_65](start_span)[span_65](end_span)
  - `/lfs/monitor/wind_history.bin`: `ST_MON_Wind5Min_t` (`16B` × `2,016` = 7일 @ 5분)[span_66](start_span)[span_66](end_span)
  - `/lfs/monitor/sensor_history.bin`: `ST_MON_Sensor5Min_t` (`16B` × `2,016` = 7일 @ 5분)[span_67](start_span)[span_67](end_span)
  - `/lfs/monitor/state_history.bin` (`1,680`건), `config_history.bin` (`600`건, 30일), `system_history.bin` (`150`건)[span_68](start_span)[span_68](end_span)

### 3.2 입출력 데이터
- **입력 (Input)**: `ST_A20_ResolvedWind_t` (목표 바람 파라미터), `ST_A20_MotionConfig_t` (주기 및 시뮬레이션 설정), `ST_MON_Snapshot_t` (매 틱 제어/센서 상태 스냅샷), PIR 감지 이벤트(`feedPIR(bool)`)[span_69](start_span)[span_69](end_span)[span_70](start_span)[span_70](end_span)[span_71](start_span)[span_71](end_span)
- **출력 (Output)**: `CL_P10_PWM::setDutyPercent()`, 차트/상태 JSON (`toJson`, `toChartJson`), 모니터링 이력 JSON (`queryWind/State/Config/Sensor/System/PastEvents/Timeline`), CSV 문자열 (`exportCsv`)[span_72](start_span)[span_72](end_span)[span_73](start_span)[span_73](end_span)[span_74](start_span)[span_74](end_span)

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 기류 위상(Wind Phase) 마르코프 전이표 (`updatePhase` / `S10_Simul_Physic_0203.cpp`)[span_75](start_span)[span_75](end_span)[span_76](start_span)[span_76](end_span)
각 위상의 지속시간(`phaseDurationSec`) 만료 시 난수 $r \in [0, 1)$에 따라 다음 위상과 목표 풍속 범위(`baseMinWind ~ baseMaxWind`, 스팬 $\Delta = \text{max} - \text{min}$)가 재설정됨[span_77](start_span)[span_77](end_span).

| 현재 위상 (`phase`) | 지속시간 범위 (`G_S10_PHASE_*`) | 풍속 구간 (`phaseMinWind ~ phaseMaxWind`) | 전이 확률 분포 ($r \in [0, 1)$) |
| :--- | :--- | :--- | :--- |
| **`EN_A20_WIND_PHASE_CALM`** (`0`)[span_78](start_span)[span_78](end_span)[span_79](start_span)[span_79](end_span) | `90.0 ~ 210.0초`[span_80](start_span)[span_80](end_span) | `baseMin ~ baseMin + 0.60·Δ`[span_81](start_span)[span_81](end_span) | $r < 0.7$: `NORMAL` (70%)<br>$r \ge 0.7$: `STRONG` (30%)[span_82](start_span)[span_82](end_span) |
| **`EN_A20_WIND_PHASE_NORMAL`** (`1`)[span_83](start_span)[span_83](end_span)[span_84](start_span)[span_84](end_span) | `120.0 ~ 300.0초`[span_85](start_span)[span_85](end_span) | `baseMin + 0.15·Δ ~ baseMin + 0.85·Δ`[span_86](start_span)[span_86](end_span) | $r < 0.4$: `CALM` (40%)<br>$0.4 \le r < 0.8$: `NORMAL` (40%)<br>$r \ge 0.8$: `STRONG` (20%)[span_87](start_span)[span_87](end_span) |
| **`EN_A20_WIND_PHASE_STRONG`** (`2`)[span_88](start_span)[span_88](end_span)[span_89](start_span)[span_89](end_span) | `60.0 ~ 150.0초`[span_90](start_span)[span_90](end_span) | `baseMin + 0.40·Δ ~ baseMax`[span_91](start_span)[span_91](end_span) | $r < 0.7$: `NORMAL` (70%)<br>$r \ge 0.7$: `CALM` (30%)[span_92](start_span)[span_92](end_span) |

### 4.2 시뮬레이션 및 모니터링 틱 처리 시퀀스
1. **`S10::tick()` (최소 40ms + 지터)**[span_93](start_span)[span_93](end_span)[span_94](start_span)[span_94](end_span):
   - `updatePhase()` → `calcTurb(v_dt)` → `calcThermalEnvelope()` → `updateGust()` (500ms 게이트) → `updateThermal()` (700ms 게이트) 순차 연산[span_95](start_span)[span_95](end_span)[span_96](start_span)[span_96](end_span)[span_97](start_span)[span_97](end_span).
   - 관성 필터로 `currentWindSpeed` 갱신 및 목표 수렴 임계(`0.5 + V/20`) 도달 시 30% 확률로 `generateTarget()` 호출[span_98](start_span)[span_98](end_span)[span_99](start_span)[span_99](end_span).
   - `applyFan(v_pwmPct)`로 PWM 출력 후 60초 이동 평균(`_updateWindHistory`) 및 1Hz(돌풍/열기포 활성 시 2Hz) 차트 링버퍼(`s_chartBuffer`) 기록[span_100](start_span)[span_100](end_span)[span_101](start_span)[span_101](end_span).
   - 위상 변경 또는 풍속 급변(`> 2.0 m/s`) 시 `CT10_markDirtyFromSim("state"|"chart"|"metrics")` 호출[span_102](start_span)[span_102](end_span).
2. **`M10::tick()` (매 루프)**[span_103](start_span)[span_103](end_span)[span_104](start_span)[span_104](end_span):
   - `v_cfg.pir.enabled && _pir.active` 상태에서 `millis() - _pir.lastDetected_ms > holdSec * 1000UL` 경과 시 `_pir.active = false`로 전환하고 `_onChange` 콜백 호출[span_105](start_span)[span_105](end_span).
3. **`MON::tick()` (매 루프)**[span_106](start_span)[span_106](end_span)[span_107](start_span)[span_107](end_span):
   - 1초마다 `_captureWind()` + 5분 버킷 `_aggregateWind()`, 30초마다 `_captureSensor()` + `_aggregateSensor()`, 상태/설정 변경 즉시 캡처, 1시간(`3,600,000ms`)마다 `flushCold()`로 LittleFS 바이너리 파일에 순환 기록[span_108](start_span)[span_108](end_span).

---

## 5. 외부 인터페이스 명세 (REST API / JSON)
- **REST 엔드포인트 (`APP-01` §3.2, §3.3 참조)**:
  - `GET /api/v001/windDict`, `GET/POST /api/v001/simulation`, `GET /api/v001/sim/state`, `GET /api/v001/sim/chart`, `POST /api/v001/motion/pir/feed`[span_109](start_span)[span_109](end_span)
  - `GET /api/v001/monitor?type=wind|state|config|sensor|system&range=5m|30m|1h`[span_110](start_span)[span_110](end_span)[span_111](start_span)[span_111](end_span)
  - `GET /api/v001/monitor/events?days=7`, `GET /api/v001/monitor/export?type=wind&range=30m&format=csv&all=0|1`, `GET /api/v001/monitor/timeline?since=...`, `GET /api/v001/monitor/session-summary?from=...&to=...`[span_112](start_span)[span_112](end_span)

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | 로그 코드 (`D10_Logger`) |
| :--- | :--- | :--- | :--- |
| **PSRAM 미탑재 또는 할당 실패** | `heap_caps_malloc(..., MALLOC_CAP_SPIRAM)` 반환 `nullptr`[span_113](start_span)[span_113](end_span) | `CL_MON_Monitor::s_enabled = false`로 비활성화, 메인 바람 제어는 정상 유지하고 `/api/v001/monitor` 요청 시 `503` 응답[span_114](start_span)[span_114](end_span)[span_115](start_span)[span_115](end_span) | `[MON] PSRAM alloc failed` (`ERROR`)[span_116](start_span)[span_116](end_span) |
| **Cold 바이너리 파일 헤더 손상** | `_readHeader()`에서 `magic != 0x4D4E5731` 또는 `entry_size` 불일치[span_117](start_span)[span_117](end_span) | `_writeHeader()`가 파일을 재생성하고 사전 할당(pre-allocate)하여 순환 쓰기 무결성 복구[span_118](start_span)[span_118](end_span) | `[MON] Cold file created: ...` (`INFO`)[span_119](start_span)[span_119](end_span) |
| **SNTP 시간 미동기화 중 차트 샘플링** | `S10_millis2EpochMs()`에서 `time(nullptr) <= 1700000000`[span_120](start_span)[span_120](end_span)[span_121](start_span)[span_121](end_span) | `v_epochOk = false`를 반환하여 `timestamp = 0`인 오염된 샘플이 차트 링버퍼에 적재되는 것을 차단[span_122](start_span)[span_122](end_span) | 없음 (무음 스킵)[span_123](start_span)[span_123](end_span) |
| **잘못된 프리셋 코드 입력** | `A20_findPresetIndexByCode()` 반환 `< 0`[span_124](start_span)[span_124](end_span)[span_125](start_span)[span_125](end_span) | `S20_resolveWindParams()`는 `false` 반환, `S10::applyPresetCore()`는 기본 기저 풍속(`1.8 ~ 5.5 m/s`) 폴백 적용[span_126](start_span)[span_126](end_span)[span_127](start_span)[span_127](end_span) | `[CT10] startOverridePreset resolve failed` (`WARN`)[span_128](start_span)[span_128](end_span) |
| **CSV 내보내기 시 힙 OOM 위험** | `exportCsv()` 호출 시 대량 문자열 결합[span_129](start_span)[span_129](end_span) | `p_out.reserve(p_all ? 32768 : 8192)` 사전 예약으로 힙 재할당 단편화 방지[span_130](start_span)[span_130](end_span) | 없음[span_131](start_span)[span_131](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **제로 힙 단편화 (Zero Heap Fragmentation)**:
  - `toChartJson()`은 `std::vector` 대신 `.bss` 고정 배열 `static ST_ChartEntry s_snapshot[120]`(`~4.8KB`)에 뮤텍스 보호 하에 빠르게 복사한 뒤 락을 해제하고 JSON을 직렬화하여 힙 단편화와 락 점유 시간을 동시에 최소화함[span_132](start_span)[span_132](end_span).
  - 60초 이동 평균 풍속(`_updateWindHistory`)은 누적합(`sumWindHistory`) 증분 갱신으로 $O(1)$ 시간 복잡도를 유지함[span_133](start_span)[span_133](end_span).
- **데드락 방지 (`M10` 콜백 제약)**:
  - `CL_M10_MotionLogic::tick()` 내부의 `_onChange(_state)` 콜백은 `M10::s_stateMutex`(L3)를 보유한 상태에서 실행되므로, 콜백 내부에서 상위 계층 `CT10::s_stateMutex`(L2)나 `C10` 뮤텍스를 역순 획득하는 것을 엄격히 금지함[span_134](start_span)[span_134](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-05-01** | 파라미터 결합 및 클램핑 | `S20_resolveWindParams()`에 `OCEAN` + `ACTIVE` + `override{enabled:true, windIntensity:120.0}` 전달 | `windIntensity`가 `100.0f`로 클램핑되고 `minFan <= fanLimit` 및 `valid == true` 반환[span_135](start_span)[span_135](end_span) |
| **TC-05-02** | 물리 풍속 한계 불변식 | `STRONG` 위상 + 최대 돌풍 + 최대 열기포 조건에서 `S10::tick()` 1,000회 연속 실행 | 모든 틱에서 `currentWindSpeed`가 `[0.2f, 11.0f]` (`G_S10_WIND_MIN/MAX_MS`) 범위를 절대 이탈하지 않음[span_136](start_span)[span_136](end_span)[span_137](start_span)[span_137](end_span) |
| **TC-05-03** | PIR 단일 유지 타이머 | `holdSec = 10` 설정 후 `POST /api/v001/motion/pir/feed` (`{"pir":true}`) 호출 및 경과 시간 측정 | `t = 0~9s` 구간 `isActive() == true`, `t > 10s` 경과 즉시 `isActive() == false` 전이 (2배 연장 버그 없음)[span_138](start_span)[span_138](end_span)[span_139](start_span)[span_139](end_span) |
| **TC-05-04** | Warm/Cold 5분 집계 및 CSV | 10분간 `MON::tick()` 실행 후 `GET /api/v001/monitor?type=wind&range=5m` 및 `/export?type=wind&format=csv` 요청 | 1초 해상도 JSON 배열 반환 및 `t,avg,min,max,pwm_avg,preset,gust,thermal` 헤더를 포함한 CSV 다운로드 성공[span_140](start_span)[span_140](end_span)[span_141](start_span)[span_141](end_span) |

