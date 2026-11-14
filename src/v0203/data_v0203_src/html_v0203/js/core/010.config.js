// =========================================================
// 010.config.js — 프론트엔드 런타임 설정
// Layer 0 (기반) — SNW.C 참조만 허용
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
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
			UI_THEME: LS_PREFIX + 'theme',
			
			// [PATCH] AI 키를 여기로 통합 (최종 문자열은 기존과 동일)
			AI_MODE: LS_PREFIX + 'ai.mode', // 'snw.ai.mode'
			AI_LIVE_WARNED: LS_PREFIX + 'ai.liveWarned', // 'snw.ai.liveWarned'
			AI_HISTORY: LS_PREFIX + 'ai.history' // 'snw.ai.history'
				
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
			// Session (Stage 3 신규)
			sessionStart: '/api/v001/session/start',
			sessionPause: '/api/v001/session/pause',
			sessionResume: '/api/v001/session/resume',
			sessionStop: '/api/v001/session/stop',
			sessionCurrent: '/api/v001/session/current',
			sessionSchOverride: '/api/v001/session/schedule-override',
			overrideFixed: '/api/v001/control/override/fixed',
			overridePreset: '/api/v001/control/override/preset',
			overrideClear: '/api/v001/control/override/clear',
			overrideParams: '/api/v001/control/override',
			ack: '/api/v001/control/ack',
			controlMode: '/api/v001/control/mode',
			simulation: '/api/v001/simulation',
			simState: '/api/v001/sim/state',
			chartHistory: '/api/v001/sim/chart',
			monitor: '/api/v001/monitor',
			windProfile: '/api/v001/windProfile',
			windDict: '/api/v001/windDict', // [v0203 Stage 4]
			comfort: '/api/v001/comfort', // [v0203 Stage 6]
			comfortAuto: '/api/v001/comfort/auto', // [Stage 10 Phase 3]
			controlTimer: '/api/v001/control/timer', // [Stage 10.1 신규]
			monitorTimeline: '/api/v001/monitor/timeline', // [v0203 Stage 7]
			monitorSessionSummary: '/api/v001/monitor/session-summary', // [v0203 Stage 7]
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
			aiExecute: '/api/v001/ai/execute-action',
			aiLiveToken: '/api/v001/ai/live-token',
			aiLiveFunc: '/api/v001/ai/live-function',
			aiLiveCfg: '/api/v001/ai/live-config',
			aiCostStatus: '/api/v001/ai/cost-status',
			aiUsage: '/api/v001/ai/usage',
			aiCostReset: '/api/v001/ai/cost-reset',
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
		DEFAULT_LEVEL: 'L4',

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
		// AI Gemini Live & Cost 상수 (Stage 8)
		// =====================================================
		AI_LIVE: {
			WS_URL: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
			RECONNECT_MS: [1000, 2000, 4000, 8000],
			MAX_SESSION_MS: 14 * 60 * 1000,   // 14분 (15분 제약 대비 재연결)
			SESSION_WARN_MS: 60 * 1000,       // 60초 경고
			CONNECT_TIMEOUT_MS: 10000,
			DEFAULT_VOICE: 'Aoede'
		},
		AI_COST: {
			CAP_SEC: 30 * 60,  // 일일 30분 상한
			WARN_SEC: 25 * 60, // 25분 경고
			POLL_MS: 60000,
			REPORT_MS: 30000
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

