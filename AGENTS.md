# 🌌 Antigravity & Claude Code 개발 협업 가이드 (AGENTS.md)

이 문서는 **SmartNatureWind (v0203)** 프로젝트의 개발 환경, 시스템 아키텍처, 코딩 컨벤션, CBD 계약 및 AI 에이전트 작업 원칙을 총망라한 **단일 진실 공급원(SSOT)** 마스터 가이드입니다.

---

## 🏗️ 1. 개발 환경 요약

| 항목 | 상세 내용 |
|---|---|
| **기본 타깃 MCU** | **ESP32-S3-N16R8** (16MB Flash / 8MB OPI PSRAM, dual-core Xtensa @ 240MHz) |
| **프레임워크 / 빌드** | Arduino-ESP32 (`-std=gnu++17`) on FreeRTOS / PlatformIO IDE |
| **파일 시스템** | LittleFS (`./src/v0203/data_v0203`) |
| **정적 에셋 파이프라인** | SPA 번들 (54개 JS `P010_bundle_0203.js`, 18개 CSS `P000_common_0203.css`, `index.html`) + Level 9 Gzip (`tools_0203/pio_gzip_0203.py`, Gzip 총 118.1 KB) |
| **활성 버전 / 접미사** | **v0203 (FW_Ver_2.0.3)** (C++ 백엔드 소스 `_0203` 접미사 / LittleFS 에셋 `_0203`) |

---

## 📚 2. 단일 진실 공급원 (SSOT) 계약 문서 맵

모든 세부 엔지니어링 명세와 계약 규약은 `src/v0203/contract_doc_0203/` 내 전문 문서를 참조하며, 에이전트는 중복 작성 없이 아래 문서의 규정을 엄격히 준수합니다.

| 계약 문서명 | 담당 영역 및 핵심 SSOT 내용 | 상세 링크 |
|---|---|:---:|
| **SPEC_0203.md** (v2.14) | 시스템 최상위 기술 사양 (하드웨어 핀맵, 25kHz PWM 타이밍, C++ 모듈 구성 및 파일 매핑, JSON 스키마, REST/WebSocket API 전체 명세, §5.1.4 Stage 8 AI 제어 & Gemini Live 실시간 음성 및 비용 가드레일, ADR 1~8, 프론트엔드 54 JS + 18 CSS 번들 규격) | [SPEC_0203.md](src/v0203/contract_doc_0203/SPEC_0203.md) |
| **CONTRACT_0203.md** (v3.1) | FreeRTOS 태스크 경계, 뮤텍스 소유권, 데드락 방지, §3.2 Session 위임 락 순서, §7.15 Stage 8 AI-1~AI-6 실시간 음성 안전 계약(15종 위험명령 차단, 30분 상한, NVS 4키 일일비용 가드레일, AudioWorklet Barge-in Flush), Batch I 물리 Override, SYNC-1~3 | [CONTRACT_0203.md](src/v0203/contract_doc_0203/CONTRACT_0203.md) |
| **STATE_0203.md** (v3.1) | 상태 소유권 매트릭스(§1 `s_aiDailyUsage`/`s_promptCache`/`runtimeAutoOff` 확장), §2.5 Session FSM ↔ runCtx FSM 관계(ADR-1), §6.4 Pause/Resume/Stop 위임 라이프사이클, S10 물리 엔진 상태, §8 E-2 AI 분할 상태 소유권 | [STATE_0203.md](src/v0203/contract_doc_0203/STATE_0203.md) |
| **FLOW_0203.md** (v3.0) | §4.1 Session Start/Pause/Resume/Stop 시퀀스, §13 Stage 8 AI 제어 & Gemini Live 양방향 음성 시퀀스(AudioWorklet 16k/24k, Barge-in, Tool Call 위임, NVS 일일 리셋), `pio_gzip_0203.py` 빌드 전처리/오프라인 부트스트랩 시퀀스 | [FLOW_0203.md](src/v0203/contract_doc_0203/FLOW_0203.md) |
| **BUDGET_0203.md** (v2.9) | SRAM/PSRAM/Flash 메모리 버짓, 태스크별 WCET, §3 async_tcp AI 라우트 8종 WCET, §10.4 Stage 8 AI 자원 영향표, 프론트엔드 Gzip 예산 (118.1 KB / 1MB LittleFS, RAM 33.3%, Flash 23.5%) | [BUDGET_0203.md](src/v0203/contract_doc_0203/BUDGET_0203.md) |
| **TEST_PLAN_0203.md** (v3.2) | 회귀 절차 (§3.5 T-114~T-120 Stage 8 AI 회귀 7건, 총 46건 필수 게이트, `test/e2e_stage8_4.py` 자동화 스크립트), §8 트러블슈팅 매트릭스 | [TEST_PLAN_0203.md](src/v0203/contract_doc_0203/TEST_PLAN_0203.md) |
| **README_0203.md** (v2.13) | CBD 계약 체계 총괄, §3 마일스톤 Stage 8 AI/Live/Guardrails 추가, §7 실측 자원 (RAM 100.4KB / Flash 1.32MB / littlefs 148.8 KB), 커밋 및 검증 스크립트 | [README_0203.md](src/v0203/contract_doc_0203/README_0203.md) |
| **UserManual_0203_002.md** (v2.9) | v0203 사용자 매뉴얼 — §13 Gemini AI 비서 & Live 실시간 음성(Aoede 보이스, Audio Orb, 웨이크워드, Barge-in, 12대 제어도구, 안심 가드레일, 전역 플로팅 마이크 FAB), 12대 웹 UI 화면 조작 가이드, 대시보드 3대 슬라이더 연동, 오프라인 접이식 데모 툴바 | [UserManual_0203_002.md](src/v0203/User_Manual_0203/UserManual_0203_002.md) |

