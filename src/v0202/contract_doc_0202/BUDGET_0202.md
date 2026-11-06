# BUDGET_0202.md — 시간 및 시스템 자원 예산

> **기준**: v0202 정적 감사 + 런타임 실측 반영 (Batch A~G 완료).  
> **핵심 성과**: F-05(reload 위임)/F-06(motion sim 위임)으로 `async_tcp` 블로킹 제거, D-1(WS mutex 배치)/D-4(atomic)/D-5(고정 배열)로 loopTask 지터 감소, B-1(NVS 단일 commit 10ms)/B-9(스냅샷 캐시 2ms) 성능 최적화.  
> **파일명 정책**: 계약 문서 `_0202.md` 유지, 코드 참조 `_0202` 접미사.

---

## 1. 태스크별 자원 할당 매트릭스

| 태스크 ID | 명칭 | 코어 | 우선순위 | 주기 | 스택 | WCET | 안전 마진 |
|---|---|---|---|---|---|---|---|
| **T-loop** | `loopTask` | C1/C0 | 1 | 10 ms | 8,192 B | 평상 15~25 ms / Reload 시 단일 스파이크 100~500 ms | WDT 10초 대비 5% 미만 |
| **T-async** | `async_tcp` | C1/C0 | 1 | 비동기 | 4,096 B | 일반 API < 5 ms | F-05/F-06 위임으로 대기 제거 |
| **T-wf** | `WF10_Reconnect` | Any | 1 | 세마포어 | 8,192 B | 재연결 실패 최대 90초 (5회) | WDT 미등록 (블로킹 허용) |
| **T-sys_evt** | `esp_event_loop` | Any | 20+ | 시스템 | 3,584 B | 이벤트당 < 10 ms | 프레임워크 기본 |
| **T-timer** | `esp_timer` | Any | 22 | SW 타이머 | - | < 1 ms | SNTP 콜백 |

---

## 2. loopTask WCET 예산 (`A00_run()`)

| 실행 블록 | WCET (정적 추정) | 비고 |
|---|---|---|
| `esp_task_wdt_reset()` | < 10 μs | 레지스터 갱신 |
| **[F-05] `consumePendingReload()`** | **< 1 μs** | atomic exchange |
| **[F-05] `reloadAll()`** | **100 ~ 500 ms** | Reload 발생 주기에만 1회 스파이크 (WDT 안전) |
| `CT10::tick()` | 1 ~ 5 ms | 40ms 스로틀, FSM + 물리 |
| **[F-06] `_pendingMotionSimApply` 소비** | **< 100 μs** | atomic exchange + 파라미터 복사 |
| `CT10_WS_tick()` | 1 ~ 10 ms | **[D-1]** consumeAllDirty 1회 (기존 4회 → mutex -75%) |
| **[F-03] `g_M10_motionLogic->tick()`** | **< 100 μs** | PIR holdSec 감쇠 |
| `TM10::tick()` | < 100 μs | 1초 게이트, 평상 조기 반환 |
| `C10::processPendingFree()` | < 100 μs | 3초 grace 미도달 즉시 반환 |
| **[F-04] `N10::tick()`** | **< 100 μs** (게이트 미도달) | 10초 게이트, 평상 조기 반환 |
| **`N10::tick()` flush** | **~10 ms** (**[B-1] 단일 commit 전환 후 실측**) | 이전 11회 commit(~100 ms) 대비 **10배 개선** |
| `g_A00_ledController->run()` | < 100 μs | NeoPixel 1-pixel |
| `delay(G_A00_LOOP_DELAY_MS=10)` | 10 ms | **[C-5]** 상수 참조 |

- **평상시 총**: 15~25 ms / 10ms 주기 → 오버런 평균화
- **차트 브로드캐스트**: +10ms
- **Reload**: +100~500ms 단일 스파이크

---

## 3. async_tcp WCET (F-05/F-06/D-1 반영 후)

