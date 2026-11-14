#!/usr/bin/env python3
"""
Smart Nature Wind v0201 — SPA Web Staging (그린필드)

기능:
  1. SRC: src/v0200/data_v0201_src/html_v0201/  (개발 원본)
  2. DST: src/v0200/data_v0201/html_v0201/      (배포 스테이징)
  3. JS 번들: html_v0201/*.js (넘버링 정렬) → P010_bundle_0201.js
  4. CSS 번들: html_v0201/_*.css (언더스코어) → P000_common_0201.css
  5. HTML: index.html → P010_main_0201.html 리네임
  6. 모든 텍스트 자산 Level 9 Gzip 사전 압축
  7. PlatformIO SCons hook (buildfs/uploadfs) + CLI 실행 지원
  8. run_staging() 반환값을 SCons hook에서 검사 (실패 시 빌드 중단)

사용:
  python src/v0200/tools_0201/pio_gzip_0201.py
  pio run --target buildfs   (platformio.ini extra_scripts 자동 실행)
"""

from __future__ import annotations

import gzip
import shutil
import sys
from pathlib import Path
from typing import List, Sequence, Set

# Windows 콘솔 UTF-8
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# ============================================================
# 상수 (v0201 그린필드)
# ============================================================
JS_BUNDLE_PATTERN  = "*.js"
JS_BUNDLE_OUTPUT   = "P010_bundle_0201.js"     # 브라우저 캐시 유지 (파일명 유지)

CSS_BUNDLE_PATTERN = "_*.css"
CSS_BUNDLE_OUTPUT  = "P000_common_0201.css"    # 단일 CSS 유지

HTML_SHELL_INPUT   = "index.html"
HTML_SHELL_OUTPUT  = "P010_main_0201.html"     # 서버 라우팅 유지

# Gzip 대상 확장자
GZ_EXTS: Set[str] = {".html", ".css", ".js", ".svg"}
# 단순 복사 (gzip 불필요)
COPY_ONLY_EXTS: Set[str] = {".png", ".jpg", ".webp", ".ico", ".txt",
                            ".json", ".woff", ".woff2"}

# SCons 정확 타겟 매칭
FS_TARGETS_EXACT: Set[str] = {"buildfs", "uploadfs"}


def find_project_root() -> Path:
    cur = Path(__file__).resolve().parent
    while cur != cur.parent:
        if (cur / "platformio.ini").is_file():
            return cur
        cur = cur.parent
    return Path.cwd()


def _log(msg: str) -> None:
    print(f"[pio_gzip_0201] {msg}")


# ============================================================
# 1. JS 번들링 (넘버링 정렬 자동 수집)
# ============================================================
def build_js_bundle(src_dir: Path, dst_dir: Path) -> int:
    files = sorted(src_dir.glob(JS_BUNDLE_PATTERN))
    files = [f for f in files if f.name != JS_BUNDLE_OUTPUT]

    if not files:
        print(f"[ERROR] JS 소스 없음: {src_dir}", file=sys.stderr)
        return 1

    _log(f"[1/4] JS 번들링 ({len(files)} 파일 → {JS_BUNDLE_OUTPUT})")

    parts: List[str] = []
    total_raw = 0
    prev_layer = None

    for f in files:
        content = f.read_text(encoding="utf-8")
        size = len(content.encode("utf-8"))
        total_raw += size

        # 레이어 구분자 (디버그용)
        layer = f.name.split(".")[0][:1] if f.name[0].isdigit() else "?"
        if layer != prev_layer:
            parts.append(f"\n/* ===== LAYER {layer} ===== */\n")
            prev_layer = layer

        parts.append(f"\n/* ---- {f.name} ({size} bytes) ---- */\n")
        parts.append(content)
        parts.append("\n")
        _log(f"  + {f.name:<32} ({size:>7,} B)")

    bundle = "".join(parts)

    # raw + gz
    out_raw = dst_dir / JS_BUNDLE_OUTPUT
    out_gz  = dst_dir / (JS_BUNDLE_OUTPUT + ".gz")
    out_raw.write_text(bundle, encoding="utf-8")

    with gzip.open(out_gz, "wb", compresslevel=9) as f_out:
        f_out.write(bundle.encode("utf-8"))

    gz_size = out_gz.stat().st_size
    ratio = (1.0 - gz_size / total_raw) * 100.0 if total_raw > 0 else 0.0
    _log(f"  ==> bundle: {total_raw:,} B → {gz_size:,} B (gz {ratio:.1f}% 절감)")
    return 0


# ============================================================
# 2. CSS 번들링 (_*.css concat)
# ============================================================
def build_css_bundle(src_dir: Path, dst_dir: Path) -> int:
    files = sorted(src_dir.glob(CSS_BUNDLE_PATTERN))
    if not files:
        _log(f"[2/4] CSS 소스 없음 ({CSS_BUNDLE_PATTERN}) — 스킵")
        return 0

    _log(f"[2/4] CSS 번들링 ({len(files)} 파일 → {CSS_BUNDLE_OUTPUT})")

    parts: List[str] = []
    total_raw = 0

    for f in files:
        content = f.read_text(encoding="utf-8")
        size = len(content.encode("utf-8"))
        total_raw += size
        parts.append(f"\n/* ---- {f.name} ({size} bytes) ---- */\n")
        parts.append(content)
        parts.append("\n")
        _log(f"  + {f.name:<32} ({size:>7,} B)")

    bundle = "".join(parts)

    out_raw = dst_dir / CSS_BUNDLE_OUTPUT
    out_gz  = dst_dir / (CSS_BUNDLE_OUTPUT + ".gz")
    out_raw.write_text(bundle, encoding="utf-8")

    with gzip.open(out_gz, "wb", compresslevel=9) as f_out:
        f_out.write(bundle.encode("utf-8"))

    gz_size = out_gz.stat().st_size
    ratio = (1.0 - gz_size / total_raw) * 100.0 if total_raw > 0 else 0.0
    _log(f"  ==> bundle: {total_raw:,} B → {gz_size:,} B (gz {ratio:.1f}% 절감)")
    return 0


