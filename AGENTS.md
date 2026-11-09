# 🌌 SmartNatureWind v0203 — 공통 에이전트 가이드 (AGENTS.md)

> **Claude Code + Google Antigravity IDE 공통 SSOT**.
> 경로별 규칙은 `.agents/rules/`(Antigravity)와 `.claude/rules/`(Claude Code)에서 자동 로드.
> `.claude/`는 `tools/sync-agent-configs.py`로 생성된 미러 — **직접 편집 금지**.

---

## 1. 개발 환경

| 항목 | 내용 |
|---|---|
| MCU | ESP32-S3-N16R8 (16MB Flash / 8MB OPI PSRAM, dual-core @ 240MHz) |
| 빌드 | PlatformIO + Arduino-ESP32 (`-std=gnu++17`), **`-j 12` 필수** |
| 파일시스템 | LittleFS (`./src/v0203/data_v0203`) |
| 에셋 파이프라인 | `pio_gzip_0203.py` (54 JS + 18 CSS 번들 + Gzip L9) |
| 활성 버전 | **v0203** (FW_Ver_2.0.3) / C++·에셋 모두 `_0203` 접미사 |

---

## 2. SSOT 계약 문서 맵 — **섹션 단위 Read**

전체 파일을 여는 대신 **필요 섹션만** 최소 범위로 Read한다.

| 문서 | 언제 여는가 | 시작 섹션 |
|---|---|---|
| SPEC_0203.md | 스키마/API/핀맵 변경 | §4, §5 |
| CONTRACT_0203.md | 락/위임/태스크 경계 | §2, §5, §7.{해당 배치} |
| STATE_0203.md | FSM/플래그/단일 Writer | §2, §6, §7 |
| FLOW_0203.md | 새 시퀀스/부팅 흐름 | §1, §2, §11~14 |
| BUDGET_0203.md | WCET/RAM/Flash/번들 영향 | §2, §3, §8.5, §10 |
| TEST_PLAN_0203.md | 회귀 실행 | 해당 L 레이어만 (L1~L11) |
| README_0203.md | CBD 워크플로/커밋 도구 | §4, §5 |
| AUDIT_LOG_0203.md | 과거 해결 감사 이력 추적 | §1~§10 |
| AGENT_OPERATIONS_0203.md | 세션 시작/종료/시나리오 참조 | §1, §2 |
| **UserManual_0203_002.md** | **개발 시 참조하지 않음** (사용자 문서) | — |

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

| 작업 | 명령 | Skill |
|---|---|---|
| 빌드 + 플래시 | `pio run -e esp32-s3-n16r8 -j 12 [--target upload/uploadfs]` | `build-and-flash` |
| 계약 갱신 | `commit_contracts_0203.py --dry-run --strict` | `contract-update` |
| 회귀 실행 | `test/e2e_stage8_4.py <IP>` / TEST_PLAN T-항목 | `regression-run` |
| 프론트 번들 | `pio_gzip_0203.py` (+ `check_i18n.py --strict`) | `bundle-frontend` |
| 그래프 갱신 | `graphify update .` | (기존) `graphify` |
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
