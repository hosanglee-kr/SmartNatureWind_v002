#!/usr/bin/env python3
"""
Smart Nature Wind v0202 — SPA Web Staging + Offline Zip (최종 완성본)

[경로 정책]
  - HTML/JS/CSS 원본 : src/v0202/data_v0202_src/html_v0202/ (하위 폴더 구조 지원)
      ├── index.html
      ├── css/ (개별 CSS)
      └── js/
          ├── core/ (기반/유틸/서비스)
          ├── app/  (페이지/부트스트랩)
          └── 998.offline_0202.js (오프라인 어댑터 - 로컬 검증용, 배포 제외)
  - JSON 원본 : src/v0202/data_v0202_src/json/
  - 배포 스테이징 : src/v0202/data_v0202/
  - 오프라인 zip : <project>/dist/

[파이프라인 (6단계)]
  [1/6] JS 번들       : **/*.js (번호순 정렬, 번들 제외 파일 필터링) → P010_bundle_0202.js (+ .gz)
  [2/6] CSS 번들      : **/_*.css (번호순 정렬) → P000_common_0202.css (+ .gz)
  [3/6] HTML Shell    : index.html → index.html (+ .gz)
  [4/6] 기타 자산     : 이미지/폰트 등 복사. (998.offline_0202.js는 배포 제외)
  [5/6] JSON 복사     : data_v0202_src/json/*.json → data_v0202/json/*.json
  [6/6] 오프라인 zip  : data_v0202/ 전체 압축

[특이사항]
  - 번들 결과물(JS, CSS)을 배포 폴더와 소스 폴더 양쪽에 모두 복사하여
    소스 폴더에서 Live Server 등으로 즉시 UI 검증이 가능하도록 지원.
  - HTML 파일명은 배포 환경에서도 index.html로 유지.
  - 오프라인 어댑터(998.offline_0202.js)는 로컬 검증용으로만 소스에 두고 배포 폴더에는 복사하지 않음.

실행:
  # PlatformIO 훅
  pio run --target buildfs      # 스테이징 + zip 생성
  pio run --target uploadfs     # 스테이징 + zip 생성 + 업로드

  # CLI
  python src/v0202/tools_0202/pio_gzip_0202.py              # 스테이징 + zip
  python src/v0202/tools_0202/pio_gzip_0202.py --no-zip     # 스테이징만
  python src/v0202/tools_0202/pio_gzip_0202.py --no-gz      # zip에서 .gz 제외
  python src/v0202/tools_0202/pio_gzip_0202.py --zip-only   # 스테이징 스킵, zip만
"""

from __future__ import annotations

import argparse
import gzip
import shutil
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List, Set

# Windows 콘솔 UTF-8 강제 설정
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


# ============================================================
# 상수 (v0202)
# ============================================================
JS_BUNDLE_OUTPUT   = "P010_bundle_0202.js"
CSS_BUNDLE_OUTPUT  = "P000_common_0202.css"

HTML_SHELL_INPUT   = "index.html"
HTML_SHELL_OUTPUT  = "index.html"  # 배포 시에도 index.html 유지

# 번들에서 제외할 JS 파일 (배포 폴더 복사도 제외됨)
JS_BUNDLE_EXCLUDES: Set[str] = {
    "998.offline_0202.js",     # 오프라인 어댑터 (로컬 검증용, ESP32 배포 제외)
    "P010_bundle_0202_old.js", # 백업 파일
}

# Gzip 압축 대상 확장자
GZ_EXTS: Set[str] = {".html", ".css", ".js", ".svg"}
# 단순 복사 대상 확장자
COPY_ONLY_EXTS: Set[str] = {".png", ".jpg", ".webp", ".ico", ".txt", ".json", ".woff", ".woff2"}

JSON_SRC_SUBDIR = "json"
JSON_DST_SUBDIR = "json"

FS_TARGETS_EXACT: Set[str] = {"buildfs", "uploadfs"}


# ============================================================
# 유틸
# ============================================================
def find_project_root() -> Path:
    cur = Path(__file__).resolve().parent
    while cur != cur.parent:
        if (cur / "platformio.ini").is_file():
            return cur
        cur = cur.parent
    return Path.cwd()

def _log(msg: str, tag: str = "") -> None:
    prefix = f"[pio_gzip_0202{'/' + tag if tag else ''}]"
    print(f"{prefix} {msg}")


