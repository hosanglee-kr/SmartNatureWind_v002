# Graph Report - SmartNatureWind_v002  (2026-10-21)

## Corpus Check
- 141 files · ~159,757 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .css 11, (none) 8, .csv 1)

## Summary
- 1974 nodes · 5198 edges · 83 communities (81 shown, 2 thin omitted)
- Extraction: 62% EXTRACTED · 38% INFERRED · 0% AMBIGUOUS · INFERRED: 1970 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Architecture Contracts & State
- Architecture Contracts & State
- FSM State Transitions
- FSM State Transitions
- Web API & Networking
- Web API & Networking
- Architecture Contracts & State
- FSM State Transitions
- Architecture Contracts & State
- Web API & Networking
- Web API & Networking
- System Specifications
- FSM State Transitions
- FSM State Transitions
- Device Control & Broker
- FSM State Transitions
- JsonArrayConst
- Web API & Networking
- CL_TM10_TimeManager
- Web API & Networking
- Web API & Networking
- A23_Com_ResetCfg_0201h
- FSM State Transitions
- Web API & Networking
- 000constjs
- Web API & Networking
- EN_A20_segment_mode_t
- Web API & Networking
- FSM State Transitions
- A20_resetSchedulesDefault
- _buildPathWithSuffix
- C10_Config_WindDc_CRUD_02
- Web API & Networking
- Build Guides
- FSM State Transitions
- FSM State Transitions
- applySegmentOff
- FSM State Transitions
- Web API & Networking
- wifi
- A20_findPresetIndexByCode
- File
- Web API & Networking
- FSM State Transitions
- Path
- Web API & Networking
- 050wsjs
- Web API & Networking
- System Specifications
- 033utiltemplatejs
- 130uiformjs
- _bindConnectionStatus
- FSM State Transitions
- Web API & Networking
- CL_A40_MutexGuard_Semapho
- FSM State Transitions
- Web API & Networking
- 034utiltoastjs
- Web API & Networking
- applyPresetCore
- _      _
- 230pageprofilesjs
- deleteProfile
- _     _
- 060storejs
- 210pagechartjs
- 220pageschedulejs
- Web API & Networking
- _       _
- 120uichartjs
- 240pagesettingsjs
- FSM State Transitions
- 030utiltimejs
- 031utildomjs
- 260pagefirmwarejs
- 290pageaijs
- 032utillogjs
- 280pagelogsjs
- 030utilleveljs
- FSM State Transitions
- C10_Config_Core_0201cpp
- Web API & Networking
- Doc todo001

## God Nodes (most connected - your core abstractions)
1. `Doc: 0200_004_백앤드리팩토링` - 418 edges
2. `Doc: 0200_001` - 215 edges
3. `Doc: SPEC_0200.md — Smart Nature Wind v0200 종합 기술 사양서` - 150 edges
4. `Doc: FRONTEND_IMPL_0200.md — 프론트엔드 최적 재설계 v3.0 (그린필드)` - 139 edges
5. `Doc: CONTRACT_0200.md — 동시성 경계 및 API 계약` - 137 edges
6. `Doc: STATE_0200.md — 상태 소유권 및 FSM 명세` - 126 edges
7. `Doc: 0200_003` - 113 edges
8. `Doc: FLOW_0200.md — 데이터 흐름 및 시퀀스 명세` - 112 edges
9. `CL_CT10_ControlManager` - 111 edges
10. `Doc: TEST_PLAN_0200.md — 회귀 테스트 절차서 (v2.3)` - 108 edges

## Surprising Connections (you probably didn't know these)
- `Doc: 🌌 Antigravity 환경 설정 가이드` --references--> `A00_init()`  [INFERRED]
  agent.md → src/v0200/A00_Main_0201.cpp
- `Doc: 🌌 Antigravity 환경 설정 가이드` --references--> `A00_run()`  [INFERRED]
  agent.md → src/v0200/A00_Main_0201.cpp
- `Doc: Smart Nature Wind (WindScape)` --references--> `system`  [INFERRED]
  README.md → src/v0200/A20_Const_Sys_0201.h
- `Doc: WindScape Configuration` --references--> `system`  [INFERRED]
  wind-scape.yaml → src/v0200/A20_Const_Sys_0201.h
- `Doc: 🌌 Antigravity 환경 설정 가이드` --references--> `path`  [INFERRED]
  agent.md → src/v0200/A20_Const_Sys_0201.h

