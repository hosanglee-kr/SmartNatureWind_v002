# `W10_Web_Routes_WindDict_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_WindDict_0203.cpp

`[v0203 Stage 4]` **10종 자연풍 프리셋 및 5종 바람 스타일 사전 조회 API(`GET /api/v001/windDict`)**를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t`**
    *   **설명:** 10종 프리셋과 5종 스타일 메타데이터를 담는 바람 사전 구조체입니다.
    *   **사용처:** `routeWindDict()`에서 `CL_C10_ConfigManager::toJson_WindDict()`를 통해 직렬화할 때 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`CL_W10_WebAPI::routeWindDict`** | `void` | `GET /api/v001/windDict` 요청 시 전체 프리셋·스타일 사전을 JSON으로 반환합니다. | 1. `CL_C10_ConfigManager` 스냅샷을 `toJson_WindDict()`로 직렬화해 응답합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"C10_Config_0203.h"`**:
    *   웹 응답 유틸리티 및 바람 사전 JSON 직렬화에 사용됩니다.
