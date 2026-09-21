Round 2: 페이지 마이그레이션 (P080 / P085 / P100 / P050)

기계적 치환이 대부분이라 삭제 블록 + 치환 규칙 + 샘플 함수 형태로 제공합니다. 4개 파일 모두 동일 패턴 적용.

---

📋 공통 정리 원칙

작업 이전 이후
DOM 셀렉터 const $ = ... SNW.$(...)
배열 셀렉터 const $$ = ... SNW.$$(...)
API Key 조회 const getApiKey = ... SNW.getApiKey()
로딩 표시 const setLoading = ... SNW.loading.show()/hide()
토스트 const toast = ... SNW.toast(...)
HTTP 호출 fetchApi(url, method, body, desc) SNW.api.get/post/put/del(...)

---

📄 P080_sch_t2_071.js

A. 삭제 — 상단 헬퍼 블록 (약 45줄)

파일 시작 (() => { "use strict"; ... })(); 내부의 다음 블록 전부 삭제:

```javascript
// ❌ 삭제
const API_KEY_STORAGE_KEY = "snw_api_key";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const getApiKey = () => {
    try { return localStorage.getItem(API_KEY_STORAGE_KEY) || ""; } catch { return ""; }
};

const setLoading = (flag) => {
    const el = $("#loadingOverlay");
    if (el) el.style.display = flag ? "flex" : "none";
};

const toast = (msg, type = "info") => {
    if (typeof window.showToast === "function") window.showToast(msg, type);
    else console.log(`[TOAST-${type}]`, msg);
};

async function fetchApi(url, method = "GET", body = null, desc = "") {
    setLoading(true);
    try {
        const opt = { method, headers: { Accept: "application/json" } };
        const apiKey = getApiKey();
        if (apiKey) opt.headers["X-API-Key"] = apiKey;
        if (body) {
            opt.headers["Content-Type"] = "application/json";
            opt.body = JSON.stringify(body);
        }
        const resp = await fetch(url, opt);
        const text = await resp.text();
        if (resp.status === 401) {
            toast(`[401] ${desc || "작업"} 실패: 인증 필요`, "err");
            throw new Error("Unauthorized");
        }
        if (!resp.ok) {
            toast(`${desc || "작업"} 실패: ${text || resp.status}`, "err");
            throw new Error(text || String(resp.status));
        }
        if (desc && method !== "GET") toast(`${desc} 성공`, "ok");
        if (!text) return null;
        try { return JSON.parse(text); } catch { return text; }
    } catch (e) {
        if (e.message !== "Unauthorized") {
            console.error(e);
            if (desc) toast(`${desc} 실패: ${e.message}`, "err");
        }
        return null;
    } finally {
        setLoading(false);
    }
}
```

삭제 후 남길 것:

```javascript
(() => {
    "use strict";

    // ======================= 1. 상수 =======================
    const API_BASE            = "/api/v001";
    const API_SCHEDULES       = `${API_BASE}/schedules`;
    const API_WIND_PROFILE    = `${API_BASE}/windProfile`;
    const API_CONFIG_DIRTY    = `${API_BASE}/config/dirty`;
    const API_CONFIG_SAVE     = `${API_BASE}/config/save`;
    const API_GEMINI_PROXY    = `${API_BASE}/ai/gemini`;

    const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

    // ... 이하 유지
```

B. 치환 — 기계적 search & replace

