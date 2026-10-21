# Graph Report - SmartNatureWind_v002  (2026-10-22)

## Corpus Check
- 149 files · ~182,244 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: .css 11, (none) 8, .csv 1)

## Summary
- 2346 nodes · 4491 edges · 125 communities (104 shown, 21 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 493 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `07cf16a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CL_S10_Simulation
- CL_N10_NvsManager
- CL_CT10_ControlManager::exportStateJson_v02
- P010_bundle_0202.js
- C10_Config_Sys_0202.cpp
- 040.api.js
- FRONTEND_REQ_0202.md — 프론트엔드 요구사항 및 상세 명세서 (v1.3)
- CL_CT10_ControlManager
- A20_Const_0202.h
- ST_A20_WebPageConfig_t
- CL_D10_Logger
- CL_C10_ConfigManager
- CL_P10_PWM
- FRONTEND_IMPL_0202.md — 프론트엔드 최적 재설계 (v2.0)
- Smart Nature Wind v0202 — 사용자 매뉴얼 (User Manual)
- CL_WF10_WiFiManager
- A25_Com_Utils_0202.h
- FRONTEND_IMPL_0202.md — 프론트엔드 최적 재설계 v3.0 (그린필드)
- CL_TM10_TimeManager
- A00_run
- src_v0202_c10_config_0202
- A20_resetScheduleItemDefault
- CT10_Ctl_IOWS_0202.cpp
- TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.3)
- 5.4 프론트엔드 자산 규격 (v2.4 신규)
- FRONTEND_IMPL_0202.md — 프론트엔드 상세 구현 설계서 (v1.1)
- CL_C10_ConfigManager::addUserProfilesFromJson
- t
- CT10_Ctl_Basic_0202.cpp
- src_v0202_a20_const_sch_0202
- dispatch
- C10_Config_Sch_Util_0202.cpp
- Web API & Networking
- Build Guides
- A20_resetWindDictDefault
- .checkApiKey
- src_v0202_ct10_ctl_0202
- 0200_004_백앤드리팩토링.md
- A23_Com_ResetCfg_0202.h
- Doc: WindScape Configuration
- CT10_Ctl_Ctl_Seg_0202.cpp
- CL_W10_WebAPI
- mount
- CL_M10_MotionLogic
- pio_gzip_0202.py
- .log
- 3. 백엔드 Batch A~F 신규
- .getRootSnapshot
- BUDGET_0202.md — 시간 및 시스템 자원 예산
- S10_Simul_Physic_0202.cpp
- .parseJsonBody
- WsClient
- CL_A30_LED
- W10_Web_Util_0202.cpp
- CL_A40_MutexGuard_Semaphore
- 7.3 Batch A~F 신규
- CL_W10_WebAPI::routeGeminiProxy
- P010_bundle_0202_old.js
- STATE_0202.md — 상태 소유권 및 FSM 명세
- CT10_Ctl_Ctl_0202.cpp
- WsClient
- .applyPresetCore
- CL_S10_Simulation::tick
- 033.util.template.js
- 130.ui.form.js
- 200.page.dashboard.js
- CL_W10_WebAPI::routeStaticAssets
- 034.util.toast.js
- 070.router.js
- html
- .get
- ST_ChartEntry
- 💨 스마트 네이처 윈드 (Smart Nature Wind v0202)
- CL_C10_ConfigManager::saveAll
- html
- 230.page.profiles.js
- CL_W10_WebAPI
- ST_A20_cfg_jsonFile_t
- Store
- ST_W10_PageEntry_t
- 210.page.chart.js
- 220.page.schedule.js
- 120.ui.chart.js
- 240.page.settings.js
- 270.page.network.js
- 030.util.time.js
- 031.util.dom.js
- 260.page.firmware.js
- 290.page.ai.js
- 0200_003.md
- .log
- 032.util.log.js
- 280.page.logs.js
- 020.i18n.js
- 030.util.level.js
- 250.page.diagnostics.js
- Doc: /maintenance - 규칙 유지보수 워크플로우
- 0200_001.md
- 3️⃣ 실행 예시 (검증 시나리오)
- t
- mount
- WsClient
- TM10_TimeMg_0202.cpp
- CL_CT10_ControlManager::tickLoop
- CONTRACT_0202.md — 동시성 경계 및 API 계약
- C10_Config_Extras_0202.cpp
- A20_resetToDefault
- W10_Web_WS_0202.cpp
- append
- ST_A20_PageItem_t
- error
- _load
- .onWiFiConnected
- ST_A20_PageAsset_t
- ST_A20_NvsEntry_t
- startClock

## God Nodes (most connected - your core abstractions)
1. `CL_CT10_ControlManager` - 109 edges
2. `CL_S10_Simulation` - 85 edges
3. `CL_C10_ConfigManager` - 78 edges
4. `CL_W10_WebAPI` - 72 edges
5. `mount()` - 61 edges
6. `mount()` - 54 edges
7. `_fetch()` - 52 edges
8. `_fetch()` - 50 edges
9. `` - 49 edges
10. `_fetch()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `2. 메인 루프 파이프라인 (`A00_run()`)` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/FLOW_0202.md → src/v0202/A00_Main_0202.cpp
- `1. 실행 컨텍스트 (FreeRTOS Task)` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/CONTRACT_0202.md → src/v0202/A00_Main_0202.cpp
- `4. 태스크 경계별 함수 호출 매트릭스` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/CONTRACT_0202.md → src/v0202/A00_Main_0202.cpp
- `7.1 기존 (F-01~I-6)` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/CONTRACT_0202.md → src/v0202/A00_Main_0202.cpp
- `T-1. F-03 (M10 tick) — PIR holdSec 정상 만료` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/TEST_PLAN_0202.md → src/v0202/A00_Main_0202.cpp

## Import Cycles
- None detected.

## Communities (125 total, 21 thin omitted)

### Community 0 - "CL_S10_Simulation"
Cohesion: 0.03
Nodes (59): CL_S10_Simulation, active, avgWindCached, baseMaxWind, baseMinWind, CHART_CAPACITY, currentWindSpeed, _fanCfgSnap (+51 more)

### Community 1 - "CL_N10_NvsManager"
Cohesion: 0.05
Nodes (26): CL_CT10_ControlManager::startUserProfileByNo(), CL_CT10_ControlManager::stopUserProfile(), CL_CT10_ControlManager::applyManualResolved(), CL_CT10_ControlManager::startOverrideFixed(), CL_CT10_ControlManager::stopOverride(), CL_CT10_ControlManager::applyDecision(), CL_N10_NvsManager, G_N10_KEY_AUTOOFF_ENABLED (+18 more)

### Community 2 - "CL_CT10_ControlManager::exportStateJson_v02"
Cohesion: 0.18
Nodes (7): CL_CT10_ControlManager::exportChartJson(), CL_CT10_ControlManager::exportMetricsJson(), CL_CT10_ControlManager::exportStateJson_v02(), CL_CT10_ControlManager::exportSummaryJson(), CL_CT10_ControlManager::decideRunSource(), CT10_reasonToString(), CT10_stateToString()

### Community 3 - "P010_bundle_0202.js"
Cohesion: 0.06
Nodes (46): ackEvent(), addWindProfile(), _appendMessage(), _bindLangToggle(), buildQuery(), checkFw(), clear(), deleteWindProfile() (+38 more)

### Community 4 - "C10_Config_Sys_0202.cpp"
Cohesion: 0.18
Nodes (11): C10_wsChannelFromName(), CL_C10_ConfigManager::loadSystemConfig(), CL_C10_ConfigManager::patchMotionFromJson(), CL_C10_ConfigManager::patchSystemFromJson(), CL_C10_ConfigManager::patchWifiFromJson(), CL_C10_ConfigManager::saveMotionConfig(), CL_C10_ConfigManager::saveSystemConfig(), CL_C10_ConfigManager::saveWifiConfig() (+3 more)

### Community 5 - "040.api.js"
Cohesion: 0.07
Nodes (52): ackEvent(), addProfile(), addSchedule(), addWindProfile(), ApiError, buildQuery(), checkFw(), deleteProfile() (+44 more)

### Community 6 - "FRONTEND_REQ_0202.md — 프론트엔드 요구사항 및 상세 명세서 (v1.3)"
Cohesion: 0.04
Nodes (47): 10. 단계별 구현 로드맵, 11. 계약 준수 사항 및 개발 가이드라인, 12. 개정 이력, 1.1 목적, 1.2 설계 원칙, 1. 목적 및 설계 원칙, 2. 사용자 역할 정의, 3. 페이지 구조 및 Level 접근 Matrix (+39 more)

### Community 7 - "CL_CT10_ControlManager"
Cohesion: 0.04
Nodes (31): CL_CT10_ControlManager, active, _autoOffLatched, autoOffRt, curProfileIndex, curScheduleIndex, _dirtyChart, _dirtyMetrics (+23 more)

### Community 8 - "A20_Const_0202.h"
Cohesion: 0.15
Nodes (5): CL_M10_MotionLogic, , EN_A20_WIFI_MODE_AP, EN_A20_WIFI_MODE_AP_STA, EN_A20_WIFI_MODE_STA

### Community 9 - "ST_A20_WebPageConfig_t"
Cohesion: 0.12
Nodes (19): ST_A20_CommonAsset_t, isCommon, path, uri, ST_A20_ReDirectItem_t, uriFrom, uriTo, ST_A20_WebPageConfig_t (+11 more)

### Community 10 - "CL_D10_Logger"
Cohesion: 0.09
Nodes (13): setup(), CL_D10_Logger, BUFFER_SIZE, _logLevel, s_buffer, s_count, s_head, s_wsLogs (+5 more)

### Community 11 - "CL_C10_ConfigManager"
Cohesion: 0.06
Nodes (21): CL_C10_ConfigManager, _dirty_motion, _dirty_nvsSpec, _dirty_schedules, _dirty_system, _dirty_userProfiles, _dirty_webPage, _dirty_wifi (+13 more)

### Community 12 - "CL_P10_PWM"
Cohesion: 0.11
Nodes (7): CL_P10_PWM, G_P10_CURVE_SPAN1, G_P10_CURVE_SPAN2, G_P10_CURVE_SPLIT1, G_P10_CURVE_SPLIT2, G_P10_CURVE_ZERO_THRESHOLD, _state

### Community 13 - "FRONTEND_IMPL_0202.md — 프론트엔드 최적 재설계 (v2.0)"
Cohesion: 0.05
Nodes (38): 10. HTML 변경 예시 (P010_main_0202.html), 11.1 개발 (로컬 http-server), 11.2 배포, 11.3 디버그 (배포 후), 11. 개발 워크플로 (개발 vs 배포), 12. 최적화 요약 (기존 대비), 13. 리스크 및 완화, 14. 개정 이력 (+30 more)

### Community 14 - "Smart Nature Wind v0202 — 사용자 매뉴얼 (User Manual)"
Cohesion: 0.05
Nodes (37): 10.1 팬 모터 안전 듀티 설정, 10.2 설정 저장(`Save`)과 재적용(`Reload`)의 차이점 (중요), 10. 기기 환경설정 및 관리 (`/#/system`), 11. 무선 펌웨어 업데이트 (OTA, `/#/upload`), 12. 자주 묻는 질문 (FAQ) 및 문제 해결, 13. 제품 기술 규격 (Product Specifications), 14. 핵심 조작 요약 치트시트, 1. 30초 빠른 시작 (처음 사용자용) (+29 more)

### Community 15 - "CL_WF10_WiFiManager"
Cohesion: 0.10
Nodes (13): CL_WF10_WiFiManager, G_WF10_BACKOFF_INIT_MS, G_WF10_BACKOFF_MAX_MS, G_WF10_BACKOFF_MUL, G_WF10_MULTI_RUN_TIMEOUT_MS, G_WF10_RECONNECT_MAX, s_lastStaStatus, s_reconnectAttempts (+5 more)

### Community 16 - "A25_Com_Utils_0202.h"
Cohesion: 0.08
Nodes (22): _A40__callerOrUnknown(), CL_A40_muxGuard_Critical, _flagSpinlock, cloneStr2SharedStr_safe(), copyStr2Buffer_safe(), Dirty_clearAtomic(), Dirty_readAtomic(), Dirty_setAtomic() (+14 more)

### Community 17 - "FRONTEND_IMPL_0202.md — 프론트엔드 최적 재설계 v3.0 (그린필드)"
Cohesion: 0.05
Nodes (36): 10. 부트스트랩 흐름 (`999.app.js`), 11.1 전체 28 JS 파일, 11. 계층별 파일 명세 요약, 12. 런타임 성능 예측 (v3.0), 13.1 신규 페이지 추가 (예: "스케줄러 미리보기"), 13.2 신규 레벨 (L5) 추가, 13. 확장 시나리오, 14. 강점 요약 (v3.0) (+28 more)

### Community 18 - "CL_TM10_TimeManager"
Cohesion: 0.10
Nodes (17): CL_TM10_TimeManager, s_activeServerIdx, s_fallbackServers, s_lastRequestMs, s_lastSyncMs, s_mutex, s_nextActionMs, s_primary (+9 more)

### Community 19 - "A00_run"
Cohesion: 0.10
Nodes (22): loop(), A00_run(), 2. loopTask WCET 예산 (`A00_run()`), 4. 잠재 블로킹 지점 및 완화, 6. 관측성 메트릭, 6. 비동기 위임/지연 패턴, 1. 상태 변수 소유권 및 접근 매트릭스, 2. 백엔드 기존 회귀 (+14 more)

### Community 20 - "src_v0202_c10_config_0202"
Cohesion: 0.08
Nodes (10): , EN_L10_LOG_DEBUG, EN_L10_LOG_ERROR, EN_L10_LOG_INFO, EN_L10_LOG_NONE, EN_L10_LOG_WARN, , EN_WF10_REQ_COALESCED (+2 more)

### Community 21 - "A20_resetScheduleItemDefault"
Cohesion: 0.12
Nodes (10): A20_resetAdjustDeltaDefault(), A20_resetAutoOffDefault(), A20_resetMotionCommonDefault(), A20_resetPirDefault(), A20_resetSchAutoOffDefault(), A20_resetScheduleItemDefault(), A20_resetSchedulePeriodDefault(), A20_resetScheduleSegmentDefault() (+2 more)

### Community 22 - "CT10_Ctl_IOWS_0202.cpp"
Cohesion: 0.12
Nodes (11): A00_init(), 1. 부팅 시퀀스 (`A00_init()`), CL_CT10_ControlManager::markDirty(), CT10_WS_applyPolicyFromSystem(), CT10_WS_begin(), CT10_WS_buildPriorityOrderFromConfig(), CT10_WS_collectPending(), CT10_WS_measurePayloadBytes() (+3 more)

### Community 23 - "TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.3)"
Cohesion: 0.06
Nodes (34): 10. 개정 이력, 1.1 검증 계층 구조, 1.2 검증 환경, 1.3 사전 준비, 1.4 도구 준비, 1. 검증 개요 및 준비, 4. 프론트엔드 v0202 SPA, 5. 정적 감사 (+26 more)

### Community 24 - "5.4 프론트엔드 자산 규격 (v2.4 신규)"
Cohesion: 0.06
Nodes (31): 1.1 리팩토링 이력 (Batch A~F), 1. 시스템 개요, 2. 하드웨어 핀맵, 3.1 코어/상수/유틸, 3.2 설정 관리 (C10), 3.3 중앙 제어 (CT10), 3.4 주변 모듈, 3.5 E-2 파일 분할 원칙 (+23 more)

### Community 25 - "FRONTEND_IMPL_0202.md — 프론트엔드 상세 구현 설계서 (v1.1)"
Cohesion: 0.07
Nodes (28): 10. 재사용성 개선 요약, 11.1 Dashboard 진입 (i18n 적용), 11.2 FSM 배지 (i18n 자동), 11.3 언어 변경 이벤트 (페이지 자동 갱신), 11. 페이지 조립 예시 (v1.1 반영), 12. 마이그레이션 (기존 8파일 → 11파일), 13. 개정 이력, 1. 기술 스택 및 제약 (+20 more)

### Community 26 - "CL_C10_ConfigManager::addUserProfilesFromJson"
Cohesion: 0.15
Nodes (16): A20_modeFromString(), A20_modeToString(), A20_resetUserProfilesDefault(), CL_C10_ConfigManager::addUserProfilesFromJson(), CL_C10_ConfigManager::updateUserProfilesFromJson(), CL_C10_ConfigManager::patchUserProfilesFromJson(), CL_C10_ConfigManager::toJson_UserProfiles(), CL_C10_ConfigManager::loadUserProfiles() (+8 more)

### Community 27 - "t"
Cohesion: 0.11
Nodes (35): addProfile(), addSchedule(), deleteProfile(), deleteSchedule(), _exportJson(), getReasonMeta(), getStateMeta(), handle() (+27 more)

### Community 28 - "CT10_Ctl_Basic_0202.cpp"
Cohesion: 0.08
Nodes (17): A40_parseHHMMtoMin_24h(), CL_CT10_ControlManager::checkAutoOff(), CL_CT10_ControlManager::findActiveScheduleIndex(), CL_CT10_ControlManager::getCurrentHumidityMock(), CL_CT10_ControlManager::getCurrentTemperatureMock(), CL_CT10_ControlManager::initAutoOffFromSchedule(), CL_CT10_ControlManager::initAutoOffFromUserProfile(), CL_CT10_ControlManager::isMotionBlocked() (+9 more)

### Community 29 - "src_v0202_a20_const_sch_0202"
Cohesion: 0.07
Nodes (27): , EN_A20_CONTROL_RUN_CONTINUE, EN_A20_CONTROL_RUN_SCHEDULE, EN_A20_SEG_MODE_COUNT, EN_A20_SEG_MODE_FIXED, EN_A20_SEG_MODE_PRESET, EN_A20_WIND_PHASE_CALM, EN_A20_WIND_PHASE_COUNT (+19 more)

### Community 30 - "dispatch"
Cohesion: 0.20
Nodes (12): atLeast(), capitalize(), _clearMain(), _closeSidebarOnMobile(), current(), dispatch(), init(), initByLevel() (+4 more)

### Community 31 - "C10_Config_Sch_Util_0202.cpp"
Cohesion: 0.17
Nodes (16): A20_resetSchedulesDefault(), CL_C10_ConfigManager::addScheduleFromJson(), CL_C10_ConfigManager::updateScheduleFromJson(), CL_C10_ConfigManager::patchSchedulesFromJson(), CL_C10_ConfigManager::toJson_Schedules(), CL_C10_ConfigManager::loadSchedules(), CL_C10_ConfigManager::saveSchedules(), C10_fromJson_ScheduleItem() (+8 more)

### Community 32 - "Web API & Networking"
Cohesion: 0.13
Nodes (15): 기본 환경, 🏗️ 1. 개발 환경 개요, 📁 2. 프로젝트 소스 및 디렉토리 구조, 📌 2단계 필수 탐색 프로토콜 (Two-Step Navigation Pr, ⚙️ 3. 주요 설정 (`platformio.ini`), 🌐 4. 주요 웹/API 엔드포인트 (v0200), 🛠️ 5. 빌드 및 배포 가이드, 🤖 6. Antigravity와 협업 가이드 (+7 more)

### Community 33 - "Build Guides"
Cohesion: 0.08
Nodes (24): Build Guides, Configuration Reference, Core Wind Metrics**, Demo, Doc: Smart Nature Wind (WindScape), Fan Selection, Features, Hardware (+16 more)

### Community 34 - "A20_resetWindDictDefault"
Cohesion: 0.12
Nodes (14): A20_resetStyleEntryDefault(), A20_resetStyleFactorsDefault(), A20_resetWindDictDefault(), CL_C10_ConfigManager::addWindProfileFromJson(), CL_C10_ConfigManager::updateWindProfileFromJson(), C10_hasDupCode(), CL_C10_ConfigManager::patchWindDictFromJson(), CL_C10_ConfigManager::toJson_WindDict() (+6 more)

### Community 35 - ".checkApiKey"
Cohesion: 0.18
Nodes (19): CL_W10_WebAPI::routeConfigInit(), CL_W10_WebAPI::routeReload(), CL_W10_WebAPI::routeControl(), CL_W10_WebAPI::routeControlSummary(), CL_W10_WebAPI::routeMotionFeed(), CL_W10_WebAPI::routeSimState(), CL_W10_WebAPI::routeSimulation(), CL_W10_WebAPI::routeAuthTest() (+11 more)

### Community 36 - "src_v0202_ct10_ctl_0202"
Cohesion: 0.09
Nodes (23): , EN_CT10_REASON_AUTOOFF_TEMP, EN_CT10_REASON_AUTOOFF_TIME, EN_CT10_REASON_AUTOOFF_TIMER, EN_CT10_REASON_MOTION_NO_PRESENCE, EN_CT10_REASON_NO_ACTIVE_SCHEDULE, EN_CT10_REASON_NO_SCHEDULES, EN_CT10_REASON_NONE (+15 more)

### Community 37 - "0200_004_백앤드리팩토링.md"
Cohesion: 0.08
Nodes (23): → 0건 기대, define G_TM10_MAX_SYNC_INTERVAL_MS (24UL * 60UL * 60UL * 1000UL), define G_TM10_MIN_SYNC_INTERVAL_MS (5UL * 60UL * 1000UL), define G_TM10_RETRY_BACKOFF_MS (2000UL), define G_TM10_SYNC_RECENT_WINDOW_MS (10UL * 60UL * 1000UL), define G_TM10_SYNC_TIMEOUT_MS (15000UL), E-6에서 saveToFile 제거 후, 링커가 실제 미참조 확인, → {"state":false,"metrics":false,"chart":false,"summary":false} (소비 후) (+15 more)

### Community 38 - "A23_Com_ResetCfg_0202.h"
Cohesion: 0.12
Nodes (12): A20_findPresetByCode(), A20_findSegModeByCode(), A20_findStyleByCode(), A20_getPresetNameByCode(), A20_getStaticPresetIndexByCode(), A20_resetPresetEntryDefault(), A20_resetResolvedWindDefault(), A20_resetWindPresetFactorsDefault() (+4 more)

### Community 40 - "CT10_Ctl_Ctl_Seg_0202.cpp"
Cohesion: 0.09
Nodes (11): T-14. A-1 — FIXED self-heal 폭주 방지, CL_CT10_ControlManager::applySegmentOff(), CL_CT10_ControlManager::applySegmentOn(), CL_CT10_ControlManager::tickOverride(), CL_CT10_ControlManager::tickSchedule(), CL_CT10_ControlManager::tickSegmentSequence(), CL_CT10_ControlManager::tickUserProfile(), CL_CT10_ControlManager::updateRunCtxOnSegmentOff() (+3 more)

### Community 42 - "mount"
Cohesion: 0.11
Nodes (30): ai(), _applyInitial(), _applyInitialState(), applyTo(), chart(), dashboard(), delegate(), diagnostics() (+22 more)

### Community 43 - "CL_M10_MotionLogic"
Cohesion: 0.07
Nodes (19): 10. 예외/폴백 경로, 11.1 빌드 전처리 (`pio_gzip_0202.py`), 11.2 런타임 정적 서빙 (`W10_Web_Static_0202.cpp`), 11. 웹 에셋 빌드/서빙 파이프라인, 12. 개정 이력, 2. 메인 루프 파이프라인 (`A00_run()`), 3. 설정 재로드(Reload) 위임 시퀀스 (F-05), 4. Motion Patch 위임 시퀀스 (F-06) (+11 more)

### Community 44 - "pio_gzip_0202.py"
Cohesion: 0.15
Nodes (13): _err(), find_repo_root(), _info(), main(), _run(), verify_required_files(), build_css_bundle(), build_js_bundle() (+5 more)

### Community 45 - ".log"
Cohesion: 0.15
Nodes (10): C10_allocSection(), CL_C10_ConfigManager::begin(), CL_C10_ConfigManager::factoryResetFromDefault(), CL_C10_ConfigManager::freeAll(), CL_C10_ConfigManager::freeLazySection(), CL_C10_ConfigManager::getRootSnapshot(), CL_C10_ConfigManager::_loadCfgJsonFile(), CL_C10_ConfigManager::processPendingFree() (+2 more)

### Community 46 - "3. 백엔드 Batch A~F 신규"
Cohesion: 0.13
Nodes (15): 3. 백엔드 Batch A~F 신규, T-15. A-2 — 캡슐화 위임, T-16. B-1 — 버전 SSOT, T-17. C — 매직넘버 상수화 물리 출력 무변동, T-18. D-1 — WS 배치 mutex, T-19. D-2/3/5 — heap 안정성, T-20. E — 링크 무결성, T-21. E-2.1 — TM10 분리 SNTP 재동기화 (+7 more)

### Community 47 - ".getRootSnapshot"
Cohesion: 0.14
Nodes (5): CL_C10_ConfigManager::getDirtyStatus(), CL_C10_ConfigManager::toJson_All(), CL_W10_WebAPI::routeSchedules(), CL_W10_WebAPI::routeUserProfiles(), CL_W10_WebAPI::routeWifiConfig()

### Community 48 - "BUDGET_0202.md — 시간 및 시스템 자원 예산"
Cohesion: 0.09
Nodes (19): 10. Batch A~F 예산 영향 요약, 11. 개정 이력, 1. 태스크별 자원 할당 매트릭스, 5. FreeRTOS 스택 예산, 7.1 LittleFS 에셋 절감, 7.2 동시 HTTP 소켓, 7. 플래시 및 네트워크 소켓 예산, 8.1 배포 자산 실측 (2026-10-21 CI) (+11 more)

### Community 49 - "S10_Simul_Physic_0202.cpp"
Cohesion: 0.14
Nodes (7): A20_findPresetIndexByCode(), A20_findStyleIndexByCode(), CL_S10_Simulation::applyPresetCore(), CL_S10_Simulation::updateGust(), CL_S10_Simulation::updateThermal(), S10_probFromRatePerSec(), S20_resolveWindParams()

### Community 50 - ".parseJsonBody"
Cohesion: 0.15
Nodes (5): CL_W10_WebAPI::routeConfigDirtySave(), CL_W10_WebAPI::routeSchedulesID(), CL_W10_WebAPI::routeUserProfilesID(), CL_W10_WebAPI::routeUserProfilesPatch(), CL_W10_WebAPI::routeWindProfileID()

### Community 51 - "WsClient"
Cohesion: 0.12
Nodes (15): ApiError, closeAll(), debug(), _ensure(), error(), get(), getApiKey(), isDebug() (+7 more)

### Community 52 - "CL_A30_LED"
Cohesion: 0.18
Nodes (6): CL_A30_LED, _lastLedMs, _ledState, _numPixels, _pin, _pixel

### Community 53 - "W10_Web_Util_0202.cpp"
Cohesion: 0.24
Nodes (6): CL_W10_WebAPI::W10_registerStaticRoute(), CL_W10_WebAPI::_applyHeaders(), CL_W10_WebAPI::checkApiKey(), CL_W10_WebAPI::parseJsonBody(), CL_W10_WebAPI::sendJson(), CL_W10_WebAPI::sendText()

### Community 54 - "CL_A40_MutexGuard_Semaphore"
Cohesion: 0.24
Nodes (4): CL_A40_MutexGuard_Semaphore, _acquired, _caller, _mutexPtr

### Community 55 - "7.3 Batch A~F 신규"
Cohesion: 0.17
Nodes (9): 3. async_tcp WCET (F-05/F-06/D-1 반영 후), 4.3 POST/PATCH 공통 헬퍼 계약 (F-2, F-3), 7.3 Batch A~F 신규, 5.1 API 응답 필드 (Batch N-1, F-2, F-3), CL_W10_WebAPI::routeFirmwareCheck(), CL_W10_WebAPI::routeTimeSet(), _routeWifiConfigPatchBody(), _w10_compareSemVer() (+1 more)

### Community 56 - "CL_W10_WebAPI::routeGeminiProxy"
Cohesion: 0.23
Nodes (6): CL_W10_WebAPI::routeGeminiProxy(), W10_callGeminiApi(), W10_getGeminiApiKey(), CL_W10_WebAPI::getUploadPath(), CL_W10_WebAPI::routeUpdate(), extractSafeFileName()

### Community 57 - "P010_bundle_0202_old.js"
Cohesion: 0.05
Nodes (49): ackEvent(), addProfile(), addSchedule(), addWindProfile(), _appendMessage(), _bindLangToggle(), clear(), debug() (+41 more)

### Community 58 - "STATE_0202.md — 상태 소유권 및 FSM 명세"
Cohesion: 0.11
Nodes (14): 4. WF10 Wi-Fi 상태머신, 5. TM10 시간 동기화 상태, 6.1 F-05 Pending Reload, 6.2 F-06 Pending Motion.Sim Apply, 6.3 Batch D-1 Dirty 배치 소비, 6. 위임 플래그 라이프사이클 (F-05, F-06), 7.1 래치 해제 경로, 7.2 AutoOff offTime 재트리거 방지 (+6 more)

### Community 59 - "CT10_Ctl_Ctl_0202.cpp"
Cohesion: 0.14
Nodes (7): CL_CT10_ControlManager::applyManual(), CL_CT10_ControlManager::applyMotionSimConfigToSim(), CL_CT10_ControlManager::begin(), CL_CT10_ControlManager::exportSimJson(), CL_CT10_ControlManager::feedPIR(), CL_CT10_ControlManager::patchSimFromJson(), CL_CT10_ControlManager::setMotion()

### Community 60 - "WsClient"
Cohesion: 0.22
Nodes (4): closeAll(), get(), initByLevel(), WsClient

### Community 61 - ".applyPresetCore"
Cohesion: 0.21
Nodes (6): CL_S10_Simulation::applyResolvedWind(), CL_S10_Simulation::begin(), CL_S10_Simulation::resetDefaults(), CL_S10_Simulation::patchFromJson(), CL_S10_Simulation::toJson(), CL_S10_Simulation::updatePhase()

### Community 62 - "CL_S10_Simulation::tick"
Cohesion: 0.16
Nodes (5): 3. S10 시뮬레이션 물리 엔진 상태, CT10_markDirtyFromSim(), CL_S10_Simulation::tick(), S10_millis2EpochMs(), CL_S10_Simulation::toChartJson()

### Community 63 - "033.util.template.js"
Cohesion: 0.27
Nodes (13): ai(), chart(), dashboard(), diagnostics(), firmware(), info(), logs(), network() (+5 more)

### Community 64 - "130.ui.form.js"
Cohesion: 0.20
Nodes (7): append(), _levelClass(), refresh(), render(), setItems(), setSelected(), _trim()

### Community 65 - "200.page.dashboard.js"
Cohesion: 0.29
Nodes (9): _applyInitialState(), _applyPresetList(), _bindStore(), mount(), _mountComponents(), _onIntensityChange(), _onPowerToggle(), _onPresetSelect() (+1 more)

### Community 66 - "CL_W10_WebAPI::routeStaticAssets"
Cohesion: 0.33
Nodes (3): 4.1 W10 정적 웹 에셋 서빙 계약, CL_W10_WebAPI::routeStaticAssets(), CL_W10_WebAPI::W10_registerGzipServe()

### Community 67 - "034.util.toast.js"
Cohesion: 0.33
Nodes (8): _ensure(), error(), handle(), info(), show(), success(), warn(), wrap()

### Community 68 - "070.router.js"
Cohesion: 0.31
Nodes (8): capitalize(), _clearMain(), dispatch(), init(), parseHash(), renderNavMenu(), _showError(), _showLoading()

### Community 69 - "html"
Cohesion: 0.18
Nodes (14): append(), _applyPresetList(), diag(), escape(), getConfigDirty(), getState(), html(), _levelClass() (+6 more)

### Community 70 - ".get"
Cohesion: 0.18
Nodes (11): _bindConnectionStatus(), _bindLastUpdate(), _bindStore(), clockStr(), _mountComponents(), _onIntensityChange(), _onPresetSelect(), patchSim() (+3 more)

### Community 71 - "ST_ChartEntry"
Cohesion: 0.18
Nodes (11): ST_ChartEntry, gust_active, intensity, preset_index, pwm_duty, target_wind, thermal_active, timestamp (+3 more)

### Community 72 - "💨 스마트 네이처 윈드 (Smart Nature Wind v0202)"
Cohesion: 0.18
Nodes (10): 🌿 1. 단순한 ‘바람’이 아닌, ‘자연’을 전하다, ⚙️ 2. 대기역학을 품은 바람 — Realistic Wind Physics (S10 / S20), 🚀 3. 외부 허브 없는 Standalone 초고속 풀스택 시스템, 🤖 4. 지능형 센서 연동 & 하드웨어 무소음 규격, 📅 5. 주간 정밀 스케줄러 & 맞춤형 바람 프로파일, 🗺️ 6. 10종 자연풍 테마 프리셋 (Nature Wind Presets), 🔋 7. Plug & Play — 간편한 구성과 확장성, 💡 8. 결론 — 바람을 ‘디자인’하는 새로운 시대 (+2 more)

### Community 74 - "html"
Cohesion: 0.08
Nodes (32): _applyPresetList(), applyTo(), atLeast(), capitalize(), checkFw(), _clearMain(), current(), diag() (+24 more)

### Community 75 - "230.page.profiles.js"
Cohesion: 0.38
Nodes (7): _highlightActive(), _load(), mount(), _onDelete(), _onStart(), _onStop(), _renderList()

### Community 76 - "CL_W10_WebAPI"
Cohesion: 0.07
Nodes (14): CL_W10_WebAPI, G_W10_MAX_UPLOAD_SIZE, G_W10_PAGES_JSON, s_control, s_menu_state, s_server, s_upFile, s_uploadError (+6 more)

### Community 77 - "ST_A20_cfg_jsonFile_t"
Cohesion: 0.22
Nodes (9): ST_A20_cfg_jsonFile_t, motion, nvsSpec, schedules, system, userProfiles, webPage, wifi (+1 more)

### Community 79 - "ST_W10_PageEntry_t"
Cohesion: 0.17
Nodes (10): ST_W10_MenuState_t, main_path, pages_sorted, ST_W10_PageEntry_t, enable, isMain, label, order (+2 more)

### Community 80 - "210.page.chart.js"
Cohesion: 0.42
Nodes (6): _applyInitial(), _exportCsv(), mount(), _onWsChart(), _pushPoint(), _redrawRange()

### Community 81 - "220.page.schedule.js"
Cohesion: 0.47
Nodes (6): _load(), mount(), _onAdd(), _onDelete(), _onToggle(), _renderList()

### Community 82 - "120.ui.chart.js"
Cohesion: 0.46
Nodes (7): clear(), destroy(), draw(), _drawSeries(), push(), resize(), setMaxPoints()

### Community 83 - "240.page.settings.js"
Cohesion: 0.43
Nodes (5): _loadSystem(), mount(), _onReload(), _onSave(), _waitReloadComplete()

### Community 84 - "270.page.network.js"
Cohesion: 0.39
Nodes (5): _loadState(), _loadSystemTime(), mount(), _onSaveTime(), _onScan()

### Community 87 - "260.page.firmware.js"
Cohesion: 0.43
Nodes (4): _loadVersion(), mount(), _onUploadFile(), _onUploadFw()

### Community 88 - "290.page.ai.js"
Cohesion: 0.43
Nodes (4): _appendMessage(), mount(), _onSend(), _replaceLastAssistant()

### Community 89 - "0200_003.md"
Cohesion: 0.29
Nodes (6): 🔧 [4] `CT10_Ctl_0202.h` — B-N-1a, → Content-Encoding: gzip 헤더가 포함되어야 함, Gzip 헤더 확인, 검증 명령, 번들 파일 존재 확인, 파일 수정 항목

### Community 90 - ".log"
Cohesion: 0.22
Nodes (9): _buildPathWithSuffix(), _io_callerOrUnknown(), Load_File2JsonDoc_V21(), _parseJsonFileToDoc(), Save_JsonDoc2File_V21(), CL_C10_ConfigManager::deleteSchedule(), CL_C10_ConfigManager::deleteUserProfiles(), CL_C10_ConfigManager::deleteWindProfile() (+1 more)

### Community 92 - "280.page.logs.js"
Cohesion: 0.47
Nodes (3): _exportJson(), _loadInitial(), mount()

### Community 94 - "030.util.level.js"
Cohesion: 0.60
Nodes (3): applyTo(), atLeast(), current()

### Community 96 - "Doc: /maintenance - 규칙 유지보수 워크플로우"
Cohesion: 0.50
Nodes (4): 규칙 준수 여부 점검 (Audit), Doc: /maintenance - 규칙 유지보수 워크플로우, 규칙 고도화 (Improvement), 코드 보완 (Refactor)

### Community 101 - "0200_001.md"
Cohesion: 0.50
Nodes (3): 또는 직접 메시지 지정, 메시지 지정, 실행 정책 오류 시

### Community 102 - "3️⃣ 실행 예시 (검증 시나리오)"
Cohesion: 0.50
Nodes (3): 3️⃣ 실행 예시 (검증 시나리오), Linux / macOS, 또는

### Community 103 - "t"
Cohesion: 0.17
Nodes (27): _bindConnectionStatus(), _bindStore(), _exportJson(), getStateMeta(), handle(), _mountComponents(), _onAdd(), _onIntensityChange() (+19 more)

### Community 104 - "mount"
Cohesion: 0.15
Nodes (22): ai(), _applyInitial(), _applyInitialState(), chart(), dashboard(), delegate(), diagnostics(), epochToTimeStr() (+14 more)

### Community 109 - "WsClient"
Cohesion: 0.18
Nodes (7): closeAll(), get(), getApiKey(), getState(), start(), _waitReloadComplete(), WsClient

### Community 112 - "CL_CT10_ControlManager::tickLoop"
Cohesion: 0.14
Nodes (6): 2.1 상태 정의, 2.2 상태 전이 우선순위 (`decideRunSource`), 2.3 상태 전이표, 2.4 Batch F-5: profile fall-through 차단, 2. CT10 메인 제어 상태머신 (7-State FSM), CL_CT10_ControlManager::tickLoop()

### Community 113 - "CONTRACT_0202.md — 동시성 경계 및 API 계약"
Cohesion: 0.14
Nodes (12): 1. 실행 컨텍스트 (FreeRTOS Task), 3.1 `g_A20_config_root` 생명주기 (핵심 CBD 계약), 3. 공유 전역 자원 접근 규약, 4.2 CT10 캡슐화 위임 계약 (A-2), 4.4 E-2 분할 시 심볼 공유 계약, 4. 태스크 경계별 함수 호출 매트릭스, 5. 락 획득 순서 및 데드락 방지, 7.1 기존 (F-01~I-6) (+4 more)

### Community 114 - "C10_Config_Extras_0202.cpp"
Cohesion: 0.24
Nodes (11): ST_A20_NvsSpecConfig_t, entries, entryCount, namespaceName, A20_resetNvsSpecDefault(), CL_C10_ConfigManager::loadNvsSpecConfig(), CL_C10_ConfigManager::patchNvsSpecFromJson(), CL_C10_ConfigManager::patchWebPageFromJson() (+3 more)

### Community 115 - "A20_resetToDefault"
Cohesion: 0.17
Nodes (7): A20_resetMotionDefault(), A20_resetSystemDefault(), A20_resetToDefault(), A20_resetWebSocketDefault(), A20_resetWifiDefault(), CL_C10_ConfigManager::loadMotionConfig(), CL_C10_ConfigManager::loadWifiConfig()

### Community 116 - "W10_Web_WS_0202.cpp"
Cohesion: 0.27
Nodes (6): CL_W10_WebAPI::_broadcast(), CL_W10_WebAPI::broadcastChart(), CL_W10_WebAPI::broadcastMetrics(), CL_W10_WebAPI::broadcastState(), CL_W10_WebAPI::broadcastSummary(), _wsHandshakeAuth()

### Community 117 - "append"
Cohesion: 0.20
Nodes (10): ApiError, append(), buildQuery(), _levelClass(), msToSecLabel(), overrideFixed(), _trim(), uploadFile() (+2 more)

### Community 118 - "ST_A20_PageItem_t"
Cohesion: 0.22
Nodes (9): ST_A20_PageItem_t, enable, isMain, label, order, pageAssetCount, pageAssets, path (+1 more)

### Community 119 - "error"
Cohesion: 0.25
Nodes (5): _bindLastUpdate(), _ensure(), error(), show(), Store

### Community 120 - "_load"
Cohesion: 0.33
Nodes (7): _highlightActive(), listProfiles(), listSchedules(), _load(), _onToggle(), _renderList(), updateSchedule()

### Community 122 - "ST_A20_PageAsset_t"
Cohesion: 0.40
Nodes (5): ST_A20_PageAsset_t, path, uri, A20_resetPageAssetDefault(), A20_resetPageItemDefault()

### Community 123 - "ST_A20_NvsEntry_t"
Cohesion: 0.50
Nodes (4): ST_A20_NvsEntry_t, defaultValue, key, type

## Knowledge Gaps
- **353 isolated node(s):** `active`, `avgWindCached`, `baseMaxWind`, `baseMinWind`, `CHART_CAPACITY` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 960 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CL_CT10_ControlManager` connect `CL_CT10_ControlManager` to `CL_S10_Simulation`, `CL_N10_NvsManager`, `CL_CT10_ControlManager::exportStateJson_v02`, `src_v0202_ct10_ctl_0202`, `CT10_Ctl_Ctl_Seg_0202.cpp`, `CL_W10_WebAPI`, `CL_P10_PWM`, `.log`, `CL_W10_WebAPI`, `CL_CT10_ControlManager::tickLoop`, `A00_run`, `src_v0202_c10_config_0202`, `CT10_Ctl_IOWS_0202.cpp`, `STATE_0202.md — 상태 소유권 및 FSM 명세`, `CT10_Ctl_Basic_0202.cpp`, `CL_S10_Simulation::tick`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `active`, `avgWindCached`, `baseMaxWind` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CL_S10_Simulation` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly interconnected._
- **Why does `CL_W10_WebAPI` connect `CL_W10_WebAPI` to `CL_W10_WebAPI::routeStaticAssets`, `.checkApiKey`, `CL_CT10_ControlManager`, `CL_W10_WebAPI`, `ST_W10_PageEntry_t`, `A00_run`, `src_v0202_c10_config_0202`, `W10_Web_Util_0202.cpp`, `CT10_Ctl_IOWS_0202.cpp`, `7.3 Batch A~F 신규`, `W10_Web_WS_0202.cpp`, `CL_W10_WebAPI::routeGeminiProxy`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `CL_N10_NvsManager` be split into smaller, more focused modules?**
  _Cohesion score 0.05450733752620545 - nodes in this community are weakly interconnected._
- **Why does `CL_C10_ConfigManager` connect `CL_C10_ConfigManager` to `A23_Com_ResetCfg_0202.h`, `CL_C10_ConfigManager::saveAll`, `ST_A20_cfg_jsonFile_t`, `.log`, `.getRootSnapshot`, `CONTRACT_0202.md — 동시성 경계 및 API 계약`, `.parseJsonBody`, `CT10_Ctl_IOWS_0202.cpp`, `7.3 Batch A~F 신규`, `.log`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `P010_bundle_0202.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05605499735589635 - nodes in this community are weakly interconnected._