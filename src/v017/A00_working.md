검토 결과 — WiFi 폴링 반영 완료

WiFi 30초 폴링이 정확히 반영됐습니다.

---

✅ 반영 확인

항목 상태
g_wifiStateTimer 전역 선언 ✅
loadWifiStateOnce() 함수 ✅
handleStateUpdateFromWs() — WiFi 코드 제거 ✅
loadStateOnce() — WiFi 코드 제거 ✅
DOMContentLoaded — setInterval(..., 30000) ✅
beforeunload cleanup ✅

이 라운드는 완결.

---

⚠️ 남은 이슈 — sim 표시 3건 (Round 2)

WiFi와 별개로, sim 정보가 화면에 표시되지 않는 상태가 계속 남아 있습니다.

진단

/api/v001/state 백엔드 응답 (exportStateJson_v02):

```json
{
  "control": {
    "active": true,
    "state": "SCHEDULE_RUN",
    "reason": "...",
    "override": {...},
    "schedule": {...},
    ...
  }
}
```

→ sim 키 자체가 없음.

프론트 loadStateOnce():

```js
const sim = data.sim || data.motion || data.state || {};
// → 항상 {}
const simActive = sim.active !== undefined ? sim.active : sim.simActive;  // undefined
const phase     = sim.phase  !== undefined ? sim.phase  : sim.phaseName;  // undefined
const wind      = sim.wind   !== undefined ? sim.wind   : sim.wind_ms;    // undefined
const pwm       = sim.pwm    !== undefined ? sim.pwm    : sim.pwm_val;    // undefined
```

결과: simActive → IDLE (빨강), phase/wind/pwm → "-" 고정.

추가 문제: 만약 /api/v001/simulation을 호출해도, 백엔드 S10_Simul_IO_070.cpp의 toJson() 필드명은:

```
sim.active, sim.phase, sim.windSpeed, sim.pwmDuty
```

프론트가 기대하는 sim.simActive, sim.wind, sim.pwm과 불일치.

---

3건 묶음 수정안

1. loadStateOnce() — sim 소스 변경 + 필드명 정정

```js
async function loadStateOnce() {
    // state + simulation 병렬 호출
    const [stateData, simData] = await Promise.all([
        apiFetch(SNW_API.API_HTTP_STATE,      { method: "GET" }, true),
        apiFetch(SNW_API.API_HTTP_SIMULATION, { method: "GET" }, true)
    ]);
    if (!stateData && !simData) return;

    const sim = (simData && simData.sim) ? simData.sim : {};

    const simActive = sim.active;        // sim.simActive → sim.active
    const phase     = sim.phase;
    const wind      = sim.windSpeed;     // sim.wind  → sim.windSpeed
    const pwm       = sim.pwmDuty;       // sim.pwm   → sim.pwmDuty

    // 이하 동일
}
```

2. handleStateUpdateFromWs() — 동일 필드명 정정

```js
function handleStateUpdateFromWs(data) {
    if (!data) return;
    const sim = data.sim || {};
    const simActive = sim.active;
    const phase     = sim.phase;
    const wind      = sim.windSpeed;
    const pwm       = sim.pwmDuty;
    // 이하 동일
}
```

WS /state는 여전히 sim을 안 보내므로 data.sim이 없어 {}가 됩니다. 이 함수가 sim을 채우려면 백엔드가 WS /state에 sim 병합해야 함.

3. 백엔드 — exportStateJson_v02에 sim 병합 (권장)

CT10_Ctl_IOWS_070.cpp의 exportStateJson_v02() 끝에 추가:

```cpp
    // 10) Simulation snapshot (S10 toJson 병합)
    sim.toJson(p_doc);
```

이렇게 하면:

· REST /api/v001/state 응답에 sim 포함
· WS /state push 메시지에도 sim 포함
· 프론트는 별도 /simulation 호출 없이 state 하나로 처리 가능

---

4. saveMotionPatch() — 실제 저장 안 됨

```js
// 현재 (flat body)
const body = {
    windIntensity: 70, gustFrequency: 45, ...
};
```

백엔드 S10::patchFromJson():

```cpp
JsonObjectConst v_sim = p_doc["sim"].as<JsonObjectConst>();
if (v_sim.isNull()) return false;   // ← 항상 실패
```

수정:

```js
async function saveMotionPatch() {
    const body = {
        sim: {
            presetCode:      elPreset().value || null,
            intensity:       Number(elIntensity().value   || 0),
            variability:     Number(elVariability().value || 0),
            gustFreq:        Number(elGustFreq().value    || 0),
            fanLimit:        Number(elFanLimit().value    || 0),
            minFan:          Number(elMinFan().value      || 0),
            turbLenScale:    Number(elTurbLen().value     || 0),
            turbSigma:       Number(elTurbSig().value     || 0),
            thermalStrength: Number(elThermStr().value    || 0),
            thermalRadius:   Number(elThermRad().value    || 0)
        }
    };
    // 이하 동일
}
```

키 매핑 표:

프론트 (기존) 백엔드 sim.*
windIntensity intensity
windVariability variability
gustFrequency gustFreq
turbulenceLengthScale turbLenScale
turbulenceIntensitySigma turbSigma
thermalBubbleStrength thermalStrength
thermalBubbleRadius thermalRadius

---

📊 최종 상태

라운드 항목 상태
R1 WiFi state 신설 ✅
R1 WS 핸드셰이크 인증 ✅
R1 WiFi 30초 폴링 ✅
R1 WS WiFi 덮어쓰기 버그 ✅
R2 sim 소스 & 필드명 ⏳
R2 saveMotionPatch body ⏳
R2 loadConfig motion 소스 ⏳

---

🎯 권장 진행 순서

1단계 (프론트만, 즉시 가능) — P010_main_070.js 수정

· loadStateOnce() 필드명 정정
· handleStateUpdateFromWs() 필드명 정정
· saveMotionPatch() body 수정

2단계 (백엔드 1줄) — CT10_Ctl_IOWS_070.cpp exportStateJson_v02()에 sim.toJson(p_doc) 추가

3단계 (프론트 정리) — 2단계 후 loadStateOnce()에서 별도 /simulation 호출 불필요 → state 하나로 통합

---

어느 방향으로 갈까요?

· (A) 1단계만 지금 완성본으로 → 즉시 동작 확인 가능
· (B) 1+2단계 동시 → 상태 완전 통합 (권장)
· (C) 현 상태 유지, 다음 라운드로

(B)를 하면 /api/v001/state 응답 하나로 sim까지 다 오므로 프론트가 단순해집니다. 다만 백엔드 배포가 필요합니다.
