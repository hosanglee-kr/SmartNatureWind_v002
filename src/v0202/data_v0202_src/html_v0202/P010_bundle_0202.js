
/* ===== LAYER 0 ===== */

/* ---- 000.const.js (8445 bytes) ---- */
// =========================================================
// 000.const.js — 프론트엔드 상수 (변경 불변)
// Layer 0 (기반) — 어떤 모듈도 참조하지 않음
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    /* __AUTO_SYNC_CONST_START__ */
    // [주의] 아래 AUTO_CONST 블록은 pio_gzip_0202.py에 의해 C++ 헤더에서 자동 동기화됩니다.
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


/* ---- 010.config.js (5324 bytes) ---- */
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
			overrideParams: '/api/v001/control/override',
			ack: '/api/v001/control/ack',
			controlMode: '/api/v001/control/mode',
			simulation: '/api/v001/simulation',
			simState: '/api/v001/sim/state',
			chartHistory: '/api/v001/sim/chart',
			monitor: '/api/v001/monitor',
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



/* ---- 020.i18n.js (50842 bytes) ---- */
// =========================================================
// 020.i18n.js — 다국어 사전 (ko/en)
// Layer 0 (기반) — SNW.CFG 참조만
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    const DICT = {
        // =====================================================
        // 한국어 (기본)
        // =====================================================
        ko: {
            // --- 공통 ---
            'app.title':        'Smart Nature Wind',
            'common.ok':        '확인',
            'common.cancel':    '취소',
            'common.save':      '저장',
            'common.apply':     '적용',
            'common.reset':     '초기화',
            'common.close':     '닫기',
            'common.delete':    '삭제',
            'common.edit':      '편집',
            'common.add':       '추가',
            'common.loading':   '로딩 중...',
            'common.noData':    '데이터 없음',
            'common.error':     '오류',
            'common.warning':   '경고',
            'common.success':   '완료',
            'common.unknown':   '알 수 없음',
            'common.offline':   '오프라인',
            'common.online':    '온라인',
            'common.start':     '시작',
            'common.stop':      '정지',
            'common.undo':      '실행 취소',
            'msg.noProfilesWarn': '등록된 프로필이 없습니다. 프로필 메뉴에서 추가해 주세요.',

            // --- Header/Footer ---
            'header.clock':       '시계',
            'header.wifi':        'Wi-Fi 상태',
            'header.menu':        '메뉴',
            'footer.lastUpdate':  '마지막 업데이트',
            'footer.refresh':     '강제 새로고침',
            'footer.online':      '🟢 실시간 연결',
            'footer.offline':     '🔴 연결 끊김 (재시도 중)',
            'footer.polling':     '🟡 REST 폴링 모드',

            // --- 네비게이션 ---
            'nav.dashboard':   '대시보드',
            'nav.chart':       '실시간 차트',
		'nav.monitor':          '모니터링',
		'monitor.title':        '선풍기 모니터링',
		'monitor.range.5m':     '5분',
		'monitor.range.30m':    '30분',
		'monitor.range.1h':     '1시간',
		'monitor.layer.timeline': '상태 타임라인',
		'monitor.layer.wind':   '풍속 / PWM',
		'monitor.layer.events': '이벤트',
		'monitor.layer.current': '현재 설정',
		'monitor.tab.live':    '실시간',
		'monitor.tab.past':    '지난 이벤트',
		'monitor.csv.download':'CSV 다운로드',


		'chart.tab.live':       '실제 작동 중',
		'chart.tab.preview':    '예상 파형',

		'preview.feel.coolness':   '시원함',
		'preview.feel.smoothness': '부드러움',
		'preview.feel.dynamism':   '역동성',
		'preview.feel.calmness':   '차분함',

            'nav.schedule':    '스케줄',
            'nav.profiles':    '프로필',
            'nav.sensors':     '센서',
            'nav.simulation':  '시뮬레이션',
            'nav.windprofile': '바람 프리셋 관리',
            'nav.settings':    '설정',
            'nav.network':     '네트워크',
            'nav.logs':        '로그',
            'nav.diagnostics': '진단',
            'nav.firmware':    '펌웨어',
            'nav.ai':          'AI',
            'nav.info':        '정보',

            // [P1-6] 네비게이션 그룹
            'nav.groupControl':  '제어',
            'nav.groupSettings': '설정',
            'nav.groupSystem':   '시스템',

            // --- Dashboard ---
            'dashboard.title':          '대시보드',
            'dashboard.realtimeState':  '실시간 상태',
            'dashboard.currentWind':    '현재 풍속',
            'dashboard.targetWind':     '목표 풍속',
            'dashboard.pwmOutput':      'PWM 출력',
            'dashboard.state':          '상태',
            'dashboard.phase':          'Phase',
            'dashboard.sensorTitle':    '센서',
            'dashboard.powerTitle':     '전원 제어',
            'dashboard.powerOn':        '켜기',
            'dashboard.powerOff':       '끄기',
            'dashboard.presetTitle':    '프리셋 선택',
            'dashboard.presetCurrent':  '현재 선택',
            'dashboard.intensityTitle': '강도 조절',
            'dashboard.intensityLabel': '강도',
            'dashboard.physicsTitle':   '바람 세부 조절 (3대 물리 제어)',
            'dashboard.variabilityLabel': '변동성',
            'dashboard.gustLabel':      '돌풍 빈도',
            'dashboard.temp':           '온도',
            'dashboard.humidity':       '습도',
            'dashboard.motion':         '인체감지',
            'dashboard.motionDetected': '감지',
            'dashboard.motionAbsent':   '부재',

            // --- FSM ---
            'fsm.idle':           '대기 중',
            'fsm.override':       '수동 제어 중',
            'fsm.profileRun':     '프로필 실행 중',
            'fsm.scheduleRun':    '스케줄 실행 중',
            'fsm.motionBlocked':  '인체 미감지',
            'fsm.autoOffStopped': '자동 꺼짐',
            'fsm.timeInvalid':    '시간 미동기',

            // --- Reason ---
            'reason.none':              '없음',
            'reason.overrideActive':    '수동 제어 활성',
            'reason.profileMode':       '프로필 모드',
            'reason.userProfileActive': '사용자 프로필 활성',
            'reason.scheduleActive':    '스케줄 활성',
            'reason.noActiveSchedule':  '활성 스케줄 없음',
            'reason.noSchedules':       '스케줄 없음',
            'reason.timeNotValid':      '시간 미동기',
            'reason.motionNoPresence':  '인체 미감지',
            'reason.autoOffTimer':      '설정 시간 완료',
            'reason.autoOffTime':       '예약 종료 시각',
            'reason.autoOffTemp':       '온도 조건 도달',

            // --- Phase ---
            'phase.calm':   '잔잔함',
            'phase.normal': '보통',
            'phase.strong': '강함',

            // --- AutoOff ---
            'autoOff.timer':   '설정 시간 완료',
            'autoOff.time':    '예약 종료 시각',
            'autoOff.temp':    '온도 조건 도달',
            'autoOff.recover': '자동 꺼짐 상태입니다. 다시 켜시겠습니까?',
            'autoOff.ack':     '확인',
            'autoOff.restart': '다시 켜기',
            'autoOff.profile': '프로필 시작',

            // --- 프리셋 ---
            'preset.OCEAN':          '해변 바람',
            'preset.COUNTRY_BREEZE': '시골 바람',
            'preset.MEDITERRANEAN':  '지중해 바람',
            'preset.MOUNTAIN':       '산 바람',
            'preset.PLAINS':         '대평원 바람',
            'preset.HARBOR_BREEZE':  '항구 바람',
            'preset.FOREST_CANOPY':  '숲 그늘 바람',
            'preset.URBAN_SUNSET':   '도시 석양 바람',
            'preset.TROPICAL_RAIN':  '열대 소나기 바람',
            'preset.DESERT_NIGHT':   '사막의 밤 바람',
            'preset.applying':       '적용 중…',
            'preset.applied':        '프리셋 적용 완료',
            'preset.delayed':        '프리셋 적용이 지연되고 있습니다',

            // --- 스타일 ---
            'style.BALANCE': '균형',
            'style.ACTIVE':  '활동적',
            'style.FOCUS':   '집중',
            'style.RELAX':   '휴식',
            'style.SLEEP':   '수면',

            // --- 차트 ---
            'chart.title':    '실시간 물리 차트',
            'chart.wind':     '풍속',
            'chart.target':   '목표',
            'chart.pwm':      'PWM',
            'chart.time':     '시간',
            'chart.export':   'CSV 내보내기',
            'chart.range5':   '5초',
            'chart.range30':  '30초',
            'chart.range120': '120초',

            // --- 로그 ---
            'log.title':  '시스템 로그',
            'log.level':  '레벨',
            'log.none':   'NONE',
            'log.error':  'ERROR',
            'log.warn':   'WARN',
            'log.info':   'INFO',
            'log.debug':  'DEBUG',
            'log.filter': '필터',
            'log.filterAll': '전체',
            'log.clear':  '지우기',
            'log.export': '내보내기',

            // --- 센서 (P0-1 수정: sensors.temp/hum/motion/title 추가) ---
            'sensor.title':       '센서 및 모션',
            'sensor.temperature': '온도',
            'sensor.humidity':    '습도',
            'sensor.motion':      '인체감지',
            'sensor.holdSec':     '유지 시간',
            'sensor.pirFeed':     'PIR 피드 테스트',
            'sensor.dht22':       'DHT22 설정',
            'sensor.pir':         'PIR 설정',

            'sensors.title':          '실시간 센서 상태',
            'sensors.temp':           '온도',
            'sensors.hum':            '습도',
            'sensors.motion':         '인체감지',
            'sensors.pirEnabled':     'PIR 센서 활성화',
            'sensors.pirHoldSec':     'PIR Hold (초)',
            'sensors.feedPir':        'PIR 강제 감지 테스트',
            'sensors.feedPirSuccess': 'PIR 신호 전송 완료',
            'sensors.saveMotionSuccess': '모션 설정 저장 완료',
            'sensors.motionConfig':   '모션 로직 설정 (cfg_motion)',

            // --- PIR 테스트 결과 (O-13) ---
            'pir.testSuccess':        '✅ PIR 감지 → 재실 상태 확인됨',
            'pir.testFail':           '❌ PIR 피드는 전송되었으나 서버가 미감지',
            'pir.holdRemain':         'hold {sec}초',

            // --- 전원 제어 진단 (O-1) ---
            'power.motionBlocked':    '인체 미감지 상태입니다. PIR 센서 앞에서 손을 흔들어주세요.',
            'power.autoOffLatched':   '자동 꺼짐 상태를 해제한 뒤 다시 시도합니다.',
            'power.failed':           '전원 켜기에 실패했습니다: {reason}',
            'power.forceOn':          '강제 켜기',
            'power.ackAndRestart':    '확인 후 재시작',
            'power.ackOnly':          '확인만',

            // --- 배너 (O-5, O-17) ---
            'banner.offline':         '🔴 연결 끊김 · 재연결 중 ({attempt}/{max})',
            'banner.polling':         '🟡 실시간 연결 끊김 · 2초 주기 폴링으로 전환',
            'banner.reconnected':     '🟢 연결 복구됨',
            'banner.motionBlocked':   '🚫 인체 미감지로 정지됨',
            'banner.autoOff':         '🛑 자동 꺼짐 · 사유: {reason}',

            // --- 재접속 안내 (O-9) ---
            'reconnect.title':        '재접속 안내',
            'reconnect.body':         'Wi-Fi를 "NatureWind"(2540)에 연결한 뒤 http://192.168.4.1 로 접속하세요.',

            // --- 스케줄러 ---
            'scheduler.title':      '스케줄 예약',
            'scheduler.enabled':    '활성',
            'scheduler.day':        '요일',
            'scheduler.start':      '시작',
            'scheduler.end':        '종료',
            'scheduler.segment':    '세그먼트',
            'scheduler.on':         '작동',
            'scheduler.off':        '정지',
            'scheduler.overlapWarn':'시간대 겹침이 있습니다',
            'scheduler.scheduledOff': '예약 종료',
            'scheduler.tempOff':    '온도 종료',
            'schedule.segmentRepeat': '세그먼트 반복',
            'schedule.repeatCount': '반복 횟수 (0=무한)',
            'schedule.segmentsTitle': '세그먼트 (바람 구간)',
            'schedule.addSegmentBtn': '+ 세그먼트 추가',
            'schedule.add':         '스케줄 추가',
            'schedule.name':        '이름',
            'schedule.startTime':   '시작',
            'schedule.endTime':     '종료',

            // --- 프로필 ---
            'profile.title':  '사용자 프로필',
            'profile.start':  '시작',
            'profile.stop':   '정지',
            'profile.active': '실행 중',
            'profiles.add':   '프로필 추가',
            'profiles.name':  '이름',
            'profiles.no':    '번호 (No)',
            'profiles.enabled': '활성화 여부',
            'profiles.addSegment': '세그먼트 추가',
            'profiles.autoOffTimer': '자동 꺼짐 타이머(분)',
            'profiles.segmentsTitle': '세그먼트 (바람 구간)',
            'profiles.addSegmentBtn': '+ 세그먼트 추가',

            // --- 시스템 (P0-2: Settings 섹션 헤더 i18n) ---
            'system.title':        '시스템 설정',
            'system.logLevel':     '로그 레벨',
            'system.apiKey':       'API 키',
            'system.geminiKey':    'Gemini API 키',
            'system.save':         '설정 저장',
            'system.reload':       '재로드',
            'system.factoryReset': '공장 초기화',
            'system.reboot':       '재시작',
            'system.hwPinmap':     '하드웨어 핀맵',
            'system.fanCurve':     '팬 커브',

            'settings.title':               '시스템 설정',
            'settings.wsChannel':           'WebSocket 채널',
            'settings.hardware':            'Hardware (PWM / Fan / PIR / DHT / LED)',
            'settings.factoryReset':        '공장 초기화',
            'settings.save':                '저장',
            'settings.reload':              '재로드',
            'settings.configured':          '(설정됨)',
            'settings.notConfigured':       '(미설정)',
            'settings.deleteApiKey':        'API Key 삭제',
            'settings.keyPlaceholderChange':'변경하려면 새 키 입력 (빈칸=유지)',
            'settings.keyPlaceholderInput': '키 입력',
            'settings.wsChannelConfig':     'WebSocket 채널 설정',
            'settings.deleteGeminiKey':     'Gemini 키 삭제',
            'settings.testApiKey':          'API Key 테스트',
            'settings.testApiSuccess':      'API Key 검증 성공',
            'settings.testApiFail':         'API Key 검증 실패: {msg}',
            'settings.reloadRequested':     '재로드 요청됨: {status}',
            'settings.reloadInProgress':    '재로드 진행 중...',
            'settings.reloadFailed':        '재로드 실패 (lastReloadOk=false)',
            'settings.reloadComplete':      '재로드 완료',
            'settings.offlineReloadNotice': '오프라인 모드에서는 reload가 즉시 반환됩니다.',
            'settings.factoryResetConfirm': '정말 공장 초기화 하시겠습니까? 모든 설정이 삭제됩니다.',
            'settings.factoryResetWarning': '⚠️ 경고',
            'settings.factoryResetTitle':   '⚠️ 공장 초기화',
            'settings.factoryResetItems':   '다음 설정이 삭제됩니다:',
            'settings.factoryResetConfirmWord': '확인을 위해 "초기화"를 입력하세요',
            'settings.factoryResetWord':    '초기화',
            'settings.factoryResetSuccess': '기기가 재시작됩니다. Wi-Fi를 "NatureWind"(2540)에 연결한 뒤 http://192.168.4.1 로 접속하세요.',
            'settings.deviceRestarting':    '기기가 재시작됩니다...',

            // [P0-2] Settings 섹션 헤더
            'settings.secMeta':       '메타 / 로깅 / 보안',
            'settings.secFanPwm':     '팬 PWM',
            'settings.secFanCurve':   '팬 커브 (%)',
            'settings.secPir':        'PIR 센서',
            'settings.secDht':        'DHT22 센서',
            'settings.secLed':        '상태 LED',

            // [P0-2] Settings 필드 레이블
            'settings.fieldDeviceName': '기기 이름',
            'settings.fieldLogLevel': '로그 레벨',
            'settings.fieldLogMax':   '로그 최대 개수',
            'settings.fieldPin':      '핀',
            'settings.fieldChannel':  '채널',
            'settings.fieldFreq':     '주파수 (Hz)',
            'settings.fieldRes':      '해상도 (bits)',
            'settings.fieldStart':    '시작',
            'settings.fieldComfortMin': '쾌적 최소',
            'settings.fieldComfortMax': '쾌적 최대',
            'settings.fieldHardMax':  '최대 한계',
            'settings.fieldDebounce': '디바운스 (초)',
            'settings.fieldHold':     '유지 (초)',
            'settings.fieldInterval': '주기 (초)',
            'settings.fieldNumPixels':'픽셀 수',
            'settings.fieldBrightness': '밝기 (0~255)',
            'settings.fieldEnabled':  '활성화',
            'settings.fieldType':     '종류',
            'settings.fieldPinPwm':   'PWM 핀',
            'settings.fieldPinPir':   'PIR 핀',
            'settings.fieldPinDht':   'DHT 핀',
            'settings.fieldPinLed':   'LED 핀',
            'settings.fieldRange':    '{min}~{max}',
            'settings.fieldRecommended': '권장: {range}',
            'settings.saveAndReload': '저장 후 자동 재적용',
            'settings.saveOnly':      '저장만',
            'settings.reloadOnly':    '재적용만',
            'settings.dirtyWarning':  '저장되지 않은 변경이 있습니다. 재적용하면 소실됩니다.',

            // --- 네트워크 ---
            'network.title':        '네트워크 및 시간',
            'network.wifiMode':     'Wi-Fi 모드',
            'network.ssid':         'SSID',
            'network.ip':           'IP',
            'network.rssi':         'RSSI',
            'network.scan':         'Wi-Fi 스캔',
            'network.connect':      '연결',
            'network.ntpServer':    'NTP 서버',
            'network.timezone':     '시간대',
            'network.syncInterval': '동기화 주기',
            'network.apSettings':   'AP 설정',
            'network.staSettings':  'STA 설정',
            'network.addSta':       'STA 추가',
            'network.noStaNotice':  '등록된 Wi-Fi가 없습니다. STA 추가 버튼을 눌러 등록하세요.',
            'network.saveWifi':     'Wi-Fi 설정 저장',
            'network.saveTime':     '시간 설정 저장',
            'network.syncTimeBtn':  '현재 시간 동기화',
            'network.scanWifi':     'Wi-Fi 스캔',
            'network.wifiConfig':   'Wi-Fi 설정 (AP / STA)',
            'network.timeConfig':   '시간 설정',
            'network.status':       '연결 상태',
            'network.mac':          'MAC 주소',
            'network.timeSynced':   '시간 동기화',
            'network.synced':       '완료',
            'network.notSynced':    '미완료',

            // --- 진단 ---
            'diag.title':    '시스템 진단',
            'diag.heap':     'Heap 사용',
            'diag.fs':       '파일시스템',
            'diag.uptime':   '업타임',
            'diag.dirty':    'Dirty Flags',
            'diag.reloadOk': 'Reload 결과',
            'diagnostics.title': '시스템 진단 및 메트릭',
            'diagnostics.metricsRealtime': 'Metrics (실시간)',
            'diagnostics.allJson': '전체 설정 JSON',
            'diagnostics.saveDirty': 'Dirty 설정 저장',
            'diagnostics.saveDirtySuccess': 'Dirty 설정 저장 완료',
            'diagnostics.fetchFail': '설정 조회 실패',

            // --- 펌웨어 ---
            'firmware.title':       '펌웨어 관리',
            'firmware.version':     '현재 버전',
            'firmware.ota':         'OTA 업데이트',
            'firmware.otaUpdate':   'OTA 업데이트',
            'firmware.fileUpload':  '파일 업로드 (LittleFS)',
            'firmware.upload':      '파일 업로드',
            'firmware.uploadBtn':   '업로드',
            'firmware.otaSuccess':  'OTA 완료 (재시작 중)',
            'firmware.progress':    '진행률',
            'firmware.checkUpdate': '업데이트 확인',

            // --- AI ---
            'ai.title':       'AI 어시스턴트',
            'ai.send':        '전송',
            'ai.thinking':    '생각 중...',
            'ai.placeholder': '예: "10분 후 꺼줘" 또는 "지금 상태 진단해줘"',
            'ai.example1':    '예: "10분 후 꺼줘"',
            'ai.example2':    '예: "지금 상태 진단해줘"',
            'ai.example3':    '예: "너무 더운데 시원하게"',

            // --- 시뮬레이션 ---
            'simulation.saveBtn':     '시뮬레이션 설정 저장',
            'simulation.saveSuccess': '시뮬레이션 설정 저장 완료',

            // --- 바람 프리셋 ---
            'windprofile.code':         '코드 (영문)',
            'windprofile.factorsTitle': '기본 바람 파라미터',
            'windprofile.intensity':    '강도',
            'windprofile.variability':  '변동성',
            'windprofile.gust':         '돌풍',
            'windprofile.fanLimit':     '팬한계',
            'windprofile.add':          '프리셋 추가',

            // --- 검증 메시지 (O-7, O-18) ---
            'validate.range':         '{field}은(는) {min}~{max} 범위여야 합니다',
            'validate.required':      '{field}은(는) 필수입니다',
            'validate.multiErrors':   '{count}개 필드 확인 필요',
            'validate.segmentMin':    '최소 1개 세그먼트가 필요합니다',
            'validate.timeOrder':     '종료 시각은 시작 시각 이후여야 합니다',

            // --- Undo (O-8) ---
            'segment.deleted':        '세그먼트 삭제됨',

            // --- 메시지 ---
            'msg.apiKeyRequired': 'API 키가 필요합니다',
            'msg.reloadPending':  '재로드 진행 중입니다',
            'msg.noChange':       '변경 사항 없음',
            'msg.saveSuccess':    '저장되었습니다',
            'msg.saveAndReloadSuccess': '저장 및 재적용 완료',
            'msg.reloadSuccess':  '설정이 적용되었습니다',
            'msg.reloadFail':     '설정 적용 실패',
            'msg.reloadDiscardWarning': '저장하지 않은 변경사항이 소실됩니다. 계속하시겠습니까?',
            'msg.networkError':   '네트워크 오류',
            'msg.timeout':        '요청 시간 초과',
            'msg.unknown':        '알 수 없는 오류가 발생했습니다',
            'msg.accessDenied':   '이 페이지에 접근할 수 없습니다 (레벨 제한)',
            'msg.deleteConfirm':  '정말 삭제하시겠습니까?',

            // --- 단위 ---
            'unit.celsius':   '°C',
            'unit.humidity':  '%',
            'unit.windSpeed': 'm/s',
            'unit.percent':   '%',
            'unit.seconds':   '초',
            'unit.minutes':   '분',
            'unit.ms':        'ms',

            // --- 확장 (기존 페이지 연동) ---
            'dashboard.modeTitle':          '작동 모드 설정',
            'dashboard.modeSchedule':       '◻ 스케줄 자동 모드',
            'dashboard.modeProfile':        '◼ 프로필 수동 모드',
            'dashboard.modeScheduleShort':  '스케줄 모드 (자동)',
            'dashboard.modeProfileShort':   '프로필 모드 (수동)',
            'dashboard.modeSwitchedSchedule': '스케줄 자동 모드로 전환되었습니다.',
            'dashboard.modeSwitchedProfile':  '프로필 수동 모드로 전환되었습니다.',
            'dashboard.selectProfileModal':   '실행할 프로필 선택',
            'dashboard.sch':                '스케줄',
            'dashboard.prof':               '프로필',
            'dashboard.pwm':                'PWM',

            'chart.range5s':                '5초',
            'chart.range30s':               '30초',
            'chart.range120s':              '120초',
            'chart.exportCsv':              'CSV',

            'days.mon': '월', 'days.tue': '화', 'days.wed': '수', 'days.thu': '목',
            'days.fri': '금', 'days.sat': '토', 'days.sun': '일',
            
            'style.NATURAL': '자연풍',
            'style.GUSTY': '돌풍',
            'style.GENTLE': '산들바람',
            'style.CYCLIC': '주기풍',
            'settings.tabGeneral': '일반 / 보안',
            'settings.tabHardware': '하드웨어 / 핀맵',
            'settings.tabComm': '통신 / WS',
            'dashboard.styleTitle': '바람 스타일',
            'schedule.secBasic': '기본 일정',
            'schedule.secSegments': '바람 세그먼트',
            'schedule.secSmart': '스마트 안심 종료 (AutoOff & PIR)',
            'segment.onMinutes': '작동 시간(분)',
            'segment.offMinutes': '정지 시간(분)',
            'segment.mode': '모드',
            'segment.modePreset': '프리셋 모드',
            'segment.modeFixed': '고정풍속 모드',
            'segment.presetSelect': '프리셋 선택',
            'segment.styleSelect': '스타일 선택',
            'segment.fixedSpeed': '고정 풍속(%)',
            'segment.overrideTitle': '⚙️ 고급 물리 설정 (Override 직접 지정)',
            'segment.overrideDesc': '이 세그먼트에서 바람 세부 설정 직접 지정 (Override)',
            'segment.overrideIntensity': '바람 강도 (%)',
            'segment.overrideVariability': '바람 변동성 (%)',
            'segment.overrideGust': '돌풍 빈도 (%)',
            'segment.moveUp': '위로',
            'segment.moveDown': '아래로',
            'segment.summaryPrefix': '세그먼트 ({count}개):'
        },

        // =====================================================
        // English
        // =====================================================
        en: {
            'app.title':        'Smart Nature Wind',
            'common.ok':        'OK',
            'common.cancel':    'Cancel',
            'common.save':      'Save',
            'common.apply':     'Apply',
            'common.reset':     'Reset',
            'common.close':     'Close',
            'common.delete':    'Delete',
            'common.edit':      'Edit',
            'common.add':       'Add',
            'common.loading':   'Loading...',
            'common.noData':    'No data',
            'common.error':     'Error',
            'common.warning':   'Warning',
            'common.success':   'Success',
            'common.unknown':   'Unknown',
            'common.offline':   'Offline',
            'common.online':    'Online',
            'common.start':     'Start',
            'common.stop':      'Stop',
            'common.undo':      'Undo',
            'msg.noProfilesWarn': 'No profiles registered. Please add one in Profiles menu.',

            'header.clock':       'Clock',
            'header.wifi':        'Wi-Fi',
            'header.menu':        'Menu',
            'footer.lastUpdate':  'Last update',
            'footer.refresh':     'Force refresh',
            'footer.online':      '🟢 Live',
            'footer.offline':     '🔴 Disconnected (retrying)',
            'footer.polling':     '🟡 REST polling mode',

            'nav.dashboard':   'Dashboard',
            'nav.chart':       'Chart',
		'nav.monitor':          'Monitor',
		'monitor.title':        'Fan Monitoring',
		'monitor.range.5m':     '5m',
		'monitor.range.30m':    '30m',
		'monitor.range.1h':     '1h',
		'monitor.layer.timeline': 'State Timeline',
		'monitor.layer.wind':   'Wind / PWM',
		'monitor.layer.events': 'Events',
		'monitor.layer.current': 'Current Settings',
		'monitor.tab.live':    'Live',
		'monitor.tab.past':    'Past Events',
		'monitor.csv.download':'Download CSV',


		'chart.tab.live':       'Live Operating',
		'chart.tab.preview':    'Expected Waveform',

		'preview.feel.coolness':   'Coolness',
		'preview.feel.smoothness': 'Smoothness',
		'preview.feel.dynamism':   'Dynamism',
		'preview.feel.calmness':   'Calmness',

            'nav.schedule':    'Schedule',
            'nav.profiles':    'Profiles',
            'nav.sensors':     'Sensors',
            'nav.simulation':  'Simulation',
            'nav.windprofile': 'Wind Presets',
            'nav.settings':    'Settings',
            'nav.network':     'Network',
            'nav.logs':        'Logs',
            'nav.diagnostics': 'Diagnostics',
            'nav.firmware':    'Firmware',
            'nav.ai':          'AI',
            'nav.info':        'Info',

            'nav.groupControl':  'Control',
            'nav.groupSettings': 'Settings',
            'nav.groupSystem':   'System',

            'dashboard.title':          'Dashboard',
            'dashboard.realtimeState':  'Real-time Status',
            'dashboard.currentWind':    'Current Wind',
            'dashboard.targetWind':     'Target Wind',
            'dashboard.pwmOutput':      'PWM Output',
            'dashboard.state':          'State',
            'dashboard.phase':          'Phase',
            'dashboard.sensorTitle':    'Sensors',
            'dashboard.powerTitle':     'Power',
            'dashboard.powerOn':        'On',
            'dashboard.powerOff':       'Off',
            'dashboard.presetTitle':    'Preset',
            'dashboard.presetCurrent':  'Current',
            'dashboard.intensityTitle': 'Intensity',
            'dashboard.intensityLabel': 'Intensity',
            'dashboard.physicsTitle':   'Physics Controls',
            'dashboard.variabilityLabel': 'Variability',
            'dashboard.gustLabel':      'Gust Freq',
            'dashboard.temp':           'Temp',
            'dashboard.humidity':       'Humidity',
            'dashboard.motion':         'Motion',
            'dashboard.motionDetected': 'Detected',
            'dashboard.motionAbsent':   'Absent',

            'fsm.idle':           'Idle',
            'fsm.override':       'Override',
            'fsm.profileRun':     'Profile Running',
            'fsm.scheduleRun':    'Schedule Running',
            'fsm.motionBlocked':  'Motion Blocked',
            'fsm.autoOffStopped': 'Auto Off',
            'fsm.timeInvalid':    'Time Invalid',

            'reason.none':              'None',
            'reason.overrideActive':    'Override Active',
            'reason.profileMode':       'Profile Mode',
            'reason.userProfileActive': 'User Profile Active',
            'reason.scheduleActive':    'Schedule Active',
            'reason.noActiveSchedule':  'No Active Schedule',
            'reason.noSchedules':       'No Schedules',
            'reason.timeNotValid':      'Time Not Valid',
            'reason.motionNoPresence':  'No Presence',
            'reason.autoOffTimer':      'Timer Expired',
            'reason.autoOffTime':       'Scheduled End Time',
            'reason.autoOffTemp':       'Temperature Triggered',

            'phase.calm':   'Calm',
            'phase.normal': 'Normal',
            'phase.strong': 'Strong',

            'autoOff.timer':   'Timer expired',
            'autoOff.time':    'Scheduled end time',
            'autoOff.temp':    'Temperature threshold',
            'autoOff.recover': 'Auto Off triggered. Turn on again?',
            'autoOff.ack':     'Acknowledge',
            'autoOff.restart': 'Turn On Again',
            'autoOff.profile': 'Start Profile',

            'preset.OCEAN':          'Ocean Breeze',
            'preset.COUNTRY_BREEZE': 'Country Breeze',
            'preset.MEDITERRANEAN':  'Mediterranean',
            'preset.MOUNTAIN':       'Mountain',
            'preset.PLAINS':         'Plains',
            'preset.HARBOR_BREEZE':  'Harbor Breeze',
            'preset.FOREST_CANOPY':  'Forest Canopy',
            'preset.URBAN_SUNSET':   'Urban Sunset',
            'preset.TROPICAL_RAIN':  'Tropical Rain',
            'preset.DESERT_NIGHT':   'Desert Night',
            'preset.applying':       'Applying...',
            'preset.applied':        'Preset applied',
            'preset.delayed':        'Preset application delayed',

            'style.BALANCE': 'Balance',
            'style.ACTIVE':  'Active',
            'style.FOCUS':   'Focus',
            'style.RELAX':   'Relax',
            'style.SLEEP':   'Sleep',

            'chart.title':    'Live Chart',
            'chart.wind':     'Wind',
            'chart.target':   'Target',
            'chart.pwm':      'PWM',
            'chart.time':     'Time',
            'chart.export':   'Export CSV',
            'chart.range5':   '5s',
            'chart.range30':  '30s',
            'chart.range120': '120s',

            'log.title':  'System Logs',
            'log.level':  'Level',
            'log.none':   'NONE',
            'log.error':  'ERROR',
            'log.warn':   'WARN',
            'log.info':   'INFO',
            'log.debug':  'DEBUG',
            'log.filter': 'Filter',
            'log.filterAll': 'All',
            'log.clear':  'Clear',
            'log.export': 'Export',

            'sensor.title':       'Sensors & Motion',
            'sensor.temperature': 'Temperature',
            'sensor.humidity':    'Humidity',
            'sensor.motion':      'Motion',
            'sensor.holdSec':     'Hold time',
            'sensor.pirFeed':     'PIR Feed Test',
            'sensor.dht22':       'DHT22 Config',
            'sensor.pir':         'PIR Config',

            'sensors.title':          'Live Sensor Status',
            'sensors.temp':           'Temperature',
            'sensors.hum':            'Humidity',
            'sensors.motion':         'Motion',
            'sensors.pirEnabled':     'Enable PIR Sensor',
            'sensors.pirHoldSec':     'PIR Hold (sec)',
            'sensors.feedPir':        'Force PIR Trigger',
            'sensors.feedPirSuccess': 'PIR signal sent successfully',
            'sensors.saveMotionSuccess': 'Motion settings saved successfully',
            'sensors.motionConfig':   'Motion Logic Config (cfg_motion)',

            'pir.testSuccess':        '✅ PIR detected → presence confirmed',
            'pir.testFail':           '❌ PIR feed sent but server did not detect',
            'pir.holdRemain':         'hold {sec}s',

            'power.motionBlocked':    'No motion detected. Wave your hand in front of the PIR sensor.',
            'power.autoOffLatched':   'Clearing Auto-Off latch and retrying.',
            'power.failed':           'Failed to power on: {reason}',
            'power.forceOn':          'Force On',
            'power.ackAndRestart':    'Ack & Restart',
            'power.ackOnly':          'Ack Only',

            'banner.offline':         '🔴 Disconnected · Reconnecting ({attempt}/{max})',
            'banner.polling':         '🟡 Live connection lost · Switched to 2s polling',
            'banner.reconnected':     '🟢 Reconnected',
            'banner.motionBlocked':   '🚫 Stopped due to no presence',
            'banner.autoOff':         '🛑 Auto-Off · Reason: {reason}',

            'reconnect.title':        'Reconnect Guide',
            'reconnect.body':         'Connect Wi-Fi to "NatureWind" (2540) and visit http://192.168.4.1.',

            'scheduler.title':      'Scheduler',
            'scheduler.enabled':    'Enabled',
            'scheduler.day':        'Day',
            'scheduler.start':      'Start',
            'scheduler.end':        'End',
            'scheduler.segment':    'Segment',
            'scheduler.on':         'On',
            'scheduler.off':        'Off',
            'scheduler.overlapWarn':'Time overlap detected',
            'scheduler.scheduledOff': 'Scheduled Off',
            'scheduler.tempOff':    'Temperature Off',
            'schedule.segmentRepeat': 'Segment Repeat',
            'schedule.repeatCount': 'Repeat Count (0=infinite)',
            'schedule.segmentsTitle': 'Segments (Wind Intervals)',
            'schedule.addSegmentBtn': '+ Add Segment',
            'schedule.add':         'Add Schedule',
            'schedule.name':        'Name',
            'schedule.startTime':   'Start',
            'schedule.endTime':     'End',

            'profile.title':  'User Profiles',
            'profile.start':  'Start',
            'profile.stop':   'Stop',
            'profile.active': 'Running',
            'profiles.add':   'Add Profile',
            'profiles.name':  'Name',
            'profiles.no':    'No',
            'profiles.enabled': 'Enabled',
            'profiles.addSegment': 'Add Segment',
            'profiles.autoOffTimer': 'Auto-off Timer (min)',
            'profiles.segmentsTitle': 'Segments (Wind Intervals)',
            'profiles.addSegmentBtn': '+ Add Segment',

            'system.title':        'System Settings',
            'system.logLevel':     'Log Level',
            'system.apiKey':       'API Key',
            'system.geminiKey':    'Gemini API Key',
            'system.save':         'Save Settings',
            'system.reload':       'Reload',
            'system.factoryReset': 'Factory Reset',
            'system.reboot':       'Reboot',
            'system.hwPinmap':     'HW Pinmap',
            'system.fanCurve':     'Fan Curve',

            'settings.title':               'System Settings',
            'settings.wsChannel':           'WebSocket Channels',
            'settings.hardware':            'Hardware (PWM / Fan / PIR / DHT / LED)',
            'settings.factoryReset':        'Factory Reset',
            'settings.save':                'Save',
            'settings.reload':              'Reload',
            'settings.configured':          '(Configured)',
            'settings.notConfigured':       '(Not Configured)',
            'settings.deleteApiKey':        'Delete API Key',
            'settings.keyPlaceholderChange':'Enter new key to change (blank=keep)',
            'settings.keyPlaceholderInput': 'Enter key',
            'settings.wsChannelConfig':     'WebSocket Channel Settings',
            'settings.deleteGeminiKey':     'Delete Gemini Key',
            'settings.testApiKey':          'Test API Key',
            'settings.testApiSuccess':      'API Key verified successfully',
            'settings.testApiFail':         'API Key verification failed: {msg}',
            'settings.reloadRequested':     'Reload requested: {status}',
            'settings.reloadInProgress':    'Reload in progress...',
            'settings.reloadFailed':        'Reload failed (lastReloadOk=false)',
            'settings.reloadComplete':      'Reload complete',
            'settings.offlineReloadNotice': 'In offline mode, reload returns immediately.',
            'settings.factoryResetConfirm': 'Are you sure you want to factory reset? All settings will be deleted.',
            'settings.factoryResetWarning': '⚠️ Warning',
            'settings.factoryResetTitle':   '⚠️ Factory Reset',
            'settings.factoryResetItems':   'The following will be deleted:',
            'settings.factoryResetConfirmWord': 'Type "reset" to confirm',
            'settings.factoryResetWord':    'reset',
            'settings.factoryResetSuccess': 'Device is restarting. Connect Wi-Fi to "NatureWind" (2540) and visit http://192.168.4.1.',
            'settings.deviceRestarting':    'Device is restarting...',

            'settings.secMeta':       'Meta / Logging / Security',
            'settings.secFanPwm':     'Fan PWM',
            'settings.secFanCurve':   'Fan Curve (%)',
            'settings.secPir':        'PIR Sensor',
            'settings.secDht':        'DHT22 Sensor',
            'settings.secLed':        'Status LED',

            'settings.fieldDeviceName': 'Device Name',
            'settings.fieldLogLevel': 'Log Level',
            'settings.fieldLogMax':   'Log Max Entries',
            'settings.fieldPin':      'Pin',
            'settings.fieldChannel':  'Channel',
            'settings.fieldFreq':     'Frequency (Hz)',
            'settings.fieldRes':      'Resolution (bits)',
            'settings.fieldStart':    'Start',
            'settings.fieldComfortMin': 'Comfort Min',
            'settings.fieldComfortMax': 'Comfort Max',
            'settings.fieldHardMax':  'Hard Max',
            'settings.fieldDebounce': 'Debounce (sec)',
            'settings.fieldHold':     'Hold (sec)',
            'settings.fieldInterval': 'Interval (sec)',
            'settings.fieldNumPixels':'Num Pixels',
            'settings.fieldBrightness': 'Brightness (0~255)',
            'settings.fieldEnabled':  'Enabled',
            'settings.fieldType':     'Type',
            'settings.fieldPinPwm':   'PWM Pin',
            'settings.fieldPinPir':   'PIR Pin',
            'settings.fieldPinDht':   'DHT Pin',
            'settings.fieldPinLed':   'LED Pin',
            'settings.fieldRange':    '{min}~{max}',
            'settings.fieldRecommended': 'Recommended: {range}',
            'settings.saveAndReload': 'Save & Auto-Reload',
            'settings.saveOnly':      'Save Only',
            'settings.reloadOnly':    'Reload Only',
            'settings.dirtyWarning':  'Unsaved changes exist. Reloading will discard them.',

            'network.title':        'Network & Time',
            'network.wifiMode':     'Wi-Fi Mode',
            'network.ssid':         'SSID',
            'network.ip':           'IP',
            'network.rssi':         'RSSI',
            'network.scan':         'Scan Wi-Fi',
            'network.connect':      'Connect',
            'network.ntpServer':    'NTP Server',
            'network.timezone':     'Timezone',
            'network.syncInterval': 'Sync Interval',
            'network.apSettings':   'AP Settings',
            'network.staSettings':  'STA Settings',
            'network.addSta':       'Add STA',
            'network.noStaNotice':  'No Wi-Fi networks registered. Click Add STA to add one.',
            'network.saveWifi':     'Save Wi-Fi Settings',
            'network.saveTime':     'Save Time Settings',
            'network.syncTimeBtn':  'Sync Current Time',
            'network.scanWifi':     'Wi-Fi Scan',
            'network.wifiConfig':   'Wi-Fi Settings (AP / STA)',
            'network.timeConfig':   'Time Settings',
            'network.status':       'Connection Status',
            'network.mac':          'MAC Address',
            'network.timeSynced':   'Time Sync',
            'network.synced':       'Synced',
            'network.notSynced':    'Not Synced',

            'diag.title':    'Diagnostics',
            'diag.heap':     'Heap',
            'diag.fs':       'File System',
            'diag.uptime':   'Uptime',
            'diag.dirty':    'Dirty Flags',
            'diag.reloadOk': 'Reload Result',
            'diagnostics.title': 'System Diagnostics & Metrics',
            'diagnostics.metricsRealtime': 'Metrics (Realtime)',
            'diagnostics.allJson': 'Full Config JSON',
            'diagnostics.saveDirty': 'Save Dirty Configs',
            'diagnostics.saveDirtySuccess': 'Dirty settings saved successfully',
            'diagnostics.fetchFail': 'Failed to query config',

            'firmware.title':       'Firmware',
            'firmware.version':     'Current Version',
            'firmware.ota':         'OTA Update',
            'firmware.otaUpdate':   'OTA Update',
            'firmware.fileUpload':  'File Upload (LittleFS)',
            'firmware.upload':      'Upload File',
            'firmware.uploadBtn':   'Upload',
            'firmware.otaSuccess':  'OTA Complete (Restarting)',
            'firmware.progress':    'Progress',
            'firmware.checkUpdate': 'Check Update',

            'ai.title':       'AI Assistant',
            'ai.send':        'Send',
            'ai.thinking':    'Thinking...',
            'ai.placeholder': 'e.g., "Turn off in 10 minutes" or "Diagnose now"',
            'ai.example1':    'e.g., "Turn off in 10 minutes"',
            'ai.example2':    'e.g., "Diagnose now"',
            'ai.example3':    'e.g., "It\'s hot, cool me down"',

            'simulation.saveBtn':     'Save Simulation Settings',
            'simulation.saveSuccess': 'Simulation settings saved successfully',

            'windprofile.code':         'Code (Alpha)',
            'windprofile.factorsTitle': 'Basic Wind Parameters',
            'windprofile.intensity':    'Intensity',
            'windprofile.variability':  'Variability',
            'windprofile.gust':         'Gust',
            'windprofile.fanLimit':     'Fan Limit',
            'windprofile.add':          'Add Preset',

            'validate.range':         '{field} must be in {min}~{max}',
            'validate.required':      '{field} is required',
            'validate.multiErrors':   '{count} field(s) need attention',
            'validate.segmentMin':    'At least 1 segment is required',
            'validate.timeOrder':     'End time must be after start time',

            'segment.deleted':        'Segment deleted',

            'msg.apiKeyRequired': 'API Key required',
            'msg.reloadPending':  'Reload in progress',
            'msg.noChange':       'No changes',
            'msg.saveSuccess':    'Saved',
            'msg.saveAndReloadSuccess': 'Saved and reloaded',
            'msg.reloadSuccess':  'Settings applied',
            'msg.reloadFail':     'Failed to apply settings',
            'msg.reloadDiscardWarning': 'Unsaved changes will be discarded. Continue?',
            'msg.networkError':   'Network error',
            'msg.timeout':        'Timeout',
            'msg.unknown':        'Unknown error',
            'msg.accessDenied':   'Access denied (level restricted)',
            'msg.deleteConfirm':  'Are you sure you want to delete?',

            'unit.celsius':   '°C',
            'unit.humidity':  '%',
            'unit.windSpeed': 'm/s',
            'unit.percent':   '%',
            'unit.seconds':   's',
            'unit.minutes':   'm',
            'unit.ms':        'ms',

            'dashboard.modeTitle':          'Operation Mode',
            'dashboard.modeSchedule':       '◻ Schedule Auto Mode',
            'dashboard.modeProfile':        '◼ Profile Manual Mode',
            'dashboard.modeScheduleShort':  'Schedule Mode (Auto)',
            'dashboard.modeProfileShort':   'Profile Mode (Manual)',
            'dashboard.modeSwitchedSchedule': 'Switched to schedule auto mode.',
            'dashboard.modeSwitchedProfile':  'Switched to profile manual mode.',
            'dashboard.selectProfileModal':   'Select Profile to Run',
            'dashboard.sch':                'Schedule',
            'dashboard.prof':               'Profile',
            'dashboard.pwm':                'PWM',

            'chart.range5s':                '5s',
            'chart.range30s':               '30s',
            'chart.range120s':              '120s',
            'chart.exportCsv':              'CSV',

            'days.mon': 'Mon', 'days.tue': 'Tue', 'days.wed': 'Wed', 'days.thu': 'Thu',
            'days.fri': 'Fri', 'days.sat': 'Sat', 'days.sun': 'Sun',
            
            'style.NATURAL': 'Natural',
            'style.GUSTY': 'Gusty',
            'style.GENTLE': 'Gentle',
            'style.CYCLIC': 'Cyclic',
            'settings.tabGeneral': 'General / Security',
            'settings.tabHardware': 'Hardware / Pinmap',
            'settings.tabComm': 'Comm / WS',
            'dashboard.styleTitle': 'Wind Style',
            'schedule.secBasic': 'Basic Schedule',
            'schedule.secSegments': 'Wind Segments',
            'schedule.secSmart': 'Smart Auto Off (AutoOff & PIR)',
            'segment.onMinutes': 'On Duration (min)',
            'segment.offMinutes': 'Off Duration (min)',
            'segment.mode': 'Mode',
            'segment.modePreset': 'Preset Mode',
            'segment.modeFixed': 'Fixed Speed Mode',
            'segment.presetSelect': 'Select Preset',
            'segment.styleSelect': 'Select Style',
            'segment.fixedSpeed': 'Fixed Speed (%)',
            'segment.overrideTitle': '⚙️ Advanced Physics (Direct Override)',
            'segment.overrideDesc': 'Directly specify wind physics for this segment (Override)',
            'segment.overrideIntensity': 'Wind Intensity (%)',
            'segment.overrideVariability': 'Wind Variability (%)',
            'segment.overrideGust': 'Gust Frequency (%)',
            'segment.moveUp': 'Move Up',
            'segment.moveDown': 'Move Down',
            'segment.summaryPrefix': 'Segments ({count}):'
        }
    };

    const SUPPORTED_LANGS = ['ko', 'en'];
    let currentLang = (function() {
        try {
            const v = localStorage.getItem(SNW.CFG.LS_KEY.LANG);
            return SUPPORTED_LANGS.includes(v) ? v : 'ko';
        } catch { return 'ko'; }
    })();

    SNW.I18n = {
        getLang() { return currentLang; },
        setLang(lang) {
            if (!SUPPORTED_LANGS.includes(lang)) return;
            currentLang = lang;
            try { localStorage.setItem(SNW.CFG.LS_KEY.LANG, lang); } catch {}
            document.documentElement.lang = lang;
            document.dispatchEvent(new CustomEvent('snw:langchange', { detail: { lang } }));
        },
        t(key, params) {
            const dict = DICT[currentLang] || DICT.ko;
            let s = dict[key] != null ? dict[key] : (DICT.ko[key] != null ? DICT.ko[key] : key);
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
            (root || document).querySelectorAll('[data-i18n-attr]').forEach(el => {
                el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
                    const [attr, k] = pair.split(':').map(s => s.trim());
                    if (attr && k && this.hasKey(k)) el.setAttribute(attr, this.t(k));
                });
            });
        }
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
// Layer 1 (유틸) — 0202_007 설계 기반
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


