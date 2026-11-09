#!/usr/bin/env python3
"""계약 문서 "AI 빠른 참조" 블록의 §섹션을 실제 헤딩 앵커로 링크화.

전략:
- 각 문서의 TOC에서 `- [N.M 제목](#anchor)` 패턴을 파싱 → anchor 맵 구축
- "## 🔍 AI 빠른 참조" 블록 영역에서 `§N.M` 패턴만 `[§N.M](#anchor)`로 변환
- "연관 계약" 컬럼은 다른 문서 참조이므로 그대로 유지 (in-place 링크 X)
- 이미 링크화된 항목은 skip (idempotent)

Usage:
    python src/v0203/tools_0203/enhance_index_links_0203.py --dry-run
    python src/v0203/tools_0203/enhance_index_links_0203.py
    python src/v0203/tools_0203/enhance_index_links_0203.py --verify      # anchor 유효성 검증
    python src/v0203/tools_0203/enhance_index_links_0203.py --docs path1 path2
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
DOC_DIR = THIS_DIR.parent / "contract_doc_0203"
ROOT = THIS_DIR.parent.parent.parent

DEFAULT_DOCS = [
    "SPEC_0203.md",
    "CONTRACT_0203.md",
    "STATE_0203.md",
    "FLOW_0203.md",
    "BUDGET_0203.md",
    "TEST_PLAN_0203.md",
]

# TOC 파싱 패턴 (다양한 마크다운 목차 포맷 지원)
# 1) `[1.1 제목](#anchor)`
# 2) `1. [제목](#anchor)`
# 3) `- 3.1 [제목](#anchor)`
# 4) `1. [1. 제목](#anchor)`
TOC_RE = re.compile(
    r"^\s*(?:(?:[-*]\s+)?\[(\d+(?:\.\d+)*)\s[^\]]*\]|(\d+(?:\.\d+)*)\.\s+\[[^\]]*\]|(?:[-*]\s+)?(\d+(?:\.\d+)*)\s+\[[^\]]*\])\(#([^)]+)\)",
    re.MULTILINE,
)

# "## N.M 제목" / "### N.M.K 제목" — 앵커 유효성 검증용
HEADING_RE = re.compile(r"^#{2,6}\s+(\d+(?:\.\d+)*)\.?\s+(.+)$", re.MULTILINE)

# "## 🔍 AI 빠른 참조" 블록 시작 마커
BLOCK_START_RE = re.compile(r"^##\s+🔍\s*AI 빠른 참조", re.MULTILINE)
# 다음 `## ` 헤딩이 블록 끝
BLOCK_END_RE = re.compile(r"^##\s+", re.MULTILINE)

# §섹션 패턴 (숫자와 점)
SECTION_RE = re.compile(r"§(\d+(?:\.\d+)*)")

# 이미 링크화된 § 패턴
LINKED_RE = re.compile(r"\[§(\d+(?:\.\d+)*)\]\(#[^)]+\)")


def github_anchor(text: str) -> str:
    """GitHub/Antigravity anchor 규칙.

    - 소문자화
    - 공백 → 하이픈
    - 영숫자/한글/하이픈/언더스코어 유지
    - 그 외(.,  ,(), ↔, &, :, — 등) 제거
    """
    out = []
    for ch in text.lower():
        if ch == " ":
            out.append("-")
        elif ch.isalnum() or ch in "-_":
            out.append(ch)
    return "".join(out)


def build_anchor_map(text: str) -> dict[str, str]:
    """TOC에서 (섹션번호 → anchor) 맵."""
    res = {}
    for m in TOC_RE.finditer(text):
        num = m.group(1) or m.group(2) or m.group(3)
        anchor = m.group(4)
        if num and anchor:
            res[num] = anchor
    return res


def verify_anchors(text: str, anchor_map: dict[str, str]) -> list[str]:
    """TOC anchor와 실제 헤딩 anchor가 일치하는지 검증. 불일치 리스트 반환."""
    heading_map: dict[str, str] = {}
    for m in HEADING_RE.finditer(text):
        num, title = m.group(1), m.group(2).strip()
        heading_map[num] = github_anchor(f"{num} {title}")

    mismatches = []
    for num, toc_anchor in anchor_map.items():
        if num not in heading_map:
            mismatches.append(f"§{num}: 헤딩 없음 (TOC anchor={toc_anchor})")
        elif heading_map[num] != toc_anchor:
            mismatches.append(
                f"§{num}: TOC={toc_anchor} ≠ 계산={heading_map[num]}"
            )
    return mismatches


def find_block(text: str) -> tuple[int, int] | None:
    """'AI 빠른 참조' 블록의 (시작, 끝) 인덱스. 없으면 None."""
    start_m = BLOCK_START_RE.search(text)
    if not start_m:
        return None
    start = start_m.start()
    next_m = BLOCK_END_RE.search(text, start_m.end())
    end = next_m.start() if next_m else len(text)
    return start, end


def linkify_block(block: str, anchor_map: dict[str, str]) -> str:
    """블록 내 §패턴 → [§N](#anchor). 이미 링크화된 것은 skip."""
    # 이미 링크화된 §를 placeholder로 stash
    placeholders: list[str] = []

    def _stash(m: re.Match) -> str:
        placeholders.append(m.group(0))
        return f"__LINK_{len(placeholders) - 1}__"

    block = LINKED_RE.sub(_stash, block)

    def _repl(m: re.Match) -> str:
        num = m.group(1)
        anchor = anchor_map.get(num)
        return f"[§{num}](#{anchor})" if anchor else m.group(0)

    block = SECTION_RE.sub(_repl, block)

    for i, orig in enumerate(placeholders):
        block = block.replace(f"__LINK_{i}__", orig)

    return block


def process_doc(path: Path, dry_run: bool, verify: bool) -> str:
    """한 문서 처리. 상태 문자열 반환: NO-CHANGE / WOULD-CHANGE / WROTE / SKIP-*"""
    if not path.is_file():
        return f"SKIP-NO-FILE: {path}"

    text = path.read_text(encoding="utf-8")
    anchor_map = build_anchor_map(text)

    if not anchor_map:
        return f"SKIP-NO-TOC: {path.name}"

    if verify:
        mismatches = verify_anchors(text, anchor_map)
        if mismatches:
            print(f"[VERIFY] {path.name}: {len(mismatches)}건 불일치")
            for mm in mismatches:
                print(f"  - {mm}")
        else:
            print(f"[VERIFY] {path.name}: OK ({len(anchor_map)} anchors)")

    bounds = find_block(text)
    if bounds is None:
        return f"SKIP-NO-BLOCK: {path.name}"

    start, end = bounds
    new_block = linkify_block(text[start:end], anchor_map)
    new_text = text[:start] + new_block + text[end:]

    if new_text == text:
        return f"NO-CHANGE: {path.name}"

    if dry_run:
        # 변경 라인 수 표시
        import difflib
        diff = list(
            difflib.unified_diff(
                text.splitlines(),
                new_text.splitlines(),
                lineterm="",
                n=0,
            )
        )
        changes = sum(1 for line in diff if line.startswith(("+", "-")) and not line.startswith(("+++", "---")))
        print(f"[DRY-RUN] {path.name}: {changes} lines would change")
        return f"WOULD-CHANGE: {path.name}"

    path.write_text(new_text, encoding="utf-8")
    return f"WROTE: {path.name}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verify", action="store_true", help="TOC anchor 유효성 검증")
    ap.add_argument("--docs", nargs="*", help="처리할 문서 경로 (기본: 계약 6종)")
    args = ap.parse_args()

    if args.docs:
        docs = [Path(p) if Path(p).is_absolute() else (ROOT / p) for p in args.docs]
    else:
        docs = [DOC_DIR / name for name in DEFAULT_DOCS]

    results = []
    for path in docs:
        results.append(process_doc(path, args.dry_run, args.verify))

    print("\n=== 요약 ===")
    for r in results:
        print(f"  {r}")

    # verify 모드면 불일치 있으면 exit 1
    if args.verify:
        any_mismatch = False
        for path in docs:
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8")
            amap = build_anchor_map(text)
            if verify_anchors(text, amap):
                any_mismatch = True
        return 1 if any_mismatch else 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
