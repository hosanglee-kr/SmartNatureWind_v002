#!/usr/bin/env python3
"""
[A-P0] v0200 계약 문서 테이블에 잘못 삽입된 개정이력 행 자동 제거

문제:
  - v017 → v0200 승격 시 개정이력 행이 §1~§7 모든 테이블에 반복 삽입됨
  - 컬럼 수 불일치로 마크다운 렌더링 붕괴
  - §개정이력 섹션의 동일 행은 정상이므로 보존 대상

해결:
  - "## N. 개정 이력" 섹션 이전 본문에서만 정규식 제거
  - 개정이력 테이블 자체는 건드리지 않음

사용:
  python src/v0200/tools_0200/fix_table_bleed.py --dry-run
  python src/v0200/tools_0200/fix_table_bleed.py
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Windows 콘솔 UTF-8
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 대상 문서 (contract_doc_0200 디렉토리 내)
TARGET_DOCS: tuple[str, ...] = (
    "README_0200.md",
    "SPEC_0200.md",
    "CONTRACT_0200.md",
    "STATE_0200.md",
    "FLOW_0200.md",
    "BUDGET_0200.md",
    "TEST_PLAN_0200.md",
)

# 개정이력 섹션 시작 마커 (이후는 삭제 금지)
REVISION_SECTION_MARKERS = (
    "## 8. 개정 이력",
    "## 개정 이력",
    "## 10. 개정 이력",
    "## 9. 개정 이력",
    "## 7. 개정 이력",
    "## 6. 개정 이력",
)

# 제거 대상 패턴:
#   | 2026-10-19 | v2.0 | v0200 승격: ... | Antigravity AI |
BLEED_PATTERN = re.compile(
    r'^\|\s*2026-10-19\s*\|\s*v2\.0\s*\|.*?Antigravity AI\s*\|\s*$\r?\n',
    re.MULTILINE,
)


def find_revision_section_index(content: str) -> int:
    """개정이력 섹션 시작 위치 반환 (없으면 -1)."""
    for marker in REVISION_SECTION_MARKERS:
        idx = content.find(marker)
        if idx >= 0:
            return idx
    return -1


def fix_document(path: Path, dry_run: bool) -> int:
    """단일 문서 수정. 제거된 행 수 반환."""
    if not path.is_file():
        print(f"  [SKIP] 파일 없음: {path.name}")
        return 0

    original = path.read_text(encoding="utf-8")

    rev_idx = find_revision_section_index(original)
    if rev_idx < 0:
        # 개정이력 섹션 없으면 파일 전체에 적용
        body = original
        tail = ""
    else:
        body = original[:rev_idx]
        tail = original[rev_idx:]

    # 본문에서만 제거
    matches = BLEED_PATTERN.findall(body)
    removed_count = len(matches)

    if removed_count == 0:
        print(f"  [OK] {path.name}: 삽입된 행 없음")
        return 0

    new_body = BLEED_PATTERN.sub("", body)
    new_content = new_body + tail

    if dry_run:
        print(f"  [DRY] {path.name}: {removed_count}행 제거 예정")
        return removed_count

    path.write_text(new_content, encoding="utf-8")
    print(f"  [FIX] {path.name}: {removed_count}행 제거 완료")
    return removed_count


def main() -> int:
    parser = argparse.ArgumentParser(
        description="v0200 계약 문서 테이블 개정이력 행 자동 제거",
    )
    parser.add_argument(
        "-n", "--dry-run",
        action="store_true",
        help="파일 수정 없이 검사만",
    )
    parser.add_argument(
        "--dir",
        default="src/v0200/contract_doc_0200",
        help="문서 디렉토리 (기본: src/v0200/contract_doc_0200)",
    )
    args = parser.parse_args()

    root = Path(args.dir).resolve()
    if not root.is_dir():
        print(f"[ERROR] 디렉토리 없음: {root}", file=sys.stderr)
        return 1

    print("=" * 60)
    print(f" [A-P0] 테이블 개정이력 행 제거: {root}")
    if args.dry_run:
        print(" 모드: DRY-RUN")
    print("=" * 60)

    total_removed = 0
    for name in TARGET_DOCS:
        total_removed += fix_document(root / name, args.dry_run)

    print()
    print(f" 총 제거: {total_removed}행 ({'DRY-RUN' if args.dry_run else '적용 완료'})")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[ERROR] 사용자 중단", file=sys.stderr)
        sys.exit(130)
