
# FN-00. Smart Nature Wind v0203 기능 명세서 마스터 인덱스

## 1. 문서 체계 개요
- **프로젝트 / 펌웨어 버전**: Smart Nature Wind (`FW_Ver_2.0.3` / `G_JSON_VERSION = "0203"`)[span_0](start_span)[span_0](end_span)
- **타겟 플랫폼**: ESP32-S3 / ESP32-C3 (PlatformIO Arduino Core, C++17, FreeRTOS, `ArduinoJson` v7.x)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)
- **문서 계층 구조**:
  - **Tier-1 (기능 명세서 11종)**: 시스템 전체 관점의 End-to-End 기능 정의(본편 7종) 및 교차 계층 계약(부록 3종) + 본 마스터 인덱스(1종)
  - **Tier-2 (모듈 상세 기술서 79종)**: `99_Ref_Module_Specs/` 하위에 보존된 개별 `.h`/`.cpp` 소스 파일 단위 참조 기술서[span_3](start_span)[span_3](end_span)

| 문서 번호 | 파일명 | 분류 | 상태 | 핵심 범위 및 주요 담당 모듈 |
| :--- | :--- | :--- | :--- | :--- |
| **FN-00** | `00_FN_Master_Index.md` | 마스터 인덱스 | ✅ 완결 | 전체 기능 계층도, 79개 소스 파일 ↔ 11개 명세서 전수 매핑 매트릭스, 용어집 |
| **FN-01** | [`01_FN-01_System_Core.md`](./01_FN-01_System_Core.md) | 본편 1 (인프라) | ✅ 완결 | 부팅 10단계 오케스트레이션, 3단계 복구 폴백, TWDT(10s), LED(`A30`), 로거(`D10`), 공통유틸(`A20`/`A22`/`A23`/`A40`) |
| **FN-02** | [`02_FN-02_Network_Time.md`](./02_FN-02_Network_Time.md) | 본편 2 (인프라) | ✅ 완결 | Wi-Fi `AP`/`STA`/`AP+STA` 모드, 지수 백오프 재연결(`WF10`), 다중 NTP 서버 SNTP 순환 동기화(`TM10`) |
| **FN-03** | [`03_FN-03_Config_Persistence.md`](./03_FN-03_Config_Persistence.md) | 본편 3 (영속화) | ✅ 완결 | 8종 LittleFS JSON 설정(`C10_*`), `.tmp`/`.bak` 원자적 저장, 지연 해제(UAF 방지), NVS 런타임/AI 사용량(`N10`) |
| **FN-04** | [`04_FN-04_Wind_Control_Engine.md`](./04_FN-04_Wind_Control_Engine.md) | 본편 4 (핵심 제어) | ✅ 완결 | 7-State 제어 FSM(`StMG`), 통합 세션 & Smart Resume(`Ctl`), 오버라이드(`Ovr`), 8스텝 실행(`Seg`), DI 쾌적도(`Comfort`), 25kHz PWM(`P10`) |
| **FN-05** | [`05_FN-05_Sensor_Simulation.md`](./05_FN-05_Sensor_Simulation.md) | 본편 5 (센서/물리) | ✅ 완결 | 10×5 바람 파라미터 솔버(`S20`), von Kármán 난류/돌풍/열기포 물리 엔진(`S10_*`), PIR 유지 로직(`M10`), Warm/Cold 이력(`MON`) |
| **FN-06** | [`06_FN-06_AI_Integration.md`](./06_FN-06_AI_Integration.md) | 본편 6 (AI 연동) | ✅ 완결 | Gemini 프롬프트 캐싱(`AIPrompt`), 비동기 2-Turn 워커(`W10_Gemini`), 14종 제어도구 실행 & 15종 위험명령 차단(`AIAction`), Live 30분 한도(`AILive`) |
| **FN-07** | [`07_FN-07_Web_API_WS.md`](./07_FN-07_Web_API_WS.md) | 본편 7 (통신/웹) | ✅ 완결 | 비동기 HTTP 라우팅(`W10_Web_Routes_*`), Gzip 정적 SPA 서빙(`Static`), 2MB 파일/OTA 업로드(`Upload`), 5대 WebSocket 채널(`WS`/`IOWS`) |
| **APP-01** | [`08_APP-01_API_WS_Contract.md`](./08_APP-01_API_WS_Contract.md) | 부록 1 (계약) | ✅ 완결 | 전체 45종 REST API 엔드포인트(`/api/v001/*`) 및 5대 WebSocket(`/ws/*`) 요청/응답 스키마 통합표 |
| **APP-02** | [`09_APP-02_Config_NVS_Schema.md`](./09_APP-02_Config_NVS_Schema.md) | 부록 2 (계약) | ✅ 완결 | `10_cfg_jsonFile.json` 기준 8개 JSON 설정 파일 트리 스키마 및 NVS `"SNW_RUN"` 17개 키 매핑표 |
| **APP-03** | [`10_APP-03_State_Error_Matrix.md`](./10_APP-03_State_Error_Matrix.md) | 부록 3 (계약) | ✅ 완결 | 전역 FSM 열거형(`EN_*`), 멀티태스크 L1→L3 Mutex 점유 순서, 장애 시나리오별 Fail-safe 복구 매트릭스 |

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

### 2.1 서브기능 ↔ 문서 ↔ 테스트 케이스(TC) 추적 매트릭스

