
/* ---- 000.const.js (8614 bytes) ---- */
// =========================================================
// 000.const.js — 프론트엔드 상수 (변경 불변)
// Layer 0 (기반) — 어떤 모듈도 참조하지 않음
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    /* __AUTO_SYNC_CONST_START__ */
    // [주의] 아래 AUTO_CONST 블록은 pio_gzip_0203.py에 의해 C++ 헤더에서 자동 동기화됩니다.
    const AUTO_CONST = {
        FSM_STATE: {
            IDLE: 0,
            OVERRIDE: 1,
            PROFILE_RUN: 2,
            SCHEDULE_RUN: 3,
            AUTOOFF_STOPPED: 5,
            TIME_INVALID: 6,
            ENV_PAUSED: 7
        },
        FSM_REASON: {
            NONE: 0,
            OVERRIDE_ACTIVE: 1,
            PROFILE_MODE: 2,
            USER_PROFILE_ACTIVE: 3,
            SCHEDULE_ACTIVE: 4,
            NO_ACTIVE_SCHEDULE: 5,
            NO_SCHEDULES: 6,
            TIME_NOT_VALID: 7,
            MOTION_NO_PRESENCE: 8,
            AUTOOFF_TIMER: 9,
            AUTOOFF_TIME: 10,
            USER_STOP: 11,
            TEMP_LOW_STOP: 12,
            DI_LOW_STOP: 13
        },
        WIND_PHASE: { CALM: 'CALM', NORMAL: 'NORMAL', STRONG: 'STRONG' }
    };
    /* __AUTO_SYNC_CONST_END__ */

    SNW.C = {
        // =====================================================
        // 사용자 레벨 (L1~L4)
        // =====================================================
        LEVEL: {
            L1: 'L1', L2: 'L2', L3: 'L3', L4: 'L4',
            ORDER: ['L1', 'L2', 'L3', 'L4']
        },

        // =====================================================
        // CT10 7-State FSM (SPEC §2.2) - 자동 동기화 연동
        // =====================================================
        FSM_STATE: AUTO_CONST.FSM_STATE,
        FSM_STATE_META: {
            0: { code: 'IDLE',            icon: '⏸', color: 'gray',   labelKey: 'fsm.idle',           l1: true  },
            1: { code: 'OVERRIDE',        icon: '✋', color: 'blue',   labelKey: 'fsm.override',       l1: true  },
            2: { code: 'PROFILE_RUN',     icon: '👤', color: 'green',  labelKey: 'fsm.profileRun',     l1: false },
            3: { code: 'SCHEDULE_RUN',    icon: '📅', color: 'cyan',   labelKey: 'fsm.scheduleRun',    l1: false },
            4: { code: 'RESERVED_4',      icon: '⏸', color: 'gray',   labelKey: 'fsm.idle',           l1: false },
            5: { code: 'AUTOOFF_STOPPED', icon: '⏹', color: 'orange', labelKey: 'fsm.autoOffStopped', l1: true  },
            6: { code: 'TIME_INVALID',    icon: '🕐', color: 'red',    labelKey: 'fsm.timeInvalid',    l1: false },
            7: { code: 'ENV_PAUSED',      icon: '⏸', color: 'orange', labelKey: 'fsm.envPaused',      l1: true  }
        },

        // =====================================================
        // CT10 Reason Code (SPEC §2.2) - 자동 동기화 연동
        // =====================================================
        FSM_REASON: AUTO_CONST.FSM_REASON,
        FSM_REASON_META: {
            0:  { code: 'NONE',                labelKey: 'reason.none'             },
            1:  { code: 'OVERRIDE_ACTIVE',     labelKey: 'reason.overrideActive'   },
            2:  { code: 'PROFILE_MODE',        labelKey: 'reason.profileMode'      },
            3:  { code: 'USER_PROFILE_ACTIVE', labelKey: 'reason.userProfileActive'},
            4:  { code: 'SCHEDULE_ACTIVE',     labelKey: 'reason.scheduleActive'   },
            5:  { code: 'NO_ACTIVE_SCHEDULE',  labelKey: 'reason.noActiveSchedule' },
            6:  { code: 'NO_SCHEDULES',        labelKey: 'reason.noSchedules'      },
            7:  { code: 'TIME_NOT_VALID',      labelKey: 'reason.timeNotValid'     },
            8:  { code: 'MOTION_NO_PRESENCE',  labelKey: 'reason.motionNoPresence' },
            9:  { code: 'AUTOOFF_TIMER',       labelKey: 'reason.autoOffTimer'     },
            10: { code: 'AUTOOFF_TIME',        labelKey: 'reason.autoOffTime'      },
            11: { code: 'AUTOOFF_TEMP',        labelKey: 'reason.autoOffTemp'      }
        },

        // =====================================================
        // S10 Wind Phase - 자동 동기화 연동
        // =====================================================
        WIND_PHASE: AUTO_CONST.WIND_PHASE,
        WIND_PHASE_META: {
            CALM:   { icon: '🍃', color: 'gray',   labelKey: 'phase.calm'   },
            NORMAL: { icon: '🟢', color: 'green',  labelKey: 'phase.normal' },
            STRONG: { icon: '🌪', color: 'orange', labelKey: 'phase.strong' }
        },

        // =====================================================
        // Preset 코드 (10종, SPEC §7 매뉴얼)
        // =====================================================
        PRESET_CODE: {
            OCEAN: 'OCEAN', COUNTRY_BREEZE: 'COUNTRY_BREEZE',
            MEDITERRANEAN: 'MEDITERRANEAN', MOUNTAIN: 'MOUNTAIN',
            PLAINS: 'PLAINS', HARBOR_BREEZE: 'HARBOR_BREEZE',
            FOREST_CANOPY: 'FOREST_CANOPY', URBAN_SUNSET: 'URBAN_SUNSET',
            TROPICAL_RAIN: 'TROPICAL_RAIN', DESERT_NIGHT: 'DESERT_NIGHT'
        },

        // =====================================================
        // Style 코드 (5종, SPEC §7)
        // =====================================================
        STYLE_CODE: {
            BALANCE: 'BALANCE', ACTIVE: 'ACTIVE', FOCUS: 'FOCUS',
            RELAX: 'RELAX', SLEEP: 'SLEEP'
        },

        // =====================================================
        // Segment Mode
        // =====================================================
        SEG_MODE: { PRESET: 'PRESET', FIXED: 'FIXED' },

        // =====================================================
        // Wi-Fi 모드
        // =====================================================
        WIFI_MODE: { AP: 0, STA: 1, AP_STA: 2 },
        WIFI_MODE_LABEL: { 0: 'AP', 1: 'STA', 2: 'AP+STA' },

        // =====================================================
        // 로그 레벨 (D10_Logger 매핑)
        // =====================================================
        LOG_LEVEL: { NONE: 0, ERROR: 1, WARN: 2, INFO: 3, DEBUG: 4 },
        LOG_LEVEL_META: {
            0: { code: 'NONE',  color: 'gray',   labelKey: 'log.none'  },
            1: { code: 'ERROR', color: 'red',    labelKey: 'log.error' },
            2: { code: 'WARN',  color: 'yellow', labelKey: 'log.warn'  },
            3: { code: 'INFO',  color: 'green',  labelKey: 'log.info'  },
            4: { code: 'DEBUG', color: 'cyan',   labelKey: 'log.debug' }
        },

        // =====================================================
        // WS 채널 (5종, SPEC §5)
        // =====================================================
        WS_CHANNEL: ['state', 'metrics', 'chart', 'summary', 'log'],

        // =====================================================
        // HTTP 상태 코드
        // =====================================================
        HTTP: {
            OK: 200, CREATED: 201, ACCEPTED: 202, NO_CONTENT: 204,
            BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
            NOT_FOUND: 404, CONFLICT: 409, TOO_LARGE: 413,
            TIMEOUT: 408, SERVER_ERROR: 500, BAD_GATEWAY: 502,
            UNAVAILABLE: 503, GATEWAY_TIMEOUT: 504
        },

        // =====================================================
        // Reload 폴링 상수
        // =====================================================
        RELOAD: {
            POLL_INTERVAL_MS: 300,
            POLL_TIMEOUT_MS:  5000
        },

        // =====================================================
        // 디바운스 기본
        // =====================================================
        DEBOUNCE_MS: {
            SLIDER: 300,
            SEARCH: 250,
            RESIZE: 150
        },

        // =====================================================
        // 프리셋 그리드 순서 (매뉴얼 §7 정합)
        // =====================================================
        PRESET_DISPLAY_ORDER: [
            'COUNTRY_BREEZE', 'MEDITERRANEAN', 'OCEAN', 'MOUNTAIN', 'PLAINS',
            'HARBOR_BREEZE', 'FOREST_CANOPY', 'URBAN_SUNSET', 'TROPICAL_RAIN', 'DESERT_NIGHT'
        ],

        // =====================================================
        // AutoOff reason 라벨 매핑
        // =====================================================
        AUTOOFF_REASON_MAP: {
            9:  'autoOff.timer',
            10: 'autoOff.time',
            11: 'autoOff.temp'
        }
    };

})(window.SNW);


/* ---- 010.config.js (7306 bytes) ---- */
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
			sessionRule: '/api/v001/session/rule',
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



