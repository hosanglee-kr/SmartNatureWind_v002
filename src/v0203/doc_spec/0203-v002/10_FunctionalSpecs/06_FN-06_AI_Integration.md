# FN-06. AI 연동 및 프롬프트/액션 제어 기능 명세서

> 📑 [FN-00. 마스터 인덱스로 돌아가기](./00_FN_Master_Index.md)

## 1. 문서 메타데이터
- **기능 ID / 명칭**: `FN-06` / AI 연동 및 프롬프트/액션 제어 (`Gemini AI Proxy, Live Voice & Tool Action Dispatcher`)
- **관련 소스 파일**:
  - 프롬프트/액션 엔진: `CT10_Ctl_AIPrompt_0203.cpp`, `CT10_Ctl_AIAction_0203.cpp`, `CT10_Ctl_0203.h`[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span)[span_2](start_span)[span_2](end_span)
  - HTTP/비동기 워커/Live 라우트: `W10_Web_Gemini_0203.cpp`, `W10_Web_Routes_AILive_0203.cpp`, `W10_Web_0203.h`[span_3](start_span)[span_3](end_span)[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span)
  - 상수/비용 영속화: `A20_Const_Const_0203.h`, `N10_NvsManager_0203.h`, `N10_NvsManager_0203.cpp`[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span)[span_8](start_span)[span_8](end_span)
- **실행 컨텍스트**:
  - 비동기 AI 워커 태스크: `gemini_worker` (FreeRTOS Task, Core 1, Stack `10,240B` 내부 SRAM, Prio `1`)[span_9](start_span)[span_9](end_span)[span_10](start_span)[span_10](end_span)
  - HTTP/Live 라우트 접수: `async_tcp` (`POST /api/v001/ai/gemini` 비동기 큐잉 및 폴링, `POST /api/v001/ai/live-*` 즉시 처리)[span_11](start_span)[span_11](end_span)[span_12](start_span)[span_12](end_span)
- **선행 조건 (Pre-condition)**:
  - STA 모드 Wi-Fi 인터넷 연결 완료(`CL_WF10_WiFiManager::isStaConnected() == true`) 및 TLS 통신 가능 상태[span_13](start_span)[span_13](end_span)[span_14](start_span)[span_14](end_span)
  - `system.security.geminiApiKey` (또는 폴백 `system.security.apiKey`) 설정 완료[span_15](start_span)[span_15](end_span)

---

## 2. 기능 개요 및 비즈니스 규칙 (Overview & Rules)

### 2.1 기능 목적
- Google Gemini API(`gemini-3.5-flash-lite` REST 및 Multimodal Live WebSocket)와 연동하여 **자연어/음성 명령을 14종 안전 제어도구(Function Calling)로 변환·실행**하고, **15종 위험 시스템 명령 차단**, **비동기 Job 워커를 통한 `async_tcp` 워치독 보호**, **일일 30분(1800초) Live 음성 과금 가드레일**을 제공함[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span)[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span).

### 2.2 세부 기능 분할 (`FN-06-01` ~ `FN-06-03`)
- **`FN-06-01` 시스템 프롬프트 조립 및 TTS 폴백 힌트 생성 (`AIPrompt`)**: 25단어(음성 모드 15단어) 이내 엄격 출력 제약 프롬프트 생성, 30초 및 FNV-1a 세션 해시 기반 프롬프트 캐싱, 도구 실행 결과 로컬 음성 폴백 문구(`buildSpeechHint`) 생성[span_20](start_span)[span_20](end_span)
- **`FN-06-02` Gemini AI 비동기 2-Turn 프록시 및 Live 음성 세션 관리 (`W10_Gemini` / `W10_AILive`)**: `gemini_worker` 기반 2-Turn Function Calling 루프, 5초 레이트 리밋, Live 토큰 발급 및 일일 누적 오디오 시간/턴/비용 NVS 추적[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span)[span_23](start_span)[span_23](end_span)
- **`FN-06-03` AI 제어도구 실행기 및 위험 명령 보안 가드 (`AIAction`)**: 15종 위험 명령 블랙리스트 최우선 차단(`isForbiddenAIFunction`), 14종 허용 도구 디스패치(`executeAIAction`) 및 단일 진실 공급원(SSOT) 스키마 선언(`appendAIFunctionDeclarations`)[span_24](start_span)[span_24](end_span)

