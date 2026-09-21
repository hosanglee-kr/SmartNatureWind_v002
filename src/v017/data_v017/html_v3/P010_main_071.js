/* P010_main_071.js
 * ------------------------------------------------------
 * 모듈명 : Smart Nature Wind Main UI Logic
 * ------------------------------------------------------
 * 기능:
 *  - 상태/설정 로딩 (config, state, motion, user_profiles, wifi/state)
 *  - 프리셋 선택 시 자동 값 채움 (preset × style)
 *  - 임시 적용 (override) — 저장 안 함
 *  - 프로파일 실행/중지 (R3-P010-Prof)
 *  - 저장 (motion.sim patch + config save + override clear)
 *  - WebSocket 로그/상태, WiFi 30초 폴링
 * ------------------------------------------------------
 */

/* ==============================
 * 1. DOM 참조
 * ============================== */
const elFwVer        = () => document.getElementById("fwVer");
const elSimActive    = () => document.getElementById("simActive");
const elPhase        = () => document.getElementById("phase");
const elWind         = () => document.getElementById("wind");
const elPwm          = () => document.getElementById("pwm");
const elWifiMode     = () => document.getElementById("wifiMode");
const elCurSsid      = () => document.getElementById("curSsid");
const elIp           = () => document.getElementById("ip");

const elControlState = () => document.getElementById("controlState");
const elRunTarget    = () => document.getElementById("runTarget");

// 프로파일 실행
const elProfileSelect    = () => document.getElementById("profileSelect");
const elProfileRunStatus = () => document.getElementById("profileRunStatus");

const elOverrideBadge  = () => document.getElementById("overrideBadge");
const elTimeBadge      = () => document.getElementById("timeBadge");
const elOverrideStatus = () => document.getElementById("overrideStatus");
const elOverrideSeconds = () => document.getElementById("overrideSeconds");
const elOverrideForever = () => document.getElementById("overrideForever");

const elPreset       = () => document.getElementById("preset");
const elStyle        = () => document.getElementById("style");
const elFanPower     = () => document.getElementById("fanPowerEnabled");
const elIntensity    = () => document.getElementById("intensity");
const elGustFreq     = () => document.getElementById("gust_freq");
const elVariability  = () => document.getElementById("variability");
const elFanLimit     = () => document.getElementById("fanLimit");
const elMinFan       = () => document.getElementById("minFan");
const elTurbLen      = () => document.getElementById("turb_len");
const elTurbSig      = () => document.getElementById("turb_sig");
const elThermStr     = () => document.getElementById("therm_str");
const elThermRad     = () => document.getElementById("therm_rad");

const elSimInt       = () => document.getElementById("sim_int");
const elGustInt      = () => document.getElementById("gust_int");
const elThermalInt   = () => document.getElementById("thermal_int");

const elWifiModeSel  = () => document.getElementById("wifi_mode");
const elApSsid       = () => document.getElementById("ap_ssid");
const elApPass       = () => document.getElementById("ap_password");
const elStaList      = () => document.getElementById("staList");
const elScanList     = () => document.getElementById("scanList");
const elScanPass     = () => document.getElementById("scanPass");

const elPwmPin       = () => document.getElementById("pwm_pin");
const elPwmChannel   = () => document.getElementById("pwm_channel");
const elPwmFreq      = () => document.getElementById("pwm_freq");
const elPwmRes       = () => document.getElementById("pwm_res");

const elApiKeyInput  = () => document.getElementById("apiKeyInput");
const elUpload       = () => document.getElementById("fileUpload");
const elUploadMsg    = () => document.getElementById("uploadMsg");
const elOTA          = () => document.getElementById("fileOTA");
const elOtaMsg       = () => document.getElementById("otaMsg");
const elLogConsole   = () => document.getElementById("logConsole");
const elBtnSaveAll   = () => document.getElementById("btnSaveAllConfig");

/* ==============================
 * 2. 전역 상태
 * ============================== */
let g_configDirty     = false;
let g_staList         = [];
let g_wsLog           = null;
let g_wsState         = null;
let g_wifiStateTimer  = null;
let g_windDictPresets = [];
let g_windDictStyles  = [];
let g_overrideActive  = false;

// 프로파일 실행
let g_userProfiles    = [];
let g_activeProfileNo = 0;

/* ==============================
 * 3. Dirty / 상태 배지
 * ============================== */
