# CONTRACT.md — 동시성 경계 및 API 계약

> 기준: v017 소스 정적 감사 (F-01~F-06, I-1~I-4 반영 후 최신).
> 함수별 허용 호출자/컨텍스트/부수효과 명시.

## 1. 실행 컨텍스트(Task) 정의
| ID | 태스크 | 생성 | 우선순위 | 스택 | 설명 |
|---|---|---|---|---|---|
| T-loop | loopTask (Arduino) | framework | 1 | 8192B | A00_run() 실행 |
| T-async | async_tcp | ESPAsyncWebServer | 1(확인) | 4096B(확인) | HTTP/WS 핸들러 |
| T-wf | WF10_Reconnect | WF10::_ensureWifiTask | 1 | 8192B | WiFi 재연결 전담 |
| T-sys_evt | WiFi 이벤트 태스크 | framework | 시스템 | 3584B | WiFi.onEvent 콜백 |
| T-IDLE | IDLE | framework | 0 | - | 여유 시 |
| T-timer | esp_timer | framework | 22 | - | SNTP 콜백 등 |

## 2. 뮤텍스/세마포어 인벤토리
| 이름 | 타입 | 초기화 | 타임아웃 | 소유 모듈 |
|---|---|---|---|---|
| `CT10::s_stateMutex` | recursive | lazy | 100ms | CT10 |
| `C10::s_recursiveMutex` | recursive | `begin()` | 100ms | C10 |
| `C10::s_rootSwapMux` | portMUX | static | critical | C10 |
| `C10::s_dirtyflagSpinlock` | portMUX | static | critical | C10 |
| `C10::s_pendingFreeMux` | portMUX | static | critical | C10 |
| `M10::s_stateMutex` | recursive | lazy | 100ms | M10 |
| `N10::s_mutex` | recursive | lazy | 100ms | N10 |
| `WF10::s_wifiMutex` | recursive | lazy | 100ms/10ms | WF10 |
| `TM10::s_mutex` | recursive | lazy | 100ms | TM10 |
| `S10::_recursiveMutex` | recursive | `begin()` | 100ms | S10 |
| `WF10::s_wifiRequestSem` | binary | `_ensureWifiTask` | blocking | WF10 |

## 3. 공유 전역 접근 계약
| 전역 | 소유 | 읽기 | 쓰기 |
|---|---|---|---|
| `g_A20_config_root` (8 ptr) | C10 | `getRootSnapshot()` 스냅샷 필수 | CT10::reloadAll 내 swap만 |
| `g_A00_server` | A00 | 모든 태스크 | A00_init만 |
| `g_P10_pwm` | A00 | CT10/S10 | A00_init만 |
| `g_A00_ledController` | A00 | loopTask | A00_init만 |
| `g_M10_motionLogic` | A00/M10 | CT10 (읽기) | A00_init만 |

### 3.1 `g_A20_config_root` 접근 규약 (핵심)
- **읽기**: 반드시 `CL_C10_ConfigManager::getRootSnapshot(v_snap)` 사용
- **쓰기**: `CT10::reloadAll()` 내부에서만 (`s_stateMutex` + `s_rootSwapMux`)
- **해제**: `reloadAll` → `queuePendingFree(v_old)` → `processPendingFree()`(T-loop) 3초 grace 후
- **금지**: `reloadAll`/`freeAll` 도중 raw `g_A20_config_root.X` 직접 접근

### 3.2 남은 예외 (수용)
- `A00_run` — `g_A20_config_root.system` deref (같은 T-loop, F-08 수용)
- `routeSystem POST/PATCH` — patch 직후 `applySystemRuntimeFromConfig(*g_A20_config_root.system)` 호출 (T-async, C10 mutex 보유 직후 스냅샷 미사용이지만 free 시나리오 없음 — **저위험**)
- `WF10 GOT_IP 이벤트 콜백` — `getRootSnapshot()` 사용 (F-01 후)

