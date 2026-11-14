#!/usr/bin/env python3
"""백엔드 C++ 수정 승인 마커 생성 (AGENTS.md 원칙 1).

Usage:
    python tools/approve_backend.py \
        --purpose "Session FSM pause 버그 수정" \
        --files "src/v0203/CT10_Ctl_Ctl_0203.cpp,src/v0203/CT10_Ctl_0203.h"

마커: .agents/state/backend-approval.json
Hook(`.agents/hooks/require_backend_approval.py`)이 이 마커 존재 여부로 allow/deny 판정.

작업 완료 후 반드시:
    python tools/approve_backend.py --revoke
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE_DIR = ROOT / ".agents" / "state"
MARKER = STATE_DIR / "backend-approval.json"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--purpose", help="수정 목적·기능변화 요약 (필수, 10자 이상)")
    ap.add_argument("--files", help="대상 파일 (comma-separated)")
    ap.add_argument("--revoke", action="store_true", help="승인 마커 삭제")
    args = ap.parse_args()

    if args.revoke:
        if MARKER.is_file():
            MARKER.unlink()
            print(f"REVOKED: {MARKER.relative_to(ROOT)}")
        else:
            print("NO-OP: 마커 없음")
        return 0

    if not args.purpose or len(args.purpose.strip()) < 10:
        print("ERROR: --purpose 는 10자 이상 필요 (AGENTS.md 원칙 1: 목적·기능변화 명확화)", file=sys.stderr)
        return 1

    if not args.files:
        print("ERROR: --files 필요", file=sys.stderr)
        return 1

    files = [f.strip() for f in args.files.split(",") if f.strip()]
    bad = [f for f in files if not f.startswith("src/v0203/")]
    if bad:
        print(f"WARN: 백엔드 경로 아님: {bad}", file=sys.stderr)

    STATE_DIR.mkdir(parents=True, exist_ok=True)
    marker = {
        "approved": True,
        "purpose": args.purpose.strip(),
        "files": files,
        "approved_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "approved_by": "user",
    }
    MARKER.write_text(json.dumps(marker, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"APPROVED: {MARKER.relative_to(ROOT)}")
    print(f"  purpose: {marker['purpose']}")
    print(f"  files:   {len(files)}개")
    print("\n작업 완료 후: python tools/approve_backend.py --revoke")
    return 0


if __name__ == "__main__":
    sys.exit(main())

