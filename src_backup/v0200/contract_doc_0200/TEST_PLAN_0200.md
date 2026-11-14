# TEST_PLAN_0200.md — 회귀 테스트 절차서 (v2.3)

> **검증 대상**: Smart Nature Wind v0200 펌웨어 + v0201 SPA 프론트엔드  
> **기준선**: Batch A~F 백엔드 리팩토링 + Phase 0~7 프론트엔드 재설계 완료  
> **검증 환경**: ESP32-S3-N16R8, LittleFS 업로드 완료, 권장 로그 `EN_L10_LOG_DEBUG`  
> **파일명 정책**: 계약 문서 `_0200.md` 유지, 코드 참조 `_0201` 접미사

---

## 📋 목차

1. [검증 개요 및 준비](#1-검증-개요-및-준비)
2. [백엔드 기존 회귀 (T-1 ~ T-13)](#2-백엔드-기존-회귀)
3. [백엔드 Batch A~F 신규 (T-14 ~ T-28)](#3-백엔드-batch-af-신규)
4. [프론트엔드 v0201 SPA (T-29 ~ T-35)](#4-프론트엔드-v0201-spa)
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
L1 필수 회귀 (6건)  ─── 릴리스 차단 조건
    T-1, T-3, T-5, T-14, T-16, T-27

L2 필수 프론트엔드 (7건) ─── 릴리스 차단 조건
    T-29, T-30, T-31, T-32, T-33, T-34, T-35

L3 정적 감사 (5건) ─── CI 자동 + 수동 grep
    T-36 ~ T-40

L4 확장 회귀 (22건) ─── 릴리스 후 병행 권장
    T-2, T-4, T-6~T-13, T-15, T-17~T-26, T-28

L5 부하/안정성 (5건) ─── 양산 승인 조건
    T-41 ~ T-45
```

### 1.2 검증 환경

| 항목 | 값 |
|---|---|
| MCU | ESP32-S3-N16R8 (16MB Flash, 8MB PSRAM) |
| 펌웨어 | `FW_Ver_2.0.0` (v0201 코드 접미사) |
| 프론트엔드 | SPA 3자산 (HTML+CSS+JS, gz 46KB) |
| 계약 문서 | v2.2 (2026-10-20) |
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
- `cfg_motion_0201.json` → `motion.pir.enabled = true`, `motion.pir.holdSec = 10`

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
- [ ] 시리얼 로그: `[M10] motionActive=0` 출력

**실패 시 조치**: `A00_Main_0201.cpp`의 `A00_run()` 내 `g_M10_motionLogic->tick()` 호출 확인.

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
- [ ] 시리얼 로그 순서:
  ```
  [W10] routeReload -> 202 Accepted
  [A00] Executing pending reload (loopTask)...
  [CT10] reloadAll done
  [A00] Pending reload done (ok=1)
  ```

**실패 시 조치**: `W10_Web_Routes_Config_0201.cpp`의 `routeReload()` 및 `requestReload()` atomic CAS 로직 확인.

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

**목적**: `SPEC_0200.md §5.2`에 명시된 대로 메모리 패치 후 `config/save` 없이 `reload` 호출 시 디스크 원본으로 복원됨을 검증.

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
  src/v0200/CT10_Ctl_Ctl_0201.cpp
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
grep -A2 "private:" src/v0200/CT10_Ctl_0201.h | grep "applyMotionSimConfigToSim"

# 2. 외부 호출 부재 확인
grep -rn "applyMotionSimConfigToSim" src/v0200/*.cpp | \
  grep -v "CT10_Ctl_Ctl_0201.cpp"
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
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0201/P010_bundle_0201.js

# 2. CSS gzip 헤더
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0201/P000_common_0201.css

# 3. HTML 내 script 번들 태그 확인
curl -s http://$IP/html_v0201/P010_main_0201.html | grep -c "P010_bundle_0201.js"
```

**합격 판정**:
- [ ] JS: `Content-Encoding: gzip`, 200
- [ ] CSS: `Content-Encoding: gzip`, 200
- [ ] HTML: bundle 태그 정확히 1개

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
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0201/P010_bundle_0201.js

# 2. gzip 미포함 (curl 기본)
curl -I http://$IP/html_v0201/P010_bundle_0201.js
```

**합격 판정**:
- [ ] 1번: `Content-Encoding: gzip` 포함
- [ ] 2번: `Content-Encoding` 미포함 (raw)

---

### T-12. G-2/G-4 (Long Path) — regex gzip

**검증 절차**:
```bash
curl -I -H "Accept-Encoding: gzip" http://$IP/html_v0201/P010_main_0201.html
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
# 기대: 302 → /P010_main_0201.html

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

**실패 시 조치**: `CT10_Ctl_Ctl_Seg_0201.cpp`의 `tickSegmentSequence` 내 `v_seg.mode == EN_A20_SEG_MODE_PRESET` 조건 확인.

---

### T-15. A-2 — 캡슐화 위임

**목적**: W10에서 CT10 위임 메서드 경유 확인.

**검증 절차**:
```bash
# 1. 직접 접근 0건
grep -rn "s_control->sim\.\|s_control->motion->" src/v0200/*.cpp
# 기대: 0건

# 2. private 섹션에 motion/sim
grep -A5 "private:" src/v0200/CT10_Ctl_0201.h | grep -E "motion|sim"
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
- [ ] `control == "CT10_Ctl_0201"`
- [ ] `config == "C10_Config_0201"`
- [ ] `api == "W10_Web_0201"`
- [ ] `simul == "S10_Simul_0201"`

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

## 4. 프론트엔드 v0201 SPA

### T-29. 초기 로드 — SPA Shell 3자산

**목적**: SPA Shell이 HTML+CSS+JS 3자산만 로드 검증.

**검증 절차**:
```bash
# 1. 브라우저 접속
# http://$IP/

# 2. DevTools Network 탭 확인
# - HTML: 1건 (P010_main_0201.html)
# - CSS: 1건 (P000_common_0201.css)
# - JS: 1건 (P010_bundle_0201.js)
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
python3 src/v0200/tools_0200/commit_contracts_0200.py --dry-run --strict
```

**합격 판정**:
- [ ] exit 0
- [ ] 7문서 존재

---

### T-37. 잔존 참조 grep

**검증 절차**:
```bash
# (1) v0200 잔존
grep -rn "_0200\." src/v0200/*.h src/v0200/*.cpp | grep -v "\.md\|data_v0200\|data_src_v0200"
# 기대: 0건

# (2) A-2 캡슐화 위반
grep -rn "s_control->sim\.\|s_control->motion->" src/v0200/*.cpp
# 기대: 0건

# (3) B-2 화이트리스트 위반
grep -rn "g_A20_config_root\." src/v0200/W10_Web_Routes_*_0201.cpp | grep -v "getRootSnapshot"
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
  src/v0200/*_Util_0201.cpp
# 기대: 0건

grep -c "G_C10_SCH_ID_START" src/v0200/C10_Config_Sch_Internal_0201.h
# 기대: 1건
```

**합격 판정**:
- [ ] 파일 스코프 정의 0건
- [ ] Internal 헤더 정의 확인

---

### T-39. F-4 Logger 초기 INFO

**검증 절차**:
```bash
grep -n "setLevel(EN_L10_LOG_DEBUG)" src/v0200/main.cpp
# 기대: 0건

grep -n "setLevel(EN_L10_LOG_INFO)" src/v0200/main.cpp
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
grep -rn "fetch('/api/" src/v0200/data_v0201_src/html_v0201/*.js
# 기대: 0건

# (2) 하드코딩 LS 키
grep -rn "localStorage.getItem('snw\." src/v0200/data_v0201_src/html_v0201/*.js | \
  grep -v "010.config.js"
# 기대: 0건

# (3) 하드코딩 상태 코드
grep -rnE "stateCode *=== *[0-9]" src/v0200/data_v0201_src/html_v0201/*.js | \
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

### 릴리스 차단 필수 세트 (최소 13건)

| # | 테스트 | 그룹 |
|:---:|---|---|
| 1 | T-1 (M10 tick) | L1 |
| 2 | T-3 (Reload 위임) | L1 |
| 3 | T-5 (Motion 위임) | L1 |
| 4 | T-10 (lastReloadOk) | L1 |
| 5 | T-14 (FIXED self-heal) | L2 |
| 6 | T-16 (버전 SSOT) | L2 |
| 7 | T-27 (NVS reset) | L2 |
| 8 | T-29 (SPA 3자산) | L3 |
| 9 | T-30 (12 페이지) | L3 |
| 10 | T-31 (4 레벨) | L3 |
| 11 | T-32 (언어 토글) | L3 |
| 12 | T-36 (계약 문서) | L4 |
| 13 | T-40 (프론트 하드코딩) | L4 |

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
| 404 `/html_v0201/*` | W10 경로 라우트 미확장 | `W10_registerGzipServe()` 수정 |
| CSS/JS 404 | staging 경로 불일치 | `pio_gzip_0201.py` 재확인 |

---

## 9. Phase 7 릴리스 게이트

### 9.1 게이트 체크리스트

| Gate | 조건 | 판정 |
|:---:|---|:---:|
| **G-7.0** | JSON + W10 경로 확장 + buildfs/upload/uploadfs 성공 | ⬜ |
| **G-7.1** | 정적 감사 13건 통과 (T-36~T-40) | ⬜ |
| **G-7.2** | 백엔드 필수 회귀 6/6 (T-1, T-3, T-5, T-14, T-16, T-27) | ⬜ |
| **G-7.3** | 프론트엔드 필수 7/7 (T-29~T-35) | ⬜ |
| **G-7.4** | 부하 안정성 (T-41 heap 5분) | ⬜ |
| **G-7.5** | CI 재실행 그린 | ⬜ |
| **G-7.6** | 릴리스 태그 push | ⬜ |

### 9.2 릴리스 승인 조건

**모든 게이트 (G-7.0 ~ G-7.6) 통과 시 → 릴리스 승인**.

**미통과 시**:
- 각 게이트 재실행
- 실패 원인 분석 (트러블슈팅 매트릭스 참조)
- 수정 후 재검증

### 9.3 릴리스 태그

```bash
git tag -a v0201-frontend-2026-10-21 -m "v0201 Frontend Release (SPA)

## 백엔드
- Batch A~F 리팩토링 (2026-10-20)
- RAM: 111,596 B (34.1%)
- Flash: 1,528,153 B (23.3%)

## 프론트엔드
- 그린필드 SPA 재설계 (Phase 0~7)
- 3자산 (HTML+CSS+JS, gz 46 KB)
- 12 페이지 해시 라우팅
- L1~L4 레벨 접근 제어
- i18n ko/en 200+ 키

## 검증
- 필수 회귀 13건 (T-1, T-3, T-5, T-10, T-14, T-16, T-27, T-29~T-32, T-36, T-40)
- 확장 회귀 22건 (릴리스 후 병행)
- 부하/안정성 5건 (T-41~T-45)

## CI
- GitHub Actions 그린
- 계약 문서 v2.2 gate 통과"

git push origin v0201-frontend-2026-10-21
```

---

## 10. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-21 | v2.4 | `cfg_motion_0201.json`, `P010_*_0201.*` 자산명, 리다이렉트 기대값 일괄 현행화 | Antigravity AI |
| 2026-10-21 | **v2.3** | **프론트엔드 v0201 SPA 통합**: T-29~T-35 (7건) 신규, T-36~T-40 정적 감사 확장, T-41~T-45 부하/안정성 신규, §7 매트릭스 재구성 (L1~L5 계층), §8 트러블슈팅 SPA 항목 추가, §9 Phase 7 릴리스 게이트 신규 | Antigravity AI |
| 2026-10-20 | v2.2 | Batch A~F 반영: T-14~T-28 신규 15건 추가, §D 트러블슈팅 확장, §C 매트릭스 재정렬 | Antigravity AI |
| 2026-10-19 | v2.1 | N-1 (T-10), G-1 (T-11), G-2/G-4 (T-12), N-3 (T-13) 신규 | Antigravity AI |
| 2026-10-19 | v2.0 | v0200 승격 | Antigravity AI |
| 2026-10-19 | v1.2 | T-9 (번들/Gzip 무결성) | Antigravity AI |
| 2026-10-19 | v1.1 | curl/jq 표준화, 소스 파일명 갱신 | Antigravity AI |
| (초기) | v1.0 | T-1~T-8 | 개발팀 |
