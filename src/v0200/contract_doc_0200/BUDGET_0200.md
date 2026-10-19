# BUDGET_0200.md — 시간 및 시스템 자원 예산

> **기준**: v0200 소스 코드 정적 감사 및 FreeRTOS 자원 분석 반영.  
> **핵심 성과**: F-05(Reload 위임), F-06(Motion Sim 위임)을 통해 `async_tcp`의 주 블로킹 소스를 제거하고 `loopTask` 중심으로 부하를 질서 있게 재배치함.

---

## 1. 태스크별 시스템 자원 할당 매트릭스

| 태스크 ID | 태스크 명칭 | 코어 친화도 | 우선순위 | 실행 주기 | 스택 할당 | WCET (최악 실행 시간 추정) | 안전 마진 / 비고 |
|---|---|---|---|---|---|---|---|
| **T-loop** | `loopTask` | Core 1 / 0 | 1 | 10 ms (`delay(10)`) | 8,192 B | 평상시 15~25 ms<br>(Reload 시 단일 스파이크 100~500 ms) | 3~4 KB 여유, WDT 10초 대비 5% 미만 소비 |
| **T-async** | `async_tcp` | Core 1 / 0 | 1 | 비동기 이벤트 | 4,096 B | 일반 API < 5 ms<br>(F-05/F-06 위임으로 대기 제거) | [F-10] 8,192 B 증설 후보 관리 |
| **T-wf** | `WF10_Reconnect` | Any | 1 | 세마포어 이벤트 | 8,192 B | 재연결 실패 시 최대 90초 (5회 시도) | WDT 미등록 태스크 (블로킹 허용) |
| **T-sys_evt** | `esp_event_loop` | Any | 20+ | 시스템 이벤트 | 3,584 B | 이벤트당 < 10 ms | 시스템 내부 기본값 |
| **T-timer** | `esp_timer` | Any | 22 | 소프트웨어 타이머 | - | < 1 ms | 고우선순위 서비스 |

---

## 2. loopTask WCET 예산 분석 (`A00_run()`)

매 10ms 주기 루프 내 개별 블록의 실행 시간 예산은 다음과 같이 엄격히 관리된다:

| 실행 블록 | 예상 WCET (정적 추정) | 비고 및 리스크 완화 기제 |
|---|---|---|
| `esp_task_wdt_reset()` | < 10 μs | 단순 하드웨어/소프트웨어 레지스터 갱신 |
| **[F-05] `consumePendingReload()` 검사** | **< 1 μs (평상시)** | `std::atomic::exchange(false)` 초경량 원자 연산 |
| **[F-05] `reloadAll()` 실행** | **100 ~ 500 ms** | **Reload 요청 발생 주기에만 단 1회 스파이크** (WDT 10s 안전) |
| `CL_CT10_ControlManager::tick()` | 1 ~ 5 ms | 40ms 스로틀, FSM 판정 및 물리 시뮬레이션 |
| **[F-06] `_pendingMotionSimApply` 소비** | **< 100 μs** | 원자 교환 후 `applyMotionSimConfigToSim()` 파라미터 복사 |
| `CT10_WS_tick()` | 1 ~ 10 ms | 변경 감지 시에만 1개 채널 직렬화 (120포인트 차트 시 상한 10ms) |
| **[F-03] `g_M10_motionLogic->tick()`** | **< 100 μs** | PIR holdSec 감쇠 타이머 검사 |
| `CL_TM10_TimeManager::tick()` | < 100 μs | 1초 인터벌 게이트, 평상시 조기 반환 |
| `CL_C10_ConfigManager::processPendingFree()`| < 100 μs | 3초 grace period 미도달 시 즉시 반환 |
| **[F-04] `CL_N10_NvsManager::tick()`** | **< 100 μs (평상시)** | 10초 게이트 인터벌, flush 발생 시 200~500 μs 플래시 쓰기 |
| `g_A00_ledController->run()` | < 100 μs | NeoPixel 1-pixel RGB 비트뱅킹 출력 |
| `delay(10)` | 10 ms | 고정 슬립, FreeRTOS IDLE 태스크에 CPU 양보 |

- **평상시 총 실행 시간**: ~15 ~ 25 ms / 10 ms 주기 → 지터가 평균화되어 오버런 없음.
- **차트 브로드캐스트 발생 시**: 최대 +10 ms 추가 (총 25~35 ms).
- **Reload 실행 주기**: +100 ~ 500 ms 단일 스파이크 발생 (WDT 10초 제한 대비 5% 수준으로 완전히 안전).

---

## 3. async_tcp WCET 분석 (F-05, F-06 반영 후)

| HTTP / WS 라우트 | 주요 실행 내용 | 예상 WCET | F-05 / F-06 적용 전후 비교 |
|---|---|---|---|
| **`POST /api/v001/reload`** | `requestReload()` (atomic CAS) | **< 1 ms** | **✅ 해결: 기존 100~500ms 파일 I/O 블로킹 제거** |
| **`POST /api/v001/motion`** | `patchMotionFromJson` + `requestMotionSimApply` | **< 5 ms** | **✅ 해결: 기존 CT10 뮤텍스 대기(최대 100ms) 제거** |
| `POST /api/v001/config/save` | `saveDirtyConfigs()` (LittleFS 쓰기) | 50 ~ 200 ms | 명시적 저장 요청 (동기 파일 I/O 허용) |
| `POST /api/v001/system`, `/wifi/config` | 메모리 패치 + 동기 저장 | 50 ~ 200 ms | 명시적 변경 요청 |
| `GET /api/v001/wifi/scan` | `WiFi.scanNetworks()` | 1 ~ 2 초 | Wi-Fi 라디오 주파수 스캔 (의도된 블로킹) |
| `POST /api/v001/ai/gemini` | `WiFiClientSecure` SSL 통신 | ≤ 15 초 | 외부 LLM API 지연 (3초 rate limit 적용) |
| `POST /api/v001/fwUpdate` | OTA 펌웨어 스트리밍 쓰기 | 수십 초 | OTA 전용 세션 블로킹 |

