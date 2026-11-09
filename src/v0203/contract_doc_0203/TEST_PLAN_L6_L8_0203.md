# TEST_PLAN_L6_L8_0203.md — Batch/Phase 회귀 (L6~L8)

> **범위**: T-46 ~ T-113 (Batch G / Batch I / Phase 1~6 통합).
> **원본 §번호 유지**: §3.1~§3.4 원본 번호 그대로.
> **참조**: 개요/환경/사전 준비/매트릭스/릴리스 게이트는 [`TEST_PLAN_0203.md`](TEST_PLAN_0203.md).
> 이 파일은 `src/v0203/tools_0203/split_test_plan_0203.py`가 생성합니다.

## 🔍 AI 빠른 참조 (이 파일)

| 서브섹션 | 범위 | 필수 |
|---|---|---|
| §3.1 Batch G P0 | T-46 ~ T-50 | **5/5 (P0)** |
| §3.2 Batch G P1 | T-51 ~ T-67 | **8/8** (T-51, T-52, T-53, T-54, T-57, T-58, T-61, T-65) |
| §3.3 Batch I | T-70 ~ T-73 | **3/3** (T-70, T-71, T-72) |
| §3.4 Phase 1~6 | T-90 ~ T-113 | **10건** (T-90, T-91, T-94, T-97, T-98, T-99, T-101, T-103, T-105, T-106) |

