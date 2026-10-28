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
├── data_v0202_src/                # [웹 개발 원본] (35 번들 JS + 10 CSS + HTML Shell + 998.offline)
├── data_v0202/                    # [배포 스테이징] LittleFS 이미지 대상 (json 9개 + html_v0202 3개 번들 자산)
│
└── [C++ 소스군, v0202 접미사]      # 상세 모듈 매핑 및 파일 목록은 SPEC_0202.md §3 참조
    ├── main.cpp, A00_Main_0202.* (부팅 엔트리)
    ├── A20~A40 (상수, 룩업, NeoPixel, 유틸/IO)
    ├── C10_Config_* (환경설정 로드/저장/검증 분할 소스)
    ├── CT10_Ctl_* (장치 제어, FSM 상태, 세그먼트, WS 분할 소스)
    ├── D10 (로거), M10 (모션), N10 (NVS), P10 (PWM)
    ├── S10/S20 (물리 시뮬레이션, 자연풍 솔버)
    ├── TM10 (시간/NTP), WF10 (Wi-Fi 매니저)
    └── W10_Web_* (비동기 웹서버 Core, 라우트 분할 소스)
```

> 💡 **C++ 소스 파일 상세 매핑 SSOT**: 각 모듈별 C++ 헤더/구현 파일 30여 종의 상세 목록 및 단일 책임 분할 명세는 **[SPEC_0202.md §3](SPEC_0202.md#3-모듈-구성-및-파일-매핑-v0202-접미사)**에 단일 정의되어 있습니다.

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

## 3. 감사 및 계약 마일스톤 요약 (Audit & Contract Milestones)

> 💡 **감사 이력 및 해결 규약 SSOT**: 각 배치별 상세 감사 이슈(F-01~I-6, B-1~B-13, C-1~C-5, NEW-C1~U4, OVR-1~4, SYNC-1~3) 및 동시성 해결 코드는 **[CONTRACT_0202.md §7 (감사 이력 및 계약 해결 내역)](CONTRACT_0202.md#7-감사-이력-및-계약-해결-내역)**에 전량 단일 보관(SSOT)되어 있습니다.

| 배치 (Batch) | 식별 코드 | 핵심 해결 내용 및 계약 규약 | 상세 참조 |
|---|---|---|:---:|
| **초기 감사** | F-01 ~ I-6 | WF10 IP 누락, N10 flush 누락, async_tcp reload CAS 위임(F-05), JS 번들링/Gzip(I-6) | [CONTRACT §7.1](CONTRACT_0202.md#71-기존-10대-이슈-해결-내역-f-01--f-10) |
| **N/G 시리즈** | N-1~N-4, G-1~G-3 | reload 상태 노출, 404 차단, Gzip 라우트 regex 파서, 번들 누락 fail-fast | [CONTRACT §7.2](CONTRACT_0202.md#72-ng-시리즈) |
| **Batch A~F** | A-1~F-10 | FIXED self-heal 무한루프 차단, WS mutex 배치(4→1), 29개 소스 모듈 단일책임 분할(E-2) | [CONTRACT §7.3](CONTRACT_0202.md#73-batch-af-통합-신규-항목-a-1--f-10) |
| **Batch G** | C-1~C-5, B-1~B-13, NEW | USB CDC 타임아웃, PIR holdSec 단일판정, NVS 단일 commit, async_tcp getRootSnapshot | [CONTRACT §7.4](CONTRACT_0202.md#74-batch-g-신규-감사-항목-27건) |
| **Batch H** | UI-1~4, LOAD-1~3 | 모달 Header/Footer 고정, 세그먼트 2열 그리드, Undo 복원, 오프라인 어댑터 선행 로드 | [CONTRACT §7.6](CONTRACT_0202.md#76-batch-h-프론트엔드-오프라인-로딩-계약-load-1load-2) |
| **Batch I** | OVR-1~4 | 바람 물리 0~100% 절대값 `override` 모델 도입, 3대 슬라이더 연동, 한/영 완전 다국어 | [CONTRACT §7.7](CONTRACT_0202.md#77-batch-i-바람-물리-파라미터-직접-지정-override-계약-ovr-1ovr-4) |
| **0202_008** | OFFLINE, SYNC-1~3 | C++ Enum ➔ `000.const.js` 동기화, 오프라인 모듈 2분할, 대시보드 슬라이더 연동 | [CONTRACT §7.8~7.9](CONTRACT_0202.md#79-프론트엔드-백엔드-데이터-동기화-및-오프라인-모듈-분리-계약-sync-1sync-3) |

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

## 7. 실측 자원 사용량 (2026-10-28 Batch I 빌드 결과)

| 자원 | 사용 | 총량 | 여유 | 판정 |
|---|---|---|---|---|
| **RAM** | 108,612 B (33.1%) | 327,680 B | 219,068 B (66.9%) | ✅ BUDGET §6 >100KB 통과 |
| **Flash** | 1,525,937 B (23.3%) | 6,553,600 B | 5,027,663 B (76.7%) | ✅ 여유 충분 |
| **littlefs.bin** | 114.4 KB (프론트 gz 85.4 KB) | 1,048,576 B (1MB) | 934,176 B (89.1%) | ✅ BUDGET §6 <100KB 통과 |

---

## 8. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-10-28** | **v2.8** | **계약 문서 간 중복 통폐합 및 마일스톤 정리 (0202_008)**: C++ 소스 목록 SPEC §3 위임, 감사 이력 상세 CONTRACT §7 단일 SSOT화 및 마일스톤 요약표 전환, 오프라인 2분할/동기화 반영 | Antigravity AI |
| 2026-10-28 | v2.7 | **웹 오프라인 어댑터 및 한/영 다국어 연동 검증 반영**: Mock 데이터 10개 프리셋/5개 스타일 factors 동기화, `/control/override` 인터셉트, 스케줄/프로필 한/영 병기 표기, 프리셋 관리 화면 실시간 i18n 번역 연동 및 T-73 회귀 절차 수립 | Antigravity AI |
| 2026-10-28 | v2.6 | **Batch I — 바람 물리 파라미터 직접 지정 (Override) 모델 전면 개편 및 UI 고도화 (0202_007)**: adjust Delta 완전 폐기 및 0~100% 절대값 `override` 모델 도입(OVR-1), 대시보드 3대 물리 슬라이더 및 SLEEP 모드 연동(OVR-2), 세그먼트 편집 모달 Override 아코디언 및 순서 이동(▲/▼)(OVR-3), 물리 수치별 정량 가이드 및 35종 JS 번들링/완전 다국어화(OVR-4) | Antigravity AI |
| 2026-10-27 | v2.5 | **Batch H — 웹 UI 고도화 및 오프라인 로더 개선 (0202_006)**: 모달 Flexbox 구조화(UI-1), 세그먼트 2열 그리드(UI-2), 이중 스크롤 제거(UI-3), Undo 복원 보존(UI-4), 오프라인 로더 순서 최적화(LOAD-1), 부트스트랩 대기 가드(LOAD-2), JSON 탐색 최적화(LOAD-3). 총 7개 파일 수정 | Antigravity AI |
| 2026-10-26 | v2.4 | **Batch G — P0/P1 코드 재검토**: C-1~C-5 (크리티컬), NEW-C1/C2/U1~U4 (프론트), B-1~B-13 (백엔드/프론트 혼합). §3.4 신규 27건 테이블. 17개 파일 수정 | Antigravity AI |
| 2026-10-21 | v2.3 | `tools_0202`, `data_v0202`, `_0202` 자산 및 curl 검증 경로 일괄 현행화 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: §1 디렉토리 트리 0201 접미사, §3 감사 이력 A~F 통합, §4.3 E-2 분할 원칙, §5.2 도구 4종, §6 Batch G 커밋 전략, §7 실측 자원 사용량 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1~N-4, G-1~G-3 반영 | Antigravity AI |
| 2026-10-19 | v2.0 | v0202 승격 + (v1.2의 Gzip/번들/소스-배포 분리 유지) | Antigravity AI |
| 2026-10-19 | v1.2 | JS 번들/Gzip 파이프라인, 소스/배포 분리 | Antigravity AI |
| 2026-10-19 | v1.1 | 폴더 구조 현행화, 커밋 스크립트 경로 | Antigravity AI |
| (초기) | v1.0 | 최초 계약 문서 체계 수립 | 개발팀 |
