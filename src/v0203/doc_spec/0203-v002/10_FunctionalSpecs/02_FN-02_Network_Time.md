# FN-02. 네트워크 및 시간 동기화 기능 명세서

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-02` / 네트워크 및 시간 동기화 (`Wi-Fi AP/STA Connection & Multi-Server SNTP Sync`)
- **관련 소스 파일**:
  - Wi-Fi 관리자: `WF10_WiFiMgr_0203.h`, `WF10_WiFiMgr_0203.cpp`, `A20_Const_Wifi_0203.h`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)
  - 시간 동기화 관리자: `TM10_TimeMg_0203.h`, `TM10_TimeMg_0203.cpp`, `A20_Const_Const_0203.h`[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)
- **실행 컨텍스트**:
  - 부팅/초기화: `setup()` → `A00_init()` (`CL_WF10_WiFiManager::init()` 및 `CL_TM10_TimeManager::begin()` 호출)[span_6](start_span)[span_6](end_span)
  - 메인 루프 감시: `loopTask` (`A00_run()` → `CL_TM10_TimeManager::tick()` 주기 실행 및 `isStaConnected()` 100Hz lock-free 조회)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)
  - 비동기 Wi-Fi 재연결 태스크: `WF10_Reconnect` (FreeRTOS Task, Stack `8,192B`, Prio `1`, 세마포어 `s_wifiRequestSem` 기반 이벤트 구동)[span_9](start_span)[span_9](end_span)
  - 시스템 이벤트 콜백: `T-sys_evt` (`WiFi.onEvent` 비동기 핸들러) 및 `esp_sntp` 알림 콜백 (`_onSntpTimeSync`)[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)
- **선행 조건 (Pre-condition)**:
  - `CL_C10_ConfigManager::loadAll()` 완료로 `ST_A20_WifiConfig_t` 및 `ST_A20_SystemConfig_t` 스냅샷 조회 가능 상태[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- ESP32-S3/C3의 **Wi-Fi 동작 모드(`AP`, `STA`, `AP+STA`) 전환 및 다중 공유기(`WiFiMulti`) 자동 접속**, **지수 백오프 재연결 및 SoftAP 폴백**, **백그라운드 재연결 전용 FreeRTOS 태스크(`WF10_Reconnect`)**를 운영하며, Wi-Fi 연결 상태와 연동하여 **Primary 1개 + Fallback 3개 NTP 서버 순환 SNTP 동기화 및 타임존(`TZ`) 관리**를 수행함[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span).

### 2.2 세부 기능 분할 (`FN-02-01` ~ `FN-02-02`)
- **`FN-02-01` Wi-Fi STA/AP 연결 및 백그라운드 재접속 상태 머신 (`WF10_WiFiMgr`)**: `wifiMode`(`0=AP, 1=STA, 2=AP+STA`) 분기 초기화, SoftAP 고정 IP(`192.168.4.1/24`) 및 DHCP 제어, `WiFiMulti` 지수 백오프 연결, `DISCONNECTED` 이벤트 자동 재연결(최대 5회), 주변 AP 스캔 및 `WF10_Reconnect` 비동기 재적용[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span)[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)
- **`FN-02-02` 다중 NTP 서버 SNTP 동기화 및 타임존 관리 (`TM10_TimeMg`)**: Wi-Fi 연결/해제 이벤트 연동 SNTP 시작·중지, `15초` 응답 타임아웃 시 폴백 서버 순환 전환, Epoch 유효성(`>= 1700000000`, `2023~2099년`) 검증 및 로컬 시각(`localtime_r`) 제공[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span)

### 2.3 핵심 비즈니스 규칙
1. **Wi-Fi 동작 모드 분기 및 SoftAP 폴백 규칙 (`CL_WF10_WiFiManager::init`)**[span_25](start_span)[span_25](end_span):
   - `wifiMode == 0` (`EN_A20_WIFI_MODE_AP`): `WIFI_AP` 모드로 SoftAP만 단독 기동함[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span).
   - `wifiMode == 1` (`EN_A20_WIFI_MODE_STA`): `WIFI_STA` 모드로 연결을 시도하며, `p_staMaxTries` 내에 실패 시 원격 접속 불능을 막기 위해 자동으로 `WIFI_AP_STA` 모드로 전환하여 SoftAP를 폴백 기동함[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span).
   - `wifiMode == 2` (`EN_A20_WIFI_MODE_AP_STA`, 기본값): SoftAP와 STA를 동시에 기동함[span_30](start_span)[span_30](end_span)[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span).
   - SoftAP 비밀번호(`ap.pass`) 길이가 `8자 미만`인 경우 WPA2 규격 오류를 방지하기 위해 비밀번호를 비워 개방형(Open) AP로 자동 전환함[span_33](start_span)[span_33](end_span).
2. **지수 백오프(Exponential Backoff) 및 자동 복구 규칙 (`WF10`)**[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span):
   - 초기 STA 연결(`startSTA`) 시 `G_WF10_BACKOFF_INIT_MS` (`500ms`)부터 시작해 실패할 때마다 `× 2` (`G_WF10_BACKOFF_MUL`)씩 증가하며 상한 `G_WF10_BACKOFF_MAX_MS` (`4,000ms`)까지 대기 후 재시도함[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span).
   - 런타임 중 `ARDUINO_EVENT_WIFI_STA_DISCONNECTED` 발생 시 `s_reconnectAttempts`가 `G_WF10_RECONNECT_MAX` (`5회`) 미만이면 `WiFi.reconnect()`를 호출하며, IP 획득(`ARDUINO_EVENT_WIFI_STA_GOT_IP`) 시 카운터를 `0`으로 리셋함[span_38](start_span)[span_38](end_span)[span_39](start_span)[span_39](end_span).
3. **lock-free 연결 상태 조회 (`std::atomic<bool> s_staConnected`)**[span_40](start_span)[span_40](end_span)[span_41](start_span)[span_41](end_span):
   - `A00_run()`에서 LED 갱신 등을 위해 고빈도로 호출되는 `isStaConnected()`는 뮤텍스를 잡지 않고 `s_staConnected.load(std::memory_order_acquire) && (WiFi.status() == WL_CONNECTED)`로 즉시 판정하여 `loopTask` 지터를 제거함[span_42](start_span)[span_42](end_span)[span_43](start_span)[span_43](end_span)[span_44](start_span)[span_44](end_span).
4. **비동기 재연결 병합(Coalescing) 규칙 (`requestReconnect` → `_wifiTask`)**[span_45](start_span)[span_45](end_span)[span_46](start_span)[span_46](end_span):
   - 웹 UI(`POST/PATCH /api/v001/wifi/config`)에서 설정 변경 시 `async_tcp`를 블로킹하지 않고 바이너리 세마포어 `s_wifiRequestSem`에 시그널링함. 이미 대기 중인 요청이 있으면 `EN_WF10_REQ_COALESCED` (`1`)를 반환하여 중복 실행을 병합하고, `WF10_Reconnect` 태스크가 최신 스냅샷(`s_wifiSnap`)을 복사해 `applyConfig()`를 실행함[span_47](start_span)[span_47](end_span)[span_48](start_span)[span_48](end_span)[span_49](start_span)[span_49](end_span).
5. **다중 NTP 서버 순환 및 시간 유효성 검증 규칙 (`CL_TM10_TimeManager`)**[span_50](start_span)[span_50](end_span)[span_51](start_span)[span_51](end_span):
   - 서버 풀(총 4개): `s_serverList[0]` = `timeCfg.ntpServer` (기본 `"kr.pool.ntp.org"`), `[1..3]` = `ntpFallbackServers` (`"time.google.com"`, `"pool.ntp.org"`, `"time.cloudflare.com"`)[span_52](start_span)[span_52](end_span)[span_53](start_span)[span_53](end_span).
   - SNTP 요청 후 `G_TM10_SYNC_TIMEOUT_MS` (`15,000ms`) 이내에 콜백이 오지 않으면 `G_TM10_RETRY_BACKOFF_MS` (`2,000ms`) 백오프 후 `_switchToNextServer()`로 다음 인덱스 `(idx + 1) % 4` 서버로 전환함[span_54](start_span)[span_54](end_span)[span_55](start_span)[span_55](end_span).
   - `_isTimeSane()` 검증 기준: `time(nullptr) >= 1700000000UL` (`G_TIME_EPOCH_SANE_MIN`, 2023-11-15 이후) 및 로컬 연도 `2023 <= year <= 2099`[span_56](start_span)[span_56](end_span)[span_57](start_span)[span_57](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 주요 상수 및 상태 구조체 (`WF10_WiFiMgr_0203.h`, `TM10_TimeMg_0203.h`, `A20_Const_Const_0203.h`)[span_58](start_span)[span_58](end_span)[span_59](start_span)[span_59](end_span)[span_60](start_span)[span_60](end_span)
- **Wi-Fi 상수 (`CL_WF10_WiFiManager` & `A20_Const`)**:
  - SoftAP 고정 네트워크: `192.168.4.1`, 서브넷 `255.255.255.0`, 최대 동시 접속 `4` (`G_WIFI_AP_MAX_CONN`), 동적 호스트명 `"NatureWind-%04X"`[span_61](start_span)[span_61](end_span)[span_62](start_span)[span_62](end_span)
  - 재연결 상수: `G_WF10_RECONNECT_MAX = 5`, `BACKOFF_INIT_MS = 500`, `BACKOFF_MUL = 2`, `BACKOFF_MAX_MS = 4000`, `MULTI_RUN_TIMEOUT_MS = 2000`[span_63](start_span)[span_63](end_span)
  - 재연결 요청 결과(`EN_WF10_req_result_t`): `EN_WF10_REQ_OK = 0`, `EN_WF10_REQ_COALESCED = 1`, `EN_WF10_REQ_FAILED = 2`[span_64](start_span)[span_64](end_span)
- **시간 동기화 상수 (`CL_TM10_TimeManager`)**:
  - `G_TM10_SYNC_TIMEOUT_MS = 15000UL` (15초), `G_TM10_RETRY_BACKOFF_MS = 2000UL` (2초)[span_65](start_span)[span_65](end_span)
  - `G_TM10_MIN_SYNC_INTERVAL_MS = 300000UL` (5분), `G_TM10_MAX_SYNC_INTERVAL_MS = 86400000UL` (24시간), 기본 동기화 주기 `6시간` (`21,600,000ms`)[span_66](start_span)[span_66](end_span)[span_67](start_span)[span_67](end_span)
  - `G_TM10_SYNC_RECENT_WINDOW_MS = 600000UL` (최근 10분 이내 동기화 여부 판정 윈도우)[span_68](start_span)[span_68](end_span)

### 3.2 입출력 데이터
- **입력 (Input)**:
  - 설정 스냅샷: `ST_A20_WifiConfig_t` (`wifiMode`, `ap{ssid, pass}`, `sta[0..4]{ssid, pass}`), `ST_A20_SystemConfig_t::timeCfg` (`ntpServer`, `ntpFallbackServers[3]`, `timezone`, `syncIntervalMin`)[span_69](start_span)[span_69](end_span)[span_70](start_span)[span_70](end_span)
  - 시스템 이벤트: `ARDUINO_EVENT_WIFI_STA_START`, `ARDUINO_EVENT_WIFI_STA_GOT_IP`, `ARDUINO_EVENT_WIFI_STA_DISCONNECTED`, SNTP 콜백 `_onSntpTimeSync(struct timeval*)`[span_71](start_span)[span_71](end_span)[span_72](start_span)[span_72](end_span)
- **출력 (Output)**:
  - 네트워크 상태/스캔 JSON: `getWifiStateJson()` (`wifi.state.*`), `scanNetworksToJson()` (`wifi.scan[]`)[span_73](start_span)[span_73](end_span)
  - 시간 상태 및 로컬 시각: `toJson()` (`time.*`), `isTimeValid()`, `isTimeSyncedRecently()`, `getLocalTime(struct tm&)`[span_74](start_span)[span_74](end_span)[span_75](start_span)[span_75](end_span)
  - 모듈 간 트리거: IP 획득 시 `CL_TM10_TimeManager::onWiFiConnected(*v_snap.system)`, 연결 단절 시 `CL_TM10_TimeManager::onWiFiDisconnected()`[span_76](start_span)[span_76](end_span)[span_77](start_span)[span_77](end_span)

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 Wi-Fi 연결 및 시간 동기화 연동 시퀀스
1. **초기화 (`A00_init`)**: `CL_WF10_WiFiManager::init(v_wifi, v_sys)` 호출 → `attachWiFiEvents()` 1회 등록 → `CL_TM10_TimeManager::begin()` 호출 → `_ensureWifiTask()`로 `WF10_Reconnect` 태스크 생성[span_78](start_span)[span_78](end_span)[span_79](start_span)[span_79](end_span).
2. **모드별 기동**: `wifiMode`에 따라 `startAP()`(IP `192.168.4.1`) 및 `startSTA()`(`WiFiMulti`에 최대 5개 AP 등록 후 지수 백오프 연결) 수행[span_80](start_span)[span_80](end_span)[span_81](start_span)[span_81](end_span).
3. **STA IP 획득 (`GOT_IP` 또는 `startSTA` 성공)**:
   - `s_staConnected.store(true)` 및 `s_reconnectAttempts = 0` 설정[span_82](start_span)[span_82](end_span).
   - `C10::getRootSnapshot()`으로 최신 `system` 설정을 캡처하여 `CL_TM10_TimeManager::onWiFiConnected(*v_snap.system)` 호출[span_83](start_span)[span_83](end_span).
4. **SNTP 동기화 시작 (`_startSntpWithServer(0)`)**:
   - `setenv("TZ", s_tz, 1); tzset();`로 타임존 적용 후 `esp_sntp_init()` 실행 및 `s_waitingCallback = true` 설정[span_84](start_span)[span_84](end_span).
5. **동기화 완료 또는 폴백 전환**:
   - 콜백 `_onSntpTimeSync()` 수신 시 `_isTimeSane()` 통과하면 `s_timeValid = true`, `s_lastSyncMs = millis()` 갱신[span_85](start_span)[span_85](end_span).
   - `15초` 내 응답이 없으면 `TM10::tick()`이 `_switchToNextServer()`를 호출하여 다음 NTP 서버(`0 → 1 → 2 → 3 → 0`)로 전환[span_86](start_span)[span_86](end_span).
6. **런타임 Wi-Fi 연결 끊김 (`STA_DISCONNECTED`)**:
   - `s_staConnected.store(false)` 설정 및 `TM10::onWiFiDisconnected()` 호출(`esp_sntp_stop()`, 기존 `s_timeValid`는 RTC 유효성 기반 유지)[span_87](start_span)[span_87](end_span)[span_88](start_span)[span_88](end_span).
   - `s_reconnectAttempts < 5`인 동안 `WiFi.reconnect()` 자동 재시도[span_89](start_span)[span_89](end_span)[span_90](start_span)[span_90](end_span).

---

## 5. 외부 인터페이스 명세 (REST API)
상세 요청/응답 JSON 구조는 **`APP-01` §3.1**을 참조하며, 본 도메인이 처리하는 엔드포인트는 아래와 같음.
- `GET /api/v001/wifi/state` → `CL_WF10_WiFiManager::getWifiStateJson()` (모드, SSID, IP, MAC, RSSI, 호스트명, `connected`, `timeSynced`, `reconnectAttempts`)[span_91](start_span)[span_91](end_span)[span_92](start_span)[span_92](end_span)
- `GET /api/v001/wifi/scan` → `CL_WF10_WiFiManager::scanNetworksToJson()` (주변 AP `ssid`, `rssi`, `chan`, `bssid`, `enc`)[span_93](start_span)[span_93](end_span)[span_94](start_span)[span_94](end_span)
- `GET / POST / PATCH /api/v001/wifi/config` → `patchWifiFromJson()` 저장 후 `CL_WF10_WiFiManager::requestReconnect()` 비동기 재연결 트리거[span_95](start_span)[span_95](end_span)
- `POST /api/v001/system/time/set` → `patchSystemFromJson()` 저장 후 `CL_TM10_TimeManager::applyTimeConfig()` 및 `requestTimeSync()` 즉시 실행[span_96](start_span)[span_96](end_span)

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | 로그 코드 (`D10_Logger`) |
| :--- | :--- | :--- | :--- |
| **STA 단독 모드 연결 실패** | `wifiMode == 1`에서 `startSTA()` `p_maxTries` 초과 실패[span_97](start_span)[span_97](end_span) | 원격 관리 단절 방지를 위해 자동으로 `WIFI_AP_STA` 모드로 전환 후 SoftAP(`NatureWind`) 기동[span_98](start_span)[span_98](end_span)[span_99](start_span)[span_99](end_span) | `[WF10] init: STA fail -> Fallback AP` (`WARN`)[span_100](start_span)[span_100](end_span) |
| **SoftAP 비밀번호 8자 미만** | `strlen(v_pass) < 8`[span_101](start_span)[span_101](end_span) | ESP32 SoftAP 드라이버 거부 방지를 위해 비밀번호를 빈 문자열로 초기화하여 Open AP로 기동[span_102](start_span)[span_102](end_span) | 없음 (무음 보정)[span_103](start_span)[span_103](end_span) |
| **GOT_IP 이벤트 콜백 누락** | 부팅 시 `startSTA()` 동기 루프 내에서 이미 연결 완료된 경우[span_104](start_span)[span_104](end_span) | `startSTA()` 성공 블록에서 `CL_TM10_TimeManager::onWiFiConnected()`를 명시적으로 호출하여 NTP 동기화 누락 방지[span_105](start_span)[span_105](end_span) | `[WF10] startSTA: TM10 notified (explicit, STA up)` (`INFO`)[span_106](start_span)[span_106](end_span) |
| **주 NTP 서버 장애 / 비정상 시각** | `15초` 타임아웃 또는 `_isTimeSane()` 실패 (`epoch < 1700000000`)[span_107](start_span)[span_107](end_span)[span_108](start_span)[span_108](end_span)[span_109](start_span)[span_109](end_span) | 3개 폴백 NTP 서버(`time.google.com` 등)로 자동 순환 전환하며, 동기화 전까지 `isTimeValid() == false`를 반환해 `CT10` 스케줄 오작동 차단[span_110](start_span)[span_110](end_span)[span_111](start_span)[span_111](end_span)[span_112](start_span)[span_112](end_span) | `[TM10] NTP fallback switch: ...` (`WARN`)[span_113](start_span)[span_113](end_span) |
| **Wi-Fi 설정 연속 변경 폭주** | `requestReconnect()` 호출 시 `s_wifiRequestSem` 이미 시그널 상태[span_114](start_span)[span_114](end_span) | `EN_WF10_REQ_COALESCED` 반환으로 중복 재연결 작업을 병합하고 최신 스냅샷 기준으로 1회만 재적용[span_115](start_span)[span_115](end_span)[span_116](start_span)[span_116](end_span)[span_117](start_span)[span_117](end_span) | `[WF10] Reconnect already pending (coalesced)` (`INFO`)[span_118](start_span)[span_118](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **태스크 스택 및 블로킹 격리**:
  - `WiFi.disconnect()` 및 `WiFiMulti.run()`의 블로킹 지연(최대 수 초)이 `async_tcp` 웹 응답이나 `loopTask` 제어 루프를 멈추지 않도록 `WF10_Reconnect` 전용 FreeRTOS 태스크(`8,192B` 스택)에서 격리 실행하며, 실행 후 `uxTaskGetStackHighWaterMark()`로 스택 여유량을 로깅함[span_119](start_span)[span_119](end_span).
  - `CL_TM10_TimeManager`는 블로킹 폴링(`configTime` 대기 루프)을 배제하고 `esp_sntp_set_time_sync_notification_cb` 콜백 방식으로 동작함[span_120](start_span)[span_120](end_span)[span_121](start_span)[span_121](end_span).
- **락 순서 준수**:
  - `T-sys_evt`(`GOT_IP`) 및 `WF10_Reconnect` 태스크는 `C10::getRootSnapshot()`(L1)으로 스냅샷을 먼저 확보한 뒤 `s_wifiMutex`(L3) 및 `TM10::s_mutex`(L3)를 사용하여 데드락을 방지함[span_122](start_span)[span_122](end_span)[span_123](start_span)[span_123](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-02-01** | STA 실패 시 AP 폴백 | 존재하지 않는 공유기 SSID만 등록된 상태에서 `wifiMode = 1` (`STA Only`)로 부팅 | 지수 백오프 재시도 실패 후 자동으로 `WIFI_AP_STA` 전환 및 `192.168.4.1` SoftAP 접속 가능[span_124](start_span)[span_124](end_span)[span_125](start_span)[span_125](end_span) |
| **TC-02-02** | NTP 폴백 서버 전환 | 주 NTP 서버(`kr.pool.ntp.org`)를 응답 불가 주소로 설정 후 Wi-Fi 연결 | `15초` 후 `[TM10] NTP fallback switch` 로그 출력과 함께 `time.google.com`으로 자동 전환되어 시간 동기화 성공[span_126](start_span)[span_126](end_span)[span_127](start_span)[span_127](end_span) |
| **TC-02-03** | 비동기 Wi-Fi 설정 반영 | `PATCH /api/v001/wifi/config`로 새 공유기 정보 전송 및 100ms 이내 연속 2회 호출 | 첫 요청 `status: "requested"`, 두 번째 요청 `status: "coalesced"`로 즉시 HTTP `200` 응답 후 `WF10_Reconnect` 태스크가 백그라운드 재접속 완료[span_128](start_span)[span_128](end_span)[span_129](start_span)[span_129](end_span) |
| **TC-02-04** | 런타임 연결 단절 복구 | STA 연결 중 공유기 전원을 10초간 껐다 켠 뒤 상태 확인 | `STA_DISCONNECTED` 감지 후 `s_staConnected == false` 전환, 공유기 복구 후 5회 이내 자동 재연결 및 `s_reconnectAttempts == 0` 리셋[span_130](start_span)[span_130](end_span)[span_131](start_span)[span_131](end_span) |

