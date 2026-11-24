# CONTRACT_0203.md — 동시성 경계 및 API 계약 명세서

## 1. 문서 메타데이터 및 개정 이력
- **문서 ID / 명칭**: `CONTRACT_0203` / FreeRTOS 태스크 소유권, 동시성 경계 및 모듈 API 계약
- **대상 펌웨어**: Smart Nature Wind `FW_Ver_2.0.3` (`79`개 백엔드 소스 파일 기준)
- **관련 소스 파일**: `A20_Const_0203.h`, `A40_Com_Utils_0203.h`, `C10_Config_0203.h/cpp`, `CT10_Ctl_0203.h/cpp`, `W10_Web_0203.h`, `W10_Web_Routes_*_0203.cpp`, `W10_Web_Gemini_0203.cpp`, `WF10_WiFiMgr_0203.h/cpp`, `TM10_TimeMg_0203.h/cpp`, `M10_MotionLogic_0203.h`, `N10_NvsManager_0203.h/cpp`
- **개정 이력**:
  - `v0203.1` (2026-11-23): `v0203` 소스코드 기반 태스크 소유권, `g_A20_config_root` 접근 화이트리스트, L1→L3 락 계층 및 비동기 위임 계약 정립

---

## 2. 실행 태스크 소유권 분리 (Task Ownership)
공유 하드웨어·메모리·네트워크 자원의 경합과 블로킹 전파를 막기 위해 각 서브시스템의 독점 실행 주체를 정의함.

| 실행 태스크 / 컨텍스트 | 특성 (Core / Stack / Prio) | 독점 소유 자원 및 담당 영역 | 직접 호출 금지 대상 |
| :--- | :--- | :--- | :--- |
| **`loopTask` (`T-loop`)** | Arduino `loop()` (`A00_run`, 주기 `10ms` 지연) | `CT10` 제어 루프(`tickLoop`), `CT10_WS_tick`, `M10::tick`, `TM10::tick`, `MON::tick`/`flushCold`, `C10::processPendingFree`, `N10::tick`, `A30_LED::run` | HTTPS TLS 블로킹 호출, `WiFiMulti.run()` 동기 재연결 루프 |
| **`async_tcp` (`T-async`)** | `ESPAsyncWebServer` 비동기 콜백 | HTTP 요청 수신/단편화 Body 누적(`beginBody`~`freeBody`), REST 응답 전송, WS 핸드셰이크 및 브로드캐스트 송신 | `g_A20_config_root.*` 직접 역참조, `reloadAll()` 동기 실행, 장시간 `delay()` 또는 20초 HTTPS 통신 |
| **`gemini_worker` (`T-ai`)** | FreeRTOS Task (`Core 1`, Stack `10,240B`, Prio `1`) | `POST /api/v001/ai/gemini` 비동기 Job 처리, 2-Turn Gemini HTTPS 호출 및 `CT10_AI::executeAIAction` 실행 | `s_aiJob.reqBuf`/`respBuf` 뮤텍스(`s_aiJobMutex`) 미보유 접근 |
| **`WF10_Reconnect` (`T-wf`)** | FreeRTOS Task (Stack `8,192B`, Prio `1`) | `CL_WF10_WiFiManager::applyConfig(s_wifiSnap)` 비동기 재적용 및 `WiFiMulti` 접속 시도 | `async_tcp` 핸들러에서 `WiFi.disconnect()`/`startSTA()` 직접 호출 |
| **`dht_task`** | FreeRTOS Task (`Core 1`, Stack `3,072B`, Prio `1`) | DHT22 온습도 주기 읽기 및 `s_dhtCache` 갱신 (`s_dhtMux` 보호) | `loopTask`에서 DHT 1-Wire 직접 읽기 수행 |

---

## 3. 전역 설정 루트(`g_A20_config_root`) 접근 계약
`A20_Const_0203.h` `[B-2]` 규약에 따라 설정 포인터 스왑(`reloadAll`) 중 Dangling Pointer 및 Torn Read를 차단함.

- **원칙**:
  - `async_tcp` (`T-async`), `T-sys_evt`, `T-wf`, `gemini_worker`, `dht_task`는 반드시 `CL_C10_ConfigManager::getRootSnapshot(ST_A20_ConfigRoot_t& p_out)`으로 `s_rootSwapMux` 보호 하에 8개 포인터를 원자 캡처한 뒤 사용함.
  - `loopTask` (`T-loop`) 내 화이트리스트 모듈(`A00_Main`, `CT10_Ctl_*`, `M10_MotionLogic`)만 직접 접근이 허용되며, `CT10` 접근 시에는 `s_stateMutex` 보유가 전제됨.
  - `S10`(`tick`, `toChartJson`)의 `g_A20_config_root.motion` 참조는 `CT10` `s_stateMutex` 보유 하에서만 호출되어야 함.

---

## 4. 락 계층(Lock Hierarchy) 및 타임아웃 계약
데드락(Deadlock)을 구조적으로 방지하기 위해 다중 락 획득 시 **상위 계층(L1) → 하위 계층(L3)** 단방향 순서만 허용하며, 역순 획득을 금지함.

