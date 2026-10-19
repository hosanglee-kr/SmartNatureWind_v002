# src/v017/contract_doc_0170 — 계약 기반 설계 문서 체계 (CBD)

본 디렉토리는 Smart Nature Wind v017 펌웨어의 **계약 기반 설계(Contract-Based Design, CBD)** 문서를 관리한다.  
동시성 경계, 상태 소유권, 메모리 및 시간 예산, 회귀 테스트 절차를 체계화하여 멀티태스크 펌웨어의 안정성과 일관성을 보장한다.

---

## 1. 디렉토리 및 파일 구조

현재 `src/v017/` 하위 모듈 및 본 계약 문서 디렉토리의 전체 구조는 다음과 같다.

```text
src/v017/
├── contract_doc_0170/              # [CBD] 계약 기반 설계 문서군 (본 디렉토리)
│   ├── README_0170.md             # CBD 체계 안내, 폴더/파일 구조, 감사 이력, 사용 가이드
│   ├── SPEC_0170.md               # 시스템 최상위 기술 사양 (SSOT: 핀맵, 스키마, 모듈 구성, NVS)
│   ├── CONTRACT_0170.md           # 동시성 경계, 뮤텍스 인벤토리, 전역 공유자원 접근 규약, 위임 패턴
│   ├── STATE_0170.md              # 상태 변수 소유권(단일 Writer 원칙), FSM 정의, 위임 플래그 라이프사이클
│   ├── FLOW_0170.md               # 주요 파이프라인 시퀀스 (부팅, 제어 루프, 비동기 reload, WiFi, 웹소켓)
│   ├── BUDGET_0170.md             # 태스크별 WCET, 스택/메모리 예산, 블로킹 제한치, 관측성 메트릭
│   ├── TEST_PLAN_0170.md          # 회귀 테스트 절차서 (T-1 ~ T-8 검증 시나리오 및 합격 기준)
│   └── Ref/                       # [참조 자료]
│       └── UI_TERMINOLOGY_0170.md # 웹 UI 한/영 표준 용어 사전 및 가이드라인 (참조용)
│
├── Req_ImplPlan_0170/             # 요구사항 정의 및 구현 계획서
│   ├── 0170_001.md                # 1차 구현 계획 및 리팩토링 사양
│   └── 0170_002.md                 # 2차 구현 계획 및 도구 통합 사양
│
├── User_Manual_0170/              # 사용자 매뉴얼
│   └── 00.UserManual_0170_r001.md # v017 사용자 가이드
│
├── tools_0170/                    # 검증 및 빌드 보조 도구
│   ├── pio_gzip_0170.py           # 웹 에셋 JS 번들링 및 Gzip 사전 압축 스크립트 (PlatformIO 연동)
│   ├── commit_contracts_0170.py   # 계약 문서 검증 및 동시 커밋 도구 (Python 3.7+)
│   └── Ref/                       # [참조 스크립트 모음]
│
├── data_src_v017/                 # [웹 개발 원본] VCS 형상관리 원본 파일군 (/html_v3)
├── data_v017/                     # [배포 스테이징] LittleFS 업로드 데이터 (/html_v3 번들/Gzip, /json)
│
└── [C++ 소스 및 헤더 모듈군]
    ├── A00_Main_071.*             # 메인 진입점, 초기화 및 A00_run() 주기 루프
    ├── A20_Const_*.h              # 전역 상수 및 설정 정의
    ├── A22~A29_Com_*.h            # 공통 유틸리티, 룩업, 리셋 함수
    ├── A30_LED_070.h              # 상태 LED / NeoPixel 제어
    ├── C10_Config_*.cpp/.h        # 설정 로드/저장/검증 및 RootSwap
    ├── CT10_Ctl_*.cpp/.h          # 중앙 장치 제어기, 상태 머신, 웹소켓 브로커
    ├── D10_Logger_070.h           # 시스템 로거
    ├── M10_MotionLogic_070.h      # PIR 센서 및 모션 타이머 로직
    ├── N10_NvsManager_070.*       # NVS 플래시 스토리지 관리
    ├── P10_PWM_ctrl_070.h         # 팬 하드웨어 PWM 제어
    ├── S10_Simul_*.cpp/.h         # 바람 시뮬레이션 및 물리 엔진
    ├── S20_WindSolver_070.h       # 바람 솔버 알고리즘
    ├── TM10_TimeMg_070.h          # NTP 동기화 및 시간 관리
    ├── W10_Web_*.cpp/.h           # 비동기 웹서버, REST API 라우팅, 웹소켓
    └── WF10_WiFiMgr_070.*         # WiFi 연결 및 재연결 전담 태스크 관리
```

---

## 2. 문서 목록 및 역할