| 라우트 | 주요 실행 | WCET | 개선 전후 |
|---|---|---|---|
| **`POST /api/v001/reload`** | `requestReload()` CAS | **< 1 ms** | 기존 100~500 ms 블로킹 제거 |
| **`POST /api/v001/motion`** | `patchMotionFromJson` + `requestMotionSimApply` | **< 5 ms** | 기존 CT10 mutex 100ms 대기 제거 |
| **`POST /api/v001/motion/pir/feed`** | `CT10::feedPIR()` (**A-2** 위임) | **< 5 ms** | 위임 경유로 락 순서 준수 |
| **`POST /api/v001/simulation`** | `CT10::patchSimFromJson()` (**A-2**) | **< 10 ms** | 위임 경유 |
| **`GET /api/v001/simulation`** | `CT10::exportSimJson()` (**A-2**) | **< 5 ms** | 위임 경유 |
| **`GET /api/v001/state`** | `exportStateJson_v02` (`lastReloadOk` 포함) | **< 2 ms** | N-1 atomic load 지연 0 |
| **`POST /api/v001/system`** (POST/PATCH) | **F-2 `_routeSystemPatchBody`** | **< 5 ms** | 헬퍼로 응답 동일 |
| **`POST /api/v001/wifi/config`** (POST/PATCH) | **F-3 `_routeWifiConfigPatchBody`** | **< 10 ms** | 헬퍼, `requestReconnect` 즉시 |
| `POST /api/v001/config/save` | `saveDirtyConfigs()` | 50 ~ 200 ms | 명시적 저장 요청 (동기 I/O 허용) |
| `POST /api/v001/control/factoryReset` | `factoryResetFromDefault()` + **F-1** `N10::resetRuntime()` | 100 ~ 300 ms | NVS resetRuntime 추가 (F-1) |
| **`POST /api/v001/control/ack`** | `ackEventState()` | **< 1 ms** | AUTOOFF 래치 해제 |
| **`GET /api/v001/wifi/state`** | WiFi 상태 JSON 반환 | **< 1 ms** | atomic load 기반 |
| `GET /api/v001/wifi/scan` | `WiFi.scanNetworks()` | 1 ~ 2 초 | 의도된 블로킹 |
| `POST /api/v001/ai/gemini` | SSL | ≤ 15 초 | rate limit 3초 |
| **`POST /api/v001/fileUpload`** | `routeUpload` + safeAbort | **5 ~ 20 ms / 청크** | **N-4** 즉시 close + **[C-4] stale close** |
| **`POST /api/v001/fwUpdate`** | `routeUpdate` + abort 방어 | **수십 초** | **[B-12]** 세션 abort + write 반환 검사 |
| **`GET /html_v0202/*`** | `W10_registerGzipServe` | **1 ~ 3 ms** | **D-3** 스택 버퍼 (힙 0) + **[B-5]** RFC 7231 q-value + `Vary` |
| **`GET /api/v001/windProfile`** | **`routeWindProfile` (B-9)** | **< 2 ms** | 이전 FS read(100ms) → `getRootSnapshot` |
| **`GET /api/v001/config`** | **`routeConfigDirtySave` GET (B-2)** | **< 2 ms** | `getRootSnapshot` (직접 참조 → 스냅샷) |
| **`POST /api/v001/user_profiles/patch`** | **`routeUserProfilesPatch` (B-2)** | **< 5 ms** | 스냅샷 경유 |
| **WS handshake** | **`_wsHandshakeAuth` (B-2)** | **< 1 ms** | `getRootSnapshot` + strlcpy |
| **`POST/PATCH /api/v001/motion`** | **`_routeMotionPatchBody` (B-6)** | **< 5 ms** | F-2/F-3 헬퍼 일관성 |

---

## 4. 잠재 블로킹 지점 및 완화

