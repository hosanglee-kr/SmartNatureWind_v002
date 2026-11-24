# `N10_NvsManager_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: N10_NvsManager_0203.h

ESP32 NVS(`Preferences`, 네임스페이스 `"SNW_RUN"`)에 **런타임 상태(실행 모드, 오버라이드, 수동 세션, Auto-Comfort)**와 **Stage 8 Gemini AI 일일 사용량(오디오 초·턴 수·추정 비용)**을 10초 주기(`G_N10_SAVE_INTERVAL_MS`) 지연 쓰기(Dirty-Flag Flush)로 영구 저장하는 정적 매니저 `CL_N10_NvsManager` 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_N10_RuntimeState_t`** (`struct`)
    *   **설명:** `runMode`(0=OFF, 1=SCHEDULE, 2=USER_PROFILE), `runSource`, `overrideEnabled/Mode`, `manualActive/OvrSchedule`, `autoComfortEnabled`를 보관하는 런타임 상태 구조체입니다.
    *   **사용처:** `getState()`, `toJson()`, `loadRuntimeFromNvs()`에서 재부팅 후 상태 복원에 사용됩니다.
*   **`ST_N10_AIDailyUsage_t`** (`struct`)
    *   **설명:** 오늘 누적 오디오 초(`audioSec`, 상한 1800초=30분), Live 턴 수(`turnCount`), 추정 비용(`estCostUsdX1000`)을 보관하는 구조체입니다.
    *   **사용처:** `getAIDailyUsage()`, `addAIAudioUsage()`, `resetAIDailyUsageIfNeeded()`에서 일일 한도 가드레일에 사용됩니다.
*   **`ST_N10_DirtyFlags_t`** (`struct`)
    *   **설명:** NVS 플래시 마모 방지를 위한 지연 저장 Dirty 플래그(`runtime`)입니다.
    *   **사용처:** `markDirty()`, `flushIfNeeded()`, `tick()`에서 10초 주기 일괄 저장 판단에 사용됩니다.
*   **`CL_N10_NvsManager`** (`class`)
    *   **설명:** NVS 키 상수(`G_N10_KEY_*`), `s_mutex`, `s_prefs` 및 정적 접근 메서드를 제공하는 싱글턴 매니저입니다.
    *   **사용처:** `CT10_Ctl`, `W10_Web_Routes_AILive`, `A00_Main` 전역에서 영구 상태 저장에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin` / `end` / `clearAll`** | `static bool` / `void` | NVS 네임스페이스(`SNW_RUN`)를 열고 초기 상태를 로드하거나 전체 삭제합니다. | 1. `s_mutex` 생성 및 `s_prefs.begin()` 수행 후 `loadRuntimeFromNvs()`를 호출합니다. |
| **`tick` / `flushIfNeeded` / `markDirty`** | `static void` | 변경된 런타임 상태를 10초 간격(`G_N10_SAVE_INTERVAL_MS`)으로 NVS에 기록합니다. | 1. `s_dirty.runtime`이 참이고 경과 시간이 10초 이상이면 `flush(false)`를 실행해 플래시 수명을 보호합니다. |
| **`setRunMode` / `setLastSchedule` / `setLastUserProfile`** | `static void` | 현재 실행 모드, 소스 및 마지막 스케줄/프로필 번호를 갱신합니다. | 1. `s_state`를 갱신하고 `markDirty()`를 설정합니다. |
| **`setOverrideFixed` / `setOverridePreset` / `clearOverride`** | `static void` | 고정 풍속 또는 프리셋 오버라이드 상태를 저장·해제합니다. | 1. 오버라이드 모드/값 변경 후 Dirty 플래그를 세웁니다. |
| **`setManualSession` / `setManualOvrSchedule` / `setAutoComfort`** | `static void` | 수동 세션 활성 여부, 스케줄 우선권 및 Auto-Comfort 활성 상태를 관리합니다. | 1. 관련 플래그 갱신 후 NVS 지연 저장을 예약합니다. |
| **`getAIDailyUsage` / `addAIAudioUsage` / `resetAIDailyUsageIfNeeded`** | `static ST_N10_AIDailyUsage_t` / `bool` | Gemini Live 일일 오디오 시간·턴·비용을 누적하고 날짜 변경 시 리셋합니다. | 1. `saveAIDailyUsageInternal()`을 통해 즉시 NVS에 기록하여 과금 한도 우회를 방지합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Preferences.h>`**:
    *   ESP32 NVS 키-값 영구 저장소 접근에 사용됩니다.
*   **`<freertos/FreeRTOS.h>` / `<freertos/semphr.h>`**:
    *   `s_mutex`를 통해 멀티태스크 환경에서 `s_state`·`s_aiUsage` 동시 접근을 보호합니다.
*   **`"A20_Const_0203.h"` / `"C10_Config_0203.h"` / `"D10_Logger_0203.h"`**:
    *   전역 상수, 설정 참조 및 NVS 오류 로깅에 사용됩니다.
