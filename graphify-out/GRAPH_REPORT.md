# Graph Report - SmartNatureWind_v002  (2026-10-27)

## Corpus Check
- 169 files · ~224,804 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .css 11, (none) 8, .csv 1)

## Summary
- 2503 nodes · 4465 edges · 144 communities (120 shown, 24 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 606 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fd8b7185`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Wind Physics & Simulation Engine
- Control Manager & Operating Modes
- 0202_005.md
- src_v0202_d10_logger_0202
- Web Server & Telemetry Broadcast
- CL_N10_NvsManager
- Main Event Loop & WCET Scheduling
- Frontend Specification & Plan
- UI Runtime & Application Bundle
- CL_D10_Logger
- CL_C10_ConfigManager
- Control Dispatch & Motion Execution
- WiFi Networking & Station Protocol
- SNTP Time Sync & RTC Management
- Frontend DOM & Page Layout
- v0202/A40_Com_Utils_0202.h
- Profile & Schedule UI Management
- Smart Nature Wind v0202 — 사용자 매뉴얼 (User Manual)
- Frontend Architecture & Lifecycle
- TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.5)
- Module: argparse
- 5.4 프론트엔드 자산 규격 (v2.4 신규)
- Module: DHT
- CL_CT10_ControlManager::tickLoop
- CL_A40_MutexGuard_Semaphore
- ST_A20_WebPageConfig_t
- Module: .factoryResetFromDefault
- Module: 0200 005 프론트 설계 01.md
- Module: T-14. A-1 — FIXED self-he
- Module: ensure
- Module: EN A20 CONTROL RUN CONTIN
- 3. async_tcp WCET (F-05/F-06/D-1 반영 후)
- Module: ai
- C10_Config_UzProf_Util_0202.cpp
- Module: A22 Com Lookup 0202.h
- 040.api.js
- Module: Build Guides
- Module: EN CT10 REASON AUTOOFF TE
- Module: 0200 004 백앤드리팩토링.md
- C10_Config_Sch_Util_0202.cpp
- 033.util.template.js
- WsClient
- Module: closeAll
- Module: cstring
- ST_A20_WebPageConfig_t
- 200.page.dashboard.js
- C10_loadWindDictFromJsonChecked
- 2. 백엔드 기존 회귀
- Module: BUDGET 0202.md
- Module: CL M10 MotionLogic
- Module: 기본 환경
- Module: FLOW 0202.md
- Module: 3. 백엔드 Batch A~F 신규
- 130.ui.form.js
- 270.page.network.js
- Module: .applyPresetCore
- A20_resetScheduleItemDefault
- Module: 10. Batch A~F 예산 영향 요약
- 070.router.js
- Arduino.h
- Module: Adafruit NeoPixel
- Module: AsyncWebServerResponse
- AwsEventType
- dispatch
- Module: ackEvent
- W10_Web_Upload_0202.cpp
- A40_Com_Utils_IO_0202.cpp
- 1. 상태 변수 소유권 및 접근 매트릭스
- 220.page.schedule.js
- 230.page.profiles.js
- Module: .sendText
- Module: ST W10 MenuState t
- CL_C10_ConfigManager::saveAll
- 240.page.settings.js
- 034.util.toast.js
- Module: ST ChartEntry
- Module: introduce Doc 0202 001.md
- A20_resetToDefault
- CL_CT10_ControlManager::exportStateJson_v02
- escape
- Module: ST A20 cfg jsonFile t
- 3.1 Batch G — P0 크리티컬 회귀 (T-46 ~ T-50)
- 300.page.windprofile.js
- 210.page.chart.js
- Store
- 120.ui.chart.js
- 260.page.firmware.js
- 290.page.ai.js
- 030.util.time.js
- Module: 0200 003.md
- 031.util.dom.js
- 245.page.simulation.js
- 250.page.diagnostics.js
- 280.page.logs.js
- 032.util.log.js
- Module: 규칙 준수 여부 점검 (Audit)
- ST_A20_PageItem_t
- 020.i18n.js
- 030.util.level.js
- 999.app.js
- Module: 0200 001.md
- Module: 0200 002.md
- §7 회귀 매트릭스 요약 — L6 신규 + 필수 세트 확장
- Module: Doc: WindScape Configurat
- CT10_Ctl_IOWS_0202.cpp
- .parseJsonBody
- §1.2 검증 환경 — 계약 문서 버전 갱신
- STATE_0202.md — 상태 소유권 및 FSM 명세
- .parseJsonBody
- CL_C10_ConfigManager::toJson_All
- 3.2 Batch G — P1 회귀 (T-51 ~ T-67)
- strlcpy
- 7.1 래치 해제 경로
- .getRootSnapshot
- W10_Web_WS_0202.cpp
- 0202_001.md
- test_mocks_d10_logger_0202
- 5. 정적 감사
- 8. 프론트엔드 자산 예산 (v0202 SPA)
- 7. 감사 관측 및 이슈 추적표
- 10. Batch A~F 예산 영향 요약
- SPEC_0202.md — Smart Nature Wind v0202 종합 기술 사양서
- 4. 프론트엔드 v0202 SPA
- 3. 모듈 구성 및 파일 매핑 (v0202 접미사)
- 6. 부하/안정성
- ST_A20_NvsEntry_t
- 9. Phase 7 릴리스 게이트
- src_v0202_wf10_wifimgr_0202
- W10_Web_Routes_0202.cpp

## God Nodes (most connected - your core abstractions)
1. `CL_CT10_ControlManager` - 110 edges
2. `CL_S10_Simulation` - 85 edges
3. `CL_C10_ConfigManager` - 78 edges
4. `mount()` - 75 edges
5. `CL_W10_WebAPI` - 72 edges
6. `_fetch()` - 54 edges
7. `millis()` - 54 edges
8. `_fetch()` - 50 edges
9. `` - 49 edges
10. `t()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `5.4.5 시간 필드 규격 (`§5.3` 연계)` --references--> `millis()`  [INFERRED]
  src/v0202/contract_doc_0202/SPEC_0202.md → test/mocks/Arduino.h
- `6. 코딩 및 품질 컨벤션` --references--> `strlcpy()`  [INFERRED]
  src/v0202/contract_doc_0202/SPEC_0202.md → test/mocks/Arduino.h
- `5.3.2 절대 시각 변환 규칙 (v0202 필드 활용)` --references--> `millis()`  [INFERRED]
  src/v0202/contract_doc_0202/SPEC_0202.md → test/mocks/Arduino.h
- `5.3.5 v0202 신규 필드 상세` --references--> `millis()`  [INFERRED]
  src/v0202/contract_doc_0202/SPEC_0202.md → test/mocks/Arduino.h
- `1. 부팅 시퀀스 (`A00_init()`)` --references--> `A00_init()`  [INFERRED]
  src/v0202/contract_doc_0202/FLOW_0202.md → src/v0202/A00_Main_0202.cpp

## Import Cycles
- None detected.

## Communities (144 total, 24 thin omitted)

### Community 0 - "Wind Physics & Simulation Engine"
Cohesion: 0.03
Nodes (59): CL_S10_Simulation, active, avgWindCached, baseMaxWind, baseMinWind, CHART_CAPACITY, currentWindSpeed, _fanCfgSnap (+51 more)

### Community 1 - "Control Manager & Operating Modes"
Cohesion: 0.04
Nodes (31): CL_CT10_ControlManager, active, _autoOffLatched, autoOffRt, curProfileIndex, curScheduleIndex, _dirtyChart, _dirtyMetrics (+23 more)

### Community 2 - "0202_005.md"
Cohesion: 0.01
Nodes (158): 1. 0값으로 설정, 1. 10회 연속 GET 시간 측정, 1. LittleFS에서 설정 파일 손상 시뮬레이션, 1. OTA 시작 후 강제 중단 (큰 파일 3초 후 kill), 1. PIR 피드 + 즉시 확인, 1. POST, 1. q=0 (거부), 1. USB 분리 후 전원 인가 (t=0) (+150 more)

### Community 3 - "src_v0202_d10_logger_0202"
Cohesion: 0.08
Nodes (11): CL_M10_MotionLogic, , EN_C10_OVL_FAIL_ON_OVERLAP, EN_C10_OVL_SKIP_DISABLED, EN_C10_OVL_WARN_ONLY, , EN_L10_LOG_DEBUG, EN_L10_LOG_ERROR (+3 more)

### Community 4 - "Web Server & Telemetry Broadcast"
Cohesion: 0.07
Nodes (15): CL_W10_WebAPI, G_W10_MAX_UPLOAD_SIZE, G_W10_PAGES_JSON, s_control, s_menu_state, s_server, s_upFile, s_uploadError (+7 more)

### Community 5 - "CL_N10_NvsManager"
Cohesion: 0.05
Nodes (27): T-57. [B-1] + [B-7] NVS flush — 단일 커밋 + 반환값 검사, CL_CT10_ControlManager::reloadAll(), CL_CT10_ControlManager::startUserProfileByNo(), CL_CT10_ControlManager::stopUserProfile(), CL_CT10_ControlManager::applyManualResolved(), CL_CT10_ControlManager::startOverrideFixed(), CL_CT10_ControlManager::stopOverride(), CL_N10_NvsManager (+19 more)

### Community 6 - "Main Event Loop & WCET Scheduling"
Cohesion: 0.12
Nodes (19): loop(), A00_run(), 2. loopTask WCET 예산 (`A00_run()`), 6. 관측성 메트릭, 2.1 Batch D-4: `s_staConnected` lock-free, 2. 뮤텍스/스핀락/세마포어 인벤토리, 3.1 `g_A20_config_root` 생명주기 (핵심 CBD 계약), 3. 공유 전역 자원 접근 규약 (+11 more)

### Community 7 - "Frontend Specification & Plan"
Cohesion: 0.04
Nodes (47): 10. 단계별 구현 로드맵, 11. 계약 준수 사항 및 개발 가이드라인, 12. 개정 이력, 1.1 목적, 1.2 설계 원칙, 1. 목적 및 설계 원칙, 2. 사용자 역할 정의, 3. 페이지 구조 및 Level 접근 Matrix (+39 more)

### Community 8 - "UI Runtime & Application Bundle"
Cohesion: 0.05
Nodes (38): ApiError, append(), _appendMessage(), _applyPresetList(), asBool(), _bindLangToggle(), _bindTabs(), buildQuery() (+30 more)

### Community 9 - "CL_D10_Logger"
Cohesion: 0.13
Nodes (10): CL_D10_Logger, BUFFER_SIZE, _logLevel, s_buffer, s_count, s_head, s_wsLogs, _serial (+2 more)

### Community 10 - "CL_C10_ConfigManager"
Cohesion: 0.06
Nodes (24): CL_C10_ConfigManager, _dirty_motion, _dirty_nvsSpec, _dirty_schedules, _dirty_system, _dirty_userProfiles, _dirty_webPage, _dirty_wifi (+16 more)

### Community 11 - "Control Dispatch & Motion Execution"
Cohesion: 0.06
Nodes (13): CL_CT10_ControlManager::applyManual(), CL_CT10_ControlManager::applyMotionSimConfigToSim(), CL_CT10_ControlManager::begin(), CL_CT10_ControlManager::exportSimJson(), CL_CT10_ControlManager::patchSimFromJson(), CL_CT10_ControlManager::setMotion(), CL_P10_PWM, G_P10_CURVE_SPAN1 (+5 more)

### Community 12 - "WiFi Networking & Station Protocol"
Cohesion: 0.08
Nodes (14): 1. 실행 컨텍스트 (FreeRTOS Task), CL_WF10_WiFiManager, G_WF10_BACKOFF_INIT_MS, G_WF10_BACKOFF_MAX_MS, G_WF10_BACKOFF_MUL, G_WF10_MULTI_RUN_TIMEOUT_MS, G_WF10_RECONNECT_MAX, s_lastStaStatus (+6 more)

### Community 13 - "SNTP Time Sync & RTC Management"
Cohesion: 0.09
Nodes (19): CL_TM10_TimeManager, s_activeServerIdx, s_fallbackServers, s_lastRequestMs, s_lastSyncMs, s_mutex, s_nextActionMs, s_primary (+11 more)

### Community 14 - "Frontend DOM & Page Layout"
Cohesion: 0.05
Nodes (38): 10. HTML 변경 예시 (P010_main_0202.html), 11.1 개발 (로컬 http-server), 11.2 배포, 11.3 디버그 (배포 후), 11. 개발 워크플로 (개발 vs 배포), 12. 최적화 요약 (기존 대비), 13. 리스크 및 완화, 14. 개정 이력 (+30 more)

### Community 15 - "v0202/A40_Com_Utils_0202.h"
Cohesion: 0.09
Nodes (18): CL_A40_MuxGuard_Critical, _flagSpinlock, Dirty_clearAtomic(), Dirty_readAtomic(), Dirty_setAtomic(), getRandom01(), getRandomRange(), Json_copyStr_LogPolicy() (+10 more)

### Community 16 - "Profile & Schedule UI Management"
Cohesion: 0.08
Nodes (34): addProfile(), addSchedule(), addWindProfile(), deleteProfile(), deleteSchedule(), deleteWindProfile(), factoryReset(), feedPir() (+26 more)

### Community 17 - "Smart Nature Wind v0202 — 사용자 매뉴얼 (User Manual)"
Cohesion: 0.05
Nodes (39): 10.1 대화형 명령 예시, 10.2 설정 방법, 10. Gemini AI 대화형 비서 연동 (`#/ai`), 11. 스마트 센서 모니터링 (`#/sensors`), 12.1 시스템 설정 (`#/settings`), 12.2 설정 저장(`Save`)과 비동기 재적용(`Reload`) (골든 룰), 12.3 오프라인 로컬 개발 및 시연 모드 (`998.offline_0202.js`), 12. 시스템 및 네트워크 고급 설정 (`#/settings` / `#/network`) (+31 more)

### Community 18 - "Frontend Architecture & Lifecycle"
Cohesion: 0.05
Nodes (36): 10. 부트스트랩 흐름 (`999.app.js`), 11.1 전체 28 JS 파일, 11. 계층별 파일 명세 요약, 12. 런타임 성능 예측 (v3.0), 13.1 신규 페이지 추가 (예: "스케줄러 미리보기"), 13.2 신규 레벨 (L5) 추가, 13. 확장 시나리오, 14. 강점 요약 (v3.0) (+28 more)

### Community 19 - "TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.5)"
Cohesion: 0.18
Nodes (10): 10. 개정 이력, 1.1 검증 계층 구조, 1.2 검증 환경, 1.3 사전 준비, 1.4 도구 준비, 1. 검증 개요 및 준비, 7. 회귀 매트릭스 요약, TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.5) (+2 more)

