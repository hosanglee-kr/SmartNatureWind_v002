# AGENT_OPERATIONS_0203.md — 에이전트 운영 가이드 (v1.0)

> **목적**: Claude Code + Antigravity 병행 환경에서 세션 시작·종료·시나리오별 참조를 표준화.
> **전제**: `AGENTS.md` (canonical) + `.agents/rules/` (경로 트리거) 로드 완료.

---

## 1. 세션 시작 체크리스트

### Claude Code
1. `/context all` → **Memory files** 확인
   - `CLAUDE.md` 표시 (내부에 `@AGENTS.md` import)
   - `.claude/rules/*.md` 표시 (경로 매칭 시)
2. Auto memory 자동 로드 (첫 200줄/25KB)
3. `/skills` → graphify, karpathy-guidelines, 4 신규 확인

### Antigravity
1. 에이전트 패널 → `AGENTS.md` 로드 표시
2. `.agents/rules/*.md` 자동 로드 (glob 매칭)
3. `/skills` → graphify, karpathy-guidelines, 4 신규 확인
4. Auto memory **없음** → 세션 중 중요 결정은 `/learn` 예약

---

## 2. 시나리오별 참조 매트릭스

### 시나리오 A — 새 기능 추가 (FE only)

| 단계 | Read | 검증 |
|---|---|---|
| 1. 요구사항 정리 | AGENTS.md §3 | — |
| 2. 기존 유사 기능 조사 | `graphify query "<기능>"` | graph.json 존재 |
| 3. API 스펙 확인 | SPEC §5 | 엔드포인트 |
| 4. FE 자산 규격 | SPEC §5.4 | 번들 구조 |
| 5. i18n 키 추가 | `.agents/rules/frontend-js.md` | ko/en 대칭 |
| 6. 번들 | `bundle-frontend` skill | gzip 헤더 |
| 7. 회귀 | TEST_PLAN L3 (T-29~35) | 7/7 |
| 8. 세션 학습 | `/learn` (Antigravity) | rule/skill 제안 |

### 시나리오 B — 버그 수정 (백엔드 포함)

| 단계 | Read | 승인 |
|---|---|---|
| 1. 재현 조건 파악 | 사용자 입력 | — |
| 2. 위치 특정 | `graphify explain "<심볼>"` | — |
| 3. 최소 라인 Read | graphify 결과 | — |
| 4. **백엔드 수정 필요 여부 판단** | — | — |
| 5. **C++ 수정 시**: 목적·기능변화 정리 | — | **원칙 1 승인** |
| 6. 승인 후 `.agents/state/backend-approval.json` 생성 | — | hook 통과 |
| 7. 수정 | `.agents/rules/backend-cpp.md` 준수 | — |
| 8. 계약 영향 판단 | CONTRACT §7.11~7.18 | CBD |
| 9. 회귀 | TEST_PLAN 해당 L | — |
| 10. `graphify update .` | — | 그래프 최신화 |

### 시나리오 C — 계약 문서 갱신

| 단계 | 명령 | 검증 |
|---|---|---|
| 1. 영향 문서 식별 | SPEC → FLOW → CONTRACT → STATE → BUDGET → TEST_PLAN | — |
| 2. 개정 이력 기록 | 각 문서 §개정 이력 | 동일 날짜/버전 |
| 3. AUDIT_LOG 필요 시 | CONTRACT §7.0 인덱스 참조 | — |
| 4. 검증 | `commit_contracts_0203.py --dry-run --strict` | exit 0 |
| 5. 커밋 | 문서+코드 원자적 | — |

### 시나리오 D — 릴리스

| 단계 | 참조 | 게이트 |
|---|---|---|
| 1. 필수 회귀 세트 | TEST_PLAN §7 | 50건 |
| 2. 각 L 필수 통과 | TEST_PLAN §9.1 | G-7.0~G-11.1 |
| 3. 자산 예산 확인 | BUDGET §8.5 | < 150 KB |
| 4. 리소스 확인 | BUDGET §7 | RAM<40% Flash<30% |
| 5. 태그 | README §6.3 | — |

