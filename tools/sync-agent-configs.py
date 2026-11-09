#!/usr/bin/env python3
"""`.agents/` → `.claude/` 동기화 (SmartNatureWind v0203).

`.agents/` 를 canonical로 하고 `.claude/` 는 생성물로 취급한다.
CI/pre-commit 에서 `--check` 로 drift 감지.

Usage:
    python tools/sync-agent-configs.py           # sync
    python tools/sync-agent-configs.py --check   # drift 검사 (exit 1 if drift)
"""
from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS = ROOT / ".agents"
CLAUDE = ROOT / ".claude"

FRONTMATTER_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n(.*)$", re.DOTALL)


def split_frontmatter(text: str) -> tuple[str, str]:
    m = FRONTMATTER_RE.match(text)
    return (m.group(1), m.group(2)) if m else ("", text)


def extract_globs(fm_raw: str) -> list[str]:
    m = re.search(r'^globs:\s*"?([^"\n]+)"?', fm_raw, re.MULTILINE)
    if not m:
        return []
    return [g.strip() for g in m.group(1).split(",") if g.strip()]


def convert_rule(agents_text: str) -> str:
    """Antigravity(trigger/globs) → Claude Code(paths)."""
    fm_raw, body = split_frontmatter(agents_text)
    if "trigger:" not in fm_raw:
        return body

    trigger_m = re.search(r"^trigger:\s*(\S+)", fm_raw, re.MULTILINE)
    trigger = trigger_m.group(1) if trigger_m else ""

    if trigger == "glob":
        globs = extract_globs(fm_raw)
        if not globs:
            return body
        paths_yaml = "\n".join(f'  - "{g}"' for g in globs)
        return f"---\npaths:\n{paths_yaml}\n---\n{body}"

    # model_decision / always_on → frontmatter 생략 (Claude Code는 항상 로드)
    return body


def convert_workflow(agents_text: str, fallback_desc: str) -> str:
    fm_raw, body = split_frontmatter(agents_text)
    if fm_raw:
        return agents_text
    m = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
    desc = m.group(1).strip() if m else fallback_desc
    return f"---\ndescription: {desc}\n---\n\n{body}"


class SyncStats:
    def __init__(self) -> None:
        self.written = 0
        self.drift = 0


def _write_or_check(target: Path, content: str, check: bool, stats: SyncStats) -> None:
    if target.exists() and target.read_text(encoding="utf-8") == content:
        return
    if check:
        print(f"[DRIFT] {target.relative_to(ROOT)}")
        stats.drift += 1
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    print(f"[write] {target.relative_to(ROOT)}")
    stats.written += 1


def sync_rules(check: bool, stats: SyncStats) -> None:
    src_dir = AGENTS / "rules"
    if not src_dir.is_dir():
        return
    for src in sorted(src_dir.glob("*.md")):
        converted = convert_rule(src.read_text(encoding="utf-8"))
        _write_or_check(CLAUDE / "rules" / src.name, converted, check, stats)


def sync_skills(check: bool, stats: SyncStats) -> None:
    src_dir = AGENTS / "skills"
    if not src_dir.is_dir():
        return
    for skill_dir in sorted(src_dir.iterdir()):
        if not (skill_dir / "SKILL.md").is_file():
            continue
        dst_dir = CLAUDE / "skills" / skill_dir.name
        for f in skill_dir.rglob("*"):
            if not f.is_file():
                continue
            target = dst_dir / f.relative_to(skill_dir)
            if check:
                if not target.exists() or target.read_bytes() != f.read_bytes():
                    print(f"[DRIFT] {target.relative_to(ROOT)}")
                    stats.drift += 1
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, target)
                stats.written += 1


def sync_workflows(check: bool, stats: SyncStats) -> None:
    src_dir = AGENTS / "workflows"
    if not src_dir.is_dir():
        return
    for src in sorted(src_dir.glob("*.md")):
        converted = convert_workflow(
            src.read_text(encoding="utf-8"), fallback_desc=src.stem
        )
        _write_or_check(CLAUDE / "commands" / src.name, converted, check, stats)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="drift만 감지 (CI/pre-commit)")
    args = ap.parse_args()

    stats = SyncStats()
    sync_rules(args.check, stats)
    sync_skills(args.check, stats)
    sync_workflows(args.check, stats)

    if args.check:
        print(f"\nCheck: {stats.drift} drift(s)")
        return 1 if stats.drift else 0

    print(f"\nSync complete: {stats.written} file(s) written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
