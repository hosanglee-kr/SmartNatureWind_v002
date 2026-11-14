---
name: graphify
description: "Use for any question about a codebase, its architecture, file relationships, or project content — especially when graphify-out/ exists, where the question should be treated as a graphify query first. Turns any input (code, docs, papers, images, videos) into a persistent knowledge graph with god nodes, community detection, and query/path/explain tools."
---

# /graphify

> **v0203 슬림 래퍼**: 원본 PowerShell 파이프라인은 `tools/graphify_init.py`로 위임됩니다.
> 원본: `SKILL.original.md` (참조용).

## Usage (요약)

```bash
# 빌드 / 상태
python tools/graphify_init.py build [--mode deep] [--update] [--cluster-only] [--directed]
python tools/graphify_init.py check

# 조회 (fast path — graph.json 존재 시 여기 직행)
python tools/graphify_init.py query "<question>" [--dfs] [--budget 1500]
python tools/graphify_init.py path "<src>" "<dst>"
python tools/graphify_init.py explain "<symbol>"

# 내보내기
python tools/graphify_init.py export --obsidian --obsidian-dir ~/vaults/my-project
python tools/graphify_init.py export --wiki --svg --graphml
python tools/graphify_init.py export --neo4j

# MCP 서버
python tools/graphify_init.py mcp [--watch]
```

원본 graphify CLI도 그대로 사용 가능: `graphify query "..."` 등.

## What graphify is for

Drop any folder of code, docs, papers, images, or video into graphify and get a queryable knowledge graph. Persistent across sessions, honest audit trail (EXTRACTED/INFERRED/AMBIGUOUS), community detection surfaces cross-document connections you wouldn't think to ask about.

**v0203 컨텍스트**: 이 프로젝트는 `graphify-out/graph.json`을 빌드해 두면 **AGENTS.md 원칙 2 (Graph-First)**를 준수할 수 있다. grep_search/view_file 무차별 열람 금지.

## What You Must Do When Invoked

### Fast path (가장 우선)

`graphify-out/graph.json`이 존재하고 사용자가 자연어 질문을 했다면 (예: "Session FSM이 어떻게 동작해?", "CT10::startSession을 호출하는 곳은?"), 빌드/탐지 단계를 완전히 건너뛰고 즉시:

```bash
python tools/graphify_init.py query "<question>"
```

`--update`/`--cluster-only`/URL 등 명시적 재빌드 신호가 없다면 탐지를 실행하지 않는다.

### 최초 빌드

```bash
python tools/graphify_init.py build
```

**언제**:
- `graphify-out/graph.json`이 없을 때
- `--update`로 증분 재빌드
- 대규모 리팩토링 이후

빌드 세부 절차(PowerShell 파이프라인, AST/시맨틱 추출, chunk merge 등)는 원본 `SKILL.original.md` Step 1~9 참조. 이 skill은 요약만 유지한다.

## 조회 패턴

| 목적 | 명령 |
|---|---|
| 넓은 컨텍스트 (BFS) | `python tools/graphify_init.py query "<q>"` |
| 특정 경로 추적 (DFS) | `python tools/graphify_init.py query "<q>" --dfs` |
| 응답 토큰 제한 | `python tools/graphify_init.py query "<q>" --budget 1500` |
| 두 개념 간 최단 경로 | `python tools/graphify_init.py path "Session" "runCtx"` |
| 단일 심볼 설명 | `python tools/graphify_init.py explain "CT10::startSession"` |

## v0203 사용 예시

`examples/v0203_queries.md` 참조. 몇 가지:

```bash
# 상태 소유권
python tools/graphify_init.py query "runCtx 상태를 쓰는 함수들"

# 계약 위반 탐지
python tools/graphify_init.py query "g_A20_config_root 직접 참조 위치"

# 의존 경로
python tools/graphify_init.py path "CT10_Ctl_0203" "W10_Web_0203"

# 심볼 설명
python tools/graphify_init.py explain "CL_CT10_Ctl"
```

## References (원본 위임)

세부 파이프라인과 서브커맨드는 원본을 참조:
- `SKILL.original.md` — 원본 Step 0~9 PowerShell 파이프라인
- `references/extraction-spec.md` — 서브에이전트 추출 스펙
- `references/update.md`, `references/query.md`
- `references/exports.md`, `references/hooks.md`, `references/transcribe.md`
- `references/github-and-merge.md`, `references/add-watch.md`

## Troubleshooting

| 증상 | 조치 |
|---|---|
| `graphify: command not found` | `uv tool install graphifyy` 또는 `pip install graphifyy` |
| PowerShell 5.1 스크롤 깨짐 | Windows Terminal 사용 (graspologic ANSI) |
| `graph.json` 없음 | `python tools/graphify_init.py build` |
| `graph.json` 오래됨 | `python tools/graphify_init.py build --update` |

## Honesty Rules (원본 유지)

- Never invent an edge. If unsure, use AMBIGUOUS.
- Never skip the corpus check warning.
- Always show token cost in the report.
- Never hide cohesion scores behind symbols - show the raw number.
- Never run HTML viz on a graph with more than 5,000 nodes without warning the user.