### Community 20 - "Module: argparse"
Cohesion: 0.14
Nodes (15): _err(), find_repo_root(), _info(), main(), _run(), verify_required_files(), build_css_bundle(), build_js_bundle() (+7 more)

### Community 21 - "5.4 프론트엔드 자산 규격 (v2.4 신규)"
Cohesion: 0.18
Nodes (11): 5.2 설정 재적용(Reload) 정책 (I-2, F-05), 5.4.1 배포 자산 (총 3파일 + JSON 10개), 5.4.2 소스 디렉토리 구조, 5.4.3 정적 라우팅 규약 (W10), 5.4.4 `cfg_pages_0202.json` 스키마 (v0202 SPA), 5.4.5 시간 필드 규격 (`§5.3` 연계), 5.4.6 프론트엔드 예산 (v0202 확정), 5.4.7 HTTP 요청 예산 (SPA) (+3 more)

### Community 22 - "Module: DHT"
Cohesion: 0.07
Nodes (28): A40_parseHHMMtoMin_24h(), C10_validateNoOverlapByDay(), 5.3.1 필드 유형 분류, 5.3.2 절대 시각 변환 규칙 (v0202 필드 활용), 5.3.3 SNTP 미동기 정책, 5.3.4 금지 패턴, 5.3.5 v0202 신규 필드 상세, 5.3.6 응답 필드 전량 매트릭스 (+20 more)

