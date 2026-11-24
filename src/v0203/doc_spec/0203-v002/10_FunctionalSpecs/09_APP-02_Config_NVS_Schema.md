# APP-02. LittleFS JSON 설정 및 NVS 스키마 통합 명세서

> 📑 [FN-00. 마스터 인덱스로 돌아가기](./00_FN_Master_Index.md)

## 1. 문서 메타데이터
- **문서 ID / 명칭**: `APP-02` / LittleFS JSON 전체 트리 스키마 및 NVS Namespace/Key 매핑 통합표
- **기준 펌웨어 버전**: `FW_Ver_2.0.3` (`G_JSON_VERSION = "0203"`)
- **관련 소스 파일**:
  - 상수/구조체: `A20_Const_Const_0203.h`, `A20_Const_Sys_0203.h`, `A20_Const_Wifi_0203.h`, `A20_Const_Motion_0203.h`, `A20_Const_Sch_0203.h`, `A20_Const_WS_0203.h`
  - 기본값/초기화: `A23_Com_ResetCfg_0203.h`
  - 영속화 엔진: `C10_Config_0203.h`, `C10_Config_Core_0203.cpp`, `C10_Config_Sys_0203.cpp`, `C10_Config_Extras_0203.cpp`, `C10_Config_Sch_*.cpp`, `C10_Config_UzProf_*.cpp`, `C10_Config_WindDc_*.cpp`
  - 비휘발성 저장소: `N10_NvsManager_0203.h`, `N10_NvsManager_0203.cpp`
- **직렬화 엔진**: `ArduinoJson` v7.x (`JsonDocument` 단일 타입, `camelCase` 표준)

---

## 2. LittleFS 설정 파일 매핑 마스터 (`10_cfg_jsonFile.json`)
시스템 부팅 시 `CL_C10_ConfigManager::_loadCfgJsonFile()`이 `/json/10_cfg_jsonFile.json` (`A20_Const::CFG_JSON_FILE`)을 최우선 로드하여 8개 설정 섹션의 파일 경로를 `s_cfgJsonFileMap` (`ST_A20_cfg_jsonFile_t`)에 바인딩함.

| 섹션 키 (`configJsonFile.*`) | 매핑 구조체 (`ST_A20_ConfigRoot_t`) | 루트 JSON 래퍼 | Dirty 플래그 | 기본/참조 경로 예시 |
| :--- | :--- | :--- | :--- | :--- |
| `system` | `ST_A20_SystemConfig_t*` | 루트 직하 (`meta`, `system`, `hw`, `security`, `timeCfg`) | `_dirty_system` | `/json/cfg_system_0203.json` |
| `wifi` | `ST_A20_WifiConfig_t*` | `wifi` | `_dirty_wifi` | `/json/cfg_wifi_0203.json` |
| `motion` | `ST_A20_MotionConfig_t*` | `motion` | `_dirty_motion` | `/json/cfg_motion_0203.json` |
| `nvsSpec` | `ST_A20_NvsSpecConfig_t*` | `nvsSpec` (Load 시 루트형도 허용) | `_dirty_nvsSpec` | `/json/cfg_nvsSpec_0203.json` |
| `schedules` | `ST_A20_SchedulesRoot_t*` | `schedules` (배열) + 메타(`version`, `jsonFile`) | `_dirty_schedules` | `/json/cfg_schedules_0203.json` |
| `userProfiles` | `ST_A20_UserProfilesRoot_t*` | `userProfiles.profiles` (배열) | `_dirty_userProfiles` | `/json/cfg_userProfiles_0203.json` |
| `windDict` | `ST_A20_WindDict_t*` | `windDict` (`presets[]`, `styles[]`) | `_dirty_windDict` | `/json/cfg_windDict_0203.json` |
| `webPage` | `ST_A20_WebPageConfig_t*` | 루트 직하 (`pages[]`, `reDirect[]`, `assets[]`) | `_dirty_webPage` | `/json/cfg_pages_0203.json` |

### 2.1 영속화 및 메모리 안전 정책 (`C10_Config_Core_0203.cpp`)
- **백업/복구 (`A40_IO`)**: 모든 JSON 저장 시 `.bak` 자동 생성 및 손상 시 `.bak` 자동 복구 수행
- **지연 해제 (Deferred Free, E-1)**: `reloadAll()` 실행 시 기존 `g_A20_config_root` 포인터를 즉시 `delete`하지 않고 `s_pendingFree` 큐(슬롯 2개)에 등록 후 `PENDING_FREE_GRACE_MS` 경과 시 `processPendingFree()`로 해제하여 웹 GET 직렬화 중 UAF(Use-After-Free) 차단
- **스레드 안전성**: `s_recursiveMutex` (`G_A40_MUTEX_TIMEOUT_100`)로 모든 Load/Save/Patch/Export 보호, `s_rootSwapMux` 및 `s_dirtyflagSpinlock` (`portMUX_TYPE`)으로 포인터 스왑 및 Dirty 플래그 원자적 갱신

---

## 3. 섹션별 JSON 상세 스키마 및 제약 규칙

### 3.1 `system` (`ST_A20_SystemConfig_t`)
| JSON 경로 | C++ 필드명 | 타입 | 기본값 (`A20_resetSystemDefault`) | 제약 및 클램핑 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| `meta.version` | `meta.version` | `string[64]` | `"FW_Ver_2.0.3"` | 읽기 전용 권장 (`A20_Const::FW_VERSION`) |
| `meta.deviceName` | `meta.deviceName` | `string[64]` | `"SmartNatureWind"` | 빈 문자열 무시 |
| `meta.lastUpdate` | `meta.lastUpdate` | `string[64]` | `""` | ISO-8601 또는 타임스탬프 문자열 |
| `system.logging.level` | `system.logging.level` | `string[16]` | `"INFO"` | `"DEBUG"`, `"INFO"`, `"WARN"`, `"ERROR"` |
| `system.logging.maxEntries` | `system.logging.maxEntries` | `uint16` | `300` | Load 시 `> 0` 조건 검사 |
| `system.webSocket.wsChConfig[].chIdx` | `wsChConfig[i].chIdx` | `uint8` | `0..3` | `0=state, 1=metrics, 2=chart, 3=summary` (`EN_A20_WS_CH_COUNT=4`) |
| `system.webSocket.wsChConfig[].chName` | `wsChConfig[i].chName` | `string` | `"state"` 등 | Patch 시 덮어쓰기 금지(표준 이름 고정) |
| `system.webSocket.wsChConfig[].chIntervalMs` | `wsChConfig[i].chIntervalMs` | `uint16` | `800 / 1500 / 1200 / 1500` | `clampVal(val, 20, 60000)` [ms] |
| `system.webSocket.wsChConfig[].priority` | `wsChConfig[i].priority` | `uint8` | `0 / 1 / 2 / 3` | `clampVal(val, 0, 10)` |
| `system.webSocket.wsEtcConfig.chartLargeBytes` | `wsEtcConfig.chartLargeBytes` | `uint16` | `3500` | `clampVal(val, 256, 60000)` [bytes] |
| `system.webSocket.wsEtcConfig.chartThrottleMul` | `wsEtcConfig.chartThrottleMul` | `uint8` | `2` | `clampVal(val, 1, 10)` |
| `system.webSocket.wsEtcConfig.wsCleanupMs` | `wsEtcConfig.wsCleanupMs` | `uint16` | `10000` | `clampVal(val, 200, 60000)` [ms] |
| `hw.fanPwm.pin` / `channel` | `hw.fanPwm.pin` / `channel` | `int16` / `uint8` | `1` / `0` | ESP32 GPIO 및 LEDC 채널 |
| `hw.fanPwm.freq` / `res` | `hw.fanPwm.freq` / `res` | `uint32` / `uint8` | `25000` / `10` | PWM 주파수(Hz) 및 분해능(bit) |
| `hw.fanConfig.startPercentMin` | `hw.fanConfig.startPercentMin` | `uint8` | `10` | 모터 기동 최소 듀티 (%) |
| `hw.fanConfig.comfortPercentMin` | `hw.fanConfig.comfortPercentMin` | `uint8` | `20` | 쾌적 바람 구간 하한 (%) |
| `hw.fanConfig.comfortPercentMax` | `hw.fanConfig.comfortPercentMax` | `uint8` | `80` | 쾌적 바람 구간 상한 (%) |
| `hw.fanConfig.hardPercentMax` | `hw.fanConfig.hardPercentMax` | `uint8` | `95` | 하드웨어 절대 최대 상한 (%) |
| `hw.pir.enabled` / `pin` | `hw.pir.enabled` / `pin` | `bool` / `int16` | `true` / `13` | PIR 센서 활성화 및 GPIO |
| `hw.pir.debounceSec` / `holdSec` | `hw.pir.debounceSec` / `holdSec` | `uint16` / `uint16` | `5` / `120` | 디바운싱 및 재실 유지 시간(초) |
| `hw.tempHum.enabled` / `type` | `hw.tempHum.enabled` / `type` | `bool` / `string[16]` | `true` / `"DHT22"` | 온습도 센서 모델명 |
| `hw.tempHum.pin` / `intervalSec` | `hw.tempHum.pin` / `intervalSec` | `int16` / `uint16` | `17` / `30` | GPIO 및 샘플링 주기(초) |
| `hw.led.pin` / `numPixels` / `defaultBrightness` | `hw.led.*` | `int16`/`uint16`/`uint8` | `48` / `1` / `20` | NeoPixel 상태 LED 설정 (0~255) |
| `security.apiKey` | `security.apiKey` | `string[64]` | `""` | Patch 시 `"clearApiKey": true` 전달로 삭제 가능 |
| `security.geminiApiKey` | `security.geminiApiKey` | `string[64]` | `""` | Patch 시 `"clearGeminiApiKey": true` 전달로 삭제 가능 |
| `timeCfg.ntpServer` | `timeCfg.ntpServer` | `string[64]` | `"kr.pool.ntp.org"` | 주 NTP 서버 |
| `timeCfg.ntpFallbackServers[]` | `timeCfg.ntpFallbackServers[3][64]` | `string[]` | `["time.google.com", "pool.ntp.org", "time.cloudflare.com"]` | 최대 3개 백업 NTP 서버 |
| `timeCfg.timezone` | `timeCfg.timezone` | `string[64]` | `"Asia/Seoul"` | IANA 타임존 문자열 |
| `timeCfg.syncIntervalMin` | `timeCfg.syncIntervalMin` | `uint16` | `60` | NTP 동기화 주기(분) |

