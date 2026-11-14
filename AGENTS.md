# 🌌 SmartNatureWind v0203 — 공통 에이전트 가이드 (AGENTS.md)

> **Claude Code + Google Antigravity IDE 공통 SSOT**.
> 경로별 규칙은 `.agents/rules/`(Antigravity)와 `.claude/rules/`(Claude Code)에서 자동 로드.
> `.claude/`는 `tools/sync-agent-configs.py`로 생성된 미러 — **직접 편집 금지**.

---

## 1. 개발 환경

| 항목 | 내용 |
|---|---|
| MCU | ESP32-S3 Zero (기본, 4MB Flash / 2MB PSRAM), ESP32-C3 Zero (4MB, No PSRAM), ESP32-S3-N16R8 |
| 빌드 | PlatformIO + Arduino-ESP32 (`-std=gnu++17`), default env: `esp32-s3-zero`, **`-j 12` 필수** |
| 파일시스템 | LittleFS (`./src/v0203/data_v0203`) |
| 에셋 파이프라인 | `pio_gzip_0203.py` (54 JS + 18 CSS 번들 + Gzip L9) |
| 활성 버전 | **v0203** (FW_Ver_2.0.3) / C++·에셋 모두 `_0203` 접미사 |

---

## 2. SSOT 계약 문서 맵 — **섹션 단위 Read**

전체 파일을 여는 대신 **필요 섹션만** 최소 범위로 Read한다.

