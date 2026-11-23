# CONTRACT_0203.md — 동시성 경계 및 API 계약 명세서

## 1. 문서 메타데이터
- **문서 ID / 명칭**: `CONTRACT_0203` / FreeRTOS 태스크 소유권, 호출 경계 및 비동기 위임 계약[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)
- **기준 펌웨어 버전**: `FW_Ver_2.0.3` (`G_JSON_VERSION = "0203"`)[span_3](start_span)[span_3](end_span)
- **개정 이력 (Revision History)**:
  - `v2.0.3` (`2026-11-23`): `v0203` 79개 백엔드 소스 기준 5대 태스크 호출 경계, `g_A20_config_root` 스냅샷 규약, `L1→L3` 락 계층 및 비동기 위임 계약 명세화[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)

---

## 2. 태스크 소유권 및 실행 컨텍스트 분리 (Task Ownership)
멀티태스크 경합 및 데드락 방지를 위해 주요 실행 컨텍스트별 독점 책임과 접근 규칙을 아래와 같이 고정함.

| 실행 컨텍스트 | 구현 주체 / 태스크명 | 독점 책임 영역 | `g_A20_config_root` 접근 계약 |
| :--- | :--- | :--- | :--- |
| **`T-loop`** | Arduino `loop()` (`A00_run`)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span) | 제어 루프(`CT10`), WS 우선순위 스케줄러(`CT10_WS_tick`), 모션/시간/모니터 틱, 지연 메모리 해제(`processPendingFree`), NVS 주기 플러시, LED 갱신[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span) | 화이트리스트(`A00`, `CT10`, `M10`)에 한해 직접 접근 허용 (`s_stateMutex` 보유 권고)[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span) |
| **`T-async`** | `ESPAsyncWebServer` 비동기 콜백[span_15](start_span)[span_15](end_span)[span_16](start_span)[span_16](end_span) | REST API 라우팅, 단편화 HTTP Body 누적/파싱, API Key 검증, 5대 WebSocket 핸드셰이크 및 브로드캐스트[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span) | **직접 역참조 엄격 금지** — 반드시 `CL_C10_ConfigManager::getRootSnapshot()` 원자 스냅샷 사용[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span) |
| **`T-ai`** | `gemini_worker` (`Core 1`, Stack `10240B`, Prio `1`)[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span) | Gemini HTTPS REST 호출(`W10_callGeminiApi`), 2-Turn Function Calling 루프, 도구 실행 위임(`CT10_AI::executeAIAction`)[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span) | `getRootSnapshot()` 스냅샷 경유 (`W10_getGeminiApiKey` 내부 전용)[span_28](start_span)[span_28](end_span) |
| **`T-wf`** | `WF10_Reconnect` (Stack `8192B`, Prio `1`)[span_29](start_span)[span_29](end_span) | Wi-Fi 설정 변경 시 `applyConfig()` 실행, AP/STA 재기동 및 NTP 재연동 트리거[span_30](start_span)[span_30](end_span) | `getRootSnapshot()` 스냅샷 경유 (`s_wifiSnap` 로컬 복사 후 적용)[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span) |
| **`T-dht`** | `dht_task` (`Core 1`, Stack `3072B`, Prio `1`)[span_33](start_span)[span_33](end_span) | DHT22 온습도 주기 읽기 및 `s_dhtCache` 갱신 (`s_dhtMux` 보호)[span_34](start_span)[span_34](end_span) | `getRootSnapshot()` 스냅샷 경유 (`system.hw.tempHum` 참조)[span_35](start_span)[span_35](end_span) |
| **`T-sys_evt`** | `WiFi.onEvent` 시스템 이벤트 콜백[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span) | `STA_START`, `STA_GOT_IP`, `STA_DISCONNECTED` 이벤트 처리 및 자동 재연결(`WiFi.reconnect()`)[span_38](start_span)[span_38](end_span) | `getRootSnapshot()` 스냅샷 경유 (`TM10::onWiFiConnected` 전달)[span_39](start_span)[span_39](end_span)[span_40](start_span)[span_40](end_span) |

---

## 3. 함수 계약 및 호출 경계 매트릭스 (Function Contracts)

### 3.1 `T-async` → `T-loop` / `T-wf` / `T-ai` 비동기 위임 계약
블로킹 I/O(Flash 재로드, 시뮬레이션 재초기화, Wi-Fi 재접속, TLS 통신)가 `async_tcp`를 점유하는 것을 금지하고 아래 위임 API를 사용함.