### 3.2 `wifi` (`ST_A20_WifiConfig_t`)
| JSON 경로 | C++ 필드명 | 타입 | 기본값 | 제약 및 검증 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| `wifi.wifiMode` | `wifiMode` | `uint8` (`EN_A20_WIFI_MODE_t`) | `2` (`AP_STA`) | `0=AP`, `1=STA`, `2=AP_STA` (범위 외 무시) |
| `wifi.wifiModeDesc` | `wifiModeDesc` | `string[48]` | `"0=AP,1=STA,2=AP+STA"` | 설명 문자열 |
| `wifi.ap.ssid` / `pass` | `ap.ssid` / `ap.pass` | `string[32]` | `"NatureWind"` / `"2540"` | SoftAP 자격 증명 (복구 AP: `"NatureWind_Recovery"` / `"2540"`) |
| `wifi.sta[].ssid` / `pass` | `sta[i].ssid` / `sta[i].pass` | `string[32]` | `[]` (`staCount=0`) | 최대 `MAX_STA_NETWORKS = 5`, Patch 시 배열 전체 교체 |

### 3.3 `motion` (`ST_A20_MotionConfig_t`)
| JSON 경로 | C++ 필드명 | 타입 | 기본값 | 제약 및 검증 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| `motion.pir.enabled` / `holdSec` | `pir.enabled` / `pir.holdSec` | `bool` / `uint16` | `true` / `120` | 모션 기반 홀드 설정 |
| `motion.timing.simIntervalMs` | `timing.simIntervalMs` | `uint16` | `500` | Patch 시 `> 0` 필수 |
| `motion.timing.gustIntervalMs` | `timing.gustIntervalMs` | `uint16` | `2000` | Patch 시 `> 0` 필수 |
| `motion.timing.thermalIntervalMs` | `timing.thermalIntervalMs` | `uint16` | `3000` | Patch 시 `> 0` 필수 |
| `motion.sim.presetCode` / `styleCode` | `sim.presetCode` / `styleCode` | `string[24]` | `"OCEAN"` / `"BALANCE"` | 부팅 시 복원되는 기본 바람 코드 |
| `motion.sim.fanPowerEnabled` | `sim.fanPowerEnabled` | `bool` | `true` | 팬 출력 활성화 플래그 |
| `motion.sim.intensity` / `variability` / `gustFreq` | `sim.*` | `float` | `70.0` / `50.0` / `45.0` | 감성 슬라이더 기본 물리 파라미터 (%) |
| `motion.sim.fanLimit` / `minFan` | `sim.fanLimit` / `minFan` | `float` | `90.0` / `10.0` | 시뮬레이션 상한/하한 (%) |
| `motion.sim.turbSigma` / `turbLenScale` | `sim.turbSigma` / `turbLenScale` | `float` | `0.5` / `40.0` | 난류 강도 및 길이 스케일 |
| `motion.sim.thermalStrength` / `thermalRadius` | `sim.thermalStrength` / `thermalRadius` | `float` | `2.0` / `18.0` | 열기포 강도 및 반경 |

