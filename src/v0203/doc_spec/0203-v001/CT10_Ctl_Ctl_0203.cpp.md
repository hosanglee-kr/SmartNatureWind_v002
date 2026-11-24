# `CT10_Ctl_Ctl_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: CT10_Ctl_Ctl_0203.cpp

`CL_CT10_ControlManager`의 **초기화·재로드(`begin`, `reloadAll`)**, **40ms 메인 제어 루프(`tickLoop`)**, **Session FSM 생명주기(`startSession`, `pauseSession`, `resumeSession`, `stopSession`)**, **Auto-Off 타이머(`setSessionAutoOff`, `getSessionAutoOffRemainSec`)** 및 **대기 스케줄 갱신(`updatePendingScheduleInfo`)**을 구현하는 핵심 제어 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`EN_CT10_session_type_t` / `ST_CT10_Session_t`**
    *   **설명:** Playlist/Preset/Fixed/AutoFull/AutoSelect 등 세션 유형 열거형 및 현재 세션 상태(`pausedAtMs`, `trigger`) 구조체입니다.
    *   **사용처:** `startSession()`, `pauseSession()`, `resumeSession()`, `stopSession()`의 Session FSM 전이에 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin` / `reloadAll`** | `void` / `bool` | PWM·시뮬레이션·센서를 초기화하거나 `C10_ConfigManager::loadAll`로 설정을 무중단 재로드합니다. | 1. 새 설정 로드 성공 시 원자적으로 스냅샷을 교체하고 `s_lastReloadOk`를 갱신합니다. |
| **`tickLoop`** | `void` | 40ms 주기로 오버라이드·세션·스케줄·Auto-Comfort·시뮬레이션·모니터링을 실행합니다. | 1. 우선순위(오버라이드 → 프로필 → 스케줄)에 따라 `tick*()`을 호출합니다. <br>2. `CT10_WS_tick()`으로 변경된 상태를 브로드캐스트합니다. |
| **`startSession` / `startPlaylistManual` / `startPresetManual` / `startFixedManual`** | `bool` | 수동/자동 세션을 시작하고 Session FSM을 `ACTIVE`로 전이합니다. | 1. 페이로드(`profileId`, `presetCode`, `percent`)를 해석해 즉시 풍속을 적용합니다. |
| **`pauseSession` / `resumeSession` / `stopSession`** | `bool` | 세션을 일시정지·재개(Smart Resume 5분/30분)·완전 종료합니다. | 1. `resumeSession()`은 `millis() - pausedAtMs` 경과 시간에 따라 연속 재개 또는 Step 1 리셋을 수행합니다. |
| **`setSessionAutoOff` / `clearSessionAutoOff` / `getSessionAutoOffRemainSec`** | `bool` / `void` / `uint32_t` | 세션 자동 종료 타이머(분)를 설정·해제하고 일시정지 누적 시간을 제외한 잔여 초를 반환합니다. | 1. `pausedAccumMs`를 차감해 정확한 실제 가동 잔여 시간을 계산합니다. |
| **`updatePendingScheduleInfo`** | `void` | 수동 세션 실행 중 대기 중인 다음 스케줄 정보를 갱신합니다. | 1. [Stage 5] 현재 시각과 스케줄 `startTime`/`endTime`을 비교해 UI 배지용 정보를 채웁니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"CT10_Ctl_0203.h"` / `"C10_Config_0203.h"` / `"N10_NvsManager_0203.h"`**:
    *   제어 매니저 선언, 설정 재로드 및 세션 NVS 저장에 사용됩니다.
*   **`"A40_Com_Utils_0203.h"` / `"TM10_TimeMg_0203.h"`**:
    *   `A40_parseHHMMtoMin_24h` 스케줄 시각 파싱 및 JSON 유틸리티에 사용됩니다.
