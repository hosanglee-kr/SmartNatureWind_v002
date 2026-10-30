# 🌌
Antigravity & Claude Code 개발 협업 가이드 (AGENTS.md)

이 문서는 **Smart Nature Wind (v0202)** 프로젝트의 개발 환경, 시스템 아키텍처, 코딩 컨벤션, CBD 계약 및 AI 에이전트 작업 원칙을 총망라한 **단일 진실 공급원(SSOT)** 마스터 가이드입니다.

---

## 🏗️ 1. 개발 환경 요약

| 항목 | 상세 내용 |
|---|---|
| **기본 타깃 MCU** | **ESP32-S3-N16R8** (16MB Flash / 8MB OPI PSRAM, dual-core Xtensa @ 240MHz) |
| **프레임워크 / 빌드** | Arduino-ESP32 (`-std=gnu++17`) on FreeRTOS / PlatformIO IDE |
| **파일 시스템** | LittleFS (`./src/v0202/data_v0202`) |
| **정적 에셋 파이프라인** | SPA 번들 (`P010_bundle_0202.js`, `P000_common_0202.css`, `index.html`) + Level 9 Gzip (`tools_0202/pio_gzip_0202.py`, 총 75 KB) |
| **활성 버전 / 접미사** | **v0202 (FW_Ver_2.0.2)** (C++ 백엔드 소스 `_0202` 접미사 / LittleFS 에셋 `_0202`) |

---

## 📚 2. 단일 진실 공급원 (SSOT) 계약 문서 맵

모든 세부 엔지니어링 명세와 계약 규약은 `src/v0202/contract_doc_0202/` 내 전문 문서를 참조하며, 에이전트는 중복 작성 없이 아래 문서의 규정을 엄격히 준수합니다.

| 계약 문서명 | 담당 영역 및 핵심 SSOT 내용 | 상세 링크 |
|---|---|:---:|
| **SPEC_0202.md** (v2.10) | 시스템 최상위 기술 사양 (하드웨어 핀맵, 25kHz PWM 타이밍, C++ 모듈 구성 및 파일 매핑, JSON 스키마, REST/WebSocket API 전체 명세, 프론트엔드 에셋 번들 규격) | [SPEC_0202.md](src/v0202/contract_doc_0202/SPEC_0202.md) |
| **CONTRACT_0202.md** (v2.8) | FreeRTOS 태스크 경계, 뮤텍스 소유권, 데드락 방지, 감사 해결 규약(A-1~G-3), 바람 물리 Override 계약(OVR-1~4), 프론트엔드 데이터 동기화 및 오프라인 계약(SYNC-1~3) | [CONTRACT_0202.md](src/v0202/contract_doc_0202/CONTRACT_0202.md) |
| **STATE_0202.md** (v2.5) | 런타임 상태 변수 단일 Writer/Reader 소유권 매트릭스, CT10 메인 제어 상태머신(7-State FSM) 전이표, S10 물리 엔진 상태, 위임 플래그 수명주기 | [STATE_0202.md](src/v0202/contract_doc_0202/STATE_0202.md) |
| **FLOW_0202.md** (v2.8) | 부팅 시퀀스, HTTP/WS 처리 루프, 센서 샘플링/물리 연산 파이프라인, WindSolver 파라미터 직접 치환 흐름, `pio_gzip_0202.py` 빌드 전처리/오프라인 부트스트랩 시퀀스 | [FLOW_0202.md](src/v0202/contract_doc_0202/FLOW_0202.md) |
| **BUDGET_0202.md** (v2.7) | SRAM/PSRAM/Flash 메모리 버짓, 태스크별 최악 실행 시간(WCET), 블로킹 시간 한도, 프론트엔드 Gzip 예산 (75 KB / 100 KB 한도, RAM 33.1%, Flash 23.3%) | [BUDGET_0202.md](src/v0202/contract_doc_0202/BUDGET_0202.md) |
| **TEST_PLAN_0202.md** (v2.7) | 단위/통합/스트레스 회귀 테스트 절차 (T-1~T-73), 29대 필수 릴리스 차단 게이트, 트러블슈팅 매트릭스 | [TEST_PLAN_0202.md](src/v0202/contract_doc_0202/TEST_PLAN_0202.md) |
| **README_0202.md** (v2.8) | CBD 계약 체계 총괄 안내, 배치별 마일스톤 감사 요약, CBD 변경 워크플로, 커밋 및 검증 스크립트 | [README_0202.md](src/v0202/contract_doc_0202/README_0202.md) |
| **UserManual_0202_002.md** (v2.7) | 12대 웹 UI 화면 조작 가이드, 대시보드 3대 슬라이더 연동, 오프라인 접이식 데모 툴바, 10종 프리셋 상세 해설 | [UserManual_0202_002.md](src/v0202/User_Manual_0202/UserManual_0202_002.md) |

---

## 🛡️ 3. AI 에이전트 필수 4대 불변 원칙 (Invariant Rules)

> [!CAUTION]
> AI 에이전트는 코드 작성, 리팩토링, 디버깅 및 문서화 수행 시 아래 4대 원칙을 단 하나의 예외 없이 준수해야 합니다.