### 2.3 핵심 비즈니스 규칙
1. **위험 명령 최우선 차단 가드레일 (`CT10_AI::isForbiddenAIFunction`)**:
   - 모든 AI 도구 호출 진입 시 15종 금지 키워드(`reboot`, `restart`, `reset`, `factoryReset`, `factory_reset`, `format`, `clearAll`, `erase`, `shutdown`, `fwUpdate`, `firmware_update`, `ota`, `fileUpload`, `upload`, `erase_nvs`)를 대소문자 무시(`strcasecmp`)로 검사하여 일치 시 즉시 `"error:forbidden"` 반환 및 차단함[span_25](start_span)[span_25](end_span).
2. **프롬프트 캐싱 및 현재 상태 주입 규칙 (`buildAIPromptStrict`)**:
   - `computeSessionHash()`(FNV-1a 해시: `type`, `state`, `profileNo`)가 동일하고 경과 시간이 `30,000ms` 미만이면 `s_cachedPrompt`를 재사용함[span_26](start_span)[span_26](end_span).
   - 캐시 미스 시 현재 팬 상태(`STOPPED/IDLE` 또는 `ACTIVE/PAUSED` + 모드/프리셋/스텝/잔여 타이머)와 한국어 자연어 매핑 규칙을 프롬프트에 동적 주입함[span_27](start_span)[span_27](end_span).
3. **2-Turn 지연 생성 최적화 (`handleNaturalLanguageTurnWorker`)**:
   - Turn 1에서 Gemini가 `functionCall`을 반환하면 `executeAIAction()`으로 도구를 순차 실행함[span_28](start_span)[span_28](end_span).
   - 상태 변경형 명령(`start_preset`, `stop_session` 등)이 성공(`"ok"`)한 경우 불필요한 Turn 2 왕복을 생략하고 로컬 `buildSpeechHint()` 문구를 즉시 반환하여 응답 지연을 단축하며, **조회형(`get_status`, `list_profiles`, `list_schedules` 등 JSON 반환)이거나 실행 실패 시에만 Turn 2를 호출**하여 자연어 요약 응답을 생성함[span_29](start_span)[span_29](end_span).
4. **Live 음성 일일 30분(1800초) 과금 가드레일 (`W10_Web_Routes_AILive_0203.cpp`)**:
   - `G_W10_LIVE_WARN_SEC = 1500` (25분) 도달 시 응답 `level`을 `"warn"`으로 전환하고, `G_W10_LIVE_DAILY_CAP_SEC = 1800` (30분) 이상 도달 시 `POST /api/v001/ai/live-token` 요청을 `403 Forbidden` (`level: "cap"`)으로 차단함[span_30](start_span)[span_30](end_span).
   - 사용량 보고(`POST /api/v001/ai/usage`) 수신 시 `CL_N10_NvsManager::addAIAudioUsage()`가 즉시 `nvs_commit()`을 수행하여 재부팅을 통한 한도 우회를 원천 차단함[span_31](start_span)[span_31](end_span)[span_32](start_span)[span_32](end_span).

---

## 3. 입출력 및 데이터 구조 명세 (I/O & Schema)

### 3.1 주요 상수 및 비동기 Job 구조체 (`W10_Web_0203.h`, `W10_Web_Gemini_0203.cpp`, `A20_Const_Const_0203.h`)[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span)[span_35](start_span)[span_35](end_span)
- **Gemini 엔드포인트 상수 (`A20_Const`)**:
  - `G_GEMINI_MODEL = "gemini-3.5-flash-lite"`[span_36](start_span)[span_36](end_span)
  - `G_GEMINI_REST_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"`[span_37](start_span)[span_37](end_span)
  - `G_GEMINI_LIVE_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"`[span_38](start_span)[span_38](end_span)