### 3.4 `schedules` (`ST_A20_SchedulesRoot_t`, 최대 `MAX_SCHEDULES = 8`)
저장 시 루트에 `"version": "0203"`, `"jsonFile": "cfg_schedules_0203.json"` 메타 필드가 함께 기록됨.

| JSON 경로 | C++ 필드명 | 타입 | 기본값 | 제약 및 검증 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| `schedules[].schId` | `items[i].schId` | `uint8` | 자동발급(`1..255`) | `0` 금지, 중복 금지 (PUT Patch 시 `1`부터 순차 재발급) |
| `schedules[].schNo` | `items[i].schNo` | `uint16` | 필수 입력 | `1..65535`, `0` 및 중복 금지, `schNo` 내림차순 정렬 |
| `schedules[].name` | `items[i].name` | `string[32]` | `""` | 스케줄 표시명 |
| `schedules[].enabled` | `items[i].enabled` | `bool` | `true` | 활성화 여부 |
| `schedules[].profileId` | `items[i].profileId` | `uint8` | `0` | 실행할 `userProfiles`의 `profileId` 참조 (v0203 단일 규격) |
| `schedules[].period.enabled` | `items[i].period.enabled` | `bool` | `true` | 시간 조건 활성화 |
| `schedules[].period.days[0..6]` | `items[i].period.days[7]` | `uint8[7]` | `[1,1,1,1,1,1,1]` | 일~토 요일 마스크 (`0` 또는 `1`) |
| `schedules[].period.startTime` / `endTime` | `items[i].period.startTime` / `endTime` | `string[6]` | `"00:00"` / `"23:59"` | `"HH:MM"` 형식, 자정 넘김(cross-midnight) 분해 겹침 검증 지원 |
| `schedules[].ruleOverride` | `items[i].ruleOverride` | `bool` | `false` | `true` 시 프로파일 규칙 대신 아래 `rule` 적용 |
| `schedules[].rule` | `items[i].rule` | `ST_A20_TriggerRule_t` | 기본값 초기화 | 아래 3.6 공통 `TriggerRule` 스키마 참조 |

