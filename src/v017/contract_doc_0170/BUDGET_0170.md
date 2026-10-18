# BUDGET.md — 시간 및 시스템 자원 예산

> WCET는 정적 추정. 실측 필수 항목은 [측정 필요] 표시.
> F-03~F-06 반영 후 최신 (T-async 부하 감소, T-loop 증가).

## 1. 태스크 매트릭스
| 태스크 | 코어 | 우선순위 | 주기 | 스택 할당 | WCET(추정) | 여유 |
|---|---|---|---|---|---|---|
| loopTask | 0 or 1 | 1 | `delay(10)` | 8192B | 30~100ms (reload 시 +500ms) | [측정 필요] |
| async_tcp | 0 or 1 | 1(확인) | 이벤트 | 4096B(확인) | 가변 (reload 제외) | [측정 필요] |
| WF10_Reconnect | any | 1 | 이벤트 | 8192B | ≤ 120s(재연결) | [측정 필요] |
| sys_evt(WiFi) | any | 20+ | 이벤트 | 3584B(추정) | <10ms | [측정 필요] |
| esp_timer | any | 22 | 주기 | - | <1ms | N/A |

**관측성**: `WF10::_wifiTask` 끝 `uxTaskGetStackHighWaterMark()` 로깅 유지.

## 2. loopTask WCET 예산 — F-03/F-04/F-05 반영
| 블록 | 예상 WCET | 비고 |
|---|---|---|
| WDT reset | <10μs | 상수 |
| **F-05 pending reload 체크** | **<1μs (평상)** | atomic exchange |
| **F-05 reloadAll 실행** | **100~500ms** (파일 I/O) | **reload 요청 cycle에만** |
| CT10::tick (스로틀 40ms) | 1~5ms | sim.tick 의존 |
| **F-06 pending motion.sim** | **<100μs (소비 시 1회)** | atomic exchange + applyMotionSimConfigToSim |
| CT10_WS_tick (dirty 시) | 1~10ms | chart 120 포인트 직렬화 상한 |
| **F-03 M10::tick** | **<100μs (평상)** | mutex + holdSec 감쇠 |
| TM10::tick | <100μs | 대부분 조기 반환 |
| processPendingFree | <100μs | 경과 0 시 조기 |
| **F-04 N10::tick** | **<100μs (10s 게이트)** | dirty 시 flush 200~500μs |
| LED.run | <100μs | NeoPixel show |
| delay(10) | 10ms | 항상 |

**평상시 합계**: ~15~25ms / 10ms 주기 → 오버런 없음 (지터 평균화).  
**chart broadcast 시**: 최대 10ms 추가 → 25ms 스파이크.  
**reload cycle**: +100~500ms **단일 스파이크** (WDT 10s 안전).  
**[측정 필요]**: `dt_max` 로깅 (권장).

## 3. async_tcp WCET — F-05/F-06 반영 후
| 라우트 | 호출 | 예상 WCET | 위험 |
|---|---|---|---|
| **`POST /reload`** | **requestReload() (CAS)** | **< 1ms** | **✅ 해결 (기존 100~500ms)** |
| **`POST /motion`** | **patchMotionFromJson + requestMotionSimApply (store)** | **< 5ms** | **✅ 해결 (기존 CT10 mutex 100ms 대기)** |
| `POST /system`, `/wifi/config` | patch + saveDirtyConfigs (파일 쓰기) | 50~200ms | 🟡 (동기 저장 정책 유지) |
| `GET /wifi/scan` | WiFi.scanNetworks() | 1~2s | 🔴 필수적 블로킹 |
| `POST /ai/gemini` | WiFiClientSecure.connect+read | ≤15s | 🟡 rate limit (3s) |
| `POST /fwUpdate` | Update.write() | 수십 초 | 🔴 의도된 블로킹 |
| `POST /fileUpload` | LittleFS.write() | 스트리밍 | 🟡 2MB 제한 |
| `POST /config/save` | saveDirtyConfigs | 50~200ms | 🟡 파일 I/O |

**완화 요약**: F-05/F-06로 인해 async_tcp 최대 블로킹 소스 2개 제거. 남은 블로킹은 모두 **명시적 요청** (scan, OTA, upload, save).

## 4. WF10_Reconnect 태스크 (변경 없음)
| 단계 | WCET | 비고 |
|---|---|---|
| sem take | 무한 | - |
| getRootSnapshot | <10μs | portMUX |
| memcpy snapshot | ~200B | 상수 |
| applyConfig → init → startSTA | ≤ 90s (5회 × 2s + delay) | 실패 시 |
| 성공 경로 | 2~10s | AP 응답속도 의존 |
| 스택 워터마크 로깅 | <10μs | 유지 |

**블로킹 허용 태스크**: WDT 미등록 → 90s 블로킹 정상.