---

## 4. 잠재적 블로킹 지점 및 완화 전략

| 기능 블록 | 최대 블로킹 시간 | 영향 받는 태스크 | 완화 및 방어 전략 |
|---|---|---|---|
| `LittleFS` 파일 읽기/쓰기 | 10 ~ 200 ms | T-loop (reload) / T-async (save) | 원자적 rename 및 파일 크기 상한 제한 |
| `WiFiMulti.run()` | 회당 2초 × 최대 5회 | **T-wf 전용** | 메인 제어 루프에서 분리된 전담 태스크에서만 실행 |
| `S10::toChartJson()` 직렬화 | 1 ~ 3 ms | T-loop | 정적 capacity 사전 할당 및 file-static 문서 사용 |
| WDT 초기화 | < 1 ms | A00_init | `A00_init()` 최후단에 배치하여 부팅 지연 리셋 방지 |
| `reloadAll()` 디스크 로드 | 100 ~ 500 ms | T-loop | WDT 타임아웃 10초 설정으로 안전 마진 확보 |

---

## 5. FreeRTOS 스택 예산 (Stack Budget)

| 태스크 | 할당된 스택 | 최대 사용 추정량 (High Water Mark) | 안전 마진 | 관리 방침 |
|---|---|---|---|---|
| `loopTask` | 8,192 B | 3,500 ~ 4,500 B | ~3.5 KB | reload 시 재귀 깊이 최소화로 안정적 |
| `async_tcp` | 4,096 B | 2,500 ~ 3,200 B | ~1.0 KB | F-05로 부담 완화, Gemini/OTA 고려 8KB 상향 후보 |
| `WF10_Reconnect` | 8,192 B | 3,000 ~ 4,000 B | ~4.0 KB | 태스크 종료 시 HighWaterMark 로깅 |
| `esp_event_loop` | 3,584 B | 2,000 ~ 2,500 B | ~1.0 KB | 프레임워크 기본 할당 유지 |

---

## 6. 관측성 (Observability) 메트릭

| 관측 지표 | 수집 및 계측 위치 | 정상 목표치 | 이상 시 조치 |
|---|---|---|---|
| `dt_max` | `A00_run` 진입/이탈 시간 측정 | < 30 ms (Reload 제외) | 초과 시 WebSocket 브로드캐스트 스로틀 강화 |
| `reload_cycle_ms` | `reloadAll()` 전후 millis | < 1,000 ms | 초과 시 LittleFS 조각화 및 플래시 I/O 점검 |
| `pendingReload_latency` | `requestReload` → 소비 시점 간격 | < 50 ms | 초과 시 loopTask 지연 분석 |
| `stack_hwm` | 각 태스크 종료/주기 시점 | 잔여 > 20% | 마진 부족 시 스택 크기 증설 |
| `heap_free` | `/api/v001/metrics` | > 100 KB | 메모리 누수 점검 및 OTA 보류 |

---

## 7. 플래시 스토리지 및 네트워크 소켓 예산 (Flash & Network Socket Budget)

### 7.1 LittleFS 플래시 스토리지 절감 예산
| 항목 | 번들링/Gzip 적용 전 | 번들링/Gzip 적용 후 | 절감 효과 |
|---|---|---|---|
| **총 웹 에셋 크기** | 428.9 KB (29개 파일) | **114.6 KB** (29개 Gzip 파일) | **-314.3 KB (-73.3%)** |
| **메인 대시보드 스크립트** | 8개 파일 총 158.4 KB | `P010_bundle_0200.js.gz` **36.2 KB** | **-122.2 KB (-77.1%)** |
| **LittleFS 잔여 여유 공간** | 약 65% | **약 90% 이상** | 설정 JSON 백업(`.bak`) 및 로그 공간 극대화 |

### 7.2 LWIP TCP 소켓 및 동시 커넥션 예산
- **메인 대시보드 로드 시 동시 HTTP 커넥션**:
  - 적용 전: HTML 1개 + CSS 2개 + 개별 JS 8개 = **최소 11건 동시 요청** (LWIP TCP PCB 풀 고갈 위험, `async_tcp` 대기열 지연 발생)
  - 적용 후: HTML 1개 + CSS 2개 + 단일 번들 JS 1개 = **4건 요청으로 63.6% 축소**
- **효과**: ESP32 LWIP TCP 소켓 점유 완화, 브라우저 로딩 완료 시간 대폭 단축, `async_tcp` 스택 오버플로우 리스크 원천 차단.

---

## 8. 개정 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-19 | v2.0 | v0200 승격: 소스/문서/에셋 전체 접미사 _0200 단일화 및 LittleFS/main.cpp 빌드 전환 + (v1.2의 플래시/소켓 예산 지표 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | 웹 에셋 Gzip 사전 압축 및 번들링 적용에 따른 플래시 스토리지(428.9KB→114.6KB, -73.3%) 및 동시 HTTP 소켓 예산(11개→4개) 최적화 지표 반영 | Antigravity AI |
| 2026-10-19 | v1.1 | v0200 소스 코드 기준 WCET 및 스택 예산 정밀 동기화, `_0200.md` 체계 링크 현행화 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 자원 예산서 작성 | 개발팀 |
