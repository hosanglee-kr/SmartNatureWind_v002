
/* ===== BUNDLE: P000_common_071.js (16413 bytes) ===== */
/*
 * ------------------------------------------------------
 * 소스명 : P000_common_071.js
 * 모듈명 : Smart Nature Wind UI - Common Utilities (v2)
 * ------------------------------------------------------
 * [v2 개편 - Frontend Refactor Phase 1]
 *  - SNW 전역 네임스페이스 도입 (window 오염 최소화)
 *  - DOM/Storage/API/Toast/Loading 통합
 *  - localStorage 키 상수화 (단일 소스)
 *  - 통합 fetch API: SNW.api.get/post/patch/put/del
 *  - 기존 전역 함수(apiFetch/notify/showToast/...) 는 래퍼로 유지
 *  - 네비게이션 메뉴 로더 통합 (ONLINE/OFFLINE 자동 판별)
 * ------------------------------------------------------
 * [공개 API]
 *   SNW.$(sel, root)               DOM 쿼리
 *   SNW.$$(sel, root)              DOM 쿼리 (array)
 *   SNW.KEY.*                      localStorage 키 상수
 *   SNW.store.*                    localStorage 래퍼
 *   SNW.api.get/post/patch/put/del 통합 fetch
 *   SNW.toast(msg, type)           토스트
 *   SNW.loading.show()/hide()      로딩 오버레이
 *   SNW.getApiKey()/setApiKey()    API Key 관리
 *   SNW.buildWsUrl(path)           WebSocket URL 생성
 *   SNW.nav.load()                 네비게이션 메뉴 로드
 * ------------------------------------------------------
 * [하위 호환]
 *   window.$, $$, apiFetch, notify, showToast,
 *   showLoading, hideLoading, getApiKey, setApiKey,
 *   buildWsUrl — 모두 SNW 래퍼로 유지
 * ------------------------------------------------------
 */