**사전 준비**: [`TEST_PLAN_0203.md §3`](TEST_PLAN_0203.md#3-검증-환경-및-공통-사전-준비) 참조.

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

**실패 시 조치**: `A00_Main_0203.cpp`의 `while(!Serial && ...)` 조건 및 `G_A00_USB_CDC_TIMEOUT_MS` 상수 확인.

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
# cfg_motion_0203.json → motion.pir.holdSec = 10 (PATCH로 즉시 변경 가능)

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

**실패 시 조치**: `M10_MotionLogic_0203.h`의 `isActive()` 함수가 `_state.pirActive` 단일 반환인지 확인.

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

**실패 시 조치**: `W10_Web_Upload_0203.cpp`의 `if (s_upFile)` 블록 확인 (`available()` 검사 제거됨).

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

**실패 시 조치**: `C10_Config_Sys_0203.cpp`의 `clearApiKey` 블록 확인 (B-4). `240.page.settings.js`의 `_onSave` securityPatch 확인 (NEW-U2).

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
grep "v_setFail\|v_commitErr" src/v0203/N10_NvsManager_0203.cpp
# 기대: 반환값 검사 코드 존재
```

**합격 판정**:
- [ ] 3단계: 재부팅 후 override 유지
- [ ] 4단계: "single commit" 로그
- [ ] 5단계: 이전 로그 0건
- [ ] 6단계: 반환값 검사 존재

**실패 시 조치**: `N10_NvsManager_0203.cpp`의 `flush()` 함수에서 `nvs_open`/`nvs_set_*`/`nvs_commit` 반환값 체크 확인.

---

### T-58. [B-2] + [B-9] async_tcp root 스냅샷

**목적**: `getRootSnapshot()` 경유(B-2, B-9). torn read 방지.

**검증 절차**:
```bash
# 1. 정적 코드 검사 — 직접 접근 0건
grep -n "g_A20_config_root\." src/v0203/W10_Web_Routes_*_0203.cpp
# 기대: 0건

# 2. getRootSnapshot 사용 확인
grep -c "getRootSnapshot" src/v0203/W10_Web_Routes_Config_0203.cpp
grep -c "getRootSnapshot" src/v0203/W10_Web_Routes_CRUD_0203.cpp
grep -c "getRootSnapshot" src/v0203/W10_Web_WS_0203.cpp
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
URL=http://$IP/html_v0203/P010_bundle_0203.js

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

**실패 시 조치**: `W10_Web_Static_0203.cpp`의 `W10_acceptsGzip()` 함수 확인.

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
# python -m ampy --port /dev/ttyUSB0 rm /json/cfg_system_0203.json
# python -m ampy --port /dev/ttyUSB0 rm /json/cfg_system_0203.json.bak

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

**실패 시 조치**: `A00_Main_0203.cpp`의 `if (!g_A20_config_root.system || !g_A20_config_root.wifi)` 블록 확인.

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

**실패 시 조치**: `W10_Web_Upload_0203.cpp`의 `routeUpdate()` 청크 핸들러 `if (Update.isRunning()) Update.abort();` 확인.

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

---

## 3.4 Phase 1~6 통합 회귀 (v0203_011, T-90 ~ T-112)

### T-90. [Phase 1 N-5] Factory Reset 확인어
**목적**: Factory Reset 확인어 원시 키 노출(N-5) 방지.
**검증 절차**:
```bash
# 1. Settings 진입 → 공장 초기화 클릭
# 2. 확인어 표시 확인 (ko: "초기화", en: "RESET")
# 3. "초기화" 입력 → 확인 → 재부팅
# 브라우저 Console:
document.querySelector('#confirm-word').placeholder;
# 기대: "계속하려면 아래에 "초기화"를 입력하세요" (raw key 아님)
```
**합격 판정**:
- [ ] 확인어 문구 정상 표시
- [ ] "초기화" 입력 시 초기화 성공
- [ ] 잘못된 입력 시 경고 + 실행 안 됨

---

### T-91. [Phase 1 N-6] 모달 z-index 계층
**목적**: 모달 z-index(900) < 하단탭(1000) 문제 해결 검증.
**검증 절차**:
```bash
# 1. 모바일 뷰포트 (375×667) 진입
# 2. Settings → 저장 클릭 (모달 열림)
# 3. 모달이 하단 탭바와 사이드바 위에 표시되는지 확인
```
**합격 판정**:
- [ ] 모달이 하단탭 위에 덮임
- [ ] 토스트 발생 시 모달 위에 표시 (z-index 1200)

---

### T-92. [Phase 1 N-16] Mutex Lazy-init 크래시 없음
**목적**: critical section 내 heap alloc 제거(N-16) 검증.
**검증 절차**:
```bash
# 1. 10회 콜드 부팅 (전원 차단 후 재인가)
# 2. 매 부팅 후 30초간 안정성 관찰
```
**합격 판정**:
- [ ] 10회 모두 정상 부팅
- [ ] WDT 리셋 0회
- [ ] [A40] CreateRecursiveMutex failed 로그 0건

---

### T-93. [Phase 1 N-18] Modal 리스너 누수
**목적**: Modal 리스너 누수(N-18) 방지.
**검증 절차**:
```javascript
// 브라우저 Console
const overlay = document.getElementById('snw-modal-overlay');
for (let i = 0; i < 10; i++) {
    document.querySelector('[data-action="save"]').click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('.snw-btn:not(.snw-btn-primary)').click();
    await new Promise(r => setTimeout(r, 300));
}
getEventListeners(overlay).click?.length; // 기대: 1 (누적 없음)
```
**합격 판정**:
- [ ] click 리스너 1개 유지
- [ ] keydown 리스너 0~1개

---

### T-94. [Phase 2 N-2] Settings timeCfg → TM10 즉시 반영
**목적**: NTP 서버 변경 시 재부팅 없이 반영 검증.
**검증 절차**:
```bash
# 1. 현재 서버 확인
curl -s http://$IP/api/v001/state | jq .time.activeServer # 기대: "pool.ntp.org"
# 2. NTP 서버 변경
curl -X PATCH http://$IP/api/v001/system -H "X-API-Key: $KEY" -d '{"timeCfg":{"ntpServer":"time.google.com"}}'
# 3. 5초 후 재조회
sleep 5
curl -s http://$IP/api/v001/state | jq .time.activeServer # 기대: "time.google.com" (재부팅 없이)
# 4. SNTP 동기화 확인
curl -s http://$IP/api/v001/state | jq .time.timeValid # 기대: true
```
**합격 판정**:
- [ ] 3단계: 새 서버 반영
- [ ] 4단계: SNTP 재동기화 성공

---

### T-95. [Phase 2 N-3] /control/override 404 소멸
**목적**: 프론트의 /control/override 호출이 /simulation으로 통합 검증.
**검증 절차**:
```bash
# 1. 브라우저 DevTools Network 관찰
# 2. Dashboard 슬라이더 조작 (강도 변경)
# 3. 관찰: POST /api/v001/control/override 요청 없음, POST /api/v001/simulation 요청 존재
# 4. 콘솔 경고 확인: [API] overrideParams is deprecated. Use patchSim({override}) instead.
```
**합격 판정**:
- [ ] 404 요청 0건
- [ ] deprecated 경고 1건

---

### T-96. [Phase 2 N-7] Runtime (NVS) 노출
**목적**: Diagnostics §Runtime 정상 표시(N-7) 검증.
**검증 절차**:
```bash
# 1. state 응답에 runtime top-level 확인
curl -s http://$IP/api/v001/state | jq .runtime
# 2. Diagnostics 페이지 진입 (#/diagnostics)
# 3. Runtime (NVS) 섹션 확인: 실제 runMode 등 값 표시
```
**합격 판정**:
- [ ] runtime 객체 존재
- [ ] Diagnostics 섹션 정상 표시

---

### T-97. [Phase 2 N-10] B-2 규약 준수 재검증
**목적**: checkApiKey/getGeminiApiKey snapshot 전환(N-10) 검증.
**검증 절차**:
```bash
# 1. 정적 grep: g_A20_config_root 직접 접근 0건 확인
# 2. API Key 인증 및 Gemini 프록시 인증 정상 동작 확인
```
**합격 판정**:
- [ ] 직접 접근 0건
- [ ] API 인증 authorized 정상 반환

---

### T-98. [Phase 3 N-1] Dashboard 플레이리스트 재생 (핵심)
**목적**: Session API가 제어 루프와 단절된 N-1 해결 검증.
**검증 절차**:
```bash
# 1. Dashboard → 플레이리스트 카드 클릭
# 2. 팬 실회전 확인
# 3. 상태 확인
curl -s http://$IP/api/v001/state | jq '{sessionType: .control.session.type, sessionState: .control.session.state, runSource: .control.runSource, simActive: .sim.active}'
# 기대: {sessionType:1, sessionState:"ACTIVE", runSource:2, simActive:true}
```
**합격 판정**:
- [ ] 팬 실회전 (PWM > 0)
- [ ] runSource == 2 (USER_PROFILE)
- [ ] session.state == "ACTIVE"

---

### T-99. [Phase 3 N-1] Session pause/resume (Smart Resume)
**목적**: pause/resume 상태 보존 + Smart Resume 검증.
**검증 절차**:
```bash
# 1. 재생 시작 → 5초 대기
# 2. pause: POST /api/v001/session/pause → stepRemainSec 고정 확인
# 3. 10초 대기 후 재조회: stepRemainSec 유지 확인
# 4. resume: POST /api/v001/session/resume → stepRemainSec 감소 재개 확인
```
**합격 판정**:
- [ ] pause 후 stepRemainSec 고정
- [ ] resume 후 감소 재개
- [ ] pausedAccumMs 정상 누적

---

### T-100. [Phase 3 N-1] Session stop 멱등성
**목적**: stop 2회 호출 시 안전성(N-1) 검증.
**검증 절차**:
```bash
# 1. 재생 시작
# 2. stop 1회: POST /api/v001/session/stop → {ok: true, "session_stopped"}
# 3. stop 2회 즉시: POST /api/v001/session/stop → {ok: false} (멱등)
```
**합격 판정**:
- [ ] 1회: 성공
- [ ] 2회: no-op (에러 없음)

---

### T-101. [Phase 3 ADR-3] Schedule profileId 단일 실행
**목적**: profileId 참조 단일 스케줄 재생(ADR-3) 검증.
**검증 절차**:
```bash
# 1. profileId 참조 스케줄 생성
curl -X POST http://$IP/api/v001/schedules -H "X-API-Key: $KEY" -d '{"schedule": {"schNo": 200, "name": "ProfileRefTest", "enabled": true, "profileId": 1, "period": {"enabled":true,"days":[1,1,1,1,1,1,1],"startTime":"00:00","endTime":"23:59"}}}'
# 2. 활성 시간 도달 시 상태 확인
curl -s http://$IP/api/v001/state | jq '{runSource: .control.runSource, schName: .control.schedule.name, profName: .control.profile.name}'
# 기대: {runSource:1, schName:"ProfileRefTest", profName:"수면모드"}
```
**합격 판정**:
- [ ] runSource == 1 (SCHEDULE)
- [ ] profile.name 표시 (프로필 참조 단일 실행)

---

### T-102. [Phase 3 S-4] NowPlaying Bar 정상 표시
**목적**: profileName, stepRemainSec 노출(S-4) 검증.
**검증 절차**:
```bash
# 1. Dashboard 재생
# 2. NowPlaying Bar 확인
# DevTools Console:
const sess = SNW.Store.get().session;
console.log({name: sess.profileName, step: sess.currentStep, remain: sess.stepRemainSec, state: sess.state});
```
**합격 판정**:
- [ ] profileName 실제 프로필 이름
- [ ] stepRemainSec 숫자 감소
- [ ] Bar 제목/시간 정상 표시

---

### T-103. [Phase 4 ADR-2] steps[] 단일 배열 표준 (하위 호환 배제)
**목적**: 단일 표준 스키마(`steps[]` 및 `repeatSegments`) 적용 및 레거시 `segments[]` 제거 검증.
**검증 절차**:
```bash
# 1. 현재 userProfiles 조회
curl -s http://$IP/api/v001/user_profiles | jq '.userProfiles.profiles[0]'
# 기대: steps[] 단일 배열 존재, segments[] 필드 배제됨
# 2. Studio 편집 진입 및 Step 수정 후 저장
# 3. 재조회 시 steps[] 데이터 round-trip 정상 보존 확인
```
**합격 판정**:
- [ ] steps[] 단일 배열 표준 출력
- [ ] round-trip 시 Step 및 on/off 보존
- [ ] 편집기 정상 표시

---

### T-104. [Phase 4 N-4] repeatSegments 필드 통일
**목적**: Studio repeat → repeatSegments 필드 단일화(N-4) 검증.
**검증 절차**:
```bash
# 1. Studio에서 반복=2 설정 → 저장
# 2. 서버 응답 확인: repeatSegments: true, repeatCount: 2
# 3. Playlist 카드 총 시간: Step 시간 합 × 2 확인
```
**합격 판정**:
- [ ] repeatSegments 필드 존재
- [ ] Playlist 총 시간 × 2 반영

---

### T-105. [Phase 5 ADR-5] Studio 🎬 미리보기
**목적**: Preview 파사드(ADR-5) 통합 검증.
**검증 절차**:
```bash
# 1. Studio (#/automation/studio) 진입
# 2. Step 편집기 → 🎬 클릭
# 3. 모달 정상 표시 및 파형 애니메이션 확인
# 4. ESC로 닫기 → 콘솔 경고 없음, 정상 종료
```
**합격 판정**:
- [ ] 모달 표시
- [ ] 파형 애니메이션
- [ ] ESC 정상 (Promise resolve)

---

### T-106. [Phase 5 P-2] i18n 완전성
**목적**: i18n DICT 완성(P-2) 검증.
**검증 절차**:
```bash
# 1. CI 도구 실행
python src/v0203/tools_0203/check_i18n.py --strict
# 기대: exit 0, "모든 N개 키가 정의되어 있습니다"
# 2. 12개 전체 화면 순회 시 raw key 노출 0건
# 3. 언어 토글 (ko ↔ en) 시 실시간 전체 반영
```
**합격 판정**:
- [ ] check_i18n.py exit 0
- [ ] raw key 노출 0건
- [ ] 언어 전환 완전

---

### T-107. [Phase 5 P-3] /monitor 라우트
**목적**: Router /monitor 등재(P-3) 검증.
**검증 절차**:
```bash
# 1. URL 직접 입력: http://$IP/#/monitor
# 2. 사이드바 "모니터" 메뉴 표시 및 클릭 진입
# 3. 회고 탭 24h 선택 시 타임라인 마커 분산 확인
```
**합격 판정**:
- [ ] URL 직접 진입 성공
- [ ] 사이드바 표시
- [ ] 회고 탭 정상 렌더

---

### T-108. [Phase 5 P-4] Chart 예상 오버레이
**목적**: _drawOverlay(P-4) 구현 검증.
**검증 절차**:
```bash
# 1. Chart 페이지 (#/chart)
# 2. "예상 오버레이" 체크박스 ON
# 3. 실측 파형 위에 점선 예상 파형 표시 확인
```
**합격 판정**:
- [ ] 점선 오버레이 표시
- [ ] 1초 주기 재렌더
- [ ] 예상 탭 전환 시 오버레이 제거

---

### T-109. [Phase 6 N-12] Offline resolvePreset 정확성
**목적**: factors 경로 수정(N-12) 검증.
**검증 절차**:
```bash
# 오프라인 모드에서 시나리오별 강도 차이 확인
# NATURAL (FOREST_CANOPY ~40%), SLEEP (OCEAN+SLEEP ~30%), GALE (OCEAN+ACTIVE ~85%)
```
**합격 판정**:
- [ ] 프리셋별 강도 차이 발생
- [ ] 폴백(50%) 무효화

---

### T-110. [Phase 6 N-14] Offline 툴바 레이아웃
**목적**: 툴바 삽입 위치(N-14) 검증.
**검증 절차**:
```bash
# 오프라인 모드 진입 시:
# 1. header/main/footer 정상 배치 확인
# 2. 툴바가 최상단 (body firstChild)
# 3. 모바일 뷰포트 하단 탭바 겹침 없음
```
**합격 판정**:
- [ ] grid row 1 붕괴 없음
- [ ] 툴바 최상단 (body firstChild)
- [ ] 하단 탭바 겹침 없음

---

### T-111. [Phase 6 N-28] Offline 세션 진행
**목적**: startSimulator step 진행(N-28) 검증.
**검증 절차**:
```bash
# 오프라인 재생 시작 후 5초 대기 → stepRemainSec 실시간 감소 및 Step 전환 확인
```
**합격 판정**:
- [ ] stepRemainSec 실시간 감소
- [ ] Step 전환 동작
- [ ] pause 시 시계 정지

---

### T-112. [Phase 1~6 통합] 전체 회귀 스모크
**목적**: Phase 1~6 완료 후 전체 시스템 종합 회귀.
**검증 절차**:
```bash
# 1. 콜드 부팅 10회
# 2. Dashboard 재생 → 5분 유지 → 정지
# 3. 12 페이지 순회
# 4. 언어 토글 × 10회
# 5. 오프라인/온라인 전환 × 3회
# 6. Heap 안정성 5분 샘플링
```
**합격 판정**:
- [ ] 크래시 0건
- [ ] Heap 누수 없음
- [ ] 모든 페이지 정상

---

### T-113. [Phase 5+ v0203_011] 세션 타이머 (SNW.TimerPanel) 동작 및 NowPlaying 연동
**목적**: 자동화 4번째 탭 타이머 프리셋/슬라이더 조작, 실시간 카운트다운, Now Playing Bar 배지 표시 및 세션 자동 종료 검증.
**검증 절차**:
```bash
# 1. Dashboard 또는 Playlist에서 바람 세션 재생 시작
# 2. #/automation/timer 진입
# 3. 15분 프리셋 클릭 → 카운트다운(00:15:00) 시작 및 프로그레스 바 표시 확인
# 4. Now Playing Bar에 ⏱️ 배지 실시간 표시 및 잔여 시간 확인
# 5. 커스텀 슬라이더(예: 45분) 이동 → 타이머 즉시 재설정 확인
# 6. 타이머 만료 시 Session STOP API 자동 호출 및 토스트 알림 확인
# 7. '끄기 (OFF)' 버튼 클릭 시 타이머 취소 및 배지 제거 확인
```
**합격 판정**:
- [ ] 15/30/60/120분 프리셋 및 슬라이더 조작 정상 동작
- [ ] Now Playing Bar에 `⏱️ {남은분}m` 배지 정상 표시 및 클릭 시 타이머 탭 이동
- [ ] 만료 시 세션 정지(`SNW.Api.Session.stop()`) 정상 트리거
- [ ] 새로고침 후에도 타이머 상태(`localStorage`) 복원 유지

---

---

## 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-11-09 | v1.0 | TEST_PLAN_0203.md에서 L6~L8 분할 (T-46~T-113). `src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |
