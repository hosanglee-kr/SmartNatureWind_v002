# TEST_PLAN_0202.md — 회귀 테스트 절차서 (v2.7)

> **검증 대상**: Smart Nature Wind v0202 펌웨어 + v0202 SPA 프론트엔드  
> **기준선**: Batch A~F 백엔드 리팩토링 + Phase 0~7 프론트엔드 재설계 + Batch G 코드 재검토(P0/P1) + Batch H UI 고도화 + Batch I 물리 Override 및 다국어 고도화 완료  
> **검증 환경**: ESP32-S3-N16R8, LittleFS 업로드 완료, 권장 로그 `EN_L10_LOG_DEBUG`  
> **파일명 정책**: 계약 문서 `_0202.md` 유지, 코드 참조 `_0202` 접미사

---

## 📋 목차

1. [검증 개요 및 준비](#1-검증-개요-및-준비)
2. [백엔드 기존 회귀 (T-1 ~ T-13)](#2-백엔드-기존-회귀)
3. [백엔드 Batch A~F 신규 (T-14 ~ T-28)](#3-백엔드-batch-af-신규)
   - 3.1 [Batch G — P0 크리티컬 회귀 (T-46 ~ T-50)](#31-batch-g--p0-크리티컬-회귀-t-46--t-50)
   - 3.2 [Batch G — P1 회귀 (T-51 ~ T-67)](#32-batch-g--p1-회귀-t-51--t-67)
   - 3.3 [Batch I — 바람 물리 Override 및 UI 고도화 회귀 (T-70 ~ T-72)](#33-batch-i--바람-물리-override-및-ui-고도화-회귀-t-70--t-72)
4. [프론트엔드 v0202 SPA (T-29 ~ T-35)](#4-프론트엔드-v0202-spa)
5. [정적 감사 (T-36 ~ T-40)](#5-정적-감사)
6. [부하/안정성 (T-41 ~ T-45)](#6-부하안정성)
7. [회귀 매트릭스 요약](#7-회귀-매트릭스-요약)
8. [장애 진단 및 트러블슈팅](#8-장애-진단-및-트러블슈팅)
9. [Phase 7 릴리스 게이트](#9-phase-7-릴리스-게이트)
10. [개정 이력](#10-개정-이력)

---

## 1. 검증 개요 및 준비

### 1.1 검증 계층 구조

```text
L1 필수 회귀 (8건)  ─── 릴리스 차단 조건
    T-1, T-3, T-5, T-14, T-16, T-27, [+T-46, T-48]

L2 필수 프론트엔드 (9건) ─── 릴리스 차단 조건
    T-29, T-30, T-31, T-32, T-33, T-34, T-35, [+T-47, T-51]

L3 정적 감사 (5건) ─── CI 자동 + 수동 grep
    T-36 ~ T-40

L4 확장 회귀 (22건) ─── 릴리스 후 병행 권장
    T-2, T-4, T-6~T-13, T-15, T-17~T-26, T-28

L5 부하/안정성 (5건) ─── 양산 승인 조건
    T-41 ~ T-45

L6 Batch G 코드 재검토 (22건) ─── P0 필수 5건 / P1 필수 8건
    P0: T-46, T-47, T-48, T-49, T-50
    P1: T-51~T-56, T-57~T-67 (B-1~B-13)

L7 Batch I 물리 Override 및 UI 고도화 (3건) ─── 릴리스 차단 조건
    T-70 (물리 Override 절대값 직접 지정), T-71 (대시보드 3슬라이더/SLEEP), T-72 (순서이동/다국어)
```

### 1.2 검증 환경

| 항목 | 값 |
|---|---|
| MCU | ESP32-S3-N16R8 (16MB Flash, 8MB PSRAM) |
| 펌웨어 | `FW_Ver_2.0.0` (v0202 코드 접미사) |
| 프론트엔드 | SPA 3자산 (HTML+CSS+35종 JS 번들, gz 85.4KB) |
| 계약 문서 | v2.6 (2026-10-28, Batch I 반영) |
| CI 환경 | GitHub Actions (ubuntu-latest) |
| 브라우저 | Chrome/Edge/Safari/Firefox 최신 |
| 로그 레벨 | `EN_L10_LOG_DEBUG` (검증 기간 한정) |

### 1.3 사전 준비

```bash
# 1. 저장소 클론 (최신 커밋)
git clone https://github.com/hosanglee-kr/SmartNatureWind_v002.git
cd SmartNatureWind_v002

# 2. 환경 확인
pio --version              # PlatformIO 6.x+
python3 --version          # 3.11+

# 3. 펌웨어 + 파일시스템 업로드
pio run --target upload      # 펌웨어
pio run --target uploadfs    # LittleFS (번들 + gzip 자동)

# 4. 시리얼 모니터 연결
pio device monitor           # 115200 bps, exception_decoder 필터

# 5. IP 확인 (시리얼 로그에서 확인)
# [WF10] STA got IP: 192.168.0.XX
IP=192.168.0.XX
```

### 1.4 도구 준비

```bash
# curl, jq 필수
which curl jq || sudo apt install curl jq

# 브라우저 DevTools (F12)
# - Network (HTTP/WS)
# - Console (JavaScript)
# - Application → Local Storage (snw.* 키)
```

---

## 2. 백엔드 기존 회귀

### T-1. F-03 (M10 tick) — PIR holdSec 정상 만료

**목적**: `A00_run()`에 `g_M10_motionLogic->tick()`이 배치되어 PIR 감지 후 `holdSec` (기본 10초) 경과 시 `motionActive=false`로 전환되는지 검증.

**사전 조건**:
- `cfg_motion_0202.json` → `motion.pir.enabled = true`, `motion.pir.holdSec = 10`

**검증 절차**:
```bash
# 1. PIR 가상 감지 피드
curl -X POST http://$IP/api/v001/motion/pir/feed -d '{"pir":true}'

# 2. 즉시 상태 조회
curl -s http://$IP/api/v001/state | jq .control.sensor.motionActive

# 3. 5초 대기 후 재조회 (holdSec 미만)
sleep 5
curl -s http://$IP/api/v001/state | jq .control.sensor.motionActive

# 4. 15초 대기 후 재조회 (holdSec 경과)
sleep 10
curl -s http://$IP/api/v001/state | jq .control.sensor.motionActive
```

**합격 판정**:
- [ ] 2단계: `true`
- [ ] 3단계 (5초): `true` 유지
- [ ] 4단계 (15초): **`false`** 전환
- [ ] **[C-3] 30초 후에도 `false` 유지** (2×hold 버그 회귀 방지 — 이전 버그 시 20초 근처까지 true)
- [ ] 시리얼 로그: `[M10] motionActive=0` 출력

> **[C-3] 회귀 체크**: 이전 버그는 `holdSec=10` 시 실제 20초간 active 유지.
> 15초 시점 `false`이고 30초 시점에도 `false`면 C-3 수정 정상.

**실패 시 조치**: `A00_Main_0202.cpp`의 `A00_run()` 내 `g_M10_motionLogic->tick()` 호출 확인.

---

### T-2. F-04 (N10 tick) — NVS 런타임 저장/복구

**목적**: `A00_run()`에 `CL_N10_NvsManager::tick()`이 배치되어 변경된 런타임 상태가 10초 이내에 NVS 플래시에 반영되는지 검증.

**사전 조건**: 유효한 사용자 프로파일 1개 (`profileNo = 10`)

**검증 절차**:
```bash
# 1. 사용자 프로파일 활성
curl -X POST http://$IP/api/v001/control/profile/select -d '{"id":10}'

# 2. 즉시 상태 확인
curl -s http://$IP/api/v001/state | jq .control.profile.profileNo

# 3. 10초 대기 (N10 주기 플러시)
sleep 10

# 4. 소프트웨어 재부팅
curl -X POST http://$IP/api/v001/control/reboot

# 5. 부팅 완료 후 (30초) NVS 복원 확인
sleep 30
curl -s http://$IP/api/v001/metrics | jq .runtime.lastUserProfileNo
```

**합격 판정**:
- [ ] 2단계: `profileNo == 10`
- [ ] 5단계 (재부팅 후): `lastUserProfileNo == 10`
- [ ] 시리얼 로그: `[N10] Runtime flushed to NVS`

**실패 시 조치**: `A00_run()` 내 `CL_N10_NvsManager::tick()` 호출 확인.

---

### T-3. F-05 (Reload 위임) — 비동기 202 + pendingReload 폴링

**목적**: `POST /api/v001/reload`가 `async_tcp` 블로킹 없이 즉시 202 반환, `loopTask`가 실제 재로드 완료까지 `control.pendingReload` 정상 동작 검증.

**검증 절차**:
```bash
# 1. 응답 코드 + 소요 시간
curl -s -w "\nHTTP:%{http_code} TIME:%{time_total}s\n" -X POST http://$IP/api/v001/reload

# 2. 50ms 간격 pendingReload 상태 관찰
for i in {1..10}; do
  curl -s http://$IP/api/v001/state | jq .control.pendingReload
  sleep 0.05
done
```

**합격 판정**:
- [ ] HTTP: **`202 Accepted`**, 본문 `{"result":"queued"}`
- [ ] TIME: **`< 0.05s`** (50ms)
- [ ] 요청 직후: `pendingReload == true`
- [ ] 500ms 이내: `pendingReload == false`
- [ ] **[B-1] reload 중 N10 flush 블로킹 ≤ 20ms** (시리얼 타임스탬프 기준)
- [ ] 시리얼 로그 순서:
  ```
  [W10] routeReload -> 202 Accepted
  [A00] Executing pending reload (loopTask)...
  [N10] Runtime flushed (single commit)   ← [B-1] 단일 커밋 확인
  [CT10] reloadAll done
  [A00] Pending reload done (ok=1)
  ```

**실패 시 조치**: `W10_Web_Routes_Config_0202.cpp`의 `routeReload()` 및 `requestReload()` atomic CAS 로직 확인.

---

### T-4. F-05 (중복 방지) — 409 Conflict

**목적**: 이미 Reload 처리 중인 상태에서 추가 요청 시 409 반환 검증.

**검증 절차**:
```bash
# 1. 1차 요청 (202 기대)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://$IP/api/v001/reload

# 2. 즉시 (50ms 이내) 2차 요청 (409 기대)
curl -s -w "\n%{http_code}\n" -X POST http://$IP/api/v001/reload

# 3. 1초 대기 후 3차 요청 (202 기대)
sleep 1
curl -s -w "\n%{http_code}\n" -X POST http://$IP/api/v001/reload
```

**합격 판정**:
- [ ] 1차: **`202`**
- [ ] 2차: **`409`**, `{"error":"reload already pending"}`
- [ ] 3차: **`202`**

**실패 시 조치**: `requestReload()`의 `compare_exchange_strong` 로직 확인.

---

### T-5. F-06 (Motion Sim 위임) — 비동기 패치 + S10 반영

**목적**: `POST /api/v001/motion`이 CT10 뮤텍스 대기 없이 즉시 200 반환, 다음 `tickLoop`에서 `applyMotionSimConfigToSim()` 지연 소비 검증.

**검증 절차**:
```bash
# 1. 현재 강도 확인
curl -s http://$IP/api/v001/state | jq .sim.intensity

# 2. 모션 시뮬 파라미터 패치
curl -s -w "\nHTTP:%{http_code} TIME:%{time_total}s\n" -X POST http://$IP/api/v001/motion \
  -d '{"motion":{"sim":{"intensity":85.0}}}'

# 3. 100ms 대기 후 상태 재조회
sleep 0.1
curl -s http://$IP/api/v001/state | jq .sim.intensity
```

**합격 판정**:
- [ ] HTTP: **`200`**, TIME: **`< 0.05s`**
- [ ] 3단계: `intensity == 85.0`
- [ ] 시리얼 로그:
  ```
  [CT10] MotionSim apply requested (deferred)
  [CT10] S10 runtime updated from motion.sim (intensity=85.0)
  ```

---

### T-6. I-2 정책 — 메모리 패치 후 save 없는 reload 시 소실

**목적**: `SPEC_0202.md §5.2`에 명시된 대로 메모리 패치 후 `config/save` 없이 `reload` 호출 시 디스크 원본으로 복원됨을 검증.

**검증 절차**:
```bash
# 1. 현재 강도 확인 (예: 70)
curl -s http://$IP/api/v001/state | jq .sim.intensity

# 2. intensity 85 패치 (save 없음)
curl -X POST http://$IP/api/v001/motion -d '{"motion":{"sim":{"intensity":85}}}'

# 3. reload 실행
curl -X POST http://$IP/api/v001/reload
sleep 1

# 4. 상태 조회 → 70 복원 확인
curl -s http://$IP/api/v001/state | jq .sim.intensity

# 5. 정상 순서 재검증
curl -X POST http://$IP/api/v001/motion -d '{"motion":{"sim":{"intensity":90}}}'
curl -X POST http://$IP/api/v001/config/save
curl -X POST http://$IP/api/v001/reload
sleep 1
curl -s http://$IP/api/v001/state | jq .sim.intensity
```

**합격 판정**:
- [ ] 4단계: `intensity == 70` (디스크 복원)
- [ ] 5단계: `intensity == 90` (save 후 reload 유지)

---

### T-7. I-3 (`_pendingMotionSimApply` 리셋) — 초기화 시 잔재 소거

**목적**: `CT10::begin()` 및 `reloadAll()` 시점 `_pendingMotionSimApply` 방어적 `false` 리셋 검증.

**검증 절차**:
```bash
# 정적 코드 확인
grep -n "_pendingMotionSimApply.store(false" \
  src/v0202/CT10_Ctl_Ctl_0202.cpp
```

**합격 판정**:
- [ ] `begin()` 내 `.store(false)` 존재
- [ ] `reloadAll()` 내 `.store(false)` 존재
- [ ] reload 실행 후 모션 시뮬 중복 적용 로그 미발생

---

### T-8. I-4 (Private 캡슐화) — 컴파일 검증

**목적**: `applyMotionSimConfigToSim()`이 private으로 은닉되어 외부 모듈에서 직접 호출되지 않음 검증.

**검증 절차**:
```bash
# 1. private 섹션 확인
grep -A2 "private:" src/v0202/CT10_Ctl_0202.h | grep "applyMotionSimConfigToSim"

# 2. 외부 호출 부재 확인
grep -rn "applyMotionSimConfigToSim" src/v0202/*.cpp | \
  grep -v "CT10_Ctl_Ctl_0202.cpp"
# 기대: 0건

# 3. 빌드 성공 확인
pio run --environment esp32-s3-n16r8
```

**합격 판정**:
- [ ] private 섹션 내 선언 확인
- [ ] 외부 호출 0건
- [ ] 빌드 성공

---

### T-9. I-6 (번들/Gzip) — 웹 에셋 무결성

**목적**: Gzip 사전 압축 + 번들이 정상 서빙 검증.

**검증 절차**:
```bash
# 1. 번들 JS gzip 헤더
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0202/P010_bundle_0202.js

# 2. CSS gzip 헤더
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0202/P000_common_0202.css

# 3. HTML 내 script 번들 태그 확인
curl -s http://$IP/html_v0202/index.html | grep -c "P010_bundle_0202.js"
```

**합격 판정**:
- [ ] JS: `Content-Encoding: gzip`, 200
- [ ] CSS: `Content-Encoding: gzip`, 200
- [ ] HTML: bundle 태그 정확히 1개
- [ ] **[B-5] `Vary: Accept-Encoding` 헤더 포함** (프록시 캐시 오염 방지)
- [ ] **[B-5] `Accept-Encoding: gzip;q=0` → `Content-Encoding` 미포함** (아래 T-61 상세)

---

### T-10. N-1 (`lastReloadOk`) — 상태 노출

**검증 절차**:
```bash
curl -s http://$IP/api/v001/state | jq .control.lastReloadOk
# 초기: true

curl -X POST http://$IP/api/v001/reload
sleep 0.5
curl -s http://$IP/api/v001/state | jq '{pending: .control.pendingReload, ok: .control.lastReloadOk}'
```

**합격 판정**:
- [ ] 초기: `true`
- [ ] reload 후: `pendingReload: false`, `lastReloadOk: true`

---

### T-11. G-1 (Accept-Encoding) — gzip/raw 분기

**검증 절차**:
```bash
# 1. gzip 포함
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0202/P010_bundle_0202.js

# 2. gzip 미포함 (curl 기본)
curl -I http://$IP/html_v0202/P010_bundle_0202.js
```

**합격 판정**:
- [ ] 1번: `Content-Encoding: gzip` 포함
- [ ] 2번: `Content-Encoding` 미포함 (raw)

---

### T-12. G-2/G-4 (Long Path) — regex gzip

**검증 절차**:
```bash
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0202/index.html
```

**합격 판정**:
- [ ] 200 OK
- [ ] `Content-Encoding: gzip`
- [ ] `Content-Type: text/html; charset=utf-8`

---

### T-13. N-3 (Root Fallback) — 무한 루프 차단

**검증 절차**:
```bash
# 정상 (메인 HTML 존재)
curl -I http://$IP/
# 기대: 302 → /index.html

# 부재 시 (수동 파일 삭제 시뮬레이션 필요, 선택)
```

**합격 판정**:
- [ ] 정상: 302 리다이렉트
- [ ] 파일 부재: 404 + 진단 메시지 (무한 루프 없음)

---

## 3. 백엔드 Batch A~F 신규

### T-14. A-1 — FIXED self-heal 폭주 방지

**목적**: `tickSegmentSequence` 내 `mode == PRESET` 조건으로 FIXED 모드 무한 재호출 차단 검증.

**사전 조건**: FIXED 모드 스케줄 등록 (fixedSpeed=50, onMinutes=2, offMinutes=1)

**검증 절차**:
```bash
# 30초 관찰 후 시리얼 로그 카운트
grep -c "SegmentOn(SCH) FIXED" serial.log
```

**합격 판정**:
- [ ] 로그 카운트 **정확히 1회** (배치 A 이전: 750+ 폭주)
- [ ] WS `/state` 브로드캐스트 빈도 정상화 (`control.state === SCHEDULE_RUN` 유지)
- [ ] `sim.active == false` 유지 (FIXED 특성상 정상)

**실패 시 조치**: `CT10_Ctl_Ctl_Seg_0202.cpp`의 `tickSegmentSequence` 내 `v_seg.mode == EN_A20_SEG_MODE_PRESET` 조건 확인.

---

### T-15. A-2 — 캡슐화 위임

**목적**: W10에서 CT10 위임 메서드 경유 확인.

**검증 절차**:
```bash
# 1. 직접 접근 0건
grep -rn "s_control->sim\.\|s_control->motion->" src/v0202/*.cpp
# 기대: 0건

# 2. private 섹션에 motion/sim
grep -A5 "private:" src/v0202/CT10_Ctl_0202.h | grep -E "motion|sim"
```

**합격 판정**:
- [ ] grep 결과 0건
- [ ] motion/sim private 확인
- [ ] 컴파일 성공

---

### T-16. B-1 — 버전 SSOT

**검증 절차**:
```bash
curl -s http://$IP/api/v001/version | jq '{fw, control, config, api, simul}'
```

**합격 판정**:
- [ ] `fw == "FW_Ver_2.0.0"`
- [ ] `control == "CT10_Ctl_0202"`
- [ ] `config == "C10_Config_0202"`
- [ ] `api == "W10_Web_0202"`
- [ ] `simul == "S10_Simul_0202"`

---

### T-17. C — 매직넘버 상수화 물리 출력 무변동

**검증 절차**:
```bash
# 1. Batch C 이전 60초 chart 스냅샷 저장 (기록)
# 2. Batch C 이후 60초 chart 스냅샷 저장
for i in {1..60}; do
  curl -s http://$IP/api/v001/state | jq -c '.sim | {windSpeed, targetWind, phase, gustActive, thermalActive}'
  sleep 1
done > chart_post_c.jsonl

# 3. 두 파일 비교
```

**합격 판정**:
- [ ] phase 시퀀스 패턴 유사
- [ ] windSpeed 평균 차이 < 5%
- [ ] gust/thermal 발생 빈도 ±1회 허용
- [ ] 최대/최소 범위 동일

---

### T-18. D-1 — WS 배치 mutex

**검증 절차**:
```bash
# 5분간 WS 4채널 구독 유지 (브라우저 DevTools)
# 지표:
# - WS 4채널 모두 정상 수신
# - chart diff 1200ms 주기
# - 시리얼 로그에 mutex timeout 없음
```

**합격 판정**:
- [ ] 4채널 지속
- [ ] chart 주기 1200ms
- [ ] mutex timeout 0건

---

### T-19. D-2/3/5 — heap 안정성

**검증 절차**:
```bash
# 5분간 heap 샘플링
for i in {1..300}; do
  curl -s http://$IP/api/v001/diag | jq -c '{ts: now, heap: .heap, fs_used: .fs_used}'
  sleep 1
done > heap_log.jsonl

jq -s 'map(.heap) | {min:min, max:max, first:.[0], last:.[-1]}' heap_log.jsonl
```

**합격 판정**:
- [ ] `min > 100000` (100KB 여유)
- [ ] `last - first > -5000` (누수 없음)

---

### T-20. E — 링크 무결성

**검증 절차**:
```bash
pio run --environment esp32-s3-n16r8 2>&1 | grep -iE "undefined|multiple"
# 기대: 0건

nm .pio/build/esp32-s3-n16r8/firmware.elf | grep -i "saveToFile"
# 기대: 0건 (E-6 제거 확인)
```

**합격 판정**:
- [ ] 링커 에러 0건
- [ ] saveToFile 심볼 부재

---

### T-21. E-2.1 — TM10 분리 SNTP 재동기화

**검증 절차**:
```bash
# 재부팅 후 SNTP 상태
sleep 30
curl -s http://$IP/api/v001/state | jq .control.time.timeValid
# 기대: true
```

**합격 판정**:
- [ ] `timeValid == true`
- [ ] 시리얼 로그: `[TM10] SNTP synced OK`
- [ ] Fallback 전환 로그: `[TM10] NTP fallback switch`

---

### T-22. E-2.2 — W10 6분할 27 엔드포인트

**검증 절차**:
```bash
BASE=http://$IP/api/v001

# System (10)
curl -s $BASE/version | jq .module
curl -s $BASE/state | jq .control.active
curl -s $BASE/system | jq .meta.version
curl -s $BASE/motion | jq .motion.pir.enabled
curl -s $BASE/diag | jq .heap
curl -s $BASE/metrics | jq .metrics.active
curl -s $BASE/logs | jq .logs
curl -s $BASE/auth/test | jq .result
curl -s $BASE/wifi/scan | jq .wifi.scan | length
curl -s $BASE/wifi/state | jq .wifi.state.mode

# Control (5)
curl -s -X POST "$BASE/control/override/fixed?percent=50" | jq
curl -s $BASE/control/summary | jq .summary.state
curl -s $BASE/simulation | jq .sim.active
curl -s $BASE/sim/state | jq .sim.phase
curl -s -X POST $BASE/motion/pir/feed -d '{"pir":true}' | jq .fed

# Config (3)
curl -s $BASE/config | jq .system
curl -s -X POST $BASE/config/save | jq .result
curl -s $BASE/config/dirty | jq .system

# Network (3)
curl -s $BASE/wifi/config | jq .wifi.wifiMode
curl -s $BASE/system/firmware/check | jq .status
curl -s -X POST $BASE/system/time/set -d '{"timeCfg":{"syncIntervalMin":360}}' | jq .status

# CRUD (7)
curl -s $BASE/windProfile | jq .windDict.presets | length
curl -s $BASE/schedules | jq .schedules | length
curl -s $BASE/user_profiles | jq .userProfiles.profiles | length
curl -s -X POST $BASE/user_profiles/patch -d '{"userProfiles":{"profiles":[]}}' | jq .updated

# Reload
curl -s -X POST $BASE/reload | jq .result
```

**합격 판정**:
- [ ] 27 엔드포인트 모두 정상 응답 (200/202/400/404 의도된 코드)

---

### T-23. E-2.3 — C10_Sch 분할 + CRUD

**검증 절차**:
```bash
BASE=http://$IP/api/v001

# 1. GET 기존 유지
curl -s $BASE/schedules | jq .schedules | length

# 2. POST 신규 (schNo=100)
curl -s -X POST $BASE/schedules -d '{
  "schedule": {
    "schNo":100, "name":"Test", "enabled":true,
    "period":{"enabled":true,"days":[1,1,1,1,1,1,1],"startTime":"08:00","endTime":"20:00"},
    "segments":[{"segNo":10,"onMinutes":20,"offMinutes":10,"mode":"PRESET","presetCode":"OCEAN","styleCode":"BALANCE","adjust":{}}]
  }
}' | jq

# 3. overlap 검증 (겹치는 시간 2건)
curl -s -X POST $BASE/schedules -d '{...겹치는 시간...}' | jq
# 기대: 400 에러
```

**합격 판정**:
- [ ] GET/POST/PUT/DELETE 200
- [ ] overlap 400

---

### T-24. E-2.4 — CT10_Ctl 4분할

**검증 절차**:
```bash
# 1. FIXED 모드 스케줄 → 로그 1회 (T-14 재확인)
# 2. PRESET 모드 스케줄 → 로그 1회
# 3. Override fixed 20% → 3초 후 clear
# 4. Profile No=10 시작 → 5초 후 정지
# 5. Reload 중 스케줄 유지
```

**합격 판정**:
- [ ] FIXED/PRESET 각 로그 1회
- [ ] Override start/stop 정상
- [ ] Profile start/stop 정상
- [ ] Reload 후 스케줄 재개

---

### T-25. E-2.6 — UzProf 5분할

**검증 절차**:
```bash
# profileNo=50 신규 → PUT → DELETE
curl -X POST $BASE/user_profiles -d '{"profile":{"profileNo":50,...}}'
curl -X PUT $BASE/user_profiles/{id} -d '{...}'
curl -X DELETE $BASE/user_profiles/{id}
```

**합격 판정**:
- [ ] POST 201
- [ ] PUT 200
- [ ] DELETE 200

---

### T-26. E-2.7 — WindDc 5분할

**검증 절차**:
```bash
# 프리셋 CRUD
curl -X POST $BASE/windProfile -d '{"preset":{"code":"TEST1","name":"Test","factors":{...}}}'
curl -X PUT $BASE/windProfile/{id} -d '{...}'
curl -X DELETE $BASE/windProfile/{id}

# config save
curl -X POST $BASE/config/save
```

**합격 판정**:
- [ ] CRUD 200
- [ ] config save 후 프리셋 유지
- [ ] reload 후에도 유지

---

### T-27. F-1 — Factory reset NVS 초기화

**검증 절차**:
```bash
# 1. override + profile 활성
curl -X POST $BASE/control/override/fixed?percent=50
curl -s $BASE/metrics | jq '{overrideActive, profileIdx}'
# → {"overrideActive":true,"profileIdx":0}

# 2. factory reset (자동 재부팅)
curl -X POST $BASE/control/factoryReset

# 3. 30초 후 재접속
sleep 30
curl -s $BASE/metrics | jq '{overrideActive, profileIdx}'
# → {"overrideActive":false,"profileIdx":-1}
```

**합격 판정**:
- [ ] 3단계: `false` / `-1`
- [ ] 시리얼 로그: `[C10] Factory Reset: NVS runtime reset done.`
- [ ] 재부팅 후: `[N10] Load runtime: mode=0 src=0 ...`

---

### T-28. F-2/F-3 — POST/PATCH 응답 동일성

**검증 절차**:
```bash
# system POST/PATCH
curl -s -X POST $BASE/system -d '{"meta":{"deviceName":"TestA"}}'
curl -s -X PATCH $BASE/system -d '{"meta":{"deviceName":"TestB"}}'

# wifi POST/PATCH
curl -s -X POST $BASE/wifi/config -d '{"wifi":{...}}'
curl -s -X PATCH $BASE/wifi/config -d '{"wifi":{...}}'
```

**합격 판정**:
- [ ] 응답 키 구조 완전 동일 (`updated`/`status`/`note`/`need_reboot`)
- [ ] 실패 케이스도 동일 코드 반환

---

## 3.1 Batch G — P0 크리티컬 회귀 (T-46 ~ T-50)

### T-46. [C-1] USB 미연결 부팅 — 3초 타임아웃

**목적**: `while(!Serial)` 무한 대기 버그(C-1) 방지. PC 미연결 상태로 전원 인가 시 3초 후 부팅 계속.

**사전 조건**: USB 케이블 분리 (전원만 인가, 5V 어댑터)

**검증 절차**:
```bash
# 1. USB 분리 후 전원 인가 (t=0)
# 2. 시리얼은 볼 수 없으므로, 기기 IP 접속으로 확인
# 3. 60초 대기
sleep 60

# 4. 웹 접속 확인
curl -s -o /dev/null -w "%{http_code}\n" http://$IP/api/v001/version
# 기대: 200

# 5. AP 방송 확인 (스마트폰 Wi-Fi 목록)
# - NatureWind SSID 표시 여부

# 6. USB 재연결 후 시리얼 로그 (부팅 후 로그만 확인 가능)
pio device monitor
# 기대: 아래 로그가 아닌 "Initialization complete" 이후 로그만 보임
# [C-1] USB 미연결 상태 감지 → 3000ms 타임아웃 후 부팅 계속
```

**합격 판정**:
- [ ] 4단계: 200 (60초 내 부팅 완료)
- [ ] 5단계: AP NatureWind 방송
- [ ] 6단계: "Initialization complete" 로그 확인
- [ ] 6단계: [BOOT] A00_init Start까지 3초 이상 지연되지 않음

**실패 시 조치**: `A00_Main_0202.cpp`의 `while(!Serial && ...)` 조건 및 `G_A00_USB_CDC_TIMEOUT_MS` 상수 확인.

---

### T-47. [C-2] 대시보드 프리셋 그리드 — 10개 카드 표시

**목적**: mount 순서 버그(C-2) 방지. 대시보드 진입 시 프리셋 그리드가 10개 카드 표시.

**검증 절차**:
```javascript
// 브라우저 DevTools Console

// 1. 대시보드 강제 이동
location.hash = '/dashboard';

// 2. 2초 대기 후 프리셋 카드 개수 확인
await new Promise(r => setTimeout(r, 2000));
document.querySelectorAll('.snw-preset-card').length;
// 기대: 10 (또는 windDict.presetCount)

// 3. 첫 카드 텍스트 확인
document.querySelector('.snw-preset-card')?.textContent;

// 4. 리로드 후에도 유지 확인
location.reload();
await new Promise(r => setTimeout(r, 3000));
document.querySelectorAll('.snw-preset-card').length;
```

**합격 판정**:
- [ ] 2단계: > 0 (이전 버그: 0)
- [ ] 3단계: 프리셋 이름 표시 (예: Ocean Breeze)
- [ ] 4단계: 리로드 후에도 동일 개수
- [ ] 클릭 시 배경 강조 (`is-selected` 클래스)

**실패 시 조치**: `200.page.dashboard.js`의 `_mountComponents()` 호출 순서 확인.

---

### T-48. [C-3] PIR holdSec 정확도 — 2× 버그 방지

**목적**: `isActive()` 이중 판정(C-3) 방지. `holdSec=10`일 때 정확히 10초 후 비활성.

**검증 절차**:
```bash
# cfg_motion_0202.json → motion.pir.holdSec = 10 (PATCH로 즉시 변경 가능)

# 1. PIR 피드 + 즉시 확인
curl -X POST http://$IP/api/v001/motion/pir/feed -d '{"pir":true}'
curl -s http://$IP/api/v001/state | jq -c '{t:0, active:.control.sensor.motionActive}'

# 2. 8초 후 (hold 미경과)
sleep 8
curl -s http://$IP/api/v001/state | jq -c '{t:8, active:.control.sensor.motionActive}'

# 3. 12초 후 (hold 경과 + 2초)
sleep 4
curl -s http://$IP/api/v001/state | jq -c '{t:12, active:.control.sensor.motionActive}'

# 4. 15초 후 (이전 버그 시점: 2×hold=20초 내이므로 여전히 true였다)
sleep 3
curl -s http://$IP/api/v001/state | jq -c '{t:15, active:.control.sensor.motionActive}'

# 5. 25초 후 (2×hold=20초도 초과)
sleep 10
curl -s http://$IP/api/v001/state | jq -c '{t:25, active:.control.sensor.motionActive}'
```

**합격 판정**:
- [ ] t=0: active: true
- [ ] t=8: active: true
- [ ] t=12: active: false
- [ ] t=15: active: false ← 이전 버그 시 true였음
- [ ] t=25: active: false

**실패 시 조치**: `M10_MotionLogic_0202.h`의 `isActive()` 함수가 `_state.pirActive` 단일 반환인지 확인.

---

### T-49. [C-4] 업로드 핸들 누수 — 강제 종료 후 재시도

**목적**: 클라이언트 조기 종료 시 stale 핸들 누수(C-4) 방지. 재업로드 성공.

**검증 절차**:
```bash
# 1. 정상 파일 업로드 (베이스라인)
curl -X POST http://$IP/api/v001/fileUpload -H "X-API-Key: $KEY" \
  -F "file=@test.txt" | jq .done
# 기대: true

# 2. 강제 중단 업로드 (curl --max-time 으로 조기 종료)
timeout 1 curl -X POST http://$IP/api/v001/fileUpload -H "X-API-Key: $KEY" \
  -F "file=@large_file.bin" 2>/dev/null
# 기대: 1초 후 강제 종료 (서버에 final 청크 미도달)

# 3. 재업로드 시도
curl -X POST http://$IP/api/v001/fileUpload -H "X-API-Key: $KEY" \
  -F "file=@test.txt" | jq '{done, error}'
# 기대: {"done": true}

# 4. 시리얼 로그 확인
grep "stale upload handle" serial.log
# 기대: [W10] stale upload handle closed before new upload
```

**합격 판정**:
- [ ] 1단계: done: true
- [ ] 3단계: done: true (이전 버그: done: false, error: "concurrent upload")
- [ ] 4단계: stale handle close 로그 1회

**실패 시 조치**: `W10_Web_Upload_0202.cpp`의 `if (s_upFile)` 블록 확인 (`available()` 검사 제거됨).

---

### T-50. [C-5] 라우터 재진입 — Watcher 누수

**목적**: 빠른 페이지 전환 시 watcher/timer 누수(C-5) 방지. `_dispatching` 가드 동작.

**검증 절차**:
```javascript
// 브라우저 DevTools Console

// 1. Store 구독자 수 베이스라인
const before = SNW.Store._subs.size;
console.log('before:', before);

// 2. 5초 내 10회 빠른 페이지 전환
for (let i = 0; i < 10; i++) {
    location.hash = i % 2 ? '/chart' : '/dashboard';
    // await 없이 즉시 전환 (재진입 유도)
}

// 3. 5초 대기 (모든 mount/unmount 완료)
await new Promise(r => setTimeout(r, 5000));

// 4. 구독자 수 확인
const after = SNW.Store._subs.size;
console.log('after:', after);

// 5. Timer 개수 (인터벌 누수)
// - 정상: 마지막 페이지(dashboard)의 clock interval만
```

**합격 판정**:
- [ ] 4단계: after - before < 5 (마지막 페이지의 watcher만 유지)
- [ ] 콘솔 에러 0건
- [ ] 마지막 페이지 정상 표시

**실패 시 조치**: `070.router.js`의 `_dispatching` 플래그 로직 확인. `if (_dispatching) return;` 및 `finally` 블록 확인.

---

## 3.2 Batch G — P1 회귀 (T-51 ~ T-67)

### T-51. [NEW-C1] 0값 보존 — pin/brightness/holdSec

**목적**: `||` 연산자로 인한 0값 손실(NEW-C1) 방지. `nz()` 헬퍼 동작.

**검증 절차**:
```bash
# 1. 0값으로 설정
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "hw":{
    "led":{"pin":0, "defaultBrightness":0},
    "pir":{"holdSec":0},
    "fanPwm":{"pin":0}
  }
}'

# 2. 재조회로 서버 저장 확인
curl -s http://$IP/api/v001/system | jq '{
  led_pin:.system.hw.led.pin,
  led_bright:.system.hw.led.defaultBrightness,
  pir_hold:.system.hw.pir.holdSec,
  pwm_pin:.system.hw.fanPwm.pin
}'
# 기대: 모두 0

# 3. 브라우저 설정 페이지 진입 → DOM 값 확인
# (브라우저에서 http://$IP/#/settings 방문 후 Console)
document.querySelector('#hw-led-pin').value;
document.querySelector('#hw-led-bright').value;
document.querySelector('#hw-pir-hold').value;
document.querySelector('#hw-pwm-pin').value;
# 기대: 모두 '0' (이전 버그: '48', '20', '120', '6')

# 4. 저장 버튼 클릭 없이 재조회 → 서버 값 유지 확인 (0 덮어쓰기 없음)
curl -s http://$IP/api/v001/system | jq '.system.hw.led.pin'
# 기대: 0
```

**합격 판정**:
- [ ] 2단계: 모두 0
- [ ] 3단계: DOM 값 모두 '0' (이전 버그: 기본값)
- [ ] 4단계: 0 유지

**실패 시 조치**: `240.page.settings.js`의 `nz(v, fallback)` 적용 여부 확인. `pwm.pin`, `led.pin`, `led.defaultBrightness`, `pir.holdSec` 모두 `nz()` 사용 여부.

---

### T-52. [NEW-C2] XSS — dht.type 이스케이프

**목적**: `dht.type` 미이스케이프 XSS(NEW-C2) 방지.

**검증 절차**:
```bash
# 1. XSS payload 저장
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "hw":{"tempHum":{"type":"<img src=x onerror=alert(1)>"}}
}'

# 2. 서버 저장 확인
curl -s http://$IP/api/v001/system | jq '.system.hw.tempHum.type'
# 기대: "<img src=x onerror=alert(1)>" (서버는 원본 유지)

# 3. 브라우저 설정 페이지 진입
# DevTools Network에서 alert 발생 여부 확인
# http://$IP/#/settings 방문
```

**합격 판정**:
- [ ] 브라우저 alert(1) 미발생 (XSS 차단)
- [ ] `<input id="hw-dht-type">`의 value 속성에 원본 텍스트 표시
- [ ] DOM에 `<img>` 태그 미삽입 (`querySelectorAll('img').length === 0`)

**실패 시 조치**: `240.page.settings.js`의 `dht.type` 렌더링 라인이 `esc(nz(dht.type, 'DHT22'))` 형태인지 확인.

---

### T-53. [NEW-U1] API Key DOM 노출 방지

**목적**: API Key 평문 노출(NEW-U1) 방지. DOM 검사로 키 추출 불가 확인.

**검증 절차**:
```bash
# 1. 서버에 API Key 설정
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "security":{"apiKey":"SECRET_KEY_12345"}
}'

# 2. 브라우저 설정 페이지 진입
# http://$IP/#/settings 방문

# 3. 브라우저 Console에서 필드 값 확인
document.querySelector('#api-key').value;
# 기대: "" (빈 문자열 — 이전 버그: "SECRET_KEY_12345")

# 4. DOM에 원본 키 존재 여부
document.documentElement.outerHTML.includes('SECRET_KEY_12345');
# 기대: false

# 5. 배지 상태 확인
document.querySelector('[data-slot="form-log"]').textContent.includes('(설정됨)');
# 기대: true
```

**합격 판정**:
- [ ] 3단계: "" (빈 문자열)
- [ ] 4단계: false (DOM에 원본 키 없음)
- [ ] 5단계: true (설정됨 배지)

**실패 시 조치**: `240.page.settings.js`의 api-key input value 속성 확인.

---

### T-54. [NEW-U2] + [B-4] API Key 삭제 — clearApiKey

**목적**: API Key 삭제 UI(NEW-U2) + 백엔드 플래그(B-4) 통합 동작.

**검증 절차**:
```bash
# 1. 서버에 API Key 설정
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "security":{"apiKey":"SECRET_KEY"}
}'

# 2. 인증 필요한 엔드포인트로 확인
curl -s -H "X-API-Key: SECRET_KEY" http://$IP/api/v001/auth/test | jq .result
# 기대: authorized

# 3. clearApiKey 플래그로 삭제
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: SECRET_KEY" -d '{
  "security":{"clearApiKey":true}
}'

# 4. 인증 없이 접근 (삭제 후)
curl -s http://$IP/api/v001/auth/test | jq .result
# 기대: authorized (키 없음 → 개방 모드)

# 5. 서버 상태 확인
curl -s http://$IP/api/v001/system | jq '.security.apiKey'
# 기대: ""

# 6. 브라우저에서도 확인
# 1) 키 설정 → #/settings 진입 → "API Key 삭제" 체크박스 체크 → 저장
# 2) 재조회 시 "(미설정)" 배지
```

**합격 판정**:
- [ ] 3단계: 서버 처리 정상 (200)
- [ ] 4단계: 인증 없이 통과
- [ ] 5단계: ""
- [ ] 6단계: (미설정) 배지

**실패 시 조치**: `C10_Config_Sys_0202.cpp`의 `clearApiKey` 블록 확인 (B-4). `240.page.settings.js`의 `_onSave` securityPatch 확인 (NEW-U2).

---

### T-55. [NEW-U3] wsChConfig 손상 복구

**목적**: `wsChConfig: []` 손상 시 기본 4채널 복원(NEW-U3).

**검증 절차**:
```bash
# 1. 손상 시뮬레이션
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "system":{"webSocket":{"wsChConfig":[]}}
}'

# 2. 브라우저 설정 페이지 진입
# http://$IP/#/settings 방문

# 3. WS 채널 입력 개수 확인
document.querySelectorAll('[data-ws-itv]').length;
# 기대: 4 (이전 버그: 0)

# 4. 저장 시 chName 유지 확인
# 저장 버튼 클릭 후 서버 재조회
curl -s http://$IP/api/v001/system | jq '.system.webSocket.wsChConfig'
# 기대: 4개 채널, chName = ["state","metrics","chart","summary"]
```

**합격 판정**:
- [ ] 3단계: 4개 입력
- [ ] 4단계: chName 4개 모두 유지 (빈 문자열 아님)

**실패 시 조치**: `240.page.settings.js`의 wsCh 기본값 fallback 및 `_wsChBaseline` 로직 확인.

---

### T-56. [NEW-U4] 문자열 "false" 방어

**목적**: `asBool()` 헬퍼 동작. 문자열 "false" 오판 방지.

**검증 절차**:
```bash
# 1. 문자열 "false"로 PATCH (서버는 bool 타입이므로 거부할 것)
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "hw":{"pir":{"enabled":"false"}}
}'

# 2. 이 시나리오는 서버 단 bool 강제 변환으로 방어되므로,
#    프론트엔드 방어는 다른 방식으로 검증:

# 3. 브라우저 Console에서 직접 asBool 확인 (개발 모드)
# 240.page.settings.js 내부 함수는 스코프 격리이므로,
# 실질 방어는 서버 응답의 bool 타입 보장 + UI의 명시 판정

# 4. 브라우저에서 pir.enabled 상태가 명확히 표시되는지 확인
# 서버: enabled=false (bool) → 체크박스 미체크
# 서버: enabled=true (bool) → 체크박스 체크
document.querySelector('#hw-pir-enabled').checked;
```

**합격 판정**:
- [ ] 서버 응답 bool 타입 유지 (문자열 저장 없음)
- [ ] 4단계: 서버 bool과 UI 체크박스 일치

**참고**: 이 항목은 방어적 코딩 검증으로, `asBool()` 헬퍼 자체는 코드 리뷰로 확인.

---

### T-57. [B-1] + [B-7] NVS flush — 단일 커밋 + 반환값 검사

**목적**: `nvs_commit` 1회화(B-1) + 실패 시 dirty 유지(B-7).

**검증 절차**:
```bash
# 1. 런타임 변경 → N10 dirty 표시
curl -X POST http://$IP/api/v001/control/override/fixed -d 'percent=50'

# 2. 시리얼 로그 타임스탬프 수집 (N10 flush 타이밍)
# - flush 시작 → 완료까지 시간 < 20ms

# 3. NVS 저장 확인 (재부팅 후 override 유지)
sleep 12  # N10 10초 게이트
curl -X POST http://$IP/api/v001/control/reboot
sleep 30
curl -s http://$IP/api/v001/metrics | jq .overrideActive
# 기대: true

# 4. 시리얼 로그 확인
grep "Runtime flushed (single commit)" serial.log
# 기대: 1건 이상

# 5. 이전 버그 로그 부재 확인
grep -c "Runtime flushed to NVS" serial.log
# 기대: 0 (이전 형식)

# 6. B-7 실패 시나리오 (선택): NVS 파티션 강제 쓰기 실패
# - 어려우므로 정적 코드 검사로 대체:
grep "v_setFail\|v_commitErr" src/v0202/N10_NvsManager_0202.cpp
# 기대: 반환값 검사 코드 존재
```

**합격 판정**:
- [ ] 3단계: 재부팅 후 override 유지
- [ ] 4단계: "single commit" 로그
- [ ] 5단계: 이전 로그 0건
- [ ] 6단계: 반환값 검사 존재

**실패 시 조치**: `N10_NvsManager_0202.cpp`의 `flush()` 함수에서 `nvs_open`/`nvs_set_*`/`nvs_commit` 반환값 체크 확인.

---

### T-58. [B-2] + [B-9] async_tcp root 스냅샷

**목적**: `getRootSnapshot()` 경유(B-2, B-9). torn read 방지.

**검증 절차**:
```bash
# 1. 정적 코드 검사 — 직접 접근 0건
grep -n "g_A20_config_root\." src/v0202/W10_Web_Routes_*_0202.cpp
# 기대: 0건

# 2. getRootSnapshot 사용 확인
grep -c "getRootSnapshot" src/v0202/W10_Web_Routes_Config_0202.cpp
grep -c "getRootSnapshot" src/v0202/W10_Web_Routes_CRUD_0202.cpp
grep -c "getRootSnapshot" src/v0202/W10_Web_WS_0202.cpp
# 기대: 각 1건 이상

# 3. 런타임 torn read 시나리오 (선택, 고급)
# - reload 발생 중 동시 GET 요청 → 8섹션 일관성
for i in {1..20}; do
  curl -X POST http://$IP/api/v001/reload &
  curl -s http://$IP/api/v001/config | jq '{system: (.system|type), wifi: (.wifi|type), schedules: (.schedules|type)}'
  wait
  sleep 0.1
done
# 기대: 모든 응답에 8섹션 모두 존재 (누락/torn 없음)

# 4. WindProfile GET 성능 (B-9)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{time_total}\n" http://$IP/api/v001/windProfile
done
# 기대: 모두 < 0.01s (이전: 0.05~0.1s)
```

**합격 판정**:
- [ ] 1단계: 0건
- [ ] 2단계: 각 파일에 최소 1회
- [ ] 3단계: 20회 모두 일관된 8섹션
- [ ] 4단계: 10회 평균 < 10ms

---

### T-59. [B-3] XSS — deviceName/SSID/hostname

**목적**: 사용자 제어 문자열 XSS(B-3) 방지.

**검증 절차**:
```bash
# 1. XSS payload를 deviceName에 저장
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "meta":{"deviceName":"<img src=x onerror=alert(1)>"}
}'

# 2. 브라우저 설정 페이지 진입
# http://$IP/#/settings
# DevTools Console에서 alert 미발생 확인

# 3. 네트워크 페이지 SSID XSS (오프라인 시뮬 또는 실제 AP 이름)
# 4. DOM 검사
document.querySelectorAll('img[src="x"]').length;
# 기대: 0
```

**합격 판정**:
- [ ] alert 미발생
- [ ] 4단계: 0

---

### T-60. [B-4] API Key clear flag (백엔드)

**목적**: 백엔드 `clearApiKey` 플래그 동작 (UI 없이 curl만).

**검증 절차**: T-54 참조 (3~5단계).

**합격 판정**:
- [ ] T-54 3~5단계 통과

---

### T-61. [B-5] Accept-Encoding q=0 파서

**목적**: RFC 7231 준수. `gzip;q=0` 거부, Vary 헤더.

**검증 절차**:
```bash
URL=http://$IP/html_v0202/P010_bundle_0202.js

# 1. q=0 (거부)
curl -I -H "Accept-Encoding: gzip;q=0" $URL | grep -i "content-encoding"
# 기대: (없음)

# 2. q=0.5 (수락)
curl -I -H "Accept-Encoding: gzip;q=0.5" $URL | grep -i "content-encoding"
# 기대: Content-Encoding: gzip

# 3. wildcard
curl -I -H "Accept-Encoding: *" $URL | grep -i "content-encoding"
# 기대: Content-Encoding: gzip

# 4. 명시 없음 (기본 1.0)
curl -I -H "Accept-Encoding: gzip" $URL | grep -i "content-encoding"
# 기대: Content-Encoding: gzip

# 5. Vary 헤더 (모든 응답)
curl -I -H "Accept-Encoding: gzip" $URL | grep -i "vary"
# 기대: Vary: Accept-Encoding

# 6. 여러 토큰
curl -I -H "Accept-Encoding: br, gzip;q=0.8, deflate" $URL | grep -i "content-encoding"
# 기대: Content-Encoding: gzip
```

**합격 판정**:
- [ ] 1단계: Content-Encoding 없음
- [ ] 2~4, 6단계: Content-Encoding: gzip
- [ ] 5단계: Vary: Accept-Encoding

**실패 시 조치**: `W10_Web_Static_0202.cpp`의 `W10_acceptsGzip()` 함수 확인.

---

### T-62. [B-6] routeMotion POST/PATCH 응답 동일

**목적**: POST/PATCH 공통 헬퍼(B-6). 응답 구조 동일.

**검증 절차**:
```bash
# 1. POST
curl -s -X POST http://$IP/api/v001/motion -H "X-API-Key: $KEY" -d '{
  "motion":{"sim":{"intensity":75}}
}' | jq 'keys'

# 2. PATCH
curl -s -X PATCH http://$IP/api/v001/motion -H "X-API-Key: $KEY" -d '{
  "motion":{"sim":{"intensity":76}}
}' | jq 'keys'

# 3. 에러 케이스 (인증 없이)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://$IP/api/v001/motion -d '{}'
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://$IP/api/v001/motion -d '{}'
# 기대: 둘 다 401 (또는 API Key 미설정 시 둘 다 400)
```

**합격 판정**:
- [ ] 1단계: ["updated"]
- [ ] 2단계: ["updated"] (동일)
- [ ] 3단계: 두 메서드 동일 코드

---

### T-63. [B-8] 로그 필터 — 레벨 셀 정확 매칭

**목적**: `textContent.includes()` 오매칭(B-8) 방지.

**검증 절차**:
```bash
# 1. 로그 페이지 진입
# http://$IP/#/logs

# 2. 특정 로그 주입 (본문에 "ERROR" 문자열 포함, 레벨은 INFO)
# - 서버 로그: [INF] "Test: error occurred" (본문에 ERROR 단어)
# 시리얼에서 유사 로그 확인 또는 수동 curl로 트리거

# 3. ERROR 필터 선택
document.querySelector('[data-slot="log-filter"]').value = '1';
document.querySelector('[data-slot="log-filter"]').dispatchEvent(new Event('change'));

# 4. INFO 레벨 로그 행이 숨겨졌는지 확인
// 본문에 "ERROR" 단어 있어도 레벨이 INFO면 숨겨져야 함
```

**합격 판정**:
- [ ] 본문에 "ERROR" 단어 포함된 INFO 로그가 ERROR 필터 시 숨김
- [ ] 실제 ERROR 레벨 로그만 표시

**실패 시 조치**: `130.ui.form.js`의 `logViewer.setFilter` 확인. `.snw-log-lv` 셀 비교 여부.

---

### T-64. [B-9] WindProfile GET 캐시 성능

**목적**: LittleFS 재로드(B-9) 제거. 응답시간 < 10ms.

**검증 절차**:
```bash
# 1. 10회 연속 GET 시간 측정
for i in {1..10}; do
  curl -s -o /dev/null -w "%{time_total}\n" http://$IP/api/v001/windProfile
done | awk '{sum+=$1; if($1>max)max=$1} END{print "avg:", sum/NR, "max:", max}'
# 기대: avg < 0.01, max < 0.02

# 2. 동시 요청 (race 방지 확인)
for i in {1..5}; do
  curl -s http://$IP/api/v001/windProfile &
done
wait
# 기대: 5건 모두 정상 JSON, 서로 일치
```

**합격 판정**:
- [ ] 1단계: avg < 10ms, max < 20ms
- [ ] 2단계: 5건 모두 동일 응답

---

### T-65. [B-11] Config 손상 부팅 복구

**목적**: config null 시 웹 UI 복구 경로(B-11) 확보.

**검증 절차**:
```bash
# 1. LittleFS에서 설정 파일 손상 시뮬레이션
# (파일 시스템 접근 필요 — mpremote 또는 ampy 사용)
# python -m ampy --port /dev/ttyUSB0 rm /json/cfg_system_0202.json
# python -m ampy --port /dev/ttyUSB0 rm /json/cfg_system_0202.json.bak

# 2. 재부팅
curl -X POST http://$IP/api/v001/control/reboot
sleep 30

# 3. 기기 생존 확인 (AP 방송 + 웹 접속)
curl -s -o /dev/null -w "%{http_code}\n" http://$IP/api/v001/version
# 기대: 200 (기기 살아있음)

# 4. in-memory 기본값 로그 확인
# 시리얼: [A00] In-memory system defaults applied.

# 5. 웹 UI로 복구 가능한지 확인
curl -X POST http://$IP/api/v001/config/init
# 기대: 200, {"factory": true}

# 6. Factory reset 후 재부팅 → 정상 동작
sleep 30
curl -s http://$IP/api/v001/system | jq '.meta.deviceName'
# 기대: "SmartNatureWind"
```

**합격 판정**:
- [ ] 3단계: 200 (이전 버그: 기기 먹통)
- [ ] 4단계: In-memory system defaults 로그
- [ ] 5단계: 200
- [ ] 6단계: 정상 복구

**실패 시 조치**: `A00_Main_0202.cpp`의 `if (!g_A20_config_root.system || !g_A20_config_root.wifi)` 블록 확인.

---

### T-66. [B-12] OTA 세션 중단 재시도

**목적**: OTA 세션 잔존(B-12) 방지. `Update.abort()` 후 재시도 정상화.

**검증 절차**:
```bash
# 1. OTA 시작 후 강제 중단 (큰 파일 3초 후 kill)
timeout 3 curl -X POST http://$IP/api/v001/fwUpdate -H "X-API-Key: $KEY" \
  -F "firmware=@large_firmware.bin" 2>/dev/null || true

# 2. 정상 OTA 재시도
curl -X POST http://$IP/api/v001/fwUpdate -H "X-API-Key: $KEY" \
  -F "firmware=@firmware.bin" | jq
# 기대: {"ota":"ok"}

# 3. 시리얼 로그
grep "aborting stale session" serial.log
# 기대: 1건 이상

# 4. write 실패 방어 (네트워크 끊김) — 선택
# - 서버는 p_len과 v_written 비교 후 abort
```

**합격 판정**:
- [ ] 2단계: {"ota":"ok"} (이전 버그: Update.begin() 실패)
- [ ] 3단계: aborting stale session 로그

**실패 시 조치**: `W10_Web_Upload_0202.cpp`의 `routeUpdate()` 청크 핸들러 `if (Update.isRunning()) Update.abort();` 확인.

---

### T-67. [B-13] LED pin 유효성 검증

**목적**: 음수 pin 크래시(B-13) 방지.

**검증 절차**:
```bash
# 1. 잘못된 LED pin 설정
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{
  "hw":{"led":{"pin":-1, "numPixels":0}}
}'

# 2. 재부팅
curl -X POST http://$IP/api/v001/control/reboot
sleep 30

# 3. 기기 생존 확인
curl -s -o /dev/null -w "%{http_code}\n" http://$IP/api/v001/version
# 기대: 200 (크래시 없음)

# 4. 시리얼 로그에서 WARN 확인
grep "Invalid LED pin" serial.log
grep "LED numPixels" serial.log
# 기대: 각각 1건 이상

# 5. 서버 값 확인 (설정은 그대로 유지 — 부팅 시 폴백만)
curl -s http://$IP/api/v001/system | jq '.system.hw.led.pin'
# 기대: -1 (설정값은 그대로, 부팅 시에만 48로 폴백)
```

**합격 판정**:
- [ ] 3단계: 200 (크래시 없음)
- [ ] 4단계: WARN 로그 존재
- [ ] 5단계: 원본 설정 유지 (사용자 통지)


---

## 3.3 Batch I — 바람 물리 Override 및 UI 고도화 회귀 (T-70 ~ T-72)

### T-70. [OVR-1] 세그먼트 물리 파라미터 절대값 직접 지정 (Override) 검증

**목적**: 기존 상대적 adjust Delta 완전 폐기 및 0~100% 절대값 직접 지정(`override.enabled`, `windIntensity`, `windVariability`, `gustFrequency`) 동작 검증.

**검증 절차**:
```bash
# 1. override 활성화 세그먼트 생성 (windIntensity 80.0, windVariability 50.0, gustFrequency 30.0)
curl -X POST http://$IP/api/v001/schedules -H "X-API-Key: $KEY" -d '{
  "schedules": [{
    "id": "sch_test_ovr",
    "name": "OVR Test",
    "enabled": true,
    "segments": [{
      "order": 1,
      "name": "OVR Seg",
      "presetCode": "OCEAN",
      "style": "BALANCE",
      "startTime": "00:00",
      "duration": 60,
      "speed": 100,
      "override": {
        "enabled": true,
        "windIntensity": 80.0,
        "windVariability": 50.0,
        "gustFrequency": 30.0
      }
    }]
  }]
}'

# 2. C++ WindSolver 파라미터 확인 (시뮬레이터 상태 조회)
curl -s http://$IP/api/v001/control/status | jq '.windParams'
# 기대: base preset 값 대신 intensity 80, variability 50, gust 30 절대값 적용

# 3. override 비활성화(enabled: false) 시 preset 기본값 복귀 검증
curl -X PATCH http://$IP/api/v001/schedules/sch_test_ovr -H "X-API-Key: $KEY" -d '{
  "segments": [{
    "order": 1,
    "override": {
      "enabled": false,
      "windIntensity": -1.0,
      "windVariability": -1.0,
      "gustFrequency": -1.0
    }
  }]
}'
curl -s http://$IP/api/v001/control/status | jq '.windParams'
# 기대: OCEAN preset 기본 파라미터로 자동 환원
```

**합격 판정**:
- [ ] `override.enabled == true` 시 지정된 절대값(0~100)으로 시뮬레이션 파라미터 즉시 치환
- [ ] `override.enabled == false` 시 Preset/Style 기본 파라미터로 동작
- [ ] 구형 adjust Delta 잔존 참조 0건

---

### T-71. [OVR-2] 대시보드 3대 물리 슬라이더 및 SLEEP 모드 실시간 제어 검증

**목적**: 대시보드 세기/변동성/돌풍 슬라이더 조작 시 100ms 디바운스 `/api/v001/control/override` 통신 및 SLEEP 모드 토글 검증.

**검증 절차**:
```bash
# 1. 브라우저에서 Dashboard 접속 (#dashboard)
# 2. '물리 바람 파라미터 오버라이드' 섹션 확인 (세기, 변동성, 돌풍 슬라이더 3종)
# 3. 풍속 세기 슬라이더 75%로 조작
# DevTools Network 탭 확인:
# POST /api/v001/control/override
# Payload: {"windIntensity": 75} (100ms 디바운스 적용)

# 4. 정량적 체감 가이드 텍스트 확인
# 기대: "75%: 강한 바람 (약 4.2 m/s, 나무 잔가지 흔들림, 시원하고 뚜렷한 냉감)" 즉시 렌더링

# 5. 수면풍(SLEEP) 버튼 클릭
# 기대: wind style SLEEP 활성화, 버튼 하이라이트 표시
```

**합격 판정**:
- [ ] 슬라이더 조작 시 100ms 디바운스 후 단 1회 POST 호출
- [ ] 수치 변경 시 정량 피드백 가이드 텍스트가 지연 없이 반응
- [ ] SLEEP 모드 토글 및 WebSocket 브로드캐스트 정합성 확인

---

### T-72. [OVR-3/OVR-4] 세그먼트 순서 이동(▲/▼) 및 다국어 지원 검증

**목적**: 세그먼트 순서 이동(▲/▼) 시 `order` 재인덱싱 및 완전 한/영 다국어 지원 검증.

**검증 절차**:
```bash
# 1. 스케줄 또는 프로파일 편집 모달 오픈 (#schedule 또는 #profiles)
# 2. 세그먼트 2개 이상 등록 후 두 번째 세그먼트의 '▲' 버튼 클릭
# 기대: 배열 순서 변경 및 각 세그먼트의 'order' 번호가 1, 2 순서대로 자동 재배열
# 3. 첫 번째 세그먼트의 '▲' 비활성화(disabled), 마지막 세그먼트의 '▼' 비활성화 확인

# 4. 언어 토글 (우측 상단 KO / EN 버튼)
# 기대:
# - 프리셋 드롭다운: 'OCEAN (바다 바람)' <-> 'OCEAN (Ocean Breeze)'
# - 스타일 드롭다운: 'BALANCE (균형)' <-> 'BALANCE (Balanced)'
# - 물리 수치 피드백 가이드 문구 즉각 언어 전환 확인
```

**합격 판정**:
- [ ] 세그먼트 순서 변경 시 order 필드가 1부터 순차적으로 정합성 유지
- [ ] 언어 변경 시 화면 새로고침 없이 프리셋 명칭 및 피드백 문구 즉시 번역

---

### T-73. [OFFLINE-1~3] 웹 오프라인 어댑터 및 한/영 다국어 연동 검증

**목적**: 브라우저 로컬/오프라인 모드(`SNW_OFFLINE=true`)에서 10개 프리셋/5개 스타일 Mock 데이터 정합성, `/control/override` 인터셉트, 스케줄/프로필 한/영 병기 표기, 언어 토글 시 실시간 동적 번역 무결성 검증.

**검증 절차**:
```bash
# 1. 오프라인 모드로 브라우저 실행 (file:// 또는 로컬 서버 index.html)
# 콘솔 확인: [Loader] SNW_OFFLINE = true, [Offline] 준비 완료

# 2. Mock 프리셋 및 스타일 factors 정합성 확인
# Console:
const dict = await SNW.Api.listWindProfiles();
console.log(dict.windDict.presets.length); // 기대: 10
console.log(dict.windDict.styles.length);  // 기대: 5 (SLEEP 포함)

# 3. 오프라인 슬라이더 조작 및 시뮬레이터 물리 반응 확인
# 대시보드에서 강도(Intensity) 슬라이더 80% 변경
# 기대: runtime.sim.intensity == 80 반영 및 시뮬레이터 targetWind / windSpeed 동적 상향

# 4. 언어 토글 (KO ↔ EN)
# 우측 상단 언어 토글 버튼 클릭
# 기대:
# - 대시보드 상태/사유/프리셋 즉시 번역
# - 스케줄 목록: '아침 바람 (Morning Breeze)' 병기 확인
# - 프로필 목록: '수면 모드 (Sleep Care)' 병기 확인
# - 바람 프리셋 관리 화면 (#windprofile): '해변 바람 (OCEAN)' ↔ 'Ocean Breeze (OCEAN)' 실시간 번역
```

**합격 판정**:
- [ ] 오프라인 모드에서 10개 프리셋 및 5개 스타일 factors 온전 제공
- [ ] `/control/override` 인터셉트 및 슬라이더 조작에 따른 풍속 시뮬레이터 정상 반응
- [ ] 언어 전환 시 스케줄/프로필 한/영 병기 확인 및 프리셋 목록 실시간 번역 동작

---

## 4. 프론트엔드 v0202 SPA

### T-29. 초기 로드 — SPA Shell 3자산

**목적**: SPA Shell이 HTML+CSS+JS 3자산만 로드 검증.

**검증 절차**:
```bash
# 1. 브라우저 접속
# http://$IP/

# 2. DevTools Network 탭 확인
# - HTML: 1건 (index.html)
# - CSS: 1건 (P000_common_0202.css)
# - JS: 1건 (P010_bundle_0202.js)
# - WS: 4~5건

# 3. HTTP 총 요청 수
# 기대: JS/CSS/HTML = 3건 (WS 제외)
```

**합격 판정**:
- [ ] 초기 HTTP 요청 3건 (자산)
- [ ] WS 4채널 (L1~L2)
- [ ] 총 세션 HTTP < 10건

---

### T-30. 해시 라우팅 — 12페이지 마운트

**목적**: 12개 해시 라우트 모두 정상 마운트.

**검증 절차**:
브라우저 접속 후 URL 입력:

| # | URL | 페이지 | 마운트 |
|:---:|---|---|:---:|
| 1 | `#/dashboard` | 대시보드 | ⬜ |
| 2 | `#/chart` | 차트 | ⬜ |
| 3 | `#/schedule` | 스케줄 | ⬜ |
| 4 | `#/profiles` | 프로필 | ⬜ |
| 5 | `#/sensors` | 센서 | ⬜ |
| 6 | `#/settings` | 설정 | ⬜ |
| 7 | `#/network` | 네트워크 | ⬜ |
| 8 | `#/logs` | 로그 | ⬜ |
| 9 | `#/diagnostics` | 진단 | ⬜ |
| 10 | `#/firmware` | 펌웨어 | ⬜ |
| 11 | `#/ai` | AI | ⬜ |
| 12 | `#/info` | 정보 | ⬜ |

**추가 확인**: 각 해시 이동 시 Network 탭 **JS/CSS 재요청 0건** (캐시).

**합격 판정**:
- [ ] 12/12 페이지 마운트
- [ ] 이동 시 HTTP 0건 (캐시)

---

### T-31. 레벨 접근 제어 — L1~L4

**검증 절차**:
```javascript
// 브라우저 콘솔

// L1: Dashboard, Info만
localStorage.setItem('snw.level', 'L1');
location.reload();
// 확인: 사이드바 Dashboard, Info만 표시

// L1에서 #/settings 직접 접근 → 경고 + Dashboard 리다이렉트
location.hash = '/settings';

// L2: +Chart/Schedule/Profiles/Sensors
localStorage.setItem('snw.level', 'L2');
location.reload();

// L3: +Settings/Network/Logs
localStorage.setItem('snw.level', 'L3');
location.reload();

// L4: 12 페이지 전체
localStorage.setItem('snw.level', 'L4');
location.reload();
```

**합격 판정**:
- [ ] L1: 2페이지 노출
- [ ] L2: 6페이지 노출
- [ ] L3: 9페이지 노출
- [ ] L4: 12페이지 노출
- [ ] L1에서 `/settings` 접근 시 경고 + 리다이렉트

---

### T-32. 언어 토글 — ko/en

**검증 절차**:
```javascript
// 헤더 🌐 버튼 클릭
// 한국어 → English → 한국어

// 확인:
document.querySelector('[data-i18n="nav.dashboard"]').textContent
// 한국어: '대시보드' / English: 'Dashboard'

document.querySelector('[data-i18n="dashboard.powerTitle"]').textContent
// 한국어: '전원 제어' / English: 'Power'
```

**합격 판정**:
- [ ] 언어 토글 시 nav/헤더/카드 텍스트 전환
- [ ] localStorage `snw.lang` 저장
- [ ] 새로고침 후 언어 유지

---

### T-33. 대시보드 핵심 동작

**검증 절차**:
1. 전원 토글 → `POST /control/override/fixed?forever=true`
2. 프리셋 카드 클릭 → `POST /simulation {presetCode}`
3. 강도 슬라이더 드래그 → 300ms 후 `POST /simulation {intensity}`
4. 센서 카드 → 온도/습도/PIR 실시간 (WS 800ms)

**합격 판정**:
- [ ] 전원 On/Off 시 배지 ✋/⏸ 전환
- [ ] 프리셋 클릭 시 강조 + WS 상태 반영
- [ ] 슬라이더 변경이 PWM 갱신
- [ ] 센서 3카드 실시간

---

### T-34. 설정 Save→Reload 순서

**검증 절차**:
1. `#/settings` 페이지 → 로그 레벨 DEBUG로 변경
2. Save 버튼 → patch → save → reload 순서 확인 (DevTools Network)
3. `pendingReload` 폴링 → `lastReloadOk: true`

**합격 판정**:
- [ ] `POST /system` → `POST /config/save` → `POST /reload` 순서
- [ ] 3~5초 내 reload 완료
- [ ] 성공 토스트 표시

---

### T-35. WS 5채널 + 자동 재연결

**검증 절차**:
1. 브라우저 DevTools Network → WS 탭
2. 5채널 구독 확인: `/ws/state`, `/ws/metrics`, `/ws/chart`, `/ws/summary`, `/ws/log`
3. **Wi-Fi 끊김 시뮬레이션** (라우터 재시작)
4. exponential backoff 관찰 (1s → 2s → 4s → 8s → 16s → 30s)
5. 3회 실패 시 REST 폴링 (2초) 자동 전환
6. Wi-Fi 복구 시 WS 재연결

**합격 판정**:
- [ ] 5채널 정상 구독
- [ ] 끊김 시 exponential backoff
- [ ] 3회 실패 → REST 폴링
- [ ] 복구 시 WS 재연결

---

## 5. 정적 감사

### T-36. 계약 문서 gate (CI)

**검증 절차**:
```bash
python3 src/v0202/tools_0202/commit_contracts_0202.py --dry-run --strict
```

**합격 판정**:
- [ ] exit 0
- [ ] 7문서 존재

---

### T-37. 잔존 참조 grep

**검증 절차**:
```bash
# (1) v0202 잔존
grep -rn "_0202\." src/v0202/*.h src/v0202/*.cpp | grep -v "\.md\|data_v0202\|data_src_v0202"
# 기대: 0건

# (2) A-2 캡슐화 위반
grep -rn "s_control->sim\.\|s_control->motion->" src/v0202/*.cpp
# 기대: 0건

# (3) B-2 화이트리스트 위반
grep -rn "g_A20_config_root\." src/v0202/W10_Web_Routes_*_0202.cpp | grep -v "getRootSnapshot"
# 기대: 0건
```

**합격 판정**:
- [ ] (1) 0건
- [ ] (2) 0건
- [ ] (3) 0건

---

### T-38. F-10 매크로 승격

**검증 절차**:
```bash
grep -rn "define G_C10_SCH_ID_START\|define G_C10_PROFILE_ID_START" \
  src/v0202/*_Util_0202.cpp
# 기대: 0건

grep -c "G_C10_SCH_ID_START" src/v0202/C10_Config_Sch_Internal_0202.h
# 기대: 1건
```

**합격 판정**:
- [ ] 파일 스코프 정의 0건
- [ ] Internal 헤더 정의 확인

---

### T-39. F-4 Logger 초기 INFO

**검증 절차**:
```bash
grep -n "setLevel(EN_L10_LOG_DEBUG)" src/v0202/main.cpp
# 기대: 0건

grep -n "setLevel(EN_L10_LOG_INFO)" src/v0202/main.cpp
# 기대: 1건
```

**합격 판정**:
- [ ] DEBUG 0건
- [ ] INFO 1건

---

### T-40. 프론트엔드 하드코딩 감사

**검증 절차**:
```bash
# (1) 하드코딩 API 경로
grep -rn "fetch('/api/" src/v0202/data_v0202_src/html_v0202/*.js
# 기대: 0건

# (2) 하드코딩 LS 키
grep -rn "localStorage.getItem('snw\." src/v0202/data_v0202_src/html_v0202/*.js | \
  grep -v "010.config.js"
# 기대: 0건

# (3) 하드코딩 상태 코드
grep -rnE "stateCode *=== *[0-9]" src/v0202/data_v0202_src/html_v0202/*.js | \
  grep -v "000.const"
# 기대: 0건
```

**합격 판정**:
- [ ] (1)(2)(3) 모두 0건

---

## 6. 부하/안정성

### T-41. Heap 안정성 (5분)

**검증 절차**:
```bash
for i in {1..300}; do
  curl -s http://$IP/api/v001/diag | jq -c '{ts: now, heap: .heap}'
  sleep 1
done > heap_5min.jsonl

jq -s 'map(.heap) | {min:min, max:max, first:.[0], last:.[-1]}' heap_5min.jsonl
```

**합격 판정**:
- [ ] `min > 100000`
- [ ] `last - first > -5000`

---

### T-42. 24시간 장기 안정성

**검증 절차**:
```bash
# 1시간마다 heap + SNTP 상태 + WS 카운트
for h in {1..24}; do
  curl -s http://$IP/api/v001/diag | jq -c '{h:'$h', heap:.heap, fs:.fs_used}'
  curl -s http://$IP/api/v001/state | jq -c '{h:'$h', timeValid:.control.time.valid}'
  sleep 3600
done
```

**합격 판정**:
- [ ] heap 최소값 하락 없음 (±10KB)
- [ ] SNTP timeValid 24h 유지
- [ ] 재부팅 없이 유지

---

### T-43. OTA 업데이트

**검증 절차**:
```bash
# 브라우저 #/firmware → OTA 파일 선택 → 업로드
# 또는
curl -X POST http://$IP/api/v001/fwUpdate -F "firmware=@firmware.bin"
```

**합격 판정**:
- [ ] 업로드 진행률 표시
- [ ] 자동 재부팅
- [ ] 재부팅 후 버전 유지

---

### T-44. Factory reset 반복 3회

**검증 절차**:
```bash
for i in 1 2 3; do
  curl -X POST http://$IP/api/v001/control/override/fixed?percent=50
  sleep 1
  curl -X POST http://$IP/api/v001/control/factoryReset
  sleep 30
  curl -s http://$IP/api/v001/metrics | jq .overrideActive
  # 기대: false
done
```

**합격 판정**:
- [ ] 3회 모두 `overrideActive: false`
- [ ] 재부팅 후 정상 부팅

---

### T-45. 브라우저 크로스 확인

**검증 절차**:
- Chrome (최신): ⬜
- Edge (최신): ⬜
- Safari (macOS/iOS): ⬜
- Firefox (최신): ⬜

각 브라우저에서 T-29~T-35 실행.

**합격 판정**:
- [ ] 4/4 브라우저 정상

---

## 7. 회귀 매트릭스 요약

| 그룹 | 테스트 | 소요 | 필수 |
|---|---|:---:|:---:|
| L1 백엔드 기존 | T-1 ~ T-13 (13건) | 60분 | T-1, T-3, T-5, T-10, T-16 필수, 나머지 권장 |
| L2 백엔드 신규 | T-14 ~ T-28 (15건) | 60분 | T-14, T-16, T-27 필수 |
| L3 프론트엔드 | T-29 ~ T-35 (7건) | 30분 | **7/7 필수** |
| L4 정적 감사 | T-36 ~ T-40 (5건) | 10분 | **5/5 필수 (CI 자동)** |
| L5 부하/안정성 | T-41 ~ T-45 (5건) | 24h+ | 릴리스 후 병행 |
| **L6 Batch G P0** | **T-46 ~ T-50 (5건)** | **40분** | **5/5 필수** |
| **L6 Batch G P1** | **T-51 ~ T-67 (17건)** | **120분** | **8건 필수** (T-51, T-52, T-53, T-54, T-57, T-58, T-61, T-65) |
| **L7 Batch I OVR** | **T-70 ~ T-72 (3건)** | **30분** | **3/3 필수** (T-70, T-71, T-72) |

### 릴리스 차단 필수 세트 (최소 29건)

| # | 테스트 | 그룹 | Batch |
|:---:|---|---|:---:|
| 1 | T-1 (M10 tick) | L1 | A |
| 2 | T-3 (Reload 위임) | L1 | F-05 |
| 3 | T-5 (Motion 위임) | L1 | F-06 |
| 4 | T-10 (lastReloadOk) | L1 | N-1 |
| 5 | T-14 (FIXED self-heal) | L2 | A-1 |
| 6 | T-16 (버전 SSOT) | L2 | B-1 |
| 7 | T-27 (NVS reset) | L2 | F-1 |
| 8 | T-29 (SPA 3자산) | L3 | - |
| 9 | T-30 (12 페이지) | L3 | - |
| 10 | T-31 (4 레벨) | L3 | - |
| 11 | T-32 (언어 토글) | L3 | - |
| 12 | T-36 (계약 문서) | L4 | - |
| 13 | T-40 (프론트 하드코딩) | L4 | - |
| **14** | **T-46 (C-1 USB 부팅)** | **L6** | **C-1** |
| **15** | **T-47 (C-2 프리셋 그리드)** | **L6** | **C-2** |
| **16** | **T-48 (C-3 holdSec 정확)** | **L6** | **C-3** |
| **17** | **T-49 (C-4 업로드 핸들)** | **L6** | **C-4** |
| **18** | **T-50 (C-5 라우터 재진입)** | **L6** | **C-5** |
| **19** | **T-51 (NEW-C1 0값 보존)** | **L6** | **NEW-C1** |
| **20** | **T-52 (NEW-C2 dht.type XSS)** | **L6** | **NEW-C2** |
| **21** | **T-53 (NEW-U1 API Key 노출)** | **L6** | **NEW-U1** |
| **22** | **T-54 (B-4 clearApiKey)** | **L6** | **B-4/NEW-U2** |
| **23** | **T-57 (B-1 NVS 단일 커밋)** | **L6** | **B-1/B-7** |
| **24** | **T-58 (B-2 root 스냅샷)** | **L6** | **B-2/B-9** |
| **25** | **T-61 (B-5 q=0)** | **L6** | **B-5** |
| **26** | **T-65 (B-11 config 복구)** | **L6** | **B-11** |
| **27** | **T-70 (OVR-1 세그먼트 물리 Override)** | **L7** | **OVR-1** |
| **28** | **T-71 (OVR-2 대시보드 3슬라이더/SLEEP)** | **L7** | **OVR-2** |
| **29** | **T-72 (OVR-3/4 순서이동/다국어)** | **L7** | **OVR-3/4** |

---

## 8. 장애 진단 및 트러블슈팅

| 실패 증상 | 원인 후보 | 해결 |
|---|---|---|
| T-1 `motionActive` 영구 true | `A00_run` 내 `g_M10_motionLogic->tick()` 누락 | F-03 확인 |
| T-2 `lastUserProfileNo=-1` 초기값 | `N10::tick()` 누락 | F-04 확인 |
| T-3 응답 > 500ms | `routeReload` 동기 `reloadAll` | `requestReload()` 위임 확인 |
| T-4 둘 다 202 | `requestReload` CAS 미사용 | atomic CAS 확인 |
| T-5 > 100ms | `s_control->sim` 직접 호출 | A-2 위임 확인 |
| T-14 로그 폭주 | `mode==PRESET` 조건 누락 | A-1 확인 |
| T-16 버전 불일치 | `FW_Ver_1.0.0` 잔재 | B-1 확인 |
| T-27 override 유지 | `N10::resetRuntime` 누락 | F-1 확인 |
| T-29 초기 로드 > 3건 | 번들 미적용 / 캐시 미스 | `pio run --target uploadfs` 재실행 |
| T-30 특정 페이지 빈 화면 | `SNW.Page.*` 미정의 | 999.app.js PAGE_INIT 확인 |
| T-31 L1에서 settings 접근 | `LevelUtil.atLeast` 미호출 | Router.dispatch 내 레벨 검사 |
| T-32 언어 토글 무반응 | `data-i18n` 미부여 | 템플릿 확인 |
| T-33 전원 토글 실패 | API 경로 오류 | `SNW.Api.overrideFixed` 확인 |
| T-34 save/reload 순서 뒤바뀜 | `_onSave` 구현 오류 | Settings 페이지 확인 |
| T-35 WS 재연결 폭주 | backoff 상한 30초 미적용 | `CFG.WS_RECONNECT.BACKOFF_MS` 확인 |
| T-36 계약 문서 gate 실패 | 7문서 누락 / UI_TERMINOLOGY | 파일 저장 확인 |
| T-40 하드코딩 발견 | `fetch('/api/` 직접 호출 | `SNW.Api` 경유로 교체 |
| 404 `/html_v0202/*` | W10 경로 라우트 미확장 | `W10_registerGzipServe()` 수정 |
| CSS/JS 404 | staging 경로 불일치 | `pio_gzip_0202.py` 재확인 |
| **T-46 부팅 정지 (USB 미연결)** | **`while(!Serial)` 무한 루프** | **`main.cpp` 타임아웃 조건 확인** |
| **T-47 프리셋 그리드 비어있음** | **`_applyPresetList` mount 순서** | **`_mountComponents` 선행 확인** |
| **T-48 holdSec 2배** | **`isActive` lastChange 재계산** | **`_state.pirActive` 단일 판정** |
| **T-49 업로드 실패 (재시도)** | **stale handle 잔존** | **`if (s_upFile)` 즉시 close** |
| **T-50 watcher 누수** | **`_dispatching` 가드 미작동** | **router `finally` 블록 확인** |
| **T-51 pin/brightness 0 손실** | **`\|\|` 폴백** | **`nz()` 헬퍼 적용** |
| **T-52 dht.type XSS** | **미이스케이프 렌더** | **`esc()` 래핑 확인** |
| **T-53 API Key 노출** | **`value="..."` 프리필** | **placeholder 패턴 확인** |
| **T-54 키 삭제 실패** | **빈 문자열 무시** | **`clearApiKey` 플래그 확인** |
| **T-55 WS 채널 미표시** | **빈 배열 미복구** | **baseline fallback 확인** |
| **T-57 NVS flush 100ms** | **개별 put\*** | **`nvs_commit` 1회화** |
| **T-58 torn read** | **root 직접 참조** | **`getRootSnapshot` 경유** |
| **T-61 gzip;q=0 미준수** | **`indexOf("gzip")`** | **`W10_acceptsGzip()` 파서** |
| **T-65 config 손상 먹통** | **`return` 조기 종료** | **in-memory defaults + Recovery AP** |
| **T-66 OTA 재시도 실패** | **stale Update 세션** | **`Update.abort()` 확인** |
| **T-67 LED pin 크래시** | **uint8 암묵 캐스팅** | **유효 범위 검증 (0~48)** |
| **T-68 모달 스크롤/세그먼트 겹침** | **인라인 스타일 충돌** | **Flexbox 레이아웃 + 2열 그리드 + Undo 복원 검증** |
| **T-69 로컬 오프라인 통신 실패** | **스크립트 순서/레이스** | **선행 감지(document.write) + `SNW.Offline.ready` 대기 가드** |
| **T-70 Override 물리 미반영** | **`override.enabled` false 판정** | **`S20_resolveWindParams` 우선 치환 분기 확인** |
| **T-71 슬라이더 렉/네트워크 폭주** | **debounce 미적용** | **100ms 디바운스 타이머 로직 확인** |
| **T-72 세그먼트 order 불일치** | **삭제/이동 후 재인덱싱 누락** | **`_reindexSegments` 자동 호출 확인** |
| **T-73 오프라인 다국어 미반영** | **`preset.<CODE>` 키 미조회 / 병기 누락** | **`300.page.windprofile.js` i18n 래핑 및 `998.offline_0202.js` 병기 명칭 확인** |

---

## 9. Phase 7 릴리스 게이트

### 9.1 게이트 체크리스트

| Gate | 조건 | 판정 |
|:---:|---|:---:|
| **G-7.0** | JSON + W10 경로 확장 + buildfs/upload/uploadfs 성공 | ⬜ |
| **G-7.1** | 정적 감사 5건 통과 (T-36~T-40) | ⬜ |
| **G-7.2** | 백엔드 필수 회귀 6/6 (T-1, T-3, T-5, T-14, T-16, T-27) | ⬜ |
| **G-7.3** | 프론트엔드 필수 7/7 (T-29~T-35) | ⬜ |
| **G-7.4** | 부하 안정성 (T-41 heap 5분) | ⬜ |
| **G-7.5** | CI 재실행 그린 | ⬜ |
| **G-7.6** | 릴리스 태그 push | ⬜ |
| **G-8.1** | **Batch G P0 필수 5/5 (T-46~T-50)** | ⬜ |
| **G-8.2** | **Batch G P1 필수 8/8 (T-51, T-52, T-53, T-54, T-57, T-58, T-61, T-65)** | ⬜ |
| **G-8.3** | **정적 회귀 grep: B-2 위반 0건 / A-2 위반 0건 / 하드코딩 0건** | ⬜ |
| **G-9.1** | **Batch I Override 물리 필수 3/3 (T-70, T-71, T-72)** | ⬜ |
| **G-9.2** | **웹 오프라인 및 다국어 검증 (T-73)** | ⬜ |

### 9.2 릴리스 승인 조건

**모든 게이트 (G-7.0 ~ G-9.1) 통과 시 → 릴리스 승인**.

**미통과 시**:
- 각 게이트 재실행
- 실패 원인 분석 (트러블슈팅 매트릭스 참조)
- 수정 후 재검증

### 9.3 릴리스 태그

```bash
git tag -a v0202-release-2026-10-26 -m "v0202 Release (Batch G 완료)

## 백엔드
- Batch A~F 리팩토링 (2026-10-20)
- Batch G 코드 재검토 P0/P1 (2026-10-26)
  · P0: C-1~C-5 (부팅/라우터/업로드/holdSec/프리셋)
  · P1: B-1~B-13, NEW-C1~U4 (27건)
- RAM/Flash 실측 유지: 110,100 B / 1,532,741 B

## 프론트엔드
- SPA 3자산 (gz 46KB)
- 12 페이지 해시 라우팅, L1~L4 레벨

## 검증
- 필수 회귀 26건 (기존 13 + Batch G 13)
- 확장 회귀 22건 + Batch G P1 9건

## CI
- 계약 문서 v2.4 gate 통과"

git push origin v0202-release-2026-10-26
```

---

## 10. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| **2026-10-28** | **v2.8** | **웹 오프라인 어댑터 및 한/영 다국어 연동 검증 반영**: §3.3 T-73 (1건) 신규, §8 트러블슈팅 매트릭스 T-73 추가, §9.1 G-9.2 릴리스 게이트 추가 | Antigravity AI |
| 2026-10-28 | v2.7 | **Batch I 바람 물리 파라미터 직접 지정 (Override) 모델 및 UI 고도화 반영**: §3.3 T-70~T-72 (3건) 신규, §1.1 L7 계층 추가, §7 회귀 매트릭스 확장(필수 26→29건), §8 트러블슈팅 매트릭스 T-70~T-72 추가, §9.1 G-9.1 릴리스 게이트 추가 | Antigravity AI |
| 2026-10-27 | v2.6 | **Batch H 웹 UI/오프라인 로더 반영**: §8 트러블슈팅 매트릭스 T-68(모달/세그먼트 2열 그리드 및 Undo 복원 검증), T-69(로컬 오프라인 감지 및 동기 로드 가드 검증) 신규 추가 | Antigravity AI |
| 2026-10-26 | v2.5 | **Batch G 코드 재검토 반영**: §3.1 T-46~T-50 (C-1~C-5 P0 5건) 신규, §3.2 T-51~T-67 (B-1~B-13, NEW-C1~U4 P1 17건) 신규. §1.1 L6 계층 추가. T-1/T-3/T-9 판정 기준 보강(C-3/B-1/B-5 영향). §7 매트릭스 확장(필수 13→26건). §8 트러블슈팅 16건 추가. §9 G-8 게이트 신규 | Antigravity AI |
| 2026-10-21 | v2.4 | `cfg_motion_0202.json`, `P010_*_0202.*` 자산명, 리다이렉트 기대값 일괄 현행화 | Antigravity AI |
| 2026-10-21 | v2.3 | 프론트엔드 v0202 SPA 통합: T-29~T-35 (7건) 신규, T-36~T-40 정적 감사 확장, T-41~T-45 부하/안정성 신규, §7 매트릭스 재구성 (L1~L5 계층), §8 트러블슈팅 SPA 항목 추가, §9 Phase 7 릴리스 게이트 신규 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: T-14~T-28 신규 15건 추가, §D 트러블슈팅 확장, §C 매트릭스 재정렬 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1 (T-10), G-1 (T-11), G-2/G-4 (T-12), N-3 (T-13) 신규 | Antigravity AI |
| 2026-10-19 | v2.0 | v0202 승격 | Antigravity AI |
| 2026-10-19 | v1.2 | T-9 (번들/Gzip 무결성) | Antigravity AI |
| 2026-10-19 | v1.1 | curl/jq 표준화, 소스 파일명 갱신 | Antigravity AI |
| (초기) | v1.0 | T-1~T-8 | 개발팀 |


### T-90 ~ T-115 신규 통합 검증 항목 (v3.2)
- **T-90**: 대시보드 50조합(10 프리셋 × 5 스타일) 정밀 계산 검증 (50/50 PASS).
- **T-91**: 차트 버퍼 덮어쓰기 방지 및 실시간 append 검증.
- **T-92**: 프리셋 아이콘 10종 1:1 매칭 검증.
- **T-100**: 가상 미리보기 300점 파형 및 정성 감성 지표 4종 검증.
- **T-101**: 실시간 차트 실제/예상 탭 및 안내 배너 동작 검증.
- **T-102**: 모니터링 Warm 링버퍼 및 다운샘플링 쿼리(5m/30m/1h) 검증.
- **T-103**: 지난 이벤트 7일 통합 조회 검증.
- **T-104**: 실시간 wind CSV 및 7일 전체 CSV 내보내기 검증.
- **T-105**: LittleFS 5개 바이너리 파일 헤더 및 Pre-allocation 무결성 검증.
- **T-110**: 시뮬레이션 페이지 바람 체험실 렌더링 검증.
- **T-111**: 실시간 차트 예상 파형 오버레이(점선) 검증.
- **T-112**: 맛보기 투어 5개 프리셋 자동 시연 및 중단 검증.
- **T-113**: 수면 모드 원클릭(120분 타이머) 검증.
- **T-114**: 첫 방문 온보딩 팝업 검증.
- **T-115**: 야간 시간대 감광 및 소음 알림 검증.