### Community 23 - "CL_CT10_ControlManager::tickLoop"
Cohesion: 0.15
Nodes (6): 2.1 상태 정의, 2.2 상태 전이 우선순위 (`decideRunSource`), 2.3 상태 전이표, 2.4 Batch F-5: profile fall-through 차단, 2. CT10 메인 제어 상태머신 (7-State FSM), CL_CT10_ControlManager::tickLoop()

### Community 24 - "CL_A40_MutexGuard_Semaphore"
Cohesion: 0.16
Nodes (8): CL_A40_MutexGuard_Semaphore, _acquired, _caller, _mutexPtr, CL_C10_ConfigManager::begin(), xSemaphoreCreateRecursiveMutex(), xSemaphoreGiveRecursive(), xSemaphoreTakeRecursive()

### Community 25 - "ST_A20_WebPageConfig_t"
Cohesion: 0.12
Nodes (19): ST_A20_CommonAsset_t, isCommon, path, uri, ST_A20_ReDirectItem_t, uriFrom, uriTo, ST_A20_WebPageConfig_t (+11 more)

### Community 26 - "Module: .factoryResetFromDefault"
Cohesion: 0.21
Nodes (18): CL_W10_WebAPI::routeConfigInit(), CL_W10_WebAPI::routeReload(), CL_W10_WebAPI::routeControl(), CL_W10_WebAPI::routeControlSummary(), CL_W10_WebAPI::routeMotionFeed(), CL_W10_WebAPI::routeSimState(), CL_W10_WebAPI::routeSimulation(), CL_W10_WebAPI::routeAuthTest() (+10 more)

### Community 27 - "Module: 0200 005 프론트 설계 01.md"
Cohesion: 0.07
Nodes (28): 10. 재사용성 개선 요약, 11.1 Dashboard 진입 (i18n 적용), 11.2 FSM 배지 (i18n 자동), 11.3 언어 변경 이벤트 (페이지 자동 갱신), 11. 페이지 조립 예시 (v1.1 반영), 12. 마이그레이션 (기존 8파일 → 11파일), 13. 개정 이력, 1. 기술 스택 및 제약 (+20 more)

### Community 28 - "Module: T-14. A-1 — FIXED self-he"
Cohesion: 0.11
Nodes (8): CL_CT10_ControlManager::applySegmentOff(), CL_CT10_ControlManager::applySegmentOn(), CL_CT10_ControlManager::tickOverride(), CL_CT10_ControlManager::tickSegmentSequence(), CL_CT10_ControlManager::updateRunCtxOnSegmentOff(), CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Profile(), CL_CT10_ControlManager::updateRunCtxOnSegmentOn_Schedule(), CT10_resetActiveSegSnapshot()

### Community 29 - "Module: ensure"
Cohesion: 0.17
Nodes (28): _bindModeSwitch(), diag(), _doReload(), error(), _exportJson(), getConfigDirty(), getMetrics(), getState() (+20 more)

### Community 30 - "Module: EN A20 CONTROL RUN CONTIN"
Cohesion: 0.05
Nodes (33): , EN_A20_CONTROL_RUN_CONTINUE, EN_A20_CONTROL_RUN_SCHEDULE, EN_A20_SEG_MODE_COUNT, EN_A20_SEG_MODE_FIXED, EN_A20_SEG_MODE_PRESET, EN_A20_WIND_PHASE_CALM, EN_A20_WIND_PHASE_COUNT (+25 more)