# ============================================================
# [1/6] JS 번들링
# ============================================================
def build_js_bundle(src_dir: Path, dst_dir: Path) -> int:
    # 하위 폴더의 모든 .js 파일 검색
    files = list(src_dir.glob("**/*.js"))
    
    # 번들 결과물과 제외 대상 필터링
    files = [f for f in files 
             if f.name != JS_BUNDLE_OUTPUT and f.name not in JS_BUNDLE_EXCLUDES]
    
    # [핵심] 파일명(000~999) 기준 정렬로 로드 순서 보장
    files = sorted(files, key=lambda f: f.name)

    if not files:
        print(f"[ERROR] JS 소스 없음: {src_dir}", file=sys.stderr)
        return 1

    _log(f"[1/6] JS 번들링 ({len(files)} 파일 → {JS_BUNDLE_OUTPUT})", tag="js")
    
    parts: List[str] = []
    total_raw = 0
    prev_layer = None

    for f in files:
        content = f.read_text(encoding="utf-8")
        size = len(content.encode("utf-8"))
        total_raw += size

        layer = f.name.split(".")[0][:1] if f.name[0].isdigit() else "?"
        if layer != prev_layer:
            parts.append(f"\n/* ===== LAYER {layer} ===== */\n")
            prev_layer = layer

        parts.append(f"\n/* ---- {f.name} ({size} bytes) ---- */\n")
        parts.append(content)
        parts.append("\n")
        _log(f"  + {f.name:<32} ({size:>7,} B)", tag="js")

    bundle = "".join(parts)

    out_raw = dst_dir / JS_BUNDLE_OUTPUT
    out_gz  = dst_dir / (JS_BUNDLE_OUTPUT + ".gz")
    out_raw.write_text(bundle, encoding="utf-8")

    with gzip.open(out_gz, "wb", compresslevel=9) as f_out:
        f_out.write(bundle.encode("utf-8"))

    # [신규] 소스 폴더에도 복사 (로컬 UI 검증용)
    shutil.copy2(out_raw, src_dir / JS_BUNDLE_OUTPUT)
    shutil.copy2(out_gz,  src_dir / (JS_BUNDLE_OUTPUT + ".gz"))

    gz_size = out_gz.stat().st_size
    ratio = (1.0 - gz_size / total_raw) * 100.0 if total_raw > 0 else 0.0
    _log(f"  ==> bundle: {total_raw:,} B → {gz_size:,} B (gz {ratio:.1f}% 절감)", tag="js")
    return 0


# ============================================================
# [2/6] CSS 번들링
# ============================================================
def build_css_bundle(src_dir: Path, dst_dir: Path) -> int:
    # 하위 폴더의 모든 _*.css 파일 검색
    files = list(src_dir.glob("**/_*.css"))
    
    if not files:
        _log(f"[2/6] CSS 소스 없음 — 스킵", tag="css")
        return 0
    
    files = sorted(files, key=lambda f: f.name)
    
    _log(f"[2/6] CSS 번들링 ({len(files)} 파일 → {CSS_BUNDLE_OUTPUT})", tag="css")

    parts: List[str] = []
    total_raw = 0

    for f in files:
        content = f.read_text(encoding="utf-8")
        size = len(content.encode("utf-8"))
        total_raw += size
        parts.append(f"\n/* ---- {f.name} ({size} bytes) ---- */\n")
        parts.append(content)
        parts.append("\n")
        _log(f"  + {f.name:<32} ({size:>7,} B)", tag="css")

    bundle = "".join(parts)

    out_raw = dst_dir / CSS_BUNDLE_OUTPUT
    out_gz  = dst_dir / (CSS_BUNDLE_OUTPUT + ".gz")
    out_raw.write_text(bundle, encoding="utf-8")

    with gzip.open(out_gz, "wb", compresslevel=9) as f_out:
        f_out.write(bundle.encode("utf-8"))

    # [신규] 소스 폴더에도 복사 (로컬 UI 검증용)
    shutil.copy2(out_raw, src_dir / CSS_BUNDLE_OUTPUT)
    shutil.copy2(out_gz,  src_dir / (CSS_BUNDLE_OUTPUT + ".gz"))

    gz_size = out_gz.stat().st_size
    ratio = (1.0 - gz_size / total_raw) * 100.0 if total_raw > 0 else 0.0
    _log(f"  ==> bundle: {total_raw:,} B → {gz_size:,} B (gz {ratio:.1f}% 절감)", tag="css")
    return 0


