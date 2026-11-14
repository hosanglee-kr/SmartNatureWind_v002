# CONTRACT_0203.md — 동시성 경계 및 API 계약 (v3.9)

> **기준**: v0203 정적 감사 + 런타임 동시성 검증 완료 (F-01~F-10, I-1~I-6, N-1~N-4, G-1~G-3, A-1~A-3, B-1~B-6, C-1~C-8, D-1~D-5, E-1~E-10, E-2.1~E-2.7, F-1~F-10, Batch G 전면 반영).  
> **목적**: 멀티태스킹 환경에서 태스크 경계, 뮤텍스 획득 순서, 공유 자원 접근 규약 및 위임 패턴을 정의하여 데이터 레이스, 교착 상태(Deadlock), UAF를 원천 차단.  
> **파일명 정책**: 계약 문서 `_0203.md` 유지, 코드 참조 `_0203` 접미사.

---

## 🔍 AI 빠른 참조 (섹션 트리거)

| 변경 대상 | §섹션 |
|---|---|
| 태스크 경계·컨텍스트 | [§1](#1-실행-컨텍스트-freertos-task), [§4](#4-태스크-경계별-함수-호출-매트릭스) |
| 뮤텍스·세마포어 | [§2](#2-뮤텍스스핀락세마포어-인벤토리), [§5](#5-락-획득-순서-및-데드락-방지) |
| g_A20_config_root 규약 | [§3.1](#31-g_a20_config_root-생명주기-핵심-cbd-계약) |
| 위임·지연 패턴 | [§6](#6-비동기-위임지연-패턴) |
| Session 위임 락 순서 | [§5.1](#51-session-위임-락-순서-phase-3-adr-1) |
| **활성 규약** (ADR/MON/UX/ROUTE/AI/AUDIT/UI/AUDIT2/UI-11~13) | [§7.11](#711-userprofile--schedule-단일-규격-계약-adr-2-adr-3)~[§7.22](#722-웹-uiux-인터랙션-고도화-및-컴포넌트-격리-계약-ui-11ui-13-b3d06c2-신규) |
| **감사 이력** (F-01~Phase 6, 모두 해결됨) | **AUDIT_LOG_0203.md** |


---

## 📋 목차 (Table of Contents)

1. [실행 컨텍스트 (FreeRTOS Task)](#1-실행-컨텍스트-freertos-task)
2. [뮤텍스/스핀락/세마포어 인벤토리](#2-뮤텍스스핀락세마포어-인벤토리)
   - [2.1 Batch D-4: `s_staConnected` lock-free](#21-batch-d-4-s_staconnected-lock-free)
3. [공유 전역 자원 접근 규약](#3-공유-전역-자원-접근-규약)
   - [3.1 `g_A20_config_root` 생명주기 (핵심 CBD 계약)](#31-g_a20_config_root-생명주기-핵심-cbd-계약)
4. [태스크 경계별 함수 호출 매트릭스](#4-태스크-경계별-함수-호출-매트릭스)
   - [4.1 W10 정적 웹 에셋 서빙 계약](#41-w10-정적-웹-에셋-서빙-계약)
   - [4.2 CT10 캡슐화 위임 계약 (A-2)](#42-ct10-캡슐화-위임-계약-a-2)
   - [4.3 POST/PATCH 공통 헬퍼 계약 (F-2, F-3)](#43-postpatch-공통-헬퍼-계약-f-2-f-3)
   - [4.4 E-2 분할 시 심볼 공유 계약](#44-e-2-분할-시-심볼-공유-계약)
5. [락 획득 순서 및 데드락 방지](#5-락-획득-순서-및-데드락-방지)
   - [5.1 Session 위임 락 순서 (Phase 3, ADR-1)](#51-session-위임-락-순서-phase-3-adr-1)
6. [비동기 위임/지연 패턴](#6-비동기-위임지연-패턴)
7. [감사 관측 및 이슈 추적표](#7-감사-관측-및-이슈-추적표)
   - [7.0 이력 참조 인덱스](#70-이력-참조-인덱스)
   - [7.11 모니터링 저장·조회 계약 (MON-1~MON-3)](#711-모니터링-저장조회-계약-mon-1mon-3)
   - [7.12 모니터링 Cold 저장·CSV 계약 (MON-4~MON-5)](#712-모니터링-cold-저장csv-계약-mon-4mon-5)
   - [7.13 UX 재설계·온보딩·야간 감광 계약 (UX-1~UX-3)](#713-ux-재설계온보딩야간-감광-계약-ux-1ux-3)
   - [7.14 W10 웹 라우팅 및 역직렬화 안전 계약 (ROUTE-1~ROUTE-3)](#714-w10-웹-라우팅-및-역직렬화-안전-계약-route-1route-3)
   - [7.15 AI 제어 및 실시간 음성 안전 계약 (AI-1~AI-6)](#715-ai-제어-및-실시간-음성-안전-계약-ai-1ai-6-stage-8-신규)
   - [7.16 v0203 통합 감사 28대 이슈 해결 및 계약 규약 (AUDIT-1~AUDIT-6)](#716-v0203-통합-감사-28대-이슈-해결-및-계약-규약-audit-1audit-6-0203_012-신규)
   - [7.17 웹 UI/UX 레이아웃 및 인터랙션 계약 (UI-5~UI-8)](#717-웹-uiux-레이아웃-및-인터랙션-계약-ui-5ui-8-stage-9--0203_012-신규)
   - [7.18 2차 통합 감사 이슈 해결 및 계약 규약 (AUDIT2-1~AUDIT2-5)](#718-2차-통합-감사-이슈-해결-및-계약-규약-audit2-1audit2-5-stage-91--0203_012-신규)
8. [개정 이력](#8-개정-이력)

---

## 1. 실행 컨텍스트 (FreeRTOS Task)

| 태스크 ID | 식별자 | 생성 주체 | 우선순위 | 스택 | 역할 |
|---|---|---|---|---|---|
| **T-loop** | `loopTask` | Arduino Core | 1 | 8,192 B | `A00_run()` 메인 주기 루프 |
| **T-async** | `async_tcp` | ESPAsyncWebServer / AsyncTCP | 1 | 4,096 B | HTTP/WebSocket 이벤트 |
| **T-wf** | `WF10_Reconnect` | `_ensureWifiTask` | 1 | 8,192 B | Wi-Fi 재연결 전담 (WDT 미등록) |
| **T-sys_evt** | `esp_event_loop` | ESP-IDF | 시스템 | 3,584 B | Wi-Fi/IP 이벤트 콜백 |
| **T-IDLE** | `IDLE0/1` | FreeRTOS | 0 | - | 백그라운드 정리/전력 |
| **T-timer** | `esp_timer` | ESP-IDF | 22 | - | SNTP 콜백 |

---

## 2. 뮤텍스/스핀락/세마포어 인벤토리

| 심볼 | 타입 | 초기화 | 타임아웃 | 보호 대상 |
|---|---|---|---|---|
| `CT10::s_stateMutex` | Recursive Mutex | Lazy-init | 100 ms | `runCtx`, FSM, override, 런타임, AI 프롬프트 캐시, AutoOff |
| `C10::s_recursiveMutex` | Recursive Mutex | `C10::begin()` | 100 ms | 파일 I/O, 설정 CRUD |
| `C10::s_rootSwapMux` | portMUX | 정적 | Critical | `g_A20_config_root` 8포인터 스냅샷/스왑 |
| `C10::s_dirtyflagSpinlock` | portMUX | 정적 | Critical | 8섹션 dirty 플래그 |
| `C10::s_pendingFreeMux` | portMUX | 정적 | Critical | `s_pendingFree` 2-슬롯 큐 |
| `M10::s_stateMutex` | Recursive Mutex | Lazy-init | 100 ms | `_pir`, `_state` |
| `N10::s_mutex` | Recursive Mutex | Lazy-init | 100 ms | `s_state`, Flush 큐, AI 일일 사용량(`s_aiDailyUsage`) |
| `WF10::s_wifiMutex` | Recursive Mutex | Lazy-init | 100 ms | Wi-Fi 상태, 재연결 태스크 생성 |
| `TM10::s_mutex` | Recursive Mutex | Lazy-init | 100 ms | SNTP 상태, fallback 인덱스 |
| `S10::_recursiveMutex` | Recursive Mutex | `S10::begin()` | 100 ms | 시뮬 파라미터, 120-샘플 링버퍼 |
| `WF10::s_wifiRequestSem` | Binary Sem | `_ensureWifiTask` | Blocking | 재연결 요청 (T-async give → T-wf take) |

### 2.1 Batch D-4: `s_staConnected` lock-free

- **이전**: `s_wifiMutex` 10ms 타임아웃 read
- **이후**: `std::atomic<bool>` load(acquire) + `WiFi.status()` (ESP-IDF 내부 스레드 세이프)
- **효과**: `isStaConnected()` mutex 0ms, T-loop LED 폴링 지터 제거

---

## 3. 공유 전역 자원 접근 규약

| 전역 심볼 | 소유 | Reader | Writer | 보호 규약 |
|---|---|---|---|---|
| `g_A20_config_root` | C10 | 모든 태스크 | `CT10::reloadAll` swap만 | `getRootSnapshot()` 필수 |
| `g_A00_server` | A00 | 모든 태스크 | `A00_init()`만 | 라우트 등록 불변 |
| `g_P10_pwm` | A00 | CT10, S10 | `A00_init()`만 | HW 쓰레드 안전 |
| `g_A00_ledController` | A00 | T-loop | `A00_init()`만 | 루프 단일 제어 |
| `g_M10_motionLogic` | A00/M10 | CT10, A00_run, W10 | `A00_init()`만 | 내부 `s_stateMutex` |
| `A00_getControl()` | A00/CT10 | 모든 태스크 | 싱글톤 내부 | `instance()` 반환 |

### 3.1 `g_A20_config_root` 생명주기 (핵심 CBD 계약)

1. **읽기**: 직접 `->` 역참조 금지. `getRootSnapshot(v_snap)` 8포인터 로컬 복사 후 사용.
2. **쓰기**: 오직 `CT10::reloadAll()` 내부. `s_rootSwapMux` 스핀락 임계 구역에서 포인터 스왑.
3. **지연 해제 (UAF)**: `v_old`는 `queuePendingFree(v_old)` 3초 grace 후 `processPendingFree()` 해제.
4. **화이트리스트 (B-2)**: T-loop 컨텍스트 직접 접근 허용 위치 명시 (A00_run, CT10_Ctl_*, M10). T-async는 `getRootSnapshot()` 필수. 위반 시 코드 리뷰 리젝트.
   - `CT10_Ctl_Ctl_0203.cpp::initRuleFromPayload` (세션 시작, T-async 경유)

---

## 4. 태스크 경계별 함수 호출 매트릭스

| 피호출 함수 | T-loop | T-async | T-wf | T-sys_evt | 제약 |
|---|:---:|:---:|:---:|:---:|---|
| `CT10::tick()` | ✅ | ❌ | ❌ | ❌ | T-loop 전용 |
| `CT10::requestReload()` | ❌ | ✅ | ❌ | ❌ | **F-05** CAS만 (<1μs) |
| `CT10::consumePendingReload()` | ✅ | ❌ | ❌ | ❌ | `A00_run` 최상단만 |
| `CT10::reloadAll()` | ✅ | ❌ | ❌ | ❌ | **F-05** T-loop만 |
| `CT10::isReloadPending()` | ✅ | ✅ | ❌ | ❌ | **I-1** atomic read |
| `CT10::isLastReloadOk()` | ✅ | ✅ | ❌ | ❌ | **N-1** atomic read |
| `CT10::exportStateJson_v02()` | ✅ | ✅ | ❌ | ❌ | caller-owned doc |
| `CT10::feedPIR()` | ❌ | ✅ | ❌ | ❌ | **A-2** s_stateMutex 경유 |
| `CT10::patchSimFromJson()` | ❌ | ✅ | ❌ | ❌ | **A-2** s_stateMutex 경유 |
| `CT10::exportSimJson()` | ❌ | ✅ | ❌ | ❌ | **A-2** s_stateMutex 경유 |
| `CT10::consumeAllDirty()` | ✅ | ❌ | ❌ | ❌ | **D-1** WS 배치 |
| `CT10_WS_tick()` | ✅ | ❌ | ❌ | ❌ | T-loop 전용 |
| `S10::tick()` | 간접 | ❌ | ❌ | ❌ | `CT10::tickLoop` 내부만 |
| `S10::patchFromJson()` | ❌ | ✅ | ❌ | ❌ | HTTP, `_recursiveMutex` |
| `M10::feedPIR()` | ❌ | ✅ | ❌ | ❌ | HTTP, 내부 뮤텍스 |
| `M10::tick()` | ✅ | ❌ | ❌ | ❌ | **F-03** `A00_run` |
| `N10::tick()` | ✅ | ❌ | ❌ | ❌ | **F-04** `A00_run` |
| `WF10::requestReconnect()` | ✅ | ✅ | ❌ | ❌ | sem give, 즉시 반환 |
| `WF10::applyConfig()` | ❌ | ❌ | ✅ | ❌ | T-wf 전담 |
| `WF10::isStaConnected()` | ✅ | ✅ | ✅ | ✅ | **D-4** lock-free |
| `TM10::tick()` | ✅ | ❌ | ❌ | ❌ | T-loop 전용 |
| `TM10::onWiFiConnected()` | ❌ | ❌ | ✅ | ✅ | **F-01** 이벤트/startSTA |
| `CT10::requestMotionSimApply()` | ❌ | ✅ | ❌ | ❌ | **F-06** atomic store |
| `CT10::applyMotionSimConfigToSim()` | 내부 | ❌ | ❌ | ❌ | **I-4** private, tickLoop 소비 |
| `C10::saveDirtyConfigs()` | ❌ | ✅ | ❌ | ❌ | `/config/save` |
| `C10::factoryResetFromDefault()` | ❌ | ✅ | ❌ | ❌ | **F-1** N10::resetRuntime 호출 |
| `CT10::ackEventState()` | ❌ | ✅ | ❌ | ❌ | `/control/ack` s_stateMutex 경유 |
| `W10::W10_registerGzipServe()` | ❌ | ✅ | ❌ | ❌ | **C-G-2** 정규식 `^/html_v0203/.+` |
| `W10::_routeSystemPatchBody()` | ❌ | ✅ | ❌ | ❌ | **F-2** POST/PATCH 헬퍼 |
| `W10::_routeWifiConfigPatchBody()` | ❌ | ✅ | ❌ | ❌ | **F-3** POST/PATCH 헬퍼 |
| `W10::_routeMotionPatchBody()` | ❌ | ✅ | ❌ | ❌ | **[B-6]** POST/PATCH 헬퍼 + getRootSnapshot |
| `W10::_wsHandshakeAuth()` | ❌ | ✅ | ❌ | ❌ | **[B-2]** getRootSnapshot + strlcpy 로컬 복사 |
| `C10::getRootSnapshot()` | ✅ | ✅ | ✅ | ✅ | **[B-2/B-9]** async_tcp 필수 경유 |
| `CT10::requestMotionSimApply()` | ❌ | ✅ | ❌ | ❌ | **F-06** (참조) |
| `N10::flush()` | ✅ | ❌ | ❌ | ❌ | **[B-1]** nvs_commit 1회 (10ms), **[B-7]** 반환값 검사 |

### 4.1 W10 정적 웹 에셋 서빙 계약

1. **Gzip 우선**: `Accept-Encoding` gzip + `.gz` 존재 시만 `Content-Encoding: gzip`. 미지원 시 raw 폴백.
2. **정규식 라우트**: `^/html_v0203/.+` (`W10_registerGzipServe`) 서빙. Long path도 `.gz` 우선.
3. **단일 정적 서빙**: `PATH_STATIC_HTML` (`/html_v0203`) 단일 서빙 (레거시 `/html_v3` 호환 제거).
4. **MIME 자동 판별**: `W10_guessMime` 확장자별 MIME + UTF-8.
5. **Root fallback 안전**: 메인 HTML(`index.html`) 부재 시 404 + 진단 메시지. `exists(x)` || `exists(x+".gz")`.
6. **번들링**: `P010_bundle_0203.js` 단일 파일, 동시 HTTP 11→4건.

### 4.2 CT10 캡슐화 위임 계약 (A-2)

1. `CT10::motion`, `sim`은 **private 멤버**로만 유지.
2. 외부(async_tcp)는 반드시 위임 경유: `feedPIR(bool)`, `patchSimFromJson(JsonDocument&)`, `exportSimJson(JsonDocument&)`.
3. 위임 메서드 내부에서 `s_stateMutex` 먼저 획득 (CONTRACT §5 준수).
4. 직접 접근(`s_control->sim.*`, `s_control->motion->*`) → 코드 리뷰 즉시 반려.

### 4.3 POST/PATCH 공통 헬퍼 계약 (F-2, F-3)

1. `/api/v001/system` POST/PATCH → `_routeSystemPatchBody()` 단일.
2. `/api/v001/wifi/config` POST/PATCH → `_routeWifiConfigPatchBody()` 단일.
3. 헬퍼는 파일 스코프 `static`, `checkApiKey`/`parseJsonBody`/`sendJson` public 정적만 참조.
4. 응답 body 구조(`updated`/`status`/`note`/`need_reboot`)는 POST/PATCH 완전 동일.

### 4.4 E-2 분할 시 심볼 공유 계약

1. **매크로 승격**: 다중 .cpp 참조 매크로 → `*_Internal_0203.h`. 파일 스코프 정의 금지 (예: `G_C10_SCH_ID_START`, `G_C10_PROFILE_ID_START`).
2. **자체 include**: 각 .cpp가 참조 심볼의 헤더 직접 include (예: `A22_Com_Lookup_0203.h`).
3. **정적 멤버 정의 유일성**: `CL_W10_WebAPI::s_server` 등 원본(Core) .cpp에만 정의.
4. **A40 자립성**: `A20_Const_Sch_0203.h` 자체 include (순환 없음).

---

## 5. 락 획득 순서 및 데드락 방지

```text
[계층 1] CT10::s_stateMutex (최상위, T-loop/T-async)
   ├─► [2-A] S10::_recursiveMutex (tickLoop 시뮬)
   ├─► [2-B] C10::s_rootSwapMux (portMUX 스냅샷)
   ├─► [2-C] C10::s_recursiveMutex (reloadAll 내부 로드)
   └─► [2-D] N10::s_mutex (exportStateJson_v02 NVS 런타임 스냅샷 / initAutoOff)

[독립 락 (상호 중첩 금지)]
- C10::s_recursiveMutex (T-async)
- WF10::s_wifiMutex (T-wf/T-loop/T-sys_evt)
- TM10::s_mutex (모든 태스크)
- N10::s_mutex (T-loop/T-async)
- M10::s_stateMutex (T-loop/T-async)
```

**절대 금지**:
- ❌ 역방향 락 획득 (S10 보유 중 CT10 획득 등)
- ❌ 콜백 내 상위 락 획득 (M10 `_onChange`, Wi-Fi 이벤트 콜백 → CT10/C10 대기)
- ❌ A-2 위임 경유 없이 `s_control->sim` 직접 접근

---


### 5.1 Session 위임 락 순서 (Phase 3, ADR-1)

```text
startSession(type, trigger, payload) [T-async]
  │
  └─► s_stateMutex 획득
        │
        ├─► Case PLAYLIST
        │     └─► startUserProfileByNo(profileNo)  [재귀 mutex OK]
        │           ├─► N10::setRunMode() → N10::s_mutex (순차)
        │           ├─► N10::setLastUserProfile()
        │           └─► initAutoOffFromUserProfile() (autoOffRt 갱신)
        │
        ├─► Case PRESET
        │     └─► startOverridePreset(...)  [재귀 mutex OK]
        │           ├─► S20_resolveWindParams() (외부 상태 접근 없음)
        │           └─► applyManualResolved() [재귀 mutex OK]
        │                 ├─► overrideState 갱신
        │                 └─► N10::setOverridePreset() → N10::s_mutex
        │
        └─► Case FIXED
              └─► startOverrideFixed(...)  [재귀 mutex OK]
                    ├─► overrideState 갱신
                    └─► N10::setOverrideFixed() → N10::s_mutex
```

**핵심 원칙**:
- `s_stateMutex` (CT10) → `N10::s_mutex` 순서 고정 (역방향 금지).
- Session 위임 내부 호출은 모두 재귀 mutex → 데드락 없음.
- `pauseSession`은 역순 아님: `s_stateMutex` → (백업) → `sim.stop` → (해제).

## 6. 비동기 위임/지연 패턴

| 패턴 | 트리거 | 실행 | 안전성 |
|---|---|---|---|
| **Pending Reload (F-05)** | T-async `requestReload()` | T-loop `consumePendingReload`→`reloadAll` | `s_pendingReload` atomic CAS |
| **Pending MotionSim (F-06)** | T-async `requestMotionSimApply()` | T-loop `tickLoop` 시작부 → `applyMotionSimConfigToSim` | `_pendingMotionSimApply` atomic |
| **Pending Free (E-1)** | `reloadAll` 완료 | T-loop `processPendingFree()` | 3초 grace + 2슬롯 spinlock |
| **Dirty Save** | REST 설정 변경 | T-async `saveDirtyConfigs()` | `s_dirtyflagSpinlock` |
| **WS Broadcast** | `markDirty()` | T-loop `CT10_WS_tick()` | 채널별 file-static doc |
| **WS Batch (D-1)** | 4채널 dirty | T-loop `consumeAllDirty()` | mutex 1회, 4플래그 |
| **Wi-Fi Reconnect** | T-async 요청 | T-wf 전담 | `s_wifiRequestSem` |
| **NVS Flush (F-04)** | 런타임 변경 | T-loop `N10::tick()` | 10초 게이트 |

---

## 7. 감사 관측 및 이슈 추적표

### 7.0 이력 참조 인덱스

> **안내**: v0203 개발 과정에서 해결 완료된 감사 이력(§7.1~§7.10)은 컨텍스트 절감을 위해 [`AUDIT_LOG_0203.md`](AUDIT_LOG_0203.md)로 이관되었습니다.
> 본 문서에는 현재 시스템에 적용 중인 **활성 규약(§7.11~§7.18)**만 유지합니다.

| 분류 | 대상 범위 | 저장 위치 | 상태 |
|---|---|---|:---:|
| **과거 감사 해결 이력** | §7.1 ~ §7.10 (F-01 ~ Phase 6 감사 46건 및 물리 파이프라인) | [`AUDIT_LOG_0203.md`](AUDIT_LOG_0203.md) | ✅ 해결 완료 |
| **현재 활성 계약 규약** | §7.11 ~ §7.18 (UserProfile, MON, UX, ROUTE, AI, AUDIT, UI, AUDIT2) | 본 문서 하단 | 🟢 활성 준수 |

---

### 7.11 모니터링 저장·조회 계약 (MON-1~MON-3)
- **[MON-1] 스냅샷 캡처**: CT10이 1초 주기 tick에서 Monitor에 불변 스냅샷 전달.
- **[MON-2] 다운샘플링 인터페이스**: 5분(1초 원본, 최대 300점), 30분(5초 평균, 최대 360점), 1시간(30초 평균, 최대 120점).
- **[MON-3] 이벤트 캡처**: State, Config, System 변경 즉시 캡처.

### 7.12 모니터링 Cold 저장·CSV 계약 (MON-4~MON-5)
- **[MON-4] Cold LittleFS 저장**: `/lfs/monitor/` 디렉토리에 5개 바이너리 파일 영구 보관 (1시간 배치 flush).
- **[MON-5] 지난 이벤트 + CSV**: `/api/v001/monitor/events?days={1|3|7}` 및 `/api/v001/monitor/export?type=wind&range={5m|30m|1h}&all={0|1}`.

### 7.13 UX 재설계·온보딩·야간 감광 계약 (UX-1~UX-3)
- **[UX-1] 시뮬레이션 페이지 정체성**: 파라미터 덤프에서 직관적인 '바람 체험실'로 재설계.
- **[UX-2] 첫 방문 온보딩**: `localStorage['snw.onboarded']` 기반 1회 온보딩 팝업 제공.
- **[UX-3] 야간 감광**: 22:00~06:00 야간 시간대 `.snw-night-mode` 밝기 75% 감광 및 소음 사전 경고.

### 7.14 W10 웹 라우팅 및 역직렬화 안전 계약 (ROUTE-1~ROUTE-3)
- **[ROUTE-1] REST API ID 매핑**: 정규식 라우트 대신 `/:id` 라우트 패턴을 사용하며, `p_request->hasParam("id")` 유효성 검사 후 `p_request->getParam("id")->value().toInt()`로 안전하게 ID를 추출한다.
- **[ROUTE-2] 정적 Gzip 호스팅**: 정규식 라우트 대신 `s_server->onNotFound` 핸들러에서 URL의 `PATH_STATIC_HTML` 접두사 일치 여부를 검사하고 `.gz` 우선 서빙을 수행하여 `ASYNCWEBSERVER_REGEX` 매크로 비활성화 환경에서도 안전하게 정적 자산을 제공한다.
- **[ROUTE-3] ArduinoJson v7 역직렬화 타입 안전성**: `containsKey` 비권장 API를 배제하고, `obj["field"].is<T>()`를 통한 타입 검사 및 `obj["field"].as<T>()` / `A40_ComFunc::Json_getNum` 헬퍼를 통해 누락 필드 및 타입 불일치 크래시를 원천 방지한다.

### 7.15 AI 제어 및 실시간 음성 안전 계약 (AI-1~AI-6) (Stage 8 신규)
- **[AI-1] 위험 명령 격리 및 15종 원천 차단**: AI 자연어 도구 실행 시 재부팅(`reboot`), 와이파이 변경(`wifi_modify`), 공장 초기화(`factory_reset`), 파일시스템 포맷(`format_fs`), 직접 메모리 쓰기 등 15종 파괴 명령은 C++ `CT10_AI::isDangerousAction()`에서 100% 거부(400 Bad Request)된다.
- **[AI-2] Tool Calling 실행의 FSM 위임 원칙**: AI 액션(`turn_on`, `start_preset`, `add_schedule` 등)은 `CT10` 공개 제어 함수(`startOverridePreset`, `addScheduleItem` 등)를 경유하며, `runCtx` FSM 상태나 하드웨어 PWM을 직통 조작하지 않는다.
- **[AI-3] Live 세션 30분 상한 및 403 Forbidden 강제 차단**: Gemini Live 실시간 음성 연결은 세션당 최대 30분(1800초)으로 강제 제한되며, 상한 도달 시 클라이언트는 REST 모드로 자동 복귀하고 신규 Live 토큰 발급은 403 Forbidden으로 차단된다.
- **[AI-4] 일일 비용 가드레일 및 NVS 4키 영구 누적**: 금일 누적 비용($0.50 초과 방지)과 세션 초는 NVS 키(`ai_rst_dt`, `ai_a_s`, `ai_t_c`, `ai_cos`)에 기록되며, 날짜 변경 시 자동 자정 리셋된다.
- **[AI-5] 오디오 인라인 Blob AudioWorklet 및 Barge-in Flush**: 마이크 캡처는 별도 파일 없이 인라인 Blob AudioWorklet(16kHz PCM16)으로 전송되며, Gemini 응답 음성(24kHz PCM16) 수신 중 사용자 발화(Interruption) 발생 시 오디오 버퍼 큐를 즉시 Flush하여 음성 겹침을 방지한다.
- **[AI-6] 프롬프트 캐싱 (30초 만료)을 통한 자원 보호**: 시스템 프롬프트 생성(`buildAIPromptStrict`)은 30초 파일 스코프 캐시를 유지하여 빈번한 AI 요청 중에도 I2C 센서 블로킹 및 힙 파편화를 0으로 억제한다.

### 7.16 v0203 통합 감사 28대 이슈 해결 및 계약 규약 (AUDIT-1~AUDIT-6) (0203_012 신규)
- **[AUDIT-1] FactoryReset SPA 단일 스키마 (BE-P0-1)**: `A20_resetWebPageDefault`는 구버전 `/html_v3/` 및 복수 HTML 페이지를 전면 배제하고, 단일 `/html_v0203/index.html`과 `P010_bundle_0203.js`, `P000_common_0203.css` SPA 스키마만 초기화하여 리셋 후 웹 서빙 불능을 차단한다.
- **[AUDIT-2] AI Action의 CRUD 헬퍼 필수 경유 (BE-P0-2, BE-P1-6)**: `executeAddProfile`과 `add_schedule`은 C10 설정을 직접 조작하지 않고 `addUserProfilesFromJson` 등 표준 CRUD 헬퍼에 위임하여 ID 자동 발급, 중복 검증, profileId 유효성 검증을 100% 강제한다.
- **[AUDIT-3] T-async 컨텍스트 getRootSnapshot 원자 캡처 (BE-P0-3)**: `startOverridePreset` 등 비동기 요청 핸들러에서 `g_A20_config_root` 접근 시 직접 참조를 금지하고 `getRootSnapshot()`을 통해 포인터 원자 스냅샷을 획득하여 Torn read 및 UAF를 방지한다.
- **[AUDIT-4] T-loop WS 브로드캐스트 가드 (BE-P1-5)**: `D10_Logger::broadcastLog`는 WS 활성 클라이언트가 0일 경우 JSON 직렬화 및 `textAll` 호출을 즉시 스킵하여 `loopTask` 지연을 방지한다.
- **[AUDIT-5] C10 부팅 실패 시 Recovery AP 폴백 (BE-P1-2, BE-P1-3)**: `CL_C10_ConfigManager::begin()` 실패 시 벽돌화를 방지하고 B-11 규약에 따라 Recovery AP로 부팅하며, 부팅 완료 시 `applySystemRuntimeFromConfig()`를 호출하여 사용자 저장 런타임 설정을 즉시 반영한다.
- **[AUDIT-6] SSOT 자동 대조 CI 게이트 (AUDIT-CI)**: `validate_contracts.py`를 통해 문서(SPEC/README/BUDGET), C++ 헤더(W10_Web_Const/W10_AI_Limits), 프론트엔드 config/offline 어댑터 간 경로/상수/FSM 상태명 정합성을 빌드 파이프라인(`pio_gzip_0203.py`)에서 자동 검증한다.

### 7.17 웹 UI/UX 레이아웃 및 인터랙션 계약 (UI-5~UI-8) (Stage 9 / 0203_012 신규)
- **[UI-5] 모바일 하단 뷰포트 레이아웃 스택 표준화 (ADR-9)**: 모바일 하단 탭 바(60px), Now Playing Bar(48px), 전역 플로팅 AI FAB(54px), 토스트 호스트 간 겹침 방지를 위해 CSS 변수 기반 동적 스택을 적용한다. Now Playing Bar 가동 시 `body.has-nowplaying` 클래스를 자동 토글하여 AI FAB과 토스트를 76px에서 124px로 0.25s 동안 자동 부상시키며, 메인 콘텐츠 `padding-bottom`을 80px에서 128px로 확장하여 스크롤 끝단 가림을 원천 차단한다.
- **[UI-6] 모바일 터치 타깃 44px 접근성 보장**: 대시보드 바람 스타일 5종 탭 버튼의 최소 터치 높이를 44px(`min-height: 44px`)로 강제하여 모바일 접근성 표준을 준수하고 오터치를 방지한다.
- **[UI-7] Now Playing Bar 상세 확장 모달 규약**: Now Playing Bar 좌측 영역 탭(`data-action="expand"`) 시 단순 페이지 이동 대신 `showNowPlayingDetailsModal()`을 호출하여 세션 상세 정보(종류/스텝/남은 시간)를 확인하고 [▶ 재개/⏸ 일시정지], [⏹ 정지], [⏱️ 타이머 설정 바로가기]를 원스톱 제어한다.
- **[UI-8] 물리 Override 상태 가시화 및 원클릭 복원 규약**: Wind Studio 등에서 물리 파라미터(강도/변동성/돌풍)를 수동 조작했을 때 `[수동 튜닝됨]` 뱃지를 표시하고, 원클릭 `[↺ 기본값 원복]` 액션(`_resetOverrideToDefaults`)을 통해 선택된 프리셋의 기준 물리값으로 즉각 되돌릴 수 있는 수단을 필수 제공한다.

### 7.18 2차 통합 감사 이슈 해결 및 계약 규약 (AUDIT2-1~AUDIT2-5) (Stage 9.1 / 0203_012 신규)
- **[AUDIT2-1] AI Live 토큰 및 경로 인증 보안 강화 (BE-P0-NEW-2, BE-P0-NEW-3)**: `/api/v001/ai/live-config` 등 6대 AI 라우트에 `checkApiKey()` 인가 가드를 전면 강제하여 평문 API Key 노출을 차단하고, 요청 본문 단편화 버퍼 검사(`index + len != total`) 및 0바이트 페이로드 가드로 파싱 크래시를 원천 방어한다.
- **[AUDIT2-2] Gemini 도구 선언 단일 위임 (SSOT) 원칙 (BE-P0-NEW-2)**: `W10_Web_Routes_AILive_0203.cpp`의 하드코딩 도구 목록을 제거하고 `CT10_AI::appendAIFunctionDeclarations()` 단일 진실 공급원에 전면 위임하여 REST/Live 도구 선언 동기화 100%를 보장한다.
- **[AUDIT2-3] Gemini REST API Parts Object 스키마 준수 (BE-P0-NEW-1)**: Google Generative AI REST 스키마에 따라 `parts` 배열 항목을 원시 문자열 대신 `[{"text": "..."}]` 객체로 엄격 직렬화하여 400 Bad Request 파싱 오류를 원천 차단한다.
- **[AUDIT2-4] 프론트엔드 세션 스토어 정규화 헬퍼 규약 (R-1 / FE-P0-NEW-3, FE-P1-NEW-4)**: `060.store.js`의 `normalizeSession()` 헬퍼를 통해 백엔드 숫자형 `type`(0~3)과 문자열 `typeName`('NONE'|'PLAYLIST'|'PRESET'|'FIXED'), `triggerName`, `state`를 사전 정규화하여 렌더링 시 `undefined` 미표시 및 금지된 `'RUNNING'` 상태 오판을 차단한다.
- **[AUDIT2-5] 데스크톱 영구 사이드바 그리드 규약 (ADR-10)**: 화면 폭 1024px 이상에서는 `.snw-app`에 2열 그리드(`var(--snw-sidebar-w) 1fr`)를 적용하고 `#btn-menu`를 은닉하며 라우터 전환 시 사이드바를 상시 유지하여 대화면 탐색 편의성을 보장한다.

### 7.20 Comfort 자동 모드 및 Stage 10 동시성 규약 (Stage 10 신규)

- **[COMFORT-1] AutoOff 래치 우선 억제 계약**: `tickAutoComfort`는 `runCtx.state == EN_CT10_STATE_AUTOOFF_STOPPED`이거나 `_autoOffLatched == true`인 경우 세션을 기동하지 않고 조기 리턴하여 AutoOff 전원 차단 안전을 최우선 보장한다.
- **[COMFORT-2] 락 획득 순서 엄수 계약**: `setAutoComfort(bool)`는 `s_stateMutex`를 먼저 획득한 상태에서 `CL_N10_NvsManager::setAutoComfort()`(내부 `N10::s_mutex` 획득)를 호출하여 CONTRACT §5.1 순서(`s_stateMutex` → `N10::s_mutex`)를 엄격히 준수한다.
- **[UI-10] Comfort 5상태 매트릭스 및 자동 배지 계약**: `autoComfortEnabled`에 의해 기동된 세션은 Now Playing Bar에 `[🌱 자동]` 배지를 상시 동기화 표출하며, 대시보드에서는 5상태(`is-waiting`, `is-running`, `is-user-priority`, `is-suspended`, `OFF`)를 명확히 가시화하고 AutoOff 래치 시 `[재개]` 액션을 제공한다.

### 7.21 하드웨어 백엔드 타이머 신뢰성 및 안전 계약 (TIMER-1~TIMER-3) (Stage 10.1 신규)

- **[TIMER-1] 하드웨어 백엔드 타이머 신뢰성 계약**: 타이머 설정(`POST /api/v001/control/timer` 또는 AI `set_timer`) 시 백엔드 런타임 타이머(`_session.runtimeAutoOffMin`)에 동기 등록되어, 사용자가 브라우저를 닫거나 단말기 전원이 꺼진 오프라인 상태에서도 10ms 주기 메인 루프에서 기기 자체적으로 세션이 안전하게 정지(`stopSession()`)된다.
- **[TIMER-2] Comfort 자동 모드 재기동 억제 계약**: 하드웨어 타이머 만료 시 백엔드는 세션 정지와 동시에 `setAutoComfort(false)`를 호출하여 자동 모드를 영구 해제함으로써, 5분 후 환경 평가로 인한 원치 않는 기기 재기동을 원천 차단한다.
- **[TIMER-3] 브라우저-백엔드 동기 실패 경고 계약**: 웹 클라이언트(`TimerManager`)에서 백엔드 타이머 등록 실패 시, 사일런트 무시를 금지하고 `SNW.ToastUtil.warn`을 통해 사용자에게 브라우저 종속 타이머 위험(창 닫힘 시 유실)을 명확히 고지해야 한다.

### 7.22 웹 UI/UX 인터랙션 고도화 및 컴포넌트 격리 계약 (UI-11~UI-13) (b3d06c2 신규)

- **[UI-11] 모니터 히스토리 타임라인 엇갈림 배치 계약**: 모니터 '히스토리' 탭의 이벤트 타임라인은 16px 좌우 여백을 두어 0%/100% 위치의 마커 잘림을 방지하고, 5% 이내 인접 이벤트는 위/아래 2단 레인(지그재그)으로 교차 배치하여 마커 겹침을 방지한다. 하단 시간축(`snw-retro-timeline__axis`)에 시작/종료 라벨을 표시하고 7일 조회 시 'MM/DD HH:mm' 포맷을 적용한다.
- **[UI-12] 스튜디오 액션바 분리 및 AI FAB 은닉 계약**: Wind Studio 화면 활성화 시 하단 액션바(`snw-studio__bar`)를 좌측(`🎬 미리보기`)과 우측(`취소` / `저장/업데이트`)으로 분리 정렬하고 z-index를 1000으로 격상한다. 편집 시야 가림을 방지하기 위해 Studio 화면 활성화 시 우하단 AI FAB 버튼을 CSS 상에서 강제 은닉(`body:has(.snw-studio__bar) .snw-ai-fab { display: none !important; }`)한다.
- **[UI-13] AI 어시스턴트 세그먼트 컨트롤 및 스마트 입력창 계약**: REST/Live 모드 전환은 `.snw-btn-group` 세그먼트 컨트롤로 단일화하고 비용 배지는 말줄임(`white-space: nowrap`, `text-overflow: ellipsis`)으로 2줄 개행을 방지한다. 대화 입력창(textarea)은 초기 1줄에서 입력 길이에 맞춰 최대 120px까지 동적 확장되어 가독성과 입력 편의성을 보장한다.

### 7.23 Pause/Stop 이원화 결정 규칙 (Stage 6 신규)

- **[PAUSE-STOP-1] 온도·DI 이원화 계약**: `tempLow.mode` / `diLow.mode`가 `PAUSE`이면 `ENV_PAUSED(7)` + `pauseReason`으로 진입하며 히스테리시스 재개. `STOP`이면 `AUTOOFF_STOPPED(5)` + reason 12/13으로 래치 진입, 사용자 ACK까지 유지.
- **[PAUSE-STOP-2] PIR 고정 PAUSE**: `pirPause`는 mode 없이 **항상 PAUSE**. `pauseMask` 비트 0.
- **[PAUSE-STOP-3] 다중 Pause 래치**: `pauseMask`에 여러 비트 활성 시, **모두 해소되어야 재개** (`pauseMask == 0`). 대표 `pauseReason`은 우선순위 (PIR > TEMP > DI).
- **[PAUSE-STOP-4] 환경 센서 1초 게이트**: 온도/DI 판정은 `lastEnvCheckMs` 기준 1초 주기 (WCET 예산 25ms 준수). PIR은 게이트 없이 매 tick 판정.
- **[PAUSE-STOP-5] 세션 스냅샷 우선**: `_session.rule`에 세션 시작 시 복사된 규칙만 사용. 세션 중 `profile.rule` 수정은 다음 세션부터 반영 (정책 A 확정).
- **[PAUSE-STOP-6] AUTO 중 사용자 개입**: `AUTO_FULL`/`AUTO_SELECT` 세션 중 사용자 슬라이더/프리셋 조작 시 `_session.trigger` → `MANUAL`로 **즉시 전환**. `tickAutoComfort`의 AUTO 재평가 중단 (정책 A 확정).
- **[PAUSE-STOP-7] `nextPauseReason` 전달**: `ST_CT10_Decision_t`에 `nextPauseReason` 필드 필수. `applyDecision()`에서 `onTriggerPause(p_d.nextPauseReason)` 호출. **`runCtx.pauseReason`을 Decision에서 명시 전달** (이전 값 유지 금지).
- **[PAUSE-STOP-8] PIR 시작 유예**: `_session.startedAt > 0 && (now - _session.startedAt) < holdMs` 구간에서는 `pirPause` 부재(`absent`) 판정을 유예한다.
- **[PAUSE-STOP-9] ENV_PAUSED 수동 재개 1시간 유예**: `POST /api/v001/session/resume` 시 `triggerRt.pauseBypassUntilMs = millis() + 3600000UL`, `pauseMask = 0` 설정. 유예 중 PAUSE 갱신은 스킵하되 STOP 조건(타이머/예약시각/STOP 임계)은 정상 감시한다.
- **[RULE-LIVE-1] 가동 중 규칙 실시간 갱신**: `PATCH /api/v001/session/rule` → `updateActiveSessionRule()` (`s_stateMutex` 보호 하에 `C10_fromJson_TriggerRule` + `applyRuleToTriggerRt()`, `timerStartMs`/`pausedAccumMs` 보존). `exportStateJson_v02()`에 `_session.autoSwitchReason[64]`/`autoSwitchAtMs` 직렬화.

### 7.24 AUTO_FULL / AUTO_SELECT 위임 계약 (Stage 6 신규)

- **[AUTO-1] trigger 강제 매핑**: `startSession(AUTO_FULL, ...)` 호출 시 `trigger`는 **반드시** `MANUAL_AUTO_FULL(4)`. 클라이언트가 임의 trigger 지정해도 W10 라우트에서 강제 덮어씀.
- **[AUTO-2] AUTO_SELECT base 고정**: `autoSelect.baseType`(PRESET/PLAYLIST)과 `basePresetCode`/`baseProfileId`는 세션 시작 시 확정. 세션 중 변경 불가 (다음 세션에 반영).
- **[AUTO-3] AUTO_FULL 재평가 주기**: `tickAutoComfort()` 5분 주기 (`AUTO_COMFORT_INTERVAL_MS = 300000`). 환경 변화 시 프리셋 자동 전환 (S10 crossfade).
- **[AUTO-4] AUTO 중 Pause/Stop 우선**: `checkTriggers()`가 AUTO 세션에도 동일 적용. ENV_PAUSED 진입 시 `tickAutoComfort` 재평가 스킵, STOP 진입 시 세션 종료.
- **[AUTO-5] AUTO 세션의 스냅샷 rule**: `_session.rule`은 세션 시작 시 확정. AUTO_FULL 재평가 시에도 rule은 변경 안 함 (재평가는 프리셋/스타일만).
- **[AUTO-6] rule 전역 기본값**: `payload.rule` 부재 시 `A20_resetTriggerRuleDefault()` 결과 사용 (모든 트리거 disabled). **사용자 명시 rule 없으면 자동 정지 미작동**.

---

## 8. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-11-14** | **v3.9** | **Phase 2 — Pause/Stop 이원화 + AUTO 위임 계약**: §3.1 `initRuleFromPayload` 화이트리스트 추가, §7.23 `PAUSE-STOP-1~9` 및 `RULE-LIVE-1` 신규 (히스테리시스·`pauseMask`·세션 스냅샷·AUTO 개입·유예·실시간 규칙 갱신), §7.24 `AUTO-1~6` 신규 (trigger 강제·base 고정·재평가·rule 스냅샷) | Antigravity AI |
| **2026-11-10** | **v3.8** | **웹 UI/UX 인터랙션 고도화 및 컴포넌트 격리 계약 (§7.22 UI-11~UI-13, b3d06c2)**: 모니터 히스토리 2단 지그재그 타임라인/시간축 규약(UI-11), 스튜디오 하단 분리 액션바 및 AI FAB 강제 은닉 규약(UI-12), AI 어시스턴트 세그먼트 컨트롤 및 자동 신축 입력창 규약(UI-13) 명시 | Antigravity AI |
| **2026-11-09** | **v3.7** | **Stage 10.1 하드웨어 백엔드 타이머 신뢰성 및 안전 계약 (§7.21 TIMER-1~TIMER-3, UI-10 갱신, 0203_013_20_02)**: 하드웨어 백엔드 타이머 신뢰성 계약(TIMER-1), 만료 시 Comfort 재기동 억제(TIMER-2: setAutoComfort(false)), 브라우저 동기 실패 경고(TIMER-3), Comfort 5상태 매트릭스 UI-10 명시 | Antigravity AI |
| **2026-11-09** | **v3.6** | **Stage 10 IA 재설계 및 Comfort 자동 모드 (0203_013)**: §7.20 COMFORT-1(AutoOff 래치 억제), COMFORT-2(락 획득 순서 준수), UI-10(Now Playing 자동 배지 표출) 동시성 및 안전 계약 추가 | Antigravity AI |
| **2026-11-09** | **v3.5** | **AI 빠른 참조 §링크 강화 (Phase B)**: TOC anchor 기반 [§N.M](#anchor) 자동 변환, src/v0203/tools_0203/enhance_index_links_0203.py 추가, --verify로 anchor 유효성 검증 | Antigravity AI |
| **2026-11-08** | **v3.4** | **Stage 9.1 2차 통합 감사 19대 이슈 해결 및 계약 규약 신설 (§7.18 AUDIT2-1~AUDIT2-5, 0203_012)**: AI Live 토큰 및 경로 인증 보안 강화(checkApiKey 6대 라우트 강제 및 본문 단편화 가드), Gemini 도구 선언 CT10_AI SSOT 단일 위임, Gemini REST parts object 스키마 준수, 프론트엔드 세션 스토어 정규화 헬퍼(`normalizeSession`) 탑재, 데스크톱 영구 사이드바 그리드 규약(ADR-10) 명시 | Antigravity AI |
| **2026-11-08** | **v3.3** | **Stage 9 웹 UI/UX 레이아웃 표준화 및 인터랙션 고도화 계약 신설 (§7.17 UI-5~UI-8, 0203_012)**: 모바일 하단 뷰포트 레이아웃 스택 표준화(NowPlaying 연동 FAB/토스트 동적 부상 및 스크롤 끝단 가림 해소), 바람 스타일 탭 44px 터치 접근성 보장, Now Playing Bar 상세 확장 모달 규약, 물리 Override 상태 가시화 및 원클릭 복원 규약 명시 | Antigravity AI |
| **2026-11-08** | **v3.2** | **통합 감사 28대 이슈 해결 및 계약 규약 신설 (§7.16 AUDIT-1~6, 0203_012)**: FactoryReset SPA 단일 스키마, AI CRUD 헬퍼 위임, T-async getRootSnapshot 원자 캡처, T-loop WS 0-클라이언트 가드, C10 begin 실패 시 Recovery AP 폴백 및 런타임 설정 자동 적용, SSOT 자동 대조 CI 게이트 규약 명시 | Antigravity AI |
| **2026-11-06** | **v3.1** | **Stage 8 AI 제어 및 Gemini Live 실시간 음성 안전 계약 (§7.15 AI-1~AI-6)**: 15종 위험 명령 원천 차단, Tool Calling FSM 위임, 30분 세션 상한 및 403 차단, NVS 4키 일일 비용 가드레일, AudioWorklet 16k/24k 인라인 스트리밍 및 Barge-in Flush, 30초 프롬프트 캐싱 계약 명시, 개정 이력 위치 정상화 | Antigravity AI |
| **2026-10-30** | **v2.9** | **W10 REST 라우팅 Regex 의존성 제거, onNotFound Gzip 서빙 및 ArduinoJson v7 파싱 계약 (§7.14 ROUTE-1~3)**: `/:id` 기반 REST 라우팅 통일, `onNotFound` 핸들러 기반 `/html_v0203/` Gzip 정적 서빙, ArduinoJson v7 `.is<T>()` 타입 안전성 계약 명시 | Antigravity AI |
| 2026-10-28 | v2.8 | 프론트엔드-백엔드 동기화 및 오프라인 2분할 계약 추가 (§7.9 SYNC-1~SYNC-3): `CT10_Ctl_0203.h` Enum ➔ `000.const.js` 자동 주입, `998.offline_data_0203.js` 분리 및 플래시 제외, 대시보드 프리셋/스타일 슬라이더 동기화, 모달 오버레이 격리 | Antigravity AI |
| 2026-10-28 | v2.7 | 웹 오프라인 어댑터 및 한/영 다국어 연동 규약 추가 (§7.8 OFFLINE-1~OFFLINE-3): Mock 데이터 10개 프리셋/5개 스타일 factors 동기화, `/control/override` 인터셉트, 스케줄/프로필 한/영 병기 표기, 프리셋 관리 목록 실시간 i18n 반영 | Antigravity AI |
| 2026-10-28 | v2.6 | Batch I — §7.7 바람 물리 제어 Override 전면 개편 (OVR-1~OVR-4), adjust 폐기, 3대 물리 제어 슬라이더 및 한/영 다국어 정합성 현행화 | Antigravity AI |
| 2026-10-27 | v2.5 | Batch H — §7.6 프론트엔드 오프라인 로딩 및 부트스트랩 동기화 계약 추가 (LOAD-1~LOAD-2) | Antigravity AI |
| 2026-10-26 | v2.4 | Batch G — §4 3행 추가, §7.4 27건 감사 신규, §7.5 B-2 위반 수정 화이트리스트 확정, index.html 통일 및 레거시 호환 제거 | Antigravity AI |
| 2026-10-21 | v2.3 | 정규식 라우트(`html_v0203|html_v3`), 듀얼 폴백 서빙, `P010_bundle_0203.js`, `CT10::ackEventState` 일괄 현행화 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §2.1 D-4 atomic, §4 A-2/F-2/F-3/D-1 매트릭스, §4.2~§4.4 신규, §7.3 A-1~F-10 통합 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1~N-4, G-1~G-3 현행화 | Antigravity AI |
| 2026-10-19 | v2.0 | v0203 승격 + (v1.2의 Gzip 서빙 계약 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | W10 Gzip 서빙, I-6 번들 | Antigravity AI |
| 2026-10-19 | v1.1 | 심볼/시그니처 동기화 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 계약서 | 개발팀 |
