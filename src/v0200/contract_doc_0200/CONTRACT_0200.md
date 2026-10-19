# CONTRACT_0200.md — 동시성 경계 및 API 계약

> **기준**: v0200 소스 코드 정적 감사 및 런타임 동시성 검증 완료 상태 (F-01~F-10, I-1~I-5 전면 반영).  
> **목적**: 멀티태스킹 환경(loopTask, async_tcp, WF10_Reconnect 등)에서 태스크 경계, 뮤텍스 획득 순서, 공유 자원 접근 규약 및 위임(Delegation) 패턴을 정의하여 데이터 레이스, 교착 상태(Deadlock), UAF(Use-After-Free)를 원천 차단한다.

---

## 1. 실행 컨텍스트 (FreeRTOS Task) 정의

| 태스크 ID | 태스크 식별자 | 생성 주체 | 우선순위 | 스택 할당 | 핵심 역할 및 설명 |
|---|---|---|---|---|---|
| **T-loop** | `loopTask` | Arduino Core | 1 | 8,192 B | `A00_run()` 메인 주기 루프 실행 (CT10, M10, TM10, N10, LED, 지연 Free) |
| **T-async** | `async_tcp` | ESPAsyncWebServer / AsyncTCP | 1 | 4,096 B | HTTP 비동기 요청 처리, WebSocket 프레임 수신 및 이벤트 핸들러 |
| **T-wf** | `WF10_Reconnect` | `CL_WF10_WiFiManager::_ensureWifiTask` | 1 | 8,192 B | Wi-Fi 연결 및 재연결 전담 (블로킹 분리, WDT 미등록) |
| **T-sys_evt** | `esp_event_loop` | ESP-IDF / Arduino Framework | 시스템 | 3,584 B | Wi-Fi 및 IP 이벤트 콜백 (`WiFi.onEvent`) 실행 |
| **T-IDLE** | `IDLE0 / IDLE1` | FreeRTOS Kernel | 0 | - | 백그라운드 정리 및 전력 관리 |
| **T-timer** | `esp_timer` | ESP-IDF Timer Service | 22 | - | 고정밀 소프트웨어 타이머 및 SNTP 콜백 |

---

## 2. 뮤텍스, 스핀락, 세마포어 인벤토리

| 뮤텍스 / 세마포어 심볼 | 타입 | 초기화 시점 | 획득 타임아웃 | 소유 모듈 및 보호 대상 |
|---|---|---|---|---|
| `CL_CT10_ControlManager::s_stateMutex` | Recursive Mutex | Lazy-init (첫 접근 시) | 100 ms | CT10 장치 제어 상태(`runCtx`), FSM 상태 전이, 오버라이드, 런타임 |
| `CL_C10_ConfigManager::s_recursiveMutex` | Recursive Mutex | `CL_C10_ConfigManager::begin()` | 100 ms | 파일 I/O 및 설정 CRUD/검증 동시성 보호 |
| `CL_C10_ConfigManager::s_rootSwapMux` | `portMUX_TYPE` (Spinlock) | 정적 컴파일 타임 | Critical Section | `g_A20_config_root` 8개 포인터 원자적 스냅샷/스왑 보호 |
| `CL_C10_ConfigManager::s_dirtyflagSpinlock`| `portMUX_TYPE` (Spinlock) | 정적 컴파일 타임 | Critical Section | 8개 섹션의 dirty 플래그 동시 쓰기/읽기 보호 |
| `CL_C10_ConfigManager::s_pendingFreeMux` | `portMUX_TYPE` (Spinlock) | 정적 컴파일 타임 | Critical Section | `s_pendingFree` 2-슬롯 지연 해제 큐 보호 |
| `CL_M10_MotionLogic::s_stateMutex` | Recursive Mutex | Lazy-init (첫 접근 시) | 100 ms | PIR 센서 타이머(`_pir`), 모션 상태 머신(`_state`) 보호 |
| `CL_N10_NvsManager::s_mutex` | Recursive Mutex | Lazy-init (첫 접근 시) | 100 ms | NVS 플래시 런타임 상태(`s_state`) 및 Flush 큐 보호 |
| `CL_WF10_WiFiManager::s_wifiMutex` | Recursive Mutex | Lazy-init (첫 접근 시) | 100 ms / 10 ms | Wi-Fi 연결 상태(`s_staConnected`) 및 상태 문자열 보호 |
| `CL_TM10_TimeManager::s_mutex` | Recursive Mutex | Lazy-init (첫 접근 시) | 100 ms | SNTP 동기화 상태, Fallback 서버 순환 인덱스, 타임존 보호 |
| `CL_S10_Simulation::_recursiveMutex` | Recursive Mutex | `CL_S10_Simulation::begin()` | 100 ms | 바람 시뮬레이션 파라미터, 난류/돌풍 상태, 120-샘플 차트 링버퍼 |
| `CL_WF10_WiFiManager::s_wifiRequestSem` | Binary Semaphore | `_ensureWifiTask` 시점 | Blocking | Wi-Fi 재연결 요청 신호 전달 (T-async give → T-wf take) |

