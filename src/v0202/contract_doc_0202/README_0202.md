# README_0202.md — 계약 기반 설계 문서 체계 (CBD)

> **목적**: 본 디렉토리는 Smart Nature Wind v0202 펌웨어의 계약 기반 설계(Contract-Based Design) 문서를 관리한다.  
> 동시성 경계, 상태 소유권, 메모리/시간 예산, 회귀 테스트 절차를 체계화하여 멀티태스크 펌웨어의 안정성과 일관성을 보장한다.  
> **파일명 정책**: 계약 문서 `_0202.md` 유지, 코드 참조 `_0202` 접미사 (Batch B 확정).

---

## 1. 디렉토리 및 파일 구조

```text
src/v0202/
├── contract_doc_0202/              # [CBD] 계약 기반 설계 문서군
│   ├── README_0202.md             # 본 문서 (총괄 안내, 감사 이력, 워크플로)
│   ├── SPEC_0202.md               # SSOT (핀맵, 스키마, 모듈, NVS)
│   ├── CONTRACT_0202.md           # 동시성 경계, 뮤텍스, 위임 패턴
│   ├── STATE_0202.md              # 상태 소유권, FSM, 위임 플래그
│   ├── FLOW_0202.md               # 부팅/제어/위임 시퀀스
│   ├── BUDGET_0202.md             # WCET, 스택, 블로킹, 관측성
│   ├── TEST_PLAN_0202.md          # 회귀 절차 (T-1~T-67, 총 67건)
│   └── Ref/
│       └── UI_TERMINOLOGY_0170.md # 웹 UI 한/영 용어집 (참조)
│
├── Req_ImplPlan_0202/             # 요구사항 및 구현 계획서
├── User_Manual_0202/              # 사용자 매뉴얼
├── tools_0202/                    # v0202 빌드/계약 도구 (pio_gzip_0202.py, commit_contracts_0202.py)
│
├── data_v0202_src/                # [웹 개발 원본] (34 번들 JS + 10 CSS + HTML Shell + 998.offline)
├── data_v0202/                    # [배포 스테이징] LittleFS 이미지 대상 (json 9개 + html_v0202 3개 번들 자산)
│
└── [C++ 소스군, v0202 접미사]
    ├── main.cpp, A00_Main_0202.* (엔트리)
    ├── A20_Const_*_0202.h (상수/구조체)
    ├── A22_Com_Lookup_0202.h, A23_Com_ResetCfg_0202.h
    ├── A30_LED_0202.h
    ├── A40_Com_Utils_0202.h, A40_Com_Utils_IO_0202.cpp (E-2.5 분리)
    ├── C10_Config_0202.h, C10_Config_Core/Extras/Sys_0202.cpp
    ├── C10_Config_Sch_*_0202.* (E-2.3 5분할)
    ├── C10_Config_UzProf_*_0202.* (E-2.6 5분할)
    ├── C10_Config_WindDc_*_0202.* (E-2.7 5분할)
    ├── CT10_Ctl_0202.h, CT10_Ctl_Basic/Ctl/StMG/IOWS_0202.cpp
    ├── CT10_Ctl_Ctl_Seg/Ovr/Mode_0202.cpp (E-2.4 4분할)
    ├── D10_Logger_0202.h
    ├── M10_MotionLogic_0202.h
    ├── N10_NvsManager_0202.*
    ├── P10_PWM_ctrl_0202.h (헤더 인라인)
    ├── S10_Simul_0202.h, S10_Simul_Const_0202.h
    ├── S10_Simul_Core/Physic/IO_0202.cpp
    ├── S20_WindSolver_0202.h (헤더 인라인)
    ├── TM10_TimeMg_0202.h/.cpp (E-2.1 분리)
    ├── W10_Web_0202.h, W10_Web_Const_0202.h
    ├── W10_Web_Routes_0202.cpp (Core)
    ├── W10_Web_Routes_System/Control/Config/Network/CRUD_0202.cpp (E-2.2 6분할)
    ├── W10_Web_Static/Upload/Util/WS/Gemini_0202.cpp
    └── WF10_WiFiMgr_0202.*
```

---

## 2. 문서 목록 및 역할

