# CONTRACT.md — 동시성 경계 및 API 계약

> 기준: v017 소스 정적 감사. 함수별 허용 호출자/컨텍스트/부수효과 명시.

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
- **해제**: `reloadAll` → `queuePendingFree(v_old)` → `processPendingFree()`(loopTask) 3초 grace 후
- **금지**: `reloadAll`/`freeAll` 도중 raw `g_A20_config_root.X` 직접 접근

### 3.2 현재 소스 예외 (계약 위반 후보)
- `A00_run()` — `g_A20_config_root.system` 직접 deref (같은 loopTask, 저위험)
- `W10 routeReload()` — `reloadAll()` 이후 `g_A20_config_root.system` 직접 접근 (저위험)
- `WF10 GOT_IP 이벤트 콜백` — `g_A20_config_root.system` 직접 접근 (T-sys_evt와 reloadAll 병행 시 race)

## 4. 태스크 경계별 허용 호출 매트릭스
| 피호출 | T-loop | T-async | T-wf | T-sys_evt | 비고 |
|---|---|---|---|---|---|
| `CT10::tick()` | OK | X | X | X | loopTask 전용 |
| `CT10::reloadAll()` | 주의 | OK | X | X | HTTP 트리거 허용 |
| `CT10::exportStateJson_v02()` | OK | OK | X | X | caller-owned doc |
| `CT10_WS_tick()` | OK | X | X | X | loopTask 전용 |
| `S10::tick()` | 간접 | X | X | X | CT10::tickLoop 내부만 |
| `S10::patchFromJson()` | X | OK | X | X | async_tcp 직호출 (뮤텍스) |
| `M10::feedPIR()` | X | OK | X | X | async_tcp |
| `M10::tick()` | X | X | X | X | 호출자 부재 (GAP F-03) |
| `WF10::requestReconnect()` | OK | OK | X | X | sem give만 |
| `WF10::applyConfig()` | X | X | OK | X | T-wf 전용 |
| `WF10::startSTA()` | X | X | OK | X | T-wf 경유만 |
| `WF10::isStaConnected()` | OK | OK | OK | OK | 10ms 타임아웃 |
| `TM10::tick()` | OK | X | X | X | loopTask 전용 |
| `TM10::onWiFiConnected()` | X | X | OK | OK | WiFi 이벤트 경로 |
| `TM10::requestTimeSync()` | OK | OK | OK | OK | 내부 뮤텍스 |
| `N10::set*()` | OK(CT10경유) | X | X | X | CT10 상태 전이 시 |
| `N10::tick()/flushIfNeeded()` | X | X | X | X | 호출자 부재 (GAP F-04) |
| `C10::saveDirtyConfigs()` | X | OK | X | X | async_tcp 직접 |
| `C10::loadAll()` | X | OK(reload) | X | X | async_tcp (reloadAll 경유) |
| `Logger::log()` | OK | OK | OK | 주의 | ring buffer 미보호 |

## 5. 락 순서(Lock Ordering) — 데드락 방지
- CT10::s_stateMutex (최상위)
  - S10::_recursiveMutex (CT10 tick → sim.tick)
  - C10::s_rootSwapMux (portMUX, 짧게)
  - C10::s_recursiveMutex (재진입 경유, 짧게)
- C10::s_recursiveMutex (독립 경로)
- WF10::s_wifiMutex (독립)
- TM10::s_mutex (독립)
- N10::s_mutex (독립)
- M10::s_stateMutex (독립)

금지: 역순 획득 (예: S10 → CT10, C10 → CT10).
금지: M10 이벤트 콜백 내부에서 CT10/C10 락 획득.

## 6. 위임(Delegation) 및 Deferred 패턴
| 패턴 | 트리거 | 실행 | 안전장치 |
|---|---|---|---|
| Config root swap | `reloadAll` | `s_rootSwapMux` 하 swap | 이전 root queuePendingFree |
| Pending free | `queuePendingFree` | loopTask 3s 후 | portMUX 보호 큐(2슬롯) |
| Dirty save | `set*` API | W10 `saveDirtyConfigs` 명시 호출 | Dirty flag (portMUX) |
| WS broadcast | dirty flag | loopTask `CT10_WS_tick` | file-static JsonDocument |
| WiFi reconnect | HTTP `requestReconnect()` | T-wf task | binary semaphore |
| Time sync | WiFi 이벤트/요청 | SNTP 콜백 | 내부 뮤텍스 |
| NVS dirty flush | `set*` | 호출자 부재 (GAP F-04) | - |

## 7. 관측된 계약 위반 / 위험 (Audit Findings)
| ID | 심각도 | 위치 | 내용 | 완화 |
|---|---|---|---|---|
| F-01 | High | `startSTA()` | init 중 GOT_IP 콜백 누락 → TM10 영구 미동기 | Fix-1 적용 완료 |
| F-02 | Mid | `_ensureWifiTask()` | 이중 xTaskCreate 경쟁 | Fix-2 적용 완료 |
| F-03 | High | `M10::tick()` | 호출자 부재 → PIR holdSec 미작동 | A00_run 추가 필요 |
| F-04 | High | `N10::tick()` | 호출자 부재 → NVS dirty 미저장 | A00_run 추가 필요 |
| F-05 | Mid | `W10 routeReload` | async_tcp 파일 I/O 블로킹 | T-wf 이관 후보 |
| F-06 | Mid | `routeMotion POST` | async_tcp에서 CT10 mutex 100ms 대기 가능 | 쿨다운/위임 후보 |
| F-07 | Low | `Logger::log` | ring buffer 무보호 | 수용 가능 |
| F-08 | Low | `A00_run` system deref | raw 접근 | 스냅샷 사용 권장 |

