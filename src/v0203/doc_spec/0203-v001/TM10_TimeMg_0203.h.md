# `TM10_TimeMg_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: TM10_TimeMg_0203.h

Wi-Fi 연결 이벤트에 연동해 **다중 NTP 서버(Primary 1개 + Fallback 3개) SNTP 동기화**, **타임존(`s_tz`) 적용**, **동기화 유효성(`s_timeValid`) 및 최근 동기화 여부(`s_timeSyncedRecently`) 관리**를 수행하는 정적 매니저 `CL_TM10_TimeManager` 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_TM10_TimeManager`** (`class`)
    *   **설명:** SNTP 서버 목록(`s_serverList[4][64]`), 동기화 주기(`s_syncIntervalMs = 6시간`), 타임아웃 재시도 상태(`s_waitingCallback`, `s_activeServerIdx`) 및 `s_mutex`를 관리하는 정적 클래스입니다.
    *   **사용처:** `A00_Main_0203.cpp`, `WF10_WiFiMgr`, `CT10_Ctl`(스케줄/Auto-Off 시각 판정), `N10_NvsManager`(AI 일일 리셋 날짜 확인)에서 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin`** | `static void` | 타임 매니저를 초기화하고 기본 타임존·서버 목록을 설정합니다. | 1. `s_mutex` 생성 및 `_setDefaults()` 호출로 기본 NTP 설정을 준비합니다. |
| **`onWiFiConnected` / `onWiFiDisconnected`** | `static void` | Wi-Fi 연결/해제 시 SNTP 동작을 시작하거나 중단합니다. | 1. 연결 시 `s_wifiUp = true` 설정 후 시스템 타임존·서버를 복사해 `_startSntpWithServer(0)`을 시작합니다. <br>2. 해제 시 `_stopSntp()`로 대기 상태를 정리합니다. |
| **`applyTimeConfig` / `requestTimeSync`** | `static void` | 시스템 설정 변경 시 NTP/타임존을 재적용하거나 즉시 동기화를 요청합니다. | 1. `p_force` 옵션으로 강제 재동기화를 트리거할 수 있습니다. |
| **`tick`** | `static void` | 메인 루프에서 호출되어 SNTP 응답 타임아웃, 폴백 서버 전환, 6시간 주기 재동기화를 처리합니다. | 1. 콜백 대기 타임아웃 시 `_switchToNextServer()`로 다음 서버(0~3)로 전환합니다. <br>2. `_updateSyncedRecently()`로 최근 동기화 플래그를 갱신합니다. |
| **`isTimeValid` / `isTimeSyncedRecently` / `getLocalTime`** | `static bool` | 현재 시스템 시각 유효성, 최근 동기화 여부 및 로컬 `struct tm`을 조회합니다. | 1. `s_mutex` 보호 하에 `_isTimeSane()` 및 `localtime_r` 결과를 반환합니다. |
| **`toJson`** | `static void` | 현재 시각, 유효성, 활성 NTP 서버 정보를 `JsonDocument`에 기록합니다. | 1. 웹 UI/API 시스템 상태 응답에 시간 정보를 제공합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<time.h>`**:
    *   POSIX `struct tm`, `localtime_r`, `setenv("TZ", ...)` 및 SNTP 시간 변환에 사용됩니다.
*   **`<freertos/FreeRTOS.h>` / `<freertos/semphr.h>`**:
    *   `s_mutex`를 통한 멀티태스크 시간 상태 접근 보호에 사용됩니다.
*   **`"A20_Const_0203.h"` / `"D10_Logger_0203.h"` / `"A40_Com_Utils_0203.h"`**:
    *   기본 NTP 폴백 서버 상수(`G_TIME_NTP_FALLBACK_SERVERS`), 로깅 및 안전 문자열 복사에 사용됩니다.
