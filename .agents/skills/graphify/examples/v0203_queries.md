# v0203 graphify 질의 예시

AGENTS.md 원칙 2 (Graph-First) 준수. 실제 프로젝트 컨텍스트 질문.

## 1. 상태 소유권

```bash
python tools/graphify_init.py query "runCtx 상태를 쓰는 함수들"
python tools/graphify_init.py query "g_A20_config_root 접근하는 곳"
python tools/graphify_init.py query "overrideState를 수정하는 함수"
```

기대: STATE §1 매트릭스와 대조. async_tcp 컨텍스트의 직접 접근 발견 시 B-2 위반 후보.

## 2. 계약 위반 탐지

```bash
python tools/graphify_init.py query "g_A20_config_root 직접 참조 (getRootSnapshot 경유 없는 곳)"
python tools/graphify_init.py query "s_control->sim 또는 s_control->motion 직접 접근"
```

기대: CONTRACT §3.1, §4.2(A-2) 준수 여부. 0건이어야 함.

## 3. Session 엔진

```bash
python tools/graphify_init.py query "Session FSM이 어떻게 동작해?"
python tools/graphify_init.py query "startSession의 위임 경로"
python tools/graphify_init.py path "CT10::startSession" "CT10::startUserProfileByNo"
python tools/graphify_init.py explain "ST_CT10_Session_t"
```

기대: ADR-1 (위임 모델) + STATE §2.5.

## 4. AI/Live 통합

```bash
python tools/graphify_init.py query "Gemini Live 도구 위임 경로"
python tools/graphify_init.py path "W10_Web_Routes_AILive" "CT10_AI::executeAIAction"
python tools/graphify_init.py explain "CT10_AI::appendAIFunctionDeclarations"
```

기대: CONTRACT §7.15(AI-1~6), §7.18(AUDIT2-1~5).

## 5. 프론트엔드 → 백엔드

```bash
python tools/graphify_init.py query "P010_bundle_0203.js 를 만드는 파이프라인"
python tools/graphify_init.py query "check_i18n.py 를 호출하는 곳"
```

기대: FLOW §11.1 (pio_gzip_0203.py).

## 6. 회귀/CI

```bash
python tools/graphify_init.py query "commit_contracts_0203.py 를 호출하는 곳"
python tools/graphify_init.py explain "tools.sync_agent_configs.main"
```

기대: Phase 1~3에서 추가한 자동화 인프라.

## 7. 리팩토링 후 회귀

```bash
# 계약 문서 수정 후
python tools/graphify_init.py build --update
python tools/graphify_init.py query "SPEC §5.1.4 를 참조하는 코드"
```

기대: 계약-코드 정합성 재확인.