/* ---- 040.api.js (13308 bytes) ---- */
// =========================================================
// 040.api.js — SNW.Api (REST 클라이언트)
// Layer 2 (서비스) — Layer 0~1 참조
//  - 모든 REST 호출은 이 모듈 경유 (fetch 직접 호출 금지)
//  - 타임아웃 / 401 처리 / 에러 파싱 / in-flight dedupe
//  - 업로드 진행률 (XHR)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
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
		} catch {}
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
	            return { wifi: { state: {
	                mode: 2, mode_name: 'AP+STA (Offline)', status: 'CONNECTED',
	                ssid: '(offline)', ip: '192.168.4.1', mac: 'AA:BB:CC:DD:EE:FF',
	                rssi: -50, hostname: 'naturewind-offline', connected: false,
	                timeSynced: false, reconnectAttempts: 0
	            }}};
	        }
	        // Wi-Fi 설정 (cache 우선)
	        if (path.includes('/wifi/config')) {
	            return cache.wifi || { wifi: {
	                wifiMode: 2, ap: { ssid: "NatureWind", pass: "2540" },
	                sta: [{ ssid: "HomeWiFi_5G", pass: "12345678" }, { ssid: "Office_AP", pass: "admin1234" }]
	            }};
	        }
	        if (path.includes('/wifi/scan')) {
	            return { wifi: { scan: [
	                { ssid: "TestWiFi1", rssi: -45, enc: "WPA2" },
	                { ssid: "TestWiFi2", rssi: -70, enc: "OPEN" }
	            ]}};
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
	        if (path.includes('/windProfile')) return cache.windDict || { windDict: { presets: [] } };
	        if (path.includes('/logs')) return { logs: [{ ts:0, lv:3, msg:'[Offline]' }] };
	        if (path.includes('/diag')) return { heap: 120000, fs_used: 160000, fs_total: 1000000 };
	        if (path.includes('/version')) return { fw:'FW_Ver_2.0.2' };
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
		
		// --- 제어 (v0202) ---
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
			return _fetch(SNW.CFG.API.overrideParams, { method: 'POST', body });
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


/* ---- 060.store.js (3181 bytes) ---- */
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


/* ---- 070.router.js (7917 bytes) ---- */
// =========================================================
// 070.router.js — SNW.Router (해시 SPA 라우터)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    
    const ROUTES = {
        '/dashboard':   { page:'dashboard',   level:'L1' },
        '/chart':       { page:'chart',       level:'L2' },
        '/schedule':    { page:'schedule',    level:'L2' },
        '/profiles':    { page:'profiles',    level:'L2' },
        '/sensors':     { page:'sensors',     level:'L2' },
        '/simulation':  { page:'simulation',  level:'L2' },
        '/windprofile': { page:'windprofile', level:'L3' },
        '/settings':    { page:'settings',    level:'L3' },
        '/network':     { page:'network',     level:'L3' },
        '/logs':        { page:'logs',        level:'L3' },
        '/diagnostics': { page:'diagnostics', level:'L4' },
        '/firmware':    { page:'firmware',    level:'L4' },
        '/ai':          { page:'ai',          level:'L4' },
        '/info':        { page:'info',        level:'L1' }
    };
    
    const NAV_GROUPS = [
        {
            key: 'nav.groupControl',
            items: [
                { path:'/dashboard',   key:'nav.dashboard',   icon:'📊', minLevel:'L1' },
                { path:'/chart',       key:'nav.chart',       icon:'📈', minLevel:'L2' },
                { path:'/schedule',    key:'nav.schedule',    icon:'📅', minLevel:'L2' },
                { path:'/profiles',    key:'nav.profiles',    icon:'👤', minLevel:'L2' },
                { path:'/sensors',     key:'nav.sensors',     icon:'🌡', minLevel:'L2' }
            ]
        },
        {
            key: 'nav.groupSettings',
            items: [
                { path:'/simulation',  key:'nav.simulation',  icon:'🌊', minLevel:'L2' },
                { path:'/windprofile', key:'nav.windprofile', icon:'🌬', minLevel:'L3' },
                { path:'/settings',    key:'nav.settings',    icon:'⚙',  minLevel:'L3' },
                { path:'/network',     key:'nav.network',     icon:'📶', minLevel:'L3' }
            ]
        },
        {
            key: 'nav.groupSystem',
            items: [
                { path:'/logs',        key:'nav.logs',        icon:'📜', minLevel:'L3' },
                { path:'/diagnostics', key:'nav.diagnostics', icon:'🔧', minLevel:'L4' },
                { path:'/firmware',    key:'nav.firmware',    icon:'💾', minLevel:'L4' },
                { path:'/ai',          key:'nav.ai',          icon:'🤖', minLevel:'L4' },
                { path:'/info',        key:'nav.info',        icon:'ℹ',  minLevel:'L1' }
            ]
        }
    ];
    
    let currentPage = null;
    let currentPath = null;
    let _dispatching = false;
    
    function capitalize(s) {
        if (s === 'ai') return 'AI';
        if (s === 'windprofile') return 'Windprofile';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function parseHash() {
        const raw = location.hash.replace(/^#/, '') || '/dashboard';
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

            currentPage = new PageClass(main);
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


/* ===== LAYER 1 ===== */

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


/* ---- 110.ui.slider.js (3823 bytes) ---- */
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


/* ---- 130.ui.form.js (17133 bytes) ---- */
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
        
        // [U-010] cfg_windDict_0202.json 10개 프리셋 코드와 1:1 매칭
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

                card.addEventListener('mouseenter', () => {
                    const cv = card.querySelector('.snw-preset-card__spark');
                    if (!cv) return;
                    if (cv.dataset.drawn === '1') { cv.style.display = 'block'; return; }
                    const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
                    if (SNW.Preview && SNW.Preview.generate) {
                        const preview = SNW.Preview.generate(it.code, styleCode, null);
                        if (preview && preview.points) {
                            _drawSpark(cv, preview.points);
                            cv.dataset.drawn = '1';
                            cv.style.display = 'block';
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

/* ---- 135.util.preview.js (8839 bytes) ---- */
// =========================================================
// 135.util.preview.js — SNW.Preview (가상 미리보기 엔진 + 정성 라벨)
// Layer 1 (유틸) — 998.offline의 resolvePreset 재활용
// [SIM-2] 30초 파형 시뮬레이션 (프론트 간이 엔진, ±10% 오차 명시)
// [SIM-8] "느낌" 5점 정성 라벨 (시원함/부드러움/역동성)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.Preview = {
        // ---------------------------------------------
        // [SIM-2] 30초 파형 시뮬레이션
        //  - preset × style factor 계산 (백엔드 S20 미러)
        //  - 100ms 해상도로 300개 포인트 생성
        // ---------------------------------------------
        generate(presetCode, styleCode, override) {
            const presets = SNW.Store.get()._presetsCache || [];
            const styles = SNW.Store.get()._stylesCache || [];
            const p = presets.find(x => x.code === presetCode);
            const s = styles.find(x => x.code === (styleCode || 'BALANCE'));
            if (!p || !s) return null;

            const pf = p.factors || {};
            const sf = s.factors || {};
            const ov = override || { enabled: false };

            const mul = (base, f, ovr) => {
                if (ov.enabled && ovr != null && ovr >= 0) return ovr;
                return (base ?? 50) * (f ?? 1);
            };

            const intensity = Math.max(0, Math.min(100,
                mul(pf.windIntensity, sf.intensityFactor, ov.windIntensity)));
            const variability = Math.max(0, Math.min(100,
                mul(pf.windVariability, sf.variabilityFactor, ov.windVariability)));
            const gustFreq = Math.max(0, Math.min(100,
                mul(pf.gustFrequency, sf.gustFactor, ov.gustFrequency)));

            const baseMin = pf.baseMinWind ?? 1.8;
            const baseMax = pf.baseMaxWind ?? 5.5;
            const avg = baseMin + (baseMax - baseMin) * (intensity / 100);
            const turbAmp = (variability / 100) * (baseMax - baseMin) * 0.3;
            const gustProb = (gustFreq / 100) * 0.03;  // 100ms당 3% × gustFreq%
            const gustMul = pf.gustStrengthMax ?? 2.0;

            const points = [];
            let gustActive = false;
            let gustRemain = 0;

            for (let i = 0; i < 300; i++) {  // 30초 × 10Hz
                const t = i * 100;
                // 난류 (sin 합성, 3개 주파수)
                const turb = Math.sin(t * 0.002) * turbAmp * 0.5
                    + Math.sin(t * 0.0071) * turbAmp * 0.3
                    + Math.sin(t * 0.0137) * turbAmp * 0.2;

                // 돌풍 발생
                if (!gustActive && Math.random() < gustProb) {
                    gustActive = true;
                    gustRemain = 5 + Math.floor(Math.random() * 20);  // 0.5~2.5초
                }

                let gustBoost = 0;
                if (gustActive) {
                    gustBoost = avg * (gustMul - 1) * 0.7;
                    if (--gustRemain <= 0) gustActive = false;
                }

                const wind = Math.max(0.2, Math.min(11.0, avg + turb + gustBoost));
                points.push({
                    t,
                    wind: Number(wind.toFixed(2)),
                    avg: Number(avg.toFixed(2)),
                    gust: gustBoost > 0,
                    intensity, variability, gustFreq
                });
            }
            return { points, avg, intensity, variability, gustFreq };
        },

        // ---------------------------------------------
        // [SIM-8] 정성 라벨 (시원함/부드러움/역동성 0~5)
        // ---------------------------------------------
        toFeelings(intensity, variability, gustFreq) {
            const clamp = v => Math.max(0, Math.min(5, Math.round(v)));
            return {
                coolness: clamp(intensity / 20),                    // 시원함
                smoothness: clamp(5 - variability / 20),             // 부드러움 (변동성 반비례)
                dynamism: clamp((variability + gustFreq) / 40),    // 역동성
                calmness: clamp(5 - (intensity + gustFreq) / 40)   // 차분함
            };
        },

        // ---------------------------------------------
        // 라벨 → i18n 문자열
        // ---------------------------------------------
        labelFor(key) {
            return SNW.I18n.t('preview.feel.' + key);
        },
        // ---------------------------------------------
        // [SIM-5] 세그먼트 미리보기 (세그먼트의 preset/style/override로 파형)
        // ---------------------------------------------
        segmentPreview(segment) {
            if (!segment) return null;
            if (segment.mode === 'FIXED') {
                const speed = Number(segment.fixedSpeed) || 0;
                const points = [];
                for (let i = 0; i < 300; i++) {
                    points.push({
                        t: i * 100, wind: speed / 10, avg: speed / 10, gust: false,
                        intensity: speed, variability: 0, gustFreq: 0
                    });
                }
                return { points, avg: speed / 10, intensity: speed, variability: 0, gustFreq: 0, fixedMode: true };
            }
            const ovr = segment.override || { enabled: false };
            return this.generate(
                segment.presetCode || 'OCEAN',
                segment.styleCode  || 'BALANCE',
                ovr.enabled ? ovr : null
            );
        },

        showModal(segData) {
            const pv = this.segmentPreview(segData);
            if (!pv) return;
            const content = document.createElement('div');
            content.innerHTML = `
                <canvas data-seg-pv width="500" height="160"
                        style="width:100%;background:var(--snw-bg-2);border-radius:6px;"></canvas>
                <div style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);">
                    🎬 예상 파형 (±10% 오차) ·
                    <b>${segData.mode === 'FIXED' ? '고정 ' + segData.fixedSpeed + '%' : (segData.presetCode || 'OCEAN') + ' · ' + (segData.styleCode || 'BALANCE')}</b>
                </div>
                <div style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);">
                    평균 ${pv.avg} m/s · 강도 ${Math.round(pv.intensity)}% ·
                    변동 ${Math.round(pv.variability)}% · 돌풍 ${Math.round(pv.gustFreq)}%
                </div>
            `;
            SNW.UI.modal('🎬 세그먼트 미리보기', content, () => true, null,
                         { okLabel: '닫기', hideCancel: true, width: '540px' });
            this._animate(content.querySelector('[data-seg-pv]'), pv.points);
        },

        _animate(canvas, points) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            let min = Infinity, max = -Infinity;
            points.forEach(p => { if (p.wind < min) min = p.wind; if (p.wind > max) max = p.wind; });
            if (max <= min) max = min + 1;
            let drawn = 0;
            const drawNext = () => {
                if (drawn >= points.length || !canvas.isConnected) return;
                ctx.clearRect(0, 0, w, h);
                ctx.strokeStyle = 'rgba(139,148,158,0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = (h / 4) * i;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(74,158,255,1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= drawn; i++) {
                    const p = points[i];
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.wind - min) / (max - min)) * (h - 20) - 10;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
                for (let i = 0; i <= drawn; i++) {
                    if (!points[i].gust) continue;
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((points[i].wind - min) / (max - min)) * (h - 20) - 10;
                    ctx.fillStyle = 'rgba(240,136,62,0.9)';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                drawn += 3;
                setTimeout(drawNext, 30);
            };
            drawNext();
        },

    };
})(window.SNW);



/* ===== LAYER 2 ===== */

/* ---- 200.page.dashboard.js (36415 bytes) ---- */
// =========================================================
// 200.page.dashboard.js — SNW.Page.Dashboard
// Layer 4 (페이지 로직)
// [O-1] 전원 켜기 3중 함정 진단
// [O-2] 슬라이더 WS 덮어쓰기 방지 (낙관적 잠금)
// [O-3] 프로필 모달 취소 시 롤백
// [O-6] 프리셋 적용 WS 확인
// [O-15] 배너로 AutoOff/모션 표시
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Dashboard = class Dashboard {
        constructor(container) {
            this.el = container;
            this._unsubs = [];
            this._wsUnsubs = [];
            this._timers = [];
            this.components = {};
            this._active = true;
            this._pendingIntensity = null;
            this._pendingPreset = null;
            this._pendingPowerToggle = false;
        }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.dashboard());
            SNW.I18n.applyTo(this.el);
            
            // [C-2] 컴포넌트를 먼저 마운트 → 데이터 주입 순서 보장
            this._mountComponents();
            
            try {
                const [stateData, profileData] = await Promise.all([
                    SNW.Api.getState(),
                    SNW.Api.listWindProfiles().catch(() => null)
                ]);
                if (!this._active) return;
                this._applyInitialState(stateData);
                if (profileData) {
                    this._profileData = profileData;
                    this._applyPresetList(profileData);
                }
            } catch (e) {
                if (this._active) SNW.LogUtil.warn('[Dashboard] 초기 로드 실패', e);
            }
            
            const onLangChange = () => {
                if (this._active && this._profileData) {
                    this._applyPresetList(this._profileData);
                }
            };
            document.addEventListener('snw:langchange', onLangChange);
            this._unsubs.push(() => document.removeEventListener('snw:langchange', onLangChange));

            this._bindStore();
            this._bindModeSwitch();
            this._startClock();
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
            this._timers.forEach(id => { clearInterval(id); clearTimeout(id); });
            this._unsubs = [];
            this._wsUnsubs = [];
            this._timers = [];
            // [O-15] 페이지 이탈 시 배너 정리
            if (SNW.Banner) SNW.Banner.hide();
        }
        
        _applyInitialState(data) {
            if (!data) return;
            const ctl = data.control || null;
            const sim = data.sim || null;
            SNW.Store.set({
                control: ctl,
                sim,
                time: ctl && ctl.time,
                system: ctl && ctl.system,
                fsmState: (ctl && ctl.stateCode != null) ? ctl.stateCode : 0,
                fsmReason: (ctl && ctl.reasonCode != null) ? ctl.reasonCode : 0,
                lastUpdateMs: Date.now()
            });
        }
        
        _applyPresetList(profileData) {
            const presets = (profileData && profileData.windDict && profileData.windDict.presets) || [];
            const order = SNW.C.PRESET_DISPLAY_ORDER;
            const indexed = presets.map(p => ({ p, i: order.indexOf(p.code) }));
            indexed.sort((a, b) => {
                const ai = a.i < 0 ? 9999 : a.i;
                const bi = b.i < 0 ? 9999 : b.i;
                return ai - bi;
            });
            const items = indexed.map(({ p }) => ({
                code: p.code,
                name: SNW.I18n.t('preset.' + p.code) || p.name || p.code
            }));
            if (this.components.presets) this.components.presets.setItems(items);
        }
        
        _mountComponents() {
            const q = sel => this.el.querySelector(sel);
            this.components.badge = SNW.UI.stateBadge(q('[data-slot="badge"]'));
            this.components.gauge = SNW.UI.gauge(q('[data-slot="gauge"]'));
            this.components.sensors = SNW.UI.sensorCards(q('[data-slot="sensors"]'));
            this.components.toggle = SNW.UI.toggle({
                root: q('[data-slot="power"]'),
                on: false,
                onToggle: next => this._onPowerToggle(next)
            });
            this.components.sliderIntensity = SNW.UI.slider({
                root: q('[data-slot="intensity"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.intensity,
                label: SNW.I18n.t('dashboard.intensityLabel'),
                unit: '%',
                feedbackFn: val => (SNW.Feedback ? SNW.Feedback.getIntensityGuide(val) : null),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onIntensityChange(v)
            });
            this.components.sliderVariability = SNW.UI.slider({
                root: q('[data-slot="variability"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.variability,
                label: SNW.I18n.t('dashboard.variabilityLabel'),
                unit: '%',
                feedbackFn: val => (SNW.Feedback ? SNW.Feedback.getVariabilityGuide(val) : null),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onVariabilityChange(v)
            });
            this.components.sliderGust = SNW.UI.slider({
                root: q('[data-slot="gust"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.gustFreq,
                label: SNW.I18n.t('dashboard.gustLabel'),
                unit: '%',
                feedbackFn: val => (SNW.Feedback ? SNW.Feedback.getGustGuide(val) : null),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onGustChange(v)
            });
            this.components.slider = this.components.sliderIntensity;

            this.components.presets = SNW.UI.presetGrid({
                root: q('[data-slot="presets"]'),
                items: [], selected: '',
                onSelect: code => this._onPresetSelect(code),
                onPreview: code => this._onPreviewClick(code),
                onTrial: code => this._onRealTrialClick(code)
            });
            
            // 스타일 선택 이벤트 바인딩 추가
            this._bindStyleSelector();

            // [SIM-4] 프리셋 영역 A/B 비교 버튼 배치
            const presetSlot = this.el.querySelector('[data-slot="presets"]');
            if (presetSlot && presetSlot.parentElement) {
                const header = presetSlot.parentElement.querySelector('h2, .snw-card__header');
                if (header) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'snw-btn snw-btn--sm';
                    btn.style.cssText = 'float:right;font-size:11px;padding:2px 8px;margin-top:-2px;';
                    btn.textContent = '⚖ A/B 비교';
                    btn.onclick = () => this._onCompareClick();
                    header.appendChild(btn);

                    const tourBtn = document.createElement('button');
                    tourBtn.type = 'button';
                    tourBtn.className = 'snw-btn snw-btn--sm';
                    tourBtn.style.cssText = 'float:right;font-size:11px;padding:2px 8px;margin-top:-2px;margin-right:4px;';
                    tourBtn.textContent = '🎬 투어';
                    tourBtn.onclick = () => this._onTastingTour();
                    header.appendChild(tourBtn);

                    const sleepBtn = document.createElement('button');
                    sleepBtn.type = 'button';
                    sleepBtn.className = 'snw-btn snw-btn--sm';
                    sleepBtn.style.cssText = 'float:right;font-size:11px;padding:2px 8px;margin-top:-2px;margin-right:4px;';
                    sleepBtn.textContent = '🌙 수면모드';
                    sleepBtn.onclick = () => this._onSleepMode();
                    header.appendChild(sleepBtn);
                }
            }
        }

        // [U-001/U-004] 정본은 프리셋.factors × 스타일.factors (S20 미러)
        //  - target?.params → target?.factors (JSON 실제 구조)
        //  - REFRESH/WAVE → 실제 5종(BALANCE/ACTIVE/FOCUS/RELAX/SLEEP) factor 곱
        _resolvePresetParams(presetCode, styleCode) {
            const presets = (this._profileData?.windDict?.presets) || [];
            const styles  = (this._profileData?.windDict?.styles)  || [];

            const preset = presets.find(p => p.code === presetCode);
            const style  = styles.find(s => s.code === (styleCode || 'BALANCE'));

            const pf = preset?.factors || {};
            const sf = style?.factors  || {};

            const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
            const mul   = (base, f) => (base ?? 50) * (f ?? 1);

            return {
                intensity:   clamp(mul(pf.windIntensity,   sf.intensityFactor)),
                variability: clamp(mul(pf.windVariability, sf.variabilityFactor)),
                gustFreq:    clamp(mul(pf.gustFrequency,   sf.gustFactor))
            };
        }


        // [SIM-2] 가상 미리보기 모달 (30초 파형 애니메이션)
        async _onPreviewClick(presetCode) {
            const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
            if (!SNW.Preview || !SNW.Preview.generate) {
                SNW.ToastUtil.error('미리보기 모듈 미로드');
                return;
            }
            const preview = SNW.Preview.generate(presetCode, styleCode, null);
            if (!preview) { SNW.ToastUtil.error('미리보기 생성 실패'); return; }

            const feelings = SNW.Preview.toFeelings(
                preview.intensity, preview.variability, preview.gustFreq);

            const content = document.createElement('div');
            content.innerHTML = `
                <div class="snw-preview-modal">
                    <canvas data-preview-canvas width="500" height="180" style="width:100%;background:var(--snw-bg-2);border-radius:6px;"></canvas>
                    <div style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);">
                        🎬 <b>예상 파형 (±10% 오차)</b> · 실선풍기는 가동되지 않습니다
                    </div>
                    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div>🌊 <b>${SNW.Preview.labelFor('coolness')}</b> ${this._stars(feelings.coolness)}</div>
                        <div>🎵 <b>${SNW.Preview.labelFor('smoothness')}</b> ${this._stars(feelings.smoothness)}</div>
                        <div>⚡ <b>${SNW.Preview.labelFor('dynamism')}</b> ${this._stars(feelings.dynamism)}</div>
                        <div>🍃 <b>${SNW.Preview.labelFor('calmness')}</b> ${this._stars(feelings.calmness)}</div>
                    </div>
                    <div style="margin-top:12px;font-size:12px;color:var(--snw-text-dim);">
                        평균 ${preview.avg} m/s · 강도 ${Math.round(preview.intensity)}% ·
                        변동 ${Math.round(preview.variability)}% · 돌풍 ${Math.round(preview.gustFreq)}%
                    </div>
                </div>`;

            SNW.UI.modal(
                `🎬 미리보기 — ${presetCode} + ${styleCode}`,
                content,
                () => { this._applyPresetFromPreview(presetCode); return true; },
                null,
                { okLabel: '이 설정 적용', width: '540px', cancelLabel: '닫기' }
            );

            // 애니메이션 (30초 → 3초 재생)
            const canvas = content.querySelector('[data-preview-canvas]');
            if (canvas) this._animatePreview(canvas, preview.points);
        }

        _stars(n) {
            return '●'.repeat(n) + '○'.repeat(5 - n);
        }

        _animatePreview(canvas, points) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            let min = Infinity, max = -Infinity;
            points.forEach(p => { if (p.wind < min) min = p.wind; if (p.wind > max) max = p.wind; });
            if (max <= min) max = min + 1;

            let drawn = 0;
            const drawNext = () => {
                if (drawn >= points.length || !canvas.isConnected) return;
                ctx.clearRect(0, 0, w, h);

                // 격자
                ctx.strokeStyle = 'rgba(139,148,158,0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = (h / 4) * i;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }

                // 파형
                ctx.strokeStyle = 'rgba(74,158,255,1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= drawn; i++) {
                    const p = points[i];
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.wind - min) / (max - min)) * (h - 20) - 10;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // gust 표시
                for (let i = 0; i <= drawn; i++) {
                    if (!points[i].gust) continue;
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((points[i].wind - min) / (max - min)) * (h - 20) - 10;
                    ctx.fillStyle = 'rgba(240,136,62,0.9)';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                drawn += 3;
                setTimeout(drawNext, 30);
            };
            drawNext();
        }

        async _applyPresetFromPreview(presetCode) {
            try {
                const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
                await SNW.Api.patchSim({
                    presetCode, styleCode,
                    override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 }
                });
                SNW.ToastUtil.success(SNW.I18n.t('preset.applied'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'preview.apply');
            }
        }

        _bindStyleSelector() {
            const selector = this.el.querySelector('#style-selector');
            if (!selector) return;
            
            selector.addEventListener('click', async (e) => {
                const btn = e.target.closest('.snw-style-btn');
                if (!btn) return;
                
                const newStyle = btn.getAttribute('data-style');
                const currentSim = SNW.Store.get().sim || {};
                if (currentSim.styleCode === newStyle) return;
                
                // UI 즉시 반영
                this._updateStyleUI(newStyle);
                
                // 현재 프리셋과 새 스타일에 따른 세부 파라미터 연동 계산
                const currentPreset = currentSim.presetCode || 'FOREST';
                const resolved = this._resolvePresetParams(currentPreset, newStyle);

                // 슬라이더 3종 즉시 연동
                if (this.components.sliderIntensity) this.components.sliderIntensity.set(resolved.intensity);
                if (this.components.sliderVariability) this.components.sliderVariability.set(resolved.variability);
                if (this.components.sliderGust) this.components.sliderGust.set(resolved.gustFreq);

                SNW.Store.set({
                    sim: Object.assign({}, currentSim, {
                        styleCode: newStyle,
                        intensity: resolved.intensity,
                        variability: resolved.variability,
                        gustFreq: resolved.gustFreq
                    })
                });

                try {
                    await SNW.Api.patchSim({
                        styleCode: newStyle,
                        intensity: resolved.intensity,
                        variability: resolved.variability,
                        gustFreq: resolved.gustFreq
                    });
                } catch (err) {
                    SNW.ErrorHandler.handle(err, 'dashboard.style');
                    // 실패 시 원복
                    this._updateStyleUI(currentSim.styleCode);
                }
            });
        }
        
        _updateStyleUI(styleCode) {
            this.el.querySelectorAll('.snw-style-btn').forEach(btn => {
                btn.classList.toggle('is-active', btn.getAttribute('data-style') === styleCode);
            });
        }
        
        // =========================================================
        // [O-3] 모드 스위치 — 취소 시 롤백
        // =========================================================
        _bindModeSwitch() {
            const switchEl = this.el.querySelector('#mode-switch');
            if (!switchEl) return;
            
            switchEl.addEventListener('change', async (e) => {
                const isProfileMode = e.target.checked;
                const prevMode = !isProfileMode;
                const modeEl = this.el.querySelector('[data-slot="current-mode-text"]');
                
                const updateModeText = (profileMode) => {
                    if (modeEl) modeEl.textContent = profileMode
                        ? SNW.I18n.t('dashboard.modeProfileShort')
                        : SNW.I18n.t('dashboard.modeScheduleShort');
                };
                updateModeText(isProfileMode);
                
                try {
                    if (isProfileMode) {
                        await this._promptProfileSelection();
                    } else {
                        await SNW.Api.stopProfile();
                        SNW.ToastUtil.success(SNW.I18n.t('dashboard.modeSwitchedSchedule'));
                    }
                } catch (err) {
                    switchEl.checked = prevMode;
                    updateModeText(prevMode);
                    
                    if (err.message === 'CANCELLED') return;
                    if (err.message === 'NO_PROFILES') {
                        SNW.ToastUtil.warn(SNW.I18n.t('msg.noProfilesWarn'));
                        return;
                    }
                    SNW.ErrorHandler.handle(err, 'dashboard.modeSwitch');
                }
            });
        }
        
        // [O-3] 프로필 선택 모달 — 취소 시 reject
        async _promptProfileSelection() {
            const data = await SNW.Api.listProfiles().catch(() => null);
            const profiles = (data?.userProfiles?.profiles || []).filter(p => p.enabled);
            
            if (profiles.length === 0) throw new Error('NO_PROFILES');
            
            const content = document.createElement('div');
            content.className = 'snw-profile-picker';
            
            profiles.forEach(p => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'snw-btn snw-profile-picker__item';
                btn.innerHTML = `
                    <span>${SNW.DomUtil.escape(p.name || '#' + p.profileNo)}</span>
                    <span style="color:var(--snw-primary);">${SNW.I18n.t('common.start')} ▶</span>
                `;
                btn.onclick = async () => {
                    try {
                        await SNW.Api.selectProfile(p.profileNo);
                        SNW.ToastUtil.success(SNW.I18n.t('dashboard.modeSwitchedProfile'));
                        modalRef.close();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                };
                content.appendChild(btn);
            });
            
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
            
            const modalRef = SNW.UI.modal(
                SNW.I18n.t('dashboard.selectProfileModal'),
                content,
                null,
                () => reject(new Error('CANCELLED')),
                { hideOk: true }
            );
            
            return promise;
        }
        
        // =========================================================
        // Store 구독 — [O-1][O-2][O-6][O-15] 반영
        // =========================================================
        _bindStore() {
            const s = SNW.Store;
            
            this._unsubs.push(
                s.watch('fsmState', code => {
                    if (this._active) this.components.badge.set(code, s.get().fsmReason);
                }),
                s.watch('fsmReason', reason => {
                    if (this._active) this.components.badge.set(s.get().fsmState, reason);
                }),
                
                // [O-2][O-6] sim 구독 — 잠금 해제/프리셋 확정
                s.watch('sim', sim => {
                    if (!this._active || !sim) return;
                    
                    // [O-2] 강도 잠금
                    if (this._pendingIntensity !== null) {
                        if (Math.abs(sim.intensity - this._pendingIntensity) <= 1) {
                            this._pendingIntensity = null;
                        } else {
                            return; // 확정 전 → UI 덮어쓰기 방지
                        }
                    }
                    
                    // [O-6] 프리셋 확정
                    if (this._pendingPreset && sim.presetCode === this._pendingPreset) {
                        const card = this.el.querySelector(`[data-code="${sim.presetCode}"]`);
                        if (card) card.classList.remove('is-applying');
                        SNW.ToastUtil.success(SNW.I18n.t('preset.applied'));
                        this._pendingPreset = null;
                    }
                    
                    // UI 갱신
                    const curWind = this.el.querySelector('[data-slot="cur-wind"]');
                    if (curWind) curWind.textContent = (sim.windSpeed != null ? sim.windSpeed.toFixed(1) : '-');
                    const tgtWind = this.el.querySelector('[data-slot="target-wind"]');
                    if (tgtWind) tgtWind.textContent = (sim.targetWind != null ? sim.targetWind.toFixed(1) : '-');
                    const phaseEl = this.el.querySelector('[data-slot="phase"]');
                    if (phaseEl) {
                        const meta = SNW.C.WIND_PHASE_META[sim.phase] || SNW.C.WIND_PHASE_META.NORMAL;
                        phaseEl.textContent = SNW.I18n.t(meta.labelKey);
                    }
                    this.components.gauge.set(sim.pwmDuty != null ? sim.pwmDuty : 0);
                    if (sim.intensity != null) this.components.sliderIntensity.set(sim.intensity);
                    if (sim.variability != null) this.components.sliderVariability.set(sim.variability);
                    if (sim.gustFreq != null) this.components.sliderGust.set(sim.gustFreq);
                    if (sim.presetCode) this.components.presets.setSelected(sim.presetCode);
                    
                    if (sim.styleCode) this._updateStyleUI(sim.styleCode);
                }),
                
                // [O-1][O-15] control 구독 — 배너 갱신
                s.watch('control', ctl => {
                    if (!this._active || !ctl) return;
                    this.components.toggle.set(!!ctl.active);
                    if (ctl.sensor) {
                        this.components.sensors.set({
                            tempC: ctl.sensor.tempC,
                            humidity: ctl.sensor.humidity,
                            motionActive: ctl.sensor.motionActive
                        });
                    }
                    
                    const schName = ctl.schedule && ctl.schedule.name ? ctl.schedule.name : '-';
                    const profName = ctl.profile && ctl.profile.name ? ctl.profile.name : '-';
                    const schEl = this.el.querySelector('[data-slot="sch-name"]');
                    if (schEl) schEl.textContent = schName;
                    const profEl = this.el.querySelector('[data-slot="prof-name"]');
                    if (profEl) profEl.textContent = profName;
                    
                    let autoOffStr = '비활성';
                    if (ctl.autoOffRt) {
                        if (ctl.autoOffRt.timerArmed) autoOffStr = `타이머 (${ctl.autoOffRt.timerMinutes}분)`;
                        else if (ctl.autoOffRt.offTimeEnabled) autoOffStr = `예약 종료 (${ctl.autoOffRt.offTimeMinutes}분)`;
                        else if (ctl.autoOffRt.offTempEnabled) autoOffStr = `온도 (${ctl.autoOffRt.offTemp}°C)`;
                    }
                    const aoEl = this.el.querySelector('[data-slot="autooff"]');
                    if (aoEl) aoEl.textContent = autoOffStr;
                    
                    const isProfMode = ctl.profileMode || (ctl.runSource === 2);
                    const modeEl = this.el.querySelector('[data-slot="current-mode-text"]');
                    if (modeEl) modeEl.textContent = isProfMode
                        ? SNW.I18n.t('dashboard.modeProfileShort')
                        : SNW.I18n.t('dashboard.modeScheduleShort');
                    const switchEl = this.el.querySelector('#mode-switch');
                    if (switchEl && switchEl.checked !== isProfMode) switchEl.checked = isProfMode;
                    
                    // [O-15] AutoOff/모션 배너
                    this._updateBanner(ctl);
                })
            );
        }
        
        // [O-15] AutoOff/모션 배너 처리
        // [U-012] reasonCode → i18n 키 매핑 (AUTOOFF_TIMER → 취침 타이머 완료)
        _updateBanner(ctl) {
            if (!SNW.Banner) return;
            
            if (ctl.stateCode === 5 /* AUTOOFF_STOPPED */) {
                const reasonKey  = SNW.C.AUTOOFF_REASON_MAP ? SNW.C.AUTOOFF_REASON_MAP[ctl.reasonCode] : null;
                const reasonText = reasonKey ? SNW.I18n.t(reasonKey) : (ctl.reason || '-');
                SNW.Banner.update('autooff', {
                    id: 'autooff',
                    level: 'warn',
                    text: SNW.I18n.t('banner.autoOff', { reason: reasonText }),
                    actions: [
                        {
                            label: SNW.I18n.t('power.ackAndRestart'),
                            onClick: async () => {
                                try {
                                    await SNW.Api.ackEvent();
                                    await this._onPowerToggle(true);
                                } catch (e) { SNW.ErrorHandler.handle(e, 'dashboard.ackRestart'); }
                            }
                        },
                        {
                            label: SNW.I18n.t('power.ackOnly'),
                            onClick: async () => {
                                try {
                                    await SNW.Api.ackEvent();
                                    SNW.Banner.hide();
                                } catch (e) { SNW.ErrorHandler.handle(e, 'dashboard.ack'); }
                            }
                        }
                    ]
                });
            } else if (ctl.stateCode === 4 /* MOTION_BLOCKED */) {
                SNW.Banner.update('motion', {
                    id: 'motion',
                    level: 'warn',
                    text: SNW.I18n.t('banner.motionBlocked'),
                    actions: [{
                        label: SNW.I18n.t('power.forceOn'),
                        onClick: () => this._onPowerToggle(true)
                    }]
                });
            } else {
                SNW.Banner.hide();
            }
        }
        
        _startClock() {
            const clockEl = document.getElementById('header-clock');
            if (!clockEl) return;
            const id = SNW.TimeUtil.startClock(clockEl, () => {
                const t = SNW.Store.get().time || {};
                return {
                    hour: t.hour != null ? t.hour : -1,
                    min: t.min != null ? t.min : -1
                };
            });
            this._timers.push(id);
        }
        
        // =========================================================
        // [O-1] 전원 토글 — 진단 후 안전 실행
        // =========================================================
        async _onPowerToggle(next) {
            if (this._pendingPowerToggle) return;
            this._pendingPowerToggle = true;
            
            const prevCtl = SNW.Store.get().control || {};
            const prevActive = !!prevCtl.active;
            
            try {
                if (!next) {
                    await SNW.Api.overrideClear();
                    return;
                }
                
                // ON: 진단
                const st = await SNW.Api.getState();
                const ctl = st.control || {};
                
                // Case 1: AutoOff 래치
                if (ctl.stateCode === 5) {
                    SNW.ToastUtil.info(SNW.I18n.t('power.autoOffLatched'));
                    await SNW.Api.ackEvent();
                    await new Promise(r => setTimeout(r, 100));
                }
                
                // Case 2: 모션 블록
                if (ctl.stateCode === 4 || ctl.sensor?.motionActive === false) {
                    SNW.ToastUtil.warn(SNW.I18n.t('power.motionBlocked'));
                    this.components.toggle.set(prevActive);
                    this._pendingPowerToggle = false;
                    return;
                }
                
                // 낙관적 UI
                SNW.Store.set({ control: Object.assign({}, ctl, { active: true }) });
                
                const intensity = SNW.Store.get().sim?.intensity ?? 70;
                await SNW.Api.overrideFixed(intensity, 0, true);
                
                // 서버 실제 반영 검증
                const after = await SNW.Api.getState();
                if (after.control?.stateCode !== 1 /* OVERRIDE */) {
                    SNW.ToastUtil.error(SNW.I18n.t('power.failed', {
                        reason: after.control?.reason || 'unknown'
                    }));
                    this.components.toggle.set(prevActive);
                    SNW.Store.set({
                        control: Object.assign({}, after.control, { active: prevActive })
                    });
                }
            } catch (e) {
                this.components.toggle.set(prevActive);
                SNW.ErrorHandler.handle(e, 'dashboard.power');
            } finally {
                this._pendingPowerToggle = false;
            }
        }
        
        // =========================================================
        // [O-2] 강도 변경 — 낙관적 잠금
        // =========================================================
        async _onIntensityChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim?.intensity;
            
            this._pendingIntensity = v;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { intensity: v }) });
            
            try {
                await SNW.Api.patchSim({ intensity: v });
                // 1초 후에도 WS가 반영 안 하면 잠금 해제 (안전망)
                this._timers.push(setTimeout(() => {
                    if (this._pendingIntensity === v) this._pendingIntensity = null;
                }, 1000));
            } catch (e) {
                this._pendingIntensity = null;
                SNW.Store.set({ sim: Object.assign({}, prevSim, { intensity: prevVal }) });
                this.components.slider.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.intensity');
            }
        }

        async _onVariabilityChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim?.variability;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { variability: v }) });
            try {
                await SNW.Api.patchSim({ variability: v });
            } catch (e) {
                SNW.Store.set({ sim: Object.assign({}, prevSim, { variability: prevVal }) });
                this.components.sliderVariability.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.variability');
            }
        }

        async _onGustChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim?.gustFreq;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { gustFreq: v }) });
            try {
                await SNW.Api.patchSim({ gustFreq: v });
            } catch (e) {
                SNW.Store.set({ sim: Object.assign({}, prevSim, { gustFreq: prevVal }) });
                this.components.sliderGust.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.gust');
            }
        }
        
        // =========================================================
        // [O-6] 프리셋 적용 — WS 확인 및 세부 조정값 연동
        // =========================================================
        async _onPresetSelect(code) {
            const prevSim = SNW.Store.get().sim || {};
            const prevCode = prevSim?.presetCode;
            const currentStyle = prevSim?.styleCode || 'BALANCE';
            
            // 프리셋에 따른 세부 조정값 연동 계산
            const resolved = this._resolvePresetParams(code, currentStyle);

            this._pendingPreset = code;

            // 슬라이더 3종 즉시 연동
            if (this.components.sliderIntensity) this.components.sliderIntensity.set(resolved.intensity);
            if (this.components.sliderVariability) this.components.sliderVariability.set(resolved.variability);
            if (this.components.sliderGust) this.components.sliderGust.set(resolved.gustFreq);

            SNW.Store.set({
                sim: Object.assign({}, prevSim, {
                    presetCode: code,
                    intensity: resolved.intensity,
                    variability: resolved.variability,
                    gustFreq: resolved.gustFreq
                })
            });
            
            const card = this.el.querySelector(`[data-code="${code}"]`);
            if (card) card.classList.add('is-applying');
            
            try {
                await SNW.Api.patchSim({
                    presetCode: code,
                    styleCode: currentStyle,
                    intensity: resolved.intensity,
                    variability: resolved.variability,
                    gustFreq: resolved.gustFreq
                });
                
                // 3초 타임아웃
                this._timers.push(setTimeout(() => {
                    if (this._pendingPreset === code) {
                        this._pendingPreset = null;
                        if (card) card.classList.remove('is-applying');
                    }
                }, 3000));
            } catch (e) {
                this._pendingPreset = null;
                if (card) card.classList.remove('is-applying');
                SNW.Store.set({ sim: Object.assign({}, prevSim, { presetCode: prevCode }) });
                this.components.presets.setSelected(prevCode);
                SNW.ErrorHandler.handle(e, 'dashboard.preset');
            }
        }
    };
})(window.SNW);