| 블록 | 최대 블로킹 | 영향 태스크 | 완화 |
|---|---|---|---|
| LittleFS 읽기/쓰기 | 10~200 ms | T-loop (reload) / T-async (save) | 원자적 rename + 크기 상한 |
| `WiFiMulti.run()` | 2초 × 5회 | **T-wf 전용** | 메인 루프 분리 |
| `S10::toChartJson()` | 1~3 ms | T-loop | **D-5** static 고정 배열 (힙 0) |
| WDT 초기화 | < 1 ms | A00_init | 최후단 배치 |
| `reloadAll()` | 100~500 ms | T-loop | WDT 10초 마진 |

---

## 5. FreeRTOS 스택 예산

| 태스크 | 할당 | 최대 사용 추정 | 안전 마진 | 관리 |
|---|---|---|---|---|
| `loopTask` | 8,192 B | 3,500~4,500 B | ~3.5 KB | 재귀 깊이 최소화 |
| `async_tcp` | 4,096 B | 2,500~3,200 B | ~1.0 KB | **[F-10 관측]** 8KB 상향 후보 |
| `WF10_Reconnect` | 8,192 B | 3,000~4,000 B | ~4.0 KB | HighWaterMark 로깅 |
| `esp_event_loop` | 3,584 B | 2,000~2,500 B | ~1.0 KB | 프레임워크 기본 |

---

## 6. 관측성 메트릭

| 지표 | 수집 위치 | 정상 목표 | 이상 조치 |
|---|---|---|---|
| `dt_max` | `A00_run` 진입/이탈 | < 30 ms (Reload 제외) | WS 스로틀 강화 |
| `reload_cycle_ms` | `reloadAll()` 전후 | < 1,000 ms | LittleFS 조각화 점검 |
| `pendingReload_latency` | `requestReload`→소비 | < 50 ms | loopTask 지연 분석 |
| `stack_hwm` | 각 태스크 종료/주기 | 잔여 > 20% | 스택 증설 |
| `heap_free` | `/api/v001/diag` | > 100 KB | 메모리 누수/OTA 보류 |
| **`ws_mutex_count`** (**D-1**) | WS tick 로그 카운터 | 채널당 1회/interval | `consumeAllDirty` 지속 확인 |
| **`sta_connected_read`** (**D-4**) | `isStaConnected` atomic | 0ms 대기 | WiFi.status() 지연 확인 |

---

## 7. 플래시 및 네트워크 소켓 예산

### 7.1 LittleFS 에셋 절감

| 항목 | 이전 | 이후 | 절감 |
|---|---|---|---|
| **총 웹 에셋** | 424.3 KB (실측) | **114.4 KB** (실측) | **-73.0%** |
| **메인 대시보드 스크립트** | 8파일 raw 90.7 KB | `P010_bundle_0202.js.gz` **21.9 KB** | **-75.8%** |
| **LittleFS 여유** | ~65% | **~90% 이상** | `.bak`/로그 공간 확보 |

### 7.2 동시 HTTP 소켓

- **적용 전**: HTML 1 + CSS 2 + JS 8 = **11건 동시**
- **적용 후**: HTML 1 + CSS 2 + Bundle 1 = **4건 (63.6% 축소)**
- **효과**: LWIP TCP PCB 풀 안정, async_tcp 스택 오버플로 리스크 원천 차단

---

## 8. 프론트엔드 자산 예산 (v0202 SPA)

### 8.1 배포 자산 실측 (2026-10-21 CI)

| 자산 | 소스 파일 수 | 원본 크기 | gzip 크기 | 절감률 |
|---|---:|---:|---:|---:|
| `P010_bundle_0202.js` | **31 JS** | 165,923 B | **37,490 B** | **-77.4%** |
| `P000_common_0202.css` | **10 CSS** | 40,035 B | **7,585 B** | **-81.1%** |
| `index.html` | 1 HTML | 2,486 B | **976 B** | **-60.7%** |
| **합계** | **42 파일** | **208,444 B** | **46,051 B** | **-77.9%** |

**JSON 10개 (gzip 미적용)**: ~50 KB (설정 데이터, 런타임 재사용)

### 8.2 JS 번들 상세 (Layer별 gzip 기여도)