function updateDirtyButton() {
	const btn = elBtnSaveAll();
	if (!btn) return;
	if (g_configDirty) {
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
}

function markDirty() {
	g_configDirty = true;
	updateDirtyButton();
	_updateSaveAttention();
}

// [Q3-b] override + dirty 시 저장 버튼 강조
function _updateSaveAttention() {
	const btnSaveSim = document.getElementById("btnSaveSim");
	if (!btnSaveSim) return;
	const needAttention = g_overrideActive && g_configDirty;
	btnSaveSim.classList.toggle("btn-attention", needAttention);
}

/* ==============================
 * 4. 초기 데이터 로딩
 * ============================== */
async function loadFwVersion() {
	const data = await apiFetch(SNW_API.API_HTTP_VERSION, { method: "GET" }, true);
	let v = "…";
	if (typeof data === "string") v = data;
	else if (data && (data.version || data.fw || data.fw_version)) {
		v = data.version || data.fw || data.fw_version;
	}
	const el = elFwVer();
	if (el) el.textContent = v;
}

function _applySimToUi(sim, control) {
	const simActive = sim.active;
	const elA = elSimActive();
	if (elA) {
		if (simActive === true || simActive === 1 || simActive === "on") {
			elA.textContent = "ACTIVE";
			elA.classList.remove("err");
			elA.classList.add("ok");
		} else {
			elA.textContent = "IDLE";
			elA.classList.remove("ok");
			elA.classList.add("err");
		}
	}

	const elP = elPhase();
	if (elP) elP.textContent = sim.phase != null ? String(sim.phase) : "-";

	const elW = elWind();
	if (elW) elW.textContent = sim.windSpeed != null ? String(sim.windSpeed) : "-";

	const elPw = elPwm();
	if (elPw) elPw.textContent = sim.pwmDuty != null ? String(sim.pwmDuty) : "-";

	// 폼 자동 동기화 (dirty 아닐 때만)
	if (!g_configDirty) {
		if (elPreset() && sim.presetCode) elPreset().value = sim.presetCode;
		if (elStyle() && sim.styleCode)   elStyle().value  = sim.styleCode;
		if (elFanPower() && sim.fanPowerEnabled !== undefined) elFanPower().checked = !!sim.fanPowerEnabled;
	}

	// override 배지 / 상태
	const ov = (control && control.override) ? control.override : null;
	const ovActive = !!(ov && ov.active);
	g_overrideActive = ovActive;

	const ovBadge = elOverrideBadge();
	if (ovBadge) ovBadge.style.display = ovActive ? "inline-block" : "none";

	const ovStatus = elOverrideStatus();
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

	// 제어 상태 (control.state / stateCode)
	{
		const stateCode = control.stateCode;
		const stateStr  = control.state || "-";

		const elCS = elControlState();
		if (elCS) {
			elCS.textContent = stateStr;
			// stateCode별 색상
			switch (stateCode) {
				case 0:  elCS.className = "info-label info";   break; // IDLE
				case 1:  elCS.className = "info-label warn";   break; // OVERRIDE
				case 2:
				case 3:  elCS.className = "info-label ok";     break; // PROFILE_RUN / SCHEDULE_RUN
				case 4:  elCS.className = "info-label info";   break; // MOTION_BLOCKED
				case 5:
				case 6:  elCS.className = "info-label err";    break; // AUTOOFF_STOPPED / TIME_INVALID
				default: elCS.className = "info-label info";   break;
			}
		}
	}

	// 실행 대상 (override > schedule > profile 우선)
	{
		const sch  = control.schedule   || {};
		const prof = control.profile    || {};

		let target = "없음";

		if (ov && ov.active) {
			if (ov.useFixed) {
				target = `Override: 고정 ${ov.fixedPercent ?? 0}%`;
			} else {
				target = `Override: ${ov.presetCode || "-"}`;
			}
		} else if (sch.fromRunSource && sch.name) {
			target = `스케줄: ${sch.name}`;
			if (sch.schNo) target += ` (#${sch.schNo})`;
		} else if (prof.fromRunSource && prof.name) {
			target = `프로파일: ${prof.name}`;
			if (prof.profileNo) target += ` (#${prof.profileNo})`;
		}

		const elRT = elRunTarget();
		if (elRT) elRT.textContent = target;
	}

	// 프로파일 실행 상태
	{
		const prof   = (control && control.profile) ? control.profile : {};
		const active = !!prof.fromRunSource;
		g_activeProfileNo = active ? (Number(prof.profileNo) || 0) : 0;

		const elPS = elProfileRunStatus();
		if (elPS) {
			if (active) {
				elPS.textContent = `🟢 실행 중: ${prof.name || "#" + prof.profileNo}`;
				elPS.className = "info-label warn";
			} else {
				elPS.textContent = "비활성";
				elPS.className = "info-label info";
			}
		}

		// 프로파일 select 자동 동기화 (dirty 아닐 때만)
		if (!g_configDirty && elProfileSelect() && active && prof.profileNo) {
			elProfileSelect().value = prof.profileNo;
		}
	}

	// time 배지
	const tm = (control && control.time) ? control.time : null;
	const timeValid = tm ? !!tm.valid : true;
	const tb = elTimeBadge();
	if (tb) tb.style.display = timeValid ? "none" : "inline-block";

	// 저장 버튼 강조 갱신
	_updateSaveAttention();
}

async function loadStateOnce() {
	const data = await apiFetch(SNW_API.API_HTTP_STATE, { method: "GET" }, true);
	if (!data) return;
	_applySimToUi(data.sim || {}, data.control || {});
}

async function loadConfig() {
	showLoading();
	try {
		const [cfg, motionData] = await Promise.all([
			apiFetch(SNW_API.API_HTTP_CONFIG, { method: "GET" }, true),
			apiFetch(SNW_API.API_HTTP_MOTION, { method: "GET" }, true)
		]);

		if (!cfg) return;

		// Wi-Fi
		if (cfg.wifi) {
			if (elWifiModeSel()) elWifiModeSel().value = cfg.wifi.wifiMode ?? 0;
			if (elApSsid()) elApSsid().value = cfg.wifi.ap ? cfg.wifi.ap.ssid || "" : "";
			if (elApPass()) elApPass().value = cfg.wifi.ap ? cfg.wifi.ap.pass || "" : "";

			g_staList = [];
			if (Array.isArray(cfg.wifi.sta)) {
				cfg.wifi.sta.forEach((item) => {
					if (item && item.ssid) g_staList.push({ ssid: item.ssid, pass: item.pass || "" });
				});
			}
			renderStaList();
		}

		// PWM
		if (cfg.hw && cfg.hw.fanPwm) {
			if (elPwmPin())     elPwmPin().value     = cfg.hw.fanPwm.pin ?? "";
			if (elPwmChannel()) elPwmChannel().value = cfg.hw.fanPwm.channel ?? "";
			if (elPwmFreq())    elPwmFreq().value    = cfg.hw.fanPwm.freq ?? "";
			if (elPwmRes())     elPwmRes().value     = cfg.hw.fanPwm.res ?? "";
		}

		// 프리셋/스타일 옵션
		loadPresetsFromConfig(cfg);

		// Motion / Wind (config → motion.sim)
		const sim = (motionData && motionData.motion && motionData.motion.sim) ? motionData.motion.sim : {};
		if (elIntensity())   elIntensity().value   = sim.intensity ?? "";
		if (elVariability()) elVariability().value = sim.variability ?? "";
		if (elGustFreq())    elGustFreq().value    = sim.gustFreq ?? "";
		if (elFanLimit())    elFanLimit().value    = sim.fanLimit ?? "";
		if (elMinFan())      elMinFan().value      = sim.minFan ?? "";
		if (elTurbLen())     elTurbLen().value     = sim.turbLenScale ?? "";
		if (elTurbSig())     elTurbSig().value     = sim.turbSigma ?? "";
		if (elThermStr())    elThermStr().value    = sim.thermalStrength ?? "";
		if (elThermRad())    elThermRad().value    = sim.thermalRadius ?? "";

		if (elPreset() && sim.presetCode) elPreset().value = sim.presetCode;
		if (elStyle() && sim.styleCode)   elStyle().value  = sim.styleCode;
		if (elFanPower() && sim.fanPowerEnabled !== undefined) elFanPower().checked = !!sim.fanPowerEnabled;

		// Timing
		const timing = (cfg.motion && cfg.motion.timing) ? cfg.motion.timing : cfg.timing;
		if (timing) {
			if (elSimInt())     elSimInt().value     = timing.simIntervalMs ?? "";
			if (elGustInt())    elGustInt().value    = timing.gustIntervalMs ?? "";
			if (elThermalInt()) elThermalInt().value = timing.thermalIntervalMs ?? "";
		}

		// API Key
		if (cfg.security && cfg.security.apiKey && !getApiKey()) {
			setApiKey(cfg.security.apiKey);
			if (elApiKeyInput()) elApiKeyInput().value = cfg.security.apiKey;
		}

		g_configDirty = false;
		updateDirtyButton();
	} finally {
		hideLoading();
	}
}

function loadPresetsFromConfig(cfg) {
	// Presets
	const sel = elPreset();
	if (sel) {
		sel.innerHTML = "";
		let presets = [];
		if (cfg.windDict && Array.isArray(cfg.windDict.presets)) presets = cfg.windDict.presets;
		else if (cfg.motion && Array.isArray(cfg.motion.presets)) presets = cfg.motion.presets;

		g_windDictPresets = presets;

		if (!presets.length) {
			const opt = document.createElement("option");
			opt.value = "";
			opt.textContent = "(프리셋 없음)";
			sel.appendChild(opt);
		} else {
			presets.forEach((p, idx) => {
				const opt = document.createElement("option");
				opt.value = p.code || p.id || String(idx);
				opt.textContent = p.name || p.label || p.code || `Preset ${idx + 1}`;
				sel.appendChild(opt);
			});
		}
	}

	// Styles
	const styleSel = elStyle();
	if (styleSel) {
		styleSel.innerHTML = "";
		let styles = [];
		if (cfg.windDict && Array.isArray(cfg.windDict.styles)) styles = cfg.windDict.styles;

		g_windDictStyles = styles;

		if (!styles.length) {
			const opt = document.createElement("option");
			opt.value = "BALANCE";
			opt.textContent = "BALANCE";
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
}

/* ==============================
 * 5. 프리셋/스타일 자동 채움 (Q4)
 * ============================== */
function _r2(v) {
	const n = Number(v);
	return isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function onPresetOrStyleChanged() {
	const presetCode = elPreset() ? elPreset().value : "";
	const styleCode  = elStyle()  ? elStyle().value  : "";
	if (!presetCode) return;

	const preset = g_windDictPresets.find((p) => p.code === presetCode);
	if (!preset || !preset.factors) return;

	const style = g_windDictStyles.find((s) => s.code === styleCode) || {};
	const sf = style.factors || {};

	const pf = preset.factors;

	const intV  = _r2((pf.windIntensity ?? 0)      * (sf.intensityFactor    ?? 1.0));
	const varV  = _r2((pf.windVariability ?? 0)    * (sf.variabilityFactor  ?? 1.0));
	const gustV = _r2((pf.gustFrequency ?? 0)      * (sf.gustFactor         ?? 1.0));
	const flV   = _r2(pf.fanLimit ?? 0);
	const minV  = _r2(pf.minFan ?? 0);
	const tlV   = _r2(pf.turbulenceLengthScale ?? 0);
	const tsV   = _r2(pf.turbulenceIntensitySigma ?? 0);
	const thBV  = _r2((pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor   ?? 1.0));
	const thRV  = _r2(pf.thermalBubbleRadius ?? 0);

	if (elIntensity())   elIntensity().value   = intV;
	if (elVariability()) elVariability().value = varV;
	if (elGustFreq())    elGustFreq().value    = gustV;
	if (elFanLimit())    elFanLimit().value    = flV;
	if (elMinFan())      elMinFan().value      = minV;
	if (elTurbLen())     elTurbLen().value     = tlV;
	if (elTurbSig())     elTurbSig().value     = tsV;
	if (elThermStr())    elThermStr().value    = thBV;
	if (elThermRad())    elThermRad().value    = thRV;

	markDirty();
}

/* ==============================
 * 6. 임시 적용
 * ============================== */
async function applyTempPreset() {
	const presetCode = elPreset() ? elPreset().value : "";
	const styleCode  = elStyle()  ? elStyle().value  : "BALANCE";
	const forever    = elOverrideForever() ? elOverrideForever().checked : false;
	const sec        = forever ? 0 : parseInt(elOverrideSeconds() ? elOverrideSeconds().value || "300" : "300", 10);

	if (!presetCode) {
		notify("프리셋을 선택하세요.", "warn");
		return;
	}

	const preset = g_windDictPresets.find((p) => p.code === presetCode);
	if (!preset || !preset.factors) {
		notify("프리셋 정보를 불러올 수 없습니다.", "err");
		return;
	}

	const style = g_windDictStyles.find((s) => s.code === styleCode) || {};
	const sf = style.factors || {};
	const pf = preset.factors;

	// 폼 값 - (preset × style) = 델타
	const baseInt  = (pf.windIntensity ?? 0)      * (sf.intensityFactor   ?? 1.0);
	const baseVar  = (pf.windVariability ?? 0)    * (sf.variabilityFactor ?? 1.0);
	const baseGust = (pf.gustFrequency ?? 0)      * (sf.gustFactor        ?? 1.0);
	const baseFL   = pf.fanLimit ?? 0;
	const baseMin  = pf.minFan ?? 0;
	const baseTL   = pf.turbulenceLengthScale ?? 0;
	const baseTS   = pf.turbulenceIntensitySigma ?? 0;
	const baseThB  = (pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor  ?? 1.0);
	const baseThR  = pf.thermalBubbleRadius ?? 0;

	const adj = {
		windIntensity:            (Number(elIntensity()   && elIntensity().value)   || 0) - baseInt,
		windVariability:          (Number(elVariability() && elVariability().value) || 0) - baseVar,
		gustFrequency:            (Number(elGustFreq()    && elGustFreq().value)    || 0) - baseGust,
		fanLimit:                 (Number(elFanLimit()    && elFanLimit().value)    || 0) - baseFL,
		minFan:                   (Number(elMinFan()      && elMinFan().value)      || 0) - baseMin,
		turbulenceLengthScale:    (Number(elTurbLen()     && elTurbLen().value)     || 0) - baseTL,
		turbulenceIntensitySigma: (Number(elTurbSig()     && elTurbSig().value)     || 0) - baseTS,
		thermalBubbleStrength:    (Number(elThermStr()    && elThermStr().value)    || 0) - baseThB,
		thermalBubbleRadius:      (Number(elThermRad()    && elThermRad().value)    || 0) - baseThR
	};

	const body = {
		presetCode,
		styleCode,
		durationSec: sec,
		forever,
		adjust: adj
	};

	await apiFetch(SNW_API.API_HTTP_CTL_OVR_PRESET, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "임시 적용");

	setTimeout(loadStateOnce, 300);
}

async function stopTemp() {
	await apiFetch(SNW_API.API_HTTP_CTL_OVR_CLEAR, { method: "POST" }, false, "임시 적용 중지");
	setTimeout(loadStateOnce, 300);
}

/* ==============================
 * 7. 저장
 * ============================== */
async function saveMotionPatch() {
	// config 저장 (영구)
	const motionBody = {
		motion: {
			sim: {
				presetCode:      elPreset() ? elPreset().value : null,
				styleCode:       elStyle()  ? elStyle().value  : null,
				fanPowerEnabled: elFanPower() ? elFanPower().checked : true,
				intensity:       Number(elIntensity()   && elIntensity().value)   || 0,
				variability:     Number(elVariability() && elVariability().value) || 0,
				gustFreq:        Number(elGustFreq()    && elGustFreq().value)    || 0,
				fanLimit:        Number(elFanLimit()    && elFanLimit().value)    || 0,
				minFan:          Number(elMinFan()      && elMinFan().value)      || 0,
				turbLenScale:    Number(elTurbLen()     && elTurbLen().value)     || 0,
				turbSigma:       Number(elTurbSig()     && elTurbSig().value)     || 0,
				thermalStrength: Number(elThermStr()    && elThermStr().value)    || 0,
				thermalRadius:   Number(elThermRad()    && elThermRad().value)    || 0
			}
		}
	};

	await apiFetch(SNW_API.API_HTTP_MOTION, {
		method: "POST",
		body: JSON.stringify(motionBody)
	}, false, "풍속 설정");

	// 파일 저장
	await apiFetch(SNW_API.API_HTTP_CONFIG_SAVE, {
		method: "POST",
		body: JSON.stringify({})
	}, true, "");

	// override 해제 (기존)
	if (g_overrideActive) {
		await apiFetch(SNW_API.API_HTTP_CTL_OVR_CLEAR, { method: "POST" }, true, "");
	}

	g_configDirty = false;
	updateDirtyButton();
	notify("풍속 설정이 저장되었습니다.", "ok");

	setTimeout(loadStateOnce, 300);
}

async function saveTimingPatch() {
	const body = {
		motion: {
			timing: {
				simIntervalMs:     Number(elSimInt().value || 0),
				gustIntervalMs:    Number(elGustInt().value || 0),
				thermalIntervalMs: Number(elThermalInt().value || 0)
			}
		}
	};
	await apiFetch(SNW_API.API_HTTP_MOTION, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "타이밍 설정");
	markDirty();
}

async function saveWifiApPatch() {
	const body = {
		wifi: {
			wifiMode: Number(elWifiModeSel().value || 0),
			ap: { ssid: elApSsid().value || "", pass: elApPass().value || "" }
		}
	};
	await apiFetch(SNW_API.API_HTTP_WIFI_CONFIG, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "Wi-Fi AP 설정");
	markDirty();
}

async function saveWifiStaPatch() {
	const body = {
		wifi: {
			sta: g_staList.map((item) => ({ ssid: item.ssid, pass: item.pass || "" }))
		}
	};
	await apiFetch(SNW_API.API_HTTP_WIFI_CONFIG, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "Wi-Fi STA 목록");
	markDirty();
}

async function savePwmPatch() {
	const body = {
		hw: {
			fanPwm: {
				pin:     Number(elPwmPin().value || 0),
				channel: Number(elPwmChannel().value || 0),
				freq:    Number(elPwmFreq().value || 0),
				res:     Number(elPwmRes().value || 0)
			}
		}
	};
	await apiFetch(SNW_API.API_HTTP_SYSTEM, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "PWM 하드웨어");
	markDirty();
}

/* ==============================
 * 8. 전체 저장 / 초기화
 * ============================== */
async function saveAllConfig() {
	if (!g_configDirty) {
		notify("변경 사항이 없습니다.", "info");
		return;
	}
	if (!confirm("현재까지의 메모리 변경 내용을 모두 저장하시겠습니까?")) return;

	await apiFetch(SNW_API.API_HTTP_CONFIG_SAVE, {
		method: "POST",
		body: JSON.stringify({ save_all: true })
	}, false, "전체 Config 저장");

	g_configDirty = false;
	updateDirtyButton();
}

async function factoryReset() {
	if (!confirm("⚠️ 모든 설정을 기본값으로 초기화합니다.\n진행하시겠습니까?")) return;

	await apiFetch(SNW_API.API_HTTP_CONFIG_INIT, {
		method: "POST",
		body: JSON.stringify({ factory: true })
	}, false, "Factory Reset");

	await loadConfig();
	await loadStateOnce();
}

/* ==============================
 * 9. Wi-Fi / STA
 * ============================== */
async function scanWifi() {
	const data = await apiFetch(SNW_API.API_HTTP_WIFI_SCAN, { method: "GET" }, true);
	const list = (data && data.wifi && data.wifi.scan) ? data.wifi.scan : data || [];
	renderScanList(list);
	notify("Wi-Fi 스캔 완료", "ok");
}

async function loadWifiStateOnce() {
	const data = await apiFetch(SNW_API.API_HTTP_WIFI_STATE, { method: "GET" }, true);
	if (!data) return;
	const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : {};
	if (elWifiMode()) elWifiMode().textContent = (wifi.mode_name || wifi.mode || "-").toString();
	if (elCurSsid())  elCurSsid().textContent  = wifi.ssid || "-";
	if (elIp())       elIp().textContent       = wifi.ip || "-";
}

/* ==============================
 * 9-1. 프로파일 목록 로드
 * ============================== */
async function loadUserProfiles() {
	const data = await apiFetch(SNW_API.API_HTTP_USER_PROFILES, { method: "GET" }, true);
	let profiles = [];
	if (data && data.userProfiles && Array.isArray(data.userProfiles.profiles)) {
		profiles = data.userProfiles.profiles;
	}
	g_userProfiles = profiles;

	const sel = elProfileSelect();
	if (!sel) return;
	sel.innerHTML = "";

	if (!profiles.length) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "(프로파일 없음)";
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

	// 실행 중인 프로파일이 있으면 그걸로 선택
	if (g_activeProfileNo > 0 && sel.querySelector(`option[value="${g_activeProfileNo}"]`)) {
		sel.value = g_activeProfileNo;
	}
}

/* ==============================
 * 9-2. 프로파일 실행
 * ============================== */
async function runSelectedProfile() {
	const sel = elProfileSelect();
	if (!sel) return;
	const no = Number(sel.value);
	if (!no || no <= 0) {
		notify("실행할 프로파일을 선택하세요.", "warn");
		return;
	}

	const target = g_userProfiles.find((p) => Number(p.profileNo) === no);
	if (target && target.enabled === false) {
		notify(`프로파일 "${target.name}"은(는) 비활성 상태입니다.`, "warn");
		return;
	}

	const result = await apiFetch(SNW_API.API_HTTP_CTL_PROF_SEL, {
		method: "POST",
		body: JSON.stringify({ id: no })
	}, false, `프로파일 #${no} 실행`);

	if (result) {
		setTimeout(loadStateOnce, 300);
	}
}

/* ==============================
 * 9-3. 프로파일 중지
 * ============================== */
async function stopActiveProfile() {
	const result = await apiFetch(SNW_API.API_HTTP_CTL_PROF_STOP, {
		method: "POST"
	}, false, "프로파일 중지");

	if (result) {
		setTimeout(loadStateOnce, 300);
	}
}

function renderStaList() {
	const container = elStaList();
	if (!container) return;
	container.innerHTML = "";
	if (!g_staList || g_staList.length === 0) {
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
	g_staList.forEach((item, idx) => {
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
			g_staList.splice(idx, 1);
			renderStaList();
			markDirty();
		});
		tdAct.appendChild(btnDel);
		tr.appendChild(tdAct);
		tbody.appendChild(tr);
	});
	table.appendChild(tbody);
	container.appendChild(table);
}

function renderScanList(networks) {
	const sel = elScanList();
	if (!sel) return;
	sel.innerHTML = "";
	if (!networks || networks.length === 0) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "검색된 네트워크가 없습니다.";
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
}

function addStaFromScan() {
	const sel = elScanList();
	const passInput = elScanPass();
	if (!sel) return;
	const ssid = sel.value || "";
	if (!ssid) { notify("추가할 SSID를 선택하세요.", "warn"); return; }
	const pass = passInput ? passInput.value : "";
	if (g_staList.some((s) => s.ssid === ssid)) { notify("이미 등록된 SSID입니다.", "warn"); return; }
	g_staList.push({ ssid, pass });
	renderStaList();
	markDirty();
	if (passInput) passInput.value = "";
}

/* ==============================
 * 10. API Key / 업로드
 * ============================== */
function applyApiKeyFromInput() {
	const input = elApiKeyInput();
	if (!input) return;
	setApiKey(input.value.trim());
	notify("API Key가 브라우저에 저장되었습니다.", "ok");
}

async function uploadFile(endpoint, file, msgEl, successMsg, errorMsg) {
	if (!file) { notify("파일을 선택하세요.", "warn"); return; }
	const apiKey = getApiKey();
	const formData = new FormData();
	formData.append("file", file, file.name);
	showLoading();
	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: apiKey ? { "X-API-Key": apiKey } : {},
			body: formData
		});
		const text = await res.text();
		if (!res.ok) throw new Error(`HTTP ${res.status} / ${text}`);
		if (msgEl) msgEl.textContent = text || successMsg;
		notify(successMsg, "ok");
	} catch (e) {
		console.error("[Main] uploadFile failed:", e.message);
		if (msgEl) msgEl.textContent = e.message;
		notify(errorMsg + ": " + e.message, "err");
	} finally {
		hideLoading();
	}
}

