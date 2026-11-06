// =========================================================
// 010.config.js — 프론트엔드 런타임 설정
// Layer 0 (기반) — SNW.C 참조만 허용
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	const LS_PREFIX = 'snw.';
	
	SNW.CFG = {
		// =====================================================
		// localStorage 키 (중앙 관리)
		// =====================================================
		LS_PREFIX: LS_PREFIX,
		LS_KEY: {
			API_KEY: LS_PREFIX + 'apiKey',
			LEVEL: LS_PREFIX + 'level',
			LANG: LS_PREFIX + 'lang',
			DEBUG: LS_PREFIX + 'debug',
			LAST_PRESET: LS_PREFIX + 'lastPreset',
			UI_THEME: LS_PREFIX + 'theme'
		},
		
		// =====================================================
		// API 경로 (버전 prefix 중앙 관리)
		// =====================================================
		API_BASE: '/api/v001',
		API: {
			version: '/api/v001/version',
			state: '/api/v001/state',
			metrics: '/api/v001/metrics',
			controlSummary: '/api/v001/control/summary',
			overrideFixed: '/api/v001/control/override/fixed',
			overridePreset: '/api/v001/control/override/preset',
			overrideClear: '/api/v001/control/override/clear',
			ack: '/api/v001/control/ack',
			simulation: '/api/v001/simulation',
			simState: '/api/v001/sim/state',
			windProfile: '/api/v001/windProfile',
			schedules: '/api/v001/schedules',
			userProfiles: '/api/v001/user_profiles',
			userProfilesPatch: '/api/v001/user_profiles/patch',
			profileSelect: '/api/v001/control/profile/select',
			profileStop: '/api/v001/control/profile/stop',
			motion: '/api/v001/motion',
			motionPirFeed: '/api/v001/motion/pir/feed',
			system: '/api/v001/system',
			config: '/api/v001/config',
			configSave: '/api/v001/config/save',
			configDirty: '/api/v001/config/dirty',
			configInit: '/api/v001/config/init',
			reload: '/api/v001/reload',
			wifiState: '/api/v001/wifi/state',
			wifiConfig: '/api/v001/wifi/config',
			wifiScan: '/api/v001/wifi/scan',
			timeSet: '/api/v001/system/time/set',
			logs: '/api/v001/logs',
			diag: '/api/v001/diag',
			firmwareCheck: '/api/v001/system/firmware/check',
			fwUpdate: '/api/v001/fwUpdate',
			fileUpload: '/api/v001/fileUpload',
			gemini: '/api/v001/ai/gemini',
			menu: '/api/v001/menu'
		},
		
		// =====================================================
		// WS 경로
		// =====================================================
		WS_BASE_PATH: '/ws',
		WS_PATH: {
			state: '/ws/state',
			metrics: '/ws/metrics',
			chart: '/ws/chart',
			summary: '/ws/summary',
			log: '/ws/log'
		},
		
		// =====================================================
		// HTTP 타임아웃 (ms)
		// =====================================================
		TIMEOUT_MS: {
			DEFAULT: 8000,
			GEMINI: 20000,
			UPLOAD: 60000,
			SCAN: 15000
		},
		
		// =====================================================
		// WS 재연결 (exponential backoff)
		// =====================================================
		WS_RECONNECT: {
			BACKOFF_MS: [1000, 2000, 4000, 8000, 16000, 30000],
			FAIL_THRESHOLD: 3,
			FALLBACK_POLL_MS: 2000
		},
		
		// =====================================================
		// 시뮬레이션 기본값 (서버 미응답 시)
		// =====================================================
		SIM_DEFAULT: {
			intensity: 70,
			variability: 50,
			gustFreq: 45,
			fanLimit: 90,
			minFan: 10,
			fanPowerEnabled: true
		},
		
		// =====================================================
		// 사용자 레벨 기본값
		// =====================================================
		DEFAULT_LEVEL: 'L1',
		
		// =====================================================
		// UI 상수 (컴포넌트 공용)
		// =====================================================
		UI: {
			TOAST_DEFAULT_MS: 3000,
			TOAST_SUCCESS_MS: 2000,
			TOAST_ERROR_MS: 4000,
			PRESET_GRID_MIN_COL: 2,
			PRESET_GRID_MAX_COL: 5,
			MINI_CHART_POINTS: 120,
			MINI_CHART_SERIES: [
				{ key: 'windSpeed', color: '#4a9eff', labelKey: 'chart.wind' },
				{ key: 'targetWind', color: '#9aa5b1', labelKey: 'chart.target' },
				{ key: 'pwmDuty', color: '#f5a623', labelKey: 'chart.pwm' }
			],
			LOG_MAX_LINES: 256
		},
		
		// =====================================================
		// 개발 모드
		// =====================================================
		IS_DEV: (location.hostname === 'localhost' || location.hostname === '127.0.0.1'),
		
		// =====================================================
		// localStorage 오버라이드 헬퍼
		// =====================================================
		get(path) {
			const lsKey = LS_PREFIX + 'cfg.' + path;
			const lsVal = localStorage.getItem(lsKey);
			if (lsVal != null) {
				try { return JSON.parse(lsVal); } catch { return lsVal; }
			}
			const segs = path.split('.');
			let v = SNW.CFG;
			for (const s of segs) {
				if (v == null) return undefined;
				v = v[s];
			}
			return v;
		},
		setOverride(path, value) {
			localStorage.setItem(LS_PREFIX + 'cfg.' + path, JSON.stringify(value));
		},
		clearOverride(path) {
			localStorage.removeItem(LS_PREFIX + 'cfg.' + path);
		}
	};
	
})(window.SNW);