/* ---- 020.i18n.js (82314 bytes) ---- */
// =========================================================
// 020.i18n.js — 다국어 완전판 (ko/en)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    const DICT = {
        ko: {
            'rule.title': '규칙 편집',
            'rule.validate.hysteresisTemp': 'PAUSE 모드에서는 온도 히스테리시스(≥0.5°C)가 필요합니다',
            'rule.validate.hysteresisDi': 'PAUSE 모드에서는 DI 히스테리시스(≥3.0)가 필요합니다',
            // =====================================================
            // 공통
            // =====================================================
            'app.title': 'Smart Nature Wind',
            'common.ok': '확인',
            'common.cancel': '취소',
            'common.close': '닫기',
            'common.save': '저장',
            'common.delete': '삭제',
            'common.edit': '편집',
            'common.loading': '로딩 중...',
            'common.noData': '데이터 없음',
            'common.error': '오류',
            'common.success': '완료',
            'common.undo': '실행 취소',
            'common.apply': '적용',

            // =====================================================
            // 온보딩
            // =====================================================
            'onboarding.step2': 'Wi-Fi 안내',
            'onboarding.step3': '첫 바람 선택',
            'onboarding.step4': '시작',
            'onboarding.wifiTitle': 'Wi-Fi 연결 확인',
            'onboarding.wifiDesc': '기기 기본 Wi-Fi에 연결되어 있습니다. 아래 정보로 접속할 수 있습니다.',
            'onboarding.connected': '연결 확인',
            'onboarding.firstBreezeTitle': '첫 바람을 선택하세요',
            'onboarding.firstBreezeDesc': '세 가지 자연풍 중 하나를 골라 시작해 보세요.',
            'onboarding.breeze.ocean': '바다 바람',
            'onboarding.breeze.oceanDesc': '파도처럼 밀려오는 시원함',
            'onboarding.breeze.forest': '숲속 바람',
            'onboarding.breeze.forestDesc': '잔잔하고 부드러운 숲의 쉼표',
            'onboarding.breeze.mountain': '산바람',
            'onboarding.breeze.mountainDesc': '상쾌한 계곡의 역동적 바람',
            'onboarding.startNowTitle': '지금 시작할까요?',
            'onboarding.startNowDesc': '"{name}"을(를) 바로 재생합니다.',
            'onboarding.startNow': '지금 시작',
            'onboarding.later': '나중에',

            // =====================================================
            // Session
            // =====================================================
            'session.playlist': '플레이리스트',
            'session.preset': '프리셋',
            'session.fixed': '일반 선풍기',
            'session.manual': '수동 재생',
            'session.schedule': '자동 실행',
            'session.paused': '일시정지',
            'session.playing': '재생 중',
            'session.none': '세션 없음',

            // =====================================================
            // Now Playing
            // =====================================================
            'np.pause': '일시정지',
            'np.resume': '재개',
            'np.stop': '정지',
            'np.step': 'Step {n}/{total}',
            'np.schedulePending': '스케줄 대기',
            'np.scheduleConflict': '스케줄 충돌 안내',

            // =====================================================
            // 홈 (Dashboard)
            // =====================================================
            'home.title': '홈',
            'home.nowPlaying': '지금 재생 중',
            'home.playlist': '🎵 재생할 플레이리스트',
            'home.noPlaylist': '작곡한 프로필이 없습니다',
            'home.goStudio': '🎨 Studio에서 작곡하기',
            'home.normalFan': '🌀 일반 선풍기',
            'home.context': '오늘의 추천',
            'home.recommend': '이 날씨엔 "{name}"이 시원해요',
            'home.playRecommend': '▶ 지금 재생',
            'home.fanStop': '끔',
            'home.fanStage': '{n}단',

            // =====================================================
            // Studio
            // =====================================================
            'studio.title': 'Wind Design Studio',
            'studio.new': '새 프로필 작곡',
            'studio.edit': '프로필 편집',
            'studio.name': '프로필 이름',
            'studio.repeat': '반복',
            'studio.repeatCount': '회 (0=무한)',
            'studio.steps': 'Step 시퀀스',
            'studio.addStep': '+ Step 추가',
            'studio.stepTitle': 'Step {n}',
            'studio.type': '타입',
            'studio.typePreset': '프리셋 재생',
            'studio.typeFixed': '고정 풍속',
            'studio.typeRest': '휴지 (정지)',
            'studio.duration': '지속',
            'studio.minutes': '분',
            'studio.preset': '프리셋',
            'studio.style': '스타일',
            'studio.fixedSpeed': '고정 풍속',
            'studio.override': '⚙ 물리 세부 조정 (Override)',
            'studio.intensity': '강도',
            'studio.variability': '변동성',
            'studio.gust': '돌풍',
            'studio.preview': '🎬 예상 파형',
            'studio.previewAll': '🎬 전체 시나리오 체험',
            'studio.moveUp': '위로',
            'studio.moveDown': '아래로',
            'studio.deleteStep': '삭제',
            'studio.save': '저장',
            'studio.update': '업데이트',
            'studio.cancel': '취소',
            'studio.confirmCancel': '편집 내용을 버리시겠습니까?',

            // =====================================================
            // Playlist
            // =====================================================
            'playlist.title': 'Wind Playlist',
            'playlist.count': '{n}개 프로필',
            'playlist.new': '+ 새로 작곡',
            'playlist.steps': '{n} Step',
            'playlist.refs': '⏰ 스케줄 {n}개에서 사용 중',
            'playlist.noRefs': '스케줄 미참조',
            'playlist.play': '▶ 재생',
            'playlist.edit': '✏️ 편집',
            'playlist.delete': '🗑',
            'playlist.confirmDelete': '삭제하시겠습니까?',
            'playlist.confirmDeleteWithRefs': '이 프로필은 스케줄 {n}개에서 참조 중입니다.\n삭제하면 해당 스케줄이 비활성화됩니다. 계속?',

            // =====================================================
            // Schedule
            // =====================================================
            'schedule.title': '스케줄',
            'schedule.count': '{n}개 스케줄',
            'schedule.new': '+ 새 스케줄',
            'schedule.name': '스케줄 이름',
            'schedule.days': '요일',
            'schedule.start': '시작',
            'schedule.end': '종료',
            'schedule.profile': '🎵 실행할 플레이리스트',
            'schedule.profileHint': '💡 새 프로필은 Studio 탭에서 작곡 후 선택할 수 있습니다.',
            'schedule.noProfile': '먼저 프로필을 작곡해야 스케줄을 만들 수 있습니다.',
            'schedule.goStudio': '🎨 Studio에서 작곡하기',
            'schedule.note': '💡 스케줄은 플레이리스트를 자동 재생합니다.\nStep 편집은 Studio 탭에서 하세요.',
            'schedule.missingProfile': '(삭제된 프로필)',
            'schedule.confirmDelete': '"{name}" 스케줄을 삭제하시겠습니까?',
            'schedule.conflict': '⏰ 스케줄 충돌 안내',
            'schedule.manualActive': '현재 수동 재생 중입니다.',
            'schedule.nextSchedule': '다음 스케줄',
            'schedule.in': '({n}분 후)',
            'schedule.now': '(지금 활성)',
            'schedule.conflictDesc': '수동 재생을 종료하지 않으면 스케줄이 실행되지 않습니다. 어떻게 하시겠어요?',
            'schedule.stopManual': '⏹ 수동 정지',
            'schedule.keepManual': '계속 수동 유지',
            'schedule.stopped': '수동 재생 종료 · 다음 스케줄 대기',

            'days.mon': '월', 'days.tue': '화', 'days.wed': '수', 'days.thu': '목',
            'days.fri': '금', 'days.sat': '토', 'days.sun': '일',

            // =====================================================
            // Simulation
            // =====================================================
            'sim.title': '🎬 바람 스튜디오',
            'sim.singleTab': '🎬 단일 미리보기',
            'sim.abTab': '⚖ A/B 비교',
            'sim.feelings': '감성 피드백',
            'sim.applyA': '✓ 이 설정 적용',
            'sim.applyB': 'B로 적용',
            'sim.feel.coolness': '시원함',
            'sim.feel.freshness': '청량감',
            'sim.feel.dynamism': '역동성',
            'sim.feel.smoothness': '부드러움',
            'sim.feel.calmness': '차분함',
            'sim.avg': '평균',
            'sim.intensity': '강도',
            'sim.variability': '변동성',
            'sim.gust': '돌풍',

            // =====================================================
            // Monitor
            // =====================================================
            'monitor.title': '모니터',
            'monitor.liveTab': '📊 실시간',
            'monitor.retroTab': '🎬 히스토리',
            'monitor.liveWind': '📊 실시간 풍속',
            'monitor.sensors': '🌡️ 센서',
            'monitor.retroTitle': '🎬 세션 히스토리',
            'monitor.range1h': '최근 1시간',
            'monitor.range24h': '최근 24시간',
            'monitor.range7d': '최근 7일',
            'monitor.refresh': '🔄',
            'monitor.sessionSummary': '세션 요약',
            'monitor.totalSessions': '총 세션',
            'monitor.totalActive': '총 가동',
            'monitor.avgWind': '평균 풍속',
            'monitor.maxWind': '최고 풍속',
            'monitor.avgTemp': '평균 온도',
            'monitor.presenceRatio': '재실 비율',
            'monitor.timelineTitle': '이벤트 타임라인',
            'monitor.eventList': '이벤트 목록 (최근 30개)',
            'monitor.temp': '온도',
            'monitor.humidity': '습도',
            'monitor.motion': '재실',
            'monitor.detected': '감지',
            'monitor.absent': '부재',

            // =====================================================
            // Context
            // =====================================================
            'context.comfort': '쾌적',
            'context.slight': '약간 덥네요',
            'context.uncomfort': '끈적이는 날씨',
            'context.severe': '숨이 막혀요',

            // =====================================================
            // Settings
            // =====================================================
            'settings.title': '⚙️ 설정',
            'settings.tabGeneral': '일반',
            'settings.tabNetwork': '네트워크',
            'settings.tabHardware': '하드웨어',
            'settings.tabAdvanced': '고급',
            'settings.lang': '언어',
            'settings.version': '버전 정보',
            'settings.manual': '사용자 매뉴얼',
            'settings.logs': '시스템 로그',
            'settings.diag': '진단',
            'settings.firmware': '펌웨어 업데이트',
            'settings.factoryReset': '공장 초기화',
            'settings.advanced': '⚠️ 고급 설정',

            // =====================================================
            // [N-5] Factory Reset 확인어 및 관련 문구
            // =====================================================
            'settings.factoryResetTitle': '공장 초기화',
            'settings.factoryResetItems': '다음 항목이 삭제됩니다:',
            'settings.factoryResetConfirmWord': '계속하려면 아래에 "초기화"를 입력하세요',
            'settings.factoryResetWord': '초기화',
            'settings.factoryResetSuccess': '공장 초기화 완료. 기기가 재부팅됩니다.',
            'settings.deleteApiKey': 'API Key 삭제',
            'settings.deleteGeminiKey': 'Gemini Key 삭제',

            // =====================================================
            // Header / Nav
            // =====================================================
            'nav.home': '홈',
            'nav.wind': '바람',
            'nav.automation': '자동화',
            'nav.monitor': '모니터',
            'nav.settings': '설정',
            'header.menu': '메뉴',
            'header.language': '언어',
            'header.online': '온라인',
            'header.offline': '오프라인',
            'header.connecting': '연결 중',

            // =====================================================
            // 메시지
            // =====================================================
            'msg.saveSuccess': '저장 완료',
            'msg.deleteSuccess': '삭제 완료',
            'msg.updateSuccess': '업데이트 완료',
            'msg.playSuccess': '재생 시작',
            'msg.loadFailed': '로드 실패',
            'msg.saveFailed': '저장 실패',
            'msg.networkError': '네트워크 오류',
            'msg.stepMin': '최소 1개 Step이 필요합니다',
            'msg.stepMax': 'Step은 최대 8개까지 추가 가능합니다',
            'msg.nameRequired': '프로필 이름을 입력하세요',
            'msg.durationRange': 'Step 지속 시간은 1~1440분이어야 합니다',
            'msg.selectProfile': '실행할 플레이리스트를 선택하세요',
            'msg.timeOrder': '종료 시각이 시작 시각보다 빨라야 합니다',

            // =====================================================
            // [Phase5 5.6] 네비게이션 완전판
            // =====================================================
            'nav.dashboard': '대시보드',
            'nav.chart': '차트',
            'nav.schedule': '스케줄',
            'nav.profiles': '프로필',
            'nav.sensors': '센서',
            'nav.monitor': '모니터',
            'nav.simulation': '시뮬레이션',
            'nav.windprofile': '바람 프리셋',
            'nav.network': '네트워크',
            'nav.logs': '시스템 로그',
            'nav.diagnostics': '진단',
            'nav.firmware': '펌웨어',
            'nav.ai': 'AI 어시스턴트',
            'nav.info': '정보',
            'nav.groupControl': '제어',
            'nav.groupSettings': '설정',
            'nav.groupSystem': '시스템',

            // =====================================================
            // [Phase5 5.6] 공통
            // =====================================================
            'common.start': '시작',
            'common.stop': '정지',
            'common.add': '추가',
            'common.warning': '경고',

            // =====================================================
            // [Phase5 5.6] Footer / 상태
            // =====================================================
            'footer.online': '🟢 온라인',
            'footer.offline': '🔴 오프라인',
            'footer.polling': '🟡 폴링',

            // =====================================================
            // [Phase5 5.6] Dashboard
            // =====================================================
            'dashboard.modeTitle': '작동 모드 설정',
            'dashboard.modeSchedule': '◻ 스케줄 자동 모드',
            'dashboard.modeProfile': '◼ 프로필 수동 모드',
            'dashboard.realtimeState': '실시간 상태',
            'dashboard.currentWind': '현재 풍속',
            'dashboard.targetWind': '목표 풍속',
            'dashboard.phase': 'Phase',
            'dashboard.pwm': 'PWM',
            'dashboard.sch': '스케줄',
            'dashboard.prof': '프로필',
            'dashboard.powerTitle': '전원 제어',
            'dashboard.sensorTitle': '센서',
            'dashboard.styleTitle': '바람 스타일',
            'dashboard.presetTitle': '자연풍 프리셋',
            'dashboard.physicsTitle': '바람 세부 조절 (3대 물리 제어)',
            'dashboard.powerOn': '전원 켜기',
            'dashboard.powerOff': '전원 끄기',
            'dashboard.temp': '온도',
            'dashboard.humidity': '습도',
            'dashboard.motion': '인체감지',
            'dashboard.motionDetected': '감지됨',
            'dashboard.motionAbsent': '부재',
            'dashboard.modeSwitchedProfile': '프로필 모드로 전환되었습니다',
            'dashboard.fanStop': '끔',
            'dashboard.fanStage': '{n}단',

            // =====================================================
            // [Phase5 5.6] Chart
            // =====================================================
            'chart.title': '실시간 물리 차트',
            'chart.tab.live': '실제 작동 중',
            'chart.tab.preview': '예상 파형',
            'chart.range5s': '5초',
            'chart.range30s': '30초',
            'chart.range120s': '120초',
            'chart.overlay': '예상 오버레이',
            'chart.exportCsv': 'CSV 내보내기',
            'chart.wind': '풍속',
            'chart.target': '목표',
            'chart.pwm': 'PWM',

            // =====================================================
            // [Phase5 5.6] Settings (필드 라벨 대량)
            // =====================================================
            'settings.secMeta': '메타 정보',
            'settings.secFanPwm': '팬 PWM 설정',
            'settings.secFanCurve': '팬 커브 (3구간)',
            'settings.secPir': 'PIR 설정',
            'settings.secDht': '온습도 센서',
            'settings.secLed': 'NeoPixel LED',
            'settings.tabComm': '통신 / WS',

            'settings.fieldDeviceName': '기기 이름',
            'settings.fieldLogLevel': '로그 레벨',
            'settings.fieldLogMax': '로그 최대 개수',
            'settings.fieldRange': '범위: {min}~{max}',
            'settings.fieldRecommended': '권장: {range}',
            'settings.fieldPinPwm': 'PWM 핀',
            'settings.fieldChannel': 'LEDC 채널',
            'settings.fieldFreq': '주파수 (Hz)',
            'settings.fieldRes': '분해능 (bit)',
            'settings.fieldStart': '시동 최소 (%)',
            'settings.fieldComfortMin': '편안 시작 (%)',
            'settings.fieldComfortMax': '편안 끝 (%)',
            'settings.fieldHardMax': '최대 상한 (%)',
            'settings.fieldEnabled': '활성화',
            'settings.fieldPinPir': 'PIR 핀',
            'settings.fieldDebounce': '디바운스 (초)',
            'settings.fieldHold': '유지 시간 (초)',
            'settings.fieldPinDht': 'DHT 핀',
            'settings.fieldType': '센서 타입',
            'settings.fieldInterval': '읽기 주기 (초)',
            'settings.fieldPinLed': 'LED 핀',
            'settings.fieldNumPixels': '픽셀 개수',
            'settings.fieldBrightness': '기본 밝기',

            'settings.configured': '설정됨',
            'settings.notConfigured': '미설정',
            'settings.keyPlaceholderChange': '변경하려면 새 키 입력 (비우면 유지)',
            'settings.keyPlaceholderInput': 'API Key 입력',
            'settings.testApiKey': 'API Key 테스트',
            'settings.testApiSuccess': '✓ 인증 성공',
            'settings.testApiFail': '✗ 인증 실패: {msg}',

            'settings.wsChannelConfig': 'WebSocket 채널 설정',
            'settings.saveAndReload': '저장 후 재적용',
            'settings.save': '저장',
            'settings.reload': '재적용',

            'settings.dirtyWarning': '저장되지 않은 변경 사항이 있습니다.\n재적용하면 저장되지 않은 변경 사항이 소실됩니다. 계속하시겠습니까?',
            'settings.offlineReloadNotice': '오프라인 모드에서는 재적용이 지원되지 않습니다.',
            'settings.reloadRequested': '재적용 요청됨 ({status})',
            'settings.reloadInProgress': '재적용 진행 중...',
            'settings.reloadFailed': '재적용 실패',
            'settings.reloadComplete': '재적용 완료',
            'settings.saveAndReloadSuccess': '저장 후 재적용되었습니다',

            // =====================================================
            // [Phase5 5.6] Sensors
            // =====================================================
            'sensors.title': '실시간 센서 상태',
            'sensors.temp': '온도',
            'sensors.hum': '습도',
            'sensors.motion': '인체감지',
            'sensors.feedPir': 'PIR 강제 감지 테스트',
            'sensors.feedPirSuccess': '감지 신호 전송됨',
            'sensors.motionConfig': '모션 로직 설정',
            'sensors.pirEnabled': 'PIR 활성화',
            'sensors.pirHoldSec': 'PIR 유지 시간 (초)',
            'sensors.saveMotionSuccess': '모션 설정 저장 완료',

            // =====================================================
            // [Phase5 5.6] Diagnostics
            // =====================================================
            'diagnostics.allJson': '전체 설정 JSON',
            'diagnostics.saveDirty': 'Dirty 설정 저장',
            'diagnostics.saveDirtySuccess': 'Dirty 설정 저장 완료',
            'diagnostics.fetchFail': '설정 조회 실패',
            'diagnostics.metricsRealtime': '실시간 메트릭',

            // =====================================================
            // [Phase5 5.6] Log / AI / Firmware
            // =====================================================
            'log.filterAll': '전체 레벨',
            'log.clear': '지우기',
            'log.export': 'JSON 내보내기',
            'log.none': '없음',
            'log.error': '에러',
            'log.warn': '경고',
            'log.info': '정보',
            'log.debug': '디버그',

            'ai.title': 'AI 어시스턴트',
            'ai.placeholder': '바람에 대해 궁금한 것을 물어보세요...',
            'ai.example1': '오늘 날씨에 어울리는 바람은?',
            'ai.example2': '수면에 좋은 설정 추천해줘',
            'ai.example3': '자연풍 프리셋의 차이를 알려줘',
            'ai.send': '전송',
            'ai.thinking': '생각 중...',
            'ai.voiceListening': '듣고 있어요...',
            'ai.voiceNotSupported': '음성 인식을 지원하지 않는 브라우저입니다.',
            'ai.micError': '마이크 권한을 허용해주세요.',
            'ai.modeRest': '자연어 제어 (REST)',
            'ai.modeLive': '실시간 음성 (Live)',
            'ai.actionDone': '명령 실행 완료',
            'ai.clearHistory': '대화 초기화',
            'ai.dailyCapReached': '일일 Live 음성 한도(30분)에 도달했습니다.',
            'ai.liveCost': '오늘 Live: {min}분 / {cap}분 (${cost})',
            'ai.liveConnecting': 'Live 연결 중...',
            'ai.liveConnected': '실시간 대화 중 (말씀하세요)',
            'ai.liveSpeaking': 'AI 응답 중...',
            'ai.liveStart': '🎙️ Live 대화 시작',
            'ai.liveStop': '⏹️ 통화 종료',
            'ai.liveCapWarning': '⚠️ 일일 한도 접근 중 ({min}분 사용)',

            'firmware.otaUpdate': '펌웨어 업데이트 (OTA)',
            'firmware.uploadBtn': '업로드',
            'firmware.otaSuccess': '펌웨어 업로드 완료',
            'firmware.fileUpload': '일반 파일 업로드',

            // =====================================================
            // [Phase5 5.6] Segment (Studio/Profile/Schedule 공통)
            // =====================================================
            'segment.onMinutes': '작동 시간(분)',
            'segment.offMinutes': '정지 시간(분)',
            'segment.mode': '모드',
            'segment.modePreset': '프리셋 모드',
            'segment.modeFixed': '고정풍속 모드',
            'segment.presetSelect': '프리셋 선택',
            'segment.styleSelect': '스타일 선택',
            'segment.fixedSpeed': '고정 풍속(%)',
            'segment.overrideTitle': '⚙️ 고급 물리 설정 (Override 직접 지정)',
            'segment.overrideDesc': '이 세그먼트에서 바람 세부 설정 직접 지정',
            'segment.overrideIntensity': '바람 강도 (%)',
            'segment.overrideVariability': '바람 변동성 (%)',
            'segment.overrideGust': '돌풍 빈도 (%)',
            'segment.moveUp': '위로',
            'segment.moveDown': '아래로',
            'segment.deleted': '세그먼트가 삭제되었습니다',
            'segment.summaryPrefix': '세그먼트',

            // =====================================================
            // [Phase5 5.6] Schedule 추가
            // =====================================================
            'schedule.secBasic': '기본 정보',
            'schedule.secSegments': '세그먼트',
            'schedule.secSmart': '스마트 종료',
            'schedule.add': '스케줄 추가',
            'schedule.addSegmentBtn': '세그먼트 추가',
            'schedule.segment': '세그먼트',
            'schedule.segmentRepeat': '세그먼트 반복',
            'schedule.repeatCount': '반복 횟수',
            'schedule.startTime': '시작 시각',
            'schedule.endTime': '종료 시각',
            'scheduler.title': '스케줄 예약',
            'scheduler.day': '요일',
            'scheduler.segment': '세그먼트',
            'scheduler.scheduledOff': '예약 종료',
            'scheduler.tempOff': '온도 도달 종료',

            // =====================================================
            // [Phase5 5.6] Profiles 추가
            // =====================================================
            'profiles.add': '프로필 추가',
            'profiles.no': '프로필 번호',
            'profiles.enabled': '활성화',
            'profiles.name': '프로필 이름',
            'profiles.addSegmentBtn': '세그먼트 추가',
            'profiles.autoOffTimer': '자동 종료 (분)',
            'profile.title': '사용자 프로필',
            'profile.active': '활성',

            // =====================================================
            // [Phase5 5.6] Network
            // =====================================================
            'network.title': '네트워크 상태',
            'network.wifiConfig': 'Wi-Fi 설정',
            'network.timeConfig': '시간 설정',
            'network.wifiMode': 'Wi-Fi 모드',
            'network.apSettings': 'AP 설정',
            'network.staSettings': 'STA 네트워크 목록',
            'network.status': '연결 상태',
            'network.ip': 'IP 주소',
            'network.mac': 'MAC 주소',
            'network.timeSynced': '시간 동기화',
            'network.synced': '완료',
            'network.notSynced': '미완료',
            'network.scanWifi': 'Wi-Fi 스캔',
            'network.connect': '연결',
            'network.saveWifi': 'Wi-Fi 설정 저장',
            'network.saveTime': '시간 설정 저장',
            'network.noStaNotice': '등록된 STA 네트워크가 없습니다',

            // =====================================================
            // [Phase5 5.6] Windprofile
            // =====================================================
            'windprofile.title': '바람 프리셋 관리',
            'windprofile.add': '프리셋 추가',
            'windprofile.code': '코드 (영문)',
            'windprofile.intensity': '강도',
            'windprofile.variability': '변동성',
            'windprofile.gust': '돌풍',
            'windprofile.fanLimit': '팬 한계',
            'windprofile.factorsTitle': '기본 바람 파라미터',

            // =====================================================
            // [Phase5 5.6] PIR
            // =====================================================
            'pir.testSuccess': '✓ PIR 감지 성공',
            'pir.testFail': '✗ PIR 감지 실패 (센서 확인 필요)',

            // =====================================================
            // [Phase5 5.6] 단위
            // =====================================================
            'unit.celsius': '°C',
            'unit.humidity': '%',
            'unit.seconds': '초',
            'unit.windSpeed': 'm/s',

            // =====================================================
            // [Phase5 5.6] 검증 메시지
            // =====================================================
            'validate.required': '{field}을(를) 입력하세요',
            'validate.range': '{field}: {min}~{max} 범위여야 합니다',
            'validate.timeOrder': '종료 시각이 시작 시각보다 빨라야 합니다',
            'validate.multiErrors': '{count}개 항목에 오류가 있습니다',
            'validate.segmentMin': '최소 1개의 세그먼트가 필요합니다',

            // =====================================================
            // [Phase5 5.6] 추가 메시지
            // =====================================================
            'msg.unknown': '알 수 없는 오류',
            'msg.accessDenied': '접근 권한이 없습니다',
            'msg.deleteConfirm': '정말 삭제하시겠습니까?',
            'msg.saveAndReloadSuccess': '저장 후 재적용되었습니다',

            // =====================================================
            // [Phase5 5.6] FSM 상태 배지
            // =====================================================
            'fsm.idle': '대기',
            'fsm.override': '수동 제어',
            'fsm.profileRun': '프로필 실행',
            'fsm.scheduleRun': '스케줄 실행',
            'fsm.motionBlocked': '모션 차단',
            'fsm.autoOffStopped': '자동 종료',
            'fsm.timeInvalid': '시간 미동기',

            // =====================================================
            // [Phase5 5.6] FSM Reason
            // =====================================================
            'reason.none': '없음',
            'reason.overrideActive': '수동 개입 중',
            'reason.profileMode': '프로필 모드',
            'reason.userProfileActive': '사용자 프로필 실행 중',
            'reason.scheduleActive': '스케줄 활성',
            'reason.noActiveSchedule': '활성 스케줄 없음',
            'reason.noSchedules': '스케줄 없음',
            'reason.timeNotValid': '시간 미동기',
            'reason.motionNoPresence': '재실 감지 안됨',
            'reason.autoOffTimer': '자동 종료 타이머',
            'reason.autoOffTime': '자동 종료 시각',
            'reason.autoOffTemp': '자동 종료 온도',

            // =====================================================
            // [Phase5 5.6] Wind Phase
            // =====================================================
            'phase.calm': '잔잔',
            'phase.normal': '보통',
            'phase.strong': '강풍',

            // =====================================================
            // [Phase5 5.6] AutoOff
            // =====================================================
            'autoOff.timer': '타이머 종료',
            'autoOff.time': '예약 종료',
            'autoOff.temp': '온도 종료',

            // =====================================================
            // [Phase5 5.6] 프리셋 이름 (10종)
            // =====================================================
            'preset.OCEAN': '바다 바람',
            'preset.COUNTRY_BREEZE': '시골 바람',
            'preset.MEDITERRANEAN': '지중해 바람',
            'preset.MOUNTAIN': '산바람',
            'preset.PLAINS': '들판 바람',
            'preset.HARBOR_BREEZE': '항구 바람',
            'preset.FOREST_CANOPY': '숲속 바람',
            'preset.URBAN_SUNSET': '도시 노을',
            'preset.TROPICAL_RAIN': '열대 비',
            'preset.DESERT_NIGHT': '사막 밤',

            // =====================================================
            // [Phase5 5.6] 스타일 이름 (5종)
            // =====================================================
            'style.BALANCE': '균형',
            'style.ACTIVE': '활동',
            'style.FOCUS': '집중',
            'style.RELAX': '휴식',
            'style.SLEEP': '수면',
            'msg.success': '성공적으로 처리되었습니다',
            'reconnect.body': '기기와의 연결이 끊어졌습니다. 다시 연결을 시도합니다...',
            'msg.apiKeyRequired': 'API 키가 필요합니다',
            'msg.reloadPending': '재적용 대기 중...',
            'msg.timeout': '요청 시간이 초과되었습니다',

            // =====================================================
            // Automation Timer Panel
            // =====================================================
            'timer.title': '⏱️ 세션 타이머',
            'timer.subtitle': '지금 재생 중인 세션을 얼마 후 종료할까요?',
            'timer.noSession': '현재 재생 중인 세션이 없습니다.',
            'timer.noSessionTip': '바람을 먼저 재생하면 타이머를 설정할 수 있습니다.',
            'timer.sessionActive': '세션 재생 중',
            'timer.min15': '15분',
            'timer.min30': '30분',
            'timer.hour1': '1시간',
            'timer.hour2': '2시간',
            'timer.custom': '직접 설정',
            'timer.off': '타이머 끄기',
            'timer.cancel': '타이머 취소',
            'timer.set': '타이머 시작',
            'timer.remaining': '남은 시간',
            'timer.endsAt': '종료 예정',
            'timer.expired': '⏱️ 타이머가 완료되어 세션을 종료했습니다.',
            'timer.canceled': '타이머가 취소되었습니다.',
            'timer.setSuccess': '⏱️ {m}분 후 세션이 자동 종료됩니다.',
            'timer.gotoPlaylist': '🎵 Playlist로 이동',
            'timer.gotoHome': '🏠 홈으로 이동',

            // =====================================================
            // [Stage 10] UI/UX IA 재설계 및 Comfort 자동 모드
            // =====================================================
            'settings.secUiMode': '인터페이스 모드',
            'settings.uiLevel': '사용자 레벨',
            'settings.uiLevelHint': '선택한 레벨에 따라 노출 메뉴가 재구성됩니다 (자동 새로고침)',
            'settings.uiLevelSaved': '설정 저장됨 · 잠시 후 새로고침됩니다',
            'settings.levelL1': '일상 (간단하게)',
            'settings.levelL2': '표준 (일반 사용 권장)',
            'settings.levelL3': '고급 (세부 파라미터)',
            'settings.levelL4': '전문가 (모든 엔지니어링 기능)',
            'dashboard.tabControl': '제어',
            'dashboard.tabEnv': '스마트쾌적',
            'dashboard.tabPreset': '프리셋',
            'dashboard.sensorTitle': '센서 모니터링',
            'dashboard.styleTitle': '바람 스타일',
            'dashboard.styleHint': '바람 변동 패턴 보정',
            'dashboard.presetTitle': '자연풍 프리셋',
            'dashboard.presetHint': '10대 시뮬레이션 환경 선택',
            'common.details': '상세보기',
            'timer.quickPrompt': '몇 분 후 종료할까요? (분 단위 입력)',
            'comfort.autoTitle': '스마트 쾌적 자동 모드',
            'comfort.autoDesc': '실내 환경을 5분마다 감지하여 최적의 자연풍을 자동으로 유지합니다.',
            'comfort.autoOn': '자동 모드 켜짐',
            'comfort.autoOff': '자동 모드 꺼짐',
            'comfort.autoConfirmOn': '쾌적 자동 모드를 켜시겠습니까? 5분마다 바람이 자동 조절됩니다.',
            'comfort.autoBadge': '🤖 자동',
            'comfort.nextEval': '다음 환경 평가까지: ',
            'comfort.statusWaiting': '<b>다음 평가: {remain}</b> 후 자동 실행',
            'comfort.statusRunning': '<b>🤖 자동 실행 중</b> — {preset} · {style}',
            'comfort.statusRunningProfile': '<b>🤖 자동 실행 중</b> — {profileName}',
            'comfort.statusUserPriority': '<b>수동 세션 우선</b> — 종료 후 자동 재개',
            'comfort.statusSuspended': '<b>⚠️ 자동 종료 우선</b> — 일시 중단됨',
            'comfort.statusResumeBtn': '재개',
            'comfort.autoResumed': '자동 모드가 재개되었습니다',
            'timer.browserOnly': '이 타이머는 브라우저 세션에서만 유효합니다',
            'timer.autoComfortOff': '⏱️ 타이머 만료로 자동 모드도 함께 중단되었습니다',
            'timer.invalidInput': '1~480 사이의 숫자를 입력하세요',
            'timer.maxRange': '타이머는 최대 480분(8시간)까지 설정할 수 있습니다',
            'timer.quickStarted': '{min}분 타이머가 시작되었습니다',
            'timer.backendSyncFailed': '기기 타이머 동기화 실패 · 이 창을 닫으면 타이머가 해제됩니다',
            'common.stopSession': '세션 정지',
            'schedule.modeSimple': '간단 예약',
            'schedule.modeAdvanced': '고급 작곡 예약',
            'schedule.simpleSaved': '스케줄이 등록되었습니다.',
            'ai.inputPlaceholder': '자연풍 제어나 궁금한 점을 물어보세요...',
            // ═══════════ [Stage 5] 신규 키 (KO) ═══════════
            'home.oneTouchStart': '⚡ 지금 시작',
            'home.scenario.sleep': '🌙 수면',
            'home.scenario.office': '💼 사무',
            'home.scenario.study': '📚 독서',
            'home.scenario.rest': '🛋️ 휴식',
            'home.scenario.exercise': '🏃 운동',
            'home.scenario.baby': '👶 유아',
            'home.scenario.pet': '🐾 반려',
            'home.scenario.autoFull': '✨ AI 스마트 쾌적',
            'home.scenario.autoSelect': '🎯 취향 맞춤 Auto',
            'home.scenario.skipConfirm': '☑ 다음부터 이 확인창 없이 바로 시작',
            'home.scenario.sleepMeta': '8h타이머·22°C정지',
            'home.scenario.officeMeta': 'DI·PIR연동',
            'home.scenario.studyMeta': '미풍·집중스타일',
            'home.scenario.restMeta': '밸런스·자연풍',
            'home.scenario.exerciseMeta': '강풍·돌풍활력',
            'home.scenario.babyMeta': '24°C정지·초미풍',
            'home.scenario.petMeta': 'PIR감지·온도감시',
            'home.scenario.autoFullMeta': '실시간 100% 자율',
            'home.scenario.autoSelectMeta': '바람고정·세기자동',
            'session.autoFull': '✨ AI 스마트 쾌적',
            'session.autoSelect': '🎯 취향 맞춤 Auto',
            'session.autoSelectPrompt': '내가 원하는 바람 기준 선택',
            'session.autoSelectPreset': '프리셋',
            'session.autoSelectPlaylist': '플레이리스트',
            'session.autoSelectHint': '※ 선택한 바람을 유지하며, 날씨에 따라 바람 스타일과 팬 세기만 자동 조절됩니다',
            'session.autoFullHint1': '· 실내 온도·습도·불쾌지수 실시간 자동 감지',
            'session.autoFullHint2': '· 5분마다 최적의 프리셋 & 스타일 자동 전환',
            'session.autoFullHint3': '· 상시 쾌적 감시 (더워지면 스스로 재가동)',
            'session.autoFullHint4': '· 사용자가 슬라이더 조작 시 수동 전환',
            'fsm.envPaused': '⏸ 환경 일시정지',
            'fsm.pauseReasonMotion': '👤 사람 없음',
            'fsm.pauseReasonTempLow': '🌡️ 온도 낮음',
            'fsm.pauseReasonDiLow': '☀️ 불쾌지수 낮음',
            'fsm.pauseResumeHint.temp': '현재 {cur}°C / 재개 {resume}°C 대기 중',
            'fsm.pauseResumeHint.di': '현재 DI {cur} / 재개 {resume} 대기 중',
            'fsm.pauseResumeHint.motion': '재실 감지 시 자동 재개',
            'rule.template.deepSleep': '🌙 숙면 권장',
            'rule.template.babySafe': '👶 유아 안심',
            'rule.template.officeFocus': '💼 사무 집중',
            'rule.sectionPause': '⏸ 일시정지 (자동 재개)',
            'rule.sectionStop': '⏹ 완전 종료 (사용자 확인)',
            'rule.sectionComfort': '✨ AI 스마트 쾌적',
            'rule.pir.enabled': '사람 없으면 멈춤',
            'rule.tempLow.enabled': '온도 낮음',
            'rule.tempLow.threshold': '임계',
            'rule.tempLow.modePause': '일시정지 (자동 재개)',
            'rule.tempLow.modeStop': '완전 종료 (사용자 확인 필요)',
            'rule.tempLow.hysteresis': '재개 임계',
            'rule.diLow.enabled': '불쾌지수 낮음',
            'rule.timer.enabled': '타이머',
            'rule.timer.suffix': '분 후 종료',
            'rule.offTime.enabled': '예약 시각',
            'rule.offTime.suffix': '종료',
            'rule.smartComfort.interval': '자동 개입',
            'rule.smartComfort.alwaysOn': '상시 쾌적 감시 (더워지면 스스로 켜기)',
            'rule.tipModes': '⦿일시정지 = 자동 재개 / ○완전 종료 = 사용자 확인까지 유지',
            'rule.tipBabySafe': '유아방·수면에는 완전 종료를 권장합니다',
            'rule.validate.saveDisabled': '규칙 입력값을 확인하세요',
            'auto.rules.globalSection': '🌐 전역 기본 규칙',
            'auto.rules.profileSection': '📋 프로파일별 규칙',
            'auto.rules.scheduleSection': '📅 스케줄별 규칙',
            'auto.rules.inheritHint': '프로파일 규칙 상속',
            'auto.rules.customHint': '직접 설정',
            'nav.wind': '바람 만들기',
            'nav.wind.studio': '🎨 작곡',
            'nav.wind.simulation': '🎮 체험실',
            'nav.wind.playlist': '📋 플레이리스트',
            'nav.wind.presets': '🌿 프리셋 관리',
            'nav.groupDaily': '일상',
            'nav.groupControl': '주요 제어',
            'nav.groupSystem': '시스템',
            'monitor.timeline.running': '■ 가동',
            'monitor.timeline.paused': '■ 환경 일시정지',
            'monitor.timeline.idle': '■ 대기',
            'chart.yAxis.fixedHint': 'Y축 0.0~8.0 m/s 고정',


        },

        en: {
            'rule.title': 'Edit Rule',
            'rule.validate.hysteresisTemp': 'Temperature hysteresis (>=0.5°C) is required in PAUSE mode',
            'rule.validate.hysteresisDi': 'DI hysteresis (>=3.0) is required in PAUSE mode',
            // =====================================================
            // Common
            // =====================================================
            'app.title': 'Smart Nature Wind',
            'common.ok': 'OK',
            'common.cancel': 'Cancel',
            'common.close': 'Close',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.loading': 'Loading...',
            'common.noData': 'No data',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.undo': 'Undo',
            'common.apply': 'Apply',

            // =====================================================
            // Onboarding
            // =====================================================
            'onboarding.step2': 'Wi-Fi Info',
            'onboarding.step3': 'Choose First Breeze',
            'onboarding.step4': 'Start',
            'onboarding.wifiTitle': 'Wi-Fi Connection',
            'onboarding.wifiDesc': 'You are connected to the device Wi-Fi. Use the info below to access.',
            'onboarding.connected': 'Got it',
            'onboarding.firstBreezeTitle': 'Choose your first breeze',
            'onboarding.firstBreezeDesc': 'Pick one of three nature winds to begin.',
            'onboarding.breeze.ocean': 'Ocean Breeze',
            'onboarding.breeze.oceanDesc': 'Cool waves rolling in',
            'onboarding.breeze.forest': 'Forest Canopy',
            'onboarding.breeze.forestDesc': 'Soft, calm forest rest',
            'onboarding.breeze.mountain': 'Mountain Wind',
            'onboarding.breeze.mountainDesc': 'Refreshing valley breeze',
            'onboarding.startNowTitle': 'Start now?',
            'onboarding.startNowDesc': 'Playing "{name}" right away.',
            'onboarding.startNow': 'Start Now',
            'onboarding.later': 'Later',

            // =====================================================
            // Session
            // =====================================================
            'session.playlist': 'Playlist',
            'session.preset': 'Preset',
            'session.fixed': 'Normal Fan',
            'session.manual': 'Manual',
            'session.schedule': 'Scheduled',
            'session.paused': 'Paused',
            'session.playing': 'Playing',
            'session.none': 'No Session',

            // =====================================================
            // Now Playing
            // =====================================================
            'np.pause': 'Pause',
            'np.resume': 'Resume',
            'np.stop': 'Stop',
            'np.step': 'Step {n}/{total}',
            'np.schedulePending': 'Scheduled',
            'np.scheduleConflict': 'Schedule Conflict',

            // =====================================================
            // Home
            // =====================================================
            'home.title': 'Home',
            'home.nowPlaying': 'Now Playing',
            'home.playlist': '🎵 Play Playlists',
            'home.noPlaylist': 'No profiles yet',
            'home.goStudio': '🎨 Create in Studio',
            'home.normalFan': '🌀 Normal Fan',
            'home.context': "Today's Pick",
            'home.recommend': '"{name}" feels great today',
            'home.playRecommend': '▶ Play Now',
            'home.fanStop': 'Off',
            'home.fanStage': 'Stage {n}',

            // =====================================================
            // Studio
            // =====================================================
            'studio.title': 'Wind Design Studio',
            'studio.new': 'New Profile',
            'studio.edit': 'Edit Profile',
            'studio.name': 'Profile Name',
            'studio.repeat': 'Repeat',
            'studio.repeatCount': 'times (0=infinite)',
            'studio.steps': 'Step Sequence',
            'studio.addStep': '+ Add Step',
            'studio.stepTitle': 'Step {n}',
            'studio.type': 'Type',
            'studio.typePreset': 'Preset',
            'studio.typeFixed': 'Fixed Speed',
            'studio.typeRest': 'Rest (Fan Off)',
            'studio.duration': 'Duration',
            'studio.minutes': 'min',
            'studio.preset': 'Preset',
            'studio.style': 'Style',
            'studio.fixedSpeed': 'Fixed Speed',
            'studio.override': '⚙ Physics Override',
            'studio.intensity': 'Intensity',
            'studio.variability': 'Variability',
            'studio.gust': 'Gust',
            'studio.preview': '🎬 Preview',
            'studio.previewAll': '🎬 Preview Full Scenario',
            'studio.moveUp': 'Up',
            'studio.moveDown': 'Down',
            'studio.deleteStep': 'Delete',
            'studio.save': 'Save',
            'studio.update': 'Update',
            'studio.cancel': 'Cancel',
            'studio.confirmCancel': 'Discard changes?',

            // =====================================================
            // Playlist
            // =====================================================
            'playlist.title': 'Wind Playlist',
            'playlist.count': '{n} profiles',
            'playlist.new': '+ New',
            'playlist.steps': '{n} Steps',
            'playlist.refs': '⏰ Used by {n} schedule(s)',
            'playlist.noRefs': 'No schedule references',
            'playlist.play': '▶ Play',
            'playlist.edit': '✏️ Edit',
            'playlist.delete': '🗑',
            'playlist.confirmDelete': 'Delete this profile?',
            'playlist.confirmDeleteWithRefs': 'This profile is referenced by {n} schedule(s).\nDeleting will disable those schedules. Continue?',

            // =====================================================
            // Schedule
            // =====================================================
            'schedule.title': 'Schedule',
            'schedule.count': '{n} schedules',
            'schedule.new': '+ New Schedule',
            'schedule.name': 'Schedule Name',
            'schedule.days': 'Days',
            'schedule.start': 'Start',
            'schedule.end': 'End',
            'schedule.profile': '🎵 Playlist to Run',
            'schedule.profileHint': '💡 Create new profiles in the Studio tab first.',
            'schedule.noProfile': 'Create a profile first to schedule.',
            'schedule.goStudio': '🎨 Create in Studio',
            'schedule.note': '💡 Schedules auto-play playlists.\nEdit Steps in the Studio tab.',
            'schedule.missingProfile': '(Deleted profile)',
            'schedule.confirmDelete': 'Delete schedule "{name}"?',
            'schedule.conflict': '⏰ Schedule Conflict',
            'schedule.manualActive': 'Currently playing manually.',
            'schedule.nextSchedule': 'Next schedule',
            'schedule.in': '(in {n} min)',
            'schedule.now': '(active now)',
            'schedule.conflictDesc': 'Schedules will not run while manual playback is active. What would you like to do?',
            'schedule.stopManual': '⏹ Stop Manual',
            'schedule.keepManual': 'Keep Manual',
            'schedule.stopped': 'Manual stopped · Waiting for next schedule',

            'days.mon': 'Mon', 'days.tue': 'Tue', 'days.wed': 'Wed', 'days.thu': 'Thu',
            'days.fri': 'Fri', 'days.sat': 'Sat', 'days.sun': 'Sun',

            // =====================================================
            // Simulation
            // =====================================================
            'sim.title': '🎬 Wind Studio',
            'sim.singleTab': '🎬 Single Preview',
            'sim.abTab': '⚖ A/B Compare',
            'sim.feelings': 'Feelings',
            'sim.applyA': '✓ Apply This',
            'sim.applyB': 'Apply B',
            'sim.feel.coolness': 'Coolness',
            'sim.feel.freshness': 'Freshness',
            'sim.feel.dynamism': 'Dynamism',
            'sim.feel.smoothness': 'Smoothness',
            'sim.feel.calmness': 'Calmness',
            'sim.avg': 'Avg',
            'sim.intensity': 'Intensity',
            'sim.variability': 'Variability',
            'sim.gust': 'Gust',

            // =====================================================
            // Monitor
            // =====================================================
            'monitor.title': 'Monitor',
            'monitor.liveTab': '📊 Live',
            'monitor.retroTab': '🎬 Retro',
            'monitor.liveWind': '📊 Live Wind',
            'monitor.sensors': '🌡️ Sensors',
            'monitor.retroTitle': '🎬 Session Retro',
            'monitor.range1h': 'Last 1h',
            'monitor.range24h': 'Last 24h',
            'monitor.range7d': 'Last 7d',
            'monitor.refresh': '🔄',
            'monitor.sessionSummary': 'Session Summary',
            'monitor.totalSessions': 'Sessions',
            'monitor.totalActive': 'Active Time',
            'monitor.avgWind': 'Avg Wind',
            'monitor.maxWind': 'Max Wind',
            'monitor.avgTemp': 'Avg Temp',
            'monitor.presenceRatio': 'Presence',
            'monitor.timelineTitle': 'Event Timeline',
            'monitor.eventList': 'Events (Latest 30)',
            'monitor.temp': 'Temp',
            'monitor.humidity': 'Humidity',
            'monitor.motion': 'Motion',
            'monitor.detected': 'Detected',
            'monitor.absent': 'Absent',

            // =====================================================
            // Context
            // =====================================================
            'context.comfort': 'Comfortable',
            'context.slight': 'A bit warm',
            'context.uncomfort': 'Sticky weather',
            'context.severe': 'Suffocating',

            // =====================================================
            // Settings
            // =====================================================
            'settings.title': '⚙️ Settings',
            'settings.tabGeneral': 'General',
            'settings.tabNetwork': 'Network',
            'settings.tabHardware': 'Hardware',
            'settings.tabAdvanced': 'Advanced',
            'settings.lang': 'Language',
            'settings.version': 'Version',
            'settings.manual': 'User Manual',
            'settings.logs': 'System Logs',
            'settings.diag': 'Diagnostics',
            'settings.firmware': 'Firmware Update',
            'settings.factoryReset': 'Factory Reset',
            'settings.advanced': '⚠️ Advanced',

            // =====================================================
            // [N-5] Factory Reset 확인어 및 관련 문구
            // =====================================================
            'settings.factoryResetTitle': 'Factory Reset',
            'settings.factoryResetItems': 'The following will be deleted:',
            'settings.factoryResetConfirmWord': 'Type "RESET" below to confirm',
            'settings.factoryResetWord': 'RESET',
            'settings.factoryResetSuccess': 'Factory reset complete. Device will reboot.',
            'settings.deleteApiKey': 'Delete API Key',
            'settings.deleteGeminiKey': 'Delete Gemini Key',

            // =====================================================
            // Header / Nav
            // =====================================================
            'nav.home': 'Home',
            'nav.wind': 'Wind',
            'nav.automation': 'Auto',
            'nav.monitor': 'Monitor',
            'nav.settings': 'Settings',
            'header.menu': 'Menu',
            'header.language': 'Language',
            'header.online': 'Online',
            'header.offline': 'Offline',
            'header.connecting': 'Connecting',

            // =====================================================
            // Messages
            // =====================================================
            'msg.saveSuccess': 'Saved',
            'msg.deleteSuccess': 'Deleted',
            'msg.updateSuccess': 'Updated',
            'msg.playSuccess': 'Playing',
            'msg.loadFailed': 'Load failed',
            'msg.saveFailed': 'Save failed',
            'msg.networkError': 'Network error',
            'msg.stepMin': 'At least 1 step required',
            'msg.stepMax': 'Maximum 8 steps allowed',
            'msg.nameRequired': 'Please enter a name',
            'msg.durationRange': 'Duration must be 1~1440 min',
            'msg.selectProfile': 'Please select a playlist',
            'msg.timeOrder': 'End time must be after start time',

            // Nav
            'nav.dashboard': 'Dashboard',
            'nav.chart': 'Chart',
            'nav.schedule': 'Schedule',
            'nav.profiles': 'Profiles',
            'nav.sensors': 'Sensors',
            'nav.monitor': 'Monitor',
            'nav.simulation': 'Simulation',
            'nav.windprofile': 'Wind Presets',
            'nav.network': 'Network',
            'nav.logs': 'System Logs',
            'nav.diagnostics': 'Diagnostics',
            'nav.firmware': 'Firmware',
            'nav.ai': 'AI Assistant',
            'nav.info': 'Info',
            'nav.groupControl': 'Control',
            'nav.groupSettings': 'Settings',
            'nav.groupSystem': 'System',

            'common.start': 'Start',
            'common.stop': 'Stop',
            'common.add': 'Add',
            'common.warning': 'Warning',

            'footer.online': '🟢 Online',
            'footer.offline': '🔴 Offline',
            'footer.polling': '🟡 Polling',

            // Dashboard
            'dashboard.modeTitle': 'Operation Mode',
            'dashboard.modeSchedule': '◻ Schedule Auto Mode',
            'dashboard.modeProfile': '◼ Profile Manual Mode',
            'dashboard.realtimeState': 'Real-time State',
            'dashboard.currentWind': 'Current Wind',
            'dashboard.targetWind': 'Target Wind',
            'dashboard.phase': 'Phase',
            'dashboard.pwm': 'PWM',
            'dashboard.sch': 'Schedule',
            'dashboard.prof': 'Profile',
            'dashboard.powerTitle': 'Power Control',
            'dashboard.sensorTitle': 'Sensors',
            'dashboard.styleTitle': 'Wind Style',
            'dashboard.presetTitle': 'Nature Presets',
            'dashboard.physicsTitle': 'Physics Fine Tuning (3 params)',
            'dashboard.powerOn': 'Power On',
            'dashboard.powerOff': 'Power Off',
            'dashboard.temp': 'Temp',
            'dashboard.humidity': 'Humidity',
            'dashboard.motion': 'Motion',
            'dashboard.motionDetected': 'Detected',
            'dashboard.motionAbsent': 'Absent',
            'dashboard.modeSwitchedProfile': 'Switched to Profile mode',
            'dashboard.fanStop': 'Off',
            'dashboard.fanStage': 'Stage {n}',

            // Chart
            'chart.title': 'Live Physics Chart',
            'chart.tab.live': 'Live Running',
            'chart.tab.preview': 'Preview Waveform',
            'chart.range5s': '5s',
            'chart.range30s': '30s',
            'chart.range120s': '120s',
            'chart.overlay': 'Preview Overlay',
            'chart.exportCsv': 'Export CSV',
            'chart.wind': 'Wind',
            'chart.target': 'Target',
            'chart.pwm': 'PWM',

            // Settings
            'settings.secMeta': 'Meta Info',
            'settings.secFanPwm': 'Fan PWM',
            'settings.secFanCurve': 'Fan Curve (3-segment)',
            'settings.secPir': 'PIR Sensor',
            'settings.secDht': 'DHT Sensor',
            'settings.secLed': 'NeoPixel LED',
            'settings.tabComm': 'Network / WS',

            'settings.fieldDeviceName': 'Device Name',
            'settings.fieldLogLevel': 'Log Level',
            'settings.fieldLogMax': 'Max Log Entries',
            'settings.fieldRange': 'Range: {min}~{max}',
            'settings.fieldRecommended': 'Recommended: {range}',
            'settings.fieldPinPwm': 'PWM Pin',
            'settings.fieldChannel': 'LEDC Channel',
            'settings.fieldFreq': 'Frequency (Hz)',
            'settings.fieldRes': 'Resolution (bit)',
            'settings.fieldStart': 'Start Min (%)',
            'settings.fieldComfortMin': 'Comfort Start (%)',
            'settings.fieldComfortMax': 'Comfort End (%)',
            'settings.fieldHardMax': 'Hard Max (%)',
            'settings.fieldEnabled': 'Enabled',
            'settings.fieldPinPir': 'PIR Pin',
            'settings.fieldDebounce': 'Debounce (sec)',
            'settings.fieldHold': 'Hold (sec)',
            'settings.fieldPinDht': 'DHT Pin',
            'settings.fieldType': 'Sensor Type',
            'settings.fieldInterval': 'Interval (sec)',
            'settings.fieldPinLed': 'LED Pin',
            'settings.fieldNumPixels': 'Num Pixels',
            'settings.fieldBrightness': 'Default Brightness',

            'settings.configured': 'Configured',
            'settings.notConfigured': 'Not Configured',
            'settings.keyPlaceholderChange': 'Enter new key to change (empty = keep)',
            'settings.keyPlaceholderInput': 'Enter API Key',
            'settings.testApiKey': 'Test API Key',
            'settings.testApiSuccess': '✓ Auth success',
            'settings.testApiFail': '✗ Auth failed: {msg}',

            'settings.wsChannelConfig': 'WebSocket Channel Config',
            'settings.saveAndReload': 'Save & Reload',
            'settings.save': 'Save',
            'settings.reload': 'Reload',

            'settings.dirtyWarning': 'Unsaved changes exist.\nReloading will discard unsaved changes. Continue?',
            'settings.offlineReloadNotice': 'Reload is not supported in offline mode.',
            'settings.reloadRequested': 'Reload requested ({status})',
            'settings.reloadInProgress': 'Reload in progress...',
            'settings.reloadFailed': 'Reload failed',
            'settings.reloadComplete': 'Reload complete',
            'settings.saveAndReloadSuccess': 'Saved and reloaded',

            // Sensors
            'sensors.title': 'Live Sensors',
            'sensors.temp': 'Temp',
            'sensors.hum': 'Humidity',
            'sensors.motion': 'Motion',
            'sensors.feedPir': 'Test PIR Trigger',
            'sensors.feedPirSuccess': 'Trigger signal sent',
            'sensors.motionConfig': 'Motion Config',
            'sensors.pirEnabled': 'Enable PIR',
            'sensors.pirHoldSec': 'PIR Hold (sec)',
            'sensors.saveMotionSuccess': 'Motion config saved',

            // Diagnostics
            'diagnostics.allJson': 'All Config JSON',
            'diagnostics.saveDirty': 'Save Dirty Config',
            'diagnostics.saveDirtySuccess': 'Dirty config saved',
            'diagnostics.fetchFail': 'Config fetch failed',
            'diagnostics.metricsRealtime': 'Realtime Metrics',

            // Log / AI / Firmware
            'log.filterAll': 'All Levels',
            'log.clear': 'Clear',
            'log.export': 'Export JSON',
            'log.none': 'None',
            'log.error': 'Error',
            'log.warn': 'Warn',
            'log.info': 'Info',
            'log.debug': 'Debug',

            'ai.title': 'AI Assistant',
            'ai.placeholder': 'Ask anything about wind...',
            'ai.example1': 'What wind suits today\'s weather?',
            'ai.example2': 'Recommend a sleep-friendly setting',
            'ai.example3': 'Explain the nature preset differences',
            'ai.send': 'Send',
            'ai.thinking': 'Thinking...',
            'ai.voiceListening': 'Listening...',
            'ai.voiceNotSupported': 'Voice recognition is not supported in this browser.',
            'ai.micError': 'Please allow microphone access.',
            'ai.modeRest': 'Natural Control (REST)',
            'ai.modeLive': 'Live Voice (Live)',
            'ai.actionDone': 'Command executed',
            'ai.clearHistory': 'Clear History',
            'ai.dailyCapReached': 'Daily Live voice limit (30 min) reached.',
            'ai.liveCost': 'Today Live: {min}m / {cap}m (${cost})',
            'ai.liveConnecting': 'Connecting Live...',
            'ai.liveConnected': 'Live connected (Talk freely)',
            'ai.liveSpeaking': 'AI Speaking...',
            'ai.liveStart': '🎙️ Start Live Voice',
            'ai.liveStop': '⏹️ Stop Live',
            'ai.liveCapWarning': '⚠️ Approaching daily limit ({min}m used)',

            'firmware.otaUpdate': 'Firmware Update (OTA)',
            'firmware.uploadBtn': 'Upload',
            'firmware.otaSuccess': 'Firmware upload complete',
            'firmware.fileUpload': 'File Upload',

            // Segment
            'segment.onMinutes': 'On (min)',
            'segment.offMinutes': 'Off (min)',
            'segment.mode': 'Mode',
            'segment.modePreset': 'Preset Mode',
            'segment.modeFixed': 'Fixed Speed Mode',
            'segment.presetSelect': 'Preset',
            'segment.styleSelect': 'Style',
            'segment.fixedSpeed': 'Fixed Speed (%)',
            'segment.overrideTitle': '⚙️ Advanced Physics (Override)',
            'segment.overrideDesc': 'Override wind physics for this segment',
            'segment.overrideIntensity': 'Wind Intensity (%)',
            'segment.overrideVariability': 'Wind Variability (%)',
            'segment.overrideGust': 'Gust Frequency (%)',
            'segment.moveUp': 'Up',
            'segment.moveDown': 'Down',
            'segment.deleted': 'Segment deleted',
            'segment.summaryPrefix': 'Segments',

            // Schedule additions
            'schedule.secBasic': 'Basic Info',
            'schedule.secSegments': 'Segments',
            'schedule.secSmart': 'Smart Off',
            'schedule.add': 'Add Schedule',
            'schedule.addSegmentBtn': 'Add Segment',
            'schedule.segment': 'Segment',
            'schedule.segmentRepeat': 'Segment Repeat',
            'schedule.repeatCount': 'Repeat Count',
            'schedule.startTime': 'Start Time',
            'schedule.endTime': 'End Time',
            'scheduler.title': 'Schedule',
            'scheduler.day': 'Days',
            'scheduler.segment': 'Segment',
            'scheduler.scheduledOff': 'Scheduled Off',
            'scheduler.tempOff': 'Temp Threshold Off',

            // Profiles additions
            'profiles.add': 'Add Profile',
            'profiles.no': 'Profile No.',
            'profiles.enabled': 'Enabled',
            'profiles.name': 'Profile Name',
            'profiles.addSegmentBtn': 'Add Segment',
            'profiles.autoOffTimer': 'Auto Off (min)',
            'profile.title': 'User Profiles',
            'profile.active': 'Active',

            // Network
            'network.title': 'Network Status',
            'network.wifiConfig': 'Wi-Fi Config',
            'network.timeConfig': 'Time Config',
            'network.wifiMode': 'Wi-Fi Mode',
            'network.apSettings': 'AP Settings',
            'network.staSettings': 'STA Networks',
            'network.status': 'Status',
            'network.ip': 'IP Address',
            'network.mac': 'MAC Address',
            'network.timeSynced': 'Time Sync',
            'network.synced': 'Synced',
            'network.notSynced': 'Not Synced',
            'network.scanWifi': 'Scan Wi-Fi',
            'network.connect': 'Connect',
            'network.saveWifi': 'Save Wi-Fi',
            'network.saveTime': 'Save Time',
            'network.noStaNotice': 'No STA networks registered',

            // Windprofile
            'windprofile.title': 'Wind Preset Manager',
            'windprofile.add': 'Add Preset',
            'windprofile.code': 'Code (English)',
            'windprofile.intensity': 'Intensity',
            'windprofile.variability': 'Variability',
            'windprofile.gust': 'Gust',
            'windprofile.fanLimit': 'Fan Limit',
            'windprofile.factorsTitle': 'Base Wind Parameters',

            // PIR
            'pir.testSuccess': '✓ PIR detected',
            'pir.testFail': '✗ PIR not detected (check sensor)',

            // Units
            'unit.celsius': '°C',
            'unit.humidity': '%',
            'unit.seconds': 's',
            'unit.windSpeed': 'm/s',

            // Validation
            'validate.required': '{field} is required',
            'validate.range': '{field}: must be {min}~{max}',
            'validate.timeOrder': 'End time must be after start time',
            'validate.multiErrors': '{count} field(s) have errors',
            'validate.segmentMin': 'At least 1 segment required',

            // Messages
            'msg.unknown': 'Unknown error',
            'msg.accessDenied': 'Access denied',
            'msg.deleteConfirm': 'Delete this item?',
            'msg.saveAndReloadSuccess': 'Saved and reloaded',

            // FSM
            'fsm.idle': 'Idle',
            'fsm.override': 'Manual',
            'fsm.profileRun': 'Profile',
            'fsm.scheduleRun': 'Schedule',
            'fsm.motionBlocked': 'Motion Blocked',
            'fsm.autoOffStopped': 'AutoOff',
            'fsm.timeInvalid': 'Time Invalid',

            // Reason
            'reason.none': 'None',
            'reason.overrideActive': 'Manual override',
            'reason.profileMode': 'Profile mode',
            'reason.userProfileActive': 'User profile active',
            'reason.scheduleActive': 'Schedule active',
            'reason.noActiveSchedule': 'No active schedule',
            'reason.noSchedules': 'No schedules',
            'reason.timeNotValid': 'Time not valid',
            'reason.motionNoPresence': 'No presence',
            'reason.autoOffTimer': 'AutoOff timer',
            'reason.autoOffTime': 'AutoOff time',
            'reason.autoOffTemp': 'AutoOff temp',

            // Wind Phase
            'phase.calm': 'Calm',
            'phase.normal': 'Normal',
            'phase.strong': 'Strong',

            // AutoOff
            'autoOff.timer': 'Timer',
            'autoOff.time': 'Scheduled Off',
            'autoOff.temp': 'Temperature Off',

            // Presets (10)
            'preset.OCEAN': 'Ocean Breeze',
            'preset.COUNTRY_BREEZE': 'Country Breeze',
            'preset.MEDITERRANEAN': 'Mediterranean',
            'preset.MOUNTAIN': 'Mountain',
            'preset.PLAINS': 'Plains',
            'preset.HARBOR_BREEZE': 'Harbor Breeze',
            'preset.FOREST_CANOPY': 'Forest Canopy',
            'preset.URBAN_SUNSET': 'Urban Sunset',
            'preset.TROPICAL_RAIN': 'Tropical Rain',
            'preset.DESERT_NIGHT': 'Desert Night',

            // Styles (5)
            'style.BALANCE': 'Balance',
            'style.ACTIVE': 'Active',
            'style.FOCUS': 'Focus',
            'style.RELAX': 'Relax',
            'style.SLEEP': 'Sleep',
            'msg.success': 'Operation completed successfully',
            'reconnect.body': 'Connection to device lost. Reconnecting...',
            'msg.apiKeyRequired': 'API key is required',
            'msg.reloadPending': 'Reload pending...',
            'msg.timeout': 'Request timed out',

            // =====================================================
            // Automation Timer Panel
            // =====================================================
            'timer.title': '⏱️ Session Timer',
            'timer.subtitle': 'When should the current session stop?',
            'timer.noSession': 'No active session running.',
            'timer.noSessionTip': 'Start a breeze first to set an auto-off timer.',
            'timer.sessionActive': 'Session Running',
            'timer.min15': '15 min',
            'timer.min30': '30 min',
            'timer.hour1': '1 hour',
            'timer.hour2': '2 hours',
            'timer.custom': 'Custom',
            'timer.off': 'Turn Off',
            'timer.cancel': 'Cancel Timer',
            'timer.set': 'Start Timer',
            'timer.remaining': 'Remaining',
            'timer.endsAt': 'Ends at',
            'timer.expired': '⏱️ Timer completed. Session stopped.',
            'timer.canceled': 'Timer canceled.',
            'timer.setSuccess': '⏱️ Session will stop in {m} minutes.',
            'timer.gotoPlaylist': '🎵 Go to Playlist',
            'timer.gotoHome': '🏠 Go to Home',

            // =====================================================
            // [Stage 10] UI/UX IA Redesign & Comfort Auto Mode
            // =====================================================
            'settings.secUiMode': 'Interface Mode',
            'settings.uiLevel': 'User Level',
            'settings.uiLevelHint': 'Reconfigures menus based on selected level (auto reloads)',
            'settings.uiLevelSaved': 'Settings saved · Reloading shortly',
            'settings.levelL1': 'Simple (Beginner)',
            'settings.levelL2': 'Standard (Recommended)',
            'settings.levelL3': 'Advanced (Detailed Tuning)',
            'settings.levelL4': 'Expert (All Engineering Tools)',
            'dashboard.tabControl': 'Control',
            'dashboard.tabEnv': 'Environment',
            'dashboard.tabPreset': 'Presets',
            'dashboard.sensorTitle': 'Sensors Monitoring',
            'dashboard.styleTitle': 'Wind Style',
            'dashboard.styleHint': 'Waveform pattern modifier',
            'dashboard.presetTitle': 'Nature Presets',
            'dashboard.presetHint': '10 nature presets',
            'common.details': 'Details',
            'timer.quickPrompt': 'Minutes until fan auto stop? (Enter number)',
            'comfort.autoTitle': 'Smart Comfort Auto Mode',
            'comfort.autoDesc': 'Monitors room conditions every 5 min and maintains optimal wind.',
            'comfort.autoOn': 'Auto Mode Active',
            'comfort.autoOff': 'Auto Mode Inactive',
            'comfort.autoConfirmOn': 'Activate Auto Comfort mode? Wind will adjust every 5 minutes.',
            'comfort.autoBadge': '🤖 Auto',
            'comfort.nextEval': 'Next evaluation in: ',
            'comfort.statusWaiting': '<b>Next evaluation: {remain}</b>',
            'comfort.statusRunning': '<b>🤖 Auto Running</b> — {preset} · {style}',
            'comfort.statusRunningProfile': '<b>🤖 Auto Running</b> — {profileName}',
            'comfort.statusUserPriority': '<b>Manual session priority</b> — will resume after',
            'comfort.statusSuspended': '<b>⚠️ AutoOff priority</b> — suspended',
            'comfort.statusResumeBtn': 'Resume',
            'comfort.autoResumed': 'Auto Mode resumed',
            'timer.browserOnly': 'This timer only persists in the browser session',
            'timer.autoComfortOff': '⏱️ Auto Mode stopped by timer expiry',
            'timer.invalidInput': 'Please enter a number between 1-480',
            'timer.maxRange': 'Timer max is 480 minutes (8 hours)',
            'timer.quickStarted': 'Timer started for {min} min',
            'timer.backendSyncFailed': 'Device timer sync failed · Timer will be lost if this window closes',
            'common.stopSession': 'Stop Session',
            'schedule.modeSimple': 'Simple Schedule',
            'schedule.modeAdvanced': 'Advanced Schedule',
            'schedule.simpleSaved': 'Schedule has been saved.',
            'ai.inputPlaceholder': 'Ask AI to control wind or anything...',
            // ═══════════ [Stage 5] 신규 키 (EN) ═══════════
            'home.oneTouchStart': '⚡ Quick Start',
            'home.scenario.sleep': '🌙 Sleep',
            'home.scenario.office': '💼 Office',
            'home.scenario.study': '📚 Study',
            'home.scenario.rest': '🛋️ Rest',
            'home.scenario.exercise': '🏃 Exercise',
            'home.scenario.baby': '👶 Baby',
            'home.scenario.pet': '🐾 Pet',
            'home.scenario.autoFull': '✨ AI Smart Comfort',
            'home.scenario.autoSelect': '🎯 Custom Auto',
            'home.scenario.skipConfirm': '☑ Skip this confirmation next time',
            'home.scenario.sleepMeta': '8h timer · 22°C stop',
            'home.scenario.officeMeta': 'DI · PIR linked',
            'home.scenario.studyMeta': 'Gentle · Focus style',
            'home.scenario.restMeta': 'Balance · Natural',
            'home.scenario.exerciseMeta': 'Strong · Gusty',
            'home.scenario.babyMeta': '24°C stop · Ultra gentle',
            'home.scenario.petMeta': 'PIR · Temp monitoring',
            'home.scenario.autoFullMeta': '100% Autonomous',
            'home.scenario.autoSelectMeta': 'Fixed base · Auto strength',
            'session.autoFull': '✨ AI Smart Comfort',
            'session.autoSelect': '🎯 Custom Auto',
            'session.autoSelectPrompt': 'Select your preferred base',
            'session.autoSelectPreset': 'Preset',
            'session.autoSelectPlaylist': 'Playlist',
            'session.autoSelectHint': '※ Base wind stays fixed; style and strength auto-adjust to weather',
            'session.autoFullHint1': '· Real-time temp · humidity · DI sensing',
            'session.autoFullHint2': '· Optimal preset switch every 5 minutes',
            'session.autoFullHint3': '· Continuous comfort monitoring (auto-restart if hot)',
            'session.autoFullHint4': '· Switch to manual on user interaction',
            'fsm.envPaused': '⏸ Environment Paused',
            'fsm.pauseReasonMotion': '👤 No presence',
            'fsm.pauseReasonTempLow': '🌡️ Temp too low',
            'fsm.pauseReasonDiLow': '☀️ DI too low',
            'fsm.pauseResumeHint.temp': 'Current {cur}°C / Resume at {resume}°C',
            'fsm.pauseResumeHint.di': 'Current DI {cur} / Resume at {resume}',
            'fsm.pauseResumeHint.motion': 'Auto-resume on presence detection',
            'rule.template.deepSleep': '🌙 Deep Sleep',
            'rule.template.babySafe': '👶 Baby Safe',
            'rule.template.officeFocus': '💼 Office Focus',
            'rule.sectionPause': '⏸ Pause (Auto-resume)',
            'rule.sectionStop': '⏹ Stop (User Confirm)',
            'rule.sectionComfort': '✨ AI Smart Comfort',
            'rule.pir.enabled': 'Pause when no presence',
            'rule.tempLow.enabled': 'Low temperature',
            'rule.tempLow.threshold': 'Threshold',
            'rule.tempLow.modePause': 'Pause (Auto-resume)',
            'rule.tempLow.modeStop': 'Stop (User Confirm required)',
            'rule.tempLow.hysteresis': 'Resume threshold',
            'rule.diLow.enabled': 'Low DI',
            'rule.timer.enabled': 'Timer',
            'rule.timer.suffix': 'min later stop',
            'rule.offTime.enabled': 'Scheduled stop',
            'rule.offTime.suffix': 'stop',
            'rule.smartComfort.interval': 'Auto intervention',
            'rule.smartComfort.alwaysOn': 'Always-on comfort (auto-restart if hot)',
            'rule.tipModes': '⦿Pause = auto-resume / ○Stop = persist until user confirm',
            'rule.tipBabySafe': 'Use Stop mode for baby room & sleep',
            'rule.validate.saveDisabled': 'Check rule inputs',
            'auto.rules.globalSection': '🌐 Global Default Rules',
            'auto.rules.profileSection': '📋 Per-Profile Rules',
            'auto.rules.scheduleSection': '📅 Per-Schedule Rules',
            'auto.rules.inheritHint': 'Inherit profile rule',
            'auto.rules.customHint': 'Custom',
            'nav.wind': 'Wind Studio',
            'nav.wind.studio': '🎨 Studio',
            'nav.wind.simulation': '🎮 Simulation',
            'nav.wind.playlist': '📋 Playlist',
            'nav.wind.presets': '🌿 Presets',
            'nav.groupDaily': 'Daily',
            'nav.groupControl': 'Main Control',
            'nav.groupSystem': 'System',
            'monitor.timeline.running': '■ Running',
            'monitor.timeline.paused': '■ Env. Paused',
            'monitor.timeline.idle': '■ Idle',
            'chart.yAxis.fixedHint': 'Y-axis fixed 0.0~8.0 m/s',

        }

    };

    const SUPPORTED_LANGS = ['ko', 'en'];

    let currentLang = (function () {
        try {
            const saved = localStorage.getItem(SNW.CFG?.LS_KEY?.LANG || 'snw.lang');
            if (SUPPORTED_LANGS.includes(saved)) return saved;
            // 브라우저 언어 자동 감지
            const nav = navigator.language || 'ko';
            return nav.startsWith('ko') ? 'ko' : 'en';
        } catch { return 'ko'; }
    })();

    SNW.I18n = {
        getLang() { return currentLang; },

        setLang(lang) {
            if (!SUPPORTED_LANGS.includes(lang)) return;
            currentLang = lang;
            try { localStorage.setItem(SNW.CFG?.LS_KEY?.LANG || 'snw.lang', lang); } catch { }
            document.documentElement.lang = lang;
            document.dispatchEvent(new CustomEvent('snw:langchange', { detail: { lang } }));
            this.applyTo(document);
        },

        t(key, params) {
            const dict = DICT[currentLang] || DICT.ko;
            let s = dict[key] != null ? dict[key] : (DICT.ko[key] || key);
            if (params) {
                s = s.replace(/\{(\w+)\}/g, (m, k) => params[k] != null ? String(params[k]) : m);
            }
            return s;
        },

        hasKey(key) {
            return DICT.ko[key] != null || DICT.en[key] != null;
        },

        applyTo(root) {
            (root || document).querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key && this.hasKey(key)) el.textContent = this.t(key);
            });
        },
    };

    document.documentElement.lang = currentLang;
})(window.SNW);


