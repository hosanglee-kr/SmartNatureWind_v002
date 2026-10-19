# TEST_PLAN_0200.md — 회귀 테스트 절차서 (T-1 ~ T-28)

> **검증 대상**: v0200 CBD 구현체 (Batch A~F 반영, 코드 접미사 `_0201`).  
> **검증 환경**: ESP32-S3-N16R8, LittleFS 업로드 완료, 권장 로그 `EN_L10_LOG_DEBUG`.  
> **파일명 정책**: 계약 문서 `_0200.md` 유지, 코드 참조 `_0201` 접미사.

---

## 사전 준비

```bash
pio run --target upload      # 펌웨어
pio run --target uploadfs    # LittleFS
pio device monitor           # 115200, exception_decoder
IP=<부팅 후 시리얼 IP>
```

기본 확인:
```bash
curl -s http://$IP/api/v001/version | jq
curl -s http://$IP/api/v001/state | jq '.control | {state, pendingReload, lastReloadOk}'
```

---

## A. 기존 회귀 (T-1 ~ T-13)

| ID | 대상 | 목적 | 합격 판정 |
|---|---|---|---|
| **T-1** | F-03 (M10 tick) | PIR holdSec 정상 만료 | feed 후 5초 true 유지, 15초 false |
| **T-2** | F-04 (N10 tick) | NVS 런타임 10초 flush | 10초 후 재부팅 시 `lastUserProfileNo` 유지 |
| **T-3** | F-05 (Reload 위임) | 202 즉시 응답 | `HTTP 202`, `< 50ms`, `pendingReload` true→false |
| **T-4** | F-05 (중복 방지) | 409 Conflict | 연속 요청 시 2번째 409 |
| **T-5** | F-06 (Motion 위임) | 200 즉시 응답 | `HTTP 200`, `< 50ms`, `sim.intensity` 반영 |
| **T-6** | I-2 (Reload 정책) | save 없는 패치 소실 | reload 후 원본 복원 |
| **T-7** | I-3 (`_pendingMotionSimApply` 리셋) | begin/reloadAll 방어 | grep `store(false)` 존재 |
| **T-8** | I-4 (Private 캡슐화) | 컴파일 검증 | `applyMotionSimConfigToSim` private |
| **T-9** | I-6 (번들/Gzip) | gzip 헤더 + bundle | `Content-Encoding: gzip`, `P010_bundle_0200.js` 1건 |
| **T-10** | N-1 (`lastReloadOk`) | 상태 노출 | 초기 true, reload 후 유지 |
| **T-11** | G-1 (Accept-Encoding) | gzip/raw 분기 | 헤더 시 gzip, 미시 raw |
| **T-12** | G-2/G-4 (Long Path) | regex gzip | `/html_v3/*.html` gzip |
| **T-13** | N-3 (Root fallback) | 무한 루프 차단 | 정상 302, 부재 시 404 |

### T-1 상세 (필수)
```bash
curl -X POST http://$IP/api/v001/motion/pir/feed -d '{"pir":true}'
curl -s http://$IP/api/v001/state | jq .control.sensor.motionActive   # true
sleep 5;  curl -s ... | jq                                            # true
sleep 10; curl -s ... | jq                                            # false
```
로그: `[M10] motionActive=0`

### T-3 상세 (필수)
```bash
curl -s -w "\n%{http_code} %{time_total}s\n" -X POST http://$IP/api/v001/reload
# 기대: 202 queued < 0.05s
for i in {1..10}; do curl -s http://$IP/api/v001/state | jq .control.pendingReload; sleep 0.05; done
# 기대: true → false (500ms 이내)
```

### T-5 상세 (필수)
```bash
curl -s -w "\n%{http_code} %{time_total}s\n" -X POST http://$IP/api/v001/motion -d '{"motion":{"sim":{"intensity":85}}}'
# 기대: 200 OK < 0.05s
sleep 0.1
curl -s http://$IP/api/v001/state | jq .sim.intensity
# 기대: 85.0
```
로그: `[CT10] MotionSim apply requested (deferred)` → `[CT10] S10 runtime updated from motion.sim (intensity=85.0)`

---

## B. Batch A~F 신규 회귀 (T-14 ~ T-28)

