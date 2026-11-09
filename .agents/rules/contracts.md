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
