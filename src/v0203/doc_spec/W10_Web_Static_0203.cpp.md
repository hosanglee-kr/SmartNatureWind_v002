# `W10_Web_Static_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Static_0203.cpp

LittleFS에 저장된 **Gzip Level 9 정적 웹 에셋(`P010_bundle_0203.js.gz`, `P000_common_0203.css.gz`, `index.html.gz`) 서빙**, **`Accept-Encoding: gzip` 협상**, **`pages.json` 기반 동적 메뉴 API(`W10_getMenuJson`)**, 및 **리다이렉트/캐시 헤더 제어**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_W10_PageEntry_t` / `ST_W10_MenuState_t`** (`struct`)
    *   **설명:** `pages.json`에서 로드한 SPA 페이지 목록 및 메뉴 상태 구조체입니다.
    *   **사용처:** `W10_loadPagesJson()`, `W10_getMenuJson()`, `routeStaticAssets()`에서 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`W10_guessMime`** | `const char*` | 파일 확장자(`.html`, `.js`, `.css`, `.json`, `.svg` 등)로 MIME 타입을 판별합니다. | 1. `W10_pathEndsWith`로 확장자를 검사해 적절한 Content-Type을 반환합니다. |
| **`W10_loadPagesJson` / `W10_getMenuJson`** | `bool` / `void` | `pages.json`을 파싱해 메뉴 상태(`s_menu_state`)를 로드하고 JSON으로 응답합니다. | 1. 페이지 수와 에셋 수를 집계해 동적 내비게이션 메뉴를 제공합니다. |
| **`W10_acceptsGzip` / `W10_registerGzipServe`** | `static bool` / `void` | 클라이언트 `Accept-Encoding` 헤더를 파싱해 `.gz` 파일을 직접 서빙합니다. | 1. `.html`은 `no-cache, must-revalidate`를, JS/CSS 번들은 장기 캐시 헤더를 적용합니다. |
| **`W10_registerStaticRoute` / `routeStaticAssets`** | `void` | SPA 루트(`/`, `/index.html`), 번들 JS/CSS, 리다이렉트 라우트를 일괄 등록합니다. | 1. `.gz` 파일 우선 서빙으로 Flash·네트워크 대역폭을 절약합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"W10_Web_Const_0203.h"` / `<LittleFS.h>`**:
    *   정적 에셋 경로 상수 및 LittleFS 파일 스트리밍에 사용됩니다.