| 문서 | 언제 여는가 | **시작 섹션** | 링크 |
|---|---|---|---|
| SPEC_0203.md | 스키마/API/핀맵 변경 | §4, §5 | [SPEC §4](src/v0203/contract_doc_0203/SPEC_0203.md#4-설정-파일-스키마) · [§5](src/v0203/contract_doc_0203/SPEC_0203.md#5-통신-및-api-사양) |
| CONTRACT_0203.md | 락/위임/태스크 경계 | §2, §5, §7.{해당 배치} | [§2](src/v0203/contract_doc_0203/CONTRACT_0203.md#2-뮤텍스스핀락세마포어-인벤토리) · [§5](src/v0203/contract_doc_0203/CONTRACT_0203.md#5-락-획득-순서-및-데드락-방지) · [§7](src/v0203/contract_doc_0203/CONTRACT_0203.md#7-감사-관측-및-이슈-추적표) |
| STATE_0203.md | FSM/단일 Writer | §2, §6, §7 | [§2](src/v0203/contract_doc_0203/STATE_0203.md#2-runctx-fsm-7-state-명세) · [§6](src/v0203/contract_doc_0203/STATE_0203.md#6-위임-플래그-라이프사이클) · [§7](src/v0203/contract_doc_0203/STATE_0203.md#7-autooff-래치-및-이벤트-ack-규약) |
| FLOW_0203.md | 새 시퀀스/부팅 | §1, §2, §11~14 | [§1](src/v0203/contract_doc_0203/FLOW_0203.md#1-부팅-시퀀스-a00_init) · [§2](src/v0203/contract_doc_0203/FLOW_0203.md#2-메인-루프-a00_run-타이밍) · [§13](src/v0203/contract_doc_0203/FLOW_0203.md#13-ai-제어-및-gemini-live-실시간-음성-시퀀스) · [§14](src/v0203/contract_doc_0203/FLOW_0203.md#14-웹-uiux-동적-레이아웃-및-인터랙션-흐름) |
| BUDGET_0203.md | WCET/RAM/Flash/번들 | §2, §3, §8.5, §10 | [§2](src/v0203/contract_doc_0203/BUDGET_0203.md#2-looptask-wcet-예산) · [§8.5](src/v0203/contract_doc_0203/BUDGET_0203.md#85-최종-판정-요약-통합-감사-2차-반영) · [§10](src/v0203/contract_doc_0203/BUDGET_0203.md#10-batchphasestage-누적-예산-영향) |
| **TEST_PLAN_0203.md** | 레이어 개요/매트릭스/게이트 | §1, §4, §6 | [§1 링크](src/v0203/contract_doc_0203/TEST_PLAN_0203.md#1-분할-파일-링크) · [§4 매트릭스](src/v0203/contract_doc_0203/TEST_PLAN_0203.md#4-회귀-매트릭스-요약) |
| **TEST_PLAN_L1_L5_0203.md** | T-1~T-45 실행 | §2~§6 | [L1_L5](src/v0203/contract_doc_0203/TEST_PLAN_L1_L5_0203.md) |
| **TEST_PLAN_L6_L8_0203.md** | T-46~T-113 실행 | §3.1~§3.4 | [L6_L8](src/v0203/contract_doc_0203/TEST_PLAN_L6_L8_0203.md) |
| **TEST_PLAN_L9_L11_0203.md** | T-114~T-152 실행 (Stage 8/9) | §3.5~§3.7 | [L9_L11](src/v0203/contract_doc_0203/TEST_PLAN_L9_L11_0203.md) |
| **AUDIT_LOG_0203.md** | **감사 이력** | §1~§11 | [AUDIT_LOG](src/v0203/contract_doc_0203/AUDIT_LOG_0203.md) |
| **AGENT_OPERATIONS_0203.md** | **운영 표준** | §1~§5 | [OPS](src/v0203/contract_doc_0203/AGENT_OPERATIONS_0203.md) |
| README_0203.md | CBD 워크플로/커밋 도구 | §4, §5 | [README §4](src/v0203/contract_doc_0203/README_0203.md) |
| **UserManual_0203_004.md** | **개발 시 참조하지 않음** (사용자 문서) | — | — |

---

## 3. 4대 불변 원칙 (위반 시 즉시 리젝트)

### 원칙 1 — 백엔드 수정 승인
C++ 소스(`.h`, `.cpp`) 수정이 필요하면 **목적·기능변화를 먼저 정리해 사용자 승인**을 받는다.
프론트/문서/스크립트만 수정할 때는 승인 불필요.

### 원칙 2 — Graph-First
1. `graphify query "<질문>"` / `path` / `explain`으로 **파일:라인 확정**
2. 확정된 최소 라인 범위만 `Read`
3. 작업 후 `graphify update .`

무차별 `grep_search`/`view_file` 금지.

### 원칙 3 — 정적 에셋 파이프라인
FE 소스(`data_v0203_src/html_v0203/`) 수정 시 **반드시**:
```

python src/v0203/tools_0203/pio_gzip_0203.py

```
- 오프라인 모듈 2종(`998.offline_data_0203.js`, `998.offline_0203.js`)은 자동 제외
- `check_i18n.py --strict` 게이트 자동 실행

### 원칙 4 — CBD 계약 동시 갱신
인터페이스/FSM/스키마 변경 시 **6문서 동시 갱신** 후 커밋:
```

python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict

```

---

## 4. 주요 CLI (상세는 Skill 참조)

> **원칙 2 (Graph-First) 실행 순서**:
> `check` → `query` (자연어 직행) → 최소 라인 Read → 작업 → `build --update`

| 작업 | 명령 | Skill |
|---|---|---|
| 빌드 + 플래시 | `pio run -e esp32-s3-zero -j 12 [--target upload/uploadfs]` | `build-and-flash` |
| 계약 갱신 | `commit_contracts_0203.py --dry-run --strict` | `contract-update` |
| 회귀 실행 | `test/e2e_stage8_4.py <IP>` / TEST_PLAN T-항목 | `regression-run` |
| UI E2E 점검 | `node test/e2e_ui_browser_check_0203.cjs` | `regression-run` |
| 프론트 번들 | `pio_gzip_0203.py` (+ `check_i18n.py --strict`) | `bundle-frontend` |
| 그래프 질의 | `graphify query "<q>"` | `graphify` |
| 그래프 갱신 | `graphify update .` | `graphify` |
| 그래프 탐색 | `graphify explain "<concept>"` / `graphify path "<A>" "<B>"` | `graphify` |
| 동기화 | `python tools/sync-agent-configs.py [--check]` | — |

---

## 5. 세션 학습 영속화

- **Claude Code**: Auto memory 자동 (`~/.claude/projects/<repo>/memory/`)
- **Antigravity**: `/learn` 명령으로 수동 저장 (rules/skill 제안 → 승인)

**저장 대상**
- 반복 지적 (예: "`_0203` 접미사 누락은 리젝트")
- 마일스톤 결정 (예: "ADR-10 데스크톱 영구 사이드바 확정")

**저장 금지**: 이미 AGENTS.md/계약서에 명시된 내용, 코드에서 유추 가능한 정보

---

## 6. 코드 컨벤션 → 경로 트리거 rules

| 경로 | 규칙 파일 |
|---|---|
| `src/v0203/**/*.{h,cpp}` | `.agents/rules/backend-cpp.md` |
| `src/v0203/data_v0203_src/**/*.js` | `.agents/rules/frontend-js.md` |
| `src/v0203/data_v0203_src/**/*.css` | `.agents/rules/frontend-css.md` |
| `src/v0203/contract_doc_0203/**/*.md` | `.agents/rules/contracts.md` |
| `src/v0203/tools_0203/*.py` | `.agents/rules/tools-pipeline.md` |

---

*모든 기술 답변은 정중한 **한국어**로 작성한다.*