## 4. 태스크 경계별 허용 호출 매트릭스 (F-03~F-06 반영)
| 피호출 | T-loop | T-async | T-wf | T-sys_evt | 비고 |
|---|---|---|---|---|---|
| `CT10::tick()` (tickLoop) | ✅ | ❌ | ❌ | ❌ | loopTask 전용 |
| `CT10::requestReload()` | ❌ | ✅ | ❌ | ❌ | flag set만, 즉시 반환 (F-05) |
| `CT10::consumePendingReload()` | ✅ | ❌ | ❌ | ❌ | A00_run만 |
| `CT10::reloadAll()` | ✅ | ❌ | ❌ | ❌ | F-05 후 T-loop 전용 |
| `CT10::isReloadPending()` | ✅ | ✅ | ❌ | ❌ | atomic read (I-1) |
| `CT10::exportStateJson_v02()` | ✅ | ✅ | ❌ | ❌ | caller-owned doc |
| `CT10_WS_tick()` | ✅ | ❌ | ❌ | ❌ | loopTask 전용 |
| `S10::tick()` | 간접 | ❌ | ❌ | ❌ | CT10::tickLoop 내부 |
| `S10::patchFromJson()` | ❌ | ✅ | ❌ | ❌ | async_tcp 직호출 (뮤텍스) |
| `M10::feedPIR()` | ❌ | ✅ | ❌ | ❌ | async_tcp |
| `M10::tick()` | ✅ | ❌ | ❌ | ❌ | **F-03 해결** — A00_run에 배치 |
| `N10::tick()` | ✅ | ❌ | ❌ | ❌ | **F-04 해결** — A00_run에 배치 |
| `N10::set*()` | ✅(CT10경유) | ❌ | ❌ | ❌ | CT10 상태 전이 시 |
| `WF10::requestReconnect()` | ✅ | ✅ | ❌ | ❌ | sem give만 |
| `WF10::applyConfig()` | ❌ | ❌ | ✅ | ❌ | T-wf 전용 |
| `WF10::startSTA()` | ❌ | ❌ | ✅ | ❌ | T-wf 경유만 |
| `WF10::isStaConnected()` | ✅ | ✅ | ✅ | ✅ | 10ms 타임아웃 |
| `TM10::tick()` | ✅ | ❌ | ❌ | ❌ | loopTask 전용 |
| `TM10::onWiFiConnected()` | ❌ | ❌ | ✅ | ✅ | WiFi 이벤트 경로 |
| `TM10::requestTimeSync()` | ✅ | ✅ | ✅ | ✅ | 내부 뮤텍스 |
| `CT10::requestMotionSimApply()` | ❌ | ✅ | ❌ | ❌ | flag set만 (F-06) |
| `CT10::applyMotionSimConfigToSim()` | 내부 | ❌ | ❌ | ❌ | **I-4 private화** |
| `C10::saveDirtyConfigs()` | ❌ | ✅ | ❌ | ❌ | async_tcp 직접 |
| `C10::loadAll()` | ❌ | ❌ | ❌ | ❌ | reloadAll 경유만 (F-05 후) |
| `Logger::log()` | ✅ | ✅ | ✅ | ⚠️ | ring buffer 미보호 (F-07) |

## 5. 락 순서(Lock Ordering) — 데드락 방지
```
CT10::s_stateMutex (최상위, T-loop)
  └→ S10::_recursiveMutex      (CT10 tick → sim.tick)
  └→ C10::s_rootSwapMux        (portMUX, 짧게)
  └→ C10::s_recursiveMutex     (재진입 경유, 짧게)

C10::s_recursiveMutex (독립 경로, T-async 직진입 가능)
WF10::s_wifiMutex (독립, T-wf/T-loop/T-sys_evt)
TM10::s_mutex (독립, 모든 태스크)
N10::s_mutex (독립, T-loop/T-async)
M10::s_stateMutex (독립, T-loop/T-async)
```
**금지**: 역순 획득 (예: S10 → CT10, C10 → CT10).  
**금지**: M10 이벤트 콜백 내부에서 CT10/C10 락 획득 (M10 헤더 주석 참조).

