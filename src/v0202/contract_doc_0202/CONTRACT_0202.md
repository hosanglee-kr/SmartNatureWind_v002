# CONTRACT_0202.md — 동시성 경계 및 API 계약

> **기준**: v0202 정적 감사 + 런타임 동시성 검증 완료 (F-01~F-10, I-1~I-6, N-1~N-4, G-1~G-3, A-1~A-3, B-1~B-6, C-1~C-8, D-1~D-5, E-1~E-10, E-2.1~E-2.7, F-1~F-10, Batch G 전면 반영).  
> **목적**: 멀티태스킹 환경에서 태스크 경계, 뮤텍스 획득 순서, 공유 자원 접근 규약 및 위임 패턴을 정의하여 데이터 레이스, 교착 상태(Deadlock), UAF를 원천 차단.  
> **파일명 정책**: 계약 문서 `_0202.md` 유지, 코드 참조 `_0202` 접미사.

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
| `CT10::s_stateMutex` | Recursive Mutex | Lazy-init | 100 ms | `runCtx`, FSM, override, 런타임 |
| `C10::s_recursiveMutex` | Recursive Mutex | `C10::begin()` | 100 ms | 파일 I/O, 설정 CRUD |
| `C10::s_rootSwapMux` | portMUX | 정적 | Critical | `g_A20_config_root` 8포인터 스냅샷/스왑 |
| `C10::s_dirtyflagSpinlock` | portMUX | 정적 | Critical | 8섹션 dirty 플래그 |
| `C10::s_pendingFreeMux` | portMUX | 정적 | Critical | `s_pendingFree` 2-슬롯 큐 |
| `M10::s_stateMutex` | Recursive Mutex | Lazy-init | 100 ms | `_pir`, `_state` |
| `N10::s_mutex` | Recursive Mutex | Lazy-init | 100 ms | `s_state`, Flush 큐 |
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
| `W10::W10_registerGzipServe()` | ❌ | ✅ | ❌ | ❌ | **C-G-2** 정규식 `^/html_v0202/.+` |
| `W10::_routeSystemPatchBody()` | ❌ | ✅ | ❌ | ❌ | **F-2** POST/PATCH 헬퍼 |
| `W10::_routeWifiConfigPatchBody()` | ❌ | ✅ | ❌ | ❌ | **F-3** POST/PATCH 헬퍼 |
| `W10::_routeMotionPatchBody()` | ❌ | ✅ | ❌ | ❌ | **[B-6]** POST/PATCH 헬퍼 + getRootSnapshot |
| `W10::_wsHandshakeAuth()` | ❌ | ✅ | ❌ | ❌ | **[B-2]** getRootSnapshot + strlcpy 로컬 복사 |
| `C10::getRootSnapshot()` | ✅ | ✅ | ✅ | ✅ | **[B-2/B-9]** async_tcp 필수 경유 |
| `CT10::requestMotionSimApply()` | ❌ | ✅ | ❌ | ❌ | **F-06** (참조) |
| `N10::flush()` | ✅ | ❌ | ❌ | ❌ | **[B-1]** nvs_commit 1회 (10ms), **[B-7]** 반환값 검사 |

### 4.1 W10 정적 웹 에셋 서빙 계약

1. **Gzip 우선**: `Accept-Encoding` gzip + `.gz` 존재 시만 `Content-Encoding: gzip`. 미지원 시 raw 폴백.
2. **정규식 라우트**: `^/html_v0202/.+` (`W10_registerGzipServe`) 서빙. Long path도 `.gz` 우선.
3. **단일 정적 서빙**: `PATH_STATIC_HTML` (`/html_v0202`) 단일 서빙 (레거시 `/html_v3` 호환 제거).
4. **MIME 자동 판별**: `W10_guessMime` 확장자별 MIME + UTF-8.
5. **Root fallback 안전**: 메인 HTML(`index.html`) 부재 시 404 + 진단 메시지. `exists(x)` || `exists(x+".gz")`.
6. **번들링**: `P010_bundle_0202.js` 단일 파일, 동시 HTTP 11→4건.

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

1. **매크로 승격**: 다중 .cpp 참조 매크로 → `*_Internal_0202.h`. 파일 스코프 정의 금지 (예: `G_C10_SCH_ID_START`, `G_C10_PROFILE_ID_START`).
2. **자체 include**: 각 .cpp가 참조 심볼의 헤더 직접 include (예: `A22_Com_Lookup_0202.h`).
3. **정적 멤버 정의 유일성**: `CL_W10_WebAPI::s_server` 등 원본(Core) .cpp에만 정의.
4. **A40 자립성**: `A20_Const_Sch_0202.h` 자체 include (순환 없음).

