# TEST_PLAN_0200.md — 회귀 테스트 절차서 (F-03~F-06 + I-1~I-4)

> **검증 대상**: Smart Nature Wind v0200 CBD 계약 기반 설계 구현체  
> - `[F-03]` `A00_run()` 내 `M10::tick()` 배치로 PIR holdSec 정상 만료  
> - `[F-04]` `A00_run()` 내 `N10::tick()` 배치로 NVS 런타임 데이터 주기적 플러시  
> - `[F-05]` `POST /api/v001/reload` loopTask 위임 및 202 즉시 응답  
> - `[F-06]` `POST /api/v001/motion` loopTask 위임 (`_pendingMotionSimApply`)  
> - `[I-1]` `control.pendingReload` 상태 필드 노출 및 폴링 검증  
> - `[I-2]` Reload 시 메모리 패치 소실 정책 검증  
> - `[I-3]` `_pendingMotionSimApply` 방어적 리셋 검증  
> - `[I-4]` `applyMotionSimConfigToSim()` 클래스 private 캡슐화 검증  
> **검증 환경**: ESP32-S3-N16R8, LittleFS 업로드 완료 상태  
> **권장 로그 레벨**: `EN_L10_LOG_DEBUG` (검증 기간 한정)

---

## 사전 준비
1. 펌웨어 및 웹 파일시스템 업로드:
   ```bash
   pio run --target upload
   pio run --target uploadfs
   ```
2. 시리얼 모니터 연결 (115200 bps, esp32_exception_decoder 필터):
   ```bash
   pio device monitor
   ```
3. Web UI 접속 및 기본 상태 확인 (`http://<ESP32_IP>/`):
   ```bash
   curl -s http://<ESP32_IP>/api/v001/state
   ```

---

## T-1: F-03 (M10 tick) — PIR holdSec 정상 만료 검증

**목적**: `A00_run()`에 `g_M10_motionLogic->tick()`이 추가되어 PIR 감지 후 설정된 holdSec(기본 10초) 경과 시 `motionActive=false`로 정상 전환되는지 검증.

**사전 조건**: `cfg_motion_0200.json` → `motion.pir.enabled = true`, `motion.pir.holdSec = 10`

**검증 절차**
1. PIR 가상 감지 피드 전송:
   ```bash
   curl -X POST http://<ESP32_IP>/api/v001/motion/pir/feed -d '{"pir":true}'
   ```
2. 즉시 상태 조회 (`control.sensor.motionActive` 확인):
   ```bash
   curl -s http://<ESP32_IP>/api/v001/state | jq .control.sensor.motionActive
   ```
3. 5초 대기 후 재조회 (holdSec 미만이므로 true 유지 확인).
4. 15초 대기 후 재조회 (**false로 정상 전환 확인**).

**합격 판정 기준**
- [ ] 2단계 즉시 조회: `true`
- [ ] 3단계 (5초 후): `true` 유지
- [ ] 4단계 (15초 후): **`false`** 전환 (F-03 미해결 시 영구히 `true`로 남아 실패)
- [ ] 시리얼 로그: `[M10] motionActive=0` 로그 출력 확인

---

## T-2: F-04 (N10 tick) — NVS 런타임 저장 및 재부팅 복구 검증

**목적**: `A00_run()`에 `CL_N10_NvsManager::tick()`이 추가되어 변경된 런타임 상태가 10초 이내에 NVS 플래시에 정상 반영되는지 검증.

**사전 조건**: 유효한 사용자 프로파일 1개 이상 등록 상태 (`profileNo = 10`)

**검증 절차**
1. 사용자 프로파일 활성화:
   ```bash
   curl -X POST http://<ESP32_IP>/api/v001/control/profile/select -d '{"id":10}'
   ```
2. 즉시 상태 확인:
   ```bash
   curl -s http://<ESP32_IP>/api/v001/state | jq .control.profile.profileNo
   ```
3. **10초 대기** (N10 주기 플러시 대기).
4. 장치 소프트웨어 재부팅 트리거:
   ```bash
   curl -X POST http://<ESP32_IP>/api/v001/system/restart
   ```
