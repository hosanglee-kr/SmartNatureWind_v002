# `W10_Web_Routes_AILive_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: W10_Web_Routes_AILive_0203.cpp

Stage 8 **Gemini Live 실시간 양방향 음성 API(`routeAILive`)**를 구현하는 파일로, Live 세션 토큰/설정 발급, **30분(1800초) 일일 한도 차단(403)**, **Tool Call 실행 브리지**, 및 **NVS 일일 사용량/비용 조회·리셋** 엔드포인트를 제공합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_N10_AIDailyUsage_t`** (`struct`)
    *   **설명:** 오늘 누적 오디오 초(`audioSec`), 턴 수(`turnCount`), 추정 비용(`estCostUsdX1000`) 구조체입니다.
    *   **사용처:** `CL_N10_NvsManager`에서 조회·누적·리셋하여 Live 세션 과금 가드레일에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`W10_getGeminiApiKeySnapshot`** | `static const char*` | 설정에서 `geminiApiKey` 스냅샷을 안전하게 조회합니다. | 1. Live 세션 시작 시 API 키 존재 여부를 검증합니다. |
| **`CL_W10_WebAPI::routeAILive`** | `void` | `/api/v001/ai/live-*` 및 `/cost-*` 라우트 일체를 등록·처리합니다. | 1. `CT10_AI::buildAIPromptStrict("ko", false)`로 Live 시스템 프롬프트를 제공합니다. <br>2. 일일 오디오 한도 초과 시 `403`을 반환하고, `CT10_AI::executeAIAction`으로 음성 Tool Call을 실행합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"W10_Web_0203.h"` / `"CT10_Ctl_0203.h"` / `"N10_NvsManager_0203.h"`**:
    *   웹 라우트 등록, AI 도구 실행 및 NVS 일일 비용 영구 기록에 사용됩니다.