| 서브기능 ID | 명칭 | 주 소속 문서 | 관련 소스 파일 (`*_0203`) | 검증 TC |
| :--- | :--- | :--- | :--- | :--- |
| `FN-01-01` | 시스템 부팅 오케스트레이션 및 3단계 복구 폴백 | [FN-01](./01_FN-01_System_Core.md) §4.1 | `A00_Main_0203.h`, `A00_Main_0203.cpp` | `TC-01-01` |
| `FN-01-02` | 메인 루프 틱 스케줄링 및 TWDT 관리 | [FN-01](./01_FN-01_System_Core.md) §4.2 | `A00_Main_0203.cpp` | `(TC-01-01 포함)` |
| `FN-01-03` | 독립형 RGB 상태 LED 인디케이터 | [FN-01](./01_FN-01_System_Core.md) §4.2 | `A30_LED_0203.h` | `TC-01-02`, `TC-01-03` |
| `FN-01-04` | 통합 진단 로거 및 공통 안전 유틸리티 | [FN-01](./01_FN-01_System_Core.md) §3.2 | `A20_Const_0203.h`, `A20_Const_Const_0203.h`, `A22_Com_Lookup_0203.h`, `A23_Com_ResetCfg_0203.h`, `A40_Com_Utils_0203.h`, `D10_Logger_0203.h` | `TC-01-04` |
| `FN-02-01` | Wi-Fi STA/AP 연결 및 백그라운드 재접속 | [FN-02](./02_FN-02_Network_Time.md) §4.1 | `A20_Const_Wifi_0203.h`, `WF10_WiFiMgr_0203.h`, `WF10_WiFiMgr_0203.cpp` | `TC-02-01`, `TC-02-03`, `TC-02-04` |
| `FN-02-02` | 다중 NTP 서버 SNTP 동기화 및 타임존 관리 | [FN-02](./02_FN-02_Network_Time.md) §4.1 | `TM10_TimeMg_0203.h`, `TM10_TimeMg_0203.cpp` | `TC-02-02` |
| `FN-03-01` | 설정 코어 생명주기 및 지연 해제 | [FN-03](./03_FN-03_Config_Persistence.md) §4.1 | `A40_Com_Utils_IO_0203.cpp`, `C10_Config_0203.h`, `C10_Config_Core_0203.cpp` | `TC-03-01`, `TC-03-04` |
| `FN-03-02` | 시스템·네트워크·모션·확장 설정 관리 | [FN-03](./03_FN-03_Config_Persistence.md) §4 | `A20_Const_Sys_0203.h`, `C10_Config_Extras_0203.cpp`, `C10_Config_Sys_0203.cpp` | `TC-03-03` |
| `FN-03-03` | 주간 스케줄 CRUD 및 자정 넘김 겹침 검증 | [FN-03](./03_FN-03_Config_Persistence.md) §2.3 | `A20_Const_Sch_0203.h`, `C10_Config_Sch_CRUD_0203.cpp`, `C10_Config_Sch_Internal_0203.h`, `C10_Config_Sch_JSON_0203.cpp`, `C10_Config_Sch_LoadSave_0203.cpp`, `C10_Config_Sch_Util_0203.cpp` | `TC-03-02` |
| `FN-03-04` | 사용자 프로필 및 바람 사전 CRUD | [FN-03](./03_FN-03_Config_Persistence.md) §2.2 | `A20_Const_Sch_0203.h`, `C10_Config_UzProf_CRUD_0203.cpp`, `C10_Config_UzProf_Internal_0203.h`, `C10_Config_UzProf_JSON_0203.cpp`, `C10_Config_UzProf_LoadSave_0203.cpp`, `C10_Config_UzProf_Util_0203.cpp`, `C10_Config_WindDc_CRUD_0203.cpp`, `C10_Config_WindDc_Internal_0203.h`, `C10_Config_WindDc_JSON_0203.cpp`, `C10_Config_WindDc_LoadSave_0203.cpp`, `C10_Config_WindDc_Util_0203.cpp` | `(`[`APP-01`](./08_APP-01_API_WS_Contract.md)` §3.5 예시 검증)` |
| `FN-03-05` | NVS 비휘발성 런타임 및 AI 사용량 관리 | [FN-03](./03_FN-03_Config_Persistence.md) §2.3 | `N10_NvsManager_0203.h`, `N10_NvsManager_0203.cpp` | `TC-03-05` |
| `FN-04-01` | 제어 모드 전환 및 9단계 우선순위 중재 | [FN-04](./04_FN-04_Wind_Control_Engine.md) §4.1 | `CT10_Ctl_0203.h`, `CT10_Ctl_Ctl_Mode_0203.cpp`, `CT10_Ctl_StMG_0203.cpp` | `TC-04-01` |
| `FN-04-02` | 통합 세션 생명주기 및 Smart Resume | [FN-04](./04_FN-04_Wind_Control_Engine.md) §2.2 | `CT10_Ctl_0203.h`, `CT10_Ctl_Ctl_0203.cpp` | `TC-04-03`, `TC-04-04` |
| `FN-04-03` | 수동 오버라이드 제어 | [FN-04](./04_FN-04_Wind_Control_Engine.md) §2.2 | `CT10_Ctl_Ctl_Ovr_0203.cpp` | `TC-04-01 (연계)` |
| `FN-04-04` | 8스텝 세그먼트 시퀀스 실행 | [FN-04](./04_FN-04_Wind_Control_Engine.md) §3.1 | `CT10_Ctl_Ctl_Seg_0203.cpp` | `TC-04-03` |
| `FN-04-05` | 통합 환경 트리거 검사 Stop/Pause 이원화 | [FN-04](./04_FN-04_Wind_Control_Engine.md) §4.1 | `CT10_Ctl_Basic_0203.cpp` | `TC-04-02` |
| `FN-04-06` | 불쾌지수(DI) 산출 및 Auto-Comfort | [FN-04](./04_FN-04_Wind_Control_Engine.md) §2.3 | `CT10_Ctl_Comfort_0203.cpp` | `TC-04-05` |
| `FN-04-07` | 25kHz 하드웨어 PWM 출력 및 3구간 커브 | [FN-04](./04_FN-04_Wind_Control_Engine.md) §2.3 | `P10_PWM_ctrl_0203.h` | `TC-04-06` |
| `FN-04-08` | 제어-웹 Dirty-Flag 실시간 동기화 | [FN-04](./04_FN-04_Wind_Control_Engine.md) §2.2 | `CT10_Ctl_IOWS_0203.cpp` | `TC-07-04` |
| `FN-05-01` | 바람 파라미터 해석 솔버 | [FN-05](./05_FN-05_Sensor_Simulation.md) §2.3 | `S20_WindSolver_0203.h` | `TC-05-01` |
| `FN-05-02` | 대기역학 자연풍 물리 시뮬레이션 | [FN-05](./05_FN-05_Sensor_Simulation.md) §4.1 | `S10_Simul_0203.h`, `S10_Simul_Const_0203.h`, `S10_Simul_Core_0203.cpp`, `S10_Simul_IO_0203.cpp`, `S10_Simul_Physic_0203.cpp` | `TC-05-02` |
| `FN-05-03` | PIR 모션 재실 판정 로직 | [FN-05](./05_FN-05_Sensor_Simulation.md) §4.2 | `A20_Const_Motion_0203.h`, `M10_MotionLogic_0203.h` | `TC-05-03` |
| `FN-05-04` | 2계층 Warm/Cold 모니터링 이력 관리자 | [FN-05](./05_FN-05_Sensor_Simulation.md) §3.1 | `CT10_Monitor_0203.h`, `CT10_Monitor_0203.cpp` | `TC-05-04` |
| `FN-06-01` | 시스템 프롬프트 조립 및 TTS 폴백 힌트 | [FN-06](./06_FN-06_AI_Integration.md) §2.3 | `CT10_Ctl_AIPrompt_0203.cpp` | `TC-06-04` |
| `FN-06-02` | Gemini AI 비동기 2-Turn 프록시 및 Live 관리 | [FN-06](./06_FN-06_AI_Integration.md) §2.3 | `W10_Web_Gemini_0203.cpp`, `W10_Web_Routes_AILive_0203.cpp` | `TC-06-01`, `TC-06-03`, `TC-06-05` |
| `FN-06-03` | 14종 AI 제어도구 실행기 및 15종 위험 명령 보안 | [FN-06](./06_FN-06_AI_Integration.md) §3.2 | `CT10_Ctl_AIAction_0203.cpp` | `TC-06-02` |
| `FN-07-01` | 비동기 웹서버 초기화 및 Gzip 정적 서빙 | [FN-07](./07_FN-07_Web_API_WS.md) §4.1 | `W10_Web_0203.h`, `W10_Web_Const_0203.h`, `W10_Web_Routes_0203.cpp`, `W10_Web_Static_0203.cpp`, `W10_Web_Util_0203.cpp` | `TC-07-01` |
| `FN-07-02` | 제어·세션·시뮬레이션·쾌적도 REST API | [FN-07](./07_FN-07_Web_API_WS.md) §2.2 | `W10_Web_Routes_Comfort_0203.cpp`, `W10_Web_Routes_Control_0203.cpp`, `W10_Web_Routes_Session_0203.cpp` | `TC-07-05` |
| `FN-07-03` | 설정·CRUD·바람사전·모니터링 REST API | [FN-07](./07_FN-07_Web_API_WS.md) §2.2 | `W10_Web_Routes_Config_0203.cpp`, `W10_Web_Routes_CRUD_0203.cpp`, `W10_Web_Routes_Monitor_0203.cpp`, `W10_Web_Routes_WindDict_0203.cpp` | `TC-07-02`, `TC-07-05` |
| `FN-07-04` | 시스템·네트워크·파일업로드·OTA REST API | [FN-07](./07_FN-07_Web_API_WS.md) §2.2 | `W10_Web_Routes_Network_0203.cpp`, `W10_Web_Routes_System_0203.cpp`, `W10_Web_Upload_0203.cpp` | `TC-07-03` |
| `FN-07-05` | 5대 WebSocket 실시간 양방향 통신 | [FN-07](./07_FN-07_Web_API_WS.md) §2.3 | `A20_Const_WS_0203.h`, `CT10_Ctl_IOWS_0203.cpp`, `W10_Web_WS_0203.cpp` | `TC-07-04` |

