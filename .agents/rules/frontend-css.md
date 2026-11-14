---
trigger: glob
globs: "src/v0203/data_v0203_src/**/*.css"
description: "v0203 웹 프론트엔드 CSS 규칙"
---

# 프론트엔드 CSS 규칙 (v0203)

## Z-index 계층 (ADR-4 + 0203_012)
`header(50) < nowplaying(95) < ai-fab(990) < bottom-nav(1000) < sidebar-overlay(1040) < sidebar(1050) < modal(1100) < toast(1200)`

- CSS 변수로 관리: `--snw-z-*`

## 하단 뷰포트 스택 (ADR-9 / 0203_012)
| 상태 | `--snw-fab-bottom` | `--snw-content-pb` |
|---|---|---|
| 기본 | 76px (데스크톱 24px) | 80px (데스크톱 24px) |
| `body.has-nowplaying` | 124px (데스크톱 72px) | 128px (데스크톱 72px) |

- `transition: bottom 0.25s` 로 부드럽게 부상

## 모바일 터치 접근성 (UI-7)
- 바람 스타일 탭: `min-height: 44px; padding: 10px 6px`

## 모달 구조 (UI-1)
- `.snw-modal-box`: Flexbox, Header/Body/Footer
- Body만 `overflow-y: auto` (Header/Footer 고정)

## 세그먼트 그리드 (UI-2)
- `.snw-seg-grid`: 2열 그리드
- 삭제 시 Undo 토스트로 복원

## 데스크톱 영구 사이드바 (ADR-10)
- `min-width: 1024px` → `.snw-app` 2열 그리드 (`var(--snw-sidebar-w) 1fr`)
- `#btn-menu` 은닉

## 참조
- SPEC §5.4.2.1 (레이아웃 스택 표준화)
- CONTRACT §7.17 (UI-5~UI-8)
