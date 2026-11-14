---
name: contract-update
description: "계약 문서(SPEC/CONTRACT/STATE/FLOW/BUDGET/TEST_PLAN) 동시 갱신이 필요한 변경(모듈 인터페이스, FSM 전이, 데이터 스키마, 동시성) 시 사용. 6문서를 같은 커밋으로 수정하고 commit_contracts_0203.py --dry-run --strict로 검증."
---

# 계약 문서 동시 갱신 워크플로

## 언제 사용
- 모듈 인터페이스 시그니처 변경
- FSM 상태/전이 변경
- JSON 스키마 변경
- 락/뮤텍스/위임 규약 변경
- API 엔드포인트 추가/변경

## 순서 (AGENTS.md 원칙 4)
1. 영향 문서 식별: SPEC → FLOW → CONTRACT → STATE → BUDGET → TEST_PLAN
2. 각 문서 §개정 이력에 **동일 날짜/버전** 기록
3. `python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict` 통과 확인
4. 문서+코드 **하나의 커밋**으로 반영

## 자주 놓치는 항목
- SPEC §5.1.4 (AI) / §5.4 (FE 자산)
- CONTRACT §7.15~7.18 (AI/Live/UI/AUDIT2)
- BUDGET §8.5 판정 표
- STATE §2.5 (Session ↔ runCtx FSM)

## 검증
- exit 0 필수
- 개정 이력 날짜/버전 일치
- 상대 경로 링크 유효성