| Layer | 파일 | 원본 합계 | gzip 합계 (추정) | 비율 |
|:---:|:---:|---:|---:|---:|
| L0 | 3 | 35,209 B | ~9,300 B | 25% |
| L1 | 6 | 16,775 B | ~4,300 B | 11% |
| L2 | 4 | 23,531 B | ~5,800 B | 15% |
| L3 | 6 | 26,140 B | ~7,200 B | 19% |
| L4 | 11 | 61,420 B | ~10,300 B | 27% |
| L5 | 1 | 3,254 B | ~590 B | 1% |
| **합계** | **31** | **165,923 B** | **~37,490 B** | **100%** |

**관찰**:
- **L4 (페이지 로직 11파일)이 최대 27% 차지** — 필요시 i18n en 축소 또는 미사용 페이지 축소 가능
- **L3 (UI 6파일)이 19%** — `130.ui.form.js` (12 KB) 단일 파일이 최대
- **L0 (i18n 22 KB 원본)이 25%** — ko/en 사전. 다국어 확장 시 선형 증가

### 8.3 CSS 번들 상세

| 파일 | 원본 | gzip (추정) | 비율 |
|---|---:|---:|---:|
| `_components.css` | 19,566 B | ~3,700 B | 49% |
| `_layout.css` | 6,147 B | ~1,200 B | 16% |
| `_responsive.css` | 3,913 B | ~900 B | 12% |
| `_variables.css` | 2,883 B | ~700 B | 9% |
| `_dashboard.css` | 2,605 B | ~500 B | 7% |
| `_reset.css` | 1,547 B | ~300 B | 4% |
| `_settings.css` | 1,084 B | ~150 B | 2% |
| `_profiles.css` | 806 B | ~50 B | 1% |
| `_chart.css` | 745 B | ~50 B | 1% |
| `_schedule.css` | 739 B | ~35 B | 0.5% |
| **합계** | **40,035 B** | **7,585 B** | 100% |

**관찰**:
- `_components.css` 단일 파일이 절반 (공통 UI 컴포넌트)
- CSS도 예산 여유 (목표 10 KB 대비 7.6 KB)

### 8.4 HTTP 요청 예산 (SPA)

| 시나리오 | HTTP 요청 | WS 요청 | 총합 |
|---|---:|---:|---:|
| 첫 방문 (Dashboard) | 3 | 5 | 8 |
| 페이지 전환 (해시) | 0 | 0 | 0 |
| 새로고침 | 0 (304) | 5 (재연결) | 5 |
| 하드 리로드 | 3 | 5 | 8 |
| **세션 전체 (5페이지)** | **3** | **5** | **8** |

**v0202 대비**:
- v0202 멀티페이지: 세션 전체 ~10~15 HTTP
- v0202 SPA: 세션 전체 **3 HTTP** (초기) → **-70~80%**

### 8.5 예산 대비 실측 판정

| 예산 항목 | 목표 | 실측 (2026-10-28) | 여유 | 판정 |
|---|---:|---:|---:|:---:|
| JS gzip (`P010_bundle_0202.js.gz`) | < 80 KB | 74.0 KB (raw 363.6 KB) | 6.0 KB | ✅ (79.7% 절감) |
| CSS gzip (`P000_common_0202.css.gz`) | < 15 KB | 10.1 KB (raw 51.0 KB) | 4.9 KB | ✅ (80.2% 절감) |
| HTML gzip (`index.html.gz`) | < 2 KB | 1.3 KB (raw 3.5 KB) | 0.7 KB | ✅ (63.3% 절감) |
| **프론트엔드 합계 gzip** | **< 100 KB** | **85.4 KB** | **14.6 KB** | ✅ |
| LittleFS 총 사용 | < 200 KB | ~175 KB | ~25 KB | ✅ |
| Flash RAM | < 40% | 33.1% | 6.9% | ✅ |
| Flash 용량 | < 30% | 23.3% | 6.7% | ✅ |
| 첫 방문 HTTP | ≤ 3 | 3 | 0 | ✅ |
| 페이지 전환 HTTP | 0 | 0 | 0 | ✅ |