### Community 31 - "3. async_tcp WCET (F-05/F-06/D-1 반영 후)"
Cohesion: 0.13
Nodes (4): 3. async_tcp WCET (F-05/F-06/D-1 반영 후), 7.3 Batch A~F 신규, T-66. [B-12] OTA 세션 중단 재시도, CL_W10_WebAPI::routeStaticAssets()

### Community 32 - "Module: ai"
Cohesion: 0.12
Nodes (28): ai(), _applyInitial(), _applyInitialState(), applyTo(), chart(), dashboard(), delegate(), diagnostics() (+20 more)

### Community 33 - "C10_Config_UzProf_Util_0202.cpp"
Cohesion: 0.14
Nodes (16): A20_modeFromString(), A20_modeToString(), A20_resetUserProfilesDefault(), CL_C10_ConfigManager::addUserProfilesFromJson(), CL_C10_ConfigManager::updateUserProfilesFromJson(), CL_C10_ConfigManager::patchUserProfilesFromJson(), CL_C10_ConfigManager::toJson_UserProfiles(), CL_C10_ConfigManager::loadUserProfiles() (+8 more)

### Community 34 - "Module: A22 Com Lookup 0202.h"
Cohesion: 0.11
Nodes (11): A20_findPresetByCode(), A20_findPresetIndexByCode(), A20_findSegModeByCode(), A20_findStyleByCode(), A20_findStyleIndexByCode(), A20_getPresetNameByCode(), A20_getStaticPresetIndexByCode(), CL_S10_Simulation::applyPresetCore() (+3 more)

### Community 35 - "040.api.js"
Cohesion: 0.07
Nodes (55): ackEvent(), addProfile(), addSchedule(), addWindProfile(), ApiError, buildQuery(), checkFw(), deleteProfile() (+47 more)

### Community 36 - "Module: Build Guides"
Cohesion: 0.08
Nodes (24): Build Guides, Configuration Reference, Core Wind Metrics**, Demo, Doc: Smart Nature Wind (WindScape), Fan Selection, Features, Hardware (+16 more)

### Community 37 - "Module: EN CT10 REASON AUTOOFF TE"
Cohesion: 0.08
Nodes (23): , EN_CT10_REASON_AUTOOFF_TEMP, EN_CT10_REASON_AUTOOFF_TIME, EN_CT10_REASON_AUTOOFF_TIMER, EN_CT10_REASON_MOTION_NO_PRESENCE, EN_CT10_REASON_NO_ACTIVE_SCHEDULE, EN_CT10_REASON_NO_SCHEDULES, EN_CT10_REASON_NONE (+15 more)

### Community 38 - "Module: 0200 004 백앤드리팩토링.md"
Cohesion: 0.08
Nodes (23): → 0건 기대, define G_TM10_MAX_SYNC_INTERVAL_MS (24UL * 60UL * 60UL * 1000UL), define G_TM10_MIN_SYNC_INTERVAL_MS (5UL * 60UL * 1000UL), define G_TM10_RETRY_BACKOFF_MS (2000UL), define G_TM10_SYNC_RECENT_WINDOW_MS (10UL * 60UL * 1000UL), define G_TM10_SYNC_TIMEOUT_MS (15000UL), E-6에서 saveToFile 제거 후, 링커가 실제 미참조 확인, → {"state":false,"metrics":false,"chart":false,"summary":false} (소비 후) (+15 more)

### Community 39 - "C10_Config_Sch_Util_0202.cpp"
Cohesion: 0.16
Nodes (15): A20_resetSchedulesDefault(), CL_C10_ConfigManager::addScheduleFromJson(), CL_C10_ConfigManager::updateScheduleFromJson(), CL_C10_ConfigManager::patchSchedulesFromJson(), CL_C10_ConfigManager::toJson_Schedules(), CL_C10_ConfigManager::loadSchedules(), CL_C10_ConfigManager::saveSchedules(), C10_fromJson_ScheduleItem() (+7 more)

### Community 40 - "033.util.template.js"
Cohesion: 0.24
Nodes (15): ai(), chart(), dashboard(), diagnostics(), firmware(), info(), logs(), network() (+7 more)

### Community 41 - "WsClient"
Cohesion: 0.22
Nodes (4): closeAll(), get(), initByLevel(), WsClient

### Community 42 - "Module: closeAll"
Cohesion: 0.13
Nodes (14): closeAll(), debug(), get(), getApiKey(), getLogs(), isDebug(), _loadInitial(), _onUploadFile() (+6 more)

### Community 43 - "Module: cstring"
Cohesion: 0.18
Nodes (11): C10_wsChannelFromName(), CL_C10_ConfigManager::loadSystemConfig(), CL_C10_ConfigManager::patchMotionFromJson(), CL_C10_ConfigManager::patchSystemFromJson(), CL_C10_ConfigManager::patchWifiFromJson(), CL_C10_ConfigManager::saveMotionConfig(), CL_C10_ConfigManager::saveSystemConfig(), CL_C10_ConfigManager::saveWifiConfig() (+3 more)

### Community 44 - "ST_A20_WebPageConfig_t"
Cohesion: 0.24
Nodes (11): ST_A20_NvsSpecConfig_t, entries, entryCount, namespaceName, A20_resetNvsSpecDefault(), CL_C10_ConfigManager::loadNvsSpecConfig(), CL_C10_ConfigManager::patchNvsSpecFromJson(), CL_C10_ConfigManager::patchWebPageFromJson() (+3 more)

### Community 45 - "200.page.dashboard.js"
Cohesion: 0.23
Nodes (14): _applyInitialState(), _applyPresetList(), _bindModeSwitch(), _bindStore(), _bindStyleSelector(), mount(), _mountComponents(), _onIntensityChange() (+6 more)

### Community 46 - "C10_loadWindDictFromJsonChecked"
Cohesion: 0.16
Nodes (11): CL_C10_ConfigManager::addWindProfileFromJson(), CL_C10_ConfigManager::updateWindProfileFromJson(), C10_hasDupCode(), CL_C10_ConfigManager::patchWindDictFromJson(), CL_C10_ConfigManager::toJson_WindDict(), CL_C10_ConfigManager::loadWindDict(), CL_C10_ConfigManager::saveWindDict(), C10_fromJson_WindPreset() (+3 more)