| 계층 | 동기화 객체 | 소유 모듈 | 보호 자원 | 획득 방식 및 타임아웃 |
| :--- | :--- | :--- | :--- | :--- |
| **L1** | `s_rootSwapMux`, `s_dirtyflagSpinlock`, `s_pendingFreeMux` (`portMUX_TYPE`) | `CL_C10_ConfigManager` | 8개 Config 포인터 스왑/스냅샷, Dirty 플래그, Pending Free 큐 | `portENTER_CRITICAL` / `CL_A40_MuxGuard_Critical` (내부 힙 할당·블로킹 I/O 절대 금지) |
| **L1** | `s_recursiveMutex` (`SemaphoreHandle_t`) | `CL_C10_ConfigManager` | LittleFS 설정 파일 Load/Save/Patch/CRUD 트랜잭션 | `CL_A40_MutexGuard_Semaphore`, `G_A40_MUTEX_TIMEOUT_100` (`100ms`) |
| **L2** | `s_stateMutex` (`SemaphoreHandle_t`) | `CL_CT10_ControlManager` | `runCtx`, `_session`, `overrideState`, `triggerRt`, `scheduleSegRt`, `profileSegRt` | `CL_A40_MutexGuard_Semaphore`, `G_A40_MUTEX_TIMEOUT_100` (`100ms`) |
| **L3** | `_recursiveMutex` (`S10`), `s_stateMutex` (`M10`), `s_monitorMutex` (`MON`), `s_mutex` (`N10`/`TM10`/`WF10`), `s_aiJobMutex` (`W10`) | 각 서브 모듈 | 시뮬레이터 상태/차트, PIR 상태, Warm/Cold 이력, NVS/NTP/Wi-Fi 상태, AI Job 슬롯 | `100ms` 타임아웃 (`M10::_onChange` 콜백 내에서 L2 `CT10` 락 역획득 금지) |

---

## 5. 비동기 위임 및 함수 호출 계약 (Delegation & API Contract)

### 5.1 비동기 위임 패턴 (Delegation)
| 트리거 경로 | 위임 인터페이스 | 대상 실행기 | 동기화 및 병합(Coalescing) 정책 |
| :--- | :--- | :--- | :--- |
| `POST /api/v001/reload` (`async_tcp`) | `CL_CT10_ControlManager::requestReload()` | `loopTask` (`A00_run` → `reloadAll()`) | `s_pendingReload.compare_exchange_strong(false, true)` — 이미 대기 중이면 `false` 반환(`409`) |
| `POST/PATCH /api/v001/motion` (`async_tcp`) | `CL_CT10_ControlManager::requestMotionSimApply()` | `loopTask` (`tickLoop` → `applyMotionSimConfigToSim()`) | `_pendingMotionSimApply.store(true)` — 다음 `tickLoop`에서 1회 소비 |
| `POST/PATCH /api/v001/wifi/config` (`async_tcp`) | `CL_WF10_WiFiManager::requestReconnect()` | `WF10_Reconnect` (`_wifiTask` → `applyConfig()`) | 바이너리 세마포어 `s_wifiRequestSem` — 이미 Pending 시 `EN_WF10_REQ_COALESCED` 반환으로 중복 병합 |
| `POST /api/v001/ai/gemini` (`async_tcp`) | `xTaskNotifyGive(s_aiWorkerTask)` | `gemini_worker` (`W10_processSingleAiJob`) | `s_aiJob` 단일 슬롯 — `RUNNING` 중이면 `429 ai_busy`, 5초 레이트 리밋 적용 |
| `S10::tick()` / `CT10` 상태 변경 | `markDirty()` / `CT10_markDirtyFromSim()` | `loopTask` (`CT10_WS_tick` → `consumeAllDirty()`) | `std::atomic<bool>` 플래그 설정 후 `CT10_WS_tick`이 우선순위·주기 게이트에 따라 전송 |

### 5.2 주요 함수 계약 명세
- **`CL_C10_ConfigManager::getRootSnapshot(ST_A20_ConfigRoot_t& p_out)`**:
  - **호출자**: 모든 비-`loopTask` 태스크 및 읽기 전용 경로 필수.
  - **부수효과**: `p_out`에 8개 포인터 복사; 힙 할당 및 블로킹 I/O 없음.
- **`CL_CT10_ControlManager::startSession(p_type, p_trigger, p_payloadDoc)`**:
  - **전제조건**: `s_stateMutex` 획득 가능 상태.
  - **부수효과**: 기존 활성 세션/오버라이드 정리 후 새 세션 시작, NVS 수동 세션 상태 갱신, `state`/`metrics`/`summary` Dirty 마킹 및 `CT10_Monitor::pushSessionEvent()` 기록.
- **`CL_W10_WebAPI::beginBody` / `appendBody` / `takeBodyBuf` / `freeBody`**:
  - **전제조건**: `total > 0 && total <= 1MB` (`W10_MAX_ACCUM_BODY`).
  - **계약**: `beginBody` 성공 시 `p_request->_tempObject`에 `ST_W10_BodyAccum` 단일 블록을 할당하며, 모든 파싱·오류 분기 종료 전에 반드시 `freeBody`를 호출해 누수를 차단함.
- **`CL_N10_NvsManager::addAIAudioUsage(p_sec, p_turns, p_costUsdX1000)`**:
  - **부수효과**: `s_mutex` 보호 하에 일일 누적치를 가산하고 `saveAIDailyUsageInternal()`로 즉시 `nvs_commit()`을 수행함.
