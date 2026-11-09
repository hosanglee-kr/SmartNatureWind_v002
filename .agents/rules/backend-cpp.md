---
trigger: glob
globs: "src/v0203/**/*.h, src/v0203/**/*.cpp"
description: "v0203 C++ 백엔드 규칙"
---

# C++ 백엔드 규칙 (v0203)

## 불변 원칙
- **수정 전 승인**: 목적·기능변화 정리 후 사용자 확인
- **root 접근**: `g_A20_config_root` 직접 참조 금지 → `getRootSnapshot()` 경유 (예외 없음)

## ArduinoJson v7
- 단일 `JsonDocument`, `createNested*` 금지
- `containsKey()` 금지 → `obj["k"].is<JsonVariant>()` 또는 정밀 타입 (`is<int>`, `is<const char*>`)

## 로깅 / 문자열
- `CL_D10_Logger::log(EN_L10_LOG_..., "[모듈] ...")`
- `memset` + `strlcpy`, 물리량 `1.0f` 표기

## 네이밍
| 구분 | 접두사 | 예시 |
|---|---|---|
| 클래스/구조체/Enum | `CL_`, `ST_*_t`, `EN_` | `CL_W10_WebAPI`, `ST_A20_ConfigRoot_t`, `EN_CT10_STATE_IDLE` |
| 상수/전역/정적 | `G_`, `g_`, `s_` | `G_W10_PAGES_JSON`, `g_A20_config_root`, `s_stateMutex` |
| 멤버/지역/인자 | `_`, `v_`, `p_` | `_currentSpeed`, `v_jsonDocument`, `p_requestObject` |

## 동시성 (CONTRACT §5 준수)
- 락 순서: `s_stateMutex` → (S10/C10/N10/M10) — **역방향 금지**
- async_tcp는 위임 경유: `feedPIR`, `patchSimFromJson`, `exportSimJson`
- `_session`은 mirror 전용 — `decideRunSource()`에 참여 금지 (ADR-1)

## 세션/AI 안전 계약
- Session Start 3-way 위임: `startUserProfileByNo` / `startOverridePreset` / `startOverrideFixed`
- AI 15종 위험 명령 원천 차단 (`isDangerousAction`)
- AI 도구 선언은 `CT10_AI::appendAIFunctionDeclarations()` 단일 위임 (SSOT)
- 6대 AI 라우트 `checkApiKey()` 인가 필수 + 요청 버퍼 단편화 검사 (`index + len != total`)

## 참조
- 락 인벤토리: CONTRACT §2, §5
- WCET: BUDGET §2~3
- FSM: STATE §2
- AI 안전: CONTRACT §7.15~7.18, SPEC §5.1.4
