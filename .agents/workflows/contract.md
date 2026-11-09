# 계약 문서 동시 갱신

## 단계
1. 영향 문서 식별: SPEC → FLOW → CONTRACT → STATE → BUDGET → TEST_PLAN
2. 각 문서 §개정 이력에 **동일 날짜/버전** 기록
3. `python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict`
4. 문서+코드 **하나의 커밋**으로 반영

## 자주 놓치는 항목
- SPEC §5.1.4 (AI) / §5.4 (FE 자산)
- CONTRACT §7.15~7.18 (AI/Live/UI/AUDIT2)
- BUDGET §8.5 판정 표
- STATE §2.5 (Session ↔ runCtx FSM 관계)