5. 부팅 완료 후 NVS 복원 값 확인:
   ```bash
   curl -s http://<ESP32_IP>/api/v001/metrics | jq .runtime.lastUserProfileNo
   ```

**합격 판정 기준**
- [ ] 2단계: `profileNo == 10`
- [ ] 5단계 재부팅 후: `lastUserProfileNo == 10` (F-04 미해결 시 초기값 `-1`로 남아 실패)
- [ ] 시리얼 로그: `[N10] Runtime flushed to NVS` 로그 확인

---

## T-3: F-05 (Reload 위임) — 비동기 202 응답 및 `pendingReload` 폴링 검증

**목적**: `POST /api/v001/reload` 요청이 `async_tcp`를 블로킹하지 않고 즉시 202를 반환하며, `loopTask`가 실제 재로드를 완료할 때까지 `control.pendingReload`가 올바르게 동작하는지 검증.

**검증 절차**
1. 응답 코드 및 소요 시간 측정하며 Reload 요청:
   ```bash
   curl -s -w "\nHTTP_CODE:%{http_code} TIME:%{time_total}s\n" -X POST http://<ESP32_IP>/api/v001/reload
   ```
2. 50ms 간격으로 상태를 반복 조회하여 `control.pendingReload` 상태 관찰:
   ```bash
   for i in {1..10}; do curl -s http://<ESP32_IP>/api/v001/state | jq .control.pendingReload; sleep 0.05; done
   ```

**합격 판정 기준**
- [ ] HTTP 응답 코드: **`202 Accepted`**, 본문 `{"result":"queued",...}`
- [ ] 응답 소요 시간: **`< 0.05s (50ms)`** (파일 I/O 동기 블로킹 제거 입증)
- [ ] 요청 직후 상태: `control.pendingReload == true` 관찰됨
- [ ] 500ms 이내: `control.pendingReload == false`로 정상 완료 전환
- [ ] 시리얼 로그 순서:
  ```text
  [W10] routeReload -> 202 Accepted
  [A00] Executing pending reload (loopTask)...
  [CT10] reloadAll done
  [A00] Pending reload done (ok=1)
  ```

---

## T-4: F-05 (중복 방지) — 연속 Reload 요청 시 409 Conflict 검증

**목적**: 이미 Reload가 처리 중인 상태에서 추가 Reload 요청 시 409 Conflict를 반환하여 중복 부하를 차단하는지 검증.

**검증 절차**
1. 1차 Reload 요청 전송 (202 기대).
2. 즉시 (50ms 이내) 2차 Reload 요청 전송 (409 기대).
3. 1초 대기 후 3차 Reload 요청 전송 (완료 후이므로 202 정상 재수락 기대).

**합격 판정 기준**
- [ ] 1차 요청: **`202 Accepted`**
- [ ] 2차 요청: **`409 Conflict`**, 본문 `{"error":"reload already pending"}`
- [ ] 3차 요청: **`202 Accepted`**

---

## T-5: F-06 (Motion Sim 위임) — 비동기 모션 패치 및 S10 반영 검증

**목적**: `POST /api/v001/motion`이 CT10 뮤텍스 대기 없이 즉시 200을 반환하고, 다음 `tickLoop`에서 `applyMotionSimConfigToSim()`이 지연 소비되는지 검증.

**검증 절차**
1. 현재 시뮬레이션 강도 확인:
   ```bash
   curl -s http://<ESP32_IP>/api/v001/state | jq .sim.userIntensity
   ```
2. 모션 시뮬레이션 파라미터 패치:
   ```bash
   curl -s -w "\nHTTP:%{http_code} TIME:%{time_total}s\n" -X POST http://<ESP32_IP>/api/v001/motion -d '{"motion":{"sim":{"intensity":85.0}}}'
   ```
3. 100ms 대기 후 상태 재조회:
   ```bash
   curl -s http://<ESP32_IP>/api/v001/state | jq .sim.intensity
   ```

