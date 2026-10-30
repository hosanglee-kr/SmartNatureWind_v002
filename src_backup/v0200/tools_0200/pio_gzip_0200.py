#!/usr/bin/env python3
"""
Smart Nature Wind v0200 — LittleFS Web Staging + Gzip 사전 압축 및 JS 번들링 스크립트

기능:
  1. SRC(개발 원본): src/v0200/data_src_v0200/html_v3/
  2. DST(배포 스테이징): src/v0200/data_v0200/html_v3/
  3. 메인 대시보드(P010_main_0200.html)의 8개 JS 모듈을 단일 P010_bundle_0200.js로 결합
  4. P010_main_0200.html 내 script 태그를 번들 태그로 자동 치환
  5. 모든 HTML, CSS, JS 파일을 Level 9 Gzip(.gz)으로 사전 압축하여 LittleFS 용량 및 LWIP TCP 소켓 절감
  6. PlatformIO extra_scripts (pre:buildfs / uploadfs) 및 CLI 직접 실행 모두 지원

사용:
  python src/v0200/tools_0200/pio_gzip_0200.py
  (또는 platformio.ini의 extra_scripts 연동 시 pio run --target uploadfs 시 자동 실행)

[개정 이력]
  - SCons hook: run_staging() 반환값을 검사하여 실패 시 sys.exit()로 빌드 중단
  - 미사용 import(os, re) 제거
  - SCons 타겟 매칭에서 중복 "fs" substring 제거
"""

from __future__ import annotations

import gzip
import shutil
import sys
from pathlib import Path
from typing import List, Sequence, Set

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
# 설정 및 경로 상수
# ============================================================
GZ_EXTS: Set[str] = {".html", ".css", ".js"}
COPY_ONLY_EXTS: Set[str] = {".svg", ".png", ".jpg", ".webp", ".ico", ".txt", ".json", ".woff", ".woff2"}

# 메인 대시보드 로드 순서 의존성 (8개 모듈)
MAIN_BUNDLE_JS_ORDER: Sequence[str] = (
    "P000_common_0200.js",
    "P001_comm_API_0200.js",
    "P010_main_core_0200.js",
    "P010_main_preset_0200.js",
    "P010_main_ws_0200.js",
    "P010_main_wifi_0200.js",
    "P010_main_misc_0200.js",
    "P010_main_0200.js",
)

MAIN_BUNDLE_OUTPUT_NAME = "P010_bundle_0200.js"


def find_project_root() -> Path:
    """Git 저장소 루트 또는 platformio.ini가 위치한 프로젝트 루트 감지."""
    cur = Path(__file__).resolve().parent
    while cur != cur.parent:
        if (cur / "platformio.ini").is_file():
            return cur
        cur = cur.parent
    return Path.cwd()


def gzip_file(src_path: Path, dst_gz_path: Path) -> tuple:
    """파일을 읽어 Gzip Level 9로 압축 저장 (raw_bytes, gz_bytes 반환)."""
    dst_gz_path.parent.mkdir(parents=True, exist_ok=True)
    raw_data = src_path.read_bytes()
    raw_size = len(raw_data)

    with gzip.open(dst_gz_path, "wb", compresslevel=9) as f_out:
        f_out.write(raw_data)

    gz_size = dst_gz_path.stat().st_size
    return raw_size, gz_size