- **AI 한도 상수 (`W10_AI_Limits`)**:
  - `G_MAX_REQUEST_BODY = 12288` (12KB), `G_MAX_RESPONSE_BYTES = 8192` (8KB), `G_MAX_JOB_RESP_BYTES = 16384` (16KB PSRAM)[span_39](start_span)[span_39](end_span)
  - `G_AI_WORKER_STACK_BYTES = 10240` (10KB), `G_AI_JOB_TTL_MS = 30000` (30초), `G_RATE_LIMIT_MS = 5000` (5초)[span_40](start_span)[span_40](end_span)
  - `G_GEMINI_TIMEOUT_MS = 20000` (20초), `G_LIVE_TOKEN_TIMEOUT_MS = 10000` (10초)[span_41](start_span)[span_41](end_span)
- **`ST_W10_AiJobSlot_t` (단일 비동기 Job 슬롯)**[span_42](start_span)[span_42](end_span):
  - `state` (`EN_W10_AI_JOB_IDLE=0`, `RUNNING=1`, `DONE=2`, `ERROR=3`), `jobId[32]`, `enqueuedMs`, `finishedMs`, `httpStatus`, `reqBuf` (`12KB+1`), `respBuf` (`16KB+1`)[span_43](start_span)[span_43](end_span)[span_44](start_span)[span_44](end_span)

### 3.2 14종 허용 AI 제어도구 명세 (`CT10_AI::executeAIAction` / `appendAIFunctionDeclarations`)[span_45](start_span)[span_45](end_span)
| No | 도구명 (`name`) | 필수/선택 파라미터 (`args`) | 실행 동작 및 검증 규칙 | 반환 문자열 |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `start_playlist` | `profileName`, `profileNo`, `profileId` | 스냅샷에서 이름(대소문자 무시)/번호/ID로 프로필 검색 후 `PLAYLIST` 세션 시작[span_46](start_span)[span_46](end_span) | `"ok"` / `"error:profile_not_found"`[span_47](start_span)[span_47](end_span) |
| **2** | `start_preset` | `presetCode` (필수), `styleCode` (기본 `BALANCE`) | `S20_resolveWindParams()` 유효성 검증 후 `PRESET` 세션 시작[span_48](start_span)[span_48](end_span) | `"ok"` / `"error:invalid_preset"`[span_49](start_span)[span_49](end_span) |
| **3** | `start_fixed` | `percent` (`1..100`, 필수) | `0.0f ~ 100.0f` 클램핑 후 `FIXED` PWM 세션 시작[span_50](start_span)[span_50](end_span) | `"ok"` / `"error:start_failed"`[span_51](start_span)[span_51](end_span) |
| **4** | `pause_session` | 없음 | `CL_CT10_ControlManager::pauseSession()` 호출[span_52](start_span)[span_52](end_span) | `"ok"` / `"error:pause_failed"`[span_53](start_span)[span_53](end_span) |
| **5** | `resume_session` | 없음 | `CL_CT10_ControlManager::resumeSession()` 호출[span_54](start_span)[span_54](end_span) | `"ok"` / `"error:resume_failed"`[span_55](start_span)[span_55](end_span) |
| **6** | `stop_session` | 없음 | `CL_CT10_ControlManager::stopSession()` 호출[span_56](start_span)[span_56](end_span) | `"ok"` / `"error:stop_failed"`[span_57](start_span)[span_57](end_span) |
| **7** | `set_timer` | `minutes` (`1..480`, 필수) | 정지 상태면 `50%` 고정풍 우선 가동 후 `setSessionAutoOff(minutes)` 설정[span_58](start_span)[span_58](end_span) | `"ok"` / `"error:invalid_minutes"`[span_59](start_span)[span_59](end_span) |
| **8** | `get_status` | 없음 | 현재 세션 상태(`state`, `type`, 풍속/프리셋/스텝, `timerRemainSec`) JSON 생성[span_60](start_span)[span_60](end_span) | JSON 객체 문자열[span_61](start_span)[span_61](end_span) |
| **9** | `list_profiles` | 없음 | 등록된 사용자 프로필 목록(`no`, `name`, `step`) JSON 배열 반환[span_62](start_span)[span_62](end_span) | JSON 배열 문자열[span_63](start_span)[span_63](end_span) |
| **10** | `add_profile` | `name` (필수), `steps[]` (1~8개, 필수), `repeat`, `repeatCount` | CRUD 스키마(`{"profile":{...}}`)로 변환 후 `addUserProfilesFromJson()` 및 `saveDirtyConfigs()` 실행[span_64](start_span)[span_64](end_span) | `"ok"` / `"error:validation_failed"`[span_65](start_span)[span_65](end_span) |
| **11** | `release_manual_to_schedule` | 없음 | `N10::setManualOvrSchedule(false)` 및 `CT10::clearManual()` 호출로 스케줄 무중단 복귀[span_66](start_span)[span_66](end_span) | `"ok"`[span_67](start_span)[span_67](end_span) |
| **12** | `add_schedule` | `name`, `profileId`, `startMinute`, `endMinute` | `profileId` 존재 검증 및 `max(schId)+1` 채번 후 매일 반복 스케줄 생성·저장[span_68](start_span)[span_68](end_span) | `"ok"` / `"error:invalid_profile"`[span_69](start_span)[span_69](end_span) |
| **13** | `list_schedules` | 없음 | 등록된 스케줄 목록(`schId`, `name`, `profileId`, `enabled`, `start`, `end`) JSON 반환[span_70](start_span)[span_70](end_span) | `{"schedules":[...]}`[span_71](start_span)[span_71](end_span) |
| **14** | `control_auto_comfort` | `enabled` (`bool`) | `CL_CT10_ControlManager::setAutoComfort(enabled)` 호출[span_72](start_span)[span_72](end_span) | `"ok"`[span_73](start_span)[span_73](end_span) |