(() => {
    "use strict";

    // =========================================================
    // 0. SNW 네임스페이스 초기화
    // =========================================================
    window.SNW = window.SNW || {};

    // =========================================================
    // 1. DOM 셀렉터
    // =========================================================
    SNW.$  = (sel, root = document) => root.querySelector(sel);
    SNW.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // =========================================================
    // 2. localStorage 키 상수 (단일 소스)
    // =========================================================
    SNW.KEY = Object.freeze({
        API_KEY:        "snw_api_key",
        FAV_PRESETS:    "snw_fav_presets",
        RECENT_PRESETS: "snw_recent_presets",
        ACCORDION:      "snw_accordion_collapsed",
        LOG_FILTER:     "snw_log_filter",
    });

    // =========================================================
    // 3. localStorage 래퍼
    // =========================================================
    SNW.store = {
        get: (key, def = null) => {
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) return def;
                return JSON.parse(raw);
            } catch { return def; }
        },
        set: (key, val) => {
            try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
        },
        getStr: (key, def = "") => {
            try { return localStorage.getItem(key) ?? def; } catch { return def; }
        },
        setStr: (key, val) => {
            try { localStorage.setItem(key, val); } catch {}
        },
        remove: (key) => {
            try { localStorage.removeItem(key); } catch {}
        },
    };

    // =========================================================
    // 4. API Key 관리
    // =========================================================
    SNW.getApiKey = () => SNW.store.getStr(SNW.KEY.API_KEY, "");
    SNW.setApiKey = (key) => {
        if (key) SNW.store.setStr(SNW.KEY.API_KEY, key);
        else     SNW.store.remove(SNW.KEY.API_KEY);
    };

    // =========================================================
    // 5. Loading / Toast
    // =========================================================
    SNW.loading = {
        show: () => {
            const el = SNW.$("#loadingOverlay");
            if (el) el.style.display = "flex";
        },
        hide: () => {
            const el = SNW.$("#loadingOverlay");
            if (el) el.style.display = "none";
        },
    };

    SNW.toast = (message, type = "info") => {
        const container = SNW.$("#toastContainer");
        const mapped = ["ok", "warn", "err"].includes(type) ? type : "info";
        if (container) {
            const el = document.createElement("div");
            el.className = "toast" + (mapped !== "info" ? " " + mapped : "");
            el.textContent = message;
            container.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        }
        console.log(`[Toast ${type.toUpperCase()}] ${message}`);
    };

    // =========================================================
    // 6. 통합 fetch API
    // =========================================================
    SNW.api = {
        /**
         * 내부 호출 (통합 에러 처리 + 토스트 + 로딩)
         * @param {string} method  GET/POST/PATCH/PUT/DELETE
         * @param {string} url
         * @param {object|string|null} body
         * @param {string} desc    로그/토스트 설명
         * @param {boolean} silent 토스트 표시 안 함
         */
        _call: async (method, url, body = null, desc = "", silent = false) => {
            SNW.loading.show();
            try {
                const opt = {
                    method,
                    headers: { Accept: "application/json" },
                };
                const key = SNW.getApiKey();
                if (key) opt.headers["X-API-Key"] = key;

                if (body !== null && body !== undefined) {
                    opt.headers["Content-Type"] = "application/json";
                    opt.body = typeof body === "string" ? body : JSON.stringify(body);
                }

                let resp;
                try {
                    resp = await fetch(url, opt);
                } catch (netErr) {
                    console.error("[SNW.api] network error:", netErr);
                    if (!silent) SNW.toast(`네트워크 연결을 확인하세요. (${desc || "요청"})`, "err");
                    return null;
                }

                const text = await resp.text();

                // ─── HTTP 상태별 사용자 친화 메시지 ───
                if (resp.status === 401) {
                    if (!silent) SNW.toast(`${desc || "요청"} 실패: 인증이 필요합니다.`, "err");
                    throw new Error("Unauthorized");
                }
                if (resp.status === 403) {
                    if (!silent) SNW.toast(`${desc || "요청"} 실패: 접근 권한이 없습니다.`, "err");
                    throw new Error("Forbidden");
                }
                if (resp.status === 404) {
                    if (!silent) SNW.toast(`${desc || "요청"} 실패: 대상을 찾을 수 없습니다.`, "err");
                    throw new Error("Not Found");
                }
                if (resp.status === 413) {
                    if (!silent) SNW.toast(`${desc || "요청"} 실패: 파일이 너무 큽니다.`, "err");
                    throw new Error("Payload Too Large");
                }
                if (resp.status === 429) {
                    if (!silent) SNW.toast(`${desc || "요청"} 실패: 너무 자주 요청했습니다.`, "err");
                    throw new Error("Rate Limited");
                }
                if (resp.status >= 500) {
                    if (!silent) SNW.toast(`${desc || "요청"} 실패: 서버 오류가 발생했습니다.`, "err");
                    throw new Error("Server Error " + resp.status);
                }
                if (!resp.ok) {
                    let userMsg = "";
                    try { const j = JSON.parse(text); userMsg = j.error || j.message || ""; } catch {}
                    if (!silent) SNW.toast(`${desc || "요청"} 실패${userMsg ? ": " + userMsg : ""}`, "err");
                    throw new Error(text || String(resp.status));
                }

                // 성공 토스트 (변경성 요청만)
                if (desc && !silent && method !== "GET") {
                    SNW.toast(`${desc} 성공`, "ok");
                }

                try { return text ? JSON.parse(text) : null; } catch { return text; }
            } catch (e) {
                const quiet = ["Unauthorized","Forbidden","Not Found","Payload Too Large","Rate Limited"];
                const isServerErr = e.message?.startsWith("Server Error");
                if (!silent && !quiet.includes(e.message) && !isServerErr) {
                    SNW.toast(`${desc || "요청"} 실패: ${e.message}`, "err");
                }
                return null;
            } finally {
                SNW.loading.hide();
            }
        },

        get:   (url, desc = "", silent = false)         => SNW.api._call("GET",    url, null, desc, silent),
        post:  (url, body, desc = "", silent = false)   => SNW.api._call("POST",   url, body, desc, silent),
        patch: (url, body, desc = "", silent = false)   => SNW.api._call("PATCH",  url, body, desc, silent),
        put:   (url, body, desc = "", silent = false)   => SNW.api._call("PUT",    url, body, desc, silent),
        del:   (url, desc = "", silent = false)         => SNW.api._call("DELETE", url, null, desc, silent),
    };

    // =========================================================
    // 7. WebSocket URL 생성
    // =========================================================
    SNW.buildWsUrl = (path) => {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const base = `${protocol}://${window.location.host}${path}`;
        const apiKey = SNW.getApiKey();
        if (!apiKey) return base;
        const sep = path.includes("?") ? "&" : "?";
        return `${base}${sep}apiKey=${encodeURIComponent(apiKey)}`;
    };

    // =========================================================
    // 8. 네비게이션 메뉴 로더 (기존 기능 유지)
    // =========================================================
    SNW.nav = {
        MODE_ONLINE:  "ONLINE",
        MODE_OFFLINE: "OFFLINE",
        API_MENU_PATH:   "/api/v001/menu",
        LOCAL_JSON_PATH: "../json/cfg_pages_071.json",

        mode: "OFFLINE",

        _fetchData: async (path, mode) => {
            try {
                const resp = await fetch(path);
                if (!resp.ok) {
                    console.error(`[SNW.nav] ${mode} load failed: ${path} (${resp.status})`);
                    return null;
                }
                return await resp.json();
            } catch (e) {
                console.error(`[SNW.nav] ${mode} fetch error:`, e);
                return null;
            }
        },

        _extractPages: (raw) => {
            if (!raw) return null;
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw.pages)) return raw.pages;
            return null;
        },

        _setLogoLink: (pages) => {
            const logo = SNW.$(".nav-logo");
            if (!logo || !Array.isArray(pages)) return;

            const main = pages.find(p => p.isMain === true);
            if (!main) return;

            if (SNW.nav.mode === SNW.nav.MODE_OFFLINE) {
                const file = (main.path || "").split("/").pop();
                logo.setAttribute("href", "./" + file);
            } else {
                logo.setAttribute("href", main.uri || main.path || "/");
            }
        },

        _renderMenu: (pages) => {
            const nav = SNW.$("#navMenu");
            if (!nav || !Array.isArray(pages)) return;

            const curPath = (window.location.pathname || "/").split("?")[0];
            const curFile = curPath.split("/").pop() || "";

            nav.innerHTML = "";

            pages
                .filter(p => p.enable !== false)
                .filter(p => !p.isMain)
                .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
                .forEach(p => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");

                    let href = "#";
                    let activeTarget = "";

                    if (SNW.nav.mode === SNW.nav.MODE_OFFLINE) {
                        const file = (p.path || "").split("/").pop();
                        href = "./" + file;
                        activeTarget = file;
                    } else {
                        href = p.uri || p.path || "#";
                        activeTarget = href.split("?")[0];
                    }

                    a.href = href;
                    a.textContent = p.label || p.path || "(no label)";

                    if (SNW.nav.mode === SNW.nav.MODE_OFFLINE) {
                        if (activeTarget === curFile) a.classList.add("active");
                    } else {
                        const cands = [p.uri, p.path].filter(Boolean).map(x => x.split("?")[0]);
                        if (cands.includes(curPath)) a.classList.add("active");
                    }

                    li.appendChild(a);
                    nav.appendChild(li);
                });
        },

        load: async () => {
            // 1) ONLINE 시도
            const onlineRaw = await SNW.nav._fetchData(SNW.nav.API_MENU_PATH, SNW.nav.MODE_ONLINE);
            const onlinePages = SNW.nav._extractPages(onlineRaw);

            let pages = null;

            if (onlinePages && onlinePages.length > 0) {
                SNW.nav.mode = SNW.nav.MODE_ONLINE;
                pages = onlinePages;
                console.log("[SNW.nav] ONLINE");
            } else {
                // 2) OFFLINE 폴백
                console.warn("[SNW.nav] Online failed → OFFLINE fallback");
                const offlineRaw = await SNW.nav._fetchData(SNW.nav.LOCAL_JSON_PATH, SNW.nav.MODE_OFFLINE);
                const offlinePages = SNW.nav._extractPages(offlineRaw);

                if (offlinePages && offlinePages.length > 0) {
                    SNW.nav.mode = SNW.nav.MODE_OFFLINE;
                    pages = offlinePages;
                    console.log("[SNW.nav] OFFLINE");
                    SNW.toast("오프라인 모드로 동작합니다.", "info");
                } else {
                    console.error("[SNW.nav] Both ONLINE/OFFLINE failed");
                    SNW.toast("메뉴 로드 실패! (cfg_pages_071.json 확인)", "err");
                    return;
                }
            }

            window.currentMode = SNW.nav.mode;

            SNW.nav._setLogoLink(pages);
            SNW.nav._renderMenu(pages);
        },
    };

    // =========================================================
    // 9. 하위 호환 래퍼 (기존 전역 함수 유지)
    // =========================================================
    window.$  = (s, r) => SNW.$(s, r);
    window.$$ = (s, r) => SNW.$$(s, r);

    window.showToast = (msg, type) => SNW.toast(msg, type);
    window.notify    = (msg, type) => SNW.toast(msg, type);

    window.showLoading = () => SNW.loading.show();
    window.hideLoading = () => SNW.loading.hide();

    window.getApiKey = () => SNW.getApiKey();
    window.setApiKey = (k) => SNW.setApiKey(k);

    window.buildWsUrl = (path) => SNW.buildWsUrl(path);

    // apiFetch: 기존 옵션 객체 시그니처 유지
    window.apiFetch = async (url, options = {}, silent = false, desc = "") => {
        const method = (options.method || "GET").toUpperCase();
        let body = null;
        if (options.body) {
            try { body = JSON.parse(options.body); } catch { body = options.body; }
        }
        return SNW.api._call(method, url, body, desc, silent);
    };

    // =========================================================
    // 10. DOMContentLoaded: 메뉴 자동 로드
    // =========================================================
    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("navMenu")) {
            SNW.nav.load();
        }
    });

    // =========================================================
    // 11. 로드 완료 로그
    // =========================================================
    console.log("[SNW] common utilities loaded (v071)");

})();


