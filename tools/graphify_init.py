#!/usr/bin/env python3
"""v0203 graphify CLI 래퍼 (cross-platform).

`.agents/skills/graphify/SKILL.md`의 PowerShell 파이프라인을 위임받는다.
fast path(graph.json 존재 시 query 직행)는 이 래퍼를 거치지 않아도 된다.

Subcommands:
    build    그래프 빌드 (기본: full / --update / --cluster-only)
    check    graph.json 존재 확인 (exit 0/1)
    query    자연어 질문 BFS/DFS
    path     두 노드 간 최단 경로
    explain  단일 노드 설명
    export   내보내기 (--html/--obsidian/--wiki/--svg/--graphml/--neo4j/--falkordb)
    mcp      MCP stdio 서버 (--watch)

Usage:
    python tools/graphify_init.py build --mode deep
    python tools/graphify_init.py check
    python tools/graphify_init.py query "Session FSM이 어떻게 동작해?"
    python tools/graphify_init.py query "..." --budget 1500 --dfs
    python tools/graphify_init.py path "Session" "runCtx"
    python tools/graphify_init.py explain "CT10::startSession"
    python tools/graphify_init.py export --obsidian --obsidian-dir ~/vaults/my-project
    python tools/graphify_init.py export --wiki --svg --graphml
    python tools/graphify_init.py mcp --watch
"""
from __future__ import annotations

# ── 표준 라이브러리 ─────────────────────────────────────────────
# argparse: 서브커맨드 파서 구성
# shutil  : PATH 상에서 실행 파일 탐색 (shutil.which)
# subprocess: 실제 graphify CLI 실행 위임
# sys     : 종료 코드 / 표준 입출력 제어
# pathlib : 경로 연산 (ROOT 기준 상대경로 계산 등)
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

# ── 프로젝트 루트 및 상수 ────────────────────────────────────────
# ROOT: 이 파일(tools/graphify_init.py)의 부모의 부모 = 프로젝트 루트.
#       모든 하위 명령은 cwd=ROOT 에서 실행되므로, 사용자가 어디서
#       스크립트를 호출해도 동일한 결과를 얻는다.
# GRAPH_JSON: fast path 판정 기준이 되는 그래프 산출물 경로.
#             존재 여부만으로 query/path/explain/export 를 바로 실행할 수 있다.
# SCAN_PATH: graphify CLI 에 넘기는 스캔 대상. "." = ROOT 전체.
#            (cwd=ROOT 이므로 "." 은 프로젝트 루트를 의미)
ROOT = Path(__file__).resolve().parent.parent
GRAPH_JSON = ROOT / "graphify-out" / "graph.json"
SCAN_PATH = "."


# ──────────────────────────────────────────────────────────────
# 공통 유틸
# ──────────────────────────────────────────────────────────────
def have_graphify() -> str | None:
    """PATH 에서 graphify 실행 파일을 찾아 절대 경로를 반환.

    PyPI 배포판 이름이 `graphifyy`(y 두 개)라서 설치 방식에 따라
    실행 파일명이 `graphify` 또는 `graphifyy` 로 갈린다.
    두 이름을 순서대로 시도해 첫 번째 히트를 반환한다.
    못 찾으면 None (호출부에서 require_cli 로 에러 처리).
    """
    for name in ("graphify", "graphifyy"):
        p = shutil.which(name)
        if p:
            return p
    return None


def require_cli() -> str:
    """graphify CLI 경로를 반환하거나, 없으면 안내 후 exit(2).

    exit code 2 는 "환경 문제로 실행 불가"를 의미하도록 규약화.
    (1 은 "그래프 없음" 같은 정상 흐름의 실패에 사용)
    """
    cli = have_graphify()
    if not cli:
        print(
            "ERROR: graphify CLI 미설치.\n"
            "  uv tool install graphifyy\n"
            "  또는 pip install graphifyy",
            file=sys.stderr,
        )
        sys.exit(2)
    return cli