# ============================================================
# [3/6] HTML Shell
# ============================================================
def process_html_shell(src_dir: Path, dst_dir: Path) -> int:
    src_html = src_dir / HTML_SHELL_INPUT
    if not src_html.is_file():
        _log(f"[3/6] HTML Shell 없음 ({HTML_SHELL_INPUT}) — 스킵", tag="html")
        return 0

    content = src_html.read_text(encoding="utf-8")
    raw_size = len(content.encode("utf-8"))

    out_raw = dst_dir / HTML_SHELL_OUTPUT
    out_gz  = dst_dir / (HTML_SHELL_OUTPUT + ".gz")
    out_raw.write_text(content, encoding="utf-8")

    with gzip.open(out_gz, "wb", compresslevel=9) as f_out:
        f_out.write(content.encode("utf-8"))

    # [신규] 소스 폴더에도 복사 (로컬 UI 검증용, 소스는 이미 존재하지만 일관성 유지)
    shutil.copy2(out_raw, src_dir / HTML_SHELL_OUTPUT)
    shutil.copy2(out_gz,  src_dir / (HTML_SHELL_OUTPUT + ".gz"))

    gz_size = out_gz.stat().st_size
    ratio = (1.0 - gz_size / raw_size) * 100.0 if raw_size > 0 else 0.0
    _log(f"[3/6] HTML Shell: {HTML_SHELL_INPUT} → {HTML_SHELL_OUTPUT} "
         f"({raw_size:,} → {gz_size:,} B, gz {ratio:.1f}% 절감)", tag="html")
    return 0


# ============================================================
# [4/6] 기타 자산
# ============================================================
def process_other_assets(src_dir: Path, dst_dir: Path) -> int:
    _log("[4/6] 기타 자산 처리", tag="assets")

    handled = {JS_BUNDLE_OUTPUT, CSS_BUNDLE_OUTPUT, HTML_SHELL_INPUT, HTML_SHELL_OUTPUT}

    count = 0
    for item in sorted(src_dir.rglob("*")):
        if not item.is_file():
            continue
        rel = item.relative_to(src_dir)

        if rel.name in handled: continue
        
        # [핵심 수정] 번들 제외 파일(998.offline_0202.js 등)은 배포 폴더로 복사하지 않고 스킵
        # (소스 폴더에는 원본이 있으므로 로컬 UI 검증에는 문제 없음)
        if rel.name in JS_BUNDLE_EXCLUDES:
            _log(f"  [SKIP] {str(rel):<32} (배포 제외 대상)", tag="assets")
            continue

        if rel.suffix == ".js":  continue
        if rel.name.startswith("_") and rel.suffix == ".css": continue

        ext = item.suffix.lower()
        dst_raw = dst_dir / rel
        dst_raw.parent.mkdir(parents=True, exist_ok=True)

        if ext in GZ_EXTS:
            shutil.copy2(item, dst_raw)
            dst_gz = dst_dir / (str(rel) + ".gz")
            raw_data = item.read_bytes()
            with gzip.open(dst_gz, "wb", compresslevel=9) as f_out:
                f_out.write(raw_data)
            _log(f"  [GZ] {str(rel):<32} {len(raw_data):>7,} B → {dst_gz.stat().st_size:>7,} B", tag="assets")
            count += 1
        elif ext in COPY_ONLY_EXTS:
            shutil.copy2(item, dst_raw)
            _log(f"  [CP] {str(rel):<32} {item.stat().st_size:>7,} B", tag="assets")
            count += 1

    _log(f"  기타 자산: {count} 파일", tag="assets")
    return 0


# ============================================================
# [5/6] JSON 원본 복사
# ============================================================
def copy_json_assets(project_root: Path) -> int:
    src_dir = project_root / "src" / "v0202" / "data_v0202_src" / JSON_SRC_SUBDIR
    dst_dir = project_root / "src" / "v0202" / "data_v0202" / JSON_DST_SUBDIR

    _log("[5/6] JSON 파일 복사", tag="json")

    if not src_dir.is_dir():
        _log(f"  JSON 원본 없음 ({src_dir}) — 스킵", tag="json")
        return 0

    dst_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    total = 0
    for f in sorted(src_dir.glob("*.json")):
        dst = dst_dir / f.name
        shutil.copy2(f, dst)
        sz = f.stat().st_size
        total += sz
        _log(f"  [JSON] {f.name:<36} {sz:>7,} B", tag="json")
        count += 1

    _log(f"  JSON 총 {count} 파일, {total:,} B 복사 완료", tag="json")
    return 0