/* ===== BUNDLE: P001_comm_API_071.js (3332 bytes) ===== */
/**
 * P001_comm_API_071.js
 * Smart Nature Wind - REST API Constants (전역 객체 버전)
 * 백엔드 W10_Web_Const_070.h와 동기화됨
 * 사용: SNW_API.API_HTTP_STATE 등으로 접근
 *
 * [v071] P000_common_071.js 와 함께 사용
 *        (파일명만 승격, 내용 변경 없음)
 */
window.SNW_API = (() => {
	const BASE = "/api/v001";
	const WS = "/ws";
	
	return {
		// 기본 prefix
		API_HTTP_BASE: BASE,
		API_WS_BASE: WS,
		
		// 시스템 정보 및 상태
		get API_HTTP_VERSION() { return `${BASE}/version`; },
		get API_HTTP_STATE() { return `${BASE}/state`; },
		get API_HTTP_SYSTEM() { return `${BASE}/system`; },
		get API_HTTP_WIFI_SCAN() { return `${BASE}/wifi/scan`; },
		get API_HTTP_WIFI_STATE() { return `${BASE}/wifi/state`; },
		get API_HTTP_WIFI_CONFIG() { return `${BASE}/wifi/config`; },
		get API_HTTP_DIAG() { return `${BASE}/diag`; },
		get API_HTTP_AUTH_TEST() { return `${BASE}/auth/test`; },
		get API_HTTP_TIME_SET() { return `${BASE}/system/time/set`; },
		get API_HTTP_FW_CHECK() { return `${BASE}/system/firmware/check`; },
		
		// 설정 및 실시간 제어
		get API_HTTP_MOTION() { return `${BASE}/motion`; },
		get API_HTTP_SIMULATION() { return `${BASE}/simulation`; },
		get API_HTTP_SIM_STATE() { return `${BASE}/sim/state`; },
		get API_HTTP_CONTROL_SUMMARY() { return `${BASE}/control/summary`; },
		
		// 설정 관리
		get API_HTTP_CONFIG() { return `${BASE}/config`; },
		get API_HTTP_CONFIG_SAVE() { return `${BASE}/config/save`; },
		get API_HTTP_CONFIG_DIRTY() { return `${BASE}/config/dirty`; },
		get API_HTTP_CONFIG_INIT() { return `${BASE}/config/init`; },
		get API_HTTP_RELOAD() { return `${BASE}/reload`; },
		
		// CRUD
		get API_HTTP_WIND_PROFILE() { return `${BASE}/windProfile`; },
		get API_HTTP_SCHEDULES() { return `${BASE}/schedules`; },
		get API_HTTP_USER_PROFILES() { return `${BASE}/user_profiles`; },
		get API_HTTP_USER_PROFILES_PATCH() { return `${BASE}/user_profiles/patch`; },
		
		// 하드웨어 직접 제어
		get API_HTTP_CTL_REBOOT() { return `${BASE}/control/reboot`; },
		get API_HTTP_CTL_FACTORY() { return `${BASE}/control/factoryReset`; },
		get API_HTTP_CTL_PROF_SEL() { return `${BASE}/control/profile/select`; },
		get API_HTTP_CTL_PROF_STOP() { return `${BASE}/control/profile/stop`; },
		get API_HTTP_CTL_OVR_FIXED() { return `${BASE}/control/override/fixed`; },
		get API_HTTP_CTL_OVR_PRESET() { return `${BASE}/control/override/preset`; },
		get API_HTTP_CTL_OVR_CLEAR() { return `${BASE}/control/override/clear`; },
		
		// 데이터 피드 및 메트릭
		get API_HTTP_FEED_PIR() { return `${BASE}/motion/pir/feed`; },
		get API_HTTP_METRICS() { return `${BASE}/metrics`; },
		get API_HTTP_LOGS() { return `${BASE}/logs`; },
		
		// 파일 및 업데이트
		get API_HTTP_FILE_UPLOAD() { return `${BASE}/fileUpload`; },
		get API_HTTP_FW_UPDATE() { return `${BASE}/fwUpdate`; },
		
		// 웹 메뉴
		get API_HTTP_MENU() { return `${BASE}/menu`; },
		
		// AI 프록시
		get API_HTTP_GEMINI_PROXY() { return `${BASE}/ai/gemini`; },
		
		// WebSocket 엔드포인트
		get WS_API_LOG() { return `${WS}/log`; },
		get WS_API_STATE() { return `${WS}/state`; },
		get WS_API_CHART() { return `${WS}/chart`; },
		get WS_API_METRICS() { return `${WS}/metrics`; },
		get WS_API_SUMMARY() { return `${WS}/summary`; }
	};
})();


