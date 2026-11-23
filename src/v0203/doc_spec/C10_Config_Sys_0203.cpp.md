# `C10_Config_Sys_0203.cpp` 상세 Spec

## ⚙️ 시스템 스펙 요약: C10_Config_Sys_0203.cpp

`CL_C10_ConfigManager`의 **시스템(`system`), Wi-Fi(`wifi`), 모션(`motion`) 설정**에 대한 LittleFS JSON 로드·저장 및 부분 패치(`patchSystemFromJson`)를 구현하는 파일입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_SystemConfig_t`**
    *   **설명:** 메타데이터, 로깅, WebSocket 채널/스로틀, 보안(API Key/Gemini Key), NTP/타임존, 팬 PWM 한계, PIR/온습도 센서 설정을 담는 최상위 시스템 설정 구조체입니다.
    *   **사용처:** `loadSystemConfig`, `saveSystemConfig`, `patchSystemFromJson`의 입출력 매개변수로 사용됩니다.
*   **`ST_A20_WifiConfig_t`**
    *   **설명:** Wi-Fi 동작 모드(SoftAP/STA), AP SSID/비밀번호 및 STA 공유기 목록을 담는 구조체입니다.
    *   **사용처:** `loadWifiConfig`, `saveWifiConfig`의 입출력 매개변수로 사용됩니다.
*   **`ST_A20_MotionConfig_t`**
    *   **설명:** PIR 인체감지 및 온습도 연동 시뮬레이션 기본 프리셋/스타일(`presetCode`, `styleCode`)을 담는 구조체입니다.
    *   **사용처:** `loadMotionConfig`, `saveMotionConfig`의 입출력 매개변수로 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`C10_wsChannelFromName`** | `static int8_t` | WebSocket 채널명 문자열을 내부 채널 인덱스로 변환합니다. | 1. 채널명 매핑 테이블을 순회해 일치하는 인덱스를 반환합니다. <br>2. 미일치 시 `-1`을 반환합니다. |
| **`CL_C10_ConfigManager::loadSystemConfig`** | `bool` | LittleFS에서 시스템 설정 JSON을 로드해 `p_cfg`에 채웁니다. | 1. `A40_IO::Load_File2JsonDoc_V21`로 백업(`.bak`) 포함 로드를 수행합니다. <br>2. WS 채널 간격(`20~60000ms`), `chartLargeBytes`(`256~60000`), `apiKey`/`geminiApiKey`, NTP/타임존을 `clampVal`로 범위 보정합니다. |
| **`CL_C10_ConfigManager::loadWifiConfig`** | `bool` | LittleFS에서 Wi-Fi 설정 JSON을 로드해 `p_cfg`에 채웁니다. | 1. AP SSID/Pass 및 STA 목록(`ssid`, `pass`)을 파싱합니다. <br>2. 로드 실패 시 `A23_Com_ResetCfg_0203.h` 기본값으로 폴백합니다. |
| **`CL_C10_ConfigManager::loadMotionConfig`** | `bool` | LittleFS에서 모션/시뮬레이션 기본 설정을 로드합니다. | 1. `presetCode`, `styleCode` 및 센서 연동 파라미터를 추출합니다. |
| **`CL_C10_ConfigManager::saveSystemConfig`** | `bool` | `ST_A20_SystemConfig_t`를 JSON으로 직렬화해 LittleFS에 저장합니다. | 1. `A40_IO::Save_JsonDoc2File_V21`로 `.tmp` → `.bak` → 원자적 교체를 수행합니다. |
| **`CL_C10_ConfigManager::saveWifiConfig`** | `bool` | `ST_A20_WifiConfig_t`를 JSON으로 직렬화해 LittleFS에 저장합니다. | 1. AP/STA 설정을 직렬화하고 백업과 함께 원자적 저장을 수행합니다. |
| **`CL_C10_ConfigManager::saveMotionConfig`** | `bool` | `ST_A20_MotionConfig_t`를 JSON으로 직렬화해 LittleFS에 저장합니다. | 1. 모션·프리셋 설정을 직렬화해 원자적 저장을 수행합니다. |
| **`CL_C10_ConfigManager::patchSystemFromJson`** | `bool` | 웹 UI/API에서 전달된 부분 JSON 패치를 `p_config`에 반영합니다. | 1. `meta`, `logging`, `ws`, `security`, `fan`, `pir`, `th` 섹션별 변경 여부를 추적(`v_changed`)합니다. <br>2. 각 수치 필드를 안전 범위로 `clampVal` 보정한 뒤 변경 시 `true`를 반환합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"C10_Config_0203.h"`**:
    *   `CL_C10_ConfigManager` 클래스 선언 및 설정 뮤텍스 인터페이스를 제공합니다.
*   **`"A40_Com_Utils_0203.h"`**:
    *   `A40_ComFunc::Json_getStr/Num`, `clampVal`, `A40_IO` 원자적 파일 I/O 및 `CL_A40_MutexGuard_Semaphore`를 제공합니다.
*   **`"A23_Com_ResetCfg_0203.h"`**:
    *   JSON 로드 실패 시 기본 설정 구조체 초기화(`A20_resetXxxDefault`)에 사용됩니다.
*   **`<cstring>`**:
    *   문자열 비교 및 버퍼 길이를 처리합니다.