/* ---- 030.util.level.js (1458 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 030.util.level.js
 * 모듈     : SNW.LevelUtil
 * 레이어   : Layer 1 (유틸) — 030~034와 동일 계층
 * 기능 요약:
 *  - 사용자 레벨 (L1~L4) 조회/설정
 *  - data-min-level 속성 자동 필터
 *  - localStorage 기반 유지
 * 의존성   : SNW.C, SNW.CFG
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.LevelUtil = {
		LEVELS: SNW.C.LEVEL.ORDER,
		
		current() {
			try {
				const v = localStorage.getItem(SNW.CFG.LS_KEY.LEVEL);
				return this.LEVELS.includes(v) ? v : SNW.CFG.DEFAULT_LEVEL;
			} catch { return SNW.CFG.DEFAULT_LEVEL; }
		},
		
		set(level) {
			if (!this.LEVELS.includes(level)) return;
			try { localStorage.setItem(SNW.CFG.LS_KEY.LEVEL, level); } catch {}
			// 페이지 재로드 (레벨별 라우트 재검증)
			location.reload();
		},
		
		atLeast(minLevel) {
			const cur = this.current();
			return this.LEVELS.indexOf(cur) >= this.LEVELS.indexOf(minLevel);
		},
		
		/** data-min-level 요소 자동 표시/숨김 */
		applyTo(root) {
			const cur = this.current();
			(root || document).querySelectorAll('[data-min-level]').forEach(el => {
				const min = el.getAttribute('data-min-level');
				const show = this.LEVELS.indexOf(cur) >= this.LEVELS.indexOf(min);
				el.style.display = show ? '' : 'none';
			});
		}
	};
	
})(window.SNW);


