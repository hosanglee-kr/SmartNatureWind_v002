# 🌌 Antigravity & AI 에이전트 개발 협업 가이드 (agent.md)

이 문서는 **Smart Nature Wind (v0202)** 프로젝트의 개발 환경, 시스템 아키텍처, 코딩 컨벤션, CBD 계약 및 AI 에이전트 작업 원칙을 총망라한 **단일 진실 공급원(SSOT)** 가이드 문서입니다.

---

## 🏗️ 1. 개발 환경 개요

| 항목 | 상세 내용 |
|------|-----------|
| **기본 타깃 MCU** | **ESP32-S3-N16R8** (16MB Flash / 8MB PSRAM OPI) |
| **보조 타깃 MCU** | ESP32-S3 Zero (4MB Flash), ESP32 DOIT DevKit V1 |
| **프레임워크** | Arduino Framework (`-std=gnu++17`) on FreeRTOS |
| **빌드 도구** | PlatformIO IDE |
| **파일 시스템** | LittleFS (`./src/v0202/data_v0202`) |
| **정적 에셋 파이프라인**| SPA 단일 번들 (`P010_bundle_0202.js`, `P000_common_0202.css`, `P010_main_0202.html`) + Level 9 Gzip 사전 압축 (`tools_0202/pio_gzip_0202.py`) |
| **현재 활성 버전** | **v0202 (FW_Ver_2.0.2)** (C++ 백엔드 소스 `_0202` 접미사 / LittleFS 에셋 `_0202`) |
| **소프트웨어 계약** | CBD (Contract-Based Design) v2.4~v2.6 (Batch G 완료 — 동시성, 상태전이, 자원예산 엄격 준수) |

---

## 📁 2. 프로젝트 소스 및 디렉토리 구조

현재 활성 소스는 **`src/v0202/`** 폴더에 집약되어 있으며, `src/main.cpp`에서 이를 로드하여 위임합니다. C++ 소스군은 **`_0202` 접미사** 체계로 리팩토링되어 모듈별 단일 책임과 명확한 소유권을 갖습니다.

