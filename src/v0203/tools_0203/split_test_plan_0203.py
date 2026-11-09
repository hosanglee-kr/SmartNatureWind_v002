#!/usr/bin/env python3
"""TEST_PLAN_0203.md → L1_L5 / L6_L8 / L9_L11 + 인덱스 분할.

전략:
- 최상위 `## N.` 섹션 단위 파싱
- §3 (백엔드 Batch A~F) 내부를 서브섹션(3.1~3.7) 단위로 재분할
  · §3 base(T-14~T-28) → L1_L5
  · §3.1~§3.4        → L6_L8
  · §3.5~§3.7        → L9_L11
- §1.1(계층 구조), §1.2~1.4(환경/사전준비), §7(매트릭스), §8(트러블슈팅),
  §9(릴리스 게이트), §10(개정이력) → 인덱스 유지
- 섹션 번호는 원본 유지 (anchor 호환성 보존)

Usage:
    python src/v0203/tools_0203/split_test_plan_0203.py --dry-run
    python src/v0203/tools_0203/split_test_plan_0203.py
    python src/v0203/tools_0203/split_test_plan_0203.py --force   # 이미 분할된 상태에서 재분할
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
DOC_DIR = THIS_DIR.parent / "contract_doc_0203"
ROOT = THIS_DIR.parent.parent.parent
ORIGINAL = DOC_DIR / "TEST_PLAN_0203.md"
L1_L5 = DOC_DIR / "TEST_PLAN_L1_L5_0203.md"
L6_L8 = DOC_DIR / "TEST_PLAN_L6_L8_0203.md"
L9_L11 = DOC_DIR / "TEST_PLAN_L9_L11_0203.md"

TOP_RE = re.compile(r"^##\s+(\d+)\.\s+(?!\d)(.+)$", re.MULTILINE)
SUB3_RE = re.compile(r"^#{2,3}\s+(3\.\d+)\s+(.+)$", re.MULTILINE)

SPLIT_MARKER = "이 파일은 `src/v0203/tools_0203/split_test_plan_0203.py`가 생성합니다."


# ──────────────────────────────────────────────────────────────
# 파싱
# ──────────────────────────────────────────────────────────────
def split_by_top_sections(text: str) -> tuple[str, list[tuple[str, str]]]:
    """(front_matter, [(section_num, section_text), ...])."""
    lines = text.split("\n")
    preamble: list[str] = []
    sections: list[tuple[str, str]] = []
    current_num: str | None = None
    current_lines: list[str] = []

    for line in lines:
        m = TOP_RE.match(line)
        if m:
            if current_num is None:
                preamble = current_lines
                current_lines = []
            else:
                sections.append((current_num, "\n".join(current_lines).rstrip()))
            current_num = m.group(1)
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_num is not None:
        sections.append((current_num, "\n".join(current_lines).rstrip()))

    return "\n".join(preamble).rstrip(), sections


def split_section_3(text: str) -> tuple[str, dict[str, str]]:
    """§3를 base(§3.1 이전)와 서브섹션 dict로 분할."""
    lines = text.split("\n")
    base_lines: list[str] = []
    subs: dict[str, str] = {}
    current: str | None = None
    cur_lines: list[str] = []

    for line in lines:
        m = SUB3_RE.match(line)
        if m:
            if current is not None:
                subs[current] = "\n".join(cur_lines).rstrip()
            current = m.group(1)
            cur_lines = [line]
        elif current is None:
            base_lines.append(line)
        else:
            cur_lines.append(line)

    if current is not None:
        subs[current] = "\n".join(cur_lines).rstrip()

    return "\n".join(base_lines).rstrip(), subs


# ──────────────────────────────────────────────────────────────
# 파일 렌더링
# ──────────────────────────────────────────────────────────────
def render_l1_l5(sec2: str, base3: str, sec4: str, sec5: str, sec6: str) -> str:
    return f"""# TEST_PLAN_L1_L5_0203.md — 기본 회귀 (L1~L5)

> **범위**: T-1 ~ T-45 (백엔드 기존 + Batch A~F, 프론트엔드, 정적 감사, 부하/안정성).
> **원본 §번호 유지**: 이 파일의 §2~§6은 원본 `TEST_PLAN_0203.md` §2~§6과 동일합니다.
> **참조**: 개요/계층/환경/사전 준비/매트릭스/릴리스 게이트는 [`TEST_PLAN_0203.md`](TEST_PLAN_0203.md) 참조.
> {SPLIT_MARKER}

## 🔍 AI 빠른 참조 (이 파일)