/* ---- 030.util.time.js (2042 bytes) ---- */
// =========================================================
// 030.util.time.js — SNW.TimeUtil (SPEC §5.3 준수)
// Layer 1 (유틸) — SNW.C 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.TimeUtil = {
		/**
		 * uptimeMs → 절대 시각 (Date)
		 * @param {number} fieldMs  uptimeMs 필드 값
		 * @param {object} system   { uptimeMs, epochNowMs } (control.system)
		 * @returns {Date|null}     epochNowMs=0이면 null
		 */
		uptimeToDate(fieldMs, system) {
			if (!system || !system.epochNowMs || system.epochNowMs === 0) return null;
			const serverBootMs = system.epochNowMs - system.uptimeMs;
			return new Date(serverBootMs + fieldMs);
		},
		
		/** durationSec → "mm:ss" */
		secToMmss(sec) {
			if (!Number.isFinite(sec) || sec < 0) return "00:00";
			const m = Math.floor(sec / 60);
			const s = Math.floor(sec % 60);
			return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
		},
		
		/** durationMs → "N.N초" or "N.Ns" */
		msToSecLabel(ms) {
			const unit = (SNW.I18n ? SNW.I18n.t('unit.seconds') : '초');
			if (!Number.isFinite(ms) || ms < 0) return `0.0${unit}`;
			return (ms / 1000).toFixed(1) + unit;
		},
		
		/** epochms → "HH:MM:SS" */
		epochToTimeStr(epochMs) {
			if (!Number.isFinite(epochMs)) return "--:--:--";
			const d = new Date(epochMs);
			return `${String(d.getHours()).padStart(2,'0')}:` +
				`${String(d.getMinutes()).padStart(2,'0')}:` +
				`${String(d.getSeconds()).padStart(2,'0')}`;
		},
		
		/** control.time.{hour,min} → "HH:MM" or "--:--" */
		clockStr(hour, min) {
			if (hour < 0 || min < 0) return "--:--";
			return `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
		},
		
		/** 1초 주기 시계 (WS 무관 UI 시계) */
		startClock(el, getHmFn) {
			const tick = () => {
				const hm = getHmFn();
				el.textContent = SNW.TimeUtil.clockStr(hm.hour ?? -1, hm.min ?? -1);
			};
			tick();
			return setInterval(tick, 1000);
		}
	};
	
})(window.SNW);


/* ---- 031.util.dom.js (2114 bytes) ---- */
// =========================================================
// 031.util.dom.js — SNW.DomUtil (PATCHED)
//  - 원본의 DomUtil 재할당 → 단일 리터럴로 통합
//  - tooltip()을 리터럴 첫 메서드로 이동
//  - 중복 'use strict'; 제거
//  - tooltip 내부 참조를 this.escape()로 방어
// Layer 1 (유틸) — SNW.C 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.DomUtil = {
		// [U-B6] 용어 툴팁
		tooltip(term, definition) {
			return `<span class="snw-term" title="${this.escape(definition)}" style="cursor:help;border-bottom:1px dashed var(--snw-text-dim);">${this.escape(term)}</span>`;
		},
		
		/** 안전 textContent */
		text(el, v) {
			if (el) el.textContent = (v == null) ? '' : String(v);
		},
		
		/** 안전 class 토글 */
		toggleClass(el, cls, on) {
			if (el) el.classList.toggle(cls, !!on);
		},
		
		/** data-* 기반 이벤트 위임 */
		delegate(root, selector, event, handler) {
			root.addEventListener(event, (e) => {
				const t = e.target.closest(selector);
				if (t && root.contains(t)) handler(e, t);
			});
		},
		
		/** HTML escape */
		escape(s) {
			return String(s).replace(/[&<>"']/g,
				c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [c]));
		},
		
		/** HTML 템플릿 → Element (값은 escape) */
		html(strings, ...vals) {
			const div = document.createElement('div');
			div.innerHTML = strings.reduce((acc, s, i) => {
				const v = vals[i];
				const safe = (v == null) ? '' :
					(typeof v === 'string' ? this.escape(v) : v);
				return acc + s + (i < vals.length ? safe : '');
			}, '').trim();
			return div.firstElementChild;
		},
		
		/** 반응형 뷰포트 클래스 */
		applyResponsiveClass(el) {
			const apply = () => {
				const w = window.innerWidth;
				el.classList.toggle('snw-mobile', w < 768);
				el.classList.toggle('snw-tablet', w >= 768 && w < 1024);
				el.classList.toggle('snw-desktop', w >= 1024);
			};
			apply();
			window.addEventListener('resize', apply);
		}
	};
	
})(window.SNW);


/* ---- 032.util.log.js (676 bytes) ---- */
// =========================================================
// 032.util.log.js — SNW.LogUtil
// Layer 1 (유틸) — SNW.CFG 참조 (디버그 플래그)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	const PREFIX = '[SNW]';
	
	function isDebug() {
		try {
			return localStorage.getItem(SNW.CFG.LS_KEY.DEBUG) === '1';
		} catch { return false; }
	}
	
	SNW.LogUtil = {
		debug(...a) { if (isDebug()) console.debug(PREFIX, ...a); },
		info(...a) { console.info(PREFIX, ...a); },
		warn(...a) { console.warn(PREFIX, ...a); },
		error(...a) { console.error(PREFIX, ...a); }
	};
	
})(window.SNW);


/* ---- 033.util.template.js (16336 bytes) ---- */
// =========================================================
// 033.util.template.js — SNW.Tpl (페이지 HTML 템플릿)
// Layer 1 (유틸) — SNW.C, SNW.DomUtil 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    
    function tpl(strings, ...vals) {
        const el = SNW.DomUtil.html(strings, ...vals);
        if (SNW.I18n && SNW.I18n.applyTo) {
            SNW.I18n.applyTo(el);
        }
        return el;
    }
    
    SNW.Tpl = {
        tpl,
        
        // =========================================================
        // 1. Dashboard (바람 스타일 선택 UI 추가됨)
        // =========================================================
        dashboard() {
            return tpl`
                <div class="snw-dashboard">
                    <!-- 작동 모드 제어 카드 -->
                    <section class="snw-card snw-card--mode" style="grid-column: 1 / -1; margin-bottom: 16px;">
                        <h2 data-i18n="dashboard.modeTitle">작동 모드 설정</h2>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                            <span style="font-size:15px; font-weight:bold; color:var(--snw-primary);" data-slot="current-mode-text">-</span>
                            <label class="snw-switch" style="transform: scale(1.2);">
                                <input type="checkbox" id="mode-switch">
                                <span class="snw-switch__slider"></span>
                            </label>
                        </div>
                        <div style="font-size:12px; color:var(--snw-text-dim);">
                            <span style="margin-right:12px;" data-i18n="dashboard.modeSchedule">◻ 스케줄 자동 모드</span>
                            <span data-i18n="dashboard.modeProfile">◼ 프로필 수동 모드</span>
                        </div>
                    </section>
        
                    <section class="snw-card snw-card--state">
                        <h2 data-i18n="dashboard.realtimeState">실시간 상태</h2>
                        <div data-slot="badge" class="snw-state-badge"></div>
                        <div class="snw-kv"><span data-i18n="dashboard.currentWind">현재 풍속</span><b data-slot="cur-wind">-</b><span data-i18n="unit.windSpeed">m/s</span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.targetWind">목표 풍속</span><b data-slot="target-wind">-</b><span data-i18n="unit.windSpeed">m/s</span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.phase">Phase</span><b data-slot="phase">-</b></div>
                        <div class="snw-kv"><span data-i18n="dashboard.pwm">PWM</span><span data-slot="gauge"></span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.sch">스케줄</span><b data-slot="sch-name">-</b></div>
                        <div class="snw-kv"><span data-i18n="dashboard.prof">프로필</span><b data-slot="prof-name">-</b></div>
                        <div class="snw-kv"><span>AutoOff</span><b data-slot="autooff">-</b></div>
                    </section>
                    
                    <section class="snw-card snw-card--power">
                        <h2 data-i18n="dashboard.powerTitle">전원 제어</h2>
                        <div data-slot="power" class="snw-power-slot"></div>
                    </section>
                    
                    <section class="snw-card snw-card--sensor">
                        <h2 data-i18n="dashboard.sensorTitle">센서</h2>
                        <div data-slot="sensors"></div>
                    </section>
                    
                    <section class="snw-card snw-card--preset">
                        <!-- 1. 바람 스타일 선택 (상단 세그먼트 탭) -->
                        <div class="snw-style-section" style="margin-bottom: 20px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
                                <h2 style="margin:0; font-size:14px; font-weight:600;" data-i18n="dashboard.styleTitle">바람 스타일</h2>
                                <span style="font-size:11px; color:var(--snw-text-dim);">스타일 보정</span>
                            </div>
                            <div class="snw-style-selector" id="style-selector">
                                <button type="button" class="snw-style-btn" data-style="BALANCE" data-i18n="style.BALANCE">⚖ 균형</button>
                                <button type="button" class="snw-style-btn" data-style="ACTIVE" data-i18n="style.ACTIVE">⚡ 활동</button>
                                <button type="button" class="snw-style-btn" data-style="FOCUS" data-i18n="style.FOCUS">🎯 집중</button>
                                <button type="button" class="snw-style-btn" data-style="RELAX" data-i18n="style.RELAX">🍃 휴식</button>
                                <button type="button" class="snw-style-btn" data-style="SLEEP" data-i18n="style.SLEEP">🌙 수면</button>
                            </div>
                        </div>

                        <!-- 2. 자연풍 프리셋 선택 (하단 4x2 그리드) -->
                        <div class="snw-preset-section">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px;">
                                <h2 style="margin:0; font-size:14px; font-weight:600;" data-i18n="dashboard.presetTitle">자연풍 프리셋</h2>
                                <span style="font-size:11px; color:var(--snw-text-dim);">8대 자연 환경</span>
                            </div>
                            <div data-slot="presets"></div>
                        </div>
                    </section>
                    
                    <section class="snw-card snw-card--slider" style="grid-column: 1 / -1;">
                        <h2 data-i18n="dashboard.physicsTitle">바람 세부 조절 (3대 물리 제어)</h2>
                        <div style="display:flex;flex-direction:column;gap:16px;">
                            <div data-slot="intensity"></div>
                            <div data-slot="variability"></div>
                            <div data-slot="gust"></div>
                        </div>
                    </section>
                </div>`;
        },
        
        // =========================================================
        // 2. Chart
        // =========================================================
        chart() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="chart.title">실시간 물리 차트</h2>
                    <div class="snw-tabs" style="margin-bottom:12px;display:flex;gap:4px;">
                        <button type="button" class="snw-tab-btn is-active"
                                data-chart-tab="live">📊 <span data-i18n="chart.tab.live">실제 작동 중</span></button>
                        <button type="button" class="snw-tab-btn"
                                data-chart-tab="preview">🎬 <span data-i18n="chart.tab.preview">예상 파형</span></button>
                    </div>
                    <div class="snw-chart-toolbar">
                        <select data-slot="range">
                            <option value="5" data-i18n="chart.range5s">5초</option>
                            <option value="30" data-i18n="chart.range30s">30초</option>
                            <option value="120" selected data-i18n="chart.range120s">120초</option>
                        </select>
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;margin-left:8px;cursor:pointer;">
                            <input type="checkbox" data-chart-overlay>
                            <span data-i18n="chart.overlay">예상 오버레이</span>
                        </label>
                        <button data-action="export" data-i18n="chart.exportCsv">CSV</button>
                    </div>
                    <div data-slot="banner" style="display:none;padding:6px 12px;background:var(--snw-surface-2);border-radius:4px;margin-bottom:8px;font-size:12px;"></div>
                    <div data-slot="chart" class="snw-chart-area"></div>
                </section>`;
        },
        
        // =========================================================
        // 3. Settings (form-container 슬롯 추가됨)
        // =========================================================
        settings() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="settings.title">시스템 설정</h2>
                    
                    <!-- 탭 및 폼 콘텐츠가 이곳에 동적 삽입됨 -->
                    <div data-slot="form-container"></div>
                    
                    <!-- 하단 Sticky 저장 바 (240.page.settings.js에서 채움) -->
                    <div data-slot="action-bar"></div>
                </section>`;
        },
        
        // =========================================================
        // 4. Simulation
        // =========================================================
        simulation() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.simulation">시뮬레이션 상세 설정</h2>
                    <div data-slot="form" class="snw-form" data-i18n="common.loading">로딩 중...</div>
                </section>`;
        },
        
        // =========================================================
        // 5. Schedule
        // =========================================================
        schedule() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="scheduler.title">스케줄 예약</h2>
                    <div data-slot="list"></div>
                </section>`;
        },
        
        // =========================================================
        // 6. Profiles
        // =========================================================
        profiles() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="profile.title">사용자 프로필</h2>
                    <div data-slot="list"></div>
                </section>`;
        },
        
        // =========================================================
        // 7. Network
        // =========================================================
        network() {
            return tpl`
            <div style="display:flex;flex-direction:column;gap:16px;">
                <section class="snw-card">
                    <h2 data-i18n="network.title">네트워크 상태</h2>
                    <div data-slot="wifi-state"></div>
                </section>
                <section class="snw-card">
                    <h2 data-i18n="network.wifiConfig">Wi-Fi 설정 (AP / STA)</h2>
                    <div data-slot="wifi-config" class="snw-form"></div>
                </section>
                <section class="snw-card">
                    <h2 data-i18n="network.timeConfig">시간 설정</h2>
                    <div data-slot="time-config" class="snw-form"></div>
                </section>
            </div>`;
        },
        
        // =========================================================
        // 8. Sensors
        // =========================================================
        sensors() {
            return tpl`
            <div style="display:flex;flex-direction:column;gap:16px;">
                <section class="snw-card">
                    <h2 data-i18n="sensors.title">실시간 센서 상태</h2>
                    <div class="snw-sensor-cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
                        <div class="snw-sensor-card"><span style="font-size:24px;">🌡</span><span style="font-size:10px;" data-i18n="sensors.temp">온도</span><span class="snw-sensor-card__val" data-slot="sensor-temp">--</span></div>
                        <div class="snw-sensor-card"><span style="font-size:24px;">💧</span><span style="font-size:10px;" data-i18n="sensors.hum">습도</span><span class="snw-sensor-card__val" data-slot="sensor-hum">--</span></div>
                        <div class="snw-sensor-card"><span style="font-size:24px;">👤</span><span style="font-size:10px;" data-i18n="sensors.motion">인체감지</span><span class="snw-sensor-card__val" data-slot="sensor-motion">--</span></div>
                    </div>
                    <div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="feed-pir" data-i18n="sensors.feedPir">PIR 강제 감지 테스트</button></div>
                </section>
                <section class="snw-card">
                    <h2 data-i18n="sensors.motionConfig">모션 로직 설정 (cfg_motion)</h2>
                    <div data-slot="motion-config" class="snw-form"></div>
                </section>
            </div>`;
        },
        
        // =========================================================
        // 9. Diagnostics
        // =========================================================
        diagnostics() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="diagnostics.title">시스템 진단 및 메트릭</h2>
                    <div data-slot="panel"></div>
                    <div class="snw-toolbar" style="margin-top:16px;display:flex;gap:8px;">
                        <button type="button" class="snw-btn" data-action="show-config" data-i18n="diagnostics.allJson">전체 설정 JSON</button>
                        <button type="button" class="snw-btn snw-btn-primary" data-action="save-dirty" data-i18n="diagnostics.saveDirty">Dirty 설정 저장</button>
                    </div>
                </section>`;
        },
        
        // =========================================================
        // 10. Logs
        // =========================================================
        logs() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.logs">시스템 로그</h2>
                    <div data-slot="log"></div>
                </section>`;
        },
        
        // =========================================================
        // 11. Firmware
        // =========================================================
        firmware() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="firmware.title">펌웨어 관리</h2>
                    <div data-slot="form"></div>
                </section>`;
        },
        
        // =========================================================
        // 12. AI
        // =========================================================
        ai() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="ai.title">AI 어시스턴트</h2>
                    <div data-slot="chat"></div>
                </section>`;
        },
        
        // =========================================================
        // 13. Info
        // =========================================================
        info() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.info">정보</h2>
                    <div data-slot="panel"></div>
                </section>`;
        },
        
        // =========================================================
        // 14. WindProfile
        // =========================================================
        windprofile() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="windprofile.title">바람 프리셋 관리</h2>
                    <div data-slot="list"></div>
                </section>`;
        }
    };
})(window.SNW);


