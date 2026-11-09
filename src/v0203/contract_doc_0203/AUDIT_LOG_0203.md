# AUDIT_LOG_0203.md — v0203 감사 이력 (F-01 ~ Phase 6)

> **목적**: v0203 개발 과정에서 발견·해결된 모든 감사 이슈를 시간순으로 보존한다.
> **상태**: 모든 항목 ✅ 해결 완료. **활성 규약은 [`CONTRACT_0203.md §7.11~§7.18`](CONTRACT_0203.md#711-userprofile--schedule-단일-규격-계약-adr-2-adr-3) 참조.**
> **파일명 정책**: 계약 문서 `_0203.md` 유지.

---

## 📋 목차

1. [기존 감사 F-01~I-6](#71-기존-f-01i-6)
2. [N/G 시리즈](#72-ng-시리즈)
3. [Batch A~F 통합](#73-batch-af-통합)
4. [Batch G — 코드 재검토](#74-batch-g--코드-재검토-c-new-b)
5. [Batch G — B-2 화이트리스트 확정](#75-batch-g--b-2-화이트리스트-확정)
6. [Batch H 프론트엔드 오프라인 로딩](#76-batch-h-프론트엔드-오프라인-로딩-load-12)
7. [Batch I Override](#77-batch-i-override-ovr-14)
8. [Batch I 오프라인·다국어](#78-batch-i-오프라인다국어-offline-13)
9. [프론트-백엔드 동기화](#79-sync-13)
10. [Phase 1~6 감사 이력 (46건)](#710-phase-16-감사-이력-46건)

---

### 7.1 기존 (F-01~I-6)

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| F-01 | 🔴 | `WF10::startSTA` | GOT_IP mutex 경합 → TM10 통지 누락 | startSTA 성공 시 명시 통지 | ✅ |
| F-02 | 🟡 | `_ensureWifiTask` | 태스크 이중 생성 | mutex + double-check | ✅ |
| F-03 | 🔴 | `A00_run` | `M10::tick()` 누락 | 배치 | ✅ |
| F-04 | 🔴 | `A00_run` | `N10::tick()` 누락 | 배치 | ✅ |
| F-05 | 🟡 | `routeReload` | async_tcp 블로킹 | atomic flag 위임 | ✅ |
| F-06 | 🟡 | `routeMotion` | CT10 mutex 대기 | requestMotionSimApply 위임 | ✅ |
| F-07 | 🟢 | D10 Logger | 링버퍼 레이스 | 유실 수용 | ⏸ 수용 |
| F-08 | 🟢 | `A00_run` | root raw 역참조 | loopTask 저위험 | ⏸ 수용 |
| F-09 | 🟡 | `M10::isActive` | 부팅 PIR false-positive | F-03 tick으로 해소 | ✅ |
| F-10 | 🟡 | async_tcp 스택 | 4KB 여유 부족 | 부담 완화, 8KB 후보 | ⚠️ 관측 |
| I-1 | 🟡 | `CT10 export` | reload 판별 불가 | `pendingReload` 노출 | ✅ |
| I-2 | 🟡 | reload+patch | 패치 소실 | SPEC §5.2 명문화 | ✅ |
| I-3 | 🟢 | `CT10::begin` | 잔재 | 방어 store | ✅ |
| I-4 | 🟢 | CT10 클래스 | public 노출 | private 이동 | ✅ |
| I-5 | 🟢 | reload 사이클 | LED 500ms 지연 | 체감 불가 수용 | ⏸ 수용 |
| I-6 | 🟢 | W10 Static | 다중 분할 JS | 번들+Gzip (11→4) | ✅ |

### 7.2 N/G (N-1~N-4, G-1~G-3)

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| N-1 | 🟢 | `CT10 reload` | 런타임 미노출 | `lastReloadOk` | ✅ |
| N-2 | 🟡 | `W10 Static` | pages JSON 손상 | 정적 폴더 우선 | ✅ |
| N-3 | 🟡 | `W10 Static` | root 무한 리다이렉트 | 404 진단 | ✅ |
| N-4 | 🟡 | `W10 Upload` | 핸들 누수 | safeAbort close | ✅ |
| G-1 | 🟢 | `W10 Static` | Accept-Encoding 미검사 | 헤더 분기 | ✅ |
| G-2 | 🟡 | `W10 Static` | long path .gz | regex 대체 | ✅ |
| G-3 | 🟢 | `pio_gzip` | 소스 누락 무시 | fail-fast | ✅ |

### 7.3 Batch A~F 신규

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| A-1 | 🔴 | `tickSegmentSequence` | FIXED self-heal 무한 재호출 | `mode==PRESET` 조건 | ✅ |
| A-2 | 🔴 | CT10 `motion/sim` public | 락 순서 우회 | 위임 3종 + private | ✅ |
| A-3 | 🔴 | `checkApiKey` | null Core Dump | 최상단 null 방어 | ✅ |
| B-1 | 🟢 | `Const_0203.h` | 버전 잔재 | `2.0.0` + SEMVER 분리 | ✅ |
| B-2 | 🟢 | `Const_0203.h` | 화이트리스트 미문서 | §3.1 주석 | ✅ |
| B-3 | 🟡 | `routeFirmwareCheck` | strcmp 오작동 | SemVer 헬퍼 | ✅ |
| B-4 | 🟢 | `N10.h` | NVS 키 리터럴 | `G_N10_KEY_*` | ✅ |
| B-5 | 🟢 | `N10.cpp` | 리터럴 22곳 | 상수 참조 | ✅ |
| B-6 | 🟢 | `A23_Com_ResetCfg` | preset 하드코딩 | `DEFAULT_*` | ✅ |
| C-1~C-8 | 🟢 | S10/A00/TM10/WF10 | 매직넘버 | `G_S10_*` 등 | ✅ |
| D-1 | 🟢 | `IOWS_0203.cpp` | WS tick mutex 4회 | `consumeAllDirty` (4→1) | ✅ |
| D-2 | 🟢 | `Static_0203.cpp` | 매 요청 String | `.gz` 사전 계산 | ✅ |
| D-3 | 🟢 | `W10_registerGzipServe` | String 2회 | 스택 버퍼 (힙 0) | ✅ |
| D-4 | 🟡 | `isStaConnected` | 10ms mutex | atomic lock-free | ✅ |
| D-5 | 🟢 | `toChartJson` | vector 4.8KB | static 배열 | ✅ |
| E-1~E-10 | 🟢 | 다수 | Dead Code | 정리 | ✅ |
| E-2.1~E-2.7 | 🟢 | 29파일 분할 | 대형 파일 | 4~6분할 | ✅ |
| F-1 | 🟡 | `factoryResetFromDefault` | NVS 잔존 | `N10::resetRuntime` | ✅ |
| F-2 | 🟢 | `routeSystem` | 60줄 중복 | `_routeSystemPatchBody` | ✅ |
| F-3 | 🟢 | `routeWifiConfig` | 180줄 중복 | `_routeWifiConfigPatchBody` | ✅ |
| F-4 | 🟢 | `main.cpp` | Logger DEBUG | INFO 변경 | ✅ |
| F-5 | 🟡 | `decideRunSource` | profile fall-through | 명시 IDLE | ✅ |
| F-6 | 🟢 | `_persistOffTimeLastYday` | 리셋 시점 | reloadAll 확인 | ✅ |
| F-7 | 🟢 | `tickOverride` | resolved.valid | 조기 반환 확인 | ✅ |
| F-8 | 🟢 | `S10::applyFan` | 0.01f 임계 | `G_S10_FAN_ZERO_THRESHOLD` | ✅ |
| F-9 | 🟢 | `applyFanConfigCurve` | 0.33/0.66/0.34 | `G_P10_CURVE_SPLIT*` | ✅ |
| F-10 | 🟢 | A40/Sch/UzProf | 매크로 파일 스코프 | Internal 헤더 승격 | ✅ |

### 7.4 Batch G — 코드 재검토 (C, NEW, B)

| ID | 심각도 | 위치 | 내용 | 해결 | 상태 |
|---|---|---|---|---|---|
| **C-1** | 🔴 | `main.cpp` setup | `while(!Serial)` 무한 대기 (USB 미연결 시 부팅 정지) | 3s 타임아웃 (`G_A00_USB_CDC_TIMEOUT_MS`) | ✅ |
| **C-2** | 🔴 | `200.page.dashboard.js` | 프리셋 그리드 mount 순서 (빈 items) | `_mountComponents` 선행 | ✅ |
| **C-3** | 🔴 | `M10::isActive()` | `_state.pirActive` + lastChange 재계산 이중 적용 | `_state.pirActive` 단일 판정 | ✅ |
| **C-4** | 🔴 | `W10_Web_Upload_0203.cpp` | write-only 파일 `available()==0` → 핸들 유출 | `if (s_upFile)` 무조건 close | ✅ |
| **C-5** | 🔴 | `070.router.js` | dispatch 재진입 → 고아 watcher 누수 | `_dispatching` 가드 + 재확인 | ✅ |
| **NEW-C1** | 🔴 | `240.page.settings.js` | `\|\|` falsy 오류 (0값 손실) | `nz()` 헬퍼 (nullish) | ✅ |
| **NEW-C2** | 🔴 | `240.page.settings.js` | `dht.type` 미이스케이프 XSS | `esc()` 적용 | ✅ |
| **NEW-U1** | 🟡 | `240.page.settings.js` | API Key DOM 평문 노출 | `value=""` + placeholder + `(설정됨)` 배지 | ✅ |
| **NEW-U2** | 🟡 | `240.page.settings.js` | API Key 삭제 UI 부재 | `clear-api-key` 체크박스 | ✅ |
| **NEW-U3** | 🟡 | `240.page.settings.js` | wsChConfig 손상 시 UI 미복구 | 4채널 baseline + chName 복원 | ✅ |
| **NEW-U4** | 🟡 | `240.page.settings.js` | 문자열 `"false"` truthy 오판 | `asBool()` 명시 판정 | ✅ |
| **B-1** | 🟠 | `N10::flush` | NVS put × 11 = commit × 11 (100ms 블로킹) | `nvs_set_*` × N + `nvs_commit` 1회 (10ms) | ✅ |
| **B-2** | 🟠 | `W10_Web_Routes_Config/CRUD/WS` | async_tcp `g_A20_config_root` 직접 참조 3곳 | `getRootSnapshot` + strlcpy 로컬 복사 | ✅ |
| **B-3** | 🟠 | `settings/network` JS | deviceName/SSID/hostname XSS | `esc()` 적용 | ✅ |
| **B-4** | 🟠 | `C10::patchSystemFromJson` | `apiKey[0]` 체크로 빈 문자열 무시 (삭제 불가) | `clearApiKey`/`clearGeminiApiKey` 플래그 | ✅ |
| **B-5** | 🟠 | `W10_Web_Static_0203.cpp` | `indexOf("gzip")` → `gzip;q=0` 오탐지 | `W10_acceptsGzip()` RFC 7231 파서 + `Vary` | ✅ |
| **B-6** | 🟡 | `W10_Web_Routes_System_0203.cpp` | routeMotion POST/PATCH 60줄 중복 | `_routeMotionPatchBody` 헬퍼 | ✅ |
| **B-7** | 🟡 | `N10::flush` | `nvs_set_*`/`nvs_commit` 반환값 무시 | 반환값 검사 + dirty 유지 재시도 | ✅ |
| **B-8** | 🟡 | `130.ui.form.js` | 로그 필터 `textContent.includes()` 오매칭 | `.snw-log-lv` 정확 비교 | ✅ |
| **B-9** | 🟡 | `W10_Web_Routes_CRUD_0203.cpp` | WindProfile GET 매 요청 FS read(100ms) + static race | `getRootSnapshot` (2ms) | ✅ |
| **B-10** | 🟢 | `S10_Simul_Core_0203.cpp` | `tick()` 내 브로드캐스트용 JsonDocument dead code | 제거 (dirty 플래그만) | ✅ |
| **B-11** | 🟠 | `A00_Main_0203.cpp` | config 손상 시 부팅 중단 → 웹 복구 불가 | in-memory defaults + Recovery AP (최후) | ✅ |
| **B-12** | 🟠 | `W10_Web_Upload_0203.cpp` | OTA 세션 잔존 + write 반환값 무시 | `Update.abort()` + 반환 검사 | ✅ |
| **B-13** | 🟠 | `A00_Main_0203.cpp` | 음수 LED pin → uint8 캐스팅 → GPIO 255 크래시 | 유효 범위 검증 + 기본값 | ✅ |

### 7.5 B-2 위반 → 수정 후 화이트리스트 최신화

**수정 완료 위치** (async_tcp 컨텍스트):
- `W10_Web_Routes_Config_0203.cpp::routeConfigDirtySave` GET → `getRootSnapshot`
- `W10_Web_Routes_CRUD_0203.cpp::routeUserProfilesPatch` → `getRootSnapshot`
- `W10_Web_Routes_CRUD_0203.cpp::routeWindProfile` GET → `getRootSnapshot` (B-9)
- `W10_Web_WS_0203.cpp::_wsHandshakeAuth` → `getRootSnapshot` + strlcpy

**계약 준수 확정**: §3.1 화이트리스트 예외 없이 async_tcp는 반드시 `getRootSnapshot` 경유.

### 7.6 Batch H 프론트엔드 오프라인 로딩 계약 (LOAD-1~LOAD-2)

- **선행 감지 계약**: `window.SNW_OFFLINE`은 번들 스크립트(`P010_bundle_0203.js`) 실행 전 `index.html` 상단에서 선행 판정 완료 필수.
- **동기 주입 계약**: 오프라인 모드 활성화 시 `document.write('<script src="./js/998.offline_0203.js"><\/script>')`를 통해 번들 실행 전 오프라인 인터셉터가 DOM에 동기 등록되어야 함.
- **부트스트랩 대기 계약**: `999.app.js`의 `SNW_BOOT()`는 `window.SNW_OFFLINE` 활성화 시 `SNW.Offline.ready`가 생성 및 완료될 때까지 안전 대기 가드(Wait Guard)를 수행한 후 API/WebSocket 초기화 진행.

### 7.7 Batch I 바람 물리 파라미터 직접 지정 (Override) 계약 (OVR-1~OVR-4)

- **[OVR-1] 직접 지정(Absolute Override) 원칙**: 기존 상대 델타 가산 구조체(`ST_A20_AdjustDelta_t`)를 완전 폐기하고 `ST_A20_SegmentOverride_t`로 단일화. 바람 강도(`windIntensity`), 변동성(`windVariability`), 돌풍 빈도(`gustFrequency`)는 0~100% 절대 수치로 정의되며, 프론트엔드와 백엔드 간 역산(Delta inverse calculation)을 엄격히 금지함.
- **[OVR-2] WindSolver 직접 치환 계약**: `S20_resolveWindParams`는 `p_override->enabled == true`인 항목에 대해 `PresetBase * StyleFactor` 계산값을 완전히 무시하고 지정된 Override 절대값으로 직접 치환(`v_int = p_override->windIntensity`).
- **[OVR-3] 세그먼트 데이터 직결 규약**: 스케줄(`cfg_schedules_0203.json`) 및 사용자 프로필(`cfg_userProfile_0203.json`) 세그먼트 스키마는 `override: { enabled, windIntensity, windVariability, gustFrequency }` 구조를 필수로 사용. 미지정 시 `enabled: false` 및 `-1.0` 기본값 유지.
- **[OVR-4] 세그먼트 순서 변경(Reindex) 계약**: UI에서 세그먼트 순서 이동(`▲`/`▼`) 시 클라이언트가 즉시 10단위 인덱스(`segNo = (idx + 1) * 10`)로 자동 재계산하여 전송하며, 백엔드는 수신된 순서대로 세그먼트를 큐에 적재.

### 7.8 웹 오프라인 어댑터 및 다국어 지원 규약 (OFFLINE-1~OFFLINE-3)

- **[OFFLINE-1] Mock 데이터 패리티 및 정합성**: `998.offline_data_0203.js`의 `cache.windDict`는 백엔드 `cfg_windDict_0203.json`의 10개 프리셋(`OCEAN` ~ `DESERT_NIGHT`) 및 5개 스타일(`BALANCE`, `ACTIVE`, `FOCUS`, `RELAX`, `SLEEP`) 전체 factors를 100% 동일하게 유지하여 오프라인 환경에서도 온라인과 동등한 물리 시뮬레이션 환경을 보장함.
- **[OFFLINE-2] 엔드포인트 패리티 및 시뮬레이터 반응**: 백엔드 `/control/override` 등 신규 제어 엔드포인트의 오프라인 인터셉트를 필수 지원하며, `startSimulator()` 루프가 `intensity`와 `variability` 파라미터에 기반하여 풍속과 PWM을 실시간 동적 계산하여 UI에 전달함.
- **[OFFLINE-3] 다국어(ko/en) 호환성 및 한/영 병기 표기**: 오프라인 Mock 데이터의 스케줄/프로필 명칭은 한/영 병기 표기(`"아침 바람 (Morning Breeze)"`, `"수면 모드 (Sleep Care)"`)를 기본 제공하여 언어 토글 시 데이터 식별성을 보장하며, 프리셋 관리 화면(`300.page.windprofile.js`)은 `preset.<CODE>` i18n 키 우선 해석 및 `snw:langchange` 리스너를 통해 실시간 언어 전환을 보장함.

### 7.9 프론트엔드-백엔드 데이터 동기화 및 오프라인 모듈 분리 계약 (SYNC-1~SYNC-3)

- **[SYNC-1] C++ Enum 자동 단방향 동기화 규약**: `CT10_Ctl_0203.h`에 정의된 FSM 상태 enum(`EN_CT10_State_t`) 및 원인 코드(`EN_CT10_StateReason_t`)는 `pio_gzip_0203.py` 실행 시 `000.const.js`의 마커 블록(`/* === AUTO-SYNC: C++ ENUM START === */`) 내로 자동 파싱·주입되어야 하며, 프론트엔드와 백엔드 간 상태 코드 불일치(State mismatch)를 원천 차단함.
- **[SYNC-2] 오프라인 어댑터 2분할 및 LittleFS 배포 제외 규약**: 오프라인 환경은 대용량 JSON Mock 캐시 전담 파일(`998.offline_data_0203.js`)과 경량 시뮬레이터 로직(`998.offline_0203.js`)으로 엄격히 2분할 관리함. 두 파일은 `pio_gzip_0203.py`의 `JS_BUNDLE_EXCLUDES` 목록에 등록되어 ESP32 LittleFS 플래시 번들(`P010_bundle_0203.js`)에서 100% 영구 제외되며 기기 런타임 메모리 오버헤드를 유발하지 않아야 함.
- **[SYNC-3] FSM 상태 일치성 및 모달 오버레이 격리 규약**:
  - 대시보드 전원 가동 시 `OVERRIDE_HOLD`(`stateCode=1`, `reasonCode=1`) 상태로 일치 전이하여 토스트 오류를 방지함.
  - 프리셋/스타일 선택 시 슬라이더 3종(강도/변동성/돌풍) 파라미터가 `cfg_windDict_0203.json` 배수 수식에 따라 즉시 동기화되어야 함.
  - 스케줄/프로필 모달 닫기 시 `.snw-modal-overlay`는 CSS 차원(`pointer-events: none; visibility: hidden;`) 및 JS 인라인(`display: 'none'`)으로 완전 비활성화 격리되어 화면 인터랙션 차단을 방지해야 함.

---



### 7.10 v0203_011 — Phase 1~6 감사 이력 (46건)

#### 7.10.1 Phase 1 — Foundation (4건)
| ID | 심각도 | 위치 | 내용 | 해결 |
|---|:---:|---|---|---|
| **N-5** | 🔴 | `020.i18n.js` | Factory Reset 확인어 원시 키 노출 → 초기화 불가 | `settings.factoryResetWord: ko='초기화'/en='RESET'` 추가 |
| **N-6** | 🔴 | `_variables.css` | 모달 z-index(900) < 하단탭(1000) → 탭바가 모달 위 | `--snw-z-modal: 1100`, `--snw-z-toast: 1200`, `--snw-z-bottom: 1000` |
| **N-16** | 🔴 | `A40_Com_Utils_0203.h::_internalInitAndTake` | `portENTER_CRITICAL` 내 `xSemaphoreCreateRecursiveMutex()` (heap alloc) → ESP-IDF assert/hang | critical 밖 생성 + double-check CAS + 경합 패배 시 `vSemaphoreDelete` |
| **N-18** | 🟠 | `999.app.js::SNW.UI.modal` | `overlay.addEventListener('click', 익명 함수)` → `close()`에서 제거 불가 → 리스너 누적 | `_onEsc`/`_onOverlayClick` 참조 보관 + `close()`에서 `removeEventListener` |

#### 7.10.2 Phase 2 — API Contract (4건)
| ID | 심각도 | 위치 | 내용 | 해결 |
|---|:---:|---|---|---|
| **N-2** | 🟠 | `W10_Web_Routes_System_0203.cpp::_routeSystemPatchBody` | timeCfg 변경 시 TM10 미반영 → 재부팅 전까지 무효 | `v_doc["timeCfg"]` 감지 시 `TM10_applyTimeConfigFromSystem` + `TM10_requestTimeSync` |
| **N-3** | 🟠 | `040.api.js`, `998.offline_0203.js` | `SNW.CFG.API.overrideParams = '/api/v001/control/override'` (404) | `/simulation` + `override` 구조체 매핑, deprecated wrapper 유지 |
| **N-7** | 🟡 | `CT10_Ctl_IOWS_0203.cpp::exportStateJson_v02` | `runtime` (NVS) 미노출 → Diagnostics §Runtime 빈 값 | top-level `runtime` 블록 추가, `N10::getState()` 위임 |
| **N-10** | 🔴 | `W10_Web_Util_0203.cpp::checkApiKey`<br>`W10_Web_Gemini_0203.cpp::W10_getGeminiApiKey` | async_tcp 컨텍스트에서 `g_A20_config_root.system` 직접 참조 (B-2 위반, torn read) | `getRootSnapshot(v_snap)` + `strlcpy` 로컬 복사 |

#### 7.10.3 Phase 3 — Session Engine (ADR-1, ADR-3) (6건)
| ID | 심각도 | 위치 | 내용 | 해결 |
|---|:---:|---|---|---|
| **N-1** | 🔴 | `CT10_Ctl_Ctl_0203.cpp::startSession` | `_session`만 세팅, `runSource`/`overrideState` 미갱신 → 세션 시작해도 팬 안 돔 | ADR-1 위임 모델: `startUserProfileByNo`/`startOverridePreset`/`startOverrideFixed`로 위임 |
| **S-2** | 🔴 | `pauseSession`/`resumeSession`/`stopSession` | pause가 `sim.stop()`만 → resume 시 컨텍스트 유실 | `_pausedExec` 백업 + Smart Resume (5분/30분) + stop 멱등 |
| **S-3** | 🔴 | `CT10_Ctl_Ctl_Seg_0203.cpp::tickSchedule` | profileId 스케줄 실행 분기 정합 | ADR-3 profileId 참조 단일 실행 (하위 호환 fallback 제거) |
| **S-4** | 🟡 | `CT10_Ctl_IOWS_0203.cpp::exportStateJson_v02` | `session.profileName`, `stepRemainSec` 미노출 → NowPlaying Bar 제목/시간 무효 | `_session.payload.playlist` 확장 (`profileName[32]`, `currentStepDurationMs/StartMs`) |
| **S-5** | 🟡 | `200.page.dashboard.js::_onSimUpdate` | `s.type !== 'NONE'` (숫자 0 ≠ 문자열 → 항상 true) | `Number(s.type) > 0` 명시 판정 |
| **S-6** | 🟡 | `998.offline_0203.js` | `state='RUNNING'` (C++ 스펙 `'ACTIVE'`) | `'ACTIVE'` 통일 |

#### 7.10.4 Phase 4 — Schema Alignment (ADR-2) (4건)
| ID | 심각도 | 위치 | 내용 | 해결 |
|---|:---:|---|---|---|
| **ADR-2** | 🟠 | `C10_Config_UzProf_*` | 스키마 이중화 혼선 | `steps[]` 단일 배열 및 `repeatSegments` 단일 필드 표준화 |
| **N-4** | 🟠 | `C10_Config_UzProf_Util_0203.cpp::C10_fromJson_UserProfileItem` | 프론트엔드/백엔드 반복 필드명 불일치 | `repeatSegments` 단일 필드로 고정 |
| **N-23** | 🟢 | `220.page.schedule.js::_onToggle` | 스케줄 토글 시 재발급 정합 | 확인만, 정상 확인 |
| **N-30** | 🟢 | `998.offline_0203.js::addProfile/updateProfile` | Studio profile body 언래핑 누락 | `_unwrap(b, 'profile')` 또는 root 수용 |

#### 7.10.5 Phase 5 — Preview/i18n/Router/Monitor (ADR-5) (5건)
| ID | 심각도 | 위치 | 내용 | 해결 |
|---|:---:|---|---|---|
| **P-1** | 🔴 | `135.util.preview.js` | `SNW.Preview.showModal/generate/_animate` 미정의 → TypeError | ADR-5 파사드 3종 추가 (segment 형식 자동 래핑) |
| **P-2** | 🔴 | `020.i18n.js` | ~250키 누락 → 화면 raw key 노출 | DICT 대량 추가 (ko/en, 총 475키) + `check_i18n.py` CI Gate |
| **P-3** | 🟠 | `070.router.js` | `/monitor` 경로 미등재 → Monitor 페이지 진입 불가 | ROUTES + NAV_GROUPS 추가 (level L2) |
| **P-4** | 🟠 | `210.page.chart.js` | `_drawOverlay` 미정의 → 예상 오버레이 체크 시 TypeError | `_drawOverlay()` + `_ensurePreviewBuffer()` 구현 |
| **P-5** | 🟠 | `140.ui.simulation.js` | modal onCancel 부재로 ESC/외부 클릭 시 Promise hang | `() => { close(null); }` 콜백 제공 (N-19 해결) |

#### 7.10.6 Phase 6 — Offline Adapter (N-11~N-14, N-28) (5건)
| ID | 심각도 | 위치 | 내용 | 해결 |
|---|:---:|---|---|---|
| **N-11** | 🟠 | `998.offline_0203.js::applyScenario` | `'SLEEP'`/`'FOREST'` 프리셋 코드 미실존 | `'OCEAN'+SLEEP`, `'FOREST_CANOPY'+BALANCE`, `'OCEAN'+ACTIVE` |
| **N-12** | 🟠 | `998.offline_0203.js::resolvePreset` | `target?.params?.windIntensity` (경로 오류, 실제 `factors`) | `target.factors.windIntensity` + 스타일 곱연산 |
| **N-13** | 🟡 | `998.offline_0203.js` | `session.state='RUNNING'` (C++ 스펙 위반) | `'ACTIVE'` 통일 |
| **N-14** | 🟠 | `998.offline_0203.js::renderOfflineToolbar` | `#app.firstChild` 삽입 → grid row 1 점유 레이아웃 붕괴 | `document.body.firstChild` 삽입 |
| **N-28** | 🟡 | `998.offline_0203.js::startSimulator` | 세션 진행 시뮬 없음 → `stepRemainSec` 고정 | `setInterval` 내 stepRemainSec 감소 + Step 전환 |

#### 7.10.7 Phase 1~6 수용 이슈 (3건)
| ID | 내용 | 사유 |
|---|---|---|
| **N-17** | `exportStateJson` 내 S10 락 순서 | 이미 CT10 → S10 순서 (안전), 문서화만 |
| **N-22** | Firmware 업로드 중 이탈 | `unmount` 가드 유지 (의도된 동작) |
| **N-26** | `.snw-sidebar:not([hidden])` 죽은 규칙 | CSS 유지보수 개선 (기능 영향 없음) |

### 7.10 대시보드·세그먼트·스타일 통합 물리 파이프라인 (PHY-1~PHY-4)
- **[PHY-1] 단일 정본**: `S20_resolveWindParams`가 모든 풍속 파라미터(강도/변동/돌풍/난류/열기포)를 결정.
- **[PHY-2] 스타일 정규화**: 5종 스타일(BALANCE/ACTIVE/FOCUS/RELAX/SLEEP) multipliers가 10개 프리셋에 100% 동일하게 작용.
- **[PHY-3] 개별 오버라이드 격리**: 슬라이더 조작 시 `override.enabled=true`, 프리셋/스타일 재선택 시 자동 해제.
- **[PHY-4] 상태 안전**: 모든 물리 반영은 `_recursiveMutex` 하에서 원자적으로 수행.
