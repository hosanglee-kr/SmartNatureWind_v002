# README_0200.md — 계약 기반 설계 문서 체계 (CBD)

> **목적**: 본 디렉토리는 Smart Nature Wind v0200 펌웨어의 계약 기반 설계(Contract-Based Design) 문서를 관리한다.  
> 동시성 경계, 상태 소유권, 메모리/시간 예산, 회귀 테스트 절차를 체계화하여 멀티태스크 펌웨어의 안정성과 일관성을 보장한다.  
> **파일명 정책**: 계약 문서 `_0200.md` 유지, 코드 참조 `_0201` 접미사 (Batch B 확정).

---

## 1. 디렉토리 및 파일 구조

```text
src/v0200/
├── contract_doc_0200/              # [CBD] 계약 기반 설계 문서군
│   ├── README_0200.md             # 본 문서 (총괄 안내, 감사 이력, 워크플로)
│   ├── SPEC_0200.md               # SSOT (핀맵, 스키마, 모듈, NVS)
│   ├── CONTRACT_0200.md           # 동시성 경계, 뮤텍스, 위임 패턴
│   ├── STATE_0200.md              # 상태 소유권, FSM, 위임 플래그
│   ├── FLOW_0200.md               # 부팅/제어/위임 시퀀스
│   ├── BUDGET_0200.md             # WCET, 스택, 블로킹, 관측성
│   ├── TEST_PLAN_0200.md          # 회귀 절차 (T-1~T-28)
│   └── Ref/
│       └── UI_TERMINOLOGY_0170.md # 웹 UI 한/영 용어집 (참조)
│
├── Req_ImplPlan_0200/             # 요구사항 및 구현 계획서
├── User_Manual_0200/              # 사용자 매뉴얼
├── tools_0201/                    # v0201 빌드/계약 도구 (pio_gzip_0201.py, commit_contracts_0201.py)
├── tools_0200/                    # v0200 계약 검증 도구 (commit_contracts_0200.py) 및 참조 자료(Ref/)
│
├── data_v0201_src/                # [웹 개발 원본] (31 JS + 10 CSS + HTML Shell)
├── data_v0201/                    # [배포 스테이징] LittleFS 이미지 대상 (json 10개 + html_v0201 3개 자산)
├── data_src_v0200/                # [레거시 백업] v0200 원본 리소스
├── data_v0200/                    # [레거시 백업] v0200 배포 리소스
│
└── [C++ 소스군, 0201 접미사]
    ├── main.cpp, A00_Main_0201.* (엔트리)
    ├── A20_Const_*_0201.h (상수/구조체)
    ├── A22_Com_Lookup_0201.h, A23_Com_ResetCfg_0201.h
    ├── A25_Com_Utils_0201.h, A25_Com_Utils_IO_0201.cpp (E-2.5 분리)
    ├── A30_LED_0201.h
    ├── C10_Config_0201.h, C10_Config_Core/Extras/Sys_0201.cpp
    ├── C10_Config_Sch_*_0201.* (E-2.3 5분할)
    ├── C10_Config_UzProf_*_0201.* (E-2.6 5분할)
    ├── C10_Config_WindDc_*_0201.* (E-2.7 5분할)
    ├── CT10_Ctl_0201.h, CT10_Ctl_Basic/Ctl/StMG/IOWS_0201.cpp
    ├── CT10_Ctl_Ctl_Seg/Ovr/Mode_0201.cpp (E-2.4 4분할)
    ├── D10_Logger_0201.h
    ├── M10_MotionLogic_0201.h
    ├── N10_NvsManager_0201.*
    ├── P10_PWM_ctrl_0201.h (헤더 인라인)
    ├── S10_Simul_0201.h, S10_Simul_Const_0201.h
    ├── S10_Simul_Core/Physic/IO_0201.cpp
    ├── S20_WindSolver_0201.h (헤더 인라인)
    ├── TM10_TimeMg_0201.h/.cpp (E-2.1 분리)
    ├── W10_Web_0201.h, W10_Web_Const_0201.h
    ├── W10_Web_Routes_0201.cpp (Core)
    ├── W10_Web_Routes_System/Control/Config/Network/CRUD_0201.cpp (E-2.2 6분할)
    ├── W10_Web_Static/Upload/Util/WS/Gemini_0201.cpp
    └── WF10_WiFiMgr_0201.*
```

---

## 2. 문서 목록 및 역할