### 3.5 `userProfiles` (`ST_A20_UserProfilesRoot_t`, 최대 `MAX_USER_PROFILES = 6`)
| JSON 경로 | C++ 필드명 | 타입 | 기본값 | 제약 및 검증 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| `userProfiles.profiles[].profileId` | `items[i].profileId` | `uint8` | 자동발급(`1..255`) | `0` 금지, 중복 금지 |
| `userProfiles.profiles[].profileNo` | `items[i].profileNo` | `uint16` | 필수 입력 | `1..65535`, `0` 및 중복 금지 |
| `userProfiles.profiles[].name` | `items[i].name` | `string[32]` | `""` | 플레이리스트/프로파일 이름 |
| `userProfiles.profiles[].enabled` | `items[i].enabled` | `bool` | `true` | 활성화 여부 |
| `userProfiles.profiles[].repeatSegments` | `items[i].repeatSegments` | `bool` | `true` | 스텝 반복 실행 여부 |
| `userProfiles.profiles[].repeatCount` | `items[i].repeatCount` | `uint8` | `0` | `0`=무한 반복, `>=1`=지정 횟수 반복 |
| `userProfiles.profiles[].steps[]` | `items[i].segments[8]` | `ST_A20_Step_t[]` | 최대 8개 스텝 | `MAX_STEPS_PER_PROFILE = 8` (v0203 단일 규격) |
| `...steps[].stepNo` | `segments[k].stepNo` | `uint8` | `k + 1` | 스텝 순번 (`0` 및 중복 금지) |
| `...steps[].durationMin` | `segments[k].durationMin` | `uint16` | `20` | `clamp(1, 1440)` [분] (`MIN_STEP_DURATION_MIN`~`MAX_STEP_DURATION_MIN`) |
| `...steps[].type` | `segments[k].type` | `string` (`EN_A20_step_type_t`) | `"PRESET"` | `"PRESET"`(0), `"FIXED"`(1), `"REST"`(2) |
| `...steps[].presetCode` / `styleCode` | `segments[k].presetCode` / `styleCode` | `string[24]` | `"OCEAN"` / `"BALANCE"` | `type == "PRESET"`일 때 참조하는 바람 코드 |
| `...steps[].fixedSpeed` | `segments[k].fixedSpeed` | `float` | `50.0` | `type == "FIXED"`일 때 고정 속도 (%) |
| `...steps[].override.enabled` | `segments[k].override.enabled` | `bool` | `false` | 개별 물리 파라미터 덮어쓰기 여부 |
| `...steps[].override.windIntensity` / `windVariability` / `gustFrequency` | `segments[k].override.*` | `float` | `-1.0` | `-1.0`=프리셋 기본값 유지, `0.0~100.0`=덮어쓰기 |
| `userProfiles.profiles[].rule` | `items[i].rule` | `ST_A20_TriggerRule_t` | 기본값 초기화 | 아래 3.6 공통 `TriggerRule` 스키마 참조 |

### 3.6 공통 `TriggerRule` 스키마 (`ST_A20_TriggerRule_t`)
`userProfiles.profiles[].rule` 및 `schedules[].rule`에 공통 적용됨.

| JSON 경로 | C++ 필드명 | 타입 | 기본값 | 제약 및 검증 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| `rule.timer.enabled` / `minutes` | `timer.enabled` / `minutes` | `bool` / `uint32` | `false` / `0` | 타이머 자동 종료(분) |
| `rule.offTime.enabled` / `time` | `offTime.enabled` / `time` | `bool` / `string[6]` | `false` / `""` | 지정 시각 종료 (`"HH:MM"`) |
| `rule.tempLow.enabled` / `mode` | `tempLow.enabled` / `mode` | `bool` / `string` | `false` / `"PAUSE"` | `mode`: `"PAUSE"`(자동재개) 또는 `"STOP"`(완전종료) |
| `rule.tempLow.threshold` / `hysteresis` | `tempLow.threshold` / `hysteresis` | `float` / `float` | `22.0` / `0.5` | `mode=="PAUSE"`일 때 `hysteresis < 0.5f`이면 `0.5f`로 강제 클램핑 |
| `rule.diLow.enabled` / `mode` | `diLow.enabled` / `mode` | `bool` / `string` | `false` / `"PAUSE"` | 불쾌지수(DI) 하한 트리거 모드 (`"PAUSE"` / `"STOP"`) |
| `rule.diLow.threshold` / `hysteresis` | `diLow.threshold` / `hysteresis` | `float` / `float` | `65.0` / `3.0` | `mode=="PAUSE"`일 때 `hysteresis < 3.0f`이면 `3.0f`로 강제 클램핑 |
| `rule.pirPause.enabled` / `holdSec` | `pirPause.enabled` / `holdSec` | `bool` / `uint16` | `false` / `120` | 부재 시 일시정지 대기 시간(초) |
| `rule.smartComfort.enabled` / `intervalMin` / `level` | `smartComfort.*` | `bool`/`uint16`/`uint8` | `false` / `5` / `2` | 스마트 자동 쾌적 보정 주기(분) 및 강도 레벨 |

