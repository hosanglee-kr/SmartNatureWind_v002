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