## Import Cycles
- None detected.

## Communities (83 total, 2 thin omitted)

### Community 0 - "Architecture Contracts & State"
Cohesion: 0.03
Nodes (93): EN_A20_WindPhase_t, 상태 변수 소유권 및 접근 매트릭스, AutoOff 래치 및 이벤트 상태, AutoOff offTime 재트리거 방지, Batch D-1 Dirty 배치 소비, Batch F-5: profile fall-through 차단, CT10 메인 제어 상태머신 (7-State FSM), 상태 전이 우선순위 (`decideRunSource`) (+85 more)

### Community 1 - "Architecture Contracts & State"
Cohesion: 0.03
Nodes (82): Preferences, loop(), A00_init(), A00_run(), begin, loadAll, patchMotionFromJson, processPendingFree (+74 more)

### Community 2 - "FSM State Transitions"
Cohesion: 0.06
Nodes (62): CL_M10_MotionLogic, initAutoOffFromSchedule, initAutoOffFromUserProfile, CL_CT10_ControlManager::startUserProfileByNo(), CL_CT10_ControlManager::applyDecision(), get(), set(), get() (+54 more)

### Community 3 - "FSM State Transitions"
Cohesion: 0.05
Nodes (48): ackEvent(), addProfile(), addSchedule(), addWindProfile(), _appendMessage(), buildQuery(), clear(), debug() (+40 more)

### Community 4 - "Web API & Networking"
Cohesion: 0.05
Nodes (56): cstring, ctime, ST_A20_CommonAsset_t, isCommon, path, uri, ST_A20_NvsSpecConfig_t, entries (+48 more)

### Community 5 - "Web API & Networking"
Cohesion: 0.07
Nodes (52): ackEvent(), addProfile(), addSchedule(), addWindProfile(), ApiError, buildQuery(), checkFw(), deleteProfile() (+44 more)

### Community 6 - "Architecture Contracts & State"
Cohesion: 0.04
Nodes (53): 📋 목차, 릴리스 차단 필수 세트 (최소 13건), 백엔드 Batch A~F 신규, CI, Doc: TEST_PLAN_0200.md — 회귀 테스트 절차서 (v2.3), Phase 7 릴리스 게이트, T-10. N-1 (`lastReloadOk`) — 상태 노출, T-11. G-1 (Accept-Encoding) — gzip/raw 분 (+45 more)

### Community 7 - "FSM State Transitions"
Cohesion: 0.04
Nodes (48): EN_CT10_run_source_t, CL_CT10_ControlManager, ackEventState, applyDecision, applyMotionSimConfigToSim, clearManual, consumeDirtyChart, consumeDirtyMetrics (+40 more)

### Community 8 - "Architecture Contracts & State"
Cohesion: 0.08
Nodes (30): arduino, cmath, ST_A20_ReDirectItem_t, uriFrom, uriTo, A20_resetRedirectItemDefault(), 시스템 개요, 모듈 구성 및 파일 매핑 (0201 접미사) (+22 more)

### Community 9 - "Web API & Networking"
Cohesion: 0.07
Nodes (47): CL_W10_WebAPI, broadcastChart, broadcastMetrics, broadcastState, broadcastSummary, G_W10_PAGES_JSON, routeAuthTest, routeConfigDirtySave (+39 more)

### Community 10 - "Web API & Networking"
Cohesion: 0.06
Nodes (33): 규칙 준수 여부 점검 (Audit), Doc: /maintenance - 규칙 유지보수 워크플로우, 규칙 고도화 (Improvement), 코드 보완 (Refactor), EN_L10_LogLevel_t, setup(), CL_D10_Logger, BUFFER_SIZE (+25 more)

### Community 11 - "System Specifications"
Cohesion: 0.06
Nodes (43): CL_C10_ConfigManager, _dirty_motion, _dirty_nvsSpec, _dirty_schedules, _dirty_system, _dirty_userProfiles, _dirty_webPage, _dirty_wifi (+35 more)

### Community 12 - "FSM State Transitions"
Cohesion: 0.06
Nodes (20): CL_CT10_ControlManager::applyManual(), CL_CT10_ControlManager::applyMotionSimConfigToSim(), CL_CT10_ControlManager::begin(), CL_CT10_ControlManager::exportSimJson(), CL_CT10_ControlManager::feedPIR(), CL_CT10_ControlManager::patchSimFromJson(), CL_CT10_ControlManager::setMotion(), CL_M10_MotionLogic (+12 more)