---

## 3. 공유 전역 자원 접근 규약

| 전역 심볼 | 소유 모듈 | 허용된 Reader (읽기) | 허용된 Writer (쓰기) | 동시성 보호 규약 |
|---|---|---|---|---|
| `g_A20_config_root` (8개 섹션 포인터) | C10 | 모든 태스크 | `CL_CT10_ControlManager::reloadAll` 내부 swap만 허용 | 반드시 `CL_C10_ConfigManager::getRootSnapshot(v_snap)`으로 스냅샷 복사 후 접근 |
| `g_A00_server` | A00 | 모든 태스크 | `A00_init()` 초기화 시점만 | 시작 후 라우트 등록/호출 불변 |
| `g_P10_pwm` | A00 | CT10, S10 | `A00_init()` 초기화 시점만 | `CL_P10_PWM::P10_begin` 후 쓰레드 안전 하드웨어 제어 |
| `g_A00_ledController` | A00 | T-loop (`A00_run`) | `A00_init()` 초기화 시점만 | 루프 태스크 단일 제어 |
| `g_M10_motionLogic` | A00/M10 | CT10, A00_run, W10 | `A00_init()` 초기화 시점만 | 내부 `s_stateMutex`로 보호 |
| `A00_getControl()` | A00/CT10 | 모든 태스크 | 싱글톤 내부 상태 | `CL_CT10_ControlManager::instance()` 반환 |

### 3.1 `g_A20_config_root` 원자적 접근 및 생명주기 관리 (핵심 CBD 계약)
1. **읽기 계약**:
   - `g_A20_config_root.system` 등 포인터를 임의로 직접 역참조(`->`)하지 않는다.
   - 반드시 `CL_C10_ConfigManager::getRootSnapshot(v_snap)`을 호출하여 8개 포인터를 로컬 복사본으로 안전하게 캡처한 뒤 사용한다.
2. **쓰기 계약 (스왑)**:
   - 오직 `CL_CT10_ControlManager::reloadAll()` 내부에서만 실행된다.
   - `s_rootSwapMux` 스핀락으로 감싼 임계 구역 내에서 새 루트(`v_new`)와 전역 루트(`g_A20_config_root`)의 포인터만 즉시 교체한다.
3. **지연 해제 (UAF 차단)**:
   - 교체된 이전 루트(`v_old`)는 즉시 해제하지 않고 `CL_C10_ConfigManager::queuePendingFree(v_old)`로 지연 큐에 등록한다.
   - 3초(`PENDING_FREE_GRACE_MS`)의 유예 시간을 부여한 후, `A00_run`에서 주기적으로 호출되는 `CL_C10_ConfigManager::processPendingFree()`를 통해 안전하게 메모리를 해제한다.

---

## 4. 태스크 경계별 함수 호출 매트릭스 (F-03 ~ F-06 반영)

