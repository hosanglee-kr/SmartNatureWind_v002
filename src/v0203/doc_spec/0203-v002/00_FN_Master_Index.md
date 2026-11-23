
# FN-00. Smart Nature Wind v0203 기능 명세서 마스터 인덱스

## 1. 문서 체계 개요
- **프로젝트 / 펌웨어 버전**: Smart Nature Wind (`FW_Ver_2.0.3` / `G_JSON_VERSION = "0203"`)[span_0](start_span)[span_0](end_span)
- **타겟 플랫폼**: ESP32-S3 / ESP32-C3 (PlatformIO Arduino Core, C++17, FreeRTOS, `ArduinoJson` v7.x)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)
- **문서 계층 구조**:
  - **Tier-1 (기능 명세서 11종)**: 시스템 전체 관점의 End-to-End 기능 정의(본편 7종) 및 교차 계층 계약(부록 3종) + 본 마스터 인덱스(1종)
  - **Tier-2 (모듈 상세 기술서 79종)**: `99_Ref_Module_Specs/` 하위에 보존된 개별 `.h`/`.cpp` 소스 파일 단위 참조 기술서[span_3](start_span)[span_3](end_span)

| 문서 번호 | 파일명 | 분류 | 핵심 범위 및 주요 담당 모듈 |
| :--- | :--- | :--- | :--- |
| **FN-00** | `00_FN_Master_Index.md` | 마스터 인덱스 | 전체 기능 계층도, 79개 소스 파일 ↔ 11개 명세서 전수 매핑 매트릭스, 용어집 |
| **FN-01** | `01_FN-01_System_Core.md` | 본편 1 (인프라) | 부팅 10단계 오케스트레이션, 3단계 복구 폴백, TWDT(10s), LED(`A30`), 로거(`D10`), 공통유틸(`A20`/`A22`/`A23`/`A40`)[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span) |
| **FN-02** | `02_FN-02_Network_Time.md` | 본편 2 (인프라) | Wi-Fi `AP`/`STA`/`AP+STA` 모드, 지수 백오프 재연결(`WF10`), 다중 NTP 서버 SNTP 순환 동기화(`TM10`)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span) |
| **FN-03** | `03_FN-03_Config_Persistence.md` | 본편 3 (영속화) | 8종 LittleFS JSON 설정(`C10_*`), `.tmp`/`.bak` 원자적 저장, 지연 해제(UAF 방지), NVS 런타임/AI 사용량(`N10`)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span) |
| **FN-04** | `04_FN-04_Wind_Control_Engine.md` | 본편 4 (핵심 제어) | 7-State 제어 FSM(`StMG`), 통합 세션 & Smart Resume(`Ctl`), 오버라이드(`Ovr`), 8스텝 실행(`Seg`), DI 쾌적도(`Comfort`), 25kHz PWM(`P10`)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span) |
| **FN-05** | `05_FN-05_Sensor_Simulation.md` | 본편 5 (센서/물리) | 10×5 바람 파라미터 솔버(`S20`), von Kármán 난류/돌풍/열기포 물리 엔진(`S10_*`), PIR 유지 로직(`M10`), Warm/Cold 이력(`MON`)[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span) |
| **FN-06** | `06_FN-06_AI_Integration.md` | 본편 6 (AI 연동) | Gemini 프롬프트 캐싱(`AIPrompt`), 비동기 2-Turn 워커(`W10_Gemini`), 14종 제어도구 실행 & 15종 위험명령 차단(`AIAction`), Live 30분 한도(`AILive`)[span_25](start_span)[span_25](end_span)[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span)[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span) |
| **FN-07** | `07_FN-07_Web_API_WS.md` | 본편 7 (통신/웹) | 비동기 HTTP 라우팅(`W10_Web_Routes_*`), Gzip 정적 SPA 서빙(`Static`), 2MB 파일/OTA 업로드(`Upload`), 5대 WebSocket 채널(`WS`/`IOWS`)[span_30](start_span)[span_30](end_span)[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span)[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span) |
| **APP-01** | `08_APP-01_API_WS_Contract.md` | 부록 1 (계약) | 전체 45종 REST API 엔드포인트(`/api/v001/*`) 및 5대 WebSocket(`/ws/*`) 요청/응답 스키마 통합표[span_36](start_span)[span_36](end_span) |
| **APP-02** | `09_APP-02_Config_NVS_Schema.md` | 부록 2 (계약) | `10_cfg_jsonFile.json` 기준 8개 JSON 설정 파일 트리 스키마 및 NVS `"SNW_RUN"` 17개 키 매핑표[span_37](start_span)[span_37](end_span)[span_38](start_span)[span_38](end_span)[span_39](start_span)[span_39](end_span) |
| **APP-03** | `10_APP-03_State_Error_Matrix.md` | 부록 3 (계약) | 전역 FSM 열거형(`EN_*`), 멀티태스크 L1→L3 Mutex 점유 순서, 장애 시나리오별 Fail-safe 복구 매트릭스[span_40](start_span)[span_40](end_span)[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span) |