def run(cmd: list[str]) -> int:
    """서브프로세스로 명령을 실행하고 종료 코드를 그대로 반환.

    - 실행 전 실제 명령을 `$ ...` 형태로 출력해 디버깅/로그 추적을 돕는다.
    - cwd=ROOT 로 고정해 상대 경로(SCAN_PATH 등) 해석을 일관되게 만든다.
    - shell=False(기본) 로 리스트 인자를 그대로 전달 → 공백/특수문자 안전.
    """
    print(f"$ {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=ROOT)


def fast_path_hint() -> None:
    """graph.json 이 이미 있으면 "빌드 생략 가능" 힌트를 stderr 아닌 stdout 으로 출력.

    실패로 간주되지 않도록 exit code 에는 영향 주지 않는다.
    용량(KB)을 함께 보여줘 stale 여부를 사용자가 대략 판단할 수 있게 한다.
    """
    if GRAPH_JSON.is_file():
        size_kb = GRAPH_JSON.stat().st_size / 1024
        print(f"[hint] graph.json 존재 ({size_kb:.0f} KB) → 'query' 직행 가능")


# ──────────────────────────────────────────────────────────────
# 서브커맨드
# ──────────────────────────────────────────────────────────────
def cmd_check(args: argparse.Namespace) -> int:
    """`check` 서브커맨드: graph.json 존재 여부만 검사.

    CI/스크립트에서 "빌드되어 있는가?" 를 물을 때 사용.
    - 존재: OK 메시지 + 경로 + 크기, exit 0
    - 부재: MISSING + 다음 액션 안내, exit 1
    `args` 는 사용하지 않지만 서브커맨드 시그니처 통일을 위해 유지.
    """
    if GRAPH_JSON.is_file():
        size_kb = GRAPH_JSON.stat().st_size / 1024
        print(f"OK: {GRAPH_JSON.relative_to(ROOT)} ({size_kb:.0f} KB)")
        return 0
    print(f"MISSING: {GRAPH_JSON.relative_to(ROOT)}")
    print("  → python tools/graphify_init.py build")
    return 1


def cmd_build(args: argparse.Namespace) -> int:
    """`build` 서브커맨드: 그래프 생성/갱신/클러스터링.

    세 가지 모드 중 하나를 CLI 인자 조합으로 변환한다.
      1) --cluster-only : 기존 그래프에 클러스터링만 재적용 (가장 저렴)
      2) --update       : 증분 빌드 (변경분만 반영)
      3) (기본)         : full 빌드. --mode normal|deep 로 파싱 깊이 조절

    공통 옵션:
      --directed : 방향 그래프 생성
      --no-viz   : HTML 시각화 산출물 생략 (CI 등에서 유용)
    """
    cli = require_cli()
    cmd = [cli]
    if args.cluster_only:
        # cluster-only 가 update 보다 우선 (둘 다 줘도 클러스터링만)
        cmd += [SCAN_PATH, "--cluster-only"]
    elif args.update:
        cmd += [SCAN_PATH, "--update"]
    else:
        cmd += [SCAN_PATH, "--mode", args.mode]
    if args.directed:
        cmd.append("--directed")
    if args.no_viz:
        cmd.append("--no-viz")
    return run(cmd)


def cmd_query(args: argparse.Namespace) -> int:
    """`query` 서브커맨드: 자연어 질문 → BFS/DFS 기반 서브그래프 응답.

    사전 조건: graph.json 존재. 없으면 build 를 먼저 하라고 안내 후 exit 1.
    --dfs    : 탐색 전략을 DFS 로 전환 (깊이 우선, 연쇄 관계 추적에 유리)
    --budget : 응답 토큰 상한 (graphify CLI 에 그대로 위임)
    """
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1
    cmd = [cli, "query", args.question]
    if args.dfs:
        cmd.append("--dfs")
    if args.budget:
        cmd += ["--budget", str(args.budget)]
    return run(cmd)


def cmd_path(args: argparse.Namespace) -> int:
    """`path` 서브커맨드: 두 노드 심볼 간 최단 경로 탐색."""
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1
    return run([cli, "path", args.source, args.target])


def cmd_explain(args: argparse.Namespace) -> int:
    """`explain` 서브커맨드: 단일 심볼(노드)의 상세 설명 조회."""
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1
    return run([cli, "explain", args.symbol])


def cmd_export(args: argparse.Namespace) -> int:
    """`export` 서브커맨드: 그래프를 다양한 포맷/타깃으로 내보낸다.

    여러 옵션이 동시에 지정되면 순차적으로 모두 실행한다.
    반환 코드는 "첫 번째 실패"를 보존하기 위해 `rc = rc or run(cmd)`
    패턴을 사용한다:
      - rc 가 0(성공)이면 다음 명령 결과가 rc 에 할당됨.
      - rc 가 이미 0이 아니면 뒤의 run 은 여전히 실행되지만
        (단락 평가는 `or` 의 좌항이 참일 때 우항을 평가하지 않음 →
         사실상 `run(cmd)` 는 평가되지 않음!) 
      ※ 주의: 아래 패턴은 "실행 자체는 항상 하고 싶은" 의도와 다르게
        short-circuit 되어 두 번째 이후 실패한 명령이 실행되지 않을 수 있다.
        (원본 로직 유지. 필요시 `first_err = first_err or run(cmd)` 형태로
         run 을 먼저 호출하도록 리팩터링 여지 있음.)
    """
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1

    rc = 0

    # HTML 계열은 하나의 커맨드로 묶어서 실행 (html + --svg/--graphml 플래그)
    if args.html or args.svg or args.graphml:
        cmd = [cli, "export", "html"]
        if args.svg:
            cmd.append("--svg")
        if args.graphml:
            cmd.append("--graphml")
        rc = rc or run(cmd)

    # Obsidian vault 로 내보내기 (--obsidian-dir 미지정 시 CLI 기본값 사용)
    if args.obsidian:
        cmd = [cli, "export", "obsidian"]
        if args.obsidian_dir:
            cmd += ["--dir", args.obsidian_dir]
        rc = rc or run(cmd)

    # 위키(Markdown 문서 세트) 내보내기
    if args.wiki:
        rc = rc or run([cli, "export", "wiki"])

    # Neo4j 로 적재
    if args.neo4j:
        rc = rc or run([cli, "export", "neo4j"])

    # FalkorDB 로 적재
    if args.falkordb:
        rc = rc or run([cli, "export", "falkordb"])

    # 옵션이 아예 없으면 사용법 오류(exit 2)로 처리
    if not any([args.html, args.svg, args.graphml, args.obsidian,
                args.wiki, args.neo4j, args.falkordb]):
        print("ERROR: 내보내기 옵션 중 하나 이상 필요.", file=sys.stderr)
        return 2
    return rc


def cmd_mcp(args: argparse.Namespace) -> int:
    """`mcp` 서브커맨드: graphify 를 MCP stdio 서버로 기동.

    graphify CLI 는 `graphify <scan> --mcp` 형태로 MCP 서버를 띄운다.
    --watch 가 있으면 파일 변경을 감시하며 그래프를 자동 갱신.
    (stdio 기반이므로 이 프로세스가 종료될 때까지 붙잡혀 있게 된다.)
    """
    cli = require_cli()
    cmd = [cli, SCAN_PATH, "--mcp"]
    if args.watch:
        cmd.append("--watch")
    return run(cmd)


# ──────────────────────────────────────────────────────────────
# main
# ──────────────────────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    """전체 argparse 트리를 구성해 반환.

    구조:
      prog
       ├── build   (full / --update / --cluster-only)
       ├── check
       ├── query   (질문 + --dfs/--budget)
       ├── path    (source, target)
       ├── explain (symbol)
       ├── export  (포맷 플래그들)
       └── mcp     (--watch)

    각 서브커맨드는 `func` 속성으로 실행 함수를 바인딩하므로,
    main 에서는 `args.func(args)` 한 줄로 디스패치할 수 있다.
    `required=True` 로 서브커맨드 없는 호출은 사용법 오류로 처리.
    RawDescriptionHelpFormatter 는 모듈 docstring 의 개행을 유지한다.
    """
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = ap.add_subparsers(dest="command", required=True)

    # ── build ────────────────────────────────────────────────
    p = sub.add_parser("build", help="그래프 빌드 (full/update/cluster-only)")
    p.add_argument("--mode", default="normal", choices=("normal", "deep"))
    p.add_argument("--update", action="store_true", help="증분 빌드")
    p.add_argument("--cluster-only", action="store_true", help="기존 그래프 클러스터링만")
    p.add_argument("--directed", action="store_true", help="방향 그래프")
    p.add_argument("--no-viz", action="store_true", help="HTML 시각화 생략")
    p.set_defaults(func=cmd_build)

    # ── check ────────────────────────────────────────────────
    p = sub.add_parser("check", help="graph.json 존재 확인")
    p.set_defaults(func=cmd_check)

    # ── query ────────────────────────────────────────────────
    p = sub.add_parser("query", help="자연어 질문 (BFS 기본)")
    p.add_argument("question")
    p.add_argument("--dfs", action="store_true", help="DFS 모드")
    p.add_argument("--budget", type=int, default=None, help="응답 토큰 상한")
    p.set_defaults(func=cmd_query)

    # ── path ─────────────────────────────────────────────────
    p = sub.add_parser("path", help="두 개념 간 최단 경로")
    p.add_argument("source")
    p.add_argument("target")
    p.set_defaults(func=cmd_path)

    # ── explain ──────────────────────────────────────────────
    p = sub.add_parser("explain", help="단일 노드 설명")
    p.add_argument("symbol")
    p.set_defaults(func=cmd_explain)

    # ── export ───────────────────────────────────────────────
    # 포맷 플래그를 각각 독립적으로 켤 수 있게 하고,
    # 조합은 cmd_export 에서 순차 처리한다.
    p = sub.add_parser("export", help="내보내기")
    p.add_argument("--html", action="store_true", default=False)
    p.add_argument("--svg", action="store_true")
    p.add_argument("--graphml", action="store_true")
    p.add_argument("--obsidian", action="store_true")
    p.add_argument("--obsidian-dir", default=None)
    p.add_argument("--wiki", action="store_true")
    p.add_argument("--neo4j", action="store_true")
    p.add_argument("--falkordb", action="store_true")
    p.set_defaults(func=cmd_export)

    # ── mcp ──────────────────────────────────────────────────
    p = sub.add_parser("mcp", help="MCP stdio 서버")
    p.add_argument("--watch", action="store_true")
    p.set_defaults(func=cmd_mcp)

    return ap


def main() -> int:
    """엔트리포인트: 파싱 → (필요 시) fast path 힌트 → 서브커맨드 실행.

    - build/check 는 graph.json 부재가 정상 흐름이므로 힌트를 띄우지 않는다.
    - query/path/explain/export/mcp 는 그래프가 이미 있으면
      "빌드 없이 바로 써도 된다"는 힌트를 띄워 UX 를 돕는다.
    """
    ap = build_parser()
    args = ap.parse_args()
    if args.command in ("query", "path", "explain", "export", "mcp"):
        fast_path_hint()
    return args.func(args)


# 스크립트로 직접 실행될 때만 main() 을 호출하고,
# 그 종료 코드를 프로세스 종료 코드로 반환한다.
if __name__ == "__main__":
    sys.exit(main())








"""
#!/usr/bin/env python3
"""

"""v0203 graphify CLI 래퍼 (cross-platform).

`.agents/skills/graphify/SKILL.md`의 PowerShell 파이프라인을 위임받는다.
fast path(graph.json 존재 시 query 직행)는 이 래퍼를 거치지 않아도 된다.

Subcommands:
    build    그래프 빌드 (기본: full / --update / --cluster-only)
    check    graph.json 존재 확인 (exit 0/1)
    query    자연어 질문 BFS/DFS
    path     두 노드 간 최단 경로
    explain  단일 노드 설명
    export   내보내기 (--html/--obsidian/--wiki/--svg/--graphml/--neo4j/--falkordb)
    mcp      MCP stdio 서버 (--watch)

Usage:
    python tools/graphify_init.py build --mode deep
    python tools/graphify_init.py check
    python tools/graphify_init.py query "Session FSM이 어떻게 동작해?"
    python tools/graphify_init.py query "..." --budget 1500 --dfs
    python tools/graphify_init.py path "Session" "runCtx"
    python tools/graphify_init.py explain "CT10::startSession"
    python tools/graphify_init.py export --obsidian --obsidian-dir ~/vaults/my-project
    python tools/graphify_init.py export --wiki --svg --graphml
    python tools/graphify_init.py mcp --watch
"""

"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH_JSON = ROOT / "graphify-out" / "graph.json"
SCAN_PATH = "."


# ──────────────────────────────────────────────────────────────
# 공통 유틸
# ──────────────────────────────────────────────────────────────
def have_graphify() -> str | None:
    for name in ("graphify", "graphifyy"):
        p = shutil.which(name)
        if p:
            return p
    return None


def require_cli() -> str:
    cli = have_graphify()
    if not cli:
        print(
            "ERROR: graphify CLI 미설치.\n"
            "  uv tool install graphifyy\n"
            "  또는 pip install graphifyy",
            file=sys.stderr,
        )
        sys.exit(2)
    return cli


def run(cmd: list[str]) -> int:
    print(f"$ {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=ROOT)


def fast_path_hint() -> None:
    if GRAPH_JSON.is_file():
        size_kb = GRAPH_JSON.stat().st_size / 1024
        print(f"[hint] graph.json 존재 ({size_kb:.0f} KB) → 'query' 직행 가능")


# ──────────────────────────────────────────────────────────────
# 서브커맨드
# ──────────────────────────────────────────────────────────────
def cmd_check(args: argparse.Namespace) -> int:
    if GRAPH_JSON.is_file():
        size_kb = GRAPH_JSON.stat().st_size / 1024
        print(f"OK: {GRAPH_JSON.relative_to(ROOT)} ({size_kb:.0f} KB)")
        return 0
    print(f"MISSING: {GRAPH_JSON.relative_to(ROOT)}")
    print("  → python tools/graphify_init.py build")
    return 1


def cmd_build(args: argparse.Namespace) -> int:
    cli = require_cli()
    cmd = [cli]
    if args.cluster_only:
        cmd += [SCAN_PATH, "--cluster-only"]
    elif args.update:
        cmd += [SCAN_PATH, "--update"]
    else:
        cmd += [SCAN_PATH, "--mode", args.mode]
    if args.directed:
        cmd.append("--directed")
    if args.no_viz:
        cmd.append("--no-viz")
    return run(cmd)


def cmd_query(args: argparse.Namespace) -> int:
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1
    cmd = [cli, "query", args.question]
    if args.dfs:
        cmd.append("--dfs")
    if args.budget:
        cmd += ["--budget", str(args.budget)]
    return run(cmd)


def cmd_path(args: argparse.Namespace) -> int:
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1
    return run([cli, "path", args.source, args.target])


def cmd_explain(args: argparse.Namespace) -> int:
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1
    return run([cli, "explain", args.symbol])


def cmd_export(args: argparse.Namespace) -> int:
    cli = require_cli()
    if not GRAPH_JSON.is_file():
        print("ERROR: graph.json 없음. 먼저 build 실행.", file=sys.stderr)
        return 1

    rc = 0
    if args.html or args.svg or args.graphml:
        cmd = [cli, "export", "html"]
        if args.svg:
            cmd.append("--svg")
        if args.graphml:
            cmd.append("--graphml")
        rc = rc or run(cmd)

    if args.obsidian:
        cmd = [cli, "export", "obsidian"]
        if args.obsidian_dir:
            cmd += ["--dir", args.obsidian_dir]
        rc = rc or run(cmd)

    if args.wiki:
        rc = rc or run([cli, "export", "wiki"])

    if args.neo4j:
        rc = rc or run([cli, "export", "neo4j"])

    if args.falkordb:
        rc = rc or run([cli, "export", "falkordb"])

    if not any([args.html, args.svg, args.graphml, args.obsidian,
                args.wiki, args.neo4j, args.falkordb]):
        print("ERROR: 내보내기 옵션 중 하나 이상 필요.", file=sys.stderr)
        return 2
    return rc


def cmd_mcp(args: argparse.Namespace) -> int:
    cli = require_cli()
    cmd = [cli, SCAN_PATH, "--mcp"]
    if args.watch:
        cmd.append("--watch")
    return run(cmd)


# ──────────────────────────────────────────────────────────────
# main
# ──────────────────────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="command", required=True)

    # build
    p = sub.add_parser("build", help="그래프 빌드 (full/update/cluster-only)")
    p.add_argument("--mode", default="normal", choices=("normal", "deep"))
    p.add_argument("--update", action="store_true", help="증분 빌드")
    p.add_argument("--cluster-only", action="store_true", help="기존 그래프 클러스터링만")
    p.add_argument("--directed", action="store_true", help="방향 그래프")
    p.add_argument("--no-viz", action="store_true", help="HTML 시각화 생략")
    p.set_defaults(func=cmd_build)

    # check
    p = sub.add_parser("check", help="graph.json 존재 확인")
    p.set_defaults(func=cmd_check)

    # query
    p = sub.add_parser("query", help="자연어 질문 (BFS 기본)")
    p.add_argument("question")
    p.add_argument("--dfs", action="store_true", help="DFS 모드")
    p.add_argument("--budget", type=int, default=None, help="응답 토큰 상한")
    p.set_defaults(func=cmd_query)

    # path
    p = sub.add_parser("path", help="두 개념 간 최단 경로")
    p.add_argument("source")
    p.add_argument("target")
    p.set_defaults(func=cmd_path)

    # explain
    p = sub.add_parser("explain", help="단일 노드 설명")
    p.add_argument("symbol")
    p.set_defaults(func=cmd_explain)

    # export
    p = sub.add_parser("export", help="내보내기")
    p.add_argument("--html", action="store_true", default=False)
    p.add_argument("--svg", action="store_true")
    p.add_argument("--graphml", action="store_true")
    p.add_argument("--obsidian", action="store_true")
    p.add_argument("--obsidian-dir", default=None)
    p.add_argument("--wiki", action="store_true")
    p.add_argument("--neo4j", action="store_true")
    p.add_argument("--falkordb", action="store_true")
    p.set_defaults(func=cmd_export)

    # mcp
    p = sub.add_parser("mcp", help="MCP stdio 서버")
    p.add_argument("--watch", action="store_true")
    p.set_defaults(func=cmd_mcp)

    return ap


def main() -> int:
    ap = build_parser()
    args = ap.parse_args()
    if args.command in ("query", "path", "explain", "export", "mcp"):
        fast_path_hint()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())


"""