---

## 🛡️ 3. AI 에이전트 필수 4대 불변 원칙 (Invariant Rules)

> [!CAUTION]
> AI 에이전트는 코드 작성, 리팩토링, 디버깅 및 문서화 수행 시 아래 4대 원칙을 단 하나의 예외 없이 준수해야 합니다.

### 원칙 1: C++ 백엔드 수정필요 시 목적, 기능변화 명확하게 정리해서 승인 후 수정 원칙 
- 프론트엔드(Web UI), 오프라인 어댑터, 스타일/프리셋 연동, 문서 현행화 작업 시 **C++ 임베디드 백엔드 소스(`.h`, `.cpp`) 수정이 필요하면 수정 이유(기능 작동관점의 차이점 등)를 명확히 설명하고 나에게 확인 후 수정**
- 백엔드와 프론트엔드 간의 데이터 정합성은 `pio_gzip_0203.py` 자동 동기화 파이프라인(C++ Enum ➔ `000.const.js`, JSON ➔ `998.offline_data_0203.js`)을 통해서만 유지합니다.

### 원칙 2: 지식 그래프 (Graphify) 선행 질의 원칙 (Graph-First Rule)
- 소스 코드나 문서를 열기 전 무차별 검색(`grep_search`)이나 무작위 파일 열람(`view_file`)을 엄격히 금지합니다.
- **2단계 탐색 프로토콜 (Mandatory Protocol)**:
  1. **[1단계] Graphify 선행 질의**: `graphify query "<질문/심볼>"`, `graphify path "<출발>" "<도착>"`, `graphify explain "<심볼>"`로 대상 파일 및 정확한 라인 번호를 먼저 확인.
  2. **[2단계] Pinpoint 최소 범위 열람**: 확인된 타겟 파일과 필요한 최소 라인 범위(`StartLine`, `EndLine`)에 한해서만 `view_file` 실행.
  3. **코드/설계 변경 후 최신화**: 작업 후 `graphify update .`를 실행하여 지식 그래프를 갱신.

### 원칙 3: 정적 에셋 파이프라인 및 오프라인 모듈 분리 규약 (Pipeline Rule)
- 웹 프론트엔드(`data_v0203_src/html_v0203/`) 수정 시 반드시 `python src/v0203/tools_0203/pio_gzip_0203.py`를 실행하여 번들링 및 동기화를 수행해야 합니다.
- **오프라인 2분할 규약 준수**:
  - `998.offline_data_0203.js`: 9개 환경설정 JSON Mock 캐시 전담 (배포 제외).
  - `998.offline_0203.js`: 520줄 경량 시뮬레이터 및 API/WebSocket 가상 인터셉터 (배포 제외).
  - 오프라인 모듈 2종은 LittleFS 플래시 배포 번들에서 100% 영구 제외되어 기기 플래시 오버헤드를 발생시키지 않아야 합니다.
