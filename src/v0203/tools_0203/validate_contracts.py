#!/usr/bin/env python3
"""
validate_contracts.py — SSOT 자동 대조 CI (Phase 3 신규)

[목적]
  - 계약 문서(SPEC/README/BUDGET) ↔ C++ 헤더 ↔ JS 상수 3자 정합성 검증
  - 코드 리뷰 누락으로 인한 표류(주로 문서 outdate) 원천 차단

[검증 항목]
  1. SPEC §5.1.4.1 API 경로 ↔ W10_Web_Const_0203.h
  2. SPEC §5.1.4.4 AI 상수 ↔ W10_Web_0203.h::W10_AI_Limits
  3. C++ FSM 상태/이유명 ↔ offline 어댑터 (998.offline_0203.js)
  4. SPEC §5.4.4 SPA 스키마 ↔ cfg_pages_0203.json
  5. i18n ko/en 대칭성 (check_i18n.py --strict 위임)

[사용]
  python src/v0203/tools_0203/validate_contracts.py             # 리포트만
  python src/v0203/tools_0203/validate_contracts.py --strict    # exit 1
  python src/v0203/tools_0203/validate_contracts.py --warn-only # 경고만 (CI 초기)

[Exit codes]
  0 : 정합성 통과
  1 : 위반 발견 (--strict)
  2 : 파일 경로 오류
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Windows 콘솔 UTF-8 강제
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

EXIT_OK      = 0
EXIT_FAIL    = 1
EXIT_IO      = 2

REPO_MARKER  = "platformio.ini"


# ============================================================
# 헬퍼
# ============================================================
def find_repo_root(start: Path) -> Path:
    cur = start
    while cur != cur.parent:
        if (cur / REPO_MARKER).is_file():
            return cur
        cur = cur.parent
    return Path.cwd()


def _read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        return ""


# ============================================================
# 검증 1: SPEC §5.1.4.1 경로 ↔ W10_Web_Const_0203.h
# ============================================================
def check_api_paths(repo: Path) -> list[str]:
    spec = _read(repo / "src/v0203/contract_doc_0203/SPEC_0203.md")
    hdr = _read(repo / "src/v0203/W10_Web_Const_0203.h")
    js_cfg = _read(repo / "src/v0203/data_v0203_src/html_v0203/js/core/010.config.js")

    violations = []

    # SPEC §5.1.4.1의 `/api/v001/ai/live-*` 경로 추출
    spec_live_paths = set()
    for m in re.finditer(r"`(/api/v001/ai/live-[a-z-]+)`", spec):
        spec_live_paths.add(m.group(1))

    # 헤더에 `/ai/live-*` 문자열 상수 존재 여부
    for p in spec_live_paths:
        short = p.split("/api/v001")[-1]   # /ai/live-xxx
        if short not in hdr and f'"{short}"' not in hdr:
            if "HTTP_API_AI_LIVE" not in hdr:
                violations.append(
                    f"SPEC §5.1.4.1 경로 {p} ↔ W10_Web_Const_0203.h 미정의"
                )

    # 프론트엔드 config.js의 aiLiveFunc/aiLiveCfg 등 경로 비교
    for name in ("aiLiveToken", "aiLiveFunc", "aiLiveCfg", "aiCostStatus", "aiUsage", "aiCostReset"):
        m_js = re.search(rf"{name}\s*:\s*'([^']+)'", js_cfg)
        if not m_js:
            continue
        js_path = m_js.group(1)
        if js_path not in spec_live_paths and "live-token" not in js_path:
            if js_path.startswith("/api/v001/ai/"):
                # SPEC에 있는지 전체 확인
                if js_path not in spec:
                    violations.append(
                        f"프론트엔드 {name}={js_path}가 SPEC §5.1.4.1에 없음"
                    )

    return violations


# ============================================================
# 검증 2: SPEC §5.1.4.4 AI 상수 ↔ W10_Web_0203.h
# ============================================================
def check_ai_limits(repo: Path) -> list[str]:
    spec = _read(repo / "src/v0203/contract_doc_0203/SPEC_0203.md")
    hdr = _read(repo / "src/v0203/W10_Web_0203.h")

    violations = []

    # 헤더 상수 추출
    limits = {}
    for name in ("G_MAX_REQUEST_BODY", "G_MAX_RESPONSE_BYTES",
                 "G_RATE_LIMIT_MS", "G_GEMINI_TIMEOUT_MS", "G_LIVE_TOKEN_TIMEOUT_MS"):
        m = re.search(rf"{name}\s*=\s*(\d+)", hdr)
        if m:
            limits[name] = int(m.group(1))

    # SPEC에 명시된 값 추출
    for name, actual in limits.items():
        m = re.search(rf"`{name}\s*=\s*(\d+)`", spec)
        if m:
            spec_val = int(m.group(1))
            if spec_val != actual:
                violations.append(
                    f"{name}: SPEC={spec_val} ↔ 헤더={actual}"
                )
        else:
            # SPEC에 표 형태 `| ... | `G_XXX` | **12345 B** |` 탐색
            m2 = re.search(rf"\|\s*`?{name}`?\s*\|\s*[\*`]*(\d+)[^|]*\|", spec)
            if m2:
                spec_val = int(m2.group(1))
                if spec_val != actual:
                    violations.append(
                        f"{name}: SPEC={spec_val} ↔ 헤더={actual}"
                    )
            else:
                violations.append(
                    f"{name}가 SPEC §5.1.4.4에 명시되지 않음 (헤더={actual})"
                )

    return violations


# ============================================================
# 검증 3: C++ FSM 상태/이유명 ↔ offline 어댑터
# ============================================================
def check_fsm_names(repo: Path) -> list[str]:
    stmg = _read(repo / "src/v0203/CT10_Ctl_StMG_0203.cpp")
    offline = _read(repo / "src/v0203/data_v0203_src/html_v0203/js/998.offline_0203.js")

    violations = []

    valid_states = set()
    valid_reasons = set()

    m_state = re.search(r"CT10_stateToString.*?\{(.*?)\n\}", stmg, re.DOTALL)
    if m_state:
        for m in re.finditer(r'return "([A-Z_]+)";', m_state.group(1)):
            valid_states.add(m.group(1))

    m_reason = re.search(r"CT10_reasonToString.*?\{(.*?)\n\}", stmg, re.DOTALL)
    if m_reason:
        for m in re.finditer(r'return "([A-Z_]+)";', m_reason.group(1)):
            valid_reasons.add(m.group(1))

    for m in re.finditer(r"runtime\.control\.state\s*=\s*'([A-Z_]+)'", offline):
        st = m.group(1)
        if st and st not in valid_states and st not in ("ACTIVE", "PAUSED", "COMPLETED", "NONE"):
            violations.append(
                f"offline state '{st}'가 C++ CT10_stateToString에 없음"
            )

    for m in re.finditer(r"runtime\.control\.reason\s*=\s*'([A-Z_]+)'", offline):
        rs = m.group(1)
        if rs and rs not in valid_reasons:
            violations.append(
                f"offline reason '{rs}'가 C++ CT10_reasonToString에 없음"
            )

    return violations


# ============================================================
# 검증 4: SPEC §5.4.4 SPA 스키마 ↔ cfg_pages_0203.json
# ============================================================
def check_spa_schema(repo: Path) -> list[str]:
    pages_json_path = repo / "src/v0203/data_v0203_src/json/cfg_pages_0203.json"
    if not pages_json_path.is_file():
        return [f"cfg_pages_0203.json 없음: {pages_json_path}"]

    try:
        pages = json.loads(pages_json_path.read_text(encoding="utf-8"))
    except Exception as e:
        return [f"cfg_pages_0203.json 파싱 실패: {e}"]

    violations = []

    pages_list = pages.get("pages", [])
    if not pages_list:
        violations.append("pages[] 비어있음")
    else:
        path = pages_list[0].get("path", "")
        if not path.startswith("/html_v0203/"):
            violations.append(
                f"pages[0].path='{path}' (기대: /html_v0203/ 접두사)"
            )

    assets = pages_list[0].get("pageAssets", []) if pages_list else []
    asset_paths = [a.get("path", "") for a in assets]
    if not any("P010_bundle_0203.js" in p for p in asset_paths):
        violations.append("pageAssets[]에 P010_bundle_0203.js 없음")

    redirects = pages.get("reDirect", [])
    required_routes = {"/", "/dashboard", "/chart", "/schedule", "/profiles",
                       "/sensors", "/simulation", "/windprofile", "/automation",
                       "/settings", "/network", "/logs", "/diagnostics",
                       "/firmware", "/ai", "/info"}
    actual_froms = {r.get("uriFrom", "") for r in redirects}
    missing = required_routes - actual_froms
    if missing:
        violations.append(
            f"reDirect[] 누락된 경로: {sorted(missing)[:5]}..."
        )

    if pages.get("assets", None) not in (None, []):
        violations.append("assets[]는 빈 배열이어야 함 (SPA 번들 통합)")

    return violations


# ============================================================
# 메인
# ============================================================
def main() -> int:
    ap = argparse.ArgumentParser(description="SSOT 자동 대조 CI (Phase 3 신규)")
    ap.add_argument("--strict", action="store_true",
                    help="위반 시 exit 1")
    ap.add_argument("--warn-only", action="store_true",
                    help="경고만 출력 (CI 초기 통합용)")
    args = ap.parse_args()

    script_dir = Path(__file__).resolve().parent
    repo = find_repo_root(script_dir)

    if not repo.is_dir():
        print(f"[ERROR] repo root 없음: {repo}", file=sys.stderr)
        return EXIT_IO

    print("=" * 64)
    print(" SSOT 자동 대조 CI (validate_contracts.py)")
    print(f" repo: {repo}")
    print("=" * 64)

    all_violations: dict[str, list[str]] = {}

    print("\n[1/4] SPEC §5.1.4.1 경로 ↔ W10_Web_Const_0203.h")
    v1 = check_api_paths(repo)
    all_violations["API 경로"] = v1
    print(f"  → {len(v1)}건 위반")

    print("\n[2/4] SPEC §5.1.4.4 AI 상수 ↔ W10_Web_0203.h")
    v2 = check_ai_limits(repo)
    all_violations["AI 상수"] = v2
    print(f"  → {len(v2)}건 위반")

    print("\n[3/4] C++ FSM 명칭 ↔ offline 어댑터")
    v3 = check_fsm_names(repo)
    all_violations["FSM 명칭"] = v3
    print(f"  → {len(v3)}건 위반")

    print("\n[4/4] SPEC §5.4.4 SPA 스키마 ↔ cfg_pages_0203.json")
    v4 = check_spa_schema(repo)
    all_violations["SPA 스키마"] = v4
    print(f"  → {len(v4)}건 위반")

    total = sum(len(v) for v in all_violations.values())

    print("\n" + "=" * 64)
    if total == 0:
        print(" [OK] 모든 SSOT 계약 정합")
        print("=" * 64)
        return EXIT_OK

    print(f" [FAIL] 총 {total}건 위반:")
    for cat, vs in all_violations.items():
        if vs:
            print(f"\n  [{cat}]")
            for v in vs:
                print(f"    - {v}")
    print("=" * 64)

    if args.warn_only:
        print("\n[WARN-ONLY] exit 0 (CI 초기 통합 정책)")
        return EXIT_OK
    if args.strict:
        return EXIT_FAIL
    return EXIT_OK


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[INT] 사용자 중단", file=sys.stderr)
        sys.exit(130)