| 파일 | 역할 | 준수 기준 |
|---|---|---|
| `SPEC_0202.md` | 상위 사양 SSOT (핀맵, JSON 스키마, 모듈 구성, Reload 정책, NVS) | **최상위 SSOT** |
| `CONTRACT_0202.md` | 태스크 경계, 뮤텍스 인벤토리, `g_A20_config_root` 접근 규약, 위임 패턴, 감사 이력 (A-1~F-10) | SPEC 준수 |
| `STATE_0202.md` | 상태 변수 단일 Writer, FSM, 위임 플래그 라이프사이클, E-2 분할 상태 소유권 | CONTRACT 준수 |
| `FLOW_0202.md` | 부팅/제어/Reload/WiFi/시간/PIR/A-2 위임/F-2 헬퍼 시퀀스 | CONTRACT/STATE 준수 |
| `BUDGET_0202.md` | 태스크 WCET, 스택, 블로킹, 관측성, RAM/Flash 실측, Batch 예산 영향 | SPEC 준수 |
| `TEST_PLAN_0202.md` | 회귀 절차 (T-1~T-67, 총 67건), 트러블슈팅 매트릭스 | 최신 감사 반영 |
| `Ref/UI_TERMINOLOGY_0170.md` | 웹 한/영 UI 용어집 (참조) | UI/i18n |
| `README_0202.md` | 본 문서 (CBD 총괄, 감사 이력, 워크플로, 커밋 도구) | 기준점 |

---

## 3. 감사 이력 (Audit Findings)

### 3.1 기존 이슈 (F-01 ~ I-6)

| ID | 심각도 | 상태 | 요약 | 해결 |
|---|---|---|---|---|
| F-01 | 🔴 High | ✅ | WF10 GOT_IP 이벤트 누락 | startSTA 후 TM10 명시 통지 |
| F-02 | 🟡 Mid | ✅ | 이중 xTaskCreate 위험 | `_ensureWifiTask` mutex 보호 |
| F-03 | 🔴 High | ✅ | M10 tick 미호출 | `A00_run` 배치 |
| F-04 | 🔴 High | ✅ | N10 flush 미호출 | `A00_run` 배치 |
| F-05 | 🟡 Mid | ✅ | async_tcp reload 블로킹 | loopTask 위임 (atomic flag) |
| F-06 | 🟡 Mid | ✅ | async_tcp motion patch 락 경합 | loopTask 위임 (atomic flag) |
| F-07 | 🟢 Low | ⏸ | Logger 링버퍼 레이스 | 로그 유실 수용 |
| F-08 | 🟢 Low | ⏸ | A00_run root raw 역참조 | 저위험 수용 |
| F-09 | 🟡 Mid | ✅ | PIR 부팅 false-positive | F-03으로 해소 |
| F-10 | 🟡 Mid | ⚠️ | async_tcp 스택 4KB | 부담 완화, 8KB 후보 관측 |
| I-1 | 🟡 Mid | ✅ | Reload 완료 판별 불가 | `control.pendingReload` 노출 |
| I-2 | 🟡 Mid | ✅ | save 없는 reload 시 패치 소실 | SPEC §5.2 명문화 |
| I-3 | 🟢 Low | ✅ | `_pendingMotionSimApply` 잔재 | begin/reloadAll 방어 store |
| I-4 | 🟢 Low | ✅ | `applyMotionSimConfigToSim` public 노출 | private 이동 |
| I-5 | 🟢 Low | ⏸ | reload 중 LED 지연 | 체감 불가 수용 |
| I-6 | 🟢 Low | ✅ | 다중 JS 로드 LWIP 소켓 고갈 | 번들 + Gzip (11→4) |

### 3.2 N/G 시리즈

| ID | 심각도 | 상태 | 요약 | 해결 |
|---|---|---|---|---|
| N-1 | 🟢 Low | ✅ | reload 실패 미노출 | `control.lastReloadOk` |
| N-2 | 🟡 Mid | ✅ | pages JSON 손상 시 404 | 정적 폴더 우선 등록 |
| N-3 | 🟡 Mid | ✅ | root 무한 리다이렉트 | 404 + 진단 |
| N-4 | 🟡 Mid | ✅ | 업로드 핸들 누수 | safeAbort close |
| G-1 | 🟢 Low | ✅ | Accept-Encoding 미검사 | gzip/raw 분기 |
| G-2 | 🟡 Mid | ✅ | long path `.gz` 미인식 | regex 라우트 대체 |
| G-3 | 🟢 Low | ✅ | 번들 소스 누락 무시 | fail-fast `sys.exit(1)` |

### 3.3 Batch A~F 신규

