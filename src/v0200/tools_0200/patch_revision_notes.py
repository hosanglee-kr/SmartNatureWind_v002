#!/usr/bin/env python3
"""
[A-P2] v0200 계약 문서 개정이력 v2.0 행에 이전 버전 요약 병기

문제:
  - v2.0 개정이력 행이 v1.2의 Gzip/번들 내용을 재기술하지 않음
  - 누적 요약 관례 위반

해결:
  - v2.0 행의 "변경 내용" 끝에 "(v1.2의 Gzip/번들 지표 유지)" 등 병기
  - 대상 문서: README / CONTRACT / STATE / FLOW / BUDGET / SPEC
  - --check: CI gate용, 미병기 대상 발견 시 exit 1

사용:
  python src/v0200/tools_0200/patch_revision_notes.py --dry-run
  python src/v0200/tools_0200/patch_revision_notes.py --check   # CI gate
  python src/v0200/tools_0200/patch_revision_notes.py
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# (파일명, 병기할 접미사)
TARGETS: tuple = (
    ("README_0200.md",   " + (v1.2의 Gzip/번들/소스-배포 분리 유지)"),
    ("SPEC_0200.md",     " + (v1.2의 Gzip 파이프라인/번들 지표 유지)"),
    ("CONTRACT_0200.md", " + (v1.2의 Gzip 서빙 계약 유지)"),
    ("STATE_0200.md",    " + (v1.2의 번들 상태 규격 유지)"),
    ("FLOW_0200.md",     " + (v1.2의 빌드 파이프라인 흐름 유지)"),
    ("BUDGET_0200.md",   " + (v1.2의 플래시/소켓 예산 지표 유지)"),
)

# 개정이력 테이블의 v2.0 행 (마지막 셀 Antigravity AI 앞에 병기)
V20_ROW = re.compile(
    r'^(\|\s*2026-10-19\s*\|\s*v2\.0\s*\|\s*)([^|]*?)(\s*\|\s*Antigravity AI\s*\|\s*)$',
    re.MULTILINE,
)


def patch_file(path: Path, suffix: str, dry_run: bool) -> int:
    if not path.is_file():
        print(f"  [SKIP] 파일 없음: {path.name}")
        return 0

    content = path.read_text(encoding="utf-8")
    modified = False

    def _repl(m: re.Match) -> str:
        nonlocal modified
        before, middle, after = m.group(1), m.group(2), m.group(3)
        if "유지)" in middle:
            return m.group(0)
        modified = True
        return f"{before}{middle.rstrip()}{suffix}{after}"

    new_content = V20_ROW.sub(_repl, content)

    if not modified:
        print(f"  [OK] {path.name}: 이미 반영 또는 대상 없음")
        return 0

    if dry_run:
        print(f"  [DRY] {path.name}: v2.0 행 병기 예정")
        return 1

    path.write_text(new_content, encoding="utf-8")
    print(f"  [FIX] {path.name}: v2.0 행 병기 완료")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="v0200 개정이력 v2.0 행 문구 보강")
    parser.add_argument("-n", "--dry-run", action="store_true",
                        help="파일 수정 없이 검사만")
    parser.add_argument("--dir", default="src/v0200/contract_doc_0200",
                        help="문서 디렉토리")
    parser.add_argument("--check", action="store_true",
                        help="CI gate: 미병기 대상 발견 시 exit 1 (내부적으로 dry-run 실행)")
    args = parser.parse_args()

    root = Path(args.dir).resolve()
    if not root.is_dir():
        print(f"[ERROR] 디렉토리 없음: {root}", file=sys.stderr)
        return 1

    # --check는 내부적으로 dry-run 강제
    dry = args.dry_run or args.check

    print("=" * 60)
    print(f" [A-P2] 개정이력 v2.0 문구 병기: {root}")
    if args.check:
        print(" 모드: CHECK (gate)")
    elif dry:
        print(" 모드: DRY-RUN")
    print("=" * 60)

    total = 0
    for name, suffix in TARGETS:
        total += patch_file(root / name, suffix, dry)

    print()
    print(f" 총 수정: {total}건 ({'DRY-RUN' if dry else '적용 완료'})")

    # CI gate: check 모드에서 미병기 발견 시 실패
    if args.check and total > 0:
        print(f"[CHECK] 병기 미완료 {total}건 → exit 1", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[ERROR] 사용자 중단", file=sys.stderr)
        sys.exit(130)