/* ---- 210.page.chart.js (9487 bytes) ---- */
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
				const sim = SNW.Store.get().sim || {};
				if (SNW.Preview && SNW.Preview.generate) {
					const preview = SNW.Preview.generate(
						sim.presetCode || 'OCEAN',
						sim.styleCode || 'BALANCE',
						null
					);
					if (preview && preview.points) {
						this._buffer = preview.points.map(p => ({
							t: p.t,
							windSpeed: p.wind,
							targetWind: p.avg,
							pwmDuty: 0
						}));
						this._redrawRange();
					}
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
	};
	
})(window.SNW);


/* ---- 220.page.schedule.js (39143 bytes) ---- */
// =========================================================
// 220.page.schedule.js — SNW.Page.Schedule
// Layer 4 (페이지 로직)
// [O-7] 클라이언트 검증 (필드별 에러 표시 + 첫 오류로 스크롤)
// [O-8] 세그먼트 삭제 Undo 토스트
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Schedule = class Schedule {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._schedules = [];
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.schedule());
            SNW.I18n.applyTo(this.el);
            await this._load();

            SNW.DomUtil.delegate(this.el, '[data-action="add-schedule"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-schedule"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onEdit(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="del-schedule"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onDelete(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="toggle-schedule"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onToggle(id, el.checked);
            });
        }

        unmount() { this._active = false; }

        async _load() {
            try {
                const data = await SNW.Api.listSchedules();
                if (!this._active) return;
                this._schedules = (data && data.schedules) || [];
                this._renderList();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'schedule.load');
            }
        }

        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const tAdd = t('schedule.add', '스케줄 추가');
            const tSegment = t('scheduler.segment', '세그먼트');
            const dayKeys = ['days.mon','days.tue','days.wed','days.thu','days.fri','days.sat','days.sun'];
            const dayLabels = dayKeys.map(k => t(k, k));

            listSlot.innerHTML = `
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-schedule">${tAdd}</button>
                </div>
            `;
            const wrap = document.createElement('div');
            wrap.className = 'snw-schedule-list';

            this._schedules.forEach(s => {
                const days = s.period?.days || [0,0,0,0,0,0,0];
                const daysStr = days.map((on, i) => on ? dayLabels[i] : '·').join('');
                const segStr = (s.segments || [])
                    .map(sg => `[${sg.mode}] ${sg.onMinutes}m/${sg.offMinutes}m`)
                    .join(' | ');
                const timeRange = `${s.period?.startTime || '--:--'}~${s.period?.endTime || '--:--'}`;
                const repeatLabel = s.repeatSegments ? `${s.repeatCount}회` : 'Off';

                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-schedule-item ${s.enabled ? 'is-enabled' : 'is-disabled'}">
                        <div class="snw-schedule-head">
                            <label class="snw-switch">
                                <input type="checkbox" data-action="toggle-schedule" data-id="${s.schId}" ${s.enabled ? 'checked' : ''}>
                                <span class="snw-switch__slider"></span>
                            </label>
                            <span class="snw-schedule-name">${SNW.DomUtil.escape(s.name)} (#${s.schNo})</span>
                            <button class="snw-btn-icon" data-action="edit-schedule" data-id="${s.schId}">✏️</button>
                            <button class="snw-btn-icon" data-action="del-schedule" data-id="${s.schId}">🗑</button>
                        </div>
                        <div class="snw-schedule-meta">${daysStr} ${timeRange} (Repeat: ${repeatLabel})</div>
                        <div class="snw-schedule-details" style="font-size:11px;color:var(--snw-text-dim);margin-top:4px;">
                            ${tSegment}: ${segStr}
                        </div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
        }

        _onAdd() { this._openEditor(null); }
        _onEdit(id) { this._openEditor(this._schedules.find(s => s.schId === id)); }

        async _openEditor(target) {
            const isEdit = !!target;
            const maxSchNo = this._schedules.reduce((m, s) => Math.max(m, s.schNo || 0), 0);
            const s = target || {
                schId: 0, schNo: maxSchNo + 10, name: 'New Schedule', enabled: true,
                repeatSegments: true, repeatCount: 1,
                period: { enabled: true, days: [1,1,1,1,1,1,1], startTime: '08:00', endTime: '20:00' },
                segments: [{
                    segNo: 10, onMinutes: 20, offMinutes: 10, mode: 'PRESET',
                    presetCode: 'HARBOR_BREEZE', styleCode: 'BALANCE',
                    override: { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 45 },
                    fixedSpeed: 0
                }],
                autoOff: {
                    timer:   { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 }
                }
            };
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const dayKeys = ['days.mon','days.tue','days.wed','days.thu','days.fri','days.sat','days.sun'];

            const PRESET_CODES = [
                'OCEAN', 'COUNTRY_BREEZE', 'MEDITERRANEAN', 'MOUNTAIN', 'PLAINS',
                'HARBOR_BREEZE', 'FOREST_CANOPY', 'URBAN_SUNSET', 'TROPICAL_RAIN', 'DESERT_NIGHT'
            ];

            const STYLE_CODES = ['BALANCE', 'ACTIVE', 'FOCUS', 'RELAX', 'SLEEP'];

            const content = document.createElement('div');
            let daysHtml = `<div class="snw-form-row"><label>${t('scheduler.day', '요일')}</label><div style="display:flex;gap:4px;">`;
            dayKeys.forEach((k, i) => {
                daysHtml += `<label style="font-size:12px;">
                    <input type="checkbox" data-day="${i}" ${(s.period?.days||[])[i] ? 'checked' : ''}>
                    ${t(k, k)}
                </label>`;
            });
            daysHtml += `</div></div>`;
            
            content.innerHTML = `
                <div class="snw-form">
                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secBasic')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row">
                                <label>${SNW.I18n.t('schedule.name')}</label>
                                <input type="text" id="sch-name" value="${SNW.DomUtil.escape(s.name)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;">${SNW.I18n.t('schedule.startTime')}
                                    <input type="time" id="sch-start" value="${s.period?.startTime || '08:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('schedule.endTime')}
                                    <input type="time" id="sch-end" value="${s.period?.endTime || '20:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            ${daysHtml}
                            <div class="snw-form-row" style="display:flex;gap:8px;margin-top:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.segmentRepeat')}
                                    <input type="checkbox" id="sch-repeat" ${s.repeatSegments ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.repeatCount')}
                                    <input type="number" id="sch-repeat-count" min="0" value="${s.repeatCount}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>

                    <details class="snw-accordion" open id="details-segs">
                        <summary id="sch-seg-summary" style="cursor:pointer;font-weight:600;">${SNW.I18n.t('schedule.secSegments')}</summary>
                        <div class="snw-accordion__content">
                            <div id="sch-segs" style="display:flex;flex-direction:column;gap:12px;"></div>
                            <button type="button" class="snw-btn snw-btn-secondary" id="btn-add-seg" style="margin-top:12px; width:100%; border: 1px dashed var(--snw-primary); color: var(--snw-primary); background: transparent;">
                                + ${SNW.I18n.t('schedule.addSegmentBtn')}
                            </button>
                        </div>
                    </details>

                    <details class="snw-accordion">
                        <summary>${SNW.I18n.t('schedule.secSmart')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row" style="display:flex;gap:8px; margin-top:8px;">
                                <label style="flex:1;">${SNW.I18n.t('profiles.autoOffTimer')}
                                    <input type="number" id="sch-ao-timer" min="0" value="${s.autoOff?.timer?.minutes || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.scheduledOff')}
                                    <input type="checkbox" id="sch-ao-offtime-en" ${s.autoOff?.offTime?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('schedule.endTime')}
                                    <input type="time" id="sch-ao-offtime" value="${s.autoOff?.offTime?.time || '00:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.tempOff')}
                                    <input type="checkbox" id="sch-ao-offtemp-en" ${s.autoOff?.offTemp?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('dashboard.temp')}(°C)
                                    <input type="number" step="0.1" id="sch-ao-offtemp" value="${s.autoOff?.offTemp?.temp || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('sensors.pirEnabled')}
                                    <input type="checkbox" id="sch-pir-en" ${s.motion?.pir?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('sensors.pirHoldSec')}
                                    <input type="number" id="sch-pir-hold" min="0" value="${s.motion?.pir?.holdSec || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>
                </div>`;

            // 조건부 비활성화 바인딩
            const bindConditionals = () => {
                const pairs = [
                    { chk: '#sch-ao-offtime-en', target: '#sch-ao-offtime' },
                    { chk: '#sch-ao-offtemp-en', target: '#sch-ao-offtemp' },
                    { chk: '#sch-pir-en', target: '#sch-pir-hold' }
                ];
                pairs.forEach(({ chk, target }) => {
                    const chkEl = content.querySelector(chk);
                    const tgtEl = content.querySelector(target);
                    if (chkEl && tgtEl) {
                        const update = () => {
                            tgtEl.disabled = !chkEl.checked;
                            tgtEl.style.opacity = chkEl.checked ? '1' : '0.4';
                        };
                        chkEl.addEventListener('change', update);
                        update();
                    }
                });
            };
            bindConditionals();

            const segContainer = content.querySelector('#sch-segs');
            const currentSegs = JSON.parse(JSON.stringify(s.segments || []));

            const updateSummaryText = () => {
                const sumEl = content.querySelector('#sch-seg-summary');
                if (!sumEl) return;
                if (!currentSegs.length) {
                    sumEl.textContent = `${t('schedule.secSegments', '세그먼트')} (0)`;
                    return;
                }
                const parts = currentSegs.map((sg, i) => {
                    if (sg.mode === 'FIXED') return `${i+1}:${t('segment.modeFixed', '고정')}(${sg.fixedSpeed || 0}%) ${sg.onMinutes}m/${sg.offMinutes}m`;
                    const pName = t('preset.' + sg.presetCode, sg.presetCode);
                    return `${i+1}:${pName} ${sg.onMinutes}m/${sg.offMinutes}m`;
                });
                sumEl.textContent = `${t('segment.summaryPrefix', '세그먼트')} (${currentSegs.length}) · ${parts.join(' → ')}`;
            };

            const _moveSeg = (idx, dir) => {
                const targetIdx = idx + dir;
                if (targetIdx < 0 || targetIdx >= currentSegs.length) return;
                const temp = currentSegs[idx];
                currentSegs[idx] = currentSegs[targetIdx];
                currentSegs[targetIdx] = temp;
                currentSegs.forEach((sg, i) => { sg.segNo = (i + 1) * 10; });
                renderSegs(currentSegs);
            };

            const _removeWithUndo = (idx) => {
                if (currentSegs.length <= 1) {
                    SNW.ToastUtil.warn(SNW.I18n.t('validate.segmentMin'));
                    return;
                }
                const removed = currentSegs.splice(idx, 1)[0];
                renderSegs(currentSegs);

                const host = document.getElementById('toast-host');
                if (host) {
                    const tEl = document.createElement('div');
                    tEl.className = 'snw-toast snw-toast--warn';
                    tEl.style.cssText = 'display:flex;align-items:center;gap:12px;';
                    tEl.innerHTML = `
                        <span style="flex:1;">${SNW.I18n.t('segment.deleted')}</span>
                        <button type="button" style="background:none;border:none;color:var(--snw-primary);cursor:pointer;font-weight:600;text-decoration:underline;padding:0;font-size:13px;">
                            ${SNW.I18n.t('common.undo')}
                        </button>`;
                    tEl.querySelector('button').onclick = () => {
                        currentSegs.splice(idx, 0, removed);
                        renderSegs(currentSegs);
                        tEl.remove();
                    };
                    host.appendChild(tEl);
                    setTimeout(() => {
                        tEl.classList.add('snw-toast--out');
                        setTimeout(() => tEl.remove(), 300);
                    }, 5000);
                }
            };

            const renderSegs = (segs) => {
                segContainer.innerHTML = '';
                segs.forEach((seg, idx) => {
                    const ovr = seg.override || { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 };
                    const segDiv = document.createElement('div');
                    segDiv.className = 'snw-seg-card';
                    segDiv.style.cssText = 'background:var(--snw-surface);border:1px solid var(--snw-border);border-radius:8px;padding:12px;';
                    
                    segDiv.innerHTML = `
                        <div class="snw-seg-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                            <span class="snw-seg-title" style="font-weight:bold;color:var(--snw-primary);">${t('scheduler.segment', '세그먼트')} ${idx + 1}</span>
                            <div style="display:flex;align-items:center;gap:4px;">
                                <button type="button" class="snw-btn-icon btn-preview-seg" data-preview-seg="${idx}" title="미리보기">🎬</button>
                                <button type="button" class="snw-btn-icon btn-move-up" data-move-up="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="${t('segment.moveUp', '위로')}">▲</button>
                                <button type="button" class="snw-btn-icon btn-move-down" data-move-down="${idx}" ${idx === segs.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="${t('segment.moveDown', '아래로')}">▼</button>
                                <button type="button" class="snw-btn-icon btn-del-seg" data-remove-seg="${idx}" style="color:var(--snw-error);" title="${t('common.delete', '삭제')}">🗑</button>
                            </div>
                        </div>
                        <div class="snw-seg-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <label style="font-size:12px;">${t('segment.onMinutes', '작동 시간(분)')}
                                <input type="number" class="seg-on" min="0" max="1440" value="${seg.onMinutes}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="font-size:12px;">${t('segment.offMinutes', '정지 시간(분)')}
                                <input type="number" class="seg-off" min="0" max="1440" value="${seg.offMinutes}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="grid-column: span 2; font-size:12px;">${t('segment.mode', '모드')}
                                <select class="seg-mode" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                    <option value="PRESET" ${seg.mode === 'PRESET' ? 'selected' : ''}>${t('segment.modePreset', '프리셋 모드')}</option>
                                    <option value="FIXED"  ${seg.mode === 'FIXED'  ? 'selected' : ''}>${t('segment.modeFixed', '고정풍속 모드')}</option>
                                </select>
                            </label>
                            <div class="snw-seg-preset-area" style="grid-column: span 2; display: ${seg.mode === 'PRESET' ? 'grid' : 'none'}; grid-template-columns:1fr 1fr; gap:8px;">
                                <label style="font-size:12px;">${t('segment.presetSelect', '프리셋 선택')}
                                    <select class="seg-preset" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                        ${PRESET_CODES.map(c => `<option value="${c}" ${seg.presetCode === c ? 'selected' : ''}>${c} (${t('preset.' + c, c)})</option>`).join('')}
                                    </select>
                                </label>
                                <label style="font-size:12px;">${t('segment.styleSelect', '스타일 선택')}
                                    <select class="seg-style" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                        ${STYLE_CODES.map(c => `<option value="${c}" ${seg.styleCode === c ? 'selected' : ''}>${c} (${t('style.' + c, c)})</option>`).join('')}
                                    </select>
                                </label>
                                <details class="snw-accordion snw-seg-override" style="grid-column: span 2; margin-top:4px; border: 1px dashed var(--snw-border); border-radius: 6px; padding: 6px 10px;">
                                    <summary style="font-size:11.5px; font-weight:600; color:var(--snw-primary); cursor:pointer;">
                                        ${t('segment.overrideTitle', '⚙️ 고급 물리 설정 (Override 직접 지정)')}
                                    </summary>
                                    <div class="snw-accordion__content" style="padding-top:8px;">
                                        <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;margin-bottom:8px;cursor:pointer;">
                                            <input type="checkbox" class="seg-ovr-en" ${ovr.enabled ? 'checked' : ''}>
                                            <span>${t('segment.overrideDesc', '이 세그먼트에서 바람 세부 설정 직접 지정 (Override)')}</span>
                                        </label>
                                        <div class="seg-ovr-fields" style="${ovr.enabled ? '' : 'display:none;opacity:0.5;'}">
                                            <div class="snw-form-row" style="margin-bottom:8px;">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideIntensity', '바람 강도 (%)')}</label>
                                                    <b class="val-int-txt">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-int" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}" style="width:100%;">
                                                <div class="fb-int-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                            <div class="snw-form-row" style="margin-bottom:8px;">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideVariability', '바람 변동성 (%)')}</label>
                                                    <b class="val-var-txt">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-var" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}" style="width:100%;">
                                                <div class="fb-var-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                            <div class="snw-form-row">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideGust', '돌풍 빈도 (%)')}</label>
                                                    <b class="val-gust-txt">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 40}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-gust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 40}" style="width:100%;">
                                                <div class="fb-gust-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            <div class="snw-seg-fixed-area" style="grid-column: span 2; display: ${seg.mode === 'FIXED' ? 'block' : 'none'};">
                                <label style="font-size:12px;">${t('segment.fixedSpeed', '고정 풍속(%)')}
                                    <input type="number" class="seg-fixed" min="0" max="100" value="${seg.fixedSpeed || 0}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>`;

                    // 모드 전환 바인딩
                    const modeSel = segDiv.querySelector('.seg-mode');
                    const presetArea = segDiv.querySelector('.snw-seg-preset-area');
                    const fixedArea = segDiv.querySelector('.snw-seg-fixed-area');
                    modeSel.addEventListener('change', (e) => {
                        const isPreset = e.target.value === 'PRESET';
                        presetArea.style.display = isPreset ? 'grid' : 'none';
                        fixedArea.style.display  = isPreset ? 'none' : 'block';
                        updateSummaryText();
                    });

                    // Override 토글 및 실시간 뱃지 연동
                    const ovrEn = segDiv.querySelector('.seg-ovr-en');
                    const ovrFields = segDiv.querySelector('.seg-ovr-fields');
                    ovrEn.addEventListener('change', () => {
                        ovrFields.style.display = ovrEn.checked ? 'block' : 'none';
                    });

                    const bindRange = (rangeSel, txtSel, fbSel, guideFn) => {
                        const rEl = segDiv.querySelector(rangeSel);
                        const tEl = segDiv.querySelector(txtSel);
                        const fEl = segDiv.querySelector(fbSel);
                        if (!rEl) return;
                        const sync = () => {
                            if (tEl) tEl.textContent = `${rEl.value}%`;
                            if (fEl && guideFn) {
                                const g = guideFn(Number(rEl.value));
                                fEl.textContent = g ? `▶ ${g.title}` : '';
                            }
                        };
                        rEl.addEventListener('input', sync);
                        sync();
                    };

                    bindRange('.seg-ovr-int',  '.val-int-txt',  '.fb-int-txt',  val => SNW.Feedback?.getIntensityGuide(val));
                    bindRange('.seg-ovr-var',  '.val-var-txt',  '.fb-var-txt',  val => SNW.Feedback?.getVariabilityGuide(val));
                    bindRange('.seg-ovr-gust', '.val-gust-txt', '.fb-gust-txt', val => SNW.Feedback?.getGustGuide(val));

                    // [SIM-5] 세그먼트 미리보기 바인딩
                    const prevBtn = segDiv.querySelector('.btn-preview-seg');
                    if (prevBtn) {
                        prevBtn.onclick = () => {
                            const segData = {
                                mode: segDiv.querySelector('.seg-mode')?.value || 'PRESET',
                                presetCode: segDiv.querySelector('.seg-preset')?.value || 'OCEAN',
                                styleCode:  segDiv.querySelector('.seg-style')?.value  || 'BALANCE',
                                fixedSpeed: Number(segDiv.querySelector('.seg-fixed')?.value || 0),
                                override: {
                                    enabled: segDiv.querySelector('.seg-ovr-en')?.checked || false,
                                    windIntensity:   Number(segDiv.querySelector('.seg-ovr-int')?.value || -1),
                                    windVariability: Number(segDiv.querySelector('.seg-ovr-var')?.value || -1),
                                    gustFrequency:   Number(segDiv.querySelector('.seg-ovr-gust')?.value || -1)
                                }
                            };
                            if (SNW.Preview && SNW.Preview.showModal) {
                                SNW.Preview.showModal(segData);
                            }
                        };
                    }

                    // 순서 이동 및 삭제 버튼 바인딩
                    const upBtn = segDiv.querySelector('.btn-move-up');
                    const downBtn = segDiv.querySelector('.btn-move-down');
                    if (upBtn) upBtn.onclick = () => _moveSeg(idx, -1);
                    if (downBtn) downBtn.onclick = () => _moveSeg(idx, 1);
                    segDiv.querySelector('.btn-del-seg').onclick = () => _removeWithUndo(idx);

                    segContainer.appendChild(segDiv);
                });
                updateSummaryText();
            };

            renderSegs(currentSegs);

            content.querySelector('#btn-add-seg').addEventListener('click', () => {
                currentSegs.push({
                    segNo: currentSegs.length * 10 + 10,
                    onMinutes: 20, offMinutes: 10, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    override: { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 },
                    fixedSpeed: 0
                });
                renderSegs(currentSegs);
            });

            // =========================================================
            // 저장 — [O-7] 필드별 검증 & Override 직결 수집
            // =========================================================
            SNW.UI.modal(
                isEdit ? `스케줄 수정: ${SNW.DomUtil.escape(s.name)}` : t('schedule.add', '스케줄 추가'),
                content,
                async () => {
                    const nameEl  = content.querySelector('#sch-name');
                    const startEl = content.querySelector('#sch-start');
                    const endEl   = content.querySelector('#sch-end');

                    [nameEl, startEl, endEl].forEach(el => el.classList.remove('is-error'));

                    const errors = [];
                    if (!nameEl.value.trim()) {
                        nameEl.classList.add('is-error');
                        errors.push({ el: nameEl, msg: SNW.I18n.t('validate.required', { field: t('schedule.name', '이름') }) });
                    }
                    if (startEl.value >= endEl.value) {
                        endEl.classList.add('is-error');
                        errors.push({ el: endEl, msg: SNW.I18n.t('validate.timeOrder') });
                    }

                    const onInputs  = segContainer.querySelectorAll('.seg-on');
                    const offInputs = segContainer.querySelectorAll('.seg-off');
                    onInputs.forEach((el, i) => {
                        el.classList.remove('is-error');
                        const v = Number(el.value);
                        if (isNaN(v) || v < 0 || v > 1440) {
                            el.classList.add('is-error');
                            errors.push({ el, msg: `세그먼트 ${i+1} 작동 시간: 0~1440분` });
                        }
                    });
                    offInputs.forEach((el, i) => {
                        el.classList.remove('is-error');
                        const v = Number(el.value);
                        if (isNaN(v) || v < 0 || v > 1440) {
                            el.classList.add('is-error');
                            errors.push({ el, msg: `세그먼트 ${i+1} 정지 시간: 0~1440분` });
                        }
                    });

                    if (errors.length) {
                        SNW.ToastUtil.error(SNW.I18n.t('validate.multiErrors', { count: errors.length }));
                        const first = content.querySelector('.is-error');
                        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return false;
                    }

                    // body 구성 (Override 직결 전송)
                    const newSegs = [];
                    segContainer.querySelectorAll('.snw-seg-card').forEach((card, idx) => {
                        const on   = Number(card.querySelector('.seg-on').value);
                        const off  = Number(card.querySelector('.seg-off').value);
                        const mode = card.querySelector('.seg-mode').value;
                        const seg = { segNo: idx * 10 + 10, onMinutes: on, offMinutes: off, mode };
                        if (mode === 'PRESET') {
                            seg.presetCode = card.querySelector('.seg-preset').value;
                            seg.styleCode  = card.querySelector('.seg-style').value;
                            const ovrEn = card.querySelector('.seg-ovr-en').checked;
                            seg.override = {
                                enabled: ovrEn,
                                windIntensity:   ovrEn ? Number(card.querySelector('.seg-ovr-int').value) : -1.0,
                                windVariability: ovrEn ? Number(card.querySelector('.seg-ovr-var').value) : -1.0,
                                gustFrequency:   ovrEn ? Number(card.querySelector('.seg-ovr-gust').value) : -1.0
                            };
                        } else {
                            seg.fixedSpeed = Number(card.querySelector('.seg-fixed').value);
                        }
                        newSegs.push(seg);
                    });

                    const days = Array.from(content.querySelectorAll('[data-day]')).map(cb => cb.checked ? 1 : 0);

                    const body = {
                        schedule: {
                            schNo: s.schNo,
                            name: nameEl.value,
                            enabled: s.enabled,
                            repeatSegments: content.querySelector('#sch-repeat').checked,
                            repeatCount: Number(content.querySelector('#sch-repeat-count').value),
                            period: {
                                enabled: true, days,
                                startTime: startEl.value, endTime: endEl.value
                            },
                            segments: newSegs,
                            autoOff: {
                                timer: {
                                    enabled: Number(content.querySelector('#sch-ao-timer').value) > 0,
                                    minutes: Number(content.querySelector('#sch-ao-timer').value)
                                },
                                offTime: {
                                    enabled: content.querySelector('#sch-ao-offtime-en').checked,
                                    time: content.querySelector('#sch-ao-offtime').value
                                },
                                offTemp: {
                                    enabled: content.querySelector('#sch-ao-offtemp-en').checked,
                                    temp: Number(content.querySelector('#sch-ao-offtemp').value)
                                }
                            },
                            motion: {
                                pir: {
                                    enabled: content.querySelector('#sch-pir-en').checked,
                                    holdSec: Number(content.querySelector('#sch-pir-hold').value)
                                }
                            }
                        }
                    };

                    try {
                        if (isEdit) await SNW.Api.updateSchedule(s.schId, body);
                        else        await SNW.Api.addSchedule(body);
                        await SNW.Api.saveConfig();
                        SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                        await this._load();
                        return true;
                    } catch (e) {
                        SNW.ErrorHandler.handle(e, 'schedule.save');
                        return false;
                    }
                },
                null,
                { width: '560px' }
            );
        }

        async _onDelete(id) {
            if (!confirm(SNW.I18n.t('msg.deleteConfirm'))) return;
            try {
                await SNW.Api.deleteSchedule(id);
                await SNW.Api.saveConfig();
                await this._load();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'schedule.delete');
            }
        }

        async _onToggle(id, next) {
            const target = this._schedules.find(s => s.schId === id);
            if (!target) return;
            const prevEnabled = target.enabled;
            target.enabled = !!next;
            try {
                await SNW.Api.updateSchedule(id, { schedule: target });
                this._renderList();
            } catch (e) {
                target.enabled = prevEnabled;
                this._renderList();
                SNW.ErrorHandler.handle(e, 'schedule.toggle');
            }
        }
    };
})(window.SNW);


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