| 범위 | 대응 섹션 | 릴리스 필수 |
|---|---|---|
| T-1 ~ T-13 (백엔드 기존) | §2 | T-1, T-3, T-5, T-10 |
| T-14 ~ T-28 (Batch A~F) | §3 | T-14, T-16, T-27 |
| T-29 ~ T-35 (FE SPA) | §4 | 7/7 |
| T-36 ~ T-40 (정적 감사) | §5 | CI 자동 |
| T-41 ~ T-45 (부하/안정성) | §6 | 병행 |

**사전 준비**: [`TEST_PLAN_0203.md §3`](TEST_PLAN_0203.md#3-검증-환경-및-공통-사전-준비) 참조 (환경/사전준비/도구).

---

{sec2}

---

{base3}

---

{sec4}

---

{sec5}

---

{sec6}

---

## 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-11-09 | v1.0 | TEST_PLAN_0203.md에서 L1~L5 분할 (T-1~T-45). `src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |
"""


def render_l6_l8(sub31: str, sub32: str, sub33: str, sub34: str) -> str:
    return f"""# TEST_PLAN_L6_L8_0203.md — Batch/Phase 회귀 (L6~L8)

> **범위**: T-46 ~ T-113 (Batch G / Batch I / Phase 1~6 통합).
> **원본 §번호 유지**: §3.1~§3.4 원본 번호 그대로.
> **참조**: 개요/환경/사전 준비/매트릭스/릴리스 게이트는 [`TEST_PLAN_0203.md`](TEST_PLAN_0203.md).
> {SPLIT_MARKER}

## 🔍 AI 빠른 참조 (이 파일)

| 서브섹션 | 범위 | 필수 |
|---|---|---|
| §3.1 Batch G P0 | T-46 ~ T-50 | **5/5 (P0)** |
| §3.2 Batch G P1 | T-51 ~ T-67 | **8/8** (T-51, T-52, T-53, T-54, T-57, T-58, T-61, T-65) |
| §3.3 Batch I | T-70 ~ T-73 | **3/3** (T-70, T-71, T-72) |
| §3.4 Phase 1~6 | T-90 ~ T-113 | **10건** (T-90, T-91, T-94, T-97, T-98, T-99, T-101, T-103, T-105, T-106) |

**사전 준비**: [`TEST_PLAN_0203.md §3`](TEST_PLAN_0203.md#3-검증-환경-및-공통-사전-준비) 참조.

---

{sub31}

---

{sub32}

---

{sub33}

---

{sub34}

---

## 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-11-09 | v1.0 | TEST_PLAN_0203.md에서 L6~L8 분할 (T-46~T-113). `src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |
"""


def render_l9_l11(sub35: str, sub36: str, sub37: str) -> str:
    return f"""# TEST_PLAN_L9_L11_0203.md — Stage 회귀 (L9~L11)

> **범위**: T-114 ~ T-152 (Stage 8 AI/Live, 통합 감사 28건, Stage 9 UI/UX).
> **원본 §번호 유지**: §3.5~§3.7 원본 번호 그대로.
> **참조**: 개요/환경/사전 준비/매트릭스/릴리스 게이트는 [`TEST_PLAN_0203.md`](TEST_PLAN_0203.md).
> **자동화**: `python test/e2e_stage8_4.py <DEVICE_IP>` (Stage 8 7건).
> {SPLIT_MARKER}

## 🔍 AI 빠른 참조 (이 파일)

| 서브섹션 | 범위 | 필수 |
|---|---|---|
| §3.5 Stage 8 | T-114 ~ T-120 | **7/7** |
| §3.6 통합 감사 | T-121 ~ T-148 | **P0 5/5 (T-121~T-125) + P1 10/10 (T-126~T-135)** |
| §3.7 Stage 9 UI | T-149 ~ T-152 | **4/4** |

**사전 준비**: [`TEST_PLAN_0203.md §3`](TEST_PLAN_0203.md#3-검증-환경-및-공통-사전-준비) 참조.

---

{sub35}

---

{sub36}

---

{sub37}

---

## 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-11-09 | v1.0 | TEST_PLAN_0203.md에서 L9~L11 분할 (T-114~T-152). `src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |
"""


def extract_subsection(section: str, title_fragment: str) -> str:
    """§1 안에서 특정 ### 서브섹션만 추출."""
    m = re.search(rf"^(###[^\n]*{re.escape(title_fragment)}[^\n]*)$", section, re.MULTILINE)
    if not m:
        return section
    start = m.start()
    next_h3 = re.search(r"^###\s", section[m.end():], re.MULTILINE)
    end = m.end() + next_h3.start() if next_h3 else len(section)
    content = section[start:end].rstrip()
    content = re.sub(r"^###\s+1\.1\b", "### 2.1", content, count=1)
    return content


def extract_common_setup(section: str) -> str:
    """§1의 ### 1.2, ### 1.3, ### 1.4 를 추출 (§3 하위로 정규화)."""
    sub_map = {"1.2": "3.1", "1.3": "3.2", "1.4": "3.3"}
    result = []
    for m in re.finditer(r"^###\s+(1\.[234][^\n]*)$", section, re.MULTILINE):
        start = m.start()
        next_h3 = re.search(r"^###\s", section[m.end():], re.MULTILINE)
        end = m.end() + next_h3.start() if next_h3 else len(section)
        block = section[start:end].rstrip()
        for old_num, new_num in sub_map.items():
            if block.startswith(f"### {old_num}"):
                block = block.replace(f"### {old_num}", f"### {new_num}", 1)
                break
        result.append(block)
    return "\n\n".join(result) if result else section


def render_index(sections: dict[str, str], preamble: str, old_version: str) -> str:
    """인덱스 = §1.1(계층 구조) + §1.2~1.4(환경/사전준비) + §7 + §8 + §9 + §10(갱신)."""
    sec1 = sections.get("1", "## 1. 검증 개요 및 준비")
    sec7 = sections.get("7", "## 7. 회귀 매트릭스 요약")
    sec8 = sections.get("8", "## 8. 장애 진단 및 트러블슈팅")
    sec9 = sections.get("9", "## 9. Phase 7 릴리스 게이트")
    sec10 = sections.get("10", "## 10. 개정 이력")

    # 원본 섹션의 ## N. 헤딩 라인을 제거하여 중복 방지
    sec7_body = re.sub(r"^##\s+7\.\s+[^\n]*\n+", "", sec7, count=1)
    sec8_body = re.sub(r"^##\s+8\.\s+[^\n]*\n+", "", sec8, count=1)
    sec9_body = re.sub(r"^##\s+9\.\s+[^\n]*\n+", "", sec9, count=1)
    sec10_body = re.sub(r"^##\s+10\.\s+[^\n]*\n+", "", sec10, count=1)

    new_row = (
        "| **2026-11-09** | **v4.0** | **3분할 (Phase C)**: "
        "T-1~T-45 → `TEST_PLAN_L1_L5_0203.md`, "
        "T-46~T-113 → `TEST_PLAN_L6_L8_0203.md`, "
        "T-114~T-152 → `TEST_PLAN_L9_L11_0203.md`. "
        "본 문서는 개요/매트릭스/게이트/트러블슈팅 인덱스로 전환. "
        "`src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |\n"
    )
    if "| **2026-11-09** | **v4.0**" not in sec10_body:
        sec10_body = re.sub(
            r"(\| 날짜 \| 버전 \| 변경 내용 \| 작성자 \|\n\|[-\s|:]+[-\s|]*\|\n)",
            r"\1" + new_row,
            sec10_body,
            count=1,
        )

    return f"""# TEST_PLAN_0203.md — 회귀 테스트 인덱스 (v4.0)

> **검증 대상**: Smart Nature Wind v0203 펌웨어 + v0203 SPA 프론트엔드
> **기준선**: Batch A~F + Phase 0~7 + Batch G/H/I + Stage 8 AI/Live + Stage 9 UI/UX
> **파일명 정책**: 계약 문서 `_0203.md` 유지
> {SPLIT_MARKER} (인덱스는 원본에서 유지부만 추출).

---

## 🔍 AI 빠른 참조 (분할 맵)

| 레이어 | 분할 파일 | 범위 | 릴리스 게이트 |
|---|---|---|---|
| L1~L5 | [`TEST_PLAN_L1_L5_0203.md`](TEST_PLAN_L1_L5_0203.md) | T-1 ~ T-45 | §6 G-7.0, G-7.1 |
| L6~L8 | [`TEST_PLAN_L6_L8_0203.md`](TEST_PLAN_L6_L8_0203.md) | T-46 ~ T-113 | §6 G-7.2~G-8.2 |
| L9~L11 | [`TEST_PLAN_L9_L11_0203.md`](TEST_PLAN_L9_L11_0203.md) | T-114 ~ T-152 | §6 G-9.1~G-11.1 |

---

## 📋 목차

1. [분할 파일 링크](#1-분할-파일-링크)
2. [검증 계층 구조 (L1~L11)](#2-검증-계층-구조-l1l11)
3. [검증 환경 및 공통 사전 준비](#3-검증-환경-및-공통-사전-준비)
4. [회귀 매트릭스 요약](#4-회귀-매트릭스-요약)
5. [장애 진단 및 트러블슈팅](#5-장애-진단-및-트러블슈팅)
6. [Phase 7 릴리스 게이트](#6-phase-7-릴리스-게이트)
7. [개정 이력](#7-개정-이력)

---

## 1. 분할 파일 링크

| 레이어 | 파일 | 범위 | 필수 |
|---|---|---|---|
| **L1~L5** | [`TEST_PLAN_L1_L5_0203.md`](TEST_PLAN_L1_L5_0203.md) | T-1 ~ T-45 | T-1, T-3, T-5, T-10, T-14, T-16, T-27, T-29~T-35 |
| **L6~L8** | [`TEST_PLAN_L6_L8_0203.md`](TEST_PLAN_L6_L8_0203.md) | T-46 ~ T-113 | P0 5/5, P1 8/8, T-70~T-72, T-90~T-113 中 10건 |
| **L9~L11** | [`TEST_PLAN_L9_L11_0203.md`](TEST_PLAN_L9_L11_0203.md) | T-114 ~ T-152 | Stage 8 7/7, AUDIT P0 5+P1 10, Stage 9 4/4 |
| (본 인덱스) | `TEST_PLAN_0203.md` | 개요/매트릭스/게이트 | — |

**자동화**: `python test/e2e_stage8_4.py <IP>` (Stage 8 T-114~T-120 7건)

---

## 2. 검증 계층 구조 (L1~L11)

{extract_subsection(sec1, "검증 계층 구조")}

---

## 3. 검증 환경 및 공통 사전 준비

{extract_common_setup(sec1)}

---

## 4. 회귀 매트릭스 요약

{sec7_body}

---

## 5. 장애 진단 및 트러블슈팅

{sec8_body}

---

## 6. Phase 7 릴리스 게이트

{sec9_body}

---

## 7. 개정 이력

{sec10_body}
"""


def is_already_split(text: str) -> bool:
    return (
        "TEST_PLAN_L1_L5_0203.md" in text
        and "TEST_PLAN_L6_L8_0203.md" in text
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="이미 분할된 상태에서 재분할")
    args = ap.parse_args()

    if not ORIGINAL.is_file():
        print(f"ERROR: 원본 없음: {ORIGINAL}", file=sys.stderr)
        return 1

    text = ORIGINAL.read_text(encoding="utf-8")

    if is_already_split(text) and not args.force:
        print("SKIP: 이미 분할됨. --force로 재분할.")
        return 0

    preamble, sections_list = split_by_top_sections(text)
    sections = {num: body for num, body in sections_list}

    required = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}
    missing = required - sections.keys()
    if missing:
        print(f"ERROR: 필수 섹션 누락: {missing}", file=sys.stderr)
        return 2

    # §3 분할
    base3, subs3 = split_section_3(sections["3"])
    required_subs = {"3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"}
    missing_subs = required_subs - subs3.keys()
    if missing_subs:
        print(f"ERROR: §3 서브섹션 누락: {missing_subs}", file=sys.stderr)
        return 2

    l1_l5 = render_l1_l5(
        sec2=sections["2"],
        base3=base3,
        sec4=sections["4"],
        sec5=sections["5"],
        sec6=sections["6"],
    )
    l6_l8 = render_l6_l8(
        sub31=subs3["3.1"],
        sub32=subs3["3.2"],
        sub33=subs3["3.3"],
        sub34=subs3["3.4"],
    )
    l9_l11 = render_l9_l11(
        sub35=subs3["3.5"],
        sub36=subs3["3.6"],
        sub37=subs3["3.7"],
    )
    index = render_index(sections, preamble, old_version="v3.5")

    outputs = {
        L1_L5: l1_l5,
        L6_L8: l6_l8,
        L9_L11: l9_l11,
        ORIGINAL: index,
    }

    if args.dry_run:
        print("=== DRY-RUN ===")
        for path, content in outputs.items():
            old_size = path.stat().st_size if path.exists() else 0
            print(f"  {path.name}: {old_size:,} → {len(content):,} chars ({len(content.splitlines())} lines)")
        return 0

    for path, content in outputs.items():
        path.write_text(content, encoding="utf-8")
        print(f"[write] {path.name} ({len(content.splitlines())} lines)")

    print("\nSplit complete.")
    print("  다음: python src/v0203/tools_0203/enhance_index_links_0203.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