| 피호출 함수 | T-loop | T-async | T-wf | T-sys_evt | 호출 제약 및 비고 |
|---|:---:|:---:|:---:|:---:|---|
| `CL_CT10_ControlManager::tick()` | ✅ | ❌ | ❌ | ❌ | `loopTask` 전용 메인 제어 루프 |
| `CL_CT10_ControlManager::requestReload()` | ❌ | ✅ | ❌ | ❌ | **[F-05]** atomic CAS 플래그 세팅만 수행, 즉시 202 반환 |
| `CL_CT10_ControlManager::consumePendingReload()` | ✅ | ❌ | ❌ | ❌ | `A00_run` 최상단에서만 atomic exchange로 소비 |
| `CL_CT10_ControlManager::reloadAll()` | ✅ | ❌ | ❌ | ❌ | **[F-05]** `loopTask` 컨텍스트에서만 실행 (파일 I/O 블로킹 격리) |
| `CL_CT10_ControlManager::isReloadPending()` | ✅ | ✅ | ❌ | ❌ | **[I-1]** atomic read, REST/WS 상태 노출용 |
| `CL_CT10_ControlManager::exportStateJson_v02()` | ✅ | ✅ | ❌ | ❌ | 호출자 소유(`caller-owned`) JsonDocument에 직렬화 |
| `CT10_WS_tick()` | ✅ | ❌ | ❌ | ❌ | `loopTask` 전용 WebSocket 우선순위 스케줄러 |
| `CL_S10_Simulation::tick()` | 간접 | ❌ | ❌ | ❌ | `CT10::tickLoop` 내부에서만 실행 (직접 호출 금지) |
| `CL_S10_Simulation::patchFromJson()` | ❌ | ✅ | ❌ | ❌ | HTTP 라우트에서 호출, `_recursiveMutex`로 보호 |
| `CL_M10_MotionLogic::feedPIR()` | ❌ | ✅ | ❌ | ❌ | HTTP/MQTT 수신 핸들러 (내부 뮤텍스 보호) |
| `CL_M10_MotionLogic::tick()` | ✅ | ❌ | ❌ | ❌ | **[F-03]** `A00_run` 주기 호출 (PIR holdSec 감쇠) |
| `CL_N10_NvsManager::tick()` | ✅ | ❌ | ❌ | ❌ | **[F-04]** `A00_run` 주기 호출 (10초 게이트 NVS 플러시) |
| `CL_WF10_WiFiManager::requestReconnect()` | ✅ | ✅ | ❌ | ❌ | 바이너리 세마포어 give만 수행, 즉시 반환 |
| `CL_WF10_WiFiManager::applyConfig()` | ❌ | ❌ | ✅ | ❌ | `WF10_Reconnect` 전담 태스크 전용 |
| `CL_WF10_WiFiManager::isStaConnected()` | ✅ | ✅ | ✅ | ✅ | 10ms 짧은 타임아웃으로 상태 확인 |
| `CL_TM10_TimeManager::tick()` | ✅ | ❌ | ❌ | ❌ | `loopTask` 전용 SNTP 감시 루프 |
| `CL_TM10_TimeManager::onWiFiConnected()` | ❌ | ❌ | ✅ | ✅ | **[F-01]** Wi-Fi 연결 이벤트 경로 및 startSTA 성공 경로 |
| `CL_CT10_ControlManager::requestMotionSimApply()` | ❌ | ✅ | ❌ | ❌ | **[F-06]** atomic store 플래그 세팅만 수행 (< 5ms) |
| `CL_CT10_ControlManager::applyMotionSimConfigToSim()` | 내부 | ❌ | ❌ | ❌ | **[I-4]** 클래스 내부 private 캡슐화 (`tickLoop`에서 소비) |
| `CL_C10_ConfigManager::saveDirtyConfigs()` | ❌ | ✅ | ❌ | ❌ | HTTP `/api/v001/config/save` 등에서 동기식 호출 |

### 4.1 W10 정적 웹 에셋 서빙 계약 (Gzip 우선 및 번들링)
1. **Gzip 사전 압축 우선 서빙 규약**:
   - 요청 URI에 대해 `LittleFS.exists(uri + ".gz")`를 우선 탐색한다.
   - `.gz` 파일이 존재할 경우, `request->beginResponse(LittleFS, gzPath, mimeType)` 생성 후 반드시 `response->addHeader("Content-Encoding", "gzip")` 헤더를 부가하여 클라이언트가 자체 압축 해제하도록 위임한다.
   - `.gz` 파일 부재 시에만 비압축 원본 파일 서빙으로 폴백한다.
2. **루트(`/`) 리다이렉트 판정 규약**:
   - 기본 시작 페이지(예: `/P010_main_0200.html`) 검사 시 원본 및 `.gz` 압축본(`exists(firstPage)` || `exists(firstPage + ".gz")`) 모두를 유효한 파일로 인정하여 404 리다이렉트 실패를 방지한다.
