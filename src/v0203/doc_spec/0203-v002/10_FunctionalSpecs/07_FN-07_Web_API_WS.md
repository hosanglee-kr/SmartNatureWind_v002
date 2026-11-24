# FN-07. 웹 서버, REST API 및 실시간 통신 기능 명세서

> 📑 [FN-00. 마스터 인덱스로 돌아가기](./00_FN_Master_Index.md)

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-07` / 웹 서버, REST API 및 실시간 통신 (`Web Server, REST API & WebSocket`)
- **관련 소스 파일**:
  - 코어/상수/공통유틸: `W10_Web_0203.h`, `W10_Web_Const_0203.h`, `W10_Web_Routes_0203.cpp`, `W10_Web_Util_0203.cpp`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span)
  - 도메인 라우트 (9파일): `W10_Web_Routes_System_0203.cpp`, `W10_Web_Routes_Network_0203.cpp`, `W10_Web_Routes_Control_0203.cpp`, `W10_Web_Routes_Session_0203.cpp`, `W10_Web_Routes_Config_0203.cpp`, `W10_Web_Routes_CRUD_0203.cpp`, `W10_Web_Routes_WindDict_0203.cpp`, `W10_Web_Routes_Comfort_0203.cpp`, `W10_Web_Routes_Monitor_0203.cpp`[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
  - 정적/업로드/OTA/WS: `W10_Web_Static_0203.cpp`, `W10_Web_Upload_0203.cpp`, `W10_Web_WS_0203.cpp`, `CT10_Ctl_IOWS_0203.cpp`[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)
- **실행 컨텍스트**:
  - HTTP/WS 비동기 이벤트 처리: `async_tcp` (`ESPAsyncWebServer` 콜백 컨텍스트, 힙 할당 및 블로킹 I/O 최소화)[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)
  - 실시간 WS 스케줄링 및 소켓 정리: `loopTask` (`CT10_WS_tick()` 주기 실행)[span_19](start_span)[span_19](end_span)[span_20](start_span)[span_20](end_span)
- **선행 조건 (Pre-condition)**:
  - `LittleFS` 마운트 및 `CL_C10_ConfigManager::loadAll()` 완료[span_21](start_span)[span_21](end_span)
  - `CL_WF10_WiFiManager::init()`로 네트워크 인터페이스(SoftAP 또는 STA) 기동 완료[span_22](start_span)[span_22](end_span)
  - `CL_W10_WebAPI::begin(g_A00_server, A00_getControl())` 및 `CT10_WS_setBrokers()` 호출 완료[span_23](start_span)[span_23](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- ESP32-S3/C3 환경에서 `AsyncWebServer` 기반의 **비동기 RESTful API(v001)**, **Gzip 압축 정적 SPA 리소스 서빙**, **LittleFS 파일 업로드 및 OTA 펌웨어 업데이트**, **5대 실시간 WebSocket 스트리밍 채널**을 제공하여 프론트엔드 대시보드와 백엔드 제어/설정 엔진을 무중단 연결함[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span)[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span)[span_28](start_span)[span_28](end_span).

### 2.2 세부 기능 분할 (`FN-07-01` ~ `FN-07-05`)
- **`FN-07-01` 비동기 웹서버 초기화 및 Gzip 정적 에셋 서빙 (`Routes` / `Static`)**: `cfg_pages_0203.json` 기반 동적 메뉴(`/api/v001/menu`), RFC 7231 `Accept-Encoding` 협상 `.gz` 우선 서빙, SPA 해시 리다이렉트[span_29](start_span)[span_29](end_span)[span_30](start_span)[span_30](end_span)
- **`FN-07-02` 제어·세션·시뮬레이션·쾌적도 REST API (`Control` / `Session` / `Comfort`)**: 팬 제어, Session FSM 전이, 오버라이드, 시뮬레이션 파라미터 및 차트 이력 조회[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span)[span_33](start_span)[span_33](end_span)
- **`FN-07-03` 설정·CRUD·바람사전·모니터링 REST API (`Config` / `CRUD` / `WindDict` / `Monitor`)**: Dirty 저장, 무중단 재로드 위임, 스케줄·프로필·바람사전 CRUD, Warm/Cold 모니터링 및 CSV 내보내기[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span)[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span)
- **`FN-07-04` 시스템·네트워크·파일업로드·OTA REST API (`System` / `Network` / `Upload`)**: 시스템·모션·Wi-Fi 설정 패치, NTP 시각 설정, 2MB 제한 파일 업로드 및 OTA 펌웨어 업데이트[span_38](start_span)[span_38](end_span)[span_39](start_span)[span_39](end_span)[span_40](start_span)[span_40](end_span)
- **`FN-07-05` 5대 WebSocket 실시간 양방향 통신 (`WS` / `CT10_IOWS`)**: 핸드셰이크 인증, 우선순위 기반 1틱 1채널 전송 스케줄링, 대형 차트 자동 스로틀링 및 유휴 클라이언트 정리[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span)

### 2.3 핵심 비즈니스 규칙
1. **비동기 컨텍스트 격리 및 스냅샷 원칙 (`async_tcp` Safety)**:
   - 모든 HTTP/WS 콜백은 `async_tcp` 태스크에서 실행되므로 `g_A20_config_root` 포인터를 직접 역참조하지 않고 반드시 `CL_C10_ConfigManager::getRootSnapshot()`으로 8개 포인터를 원자 캡처한 뒤 직렬화함[span_43](start_span)[span_43](end_span)[span_44](start_span)[span_44](end_span)[span_45](start_span)[span_45](end_span).
   - `POST /api/v001/reload`와 같은 무거운 재초기화 작업은 `async_tcp`에서 직접 수행하지 않고 `CL_CT10_ControlManager::requestReload()` 플래그만 설정 후 `202 Accepted`를 반환하여 `loopTask`에 위임함[span_46](start_span)[span_46](end_span).
2. **단편화 HTTP Body 단일 블록 누적 규칙 (`beginBody` / `appendBody` / `takeBodyBuf` / `freeBody`)**:
   - TCP 패킷 분할 수신(`onBody` 다중 호출)에 대응하기 위해 첫 청크(`p_index == 0`)에서 `ST_W10_BodyAccum` 단일 힙 블록을 할당해 `p_request->_tempObject`에 바인딩하며, 모든 청크 수신 완료 시 파싱 후 `freeBody()`로 즉시 해제하여 클라이언트 연결 단절 시에도 메모리 누수를 방지함[span_47](start_span)[span_47](end_span).
3. **단일 세션 점유 업로드/OTA 규칙 (`s_uploadOwner`)**:
   - `/api/v001/fileUpload` 및 `/api/v001/fwUpdate`는 동시에 1개 클라이언트(`s_uploadOwner`)만 점유 가능하며, 동시 요청 시 `G_W10_UPLOAD_BUSY_TAG`를 마킹해 `429 Too Many Requests`로 거부함. 연결 끊김(`onDisconnect`) 발생 시 열린 `File` 핸들이나 진행 중인 `Update` 세션을 즉시 `close()`/`abort()` 정리함[span_48](start_span)[span_48](end_span).
4. **RFC 7231 준수 Gzip 협상 및 확장자별 경로 매핑 (`W10_Static` / `W10_Upload`)**:
   - `W10_acceptsGzip()`은 `Accept-Encoding` 헤더를 토큰 단위로 파싱하여 `gzip;q=0` 거부 케이스를 정확히 배제하고, 등록 시점에 사전 계산된 `.gz` 경로를 스트리밍함[span_49](start_span)[span_49](end_span).
   - 파일 업로드 시 `extractSafeFileName()`으로 경로 구분자(`/`, `\`), `..`, 선행 `.`을 제거한 뒤 `.json`은 `/json/`, 웹 에셋(`.html/.js/.css/.svg/.png/.ico/.woff2`)은 `/html_v0203/`에 자동 배치함[span_50](start_span)[span_50](end_span).
5. **WebSocket 우선순위 및 대역폭 보호 (`CT10_WS_tick`)**:
   - `wsChConfig[].priority` 오름차순(기본 `state(0) → metrics(1) → chart(2) → summary(3)`)으로 정렬하여 **1틱당 최대 1개 채널**만 전송하며, `/ws/chart` 페이로드가 `chartLargeBytes`(기본 `3,500B`) 이상이면 전송 주기를 `chartThrottleMul`(기본 `2배`)로 자동 완화함[span_51](start_span)[span_51](end_span)[span_52](start_span)[span_52](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 주요 내부 구조체 및 제한 상수 (`W10_Web_0203.h`, `W10_Web_Const_0203.h`)[span_53](start_span)[span_53](end_span)[span_54](start_span)[span_54](end_span)
- **`ST_W10_PageEntry_t` / `ST_W10_MenuState_t`**:
  - `order` (`int`), `uri` (`String`), `path` (`String`), `label` (`String`), `isMain` (`bool`), `enable` (`bool`)[span_55](start_span)[span_55](end_span)
  - `s_menu_state.pages_sorted`: `order` 오름차순 정렬된 메뉴 목록 (`/api/v001/menu` 응답 소스)[span_56](start_span)[span_56](end_span)[span_57](start_span)[span_57](end_span)
- **`ST_W10_BodyAccum` (`W10_Web_Util_0203.cpp`)**:
  - `size_t cap`, `size_t written`, `uint8_t buf[]` (플렉서블 배열 멤버 기반 단일 `malloc` 블록, 최대 `1MB`)[span_58](start_span)[span_58](end_span)
- **경로 및 용량 상수**:
  - `HTTP_API_BASE = "/api/v001"`, `WS_API_BASE = "/ws"`[span_59](start_span)[span_59](end_span)
  - `PATH_STATIC_HTML = "/html_v0203"`, `PATH_STATIC_JSON = "/json"`[span_60](start_span)[span_60](end_span)
  - `G_W10_MAX_UPLOAD_SIZE = 2 * 1024 * 1024` (`2MB`), `W10_MAX_GENERIC_BODY = 1024 * 1024` (`1MB`)[span_61](start_span)[span_61](end_span)[span_62](start_span)[span_62](end_span)

### 3.2 입출력 요약
- **입력 (Input)**:
  - HTTP Request: URI 경로(`/{id}` tail 파싱 포함), Query 파라미터(`type`, `range`, `days`, `since`, `from`, `to`, `all`, `jobId`), Header(`X-API-Key`, `Accept-Encoding`), JSON Body 및 Multipart File Stream[span_63](start_span)[span_63](end_span)[span_64](start_span)[span_64](end_span)[span_65](start_span)[span_65](end_span)[span_66](start_span)[span_66](end_span)[span_67](start_span)[span_67](end_span)[span_68](start_span)[span_68](end_span)
  - WebSocket: 핸드셰이크 쿼리(`?apiKey=...`) 및 연결 이벤트(`WS_EVT_CONNECT`)[span_69](start_span)[span_69](end_span)
- **출력 (Output)**:
  - HTTP Response: JSON(`application/json; charset=utf-8`), CSV(`text/csv; charset=utf-8` 첨부 다운로드), Gzip/정적 파일(`Content-Encoding: gzip`, `Cache-Control`, `X-Content-Type-Options: nosniff`)[span_70](start_span)[span_70](end_span)[span_71](start_span)[span_71](end_span)[span_72](start_span)[span_72](end_span)
  - WebSocket Frame: `/ws/state`, `/ws/metrics`, `/ws/chart`, `/ws/summary`, `/ws/log` 텍스트 JSON 프레임[span_73](start_span)[span_73](end_span)[span_74](start_span)[span_74](end_span)[span_75](start_span)[span_75](end_span)

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 웹 서버 및 라우트 초기화 시퀀스 (`CL_W10_WebAPI::begin`)[span_76](start_span)[span_76](end_span)
1. `s_server = &p_server`, `s_control = &p_control` 바인딩 및 null 검증[span_77](start_span)[span_77](end_span).
2. **도메인별 REST 라우트 등록**:
   - 시스템/네트워크: `routeVersion`, `routeState`, `routeSystem`, `routeDiag`, `routeScan`, `routeWifiState`, `routeAuthTest`, `routeWifiConfig`, `routeTimeSet`, `routeFirmwareCheck`[span_78](start_span)[span_78](end_span)
   - 제어/세션/시뮬레이션: `routeMotion`, `routeSimulation`, `routeSimState`, `routeChartHistory`, `routeMonitor`, `routeControl`, `routeSession`, `routeControlSummary`[span_79](start_span)[span_79](end_span)
   - 설정/CRUD/쾌적도: `routeConfigDirtySave`, `routeConfigInit`, `routeReload`, `routeWindProfile*`, `routeWindDict`, `routeComfort`, `routeSchedules*`, `routeUserProfiles*`[span_80](start_span)[span_80](end_span)
   - 메트릭/로그/AI: `routeMetrics`, `routeLogs`, `routeGeminiProxy`, `routeAIExecuteAction`, `routeAILive`[span_81](start_span)[span_81](end_span)
3. **정적 리소스 및 업로드/WS 등록**: `routeMotionFeed` → `routeStaticAssets` (`W10_registerGzipServe()` + `cfg_pages` 매핑 + 리다이렉트 + `/api/v001/menu`) → `routeUpload` → `routeUpdate` → `routeWebSocket` (`CL_D10_Logger::attachWebSocket` 포함) 순차 등록[span_82](start_span)[span_82](end_span)[span_83](start_span)[span_83](end_span)[span_84](start_span)[span_84](end_span).

### 4.2 비동기 JSON POST/PUT/PATCH 요청 처리 시퀀스 (`_ctlAccumJson` / `_crudAccumJson`)[span_85](start_span)[span_85](end_span)[span_86](start_span)[span_86](end_span)
1. **`onRequest` 단계**: `requireApiKey(p_request)` 검증 후 `contentLength() == 0`이면 즉시 `400 Bad Request` 응답[span_87](start_span)[span_87](end_span)[span_88](start_span)[span_88](end_span).
2. **`onBody` 첫 청크 (`p_index == 0`)**: API Key 재검증 → `p_total` 크기 검증(`0`이면 `400`, `> 1MB`이면 `413`) → `beginBody(p_request, p_total)`로 단일 힙 블록 할당(실패 시 `500 oom`)[span_89](start_span)[span_89](end_span)[span_90](start_span)[span_90](end_span).
3. **`onBody` 누적 (`appendBody`)**: 수신 청크를 버퍼에 복사하고 `written < total`이면 다음 청크 대기[span_91](start_span)[span_91](end_span).
4. **완료 및 실행**: `takeBodyBuf()`로 버퍼 회수 후 `parseJsonBody()` 실행 → `freeBody()`로 힙 메모리 즉시 반환 → `C10_ConfigManager` 또는 `CT10_ControlManager` 도메인 로직 위임 → `sendJson()`으로 HTTP 응답 및 공통 헤더 전송[span_92](start_span)[span_92](end_span)[span_93](start_span)[span_93](end_span)[span_94](start_span)[span_94](end_span).

---

## 5. 외부 인터페이스 명세 (REST API & WebSocket)
전체 45종 REST 엔드포인트 및 5대 WebSocket 채널의 상세 URI, 요청/응답 JSON 스키마, 상태 코드는 **`APP-01. REST API 및 WebSocket 프로토콜 통합 명세서`**를 단일 진실 공급원(SSOT)으로 참조함.

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | HTTP 코드 / 로그 |
| :--- | :--- | :--- | :--- |
| **미인증 API / WS 접근** | `X-API-Key` 헤더 또는 WS 쿼리 `?apiKey` 불일치 (`W10_USE_API_KEY != 0` 시)[span_95](start_span)[span_95](end_span)[span_96](start_span)[span_96](end_span) | 요청 즉시 거부하여 무한 대기(hang) 방지, 업로드/OTA 점유 중이면 즉시 `close`/`abort`[span_97](start_span)[span_97](end_span)[span_98](start_span)[span_98](end_span) | HTTP `401` / WS 핸드셰이크 거부 (`[W10][WS] handshake reject`)[span_99](start_span)[span_99](end_span)[span_100](start_span)[span_100](end_span) |
| **비정상/대용량 JSON 요청** | `contentLength() == 0`, `total > 1MB`, 또는 `deserializeJson()` 에러[span_101](start_span)[span_101](end_span)[span_102](start_span)[span_102](end_span) | `freeBody()`로 할당 버퍼 회수 후 오류 JSON 반환[span_103](start_span)[span_103](end_span)[span_104](start_span)[span_104](end_span) | HTTP `400` / `413` (`[W10] JSON parse error`)[span_105](start_span)[span_105](end_span)[span_106](start_span)[span_106](end_span) |
| **동시 업로드 / OTA 경합** | `s_uploadOwner != nullptr && s_uploadOwner != p_request`[span_107](start_span)[span_107](end_span) | `G_W10_UPLOAD_BUSY_TAG` 설정 후 기존 세션 보호 및 신규 요청 거부[span_108](start_span)[span_108](end_span) | HTTP `429` (`upload busy` / `ota busy`)[span_109](start_span)[span_109](end_span) |
| **업로드 중 클라이언트 단절** | `p_request->onDisconnect` 콜백 트리거[span_110](start_span)[span_110](end_span) | 열린 `s_upFile.close()` 또는 `Update.abort()` 호출 후 `s_uploadOwner = nullptr` 초기화하여 데드락 방지[span_111](start_span)[span_111](end_span) | `[W10] upload abort` (`ERROR`)[span_112](start_span)[span_112](end_span) |
| **LittleFS 공간 부족 / 경로 탐색** | `usedBytes() + contentLength() > totalBytes()`, `extractSafeFileName()`[span_113](start_span)[span_113](end_span) | `..` 및 경로 구분자 제거, 공간 부족 시 파일 생성 중단 및 `s_uploadError = true`[span_114](start_span)[span_114](end_span) | HTTP `500` (`insufficient space`)[span_115](start_span)[span_115](end_span) |
| **정적 에셋 파일 누락** | `LittleFS.exists(gz)` 및 `LittleFS.exists(file)` 모두 실패[span_116](start_span)[span_116](end_span) | 빈 `200` 대신 명확한 `404 Not Found` 반환하여 프론트엔드 오프라인 폴백 로더가 정상 동작하도록 보장[span_117](start_span)[span_117](end_span) | HTTP `404` (`/* missing:... */`)[span_118](start_span)[span_118](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **메모리 및 스택 보호**:
  - `W10_registerStaticRoute()`에서 `.gz` 경로 문자열을 라우트 등록 시점에 1회만 사전 계산(`shared_ptr`)하여 HTTP 요청당 동적 문자열 할당을 0회로 제거함[span_119](start_span)[span_119](end_span).
  - `W10_registerGzipServe()`는 `192B` 스택 버퍼(`snprintf`)를 사용하여 폴더 내 정적 파일 조회 시 힙 단편화를 방지함[span_120](start_span)[span_120](end_span).
  - `CL_D10_Logger::broadcastLog()` 및 `_broadcast()`는 연결된 WS 클라이언트 수(`count()`)가 `0`이면 JSON 직렬화(`serializeJson`) 자체를 생략하여 CPU 사이클을 절약함[span_121](start_span)[span_121](end_span)[span_122](start_span)[span_122](end_span).
- **보안 헤더 및 캐시 최적화**:
  - 모든 응답에 `X-Content-Type-Options: nosniff`를 적용하여 MIME 스니핑 공격을 차단함[span_123](start_span)[span_123](end_span).
  - `.html` 문서는 `Cache-Control: no-cache, must-revalidate`로 최신 UI 반영을 보장하고, JS/CSS/폰트 정적 번들은 `public, max-age=3600` (폴더 서빙 시 `86400`) 캐시 정책을 적용함[span_124](start_span)[span_124](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-07-01** | Gzip 협상 | (A) `Accept-Encoding: gzip, deflate` 헤더, (B) `Accept-Encoding: gzip;q=0` 헤더로 `/index.html` 요청 | (A) `/html_v0203/index.html.gz` 서빙 및 `Content-Encoding: gzip` 반환, (B) 비압축 원본 `/html_v0203/index.html` 반환[span_125](start_span)[span_125](end_span)[span_126](start_span)[span_126](end_span) |
| **TC-07-02** | 단편화 JSON 누적 | 4KB 이상의 대용량 `POST /api/v001/user_profiles` 요청을 다중 TCP 청크로 분할 전송 | `_crudAccumJson`이 모든 청크를 무손실 조립 후 파싱하여 `201 Created` 반환 및 `freeBody()` 메모리 누수 없음[span_127](start_span)[span_127](end_span)[span_128](start_span)[span_128](end_span) |
| **TC-07-03** | 경로 탐색 및 동시 업로드 | 파일명 `../../secrets.json`으로 업로드 요청 및 동시에 두 번째 업로드 요청 전송 | 첫 번째 요청은 `/json/secrets.json`으로 경로 격리 저장, 두 번째 동시 요청은 `429 Too Many Requests` (`upload busy`) 반환[span_129](start_span)[span_129](end_span) |
| **TC-07-04** | WS 초기 푸시 및 스로틀 | `/ws/state` 신규 연결 및 `/ws/chart` 페이로드 크기 `4,000B` (`> 3,500B`) 도달 시 전송 주기 측정 | 연결 직후 현재 전체 상태 JSON 즉시 1회 수신, `/ws/chart` 주기가 `1200ms`에서 `2400ms`(`×2`)로 자동 완화[span_130](start_span)[span_130](end_span)[span_131](start_span)[span_131](end_span)[span_132](start_span)[span_132](end_span) |
| **TC-07-05** | REST CRUD Tail ID 파싱 | `PUT /api/v001/schedules/2` 및 잘못된 경로 `PUT /api/v001/schedules/abc` 요청 | `/schedules/2`는 `schId=2` 항목 수정 후 `200 OK`, `/schedules/abc`는 `_crudExtractTailId` 실패로 `400 Bad Request` 반환[span_133](start_span)[span_133](end_span) |

