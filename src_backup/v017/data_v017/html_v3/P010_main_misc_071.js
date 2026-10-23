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