| 파일 | 역할 | 준수 기준 |
|---|---|---|
| `SPEC_0200.md` | 상위 사양 SSOT (핀맵, JSON 스키마, 모듈 구성, Reload 정책, NVS) | **최상위 SSOT** |
| `CONTRACT_0200.md` | 태스크 경계, 뮤텍스 인벤토리, `g_A20_config_root` 접근 규약, 위임 패턴, 감사 이력 (A-1~F-10) | SPEC 준수 |
| `STATE_0200.md` | 상태 변수 단일 Writer, FSM, 위임 플래그 라이프사이클, E-2 분할 상태 소유권 | CONTRACT 준수 |
| `FLOW_0200.md` | 부팅/제어/Reload/WiFi/시간/PIR/A-2 위임/F-2 헬퍼 시퀀스 | CONTRACT/STATE 준수 |
| `BUDGET_0200.md` | 태스크 WCET, 스택, 블로킹, 관측성, RAM/Flash 실측, Batch 예산 영향 | SPEC 준수 |
| `TEST_PLAN_0200.md` | 회귀 절차 (T-1~T-28), 트러블슈팅 매트릭스 | 최신 감사 반영 |
| `Ref/UI_TERMINOLOGY_0170.md` | 웹 한/영 UI 용어집 (참조) | UI/i18n |
| `README_0200.md` | 본 문서 (CBD 총괄, 감사 이력, 워크플로, 커밋 도구) | 기준점 |

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

---

## 4. CBD 워크플로

### 4.1 신규 기능 추가 / 사양 변경 순서

1. `SPEC_0200.md` — 기능 사양, 상수, JSON 스키마, 핀맵
2. `FLOW_0200.md` — 제어/부팅 파이프라인 배치
3. `CONTRACT_0200.md` — 태스크 컨텍스트, 뮤텍스, 공유 자원 규약
4. `STATE_0200.md` — 단일 Writer, FSM 천이, 위임 플래그
5. `BUDGET_0200.md` — WCET, 스택, 블로킹 예산
6. `TEST_PLAN_0200.md` — 회귀 시나리오 및 합격 기준
7. **커밋 스크립트 실행** — 문서+코드 원자적 커밋

### 4.2 코드 변경 필수 원칙

- 계약 내용(뮤텍스, 태스크 경계, 전역 포인터 접근 등) 변경 시 **반드시 계약 문서와 코드를 하나의 커밋으로 동시 반영**.
- 각 문서 §개정이력 테이블에 동일 날짜/버전으로 기록.

### 4.3 E-2 파일 분할 원칙 (Batch E-2)

- **R-1**: 외부 `#include` 경로(`*_0201.h`) 100% 보존, public API 무변경
- **R-2**: 정적 멤버 정의는 원본 .cpp에 유일 유지
- **R-3**: 다중 .cpp 참조 helper/매크로는 `*_Internal_0201.h`로 승격
- **R-4**: `platformio.ini`의 `+<*>` 규칙으로 신규 파일 자동 포함
- **R-5**: 파일당 1커밋 (Batch G에서 통합 커밋)

---

## 5. 커밋 및 검증 스크립트

### 5.1 계약 문서 커밋 (`commit_contracts_0200.py`)

저장소 루트에서 실행 (Python 3.7+).

```bash
# 검증 모드 (커밋 없이)
python src/v0200/tools_0200/commit_contracts_0200.py --dry-run

# 기본 메시지로 커밋
python src/v0200/tools_0200/commit_contracts_0200.py

# 커스텀 메시지
python src/v0200/tools_0200/commit_contracts_0200.py -m "docs(contracts): F-05 위임 동기화"
```

**동작**:
1. `git rev-parse --show-toplevel`로 저장소 루트 감지
2. `contract_doc_0200/` 필수 7문서 존재 검증
3. `git add src/v0200/contract_doc_0200/` 자동 스테이징
4. 변경 없으면 커밋 생략 (exit 0)
5. 커밋 후 요약 + push 안내

**종료 코드**: `0` 정상 / `1` 문서 누락 / `2` Git 오류 / `130` 사용자 중단

### 5.2 연계 검증 도구

```bash
# 계약 문서 무결성 사전 검증 (CI Gate)
python src/v0200/tools_0200/commit_contracts_0200.py --dry-run --strict

# 웹 리소스 gzip 번들 빌드
python src/v0200/tools_0201/pio_gzip_0201.py
```

