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
