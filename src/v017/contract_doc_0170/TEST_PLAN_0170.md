# TEST_PLAN.md — 회귀 테스트 절차서 (F-03~F-06 + I-1~I-4)

> 검증 대상: 커밋 `[F-05] loopTask reload 위임 + [F-06] motion sim deferral + I-1/I-3/I-4`
> 검증 환경: ESP32-S3-N16R8, LittleFS 업로드 완료 상태
> 로그 레벨: `EN_L10_LOG_DEBUG` (검증 기간 한정)

## 사전 준비
1. `pio run --target upload` + `pio run --target uploadfs`
2. 시리얼 콘솔 오픈 (115200, esp32_exception_decoder)
3. Web UI 접속 확인 (`http://<IP>/`)
4. `GET /api/v001/state` → `control.state != "TIME_INVALID"` 확인

---

## T-1: F-03 (M10 tick) — PIR holdSec 만료

**목적**: A00_run에 M10 tick 추가 후 PIR holdSec이 실제로 만료되어 `motionActive=false` 전환되는지 확인.

**사전 조건**: `cfg_motion_070.json` → `motion.pir.enabled=true`, `motion.pir.holdSec=10`

**절차**
1. `POST /api/v001/motion/pir/feed` body `{"pir":true}`
2. 즉시 `GET /api/v001/state` → `control.sensor.motionActive=true` 확인
3. 대기 5초 후 재조회 → `motionActive=true` 유지 (holdSec 미만)
4. 대기 15초 후 재조회 → **`motionActive=false`**

**합격 기준**
- [ ] 2단계: `true`
- [ ] 3단계: `true`
- [ ] 4단계: `false`  ← **F-03 미수정 시 영구 `true` (실패)**

**로그**: `[M10] motionActive=0 (PIR=0)` 출력 확인 (변화 시점).

---

## T-2: F-04 (N10 tick) — NVS 런타임 저장

**목적**: A00_run에 N10 tick 추가 후 런타임 상태가 10초 이내 NVS에 반영되는지 확인.

**사전 조건**: user profile 최소 1개 존재 (`profileNo=10`), `enabled=true`

**절차**
1. `POST /api/v001/control/profile/select` body `{"id":10}`
2. 즉시 `GET /api/v001/state` → `control.profile.profileNo=10` 확인
3. **10초 대기** (N10 flush 주기)
4. `ESP.restart` (또는 리셋 버튼)
5. 부팅 후 `GET /api/v001/metrics` 또는 NVS 조회 → `runtime.lastUserProfileNo=10`

**합격 기준**
- [ ] 2단계: `profileNo=10`
- [ ] 5단계: `lastUserProfileNo=10` ← **F-04 미수정 시 `-1` 또는 초기값 (실패)**

**로그**: `[N10] Runtime flushed to NVS` (10초 주기 내 1회 이상).

---

## T-3: F-05 (reload 위임) — async_tcp 블로킹 제거 + 폴링

**목적**: reload 요청이 202 즉시 응답하고 loopTask가 실제 실행하는지 확인. `control.pendingReload` 폴링 필드 동작 확인 (I-1).

**절차**
1. `POST /api/v001/reload` (curl, `-w "%{http_code} %{time_total}\n"`)
2. 즉시 `GET /api/v001/state` 반복 조회 (100ms 간격)

**합격 기준**
- [ ] POST 응답: **`202`**, body `{"result":"queued",...}`
- [ ] 응답 시간: **`< 50ms`**  ← async_tcp 블로킹 제거 확인
- [ ] 즉시 조회 시 `control.pendingReload=true` (1회 이상 관찰)
- [ ] 500ms 이내 `control.pendingReload=false` 로 전환  ← **I-1 필드 동작**

**로그 순서**
```
[WF10] ... (없음)
[W10] routeReload → 202 반환
[A00] Executing pending reload (loopTask)...
[CT10] reloadAll done
[A00] Pending reload done (ok=1)
```

---

## T-4: F-05 (중복 방지) — 연속 reload 409

**목적**: pending 상태에서 reload 재요청 시 409 반환.

**절차**
1. `POST /api/v001/reload` (1회차, 202 예상)
2. **즉시** (100ms 이내) `POST /api/v001/reload` (2회차)
3. 1초 대기 후 `POST /api/v001/reload` (3회차 — pending 완료 후)

**합격 기준**
- [ ] 1회차: **`202`**
- [ ] 2회차: **`409`**, body `{"error":"reload already pending"}`
- [ ] 3회차: **`202`** (pending 완료 후 정상 재수락)

---

## T-5: F-06 (motion sim deferral) — patch → S10 반영

**목적**: `POST /api/v001/motion` 응답 즉시 + loopTask에서 `applyMotionSimConfigToSim()` 소비.

**절차**
1. `GET /api/v001/state` → `sim.userIntensity` 현재값 기록 (예: `70`)
2. `POST /api/v001/motion` body `{"motion":{"sim":{"intensity":85}}}`
3. 즉시 응답 확인
4. 대기 200ms 후 `GET /api/v001/state` → `sim.intensity=85` 확인

**합격 기준**
- [ ] POST 응답: **`200`**, `{"updated":true}`
- [ ] 응답 시간: **`< 50ms`**  ← async_tcp CT10 mutex 미대기
- [ ] 4단계: `sim.intensity=85`  ← deferral 정상 소비

