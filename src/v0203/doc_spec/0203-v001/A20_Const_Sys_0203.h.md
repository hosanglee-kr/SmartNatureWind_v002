# `A20_Const_Sys_0203.h` 상세 Spec

### 파일 역할 요약

`A20_Const_Sys_0203.h`는 ESP32-S3 C++17 임베디드 시스템에서 사용되는 상수 및 구조체 정의를 포함하는 헤더 파일입니다. 이 파일은 다음과 같은 주요 구성 요소를 제공합니다:

1. **Web Page Configurations**:
   - `ST_A20_PageItem_t`: 웹 페이지 아이템에 대한 정보를 저장하는 구조체.
   - `ST_A20_ReDirectItem_t`: 리다이렉션 관련 정보를 저장하는 구조체.
   - `ST_A20_CommonAsset_t`: 공통 자원 정보를 저장하는 구조체.
   - `ST_A20_WebPageConfig_t`: 웹 페이지 설정을 관리하는 구조체.

2. **System Configurations**:
   - `ST_A20_FanConfig_t`: 팬/소음/내구성 관련 설정을 저장하는 구조체.
   - `ST_A20_SysFanPwmHWCfg_t`: 팬 PWM 설정을 관리하는 구조체.
   - `ST_A20_SysPirHWCfg_t`: PIR 센서 설정을 관리하는 구조체.
   - `ST_A20_SysDhtHWCfg_t`: DHT 센서 설정을 관리하는 구조체.
   - `ST_A20_SysLedHWCfg_t`: LED 설정을 관리하는 구조체.
   - `ST_A20_SystemConfig_t`: 전체 시스템 설정을 관리하는 구조체.

3. **NVS Spec**:
   - `ST_A20_NvsEntry_t`: NVS 스펙에 대한 엔트리 정보를 저장하는 구조체.
   - `ST_A20_NvsSpecConfig_t`: NVS 스펙 전체 설정을 관리하는 구조체.

### 주요 함수/메서드 및 동작

- **Web Page Configurations**:
  - `ST_A20_PageItem_t`, `ST_A20_ReDirectItem_t`, `ST_A20_CommonAsset_t` 등은 각각의 웹 페이지 아이템, 리다이렉션, 공통 자원에 대한 정보를 저장합니다.
  - `ST_A20_WebPageConfig_t`는 전체 웹 페이지 설정을 관리하며, 각 구성 요소들을 배열로 관리합니다.

- **System Configurations**:
  - `ST_A20_FanConfig_t`, `ST_A20_SysFanPwmHWCfg_t`, `ST_A20_SysPirHWCfg_t`, `ST_A20_SysDhtHWCfg_t`, `ST_A20_SysLedHWCfg_t` 등은 각각의 시스템 구성 요소에 대한 설정을 저장합니다.
  - `ST_A20_SystemConfig_t`는 전체 시스템 설정을 관리하며, 각 구성 요소들을 구조체로 관리합니다.

- **NVS Spec**:
  - `ST_A20_NvsEntry_t`, `ST_A20_NvsSpecConfig_t` 등은 NVS 스펙에 대한 엔트리 정보를 저장하고 관리합니다.

### 외부사항

1. **구조체 정의**:
   - 모든 구조체는 `typedef`을 사용하여 정의되어 있습니다.
   - 각 구조체는 필요한 필드들을 포함하며, 긴급한 이름 규칙을 따릅니다 (예: `ST_A20_PageItem_t`, `ST_A20_NvsSpecConfig_t`).

2. **길이 제한**:
   - 모든 문자열 배열은 `LEN_PATH`, `LEN_LABEL`, `LEN_URI`, `LEN_NAME`, `LEN_LEVEL` 등과 같은 길이 상수를 사용하여 길이를 제한합니다.

3. **배열 크기**:
   - 각 구조체의 배열 크기는 `MAX_PAGE_ASSETS`, `MAX_REDIRECTS`, `MAX_COMMON_ASSETS`, `MAX_PAGES`와 같은 상수를 사용하여 정의되어 있습니다.

4. **JSON 태그 참조**:
   - JSON 태그에 따라 필드 이름이 설정됩니다 (예: `isMain`, `order`, `enable`, `enabled`).

5. **공통 변수**:
   - 모든 구조체에는 공통적인 변수들이 포함되어 있습니다 (예: `pageCount`, `reDirectCount`, `assetCount`).

6. **구조체 내부의 구조체**:
   - `ST_A20_WebPageConfig_t`는 각 구성