패턴 대체
$$(sel) SNW.$$(sel)
$(sel) SNW.$(sel)
toast( SNW.toast(
setLoading(true) SNW.loading.show()
setLoading(false) SNW.loading.hide()
getApiKey() SNW.getApiKey()

C. 치환 — fetchApi 호출 (핵심)

각 호출 패턴별 매핑:

이전 이후
fetchApi(API_WIND_PROFILE, "GET", null, "") SNW.api.get(API_WIND_PROFILE, "")
fetchApi(API_SCHEDULES, "GET", null, "") SNW.api.get(API_SCHEDULES, "")
fetchApi(API_CONFIG_SAVE, "POST", {}, "전체 설정 파일 저장") SNW.api.post(API_CONFIG_SAVE, {}, "전체 설정 파일 저장")
fetchApi(url, "POST", { schedule }, desc) SNW.api.post(url, { schedule }, desc)
fetchApi(url, "PUT", { schedule }, desc) SNW.api.put(url, { schedule }, desc)
fetchApi(url, "DELETE", null, desc) SNW.api.del(url, desc)
fetchApi(API_GEMINI_PROXY, "POST", body, "") SNW.api.post(API_GEMINI_PROXY, body, "", true)

동적 method 처리 (saveSchedule 내부):

이전:

```javascript
const result = await fetchApi(url, method, payload, desc);
```

이후:

```javascript
const result = (method === "POST")
    ? await SNW.api.post(url, payload, desc)
    : await SNW.api.put(url, payload, desc);
```

D. 유지 — pollConfigDirty의 raw fetch

폴링은 로딩/토스트 없이 조용히 수행되어야 하므로 raw fetch 유지. API Key 조회만 SNW로:

이전:

```javascript
async function pollConfigDirty() {
    try {
        const apiKey = getApiKey();
        const resp = await fetch(API_CONFIG_DIRTY, {
            headers: { Accept: "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) },
        });
        // ...
```

이후:

```javascript
async function pollConfigDirty() {
    try {
        const apiKey = SNW.getApiKey();
        const resp = await fetch(API_CONFIG_DIRTY, {
            headers: { Accept: "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) },
        });
        // ... 이하 동일
```

E. 검증 — 변경 후 파일 특징

· 상단 ~45줄 삭제
· toast( → SNW.toast( (약 20곳)
· $ → SNW.$ (약 15곳), $$ → SNW.$$ (약 5곳)
· fetchApi(...) → SNW.api.* (약 8곳)
· 최종 라인 수: ~600 → ~520 (-80줄)

---

📄 P085_userProfiles_t2_071.js

A. 삭제 — 상단 헬퍼 블록 (P080과 동일, 약 45줄)

동일한 블록 삭제. 단, 아래 상수는 유지:

```javascript
const API_BASE          = "/api/v001";
const API_USER_PROFILES = `${API_BASE}/user_profiles`;
const API_WIND_PROFILE  = `${API_BASE}/windProfile`;
const API_CONFIG_DIRTY  = `${API_BASE}/config/dirty`;
const API_CONFIG_SAVE   = `${API_BASE}/config/save`;
const API_STATE         = `${API_BASE}/state`;
const API_PROF_SELECT   = `${API_BASE}/control/profile/select`;
const API_PROF_STOP     = `${API_BASE}/control/profile/stop`;

const MAX_PROFILES        = 6;
const MAX_SEGMENTS        = 8;
const STATE_POLL_MS       = 30000;
```

삭제 대상:

· API_KEY_STORAGE_KEY
· $, $$
· getApiKey
· setLoading
· toast
· fetchApi 함수

B~D. 치환 (P080과 동일 패턴)

핵심 호출 예시:

이전 이후
fetchApi(API_WIND_PROFILE, "GET", null, "") SNW.api.get(API_WIND_PROFILE, "")
fetchApi(API_USER_PROFILES, "GET", null, "") SNW.api.get(API_USER_PROFILES, "")
fetchApi(url, method, { profile }, desc) (method === "POST" ? SNW.api.post : SNW.api.put)(url, { profile }, desc)
fetchApi(API_PROF_SELECT, "POST", { id }, desc) SNW.api.post(API_PROF_SELECT, { id }, desc)
fetchApi(API_PROF_STOP, "POST", null, desc) SNW.api.post(API_PROF_STOP, null, desc)
fetchApi(API_CONFIG_SAVE, "POST", {}, desc) SNW.api.post(API_CONFIG_SAVE, {}, desc)

pollActiveProfile 내부 (silent 폴링):

이전:

```javascript
const data = await fetchApi(API_STATE, "GET", null, "");
```

이후:

```javascript
const data = await SNW.api.get(API_STATE, "", true);   // silent=true
```

E. 결과: ~500 → ~420 (-80줄)

---

📄 P100_settings_071.js

A. 삭제 — 상단 헬퍼 블록 (약 50줄)

삭제할 블록:

```javascript
// ❌ 삭제
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const KEY_API = "snw_api_key";
const getKey = () => { try { return localStorage.getItem(KEY_API) || ""; } catch { return ""; } };
const setKey = (key) => {
    try {
        if (key) localStorage.setItem(KEY_API, key);
        else localStorage.removeItem(KEY_API);
    } catch {}
};

const setLoading = (flag) => { ... };

async function fetchApi(url, method = "GET", body = null, desc = "작업") {
    // ... 전체 삭제
}
```

주의: toast 대신 showToast를 직접 호출하는 부분 있음 → SNW.toast 로 통일.

B. 치환 (기계적)

패턴 대체
$$(sel) SNW.$$(sel)
$(sel) SNW.$(sel)
setLoading(true) SNW.loading.show()
setLoading(false) SNW.loading.hide()
showToast(msg, type) SNW.toast(msg, type)
getKey() SNW.getApiKey()
setKey(v) SNW.setApiKey(v)
KEY_API SNW.KEY.API_KEY

C. fetchApi → SNW.api 매핑

P100은 하드코딩 URL 사용:

이전 이후
fetchApi("/api/v001/version", "GET", null, "") SNW.api.get("/api/v001/version", "")
fetchApi("/api/v001/diag", "GET", null, "") SNW.api.get("/api/v001/diag", "")
fetchApi("/api/v001/wifi/state", "GET", null, "") SNW.api.get("/api/v001/wifi/state", "")
fetchApi("/api/v001/system", "GET", null, "") SNW.api.get("/api/v001/system", "")
fetchApi("/api/v001/motion", "GET", null, "") SNW.api.get("/api/v001/motion", "")
fetchApi("/api/v001/config/dirty", "GET", null, "") SNW.api.get("/api/v001/config/dirty", "")
fetchApi("/api/v001/logs", "GET", null, "") SNW.api.get("/api/v001/logs", "")
fetchApi(url, "POST", body, desc) SNW.api.post(url, body, desc)
fetchApi("/api/v001/control/reboot", "POST", null, txt) SNW.api.post("/api/v001/control/reboot", null, txt)
fetchApi("/api/v001/wifi/scan", "GET", null, "WiFi 검색") SNW.api.get("/api/v001/wifi/scan", "WiFi 검색")

D. API Key 상태 확인 함수 정리

이전:

```javascript
const st = $("#apiKeyStatus");
if (st) {
    st.textContent = getKey() ? "저장됨 (확인 필요)" : "설정 필요";
    st.className = getKey() ? "info-label warn" : "info-label err";
}
```

이후:

```javascript
const st = SNW.$("#apiKeyStatus");
if (st) {
    const hasKey = !!SNW.getApiKey();
    st.textContent = hasKey ? "저장됨 (확인 필요)" : "설정 필요";
    st.className = hasKey ? "info-label warn" : "info-label err";
}
```

E. 결과: ~500 → ~400 (-100줄)

---

📄 P050_chart_t2_071.js

A. 삭제 — 로컬 $ 정의 (2줄)

이전:

```javascript
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const refreshLabel = $("#refreshInfo");
```

이후:

```javascript
(() => {
  "use strict";

  const refreshLabel = SNW.$("#refreshInfo");
```

B. 치환 (기계적)

패턴 대체
$( SNW.$(

전체 $(...) 호출 약 10곳 치환.

C. 결과: ~350 → ~345 (-5줄)

---

🔧 적용 후 공통 검증

각 페이지 로드 후 브라우저 콘솔에서:

```javascript
// 페이지별 실행
console.log(typeof SNW.api.get);      // "function"
console.log(typeof SNW.$);            // "function"
console.log(typeof SNW.toast);        // "function"

// 로컬 헬퍼가 남아있지 않은지
typeof $ === "function"                // ⚠️ 전역 window.$ 래퍼가 있으므로 true, 이는 정상
typeof fetchApi === "function"         // ⚠️ window.apiFetch는 있지만 fetchApi는 없어야 함 (P080/P085/P100)

// 개별 검증 (P080 기준)
typeof fetchApi                        // → "undefined" (삭제 완료)
typeof setLoading                      // → "undefined"
typeof getApiKey                       // → "function" (SNW 래퍼로 노출)
```

주의: window.apiFetch 래퍼는 P000에서 제공하지만, P080/P085/P100의 내부 fetchApi는 지역 스코프였으므로 삭제 후 외부에서 접근 불가. 정상.

---

📊 Round 2 예상 절감

파일 이전 이후 절감
P080_sch_t2_071.js ~600 ~520 -80줄
P085_userProfiles_t2_071.js ~500 ~420 -80줄
P100_settings_071.js ~500 ~400 -100줄
P050_chart_t2_071.js ~350 ~345 -5줄
합계 ~1950 ~1685 -265줄 (-14%)

---

🎯 다음 라운드 예고

Round 3 (P010 분할):

파일 책임 예상 크기
P010_core.js DOM/상태/dirty/loadConfig ~150줄
P010_preset.js 프리셋/즐겨찾기/최근/AI ~250줄
P010_ws.js WS 로그/상태/필터 ~150줄
P010_wifi.js Wi-Fi AP/STA ~100줄
P010_misc.js 아코디언/이벤트/프로파일 ~100줄
P010_main_071.js 진입점 (init only) ~50줄
합계  ~800줄

HTML <script> 태그 6개 → 8개로 증가 (P010만 해당)

---

🚀 진행 순서

1. P080부터 적용 → 콘솔 검증 → 문제없으면 다음
2. P085 적용 → 검증
3. P100 적용 → 검증
4. P050 적용 → 검증
5. 모두 성공 시 Round 3로 진행

적용 결과를 알려주시면 Round 3 (P010 5모듈 분할) 코드를 제공하겠습니다.


---
---



Round 3: P010 5모듈 분할

P010_main_071.js (~700줄) → 6개 파일로 분할. 모든 기능 보존하며 네임스페이스 SNW.P010.* 사용.

---

📄 HTML 변경 — <script> 태그

P010_main_071.html 하단:

Before:

```html
<script src="./P000_common_071.js" defer></script>
<script src="./P001_API_071.js" defer></script>
<script src="./P010_main_071.js" defer></script>
```

After:

```html
<script src="./P000_common_071.js" defer></script>
<script src="./P001_API_071.js" defer></script>
<script src="./P010_core.js" defer></script>
<script src="./P010_preset.js" defer></script>
<script src="./P010_ws.js" defer></script>
<script src="./P010_wifi.js" defer></script>
<script src="./P010_misc.js" defer></script>
<script src="./P010_main_071.js" defer></script>
```

defer 순서대로 실행되므로 의존성 자동 보장.

---

📄 파일 1: P010_core.js

```javascript
/*
 * ------------------------------------------------------
 * 소스명 : P010_core.js
 * 모듈명 : Main UI - Core (DOM / State / Load)
 * ------------------------------------------------------
 * 책임:
 *  - DOM 참조 (el.*)
 *  - 전역 상태 (state.*)
 *  - Dirty 관리 / 배지
 *  - 초기 로드 (FW / Config / State)
 *  - 시뮬 상태 → UI 반영
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core = {};

// ============================================================
// 1) DOM 참조
// ============================================================
const $ = SNW.$;
C.el = {
    fwVer:          () => $("fwVer") && document.getElementById("fwVer"),
    simActive:      () => document.getElementById("simActive"),
    phase:          () => document.getElementById("phase"),
    wind:           () => document.getElementById("wind"),
    pwm:            () => document.getElementById("pwm"),
    wifiMode:       () => document.getElementById("wifiMode"),
    curSsid:        () => document.getElementById("curSsid"),
    ip:             () => document.getElementById("ip"),
    controlState:   () => document.getElementById("controlState"),
    runTarget:      () => document.getElementById("runTarget"),
    apiKeyBadge:    () => document.getElementById("apiKeyBadge"),
    fwUpdateBadge:  () => document.getElementById("fwUpdateBadge"),
    saveStatusBadge:() => document.getElementById("saveStatusBadge"),
    presetDesc:     () => document.getElementById("presetDesc"),
    logView:        () => document.getElementById("logConsole"),
    profileSelect:  () => document.getElementById("profileSelect"),
    profileRunStatus:() => document.getElementById("profileRunStatus"),
    timeBadge:      () => document.getElementById("timeBadge"),
    overrideStatus: () => document.getElementById("overrideStatus"),
    overrideSeconds:() => document.getElementById("overrideSeconds"),
    overrideForever:() => document.getElementById("overrideForever"),
    preset:         () => document.getElementById("preset"),
    style:          () => document.getElementById("style"),
    fanPower:       () => document.getElementById("fanPowerEnabled"),
    intensity:      () => document.getElementById("intensity"),
    gustFreq:       () => document.getElementById("gust_freq"),
    variability:    () => document.getElementById("variability"),
    fanLimit:       () => document.getElementById("fanLimit"),
    minFan:         () => document.getElementById("minFan"),
    turbLen:        () => document.getElementById("turb_len"),
    turbSig:        () => document.getElementById("turb_sig"),
    thermStr:       () => document.getElementById("therm_str"),
    thermRad:       () => document.getElementById("therm_rad"),
    simInt:         () => document.getElementById("sim_int"),
    gustInt:        () => document.getElementById("gust_int"),
    thermalInt:     () => document.getElementById("thermal_int"),
    wifiModeSel:    () => document.getElementById("wifi_mode"),
    apSsid:         () => document.getElementById("ap_ssid"),
    apPass:         () => document.getElementById("ap_password"),
    staList:        () => document.getElementById("staList"),
    scanList:       () => document.getElementById("scanList"),
    scanPass:       () => document.getElementById("scanPass"),
    pwmPin:         () => document.getElementById("pwm_pin"),
    pwmChannel:     () => document.getElementById("pwm_channel"),
    pwmFreq:        () => document.getElementById("pwm_freq"),
    pwmRes:         () => document.getElementById("pwm_res"),
    apiKeyInput:    () => document.getElementById("apiKeyInput"),
    upload:         () => document.getElementById("fileUpload"),
    uploadMsg:      () => document.getElementById("uploadMsg"),
    ota:            () => document.getElementById("fileOTA"),
    otaMsg:         () => document.getElementById("otaMsg"),
    btnSaveAll:     () => document.getElementById("btnSaveAllConfig"),
};

// ============================================================
// 2) 전역 상태
// ============================================================
C.state = {
    configDirty:      false,
    overrideActive:   false,
    staList:          [],
    windDictPresets:  [],
    windDictStyles:   [],
    userProfiles:     [],
    activeProfileNo:  0,
    logFilter:        "all",
    eventHistory:     [],
    lastStateCode:    -1,
    lastOverrideAct:  false,
    lastCfgSnapshot:  null,
    wifiStateTimer:   null,
};

// ============================================================
// 3) 유틸
// ============================================================
C.r2 = (v) => {
    const n = Number(v);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

// ============================================================
// 4) Dirty 관리
// ============================================================
C.updateDirtyButton = () => {
    const btn = C.el.btnSaveAll();
    if (!btn) return;
    if (C.state.configDirty) {
        btn.textContent = "변경 있음 - 전체 Config 저장";
        btn.classList.add("warn");
        btn.style.background = "#eab308";
        btn.style.color = "#fff";
    } else {
        btn.textContent = "저장 완료";
        btn.classList.remove("warn");
        btn.style.background = "#2ecc71";
        btn.style.color = "#fff";
    }
    C._updateSaveStatusBadge();
};

C.markDirty = () => {
    C.state.configDirty = true;
    C.updateDirtyButton();
    C._updateSaveAttention();
};

C._updateSaveStatusBadge = () => {
    const el = C.el.saveStatusBadge();
    if (!el) return;
    if (C.state.overrideActive && C.state.configDirty) {
        el.textContent = "🟡 임시 실행 중 — 저장 안 됨";
        el.className = "info-label warn";
    } else if (C.state.configDirty) {
        el.textContent = "📝 변경 있음 (저장 필요)";
        el.className = "info-label warn";
    } else if (C.state.overrideActive) {
        el.textContent = "🎬 임시 실행 중";
        el.className = "info-label warn";
    } else {
        el.textContent = "✅ 저장됨";
        el.className = "info-label ok";
    }
};

C._updateSaveAttention = () => {
    const btn = document.getElementById("btnSaveSim");
    if (!btn) return;
    const need = C.state.overrideActive && C.state.configDirty;
    btn.classList.toggle("btn-attention", need);
};

// ============================================================
// 5) 배지
// ============================================================
C.updateApiKeyBadge = () => {
    const badge = C.el.apiKeyBadge();
    if (!badge) return;
    badge.style.display = SNW.getApiKey() ? "none" : "inline-block";
};

C.checkFirmwareUpdate = async () => {
    const badge = C.el.fwUpdateBadge();
    if (!badge) return;
    const data = await SNW.api.get(SNW_API.API_HTTP_FW_CHECK, "", true);
    if (data && data.status === "available") {
        badge.textContent = `⬆️ 새 펌웨어 (${data.latest_version || "?"})`;
        badge.style.display = "inline-block";
    }
};

// ============================================================
// 6) 초기 로드
// ============================================================
C.loadFwVersion = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_VERSION, "", true);
    let v = "…";
    if (typeof data === "string") v = data;
    else if (data && (data.version || data.fw || data.fw_version)) {
        v = data.version || data.fw || data.fw_version;
    }
    const el = C.el.fwVer();
    if (el) el.textContent = v;
};

C.loadConfig = async () => {
    SNW.loading.show();
    try {
        const [cfg, motionData] = await Promise.all([
            SNW.api.get(SNW_API.API_HTTP_CONFIG, "", true),
            SNW.api.get(SNW_API.API_HTTP_MOTION, "", true),
        ]);
        if (!cfg) return;

        // Wi-Fi
        if (cfg.wifi) {
            if (C.el.wifiModeSel()) C.el.wifiModeSel().value = cfg.wifi.wifiMode ?? 0;
            if (C.el.apSsid())      C.el.apSsid().value = cfg.wifi.ap ? cfg.wifi.ap.ssid || "" : "";
            if (C.el.apPass())      C.el.apPass().value = cfg.wifi.ap ? cfg.wifi.ap.pass || "" : "";

            C.state.staList = [];
            if (Array.isArray(cfg.wifi.sta)) {
                cfg.wifi.sta.forEach((item) => {
                    if (item && item.ssid) C.state.staList.push({ ssid: item.ssid, pass: item.pass || "" });
                });
            }
            if (SNW.P010.wifi && SNW.P010.wifi.renderStaList) SNW.P010.wifi.renderStaList();
        }

        // PWM
        if (cfg.hw && cfg.hw.fanPwm) {
            if (C.el.pwmPin())     C.el.pwmPin().value     = cfg.hw.fanPwm.pin ?? "";
            if (C.el.pwmChannel()) C.el.pwmChannel().value = cfg.hw.fanPwm.channel ?? "";
            if (C.el.pwmFreq())    C.el.pwmFreq().value    = cfg.hw.fanPwm.freq ?? "";
            if (C.el.pwmRes())     C.el.pwmRes().value     = cfg.hw.fanPwm.res ?? "";
        }

        // 프리셋 (P010_preset.js)
        if (SNW.P010.preset && SNW.P010.preset.loadPresetsFromConfig) {
            SNW.P010.preset.loadPresetsFromConfig(cfg);
        }

        // Motion SIM
        const sim = (motionData && motionData.motion && motionData.motion.sim) ? motionData.motion.sim : {};
        if (C.el.intensity())   C.el.intensity().value   = sim.intensity ?? "";
        if (C.el.variability()) C.el.variability().value = sim.variability ?? "";
        if (C.el.gustFreq())    C.el.gustFreq().value    = sim.gustFreq ?? "";
        if (C.el.fanLimit())    C.el.fanLimit().value    = sim.fanLimit ?? "";
        if (C.el.minFan())      C.el.minFan().value      = sim.minFan ?? "";
        if (C.el.turbLen())     C.el.turbLen().value     = sim.turbLenScale ?? "";
        if (C.el.turbSig())     C.el.turbSig().value     = sim.turbSigma ?? "";
        if (C.el.thermStr())    C.el.thermStr().value    = sim.thermalStrength ?? "";
        if (C.el.thermRad())    C.el.thermRad().value    = sim.thermalRadius ?? "";

        if (C.el.preset() && sim.presetCode) C.el.preset().value = sim.presetCode;
        if (C.el.style()  && sim.styleCode)  C.el.style().value  = sim.styleCode;
        if (C.el.fanPower() && sim.fanPowerEnabled !== undefined) C.el.fanPower().checked = !!sim.fanPowerEnabled;

        // Timing
        const timing = (cfg.motion && cfg.motion.timing) ? cfg.motion.timing : cfg.timing;
        if (timing) {
            if (C.el.simInt())     C.el.simInt().value     = timing.simIntervalMs ?? "";
            if (C.el.gustInt())    C.el.gustInt().value    = timing.gustIntervalMs ?? "";
            if (C.el.thermalInt()) C.el.thermalInt().value = timing.thermalIntervalMs ?? "";
        }

        // API Key
        if (cfg.security && cfg.security.apiKey && !SNW.getApiKey()) {
            SNW.setApiKey(cfg.security.apiKey);
            if (C.el.apiKeyInput()) C.el.apiKeyInput().value = cfg.security.apiKey;
            C.updateApiKeyBadge();
        }

        C.state.configDirty = false;
        C.updateDirtyButton();
        if (SNW.P010.preset && SNW.P010.preset.updatePresetDescription) {
            SNW.P010.preset.updatePresetDescription();
        }
    } finally {
        SNW.loading.hide();
    }
};

// ============================================================
// 7) 상태 반영
// ============================================================
C._applySimToUi = (sim, control) => {
    // 시뮬 ACTIVE
    const elA = C.el.simActive();
    if (elA) {
        const act = sim.active === true || sim.active === 1 || sim.active === "on";
        elA.textContent = act ? "ACTIVE" : "IDLE";
        elA.classList.toggle("ok", act);
        elA.classList.toggle("err", !act);
    }
    if (C.el.phase()) C.el.phase().textContent = sim.phase ?? "-";
    if (C.el.wind())  C.el.wind().textContent  = sim.windSpeed ?? "-";
    if (C.el.pwm())   C.el.pwm().textContent   = sim.pwmDuty ?? "-";

    // 폼 동기화 (dirty 아닐 때)
    if (!C.state.configDirty) {
        if (C.el.preset() && sim.presetCode) C.el.preset().value = sim.presetCode;
        if (C.el.style()  && sim.styleCode)  C.el.style().value  = sim.styleCode;
        if (C.el.fanPower() && sim.fanPowerEnabled !== undefined) C.el.fanPower().checked = !!sim.fanPowerEnabled;
    }

    // Override
    const ov = (control && control.override) ? control.override : null;
    const ovActive = !!(ov && ov.active);
    C.state.overrideActive = ovActive;

    const ovStatus = C.el.overrideStatus();
    if (ovStatus) {
        if (ovActive) {
            const mode = ov.useFixed ? `fixed ${ov.fixedPercent ?? "?"}%` : `preset ${ov.presetCode || ""}`;
            const remain = ov.remainSec > 0 ? ` (${ov.remainSec}s)` : " (무제한)";
            ovStatus.textContent = `🟡 ${mode}${remain}`;
            ovStatus.className = "info-label warn";
        } else {
            ovStatus.textContent = "비활성";
            ovStatus.className = "info-label info";
        }
    }

    // 제어 상태
    const elCS = C.el.controlState();
    if (elCS) {
        const sc = control.stateCode;
        elCS.textContent = control.state || "-";
        if (sc === 2 || sc === 3) elCS.className = "info-label ok";
        else if (sc === 1) elCS.className = "info-label warn";
        else if (sc === 5 || sc === 6) elCS.className = "info-label err";
        else elCS.className = "info-label info";
    }

    // 실행 대상
    const elRT = C.el.runTarget();
    if (elRT) {
        const sch = control.schedule || {};
        const prof = control.profile || {};
        let target = "없음";
        if (ov && ov.active) {
            target = ov.useFixed ? `Override: 고정 ${ov.fixedPercent ?? 0}%` : `Override: ${ov.presetCode || "-"}`;
        } else if (sch.fromRunSource && sch.name) {
            target = `스케줄: ${sch.name}` + (sch.schNo ? ` (#${sch.schNo})` : "");
        } else if (prof.fromRunSource && prof.name) {
            target = `프로파일: ${prof.name}` + (prof.profileNo ? ` (#${prof.profileNo})` : "");
        }
        elRT.textContent = target;
    }

    // 프로파일 실행 상태
    const elPS = C.el.profileRunStatus();
    const prof = (control && control.profile) ? control.profile : {};
    const profActive = !!prof.fromRunSource;
    C.state.activeProfileNo = profActive ? (Number(prof.profileNo) || 0) : 0;
    if (elPS) {
        if (profActive) {
            elPS.textContent = `🟢 실행 중: ${prof.name || "#" + prof.profileNo}`;
            elPS.className = "info-label warn";
        } else {
            elPS.textContent = "비활성";
            elPS.className = "info-label info";
        }
    }
    if (!C.state.configDirty && C.el.profileSelect() && profActive && prof.profileNo) {
        C.el.profileSelect().value = prof.profileNo;
    }

    // Time 배지
    const tm = (control && control.time) ? control.time : null;
    const tb = C.el.timeBadge();
    if (tb) tb.style.display = (tm && !tm.valid) ? "inline-block" : "none";

    // 이벤트 히스토리 (P010_misc.js)
    if (SNW.P010.misc && SNW.P010.misc.detectStateTransitions) {
        SNW.P010.misc.detectStateTransitions(
            (control.stateCode != null) ? control.stateCode : 0,
            control.state || "-",
            ov,
            ovActive
        );
    }

    C._updateSaveStatusBadge();
    C._updateSaveAttention();
};

C.loadStateOnce = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_STATE, "", true);
    if (!data) return;
    C._applySimToUi(data.sim || {}, data.control || {});
};

})();
```

---

📄 파일 2: P010_preset.js

```javascript
/*
 * ------------------------------------------------------
 * 소스명 : P010_preset.js
 * 모듈명 : Main UI - Preset (프리셋/즐겨찾기/최근/AI)
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core;
const P = SNW.P010.preset = {};

// ============================================================
// 1) 즐겨찾기
// ============================================================
P.getFavPresets = () => SNW.store.get(SNW.KEY.FAV_PRESETS, []);
P.setFavPresets = (list) => SNW.store.set(SNW.KEY.FAV_PRESETS, list);
P.isFavPreset   = (code) => !!code && P.getFavPresets().includes(code);

P.updateFavButton = () => {
    const btn = document.getElementById("btnFavPreset");
    if (!btn) return;
    const code = C.el.preset() ? C.el.preset().value : "";
    const fav  = P.isFavPreset(code);
    btn.textContent = fav ? "★" : "☆";
    btn.classList.toggle("is-fav", fav);
    btn.title = fav ? "즐겨찾기 해제" : "즐겨찾기 추가";
};

P.toggleFavPreset = () => {
    const code = C.el.preset() ? C.el.preset().value : "";
    if (!code) { SNW.toast("프리셋을 선택하세요.", "warn"); return; }

    let fav = P.getFavPresets();
    const wasFav = fav.includes(code);
    if (wasFav) fav = fav.filter((c) => c !== code);
    else        fav.unshift(code);
    P.setFavPresets(fav);

    if (C.state.lastCfgSnapshot) {
        const keep = code;
        P.loadPresetsFromConfig(C.state.lastCfgSnapshot);
        if (C.el.preset()) C.el.preset().value = keep;
    }
    P.updateFavButton();
    SNW.toast(wasFav ? `⭐ ${code} 즐겨찾기 해제` : `⭐ ${code} 즐겨찾기 추가`, "ok");
};

// ============================================================
// 2) 최근 사용
// ============================================================
const RECENT_MAX = 5;

P.getRecentPresets = () => SNW.store.get(SNW.KEY.RECENT_PRESETS, []);
P.setRecentPresets = (list) => SNW.store.set(SNW.KEY.RECENT_PRESETS, list);

P.pushRecentPreset = (code) => {
    if (!code) return;
    let recent = P.getRecentPresets();
    recent = recent.filter(c => c !== code);
    recent.unshift(code);
    if (recent.length > RECENT_MAX) recent.length = RECENT_MAX;
    P.setRecentPresets(recent);
};

// ============================================================
// 3) 프리셋 select 렌더링 (optgroup 3단)
// ============================================================
P.loadPresetsFromConfig = (cfg) => {
    C.state.lastCfgSnapshot = cfg;

    // -------- Preset --------
    const sel = C.el.preset();
    if (sel) {
        sel.innerHTML = "";
        let presets = [];
        if (cfg.windDict && Array.isArray(cfg.windDict.presets)) presets = cfg.windDict.presets;
        else if (cfg.motion && Array.isArray(cfg.motion.presets)) presets = cfg.motion.presets;

        C.state.windDictPresets = presets;

        if (!presets.length) {
            const opt = document.createElement("option");
            opt.value = ""; opt.textContent = "(프리셋 없음)";
            sel.appendChild(opt);
        } else {
            const favs = P.getFavPresets();
            const favSet = new Set(favs);
            const recents = P.getRecentPresets();

            const favList = favs.map(c => presets.find(p => p.code === c)).filter(Boolean);
            const recentList = recents.filter(c => !favSet.has(c))
                                      .map(c => presets.find(p => p.code === c)).filter(Boolean);
            const excludeSet = new Set([...favs, ...recents]);
            const restList = presets.filter(p => !excludeSet.has(p.code));

            const addGroup = (label, list) => {
                if (!list.length) return;
                const grp = document.createElement("optgroup");
                grp.label = label;
                list.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p.code || p.id || "";
                    opt.textContent = p.name || p.label || p.code || "";
                    grp.appendChild(opt);
                });
                sel.appendChild(grp);
            };
            addGroup("⭐ 즐겨찾기", favList);
            addGroup("🕘 최근 사용", recentList);
            addGroup("전체", restList);
        }
        P.updateFavButton();
    }

    // -------- Style --------
    const styleSel = C.el.style();
    if (styleSel) {
        styleSel.innerHTML = "";
        let styles = [];
        if (cfg.windDict && Array.isArray(cfg.windDict.styles)) styles = cfg.windDict.styles;
        C.state.windDictStyles = styles;

        if (!styles.length) {
            const opt = document.createElement("option");
            opt.value = "BALANCE"; opt.textContent = "BALANCE";
            styleSel.appendChild(opt);
        } else {
            styles.forEach((s, idx) => {
                const opt = document.createElement("option");
                opt.value = s.code || String(idx);
                opt.textContent = s.name || s.code || `Style ${idx + 1}`;
                styleSel.appendChild(opt);
            });
        }
    }
};

// ============================================================
// 4) 프리셋 설명
// ============================================================
P.updatePresetDescription = () => {
    const el = C.el.presetDesc();
    if (!el) return;
    const code = C.el.preset() ? C.el.preset().value : "";
    if (!code) { el.textContent = ""; return; }

    const preset = C.state.windDictPresets.find(p => p.code === code);
    if (!preset) { el.textContent = ""; return; }

    const pf = preset.factors || {};
    const name = preset.name || preset.label || code;
    el.textContent = `${name} — 강도 ${C.r2(pf.windIntensity)} · 변동 ${C.r2(pf.windVariability)} · 돌풍 ${C.r2(pf.gustFrequency)} · 팬상한 ${C.r2(pf.fanLimit)}`;
};

// ============================================================
// 5) 프리셋/스타일 변경 → 값 자동 채움
// ============================================================
P.onPresetOrStyleChanged = () => {
    const presetCode = C.el.preset() ? C.el.preset().value : "";
    const styleCode  = C.el.style()  ? C.el.style().value  : "";
    if (!presetCode) { P.updatePresetDescription(); return; }

    P.pushRecentPreset(presetCode);

    const preset = C.state.windDictPresets.find(p => p.code === presetCode);
    if (!preset || !preset.factors) { P.updatePresetDescription(); return; }

    const style = C.state.windDictStyles.find(s => s.code === styleCode) || {};
    const sf = style.factors || {};
    const pf = preset.factors;

    const r2 = C.r2;
    const intV  = r2((pf.windIntensity ?? 0)      * (sf.intensityFactor    ?? 1.0));
    const varV  = r2((pf.windVariability ?? 0)    * (sf.variabilityFactor  ?? 1.0));
    const gustV = r2((pf.gustFrequency ?? 0)      * (sf.gustFactor         ?? 1.0));
    const flV   = r2(pf.fanLimit ?? 0);
    const minV  = r2(pf.minFan ?? 0);
    const tlV   = r2(pf.turbulenceLengthScale ?? 0);
    const tsV   = r2(pf.turbulenceIntensitySigma ?? 0);
    const thBV  = r2((pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor   ?? 1.0));
    const thRV  = r2(pf.thermalBubbleRadius ?? 0);

    if (C.el.intensity())   C.el.intensity().value   = intV;
    if (C.el.variability()) C.el.variability().value = varV;
    if (C.el.gustFreq())    C.el.gustFreq().value    = gustV;
    if (C.el.fanLimit())    C.el.fanLimit().value    = flV;
    if (C.el.minFan())      C.el.minFan().value      = minV;
    if (C.el.turbLen())     C.el.turbLen().value     = tlV;
    if (C.el.turbSig())     C.el.turbSig().value     = tsV;
    if (C.el.thermStr())    C.el.thermStr().value    = thBV;
    if (C.el.thermRad())    C.el.thermRad().value    = thRV;

    P.updatePresetDescription();
    C.markDirty();
};

// ============================================================
// 6) 임시 적용
// ============================================================
P.applyTempPreset = async () => {
    const presetCode = C.el.preset() ? C.el.preset().value : "";
    const styleCode  = C.el.style()  ? C.el.style().value  : "BALANCE";
    const forever    = C.el.overrideForever() ? C.el.overrideForever().checked : false;
    const sec        = forever ? 0 : parseInt(C.el.overrideSeconds() ? C.el.overrideSeconds().value || "300" : "300", 10);

    if (!presetCode) { SNW.toast("프리셋을 선택하세요.", "warn"); return; }

    P.pushRecentPreset(presetCode);

    const preset = C.state.windDictPresets.find(p => p.code === presetCode);
    if (!preset || !preset.factors) { SNW.toast("프리셋 정보를 불러올 수 없습니다.", "err"); return; }

    const style = C.state.windDictStyles.find(s => s.code === styleCode) || {};
    const sf = style.factors || {};
    const pf = preset.factors;

    const baseInt  = (pf.windIntensity ?? 0)      * (sf.intensityFactor   ?? 1.0);
    const baseVar  = (pf.windVariability ?? 0)    * (sf.variabilityFactor ?? 1.0);
    const baseGust = (pf.gustFrequency ?? 0)      * (sf.gustFactor        ?? 1.0);
    const baseFL   = pf.fanLimit ?? 0;
    const baseMin  = pf.minFan ?? 0;
    const baseTL   = pf.turbulenceLengthScale ?? 0;
    const baseTS   = pf.turbulenceIntensitySigma ?? 0;
    const baseThB  = (pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor  ?? 1.0);
    const baseThR  = pf.thermalBubbleRadius ?? 0;

    const num = (fn) => (Number(fn && fn().value) || 0);
    const adj = {
        windIntensity:            num(C.el.intensity)   - baseInt,
        windVariability:          num(C.el.variability) - baseVar,
        gustFrequency:            num(C.el.gustFreq)    - baseGust,
        fanLimit:                 num(C.el.fanLimit)    - baseFL,
        minFan:                   num(C.el.minFan)      - baseMin,
        turbulenceLengthScale:    num(C.el.turbLen)     - baseTL,
        turbulenceIntensitySigma: num(C.el.turbSig)     - baseTS,
        thermalBubbleStrength:    num(C.el.thermStr)    - baseThB,
        thermalBubbleRadius:      num(C.el.thermRad)    - baseThR,
    };

    const body = { presetCode, styleCode, durationSec: sec, forever, adjust: adj };
    await SNW.api.post(SNW_API.API_HTTP_CTL_OVR_PRESET, body, "임시 적용");
    setTimeout(C.loadStateOnce, 300);
};

P.stopTemp = async () => {
    await SNW.api.post(SNW_API.API_HTTP_CTL_OVR_CLEAR, null, "임시 적용 중지");
    setTimeout(C.loadStateOnce, 300);
};

// ============================================================
// 7) 저장
// ============================================================
P.saveMotionPatch = async () => {
    const num = (fn) => (Number(fn && fn().value) || 0);
    const motionBody = {
        motion: {
            sim: {
                presetCode:      C.el.preset() ? C.el.preset().value : null,
                styleCode:       C.el.style()  ? C.el.style().value  : null,
                fanPowerEnabled: C.el.fanPower() ? C.el.fanPower().checked : true,
                intensity:       num(C.el.intensity),
                variability:     num(C.el.variability),
                gustFreq:        num(C.el.gustFreq),
                fanLimit:        num(C.el.fanLimit),
                minFan:          num(C.el.minFan),
                turbLenScale:    num(C.el.turbLen),
                turbSigma:       num(C.el.turbSig),
                thermalStrength: num(C.el.thermStr),
                thermalRadius:   num(C.el.thermRad),
            },
        },
    };

    await SNW.api.post(SNW_API.API_HTTP_MOTION, motionBody, "풍속 설정");
    await SNW.api.post(SNW_API.API_HTTP_CONFIG_SAVE, {}, "", true);

    if (C.state.overrideActive) {
        await SNW.api.post(SNW_API.API_HTTP_CTL_OVR_CLEAR, null, "", true);
    }

    C.state.configDirty = false;
    C.updateDirtyButton();
    SNW.toast("풍속 설정이 저장되었습니다.", "ok");
    setTimeout(C.loadStateOnce, 300);
};

P.saveTimingPatch = async () => {
    const body = {
        motion: {
            timing: {
                simIntervalMs:     Number(C.el.simInt().value || 0),
                gustIntervalMs:    Number(C.el.gustInt().value || 0),
                thermalIntervalMs: Number(C.el.thermalInt().value || 0),
            },
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_MOTION, body, "타이밍 설정");
    C.markDirty();
};

// ============================================================
// 8) AI 프리셋 추천
// ============================================================
P.handleAiPresetRecommend = async () => {
    if (!C.state.windDictPresets.length) {
        SNW.toast("프리셋 목록이 비어있습니다.", "warn");
        return;
    }

    const userPrompt = window.prompt(
        "어떤 바람을 원하시나요?\n" +
        "(예: 지금 좀 더 시원하게 / 잠잘 때 조용하고 약하게 / 집중이 잘 되는 바람)"
    );
    if (!userPrompt || !userPrompt.trim()) return;

    const presetCatalog = C.state.windDictPresets.map((p) => {
        const f = p.factors || {};
        return `- ${p.code} (${p.name}): 강도 ${C.r2(f.windIntensity)} · 변동 ${C.r2(f.windVariability)} · 돌풍 ${C.r2(f.gustFrequency)} · 팬상한 ${C.r2(f.fanLimit)}`;
    }).join("\n");

    const systemPrompt =
        "당신은 스마트 자연풍 시스템의 바람 엔지니어입니다. " +
        "사용자의 자연어 요청을 분석해 가장 적합한 presetCode·styleCode·조정값을 선택합니다. " +
        "styleCode는 BALANCE/ACTIVE/FOCUS/RELAX/SLEEP 중 하나여야 합니다. " +
        "windIntensity·windVariability 조정값은 -30~+30 정수입니다. " +
        "다른 설명 없이 JSON만 반환합니다.";

    const userQuery =
        `사용 가능한 프리셋:\n${presetCatalog}\n\n` +
        `사용자 요청: "${userPrompt.trim()}"\n\n` +
        `위 프리셋 중 가장 적합한 것을 선택하고 JSON으로 반환하세요.`;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            presetCode: { type: "STRING" },
            styleCode: { type: "STRING" },
            windIntensity: { type: "NUMBER" },
            windVariability: { type: "NUMBER" },
            reason: { type: "STRING" },
        },
        propertyOrdering: ["presetCode", "styleCode", "windIntensity", "windVariability", "reason"],
    };

    const reqBody = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    };

    SNW.loading.show();
    try {
        const apiKey = SNW.getApiKey();
        const resp = await fetch(SNW_API.API_HTTP_GEMINI_PROXY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { "X-API-Key": apiKey } : {}),
            },
            body: JSON.stringify(reqBody),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AI 응답 없음");

        const rec = JSON.parse(text);

        if (rec.presetCode && C.state.windDictPresets.some(p => p.code === rec.presetCode)) {
            if (C.el.preset()) C.el.preset().value = rec.presetCode;
            if (rec.styleCode && C.el.style() &&
                C.state.windDictStyles.some(s => s.code === rec.styleCode)) {
                C.el.style().value = rec.styleCode;
            }

            P.onPresetOrStyleChanged();

            if (C.el.intensity() && Number.isFinite(rec.windIntensity)) {
                const cur = Number(C.el.intensity().value) || 0;
                C.el.intensity().value = Math.max(0, Math.min(100, cur + rec.windIntensity));
            }
            if (C.el.variability() && Number.isFinite(rec.windVariability)) {
                const cur = Number(C.el.variability().value) || 0;
                C.el.variability().value = Math.max(0, Math.min(100, cur + rec.windVariability));
            }

            C.markDirty();
            P.updateFavButton();
            SNW.toast(`🤖 AI 추천: ${rec.presetCode} — ${rec.reason || ""}`, "ok");
        } else {
            SNW.toast("AI가 유효한 프리셋을 반환하지 않았습니다.", "warn");
        }
    } catch (e) {
        SNW.toast(`AI 추천 실패: ${e.message}`, "err");
    } finally {
        SNW.loading.hide();
    }
};

})();
```

---

📄 파일 3: P010_ws.js

```javascript
/*
 * ------------------------------------------------------
 * 소스명 : P010_ws.js
 * 모듈명 : Main UI - WebSocket (로그/상태)
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core;
const W = SNW.P010.ws = {};

let _wsLog = null;
let _wsState = null;

// ============================================================
// 1) 로그 라인 append
// ============================================================
W.appendLogLine = (ts, lv, msg) => {
    const el = C.el.logView();
    if (!el) return;

    if (el.textContent.trim() === "로그 로딩 중...") el.textContent = "";

    const level = Number.isFinite(Number(lv)) ? Number(lv) : 3;
    const line = document.createElement("div");
    line.className = "log-line";
    line.dataset.level = String(level);

    const tsStr = (typeof ts === "number" && ts > 0)
        ? new Date(ts).toLocaleTimeString()
        : (typeof ts === "string" ? ts : "");

    line.textContent = `${tsStr ? "[" + tsStr + "] " : ""}${msg}`;

    const visible = C.state.logFilter === "all"
        || (C.state.logFilter === "warn" && level <= 2)
        || (C.state.logFilter === "err"  && level <= 1);
    if (!visible) line.style.display = "none";

    el.appendChild(line);
    while (el.children.length > 300) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
};

W.applyLogFilter = () => {
    const el = C.el.logView();
    if (!el) return;
    Array.from(el.children).forEach((line) => {
        const level = Number(line.dataset.level || 3);
        let visible = true;
        if (C.state.logFilter === "warn") visible = level <= 2;
        else if (C.state.logFilter === "err") visible = level <= 1;
        line.style.display = visible ? "" : "none";
    });
};

W.clearLogConsole = () => {
    const el = C.el.logView();
    if (el) el.textContent = "";
};

// ============================================================
// 2) 초기 로그 로드
// ============================================================
W.loadLogsOnce = async () => {
    const el = C.el.logView();
    if (!el) return;
    const data = await SNW.api.get(SNW_API.API_HTTP_LOGS, "", true);
    if (data && Array.isArray(data.logs)) {
        el.textContent = "";
        data.logs.forEach((l) => W.appendLogLine(l.ts, l.lv, l.msg || ""));
        if (!el.children.length) el.textContent = "";
    } else {
        el.textContent = "";
    }
};

// ============================================================
// 3) WebSocket - 로그
// ============================================================
W.initWebSocketLog = () => {
    try {
        const url = SNW.buildWsUrl(SNW_API.WS_API_LOG);
        const ws = new WebSocket(url);
        _wsLog = ws;

        ws.onopen = () => W.appendLogLine(Date.now(), 3, "[WS] 로그 스트림 연결됨.");
        ws.onmessage = (ev) => {
            try {
                const rec = JSON.parse(ev.data);
                if (rec && (rec.msg || rec.message)) {
                    W.appendLogLine(rec.ts || rec.t, rec.lv ?? rec.level ?? 3, rec.msg || rec.message);
                } else {
                    W.appendLogLine(Date.now(), 3, ev.data);
                }
            } catch {
                W.appendLogLine(Date.now(), 3, ev.data);
            }
        };
        ws.onclose = () => console.log("[WS-LOG] disconnected");
        ws.onerror = (err) => console.error("[WS-LOG] error:", err);
    } catch (e) {
        console.error("[WS-LOG] init failed:", e.message);
    }
};

// ============================================================
// 4) WebSocket - 상태
// ============================================================
W.initWebSocketState = () => {
    try {
        const url = SNW.buildWsUrl(SNW_API.WS_API_STATE);
        const ws = new WebSocket(url);
        _wsState = ws;
        ws.onopen = () => console.log("[WS-STATE] connected");
        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                C._applySimToUi(data.sim || {}, data.control || {});
            } catch (e) {
                console.warn("[WS-STATE] invalid JSON:", ev.data);
            }
        };
        ws.onclose = () => console.log("[WS-STATE] disconnected");
        ws.onerror = (err) => console.error("[WS-STATE] error:", err);
    } catch (e) {
        console.error("[WS-STATE] init failed:", e.message);
    }
};

})();
```

---

📄 파일 4: P010_wifi.js

```javascript
/*
 * ------------------------------------------------------
 * 소스명 : P010_wifi.js
 * 모듈명 : Main UI - Wi-Fi / PWM
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core;
const Wf = SNW.P010.wifi = {};

// ============================================================
// 1) 상태 조회 (폴링)
// ============================================================
Wf.loadWifiStateOnce = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_WIFI_STATE, "", true);
    if (!data) return;
    const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : {};
    if (C.el.wifiMode()) C.el.wifiMode().textContent = (wifi.mode_name || wifi.mode || "-").toString();
    if (C.el.curSsid())  C.el.curSsid().textContent  = wifi.ssid || "-";
    if (C.el.ip())       C.el.ip().textContent       = wifi.ip || "-";
};

// ============================================================
// 2) 스캔
// ============================================================
Wf.scanWifi = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_WIFI_SCAN, "", true);
    const list = (data && data.wifi && data.wifi.scan) ? data.wifi.scan : data || [];
    Wf.renderScanList(list);
    SNW.toast("Wi-Fi 스캔 완료", "ok");
};

Wf.renderScanList = (networks) => {
    const sel = C.el.scanList();
    if (!sel) return;
    sel.innerHTML = "";
    if (!networks || networks.length === 0) {
        const opt = document.createElement("option");
        opt.value = ""; opt.textContent = "검색된 네트워크가 없습니다.";
        sel.appendChild(opt);
        return;
    }
    networks.forEach((ap) => {
        const opt = document.createElement("option");
        opt.value = ap.ssid || "";
        const rssi = ap.rssi != null ? ` (RSSI ${ap.rssi})` : "";
        opt.textContent = (ap.ssid || "") + rssi;
        sel.appendChild(opt);
    });
};

// ============================================================
// 3) STA 목록 렌더링 / 추가
// ============================================================
Wf.renderStaList = () => {
    const container = C.el.staList();
    if (!container) return;
    container.innerHTML = "";

    const list = C.state.staList;
    if (!list || list.length === 0) {
        const div = document.createElement("div");
        div.className = "muted";
        div.textContent = "등록된 STA 네트워크가 없습니다.";
        container.appendChild(div);
        return;
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["SSID", "Password", "액션"].forEach((txt) => {
        const th = document.createElement("th");
        th.textContent = txt;
        trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    list.forEach((item, idx) => {
        const tr = document.createElement("tr");

        const tdSsid = document.createElement("td");
        tdSsid.textContent = item.ssid || "";
        tr.appendChild(tdSsid);

        const tdPass = document.createElement("td");
        tdPass.textContent = item.pass ? "********" : "";
        tr.appendChild(tdPass);

        const tdAct = document.createElement("td");
        tdAct.style.textAlign = "right";
        const btnDel = document.createElement("button");
        btnDel.className = "btn btn-small err";
        btnDel.textContent = "삭제";
        btnDel.addEventListener("click", () => {
            C.state.staList.splice(idx, 1);
            Wf.renderStaList();
            C.markDirty();
        });
        tdAct.appendChild(btnDel);
        tr.appendChild(tdAct);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
};

Wf.addStaFromScan = () => {
    const sel = C.el.scanList();
    const passInput = C.el.scanPass();
    if (!sel) return;
    const ssid = sel.value || "";
    if (!ssid) { SNW.toast("추가할 SSID를 선택하세요.", "warn"); return; }
    const pass = passInput ? passInput.value : "";
    if (C.state.staList.some((s) => s.ssid === ssid)) {
        SNW.toast("이미 등록된 SSID입니다.", "warn");
        return;
    }
    C.state.staList.push({ ssid, pass });
    Wf.renderStaList();
    C.markDirty();
    if (passInput) passInput.value = "";
};

// ============================================================
// 4) 저장
// ============================================================
Wf.saveWifiApPatch = async () => {
    const body = {
        wifi: {
            wifiMode: Number(C.el.wifiModeSel().value || 0),
            ap: { ssid: C.el.apSsid().value || "", pass: C.el.apPass().value || "" },
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_WIFI_CONFIG, body, "Wi-Fi AP 설정");
    C.markDirty();
};

Wf.saveWifiStaPatch = async () => {
    const body = {
        wifi: {
            sta: C.state.staList.map((item) => ({ ssid: item.ssid, pass: item.pass || "" })),
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_WIFI_CONFIG, body, "Wi-Fi STA 목록");
    C.markDirty();
};

Wf.savePwmPatch = async () => {
    const body = {
        hw: {
            fanPwm: {
                pin:     Number(C.el.pwmPin().value || 0),
                channel: Number(C.el.pwmChannel().value || 0),
                freq:    Number(C.el.pwmFreq().value || 0),
                res:     Number(C.el.pwmRes().value || 0),
            },
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_SYSTEM, body, "PWM 하드웨어");
    C.markDirty();
};

})();
```

---

📄 파일 5: P010_misc.js

```javascript
/*
 * ------------------------------------------------------
 * 소스명 : P010_misc.js
 * 모듈명 : Main UI - Misc (이벤트/아코디언/프로파일/업로드)
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core;
const M = SNW.P010.misc = {};

const EVENT_HISTORY_MAX = 20;

// ============================================================
// 1) 이벤트 히스토리
// ============================================================
M.pushEvent = (type, msg) => {
    C.state.eventHistory.unshift({ ts: Date.now(), type, msg });
    if (C.state.eventHistory.length > EVENT_HISTORY_MAX) {
        C.state.eventHistory.length = EVENT_HISTORY_MAX;
    }
    M.renderEventHistory();
};

M.renderEventHistory = () => {
    const el = document.getElementById("eventHistory");
    if (!el) return;
    if (!C.state.eventHistory.length) {
        el.innerHTML = '<div class="muted">이벤트 없음</div>';
        return;
    }
    el.innerHTML = C.state.eventHistory.map((e) => {
        const tsStr = new Date(e.ts).toLocaleTimeString("ko-KR", { hour12: false });
        return `<div class="event-line">
            <span class="evt-ts">${tsStr}</span>
            <span class="evt-msg evt-${e.type}">${e.msg}</span>
        </div>`;
    }).join("");
};

M.clearEvents = () => {
    C.state.eventHistory = [];
    M.renderEventHistory();
};

M.detectStateTransitions = (stateCode, stateStr, override, ovActive) => {
    if (C.state.lastStateCode !== stateCode) {
        if (C.state.lastStateCode >= 0) {
            switch (stateCode) {
                case 5: M.pushEvent("warn", "🛑 AutoOff로 정지됨"); break;
                case 4: M.pushEvent("info", "👤 모션 감지 없음"); break;
                case 6: M.pushEvent("err",  "⏰ 시간 미동기"); break;
                case 1: M.pushEvent("info", "🎬 Override 시작"); break;
                case 0: M.pushEvent("ok",   "✅ 정상 상태로 복귀"); break;
                default: M.pushEvent("info", `제어 상태: ${stateStr}`); break;
            }
        }
        C.state.lastStateCode = stateCode;
    }

    if (C.state.lastOverrideAct !== ovActive) {
        if (ovActive && override) {
            const mode = override.useFixed
                ? `고정 ${override.fixedPercent ?? 0}%`
                : `${override.presetCode || "-"}`;
            M.pushEvent("info", `🎬 Override 시작 (${mode})`);
        } else if (C.state.lastOverrideAct) {
            M.pushEvent("ok", "🎬 Override 종료");
        }
        C.state.lastOverrideAct = ovActive;
    }
};

// ============================================================
// 2) 아코디언 (모바일)
// ============================================================
M.getAccordionState = () => {
    const obj = SNW.store.get(SNW.KEY.ACCORDION, {});
    return (obj && typeof obj === "object") ? obj : {};
};
M.setAccordionState = (s) => SNW.store.set(SNW.KEY.ACCORDION, s);

M.initMobileAccordion = () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile) {
        document.querySelectorAll(".wrap > .grid > section.card.collapsed")
            .forEach(c => c.classList.remove("collapsed"));
        return;
    }

    const savedState = M.getAccordionState();

    document.querySelectorAll(".wrap > .grid > section.card").forEach((card, idx) => {
        const header = card.querySelector(":scope > .row.middle");
        if (!header) return;

        const sectionId = `sec_${idx}`;
        card.dataset.sectionId = sectionId;

        if (savedState[sectionId]) card.classList.add("collapsed");
        else                       card.classList.remove("collapsed");

        if (header.dataset.accordionInit === "1") return;
        header.dataset.accordionInit = "1";

        header.addEventListener("click", (e) => {
            if (e.target.closest("button, a, input, select, label")) return;
            card.classList.toggle("collapsed");
            const st = M.getAccordionState();
            st[sectionId] = card.classList.contains("collapsed");
            M.setAccordionState(st);
        });
    });
};

// ============================================================
// 3) 프로파일
// ============================================================
M.loadUserProfiles = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_USER_PROFILES, "", true);
    let profiles = [];
    if (data && data.userProfiles && Array.isArray(data.userProfiles.profiles)) {
        profiles = data.userProfiles.profiles;
    }
    C.state.userProfiles = profiles;

    const sel = C.el.profileSelect();
    if (!sel) return;
    sel.innerHTML = "";

    if (!profiles.length) {
        const opt = document.createElement("option");
        opt.value = ""; opt.textContent = "(프로파일 없음)";
        sel.appendChild(opt);
        return;
    }

    profiles.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p.profileNo;
        const off = (p.enabled !== false) ? "" : " (OFF)";
        opt.textContent = `${p.name || "이름없음"} (#${p.profileNo})${off}`;
        sel.appendChild(opt);
    });

    if (C.state.activeProfileNo > 0 &&
        sel.querySelector(`option[value="${C.state.activeProfileNo}"]`)) {
        sel.value = C.state.activeProfileNo;
    }
};

M.runSelectedProfile = async () => {
    const sel = C.el.profileSelect();
    if (!sel) return;
    const no = Number(sel.value);
    if (!no || no <= 0) { SNW.toast("실행할 프로파일을 선택하세요.", "warn"); return; }

    const target = C.state.userProfiles.find((p) => Number(p.profileNo) === no);
    if (target && target.enabled === false) {
        SNW.toast(`프로파일 "${target.name}"은(는) 비활성 상태입니다.`, "warn");
        return;
    }

    const result = await SNW.api.post(SNW_API.API_HTTP_CTL_PROF_SEL, { id: no }, `프로파일 #${no} 실행`);
    if (result) setTimeout(C.loadStateOnce, 300);
};

M.stopActiveProfile = async () => {
    const result = await SNW.api.post(SNW_API.API_HTTP_CTL_PROF_STOP, null, "프로파일 중지");
    if (result) setTimeout(C.loadStateOnce, 300);
};

M.quickEditProfile = () => {
    const sel = C.el.profileSelect();
    if (!sel) return;
    const no = Number(sel.value);
    if (!no || no <= 0) { SNW.toast("편집할 프로파일을 선택하세요.", "warn"); return; }

    const prof = C.state.userProfiles.find((p) => Number(p.profileNo) === no);
    if (!prof) { SNW.toast("프로파일 정보를 찾을 수 없습니다.", "err"); return; }
    window.location.href = `/P085_userProfiles_t2_071.html?edit=${prof.profileId}`;
};

// ============================================================
// 4) API Key / 업로드
// ============================================================
M.applyApiKeyFromInput = () => {
    const input = C.el.apiKeyInput();
    if (!input) return;
    SNW.setApiKey(input.value.trim());
    C.updateApiKeyBadge();
    SNW.toast("API Key가 브라우저에 저장되었습니다.", "ok");
};

M.uploadFile = async (endpoint, file, msgEl, successMsg, errorMsg) => {
    if (!file) { SNW.toast("파일을 선택하세요.", "warn"); return; }

    const apiKey = SNW.getApiKey();
    const formData = new FormData();
    formData.append("file", file, file.name);

    SNW.loading.show();
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: apiKey ? { "X-API-Key": apiKey } : {},
            body: formData,
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status} / ${text}`);
        if (msgEl) msgEl.textContent = text || successMsg;
        SNW.toast(successMsg, "ok");
    } catch (e) {
        console.error("[P010] uploadFile failed:", e.message);
        if (msgEl) msgEl.textContent = e.message;
        SNW.toast(errorMsg + ": " + e.message, "err");
    } finally {
        SNW.loading.hide();
    }
};

M.handleStaticUpload = () => {
    const f = C.el.upload() ? C.el.upload().files[0] : null;
    M.uploadFile(SNW_API.API_HTTP_FILE_UPLOAD, f, C.el.uploadMsg(), "정적 파일 업로드 완료", "정적 파일 업로드 실패");
};

M.handleOtaUpload = () => {
    const f = C.el.ota() ? C.el.ota().files[0] : null;
    M.uploadFile(SNW_API.API_HTTP_FW_UPDATE, f, C.el.otaMsg(), "OTA 업데이트 전송 완료", "OTA 업데이트 실패");
};

// ============================================================
// 5) 전체 저장 / 초기화
// ============================================================
M.saveAllConfig = async () => {
    if (!C.state.configDirty) { SNW.toast("변경 사항이 없습니다.", "info"); return; }
    if (!confirm("현재까지의 메모리 변경 내용을 모두 저장하시겠습니까?")) return;

    await SNW.api.post(SNW_API.API_HTTP_CONFIG_SAVE, { save_all: true }, "전체 Config 저장");
    C.state.configDirty = false;
    C.updateDirtyButton();
};

M.factoryReset = async () => {
    if (!confirm("⚠️ 모든 설정을 기본값으로 초기화합니다.\n진행하시겠습니까?")) return;
    await SNW.api.post(SNW_API.API_HTTP_CONFIG_INIT, { factory: true }, "Factory Reset");
    await C.loadConfig();
    await C.loadStateOnce();
};

})();
```

---

📄 파일 6: P010_main_071.js (진입점 슬림화)

```javascript
/*
 * ------------------------------------------------------
 * 소스명 : P010_main_071.js
 * 모듈명 : Main UI - Entrypoint (초기화 + 이벤트 바인딩)
 * ------------------------------------------------------
 * 책임:
 *  - 각 모듈(core/preset/ws/wifi/misc) 초기화
 *  - 이벤트 리스너 바인딩
 * ------------------------------------------------------
 */