**합격 판정 기준**
- [ ] HTTP 응답 코드: **`200 OK`**, 소요 시간 **`< 0.05s (50ms)`**
- [ ] 3단계 상태 조회: `sim.intensity == 85.0` 정상 반영
- [ ] 시리얼 로그 확인:
  ```text
  [CT10] MotionSim apply requested (deferred)
  [CT10] S10 runtime updated from motion.sim (intensity=85.0)
  ```

---

## T-6: I-2 정책 검증 — 메모리 패치 후 save 없는 Reload 시 패치 소실 확인

**목적**: [`SPEC_0200.md`](file:///d:/95.2540_PJT/SmartNatureWind_v002/src/v0200/contract_doc_0200/SPEC_0200.md) §5.1에 명시된 대로 메모리 패치 후 `config/save` 없이 `reload`를 호출하면 디스크 원본으로 복원됨을 검증.

**검증 절차**
1. 현재 강도 확인 (예: 70).
2. `POST /api/v001/motion`으로 `intensity: 85` 패치 (단, `config/save`는 호출하지 않음).
3. `POST /api/v001/reload` 실행.
4. 1초 대기 후 상태 조회: `intensity`가 70으로 원복되었는지 확인.
5. 이어서 정상 순서 재검증:
   - `POST /motion` (`intensity: 90`)
   - `POST /api/v001/config/save` (디스크 영구 저장)
   - `POST /api/v001/reload`
   - 1초 후 상태 조회: `intensity == 90` 유지 확인.

**합격 판정 기준**
- [ ] 4단계: `intensity == 70` (디스크 상태 복원, 정책 정상 동작)
- [ ] 5단계: `intensity == 90` (save 후 reload 시 정상 유지)

---

## T-7: I-3 (`_pendingMotionSimApply` 리셋) — 초기화 시 잔재 소거 검증

**목적**: `CL_CT10_ControlManager::begin()` 및 `reloadAll()` 시점에 `_pendingMotionSimApply`가 방어적으로 `false` 리셋되는지 검증.

**합격 판정 기준**
- [ ] `CT10_Ctl_Ctl_0200.cpp`의 `begin()` 및 `reloadAll()` 내 `_pendingMotionSimApply.store(false)` 코드 존재 확인
- [ ] reload 실행 후 원치 않는 모션 시뮬레이션 중복 적용 로그가 발생하지 않음

---

## T-8: I-4 (Private 캡슐화) — 컴파일 및 링크 검증

**목적**: `applyMotionSimConfigToSim()`이 private으로 정상 은닉되어 외부 모듈에서 직접 호출되지 않음을 빌드로 입증.

**검증 절차**
```bash
pio run --environment esp32-s3-n16r8
```

**합격 판정 기준**
- [ ] `CT10_Ctl_0200.h` 내 `applyMotionSimConfigToSim()`이 private 섹션에 선언됨
- [ ] `W10_Web_Routes_0200.cpp` 등 외부에서 `applyMotionSimConfigToSim()`을 직접 호출하지 않고 `requestMotionSimApply()`를 호출함
- [ ] PlatformIO 빌드 성공 (종료 코드 0, 접근 제한자 위반 에러 없음)

---

## T-9: I-6 (웹 에셋 번들링 및 Gzip 서빙 무결성 검증)

**목적**: `pio_gzip_0200.py`로 사전 압축된 정적 에셋과 메인 JS 번들(`P010_bundle_0200.js`)이 W10 정적 라우터를 통해 `Content-Encoding: gzip` 헤더와 함께 정상 서빙되는지 검증.

**검증 절차**
1. 메인 HTML 요청 헤더 확인:
   ```bash
   curl -I -H "Accept-Encoding: gzip" http://<ESP32_IP>/html_v3/P010_main_0200.html
   ```
2. 번들 JS 요청 헤더 확인:
   ```bash
   curl -I -H "Accept-Encoding: gzip" http://<ESP32_IP>/html_v3/P010_bundle_0200.js
   ```
3. HTML 본문 내 8개 분할 스크립트 대체 여부 확인:
   ```bash
   curl -s http://<ESP32_IP>/html_v3/P010_main_0200.html | grep -c "P010_bundle_0200.js"
   ```

**합격 판정 기준**
- [ ] 1단계 & 2단계: HTTP 응답 코드 `200 OK`
- [ ] 1단계 & 2단계: 응답 헤더에 `Content-Encoding: gzip` 포함 확인
- [ ] 3단계: `P010_bundle_0200.js` 태그 1개 검출 (카운트 1) 및 `P000_common_0200.js` 등 개별 태그 미검출

---

## 📊 회귀 테스트 매트릭스 요약

| 테스트 ID | 검증 대상 | 권장 소요 시간 | 필수 여부 |
|---|---|---|---|
| **T-1** | F-03 (M10 tick) | 약 30초 | ✅ 필수 |
| **T-2** | F-04 (N10 tick) | 약 60초 (재부팅 포함) | ✅ 필수 |
| **T-3** | F-05 + I-1 (Reload 위임 및 폴링) | 약 10초 | ✅ 필수 |
| **T-4** | F-05 (중복 방지 409) | 약 5초 | ✅ 필수 |
| **T-5** | F-06 (Motion Sim 위임) | 약 5초 | ✅ 필수 |
| **T-6** | I-2 (Reload 정책) | 약 30초 | ✅ 필수 |
| **T-7** | I-3 (플래그 리셋) | 정적 코드 분석 | ✅ 필수 |
| **T-8** | I-4 (Private 캡슐화 컴파일) | 약 1분 (빌드) | ✅ 필수 |
| **T-9** | I-6 (웹 에셋 번들링 및 Gzip 서빙) | 약 10초 | ✅ 필수 |

---

## 장애 진단 및 트러블슈팅 매트릭스

| 실패 증상 | 원인 후보 및 점검 파일 | 해결 조치 |
|---|---|---|
| T-1 `motionActive` 영구 `true` | `A00_Main_0200.cpp` 내 `g_M10_motionLogic->tick()` 누락 | `A00_run()` 내에 tick 호출 라인 삽입 확인 |
| T-2 `lastUserProfileNo` 초기값 | `A00_Main_0200.cpp` 내 `CL_N10_NvsManager::tick()` 누락 | `A00_run()` 내에 N10 tick 호출 라인 확인 |
| T-3 응답 시간 > 500ms | `W10_Web_Routes_0200.cpp`에서 `reloadAll()` 직접 동기 호출 | `requestReload()` 위임 API 호출로 교체 |
| T-3 `pendingReload` 필드 누락 | `CT10_Ctl_IOWS_0200.cpp`의 `exportStateJson_v02()` 누락 | JSON 직렬화에 `control["pendingReload"]` 포함 |
| T-4 연속 요청 시 둘 다 202 | `requestReload()`가 atomic CAS를 사용하지 않음 | `compare_exchange_strong` 로직 점검 |
| T-5 응답 시간 > 100ms | `requestMotionSimApply()` 대신 CT10 락을 대기함 | 비동기 위임 플래그 store 방식으로 교체 |
| T-9 `Content-Encoding: gzip` 누락 | `W10_Web_Static_0200.cpp` 내 `.gz` 검사 및 헤더 누락 | `addHeader("Content-Encoding", "gzip")` 로직 점검 |

---

## 개정 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-19 | v2.0 | v0200 승격: 소스/문서/에셋 전체 접미사 _0200 단일화 및 LittleFS/main.cpp 빌드 전환 | Antigravity AI |
| 2026-10-19 | v1.2 | 웹 에셋 번들링 및 Gzip 서빙 무결성 검증 절차(T-9) 추가 | Antigravity AI |
| 2026-10-19 | v1.1 | v0200 소스 코드와 100% 동기화, curl/jq 명령어 표준화, 트러블슈팅 매트릭스 소스 파일명 갱신 | Antigravity AI |
| (초기) | v1.0 | 최초 회귀 테스트 절차서 작성 (T-1 ~ T-8) | 개발팀 |
