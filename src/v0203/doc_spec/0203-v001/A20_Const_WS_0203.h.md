# `A20_Const_WS_0203.h` 상세 Spec

### 파일 역할 요약

이 소스 파일은 ESP32-S3 C++17 임베디드 시스템에서 A20-WS 모듈의 웹소켓 설정을 관리하는 데 사용됩니다. 이 파일에서는 각 채널의 기본 정보와 웹소켓 관련 설정을 정의하고 있습니다.

### 헤더 및 열거형

1. **헤더**:
   - `#include <Arduino.h>`
   - `#include "A20_Const_WS_0203.h"`

2. **열거형**:
   - `EN_A20_WS_CH_INDEX_t`: A20-WS 모듈의 채널 인덱스를 나타내는 열거형입니다.
     ```cpp
     typedef enum {
         EN_A20_WS_CH_STATE,
         EN_A20_WS_CH_METRICS,
         EN_A20_WS_CH_CHART,
         EN_A20_WS_CH_SUMMARY
     } EN_A20_WS_CH_INDEX_t;
     ```

### 주요 함수/메서드 및 동작

1. **구조체**:
   - `ST_A20_WS_CH_Base_t`: 채널의 기본 정보를 저장하는 구조체입니다.
     ```cpp
     typedef struct {
         const EN_A20_WS_CH_INDEX_t chIdx;
         const char* chName;
         const uint16_t chDefaultIntervalMs;
         const uint8_t defaultPriority;
     } ST_A20_WS_CH_Base_t;
     ```
   - `ST_A20_wsEtcConfig_t`: 웹소켓 관련 설정을 저장하는 구조체입니다.
     ```cpp
     typedef struct {
         uint16_t chartLargeBytes;
         uint8_t  chartThrottleMul; // 2 (interval * 2)
     } ST_A20_wsEtcConfig_t;
     ```

2. **전역 변수**:
   - `G_A20_WS_CH_Base_Arr`: 각 채널의 기본 정보를 저장하는 배열입니다.
     ```cpp
     inline constexpr ST_A20_WS_CH_Base_t G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_COUNT] = {
         { EN_A20_WS_CH_STATE,   "state",   800,  0 },
         { EN_A20_WS_CH_METRICS, "metrics", 1500, 1 },
         { EN_A20_WS_CH_CHART,   "chart",   1200, 2 },
         { EN_A20_WS_CH_SUMMARY, "summary", 1200, 3 }
     };
     ```
   - `G_A20_WS_ETC_DEFAULT_CONFIG`: 웹소켓 관련 설정을 저장하는 변수입니다.
     ```cpp
     inline constexpr ST_A20_wsEtcConfig_t G_A20_WS_ETC_DEFAULT_CONFIG = {
         1024, // chartLargeBytes
         10000 // chartThrottleMul (interval * 2)
     };
     ```

### 외부 의존성

- `Arduino.h`: Arduino 프레임워크를 사용하기 위한 헤더 파일입니다.
- `A20_Const_WS_0203.h`: A20-WS 모듈의 상수 및 설정을 정의하는 헤더 파일입니다.

### 특이사항

- `EN_A20_WS_CH_INDEX_t` 열거형은 각 채널에 대한 인덱스를 나타냅니다.
- `ST_A20_WS_CH_Base_t` 구조체는 채널의 기본 정보를 저장하며, `chIdx`, `chName`, `chDefaultIntervalMs`, `defaultPriority` 필드가 있습니다.
- `ST_A20_wsEtcConfig_t` 구조체는 웹소켓 관련 설정을 저장하며, `chartLargeBytes`, `chartThrottleMul` 필드가 있습니다.
- `G_A20_WS_CH_Base_Arr` 배열은 각 채널의 기본 정보를 저장하고 있습니다.
- `G_A20_WS_ETC_DEFAULT_CONFIG` 변수는 웹소켓 관련 설정을 저장하고 있습니다.