# ============================================================
# [6/6] 오프라인 zip
# ============================================================
def build_offline_zip(project_root: Path, include_gz: bool = True) -> int:
    stage_dir = project_root / "src" / "v0202" / "data_v0202"
    if not stage_dir.is_dir():
        print(f"[ERROR] 스테이징 없음: {stage_dir}", file=sys.stderr)
        return 1

    # 필수 파일 검증 (index.html로 변경됨)
    required = [
        stage_dir / "html_v0202" / HTML_SHELL_OUTPUT,
        stage_dir / "html_v0202" / CSS_BUNDLE_OUTPUT,
        stage_dir / "html_v0202" / JS_BUNDLE_OUTPUT,
        stage_dir / "json" / "10_cfg_jsonFile.json",
        stage_dir / "json" / "cfg_system_0202.json",
    ]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        print("[ERROR] 필수 파일 누락:", file=sys.stderr)
        for m in missing:
            print(f"  - {m}", file=sys.stderr)
        print("  → 먼저 staging을 완료하세요", file=sys.stderr)
        return 1

    out_dir = project_root / "dist"
    out_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    suffix = "gz" if include_gz else "raw"
    out_zip = out_dir / f"smart_nature_wind_offline_v0202_{suffix}_{ts}.zip"

    files: List[Path] = []
    for p in stage_dir.rglob("*"):
        if not p.is_file():
            continue
        if not include_gz and p.suffix == ".gz":
            continue
        files.append(p)

    _log(f"[6/6] 오프라인 zip ({len(files)} 파일 → {out_zip.name})", tag="zip")

    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for f in sorted(files):
            rel = f.relative_to(stage_dir)
            zf.write(f, arcname=str(rel).replace("\\", "/"))

    size = out_zip.stat().st_size
    _log(f"  ==> {out_zip} ({size:,} B)", tag="zip")
    return 0


# ============================================================
# 메인 스테이징
# ============================================================
def run_staging(
    project_root: Path,
    make_zip: bool = True,
    include_gz: bool = True,
    skip_stage: bool = False,
) -> int:
    html_src = project_root / "src" / "v0202" / "data_v0202_src" / "html_v0202"
    html_dst = project_root / "src" / "v0202" / "data_v0202" / "html_v0202"

    if not skip_stage and not html_src.is_dir():
        print(f"[ERROR] HTML Source dir 없음: {html_src}", file=sys.stderr)
        return 1

    if not skip_stage:
        html_dst.mkdir(parents=True, exist_ok=True)

    print("=" * 64)
    _log("Smart Nature Wind v0202 — SPA Web Staging + Offline Zip")
    if not skip_stage:
        print(f"  HTML SRC: {html_src}")
        print(f"  HTML DST: {html_dst}")
        print(f"  JSON SRC: {project_root / 'src/v0202/data_v0202_src/json'}")
        print(f"  JSON DST: {project_root / 'src/v0202/data_v0202/json'}")
    if make_zip:
        print(f"  ZIP DST : {project_root / 'dist'}")
    print("=" * 64)

    rc = 0
    if not skip_stage:
        rc |= build_js_bundle(html_src, html_dst)
        rc |= build_css_bundle(html_src, html_dst)
        rc |= process_html_shell(html_src, html_dst)
        rc |= process_other_assets(html_src, html_dst)
        rc |= copy_json_assets(project_root)

    if make_zip and rc == 0:
        rc |= build_offline_zip(project_root, include_gz=include_gz)

    if rc == 0:
        print("=" * 64)
        _log("[OK] 완료" + (" (staging + zip)" if make_zip and not skip_stage
                            else " (zip only)" if skip_stage
                            else " (staging only)"))
        print("=" * 64)
    return rc


# ============================================================
# SCons Hook + CLI
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

        _make_zip = True
        try:
            _opt = env.GetProjectOption("custom_offline_zip", "true")  # type: ignore
            _make_zip = str(_opt).strip().lower() != "false"
        except Exception:
            pass

        _rc = run_staging(_proj, make_zip=_make_zip)
        if _rc != 0:
            print(f"[pio_gzip_0202] staging 실패 (exit={_rc})", file=sys.stderr)
            sys.exit(_rc)


elif __name__ == "__main__":
    ap = argparse.ArgumentParser(
        description="Smart Nature Wind v0202 staging + offline zip"
    )
    ap.add_argument("--no-zip",   action="store_true", help="zip 생성 스킵")
    ap.add_argument("--no-gz",    action="store_true", help="zip에서 .gz 파일 제외")
    ap.add_argument("--zip-only", action="store_true", help="스테이징 스킵, zip만 생성")
    args = ap.parse_args()

    sys.exit(run_staging(
        find_project_root(),
        make_zip   = not args.no_zip,
        include_gz = not args.no_gz,
        skip_stage = args.zip_only,
    ))
    