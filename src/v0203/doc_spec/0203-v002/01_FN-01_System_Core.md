# FN-01. 시스템 코어 및 공통 유틸리티 기능 명세서

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-01` / 시스템 코어 및 공통 유틸리티 (`System Core, Boot Orchestration, LED, Logger & Common Utilities`)
- **관련 소스 파일**:
  - 진입점/오케스트레이션: `A00_Main_0203.h`, `A00_Main_0203.cpp`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)
  - 전역 상수/룩업/초기화: `A20_Const_0203.h`, `A20_Const_Const_0203.h`, `A22_Com_Lookup_0203.h`, `A23_Com_ResetCfg_0203.h`[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)
  - 상태 표시/공통유틸/로거: `A30_LED_0203.h`, `A40_Com_Utils_0203.h`, `D10_Logger_0203.h`[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)
- **실행 컨텍스트**:
  - 부팅 초기화: `setup()` → `A00_init()` (단일 스레드 부팅 컨텍스트)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span)
  - 메인 루프: `loop()` → `A00_run()` (`loopTask`, 주기 `10ms` 지연 `G_A00_LOOP_DELAY_MS`)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span)
- **선행 조건 (Pre-condition)**:
  - ESP32-S3/C3 하드웨어 전원 인가 및 Arduino Core 초기화 완료[span_14](start_span)[span_14](end_span)
  - 시리얼 포트(`115200 bps`) 초기화 완료 (`CL_D10_Logger::begin()`)[span_15](start_span)[span_15](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- 펌웨어 부팅 시 **10단계 서브시스템 초기화 시퀀스(`A00_init`)**와 메인 루프 오케스트레이션(`A00_run`)을 총괄하고, **Watchdog(10초) 감시**, **NeoPixel 상태 LED 점멸(`A30`)**, **256-entry 순환 버퍼 + 실시간 WebSocket 로깅(`D10`)**, **RAII 동기화 가드 및 안전 문자열/JSON 유틸리티(`A40`)**를 제공함[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span).

### 2.2 세부 기능 분할 (`FN-01-01` ~ `FN-01-04`)
- **`FN-01-01` 시스템 부팅 오케스트레이션 및 3단계 복구 폴백 (`A00_init`)**: LittleFS → Config → NVS → Null 방어 → LED → Wi-Fi → Time → PWM/Control/Motion → Web/WS/Monitor → TWDT 순차 기동[span_20](start_span)[span_20](end_span)
- **`FN-01-02` 메인 루프 틱 스케줄링 및 WDT 관리 (`A00_run`)**: Watchdog 리셋, 지연 리로드 소비(`consumePendingReload`), 제어/WS/모션/시간/모니터/지연해제/NVS/LED 순차 실행[span_21](start_span)[span_21](end_span)
- **`FN-01-03` 독립형 RGB 상태 LED 인디케이터 (`CL_A30_LED`)**: Wi-Fi STA 연결 상태에 따른 비블로킹 점멸 패턴 제어[span_22](start_span)[span_22](end_span)
- **`FN-01-04` 통합 진단 로거 및 공통 안전 유틸리티 (`CL_D10_Logger` / `A20` / `A22` / `A23` / `A40`)**: 시리얼 ANSI 컬러·256개 순환 버퍼·`/ws/log` 스트리밍, 코드↔열거형 룩업, 구조체 기본값 리셋, RAII Mutex/Critical Section 가드[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span)[span_26](start_span)[span_26](end_span)

### 2.3 핵심 비즈니스 규칙
1. **3단계 부팅 장애 복구 정책 (`A00_init`)**[span_27](start_span)[span_27](end_span):
   - **1단계 (정상 로드)**: `CL_C10_ConfigManager::loadAll(g_A20_config_root)`로 8개 JSON 설정 파일 로드[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span).
   - **2단계 (In-memory 기본값 폴백)**: `system` 또는 `wifi` 포인터가 `nullptr`인 경우 디스크의 손상 파일을 덮어쓰지 않고 `new (std::nothrow)`로 메모리에만 기본값(`A20_resetSystem/WifiDefault`)을 할당하여 부팅을 계속 진행하고 웹 UI 복구 경로를 확보함[span_30](start_span)[span_30](end_span).
   - **3단계 (최후 안전망 Recovery AP)**: 심각한 OOM으로 메모리 할당마저 실패하면 복구 전용 SoftAP(`NatureWind_Recovery` / `2540`)만 단독 기동하고 초기화를 중단함[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span).
2. **Task Watchdog(TWDT) 감시 정책 (`A00_Main_0203.cpp`)**:
   - 모든 서브시스템과 웹 서버가 준비된 **부팅 마지막(10단계)**에 `esp_task_wdt_init(G_A00_WDT_TIMEOUT_SEC = 10s, true)`로 등록하여 부팅 중 Flash 포맷/네트워크 지연으로 인한 오탐 리셋을 방지함[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span).
   - 메인 루프(`A00_run`) 최상단에서 매 주기 `esp_task_wdt_reset()`을 호출함[span_35](start_span)[span_35](end_span).
3. **상태 LED 점멸 규칙 (`CL_A30_LED::run(bool p_isConnected)`)**[span_36](start_span)[span_36](end_span):
   - **Wi-Fi STA 연결됨 (`true`)**: `1,000ms` 간격으로 **Green (`0, 255, 0`)** 점멸[span_37](start_span)[span_37](end_span).
   - **Wi-Fi STA 미연결 (`false`)**: `500ms` 간격으로 **Red (`255, 0, 0`)** 점멸[span_38](start_span)[span_38](end_span).
4. **로깅 출력 및 트래픽 보호 규칙 (`CL_D10_Logger`)**[span_39](start_span)[span_39](end_span):
   - `p_level <= _logLevel` (기본 `EN_L10_LOG_INFO`)인 로그만 처리하며, 256-entry 정적 순환 버퍼(`s_buffer`)에 `millis()`, `level`, `message[128]`를 기록함[span_40](start_span)[span_40](end_span).
   - WebSocket 브로드캐스트(`broadcastLog`)는 연결된 `/ws/log` 클라이언트 수(`s_wsLogs->count()`)가 `0`일 때 JSON 직렬화를 생략하여 `loopTask` 부하를 차단함[span_41](start_span)[span_41](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 전역 인스턴스 및 상수 (`A00_Main_0203.h`, `A20_Const_Const_0203.h`)[span_42](start_span)[span_42](end_span)[span_43](start_span)[span_43](end_span)
- **전역 객체 (`A00_Main_0203.cpp`)**:
  - `g_A20_config_root` (`ST_A20_ConfigRoot_t`), `g_M10_motionLogic` (`CL_M10_MotionLogic*`), `g_A00_server` (`AsyncWebServer`, Port 80), `g_P10_pwm` (`CL_P10_PWM`), `g_A00_ledController` (`CL_A30_LED*`), `A00_getControl()` (`CL_CT10_ControlManager&`)[span_44](start_span)[span_44](end_span)[span_45](start_span)[span_45](end_span)
- **시스템 코어 상수 (`A20_Const`)**:
  - `FW_VERSION = "FW_Ver_2.0.3"`, `FW_VERSION_SEMVER = "2.0.3"`, `G_JSON_VERSION = "0203"`[span_46](start_span)[span_46](end_span)
  - `G_A00_WDT_TIMEOUT_SEC = 10`, `G_A00_LOOP_DELAY_MS = 10`[span_47](start_span)[span_47](end_span)
  - `G_WIFI_RECOVERY_AP_SSID = "NatureWind_Recovery"`, `G_WIFI_RECOVERY_AP_PASS = "2540"`, IP `192.168.4.1/24`, 최대 연결 `4`[span_48](start_span)[span_48](end_span)

### 3.2 주요 공통 유틸리티 및 동기화 클래스 (`A40_Com_Utils_0203.h`)[span_49](start_span)[span_49](end_span)
- **`CL_A40_MutexGuard_Semaphore`**: FreeRTOS 재귀 뮤텍스(`SemaphoreHandle_t`) RAII 가드. 최초 진입 시 Critical Section 밖에서 `xSemaphoreCreateRecursiveMutex()`를 안전하게 지연 생성(Lazy-Init)하고, 기본 `100ms` (`G_A40_MUTEX_TIMEOUT_100`) 타임아웃으로 획득 후 소멸 시 자동 `xSemaphoreGiveRecursive()` 수행[span_50](start_span)[span_50](end_span).
- **`CL_A40_MuxGuard_Critical`**: `portMUX_TYPE` 스핀락 RAII 가드 (`Dirty_setAtomic`, `Dirty_clearAtomic`, `Dirty_readAtomic` 내부 사용)[span_51](start_span)[span_51](end_span).
- **문자열/JSON 안전 헬퍼 (`A40_ComFunc`)**:
  - `clampVal(val, low, high)`, `copyStr2Buffer_safe(dst, src, n)` (`strlcpy` 기반), `cloneStr2SharedStr_safe(src)` (`std::nothrow` + `shared_ptr<char[]>`)[span_52](start_span)[span_52](end_span)
  - `Json_getStr/Num/Bool/Arr`, `Json_copyStrReq`, `Json_pickRootObject` (`containsKey` 금지 정책 준수)[span_53](start_span)[span_53](end_span)
- **룩업 유틸리티 (`A22_Com_Lookup_0203.h`)**:
  - `A20_stepTypeFromString/ToString` (`PRESET`/`FIXED`/`REST`), `A20_modeFromString/ToString`, `A20_findPresetIndexByCode`, `A20_findStyleIndexByCode`[span_54](start_span)[span_54](end_span)

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 부팅 시퀀스 (`A00_init()` 10단계)[span_55](start_span)[span_55](end_span)
1. **LittleFS 마운트**: `LittleFS.begin(true)` (마운트 실패 시 자동 포맷 폴백)[span_56](start_span)[span_56](end_span).
2. **설정 및 NVS 초기화**: `CL_C10_ConfigManager::begin()` → `loadAll(g_A20_config_root)` → `CL_N10_NvsManager::begin()`[span_57](start_span)[span_57](end_span).
3. **필수 섹션 Null 방어**: `system`/`wifi` 누락 시 In-memory 기본값 할당, 할당 실패 시 `NatureWind_Recovery` AP만 기동 후 조기 종료[span_58](start_span)[span_58](end_span).
4. **LED 검증 및 초기화**: `pin` (`0~48` 범위 검증, 이탈 시 `48`), `numPixels` (`1~16` 클램핑) 검증 후 `CL_A30_LED::begin(defaultBrightness)` 실행[span_59](start_span)[span_59](end_span).
5. **Wi-Fi 기동**: `CL_WF10_WiFiManager::init(v_wifi, v_sys)` 호출[span_60](start_span)[span_60](end_span).
6. **시간 관리자 초기화**: `CL_TM10_TimeManager::begin()` 호출[span_61](start_span)[span_61](end_span).
7. **PWM 및 제어 엔진 초기화**: `g_P10_pwm.begin(*system)` → `CL_CT10_ControlManager::begin()` 실행[span_62](start_span)[span_62](end_span).
8. **모션 로직 바인딩**: `CL_M10_MotionLogic::M10_begin()` → `A00_getControl().setMotion(g_M10_motionLogic)` 연결[span_63](start_span)[span_63](end_span).
9. **웹 서버·WS·모니터 기동**: `CL_W10_WebAPI::begin()` → `g_A00_server.begin()` → `CT10_WS_setBrokers()` & `CT10_WS_begin()` → `CL_MON_Monitor::begin()` 실행[span_64](start_span)[span_64](end_span).
10. **Watchdog 등록 및 런타임 설정 반영**: `esp_task_wdt_init(10s, true)` + `esp_task_wdt_add(NULL)` 등록 후 `applySystemRuntimeFromConfig()`로 저장된 로그 레벨/호스트명 적용[span_65](start_span)[span_65](end_span).

### 4.2 메인 루프 실행 시퀀스 (`A00_run()` 9단계)[span_66](start_span)[span_66](end_span)
1. `esp_task_wdt_reset()` — Task Watchdog 피드[span_67](start_span)[span_67](end_span).
2. `CL_CT10_ControlManager::consumePendingReload()` — 대기 중인 설정 리로드(`reloadAll()`) 및 런타임 설정 재적용[span_68](start_span)[span_68](end_span).
3. `CL_CT10_ControlManager::tick()` — 40ms 제어 루프 및 대기 스케줄 갱신[span_69](start_span)[span_69](end_span)[span_70](start_span)[span_70](end_span).
4. `CT10_WS_tick()` — Dirty 기반 WebSocket 채널 우선순위 전송 및 유휴 소켓 정리[span_71](start_span)[span_71](end_span)[span_72](start_span)[span_72](end_span).
5. `g_M10_motionLogic->tick()` — PIR 유지 타이머 감쇠 및 상태 전이[span_73](start_span)[span_73](end_span).
6. `CL_TM10_TimeManager::tick()` — SNTP 타임아웃 감시 및 폴백 서버 전환[span_74](start_span)[span_74](end_span)[span_75](start_span)[span_75](end_span).
7. `CL_MON_Monitor::tick()` — 1초 풍속/30초 센서 샘플링 및 1시간 Cold 플러시[span_76](start_span)[span_76](end_span)[span_77](start_span)[span_77](end_span).
8. `CL_C10_ConfigManager::processPendingFree()` & `CL_N10_NvsManager::tick()` — 3초 유예 만료 설정 포인터 해제 및 10초 주기 NVS 커밋[span_78](start_span)[span_78](end_span)[span_79](start_span)[span_79](end_span)[span_80](start_span)[span_80](end_span).
9. `g_A00_ledController->run(CL_WF10_WiFiManager::isStaConnected())` → `delay(10)`[span_81](start_span)[span_81](end_span).

---

## 5. 외부 인터페이스 명세 (API / WS / Hardware)
- **하드웨어 GPIO 인터페이스**:
  - 상태 LED (`WS2812B` NeoPixel): 기본 `GPIO 48`, `1 Pixel`, 밝기 `20/255` (`NEO_GRB + NEO_KHZ800`)[span_82](start_span)[span_82](end_span)[span_83](start_span)[span_83](end_span)
- **REST & WebSocket 로그 접점**:
  - `GET /api/v001/logs`: `CL_D10_Logger::getLogsAsJson()`을 통해 최근 256건 순환 로그 배열 반환[span_84](start_span)[span_84](end_span)[span_85](start_span)[span_85](end_span)
  - `WS /ws/log`: `CL_D10_Logger::attachWebSocket()` 연동으로 신규 로그 발생 즉시 JSON 푸시[span_86](start_span)[span_86](end_span)[span_87](start_span)[span_87](end_span)

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | 로그 코드 (`D10_Logger`) |
| :--- | :--- | :--- | :--- |
| **LittleFS 마운트 실패** | `LittleFS.begin(true)` 반환 `false`[span_88](start_span)[span_88](end_span) | 자동 포맷 시도 후 In-memory 기본값 모드로 부팅 계속 진행[span_89](start_span)[span_89](end_span) | `[FS] LittleFS mount failed` (`ERROR`)[span_90](start_span)[span_90](end_span) |
| **잘못된 LED 핀/픽셀 설정** | `pin < 0 \|\| pin > 48` 또는 `numPixels == 0 \|\| > 16`[span_91](start_span)[span_91](end_span) | 핀 번호 `48` 강제 보정 및 픽셀 수 `1..16` 클램핑으로 NeoPixel RMT 드라이버 크래시 방지[span_92](start_span)[span_92](end_span) | `[A00] Invalid LED pin=...` (`WARN`)[span_93](start_span)[span_93](end_span) |
| **메인 루프 무한 대기/행(Hang)** | `10초`(`G_A00_WDT_TIMEOUT_SEC`) 동안 `esp_task_wdt_reset()` 미호출[span_94](start_span)[span_94](end_span)[span_95](start_span)[span_95](end_span) | ESP-IDF Task WDT 패닉 트리거로 하드웨어 자동 재부팅 수행[span_96](start_span)[span_96](end_span) | 하드웨어 WDT 리셋 |
| **Critical Section 내 힙 할당 위험** | `CL_A40_MutexGuard_Semaphore` 최초 호출 시[span_97](start_span)[span_97](end_span) | `portENTER_CRITICAL` 진입 전에 `xSemaphoreCreateRecursiveMutex()`를 먼저 생성하고 임계 구역 내에서는 포인터 CAS 대입만 수행하여 패닉 방지[span_98](start_span)[span_98](end_span) | `[A40][...] CreateRecursiveMutex failed` (`ERROR`)[span_99](start_span)[span_99](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **정적 초기화 순서 문제(Static Init Order Fiasco) 회피**:
  - `A00_Main_0203.h`에서는 전역 제어 객체를 직접 노출하지 않고 함수 로컬 정적 싱글턴 참조를 반환하는 `A00_getControl()` 접근자 패턴을 사용함[span_100](start_span)[span_100](end_span)[span_101](start_span)[span_101](end_span).
- **로거 메모리 고정 점유**:
  - `CL_D10_Logger::s_buffer[256]`은 `.bss` 정적 배열(`~34KB`)로 고정 할당되며, `log()` 포맷팅 시 `256B` 스택 버퍼(`vsnprintf`)를 사용하여 동적 힙 할당 없이 동작함[span_102](start_span)[span_102](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-01-01** | 부팅 In-memory 폴백 | LittleFS에서 `cfg_system_0203.json` 및 `.bak`을 모두 삭제한 상태로 부팅 | `[A00] In-memory system defaults applied.` 경고 출력 후 기본 AP(`NatureWind`) 및 웹 서버 정상 기동[span_103](start_span)[span_103](end_span)[span_104](start_span)[span_104](end_span) |
| **TC-01-02** | LED 핀 안전 보정 | `cfg_system_0203.json`에 `hw.led.pin = -5`, `numPixels = 99` 설정 후 부팅 | 크래시 없이 `pin = 48`, `numPixels = 16`으로 보정되어 정상 점멸[span_105](start_span)[span_105](end_span) |
| **TC-01-03** | 상태 LED 연결 연동 | Wi-Fi STA 연결 전후 `CL_A30_LED::run()` 동작 확인 | 미연결 시 `500ms` 주기 Red 점멸, STA IP 획득 즉시 `1000ms` 주기 Green 점멸로 전환[span_106](start_span)[span_106](end_span)[span_107](start_span)[span_107](end_span) |
| **TC-01-04** | 순환 로그 버퍼 오버플로우 | `CL_D10_Logger::log()`를 300회 연속 호출 후 `GET /api/v001/logs` 조회 | 최근 `256`개 엔트리만 유실 없이 시간순으로 반환되고 이전 44개는 정상 덮어쓰기됨[span_108](start_span)[span_108](end_span)[span_109](start_span)[span_109](end_span) |

