#!/usr/bin/env python3
"""v0203 graphify 초기 빌드 래퍼 (cross-platform).

Usage:
    python tools/graphify_init.py             # full build
    python tools/graphify_init.py --check     # 기존 graph 존재 확인만
    python tools/graphify_init.py --update    # 증분 빌드

기존 .agents/skills/graphify/SKILL.md 는 PowerShell 예제 기준이므로,
이 래퍼는 Windows/macOS/Linux 공통 엔트리를 제공한다.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH_JSON = ROOT / "graphify-out" / "graph.json"


def have_graphify() -> str | None:
    for name in ("graphify", "graphifyy"):
        p = shutil.which(name)
        if p:
            return p
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="graph.json 존재만 확인")
    ap.add_argument("--update", action="store_true", help="증분 빌드")
    ap.add_argument("--mode", default="normal", choices=("normal", "deep"),
                    help="추출 모드 (deep: 더 풍부한 INFERRED 엣지)")
    args = ap.parse_args()

    if args.check:
        if GRAPH_JSON.is_file():
            size_kb = GRAPH_JSON.stat().st_size / 1024
            print(f"OK: {GRAPH_JSON.relative_to(ROOT)} ({size_kb:.0f} KB)")
            return 0
        print(f"MISSING: {GRAPH_JSON.relative_to(ROOT)}")
        return 1

    cli = have_graphify()
    if not cli:
        print("ERROR: graphify CLI 미설치. `pip install graphifyy` 또는 `uv tool install graphifyy`", file=sys.stderr)
        return 2

    cmd = [cli]
    if args.update:
        cmd += [".", "--update"]
    else:
        cmd += [".", "--mode", args.mode]
    print(f"$ {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=ROOT)


if __name__ == "__main__":
    sys.exit(main())