def build_main_bundle(src_dir: Path, dst_dir: Path) -> None:
    """메인 대시보드 JS 모듈 8개를 하나로 번들링 후 raw 및 gz 저장."""
    bundle_parts: List[str] = []
    total_raw = 0

    print(f"\n[1/3] 메인 JS 번들링 ({len(MAIN_BUNDLE_JS_ORDER)}개 모듈 -> {MAIN_BUNDLE_OUTPUT_NAME}):")
    for rel_name in MAIN_BUNDLE_JS_ORDER:
        js_file = src_dir / rel_name
        if not js_file.is_file():
            # [C-G-3] 번들 소스 누락 시 조용히 skip 금지
            #  - 8개 중 1개 누락 → 런타임 ReferenceError
            #  - 빌드는 성공 → 개발자가 원인 모름
            #  - 즉시 실패로 명확한 피드백
            print(f"  [ERROR] 번들 소스 파일 누락: {rel_name}", file=sys.stderr)
            print(f"          expected at: {js_file}", file=sys.stderr)
            print(f"          web 자산 소스(data_src_v0200/html_v3)를 확인하세요.", file=sys.stderr)
            sys.exit(1)
        content = js_file.read_text(encoding="utf-8")
        size = len(content.encode("utf-8"))
        total_raw += size
        header = f"\n/* ===== BUNDLE: {rel_name} ({size} bytes) ===== */\n"
        bundle_parts.append(header + content + "\n")
        print(f"  + {rel_name:<26} ({size:>6,} bytes)")

    bundle_full = "".join(bundle_parts)

    # 1. raw 번들 저장 (디버깅/폴백용)
    bundle_dst_raw = dst_dir / MAIN_BUNDLE_OUTPUT_NAME
    bundle_dst_raw.write_text(bundle_full, encoding="utf-8")

    # 2. .gz 압축 번들 저장
    bundle_dst_gz = dst_dir / f"{MAIN_BUNDLE_OUTPUT_NAME}.gz"
    with gzip.open(bundle_dst_gz, "wb", compresslevel=9) as f_out:
        f_out.write(bundle_full.encode("utf-8"))

    gz_size = bundle_dst_gz.stat().st_size
    ratio = (1.0 - (gz_size / total_raw)) * 100.0 if total_raw > 0 else 0.0
    print(f"  ==> 번들 결과: {total_raw:>6,} B -> {gz_size:>6,} B (gz 압축률: {ratio:.1f}% 절감)")


def process_main_html(src_dir: Path, dst_dir: Path) -> None:
    """P010_main_0200.html 내 8개 script 태그를 번들 태그로 치환 후 raw 및 gz 저장."""
    src_html = src_dir / "P010_main_0200.html"
    if not src_html.is_file():
        return

    html_content = src_html.read_text(encoding="utf-8")

    # 번들 대상 스크립트 경로 집합
    target_scripts = {
        f"./{name}" for name in MAIN_BUNDLE_JS_ORDER
    } | {name for name in MAIN_BUNDLE_JS_ORDER}

    lines = html_content.splitlines(keepends=True)
    new_lines: List[str] = []
    bundle_inserted = False
    replaced_count = 0

    for line in lines:
        is_target_script = False
        if "<script" in line:
            for script_name in target_scripts:
                if f'src="{script_name}"' in line or f"src='{script_name}'" in line:
                    is_target_script = True
                    break

        if is_target_script:
            replaced_count += 1
            if not bundle_inserted:
                new_lines.append(f'\t<script src="./{MAIN_BUNDLE_OUTPUT_NAME}" defer></script>\n')
                bundle_inserted = True
        else:
            new_lines.append(line)

    new_html = "".join(new_lines)

    dst_html_raw = dst_dir / "P010_main_0200.html"
    dst_html_raw.write_text(new_html, encoding="utf-8")

    dst_html_gz = dst_dir / "P010_main_0200.html.gz"
    with gzip.open(dst_html_gz, "wb", compresslevel=9) as f_out:
        f_out.write(new_html.encode("utf-8"))

    orig_size = len(html_content.encode("utf-8"))
    gz_size = dst_html_gz.stat().st_size
    ratio = (1.0 - (gz_size / orig_size)) * 100.0 if orig_size > 0 else 0.0
    print(f"\n[2/3] 메인 HTML script 태그 치환 (치환된 script 태그 수: {replaced_count}):")
    print(f"  P010_main_0200.html: {orig_size:>6,} B -> {gz_size:>6,} B (gz 압축률: {ratio:.1f}% 절감)")