### Community 47 - "2. 백엔드 기존 회귀"
Cohesion: 0.15
Nodes (12): 2. 백엔드 기존 회귀, T-10. N-1 (`lastReloadOk`) — 상태 노출, T-11. G-1 (Accept-Encoding) — gzip/raw 분기, T-12. G-2/G-4 (Long Path) — regex gzip, T-13. N-3 (Root Fallback) — 무한 루프 차단, T-3. F-05 (Reload 위임) — 비동기 202 + pendingReload 폴링, T-4. F-05 (중복 방지) — 409 Conflict, T-5. F-06 (Motion Sim 위임) — 비동기 패치 + S10 반영 (+4 more)

### Community 48 - "Module: BUDGET 0202.md"
Cohesion: 0.20
Nodes (9): 11. 개정 이력, 1. 태스크별 자원 할당 매트릭스, 4. 잠재 블로킹 지점 및 완화, 5. FreeRTOS 스택 예산, 7.1 LittleFS 에셋 절감, 7.2 동시 HTTP 소켓, 7. 플래시 및 네트워크 소켓 예산, 9. 메모리 사용 실측 (buildfs/링크 결과) (+1 more)

### Community 49 - "Module: CL M10 MotionLogic"
Cohesion: 0.13
Nodes (7): 3.1 M10 모션 감지 상태 (C-3 반영), 8. 장애 진단 및 트러블슈팅, CL_M10_MotionLogic, _onChange, _pir, s_stateMutex, _state

