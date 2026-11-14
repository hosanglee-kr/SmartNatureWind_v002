---
trigger: glob
globs: "src/v0203/tools_0203/*.py, test/**/*.py"
description: "v0203 빌드/검증 파이프라인 스크립트 규칙"
---

# 파이프라인 스크립트 규칙

## 정적 에셋 파이프라인 (AGENTS.md 원칙 3)
- FE 소스 수정 시 `python src/v0203/tools_0203/pio_gzip_0203.py` 필수
- `check_i18n.py --strict` 자동 실행됨 (staging 진입부)
- 긴급 스킵: `--no-i18n-check` 또는 `platformio.ini: custom_no_i18n_check = true`

## 계약 검증 (AGENTS.md 원칙 4)
- `commit_contracts_0203.py --dry-run --strict`
- 종료 코드: 0 정상 / 1 문서 누락 / 2 Git 오류

## 오프라인 2분할 (SYNC-2)
- `998.offline_data_0203.js` (JSON Mock 캐시)
- `998.offline_0203.js` (경량 시뮬레이터)
- `JS_BUNDLE_EXCLUDES`에 자동 등록 → LittleFS 배포 제외

## C++ Enum 동기화 (SYNC-1)
- `CT10_Ctl_0203.h` Enum → `000.const.js` 자동 주입 (마커 블록)
- 마커: `/* === AUTO-SYNC: C++ ENUM START === */`

## SSOT 자동 대조 (AUDIT-6)
- `validate_contracts.py`가 `pio_gzip_0203.py` 스테이징에서 자동 실행
- 문서(SPEC/README/BUDGET) ↔ C++ 헤더 ↔ 프론트엔드 config/offline 정합성 검증

## graphify 래퍼 규약 (Phase D)

- 정식 엔트리: `python tools/graphify_init.py <subcommand>`
- 서브커맨드: `build` / `check` / `update`(→`build --update`) / `query` / `path` / `explain` / `export` / `mcp`
- **fast path 보존**: `graphify-out/graph.json` 존재 + 자연어 질문 → `query` 직행. 재빌드 신호(`--update`, `--cluster-only`, URL) 없으면 탐지 스킵
- 원본 `SKILL.md` PowerShell은 `SKILL.original.md`로 백업 후 참조만
- AGENTS.md 원칙 2 준수: `grep_search`/무차별 `view_file` 금지 → `query`/`path`/`explain` 우선
- 코드/설계 변경 후 `build --update` 필수 (그래프 최신화)