- **i18n CI Gate (Phase 5.7+)**: `pio_gzip_0203.py` staging 진입부에서 `check_i18n.py --strict`가 자동 실행되며, 미정의 키 발견 시 staging을 중단합니다. 긴급 배포 시 `--no-i18n-check` 또는 `platformio.ini`의 `custom_no_i18n_check = true`로 스킵 가능합니다.

### 원칙 4: 계약 기반 변경 및 상대 경로 링크 원칙 (CBD Rule)
- 모듈 인터페이스, FSM 전이, 데이터 스키마 수정 시 관련 계약 문서(`SPEC`, `CONTRACT`, `STATE`, `FLOW` 등)를 동일 커밋으로 동시 갱신합니다.
- 프로젝트 내 모든 문서 간 상호 참조 링크는 반드시 **프로젝트 루트 기준의 상대 경로**(`src/v0203/...`, `agent.md` 등)로 표기합니다.
- 문서 작업 완료 후 `python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict` 검증을 통과해야 합니다.

---

## 📐 4. 핵심 코딩 컨벤션 & 네이밍 치트시트

### 4.1 네이밍 접두사 규칙

| 구분 | 패턴 | 예시 |
|:---|:---|:---|
| **클래스 / 구조체 / Enum** | `CL_[이름]`, `ST_[이름]_t`, `EN_[이름]` | `CL_W10_WebAPI`, `ST_A20_ConfigRoot_t`, `EN_CT10_STATE_IDLE` |
| **상수 / 전역 변수 / 정적** | `G_[이름]`, `g_[이름]`, `s_[이름]` | `G_W10_PAGES_JSON`, `g_A20_config_root`, `s_stateMutex` |
| **멤버 / 지역 / 인자** | `_[이름]` (private), `v_[이름]`, `p_[이름]` | `_currentSpeed`, `v_jsonDocument`, `p_requestObject` |
| **변수 가독성 원칙** | 충분히 긴 의미 명칭 사용 | `v_jsonDocument` (O), `v_doc` (X) / `v_elapsedMs`, `v_isSuccess` |

### 4.2 C++ 백엔드 구현 규칙
1. **ArduinoJson v7**: 반드시 단일 `JsonDocument` 타입 사용 (`doc["key"].to<JsonObject>()` 문법, `createNested*` 금지).
   - **키 검사**: `containsKey("key")` 금지 (v7 비권장/향후 삭제 예정 경고). 대신 `obj["key"].is<JsonVariant>()` 또는 정밀 타입(`obj["key"].is<int>()`, `is<const char*>()` 등) 사용.
2. **로깅**: 항상 `CL_D10_Logger::log(EN_L10_LOG_..., "[모듈] 메시지", ...)` 사용.
3. **메모리/문자열**: 안전한 버퍼 관리를 위해 `memset` + `strlcpy` 패턴 준수. 물리량 계산 시 `float` 상수 `1.0f` 표기.
4. **동시성 보호**: `async_tcp` 컨텍스트에서 `g_A20_config_root` 직접 접근 절대 금지 (`getRootSnapshot` 필수 경유).
5. **세션 FSM & 링 버퍼**: 세션 라이프사이클 이벤트(`pushSessionEvent`)는 메모리 버짓 보호를 위해 64개 고정 링 버퍼(`ST_MON_TimelineEvent_t s_timeline[64]`)로 캡슐화.
6. **센서 캐시 재사용**: 실시간 Comfort(불쾌지수 DI) 계산 시 파일 스코프 DHT 센서 캐시(`s_dhtCache`)를 재사용하여 I2C 블로킹 시간 0ms 유지.
7. **Session 위임 (ADR-1)**: `startSession`/`pauseSession`/`resumeSession`/`stopSession`은 내부 검증 경로(`startUserProfileByNo`/`startOverridePreset`/`startOverrideFixed`)에 위임. `_session`은 export 전용 mirror이며 `decideRunSource`에 참여 금지.
8. **AI 제어 & 가드레일 (AI-1~AI-6)**: 15종 위험 시스템 명령(`reboot`, `factory_reset`, `wifi_modify` 등) 원천 차단(`isDangerousAction`). 12대 허용 도구는 CT10 공개 함수에 위임. Gemini Live 30분 상한(403) 및 일일 $0.50 한도 보호 NVS 4키 누적. 프롬프트 캐시 30초 준수.