### Community 50 - "Module: 기본 환경"
Cohesion: 0.13
Nodes (15): 기본 환경, 🏗️ 1. 개발 환경 개요, 📁 2. 프로젝트 소스 및 디렉토리 구조, 📌 2단계 필수 탐색 프로토콜 (Two-Step Navigation Pr, ⚙️ 3. 주요 설정 (`platformio.ini`), 🌐 4. 주요 웹/API 엔드포인트 (v0200), 🛠️ 5. 빌드 및 배포 가이드, 🤖 6. Antigravity와 협업 가이드 (+7 more)

### Community 51 - "Module: FLOW 0202.md"
Cohesion: 0.13
Nodes (14): 11.1 빌드 전처리 (`pio_gzip_0202.py`), 11.2 런타임 정적 서빙 (`W10_Web_Static_0202.cpp`), 11. 웹 에셋 빌드/서빙 파이프라인, 12. 개정 이력, 1. 부팅 시퀀스 (`A00_init()`), 2. 메인 루프 파이프라인 (`A00_run()`), 3. 설정 재로드(Reload) 위임 시퀀스 (F-05), 4. Motion Patch 위임 시퀀스 (F-06) (+6 more)

### Community 52 - "Module: 3. 백엔드 Batch A~F 신규"
Cohesion: 0.13
Nodes (15): 3. 백엔드 Batch A~F 신규, T-15. A-2 — 캡슐화 위임, T-16. B-1 — 버전 SSOT, T-17. C — 매직넘버 상수화 물리 출력 무변동, T-18. D-1 — WS 배치 mutex, T-19. D-2/3/5 — heap 안정성, T-20. E — 링크 무결성, T-21. E-2.1 — TM10 분리 SNTP 재동기화 (+7 more)

### Community 53 - "130.ui.form.js"
Cohesion: 0.20
Nodes (7): append(), _levelClass(), refresh(), render(), setItems(), setSelected(), _trim()

### Community 54 - "270.page.network.js"
Cohesion: 0.29
Nodes (11): _loadSystemTime(), _loadWifiConfig(), _loadWifiState(), mount(), _onAddSta(), _onConnectSsid(), _onDeleteSta(), _onSaveTime() (+3 more)

### Community 55 - "Module: .applyPresetCore"
Cohesion: 0.21
Nodes (6): CL_S10_Simulation::applyResolvedWind(), CL_S10_Simulation::begin(), CL_S10_Simulation::resetDefaults(), CL_S10_Simulation::patchFromJson(), CL_S10_Simulation::toChartJson(), CL_S10_Simulation::toJson()

### Community 56 - "A20_resetScheduleItemDefault"
Cohesion: 0.07
Nodes (25): ST_A20_PageAsset_t, path, uri, , EN_A20_WIFI_MODE_AP, EN_A20_WIFI_MODE_AP_STA, EN_A20_WIFI_MODE_STA, A20_resetAdjustDeltaDefault() (+17 more)

### Community 57 - "Module: 10. Batch A~F 예산 영향 요약"
Cohesion: 0.16
Nodes (5): 3. S10 시뮬레이션 물리 엔진 상태, CT10_markDirtyFromSim(), CL_S10_Simulation::tick(), S10_millis2EpochMs(), CL_S10_Simulation::updatePhase()

### Community 58 - "070.router.js"
Cohesion: 0.30
Nodes (9): capitalize(), _clearMain(), _closeSidebarOnMobile(), dispatch(), init(), parseHash(), renderNavMenu(), _showError() (+1 more)

### Community 59 - "Arduino.h"
Cohesion: 0.13
Nodes (3): ESPClass, HardwareSerial, Print

### Community 60 - "Module: Adafruit NeoPixel"
Cohesion: 0.18
Nodes (6): CL_A30_LED, _lastLedMs, _ledState, _numPixels, _pin, _pixel

### Community 61 - "Module: AsyncWebServerResponse"
Cohesion: 0.16
Nodes (12): 10. 예외/폴백 경로, T-61. [B-5] Accept-Encoding q=0 파서, CL_W10_WebAPI::W10_getMenuJson(), CL_W10_WebAPI::W10_registerGzipServe(), CL_W10_WebAPI::W10_registerStaticRoute(), W10_acceptsGzip(), CL_W10_WebAPI::_applyHeaders(), CL_W10_WebAPI::checkApiKey() (+4 more)

### Community 62 - "AwsEventType"
Cohesion: 0.18
Nodes (10): CL_W10_WebAPI::_broadcast(), AsyncWebServer, AsyncWebSocket, AsyncWebSocketClient, AwsEventType, WS_EVT_CONNECT, WS_EVT_DATA, WS_EVT_DISCONNECT (+2 more)

### Community 63 - "dispatch"
Cohesion: 0.14
Nodes (18): atLeast(), capitalize(), _clearMain(), _closeSidebarOnMobile(), current(), dispatch(), _ensure(), hide() (+10 more)

### Community 64 - "Module: ackEvent"
Cohesion: 0.17
Nodes (16): ackEvent(), _bindConnectionStatus(), _bindLastUpdate(), _bindStore(), _bindStyleSelector(), _mountComponents(), _onIntensityChange(), _onPowerToggle() (+8 more)

### Community 65 - "W10_Web_Upload_0202.cpp"
Cohesion: 0.47
Nodes (3): CL_W10_WebAPI::getUploadPath(), CL_W10_WebAPI::routeUpdate(), extractSafeFileName()

### Community 66 - "A40_Com_Utils_IO_0202.cpp"
Cohesion: 0.25
Nodes (9): _buildPathWithSuffix(), _io_callerOrUnknown(), Load_File2JsonDoc_V21(), _parseJsonFileToDoc(), Save_JsonDoc2File_V21(), CL_W10_WebAPI::W10_loadPagesJson(), File, FS (+1 more)

### Community 67 - "1. 상태 변수 소유권 및 접근 매트릭스"
Cohesion: 0.24
Nodes (4): 1. 상태 변수 소유권 및 접근 매트릭스, T-14. A-1 — FIXED self-heal 폭주 방지, CL_CT10_ControlManager::tickSchedule(), CL_CT10_ControlManager::tickUserProfile()

### Community 68 - "220.page.schedule.js"
Cohesion: 0.38
Nodes (8): _load(), mount(), _onAdd(), _onDelete(), _onEdit(), _onToggle(), _openEditor(), _renderList()

### Community 69 - "230.page.profiles.js"
Cohesion: 0.35
Nodes (9): _load(), mount(), _onAdd(), _onDelete(), _onEdit(), _onStart(), _onStop(), _openEditor() (+1 more)

### Community 70 - "Module: .sendText"
Cohesion: 0.47
Nodes (3): CL_W10_WebAPI::routeGeminiProxy(), W10_callGeminiApi(), W10_getGeminiApiKey()

### Community 71 - "Module: ST W10 MenuState t"
Cohesion: 0.17
Nodes (10): ST_W10_MenuState_t, main_path, pages_sorted, ST_W10_PageEntry_t, enable, isMain, label, order (+2 more)

### Community 73 - "240.page.settings.js"
Cohesion: 0.28
Nodes (10): asBool(), _bindTabs(), _doReload(), _loadSystem(), mount(), nz(), _onFactoryReset(), _onReload() (+2 more)

### Community 74 - "034.util.toast.js"
Cohesion: 0.33
Nodes (8): _ensure(), error(), handle(), info(), show(), success(), warn(), wrap()

### Community 75 - "Module: ST ChartEntry"
Cohesion: 0.18
Nodes (11): ST_ChartEntry, gust_active, intensity, preset_index, pwm_duty, target_wind, thermal_active, timestamp (+3 more)

### Community 76 - "Module: introduce Doc 0202 001.md"
Cohesion: 0.18
Nodes (10): 🌿 1. 단순한 ‘바람’이 아닌, ‘자연’을 전하다, ⚙️ 2. 대기역학을 품은 바람 — Realistic Wind Physics (S10 / S20), 🚀 3. 외부 허브 없는 Standalone 초고속 풀스택 시스템, 🤖 4. 지능형 센서 연동 & 하드웨어 무소음 규격, 📅 5. 주간 정밀 스케줄러 & 맞춤형 바람 프로파일, 🗺️ 6. 10종 자연풍 테마 프리셋 (Nature Wind Presets), 🔋 7. Plug & Play — 간편한 구성과 확장성, 💡 8. 결론 — 바람을 ‘디자인’하는 새로운 시대 (+2 more)

### Community 77 - "A20_resetToDefault"
Cohesion: 0.22
Nodes (5): A20_resetMotionDefault(), A20_resetSystemDefault(), A20_resetToDefault(), A20_resetWebSocketDefault(), CL_C10_ConfigManager::loadMotionConfig()

### Community 78 - "CL_CT10_ControlManager::exportStateJson_v02"
Cohesion: 0.15
Nodes (8): CL_CT10_ControlManager::exportChartJson(), CL_CT10_ControlManager::exportMetricsJson(), CL_CT10_ControlManager::exportStateJson_v02(), CL_CT10_ControlManager::exportSummaryJson(), CL_CT10_ControlManager::applyDecision(), CL_CT10_ControlManager::decideRunSource(), CT10_reasonToString(), CT10_stateToString()

### Community 79 - "escape"
Cohesion: 0.19
Nodes (13): checkFw(), escape(), getWifiConfig(), _loadVersion(), _loadWifiConfig(), _onAddSta(), _onConnectSsid(), _onDeleteSta() (+5 more)

### Community 80 - "Module: ST A20 cfg jsonFile t"
Cohesion: 0.22
Nodes (9): ST_A20_cfg_jsonFile_t, motion, nvsSpec, schedules, system, userProfiles, webPage, wifi (+1 more)

### Community 81 - "3.1 Batch G — P0 크리티컬 회귀 (T-46 ~ T-50)"
Cohesion: 0.20
Nodes (7): 3.1 Batch G — P0 크리티컬 회귀 (T-46 ~ T-50), T-46. [C-1] USB 미연결 부팅 — 3초 타임아웃, T-47. [C-2] 대시보드 프리셋 그리드 — 10개 카드 표시, T-48. [C-3] PIR holdSec 정확도 — 2× 버그 방지, T-49. [C-4] 업로드 핸들 누수 — 강제 종료 후 재시도, T-50. [C-5] 라우터 재진입 — Watcher 누수, Stream

### Community 82 - "300.page.windprofile.js"
Cohesion: 0.40
Nodes (7): _load(), mount(), _onAdd(), _onDelete(), _onEdit(), _openEditor(), _renderList()

### Community 83 - "210.page.chart.js"
Cohesion: 0.42
Nodes (6): _applyInitial(), _exportCsv(), mount(), _onWsChart(), _pushPoint(), _redrawRange()

### Community 85 - "120.ui.chart.js"
Cohesion: 0.46
Nodes (7): clear(), destroy(), draw(), _drawSeries(), push(), resize(), setMaxPoints()

### Community 86 - "260.page.firmware.js"
Cohesion: 0.43
Nodes (4): _loadVersion(), mount(), _onUploadFile(), _onUploadFw()

### Community 87 - "290.page.ai.js"
Cohesion: 0.43
Nodes (4): _appendMessage(), mount(), _onSend(), _replaceLastAssistant()

### Community 89 - "Module: 0200 003.md"
Cohesion: 0.29
Nodes (6): 🔧 [4] `CT10_Ctl_0202.h` — B-N-1a, → Content-Encoding: gzip 헤더가 포함되어야 함, Gzip 헤더 확인, 검증 명령, 번들 파일 존재 확인, 파일 수정 항목

### Community 91 - "245.page.simulation.js"
Cohesion: 0.47
Nodes (3): _load(), mount(), _onSave()

### Community 92 - "250.page.diagnostics.js"
Cohesion: 0.47
Nodes (3): mount(), _refresh(), _showConfig()

### Community 93 - "280.page.logs.js"
Cohesion: 0.47
Nodes (3): _exportJson(), _loadInitial(), mount()

### Community 96 - "Module: 규칙 준수 여부 점검 (Audit)"
Cohesion: 0.50
Nodes (4): 규칙 준수 여부 점검 (Audit), Doc: /maintenance - 규칙 유지보수 워크플로우, 규칙 고도화 (Improvement), 코드 보완 (Refactor)

### Community 97 - "ST_A20_PageItem_t"
Cohesion: 0.22
Nodes (9): ST_A20_PageItem_t, enable, isMain, label, order, pageAssetCount, pageAssets, path (+1 more)

### Community 98 - "020.i18n.js"
Cohesion: 0.47
Nodes (3): applyTo(), hasKey(), t()

### Community 99 - "030.util.level.js"
Cohesion: 0.60
Nodes (3): applyTo(), atLeast(), current()

### Community 102 - "999.app.js"
Cohesion: 0.24
Nodes (6): hide(), _remove(), _renderHeaderIndicator(), show(), start(), update()

### Community 103 - "Module: 0200 001.md"
Cohesion: 0.50
Nodes (3): 또는 직접 메시지 지정, 메시지 지정, 실행 정책 오류 시

### Community 104 - "Module: 0200 002.md"
Cohesion: 0.50
Nodes (3): 3️⃣ 실행 예시 (검증 시나리오), Linux / macOS, 또는

### Community 109 - "§7 회귀 매트릭스 요약 — L6 신규 + 필수 세트 확장"
Cohesion: 0.67
Nodes (3): §7 회귀 매트릭스 요약 — L6 신규 + 필수 세트 확장, BEFORE, 기대: -1 (설정값은 그대로, 부팅 시에만 48로 폴백)

### Community 111 - "CT10_Ctl_IOWS_0202.cpp"
Cohesion: 0.11
Nodes (10): setup(), A00_init(), CL_CT10_ControlManager::maybePushMetricsDirty(), CT10_WS_applyPolicyFromSystem(), CT10_WS_begin(), CT10_WS_buildPriorityOrderFromConfig(), CT10_WS_collectPending(), CT10_WS_measurePayloadBytes() (+2 more)

### Community 113 - ".parseJsonBody"
Cohesion: 0.13
Nodes (6): CL_W10_WebAPI::routeSchedulesID(), CL_W10_WebAPI::routeUserProfiles(), CL_W10_WebAPI::routeUserProfilesID(), CL_W10_WebAPI::routeUserProfilesPatch(), CL_W10_WebAPI::routeWindProfile(), CL_W10_WebAPI::routeWindProfileID()

### Community 115 - "STATE_0202.md — 상태 소유권 및 FSM 명세"
Cohesion: 0.20
Nodes (9): 4. WF10 Wi-Fi 상태머신, 5. TM10 시간 동기화 상태, 6.1 F-05 Pending Reload, 6.2 F-06 Pending Motion.Sim Apply, 6.3 Batch D-1 Dirty 배치 소비, 6. 위임 플래그 라이프사이클 (F-05, F-06), 8. E-2 분할 파일 상태 소유권 (신규), 9. 개정 이력 (+1 more)

### Community 116 - ".parseJsonBody"
Cohesion: 0.27
Nodes (7): 4.3 POST/PATCH 공통 헬퍼 계약 (F-2, F-3), 5.1 API 응답 필드 (Batch N-1, F-2, F-3), CL_W10_WebAPI::routeFirmwareCheck(), CL_W10_WebAPI::routeTimeSet(), _routeWifiConfigPatchBody(), _w10_compareSemVer(), _routeSystemPatchBody()

### Community 120 - "CL_C10_ConfigManager::toJson_All"
Cohesion: 0.14
Nodes (6): CL_C10_ConfigManager::freeAll(), CL_C10_ConfigManager::freeLazySection(), CL_C10_ConfigManager::getDirtyStatus(), CL_C10_ConfigManager::getRootSnapshot(), CL_C10_ConfigManager::toJson_All(), CL_W10_WebAPI::routeSchedules()

### Community 121 - "3.2 Batch G — P1 회귀 (T-51 ~ T-67)"
Cohesion: 0.13
Nodes (15): 3.2 Batch G — P1 회귀 (T-51 ~ T-67), T-51. [NEW-C1] 0값 보존 — pin/brightness/holdSec, T-52. [NEW-C2] XSS — dht.type 이스케이프, T-53. [NEW-U1] API Key DOM 노출 방지, T-54. [NEW-U2] + [B-4] API Key 삭제 — clearApiKey, T-55. [NEW-U3] wsChConfig 손상 복구, T-56. [NEW-U4] 문자열 "false" 방어, T-58. [B-2] + [B-9] async_tcp root 스냅샷 (+7 more)

### Community 122 - "strlcpy"
Cohesion: 0.28
Nodes (7): A20_resetWifiDefault(), _A40__callerOrUnknown(), cloneStr2SharedStr_safe(), copyStr2Buffer_safe(), Json_copyStr(), CL_C10_ConfigManager::loadWifiConfig(), strlcpy()

### Community 123 - "7.1 래치 해제 경로"
Cohesion: 0.18
Nodes (5): 7.1 래치 해제 경로, 7.2 AutoOff offTime 재트리거 방지, 7.3 이벤트 상태 hold/ACK, 7. AutoOff 래치 및 이벤트 상태, CL_CT10_ControlManager::startOverridePreset()

### Community 124 - ".getRootSnapshot"
Cohesion: 0.25
Nodes (4): 7.4 Batch G — 코드 재검토 (C, NEW, B), CL_W10_WebAPI::routeConfigDirtySave(), CL_W10_WebAPI::routeWifiConfig(), _routeMotionPatchBody()

### Community 125 - "W10_Web_WS_0202.cpp"
Cohesion: 0.39
Nodes (4): CL_W10_WebAPI::broadcastChart(), CL_W10_WebAPI::broadcastMetrics(), CL_W10_WebAPI::broadcastState(), CL_W10_WebAPI::broadcastSummary()

### Community 129 - "test_mocks_d10_logger_0202"
Cohesion: 0.22
Nodes (7): , CL_D10_Logger, EN_L10_LOG_DEBUG, EN_L10_LOG_ERROR, EN_L10_LOG_INFO, EN_L10_LOG_NONE, EN_L10_LOG_WARN

### Community 130 - "5. 정적 감사"
Cohesion: 0.33
Nodes (6): 5. 정적 감사, T-36. 계약 문서 gate (CI), T-37. 잔존 참조 grep, T-38. F-10 매크로 승격, T-39. F-4 Logger 초기 INFO, T-40. 프론트엔드 하드코딩 감사

### Community 131 - "8. 프론트엔드 자산 예산 (v0202 SPA)"
Cohesion: 0.25
Nodes (8): 8.1 배포 자산 실측 (2026-10-21 CI), 8.2 JS 번들 상세 (Layer별 gzip 기여도), 8.3 CSS 번들 상세, 8.4 HTTP 요청 예산 (SPA), 8.5 예산 대비 실측 판정, 8.6 확장 여유 분석, 8.7 갱신 주기, 8. 프론트엔드 자산 예산 (v0202 SPA)

### Community 132 - "7. 감사 관측 및 이슈 추적표"
Cohesion: 0.25
Nodes (6): 7.1 기존 (F-01~I-6), 7.2 N/G (N-1~N-4, G-1~G-3), 7.5 B-2 위반 → 수정 후 화이트리스트 최신화, 7.6 Batch H 프론트엔드 오프라인 로딩 계약 (LOAD-1~LOAD-2), 7. 감사 관측 및 이슈 추적표, _wsHandshakeAuth()

### Community 133 - "10. Batch A~F 예산 영향 요약"
Cohesion: 0.50
Nodes (3): 10.1 Batch G 영향 (코드 재검토), 10.2 B-1 상세 — loopTask flush 세부, 10. Batch A~F 예산 영향 요약

### Community 134 - "SPEC_0202.md — Smart Nature Wind v0202 종합 기술 사양서"
Cohesion: 0.25
Nodes (7): 1.1 리팩토링 이력 (Batch A~G), 1. 시스템 개요, 2. 하드웨어 핀맵, 4. 설정 파일 스키마, 6. 코딩 및 품질 컨벤션, 7. 개정 이력, SPEC_0202.md — Smart Nature Wind v0202 종합 기술 사양서

### Community 135 - "4. 프론트엔드 v0202 SPA"
Cohesion: 0.25
Nodes (8): 4. 프론트엔드 v0202 SPA, T-29. 초기 로드 — SPA Shell 3자산, T-30. 해시 라우팅 — 12페이지 마운트, T-31. 레벨 접근 제어 — L1~L4, T-32. 언어 토글 — ko/en, T-33. 대시보드 핵심 동작, T-34. 설정 Save→Reload 순서, T-35. WS 5채널 + 자동 재연결

### Community 136 - "3. 모듈 구성 및 파일 매핑 (v0202 접미사)"
Cohesion: 0.33
Nodes (6): 3.1 코어/상수/유틸, 3.2 설정 관리 (C10), 3.3 중앙 제어 (CT10), 3.4 주변 모듈, 3.5 E-2 파일 분할 원칙, 3. 모듈 구성 및 파일 매핑 (v0202 접미사)

### Community 137 - "6. 부하/안정성"
Cohesion: 0.33
Nodes (6): 6. 부하/안정성, T-41. Heap 안정성 (5분), T-42. 24시간 장기 안정성, T-43. OTA 업데이트, T-44. Factory reset 반복 3회, T-45. 브라우저 크로스 확인

### Community 138 - "ST_A20_NvsEntry_t"
Cohesion: 0.50
Nodes (4): ST_A20_NvsEntry_t, defaultValue, key, type

### Community 139 - "9. Phase 7 릴리스 게이트"
Cohesion: 0.50
Nodes (4): 9.1 게이트 체크리스트, 9.2 릴리스 승인 조건, 9.3 릴리스 태그, 9. Phase 7 릴리스 게이트

### Community 140 - "src_v0202_wf10_wifimgr_0202"
Cohesion: 0.50
Nodes (4): , EN_WF10_REQ_COALESCED, EN_WF10_REQ_FAILED, EN_WF10_REQ_OK

## Knowledge Gaps
- **363 isolated node(s):** `EN_A20_CONTROL_RUN_CONTINUE`, `EN_A20_CONTROL_RUN_SCHEDULE`, `EN_A20_WIND_PHASE_CALM`, `EN_A20_WIND_PHASE_NORMAL`, `EN_A20_WIND_PHASE_STRONG` (+358 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CL_CT10_ControlManager` connect `Control Manager & Operating Modes` to `Wind Physics & Simulation Engine`, `1. 상태 변수 소유권 및 접근 매트릭스`, `src_v0202_d10_logger_0202`, `Module: EN CT10 REASON AUTOOFF TE`, `Main Event Loop & WCET Scheduling`, `CL_N10_NvsManager`, `Web Server & Telemetry Broadcast`, `Control Dispatch & Motion Execution`, `CL_CT10_ControlManager::exportStateJson_v02`, `2. 백엔드 기존 회귀`, `CT10_Ctl_IOWS_0202.cpp`, `.getRootSnapshot`, `CL_CT10_ControlManager::tickLoop`, `Module: 10. Batch A~F 예산 영향 요약`, `7.1 래치 해제 경로`, `Module: T-14. A-1 — FIXED self-he`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `EN_A20_CONTROL_RUN_CONTINUE`, `EN_A20_CONTROL_RUN_SCHEDULE`, `EN_A20_WIND_PHASE_CALM` to the rest of the system?**
  _363 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Wind Physics & Simulation Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly interconnected._
- **Why does `CL_W10_WebAPI` connect `Web Server & Telemetry Broadcast` to `Control Manager & Operating Modes`, `W10_Web_Upload_0202.cpp`, `src_v0202_d10_logger_0202`, `7. 감사 관측 및 이슈 추적표`, `A40_Com_Utils_IO_0202.cpp`, `Module: ST W10 MenuState t`, `CT10_Ctl_IOWS_0202.cpp`, `.parseJsonBody`, `W10_Web_WS_0202.cpp`, `Module: .factoryResetFromDefault`, `Module: AsyncWebServerResponse`, `AwsEventType`, `3. async_tcp WCET (F-05/F-06/D-1 반영 후)`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `Control Manager & Operating Modes` be split into smaller, more focused modules?**
  _Cohesion score 0.03508771929824561 - nodes in this community are weakly interconnected._
- **Why does `CL_S10_Simulation` connect `Wind Physics & Simulation Engine` to `Control Manager & Operating Modes`, `src_v0202_d10_logger_0202`, `10. Batch A~F 예산 영향 요약`, `Control Dispatch & Motion Execution`, `Module: ST ChartEntry`, `Module: .applyPresetCore`, `Module: 10. Batch A~F 예산 영향 요약`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `0202_005.md` be split into smaller, more focused modules?**
  _Cohesion score 0.012578616352201259 - nodes in this community are weakly interconnected._