| 위임 진입 API (`T-async` 호출) | 내부 동기화/위임 수단 | 실제 실행 컨텍스트 | 반환 / 응답 계약 |
| :--- | :--- | :--- | :--- |
| `CL_CT10_ControlManager::requestReload()`[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span) | `s_pendingReload.compare_exchange_strong(false, true)`[span_43](start_span)[span_43](end_span) | `T-loop` (`A00_run` → `reloadAll()`)[span_44](start_span)[span_44](end_span) | 이미 대기 중이면 `false` (`HTTP 409`), 성공 시 `true` (`HTTP 202 queued`)[span_45](start_span)[span_45](end_span) |
| `CL_CT10_ControlManager::instance().requestMotionSimApply()`[span_46](start_span)[span_46](end_span)[span_47](start_span)[span_47](end_span) | `_pendingMotionSimApply.store(true, memory_order_release)`[span_48](start_span)[span_48](end_span) | `T-loop` (`tickLoop` → `applyMotionSimConfigToSim()`)[span_49](start_span)[span_49](end_span) | 즉시 `HTTP 200 {"updated":true}` 반환 후 다음 `tickLoop`에서 반영[span_50](start_span)[span_50](end_span)[span_51](start_span)[span_51](end_span) |
| `CL_WF10_WiFiManager::requestReconnect()`[span_52](start_span)[span_52](end_span)[span_53](start_span)[span_53](end_span)[span_54](start_span)[span_54](end_span) | `xSemaphoreGive(s_wifiRequestSem)` (Binary Semaphore)[span_55](start_span)[span_55](end_span) | `T-wf` (`WF10_Reconnect` → `applyConfig()`)[span_56](start_span)[span_56](end_span) | 정상 시그널 `EN_WF10_REQ_OK(0)`, 중복 대기 시 `COALESCED(1)`, 실패 시 `FAILED(2)`[span_57](start_span)[span_57](end_span)[span_58](start_span)[span_58](end_span) |
| `POST /api/v001/ai/gemini` (`routeGeminiProxy`)[span_59](start_span)[span_59](end_span) | `s_aiJob` 슬롯 복사 + `xTaskNotifyGive(s_aiWorkerTask)`[span_60](start_span)[span_60](end_span) | `T-ai` (`gemini_worker` → `W10_processSingleAiJob()`)[span_61](start_span)[span_61](end_span) | `5초` 레이트 리밋 통과 시 `HTTP 202` (`jobId`) 반환, 클라이언트는 `GET ?jobId=`로 폴링[span_62](start_span)[span_62](end_span)[span_63](start_span)[span_63](end_span) |

### 3.2 캡슐화 위임 및 락 보호 함수 계약 (`CL_CT10_ControlManager` / `CL_C10_ConfigManager`)
- **`CL_CT10_ControlManager::feedPIR(bool p_detected)`**: `T-async`에서 호출 시 `s_stateMutex`(L2) 획득 후 `motion->feedPIR()`를 호출하며, `M10` 내부 `_onChange` 콜백에서는 상위 락을 역순 획득하지 않음[span_64](start_span)[span_64](end_span)[span_65](start_span)[span_65](end_span)[span_66](start_span)[span_66](end_span).
- **`CL_CT10_ControlManager::patchSimFromJson` / `exportSimJson`**: `sim` 멤버를 `private`로 캡슐화하고 `s_stateMutex`(L2) 보유 하에 `S10` 메서드를 호출함[span_67](start_span)[span_67](end_span)[span_68](start_span)[span_68](end_span)[span_69](start_span)[span_69](end_span).
- **`CL_C10_ConfigManager::getRootSnapshot(ST_A20_ConfigRoot_t& p_out)`**: `s_rootSwapMux`(L1) 스핀락 내에서 `memcpy`로 8개 포인터를 원자 복사하며, 임계 구역 내부에 동적 할당이나 블로킹 호출을 두지 않음[span_70](start_span)[span_70](end_span)[span_71](start_span)[span_71](end_span)[span_72](start_span)[span_72](end_span).
- **`CL_C10_ConfigManager::queuePendingFree` / `processPendingFree`**: `reloadAll()` 시 구버전 루트를 즉시 `delete`하지 않고 `s_pendingFreeMux`(L1) 보호 큐(2슬롯)에 적재한 뒤 `3,000ms` 경과 시 `T-loop`에서 해제함[span_73](start_span)[span_73](end_span)[span_74](start_span)[span_74](end_span)[span_75](start_span)[span_75](end_span).

---

## 4. 계층적 락 순서 및 논블로킹 규칙 (Lock Hierarchy & Non-blocking)

### 4.1 락 획득 순서 불변식 (`L1 → L2 → L3`)
멀티스레드 교착 상태(Deadlock)를 방지하기 위해 아래 계층 번호의 **오름차순**으로만 락을 획득함(하위 락 보유 중 상위 락 획득 금지)[span_76](start_span)[span_76](end_span)[span_77](start_span)[span_77](end_span).