| Batch | ID | 심각도 | 요약 | 상태 |
|---|---|---|---|---|
| A | A-1 | 🔴 High | FIXED self-heal 무한 재호출 | ✅ `mode==PRESET` 조건 |
| A | A-2 | 🔴 High | CT10 `sim`/`motion` public 노출 | ✅ 위임 3종 + private |
| A | A-3 | 🔴 High | checkApiKey null Core Dump | ✅ null 방어 |
| B | B-1~B-6 | 🟡 Mid | 버전/NVS 키/기본 preset 리터럴 | ✅ 상수화 |
| C | C-1~C-8 | 🟢 Low | S10/A00/TM10/WF10 매직넘버 | ✅ `G_S10_*` 등 |
| D | D-1 | 🟢 Low | WS tick mutex 4회 | ✅ `consumeAllDirty` (4→1) |
| D | D-2/D-3 | 🟢 Low | 정적 서빙 String 할당 | ✅ 사전 계산/스택 버퍼 |
| D | D-4 | 🟡 Mid | isStaConnected 10ms mutex | ✅ atomic lock-free |
| D | D-5 | 🟢 Low | toChartJson 4.8KB vector | ✅ static 배열 (`.bss`) |
| E | E-1~E-10 | 🟢 Low | Dead Code | ✅ 정리 |
| E-2 | E-2.1~E-2.7 | 🟢 Low | 29파일 분할 (대형 파일) | ✅ 4~6분할 |
| F | F-1 | 🟡 Mid | factory reset NVS 잔존 | ✅ `N10::resetRuntime` |
| F | F-2/F-3 | 🟢 Low | POST/PATCH 60/180줄 중복 | ✅ 공통 헬퍼 |
| F | F-4 | 🟢 Low | Logger 초기 DEBUG | ✅ INFO 변경 |
| F | F-5 | 🟡 Mid | profile fall-through | ✅ 명시 IDLE 반환 |
| F | F-8/F-9 | 🟢 Low | 0.01f/0.33f 하드코딩 | ✅ 상수화 |
| F | F-10 | 🟢 Low | 분할 시 매크로 파일 스코프 | ✅ Internal 헤더 승격 |

### 3.4 Batch G — 코드 재검토 (P0/P1 이슈)

| ID | 심각도 | 위치 | 요약 | 상태 |
|---|---|---|---|---|
| **C-1** | 🔴 Blocker | `main.cpp` | `while(!Serial)` 무한 루프 (USB 미연결 시 setup 정지) | ✅ 3s 타임아웃 |
| **C-2** | 🔴 Blocker | `200.page.dashboard.js` | 프리셋 그리드 영구 비어있음 (mount 순서) | ✅ `_mountComponents` 선행 |
| **C-3** | 🔴 High | `M10_MotionLogic_0202.h` | `isActive()` holdSec 이중 적용 (2×연장) | ✅ `_state.pirActive` 단일 판정 |
| **C-4** | 🔴 High | `W10_Web_Upload_0202.cpp` | 업로드 핸들 누수 (`available()==0` write-only) | ✅ stale close |
| **C-5** | 🔴 High | `070.router.js` | dispatch 재진입 → watcher/timer 누수 | ✅ `_dispatching` 가드 |
| **NEW-C1** | 🔴 High | `240.page.settings.js` | `\|\|`로 0값 손실 (pin=0, brightness=0, holdSec=0) | ✅ `nz()` 헬퍼 |
| **NEW-C2** | 🔴 High | `240.page.settings.js` | `dht.type` XSS (사용자 PATCH 가능) | ✅ `esc()` 적용 |
| **NEW-U1** | 🟡 Mid | `240.page.settings.js` | API Key 프리필 → DOM 평문 노출 | ✅ placeholder 패턴 |
| **NEW-U2** | 🟡 Mid | `240.page.settings.js` | API Key 삭제 UI 부재 | ✅ 체크박스 |
| **NEW-U3** | 🟡 Mid | `240.page.settings.js` | wsChConfig 손상 시 복구 불가 | ✅ 기본 4채널 + baseline |
| **NEW-U4** | 🟡 Mid | `240.page.settings.js` | 문자열 `"false"` 오판 | ✅ `asBool()` |
| **B-1** | 🟠 High | `N10_NvsManager_0202.cpp` | flush 11회 commit (100ms 블로킹) | ✅ 단일 `nvs_commit` (10ms) |
| **B-2** | 🟠 High | `W10_Web_Routes_Config/CRUD/WS_0202.cpp` | async_tcp root 직접 참조 3곳 | ✅ `getRootSnapshot` |
| **B-3** | 🟠 High | `240.page.settings.js`, `270.page.network.js` | XSS (deviceName/SSID/hostname) | ✅ `esc()` |
| **B-4** | 🟠 High | `C10_Config_Sys_0202.cpp` | API Key 삭제 불가 (빈 문자열 무시) | ✅ `clearApiKey` 플래그 |
| **B-5** | 🟠 High | `W10_Web_Static_0202.cpp` | `gzip;q=0` 오탐지 (RFC 7231 위반) | ✅ `W10_acceptsGzip` 파서 |
| **B-6** | 🟡 Mid | `W10_Web_Routes_System_0202.cpp` | routeMotion POST/PATCH 60줄 중복 | ✅ `_routeMotionPatchBody` |
| **B-7** | 🟡 Mid | `N10_NvsManager_0202.cpp` | NVS 쓰기 반환값 무시 (조용한 실패) | ✅ 반환값 검사 + 재시도 |
| **B-8** | 🟡 Mid | `130.ui.form.js` | 로그 필터 `textContent` 오매칭 | ✅ `.snw-log-lv` 정확 비교 |
| **B-9** | 🟡 Mid | `W10_Web_Routes_CRUD_0202.cpp` | WindProfile GET FS 재로드(100ms) + race | ✅ `getRootSnapshot` |
| **B-10** | 🟢 Low | `S10_Simul_Core_0202.cpp` | 브로드캐스트용 JsonDocument dead code | ✅ 제거 |
| **B-11** | 🟠 High | `A00_Main_0202.cpp` | config 손상 시 부팅 중단 → 웹 복구 불가 | ✅ in-memory defaults + Recovery AP |
| **B-12** | 🟠 High | `W10_Web_Upload_0202.cpp` | OTA 세션 잔존 + write 반환값 무시 | ✅ `Update.abort()` + 반환 검사 |
| **B-13** | 🟠 High | `A00_Main_0202.cpp` | 음수 LED pin → GPIO 255 크래시 | ✅ 유효성 검증 + 기본값 |

