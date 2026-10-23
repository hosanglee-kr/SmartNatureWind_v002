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