---

## 4. 상태 전이 및 처리 흐름 (State & Sequence)

### 4.1 비동기 AI Job 상태 머신 (`EN_W10_AiJobState_t`)[span_74](start_span)[span_74](end_span)
| 상태 | 진입 조건 | 유지 동작 | 다음 전이 이벤트 |
| :--- | :--- | :--- | :--- |
| **`IDLE`** (`0`)[span_75](start_span)[span_75](end_span) | 부팅 초기 또는 TTL(`30s`) 만료 후 조회[span_76](start_span)[span_76](end_span)[span_77](start_span)[span_77](end_span) | 요청 대기 (`reqBuf` 비어있음)[span_78](start_span)[span_78](end_span) | `POST /api/v001/ai/gemini` 유효 요청 수신 → **`RUNNING`**[span_79](start_span)[span_79](end_span) |
| **`RUNNING`** (`1`)[span_80](start_span)[span_80](end_span) | `s_aiJob` 슬롯 점유 및 `xTaskNotifyGive(s_aiWorkerTask)`[span_81](start_span)[span_81](end_span) | `gemini_worker`가 HTTPS 호출 및 도구 실행 수행, 폴링 시 `202 pending` 응답[span_82](start_span)[span_82](end_span) | 처리 완료 (`httpStatus == 200` → **`DONE`**, 그 외 → **`ERROR`**)[span_83](start_span)[span_83](end_span) |
| **`DONE` / `ERROR`** (`2`/`3`)[span_84](start_span)[span_84](end_span) | `W10_processSingleAiJob()` 완료 기록[span_85](start_span)[span_85](end_span) | `respBuf`에 결과 JSON 보관 (`finishedMs` 기준 `30s`간 보존)[span_86](start_span)[span_86](end_span)[span_87](start_span)[span_87](end_span) | `GET ?jobId=` 조회 반환 후 TTL 경과 시 **`IDLE`**[span_88](start_span)[span_88](end_span) |

### 4.2 자연어 제어 2-Turn 파이프라인 시퀀스 (`POST /api/v001/ai/gemini` → `GET ?jobId=`)[span_89](start_span)[span_89](end_span)
1. **비동기 접수 (`async_tcp`)**: 요청 바디(`<= 12KB`) 누적 후 5초 레이트 리밋 및 `RUNNING` 중복 여부 검사 → `s_aiJob`에 복사 후 `jobId` 발급, 즉시 `202 Accepted` 반환[span_90](start_span)[span_90](end_span)[span_91](start_span)[span_91](end_span).
2. **Turn 1 조립 및 호출 (`gemini_worker`)**: `buildAIPromptStrict()` + `appendAIFunctionDeclarations()` + 최근 6개 대화 이력(`history`)을 직렬화하여 `x-goog-api-key` 헤더로 Gemini HTTPS POST 전송 후 요청 버퍼 즉시 해제(TLS 힙 피크 절약)[span_92](start_span)[span_92](end_span).
3. **도구 디스패치**: 응답에서 `functionCall` 목록을 추출하여 `CT10_AI::executeAIAction()` 순차 실행 및 `buildSpeechHint()` 생성[span_93](start_span)[span_93](end_span).
4. **조건부 Turn 2**: 조회성 JSON 응답이나 실패 결과가 포함된 경우에만 `functionResponse`를 첨부하여 Gemini Turn 2를 호출해 자연어 요약을 생성하고, 단순 제어 성공 시 Turn 2를 생략함[span_94](start_span)[span_94](end_span).
5. **결과 저장 및 프로파일링**: `s_aiJob.respBuf`에 최종 JSON(`ok`, `text`, `_speechHint`, `actions`, `session`)을 기록하고 `[AI_PROF]` 지연·스택 하이워터마크 로그를 출력함[span_95](start_span)[span_95](end_span).

