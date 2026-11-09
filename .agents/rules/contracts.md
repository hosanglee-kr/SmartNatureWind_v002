---
trigger: model_decision
description: "계약 문서(SPEC/CONTRACT/STATE/FLOW/BUDGET/TEST_PLAN/README) 수정 시 적용"
---

# 계약 문서 수정 규칙 (CBD)

## 개정 절차 (AGENTS.md 원칙 4)
인터페이스/FSM/스키마/동시성 변경 시 **반드시 6문서 동시 갱신**:

1. `SPEC_0203.md` — 사양, 스키마, 상수, 핀맵
2. `FLOW_0203.md` — 부팅/제어 파이프라인
3. `CONTRACT_0203.md` — 태스크/락/공유 자원 규약
4. `STATE_0203.md` — 단일 Writer, FSM, 플래그
5. `BUDGET_0203.md` — WCET/스택/블로킹 예산
6. `TEST_PLAN_0203.md` — 회귀 시나리오

## 개정 이력 필수
- 각 문서 §개정 이력 테이블에 **동일 날짜/버전**으로 기록
- 커밋은 문서+코드 원자적

## 커밋 전 검증
```bash
python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict
```

## 문서 내 상호 참조 링크 표기

- 섹션 참조: `[§N.M](상대경로#anchor)` — 프로젝트 루트 기준
- 문서 참조: `[문서명](상대경로)` — 예: `[SPEC §5.1.4](src/v0203/contract_doc_0203/SPEC_0203.md#514-ai-제어-...)`
- 자기 문서 내 참조: `[§N.M](#anchor)`
- 앵커 자동 생성: `python src/v0203/tools_0203/enhance_index_links_0203.py --verify`로 검증

## TEST_PLAN 분할 규약 (Phase C)

| 레이어 | 파일 | 범위 |
|---|---|---|
| L1~L5 | `TEST_PLAN_L1_L5_0203.md` | T-1~T-45 (기본 회귀) |
| L6~L8 | `TEST_PLAN_L6_L8_0203.md` | T-46~T-113 (Batch G~I, Phase 1~6) |
| L9~L11 | `TEST_PLAN_L9_L11_0203.md` | T-114~T-152 (Stage 8/9) |
| 인덱스 | `TEST_PLAN_0203.md` | 개요/매트릭스/게이트/트러블슈팅 |

- 회귀 실행 시 해당 L 파일만 Read
- 신규 T-항목 추가: 원본 `TEST_PLAN_0203.md` 직접 수정 금지 → 분할 파일에 추가 후 `split_test_plan.py --force` 재실행
- 앵커 참조는 분할 후 `enhance_index_links.py --verify` 필수