3. **번들링 계약**:
   - 메인 대시보드 스크립트는 8개 분할 JS 대신 `P010_bundle_0200.js` 단일 파일로 결합 서빙하여 동시 HTTP 요청 수(11건 → 4건) 및 LWIP TCP PCB 소켓 자원 점유를 최소화한다.

---

## 5. 락 획득 순서 (Lock Ordering) 및 데드락 방지 원칙

교착 상태(Deadlock)를 방지하기 위해 다중 뮤텍스 획득 시 반드시 다음 계층 구조의 상위에서 하위 방향으로만 락을 획득한다:

```text
[계층 1] CL_CT10_ControlManager::s_stateMutex (최상위 제어 락, T-loop)
   │
   ├─► [계층 2-A] CL_S10_Simulation::_recursiveMutex (CT10 tickLoop 내 시뮬레이션 제어 시)
   ├─► [계층 2-B] CL_C10_ConfigManager::s_rootSwapMux (portMUX, 원자 스냅샷/스왑, 초단시간)
   └─► [계층 2-C] CL_C10_ConfigManager::s_recursiveMutex (reloadAll 내부 로드 등 재진입 경로)

[독립 락 계층 (상호 중첩 획득 금지)]
- CL_C10_ConfigManager::s_recursiveMutex (T-async 단독 진입 가능)
- CL_WF10_WiFiManager::s_wifiMutex (T-wf, T-loop, T-sys_evt 독립 사용)
- CL_TM10_TimeManager::s_mutex (모든 태스크 독립 사용)
- CL_N10_NvsManager::s_mutex (T-loop, T-async 독립 사용)
- CL_M10_MotionLogic::s_stateMutex (T-loop, T-async 독립 사용)
```

**절대 금지 사항**:
- ❌ **역방향 락 획득 금지**: S10 락 보유 상태에서 CT10 락을 획득하거나, C10 락 보유 상태에서 CT10 락을 획득하는 행위.
- ❌ **콜백 내 상위 락 획득 금지**: M10의 `_onChange` 콜백 또는 Wi-Fi 이벤트 콜백 내부에서 CT10/C10 동기 뮤텍스를 대기하는 행위.

---

## 6. 비동기 위임(Delegation) 및 지연(Deferred) 패턴

| 패턴명 | 발생 트리거 | 실행 컨텍스트 | 안전성 보장 기제 |
|---|---|---|---|
| **Pending Reload (F-05)** | T-async `requestReload()` | T-loop `consumePendingReload()` → `reloadAll()` | `s_pendingReload` (`std::atomic<bool>`) atomic CAS |
| **Pending Motion.Sim Apply (F-06)** | T-async `requestMotionSimApply()` | T-loop `tickLoop` 시작부 → `applyMotionSimConfigToSim()` | `_pendingMotionSimApply` (`std::atomic<bool>`) atomic store/exchange |
| **Pending Memory Free (E-1)** | `reloadAll()` 완료 시점 | T-loop `CL_C10_ConfigManager::processPendingFree()` | 3초 grace period + 2-슬롯 spinlock 큐 |
| **Dirty Save** | 설정 변경 REST API | T-async `saveDirtyConfigs()` 명시 호출 시 | `s_dirtyflagSpinlock` 스핀락 보호 |
| **WebSocket Broadcast** | 상태 변화 `markDirty()` | T-loop `CT10_WS_tick()` | 채널별 file-static JsonDocument 격리 |
| **Wi-Fi Reconnect** | T-async 재연결 요청 | T-wf `WF10_Reconnect` 전담 태스크 | 바이너리 세마포어 (`s_wifiRequestSem`) |
| **NVS Dirty Flush (F-04)** | 런타임 상태 변경 | T-loop `N10::tick()` | 10초 인터벌 게이트 + `s_dirty.runtime` 플래그 |

---

## 7. 감사 관측 및 이슈 추적표 (Audit Findings)