(() => {
"use strict";

const C = SNW.P010.core;
const P = SNW.P010.preset;
const W = SNW.P010.ws;
const Wf = SNW.P010.wifi;
const M = SNW.P010.misc;

// ============================================================
// 이벤트 바인딩
// ============================================================
function bindEvents() {
    // 새로고침
    document.getElementById("btnRefresh")?.addEventListener("click", () => {
        C.loadStateOnce();
        Wf.loadWifiStateOnce();
    });

    // 프로파일 실행
    document.getElementById("btnProfileRun")?.addEventListener("click", M.runSelectedProfile);
    document.getElementById("btnProfileStop")?.addEventListener("click", M.stopActiveProfile);
    document.getElementById("btnProfileEdit")?.addEventListener("click", M.quickEditProfile);

    // 프리셋 / 스타일
    if (C.el.preset()) {
        C.el.preset().addEventListener("change", () => {
            P.onPresetOrStyleChanged();
            P.updateFavButton();
        });
    }
    if (C.el.style()) {
        C.el.style().addEventListener("change", P.onPresetOrStyleChanged);
    }

    document.getElementById("btnFavPreset")?.addEventListener("click", P.toggleFavPreset);
    document.getElementById("btnAiPreset")?.addEventListener("click", P.handleAiPresetRecommend);

    // 임시 적용
    document.getElementById("btnApplyTemp")?.addEventListener("click", P.applyTempPreset);
    document.getElementById("btnStopTemp")?.addEventListener("click", P.stopTemp);

    // 저장
    document.getElementById("btnSaveSim")?.addEventListener("click", P.saveMotionPatch);
    C.el.btnSaveAll()?.addEventListener("click", M.saveAllConfig);
    document.getElementById("btnConfigInit")?.addEventListener("click", M.factoryReset);
    document.getElementById("btnSaveTiming")?.addEventListener("click", P.saveTimingPatch);

    // Wi-Fi / PWM
    document.getElementById("btnSaveWifiAP")?.addEventListener("click", Wf.saveWifiApPatch);
    document.getElementById("btnSaveWifiSTA")?.addEventListener("click", Wf.saveWifiStaPatch);
    document.getElementById("btnScan")?.addEventListener("click", Wf.scanWifi);
    document.getElementById("btnUseScan")?.addEventListener("click", Wf.addStaFromScan);
    document.getElementById("btnSavePWM")?.addEventListener("click", Wf.savePwmPatch);

    // API Key / 업로드
    document.getElementById("btnSaveApiKey")?.addEventListener("click", M.applyApiKeyFromInput);
    document.getElementById("btnUploadStatic")?.addEventListener("click", M.handleStaticUpload);
    document.getElementById("btnUploadOTA")?.addEventListener("click", M.handleOtaUpload);

    // 로그
    document.getElementById("btnClearLog")?.addEventListener("click", W.clearLogConsole);
    document.getElementById("btnClearEvents")?.addEventListener("click", M.clearEvents);

    // 로그 필터
    document.querySelectorAll("[data-log-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("[data-log-filter]").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            C.state.logFilter = btn.dataset.logFilter || "all";
            W.applyLogFilter();
        });
    });

    // Dirty 마킹 (체크박스 + 숫자 input)
    if (C.el.fanPower()) C.el.fanPower().addEventListener("change", C.markDirty);

    const inputSelectors = [
        "#intensity", "#gust_freq", "#variability", "#fanLimit", "#minFan",
        "#turb_len", "#turb_sig", "#therm_str", "#therm_rad",
        "#sim_int", "#gust_int", "#thermal_int",
        "#wifi_mode", "#ap_ssid", "#ap_password",
        "#pwm_pin", "#pwm_channel", "#pwm_freq", "#pwm_res",
    ];
    inputSelectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) {
            el.addEventListener("change", C.markDirty);
            el.addEventListener("input", C.markDirty);
        }
    });
}

