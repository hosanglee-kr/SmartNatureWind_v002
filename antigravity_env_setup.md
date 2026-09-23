# 🌌 Antigravity 환경 설정 가이드

이 문서는 **Smart Nature Wind (v017)** 프로젝트의 개발 환경 및 설정을 요약한 문서입니다. Antigravity(AI 코딩 어시스턴트)와 함께 프로젝트를 효율적으로 진행하기 위한 최신 가이드라인을 제공합니다.

---

## 🏗️ 1. 개발 환경 개요

| 항목 | 상세 내용 |
|------|-----------|
| **기본 타깃 MCU** | ESP32-S3-N16R8 (16MB Flash / 8MB PSRAM OPI) |
| **보조 타깃 MCU** | ESP32-S3 Zero (4MB Flash), ESP32 DOIT DevKit V1 |
| **프레임워크** | Arduino Framework (`-std=gnu++17`) |
| **빌드 도구** | PlatformIO |
| **파일 시스템** | LittleFS (`./src/v017/data_v017`) |
| **현재 활성 버전** | **v017** (standalone 통합 버전, 버전 넘버 `_070`/`_071`) |

---

## 📁 2. 프로젝트 소스 구조

현재 프로젝트는 `src/v017` 폴더를 중심으로 구성되어 있으며, `src/main.cpp`에서 이를 로드합니다.

- `src/main.cpp`: 아두이노 표준 메인 진입점. Serial/Logger 초기화 후 `A00_init()` 및 `A00_run()` 호출 위임.
- `src/v017/`: 실제 프로젝트 비즈니스 로직이 포함된 핵심 디렉토리.
  - `A00_Main_071.cpp/h`: 부팅 초기화 시퀀스 및 메인 루프 위임.
  - `A20_Const_*.h`: 시스템 상수, 기본 설정값, 스케줄/모션 상수.
  - `A22~A29`: 공통 룩업테이블, 유틸 함수, 설정 리셋 헬퍼.
  - `A30_LED_070.h`: 시스템 상태 표시 LED / NeoPixel 제어.
  - `C10_Config_*.cpp/h`: 환경설정(JSON) 로드, 검증, 갱신 및 스케줄러 설정.
  - `CT10_Ctl_*.cpp/h`: 팬 제어, 센서 연동, 시스템 상태 관리 및 WebSocket 브로커.
  - `D10_Logger_070.h`: 통합 로거 (`CL_D10_Logger`).
  - `M10_MotionLogic_070.h`: 풍향 및 모션 제어 로직.
  - `N10_NvsManager_070.cpp/h`: ESP32 NVS 플래시 메모리 관리자.
  - `P10_PWM_ctrl_070.h`: 모터 하드웨어 PWM 신호 생성 및 주파수 제어.
  - `S10_Simul_*.cpp/h`, `S20_WindSolver_070.h`: 물리 엔진 및 자연풍 시뮬레이션 알고리즘.
  - `TM10_TimeMg_070.h`: NTP 동기화 및 시간 관리자.
  - `W10_Web_*.cpp/h`: 비동기 웹서버, REST API 라우팅(`/api/v001/*`), 웹소켓 핸들러(`/ws/*`).
  - `WF10_WiFiMgr_070.cpp/h`: Wi-Fi AP/STA 연결 및 재연결 관리.
  - `data_v017/`: LittleFS 파일시스템에 업로드될 정적 웹 리소스(HTML/JS/CSS) 및 기본 설정 JSON.

---

## ⚙️ 3. 주요 설정 (`platformio.ini`)

`platformio.ini` 파일에는 빌드 및 업로드를 위한 핵심 설정이 포함되어 있습니다.

### 기본 환경
- `default_envs = esp32-s3-n16r8`
- `data_dir = ./src/v017/data_v017`

### 핵심 빌드 플래그
- `-std=gnu++17`: 최신 C++17 기능 활성화.
- `-DASYNCWEBSERVER_REGEX`: 비동기 웹서버 정규표현식 라우팅 활성화.
- `-DCONFIG_BT_NIMBLE_ENABLED=1`, `-DCONFIG_BT_BLE_ENABLED=1`: 저전력 NimBLE 활성화.
- `-DBOARD_HAS_PSRAM`, `-DBOARD_HAS_PSRAM_OPI`: ESP32-S3 PSRAM(8MB OPI) 지원.
- `-DARDUINO_USB_CDC_ON_BOOT=1`, `-DARDUINO_USB_MODE=1`: Native USB 디버깅 및 시리얼 통신.

### 소스 필터 (Source Filter)
```ini
build_src_filter =
    +<*>
    -<v014_backup/>
    -<v015_backup/>
    -<v016_backup/>
    -<v017_backup/>
    -<v014/>
    -<v015/>
    -<v016/>
```
> [!IMPORTANT]
> 프로젝트 작업 시 현재 활성 버전인 `src/v017` 외의 이전 버전 폴더는 컴파일에서 제외되도록 설정되어 있습니다.

---

## 🌐 4. 주요 웹/API 엔드포인트

- **웹 UI 진입점**: `/` (자동 리다이렉트: `/P010_main_071.html`)
- **REST API (`/api/v001/*`)**:
  - `/api/v001/version` : 펌웨어 및 시스템 버전 정보
  - `/api/v001/state` : 현재 팬/바람 상태 조회 및 제어
  - `/api/v001/system` : 시스템 전원, 리셋, 힙 메모리 정보
  - `/api/v001/config/*` : 환경설정 조회 및 업데이트
  - `/api/v001/motion` : 풍향 및 모션 제어
- **WebSocket (`/ws/*`)**:
  - `/ws/log` : 실시간 시스템 로그 스트림
  - `/ws/state` : 상태 변경 알림
  - `/ws/chart` : 풍속/물리량 실시간 차트 데이터
  - `/ws/metrics` : 런타임 성능 지표
  - `/ws/summary` : 요약 정보 스트림

---

## 🛠️ 5. 빌드 및 배포 가이드

1. **컴파일/빌드**: `pio run` (또는 VS Code PlatformIO 메뉴 → Build)
2. **펌웨어 업로드**: `pio run --target upload`
3. **파일시스템(LittleFS) 업로드**: `pio run --target uploadfs`
   - Web UI 리소스나 설정 파일(`data_v017/`) 수정 시 반드시 수행해야 합니다.
4. **시리얼 모니터**: `pio device monitor` (115200 baud)

---

## 🤖 6. Antigravity와 협업 가이드

- **모듈 식별 및 네이밍**: [.cursorrules](file:///d:/95.2540_PJT/SmartNatureWind_v002/.cursorrules)에 정의된 접두사 규칙(`A00`, `W10`, `CT10`, `C10`, `S10` 등)과 변수 명명 원칙을 철저히 준수합니다.
- **버전 분기**: 대규모 리팩토링이나 차기 버전 개발 시 `v018`과 같이 폴더를 생성하고 `platformio.ini`의 `data_dir` 및 `build_src_filter`를 업데이트합니다.
- **로그 출력**: 모든 로깅은 `CL_D10_Logger::log(EN_L10_LOG_..., ...)`를 사용합니다.
- **답변 언어**: 사용자와의 모든 상호작용 및 설명은 **한국어**로 작성합니다.

---

## 🌿 제품 컨셉: 산들바람 (Smart Nature Wind)
단순한 고정 풍속 제어를 넘어 대기역학(난류 스펙트럼, 열기포 상승, 순간 돌풍 모사)을 실시간 물리 수치해석으로 구현하여 자연 속 산들바람의 숨결을 그대로 재현합니다.

