# `W10_Web_Upload_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Upload_0203.cpp

**LittleFS 파일 업로드(`POST /api/v001/fileUpload`)** 및 **OTA 펌웨어 업데이트(`POST /api/v001/fwUpdate`)**를 구현하며, **2MB(`G_W10_MAX_UPLOAD_SIZE`) 크기 제한**, **경로 탐색(Path Traversal) 차단(`extractSafeFileName`)**, **동시 업로드 잠금(`G_W10_UPLOAD_BUSY_TAG`)**을 제공하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`s_upFile` / `s_uploadError` / `s_uploadTotal`**
    *   **설명:** 현재 진행 중인 멀티파트 파일 업로드 핸들, 오류 플래그 및 누적 바이트 카운터입니다.
    *   **사용처:** `routeUpload()`의 청크 수신 콜백에서 2MB 초과 및 쓰기 오류를 감시합니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`extractSafeFileName` / `getUploadPath`** | `static String` / `String` | 업로드 파일명에서 디렉토리 구분자(`/`, `\`)를 제거하고 확장자별 안전 저장 경로를 생성합니다. | 1. Path Traversal 공격을 차단하고 `.json`/`.html`/`.js` 등 지정 경로로 매핑합니다. |
| **`routeUpload`** | `void` | `POST /api/v001/fileUpload` 멀티파트 청크를 LittleFS에 기록합니다. | 1. `G_W10_UPLOAD_BUSY_TAG`로 동시 업로드를 차단하고 2MB 초과 시 즉시 중단합니다. |
| **`routeUpdate`** | `void` | `POST /api/v001/fwUpdate`로 ESP32 `Update.begin/write/end` OTA 펌웨어 플래싱을 수행합니다. | 1. 성공 시 재부팅을 예약하고 실패 시 `Update.errorString()`을 JSON으로 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `<Update.h>` / `<LittleFS.h>`**:
    *   ESP32 OTA 플래시 기록(`Update`) 및 LittleFS 파일 저장에 사용됩니다.