| 파일명 | 역할 및 주요 내용 | 준수 기준 |
|---|---|---|
| [`SPEC_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/SPEC_0170.md) | 상위 사양 SSOT (ESP32-S3 핀맵, 설정 JSON 스키마, 모듈 구성, 비동기 reload 정책, NVS 키) | **최상위 SSOT** |
| [`CONTRACT_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/CONTRACT_0170.md) | 태스크 경계(Context), 뮤텍스 인벤토리, 전역 공유자원 접근 규약(`g_A20_config_root`), 위임 패턴, 감사 결과 | SPEC 준수 |
| [`STATE_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/STATE_0170.md) | 상태 변수 소유권(단일 Writer 원칙), FSM 정의, 태스크 간 위임 플래그 라이프사이클 | CONTRACT 준수 |
| [`FLOW_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/FLOW_0170.md) | 부팅 시퀀스, 제어 파이프라인, 비동기 reload 흐름, WiFi 재연결, 시간 동기화 시퀀스도 | CONTRACT/STATE 준수 |
| [`BUDGET_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/BUDGET_0170.md) | 태스크별 WCET 예산, FreeRTOS 스택 예산, 임계 구역 블로킹 제한치, 관측성 메트릭 | SPEC 준수 |
| [`TEST_PLAN_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/TEST_PLAN_0170.md) | 결함 방지 회귀 테스트 절차 (T-1~T-8 시나리오, 절차 및 합격 판정 기준) | 최신 감사/결함 수정 반영 |
| [`Ref/UI_TERMINOLOGY_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/Ref/UI_TERMINOLOGY_0170.md) | 웹 프론트엔드 한/영 표준 UI 용어집, 1:1 대응 원칙 및 번역 가이드라인 (참조 자료) | UI/i18n 기준 |
| [`README_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/README_0170.md) | CBD 체계 총괄 안내, 폴더/파일 구조, 감사 이력 테이블, 워크플로 및 커밋 도구 가이드 | 본 문서 |

---

## 3. 감사 이력 (Audit Findings)

코드 정적 감사 및 런타임 검증을 통해 도출되어 계약 문서에 반영된 핵심 항목:

| ID | 심각도 | 상태 | 내용 요약 | 해결 및 반영 내역 |
|---|---|---|---|---|
| **F-01** | 🔴 High | ✅ 해결 | WF10 GOT_IP 이벤트 처리 누락 | `startSTA` 후 TM10 명시 통지 및 NTP 트리거 |
| **F-02** | 🟡 Mid | ✅ 해결 | 이중 `xTaskCreate` 호출 위험 | `_ensureWifiTask` 내 mutex 보호 및 중복 생성 방지 |
| **F-03** | 🔴 High | ✅ 해결 | M10 tick 미호출로 인한 센서 갱신 누락 | `A00_run()` 내 M10 tick 주기 호출 추가 |
| **F-04** | 🔴 High | ✅ 해결 | N10 flush 주기 미호출 | `A00_run()` 내 N10 tick(플러시 큐) 추가 |
| **F-05** | 🟡 Mid | ✅ 해결 | async_tcp 태스크 내 reload 직접 호출 시 블로킹 | loopTask 위임 패턴 적용 (`control.pendingReload` 플래그) |
| **F-06** | 🟡 Mid | ✅ 해결 | async_tcp 태스크의 motion patch 시 mutex 경합 | loopTask 위임 패턴 적용 (atomic 플래그) |
| **F-07** | 🟢 Low | ⏸ 수용 | Logger 링버퍼 동시 접근 시 무보호 | 로그 유실 수준으로 수용 (성능 우선) |
| **F-08** | 🟢 Low | ⏸ 수용 | A00_run 내 raw root dereference | 단일 Writer 정책에 의해 저위험 수용 |
| **F-09** | 🟡 Mid | ✅ 해결 | PIR 센서 부팅 직후 false-positive 발생 | F-03 해결(M10 tick)로 정상 만료 처리 |
| **F-10** | 🟡 Mid | ⚠️ 관측 | async_tcp 태스크 스택 여유 부족 | `CONFIG_ASYNC_TCP_STACK_SIZE` 상향 후보 관리 |
| **I-1** | 🟡 Mid | ✅ 해결 | 웹 UI에서 reload 완료 시점 확인 불가 | `control.pendingReload` 상태 필드 노출 |
| **I-2** | 🟡 Mid | ✅ 해결 | motion patch 후 reload 시 설정 소실 | `SPEC_0170.md` §5.1에 지속성 정책 문서화 |
| **I-3** | 🟢 Low | ✅ 해결 | `_pendingMotionSimApply` 리셋 시점 모호 | `begin()` 시 방어적 store 수행 |
| **I-4** | 🟢 Low | ✅ 해결 | `applyMotionSimConfigToSim` public 노출 | 클래스 내부 private으로 캡슐화 |