| ID | 대상 | 목적 | 합격 판정 |
|---|---|---|---|
| **T-14** | A-1 (self-heal) | FIXED 무한 재호출 방지 | SegmentOn 로그 **정확히 1회** (30초 관찰) |
| **T-15** | A-2 (캡슐화) | 위임 경유 확인 | `grep "s_control->sim\." W10_Web_Routes_*.cpp` 0건 |
| **T-16** | B-1 (버전 SSOT) | 버전 문자열 일관 | `/version` 응답 `FW_Ver_2.0.0`, `*_0201` |
| **T-17** | C (물리 상수) | 물리 출력 무변동 | phase 시퀀스/통계 유사, 한계값 동일 |
| **T-18** | D-1 (WS 배치) | 4채널 수신 정상 | WS 4채널 모두 유실 없음, mutex timeout 0건 |
| **T-19** | D-2/D-3/D-5 (heap) | 단편화 감소 | 5분 후 heap > 100KB, ±5KB 이내 |
| **T-20** | (E) 링크 무결성 | undefined 0건 | `pio run` exit 0, 심볼 부재 확인 |
| **T-21** | E-2.1 (TM10 분리) | SNTP 재동기화 | 동기화 OK + fallback 로그 |
| **T-22** | E-2.2 (W10 6분할) | 27개 엔드포인트 | 전 라우트 정상 응답 |
| **T-23** | E-2.3 (C10_Sch 5분할) | 스케줄 CRUD + overlap | POST/PUT/DELETE 200, 겹침 400 |
| **T-24** | E-2.4 (CT10_Ctl 4분할) | Segment/Override/Profile | 각 로그 1회, reload 유지 |
| **T-25** | E-2.6 (UzProf 5분할) | 프로파일 CRUD | POST/PUT/DELETE 200 |
| **T-26** | E-2.7 (WindDc 5분할) | WindDict CRUD | preset CRUD 200, save 정상 |
| **T-27** | F-1 (NVS reset) | factory reset 후 초기화 | override=false, profileIdx=-1 |
| **T-28** | F-2/F-3 (헬퍼) | POST/PATCH 응답 동일 | body 키 구조 동일, 실패 응답 동일 |

### T-14 상세 (필수)
```bash
# FIXED 모드 스케줄 등록 (fixedSpeed=50, on=2, off=1)
# 30초 관찰 후 시리얼 로그 카운트
grep -c "SegmentOn(SCH) FIXED" serial.log
# 기대: 1 (배치 A 이전: 750+ 폭주)
```

### T-16 상세
```bash
curl -s http://$IP/api/v001/version | jq '{fw, control, config, api, simul}'
# {"fw":"FW_Ver_2.0.0","control":"CT10_Ctl_0201","config":"C10_Config_0201",
#  "api":"W10_Web_0201","simul":"S10_Simul_0201"}

curl -s http://$IP/api/v001/system/firmware/check | jq '{status, current_version}'
# {"status":"latest","current_version":"FW_Ver_2.0.0"}
```

### T-17 상세
```bash
# Batch C 이전 60초 chart 스냅샷 저장 → 이후 60초 스냅샷 저장 → 비교
for i in {1..60}; do
  curl -s http://$IP/api/v001/state | jq -c '.sim | {windSpeed, targetWind, phase, gustActive, thermalActive}'
  sleep 1
done > chart_post_c.jsonl

# 판정: phase 시퀀스 패턴 유사, windSpeed 평균 차이 < 5%,
#       gustActive/thermalActive 발생 빈도 ±1회 허용
```

### T-22 상세 (핵심 10건)
```bash
BASE=http://$IP/api/v001
curl -s $BASE/version | jq .module            # SmartNatureWind
curl -s $BASE/state | jq .control.active
curl -s $BASE/system | jq .meta.version
curl -s $BASE/motion | jq .motion.pir.enabled
curl -s $BASE/diag | jq .heap
curl -s $BASE/metrics | jq .metrics.active
curl -s $BASE/logs | jq .logs
curl -s $BASE/wifi/scan | jq .wifi.scan | length
curl -s $BASE/wifi/state | jq .wifi.state.mode
curl -s $BASE/simulation | jq .sim.active
# (나머지 17건 동일 패턴)
```

### T-27 상세
```bash
# 1. override + profile 활성
curl -X POST $BASE/control/override/fixed -d 'percent=50'
curl -s $BASE/metrics | jq '{overrideActive, profileIdx}'
# → {"overrideActive":true,"profileIdx":0}

# 2. factory reset (자동 재부팅)
curl -X POST $BASE/control/factoryReset

# 3. 30초 후 재접속
curl -s $BASE/metrics | jq '{overrideActive, profileIdx}'
# → {"overrideActive":false,"profileIdx":-1}

# 시리얼 로그: "[C10] Factory Reset: NVS runtime reset done."
# 재부팅 후: "[N10] Load runtime: mode=0 src=0 ..." (기본값)
```

### T-28 상세
```bash
# system POST/PATCH
curl -s -X POST  $BASE/system -d '{"meta":{"deviceName":"TestA"}}'  # {"updated":true}
curl -s -X PATCH $BASE/system -d '{"meta":{"deviceName":"TestB"}}'  # {"updated":true}

# wifi POST/PATCH
curl -s -X POST  $BASE/wifi/config -d '{"wifi":{...}}'
curl -s -X PATCH $BASE/wifi/config -d '{"wifi":{...}}'
# 응답 키 구조: updated/status/note/need_reboot 완전 동일
```

---

## C. 회귀 테스트 매트릭스 요약