/* ---- 034.util.toast.js (4888 bytes) ---- */
// =========================================================
// 034.util.toast.js — ToastUtil, ErrorHandler, DebounceUtil
// Layer 1 (유틸) — SNW.C, SNW.CFG, SNW.LogUtil 참조
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // =====================================================
    // ToastUtil
    // =====================================================
    SNW.ToastUtil = {
        _host: null,

        _ensure() {
            if (this._host) return this._host;
            this._host = document.getElementById('toast-host');
            if (!this._host) {
                this._host = document.createElement('div');
                this._host.id = 'toast-host';
                this._host.className = 'snw-toast-host';
                document.body.appendChild(this._host);
            }
            return this._host;
        },

        show(msg, type = 'info', ms = null) {
            const host = this._ensure();
            const duration = ms != null ? ms : SNW.CFG.UI.TOAST_DEFAULT_MS;

            const t = document.createElement('div');
            t.className = `snw-toast snw-toast--${type}`;
            t.textContent = String(msg);
            host.appendChild(t);

            setTimeout(() => t.classList.add('snw-toast--out'), Math.max(0, duration - 300));
            setTimeout(() => t.remove(), duration);
        },

        success(m, t = SNW.CFG.UI.TOAST_SUCCESS_MS) { this.show(m, 'success', t); },
        warn(m, t = SNW.CFG.UI.TOAST_DEFAULT_MS)     { this.show(m, 'warn',    t); },
        error(m, t = SNW.CFG.UI.TOAST_ERROR_MS)      { this.show(m, 'error',   t); },
        info(m, t = SNW.CFG.UI.TOAST_DEFAULT_MS)     { this.show(m, 'info',    t); }
    };

    // =====================================================
    // DebounceUtil (슬라이더/검색 공용)
    // =====================================================
    SNW.DebounceUtil = {
        debounce(fn, waitMs) {
            let timer = null;
            return function (...args) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    timer = null;
                    fn.apply(this, args);
                }, waitMs);
            };
        },
        throttle(fn, maxWaitMs) {
            let last = 0, timer = null;
            return function (...args) {
                const now = Date.now();
                const remain = maxWaitMs - (now - last);
                if (remain <= 0) {
                    last = now;
                    fn.apply(this, args);
                } else if (!timer) {
                    timer = setTimeout(() => {
                        last = Date.now();
                        timer = null;
                        fn.apply(this, args);
                    }, remain);
                }
            };
        }
    };

    // =====================================================
    // ErrorHandler (표준 에러 처리)
    // =====================================================
    SNW.ErrorHandler = {
        handle(err, context = 'unknown') {
            SNW.LogUtil.error(`[${context}]`, err);

            if (!err) {
                SNW.ToastUtil.error(SNW.I18n.t('msg.unknown'));
                return;
            }

            // ApiError 판정 (SNW.Api.ApiError)
            if (typeof err.status === 'number') {
                switch (err.status) {
                    case SNW.C.HTTP.UNAUTHORIZED:
                        SNW.ToastUtil.error(SNW.I18n.t('msg.apiKeyRequired'));
                        break;
                    case SNW.C.HTTP.CONFLICT:
                        SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadPending'));
                        break;
                    case SNW.C.HTTP.TIMEOUT:
                        SNW.ToastUtil.warn(SNW.I18n.t('msg.timeout'));
                        break;
                    case SNW.C.HTTP.SERVER_ERROR:
                        SNW.ToastUtil.error(SNW.I18n.t('msg.unknown') + ': ' + (err.message || '500'));
                        break;
                    default:
                        SNW.ToastUtil.error(err.message || SNW.I18n.t('msg.unknown'));
                }
                return;
            }

            // 네트워크 오류 (fetch 실패)
            if (err.name === 'TypeError' || err.message === 'network') {
                SNW.ToastUtil.error(SNW.I18n.t('msg.networkError'));
                return;
            }

            SNW.ToastUtil.error(err.message || SNW.I18n.t('msg.unknown'));
        },

        /** async 함수 래퍼 */
        wrap(fn, context = 'unknown') {
            return async (...args) => {
                try { return await fn(...args); }
                catch (e) { this.handle(e, context); throw e; }
            };
        }
    };

})(window.SNW);