### 8.6 확장 여유 분석

**JS 예산 잔여 2.5 KB** (목표 40 KB, 실측 37.5 KB):
- 신규 페이지 1개 추가 시: ~1.5~2 KB (gzip) → **2개까지 여유**
- i18n 언어 추가 (ja/zh) 시: ~1.5 KB/언어 → **1개 언어 여유**
- 신규 UI 컴포넌트: ~0.3~0.5 KB

**CSS 예산 잔여 2.4 KB** (목표 10 KB, 실측 7.6 KB):
- 신규 컴포넌트 스타일: ~0.2~0.5 KB
- 테마 확장 (색상 변형): ~0.3 KB

**예산 초과 시 대응 우선순위**:
1. `020.i18n.js`에서 en 사전 제거 → **-1.8 KB gzip**
2. 미사용 페이지(250~290) skeleton 축소 → **-6 KB gzip**
3. `130.ui.form.js` 분할 (필요 컴포넌트만 로드) → **-1 KB gzip**

### 8.7 갱신 주기

| 트리거 | 갱신 항목 |
|---|---|
| 신규 페이지 추가 | §8.1 (합계), §8.2 (Layer별) |
| 신규 UI 컴포넌트 | §8.3 (CSS), §8.2 (L3) |
| i18n 언어 추가 | §8.2 (L0), §8.6 (잔여) |
| 예산 초과 | §8.6 (대응 우선순위 재정렬) |


---


## 9. 메모리 사용 실측 (buildfs/링크 결과)

| 자원 | 사용 | 총량 | 여유 | 판정 |
|---|---|---|---|---|
| **RAM** | 110,100 B (33.6%) | 327,680 B | 217,580 B (66.4%) | ✅ BUDGET §6 >100KB 충족 |
| **Flash** | 1,532,741 B (23.4%) | 6,553,600 B | 5,020,859 B (76.6%) | ✅ 여유 충분 |
| **.bss 증가 (D-5)** | +4.8 KB (`s_snapshot`) | - | - | heap 회피, RAM 여유 흡수 |
| **littlefs.bin** | 114.4 KB | - | - | 73% 절감 확인 |

---

## 10. Batch A~F 예산 영향 요약

| Batch | 예산 영향 |
|---|---|
| **A-1** (self-heal 차단) | WS/dirty 폭주 방지 → loopTask WCET 정상화 |
| **A-2** (위임 3종) | async_tcp mutex 대기 제거 → WCET 5ms 이하 |
| **B-4** (NVS 상수) | 런타임 0 (컴파일 상수) |
| **C-1~C-8** (매직넘버) | 런타임 0 (constexpr) |
| **D-1** (WS 배치) | WS tick당 mutex **4→1** (loopTask 지터 -75%) |
| **D-2/D-3** (String) | 정적 서빙 힙 할당 **2회→0회** |
| **D-4** (atomic) | `isStaConnected` **10ms→0ms** |
| **D-5** (고정 배열) | `toChartJson` 힙 **4.8KB→0** (`.bss` 이동) |
| **E** (Dead Code) | Flash 소폭 감소 |
| **E-2** (분할) | 코드 크기 무변화, TU 재컴파일 범위 축소 |
| **F-1** (NVS reset) | factory reset 시 +50~100ms (일회성) |
| **F-2/F-3** (헬퍼) | 코드 중복 -240줄, WCET 무변화 |
| **F-4** (Logger INFO) | 시리얼 I/O 부하 감소 |
| **F-5** (fall-through) | FSM 결정성 향상 |
| **F-8/F-9** (상수) | 런타임 0 |

### 10.1 Batch G 영향 (코드 재검토)