### 3.7 `windDict` (`ST_A20_WindDict_t`)
- **배열 제한**: `presets[]` 최대 `10`개 (`EN_A20_WINDPRESET_COUNT`), `styles[]` 최대 `5`개 (`EN_A20_WINDSTYLE_COUNT`)
- **문자열 검증 (`C10_sanitizeAndValidateText`)**: ASCII 출력 가능 문자(`32..126`)만 허용, `code`는 내부 공백 금지 및 중복 불가(`C10_hasDupCode`)
- **`windDict.presets[i]` 구조**:
  - `idx` (`uint8`), `code` (`string[24]`, 기본 `"OCEAN"`), `name` (`string[32]`, 기본 `"Ocean Breeze"`)
  - `factors`: `windIntensity`(70.0), `gustFrequency`(40.0), `windVariability`(50.0), `fanLimit`(95.0), `minFan`(10.0), `turbulenceLengthScale`(40.0), `turbulenceIntensitySigma`(0.5), `thermalBubbleStrength`(2.0), `thermalBubbleRadius`(18.0), `baseMinWind`(1.8), `baseMaxWind`(5.5), `gustProbBase`(0.040), `gustStrengthMax`(2.10), `thermalFreqBase`(0.022)
- **`windDict.styles[i]` 구조**:
  - `idx` (`uint8`), `code` (`string[24]`, 기본 `"BALANCE"`), `name` (`string[32]`, 기본 `"Balance"`)
  - `factors`: `intensityFactor`(1.0), `variabilityFactor`(1.0), `gustFactor`(1.0), `thermalFactor`(1.0)

### 3.8 `webPage` (`ST_A20_WebPageConfig_t`) & `nvsSpec` (`ST_A20_NvsSpecConfig_t`)
- **`webPage` (루트 직하 저장)**:
  - `pages[]` (최대 24개): `uri` (`string[96]`, 필수), `path` (`string[160]`, 필수), `label` (`string[32]`), `enable` (`bool`, 기본 `true`), `isMain` (`bool`), `order` (`uint16`), `pageAssets[]` (최대 8개: `uri`, `path`)
  - `reDirect[]` (최대 32개): `uriFrom` (`string[96]`, 필수), `uriTo` (`string[96]`, 필수) — 기본 17개 SPA 해시 리다이렉트(`/` → `/index.html`, `/ai` → `/index.html#/ai` 등) 포함
  - `assets[]` (최대 16개): `uri`, `path`, `isCommon` (`bool`)
- **`nvsSpec` (`nvsSpec` 래핑 저장 — UI/진단 메타데이터 정의용)**:
  - `nvsSpec.namespace` (`string[16]`, 기본 `"SNW"`)
  - `nvsSpec.entries[]` (최대 32개): `key` (`string[32]`, 필수), `type` (`string[16]`), `defaultValue` (`string[64]`)
  - **[주의 — 저장소 용도 구분]**: 본 `cfg_nvsSpec_0203.json`은 웹 UI 설정 진단 및 스키마 노출용 메타 정의(`namespace: "SNW"`, `camelCase` 키: `runMode`, `actProfileNo`, `actSegmentNo`, `presetCode`, `styleCode`, `wifiConnected`)이며, **실제 ESP32 NVS 플래시 파티션에 런타임 상태를 영구 기록하는 단일 진실 공급원(SSOT)은 아래 §4의 `CL_N10_NvsManager` (`namespace: "SNW_RUN"`, `snake_case <= 15B` 키)**임.

---

