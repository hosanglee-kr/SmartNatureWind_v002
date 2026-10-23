# Graph Report - SmartNatureWind_v002  (2026-10-23)

## Corpus Check
- 152 files · ~183,549 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 11, (none) 8, .csv 1)

## Summary
- 2205 nodes · 4048 edges · 129 communities (107 shown, 22 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 485 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56eed278`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Wind Physics & Simulation Engine
- Control Manager & Operating Modes
- Frontend API Client & Services
- ESP32 Hardware & Platform Core
- Web Server & Telemetry Broadcast
- CL_N10_NvsManager
- Main Event Loop & WCET Scheduling
- Frontend Specification & Plan
- UI Runtime & Application Bundle
- Diagnostic Logging & Trace
- Configuration Manager & Presets
- Control Dispatch & Motion Execution
- WiFi Networking & Station Protocol
- SNTP Time Sync & RTC Management
- Frontend DOM & Page Layout
- JSON Utilities & Dynamic Memory
- Profile & Schedule UI Management
- User Manual & Operations Guide
- Frontend Architecture & Lifecycle
- 4. 프론트엔드 v0202 SPA
- Module: argparse
- Module: SPEC 0202.md
- Module: DHT
- Module: EN CT10 state t
- Module: A20 resetPresetEntryDefau
- Module: arduinojson
- Module: .factoryResetFromDefault
- Module: 0200 005 프론트 설계 01.md
- Module: T-14. A-1 — FIXED self-he
- Module: ensure
- Module: EN A20 CONTROL RUN CONTIN
- Module: .deleteSchedule
- Module: ai
- Module: EN A20 segment mode t
- Module: A22 Com Lookup 0202.h
- Module: A20 resetSchedulesDefault
- Module: Build Guides
- Module: EN CT10 REASON AUTOOFF TE
- Module: 0200 004 백앤드리팩토링.md
- Module: .addScheduleFromJson
- 7.1 래치 해제 경로
- Module: applyTo
- Module: closeAll
- Module: cstring
- Module: ST A20 CommonAsset t
- Module: A20 resetAdjustDeltaDefau
- Module: 2.1 상태 정의
- Module: buildPathWithSuffix
- Module: BUDGET 0202.md
- Module: CL M10 MotionLogic
- Module: 기본 환경
- Module: FLOW 0202.md
- Module: 3. 백엔드 Batch A~F 신규
- Module: 033.util.template.js
- Module: 050.ws.js
- Module: .applyPresetCore
- Module: ST A20 PageAsset t
- Module: 10. Batch A~F 예산 영향 요약
- Module: 130.ui.form.js
- Module: ApiError
- Module: Adafruit NeoPixel
- Module: AsyncWebServerResponse
- Module: ST A20 NvsSpecConfig t
- Module: 270.page.network.js
- Module: ackEvent
- Module: A20 resetMotionDefault
- Module: CL A40 MutexGuard Semapho
- Module: 070.router.js
- Module: 200.page.dashboard.js
- Module: 230.page.profiles.js
- Module: .sendText
- Module: ST W10 MenuState t
- CT10_Ctl_Ctl_0202.cpp
- Module: 034.util.toast.js
- Module: 300.page.windprofile.js
- Module: ST ChartEntry
- Module: introduce Doc 0202 001.md
- Module: .saveMotionConfig
- Module: 4.1 W10 정적 웹 에셋 서빙 계약
- Module: 220.page.schedule.js
- Module: ST A20 cfg jsonFile t
- Module: 060.store.js
- Module: 210.page.chart.js
- Module: 120.ui.chart.js
- Module: 240.page.settings.js
- Module: 030.util.time.js
- Module: 031.util.dom.js
- Module: 260.page.firmware.js
- Module: 290.page.ai.js
- Module: 0200 003.md
- Module: 032.util.log.js
- Module: 280.page.logs.js
- Module: 020.i18n.js
- Module: 030.util.level.js
- Module: 250.page.diagnostics.js
- Module: 규칙 준수 여부 점검 (Audit)
- Module: ST A20 NvsEntry t
- Module: 0200 001.md
- Module: 0200 002.md
- N10_NvsManager_0202.cpp
- Module: Doc: WindScape Configurat
- CL_CT10_ControlManager::exportStateJson_v02
- 2. 백엔드 기존 회귀
- .parseJsonBody
- CL_CT10_ControlManager::applyDecision
- STATE_0202.md — 상태 소유권 및 FSM 명세
- 7.3 Batch A~F 신규
- TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.3)
- 5. 정적 감사
- 6. 부하/안정성
- .tickSegmentSequence
- ST_A20_PageAsset_t
- 1. 검증 개요 및 준비
- src_v0202_a20_const_wifi_0202
- 9. Phase 7 릴리스 게이트
- src_v0202_wf10_wifimgr_0202
- 0202_001.md

## God Nodes (most connected - your core abstractions)
1. `CL_CT10_ControlManager` - 109 edges
2. `CL_S10_Simulation` - 85 edges
3. `CL_C10_ConfigManager` - 78 edges
4. `CL_W10_WebAPI` - 72 edges
5. `mount()` - 67 edges
6. `_fetch()` - 54 edges
7. `_fetch()` - 50 edges
8. `` - 49 edges
9. `CL_N10_NvsManager` - 42 edges
10. `` - 38 edges

## Surprising Connections (you probably didn't know these)
- `1. 부팅 시퀀스 (`A00_init()`)` --references--> `A00_init()`  [INFERRED]
  src/v0202/contract_doc_0202/FLOW_0202.md → src/v0202/A00_Main_0202.cpp
- `T-1. F-03 (M10 tick) — PIR holdSec 정상 만료` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/TEST_PLAN_0202.md → src/v0202/A00_Main_0202.cpp
- `3. 공유 전역 자원 접근 규약` --references--> `A00_init()`  [INFERRED]
  src/v0202/contract_doc_0202/CONTRACT_0202.md → src/v0202/A00_Main_0202.cpp
- `7.1 기존 (F-01~I-6)` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/CONTRACT_0202.md → src/v0202/A00_Main_0202.cpp
- `2. 메인 루프 파이프라인 (`A00_run()`)` --references--> `A00_run()`  [INFERRED]
  src/v0202/contract_doc_0202/FLOW_0202.md → src/v0202/A00_Main_0202.cpp

## Import Cycles
- None detected.

## Communities (129 total, 22 thin omitted)

### Community 0 - "Wind Physics & Simulation Engine"
Cohesion: 0.03
Nodes (59): CL_S10_Simulation, active, avgWindCached, baseMaxWind, baseMinWind, CHART_CAPACITY, currentWindSpeed, _fanCfgSnap (+51 more)

### Community 1 - "Control Manager & Operating Modes"
Cohesion: 0.04
Nodes (30): CL_CT10_ControlManager, active, _autoOffLatched, autoOffRt, curProfileIndex, curScheduleIndex, _dirtyChart, _dirtyMetrics (+22 more)

### Community 2 - "Frontend API Client & Services"
Cohesion: 0.07
Nodes (55): ackEvent(), addProfile(), addSchedule(), addWindProfile(), ApiError, buildQuery(), checkFw(), deleteProfile() (+47 more)

### Community 3 - "ESP32 Hardware & Platform Core"
Cohesion: 0.09
Nodes (7): CL_M10_MotionLogic, , EN_L10_LOG_DEBUG, EN_L10_LOG_ERROR, EN_L10_LOG_INFO, EN_L10_LOG_NONE, EN_L10_LOG_WARN

### Community 4 - "Web Server & Telemetry Broadcast"
Cohesion: 0.06
Nodes (15): CL_W10_WebAPI, G_W10_MAX_UPLOAD_SIZE, G_W10_PAGES_JSON, s_control, s_menu_state, s_server, s_upFile, s_uploadError (+7 more)

### Community 5 - "CL_N10_NvsManager"
Cohesion: 0.08
Nodes (21): CL_CT10_ControlManager::startOverrideFixed(), CL_N10_NvsManager, G_N10_KEY_AUTOOFF_ENABLED, G_N10_KEY_AUTOOFF_MINUTES, G_N10_KEY_LAST_PROFILE, G_N10_KEY_LAST_SCHEDULE, G_N10_KEY_OVERRIDE_ENABLED, G_N10_KEY_OVERRIDE_FIXED (+13 more)

### Community 6 - "Main Event Loop & WCET Scheduling"
Cohesion: 0.10
Nodes (21): loop(), A00_run(), 2. loopTask WCET 예산 (`A00_run()`), 4. 잠재 블로킹 지점 및 완화, 6. 관측성 메트릭, 1. 실행 컨텍스트 (FreeRTOS Task), 3.1 `g_A20_config_root` 생명주기 (핵심 CBD 계약), 3. 공유 전역 자원 접근 규약 (+13 more)

### Community 7 - "Frontend Specification & Plan"
Cohesion: 0.04
Nodes (47): 10. 단계별 구현 로드맵, 11. 계약 준수 사항 및 개발 가이드라인, 12. 개정 이력, 1.1 목적, 1.2 설계 원칙, 1. 목적 및 설계 원칙, 2. 사용자 역할 정의, 3. 페이지 구조 및 Level 접근 Matrix (+39 more)

### Community 8 - "UI Runtime & Application Bundle"
Cohesion: 0.06
Nodes (29): _appendMessage(), _bindLangToggle(), clear(), clockStr(), destroy(), draw(), _drawSeries(), factoryReset() (+21 more)

### Community 9 - "Diagnostic Logging & Trace"
Cohesion: 0.06
Nodes (19): setup(), CL_D10_Logger, BUFFER_SIZE, _logLevel, s_buffer, s_count, s_head, s_wsLogs (+11 more)

### Community 10 - "Configuration Manager & Presets"
Cohesion: 0.06
Nodes (23): CL_C10_ConfigManager, _dirty_motion, _dirty_nvsSpec, _dirty_schedules, _dirty_system, _dirty_userProfiles, _dirty_webPage, _dirty_wifi (+15 more)

### Community 11 - "Control Dispatch & Motion Execution"
Cohesion: 0.11
Nodes (7): CL_P10_PWM, G_P10_CURVE_SPAN1, G_P10_CURVE_SPAN2, G_P10_CURVE_SPLIT1, G_P10_CURVE_SPLIT2, G_P10_CURVE_ZERO_THRESHOLD, _state

### Community 12 - "WiFi Networking & Station Protocol"
Cohesion: 0.08
Nodes (15): 2.1 Batch D-4: `s_staConnected` lock-free, 2. 뮤텍스/스핀락/세마포어 인벤토리, CL_WF10_WiFiManager, G_WF10_BACKOFF_INIT_MS, G_WF10_BACKOFF_MAX_MS, G_WF10_BACKOFF_MUL, G_WF10_MULTI_RUN_TIMEOUT_MS, G_WF10_RECONNECT_MAX (+7 more)

### Community 13 - "SNTP Time Sync & RTC Management"
Cohesion: 0.09
Nodes (19): CL_TM10_TimeManager, s_activeServerIdx, s_fallbackServers, s_lastRequestMs, s_lastSyncMs, s_mutex, s_nextActionMs, s_primary (+11 more)

### Community 14 - "Frontend DOM & Page Layout"
Cohesion: 0.05
Nodes (38): 10. HTML 변경 예시 (P010_main_0202.html), 11.1 개발 (로컬 http-server), 11.2 배포, 11.3 디버그 (배포 후), 11. 개발 워크플로 (개발 vs 배포), 12. 최적화 요약 (기존 대비), 13. 리스크 및 완화, 14. 개정 이력 (+30 more)

### Community 15 - "JSON Utilities & Dynamic Memory"
Cohesion: 0.08
Nodes (22): _A40__callerOrUnknown(), CL_A40_muxGuard_Critical, _flagSpinlock, cloneStr2SharedStr_safe(), copyStr2Buffer_safe(), Dirty_clearAtomic(), Dirty_readAtomic(), Dirty_setAtomic() (+14 more)

### Community 16 - "Profile & Schedule UI Management"
Cohesion: 0.07
Nodes (38): addProfile(), addSchedule(), addWindProfile(), _buildPresetForm(), deleteProfile(), deleteSchedule(), deleteWindProfile(), escape() (+30 more)

### Community 17 - "User Manual & Operations Guide"
Cohesion: 0.05
Nodes (37): 10.1 팬 모터 안전 듀티 설정, 10.2 설정 저장(`Save`)과 재적용(`Reload`)의 차이점 (중요), 10. 기기 환경설정 및 관리 (`/#/system`), 11. 무선 펌웨어 업데이트 (OTA, `/#/upload`), 12. 자주 묻는 질문 (FAQ) 및 문제 해결, 13. 제품 기술 규격 (Product Specifications), 14. 핵심 조작 요약 치트시트, 1. 30초 빠른 시작 (처음 사용자용) (+29 more)

### Community 18 - "Frontend Architecture & Lifecycle"
Cohesion: 0.05
Nodes (36): 10. 부트스트랩 흐름 (`999.app.js`), 11.1 전체 28 JS 파일, 11. 계층별 파일 명세 요약, 12. 런타임 성능 예측 (v3.0), 13.1 신규 페이지 추가 (예: "스케줄러 미리보기"), 13.2 신규 레벨 (L5) 추가, 13. 확장 시나리오, 14. 강점 요약 (v3.0) (+28 more)

### Community 19 - "4. 프론트엔드 v0202 SPA"
Cohesion: 0.25
Nodes (8): 4. 프론트엔드 v0202 SPA, T-29. 초기 로드 — SPA Shell 3자산, T-30. 해시 라우팅 — 12페이지 마운트, T-31. 레벨 접근 제어 — L1~L4, T-32. 언어 토글 — ko/en, T-33. 대시보드 핵심 동작, T-34. 설정 Save→Reload 순서, T-35. WS 5채널 + 자동 재연결

### Community 20 - "Module: argparse"
Cohesion: 0.14
Nodes (15): _err(), find_repo_root(), _info(), main(), _run(), verify_required_files(), build_css_bundle(), build_js_bundle() (+7 more)

### Community 21 - "Module: SPEC 0202.md"
Cohesion: 0.06
Nodes (30): 1.1 리팩토링 이력 (Batch A~F), 1. 시스템 개요, 2. 하드웨어 핀맵, 3.1 코어/상수/유틸, 3.2 설정 관리 (C10), 3.3 중앙 제어 (CT10), 3.4 주변 모듈, 3.5 E-2 파일 분할 원칙 (+22 more)

### Community 22 - "Module: DHT"
Cohesion: 0.08
Nodes (18): A40_parseHHMMtoMin_24h(), C10_validateNoOverlapByDay(), CL_CT10_ControlManager::checkAutoOff(), CL_CT10_ControlManager::findActiveScheduleIndex(), CL_CT10_ControlManager::getCurrentHumidityMock(), CL_CT10_ControlManager::getCurrentTemperatureMock(), CL_CT10_ControlManager::initAutoOffFromSchedule(), CL_CT10_ControlManager::initAutoOffFromUserProfile() (+10 more)

### Community 23 - "Module: EN CT10 state t"
Cohesion: 0.11
Nodes (9): A00_init(), CL_CT10_ControlManager::markDirty(), CT10_markDirtyFromSim(), CT10_WS_applyPolicyFromSystem(), CT10_WS_begin(), CT10_WS_buildPriorityOrderFromConfig(), CT10_WS_measurePayloadBytes(), CT10_WS_setBrokers() (+1 more)

### Community 24 - "Module: A20 resetPresetEntryDefau"
Cohesion: 0.10
Nodes (16): A20_resetPresetEntryDefault(), A20_resetStyleEntryDefault(), A20_resetStyleFactorsDefault(), A20_resetWindDictDefault(), A20_resetWindPresetFactorsDefault(), CL_C10_ConfigManager::addWindProfileFromJson(), CL_C10_ConfigManager::updateWindProfileFromJson(), C10_hasDupCode() (+8 more)

### Community 25 - "Module: arduinojson"
Cohesion: 0.14
Nodes (10): A20_findPresetByCode(), A20_findSegModeByCode(), A20_findStyleByCode(), A20_getPresetNameByCode(), A20_getStaticPresetIndexByCode(), A20_resetResolvedWindDefault(), , EN_C10_OVL_FAIL_ON_OVERLAP (+2 more)

### Community 26 - "Module: .factoryResetFromDefault"
Cohesion: 0.15
Nodes (20): CL_W10_WebAPI::routeConfigDirtySave(), CL_W10_WebAPI::routeConfigInit(), CL_W10_WebAPI::routeReload(), CL_W10_WebAPI::routeControl(), CL_W10_WebAPI::routeControlSummary(), CL_W10_WebAPI::routeMotionFeed(), CL_W10_WebAPI::routeSimState(), CL_W10_WebAPI::routeSimulation() (+12 more)

### Community 27 - "Module: 0200 005 프론트 설계 01.md"
Cohesion: 0.07
Nodes (28): 10. 재사용성 개선 요약, 11.1 Dashboard 진입 (i18n 적용), 11.2 FSM 배지 (i18n 자동), 11.3 언어 변경 이벤트 (페이지 자동 갱신), 11. 페이지 조립 예시 (v1.1 반영), 12. 마이그레이션 (기존 8파일 → 11파일), 13. 개정 이력, 1. 기술 스택 및 제약 (+20 more)

### Community 28 - "Module: T-14. A-1 — FIXED self-he"
Cohesion: 0.11
Nodes (8): CL_CT10_ControlManager::applySegmentOff(), CL_CT10_ControlManager::applySegmentOn(), CL_CT10_ControlManager::tickOverride(), CL_CT10_ControlManager::tickSegmentSequence(), CL_CT10_ControlManager::updateRunCtxOnSegmentOff(), CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Profile(), CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Schedule(), CT10_resetActiveSegSnapshot()

### Community 29 - "Module: ensure"
Cohesion: 0.14
Nodes (28): _ensure(), epochToTimeStr(), _exportCsv(), _exportJson(), getReasonMeta(), getStateMeta(), handle(), _mountComponents() (+20 more)

### Community 30 - "Module: EN A20 CONTROL RUN CONTIN"
Cohesion: 0.07
Nodes (27): , EN_A20_CONTROL_RUN_CONTINUE, EN_A20_CONTROL_RUN_SCHEDULE, EN_A20_SEG_MODE_COUNT, EN_A20_SEG_MODE_FIXED, EN_A20_SEG_MODE_PRESET, EN_A20_WIND_PHASE_CALM, EN_A20_WIND_PHASE_COUNT (+19 more)

### Community 31 - "Module: .deleteSchedule"
Cohesion: 0.16
Nodes (5): 3. async_tcp WCET (F-05/F-06/D-1 반영 후), CL_W10_WebAPI::routeSchedulesID(), CL_W10_WebAPI::routeUserProfilesID(), CL_W10_WebAPI::routeUserProfilesPatch(), CL_W10_WebAPI::routeWindProfileID()

### Community 32 - "Module: ai"
Cohesion: 0.12
Nodes (26): ai(), _applyInitial(), _applyInitialState(), chart(), dashboard(), delegate(), diagnostics(), error() (+18 more)

### Community 33 - "Module: EN A20 segment mode t"
Cohesion: 0.14
Nodes (16): A20_modeFromString(), A20_modeToString(), A20_resetUserProfilesDefault(), CL_C10_ConfigManager::addUserProfilesFromJson(), CL_C10_ConfigManager::updateUserProfilesFromJson(), CL_C10_ConfigManager::patchUserProfilesFromJson(), CL_C10_ConfigManager::toJson_UserProfiles(), CL_C10_ConfigManager::loadUserProfiles() (+8 more)

### Community 34 - "Module: A22 Com Lookup 0202.h"
Cohesion: 0.14
Nodes (7): A20_findPresetIndexByCode(), A20_findStyleIndexByCode(), CL_S10_Simulation::applyPresetCore(), CL_S10_Simulation::updateGust(), CL_S10_Simulation::updateThermal(), S10_probFromRatePerSec(), S20_resolveWindParams()

### Community 35 - "Module: A20 resetSchedulesDefault"
Cohesion: 0.15
Nodes (15): A20_resetSchedulesDefault(), CL_C10_ConfigManager::addScheduleFromJson(), CL_C10_ConfigManager::updateScheduleFromJson(), CL_C10_ConfigManager::patchSchedulesFromJson(), CL_C10_ConfigManager::toJson_Schedules(), CL_C10_ConfigManager::loadSchedules(), CL_C10_ConfigManager::saveSchedules(), C10_fromJson_ScheduleItem() (+7 more)

### Community 36 - "Module: Build Guides"
Cohesion: 0.08
Nodes (24): Build Guides, Configuration Reference, Core Wind Metrics**, Demo, Doc: Smart Nature Wind (WindScape), Fan Selection, Features, Hardware (+16 more)

### Community 37 - "Module: EN CT10 REASON AUTOOFF TE"
Cohesion: 0.08
Nodes (23): , EN_CT10_REASON_AUTOOFF_TEMP, EN_CT10_REASON_AUTOOFF_TIME, EN_CT10_REASON_AUTOOFF_TIMER, EN_CT10_REASON_MOTION_NO_PRESENCE, EN_CT10_REASON_NO_ACTIVE_SCHEDULE, EN_CT10_REASON_NO_SCHEDULES, EN_CT10_REASON_NONE (+15 more)

### Community 38 - "Module: 0200 004 백앤드리팩토링.md"
Cohesion: 0.08
Nodes (23): → 0건 기대, define G_TM10_MAX_SYNC_INTERVAL_MS (24UL * 60UL * 60UL * 1000UL), define G_TM10_MIN_SYNC_INTERVAL_MS (5UL * 60UL * 1000UL), define G_TM10_RETRY_BACKOFF_MS (2000UL), define G_TM10_SYNC_RECENT_WINDOW_MS (10UL * 60UL * 1000UL), define G_TM10_SYNC_TIMEOUT_MS (15000UL), E-6에서 saveToFile 제거 후, 링커가 실제 미참조 확인, → {"state":false,"metrics":false,"chart":false,"summary":false} (소비 후) (+15 more)

### Community 39 - "Module: .addScheduleFromJson"
Cohesion: 0.16
Nodes (4): CL_C10_ConfigManager::toJson_All(), CL_W10_WebAPI::routeSchedules(), CL_W10_WebAPI::routeUserProfiles(), CL_W10_WebAPI::routeWifiConfig()

### Community 40 - "7.1 래치 해제 경로"
Cohesion: 0.18
Nodes (5): 7.1 래치 해제 경로, 7.2 AutoOff offTime 재트리거 방지, 7.3 이벤트 상태 hold/ACK, 7. AutoOff 래치 및 이벤트 상태, CL_CT10_ControlManager::startOverridePreset()

### Community 41 - "Module: applyTo"
Cohesion: 0.14
Nodes (20): applyTo(), atLeast(), capitalize(), checkFw(), _clearMain(), _closeSidebarOnMobile(), current(), dispatch() (+12 more)

### Community 42 - "Module: closeAll"
Cohesion: 0.15
Nodes (10): closeAll(), debug(), get(), getApiKey(), getState(), info(), isDebug(), start() (+2 more)

### Community 43 - "Module: cstring"
Cohesion: 0.18
Nodes (11): C10_wsChannelFromName(), CL_C10_ConfigManager::loadSystemConfig(), CL_C10_ConfigManager::patchMotionFromJson(), CL_C10_ConfigManager::patchSystemFromJson(), CL_C10_ConfigManager::patchWifiFromJson(), CL_C10_ConfigManager::saveMotionConfig(), CL_C10_ConfigManager::saveSystemConfig(), CL_C10_ConfigManager::saveWifiConfig() (+3 more)

### Community 44 - "Module: ST A20 CommonAsset t"
Cohesion: 0.12
Nodes (19): ST_A20_CommonAsset_t, isCommon, path, uri, ST_A20_ReDirectItem_t, uriFrom, uriTo, ST_A20_WebPageConfig_t (+11 more)

### Community 45 - "Module: A20 resetAdjustDeltaDefau"
Cohesion: 0.12
Nodes (10): A20_resetAdjustDeltaDefault(), A20_resetAutoOffDefault(), A20_resetMotionCommonDefault(), A20_resetPirDefault(), A20_resetSchAutoOffDefault(), A20_resetScheduleItemDefault(), A20_resetSchedulePeriodDefault(), A20_resetScheduleSegmentDefault() (+2 more)

### Community 46 - "Module: 2.1 상태 정의"
Cohesion: 0.15
Nodes (6): 2.1 상태 정의, 2.2 상태 전이 우선순위 (`decideRunSource`), 2.3 상태 전이표, 2.4 Batch F-5: profile fall-through 차단, 2. CT10 메인 제어 상태머신 (7-State FSM), CL_CT10_ControlManager::tickLoop()

### Community 47 - "Module: buildPathWithSuffix"
Cohesion: 0.12
Nodes (18): _buildPathWithSuffix(), _io_callerOrUnknown(), Load_File2JsonDoc_V21(), _parseJsonFileToDoc(), Save_JsonDoc2File_V21(), CL_C10_ConfigManager::begin(), CL_C10_ConfigManager::freeAll(), CL_C10_ConfigManager::freeLazySection() (+10 more)

### Community 48 - "Module: BUDGET 0202.md"
Cohesion: 0.12
Nodes (16): 11. 개정 이력, 1. 태스크별 자원 할당 매트릭스, 5. FreeRTOS 스택 예산, 7.1 LittleFS 에셋 절감, 7.2 동시 HTTP 소켓, 7. 플래시 및 네트워크 소켓 예산, 8.1 배포 자산 실측 (2026-10-21 CI), 8.2 JS 번들 상세 (Layer별 gzip 기여도) (+8 more)

### Community 49 - "Module: CL M10 MotionLogic"
Cohesion: 0.15
Nodes (5): CL_M10_MotionLogic, _onChange, _pir, s_stateMutex, _state

### Community 50 - "Module: 기본 환경"
Cohesion: 0.13
Nodes (15): 기본 환경, 🏗️ 1. 개발 환경 개요, 📁 2. 프로젝트 소스 및 디렉토리 구조, 📌 2단계 필수 탐색 프로토콜 (Two-Step Navigation Pr, ⚙️ 3. 주요 설정 (`platformio.ini`), 🌐 4. 주요 웹/API 엔드포인트 (v0200), 🛠️ 5. 빌드 및 배포 가이드, 🤖 6. Antigravity와 협업 가이드 (+7 more)

### Community 51 - "Module: FLOW 0202.md"
Cohesion: 0.13
Nodes (14): 10. 예외/폴백 경로, 11.1 빌드 전처리 (`pio_gzip_0202.py`), 11.2 런타임 정적 서빙 (`W10_Web_Static_0202.cpp`), 11. 웹 에셋 빌드/서빙 파이프라인, 12. 개정 이력, 1. 부팅 시퀀스 (`A00_init()`), 3. 설정 재로드(Reload) 위임 시퀀스 (F-05), 4. Motion Patch 위임 시퀀스 (F-06) (+6 more)

### Community 52 - "Module: 3. 백엔드 Batch A~F 신규"
Cohesion: 0.13
Nodes (15): 3. 백엔드 Batch A~F 신규, T-15. A-2 — 캡슐화 위임, T-16. B-1 — 버전 SSOT, T-17. C — 매직넘버 상수화 물리 출력 무변동, T-18. D-1 — WS 배치 mutex, T-19. D-2/3/5 — heap 안정성, T-20. E — 링크 무결성, T-21. E-2.1 — TM10 분리 SNTP 재동기화 (+7 more)

### Community 53 - "Module: 033.util.template.js"
Cohesion: 0.26
Nodes (14): ai(), chart(), dashboard(), diagnostics(), firmware(), info(), logs(), network() (+6 more)

### Community 54 - "Module: 050.ws.js"
Cohesion: 0.22
Nodes (4): closeAll(), get(), initByLevel(), WsClient

### Community 55 - "Module: .applyPresetCore"
Cohesion: 0.21
Nodes (6): CL_S10_Simulation::applyResolvedWind(), CL_S10_Simulation::begin(), CL_S10_Simulation::resetDefaults(), CL_S10_Simulation::patchFromJson(), CL_S10_Simulation::toJson(), CL_S10_Simulation::updatePhase()

### Community 56 - "Module: ST A20 PageAsset t"
Cohesion: 0.22
Nodes (9): ST_A20_PageItem_t, enable, isMain, label, order, pageAssetCount, pageAssets, path (+1 more)

### Community 57 - "Module: 10. Batch A~F 예산 영향 요약"
Cohesion: 0.15
Nodes (5): 10. Batch A~F 예산 영향 요약, 3. S10 시뮬레이션 물리 엔진 상태, CL_S10_Simulation::tick(), S10_millis2EpochMs(), CL_S10_Simulation::toChartJson()

### Community 58 - "Module: 130.ui.form.js"
Cohesion: 0.20
Nodes (7): append(), _levelClass(), refresh(), render(), setItems(), setSelected(), _trim()

### Community 59 - "Module: ApiError"
Cohesion: 0.15
Nodes (13): ApiError, append(), buildQuery(), diag(), getConfigDirty(), _levelClass(), msToSecLabel(), overrideFixed() (+5 more)

### Community 60 - "Module: Adafruit NeoPixel"
Cohesion: 0.18
Nodes (6): CL_A30_LED, _lastLedMs, _ledState, _numPixels, _pin, _pixel

### Community 61 - "Module: AsyncWebServerResponse"
Cohesion: 0.24
Nodes (6): CL_W10_WebAPI::W10_registerStaticRoute(), CL_W10_WebAPI::_applyHeaders(), CL_W10_WebAPI::checkApiKey(), CL_W10_WebAPI::parseJsonBody(), CL_W10_WebAPI::sendJson(), CL_W10_WebAPI::sendText()

### Community 62 - "Module: ST A20 NvsSpecConfig t"
Cohesion: 0.24
Nodes (11): ST_A20_NvsSpecConfig_t, entries, entryCount, namespaceName, A20_resetNvsSpecDefault(), CL_C10_ConfigManager::loadNvsSpecConfig(), CL_C10_ConfigManager::patchNvsSpecFromJson(), CL_C10_ConfigManager::patchWebPageFromJson() (+3 more)

### Community 63 - "Module: 270.page.network.js"
Cohesion: 0.31
Nodes (10): _loadSystemTime(), _loadWifiConfig(), _loadWifiState(), mount(), _onAddSta(), _onDeleteSta(), _onSaveTime(), _onSaveWifi() (+2 more)

### Community 64 - "Module: ackEvent"
Cohesion: 0.23
Nodes (9): ackEvent(), _applyPresetList(), _bindConnectionStatus(), _bindLastUpdate(), _bindStore(), render(), setItems(), setSelected() (+1 more)

### Community 65 - "Module: A20 resetMotionDefault"
Cohesion: 0.17
Nodes (7): A20_resetMotionDefault(), A20_resetSystemDefault(), A20_resetToDefault(), A20_resetWebSocketDefault(), A20_resetWifiDefault(), CL_C10_ConfigManager::loadMotionConfig(), CL_C10_ConfigManager::loadWifiConfig()

### Community 66 - "Module: CL A40 MutexGuard Semapho"
Cohesion: 0.24
Nodes (4): CL_A40_MutexGuard_Semaphore, _acquired, _caller, _mutexPtr

### Community 67 - "Module: 070.router.js"
Cohesion: 0.30
Nodes (9): capitalize(), _clearMain(), _closeSidebarOnMobile(), dispatch(), init(), parseHash(), renderNavMenu(), _showError() (+1 more)

### Community 68 - "Module: 200.page.dashboard.js"
Cohesion: 0.29
Nodes (9): _applyInitialState(), _applyPresetList(), _bindStore(), mount(), _mountComponents(), _onIntensityChange(), _onPowerToggle(), _onPresetSelect() (+1 more)

### Community 69 - "Module: 230.page.profiles.js"
Cohesion: 0.35
Nodes (9): _highlightActive(), _load(), mount(), _onAdd(), _onDelete(), _onEdit(), _onStart(), _onStop() (+1 more)

### Community 70 - "Module: .sendText"
Cohesion: 0.23
Nodes (6): CL_W10_WebAPI::routeGeminiProxy(), W10_callGeminiApi(), W10_getGeminiApiKey(), CL_W10_WebAPI::getUploadPath(), CL_W10_WebAPI::routeUpdate(), extractSafeFileName()

### Community 71 - "Module: ST W10 MenuState t"
Cohesion: 0.17
Nodes (10): ST_W10_MenuState_t, main_path, pages_sorted, ST_W10_PageEntry_t, enable, isMain, label, order (+2 more)

### Community 72 - "CT10_Ctl_Ctl_0202.cpp"
Cohesion: 0.11
Nodes (8): CL_CT10_ControlManager::applyManual(), CL_CT10_ControlManager::applyMotionSimConfigToSim(), CL_CT10_ControlManager::begin(), CL_CT10_ControlManager::exportSimJson(), CL_CT10_ControlManager::feedPIR(), CL_CT10_ControlManager::patchSimFromJson(), CL_CT10_ControlManager::reloadAll(), CL_CT10_ControlManager::setMotion()

### Community 73 - "Module: 034.util.toast.js"
Cohesion: 0.33
Nodes (8): _ensure(), error(), handle(), info(), show(), success(), warn(), wrap()

### Community 74 - "Module: 300.page.windprofile.js"
Cohesion: 0.40
Nodes (8): _buildPresetForm(), _load(), mount(), _onAdd(), _onDelete(), _onEdit(), _readPresetForm(), _renderList()

### Community 75 - "Module: ST ChartEntry"
Cohesion: 0.18
Nodes (11): ST_ChartEntry, gust_active, intensity, preset_index, pwm_duty, target_wind, thermal_active, timestamp (+3 more)

### Community 76 - "Module: introduce Doc 0202 001.md"
Cohesion: 0.18
Nodes (10): 🌿 1. 단순한 ‘바람’이 아닌, ‘자연’을 전하다, ⚙️ 2. 대기역학을 품은 바람 — Realistic Wind Physics (S10 / S20), 🚀 3. 외부 허브 없는 Standalone 초고속 풀스택 시스템, 🤖 4. 지능형 센서 연동 & 하드웨어 무소음 규격, 📅 5. 주간 정밀 스케줄러 & 맞춤형 바람 프로파일, 🗺️ 6. 10종 자연풍 테마 프리셋 (Nature Wind Presets), 🔋 7. Plug & Play — 간편한 구성과 확장성, 💡 8. 결론 — 바람을 ‘디자인’하는 새로운 시대 (+2 more)

### Community 78 - "Module: 4.1 W10 정적 웹 에셋 서빙 계약"
Cohesion: 0.22
Nodes (5): 4.1 W10 정적 웹 에셋 서빙 계약, 5.4.8 v0202 자산 하위 호환, 8. 장애 진단 및 트러블슈팅, CL_W10_WebAPI::routeStaticAssets(), CL_W10_WebAPI::W10_registerGzipServe()

### Community 79 - "Module: 220.page.schedule.js"
Cohesion: 0.44
Nodes (7): _load(), mount(), _onAdd(), _onDelete(), _onEdit(), _onToggle(), _renderList()

### Community 80 - "Module: ST A20 cfg jsonFile t"
Cohesion: 0.22
Nodes (9): ST_A20_cfg_jsonFile_t, motion, nvsSpec, schedules, system, userProfiles, webPage, wifi (+1 more)

### Community 82 - "Module: 210.page.chart.js"
Cohesion: 0.42
Nodes (6): _applyInitial(), _exportCsv(), mount(), _onWsChart(), _pushPoint(), _redrawRange()

### Community 83 - "Module: 120.ui.chart.js"
Cohesion: 0.46
Nodes (7): clear(), destroy(), draw(), _drawSeries(), push(), resize(), setMaxPoints()

### Community 84 - "Module: 240.page.settings.js"
Cohesion: 0.39
Nodes (5): _loadSystem(), mount(), _onFactoryReset(), _onSave(), _waitReloadComplete()

### Community 87 - "Module: 260.page.firmware.js"
Cohesion: 0.43
Nodes (4): _loadVersion(), mount(), _onUploadFile(), _onUploadFw()

### Community 88 - "Module: 290.page.ai.js"
Cohesion: 0.43
Nodes (4): _appendMessage(), mount(), _onSend(), _replaceLastAssistant()

### Community 89 - "Module: 0200 003.md"
Cohesion: 0.29
Nodes (6): 🔧 [4] `CT10_Ctl_0202.h` — B-N-1a, → Content-Encoding: gzip 헤더가 포함되어야 함, Gzip 헤더 확인, 검증 명령, 번들 파일 존재 확인, 파일 수정 항목

### Community 91 - "Module: 280.page.logs.js"
Cohesion: 0.47
Nodes (3): _exportJson(), _loadInitial(), mount()

### Community 93 - "Module: 030.util.level.js"
Cohesion: 0.60
Nodes (3): applyTo(), atLeast(), current()

### Community 96 - "Module: 규칙 준수 여부 점검 (Audit)"
Cohesion: 0.50
Nodes (4): 규칙 준수 여부 점검 (Audit), Doc: /maintenance - 규칙 유지보수 워크플로우, 규칙 고도화 (Improvement), 코드 보완 (Refactor)

### Community 97 - "Module: ST A20 NvsEntry t"
Cohesion: 0.50
Nodes (4): ST_A20_NvsEntry_t, defaultValue, key, type

### Community 103 - "Module: 0200 001.md"
Cohesion: 0.50
Nodes (3): 또는 직접 메시지 지정, 메시지 지정, 실행 정책 오류 시

### Community 104 - "Module: 0200 002.md"
Cohesion: 0.50
Nodes (3): 3️⃣ 실행 예시 (검증 시나리오), Linux / macOS, 또는

### Community 111 - "CL_CT10_ControlManager::exportStateJson_v02"
Cohesion: 0.21
Nodes (6): CL_CT10_ControlManager::exportChartJson(), CL_CT10_ControlManager::exportMetricsJson(), CL_CT10_ControlManager::exportStateJson_v02(), CL_CT10_ControlManager::exportSummaryJson(), CT10_reasonToString(), CT10_stateToString()

### Community 112 - "2. 백엔드 기존 회귀"
Cohesion: 0.15
Nodes (12): 2. 백엔드 기존 회귀, T-10. N-1 (`lastReloadOk`) — 상태 노출, T-11. G-1 (Accept-Encoding) — gzip/raw 분기, T-12. G-2/G-4 (Long Path) — regex gzip, T-13. N-3 (Root Fallback) — 무한 루프 차단, T-1. F-03 (M10 tick) — PIR holdSec 정상 만료, T-3. F-05 (Reload 위임) — 비동기 202 + pendingReload 폴링, T-4. F-05 (중복 방지) — 409 Conflict (+4 more)

### Community 113 - ".parseJsonBody"
Cohesion: 0.22
Nodes (7): 4.3 POST/PATCH 공통 헬퍼 계약 (F-2, F-3), 5.1 API 응답 필드 (Batch N-1, F-2, F-3), CL_W10_WebAPI::routeFirmwareCheck(), CL_W10_WebAPI::routeTimeSet(), _routeWifiConfigPatchBody(), _w10_compareSemVer(), _routeSystemPatchBody()

### Community 114 - "CL_CT10_ControlManager::applyDecision"
Cohesion: 0.20
Nodes (4): CL_CT10_ControlManager::startUserProfileByNo(), CL_CT10_ControlManager::stopUserProfile(), CL_CT10_ControlManager::applyDecision(), CL_CT10_ControlManager::decideRunSource()

### Community 115 - "STATE_0202.md — 상태 소유권 및 FSM 명세"
Cohesion: 0.20
Nodes (9): 4. WF10 Wi-Fi 상태머신, 5. TM10 시간 동기화 상태, 6.1 F-05 Pending Reload, 6.2 F-06 Pending Motion.Sim Apply, 6.3 Batch D-1 Dirty 배치 소비, 6. 위임 플래그 라이프사이클 (F-05, F-06), 8. E-2 분할 파일 상태 소유권 (신규), 9. 개정 이력 (+1 more)

### Community 116 - "7.3 Batch A~F 신규"
Cohesion: 0.25
Nodes (4): 7.1 기존 (F-01~I-6), 7.2 N/G (N-1~N-4, G-1~G-3), 7.3 Batch A~F 신규, 7. 감사 관측 및 이슈 추적표

### Community 117 - "TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.3)"
Cohesion: 0.33
Nodes (5): 10. 개정 이력, 7. 회귀 매트릭스 요약, TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.3), 릴리스 차단 필수 세트 (최소 13건), 📋 목차

### Community 118 - "5. 정적 감사"
Cohesion: 0.33
Nodes (6): 5. 정적 감사, T-36. 계약 문서 gate (CI), T-37. 잔존 참조 grep, T-38. F-10 매크로 승격, T-39. F-4 Logger 초기 INFO, T-40. 프론트엔드 하드코딩 감사

### Community 119 - "6. 부하/안정성"
Cohesion: 0.33
Nodes (6): 6. 부하/안정성, T-41. Heap 안정성 (5분), T-42. 24시간 장기 안정성, T-43. OTA 업데이트, T-44. Factory reset 반복 3회, T-45. 브라우저 크로스 확인

### Community 120 - ".tickSegmentSequence"
Cohesion: 0.47
Nodes (3): T-14. A-1 — FIXED self-heal 폭주 방지, CL_CT10_ControlManager::tickSchedule(), CL_CT10_ControlManager::tickUserProfile()

### Community 121 - "ST_A20_PageAsset_t"
Cohesion: 0.40
Nodes (5): ST_A20_PageAsset_t, path, uri, A20_resetPageAssetDefault(), A20_resetPageItemDefault()

### Community 122 - "1. 검증 개요 및 준비"
Cohesion: 0.40
Nodes (5): 1.1 검증 계층 구조, 1.2 검증 환경, 1.3 사전 준비, 1.4 도구 준비, 1. 검증 개요 및 준비

### Community 123 - "src_v0202_a20_const_wifi_0202"
Cohesion: 0.50
Nodes (4): , EN_A20_WIFI_MODE_AP, EN_A20_WIFI_MODE_AP_STA, EN_A20_WIFI_MODE_STA

### Community 124 - "9. Phase 7 릴리스 게이트"
Cohesion: 0.50
Nodes (4): 9.1 게이트 체크리스트, 9.2 릴리스 승인 조건, 9.3 릴리스 태그, 9. Phase 7 릴리스 게이트

### Community 125 - "src_v0202_wf10_wifimgr_0202"
Cohesion: 0.50
Nodes (4): , EN_WF10_REQ_COALESCED, EN_WF10_REQ_FAILED, EN_WF10_REQ_OK

## Knowledge Gaps
- **353 isolated node(s):** `EN_A20_CONTROL_RUN_CONTINUE`, `EN_A20_CONTROL_RUN_SCHEDULE`, `EN_A20_WIND_PHASE_CALM`, `EN_A20_WIND_PHASE_NORMAL`, `EN_A20_WIND_PHASE_STRONG` (+348 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 957 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CL_CT10_ControlManager` connect `Control Manager & Operating Modes` to `Wind Physics & Simulation Engine`, `ESP32 Hardware & Platform Core`, `Web Server & Telemetry Broadcast`, `Module: EN CT10 REASON AUTOOFF TE`, `Main Event Loop & WCET Scheduling`, `7.1 래치 해제 경로`, `CT10_Ctl_Ctl_0202.cpp`, `Control Dispatch & Motion Execution`, `Module: 2.1 상태 정의`, `CL_CT10_ControlManager::exportStateJson_v02`, `2. 백엔드 기존 회귀`, `Module: buildPathWithSuffix`, `CL_CT10_ControlManager::applyDecision`, `Module: EN CT10 state t`, `.tickSegmentSequence`, `Module: T-14. A-1 — FIXED self-he`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `EN_A20_CONTROL_RUN_CONTINUE`, `EN_A20_CONTROL_RUN_SCHEDULE`, `EN_A20_WIND_PHASE_CALM` to the rest of the system?**
  _353 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Wind Physics & Simulation Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly interconnected._
- **Why does `CL_S10_Simulation` connect `Wind Physics & Simulation Engine` to `Control Manager & Operating Modes`, `ESP32 Hardware & Platform Core`, `Control Dispatch & Motion Execution`, `Module: ST ChartEntry`, `Module: .applyPresetCore`, `Module: 10. Batch A~F 예산 영향 요약`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Control Manager & Operating Modes` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Why does `CL_W10_WebAPI` connect `Web Server & Telemetry Broadcast` to `Control Manager & Operating Modes`, `ESP32 Hardware & Platform Core`, `Module: .sendText`, `Module: ST W10 MenuState t`, `Diagnostic Logging & Trace`, `Module: 4.1 W10 정적 웹 에셋 서빙 계약`, `.parseJsonBody`, `7.3 Batch A~F 신규`, `Module: EN CT10 state t`, `Module: .factoryResetFromDefault`, `Module: AsyncWebServerResponse`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Frontend API Client & Services` be split into smaller, more focused modules?**
  _Cohesion score 0.0677555958862674 - nodes in this community are weakly interconnected._