/* ---- 035.util.feedback.js (5935 bytes) ---- */
// =========================================================
// 035.util.feedback.js — SNW.Feedback (정량적 물리 피드백 헬퍼)
// Layer 1 (유틸) — 0203_007 설계 기반
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.Feedback = {
        /**
         * 바람 강도 (Intensity 0~100%) 실시간 정량 가이드
         */
        getIntensityGuide(val) {
            const isEn = (SNW.I18n && SNW.I18n.getLang() === 'en');
            const v = Number(val) || 0;
            if (v <= 0) {
                return {
                    title: isEn ? '0.0 m/s · Fan Stopped' : '0.0 m/s · 팬 정지',
                    desc: isEn ? 'Fan motor is in standby mode.' : '팬 모터가 대기 상태입니다.'
                };
            }
            if (v <= 30) {
                const speed = (0.5 + (v / 30) * 1.0).toFixed(1);
                return {
                    title: isEn ? `Approx ${speed} m/s (Gentle / Sleep)` : `체감 약 ${speed} m/s (초미풍 · 수면풍)`,
                    desc: isEn
                        ? 'Gentle breeze comparable to fanning (ideal for sleep or infants, quiet <25dB)'
                        : '부채질 수준의 고요한 미풍 (수면 시 또는 영유아에 적합, 저소음 <25dB)'
                };
            }
            if (v <= 70) {
                const speed = (1.5 + ((v - 30) / 40) * 2.0).toFixed(1);
                return {
                    title: isEn ? `Approx ${speed} m/s (Natural Breeze · Stage 1-2)` : `체감 약 ${speed} m/s (표준 자연풍 · 1~2단)`,
                    desc: isEn
                        ? 'Pleasant fluttering breeze (most comfortable for daily living and relaxation)'
                        : '나뭇잎이 살랑거리는 기분 좋은 산들바람 (일상 생활 및 휴식에 가장 쾌적)'
                };
            }
            const speed = (3.5 + ((v - 70) / 30) * 2.0).toFixed(1);
            return {
                title: isEn ? `Approx ${speed} m/s (Strong Wind · Stage 3-4)` : `체감 약 ${speed} m/s (강풍 · 급속 환기 3~4단)`,
                desc: isEn
                    ? 'Cool open-window breeze (ideal after workouts or quick cooling)'
                    : '창문을 열었을 때 부는 시원한 야외 바람 (운동 직후나 빠른 환기에 적합)'
            };
        },

        /**
         * 바람 변동성 (Variability 0~100%) 실시간 정량 가이드
         */
        getVariabilityGuide(val) {
            const isEn = (SNW.I18n && SNW.I18n.getLang() === 'en');
            const v = Number(val) || 0;
            if (v <= 30) {
                return {
                    title: isEn ? 'Transition ~10-15s (Delta <10%)' : '풍속 전환 약 10~15초 소요 (변화폭 <10%)',
                    desc: isEn
                        ? 'Wind changes very slowly, maintaining a smooth and steady flow.'
                        : '바람 세기가 천천히 바뀌어 체감상 거의 일정하고 부드럽습니다.'
                };
            }
            if (v <= 70) {
                return {
                    title: isEn ? 'Transition ~5-8s (Delta ±30%)' : '풍속 전환 약 5~8초 소요 (변화폭 ±30%)',
                    desc: isEn
                        ? 'Rhythmic fluctuation like a forest breeze every 5-8s.'
                        : '숲속 바람처럼 5~8초 간격으로 오르내리며 자연스러운 리듬감을 줍니다.'
                };
            }
            return {
                title: isEn ? 'Transition ~2-4s (Delta up to ±60%)' : '풍속 전환 약 2~4초 소요 (변화폭 최대 ±60%)',
                desc: isEn
                    ? 'Rapid 2-4s velocity changes creating dynamic coastal or valley winds.'
                    : '2~3초 만에 풍속이 급격히 전환되어 계곡이나 해변처럼 역동적입니다.'
            };
        },

        /**
         * 돌풍 빈도 (Gust Frequency 0~100%) 실시간 정량 가이드
         */
        getGustGuide(val) {
            const isEn = (SNW.I18n && SNW.I18n.getLang() === 'en');
            const v = Number(val) || 0;
            if (v <= 0) {
                return {
                    title: isEn ? 'No Gust (Base flow only)' : '돌풍 없음 (기본 기류만 유지)',
                    desc: isEn
                        ? 'Maintains gentle airflow without sudden gusts.'
                        : '돌풍 없이 평온한 기류만 부드럽게 유지됩니다.'
                };
            }
            if (v <= 20) {
                return {
                    title: isEn ? 'Inflow every ~60-120s (1-2 min)' : '약 60~120초(1~2분)에 1회 유입',
                    desc: isEn
                        ? 'Rare gentle gusts suitable for sleep or quiet focus.'
                        : '가벼운 돌풍이 드물게 지나가 수면이나 독서에 방해되지 않습니다.'
                };
            }
            if (v <= 60) {
                return {
                    title: isEn ? 'Inflow every ~30-50s (Peak ×1.5~2.0)' : '약 30~50초에 1회 유입 (순간 풍속 ×1.5~2.0배)',
                    desc: isEn
                        ? 'Refreshing bursts every 30-50s relieving stuffiness.'
                        : '30~45초마다 시원한 바람이 훅 불어와 답답함을 해소해 줍니다.'
                };
            }
            return {
                title: isEn ? 'Inflow every ~15-25s (Peak up to ×2.5)' : '약 15~25초에 1회 유입 (순간 풍속 최대 ×2.5배)',
                desc: isEn
                    ? 'Frequent energetic gusts giving an invigorating hilltop sensation.'
                    : '15~20초마다 강력한 돌풍이 연속 유입되어 야외 언덕에 있는 듯 상쾌합니다.'
            };
        }
    };
})(window.SNW);