- `src/main.cpp`: 아두이노 표준 메인 진입점. Serial/Logger 초기화 후 `A00_init()` 및 `A00_run()` 호출 위임.
- `src/v0202/`: 핵심 비즈니스 로직 및 컴포넌트 디렉토리.
  - `contract_doc_0202/`: CBD 엔지니어링 계약서 7종 (`SPEC v2.6`, `CONTRACT v2.4`, `STATE v2.4`, `FLOW v2.5`, `BUDGET v2.5`, `TEST_PLAN v2.5`, `README v2.4` — Batch G 완료) 및 용어집(`Ref/UI_TERMINOLOGY_0170.md`).
  - `Req_ImplPlan_0202/`: 요구사항 정의서 및 리팩토링 구현 계획서.
  - `User_Manual_0202/`: 공식 종합 사용자 매뉴얼 (`UserManual_0202_001.md`, `introduce_Doc_0202_001.md`).
  - `tools_0202/`: 활성 빌드 전처리 도구 (`pio_gzip_0202.py` - PlatformIO extra_scripts 자동 번들/Gzip) 및 계약 커밋 도구 (`commit_contracts_0202.py`).
  - `data_v0202_src/`: [웹 개발 원본] SPA 프론트엔드 리소스 (`html_v0202/` 내 `index.html`, 10개 CSS, 34개 JS 모듈 + 로컬 검증용 raw 번들, `.gz` 제외).
  - `data_v0202/`: [배포 스테이징] LittleFS 플래시 대상 디렉토리 (`json/` 9개 설정 파일 + `html_v0202/` 3개 Gzip 번들 자산 raw+gz).
  - **C++ 소스군 (`_0202` 접미사)**:
    - `A00_Main_0202.cpp/h`: 부팅 초기화 시퀀스 및 FreeRTOS 메인 루프 위임.
    - `A20_Const_*_0202.h`: 시스템 전역 상수(`A20_Const_0202.h`, `A20_Const_Const_0202.h`, `_Sys_`, `_Sch_`, `_Wifi_`, `_Motion_`, `_WS_`).
    - `A22~A29`: 공통 룩업테이블(`A22_Com_Lookup_0202.h`), 팩토리 리셋 헬퍼(`A23_Com_ResetCfg_0202.h`), 유틸리티(`A25_Com_Utils_0202.h`, `A25_Com_Utils_IO_0202.cpp`).
    - `A30_LED_0202.h`: WS2812B NeoPixel RGB LED 상태 표시기 (7-State FSM 시각화).
    - `C10_Config_0202.h`: 환경설정(JSON) 관리자 (`C10_Config_Core/Extras/Sys_0202.cpp`, `_Sch_*` 5분할, `_UzProf_*` 5분할, `_WindDc_*` 5분할).
    - `CT10_Ctl_0202.h`: 팬 제어, 센서 연동, 시스템 상태 관리 및 WebSocket 브로커 (`CT10_Ctl_Basic/Ctl/StMG/IOWS_0202.cpp`, `_Ctl_Seg/Ovr/Mode_0202.cpp`).
    - `D10_Logger_0202.h`: 통합 링버퍼 로거 (`CL_D10_Logger`).
    - `M10_MotionLogic_0202.h`: 풍향 및 모션 제어 로직.
    - `N10_NvsManager_0202.cpp/h`: ESP32 NVS 플래시 메모리 관리자.
    - `P10_PWM_ctrl_0202.h`: 25kHz 고주파 하드웨어 LEDC PWM 제어기 (헤더 인라인).
    - `S10_Simul_0202.h`, `S10_Simul_Const_0202.h`, `S10_Simul_Core/Physic/IO_0202.cpp`: 대기역학 물리 엔진.
    - `S20_WindSolver_0202.h`: 자연풍 수치해석 솔버 (헤더 인라인).
    - `TM10_TimeMg_0202.cpp/h`: NTP 동기화 및 RTC 시간 관리자 (E-2.1 분리).
    - `W10_Web_0202.h`, `W10_Web_Const_0202.h`: 비동기 웹서버 Core (`_Routes_0202.cpp`, `_Routes_System/Control/Config/Network/CRUD_0202.cpp`, `_Static/Upload/Util/WS/Gemini_0202.cpp`).
    - `WF10_WiFiMgr_0202.cpp/h`: Wi-Fi SoftAP(`NatureWind`/`2540`) 및 STA 연결/재연결 관리.

---

## ⚙️ 3. 주요 설정 및 라이브러리 규격 (`platformio.ini`)

### 3.1 필수 라이브러리 ID (Required Library IDs)
- **ArduinoJson**: `/bblanchon/arduinojson` (반드시 v7.x 사용, 현재 `^7.4.3`)
- **ESPAsyncWebServer**: `/esp32async/espasyncwebserver` (`^3.12.1`, 비동기 웹서버, 정규식 라우팅 지원)
- **AsyncTCP**: `/esp32async/asynctcp`
- **NimBLE-Arduino**: `/h2zero/NimBLE-Arduino` (`^2.5.1`, 저전력 BLE 스택)
- **Adafruit Sensor & NeoPixel**: `/adafruit/Adafruit_NeoPixel` (`^1.15.5`), `/adafruit/DHT-sensor-library` (`^1.4.7`), `/adafruit/Adafruit Unified Sensor` (`^1.1.15`)
- **PlatformIO**: `/platformio/platformio-docs`

### 3.2 빌드 환경 및 플래그
- `default_envs = esp32-s3-n16r8`
- `data_dir = ./src/v0202/data_v0202`
- `extra_scripts = pre:src/v0202/tools_0202/pio_gzip_0202.py`
- `-std=gnu++17`: C++17 모던 문법 지원.
- `-D ASYNCWEBSERVER_REGEX`: 비동기 웹서버 정규표현식 라우팅 활성화.
- `-D CONFIG_BT_NIMBLE_ENABLED=1`, `-D CONFIG_BT_BLE_ENABLED=1`: 초경량 NimBLE 스택 활성화.
- `-D BOARD_HAS_PSRAM`, `-D BOARD_HAS_PSRAM_OPI`: ESP32-S3 8MB OPI PSRAM 활성화.
- `-D ARDUINO_USB_MODE=1`, `-D ARDUINO_USB_CDC_ON_BOOT=1`: 하드웨어 USB CDC 시리얼 통신.

