# `TM10_TimeMg_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: TM10_TimeMg_0203.cpp

`TM10_TimeMg_0203.h`에 선언된 `CL_TM10_TimeManager`의 구현부로, ESP-IDF `esp_sntp` 기반 다중 NTP 서버 동기화, 타임존(`TZ`) 설정, 시간 유효성(`_isTimeSane`) 검증, 폴백 서버 전환 및 6시간 주기 재동기화를 구현합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`CL_TM10_TimeManager`** (`class`)
    *   **설명:** `TM10_TimeMg_0203.h`에 정의된 정적 시간 관리 클래스입니다.
    *   **사용처:** `begin()`, `onWiFiConnected()`, `tick()`, `getLocalTime()` 등에서 SNTP 상태와 `s_serverList[4][64]`를 관리합니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`begin`** | `void` | 타임 매니저 뮤텍스를 생성하고 기본 NTP 설정을 초기화합니다. | 1. `s_mutex` 생성 후 `_setDefaults()`를 호출합니다. |
| **`_setDefaults` / `_copySysTime`** | `void` | 기본 또는 시스템 설정(`ST_A20_SystemConfig_t`)의 타임존·NTP 서버·주기를 복사합니다. | 1. Primary 1개 + Fallback 3개 서버를 `s_serverList`에 채우고 `syncIntervalMin`을 ms로 변환합니다. |
| **`_startSntpWithServer` / `_stopSntp`** | `void` | 지정 인덱스(`0~3`)의 NTP 서버로 `esp_sntp`를 시작하거나 중단합니다. | 1. `_onSntpTimeSync` 콜백을 등록하고 `s_waitingCallback = true`로 설정합니다. |
| **`_onSntpTimeSync`** | `void` | SNTP 동기화 완료 콜백으로 시간 유효성을 검증하고 상태를 갱신합니다. | 1. `_isTimeSane()`(연도 검증) 통과 시 `s_timeValid = true`, `s_lastSyncMs`를 갱신합니다. |
| **`_switchToNextServer`** | `void` | 현재 NTP 서버 응답 타임아웃 시 다음 폴백 서버(`(s_activeServerIdx + 1) % 4`)로 전환합니다. | 1. 서버 인덱스를 순환하며 `_startSntpWithServer()`를 재호출합니다. |
| **`onWiFiConnected` / `onWiFiDisconnected`** | `void` | Wi-Fi 연결/해제 이벤트에 따라 SNTP 동기화를 시작/중지합니다. | 1. 연결 시 `s_wifiUp = true` 설정 후 즉시 동기화를 요청합니다. |
| **`applyTimeConfig` / `requestTimeSync`** | `void` | 설정 변경 반영 또는 즉시/강제(`p_force`) 시간 동기화를 요청합니다. | 1. Wi-Fi 연결 중이면 변경된 서버/타임존으로 SNTP를 재시작합니다. |
| **`tick`** | `void` | 메인 루프에서 타임아웃 감시, 서버 전환, 주기적 재동기화를 수행합니다. | 1. `_updateSyncedRecently()`로 최근 동기화 윈도우(`G_TM10_SYNC_RECENT_WINDOW_MS`)를 갱신합니다. |
| **`isTimeValid` / `isTimeSyncedRecently` / `getLocalTime` / `toJson`** | `bool` / `void` | 시간 유효성, 최근 동기화 여부, 로컬 `struct tm`, JSON 상태 직렬화를 제공합니다. | 1. `s_mutex` 보호 하에 안전하게 상태를 조회·직렬화합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"TM10_TimeMg_0203.h"`**:
    *   `CL_TM10_TimeManager` 클래스 및 정적 상태 멤버 선언을 제공합니다.
*   **`<esp_sntp.h>`**:
    *   ESP-IDF SNTP 클라이언트 초기화(`esp_sntp_init`, `esp_sntp_setservername`, 콜백 등록)에 사용됩니다.
