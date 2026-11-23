# `W10_Web_Const_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Const_0203.h

`CL_W10_WebAPI` 및 `W10_Web_*.cpp` 라우트 핸들러들이 공유하는 **HTTP 상태 코드, MIME 타입 문자열, API 경로 접두사, 업로드/WS 버퍼 제한 상수**를 정의하는 웹 상수 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **웹 API 경로 및 MIME 상수** (`G_W10_*`)
    *   **설명:** `/api/v001/` 기본 경로, `application/json`, `text/html`, `application/javascript`, `text/css` 등 공통 문자열 상수입니다.
    *   **사용처:** `W10_Web_Static_0203.cpp`, `W10_Web_Util_0203.cpp`, `W10_Web_Routes_*.cpp` 전역에서 응답 헤더 및 라우트 등록 시 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| *(상수 전용 헤더)* | - | 별도 함수 없이 웹 서버 공통 상수만 제공합니다. | 1. 중복 문자열 리터럴을 제거해 Flash 메모리를 절약합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>`**:
    *   기본 정수형 및 PROGMEM/문자열 상수 정의에 사용됩니다.