### 3.3 소스 필터 (Source Filter)
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
    -<v0200/>
    -<v0202/tools_0202/>
```
> [!IMPORTANT]
> `src/v0202`가 단독 컴파일 대상이며, 이전 레거시 버전(`v014`~`v0200`) 및 도구 스크립트는 빌드에서 자동 제외됩니다.

---

## 🏷️ 4. 모듈 접두사 체계 (Module Prefix Conventions)

소스 파일 및 심볼은 역할에 따른 모듈 접두사를 반드시 부여합니다.

| 모듈 약어 | 담당 영역 및 설명 | 대표 파일 예시 (v0202 기준) |
| :--- | :--- | :--- |
| **A00** | 메인 부팅 시퀀스 및 주기 루프 위임 | `A00_Main_0202.cpp`, `A00_Main_0202.h` |
| **A20** | 전역 상수, 설정 테이블, 공통 매크로 | `A20_Const_0202.h`, `A20_Const_Sys_0202.h` |
| **A22~A29** | 공통 유틸리티, 룩업테이블, 파서/리셋 | `A22_Com_Lookup_0202.h`, `A25_Com_Utils_0202.h` |
| **A30** | 상태 표시 LED / NeoPixel 제어 | `A30_LED_0202.h` |
| **C10** | 환경설정(Config) 로드/저장/검증 | `C10_Config_0202.h`, `C10_Config_Core_0202.cpp` |
| **CT10** | 장치 제어(Control), 상태 관리, WS 브로커 | `CT10_Ctl_0202.h`, `CT10_Ctl_Ctl_0202.cpp` |
| **D10** | 시스템 로거 (로그 레벨 필터링 및 출력) | `D10_Logger_0202.h` |
| **M10** | 모션 및 풍향 제어 로직 | `M10_MotionLogic_0202.h` |
| **N10** | NVS 비휘발성 플래시 스토리지 관리 | `N10_NvsManager_0202.cpp`, `N10_NvsManager_0202.h` |
| **P10** | 팬 모터 하드웨어 PWM 제어 | `P10_PWM_ctrl_0202.h` |
| **S10 / S20** | 바람 시뮬레이션(Simul), 물리 엔진, 솔버 | `S10_Simul_0202.h`, `S20_WindSolver_0202.h` |
| **TM10** | 시간 관리 (NTP 동기화, 타이머, 스케줄링) | `TM10_TimeMg_0202.cpp`, `TM10_TimeMg_0202.h` |
| **W10** | 웹 서버(Web), REST API 라우팅, 웹소켓 | `W10_Web_0202.h`, `W10_Web_Routes_0202.cpp` |
| **WF10** | Wi-Fi 연결 및 네트워크 매니저 | `WF10_WiFiMgr_0202.cpp`, `WF10_WiFiMgr_0202.h` |

---

## 📐 5. 코드 네이밍 및 구현 규칙 (Coding Conventions)

### 5.1 네이밍 규칙
변수명은 의미를 명확히 알 수 있도록 충분히 길게 작성하며, 과도한 약어 사용을 지양합니다.

| 구분 | 패턴 | 예시 |
| :--- | :--- | :--- |
| **파일명** | `[영문접두사][숫자]_[이름]_[버전].cpp/h` | `W10_Web_Routes_0202.cpp`, `A00_Main_0202.cpp` |
| **클래스명** | `CL_[영문접두사][숫자]_[이름]` | `CL_W10_WebAPI`, `CL_D10_Logger`, `CL_C10_Config` |
| **구조체** | `ST_[영문접두사][숫자]_[이름]_t` | `ST_A20_ConfigRoot_t`, `ST_S10_WindState_t` |
| **Enum** | `EN_[영문접두사][숫자]_[이름]` | `EN_L10_LOG_INFO`, `EN_CT10_MODE_MANUAL` |
| **전역 상수/매크로** | `G_[영문접두사][숫자]_[이름]` | `G_W10_PAGES_JSON`, `G_S10_GUST_INTERVAL_MS` |
| **전역 변수** | `g_[영문접두사][숫자]_[이름]` | `g_A20_config_root`, `g_CT10_deviceState` |
| **정적 멤버 변수** | `s_[이름]` | `s_webServer`, `s_configMutex` |
| **Private 멤버 변수** | `_[이름]` | `_dirty_systemConfig`, `_currentSpeed` |
| **지역 변수** | `v_[이름]` | `v_jsonDocument`, `v_isSuccess`, `v_temperatureValue` |
| **함수 인자** | `p_[이름]` | `p_requestObject`, `p_jsonDocument` |
| **전역 함수** | `[영문접두사][숫자]_[이름]` | `W10_guessMimeType`, `A00_init`, `A00_run` |
| **클래스 메서드** | `camelCase` (접두사 없음) | `begin`, `sendJsonResponse`, `updateState` |

### 5.2 구현 규칙 (Implementation Rules)
1. **파일 헤더**: 모든 소스 파일은 표준 헤더 블록(소스명, 모듈약어, 모듈명, 기능요약, 버전 정보)으로 시작해야 합니다.
2. **변수 명명 (가독성)**:
    - 변수명은 역할이나 데이터를 명확히 설명할 수 있도록 **충분히 길게** 작성합니다. (예: `v_doc` → `v_jsonDocument`, `v_idx` → `v_index`)
    - 시간 단위가 포함된 경우 `Ms`, `Sec` 등을 명시합니다. (`v_elapsedMs`, `v_durationSec`)
    - 불리언 변수는 `is`, `has`, `can` 등의 접두사를 권장합니다. (`v_isSuccess`, `v_isValid`)
3. **로깅 (Logging)**:
    - 디버깅 정보는 항상 `CL_D10_Logger::log(레벨, "[모듈약어] 메시지", ...)` 형식을 사용합니다.
    - 레벨: `EN_L10_LOG_INFO`, `EN_L10_LOG_WARN`, `EN_L10_LOG_ERROR`, `EN_L10_LOG_DEBUG`
4. **함수 내 주석**: 복잡한 로직은 단계별로 주석을 답니다. (예: `// 1. 입력 파라미터 검증`, `// 2. 물리 모델 계산`)
5. **ArduinoJson**:
    - 항상 `JsonDocument` 단일 타입을 사용하십시오 (v7.x 전용).
    - `createNestedArray`, `createNestedObject` 사용을 금지합니다 (`doc["key"].to<JsonObject>()` 등 v7 문법 사용).
