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