---

## 5. 외부 인터페이스 명세 (REST API & Google Gemini API)
- **로컬 REST 엔드포인트 (`APP-01` §3.4 참조)**:
  - 텍스트/도구 제어: `POST /api/v001/ai/gemini`, `GET /api/v001/ai/gemini?jobId=...`, `POST /api/v001/ai/execute-action`[span_96](start_span)[span_96](end_span)
  - Live 음성 및 비용 제어: `POST /api/v001/ai/live-token`, `POST /api/v001/ai/live-function`, `GET /api/v001/ai/live-config`, `GET /api/v001/ai/cost-status`, `POST /api/v001/ai/usage`, `POST /api/v001/ai/cost-reset`[span_97](start_span)[span_97](end_span)
- **외부 Google Gemini API 규격**:
  - HTTPS POST `A20_Const::G_GEMINI_REST_URL` (`Content-Type: application/json`, `x-goog-api-key: <geminiApiKey>`, `Connection: close`)[span_98](start_span)[span_98](end_span)[span_99](start_span)[span_99](end_span)
  - Live WebSocket URL 전달: `A20_Const::G_GEMINI_LIVE_WS_URL` (기본 음성 `"Aoede"`)[span_100](start_span)[span_100](end_span)[span_101](start_span)[span_101](end_span)

---

## 6. 예외 처리 및 폴트 톨러런스 (Exception & Fail-safe)
| 예외 시나리오 | 감지 방법 | 폴백 및 안전 조치 | HTTP 코드 / 로그 |
| :--- | :--- | :--- | :--- |
| **API Key 미설정** | `W10_getGeminiApiKey()`가 빈 문자열/`nullptr` 반환[span_102](start_span)[span_102](end_span)[span_103](start_span)[span_103](end_span) | 외부 TLS 연결 시도 없이 즉시 차단하여 불필요한 소켓 할당 방지[span_104](start_span)[span_104](end_span)[span_105](start_span)[span_105](end_span) | HTTP `400` / `503` (`Gemini API key not configured`)[span_106](start_span)[span_106](end_span)[span_107](start_span)[span_107](end_span) |
| **요청 폭주 / 중복 실행** | `millis() - s_lastGeminiCallMs < 5000ms` 또는 `s_aiJob.state == RUNNING`[span_108](start_span)[span_108](end_span) | 대기 요청을 거절하고 사용자 재시도 안내[span_109](start_span)[span_109](end_span) | HTTP `429` (`rate limited` / `ai_busy`)[span_110](start_span)[span_110](end_span) |
| **Gemini HTTP/타임아웃 오류** | `HTTPClient::POST` `v_code != 200` (`20초` 타임아웃)[span_111](start_span)[span_111](end_span)[span_112](start_span)[span_112](end_span) | 언어별 로컬 오류 안내 문구(`_speechHint`: `"AI 서비스 응답이 지연되고 있습니다."`)를 포함해 반환[span_113](start_span)[span_113](end_span) | HTTP `502` (`[W10][AI] Turn1 Gemini call failed`)[span_114](start_span)[span_114](end_span) |
| **위험 명령 호출 시도** | `isForbiddenAIFunction(p_fn) == true` (15종 블랙리스트)[span_115](start_span)[span_115](end_span) | 실행 차단 후 `"error:forbidden"` 반환 및 경고 로깅[span_116](start_span)[span_116](end_span) | `[AI] Blocked forbidden function` (`WARN`)[span_117](start_span)[span_117](end_span) |
| **Live 음성 일일 30분 초과** | `getAIDailyUsage().audioSec >= 1800`[span_118](start_span)[span_118](end_span) | 신규 Live 토큰 발급 거부 및 `level: "cap"` 반환[span_119](start_span)[span_119](end_span) | HTTP `403` (`[W10:Live] Token denied`)[span_120](start_span)[span_120](end_span) |