### 4.3 프론트엔드 (Web UI) 구현 규칙
1. **널리시 폴백 (NEW-C1)**: 폼 필드 렌더링 시 `||` 연산자 금지, `nz(v, fallback)` 사용 (`0`, `''`, `false` 유효값 보존).
2. **불리언 명시 판정 (NEW-U4)**: 문자열 `"false"` 오판 방지를 위해 `asBool(v)` 사용.
3. **XSS 방어 (B-3/NEW-C2)**: 사용자 입력/표시 텍스트는 반드시 `SNW.DomUtil.escape()` 처리.
4. **모달 오버레이 격리**: 모달 닫기 시 `.snw-modal-overlay`에 `pointer-events: none; visibility: hidden;` 및 `display: 'none'` 적용으로 메뉴 먹통 방지.
5. **컴포넌트 라이프사이클 보호**: Canvas 이퀄라이저(`SNW.UI.equalizer`), 실시간 뷰 unmount 시 이벤트 구독(`_unsubs`) 및 애니메이션 루프(`stop()`) 반드시 해제.
6. **Session state 스펙 (S-6)**: C++ 반환값은 `'ACTIVE'`/`'PAUSED'`/`'COMPLETED'` (프론트에서 `'RUNNING'` 사용 금지).
7. **Preview 파사드 (ADR-5)**: `SNW.Preview.showModal/generate/_animate` 파사드 사용. 실구현은 `140.ui.simulation.js` 위임.
8. **i18n 완전성 (P-2)**: `SNW.I18n.t('key')` 참조 전 반드시 `check_i18n.py --strict` 통과. 신규 키는 ko/en 양쪽 DICT에 대칭 추가.
9. **AudioWorklet & Barge-in (AI-5)**: 마이크 캡처는 16kHz PCM16 Worklet Blob 스트리밍, 재생 큐는 24kHz PCM16, 사용자 발화 시 `AudioPlayback.flush()`로 이전 음성 즉시 소거.

---

## 🛠️ 5. 필수 CLI 명령어 치트시트

```bash
# 1. i18n DICT 완전성 & ko/en 대칭성 사전 검증 (CI Gate, staging 진입부 자동 실행)
python src/v0203/tools_0203/check_i18n.py --strict

# 2. 프론트엔드 에셋 번들링, C++/JSON 자동 동기화 및 Gzip 압축
#    (내부에서 check_i18n.py --strict 자동 실행)
python src/v0203/tools_0203/pio_gzip_0203.py

# 3. 긴급 배포 시 i18n gate 스킵
python src/v0203/tools_0203/pio_gzip_0203.py --no-i18n-check

# 4. CBD 계약 무결성 엄격 검증 (Dry-run)
python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict

# 5. PlatformIO 펌웨어 빌드 / 파일시스템 플래시 업로드 (멀티코어 병렬 빌드 필수: -j 12)
pio run -e esp32-s3-n16r8 -j 12
pio run -e esp32-s3-n16r8 -j 12 --target uploadfs

# 6. Graphify 지식 그래프 질의 및 갱신 (LLM 비용 없음, AST 전용)
graphify query "<질문/심볼명>"
graphify path "<출발노드>" "<도착노드>"
graphify explain "<클래스/함수명>"
graphify update .

# 7. Stage 8 AI 제어 & Gemini Live E2E 7대 시나리오 자동 검증 (기기 연결 시)
python test/e2e_stage8_4.py <DEVICE_IP>
```

---
*모든 기술 설명과 사용자 답변은 명확하고 정중한 **한국어**로 작성합니다.*