/* ===== BUNDLE: P010_main_core_071.js (17637 bytes) ===== */
/*
 * ------------------------------------------------------
 * 소스명 : P010_main_core_071.js
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
    presetHistory:    [],     // [{ ts, code, name }]
};

// ============================================================
// 2-1) 실행 컨텍스트 미니맵 (P010 로컬 추적)
// ============================================================
const CMM_WINDOW_KEY = "snw_cmm_window";
const CMM_HISTORY_MAX = 300;    // 프리셋 이력 최대 개수

let   _cmmWindowMin = Number(SNW.store.get(CMM_WINDOW_KEY, 30));
if (![30, 60, 180].includes(_cmmWindowMin)) _cmmWindowMin = 30;

// 프리셋 10색 팔레트
C.PRESET_COLORS = [
    "#27ae60", "#3498db", "#2980b9", "#7f8c8d", "#e67e22",
    "#16a085", "#2ecc71", "#e74c3c", "#9b59b6", "#34495e",
];

C.EVENT_DOT_COLORS = {
    1: "#e74c3c",   // ERR
    2: "#f39c12",   // WARN
    3: "#3498db",   // INFO
    4: "#95a5a6",   // DEBUG
};

C._cmmWindowMs = () => _cmmWindowMin * 60 * 1000;
C._getCmmWindowMin = () => _cmmWindowMin;
C._setCmmWindowMin = (v) => { _cmmWindowMin = v; };

// ── 프리셋 이력 기록 ──
C.recordPresetHistory = (code) => {
    if (!code) return;
    const hist = C.state.presetHistory;
    const last = hist[hist.length - 1];
    if (last && last.code === code) return;   // 변경 없음 → 무시

    const preset = C.state.windDictPresets.find(p => p.code === code);
    hist.push({
        ts: Date.now(),
        code: code,
        name: preset ? (preset.name || code) : code,
    });
    if (hist.length > CMM_HISTORY_MAX) hist.shift();

    // 즉시 렌더 트리거 (P010_misc에서 처리)
    if (SNW.P010.misc && SNW.P010.misc.scheduleMinimapUpdate) {
        SNW.P010.misc.scheduleMinimapUpdate();
    }
};

// ── 프리셋 컬러 조회 ──
C.getPresetColor = (code) => {
    const idx = C.state.windDictPresets.findIndex(p => p.code === code);
    const safeIdx = (idx >= 0) ? idx : 0;
    return C.PRESET_COLORS[safeIdx % C.PRESET_COLORS.length];
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

    // [신규] 프리셋 이력 기록 (변경 시점만 push됨)
    if (sim.presetCode) {
        C.recordPresetHistory(sim.presetCode);
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


/* ===== BUNDLE: P010_main_preset_071.js (16705 bytes) ===== */
/*
 * ------------------------------------------------------
 * 소스명 : P010_main_preset_071.js
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


/* ===== BUNDLE: P010_main_ws_071.js (4475 bytes) ===== */
/*
 * ------------------------------------------------------
 * 소스명 : P010_main_ws_071.js
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


/* ===== BUNDLE: P010_main_wifi_071.js (5687 bytes) ===== */
/*
 * ------------------------------------------------------
 * 소스명 : P010_main_wifi_071.js
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


/* ===== BUNDLE: P010_main_misc_071.js (19102 bytes) ===== */
/*
 * ------------------------------------------------------
 * 소스명 : P010_main_misc_071.js
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

// ============================================================
// 실행 컨텍스트 미니맵 렌더
// ============================================================
const CMM_UPDATE_MIN = 2000;
let   _cmmLastRender = 0;

M.scheduleMinimapUpdate = () => {
    const now = Date.now();
    if (now - _cmmLastRender < CMM_UPDATE_MIN) return;
    _cmmLastRender = now;
    M.renderContextMinimap();
};

M.renderContextMinimap = () => {
    const el = document.getElementById("cmmTimeline");
    if (!el) return;

    const now = Date.now();
    const windowMs = C._cmmWindowMs();
    const minTs = now - windowMs;
    const total = now - minTs;

    const hist = C.state.presetHistory || [];

    // ── 이력 없음 ──
    if (hist.length === 0) {
        el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
        M._updateCmmAxisLabels();
        M._updateCmmLabel();
        M.renderPresetStats();
        return;
    }

    // ── 세그먼트 생성 (윈도우 내) ──
    const visible = hist.filter(h => h.ts <= now);

    const segments = [];
    for (let i = 0; i < visible.length; i++) {
        const start = Math.max(visible[i].ts, minTs);
        const end = (i + 1 < visible.length) ? visible[i + 1].ts : now;
        const clippedEnd = Math.min(end, now);
        if (clippedEnd <= start) continue;
        segments.push({
            start,
            end: clippedEnd,
            code: visible[i].code,
            name: visible[i].name,
        });
    }

    if (segments.length === 0) {
        el.innerHTML = '<div class="cmm-empty">현재 윈도우 내 이력 없음</div>';
        M._updateCmmAxisLabels();
        M._updateCmmLabel();
        M.renderPresetStats();
        return;
    }

    // ── 블록 HTML ──
    const blocksHtml = segments.map((seg) => {
        const left  = ((seg.start - minTs) / total) * 100;
        const width = ((seg.end - seg.start) / total) * 100;
        const color = C.getPresetColor(seg.code);
        const durMin = Math.max(1, Math.round((seg.end - seg.start) / 60000));
        const startStr = new Date(seg.start).toLocaleTimeString("ko-KR", { hour12: false });
        return `<div class="cmm-block"
                     style="left:${left.toFixed(3)}%; width:${Math.max(width, 0.15).toFixed(3)}%; background:${color};"
                     data-ts="${Math.floor((seg.start + seg.end) / 2)}"
                     title="${seg.name} (${seg.code}) · ${startStr} · ${durMin}분">
                </div>`;
    }).join("");

    // ── 이벤트 도트 (P010 이벤트 히스토리 재사용) ──
    const levelMap = { warn: 2, err: 1, info: 3, ok: 4 };
    const eventsHtml = (C.state.eventHistory || [])
        .filter(e => e.ts >= minTs && e.ts <= now)
        .map((e) => {
            const left = ((e.ts - minTs) / total) * 100;
            const lv = levelMap[e.type] || 3;
            const color = C.EVENT_DOT_COLORS[lv] || C.EVENT_DOT_COLORS[3];
            const ts = new Date(e.ts).toLocaleTimeString("ko-KR", { hour12: false });
            return `<div class="cmm-event-dot"
                         style="left:${left.toFixed(3)}%; background:${color};"
                         title="[${ts}] ${M._escapeHtml(e.msg)}">
                    </div>`;
        }).join("");

    el.innerHTML = blocksHtml + eventsHtml;

    M._updateCmmAxisLabels();
    M._updateCmmLabel();
    M.renderPresetStats();
};

M._updateCmmLabel = () => {
    const el = document.getElementById("cmmLabel");
    if (!el) return;
    const w = C._getCmmWindowMin();
    const wStr = (w < 60) ? `${w}분` : `${w / 60}시간`;
    el.textContent = `🕒 실행 컨텍스트 (최근 ${wStr})`;
};

M._updateCmmAxisLabels = () => {
    const el = document.getElementById("cmmAxis");
    if (!el) return;
    const w = C._getCmmWindowMin();
    const marks = [w, Math.round(w * 2 / 3), Math.round(w * 1 / 3), 0];
    const labels = marks.map((m) => {
        if (m === 0) return "현재";
        if (m < 60) return `-${m}분`;
        const h = m / 60;
        return Number.isInteger(h) ? `-${h}시간` : `-${m}분`;
    });
    el.innerHTML = labels.map(t => `<span>${t}</span>`).join("");
};

M._escapeHtml = (str) => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

// ============================================================
// 미니맵 클릭 → 이벤트 리스트 강조
// ============================================================
M.initMinimapClick = () => {
    document.getElementById("cmmTimeline")?.addEventListener("click", (e) => {
        const block = e.target.closest(".cmm-block");
        if (!block) return;
        const ts = Number(block.dataset.ts);
        if (!Number.isFinite(ts)) return;

        const t = new Date(ts).toLocaleTimeString("ko-KR", { hour12: false });

        // 해당 시각 ±10초 이벤트를 이벤트 리스트에서 강조
        const hitEvent = M._findNearestEvent(ts, 10000);   // ±10초

        if (hitEvent) {
            document.getElementById("eventHistory")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            setTimeout(() => {
                M._highlightEventRow(hitEvent);
            }, 400);

            SNW.toast(`📌 ${t} · 이벤트: ${hitEvent.msg.substring(0, 30)}`, "info");
        } else {
            const durMin = Number(block.title.match(/(\d+)분/)?.[1]) || 0;
            SNW.toast(`🕐 ${t} · ${durMin}분 구간 (근처 이벤트 없음)`, "info");
        }
    });
};

M._findNearestEvent = (ts, toleranceMs = 10000) => {
    const hist = C.state.eventHistory || [];
    if (!hist.length) return null;

    let best = null;
    let bestD = toleranceMs;
    hist.forEach((e) => {
        const d = Math.abs(e.ts - ts);
        if (d < bestD) { bestD = d; best = e; }
    });
    return best;
};

M._highlightEventRow = (evt) => {
    if (!evt || !evt.ts) return;

    const rows = document.querySelectorAll("#eventHistory .event-line");
    if (!rows.length) return;

    const idx = C.state.eventHistory.indexOf(evt);
    if (idx < 0 || idx >= rows.length) return;

    const target = rows[idx];
    if (!target) return;

    document.querySelectorAll("#eventHistory .event-line.evt-highlight")
        .forEach(r => r.classList.remove("evt-highlight"));

    target.classList.add("evt-highlight");

    setTimeout(() => {
        target.classList.remove("evt-highlight");
    }, 3000);
};

// ============================================================
// 프리셋 이력 통계 (Top 3)
// ============================================================
M.renderPresetStats = () => {
    const el = document.getElementById("cmmStatsGrid");
    const winEl = document.getElementById("cmmStatWindow");
    if (!el) return;

    const now = Date.now();
    const windowMs = C._cmmWindowMs();
    const minTs = now - windowMs;

    if (winEl) {
        const w = C._getCmmWindowMin();
        const wStr = (w < 60) ? `최근 ${w}분` : `최근 ${w / 60}시간`;
        winEl.textContent = wStr;
    }

    const hist = C.state.presetHistory || [];
    if (hist.length === 0) {
        el.innerHTML = '<div class="cmm-stat-empty">데이터 수집 중...</div>';
        return;
    }

    // ── 각 프리셋별 사용 시간 누적 ──
    const durations = {};   // code → ms
    for (let i = 0; i < hist.length; i++) {
        const start = Math.max(hist[i].ts, minTs);
        const end = (i + 1 < hist.length) ? Math.min(hist[i + 1].ts, now) : now;
        if (end <= start) continue;
        const code = hist[i].code;
        durations[code] = (durations[code] || 0) + (end - start);
    }

    // ── Top 3 정렬 ──
    const entries = Object.entries(durations)
        .map(([code, ms]) => {
            const preset = C.state.windDictPresets.find(p => p.code === code);
            return {
                code,
                ms,
                name: preset ? (preset.name || code) : code,
                color: C.getPresetColor(code),
            };
        })
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 3);

    if (entries.length === 0) {
        el.innerHTML = '<div class="cmm-stat-empty">현재 윈도우 내 이력 없음</div>';
        return;
    }

    const totalMs = entries.reduce((s, e) => s + e.ms, 0);
    const maxMs = entries[0].ms;
    const fmtDur = (ms) => {
        const s = Math.floor(ms / 1000);
        if (s < 60) return `${s}초`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}분`;
        const h = Math.floor(m / 60);
        const rm = m % 60;
        return rm ? `${h}시간 ${rm}분` : `${h}시간`;
    };

    el.innerHTML = entries.map((e, idx) => {
        const rank = idx + 1;
        const rankLabel = ["🥇", "🥈", "🥉"][idx] || `#${rank}`;
        const pctTotal = totalMs > 0 ? Math.round((e.ms / totalMs) * 100) : 0;
        const barW = Math.round((e.ms / maxMs) * 100);

        return `<div class="cmm-stat-card rank-${rank}" style="border-left-color:${e.color};">
            <span class="cmm-stat-rank">${rankLabel}</span>
            <div class="cmm-stat-name">${e.name}</div>
            <div class="cmm-stat-code">${e.code}</div>
            <div class="cmm-stat-bar-wrap">
                <div class="cmm-stat-bar" style="width:${barW}%; background:${e.color};"></div>
            </div>
            <div class="cmm-stat-duration">
                <span class="dur-value">${fmtDur(e.ms)}</span>
                <span class="dur-pct">${pctTotal}%</span>
            </div>
        </div>`;
    }).join("");
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


/* ===== BUNDLE: P010_main_071.js (7354 bytes) ===== */
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

    // 실행 컨텍스트 미니맵 토글
    document.querySelectorAll("[data-cmm-window]").forEach((btn) => {
        const w = Number(btn.dataset.cmmWindow);
        btn.classList.toggle("active", w === C._getCmmWindowMin());

        btn.addEventListener("click", () => {
            const newW = Number(btn.dataset.cmmWindow);
            if (![30, 60, 180].includes(newW)) return;
            if (newW === C._getCmmWindowMin()) return;

            C._setCmmWindowMin(newW);
            SNW.store.set("snw_cmm_window", newW);

            document.querySelectorAll("[data-cmm-window]").forEach((b) => {
                b.classList.toggle("active", Number(b.dataset.cmmWindow) === newW);
            });

            M._cmmLastRender = 0;
            M.renderContextMinimap();

            const wStr = (newW < 60) ? `${newW}분` : `${newW / 60}시간`;
            SNW.toast(`미니맵 윈도우: ${wStr}`, "info");
        });
    });

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

    // 실행 컨텍스트 미니맵 초기화
    M.renderContextMinimap();
    M.initMinimapClick();

    // 프리셋 통계 초기 렌더
    M.renderPresetStats();

    // 30초마다 재렌더 (윈도우 슬라이딩 반영)
    setInterval(() => {
        M._cmmLastRender = 0;
        M.renderContextMinimap();
        M.renderPresetStats();
    }, 30000);

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