| ID | 대상 | 소요 | 필수 |
|---|---|:---:|:---:|
| T-1 | F-03 | 30초 | ✅ |
| T-2 | F-04 | 60초 | ✅ |
| T-3 | F-05 + I-1 | 10초 | ✅ |
| T-4 | F-05 (중복) | 5초 | ✅ |
| T-5 | F-06 | 5초 | ✅ |
| T-6 | I-2 | 30초 | ✅ |
| T-7 | I-3 | 정적 | ✅ |
| T-8 | I-4 | 빌드 | ✅ |
| T-9 | I-6 | 10초 | ✅ |
| T-10 | N-1 | 10초 | ✅ |
| T-11 | G-1 | 5초 | ✅ |
| T-12 | G-2/G-4 | 5초 | ✅ |
| T-13 | N-3 | 5초 | ✅ |
| **T-14** | **A-1** | 30초 | ✅ |
| **T-15** | **A-2** | 정적 | ✅ |
| **T-16** | **B-1** | 5초 | ✅ |
| **T-17** | **C** | 120초 | ✅ |
| **T-18** | **D-1** | 300초 | ⚠️ 권장 |
| **T-19** | **D-2/3/5** | 300초 | ✅ |
| **T-20** | **E (링크)** | 빌드 | ✅ |
| **T-21** | **E-2.1** | 60초 | ⚠️ 권장 |
| **T-22** | **E-2.2** | 60초 | ✅ |
| **T-23** | **E-2.3** | 60초 | ✅ |
| **T-24** | **E-2.4** | 60초 | ✅ |
| **T-25** | **E-2.6** | 60초 | ✅ |
| **T-26** | **E-2.7** | 60초 | ✅ |
| **T-27** | **F-1** | 60초 | ✅ |
| **T-28** | **F-2/F-3** | 10초 | ✅ |

**필수 최소 세트**: T-1, T-3, T-5, T-14, T-16, T-20, T-27 (컴파일 성공 시 T-20 자동 통과)
**전수 실행**: 릴리스 전 (T-1~T-28)

---

## D. 장애 진단 및 트러블슈팅

| 실패 증상 | 원인 후보 | 해결 |
|---|---|---|
| T-1 `motionActive` 영구 true | `A00_run` 내 `M10::tick` 누락 | F-03 배치 확인 |
| T-2 `lastUserProfileNo=-1` 초기값 | `N10::tick` 누락 | F-04 배치 확인 |
| T-3 응답 > 500ms | `routeReload` 동기 reloadAll | `requestReload()` 위임 확인 |
| T-3 `pendingReload` 필드 없음 | `exportStateJson_v02` 누락 | 필드 추가 |
| T-4 둘 다 202 | `requestReload` CAS 미사용 | atomic 확인 |
| T-5 > 100ms | `s_control->sim.patchFromJson` 직접 호출 | A-2 위임 확인 |
| T-9 gzip 헤더 없음 | `.gz` 검사/`Content-Encoding` 누락 | Static 파일 확인 |
| T-14 로그 폭주 | `mode==PRESET` 조건 누락 | A-1 반영 확인 |
| T-15 grep 위반 | `motion/sim` public 노출 | A-2 private 이동 확인 |
| T-16 버전 불일치 | `FW_Ver_1.0.0` 잔재 | B-1 반영 확인 |
| T-19 heap < 100KB | `.bss` 증가가 힙 잠식 | `s_snapshot` 크기 확인 |
| T-20 undefined 심볼 | include/매크로 승격 누락 | F-10 Internal 헤더 확인 |
| T-22 특정 라우트 404 | 분할 파일 등록 누락 | `begin()` route 호출 확인 |
| T-27 override 유지 | `N10::resetRuntime` 누락 | F-1 반영 확인 |
| T-28 응답 body 다름 | 헬퍼 미적용 | F-2/F-3 확인 |
| 컴파일 에러 (매크로) | 파일 스코프 정의 | F-10 Internal 승격 |
| 컴파일 에러 (A25 타입) | `A20_Const_Sch_0201.h` 누락 | A25 include 추가 |

---

## E. 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-10-20 | v2.2 | Batch A~F 반영: T-14~T-28 신규 15건 추가 (A-1/A-2/B-1/C/D-1/D-2/D-5/E-2.1~2.7/F-1/F-2/F-3), §D 트러블슈팅 확장, §C 매트릭스 재정렬 | Antigravity AI |
| 2026-10-19 | v2.1 | T-10~T-13 신규 (N-1, G-1, G-2, N-3) | Antigravity AI |
| 2026-10-19 | v2.0 | v0200 승격 | Antigravity AI |
| 2026-10-19 | v1.2 | T-9 (번들/Gzip 무결성) | Antigravity AI |
| 2026-10-19 | v1.1 | curl/jq 표준화, 소스 파일명 갱신 | Antigravity AI |
| (초기) | v1.0 | T-1~T-8 | 개발팀 |