/* ---- 040.api.js (17430 bytes) ---- */
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
	// Core fetch (_fetch)
	// =====================================================
	async function _fetch(path, opts = {}) {
		// ======================================================
		// [OFFLINE 방어막] 오프라인일 때 정확한 데이터 반환
		// ======================================================
		if (window.SNW_OFFLINE) {
			console.log('[Offline Fetch] 요청 가로채기:', path);
			const rt = (SNW.Offline && SNW.Offline._runtime) ? SNW.Offline._runtime : {};
			const cache = (SNW.Offline && SNW.Offline._cache) ? SNW.Offline._cache : {};

			// Wi-Fi 상태
			if (path.includes('/wifi/state')) {
				return {
					wifi: {
						state: {
							mode: 2, mode_name: 'AP+STA (Offline)', status: 'CONNECTED',
							ssid: '(offline)', ip: '192.168.4.1', mac: 'AA:BB:CC:DD:EE:FF',
							rssi: -50, hostname: 'naturewind-offline', connected: false,
							timeSynced: false, reconnectAttempts: 0
						}
					}
				};
			}
			// Wi-Fi 설정 (cache 우선)
			if (path.includes('/wifi/config')) {
				return cache.wifi || {
					wifi: {
						wifiMode: 2, ap: { ssid: "NatureWind", pass: "2540" },
						sta: [{ ssid: "HomeWiFi_5G", pass: "12345678" }, { ssid: "Office_AP", pass: "admin1234" }]
					}
				};
			}
			if (path.includes('/wifi/scan')) {
				return {
					wifi: {
						scan: [
							{ ssid: "TestWiFi1", rssi: -45, enc: "WPA2" },
							{ ssid: "TestWiFi2", rssi: -70, enc: "OPEN" }
						]
					}
				};
			}
			// 시스템 (cache 우선)
			if (path.includes('/system') && (opts.method || 'GET') === 'GET') {
				return cache.system || {};
			}
			// 상태
			if (path.includes('/state')) {
				return { control: rt.control || {}, sim: rt.sim || {}, runtime: rt.runtime || {} };
			}
			if (path.includes('/motion')) {
				return cache.motion || { motion: {} };
			}
			if (path.includes('/schedules')) return cache.schedules || { schedules: [] };
			if (path.includes('/user_profiles')) return cache.userProfiles || { userProfiles: { profiles: [] } };
			if (path.includes('/windDict') || path.includes('/windProfile')) return (cache.windDict && cache.windDict.windDict) ? cache.windDict.windDict : (cache.windDict || { presets: [], styles: [] });
			if (path.includes('/logs')) return { logs: [{ ts: 0, lv: 3, msg: '[Offline]' }] };
			if (path.includes('/diag')) return { heap: 120000, fs_used: 160000, fs_total: 1000000 };
			if (path.includes('/version')) return { fw: 'FW_Ver_2.0.3' };
			if (path.includes('/metrics')) return { metrics: {} };
			if (path.includes('/control/timer')) {
				if (opts.method === 'DELETE') return { success: true, active: false };
				if (opts.method === 'POST') return { success: true, active: true, remainSec: ((opts.body && opts.body.minutes) || 30) * 60 };
				return { active: false, remainSec: 0, durationMin: 0 };
			}
			if (path.includes('/control/override')) {
				if (opts.body && rt.sim) {
					if (opts.body.windIntensity != null) rt.sim.intensity = opts.body.windIntensity;
					if (opts.body.windVariability != null) rt.sim.variability = opts.body.windVariability;
					if (opts.body.gustFrequency != null) rt.sim.gustFreq = opts.body.gustFrequency;
				}
				return { result: 'ok', updated: true };
			}
			if (path.includes('/config')) return cache;

			return { result: 'ok', updated: true };
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
		overrideParams(body) {
			// ======================================================
			// [N-3] Deprecated: /control/override 라우트 부재(404) 해소
			//  - /simulation + override 객체로 변환하여 전송
			// ======================================================
			if (SNW.LogUtil) {
				SNW.LogUtil.warn('[API] overrideParams is deprecated. Use patchSim({override}) instead.');
			}
			const ovr = { enabled: true };
			if (body && body.windIntensity != null) ovr.windIntensity = body.windIntensity;
			if (body && body.windVariability != null) ovr.windVariability = body.windVariability;
			if (body && body.gustFrequency != null) ovr.gustFrequency = body.gustFrequency;
			return _fetch(SNW.CFG.API.simulation, { method: 'POST', body: { sim: { override: ovr } } });
		},
		ackEvent() {
			return _fetch(SNW.CFG.API.ack, { method: 'POST' });
		},
		setMode(isProfileMode) {
			return _fetch(SNW.CFG.API.controlMode, { method: 'POST', body: { profileMode: !!isProfileMode } });
		},
		setControlMode(isProfileMode) {
			return this.setMode(isProfileMode);
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
			return _fetch(`${SNW.CFG.API.monitor}?type=${type}&range=${range}`);
		},
		getPastEvents(days) {
			return _fetch(`${SNW.CFG.API.monitor}/events?days=${days || 7}`);
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
			return this.getMonitorTimeline(since);
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
		selectProfile(id) { return _fetch(SNW.CFG.API.profileSelect, { method: 'POST', body: { id } }); },
		stopProfile() { return _fetch(SNW.CFG.API.profileStop, { method: 'POST' }); },

		// --- Session (Stage 5 신규: startSession 단일화) ---
		startSession({ type, payload = {}, trigger } = {}) {
			let finalTrigger = trigger;
			if (!finalTrigger) {
				if (type === 'AUTO_FULL')        finalTrigger = 'MANUAL_AUTO_FULL';
				else if (type === 'AUTO_SELECT') finalTrigger = 'MANUAL_AUTO_SELECT';
				else                             finalTrigger = 'MANUAL';
			}
			return _fetch(SNW.CFG.API.sessionStart, {
				method: 'POST',
				body: { type, payload, trigger: finalTrigger }
			});
		},
		startPlaylist(profileId) {
			return this.startSession({ type: 'PLAYLIST', payload: { profileId } });
		},
		startPreset(presetCode, styleCode) {
			return this.startSession({ type: 'PRESET', payload: { presetCode, styleCode } });
		},
		startFixed(percent) {
			return this.startSession({ type: 'FIXED', payload: { percent } });
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
		gemini(body) {
			return _fetch(SNW.CFG.API.gemini, { method: 'POST', body, timeoutMs: SNW.CFG.TIMEOUT_MS.GEMINI });
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


/* ---- 050.ws.js (5071 bytes) ---- */
// =========================================================
// 050.ws.js — SNW.WsManager (WebSocket 5채널)
// Layer 2 (서비스) — Layer 0~1 참조
//  - exponential backoff (1s → 30s)
//  - state 채널: 3회 연속 실패 시 REST 폴링 자동 전환
//  - 채널별 onMessage/onOpen/onClose 구독
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// =====================================================
	// WsClient (채널별 1개)
	// =====================================================
	class WsClient {
		constructor(channel) {
			this.channel = channel;
			this.ws = null;
			this.attempt = 0;
			this.failCount = 0;
			this._closed = false;
			
			this._subs = new Set();
			this._openHandlers = new Set();
			this._closeHandlers = new Set();
			this._fallbackTimer = null;
		}
		
		url() {
			const key = SNW.Api.getApiKey();
			const q = key ? `?apiKey=${encodeURIComponent(key)}` : '';
			const proto = (location.protocol === 'https:') ? 'wss' : 'ws';
			return `${proto}://${location.host}${SNW.CFG.WS_PATH[this.channel]}${q}`;
		}
		
		connect() {
			// ======================================================
			// [OFFLINE] 오프라인일 때는 WS 연결 시도하지 않음
			// ======================================================
			if (window.SNW_OFFLINE) {
				this._openHandlers.forEach(h => { try { h(); } catch {} }); // 연결된 것처럼 처리
				return;
			}
			
			if (this._closed) return;
			
			try {
				this.ws = new WebSocket(this.url());
			} catch (e) {
				SNW.LogUtil.warn(`WS[${this.channel}] 생성 실패`, e);
				return this._scheduleReconnect();
			}
			
			this.ws.onopen = () => {
				SNW.LogUtil.info(`WS[${this.channel}] 연결`);
				this.attempt = 0;
				this.failCount = 0;
				this._stopFallback();
				this._openHandlers.forEach(h => { try { h(); } catch {} });
			};
			
			this.ws.onmessage = (ev) => {
				let data;
				try { data = JSON.parse(ev.data); }
				catch { return; }
				this._subs.forEach(fn => { try { fn(data); } catch (e) { SNW.LogUtil.error(e); } });
			};
			
			this.ws.onerror = () => {
				SNW.LogUtil.warn(`WS[${this.channel}] 에러`);
			};
			
			this.ws.onclose = () => {
				if (this._closed) return;
				SNW.LogUtil.warn(`WS[${this.channel}] 종료`);
				
				this._closeHandlers.forEach(h => { try { h(); } catch {} });
				
				this.failCount++;
				if (this.failCount >= SNW.CFG.WS_RECONNECT.FAIL_THRESHOLD) {
					this._startFallback();
				}
				this._scheduleReconnect();
			};
		}
		
		_scheduleReconnect() {
			if (this._closed) return;
			const arr = SNW.CFG.WS_RECONNECT.BACKOFF_MS;
			const wait = arr[Math.min(this.attempt, arr.length - 1)];
			this.attempt++;
			SNW.LogUtil.debug(`WS[${this.channel}] ${wait}ms 후 재연결`);
			setTimeout(() => this.connect(), wait);
		}
		
		// -------------------------------------------------
		// REST 폴백 (state 채널만, 2초 주기)
		// -------------------------------------------------
		_startFallback() {
			if (this.channel !== 'state') return;
			if (this._fallbackTimer) return;
			
			SNW.LogUtil.warn(`WS[${this.channel}] REST 폴백 시작 (${SNW.CFG.WS_RECONNECT.FALLBACK_POLL_MS}ms)`);
			this._fallbackTimer = setInterval(async () => {
				try {
					const data = await SNW.Api.getState();
					this._subs.forEach(fn => { try { fn(data); } catch {} });
				} catch (e) { SNW.LogUtil.warn('폴링 실패', e); }
			}, SNW.CFG.WS_RECONNECT.FALLBACK_POLL_MS);
		}
		
		_stopFallback() {
			if (this._fallbackTimer) {
				clearInterval(this._fallbackTimer);
				this._fallbackTimer = null;
				SNW.LogUtil.info(`WS[${this.channel}] REST 폴백 중단`);
			}
		}
		
		onMessage(fn) { this._subs.add(fn); return () => this._subs.delete(fn); }
		onOpen(fn) { this._openHandlers.add(fn); return () => this._openHandlers.delete(fn); }
		onClose(fn) { this._closeHandlers.add(fn); return () => this._closeHandlers.delete(fn); }
		
		close() {
			this._closed = true;
			this._stopFallback();
			if (this.ws) {
				try { this.ws.close(); } catch {}
				this.ws = null;
			}
		}
	}
	
	// =====================================================
	// WsManager (채널별 싱글톤)
	// =====================================================
	SNW.WsManager = {
		_clients: {},
		
		get(channel) {
			if (!SNW.C.WS_CHANNEL.includes(channel)) {
				SNW.LogUtil.warn(`WsManager.get: 알 수 없는 채널 "${channel}"`);
				return null;
			}
			if (!this._clients[channel]) {
				const c = new WsClient(channel);
				this._clients[channel] = c;
				c.connect();
			}
			return this._clients[channel];
		},
		
		/** 사용자 레벨에 따른 초기 채널 세트 연결 */
		initByLevel() {
			this.get('state');
			this.get('summary');
			this.get('metrics');
			if (SNW.LevelUtil && SNW.LevelUtil.atLeast('L2')) this.get('chart');
			if (SNW.LevelUtil && SNW.LevelUtil.atLeast('L3')) this.get('log');
		},
		
		closeAll() {
			Object.values(this._clients).forEach(c => c.close());
			this._clients = {};
		}
	};
	
})(window.SNW);


/* ---- 060.store.js (5527 bytes) ---- */
// =========================================================
// 060.store.js — SNW.Store + SNW.StoreBridge
// Layer 2 (서비스) — Layer 0~1 참조
//  - 경량 Observable Store (watch/subscribe)
//  - WS state 채널 → Store 자동 브리지
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
	'use strict';

	// =====================================================
	// Store (Observable)
	// =====================================================
	class Store {
		constructor(initial) {
			this._state = Object.assign({}, initial);
			this._subs = new Set();
		}

		get() { return this._state; }

		subscribe(fn) {
			this._subs.add(fn);
			return () => this._subs.delete(fn);
		}

		/** patch(얕은 병합) 후 구독자 알림 */
		set(patch) {
			const prev = this._state;
			this._state = Object.assign({}, prev, patch);
			this._subs.forEach(fn => {
				try { fn(this._state, prev); }
				catch (e) { SNW.LogUtil.error('[Store]', e); }
			});
		}

		/** 특정 키만 관찰 */
		watch(key, fn) {
			let last = this._state[key];
			return this.subscribe((s) => {
				if (s[key] !== last) {
					const prev = last;
					last = s[key];
					fn(s[key], prev);
				}
			});
		}
	}

	// =====================================================
	// 전역 싱글톤 Store
	// =====================================================
	SNW.Store = new Store({
		// 서버 상태
		control: null, // /state.control
		sim: null, // /state.sim
		time: null, // control.time
		system: null, // control.system (uptimeMs/epochNowMs)
		session: null, // [v0203 Stage 3] Session 스냅샷

		// [Stage 10 P0-4] Comfort 자동 모드
		autoComfortEnabled: false,
		autoComfortLastEvalMs: 0,

		// [Stage 10.1 Option A] 하드웨어 타이머 상태
		hardwareTimerActive: false,
		hardwareTimerRemainSec: 0,

		// 파생 상태
		lastUpdateMs: 0,
		connection: 'offline', // 'online' | 'offline' | 'polling'
		fsmState: 0,
		fsmReason: 0,

		// 사용자 컨텍스트
		level: (SNW.LevelUtil && SNW.LevelUtil.current) ? SNW.LevelUtil.current() : 'L1'
	});

	// =====================================================
	// 세션 정규화 헬퍼 (R-1)
	// =====================================================
	const SESSION_TYPE_NAMES = ['NONE', 'PLAYLIST', 'PRESET', 'FIXED'];
	const SESSION_TRIGGER_NAMES = ['NONE', 'MANUAL', 'SCHEDULE', 'AUTO_COMFORT'];

	function normalizeSession(s) {
		if (!s || typeof s !== 'object') {
			return {
				type: 0,
				typeName: 'NONE',
				trigger: 0,
				triggerName: 'NONE',
				state: 'IDLE',
				active: false,
				name: '',
				presetCode: '',
				styleCode: '',
				elapsedSec: 0,
				remainSec: 0,
				totalSec: 0
			};
		}

		let typeNum = 0;
		let typeName = 'NONE';
		if (typeof s.type === 'number') {
			typeNum = s.type;
			typeName = SESSION_TYPE_NAMES[typeNum] || (s.typeName || 'NONE');
		} else if (typeof s.type === 'string') {
			typeName = s.type.toUpperCase();
			typeNum = SESSION_TYPE_NAMES.indexOf(typeName);
			if (typeNum < 0) typeNum = 0;
		} else if (s.typeName) {
			typeName = String(s.typeName).toUpperCase();
			typeNum = SESSION_TYPE_NAMES.indexOf(typeName);
			if (typeNum < 0) typeNum = 0;
		}

		let trigNum = 0;
		let trigName = 'NONE';
		if (typeof s.trigger === 'number') {
			trigNum = s.trigger;
			trigName = SESSION_TRIGGER_NAMES[trigNum] || 'NONE';
		} else if (typeof s.trigger === 'string') {
			trigName = s.trigger.toUpperCase();
			trigNum = SESSION_TRIGGER_NAMES.indexOf(trigName);
			if (trigNum < 0) trigNum = 0;
		}

		let stateStr = 'IDLE';
		if (typeof s.state === 'string') {
			stateStr = (s.state.toUpperCase() === 'RUNNING') ? 'ACTIVE' : s.state.toUpperCase();
		} else if (typeof s.state === 'number') {
			stateStr = (s.state === 1) ? 'PAUSED' : ((s.state === 2) ? 'COMPLETED' : 'ACTIVE');
		}

		const activeBool = Boolean(s.active && typeName !== 'NONE' && stateStr !== 'COMPLETED');

		return Object.assign({}, s, {
			type: typeNum,
			typeName: typeName,
			trigger: trigNum,
			triggerName: trigName,
			state: stateStr,
			active: activeBool
		});
	}

	// =====================================================
	// StoreBridge (WS → Store)
	// =====================================================
	SNW.StoreBridge = {
		_started: false,
		_unsubs: [],
		normalizeSession: normalizeSession,

		start() {
			if (this._started) return;
			this._started = true;

			const wsState = SNW.WsManager.get('state');
			if (!wsState) {
				SNW.LogUtil.warn('[StoreBridge] state 채널 없음');
				return;
			}

			const unsubMsg = wsState.onMessage((data) => {
				const ctl = (data && data.control) || null;
				const sim = (data && data.sim) || null;

				const patch = {
					lastUpdateMs: Date.now(),
					connection: 'online'
				};

				if (ctl) {
					patch.control = ctl;
					patch.time = ctl.time || null;
					patch.system = ctl.system || null;
					patch.fsmState = (ctl.stateCode != null) ? ctl.stateCode : 0;
					patch.fsmReason = (ctl.reasonCode != null) ? ctl.reasonCode : 0;
					patch.session = normalizeSession(ctl.session); // [v0203 R-1] 정규화 적용
				}
				if (sim) {
					patch.sim = sim;
				}

				SNW.Store.set(patch);
			});

			wsState.onOpen(() => {
				SNW.Store.set({ connection: 'online' });
			});

			wsState.onClose(() => {
				SNW.Store.set({ connection: 'offline' });
			});

			this._unsubs.push(unsubMsg);
		},

		stop() {
			this._unsubs.forEach(fn => fn());
			this._unsubs = [];
			this._started = false;
		}
	};

})(window.SNW);


/* ---- 070.router.js (10465 bytes) ---- */
// =========================================================
// core/070.router.js — Fresh Start 라우터
// Layer 2 (Service) — Alias/리다이렉트 완전 배제
// 화이트리스트 외 → /home 렌더링 (URL 유지, location.hash 재대입 없음)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // [Phase 1] Fresh Start — 이전 URL 완전 폐기
    //  - ROUTES 화이트리스트 외 모든 해시 → '/home' fallback
    //  - location.hash 재대입 최소화 (접근 거부만 예외)
    //  - 뒤로가기 히스토리 오염 0
    // ═══════════════════════════════════════════════════════════
    const ROUTES = {
        // ─── L1 일상 (홈 3탭) ───
        '/home':                    { page: 'Dashboard', params: { tab: 'control' }, level: 'L1' },
        '/home/control':            { page: 'Dashboard', params: { tab: 'control' }, level: 'L1' },
        '/home/env':                { page: 'Dashboard', params: { tab: 'env' },     level: 'L1' },
        '/home/preset':             { page: 'Dashboard', params: { tab: 'preset' },  level: 'L1' },

        // ─── L2 바람 만들기 (4탭) ───
        '/wind':                    { page: 'Automation', params: { tab: 'studio' },     level: 'L2' },
        '/wind/studio':             { page: 'Automation', params: { tab: 'studio' },     level: 'L2' },
        '/wind/simulation':         { page: 'Automation', params: { tab: 'simulation' }, level: 'L2' },
        '/wind/playlist':           { page: 'Automation', params: { tab: 'playlist' },   level: 'L2' },
        '/wind/presets':            { page: 'Windprofile', level: 'L3' },

        // ─── L2 자동화 (3탭) ───
        '/automation':              { page: 'Automation', params: { tab: 'schedule' }, level: 'L2' },
        '/automation/schedule':     { page: 'Automation', params: { tab: 'schedule' }, level: 'L2' },
        '/automation/timer':        { page: 'Automation', params: { tab: 'timer' },    level: 'L2' },
        '/automation/rules':        { page: 'Automation', params: { tab: 'rules' },    level: 'L2' },

        // ─── L2 AI ───
        '/ai':                      { page: 'AI', level: 'L2' },

        // ─── L2 모니터 (4탭) ───
        '/monitor':                 { page: 'Monitor', level: 'L2' },
        '/monitor/chart':           { page: 'Chart',   level: 'L2' },
        '/monitor/sensors':         { page: 'Sensors', level: 'L2' },
        '/monitor/history':         { page: 'Monitor', level: 'L2' },
        '/monitor/logs':            { page: 'Logs',    level: 'L3' },

        // ─── L3 설정 (5탭) ───
        '/settings':                { page: 'Settings',    params: { tab: 'general' },  level: 'L2' },
        '/settings/general':        { page: 'Settings',    params: { tab: 'general' },  level: 'L2' },
        '/settings/network':        { page: 'Network',     params: { tab: 'network' },  level: 'L3' },
        '/settings/hardware':       { page: 'Settings',    params: { tab: 'hardware' }, level: 'L2' },
        '/settings/firmware':       { page: 'Firmware',                                 level: 'L4' },
        '/settings/diagnostics':    { page: 'Diagnostics',                              level: 'L4' },
    };

    // ─── 사이드바 그룹 (3개 최상위 그룹) ───
    const NAV_GROUPS = [
        {
            key: 'nav.groupDaily',
            items: [
                { path: '/home', key: 'nav.home', icon: '🏠', minLevel: 'L1' },
            ]
        },
        {
            key: 'nav.groupControl',
            items: [
                { path: '/wind',       key: 'nav.wind',       icon: '🌬️', minLevel: 'L2' },
                { path: '/automation', key: 'nav.automation', icon: '⚙️', minLevel: 'L2' },
                { path: '/ai',         key: 'nav.ai',         icon: '✨', minLevel: 'L2' },
                { path: '/monitor',    key: 'nav.monitor',    icon: '📊', minLevel: 'L2' },
            ]
        },
        {
            key: 'nav.groupSystem',
            items: [
                { path: '/settings', key: 'nav.settings', icon: '🔧', minLevel: 'L2' },
            ]
        },
    ];

    let currentPage = null;
    let currentPath = null;
    let _dispatching = false;

    function capitalize(s) {
        if (s === 'ai') return 'AI';
        if (s === 'windprofile') return 'Windprofile';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ═══════════════════════════════════════════════════════════
    // Fresh Start: 화이트리스트 외 → '/home' (URL 유지)
    // ═══════════════════════════════════════════════════════════
    function parseHash() {
        const raw = location.hash.replace(/^#/, '').split('?')[0] || '/home';
        return ROUTES[raw] ? raw : '/home';
    }

    function _clearMain() {
        const main = document.getElementById('snw-main');
        if (!main) return null;
        main.innerHTML = '';
        return main;
    }

    function _showLoading(main) {
        if (!main) return;
        main.appendChild(SNW.DomUtil.html`<div class="snw-loading">${SNW.I18n.t('common.loading')}</div>`);
    }

    function _showError(main, msg) {
        if (!main) return;
        main.innerHTML = '';
        main.appendChild(SNW.DomUtil.html`<div class="snw-error">${msg}</div>`);
    }

    function _closeSidebarOnMobile() {
        if (window.innerWidth < 1024) {
            document.body.classList.remove('snw-sidebar-open');
        }
    }

    async function dispatch() {
        if (_dispatching) return;

        const path = parseHash();
        const originalHash = location.hash.replace(/^#/, '').split('?')[0] || '/home';

        if (originalHash === currentPath) return;

        _dispatching = true;
        try {
            _closeSidebarOnMobile();

            const route = ROUTES[path];
            if (!SNW.LevelUtil.atLeast(route.level)) {
                SNW.ToastUtil.warn(SNW.I18n.t('msg.accessDenied'));
                // 접근 거부만 예외적으로 리다이렉트
                location.hash = '/home';
                return;
            }

            if (currentPage && typeof currentPage.unmount === 'function') {
                try {
                    const canLeave = currentPage.unmount();
                    if (canLeave === false) return;
                } catch (e) {
                    SNW.LogUtil.error('[router] unmount failed', e);
                }
            }

            if (SNW.Banner) SNW.Banner.hide();

            currentPage = null;
            currentPath = null;
            const main = _clearMain();
            _showLoading(main);

            const PageClass = (SNW.Page && SNW.Page[capitalize(route.page)]) || null;
            if (!PageClass) {
                _showError(main, `Page not implemented: ${route.page}`);
                return;
            }

            const params = Object.assign({}, route.params || {});
            const qIdx = location.hash.indexOf('?');
            if (qIdx >= 0) {
                const qs = new URLSearchParams(location.hash.slice(qIdx + 1));
                for (const [k, v] of qs.entries()) params[k] = v;
            }

            currentPage = new PageClass(main, params);
            currentPath = originalHash;   // ★ 원본 해시 기준 (Fresh Start)
            await currentPage.mount();

            // 사이드바 active 동기화
            document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
                const ar = a.getAttribute('data-route');
                a.classList.toggle('is-active', path.startsWith(ar));
            });
            // 하단 탭 active 동기화
            document.querySelectorAll('.snw-bottom-nav__item').forEach(a => {
                const ar = a.getAttribute('data-route');
                a.classList.toggle('is-active', path.startsWith(ar));
            });

        } catch (e) {
            SNW.ErrorHandler.handle(e, `page.${ROUTES[parseHash()]?.page || 'unknown'}`);
            _showError(document.getElementById('snw-main'), SNW.I18n.t('msg.unknown'));
        } finally {
            _dispatching = false;
            if (parseHash() !== currentPath) setTimeout(dispatch, 0);
        }
    }

    function renderNavMenu() {
        const nav = document.getElementById('nav-menu');
        if (!nav) return;
        nav.innerHTML = '';

        NAV_GROUPS.forEach(group => {
            const visibleItems = group.items.filter(it => SNW.LevelUtil.atLeast(it.minLevel));
            if (visibleItems.length === 0) return;

            const section = document.createElement('div');
            section.className = 'snw-nav-group';

            const header = document.createElement('div');
            header.className = 'snw-nav-group__title';
            header.textContent = SNW.I18n.t(group.key);
            section.appendChild(header);

            visibleItems.forEach(it => {
                const label = SNW.I18n.t(it.key);
                const a = SNW.DomUtil.html`
                    <a href="#${it.path}" data-route="${it.path}">
                        <span class="snw-nav-icon">${it.icon}</span>
                        <span data-i18n="${it.key}">${label}</span>
                    </a>`;
                a.addEventListener('click', _closeSidebarOnMobile);
                section.appendChild(a);
            });

            nav.appendChild(section);
        });
    }

    SNW.Router = {
        ROUTES,
        init() {
            window.addEventListener('hashchange', dispatch);
            document.addEventListener('snw:langchange', renderNavMenu);
            renderNavMenu();
            dispatch();
        },
        navigate(path) { location.hash = path; },
        current() { return currentPath; }
    };
})(window.SNW);

