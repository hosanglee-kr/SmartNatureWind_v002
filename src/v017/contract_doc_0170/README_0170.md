# docs/contracts — 계약 기반 설계 문서 체계 (CBD)

본 디렉토리는 Smart Nature Wind v017 펌웨어의 **계약 기반 설계(Contract-Based Design)**
문서를 관리한다. 모든 문서는 `docs/contracts/tools/commit_contracts.{sh,ps1}`
스크립트로 커밋한다.

## 문서 목록

| 파일 | 역할 | 기준 |
|---|---|---|
| `SPEC.md` | 상위 사양 SSOT (핀맵, 스키마, 컨벤션, reload 정책) | 최상위 |
| `CONTRACT.md` | 태스크 경계·뮤텍스·위임 패턴·감사 결과 | SPEC 준수 |
| `STATE.md` | 상태 변수 소유권·FSM·위임 플래그 라이프사이클 | CONTRACT 준수 |
| `FLOW.md` | 부팅/제어/reload/WiFi/시간/차트 흐름 | CONTRACT/STATE 준수 |
| `BUDGET.md` | 태스크 WCET·스택·블로킹·관측성 메트릭 | SPEC 준수 |
| `TEST_PLAN.md` | 회귀 테스트 절차 (T-1~T-8) | 최신 감사 반영 |

## 감사 이력 (Audit Findings)

| ID | 심각도 | 상태 | 최초 발견 | 반영 |
|---|---|---|---|---|
| F-01 | 🔴 High | ✅ 해결 | WF10 GOT_IP 누락 | `startSTA` TM10 명시 통지 |
| F-02 | 🟡 Mid | ✅ 해결 | 이중 xTaskCreate | `_ensureWifiTask` mutex 보호 |
| F-03 | 🔴 High | ✅ 해결 | M10 tick 미호출 | `A00_run` M10 tick 추가 |
| F-04 | 🔴 High | ✅ 해결 | N10 flush 미호출 | `A00_run` N10 tick 추가 |
| F-05 | 🟡 Mid | ✅ 해결 | async_tcp reload 블로킹 | loopTask 위임 (pending flag) |
| F-06 | 🟡 Mid | ✅ 해결 | async_tcp motion patch mutex 경합 | loopTask 위임 (atomic flag) |
| F-07 | 🟢 Low | ⏸ 수용 | Logger ring 무보호 | 로그 유실만 |
| F-08 | 🟢 Low | ⏸ 수용 | A00_run raw root deref | 저위험 |
| F-09 | 🟡 Mid | ✅ 해결 | PIR 부팅 직후 false-positive | F-03에 종속 |
| F-10 | 🟡 Mid | ⚠️ 관측 | async_tcp 스택 여유 부족 | `CONFIG_ASYNC_TCP_STACK_SIZE` 상향 후보 |
| I-1 | 🟡 Mid | ✅ 해결 | reload 완료 시점 미노출 | `control.pendingReload` 필드 |
| I-2 | 🟡 Mid | ✅ 해결 | motion patch → reload 시 소실 | SPEC §5.1 문서화 |
| I-3 | 🟢 Low | ✅ 해결 | `_pendingMotionSimApply` 리셋 | `begin()` 방어적 store |
| I-4 | 🟢 Low | ✅ 해결 | `applyMotionSimConfigToSim` public | private 이동 |

## 워크플로

### 신규 기능 추가 시 순서
1. `SPEC.md` — 상수/스키마/핀맵 추가
2. `FLOW.md` — 파이프라인 배치 + 시퀀스도
3. `CONTRACT.md` — 태스크 경계·큐·뮤텍스 정의
4. `STATE.md` — 상태 변수 Writer 단일화 + FSM
5. `BUDGET.md` — WCET/스택 예산
6. `TEST_PLAN.md` — 회귀 테스트 추가
7. **`commit_contracts.sh` 실행** (5개 문서 동시 커밋)

### 코드 변경 시
- 계약 변경이 있으면 반드시 **문서 + 코드 동시 커밋**
- 개정 이력 테이블 (각 문서 §개정이력) 날짜 동기화

## 커밋 스크립트 사용법

### Linux / macOS
```bash
cd /path/to/project
bash docs/contracts/tools/commit_contracts.sh
# 또는 직접 메시지 지정
bash docs/contracts/tools/commit_contracts.sh "docs(contracts): F-05 reload 위임 반영"
```

### Windows (PowerShell)
```powershell
cd C:\path\to\project
.\docs\contracts\tools\commit_contracts.ps1
# 실행 정책 오류 시
powershell -ExecutionPolicy Bypass -File .\docs\contracts\tools\commit_contracts.ps1
# 메시지 지정
.\docs\contracts\tools\commit_contracts.ps1 -Message "docs(contracts): F-05 reload 위임 반영"
```

## 개정 이력
| 날짜 | 버전 | 변경 |
|---|---|---|
| (초기) | v1.0 | 최초 README 생성, 감사 이력 F-01~I-4 반영 |