# ============================================================
# 3. HTML Shell 리네임 + gzip
# ============================================================
def process_html_shell(src_dir: Path, dst_dir: Path) -> int:
    src_html = src_dir / HTML_SHELL_INPUT
    if not src_html.is_file():
        _log(f"[3/4] HTML Shell 없음 ({HTML_SHELL_INPUT}) — 스킵")
        return 0

    content = src_html.read_text(encoding="utf-8")
    raw_size = len(content.encode("utf-8"))

    out_raw = dst_dir / HTML_SHELL_OUTPUT
    out_gz  = dst_dir / (HTML_SHELL_OUTPUT + ".gz")
    out_raw.write_text(content, encoding="utf-8")

    with gzip.open(out_gz, "wb", compresslevel=9) as f_out:
        f_out.write(content.encode("utf-8"))

    gz_size = out_gz.stat().st_size
    ratio = (1.0 - gz_size / raw_size) * 100.0 if raw_size > 0 else 0.0
    _log(f"[3/4] HTML Shell: {HTML_SHELL_INPUT} → {HTML_SHELL_OUTPUT} "
         f"({raw_size:,} → {gz_size:,} B, gz {ratio:.1f}% 절감)")
    return 0


# ============================================================
# 4. 기타 자산 복사 + gzip
# ============================================================
def process_other_assets(src_dir: Path, dst_dir: Path) -> int:
    _log("[4/4] 기타 자산 처리")

    # 이미 처리한 파일명 (JS/CSS/HTML 번들 결과물 + HTML shell 원본)
    handled = {JS_BUNDLE_OUTPUT, CSS_BUNDLE_OUTPUT, HTML_SHELL_INPUT, HTML_SHELL_OUTPUT}

    count = 0
    for item in sorted(src_dir.rglob("*")):
        if not item.is_file():
            continue
        rel = item.relative_to(src_dir)

        # 번들 소스는 이미 concat 됨
        if rel.name in handled: continue
        if rel.suffix == ".js":  continue     # 개별 JS 배포 제외 (bundle만)
        if rel.name.startswith("_") and rel.suffix == ".css": continue  # _*.css 소스 제외

        ext = item.suffix.lower()
        dst_raw = dst_dir / rel
        dst_raw.parent.mkdir(parents=True, exist_ok=True)

        if ext in GZ_EXTS:
            shutil.copy2(item, dst_raw)
            dst_gz = dst_dir / (str(rel) + ".gz")
            raw_data = item.read_bytes()
            with gzip.open(dst_gz, "wb", compresslevel=9) as f_out:
                f_out.write(raw_data)
            _log(f"  [GZ] {str(rel):<32} {len(raw_data):>7,} B → {dst_gz.stat().st_size:>7,} B")
            count += 1
        elif ext in COPY_ONLY_EXTS:
            shutil.copy2(item, dst_raw)
            _log(f"  [CP] {str(rel):<32} {item.stat().st_size:>7,} B")
            count += 1

    _log(f"  기타 자산: {count} 파일")
    return 0


# ============================================================
# 메인 스테이징
# ============================================================
def run_staging(project_root: Path) -> int:
    src_dir = project_root / "src" / "v0200" / "data_v0201_src" / "html_v0201"
    dst_dir = project_root / "src" / "v0200" / "data_v0201" / "html_v0201"

    if not src_dir.is_dir():
        print(f"[ERROR] Source dir 없음: {src_dir}", file=sys.stderr)
        return 1

    dst_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 64)
    _log("Smart Nature Wind v0201 — SPA Web Staging")
    print(f"  SRC: {src_dir}")
    print(f"  DST: {dst_dir}")
    print("=" * 64)

    rc = 0
    rc |= build_js_bundle(src_dir, dst_dir)
    rc |= build_css_bundle(src_dir, dst_dir)
    rc |= process_html_shell(src_dir, dst_dir)
    rc |= process_other_assets(src_dir, dst_dir)

    if rc == 0:
        print("=" * 64)
        _log("[OK] Staging 완료")
        print("=" * 64)
    return rc


# ============================================================
# SCons Hook + CLI 진입점
# ============================================================
try:
    Import("env")  # type: ignore
    from SCons.Script import COMMAND_LINE_TARGETS  # type: ignore
    is_scons = True
except Exception:
    is_scons = False

if is_scons:
    _targets = {t.lower() for t in COMMAND_LINE_TARGETS}
    _is_fs_target = bool(_targets & FS_TARGETS_EXACT)

    if _is_fs_target:
        _proj = Path(env["PROJECT_DIR"])  # type: ignore
        _rc = run_staging(_proj)
        if _rc != 0:
            print(f"[pio_gzip_0201] staging 실패 (exit={_rc})", file=sys.stderr)
            sys.exit(_rc)
    # 일반 펌웨어 빌드 시 스킵
elif __name__ == "__main__":
    sys.exit(run_staging(find_project_root()))
    