### 원칙 1: C++ 백엔드 수정필요 시 목적, 기능변화 명확하게 정리해서 승인 후 수정 원칙 
- 프론트엔드(Web UI), 오프라인 어댑터, 스타일/프리셋 연동, 문서 현행화 작업 시 **C++ 임베디드 백엔드 소스(`.h`, `.cpp`) 수정이 핗요하면 수정 이유(기능 작동관점의 차이점 등)를 명확히 설명하고 나에게 확인후 수정**
- 백엔드와 프론트엔드 간의 데이터 정합성은 `pio_gzip_0202.py` 자동 동기화 파이프라인(C++ Enum ➔ `000.const.js`, JSON ➔ `998.offline_data_0202.js`)을 통해서만 유지합니다.

### 원칙 2: 지식 그래프 (Graphify) 선행 질의 원칙 (Graph-First Rule)
- 소스 코드나 문서를 열기 전 무차별 검색(`grep_search`)이나 무작위 파일 열람(`view_file`)을 엄격히 금지합니다.
- **2단계 탐색 프로토콜 (Mandatory Protocol)**:
  1. **[1단계] Graphify 선행 질의**: `graphify query "<질문/심볼>"`, `graphify path "<출발>" "<도착>"`, `graphify explain "<심볼>"`로 대상 파일 및 정확한 라인 번호를 먼저 확인.
  2. **[2단계] Pinpoint 최소 범위 열람**: 확인된 타겟 파일과 필요한 최소 라인 범위(`StartLine`, `EndLine`)에 한해서만 `view_file` 실행.
  3. **코드/설계 변경 후 최신화**: 작업 후 `graphify update .`를 실행하여 지식 그래프를 갱신.

### 원칙 3: 정적 에셋 파이프라인 및 오프라인 모듈 분리 규약 (Pipeline Rule)
- 웹 프론트엔드(`data_v0202_src/html_v0202/`) 수정 시 반드시 `python src/v0202/tools_0202/pio_gzip_0202.py`를 실행하여 번들링 및 동기화를 수행해야 합니다.
- **오프라인 2분할 규약 준수**:
  - `998.offline_data_0202.js`: 9개 환경설정 JSON Mock 캐시 전담 (배포 제외).
  - `998.offline_0202.js`: 520줄 경량 시뮬레이터 및 API/WebSocket 가상 인터셉터 (배포 제외).
  - 오프라인 모듈 2종은 LittleFS 플래시 배포 번들에서 100% 영구 제외되어 기기 플래시 오버헤드를 발생시키지 않아야 합니다.

### 원칙 4: 계약 기반 변경 및 상대 경로 링크 원칙 (CBD Rule)
- 모듈 인터페이스, FSM 전이, 데이터 스키마 수정 시 관련 계약 문서(`SPEC`, `CONTRACT`, `STATE`, `FLOW` 등)를 동일 커밋으로 동시 갱신합니다.
- 프로젝트 내 모든 문서 간 상호 참조 링크는 반드시 **프로젝트 루트 기준의 상대 경로**(`src/v0202/...`, `agent.md` 등)로 표기합니다.
- 문서 작업 완료 후 `python src/v0202/tools_0202/commit_contracts_0202.py --dry-run --strict` 검증을 통과해야 합니다.

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

### 4.3 프론트엔드 (Web UI) 구현 규칙
1. **널리시 폴백 (NEW-C1)**: 폼 필드 렌더링 시 `||` 연산자 금지, `nz(v, fallback)` 사용 (`0`, `''`, `false` 유효값 보존).
2. **불리언 명시 판정 (NEW-U4)**: 문자열 `"false"` 오판 방지를 위해 `asBool(v)` 사용.
3. **XSS 방어 (B-3/NEW-C2)**: 사용자 입력/표시 텍스트는 반드시 `SNW.DomUtil.escape()` 처리.
4. **모달 오버레이 격리**: 모달 닫기 시 `.snw-modal-overlay`에 `pointer-events: none; visibility: hidden;` 및 `display: 'none'` 적용으로 메뉴 먹통 방지.

---

## 🛠️ 5. 필수 CLI 명령어 치트시트

```bash
# 1. 프론트엔드 에셋 번들링, C++/JSON 자동 동기화 및 Gzip 압축
python src/v0202/tools_0202/pio_gzip_0202.py

# 2. CBD 계약 무결성 엄격 검증 (Dry-run)
python src/v0202/tools_0202/commit_contracts_0202.py --dry-run --strict

# 3. PlatformIO 펌웨어 빌드 / 파일시스템 플래시 업로드 (멀티코어 병렬 빌드 필수: -j 12)
pio run -e esp32-s3-n16r8 -j 12
pio run -e esp32-s3-n16r8 -j 12 --target uploadfs

# 4. Graphify 지식 그래프 질의 및 갱신 (LLM 비용 없음, AST 전용)
graphify query "<질문/심볼명>"
graphify path "<출발노드>" "<도착노드>"
graphify explain "<클래스/함수명>"
graphify update .
```

---
*모든 기술 설명과 사용자 답변은 명확하고 정중한 **한국어**로 작성합니다.*