## 3. 전체 79개 백엔드 소스 파일 전수 매핑 매트릭스 (*_0203.h/cpp)
| No | 소스 파일명 (*_0203) | 모듈 | 주 소속 문서 | 서브기능 ID | 연관 부록 | 핵심 역할 요약 |
|---|---|---|---|---|---|---|
| 1 | A00_Main_0203.h | A00 | **FN-01** | FN-01-01 | APP-03 | 메인 진입점(A00_init/A00_run) 및 전역 인스턴스 extern 선언 |
| 2 | A00_Main_0203.cpp | A00 | **FN-01** | FN-01-01 / FN-01-02 | APP-03 | 10단계 부팅 시퀀스, 3단계 복구 폴백, loopTask 메인 루프 및 TWDT 관리 |
| 3 | A20_Const_0203.h | A20 | **FN-01** | FN-01-04 | APP-02, APP-03 | ST_A20_ConfigRoot_t 및 g_A20_config_root 화이트리스트 접근 규약 정의 |
| 4 | A20_Const_Const_0203.h | A20 | **FN-01** | FN-01-04 | APP-01, APP-02 | 펌웨어 버전, 파일 경로, 배열 제한, NTP/Gemini/Recovery AP 전역 상수(SSOT) |
| 5 | A20_Const_Motion_0203.h | A20 | **FN-05** | FN-05-03 | APP-02 | ST_A20_MotionConfig_t (PIR 유지, 시뮬레이션 주기 및 물리 파라미터 구조체) |
| 6 | A20_Const_Sch_0203.h | A20 | **FN-03** | FN-03-03 / FN-03-04 | APP-02 | 프리셋(10종)/스타일(5종), Step, TriggerRule, Schedules, UserProfiles 구조체 |
| 7 | A20_Const_Sys_0203.h | A20 | **FN-03** | FN-03-02 | APP-02 | ST_A20_SystemConfig_t, WebPageConfig, NvsSpecConfig, cfg_jsonFile 구조체 |
| 8 | A20_Const_Wifi_0203.h | A20 | **FN-02** | FN-02-01 | APP-02 | EN_A20_WIFI_MODE_t 및 ST_A20_WifiConfig_t (AP/STA 자격 증명 구조체) |
| 9 | A20_Const_WS_0203.h | A20 | **FN-07** | FN-07-05 | APP-01, APP-02 | 4대 WS 채널(state/metrics/chart/summary) 기본 주기·우선순위·스로틀 상수 |
| 10 | A22_Com_Lookup_0203.h | A20 | **FN-01** | FN-01-04 | APP-02 | StepType, SegmentMode, WindPreset, WindStyle 문자열↔열거형/인덱스 룩업 |
| 11 | A23_Com_ResetCfg_0203.h | A20 | **FN-01** | FN-01-04 | APP-02 | 전체 8개 설정 섹션 및 하위 구조체 기본값(A20_reset*Default) 초기화 헤더 |
| 12 | A30_LED_0203.h | A30 | **FN-01** | FN-01-03 | - | WS2812B NeoPixel 비블로킹 상태 LED 제어 (1000ms Green / 500ms Red) |
| 13 | A40_Com_Utils_0203.h | A40 | **FN-01** | FN-01-04 | APP-03 | clampVal, 안전 문자열 복사, ArduinoJson 헬퍼, RAII Mutex/Critical 가드 선언 |
| 14 | A40_Com_Utils_IO_0203.cpp | A40 | **FN-03** | FN-03-01 | APP-02, APP-03 | .tmp 원자적 저장, .bak/.bak.old 2중 백업 복구, 24h "HH:MM" 분 변환 |
| 15 | C10_Config_0203.h | C10 | **FN-03** | FN-03-01 | APP-02, APP-03 | CL_C10_ConfigManager 클래스, 스냅샷, 지연 해제 큐, Dirty 스핀락 선언 |
| 16 | C10_Config_Core_0203.cpp | C10 | **FN-03** | FN-03-01 | APP-02, APP-03 | 10_cfg_jsonFile.json 로드, loadAll/saveAll/saveDirtyConfigs, factoryResetFromDefault |
| 17 | C10_Config_Extras_0203.cpp | C10 | **FN-03** | FN-03-02 | APP-02 | NvsSpec 및 WebPage (pages/reDirect/assets) Load/Save/Patch/Export |
| 18 | C10_Config_Sch_CRUD_0203.cpp | C10 | **FN-03** | FN-03-03 | APP-01, APP-02 | 스케줄 단건 추가(addScheduleFromJson), 수정(update), 삭제(delete) |
| 19 | C10_Config_Sch_Internal_0203.h | C10 | **FN-03** | FN-03-03 | - | 스케줄 분할 모듈 공유 ID/NO 매크로 및 내부 검증/정렬 헬퍼 선언 |
| 20 | C10_Config_Sch_JSON_0203.cpp | C10 | **FN-03** | FN-03-03 | APP-02 | toJson_Schedules 직렬화 및 patchSchedulesFromJson 전체 배열 교체 |
| 21 | C10_Config_Sch_LoadSave_0203.cpp | C10 | **FN-03** | FN-03-03 | APP-02 | loadSchedules 검증 로드 및 saveSchedules (schNo 내림차순 정렬 + 메타 기록) |
| 22 | C10_Config_Sch_Util_0203.cpp | C10 | **FN-03** | FN-03-03 | APP-02 | 스케줄 ID 채번, 중복 검사, 자정 넘김 분해 요일별 겹침 검증(validateNoOverlapByDay) |
| 23 | C10_Config_Sys_0203.cpp | C10 | **FN-03** | FN-03-02 | APP-02 | System, Wifi, Motion 섹션 Load/Save/Patch/Export 및 클램핑 검증 |
| 24 | C10_Config_UzProf_CRUD_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-01, APP-02 | 사용자 프로필 단건 추가(addUserProfilesFromJson), 수정(update), 삭제(delete) |
| 25 | C10_Config_UzProf_Internal_0203.h | C10 | **FN-03** | FN-03-04 | - | 사용자 프로필 및 TriggerRule (C10_fromJson/toJson_TriggerRule) 내부 공유 헤더 |
| 26 | C10_Config_UzProf_JSON_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-02 | C10_toJson_TriggerRule, toJson_UserProfiles, patchUserProfilesFromJson 구현 |
| 27 | C10_Config_UzProf_LoadSave_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-02 | loadUserProfiles 및 saveUserProfiles (ADR-2 steps[] 단일 규격 저장) |
| 28 | C10_Config_UzProf_Util_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-02 | TriggerRule 파싱(히스테리시스 하한 보정), 프로필/스텝 ID 채번 및 무결성 검증 |
| 29 | C10_Config_WindDc_CRUD_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-01, APP-02 | 바람 사전 프리셋 추가(addWindProfileFromJson), 수정(update), 삭제(delete) |
| 30 | C10_Config_WindDc_Internal_0203.h | C10 | **FN-03** | FN-03-04 | - | 바람 사전 텍스트 정제 및 코드 중복 검사 템플릿(C10_hasDupCode) 공유 헤더 |
| 31 | C10_Config_WindDc_JSON_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-02 | toJson_WindDict 직렬화 및 patchWindDictFromJson 검증 교체 구현 |
| 32 | C10_Config_WindDc_LoadSave_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-02 | loadWindDict 및 saveWindDict (10종 프리셋·5종 스타일 검증 후 저장) |
| 33 | C10_Config_WindDc_Util_0203.cpp | C10 | **FN-03** | FN-03-04 | APP-02 | C10_sanitizeAndValidateText ASCII/공백 검증 및 프리셋·스타일 디코더 |
| 34 | CT10_Ctl_0203.h | CT10 | **FN-04** | FN-04-01 / FN-04-02 | APP-03 | CL_CT10_ControlManager, 7-State FSM, Session FSM, CT10_AI 네임스페이스 선언 |
| 35 | CT10_Ctl_AIAction_0203.cpp | CT10 | **FN-06** | FN-06-03 | APP-01, APP-03 | 15종 위험 명령 차단, 14종 AI 제어도구 디스패치 및 Gemini Function 스키마 선언 |
| 36 | CT10_Ctl_AIPrompt_0203.cpp | CT10 | **FN-06** | FN-06-01 | - | 25단어 이하 시스템 프롬프트 생성, 30s/세션해시 캐싱, 로컬 TTS 힌트 빌더 |
| 37 | CT10_Ctl_Basic_0203.cpp | CT10 | **FN-04** | FN-04-05 | APP-03 | dht_task 온습도 폴링, 통합 트리거(checkTriggers Stop/Pause), 활성 스케줄 탐색 |
| 38 | CT10_Ctl_Comfort_0203.cpp | CT10 | **FN-04** | FN-04-06 | APP-01 | 일본 기상청 DI 불쾌지수 산출, 4단계 추천 매칭, 5분 주기 tickAutoComfort 제어 |
| 39 | CT10_Ctl_Ctl_0203.cpp | CT10 | **FN-04** | FN-04-02 | APP-03 | tickLoop 40ms 제어 루프, reloadAll 원자 스왑, Session 생명주기 & Smart Resume |
| 40 | CT10_Ctl_Ctl_Mode_0203.cpp | CT10 | **FN-04** | FN-04-01 | - | 스케줄↔프로필 모드 전환(setProfileMode) 및 프로필 번호 실행·중지 |
| 41 | CT10_Ctl_Ctl_Ovr_0203.cpp | CT10 | **FN-04** | FN-04-03 | - | 수동 고정 PWM(startOverrideFixed) 및 자연풍 프리셋 오버라이드(startOverridePreset) |
| 42 | CT10_Ctl_Ctl_Seg_0203.cpp | CT10 | **FN-04** | FN-04-04 | - | 8스텝 세그먼트 순환(tickSegmentSequence), PRESET/FIXED/REST 적용 및 self-heal |
| 43 | CT10_Ctl_IOWS_0203.cpp | CT10 | **FN-04** / **FN-07** | FN-04-08 / FN-07-05 | APP-01 | Dirty 배치 소비(consumeAllDirty), 4대 WS 우선순위 스케줄러, 상태/차트 JSON Export |
| 44 | CT10_Ctl_StMG_0203.cpp | CT10 | **FN-04** | FN-04-01 | APP-03 | 9단계 우선순위 중재(decideRunSource) 및 단일 상태 전이 엔진(applyDecision) |
| 45 | CT10_Monitor_0203.h | MON | **FN-05** | FN-05-04 | APP-01 | PSRAM Warm 버퍼, Cold 바이너리 파일 헤더(MNW1), 64-event 세션 타임라인 선언 |
| 46 | CT10_Monitor_0203.cpp | MON | **FN-05** | FN-05-04 | APP-01 | 1s/30s 캡처, 5분 버킷 집계, 1시간 Cold 플러시, 이력 조회 및 CSV 내보내기 구현 |
| 47 | D10_Logger_0203.h | D10 | **FN-01** | FN-01-04 | APP-01, APP-03 | 시리얼 ANSI 컬러 출력, 256-entry 순환 로그 버퍼 및 /ws/log 실시간 브로드캐스트 |
| 48 | M10_MotionLogic_0203.h | M10 | **FN-05** | FN-05-03 | APP-03 | PIR 센서 유지 시간(holdSec) 단일 판정, 상태 변경 콜백 및 JSON 직렬화 |
| 49 | N10_NvsManager_0203.h | N10 | **FN-03** | FN-03-05 | APP-02, APP-03 | NVS "SNW_RUN" 17개 키 상수(<=15B), 런타임 상태 및 AI 일일 사용량 구조체 선언 |
| 50 | N10_NvsManager_0203.cpp | N10 | **FN-03** | FN-03-05 | APP-02, APP-03 | 10초 주기 단일 nvs_commit 배치 플러시 및 AI 일일 오디오/비용 즉시 영속화 구현 |
| 51 | P10_PWM_ctrl_0203.h | P10 | **FN-04** | FN-04-07 | - | 25kHz LEDC 하드웨어 PWM 구동(ESP32 Core v2/v3 호환) 및 3구간 비선형 팬 커브 보정 |
| 52 | S10_Simul_0203.h | S10 | **FN-05** | FN-05-02 | - | CL_S10_Simulation 자연풍 물리 엔진, 60초 이력, 120-entry 차트 링버퍼 선언 |
| 53 | S10_Simul_Const_0203.h | S10 | **FN-05** | FN-05-02 | - | 틱 지터, 위상 지속시간, von Kármán 12밴드 계수, 관성 및 풍속-PWM 변환 상수 |
| 54 | S10_Simul_Core_0203.cpp | S10 | **FN-05** | FN-05-02 | - | 시뮬레이션 초기화/정지, 메인 물리 tick(), 관성 필터, PWM 변환 및 차트 로깅 |
| 55 | S10_Simul_IO_0203.cpp | S10 | **FN-05** | FN-05-02 | APP-01 | toJson, toChartJson(static 배열 스냅샷 힙 할당 제거), patchFromJson, O(1) 평균 풍속 |
| 56 | S10_Simul_Physic_0203.cpp | S10 | **FN-05** | FN-05-02 | - | 위상 전이(CALM/NORMAL/STRONG), 12밴드 난류, 포아송 확률 돌풍/열기포 연산 |
| 57 | S20_WindSolver_0203.h | S20 | **FN-05** | FN-05-01 | - | 10종 프리셋 × 5종 스타일 배수 × 오버라이드 결합 솔버(S20_resolveWindParams) |
| 58 | TM10_TimeMg_0203.h | TM10 | **FN-02** | FN-02-02 | APP-03 | CL_TM10_TimeManager 다중 NTP 서버 풀, 타임아웃/백오프 상수 및 시각 조회 선언 |
| 59 | TM10_TimeMg_0203.cpp | TM10 | **FN-02** | FN-02-02 | APP-03 | esp_sntp 비블로킹 콜백 동기화, 15s 타임아웃 시 4개 서버 순환 전환 및 _isTimeSane 검증 |
| 60 | W10_Web_0203.h | W10 | **FN-07** | FN-07-01 | APP-01 | CL_W10_WebAPI 전체 라우트·WS 브로드캐스터 선언 및 W10_AI_Limits 한도 상수 정의 |
| 61 | W10_Web_Const_0203.h | W10 | **FN-07** | FN-07-01 | APP-01 | /api/v001/* 40여 종 REST URI 및 /ws/* 5종 WebSocket 엔드포인트 경로 상수 |
| 62 | W10_Web_Gemini_0203.cpp | W10 | **FN-06** | FN-06-02 | APP-01 | gemini_worker 비동기 태스크, 2-Turn Function Calling 루프, 5s 레이트 리밋 및 Job 폴링 |
| 63 | W10_Web_Routes_0203.cpp | W10 | **FN-07** | FN-07-01 | APP-01 | CL_W10_WebAPI::begin() 전체 라우트 일괄 등록 및 applySystemRuntimeFromConfig() |
| 64 | W10_Web_Routes_AILive_0203.cpp | W10 | **FN-06** | FN-06-02 | APP-01, APP-03 | Gemini Live 토큰 발급, 30분(1800s) 일일 한도 게이트(403), Live Tool 브리지 및 비용 API |
| 65 | W10_Web_Routes_Comfort_0203.cpp | W10 | **FN-07** | FN-07-02 | APP-01 | GET /api/v001/comfort DI 쾌적도 조회 및 GET/POST /comfort/auto 자동 모드 토글 |
| 66 | W10_Web_Routes_Config_0203.cpp | W10 | **FN-07** | FN-07-03 | APP-01 | /api/v001/config, /config/save, /config/dirty, /config/init, /reload 라우트 |
| 67 | W10_Web_Routes_Control_0203.cpp | W10 | **FN-07** | FN-07-02 | APP-01 | /api/v001/control/*(모드/오버라이드/타이머/ACK/리부트), /simulation, /sim/*, /pir/feed |
| 68 | W10_Web_Routes_CRUD_0203.cpp | W10 | **FN-07** | FN-07-03 | APP-01 | windProfile, schedules, user_profiles REST CRUD 및 URL tail /{id} 파싱 |
| 69 | W10_Web_Routes_Monitor_0203.cpp | W10 | **FN-07** | FN-07-03 | APP-01 | /api/v001/monitor, /events, /export(CSV), /timeline, /session-summary 라우트 |
| 70 | W10_Web_Routes_Network_0203.cpp | W10 | **FN-07** | FN-07-04 | APP-01 | /api/v001/wifi/config 패치 + 비동기 재연결, /system/time/set, /system/firmware/check |
| 71 | W10_Web_Routes_Session_0203.cpp | W10 | **FN-07** | FN-07-02 | APP-01 | `/api/v001/session/*`(start/pause/resume/stop/rule/current/schedule-override) 세션 FSM 전이 라우트 |
| 72 | W10_Web_Routes_System_0203.cpp | W10 | **FN-07** | FN-07-04 | APP-01 | `/api/v001/version`, `/state`, `/system`, `/motion`, `/diag`, `/metrics`, `/logs`, `/auth/test`, `/wifi/scan` 시스템 정보·진단 라우트 |
| 73 | W10_Web_Routes_WindDict_0203.cpp | W10 | **FN-07** | FN-07-03 | APP-01 | GET /api/v001/windDict 10종 프리셋·5종 스타일 사전 조회 (스냅샷 우선 + 파일 폴백) |
| 74 | W10_Web_Static_0203.cpp | W10 | **FN-07** | FN-07-01 | APP-01 | RFC 7231 Accept-Encoding Gzip 협상 서빙, cfg_pages 동적 라우팅 및 /api/v001/menu |
| 75 | W10_Web_Upload_0203.cpp | W10 | **FN-07** | FN-07-04 | APP-01, APP-03 | fileUpload & fwUpdate OTA (2MB 제한, 경로 탐색 차단, 단일 세션 점유 잠금) |
| 76 | W10_Web_Util_0203.cpp | W10 | **FN-07** | FN-07-01 | APP-01, APP-03 | CORS/보안 헤더, requireApiKey 401 응답, 단편화 HTTP Body 단일 블록 누적기 |
| 77 | W10_Web_WS_0203.cpp | W10 | **FN-07** | FN-07-05 | APP-01, APP-03 | 5대 WebSocket 핸드셰이크 인증(?apiKey), 연결 시 초기 상태 푸시 및 주기적 클라이언트 정리 |
| 78 | WF10_WiFiMgr_0203.h | WF10 | **FN-02** | FN-02-01 | APP-03 | CL_WF10_WiFiManager, lock-free s_staConnected, 지수 백오프 상수 및 재연결 태스크 선언 |
| 79 | WF10_WiFiMgr_0203.cpp | WF10 | **FN-02** | FN-02-01 | APP-01, APP-03 | SoftAP/STA/WiFiMulti 초기화, 이벤트 기반 재연결, WF10_Reconnect 태스크 및 AP 스캔 |

## 4. 핵심 용어 및 약어집 (Glossary)

### 4.1 아키텍처 및 설계 원칙
- **SSOT (Single Source of Truth)**: 상수(`A20_Const_Const_0203.h`), 스키마(`APP-02`), API 계약(`APP-01`), 상태/에러 매트릭스(`APP-03`) 등을 단일 파일에만 정의하여 다중 파일 간 불일치를 원천 차단하는 설계 원칙.
- **Dirty Flag (지연 저장 플래그)**: 메모리 상의 설정이나 상태 변경 시 즉시 플래시/네트워크 I/O를 발생시키지 않고 원자적 불리언 플래그(`portMUX_TYPE s_dirtyflagSpinlock` 보호)만 마킹한 뒤 주기적 또는 명시적 요청 시 일괄 처리하는 기법.
- **Deferred Free (지연 메모리 해제)**: 무중단 설정 재로드(`reloadAll`) 시 웹 비동기 태스크(`async_tcp`)의 읽기 완료를 보장하기 위해 구버전 설정 포인터를 `PENDING_FREE_GRACE_MS`(3,000ms) 유예 후 해제하는 UAF(Use-After-Free) 방지 메커니즘. `s_pendingFree` 큐(2슬롯) 기반.
- **Lock Hierarchy (L1→L2→L3)**: 멀티태스크 환경에서 데드락을 원천 차단하기 위해 다중 락 획득 시 반드시 상위 계층 → 하위 계층 순서만 허용하는 규약 (`APP-03` §3.2).
  - **L1 (Config 계층)**: `s_rootSwapMux`, `s_dirtyflagSpinlock`, `s_pendingFreeMux` (`portMUX_TYPE` 스핀락) + `s_recursiveMutex` (`C10` 설정 I/O 보호, 100ms)
  - **L2 (Control 계층)**: `s_stateMutex` (`CT10` 제어 상태 `runCtx`/`_session`/`overrideState` 보호, 100ms)
  - **L3 (Module 계층)**: `S10::_recursiveMutex`, `M10::s_stateMutex`, `MON::s_monitorMutex`, `N10`/`TM10`/`WF10::s_mutex`, `W10::s_aiJobMutex` (각 서브 매니저 내부 자원)
  - 역순 획득(L3→L2→L1) 및 L3 보유 중 L2 역획득은 엄격 금지.

### 4.2 제어 및 상태 머신
- **7-State 제어 FSM (`EN_CT10_state_t`)**: `IDLE` → `OVERRIDE` → `PROFILE_RUN` → `SCHEDULE_RUN` → `AUTOOFF_STOPPED` → `TIME_INVALID` → `ENV_PAUSED` 7개 상태를 `decideRunSource()`의 9단계 우선순위로 단일 전이(`applyDecision`)하는 중앙 제어 엔진 (`FN-04` §4.1, `APP-03` §2.1).
- **Smart Resume (3구간 복귀 정책)**: 세션 일시정지(PAUSED) 후 재개(`resumeSession`) 시 정지 경과 시간에 따라 복귀 위치를 자동 결정하는 정책 (`FN-04` §2.2).
  - **≤ 5분** (`S_PAUSE_CONTINUE_MS = 300,000ms`): 잔여 스텝 시간 그대로 **연속 재개** (`phaseStartMs += v_pauseDuration`)
  - **5분 초과 ~ 30분** (`S_PAUSE_STEP_RESET_MS = 1,800,000ms`): **현재 스텝 처음부터** 재개
  - **30분 초과**: **Step 1(index=0)부터 전체 리셋** 재개
- **ENV_PAUSED 히스테리시스**: 환경 트리거(저온·저DI·PIR 부재)로 인한 일시정지의 채터링(Flapping) 방지를 위해 진입 임계값(`threshold`)과 재개 임계값(`threshold + hysteresis`)을 이원화한 정책. `mode == "PAUSE"`일 때 `tempLow.hysteresis >= 0.5°C`, `diLow.hysteresis >= 3.0` 강제 보정 (`APP-02` §3.6).

### 4.3 물리 시뮬레이션 및 쾌적도
- **DI (Discomfort Index, 불쾌지수)**: 온도와 상대습도로 체감 쾌적도를 산출하는 일본 기상청 표준 지수. 수식: `DI = 0.81·T + 0.01·H·(0.99·T − 14.3) + 46.3`. 4단계 매핑(`DI < 68` 쾌적 / `68~75` 약간 덥네요 / `75~80` 끈적이는 날씨 / `≥ 80` 숨이 막혀요) (`FN-04` §2.3).
- **PWM 3구간 비선형 커브 (`SPLIT1 = 0.33f`, `SPLIT2 = 0.66f`)**: 요청 비율 `r ∈ [0, 1]`을 3개 구간으로 분할하여 기동 토크 확보(0~33%) / 쾌적 제어 주력(33~66%) / 고출력 상한(66~100%) 구간별로 다른 선형 보간을 적용하는 팬 특성 보정 (`FN-04` §2.3).
- **von Kármán 난류 스펙트럼 (12밴드)**: 주파수 대역 `i = 1..12`(`n = 0.1i`, `f = n·U/L`)에 대해 스펙트럼 밀도 `S(f)`를 계산하고 지수 이동 상관 필터(`e^(-Δt/τ)`)로 `spectralEnergyBuf`를 갱신하는 대기 경계층 난류 합성 기법 (`FN-05` §2.3).
- **포아송 이벤트 확률 (`P = 1 − e^(−λ·Δt)`)**: 돌풍(`gustProbBase`, 기본 0.040/s) 및 열기포(`thermalFreqBase`, 기본 0.022/s)를 초당 발생률(λ)로 정의하여 틱 지터나 주기 변화에도 단위 시간당 발생 빈도가 일정하게 유지되는 프레임 레이트 독립적 확률 모델 (`FN-05` §2.3).
- **Warm / Cold Buffer (2계층 이력)**: 최근 1시간 고해상도(1초 풍속 / 30초 센서) 데이터를 PSRAM 링버퍼(Warm)에 보관하고, 5분 버킷 집계 후 1시간마다 LittleFS 바이너리 파일(`MNW1` 헤더, Cold)에 순환 기록하는 2계층 시계열 아키텍처. Cold 용량: wind/sensor 각 2,016건(7일 @ 5분), state 1,680건, config 600건(30일), system 150건 (`FN-05` §3.1).

### 4.4 AI 연동 및 보안
- **AI 위험 명령 가드레일 (15종 블랙리스트)**: `CT10_AI::isForbiddenAIFunction()`가 `reboot`, `restart`, `reset`, `factoryReset`, `factory_reset`, `format`, `clearAll`, `erase`, `shutdown`, `fwUpdate`, `firmware_update`, `ota`, `fileUpload`, `upload`, `erase_nvs` 15종 키워드를 대소문자 무시(`strcasecmp`)로 검사하여 실행 전 차단(`"error:forbidden"`)하는 최우선 보안 계층 (`FN-06` §2.3).
- **2-Turn 지연 생성 최적화**: Gemini Turn 1에서 `functionCall` 반환 시 `executeAIAction()`으로 도구를 실행하고, **상태 변경형 명령이 성공(`"ok"`)한 경우 Turn 2 왕복을 생략**하여 로컬 `buildSpeechHint()` 문구를 즉시 반환. **조회형 JSON 응답이거나 실행 실패 시에만 Turn 2**를 호출하여 자연어 요약을 생성하는 지연 최소화 기법 (`FN-06` §2.3).
- **Live 음성 일일 30분 과금 가드레일**: `G_W10_LIVE_WARN_SEC = 1500`(25분)에서 `"warn"` 경고, `G_W10_LIVE_DAILY_CAP_SEC = 1800`(30분) 도달 시 `403 Forbidden`(`level: "cap"`)으로 신규 토큰 발급을 차단. 사용량 보고(`POST /ai/usage`) 시 `addAIAudioUsage()`가 즉시 `nvs_commit()`을 수행하여 재부팅을 통한 한도 우회를 원천 차단 (`FN-06` §2.3).
- **프롬프트 캐싱 (FNV-1a 세션 해시 + 30초 TTL)**: `computeSessionHash()`(`type`, `state`, `profileNo` 기반 FNV-1a 해시)가 동일하고 경과 시간이 `30,000ms` 미만이면 `s_cachedPrompt`를 재사용하여 조립 비용을 절감하는 캐시 정책 (`FN-06` §2.3).

### 4.5 기타
- **스케줄 자정 넘김(Cross-Midnight) 분해**: `startTime > endTime`(예: `22:00 ~ 06:00`)인 야간 스케줄을 `[startMin, 1440)`과 `[0, endMin)` 2개 구간으로 분해하여 요일별 시간 중복을 검사하는 겹침 검증 방식 (`FN-03` §2.3, `APP-02` §3.4).
- **Dirty 배치 소비 (`consumeAllDirty`)**: `CT10_WS_tick()`이 원자적 Dirty 플래그를 일괄 소비한 후 **1틱당 우선순위(`priority` 오름차순)가 가장 높은 준비된 채널 최대 1개**만 전송하여 `async_tcp` 버퍼 포화를 방지하는 WebSocket 스케줄링 정책. `/ws/chart` 페이로드가 `chartLargeBytes`(기본 3,500B) 이상이면 전송 주기를 `chartThrottleMul`(기본 ×2)로 자동 완화 (`FN-07` §2.3, `APP-01` §4.3).