### Community 13 - "FSM State Transitions"
Cohesion: 0.05
Nodes (39): autoOffRt, overrideState, runSource, mount(), _refresh(), unmount(), 📋 목차, 화면 레이아웃 (1280×800) (+31 more)

### Community 14 - "Device Control & Broker"
Cohesion: 0.05
Nodes (41): checkAutoOff, findActiveScheduleIndex, isMotionBlocked, onAutoOffTriggered, tickSegmentSequence, CL_CT10_ControlManager::tickSchedule(), CL_CT10_ControlManager::tickUserProfile(), CL_CT10_ControlManager::decideRunSource() (+33 more)

### Community 15 - "FSM State Transitions"
Cohesion: 0.08
Nodes (38): dns, EN_WF10_req_result_t, esp_netif, ip_addr, CL_WF10_WiFiManager, applyConfig, _encTypeToString, _ensureWifiTask (+30 more)

### Community 16 - "JsonArrayConst"
Cohesion: 0.09
Nodes (36): JsonArrayConst, JsonObject, JsonVariant, memory, shared_ptr, _A40__callerOrUnknown(), CL_A40_muxGuard_Critical, _flagSpinlock (+28 more)

### Community 17 - "Web API & Networking"
Cohesion: 0.08
Nodes (30): get(), capitalize(), _clearMain(), current(), dispatch(), init(), navigate(), parseHash() (+22 more)

### Community 18 - "CL_TM10_TimeManager"
Cohesion: 0.13
Nodes (34): esp_sntp, CL_TM10_TimeManager, applyTimeConfig, begin, _copySysTime, getLocalTime, _isTimeSane, isTimeSyncedRecently (+26 more)

### Community 19 - "Web API & Networking"
Cohesion: 0.14
Nodes (31): factoryResetFromDefault, patchSystemFromJson, patchWifiFromJson, TM10_requestTimeSync(), applySystemRuntimeFromConfig, checkApiKey, parseJsonBody, sendJson (+23 more)

### Community 20 - "Web API & Networking"
Cohesion: 0.11
Nodes (17): algorithm, arduinojson, cstdio, esp_task_wdt, espasyncwebserver, freertos, littlefs, semphr (+9 more)

### Community 21 - "A23_Com_ResetCfg_0201h"
Cohesion: 0.10
Nodes (31): A20_resetAdjustDeltaDefault(), A20_resetAutoOffDefault(), A20_resetMotionCommonDefault(), A20_resetPirDefault(), A20_resetPresetEntryDefault(), A20_resetResolvedWindDefault(), A20_resetSchAutoOffDefault(), A20_resetScheduleItemDefault() (+23 more)

### Community 22 - "FSM State Transitions"
Cohesion: 0.11
Nodes (21): EN_CT10_state_t, calcOverrideRemainSec, getCurrentHumidityMock, CL_CT10_ControlManager::consumeAllDirty(), CL_CT10_ControlManager::exportChartJson(), CL_CT10_ControlManager::exportMetricsJson(), CL_CT10_ControlManager::exportStateJson_v02(), CL_CT10_ControlManager::exportSummaryJson() (+13 more)

### Community 23 - "Web API & Networking"
Cohesion: 0.08
Nodes (28): s_lastReloadOk, s_pendingReload, ❌ 수정 전 (§3 감사 이력, I-4까지만), ✅ 수정 후 (§3, I-5/I-6 추가), 🔧 [4] `CT10_Ctl_0200.h` — B-N-1a, ✅ 추가 삽입 (§5.2 뒤에 §5.3 신규), Doc: 0200_003, 연계 검증 도구 (`src/v0200/tools_0200/`) (+20 more)

### Community 24 - "000constjs"
Cohesion: 0.08
Nodes (22): applyTo(), getLang(), setLang(), t(), navigate(), 설계 철학 (기존 구조의 문제 → 해결), 기존 구조의 3대 문제, `999.app.js` (부트스트랩) (+14 more)