## 4. NVS 비휘발성 런타임 저장소 매핑 (`CL_N10_NvsManager`)
- **NVS Namespace**: `"SNW_RUN"` (`CL_N10_NvsManager::G_N10_NS_RUNTIME`)
- **저장 정책**: 상태 변경 시 `s_dirty.runtime = true` 마킹 후 `G_N10_SAVE_INTERVAL_MS` (`10,000ms`) 주기로 배치 커밋(`flush`), 공장 초기화(`factoryResetFromDefault`) 시 `resetRuntime()`으로 전 키 초기화
- **키 길이 제약**: ESP32 NVS 규격 준수 (`<= 15 bytes`)

| NVS Key 상수 (`CL_N10_NvsManager::*`) | 실제 NVS Key | NVS 타입 | 매핑 구조체 필드 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `G_N10_KEY_RUN_MODE` | `"run_mode"` | `uint8` | `s_state.runMode` | `0` | `0=OFF`, `1=SCHEDULE`, `2=USER_PROFILE` |
| `G_N10_KEY_RUN_SOURCE` | `"run_src"` | `uint8` | `s_state.runSource` | `0` | `0=UNKNOWN`, `1=BUTTON`, `2=WEB`, `3=API` |
| `G_N10_KEY_LAST_SCHEDULE` | `"sched_no"` | `int16` | `s_state.lastScheduleNo` | `-1` | 마지막 실행 스케줄 번호 (`-1`=없음) |
| `G_N10_KEY_LAST_PROFILE` | `"uprofile_no"` | `int16` | `s_state.lastUserProfileNo` | `-1` | 마지막 실행 프로파일 번호 (`-1`=없음) |
| `G_N10_KEY_OVERRIDE_ENABLED` | `"ovr_en"` | `uint8(bool)` | `s_state.overrideEnabled` | `false` | 수동 오버라이드 활성화 여부 |
| `G_N10_KEY_OVERRIDE_MODE` | `"ovr_mode"` | `uint8` | `s_state.overrideMode` | `0` | `0=NONE`, `1=FIXED`, `2=PRESET` |
| `G_N10_KEY_OVERRIDE_FIXED` | `"ovr_fixed"` | `float` | `s_state.overrideFixedPercent` | `0.0f` | 고정 속도 오버라이드 값 (%) |
| `G_N10_KEY_OVERRIDE_PRESET` | `"ovr_preset"` | `string[24]` | `s_state.overridePresetCode` | `""` | 오버라이드 프리셋 코드 |
| `G_N10_KEY_OVERRIDE_STYLE` | `"ovr_style"` | `string[24]` | `s_state.overrideStyleCode` | `""` | 오버라이드 스타일 코드 |
| `G_N10_KEY_MANUAL_ACTIVE` | `"man_active"` | `uint8(bool)` | `s_state.manualActive` | `false` | 수동 세션 활성 여부 (v0203 신규) |
| `G_N10_KEY_MANUAL_PROFILE` | `"man_prof"` | `int16` | `s_state.manualProfileNo` | `0` | 수동 세션 프로파일 번호 (v0203 신규) |
| `G_N10_KEY_MANUAL_OVR_SCH` | `"man_ovr_sch"` | `uint8(bool)` | `s_state.manualOvrSchedule` | `false` | 수동 세션의 스케줄 우선 여부 (v0203 신규) |
| `G_N10_KEY_AUTO_COMFORT` | `"auto_comfort"` | `uint8(bool)` | `s_state.autoComfortEnabled` | `false` | 스마트 자동 쾌적 모드 활성화 여부 |
| `G_N10_KEY_AI_RESET_DATE` | `"ai_rst_dt"` | `string[12]` | `s_aiUsage.resetDate` | `""` | AI 일일 사용량 기준일 (`"YYYY-MM-DD"`) |
| `G_N10_KEY_AI_AUDIO_SEC` | `"ai_a_s"` | `uint32` | `s_aiUsage.audioSec` | `0` | 일일 누적 AI 오디오 초 (상한 `1800`초=30분) |
| `G_N10_KEY_AI_TURN_COUNT` | `"ai_t_c"` | `uint16` | `s_aiUsage.turnCount` | `0` | 일일 누적 AI Live 턴 수 |
| `G_N10_KEY_AI_COST` | `"ai_cos"` | `uint32` | `s_aiUsage.estCostUsdX1000` | `0` | 일일 추정 비용 (`USD * 1000`) |

