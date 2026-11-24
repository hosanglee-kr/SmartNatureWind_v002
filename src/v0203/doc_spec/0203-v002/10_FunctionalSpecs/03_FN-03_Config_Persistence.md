# FN-03. 데이터 영속화 및 설정 관리 기능 명세서

> 📑 [FN-00. 마스터 인덱스로 돌아가기](./00_FN_Master_Index.md)

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-03` / 데이터 영속화 및 설정 관리 (`Config Persistence & NVS Manager`)
- **관련 소스 파일**:
  - 코어/시스템/확장: `C10_Config_0203.h`, `C10_Config_Core_0203.cpp`, `C10_Config_Sys_0203.cpp`, `C10_Config_Extras_0203.cpp`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span)
  - 스케줄 도메인 (5파일): `C10_Config_Sch_Internal_0203.h`, `C10_Config_Sch_LoadSave_0203.cpp`, `C10_Config_Sch_JSON_0203.cpp`, `C10_Config_Sch_CRUD_0203.cpp`, `C10_Config_Sch_Util_0203.cpp`[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)
  - 사용자 프로필 도메인 (4파일): `C10_Config_UzProf_Internal_0203.h`, `C10_Config_UzProf_LoadSave_0203.cpp`, `C10_Config_UzProf_JSON_0203.cpp`, `C10_Config_UzProf_CRUD_0203.cpp`, `C10_Config_UzProf_Util_0203.cpp`[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span)
  - 바람 사전 도메인 (4파일): `C10_Config_WindDc_Internal_0203.h`, `C10_Config_WindDc_LoadSave_0203.cpp`, `C10_Config_WindDc_JSON_0203.cpp`, `C10_Config_WindDc_CRUD_0203.cpp`, `C10_Config_WindDc_Util_0203.cpp`[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)
  - NVS 런타임/기본값/IO: `N10_NvsManager_0203.h`, `N10_NvsManager_0203.cpp`, `A23_Com_ResetCfg_0203.h`, `A40_Com_Utils_IO_0203.cpp`[span_19](start_span)[span_19](end_span)[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)
- **실행 컨텍스트**:
  - 부팅/리로드/주기 플러시: `loopTask` (`A00_init` 시 `loadAll()`, `A00_run`에서 `processPendingFree()` 및 `CL_N10_NvsManager::tick()` 10초 주기 실행)[span_23](start_span)[span_23](end_span)
  - 웹 설정 변경/CRUD: `async_tcp` (`W10_Web_Routes_Config/System/Network/CRUD`에서 `s_recursiveMutex` 경유 호출)[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span)[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span)
- **선행 조건 (Pre-condition)**:
  - `LittleFS.begin(true)` 파일시스템 마운트 완료 및 `/json/10_cfg_jsonFile.json` 경로 매핑 파일 존재[span_28](start_span)[span_28](end_span)[span_29](start_span)[span_29](end_span)[span_30](start_span)[span_30](end_span)
  - `CL_C10_ConfigManager::begin()`으로 `s_recursiveMutex` 생성 완료[span_31](start_span)[span_31](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- 8개 분리된 JSON 설정 파일(`system`, `wifi`, `motion`, `nvsSpec`, `schedules`, `userProfiles`, `windDict`, `webPage`)을 LittleFS에 원자적으로 저장·복구하고, 동적 런타임 상태 및 AI 일일 사용량을 ESP32 NVS(`SNW_RUN`)에 영구 기록하여 **무중단 설정 갱신과 전원 차단 시 데이터 무결성**을 보장함[span_32](start_span)[span_32](end_span)[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span).

### 2.2 세부 기능 분할 (`FN-03-01` ~ `FN-03-05`)
- **`FN-03-01` 설정 코어 생명주기 및 지연 해제 (`Core`)**: `10_cfg_jsonFile.json` 경로 매핑, 전체 로드(`loadAll`), 원자 스냅샷(`getRootSnapshot`), Dirty 플래그 일괄 저장(`saveDirtyConfigs`), 지연 해제 큐(`queuePendingFree`/`processPendingFree`), 공장 초기화(`factoryResetFromDefault`)[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span)
- **`FN-03-02` 시스템·네트워크·모션·확장 설정 관리 (`Sys` / `Extras`)**: `system`, `wifi`, `motion`, `nvsSpec`, `webPage` 로드/저장 및 부분 JSON Patch(`patch*FromJson`)[span_38](start_span)[span_38](end_span)[span_39](start_span)[span_39](end_span)
- **`FN-03-03` 주간 스케줄 CRUD 및 겹침 검증 (`Sch`)**: 스케줄 추가/수정/삭제/전체 교체(PUT), `schNo` 내림차순 정렬, 자정 넘김(Cross-Midnight) 분해 요일별 시간 겹침 검증(`C10_validateNoOverlapByDay`)[span_40](start_span)[span_40](end_span)[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span)[span_43](start_span)[span_43](end_span)
- **`FN-03-04` 사용자 프로필 및 바람 사전 CRUD (`UzProf` / `WindDc`)**: ADR-2 `steps[]` 단일 규격(최대 8스텝) 및 `TriggerRule` 파싱/직렬화, 프리셋·스타일 코드 문자열 정제 및 중복 검사[span_44](start_span)[span_44](end_span)[span_45](start_span)[span_45](end_span)[span_46](start_span)[span_46](end_span)
- **`FN-03-05` NVS 비휘발성 런타임 및 AI 사용량 관리 (`N10`)**: `SNW_RUN` 네임스페이스 단일 `nvs_commit` 배치 플러시(10초 주기) 및 AI 일일 누적 초/턴/비용 즉시 저장[span_47](start_span)[span_47](end_span)[span_48](start_span)[span_48](end_span)

### 2.3 핵심 비즈니스 규칙
1. **기본값 선행 오버레이 원칙 (Safe Load Policy)**:
   - 모든 `load*Config()` 함수는 파일 읽기 전에 `A20_reset*Default()`를 먼저 호출하여 메모리 구조를 안전 기본값으로 초기화한 뒤 JSON에 존재하는 키만 덮어씀으로써, 일부 키가 누락된 구버전 설정 파일도 안전하게 수용함[span_49](start_span)[span_49](end_span)[span_50](start_span)[span_50](end_span).
2. **원자적 저장 및 2중 백업 롤백 (`A40_IO::Save_JsonDoc2File_V21` / `Load_File2JsonDoc_V21`)**:
   - **저장 시**: 대상 경로에 직접 쓰지 않고 `.tmp` 임시 파일에 먼저 직렬화 완료 → 기존 `.bak`을 `.bak.old`로 이동 → 현재 메인 파일을 `.bak`으로 백업 → `.tmp`를 메인 파일로 `rename` 교체함[span_51](start_span)[span_51](end_span).
   - **로드 시**: 메인 파일이 없거나 `deserializeJson()` 실패 시 `.bak` → `.bak.old` 순으로 자동 복구 로드하고 메인 파일로 즉시 복원함[span_52](start_span)[span_52](end_span).
3. **Dirty Flag 원자적 추적 (`portMUX_TYPE s_dirtyflagSpinlock`)**:
   - `patch*FromJson` 또는 `add/update/delete` 성공 시 메모리만 갱신하고 해당 섹션의 `_dirty_*` 플래그를 원자적으로 `true` 설정함. 실제 플래시 쓰기는 `POST /api/v001/config/save`(`saveDirtyConfigs()`) 호출 시 변경된 섹션만 선별 실행하여 LittleFS 수명을 보호함[span_53](start_span)[span_53](end_span)[span_54](start_span)[span_54](end_span)[span_55](start_span)[span_55](end_span).
4. **스케줄 자정 넘김(Cross-Midnight) 분해 및 정렬 규칙 (`C10_Config_Sch_Util_0203.cpp`)**:
   - `startTime > endTime`(예: `22:00 ~ 06:00`)인 야간 스케줄은 `[startMin, 1440)`과 `[0, endMin)` 2개 구간으로 분해하여 요일별 시간 중복을 검사함[span_56](start_span)[span_56](end_span).
   - 저장 시 `C10_sortSchedulesBySchNoDesc()`로 `schNo` 내림차순(동일 시 `schId` 내림차순) 정렬하여 우선순위를 일관되게 유지함[span_57](start_span)[span_57](end_span)[span_58](start_span)[span_58](end_span).
5. **NVS 단일 트랜잭션 커밋 및 키 길이 제약 (`CL_N10_NvsManager`)**:
   - 모든 NVS 키는 ESP32 규격(`<= 15 bytes`) 상수(`G_N10_KEY_*`)로만 접근하며, 런타임 상태 플러시 시 13개 키를 `nvs_set_*`로 기록한 뒤 `nvs_commit()`을 **단 1회**만 호출하여 플래시 지연 시간을 최소화함[span_59](start_span)[span_59](end_span)[span_60](start_span)[span_60](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 전역 설정 루트 (`ST_A20_ConfigRoot_t` / `A20_Const_0203.h`)[span_61](start_span)[span_61](end_span)
`g_A20_config_root`는 8개 설정 섹션의 힙 포인터를 보관하며, 외부 태스크는 `CL_C10_ConfigManager::getRootSnapshot(ST_A20_ConfigRoot_t& p_out)`을 통해 `s_rootSwapMux` 임계 구역 내에서 8개 포인터를 원자 캡처하여 사용함[span_62](start_span)[span_62](end_span)[span_63](start_span)[span_63](end_span)[span_64](start_span)[span_64](end_span).
- `system` (`ST_A20_SystemConfig_t*`), `wifi` (`ST_A20_WifiConfig_t*`), `motion` (`ST_A20_MotionConfig_t*`), `nvsSpec` (`ST_A20_NvsSpecConfig_t*`)[span_65](start_span)[span_65](end_span)
- `windDict` (`ST_A20_WindDict_t*`), `schedules` (`ST_A20_SchedulesRoot_t*`), `userProfiles` (`ST_A20_UserProfilesRoot_t*`), `webPage` (`ST_A20_WebPageConfig_t*`)[span_66](start_span)[span_66](end_span)

### 3.2 데이터 제약 및 유효성 검증 규칙
(전체 JSON 트리 및 NVS 키 상세 매핑은 `APP-02` 참조)
- **배열 용량 상한 (`A20_Const_Const_0203.h`)**:
  - `MAX_SCHEDULES = 8`, `MAX_USER_PROFILES = 6`, `MAX_STEPS_PER_PROFILE = 8` (`durationMin`: `1 ~ 1440`분)[span_67](start_span)[span_67](end_span)
  - `EN_A20_WINDPRESET_COUNT = 10`, `EN_A20_WINDSTYLE_COUNT = 5`, `MAX_STA_NETWORKS = 5`, `MAX_NVS_ENTRIES = 32`[span_68](start_span)[span_68](end_span)[span_69](start_span)[span_69](end_span)
  - `MAX_PAGES = 24`, `MAX_PAGE_ASSETS = 8`, `MAX_REDIRECTS = 32`, `MAX_COMMON_ASSETS = 16`[span_70](start_span)[span_70](end_span)
- **ID / 번호 무결성 검증 (`Sch`, `UzProf`)**:
  - `schId` / `profileId` (`uint8`, `1..255`) 및 `schNo` / `profileNo` (`uint16`, `1..65535`)는 `0` 및 중복 불가[span_71](start_span)[span_71](end_span)[span_72](start_span)[span_72](end_span)
  - 신규 생성(`add*FromJson`) 및 전체 교체(`patch*FromJson`) 시 ID는 `G_C10_*_ID_START(1)`부터 자동 채번·재발급되며, 단건 수정(`update*FromJson`) 시 기존 ID(`v_keepId`)를 보존함[span_73](start_span)[span_73](end_span)[span_74](start_span)[span_74](end_span)[span_75](start_span)[span_75](end_span)[span_76](start_span)[span_76](end_span)
- **문자열 정제 및 수치 클램핑 (`WindDc`, `Sys`, `UzProf`)**:
  - `C10_sanitizeAndValidateText()`: ASCII 출력 문자(`32..126`)만 허용하며 `code` 필드는 내부 공백 금지 및 중복 차단[span_77](start_span)[span_77](end_span)
  - `system.webSocket`: `chIntervalMs` (`20..60000ms`), `priority` (`0..10`), `chartLargeBytes` (`256..60000B`), `chartThrottleMul` (`1..10`), `wsCleanupMs` (`200..60000ms`)[span_78](start_span)[span_78](end_span)
  - `TriggerRule`: `mode == "PAUSE"`일 때 `tempLow.hysteresis >= 0.5f`, `diLow.hysteresis >= 3.0f`로 강제 보정[span_79](start_span)[span_79](end_span)

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 설정 생명주기 상태 전이
| 상태 | 진입 조건 | 유지 / 수행 동작 | 다음 전이 이벤트 |
| :--- | :--- | :--- | :--- |
| **UNINITIALIZED** | 부팅 직후 | `g_A20_config_root` 포인터 `nullptr` 상태[span_80](start_span)[span_80](end_span) | `CL_C10_ConfigManager::begin()` 및 `loadAll()` 호출[span_81](start_span)[span_81](end_span)[span_82](start_span)[span_82](end_span) |
| **CLEAN (Loaded)** | `loadAll()` 또는 `saveDirtyConfigs()` 완료 | 모든 `_dirty_* == false`, 메모리 스냅샷과 LittleFS 파일 동기화 상태[span_83](start_span)[span_83](end_span) | `patch*FromJson()` 또는 `add/update/delete*()` 호출[span_84](start_span)[span_84](end_span) |
| **DIRTY (Modified)** | 메모리 설정 변경 발생 | 해당 섹션 `_dirty_* = true`, 런타임 즉시 반영 가능하나 미저장 상태[span_85](start_span)[span_85](end_span)[span_86](start_span)[span_86](end_span) | `saveDirtyConfigs()` → **CLEAN**, 또는 `reloadAll()` → 디스크 값으로 롤백[span_87](start_span)[span_87](end_span)[span_88](start_span)[span_88](end_span) |
| **RELOADING (Grace)** | `CT10::reloadAll()` 실행 | 새 `v_new` 로드 후 `s_rootSwapMux`로 원자 교체, 구 `v_old`는 `s_pendingFree` 큐에 등록[span_89](start_span)[span_89](end_span)[span_90](start_span)[span_90](end_span) | `PENDING_FREE_GRACE_MS`(3000ms) 경과 시 `processPendingFree()`로 `v_old` 해제[span_91](start_span)[span_91](end_span)[span_92](start_span)[span_92](end_span) |

### 4.2 무중단 설정 재로드 및 지연 해제 시퀀스 (`reloadAll` ↔ `processPendingFree`)[span_93](start_span)[span_93](end_span)[span_94](start_span)[span_94](end_span)
1. `POST /api/v001/reload` 수신 시 `async_tcp`는 `CL_CT10_ControlManager::requestReload()`로 원자 플래그만 설정하고 `202 Accepted` 응답[span_95](start_span)[span_95](end_span).
2. `A00_run()` (`loopTask`)이 `consumePendingReload()`를 감지하여 `CL_CT10_ControlManager::reloadAll()` 실행[span_96](start_span)[span_96](end_span).
3. 로컬 임시 구조체 `ST_A20_ConfigRoot_t v_new`에 `CL_C10_ConfigManager::loadAll(v_new)`로 전체 파일 로드 (실패 시 `v_new`만 해제하고 기존 설정 무손상 유지)[span_97](start_span)[span_97](end_span).
4. `CT10::s_stateMutex` 및 `C10::s_rootSwapMux` 임계 구역 내에서 `v_old = g_A20_config_root; g_A20_config_root = v_new;` 원자 스왑 수행[span_98](start_span)[span_98](end_span).
5. `CL_C10_ConfigManager::queuePendingFree(v_old)`를 호출하여 `s_pendingFree` 큐(최대 2슬롯)에 `v_old`와 현재 `millis()` 기록 (큐 포화 시 가장 오래된 슬롯 즉시 `freeAll` 폴백)[span_99](start_span)[span_99](end_span)[span_100](start_span)[span_100](end_span).
6. 이후 `A00_run()` 주기에서 `processPendingFree()`가 `3,000ms` 경과 여부를 검사하여 만료된 `v_old` 메모리를 안전하게 `delete` 해제함[span_101](start_span)[span_101](end_span)[span_102](start_span)[span_102](end_span).

---

## 5. 외부 인터페이스 명세 (API / File / NVS)
- **REST API 접점 (`W10_Web_Routes_Config_0203.cpp`, `W10_Web_Routes_CRUD_0203.cpp`, `APP-01`)**:
  - `GET /api/v001/config`, `POST /api/v001/config/save`, `GET /api/v001/config/dirty`, `POST /api/v001/config/init`, `POST /api/v001/reload`[span_103](start_span)[span_103](end_span)
  - `GET/POST/PUT/DELETE /api/v001/schedules[/{id}]`, `/api/v001/user_profiles[/{id}|/patch]`, `/api/v001/windProfile[/{id}]`[span_104](start_span)[span_104](end_span)
  - `GET/POST/PATCH /api/v001/system`, `/api/v001/wifi/config`, `/api/v001/motion`[span_105](start_span)[span_105](end_span)[span_106](start_span)[span_106](end_span)
- **LittleFS 파일 경로 (`10_cfg_jsonFile.json` & `APP-02`)**:
  - `/json/10_cfg_jsonFile.json` → `/json/cfg_{system|wifi|motion|nvsSpec|schedules|userProfiles|windDict|pages}_0203.json` (각 파일별 `.bak` 백업 동반)[span_107](start_span)[span_107](end_span)[span_108](start_span)[span_108](end_span)[span_109](start_span)[span_109](end_span)
- **NVS 저장소 (`CL_N10_NvsManager` & `APP-02`)**:
  - Namespace `"SNW_RUN"`: 런타임 13개 키(`run_mode`, `ovr_en`, `man_active`, `auto_comfort` 등) 10초 주기 배치 커밋 + AI 일일 사용량 4개 키(`ai_rst_dt`, `ai_a_s`, `ai_t_c`, `ai_cos`) 즉시 커밋[span_110](start_span)[span_110](end_span)[span_111](start_span)[span_111](end_span).

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | 로그 코드 (`D10_Logger`) |
| :--- | :--- | :--- | :--- |
| **메인 JSON 파일 손상/누락** | `LittleFS.exists()` 실패 또는 `deserializeJson()` 에러[span_112](start_span)[span_112](end_span) | `.bak` → `.bak.old` 순차 복구 로드 후 원본 경로로 `rename` 복원[span_113](start_span)[span_113](end_span) | `[A40][...] restored/recovered from bak` (`WARN`)[span_114](start_span)[span_114](end_span) |
| **배열 용량 초과 / 중복 ID·번호** | `count >= MAX_*` 또는 `C10_is*Duplicated() == true`[span_115](start_span)[span_115](end_span)[span_116](start_span)[span_116](end_span)[span_117](start_span)[span_117](end_span)[span_118](start_span)[span_118](end_span) | CRUD 추가 시 음수 에러 코드(`-1..-6`) 반환, Patch/Load 시 변경 전면 거부(`A20_reset*Default` 복구)[span_119](start_span)[span_119](end_span)[span_120](start_span)[span_120](end_span)[span_121](start_span)[span_121](end_span)[span_122](start_span)[span_122](end_span) | `[C10] ... duplicated / overflow` (`ERROR`)[span_123](start_span)[span_123](end_span)[span_124](start_span)[span_124](end_span)[span_125](start_span)[span_125](end_span) |
| **동적 메모리 할당 실패 (OOM)** | `new (std::nothrow)` 반환 `nullptr`[span_126](start_span)[span_126](end_span)[span_127](start_span)[span_127](end_span) | `loadAll()` 시 이미 할당된 섹션 모두 `freeAll()` 정리 후 `false` 반환, 부팅 시 In-memory 기본값 또는 Recovery AP 폴백[span_128](start_span)[span_128](end_span)[span_129](start_span)[span_129](end_span) | `[C10] loadAll: new failed (...) - out of memory` (`ERROR`)[span_130](start_span)[span_130](end_span) |
| **NVS 쓰기 / 커밋 실패** | `nvs_open`, `nvs_set_*`, `nvs_commit` 반환값 `!= ESP_OK`[span_131](start_span)[span_131](end_span) | `s_dirty.runtime = true` 플래그를 클리어하지 않고 유지하여 다음 10초 주기에 자동 재시도[span_132](start_span)[span_132](end_span) | `[N10] NVS flush failed` (`ERROR`)[span_133](start_span)[span_133](end_span) |
| **공장 초기화 후 NVS 잔존 오염** | `factoryResetFromDefault()` 완료 직후[span_134](start_span)[span_134](end_span) | `CL_N10_NvsManager::resetRuntime()`을 강제 호출하여 이전 오버라이드/프로필 기록을 NVS에서 즉시 소거[span_135](start_span)[span_135](end_span) | `[C10] Factory Reset: NVS runtime reset done.` (`INFO`)[span_136](start_span)[span_136](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **ArduinoJson v7 단일 규격 준수**:
  - `DynamicJsonDocument`/`StaticJsonDocument` 및 레거시 v6 API(`createNestedArray`, `createNestedObject`, `containsKey`) 사용을 전면 금지하고 `JsonDocument` 단일 타입만 사용함[span_137](start_span)[span_137](end_span)[span_138](start_span)[span_138](end_span).
- **동시성 및 UAF(Use-After-Free) 차단**:
  - `s_recursiveMutex`(`G_A40_MUTEX_TIMEOUT_100 = 100ms`)로 모든 설정 I/O를 직렬화하고, `async_tcp` GET 직렬화 도중 `reloadAll()`로 인한 포인터 해제를 막기 위해 `s_rootSwapMux` 스냅샷 + 3초 지연 해제 큐(`PENDING_FREE_GRACE_MS`)를 결합함[span_139](start_span)[span_139](end_span)[span_140](start_span)[span_140](end_span)[span_141](start_span)[span_141](end_span).
- **NVS 플래시 마모 및 지연 최소화**:
  - 13개 런타임 상태 키를 개별 `Preferences::putXxx()`로 11~13회 커밋하던 구조를 단일 `nvs_commit()`으로 통합하여 실행 시간을 ~100ms에서 ~10ms 이하로 단축함[span_142](start_span)[span_142](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-03-01** | 원자 저장 및 백업 복구 | `cfg_system_0203.json` 본문을 임의 손상시킨 후 부팅(`loadSystemConfig`) 호출 | `.bak` 파일에서 자동 파싱 성공, 손상된 메인 파일을 정상 복원하고 `WARN` 로그 기록[span_143](start_span)[span_143](end_span) |
| **TC-03-02** | 자정 넘김 스케줄 겹침 검증 | 스케줄 A(`22:00~02:00`, 월요일) 활성 상태에서 스케줄 B(`01:00~03:00`, 화요일) 저장(`p_failOnOverlap=true`) | 화요일 `00:00~02:00` 구간과 `01:00~03:00` 구간의 겹침을 감지하여 `false` 반환 및 저장 차단[span_144](start_span)[span_144](end_span)[span_145](start_span)[span_145](end_span) |
| **TC-03-03** | API Key 명시적 삭제 | `PATCH /api/v001/system` 본문에 `{"security":{"clearApiKey":true,"clearGeminiApiKey":true}}` 전달 | `apiKey`와 `geminiApiKey` 버퍼가 `0`으로 초기화되고 `_dirty_system == true` 설정[span_146](start_span)[span_146](end_span) |
| **TC-03-04** | 지연 해제(UAF 방지) | `GET /api/v001/config` 직렬화 직전 `POST /api/v001/reload` 연속 2회 실행 | `s_pendingFree` 큐가 구버전 포인터를 3초간 보존하여 GET 응답이 손상 없이 완료되고 3초 후 정상 `delete` 수행[span_147](start_span)[span_147](end_span)[span_148](start_span)[span_148](end_span)[span_149](start_span)[span_149](end_span) |
| **TC-03-05** | 공장 초기화 NVS 연동 | 오버라이드 활성 상태에서 `POST /api/v001/config/init` 호출 후 재부팅 | 8개 JSON 파일이 기본값으로 덮어쓰여지고 NVS `SNW_RUN`의 `ovr_en == false`, `run_mode == 0`으로 초기화[span_150](start_span)[span_150](end_span)[span_151](start_span)[span_151](end_span)[span_152](start_span)[span_152](end_span) |

