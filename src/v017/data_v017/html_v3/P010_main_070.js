/* P010_main_070.js
 * ------------------------------------------------------
 * 모듈명 : Smart Nature Wind Main UI Logic (공통 유틸리티 적용)
 * ------------------------------------------------------
 * 기능 요약:
 *  - /api/config, /api/state 연동하여 초기 상태/설정 로딩
 *  - 풍속(Motion) 파라미터 메모리 패치
 *  - TIMING 파라미터 메모리 패치
 *  - Wi-Fi AP / STA / 스캔 / PWM 하드웨어 설정 메모리 패치
 *  - 전체 Config 저장 (/api/config/save) 및 Factory Reset (/api/config/init)
 *  - API Key 로컬 저장 및 모든 요청에 X-API-Key 포함
 *  - 파일 업로드 (/upload) 및 OTA 업데이트 (/update)
 *  - WebSocket 로그 (/ws/log) + 상태 (/ws/state) 연동
 *
 * ※ 공통 함수 (P000_common_070.js)
 *    apiFetch, getApiKey, setApiKey, buildWsUrl, showLoading, hideLoading, notify, $, text
 * ※ 전역 상수 (P001_API_0610js)
 *    SNW_API.*
 * ------------------------------------------------------
 */

/* ==============================
 * 2. DOM 요소 참조
 * ============================== */
const elFwVer        = () => document.getElementById("fwVer");
const elSimActive    = () => document.getElementById("simActive");
const elPhase        = () => document.getElementById("phase");
const elWind         = () => document.getElementById("wind");
const elPwm          = () => document.getElementById("pwm");
const elWifiMode     = () => document.getElementById("wifiMode");
const elCurSsid      = () => document.getElementById("curSsid");
const elIp           = () => document.getElementById("ip");

const elPreset       = () => document.getElementById("preset");
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
 * 3. 전역 상태 (Dirty 플래그, STA 목록)
 * ============================== */
let g_configDirty = false;
let g_staList = []; // [{ssid, pass}, ...]
let g_wsLog = null;
let g_wsState = null;

/** Dirty 플래그 UI 반영 */
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
}

/* ==============================
 * 4. 초기 데이터 로딩
 * ============================== */

async function loadFwVersion() {
	const data = await apiFetch(SNW_API.API_HTTP_VERSION, { method: "GET" }, true);
	let versionText = "…";
	if (typeof data === "string") {
		versionText = data;
	} else if (data && (data.version || data.fw || data.fw_version)) {
		versionText = data.version || data.fw || data.fw_version;
	}
	const el = elFwVer();
	if (el) el.textContent = versionText;
}

async function loadStateOnce() {
	const data = await apiFetch(SNW_API.API_HTTP_STATE, { method: "GET" }, true);
	if (!data) return;

	// sim 정보 추정
	const sim = data.sim || data.motion || data.state || {};
	const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : data.wifi || {};

	const simActive = sim.active !== undefined ? sim.active : sim.simActive;
	const phase     = sim.phase !== undefined ? sim.phase : sim.phaseName;
	const wind      = sim.wind !== undefined ? sim.wind : sim.wind_ms;
	const pwm       = sim.pwm !== undefined ? sim.pwm : sim.pwm_val;

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
	if (elP) elP.textContent = phase != null ? String(phase) : "-";

	const elW = elWind();
	if (elW) elW.textContent = wind != null ? String(wind) : "-";

	const elPw = elPwm();
	if (elPw) elPw.textContent = pwm != null ? String(pwm) : "-";

	const elWM = elWifiMode();
	if (elWM) elWM.textContent = (wifi.mode_name || wifi.mode || "-").toString();

	const elWS = elCurSsid();
	if (elWS) elWS.textContent = wifi.ssid || "-";

	const elIP = elIp();
	if (elIP) elIP.textContent = wifi.ip || "-";
}

