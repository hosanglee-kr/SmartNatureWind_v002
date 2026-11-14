---
trigger: glob
globs: "src/v0203/data_v0203_src/**/*.js"
description: "v0203 웹 프론트엔드 JS 규칙"
---

# 프론트엔드 JS 규칙 (v0203)

## Nullish 폴백 (NEW-C1)
- 폼 필드 렌더링 시 `||` 금지 → `nz(v, fallback)` 사용
- 이유: `0`, `''`, `false` 유효값 보존

## 불리언 판정 (NEW-U4)
- 문자열 `"false"` 오판 방지 → `asBool(v)` 사용
- `asBool = v === true || v === 1 || v === '1' || v === 'true'`

## XSS 방어 (B-3/NEW-C2)
- 사용자 입력/표시 텍스트 → `SNW.DomUtil.escape()` 필수
- 대상: `meta.deviceName`, `security.apiKey`, `wifi.ssid`, `wifi.hostname`, `hw.tempHum.type`

## 모달 오버레이 격리
- 닫기 시 `.snw-modal-overlay`에 `pointer-events: none; visibility: hidden; display: none` 적용
- 이유: 메뉴 먹통 방지

## Session state (S-6)
- C++ 반환값: `'ACTIVE'` / `'PAUSED'` / `'COMPLETED'`
- **`'RUNNING'` 사용 금지**

## Preview 파사드 (ADR-5)
- `SNW.Preview.showModal` / `generate` / `_animate` 사용
- 실구현은 `140.ui.simulation.js` 위임

## i18n (P-2)
- `SNW.I18n.t('key')` 참조 전 `check_i18n.py --strict` 통과
- 신규 키는 ko/en 양쪽 DICT에 대칭 추가

## AudioWorklet & Barge-in (AI-5)
- 마이크: 16kHz PCM16 Worklet Blob 스트리밍
- 재생 큐: 24kHz PCM16, 사용자 발화 시 `AudioPlayback.flush()`

## 세션 정규화 (R-1, AUDIT2-4)
- `060.store.js::normalizeSession()` 경유
- `type`(0~3), `typeName`, `triggerName`, `state` 정규화

## 라우터 재진입 (C-5)
- `_dispatching` 가드 필수, `finally` 블록으로 해제

## 데스크톱 내비게이션 (ADR-10)
- 화면 폭 ≥1024px: `.snw-app` 2열 그리드 상시
- 라우팅 전환 시 사이드바 닫힘 가드: `window.innerWidth < 1024` 필수

## 하단 레이아웃 스택 (ADR-9)
- Now Playing 활성 시 `body.has-nowplaying` 토글
- AI FAB/Toast 76px→124px, 메인 패딩 80px→128px

## 참조
- SPEC §5.4 (프론트엔드 자산)
- CONTRACT §7.17~7.18 (UI/AUDIT2)