**로그**
```
[CT10] MotionSim apply requested (deferred)    ← async_tcp
[CT10] S10 runtime updated from motion.sim (intensity=85.0)   ← loopTask
[CT10] MotionSim apply consumed (loopTask)
```

---

## T-6: I-2 정책 확인 — motion patch + reload 순서 민감성

**목적**: `POST /motion` 후 `saveDirtyConfigs` 없이 `/reload` 시 patch가 소실됨을 **문서화된 정책대로** 관찰.

**절차**
1. `GET /api/v001/state` → `sim.intensity` 기록 (예: `70`)
2. `POST /api/v001/motion` body `{"motion":{"sim":{"intensity":85}}}`
   - **`POST /api/v001/config/save` 호출하지 않음** ← 의도
3. `POST /api/v001/reload` → 202
4. 1초 대기
5. `GET /api/v001/state` → `sim.intensity` 확인
6. 이어서 정상 순서 재검증:
   - `POST /motion` (intensity=90)
   - `POST /config/save`
   - `POST /reload`
   - 1초 후 `GET /state` → `sim.intensity=90` 확인

**합격 기준**
- [ ] 5단계: `sim.intensity=70` (patch 소실, 디스크 값 복원)  ← 정책 확인
- [ ] 6단계 최종: `sim.intensity=90` (정상 순서는 유지)  ← 정책 우회 경로 검증

**문서**: SPEC.md §5.1 "금지 패턴" 참조.

---

## T-7: I-3 (`_pendingMotionSimApply` 리셋) — begin 후 잔재 소거

**목적**: `begin()` 재호출 시 pending motion flag 잔재가 새 tick에 반영되지 않음을 확인.

**절차 (선택, 코드 정합성 검증용)**
1. `POST /motion` (intensity=95, patch만) → flag set
2. **즉시** `POST /reload` (flag는 아직 미소비 상태 가정)
3. reloadAll 내부에서 `begin()` 리셋 호출되는지 로그 확인
4. reload 완료 후 `GET /state` → `sim.intensity` = 디스크 값 (95 아님)

**합격 기준**
- [ ] `[A00] Executing pending reload` 로그 후
- [ ] `[CT10] MotionSim apply consumed` 로그 **부재** (I-3 정상 리셋)

**참고**: I-3는 방어적 리셋. 실제로는 reload 중 `_pendingMotionSimApply`가 이미 소비되었을 수도 있음 (타이밍 의존).

---

## T-8: I-4 (private화) — 컴파일 검증

**목적**: `applyMotionSimConfigToSim()` 직접 호출 부재 확인.

**절차**
1. `grep -rn "applyMotionSimConfigToSim" src/`
2. `pio run -e esp32-s3-n16r8` (컴파일)

**합격 기준**
- [ ] grep 결과: `CT10_Ctl_Ctl_070.cpp` 1곳 (정의 + 호출), `CT10_Ctl_070.h` 1곳 (private 선언) **만 존재**
- [ ] 컴파일 성공 (외부 호출 없으므로 링크 에러 없음)
- [ ] 이전에 public이었던 코드에서 `s_control->applyMotionSimConfigToSim()` 호출이 남아 있지 않음

---

## 📊 회귀 매트릭스 요약

| 테스트 | 대상 | 소요 시간 | 필수 |
|---|---|---|---|
| T-1 | F-03 | 30초 | ✅ |
| T-2 | F-04 | 60초 (재부팅 포함) | ✅ |
| T-3 | F-05 + I-1 | 10초 | ✅ |
| T-4 | F-05 중복 | 5초 | ✅ |
| T-5 | F-06 | 5초 | ✅ |
| T-6 | I-2 정책 | 30초 | ✅ |
| T-7 | I-3 | 10초 | ⚠️ 선택 |
| T-8 | I-4 | 1분 (컴파일) | ✅ |

**총 소요**: 약 3분 (선택 항목 포함)

---

## 실패 시 진단 매트릭스

| 테스트 실패 증상 | 원인 후보 | 확인 |
|---|---|---|
| T-1 `motionActive` 영구 `true` | A00_run M10 tick 블록 누락 | `grep "g_M10_motionLogic->tick" A00_Main_071.cpp` |
| T-2 `lastUserProfileNo` 초기값 | N10 tick 호출 누락 또는 flush 실패 | 시리얼 로그 `[N10] Runtime flushed` 부재 |
| T-3 reload 응답 `> 500ms` | W10 routeReload가 직접 reloadAll 호출 (구버전) | `grep "reloadAll()" W10_Web_Routes_070.cpp` |
| T-3 `pendingReload` 미관찰 | I-1 export 누락 | `grep "pendingReload" CT10_Ctl_IOWS_070.cpp` |
| T-4 연속 요청 모두 202 | `requestReload`가 CAS 미사용 | `grep "compare_exchange_strong" CT10_Ctl_070.h` |
| T-5 응답 `> 100ms` | requestMotionSimApply 미사용 (구 applyMotionSimConfigToSim 직접 호출) | `grep "requestMotionSimApply" W10_Web_Routes_070.cpp` |
| T-6 patch 유지 (예상과 다름) | saveDirtyConfigs 자동 호출됨 | `grep "saveDirtyConfigs" W10_Web_Routes_070.cpp` (motion 라우트) |

---

## 개정 이력
| 날짜 | 버전 | 변경 |
|---|---|---|
| (초기) | v1.0 | 최초 작성 (F-03~F-06 + I-1~I-4 회귀) |