---

## 4. Auto memory / `/learn` 병행 가이드

### 4.1 Claude Code — Auto memory (자동)

- **위치**: `~/.claude/projects/<repo>/memory/`
- **로드**: 매 세션 첫 200줄 / 25KB
- **토글**: `/memory` → auto memory toggle
- **저장 대상 (type)**
  - `user`: 작업 선호 (예: "커밋은 한국어로")
  - `feedback`: 반복 교정 (예: "_0203 접미사 누락은 리젝트")
  - `project`: 마일스톤 결정 (예: "ADR-10 확정")
  - `reference`: 외부 링크 (예: Gemini 비용 대시보드 URL)
- **저장 금지**: AGENTS.md/계약서 명시 내용, 코드 유추 가능 정보
- **감사**: `/memory` → auto memory folder

### 4.2 Antigravity — `/learn` (수동)

- **저장 위치**: Workspace rules/skills, Global rules/skills
- **방법**: 세션 중 또는 종료 전 `/learn` → 에이전트가 대화에서 학습 내용 추출 → rule/skill로 **제안** → 사용자 승인 → 저장
- **언제 실행**: 반복 교정 후 / 마일스톤 결정 후 / 새 워크플로 정착 후
- **자동 저장 아님** → 승인 필수

### 4.3 병행 사용 원칙

| 사항 | Claude Code | Antigravity |
|---|---|---|
| 휘발성 대화 메모리 | 자동 | 없음 |
| 저장 트리거 | 자동 (매 세션) | `/learn` 수동 |
| 개인 선호 | `~/.claude/CLAUDE.md` | `~/.gemini/AGENTS.md` |
| 프로젝트 규칙 | `AGENTS.md` (import) | `AGENTS.md` (직접) |
| 경로 규칙 | `.claude/rules/` (생성) | `.agents/rules/` (canonical) |

**핵심**: `.agents/` 편집 → `python tools/sync-agent-configs.py` → 두 도구 모두 최신.

---

## 5. 세션 종료 체크리스트

### Claude Code
- [ ] Auto memory 저장 내용 `/memory`로 확인
- [ ] 그래프 갱신 (`graphify update .`)
- [ ] 계약 문서 갱신 시 `commit_contracts --dry-run --strict` 통과

### Antigravity
- [ ] `/learn` 실행 → rule/skill 제안 승인
- [ ] 그래프 갱신 (`graphify update .`)
- [ ] 계약 문서 갱신 시 `commit_contracts --dry-run --strict` 통과

### 공통
- [ ] `.agents/` 편집 시 `python tools/sync-agent-configs.py` 실행
- [ ] `python tools/sync-agent-configs.py --check` exit 0 확인

---

## 6. 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| AGENTS.md 무시됨 (Antigravity) | frontmatter 있음 | frontmatter 제거 (always_on) |
| .claude/rules 미적용 | sync 미실행 | `python tools/sync-agent-configs.py` |
| Claude Code가 AGENTS.md 안 읽음 | `CLAUDE.md` 미존재 또는 미설정 | `CLAUDE.md`에 `@AGENTS.md` 확인 |
| Auto memory 무시됨 | 200줄/25KB 초과 | `/memory`에서 index 정리 |
| `/learn` 제안 안 뜸 | 짧은 세션 또는 이미 명시된 내용 | AGENTS.md와 중복 여부 확인 |
| Hook이 C++ 수정 차단 | 승인 마커 없음 | `.agents/state/backend-approval.json` 생성 |
| 계약 검증 실패 | 6문서 미동기 | 개정 이력 통일, 링크 재확인 |

---

## 7. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-11-09 | v1.0 | 초기 작성 — 병행 사용 세션 표준화 + Auto memory/`/learn` 가이드 + 시나리오 A~D | Antigravity AI |