---

## 7. 비기능 요구사항 및 리소스 제약 (Non-Functional)
- **워치독 및 힙 메모리 보호**:
  - HTTPS TLS 핸드셰이크 및 LLM 응답 대기(최대 20초)가 `async_tcp`를 블로킹하지 않도록 전용 FreeRTOS 태스크(`gemini_worker`, Stack `10KB`)로 완전 분리함[span_121](start_span)[span_121](end_span)[span_122](start_span)[span_122](end_span).
  - `s_aiJob.reqBuf`(`12KB`) 및 `respBuf`(`16KB`)는 PSRAM(`MALLOC_CAP_SPIRAM`) 우선 할당 후 내부 SRAM 폴백으로 확보하며, Turn 1 직렬화 문자열(`v_t1Body`)과 응답 문자열(`v_t1Resp`)은 파싱 직후 즉시 해제(`String()`)하여 mbedTLS 힙 피크를 최소화함[span_123](start_span)[span_123](end_span)[span_124](start_span)[span_124](end_span).
- **API Key 보안 정책**:
  - Gemini REST 호출 시 API Key를 URL 쿼리 대신 `x-goog-api-key` HTTP 헤더로 전송하여 로그 노출을 차단함[span_125](start_span)[span_125](end_span).

---

## 8. 검증 기준 (Acceptance Criteria / Test Cases)
| TC ID | 테스트 분류 | 시나리오 및 입력 조건 | 기대 결과 (Expected Output) |
| :--- | :--- | :--- | :--- |
| **TC-06-01** | 비동기 2-Turn 제어 | `POST /api/v001/ai/gemini` 본문 `{"message":"바다바람 틀어줘","lang":"ko"}` 호출 후 `GET ?jobId=...` 폴링 | 접수 시 `202 Accepted`(`jobId`) 반환, 완료 후 `200 OK`와 `actions[0].name == "start_preset"`, `presetCode == "OCEAN"`, `_speechHint == "바다 바람을 틀어드릴게요."` 반환[span_126](start_span)[span_126](end_span)[span_127](start_span)[span_127](end_span) |
| **TC-06-02** | 위험 명령 차단 | `POST /api/v001/ai/execute-action` 본문 `{"name":"factoryReset","args":{}}` 호출 | `isForbiddenAIFunction()`에 의해 차단되어 `ok == false`, `result == "error:forbidden"` 반환 및 기기 초기화 미발생[span_128](start_span)[span_128](end_span)[span_129](start_span)[span_129](end_span) |
| **TC-06-03** | Live 일일 30분 한도 | `POST /api/v001/ai/usage`로 `audioSec=1800` 누적 후 `POST /api/v001/ai/live-token` 요청 | `403 Forbidden` 응답과 `level == "cap"`, `remainingSec == 0` 반환 및 토큰 미발급[span_130](start_span)[span_130](end_span) |
| **TC-06-04** | 프롬프트 캐시 무효화 | 동일 세션 상태에서 10초 간격으로 `buildAIPromptStrict()` 2회 호출 후, 세션 정지(`stopSession`) 뒤 3회차 호출 | 2회차 호출은 `s_cachedPrompt` 즉시 반환, 3회차는 `computeSessionHash()` 변경으로 새 상태(`STOPPED/IDLE`)가 반영된 프롬프트 재생성[span_131](start_span)[span_131](end_span) |
| **TC-06-05** | 레이트 리밋 방어 | `POST /api/v001/ai/gemini` 호출 직후 2초 이내에 동일 엔드포인트 재호출 | 두 번째 요청이 `429 Too Many Requests` (`rate limited`)로 즉시 거절됨[span_132](start_span)[span_132](end_span) |

