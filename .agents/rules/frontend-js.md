---
trigger: glob
globs: "src/v0203/data_v0203_src/**/*.js"
description: "v0203 웹 프론트엔드 JS 규칙"
---

# 프론트엔드 JS 규칙 (v0203)

## ⚠️ 번들 산출물 직접 편집 금지 (필수)
- `app_core_0203.js`, `app_ui_0203.js`, `app_pages_0203.js`는 `pio_gzip_0203.py`가 생성하는 **번들 결과물**이므로 **절대 직접 수정하지 않는다.**
- 반드시 `src/v0203/data_v0203_src/html_v0203/js/*.js` 원본 모듈 파일을 수정한 뒤 `pio_gzip_0203.py`(또는 `uploadfs`)로 번들링한다.

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

## 도메인 표시명 단일 SSOT (0203_015+)
- 프리셋/스타일/프로필 명칭 출력 시 원시 `code`·로컬 한글 배열 하드코딩 금지 → 반드시 `SNW.I18n.presetName` / `styleName` / `presetStyleName` / `profileName` 경유
- 사용자 커스텀 항목은 `nameEn` / `nameKo` → `name` 폴백 유지

## 상태 변경 API 중앙 동기화 (0203_015+)
- UI 핸들러마다 개별 `StoreBridge.refreshNow()` 호출 대신 `040.api.js` 세션 제어 API(`startSession`, `pauseSession`, `resumeSession`, `stopSession`, `patchSessionRule`) 성공 시 자동 `refreshNow()` 호출 유지

## 공용 모달 타이머 레이스 & 다단계 가드
- `SNW.UI.modal()` 닫힘 `setTimeout` 핸들(`_modalCloseTimer`) 보관 후 재호출 시 `clearTimeout` 선행
- 다단계 모달(`Onboarding` 등)은 재진입 가드(`_running`) 및 모든 단계 `onCancel` 콜백 필수

## 구독형 UI 초기 렌더 & `active` 추론
- `Store.subscribe()` 등록 컴포넌트는 `init()`/`mount()` 말미에 초기 1회 `render()` 호출 (`StoreBridge.start()`도 초기 `refreshNow()` 호출)
- `normalizeSession()`은 `s.active` 미정의 시 `typeName !== 'NONE' && stateStr !== 'COMPLETED'` 기준 `active: true` 추론

## 활성 `PRESET` 세션 스타일 전환
- `PRESET` 세션 가동 중 스타일 변경 시 `patchSim()`만 호출하지 말고 `startPreset(presetCode, styleCode)`로 활성 세션을 함께 전환

## 참조
- SPEC §5.4 (프론트엔드 자산)
- CONTRACT §7.17~7.18 (UI/AUDIT2)
