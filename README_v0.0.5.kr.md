![WindScape Title](https://github.com/TilmanGriesel/WindScape/blob/main/docs/title.png?raw=true)

파일명 : PJT_root/README_v0.0.5.kr.md

# 🌿 Smart Nature Wind v0203 (스마트 자연풍 독립형 제어기)

[![Firmware Version](https://img.shields.io/badge/Firmware-v0203%20(FW__2.0.3)-blue.svg)](src/v0203/contract_doc_0203/SPEC_0203.md)
[![Target MCU](https://img.shields.io/badge/MCU-ESP32--S3--N16R8-orange.svg)](src/v0203/contract_doc_0203/BUDGET_0203.md)
[![PlatformIO](https://img.shields.io/badge/Framework-PlatformIO%20%7C%20C%2B%2B17-green.svg)](platformio.ini)
[![Architecture](https://img.shields.io/badge/Arch-FreeRTOS%20CBD%20v2.16--v3.4-purple.svg)](src/v0203/contract_doc_0203/CONTRACT_0203.md)

* **원작 오픈소스 프로젝트**: [WindScape by Tilman Griesel](https://github.com/TilmanGriesel/WindScape.git)
* **현재 펌웨어 사양**: **v0203 (FW_Ver_2.0.3)** (ESP32-S3 / C++17 / FreeRTOS / PlatformIO 기반 단독 실행 임베디드 어플라이언스, C++ 소스 `_0203` 접미사)

---

*단순히 일정한 세기만 내보내는 일반 DC 선풍기나 PC 팬을,  
실제 대기역학(대기 경계층 난류, 열기포, 돌풍)을 정밀 계산하여 자연의 숨결을 그대로 재현하는 스마트 독립형 제어기 프로젝트입니다.*

**Smart Nature Wind v0203**은 외부 홈오토메이션 서버(Home Assistant, ESPHome 등) 종속 없이, **ESP32-S3 기기 자체에서 완벽하게 단독 구동되는 풀스택 임베디드 웹 어플라이언스**입니다.

기기 내부 플래시 메모리(LittleFS)에 탑재된 초경량 싱글 번들 웹서버, 실시간 WebSocket 물리 차트, 10종 자연풍 대기역학 프리셋 × 5종 스타일 조합, **Session FSM 기반 8스텝 작곡기(Wind Studio)**, **일본 기상청 표준 DI 기반 Comfort 추천**, **Gemini AI 비서 & Live 실시간 양방향 음성**, 온습도(DHT22)·인체감지(PIR) 센서 연동 지능형 제어, 개인화 스케줄러 및 3단계 자동 꺼짐(Auto-Off) 보호 체계를 제공합니다.

---

## 📚 문서 체계 및 상세 안내 (Documentation Roadmap)

본 `README` 문서는 프로젝트의 전체 개요와 빠른 시작(Quick Start)을 안내합니다.  
각 부문별 세부 회로도, 수치 모델, 동시성 계약, 상태 전이, API 규격 및 유지보수 절차는 아래의 상세 전문 문서를 참조하십시오.

### 1. 사용자 가이드 (User Manual)
* 📖 [**Smart Nature Wind v0203 종합 사용자 매뉴얼 v2.9**](src/v0203/User_Manual_0203/UserManual_0203_002.md)
  * 기기 설치, 배선, Wi-Fi(SoftAP/STA) 연결, 13대 웹 화면 조작법, 10대 프리셋 + 5대 스타일 상세 해설, 대시보드 3대 슬라이더 연동, Wind Studio 8스텝 작곡기, Session FSM & Now Playing Bar, Comfort DI 추천, Monitor 실시간/회고, **§13 Gemini AI 비서 & Live 실시간 음성(Aoede 보이스, Audio Orb, 웨이크워드, Barge-in, 12대 제어도구, 안심 가드레일, 전역 플로팅 마이크 FAB)**, 4단계 온보딩, 오프라인 시뮬레이션 데모 툴바, REST API/WebSocket 규격, 고장 진단 및 유지보수 가이드 수록.

### 2. 기술 사양 및 CBD 엔지니어링 계약서 (Engineering Contracts)
* 📑 [**README_0203.md (계약 문서 세트 총괄 인덱스 v2.16)**](src/v0203/contract_doc_0203/README_0203.md) : CBD 계약 체계 총괄, Stage 8/9/9.1 마일스톤 및 실측 자원(RAM 100.5KB / Flash 1.36MB / LittleFS 149.8KB).
* 📐 [**SPEC_0203.md (종합 기술 사양서 v2.16)**](src/v0203/contract_doc_0203/SPEC_0203.md) : 하드웨어 핀맵, 25kHz PWM 타이밍, REST/WebSocket 인터페이스, §5.1.4 Stage 8 AI 제어 & Gemini Live 8대 API 명세, 12대 안전도구 및 15종 위험명령 차단, ADR 1~10, Gzip Level 9 정적 에셋 파이프라인 (총 137.2 KB gz 번들) 및 오프라인 모듈 분리 규격, Stage 9 UI 레이아웃 표준화 & 2차 감사 19대 이슈 해결.
* 🤝 [**CONTRACT_0203.md (동시성 계약서 v3.4)**](src/v0203/contract_doc_0203/CONTRACT_0203.md) : FreeRTOS 5대 태스크 구조, 우선순위, Mutex 소유권 및 데드락 방지, §3.2 Session 위임 락 순서, §7.15 Stage 8 AI-1~AI-6 실시간 음성 안전 계약, §7.16 1차 감사 AUDIT-1~6, §7.17 UI-5~8 모바일 레이아웃 스택, §7.18 2차 감사 AUDIT2-1~5(Live 보안인가, 도구선언 단일위임, REST parts 객체 규격, 데스크톱 영구 사이드바 ADR-10).
* 🔄 [**STATE_0203.md (상태 및 7-State + Session 3-State FSM 명세서 v3.1)**](src/v0203/contract_doc_0203/STATE_0203.md) : 상태 소유권 매트릭스(§1 `s_aiDailyUsage`/`s_promptCache`/`runtimeAutoOff` 확장), §2.5 Session FSM ↔ runCtx FSM 관계(ADR-1), §6.4 Pause/Resume/Stop 위임 라이프사이클, S10 물리 엔진 상태, §8 E-2 AI 분할 상태 소유권.
* 🔀 [**FLOW_0203.md (실행 흐름도 및 시퀀스 다이어그램 v3.0)**](src/v0203/contract_doc_0203/FLOW_0203.md) : 부팅 시퀀스, HTTP/WS 처리 루프, §4.1 Session 위임 시퀀스, §13 Stage 8 AI 제어 & Gemini Live 양방향 음성 시퀀스(AudioWorklet 16k/24k, Barge-in, Tool Call 위임, NVS 일일 리셋), `pio_gzip_0203.py` 빌드 전처리/오프라인 부트스트랩 시퀀스.
* ⏱️ [**BUDGET_0203.md (자원 및 WCET 예산 v2.9)**](src/v0203/contract_doc_0203/BUDGET_0203.md) : SRAM/PSRAM/Flash 메모리 버짓, 태스크별 WCET, §3 async_tcp AI 라우트 8종 WCET, §10.4 Stage 8 AI 자원 영향표, 프론트엔드 Gzip 예산 (137.2 KB / 1MB LittleFS, RAM 30.7%, Flash 20.8%).
* 🧪 [**TEST_PLAN_0203.md (회귀 테스트 및 검증 계획서 v3.2)**](src/v0203/contract_doc_0203/TEST_PLAN_0203.md) : 단위/통합/스트레스 테스트 케이스(§3.5 T-114~T-120 Stage 8 AI 회귀 7건, §3.6 T-121~T-148 28대 감사 회귀, 총 67건 필수 게이트, `test/e2e_stage8_4.py` 자동화 스크립트), §8 트러블슈팅 매트릭스.

### 3. 개발 환경 및 AI 에이전트 협업 가이드 (Developer & Agent Setup)
* 🤖 [**AGENTS.md (개발 환경 및 에이전트 협업 가이드)**](AGENTS.md)
  * ESP32-S3 PlatformIO 빌드/플래시 설정, C++ `_0203` 모듈 아키텍처, CBD v2.16~v3.4 계약 준수 및 에이전트 필수 4대 불변 원칙, 네이밍 치트시트 안내.

---

## 📋 목차 (Table of Contents)

1. [📚 문서 체계 및 상세 안내 (Documentation Roadmap)](#-문서-체계-및-상세-안내-documentation-roadmap)
2. [🌬 핵심 기능 (Key Features)](#-핵심-기능-key-features)
3. [⚙ 작동 모드 (Operating Modes)](#-작동-모드-operating-modes)
4. [🎙️ Gemini AI 비서 & Live 양방향 음성 (Stage 8)](#️-gemini-ai-비서--live-실시간-음성-stage-8-신규)
5. [🗺️ 10종 자연풍 환경 프리셋 (Nature Presets)](#️-10종-자연풍-환경-프리셋-nature-presets)
6. [🎨 5종 바람 스타일 (Wind Styles)](#-5종-바람-스타일-wind-styles)
7. [🎵 Session FSM & Wind Studio (v0203 신규)](#-session-fsm--wind-studio-v0203-신규)
8. [🚀 빠른 시작 가이드 (Quick Start)](#-빠른-시작-가이드-quick-start)
9. [🔧 하드웨어 구성 및 배선 (Hardware & Wiring)](#-하드웨어-구성-및-배선-hardware--wiring)
10. [💻 소프트웨어 빌드 및 배포 (Build & Setup)](#-소프트웨어-빌드-및-배포-build--setup)
11. [🌐 웹 대시보드 및 시스템 구조 (Web Interface & System Architecture)](#-웹-대시보드-및-시스템-구조-web-interface--system-architecture)
    - [11.1 웹 브라우저 주요 진입점 (SPA Routes)](#1-웹-브라우저-주요-진입점-spa-routes)
    - [11.2 반응형 레이아웃 및 데스크톱 영구 내비게이션 (ADR-9, ADR-10)](#2-반응형-레이아웃-및-데스크톱-영구-내비게이션-adr-9-adr-10)
    - [11.3 REST API & WebSocket 인터페이스 요약](#3-rest-api--websocket-인터페이스-요약-v0203)
12. [🌪 대기역학 물리 시뮬레이션 원리 (Physics Model)](#-대기역학-물리-시뮬레이션-원리-physics-model)
13. [🧭 문제 해결 요약 (Troubleshooting Summary)](#-문제-해결-요약-troubleshooting-summary)
14. [🔗 부품 및 참조 링크 (Links)](#-부품-및-참조-링크-links)

---

## 🌬 핵심 기능 (Key Features)

* **독립 실행형 풀스택 아키텍처 (Standalone Architecture)**  
  외부 서버나 Home Assistant 허브 없이, ESP32-S3 단독으로 비동기 웹서버, RESTful API, 고성능 WebSocket 브로커를 구동합니다.
* **대기역학 기반 실시간 물리 시뮬레이션 (Realistic Wind Physics)**  
  미기상학 대기 경계층 이론을 적용하여 난류 스펙트럼(Turbulence), 열기포 상승(Thermal Bubble), 돌풍(Gust), 하드웨어 관성 필터(Inertia Filter)를 실시간 수치 연산합니다.
* **Gemini AI 비서 & Live 실시간 양방향 음성 (Stage 8 신규)**  
  - **초저지연 양방향 실시간 대화**: WebSocket 기반 Gemini Live API와 프론트엔드 AudioWorklet(16kHz Mic 녹음 / 24kHz PCM 재생) 연동.
  - **Barge-in (말끊기) 지원**: AI 발화 중 사용자가 말을 시작하면 재생 버퍼를 즉각 Flush하고 사용자 음성에 우선 응답.
  - **12대 제어 도구 (Tool Calls)**: 바람 프리셋/스타일 전환, 세션 제어(재생/일시정지/정지), 풍속 미세조정, 수면 타이머 예약 등 완전 자율 실행.
  - **3중 안심 가드레일**: 15종 위험/물리 파괴 명령 차단, 세션 30분 상한(403 초과 차단), 일일 비용 및 사용량 NVS 영구 기록 가드레일.
  - **전역 플로팅 마이크 FAB**: 어느 화면에서든 원클릭으로 호출 가능한 실시간 음성 대화 바텀시트(`999b.ai-sheet.js`) 및 Audio Orb 시각화.
* **10종 자연 환경 프리셋 × 5종 스타일 조합**  
  `OCEAN`, `COUNTRY_BREEZE`, `MEDITERRANEAN`, `MOUNTAIN`, `PLAINS`, `HARBOR_BREEZE`, `FOREST_CANOPY`, `URBAN_SUNSET`, `TROPICAL_RAIN`, `DESERT_NIGHT` 10종 프리셋에 `BALANCE`/`ACTIVE`/`FOCUS`/`RELAX`/`SLEEP` 5종 스타일을 조합하여 50가지 기류 특성 제공.
* **초경량 SPA Web UI 대시보드 (Gzip Level 9, 총 137.2 KB gz / LittleFS 149.8 KB)**  
  54개 JS, 18개 CSS를 단일 번들(`P010_bundle_0203.js` 120.7KB gz / `P000_common_0203.css` 14.8KB gz / `index.html` 1.7KB gz)로 패키징.  
  - **데스크톱 영구 사이드바 & 모바일 슬라이드 드로어 분리 (ADR-10)**: 1024px 이상 대화면에서는 2열 그리드로 사이드바를 상시 노출하여 메뉴 증발을 차단하고, 모바일에서는 터치 드로어 및 딤 오버레이를 제공합니다.
  - **하단 뷰포트 레이아웃 동적 스택 (ADR-9)**: Now Playing Bar 가동 시 AI FAB과 토스트가 76px에서 124px로 0.25초 부상하며 본문 스크롤 가림을 해소합니다.
  - **원스톱 인터랙션**: 대시보드 상단 5종 바람 스타일 탭(44px 모바일 터치 최적화) + 하단 4x2 프리셋 그리드(10종) + 3대 물리 슬라이더 자동 동기화 및 `[수동 튜닝됨]` 뱃지 / `[기본값 원복]` 리셋 액션 + Now Playing Bar 상세 확장 모달(`showNowPlayingDetailsModal`) + 완전 한/영 다국어 + 오프라인 접이식 데모 툴바 탑재.
* **Session FSM & 8스텝 Wind Studio (v0203 신규)**  
  `IDLE`/`ACTIVE`/`PAUSED` 3-State Session FSM + 5분/30분 Smart Resume. 8스텝 작곡기(Wind Studio)로 나만의 바람 시나리오 제작 → Playlist 저장 → 대시보드 원클릭 재생 → Now Playing Bar로 어디서나 제어.
* **일본 기상청 표준 DI 기반 Comfort 추천 (v0203 신규)**  
  실내 온·습도 기반 불쾌지수(DI) 실시간 산출 → 4단계 쾌적도 판정 → 최적 프리셋/스타일/프로필 자동 추천.
* **모니터링 & 회고 (v0203 신규)**  
  1시간 PSRAM Warm 버퍼(1초 원본) + 7일 LittleFS Cold 이력(1시간 배치 flush) + 64-event 세션 회고 타임라인 + CSV 내보내기.
* **지능형 센서 연동 (Sensor Integration)**  
  - **온습도 센서 (DHT22)**: 실내 온도/습도 추세에 따른 풍속 지능형 자동 제어 및 Comfort DI 산출.
  - **인체감지 센서 (PIR)**: 사람의 재실 여부를 감지하여 부재 시 자동 절전/정지 (holdSec 단일 판정, C-3).
  - **RGB NeoPixel LED (WS2812B)**: 7대 FSM 기기 상태 및 실시간 풍속을 색상과 밝기로 시각화.
* **정밀 25kHz 하드웨어 PWM 제어**  
  PC 4핀 팬 표준 주파수(25kHz, 10-bit 분해능)를 준수하여 모터 고주파 가청 소음 없이 극저속(5%)부터 최고속(100%)까지 정밀 제어.
* **강력한 안전성 및 3단계 Auto-Off 보호 체계**  
  일반 타이머(Normal), 지정 시각(Off-Time), 과냉 방지(Off-Temp) 3-way 안전 종료 + 센서 고장 시 Safe Mode 전환 지원.
* **4단계 첫 방문 온보딩 (v0203 신규)**  
  언어 선택 → Wi-Fi 안내 → 첫 바람 선택 → "지금 시작" 4단계 팝업으로 신규 사용자 즉시 사용.

---

## ⚙ 작동 모드 (Operating Modes)

기기는 다음 5가지 핵심 모드로 동작하며, 세부 파라미터는 웹 UI 및 REST API를 통해 실시간 변경됩니다.

| 모드 | 영문명 | 설명 | 상세 참조 |
|---|---|---|---|
| **자연풍 모드** | Natural Wind | 난류, 열기포, 돌풍 알고리즘이 결합되어 실시간으로 변화하는 자연스러운 기류를 생성합니다. | [매뉴얼 §6](src/v0203/User_Manual_0203/UserManual_0203_002.md#6-스마트-센서-연동-및-3대-자동-종료-autooff) |
| **정속 모드** | Constant / FIXED | 사용자가 지정한 고정 세기(0~100%)로 일정하게 팬을 구동합니다 (Session `FIXED`). | [매뉴얼 §4](src/v0203/User_Manual_0203/UserManual_0203_002.md#4-메인-대시보드-조작-가이드-dashboard) |
| **Comfort 모드** | DI-Auto | DHT22 센서의 실내 온·습도 기반 DI(불쾌지수)로 최적 프리셋/프로필을 추천합니다. | [매뉴얼 §10](src/v0203/User_Manual_0203/UserManual_0203_002.md#10-comfort-di-기반-추천-v0203-신규) |
| **스케줄 모드** | Schedule | 요일 및 시간대별로 지정된 Profile을 참조하여 자동으로 동작합니다 (ADR-3 단일 규격). | [매뉴얼 §7](src/v0203/User_Manual_0203/UserManual_0203_002.md#7-주간-스케줄러-설정-schedule) |
| **AI 음성 모드** | Gemini Live | 음성 또는 텍스트 자연어로 바람 제어 및 질문 답변을 실시간으로 수행합니다. | [매뉴얼 §13](src/v0203/User_Manual_0203/UserManual_0203_002.md#13-gemini-ai-비서--live-실시간-음성-v0203-신규) |

> 💡 상태 전이 규칙과 Fail-Safe 조건은 [STATE_0203.md](src/v0203/contract_doc_0203/STATE_0203.md) 문서를 참조하십시오.

---

## 🎙️ Gemini AI 비서 & Live 실시간 음성 (Stage 8 신규)

Smart Nature Wind v0203은 Google Gemini Live API와 WebSocket을 결합한 실시간 음성 비서 아키텍처를 탑재하였습니다.

### 1. 양방향 실시간 오디오 파이프라인
* **마이크 입력**: 브라우저 AudioWorklet을 통해 16kHz 모노 PCM16 형식으로 캡처 후 기기를 거쳐 Gemini Live 세션으로 스트리밍.
* **음성 출력**: Gemini의 24kHz PCM16 오디오 청크를 수신하여 부드러운 Aoede 보이스로 실시간 재생.
* **Barge-in (말끊기)**: 사용자가 말하기 시작하면 즉각 오디오 큐를 비우고 사용자 음성을 우선 처리.

### 2. 12대 스마트 제어 도구 (Tool Calls)
자연어 명령("시원한 바다 바람 틀어줘", "30분 뒤에 꺼줘", "바람 살짝 줄여줘")을 기기 제어 명령으로 자동 변환하여 실행합니다.

| 도구명 | 설명 | 예시 발화 |
|---|---|---|
| `set_preset` | 10종 자연풍 프리셋 변경 | "지중해 연안 바람 틀어줘" |
| `set_style` | 5종 바람 스타일 변경 | "집중 모드로 바꿔줘" |
| `set_speed` | 고정 풍속(%) 설정 | "바람 세기 40%로 해줘" |
| `session_control` | 재생 / 일시정지 / 정지 | "잠깐 멈춰줘", "다시 시작해" |
| `adjust_wind` | 풍속 상대 조정 | "조금만 더 시원하게 해줘" |
| `set_auto_off` | 수면 및 전원 타이머 설정 | "1시간 뒤에 꺼줘" |
| `get_environment` | 온습도 및 불쾌지수 조회 | "지금 방 온도랑 습도 어때?" |
| `get_fan_state` | 현재 팬 상태 조회 | "지금 무슨 바람 불고 있어?" |

### 3. 강력한 안심 가드레일 (Safety Guardrails)
* **15종 위험 명령 차단**: 공장초기화, 시스템 재부팅, Wi-Fi 초기화, 펌웨어 덮어쓰기 등 위험 행위는 음성으로 실행 불가.
* **30분 세션 상한**: 세션당 최대 30분 제한으로 불필요한 과금 방지 (30분 초과 시 403 차단 및 정중한 종료 안내).
* **NVS 일일 비용 한도 추적**: ESP32-S3 비휘발성 메모리(NVS)에 일일 세션 시간 및 토큰을 누적 기록하여 예산 초과 방지.

> 💡 상태 전이 규칙과 Fail-Safe 조건은 [STATE_0203.md](src/v0203/contract_doc_0203/STATE_0203.md) 문서를 참조하십시오.

---

## 🗺️ 10종 자연풍 환경 프리셋 (Nature Presets)

공간의 분위기와 개인의 활동 목적에 맞춘 10종의 환경 프리셋을 원클릭으로 선택할 수 있습니다.

| 번호 | 프리셋 코드 (WindDict) | 한글 감성 명칭 | 특성 요약 | 추천 용도 |
|:---:|:---|:---|:---|:---|
| **1** | **`OCEAN`** | 바다 바람 | 파도형 큰 파동 + 시원한 강풍 | 상쾌한 기분 전환, 집중 |
| **2** | **`COUNTRY_BREEZE`** | 시골 들판 바람 | 저풍속 / 미세 난류 / 완만한 변화 | 휴식, 독서, 수면 보조 |
| **3** | **`MEDITERRANEAN`** | 지중해 연안 바람 | 온화한 풍속 / 부드러운 순환 대류 | 일상 사무, 거실 환기 |
| **4** | **`MOUNTAIN`** | 깊은 산속 계곡풍 | 다이내믹한 풍속 변화 / 강한 돌풍 | 여름철 냉각, 게임 몰입 |
| **5** | **`PLAINS`** | 대평원 바람 | 넓은 풍속 범위 / 빠른 실내 환기 | 운동 후 냉각, 강한 환기 |
| **6** | **`HARBOR_BREEZE`** | 항구 바람 | 중간 강도의 습윤·연속 기류 | 작업실, 감성 카페 |
| **7** | **`FOREST_CANOPY`** | 숲속 쉼표 바람 | 극저풍속 / 잔잔한 잎사귀 흔들림 | 야간 수면, 명상, 힐링 |
| **8** | **`URBAN_SUNSET`** | 도시 일몰 바람 | 점진적 감속 / 차분한 대류 | 저녁 정리, 휴식 |
| **9** | **`TROPICAL_RAIN`** | 열대 소나기 바람 | 예측 불가능한 돌풍 / 불규칙 난류 | 레이싱 콕핏, 게이밍 |
| **10**| **`DESERT_NIGHT`** | 사막의 밤 바람 | 건조하고 고요한 지속 산들바람 | 심야 작업, 깊은 집중 |

> 💡 프리셋별 기저 풍속, 난류 강도, 돌풍 주기 등 물리 파라미터 상세표는 [사용자 매뉴얼 §5](src/v0203/User_Manual_0203/UserManual_0203_002.md#5-자연풍-물리-시뮬레이션-바람-사전-winddict)를 참조하십시오.

---

## 🎨 5종 바람 스타일 (Wind Styles)

10종 프리셋에 아래 5종 스타일 중 하나를 조합하여 총 50가지 기류 특성을 제공합니다. 대시보드 상단의 38px 터치 탭으로 즉시 전환됩니다.

| 스타일 코드 | 한글 명칭 | 배수 (Intensity / Variability / Gust) | 특성 |
|:---:|:---|:---:|:---|
| **`BALANCE`** | 균형 | 1.0 / 1.0 / 1.0 | 프리셋 고유 물리 파라미터 그대로 |
| **`ACTIVE`** | 활동 | 1.25 / 1.2 / 1.3 | 강한 냉감, 역동적 돌풍 |
| **`FOCUS`** | 집중 | 1.05 / 0.8 / 0.85 | 변동폭·소음 억제, 독서·업무용 |
| **`RELAX`** | 휴식 | 0.8 / 0.85 / 0.7 | 부드럽고 잔잔한 휴식 기류 |
| **`SLEEP`** | 수면 | 0.65 / 0.6 / 0.4 | 야간 극저소음, 체온 유지 |

---

## 🎵 Session FSM & Wind Studio (v0203 신규)

### Session FSM (3-State)
- **`ACTIVE`** (재생 중) / **`PAUSED`** (일시정지) / **`COMPLETED`** (완료)
- **Smart Resume**: 일시정지 후 5분 이내 = 연속 재개 / 5~30분 = Step 유지·phase 재시작 / 30분 초과 = Step 1 리셋
- **Now Playing Bar**: 하단 플로팅 미니 플레이어. 어느 화면에서나 ⏸/▶/⏹ 제어 + 진행 Step/남은 시간 표시

### Wind Studio (8스텝 작곡기)
- 각 Step은 `PRESET`(프리셋+스타일 재생) / `FIXED`(PWM 고정) / `REST`(모터 휴지) 중 선택
- Step별 `durationMin`(1~1440분), Override(강도/변동성/돌풍 0~100% 절대값), 🎬 미리보기
- 최대 8 Step, 반복 횟수 지정 (0=무한)
- **Playlist**: 작곡한 Profile 카드 목록. 참조 중인 스케줄 개수 표시, Undo 삭제

### Schedule → Profile 참조 단일 규격 (ADR-3)
- 스케줄은 **Profile 참조(`profileId`)** 단일 규격. 개별 세그먼트 정의를 배제하고 Studio에서 작곡한 Profile을 단일 참조 실행

### UserProfile 스키마 단일화 (ADR-2)
- **`steps[]` 단일 배열 및 `repeatSegments` 단일 필드** 표준화 → 레거시 `segments[]`를 완전히 배제하여 간결하고 명확한 단일 규격 확립

---

## 🚀 빠른 시작 가이드 (Quick Start)

### 1. 전원 연결
* USB Type-C 포트에 **5V 2A 이상** 규격의 전원 어댑터를 연결합니다.
* 부팅 시 온보드 NeoPixel LED가 파란색으로 점멸한 뒤 SoftAP 모드로 진입합니다.

### 2. Wi-Fi SoftAP 접속
1. 스마트폰 또는 PC의 Wi-Fi 목록에서 **`NatureWind`** 네트워크를 선택합니다.
2. 비밀번호 **`2540`**을 입력하고 연결합니다.
3. 웹 브라우저를 열고 **`http://192.168.4.1`**로 접속합니다.
4. **4단계 온보딩** 안내에 따라 언어 선택 → Wi-Fi 안내 → 첫 바람 선택 → "지금 시작"을 진행합니다.

### 3. 가정용/사무실 Wi-Fi (STA) 연결
1. 웹 UI 상단 네비게이션에서 **[네트워크(Network)]** 메뉴로 이동합니다.
2. 실내 공유기의 Wi-Fi SSID와 비밀번호를 입력하고 **[Wi-Fi 설정 저장]**을 클릭합니다.
3. 기기가 공유기에 연결되면 할당받은 IP(예: `http://192.168.0.x`)로 접속하여 사용합니다.

> 💡 상세한 초기 설정 및 화면 가이드는 [사용자 매뉴얼 §3](src/v0203/User_Manual_0203/UserManual_0203_002.md#3-기기-연결-및-웹-대시보드-접속-indexhtml)를 참조하십시오.

---

## 🔧 하드웨어 구성 및 배선 (Hardware & Wiring)

### 1. 주요 부품 목록
* **MCU 보드**: **ESP32-S3-N16R8** (Flash 16MB, PSRAM 8MB) 권장
* **팬 (Fan)**: **Noctua NF-A12x25 5V PWM** (4핀 표준 PWM 팬)
* **센서 모듈**: DHT22 (온습도, 풀업 10kΩ 저항 필요) / HC-SR501 또는 AM312 (PIR 인체감지)
* **상태 LED**: WS2812B RGB NeoPixel (ESP32-S3 GPIO 48 온보드)

### 2. 기본 핀맵 요약 (Default GPIO Mapping)

| 기능 (Function) | ESP32-S3 GPIO | 연결 대상 (Target Pin) | 설명 |
|---|:---:|---|---|
| **팬 PWM 제어** | **GPIO 6** | 팬 4번 핀 (Blue, PWM 입력) | 25kHz 하드웨어 LEDC PWM 신호 |
| **온습도 센서 (DHT22)** | **GPIO 17** | DHT22 Data 핀 | 실내 온도/습도 측정 (3.3V 풀업 권장) |
| **인체감지 센서 (PIR)** | **GPIO 13** | PIR 센서 OUT 핀 | 인체 재실 여부 디지털 입력 |
| **상태 표시 LED** | **GPIO 48** | 온보드 WS2812B NeoPixel | 기기 FSM 상태 및 풍속 강도 표시 |
| **팬 전원 (+5V)** | **5V / VBUS** | 팬 2번 핀 (Yellow/Red, +5V) | USB 5V 전원 공급 |
| **접지 (GND)** | **GND** | 팬 1번 핀 (Black, GND) | 시스템 공통 접지 |

```text
+-------------------------------------------------------------+
|                  5V 2A USB Type-C 전원 입력                 |
|                                                             |
|   +5V ────────────┬───────────────────────────────────┐     |
|   GND ─────────┐  │                                   │     |
|                ▼  ▼                                   │     |
|       +---------------------+                         │     |
|       |   ESP32-S3 보드     |                         │     |
|       |                     |                         │     |
|       | GPIO 6 (PWM)  ──────┼────────┐                │     |
|       | GPIO 17 (DHT) ◄─────┼────┐   │                │     |
|       | GPIO 13 (PIR) ◄─────┼──┐ │   │                │     |
|       | GPIO 48 (LED)       |  │ │   │                │     |
|       | GND                 |  │ │   │                │     |
|       +---------------------+  │ │   │                │     |
|                ▲               │ │   │                │     |
|                │               │ │   │                │     |
|       +--------┴------------+  │ │   │                ▼     |
|       |  DHT22 / PIR 센서    |  │ │   │       +------------------+
|       |  - DHT Data ────────┼──┼─┘   │       | Noctua 5V PWM 팬 |
|       |  - PIR Out  ────────┼──┘     │       | Pin 1 (Black):GND|◄── GND
|       +---------------------+        │       | Pin 2 (Red):  +5V|◄── +5V
|                                      └──────►| Pin 4 (Blue): PWM|
|                                              +------------------+
+-------------------------------------------------------------+
```

> 💡 핀 번호 변경 및 상세 전기적 인터페이스는 [사용자 매뉴얼 §3](src/v0203/User_Manual_0203/UserManual_0203_002.md#3-기기-연결-및-웹-대시보드-접속-indexhtml) 및 [SPEC_0203.md §2](src/v0203/contract_doc_0203/SPEC_0203.md)를 참조하십시오.

---

## 💻 소프트웨어 빌드 및 배포 (Build & Setup)

이 프로젝트는 **VS Code**와 **PlatformIO IDE** 환경에서 완벽하게 빌드 및 플래시됩니다.

### 1. 환경 준비
* [VS Code](https://code.visualstudio.com/) 및 [PlatformIO IDE 확장](https://platformio.org/) 설치.
* 프로젝트 클론:
  ```bash
  git clone https://github.com/hosanglee-kr/SmartNatureWind_v002.git
  ```

### 2. 빌드 및 업로드 명령어
1. **펌웨어 빌드 및 업로드**:
   ```bash
   pio run -e esp32-s3-n16r8 -j 12 --target upload
   ```
2. **파일시스템(LittleFS) 웹 에셋 사전 압축 및 업로드 (최초 1회 및 웹 에셋 변경 시 필수)**:
   ```bash
   pio run -e esp32-s3-n16r8 -j 12 --target uploadfs
   ```
   > [!IMPORTANT]
   > `uploadfs` 실행 시 빌드 훅 스크립트([pio_gzip_0203.py](src/v0203/tools_0203/pio_gzip_0203.py))가 자동 동작합니다:
   > - **i18n CI Gate** (`check_i18n.py --strict`) → 미정의 키 발견 시 staging 중단
   > - **C++ Enum → `000.const.js`** 자동 동기화 (FSM 상태/Reason)
   > - **JSON → `998.offline_data_0203.js`** Mock 캐시 자동 주입
   > - **HTML/JS/CSS** 단일 번들링 및 Level 9 Gzip 압축 → `data_v0203` LittleFS
   > - 오프라인 모듈 2종(`998.offline_data_0203.js`, `998.offline_0203.js`)은 **LittleFS 배포에서 자동 제외**

3. **긴급 배포 시 (i18n 검증 스킵)**:
   ```bash
   python src/v0203/tools_0203/pio_gzip_0203.py --no-i18n-check
   # 또는 platformio.ini: custom_no_i18n_check = true
   ```

---

## 🌐 웹 대시보드 및 시스템 구조 (Web Interface & System Architecture)

### 1. 웹 브라우저 주요 진입점 (SPA Routes)
기기 IP로 접속 시 브라우저 헤더의 Gzip 지원 여부를 판별하여 초고속으로 SPA Shell을 렌더링하며, 해시 라우팅(#)을 통해 페이지 전환 지연 시간 0ms를 제공합니다.

* **메인 SPA Shell 진입점**: `/` (자동 리다이렉트 `/index.html`)
* **해시 뷰 라우팅 (18개 페이지 + 전역 바텀시트)**:
  - `#/dashboard`: 전원 제어, 상단 바람 스타일 5종 탭(38px) + 하단 4x2 프리셋 그리드(10종) + 3대 물리 슬라이더 즉시 동기화 + 수면풍(SLEEP) + **Comfort DI 추천 카드**
  - `#/chart`: WebSocket 기반 실시간 대기역학 물리 차트 (실측/예상 탭, **예상 파형 오버레이**)
  - `#/automation/studio`: **8스텝 Wind Studio 작곡기 (v0203 신규)**
  - `#/automation/playlist`: **Wind Playlist 카드 목록 (v0203 신규)**
  - `#/automation/schedule`: **Profile 참조 스케줄러 (ADR-3 단일 규격)**
  - `#/automation/timer`: 타이머 패널 (Stage 7)
  - `#/monitor`: **실시간 + 회고 모니터 (v0203 신규, 20-bar EQ + 64-event 타임라인)**
  - `#/schedule`: 요일별/시간대별 예약 규칙 관리 (모달 고정 헤더/푸터)
  - `#/profiles`: 개인 맞춤형 프로필 저장/호출 (**steps[] 단일 표준 스키마**)
  - `#/sensors`: 온습도(DHT22) 및 인체감지(PIR) 실시간 센서 모니터링
  - `#/settings`: 시스템/네트워크/보안/하드웨어 4탭 + API Key 관리
  - `#/network`: Wi-Fi SoftAP / STA 네트워크 상세 설정, NTP 서버 변경 (**즉시 TM10 반영**)
  - `#/diagnostics`: 하드웨어 및 LittleFS 진단 (**Runtime NVS 섹션 포함**)
  - `#/firmware`: OTA 펌웨어 업로드 및 업데이트
  - `#/logs`: 실시간 링버퍼 시스템 로그 뷰어
  - `#/ai`: **Gemini AI Studio (텍스트 대화, 프롬프트 빌더, 일일 사용량/비용 모니터링)**
  - `#/info`: 힙 메모리, 업타임, Wi-Fi RSSI, 센서 상태 확인
  - `#/windprofile`: 바람 프리셋 관리
  - `#/simulation`: **바람 체험실 (v0203 재설계)**
  - **전역 바텀시트 (`999b.ai-sheet.js`)**: 우측 하단 플로팅 마이크 FAB 버튼으로 언제 어디서나 호출 가능한 실시간 음성 비서 인터페이스

### 2. 반응형 레이아웃 및 데스크톱 영구 내비게이션 (ADR-9, ADR-10)
Smart Nature Wind v0203은 다양한 뷰포트 해상도에 최적화된 반응형 웹 레이아웃을 제공합니다.
* **데스크톱 영구 사이드바 2열 그리드 (`ADR-10`)**: 화면 폭 1024px 이상의 PC/태블릿 가로 모드에서는 `.snw-app`에 좌측 사이드바(220px)와 메인 본문 2열 그리드가 상시 고정되며, 햄버거 메뉴 버튼(`#btn-menu`)과 딤 오버레이를 은닉하여 대화면 탐색 편의성을 극대화합니다.
* **모바일 반응형 슬라이드 드로어**: 1024px 미만의 모바일 화면에서는 상단 햄버거 버튼 터치 시 부드러운 오프캔버스 드로어 및 딤 오버레이가 활성화되며, 메뉴 클릭 시 자동으로 닫힙니다.
* **하단 뷰포트 레이아웃 동적 스택 (`ADR-9`)**: 모바일 하단 탭 바(60px), Now Playing Bar(48px), 전역 플로팅 AI FAB(54px), 토스트 알림이 중첩되지 않도록 CSS 변수 기반 동적 스택을 적용합니다. 세션 시작 시 `body.has-nowplaying` 클래스를 통해 AI FAB/토스트가 76px에서 124px로 0.25초 부상하며, 콘텐츠 하단 패딩을 128px로 확장하여 스크롤 끝단 가림을 원천 방지합니다.

### 3. REST API & WebSocket 인터페이스 요약 (v0203)
* `GET /api/v001/state` : 전원 상태, 모드, 목표 풍속, **세션 스냅샷(`profileName`, `stepRemainSec`)**, **Runtime(NVS)**, Comfort DI
* `POST /api/v001/session/{start|pause|resume|stop}` : **Session FSM 제어 (ADR-1 위임 모델)**
  - `start` body: `{type:"PLAYLIST"|"PRESET"|"FIXED", payload:{...}, trigger:"MANUAL"|"SCHEDULE"}`
* `GET /api/v001/session/current` : 세션 스냅샷
* `GET /api/v001/comfort` : DI 및 4단계 쾌적도 + 추천 프리셋/프로필
* `GET /api/v001/monitor/timeline`, `/monitor/session-summary` : 회고 타임라인 및 세션 요약
* `POST /api/v001/simulation` : **`/control/override` 폐지 후 물리 파라미터 직접 지정 (N-3)**
  - body: `{sim:{override:{enabled,windIntensity,windVariability,gustFrequency}}}`
* `POST /api/v001/control/ack` : AutoOff 정지 이벤트 확인(ACK) 및 래치 해제
* `GET /api/v001/wifi/state` : Wi-Fi 실시간 연결 상태 및 IP 조회
* `GET /api/v001/system` : 시스템 상태(Free Heap, Wi-Fi RSSI, 센서 측정값)
* `GET /api/v001/config/*`, `POST /api/v001/config/save` : JSON 환경설정 읽기 및 영구 저장
* **Stage 8 AI & Gemini Live 실시간 음성 API 8종**:
  - `POST /api/v001/ai/gemini` : Gemini 텍스트 대화 턴 처리 및 Tool Call 연동
  - `POST /api/v001/ai/execute-action` : 자연어 12대 제어 도구 안전 검증 및 위임 실행
  - `POST /api/v001/ai/live-token` : Gemini Live 세션 인증 토큰 발급 (30분 상한 안전 차단)
  - `POST /api/v001/ai/live-func` : Live 음성 Tool Call 결과 처리 및 상태 갱신
  - `GET /api/v001/ai/live-config` : 시스템 프롬프트(30초 캐시) 및 도구 선언 JSON 제공
  - `GET /api/v001/ai/cost-status` : NVS 일일 AI 누적 비용/토큰 사용 현황
  - `POST /api/v001/ai/usage` : 프론트엔드 AI 토큰 사용량 보고 및 NVS 누적
  - `POST /api/v001/ai/cost-reset` : NVS 일일 비용 강제 리셋 (관리자)
* `/ws/state`, `/ws/chart`, `/ws/metrics`, `/ws/log`, `/ws/summary` : 실시간 5개 채널 WebSocket 스트리밍

> 💡 웹 화면별 상세 기능은 [사용자 매뉴얼 §4](src/v0203/User_Manual_0203/UserManual_0203_002.md#4-메인-대시보드-조작-가이드-dashboard), API 명세는 [SPEC_0203.md §5](src/v0203/contract_doc_0203/SPEC_0203.md)를 참조하십시오.

---

## 🌪 대기역학 물리 시뮬레이션 원리 (Physics Model)

Smart Nature Wind의 핵심은 단순 랜덤 함수 난수 생성이 아닌, **실제 대기 경계층(Atmospheric Boundary Layer)의 미기상학 이론**을 수치 해석하는 데 있습니다.

```text
+---------------------------------------------------------------------------------+
|                         대기 경계층 물리 해석 파이프라인                         |
|                                                                                 |
|  [기저 풍속] ────┬──► [난류 스펙트럼 (Turbulence)]  ──┐                         |
|                  ├──► [열기포 상승 (Thermal Bubble)] ──┼──► [합성 풍속] ──────┐ |
|                  └──► [순간 돌풍 (Gust Envelope)]   ──┘                      │ |
|                                                                              │ |
|  [하드웨어 PWM 출력] ◄── [관성 완충 필터 (Inertia Filter)] ◄─────────────────┘ |
+---------------------------------------------------------------------------------+
```

1. **난류 스펙트럼 (Turbulence Spectrum)**: 다중 주파수 사인파와 노이즈 필터를 합성하여 불규칙하면서도 부드럽게 이어지는 자연 기류를 형성합니다 (Von Kármán 12-band 근사).
2. **열기포 상승 효과 (Thermal Bubble Model)**: 지표면 열 순환으로 발생하는 간헐적 상승 기류를 모사하여 10~30초 주기로 부드럽게 솟구치는 바람을 연출합니다.
3. **돌풍 모델 (Gust Envelope)**: 점진적으로 바람이 강해졌다가 완만하게 사그라드는 비대칭 포락선 형태의 돌풍을 생성합니다.
4. **관성 완충 (Inertia Filter)**: 팬 날개 모터 및 공기 질량의 물리적 관성을 반영하여 급격한 속도 튐 없이 매끄러운 가감속을 유지합니다.
5. **Override 직접 지정 (OVR-1, v0203)**: 프리셋×스타일 계산값을 0~100% 절대값으로 직접 덮어씀 (역산 로직 배제).

> 💡 수치 연산 공식 및 프리셋별 상세 파라미터는 [사용자 매뉴얼 §5](src/v0203/User_Manual_0203/UserManual_0203_002.md#5-자연풍-물리-시뮬레이션-바람-사전-winddict)를 참조하십시오.

---

## 🧭 문제 해결 요약 (Troubleshooting Summary)

| 증상 | 원인 및 점검 사항 | 빠른 조치 방법 | 상세 가이드 |
|---|---|---|---|
| **팬이 전혀 돌지 않음** | 5V 전원 미공급 / PWM 배선 불량 / 세션 없음 | 5V·GND 배선 및 PWM GPIO(기본 GPIO 6) 점검, Dashboard에서 재생 버튼 확인 | [매뉴얼 §14](src/v0203/User_Manual_0203/UserManual_0203_002.md#14-자주-묻는-질문-faq-및-문제-해결) |
| **웹 페이지 접속 불가** | LittleFS 미업로드 또는 다른 Wi-Fi 접속 | `pio run --target uploadfs` 수행, `NatureWind` AP 연결 확인 | [매뉴얼 §14](src/v0203/User_Manual_0203/UserManual_0203_002.md#14-자주-묻는-질문-faq-및-문제-해결) |
| **팬이 최고속도로만 회전** | PWM 제어선 단선 / 최소 듀티 설정 | PWM 신호선(Blue) 점검, Start Percent Min 재설정 | [매뉴얼 §14](src/v0203/User_Manual_0203/UserManual_0203_002.md#14-자주-묻는-질문-faq-및-문제-해결) |
| **Dashboard 재생 버튼 무반응** | Session API 위임 실패 (v0203 이전 버그) | 펌웨어 v0203 이상인지 확인 (`/api/v001/version`) | [매뉴얼 §14](src/v0203/User_Manual_0203/UserManual_0203_002.md#14-자주-묻는-질문-faq-및-문제-해결) |
| **화면에 영어/한글 대신 이상한 키 값** | i18n DICT 미정의 (v0203 이전 버그) | 펌웨어 v0203 이상인지 확인, `check_i18n.py --strict` 통과 여부 | - |
| **온도/습도 센서 값 표기 안 됨** | DHT22 풀업 저항 누락 또는 핀 번호 오류 | GPIO 17 설정 확인, VCC-Data 간 10kΩ 풀업 저항 장착 | [매뉴얼 §14](src/v0203/User_Manual_0203/UserManual_0203_002.md#14-자주-묻는-질문-faq-및-문제-해결) |
| **AI 음성 마이크 인식이 안 됨** | 브라우저 마이크 권한 미허용 또는 HTTP 비보안 연결 | HTTPS 또는 localhost/IP 신뢰 허용 후 브라우저 마이크 권한 '허용' 선택 | [매뉴얼 §13](src/v0203/User_Manual_0203/UserManual_0203_002.md#13-gemini-ai-비서--live-실시간-음성-v0203-신규) |
| **AI 대화 시 401 오류 발생** | Gemini API Key 미설정 또는 잘못된 키 | `#/settings` 보안 탭 또는 AI Studio 상단에서 유효한 Gemini API Key 등록 | [매뉴얼 §13](src/v0203/User_Manual_0203/UserManual_0203_002.md#13-gemini-ai-비서--live-실시간-음성-v0203-신규) |
| **AI Live 연결 시 403 오류 (세션 거부)** | 세션 30분 상한 도달 또는 일일 비용 한도 초과 | 통화 종료 후 신규 세션 시작, 또는 AI 설정에서 일일 비용 상태 확인 및 리셋 | [매뉴얼 §13](src/v0203/User_Manual_0203/UserManual_0203_002.md#13-gemini-ai-비서--live-실시간-음성-v0203-신규) |

---

## 🔗 부품 및 참조 링크 (Links)

* **Noctua 팬 & 전용 액세서리**:
  - [Noctua NF-A12x25 5V PWM 공식 기술 사양](https://noctua.at/en/nf-a12x25-5v-pwm)
  - [Noctua NV-FS1 멀티 데스크 팬 세트](https://noctua.at/en/nv-fs1)
* **3D 프린터용 데스크 팬 거치대 STL 모델**:
  - [Printables 120mm Fan Desk Mount (방진 거치대)](https://www.printables.com/model/554226-120mm-computer-fan-desk-mount)
  - [Noctua Inspired Desk Fan Stand (녹투아 스타일 스탠드)](https://www.printables.com/model/889331-noctua-inspired-desk-fan-mount)
* **개발 플랫폼 및 라이브러리**:
  - [PlatformIO ESP32 개발 플랫폼 가이드](https://docs.platformio.org/en/latest/platforms/espressif32.html)
  - [ESPAsyncWebServer GitHub 저장소](https://github.com/me-no-dev/ESPAsyncWebServer)
  - [ArduinoJson v7 공식 기술 문서](https://arduinojson.org/)

---

*© 2025-2026 Smart Nature Wind Project. Released under Open Source Hardware & Software Guidelines.*
