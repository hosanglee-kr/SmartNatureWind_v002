#!/usr/bin/env python3
"""로컬 마크다운 문서(.md) 섹션 및 심볼 참조를 graphify-out/graph.json에 증분 동기화.

- `graphify update .`는 코드 AST-only이므로, 계약 문서(contract_doc_0203/*.md),
  AGENTS.md, README.md의 변경 사항을 API 비용 없이 로컬 파싱으로 보강한다.
- 기존 `_origin == "local_md_sync"` 노드/링크를 교체하므로 멱등성이 보장된다.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH_JSON = ROOT / "graphify-out" / "graph.json"

TARGET_DOCS: list[Path] = [
    ROOT / "AGENTS.md",
    ROOT / "README.md",
    *sorted((ROOT / "src" / "v0203" / "contract_doc_0203").glob("*.md")),
]

HEADER_RE = re.compile(r"^(#{1,3})\s+(.+?)\s*$")
TOKEN_RE = re.compile(r"`([A-Za-z0-9_.:/\-]+)`")


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip()).lower()


def _safe_id(rel_path: str, line_no: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", rel_path.lower()).strip("_")
    return f"doc_{slug}_l{line_no}"


def main() -> int:
    if not GRAPH_JSON.is_file():
        print(f"[sync_docs] SKIP: {GRAPH_JSON} 없음")
        return 0

    data = json.loads(GRAPH_JSON.read_text(encoding="utf-8"))
    nodes: list[dict] = [n for n in data.get("nodes", []) if n.get("_origin") != "local_md_sync"]
    links: list[dict] = [e for e in data.get("links", []) if e.get("_origin") != "local_md_sync"]

    # 기존 코드 노드 인덱스 (label / source_file 매칭용)
    label_to_id: dict[str, str] = {}
    for n in nodes:
        lbl = n.get("label", "")
        if lbl and lbl not in label_to_id:
            label_to_id[lbl] = n["id"]
        sf = n.get("source_file", "")
        if sf:
            fname = Path(sf).name
            if fname not in label_to_id:
                label_to_id[fname] = n["id"]

    added_nodes = 0
    added_links = 0

    for doc_path in TARGET_DOCS:
        if not doc_path.is_file():
            continue
        rel = doc_path.relative_to(ROOT).as_posix()
        lines = doc_path.read_text(encoding="utf-8", errors="ignore").splitlines()

        cur_sec_id: str | None = None
        seen_edges: set[tuple[str, str]] = set()

        for idx, line in enumerate(lines, start=1):
            m = HEADER_RE.match(line)
            if m:
                title = m.group(2).strip()
                nid = _safe_id(rel, idx)
                nodes.append({
                    "id": nid,
                    "label": title,
                    "_origin": "local_md_sync",
                    "community_name": doc_path.name,
                    "file_type": "doc",
                    "norm_label": _norm(title),
                    "source_file": rel,
                    "source_location": f"L{idx}",
                })
                cur_sec_id = nid
                added_nodes += 1
                continue

            if not cur_sec_id:
                continue

            for tok in TOKEN_RE.findall(line):
                clean = tok.rstrip("()")
                target_id = label_to_id.get(tok) or label_to_id.get(clean) or label_to_id.get(f"{clean}()")
                if target_id and (cur_sec_id, target_id) not in seen_edges:
                    seen_edges.add((cur_sec_id, target_id))
                    links.append({
                        "source": cur_sec_id,
                        "target": target_id,
                        "relation": "references",
                        "_origin": "local_md_sync",
                        "confidence": "EXTRACTED",
                        "confidence_score": 0.9,
                        "context": "doc_reference",
                        "source_file": rel,
                        "source_location": f"L{idx}",
                        "weight": 0.9,
                    })
                    added_links += 1

    data["nodes"] = nodes
    data["links"] = links
    GRAPH_JSON.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"[sync_docs] Markdown 문서 동기화 완료: +{added_nodes} nodes, +{added_links} links")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
