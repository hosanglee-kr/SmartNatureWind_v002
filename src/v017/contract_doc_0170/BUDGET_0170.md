# BUDGET.md — 시간 및 시스템 자원 예산

> WCET는 정적 추정. 실측 필수 항목은 [측정 필요]로 표시.

## 1. 태스크 매트릭스
| 태스크 | 코어 | 우선순위 | 주기 | 스택 할당 | WCET(추정) | 여유 |
|---|---|---|---|---|---|---|
| loopTask | 0 or 1 | 1 | `delay(10)` | 8192B | 30~100ms | [측정 필요] |
| async_tcp | 0 or 1 | 1(확인) | 이벤트 | 4096B(확인) | 가변 | [측정 필요] |
| WF10_Reconnect | any | 1 | 이벤트 | 8192B | ≤ 120s(재연결) | [측정 필요] |
| sys_evt(WiFi) | any | 20+ | 이벤트 | 3584B(추정) | <10ms | [측정 필요] |
| esp_timer | any | 22 | 주기 | - | <1ms | N/A |

**관측성**: `WF10::_wifiTask` 끝에 `uxTaskGetStackHighWaterMark()` 로깅 있음 (권장 유지).

## 2. loopTask WCET 예산 (주기 10ms + 처리시간)
| 블록 | 예상 WCET | 비고 |
|---|---|---|
| WDT reset | <10μs | 상수 |
| CT10::tick (스로틀 40ms) | 1~5ms | sim.tick 의존 |
| CT10_WS_tick (dirty 시) | 1~10ms | chart 120 포인트 직렬화 시 상한 |
| TM10::tick | <100μs | 대부분 조기 반환 |
| processPendingFree | <100μs | 경과 0 시 조기 |
| LED.run | <100μs | NeoPixel show |
| delay(10) | 10ms | 항상 |

**평상시 합계**: ~15~25ms / 10ms 주기 → 오버런 없음 (지터 평균화).
**chart broadcast 시**: 최대 10ms 추가 → 25ms 스파이크 가능.
[측정 필요]: `millis()` 기반 루프 시간 dt_max 로깅 권장.

## 3. async_tcp 위험 호출 (WCET)
| 라우트 | 호출 | 예상 WCET | 위험 |
|---|---|---|---|
| `POST /reload` | CT10::reloadAll → C10::loadAll (8 파일 I/O) | 100~500ms | High (async_tcp 블로킹) |
| `POST /system`, `/motion`, `/wifi/config` | patch + saveDirtyConfigs (파일 쓰기) | 50~200ms | Mid |
| `GET /wifi/scan` | WiFi.scanNetworks() | 1~2s | High (필수적 블로킹) |
| `POST /ai/gemini` | WiFiClientSecure.connect+read | ≤15s | Mid (rate limit 3s) |
| `POST /fwUpdate` | Update.write() | 수십 초 | High (의도된 블로킹) |
| `POST /fileUpload` | LittleFS.write() | 스트리밍 | Mid (2MB 제한) |

**완화 원칙**: 이들 라우트는 async_tcp 전용이며 loopTask의 critical section과 무관. 단, `reloadAll`이 CT10 mutex를 보유하는 짧은 구간(swap만)만 loopTask를 지연시킴 (<1ms). `loadAll`은 mutex 없이 실행되어 안전.

## 4. WF10_Reconnect 태스크 (재연결)
| 단계 | WCET | 비고 |
|---|---|---|
| sem take | 무한 | - |
| getRootSnapshot | <10μs | portMUX |
| memcpy snapshot | ~200B | 상수 |
| applyConfig → init → startSTA | ≤ 90s (5회 × 2s WiFiMulti + delay) | 실패 시 |
| 성공 경로 | 2~10s | AP 응답속도 의존 |
| 스택 워터마크 로깅 | <10μs | 유지 권장 |

**블로킹 허용 태스크**: T-wf는 WDT 미등록 (esp_task_wdt_add 없음) → 90s 블로킹 정상.