function handleStaticUpload() {
	const f = elUpload() ? elUpload().files[0] : null;
	uploadFile(SNW_API.API_HTTP_FILE_UPLOAD, f, elUploadMsg(), "정적 파일 업로드 완료", "정적 파일 업로드 실패");
}

function handleOtaUpload() {
	const f = elOTA() ? elOTA().files[0] : null;
	uploadFile(SNW_API.API_HTTP_FW_UPDATE, f, elOtaMsg(), "OTA 업데이트 전송 완료", "OTA 업데이트 실패");
}

/* ==============================
 * 11. 초기 로그 / WebSocket
 * ============================== */
async function loadLogsOnce() {
	const el = elLogConsole();
	if (!el) return;
	const data = await apiFetch(SNW_API.API_HTTP_LOGS, { method: "GET" }, true);
	if (data && Array.isArray(data.logs)) {
		el.textContent = data.logs
			.map(l => `[${l.ts ?? "?"}] L${l.lv ?? "?"} ${l.msg ?? ""}`)
			.join("\n");
		if (el.textContent) el.textContent += "\n";
		el.scrollTop = el.scrollHeight;
	} else {
		el.textContent = "";
	}
}

function initWebSocketLog() {
	try {
		const url = buildWsUrl(SNW_API.WS_API_LOG);
		const ws = new WebSocket(url);
		g_wsLog = ws;
		ws.onopen = () => {
			const el = elLogConsole();
			if (el) { el.textContent += "[WS] 로그 스트림 연결됨.\n"; el.scrollTop = el.scrollHeight; }
		};
		ws.onmessage = (ev) => {
			const el = elLogConsole();
			if (!el) return;
			el.textContent += ev.data + "\n";
			el.scrollTop = el.scrollHeight;
		};
		ws.onclose = () => console.log("[WS-LOG] disconnected");
		ws.onerror = (err) => console.error("[WS-LOG] error:", err);
	} catch (e) {
		console.error("[WS-LOG] init failed:", e.message);
	}
}

