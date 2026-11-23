# `A20_Const_Wifi_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: A20_Const_Wifi_0203.h



이 파일은 ESP32-S3 C++17 임베디드 시스템에서 사용되는 WiFi 설정 상수를 정의하는 헤더 파일입니다.

## 2. 주요 클래스/구조체/열거형

### A20_Const_Wifi_0203.h
```cpp
#pragma once
#include <Arduino.h>
#include <A20_Const::LEN_SSID.h> // SSID 길이 상수 포함
#include <ST_A20_WIFI_MODE_t.h>   // WiFi 모드 타입 정의

typedef struct {
    char ssid[A20_Const::LEN_SSID];  // SSID 문자열
    EN_A20_WIFI_MODE_t wifi_mode;     // WiFi 모드 (STA, AP_STA 등)
    ST_A20_WIFI_MODE_t sta[A20_Const::MAX_STA_NETWORKS];  // STA 연결 목록
} A20_WifiConfig_t;
```

### A20_Const::LEN_SSID.h
```cpp
#pragma once

#define LEN_SSID 32
```

### ST_A20_WIFI_MODE_t.h
```cpp
#pragma once

typedef enum {
    EN_A20_WIFI_MODE_STA = 1,
    EN_A20_WIFI_MODE_AP_STA = 2,
} ST_A20_WIFI_MODE_t;
```


### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)


### A20_Const_Wifi_0203.h
- `A20_WifiConfig_t` 구조체를 정의하여 WiFi 설정을 저장합니다.
  - `ssid`: SSID 문자열 (최대 길이: 32자)
  - `wifi_mode`: 현재 사용하는 WiFi 모드 (STA, AP_STA 등)
  - `sta`: STA 연결 목록 (최대 수량: MAX_STA_NETWORKS)

## 4. 외부 의존성 / 공유 상태 / 락(Mutex 등) 특징

- 이 파일은 직접적인 외부 의존성을 가지지 않습니다.
- `A20_Const::LEN_SSID.h`와 `ST_A20_WIFI_MODE_t.h`는 이 파일에 포함되어 있습니다.
- `wifi_mode`와 `sta`는 공유 상태로 사용되며, 동기화를 위해 Mutex 등의 락을 사용해야 합니다.
