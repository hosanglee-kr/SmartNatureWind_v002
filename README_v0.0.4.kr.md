![WindScape Title](https://github.com/TilmanGriesel/WindScape/blob/main/docs/title.png?raw=true)

# 🌿 Smart Nature Wind v0202 (스마트 자연풍 독립형 제어기)

[![Firmware Version](https://img.shields.io/badge/Firmware-v0202%20(FW__2.0.2)-blue.svg)](src/v0202/contract_doc_0202/SPEC_0202.md)
[![Target MCU](https://img.shields.io/badge/MCU-ESP32--S3--N16R8-orange.svg)](src/v0202/contract_doc_0202/BUDGET_0202.md)
[![PlatformIO](https://img.shields.io/badge/Framework-PlatformIO%20%7C%20C%2B%2B17-green.svg)](platformio.ini)
[![Architecture](https://img.shields.io/badge/Arch-FreeRTOS%20CBD%20v2.5--v2.8-purple.svg)](src/v0202/contract_doc_0202/CONTRACT_0202.md)

* **원작 오픈소스 프로젝트**: [WindScape by Tilman Griesel](https://github.com/TilmanGriesel/WindScape.git)
* **현재 펌웨어 사양**: **v0202 (FW_Ver_2.0.2)** (ESP32-S3 / C++17 / FreeRTOS / PlatformIO 기반 단독 실행 임베디드 어플라이언스, C++ 소스 `_0202` 접미사)

---

*단순히 일정한 세기만 내보내는 일반 DC 선풍기나 PC 팬을,  
실제 대기역학(대기 경계층 난류, 열기포, 돌풍)을 정밀 계산하여 자연의 숨결을 그대로 재현하는 스마트 독립형 제어기 프로젝트입니다.*

**Smart Nature Wind v0202**은 외부 홈오토메이션 서버(Home Assistant, ESPHome 등) 종속 없이, **ESP32-S3 기기 자체에서 완벽하게 단독 구동되는 풀스택 임베디드 웹 어플라이언스**입니다.

기기 내부 플래시 메모리(LittleFS)에 탑재된 초경량 싱글 번들 웹서버, 실시간 WebSocket 물리 차트, 10종 자연풍 대기역학 모델, 온습도(DHT22) 및 인체감지(PIR) 센서 연동 지능형 제어, 개인화 스케줄러 및 3단계 자동 꺼짐(Auto-Off) 보호 체계를 제공합니다.

---

## 📚 문서 체계 및 상세 안내 (Documentation Roadmap)

본 `README` 문서는 프로젝트의 전체 개요와 빠른 시작(Quick Start)을 안내합니다.  
각 부문별 세부 회로도, 수치 모델, 동시성 계약, 상태 전이, API 규격 및 유지보수 절차는 아래의 상세 전문 문서를 참조하십시오.

### 1. 사용자 가이드 (User Manual)
* 📖 [**Smart Nature Wind v0202 종합 사용자 매뉴얼**](src/v0202/User_Manual_0202/UserManual_0202_002.md)
  * 기기 설치, 배선, Wi-Fi(SoftAP/STA) 연결, 12대 웹 화면 조작법, 10대 프리셋 상세 해설, 대시보드 3대 슬라이더 연동, 오프라인 시뮬레이션 데모 툴바, REST API/WebSocket 규격, 고장 진단 및 유지보수 가이드 수록.

### 2. 기술 사양 및 CBD 엔지니어링 계약서 (Engineering Contracts)
* 📑 [**README_0202.md (계약 문서 세트 총괄 인덱스 v2.7)**](src/v0202/contract_doc_0202/README_0202.md)
* 📐 [**SPEC_0202.md (종합 기술 사양서 v2.9)**](src/v0202/contract_doc_0202/SPEC_0202.md) : 하드웨어 핀맵, 25kHz PWM 타이밍, REST/WebSocket 인터페이스, 0~100% 절대값 Override 물리 모델, Gzip Level 9 정적 에셋 파이프라인 (총 75 KB 번들) 및 오프라인 모듈 분리 규격.
* 🤝 [**CONTRACT_0202.md (동시성 계약서 v2.8)**](src/v0202/contract_doc_0202/CONTRACT_0202.md) : FreeRTOS 5대 태스크 구조, 우선순위, Mutex 소유권 및 데드락 방지, Batch I 물리 파라미터 직접 지정 계약(OVR-1~OVR-4), 프론트엔드-백엔드 동기화 및 오프라인 모듈 분리 계약(SYNC-1~SYNC-3).
* 🔄 [**STATE_0202.md (상태 및 7-State FSM 명세서 v2.5)**](src/v0202/contract_doc_0202/STATE_0202.md) : INIT / AP_CONFIG / STA_CONNECTING / RUNNING / SAFE_MODE / FIRMWARE_UPDATE / FACTORY_RESET 전이 표 및 모달 상태.
* 🔀 [**FLOW_0202.md (실행 흐름도 및 시퀀스 다이어그램 v2.8)**](src/v0202/contract_doc_0202/FLOW_0202.md) : 부팅 시퀀스, HTTP/WS 처리 루프, 센서 샘플링 및 물리 연산 파이프라인, WindSolver 파라미터 직접 치환(Override) 흐름, `pio_gzip_0202.py` C++ Enum/JSON 동기화 및 오프라인 어댑터 흐름.
* ⏱️ [**BUDGET_0202.md (자원 및 WCET 예산 v2.7)**](src/v0202/contract_doc_0202/BUDGET_0202.md) : SRAM/PSRAM/Flash 메모리 버짓, 태스크별 최악 실행 시간(WCET), 프론트엔드 Gzip 예산 (75 KB / 100 KB 한도 통과, RAM 33.1%, Flash 23.3%).
* 🧪 [**TEST_PLAN_0202.md (회귀 테스트 및 검증 계획서 v2.7)**](src/v0202/contract_doc_0202/TEST_PLAN_0202.md) : 단위/통합/스트레스 테스트 케이스(T-70 세그먼트 물리 Override, T-71 3대 슬라이더/SLEEP, T-72 세그먼트 순서이동/다국어) 및 29대 필수 릴리스 게이트.

### 3. 개발 환경 및 AI 에이전트 협업 가이드 (Developer & Agent Setup)
* 🤖 [**agent.md (개발 환경 및 에이전트 협업 가이드)**](agent.md)
  * ESP32-S3 PlatformIO 빌드/플래시 설정, C++ `_0202` 모듈 아키텍처, CBD v2.5~v2.8 계약 준수 및 에이전트 작업 원칙 안내.

---

## 📋 목차 (Table of Contents)

1. [핵심 기능 (Key Features)](#-핵심-기능-key-features)
2. [작동 모드 (Operating Modes)](#-작동-모드-operating-modes)
3. [10종 자연풍 환경 프리셋 (Nature Presets)](#-10종-자연풍-환경-프리셋-nature-presets)
4. [빠른 시작 가이드 (Quick Start)](#-빠른-시작-가이드-quick-start)
5. [하드웨어 구성 및 배선 (Hardware & Wiring)](#-하드웨어-구성-및-배선-hardware--wiring)
6. [소프트웨어 빌드 및 배포 (Build & Setup)](#-소프트웨어-빌드-및-배포-build--setup)
7. [웹 대시보드 및 시스템 구조 (Web Interface & System Architecture)](#-웹-대시보드-및-시스템-구조-web-interface--system-architecture)
8. [대기역학 물리 시뮬레이션 원리 (Physics Model)](#-대기역학-물리-시뮬레이션-원리-physics-model)
9. [문제 해결 요약 (Troubleshooting Summary)](#-문제-해결-요약-troubleshooting-summary)
10. [부품 및 참조 링크 (Links)](#-부품-및-참조-링크-links)

---

## 🌬 핵심 기능 (Key Features)

* **독립 실행형 풀스택 아키텍처 (Standalone Architecture)**  
  외부 서버나 Home Assistant 허브 없이, ESP32-S3 단독으로 비동기 웹서버, RESTful API, 고성능 WebSocket 브로커를 구동합니다.
* **대기역학 기반 실시간 물리 시뮬레이션 (Realistic Wind Physics)**  
  미기상학 대기 경계층 이론을 적용하여 난류 스펙트럼(Turbulence), 열기포 상승(Thermal Bubble), 돌풍(Gust), 하드웨어 관성 필터(Inertia Filter)를 실시간 수치 연산합니다.
* **10종 자연 환경 프리셋 (10 Nature-Inspired Presets)**  
  시골 산들바람부터 알프스 산맥의 돌풍, 밤 사막의 정적까지 공간과 분위기에 맞춘 10종 고유 프로파일 기본 탑재.
* **초경량 싱글 번들 Web UI 대시보드 (Gzip Level 9 사전 압축, 총 75 KB)**  
  웹 에셋(35개 JS 모듈, 10개 CSS)을 단일 번들(`P010_bundle_0202.js`, `P000_common_0202.css`, `index.html`)로 패키징하고 플래시 빌드 시 사전 Gzip 압축(Level 9)하여 총 75 KB(100 KB 버짓 대비 75.0%)의 초경량 용량을 달성했습니다. 대시보드 상단 5종 바람 스타일 탭(38px 터치 최적화) + 하단 8종 자연풍 프리셋(4x2 대칭 그리드 및 이모지 아이콘), 프리셋/스타일 선택 시 3대 물리 파라미터(풍속 세기/변동성/돌풍) 슬라이더 즉시 동기화, 수면풍(SLEEP) 전용 모드 토글, 정량적 체감 피드백 가이드(m/s 등), 완전 한/영(ko/en) 다국어 지원, 모바일 반응형 2열 세그먼트 카드 그리드, 세그먼트 순서 이동(▲/▼), 고정 헤더/푸터 스크롤 모달(닫힘 시 오버레이 완전 비활성화 격리), 세그먼트 삭제 즉시 복원(Undo Toast), 오프라인 2분할 어댑터(`998.offline_data_0202.js` 캐시 데이터 + `998.offline_0202.js` 시뮬레이터/인터셉터) 및 모바일 최적화 접이식 데모 툴바를 탑재하여 브라우저 로딩 속도 <200ms와 부드러운 반응성을 보장합니다.
* **지능형 센서 연동 (Sensor Integration)**  
  - **온습도 센서 (DHT22)**: 실내 온도/습도 추세에 따른 풍속 지능형 자동 제어.
  - **인체감지 센서 (PIR)**: 사람의 재실 여부를 감지하여 부재 시 자동 절전/정지.
  - **RGB NeoPixel LED (WS2812B)**: 7대 FSM 기기 상태 및 실시간 풍속을 색상과 밝기로 시각화.
* **정밀 25kHz 하드웨어 PWM 제어**  
  PC 4핀 팬 표준 주파수(25kHz, 10-bit 분해능)를 준수하여 모터 고주파 가청 소음 없이 극저속(5%)부터 최고속(100%)까지 정밀 제어.
* **강력한 안전성 및 3단계 Auto-Off 보호 체계**  
  일반 타이머(Normal), 수면 모드(Sleep), 자동 꺼짐(Off) 3-way 안전 타이머와 센서 고장 시 안전 모드(Safe Mode) 전환 지원.

---

## ⚙ 작동 모드 (Operating Modes)

기기는 다음 4가지 핵심 모드로 동작하며, 세부 파라미터는 웹 UI 및 REST API를 통해 실시간 변경됩니다.

| 모드 | 영문명 | 설명 | 상세 참조 |
|---|---|---|---|
| **자연풍 모드** | Natural Wind | 난류, 열기포, 돌풍 알고리즘이 결합되어 실시간으로 변화하는 자연스러운 기류를 생성합니다. | [매뉴얼 §6.1](src/v0202/User_Manual_0202/UserManual_0202_002.md#61-인체-감지pir-스마트-절전-운전) |
| **정속 모드** | Constant | 사용자가 지정한 고정 세기(0~100%)로 일정하게 팬을 구동합니다. | [매뉴얼 §4](src/v0202/User_Manual_0202/UserManual_0202_002.md#4-메인-대시보드-조작-가이드-dashboard) |
| **온도 감응 모드** | Temp-Auto | DHT22 센서의 실내 온도를 바탕으로 풍속을 지능적으로 자동 조정합니다. | [매뉴얼 §6.2](src/v0202/User_Manual_0202/UserManual_0202_002.md#62-3대-스마트-자동-종료-autooff) |
| **스케줄 모드** | Schedule | 요일 및 시간대별로 지정된 프리셋과 풍속 규칙에 따라 자동으로 동작합니다. | [매뉴얼 §7](src/v0202/User_Manual_0202/UserManual_0202_002.md#7-주간-스케줄러-설정-schedule) |

> 💡 상태 전이 규칙과 Fail-Safe 조건은 [STATE_0202.md](src/v0202/contract_doc_0202/STATE_0202.md) 문서를 참조하십시오.

---

## 🗺️ 10종 자연풍 환경 프리셋 (Nature Presets)

공간의 분위기와 개인의 활동 목적에 맞춘 10종의 환경 프리셋을 원클릭으로 선택할 수 있습니다.

| 번호 | 프리셋명 (영문) | 특성 요약 | 추천 용도 |
|:---:|:---|:---|:---|
| **1** | **시골 바람 (Countryside)** | 저풍속 / 미세 난류 / 완만한 변화의 쉼 | 휴식, 독서, 수면 보조 |
| **2** | **지중해성 바람 (Mediterranean)** | 온화한 풍속 / 부드러운 순환 대류 | 일상 사무, 거실 환기 |
| **3** | **해변 바람 (Ocean/Beach)** | 중간 풍속 / 높은 난류 / 주기적 파도형 돌풍 | 상쾌한 기분 전환, 집중 |
| **4** | **산 바람 (Mountains)** | 다이내믹한 풍속 변화 / 순간적 강한 돌풍 | 여름철 냉각, 게임 몰입 |
| **5** | **대평원 바람 (Plains)** | 넓은 풍속 범위 / 광활하고 시원한 바람 | 빠른 실내 환기, 운동 후 냉각 |
| **6** | **항구 바람 (Port/Harbor)** | 중간 강도의 습윤하고 연속적인 기류 | 작업실, 감성 카페 |
| **7** | **숲 그늘 바람 (Forest Shade)** | 극저풍속 / 잔잔한 잎사귀 흔들림 모사 | 야간 수면, 명상, 힐링 |
| **8** | **도시 석양 바람 (Sunset)** | 점진적 감속 / 차분한 대류 흐름 | 저녁 정리 시간, 휴식 |
| **9** | **열대 소나기 바람 (Tropical Rain)** | 예측 불가능한 역동적 난류 / 불규칙 돌풍 | 레이싱 콕핏, 게이밍 |
| **10**| **사막의 밤 바람 (Desert Night)** | 건조하고 고요한 지속 산들바람 | 심야 작업, 깊은 집중 |

> 💡 프리셋별 기저 풍속, 난류 강도, 돌풍 주기 등 물리 파라미터 상세표는 [사용자 매뉴얼 §5](src/v0202/User_Manual_0202/UserManual_0202_002.md#5-자연풍-물리-시뮬레이션-바람-사전-winddict)를 참조하십시오.

---

## 🚀 빠른 시작 가이드 (Quick Start)

### 1. 전원 연결
* USB Type-C 포트에 **5V 2A 이상** 규격의 전원 어댑터를 연결합니다.
* 부팅 시 온보드 NeoPixel LED가 파란색으로 점멸한 뒤 SoftAP 모드로 진입합니다.

### 2. Wi-Fi SoftAP 접속
1. 스마트폰 또는 PC의 Wi-Fi 목록에서 **`NatureWind`** 네트워크를 선택합니다.
2. 비밀번호 **`2540`**을 입력하고 연결합니다.
3. 웹 브라우저를 열고 **`http://192.168.4.1`**로 접속합니다.

### 3. 가정용/사무실 Wi-Fi (STA) 연결
1. 웹 UI 상단 네비게이션에서 **[설정(Settings)]** 메뉴로 이동합니다.
2. 실내 공유기의 Wi-Fi SSID와 비밀번호를 입력하고 **[저장 및 재부팅]**을 클릭합니다.
3. 기기가 공유기에 연결되면 할당받은 IP(예: `http://192.168.0.x`)로 접속하여 사용합니다.

> 💡 상세한 초기 설정 및 화면 가이드는 [사용자 매뉴얼 §3](src/v0202/User_Manual_0202/UserManual_0202_002.md#3-기기-연결-및-웹-대시보드-접속-indexhtml)를 참조하십시오.

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

```
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

> 💡 핀 번호 변경 및 상세 전기적 인터페이스는 [사용자 매뉴얼 §3](src/v0202/User_Manual_0202/UserManual_0202_002.md#3-기기-연결-및-웹-대시보드-접속-indexhtml) 및 [SPEC_0202.md §2](src/v0202/contract_doc_0202/SPEC_0202.md)를 참조하십시오.

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
   pio run --target upload
   ```
2. **파일시스템(LittleFS) 웹 에셋 사전 압축 및 업로드 (최초 1회 및 웹 에셋 변경 시 필수)**:
   ```bash
   pio run --target uploadfs
   ```
   > [!IMPORTANT]
   > `uploadfs` 실행 시 빌드 훅 스크립트([pio_gzip_0202.py](src/v0202/tools_0202/pio_gzip_0202.py))가 자동 동작하여 C++ Enum(`000.const.js`) 및 JSON Mock(`998.offline_data_0202.js`)을 자동 동기화한 뒤, HTML/JS/CSS 자원을 단일 번들링 및 Level 9 Gzip으로 압축하여 `data_v0202` LittleFS 영역에 플래시합니다. (오프라인 모듈 2종은 LittleFS 배포에서 자동 제외됨)

---

## 🌐 웹 대시보드 및 시스템 구조 (Web Interface & System Architecture)

### 1. 웹 브라우저 주요 진입점 (SPA Routes)
기기 IP로 접속 시 브라우저 헤더의 Gzip 지원 여부를 판별하여 초고속으로 SPA Shell을 렌더링하며, 해시 라우팅(#)을 통해 페이지 전환 지연 시간 0ms를 제공합니다.

* **메인 SPA Shell 진입점**: `/` (자동 리다이렉트 `/index.html`)
* **해시 뷰 라우팅 (Hash Views - 12개 페이지)**:
  - `#/dashboard`: 전원 제어, 상단 바람 스타일 5종 탭(38px 터치 타겟) + 하단 8종 자연풍 프리셋(4x2 대칭 그리드 및 이모지), 프리셋/스타일 선택 시 3대 물리 슬라이더(강도/변동성/돌풍) 즉시 동기화, 수면풍(SLEEP) 전용 모드
  - `#/chart`: WebSocket 기반 실시간 대기역학 물리 곡선 차트 (오프라인 가상 브로드캐스트 지원)
  - `#/schedule`: 요일별/시간대별 예약 규칙 관리 (고정 헤더/푸터 모달, 모달 닫힘 시 오버레이 완전 비활성화 격리, 세그먼트 순서 이동 및 Override 지원)
  - `#/profiles`: 개인 맞춤형 풍속/모드 프로필 저장 및 호출 (세그먼트 순서 이동 및 Override 지원)
  - `#/sensors`: 온습도(DHT22) 및 인체감지(PIR) 실시간 센서 모니터링
  - `#/info`: 힙 메모리, 업타임, Wi-Fi RSSI, 센서 상태 확인
  - `#/settings`: Wi-Fi, GPIO 핀맵, PWM 타이밍 설정
  - `#/network`: Wi-Fi SoftAP / STA 네트워크 상세 설정
  - `#/diagnostics`: 하드웨어 및 LittleFS 진단
  - `#/firmware`: OTA 펌웨어 업로드 및 업데이트
  - `#/logs`: 실시간 링버퍼 시스템 로그 뷰어
  - `#/ai`: Gemini AI 대화형 비서 연동

### 2. REST API & WebSocket 인터페이스 요약
* `GET /api/v001/state`, `POST /api/v001/state` : 전원 상태, 모드, 목표 풍속 조회 및 제어
* `POST /api/v001/control/override` : [Batch I] 실시간 물리 파라미터(풍속 세기, 변동성, 돌풍 빈도) 절대값 직접 지정
* `POST /api/v001/control/ack` : AutoOff 정지 이벤트 확인(ACK) 및 래치 해제
* `GET /api/v001/wifi/state` : Wi-Fi 실시간 연결 상태 및 IP 조회
* `GET /api/v001/system` : 시스템 상태(Free Heap, Wi-Fi RSSI, 센서 측정값) 조회
* `GET /api/v001/config/*`, `POST /api/v001/config/save` : JSON 환경설정 읽기 및 영구 저장
* `POST /api/v001/ai/gemini` : Gemini AI 프록시 통신
* `/ws/state`, `/ws/chart`, `/ws/metrics`, `/ws/log`, `/ws/summary` : 실시간 5개 채널 WebSocket 스트리밍

> 💡 웹 화면별 상세 기능은 [사용자 매뉴얼 §4](src/v0202/User_Manual_0202/UserManual_0202_002.md#4-메인-대시보드-조작-가이드-dashboard), API 명세는 [SPEC_0202.md §4](src/v0202/contract_doc_0202/SPEC_0202.md)를 참조하십시오.

---

## 🌪 대기역학 물리 시뮬레이션 원리 (Physics Model)

Smart Nature Wind의 핵심은 단순 랜덤 함수 난수 생성이 아닌, **실제 대기 경계층(Atmospheric Boundary Layer)의 미기상학 이론**을 수치 해석하는 데 있습니다.

```
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

1. **난류 스펙트럼 (Turbulence Spectrum)**: 다중 주파수 사인파와 노이즈 필터를 합성하여 불규칙하면서도 부드럽게 이어지는 자연 기류를 형성합니다.
2. **열기포 상승 효과 (Thermal Bubble Model)**: 지표면 열 순환으로 발생하는 간헐적 상승 기류를 모사하여 10~30초 주기로 부드럽게 솟구치는 바람을 연출합니다.
3. **돌풍 모델 (Gust Envelope)**: 점진적으로 바람이 강해졌다가 완만하게 사그라드는 비대칭 포락선 형태의 돌풍을 생성합니다.
4. **관성 완충 (Inertia Filter)**: 팬 날개 모터 및 공기 질량의 물리적 관성을 반영하여 급격한 속도 튐 없이 매끄러운 가감속을 유지합니다.

> 💡 수치 연산 공식 및 프리셋별 상세 파라미터는 [사용자 매뉴얼 §7](src/v0202/User_Manual_0202/UserManual_0202_001.md#7-10종-자연풍-환경-프리셋-상세-해설)을 참조하십시오.

---

## 🧭 문제 해결 요약 (Troubleshooting Summary)

| 증상 | 원인 및 점검 사항 | 빠른 조치 방법 | 상세 가이드 |
|---|---|---|---|
| **팬이 전혀 돌지 않음** | 5V 전원 미공급 또는 PWM 핀 배선 불량 | 5V/GND 배선 및 설정 화면의 PWM GPIO(기본 GPIO 6) 점검 | [매뉴얼 §12.1](src/v0202/User_Manual_0202/UserManual_0202_001.md#121-자주-묻는-질문-faq) |
| **웹 페이지 접속 불가** | LittleFS 파일 미업로드 또는 다른 Wi-Fi 접속 | `pio run --target uploadfs` 수행 및 `NatureWind` AP 연결 확인 | [매뉴얼 §12.2](src/v0202/User_Manual_0202/UserManual_0202_001.md#122-증상별-자가-진단-가이드) |
| **팬이 최고속도로만 회전** | PWM 제어선 단선 또는 모터 최소 듀티 설정 | PWM 신호선(Blue) 결선 점검 및 최저 구동 속도 재설정 | [매뉴얼 §12.2](src/v0202/User_Manual_0202/UserManual_0202_001.md#122-증상별-자가-진단-가이드) |
| **풍속 변화가 느껴지지 않음** | 현재 모드가 '정속(Constant)' 상태임 | 메인 화면에서 '자연풍(Natural Wind)' 모드로 변경 | [매뉴얼 §4](src/v0202/User_Manual_0202/UserManual_0202_001.md#4-메인-대시보드-조작-가이드--) |
| **온도/습도 센서 값 표기 안 됨** | DHT22 풀업 저항 누락 또는 핀 번호 오류 | GPIO 17 설정 확인 및 VCC-Data 간 10kΩ 풀업 저항 장착 | [매뉴얼 §12.2](src/v0202/User_Manual_0202/UserManual_0202_001.md#122-증상별-자가-진단-가이드) |

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