### Community 25 - "Web API & Networking"
Cohesion: 0.07
Nodes (28): 📖 이 설명서 사용법, 자연풍 프리셋 10종, 스마트 센서 연동 및 3대 자동 종료 (AutoOff), 바람 스타일 5종, 대 스마트 자동 종료 (AutoOff), 실시간 물리 시뮬레이션 차트 (`/chart_t3`), Doc: Smart Nature Wind v0200 — 사용자 매뉴얼 (User Manual), 자주 묻는 질문 (FAQ) 및 문제 해결 (+20 more)

### Community 26 - "EN_A20_segment_mode_t"
Cohesion: 0.15
Nodes (25): EN_A20_segment_mode_t, A20_modeFromString(), A20_modeToString(), A20_resetUserProfilesDefault(), ST_A20_UserProfilesRoot_t, CL_C10_ConfigManager::addUserProfilesFromJson(), CL_C10_ConfigManager::updateUserProfilesFromJson(), JsonDocument (+17 more)

### Community 27 - "Web API & Networking"
Cohesion: 0.09
Nodes (26): label, Doc: index, 기술 스택 및 제약, 마이그레이션 (기존 8파일 → 11파일), CI 검증 (선택, v0202), Dashboard 진입 (i18n 적용), Doc: FRONTEND_IMPL_0200.md — 프론트엔드 상세 구현 설계서 (v1.1), FSM 배지 (i18n 자동) (+18 more)

### Community 28 - "FSM State Transitions"
Cohesion: 0.10
Nodes (19): DHT, A40_parseHHMMtoMin_24h(), CL_CT10_ControlManager::findActiveScheduleIndex(), CL_CT10_ControlManager::getCurrentHumidityMock(), CL_CT10_ControlManager::getCurrentTemperatureMock(), CL_CT10_ControlManager::initAutoOffFromSchedule(), CL_CT10_ControlManager::initAutoOffFromUserProfile(), CL_CT10_ControlManager::isMotionBlocked() (+11 more)

### Community 29 - "A20_resetSchedulesDefault"
Cohesion: 0.17
Nodes (24): A20_resetSchedulesDefault(), ST_A20_SchedulesRoot_t, CL_C10_ConfigManager::addScheduleFromJson(), CL_C10_ConfigManager::updateScheduleFromJson(), JsonDocument, CL_C10_ConfigManager::patchSchedulesFromJson(), CL_C10_ConfigManager::toJson_Schedules(), JsonDocument (+16 more)

### Community 30 - "_buildPathWithSuffix"
Cohesion: 0.11
Nodes (24): _buildPathWithSuffix(), JsonDocument, _io_callerOrUnknown(), Load_File2JsonDoc_V21(), _parseJsonFileToDoc(), Save_JsonDoc2File_V21(), CL_C10_ConfigManager::begin(), CL_C10_ConfigManager::_loadCfgJsonFile() (+16 more)

### Community 31 - "C10_Config_WindDc_CRUD_02"
Cohesion: 0.15
Nodes (20): CL_C10_ConfigManager::addWindProfileFromJson(), CL_C10_ConfigManager::updateWindProfileFromJson(), JsonDocument, C10_hasDupCode(), CL_C10_ConfigManager::patchWindDictFromJson(), CL_C10_ConfigManager::toJson_WindDict(), JsonDocument, ST_A20_WindDict_t (+12 more)