### 5.3 웹 자산 변경 시 재빌드 필수

```bash
pio run --target uploadfs
```

**이유**:
- `pio_gzip_0201.py`가 `buildfs`/`uploadfs`에서 자동 실행됨
- `pio run --target upload` (펌웨어만) 실행 시 번들/Gzip 미재생성
- 웹 자산 소스(`data_v0201_src/`) 변경이 `data_v0201/`에 반영 안 됨

**정상 동작 확인**:
```bash
curl -I -H "Accept-Encoding: gzip" http://<IP>/html_v0201/P010_bundle_0201.js
# → Content-Encoding: gzip 헤더 포함
curl -I http://<IP>/P010_main_0201.html
# → raw 파일 (Accept-Encoding 미보유 시)
```

---

## 6. Batch G 커밋 전략 (v0201 릴리스)

### 6.1 배치별 원자 커밋 (권장)

```bash
# 1. 리네임만 (E-3)
git add -A && git commit -m "refactor(v0201): E-3 - 0200→0201 접미사 마이그레이션"

# 2. Batch별 커밋
git add -A && git commit -m "refactor(v0201): A - P0 이슈 3건 (self-heal, 캡슐화, null 방어)"
git add -A && git commit -m "refactor(v0201): B - SSOT 정규화 (버전/NVS 키/기본 preset)"
git add -A && git commit -m "refactor(v0201): C - 매직넘버 상수화 (S10/A00/WF10/TM10)"
git add -A && git commit -m "refactor(v0201): D - 성능 최적화 (WS mutex/atomic/고정배열)"
git add -A && git commit -m "refactor(v0201): E - Dead Code 정리"
git add -A && git commit -m "refactor(v0201): E-2 - 파일 분할 (29파일)"
git add -A && git commit -m "refactor(v0201): F - 로직 정합성 (NVS reset, PATCH 헬퍼)"

# 3. 문서 최종 커밋
python src/v0200/tools_0201/commit_contracts_0201.py -m "docs(contracts): v0201 계약 문서 동기화 (A~F 반영)"
# (또는 v0200 스크립트: python src/v0200/tools_0200/commit_contracts_0200.py)
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
grep -rn "_0200\." src/v0200/*.h src/v0200/*.cpp | grep -v "\.md\|data_v0200\|data_src_v0200"
# 기대: 0건

# 4. root 직접 접근 화이트리스트 (B-2)
grep -rn "g_A20_config_root\." src/v0200/W10_Web_Routes_*_0201.cpp
# 위반 시 리뷰 반려

# 5. 회귀 (T-1~T-28)
# 필수: T-1, T-3, T-5, T-14, T-16, T-20, T-27
```

### 6.3 릴리스 태그

```bash
git tag -a v0201-release-2026-10-20 -m "v0201 릴리스 (A~F 리팩토링 완료)"
git push origin v0201-release-2026-10-20
```

---

## 7. 실측 자원 사용량 (2026-10-20 빌드 결과)

| 자원 | 사용 | 총량 | 여유 | 판정 |
|---|---|---|---|---|
| **RAM** | 111,596 B (34.1%) | 327,680 B | 216,084 B (65.9%) | ✅ BUDGET §6 >100KB |
| **Flash** | 1,528,153 B (23.3%) | 6,553,600 B | 5,025,447 B (76.7%) | ✅ 여유 충분 |
| **littlefs.bin** | 114.4 KB | - | - | ✅ 73% 절감 |

---

## 8. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-21 | v2.3 | `tools_0201`, `data_v0201`, `_0201` 자산 및 curl 검증 경로 일괄 현행화 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §1 디렉토리 트리 0201 접미사, §3 감사 이력 A~F 통합, §4.3 E-2 분할 원칙, §5.2 도구 4종, §6 Batch G 커밋 전략, §7 실측 자원 사용량 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1~N-4, G-1~G-3 반영 | Antigravity AI |
| 2026-10-19 | v2.0 | v0200 승격 + (v1.2의 Gzip/번들/소스-배포 분리 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | JS 번들/Gzip 파이프라인, 소스/배포 분리 | Antigravity AI |
| 2026-10-19 | v1.1 | 폴더 구조 현행화, 커밋 스크립트 경로 | Antigravity AI |
| (초기) | v1.0 | 최초 계약 문서 체계 수립 | 개발팀 |