**수정 파일 (17개)**: `main.cpp`, `A20_Const_Const_0202.h`, `M10_MotionLogic_0202.h`, `W10_Web_Upload_0202.cpp`, `070.router.js`, `200.page.dashboard.js`, `W10_Web_Routes_Config_0202.cpp`, `W10_Web_Routes_CRUD_0202.cpp`, `W10_Web_WS_0202.cpp`, `C10_Config_Sys_0202.cpp`, `240.page.settings.js`, `270.page.network.js`, `W10_Web_Routes_System_0202.cpp`, `N10_NvsManager_0202.cpp`, `130.ui.form.js`, `S10_Simul_Core_0202.cpp`, `A00_Main_0202.cpp`, `W10_Web_Static_0202.cpp`

### 3.5 Batch H — 웹 UI 고도화 및 오프라인 로더 개선 (0202_006)

| ID | 심각도 | 위치 | 요약 | 상태 |
|---|---|---|---|---|
| **UI-1** | 🟡 Mid | `_components.css` | 모달 스크롤 시 Header/Footer 사라짐 | ✅ Flexbox 구조화 (Header/Footer 고정, Body 단독 터치 스크롤) |
| **UI-2** | 🟡 Mid | `_components.css`, `220.schedule.js`, `230.profiles.js` | 세그먼트 1열 배치로 모바일 스크롤 과다 | ✅ 세그먼트 카드 2열 그리드(`snw-seg-card`, `snw-seg-grid`) 적용 |
| **UI-3** | 🟡 Mid | `_profiles.css` | 구형 모달 스타일로 인한 이중 스크롤 위험 | ✅ `#snw-modal-overlay` 오버라이드 제거 및 공통 스타일 통합 |
| **UI-4** | 🔴 High | `220.schedule.js`, `230.profiles.js` | 세그먼트 삭제 시 Undo 기능 소실 위험 | ✅ 온전한 `_removeWithUndo` 로직 보존 및 프로파일 확대 적용 |
| **LOAD-1** | 🔴 Blocker | `index.html` | 번들 스크립트 후행 실행으로 로컬 오프라인 모드 실패 | ✅ `window.SNW_OFFLINE` 감지 및 동기 로드(`document.write`) 선행 배치 |
| **LOAD-2** | 🔴 High | `999.app.js` | 오프라인 어댑터 로드 전 `SNW_BOOT` 실행 레이스 | ✅ `SNW.Offline.ready` 폴링 대기 가드(Wait Guard) 추가 |
| **LOAD-3** | 🟢 Low | `998.offline_0202.js` | 로컬 Live Server 환경에서 JSON 경로 404 실패 로그 | ✅ `JSON_BASE_CANDIDATES` 1순위를 `../json/`으로 조정 |

