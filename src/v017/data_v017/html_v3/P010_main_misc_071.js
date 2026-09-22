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
