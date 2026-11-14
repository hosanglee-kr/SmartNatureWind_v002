# TEST_PLAN_0203.md — 회귀 테스트 인덱스 (v4.4)

> **검증 대상**: Smart Nature Wind v0203 펌웨어 + v0203 SPA 프론트엔드
> **기준선**: Batch A~F + Phase 0~7 + Batch G/H/I + Stage 8 AI/Live + Stage 9 UI/UX
> **파일명 정책**: 계약 문서 `_0203.md` 유지
> 이 파일은 `src/v0203/tools_0203/split_test_plan_0203.py`가 생성합니다. (인덱스는 원본에서 유지부만 추출).

---

## 🔍 AI 빠른 참조 (분할 맵)

| 레이어 | 분할 파일 | 범위 | 릴리스 게이트 |
|---|---|---|---|
| L1~L5 | [`TEST_PLAN_L1_L5_0203.md`](TEST_PLAN_L1_L5_0203.md) | T-1 ~ T-45 | [§6](#6-phase-7-릴리스-게이트) G-7.0, G-7.1 |
| L6~L8 | [`TEST_PLAN_L6_L8_0203.md`](TEST_PLAN_L6_L8_0203.md) | T-46 ~ T-113 | [§6](#6-phase-7-릴리스-게이트) G-7.2~G-8.2 |
| L9~L11 | [`TEST_PLAN_L9_L11_0203.md`](TEST_PLAN_L9_L11_0203.md) | T-114 ~ T-156 | [§6](#6-phase-7-릴리스-게이트) G-9.1~G-11.1 |

---

## 📋 목차

1. [분할 파일 링크](#1-분할-파일-링크)
2. [검증 계층 구조 (L1~L11)](#2-검증-계층-구조-l1l11)
3. [검증 환경 및 공통 사전 준비](#3-검증-환경-및-공통-사전-준비)
4. [회귀 매트릭스 요약](#4-회귀-매트릭스-요약)
5. [장애 진단 및 트러블슈팅](#5-장애-진단-및-트러블슈팅)
6. [Phase 7 릴리스 게이트](#6-phase-7-릴리스-게이트)
7. [개정 이력](#7-개정-이력)

---

## 1. 분할 파일 링크

| 레이어 | 파일 | 범위 | 필수 |
|---|---|---|---|
| **L1~L5** | [`TEST_PLAN_L1_L5_0203.md`](TEST_PLAN_L1_L5_0203.md) | T-1 ~ T-45 | T-1, T-3, T-5, T-10, T-14, T-16, T-27, T-29~T-35 |
| **L6~L8** | [`TEST_PLAN_L6_L8_0203.md`](TEST_PLAN_L6_L8_0203.md) | T-46 ~ T-113 | P0 5/5, P1 8/8, T-70~T-72, T-90~T-113 中 10건 |
| **L9~L11** | [`TEST_PLAN_L9_L11_0203.md`](TEST_PLAN_L9_L11_0203.md) | T-114 ~ T-156 | Stage 8 7/7, AUDIT P0 5+P1 10, Stage 9 4/4, Stage 10 3/3, UI 1/1 |
| (본 인덱스) | `TEST_PLAN_0203.md` | 개요/매트릭스/게이트 | — |

**자동화**: `python test/e2e_stage8_4.py <IP>` (Stage 8 T-114~T-120 7건)

---

## 2. 검증 계층 구조 (L1~L11)

### 2.1 검증 계층 구조

```text
L1 필수 회귀 (8건)  ─── 릴리스 차단 조건
    T-1, T-3, T-5, T-14, T-16, T-27, [+T-46, T-48]

L2 필수 프론트엔드 (9건) ─── 릴리스 차단 조건
    T-29, T-30, T-31, T-32, T-33, T-34, T-35, [+T-47, T-51]

L3 정적 감사 (5건) ─── CI 자동 + 수동 grep
    T-36 ~ T-40

L4 확장 회귀 (22건) ─── 릴리스 후 병행 권장
    T-2, T-4, T-6~T-13, T-15, T-17~T-26, T-28

L5 부하/안정성 (5건) ─── 양산 승인 조건
    T-41 ~ T-45

L6 Batch G 코드 재검토 (22건) ─── P0 필수 5건 / P1 필수 8건
    P0: T-46, T-47, T-48, T-49, T-50
    P1: T-51~T-56, T-57~T-67 (B-1~B-13)

L7 Batch I 물리 Override 및 UI 고도화 (3건) ─── 릴리스 차단 조건
    T-70 (물리 Override 절대값 직접 지정), T-71 (대시보드 3슬라이더/SLEEP), T-72 (순서이동/다국어)

L8 Phase 1~6 통합 회귀 (24건) ─── 릴리스 차단 필수 10건 (T-90, T-91, T-94, T-97, T-98, T-99, T-101, T-103, T-105, T-106)
    T-90 ~ T-113

L9 Stage 8 AI 제어 및 Live 실시간 음성 회귀 (7건) ─── 릴리스 차단 필수 7건
    T-114 ~ T-120 (자동화 E2E 스크립트: test/e2e_stage8_4.py)

L10 통합 감사 회귀 (28건) ─── 릴리스 차단 필수 15건
    T-121 ~ T-148 (P0: 5건 / P1: 10건 / P2: 13건)
    · P0: T-121, T-122, T-123, T-124, T-125
    · P1: T-126 ~ T-135
    · P2: T-136 ~ T-148

L11 Stage 9~10 UI/UX 레이아웃 표준화 및 IA 회귀 (7건) ─── 릴리스 차단 필수 7건
    T-149 ~ T-152 (모바일 뷰포트 스택, 스크롤 하단 여백 연동, 44px 터치, NowPlaying/Studio 인터랙션)
    T-153 ~ T-154-FE (Dashboard 3탭, Comfort 자동모드, 자동화 Playwright: test/e2e_ui_browser_check_0203.cjs)
```

---

## 3. 검증 환경 및 공통 사전 준비

### 3.1 검증 환경

| 항목 | 값 |
|---|---|
| MCU | ESP32-S3-N16R8 (16MB Flash, 8MB PSRAM) |
| 펌웨어 | `FW_Ver_2.0.0` (v0203 코드 접미사) |
| 프론트엔드 | SPA 3자산 (HTML+CSS+35종 JS 번들, gz 85.4KB) |
| 계약 문서 | v2.6 (2026-10-28, Batch I 반영) |
| CI 환경 | GitHub Actions (ubuntu-latest) |
| 브라우저 | Chrome/Edge/Safari/Firefox 최신 |
| 로그 레벨 | `EN_L10_LOG_DEBUG` (검증 기간 한정) |

### 3.2 사전 준비

```bash
# 1. 저장소 클론 (최신 커밋)
git clone https://github.com/hosanglee-kr/SmartNatureWind_v002.git
cd SmartNatureWind_v002

# 2. 환경 확인
pio --version              # PlatformIO 6.x+
python3 --version          # 3.11+

# 3. 펌웨어 + 파일시스템 업로드
pio run --target upload      # 펌웨어
pio run --target uploadfs    # LittleFS (번들 + gzip 자동)

# 4. 시리얼 모니터 연결
pio device monitor           # 115200 bps, exception_decoder 필터

# 5. IP 확인 (시리얼 로그에서 확인)
# [WF10] STA got IP: 192.168.0.XX
IP=192.168.0.XX
```

### 3.3 도구 준비

```bash
# curl, jq 필수
which curl jq || sudo apt install curl jq

# 브라우저 DevTools (F12)
# - Network (HTTP/WS)
# - Console (JavaScript)
# - Application → Local Storage (snw.* 키)
```

---

---

## 4. 회귀 매트릭스 요약

| 그룹 | 테스트 | 소요 | 필수 |
|---|---|:---:|:---:|
| L1 백엔드 기존 | T-1 ~ T-13 (13건) | 60분 | T-1, T-3, T-5, T-10, T-16 필수, 나머지 권장 |
| L2 백엔드 신규 | T-14 ~ T-28 (15건) | 60분 | T-14, T-16, T-27 필수 |
| L3 프론트엔드 | T-29 ~ T-35 (7건) | 30분 | **7/7 필수** |
| L4 정적 감사 | T-36 ~ T-40 (5건) | 10분 | **5/5 필수 (CI 자동)** |
| L5 부하/안정성 | T-41 ~ T-45 (5건) | 24h+ | 릴리스 후 병행 |
| **L6 Batch G P0** | **T-46 ~ T-50 (5건)** | **40분** | **5/5 필수** |
| **L6 Batch G P1** | **T-51 ~ T-67 (17건)** | **120분** | **8건 필수** (T-51, T-52, T-53, T-54, T-57, T-58, T-61, T-65) |
| **L7 Batch I OVR** | **T-70 ~ T-72 (3건)** | **30분** | **3/3 필수** (T-70, T-71, T-72) |
| **L8 Phase 1~6 통합** | **T-90 ~ T-113 (24건)** | **4시간** | **10건 필수** (T-90, T-91, T-94, T-97, T-98, T-99, T-101, T-103, T-105, T-106) |
| **L9 Stage 8 AI/Live** | **T-114 ~ T-120 (7건)** | **60분** | **7/7 필수** (REST 2-turn, 위험명령 차단, 30분 상한, NVS 누적 등) |
| **L10 통합 감사** | **T-121 ~ T-148 (28건)** | **220분** | **15건 필수** (P0 5건 + P1 10건) |
| **L11 Stage 9 UI/UX** | **T-149 ~ T-152 (4건)** | **30분** | **4/4 필수** (T-149, T-150, T-151, T-152) |

### 릴리스 차단 필수 세트 (최소 50건)

| # | 테스트 | 그룹 | Batch |
|:---:|---|---|:---:|
| 1 | T-1 (M10 tick) | L1 | A |
| 2 | T-3 (Reload 위임) | L1 | F-05 |
| 3 | T-5 (Motion 위임) | L1 | F-06 |
| 4 | T-10 (lastReloadOk) | L1 | N-1 |
| 5 | T-14 (FIXED self-heal) | L2 | A-1 |
| 6 | T-16 (버전 SSOT) | L2 | B-1 |
| 7 | T-27 (NVS reset) | L2 | F-1 |
| 8 | T-29 (SPA 3자산) | L3 | - |
| 9 | T-30 (12 페이지) | L3 | - |
| 10 | T-31 (4 레벨) | L3 | - |
| 11 | T-32 (언어 토글) | L3 | - |
| 12 | T-36 (계약 문서) | L4 | - |
| 13 | T-40 (프론트 하드코딩) | L4 | - |
| **14** | **T-46 (C-1 USB 부팅)** | **L6** | **C-1** |
| **15** | **T-47 (C-2 프리셋 그리드)** | **L6** | **C-2** |
| **16** | **T-48 (C-3 holdSec 정확)** | **L6** | **C-3** |
| **17** | **T-49 (C-4 업로드 핸들)** | **L6** | **C-4** |
| **18** | **T-50 (C-5 라우터 재진입)** | **L6** | **C-5** |
| **19** | **T-51 (NEW-C1 0값 보존)** | **L6** | **NEW-C1** |
| **20** | **T-52 (NEW-C2 dht.type XSS)** | **L6** | **NEW-C2** |
| **21** | **T-53 (NEW-U1 API Key 노출)** | **L6** | **NEW-U1** |
| **22** | **T-54 (B-4 clearApiKey)** | **L6** | **B-4/NEW-U2** |
| **23** | **T-57 (B-1 NVS 단일 커밋)** | **L6** | **B-1/B-7** |
| **24** | **T-58 (B-2 root 스냅샷)** | **L6** | **B-2/B-9** |
| **25** | **T-61 (B-5 q=0)** | **L6** | **B-5** |
| **26** | **T-65 (B-11 config 복구)** | **L6** | **B-11** |
| **27** | **T-70 (OVR-1 세그먼트 물리 Override)** | **L7** | **OVR-1** |
| **28** | **T-71 (OVR-2 대시보드 3슬라이더/SLEEP)** | **L7** | **OVR-2** |
| **29** | **T-72 (OVR-3/4 순서이동/다국어)** | **L7** | **OVR-3/4** |
| 30 | T-90 (Phase 1 i18n factoryReset) | L8 | N-5 |
| 31 | T-91 (Phase 1 z-index) | L8 | N-6 |
| 32 | T-94 (Phase 2 timeCfg→TM10) | L8 | N-2 |
| 33 | T-97 (Phase 2 B-2 준수) | L8 | N-10 |
| 34 | T-98 (Phase 3 Dashboard 재생) | L8 | N-1/ADR-1 |
| 35 | T-99 (Phase 3 Smart Resume) | L8 | N-1 |
| 36 | T-101 (Phase 3 Schedule profileId) | L8 | ADR-3 |
| 37 | T-103 (Phase 4 steps 단일 표준) | L8 | ADR-2 |
| 38 | T-105 (Phase 5 Preview 파사드) | L8 | ADR-5 |
| 39 | T-106 (Phase 5 i18n 완전성) | L8 | P-2 |
| **40** | **T-114 (REST 2-turn 제어)** | **L9** | **AI-1** |
| **41** | **T-115 (15종 위험명령 차단)** | **L9** | **AI-1** |
| **42** | **T-116 (Gemini Live 토큰/30분 상한)** | **L9** | **AI-2** |
| **43** | **T-117 (Gemini Live Tool Calling)** | **L9** | **AI-3** |
| **44** | **T-118 (일일 비용 NVS 4키 누적)** | **L9** | **AI-4** |
| **45** | **T-119 (AudioWorklet & Barge-in)** | **L9** | **AI-5** |
| **46** | **T-120 (오프라인 시뮬레이터 Mock)** | **L9** | **AI-6** |
| **47** | **T-149 (모바일 뷰포트 스택/동적 부상)** | **L11** | **UI-5/ADR-9** |
| **48** | **T-150 (본문 스크롤 하단 여백 연동)** | **L11** | **UI-6** |
| **49** | **T-151 (바람 스타일 5종 탭 44px 터치)** | **L11** | **UI-7** |
| **50** | **T-152 (NowPlaying 모달 & Studio 원복)** | **L11** | **UI-8** |
| **51** | **T-153 (Dashboard 3탭 전환)** | **L11** | **SPEC §5.4.2.2** |
| **52** | **T-154 (Comfort 자동모드 백엔드)** | **L11** | **COMFORT-1/2** |
| **53** | **T-154-FE (Comfort 5상태 매트릭스)** | **L11** | **UI-10** |
| **54** | **T-155 (하드웨어 백엔드 타이머 신뢰성)** | **L11** | **TIMER-1~3** |

---

---

## 5. 장애 진단 및 트러블슈팅

| 실패 증상 | 원인 후보 | 해결 |
|---|---|---|
| T-1 `motionActive` 영구 true | `A00_run` 내 `g_M10_motionLogic->tick()` 누락 | F-03 확인 |
| T-2 `lastUserProfileNo=-1` 초기값 | `N10::tick()` 누락 | F-04 확인 |
| T-3 응답 > 500ms | `routeReload` 동기 `reloadAll` | `requestReload()` 위임 확인 |
| T-4 둘 다 202 | `requestReload` CAS 미사용 | atomic CAS 확인 |
| T-5 > 100ms | `s_control->sim` 직접 호출 | A-2 위임 확인 |
| T-14 로그 폭주 | `mode==PRESET` 조건 누락 | A-1 확인 |
| T-16 버전 불일치 | `FW_Ver_1.0.0` 잔재 | B-1 확인 |
| T-27 override 유지 | `N10::resetRuntime` 누락 | F-1 확인 |
| T-29 초기 로드 > 3건 | 번들 미적용 / 캐시 미스 | `pio run --target uploadfs` 재실행 |
| T-30 특정 페이지 빈 화면 | `SNW.Page.*` 미정의 | 999.app.js PAGE_INIT 확인 |
| T-31 L1에서 settings 접근 | `LevelUtil.atLeast` 미호출 | Router.dispatch 내 레벨 검사 |
| T-32 언어 토글 무반응 | `data-i18n` 미부여 | 템플릿 확인 |
| T-33 전원 토글 실패 | API 경로 오류 | `SNW.Api.overrideFixed` 확인 |
| T-34 save/reload 순서 뒤바뀜 | `_onSave` 구현 오류 | Settings 페이지 확인 |
| T-35 WS 재연결 폭주 | backoff 상한 30초 미적용 | `CFG.WS_RECONNECT.BACKOFF_MS` 확인 |
| T-36 계약 문서 gate 실패 | 7문서 누락 / UI_TERMINOLOGY | 파일 저장 확인 |
| T-40 하드코딩 발견 | `fetch('/api/` 직접 호출 | `SNW.Api` 경유로 교체 |
| 404 `/html_v0203/*` | W10 경로 라우트 미확장 | `W10_registerGzipServe()` 수정 |
| CSS/JS 404 | staging 경로 불일치 | `pio_gzip_0203.py` 재확인 |
| **T-46 부팅 정지 (USB 미연결)** | **`while(!Serial)` 무한 루프** | **`main.cpp` 타임아웃 조건 확인** |
| **T-47 프리셋 그리드 비어있음** | **`_applyPresetList` mount 순서** | **`_mountComponents` 선행 확인** |
| **T-48 holdSec 2배** | **`isActive` lastChange 재계산** | **`_state.pirActive` 단일 판정** |
| **T-49 업로드 실패 (재시도)** | **stale handle 잔존** | **`if (s_upFile)` 즉시 close** |
| **T-50 watcher 누수** | **`_dispatching` 가드 미작동** | **router `finally` 블록 확인** |
| **T-51 pin/brightness 0 손실** | **`\|\|` 폴백** | **`nz()` 헬퍼 적용** |
| **T-52 dht.type XSS** | **미이스케이프 렌더** | **`esc()` 래핑 확인** |
| **T-53 API Key 노출** | **`value="..."` 프리필** | **placeholder 패턴 확인** |
| **T-54 키 삭제 실패** | **빈 문자열 무시** | **`clearApiKey` 플래그 확인** |
| **T-55 WS 채널 미표시** | **빈 배열 미복구** | **baseline fallback 확인** |
| **T-57 NVS flush 100ms** | **개별 put\*** | **`nvs_commit` 1회화** |
| **T-58 torn read** | **root 직접 참조** | **`getRootSnapshot` 경유** |
| **T-61 gzip;q=0 미준수** | **`indexOf("gzip")`** | **`W10_acceptsGzip()` 파서** |
| **T-65 config 손상 먹통** | **`return` 조기 종료** | **in-memory defaults + Recovery AP** |
| **T-66 OTA 재시도 실패** | **stale Update 세션** | **`Update.abort()` 확인** |
| **T-67 LED pin 크래시** | **uint8 암묵 캐스팅** | **유효 범위 검증 (0~48)** |
| **T-68 모달 스크롤/세그먼트 겹침** | **인라인 스타일 충돌** | **Flexbox 레이아웃 + 2열 그리드 + Undo 복원 검증** |
| **T-69 로컬 오프라인 통신 실패** | **스크립트 순서/레이스** | **선행 감지(document.write) + `SNW.Offline.ready` 대기 가드** |
| **T-70 Override 물리 미반영** | **`override.enabled` false 판정** | **`S20_resolveWindParams` 우선 치환 분기 확인** |
| **T-71 슬라이더 렉/네트워크 폭주** | **debounce 미적용** | **100ms 디바운스 타이머 로직 확인** |
| **T-72 세그먼트 order 불일치** | **삭제/이동 후 재인덱싱 누락** | **`_reindexSegments` 자동 호출 확인** |
| **T-73 오프라인 다국어 미반영** | **`preset.<CODE>` 키 미조회 / 병기 누락** | **`300.page.windprofile.js` i18n 래핑 및 `998.offline_0203.js` 병기 명칭 확인** |
| **T-90 확인어 raw key** | `settings.factoryResetWord` 미정의 | DICT 추가 확인 |
| **T-91 모달 하단탭 위 노출** | `--snw-z-modal` 하향 | `_variables.css` 확인 |
| **T-92 부팅 크래시** | critical 내 `xSemaphoreCreate*` | `_internalInitAndTake` 확인 |
| **T-93 리스너 누적** | 익명 `addEventListener` | `_onOverlayClick` 참조 확인 |
| **T-94 timeCfg 미반영** | TM10 재적용 누락 | `_routeSystemPatchBody` 확인 |
| **T-95 404 잔존** | `overrideParams` 경로 | `CFG.API.simulation` 매핑 확인 |
| **T-96 Runtime 빈 값** | `runtime` export 누락 | `exportStateJson_v02` 확인 |
| **T-97 B-2 위반** | `g_A20_config_root.` 직접 | `getRootSnapshot` 경유 |
| **T-98 Dashboard 무반응** | `startSession` 위임 누락 | ADR-1 위임 경로 확인 |
| **T-99 resume 컨텍스트 유실** | `_pausedExec` 백업 누락 | pauseSession 백업 확인 |
| **T-101 profileId 스케줄 무반영** | `tickSchedule` profileId 참조 오류 | ADR-3 단일 규격 확인 |
| **T-103 steps[] 데이터 유실** | 스키마 불일치 | steps[] 단일 표준 확인 |
| **T-104 repeat 무시** | 프론트 `repeat` vs C++ `repeatSegments` | 필드명 통일 확인 |
| **T-105 Studio 🎬 TypeError** | `SNW.Preview.showModal` 미정의 | ADR-5 파사드 확인 |
| **T-106 raw key 노출** | DICT 키 누락 | `check_i18n.py --strict` |
| **T-107 /monitor 진입 안 됨** | ROUTES 미등재 | `070.router.js` 확인 |
| **T-108 오버레이 미표시** | `_drawOverlay` 미구현 | `210.page.chart.js` 확인 |
| **T-109 Offline 강도 동일** | `params` 경로 | `factors` 경로 확인 |
| **T-110 Offline 레이아웃 붕괴** | `#app` 삽입 | `document.body.firstChild` 확인 |
| **T-111 Offline step 고정** | 시뮬 미구현 | `startSimulator` step 로직 확인 |

---

---

## 6. Phase 7 릴리스 게이트

### 9.1 게이트 체크리스트

| Gate | 조건 | 판정 |
|:---:|---|:---:|
| **G-7.0** | JSON + W10 경로 확장 + buildfs/upload/uploadfs 성공 | ⬜ |
| **G-7.1** | 정적 감사 5건 통과 (T-36~T-40) | ⬜ |
| **G-7.2** | 백엔드 필수 회귀 6/6 (T-1, T-3, T-5, T-14, T-16, T-27) | ⬜ |
| **G-7.3** | 프론트엔드 필수 7/7 (T-29~T-35) | ⬜ |
| **G-7.4** | 부하 안정성 (T-41 heap 5분) | ⬜ |
| **G-7.5** | CI 재실행 그린 | ⬜ |
| **G-7.6** | 릴리스 태그 push | ⬜ |
| **G-8.1** | **Batch G P0 필수 5/5 (T-46~T-50)** | ⬜ |
| **G-8.2** | **Batch G P1 필수 8/8 (T-51, T-52, T-53, T-54, T-57, T-58, T-61, T-65)** | ⬜ |
| **G-8.3** | **정적 회귀 grep: B-2 위반 0건 / A-2 위반 0건 / 하드코딩 0건** | ⬜ |
| **G-9.1** | **Batch I Override 물리 필수 3/3 (T-70, T-71, T-72)** | ⬜ |
| **G-9.2** | **웹 오프라인 및 다국어 검증 (T-73)** | ⬜ |
| **G-10.1** | **L10 P0 필수 5/5 (T-121~T-125)** | ✅ |
| **G-10.2** | **L10 P1 필수 10/10 (T-126~T-135)** | ✅ |
| **G-10.3** | **L10 P2 정합성 13/13 (T-136~T-148)** | ✅ |
| **G-10.4** | **SSOT 자동 대조 CI exit 0 (`validate_contracts.py`)** | ✅ |
| **G-11.1** | **Stage 9 UI/UX 레이아웃 표준화 필수 4/4 (T-149~T-152)** | ✅ |

### 9.2 릴리스 승인 조건

**모든 게이트 (G-7.0 ~ G-11.1) 통과 시 → 릴리스 승인**.

**미통과 시**:
- 각 게이트 재실행
- 실패 원인 분석 (트러블슈팅 매트릭스 참조)
- 수정 후 재검증

### 9.3 릴리스 태그

```bash
git tag -a v0203-release-2026-10-26 -m "v0203 Release (Batch G 완료)

## 백엔드
- Batch A~F 리팩토링 (2026-10-20)
- Batch G 코드 재검토 P0/P1 (2026-10-26)
  · P0: C-1~C-5 (부팅/라우터/업로드/holdSec/프리셋)
  · P1: B-1~B-13, NEW-C1~U4 (27건)
- RAM/Flash 실측 유지: 110,100 B / 1,532,741 B

## 프론트엔드
- SPA 3자산 (gz 46KB)
- 12 페이지 해시 라우팅, L1~L4 레벨

## 검증
- 필수 회귀 26건 (기존 13 + Batch G 13)
- 확장 회귀 22건 + Batch G P1 9건

## CI
- 계약 문서 v2.4 gate 통과"

git push origin v0203-release-2026-10-26
```

---

---

## 7. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-11-14** | **v4.4** | **Phase 2 — L12 회귀 (T-158~T-168)**: `ENV_PAUSED` 진입/해제, `TempLow`/`DiLow` PAUSE/STOP 이원화, `AUTO_FULL`/`AUTO_SELECT` 세션, AUTO 중 사용자 개입, PIR 시작 유예(T-167), `PATCH /session/rule`(T-168) 11건 신규 (`TEST_PLAN_L9_L11_0203.md` §3.8, `test/e2e_phase2.py`) | Antigravity AI |
| **2026-11-10** | **v4.3** | **웹 UI/UX 인터랙션 고도화 검증 절차 반영 (T-156, b3d06c2)**: L11 계층에 T-156(모니터 히스토리 지그재그 타임라인/시간축, Wind Studio 하단 분리 액션바 및 AI FAB 자동 은닉, AI 어시스턴트 세그먼트/스마트 입력창 검증) 반영 | Antigravity AI |
| **2026-11-09** | **v4.2** | **Stage 10.1 결함 패치 및 하드웨어 백엔드 타이머 검증 항목 반영 (0203_013_20_02)**: L11 계층 T-154-FE(Comfort 5상태 매트릭스) 강화 및 T-155(하드웨어 타이머 브라우저 종료 후 단독 만료/재기동 차단 E2E) 추가 | Antigravity AI |
| **2026-11-09** | **v4.1** | **Stage 10 IA 재설계 및 Comfort 자동 모드 (0203_013)**: L9~L11 레이어에 T-153(Dashboard 3탭), T-154(Comfort 자동모드 백엔드), T-154-FE(Comfort UI 토글/배지) 반영 | Antigravity AI |
| **2026-11-09** | **v4.0** | **3분할 (Phase C)**: T-1~T-45 → `TEST_PLAN_L1_L5_0203.md`, T-46~T-113 → `TEST_PLAN_L6_L8_0203.md`, T-114~T-152 → `TEST_PLAN_L9_L11_0203.md`. 본 문서는 개요/매트릭스/게이트/트러블슈팅 인덱스로 전환. `src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |
| **2026-11-09** | **v3.5** | **AI 빠른 참조 §링크 강화 (Phase B)**: TOC anchor 기반 [§N.M](#anchor) 자동 변환, src/v0203/tools_0203/enhance_index_links_0203.py 추가, --verify로 anchor 유효성 검증 | Antigravity AI |
| **2026-11-08** | **v3.4** | **Stage 9 웹 UI/UX 레이아웃 표준화 및 인터랙션 회귀 절차 신설 (§3.7 T-149~T-152)**: 모바일 하단 뷰포트 레이아웃 스택 및 FAB/Toast 동적 부상 검증(T-149), 메인 콘텐츠 스크롤 하단 여백 연동(T-150), 바람 스타일 5종 탭 44px 모바일 터치 접근성(T-151), Now Playing Bar 상세 확장 모달 및 Wind Studio Override 원복 액션 검증(T-152), §1.1 L11 계층, §7 L11 회귀 매트릭스, §9.1 G-11.1 릴리스 게이트 추가 | Antigravity AI |
| **2026-11-08** | **v3.3** | **통합 감사 28건 회귀 절차 신설 (§3.6 T-121~T-148)**: P0 긴급 안전성 5건(T-121~T-125), P1 기능 결함 10건(T-126~T-135), P2 정합성 13건(T-136~T-148), §1.1 L10 계층, §7 L10 회귀 매트릭스, §9.1 G-10.1~G-10.4 릴리스 게이트 신설 및 `validate_contracts.py` SSOT 자동 대조 CI 연계 | Antigravity AI |
| **2026-11-06** | **v3.2** | **Stage 8 AI 제어 및 Gemini Live 실시간 음성 회귀 절차 신설 (§3.5 T-114~T-120)**: REST 2-turn, 15종 위험 명령 차단, Live 토큰/30분 상한, Tool Calling 위임, 일일 비용 NVS 누적, AudioWorklet/Barge-in, 오프라인 Mock 검증 절차 및 자동화 E2E 스크립트(`test/e2e_stage8_4.py`) 연계 명시 | Antigravity AI |
| **2026-11-06** | **v3.1** | **Schedule 단일 규격 정합 & 세션 타이머 회귀 절차 신설 (v0203_011)**: §3.4 T-113 (세션 타이머 SNW.TimerPanel 동작 및 NowPlaying 연동) 신규 추가, Schedule의 profileId 단일 실행 재검증, L8 회귀 세트 24건 확장. | Antigravity AI |
| 2026-11-05 | v3.0 | **Phase 1~6 통합 (v0203_011) 회귀 절차 신설**: §3.4 T-90~T-112 (23건) 신규, §1.1 L8 계층 추가, §7 회귀 매트릭스 확장 (L8 행 + 필수 세트 29→39건), §8 트러블슈팅 20건 추가 (ADR-2 단일 규격 반영). | Antigravity AI |
| 2026-10-28 | v2.8 | 웹 오프라인 어댑터 및 한/영 다국어 연동 검증 반영: §3.3 T-73 (1건) 신규, §8 트러블슈팅 매트릭스 T-73 추가, §9.1 G-9.2 릴리스 게이트 추가 | Antigravity AI |
| 2026-10-28 | v2.7 | **Batch I 바람 물리 파라미터 직접 지정 (Override) 모델 및 UI 고도화 반영**: §3.3 T-70~T-72 (3건) 신규, §1.1 L7 계층 추가, §7 회귀 매트릭스 확장(필수 26→29건), §8 트러블슈팅 매트릭스 T-70~T-72 추가, §9.1 G-9.1 릴리스 게이트 추가 | Antigravity AI |
| 2026-10-27 | v2.6 | **Batch H 웹 UI/오프라인 로더 반영**: §8 트러블슈팅 매트릭스 T-68(모달/세그먼트 2열 그리드 및 Undo 복원 검증), T-69(로컬 오프라인 감지 및 동기 로드 가드 검증) 신규 추가 | Antigravity AI |
| 2026-10-26 | v2.5 | **Batch G 코드 재검토 반영**: §3.1 T-46~T-50 (C-1~C-5 P0 5건) 신규, §3.2 T-51~T-67 (B-1~B-13, NEW-C1~U4 P1 17건) 신규. §1.1 L6 계층 추가. T-1/T-3/T-9 판정 기준 보강(C-3/B-1/B-5 영향). §7 매트릭스 확장(필수 13→26건). §8 트러블슈팅 16건 추가. §9 G-8 게이트 신규 | Antigravity AI |
| 2026-10-21 | v2.4 | `cfg_motion_0203.json`, `P010_*_0203.*` 자산명, 리다이렉트 기대값 일괄 현행화 | Antigravity AI |
| 2026-10-21 | v2.3 | 프론트엔드 v0203 SPA 통합: T-29~T-35 (7건) 신규, T-36~T-40 정적 감사 확장, T-41~T-45 부하/안정성 신규, §7 매트릭스 재구성 (L1~L5 계층), §8 트러블슈팅 SPA 항목 추가, §9 Phase 7 릴리스 게이트 신규 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: T-14~T-28 신규 15건 추가, §D 트러블슈팅 확장, §C 매트릭스 재정렬 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1 (T-10), G-1 (T-11), G-2/G-4 (T-12), N-3 (T-13) 신규 | Antigravity AI |
| 2026-10-19 | v2.0 | v0203 승격 | Antigravity AI |
| 2026-10-19 | v1.2 | T-9 (번들/Gzip 무결성) | Antigravity AI |
| 2026-10-19 | v1.1 | curl/jq 표준화, 소스 파일명 갱신 | Antigravity AI |
| (초기) | v1.0 | T-1~T-8 | 개발팀 |