## 5. 잠재적 블로킹 지점 식별
| 함수 | 최대 블로킹 | 시스템 영향 | 완화 |
|---|---|---|---|
| `WiFiMulti.run(2000)` | 2s/회 × 5 | T-wf만 | 허용 |
| `WiFi.softAP()` | 100~500ms | T-wf | 허용 |
| `WiFi.scanNetworks(false, true)` | 1~2s | async_tcp | 허용 (명시적 요청) |
| `LittleFS.open/read/write` | 10~200ms | 호출 태스크 | 파일 크기 상한 |
| `serializeJson(chart120)` | 1~5ms | T-loop | file-static doc |
| `S10::toChartJson()` (std::vector) | 1~3ms | T-loop (mutex) | capacity 예약 |
| `esp_task_wdt_init` | 즉시 | A00_init | - |
| `delay(10)` (loop) | 10ms | T-loop | 스로틀 목적 |
| `TM10 getLocalTime()` | <50μs | 모든 태스크 | - |
| `Logger::log()` 시리얼 | 20~100μs/로그 | 모든 태스크 | 레벨 조정 |

## 6. 스택 예산 (정적 추정)
| 태스크 | 할당 | 최대 사용 추정 | 안전 마진 | 비고 |
|---|---|---|---|---|
| loopTask | 8192B | 3~5KB (JSON doc + 재귀 호출) | 3KB | [측정 필요] |
| async_tcp | 4096B | 2.5~3.5KB (Gemini 경로 static 승격) | 여유 부족 가능 | [측정 필요] — CONFIG_ASYNC_TCP_STACK_SIZE 상향 후보 |
| WF10_Reconnect | 8192B | 3~4KB (startSTA + WiFiMulti) | 4KB | 워터마크 로깅 있음 |
| sys_evt | 3584B | 2~3KB | 여유 낮음 | 손대지 않음 |

## 7. 관측성(Observability) 메트릭
| 지표 | 수집 위치 | 목표 | 조치 |
|---|---|---|---|
| `dt_max` (loopTask 실시간) | `A00_run` 진입/이탈 millis | < 30ms | 초과 시 chart 스로틀 |
| `overrun_count` | 상동 | 0/분 | 초과 시 로그 |
| `stack_hwm` (모든 태스크) | 각 태스크 말미 | > 20% | 초과 시 스택 증설 |
| `pendingFreeQueue depth` | `queuePendingFree` | ≤ 1 | 2 도달 시 로그 경고 |
| `WS client count` | `_broadcast` | < 5 | cleanupClients 주기 |
| `s_reconnectAttempts` | WF10 | ≤ 3/분 | 초과 시 백오프 |
| `heap_free` | W10 `/diag` | > 100KB | 미만 시 OTA 보류 |
| `timeValid` | TM10 | boot 후 30s 내 true | 실패 시 F-01 확인 |

## 8. 오버런 감시 기준선 (권장 WDT 정책)
- loopTask WDT: 10s (`esp_task_wdt_init(10, true)`)
- 위반 시 리부팅 + `A00_init` 재실행
- **주의**: reloadAll (async_tcp) 중 CT10 mutex 보유 구간이 짧더라도, loopTask가 WDT feed 전에 100ms 이상 대기하면 경고 (실측 필요)

## 9. 감사 관측: 예산 위반 후보
| ID | 대상 | 내용 | 권고 |
|---|---|---|---|
| F-05 | async_tcp `routeReload` | 100~500ms 파일 I/O 블로킹 | T-wf 유사 태스크로 이관 후보 |
| F-06 | async_tcp `routeMotion POST` | `applyMotionSimConfigToSim` 이 CT10 mutex 100ms 대기 가능 | async에서 CT10 mutex 획득 경로 최소화 |
| F-10 | async_tcp 스택 4096B | Gemini/OTA 경로 static 승격으로 완화했으나 여유 낮음 | CONFIG_ASYNC_TCP_STACK_SIZE=8192 상향 후보 |


