# `A20_Const_Wifi_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: A20_Const_Wifi_0203.h

ESP32-S3 Wi-Fi 동작 모드(`EN_A20_WIFI_MODE_t`), SoftAP 설정(`ST_A20_WifiApConfig_t`), STA 공유기 항목(`ST_A20_WifiStaEntry_t`) 및 전체 Wi-Fi 설정 컨테이너(`ST_A20_WifiConfig_t`)를 정의하는 상수·구조체 헤더입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`EN_A20_WIFI_MODE_t`** (`enum`)
    *   **설명:** Wi-Fi 동작 모드(SoftAP, STA, AP+STA 등)를 나타내는 열거형입니다.
    *   **사용처:** `ST_A20_WifiConfig_t::wifiMode` 및 `CL_WF10_WiFiManager::init()`에서 네트워크 모드 분기에 사용됩니다.
*   **`ST_A20_WifiApConfig_t` / `ST_A20_WifiStaEntry_t`** (`struct`)
    *   **설명:** SoftAP SSID/비밀번호 및 개별 STA 공유기 SSID/비밀번호 구조체입니다.
    *   **사용처:** `ST_A20_WifiConfig_t` 내부 멤버로 포함되어 `C10_Config_Sys_0203.cpp`에서 JSON 로드·저장에 사용됩니다.
*   **`ST_A20_WifiConfig_t`** (`struct`)
    *   **설명:** Wi-Fi 모드, AP 설정, STA 목록(`sta[MAX_STA_NETWORKS]`)을 담는 최상위 Wi-Fi 설정 구조체입니다.
    *   **사용처:** `g_A20_config_root.wifi` 및 `CL_WF10_WiFiManager::applyConfig()`에서 사용됩니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| *(구조체/상수 전용 헤더)* | - | 별도 함수 선언 없이 Wi-Fi 설정 데이터 모델만 정의합니다. | 1. `A20_Const::LEN_SSID` 등 고정 길이 버퍼를 사용해 동적 메모리 할당을 배제합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`<Arduino.h>`**:
    *   기본 정수형(`uint8_t`) 타입 정의에 사용됩니다.
*   **`"A20_Const_Const_0203.h"`**:
    *   `LEN_SSID`, `MAX_STA_NETWORKS` 등 Wi-Fi 버퍼 길이 상수를 제공합니다.