**수정 파일 (7개)**: `_components.css`, `_profiles.css`, `220.page.schedule.js`, `230.page.profiles.js`, `index.html`, `999.app.js`, `998.offline_0202.js`

---

## 4. CBD 워크플로

### 4.1 신규 기능 추가 / 사양 변경 순서

1. `SPEC_0202.md` — 기능 사양, 상수, JSON 스키마, 핀맵
2. `FLOW_0202.md` — 제어/부팅 파이프라인 배치
3. `CONTRACT_0202.md` — 태스크 컨텍스트, 뮤텍스, 공유 자원 규약
4. `STATE_0202.md` — 단일 Writer, FSM 천이, 위임 플래그
5. `BUDGET_0202.md` — WCET, 스택, 블로킹 예산
6. `TEST_PLAN_0202.md` — 회귀 시나리오 및 합격 기준
7. **커밋 스크립트 실행** — 문서+코드 원자적 커밋

### 4.2 코드 변경 필수 원칙

- 계약 내용(뮤텍스, 태스크 경계, 전역 포인터 접근 등) 변경 시 **반드시 계약 문서와 코드를 하나의 커밋으로 동시 반영**.
- 각 문서 §개정이력 테이블에 동일 날짜/버전으로 기록.

### 4.3 E-2 파일 분할 원칙 (Batch E-2)

- **R-1**: 외부 `#include` 경로(`*_0202.h`) 100% 보존, public API 무변경
- **R-2**: 정적 멤버 정의는 원본 .cpp에 유일 유지
- **R-3**: 다중 .cpp 참조 helper/매크로는 `*_Internal_0202.h`로 승격
- **R-4**: `platformio.ini`의 `+<*>` 규칙으로 신규 파일 자동 포함
- **R-5**: 파일당 1커밋 (Batch G에서 통합 커밋)

---

## 5. 커밋 및 검증 스크립트

### 5.1 계약 문서 커밋 (`commit_contracts_0202.py`)

저장소 루트에서 실행 (Python 3.7+).

```bash
# 검증 모드 (커밋 없이)
python src/v0202/tools_0202/commit_contracts_0202.py --dry-run

# 기본 메시지로 커밋
python src/v0202/tools_0202/commit_contracts_0202.py

# 커스텀 메시지
python src/v0202/tools_0202/commit_contracts_0202.py -m "docs(contracts): F-05 위임 동기화"
```

**동작**:
1. `git rev-parse --show-toplevel`로 저장소 루트 감지
2. `contract_doc_0202/` 필수 7문서 존재 검증
3. `git add src/v0202/contract_doc_0202/` 자동 스테이징
4. 변경 없으면 커밋 생략 (exit 0)
5. 커밋 후 요약 + push 안내

**종료 코드**: `0` 정상 / `1` 문서 누락 / `2` Git 오류 / `130` 사용자 중단

### 5.2 연계 검증 도구

```bash
# 계약 문서 무결성 사전 검증 (CI Gate)
python src/v0202/tools_0202/commit_contracts_0202.py --dry-run --strict

# 웹 리소스 gzip 번들 빌드
python src/v0202/tools_0202/pio_gzip_0202.py
```

### 5.3 웹 자산 변경 시 재빌드 필수

```bash
pio run --target uploadfs
```

**이유**:
- `pio_gzip_0202.py`가 `buildfs`/`uploadfs`에서 자동 실행됨
- `pio run --target upload` (펌웨어만) 실행 시 번들/Gzip 미재생성
- 웹 자산 소스(`data_v0202_src/`) 변경이 `data_v0202/`에 반영 안 됨

**정상 동작 확인**:
```bash
curl -I -H "Accept-Encoding: gzip" http://<IP>/html_v0202/P010_bundle_0202.js
# → Content-Encoding: gzip 헤더 포함
curl -I http://<IP>/index.html
# → raw 파일 (Accept-Encoding 미보유 시)
```

---

## 6. Batch G 커밋 전략 (v0202 릴리스)

### 6.1 배치별 원자 커밋 (권장)