---

## 2. 계층형 기능 분류 체계 (`FN-01` ~ `FN-07`)

```text
Smart Nature Wind v0203 (79 Backend Source Files)
 ├── FN-01. 시스템 코어 및 공통 유틸리티 (9 files)
 │    ├── FN-01-01: 시스템 부팅 오케스트레이션 및 3단계 복구 폴백 (A00_init)
 │    ├── FN-01-02: 메인 루프 틱 스케줄링 및 TWDT 관리 (A00_run)
 │    ├── FN-01-03: 독립형 RGB 상태 LED 인디케이터 (CL_A30_LED)
 │    └── FN-01-04: 통합 진단 로거 및 공통 안전 유틸리티 (D10 / A20 / A22 / A23 / A40)
 ├── FN-02. 네트워크 및 시간 동기화 (5 files)
 │    ├── FN-02-01: Wi-Fi STA/AP 연결 및 백그라운드 재접속 상태 머신 (WF10)
 │    └── FN-02-02: 다중 NTP 서버 SNTP 동기화 및 타임존 관리 (TM10)
 ├── FN-03. 데이터 영속화 및 설정 관리 (23 files)
 │    ├── FN-03-01: 설정 코어 생명주기 및 지연 해제 (C10_Core)
 │    ├── FN-03-02: 시스템·네트워크·모션·확장 설정 관리 (C10_Sys / Extras)
 │    ├── FN-03-03: 주간 스케줄 CRUD 및 자정 넘김 겹침 검증 (C10_Sch_*)
 │    ├── FN-03-04: 사용자 프로필(8스텝) 및 바람 사전 CRUD (C10_UzProf_* / WindDc_*)
 │    └── FN-03-05: NVS 비휘발성 런타임 및 AI 사용량 관리 (N10)
 ├── FN-04. 바람 제어 엔진 및 상태 머신 (10 files)
 │    ├── FN-04-01: 제어 모드 전환 및 9단계 우선순위 중재 (CT10_Mode / StMG)
 │    ├── FN-04-02: 통합 세션 생명주기 및 Smart Resume (CT10_Ctl)
 │    ├── FN-04-03: 수동 오버라이드 제어 (CT10_Ovr)
 │    ├── FN-04-04: 8스텝 세그먼트 시퀀스 실행 (CT10_Seg)
 │    ├── FN-04-05: 통합 환경 트리거 검사 Stop/Pause 이원화 (CT10_Basic)
 │    ├── FN-04-06: 불쾌지수(DI) 산출 및 Auto-Comfort 5분 자동 제어 (CT10_Comfort)
 │    ├── FN-04-07: 25kHz 하드웨어 PWM 출력 및 3구간 커브 보정 (P10)
 │    └── FN-04-08: 제어-웹 Dirty-Flag 실시간 동기화 (CT10_IOWS)
 ├── FN-05. 센서 모니터링 및 물리 시뮬레이션 (9 files)
 │    ├── FN-05-01: 바람 파라미터 해석 솔버 (S20_WindSolver)
 │    ├── FN-05-02: 대기역학 자연풍 물리 시뮬레이션 (S10_Simul_*)
 │    ├── FN-05-03: PIR 모션 재실 판정 로직 (M10_MotionLogic)
 │    └── FN-05-04: 2계층 Warm/Cold 모니터링 이력 관리자 (CT10_Monitor)
 ├── FN-06. AI 연동 및 프롬프트/액션 제어 (4 files)
 │    ├── FN-06-01: 시스템 프롬프트 조립 및 TTS 폴백 힌트 생성 (CT10_AIPrompt)
 │    ├── FN-06-02: Gemini AI 비동기 2-Turn 프록시 및 Live 음성 관리 (W10_Gemini / AILive)
 │    └── FN-06-03: 14종 AI 제어도구 실행기 및 15종 위험 명령 보안 가드 (CT10_AIAction)
 └── FN-07. 웹 서버, REST API 및 실시간 통신 (19 files)
      ├── FN-07-01: 비동기 웹서버 초기화 및 Gzip 정적 에셋 서빙 (W10_Routes / Static)
      ├── FN-07-02: 제어·세션·시뮬레이션·쾌적도 REST API (Control / Session / Comfort)
      ├── FN-07-03: 설정·CRUD·바람사전·모니터링 REST API (Config / CRUD / WindDict / Monitor)
      ├── FN-07-04: 시스템·네트워크·파일업로드·OTA REST API (System / Network / Upload)
      └── FN-07-05: 5대 WebSocket 실시간 양방향 통신 (W10_WS / CT10_IOWS)

```
## 3. 전체 79개 백엔드 소스 파일 전수 매핑 매트릭스 (*_0203.h/cpp)
| No | 소스 파일명 (*_0203) | 모듈 | 주 소속 문서 | 연관 부록 | 핵심 역할 요약 |
|---|---|---|---|---|---|
| 1 | A00_Main_0203.h | A00 | **FN-01** | APP-03 | 메인 진입점(A00_init/A00_run) 및 전역 인스턴스 extern 선언 |
| 2 | A00_Main_0203.cpp | A00 | **FN-01** | APP-03 | 10단계 부팅 시퀀스, 3단계 복구 폴백, loopTask 메인 루프 및 TWDT 관리 |
| 3 | A20_Const_0203.h | A20 | **FN-01** | APP-02, APP-03 | ST_A20_ConfigRoot_t 및 g_A20_config_root 화이트리스트 접근 규약 정의 |
| 4 | A20_Const_Const_0203.h | A20 | **FN-01** | APP-01, APP-02 | 펌웨어 버전, 파일 경로, 배열 제한, NTP/Gemini/Recovery AP 전역 상수(SSOT) |
| 5 | A20_Const_Motion_0203.h | A20 | **FN-05** | APP-02 | ST_A20_MotionConfig_t (PIR 유지, 시뮬레이션 주기 및 물리 파라미터 구조체) |
| 6 | A20_Const_Sch_0203.h | A20 | **FN-03** | APP-02 | 프리셋(10종)/스타일(5종), Step, TriggerRule, Schedules, UserProfiles 구조체 |
| 7 | A20_Const_Sys_0203.h | A20 | **FN-03** | APP-02 | ST_A20_SystemConfig_t, WebPageConfig, NvsSpecConfig, cfg_jsonFile 구조체 |
| 8 | A20_Const_Wifi_0203.h | A20 | **FN-02** | APP-02 | EN_A20_WIFI_MODE_t 및 ST_A20_WifiConfig_t (AP/STA 자격 증명 구조체) |
| 9 | A20_Const_WS_0203.h | A20 | **FN-07** | APP-01, APP-02 | 4대 WS 채널(state/metrics/chart/summary) 기본 주기·우선순위·스로틀 상수 |
| 10 | A22_Com_Lookup_0203.h | A20 | **FN-01** | APP-02 | StepType, SegmentMode, WindPreset, WindStyle 문자열↔열거형/인덱스 룩업 |
| 11 | A23_Com_ResetCfg_0203.h | A20 | **FN-01** | APP-02 | 전체 8개 설정 섹션 및 하위 구조체 기본값(A20_reset*Default) 초기화 헤더 |
| 12 | A30_LED_0203.h | A30 | **FN-01** | - | WS2812B NeoPixel 비블로킹 상태 LED 제어 (1000ms Green / 500ms Red) |
| 13 | A40_Com_Utils_0203.h | A40 | **FN-01** | APP-03 | clampVal, 안전 문자열 복사, ArduinoJson 헬퍼, RAII Mutex/Critical 가드 선언 |
| 14 | A40_Com_Utils_IO_0203.cpp | A40 | **FN-03** | APP-02, APP-03 | .tmp 원자적 저장, .bak/.bak.old 2중 백업 복구, 24h "HH:MM" 분 변환 |
| 15 | C10_Config_0203.h | C10 | **FN-03** | APP-02, APP-03 | CL_C10_ConfigManager 클래스, 스냅샷, 지연 해제 큐, Dirty 스핀락 선언 |
| 16 | C10_Config_Core_0203.cpp | C10 | **FN-03** | APP-02, APP-03 | 10_cfg_jsonFile.json 로드, loadAll/saveAll/saveDirtyConfigs, factoryResetFromDefault |
| 17 | C10_Config_Extras_0203.cpp | C10 | **FN-03** | APP-02 | NvsSpec 및 WebPage (pages/reDirect/assets) Load/Save/Patch/Export |
| 18 | C10_Config_Sch_CRUD_0203.cpp | C10 | **FN-03** | APP-01, APP-02 | 스케줄 단건 추가(addScheduleFromJson), 수정(update), 삭제(delete) |
| 19 | C10_Config_Sch_Internal_0203.h | C10 | **FN-03** | - | 스케줄 분할 모듈 공유 ID/NO 매크로 및 내부 검증/정렬 헬퍼 선언 |
| 20 | C10_Config_Sch_JSON_0203.cpp | C10 | **FN-03** | APP-02 | toJson_Schedules 직렬화 및 patchSchedulesFromJson 전체 배열 교체 |
| 21 | C10_Config_Sch_LoadSave_0203.cpp | C10 | **FN-03** | APP-02 | loadSchedules 검증 로드 및 saveSchedules (schNo 내림차순 정렬 + 메타 기록) |
| 22 | C10_Config_Sch_Util_0203.cpp | C10 | **FN-03** | APP-02 | 스케줄 ID 채번, 중복 검사, 자정 넘김 분해 요일별 겹침 검증(validateNoOverlapByDay) |
| 23 | C10_Config_Sys_0203.cpp | C10 | **FN-03** | APP-02 | System, Wifi, Motion 섹션 Load/Save/Patch/Export 및 클램핑 검증 |
| 24 | C10_Config_UzProf_CRUD_0203.cpp | C10 | **FN-03** | APP-01, APP-02 | 사용자 프로필 단건 추가(addUserProfilesFromJson), 수정(update), 삭제(delete) |
| 25 | C10_Config_UzProf_Internal_0203.h | C10 | **FN-03** | - | 사용자 프로필 및 TriggerRule (C10_fromJson/toJson_TriggerRule) 내부 공유 헤더 |
| 26 | C10_Config_UzProf_JSON_0203.cpp | C10 | **FN-03** | APP-02 | C10_toJson_TriggerRule, toJson_UserProfiles, patchUserProfilesFromJson 구현 |
| 27 | C10_Config_UzProf_LoadSave_0203.cpp | C10 | **FN-03** | APP-02 | loadUserProfiles 및 saveUserProfiles (ADR-2 steps[] 단일 규격 저장) |
| 28 | C10_Config_UzProf_Util_0203.cpp | C10 | **FN-03** | APP-02 | TriggerRule 파싱(히스테리시스 하한 보정), 프로필/스텝 ID 채번 및 무결성 검증 |
| 29 | C10_Config_WindDc_CRUD_0203.cpp | C10 | **FN-03** | APP-01, APP-02 | 바람 사전 프리셋 추가(addWindProfileFromJson), 수정(update), 삭제(delete) |
| 30 | C10_Config_WindDc_Internal_0203.h | C10 | **FN-03** | - | 바람 사전 텍스트 정제 및 코드 중복 검사 템플릿(C10_hasDupCode) 공유 헤더 |
| 31 | C10_Config_WindDc_JSON_0203.cpp | C10 | **FN-03** | APP-02 | toJson_WindDict 직렬화 및 patchWindDictFromJson 검증 교체 구현 |
| 32 | C10_Config_WindDc_LoadSave_0203.cpp | C10 | **FN-03** | APP-02 | loadWindDict 및 saveWindDict (10종 프리셋·5종 스타일 검증 후 저장) |
| 33 | C10_Config_WindDc_Util_0203.cpp | C10 | **FN-03** | APP-02 | C10_sanitizeAndValidateText ASCII/공백 검증 및 프리셋·스타일 디코더 |
| 34 | CT10_Ctl_0203.h | CT10 | **FN-04** | APP-03 | CL_CT10_ControlManager, 7-State FSM, Session FSM, CT10_AI 네임스페이스 선언 |
| 35 | CT10_Ctl_AIAction_0203.cpp | CT10 | **FN-06** | APP-01, APP-03 | 15종 위험 명령 차단, 14종 AI 제어도구 디스패치 및 Gemini Function 스키마 선언 |
| 36 | CT10_Ctl_AIPrompt_0203.cpp | CT10 | **FN-06** | - | 25단어 이하 시스템 프롬프트 생성, 30s/세션해시 캐싱, 로컬 TTS 힌트 빌더 |
| 37 | CT10_Ctl_Basic_0203.cpp | CT10 | **FN-04** | APP-03 | dht_task 온습도 폴링, 통합 트리거(checkTriggers Stop/Pause), 활성 스케줄 탐색 |
| 38 | CT10_Ctl_Comfort_0203.cpp | CT10 | **FN-04** | APP-01 | 일본 기상청 DI 불쾌지수 산출, 4단계 추천 매칭, 5분 주기 tickAutoComfort 제어 |
| 39 | CT10_Ctl_Ctl_0203.cpp | CT10 | **FN-04** | APP-03 | tickLoop 40ms 제어 루프, reloadAll 원자 스왑, Session 생명주기 & Smart Resume |
| 40 | CT10_Ctl_Ctl_Mode_0203.cpp | CT10 | **FN-04** | - | 스케줄↔프로필 모드 전환(setProfileMode) 및 프로필 번호 실행·중지 |
| 41 | CT10_Ctl_Ctl_Ovr_0203.cpp | CT10 | **FN-04** | - | 수동 고정 PWM(startOverrideFixed) 및 자연풍 프리셋 오버라이드(startOverridePreset) |
| 42 | CT10_Ctl_Ctl_Seg_0203.cpp | CT10 | **FN-04** | - | 8스텝 세그먼트 순환(tickSegmentSequence), PRESET/FIXED/REST 적용 및 self-heal |
| 43 | CT10_Ctl_IOWS_0203.cpp | CT10 | **FN-04** / **FN-07** | APP-01 | Dirty 배치 소비(consumeAllDirty), 4대 WS 우선순위 스케줄러, 상태/차트 JSON Export |
| 44 | CT10_Ctl_StMG_0203.cpp | CT10 | **FN-04** | APP-03 | 9단계 우선순위 중재(decideRunSource) 및 단일 상태 전이 엔진(applyDecision) |
| 45 | CT10_Monitor_0203.h | MON | **FN-05** | APP-01 | PSRAM Warm 버퍼, Cold 바이너리 파일 헤더(MNW1), 64-event 세션 타임라인 선언 |
| 46 | CT10_Monitor_0203.cpp | MON | **FN-05** | APP-01 | 1s/30s 캡처, 5분 버킷 집계, 1시간 Cold 플러시, 이력 조회 및 CSV 내보내기 구현 |
| 47 | D10_Logger_0203.h | D10 | **FN-01** | APP-01, APP-03 | 시리얼 ANSI 컬러 출력, 256-entry 순환 로그 버퍼 및 /ws/log 실시간 브로드캐스트 |
| 48 | M10_MotionLogic_0203.h | M10 | **FN-05** | APP-03 | PIR 센서 유지 시간(holdSec) 단일 판정, 상태 변경 콜백 및 JSON 직렬화 |
| 49 | N10_NvsManager_0203.h | N10 | **FN-03** | APP-02, APP-03 | NVS "SNW_RUN" 17개 키 상수(<=15B), 런타임 상태 및 AI 일일 사용량 구조체 선언 |
| 50 | N10_NvsManager_0203.cpp | N10 | **FN-03** | APP-02, APP-03 | 10초 주기 단일 nvs_commit 배치 플러시 및 AI 일일 오디오/비용 즉시 영속화 구현 |
| 51 | P10_PWM_ctrl_0203.h | P10 | **FN-04** | - | 25kHz LEDC 하드웨어 PWM 구동(ESP32 Core v2/v3 호환) 및 3구간 비선형 팬 커브 보정 |
| 52 | S10_Simul_0203.h | S10 | **FN-05** | - | CL_S10_Simulation 자연풍 물리 엔진, 60초 이력, 120-entry 차트 링버퍼 선언 |
| 53 | S10_Simul_Const_0203.h | S10 | **FN-05** | - | 틱 지터, 위상 지속시간, von Kármán 12밴드 계수, 관성 및 풍속-PWM 변환 상수 |
| 54 | S10_Simul_Core_0203.cpp | S10 | **FN-05** | - | 시뮬레이션 초기화/정지, 메인 물리 tick(), 관성 필터, PWM 변환 및 차트 로깅 |
| 55 | S10_Simul_IO_0203.cpp | S10 | **FN-05** | APP-01 | toJson, toChartJson(static 배열 스냅샷 힙 할당 제거), patchFromJson, O(1) 평균 풍속 |
| 56 | S10_Simul_Physic_0203.cpp | S10 | **FN-05** | - | 위상 전이(CALM/NORMAL/STRONG), 12밴드 난류, 포아송 확률 돌풍/열기포 연산 |
| 57 | S20_WindSolver_0203.h | S20 | **FN-05** | - | 10종 프리셋 × 5종 스타일 배수 × 오버라이드 결합 솔버(S20_resolveWindParams) |
| 58 | TM10_TimeMg_0203.h | TM10 | **FN-02** | APP-03 | CL_TM10_TimeManager 다중 NTP 서버 풀, 타임아웃/백오프 상수 및 시각 조회 선언 |
| 59 | TM10_TimeMg_0203.cpp | TM10 | **FN-02** | APP-03 | esp_sntp 비블로킹 콜백 동기화, 15s 타임아웃 시 4개 서버 순환 전환 및 _isTimeSane 검증 |
| 60 | W10_Web_0203.h | W10 | **FN-07** | APP-01 | CL_W10_WebAPI 전체 라우트·WS 브로드캐스터 선언 및 W10_AI_Limits 한도 상수 정의 |
| 61 | W10_Web_Const_0203.h | W10 | **FN-07** | APP-01 | /api/v001/* 40여 종 REST URI 및 /ws/* 5종 WebSocket 엔드포인트 경로 상수 |
| 62 | W10_Web_Gemini_0203.cpp | W10 | **FN-06** | APP-01 | gemini_worker 비동기 태스크, 2-Turn Function Calling 루프, 5s 레이트 리밋 및 Job 폴링 |
| 63 | W10_Web_Routes_0203.cpp | W10 | **FN-07** | APP-01 | CL_W10_WebAPI::begin() 전체 라우트 일괄 등록 및 applySystemRuntimeFromConfig() |
| 64 | W10_Web_Routes_AILive_0203.cpp | W10 | **FN-06** | APP-01, APP-03 | Gemini Live 토큰 발급, 30분(1800s) 일일 한도 게이트(403), Live Tool 브리지 및 비용 API |
| 65 | W10_Web_Routes_Comfort_0203.cpp | W10 | **FN-07** | APP-01 | GET /api/v001/comfort DI 쾌적도 조회 및 GET/POST /comfort/auto 자동 모드 토글 |
| 66 | W10_Web_Routes_Config_0203.cpp | W10 | **FN-07** | APP-01 | /api/v001/config, /config/save, /config/dirty, /config/init, /reload 라우트 |
| 67 | W10_Web_Routes_Control_0203.cpp | W10 | **FN-07** | APP-01 | /api/v001/control/*(모드/오버라이드/타이머/ACK/리부트), /simulation, /sim/*, /pir/feed |
| 68 | W10_Web_Routes_CRUD_0203.cpp | W10 | **FN-07** | APP-01 | windProfile, schedules, user_profiles REST CRUD 및 URL tail /{id} 파싱 |
| 69 | W10_Web_Routes_Monitor_0203.cpp | W10 | **FN-07** | APP-01 | /api/v001/monitor, /events, /export(CSV), /timeline, /session-summary 라우트 |
| 70 | W10_Web_Routes_Network_0203.cpp | W10 | **FN-07** | APP-01 | /api/v001/wifi/config 패치 + 비동기 재연결, /system/time/set, /system/firmware/check |
| 71 | W10_Web_Routes_Session_0203.cpp | W10 | **FN-07** | APP-01 | `/api/v001/session/start |
| 72 | W10_Web_Routes_System_0203.cpp | W10 | **FN-07** | APP-01 | /version, /state, /system, /motion, /diag, /metrics, /logs, /auth/test, `/wifi/scan |
| 73 | W10_Web_Routes_WindDict_0203.cpp | W10 | **FN-07** | APP-01 | GET /api/v001/windDict 10종 프리셋·5종 스타일 사전 조회 (스냅샷 우선 + 파일 폴백) |
| 74 | W10_Web_Static_0203.cpp | W10 | **FN-07** | APP-01 | RFC 7231 Accept-Encoding Gzip 협상 서빙, cfg_pages 동적 라우팅 및 /api/v001/menu |
| 75 | W10_Web_Upload_0203.cpp | W10 | **FN-07** | APP-01, APP-03 | fileUpload & fwUpdate OTA (2MB 제한, 경로 탐색 차단, 단일 세션 점유 잠금) |
| 76 | W10_Web_Util_0203.cpp | W10 | **FN-07** | APP-01, APP-03 | CORS/보안 헤더, requireApiKey 401 응답, 단편화 HTTP Body 단일 블록 누적기 |
| 77 | W10_Web_WS_0203.cpp | W10 | **FN-07** | APP-01, APP-03 | 5대 WebSocket 핸드셰이크 인증(?apiKey), 연결 시 초기 상태 푸시 및 주기적 클라이언트 정리 |
| 78 | WF10_WiFiMgr_0203.h | WF10 | **FN-02** | APP-03 | CL_WF10_WiFiManager, lock-free s_staConnected, 지수 백오프 상수 및 재연결 태스크 선언 |
| 79 | WF10_WiFiMgr_0203.cpp | WF10 | **FN-02** | APP-01, APP-03 | SoftAP/STA/WiFiMulti 초기화, 이벤트 기반 재연결, WF10_Reconnect 태스크 및 AP 스캔 |
## 4. 핵심 용어 및 약어집 (Glossary)
 * **SSOT (Single Source of Truth)**: 상수(A20_Const_Const_0203.h), 스키마(APP-02), API 계약(APP-01) 등을 단일 파일에만 정의하여 다중 파일 간 불일치를 원천 차단하는 설계 원칙.
 * **Dirty Flag (지연 저장 플래그)**: 메모리 상의 설정이나 상태 변경 시 즉시 플래시/네트워크 I/O를 발생시키지 않고 원자적 불리언 플래그만 마킹한 뒤 주기적 또는 명시적 요청 시 일괄 처리하는 기법.
 * **DI (Discomfort Index, 불쾌지수)**: 온도와 상대습도로 체감 쾌적도를 산출하는 일본 기상청 표준 지수(0.81T + 0.01H(0.99T - 14.3) + 46.3).
 * **Smart Resume**: 세션 일시정지(PAUSED) 후 재개 시 정지 경과 시간(5분 이하 연속 재개 / 5~30분 현재 스텝 처음부터 / 30분 초과 Step 1 리셋)에 따라 복귀 위치를 자동 결정하는 정책.
 * **Deferred Free (지연 메모리 해제)**: 무중단 설정 재로드(reloadAll) 시 웹 비동기 태스크(async_tcp)의 읽기 완료를 보장하기 위해 구버전 설정 포인터를 3초 유예 후 해제하는 UAF 방지 메커니즘.
 * **Warm / Cold Buffer**: 최근 1시간 고해상도(1초/30초) 데이터를 PSRAM 링버퍼(Warm)에 보관하고, 1시간마다 5분 평균으로 압축하여 LittleFS 바이너리 파일(Cold)에 7일~30일간 장기 보관하는 2계층 이력 아키텍처.


