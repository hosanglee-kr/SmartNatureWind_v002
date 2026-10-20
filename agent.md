# 🌌 Antigravity 환경 설정 가이드

이 문서는 **Smart Nature Wind (v0200)** 프로젝트의 개발 환경, 시스템 아키텍처 및 빌드 설정을 요약한 문서입니다. Antigravity(AI 코딩 어시스턴트)와 함께 프로젝트를 효율적이고 일관성 있게 진행하기 위한 개발자 및 에이전트 협업 가이드라인을 제공합니다.

---

## 🏗️ 1. 개발 환경 개요

| 항목 | 상세 내용 |
|------|-----------|
| **기본 타깃 MCU** | **ESP32-S3-N16R8** (16MB Flash / 8MB PSRAM OPI) |
| **보조 타깃 MCU** | ESP32-S3 Zero (4MB Flash), ESP32 DOIT DevKit V1 |
| **프레임워크** | Arduino Framework (`-std=gnu++17`) on FreeRTOS |
| **빌드 도구** | PlatformIO IDE |
| **파일 시스템** | LittleFS (`./src/v0200/data_v0200`) |
| **정적 에셋 파이프라인**| 단일 번들 JS (`P010_bundle_0200.js`) + Level 9 Gzip 사전 압축 (`pio_gzip_0200.py`) |
| **현재 활성 버전** | **v0200 (FW_Ver_2.0.0)** (C++ 백엔드 소스 `_0201` 접미사 / 웹 에셋 `_0200`) |
| **소프트웨어 계약** | CBD (Contract-Based Design) v2.2 (동시성, 상태전이, 자원예산 엄격 준수) |

---

## 📁 2. 프로젝트 소스 및 디렉토리 구조

현재 활성 소스는 **`src/v0200/`** 폴더에 집약되어 있으며, `src/main.cpp`에서 이를 로드하여 위임합니다. C++ 소스군은 **`_0201` 접미사** 체계로 리팩토링되어 모듈별 단일 책임과 명확한 소유권을 갖습니다.

- `src/main.cpp`: 아두이노 표준 메인 진입점. Serial/Logger 초기화 후 `A00_init()` 및 `A00_run()` 호출 위임.
- `src/v0200/`: 핵심 비즈니스 로직 및 컴포넌트 디렉토리.
  - `A00_Main_0201.cpp/h`: 부팅 초기화 시퀀스 및 FreeRTOS 메인 루프 위임.
  - `A20_Const_0201.h`, `A20_Const_Const_0201.h`: 시스템 전역 상수(`G_JSON_VERSION`, 펌웨어 버전 등), 핀맵 기본값, PWM 타이밍.
  - `A22~A29`: 공통 룩업테이블, 유틸리티 함수(`A25_Com_Utils_IO_0201.cpp` 분리), 팩토리 리셋 헬퍼.
  - `A30_LED_0201.h`: WS2812B NeoPixel RGB LED 상태 표시기 (7-State FSM 시각화).
  - `C10_Config_0201.cpp/h`: 환경설정(JSON) 관리자 (`C10_Config_Sch_*`, `C10_Config_UzProf_*`, `C10_Config_WindDc_*` 모듈 분할).
  - `CT10_Ctl_0201.cpp/h`: 팬 제어, 센서 연동, 시스템 상태 관리 및 WebSocket 브로커 (`CT10_Ctl_Basic/Ctl/StMG/IOWS`, `Seg/Ovr/Mode` 분할).
  - `D10_Logger_0201.h`: 통합 링버퍼 로거 (`CL_D10_Logger`).
  - `M10_MotionLogic_0201.h`: 풍향 및 모션 제어 로직.
  - `N10_NvsManager_0201.cpp/h`: ESP32 NVS 플래시 메모리 관리자.
  - `P10_PWM_ctrl_0201.h`: 25kHz 고주파 하드웨어 LEDC PWM 제어기.
  - `S10_Simul_*.cpp/h`, `S20_WindSolver_0201.h`: 대기역학 물리 엔진 및 자연풍 수치해석 솔버.
  - `TM10_TimeMg_0201.h`: NTP 동기화 및 RTC 시간 관리자.
  - `W10_Web_*.cpp/h`: 비동기 웹서버, REST API 라우팅(`/api/v001/*`), WebSocket 핸들러(`/ws/*`).
  - `WF10_WiFiMgr_0201.cpp/h`: Wi-Fi SoftAP(`NatureWind`/`2540`) 및 STA 연결/재연결 관리.
  - `data_src_v0200/`: 원본 웹 리소스 (HTML, CSS, 단일 번들 `P010_bundle_0200.js`, 설정 JSON).
  - `data_v0200/`: LittleFS 플래시용 Level 9 Gzip 사전 압축 산출물.
  - `tools_0200/`: 보조 도구 (`pio_gzip_0200.py` 사전 압축, `commit_contracts_0200.py` 계약 검증).
  - `contract_doc_0200/`: CBD v2.2 엔지니어링 계약서 7종 (`SPEC`, `CONTRACT`, `STATE`, `FLOW`, `BUDGET`, `TEST_PLAN`, `README`).
  - `User_Manual_0200/`: v0200 공식 종합 사용자 매뉴얼 (`UserManual_0200_001.md`).

---

## ⚙️ 3. 주요 설정 (`platformio.ini`)

### 기본 환경
- `default_envs = esp32-s3-n16r8`
- `data_dir = ./src/v0200/data_v0200`
- `extra_scripts = pre:src/v0200/tools_0200/pio_gzip_0200.py`

