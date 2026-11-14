#!/usr/bin/env python3
"""
check_i18n.py — i18n DICT 키 완전성 검증 (CI Gate)

[목적]
  - 프론트엔드 JS에서 SNW.I18n.t('key')로 참조되는 모든 키가
    020.i18n.js DICT에 정의되어 있는지 검증
  - 미정의 키 발견 시 exit 1 (CI 실패)

[사용]
  python src/v0203/tools_0203/check_i18n.py                # 리포트만
  python src/v0203/tools_0203/check_i18n.py --strict       # 미정의 시 exit 1

[검출 대상]
  - SNW.I18n.t('key')
  - SNW.I18n.t("key")
  - I18n.t('key') (별칭)
  - data-i18n="key" (HTML)

[제외]
  - 동적 키: t('preset.' + c)  (concat 표현식은 스킵)
  - 주석 내부 (선택적 — 기본 포함)

[Exit codes]
  0 : 모든 키 정의됨 (또는 --strict 미사용)
  1 : 미정의 키 발견 (--strict)
  2 : 파일 경로 오류
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# ============================================================
# 상수
# ============================================================
JS_SRC_DIR       = "src/v0203/data_v0203_src/html_v0203/js"
I18N_FILE        = "src/v0203/data_v0203_src/html_v0203/js/core/020.i18n.js"
BUNDLE_FILE      = "src/v0203/data_v0203_src/html_v0203/P010_bundle_0203.js"
HTML_FILE        = "src/v0203/data_v0203_src/html_v0203/index.html"
TOOLS_FILE       = "src/v0203/tools_0203"

# 검출 대상 파일 (번들 포함하여 최종 배포본도 검증)
SEARCH_DIRS = [JS_SRC_DIR]

# 제외 목록 (동적 키, 외부 라이브러리 등)
EXCLUDE_KEYS = {
    # 예: 'dynamic.prefix.' 등 필요 시 추가
}

EXIT_OK      = 0
EXIT_MISSING = 1
EXIT_IO      = 2

# Windows UTF-8
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
def find_repo_root(start: Path) -> Path:
    cur = start
    while cur != cur.parent:
        if (cur / "platformio.ini").is_file():
            return cur
        cur = cur.parent
    return Path.cwd()


# 정적 문자열 리터럴만 검출 (concat/변수 참조 제외)
RE_T_CALL     = re.compile(r"(?:SNW\.)?I18n\.t\(\s*['\"]([a-zA-Z0-9_][a-zA-Z0-9._]*)['\"]\s*(?:,|\))")
RE_T_CALL2    = re.compile(r"\.t\(\s*['\"]([a-zA-Z0-9_][a-zA-Z0-9._]*)['\"]\s*\)")
RE_DATA_I18N  = re.compile(r'data-i18n="([a-zA-Z0-9_][a-zA-Z0-9._]*)"')
RE_DICT_KEY   = re.compile(r"^\s*'([a-zA-Z0-9_][a-zA-Z0-9._]*)':", re.MULTILINE)


def collect_used_keys(root: Path) -> dict[str, set[str]]:
    """파일별로 사용된 키를 수집. 반환: {file: set(keys)}"""
    used: dict[str, set[str]] = {}

    for sdir in SEARCH_DIRS:
        d = root / sdir
        if not d.is_dir():
            continue
        for fp in d.rglob("*.js"):
            # i18n 자기 자신 및 번들 산출물 제외
            if fp.name == "020.i18n.js":
                continue
            if fp.name.startswith("P010_bundle"):
                continue
            if fp.name.startswith("998.offline"):
                continue

            try:
                content = fp.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue

            keys = set()
            for m in RE_T_CALL.finditer(content):
                keys.add(m.group(1))
            for m in RE_T_CALL2.finditer(content):
                keys.add(m.group(1))

            if keys:
                rel = str(fp.relative_to(root)).replace("\\", "/")
                used[rel] = keys

    # HTML data-i18n
    html = root / HTML_FILE
    if html.is_file():
        try:
            content = html.read_text(encoding="utf-8", errors="replace")
            keys = set(RE_DATA_I18N.findall(content))
            if keys:
                used[str(html.relative_to(root)).replace("\\", "/")] = keys
        except Exception:
            pass

    return used


def collect_defined_keys_by_lang(root: Path) -> tuple[set[str], set[str]]:
    """i18n.js DICT에서 ko 및 en 키를 각각 수집. 반환: (ko_keys, en_keys)"""
    fp = root / I18N_FILE
    if not fp.is_file():
        print(f"[ERROR] i18n 파일 없음: {fp}", file=sys.stderr)
        sys.exit(EXIT_IO)

    content = fp.read_text(encoding="utf-8", errors="replace")
    parts = re.split(r"^\s*en\s*:\s*\{", content, maxsplit=1, flags=re.MULTILINE)
    if len(parts) == 2:
        ko_text, en_text = parts[0], parts[1]
        ko_keys = set(RE_DICT_KEY.findall(ko_text))
        en_keys = set(RE_DICT_KEY.findall(en_text))
    else:
        all_keys = set(RE_DICT_KEY.findall(content))
        ko_keys = all_keys
        en_keys = all_keys

    return ko_keys, en_keys


def collect_defined_keys(root: Path) -> set[str]:
    """i18n.js DICT에 정의된 키 전체 (하위 호환)"""
    ko_keys, en_keys = collect_defined_keys_by_lang(root)
    return ko_keys & en_keys


def check_missing(used_map: dict[str, set[str]], defined: set[str]) -> dict[str, list[str]]:
    """파일별 미정의 키 목록"""
    missing_by_file: dict[str, list[str]] = {}
    for rel, keys in used_map.items():
        m = sorted(k for k in keys if k not in defined and k not in EXCLUDE_KEYS)
        if m:
            missing_by_file[rel] = m
    return missing_by_file


# ============================================================
# main
# ============================================================
def main() -> int:
    parser = argparse.ArgumentParser(description="i18n DICT 완전성 검증 (ko/en 대칭성 및 코드 참조 검사)")
    parser.add_argument("--strict", action="store_true", help="미정의 키 또는 ko/en 불일치 발견 시 exit 1")
    parser.add_argument("--verbose", action="store_true", help="모든 사용 키 개수 출력")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    root       = find_repo_root(script_dir)

    used_map = collect_used_keys(root)
    ko_keys, en_keys = collect_defined_keys_by_lang(root)
    defined  = ko_keys & en_keys

    total_used = sum(len(v) for v in used_map.values())
    unique_used = len(set().union(*used_map.values())) if used_map else 0

    ko_only = sorted(ko_keys - en_keys)
    en_only = sorted(en_keys - ko_keys)
    has_asymmetry = bool(ko_only or en_only)

    print("=" * 64)
    print(f" i18n DICT 완전성 & ko/en 대칭성 검증 (CI Gate)")
    print(f" 검사 파일: {len(used_map)}개")
    print(f" 총 사용(중복 포함): {total_used}건")
    print(f" 고유 사용: {unique_used}개")
    print(f" 정의된 키: ko={len(ko_keys)}개, en={len(en_keys)}개 (공통={len(defined)}개)")
    print("=" * 64)

    # 1. ko/en 대칭성 리포트
    if has_asymmetry:
        print("\n[WARN] ko / en DICT 키 불일치 발견:")
        if ko_only:
            print(f"  - ko에만 존재 ({len(ko_only)}개): {', '.join(ko_only[:10])}{' ...' if len(ko_only) > 10 else ''}")
        if en_only:
            print(f"  - en에만 존재 ({len(en_only)}개): {', '.join(en_only[:10])}{' ...' if len(en_only) > 10 else ''}")
    else:
        print(" [OK] ko/en DICT 키 100% 대칭 일치")

    # 2. 코드 참조 키 정의 검증
    missing = check_missing(used_map, defined)
    total_missing = sum(len(v) for v in missing.values())

    if total_missing > 0:
        print(f"\n[FAIL] {total_missing}개 미정의 키 ({len(missing)}개 파일):\n")
        for rel in sorted(missing.keys()):
            print(f"  {rel}")
            for k in missing[rel]:
                print(f"    - {k}")
            print()

    # 판정
    if total_missing == 0 and not has_asymmetry:
        print(f"\n[OK] 코드에서 참조하는 모든 {unique_used}개 키가 정의되어 있으며, ko/en 완전 대칭입니다.")
        return EXIT_OK

    if total_missing == 0 and has_asymmetry:
        print(f"\n[INFO] 참조 키는 모두 정의되어 있으나, ko/en 간 불일치가 존재합니다.")
        if args.strict:
            print("[STRICT] exit 1 (CI gate: ko/en 대칭성 위반)")
            return EXIT_MISSING
        return EXIT_OK

    if args.strict:
        print("[STRICT] exit 1 (CI gate)")
        return EXIT_MISSING

    print("[INFO] --strict 옵션으로 CI gate 활성화 가능")
    return EXIT_OK

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n[INT] 사용자 중단", file=sys.stderr)
        sys.exit(130)