```bash
# 1. 리네임만 (E-3)
git add -A && git commit -m "refactor(v0202): E-3 - 0200→0201 접미사 마이그레이션"

# 2. Batch별 커밋
git add -A && git commit -m "refactor(v0202): A - P0 이슈 3건 (self-heal, 캡슐화, null 방어)"
git add -A && git commit -m "refactor(v0202): B - SSOT 정규화 (버전/NVS 키/기본 preset)"
git add -A && git commit -m "refactor(v0202): C - 매직넘버 상수화 (S10/A00/WF10/TM10)"
git add -A && git commit -m "refactor(v0202): D - 성능 최적화 (WS mutex/atomic/고정배열)"
git add -A && git commit -m "refactor(v0202): E - Dead Code 정리"
git add -A && git commit -m "refactor(v0202): E-2 - 파일 분할 (29파일)"
git add -A && git commit -m "refactor(v0202): F - 로직 정합성 (NVS reset, PATCH 헬퍼)"

# 3. 문서 최종 커밋
python src/v0202/tools_0202/commit_contracts_0202.py -m "docs(contracts): v0202 계약 문서 동기화 (Batch G 반영)"
# (또는 v0202 스크립트: python src/v0202/tools_0202/commit_contracts_0202.py)
```

### 6.2 최종 검증 게이트

```bash
# 1. 전체 빌드
pio run --environment esp32-s3-n16r8   # SUCCESS 필수
pio run --target buildfs               # Gzip 재빌드 필수

# 2. 링크 무결성
pio run --environment esp32-s3-n16r8 2>&1 | grep -iE "undefined|multiple"
# 기대: 0건

# 3. 잔존 참조
grep -rn "_0202\." src/v0202/*.h src/v0202/*.cpp | grep -v "\.md\|data_v0202\|data_src_v0202"
# 기대: 0건

# 4. root 직접 접근 화이트리스트 (B-2)
grep -rn "g_A20_config_root\." src/v0202/W10_Web_Routes_*_0202.cpp
# 위반 시 리뷰 반려

# 5. 회귀 (T-1~T-67)
# 릴리스 차단 필수 26건 (TEST_PLAN §7 참조)
```

### 6.3 릴리스 태그

```bash
git tag -a v0202-release-2026-10-26 -m "v0202 Release (Batch G 완료)"
git push origin v0202-release-2026-10-26
```

---

## 7. 실측 자원 사용량 (2026-10-26 빌드 결과)

| 자원 | 사용 | 총량 | 여유 | 판정 |
|---|---|---|---|---|
| **RAM** | 110,100 B (33.6%) | 327,680 B | 217,580 B (66.4%) | ✅ BUDGET §6 >100KB |
| **Flash** | 1,532,741 B (23.4%) | 6,553,600 B | 5,020,859 B (76.6%) | ✅ 여유 충분 |
| **littlefs.bin** | 114.4 KB | - | - | ✅ 73% 절감 |

---

## 8. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-10-27** | **v2.5** | **Batch H — 웹 UI 고도화 및 오프라인 로더 개선 (0202_006)**: 모달 Flexbox 구조화(UI-1), 세그먼트 2열 그리드(UI-2), 이중 스크롤 제거(UI-3), Undo 복원 보존(UI-4), 오프라인 로더 순서 최적화(LOAD-1), 부트스트랩 대기 가드(LOAD-2), JSON 탐색 최적화(LOAD-3). 총 7개 파일 수정 | Antigravity AI |
| 2026-10-26 | v2.4 | **Batch G — P0/P1 코드 재검토**: C-1~C-5 (크리티컬), NEW-C1/C2/U1~U4 (프론트), B-1~B-13 (백엔드/프론트 혼합). §3.4 신규 27건 테이블. 17개 파일 수정 | Antigravity AI |
| 2026-10-21 | v2.3 | `tools_0202`, `data_v0202`, `_0202` 자산 및 curl 검증 경로 일괄 현행화 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §1 디렉토리 트리 0201 접미사, §3 감사 이력 A~F 통합, §4.3 E-2 분할 원칙, §5.2 도구 4종, §6 Batch G 커밋 전략, §7 실측 자원 사용량 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1~N-4, G-1~G-3 반영 | Antigravity AI |
| 2026-10-19 | v2.0 | v0202 승격 + (v1.2의 Gzip/번들/소스-배포 분리 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | JS 번들/Gzip 파이프라인, 소스/배포 분리 | Antigravity AI |
| 2026-10-19 | v1.1 | 폴더 구조 현행화, 커밋 스크립트 경로 | Antigravity AI |
| (초기) | v1.0 | 최초 계약 문서 체계 수립 | 개발팀 |