### 핵심 빌드 플래그
- `-std=gnu++17`: C++17 모던 문법 지원.
- `-D ASYNCWEBSERVER_REGEX`: 비동기 웹서버 정규표현식 라우팅 활성화.
- `-D CONFIG_BT_NIMBLE_ENABLED=1`, `-D CONFIG_BT_BLE_ENABLED=1`: 초경량 NimBLE 스택 활성화.
- `-D BOARD_HAS_PSRAM`, `-D BOARD_HAS_PSRAM_OPI`: ESP32-S3 8MB OPI PSRAM 활성화.
- `-D ARDUINO_USB_MODE=1`, `-D ARDUINO_USB_CDC_ON_BOOT=1`: 하드웨어 USB CDC 시리얼 통신.

### 소스 필터 (Source Filter)
```ini
build_src_filter =
    +<*>
    -<v014_backup/>
    -<v015_backup/>
    -<v016_backup/>
    -<v017_backup/>
    -<v0200_backup/>
    -<v014/>
    -<v015/>
    -<v016/>
    -<v017/>
    -<v0200/tools_0200/>
```
> [!IMPORTANT]
> `src/v0200`이 단독 컴파일 대상이며, 이전 레거시 버전(`v014`~`v017`) 및 도구 스크립트는 빌드에서 자동 제외됩니다.

---

## 🌐 4. 주요 웹/API 엔드포인트 (v0200)

### 1. 웹 UI 화면 라우팅
- `/` (자동 리다이렉트 `/P010_main_0200.html`): 메인 대시보드
- `/P050_chart_t3_0200.html`: 실시간 대기역학 물리 곡선 차트 (WebSocket 기반)
- `/P080_sch_t2_0200.html`: 요일별/시간대별 스케줄러 관리
- `/P085_userProfiles_0200.html`: 사용자 맞춤 프로필 관리
- `/P090_info_0200.html`: 시스템 런타임/메모리/네트워크 정보
- `/P100_settings_0200.html`: 하드웨어 GPIO 핀맵 및 네트워크 환경설정

### 2. REST API (`/api/v001/*`)
- `/api/v001/version` : 펌웨어 버전, 빌드 해시, 빌드 시각
- `/api/v001/state` : 현재 팬 상태, 동작 모드, 목표 풍속 조회 및 제어
- `/api/v001/system` : Free Heap/PSRAM, Wi-Fi RSSI, 센서(DHT22, PIR) 실측값
- `/api/v001/config/*` : JSON 설정 읽기, 검증 및 저장
- `/api/v001/motion` : 풍향 및 모션 제어

### 3. WebSocket 스트림 (`/ws/*`)
- `/ws/state` : 팬 ON/OFF, 모드 변경 브로드캐스트
- `/ws/chart` : 풍속, 난류, 열기포 수치 실시간 고속 스트리밍 (차트 렌더링용)
- `/ws/log` : 실시간 시스템 링버퍼 로그 스트림
- `/ws/metrics` : 런타임 성능 지표 및 태스크 통계

---

## 🛠️ 5. 빌드 및 배포 가이드

1. **계약 문서 무결성 사전 검증 (선택/CI Gate)**:
   ```bash
   python src/v0200/tools_0200/commit_contracts_0200.py --dry-run --strict
   ```
2. **컴파일/빌드 검증**:
   ```bash
   pio run
   ```
3. **펌웨어 업로드**:
   ```bash
   pio run --target upload
   ```
4. **파일시스템(LittleFS) 사전 압축 및 업로드 (최초 또는 웹 자산 변경 시 필수)**:
   ```bash
   pio run --target uploadfs
   ```
   * `pre:src/v0200/tools_0200/pio_gzip_0200.py`가 자동으로 `data_src_v0200`을 Level 9 Gzip 압축하여 `data_v0200`을 생성한 뒤 플래시에 기록합니다.
5. **시리얼 모니터링**:
   ```bash
   pio device monitor
   ```

---

## 🤖 6. Antigravity와 협업 가이드

- **모듈 식별 및 네이밍 규칙**: [.cursorrules](.cursorrules)에 정의된 접두사 규칙(`A00`, `W10`, `CT10`, `C10`, `S10`, `P10` 등)과 변수 명명 원칙(`g_`, `s_`, `m_`, `p_` 등)을 철저히 준수합니다.
- **문서 참조 링크 규격**: 프로젝트 내 모든 문서 간 참조 링크는 **프로젝트 루트 기준의 상대 경로**(`src/v0200/...`, `platformio.ini` 등)로 표기합니다.
- **CBD v2.2 동시성/FSM 계약 준수**:
  - 공유 자원 접근 시 [CONTRACT_0200.md](src/v0200/contract_doc_0200/CONTRACT_0200.md)의 Mutex 소유권 및 데드락 방지 원칙 준수.
  - 기기 상태 변경 시 [STATE_0200.md](src/v0200/contract_doc_0200/STATE_0200.md)에 명시된 7대 FSM 상태 전이 규칙 준수.
  - 최악 실행 시간(WCET) 및 메모리 버짓은 [BUDGET_0200.md](src/v0200/contract_doc_0200/BUDGET_0200.md) 기준 내 유지.
- **로깅 표준**: 모든 시스템 로깅은 `CL_D10_Logger::log(EN_L10_LOG_..., ...)`를 사용합니다.
- **답변 언어**: 사용자와의 모든 상호작용 및 기술 설명은 명확하고 정중한 **한국어**로 작성합니다.

---

## 🌿 제품 컨셉: 산들바람 (Smart Nature Wind)
단순한 고정 풍속 제어를 넘어 대기역학(난류 스펙트럼, 열기포 상승, 순간 돌풍 모사)을 실시간 물리 수치해석으로 구현하여 자연 속 산들바람의 숨결을 그대로 재현합니다.  
세부 사용자 가이드는 [UserManual_0200_001.md](src/v0200/User_Manual_0200/UserManual_0200_001.md)를 참조하십시오.