---

## 4. CBD 워크플로

### 신규 기능 추가 또는 사양 변경 순서
1. [`SPEC_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/SPEC_0170.md) — 기능 사양, 상수, JSON 스키마, 핀맵 추가/변경
2. [`FLOW_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/FLOW_0170.md) — 제어/부팅 파이프라인 배치 및 시퀀스 다이어그램 작성
3. [`CONTRACT_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/CONTRACT_0170.md) — 태스크 실행 컨텍스트, 뮤텍스 범위, 공유 전역 접근 규약 정의
4. [`STATE_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/STATE_0170.md) — 상태 변수 단일 Writer 규정, FSM 천이도, 위임 플래그 정의
5. [`BUDGET_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/BUDGET_0170.md) — 태스크 WCET, 스택 요구량, 블로킹 제한 예산 책정
6. [`TEST_PLAN_0170.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v017/contract_doc_0170/TEST_PLAN_0170.md) — 회귀 테스트 시나리오 및 합격 판정 기준 추가
7. **커밋 스크립트 실행** — 모든 계약 문서와 코드를 정합성에 맞춰 동시 커밋

### 코드 변경 시 필수 원칙
- 계약 내용(뮤텍스, 태스크 경계, 전역 포인터 접근 등)의 변경이 발생하면 **반드시 계약 문서와 코드를 하나의 커밋으로 동시 반영**한다.
- 각 문서의 §개정이력 테이블에 동일 날짜 및 버전으로 변경 내역을 동기화한다.

---

## 5. 커밋 및 검증 스크립트 사용법

계약 문서의 누락을 방지하고 원자적(Atomic) 커밋을 보장하기 위해 Python 3.7+ 기반 크로스 플랫폼 스크립트를 사용한다.

### 5.1 계약 문서 커밋 (`commit_contracts_0170.py`)

저장소 루트 디렉토리(`d:\95.2540_PJT\SmartNatureWind_v002`)에서 실행한다.

#### 검증 모드 (Dry-Run: 실제 커밋 없이 필수 파일 및 변경 사항만 검증)
```bash
# Windows / Linux / macOS 공통
python src/v017/tools_0170/commit_contracts_0170.py --dry-run

# Windows py 런처 사용 시
py -3 src/v017/tools_0170/commit_contracts_0170.py --dry-run
```

#### 기본 메시지로 커밋
```bash
python src/v017/tools_0170/commit_contracts_0170.py
```

#### 커스텀 메시지 지정 커밋
```bash
python src/v017/tools_0170/commit_contracts_0170.py -m "docs(contracts): F-05 reload 위임 및 SPEC 동기화"
```

#### 스크립트 동작 및 종료 코드
1. `git rev-parse --show-toplevel`로 Git 저장소 루트 자동 감지
2. `src/v017/contract_doc_0170/` 내 필수 7개 문서 존재 검증
3. `git add src/v017/contract_doc_0170/` 자동 스테이징
4. 스테이징된 변경 사항이 없으면 안전하게 커밋 생략
5. 커밋 수행 후 최근 로그 요약(Author, Date, 커밋 해시) 및 `git push` 안내 출력

| 종료 코드 | 의미 |
|---|---|
| `0` | 정상 완료 (또는 변경 사항 없음) |
| `1` | 필수 계약 문서 누락 |
| `2` | Git 오류 (저장소 아님, Git 미설치, 커밋 실패 등) |
| `130` | 사용자 중단 (Ctrl+C) |

---

### 5.2 연계 검증 도구 (`src/v017/tools_0170/`)

- **JSON 설정 스키마 검증**:
  ```bash
  python src/v017/tools_0170/check_schema_0170.py
  ```
- **다국어(i18n) 사전 키 검증**:
  ```bash
  python src/v017/tools_0170/check_i18n_0170.py
  ```
- **웹 리소스 gzip 압축 빌드**:
  ```bash
  python src/v017/tools_0170/pio_gzip_0170.py
  ```

---

## 6. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-19 | v1.2 | 웹 에셋 JS 번들링(`P010_bundle_071.js`) 및 Gzip 사전 압축 파이프라인(`pio_gzip_0170.py`), 소스/배포 분리(`data_src_v017` ↔ `data_v017`), C++ `.gz` 서빙 반영 | Antigravity AI |
| 2026-10-19 | v1.1 | 현재 폴더/파일 구조(`src/v017/contract_doc_0170/*_0170.md`)로 전면 현행화, v017 전체 디렉토리 트리 추가, Python 커밋 스크립트 경로 현행화 | Antigravity AI |
| (초기) | v1.0 | 최초 계약 문서 체계 수립, 감사 이력 F-01~I-4 등록 | 개발팀 |