| ID | 심각도 | 위치 | 결함 내용 및 리스크 | 해결 및 반영 내역 | 상태 |
|---|---|---|---|---|---|
| **F-01** | 🔴 High | `WF10::startSTA` | GOT_IP 이벤트 mutex 경합으로 TM10 통지 누락 시 영구 NTP 미동기 | `startSTA` 성공 시 TM10 명시 직접 통지 경로 추가 | ✅ 해결 |
| **F-02** | 🟡 Mid | `WF10::_ensureWifiTask` | 동시 요청 시 재연결 태스크 이중 `xTaskCreate` 생성 위험 | mutex 보호 및 핸들 double-check 방어 | ✅ 해결 |
| **F-03** | 🔴 High | `A00_run` | `M10::tick()` 호출자 누락으로 PIR holdSec 만료 불가 | `A00_run()` 내에 `g_M10_motionLogic->tick()` 배치 | ✅ 해결 |
| **F-04** | 🔴 High | `A00_run` | `N10::tick()` 호출자 누락으로 런타임 상태 NVS 미저장 | `A00_run()` 내에 `CL_N10_NvsManager::tick()` 배치 | ✅ 해결 |
| **F-05** | 🟡 Mid | `W10 routeReload` | `async_tcp` 태스크가 100~500ms 파일 I/O로 블로킹 | `requestReload()` atomic flag 기반 loopTask 위임 | ✅ 해결 |
| **F-06** | 🟡 Mid | `W10 routeMotion` | `async_tcp`가 CT10 뮤텍스 대기로 최대 100ms 지연 | `requestMotionSimApply()` atomic flag 기반 loopTask 위임 | ✅ 해결 |
| **F-07** | 🟢 Low | `D10 Logger` | 링버퍼 동시 접근 시 데이터 레이스 가능성 | 저부하 우선 원칙에 따라 로그 일부 유실 수용 | ⏸ 수용 |
| **F-08** | 🟢 Low | `A00_run` | `g_A20_config_root.system` raw 역참조 | 동일 loopTask 컨텍스트이므로 저위험 수용 | ⏸ 수용 |
| **F-09** | 🟡 Mid | `M10::isActive` | 부팅 직후 PIR false-positive 활성화 상태 유지 | F-03 tick 배치로 holdSec 경과 후 정상 해소 | ✅ 해결 |
| **F-10** | 🟡 Mid | `async_tcp` 스택 | 4,096 B 할당으로 여유도 낮음 | F-05로 부담 완화, 향후 8,192 B 상향 후보 관리 | ⚠️ 관측 |
| **I-1** | 🟡 Mid | `CT10 export` | reload 완료 시점을 웹 클라이언트가 판별 불가 | `control.pendingReload` 상태 필드 노출 | ✅ 해결 |
| **I-2** | 🟡 Mid | reload + patch | 메모리 패치 후 reload 시 패치 소실 정책 미문서화 | `SPEC_0200.md` §5.1에 영구 저장 선행 원칙 명문화 | ✅ 해결 |
| **I-3** | 🟢 Low | `CT10::begin` | 재시작 시 `_pendingMotionSimApply` 잔재 가능성 | `begin()` 및 `reloadAll()` 시점에 방어적 store(false) | ✅ 해결 |
| **I-4** | 🟢 Low | `CT10` 클래스 | `applyMotionSimConfigToSim` public 노출로 잘못된 호출 위험 | 클래스 private으로 이동 및 내부 위임 소비로 제한 | ✅ 해결 |
| **I-5** | 🟢 Low | reload 사이클 | reload 실행 중 LED 상태 표시 약 500ms 지연 | 사람 체감 불가능한 짧은 순단으로 수용 | ⏸ 수용 |
| **I-6** | 🟢 Low | `W10 Static Router` | 다중 분할 JS 로드로 인한 `async_tcp` LWIP 소켓 고갈 및 플래시 I/O 부하 | 메인 JS 단일 번들(`P010_bundle_0200.js`) 및 전 에셋 Gzip 사전 압축 적용으로 동시 요청 11건→4건 단축 및 LittleFS 73.3% 절감 | ✅ 해결 |

---

## 8. 개정 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-19 | v2.0 | v0200 승격: 소스/문서/에셋 전체 접미사 _0200 단일화 및 LittleFS/main.cpp 빌드 전환 + (v1.2의 Gzip 서빙 계약 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | W10 LittleFS 정적 파일 서빙 시 `.gz` 사전 압축 우선 탐색 및 `Content-Encoding: gzip` 헤더 응답 규약, I-6 웹 에셋 번들/Gzip 최적화 반영 | Antigravity AI |
| 2026-10-19 | v1.1 | v0200 소스 코드 실제 심볼 및 함수 시그니처 정밀 동기화, `_0200.md` 체계 링크 현행화 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 동시성 계약서 작성 | 개발팀 |
