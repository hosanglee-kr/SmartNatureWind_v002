#!/bin/sh
# ============================================================
# SmartNatureWind v0203 — .agents/ → .claude/ drift 방지
# ============================================================

set -e

# 1) drift 검사
if ! python tools/sync-agent-configs.py --check > /tmp/sync_check.log 2>&1; then
    echo "[pre-commit] .claude/ drift 감지 → 자동 sync"
    cat /tmp/sync_check.log
    python tools/sync-agent-configs.py
    git add .claude/rules .claude/skills .claude/commands 2>/dev/null || true
fi

# 2) 계약 문서 변경 감지 시 strict 검증
if git diff --cached --name-only | grep -q "contract_doc_0203/.*\.md"; then
    echo "[pre-commit] 계약 문서 변경 감지 → strict 검증"
    python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict
fi

# 3) FE 자산 변경 감지 시 i18n 검증
if git diff --cached --name-only | grep -q "data_v0203_src/html_v0203/.*\.js"; then
    echo "[pre-commit] FE 자산 변경 감지 → i18n 검증"
    python src/v0203/tools_0203/check_i18n.py --strict
fi

exit 0