function clearLogConsole() {
	const el = elLogConsole();
	if (el) el.textContent = "";
}

function initWebSocketState() {
	try {
		const url = buildWsUrl(SNW_API.WS_API_STATE);
		const ws = new WebSocket(url);
		g_wsState = ws;
		ws.onopen = () => console.log("[WS-STATE] connected");
		ws.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				_applySimToUi(data.sim || {}, data.control || {});
			} catch (e) {
				console.warn("[WS-STATE] invalid JSON:", ev.data);
			}
		};
		ws.onclose = () => console.log("[WS-STATE] disconnected");
		ws.onerror = (err) => console.error("[WS-STATE] error:", err);
	} catch (e) {
		console.error("[WS-STATE] init failed:", e.message);
	}
}

/* ==============================
 * 12. 이벤트 바인딩
 * ============================== */
function bindEvents() {
	// 상태
	const btnRefresh = document.getElementById("btnRefresh");
	if (btnRefresh) btnRefresh.addEventListener("click", () => {
		loadStateOnce();
		loadWifiStateOnce();
	});

	// 프로파일 실행/중지
	const btnProfileRun = document.getElementById("btnProfileRun");
	if (btnProfileRun) btnProfileRun.addEventListener("click", runSelectedProfile);

	const btnProfileStop = document.getElementById("btnProfileStop");
	if (btnProfileStop) btnProfileStop.addEventListener("click", stopActiveProfile);

	// 프리셋/스타일 자동 채움
	if (elPreset()) elPreset().addEventListener("change", onPresetOrStyleChanged);
	if (elStyle())  elStyle().addEventListener("change", onPresetOrStyleChanged);

	// 임시 적용
	const btnApplyTemp = document.getElementById("btnApplyTemp");
	if (btnApplyTemp) btnApplyTemp.addEventListener("click", applyTempPreset);

	const btnStopTemp = document.getElementById("btnStopTemp");
	if (btnStopTemp) btnStopTemp.addEventListener("click", stopTemp);

	// 저장
	const btnSaveSim = document.getElementById("btnSaveSim");
	if (btnSaveSim) btnSaveSim.addEventListener("click", saveMotionPatch);

	if (elBtnSaveAll()) elBtnSaveAll().addEventListener("click", saveAllConfig);

	const btnConfigInit = document.getElementById("btnConfigInit");
	if (btnConfigInit) btnConfigInit.addEventListener("click", factoryReset);

	const btnSaveTiming = document.getElementById("btnSaveTiming");
	if (btnSaveTiming) btnSaveTiming.addEventListener("click", saveTimingPatch);

	const btnSaveWifiAP = document.getElementById("btnSaveWifiAP");
	if (btnSaveWifiAP) btnSaveWifiAP.addEventListener("click", saveWifiApPatch);

	const btnSaveWifiSTA = document.getElementById("btnSaveWifiSTA");
	if (btnSaveWifiSTA) btnSaveWifiSTA.addEventListener("click", saveWifiStaPatch);

	const btnSavePWM = document.getElementById("btnSavePWM");
	if (btnSavePWM) btnSavePWM.addEventListener("click", savePwmPatch);

	const btnScan = document.getElementById("btnScan");
	if (btnScan) btnScan.addEventListener("click", scanWifi);

	const btnUseScan = document.getElementById("btnUseScan");
	if (btnUseScan) btnUseScan.addEventListener("click", addStaFromScan);

	const btnSaveApiKey = document.getElementById("btnSaveApiKey");
	if (btnSaveApiKey) btnSaveApiKey.addEventListener("click", applyApiKeyFromInput);

	const btnUploadStatic = document.getElementById("btnUploadStatic");
	if (btnUploadStatic) btnUploadStatic.addEventListener("click", handleStaticUpload);

	const btnUploadOTA = document.getElementById("btnUploadOTA");
	if (btnUploadOTA) btnUploadOTA.addEventListener("click", handleOtaUpload);

	const btnClearLog = document.getElementById("btnClearLog");
	if (btnClearLog) btnClearLog.addEventListener("click", clearLogConsole);

	// 팬 전원 / 폼 변경 → dirty
	if (elFanPower()) elFanPower().addEventListener("change", markDirty);

	const inputSelectors = [
		"#intensity", "#gust_freq", "#variability", "#fanLimit", "#minFan",
		"#turb_len", "#turb_sig", "#therm_str", "#therm_rad",
		"#sim_int", "#gust_int", "#thermal_int",
		"#wifi_mode", "#ap_ssid", "#ap_password",
		"#pwm_pin", "#pwm_channel", "#pwm_freq", "#pwm_res"
	];
	inputSelectors.forEach((sel) => {
		const el = document.querySelector(sel);
		if (el) {
			el.addEventListener("change", markDirty);
			el.addEventListener("input", markDirty);
		}
	});
}

/* ==============================
 * 13. 초기화
 * ============================== */
document.addEventListener("DOMContentLoaded", async () => {
	const key = getApiKey();
	if (elApiKeyInput()) elApiKeyInput().value = key;

	updateDirtyButton();
	bindEvents();

	await loadLogsOnce();
	initWebSocketLog();
	initWebSocketState();

	await loadFwVersion();
	await loadConfig();
	await loadUserProfiles();      // 프로파일 목록 로드
	await loadStateOnce();
	await loadWifiStateOnce();

	if (g_wifiStateTimer) clearInterval(g_wifiStateTimer);
	g_wifiStateTimer = setInterval(loadWifiStateOnce, 30000);

	window.addEventListener("beforeunload", () => {
		if (g_wifiStateTimer) {
			clearInterval(g_wifiStateTimer);
			g_wifiStateTimer = null;
		}
	});
});