def process_all_assets(src_dir: Path, dst_dir: Path) -> None:
    """모든 정적 에셋 복사 및 Gzip 사전 압축."""
    print("\n[3/3] 전체 정적 에셋 스테이징 및 Gzip 압축:")

    total_raw_all = 0
    total_gz_all = 0
    file_count = 0

    for item in sorted(src_dir.rglob("*")):
        if not item.is_file():
            continue

        rel = item.relative_to(src_dir)
        ext = item.suffix.lower()

        # 이미 처리한 메인 파일은 통계만 누적
        if rel.name == "P010_main_0200.html":
            dst_gz = dst_dir / f"{rel.name}.gz"
            total_raw_all += item.stat().st_size
            total_gz_all += dst_gz.stat().st_size if dst_gz.is_file() else 0
            file_count += 1
            continue

        dst_raw = dst_dir / rel
        dst_raw.parent.mkdir(parents=True, exist_ok=True)

        if ext in GZ_EXTS:
            # 1. raw 파일 복사 (하위 호환성 및 개발용)
            shutil.copy2(item, dst_raw)
            # 2. .gz 압축 파일 생성
            dst_gz = dst_dir / f"{rel}.gz"
            raw_sz, gz_sz = gzip_file(item, dst_gz)
            total_raw_all += raw_sz
            total_gz_all += gz_sz
            ratio = (1.0 - (gz_sz / raw_sz)) * 100.0 if raw_sz > 0 else 0.0
            print(f"  [GZ] {str(rel):<30} {raw_sz:>6,} B -> {gz_sz:>6,} B ({ratio:.1f}% 절감)")
            file_count += 1
        elif ext in COPY_ONLY_EXTS:
            shutil.copy2(item, dst_raw)
            sz = item.stat().st_size
            total_raw_all += sz
            total_gz_all += sz
            print(f"  [CP] {str(rel):<30} {sz:>6,} B (단순 복사)")
            file_count += 1

    overall_ratio = (1.0 - (total_gz_all / total_raw_all)) * 100.0 if total_raw_all > 0 else 0.0
    print("\n" + "=" * 60)
    print(" [OK] Web Assets Gzip Staging Summary")
    print("=" * 60)
    print(f" Processed files : {file_count}")
    print(f" Total raw size  : {total_raw_all:>8,} bytes ({total_raw_all / 1024:.1f} KB)")
    print(f" Total gz size   : {total_gz_all:>8,} bytes ({total_gz_all / 1024:.1f} KB)")
    print(f" Saved ratio     : {overall_ratio:.1f}% saved")
    print("=" * 60)


def run_staging(project_root: Path) -> int:
    """스테이징 및 압축 메인 루틴."""
    src_dir = project_root / "src" / "v0200" / "data_src_v0200" / "html_v3"
    dst_dir = project_root / "src" / "v0200" / "data_v0200" / "html_v3"

    if not src_dir.is_dir():
        print(f"[ERROR] Source dir not found: {src_dir}", file=sys.stderr)
        return 1

    print("=" * 60)
    print(" Smart Nature Wind v0200 - Web Asset Gzip Bundler")
    print(f" SRC: {src_dir}")
    print(f" DST: {dst_dir}")
    print("=" * 60)

    # 1. 번들링
    build_main_bundle(src_dir, dst_dir)
    # 2. 메인 HTML 태그 치환
    process_main_html(src_dir, dst_dir)
    # 3. 전체 에셋 복사 및 압축
    process_all_assets(src_dir, dst_dir)

    return 0


# ============================================================
# PlatformIO SCons Hook & CLI 진입점
# ============================================================
try:
    # PlatformIO extra_scripts 환경인지 확인
    Import("env")  # type: ignore
    from SCons.Script import COMMAND_LINE_TARGETS  # type: ignore
    is_scons = True
except Exception:
    is_scons = False

if is_scons:
    # PlatformIO 빌드 컨텍스트: buildfs / uploadfs 타깃일 때만 실행
    # [개정] "fs" substring은 buildfs/uploadfs에 이미 포함되므로 중복 제거
    _targets_str = " ".join(COMMAND_LINE_TARGETS).lower()  # type: ignore
    _is_fs_target = any(t in _targets_str for t in ["buildfs", "uploadfs"])

    if _is_fs_target:
        _env_proj_dir = Path(env["PROJECT_DIR"])  # type: ignore
        # [개정] run_staging 반환값을 검사하여 실패 시 빌드 중단
        #  - 이전: 반환값 무시 → staging 실패해도 buildfs가 계속 진행
        #  - 이후: 실패 시 sys.exit()로 SCons 파이프라인 중단
        _ret = run_staging(_env_proj_dir)
        if _ret != 0:
            print(f"[pio_gzip_0200] staging 실패 (exit={_ret})", file=sys.stderr)
            sys.exit(_ret)
    else:
        # 일반 펌웨어 빌드 시에는 불필요한 I/O 및 인코딩 간섭 회피
        pass
elif __name__ == "__main__":
    # 독립 CLI 실행 컨텍스트
    root = find_project_root()
    sys.exit(run_staging(root))
    