async function loadConfig() {
	// showLoading은 apiFetch 내부에서 호출되지만, 응답 이후에도 UI 처리가 필요하므로 다시 showLoading
	showLoading();
	const cfg = await apiFetch(SNW_API.API_HTTP_CONFIG, { method: "GET" }, true);
	showLoading();  // apiFetch가 hideLoading을 호출했으므로 다시 표시
	if (!cfg) {
		hideLoading();
		return;
	}

	// ---- Wi-Fi ----
	if (cfg.wifi) {
		if (elWifiModeSel()) elWifiModeSel().value = cfg.wifi.wifiMode ?? 0;
		if (elApSsid()) elApSsid().value = cfg.wifi.ap ? cfg.wifi.ap.ssid || "" : "";
		if (elApPass()) elApPass().value = cfg.wifi.ap ? cfg.wifi.ap.pass || "" : "";

		g_staList = [];
		if (Array.isArray(cfg.wifi.sta)) {
			cfg.wifi.sta.forEach((item) => {
				if (item && item.ssid) {
					g_staList.push({ ssid: item.ssid, pass: item.pass || "" });
				}
			});
		}
		renderStaList();
	}

	// ---- PWM HW ----
	if (cfg.hw && cfg.hw.fanPwm) {
		if (elPwmPin())     elPwmPin().value     = cfg.hw.fanPwm.pin      ?? "";
		if (elPwmChannel()) elPwmChannel().value = cfg.hw.fanPwm.channel  ?? "";
		if (elPwmFreq())    elPwmFreq().value    = cfg.hw.fanPwm.freq     ?? "";
		if (elPwmRes())     elPwmRes().value     = cfg.hw.fanPwm.res      ?? "";
	}

	// ---- Motion / Wind ----
	let motion = null;
	if (cfg.motion && cfg.motion.current) {
		motion = cfg.motion.current;
	} else if (cfg.motion && cfg.motion.active) {
		motion = cfg.motion.active;
	} else if (cfg.control && cfg.control.wind) {
		motion = cfg.control.wind;
	}

	if (motion) {
		if (elIntensity())   elIntensity().value   = motion.intensity   ?? "";
		if (elGustFreq())    elGustFreq().value    = motion.gust_freq   ?? "";
		if (elVariability()) elVariability().value = motion.variability ?? "";
		if (elFanLimit())    elFanLimit().value    = motion.fanLimit   ?? "";
		if (elMinFan())      elMinFan().value      = motion.minFan     ?? "";
		if (elTurbLen())     elTurbLen().value     = motion.turb_len    ?? "";
		if (elTurbSig())     elTurbSig().value     = motion.turb_sig    ?? "";
		if (elThermStr())    elThermStr().value    = motion.therm_str   ?? "";
		if (elThermRad())    elThermRad().value    = motion.thermalBubbleRadius ?? motion.therm_rad   ?? "";
	}

	// ---- Timing ----
	const timing = (cfg.motion && cfg.motion.timing) ? cfg.motion.timing : cfg.timing;
	if (timing) {
		if (elSimInt())     elSimInt().value     = timing.simIntervalMs     ?? "";
		if (elGustInt())    elGustInt().value    = timing.gustIntervalMs    ?? "";
		if (elThermalInt()) elThermalInt().value = timing.thermalIntervalMs ?? "";
	}

	loadPresetsFromConfig(cfg);

	// ---- Security(API Key) ----
	if (cfg.security && cfg.security.apiKey && !getApiKey()) {
		setApiKey(cfg.security.apiKey);
		if (elApiKeyInput()) elApiKeyInput().value = cfg.security.apiKey;
	}

	g_configDirty = false;
	updateDirtyButton();
	hideLoading();
}

function loadPresetsFromConfig(cfg) {
	const sel = elPreset();
	if (!sel) return;
	sel.innerHTML = "";

	let presets = [];
	if (cfg.motion && Array.isArray(cfg.motion.presets)) presets = cfg.motion.presets;
	else if (cfg.windDict && Array.isArray(cfg.windDict.presets)) presets = cfg.windDict.presets;
	else if (cfg.windProfile && Array.isArray(cfg.windProfile.presets)) presets = cfg.windProfile.presets;
	else if (Array.isArray(cfg.windProfiles)) presets = cfg.windProfiles;

	if (!Array.isArray(presets) || presets.length === 0) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "(프리셋 없음)";
		sel.appendChild(opt);
		return;
	}

	presets.forEach((p, idx) => {
		const opt = document.createElement("option");
		opt.value = p.id != null ? p.id : (p.code || p.name || String(idx));
		opt.textContent = p.label || p.name || `Preset ${idx + 1}`;
		sel.appendChild(opt);
	});
}

/* ==============================
 * 5. STA 리스트 / 스캔 렌더링
 * ============================== */

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

/* ==============================
 * 6. 섹션별 메모리 패치 (PATCH)
 * ============================== */

// P010_main_070.js saveMotionPatch

async function saveMotionPatch() {
	const body = {
		windIntensity: Number(elIntensity().value || 0),
		gustFrequency: Number(elGustFreq().value || 0),
		windVariability: Number(elVariability().value || 0),
		fanLimit: Number(elFanLimit().value || 0),
		minFan: Number(elMinFan().value || 0),
		turbulenceLengthScale: Number(elTurbLen().value || 0),
		turbulenceIntensitySigma: Number(elTurbSig().value || 0),
		thermalBubbleStrength: Number(elThermStr().value || 0),
		thermalBubbleRadius: Number(elThermRad().value || 0),
		presetCode: elPreset().value || null
	};

	await apiFetch(SNW_API.API_HTTP_SIMULATION, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "풍속 설정");

	markDirty();
}