### Community 32 - "Web API & Networking"
Cohesion: 0.09
Nodes (24): 기본 환경, 🏗️ 1. 개발 환경 개요, 📁 2. 프로젝트 소스 및 디렉토리 구조, 📌 2단계 필수 탐색 프로토콜 (Two-Step Navigation Pr, ⚙️ 3. 주요 설정 (`platformio.ini`), 🌐 4. 주요 웹/API 엔드포인트 (v0200), 🛠️ 5. 빌드 및 배포 가이드, 🤖 6. Antigravity와 협업 가이드 (+16 more)

### Community 33 - "Build Guides"
Cohesion: 0.08
Nodes (24): Build Guides, Configuration Reference, Core Wind Metrics**, Demo, Doc: Smart Nature Wind (WindScape), Fan Selection, Features, Hardware (+16 more)

### Community 34 - "FSM State Transitions"
Cohesion: 0.11
Nodes (24): _applyPresetList(), applyTo(), _bindLangToggle(), checkFw(), diag(), escape(), getConfigDirty(), getLang() (+16 more)

### Community 35 - "FSM State Transitions"
Cohesion: 0.22
Nodes (23): _exportJson(), getStateMeta(), handle(), _mountComponents(), _onAdd(), _onIntensityChange(), _onPresetSelect(), _onReload() (+15 more)

### Community 36 - "applySegmentOff"
Cohesion: 0.11
Nodes (21): applySegmentOff, applySegmentOn, findPresetNameByCode, findStyleNameByCode, updateRunCtxOnSegmentOff, updateRunCtxOnSegmentOn_Profile, updateRunCtxOnSegmentOn_Schedule, CL_CT10_ControlManager::applySegmentOff() (+13 more)

### Community 37 - "FSM State Transitions"
Cohesion: 0.15
Nodes (22): ai(), _applyInitial(), _applyInitialState(), chart(), dashboard(), delegate(), diagnostics(), epochToTimeStr() (+14 more)

### Community 38 - "Web API & Networking"
Cohesion: 0.19
Nodes (10): new, A20_findPresetByCode(), A20_findSegModeByCode(), A20_findStyleByCode(), A20_getPresetNameByCode(), A20_getStaticPresetIndexByCode(), String, ST_A20_SegmentMode_t (+2 more)

### Community 39 - "wifi"
Cohesion: 0.13
Nodes (20): wifi, ST_A20_NvsEntry_t, defaultValue, key, type, active, stop(), _pwm (+12 more)

### Community 40 - "A20_findPresetIndexByCode"
Cohesion: 0.12
Nodes (15): A20_findPresetIndexByCode(), A20_findStyleIndexByCode(), ST_A20_WindDict_t, applyManualResolved, CL_CT10_ControlManager::startOverridePreset(), ST_A20_AdjustDelta_t, CL_S10_Simulation::applyPresetCore(), CL_S10_Simulation::generateTarget() (+7 more)

### Community 41 - "File"
Cohesion: 0.13
Nodes (17): File, ST_A20_PageAsset_t, path, uri, ST_A20_PageItem_t, enable, isMain, order (+9 more)

### Community 42 - "Web API & Networking"
Cohesion: 0.15
Nodes (16): addWindProfileFromJson, deleteSchedule, deleteUserProfiles, deleteWindProfile, loadWindDict, patchUserProfilesFromJson, saveDirtyConfigs, toJson_WindDict (+8 more)

### Community 43 - "FSM State Transitions"
Cohesion: 0.15
Nodes (10): CL_M10_MotionLogic, _onChange, _pir, s_stateMutex, _state, JsonDocument, SemaphoreHandle_t, ST_M10_MotionState_t (+2 more)

### Community 44 - "Path"
Cohesion: 0.24
Nodes (15): gzip, Path, pathlib, scons_script, shutil, build_css_bundle(), build_js_bundle(), find_project_root() (+7 more)

### Community 45 - "Web API & Networking"
Cohesion: 0.19
Nodes (6): closeAll(), get(), getApiKey(), getState(), start(), WsClient

### Community 46 - "050wsjs"
Cohesion: 0.22
Nodes (4): closeAll(), get(), initByLevel(), WsClient

### Community 47 - "Web API & Networking"
Cohesion: 0.16
Nodes (14): addScheduleFromJson, addUserProfilesFromJson, getRootSnapshot, toJson_Motion, toJson_NvsSpec, toJson_Schedules, toJson_System, toJson_UserProfiles (+6 more)

### Community 48 - "System Specifications"
Cohesion: 0.22
Nodes (14): saveMotionConfig, saveNvsSpecConfig, saveSchedules, saveSystemConfig, saveUserProfiles, saveWebPageConfig, saveWifiConfig, saveWindDict (+6 more)

### Community 49 - "033utiltemplatejs"
Cohesion: 0.27
Nodes (13): ai(), chart(), dashboard(), diagnostics(), firmware(), info(), logs(), network() (+5 more)

### Community 50 - "130uiformjs"
Cohesion: 0.20
Nodes (9): append(), clear(), _levelClass(), refresh(), render(), set(), setItems(), setSelected() (+1 more)

### Community 51 - "_bindConnectionStatus"
Cohesion: 0.19
Nodes (9): _bindConnectionStatus(), _bindLastUpdate(), _bindStore(), clockStr(), _ensure(), error(), show(), startClock() (+1 more)

### Community 52 - "FSM State Transitions"
Cohesion: 0.18
Nodes (7): Adafruit_NeoPixel, CL_A30_LED, _lastLedMs, _ledState, _numPixels, _pin, _pixel

### Community 53 - "Web API & Networking"
Cohesion: 0.24
Nodes (11): AsyncWebServerResponse, _applyHeaders, CL_W10_WebAPI::W10_registerStaticRoute(), CL_W10_WebAPI::_applyHeaders(), CL_W10_WebAPI::checkApiKey(), CL_W10_WebAPI::parseJsonBody(), CL_W10_WebAPI::sendJson(), CL_W10_WebAPI::sendText() (+3 more)

### Community 54 - "CL_A40_MutexGuard_Semapho"
Cohesion: 0.24
Nodes (6): CL_A40_MutexGuard_Semaphore, _acquired, _caller, _mutexPtr, SemaphoreHandle_t, TickType_t

### Community 55 - "FSM State Transitions"
Cohesion: 0.29
Nodes (10): _applyInitialState(), _applyPresetList(), _bindStore(), mount(), _mountComponents(), _onIntensityChange(), _onPowerToggle(), _onPresetSelect() (+2 more)

### Community 56 - "Web API & Networking"
Cohesion: 0.23
Nodes (10): sendText, CL_W10_WebAPI::routeGeminiProxy(), String, W10_callGeminiApi(), W10_getGeminiApiKey(), CL_W10_WebAPI::getUploadPath(), CL_W10_WebAPI::routeUpdate(), String (+2 more)

### Community 57 - "034utiltoastjs"
Cohesion: 0.33
Nodes (8): _ensure(), error(), handle(), info(), show(), success(), warn(), wrap()

### Community 58 - "Web API & Networking"
Cohesion: 0.20
Nodes (11): atLeast(), capitalize(), _clearMain(), current(), dispatch(), init(), initByLevel(), parseHash() (+3 more)

### Community 59 - "applyPresetCore"
Cohesion: 0.25
Nodes (10): applyPresetCore, initPhaseFromBase, resetDefaults, CL_S10_Simulation::applyResolvedWind(), CL_S10_Simulation::begin(), CL_S10_Simulation::resetDefaults(), ST_A20_ResolvedWind_t, CL_S10_Simulation::patchFromJson() (+2 more)

### Community 60 - "_      _"
Cohesion: 0.20
Nodes (10): _“왜 평범한 선풍기 대신, 스마트 네이처 윈드인가?”_, 🌿 1. 단순한 ‘바람’이 아닌, ‘자연’을 전하다, ⚙️ 2. 대기역학을 품은 바람 — Realistic Wind Physi, 🚀 3. 외부 허브 없는 Standalone 풀스택 시스템, 🤖 4. 지능형 센서 & 하드웨어 확장, 📅 5. 개인화 스케줄러 & 사용자 프로필, 🗺️ 6. 10종 자연풍 테마 프리셋, 🔋 7. Plug & Play — 간편한 구성과 확장 (+2 more)

### Community 61 - "230pageprofilesjs"
Cohesion: 0.38
Nodes (8): _highlightActive(), _load(), mount(), _onDelete(), _onStart(), _onStop(), _renderList(), unmount()

### Community 62 - "deleteProfile"
Cohesion: 0.22
Nodes (10): deleteProfile(), deleteSchedule(), _highlightActive(), listProfiles(), listSchedules(), _load(), _onDelete(), _onToggle() (+2 more)

### Community 63 - "_     _"
Cohesion: 0.22
Nodes (9): _“공간에 스미는, 가장 편안한 자연의 숨결.”_, 🌬️ 1. 제품 개요, 🌟 2. 제품 가치 & 핵심 컨셉, ⚙️ 3. 주요 기술 특징, 🗺️ 4. 환경 프리셋 (10가지 자연 모드), 💡 5. 사용자 경험 중심 기능, 🌈 6. 제품 포지션 & 브랜드 메시지, 📦 7. 요약 포인트 (한눈에 보는 특징) (+1 more)

### Community 64 - "060storejs"
Cohesion: 0.28
Nodes (3): start(), stop(), Store

### Community 65 - "210pagechartjs"
Cohesion: 0.42
Nodes (7): _applyInitial(), _exportCsv(), mount(), _onWsChart(), _pushPoint(), _redrawRange(), unmount()

### Community 66 - "220pageschedulejs"
Cohesion: 0.47
Nodes (7): _load(), mount(), _onAdd(), _onDelete(), _onToggle(), _renderList(), unmount()

### Community 67 - "Web API & Networking"
Cohesion: 0.25
Nodes (8): ApiError, append(), _levelClass(), msToSecLabel(), _trim(), uploadFile(), uploadFirmware(), uploadWithProgress()

### Community 68 - "_       _"
Cohesion: 0.25
Nodes (8): _“왜 평범한 선풍기 대신, 스마트 네이처 윈드 어댑터인가?”_, 🌿 1. 단순한 ‘바람’이 아닌, ‘자연’을 전하다, ⚙️ 2. 대기역학을 품은 바람 — Realistic Wind Physi, 🌈 3. 감성 + 과학의 조화, 🧭 4. 당신의 공간을 ‘자연 환경’으로 바꾸는 디바이스, 🔋 5. Plug & Play — 누구나 쉽게, 즉시 변화, 💡 6. 결론 — 바람을 ‘디자인’하는 시대, Doc: 💨스마트 네이처 윈드 어댑터

### Community 69 - "120uichartjs"
Cohesion: 0.46
Nodes (7): clear(), destroy(), draw(), _drawSeries(), push(), resize(), setMaxPoints()

### Community 70 - "240pagesettingsjs"
Cohesion: 0.43
Nodes (6): _loadSystem(), mount(), _onReload(), _onSave(), unmount(), _waitReloadComplete()

### Community 71 - "FSM State Transitions"
Cohesion: 0.39
Nodes (6): _loadState(), _loadSystemTime(), mount(), _onSaveTime(), _onScan(), unmount()

### Community 73 - "031utildomjs"
Cohesion: 0.33
Nodes (3): escape(), html(), text()

### Community 74 - "260pagefirmwarejs"
Cohesion: 0.43
Nodes (5): _loadVersion(), mount(), _onUploadFile(), _onUploadFw(), unmount()

### Community 75 - "290pageaijs"
Cohesion: 0.43
Nodes (5): _appendMessage(), mount(), _onSend(), _replaceLastAssistant(), unmount()

### Community 76 - "032utillogjs"
Cohesion: 0.40
Nodes (3): debug(), info(), isDebug()

### Community 77 - "280pagelogsjs"
Cohesion: 0.47
Nodes (4): _exportJson(), _loadInitial(), mount(), unmount()

### Community 78 - "030utilleveljs"
Cohesion: 0.60
Nodes (4): applyTo(), atLeast(), current(), set()

### Community 79 - "FSM State Transitions"
Cohesion: 0.40
Nodes (4): ST_W10_MenuState_t, main_path, pages_sorted, vector

### Community 80 - "C10_Config_Core_0201cpp"
Cohesion: 0.50
Nodes (3): fs, CL_C10_ConfigManager::getDirtyStatus(), JsonDocument

### Community 81 - "Web API & Networking"
Cohesion: 0.67
Nodes (3): getDirtyStatus, toJson_All, CL_W10_WebAPI::routeConfigDirtySave()

## Knowledge Gaps
- **440 isolated node(s):** `uri`, `uri`, `pageAssetCount`, `uri`, `isCommon` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 600 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Doc: 0200_004_백앤드리팩토링` connect `FSM State Transitions` to `Architecture Contracts & State`, `Architecture Contracts & State`, `FSM State Transitions`, `Web API & Networking`, `Web API & Networking`, `Architecture Contracts & State`, `FSM State Transitions`, `Architecture Contracts & State`, `Web API & Networking`, `Web API & Networking`, `System Specifications`, `FSM State Transitions`, `FSM State Transitions`, `Device Control & Broker`, `FSM State Transitions`, `JsonArrayConst`, `Web API & Networking`, `CL_TM10_TimeManager`, `Web API & Networking`, `Web API & Networking`, `A23_Com_ResetCfg_0201h`, `FSM State Transitions`, `Web API & Networking`, `Web API & Networking`, `EN_A20_segment_mode_t`, `Web API & Networking`, `FSM State Transitions`, `A20_resetSchedulesDefault`, `_buildPathWithSuffix`, `C10_Config_WindDc_CRUD_02`, `Web API & Networking`, `FSM State Transitions`, `applySegmentOff`, `Web API & Networking`, `wifi`, `A20_findPresetIndexByCode`, `File`, `Web API & Networking`, `FSM State Transitions`, `Path`, `Web API & Networking`, `050wsjs`, `Web API & Networking`, `System Specifications`, `130uiformjs`, `_bindConnectionStatus`, `FSM State Transitions`, `Web API & Networking`, `CL_A40_MutexGuard_Semapho`, `Web API & Networking`, `Web API & Networking`, `applyPresetCore`, `060storejs`, `120uichartjs`, `030utilleveljs`, `FSM State Transitions`, `C10_Config_Core_0201cpp`?**
  _High betweenness centrality (0.391) - this node is a cross-community bridge._
- **Why does `Doc: FRONTEND_IMPL_0200.md — 프론트엔드 최적 재설계 v3.0 (그린필드)` connect `Web API & Networking` to `Architecture Contracts & State`, `FSM State Transitions`, `FSM State Transitions`, `Web API & Networking`, `Web API & Networking`, `FSM State Transitions`, `FSM State Transitions`, `000constjs`, `Web API & Networking`, `FSM State Transitions`, `Web API & Networking`, `FSM State Transitions`, `FSM State Transitions`, `FSM State Transitions`, `Web API & Networking`, `wifi`, `File`, `Path`, `Web API & Networking`, `050wsjs`, `033utiltemplatejs`, `130uiformjs`, `_bindConnectionStatus`, `Web API & Networking`, `FSM State Transitions`, `Web API & Networking`, `034utiltoastjs`, `Web API & Networking`, `230pageprofilesjs`, `060storejs`, `210pagechartjs`, `220pageschedulejs`, `120uichartjs`, `240pagesettingsjs`, `FSM State Transitions`, `030utiltimejs`, `031utildomjs`, `260pagefirmwarejs`, `290pageaijs`, `032utillogjs`, `280pagelogsjs`, `030utilleveljs`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Why does `Doc: 0200_001` connect `Device Control & Broker` to `Architecture Contracts & State`, `Architecture Contracts & State`, `FSM State Transitions`, `FSM State Transitions`, `Web API & Networking`, `Architecture Contracts & State`, `FSM State Transitions`, `Architecture Contracts & State`, `Web API & Networking`, `Web API & Networking`, `System Specifications`, `FSM State Transitions`, `FSM State Transitions`, `FSM State Transitions`, `JsonArrayConst`, `Web API & Networking`, `CL_TM10_TimeManager`, `Web API & Networking`, `Web API & Networking`, `FSM State Transitions`, `Web API & Networking`, `Web API & Networking`, `EN_A20_segment_mode_t`, `Web API & Networking`, `FSM State Transitions`, `A20_resetSchedulesDefault`, `_buildPathWithSuffix`, `C10_Config_WindDc_CRUD_02`, `Web API & Networking`, `wifi`, `File`, `Web API & Networking`, `FSM State Transitions`, `Path`, `Web API & Networking`, `130uiformjs`, `Web API & Networking`, `Web API & Networking`, `applyPresetCore`, `120uichartjs`, `031utildomjs`, `FSM State Transitions`, `C10_Config_Core_0201cpp`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 410 inferred relationships involving `Doc: 0200_004_백앤드리팩토링` (e.g. with `EN_A20_segment_mode_t` and `EN_CT10_run_source_t`) actually correct?**
  _`Doc: 0200_004_백앤드리팩토링` has 410 INFERRED edges - model-reasoned connections that need verification._
- **Are the 184 inferred relationships involving `Doc: 0200_001` (e.g. with `File` and `Path`) actually correct?**
  _`Doc: 0200_001` has 184 INFERRED edges - model-reasoned connections that need verification._
- **Are the 130 inferred relationships involving `Doc: SPEC_0200.md — Smart Nature Wind v0200 종합 기술 사양서` (e.g. with `File` and `main.cpp`) actually correct?**
  _`Doc: SPEC_0200.md — Smart Nature Wind v0200 종합 기술 사양서` has 130 INFERRED edges - model-reasoned connections that need verification._
- **Are the 124 inferred relationships involving `Doc: FRONTEND_IMPL_0200.md — 프론트엔드 최적 재설계 v3.0 (그린필드)` (e.g. with `Path` and `system`) actually correct?**
  _`Doc: FRONTEND_IMPL_0200.md — 프론트엔드 최적 재설계 v3.0 (그린필드)` has 124 INFERRED edges - model-reasoned connections that need verification._