6. **문자열 및 메모리**:
    - 안전한 초기화를 위해 `memset` + `strlcpy` 패턴을 사용하십시오.
    - 풍속 등 물리량 계산 시 `float` 타입을 사용하며, 상수 뒤에 `f`를 붙입니다. (`1.0f`)
7. **에러 처리**: API 에러 응답 시 `{"error": "메시지"}` 표준 형식을 유지합니다.
8. **응답 언어**: 모든 설명 및 답변은 명확하고 이해하기 쉬운 **한국어**로 작성합니다.

---

## 🌐 6. 주요 웹/API 엔드포인트 및 SPA 구조

### 6.1 웹 UI SPA 구조
기기 IP로 접속 시 브라우저 헤더의 Gzip 지원 여부를 판별하여 초고속으로 SPA Shell을 렌더링하며, 해시 라우팅(#)을 통해 페이지 전환 지연 시간 0ms를 제공합니다.

- **메인 SPA Shell**: `/` (자동 리다이렉트 `/index.html`)
- **해시 뷰 라우팅 (Hash Views - 12개 페이지)**:
  - `#/dashboard`: 전원 제어, 프리셋 선택, 풍속 슬라이더 (L1)
  - `#/chart`: WebSocket 기반 실시간 대기역학 물리 곡선 차트 (L1)
  - `#/schedule`: 요일별/시간대별 예약 규칙 관리 (L1)
  - `#/profiles`: 개인 맞춤형 풍속/모드 프로필 저장 및 호출 (L1)
  - `#/sensors`: 온습도(DHT22) 및 인체감지(PIR) 실시간 센서 모니터링 (L1)
  - `#/settings`: 시스템, GPIO 핀맵, PWM 타이밍, 보안(API Key) 설정 (L2)
  - `#/network`: Wi-Fi SoftAP / STA 네트워크 상세 설정 (L2)
  - `#/logs`: 실시간 링버퍼 시스템 로그 뷰어 (L2)
  - `#/diagnostics`: 하드웨어, 태스크, 힙 및 LittleFS 진단 (L3)
  - `#/firmware`: OTA 펌웨어 업로드 및 버전 롤백/업데이트 (L3)
  - `#/ai`: Gemini AI 대화형 비서 연동 (L1)
  - `#/info`: 힙 메모리, 업타임, Wi-Fi RSSI, 시스템 라이선스 정보 (L1)

### 6.2 REST API (`/api/v001/*`)
- `/api/v001/version` : 펌웨어 버전, 빌드 해시, 빌드 시각 (B-1)
- `/api/v001/state` : 현재 팬 상태, 동작 모드, 목표 풍속 조회 및 제어 (N-1)
- `/api/v001/reload` : [F-05] 비동기 202 설정 재적용 (atomic CAS + loopTask 위임)
- `/api/v001/control/*` : `/control/ack` (AutoOff 래치 해제), `/control/mode` (모드 전환), `/control/override/fixed` (수동 풍속), `/control/factoryReset` (NVS 리셋)
- `/api/v001/system` : Free Heap/PSRAM, Wi-Fi RSSI, 센서 실측값 (F-2 공통 헬퍼, B-4 clearApiKey)
- `/api/v001/wifi/*` : `/wifi/state` (연결 상태), `/wifi/scan` (AP 스캔), `/wifi/config` (설정 저장, F-3)
- `/api/v001/config/*`, `/api/v001/config/save` : JSON 설정 읽기, 검증 및 디스크 영구 저장
- `/api/v001/motion` : 풍향 및 모션 제어 (F-06 위임, B-6 헬퍼, C-3 holdSec 단일 판정)
- `/api/v001/windProfile` & `/{id}` : 프리셋 CRUD (B-9 root 스냅샷 캐시)
- `/api/v001/schedules` & `/{id}` : 주간 스케줄 CRUD
- `/api/v001/user_profiles` & `/{id}` : 사용자 맞춤 프로필 CRUD
- `/api/v001/metrics` : 런타임 성능 지표 및 태스크 통계
- `/api/v001/logs` : 링버퍼 시스템 로그 조회
- `/api/v001/ai/gemini` : Gemini AI 프록시 통신
- `/api/v001/fwUpdate` : OTA 펌웨어 업데이트 (B-12 abort 방어)
- `/api/v001/fileUpload` : LittleFS 파일 업로드 (C-4 stale close)

### 6.3 WebSocket 스트림 (`/ws/*`)
- `/ws/state` : 팬 ON/OFF, 모드 변경 브로드캐스트
- `/ws/chart` : 풍속, 난류, 열기포 수치 실시간 고속 스트리밍 (차트 렌더링용)
- `/ws/log` : 실시간 시스템 링버퍼 로그 스트림
- `/ws/metrics` : 런타임 성능 지표 및 태스크 통계
- `/ws/summary` : 제어 요약 정보 스트림

---

## 🛠️ 7. 빌드 및 배포 가이드

1. **컴파일/빌드 검증**:
   ```bash
   pio run
   ```
2. **펌웨어 업로드**:
   ```bash
   pio run --target upload
   ```
3. **파일시스템(LittleFS) 사전 압축 및 업로드 (최초 또는 웹 자산 변경 시 필수)**:
   ```bash
   pio run --target uploadfs
   ```
   * `pre:src/v0202/tools_0202/pio_gzip_0202.py`가 자동으로 `data_v0202_src`를 Level 9 Gzip 압축하여 `data_v0202`를 생성한 뒤 플래시에 기록합니다.
4. **시리얼 모니터링**:
   ```bash
   pio device monitor
   ```

---

## 🤖 8. CBD 계약 및 에이전트 협업 가이드

- **문서 참조 링크 규격**: 프로젝트 내 모든 문서 간 참조 링크는 **프로젝트 루트 기준의 상대 경로**(`src/v0202/...`, `platformio.ini` 등)로 표기합니다.
- **CBD 계약 (Batch G 완료) 동시성/FSM 계약 준수**:
  - 공유 자원 접근 시 [CONTRACT_0202.md](src/v0202/contract_doc_0202/CONTRACT_0202.md)의 Mutex 소유권 및 데드락 방지 원칙 준수.
  - 기기 상태 변경 시 [STATE_0202.md](src/v0202/contract_doc_0202/STATE_0202.md)에 명시된 7대 FSM 상태 전이 규칙 준수.
  - 최악 실행 시간(WCET) 및 메모리 버짓은 [BUDGET_0202.md](src/v0202/contract_doc_0202/BUDGET_0202.md) 기준 내 유지.
  - 시스템 기술 사양은 [SPEC_0202.md](src/v0202/contract_doc_0202/SPEC_0202.md)의 SSOT 기준을 준수.
  - 실행 흐름 및 부팅 시퀀스는 [FLOW_0202.md](src/v0202/contract_doc_0202/FLOW_0202.md)를 준수.
  - 회귀 검증 및 릴리스 게이트는 [TEST_PLAN_0202.md](src/v0202/contract_doc_0202/TEST_PLAN_0202.md)의 26대 필수 세트 및 절차를 준수.
- **로깅 표준**: 모든 시스템 로깅은 `CL_D10_Logger::log(EN_L10_LOG_..., ...)`를 사용합니다.
- **답변 언어**: 사용자와의 모든 상호작용 및 기술 설명은 명확하고 정중한 **한국어**로 작성합니다.

---

## 🧠 9. 지식 그래프 (Graphify) 기반 탐색 원칙 (Strict Invariant)

> [!CAUTION]
> **전체 소스/문서 직접 열람 및 무차별 Grep 절대 금지 (Graph-First Rule)**:
> AI 에이전트는 코드 분석, 기능 구현, 버그 추적, 리팩토링, 미사용 코드 점검 등 **모든 작업 시 소스 코드(`.h`, `.cpp`)나 문서(`.md`, `.json`)를 직접 열거나(`view_file`) 무차별 검색(`grep_search`)을 먼저 수행하는 것을 엄격히 금지**합니다.

### 📌 2단계 필수 탐색 프로토콜 (Two-Step Navigation Protocol)
1. **[1단계] Graphify 선행 질의 (Mandatory First Step)**:
   - 작업 시작 전 반드시 아래 명령어로 지식 그래프(`graphify-out/graph.json`)를 먼저 질의하여 대상 심볼, 호출 관계, 소속 커뮤니티, 정확한 파일 경로 및 라인 번호를 파악해야 합니다:
     - `graphify query "<목적/질문/심볼>"`: 관련 노드, 커뮤니티, 정확한 파일 경로(`src=...`) 및 라인(`loc=...`) 조회 (CLI `--budget` 조절 가능)
     - `graphify path "<출발노드>" "<도착노드>"`: 두 심볼/모듈 간 호출 관계 및 최단 의존 경로 추적
     - `graphify explain "<심볼/함수/클래스명>"`: 특정 심볼의 상세 명세 및 연결 노드 확인
2. **[2단계] 타겟 라인 정밀 열람 (Pinpoint View)**:
   - 1단계 Graphify 질의 결과로 확인된 **정확한 파일과 필요한 최소 라인 범위(`StartLine`, `EndLine`)에 한해서만** `view_file`을 실행합니다.
   - 전체 파일을 한 번에 크게 열거나, 목적 없이 파일들을 순차 열람하는 행위는 금지됩니다.

### 🔄 지식 그래프 갱신
코드나 설계를 변경한 후에는 지식 그래프 최신화를 위해 반드시 다음 명령어를 실행합니다 (AST 전용, LLM API 비용 없음):
```powershell
graphify update .
```
*(참고: `graphify --help` 명령은 절대 실행하지 않으며 문법은 정적 가이드를 참조합니다.)*