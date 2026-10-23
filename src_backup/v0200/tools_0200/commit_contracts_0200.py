#!/usr/bin/env python3
"""
src/v0200/contract_doc_0200 커밋 스크립트 (Python 3.7+ 크로스 플랫폼)

기능:
  1. git 저장소 루트 자동 감지 (git rev-parse --show-toplevel)
  2. 필수 문서 존재 검증 (--strict 시 선택 문서도 필수화)
  3. staging 후 단일 커밋
  4. 커밋 후 요약 출력 (author/date, 다음 push 명령)

사용:
  python src/v0200/tools_0200/commit_contracts_0200.py
  python src/v0200/tools_0200/commit_contracts_0200.py -m "docs(contracts): 계약 문서 갱신"
  python src/v0200/tools_0200/commit_contracts_0200.py --dry-run
  python src/v0200/tools_0200/commit_contracts_0200.py --dry-run --strict  # CI gate

지원 OS: Windows / macOS / Linux
인코딩 : UTF-8 강제 (Windows cp949 회피)
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Sequence, Tuple

# ============================================================
# 상수
# ============================================================
REQUIRED_FILES: Tuple[str, ...] = (
    "src/v0200/contract_doc_0200/README_0200.md",
    "src/v0200/contract_doc_0200/SPEC_0200.md",
    "src/v0200/contract_doc_0200/CONTRACT_0200.md",
    "src/v0200/contract_doc_0200/STATE_0200.md",
    "src/v0200/contract_doc_0200/FLOW_0200.md",
    "src/v0200/contract_doc_0200/BUDGET_0200.md",
    "src/v0200/contract_doc_0200/TEST_PLAN_0200.md",
)

# 선택 문서 (--strict 시 필수화)
#  - 현재 빈 튜플: Ref/UI_TERMINOLOGY_0200.md 는 향후 프론트엔드 정리 시 작성 예정
#  - 파일 실제 작성 후 아래 형태로 등록하면 --strict gate가 자동 활성화됨:
#      OPTIONAL_FILES = (
#          "src/v0200/contract_doc_0200/Ref/UI_TERMINOLOGY_0200.md",
#      )
OPTIONAL_FILES: Tuple[str, ...] = ()

DEFAULT_MSG = "src/v0200/contract_doc_0200: 계약 문서 갱신"
CONTRACTS_REL = "src/v0200/contract_doc_0200"

EXIT_OK      = 0
EXIT_MISSING = 1
EXIT_GIT     = 2
EXIT_INT     = 130

# Windows 콘솔 UTF-8 출력 보장
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# ============================================================
# 헬퍼
# ============================================================
def _run(cmd: Sequence[str], cwd: Path, check: bool = True) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    return subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=check,
        env=env,
    )


def _err(msg: str) -> None:
    print(f"[ERROR] {msg}", file=sys.stderr)


def _info(msg: str = "") -> None:
    print(msg)


def find_repo_root(start: Path) -> Path:
    try:
        res = _run(["git", "rev-parse", "--show-toplevel"], cwd=start, check=True)
    except FileNotFoundError:
        _err("git 실행 파일을 찾을 수 없습니다. Git 설치 및 PATH 확인.")
        sys.exit(EXIT_GIT)
    except subprocess.CalledProcessError as e:
        _err("git 저장소 루트를 찾을 수 없습니다 (not a git repository).")
        if e.stderr:
            print(e.stderr.strip(), file=sys.stderr)
        sys.exit(EXIT_GIT)

    root = res.stdout.strip()
    if not root:
        _err("git 저장소 루트를 찾을 수 없습니다 (empty output).")
        sys.exit(EXIT_GIT)
    return Path(root)


def verify_required_files(repo_root: Path, strict: bool) -> None:
    """필수 계약 문서 존재 확인. --strict 시 선택 문서도 필수."""
    missing: List[str] = [rel for rel in REQUIRED_FILES if not (repo_root / rel).is_file()]
    if missing:
        _err("필수 문서 누락:")
        for m in missing:
            print(f"  - {m}", file=sys.stderr)
        sys.exit(EXIT_MISSING)

    # 선택 문서 검증 (OPTIONAL_FILES가 빈 튜플이면 자연히 통과)
    opt_missing = [rel for rel in OPTIONAL_FILES if not (repo_root / rel).is_file()]
    if opt_missing:
        if strict:
            _err("--strict: 선택 문서 누락:")
            for m in opt_missing:
                print(f"  - {m}", file=sys.stderr)
            sys.exit(EXIT_MISSING)
        else:
            for m in opt_missing:
                print(f"[WARN] 선택 문서 없음 (--strict 시 실패): {m}", file=sys.stderr)


# ============================================================
# main
# ============================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="src/v0200/contract_doc_0200 커밋 스크립트 (Python 크로스 플랫폼)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "예시:\n"
            "  python src/v0200/tools_0200/commit_contracts_0200.py\n"
            "  python src/v0200/tools_0200/commit_contracts_0200.py -m 'docs(contracts): 계약 문서 갱신'\n"
            "  python src/v0200/tools_0200/commit_contracts_0200.py --dry-run\n"
            "  python src/v0200/tools_0200/commit_contracts_0200.py --dry-run --strict  # CI gate\n"
        ),
    )
    parser.add_argument(
        "-m", "--message",
        default=DEFAULT_MSG,
        help="커밋 메시지 (기본값: 'src/v0200/contract_doc_0200: 계약 문서 갱신')",
    )
    parser.add_argument(
        "-n", "--dry-run",
        action="store_true",
        help="실제 커밋 없이 검증만 수행",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="선택 문서(OPTIONAL_FILES 등록 시)도 필수로 검증 (CI gate)",
    )
    args = parser.parse_args()

    # ---- 저장소 루트 감지 -----------------------------------
    script_dir = Path(__file__).resolve().parent
    repo_root  = find_repo_root(script_dir)
    verify_required_files(repo_root, args.strict)

    # ---- 헤더 요약 -----------------------------------------
    _info("=" * 60)
    _info(f" 커밋 대상: {CONTRACTS_REL}/")
    _info(f" 저장소   : {repo_root}")
    _info(f" 메시지   : {args.message}")
    if args.dry_run:
        _info(" 모드     : DRY-RUN (실제 커밋 없음)")
    if args.strict:
        _info(" 모드     : STRICT (선택 문서 필수)")
    _info("=" * 60)

    # ---- [1/4] 변경 사항 확인 ------------------------------
    _info()
    _info("[1/4] 변경 사항 확인")
    status = _run(["git", "status", "--short", CONTRACTS_REL], cwd=repo_root, check=True)
    if status.stdout.strip():
        print(status.stdout, end="")
    else:
        _info("  (변경 사항 없음)")

    if args.dry_run:
        _info()
        _info("[DRY-RUN] 검증 완료. git add / commit 생략")
        return EXIT_OK

    # ---- [2/4] staging -------------------------------------
    _info()
    _info("[2/4] staging")
    try:
        _run(["git", "add", CONTRACTS_REL], cwd=repo_root, check=True)
    except subprocess.CalledProcessError as e:
        _err("git add 실패")
        if e.stderr:
            print(e.stderr.strip(), file=sys.stderr)
        return EXIT_GIT

    # ---- [3/4] staged 파일 목록 ----------------------------
    staged = _run(
        ["git", "diff", "--cached", "--name-only", "--", CONTRACTS_REL],
        cwd=repo_root, check=True,
    ).stdout.strip()

    if not staged:
        _info()
        _info("[INFO] staging된 변경 사항이 없습니다. 커밋을 생략합니다.")
        return EXIT_OK

    _info()
    _info("[3/4] staged 파일:")
    for line in staged.splitlines():
        _info(f"  + {line}")

    # ---- [4/4] 커밋 ----------------------------------------
    _info()
    _info("[4/4] 커밋")
    commit = _run(["git", "commit", "-m", args.message], cwd=repo_root, check=False)
    if commit.stdout:
        print(commit.stdout, end="")
    if commit.stderr:
        print(commit.stderr, end="", file=sys.stderr)

    if commit.returncode != 0:
        _err("커밋 실패 (returncode != 0)")
        return EXIT_GIT

    # ---- 요약 ----------------------------------------------
    _info()
    _info("=" * 60)
    _info(" ✅ 커밋 완료")
    _info("=" * 60)

    summary = _run(
        ["git", "log", "-1", "--pretty=format:%h %s%nauthor: %an <%ae>%ndate  : %ad",
         "--date=iso"],
        cwd=repo_root, check=True,
    ).stdout
    if summary:
        print(summary)
    _info()

    branch = _run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=repo_root, check=True,
    ).stdout.strip()
    _info(" 다음 단계:")
    _info(f"   git push origin {branch}")

    return EXIT_OK


# ============================================================
# entrypoint
# ============================================================
if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        _err("사용자 중단")
        sys.exit(EXIT_INT)