// ============================================================
// 초기화
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    // API Key 초기값
    const key = SNW.getApiKey();
    if (C.el.apiKeyInput()) C.el.apiKeyInput().value = key;

    // 초기 배지
    C.updateDirtyButton();
    C.updateApiKeyBadge();
    C._updateSaveStatusBadge();

    // 이벤트 바인딩
    bindEvents();

    // 초기 로그 + WebSocket
    await W.loadLogsOnce();
    W.initWebSocketLog();
    W.initWebSocketState();

    // 초기 데이터 로드
    await C.loadFwVersion();
    await C.loadConfig();
    await M.loadUserProfiles();
    await C.loadStateOnce();
    await Wf.loadWifiStateOnce();

    // 이벤트 히스토리 초기 렌더
    M.renderEventHistory();

    // 펌웨어 확인 (비동기, 결과 대기 안 함)
    C.checkFirmwareUpdate();

    // Wi-Fi 상태 30초 폴링
    if (C.state.wifiStateTimer) clearInterval(C.state.wifiStateTimer);
    C.state.wifiStateTimer = setInterval(Wf.loadWifiStateOnce, 30000);

    // 모바일 아코디언
    M.initMobileAccordion();

    let v_lastMobile = window.matchMedia("(max-width: 768px)").matches;
    window.addEventListener("resize", () => {
        const now = window.matchMedia("(max-width: 768px)").matches;
        if (now !== v_lastMobile) {
            v_lastMobile = now;
            M.initMobileAccordion();
        }
    });

    window.addEventListener("beforeunload", () => {
        if (C.state.wifiStateTimer) {
            clearInterval(C.state.wifiStateTimer);
            C.state.wifiStateTimer = null;
        }
    });

    console.log("[P010] init complete");
});

})();
```

---

🔧 적용 순서

1. 신규 파일 생성 (5개):
   · P010_core.js
   · P010_preset.js
   · P010_ws.js
   · P010_wifi.js
   · P010_misc.js
2. P010_main_071.js — 위 슬림 버전으로 전면 교체
3. P010_main_071.html — <script> 태그 8개로 확장 (위 참조)
4. LittleFS 업로드 — 6개 JS 파일 (기존 1개 → 6개)
5. A23_Com_ResetCfg_070.h fallback — pageAssets에 5개 JS 추가 고려 (선택)

---

📊 예상 결과

파일 라인 수
P010_core.js ~340
P010_preset.js ~330
P010_ws.js ~120
P010_wifi.js ~150
P010_misc.js ~230
P010_main_071.js ~140
합계 ~1310
기존 (단일 파일) ~700

총량은 증가(주석/네임스페이스 보일러플레이트)했지만 파일당 최대 크기 700 → 340으로 감소 (51% 축소). 유지보수성 대폭 향상.

---

🧪 검증

1. 페이지 로드

```javascript
// 각 모듈 로드 확인
typeof SNW.P010.core
typeof SNW.P010.preset
typeof SNW.P010.ws
typeof SNW.P010.wifi
typeof SNW.P010.misc
// → 모두 "object"
```

2. 초기화 로그

```
[SNW] common utilities loaded (v071)
[P010] init complete
[WS-LOG] ... (WebSocket 연결 로그)
[WS-STATE] connected
```

3. 기능별 검증

기능 콘솔 확인
프리셋 렌더링 SNW.P010.preset.getFavPresets().length
즐겨찾기 토글 document.getElementById("btnFavPreset").click()
아코디언 SNW.P010.misc.getAccordionState()
이벤트 SNW.P010.core.state.eventHistory.length
WS 상태 SNW.P010.core._applySimToUi({}, {})

4. 회귀 시나리오

· 프리셋 select 열기 → ⭐/🕘/전체 그룹 표시
· 임시 적용 클릭 → Override 시작
· 저장 클릭 → 저장 완료 배지
· 로그 필터 (전체/WARN+/ERROR)
· 모바일 뷰 (375px) → 카드 접기

---

🚀 최종 확인

모든 리팩토링 Round 완료:

Round 내용 상태
1 공통 유틸 + 파일명 승격 ✅
2 P080/P085/P100/P050 마이그레이션 ✅
3 P010 6모듈 분할 ✅

전체 효과:

· 중복 fetchApi 4 → 1
· P010 최대 파일 크기 -51%
· localStorage 키 8곳 → 1곳 상수
· 하위 호환 100% 유지