/* ---- 230.page.profiles.js (34871 bytes) ---- */
// =========================================================
// 230.page.profiles.js — SNW.Page.Profiles
// Layer 4 (페이지 로직)
// [O-16] 활성 프로필 표시 + start/stop 토글
// [FIX] HTML 태그 텍스트 노출 버그 수정 (innerHTML + escape 조합)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Profiles = class Profiles {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._unsubs = [];
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.profiles());
            SNW.I18n.applyTo(this.el);
            await this._load();

            // [O-16] control 구독 → 활성 상태 실시간 갱신
            const unsub = SNW.Store.watch('control', () => {
                if (this._active) this._renderList();
            });
            this._unsubs.push(unsub);

            SNW.DomUtil.delegate(this.el, '[data-action="add-profile"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-profile"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onEdit(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onDelete(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => {
                const no = Number(el.getAttribute('data-no'));
                if (no) this._onStart(no);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="stop-profile"]', 'click', () => this._onStop());
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
        }

        async _load() {
            try {
                const data = await SNW.Api.listProfiles();
                if (!this._active) return;
                this._profiles = (data && data.userProfiles && data.userProfiles.profiles) || [];
                this._renderList();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.load');
            }
        }

        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;

            const activeNo = SNW.Store.get().control?.profile?.profileNo;

            listSlot.innerHTML = `
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-profile">
                        ${SNW.I18n.t('profiles.add')}
                    </button>
                </div>
            `;

            const wrap = document.createElement('div');
            wrap.className = 'snw-profile-list';

            if (this._profiles.length === 0) {
                wrap.innerHTML = `<div class="snw-empty">${SNW.I18n.t('common.noData')}</div>`;
            }

            this._profiles.forEach(p => {
                const isActive   = (p.profileNo === activeNo);
                const isDisabled = !p.enabled;
                const safeName   = SNW.DomUtil.escape(p.name);

                // [FIX] DomUtil.html 대신 innerHTML 사용 (태그 렌더링 보장 + 이름만 escape)
                const item = document.createElement('div');
                item.className = `snw-profile-item ${isDisabled ? 'is-disabled' : ''} ${isActive ? 'is-active' : ''}`;
                
                item.innerHTML = `
                    <div class="snw-profile-head">
                        <span class="snw-profile-no">#${p.profileNo}</span>
                        <span class="snw-profile-name">${safeName}</span>
                        ${isActive ? `<span class="snw-badge snw-badge--green">${SNW.I18n.t('profile.active')}</span>` : ''}
                        <button class="snw-btn-icon" data-action="edit-profile" data-id="${p.profileId}">✏️</button>
                        <button class="snw-btn-icon" data-action="del-profile" data-id="${p.profileId}">🗑</button>
                    </div>
                    <div class="snw-profile-actions" style="margin-top:8px;">
                        ${isActive
                            ? `<button class="snw-btn" data-action="stop-profile">
                                   ⏹ ${SNW.I18n.t('common.stop')}
                               </button>`
                            : `<button class="snw-btn snw-btn-primary"
                                       data-action="start-profile"
                                       data-no="${p.profileNo}"
                                       ${isDisabled ? 'disabled' : ''}>
                                   ▶ ${SNW.I18n.t('common.start')}
                               </button>`
                        }
                    </div>
                `;
                wrap.appendChild(item);
            });

            listSlot.appendChild(wrap);
        }

        _onAdd() { this._openEditor(null); }
        _onEdit(id) { this._openEditor(this._profiles.find(p => p.profileId === id)); }

        async _openEditor(target) {
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const PRESET_CODES = [
                'OCEAN', 'COUNTRY_BREEZE', 'MEDITERRANEAN', 'MOUNTAIN', 'PLAINS',
                'HARBOR_BREEZE', 'FOREST_CANOPY', 'URBAN_SUNSET', 'TROPICAL_RAIN', 'DESERT_NIGHT'
            ];

            const STYLE_CODES = ['BALANCE', 'ACTIVE', 'FOCUS', 'RELAX', 'SLEEP'];

            const isEdit = !!target;
            const maxNo = this._profiles.reduce((m, x) => Math.max(m, x.profileNo || 0), 0);
            const p = target || {
                profileId: 0, profileNo: maxNo + 10, name: 'New Profile', enabled: true,
                repeatSegments: false, repeatCount: 0,
                segments: [{
                    segNo: 10, onMinutes: 20, offMinutes: 0, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    override: { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 },
                    fixedSpeed: 0
                }],
                autoOff: {
                    timer:   { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 }
                },
                motion: { pir: { enabled: false, holdSec: 0 } }
            };

            const content = document.createElement('div');

            content.innerHTML = `
                <div class="snw-form">
                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secBasic')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row">
                                <label>${SNW.I18n.t('profiles.name')}</label>
                                <input type="text" id="prof-name" value="${SNW.DomUtil.escape(p.name)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;">${SNW.I18n.t('profiles.no')}
                                    <input type="number" id="prof-no" value="${p.profileNo}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('profiles.enabled')}
                                    <input type="checkbox" id="prof-enabled" ${p.enabled ? 'checked' : ''}>
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;margin-top:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.segmentRepeat')}
                                    <input type="checkbox" id="prof-repeat" ${p.repeatSegments ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.repeatCount')}
                                    <input type="number" id="prof-repeat-count" min="0" value="${p.repeatCount}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>
            
                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secSegments')}</summary>
                        <div class="snw-accordion__content">
                            <div id="prof-segs" style="display:flex;flex-direction:column;gap:12px;"></div>
                            <button type="button" class="snw-btn snw-btn-primary" id="btn-add-prof-seg" style="margin-top:12px; width:100%;">
                                + ${SNW.I18n.t('profiles.addSegmentBtn')}
                            </button>
                        </div>
                    </details>
            
                    <details class="snw-accordion">
                        <summary>${SNW.I18n.t('schedule.secSmart')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row" style="display:flex;gap:8px; margin-top:8px;">
                                <label style="flex:1;">${SNW.I18n.t('profiles.autoOffTimer')}
                                    <input type="number" id="prof-ao-timer" min="0" value="${p.autoOff?.timer?.minutes || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.scheduledOff')}
                                    <input type="checkbox" id="prof-ao-offtime-en" ${p.autoOff?.offTime?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('schedule.endTime')}
                                    <input type="time" id="prof-ao-offtime" value="${p.autoOff?.offTime?.time || '00:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.tempOff')}
                                    <input type="checkbox" id="prof-ao-offtemp-en" ${p.autoOff?.offTemp?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('dashboard.temp')}(°C)
                                    <input type="number" step="0.1" id="prof-ao-offtemp" value="${p.autoOff?.offTemp?.temp || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('sensors.pirEnabled')}
                                    <input type="checkbox" id="prof-pir-en" ${p.motion?.pir?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('sensors.pirHoldSec')}
                                    <input type="number" id="prof-pir-hold" min="0" value="${p.motion?.pir?.holdSec || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>
                </div>`;
    
            const segContainer = content.querySelector('#prof-segs');
            const currentSegs = JSON.parse(JSON.stringify(p.segments || []));

            // =========================================================
            // 세그먼트 순서 이동
            // =========================================================
            const _moveSeg = (idx, dir) => {
                const targetIdx = idx + dir;
                if (targetIdx < 0 || targetIdx >= currentSegs.length) return;
                const temp = currentSegs[idx];
                currentSegs[idx] = currentSegs[targetIdx];
                currentSegs[targetIdx] = temp;
                currentSegs.forEach((seg, i) => { seg.segNo = i * 10 + 10; });
                renderSegs(currentSegs);
            };

            // =========================================================
            // 세그먼트 삭제 Undo 지원
            // =========================================================
            const _removeWithUndo = (idx) => {
                if (currentSegs.length <= 1) {
                    SNW.ToastUtil.warn(SNW.I18n.t('validate.segmentMin'));
                    return;
                }
                const removed = currentSegs.splice(idx, 1)[0];
                renderSegs(currentSegs);

                const host = document.getElementById('toast-host');
                if (host) {
                    const tEl = document.createElement('div');
                    tEl.className = 'snw-toast snw-toast--warn';
                    tEl.style.cssText = 'display:flex;align-items:center;gap:12px;';
                    tEl.innerHTML = `
                        <span style="flex:1;">${SNW.I18n.t('segment.deleted')}</span>
                        <button type="button" style="background:none;border:none;color:var(--snw-primary);cursor:pointer;font-weight:600;text-decoration:underline;padding:0;font-size:13px;">
                            ${SNW.I18n.t('common.undo')}
                        </button>`;
                    tEl.querySelector('button').onclick = () => {
                        currentSegs.splice(idx, 0, removed);
                        renderSegs(currentSegs);
                        tEl.remove();
                    };
                    host.appendChild(tEl);
                    setTimeout(() => {
                        tEl.classList.add('snw-toast--out');
                        setTimeout(() => tEl.remove(), 300);
                    }, 5000);
                }
            };

            const renderSegs = (segs) => {
                segContainer.innerHTML = '';
                segs.forEach((seg, idx) => {
                    const ovr = seg.override || { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 };
                    const segDiv = document.createElement('div');
                    segDiv.className = 'snw-seg-card';
                    segDiv.style.cssText = 'background:var(--snw-surface);border:1px solid var(--snw-border);border-radius:8px;padding:12px;';
                    segDiv.innerHTML = `
                        <div class="snw-seg-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                            <span class="snw-seg-title" style="font-weight:bold;color:var(--snw-primary);">${t('scheduler.segment', '세그먼트')} ${idx + 1}</span>
                            <div style="display:flex;align-items:center;gap:4px;">
                                <button type="button" class="snw-btn-icon btn-preview-seg" data-preview-seg="${idx}" title="미리보기">🎬</button>
                                <button type="button" class="snw-btn-icon btn-move-up" data-move-up="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="${t('segment.moveUp', '위로')}">▲</button>
                                <button type="button" class="snw-btn-icon btn-move-down" data-move-down="${idx}" ${idx === segs.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="${t('segment.moveDown', '아래로')}">▼</button>
                                <button type="button" class="snw-btn-icon" data-remove-seg="${idx}" style="color:var(--snw-error);" title="${t('common.delete', '삭제')}">🗑</button>
                            </div>
                        </div>
                        <div class="snw-seg-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <label style="font-size:12px;">${t('segment.onMinutes', '작동 시간(분)')}
                                <input type="number" class="seg-on" min="0" max="1440" value="${seg.onMinutes}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="font-size:12px;">${t('segment.offMinutes', '정지 시간(분)')}
                                <input type="number" class="seg-off" min="0" max="1440" value="${seg.offMinutes}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="grid-column: span 2; font-size:12px;">${t('segment.mode', '모드')}
                                <select class="seg-mode" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                    <option value="PRESET" ${seg.mode === 'PRESET' ? 'selected' : ''}>${t('segment.modePreset', '프리셋 모드')}</option>
                                    <option value="FIXED"  ${seg.mode === 'FIXED'  ? 'selected' : ''}>${t('segment.modeFixed', '고정풍속 모드')}</option>
                                </select>
                            </label>
                            <div class="snw-seg-preset-area" style="grid-column: span 2; display: ${seg.mode === 'PRESET' ? 'grid' : 'none'}; grid-template-columns:1fr 1fr; gap:8px;">
                                <label style="font-size:12px;">${t('segment.presetSelect', '프리셋 선택')}
                                    <select class="seg-preset" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                        ${PRESET_CODES.map(c => `<option value="${c}" ${seg.presetCode === c ? 'selected' : ''}>${c} (${t('preset.' + c, c)})</option>`).join('')}
                                    </select>
                                </label>
                                <label style="font-size:12px;">${t('segment.styleSelect', '스타일 선택')}
                                    <select class="seg-style" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                        ${STYLE_CODES.map(c => `<option value="${c}" ${seg.styleCode === c ? 'selected' : ''}>${c} (${t('style.' + c, c)})</option>`).join('')}
                                    </select>
                                </label>
                                <details class="snw-accordion snw-seg-override" style="grid-column: span 2; margin-top:4px; border: 1px dashed var(--snw-border); border-radius: 6px; padding: 6px 10px;">
                                    <summary style="font-size:11.5px; font-weight:600; color:var(--snw-primary); cursor:pointer;">
                                        ${t('segment.overrideTitle', '⚙️ 고급 물리 설정 (Override 직접 지정)')}
                                    </summary>
                                    <div class="snw-accordion__content" style="padding-top:8px;">
                                        <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;margin-bottom:8px;cursor:pointer;">
                                            <input type="checkbox" class="seg-ovr-en" ${ovr.enabled ? 'checked' : ''}>
                                            <span>${t('segment.overrideDesc', '이 세그먼트에서 바람 세부 설정 직접 지정 (Override)')}</span>
                                        </label>
                                        <div class="seg-ovr-fields" style="${ovr.enabled ? '' : 'display:none;opacity:0.5;'}">
                                            <div class="snw-form-row" style="margin-bottom:8px;">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideIntensity', '바람 강도 (%)')}</label>
                                                    <b class="val-int-txt">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-int" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}" style="width:100%;">
                                                <div class="fb-int-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                            <div class="snw-form-row" style="margin-bottom:8px;">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideVariability', '바람 변동성 (%)')}</label>
                                                    <b class="val-var-txt">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-var" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}" style="width:100%;">
                                                <div class="fb-var-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                            <div class="snw-form-row">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideGust', '돌풍 빈도 (%)')}</label>
                                                    <b class="val-gust-txt">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 40}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-gust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 40}" style="width:100%;">
                                                <div class="fb-gust-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            <div class="snw-seg-fixed-area" style="grid-column: span 2; display: ${seg.mode === 'FIXED' ? 'block' : 'none'};">
                                <label style="font-size:12px;">${t('segment.fixedSpeed', '고정 풍속(%)')}
                                    <input type="number" class="seg-fixed" min="0" max="100" value="${seg.fixedSpeed || 0}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>`;

                    const modeSel = segDiv.querySelector('.seg-mode');
                    const presetArea = segDiv.querySelector('.snw-seg-preset-area');
                    const fixedArea = segDiv.querySelector('.snw-seg-fixed-area');

                    modeSel.addEventListener('change', (e) => {
                        const isPreset = e.target.value === 'PRESET';
                        presetArea.style.display = isPreset ? 'grid' : 'none';
                        fixedArea.style.display  = isPreset ? 'none' : 'block';
                    });

                    // Override 토글 및 실시간 가이드 연동
                    const ovrEn = segDiv.querySelector('.seg-ovr-en');
                    const ovrFields = segDiv.querySelector('.seg-ovr-fields');
                    ovrEn.addEventListener('change', () => {
                        ovrFields.style.display = ovrEn.checked ? 'block' : 'none';
                    });

                    const bindRange = (rangeSel, txtSel, fbSel, guideFn) => {
                        const rEl = segDiv.querySelector(rangeSel);
                        const tEl = segDiv.querySelector(txtSel);
                        const fEl = segDiv.querySelector(fbSel);
                        if (!rEl) return;
                        const sync = () => {
                            if (tEl) tEl.textContent = `${rEl.value}%`;
                            if (fEl && guideFn) {
                                const g = guideFn(Number(rEl.value));
                                fEl.textContent = g ? `▶ ${g.title}` : '';
                            }
                        };
                        rEl.addEventListener('input', sync);
                        sync();
                    };

                    bindRange('.seg-ovr-int',  '.val-int-txt',  '.fb-int-txt',  val => SNW.Feedback?.getIntensityGuide(val));
                    bindRange('.seg-ovr-var',  '.val-var-txt',  '.fb-var-txt',  val => SNW.Feedback?.getVariabilityGuide(val));
                    bindRange('.seg-ovr-gust', '.val-gust-txt', '.fb-gust-txt', val => SNW.Feedback?.getGustGuide(val));

                    // [SIM-5] 세그먼트 미리보기 바인딩
                    const prevBtn = segDiv.querySelector('.btn-preview-seg');
                    if (prevBtn) {
                        prevBtn.onclick = () => {
                            const segData = {
                                mode: segDiv.querySelector('.seg-mode')?.value || 'PRESET',
                                presetCode: segDiv.querySelector('.seg-preset')?.value || 'OCEAN',
                                styleCode:  segDiv.querySelector('.seg-style')?.value  || 'BALANCE',
                                fixedSpeed: Number(segDiv.querySelector('.seg-fixed')?.value || 0),
                                override: {
                                    enabled: segDiv.querySelector('.seg-ovr-en')?.checked || false,
                                    windIntensity:   Number(segDiv.querySelector('.seg-ovr-int')?.value || -1),
                                    windVariability: Number(segDiv.querySelector('.seg-ovr-var')?.value || -1),
                                    gustFrequency:   Number(segDiv.querySelector('.seg-ovr-gust')?.value || -1)
                                }
                            };
                            if (SNW.Preview && SNW.Preview.showModal) {
                                SNW.Preview.showModal(segData);
                            }
                        };
                    }

                    // 순서 이동 및 삭제 버튼 바인딩
                    const upBtn = segDiv.querySelector('.btn-move-up');
                    const downBtn = segDiv.querySelector('.btn-move-down');
                    if (upBtn) upBtn.onclick = () => _moveSeg(idx, -1);
                    if (downBtn) downBtn.onclick = () => _moveSeg(idx, 1);
                    segDiv.querySelector('[data-remove-seg]').addEventListener('click', () => _removeWithUndo(idx));

                    segContainer.appendChild(segDiv);
                });
            };
            renderSegs(currentSegs);

            content.querySelector('#btn-add-prof-seg').addEventListener('click', () => {
                currentSegs.push({
                    segNo: currentSegs.length * 10 + 10,
                    onMinutes: 20, offMinutes: 0, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    override: { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 },
                    fixedSpeed: 0
                });
                renderSegs(currentSegs);
            });

            SNW.UI.modal(
                isEdit ? SNW.I18n.t('common.edit') : SNW.I18n.t('profiles.add'),
                content,
                async () => {
                    const nameEl = content.querySelector('#prof-name');
                    nameEl.classList.remove('is-error');
                    if (!nameEl.value.trim()) {
                        nameEl.classList.add('is-error');
                        SNW.ToastUtil.error(SNW.I18n.t('validate.required', { field: SNW.I18n.t('profiles.name') }));
                        return false;
                    }

                    const newSegs = [];
                    segContainer.querySelectorAll('.snw-seg-card').forEach((card, idx) => {
                        const on   = Number(card.querySelector('.seg-on').value);
                        const off  = Number(card.querySelector('.seg-off').value);
                        const mode = card.querySelector('.seg-mode').value;
                        const seg = { segNo: idx * 10 + 10, onMinutes: on, offMinutes: off, mode };
                        if (mode === 'PRESET') {
                            seg.presetCode = card.querySelector('.seg-preset').value;
                            seg.styleCode  = card.querySelector('.seg-style').value;
                            const ovrEn = card.querySelector('.seg-ovr-en').checked;
                            seg.override = {
                                enabled: ovrEn,
                                windIntensity:   ovrEn ? Number(card.querySelector('.seg-ovr-int').value) : -1.0,
                                windVariability: ovrEn ? Number(card.querySelector('.seg-ovr-var').value) : -1.0,
                                gustFrequency:   ovrEn ? Number(card.querySelector('.seg-ovr-gust').value) : -1.0
                            };
                        } else {
                            seg.fixedSpeed = Number(card.querySelector('.seg-fixed').value);
                        }
                        newSegs.push(seg);
                    });

                    const body = {
                        profile: {
                            profileNo: Number(content.querySelector('#prof-no').value),
                            name: nameEl.value,
                            enabled: content.querySelector('#prof-enabled').checked,
                            repeatSegments: content.querySelector('#prof-repeat').checked,
                            repeatCount: Number(content.querySelector('#prof-repeat-count').value),
                            segments: newSegs,
                            autoOff: {
                                timer: {
                                    enabled: Number(content.querySelector('#prof-ao-timer').value) > 0,
                                    minutes: Number(content.querySelector('#prof-ao-timer').value)
                                },
                                offTime: {
                                    enabled: content.querySelector('#prof-ao-offtime-en').checked,
                                    time: content.querySelector('#prof-ao-offtime').value
                                },
                                offTemp: {
                                    enabled: content.querySelector('#prof-ao-offtemp-en').checked,
                                    temp: Number(content.querySelector('#prof-ao-offtemp').value)
                                }
                            },
                            motion: {
                                pir: {
                                    enabled: content.querySelector('#prof-pir-en').checked,
                                    holdSec: Number(content.querySelector('#prof-pir-hold').value)
                                }
                            }
                        }
                    };

                    try {
                        if (isEdit) await SNW.Api.updateProfile(p.profileId, body);
                        else        await SNW.Api.addProfile(body);
                        await SNW.Api.saveConfig();
                        SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                        await this._load();
                        return true;
                    } catch (e) {
                        SNW.ErrorHandler.handle(e, 'profile.save');
                        return false;
                    }
                },
                null,
                { width: '520px' }
            );
        }

        async _onDelete(id) {
            if (!confirm(SNW.I18n.t('msg.deleteConfirm'))) return;
            try {
                await SNW.Api.deleteProfile(id);
                await SNW.Api.saveConfig();
                await this._load();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.delete');
            }
        }

        async _onStart(profileNo) {
            try {
                await SNW.Api.selectProfile(profileNo);
                SNW.ToastUtil.success(SNW.I18n.t('dashboard.modeSwitchedProfile'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.start');
            }
        }

        async _onStop() {
            try {
                await SNW.Api.stopProfile();
                SNW.ToastUtil.success(SNW.I18n.t('msg.success'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.stop');
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


/* ---- 245.page.simulation.js (11493 bytes) ---- */
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

                    this._updatePreview();
                    this._renderAdvanced(data);
                } catch (e) { SNW.LogUtil.warn('[Sim] load 실패', e); }
            }

        _updatePreview() {
                                const pc = this.el.querySelector('#sim-presets .is-selected')?.dataset.code || 'OCEAN';
                                const sc = this.el.querySelector('#sim-styles .is-active')?.dataset.style || 'BALANCE';
                                if (!SNW.Preview || !SNW.Preview.generate) return;
                                const pv = SNW.Preview.generate(pc, sc, null);
                                if (!pv) return;
                                const cv = this.el.querySelector('[data-pv-canvas]');
                                if (cv) SNW.Preview._animate(cv, pv.points);
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

        _renderAdvanced(data) {
                                const slot = this.el.querySelector('[data-slot="advanced"]');
                                if (!slot) return;
                                const m = data?.motion?.motion || SNW.Store.get()._motionCache || {};
                                const t = m.timing || {};
                                const s = m.sim || {};
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


/* ---- 260.page.monitor.js (17180 bytes) ---- */
// =========================================================
// 260.page.monitor.js — SNW.Page.Monitor (MON-C + MON-E + MON-F)
// 4 레이어: 상태 타임라인 / 풍속·PWM / 이벤트 / 현재 설정 + 지난 이벤트 7일
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
    (function (SNW) {
        'use strict';

        SNW.Page.Monitor = class Monitor {
            constructor(container) {
                this.el = container;
                this._active = true;
                this._range = '5m';
                this._unsubs = [];
                this._timers = [];
                this._stateColors = {
                    0: '#59636e', 1: '#4a9eff', 2: '#3fb950', 3: '#2dd4bf',
                    4: '#d29922', 5: '#f0883e', 6: '#f85149'
                };
            }

            async mount() {
                this.el.innerHTML = '';
                this._renderShell();
                await this._refresh();
                SNW.WsManager.get('state')?.onMessage(() => {
                    if (this._active) this._refresh();
                });

                // 탭 전환 (실시간 vs 지난 이벤트)
                this.el.querySelectorAll('[data-tab]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const tab = btn.getAttribute('data-tab');
                        this.el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('is-active', b === btn));
                        this.el.querySelectorAll('[data-tab-content]').forEach(c => {
                            c.style.display = c.getAttribute('data-tab-content') === tab ? 'block' : 'none';
                        });
                        if (tab === 'past') this._loadPastEvents();
                    });
                });

                // 시간 범위 버튼
                this.el.querySelectorAll('[data-range]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this._range = btn.getAttribute('data-range');
                        this.el.querySelectorAll('[data-range]').forEach(b =>
                            b.classList.toggle('is-active', b === btn));
                        this._refresh();
                    });
                });

                // 새로고침 버튼
                const refreshBtn = this.el.querySelector('[data-action="refresh"]');
                if (refreshBtn) refreshBtn.onclick = () => this._refresh();

                // CSV 다운로드 버튼
                const csvBtn = this.el.querySelector('[data-action="csv"]');
                if (csvBtn) {
                    csvBtn.onclick = () => {
                        const url = `${SNW.CFG.API.monitor}/export?type=wind&range=${this._range}&format=csv`;
                        window.open(url, '_blank');
                    };
                }

                // 지난 이벤트 새로고침
                const pastRefreshBtn = this.el.querySelector('[data-action="past-refresh"]');
                if (pastRefreshBtn) pastRefreshBtn.onclick = () => this._loadPastEvents();
            }

            unmount() { this._active = false; this._timers.forEach(id => clearInterval(id)); }

            _renderShell() {
                this.el.innerHTML = `
                <section class="snw-card">
                    <h2>🎛 선풍기 모니터링</h2>
                    <div class="snw-tabs" style="margin-bottom:12px;display:flex;gap:4px;">
                        <button type="button" class="snw-tab-btn is-active" data-tab="live">📊 실시간</button>
                        <button type="button" class="snw-tab-btn" data-tab="past">📅 지난 이벤트 (7일)</button>
                    </div>
                    <div data-tab-content="live">
                        <div class="snw-toolbar" style="gap:4px;display:flex;align-items:center;">
                            <button type="button" class="snw-tab-btn is-active" data-range="5m">⏱ 5분</button>
                            <button type="button" class="snw-tab-btn" data-range="30m">⏱ 30분</button>
                            <button type="button" class="snw-tab-btn" data-range="1h">⏱ 1시간</button>
                            <span style="flex:1;"></span>
                            <button type="button" class="snw-btn" data-action="refresh">🔄</button>
                            <button type="button" class="snw-btn" data-action="csv">📥 CSV</button>
                        </div>
                        <h3 style="margin-top:16px;">📊 상태 타임라인</h3>
                        <div data-slot="timeline" style="position:relative;height:32px;background:var(--snw-bg-2);border-radius:4px;margin-bottom:16px;overflow:hidden;"></div>
                        <h3>🌬 풍속 / PWM</h3>
                        <div data-slot="wind" style="height:200px;background:var(--snw-bg-2);border-radius:4px;margin-bottom:16px;"></div>
                        <h3>📌 이벤트</h3>
                        <div data-slot="events" style="max-height:240px;overflow-y:auto;background:var(--snw-bg-2);border-radius:4px;padding:8px;font-size:12px;"></div>
                        <h3 style="margin-top:16px;">🎛 현재 설정</h3>
                        <div data-slot="current" style="background:var(--snw-surface-2);padding:12px;border-radius:4px;font-size:13px;"></div>
                    </div>
                    <div data-tab-content="past" style="display:none;">
                        <div class="snw-toolbar" style="display:flex;gap:8px;align-items:center;">
                            <label style="font-size:12px;">조회 기간:</label>
                            <select id="past-days" style="padding:4px 8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                <option value="1">1일</option>
                                <option value="3">3일</option>
                                <option value="7" selected>7일</option>
                            </select>
                            <label style="font-size:12px;margin-left:4px;">유형:</label>
                            <select id="past-kind" style="padding:4px 8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                <option value="all">전체</option>
                                <option value="state">상태</option>
                                <option value="config">설정</option>
                                <option value="system">시스템</option>
                            </select>
                            <button type="button" class="snw-btn" data-action="past-refresh">🔄</button>
                        </div>
                        <div data-slot="past-events" style="max-height:500px;overflow-y:auto;background:var(--snw-bg-2);border-radius:4px;padding:8px;font-size:12px;margin-top:8px;"></div>
                    </div>
                </section>`;
            }

            async _refresh() {
                try {
                    const [wind, state, config, system, current] = await Promise.all([
                        SNW.Api.getMonitor('wind', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getMonitor('state', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getMonitor('config', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getMonitor('system', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getState().catch(() => ({}))
                    ]);
                    if (!this._active) return;
                    this._renderTimeline(state?.data || []);
                    this._renderWindChart(wind?.data || []);
                    this._renderEvents(state?.data || [], config?.data || [], system?.data || []);
                    this._renderCurrent(current?.control, current?.sim);
                } catch (e) {
                    SNW.LogUtil.warn('[Monitor] refresh 실패', e);
                }
            }

            async _loadPastEvents() {
                const days = Number(this.el.querySelector('#past-days')?.value || 7);
                try {
                    const data = await SNW.Api.getPastEvents(days);
                    const slot = this.el.querySelector('[data-slot="past-events"]');
                    if (!slot) return;
                    const events = (data?.events || []).sort((a, b) => b.t - a.t);
                    if (!events.length) {
                        slot.innerHTML = '<div style="color:var(--snw-text-dim);padding:8px;">이벤트 없음</div>';
                        return;
                    }
                    const groups = {};
                    events.forEach(e => {
                        const d = new Date(e.t * 1000).toLocaleDateString('ko-KR');
                        (groups[d] = groups[d] || []).push(e);
                    });
                    slot.innerHTML = Object.entries(groups).map(([date, list]) => `
                    <div style="padding:8px;border-bottom:1px solid var(--snw-border);font-weight:600;">📅 ${date}</div>
                    ${list.map(e => {
                        const time = new Date(e.t * 1000).toLocaleTimeString('ko-KR', { hour12: false });
                        let icon = '•', text = '';
                        if (e.kind === 'state') {
                            icon = e.new === 3 ? '🟢' : e.new === 5 ? '🛑' : e.new === 4 ? '🟡' : '⚪';
                            text = `<b>${SNW.FsmUtil.getState(e.new).label}</b>`;
                        } else if (e.kind === 'config') {
                            icon = '⚙️';
                            const keys = ['프리셋', '스타일', '강도', '변동', '돌풍'];
                            text = `<b>${keys[e.type] || '설정'}</b> ${e.old} → ${e.new}`;
                        } else {
                            icon = '⚠️';
                            text = `<b>시스템</b> type=${e.type}`;
                        }
                        return `<div style="display:flex;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span style="color:var(--snw-text-faint);font-family:monospace;min-width:70px;">${time}</span>
                            <span>${icon}</span><span>${text}</span>
                        </div>`;
                    }).join('')}
                `).join('');
                } catch (e) { SNW.LogUtil.warn('[Monitor] past events 실패', e); }
            }

            _renderTimeline(events) {
                const slot = this.el.querySelector('[data-slot="timeline"]');
                if (!slot || !events.length) {
                    if (slot) slot.innerHTML = '<div style="padding:8px;font-size:12px;color:var(--snw-text-dim);">이벤트 없음</div>';
                    return;
                }
                const first = events[0].t, last = events[events.length - 1].t;
                const total = Math.max(1, last - first);
                slot.innerHTML = '';
                events.forEach((e, i) => {
                    const next = i + 1 < events.length ? events[i + 1].t : last;
                    const left = ((e.t - first) / total) * 100;
                    const width = Math.max(0.5, ((next - e.t) / total) * 100);
                    const div = document.createElement('div');
                    div.style.cssText = `position:absolute;left:${left}%;width:${width}%;height:100%;background:${this._stateColors[e.new] || '#555'};`;
                    div.title = `${SNW.FsmUtil.getState(e.new).label} (${new Date(e.t * 1000).toLocaleTimeString()})`;
                    slot.appendChild(div);
                });
                slot.style.position = 'relative';
                slot.style.overflow = 'hidden';
            }

            _renderWindChart(points) {
                const slot = this.el.querySelector('[data-slot="wind"]');
                if (!slot || !points.length) {
                    if (slot) slot.innerHTML = '<div style="padding:8px;font-size:12px;color:var(--snw-text-dim);">데이터 없음</div>';
                    return;
                }
                slot.innerHTML = '';
                const cv = document.createElement('canvas');
                cv.width = slot.clientWidth || 600;
                cv.height = 200;
                cv.style.width = '100%'; cv.style.height = '100%';
                slot.appendChild(cv);
                const ctx = cv.getContext('2d');
                const w = cv.width, h = cv.height;
                const values = points.map(p => p.avg);
                const min = Math.min(...values), max = Math.max(...values);
                const range = Math.max(1, max - min);

                // grid
                ctx.strokeStyle = 'rgba(139,148,158,0.15)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = (h / 4) * i;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }

                // line
                ctx.strokeStyle = '#4a9eff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                points.forEach((p, i) => {
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.avg - min) / range) * (h - 20) - 10;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // gust markers
                points.forEach((p, i) => {
                    if (!p.gust) return;
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.avg - min) / range) * (h - 20) - 10;
                    ctx.fillStyle = 'rgba(240,136,62,0.9)';
                    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
                });
            }

            _renderEvents(states, configs, systems) {
                const slot = this.el.querySelector('[data-slot="events"]');
                if (!slot) return;
                const merged = [
                    ...states.map(e => ({ t: e.t, kind: 'state', e })),
                    ...configs.map(e => ({ t: e.t, kind: 'config', e })),
                    ...systems.map(e => ({ t: e.t, kind: 'system', e }))
                ].sort((a, b) => b.t - a.t).slice(0, 50);

                if (!merged.length) {
                    slot.innerHTML = '<div style="color:var(--snw-text-dim);">이벤트 없음</div>';
                    return;
                }

                slot.innerHTML = merged.map(({ kind, e }) => {
                    const time = new Date(e.t * 1000).toLocaleTimeString('ko-KR', { hour12: false });
                    let icon = '•', text = '';
                    if (kind === 'state') {
                        icon = e.new === 3 ? '🟢' : e.new === 5 ? '🛑' : e.new === 4 ? '🟡' : '⚪';
                        text = `<b>${SNW.FsmUtil.getState(e.new).label}</b>`;
                        if (e.new === 3) text += ` (${e.preset || '?'} · segNo ${e.segNo})`;
                    } else if (kind === 'config') {
                        icon = '⚙️';
                        const keys = ['프리셋', '스타일', '강도', '변동', '돌풍'];
                        text = `<b>${keys[e.type] || '설정'}</b> ${e.old} → ${e.new}`;
                    } else if (kind === 'system') {
                        icon = '⚠️';
                        text = `<b>시스템 이벤트</b> (type=${e.type})`;
                    }
                    return `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--snw-border);">
                    <span style="color:var(--snw-text-faint);font-family:monospace;">${time}</span>
                    <span>${icon}</span>
                    <span>${text}</span>
                </div>`;
                }).join('');
            }

            _renderCurrent(ctl, sim) {
                const slot = this.el.querySelector('[data-slot="current"]');
                if (!slot || !ctl) return;
                const stateMeta = SNW.FsmUtil.getState(ctl.stateCode || 0);
                slot.innerHTML = `
                <div><b>상태:</b> ${stateMeta.icon} ${stateMeta.label} · <i>${SNW.FsmUtil.getReason(ctl.reasonCode || 0).label}</i></div>
                <div style="margin-top:4px;"><b>프리셋:</b> ${sim?.presetCode || '-'} · <b>스타일:</b> ${sim?.styleCode || '-'}</div>
                <div style="margin-top:4px;"><b>강도:</b> ${Math.round(sim?.intensity || 0)}% · <b>변동:</b> ${Math.round(sim?.variability || 0)}% · <b>돌풍:</b> ${Math.round(sim?.gustFreq || 0)}%</div>
                <div style="margin-top:4px;"><b>현재:</b> ${(sim?.windSpeed || 0).toFixed(1)} m/s · PWM ${(sim?.pwmDuty || 0).toFixed(0)}%</div>
            `;
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

/* ---- 290.page.ai.js (4571 bytes) ---- */
// =========================================================
// 290.page.ai.js — SNW.Page.AI
// Layer 4 (페이지 로직)
// [P1-14] 예시 텍스트 i18n 이관
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	const MAX_MSG_LEN = 4000;
	
	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);
			
			const slot = this.el.querySelector('[data-slot="chat"]');
			const examplePlaceholder = SNW.I18n.t('ai.placeholder');
			
			slot.innerHTML = `
                <div class="snw-ai-chat">
                    <div class="snw-ai-messages" data-slot="messages"></div>
                    <div class="snw-ai-examples" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                        <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example1')}">${SNW.I18n.t('ai.example1')}</button>
                        <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example2')}">${SNW.I18n.t('ai.example2')}</button>
                        <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example3')}">${SNW.I18n.t('ai.example3')}</button>
                    </div>
                    <div class="snw-ai-input">
                        <textarea data-slot="input" rows="3"
                                  placeholder="${SNW.DomUtil.escape(examplePlaceholder)}"
                                  maxlength="${MAX_MSG_LEN}"></textarea>
                        <button type="button" class="snw-btn snw-btn-primary" data-action="send">
                            ${SNW.I18n.t('ai.send')}
                        </button>
                    </div>
                </div>`;
			
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
			
			// [P1-14] 예시 버튼 클릭 → textarea에 채움
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
			
			SNW.LogUtil.info('[AI] mount 완료');
		}
		
		unmount() { this._active = false; }
		
		async _onSend() {
			const inp = this.el.querySelector('[data-slot="input"]');
			const msg = (inp && inp.value || '').trim();
			if (!msg) return;
			inp.value = '';
			
			this._appendMessage('user', msg);
			this._appendMessage('assistant', SNW.I18n.t('ai.thinking'));
			
			try {
				const body = {
					contents: [{ parts: [{ text: msg }] }]
				};
				const res = await SNW.Api.gemini(body);
				if (!this._active) return;
				
				let text = '';
				try {
					const candidates = res && res.candidates;
					if (candidates && candidates[0] && candidates[0].content &&
						candidates[0].content.parts && candidates[0].content.parts[0]) {
						text = candidates[0].content.parts[0].text || '';
					} else if (typeof res === 'string') {
						text = res;
					} else if (res && res.text) {
						text = res.text;
					}
				} catch {}
				
				if (!text) text = '(no response)';
				this._replaceLastAssistant(text);
			} catch (e) {
				this._replaceLastAssistant('[ERROR] ' + (e.message || 'failed'));
				SNW.ErrorHandler.handle(e, 'ai.send');
			}
		}
		
		_appendMessage(role, text) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const cls = role === 'user' ? 'is-user' : 'is-assistant';
			wrap.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-msg ${cls}">
                    <div class="snw-ai-bubble">${text}</div>
                </div>`);
			wrap.scrollTop = wrap.scrollHeight;
		}
		
		_replaceLastAssistant(text) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const list = wrap.querySelectorAll('.snw-ai-msg.is-assistant');
			const last = list[list.length - 1];
			if (last) {
				const bubble = last.querySelector('.snw-ai-bubble');
				if (bubble) bubble.textContent = text;
			}
			wrap.scrollTop = wrap.scrollHeight;
		}
	};
})(window.SNW);

/* ===== LAYER 3 ===== */

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
                            <a href="/UserManual_0202_001.md" target="_blank"
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

/* ===== LAYER 9 ===== */

/* ---- 999.app.js (14229 bytes) ---- */
// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
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
        
        let closed = false;
        const close = (confirmed) => {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', _onEsc);
            overlay.classList.remove('is-open');
            setTimeout(() => {
                overlay.innerHTML = '';
                overlay.style.display = 'none';
                if (!confirmed && typeof onCancel === 'function') {
                    try { onCancel(); } catch (e) {}
                }
            }, 150);
        };
        
        const _onEsc = (e) => { if (e.key === 'Escape') close(false); };
        document.addEventListener('keydown', _onEsc);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        
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
                } catch (e) {} finally { btnOk.disabled = false; }
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

    window.SNW_BOOT = async function() {
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
            SNW.Router.init();
            SNW.LogUtil.info('App bootstrap complete');
        } catch (e) {
            SNW.LogUtil.error('bootstrap failed', e);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.SNW_BOOT(); });
    } else {
        window.SNW_BOOT();
    }

    // [U-B5] 첫 방문 온보딩
    function _maybeShowOnboarding() {
        if (localStorage.getItem('snw.onboarded') === '1') return;
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="snw-onboarding" style="text-align:center;padding:12px;">
                <h3 style="color:var(--snw-primary);margin-bottom:8px;">🌿 Smart Nature Wind</h3>
                <p style="font-size:13px;line-height:1.5;">실제 자연의 바람을 재현하는 스마트 선풍기입니다.</p>
                <p style="color:var(--snw-text-dim);font-size:12px;margin-top:6px;">
                    일반 선풍기와 달리 파도, 숲, 산바람 등 10가지 자연풍을 재현합니다.
                </p>
            </div>
            <div style="text-align:right;font-size:11px;color:var(--snw-text-faint);margin-top:12px;">
                💡 언제든지 우측 상단 🌐로 언어를 바꿀 수 있습니다.
            </div>`;
        SNW.UI.modal('환영합니다', content, () => {
            localStorage.setItem('snw.onboarded', '1');
            return true;
        }, null, { okLabel: '시작하기', hideCancel: true, width: '440px' });
    }

    // [U-B8] 야간 자동 감광
    function _applyNightMode() {
        const h = new Date().getHours();
        const isNight = (h >= 22 || h < 6);
        document.body.classList.toggle('snw-night-mode', isNight);
    }
    _applyNightMode();
    setInterval(_applyNightMode, 60000);
    setTimeout(_maybeShowOnboarding, 1500);

})(window.SNW);

