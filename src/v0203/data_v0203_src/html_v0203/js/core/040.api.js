// =========================================================
// 040.api.js — SNW.Api (REST 클라이언트)
// Layer 2 (서비스) — Layer 0~1 참조
//  - 모든 REST 호출은 이 모듈 경유 (fetch 직접 호출 금지)
//  - 타임아웃 / 401 처리 / 에러 파싱 / in-flight dedupe
//  - 업로드 진행률 (XHR)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
	'use strict';

	const inflight = new Map(); // key → Promise (중복 요청 방지)

	// =====================================================
	// API Key (localStorage)
	// =====================================================
	function getApiKey() {
		try { return localStorage.getItem(SNW.CFG.LS_KEY.API_KEY) || ''; }
		catch { return ''; }
	}

	function setApiKey(k) {
		try {
			if (k) localStorage.setItem(SNW.CFG.LS_KEY.API_KEY, k);
			else localStorage.removeItem(SNW.CFG.LS_KEY.API_KEY);
		} catch { }
	}

	// =====================================================
	// Query string 빌더
	// =====================================================
	function buildQuery(params) {
		if (!params) return '';
		const q = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (v != null) q.append(k, v);
		}
		const s = q.toString();
		return s ? `?${s}` : '';
	}

	// =====================================================
	// ApiError
	// =====================================================
	class ApiError extends Error {
		constructor(status, data) {
			super((data && data.error) || `HTTP ${status}`);
			this.name = 'ApiError';
			this.status = status;
			this.data = data;
		}
	}

	// =====================================================
	// =====================================================
	// [P0-1 / Stage 3] 선언형 오프라인 라우트 테이블 (정규식 매칭 + method 분기)
	// =====================================================
	const _rt = () => (SNW.Offline && SNW.Offline._runtime) ? SNW.Offline._runtime : {};
	const _cache = () => (SNW.Offline && SNW.Offline._cache) ? SNW.Offline._cache : {};

	const OFFLINE_ROUTES = [
		{ re: /\/wifi\/state$/i, method: 'GET', handle: () => ({ wifi: { state: { mode: 2, mode_name: 'AP+STA (Offline)', status: 'CONNECTED', ssid: '(offline)', ip: '192.168.4.1', mac: 'AA:BB:CC:DD:EE:FF', rssi: -50, hostname: 'naturewind-offline', connected: false, timeSynced: false, reconnectAttempts: 0 } } }) },
		{ re: /\/wifi\/config$/i, method: 'GET', handle: () => _cache().wifi || { wifi: { wifiMode: 2, ap: { ssid: 'NatureWind', pass: '2540' }, sta: [{ ssid: 'HomeWiFi_5G', pass: '12345678' }, { ssid: 'Office_AP', pass: 'admin1234' }] } } },
		{ re: /\/wifi\/config$/i, method: 'POST', handle: (body) => { const c = _cache(); if (body && body.wifi) { const prev = (c.wifi && c.wifi.wifi) ? c.wifi.wifi : {}; c.wifi = { wifi: { ...prev, ...body.wifi } }; } return { result: 'ok', offline: true, queued: true }; } },
		{ re: /\/wifi\/scan$/i, method: 'GET', handle: () => ({ wifi: { scan: [{ ssid: 'TestWiFi1', rssi: -45, enc: 'WPA2' }, { ssid: 'TestWiFi2', rssi: -70, enc: 'OPEN' }] } }) },
		{ re: /\/sim\/chart$/i, method: 'GET', handle: () => ({ chart: _rt().chart || [], series: _rt().chart || [], offline: true }) },
		{ re: /\/sim\/state$/i, method: 'GET', handle: () => ({ sim: _rt().sim || {} }) },
		{ re: /\/state$/i, method: 'GET', handle: () => { const r = _rt(); return { control: r.control || {}, sim: r.sim || {}, runtime: r.runtime || {} }; } },
		{ re: /\/system$/i, method: 'GET', handle: () => _cache().system || {} },
		{ re: /\/system$/i, method: 'POST', handle: (body) => { const c = _cache(); if (body && c.system) Object.assign(c.system, body); return { result: 'ok', offline: true }; } },
		{ re: /\/motion$/i, method: 'GET', handle: () => _cache().motion || { motion: {} } },
		{ re: /\/motion$/i, method: 'POST', handle: (body) => { const c = _cache(); if (body && c.motion) Object.assign(c.motion, body); return _cache().motion || { motion: {} }; } },
		{ re: /\/schedules/i, method: 'GET', handle: () => _cache().schedules || { schedules: [] } },
		{ re: /\/user_profiles\/patch$/i, method: 'POST', handle: (body) => { const c = _cache(); if (c.userProfiles?.userProfiles?.profiles && Array.isArray(body?.profiles)) { const list = c.userProfiles.userProfiles.profiles; for (const patch of body.profiles) { const idx = list.findIndex(p => String(p.profileId) === String(patch.profileId)); if (idx >= 0) Object.assign(list[idx], patch); } if (SNW.Offline && typeof SNW.Offline.persistCache === 'function') SNW.Offline.persistCache('userProfiles'); } return { result: 'ok', patched: body?.profiles?.length || 0, offline: true }; } },
		{ re: /\/user_profiles/i, method: 'GET', handle: () => _cache().userProfiles || { userProfiles: { profiles: [] } } },
		{ re: /\/(windDict|windProfile)/i, method: 'GET', handle: () => { const c = _cache(); return (c.windDict && c.windDict.windDict) ? c.windDict.windDict : (c.windDict || { presets: [], styles: [] }); } },
		{ re: /\/control\/mode$/i, method: 'POST', handle: (body) => { const r = _rt(); if (!r.control) r.control = {}; r.control.profileMode = !!(body && body.profileMode); return { result: 'ok', offline: true }; } },
		{ re: /\/control\/mode$/i, method: 'GET', handle: () => ({ profileMode: !!(_rt().control && _rt().control.profileMode) }) },
		{ re: /\/control\/timer$/i, method: 'DELETE', handle: () => { const r = _rt(); if (r.timer) { r.timer.active = false; r.timer.remainSec = 0; } return { success: true, active: false }; } },
		{ re: /\/control\/timer$/i, method: 'POST', handle: (body) => { const r = _rt(); const min = (body && body.minutes) || 30; r.timer = { active: true, remainSec: min * 60, durationMin: min }; return { success: true, active: true, remainSec: min * 60 }; } },
		{ re: /\/control\/timer$/i, method: 'GET', handle: () => { const t = _rt().timer; return t ? { ...t } : { active: false, remainSec: 0, durationMin: 0 }; } },
		{ re: /\/control\/override$/i, method: 'POST', handle: (body) => { const r = _rt(); if (body && r.sim) { if (body.windIntensity != null) r.sim.intensity = body.windIntensity; if (body.windVariability != null) r.sim.variability = body.windVariability; if (body.gustFrequency != null) r.sim.gustFreq = body.gustFrequency; } return { result: 'ok', updated: true, offline: true }; } },
		{ re: /\/logs$/i, method: 'GET', handle: () => ({ logs: [{ ts: 0, lv: 3, msg: '[Offline]' }] }) },
		{ re: /\/diag$/i, method: 'GET', handle: () => ({ heap: 120000, fs_used: 160000, fs_total: 1000000 }) },
		{ re: /\/version$/i, method: 'GET', handle: () => ({ fw: 'FW_Ver_2.0.3' }) },
		{ re: /\/metrics$/i, method: 'GET', handle: () => ({ metrics: {} }) },
		{ re: /\/config$/i, method: 'GET', handle: () => _cache() },
		{ re: /\/config$/i, method: 'POST', handle: (body) => { if (body) Object.assign(_cache(), body); return { result: 'ok', saved: true, offline: true }; } },
		{ re: /\/ai\/gemini$/i, method: 'POST', handle: () => ({ ok: false, error: 'offline', text: '⚠️ AI 오프라인 핸들러가 초기화되지 않았습니다. 페이지를 새로고침하세요.', actions: [] }) },
		{ re: /\/ai\/execute-action$/i, method: 'POST', handle: () => ({ ok: false, error: 'offline', actions: [] }) },
	];

	// =====================================================
	// Core fetch (_fetch)
	// =====================================================
	async function _fetch(path, opts = {}) {
		const isOffline = (SNW.Offline && typeof SNW.Offline.active === 'boolean')
			? SNW.Offline.active
			: !!window.SNW_OFFLINE;
		if (isOffline) {
			const M = (opts.method || 'GET').toUpperCase();
			const cleanPath = String(path).split('?')[0];
			const route = OFFLINE_ROUTES.find(r => r.method === M && r.re.test(cleanPath));
			if (route) return route.handle(opts.body);
			return { result: 'ok', updated: true, offline: true };
		}

		// GET 요청에 대해서만 in-flight dedupe
		const dedupeKey = (opts.method || 'GET') === 'GET' ?
			path + (opts.body ? JSON.stringify(opts.body) : '') :
			null;

		if (dedupeKey && inflight.has(dedupeKey)) {
			return inflight.get(dedupeKey);
		}

		const promise = (async () => {
			const controller = new AbortController();
			const timeoutMs = opts.timeoutMs || SNW.CFG.TIMEOUT_MS.DEFAULT;
			const timer = setTimeout(() => controller.abort(), timeoutMs);

			const headers = {
				'X-API-Key': getApiKey(),
				...(opts.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
				...(opts.headers || {})
			};

			try {
				const res = await fetch(path, {
					method: opts.method || 'GET',
					headers,
					body: opts.body ? JSON.stringify(opts.body) : undefined,
					signal: controller.signal,
					credentials: 'omit'
				});
				clearTimeout(timer);

				// 401 즉시 처리
				if (res.status === SNW.C.HTTP.UNAUTHORIZED) {
					SNW.LogUtil.warn(`[API] 401 ${path}`);
					throw new ApiError(401, { error: 'unauthorized' });
				}

				// 응답 파싱
				let data = null;
				const ct = res.headers.get('Content-Type') || '';
				if (ct.includes('application/json')) {
					data = await res.json().catch(() => null);
				} else {
					data = await res.text();
				}

				if (!res.ok) {
					const msg = (data && data.error) || `HTTP ${res.status}`;
					throw new ApiError(res.status, { error: msg });
				}

				SNW.LogUtil.debug(`[API] ${opts.method || 'GET'} ${path} → ${res.status}`);
				return data;
			} catch (e) {
				clearTimeout(timer);
				if (e.name === 'AbortError') {
					throw new ApiError(SNW.C.HTTP.TIMEOUT, { error: 'timeout' });
				}
				throw e;
			}
		})();

		if (dedupeKey) {
			inflight.set(dedupeKey, promise);
			promise.finally(() => inflight.delete(dedupeKey));
		}
		return promise;
	}

	// =====================================================
	// Multipart 업로드 (진행률 지원)
	// =====================================================
	function uploadWithProgress(url, formData, onProgress, timeoutMs) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', url);
			xhr.setRequestHeader('X-API-Key', getApiKey());
			xhr.timeout = timeoutMs || SNW.CFG.TIMEOUT_MS.UPLOAD;

			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable && typeof onProgress === 'function') {
					onProgress(e.loaded / e.total);
				}
			};
			xhr.onload = () => {
				let data = null;
				try { data = JSON.parse(xhr.responseText); }
				catch { data = xhr.responseText; }

				if (xhr.status >= 200 && xhr.status < 300) resolve(data);
				else reject(new ApiError(xhr.status, data || { error: xhr.statusText }));
			};
			xhr.onerror = () => reject(new ApiError(0, { error: 'network' }));
			xhr.ontimeout = () => reject(new ApiError(SNW.C.HTTP.TIMEOUT, { error: 'timeout' }));
			xhr.send(formData);
		});
	}

	// =====================================================
	// SNW.Api — 도메인별 그룹
	// =====================================================
	SNW.Api = Object.assign(SNW.Api || {}, {
		// --- 메타 ---
		version() { return _fetch(SNW.CFG.API.version); },
		diag() { return _fetch(SNW.CFG.API.diag); },

		// --- 상태 ---
		getState() { return _fetch(SNW.CFG.API.state); },
		getMetrics() { return _fetch(SNW.CFG.API.metrics); },
		getSummary() { return _fetch(SNW.CFG.API.controlSummary); },

		// --- 제어 (v0203) ---
		overrideFixed(percent, seconds = 0, forever = false) {
			const params = { percent };
			if (seconds > 0) params.seconds = seconds;
			if (forever) params.forever = 'true';
			return _fetch(SNW.CFG.API.overrideFixed + buildQuery(params), { method: 'POST' });
		},
		overridePreset(body) {
			return _fetch(SNW.CFG.API.overridePreset, { method: 'POST', body });
		},
		overrideClear() {
			return _fetch(SNW.CFG.API.overrideClear, { method: 'POST' });
		},
		ackEvent() {
			return _fetch(SNW.CFG.API.ack, { method: 'POST' });
		},
		setMode(isProfileMode) {
			return _fetch(SNW.CFG.API.controlMode, { method: 'POST', body: { profileMode: !!isProfileMode } });
		},
		setControlMode(isProfileMode) {
			return SNW.Api.setMode(isProfileMode);
		},
		getMode() {
			return _fetch(SNW.CFG.API.controlMode);
		},

		// --- 시뮬레이션 ---
		patchSim(patch) {
			return _fetch(SNW.CFG.API.simulation, { method: 'POST', body: { sim: patch } });
		},
		getSim() { return _fetch(SNW.CFG.API.simulation); },
		getSimState() { return _fetch(SNW.CFG.API.simState); },
		getChartHistory() { return _fetch(SNW.CFG.API.chartHistory); },
		getMonitor(type, range) {
			return _fetch(SNW.CFG.API.monitor + buildQuery({ type, range }));
		},

		// --- WindDict ---
		listWindProfiles() { return _fetch(SNW.CFG.API.windProfile); },
		getWindDict() {
			return _fetch(SNW.CFG.API.windDict).then(d => (d && d.windDict) ? d.windDict : d);
		},
		getComfort() {
			return _fetch(SNW.CFG.API.comfort);
		},
		setAutoComfort(enabled) {
			return _fetch(SNW.CFG.API.comfortAuto, { method: 'POST', body: { enabled: !!enabled } });
		},
		getAutoComfortStatus() {
			return _fetch(SNW.CFG.API.comfortAuto);
		},
		setControlTimer(minutes) {
			return _fetch(SNW.CFG.API.controlTimer, { method: 'POST', body: { minutes } });
		},
		cancelControlTimer() {
			return _fetch(SNW.CFG.API.controlTimer, { method: 'DELETE' });
		},
		getControlTimer() {
			return _fetch(SNW.CFG.API.controlTimer);
		},
		getMonitorTimeline(since = 0) {
			const q = since > 0 ? `?since=${since}` : '';
			return _fetch(`${SNW.CFG.API.monitorTimeline}${q}`);
		},
		getTimeline(since = 0) {
			return SNW.Api.getMonitorTimeline(since);
		},
		getSessionSummary(from = 0, to = 0) {
			const params = [];
			if (from > 0) params.push(`from=${from}`);
			if (to > 0) params.push(`to=${to}`);
			const q = params.length > 0 ? `?${params.join('&')}` : '';
			return _fetch(`${SNW.CFG.API.monitorSessionSummary}${q}`);
		},
		addWindProfile(body) { return _fetch(SNW.CFG.API.windProfile, { method: 'POST', body }); },
		updateWindProfile(id, b) { return _fetch(`${SNW.CFG.API.windProfile}/${id}`, { method: 'PUT', body: b }); },
		deleteWindProfile(id) { return _fetch(`${SNW.CFG.API.windProfile}/${id}`, { method: 'DELETE' }); },

		// --- Schedules ---
		listSchedules() { return _fetch(SNW.CFG.API.schedules); },
		addSchedule(body) { return _fetch(SNW.CFG.API.schedules, { method: 'POST', body }); },
		updateSchedule(id, b) { return _fetch(`${SNW.CFG.API.schedules}/${id}`, { method: 'PUT', body: b }); },
		deleteSchedule(id) { return _fetch(`${SNW.CFG.API.schedules}/${id}`, { method: 'DELETE' }); },

		// --- UserProfiles ---
		listProfiles() { return _fetch(SNW.CFG.API.userProfiles); },
		addProfile(body) { return _fetch(SNW.CFG.API.userProfiles, { method: 'POST', body }); },
		updateProfile(id, b) { return _fetch(`${SNW.CFG.API.userProfiles}/${id}`, { method: 'PUT', body: b }); },
		deleteProfile(id) { return _fetch(`${SNW.CFG.API.userProfiles}/${id}`, { method: 'DELETE' }); },
		patchProfiles(body) { return _fetch(SNW.CFG.API.userProfilesPatch, { method: 'POST', body }); },

		// --- Session (Stage 5 신규: startSession 단일화) ---
		startSession({ type, payload = {}, trigger } = {}) {
			let finalTrigger = trigger;
			if (!finalTrigger) {
				if (type === 'AUTO_FULL') finalTrigger = 'MANUAL_AUTO_FULL';
				else if (type === 'AUTO_SELECT') finalTrigger = 'MANUAL_AUTO_SELECT';
				else finalTrigger = 'MANUAL';
			}
			return _fetch(SNW.CFG.API.sessionStart, {
				method: 'POST',
				body: { type, payload, trigger: finalTrigger }
			});
		},
		startPlaylist(profileId) {
			return SNW.Api.startSession({ type: 'PLAYLIST', payload: { profileId } });
		},
		startPreset(presetCode, styleCode) {
			return SNW.Api.startSession({ type: 'PRESET', payload: { presetCode, styleCode } });
		},
		startFixed(percent) {
			return SNW.Api.startSession({ type: 'FIXED', payload: { percent } });
		},
		patchSessionRule(rule) {
			return _fetch(SNW.CFG.API.sessionRule, {
				method: 'PATCH',
				body: { rule }
			});
		},
		pauseSession() {
			return _fetch(SNW.CFG.API.sessionPause, { method: 'POST' });
		},
		resumeSession() {
			return _fetch(SNW.CFG.API.sessionResume, { method: 'POST' });
		},
		stopSession() {
			return _fetch(SNW.CFG.API.sessionStop, { method: 'POST' });
		},
		getCurrentSession() {
			return _fetch(SNW.CFG.API.sessionCurrent);
		},
		setScheduleOverride(override) {
			return _fetch(SNW.CFG.API.sessionSchOverride, {
				method: 'POST',
				body: { override: !!override }
			});
		},

		// --- Motion ---
		getMotion() { return _fetch(SNW.CFG.API.motion); },
		patchMotion(b) { return _fetch(SNW.CFG.API.motion, { method: 'POST', body: b }); },
		feedPir(fired) { return _fetch(SNW.CFG.API.motionPirFeed, { method: 'POST', body: { pir: !!fired } }); },

		// --- System / Config ---
		getSystem() { return _fetch(SNW.CFG.API.system); },
		patchSystem(b) { return _fetch(SNW.CFG.API.system, { method: 'POST', body: b }); },
		saveConfig() { return _fetch(SNW.CFG.API.configSave, { method: 'POST' }); },
		getConfigDirty() { return _fetch(SNW.CFG.API.configDirty); },
		getConfigAll() { return _fetch(SNW.CFG.API.config); },
		// Zero-Reboot RAM 즉시 반영 구조이므로 단발 POST 유지 (Q-4 확정 안 A)
		reload() { return _fetch(SNW.CFG.API.reload, { method: 'POST' }); },
		factoryReset() { return _fetch(SNW.CFG.API.configInit, { method: 'POST' }); },

		// --- Wi-Fi ---
		getWifiState() { return _fetch(SNW.CFG.API.wifiState); },
		getWifiConfig() { return _fetch(SNW.CFG.API.wifiConfig); },
		patchWifi(b) { return _fetch(SNW.CFG.API.wifiConfig, { method: 'POST', body: b }); },
		scanWifi() { return _fetch(SNW.CFG.API.wifiScan, { timeoutMs: SNW.CFG.TIMEOUT_MS.SCAN }); },

		// --- Time ---
		setTime(b) { return _fetch(SNW.CFG.API.timeSet, { method: 'POST', body: b }); },

		// --- Logs ---
		getLogs() { return _fetch(SNW.CFG.API.logs); },

		// --- Firmware ---
		checkFw() { return _fetch(SNW.CFG.API.firmwareCheck); },
		uploadFirmware(file, onProgress) {
			const form = new FormData();
			form.append('firmware', file);
			return uploadWithProgress(SNW.CFG.API.fwUpdate, form, onProgress);
		},
		uploadFile(file, onProgress) {
			const form = new FormData();
			form.append('file', file);
			return uploadWithProgress(SNW.CFG.API.fileUpload, form, onProgress);
		},

		// --- AI ---
		async gemini(body) {
			const first = await _fetch(SNW.CFG.API.gemini, { method: 'POST', body, timeoutMs: SNW.CFG.TIMEOUT_MS.GEMINI });
			if (!first || first.status !== 'pending' || !first.jobId) return first;
			const deadline = Date.now() + SNW.CFG.TIMEOUT_MS.GEMINI;
			await new Promise(r => setTimeout(r, 700));
			while (Date.now() < deadline) {
				const res = await _fetch(`${SNW.CFG.API.gemini}?jobId=${encodeURIComponent(first.jobId)}`, {
					method: 'GET',
					timeoutMs: SNW.CFG.TIMEOUT_MS.DEFAULT
				});
				if (!res || res.status !== 'pending') return res;
				await new Promise(r => setTimeout(r, 350));
			}
			throw new ApiError(504, { error: 'ai_poll_timeout' });
		},
		executeAiAction(name, args) {
			return _fetch(SNW.CFG.API.aiExecute, { method: 'POST', body: { name, args } });
		},
		getAiLiveToken(todayDate) {
			const q = todayDate ? `?today=${encodeURIComponent(todayDate)}` : '';
			return _fetch(`${SNW.CFG.API.aiLiveToken}${q}`, { method: 'POST' });
		},
		callAiLiveFunction(body) {
			return _fetch(SNW.CFG.API.aiLiveFunc, { method: 'POST', body });
		},
		getAiLiveConfig() {
			return _fetch(SNW.CFG.API.aiLiveCfg);
		},
		getAiCostStatus(todayDate) {
			const q = todayDate ? `?today=${encodeURIComponent(todayDate)}` : '';
			return _fetch(`${SNW.CFG.API.aiCostStatus}${q}`);
		},
		reportAiUsage(body) {
			return _fetch(SNW.CFG.API.aiUsage, { method: 'POST', body });
		},
		resetAiCost(todayDate) {
			return _fetch(SNW.CFG.API.aiCostReset, { method: 'POST', body: { todayDate } });
		},

		// --- 유틸 ---
		setApiKey,
		getApiKey,
		ApiError
	});

})(window.SNW);
