![WindScape Title](https://github.com/TilmanGriesel/WindScape/blob/main/docs/title.png?raw=true)

# 🌿 Smart Nature Wind 단독 실행 버전 (Standalone Firmware)

* **기반 오픈소스 프로젝트 (WindScape)**: [https://github.com/TilmanGriesel/WindScape.git](https://github.com/TilmanGriesel/WindScape.git)
* **현재 펌웨어 버전**: **v017** (ESP32-S3 / C++17 / PlatformIO 기반 Standalone)

---

*단순히 일정한 세기의 바람만 내보내던 DC 선풍기나 PC 팬을,  
자연 그대로의 바람처럼 살아있는 공기로 바꿔주는 스마트 독립형 제어기 프로젝트입니다.*

**Smart Nature Wind Standalone**은 외부 홈오토메이션 허브(ESPHome/Home Assistant 등) 종속 없이,  
**ESP32 기기 자체에서 독립적으로 실행되는 풀스택 자연풍 시뮬레이터**입니다.  
기기 자체에 내장된 고성능 비동기 웹서버, 실시간 WebSocket 차트, 10가지 자연풍 물리 모델, 온습도(DHT22) 및 인체감지(PIR) 센서 연동, 개인화 스케줄러를 제공합니다.

사무실, 스터디 카페, 침실, 책상 어디서든  
자연스럽고 몰입감 있는 산들바람의 숨결을 경험할 수 있습니다.

![noctua_nv_fs1_1](https://noctua.at/pub/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/n/o/noctua_nv_fs1_5.jpg)

---

## 📋 목차 (Table of Contents)

1. [핵심 기능 (Key Features)](#-핵심-기능-key-features)  
2. [작동 모드 (Operating Modes)](#-작동-모드-operating-modes)  
3. [10종 자연풍 환경 프리셋 (Nature Presets)](#-10종-자연풍-환경-프리셋-nature-presets)  
4. [데모 및 UI (Demo & Web Interface)](#-데모-및-ui-demo--web-interface)  
5. [하드웨어 구성 및 배선 (Hardware & Wiring)](#-하드웨어-구성-및-배선-hardware--wiring)  
6. [소프트웨어 빌드 및 배포 (Build & Setup)](#-소프트웨어-빌드-및-배포-build--setup)  
7. [웹 인터페이스 및 API (Web & REST API)](#-웹-인터페이스-및-api-web--rest-api)  
8. [문제 해결 (Troubleshooting)](#-문제-해결-troubleshooting)  
9. [자연풍 물리 시뮬레이션 원리 (Physics Model)](#-자연풍-물리-시뮬레이션-원리-physics-model)  
10. [부품 및 참조 링크 (Links)](#-부품-및-참조-링크-links)

---

## 🌬 핵심 기능 (Key Features)

* **독립 실행형 풀스택 아키텍처 (Standalone Architecture)**  
  외부 서버나 Home Assistant 없이 ESP32 단독으로 비동기 웹 서버, REST API, WebSocket 브로커를 구동합니다.
* **실시간 대기역학 물리 시뮬레이션 (Realistic Wind Physics)**  
  난류 스펙트럼(Turbulence), 열기포 상승(Thermal Bubble), 순간 돌풍(Gust), 물리적 관성 완충을 실시간 수치 해석하여 인위적이지 않은 자연의 숨결을 재현합니다.
* **10가지 자연 환경 프리셋 (10 Nature-Inspired Presets)**  
  시골 산들바람부터 알프스 산맥의 돌풍, 밤 사막의 정적까지 감성과 기능에 맞춘 10종 프로파일 기본 탑재.
* **내장 반응형 Web UI 대시보드**  
  스마트폰, 태블릿, PC 브라우저 어디서나 별도 앱 설치 없이 접속하여 실시간 풍속 차트, 팬 제어, 센서 모니터링, 스케줄 관리가 가능합니다.
* **다양한 센서 및 주변기기 연동 (Sensor Integration)**  
  - **온습도 센서 (DHT22)**: 실내 온도/습도에 따른 자동 풍속 조절
  - **인체감지 센서 (PIR)**: 사람의 재실 여부를 감지해 부재 시 자동 절전/외출 모드
  - **RGB NeoPixel LED (WS2812B)**: 동작 상태 및 풍속 강도를 직관적으로 시각화
* **정밀 하드웨어 PWM 팬 제어 (25kHz PWM)**  
  PC 4핀 팬 표준 주파수(25kHz, 10-bit)를 준수하여 모터 고주파 노이즈 없이 부드럽고 정밀한 속도 제어를 지원합니다.
* **스케줄러 & 사용자 프로필 (Scheduler & Profiles)**  
  요일별/시간대별 예약 작동, 집중/수면/휴식 프로필, 쾌적 풍속 범위 설정 지원.
* **LittleFS 기반 안전한 설정 및 웹 파일시스템 관리**  
  웹 리소스와 사용자 설정(JSON)을 분리 저장하여 재부팅 후에도 설정 유지 및 웹을 통한 손쉬운 갱신.

---

## ⚙ 작동 모드 (Operating Modes)

| 모드 | 영문명 | 설명 |
|------|--------|------|
| **자연풍 모드** | Natural Wind (Simul) | 난류, 열기포, 돌풍 알고리즘이 결합되어 실시간으로 변화하는 자연스러운 바람을 생성합니다. |
| **정속 모드** | Constant | 사용자가 지정한 일정 세기(0~100%)의 바람을 유지합니다. |
| **온도 감응 모드** | Temp-Auto | 연결된 DHT22 센서의 실내 온도를 바탕으로 풍속을 지능적으로 자동 조정합니다. |
| **스케줄 모드** | Schedule | 시간대별, 요일별로 지정된 프리셋과 작동 규칙에 맞춰 자동으로 동작합니다. |

> 💡 **전원 버튼(Master Power)**을 끄면 모터가 부드럽게 감속 정지하며 대기 모드로 전환됩니다.

---

## 🗺️ 10종 자연풍 환경 프리셋 (Nature Presets)

자연의 기류를 테마별로 정밀 튜닝한 **10종 환경 프리셋**으로 공간에 맞는 분위기를 연출할 수 있습니다.

| 번호 | 프리셋명 | 슬로건 | 풍속/난류 특성 | 추천 용도 |
|:---:|:---|:---|:---|:---|
| **1** | **시골 바람 (Countryside)** | “고요한 평화, 쉼을 들이켜다.” | 저풍속 / 미세 난류 / 완만한 변화 | 휴식, 독서, 수면 보조 |
| **2** | **지중해성 바람 (Mediterranean)** | “햇살 아래 쾌적함, 이탈리아의 오후.” | 온화한 풍속 / 부드러운 순환 기류 | 일상 사무, 거실 환기 |
| **3** | **해변 바람 (Ocean/Beach)** | “거침없는 시원함, 대양의 숨결.” | 중간 풍속 / 높은 난류 / 주기적 파도형 돌풍 | 상쾌한 기분 전환, 집중 |
| **4** | **산 바람 (Mountains)** | “정상을 향한 도전, 짜릿한 상쾌함.” | 날카로운 풍속 변화 / 순간적 강한 돌풍 | 여름철 냉각, 게임 몰입 |
| **5** | **대평원 바람 (Plains)** | “가슴이 뻥 뚫리는, 야성의 해방감.” | 넓은 풍속 범위 / 광활하고 시원한 바람 | 빠른 실내 환기, 운동 후 냉각 |
| **6** | **항구 바람 (Port/Harbor)** | “도시의 열기 속, 바다의 여운.” | 중간 강도의 습윤한 기류 모사 | 감성 카페, 작업실 |
| **7** | **숲 그늘 바람 (Forest Shade)** | “나뭇잎 사이로, 깊은 쉼의 기류.” | 극저풍속 / 잔잔한 잎사귀 흔들림 모사 | 야간 수면, 명상, 힐링 |
| **8** | **도시 석양 바람 (Sunset)** | “석양처럼 차분하게, 오늘을 마무리.” | 점진적 감속 / 차분한 대류 흐름 | 저녁 정리 시간, 휴식 |
| **9** | **열대 소나기 바람 (Tropical Rain)**| “예측 불가능한 생동감, 폭풍우의 전율.” | 드라마틱한 난류 / 불규칙 돌풍 | 레이싱 콕핏, 게이밍 |
| **10**| **사막의 밤 바람 (Desert Night)** | “별빛 아래 정적, 고독한 몰입.” | 건조하고 고요한 지속 산들바람 | 심야 작업, 깊은 집중 |

---

## 🎬 데모 및 UI (Demo & Web Interface)

기기 접속 시 제공되는 내장 웹 인터페이스를 통해 실시간 모니터링 및 세부 파라미터 조작이 가능합니다.

![WindScape configuration](https://github.com/TilmanGriesel/WindScape/blob/main/docs/windscape_demo_01.gif?raw=true)  
![WindScape dashboard](https://github.com/TilmanGriesel/WindScape/blob/main/docs/windscape_demo_02.gif?raw=true)  
![External sensor example](https://github.com/TilmanGriesel/WindScape/blob/main/docs/ha_iracing_01.png?raw=true)  
![Breezer9000](https://raw.githubusercontent.com/TilmanGriesel/WindScape/843b6eca3a42019fdb35a68ddca5e0dcae5bd2b5/docs/title.png?raw=true)

---

## 🔧 하드웨어 구성 및 배선 (Hardware & Wiring)

### 1. 권장 부품 목록

| 구성품 | 권장 모델 및 사양 | 비고 |
|---|---|---|
| **MCU 보드** | **ESP32-S3-N16R8** (16MB Flash, 8MB PSRAM) 또는 ESP32-S3 Zero | 일반 ESP32 DevKit V1도 지원 |
| **쿨링 팬** | **Noctua NF-A12x25 5V PWM** (4핀) | 12V 팬 사용 시 12V 전원 및 공통 GND 구성 |
| **온습도 센서** | DHT22 (AM2302) 센서 모듈 | 실시간 온도 감응 자동 제어용 |
| **인체감지 센서** | HC-SR501 또는 AM312 PIR 센서 모듈 | 재실 감지 자동 ON/OFF용 |
| **상태 LED** | WS2812B RGB NeoPixel (ESP32-S3 내장 또는 외장) | 기기 상태 및 풍속 시각화 |
| **전원 공급** | 5V 2A 이상 USB Type-C 어댑터 | 팬 및 보드 전원 공급 |

---

### 2. 표준 핀맵 (v017 기본값)

> 💡 핀 번호는 웹 설정 화면(`설정` 메뉴) 또는 `cfg_system_070.json`에서 자유롭게 변경 가능합니다.

| 기능 | ESP32-S3 핀 | 연결 대상 (Fan / Sensor) | 설명 |
|---|:---:|---|---|
| **팬 PWM 출력** | **GPIO 6** | 팬 4번 핀 (Blue, PWM 입력) | 25kHz 하드웨어 LEDC PWM 제어 신호 |
| **팬 전원 (+5V)** | **5V / VBUS**| 팬 2번 핀 (Yellow/Red, +5V) | USB 5V 전원 직결 |
| **팬 접지 (GND)** | **GND** | 팬 1번 핀 (Black, GND) | 공통 접지 |
| **온습도 센서 (DHT22)**| **GPIO 17** | DHT22 Data 핀 (10kΩ 풀업 권장) | 온도 및 습도 데이터 수신 |
| **인체감지 센서 (PIR)** | **GPIO 13** | PIR 센서 OUT 핀 | 인체 움직임 디지털 신호 |
| **RGB LED** | **GPIO 48** | 온보드 WS2812B NeoPixel | 부팅, Wi-Fi 연결, 바람 상태 표시 |

#### 🧩 5V PWM 팬 배선도 (ASCII Diagram)

```
+-----------------------------------------------------------+
|                   5V USB Type-C 전원입력                   |
|                                                           |
|   +5V ────────────┬──────────────────────────────────┐    |
|   GND ─────────┐  │                                  │    |
|                ▼  ▼                                  │    |
|       +---------------------+                        │    |
|       |   ESP32-S3 보드     |                        │    |
|       |                     |                        │    |
|       | GPIO 6 (PWM)  ──────┼────────┐               │    |
|       | GPIO 17 (DHT) ◄─────┼────┐   │               │    |
|       | GPIO 13 (PIR) ◄─────┼──┐ │   │               │    |
|       | GND                 |  │ │   │               │    |
|       +---------------------+  │ │   │               │    |
|                ▲               │ │   │               │    |
|                │               │ │   │               │    |
|       +--------┴------------+  │ │   │               ▼    |
|       |  DHT22 / PIR 센서    |  │ │   │      +------------------+
|       |  - DHT Data ────────┼──┼─┘   │      | Noctua 5V PWM 팬 |
|       |  - PIR Out  ────────┼──┘     │      | Pin 1 (Black):GND|◄── GND
|       +---------------------+        │      | Pin 2 (Red):  +5V|◄── +5V
|                                      └─────►| Pin 4 (Blue): PWM|
|                                             +------------------+
+-----------------------------------------------------------+
```

---

## 💻 소프트웨어 빌드 및 배포 (Build & Setup)

이 프로젝트는 **PlatformIO**를 사용하여 원클릭으로 빌드 및 업로드할 수 있습니다.

### 1. 사전 준비
- [VS Code](https://code.visualstudio.com/) 설치
- VS Code 확장에서 **PlatformIO IDE** 설치
- 저장소 클론:
  ```bash
  git clone https://github.com/hosanglee-kr/SmartNatureWind_v002.git
  ```

### 2. 컴파일 및 펌웨어 업로드
1. VS Code에서 프로젝트 폴더를 엽니다.
2. 좌측 PlatformIO 탭에서 타깃 환경(`esp32-s3-n16r8` 또는 보드에 맞는 환경)을 선택합니다.
3. **Firmware 빌드 & 업로드**:
   ```bash
   pio run --target upload
   ```
4. **파일시스템(LittleFS) 웹 리소스 업로드 (최초 1회 필수)**:
   ```bash
   pio run --target uploadfs
   ```
   > [!IMPORTANT]
   > `uploadfs`를 실행해야 웹 대시보드(HTML/JS/CSS)와 기본 설정 JSON 파일이 플래시에 기록되어 정상 동작합니다.

### 3. 최초 접속 및 Wi-Fi 설정
1. 기기 부팅 시 저장된 Wi-Fi가 없으면 자체 SoftAP(`SmartNatureWind-AP`)가 실행됩니다.
2. 스마트폰이나 PC로 해당 Wi-Fi에 연결한 후 웹 브라우저에서 `http://192.168.4.1`로 접속합니다.
3. 웹 화면에서 공유기 Wi-Fi SSID와 암호를 입력하면 기기가 공유기에 연결되고 할당받은 IP로 서비스가 시작됩니다.

---

## 🌐 웹 인터페이스 및 API (Web & REST API)

### 1. 웹 브라우저 진입점
- 메인 대시보드: `http://<ESP32-IP>/` (자동 리다이렉트: `/P010_main_071.html`)
- 실시간 차트 뷰: `http://<ESP32-IP>/P050_chart_t2_071.html`
- 스케줄러 설정: `http://<ESP32-IP>/P080_sch_t2_071.html`
- 시스템 설정: `http://<ESP32-IP>/P100_settings_071.html`

### 2. REST API 요약 (`/api/v001/*`)
- `GET /api/v001/version` : 펌웨어 버전, 빌드 일시, 활성 모듈 정보
- `GET /api/v001/state` : 현재 팬 속도, 풍속, 선택된 모드 및 프리셋 조회
- `POST /api/v001/state` : 팬 ON/OFF, 모드 변경, 풍속 조절
- `GET /api/v001/system` : 힙 메모리, 업타임, Wi-Fi RSSI, 센서 측정값
- `GET /api/v001/config/*` : 시스템/바람/스케줄 JSON 환경설정 조회 및 갱신

### 3. 실시간 WebSocket 스트림 (`/ws/*`)
- `/ws/state` : 팬 작동 상태 변경 알림 스트림
- `/ws/chart` : 실시간 풍속 물리량 및 난류 지표 스트리밍 (차트 렌더링용)
- `/ws/log` : 실시간 시스템 디버그 로그 스트림
- `/ws/metrics` : 시스템 성능 지표

---

## 🧭 문제 해결 (Troubleshooting)

| 증상 | 원인 및 점검 사항 | 해결 방법 |
|------|-------------------|-----------|
| **팬이 전혀 돌지 않음** | 전원 연결 불량 또는 PWM 핀 번호 불일치 | 5V/GND 배선 확인 및 설정 화면에서 PWM GPIO 핀 번호 점검 |
| **웹페이지가 뜨지 않음** | LittleFS 파일 미업로드 | `pio run --target uploadfs` 명령으로 파일시스템 데이터 업로드 수행 |
| **팬이 멈추지 않고 최고속도로 돔** | PWM 신호 미입력 또는 듀티 반전 | PWM 제어선(Blue) 접촉 확인 및 PWM 시작 최소치 설정 확인 |
| **바람 세기가 변하지 않음** | 현재 모드가 '정속(Constant)' 상태임 | 웹 대시보드에서 '자연풍(Natural Wind)' 모드로 전환하고 프리셋 선택 |
| **온도 센서(DHT22) 값 안 나옴** | Data 핀 풀업 저항 누락 또는 핀 번호 오류 | 설정에서 온습도 핀 번호 확인 및 3.3V-Data 간 10kΩ 저항 연결 |

---

## 🌪 자연풍 물리 시뮬레이션 원리 (Physics Model)

Smart Nature Wind의 핵심은 단순 난수(Random) 생성이 아닌, **실제 대기 경계층(Atmospheric Boundary Layer)의 미기상학 모델**을 마이크로초 단위로 연산하는 데 있습니다.

1. **난류 스펙트럼 (Turbulence Spectrum)**: 다중 주파수의 파동을 합성하여 나뭇잎이 살랑거리듯 불규칙하면서도 연속적인 기류를 형성합니다.
2. **열기포 상승 효과 (Thermal Bubble Model)**: 지표면 가열로 인해 발생하는 간헐적 상승 기류를 모사하여 10~30초 주기로 부드러운 바람의 솟구침을 만듭니다.
3. **돌풍 모델 (Gust Envelope)**: 점진적으로 바람이 거세졌다가 완만하게 사그라드는 비대칭 곡선의 돌풍을 구현합니다.
4. **관성 완충 (Inertia Filter)**: 모터 하드웨어 및 공기 질량의 관성을 고려하여 급격한 속도 튐 없이 자연스러운 가감속을 유지합니다.

---

## 🔗 부품 및 참조 링크 (Links)

* **Noctua 팬 & 액세서리**:
  - [Noctua NF-A12x25 5V PWM 공식 스펙](https://noctua.at/en/nf-a12x25-5v-pwm)
  - [Noctua NV-FS1 데스크 팬 세트](https://noctua.at/en/nv-fs1)
* **3D 프린터용 데스크 팬 거치대 STL**:
  - [Printables 120mm Fan Desk Mount](https://www.printables.com/model/554226-120mm-computer-fan-desk-mount)
  - [Noctua Inspired Desk Fan Stand](https://www.printables.com/model/889331-noctua-inspired-desk-fan-mount)
* **ESP32 & PlatformIO**:
  - [PlatformIO ESP32 개발 가이드](https://docs.platformio.org/en/latest/platforms/espressif32.html)
  - [ArduinoJson v7 공식 문서](https://arduinojson.org/)

---

*© 2025 Smart Nature Wind (WindScape Standalone). All rights reserved.*