| 계층 | 동기화 객체 | 소유 클래스 | 보호 대상 | 타임아웃 정책 |
| :---: | :--- | :--- | :--- | :--- |
| **L1** | `s_rootSwapMux`, `s_dirtyflagSpinlock`, `s_pendingFreeMux` (`portMUX_TYPE`)[span_78](start_span)[span_78](end_span) | `CL_C10_ConfigManager`[span_79](start_span)[span_79](end_span) | Config 포인터 스왑/스냅샷, Dirty 플래그, Pending Free 큐[span_80](start_span)[span_80](end_span) | 스핀락 즉시 진입/해제 (힙 할당 금지)[span_81](start_span)[span_81](end_span) |
| **L1** | `s_recursiveMutex` (`SemaphoreHandle_t`)[span_82](start_span)[span_82](end_span) | `CL_C10_ConfigManager`[span_83](start_span)[span_83](end_span) | LittleFS 설정 Load/Save/Patch/CRUD 트랜잭션[span_84](start_span)[span_84](end_span) | `G_A40_MUTEX_TIMEOUT_100` (`100ms`)[span_85](start_span)[span_85](end_span)[span_86](start_span)[span_86](end_span) |
| **L2** | `s_stateMutex` (`SemaphoreHandle_t`)[span_87](start_span)[span_87](end_span) | `CL_CT10_ControlManager`[span_88](start_span)[span_88](end_span) | `runCtx`, `_session`, `overrideState`, `triggerRt`, 세그먼트 RT[span_89](start_span)[span_89](end_span) | `G_A40_MUTEX_TIMEOUT_100` (`100ms`)[span_90](start_span)[span_90](end_span) |
| **L3** | `_recursiveMutex` (`S10`), `s_stateMutex` (`M10`), `s_monitorMutex` (`MON`), `s_mutex` (`N10`/`TM10`/`WF10`), `s_aiJobMutex` (`W10`)[span_91](start_span)[span_91](end_span)[span_92](start_span)[span_92](end_span)[span_93](start_span)[span_93](end_span)[span_94](start_span)[span_94](end_span)[span_95](start_span)[span_95](end_span)[span_96](start_span)[span_96](end_span)[span_97](start_span)[span_97](end_span) | 각 서브 모듈[span_98](start_span)[span_98](end_span)[span_99](start_span)[span_99](end_span)[span_100](start_span)[span_100](end_span)[span_101](start_span)[span_101](end_span)[span_102](start_span)[span_102](end_span)[span_103](start_span)[span_103](end_span)[span_104](start_span)[span_104](end_span) | 시뮬레이션/모션/모니터/NVS/시간/Wi-Fi/AI Job 상태[span_105](start_span)[span_105](end_span)[span_106](start_span)[span_106](end_span)[span_107](start_span)[span_107](end_span)[span_108](start_span)[span_108](end_span)[span_109](start_span)[span_109](end_span)[span_110](start_span)[span_110](end_span)[span_111](start_span)[span_111](end_span) | `100ms` (`xSemaphoreTakeRecursive` / `xSemaphoreTake`)[span_112](start_span)[span_112](end_span)[span_113](start_span)[span_113](end_span)[span_114](start_span)[span_114](end_span)[span_115](start_span)[span_115](end_span)[span_116](start_span)[span_116](end_span)[span_117](start_span)[span_117](end_span)[span_118](start_span)[span_118](end_span) |

### 4.2 논블로킹 및 리소스 보호 계약
- **뮤텍스 타임아웃 시 폴백**: `CL_A40_MutexGuard_Semaphore` 획득 실패(`isAcquired() == false`) 시 무한 대기하지 않고 즉시 안전 기본값(`false`, `0`, 빈 스냅샷 등)을 반환하여 `loopTask` TWDT(`10초`) 및 `async_tcp` 응답 지연을 방지함[span_119](start_span)[span_119](end_span)[span_120](start_span)[span_120](end_span)[span_121](start_span)[span_121](end_span)[span_122](start_span)[span_122](end_span)[span_123](start_span)[span_123](end_span).
- **WS 브로드캐스트 단일 틱 1채널 제한**: `CT10_WS_tick()`은 `s_prio` 우선순위 배열 순서로 `CT10_WS_trySendOne_v03()`를 호출하여 **1회 전송 성공 시 즉시 `break`**함으로써 `loopTask` 및 `AsyncWebSocket` 송신 큐 포화를 예방함[span_124](start_span)[span_124](end_span).
- **업로드/OTA 단일 소유권**: `s_uploadOwner`가 활성화된 상태에서 다른 요청이 진입하면 `G_W10_UPLOAD_BUSY_TAG`로 마킹하고 `429`를 반환하며, `onDisconnect` 콜백에서 열린 `File` 또는 `Update` 세션을 즉시 정리함[span_125](start_span)[span_125](end_span).

