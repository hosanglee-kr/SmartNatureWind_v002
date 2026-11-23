# `N10_NvsManager_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: N10_NvsManager_0203.cpp

`N10_NvsManager_0203.h`에 선언된 `CL_N10_NvsManager`의 구현부로, NVS(`"SNW_RUN"`) 초기화·복구, 10초 지연 쓰기(`flushIfNeeded`), 런타임 상태/오버라이드/수동 세션/Auto-Comfort 저장, 및 Gemini AI 일일 사용량 누적·리셋을 구현합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_N10_RuntimeState_t` / `ST_N10_AIDailyUsage_t` / `ST_N10_DirtyFlags_t`**
    *   **설명:** `N10_NvsManager_0203.h`에 정의된 런타임 상태, AI 일일 사용량, Dirty 플래그 구조체입니다.
    *   **사용처:** `s_state`, `s_aiUsage`, `s_dirty` 정적 멤버로 선언되어 NVS 로드/저장 및 `toJson()` 직렬화에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin` / `end` / `clearAll`** | `bool` / `void` | NVS 네임스페이스를 열고 초기 상태를 로드하거나 전체 초기화합니다. | 1. `s_mutex` 생성 및 `s_prefs.begin(G_N10_NS_RUNTIME, false)` 호출. <br>2. `loadRuntimeFromNvs()`로 기존 런타임 및 AI 일일 사용량을 복원합니다. |
| **`markDirty` / `flushIfNeeded` / `tick`** | `void` | Dirty 플래그를 세우고 10초 주기(`G_N10_SAVE_INTERVAL_MS`)로 NVS에 반영합니다. | 1. `millis()` 경과 시간을 확인해 10초 이상 경과 시 `flush(false)`를 호출합니다. |
| **`loadRuntimeFromNvs` / `flush`** | `void` | NVS에서 키별 값을 읽어오거나(`load`), 변경된 값을 NVS에 기록(`flush`)합니다. | 1. `s_prefs.getUChar/getShort/getFloat/getString`으로 복원하고 `v_setFail` 여부로 쓰기 실패를 감지합니다. |
| **`setRunMode` / `setLastSchedule` / `setLastUserProfile`** | `void` | 실행 모드, 소스 및 마지막 스케줄/프로필 번호를 갱신합니다. | 1. `s_mutex` 보호 하에 `s_state`를 갱신하고 `markDirty()`를 호출합니다. |
| **`setOverrideFixed` / `setOverridePreset` / `clearOverride`** | `void` | 고정 풍속·프리셋 오버라이드 상태를 설정하거나 해제합니다. | 1. 오버라이드 모드와 파라미터를 갱신하고 Dirty 플래그를 설정합니다. |
| **`setManualSession` / `setManualOvrSchedule` / `setAutoComfort`** | `void` | 수동 세션 활성, 스케줄 우선권, Auto-Comfort 상태를 갱신합니다. | 1. 상태 변경 후 NVS 지연 저장을 예약합니다. |
| **`saveAIDailyUsageInternal` / `addAIAudioUsage` / `resetAIDailyUsageIfNeeded`** | `void` / `bool` | Gemini Live 오디오 초·턴 수·추정 비용을 누적하고 날짜 변경 시 리셋합니다. | 1. `addAIAudioUsage` 호출 시 `saveAIDailyUsageInternal()`로 즉시 NVS에 기록해 재부팅 시에도 일일 한도가 유지됩니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"N10_NvsManager_0203.h"`**:
    *   `CL_N10_NvsManager` 클래스, 키 상수(`G_N10_KEY_*`) 및 상태 구조체 선언을 제공합니다.
*   **`"A40_Com_Utils_0203.h"`**:
    *   `CL_A40_MutexGuard_Semaphore` 및 안전 문자열/로깅 유틸리티를 제공합니다.
*   **`<nvs.h>` / `<nvs_flash.h>`**:
    *   ESP-IDF NVS 플래시 초기화 및 저수준 NVS 상태 확인에 사용됩니다.