async function saveTimingPatch() {
	const body = {
		motion:{
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
			ap: {
				ssid: elApSsid().value || "",
				pass: elApPass().value || ""
			}
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
		wifi:{
			sta: g_staList.map((item) => ({
				ssid: item.ssid,
				pass: item.pass || ""
			}))
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
 * 7. Config 전체 저장 + Factory Reset
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
 * 8. Wi-Fi 스캔 및 STA 추가
 * ============================== */

async function scanWifi() {
	const data = await apiFetch(SNW_API.API_HTTP_WIFI_SCAN, { method: "GET" }, true);
	const list = (data && data.wifi && data.wifi.scan) ? data.wifi.scan : data || [];
	renderScanList(list);
	notify("Wi-Fi 스캔 완료", "ok");
}

function addStaFromScan() {
	const sel = elScanList();
	const passInput = elScanPass();
	if (!sel) return;

	const ssid = sel.value || "";
	if (!ssid) {
		notify("추가할 SSID를 선택하세요.", "warn");
		return;
	}
	const pass = passInput ? passInput.value : "";

	if (g_staList.some((s) => s.ssid === ssid)) {
		notify("이미 등록된 SSID입니다.", "warn");
		return;
	}

	g_staList.push({ ssid, pass });
	renderStaList();
	markDirty();
	if (passInput) passInput.value = "";
}

/* ==============================
 * 9. API Key 저장
 * ============================== */

function applyApiKeyFromInput() {
	const input = elApiKeyInput();
	if (!input) return;
	setApiKey(input.value.trim());
	notify("API Key가 브라우저에 저장되었습니다.", "ok");
}

/* ==============================
 * 10. 파일 업로드 / OTA
 * ============================== */

async function uploadFile(endpoint, file, msgEl, successMsg, errorMsg) {
	if (!file) {
		notify("파일을 선택하세요.", "warn");
		return;
	}

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
		console.error("[Main021] uploadFile failed:", e.message);
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
 * 11. WebSocket 로그 / 상태
 * ============================== */

function initWebSocketLog() {
	try {
		const url = buildWsUrl(SNW_API.WS_API_LOG);
		const ws = new WebSocket(url);
		g_wsLog = ws;

		ws.onopen = () => {
			console.log("[WS-LOG] connected");
			const el = elLogConsole();
			if (el) el.textContent = "WebSocket 로그 연결됨.\n";
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
				handleStateUpdateFromWs({ ...data });
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

function handleStateUpdateFromWs(data) {
	if (!data) return;

	const sim = data.sim || data.motion || data.state || {};
	const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : data.wifi || {};

	const simActive = sim.active !== undefined ? sim.active : sim.simActive;
	const phase     = sim.phase !== undefined ? sim.phase : sim.phaseName;
	const wind      = sim.wind !== undefined ? sim.wind : sim.wind_ms;
	const pwm       = sim.pwm !== undefined ? sim.pwm : sim.pwm_val;

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
	if (elP) elP.textContent = phase != null ? String(phase) : "-";

	const elW = elWind();
	if (elW) elW.textContent = wind != null ? String(wind) : "-";

	const elPw = elPwm();
	if (elPw) elPw.textContent = pwm != null ? String(pwm) : "-";

	const elWM = elWifiMode();
	if (elWM) elWM.textContent = (wifi.mode_name || wifi.mode || "-").toString();

	const elWS = elCurSsid();
	if (elWS) elWS.textContent = wifi.ssid || "-";

	const elIP = elIp();
	if (elIP) elIP.textContent = wifi.ip || "-";
}

/* ==============================
 * 12. 이벤트 바인딩
 * ============================== */

function bindEvents() {
	const btnRefresh = document.getElementById("btnRefresh");
	if (btnRefresh) btnRefresh.addEventListener("click", () => loadStateOnce());

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

	const btnScan = document.getElementById("btnScan");
	if (btnScan) btnScan.addEventListener("click", scanWifi);

	const btnUseScan = document.getElementById("btnUseScan");
	if (btnUseScan) btnUseScan.addEventListener("click", addStaFromScan);

	const btnSavePWM = document.getElementById("btnSavePWM");
	if (btnSavePWM) btnSavePWM.addEventListener("click", savePwmPatch);

	const btnSaveApiKey = document.getElementById("btnSaveApiKey");
	if (btnSaveApiKey) btnSaveApiKey.addEventListener("click", applyApiKeyFromInput);

	const btnUploadStatic = document.getElementById("btnUploadStatic");
	if (btnUploadStatic) btnUploadStatic.addEventListener("click", handleStaticUpload);

	const btnUploadOTA = document.getElementById("btnUploadOTA");
	if (btnUploadOTA) btnUploadOTA.addEventListener("click", handleOtaUpload);

	const btnClearLog = document.getElementById("btnClearLog");
	if (btnClearLog) btnClearLog.addEventListener("click", clearLogConsole);

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
	initWebSocketLog();
	initWebSocketState();

	await loadFwVersion();
	await loadConfig();
	await loadStateOnce();
});