## 6. 위임(Delegation) 및 Deferred 패턴 (F-05/F-06 반영)
| 패턴 | 트리거 | 실행 | 안전장치 |
|---|---|---|---|
| Config root swap | `reloadAll` | `s_rootSwapMux` 하 swap | 이전 root queuePendingFree |
| Pending free | `queuePendingFree` | T-loop `processPendingFree` 3s 후 | portMUX 보호 큐(2슬롯) |
| **Pending reload** (F-05) | T-async `requestReload()` (atomic CAS) | T-loop `consumePendingReload()` → `reloadAll()` | `s_pendingReload` atomic bool |
| **Pending motion.sim apply** (F-06) | T-async `requestMotionSimApply()` (atomic store) | T-loop `tickLoop` 최상단 `exchange(false)` → `applyMotionSimConfigToSim()` | `_pendingMotionSimApply` atomic bool |
| Dirty save | `set*` API | T-async `saveDirtyConfigs` 명시 호출 | Dirty flag (portMUX) |
| WS broadcast | dirty flag | T-loop `CT10_WS_tick` | file-static JsonDocument |
| WiFi reconnect | T-async `requestReconnect()` | T-wf task | binary semaphore |
| Time sync | WiFi 이벤트/요청 | SNTP 콜백 | 내부 뮤텍스 |
| NVS dirty flush | `set*` | T-loop `N10::tick` (10s 게이트) | `s_dirty.runtime` flag |

## 7. 감사 결과 (Audit Findings) — 최신 상태
| ID | 심각도 | 위치 | 내용 | 상태 |
|---|---|---|---|---|
| F-01 | 🔴 High | `WF10::startSTA` | GOT_IP 콜백 mutex 경합 → TM10 미동기 | ✅ 해결 (명시 통지) |
| F-02 | 🟡 Mid | `WF10::_ensureWifiTask` | 이중 xTaskCreate | ✅ 해결 (mutex+double-check) |
| F-03 | 🔴 High | `A00_run` | M10::tick 호출자 부재 | ✅ 해결 (A00_run M10 tick) |
| F-04 | 🔴 High | `A00_run` | N10::tick 호출자 부재 | ✅ 해결 (A00_run N10 tick) |
| F-05 | 🟡 Mid | `W10 routeReload` | async_tcp 100~500ms 블로킹 | ✅ 해결 (T-loop 위임) |
| F-06 | 🟡 Mid | `W10 routeMotion` | async_tcp CT10 mutex 대기 | ✅ 해결 (T-loop 위임) |
| F-07 | 🟢 Low | `D10 Logger` | ring buffer 무보호 | ⏸ 수용 (로그 유실만) |
| F-08 | 🟢 Low | `A00_run` | raw root deref | ⏸ 수용 (같은 T-loop) |
| F-09 | 🟡 Mid | `M10::isActive` | 부팅 직후 false-positive | ✅ 해결 (F-03 종속) |
| F-10 | 🟡 Mid | async_tcp 스택 | 4096B 여유 낮음 | ⚠️ 관측 (상향 후보) |
| I-1 | 🟡 Mid | state export | reload 완료 시점 미노출 | ✅ 해결 (`control.pendingReload`) |
| I-2 | 🟡 Mid | reload + patch | patch 소실 정책 미문서화 | ✅ 해결 (SPEC §5.1) |
| I-3 | 🟢 Low | `CT10::begin` | flag 리셋 누락 | ✅ 해결 (방어적 store) |
| I-4 | 🟢 Low | `applyMotionSimConfigToSim` | public 노출 | ✅ 해결 (private화) |
| I-5 | 🟢 Low | reload 사이클 | LED 500ms 순단 | ⏸ 수용 (인지 어려움) |

## 8. 개정 이력
| 날짜 | 버전 | 변경 |
|---|---|---|
| (초기) | v1.0 | 최초 작성 (정적 감사) |
| (재감사) | v1.1 | F-01~F-06, I-1~I-4 반영. §4 매트릭스 전면 갱신. §6 pending 패턴 2종 추가. §7 상태 컬럼 추가 |