---

## 5. 락 획득 순서 및 데드락 방지

```text
[계층 1] CT10::s_stateMutex (최상위, T-loop)
   ├─► [2-A] S10::_recursiveMutex (tickLoop 시뮬)
   ├─► [2-B] C10::s_rootSwapMux (portMUX 스냅샷)
   └─► [2-C] C10::s_recursiveMutex (reloadAll 내부 로드)

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

### 7.1 기존 (F-01~I-6)

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| F-01 | 🔴 | `WF10::startSTA` | GOT_IP mutex 경합 → TM10 통지 누락 | startSTA 성공 시 명시 통지 | ✅ |
| F-02 | 🟡 | `_ensureWifiTask` | 태스크 이중 생성 | mutex + double-check | ✅ |
| F-03 | 🔴 | `A00_run` | `M10::tick()` 누락 | 배치 | ✅ |
| F-04 | 🔴 | `A00_run` | `N10::tick()` 누락 | 배치 | ✅ |
| F-05 | 🟡 | `routeReload` | async_tcp 블로킹 | atomic flag 위임 | ✅ |
| F-06 | 🟡 | `routeMotion` | CT10 mutex 대기 | requestMotionSimApply 위임 | ✅ |
| F-07 | 🟢 | D10 Logger | 링버퍼 레이스 | 유실 수용 | ⏸ 수용 |
| F-08 | 🟢 | `A00_run` | root raw 역참조 | loopTask 저위험 | ⏸ 수용 |
| F-09 | 🟡 | `M10::isActive` | 부팅 PIR false-positive | F-03 tick으로 해소 | ✅ |
| F-10 | 🟡 | async_tcp 스택 | 4KB 여유 부족 | 부담 완화, 8KB 후보 | ⚠️ 관측 |
| I-1 | 🟡 | `CT10 export` | reload 판별 불가 | `pendingReload` 노출 | ✅ |
| I-2 | 🟡 | reload+patch | 패치 소실 | SPEC §5.2 명문화 | ✅ |
| I-3 | 🟢 | `CT10::begin` | 잔재 | 방어 store | ✅ |
| I-4 | 🟢 | CT10 클래스 | public 노출 | private 이동 | ✅ |
| I-5 | 🟢 | reload 사이클 | LED 500ms 지연 | 체감 불가 수용 | ⏸ 수용 |
| I-6 | 🟢 | W10 Static | 다중 분할 JS | 번들+Gzip (11→4) | ✅ |

### 7.2 N/G (N-1~N-4, G-1~G-3)

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| N-1 | 🟢 | `CT10 reload` | 런타임 미노출 | `lastReloadOk` | ✅ |
| N-2 | 🟡 | `W10 Static` | pages JSON 손상 | 정적 폴더 우선 | ✅ |
| N-3 | 🟡 | `W10 Static` | root 무한 리다이렉트 | 404 진단 | ✅ |
| N-4 | 🟡 | `W10 Upload` | 핸들 누수 | safeAbort close | ✅ |
| G-1 | 🟢 | `W10 Static` | Accept-Encoding 미검사 | 헤더 분기 | ✅ |
| G-2 | 🟡 | `W10 Static` | long path .gz | regex 대체 | ✅ |
| G-3 | 🟢 | `pio_gzip` | 소스 누락 무시 | fail-fast | ✅ |

### 7.3 Batch A~F 신규

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| A-1 | 🔴 | `tickSegmentSequence` | FIXED self-heal 무한 재호출 | `mode==PRESET` 조건 | ✅ |
| A-2 | 🔴 | CT10 `motion/sim` public | 락 순서 우회 | 위임 3종 + private | ✅ |
| A-3 | 🔴 | `checkApiKey` | null Core Dump | 최상단 null 방어 | ✅ |
| B-1 | 🟢 | `Const_0202.h` | 버전 잔재 | `2.0.0` + SEMVER 분리 | ✅ |
| B-2 | 🟢 | `Const_0202.h` | 화이트리스트 미문서 | §3.1 주석 | ✅ |
| B-3 | 🟡 | `routeFirmwareCheck` | strcmp 오작동 | SemVer 헬퍼 | ✅ |
| B-4 | 🟢 | `N10.h` | NVS 키 리터럴 | `G_N10_KEY_*` | ✅ |
| B-5 | 🟢 | `N10.cpp` | 리터럴 22곳 | 상수 참조 | ✅ |
| B-6 | 🟢 | `A23_Com_ResetCfg` | preset 하드코딩 | `DEFAULT_*` | ✅ |
| C-1~C-8 | 🟢 | S10/A00/TM10/WF10 | 매직넘버 | `G_S10_*` 등 | ✅ |
| D-1 | 🟢 | `IOWS_0202.cpp` | WS tick mutex 4회 | `consumeAllDirty` (4→1) | ✅ |
| D-2 | 🟢 | `Static_0202.cpp` | 매 요청 String | `.gz` 사전 계산 | ✅ |
| D-3 | 🟢 | `W10_registerGzipServe` | String 2회 | 스택 버퍼 (힙 0) | ✅ |
| D-4 | 🟡 | `isStaConnected` | 10ms mutex | atomic lock-free | ✅ |
| D-5 | 🟢 | `toChartJson` | vector 4.8KB | static 배열 | ✅ |
| E-1~E-10 | 🟢 | 다수 | Dead Code | 정리 | ✅ |
| E-2.1~E-2.7 | 🟢 | 29파일 분할 | 대형 파일 | 4~6분할 | ✅ |
| F-1 | 🟡 | `factoryResetFromDefault` | NVS 잔존 | `N10::resetRuntime` | ✅ |
| F-2 | 🟢 | `routeSystem` | 60줄 중복 | `_routeSystemPatchBody` | ✅ |
| F-3 | 🟢 | `routeWifiConfig` | 180줄 중복 | `_routeWifiConfigPatchBody` | ✅ |
| F-4 | 🟢 | `main.cpp` | Logger DEBUG | INFO 변경 | ✅ |
| F-5 | 🟡 | `decideRunSource` | profile fall-through | 명시 IDLE | ✅ |
| F-6 | 🟢 | `_persistOffTimeLastYday` | 리셋 시점 | reloadAll 확인 | ✅ |
| F-7 | 🟢 | `tickOverride` | resolved.valid | 조기 반환 확인 | ✅ |
| F-8 | 🟢 | `S10::applyFan` | 0.01f 임계 | `G_S10_FAN_ZERO_THRESHOLD` | ✅ |
| F-9 | 🟢 | `applyFanConfigCurve` | 0.33/0.66/0.34 | `G_P10_CURVE_SPLIT*` | ✅ |
| F-10 | 🟢 | A40/Sch/UzProf | 매크로 파일 스코프 | Internal 헤더 승격 | ✅ |

### 7.4 Batch G — 코드 재검토 (C, NEW, B)

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| **C-1** | 🔴 | `main.cpp` setup | `while(!Serial)` 무한 대기 (USB 미연결 시 부팅 정지) | 3s 타임아웃 (`G_A00_USB_CDC_TIMEOUT_MS`) | ✅ |
| **C-2** | 🔴 | `200.page.dashboard.js` | 프리셋 그리드 mount 순서 (빈 items) | `_mountComponents` 선행 | ✅ |
| **C-3** | 🔴 | `M10::isActive()` | `_state.pirActive` + lastChange 재계산 이중 적용 | `_state.pirActive` 단일 판정 | ✅ |
| **C-4** | 🔴 | `W10_Web_Upload_0202.cpp` | write-only 파일 `available()==0` → 핸들 유출 | `if (s_upFile)` 무조건 close | ✅ |
| **C-5** | 🔴 | `070.router.js` | dispatch 재진입 → 고아 watcher 누수 | `_dispatching` 가드 + 재확인 | ✅ |
| **NEW-C1** | 🔴 | `240.page.settings.js` | `\|\|` falsy 오류 (0값 손실) | `nz()` 헬퍼 (nullish) | ✅ |
| **NEW-C2** | 🔴 | `240.page.settings.js` | `dht.type` 미이스케이프 XSS | `esc()` 적용 | ✅ |
| **NEW-U1** | 🟡 | `240.page.settings.js` | API Key DOM 평문 노출 | `value=""` + placeholder + `(설정됨)` 배지 | ✅ |
| **NEW-U2** | 🟡 | `240.page.settings.js` | API Key 삭제 UI 부재 | `clear-api-key` 체크박스 | ✅ |
| **NEW-U3** | 🟡 | `240.page.settings.js` | wsChConfig 손상 시 UI 미복구 | 4채널 baseline + chName 복원 | ✅ |
| **NEW-U4** | 🟡 | `240.page.settings.js` | 문자열 `"false"` truthy 오판 | `asBool()` 명시 판정 | ✅ |
| **B-1** | 🟠 | `N10::flush` | NVS put × 11 = commit × 11 (100ms 블로킹) | `nvs_set_*` × N + `nvs_commit` 1회 (10ms) | ✅ |
| **B-2** | 🟠 | `W10_Web_Routes_Config/CRUD/WS` | async_tcp `g_A20_config_root` 직접 참조 3곳 | `getRootSnapshot` + strlcpy 로컬 복사 | ✅ |
| **B-3** | 🟠 | `settings/network` JS | deviceName/SSID/hostname XSS | `esc()` 적용 | ✅ |
| **B-4** | 🟠 | `C10::patchSystemFromJson` | `apiKey[0]` 체크로 빈 문자열 무시 (삭제 불가) | `clearApiKey`/`clearGeminiApiKey` 플래그 | ✅ |
| **B-5** | 🟠 | `W10_Web_Static_0202.cpp` | `indexOf("gzip")` → `gzip;q=0` 오탐지 | `W10_acceptsGzip()` RFC 7231 파서 + `Vary` | ✅ |
| **B-6** | 🟡 | `W10_Web_Routes_System_0202.cpp` | routeMotion POST/PATCH 60줄 중복 | `_routeMotionPatchBody` 헬퍼 | ✅ |
| **B-7** | 🟡 | `N10::flush` | `nvs_set_*`/`nvs_commit` 반환값 무시 | 반환값 검사 + dirty 유지 재시도 | ✅ |
| **B-8** | 🟡 | `130.ui.form.js` | 로그 필터 `textContent.includes()` 오매칭 | `.snw-log-lv` 정확 비교 | ✅ |
| **B-9** | 🟡 | `W10_Web_Routes_CRUD_0202.cpp` | WindProfile GET 매 요청 FS read(100ms) + static race | `getRootSnapshot` (2ms) | ✅ |
| **B-10** | 🟢 | `S10_Simul_Core_0202.cpp` | `tick()` 내 브로드캐스트용 JsonDocument dead code | 제거 (dirty 플래그만) | ✅ |
| **B-11** | 🟠 | `A00_Main_0202.cpp` | config 손상 시 부팅 중단 → 웹 복구 불가 | in-memory defaults + Recovery AP (최후) | ✅ |
| **B-12** | 🟠 | `W10_Web_Upload_0202.cpp` | OTA 세션 잔존 + write 반환값 무시 | `Update.abort()` + 반환 검사 | ✅ |
| **B-13** | 🟠 | `A00_Main_0202.cpp` | 음수 LED pin → uint8 캐스팅 → GPIO 255 크래시 | 유효 범위 검증 + 기본값 | ✅ |

### 7.5 B-2 위반 → 수정 후 화이트리스트 최신화

**수정 완료 위치** (async_tcp 컨텍스트):
- `W10_Web_Routes_Config_0202.cpp::routeConfigDirtySave` GET → `getRootSnapshot`
- `W10_Web_Routes_CRUD_0202.cpp::routeUserProfilesPatch` → `getRootSnapshot`
- `W10_Web_Routes_CRUD_0202.cpp::routeWindProfile` GET → `getRootSnapshot` (B-9)
- `W10_Web_WS_0202.cpp::_wsHandshakeAuth` → `getRootSnapshot` + strlcpy

**계약 준수 확정**: §3.1 화이트리스트 예외 없이 async_tcp는 반드시 `getRootSnapshot` 경유.

### 7.6 Batch H 프론트엔드 오프라인 로딩 계약 (LOAD-1~LOAD-2)

- **선행 감지 계약**: `window.SNW_OFFLINE`은 번들 스크립트(`P010_bundle_0202.js`) 실행 전 `index.html` 상단에서 선행 판정 완료 필수.
- **동기 주입 계약**: 오프라인 모드 활성화 시 `document.write('<script src="./js/998.offline_0202.js"><\/script>')`를 통해 번들 실행 전 오프라인 인터셉터가 DOM에 동기 등록되어야 함.
- **부트스트랩 대기 계약**: `999.app.js`의 `SNW_BOOT()`는 `window.SNW_OFFLINE` 활성화 시 `SNW.Offline.ready`가 생성 및 완료될 때까지 안전 대기 가드(Wait Guard)를 수행한 후 API/WebSocket 초기화 진행.

### 7.7 Batch I 바람 물리 파라미터 직접 지정 (Override) 계약 (OVR-1~OVR-4)

- **[OVR-1] 직접 지정(Absolute Override) 원칙**: 기존 상대 델타 가산 구조체(`ST_A20_AdjustDelta_t`)를 완전 폐기하고 `ST_A20_SegmentOverride_t`로 단일화. 바람 강도(`windIntensity`), 변동성(`windVariability`), 돌풍 빈도(`gustFrequency`)는 0~100% 절대 수치로 정의되며, 프론트엔드와 백엔드 간 역산(Delta inverse calculation)을 엄격히 금지함.
- **[OVR-2] WindSolver 직접 치환 계약**: `S20_resolveWindParams`는 `p_override->enabled == true`인 항목에 대해 `PresetBase * StyleFactor` 계산값을 완전히 무시하고 지정된 Override 절대값으로 직접 치환(`v_int = p_override->windIntensity`).
- **[OVR-3] 세그먼트 데이터 직결 규약**: 스케줄(`cfg_schedules_0202.json`) 및 사용자 프로필(`cfg_userProfile_0202.json`) 세그먼트 스키마는 `override: { enabled, windIntensity, windVariability, gustFrequency }` 구조를 필수로 사용. 미지정 시 `enabled: false` 및 `-1.0` 기본값 유지.
- **[OVR-4] 세그먼트 순서 변경(Reindex) 계약**: UI에서 세그먼트 순서 이동(`▲`/`▼`) 시 클라이언트가 즉시 10단위 인덱스(`segNo = (idx + 1) * 10`)로 자동 재계산하여 전송하며, 백엔드는 수신된 순서대로 세그먼트를 큐에 적재.

### 7.8 웹 오프라인 어댑터 및 다국어 지원 규약 (OFFLINE-1~OFFLINE-3)

- **[OFFLINE-1] Mock 데이터 패리티 및 정합성**: `998.offline_data_0202.js`의 `cache.windDict`는 백엔드 `cfg_windDict_0202.json`의 10개 프리셋(`OCEAN` ~ `DESERT_NIGHT`) 및 5개 스타일(`BALANCE`, `ACTIVE`, `FOCUS`, `RELAX`, `SLEEP`) 전체 factors를 100% 동일하게 유지하여 오프라인 환경에서도 온라인과 동등한 물리 시뮬레이션 환경을 보장함.
- **[OFFLINE-2] 엔드포인트 패리티 및 시뮬레이터 반응**: 백엔드 `/control/override` 등 신규 제어 엔드포인트의 오프라인 인터셉트를 필수 지원하며, `startSimulator()` 루프가 `intensity`와 `variability` 파라미터에 기반하여 풍속과 PWM을 실시간 동적 계산하여 UI에 전달함.
- **[OFFLINE-3] 다국어(ko/en) 호환성 및 한/영 병기 표기**: 오프라인 Mock 데이터의 스케줄/프로필 명칭은 한/영 병기 표기(`"아침 바람 (Morning Breeze)"`, `"수면 모드 (Sleep Care)"`)를 기본 제공하여 언어 토글 시 데이터 식별성을 보장하며, 프리셋 관리 화면(`300.page.windprofile.js`)은 `preset.<CODE>` i18n 키 우선 해석 및 `snw:langchange` 리스너를 통해 실시간 언어 전환을 보장함.

### 7.9 프론트엔드-백엔드 데이터 동기화 및 오프라인 모듈 분리 계약 (SYNC-1~SYNC-3)

- **[SYNC-1] C++ Enum 자동 단방향 동기화 규약**: `CT10_Ctl_0202.h`에 정의된 FSM 상태 enum(`EN_CT10_State_t`) 및 원인 코드(`EN_CT10_StateReason_t`)는 `pio_gzip_0202.py` 실행 시 `000.const.js`의 마커 블록(`/* === AUTO-SYNC: C++ ENUM START === */`) 내로 자동 파싱·주입되어야 하며, 프론트엔드와 백엔드 간 상태 코드 불일치(State mismatch)를 원천 차단함.
- **[SYNC-2] 오프라인 어댑터 2분할 및 LittleFS 배포 제외 규약**: 오프라인 환경은 대용량 JSON Mock 캐시 전담 파일(`998.offline_data_0202.js`)과 경량 시뮬레이터 로직(`998.offline_0202.js`)으로 엄격히 2분할 관리함. 두 파일은 `pio_gzip_0202.py`의 `JS_BUNDLE_EXCLUDES` 목록에 등록되어 ESP32 LittleFS 플래시 번들(`P010_bundle_0202.js`)에서 100% 영구 제외되며 기기 런타임 메모리 오버헤드를 유발하지 않아야 함.
- **[SYNC-3] FSM 상태 일치성 및 모달 오버레이 격리 규약**:
  - 대시보드 전원 가동 시 `OVERRIDE_HOLD`(`stateCode=1`, `reasonCode=1`) 상태로 일치 전이하여 토스트 오류를 방지함.
  - 프리셋/스타일 선택 시 슬라이더 3종(강도/변동성/돌풍) 파라미터가 `cfg_windDict_0202.json` 배수 수식에 따라 즉시 동기화되어야 함.
  - 스케줄/프로필 모달 닫기 시 `.snw-modal-overlay`는 CSS 차원(`pointer-events: none; visibility: hidden;`) 및 JS 인라인(`display: 'none'`)으로 완전 비활성화 격리되어 화면 인터랙션 차단을 방지해야 함.

---

## 8. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-10-28** | **v2.8** | **프론트엔드-백엔드 동기화 및 오프라인 2분할 계약 추가 (§7.9 SYNC-1~SYNC-3)**: `CT10_Ctl_0202.h` Enum ➔ `000.const.js` 자동 주입, `998.offline_data_0202.js` 분리 및 플래시 제외, 대시보드 프리셋/스타일 슬라이더 동기화, 모달 오버레이 격리 | Antigravity AI |
| 2026-10-28 | v2.7 | 웹 오프라인 어댑터 및 한/영 다국어 연동 규약 추가 (§7.8 OFFLINE-1~OFFLINE-3): Mock 데이터 10개 프리셋/5개 스타일 factors 동기화, `/control/override` 인터셉트, 스케줄/프로필 한/영 병기 표기, 프리셋 관리 목록 실시간 i18n 반영 | Antigravity AI |
| 2026-10-28 | v2.6 | Batch I — §7.7 바람 물리 제어 Override 전면 개편 (OVR-1~OVR-4), adjust 폐기, 3대 물리 제어 슬라이더 및 한/영 다국어 정합성 현행화 | Antigravity AI |
| 2026-10-27 | v2.5 | Batch H — §7.6 프론트엔드 오프라인 로딩 및 부트스트랩 동기화 계약 추가 (LOAD-1~LOAD-2) | Antigravity AI |
| 2026-10-26 | v2.4 | Batch G — §4 3행 추가, §7.4 27건 감사 신규, §7.5 B-2 위반 수정 화이트리스트 확정, index.html 통일 및 레거시 호환 제거 | Antigravity AI |
| 2026-10-21 | v2.3 | 정규식 라우트(`html_v0202|html_v3`), 듀얼 폴백 서빙, `P010_bundle_0202.js`, `CT10::ackEventState` 일괄 현행화 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §2.1 D-4 atomic, §4 A-2/F-2/F-3/D-1 매트릭스, §4.2~§4.4 신규, §7.3 A-1~F-10 통합 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1~N-4, G-1~G-3 현행화 | Antigravity AI |
| 2026-10-19 | v2.0 | v0202 승격 + (v1.2의 Gzip 서빙 계약 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | W10 Gzip 서빙, I-6 번들 | Antigravity AI |
| 2026-10-19 | v1.1 | 심볼/시그니처 동기화 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 계약서 | 개발팀 |


### 7.10 대시보드·세그먼트·스타일 통합 물리 파이프라인 (PHY-1~PHY-4)
- **[PHY-1] 단일 정본**: `S20_resolveWindParams`가 모든 풍속 파라미터(강도/변동/돌풍/난류/열기포)를 결정.
- **[PHY-2] 스타일 정규화**: 5종 스타일(BALANCE/ACTIVE/FOCUS/RELAX/SLEEP) multipliers가 10개 프리셋에 100% 동일하게 작용.
- **[PHY-3] 개별 오버라이드 격리**: 슬라이더 조작 시 `override.enabled=true`, 프리셋/스타일 재선택 시 자동 해제.
- **[PHY-4] 상태 안전**: 모든 물리 반영은 `_recursiveMutex` 하에서 원자적으로 수행.

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