## 5. 잠재적 블로킹 지점 (F-05/F-06 반영 후)
| 함수 | 최대 블로킹 | 시스템 영향 | 완화 |
|---|---|---|---|
| `WiFiMulti.run(2000)` | 2s/회 × 5 | T-wf만 | 허용 |
| `WiFi.softAP()` | 100~500ms | T-wf | 허용 |
| `WiFi.scanNetworks(false, true)` | 1~2s | T-async | 명시 요청 |
| `LittleFS.open/read/write` | 10~200ms | 호출 태스크 | 크기 상한 |
| `serializeJson(chart120)` | 1~5ms | T-loop | file-static doc |
| `S10::toChartJson()` (std::vector) | 1~3ms | T-loop (mutex) | capacity 예약 |
| `esp_task_wdt_init` | 즉시 | A00_init | - |
| `delay(10)` (loop) | 10ms | T-loop | 스로틀 |
| `TM10 getLocalTime()` | <50μs | 모든 태스크 | - |
| `Logger::log()` 시리얼 | 20~100μs/로그 | 모든 태스크 | 레벨 조정 |
| **`reloadAll()` (T-loop)** | **100~500ms** | **T-loop 1회** | SPEC §5.1 정책 (명시 요청) |
| **`patchMotionFromJson` (T-async)** | **~5ms** | T-async | 문제 없음 |

## 6. 스택 예산 (정적 추정)
| 태스크 | 할당 | 최대 사용 추정 | 안전 마진 | 비고 |
|---|---|---|---|---|
| loopTask | 8192B | 3~5KB | 3KB | [측정 필요] reload cycle 상한 |
| **async_tcp** | **4096B** | **2.5~3KB (F-05 후 감소)** | **여유 확보** | [측정 필요] — reload 제거로 여유 ↑ |
| WF10_Reconnect | 8192B | 3~4KB | 4KB | 워터마크 로깅 |
| sys_evt | 3584B | 2~3KB | 여유 낮음 | 손대지 않음 |

**F-10 후속**: F-05 후 async_tcp 스택 여유 확보되었으나, `CONFIG_ASYNC_TCP_STACK_SIZE=8192` 상향 여전히 권장 (OTA/Gemini 경로).

## 7. 관측성(Observability) 메트릭 — I-1 반영
| 지표 | 수집 위치 | 목표 | 조치 |
|---|---|---|---|
| `dt_max` (loopTask 실시간) | `A00_run` 진입/이탈 millis | < 30ms (reload 제외) | 초과 시 chart 스로틀 |
| **`reload_cycle_ms`** | **A00_run reload 블록** | **< 1000ms** | **초과 시 파일 I/O 점검** |
| **`pendingReload` latency** | **requestReload → consume 사이** | **< 50ms** | **초과 시 T-loop 스로틀 점검** |
| `overrun_count` | 상동 | 0/분 | 초과 시 로그 |
| `stack_hwm` (모든 태스크) | 각 태스크 말미 | > 20% | 초과 시 스택 증설 |
| `pendingFreeQueue depth` | `queuePendingFree` | ≤ 1 | 2 도달 시 로그 경고 |
| **`motionApply_latency`** | **requestMotionSimApply → 소비** | **< 100ms** | **초과 시 T-loop 지연** |
| `WS client count` | `_broadcast` | < 5 | cleanupClients 주기 |
| `s_reconnectAttempts` | WF10 | ≤ 3/분 | 초과 시 백오프 |
| `heap_free` | W10 `/diag` | > 100KB | 미만 시 OTA 보류 |
| `timeValid` | TM10 | boot 후 30s 내 true | 실패 시 F-01 확인 |

## 8. 오버런 감시 기준선 (WDT 정책)
- loopTask WDT: **10s** (`esp_task_wdt_init(10, true)`)
- reload cycle 500ms는 WDT 대비 **5% 소비** — 안전
- **주의**: reloadAll이 CT10 mutex 보유 구간(swap만, <1ms) 이외는 mutex 미보유 → WDT feed 전 loopTask 지연 없음
- **주의**: 여러 reload가 짧은 간격 연속 도착 시 409로 차단 → loopTask 재진입 없음

## 9. 예산 위반 후보 — 최신 상태
| ID | 대상 | 상태 | 조치 |
|---|---|---|---|
| F-05 | `routeReload` (구) | ✅ 해결 | T-loop 위임, async_tcp < 1ms |
| F-06 | `routeMotion` (구) | ✅ 해결 | T-loop 위임, async_tcp < 5ms |
| F-10 | async_tcp 스택 | ⚠️ 관측 | F-05 후 여유 확보, 그래도 상향 후보 |
| I-5 | reload 사이클 LED | ⏸ 수용 | 500ms 순단 관찰 |
| O-3 | reload 실패 재시도 | ⚠️ 관측 | 재요청 필요 (문서화) |
| — | `POST /config/save` (신규) | 🟡 | saveDirtyConfigs 50~200ms, async_tcp 블로킹 (허용) |

## 10. 실측 계획 (권장 계측 코드)
- `A00_run` 진입/이탈 millis로 `dt` 로깅 (누적 히스토그램)
- reload 사이클 전후 millis로 `reload_cycle_ms` 로깅
- `requestReload`/`requestMotionSimApply` 시각 stamp → 소비 시각 diff 로깅
- 각 태스크 `uxTaskGetStackHighWaterMark()` 10분 주기 로그

## 11. 개정 이력
| 날짜 | 버전 | 변경 |
|---|---|---|
| (초기) | v1.0 | 최초 작성 (정적 감사) |
| (재감사) | v1.1 | §2 F-03/F-04/F-05 블록 추가. §3 async_tcp 감소. §5 reloadAll 이동. §7 신규 지표 3종. §9 최신 상태 |

