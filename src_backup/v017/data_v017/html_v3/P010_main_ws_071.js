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