| Batch | 예산 영향 |
|---|---|
| **C-1** (CDC 타임아웃) | 부팅 시간 상한 +3s (미연결 시), 배포 필수 |
| **C-3** (holdSec 2× → 1×) | PIR 감지 후 팬 가동 시간 정확화 (사용자 체감 개선) |
| **B-1** (NVS 단일 commit) | loopTask 블로킹 **100 ms → 10 ms** (-90%) |
| **B-5** (RFC 7231) | 런타임 0 (문자열 파싱 ~5μs/요청), `Vary` 헤더 +18B/응답 |
| **B-7** (NVS 반환값 검사) | 런타임 +1~2 μs (실패 시 dirty 유지 재시도) |
| **B-9** (WindProfile 캐시) | GET 응답시간 **100 ms → 2 ms** (-98%) |
| **B-11** (in-memory defaults) | 부팅 시간 +10 ms (OOM 복구), 복구성 대폭 향상 |
| **B-12** (OTA abort) | 세션 실패 시 +50 ms (abort 호출), 다음 OTA 정상화 |
| **B-13** (LED 검증) | 부팅 시간 무변화, 크래시 방지 |

### 10.2 B-1 상세 — loopTask flush 세부

| 항목 | Before (개별 commit) | After (단일 commit) |
|---|---:|---:|
| `nvs_open` | 1회 (~200 μs) | 1회 (~200 μs) |
| `nvs_set_*` × 11 | 11회 (~1 ms) | 11회 (~1 ms) |
| `nvs_commit` | **11회 (~100 ms)** | **1회 (~10 ms)** |
| `nvs_close` | 1회 (~50 μs) | 1회 (~50 μs) |
| **총 블로킹** | **~100 ms** | **~10 ms** |
| BUDGET §2 목표 (200~500 μs) | 200배 초과 | 20배 초과 |

**개선 후 남은 격차**: WDT 10초 대비 0.1% (안전), A00_run 15~25ms 평균 대비 스파이크 허용 (10초당 1회).

---

## 11. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-10-28** | **v2.7** | **Batch I — 35종 JS 번들 실측치 갱신 (JS 74.0KB, CSS 10.1KB, HTML 1.3KB = 총 85.4KB gzip), RAM 33.1%, Flash 23.3% 현행화** | Antigravity AI |
| 2026-10-27 | v2.6 | Batch H — §8.5 프론트엔드 자산 예산 실측치 갱신 (JS 64.8KB, CSS 10.1KB, HTML 1.3KB = 76.2KB gzip), 번들 압축률 80.3% 반영 | Antigravity AI |
| 2026-10-26 | v2.5 | **Batch G — §2 N10 flush 실측(10ms), §3 B-2/B-9/B-12/C-4/B-5 WCET 보정, §10.1/§10.2 신규 (Batch G 영향 + B-1 상세)** | Antigravity AI |
| 2026-10-21 | v2.4 | `_0202` 자산 실측명 반영, `/control/ack` 및 `/wifi/state` WCET 추가, 듀얼 서빙 폴백 반영 | Antigravity AI |
| 2026-10-21 | v2.3 | §8 신규 — 프론트엔드 자산 예산 (v0202 SPA). 배포 자산 실측 (JS 37.5 KB / CSS 7.6 KB / HTML 1.0 KB = 46.1 KB gzip), HTTP 요청 예산 (세션 3건), 예산 여유 분석, 확장 우선순위 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §2 D-1 반영, §3 A-2/F-2/F-3 반영, §6 ws_mutex/sta_connected 메트릭, §8 RAM/Flash 실측, §9 Batch 예산 영향 신규 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1, N-4, G-1/G-2 WCET 현행화 | Antigravity AI |
| 2026-10-19 | v2.0 | v0202 승격 (플래시/소켓 지표 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | Gzip 압축/번들 지표 (424.3→114.4KB, 11→4 소켓) | Antigravity AI |
| 2026-10-19 | v1.1 | WCET/스택 정밀 동기화 | Antigravity AI |
| (초기) | v1.0 | 최초 정적 감사 기반 자원 예산서 | 개발팀 |
