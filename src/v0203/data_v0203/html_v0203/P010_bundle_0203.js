
/* ===== LAYER 0: Core (Constants, Config, I18n, Utilities) ===== */

/* ---- 000.const.js (8445 bytes) ---- */
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
            MOTION_BLOCKED: 4,
            AUTOOFF_STOPPED: 5,
            TIME_INVALID: 6
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
            AUTOOFF_TEMP: 11
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
            4: { code: 'MOTION_BLOCKED',  icon: '🚫', color: 'yellow', labelKey: 'fsm.motionBlocked',  l1: true  },
            5: { code: 'AUTOOFF_STOPPED', icon: '⏹', color: 'orange', labelKey: 'fsm.autoOffStopped', l1: true  },
            6: { code: 'TIME_INVALID',    icon: '🕐', color: 'red',    labelKey: 'fsm.timeInvalid',    l1: false }
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


/* ---- 010.config.js (6974 bytes) ---- */
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
		LS_KEY: {
			AI_MODE: 'snw.ai.mode',
			AI_LIVE_WARNED: 'snw.ai.liveWarned',
			AI_HISTORY: 'snw.ai.history'
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



/* ---- 020.i18n.js (65419 bytes) ---- */
// =========================================================
// 020.i18n.js — 다국어 완전판 (ko/en)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    const DICT = {
        ko: {
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
            'monitor.retroTab': '🎬 회고',
            'monitor.liveWind': '📊 실시간 풍속',
            'monitor.sensors': '🌡️ 센서',
            'monitor.retroTitle': '🎬 세션 회고',
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

        },

        en: {
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


/* ---- 031.util.dom.js (2004 bytes) ---- */
// =========================================================
// 031.util.dom.js — SNW.DomUtil
// Layer 1 (유틸) — SNW.C 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    SNW.DomUtil = SNW.DomUtil || {};
    // [U-B6] 용어 툴팁
    SNW.DomUtil.tooltip = function(term, definition) {
        return `<span class="snw-term" title="${SNW.DomUtil.escape(definition)}" style="cursor:help;border-bottom:1px dashed var(--snw-text-dim);">${SNW.DomUtil.escape(term)}</span>`;
    };
	'use strict';
	
	SNW.DomUtil = {
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
					(typeof v === 'string' ? SNW.DomUtil.escape(v) : v);
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


/* ---- 040.api.js (16144 bytes) ---- */
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

		// --- Session (Stage 3 신규) ---
		sessionStart(type, payload, trigger = 'MANUAL') {
			return _fetch(SNW.CFG.API.sessionStart, {
				method: 'POST',
				body: { type, payload, trigger }
			});
		},
		startPlaylist(profileId) {
			return this.sessionStart('PLAYLIST', { profileId });
		},
		startPreset(presetCode, styleCode) {
			return this.sessionStart('PRESET', { presetCode, styleCode });
		},
		startFixed(percent) {
			return this.sessionStart('FIXED', { percent });
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


/* ---- 060.store.js (3311 bytes) ---- */
// =========================================================
// 060.store.js — SNW.Store + SNW.StoreBridge
// Layer 2 (서비스) — Layer 0~1 참조
//  - 경량 Observable Store (watch/subscribe)
//  - WS state 채널 → Store 자동 브리지
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
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
		
		// 파생 상태
		lastUpdateMs: 0,
		connection: 'offline', // 'online' | 'offline' | 'polling'
		fsmState: 0,
		fsmReason: 0,
		
		// 사용자 컨텍스트
		level: (SNW.LevelUtil && SNW.LevelUtil.current) ? SNW.LevelUtil.current() : 'L1'
	});
	
	// =====================================================
	// StoreBridge (WS → Store)
	// =====================================================
	SNW.StoreBridge = {
		_started: false,
		_unsubs: [],
		
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
					patch.session = ctl.session || null; // [v0203 Stage 3] Session 연결
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


/* ---- 070.router.js (9426 bytes) ---- */
// =========================================================
// 070.router.js — SNW.Router (해시 SPA 라우터)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    
    const ROUTES = {
        '/dashboard': { page: 'dashboard', level: 'L1' },
        '/automation': { page: 'automation', params: { tab: 'studio' }, level: 'L1' },
        '/automation/studio': { page: 'automation', params: { tab: 'studio' }, level: 'L1' },
        '/automation/playlist': { page: 'automation', params: { tab: 'playlist' }, level: 'L1' },
        '/automation/schedule': { page: 'automation', params: { tab: 'schedule' }, level: 'L1' },
        '/automation/timer': { page: 'automation', params: { tab: 'timer' }, level: 'L1' },
        '/chart': { page: 'chart', level: 'L2' },
        '/schedule': { page: 'schedule', level: 'L2' },
        '/profiles': { page: 'profiles', level: 'L2' },
        '/sensors': { page: 'sensors', level: 'L2' },
        '/monitor': { page: 'monitor', level: 'L2' }, // [Phase5 5.8]
        '/simulation': { page: 'simulation', level: 'L2' },
        '/windprofile': { page: 'windprofile', level: 'L3' },
        '/settings': { page: 'settings', level: 'L3' },
        '/network': { page: 'network', level: 'L3' },
        '/logs': { page: 'logs', level: 'L3' },
        '/diagnostics': { page: 'diagnostics', level: 'L4' },
        '/firmware': { page: 'firmware', level: 'L4' },
        '/ai': { page: 'ai', level: 'L4' },
        '/info': { page: 'info', level: 'L1' }
    };
    
    
        
    const NAV_GROUPS = [
    {
        key: 'nav.groupControl',
        items: [
            { path: '/dashboard', key: 'nav.dashboard', icon: '📊', minLevel: 'L1' },
            { path: '/chart', key: 'nav.chart', icon: '📈', minLevel: 'L2' },
            { path: '/automation', key: 'nav.automation', icon: '🎨', minLevel: 'L2' }, // ← 신규
            { path: '/schedule', key: 'nav.schedule', icon: '📅', minLevel: 'L2' },
            { path: '/profiles', key: 'nav.profiles', icon: '👤', minLevel: 'L2' },
            { path: '/sensors', key: 'nav.sensors', icon: '🌡', minLevel: 'L2' },
            { path: '/monitor', key: 'nav.monitor', icon: '📺', minLevel: 'L2' }
        ]
        /*
        key: 'nav.groupControl',
        items: [
            { path: '/dashboard', key: 'nav.dashboard', icon: '📊', minLevel: 'L1' },
            { path: '/chart', key: 'nav.chart', icon: '📈', minLevel: 'L2' },
            { path: '/schedule', key: 'nav.schedule', icon: '📅', minLevel: 'L2' },
            { path: '/profiles', key: 'nav.profiles', icon: '👤', minLevel: 'L2' },
            { path: '/sensors', key: 'nav.sensors', icon: '🌡', minLevel: 'L2' },
            { path: '/monitor', key: 'nav.monitor', icon: '📺', minLevel: 'L2' } // [Phase5 5.8]
        ]
        */
    },
    {
        key: 'nav.groupSettings',
        items: [
            { path: '/simulation', key: 'nav.simulation', icon: '🌊', minLevel: 'L2' },
            { path: '/windprofile', key: 'nav.windprofile', icon: '🌬', minLevel: 'L3' },
            { path: '/settings', key: 'nav.settings', icon: '⚙', minLevel: 'L3' },
            { path: '/network', key: 'nav.network', icon: '📶', minLevel: 'L3' }
        ]
    },
    {
        key: 'nav.groupSystem',
        items: [
            { path: '/logs', key: 'nav.logs', icon: '📜', minLevel: 'L3' },
            { path: '/diagnostics', key: 'nav.diagnostics', icon: '🔧', minLevel: 'L4' },
            { path: '/firmware', key: 'nav.firmware', icon: '💾', minLevel: 'L4' },
            { path: '/ai', key: 'nav.ai', icon: '🤖', minLevel: 'L4' },
            { path: '/info', key: 'nav.info', icon: 'ℹ', minLevel: 'L1' }
        ]
    }];
    
    let currentPage = null;
    let currentPath = null;
    let _dispatching = false;
    
    function capitalize(s) {
        if (s === 'ai') return 'AI';
        if (s === 'windprofile') return 'Windprofile';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    
    function parseHash() {
        const raw = location.hash.replace(/^#/, '').split('?')[0] || '/dashboard';
        return ROUTES[raw] ? raw : '/dashboard';
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
    
    // 페이지 이동 시 사이드바 닫기 (오직 클래스만 제거)
    function _closeSidebarOnMobile() {
        document.body.classList.remove('snw-sidebar-open');
    }
    
    async function dispatch() {
        if (_dispatching) return;
        
        const path = parseHash();
        if (path === currentPath) return;
        
        _dispatching = true;
        try {
            _closeSidebarOnMobile();
            
            const route = ROUTES[path];
            if (!SNW.LevelUtil.atLeast(route.level)) {
                SNW.ToastUtil.warn(SNW.I18n.t('msg.accessDenied'));
                location.hash = '/dashboard';
                return;
            }
            
            if (currentPage && typeof currentPage.unmount === 'function') {
                try {
                    const canLeave = currentPage.unmount();
                    if (canLeave === false) {
                        location.hash = currentPath;
                        return;
                    }
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
            currentPath = path;
            await currentPage.mount();
            
            document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
                a.classList.toggle('is-active', a.getAttribute('data-route') === path);
            });
            
            // 하단 탭 바 active 동기화 추가
            document.querySelectorAll('.snw-bottom-nav__item').forEach(a => {
                a.classList.toggle('is-active', a.getAttribute('data-route') === path);
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
            
            // ⚠️ 사이드바 제어는 999.app.js에서 전담
            // 라우터에서는 절대 건드리지 않음
            
            renderNavMenu();
            dispatch();
        },
        navigate(path) { location.hash = path; },
        current() { return currentPath; }
    };
})(window.SNW);

/* ===== LAYER 1: UI Components & Services (AudioWorklet, AI Live) ===== */

/* ---- 100.ui.badge.js (2046 bytes) ---- */
// =========================================================
// 100.ui.badge.js — SNW.UI.stateBadge (FSM 상태 배지)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - CT10 7-State FSM 매핑
//  - set(code, reason) 인터페이스
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	// =====================================================
	// FSM 메타 조회 (SNW.C + SNW.I18n 조합)
	// =====================================================
	function getStateMeta(code) {
		const meta = SNW.C.FSM_STATE_META[code] || SNW.C.FSM_STATE_META[0];
		return {
			code: meta.code,
			icon: meta.icon,
			color: meta.color,
			label: SNW.I18n.t(meta.labelKey),
			l1: meta.l1
		};
	}
	
	function getReasonMeta(code) {
		const meta = SNW.C.FSM_REASON_META[code] || SNW.C.FSM_REASON_META[0];
		return {
			code: meta.code,
			label: SNW.I18n.t(meta.labelKey)
		};
	}
	
	/**
	 * 상태 배지 마운트
	 * @param {HTMLElement} container
	 * @returns {{set: function(number, number)}}
	 */
	SNW.UI.stateBadge = function(container) {
		if (!container) return { set: () => {} };
		
		let curState = 0;
		let curReason = 0;
		
		const render = () => {
			const st = getStateMeta(curState);
			const rs = getReasonMeta(curReason);
			
			container.innerHTML = '';
			container.appendChild(SNW.DomUtil.html`
                <span class="snw-badge snw-badge--${st.color}" title="${rs.label}" data-state="${st.code}">
                    <span class="snw-badge__icon">${st.icon}</span>
                    <span class="snw-badge__label">${st.label}</span>
                </span>`);
		};
		
		render();
		
		return {
			set(code, reason) {
				curState = (code != null) ? code : 0;
				curReason = (reason != null) ? reason : 0;
				render();
			}
		};
	};
	
	// 참고: FsmUtil 별도 네임스페이스가 필요한 경우 이 파일에서 함께 노출
	SNW.FsmUtil = {
		getState: getStateMeta,
		getReason: getReasonMeta
	};
	
})(window.SNW);


/* ---- 101.ui.toggle.js (1840 bytes) ---- */
// =========================================================
// 101.ui.toggle.js — SNW.UI.toggle (On/Off 대형 토글)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - 낙관적 UI 지원 (set()으로 외부 동기화)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	/**
	 * On/Off 토글
	 * @param {object} opts
	 *   root     : HTMLElement
	 *   on       : boolean (초기 상태)
	 *   onToggle : (next:boolean) => void
	 *   onLabel  : string (기본 = I18n 'dashboard.powerOn')
	 *   offLabel : string (기본 = I18n 'dashboard.powerOff')
	 * @returns {{set: function(boolean)}}
	 */
	SNW.UI.toggle = function(opts) {
		const {
			root,
			on = false,
			onToggle,
			onLabel = SNW.I18n.t('dashboard.powerOn'),
			offLabel = SNW.I18n.t('dashboard.powerOff')
		} = opts || {};
		
		if (!root) return { set: () => {} };
		
		let state = !!on;
		
		const render = () => {
			root.innerHTML = '';
			const btn = SNW.DomUtil.html`
                <button class="snw-toggle ${state ? 'is-on' : 'is-off'}" type="button"
                        aria-pressed="${state ? 'true' : 'false'}">
                    <span class="snw-toggle__icon">${state ? '⏹' : '▶'}</span>
                    <span class="snw-toggle__label">${state ? offLabel : onLabel}</span>
                </button>`;
			btn.addEventListener('click', () => {
				const next = !state;
				state = next;
				render();
				if (typeof onToggle === 'function') {
					try { onToggle(next); }
					catch (e) { SNW.LogUtil.error('[toggle] onToggle 실패', e); }
				}
			});
			root.appendChild(btn);
		};
		
		render();
		
		return {
			set(next) {
				const v = !!next;
				if (v === state) return;
				state = v;
				render();
			}
		};
	};
	
})(window.SNW);


/* ---- 102.ui.gauge.js (1255 bytes) ---- */
// =========================================================
// 102.ui.gauge.js — SNW.UI.gauge (PWM 0~100 게이지)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	/**
	 * PWM 게이지
	 * @param {HTMLElement} root
	 * @returns {{set: function(number), get: function():number}}
	 */
	SNW.UI.gauge = function(root) {
		if (!root) return { set: () => {}, get: () => 0 };
		
		root.innerHTML = '';
		root.appendChild(SNW.DomUtil.html`
            <div class="snw-gauge">
                <div class="snw-gauge__bar">
                    <div class="snw-gauge__fill" data-fill style="width:0%"></div>
                </div>
                <span class="snw-gauge__label" data-label>0%</span>
            </div>`);
		
		const fill = root.querySelector('[data-fill]');
		const label = root.querySelector('[data-label]');
		let cur = 0;
		
		return {
			set(pct) {
				const p = Math.max(0, Math.min(100, Number(pct) || 0));
				cur = p;
				if (fill) fill.style.width = p.toFixed(1) + '%';
				if (label) label.textContent = p.toFixed(0) + '%';
			},
			get() { return cur; }
		};
	};
	
})(window.SNW);


/* ---- 110.ui.slider.js (9241 bytes) ---- */
// =========================================================
// 110.ui.slider.js — SNW.UI.slider
// Layer 3 (UI 컴포넌트)
// [O-2] 낙관적 잠금 (dragging + pending 보호)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    
    SNW.UI = SNW.UI || {};
    
    SNW.UI.slider = function(opts) {
        const {
            root,
            min = 0,
            max = 100,
            value = 50,
            label = '',
            unit = '',
            feedbackFn = null,
            onChange,
            debounceMs = SNW.C.DEBOUNCE_MS.SLIDER
        } = opts || {};
        
        if (!root) return { set: () => {}, get: () => value };
        
        const debounced = SNW.DebounceUtil.debounce((v) => {
            if (typeof onChange === 'function') {
                try { onChange(v); }
                catch (e) { SNW.LogUtil.error('[slider] onChange 실패', e); }
            }
        }, debounceMs);
        
        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`
            <div class="snw-slider">
                <div class="snw-slider__head">
                    <span class="snw-slider__label">${label}</span>
                    <span class="snw-slider__value">
                        <span data-val>${value}</span><span class="snw-slider__unit">${unit}</span>
                    </span>
                </div>
                <input type="range" class="snw-slider__input"
                       min="${min}" max="${max}" value="${value}" data-input />
                <div class="snw-slider__feedback" data-feedback style="margin-top:4px;font-size:11px;color:var(--snw-text-dim);display:none;"></div>
            </div>`);
        
        const input = root.querySelector('[data-input]');
        const valEl = root.querySelector('[data-val]');
        const fbEl  = root.querySelector('[data-feedback]');
        
        const updateFeedback = (val) => {
            if (typeof feedbackFn === 'function' && fbEl) {
                const fb = feedbackFn(Number(val));
                if (fb) {
                    fbEl.style.display = 'block';
                    fbEl.innerHTML = `
                        <div style="font-weight:600;color:var(--snw-primary);">${SNW.DomUtil.escape(fb.title || '')}</div>
                        <div style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;">${SNW.DomUtil.escape(fb.desc || '')}</div>
                    `;
                } else {
                    fbEl.style.display = 'none';
                }
            }
        };

        updateFeedback(value);
        
        let dragging = false;
        
        input.addEventListener('input', () => {
            dragging = true;
            if (valEl) valEl.textContent = input.value;
            updateFeedback(input.value);
        });
        
        input.addEventListener('change', () => {
            dragging = false;
            updateFeedback(input.value);
            debounced(Number(input.value));
        });
        
        input.addEventListener('pointerup', () => { dragging = false; });
        input.addEventListener('pointercancel', () => { dragging = false; });
        
        return {
            set(v) {
                // [O-2] 사용자 조작 중 무시
                if (dragging) return;
                const n = Math.max(min, Math.min(max, Number(v) || 0));
                updateFeedback(n);
                // 현재 표시 값과 같으면 스킵 (불필요한 재렌더 방지)
                if (Number(input.value) === n) return;
                input.value = String(n);
                if (valEl) valEl.textContent = String(n);
            },
            get() { return Number(input.value); }
        };
    };
    

    // =========================================================
    // [Stage 6] Snap 슬라이더 (일반 선풍기용 + Haptic 연동)
    // =========================================================
    SNW.UI.snapSlider = function(container, opts = {}) {
        const {
            min        = 0,
            max        = 100,
            value      = 0,
            snapPoints = [0, 20, 40, 60, 80, 100],
            snapRadius = 8,
            label      = '',
            format     = (v) => `${v}%`,
            onChange   = null,
        } = opts;

        if (!container) return { set: () => {}, get: () => value };

        container.innerHTML = `
            <div class="snw-snapslider">
                <div class="snw-snapslider__head">
                    <span class="snw-snapslider__label">${SNW.DomUtil ? SNW.DomUtil.escape(label) : label}</span>
                    <span class="snw-snapslider__value" data-slot="val">${format(value)}</span>
                </div>
                <div class="snw-snapslider__track-wrap">
                    <input type="range"
                           class="snw-snapslider__input"
                           min="${min}" max="${max}" step="1"
                           value="${value}"
                           data-slot="input">
                    <div class="snw-snapslider__ticks">
                        ${snapPoints.map(p =>
                            `<span class="snw-snapslider__tick"
                                   style="left:${((p - min) / (max - min) * 100).toFixed(1)}%"></span>`
                        ).join('')}
                    </div>
                </div>
                <div class="snw-snapslider__stops">
                    ${snapPoints.map(p =>
                        `<button type="button"
                                 class="snw-snapslider__stop"
                                 data-snap="${p}">${format(p)}</button>`
                    ).join('')}
                </div>
            </div>`;

        const input   = container.querySelector('[data-slot="input"]');
        const valEl   = container.querySelector('[data-slot="val"]');
        const stopEls = container.querySelectorAll('[data-snap]');

        let currentValue = Number(value) || 0;
        let dragging = false;
        let lastSnapFired = currentValue;

        function snapToNearest(raw) {
            const v = Number(raw);
            if (!snapPoints || snapPoints.length === 0) return v;

            let nearest = snapPoints[0];
            let minDist = Math.abs(nearest - v);
            for (const p of snapPoints) {
                const d = Math.abs(p - v);
                if (d < minDist) { minDist = d; nearest = p; }
            }
            if (minDist <= snapRadius) return nearest;
            return v;
        }

        function updateUI(v) {
            if (valEl) valEl.textContent = format(v);
            stopEls.forEach(el => {
                const sp = Number(el.getAttribute('data-snap'));
                el.classList.toggle('is-active', sp === v);
            });
        }

        input.addEventListener('input', () => {
            dragging = true;
            const raw = Number(input.value);
            if (valEl) valEl.textContent = format(raw);
        });

        function finalize() {
            if (!dragging) return;
            dragging = false;

            const raw = Number(input.value);
            const snapped = snapToNearest(raw);

            if (snapped !== raw) {
                input.value = snapped;
            }

            if (snapped !== lastSnapFired) {
                if (snapPoints.includes(snapped)) {
                    if (SNW.Haptic && typeof SNW.Haptic.snap === 'function') SNW.Haptic.snap();
                }
                lastSnapFired = snapped;
            }

            currentValue = snapped;
            updateUI(snapped);

            if (typeof onChange === 'function') {
                try { onChange(snapped); } catch (e) { if (SNW.LogUtil) SNW.LogUtil.error(e); }
            }
        }

        input.addEventListener('pointerup', finalize);
        input.addEventListener('pointercancel', finalize);
        input.addEventListener('touchend', finalize);
        input.addEventListener('change', () => {
            if (!dragging) finalize();
        });

        stopEls.forEach(el => {
            el.addEventListener('click', () => {
                const target = Number(el.getAttribute('data-snap'));
                if (target === currentValue) return;

                currentValue = target;
                input.value = target;
                lastSnapFired = target;
                updateUI(target);

                if (snapPoints.includes(target)) {
                    if (SNW.Haptic && typeof SNW.Haptic.snap === 'function') SNW.Haptic.snap();
                }

                if (typeof onChange === 'function') {
                    try { onChange(target); } catch (e) { if (SNW.LogUtil) SNW.LogUtil.error(e); }
                }
            });
        });

        updateUI(currentValue);

        return {
            set(v) {
                const n = Math.max(min, Math.min(max, Number(v) || 0));
                if (n === currentValue) return;
                currentValue = n;
                input.value = n;
                updateUI(n);
            },
            get() { return currentValue; },
        };
    };

})(window.SNW);

/* ---- 115.ui.eq.js (6552 bytes) ---- */
// =========================================================
// 115.ui.eq.js — 이퀄라이저 (실시간 파형 애니메이션)
// Layer 1 (UI 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * 이퀄라이저 (Canvas 2D)
     * @param {HTMLElement} container
     * @param {Object} opts { bars, fps, maxWind, bufferSize }
     * @returns {{ push(windSpeed), start(), stop(), clear(), renderStatic() }}
     */
    SNW.UI.equalizer = function(container, opts = {}) {
        const {
            bars       = 20,
            fps        = 60,
            maxWind    = 11.0,       // 최대 풍속 (m/s)
            bufferSize = 30,         // 로컬 버퍼 (WS 간격 × 30 ≈ 24초)
        } = opts;

        if (!container) {
            return { push: () => {}, start: () => {}, stop: () => {}, clear: () => {}, renderStatic: () => {} };
        }

        // 캔버스 초기화
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'snw-eq-canvas';
        canvas.setAttribute('aria-label', '풍속 그래프');
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        // DPR (고해상도)
        let dpr = window.devicePixelRatio || 1;
        let cw = 0, ch = 0;

        // 로컬 링 버퍼
        const buffer = new Array(bufferSize).fill(0);

        // 애니메이션 상태
        let running = false;
        let rafId = null;
        let lastTs = 0;

        // prefers-reduced-motion
        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // =========================================================
        // 리사이즈
        // =========================================================
        function resize() {
            const rect = container.getBoundingClientRect();
            cw = Math.max(60, Math.floor(rect.width || container.clientWidth || 300));
            ch = Math.max(40, Math.floor(rect.height || container.clientHeight || 60));

            canvas.width  = Math.floor(cw * dpr);
            canvas.height = Math.floor(ch * dpr);
            canvas.style.width  = cw + 'px';
            canvas.style.height = ch + 'px';

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            render();
        }

        // =========================================================
        // 렌더
        // =========================================================
        function render() {
            ctx.clearRect(0, 0, cw, ch);

            const barW = cw / bars;
            const gap = Math.max(1, barW * 0.15);
            const actualW = barW - gap;

            // 최근 bufferSize 값을 bars 개수로 다운샘플
            const step = Math.max(1, Math.floor(bufferSize / bars));
            for (let i = 0; i < bars; i++) {
                const srcIdx = Math.min(bufferSize - 1, i * step + Math.floor(step / 2));
                const v = buffer[srcIdx] || 0;

                // 정규화
                const ratio = Math.min(1, Math.max(0, v / maxWind));
                const bh = Math.max(2, ratio * (ch - 4));

                // 색상 매핑
                let color;
                if (v > 6)      color = '#f0883e';   // 강함 (주황)
                else if (v > 3) color = '#3fb950';   // 보통 (초록)
                else            color = '#4a9eff';   // 잔잔 (파랑)

                ctx.fillStyle = color;
                const x = i * barW + gap / 2;
                const y = ch - bh;
                // 둥근 막대 (roundRect 미지원 브라우저 대응)
                if (typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(x, y, actualW, bh, 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, actualW, bh);
                }
            }
        }

        // =========================================================
        // 애니메이션 루프
        // =========================================================
        function tick(ts) {
            if (!running) return;

            const frameInterval = reduceMotion ? 500 : Math.floor(1000 / fps);
            if (ts - lastTs >= frameInterval) {
                lastTs = ts;
                render();
            }
            rafId = requestAnimationFrame(tick);
        }

        // =========================================================
        // ResizeObserver
        // =========================================================
        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(resize);
            ro.observe(container);
        } else {
            window.addEventListener('resize', resize);
        }

        // 초기 렌더
        requestAnimationFrame(resize);

        // =========================================================
        // Public API
        // =========================================================
        return {
            /** 새 풍속 값 push (WS state에서 호출) */
            push(windSpeed) {
                buffer.shift();
                buffer.push(Math.max(0, Number(windSpeed) || 0));
                if (!running) render();   // 정지 시 즉시 렌더
            },

            start() {
                if (running) return;
                if (reduceMotion) {
                    // reduced-motion: 애니메이션 없이 push 시 렌더만
                    running = true;
                    return;
                }
                running = true;
                rafId = requestAnimationFrame(tick);
            },

            stop() {
                running = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },

            clear() {
                buffer.fill(0);
                render();
            },

            /** 정지 상태용 — 회색 라인 */
            renderStatic() {
                ctx.clearRect(0, 0, cw, ch);
                ctx.strokeStyle = '#59636e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(4, ch / 2);
                ctx.lineTo(cw - 4, ch / 2);
                ctx.stroke();
            },
        };
    };
})(window.SNW);



/* ---- 116.ui.sparkline.js (3395 bytes) ---- */
// =========================================================
// 116.ui.sparkline.js — 경량 SVG Sparkline
// Layer 1 (UI 코어 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * Sparkline 렌더러
     * @param {HTMLElement} container
     * @param {Object} opts { width, height, color, baseline }
     * @returns {{render(points), clear()}}
     */
    SNW.UI.sparkline = function(container, opts = {}) {
        const {
            width  = 200,
            height = 40,
            color  = '#4a9eff',
            baseline = null,   // 0이면 바닥에 선
        } = opts;

        if (!container) return { render: () => {}, clear: () => {} };

        // SVG 요소 초기화
        container.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.cssText = 'width:100%;height:100%;display:block;';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);

        if (baseline !== null) {
            const bl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            bl.setAttribute('x1', '0');
            bl.setAttribute('x2', String(width));
            bl.setAttribute('y1', String(height - baseline * height));
            bl.setAttribute('y2', String(height - baseline * height));
            bl.setAttribute('stroke', 'rgba(139,148,158,0.2)');
            bl.setAttribute('stroke-width', '1');
            svg.insertBefore(bl, path);
        }

        container.appendChild(svg);

        return {
            render(points) {
                if (!points || points.length < 2) {
                    path.setAttribute('d', '');
                    return;
                }

                // 값 범위 계산
                let minV = Infinity, maxV = -Infinity;
                points.forEach(p => {
                    const v = (typeof p === 'number') ? p : (p.wind || 0);
                    if (v < minV) minV = v;
                    if (v > maxV) maxV = v;
                });
                if (maxV <= minV) maxV = minV + 1;

                // Padding
                const padY = 2;
                const innerH = height - padY * 2;

                // path 생성
                const n = points.length;
                const stepX = width / (n - 1);
                let d = '';
                points.forEach((p, i) => {
                    const v = (typeof p === 'number') ? p : (p.wind || 0);
                    const x = i * stepX;
                    const y = padY + innerH - ((v - minV) / (maxV - minV)) * innerH;
                    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
                });
                path.setAttribute('d', d.trim());
            },
            clear() {
                path.setAttribute('d', '');
            }
        };
    };
})(window.SNW);



/* ---- 117.ui.haptic.js (1786 bytes) ---- */
// =========================================================
// 117.ui.haptic.js — 햅틱 래퍼 (지원 감지 + 폴백)
// Layer 1 (UI 유틸)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.Haptic = {
        /** 지원 여부 */
        isSupported() {
            return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
        },

        /** 지원 시 실행, 미지원 시 무음 통과 */
        _vibrate(pattern) {
            if (!this.isSupported()) return false;
            try {
                return navigator.vibrate(pattern);
            } catch {
                return false;
            }
        },

        // =========================================================
        // 프리셋 패턴 (의도별)
        // =========================================================

        /** 단계 Snap (가벼운 톡) — 10ms */
        snap() {
            return this._vibrate(10);
        },

        /** ON/OFF (확실한 톡) — 30ms */
        toggle() {
            return this._vibrate(30);
        },

        /** Step 전환 (이중 리듬) — 10-20-10 */
        stepChange() {
            return this._vibrate([10, 20, 10]);
        },

        /** 저장/성공 (짧고 명확) — 20ms */
        success() {
            return this._vibrate(20);
        },

        /** 오류 (긴 진동) — 100ms */
        error() {
            return this._vibrate(100);
        },

        /** 경고 (이중 짧은) — 15-30-15 */
        warn() {
            return this._vibrate([15, 30, 15]);
        },

        /** 정지 (긴 단일) — 50ms */
        stop() {
            return this._vibrate(50);
        },
    };
})(window.SNW);



/* ---- 120.ui.chart.js (5705 bytes) ---- */
// =========================================================
// 120.ui.chart.js — SNW.UI.chart (Canvas 2D)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - mini/full 통합 (maxPoints로 결정)
//  - 시리즈: { key, color, labelKey, unitKey? }
//  - push(point), clear(), setMaxPoints(), destroy()
//  - devicePixelRatio 대응 (선명한 렌더)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * 차트
     * @param {object} opts
     *   root       : HTMLElement
     *   maxPoints  : number (기본 SNW.CFG.UI.MINI_CHART_POINTS = 120)
     *   series     : [{ key, color, labelKey }]
     *   yMin, yMax : number (고정 범위, 미지정 시 자동)
     * @returns {{push, clear, setMaxPoints, destroy}}
     */
    SNW.UI.chart = function (opts) {
        const {
            root,
            maxPoints = SNW.CFG.UI.MINI_CHART_POINTS,
            series = SNW.CFG.UI.MINI_CHART_SERIES,
            yMin = null,
            yMax = null
        } = opts || {};

        if (!root) return { push: () => {}, clear: () => {}, setMaxPoints: () => {}, destroy: () => {} };

        root.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'snw-chart-canvas';
        root.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // DPR 대응
        let dpr = window.devicePixelRatio || 1;
        let cw  = 0, ch = 0;

        const buffers = {};
        series.forEach(s => { buffers[s.key] = []; });

        let curMaxPoints = maxPoints;

        function resize() {
            const rect = root.getBoundingClientRect();
            cw = Math.max(200, Math.floor(rect.width  || root.clientWidth  || 800));
            ch = Math.max(80,  Math.floor(rect.height || root.clientHeight || 200));
            canvas.width  = Math.floor(cw * dpr);
            canvas.height = Math.floor(ch * dpr);
            canvas.style.width  = cw + 'px';
            canvas.style.height = ch + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        }

        function push(point) {
            series.forEach(s => {
                const arr = buffers[s.key];
                const v   = (point && point[s.key]);
                arr.push({ x: (point && point.t) || Date.now(), y: v });
                if (arr.length > curMaxPoints) arr.shift();
            });
            draw();
        }

        function clear() {
            series.forEach(s => { buffers[s.key] = []; });
            draw();
        }

        function _drawSeries(arr, color) {
            if (arr.length < 2) return;
            ctx.strokeStyle = color;
            ctx.lineWidth   = 2;
            ctx.lineJoin    = 'round';
            ctx.beginPath();
            for (let i = 0; i < arr.length; i++) {
                const p = arr[i];
                const x = (i / (curMaxPoints - 1)) * cw;
                const y = ch - p.py;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        function draw() {
            ctx.clearRect(0, 0, cw, ch);

            // 범위 계산 (모든 시리즈 통합)
            let dataMin = Infinity, dataMax = -Infinity;
            series.forEach(s => {
                buffers[s.key].forEach(p => {
                    if (!Number.isFinite(p.y)) return;
                    if (p.y < dataMin) dataMin = p.y;
                    if (p.y > dataMax) dataMax = p.y;
                });
            });
            if (yMin != null) dataMin = yMin;
            if (yMax != null) dataMax = yMax;
            if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;
            if (dataMax <= dataMin) dataMax = dataMin + 1;

            const pad = 6;
            const yRange = dataMax - dataMin;
            const innerH = ch - pad * 2;

            // Y축 그리드 (5줄)
            ctx.strokeStyle = 'rgba(139,148,158,0.15)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = pad + (innerH / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(cw, y);
                ctx.stroke();
            }

            // 각 시리즈 픽셀 좌표 미리 계산
            series.forEach(s => {
                buffers[s.key].forEach(p => {
                    if (!Number.isFinite(p.y)) { p.py = 0; return; }
                    p.py = pad + ((p.y - dataMin) / yRange) * innerH;
                });
            });

            // 라인 렌더
            series.forEach(s => _drawSeries(buffers[s.key], s.color));
        }

        // 리사이즈 옵저버 (없으면 window resize)
        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(resize);
            ro.observe(root);
        } else {
            window.addEventListener('resize', resize);
        }

        // 최초 렌더
        requestAnimationFrame(resize);

        return {
            push,
            clear,
            setMaxPoints(n) {
                curMaxPoints = Math.max(10, Number(n) || 120);
                series.forEach(s => {
                    const arr = buffers[s.key];
                    while (arr.length > curMaxPoints) arr.shift();
                });
                draw();
            },
            destroy() {
                if (ro) ro.disconnect();
                else window.removeEventListener('resize', resize);
                root.innerHTML = '';
            }
        };
    };

})(window.SNW);


/* ---- 130.ui.form.js (17381 bytes) ---- */
// =========================================================
// 130.ui.form.js — SNW.UI.form + presetGrid + sensorCards + logViewer
// Layer 3 (UI 컴포넌트)
// [O-12] logViewer 스마트 스크롤 (사용자 스크롤 보호)
// [B-8] 로그 필터 정확 매칭 (기존 유지)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    
    SNW.UI = SNW.UI || {};
    
    // =========================================================
    // 1) SNW.UI.form (스키마 기반 폼)
    // =========================================================
    SNW.UI.form = function(opts) {
        const { root, schema = [], value = {}, onSave } = opts || {};
        if (!root) return { getValue: () => ({}), setValue: () => {}, setError: () => {} };
        
        const state = Object.assign({}, value);
        const inputs = {};
        
        function render() {
            root.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'snw-form';
            
            schema.forEach(f => {
                const label = SNW.I18n.t(f.labelKey);
                const cur = state[f.key];
                let inputEl;
                
                if (f.type === 'bool') {
                    inputEl = SNW.DomUtil.html`
                        <label class="snw-form-row snw-form-row--bool">
                            <input type="checkbox" data-key="${f.key}" ${cur ? 'checked' : ''} />
                            <span>${label}</span>
                        </label>`;
                } else if (f.type === 'select') {
                    const optsHtml = (f.options || []).map(o => {
                        const v = (typeof o === 'object') ? o.value : o;
                        const l = (typeof o === 'object') ? SNW.I18n.t(o.labelKey) : o;
                        return `<option value="${SNW.DomUtil.escape(v)}" ${v === cur ? 'selected' : ''}>${SNW.DomUtil.escape(l)}</option>`;
                    }).join('');
                    inputEl = SNW.DomUtil.html`
                        <div class="snw-form-row">
                            <label>${label}</label>
                            <select data-key="${f.key}">${optsHtml}</select>
                        </div>`;
                } else {
                    const t = (f.type === 'number') ? 'number' : (f.type === 'password' ? 'password' : 'text');
                    const extra = [
                        f.min != null ? `min="${f.min}"` : '',
                        f.max != null ? `max="${f.max}"` : '',
                        f.step != null ? `step="${f.step}"` : '',
                        f.placeholder ? `placeholder="${SNW.DomUtil.escape(f.placeholder)}"` : '',
                        f.type === 'password' ? 'autocomplete="off" data-lpignore="true" data-1p-ignore="true"' : ''
                    ].join(' ');
                    inputEl = SNW.DomUtil.html`
                        <div class="snw-form-row">
                            <label>${label}</label>
                            <input type="${t}" data-key="${f.key}" value="${cur != null ? cur : ''}" ${extra} />
                        </div>`;
                }
                wrap.appendChild(inputEl);
                
                const inputNode = inputEl.matches('[data-key]') ? inputEl : inputEl.querySelector('[data-key]');
                if (inputNode) {
                    inputs[f.key] = { el: inputNode, type: f.type };
                    if (f.type === 'bool') {
                        inputNode.addEventListener('change', () => { state[f.key] = inputNode.checked; });
                    } else if (f.type === 'number') {
                        inputNode.addEventListener('input', () => {
                            const v = inputNode.value === '' ? null : Number(inputNode.value);
                            state[f.key] = v;
                        });
                    } else {
                        inputNode.addEventListener('input', () => { state[f.key] = inputNode.value; });
                    }
                }
            });
            
            if (typeof onSave === 'function') {
                const btn = SNW.DomUtil.html`
                    <button type="button" class="snw-btn snw-btn-primary" data-action="form-save">
                        ${SNW.I18n.t('common.save')}
                    </button>`;
                btn.addEventListener('click', () => {
                    try { onSave(state); }
                    catch (e) { SNW.ErrorHandler.handle(e, 'form.onSave'); }
                });
                wrap.appendChild(btn);
            }
            
            root.appendChild(wrap);
        }
        
        render();
        
        return {
            getValue() { return Object.assign({}, state); },
            setValue(patch) {
                Object.assign(state, patch);
                Object.keys(patch).forEach(k => {
                    const ref = inputs[k];
                    if (!ref) return;
                    if (ref.type === 'bool') ref.el.checked = !!state[k];
                    else if (state[k] != null) ref.el.value = String(state[k]);
                });
            },
            setError(key, msg) {
                const ref = inputs[key];
                if (!ref) return;
                ref.el.classList.toggle('is-error', !!msg);
                ref.el.title = msg || '';
            },
            refresh() { render(); }
        };
    };
    
    // =========================================================
    // 2) SNW.UI.presetGrid
    // =========================================================
    SNW.UI.presetGrid = function(opts) {
        const { root, items = [], selected = '', onSelect, onPreview, onTrial } = opts || {};
        if (!root) return { setItems: () => {}, setSelected: () => {} };
        
        let curSelected = selected;
        let curItems = items.slice();
        
        // [U-010] cfg_windDict_0203.json 10개 프리셋 코드와 1:1 매칭
        const PRESET_ICONS = {
            OCEAN:          '🌊',
            COUNTRY_BREEZE: '🏡',
            MEDITERRANEAN:  '🏖',
            MOUNTAIN:       '🏔',
            PLAINS:         '🌾',
            HARBOR_BREEZE:  '⚓',
            FOREST_CANOPY:  '🌲',
            URBAN_SUNSET:   '🌆',
            TROPICAL_RAIN:  '🌴',
            DESERT_NIGHT:   '🌙'
        };

        function _drawSpark(canvas, points) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            let min = Infinity, max = -Infinity;
            points.forEach(p => { if (p.wind < min) min = p.wind; if (p.wind > max) max = p.wind; });
            if (max <= min) max = min + 1;
            ctx.strokeStyle = 'rgba(74,158,255,0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            points.forEach((p, i) => {
                const x = (i / (points.length - 1)) * w;
                const y = h - ((p.wind - min) / (max - min)) * (h - 2) - 1;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
        
        function render() {
            root.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'snw-preset-grid';
            
            curItems.forEach((it, i) => {
                const name = (SNW.I18n && SNW.I18n.hasKey('preset.' + it.code))
                    ? SNW.I18n.t('preset.' + it.code)
                    : (it.name || it.code);
                const icon = PRESET_ICONS[it.code] || '🍃';

                // [SIM-1] hover 미니 파형 (canvas) + 미리보기 버튼
                const card = document.createElement('button');
                card.type = 'button';
                card.className = `snw-preset-card ${it.code === curSelected ? 'is-selected' : ''}`;
                card.setAttribute('data-code', it.code);
                card.innerHTML = `
                    <span class="snw-preset-card__icon">${icon}</span>
                    <span class="snw-preset-card__name">${name}</span>
                    <span class="snw-preset-card__actions" style="position:absolute;top:2px;right:2px;display:flex;gap:3px;">
                        <span class="snw-preset-card__preview" title="미리보기" style="font-size:11px;opacity:0.75;">🎬</span>
                        <span class="snw-preset-card__trial"   title="실제 체험" style="font-size:11px;opacity:0.75;">🔊</span>
                    </span>
                    <canvas class="snw-preset-card__spark" width="60" height="20" style="display:none;"></canvas>`;

                const prevBtn = card.querySelector('.snw-preset-card__preview');
                if (prevBtn) {
                    prevBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof onPreview === 'function') onPreview(it.code);
                    };
                }
                const trialBtn = card.querySelector('.snw-preset-card__trial');
                if (trialBtn) {
                    trialBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof onTrial === 'function') onTrial(it.code);
                    };
                }

                card.addEventListener('mouseenter', async () => {
                    const cv = card.querySelector('.snw-preset-card__spark');
                    if (!cv) return;
                    if (cv.dataset.drawn === '1') { cv.style.display = 'block'; return; }

                    const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
                    if (SNW.Preview && typeof SNW.Preview.generate === 'function') {
                        try {
                            const preview = await SNW.Preview.generate(it.code, styleCode, null);
                            if (preview && preview.points) {
                                _drawSpark(cv, preview.points);
                                cv.dataset.drawn = '1';
                                cv.style.display = 'block';
                            }
                        } catch (e) {
                            if (SNW.LogUtil) SNW.LogUtil.warn('[presetGrid] preview fail', e);
                        }
                    }
                });
                card.addEventListener('mouseleave', () => {
                    const cv = card.querySelector('.snw-preset-card__spark');
                    if (cv) cv.style.display = 'none';
                });

                grid.appendChild(card);
            });
            
            root.appendChild(grid);
        }
        
        render();
        
        SNW.DomUtil.delegate(root, '.snw-preset-card', 'click', (e, el) => {
            const code = el.getAttribute('data-code');
            if (!code || code === curSelected) return;
            curSelected = code;
            render();
            if (typeof onSelect === 'function') {
                try { onSelect(code); }
                catch (e) { SNW.ErrorHandler.handle(e, 'presetGrid.onSelect'); }
            }
        });
        
        return {
            setItems(list) { curItems = list.slice();
                render(); },
            setSelected(code) {
                if (code === curSelected) return;
                curSelected = code || '';
                render();
            }
        };
    };
    
    // =========================================================
    // 3) SNW.UI.sensorCards
    // =========================================================
    SNW.UI.sensorCards = function(root) {
        if (!root) return { set: () => {} };
        
        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`
            <div class="snw-sensor-cards">
                <div class="snw-sensor-card">
                    <span class="snw-sensor-card__icon">🌡</span>
                    <span class="snw-sensor-card__label">${SNW.I18n.t('dashboard.temp')}</span>
                    <span class="snw-sensor-card__val" data-temp>--</span>
                </div>
                <div class="snw-sensor-card">
                    <span class="snw-sensor-card__icon">💧</span>
                    <span class="snw-sensor-card__label">${SNW.I18n.t('dashboard.humidity')}</span>
                    <span class="snw-sensor-card__val" data-hum>--</span>
                </div>
                <div class="snw-sensor-card">
                    <span class="snw-sensor-card__icon">👤</span>
                    <span class="snw-sensor-card__label">${SNW.I18n.t('dashboard.motion')}</span>
                    <span class="snw-sensor-card__val" data-motion>--</span>
                </div>
            </div>`);
        
        const tempEl = root.querySelector('[data-temp]');
        const humEl = root.querySelector('[data-hum]');
        const motEl = root.querySelector('[data-motion]');
        
        return {
            set({ tempC, humidity, motionActive } = {}) {
                if (tempC != null && Number.isFinite(tempC))
                    tempEl.textContent = `${tempC.toFixed(1)}${SNW.I18n.t('unit.celsius')}`;
                if (humidity != null && Number.isFinite(humidity))
                    humEl.textContent = `${humidity.toFixed(0)}${SNW.I18n.t('unit.humidity')}`;
                if (motionActive != null) {
                    motEl.textContent = motionActive ?
                        SNW.I18n.t('dashboard.motionDetected') :
                        SNW.I18n.t('dashboard.motionAbsent');
                    motEl.classList.toggle('is-on', !!motionActive);
                    motEl.classList.toggle('is-off', !motionActive);
                }
            }
        };
    };
    
    // =========================================================
    // 4) [O-12] SNW.UI.logViewer — 스마트 스크롤
    // =========================================================
    SNW.UI.logViewer = function(opts) {
        const { root, maxLines = SNW.CFG.UI.LOG_MAX_LINES } = opts || {};
        if (!root) return { append: () => {}, clear: () => {}, setFilter: () => {} };
        
        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`<div class="snw-log-viewer" data-body></div>`);
        const body = root.querySelector('[data-body]');
        
        let filterLevel = 0;
        let _jumpBtn = null;
        
        const _isAtBottom = () => (body.scrollHeight - body.scrollTop - body.clientHeight) < 30;
        
        const _showJumpButton = () => {
            if (_jumpBtn) return;
            _jumpBtn = document.createElement('button');
            _jumpBtn.className = 'snw-log-jump-bottom';
            _jumpBtn.textContent = '▼ 최신';
            _jumpBtn.onclick = () => {
                body.scrollTop = body.scrollHeight;
                _hideJumpButton();
            };
            root.appendChild(_jumpBtn);
        };
        const _hideJumpButton = () => {
            if (_jumpBtn) { _jumpBtn.remove();
                _jumpBtn = null; }
        };
        
        body.addEventListener('scroll', () => {
            if (_isAtBottom()) _hideJumpButton();
        });
        
        function _levelClass(lv) {
            const meta = SNW.C.LOG_LEVEL_META[lv] || SNW.C.LOG_LEVEL_META[3];
            return 'snw-log-' + meta.color;
        }
        
        function _trim() {
            while (body.children.length > maxLines) {
                body.removeChild(body.firstElementChild);
            }
        }
        
        return {
            append(entry) {
                if (!entry) return;
                if (filterLevel !== 0 && entry.lv !== filterLevel) return;
                
                const wasAtBottom = _isAtBottom();
                
                const row = SNW.DomUtil.html`
                    <div class="snw-log-row ${_levelClass(entry.lv)}">
                        <span class="snw-log-ts">${SNW.TimeUtil.msToSecLabel(entry.ts || 0)}</span>
                        <span class="snw-log-lv">${(SNW.C.LOG_LEVEL_META[entry.lv] || {}).code || '?'}</span>
                        <span class="snw-log-msg">${entry.msg || ''}</span>
                    </div>`;
                body.appendChild(row);
                _trim();
                
                // [O-12] 스마트 스크롤
                if (wasAtBottom) {
                    body.scrollTop = body.scrollHeight;
                } else {
                    _showJumpButton();
                }
            },
            clear() { body.innerHTML = '';
                _hideJumpButton(); },
            setFilter(lv) {
                filterLevel = Number(lv) || 0;
                Array.from(body.children).forEach(ch => {
                    if (filterLevel === 0) {
                        ch.style.display = '';
                    } else {
                        const lvEl = ch.querySelector('.snw-log-lv');
                        const lvStr = (SNW.C.LOG_LEVEL_META[filterLevel] || {}).code || '';
                        ch.style.display = (lvEl && lvEl.textContent.trim() === lvStr) ? '' : 'none';
                    }
                });
            }
        };
    };
    
})(window.SNW);

/* ---- 135.util.preview.js (11356 bytes) ---- */
// =========================================================
// 135.util.preview.js — 물리 파형 미리보기 (S20 미러)
// Layer 1 (유틸리티 엔진)
// - 실제 팬 미가동, 클라이언트에서 물리 파형 시뮬레이션
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    // 캐시 (한 번 로드 후 재사용)
    let _windDict = null;
    let _loading = null;

    async function ensureWindDict() {
        if (_windDict) return _windDict;
        if (_loading) return _loading;
        _loading = SNW.Api.getWindDict().then(d => {
            _windDict = d || { presets: [], styles: [] };
            return _windDict;
        }).catch(() => {
            _windDict = { presets: [], styles: [] };
            return _windDict;
        });
        return _loading;
    }

    function findPreset(code) {
        if (!_windDict || !_windDict.presets) return null;
        return _windDict.presets.find(p => p.code === code) || null;
    }

    function findStyle(code) {
        if (!_windDict || !_windDict.styles) return null;
        return _windDict.styles.find(s => s.code === code) || null;
    }

    // =========================================================
    // 물리 파라미터 계산 (S20 미러)
    // =========================================================
    function resolveParams(presetCode, styleCode, override) {
        const preset = findPreset(presetCode);
        const style = findStyle(styleCode || 'BALANCE');
        if (!preset) return null;

        const pf = preset.factors || {};
        const sf = style ? style.factors : { intensityFactor: 1, variabilityFactor: 1, gustFactor: 1 };
        const ov = override || { enabled: false };

        // 강도
        let intensity = (pf.windIntensity || 50) * (sf.intensityFactor || 1);
        if (ov.enabled && ov.windIntensity >= 0) intensity = ov.windIntensity;
        intensity = Math.max(0, Math.min(100, intensity));

        // 변동성
        let variability = (pf.windVariability || 40) * (sf.variabilityFactor || 1);
        if (ov.enabled && ov.windVariability >= 0) variability = ov.windVariability;
        variability = Math.max(0, Math.min(100, variability));

        // 돌풍
        let gustFreq = (pf.gustFrequency || 30) * (sf.gustFactor || 1);
        if (ov.enabled && ov.gustFrequency >= 0) gustFreq = ov.gustFrequency;
        gustFreq = Math.max(0, Math.min(100, gustFreq));

        // 물리 파라미터
        const baseMin = pf.baseMinWind || 1.0;
        const baseMax = pf.baseMaxWind || 5.0;
        const turbSigma = pf.turbulenceIntensitySigma || 0.5;
        const thermalStr = pf.thermalBubbleStrength || 2.0;

        return { intensity, variability, gustFreq, baseMin, baseMax, turbSigma, thermalStr };
    }

    // =========================================================
    // 30초 파형 생성 (100ms × 300 샘플)
    // =========================================================
    function generateWaveform(params) {
        if (!params) return null;

        const { intensity, variability, gustFreq, baseMin, baseMax, turbSigma } = params;

        // 평균 풍속 (강도 기반)
        const avg = baseMin + (baseMax - baseMin) * (intensity / 100);

        // 난류 진폭 (변동성 기반)
        const turbAmp = (variability / 100) * (baseMax - baseMin) * turbSigma;

        // 돌풍 확률 (100ms당)
        const gustProb = (gustFreq / 100) * 0.02;
        const gustMul  = 1.8;

        const points = [];
        let gustRemain = 0;

        for (let i = 0; i < 300; i++) {
            const t = i * 100;  // ms

            // 다중 사인파 난류
            const turb =
                Math.sin(t * 0.0015) * turbAmp * 0.5 +
                Math.sin(t * 0.0053) * turbAmp * 0.3 +
                Math.sin(t * 0.0121) * turbAmp * 0.2;

            // 돌풍
            let gustBoost = 0;
            if (gustRemain > 0) {
                gustBoost = avg * (gustMul - 1) * 0.6;
                gustRemain--;
            } else if (Math.random() < gustProb) {
                gustRemain = 5 + Math.floor(Math.random() * 15);
            }

            const wind = Math.max(0.2, Math.min(11.0, avg + turb + gustBoost));

            points.push({
                t,
                wind: Number(wind.toFixed(2)),
                gust: gustBoost > 0,
            });
        }

        return { points, avg: Number(avg.toFixed(2)), intensity, variability, gustFreq };
    }

    // =========================================================
    // Public API
    // =========================================================
    SNW.Preview = {
        async init() {
            await ensureWindDict();
        },

        /**
         * 단일 Step의 예상 파형
         * @param {Object} step ST_A20_Step_t
         * @returns {Promise<{points, avg, intensity, variability, gustFreq} | null>}
         */
        async generateStep(step) {
            await ensureWindDict();

            if (!step) return null;

            // REST: 완전 정지
            if (step.type === 'REST') {
                const points = [];
                for (let i = 0; i < 300; i++) {
                    points.push({ t: i * 100, wind: 0, gust: false });
                }
                return { points, avg: 0, intensity: 0, variability: 0, gustFreq: 0 };
            }

            // FIXED: 고정 PWM
            if (step.type === 'FIXED') {
                const speed = Number(step.fixedSpeed) || 0;
                const windEquivalent = (speed / 100) * 8;   // PWM% → m/s 근사
                const points = [];
                for (let i = 0; i < 300; i++) {
                    points.push({ t: i * 100, wind: windEquivalent, gust: false });
                }
                return { points, avg: Number(windEquivalent.toFixed(2)), intensity: speed, variability: 0, gustFreq: 0 };
            }

            // PRESET: 물리 시뮬레이션
            const params = resolveParams(
                step.presetCode || 'OCEAN',
                step.styleCode  || 'BALANCE',
                step.override);
            if (!params) return null;

            return generateWaveform(params);
        },

        /**
         * 여러 Step을 연결한 Playlist 전체 파형 (30초 압축)
         * @param {Array} steps
         * @returns {Promise<{points}>}
         */
        async generatePlaylistWaveform(steps) {
            await ensureWindDict();

            if (!steps || steps.length === 0) return null;

            const total = 300;
            const perStep = Math.floor(total / steps.length);
            const allPoints = [];

            for (let i = 0; i < steps.length; i++) {
                const wave = await this.generateStep(steps[i]);
                if (!wave) continue;

                // 각 Step 파형을 perStep 샘플로 다운샘플
                const stepSamples = Math.min(perStep, wave.points.length);
                for (let j = 0; j < stepSamples; j++) {
                    const idx = Math.floor((j / stepSamples) * wave.points.length);
                    allPoints.push(wave.points[idx]);
                }
            }

            // 시간 재부여
            allPoints.forEach((p, i) => { p.t = i * 100; });

            return { points: allPoints };
        },

        /**
         * 5축 감성 레이더
         */
        toFeelings(intensity, variability, gustFreq) {
            const clamp = v => Math.max(0, Math.min(5, Math.round(v)));
            return {
                coolness:   clamp(intensity / 20),                    // 시원함
                smoothness: clamp(5 - variability / 20),              // 부드러움
                dynamism:   clamp((variability + gustFreq) / 40),     // 역동성
                calmness:   clamp(5 - (intensity + gustFreq) / 40),   // 차분함
                freshness:  clamp((intensity + gustFreq) / 40),       // 청량감
            };
        },

        // =========================================================
        // [ADR-5] 파사드 API (Studio / Schedule / Simulation 통합)
        // =========================================================
        async showModal(config) {
            if (!SNW.UI || typeof SNW.UI.simulationModal !== 'function') {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Preview] simulationModal 미로드');
                return null;
            }

            const isSegmentForm = config && config.presetCode && !config.a && !config.mode;
            const normalized = isSegmentForm
                ? {
                    mode: 'single',
                    a: {
                        presetCode: config.presetCode || 'OCEAN',
                        styleCode:  config.styleCode  || 'BALANCE',
                        override:   config.override   || { enabled: false },
                    },
                }
                : config;

            return SNW.UI.simulationModal(normalized);
        },

        async generate(presetCode, styleCode, override) {
            return this.generateStep({
                type:       'PRESET',
                presetCode: presetCode || 'OCEAN',
                styleCode:  styleCode  || 'BALANCE',
                override:   override   || { enabled: false },
            });
        },

        _animate(canvas, points) {
            if (!canvas || !points || points.length === 0) return;

            const ctx = canvas.getContext('2d');
            const w   = canvas.width;
            const h   = canvas.height;

            let minV = Infinity, maxV = -Infinity;
            for (const p of points) {
                const v = Number(p.wind) || 0;
                if (v < minV) minV = v;
                if (v > maxV) maxV = v;
            }
            if (!Number.isFinite(minV) || !Number.isFinite(maxV) || maxV <= minV) {
                minV = 0; maxV = 1;
            }

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(139,148,158,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = (h / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            const pad = 10;
            const innerH = h - pad * 2;
            const n = points.length;

            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const x = (i / (n - 1)) * w;
                const y = pad + (h - pad * 2) - ((points[i].wind - minV) / (maxV - minV)) * innerH;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = 'rgba(240,136,62,0.9)';
            for (let i = 0; i < n; i++) {
                if (!points[i].gust) continue;
                const x = (i / (n - 1)) * w;
                const y = pad + (h - pad * 2) - ((points[i].wind - minV) / (maxV - minV)) * innerH;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        },
    };
})(window.SNW);


/* ---- 140.ui.simulation.js (16087 bytes) ---- */
// =========================================================
// 140.ui.simulation.js — Simulation 모달 (5축 레이더 + A/B 비교)
// Layer 3 (UI 시뮬레이션 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
SNW.UI = SNW.UI || {};
(function(SNW) {
    'use strict';

    /**
     * Simulation 모달
     * @param {Object} config {
     *   mode: 'single' | 'ab',
     *   a: { presetCode, styleCode, override },  // 필수
     *   b: { presetCode, styleCode, override },  // mode='ab'일 때
     *   onApply: (chosenConfig) => void,         // "적용" 버튼
     * }
     */
    SNW.UI.simulationModal = async function(config) {
        if (!config || !config.a) return null;
        if (SNW.Preview && typeof SNW.Preview.init === 'function') {
            await SNW.Preview.init();
        }

        // =========================================================
        // A 파형 생성
        // =========================================================
        const waveA = await SNW.Preview.generateStep({
            type: 'PRESET',
            presetCode: config.a.presetCode || 'OCEAN',
            styleCode:  config.a.styleCode  || 'BALANCE',
            override:   config.a.override || { enabled: false },
        });

        const feelingsA = SNW.Preview.toFeelings(
            waveA.intensity, waveA.variability, waveA.gustFreq);

        // =========================================================
        // B 파형 생성 (A/B 모드)
        // =========================================================
        let waveB = null, feelingsB = null;
        if (config.mode === 'ab' && config.b) {
            waveB = await SNW.Preview.generateStep({
                type: 'PRESET',
                presetCode: config.b.presetCode || 'COUNTRY_BREEZE',
                styleCode:  config.b.styleCode  || 'RELAX',
                override:   config.b.override || { enabled: false },
            });
            feelingsB = SNW.Preview.toFeelings(
                waveB.intensity, waveB.variability, waveB.gustFreq);
        }

        // =========================================================
        // DOM
        // =========================================================
        const content = document.createElement('div');
        content.className = 'snw-sim';
        content.innerHTML = `
            <div class="snw-sim__tabs" style="display:flex;gap:6px;margin-bottom:12px;">
                <button type="button" class="snw-tab-btn ${config.mode !== 'ab' ? 'is-active' : ''}" data-mode="single">🎬 단일 미리보기</button>
                <button type="button" class="snw-tab-btn ${config.mode === 'ab' ? 'is-active' : ''}" data-mode="ab">⚖ A/B 비교</button>
            </div>

            <div class="snw-sim__wave-section" data-slot="wave-a">
                <div class="snw-sim__wave-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;font-weight:600;">
                    <span class="snw-sim__badge" style="padding:2px 8px;border-radius:4px;background:rgba(74,158,255,0.15);color:var(--snw-primary,#4a9eff);">${config.mode === 'ab' ? 'A' : '설정'}</span>
                    <span>${SNW.DomUtil ? SNW.DomUtil.escape(config.a.presetCode + ' · ' + config.a.styleCode) : ''}</span>
                </div>
                <canvas class="snw-sim__canvas" data-slot="canvas-a" width="600" height="160" style="width:100%;height:160px;background:var(--snw-surface-2,#12161c);border-radius:var(--snw-radius,8px);display:block;"></canvas>
                <div class="snw-sim__meta" data-slot="meta-a" style="display:flex;justify-content:space-around;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-top:6px;"></div>
            </div>

            <div class="snw-sim__wave-section" data-slot="wave-b" ${config.mode !== 'ab' ? 'style="display:none;margin-top:12px;"' : 'style="margin-top:12px;"'}>
                <div class="snw-sim__wave-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;font-weight:600;">
                    <span class="snw-sim__badge snw-sim__badge--b" style="padding:2px 8px;border-radius:4px;background:rgba(240,136,62,0.15);color:#f0883e;">B</span>
                    <span>${config.b ? (SNW.DomUtil ? SNW.DomUtil.escape(config.b.presetCode + ' · ' + config.b.styleCode) : '') : '-'}</span>
                </div>
                <canvas class="snw-sim__canvas" data-slot="canvas-b" width="600" height="160" style="width:100%;height:160px;background:var(--snw-surface-2,#12161c);border-radius:var(--snw-radius,8px);display:block;"></canvas>
                <div class="snw-sim__meta" data-slot="meta-b" style="display:flex;justify-content:space-around;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-top:6px;"></div>
            </div>

            <div class="snw-sim__feelings" style="margin-top:16px;">
                <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">감성 레이더 (Feelings)</h3>
                <div class="snw-sim__radar-wrap" style="text-align:center;">
                    <canvas class="snw-sim__radar" data-slot="radar" width="280" height="280" style="width:280px;height:280px;"></canvas>
                </div>
                <div class="snw-sim__feelings-legend" data-slot="legend" style="display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:12px;"></div>
            </div>

            <div class="snw-sim__actions" style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
                <button type="button" class="snw-btn" data-action="close" style="padding:8px 16px;">닫기</button>
                ${config.mode === 'ab'
                    ? `<button type="button" class="snw-btn" data-action="apply-b" style="padding:8px 16px;">B로 적용</button>
                       <button type="button" class="snw-btn snw-btn-primary" data-action="apply-a" style="padding:8px 16px;">A로 적용</button>`
                    : `<button type="button" class="snw-btn snw-btn-primary" data-action="apply-a" style="padding:8px 16px;">✓ 이 설정 적용</button>`}
            </div>
        `;

        // =========================================================
        // 파형 애니메이션
        // =========================================================
        const canvasA = content.querySelector('[data-slot="canvas-a"]');
        const canvasB = content.querySelector('[data-slot="canvas-b"]');
        const radar   = content.querySelector('[data-slot="radar"]');

        animateWave(canvasA, waveA.points, '#4a9eff');
        if (waveB) animateWave(canvasB, waveB.points, '#f0883e');

        // =========================================================
        // 메타 표시
        // =========================================================
        renderMeta(content.querySelector('[data-slot="meta-a"]'), waveA);
        if (waveB) renderMeta(content.querySelector('[data-slot="meta-b"]'), waveB);

        // =========================================================
        // 5축 레이더
        // =========================================================
        drawRadar(radar, feelingsA, feelingsB);

        // 범례
        const legend = content.querySelector('[data-slot="legend"]');
        legend.innerHTML = `
            <div class="snw-sim__legend-item" style="display:flex;align-items:center;gap:4px;">
                <span class="snw-sim__legend-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4a9eff"></span>
                ${config.mode === 'ab' ? 'A' : '현재'}
            </div>
            ${config.mode === 'ab' ? `
                <div class="snw-sim__legend-item" style="display:flex;align-items:center;gap:4px;">
                    <span class="snw-sim__legend-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f0883e"></span>
                    B
                </div>
            ` : ''}
        `;

        // =========================================================
        // 액션
        // =========================================================
        let resolved = false;
        let promiseResolve;

        const promise = new Promise(res => { promiseResolve = res; });

        let modalRef = null;
        const close = (chosen) => {
            if (resolved) return;
            resolved = true;
            if (modalRef && typeof modalRef.close === 'function') modalRef.close();
            promiseResolve(chosen);
        };

        modalRef = SNW.UI.modal(
            '🎬 바람 스튜디오 (Simulation)', content,
            null,
            () => { close(null); },                    // [Phase5 5.4 N-19] onCancel → Promise resolve(null)
            { hideOk: true, hideCancel: true, width: '560px' }
        );

        const btnClose = content.querySelector('[data-action="close"]');
        const btnApplyA = content.querySelector('[data-action="apply-a"]');
        const btnApplyB = content.querySelector('[data-action="apply-b"]');

        if (btnClose) btnClose.onclick = () => close(null);
        if (btnApplyA) btnApplyA.onclick = () => close(config.a);
        if (btnApplyB) btnApplyB.onclick = () => close(config.b);

        // 탭 전환 (A/B)
        content.querySelectorAll('[data-mode]').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.getAttribute('data-mode');
                content.querySelectorAll('[data-mode]').forEach(b =>
                    b.classList.toggle('is-active', b === btn));
                const wb = content.querySelector('[data-slot="wave-b"]');
                if (wb) wb.style.display = (mode === 'ab') ? 'block' : 'none';

                drawRadar(radar, feelingsA, (mode === 'ab') ? feelingsB : null);
            };
        });

        return promise;
    };

    // =========================================================
    // 내부: 파형 애니메이션
    // =========================================================
    function animateWave(canvas, points, color) {
        if (!canvas || !points || points.length === 0) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        let minV = Infinity, maxV = -Infinity;
        points.forEach(p => {
            if (p.wind < minV) minV = p.wind;
            if (p.wind > maxV) maxV = p.wind;
        });
        if (maxV <= minV) maxV = minV + 1;

        let drawn = 0;
        const step = 3;

        const drawNext = () => {
            if (drawn >= points.length || !canvas.isConnected) return;

            ctx.clearRect(0, 0, w, h);

            // 그리드
            ctx.strokeStyle = 'rgba(139,148,158,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = (h / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // 파형
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i <= drawn; i++) {
                const p = points[i];
                const x = (i / (points.length - 1)) * w;
                const y = h - ((p.wind - minV) / (maxV - minV)) * (h - 20) - 10;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();

            // 돌풍 마커
            for (let i = 0; i <= drawn; i++) {
                if (!points[i].gust) continue;
                const x = (i / (points.length - 1)) * w;
                const y = h - ((points[i].wind - minV) / (maxV - minV)) * (h - 20) - 10;
                ctx.fillStyle = 'rgba(240,136,62,0.9)';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            drawn += step;
            setTimeout(drawNext, 20);
        };
        drawNext();
    }

    // =========================================================
    // 내부: 메타 표시
    // =========================================================
    function renderMeta(el, wave) {
        if (!el || !wave) return;
        el.innerHTML = `
            <div>평균 <b>${wave.avg ? wave.avg.toFixed(1) : 0} m/s</b></div>
            <div>강도 <b>${Math.round(wave.intensity || 0)}%</b></div>
            <div>변동성 <b>${Math.round(wave.variability || 0)}%</b></div>
            <div>돌풍 <b>${Math.round(wave.gustFreq || 0)}%</b></div>
        `;
    }

    // =========================================================
    // 내부: 5축 레이더
    // =========================================================
    function drawRadar(canvas, fA, fB) {
        if (!canvas || !fA) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(w, h) / 2 - 36;

        ctx.clearRect(0, 0, w, h);

        const axes = [
            { key: 'coolness',   label: '시원함',   angle: -Math.PI / 2 },
            { key: 'freshness',  label: '청량감',   angle: -Math.PI / 2 + Math.PI * 2 / 5 },
            { key: 'dynamism',   label: '역동성',   angle: -Math.PI / 2 + Math.PI * 4 / 5 },
            { key: 'smoothness', label: '부드러움', angle: -Math.PI / 2 + Math.PI * 6 / 5 },
            { key: 'calmness',   label: '차분함',   angle: -Math.PI / 2 + Math.PI * 8 / 5 },
        ];

        // 그리드 (5단계 원)
        ctx.strokeStyle = 'rgba(139,148,158,0.15)';
        ctx.lineWidth = 1;
        for (let ring = 1; ring <= 5; ring++) {
            const r = (ring / 5) * maxR;
            ctx.beginPath();
            axes.forEach((axis, i) => {
                const x = cx + Math.cos(axis.angle) * r;
                const y = cy + Math.sin(axis.angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        // 축
        ctx.strokeStyle = 'rgba(139,148,158,0.3)';
        axes.forEach(axis => {
            const x = cx + Math.cos(axis.angle) * maxR;
            const y = cy + Math.sin(axis.angle) * maxR;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
        });

        // 라벨
        ctx.fillStyle = '#8b949e';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        axes.forEach(axis => {
            const x = cx + Math.cos(axis.angle) * (maxR + 18);
            const y = cy + Math.sin(axis.angle) * (maxR + 18);
            ctx.fillText(axis.label, x, y);
        });

        // A 폴리곤
        drawPolygon(ctx, cx, cy, maxR, axes, fA, 'rgba(74,158,255,0.35)', 'rgba(74,158,255,1)');

        // B 폴리곤
        if (fB) {
            drawPolygon(ctx, cx, cy, maxR, axes, fB, 'rgba(240,136,62,0.25)', 'rgba(240,136,62,1)');
        }

        // 중심점
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPolygon(ctx, cx, cy, maxR, axes, feelings, fillColor, strokeColor) {
        ctx.beginPath();
        axes.forEach((axis, i) => {
            const val = feelings[axis.key] || 0;
            const r = (val / 5) * maxR;
            const x = cx + Math.cos(axis.angle) * r;
            const y = cy + Math.sin(axis.angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
})(window.SNW);



/* ---- 145.ai.client.js (1920 bytes) ---- */
// =========================================================
// 145.ai.client.js — SNW.AIClient
// Layer 3 (코어 UI / AI 통신 클라이언트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';

	const CACHE_MAX = 20;
	const HISTORY_MAX = 20;
	const STORAGE_KEY = 'snw.ai.history';

	const _cache = new Map();
	let _pendingPromise = null;

	SNW.AIClient = {
		loadHistory() {
			try {
				const s = localStorage.getItem(STORAGE_KEY);
				return s ? JSON.parse(s).slice(-HISTORY_MAX) : [];
			} catch {
				return [];
			}
		},

		saveHistory(hist) {
			try {
				if (!Array.isArray(hist)) return;
				localStorage.setItem(STORAGE_KEY, JSON.stringify(hist.slice(-HISTORY_MAX)));
			} catch {}
		},

		clearHistory() {
			try {
				localStorage.removeItem(STORAGE_KEY);
				_cache.clear();
			} catch {}
		},

		async send(message, history = [], opts = {}) {
			const text = (message || '').trim();
			if (!text) return null;

			const lang = opts.lang || 'ko';
			const voiceMode = !!opts.voiceMode;
			const cacheKey = `${text}|${history.length}|${lang}|${voiceMode ? 'v' : 't'}`;

			if (_cache.has(cacheKey)) {
				const entry = _cache.get(cacheKey);
				if (Date.now() - entry.ts < 60000) {
					return entry.data;
				}
				_cache.delete(cacheKey);
			}

			if (_pendingPromise) return _pendingPromise;

			_pendingPromise = (async () => {
				try {
					const body = {
						message: text,
						history: history.slice(-6),
						lang: lang,
						voiceMode: voiceMode
					};
					const res = await SNW.Api.gemini(body);

					_cache.set(cacheKey, { ts: Date.now(), data: res });
					if (_cache.size > CACHE_MAX) {
						const firstKey = _cache.keys().next().value;
						_cache.delete(firstKey);
					}
					return res;
				} finally {
					_pendingPromise = null;
				}
			})();

			return _pendingPromise;
		}
	};
})(window.SNW);



/* ---- 146.ai.voice.js (4330 bytes) ---- */
// =========================================================
// 146.ai.voice.js — SNW.AIVoice
// Layer 3 (음성 입력 STT & 음성 합성 TTS)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
	'use strict';

	let _currentRecognition = null;
	let _wakeRecognition = null;

	SNW.AIVoice = {
		isSTTSupported() {
			return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
		},

		isTTSSupported() {
			return ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
		},

		detectLang(text) {
			if (!text) return 'ko-KR';
			const koMatches = text.match(/[가-힣]/g) || [];
			const cleanLen = text.replace(/\s/g, '').length;
			if (cleanLen === 0) return 'ko-KR';
			return (koMatches.length / cleanLen > 0.2) ? 'ko-KR' : 'en-US';
		},

		startListening(opts = {}) {
			return new Promise((resolve, reject) => {
				if (!this.isSTTSupported()) {
					return reject(new Error('STT_NOT_SUPPORTED'));
				}

				this.stopListening();

				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				const rec = new SpeechRecognition();
				_currentRecognition = rec;

				rec.lang = opts.lang || 'ko-KR';
				rec.continuous = false;
				rec.interimResults = false;
				rec.maxAlternatives = 1;

				let finished = false;

				rec.onresult = (e) => {
					finished = true;
					const transcript = (e.results && e.results[0] && e.results[0][0])
						? e.results[0][0].transcript
						: '';
					resolve({ transcript });
				};

				rec.onerror = (e) => {
					finished = true;
					reject(new Error(e.error || 'STT_ERROR'));
				};

				rec.onend = () => {
					_currentRecognition = null;
					if (!finished) {
						resolve({ transcript: '' });
					}
				};

				try {
					rec.start();
				} catch (err) {
					reject(err);
				}
			});
		},

		stopListening() {
			if (_currentRecognition) {
				try { _currentRecognition.abort(); } catch { }
				_currentRecognition = null;
			}
		},

		speak(text, opts = {}) {
			if (!this.isTTSSupported() || !text) return;

			this.stopSpeaking();

			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = opts.lang || this.detectLang(text);
			utter.rate = opts.rate || 1.0;
			utter.pitch = opts.pitch || 1.0;

			// 최적 보이스 탐색
			try {
				const voices = window.speechSynthesis.getVoices() || [];
				const langPrefix = utter.lang.substring(0, 2);
				const matchedVoice = voices.find(v => v.lang.startsWith(langPrefix));
				if (matchedVoice) utter.voice = matchedVoice;
			} catch { }

			window.speechSynthesis.speak(utter);
		},

		stopSpeaking() {
			if (this.isTTSSupported()) {
				try { window.speechSynthesis.cancel(); } catch { }
			}
		},

		// =====================================================
		// 웨이크워드 감지 (옵션: "헤이 윈드", "hey wind")
		// =====================================================
		startWakeDetection(opts = {}) {
			if (!this.isSTTSupported()) return false;
			this.stopWakeDetection();

			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			const rec = new SpeechRecognition();
			_wakeRecognition = rec;

			rec.continuous = true;
			rec.interimResults = true;
			rec.lang = opts.lang || 'ko-KR';

			const wakeKeywords = ['헤이 윈드', '헤이윈드', '헤이 wind', 'hey wind', 'hi wind'];
			let isCooldown = false;

			rec.onresult = (e) => {
				if (isCooldown) return;
				for (let i = e.resultIndex; i < e.results.length; i++) {
					const transcript = (e.results[i][0].transcript || '').toLowerCase();
					const matched = wakeKeywords.some(w => transcript.includes(w));
					if (matched) {
						isCooldown = true;
						if (opts.onWake) opts.onWake();
						setTimeout(() => { isCooldown = false; }, 4000);
						break;
					}
				}
			};

			rec.onerror = (e) => {
				if (e.error !== 'no-speech' && opts.onError) opts.onError(e);
			};

			rec.onend = () => {
				if (_wakeRecognition === rec) {
					try { rec.start(); } catch { }
				}
			};

			try {
				rec.start();
				return true;
			} catch (err) {
				return false;
			}
		},

		stopWakeDetection() {
			if (_wakeRecognition) {
				const rec = _wakeRecognition;
				_wakeRecognition = null;
				try { rec.abort(); } catch { }
			}
		}
	};
})(window.SNW);



/* ---- 147.ai.live.js (9572 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 147.ai.live.js
 * 모듈약어 : SNW.AiLive
 * 모듈명 : Smart Nature Wind Gemini Live Voice Client (Bidi WS & Guardrails)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Gemini Live Bi-directional WebSocket 연결 관리
 *  - 16kHz 마이크 스트리밍 / 24kHz 스피커 재생 큐 통합
 *  - Barge-in(인터럽션) 실시간 처리
 *  - 12개 ESP32 스마트 바람 제어 도구 브리지 실행
 *  - 30초 주기 사용량(오디오 초, 비용) 측정 및 NVS 동기화
 *  - 일일 30분 상한 도달 시 안전 종료 및 REST 폴백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _ws = null;
	let _isConnected = false;
	let _isConnecting = false;
	let _sessionStartTime = 0;
	let _lastReportTime = 0;
	let _usageIntervalId = null;

	let _callbacks = {
		onStateChange: null, // (state, details)
		onText: null,        // (text, isComplete)
		onToolCall: null,    // (name, args, result)
		onVolume: null,      // (level 0..1)
		onError: null,       // (err)
		onCostUpdate: null   // (costStatus)
	};

	function getTodayDateStr() {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const AiLive = {
		isSupported() {
			return !!(window.WebSocket && SNW.AudioCapture && SNW.AudioCapture.isSupported());
		},

		isConnected() {
			return _isConnected;
		},

		isConnecting() {
			return _isConnecting;
		},

		async startSession(callbacks = {}) {
			if (_isConnected || _isConnecting) return;
			_callbacks = Object.assign(_callbacks, callbacks);

			_isConnecting = true;
			this._emitState('connecting');

			const todayDate = getTodayDateStr();

			try {
				// 1. 일일 30분 가드레일 토큰 획득
				const tokenRes = await SNW.API.getAiLiveToken(todayDate);
				if (tokenRes.level === 'cap' || (tokenRes.remainingSec !== undefined && tokenRes.remainingSec <= 0)) {
					const msg = tokenRes.error || (SNW.I18n ? SNW.I18n.t('ai.dailyCapReached') : 'Daily Live limit reached (30 min)');
					throw new Error(msg);
				}

				if (callbacks.onCostUpdate) {
					callbacks.onCostUpdate(tokenRes);
				}

				// 2. 초기 Live WS 설정 조회 (엄격 프롬프트 및 도구 선언)
				const cfgRes = await SNW.API.getAiLiveConfig();
				const token = tokenRes.token;
				const wsUrl = `${tokenRes.wsUrl || 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'}?key=${token}`;

				// 3. AudioPlayback 초기화
				if (SNW.AudioPlayback) {
					SNW.AudioPlayback.init({
						onStateChange: (isPlaying) => {
							this._emitState(isPlaying ? 'speaking' : 'listening');
						}
					});
				}

				// 4. WebSocket 연결
				_ws = new WebSocket(wsUrl);

				_ws.onopen = async () => {
					_isConnected = true;
					_isConnecting = false;
					_sessionStartTime = Date.now();
					_lastReportTime = _sessionStartTime;

					// 초기 setup 메시지 전송
					this._sendSetup(cfgRes, tokenRes.voiceName);

					// 마이크 캡처 시작
					await this._startMicCapture();

					// 30초 주기 사용량 보고 타이머 시작
					this._startUsageReporting();

					this._emitState('connected');
				};

				_ws.onmessage = async (event) => {
					await this._handleMessage(event.data);
				};

				_ws.onerror = (e) => {
					console.error('[AiLive] WebSocket error:', e);
					if (_callbacks.onError) _callbacks.onError(new Error('WebSocket connection error'));
				};

				_ws.onclose = (event) => {
					this._handleClose(event);
				};

			} catch (err) {
				_isConnecting = false;
				this.stopSession();
				if (_callbacks.onError) {
					_callbacks.onError(err);
				}
				this._emitState('idle');
				throw err;
			}
		},

		_sendSetup(cfgRes, voiceName) {
			const setupMsg = {
				setup: {
					model: 'models/gemini-2.0-flash-exp',
					generationConfig: {
						responseModalities: ['AUDIO'],
						speechConfig: {
							voiceConfig: {
								prebuiltVoiceConfig: {
									voiceName: voiceName || 'Aoede'
								}
							}
						}
					},
					systemInstruction: {
						parts: [{ text: (cfgRes && cfgRes.systemInstruction) || 'You are SmartNatureWind voice controller.' }]
					},
					tools: (cfgRes && cfgRes.tools) || []
				}
			};
			_ws.send(JSON.stringify(setupMsg));
		},

		async _startMicCapture() {
			if (!SNW.AudioCapture) return;
			await SNW.AudioCapture.start({
				onChunk: (base64Pcm) => {
					if (!_isConnected || !_ws || _ws.readyState !== WebSocket.OPEN) return;
					const chunkMsg = {
						realtimeInput: {
							mediaChunks: [
								{
									mimeType: 'audio/pcm;rate=16000',
									data: base64Pcm
								}
							]
						}
					};
					_ws.send(JSON.stringify(chunkMsg));
				},
				onVolume: (level) => {
					if (_callbacks.onVolume) {
						_callbacks.onVolume(level);
					}
				},
				onError: (err) => {
					console.error('[AiLive] AudioCapture error:', err);
					if (_callbacks.onError) _callbacks.onError(err);
				}
			});
		},

		async _handleMessage(data) {
			let msg = null;
			try {
				if (typeof data === 'string') {
					msg = JSON.parse(data);
				} else if (data instanceof Blob) {
					const text = await data.text();
					msg = JSON.parse(text);
				}
			} catch (e) {
				console.warn('[AiLive] JSON parse error:', e);
				return;
			}

			if (!msg) return;

			// 1. 모델 발화 파트 처리 (오디오/텍스트)
			if (msg.serverContent) {
				const sc = msg.serverContent;

				// Barge-in 인터럽트 수신 시 스피커 즉시 중단
				if (sc.interrupted) {
					if (SNW.AudioPlayback) {
						SNW.AudioPlayback.flush();
					}
					this._emitState('interrupted');
				}

				if (sc.modelTurn && sc.modelTurn.parts) {
					for (const part of sc.modelTurn.parts) {
						// 24kHz 오디오 청크
						if (part.inlineData && part.inlineData.data) {
							if (SNW.AudioPlayback) {
								SNW.AudioPlayback.enqueueBase64Pcm(part.inlineData.data);
							}
						}
						// 텍스트 청크
						if (part.text && _callbacks.onText) {
							_callbacks.onText(part.text, false);
						}
					}
				}

				if (sc.turnComplete && _callbacks.onText) {
					_callbacks.onText('', true);
				}
			}

			// 2. Tool Call (도구 실행) 처리
			if (msg.toolCall) {
				this._handleToolCall(msg.toolCall);
			}
		},

		async _handleToolCall(toolCall) {
			this._emitState('executing');
			try {
				const calls = toolCall.functionCalls || [];
				// ESP32 백엔드 브리지 호출
				const bridgeRes = await SNW.API.callAiLiveFunction({ functionCalls: calls });
				const responses = (bridgeRes && bridgeRes.functionResponses) || [];

				if (_callbacks.onToolCall) {
					for (let i = 0; i < calls.length; i++) {
						const c = calls[i];
						const r = responses[i] ? responses[i].response : null;
						_callbacks.onToolCall(c.name, c.args, r);
					}
				}

				// Live WebSocket으로 응답 전송
				if (_isConnected && _ws && _ws.readyState === WebSocket.OPEN) {
					const replyMsg = {
						toolResponse: {
							functionResponses: responses
						}
					};
					_ws.send(JSON.stringify(replyMsg));
				}
			} catch (e) {
				console.error('[AiLive] Tool execution error:', e);
			}
		},

		_startUsageReporting() {
			this._stopUsageReporting();
			_usageIntervalId = setInterval(() => {
				this._reportUsageDelta();
			}, 30000); // 30초 주기
		},

		_stopUsageReporting() {
			if (_usageIntervalId) {
				clearInterval(_usageIntervalId);
				_usageIntervalId = null;
			}
		},

		async _reportUsageDelta() {
			if (!_sessionStartTime) return;
			const now = Date.now();
			const elapsedSec = Math.round((now - _lastReportTime) / 1000);
			if (elapsedSec <= 0) return;

			_lastReportTime = now;
			const todayDate = getTodayDateStr();

			// 오디오 1초당 비용 추정 ($0.0003/sec -> x1000: 0.3)
			const estCostX1000 = Math.round(elapsedSec * 0.3);

			try {
				const res = await SNW.API.reportAiUsage({
					todayDate,
					audioSec: elapsedSec,
					turnCount: 0,
					costUsdX1000: estCostX1000
				});

				if (_callbacks.onCostUpdate) {
					_callbacks.onCostUpdate(res);
				}

				// 상한 도달 시 자동 종료
				if (res && res.level === 'cap') {
					const msg = SNW.I18n ? SNW.I18n.t('ai.dailyCapReached') : 'Daily Live audio limit reached (30 min)';
					if (_callbacks.onError) _callbacks.onError(new Error(msg));
					this.stopSession();
				}
			} catch (e) {
				console.warn('[AiLive] Failed to report usage:', e);
			}
		},

		_handleClose(event) {
			_isConnected = false;
			_isConnecting = false;
			this._stopUsageReporting();
			this._reportUsageDelta(); // 남은 사용량 최종 보고

			if (SNW.AudioCapture) SNW.AudioCapture.stop();
			if (SNW.AudioPlayback) SNW.AudioPlayback.flush();

			this._emitState('closed');
		},

		stopSession() {
			_isConnecting = false;
			if (_isConnected && _ws) {
				try {
					_ws.close();
				} catch (_) {}
			}
			_ws = null;
			_isConnected = false;

			this._stopUsageReporting();
			this._reportUsageDelta();

			if (SNW.AudioCapture) SNW.AudioCapture.stop();
			if (SNW.AudioPlayback) SNW.AudioPlayback.close();

			this._emitState('idle');
		},

		_emitState(state, details) {
			if (_callbacks.onStateChange) {
				_callbacks.onStateChange(state, details);
			}
		}
	};

	SNW.AiLive = AiLive;

})(window, window.SNW);



/* ---- 147a.audio.capture.js (5508 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 147a.audio.capture.js
 * 모듈약어 : SNW.AudioCapture
 * 모듈명 : Smart Nature Wind Audio Input & PCM16 Streamer (Live AEC)
 * ------------------------------------------------------
 * 기능 요약:
 *  - 마이크 캡처 (AEC/노이즈 캔슬레이션/자동 게인)
 *  - 인라인 Blob URL 기반 AudioWorklet (단일 번들 404 방지)
 *  - 16kHz, 16-bit PCM 모노 인코딩 및 base64 스트리밍
 *  - 실시간 볼륨 메터링 (UI 애니메이션 연동)
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _audioCtx = null;
	let _mediaStream = null;
	let _sourceNode = null;
	let _workletNode = null;
	let _analyserNode = null;
	let _animId = null;
	let _isCapturing = false;

	// 인라인 AudioWorklet 소스 (Float32 -> Int16 변환)
	const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.bufferSize = 2048; // ~128ms at 16kHz
		this.buffer = new Int16Array(this.bufferSize);
		this.offset = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		if (!input || !input[0]) return true;
		const channel = input[0];

		for (let i = 0; i < channel.length; i++) {
			// Float32 [-1.0, 1.0] -> Int16 [-32768, 32767]
			let s = Math.max(-1, Math.min(1, channel[i]));
			this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

			if (this.offset >= this.bufferSize) {
				this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
				this.buffer = new Int16Array(this.bufferSize);
				this.offset = 0;
			}
		}
		return true;
	}
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

	function arrayBufferToBase64(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}

	const AudioCapture = {
		isSupported() {
			return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.AudioContext);
		},

		isCapturing() {
			return _isCapturing;
		},

		async start({ onChunk, onVolume, onError } = {}) {
			if (_isCapturing) return true;
			if (!this.isSupported()) {
				const err = new Error('Audio recording not supported in this browser');
				if (onError) onError(err);
				throw err;
			}

			try {
				// 1. 마이크 스트림 획득 (AEC 활성화)
				_mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: {
						channelCount: 1,
						sampleRate: 16000,
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					},
					video: false
				});

				// 2. 16kHz AudioContext 생성
				const AudioContextClass = window.AudioContext || window.webkitAudioContext;
				_audioCtx = new AudioContextClass({ sampleRate: 16000 });
				if (_audioCtx.state === 'suspended') {
					await _audioCtx.resume();
				}

				// 3. 인라인 Blob URL 기반 AudioWorklet 등록
				const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
				const workletUrl = URL.createObjectURL(blob);
				try {
					await _audioCtx.audioWorklet.addModule(workletUrl);
				} finally {
					URL.revokeObjectURL(workletUrl);
				}

				// 4. 노드 연결
				_sourceNode = _audioCtx.createMediaStreamSource(_mediaStream);
				_workletNode = new AudioWorkletNode(_audioCtx, 'pcm-capture-processor');

				// 볼륨 분석기
				_analyserNode = _audioCtx.createAnalyser();
				_analyserNode.fftSize = 256;
				_sourceNode.connect(_analyserNode);
				_sourceNode.connect(_workletNode);

				// 5. PCM 청크 수신 이벤트
				_workletNode.port.onmessage = (event) => {
					if (!_isCapturing) return;
					const pcmBuffer = event.data; // ArrayBuffer (Int16)
					const base64Pcm = arrayBufferToBase64(pcmBuffer);
					if (onChunk) {
						onChunk(base64Pcm, pcmBuffer);
					}
				};

				// 6. 실시간 볼륨 미터링 루프
				if (onVolume) {
					const pcmData = new Uint8Array(_analyserNode.frequencyBinCount);
					const updateMeter = () => {
						if (!_isCapturing) return;
						_analyserNode.getByteFrequencyData(pcmData);
						let sum = 0;
						for (let i = 0; i < pcmData.length; i++) {
							sum += pcmData[i];
						}
						const avg = sum / pcmData.length;
						const norm = Math.min(1.0, avg / 128.0);
						onVolume(norm);
						_animId = requestAnimationFrame(updateMeter);
					};
					_animId = requestAnimationFrame(updateMeter);
				}

				_isCapturing = true;
				return true;
			} catch (e) {
				this.stop();
				if (onError) onError(e);
				throw e;
			}
		},

		stop() {
			_isCapturing = false;

			if (_animId) {
				cancelAnimationFrame(_animId);
				_animId = null;
			}

			if (_workletNode) {
				try {
					_workletNode.port.onmessage = null;
					_workletNode.disconnect();
				} catch (_) {}
				_workletNode = null;
			}

			if (_analyserNode) {
				try { _analyserNode.disconnect(); } catch (_) {}
				_analyserNode = null;
			}

			if (_sourceNode) {
				try { _sourceNode.disconnect(); } catch (_) {}
				_sourceNode = null;
			}

			if (_mediaStream) {
				try {
					_mediaStream.getTracks().forEach(t => t.stop());
				} catch (_) {}
				_mediaStream = null;
			}

			if (_audioCtx) {
				try {
					_audioCtx.close();
				} catch (_) {}
				_audioCtx = null;
			}
		}
	};

	SNW.AudioCapture = AudioCapture;

})(window, window.SNW);



/* ---- 147b.audio.playback.js (3677 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 147b.audio.playback.js
 * 모듈약어 : SNW.AudioPlayback
 * 모듈명 : Smart Nature Wind Audio Output & PCM24 Stream Player (Barge-in Support)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Gemini Live 24kHz PCM16 모노 스트리밍 큐 재생
 *  - 실시간 스케줄링 (끊김 없는 Seamless 재생)
 *  - Barge-in(끼어들기) 발생 시 즉시 큐 비우기 및 중단 (flush)
 *  - 재생 상태 콜백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _audioCtx = null;
	let _nextPlayTime = 0;
	let _scheduledSources = [];
	let _isPlaying = false;
	let _onStateChange = null;

	function base64ToArrayBuffer(base64) {
		const binaryString = window.atob(base64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	function pcm16ToFloat32(arrayBuffer) {
		const int16Array = new Int16Array(arrayBuffer);
		const float32Array = new Float32Array(int16Array.length);
		for (let i = 0; i < int16Array.length; i++) {
			float32Array[i] = int16Array[i] / 32768.0;
		}
		return float32Array;
	}

	const AudioPlayback = {
		init({ onStateChange } = {}) {
			_onStateChange = onStateChange || null;
		},

		_ensureAudioContext() {
			if (!_audioCtx || _audioCtx.state === 'closed') {
				const AudioContextClass = window.AudioContext || window.webkitAudioContext;
				_audioCtx = new AudioContextClass({ sampleRate: 24000 });
			}
			if (_audioCtx.state === 'suspended') {
				_audioCtx.resume();
			}
			return _audioCtx;
		},

		isPlaying() {
			return _isPlaying;
		},

		_setPlaying(val) {
			if (_isPlaying !== val) {
				_isPlaying = val;
				if (_onStateChange) _onStateChange(_isPlaying);
			}
		},

		enqueueBase64Pcm(base64Data) {
			if (!base64Data) return;
			try {
				const buffer = base64ToArrayBuffer(base64Data);
				this.enqueueArrayBuffer(buffer);
			} catch (e) {
				console.warn('[AudioPlayback] Failed to decode base64 audio:', e);
			}
		},

		enqueueArrayBuffer(arrayBuffer) {
			const ctx = this._ensureAudioContext();
			const float32Data = pcm16ToFloat32(arrayBuffer);

			const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
			audioBuffer.getChannelData(0).set(float32Data);

			const source = ctx.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(ctx.destination);

			const now = ctx.currentTime;
			const startTime = Math.max(now, _nextPlayTime);
			source.start(startTime);
			_nextPlayTime = startTime + audioBuffer.duration;

			_scheduledSources.push(source);
			this._setPlaying(true);

			source.onended = () => {
				const idx = _scheduledSources.indexOf(source);
				if (idx !== -1) {
					_scheduledSources.splice(idx, 1);
				}
				if (_scheduledSources.length === 0 && ctx.currentTime >= _nextPlayTime) {
					this._setPlaying(false);
				}
			};
		},

		// Barge-in 발생 시 현재 재생 중인 모든 버퍼 즉시 중단 및 큐 초기화
		flush() {
			for (const src of _scheduledSources) {
				try {
					src.stop();
					src.disconnect();
				} catch (_) {}
			}
			_scheduledSources = [];
			if (_audioCtx) {
				_nextPlayTime = _audioCtx.currentTime;
			} else {
				_nextPlayTime = 0;
			}
			this._setPlaying(false);
		},

		close() {
			this.flush();
			if (_audioCtx) {
				try { _audioCtx.close(); } catch (_) {}
				_audioCtx = null;
			}
			this._setPlaying(false);
		}
	};

	SNW.AudioPlayback = AudioPlayback;

})(window, window.SNW);



/* ===== LAYER 2: Pages (Dashboard, Chart, Studio, AI, Automation) ===== */

/* ---- 200.page.dashboard.js (17423 bytes) ---- */
// =========================================================
// 200.page.dashboard.js — 홈 (Stage 6 감성 UX 완성형)
// Layer 4 (페이지 로직)
// 4대 섹션: ① Now Playing & 이퀄라이저 ② 플레이리스트 ③ Context 추천 ④ 일반 선풍기 Snap
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Dashboard = class Dashboard {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._unsubs = [];
            this._eq = null;
            this._slider = null;
            this._contextCache = null;
            this._contextFetchMs = 0;
        }

        async mount() {
            this.el.innerHTML = '';
            this._render();
            this._bindStore();
            await this._loadProfiles();
            await this._refreshContext(true);
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
            if (this._eq) this._eq.stop();
            this._eq = null;
            this._slider = null;
        }

        // =========================================================
        // 레이아웃 (4 섹션, 엄지존 최적화)
        // =========================================================
        _render() {
            this.el.innerHTML = `
                <div class="snw-dashboard">
                    <!-- ① Now Playing + 이퀄라이저 -->
                    <section class="snw-card snw-card--nowplaying">
                        <div class="snw-np-big">
                            <div class="snw-np-big__eq" data-slot="eq"></div>
                            <div class="snw-np-big__info">
                                <div class="snw-np-big__title" data-slot="np-title">꺼짐</div>
                                <div class="snw-np-big__sub" data-slot="np-sub">세션 없음</div>
                            </div>
                            <div class="snw-np-big__controls">
                                <button type="button" class="snw-btn" data-action="pause" hidden>⏸</button>
                                <button type="button" class="snw-btn" data-action="stop" hidden>⏹</button>
                            </div>
                        </div>
                    </section>

                    <!-- ② 재생할 플레이리스트 -->
                    <section class="snw-card snw-card--playlist">
                        <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🎵 재생할 플레이리스트</h2>
                        <div data-slot="playlist-grid" class="snw-playlist-grid">
                            <div class="snw-empty" style="color:var(--snw-text-dim,#8b949e);">로딩 중...</div>
                        </div>
                    </section>

                    <!-- ③ Context 추천 (Stage 6 신규) -->
                    <section class="snw-card snw-card--comfort" data-slot="comfort-card">
                        <div class="snw-comfort">
                            <div class="snw-comfort__header">
                                <span data-slot="comfort-env" style="font-family:var(--snw-font-mono, monospace);">🌡️ --°C  💧 --%</span>
                                <span class="snw-comfort__level" data-slot="comfort-level">--</span>
                            </div>
                            <div class="snw-comfort__body">
                                <span data-slot="comfort-recommend">기상 분석 중...</span>
                            </div>
                            <button type="button" class="snw-btn snw-btn-primary snw-btn--full" data-action="play-recommend" disabled>
                                ▶ 지금 재생
                            </button>
                        </div>
                    </section>

                    <!-- ④ 일반 선풍기 (Snap + Haptic, 최하단) -->
                    <section class="snw-card snw-card--fan">
                        <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🌀 일반 선풍기</h2>
                        <div data-slot="slider"></div>
                    </section>
                </div>`;

            // 이퀄라이저 초기화
            const eqSlot = this.el.querySelector('[data-slot="eq"]');
            if (SNW.UI && typeof SNW.UI.equalizer === 'function') {
                this._eq = SNW.UI.equalizer(eqSlot, { bars: 20, fps: 60, maxWind: 11 });
            }

            // Snap 슬라이더 초기화
            const sliderSlot = this.el.querySelector('[data-slot="slider"]');
            if (SNW.UI && typeof SNW.UI.snapSlider === 'function') {
                this._slider = SNW.UI.snapSlider(sliderSlot, {
                    min: 0, max: 100,
                    value: 0,
                    snapPoints: [0, 20, 40, 60, 80, 100],
                    snapRadius: 8,
                    label: '',
                    format: (v) => {
                        const labels = ['끔', '1단', '2단', '3단', '4단', '5단'];
                        const idx = v / 20;
                        return labels[Math.min(5, Math.max(0, idx))] || `${v}%`;
                    },
                    onChange: (v) => this._onFanChange(v),
                });
            }

            // Now Playing 컨트롤
            const btnPause = this.el.querySelector('[data-action="pause"]');
            const btnStop  = this.el.querySelector('[data-action="stop"]');
            if (btnPause) btnPause.onclick = () => this._onPauseToggle();
            if (btnStop)  btnStop.onclick  = () => this._onStop();

            // Context 재생 버튼
            const btnRec = this.el.querySelector('[data-action="play-recommend"]');
            if (btnRec) {
                btnRec.onclick = () => this._onPlayRecommendation();
            }
        }

        // =========================================================
        // Store 구독
        // =========================================================
        _bindStore() {
            if (!SNW.Store || typeof SNW.Store.watch !== 'function') return;

            this._unsubs.push(
                SNW.Store.watch('session', () => this._renderNowPlaying()),
                SNW.Store.watch('sim',     () => this._onSimUpdate()),
                SNW.Store.watch('control', () => this._onControlUpdate()),
            );
            // 초기 렌더
            this._renderNowPlaying();
        }

        // =========================================================
        // Now Playing 렌더
        // =========================================================
        _renderNowPlaying() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const s = store.session;
            const titleEl = this.el.querySelector('[data-slot="np-title"]');
            const subEl   = this.el.querySelector('[data-slot="np-sub"]');
            const btnPause = this.el.querySelector('[data-action="pause"]');
            const btnStop  = this.el.querySelector('[data-action="stop"]');
            if (!titleEl) return;

            const isActive = s && s.type && s.type !== 'NONE' && s.active !== false;

            if (!isActive) {
                titleEl.textContent = '꺼짐';
                subEl.textContent   = '세션 없음';
                if (btnPause) btnPause.hidden = true;
                if (btnStop)  btnStop.hidden  = true;
                this._eq?.renderStatic();
                this._eq?.stop();
                this._slider?.set(0);
                return;
            }

            const isPaused = s.state === 'PAUSED';
            let title = '', sub = '';

            if (s.type === 'PLAYLIST') {
                title = s.profileName || '플레이리스트';
                const remain = this._fmtRemain(s.stepRemainSec || 0);
                sub = `Step ${s.currentStep || 1}/${s.totalSteps || 1} · ${remain}`;
            } else if (s.type === 'PRESET') {
                title = `${s.presetCode || ''} · ${s.styleCode || ''}`;
                sub = isPaused ? '일시정지' : '재생 중';
            } else if (s.type === 'FIXED') {
                title = `일반 선풍기 ${Math.round(s.percent || 0)}%`;
                sub = isPaused ? '일시정지' : '재생 중';
                if (this._slider) this._slider.set(s.percent || 0);
            }

            const triggerIcon = s.trigger === 'MANUAL' ? '✋' : '⏰';
            titleEl.textContent = `${triggerIcon} ${title}`;
            subEl.textContent   = isPaused ? `⏸ ${sub}` : sub;

            if (btnPause) {
                btnPause.hidden = false;
                btnPause.textContent = isPaused ? '▶' : '⏸';
            }
            if (btnStop) {
                btnStop.hidden = false;
            }

            if (isPaused) {
                this._eq?.renderStatic();
                this._eq?.stop();
            } else {
                this._eq?.start();
            }
        }

        // =========================================================
        // sim 업데이트 → 이퀄라이저 push
        // =========================================================
        _onSimUpdate() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const sim = store.sim;
            if (!sim) return;

            const s = store.session;

            // [Phase3 N-1] 명시적 숫자 판정
            const typeNum  = s ? Number(s.type) : 0;
            const isActive = (typeNum > 0) && (s.state === 'ACTIVE');

            if (this._eq && isActive) {
                this._eq.push(sim.windSpeed || 0);
                this._eq.start();
            }
        }

        // =========================================================
        // control 업데이트 → Context 카드 재조회 (10초 throttle)
        // =========================================================
        _onControlUpdate() {
            const now = Date.now();
            if (now - this._contextFetchMs < 10000) return;
            this._refreshContext(false);
        }

        // =========================================================
        // Context 조회
        // =========================================================
        async _refreshContext(force = false) {
            const now = Date.now();
            if (!force && now - this._contextFetchMs < 10000) return;
            this._contextFetchMs = now;

            try {
                if (SNW.Api && typeof SNW.Api.getComfort === 'function') {
                    const ctx = await SNW.Api.getComfort();
                    this._contextCache = ctx;
                    this._renderContext(ctx);
                }
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Dashboard] comfort fetch failed', e);
            }
        }

        _renderContext(ctx) {
            if (!ctx) return;
            const envEl     = this.el.querySelector('[data-slot="comfort-env"]');
            const levelEl   = this.el.querySelector('[data-slot="comfort-level"]');
            const recEl     = this.el.querySelector('[data-slot="comfort-recommend"]');
            const playBtn   = this.el.querySelector('[data-action="play-recommend"]');
            if (!envEl) return;

            const emoji = ['🟢', '🟡', '🟠', '🔴'][ctx.level] || '⚪';
            const tempStr = (ctx.tempC != null) ? ctx.tempC.toFixed(1) : '--';
            const humStr  = (ctx.humidity != null) ? ctx.humidity.toFixed(0) : '--';

            envEl.textContent = `🌡️ ${tempStr}°C  💧 ${humStr}%`;
            levelEl.textContent = `${emoji} ${ctx.levelText || ''}`;
            levelEl.className = `snw-comfort__level snw-comfort__level--${ctx.level}`;

            // 추천 표시
            const rec = ctx.recommend || {};
            if (rec.profileId > 0) {
                recEl.innerHTML = `💡 현재 날씨엔 "<b>프로필 #${rec.profileId}</b>"이 가장 쾌적합니다`;
                if (playBtn) playBtn.disabled = false;
            } else if (rec.presetCode) {
                recEl.innerHTML = `💡 현재 날씨엔 "<b>${rec.presetCode} · ${rec.styleCode}</b>" 바람을 추천합니다`;
                if (playBtn) playBtn.disabled = false;
            } else {
                recEl.textContent = '현재 추천 바람 정보를 준비 중입니다';
                if (playBtn) playBtn.disabled = true;
            }
        }

        // =========================================================
        // 프로필 로드
        // =========================================================
        async _loadProfiles() {
            try {
                if (!SNW.Api || typeof SNW.Api.listProfiles !== 'function') return;
                const data = await SNW.Api.listProfiles();
                const pRoot = (data && data.userProfiles) ? data.userProfiles : data;
                const profiles = (pRoot && pRoot.profiles) ? pRoot.profiles : (Array.isArray(pRoot) ? pRoot : []);
                const grid = this.el.querySelector('[data-slot="playlist-grid"]');
                if (!grid) return;

                if (profiles.length === 0) {
                    grid.innerHTML = `<div class="snw-empty" style="color:var(--snw-text-dim,#8b949e);padding:16px 0;">작곡한 프로필이 없습니다.<br><a href="#/automation/studio" style="color:var(--snw-primary,#4a9eff);text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">🎨 Studio에서 작곡하기</a></div>`;
                    return;
                }

                grid.innerHTML = '';
                profiles.slice(0, 4).forEach(p => {
                    const card = document.createElement('button');
                    card.type = 'button';
                    card.className = 'snw-playlist-card';
                    const pName = SNW.DomUtil ? SNW.DomUtil.escape(p.name || '프로필') : (p.name || '프로필');
                    card.innerHTML = `
                        <div class="snw-playlist-card__icon">🌊</div>
                        <div class="snw-playlist-card__name">${pName}</div>
                        <div class="snw-playlist-card__meta">${p.stepCount || (p.steps ? p.steps.length : 0)} Step</div>`;
                    card.onclick = async () => {
                        try {
                            await SNW.Api.startPlaylist(p.profileId);
                            if (SNW.Haptic) SNW.Haptic.stepChange();
                        } catch (e) {
                            if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '재생 실패');
                        }
                    };
                    grid.appendChild(card);
                });
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Dashboard] profiles load fail', e);
            }
        }

        // =========================================================
        // 액션
        // =========================================================
        async _onFanChange(percent) {
            try {
                if (percent === 0) {
                    await SNW.Api.stopSession();
                } else {
                    await SNW.Api.startFixed(percent);
                }
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '실패');
            }
        }

        async _onPauseToggle() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const s = store.session;
            if (!s) return;
            try {
                if (s.state === 'PAUSED') {
                    await SNW.Api.resumeSession();
                    if (SNW.Haptic) SNW.Haptic.success();
                } else {
                    await SNW.Api.pauseSession();
                    if (SNW.Haptic) SNW.Haptic.snap();
                }
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message);
            }
        }

        async _onStop() {
            try {
                await SNW.Api.stopSession();
                if (SNW.Haptic) SNW.Haptic.stop();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message);
            }
        }

        async _onPlayRecommendation() {
            const ctx = this._contextCache;
            if (!ctx) return;

            const rec = ctx.recommend || {};
            try {
                if (rec.profileId > 0) {
                    await SNW.Api.startPlaylist(rec.profileId);
                } else {
                    await SNW.Api.startPreset(rec.presetCode, rec.styleCode);
                }
                if (SNW.Haptic) SNW.Haptic.stepChange();
                if (SNW.ToastUtil) SNW.ToastUtil.success('추천 바람 재생 시작');
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '재생 실패');
            }
        }

        _fmtRemain(sec) {
            if (!sec || sec < 0) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${String(s).padStart(2, '0')}`;
        }
    };
})(window.SNW);


/* ---- 210.page.chart.js (14079 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 210.page.chart.js
 * 모듈     : SNW.Page.Chart
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 실시간 물리 차트 (120초 풀 뷰)
 *  - WS /ws/chart 구독 → SNW.UI.chart.push()
 *  - 시간축 범위 선택 (5/30/120초)
 *  - CSV 내보내기 (현재 버퍼)
 * 의존성   : SNW.C, SNW.CFG, SNW.I18n, SNW.DomUtil, SNW.Tpl,
 *            SNW.UI.chart, SNW.WsManager, SNW.Store, SNW.Api
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Chart = class Chart {
		constructor(container) {
			this.el = container;
			this._unsubs = [];
			this._wsUnsubs = [];
			this._timers = [];
			this._active = true;
			this._rangeSec = 120;
			this._buffer = []; // CSV/재렌더용 원본 버퍼 (최대 120)
			this.chart = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.chart());
			SNW.I18n.applyTo(this.el);
			
			// [REQ-1] Chart 탭 전환
			this._activeTab = 'live';
			this._showOverlay = false;
			const overlayChk = this.el.querySelector('[data-chart-overlay]');
			if (overlayChk) {
				overlayChk.addEventListener('change', () => {
					this._showOverlay = overlayChk.checked;
					this._switchTab(this._activeTab);
				});
			}
			const banner = this.el.querySelector('[data-slot="banner"]');
			const updateBanner = () => {
				if (!banner) return;
				if (this._activeTab === 'live') {
					banner.style.display = 'block';
					banner.innerHTML = '🔴 <b>실선풍기 가동 중</b> · WS 라이브 데이터';
					banner.style.background = 'rgba(74,158,255,0.1)';
				} else {
					banner.style.display = 'block';
					banner.innerHTML = '🎬 <b>예상 파형 (±10% 오차)</b> · 실선풍기는 가동되지 않습니다';
					banner.style.background = 'rgba(240,136,62,0.1)';
				}
			};
			updateBanner();

			this.el.querySelectorAll('[data-chart-tab]').forEach(btn => {
				btn.addEventListener('click', () => {
					const tab = btn.getAttribute('data-chart-tab');
					if (tab === this._activeTab) return;
					this._activeTab = tab;
					this.el.querySelectorAll('[data-chart-tab]').forEach(b =>
						b.classList.toggle('is-active', b === btn));
					updateBanner();
					this._switchTab(tab);
				});
			});

			// 차트 초기화
			const chartSlot = this.el.querySelector('[data-slot="chart"]');
			this.chart = SNW.UI.chart({
				root: chartSlot,
				maxPoints: 120,
				series: SNW.CFG.UI.MINI_CHART_SERIES
			});
			
			// 초기 데이터 (풀 덤프: S-2 getChartHistory 우선)
			try {
				const hist = await SNW.Api.getChartHistory();
				if (!this._active) return;
				if (hist && Array.isArray(hist.chart) && hist.chart.length > 0) {
					this._buffer = hist.chart.map(e => ({
						t:          (e.t != null)          ? e.t          : Date.now(),
						windSpeed:  (e.wind != null)       ? e.wind       : 0,
						targetWind: (e.targetWind != null) ? e.targetWind : 0,
						pwmDuty:    (e.pwm != null)        ? e.pwm        : 0
					}));
					this._redrawRange();
				} else {
					const simState = await SNW.Api.getSimState();
					if (this._active) this._applyInitial(simState);
				}
			} catch (e) {
				try {
					const simState = await SNW.Api.getSimState();
					if (this._active) this._applyInitial(simState);
				} catch (e2) { /* ignore */ }
			}
			
			// WS chart 구독
			const wsChart = SNW.WsManager.get('chart');
			if (wsChart) {
				const unsub = wsChart.onMessage((data) => {
					if (!this._active) return;
					this._onWsChart(data);
				});
				this._wsUnsubs.push(unsub);
			}
			
			// 범위 선택
			const rangeSel = this.el.querySelector('[data-slot="range"]');
			if (rangeSel) {
				rangeSel.value = String(this._rangeSec);
				rangeSel.addEventListener('change', () => {
					this._rangeSec = Number(rangeSel.value) || 120;
					this._redrawRange();
				});
			}
			
			// CSV 내보내기
			SNW.DomUtil.delegate(this.el, '[data-action="export"]', 'click', () => {
				this._exportCsv();
			});
			
			SNW.LogUtil.info('[Chart] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._unsubs.forEach(fn => { try { fn(); } catch {} });
			this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
			this._timers.forEach(id => clearInterval(id));
			if (this.chart && this.chart.destroy) {
				try { this.chart.destroy(); } catch {}
			}
			this._unsubs = [];
			this._wsUnsubs = [];
			this._timers = [];
		}
		
		// -------------------------------------------------
		// 초기 데이터 (S10 → sim state)
		// -------------------------------------------------
		_applyInitial(simState) {
			if (!simState || !simState.sim) return;
			const sim = simState.sim;
			// 초기 1포인트 push (풍속/목표/PWM)
			this._pushPoint({
				t: Date.now(),
				windSpeed: sim.windSpeed != null ? sim.windSpeed : 0,
				targetWind: sim.targetWind != null ? sim.targetWind : 0,
				pwmDuty: sim.pwmDuty != null ? sim.pwmDuty : 0
			});
		}
		
		// -------------------------------------------------
		// WS chart 수신
		//  - diffOnly: { sim: { windSpeed, targetWind, pwmDuty, ... } }
		//  - full dump: { chart: [...], sim: {...} }
		// -------------------------------------------------
		_switchTab(tab) {
			if (!this.chart) return;
			this.chart.clear();
			this._buffer = [];
			
			if (tab === 'live') {
				// 실제: S-2 이력 + WS 라이브
				SNW.Api.getChartHistory().then(hist => {
					if (hist?.chart?.length) {
						this._buffer = hist.chart.map(e => ({
							t: e.t || Date.now(),
							windSpeed: e.wind || 0,
							targetWind: e.targetWind || 0,
							pwmDuty: e.pwm || 0
						}));
						this._redrawRange();
						if (this._showOverlay) this._drawOverlay();
					}
				}).catch(() => {});
			} else {
				// 예상: 현재 프리셋 × 스타일로 생성
				// [Phase5 5.5] ADR-5 이후 generate는 async → IIFE로 fire-and-forget
				const sim = SNW.Store.get().sim || {};
				if (SNW.Preview && typeof SNW.Preview.generate === 'function') {
					(async () => {
						try {
							const preview = await SNW.Preview.generate(
								sim.presetCode || 'OCEAN',
								sim.styleCode || 'BALANCE',
								null
							);
							if (preview && preview.points && this._active) {
								this._buffer = preview.points.map(p => ({
									t: p.t,
									windSpeed: p.wind,
									targetWind: p.avg,
									pwmDuty: 0,
								}));
								this._redrawRange();
							}
						} catch (e) {
							if (SNW.LogUtil) SNW.LogUtil.warn('[Chart] preview fail', e);
						}
					})();
				}
			}
		}

		// [U-002] diffOnly 응답 = {chart: [1개]} → append (교체 아님)
		_onWsChart(data) {
			if (this._activeTab !== 'live') return;   // [REQ-1] 예상 탭에서는 실측 무시
			if (!data) return;
			const sim = data.sim || {};

			if (Array.isArray(data.chart) && data.chart.length > 0) {
				if (data.chart.length === 1) {
					// diffOnly 1점 = append
					const e = data.chart[0];
					this._pushPoint({
						t:          (e.t != null)          ? e.t          : Date.now(),
						windSpeed:  (e.wind != null)       ? e.wind       : 0,
						targetWind: (e.targetWind != null) ? e.targetWind : 0,
						pwmDuty:    (e.pwm != null)        ? e.pwm        : 0,
						gust:       (e.gust != null)       ? e.gust       : 0,
						thermal:    (e.thermal != null)    ? e.thermal    : 0
					});
					return;
				}
				// 2개 이상 = full dump (이력 교체)
				this._buffer = data.chart.map(e => ({
					t:          (e.t != null)          ? e.t          : Date.now(),
					windSpeed:  (e.wind != null)       ? e.wind       : 0,
					targetWind: (e.targetWind != null) ? e.targetWind : 0,
					pwmDuty:    (e.pwm != null)        ? e.pwm        : 0
				}));
				this._redrawRange();
				return;
			}

			// sim만 (chart 없이) - 안전망
			if (sim.windSpeed != null || sim.pwmDuty != null) {
				this._pushPoint({
					t: Date.now(),
					windSpeed: sim.windSpeed != null ? sim.windSpeed : 0,
					targetWind: sim.targetWind != null ? sim.targetWind : 0,
					pwmDuty: sim.pwmDuty != null ? sim.pwmDuty : 0
				});
			}
		}
		
		_pushPoint(pt) {
			this._buffer.push(pt);
			if (this._buffer.length > 120) this._buffer.shift();
			if (this.chart) this.chart.push(pt);
		}
		
		// -------------------------------------------------
		// 범위 변경 시 재렌더 (버퍼에서 잘라냄)
		// -------------------------------------------------
		_redrawRange() {
			if (!this.chart) return;
			this.chart.clear();
			this.chart.setMaxPoints(this._rangeSec);
			const start = Math.max(0, this._buffer.length - this._rangeSec);
			for (let i = start; i < this._buffer.length; i++) {
				this.chart.push(this._buffer[i]);
			}
		}
		
		// -------------------------------------------------
		// CSV 내보내기 (현재 buffer)
		// -------------------------------------------------
        _exportCsv() {
            if (!this._buffer.length) {
                SNW.ToastUtil.info(SNW.I18n.t('common.noData'));
                return;
            }
            const header = 'timestamp,windSpeed,targetWind,pwmDuty\n';
            const rows = this._buffer.map(r => [
                SNW.TimeUtil.epochToTimeStr(r.t),
                r.windSpeed.toFixed(3),
                r.targetWind.toFixed(3),
                r.pwmDuty.toFixed(1)
            ].join(',')).join('\n');
            
            const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `snw_chart_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            
            SNW.ToastUtil.success(SNW.I18n.t('common.success'));
        }

        // ======================================================
        // [Phase5 5.5] 예상 파형 오버레이 (ADR-5 이후 신규)
        //
        //  [설계]
        //   - 차트 캔버스 위에 반투명 캔버스를 절대 위치로 삽입
        //   - 실측 데이터(_buffer)의 min/max 범위에 예상 파형을 매핑
        //   - 점선 + 돌풍 마커로 시각 구분
        //   - _showOverlay=false면 즉시 제거
        // ======================================================
        async _ensurePreviewBuffer() {
            if (this._previewBuffer) return;
            if (!SNW.Preview || typeof SNW.Preview.generate !== 'function') return;

            const sim = SNW.Store.get().sim || {};
            try {
                const wave = await SNW.Preview.generate(
                    sim.presetCode || 'OCEAN',
                    sim.styleCode || 'BALANCE',
                    null
                );
                if (wave && wave.points) this._previewBuffer = wave.points;
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Chart] overlay preview fail', e);
            }
        }

        _drawOverlay() {
            // 기존 오버레이 제거
            const existing = this.el.querySelector('.snw-overlay-canvas');
            if (existing) existing.remove();

            // 조건 확인
            if (!this._showOverlay)         return;
            if (!this._previewBuffer)       return;
            if (this._activeTab !== 'live') return;   // 예상 탭에서는 이미 실측이 예상이므로 오버레이 불필요
            if (!this._buffer || this._buffer.length < 2) return;

            const chartSlot = this.el.querySelector('[data-slot="chart"]');
            if (!chartSlot) return;

            if (getComputedStyle(chartSlot).position === 'static') {
                chartSlot.style.position = 'relative';
            }

            const ovl = document.createElement('canvas');
            ovl.className = 'snw-overlay-canvas';
            ovl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
            chartSlot.appendChild(ovl);

            requestAnimationFrame(() => {
                const rect = chartSlot.getBoundingClientRect();
                if (rect.width < 10 || rect.height < 10) return;
                if (!ovl.isConnected) return;

                ovl.width  = Math.floor(rect.width);
                ovl.height = Math.floor(rect.height);

                // 실측 + 예상 통합 min/max
                let mn = Infinity, mx = -Infinity;
                this._buffer.forEach(p => {
                    const v = Number(p.windSpeed);
                    if (!Number.isFinite(v)) return;
                    if (v < mn) mn = v;
                    if (v > mx) mx = v;
                });
                this._previewBuffer.forEach(p => {
                    const v = Number(p.wind);
                    if (!Number.isFinite(v)) return;
                    if (v < mn) mn = v;
                    if (v > mx) mx = v;
                });
                if (!Number.isFinite(mn) || !Number.isFinite(mx) || mx <= mn) return;

                const ctx = ovl.getContext('2d');
                const pad = 6;
                const innerH = ovl.height - pad * 2;
                const n = this._previewBuffer.length;
                if (n < 2) return;

                // 점선 오버레이
                ctx.strokeStyle = 'rgba(240,136,62,0.75)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                for (let i = 0; i < n; i++) {
                    const x = (i / (n - 1)) * ovl.width;
                    const y = pad + ((mx - this._previewBuffer[i].wind) / (mx - mn)) * innerH;
                    if (i === 0) ctx.moveTo(x, y);
                    else         ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            });
        }
    };
    
})(window.SNW);

/* ---- 220.page.schedule.js (1503 bytes) ---- */
// =========================================================
// 220.page.schedule.js — 스케줄 페이지 (단일 규격 일원화 파사드)
// Layer 3 (페이지 컴포넌트)
// [v0203 단일 규격] #/automation/schedule 패널(SNW.SchedulePanel)로 위임
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Schedule = class Schedule {
            constructor(container, params = {}) {
                this.container = container;
                this.params = params;
                this.panel = null;
            }

        async mount() {
                    if (!this.container) return;
                    // 자동화 스케줄 패널로 위임
                    if (SNW.SchedulePanel) {
                        this.panel = new SNW.SchedulePanel(this.container, this.params);
                        await this.panel.mount();
                    } else if (SNW.Router && typeof SNW.Router.navigate === 'function') {
                        SNW.Router.navigate('/automation/schedule');
                    }
                }

                        unmount() {
                            if (this.panel && typeof this.panel.unmount === 'function') {
                                this.panel.unmount();
                                this.panel = null;
                            }
                        }
                    };
                }) (window.SNW);


/* ---- 225.page.sensors.js (6057 bytes) ---- */
// =========================================================
// 225.page.sensors.js — SNW.Page.Sensors
// Layer 4 (페이지 로직)
// [O-13] PIR 테스트 피드백 (2초 내 실제 감지 확인 + flash)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';
    
    SNW.Page.Sensors = class Sensors {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._unsubs = [];
        }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.sensors());
            SNW.I18n.applyTo(this.el);
            
            // 센서 카드 실시간 갱신
            const unsub = SNW.Store.watch('control', ctl => {
                if (!this._active || !ctl || !ctl.sensor) return;
                const s = ctl.sensor;
                const set = (sel, val) => {
                    const el = this.el.querySelector(sel);
                    if (el) el.textContent = val;
                };
                set('[data-slot="sensor-temp"]', s.tempC != null ? s.tempC.toFixed(1) + SNW.I18n.t('unit.celsius') : '--');
                set('[data-slot="sensor-hum"]', s.humidity != null ? s.humidity.toFixed(0) + SNW.I18n.t('unit.humidity') : '--');
                set('[data-slot="sensor-motion"]',
                    s.motionActive ?
                    SNW.I18n.t('dashboard.motionDetected') :
                    SNW.I18n.t('dashboard.motionAbsent'));
            });
            this._unsubs.push(unsub);
            
            // 모션 설정 폼
            try {
                const data = await SNW.Api.getMotion();
                const m = (data && data.motion) || {};
                const pir = m.pir || { enabled: true, holdSec: 120 };
                const formSlot = this.el.querySelector('[data-slot="motion-config"]');
                if (formSlot) {
                    formSlot.innerHTML = `
                        <div class="snw-form-row" style="flex-direction:row;align-items:center;gap:8px;margin-bottom:8px;">
                            <input type="checkbox" id="m-pir-en" ${pir.enabled ? 'checked' : ''}>
                            <label for="m-pir-en" style="margin:0;">${SNW.I18n.t('sensors.pirEnabled')}</label>
                        </div>
                        <div class="snw-form-row" style="margin-bottom:8px;">
                            <label>${SNW.I18n.t('sensors.pirHoldSec')}</label>
                            <input type="number" id="m-pir-hold" min="0" max="3600" value="${pir.holdSec}"
                                   style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        </div>
                        <div class="snw-toolbar">
                            <button type="button" class="snw-btn snw-btn-primary" data-action="save-motion">
                                ${SNW.I18n.t('common.save')}
                            </button>
                        </div>
                    `;
                }
            } catch (e) {
                SNW.LogUtil.warn('[Sensors] motion config load 실패', e);
            }
            
            // =========================================================
            // [O-13] PIR 피드 — 실제 감지 확인 + 시각 피드백
            // =========================================================
            SNW.DomUtil.delegate(this.el, '[data-action="feed-pir"]', 'click', async (e, btn) => {
                btn.disabled = true;
                try {
                    await SNW.Api.feedPir(true);
                    SNW.ToastUtil.info(SNW.I18n.t('sensors.feedPirSuccess'));
                    
                    // 1.5초 후 실제 감지 확인
                    setTimeout(() => {
                        const ctl = SNW.Store.get().control;
                        const isDetected = ctl?.sensor?.motionActive === true;
                        if (isDetected) {
                            SNW.ToastUtil.success(SNW.I18n.t('pir.testSuccess'));
                            const card = this.el.querySelector('[data-slot="sensor-motion"]')?.closest('.snw-sensor-card');
                            if (card) {
                                card.classList.add('is-detecting');
                                setTimeout(() => card.classList.remove('is-detecting'), 2000);
                            }
                        } else {
                            SNW.ToastUtil.error(SNW.I18n.t('pir.testFail'));
                        }
                        btn.disabled = false;
                    }, 1500);
                } catch (err) {
                    btn.disabled = false;
                    SNW.ErrorHandler.handle(err, 'sensors.pir');
                }
            });
            
            // 모션 저장
            SNW.DomUtil.delegate(this.el, '[data-action="save-motion"]', 'click', async () => {
                const en = this.el.querySelector('#m-pir-en')?.checked;
                const hold = Number(this.el.querySelector('#m-pir-hold')?.value);
                
                if (isNaN(hold) || hold < 0 || hold > 3600) {
                    SNW.ToastUtil.error(SNW.I18n.t('validate.range', { field: 'Hold', min: 0, max: 3600 }));
                    return;
                }
                
                try {
                    await SNW.Api.patchMotion({ motion: { pir: { enabled: en, holdSec: hold } } });
                    await SNW.Api.saveConfig();
                    SNW.ToastUtil.success(SNW.I18n.t('sensors.saveMotionSuccess'));
                } catch (err) {
                    SNW.ErrorHandler.handle(err, 'sensors.motion');
                }
            });
        }
        
        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
        }
    };
})(window.SNW);


/* ---- 230.page.profiles.js (1382 bytes) ---- */
// =========================================================
// 230.page.profiles.js — 프로필 페이지 (단일 규격 일원화 파사드)
// Layer 3 (페이지 컴포넌트)
// [v0203 단일 규격] #/automation/playlist 패널(SNW.Playlist)로 위임
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Profiles = class Profiles {
            constructor(container, params = {}) {
                this.container = container;
                this.params = params;
                this.panel = null;
            }

        async mount() {
                if (!this.container) return;
                // 자동화 Playlist 패널로 위임
                if (SNW.Playlist) {
                    this.panel = new SNW.Playlist(this.container, this.params);
                    await this.panel.mount();
                } else if (SNW.Router && typeof SNW.Router.navigate === 'function') {
                    SNW.Router.navigate('/automation/playlist');
                }
            }

            unmount() {
                    if (this.panel && typeof this.panel.unmount === 'function') {
                        this.panel.unmount();
                        this.panel = null;
                    }
                }
            };
        })(window.SNW);


/* ---- 240.page.settings.js (34717 bytes) ---- */
// =========================================================
// 240.page.settings.js — SNW.Page.Settings
// Layer 4 (페이지 로직)
// [1순위 개선] 서브 탭 (일반/보안, 하드웨어, 통신/WS) 도입
// [P0-2] 섹션 헤더 i18n, [P0-3] Sticky 저장 바
// [O-4] 자동 재적용, [O-9] 공장 초기화 강화, [O-11] API Key 보안
// [O-18] 범위 힌트 + 클라이언트 검증
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    // [NEW-C1] null/undefined만 폴백 (0, '', false는 보존)
    function nz(v, fallback) {
        return (v === null || v === undefined) ? fallback : v;
    }

    // [NEW-U4] 명시적 bool 판정 ("false" 문자열 방어)
    function asBool(v) {
        return v === true || v === 1 || v === '1' || v === 'true';
    }

    SNW.Page.Settings = class Settings {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._wsChBaseline = [];
            this._currentTab = 'general';
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.settings());
            SNW.I18n.applyTo(this.el);

            await this._loadSystem();
            if (!this._active) return;

            // 액션 이벤트 바인딩 (저장, 재적용, 테스트, 초기화)
            SNW.DomUtil.delegate(this.el, '[data-action="save"]', 'click', () => this._onSave());
            SNW.DomUtil.delegate(this.el, '[data-action="reload"]', 'click', () => this._onReload());
            SNW.DomUtil.delegate(this.el, '[data-action="test-api"]', 'click', () => this._onTestApi());
            SNW.DomUtil.delegate(this.el, '[data-action="factory-reset"]', 'click', () => this._onFactoryReset());
        }

        unmount() { this._active = false; }

        // =========================================================
        // 탭 제어 로직
        // =========================================================
        _bindTabs() {
            const tabsContainer = this.el.querySelector('.snw-tabs');
            if (!tabsContainer) return;

            // 기존 이벤트 리스너 제거를 위해 cloneNode 사용 (중복 방지)
            const newTabs = tabsContainer.cloneNode(true);
            tabsContainer.parentNode.replaceChild(newTabs, tabsContainer);

            newTabs.addEventListener('click', (e) => {
                const btn = e.target.closest('.snw-tab-btn');
                if (!btn) return;

                const target = btn.getAttribute('data-tab');
                this._currentTab = target;

                // 버튼 활성화
                this.el.querySelectorAll('.snw-tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
                // 콘텐츠 활성화
                this.el.querySelectorAll('.snw-tab-content').forEach(c => c.classList.toggle('is-active', c.getAttribute('data-tab-content') === target));
            });
        }

        // =========================================================
        // _loadSystem : 데이터 로드 및 탭 UI 렌더링
        // =========================================================
        async _loadSystem() {
            try {
                const data = await SNW.Api.getSystem();
                if (!this._active) return;

                const sys    = (data && data.system) || {};
                const hw     = sys.hw || {};
                const logCfg = (sys.system && sys.system.logging) || {};
                const ws     = (sys.system && sys.system.webSocket) || {};
                const sec    = sys.security || {};
                const meta   = sys.meta || {};

                const esc = SNW.DomUtil.escape;
                const T = SNW.I18n.t.bind(SNW.I18n);

                const apiKeySet    = typeof sec.apiKey       === 'string' && sec.apiKey.length       > 0;
                const geminiKeySet = typeof sec.geminiApiKey === 'string' && sec.geminiApiKey.length > 0;

                // 탭 컨테이너 렌더링
                const formContainer = this.el.querySelector('[data-slot="form-container"]');
                if (!formContainer) return;

                formContainer.innerHTML = `
                    <div class="snw-tabs">
                        <button type="button" class="snw-tab-btn is-active" data-tab="general">${T('settings.tabGeneral')}</button>
                        <button type="button" class="snw-tab-btn" data-tab="hardware">${T('settings.tabHardware')}</button>
                        <button type="button" class="snw-tab-btn" data-tab="comm">${T('settings.tabComm')}</button>
                    </div>

                    <!-- 탭 1: 일반/보안 -->
                    <div class="snw-tab-content is-active" data-tab-content="general">
                        <div data-slot="form-log"></div>
                    </div>

                    <!-- 탭 2: 하드웨어 -->
                    <div class="snw-tab-content" data-tab-content="hardware">
                        <div data-slot="form-hw"></div>
                    </div>

                    <!-- 탭 3: 통신/WS -->
                    <div class="snw-tab-content" data-tab-content="comm">
                        <div data-slot="form-ws"></div>
                    </div>
                `;

                this._bindTabs();

                // ---------- 1. 일반 / 보안 탭 ----------
                const logSlot = formContainer.querySelector('[data-slot="form-log"]');
                logSlot.innerHTML = `
                    <h3 class="snw-form-section">${T('settings.secMeta')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldDeviceName')}</label>
                        <input type="text" id="meta-deviceName" value="${esc(nz(meta.deviceName, 'SmartNatureWind'))}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldLogLevel')}</label>
                        <select id="log-level" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            <option value="INFO"  ${logCfg.level === 'INFO'  ? 'selected' : ''}>INFO</option>
                            <option value="DEBUG" ${logCfg.level === 'DEBUG' ? 'selected' : ''}>DEBUG</option>
                            <option value="WARN"  ${logCfg.level === 'WARN'  ? 'selected' : ''}>WARN</option>
                            <option value="ERROR" ${logCfg.level === 'ERROR' ? 'selected' : ''}>ERROR</option>
                        </select>
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldLogMax')}</label>
                        <input type="number" id="log-maxEntries" min="10" max="1000"
                               value="${nz(logCfg.maxEntries, 300)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <small class="snw-form-row__hint">${T('settings.fieldRange', {min:10, max:1000})}</small>
                    </div>
                    <div class="snw-form-row">
                        <label>API Key ${apiKeySet
                            ? `<span style="color:var(--snw-success);font-size:11px;">${T('settings.configured')}</span>`
                            : `<span style="color:var(--snw-text-dim);font-size:11px;">${T('settings.notConfigured')}</span>`}</label>
                        <input type="password" id="api-key" value="" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false"
                               placeholder="${apiKeySet ? T('settings.keyPlaceholderChange') : T('settings.keyPlaceholderInput')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <label style="font-size:11px;margin-top:4px;">
                            <input type="checkbox" id="clear-api-key">
                            <span style="color:var(--snw-error);">${T('settings.deleteApiKey')}</span>
                        </label>
                    </div>
                    <div class="snw-form-row">
                        <label>Gemini API Key ${geminiKeySet
                            ? `<span style="color:var(--snw-success);font-size:11px;">${T('settings.configured')}</span>`
                            : `<span style="color:var(--snw-text-dim);font-size:11px;">${T('settings.notConfigured')}</span>`}</label>
                        <input type="password" id="gemini-key" value="" autocomplete="off" data-lpignore="true" data-1p-ignore="true" spellcheck="false"
                               placeholder="${geminiKeySet ? T('settings.keyPlaceholderChange') : T('settings.keyPlaceholderInput')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <label style="font-size:11px;margin-top:4px;">
                            <input type="checkbox" id="clear-gemini-key">
                            <span style="color:var(--snw-error);">${T('settings.deleteGeminiKey')}</span>
                        </label>
                    </div>
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn" data-action="test-api">${T('settings.testApiKey')}</button>
                    </div>
                `;

                // ---------- 2. 하드웨어 탭 ----------
                const pwm   = hw.fanPwm    || {};
                const curve = hw.fanConfig || {};
                const pir   = hw.pir       || {};
                const dht   = hw.tempHum   || {};
                const led   = hw.led       || {};

                const _rangeHint = (min, max, rec) => {
                    const range = T('settings.fieldRange', { min, max });
                    return rec
                        ? `<small class="snw-form-row__hint">${range} · ${T('settings.fieldRecommended', { range: rec })}</small>`
                        : `<small class="snw-form-row__hint">${range}</small>`;
                };

                const hwSlot = formContainer.querySelector('[data-slot="form-hw"]');
                hwSlot.innerHTML = `
                    <h3 class="snw-form-section">${T('settings.secFanPwm')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinPwm')}</label>
                        <input type="number" id="hw-pwm-pin" min="0" max="48" value="${nz(pwm.pin, 6)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldChannel')}</label>
                        <input type="number" id="hw-pwm-ch" min="0" max="15" value="${nz(pwm.channel, 0)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 15)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldFreq')}</label>
                        <input type="number" id="hw-pwm-freq" min="1000" max="80000" value="${nz(pwm.freq, 25000)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1000, 80000, '20000~30000')}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldRes')}</label>
                        <input type="number" id="hw-pwm-res" min="1" max="16" value="${nz(pwm.res, 10)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1, 16, '8~12')}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secFanCurve')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldStart')}</label>
                        <input type="number" id="hw-fan-start" min="0" max="100" value="${nz(curve.startPercentMin, 18)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100, '15~25')}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldComfortMin')}</label>
                        <input type="number" id="hw-fan-cmin" min="0" max="100" value="${nz(curve.comfortPercentMin, 22)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldComfortMax')}</label>
                        <input type="number" id="hw-fan-cmax" min="0" max="100" value="${nz(curve.comfortPercentMax, 65)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldHardMax')}</label>
                        <input type="number" id="hw-fan-hmax" min="0" max="100" value="${nz(curve.hardPercentMax, 90)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100)}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secPir')}</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-pir-enabled" ${asBool(pir.enabled) ? 'checked' : ''}>
                        <label for="hw-pir-enabled" style="margin:0;">${T('settings.fieldEnabled')}</label>
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinPir')}</label>
                        <input type="number" id="hw-pir-pin" min="0" max="48" value="${nz(pir.pin, 13)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldDebounce')}</label>
                        <input type="number" id="hw-pir-debounce" min="0" max="60" value="${nz(pir.debounceSec, 5)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 60)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldHold')}</label>
                        <input type="number" id="hw-pir-hold" min="0" max="3600" value="${nz(pir.holdSec, 120)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 3600, '60~300')}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secDht')}</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-dht-enabled" ${asBool(dht.enabled) ? 'checked' : ''}>
                        <label for="hw-dht-enabled" style="margin:0;">${T('settings.fieldEnabled')}</label>
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldType')}</label>
                        <input type="text" id="hw-dht-type" value="${esc(nz(dht.type, 'DHT22'))}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinDht')}</label>
                        <input type="number" id="hw-dht-pin" min="0" max="48" value="${nz(dht.pin, 17)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldInterval')}</label>
                        <input type="number" id="hw-dht-int" min="1" max="3600" value="${nz(dht.intervalSec, 30)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1, 3600, '10~60')}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secLed')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinLed')}</label>
                        <input type="number" id="hw-led-pin" min="0" max="48" value="${nz(led.pin, 48)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldNumPixels')}</label>
                        <input type="number" id="hw-led-num" min="1" max="16" value="${nz(led.numPixels, 1)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1, 16)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldBrightness')}</label>
                        <input type="number" id="hw-led-bright" min="0" max="255" value="${nz(led.defaultBrightness, 20)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 255, '20~80')}
                    </div>
                `;

                // ---------- 3. 통신/WS 탭 ----------
                const wsCh = (Array.isArray(ws.wsChConfig) && ws.wsChConfig.length > 0)
                    ? ws.wsChConfig
                    : [
                        { chIdx: 0, chName: 'state',   chIntervalMs: 800,  priority: 0 },
                        { chIdx: 1, chName: 'metrics', chIntervalMs: 1500, priority: 1 },
                        { chIdx: 2, chName: 'chart',   chIntervalMs: 1200, priority: 2 },
                        { chIdx: 3, chName: 'summary', chIntervalMs: 1500, priority: 3 }
                    ];

                this._wsChBaseline = wsCh.map((ch, i) => ({
                    chIdx:  (ch.chIdx != null) ? ch.chIdx : i,
                    chName: ch.chName || ('ch' + i)
                }));

                const wsEtc = ws.wsEtcConfig || {};
                let wsHtml = `<h3 class="snw-form-section">${T('settings.wsChannelConfig')}</h3>`;
                wsCh.forEach((ch, idx) => {
                    wsHtml += `
                        <div style="display:flex;gap:8px;margin-bottom:4px;align-items:center;font-size:12px;">
                            <span style="width:70px;color:var(--snw-text-dim);">${esc(ch.chName || ('ch' + idx))}</span>
                            <input type="number" value="${nz(ch.chIntervalMs, 1000)}" placeholder="Interval(ms)" style="flex:1;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);" data-ws-itv="${idx}">
                            <input type="number" value="${nz(ch.priority, 0)}" placeholder="Priority" style="flex:1;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);" data-ws-prio="${idx}">
                        </div>
                    `;
                });
                wsHtml += `
                    <div class="snw-form-row" style="margin-top:12px;">
                        <label>Chart Large Bytes</label>
                        <input type="number" id="ws-chartLarge" value="${nz(wsEtc.chartLargeBytes, 3500)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>Chart Throttle Mul</label>
                        <input type="number" id="ws-chartThrottle" value="${nz(wsEtc.chartThrottleMul, 2)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>WS Cleanup (ms)</label>
                        <input type="number" id="ws-cleanup" value="${nz(wsEtc.wsCleanupMs, 10000)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                `;
                formContainer.querySelector('[data-slot="form-ws"]').innerHTML = wsHtml;

                // ---------- 하단 Sticky 액션 바 ----------
                const actionBar = this.el.querySelector('[data-slot="action-bar"]');
                if (actionBar) {
                    actionBar.innerHTML = `
                        <div class="snw-form-sticky">
                            <label class="snw-form-row--bool" style="flex:1;margin:0;">
                                <input type="checkbox" id="save-and-reload" checked>
                                <span>${T('settings.saveAndReload')}</span>
                            </label>
                            <button type="button" class="snw-btn" data-action="reload">${T('settings.reload')}</button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="save">${T('settings.save')}</button>
                        </div>
                        <div class="snw-form-sticky-spacer"></div>
                    `;
                }
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.load');
            }
        }

        // =========================================================
        // _onSave : 저장 (탭에 상관없이 모든 input 값을 수집)
        // =========================================================
        async _onSave() {
            const q = sel => this.el.querySelector(sel);

            // [O-18] 범위 검증
            const validations = [
                { sel: '#hw-pwm-pin',     min: 0,    max: 48,    field: 'PWM Pin' },
                { sel: '#hw-pwm-freq',    min: 1000, max: 80000, field: 'Frequency' },
                { sel: '#hw-pwm-res',     min: 1,    max: 16,    field: 'Resolution' },
                { sel: '#hw-led-pin',     min: 0,    max: 48,    field: 'LED Pin' },
                { sel: '#hw-led-bright',  min: 0,    max: 255,   field: 'Brightness' },
                { sel: '#hw-led-num',     min: 1,    max: 16,    field: 'Num Pixels' },
                { sel: '#hw-pir-hold',    min: 0,    max: 3600,  field: 'PIR Hold' },
                { sel: '#hw-dht-int',     min: 1,    max: 3600,  field: 'DHT Interval' }
            ];
            let hasError = false;
            validations.forEach(v => {
                const el = q(v.sel);
                if (!el) return;
                const val = Number(el.value);
                if (isNaN(val) || val < v.min || val > v.max) {
                    el.classList.add('is-error');
                    hasError = true;
                } else {
                    el.classList.remove('is-error');
                }
            });
            if (hasError) {
                SNW.ToastUtil.error(SNW.I18n.t('validate.multiErrors', { count: validations.length }));
                const firstErr = this.el.querySelector('.is-error');
                if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            // 보안 (API Key) 처리
            const apiKeyVal      = q('#api-key')         ? q('#api-key').value.trim()      : '';
            const geminiKeyVal   = q('#gemini-key')      ? q('#gemini-key').value.trim()   : '';
            const clearApiKey    = q('#clear-api-key')   ? q('#clear-api-key').checked     : false;
            const clearGeminiKey = q('#clear-gemini-key')? q('#clear-gemini-key').checked  : false;

            const securityPatch = {};
            if (clearApiKey)              securityPatch.clearApiKey = true;
            else if (apiKeyVal.length)    securityPatch.apiKey = apiKeyVal;
            if (clearGeminiKey)           securityPatch.clearGeminiApiKey = true;
            else if (geminiKeyVal.length) securityPatch.geminiApiKey = geminiKeyVal;

            // WS 채널 처리
            const wsChArr = [];
            const seenIdx = new Set();
            this.el.querySelectorAll('[data-ws-itv]').forEach(el => {
                const idx    = Number(el.getAttribute('data-ws-itv'));
                const prioEl = q(`[data-ws-prio="${idx}"]`);
                const base   = this._wsChBaseline.find(b => b.chIdx === idx) || { chName: 'ch' + idx };
                seenIdx.add(idx);
                wsChArr.push({
                    chIdx:        idx,
                    chName:       base.chName || ('ch' + idx),
                    chIntervalMs: Number(el.value) || 0,
                    priority:     prioEl ? Number(prioEl.value) : 0
                });
            });
            this._wsChBaseline.forEach(b => {
                if (!seenIdx.has(b.chIdx)) {
                    wsChArr.push({ chIdx: b.chIdx, chName: b.chName, chIntervalMs: 1000, priority: 0 });
                }
            });
            wsChArr.sort((a, b) => a.chIdx - b.chIdx);

            // 페이로드 구성
            const patch = {
                meta: { deviceName: q('#meta-deviceName').value },
                system: {
                    logging: {
                        level:      q('#log-level').value,
                        maxEntries: Number(q('#log-maxEntries').value)
                    },
                    webSocket: {
                        wsChConfig: wsChArr,
                        wsEtcConfig: {
                            chartLargeBytes:  Number(q('#ws-chartLarge').value),
                            chartThrottleMul: Number(q('#ws-chartThrottle').value),
                            wsCleanupMs:      Number(q('#ws-cleanup').value)
                        }
                    }
                },
                security: securityPatch,
                hw: {
                    fanPwm: {
                        pin:     Number(q('#hw-pwm-pin').value),
                        channel: Number(q('#hw-pwm-ch').value),
                        freq:    Number(q('#hw-pwm-freq').value),
                        res:     Number(q('#hw-pwm-res').value)
                    },
                    fanConfig: {
                        startPercentMin:   Number(q('#hw-fan-start').value),
                        comfortPercentMin: Number(q('#hw-fan-cmin').value),
                        comfortPercentMax: Number(q('#hw-fan-cmax').value),
                        hardPercentMax:    Number(q('#hw-fan-hmax').value)
                    },
                    pir: {
                        enabled:     q('#hw-pir-enabled').checked,
                        pin:         Number(q('#hw-pir-pin').value),
                        debounceSec: Number(q('#hw-pir-debounce').value),
                        holdSec:     Number(q('#hw-pir-hold').value)
                    },
                    tempHum: {
                        enabled:     q('#hw-dht-enabled').checked,
                        type:        q('#hw-dht-type').value,
                        pin:         Number(q('#hw-dht-pin').value),
                        intervalSec: Number(q('#hw-dht-int').value)
                    },
                    led: {
                        pin:               Number(q('#hw-led-pin').value),
                        numPixels:         Number(q('#hw-led-num').value),
                        defaultBrightness: Number(q('#hw-led-bright').value)
                    }
                }
            };

            try {
                await SNW.Api.patchSystem(patch);
                await SNW.Api.saveConfig();

                const autoReload = q('#save-and-reload') ? q('#save-and-reload').checked : false;
                if (autoReload && !window.SNW_OFFLINE) {
                    await SNW.Api.reload();
                    SNW.ToastUtil.success(SNW.I18n.t('msg.saveAndReloadSuccess'));
                } else {
                    SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                }

                await this._loadSystem();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.save');
            }
        }

        // =========================================================
        // _onReload : 재적용 (dirty 경고 포함)
        // =========================================================
        async _onReload() {
            try {
                const dirty = await SNW.Api.getConfigDirty().catch(() => null);
                const hasDirty = dirty && Object.values(dirty).some(v => v === true);
                if (hasDirty) {
                    const content = document.createElement('div');
                    content.textContent = SNW.I18n.t('settings.dirtyWarning');
                    content.style.cssText = 'padding: 8px 0; color: var(--snw-warn);';
                    SNW.UI.modal(
                        SNW.I18n.t('common.warning'),
                        content,
                        () => { this._doReload(); return true; },
                        null
                    );
                    return;
                }
                await this._doReload();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.reload');
            }
        }

        async _doReload() {
            if (window.SNW_OFFLINE) {
                SNW.ToastUtil.info(SNW.I18n.t('settings.offlineReloadNotice'));
                return;
            }
            try {
                const res = await SNW.Api.reload();
                SNW.ToastUtil.success(SNW.I18n.t('settings.reloadRequested', { status: (res && res.result) || 'queued' }));
                setTimeout(async () => {
                    try {
                        const st = await SNW.Api.getState();
                        const ctl = (st && st.control) || {};
                        if (ctl.pendingReload === true) {
                            SNW.ToastUtil.info(SNW.I18n.t('settings.reloadInProgress'));
                        } else if (ctl.lastReloadOk === false) {
                            SNW.ToastUtil.error(SNW.I18n.t('settings.reloadFailed'));
                        } else {
                            SNW.ToastUtil.success(SNW.I18n.t('settings.reloadComplete'));
                        }
                    } catch { /* ignore */ }
                }, 2000);
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.reload');
            }
        }

        // =========================================================
        // _onTestApi : 저장된 API Key로 테스트
        // =========================================================
        async _onTestApi() {
            try {
                await SNW.Api.getState();
                SNW.ToastUtil.success(SNW.I18n.t('settings.testApiSuccess'));
            } catch (e) {
                SNW.ToastUtil.error(SNW.I18n.t('settings.testApiFail', { msg: e.message || 'HTTP 401' }));
            }
        }

        // =========================================================
        // _onFactoryReset : 공장 초기화 (확인 단어 입력)
        // =========================================================
        async _onFactoryReset() {
            const content = document.createElement('div');
            content.innerHTML = `
                <p style="color:var(--snw-error); margin-bottom:12px;">
                    <strong>${SNW.I18n.t('settings.factoryResetItems')}</strong>
                </p>
                <ul style="margin: 0 0 16px 20px; color: var(--snw-text-dim);">
                    <li>Wi-Fi 설정 (AP: <b>NatureWind</b> / <b>2540</b>)</li>
                    <li>스케줄, 프로필, 프리셋</li>
                    <li>API Key</li>
                </ul>
                <p style="margin-bottom:8px; color: var(--snw-warn);">
                    <strong>${SNW.I18n.t('reconnect.body')}</strong>
                </p>
                <input type="text" id="confirm-word"
                       placeholder="${SNW.I18n.t('settings.factoryResetConfirmWord')}"
                       style="width:100%; padding:8px; background:var(--snw-surface-2); border:1px solid var(--snw-border); color:var(--snw-text);">
            `;

            SNW.UI.modal(
                SNW.I18n.t('settings.factoryResetTitle'),
                content,
                async () => {
                    const word = content.querySelector('#confirm-word').value.trim();
                    if (word !== SNW.I18n.t('settings.factoryResetWord')) {
                        SNW.ToastUtil.warn(SNW.I18n.t('settings.factoryResetConfirmWord'));
                        return false;
                    }
                    try {
                        await SNW.Api.factoryReset();
                        SNW.ToastUtil.success(SNW.I18n.t('settings.factoryResetSuccess'), 8000);
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
                null,
                { okLabel: SNW.I18n.t('settings.factoryReset'), width: '440px' }
            );
        }
    };
})(window.SNW);


/* ---- 245.page.simulation.js (12340 bytes) ---- */
// =========================================================
// 245.page.simulation.js — SNW.Page.Simulation (SIM-6 재설계)
// 파라미터 덤프 → 바람 체험실
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
    (function (SNW) {
        'use strict';
        SNW.Page.Simulation = class Simulation {
            constructor(container) {
                this.el = container;
                this._active = true;
                this._mode = 'preview';
            }

            async mount() {
                this.el.innerHTML = '';
                this._renderShell();
                await this._loadPresets();
                this._bindEvents();
            }
            unmount() { this._active = false; }

                _renderShell() {
                    this.el.innerHTML = `
                <section class="snw-card">
                    <h2>🎮 바람 체험실</h2>
                    <div class="snw-tabs" style="margin-bottom:12px;display:flex;gap:4px;">
                        <button type="button" class="snw-tab-btn is-active" data-mode="preview">🎬 가상 체험</button>
                        <button type="button" class="snw-tab-btn" data-mode="real">🔊 실제 체험</button>
                    </div>
                    <div data-slot="content"></div>
                    <details class="snw-accordion" style="margin-top:16px;">
                        <summary style="cursor:pointer;font-weight:600;padding:6px 0;">⚙️ 고급 파라미터 (개발자용)</summary>
                        <div class="snw-accordion__content" data-slot="advanced" style="padding:12px;background:var(--snw-surface);border-radius:6px;margin-top:8px;"></div>
                    </details>
                </section>`;
                }

        async _loadPresets() {
                    try {
                const data = await SNW.Api.listWindProfiles();
                const presets = data?.windDict?.presets || [];
                const styles  = data?.windDict?.styles  || [];
                SNW.Store.set({ _presetsCache: presets, _stylesCache: styles });

                    const sim = SNW.Store.get().sim || {};
                    const content = this.el.querySelector('[data-slot="content"]');
                    content.innerHTML = `
                    <h3 style="margin-bottom:8px;">프리셋 선택</h3>
                    <div id="sim-presets" class="snw-preset-grid" style="margin-bottom:16px;display:grid;grid-template-columns:repeat(5, 1fr);gap:6px;"></div>
                    <h3 style="margin-bottom:8px;">스타일 선택</h3>
                    <div id="sim-styles" class="snw-style-selector" style="margin-bottom:16px;display:flex;gap:6px;"></div>
                    <canvas data-pv-canvas width="600" height="200"
                            style="width:100%;height:200px;background:var(--snw-bg-2);border-radius:6px;margin-bottom:8px;"></canvas>
                    <div data-pv-info style="font-size:12px;color:var(--snw-text-dim);margin-bottom:12px;"></div>
                    <button type="button" class="snw-btn snw-btn-primary" data-action="apply"
                            style="width:100%;padding:10px;font-weight:bold;">이 설정 적용</button>`;

                    const presetGrid = content.querySelector('#sim-presets');
                    presets.forEach(p => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'snw-preset-card' + (p.code === (sim.presetCode || 'OCEAN') ? ' is-selected' : '');
                        btn.dataset.code = p.code;
                        btn.innerHTML = `<span class="snw-preset-card__name">${SNW.I18n.t('preset.' + p.code) || p.name}</span>`;
                        btn.onclick = () => {
                            presetGrid.querySelectorAll('.snw-preset-card').forEach(c => c.classList.remove('is-selected'));
                            btn.classList.add('is-selected');
                            this._updatePreview();
                        };
                        presetGrid.appendChild(btn);
                    });

                    const styleTabs = content.querySelector('#sim-styles');
                    styles.forEach(s => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'snw-style-btn' + (s.code === (sim.styleCode || 'BALANCE') ? ' is-active' : '');
                        btn.dataset.style = s.code;
                        btn.textContent = SNW.I18n.t('style.' + s.code) || s.code;
                        btn.onclick = () => {
                            styleTabs.querySelectorAll('.snw-style-btn').forEach(b => b.classList.remove('is-active'));
                            btn.classList.add('is-active');
                            this._updatePreview();
                        };
                        styleTabs.appendChild(btn);
                    });

                    // [Phase5 5.3] async 메서드 호출 (fire-and-forget)
                    this._updatePreview();
                    this._renderAdvanced();
                } catch (e) { SNW.LogUtil.warn('[Sim] load 실패', e); }
            }

        // ======================================================
        // [Phase5 5.3] async 전환 (ADR-5: generate 반환 Promise)
        //  - 기존: sync 호출 → preview가 Promise → preview.points undefined
        //  - 이후: await → 실제 파형 데이터 사용
        // ======================================================
        async _updatePreview() {
            const pc = this.el.querySelector('#sim-presets .is-selected')?.dataset.code || 'OCEAN';
            const sc = this.el.querySelector('#sim-styles .is-active')?.dataset.style || 'BALANCE';

            if (!SNW.Preview || typeof SNW.Preview.generate !== 'function') return;

            let pv = null;
            try {
                pv = await SNW.Preview.generate(pc, sc, null);
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Sim] preview fail', e);
                return;
            }
            if (!pv) return;

            const cv = this.el.querySelector('[data-pv-canvas]');
            if (cv && typeof SNW.Preview._animate === 'function') {
                SNW.Preview._animate(cv, pv.points);
            }

            const f = SNW.Preview.toFeelings(pv.intensity, pv.variability, pv.gustFreq);
            const infoEl = this.el.querySelector('[data-pv-info]');
            if (infoEl) {
                infoEl.innerHTML = `
                    평균 <b>${pv.avg} m/s</b> ·
                    시원함 ${'●'.repeat(f.coolness)}${'○'.repeat(5 - f.coolness)} ·
                    부드러움 ${'●'.repeat(f.smoothness)}${'○'.repeat(5 - f.smoothness)} ·
                    역동성 ${'●'.repeat(f.dynamism)}${'○'.repeat(5 - f.dynamism)}`;
            }
        }

        // ======================================================
        // [Phase5 5.3] motion 소스 수정
        //  - 이전: data?.motion?.motion (data=windDict → 항상 undefined)
        //  - 이후: SNW.Api.getMotion() 비동기 fetch
        // ======================================================
        async _renderAdvanced() {
            const slot = this.el.querySelector('[data-slot="advanced"]');
            if (!slot) return;

            let motion = {};
            try {
                const data = await SNW.Api.getMotion();
                motion = (data && data.motion) || {};
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Sim] motion fetch fail', e);
            }

            const t = motion.timing || {};
            const s = motion.sim || {};
            slot.innerHTML = `
                <div class="snw-form-row" style="margin-bottom:8px;"><label>Sim Interval (ms)</label>
                    <input type="number" id="sim-interval" value="${t.simIntervalMs ?? 500}"
                           style="padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);width:100%;border-radius:4px;"></div>
                <div class="snw-form-row" style="margin-bottom:8px;"><label>Gust Interval (ms)</label>
                    <input type="number" id="sim-gust-interval" value="${t.gustIntervalMs ?? 2000}"
                           style="padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);width:100%;border-radius:4px;"></div>
                <div class="snw-form-row" style="margin-bottom:8px;"><label>Turb Sigma</label>
                    <input type="number" step="0.01" id="sim-turbsigma" value="${s.turbSigma ?? 0.5}"
                           style="padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);width:100%;border-radius:4px;"></div>
                <button type="button" class="snw-btn" data-action="save-adv" style="margin-top:8px;">고급 저장</button>`;
        }

        _bindEvents() {
                                this.el.querySelectorAll('[data-mode]').forEach(btn => {
                                    btn.onclick = () => {
                                        this._mode = btn.dataset.mode;
                                        this.el.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('is-active', b === btn));
                                        SNW.ToastUtil.info(this._mode === 'preview' ? '🎬 미리보기 모드' : '🔊 실제 체험 모드');
                                    };
                                });
                                this.el.addEventListener('click', async (e) => {
                                    const act = e.target.closest('[data-action]');
                                    if (!act) return;
                                    if (act.dataset.action === 'apply') await this._onApply();
                                    if (act.dataset.action === 'save-adv') await this._onSaveAdv();
                                });
                            }

        async _onApply() {
                                const pc = this.el.querySelector('#sim-presets .is-selected')?.dataset.code || 'OCEAN';
                                const sc = this.el.querySelector('#sim-styles .is-active')?.dataset.style || 'BALANCE';
                                try {
                                    if (this._mode === 'real') {
                                        await SNW.Api.overridePreset({ presetCode: pc, styleCode: sc, durationSec: 30 });
                                        SNW.ToastUtil.success('실제 30초 체험 시작');
                                    } else {
                                        await SNW.Api.patchSim({
                                            presetCode: pc, styleCode: sc,
                                            override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 }
                                        });
                                        SNW.ToastUtil.success('설정 적용 완료');
                                    }
                        } catch(e) { SNW.ErrorHandler.handle(e, 'sim.apply'); }
                    }

        async _onSaveAdv() {
                        const q = s => this.el.querySelector(s);
                        try {
                            await SNW.Api.patchMotion({
                                motion: {
                                    timing: {
                                        simIntervalMs: Number(q('#sim-interval').value),
                                        gustIntervalMs: Number(q('#sim-gust-interval').value)
                                    },
                                    sim: { turbSigma: Number(q('#sim-turbsigma').value) }
                                }
                            });
                            await SNW.Api.saveConfig();
                        SNW.ToastUtil.success('고급 설정 저장');
                    } catch(e) { SNW.ErrorHandler.handle(e, 'sim.adv'); }
                }
            };
        }) (window.SNW);


/* ---- 250.page.diagnostics.js (6363 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 250.page.diagnostics.js
 * 모듈     : SNW.Page.Diagnostics
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - FSM 상세 상태 / Reason
 *  - Heap / FS / Dirty Flags
 *  - NVS 런타임 상태 (control.system, runtime)
 *  - API 버전 4종
 *  - 5초 자동 새로고침
 * ------------------------------------------------------
 */
/* ---- 250.page.diagnostics.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Diagnostics = class Diagnostics {
        constructor(container) { this.el = container; this._active = true; this._timers = []; }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.diagnostics());
            await this._refresh();
            const id = setInterval(() => { if (this._active) this._refresh(); }, 5000);
            this._timers.push(id);
            SNW.DomUtil.delegate(this.el, '[data-action="show-config"]', 'click', () => this._showConfig());
            SNW.DomUtil.delegate(this.el, '[data-action="save-dirty"]', 'click', async () => {
                try { await SNW.Api.saveConfig(); SNW.ToastUtil.success(SNW.I18n.t('diagnostics.saveDirtySuccess')); this._refresh(); } catch(e) { SNW.ErrorHandler.handle(e, 'diag.save'); }
            });
        }
        unmount(){ this._active = false; this._timers.forEach(id => clearInterval(id)); }

        async _refresh() {
            const slot = this.el.querySelector('[data-slot="panel"]'); 
            if (!slot) return;
            try {
                const [state, diag, dirty, metrics] = await Promise.all([
                    SNW.Api.getState().catch(()=>null),
                    SNW.Api.diag().catch(()=>null),
                    SNW.Api.getConfigDirty().catch(()=>null),
                    SNW.Api.getMetrics ? SNW.Api.getMetrics().catch(()=>null) : null
                ]);
                if (!this._active) return;
                const ctl = (state && state.control) || {};
                const sim = (state && state.sim) || {};
                const dg = diag || {};
                const dr = dirty || {};
                const mt = (metrics && metrics.metrics) || {};
                const rt = (state && state.runtime) || {};

                slot.innerHTML = `
                    <h3>FSM State</h3>
                    <div class="snw-kv"><span>state</span><b>${ctl.state || '-'}</b></div>
                    <div class="snw-kv"><span>reason</span><b>${ctl.reason || '-'}</b></div>
                    <div class="snw-kv"><span>runSource</span><b>${ctl.runSource ?? '-'}</b></div>
                    <div class="snw-kv"><span>profileMode</span><b>${ctl.profileMode ? 'ON' : 'OFF'}</b></div>
                    
                    <h3>${SNW.I18n.t('diagnostics.metricsRealtime')}</h3>
                    <div class="snw-kv"><span>active</span><b>${mt.active ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>overrideActive</span><b>${mt.overrideActive ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>overrideRemain(sec)</span><b>${mt.overrideRemain ?? '-'}</b></div>
                    <div class="snw-kv"><span>simPhase</span><b>${mt.simPhase || '-'}</b></div>
                    <div class="snw-kv"><span>autoOffTimerArmed</span><b>${mt.autoOffTimerArmed ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>holdRemainMs</span><b>${mt.holdRemainMs ?? '-'}</b></div>

                    <h3>System</h3>
                    <div class="snw-kv"><span>Heap</span><b>${dg.heap != null ? dg.heap + ' B' : '-'}</b></div>
                    <div class="snw-kv"><span>FS Used</span><b>${dg.fs_used != null ? dg.fs_used + ' B' : '-'}</b></div>
                    <div class="snw-kv"><span>FS Total</span><b>${dg.fs_total != null ? dg.fs_total + ' B' : '-'}</b></div>

                    <h3>Sim</h3>
                    <div class="snw-kv"><span>phase</span><b>${sim.phase || '-'}</b></div>
                    <div class="snw-kv"><span>windSpeed</span><b>${sim.windSpeed != null ? sim.windSpeed.toFixed(2) : '-'}</b></div>
                    <div class="snw-kv"><span>pwmDuty</span><b>${sim.pwmDuty != null ? sim.pwmDuty.toFixed(1) : '-'}</b></div>
                    <div class="snw-kv"><span>gust</span><b>${sim.gustActive ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>thermal</span><b>${sim.thermalActive ? 'Y' : 'N'}</b></div>

                    <h3>Dirty Flags</h3>
                    <div class="snw-kv"><span>system</span><b>${dr.system ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>wifi</span><b>${dr.wifi ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>motion</span><b>${dr.motion ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>schedules</span><b>${dr.schedules ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>userProfiles</span><b>${dr.userProfiles ? 'Y' : 'N'}</b></div>
                    <div class="snw-kv"><span>windDict</span><b>${dr.windDict ? 'Y' : 'N'}</b></div>

                    <h3>Runtime (NVS)</h3>
                    <div class="snw-kv"><span>runMode</span><b>${rt.runMode ?? '-'}</b></div>
                    <div class="snw-kv"><span>lastScheduleNo</span><b>${rt.lastScheduleNo ?? '-'}</b></div>
                    <div class="snw-kv"><span>lastUserProfileNo</span><b>${rt.lastUserProfileNo ?? '-'}</b></div>
                `;
            } catch(e) { console.error('[Diagnostics] refresh', e); }
        }

        async _showConfig() {
            try {
                const cfg = await SNW.Api.getConfigAll();
                const content = document.createElement('div');
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(cfg, null, 2);
                pre.style.cssText = 'max-height:400px;overflow:auto;background:var(--snw-bg-2);padding:12px;border-radius:4px;font-size:11px;color:var(--snw-text);';
                content.appendChild(pre);
                SNW.UI.modal(SNW.I18n.t('diagnostics.allJson'), content, async () => true);
            } catch(e) { SNW.ToastUtil.error(SNW.I18n.t('diagnostics.fetchFail')); }
        }
    };
})(window.SNW);


/* ---- 260.page.firmware.js (5321 bytes) ---- */
// =========================================================
// 260.page.firmware.js — SNW.Page.Firmware
// Layer 4 (페이지 로직)
// [O-10] UploadManager 위임 — 페이지 이탈에도 진행률 유지
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Firmware = class Firmware {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._uploading = false;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.firmware());
			SNW.I18n.applyTo(this.el);
			
			await this._loadVersion();
			
			SNW.DomUtil.delegate(this.el, '[data-action="upload-fw"]', 'click', () => this._onUploadFw());
			SNW.DomUtil.delegate(this.el, '[data-action="upload-file"]', 'click', () => this._onUploadFile());
			
			SNW.LogUtil.info('[Firmware] mount 완료');
		}
		
		// [O-10] 페이지 이탈 방지
		unmount() {
			if (this._uploading) {
				const ok = confirm('업로드가 진행 중입니다. 페이지를 떠나시겠습니까?\n(진행률은 백그라운드로 계속 표시됩니다)');
				if (!ok) return false;
			}
			this._active = false;
			return true;
		}
		
		async _loadVersion() {
			const slot = this.el.querySelector('[data-slot="form"]');
			if (!slot) return;
			
			try {
				const [v, chk] = await Promise.all([
					SNW.Api.version().catch(() => null),
					SNW.Api.checkFw().catch(() => null)
				]);
				if (!this._active) return;
				
				const ver = v || {};
				const ck = chk || {};
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-firmware-panel">
                        <div class="snw-kv"><span>Current</span><b>${SNW.DomUtil.escape(ver.fw || '-')}</b></div>
                        <div class="snw-kv"><span>Status</span><b>${SNW.DomUtil.escape(ck.status || '-')}</b></div>
                        <div class="snw-kv"><span>Latest</span><b>${SNW.DomUtil.escape(ck.latest_version || '-')}</b></div>

                        <h3>${SNW.I18n.t('firmware.otaUpdate')}</h3>
                        <input type="file" accept=".bin" data-slot="fw-file">
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="upload-fw">${SNW.I18n.t('firmware.uploadBtn')}</button>
                        <div class="snw-progress" data-slot="fw-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-fw-fill></div></div>
                            <span data-fw-label>0%</span>
                        </div>

                        <h3>${SNW.I18n.t('firmware.fileUpload')}</h3>
                        <input type="file" data-slot="file-file">
                        <button type="button" class="snw-btn"
                                data-action="upload-file">${SNW.I18n.t('firmware.uploadBtn')}</button>
                        <div class="snw-progress" data-slot="file-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-file-fill></div></div>
                            <span data-file-label>0%</span>
                        </div>
                    </div>
                `);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.version');
			}
		}
		
		// [O-10] UploadManager 위임
		async _onUploadFw() {
			const inp = this.el.querySelector('[data-slot="fw-file"]');
			if (!inp?.files?.[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="fw-progress"]');
			const fill = this.el.querySelector('[data-fw-fill]');
			const label = this.el.querySelector('[data-fw-label]');
			if (progBox) progBox.style.display = '';
			
			this._uploading = true;
			try {
				await SNW.UploadManager.start(`firmware-${Date.now()}`, 'firmware', file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
				// UploadManager가 toast 처리
			} catch (e) {
				// UploadManager가 ErrorHandler 처리
			} finally {
				this._uploading = false;
				if (progBox) setTimeout(() => { progBox.style.display = 'none'; }, 2000);
			}
		}
		
		async _onUploadFile() {
			const inp = this.el.querySelector('[data-slot="file-file"]');
			if (!inp?.files?.[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="file-progress"]');
			const fill = this.el.querySelector('[data-file-fill]');
			const label = this.el.querySelector('[data-file-label]');
			if (progBox) progBox.style.display = '';
			
			this._uploading = true;
			try {
				await SNW.UploadManager.start(`file-${Date.now()}`, 'file', file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
			} catch (e) {
				// UploadManager가 처리
			} finally {
				this._uploading = false;
				if (progBox) setTimeout(() => { progBox.style.display = 'none'; }, 2000);
			}
		}
	};
})(window.SNW);


/* ---- 260.page.monitor.js (19062 bytes) ---- */
// =========================================================
// 260.page.monitor.js — SNW.Page.Monitor (Stage 7 회고 + 실시간 EQ)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Monitor = class Monitor {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._currentTab = 'live';
            this._unsubs = [];
            this._liveEq = null;
            this._retroRange = '24h';
        }

        async mount() {
            this.el.innerHTML = '';
            this._render();
            this._bindStore();
            await this._loadLiveData();

            // 라이브 이퀄라이저 초기화
            const liveEqSlot = this.el.querySelector('[data-slot="live-eq"]');
            if (liveEqSlot && SNW.UI && typeof SNW.UI.equalizer === 'function') {
                this._liveEq = SNW.UI.equalizer(liveEqSlot, { bars: 40, fps: 30, maxWind: 11 });
            }

            // 탭 초기화
            this._switchTab(this._currentTab);
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
            if (this._liveEq && typeof this._liveEq.stop === 'function') {
                this._liveEq.stop();
            }
        }

        _render() {
            this.el.innerHTML = `
                <div class="snw-monitor">
                    <div class="snw-tabs">
                        <button type="button" class="snw-tab-btn is-active" data-tab="live">📊 실시간</button>
                        <button type="button" class="snw-tab-btn" data-tab="retro">🎬 회고</button>
                    </div>
                    <div data-tab-content="live"></div>
                    <div data-tab-content="retro" style="display:none;"></div>
                </div>`;

            this.el.querySelectorAll('[data-tab]').forEach(btn => {
                btn.onclick = () => this._switchTab(btn.getAttribute('data-tab'));
            });
        }

        _switchTab(tab) {
            this._currentTab = tab;
            this.el.querySelectorAll('[data-tab]').forEach(b =>
                b.classList.toggle('is-active', b.getAttribute('data-tab') === tab));
            this.el.querySelectorAll('[data-tab-content]').forEach(c => {
                c.style.display = (c.getAttribute('data-tab-content') === tab) ? 'block' : 'none';
            });

            if (tab === 'live')  this._renderLive();
            if (tab === 'retro') this._renderRetro();
        }

        // =========================================================
        // 라이브 탭
        // =========================================================
        _renderLive() {
            const slot = this.el.querySelector('[data-tab-content="live"]');
            if (!slot) return;
            slot.innerHTML = `
                <div class="snw-card">
                    <h2>📊 실시간 풍속</h2>
                    <div data-slot="live-eq" class="snw-monitor__eq" style="height:100px;"></div>
                    <div class="snw-monitor__live-info" data-slot="live-info"></div>
                </div>
                <div class="snw-card">
                    <h2>🌡️ 센서</h2>
                    <div class="snw-monitor__sensors" data-slot="live-sensors"></div>
                </div>`;

            // 이퀄라이저 재초기화
            const eqSlot = slot.querySelector('[data-slot="live-eq"]');
            if (eqSlot && SNW.UI && typeof SNW.UI.equalizer === 'function') {
                this._liveEq = SNW.UI.equalizer(eqSlot, { bars: 40, fps: 30, maxWind: 11 });
                this._liveEq.start();
            }
            this._onLiveUpdate();
        }

        _onLiveUpdate() {
            const storeData = (SNW.Store && typeof SNW.Store.get === 'function') ? SNW.Store.get() : {};
            const ctl = storeData.control;
            const sim = storeData.sim;
            const session = storeData.session;

            if (this._liveEq && sim) {
                this._liveEq.push(sim.windSpeed || 0);
            }

            const infoEl = this.el.querySelector('[data-slot="live-info"]');
            if (infoEl && session && session.type !== 'NONE') {
                let title = '';
                if (session.type === 'PLAYLIST') title = session.profileName;
                else if (session.type === 'PRESET') title = `${session.presetCode} · ${session.styleCode}`;
                else title = `일반 선풍기 ${Math.round(session.percent || 0)}%`;

                infoEl.innerHTML = `
                    <div class="snw-monitor__live-row">
                        <span>${session.trigger === 'MANUAL' ? '✋' : '⏰'} ${SNW.DomUtil.escape(title)}</span>
                    </div>
                    ${session.type === 'PLAYLIST' ? `
                        <div class="snw-monitor__live-row">
                            <span>Step ${session.currentStep}/${session.totalSteps}</span>
                            <span>${this._fmtTime(session.stepRemainSec || 0)}</span>
                        </div>` : ''}
                `;
            } else if (infoEl) {
                infoEl.innerHTML = '<div class="snw-empty">세션 없음</div>';
            }

            const sensorsEl = this.el.querySelector('[data-slot="live-sensors"]');
            if (sensorsEl && ctl && ctl.sensor) {
                const s = ctl.sensor;
                sensorsEl.innerHTML = `
                    <div class="snw-sensor-row">
                        <span>🌡️ 온도</span><b>${(s.tempC || 0).toFixed(1)}°C</b>
                    </div>
                    <div class="snw-sensor-row">
                        <span>💧 습도</span><b>${Math.round(s.humidity || 0)}%</b>
                    </div>
                    <div class="snw-sensor-row">
                        <span>👤 재실</span><b>${s.motionActive ? '감지' : '부재'}</b>
                    </div>
                `;
            }
        }

        // =========================================================
        // 회고 탭
        // =========================================================
        async _renderRetro() {
            const slot = this.el.querySelector('[data-tab-content="retro"]');
            if (!slot) return;
            slot.innerHTML = `
                <div class="snw-card">
                    <h2>🎬 세션 회고</h2>
                    <div class="snw-toolbar" style="margin-bottom:12px;">
                        <select data-slot="retro-range">
                            <option value="1h">최근 1시간</option>
                            <option value="24h" selected>최근 24시간</option>
                            <option value="7d">최근 7일</option>
                        </select>
                        <button type="button" class="snw-btn" data-action="refresh">🔄</button>
                    </div>
                    <div data-slot="retro-content" class="snw-loading">로딩 중...</div>
                </div>`;

            const refreshBtn = slot.querySelector('[data-action="refresh"]');
            if (refreshBtn) refreshBtn.onclick = () => this._loadRetro();
            const rangeSelect = slot.querySelector('[data-slot="retro-range"]');
            if (rangeSelect) rangeSelect.onchange = () => this._loadRetro();

            await this._loadRetro();
        }

        async _loadRetro() {
            const slot = this.el.querySelector('[data-slot="retro-content"]');
            if (!slot) return;

            const rangeEl = this.el.querySelector('[data-slot="retro-range"]');
            const range = rangeEl ? rangeEl.value : '24h';

            const now = Math.floor(Date.now() / 1000);
            const durMap = { '1h': 3600, '24h': 86400, '7d': 604800 };
            const since = now - (durMap[range] || 86400);

            slot.innerHTML = '<div class="snw-loading">로딩 중...</div>';   // [Phase5 5.9] 로딩 표시

            try {
                const getTlFn = (SNW.Api && (SNW.Api.getTimeline || SNW.Api.getMonitorTimeline)) ?
                    (SNW.Api.getTimeline || SNW.Api.getMonitorTimeline).bind(SNW.Api) : () => Promise.resolve({ events: [] });
                const getSumFn = (SNW.Api && SNW.Api.getSessionSummary) ?
                    SNW.Api.getSessionSummary.bind(SNW.Api) : () => Promise.resolve(null);

                const [timeline, summary] = await Promise.all([
                    getTlFn(since).catch(() => ({ events: [] })),
                    getSumFn(since, now).catch(() => null),
                ]);

                if (!this._active) return;

                slot.innerHTML = '';
                slot.appendChild(this._renderSummary(summary));
                slot.appendChild(this._renderTimeline(timeline));
                slot.appendChild(this._renderEventList(timeline));
            } catch (e) {
                slot.innerHTML = '<div class="snw-error">회고 데이터 로드 실패</div>';
            }
        }

        // ======================================================
        // [Phase5 5.9] 이중 스키마 수용
        //  - 신 스키마: summary.stats.{totalSessions, totalActiveSec, ...}
        //  - 구 스키마: {totalEvents, sessionStarts, sessionEnds, stepChanges}
        //  - 후자는 C++ querySessionSummary() 현 구현과 일치
        //  - 구 스키마에서는 파생 가능한 필드만 표시
        // ======================================================
        _renderSummary(summary) {
            const div = document.createElement('div');
            div.className = 'snw-retro-summary';

            if (!summary) {
                div.innerHTML = '<div class="snw-empty">세션 데이터 없음</div>';
                return div;
            }

            // 신 스키마 우선, 없으면 구 스키마에서 파생
            let stats = summary.stats || null;

            if (!stats) {
                const starts = Number(summary.sessionStarts || 0);
                const ends   = Number(summary.sessionEnds   || 0);
                const total  = Number(summary.totalEvents   || 0);

                if (total === 0 && starts === 0) {
                    div.innerHTML = '<div class="snw-empty">세션 데이터 없음</div>';
                    return div;
                }

                stats = {
                    totalSessions:  starts,
                    totalActiveSec: 0,    // 구 스키마에 시간 필드 없음
                    avgWindSpeed:   0,
                    maxWindSpeed:   0,
                    avgTempC:       0,
                    presenceRatio:  0,
                    _legacy:        true,
                };
            }

            div.innerHTML = `
                <div class="snw-retro-summary__title">세션 요약</div>
                <div class="snw-retro-summary__grid">
                    <div><span>총 세션</span><b>${stats.totalSessions || 0}회</b></div>
                    <div><span>총 가동</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : this._fmtDuration(stats.totalActiveSec || 0)
                    }</b></div>
                    <div><span>평균 풍속</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.avgWindSpeed || 0).toFixed(1) + ' m/s'
                    }</b></div>
                    <div><span>최고 풍속</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.maxWindSpeed || 0).toFixed(1) + ' m/s'
                    }</b></div>
                    <div><span>평균 온도</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.avgTempC || 0).toFixed(1) + '°C'
                    }</b></div>
                    <div><span>재실 비율</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : Math.round((stats.presenceRatio || 0) * 100) + '%'
                    }</b></div>
                </div>
                ${stats._legacy
                    ? `<div style="font-size:11px;color:var(--snw-text-dim);margin-top:8px;">
                        ※ 상세 통계는 서버 업데이트 후 제공됩니다.
                    </div>`
                    : ''}
            `;
            return div;
        }

        // ======================================================
        // [Phase5 5.9] timeline.from/to 폴백
        //  - C++ queryTimeline()은 from/to를 반환하지 않음
        //  - events의 첫/마지막 t로 자동 계산
        // ======================================================
        _renderTimeline(timeline) {
            const div = document.createElement('div');
            div.className = 'snw-retro-timeline';

            if (!timeline || !timeline.events || timeline.events.length === 0) {
                div.innerHTML = '<div class="snw-empty">이벤트 없음</div>';
                return div;
            }

            const events = timeline.events;
            // from/to 폴백 (C++ 응답에 없는 경우 계산)
            const fromTs = (timeline.from != null)
                ? timeline.from
                : (events[0]?.t ?? 0);
            const toTs   = (timeline.to != null)
                ? timeline.to
                : (events[events.length - 1]?.t ?? Math.floor(Date.now() / 1000));

            const normalized = { ...timeline, from: fromTs, to: toTs, events };

            div.innerHTML = `
                <div class="snw-retro-timeline__title">이벤트 타임라인</div>
                <div class="snw-retro-timeline__bar">
                    ${events.map(e => this._eventMarker(e, normalized)).join('')}
                </div>
            `;
            return div;
        }

        _eventMarker(e, timeline) {
            const start = timeline.from || 0;
            const end   = timeline.to   || Math.floor(Date.now() / 1000);
            const span  = Math.max(1, end - start);
            const pos   = Math.min(100, Math.max(0, ((e.t - start) / span) * 100));

            const icon = {
                0: '⚪',   // STATE_CHANGE
                1: '➡️',   // STEP_CHANGE
                2: '▶',    // SESSION_START
                3: '⏹',    // SESSION_END
                4: '✋',   // MANUAL_OVERRIDE
                5: '🌙',   // AUTOOFF
                6: '⏸',    // PAUSE
                7: '▶',    // RESUME
            }[e.eventType] || '•';

            const color = {
                0: '#59636e',
                1: '#4a9eff',
                2: '#3fb950',
                3: '#8b949e',
                4: '#d29922',
                5: '#f0883e',
                6: '#d29922',
                7: '#3fb950',
            }[e.eventType] || '#59636e';

            return `
                <div class="snw-retro-marker" style="left:${pos}%;background:${color};" title="${this._fmtTimeOfDay(e.t)} · ${SNW.DomUtil.escape(e.label || '')}">
                    <span>${icon}</span>
                </div>
            `;
        }

        _renderEventList(timeline) {
            const div = document.createElement('div');
            div.className = 'snw-retro-events';

            if (!timeline || !timeline.events || timeline.events.length === 0) {
                return div;
            }

            const events = timeline.events.slice(-30).reverse();
            div.innerHTML = `
                <div class="snw-retro-events__title">이벤트 목록 (최근 30개)</div>
                ${events.map(e => `
                    <div class="snw-retro-event-row">
                        <span class="snw-retro-event-row__time">${this._fmtTimeOfDay(e.t)}</span>
                        <span class="snw-retro-event-row__icon">${
                            2 === e.eventType ? '▶' :
                            3 === e.eventType ? '⏹' :
                            1 === e.eventType ? '➡️' :
                            4 === e.eventType ? '✋' :
                            5 === e.eventType ? '🌙' :
                            6 === e.eventType ? '⏸' :
                            7 === e.eventType ? '▶' : '•'
                        }</span>
                        <span class="snw-retro-event-row__label">${SNW.DomUtil.escape(e.label || '')}</span>
                    </div>
                `).join('')}
            `;
            return div;
        }

        // =========================================================
        // Store
        // =========================================================
        _bindStore() {
            if (SNW.Store && typeof SNW.Store.subscribe === 'function') {
                this._unsubs.push(
                    SNW.Store.subscribe(() => {
                        if (this._active && this._currentTab === 'live') {
                            this._onLiveUpdate();
                        }
                    })
                );
            }
        }

        _fmtTime(sec) {
            if (!sec || sec < 0) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${String(s).padStart(2, '0')}`;
        }

        _fmtDuration(sec) {
            if (!sec) return '0분';
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }

        _fmtTimeOfDay(epoch) {
            const d = new Date(epoch * 1000);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        async _loadLiveData() {
            try {
                if (SNW.Api && typeof SNW.Api.getState === 'function') {
                    const st = await SNW.Api.getState();
                    if (st && SNW.Store && typeof SNW.Store.set === 'function') {
                        SNW.Store.set({
                            control: st.control,
                            sim: st.sim,
                            session: st.control?.session,
                        });
                    }
                }
            } catch (e) {
                if (SNW.LogUtil && typeof SNW.LogUtil.warn === 'function') {
                    SNW.LogUtil.warn('monitor load failed', e);
                }
            }
        }
    };
})(window.SNW);


/* ---- 270.page.network.js (16146 bytes) ---- */
// =========================================================
// 270.page.network.js — SNW.Page.Network
// Layer 4 (페이지 로직)
// [O-14] Wi-Fi 스캔 → 명시적 연결 모달 (즉시 추가 금지)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Network = class Network {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._wifiConfig = null;
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.network());
            SNW.I18n.applyTo(this.el);

            try { await this._loadWifiState(); }   catch (e) {}
            try { await this._loadWifiConfig(); } catch (e) {}
            try { await this._loadSystemTime(); } catch (e) {}

            SNW.DomUtil.delegate(this.el, '[data-action="scan"]',       'click', () => this._onScan());
            SNW.DomUtil.delegate(this.el, '[data-action="time-save"]',  'click', () => this._onSaveTime());
            SNW.DomUtil.delegate(this.el, '[data-action="wifi-save"]',  'click', () => this._onSaveWifi());
            SNW.DomUtil.delegate(this.el, '[data-action="add-sta"]',    'click', () => this._onAddSta());
            SNW.DomUtil.delegate(this.el, '[data-action="del-sta"]',    'click', (e, el) => this._onDeleteSta(Number(el.getAttribute('data-idx'))));
        }

        unmount() { this._active = false; }

        async _loadWifiState() {
            let state = {};
            try {
                const data = await SNW.Api.getWifiState();
                state = (data && data.wifi && data.wifi.state) || {};
            } catch {}

            const slot = this.el.querySelector('[data-slot="wifi-state"]');
            if (!slot) return;

            const esc = SNW.DomUtil.escape;
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;

            slot.innerHTML = `
                <div class="snw-kv"><span>${t('network.wifiMode', 'Wi-Fi 모드')}</span><b>${esc(state.mode_name || '-')}</b></div>
                <div class="snw-kv"><span>${t('network.status', '연결 상태')}</span><b>${esc(state.status || '-')}</b></div>
                <div class="snw-kv"><span>SSID</span><b>${esc(state.ssid || '-')}</b></div>
                <div class="snw-kv"><span>${t('network.ip', 'IP 주소')}</span><b>${esc(state.ip || '-')}</b></div>
                <div class="snw-kv"><span>RSSI</span><b>${state.rssi != null ? state.rssi + ' dBm' : '-'}</b></div>
                <div class="snw-kv"><span>${t('network.mac', 'MAC 주소')}</span><b>${esc(state.mac || '-')}</b></div>
                <div class="snw-kv"><span>Hostname</span><b>${esc(state.hostname || '-')}</b></div>
                <div class="snw-kv"><span>${t('network.timeSynced', '시간 동기화')}</span>
                    <b>${state.timeSynced ? t('network.synced', '완료') : t('network.notSynced', '미완료')}</b></div>
                <div class="snw-kv"><span>Re-connect</span><b>${state.reconnectAttempts ?? 0}</b></div>
            `;
        }

        async _loadWifiConfig() {
            try {
                const data = await SNW.Api.getWifiConfig();
                this._wifiConfig = (data && data.wifi) ? data.wifi : { wifiMode: 2, ap: { ssid: '', pass: '' }, sta: [] };
                if (!this._wifiConfig.sta) this._wifiConfig.sta = [];
                if (!this._wifiConfig.ap)  this._wifiConfig.ap  = { ssid: '', pass: '' };
                this._renderWifiConfigForm();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'network.loadWifi');
            }
        }

        _renderWifiConfigForm() {
            const slot = this.el.querySelector('[data-slot="wifi-config"]');
            if (!slot || !this._wifiConfig) return;

            const mode = this._wifiConfig.wifiMode;
            const ap   = this._wifiConfig.ap;
            const sta  = this._wifiConfig.sta;

            let html = `
                <div class="snw-form-row">
                    <label>${SNW.I18n.t('network.wifiMode')}</label>
                    <select id="wifi-mode" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <option value="0" ${mode === 0 ? 'selected' : ''}>AP Only</option>
                        <option value="1" ${mode === 1 ? 'selected' : ''}>STA Only</option>
                        <option value="2" ${mode === 2 ? 'selected' : ''}>AP + STA</option>
                    </select>
                </div>
                <h4 style="margin-top:12px;color:var(--snw-text-dim);">${SNW.I18n.t('network.apSettings')}</h4>
                <div class="snw-form-row">
                    <label>AP SSID</label>
                    <input type="text" id="ap-ssid" value="${SNW.DomUtil.escape(ap.ssid)}"
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>
                <div class="snw-form-row">
                    <label>AP Password</label>
                    <input type="password" id="ap-pass" value="${SNW.DomUtil.escape(ap.pass)}"
                           autocomplete="off" data-lpignore="true" data-1p-ignore="true"
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>

                <h4 style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;color:var(--snw-text-dim);">
                    <span>${SNW.I18n.t('network.staSettings')} (${sta.length})</span>
                    <button type="button" class="snw-btn" data-action="add-sta"
                            style="padding:4px 8px;font-size:11px;">+ ${SNW.I18n.t('common.add')}</button>
                </h4>
                <div id="sta-list">`;

            if (sta.length === 0) {
                html += `<div style="font-size:12px;color:var(--snw-text-dim);padding:8px;">${SNW.I18n.t('network.noStaNotice')}</div>`;
            } else {
                sta.forEach((s, idx) => {
                    html += `
                        <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
                            <input type="text" value="${SNW.DomUtil.escape(s.ssid)}" placeholder="SSID"
                                   style="flex:1;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"
                                   data-sta-ssid="${idx}">
                            <input type="password" value="${SNW.DomUtil.escape(s.pass)}" placeholder="Password"
                                   autocomplete="off" data-lpignore="true" data-1p-ignore="true"
                                   style="flex:1;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"
                                   data-sta-pass="${idx}">
                            <button type="button" class="snw-btn" data-action="del-sta" data-idx="${idx}"
                                    style="padding:8px;color:var(--snw-error);">🗑</button>
                        </div>`;
                });
            }

            html += `</div>
                <div class="snw-toolbar" style="margin-top:12px;">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="wifi-save">${SNW.I18n.t('network.saveWifi')}</button>
                    <button type="button" class="snw-btn" data-action="scan">${SNW.I18n.t('network.scanWifi')}</button>
                </div>
                <div data-slot="scan-result" class="snw-scan-result" style="margin-top:12px;"></div>
            `;
            slot.innerHTML = html;
        }

        _onAddSta() {
            if (!this._wifiConfig.sta) this._wifiConfig.sta = [];
            this._wifiConfig.sta.push({ ssid: '', pass: '' });
            this._renderWifiConfigForm();
        }

        _onDeleteSta(idx) {
            if (!this._wifiConfig.sta) return;
            this._wifiConfig.sta.splice(idx, 1);
            this._renderWifiConfigForm();
        }

        async _onSaveWifi() {
            const mode   = Number(this.el.querySelector('#wifi-mode').value);
            const apSsid = this.el.querySelector('#ap-ssid').value;
            const apPass = this.el.querySelector('#ap-pass').value;

            const newSta = [];
            this.el.querySelectorAll('[data-sta-ssid]').forEach(el => {
                const idx  = el.getAttribute('data-sta-ssid');
                const ssid = el.value.trim();
                const passEl = this.el.querySelector(`[data-sta-pass="${idx}"]`);
                const pass = passEl ? passEl.value : '';
                if (ssid) newSta.push({ ssid, pass });
            });

            const patch = { wifi: { wifiMode: mode, ap: { ssid: apSsid, pass: apPass }, sta: newSta } };
            try {
                await SNW.Api.patchWifi(patch);
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'network.saveWifi');
            }
        }

        async _loadSystemTime() {
            try {
                const data = await SNW.Api.getSystem();
                const sys = (data && data.system && data.system.timeCfg) || {};
                const slot = this.el.querySelector('[data-slot="time-config"]');
                if (!slot) return;
                slot.innerHTML = `
                    <div class="snw-form-row">
                        <label>NTP Server</label>
                        <input type="text" id="ntp-server" value="${SNW.DomUtil.escape(sys.ntpServer || 'pool.ntp.org')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>Timezone</label>
                        <input type="text" id="timezone" value="${SNW.DomUtil.escape(sys.timezone || 'Asia/Seoul')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>Sync Interval (min)</label>
                        <input type="number" id="sync-interval" min="1" max="1440" value="${sys.syncIntervalMin || 60}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn snw-btn-primary" data-action="time-save">${SNW.I18n.t('network.saveTime')}</button>
                    </div>
                `;
            } catch (e) {
                SNW.LogUtil.warn('[Network] time config load 실패', e);
            }
        }

        async _onSaveTime() {
            const ntp  = this.el.querySelector('#ntp-server').value.trim();
            const tz   = this.el.querySelector('#timezone').value.trim();
            const sync = Number(this.el.querySelector('#sync-interval').value);

            if (!ntp) {
                SNW.ToastUtil.error(SNW.I18n.t('validate.required', { field: 'NTP Server' }));
                return;
            }
            if (isNaN(sync) || sync < 1 || sync > 1440) {
                SNW.ToastUtil.error(SNW.I18n.t('validate.range', { field: 'Sync Interval', min: 1, max: 1440 }));
                return;
            }

            try {
                await SNW.Api.patchSystem({ timeCfg: { ntpServer: ntp, timezone: tz, syncIntervalMin: sync } });
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'network.saveTime');
            }
        }

        // =========================================================
        // [O-14] 스캔 결과 — 명시적 연결 버튼
        // =========================================================
        async _onScan() {
            const resultSlot = this.el.querySelector('[data-slot="scan-result"]');
            if (!resultSlot) return;

            resultSlot.innerHTML = `<div style="font-size:12px;padding:8px;">${SNW.I18n.t('common.loading')}</div>`;

            try {
                const data = await SNW.Api.scanWifi();
                const scan = (data && data.wifi && data.wifi.scan) || [];
                resultSlot.innerHTML = '';

                if (!scan.length) {
                    resultSlot.innerHTML = `<div style="font-size:12px;color:var(--snw-text-dim);padding:8px;">${SNW.I18n.t('common.noData')}</div>`;
                    return;
                }

                scan.forEach(ap => {
                    const item = document.createElement('div');
                    item.className = 'snw-wifi-item';
                    item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--snw-surface-2);margin-bottom:4px;border-radius:4px;';
                    item.innerHTML = `
                        <div>
                            <div style="font-size:13px;">${SNW.DomUtil.escape(ap.ssid)}</div>
                            <div style="font-size:11px;color:var(--snw-text-dim);">${ap.rssi} dBm · ${SNW.DomUtil.escape(ap.enc || '-')}</div>
                        </div>
                        <button type="button" class="snw-btn snw-btn--sm">
                            ${SNW.I18n.t('network.connect')}
                        </button>`;
                    item.querySelector('button').onclick = () => this._onConnectSsid(ap.ssid);
                    resultSlot.appendChild(item);
                });
            } catch (e) {
                resultSlot.innerHTML = `<div style="color:var(--snw-error);padding:8px;">${SNW.I18n.t('common.error')}</div>`;
            }
        }

        // [O-14] 연결 모달 — 명시적 비밀번호 입력
        _onConnectSsid(ssid) {
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="snw-form-row">
                    <label>SSID</label>
                    <input type="text" value="${SNW.DomUtil.escape(ssid)}" readonly
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>
                <div class="snw-form-row">
                    <label>Password (8자 이상)</label>
                    <input type="password" id="connect-pass" minlength="8"
                           autocomplete="off" data-lpignore="true" data-1p-ignore="true"
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>
            `;

            SNW.UI.modal(
                SNW.I18n.t('network.connect'),
                content,
                async () => {
                    const pass = content.querySelector('#connect-pass').value;
                    if (pass.length < 8) {
                        SNW.ToastUtil.error('비밀번호는 8자 이상이어야 합니다');
                        return false;
                    }

                    // 중복 확인
                    const idx = this._wifiConfig.sta.findIndex(s => s.ssid === ssid);
                    if (idx >= 0) this._wifiConfig.sta[idx].pass = pass;
                    else this._wifiConfig.sta.push({ ssid, pass });

                    this._renderWifiConfigForm();
                    SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                    return true;
                }
            );
        }
    };
})(window.SNW);


/* ---- 280.page.logs.js (3977 bytes) ---- */
// =========================================================
// 280.page.logs.js — SNW.Page.Logs
// Layer 4 (페이지 로직)
// [P1-12] 필터 UI를 Tpl로 통합 (mount마다 중복 생성 방지)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Logs = class Logs {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._unsubs = [];
			this._wsUnsubs = [];
			this._viewer = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.logs());
			SNW.I18n.applyTo(this.el);
			
			// 뷰어 마운트
			this._viewer = SNW.UI.logViewer({
				root: this.el.querySelector('[data-slot="log"]')
			});
			
			// 필터/툴바를 Tpl 삽입 (beforebegin → Tpl 사용으로 변경)
			const logSlot = this.el.querySelector('[data-slot="log"]');
			if (logSlot) {
				// 이미 존재하는지 확인 후 삽입
				let toolbar = this.el.querySelector('.snw-logs-toolbar');
				if (!toolbar) {
					toolbar = document.createElement('div');
					toolbar.className = 'snw-toolbar snw-logs-toolbar';
					toolbar.innerHTML = `
                        <select data-slot="log-filter">
                            <option value="0">${SNW.I18n.t('log.filterAll')}</option>
                            <option value="1">ERROR</option>
                            <option value="2">WARN</option>
                            <option value="3">INFO</option>
                            <option value="4">DEBUG</option>
                        </select>
                        <button type="button" data-action="log-clear" class="snw-btn">${SNW.I18n.t('log.clear')}</button>
                        <button type="button" data-action="log-export" class="snw-btn">${SNW.I18n.t('log.export')}</button>
                    `;
					logSlot.parentElement.insertBefore(toolbar, logSlot);
				}
				
				const sel = toolbar.querySelector('[data-slot="log-filter"]');
				if (sel) {
					sel.addEventListener('change', () => {
						if (this._viewer) this._viewer.setFilter(Number(sel.value) || 0);
					});
				}
			}
			
			// 초기 로드
			await this._loadInitial();
			
			// WS log 구독
			const wsLog = SNW.WsManager.get('log');
			if (wsLog) {
				const unsub = wsLog.onMessage((entry) => {
					if (!this._active || !this._viewer) return;
					this._viewer.append(entry);
				});
				this._wsUnsubs.push(unsub);
			}
			
			SNW.DomUtil.delegate(this.el, '[data-action="log-clear"]', 'click', () => {
				if (this._viewer) this._viewer.clear();
			});
			SNW.DomUtil.delegate(this.el, '[data-action="log-export"]', 'click', () => this._exportJson());
			
			SNW.LogUtil.info('[Logs] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._unsubs.forEach(fn => { try { fn(); } catch {} });
			this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
			this._unsubs = [];
			this._wsUnsubs = [];
			this._viewer = null;
		}
		
		async _loadInitial() {
			try {
				const data = await SNW.Api.getLogs();
				if (!this._active) return;
				const list = (data && data.logs) || [];
				list.forEach(entry => this._viewer && this._viewer.append(entry));
			} catch (e) {
				SNW.LogUtil.warn('[Logs] 초기 로드 실패', e);
			}
		}
		
		_exportJson() {
			try {
				const body = this.el.querySelector('.snw-log-viewer');
				if (!body) return;
				const rows = Array.from(body.children).map(r => r.textContent);
				const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `snw_logs_${Date.now()}.json`;
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
				SNW.ToastUtil.success(SNW.I18n.t('common.success'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'logs.export');
			}
		}
	};
})(window.SNW);

/* ---- 290.page.ai.js (16644 bytes) ---- */
// =========================================================
// 290.page.ai.js — SNW.Page.AI
// Layer 4 (페이지 로직: AI 스튜디오, 2-turn REST 제어 & Gemini Live Voice)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
	'use strict';

	const MAX_MSG_LEN = 4000;

	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = [];
			this._isListening = false;
			this._currentMode = 'rest'; // 'rest' | 'live'
			this._liveCostStatus = null;
		}

		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);

			const slot = this.el.querySelector('[data-slot="chat"]');
			const examplePlaceholder = SNW.I18n.t('ai.placeholder');

			slot.innerHTML = `
                <div class="snw-ai-chat">
                    <div class="snw-ai-header">
                        <div style="display:flex;gap:6px;align-items:center;">
                            <div class="snw-btn-group" role="group">
                                <button type="button" class="snw-btn snw-btn--sm snw-btn--primary" data-mode-btn="rest">
                                    ${SNW.I18n.t('ai.modeRest')}
                                </button>
                                <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-mode-btn="live">
                                    ${SNW.I18n.t('ai.modeLive')}
                                </button>
                            </div>
                            <span class="snw-badge snw-badge--info" data-slot="cost-badge" style="display:none;font-size:0.75rem;"></span>
                        </div>
                        <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-action="clear-history">
                            ${SNW.I18n.t('ai.clearHistory')}
                        </button>
                    </div>

                    <!-- REST Chat View -->
                    <div class="snw-ai-rest-view" data-view="rest">
                        <div class="snw-ai-messages" data-slot="messages"></div>
                        <div class="snw-ai-examples">
                            <button type="button" class="snw-btn snw-btn--sm" data-example="바다 바람 틀어줘">바다 바람 틀어줘</button>
                            <button type="button" class="snw-btn snw-btn--sm" data-example="30분 후 꺼줘">30분 후 꺼줘</button>
                            <button type="button" class="snw-btn snw-btn--sm" data-example="스케줄대로 해줘">스케줄대로 해줘</button>
                            <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example1')}">${SNW.I18n.t('ai.example1')}</button>
                        </div>
                        <div class="snw-ai-input">
                            <textarea data-slot="input" rows="2" style="flex:1;"
                                      placeholder="${SNW.DomUtil.escape(examplePlaceholder)}"
                                      maxlength="${MAX_MSG_LEN}"></textarea>
                            <button type="button" class="snw-btn snw-btn--secondary" data-action="voice" title="음성 입력">
                                🎤
                            </button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="send">
                                ${SNW.I18n.t('ai.send')}
                            </button>
                        </div>
                    </div>

                    <!-- Live Voice View -->
                    <div class="snw-ai-live-view" data-view="live">
                        <div class="snw-live-orb-container">
                            <div class="snw-live-orb" data-slot="live-orb"></div>
                        </div>
                        <div class="snw-live-status-text" data-slot="live-status">
                            ${SNW.I18n.t('ai.liveStart')}
                        </div>
                        <div class="snw-live-transcript" data-slot="live-transcript"></div>
                        <div class="snw-live-actions-log" data-slot="live-actions"></div>
                        <div>
                            <button type="button" class="snw-btn snw-btn--lg snw-btn-primary" data-action="live-toggle" style="min-width:160px;">
                                ${SNW.I18n.t('ai.liveStart')}
                            </button>
                        </div>
                    </div>
                </div>`;

			// 이전 대화 이력 로드
			if (SNW.AIClient) {
				this._history = SNW.AIClient.loadHistory();
				this._renderHistory();
			}

			// 모드 전환 버튼 바인딩
			SNW.DomUtil.delegate(this.el, '[data-mode-btn]', 'click', (e, btn) => {
				const mode = btn.getAttribute('data-mode-btn');
				this._switchMode(mode);
			});

			// 이벤트 위임
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
			SNW.DomUtil.delegate(this.el, '[data-action="voice"]', 'click', () => this._onVoiceToggle());
			SNW.DomUtil.delegate(this.el, '[data-action="clear-history"]', 'click', () => this._onClearHistory());
			SNW.DomUtil.delegate(this.el, '[data-action="live-toggle"]', 'click', () => this._onLiveToggle());

			// 예시 버튼 클릭
			SNW.DomUtil.delegate(this.el, '[data-example]', 'click', (e, btn) => {
				const inp = this.el.querySelector('[data-slot="input"]');
				if (inp) {
					inp.value = btn.getAttribute('data-example');
					inp.focus();
				}
			});

			const inp = this.el.querySelector('[data-slot="input"]');
			if (inp) {
				inp.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						this._onSend();
					}
				});
			}

			// 초기 비용 상태 로드
			this._loadCostStatus();

			SNW.LogUtil.info('[AI] mount 완료');
		}

		unmount() {
			this._active = false;
			if (SNW.AIVoice) {
				SNW.AIVoice.stopListening();
				SNW.AIVoice.stopSpeaking();
			}
			if (SNW.AiLive && SNW.AiLive.isConnected()) {
				SNW.AiLive.stopSession();
			}
		}

		async _loadCostStatus() {
			try {
				if (SNW.Api && SNW.Api.getAiCostStatus) {
					const now = new Date();
					const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
					const res = await SNW.Api.getAiCostStatus(today);
					this._updateCostBadge(res);
				}
			} catch (e) {
				console.warn('[AI] Failed to load cost status:', e);
			}
		}

		_updateCostBadge(costData) {
			if (!costData) return;
			this._liveCostStatus = costData;
			const badge = this.el.querySelector('[data-slot="cost-badge"]');
			if (!badge) return;

			const usedMin = Math.round((costData.audioSec || 0) / 60);
			const capMin = Math.round((costData.capSec || 1800) / 60);
			const cost = ((costData.estCostUsdX1000 || 0) / 1000).toFixed(3);

			badge.style.display = 'inline-block';
			badge.textContent = SNW.I18n.t('ai.liveCost', { min: usedMin, cap: capMin, cost });

			badge.classList.remove('snw-badge--info', 'snw-badge--warn', 'snw-badge--danger');
			if (costData.level === 'cap') {
				badge.classList.add('snw-badge--danger');
			} else if (costData.level === 'warn') {
				badge.classList.add('snw-badge--warn');
			} else {
				badge.classList.add('snw-badge--info');
			}
		}

		_switchMode(mode) {
			if (this._currentMode === mode) return;

			// Live 실행 중 다른 모드로 전환 시 Live 중단
			if (this._currentMode === 'live' && SNW.AiLive && SNW.AiLive.isConnected()) {
				SNW.AiLive.stopSession();
			}

			this._currentMode = mode;

			const restBtn = this.el.querySelector('[data-mode-btn="rest"]');
			const liveBtn = this.el.querySelector('[data-mode-btn="live"]');
			const restView = this.el.querySelector('[data-view="rest"]');
			const liveView = this.el.querySelector('[data-view="live"]');

			if (mode === 'live') {
				if (restBtn) restBtn.className = 'snw-btn snw-btn--sm snw-btn--ghost';
				if (liveBtn) liveBtn.className = 'snw-btn snw-btn--sm snw-btn--primary';
				if (restView) restView.style.display = 'none';
				if (liveView) liveView.style.display = 'block';
			} else {
				if (restBtn) restBtn.className = 'snw-btn snw-btn--sm snw-btn--primary';
				if (liveBtn) liveBtn.className = 'snw-btn snw-btn--sm snw-btn--ghost';
				if (restView) restView.style.display = 'block';
				if (liveView) liveView.style.display = 'none';
			}
		}

		async _onLiveToggle() {
			if (!SNW.AiLive || !SNW.AiLive.isSupported()) {
				SNW.Toast.show(SNW.I18n.t('ai.voiceNotSupported'), 'warn');
				return;
			}

			const liveBtn = this.el.querySelector('[data-action="live-toggle"]');
			const orb = this.el.querySelector('[data-slot="live-orb"]');
			const statusText = this.el.querySelector('[data-slot="live-status"]');
			const transcriptBox = this.el.querySelector('[data-slot="live-transcript"]');
			const actionsLog = this.el.querySelector('[data-slot="live-actions"]');

			if (SNW.AiLive.isConnected() || SNW.AiLive.isConnecting()) {
				SNW.AiLive.stopSession();
				if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
				if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
				if (orb) {
					orb.style.transform = 'scale(1)';
					orb.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)';
				}
				return;
			}

			// 상한 사전 검사
			if (this._liveCostStatus && this._liveCostStatus.level === 'cap') {
				SNW.Toast.show(SNW.I18n.t('ai.dailyCapReached'), 'error');
				this._switchMode('rest');
				return;
			}

			if (statusText) statusText.textContent = SNW.I18n.t('ai.liveConnecting');
			if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStop');

			try {
				await SNW.AiLive.startSession({
					onStateChange: (state) => {
						if (!this._active) return;
						if (state === 'connected' || state === 'listening') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveConnected');
							if (orb) orb.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
						} else if (state === 'speaking') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveSpeaking');
							if (orb) orb.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
						} else if (state === 'executing') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.actionDone');
						} else if (state === 'idle' || state === 'closed') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
							if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
							if (orb) {
								orb.style.transform = 'scale(1)';
								orb.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
								orb.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)';
							}
						}
					},
					onText: (text, isComplete) => {
						if (!transcriptBox) return;
						if (text) {
							transcriptBox.textContent += text;
							transcriptBox.scrollTop = transcriptBox.scrollHeight;
						}
						if (isComplete) {
							transcriptBox.textContent += '\n';
						}
					},
					onToolCall: (name, args, res) => {
						if (!actionsLog) return;
						const item = document.createElement('div');
						item.textContent = `✓ ${name}: ${JSON.stringify(res || {})}`;
						actionsLog.appendChild(item);
					},
					onVolume: (level) => {
						if (!orb) return;
						const scale = 1.0 + level * 0.45;
						const blur = 20 + level * 30;
						orb.style.transform = `scale(${scale.toFixed(2)})`;
						orb.style.boxShadow = `0 0 ${blur.toFixed(0)}px rgba(59,130,246,0.8)`;
					},
					onCostUpdate: (costData) => {
						this._updateCostBadge(costData);
					},
					onError: (err) => {
						SNW.Toast.show(err.message || 'Live Voice error', 'error');
					}
				});
			} catch (e) {
				if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
				if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
				SNW.Toast.show(e.message || 'Live connection failed', 'error');
			}
		}

		_renderHistory() {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap || !this._history) return;
			wrap.innerHTML = '';
			for (const item of this._history) {
				this._appendMessage(item.role, item.text, false);
			}
		}

		_onClearHistory() {
			if (SNW.AIClient) {
				SNW.AIClient.clearHistory();
			}
			this._history = [];
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (wrap) wrap.innerHTML = '';
			SNW.Toast.show(SNW.I18n.t('ai.clearHistory'), 'info');
		}

		async _onVoiceToggle() {
			if (!SNW.AIVoice || !SNW.AIVoice.isSTTSupported()) {
				SNW.Toast.show(SNW.I18n.t('ai.voiceNotSupported'), 'warn');
				return;
			}

			const vBtn = this.el.querySelector('[data-action="voice"]');
			if (this._isListening) {
				SNW.AIVoice.stopListening();
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');
				return;
			}

			this._isListening = true;
			if (vBtn) vBtn.classList.add('snw-btn--active');
			SNW.Toast.show(SNW.I18n.t('ai.voiceListening'), 'info');

			try {
				const res = await SNW.AIVoice.startListening();
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');

				if (res && res.transcript) {
					const inp = this.el.querySelector('[data-slot="input"]');
					if (inp) {
						inp.value = res.transcript;
						this._onSend(true); // 음성 모드로 전송
					}
				}
			} catch (err) {
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');
				SNW.Toast.show(SNW.I18n.t('ai.micError'), 'error');
			}
		}

		async _onSend(isVoiceMode = false) {
			const inp = this.el.querySelector('[data-slot="input"]');
			const msg = (inp && inp.value || '').trim();
			if (!msg) return;
			inp.value = '';

			this._appendMessage('user', msg, true);
			this._appendMessage('assistant', SNW.I18n.t('ai.thinking'), false);

			try {
				let resText = '';
				let speechHint = '';
				let actions = [];

				if (SNW.AIClient) {
					const res = await SNW.AIClient.send(msg, this._history, {
						lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
						voiceMode: isVoiceMode
					});
					if (!this._active) return;

					if (res) {
						resText = res.text || '';
						speechHint = res._speechHint || resText;
						actions = res.actions || [];
					}
				} else {
					// 폴백
					const res = await SNW.Api.gemini({ message: msg });
					if (!this._active) return;
					resText = (res && res.text) || '(no response)';
				}

				if (!resText) resText = '(no response)';

				this._replaceLastAssistant(resText, actions);

				// 대화 이력 업데이트 및 저장
				this._history.push({ role: 'assistant', text: resText });
				if (SNW.AIClient) {
					SNW.AIClient.saveHistory(this._history);
				}

				// TTS 음성 출력
				if (speechHint && SNW.AIVoice && SNW.AIVoice.isTTSSupported()) {
					SNW.AIVoice.speak(speechHint);
				}

			} catch (e) {
				this._replaceLastAssistant('[ERROR] ' + (e.message || 'failed'), []);
				SNW.ErrorHandler.handle(e, 'ai.send');
			}
		}

		_appendMessage(role, text, saveToHistory = false) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const cls = role === 'user' ? 'is-user' : 'is-assistant';
			wrap.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-msg ${cls}">
                    <div class="snw-ai-bubble">${text}</div>
                </div>`);
			wrap.scrollTop = wrap.scrollHeight;

			if (saveToHistory) {
				this._history.push({ role, text });
				if (SNW.AIClient) {
					SNW.AIClient.saveHistory(this._history);
				}
			}
		}

		_replaceLastAssistant(text, actions = []) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const list = wrap.querySelectorAll('.snw-ai-msg.is-assistant');
			const last = list[list.length - 1];
			if (last) {
				const bubble = last.querySelector('.snw-ai-bubble');
				if (bubble) {
					let actionHtml = '';
					if (actions && actions.length > 0) {
						actionHtml = `<div class="snw-ai-actions" style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.2);font-size:0.85em;color:#4ade80;">`;
						for (const a of actions) {
							actionHtml += `<div>✓ ${SNW.DomUtil.escape(a.name)}: ${SNW.DomUtil.escape(a.result)}</div>`;
						}
						actionHtml += `</div>`;
					}
					bubble.innerHTML = `${SNW.DomUtil.escape(text)}${actionHtml}`;
				}
			}
			wrap.scrollTop = wrap.scrollHeight;
		}
	};
})(window.SNW);


/* ---- 290.page.automation.js (3405 bytes) ---- */
// =========================================================
// 290.page.automation.js — 자동화 페이지 (Studio/Playlist/스케줄/타이머)
// Layer 3 (페이지 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Automation = class Automation {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this.currentTab = params.tab || 'studio';
            this._active = true;
            this._panels = {};
        }

        async mount() {
            this.el.innerHTML = `
                <div class="snw-automation">
                    <div class="snw-tabs snw-automation__tabs" style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--snw-border,#2f3844);padding-bottom:8px;overflow-x:auto;">
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'studio'   ? 'is-active' : ''}" data-tab="studio">🎨 Studio</button>
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'playlist' ? 'is-active' : ''}" data-tab="playlist">🎵 Playlist</button>
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'schedule' ? 'is-active' : ''}" data-tab="schedule">⏰ 스케줄</button>
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'timer'    ? 'is-active' : ''}" data-tab="timer">⏱️ 타이머</button>
                    </div>
                    <div class="snw-automation__content" data-slot="panel"></div>
                </div>`;

            // 탭 클릭
            this.el.querySelectorAll('.snw-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.getAttribute('data-tab');
                    if (tab !== this.currentTab) {
                        SNW.Router.navigate(`/automation/${tab}`);
                    }
                });
            });

            await this._mountTab(this.currentTab);
        }

        unmount() {
            this._active = false;
            Object.values(this._panels).forEach(p => {
                if (p && typeof p.unmount === 'function') p.unmount();
            });
            this._panels = {};
        }

        async _mountTab(tab) {
            // 이전 탭 정리
            const prev = this._panels[this.currentTab];
            if (prev && prev !== this._panels[tab] && typeof prev.unmount === 'function') {
                prev.unmount();
            }

            const slot = this.el.querySelector('[data-slot="panel"]');
            if (!slot) return;
            slot.innerHTML = '';

            const PanelClass = {
                studio:   SNW.Studio,
                playlist: SNW.Playlist,
                schedule: SNW.SchedulePanel,
                timer:    SNW.TimerPanel,
            }[tab];

            if (!PanelClass) {
                slot.innerHTML = `<div class="snw-empty">${SNW.DomUtil ? SNW.DomUtil.escape(tab) : tab} 준비 중</div>`;
                return;
            }

            const panel = new PanelClass(slot, this.params);
            this._panels[tab] = panel;
            this.currentTab = tab;
            await panel.mount();
        }
    };
})(window.SNW);



/* ---- 291.studio.js (29436 bytes) ---- */
// =========================================================
// 291.studio.js — Wind Design Studio (작곡)
// Layer 3 (Studio 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // =========================================================
    // Step 편집기 (내부)
    // =========================================================
    class StepEditor {
        constructor(step, index, onChange, onDelete, onMoveUp, onMoveDown) {
            this.step = JSON.parse(JSON.stringify(step || this._defaultStep()));
            this.index = index;
            this.onChange = onChange;
            this.onDelete = onDelete;
            this.onMoveUp = onMoveUp;
            this.onMoveDown = onMoveDown;
            this.el = null;
            this._sparkline = null;
            this._debounceTimer = null;
        }

        _defaultStep() {
            return {
                stepNo: 1,
                durationMin: 20,
                type: 'PRESET',
                presetCode: 'OCEAN',
                styleCode: 'BALANCE',
                fixedSpeed: 0,
                override: {
                    enabled: false,
                    windIntensity: -1,
                    windVariability: -1,
                    gustFrequency: -1,
                },
            };
        }

        render() {
            const s = this.step;
            const isPreset = s.type === 'PRESET';
            const isFixed = s.type === 'FIXED';
            const isRest = s.type === 'REST';
            const ovr = s.override || { enabled: false };

            const el = document.createElement('div');
            el.className = 'snw-step-card';
            el.innerHTML = `
                <div class="snw-step-card__header">
                    <span class="snw-step-card__title">Step ${this.index + 1}</span>
                    <div class="snw-step-card__actions">
                        <button type="button" class="snw-icon-btn" data-action="up"   title="위로" ${this.index === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="snw-icon-btn" data-action="down" title="아래로">▼</button>
                        <button type="button" class="snw-icon-btn" data-action="sim-step" title="예상 파형 시뮬레이션">🎬</button>
                        <button type="button" class="snw-icon-btn snw-icon-btn--danger" data-action="delete" title="삭제">🗑</button>
                    </div>
                </div>

                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>타입</span>
                        <select data-field="type">
                            <option value="PRESET" ${isPreset ? 'selected' : ''}>프리셋 재생</option>
                            <option value="FIXED"  ${isFixed ? 'selected' : ''}>고정 풍속</option>
                            <option value="REST"   ${isRest ? 'selected' : ''}>휴지 (정지)</option>
                        </select>
                    </label>

                    <label class="snw-step-field">
                        <span>지속</span>
                        <div class="snw-step-field__row">
                            <input type="number" data-field="durationMin" min="1" max="1440" value="${s.durationMin || 20}">
                            <span class="snw-step-field__unit">분</span>
                        </div>
                    </label>
                </div>

                ${isPreset ? `
                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>프리셋</span>
                        <select data-field="presetCode">
                            ${this._presetOptions(s.presetCode)}
                        </select>
                    </label>
                    <label class="snw-step-field">
                        <span>스타일</span>
                        <select data-field="styleCode">
                            ${this._styleOptions(s.styleCode)}
                        </select>
                    </label>
                </div>` : ''}

                ${isFixed ? `
                <div class="snw-step-card__grid">
                    <label class="snw-step-field snw-step-field--full">
                        <span>고정 풍속 <b data-slot="fixed-label">${s.fixedSpeed || 50}%</b></span>
                        <input type="range" data-field="fixedSpeed" min="0" max="100" step="5" value="${s.fixedSpeed || 50}">
                    </label>
                </div>` : ''}

                ${isPreset ? `
                <details class="snw-step-card__override" ${ovr.enabled ? 'open' : ''}>
                    <summary style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
                        <label class="snw-step-checkbox" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                            <input type="checkbox" data-field="overrideEnabled" ${ovr.enabled ? 'checked' : ''}>
                            <span>⚙ 물리 세부 조정 (Override)</span>
                        </label>
                        ${ovr.enabled ? `<span class="snw-badge snw-badge--warn" style="font-size:10px;padding:2px 6px;">수동 튜닝됨</span>` : ''}
                    </summary>
                    <div class="snw-step-card__override-body">
                        <div style="display:flex;justify-content:flex-end;margin-bottom:6px;">
                            <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-action="reset-ovr" style="font-size:11px;padding:2px 8px;" title="선택한 프리셋의 기본 물리 파라미터로 되돌립니다">
                                ↺ 기본값 원복
                            </button>
                        </div>
                        <label class="snw-step-field snw-step-field--full">
                            <span>강도 <b data-slot="ovr-int-label">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b></span>
                            <input type="range" data-field="ovrIntensity" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>변동성 <b data-slot="ovr-var-label">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b></span>
                            <input type="range" data-field="ovrVariability" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>돌풍 <b data-slot="ovr-gust-label">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}%</b></span>
                            <input type="range" data-field="ovrGust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}">
                        </label>
                    </div>
                </details>` : ''}

                <div class="snw-step-card__sparkline" data-slot="sparkline" style="height:40px;margin-top:10px;"></div>
                <div class="snw-step-card__sparkline-meta" data-slot="sparkline-meta" style="font-size:11px;color:var(--snw-text-dim,#8b949e);margin-top:4px;"></div>
            `;

            this.el = el;

            // 이벤트
            const btnDel = el.querySelector('[data-action="delete"]');
            if (btnDel) btnDel.onclick = () => this.onDelete(this.index);
            const btnUp = el.querySelector('[data-action="up"]');
            if (btnUp) btnUp.onclick = () => this.onMoveUp(this.index);
            const btnDown = el.querySelector('[data-action="down"]');
            if (btnDown) btnDown.onclick = () => this.onMoveDown(this.index);
            const btnSim = el.querySelector('[data-action="sim-step"]');
            if (btnSim) {
                btnSim.onclick = async () => {
                    if (SNW.UI && typeof SNW.UI.simulationModal === 'function') {
                        await SNW.UI.simulationModal({
                            mode: 'single',
                            a: {
                                presetCode: this.step.presetCode || 'OCEAN',
                                styleCode: this.step.styleCode || 'BALANCE',
                                override: this.step.override,
                            },
                        });
                    }
                };
            }

            const btnResetOvr = el.querySelector('[data-action="reset-ovr"]');
            if (btnResetOvr) {
                btnResetOvr.onclick = () => this._resetOverrideToDefaults(el);
            }

            el.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => this._onFieldChange(el, input));
                input.addEventListener('change', () => this._onFieldChange(el, input));
            });

            // Sparkline 초기화
            if (SNW.UI && typeof SNW.UI.sparkline === 'function') {
                this._sparkline = SNW.UI.sparkline(
                    el.querySelector('[data-slot="sparkline"]'),
                    { color: '#4a9eff', baseline: 0 });
                this._updateSparkline();
            }

            return el;
        }

        _presetOptions(current) {
            const presets = (SNW.Studio._windDict && SNW.Studio._windDict.presets) || [];
            return presets.map(p =>
                `<option value="${p.code}" ${p.code === current ? 'selected' : ''}>${SNW.DomUtil ? SNW.DomUtil.escape(p.name || p.code) : p.code}</option>`
            ).join('');
        }

        _styleOptions(current) {
            const styles = (SNW.Studio._windDict && SNW.Studio._windDict.styles) || [];
            return styles.map(s =>
                `<option value="${s.code}" ${s.code === current ? 'selected' : ''}>${SNW.DomUtil ? SNW.DomUtil.escape(s.name || s.code) : s.code}</option>`
            ).join('');
        }

        _onFieldChange(el, input) {
            const field = input.getAttribute('data-field');
            const val = (input.type === 'checkbox') ? input.checked : input.value;

            if (!this.step.override) {
                this.step.override = { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 };
            }

            switch (field) {
                case 'type':
                    this.step.type = val;
                    if (val === 'PRESET' && !this.step.presetCode) this.step.presetCode = 'OCEAN';
                    if (val === 'PRESET' && !this.step.styleCode) this.step.styleCode = 'BALANCE';
                    this._rerender();
                    return;
                case 'durationMin':
                    this.step.durationMin = Math.max(1, Math.min(1440, Number(val) || 1));
                    break;
                case 'presetCode':
                    this.step.presetCode = val;
                    break;
                case 'styleCode':
                    this.step.styleCode = val;
                    break;
                case 'fixedSpeed':
                    this.step.fixedSpeed = Number(val) || 0;
                    const lbl = el.querySelector('[data-slot="fixed-label"]');
                    if (lbl) lbl.textContent = this.step.fixedSpeed + '%';
                    break;
                case 'overrideEnabled':
                    this.step.override.enabled = !!val;
                    if (val) {
                        if (this.step.override.windIntensity < 0) this.step.override.windIntensity = 70;
                        if (this.step.override.windVariability < 0) this.step.override.windVariability = 50;
                        if (this.step.override.gustFrequency < 0) this.step.override.gustFrequency = 45;
                    }
                    break;
                case 'ovrIntensity':
                    this.step.override.windIntensity = Number(val);
                    const lInt = el.querySelector('[data-slot="ovr-int-label"]');
                    if (lInt) lInt.textContent = val + '%';
                    break;
                case 'ovrVariability':
                    this.step.override.windVariability = Number(val);
                    const lVar = el.querySelector('[data-slot="ovr-var-label"]');
                    if (lVar) lVar.textContent = val + '%';
                    break;
                case 'ovrGust':
                    this.step.override.gustFrequency = Number(val);
                    const lGust = el.querySelector('[data-slot="ovr-gust-label"]');
                    if (lGust) lGust.textContent = val + '%';
                    break;
            }

            this.onChange(this.index, this.step);
            this._scheduleSparklineUpdate();
        }

        _rerender() {
            const newEl = this.render();
            if (this.el && this.el.parentNode) {
                this.el.parentNode.replaceChild(newEl, this.el);
            }
            this.onChange(this.index, this.step);
        }

        _scheduleSparklineUpdate() {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this._updateSparkline(), 250);
        }

        async _updateSparkline() {
            if (!this._sparkline || !SNW.Preview) return;
            const wave = await SNW.Preview.generateStep(this.step);
            if (wave && wave.points) {
                this._sparkline.render(wave.points);
                const meta = this.el.querySelector('[data-slot="sparkline-meta"]');
                if (meta) {
                    meta.textContent = wave.avg > 0
                        ? `예상 평균 ${wave.avg} m/s · 강도 ${Math.round(wave.intensity)}%`
                        : '완전 휴지 (0 m/s)';
                }
            }
        }

        _resetOverrideToDefaults(el) {
            const presets = (SNW.Studio._windDict && SNW.Studio._windDict.presets) || [];
            const target = presets.find(p => p.code === this.step.presetCode) || {};
            const factors = target.factors || {};

            const defInt = (factors.windIntensity != null) ? factors.windIntensity : 70;
            const defVar = (factors.windVariability != null) ? factors.windVariability : 50;
            const defGust = (factors.gustFrequency != null) ? factors.gustFrequency : 45;

            if (!this.step.override) {
                this.step.override = { enabled: true };
            }
            this.step.override.windIntensity = defInt;
            this.step.override.windVariability = defVar;
            this.step.override.gustFrequency = defGust;

            const inputInt = el.querySelector('[data-field="ovrIntensity"]');
            const inputVar = el.querySelector('[data-field="ovrVariability"]');
            const inputGust = el.querySelector('[data-field="ovrGust"]');
            const lblInt = el.querySelector('[data-slot="ovr-int-label"]');
            const lblVar = el.querySelector('[data-slot="ovr-var-label"]');
            const lblGust = el.querySelector('[data-slot="ovr-gust-label"]');

            if (inputInt) inputInt.value = defInt;
            if (inputVar) inputVar.value = defVar;
            if (inputGust) inputGust.value = defGust;
            if (lblInt) lblInt.textContent = `${defInt}%`;
            if (lblVar) lblVar.textContent = `${defVar}%`;
            if (lblGust) lblGust.textContent = `${defGust}%`;

            this._scheduleSparklineUpdate();
            this.onChange(this.index, this.step);
            if (SNW.ToastUtil) SNW.ToastUtil.info('프리셋 기본값으로 복원되었습니다.');
        }

        getStep() { return this.step; }
    }

    // =========================================================
    // Studio 페이지
    // =========================================================
    SNW.Studio = class Studio {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this._active = true;
            this._steps = [];
            this._stepEditors = [];
            this._profileId = null;    // edit mode
            this._profileNo = 0;
            this._name = '';
            this._repeat = false;
            this._repeatCount = 0;
        }

        static _windDict = null;

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">Studio 로딩 중...</div>';

            // windDict 로드
            if (!SNW.Studio._windDict) {
                try {
                    const data = await SNW.Api.getWindDict();
                    SNW.Studio._windDict = data || { presets: [], styles: [] };
                    if (SNW.Preview) await SNW.Preview.init();
                } catch (e) {
                    this.el.innerHTML = '<div class="snw-error">WindDict 로드 실패</div>';
                    return;
                }
            }

            // URL query 또는 params에서 edit ID 확인
            const editId = (this.params && this.params.edit) ? parseInt(this.params.edit, 10) : null;

            if (editId) {
                await this._loadProfile(editId);
            } else {
                this._resetNewProfile();
            }

            this._render();
        }

        unmount() {
            this._active = false;
        }

        _resetNewProfile() {
            this._profileId = null;
            this._profileNo = Math.floor(Date.now() / 1000) % 65535;
            this._name = '새 프로필';
            this._repeat = false;
            this._repeatCount = 0;
            this._steps = [this._defaultStep()];
        }

        async _loadProfile(profileId) {
            try {
                const data = await SNW.Api.listProfiles();
                const root = (data && data.userProfiles) ? data.userProfiles : data;
                const profiles = (root && root.profiles) || [];
                const target = profiles.find(p => (p.profileId === profileId || p.profileNo === profileId));
                if (!target) {
                    if (SNW.ToastUtil) SNW.ToastUtil.warn('프로필을 찾을 수 없습니다.');
                    this._resetNewProfile();
                    return;
                }
                this._profileId = target.profileId || target.profileNo;
                this._profileNo = target.profileNo;
                this._name = target.name;
                this._repeat = !!target.repeatSegments;
                this._repeatCount = target.repeatCount || 0;
                this._steps = (target.steps && target.steps.length > 0) ? target.steps : [this._defaultStep()];
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('프로필 로드 실패');
                this._resetNewProfile();
            }
        }

        _defaultStep() {
            return {
                stepNo: 1, durationMin: 20, type: 'PRESET',
                presetCode: 'OCEAN', styleCode: 'BALANCE', fixedSpeed: 0,
                override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 },
            };
        }

        _render() {
            const isEdit = !!this._profileId;

            this.el.innerHTML = `
                <div class="snw-studio">
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:16px;">
                        <h2 style="font-size:18px;margin-bottom:12px;color:var(--snw-text,#e6edf3);">${isEdit ? '프로필 편집' : '새 프로필 작곡'}</h2>

                        <div class="snw-form">
                            <div class="snw-form-row" style="margin-bottom:12px;">
                                <label style="display:block;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-bottom:4px;">프로필 이름</label>
                                <input type="text" data-field="name" value="${SNW.DomUtil ? SNW.DomUtil.escape(this._name) : this._name}" maxlength="32" style="width:100%;padding:8px 10px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);">
                            </div>
                            <div class="snw-form-row snw-form-row--inline" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                                <label class="snw-step-checkbox" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                    <input type="checkbox" data-field="repeat" ${this._repeat ? 'checked' : ''}>
                                    <span>반복</span>
                                </label>
                                <input type="number" data-field="repeatCount" min="0" max="99" value="${this._repeatCount}" placeholder="0=무한" style="width:80px;padding:6px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);">
                                <span class="snw-form-hint" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">회 (0=무한)</span>
                            </div>
                        </div>

                        <h3 class="snw-form-section" style="font-size:14px;color:var(--snw-primary,#4a9eff);margin:16px 0 10px;">Step 시퀀스</h3>
                        <div data-slot="steps"></div>

                        <button type="button" class="snw-btn snw-btn--add-step" data-action="add-step" style="width:100%;padding:10px;margin-top:10px;background:var(--snw-surface-2,#232b36);border:1px dashed var(--snw-border,#2f3844);color:var(--snw-text,#e6edf3);border-radius:var(--snw-radius-sm,4px);cursor:pointer;">
                            + Step 추가 (최대 8개)
                        </button>
                    </div>

                    <div class="snw-studio__bar">
                        <button type="button" class="snw-btn" data-action="preview-all" style="padding:8px 16px;background:var(--snw-surface-2,#232b36);color:var(--snw-primary,#4a9eff);border:1px solid var(--snw-primary,#4a9eff);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">🎬 시나리오 체험</button>
                        <button type="button" class="snw-btn" data-action="cancel" style="padding:8px 16px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;">취소</button>
                        <button type="button" class="snw-btn snw-btn-primary" data-action="save" style="padding:8px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                            ${isEdit ? '업데이트' : '저장'}
                        </button>
                    </div>
                </div>`;

            // 폼 바인딩
            this.el.querySelector('[data-field="name"]').addEventListener('input', e => {
                this._name = e.target.value;
            });
            this.el.querySelector('[data-field="repeat"]').addEventListener('change', e => {
                this._repeat = e.target.checked;
            });
            this.el.querySelector('[data-field="repeatCount"]').addEventListener('input', e => {
                this._repeatCount = Math.max(0, parseInt(e.target.value, 10) || 0);
            });

            // 액션 바인딩
            this.el.querySelector('[data-action="add-step"]').onclick = () => this._onAddStep();
            this.el.querySelector('[data-action="cancel"]').onclick = () => this._onCancel();
            this.el.querySelector('[data-action="save"]').onclick = () => this._onSave();
            const btnPreviewAll = this.el.querySelector('[data-action="preview-all"]');
            if (btnPreviewAll) {
                btnPreviewAll.onclick = async () => {
                    const firstPreset = this._steps.find(s => s.type === 'PRESET');
                    if (!firstPreset) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('PRESET Step이 없어 시뮬레이션을 생성할 수 없습니다');
                        return;
                    }
                    if (SNW.UI && typeof SNW.UI.simulationModal === 'function') {
                        await SNW.UI.simulationModal({
                            mode: 'single',
                            a: {
                                presetCode: firstPreset.presetCode || 'OCEAN',
                                styleCode: firstPreset.styleCode || 'BALANCE',
                                override: firstPreset.override,
                            },
                        });
                    }
                };
            }

            this._renderSteps();
        }

        _renderSteps() {
            const slot = this.el.querySelector('[data-slot="steps"]');
            if (!slot) return;
            slot.innerHTML = '';

            this._stepEditors = [];

            this._steps.forEach((step, idx) => {
                const editor = new StepEditor(
                    step, idx,
                    (i, s) => { this._steps[i] = s; },
                    (i) => this._onDeleteStep(i),
                    (i) => this._onMoveStep(i, -1),
                    (i) => this._onMoveStep(i, 1),
                );
                const stepEl = editor.render();
                slot.appendChild(stepEl);
                this._stepEditors.push(editor);
            });
        }

        _onAddStep() {
            if (this._steps.length >= 8) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn('Step은 최대 8개까지 추가 가능합니다.');
                return;
            }
            this._steps.push(this._defaultStep());
            this._renderSteps();
        }

        _onDeleteStep(idx) {
            if (this._steps.length <= 1) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn('최소 1개의 Step이 필요합니다.');
                return;
            }
            this._steps.splice(idx, 1);
            this._steps.forEach((s, i) => { s.stepNo = i + 1; });
            this._renderSteps();
        }

        _onMoveStep(idx, dir) {
            const target = idx + dir;
            if (target < 0 || target >= this._steps.length) return;
            const tmp = this._steps[idx];
            this._steps[idx] = this._steps[target];
            this._steps[target] = tmp;
            this._steps.forEach((s, i) => { s.stepNo = i + 1; });
            this._renderSteps();
        }

        async _onSave() {
            if (!this._name.trim()) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('프로필 이름을 입력하세요.');
                return;
            }
            if (this._steps.length === 0) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('최소 1개의 Step이 필요합니다.');
                return;
            }
            for (const s of this._steps) {
                if (s.durationMin < 1 || s.durationMin > 1440) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error('Step 지속 시간은 1~1440분이어야 합니다.');
                    return;
                }
            }

            const profile = {
                profileNo: this._profileNo,
                name: this._name.trim(),
                enabled: true,
                repeatSegments: this._repeat,
                repeatCount: this._repeatCount,
                stepCount: this._steps.length,
                steps: this._steps,
                autoOff: {
                    timer: { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 },
                },
                motion: { pir: { enabled: true, holdSec: 120 } },
            };

            try {
                if (this._profileId) {
                    await SNW.Api.updateProfile(this._profileId, profile);
                } else {
                    await SNW.Api.addProfile(profile);
                }
                if (SNW.ToastUtil) SNW.ToastUtil.success(this._profileId ? '업데이트 완료' : '저장 완료');
                const targetProfId = this._profileId;
                setTimeout(() => {
                    if (targetProfId && confirm('지금 이 프로필을 재생해 보시겠어요?')) {
                        if (SNW.Api && typeof SNW.Api.startPlaylist === 'function') {
                            SNW.Api.startPlaylist(targetProfId);
                        }
                    }
                }, 400);
                SNW.Router.navigate('/automation/playlist');
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
            }
        }

        _onCancel() {
            if (confirm('편집 내용을 버리시겠습니까?')) {
                SNW.Router.navigate('/automation/playlist');
            }
        }
    };
})(window.SNW);



/* ---- 292.playlist.js (9849 bytes) ---- */
// =========================================================
// 292.playlist.js — Wind Playlist (재생 목록)
// Layer 3 (Playlist 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.Playlist = class Playlist {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._schedules = [];
        }

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">로딩 중...</div>';

            if (SNW.Preview) await SNW.Preview.init();

            try {
                const [profData, schData] = await Promise.all([
                    SNW.Api.listProfiles(),
                    SNW.Api.listSchedules ? SNW.Api.listSchedules().catch(() => null) : null,
                ]);
                const pRoot = (profData && profData.userProfiles) ? profData.userProfiles : profData;
                this._profiles = (pRoot && pRoot.profiles) || [];

                const sRoot = (schData && schData.schedules) ? schData.schedules : schData;
                this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('데이터 로드 실패');
            }

            await this._render();
        }

        unmount() { this._active = false; }

        async _render() {
            if (this._profiles.length === 0) {
                this.el.innerHTML = `
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:32px;text-align:center;">
                        <div class="snw-empty">
                            <p style="color:var(--snw-text-dim,#8b949e);margin-bottom:16px;">아직 작곡한 프로필이 없습니다.</p>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="new" style="padding:10px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                🎨 Studio에서 작곡하기
                            </button>
                        </div>
                    </div>`;
                this.el.querySelector('[data-action="new"]').onclick = () => {
                    SNW.Router.navigate('/automation/studio');
                };
                return;
            }

            this.el.innerHTML = `
                <div class="snw-playlist">
                    <div class="snw-playlist__header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                        <span style="font-size:14px;color:var(--snw-text-dim,#8b949e);">${this._profiles.length}개의 프로필</span>
                        <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="new" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:13px;font-weight:600;">
                            + 새로 작곡
                        </button>
                    </div>
                    <div class="snw-playlist__list" data-slot="list" style="display:flex;flex-direction:column;gap:12px;"></div>
                </div>`;

            this.el.querySelector('[data-action="new"]').onclick = () => {
                SNW.Router.navigate('/automation/studio');
            };

            const listSlot = this.el.querySelector('[data-slot="list"]');
            for (let i = 0; i < this._profiles.length; i++) {
                const card = await this._renderCard(this._profiles[i]);
                listSlot.appendChild(card);
            }
        }

        async _renderCard(profile) {
            const pId = profile.profileId || profile.profileNo;
            const refCount = this._schedules.filter(s => s.profileId === pId).length;

            const card = document.createElement('div');
            card.className = 'snw-playlist-item';
            card.style.cssText = 'background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:14px;display:flex;flex-direction:column;gap:10px;';
            card.innerHTML = `
                <div class="snw-playlist-item__main" style="display:flex;flex-direction:column;gap:6px;">
                    <div class="snw-playlist-item__head" style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="snw-playlist-item__name" style="font-weight:600;font-size:15px;color:var(--snw-text,#e6edf3);">📋 ${SNW.DomUtil ? SNW.DomUtil.escape(profile.name) : profile.name}</span>
                        <span class="snw-playlist-item__meta" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">${profile.stepCount || (profile.steps ? profile.steps.length : 0)} Step · ${this._fmtTotal(profile)}</span>
                    </div>
                    <div class="snw-playlist-item__sparkline" data-slot="spark" style="height:44px;margin:4px 0;"></div>
                    <div class="snw-playlist-item__refs" style="font-size:11px;color:var(--snw-text-faint,#6e7a87);">
                        ${refCount > 0
                    ? `<span style="color:var(--snw-warn,#d29922);">⏰ 스케줄 ${refCount}개에서 사용 중</span>`
                    : `<span class="snw-playlist-item__noref">스케줄 미참조</span>`}
                    </div>
                </div>
                <div class="snw-playlist-item__actions" style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
                    <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="play" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;font-weight:600;">▶ 재생</button>
                    <button type="button" class="snw-btn snw-btn--sm" data-action="edit" style="padding:6px 12px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">✏️ 편집</button>
                    <button type="button" class="snw-btn snw-btn--sm snw-btn--danger" data-action="delete" style="padding:6px 12px;background:rgba(248,81,73,0.15);color:var(--snw-error,#f85149);border:1px solid rgba(248,81,73,0.3);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">🗑</button>
                </div>
            `;

            // Sparkline 렌더링
            if (SNW.Preview && SNW.UI && typeof SNW.UI.sparkline === 'function') {
                (async () => {
                    const wave = await SNW.Preview.generatePlaylistWaveform(profile.steps || []);
                    if (wave && wave.points) {
                        const sl = SNW.UI.sparkline(
                            card.querySelector('[data-slot="spark"]'),
                            { color: '#4a9eff', baseline: 0 });
                        sl.render(wave.points);
                    }
                })();
            }

            // 액션 바인딩
            card.querySelector('[data-action="play"]').onclick = async () => {
                try {
                    await SNW.Api.startPlaylist(pId);
                    if (SNW.ToastUtil) SNW.ToastUtil.success(`▶ ${profile.name} 재생 시작`);
                    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '재생 실패');
                }
            };

            card.querySelector('[data-action="edit"]').onclick = () => {
                SNW.Router.navigate(`/automation/studio?edit=${pId}`);
            };

            card.querySelector('[data-action="delete"]').onclick = async () => {
                if (refCount > 0) {
                    if (!confirm(`이 프로필은 스케줄 ${refCount}개에서 참조 중입니다.\n삭제하면 해당 스케줄이 비활성화됩니다. 계속하시겠습니까?`)) {
                        return;
                    }
                } else {
                    if (!confirm('정말 삭제하시겠습니까?')) return;
                }
                try {
                    await SNW.Api.deleteProfile(pId);
                    if (SNW.ToastUtil) SNW.ToastUtil.success('삭제 완료');
                    await this.mount();
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '삭제 실패');
                }
            };

            return card;
        }


        _fmtTotal(profile) {
            // [ADR-2] steps[] canonical + legacy segments[] fallback
            const steps = (profile.steps && profile.steps.length > 0) ?
                profile.steps :
                (profile.segments || []);
            if (!steps.length) return '0분';

            let total = 0;
            for (const s of steps) {
                const dur = (s.durationMin != null) ?
                    Number(s.durationMin) :
                    (Number(s.onMinutes || 0) + Number(s.offMinutes || 0));
                total += dur || 0;
            }

            if (profile.repeatSegments && profile.repeatCount > 0) {
                total *= profile.repeatCount;
            }
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };
})(window.SNW);



/* ---- 293.schedule_panel.js (16496 bytes) ---- */
// =========================================================
// 293.schedule_panel.js — Schedule 편집 (Profile 참조만)
// Layer 3 (Schedule 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.SchedulePanel = class SchedulePanel {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._schedules = [];
            this._profiles = [];
        }

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">로딩 중...</div>';
            await this._load();
            this._render();
        }

        unmount() { this._active = false; }

        async _load() {
            try {
                const [schData, profData] = await Promise.all([
                    SNW.Api.listSchedules ? SNW.Api.listSchedules() : null,
                    SNW.Api.listProfiles ? SNW.Api.listProfiles() : null,
                ]);

                if (schData) {
                    const sRoot = schData.schedules ? schData.schedules : schData;
                    this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
                } else {
                    this._schedules = [];
                }

                if (profData) {
                    const pRoot = profData.userProfiles ? profData.userProfiles : profData;
                    this._profiles = (pRoot && pRoot.profiles) ? pRoot.profiles : (Array.isArray(pRoot) ? pRoot : []);
                } else {
                    this._profiles = [];
                }
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('스케줄 로드 실패');
            }
        }

        _render() {
            // 참조 가능한 프로필이 없으면 안내
            if (this._profiles.length === 0) {
                this.el.innerHTML = `
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:32px;text-align:center;">
                        <div class="snw-empty">
                            <p style="color:var(--snw-text-dim,#8b949e);margin-bottom:16px;">먼저 프로필을 작곡해야 스케줄을 만들 수 있습니다.</p>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="to-studio" style="padding:10px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                🎨 Studio에서 작곡하기
                            </button>
                        </div>
                    </div>`;
                const btn = this.el.querySelector('[data-action="to-studio"]');
                if (btn) {
                    btn.onclick = () => {
                        SNW.Router.navigate('/automation/studio');
                    };
                }
                return;
            }

            this.el.innerHTML = `
                <div class="snw-schedule">
                    <div class="snw-schedule__header">
                        <span>${this._schedules.length}개 스케줄</span>
                        <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="add" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                            + 새 스케줄
                        </button>
                    </div>

                    <div class="snw-schedule__list" data-slot="list"></div>

                    <div class="snw-schedule__note">
                        💡 스케줄은 <b>플레이리스트를 자동 재생</b>합니다.
                        Step 편집은 Studio 탭에서 하세요.
                    </div>
                </div>`;

            const addBtn = this.el.querySelector('[data-action="add"]');
            if (addBtn) addBtn.onclick = () => this._openEditor(null);

            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;

            if (this._schedules.length === 0) {
                listSlot.innerHTML = '<div class="snw-empty" style="text-align:center;padding:32px;color:var(--snw-text-dim,#8b949e);">아직 스케줄이 없습니다</div>';
                return;
            }

            this._schedules.forEach(sch => {
                listSlot.appendChild(this._renderScheduleCard(sch));
            });
        }

        _renderScheduleCard(sch) {
            const card = document.createElement('div');
            card.className = 'snw-schedule-item' + (sch.enabled ? '' : ' is-disabled');

            const profile = this._profiles.find(p => p.profileId === sch.profileId);
            const profileName = profile ? profile.name : '(삭제된 프로필)';
            const profileMissing = !profile;

            const days = (sch.period && sch.period.days) || [0,0,0,0,0,0,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
            const daysStr = days.map((d, i) => d ? dayNames[i] : '·').join(' ');

            const startTime = (sch.period && sch.period.startTime) || '00:00';
            const endTime   = (sch.period && sch.period.endTime)   || '23:59';

            card.innerHTML = `
                <div class="snw-schedule-item__head">
                    <label class="snw-switch">
                        <input type="checkbox" data-action="toggle" ${sch.enabled ? 'checked' : ''}>
                        <span class="snw-switch__slider"></span>
                    </label>
                    <span class="snw-schedule-item__name">${SNW.DomUtil ? SNW.DomUtil.escape(sch.name) : sch.name}</span>
                    <button type="button" class="snw-icon-btn" data-action="edit" title="편집">✏️</button>
                    <button type="button" class="snw-icon-btn snw-icon-btn--danger" data-action="delete" title="삭제">🗑</button>
                </div>
                <div class="snw-schedule-item__time">
                    ⏰ ${startTime} ~ ${endTime}
                </div>
                <div class="snw-schedule-item__days">${daysStr}</div>
                <div class="snw-schedule-item__ref ${profileMissing ? 'is-missing' : ''}">
                    🎵 ${SNW.DomUtil ? SNW.DomUtil.escape(profileName) : profileName}
                </div>`;

            // 액션 바인딩
            const toggleInput = card.querySelector('[data-action="toggle"]');
            if (toggleInput) {
                toggleInput.addEventListener('change', async (e) => {
                    await this._onToggle(sch, e.target.checked);
                });
            }

            const editBtn = card.querySelector('[data-action="edit"]');
            if (editBtn) editBtn.onclick = () => this._openEditor(sch);

            const delBtn = card.querySelector('[data-action="delete"]');
            if (delBtn) delBtn.onclick = () => this._onDelete(sch);

            return card;
        }

        _openEditor(sch) {
            const isEdit = !!sch;
            const days = sch ? ((sch.period && sch.period.days) || [0,0,0,0,0,0,0]) : [0,1,1,1,1,1,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

            const content = document.createElement('div');
            content.className = 'snw-schedule-editor';
            content.innerHTML = `
                <div class="snw-form">
                    <div class="snw-form-row" style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">스케줄 이름</label>
                        <input type="text" data-field="name" maxlength="32" class="snw-input"
                               style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit ? (SNW.DomUtil ? SNW.DomUtil.escape(sch.name) : sch.name) : '새 스케줄'}">
                    </div>

                    <div class="snw-form-row" style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;">요일</label>
                        <div class="snw-day-picker">
                            ${dayNames.map((d, i) =>
                                `<label class="snw-day-chip ${days[i] ? 'is-active' : ''}">
                                    <input type="checkbox" data-day="${i}" ${days[i] ? 'checked' : ''}>
                                    <span>${d}</span>
                                </label>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="snw-form-row snw-form-row--inline" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                        <label style="font-weight:600;font-size:13px;">시작</label>
                        <input type="time" data-field="startTime" class="snw-input"
                               style="padding:6px 10px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit && sch.period ? sch.period.startTime : '08:00'}">
                        <label style="font-weight:600;font-size:13px;">종료</label>
                        <input type="time" data-field="endTime" class="snw-input"
                               style="padding:6px 10px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit && sch.period ? sch.period.endTime : '20:00'}">
                    </div>

                    <h3 class="snw-form-section" style="font-size:14px;margin:16px 0 8px 0;font-weight:600;">🎵 실행할 플레이리스트</h3>
                    <div class="snw-profile-picker">
                        ${this._profiles.map(p => `
                            <label class="snw-profile-radio ${isEdit && sch.profileId === p.profileId ? 'is-selected' : ''}">
                                <input type="radio" name="profile" value="${p.profileId}"
                                       ${isEdit && sch.profileId === p.profileId ? 'checked' : ''}>
                                <div class="snw-profile-radio__content">
                                    <div class="snw-profile-radio__name">📋 ${SNW.DomUtil ? SNW.DomUtil.escape(p.name) : p.name}</div>
                                    <div class="snw-profile-radio__meta">
                                        ${p.stepCount || (p.steps ? p.steps.length : 0)}개 Step · ${this._fmtTotal(p)}
                                    </div>
                                </div>
                            </label>
                        `).join('')}
                    </div>

                    <div class="snw-schedule-editor__hint" style="margin-top:12px;">
                        💡 새 프로필은 <b>Studio 탭</b>에서 작곡 후 선택할 수 있습니다.
                    </div>
                </div>`;

            // 요일 칩 토글
            content.querySelectorAll('.snw-day-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const input = chip.querySelector('input');
                    input.checked = !input.checked;
                    chip.classList.toggle('is-active', input.checked);
                });
            });

            // 프로필 라디오 선택 표시
            content.querySelectorAll('.snw-profile-radio').forEach(radio => {
                radio.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const input = radio.querySelector('input');
                    input.checked = true;
                    content.querySelectorAll('.snw-profile-radio').forEach(r =>
                        r.classList.toggle('is-selected', r === radio));
                });
            });

            SNW.UI.modal(
                isEdit ? '스케줄 편집' : '새 스케줄',
                content,
                async () => {
                    const nameEl  = content.querySelector('[data-field="name"]');
                    const startEl = content.querySelector('[data-field="startTime"]');
                    const endEl   = content.querySelector('[data-field="endTime"]');
                    const selectedRadio = content.querySelector('input[name="profile"]:checked');

                    // 검증
                    if (!nameEl.value.trim()) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('이름을 입력하세요');
                        return false;
                    }
                    if (!selectedRadio) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('실행할 플레이리스트를 선택하세요');
                        return false;
                    }
                    if (startEl.value >= endEl.value) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('종료 시각이 시작 시각보다 빨라야 합니다');
                        return false;
                    }

                    const profileId = Number(selectedRadio.value);
                    const schNo = isEdit
                        ? sch.schNo
                        : (Date.now() % 65535) + 1;

                    const schedule = {
                        schNo,
                        name: nameEl.value.trim(),
                        enabled: isEdit ? sch.enabled : true,
                        period: {
                            days: Array.from(content.querySelectorAll('[data-day]')).map(cb => cb.checked ? 1 : 0),
                            startTime: startEl.value,
                            endTime: endEl.value,
                        },
                        profileId,
                    };

                    try {
                        if (isEdit) {
                            await SNW.Api.updateSchedule(sch.schId, schedule);
                        } else {
                            await SNW.Api.addSchedule(schedule);
                        }
                        if (SNW.ToastUtil) SNW.ToastUtil.success(isEdit ? '스케줄 업데이트' : '스케줄 생성');
                        await this.mount();
                        return true;
                    } catch (e) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
                        return false;
                    }
                },
                null,
                { width: '480px' }
            );
        }

        async _onToggle(sch, enabled) {
            const newSch = { ...sch, enabled };
            try {
                await SNW.Api.updateSchedule(sch.schId, newSch);
                sch.enabled = enabled;
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '토글 실패');
                await this.mount();
            }
        }

        async _onDelete(sch) {
            if (!confirm(`"${sch.name}" 스케줄을 삭제하시겠습니까?`)) return;
            try {
                await SNW.Api.deleteSchedule(sch.schId);
                if (SNW.ToastUtil) SNW.ToastUtil.success('삭제 완료');
                await this.mount();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '삭제 실패');
            }
        }

        _fmtTotal(profile) {
            if (!profile.steps) return '0분';
            let total = 0;
            for (const s of profile.steps) total += Number(s.durationMin) || 0;
            if (profile.repeat && profile.repeatCount > 0) total *= profile.repeatCount;
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };
})(window.SNW);



/* ---- 294.timer_panel.js (20373 bytes) ---- */
// =========================================================
// 294.timer_panel.js — 자동화 세션 자동 종료 타이머 (TimerPanel)
// Layer 3 (페이지 컴포넌트) & 전역 TimerManager
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    const LS_TIMER_KEY = 'snw_session_timer';

    // =========================================================
    // 1. SNW.TimerManager — 브라우저 전역 세션 타이머 엔진
    // =========================================================
    const TimerManager = {
        _active: false,
        _targetEndMs: 0,
        _durationMin: 0,
        _intervalId: null,
        _listeners: new Set(),
        _storeUnsub: null,

        init() {
            if (this._initialized) return;
            this._initialized = true;

            // 로컬 스토리지에서 이전 타이머 복원 시도
            try {
                const saved = localStorage.getItem(LS_TIMER_KEY);
                if (saved) {
                    const data = JSON.parse(saved);
                    const now = Date.now();
                    if (data && data.targetEndMs > now) {
                        this._active = true;
                        this._targetEndMs = data.targetEndMs;
                        this._durationMin = data.durationMin || Math.round((data.targetEndMs - now) / 60000);
                        this._startInterval();
                    } else {
                        localStorage.removeItem(LS_TIMER_KEY);
                    }
                }
            } catch (e) {
                // Ignore LS error
            }

            // 세션 종료 감지 시 타이머 자동 해제
            if (SNW.Store && typeof SNW.Store.watch === 'function') {
                this._storeUnsub = SNW.Store.watch('control', (ctl) => {
                    if (!this._active) return;
                    const sess = ctl && ctl.session;
                    if (sess && (sess.state === 'COMPLETED' || sess.state === 'NONE' || !sess.active)) {
                        this.cancel(false); // 세션이 이미 끝났으므로 조용히 해제
                    }
                });
            }
        },

        subscribe(listener) {
            this._listeners.add(listener);
            return () => this._listeners.delete(listener);
        },

        _notify() {
            const status = this.getStatus();
            this._listeners.forEach(fn => {
                try { fn(status); } catch (e) { /* ignore */ }
            });
            // 전역 이벤트 디스패치 (Now Playing Bar 등 연동용)
            document.dispatchEvent(new CustomEvent('snw:timerchange', { detail: status }));
        },

        _startInterval() {
            if (this._intervalId) clearInterval(this._intervalId);
            this._intervalId = setInterval(() => {
                const now = Date.now();
                if (now >= this._targetEndMs) {
                    this._onExpire();
                } else {
                    this._notify();
                }
            }, 1000);
        },

        async _onExpire() {
            this.cancel(false);
            try {
                if (SNW.Api && SNW.Api.Session && typeof SNW.Api.Session.stop === 'function') {
                    await SNW.Api.Session.stop();
                }
            } catch (err) {
                console.error('[TimerManager] Session stop error on expire:', err);
            }
            if (SNW.ToastUtil && typeof SNW.ToastUtil.info === 'function') {
                SNW.ToastUtil.info(SNW.I18n.t('timer.expired'));
            }
        },

        start(minutes) {
            const min = Number(minutes);
            if (!min || min <= 0) {
                this.cancel(true);
                return;
            }

            this.init();
            this._active = true;
            this._durationMin = min;
            this._targetEndMs = Date.now() + (min * 60 * 1000);

            try {
                localStorage.setItem(LS_TIMER_KEY, JSON.stringify({
                    targetEndMs: this._targetEndMs,
                    durationMin: this._durationMin
                }));
            } catch (e) {}

            this._startInterval();
            this._notify();

            if (SNW.ToastUtil && typeof SNW.ToastUtil.success === 'function') {
                SNW.ToastUtil.success(SNW.I18n.t('timer.setSuccess', { m: min }));
            }
        },

        cancel(showToast = true) {
            const wasActive = this._active;
            this._active = false;
            this._targetEndMs = 0;
            this._durationMin = 0;

            if (this._intervalId) {
                clearInterval(this._intervalId);
                this._intervalId = null;
            }

            try {
                localStorage.removeItem(LS_TIMER_KEY);
            } catch (e) {}

            this._notify();

            if (wasActive && showToast && SNW.ToastUtil && typeof SNW.ToastUtil.info === 'function') {
                SNW.ToastUtil.info(SNW.I18n.t('timer.canceled'));
            }
        },

        getStatus() {
            const now = Date.now();
            const remainSec = this._active ? Math.max(0, Math.ceil((this._targetEndMs - now) / 1000)) : 0;
            return {
                active: this._active && remainSec > 0,
                durationMin: this._durationMin,
                targetEndMs: this._targetEndMs,
                remainSec: remainSec,
                remainMin: Math.ceil(remainSec / 60)
            };
        }
    };

    // 전역 노출 및 초기화
    SNW.TimerManager = TimerManager;
    TimerManager.init();

    // =========================================================
    // 2. SNW.TimerPanel 컴포넌트
    // =========================================================
    SNW.TimerPanel = class TimerPanel {
        constructor(container, params = {}) {
            this.container = container;
            this.params = params;
            this.el = null;
            this._unsubTimer = null;
            this._unsubStore = null;
            this._customMinutes = 45;
        }

        async mount() {
            if (!this.container) return;

            this.el = document.createElement('div');
            this.el.className = 'snw-timer-panel';
            this.container.appendChild(this.el);

            this._render();
            this._bindEvents();

            // TimerManager 구독
            this._unsubTimer = TimerManager.subscribe(() => {
                this._updateCountdown();
            });

            // Store 구독 (세션 상태 실시간 갱신)
            if (SNW.Store && typeof SNW.Store.watch === 'function') {
                this._unsubStore = SNW.Store.watch('control', () => {
                    this._updateSessionCard();
                });
            }
        }

        unmount() {
            if (this._unsubTimer) {
                this._unsubTimer();
                this._unsubTimer = null;
            }
            if (this._unsubStore) {
                this._unsubStore();
                this._unsubStore = null;
            }
            if (this.el) {
                this.el.remove();
                this.el = null;
            }
        }

        _formatTime(sec) {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            const pad = (n) => String(n).padStart(2, '0');
            if (h > 0) {
                return `${pad(h)}:${pad(m)}:${pad(s)}`;
            }
            return `${pad(m)}:${pad(s)}`;
        }

        _formatEndTime(timestamp) {
            if (!timestamp) return '';
            const d = new Date(timestamp);
            const pad = (n) => String(n).padStart(2, '0');
            return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }

        _render() {
            const t = (k, p) => (SNW.I18n ? SNW.I18n.t(k, p) : k);
            const status = TimerManager.getStatus();

            this.el.innerHTML = `
                <div class="snw-card snw-timer-card" style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <div>
                            <h3 style="margin:0;font-size:1.15rem;display:flex;align-items:center;gap:8px;">
                                ${t('timer.title')}
                            </h3>
                            <div style="font-size:0.85rem;color:var(--snw-text-dim,#8b949e);margin-top:4px;">
                                ${t('timer.subtitle')}
                            </div>
                        </div>
                    </div>

                    <!-- 1. 현재 세션 상태 -->
                    <div class="snw-timer-session-slot" style="margin-bottom:16px;"></div>

                    <!-- 2. 진행 중 카운트다운 (활성화 시 노출) -->
                    <div class="snw-timer-countdown-slot" style="margin-bottom:16px;"></div>

                    <!-- 3. 프리셋 버튼 그룹 (15분, 30분, 1시간, 2시간, 끔) -->
                    <div style="margin-bottom:16px;">
                        <div style="font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--snw-text-dim,#8b949e);">
                            ⚡ 빠른 시간 선택
                        </div>
                        <div class="snw-timer-preset-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(80px,1fr));gap:8px;">
                            <button type="button" class="snw-btn snw-btn--secondary snw-timer-preset-btn ${status.active && status.durationMin === 15 ? 'is-active' : ''}" data-min="15">
                                ${t('timer.min15')}
                            </button>
                            <button type="button" class="snw-btn snw-btn--secondary snw-timer-preset-btn ${status.active && status.durationMin === 30 ? 'is-active' : ''}" data-min="30">
                                ${t('timer.min30')}
                            </button>
                            <button type="button" class="snw-btn snw-btn--secondary snw-timer-preset-btn ${status.active && status.durationMin === 60 ? 'is-active' : ''}" data-min="60">
                                ${t('timer.hour1')}
                            </button>
                            <button type="button" class="snw-btn snw-btn--secondary snw-timer-preset-btn ${status.active && status.durationMin === 120 ? 'is-active' : ''}" data-min="120">
                                ${t('timer.hour2')}
                            </button>
                            <button type="button" class="snw-btn snw-btn--secondary snw-timer-preset-btn ${!status.active ? 'is-active' : ''}" data-min="0" style="color:var(--snw-text-dim,#8b949e);">
                                ${t('timer.off')}
                            </button>
                        </div>
                    </div>

                    <!-- 4. 직접 설정 슬라이더 -->
                    <div style="padding-top:12px;border-top:1px solid var(--snw-border,#2f3844);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <span style="font-size:0.85rem;font-weight:600;color:var(--snw-text-dim,#8b949e);">
                                🎛️ ${t('timer.custom')}
                            </span>
                            <span class="snw-timer-custom-label" style="font-size:0.95rem;font-weight:700;color:var(--snw-primary,#4ea8de);">
                                ${this._customMinutes}분
                            </span>
                        </div>
                        <div style="display:flex;gap:12px;align-items:center;">
                            <input type="range" class="snw-slider snw-timer-slider" min="5" max="180" step="5" value="${this._customMinutes}" style="flex:1;">
                            <button type="button" class="snw-btn snw-btn--primary snw-timer-start-btn" style="white-space:nowrap;padding:8px 16px;">
                                ${t('timer.set')}
                            </button>
                        </div>
                    </div>
                </div>`;

            this._updateSessionCard();
            this._updateCountdown();
        }

        _updateSessionCard() {
            const slot = this.el ? this.el.querySelector('.snw-timer-session-slot') : null;
            if (!slot) return;

            const t = (k, p) => (SNW.I18n ? SNW.I18n.t(k, p) : k);
            const ctl = SNW.Store ? SNW.Store.get('control') : null;
            const sess = ctl && ctl.session;
            const isActive = sess && (sess.state === 'ACTIVE' || sess.state === 'PAUSED');

            if (isActive) {
                const name = (sess.profileName && sess.profileName.trim()) 
                    ? sess.profileName 
                    : (sess.typeName || '세션');
                const escape = (s) => (SNW.DomUtil ? SNW.DomUtil.escape(s) : s);
                slot.innerHTML = `
                    <div style="background:var(--snw-surface,#1b2028);border:1px solid var(--snw-border,#2f3844);border-radius:8px;padding:12px;display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#3fb950;box-shadow:0 0 6px #3fb950;"></span>
                            <div>
                                <div style="font-weight:600;font-size:0.95rem;color:var(--snw-text-bright,#fff);">
                                    ${escape(name)}
                                </div>
                                <div style="font-size:0.8rem;color:var(--snw-text-dim,#8b949e);">
                                    ${escape(sess.typeName || 'PLAYLIST')} · ${t('timer.sessionActive')}
                                </div>
                            </div>
                        </div>
                        <span class="snw-badge snw-badge--success" style="font-size:0.75rem;">
                            ${sess.state}
                        </span>
                    </div>`;
            } else {
                slot.innerHTML = `
                    <div style="background:var(--snw-surface,#1b2028);border:1px dashed var(--snw-border,#2f3844);border-radius:8px;padding:14px;text-align:center;">
                        <div style="font-size:0.9rem;color:var(--snw-text-dim,#8b949e);margin-bottom:8px;">
                            ⚠️ ${t('timer.noSession')}
                        </div>
                        <div style="display:flex;justify-content:center;gap:8px;">
                            <button type="button" class="snw-btn snw-btn--sm snw-btn--secondary" onclick="SNW.Router.navigate('/automation/playlist')">
                                ${t('timer.gotoPlaylist')}
                            </button>
                            <button type="button" class="snw-btn snw-btn--sm snw-btn--secondary" onclick="SNW.Router.navigate('/dashboard')">
                                ${t('timer.gotoHome')}
                            </button>
                        </div>
                    </div>`;
            }
        }

        _updateCountdown() {
            const slot = this.el ? this.el.querySelector('.snw-timer-countdown-slot') : null;
            if (!slot) return;

            const t = (k, p) => (SNW.I18n ? SNW.I18n.t(k, p) : k);
            const status = TimerManager.getStatus();

            // 프리셋 버튼 활성 상태 갱신
            if (this.el) {
                this.el.querySelectorAll('.snw-timer-preset-btn').forEach(btn => {
                    const min = Number(btn.getAttribute('data-min'));
                    if (min === 0) {
                        btn.classList.toggle('is-active', !status.active);
                    } else {
                        btn.classList.toggle('is-active', status.active && status.durationMin === min);
                    }
                });
            }

            if (!status.active) {
                slot.innerHTML = '';
                return;
            }

            const totalSec = status.durationMin * 60;
            const elapsedSec = totalSec - status.remainSec;
            const pct = Math.min(100, Math.max(0, Math.round((elapsedSec / totalSec) * 100)));
            const timeStr = this._formatTime(status.remainSec);
            const endStr = this._formatEndTime(status.targetEndMs);

            slot.innerHTML = `
                <div style="background:linear-gradient(135deg, rgba(78,168,222,0.15) 0%, rgba(27,32,40,0.8) 100%);border:1px solid var(--snw-primary,#4ea8de);border-radius:8px;padding:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div>
                            <div style="font-size:0.8rem;color:var(--snw-primary,#4ea8de);font-weight:600;display:flex;align-items:center;gap:6px;">
                                <span>⏱️</span> ${t('timer.remaining')}
                            </div>
                            <div style="font-size:1.8rem;font-weight:700;font-variant-numeric:tabular-nums;color:var(--snw-text-bright,#fff);margin:4px 0;">
                                ${timeStr}
                            </div>
                            <div style="font-size:0.8rem;color:var(--snw-text-dim,#8b949e);">
                                ${t('timer.endsAt')}: <b>${endStr}</b> (${status.durationMin}분 설정)
                            </div>
                        </div>
                        <button type="button" class="snw-btn snw-btn--sm snw-btn--danger snw-timer-cancel-btn" style="margin-top:4px;">
                            ${t('timer.cancel')}
                        </button>
                    </div>

                    <!-- 프로그레스 바 -->
                    <div style="background:var(--snw-surface,#1b2028);border-radius:4px;height:6px;overflow:hidden;margin-top:10px;">
                        <div style="background:var(--snw-primary,#4ea8de);height:100%;width:${pct}%;transition:width 0.3s ease;"></div>
                    </div>
                </div>`;

            // 취소 버튼 이벤트
            const cancelBtn = slot.querySelector('.snw-timer-cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    if (SNW.Haptic && typeof SNW.Haptic.tap === 'function') SNW.Haptic.tap();
                    TimerManager.cancel(true);
                });
            }
        }

        _bindEvents() {
            if (!this.el) return;

            // 프리셋 버튼
            this.el.querySelectorAll('.snw-timer-preset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const min = Number(btn.getAttribute('data-min'));
                    if (SNW.Haptic && typeof SNW.Haptic.tap === 'function') SNW.Haptic.tap();
                    if (min === 0) {
                        TimerManager.cancel(true);
                    } else {
                        TimerManager.start(min);
                    }
                });
            });

            // 슬라이더 변경
            const slider = this.el.querySelector('.snw-timer-slider');
            const label = this.el.querySelector('.snw-timer-custom-label');
            if (slider && label) {
                slider.addEventListener('input', () => {
                    this._customMinutes = Number(slider.value);
                    label.textContent = `${this._customMinutes}분`;
                });
            }

            // 직접 설정 시작 버튼
            const startBtn = this.el.querySelector('.snw-timer-start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    if (SNW.Haptic && typeof SNW.Haptic.tap === 'function') SNW.Haptic.tap();
                    TimerManager.start(this._customMinutes);
                });
            }
        }
    };
})(window.SNW);



/* ===== LAYER 3: Info & Profiles ===== */

/* ---- 300.page.info.js (3551 bytes) ---- */
// =========================================================
// 300.page.info.js — SNW.Page.Info
// Layer 4 (페이지 로직)
// [P1-16] 정보 확장 (Hostname/MAC/IP/Uptime + 매뉴얼 링크)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Info = class Info {
		constructor(container) {
			this.el = container;
			this._active = true;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.info());
			SNW.I18n.applyTo(this.el);
			
			const slot = this.el.querySelector('[data-slot="panel"]');
			
			try {
				const [v, d, wifi] = await Promise.all([
					SNW.Api.version().catch(() => null),
					SNW.Api.diag().catch(() => null),
					SNW.Api.getWifiState().catch(() => null)
				]);
				if (!this._active) return;
				
				const ver = v || {};
				const diag = d || {};
				const state = (wifi && wifi.wifi && wifi.wifi.state) || {};
				const sys = SNW.Store.get().system || {};
				const esc = SNW.DomUtil.escape;
				
				// Uptime 포맷
				const uptimeSec = sys.uptimeMs ? Math.floor(sys.uptimeMs / 1000) : 0;
				const uptimeStr = uptimeSec > 3600 ?
					`${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m` :
					`${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`;
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-info-panel">
                        <h3>Version</h3>
                        <div class="snw-kv"><span>fw</span><b>${esc(ver.fw || '-')}</b></div>
                        <div class="snw-kv"><span>control</span><b>${esc(ver.control || '-')}</b></div>
                        <div class="snw-kv"><span>config</span><b>${esc(ver.config || '-')}</b></div>
                        <div class="snw-kv"><span>api</span><b>${esc(ver.api || '-')}</b></div>
                        <div class="snw-kv"><span>simul</span><b>${esc(ver.simul || '-')}</b></div>

                        <h3>Device</h3>
                        <div class="snw-kv"><span>Hostname</span><b>${esc(state.hostname || '-')}</b></div>
                        <div class="snw-kv"><span>MAC</span><b>${esc(state.mac || '-')}</b></div>
                        <div class="snw-kv"><span>IP</span><b>${esc(state.ip || '-')}</b></div>
                        <div class="snw-kv"><span>Uptime</span><b>${uptimeStr}</b></div>

                        <h3>System</h3>
                        <div class="snw-kv"><span>Heap Free</span><b>${diag.heap != null ? diag.heap + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Used</span><b>${diag.fs_used != null ? diag.fs_used + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Total</span><b>${diag.fs_total != null ? diag.fs_total + ' B' : '-'}</b></div>

                        <h3>Support</h3>
                        <div style="padding: 8px 0;">
                            <a href="/UserManual_0203_001.md" target="_blank"
                               style="color: var(--snw-primary); text-decoration: underline;">
                                📖 사용자 매뉴얼 열기
                            </a>
                        </div>
                    </div>`);
			} catch (e) {
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`<div class="snw-error">${SNW.I18n.t('msg.unknown')}</div>`);
			}
			
			SNW.LogUtil.info('[Info] mount 완료');
		}
		
		unmount() { this._active = false; }
	};
})(window.SNW);


/* ---- 300.page.windprofile.js (11249 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 300.page.windprofile.js
 * 모듈     : SNW.Page.Windprofile
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 바람 프리셋 관리 (WindProfile CRUD)
 *  - 프리셋 목록 표시 / 추가 / 수정 / 삭제
 * ------------------------------------------------------
 */
/* ---- 300.page.windprofile.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';
    
    SNW.Page.Windprofile = class Windprofile {
        constructor(container) { this.el = container;
            this._active = true;
            this._presets = []; }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.windprofile());
            await this._load();
            this._onLangChange = () => { if (this._active) this._renderList(); };
            document.addEventListener('snw:langchange', this._onLangChange);
            SNW.DomUtil.delegate(this.el, '[data-action="add-preset"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-preset"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (!isNaN(id)) this._onEdit(id); });
            SNW.DomUtil.delegate(this.el, '[data-action="del-preset"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (!isNaN(id)) this._onDelete(id); });
        }
        unmount() {
            this._active = false;
            if (this._onLangChange) document.removeEventListener('snw:langchange', this._onLangChange);
        }
        
        async _load() {
            try { const data = await SNW.Api.listWindProfiles(); if (!this._active) return;
                this._presets = (data && data.windDict && data.windDict.presets) || [];
                this._renderList(); } catch (e) {}
        }
        
        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            listSlot.innerHTML = `<div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="add-preset">${t('windprofile.add', '프리셋 추가')}</button></div>`;
            const wrap = document.createElement('div');
            wrap.className = 'snw-profile-list';
            
            this._presets.forEach((p, idx) => {
                const f = p.factors || {};
                const displayName = (SNW.I18n && SNW.I18n.hasKey('preset.' + p.code)) ? SNW.I18n.t('preset.' + p.code) : p.name;
                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-profile-item">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${idx}</span>
                            <span class="snw-profile-name">${displayName} (${p.code})</span>
                            <button class="snw-btn-icon" data-action="edit-preset" data-id="${idx}">✏️</button>
                            <button class="snw-btn-icon" data-action="del-preset" data-id="${idx}">🗑</button>
                        </div>
                        <div class="snw-schedule-meta" style="font-size:11px;color:var(--snw-text-dim);flex-wrap:wrap;display:flex;gap:8px;margin-top:4px;">
                            <span>${t('windprofile.intensity', '강도')}: ${f.windIntensity ?? '-'}%</span>
                            <span>${t('windprofile.variability', '변동성')}: ${f.windVariability ?? '-'}%</span>
                            <span>${t('windprofile.gust', '돌풍')}: ${f.gustFrequency ?? '-'}%</span>
                            <span>${t('windprofile.fanLimit', '팬한계')}: ${f.fanLimit ?? '-'}%</span>
                            <span>Min Fan: ${f.minFan ?? '-'}%</span>
                        </div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
        }
        
        _onAdd() { this._openEditor(null); }
        _onEdit(idx) { this._openEditor(this._presets[idx]); }
        
        async _openEditor(target) {
            const isEdit = !!target;
            const p = target || { name: 'New Preset', code: 'CUSTOM', factors: { windIntensity: 70, gustFrequency: 50, windVariability: 55, fanLimit: 95, minFan: 10, turbulenceLengthScale: 40, turbulenceIntensitySigma: 0.5, thermalBubbleStrength: 2.0, thermalBubbleRadius: 18, baseMinWind: 1.8, baseMaxWind: 5.5 } };
            const f = p.factors || {};
            
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="snw-form">
                    <div class="snw-form-row"><label>${t('schedule.name', '이름')}</label><input type="text" id="wp-name" value="${p.name}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>${t('windprofile.code', '코드 (영문)')}</label><input type="text" id="wp-code" value="${p.code}" ${isEdit ? 'disabled' : ''} style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;font-size:14px;">${t('windprofile.factorsTitle', '기본 바람 파라미터')}</h3>
                    <div class="snw-form-row"><label>${t('windprofile.intensity', '강도')} (0~100%)</label><input type="number" id="wp-intensity" value="${f.windIntensity ?? 70}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>${t('windprofile.variability', '변동성')} (0~100%)</label><input type="number" id="wp-variability" value="${f.windVariability ?? 50}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>${t('windprofile.gust', '돌풍')} (0~100%)</label><input type="number" id="wp-gust" value="${f.gustFrequency ?? 45}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;font-size:14px;">팬 제어</h3>
                    <div class="snw-form-row"><label>${t('windprofile.fanLimit', '팬 한계')} (%)</label><input type="number" id="wp-fanlimit" value="${f.fanLimit ?? 90}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>최소 팬 (%)</label><input type="number" id="wp-minfan" value="${f.minFan ?? 10}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;font-size:14px;">난류 및 열기포 (물리 시뮬레이션)</h3>
                    <div class="snw-form-row"><label>난류 크기 (Length Scale)</label><input type="number" step="0.1" id="wp-turblen" value="${f.turbulenceLengthScale ?? 40}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>난류 강도 (Sigma)</label><input type="number" step="0.01" id="wp-turbsig" value="${f.turbulenceIntensitySigma ?? 0.5}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>열기포 강도</label><input type="number" step="0.1" id="wp-thermalstr" value="${f.thermalBubbleStrength ?? 2.0}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>열기포 반경</label><input type="number" step="0.1" id="wp-thermalrad" value="${f.thermalBubbleRadius ?? 18}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>

                    <h3 style="margin-top:12px;font-size:14px;">풍속 기준점</h3>
                    <div class="snw-form-row"><label>기본 최소 풍속 (m/s)</label><input type="number" step="0.1" id="wp-basemin" value="${f.baseMinWind ?? 1.8}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>기본 최대 풍속 (m/s)</label><input type="number" step="0.1" id="wp-basemax" value="${f.baseMaxWind ?? 5.5}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                </div>`;
            
            SNW.UI.modal(isEdit ? t('common.edit', '프리셋 편집') : t('windprofile.add', '프리셋 추가'), content, async () => {
                const newFactors = {
                    windIntensity: Number(content.querySelector('#wp-intensity').value),
                    windVariability: Number(content.querySelector('#wp-variability').value),
                    gustFrequency: Number(content.querySelector('#wp-gust').value),
                    fanLimit: Number(content.querySelector('#wp-fanlimit').value),
                    minFan: Number(content.querySelector('#wp-minfan').value),
                    turbulenceLengthScale: Number(content.querySelector('#wp-turblen').value),
                    turbulenceIntensitySigma: Number(content.querySelector('#wp-turbsig').value),
                    thermalBubbleStrength: Number(content.querySelector('#wp-thermalstr').value),
                    thermalBubbleRadius: Number(content.querySelector('#wp-thermalrad').value),
                    baseMinWind: Number(content.querySelector('#wp-basemin').value),
                    baseMaxWind: Number(content.querySelector('#wp-basemax').value)
                };
                
                const body = { preset: { name: content.querySelector('#wp-name').value, code: content.querySelector('#wp-code').value.toUpperCase(), factors: newFactors } };
                
                try {
                    if (isEdit) await SNW.Api.updateWindProfile(this._presets.indexOf(target), body);
                    else await SNW.Api.addWindProfile(body);
                    await SNW.Api.saveConfig();
                    SNW.ToastUtil.success(t('msg.saveSuccess', '저장되었습니다.'));
                    await this._load();
                    return true;
                } catch (e) { SNW.ErrorHandler.handle(e, 'preset.save'); return false; }
            });
        }
        
        async _onDelete(id) {
            if (!confirm(SNW.I18n ? SNW.I18n.t('msg.deleteConfirm') : '삭제하시겠습니까?')) return;
            try { await SNW.Api.deleteWindProfile(id);
                await SNW.Api.saveConfig();
                await this._load(); } catch (e) {}
        }
    };
})(window.SNW);

/* ===== LAYER 9: App Bootstrap, Onboarding & Overlays ===== */

/* ---- 998.onboarding.js (10532 bytes) ---- */
// =========================================================
// 998.onboarding.js — 첫 방문 온보딩 (4단계)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    const LS_KEY = 'snw.onboarded';

    SNW.Onboarding = {
        async start() {
            // 이미 완료
            if (localStorage.getItem(LS_KEY) === '1') return;

            // =========================================================
            // 1) 언어
            // =========================================================
            const lang = await this._stepLang();
            if (lang && SNW.I18n && typeof SNW.I18n.setLang === 'function') {
                SNW.I18n.setLang(lang);
            }

            // =========================================================
            // 2) WiFi 안내 (이미 연결됨 가정)
            // =========================================================
            await this._stepWifi();
            await new Promise(r => setTimeout(r, 300));

            // =========================================================
            // 3) 첫 바람 선택 (큐레이션 3개)
            // =========================================================
            const choice = await this._stepFirstBreeze();

            // =========================================================
            // 4) 지금 시작?
            // =========================================================
            if (choice) {
                const startNow = await this._stepStartNow(choice);
                if (startNow && SNW.Api) {
                    try {
                        if (typeof SNW.Api.startPreset === 'function') {
                            await SNW.Api.startPreset(choice.presetCode, choice.styleCode);
                        } else if (typeof SNW.Api.startSession === 'function') {
                            await SNW.Api.startSession('PRESET', {
                                presetCode: choice.presetCode,
                                styleCode: choice.styleCode,
                            });
                        }
                    } catch (e) {
                        if (SNW.LogUtil && typeof SNW.LogUtil.warn === 'function') {
                            SNW.LogUtil.warn('onboarding start failed', e);
                        }
                    }
                }
            }

            // 완료
            localStorage.setItem(LS_KEY, '1');
        },

        // =========================================================
        // 1) 언어 선택
        // =========================================================
        _stepLang() {
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">🌿</div>
                <h2>Smart Nature Wind</h2>
                <p class="snw-onboarding-desc">
                    자연의 바람을 그대로 담은 스마트 선풍기<br>
                    A smart fan that recreates nature's breeze
                </p>
                <div class="snw-onboarding-choices">
                    <button type="button" class="snw-onboarding-choice" data-lang="ko">
                        <span class="snw-onboarding-choice__icon">🇰🇷</span>
                        <span>한국어</span>
                    </button>
                    <button type="button" class="snw-onboarding-choice" data-lang="en">
                        <span class="snw-onboarding-choice__icon">🇬🇧</span>
                        <span>English</span>
                    </button>
                </div>
            `;

            return new Promise(resolve => {
                let modalRef = null;
                content.querySelectorAll('[data-lang]').forEach(btn => {
                    btn.onclick = () => {
                        resolve(btn.getAttribute('data-lang'));
                        if (modalRef && typeof modalRef.close === 'function') {
                            modalRef.close();
                        }
                    };
                });
                modalRef = SNW.UI.modal('환영합니다 / Welcome', content, null, null,
                    { hideOk: true, hideCancel: true, width: '440px' });
            });
        },

        // =========================================================
        // 2) WiFi 안내
        // =========================================================
        _stepWifi() {
            const t = (k, fb) => (SNW.I18n && typeof SNW.I18n.t === 'function' ? SNW.I18n.t(k) : fb);
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">📶</div>
                <h2>${t('onboarding.wifiTitle', 'Wi-Fi 연결 안내')}</h2>
                <p class="snw-onboarding-desc">
                    ${t('onboarding.wifiDesc', 'NatureWind AP에 연결되었거나 홈 Wi-Fi에 정상 연결되었습니다.')}
                </p>
                <div class="snw-onboarding-info">
                    <div><b>SSID:</b> NatureWind</div>
                    <div><b>Password:</b> 2540</div>
                    <div><b>URL:</b> http://192.168.4.1</div>
                </div>
            `;

            return new Promise(resolve => {
                SNW.UI.modal(
                    t('onboarding.step2', '단계 2: 네트워크 안내'),
                    content,
                    () => { resolve(); return true; },
                    null,
                    { okLabel: t('onboarding.connected', '확인 완료'), hideCancel: true, width: '440px' }
                );
            });
        },

        // =========================================================
        // 3) 첫 바람 선택
        // =========================================================
        _stepFirstBreeze() {
            const t = (k, fb) => (SNW.I18n && typeof SNW.I18n.t === 'function' ? SNW.I18n.t(k) : fb);
            const choices = [
                {
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    icon: '🌊',
                    title: t('onboarding.breeze.ocean', '시원한 바닷바람'),
                    desc: t('onboarding.breeze.oceanDesc', '탁 트인 해안가의 상쾌하고 청량한 리듬'),
                },
                {
                    presetCode: 'FOREST_CANOPY', styleCode: 'RELAX',
                    icon: '🌲',
                    title: t('onboarding.breeze.forest', '숲속 산들바람'),
                    desc: t('onboarding.breeze.forestDesc', '나뭇잎을 부드럽게 스치는 편안한 휴식'),
                },
                {
                    presetCode: 'MOUNTAIN', styleCode: 'ACTIVE',
                    icon: '🏔️',
                    title: t('onboarding.breeze.mountain', '고산 능선바람'),
                    desc: t('onboarding.breeze.mountainDesc', '역동적이고 강력한 피톤치드 에너자이징'),
                },
            ];

            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">🍃</div>
                <h2>${t('onboarding.firstBreezeTitle', '처음 만나는 바람')}</h2>
                <p class="snw-onboarding-desc">${t('onboarding.firstBreezeDesc', '원하시는 기분의 자연 바람을 선택해보세요.')}</p>
                <div class="snw-onboarding-breeze-choices">
                    ${choices.map((c, i) => `
                        <button type="button" class="snw-breeze-choice" data-idx="${i}">
                            <div class="snw-breeze-choice__icon">${c.icon}</div>
                            <div class="snw-breeze-choice__title">${c.title}</div>
                            <div class="snw-breeze-choice__desc">${c.desc}</div>
                        </button>
                    `).join('')}
                </div>
            `;

            return new Promise(resolve => {
                let modalRef = null;
                content.querySelectorAll('[data-idx]').forEach(btn => {
                    btn.onclick = () => {
                        const idx = Number(btn.getAttribute('data-idx'));
                        resolve(choices[idx]);
                        if (modalRef && typeof modalRef.close === 'function') {
                            modalRef.close();
                        }
                    };
                });
                modalRef = SNW.UI.modal(
                    t('onboarding.step3', '단계 3: 첫 바람 선택'),
                    content, null, null,
                    { hideOk: true, hideCancel: true, width: '480px' }
                );
            });
        },

        // =========================================================
        // 4) 지금 시작?
        // =========================================================
        _stepStartNow(choice) {
            const t = (k, fb, vars) => {
                if (SNW.I18n && typeof SNW.I18n.t === 'function') {
                    return SNW.I18n.t(k, vars);
                }
                return fb;
            };
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">${choice.icon || '🍃'}</div>
                <h2>${t('onboarding.startNowTitle', '바람 시작하기')}</h2>
                <p class="snw-onboarding-desc">
                    ${t('onboarding.startNowDesc', `선택하신 '${choice.title}'을(를) 지금 즉시 재생할까요?`, { name: choice.title })}
                </p>
            `;

            return new Promise(resolve => {
                SNW.UI.modal(
                    t('onboarding.step4', '단계 4: 시작 확인'),
                    content,
                    () => { resolve(true); return true; },
                    () => { resolve(false); },
                    {
                        okLabel: t('onboarding.startNow', '지금 시작'),
                        cancelLabel: t('onboarding.later', '나중에'),
                        width: '400px',
                    }
                );
            });
        },
    };
})(window.SNW);



/* ---- 999.app.js (13758 bytes) ---- */
// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // [P0-5] 모달
    SNW.UI = SNW.UI || {};
    SNW.UI.modal = function (title, contentEl, onConfirm, onCancel, opts) {
        opts = opts || {};
        let overlay = document.getElementById('snw-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'snw-modal-overlay';
            overlay.className = 'snw-modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = '';
        overlay.style.display = 'flex';
        overlay.classList.remove('is-open');

        const box = document.createElement('div');
        box.className = 'snw-modal-box';
        if (opts.width) box.style.maxWidth = opts.width;

        const h = document.createElement('h3');
        h.className = 'snw-modal-title';
        h.textContent = title;
        box.appendChild(h);

        const body = document.createElement('div');
        body.className = 'snw-modal-body';
        if (contentEl) body.appendChild(contentEl);
        box.appendChild(body);

        // ======================================================
        // [N-18] 리스너 참조 보관 → close()에서 반드시 제거 (이벤트 누수 방지)
        // ======================================================
        let closed = false;
        let _onEsc = null;
        let _onOverlayClick = null;

        const close = (confirmed) => {
            if (closed) return;
            closed = true;

            if (_onEsc)          document.removeEventListener('keydown', _onEsc);
            if (_onOverlayClick) overlay.removeEventListener('click', _onOverlayClick);
            _onEsc = null;
            _onOverlayClick = null;

            overlay.classList.remove('is-open');
            setTimeout(() => {
                overlay.innerHTML = '';
                overlay.style.display = 'none';
                if (!confirmed && typeof onCancel === 'function') {
                    try { onCancel(); } catch (e) { }
                }
            }, 150);
        };

        _onEsc = (e) => { if (e.key === 'Escape') close(false); };
        document.addEventListener('keydown', _onEsc);

        _onOverlayClick = (e) => { if (e.target === overlay) close(false); };
        overlay.addEventListener('click', _onOverlayClick);

        const actions = document.createElement('div');
        actions.className = 'snw-modal-actions';

        if (!opts.hideCancel) {
            const btnCancel = document.createElement('button');
            btnCancel.className = 'snw-btn';
            btnCancel.textContent = opts.cancelLabel || SNW.I18n.t('common.cancel');
            btnCancel.onclick = () => close(false);
            actions.appendChild(btnCancel);
        }

        if (!opts.hideOk) {
            const btnOk = document.createElement('button');
            btnOk.className = 'snw-btn snw-btn-primary';
            btnOk.textContent = opts.okLabel || SNW.I18n.t('common.ok');
            btnOk.onclick = async () => {
                if (typeof onConfirm !== 'function') { close(true); return; }
                btnOk.disabled = true;
                try {
                    const ok = await onConfirm();
                    if (ok !== false) close(true);
                } catch (e) { } finally { btnOk.disabled = false; }
            };
            actions.appendChild(btnOk);
        }
        box.appendChild(actions);
        overlay.appendChild(box);
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        return { close: () => close(false) };
    };

    // [O-1/O-5/O-17] 배너
    SNW.Banner = {
        _current: null,
        show(config) {
            this.hide();
            const host = document.getElementById('snw-main');
            if (!host) return;
            const banner = document.createElement('div');
            banner.className = `snw-banner snw-banner--${config.level || 'info'}`;
            banner.dataset.bannerId = config.id || '';
            const text = document.createElement('span');
            text.className = 'snw-banner__text';
            text.textContent = config.text;
            banner.appendChild(text);
            (config.actions || []).forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'snw-btn snw-btn--sm';
                btn.textContent = act.label;
                btn.onclick = act.onClick;
                banner.appendChild(btn);
            });
            host.insertBefore(banner, host.firstChild);
            this._current = banner;
        },
        hide() { if (this._current) { this._current.remove(); this._current = null; } },
        update(id, config) {
            if (this._current && this._current.dataset.bannerId === id) {
                const t = this._current.querySelector('.snw-banner__text');
                if (t && config.text) t.textContent = config.text;
            } else { this.show(config); }
        }
    };

    // [O-10] 업로드 매니저
    SNW.UploadManager = {
        _tasks: {},
        start(taskId, kind, file, onProgress) {
            if (this._tasks[taskId]) return Promise.reject(new Error('Already in progress'));
            const task = { id: taskId, kind, filename: file.name, progress: 0, status: 'uploading' };
            this._tasks[taskId] = task;
            this._renderHeaderIndicator();
            const apiMethod = kind === 'firmware' ? 'uploadFirmware' : 'uploadFile';
            const promise = SNW.Api[apiMethod](file, (pct) => {
                task.progress = pct;
                if (onProgress) onProgress(pct);
                this._renderHeaderIndicator();
            }).then(res => {
                task.status = 'done';
                SNW.ToastUtil.success(kind === 'firmware' ? SNW.I18n.t('firmware.otaSuccess') : SNW.I18n.t('msg.saveSuccess'));
                setTimeout(() => this._remove(taskId), 3000);
                return res;
            }).catch(err => {
                task.status = 'error';
                SNW.ErrorHandler.handle(err, `upload.${kind}`);
                setTimeout(() => this._remove(taskId), 5000);
                throw err;
            });
            task.promise = promise;
            return promise;
        },
        isUploading() { return Object.values(this._tasks).some(t => t.status === 'uploading'); },
        _remove(taskId) { delete this._tasks[taskId]; this._renderHeaderIndicator(); },
        _renderHeaderIndicator() {
            const tasks = Object.values(this._tasks).filter(t => t.status === 'uploading');
            let indicator = document.getElementById('upload-indicator');
            if (tasks.length === 0) { if (indicator) indicator.remove(); return; }
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'upload-indicator';
                indicator.className = 'snw-upload-indicator';
                document.body.appendChild(indicator);
            }
            const task = tasks[0];
            indicator.innerHTML = `
                <div class="snw-upload-indicator__label">
                    ${SNW.DomUtil ? SNW.DomUtil.escape(task.filename) : task.filename} (${Math.round(task.progress * 100)}%)
                </div>
                <div class="snw-upload-indicator__bar"><div style="width:${task.progress * 100}%"></div></div>
            `;
        }
    };

    function _bindConnectionStatus() {
        const dot = document.getElementById('conn-status');
        const footerStat = document.getElementById('footer-status');
        if (!dot && !footerStat) return;
        const render = (conn) => {
            if (dot) { dot.className = 'snw-status-dot snw-status-dot--' + conn; dot.title = SNW.I18n.t('footer.' + conn); }
            if (footerStat) footerStat.textContent = SNW.I18n.t('footer.' + conn);
        };
        SNW.Store.watch('connection', render);
        render(SNW.Store.get().connection);
    }

    function _bindLastUpdate() {
        const el = document.getElementById('footer-lastUpdate');
        if (!el) return;
        const render = (ms) => {
            if (!ms) { el.textContent = '-'; return; }
            const sec = Math.round((Date.now() - ms) / 1000);
            el.textContent = sec < 1 ? '0.0s' : `${sec}s`;
        };
        SNW.Store.watch('lastUpdateMs', render);
        setInterval(() => render(SNW.Store.get().lastUpdateMs), 1000);
    }

    function _bindLangToggle() {
        const btn = document.getElementById('btn-lang');
        if (!btn) return;
        btn.onclick = () => {
            const cur = SNW.I18n.getLang();
            SNW.I18n.setLang(cur === 'ko' ? 'en' : 'ko');
            SNW.I18n.applyTo(document);
        };
    }

    // =========================================================
    // [최종] 사이드바 완벽 제어
    //  - hidden 속성 사용 안 함 (CSS !important 충돌 방지)
    //  - 인라인 스타일 강제 초기화
    //  - ESC / 외부 클릭 / 오버레이 클릭 모두 지원
    // =========================================================
    function _bindSidebarToggle() {
        const btn = document.getElementById('btn-menu');
        const sidebar = document.getElementById('snw-sidebar');
        const overlay = document.getElementById('snw-sidebar-overlay');
        if (!btn || !sidebar) return;

        // ★ 인라인 스타일 강제 초기화 (P010 번들의 hidden/display 간섭 무력화)
        sidebar.removeAttribute('hidden');
        sidebar.style.display = '';

        // 1. ☰ 버튼 토글
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebar.style.display = '';   // 인라인 스타일 재차 초기화
            document.body.classList.toggle('snw-sidebar-open');
        };

        // 2. 오버레이 클릭/터치 닫기
        if (overlay) {
            const closeOverlay = (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.classList.remove('snw-sidebar-open');
            };
            overlay.onclick = closeOverlay;
            overlay.ontouchstart = closeOverlay;
        }

        // 3. 사이드바 내부 링크 클릭 시 닫기
        sidebar.onclick = (e) => {
            if (e.target.closest('a')) {
                document.body.classList.remove('snw-sidebar-open');
            }
        };

        // 4. 외부 영역 클릭 시 닫기 (데스크톱 + 오버레이 안 보이는 환경 보완)
        document.addEventListener('click', (e) => {
            if (!document.body.classList.contains('snw-sidebar-open')) return;
            if (sidebar.contains(e.target)) return;
            if (btn.contains(e.target)) return;
            document.body.classList.remove('snw-sidebar-open');
        });

        // 5. ESC 키 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('snw-sidebar-open')) {
                document.body.classList.remove('snw-sidebar-open');
            }
        });
    }

    window.SNW_BOOT = async function () {
        if (window.SNW_BOOT_CALLED) return;
        window.SNW_BOOT_CALLED = true;

        try {
            if (window.SNW_OFFLINE) {
                let waitCount = 0;
                while ((!SNW.Offline || !SNW.Offline.ready) && waitCount < 60) {
                    await new Promise(r => setTimeout(r, 50));
                    waitCount++;
                }
                if (SNW.Offline) {
                    if (SNW.Offline.ready) await SNW.Offline.ready;
                    if (typeof SNW.Offline.ensureApi === 'function') SNW.Offline.ensureApi();
                    if (typeof SNW.Offline.stubWs === 'function') SNW.Offline.stubWs();
                }
                if (typeof SNW.LevelUtil !== 'undefined') {
                    SNW.LevelUtil.current = () => 'L4';
                    SNW.LevelUtil.atLeast = () => true;
                }
            }

            SNW.I18n.applyTo(document);
            if (typeof SNW.LevelUtil !== 'undefined' && SNW.LevelUtil.applyTo) {
                SNW.LevelUtil.applyTo(document.body);
            }

            _bindConnectionStatus();
            _bindLastUpdate();
            _bindSidebarToggle();
            SNW.WsManager.initByLevel();
            SNW.StoreBridge.start();
            _bindLangToggle();
            if (SNW.NowPlaying && typeof SNW.NowPlaying.init === 'function') {
                SNW.NowPlaying.init();
            }
            SNW.Router.init();
            SNW.LogUtil.info('App bootstrap complete');

            // [Stage 7] 첫 방문 온보딩 4단계
            setTimeout(() => {
                if (SNW.Onboarding && typeof SNW.Onboarding.start === 'function') {
                    SNW.Onboarding.start();
                }
            }, 500);
        } catch (e) {
            SNW.LogUtil.error('bootstrap failed', e);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.SNW_BOOT(); });
    } else {
        window.SNW_BOOT();
    }

    // [U-B8] 야간 자동 감광
    function _applyNightMode() {
        const h = new Date().getHours();
        const isNight = (h >= 22 || h < 6);
        document.body.classList.toggle('snw-night-mode', isNight);
    }
    _applyNightMode();
    setInterval(_applyNightMode, 60000);

})(window.SNW);


/* ---- 999a.nowplaying.js (16855 bytes) ---- */
// =========================================================
// 999a.nowplaying.js — 전역 Now Playing Bar
// Layer 3 (애플리케이션 전역 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    const barEl = {
        root: null,
        eq: null,
        title: null,
        step: null,
        time: null,
        pending: null,
        timerBadge: null,
        timerVal: null,
        btnPause: null,
        btnStop: null,
        // 로컬 상태
        _eqAnimId: null,
        _eqBuffer: [],
    };

    function $(sel, root) { return (root || document).querySelector(sel); }

    function getSession() {
        return (SNW.Store && SNW.Store.get) ? SNW.Store.get().session : null;
    }

    function parseType(t) {
        if (typeof t === 'number') return t;
        const m = { NONE: 0, PLAYLIST: 1, PRESET: 2, FIXED: 3 };
        return m[t] != null ? m[t] : 0;
    }

    function isSessionVisible() {
        const s = getSession();
        if (!s) return false;
        const type = parseType(s.type);
        return (type !== 0 && s.active !== false);
    }

    function formatTime(sec) {
        if (!sec || sec < 0) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    // =========================================================
    // 렌더링
    // =========================================================
    function render() {
        if (!barEl.root) return;

        const s = getSession();
        if (!s || !isSessionVisible()) {
            barEl.root.hidden = true;
            document.body.classList.remove('has-nowplaying');
            stopEq();
            return;
        }
        barEl.root.hidden = false;
        document.body.classList.add('has-nowplaying');

        const type = parseType(s.type);
        const stateStr = (typeof s.state === 'string') ? s.state : (s.state === 1 ? 'PAUSED' : 'RUNNING');
        const isPaused = (stateStr === 'PAUSED');

        // 1) 타이틀
        let title = '';
        if (type === 1) {
            title = s.profileName || (s.profileNo ? `프로필 #${s.profileNo}` : '플레이리스트');
        } else if (type === 2) {
            title = `${s.presetCode || '자연풍'} · ${s.styleCode || '표준'}`;
        } else if (type === 3) {
            title = `일반 선풍기 (${Math.round(s.percent || 0)}%)`;
        } else {
            title = '재생 중';
        }
        barEl.title.textContent = title;

        // 2) 서브 정보 (스텝, 남은 시간)
        if (type === 1) {
            barEl.step.textContent = `Step ${s.currentStep || 1}/${s.totalSteps || 1}`;
            const remainSec = s.stepRemainSec || 0;
            barEl.time.textContent = isPaused
                ? `일시정지 (${formatTime(remainSec)})`
                : (remainSec > 0 ? formatTime(remainSec) : '가동 중');
        } else if (type === 3) {
            barEl.step.textContent = `${Math.round(s.percent || 0)}%`;
            barEl.time.textContent = isPaused ? '일시정지' : '가동 중';
        } else {
            barEl.step.textContent = '';
            barEl.time.textContent = isPaused ? '일시정지' : '가동 중';
        }

        // 3) 일시정지 / 재개 버튼 아이콘
        barEl.btnPause.textContent = isPaused ? '▶' : '⏸';
        barEl.btnPause.setAttribute('aria-label', isPaused ? '재개' : '일시정지');

        // 4) Pending Schedule 충돌 배지
        const ctl = (SNW.Store && SNW.Store.get) ? SNW.Store.get().control : null;
        const ps = ctl && ctl.pendingSchedule;
        if (ps && ps.active && ps.inactiveDueToManual) {
            barEl.pending.hidden = false;
            const remain = ps.remainMin || 0;
            const isActive = (remain === 0);
            const label = isActive
                ? `⏰ ${ps.startTime || ''}`
                : `⏰ ${remain}분 후`;

            barEl.pending.innerHTML = `<span class="strike" title="수동 재생 중 · ${SNW.DomUtil ? SNW.DomUtil.escape(ps.name || '') : ''} 스케줄 대기">${label}</span>`;
            barEl.pending.style.cursor = 'pointer';
            barEl.pending.onclick = (e) => {
                e.stopPropagation();
                showScheduleConflictModal(ps);
            };
        } else {
            barEl.pending.hidden = true;
            barEl.pending.onclick = null;
        }

        // 4-1) Timer 배지
        const timerStatus = (SNW.TimerManager && typeof SNW.TimerManager.getStatus === 'function')
            ? SNW.TimerManager.getStatus()
            : null;
        if (barEl.timerBadge && timerStatus && timerStatus.active) {
            barEl.timerBadge.hidden = false;
            const min = timerStatus.remainMin;
            const text = min > 60 ? `${Math.floor(min / 60)}h${min % 60}m` : `${min}m`;
            if (barEl.timerVal) barEl.timerVal.textContent = text;
            barEl.timerBadge.onclick = (e) => {
                e.stopPropagation();
                location.hash = '/automation/timer';
            };
        } else if (barEl.timerBadge) {
            barEl.timerBadge.hidden = true;
            barEl.timerBadge.onclick = null;
        }

        // 5) EQ 애니메이션
        if (isPaused) {
            stopEq();
            renderEqStatic();
        } else {
            startEq();
        }
    }

    // =========================================================
    // 이퀄라이저 애니메이션
    // =========================================================
    function startEq() {
        if (barEl._eqAnimId || !barEl.eq) return;
        const ctx = barEl.eq.getContext('2d');
        const w = barEl.eq.width;
        const h = barEl.eq.height;

        const tick = () => {
            if (!barEl._eqAnimId) return;
            const store = SNW.Store ? SNW.Store.get() : {};
            const sim = store.sim || {};
            const v = (sim.windSpeed != null) ? sim.windSpeed : (Math.random() * 8 + 2);
            barEl._eqBuffer.push(v);
            if (barEl._eqBuffer.length > 5) barEl._eqBuffer.shift();

            ctx.clearRect(0, 0, w, h);
            const bars = barEl._eqBuffer.length;
            const bw = w / Math.max(bars, 1);
            for (let i = 0; i < bars; i++) {
                const val = barEl._eqBuffer[i] || 0;
                const bh = Math.max(2, Math.min(h, (val / 12.0) * h));
                ctx.fillStyle = val > 7 ? '#f0883e' : val > 3 ? '#3fb950' : '#4a9eff';
                ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
            }
            barEl._eqAnimId = requestAnimationFrame(tick);
        };
        barEl._eqAnimId = requestAnimationFrame(tick);
    }

    function stopEq() {
        if (barEl._eqAnimId) {
            cancelAnimationFrame(barEl._eqAnimId);
            barEl._eqAnimId = null;
        }
    }

    function renderEqStatic() {
        if (!barEl.eq) return;
        const ctx = barEl.eq.getContext('2d');
        const w = barEl.eq.width;
        const h = barEl.eq.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#59636e';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(i * (w / 4) + 1, h / 2 - 1, w / 4 - 2, 2);
        }
    }

    // =========================================================
    // 액션 핸들러
    // =========================================================
    async function onPauseOrResume(e) {
        if (e) e.stopPropagation();
        const s = getSession();
        if (!s) return;
        try {
            const stateStr = (typeof s.state === 'string') ? s.state : (s.state === 1 ? 'PAUSED' : 'RUNNING');
            if (stateStr === 'PAUSED') {
                await SNW.Api.resumeSession();
                if (SNW.ToastUtil) SNW.ToastUtil.success('바람이 재개되었습니다.');
            } else {
                await SNW.Api.pauseSession();
                if (SNW.ToastUtil) SNW.ToastUtil.info('바람이 일시정지되었습니다.');
            }
        } catch (err) {
            if (SNW.ToastUtil) SNW.ToastUtil.error(err.message || '세션 제어 실패');
        }
    }

    async function onStop(e) {
        if (e) e.stopPropagation();
        try {
            await SNW.Api.stopSession();
            if (SNW.ToastUtil) SNW.ToastUtil.info('바람이 정지되었습니다.');
        } catch (err) {
            if (SNW.ToastUtil) SNW.ToastUtil.error(err.message || '세션 정지 실패');
        }
    }

    function onExpand() {
        const s = getSession();
        if (!s) return;
        showNowPlayingDetailsModal(s);
    }

    // =========================================================
    // 초기화
    // =========================================================
    function init() {
        barEl.root = document.getElementById('now-playing-bar');
        if (!barEl.root) return;

        barEl.eq = $('.snw-nowplaying__eq', barEl.root);
        barEl.title = $('.snw-nowplaying__title', barEl.root);
        barEl.step = $('[data-slot="np-step"]', barEl.root);
        barEl.time = $('[data-slot="np-time"]', barEl.root);
        barEl.pending = $('[data-slot="np-pending"]', barEl.root);
        barEl.timerBadge = $('[data-slot="np-timer"]', barEl.root);
        barEl.timerVal = $('[data-slot="np-timer-val"]', barEl.root);
        barEl.btnPause = $('[data-action="pause"]', barEl.root);
        barEl.btnStop = $('[data-action="stop"]', barEl.root);

        if (barEl.btnPause) barEl.btnPause.addEventListener('click', onPauseOrResume);
        if (barEl.btnStop) barEl.btnStop.addEventListener('click', onStop);

        const leftEl = $('[data-action="expand"]', barEl.root);
        if (leftEl) leftEl.addEventListener('click', onExpand);

        // Store 구독
        if (SNW.Store && typeof SNW.Store.subscribe === 'function') {
            SNW.Store.subscribe(() => render());
        }
        document.addEventListener('snw:timerchange', () => render());
        render();
        SNW.LogUtil.info('[NowPlaying] Bar initialized');
    }

    SNW.NowPlaying = {
        init,
        render,
        getSession
    };


    // =========================================================
    // Now Playing 상세 확장 모달
    // =========================================================
    function showNowPlayingDetailsModal(s) {
        if (!SNW.UI || !SNW.UI.modal || !s) return;
        const type = parseType(s.type);
        const stateStr = (typeof s.state === 'string') ? s.state : (s.state === 1 ? 'PAUSED' : 'RUNNING');
        const isPaused = (stateStr === 'PAUSED');

        let title = '';
        let typeBadge = '';
        if (type === 1) {
            title = s.profileName || (s.profileNo ? `프로필 #${s.profileNo}` : '플레이리스트');
            typeBadge = '🎵 맞춤 바람 (플레이리스트)';
        } else if (type === 2) {
            title = `${s.presetCode || '자연풍'} · ${s.styleCode || '표준'}`;
            typeBadge = '🌿 자연풍 프리셋';
        } else if (type === 3) {
            title = `일반 선풍기 (${Math.round(s.percent || 0)}%)`;
            typeBadge = '🌀 고정 풍속';
        } else {
            title = '재생 중인 바람';
            typeBadge = '🍃 세션';
        }

        const remainSec = s.stepRemainSec || 0;
        const timeStr = isPaused
            ? `일시정지 (${formatTime(remainSec)})`
            : (remainSec > 0 ? `${formatTime(remainSec)} 남음` : '연속 가동 중');

        const stepStr = (type === 1) ? `Step ${s.currentStep || 1} / ${s.totalSteps || 1}` : '';

        const timerStatus = (SNW.TimerManager && typeof SNW.TimerManager.getStatus === 'function')
            ? SNW.TimerManager.getStatus()
            : null;
        const timerActive = timerStatus && timerStatus.active;
        const timerText = timerActive
            ? `⏱️ 자동 종료 타이머: ${timerStatus.remainMin}분 남음`
            : '⏱️ 자동 종료 예약 타이머 설정';

        const content = document.createElement('div');
        content.className = 'snw-np-detail-modal';
        content.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:14px;padding:4px 0;">
                <div style="text-align:center;padding:12px;background:var(--snw-surface-2,#12161c);border-radius:var(--snw-radius,8px);border:1px solid var(--snw-border,#2f3844);">
                    <div style="font-size:11px;color:var(--snw-primary,#4a9eff);font-weight:600;margin-bottom:4px;">${typeBadge}</div>
                    <div style="font-size:18px;font-weight:700;color:var(--snw-text,#e6edf3);">${SNW.DomUtil ? SNW.DomUtil.escape(title) : title}</div>
                    <div style="font-size:13px;color:var(--snw-text-dim,#8b949e);margin-top:6px;display:flex;justify-content:center;gap:8px;">
                        ${stepStr ? `<span><b>${stepStr}</b></span><span>·</span>` : ''}
                        <span style="color:${isPaused ? 'var(--snw-warn,#d29922)' : 'var(--snw-success,#3fb950)'};font-weight:600;">
                            ${isPaused ? '⏸ 일시정지' : '▶ 재생 중'}
                        </span>
                        <span>·</span>
                        <span>${timeStr}</span>
                    </div>
                </div>

                <button type="button" class="snw-btn snw-btn--full" id="np-btn-timer-link" style="justify-content:center;background:${timerActive ? 'rgba(78,168,222,0.15)' : 'var(--snw-surface-2,#12161c)'};border:1px solid ${timerActive ? 'var(--snw-info,#4ea8de)' : 'var(--snw-border,#2f3844)'};color:${timerActive ? 'var(--snw-info,#4ea8de)' : 'var(--snw-text,#e6edf3)'};">
                    ${timerText} ➔
                </button>
            </div>
        `;

        SNW.UI.modal(
            '🍃 바람 세션 상세',
            content,
            async () => {
                await onPauseOrResume();
                return true;
            },
            async () => {
                await onStop();
                return true;
            },
            {
                okLabel: isPaused ? '▶ 재개' : '⏸ 일시정지',
                cancelLabel: '⏹ 바람 정지',
                width: '380px'
            }
        );

        const timerBtn = content.querySelector('#np-btn-timer-link');
        if (timerBtn) {
            timerBtn.onclick = () => {
                const overlay = document.querySelector('.snw-modal-overlay');
                if (overlay) overlay.click();
                location.hash = '/automation/timer';
            };
        }
    }

    // =========================================================
    // 스케줄 충돌 모달
    // =========================================================
    function showScheduleConflictModal(ps) {
        if (!SNW.UI || !SNW.UI.modal) return;
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="snw-schedule-conflict">
                <p style="margin-bottom:12px;">
                    현재 <b>수동 재생 중</b>입니다.
                </p>
                <div class="snw-schedule-conflict__info" style="padding:12px;background:var(--snw-surface-2,#12161c);border-radius:var(--snw-radius,8px);font-size:13px;display:flex;flex-direction:column;gap:6px;">
                    <div><b>다음 스케줄:</b> ${SNW.DomUtil ? SNW.DomUtil.escape(ps.name || '-') : (ps.name || '-')}</div>
                    <div><b>시간:</b> ${ps.startTime || '-'}
                        ${ps.remainMin > 0 ? ` (${ps.remainMin}분 후)` : ' (지금 활성)'}
                    </div>
                    <div><b>프로필 #:</b> ${ps.profileNo || '-'}</div>
                </div>
                <p style="margin-top:12px;font-size:12px;color:var(--snw-text-dim,#8b949e);">
                    수동 재생을 종료하지 않으면 스케줄이 실행되지 않습니다.
                    어떻게 하시겠어요?
                </p>
            </div>`;

        SNW.UI.modal('⏰ 스케줄 충돌 안내', content,
            async () => {
                try {
                    await SNW.Api.stopSession();
                    if (SNW.ToastUtil) SNW.ToastUtil.success('수동 재생 종료 · 다음 스케줄 대기');
                    return true;
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '실패');
                    return false;
                }
            },
            null,
            {
                okLabel: '⏹ 수동 정지',
                cancelLabel: '계속 수동 유지',
                width: '400px'
            }
        );
    }

})(window.SNW);



/* ---- 999b.ai-sheet.js (11604 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 999b.ai-sheet.js
 * 모듈약어 : SNW.AISheet
 * 모듈명 : Smart Nature Wind Global Floating AI Voice Sheet (FAB)
 * ------------------------------------------------------
 * 기능 요약:
 *  - 어느 화면에서나 AI 음성 제어를 호출할 수 있는 전역 플로팅 액션 버튼 (FAB)
 *  - 슬라이드업 바텀 시트 오버레이 (REST 자연어 제어 & Gemini Live 실시간 음성)
 *  - 빠른 실행 칩 (Quick chips), 실시간 발화 상태, 도구 실행 피드백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _initialized = false;
	let _visible = false;
	let _mode = 'rest'; // 'rest' | 'live'
	let _fabEl = null;
	let _sheetEl = null;
	let _history = [];

	const AISheet = {
		init() {
			if (_initialized) return;
			_initialized = true;

			_mode = localStorage.getItem('snw.ai.mode') || 'rest';

			this._renderFAB();
			this._renderSheet();
			this._bindEvents();

			// 옵션 웨이크워드 연동
			if (SNW.AIVoice && SNW.AIVoice.isSTTSupported()) {
				SNW.AIVoice.startWakeDetection({
					onWake: () => {
						this.open();
						if (SNW.Toast) SNW.Toast.show(SNW.I18n ? SNW.I18n.t('ai.voiceListening') : 'Listening...', 'info');
					}
				});
			}

			SNW.LogUtil ? SNW.LogUtil.info('[AISheet] Global AI FAB sheet initialized') : console.log('[AISheet] Initialized');
		},

		_renderFAB() {
			_fabEl = document.createElement('button');
			_fabEl.type = 'button';
			_fabEl.className = 'snw-ai-fab';
			_fabEl.setAttribute('aria-label', 'AI Assistant');
			_fabEl.innerHTML = '🎙️';
			_fabEl.style.cssText = `
				position: fixed;
				bottom: var(--snw-fab-bottom, 76px);
				right: 20px;
				width: 54px;
				height: 54px;
				border-radius: 50%;
				background: linear-gradient(135deg, #3b82f6, #8b5cf6);
				color: #ffffff;
				border: none;
				box-shadow: 0 4px 14px rgba(0,0,0,0.3), 0 0 10px rgba(59,130,246,0.5);
				font-size: 24px;
				cursor: pointer;
				z-index: var(--snw-z-fab, 990);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: bottom 0.25s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
			`;

			_fabEl.addEventListener('mouseenter', () => {
				_fabEl.style.transform = 'scale(1.08)';
			});
			_fabEl.addEventListener('mouseleave', () => {
				_fabEl.style.transform = 'scale(1)';
			});
			_fabEl.addEventListener('click', () => {
				this.toggle();
			});

			document.body.appendChild(_fabEl);
		},

		_renderSheet() {
			_sheetEl = document.createElement('div');
			_sheetEl.className = 'snw-ai-sheet-container';
			_sheetEl.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0,0,0,0.5);
				backdrop-filter: blur(4px);
				z-index: var(--snw-z-modal, 1100);
				display: none;
				opacity: 0;
				transition: opacity 0.25s ease;
				justify-content: center;
				align-items: flex-end;
			`;

			const placeholderText = SNW.I18n ? SNW.I18n.t('ai.placeholder') : 'Ask anything...';
			const sendText = SNW.I18n ? SNW.I18n.t('ai.send') : 'Send';
			const titleText = SNW.I18n ? SNW.I18n.t('ai.title') : 'AI Assistant';

			_sheetEl.innerHTML = `
				<div class="snw-ai-sheet" style="
					width: 100%;
					max-width: 600px;
					max-height: 82vh;
					background: var(--snw-surface, #1e293b);
					border-top-left-radius: 20px;
					border-top-right-radius: 20px;
					box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
					display: flex;
					flex-direction: column;
					padding: 16px;
					transform: translateY(100%);
					transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
				">
					<!-- Header -->
					<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
						<div style="display:flex;align-items:center;gap:8px;">
							<span style="font-size:1.2rem;font-weight:700;">✨ ${titleText}</span>
							<span class="snw-badge snw-badge--info" data-slot="sheet-cost" style="display:none;font-size:0.75rem;"></span>
						</div>
						<button type="button" class="snw-btn snw-btn--ghost snw-btn--sm" data-action="sheet-close" style="font-size:1.2rem;line-height:1;padding:4px 8px;">✕</button>
					</div>

					<!-- Quick Chips -->
					<div style="display:flex;gap:6px;overflow-x:auto;padding:10px 0;scrollbar-width:none;">
						<button type="button" class="snw-btn snw-btn--sm" data-quick="바다 바람 틀어줘">바다 바람</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="30분 후 꺼줘">30분 후 꺼줘</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="스케줄대로 해줘">스케줄 복귀</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="팬 정지">정지</button>
					</div>

					<!-- Messages List -->
					<div data-slot="sheet-messages" style="flex:1;overflow-y:auto;min-height:180px;max-height:360px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;padding-right:4px;"></div>

					<!-- Input Bar -->
					<div style="display:flex;gap:8px;align-items:center;">
						<input type="text" data-slot="sheet-input" placeholder="${placeholderText}" style="flex:1;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.2);color:#fff;outline:none;" />
						<button type="button" class="snw-btn snw-btn--secondary" data-action="sheet-mic" title="음성 입력 (클릭 시에만 마이크가 활성화됩니다)" style="border-radius:12px;padding:10px 14px;">🎤</button>
						<button type="button" class="snw-btn snw-btn--primary" data-action="sheet-send" style="border-radius:12px;padding:10px 16px;">${sendText}</button>
					</div>
				</div>
			`;

			document.body.appendChild(_sheetEl);
		},

		_bindEvents() {
			// 바깥 영역 클릭 시 닫기
			_sheetEl.addEventListener('click', (e) => {
				if (e.target === _sheetEl) this.close();
			});

			const closeBtn = _sheetEl.querySelector('[data-action="sheet-close"]');
			if (closeBtn) closeBtn.addEventListener('click', () => this.close());

			const sendBtn = _sheetEl.querySelector('[data-action="sheet-send"]');
			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			const micBtn = _sheetEl.querySelector('[data-action="sheet-mic"]');

			if (sendBtn) sendBtn.addEventListener('click', () => this._onSend());
			if (inputEl) {
				inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this._onSend();
					}
				});
			}

			if (micBtn) {
				micBtn.addEventListener('click', () => this._onVoiceInput());
			}

			// 퀵 칩 이벤트
			const chips = _sheetEl.querySelectorAll('[data-quick]');
			chips.forEach(chip => {
				chip.addEventListener('click', () => {
					const val = chip.getAttribute('data-quick');
					if (inputEl) {
						inputEl.value = val;
						this._onSend();
					}
				});
			});
		},

		open() {
			if (_visible) return;
			_visible = true;
			_sheetEl.style.display = 'flex';
			requestAnimationFrame(() => {
				_sheetEl.style.opacity = '1';
				const inner = _sheetEl.querySelector('.snw-ai-sheet');
				if (inner) inner.style.transform = 'translateY(0)';
			});

			if (SNW.AIClient) {
				_history = SNW.AIClient.loadHistory();
				this._renderMessages();
			}

			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			if (inputEl) setTimeout(() => inputEl.focus(), 300);
		},

		close() {
			if (!_visible) return;
			_visible = false;
			_sheetEl.style.opacity = '0';
			const inner = _sheetEl.querySelector('.snw-ai-sheet');
			if (inner) inner.style.transform = 'translateY(100%)';
			setTimeout(() => {
				if (!_visible) _sheetEl.style.display = 'none';
			}, 300);
		},

		toggle() {
			if (_visible) this.close();
			else this.open();
		},

		_renderMessages() {
			const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
			if (!box) return;
			box.innerHTML = '';
			const recent = _history.slice(-10);
			for (const m of recent) {
				this._appendBubble(m.role, m.text);
			}
			box.scrollTop = box.scrollHeight;
		},

		_appendBubble(role, text) {
			const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
			if (!box) return;

			const bubble = document.createElement('div');
			const isUser = (role === 'user');
			bubble.style.cssText = `
				align-self: ${isUser ? 'flex-end' : 'flex-start'};
				max-width: 82%;
				padding: 8px 12px;
				border-radius: 12px;
				font-size: 0.92rem;
				line-height: 1.4;
				background: ${isUser ? '#3b82f6' : 'rgba(255,255,255,0.08)'};
				color: #fff;
				word-break: break-word;
			`;
			bubble.textContent = text;
			box.appendChild(bubble);
			box.scrollTop = box.scrollHeight;
		},

		async _onSend() {
			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			const msg = (inputEl && inputEl.value || '').trim();
			if (!msg) return;
			inputEl.value = '';

			this._appendBubble('user', msg);
			_history.push({ role: 'user', text: msg });
			if (SNW.AIClient) SNW.AIClient.saveHistory(_history);

			this._appendBubble('assistant', '🤔 ...');

			try {
				let reply = '';
				let hint = '';
				let actions = [];

				if (SNW.AIClient) {
					const res = await SNW.AIClient.send(msg, _history, {
						lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
						voiceMode: false
					});
					reply = (res && res.text) || '(no response)';
					hint = (res && res._speechHint) || reply;
					actions = (res && res.actions) || [];
				} else if (SNW.Api && SNW.Api.gemini) {
					const res = await SNW.Api.gemini({ message: msg });
					reply = (res && res.text) || '(no response)';
				}

				this._updateLastBubble(reply, actions);
				_history.push({ role: 'assistant', text: reply });
				if (SNW.AIClient) SNW.AIClient.saveHistory(_history);

				// TTS 발화
				if (hint && SNW.AIVoice && SNW.AIVoice.isTTSSupported()) {
					SNW.AIVoice.speak(hint);
				}
			} catch (e) {
				this._updateLastBubble('❌ ' + (e.message || 'Error'));
			}
		},

		_updateLastBubble(text, actions = []) {
			const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
			if (!box) return;
			const bubbles = box.querySelectorAll('div');
			const last = bubbles[bubbles.length - 1];
			if (last) {
				let actionStr = '';
				if (actions && actions.length > 0) {
					actionStr = '\n' + actions.map(a => `✓ ${a.name}: ${a.result}`).join('\n');
				}
				last.textContent = text + actionStr;
			}
			box.scrollTop = box.scrollHeight;
		},

		async _onVoiceInput() {
			if (!SNW.AIVoice || !SNW.AIVoice.isSTTSupported()) {
				if (SNW.Toast) SNW.Toast.show('Voice input not supported', 'warn');
				return;
			}

			const micBtn = _sheetEl.querySelector('[data-action="sheet-mic"]');
			if (micBtn) micBtn.style.background = '#ef4444';

			try {
				const res = await SNW.AIVoice.startListening();
				if (micBtn) micBtn.style.background = '';
				if (res && res.transcript) {
					const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
					if (inputEl) {
						inputEl.value = res.transcript;
						this._onSend();
					}
				}
			} catch (e) {
				if (micBtn) micBtn.style.background = '';
			}
		}
	};

	SNW.AISheet = AISheet;

	// 앱 부팅 시 자동 초기화
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => AISheet.init());
	} else {
		AISheet.init();
	}

})(window, window.SNW);


