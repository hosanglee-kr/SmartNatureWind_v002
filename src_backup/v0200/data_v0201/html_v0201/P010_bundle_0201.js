
/* ===== LAYER 0 ===== */

/* ---- 000.const.js (7867 bytes) ---- */
// =========================================================
// 000.const.js — 프론트엔드 상수 (변경 불변)
// Layer 0 (기반) — 어떤 모듈도 참조하지 않음
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.C = {
        // =====================================================
        // 사용자 레벨 (L1~L4)
        // =====================================================
        LEVEL: {
            L1: 'L1', L2: 'L2', L3: 'L3', L4: 'L4',
            ORDER: ['L1', 'L2', 'L3', 'L4']
        },

        // =====================================================
        // CT10 7-State FSM (SPEC §2.2)
        // =====================================================
        FSM_STATE: {
            IDLE: 0, OVERRIDE: 1, PROFILE_RUN: 2, SCHEDULE_RUN: 3,
            MOTION_BLOCKED: 4, AUTOOFF_STOPPED: 5, TIME_INVALID: 6
        },
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
        // CT10 Reason Code (SPEC §2.2)
        // =====================================================
        FSM_REASON: {
            NONE: 0, OVERRIDE_ACTIVE: 1, PROFILE_MODE: 2, USER_PROFILE_ACTIVE: 3,
            SCHEDULE_ACTIVE: 4, NO_ACTIVE_SCHEDULE: 5, NO_SCHEDULES: 6,
            TIME_NOT_VALID: 7, MOTION_NO_PRESENCE: 8,
            AUTOOFF_TIMER: 9, AUTOOFF_TIME: 10, AUTOOFF_TEMP: 11
        },
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
        // S10 Wind Phase
        // =====================================================
        WIND_PHASE: { CALM: 'CALM', NORMAL: 'NORMAL', STRONG: 'STRONG' },
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


/* ---- 010.config.js (5160 bytes) ---- */
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



/* ---- 020.i18n.js (22182 bytes) ---- */
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
            'nav.schedule':    '스케줄',
            'nav.profiles':    '프로필',
            'nav.sensors':     '센서',
            'nav.settings':    '설정',
            'nav.network':     '네트워크',
            'nav.logs':        '로그',
            'nav.diagnostics': '진단',
            'nav.firmware':    '펌웨어',
            'nav.ai':          'AI',
            'nav.info':        '정보',

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
            'log.clear':  '지우기',
            'log.export': '내보내기',

            // --- 센서 ---
            'sensor.title':       '센서 및 모션',
            'sensor.temperature': '온도',
            'sensor.humidity':    '습도',
            'sensor.motion':      '인체감지',
            'sensor.holdSec':     '유지 시간',
            'sensor.pirFeed':     'PIR 피드 테스트',
            'sensor.dht22':       'DHT22 설정',
            'sensor.pir':         'PIR 설정',

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

            // --- 프로필 ---
            'profile.title':  '사용자 프로필',
            'profile.start':  '시작',
            'profile.stop':   '정지',
            'profile.active': '활성 프로필',

            // --- 시스템 ---
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

            // --- 진단 ---
            'diag.title':    '시스템 진단',
            'diag.heap':     'Heap 사용',
            'diag.fs':       '파일시스템',
            'diag.uptime':   '업타임',
            'diag.dirty':    'Dirty Flags',
            'diag.reloadOk': 'Reload 결과',

            // --- 펌웨어 ---
            'firmware.title':       '펌웨어 관리',
            'firmware.version':     '현재 버전',
            'firmware.ota':         'OTA 업데이트',
            'firmware.upload':      '파일 업로드',
            'firmware.progress':    '진행률',
            'firmware.checkUpdate': '업데이트 확인',

            // --- AI ---
            'ai.title':       'AI 어시스턴트',
            'ai.send':        '전송',
            'ai.thinking':    '생각 중...',
            'ai.placeholder': '예: "10분 후 꺼줘" 또는 "지금 상태 진단해줘"',

            // --- 에러/성공 메시지 ---
            'msg.apiKeyRequired': 'API 키가 필요합니다',
            'msg.reloadPending':  '재로드 진행 중입니다',
            'msg.noChange':       '변경 사항 없음',
            'msg.saveSuccess':    '저장되었습니다',
            'msg.reloadSuccess':  '설정이 적용되었습니다',
            'msg.reloadFail':     '설정 적용 실패',
            'msg.networkError':   '네트워크 오류',
            'msg.timeout':        '요청 시간 초과',
            'msg.unknown':        '알 수 없는 오류가 발생했습니다',
            'msg.accessDenied':   '이 페이지에 접근할 수 없습니다 (레벨 제한)',

            // --- 단위 ---
            'unit.celsius':   '°C',
            'unit.humidity':  '%',
            'unit.windSpeed': 'm/s',
            'unit.percent':   '%',
            'unit.seconds':   '초',
            'unit.minutes':   '분',
            'unit.ms':        'ms'
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
            'nav.schedule':    'Schedule',
            'nav.profiles':    'Profiles',
            'nav.sensors':     'Sensors',
            'nav.settings':    'Settings',
            'nav.network':     'Network',
            'nav.logs':        'Logs',
            'nav.diagnostics': 'Diagnostics',
            'nav.firmware':    'Firmware',
            'nav.ai':          'AI',
            'nav.info':        'Info',

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

            'scheduler.title':      'Scheduler',
            'scheduler.enabled':    'Enabled',
            'scheduler.day':        'Day',
            'scheduler.start':      'Start',
            'scheduler.end':        'End',
            'scheduler.segment':    'Segment',
            'scheduler.on':         'On',
            'scheduler.off':        'Off',
            'scheduler.overlapWarn':'Time overlap detected',

            'profile.title':  'User Profiles',
            'profile.start':  'Start',
            'profile.stop':   'Stop',
            'profile.active': 'Active Profile',

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

            'diag.title':    'Diagnostics',
            'diag.heap':     'Heap',
            'diag.fs':       'File System',
            'diag.uptime':   'Uptime',
            'diag.dirty':    'Dirty Flags',
            'diag.reloadOk': 'Reload Result',

            'firmware.title':       'Firmware',
            'firmware.version':     'Current Version',
            'firmware.ota':         'OTA Update',
            'firmware.upload':      'Upload File',
            'firmware.progress':    'Progress',
            'firmware.checkUpdate': 'Check Update',

            'ai.title':       'AI Assistant',
            'ai.send':        'Send',
            'ai.thinking':    'Thinking...',
            'ai.placeholder': 'e.g., "Turn off in 10 minutes" or "Diagnose now"',

            'msg.apiKeyRequired': 'API Key required',
            'msg.reloadPending':  'Reload in progress',
            'msg.noChange':       'No changes',
            'msg.saveSuccess':    'Saved',
            'msg.reloadSuccess':  'Settings applied',
            'msg.reloadFail':     'Failed to apply settings',
            'msg.networkError':   'Network error',
            'msg.timeout':        'Timeout',
            'msg.unknown':        'Unknown error',
            'msg.accessDenied':   'Access denied (level restricted)',

            'unit.celsius':   '°C',
            'unit.humidity':  '%',
            'unit.windSpeed': 'm/s',
            'unit.percent':   '%',
            'unit.seconds':   's',
            'unit.minutes':   'm',
            'unit.ms':        'ms'
        }
    };

    const SUPPORTED_LANGS = ['ko', 'en'];
    let currentLang = localStorage.getItem(SNW.CFG.LS_KEY.LANG) || 'ko';
    if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = 'ko';

    SNW.I18n = {
        getLang() { return currentLang; },
        setLang(lang) {
            if (!SUPPORTED_LANGS.includes(lang)) return;
            currentLang = lang;
            localStorage.setItem(SNW.CFG.LS_KEY.LANG, lang);
            document.documentElement.lang = lang;
            document.dispatchEvent(new CustomEvent('snw:langchange', { detail: { lang } }));
        },
        /**
         * @param {string} key     번역 키
         * @param {object} params  치환 파라미터 {n: 5} → "{n}" 치환
         * @returns {string}
         */
        t(key, params) {
            const dict = DICT[currentLang] || DICT.ko;
            let s = dict[key] != null ? dict[key] : (DICT.ko[key] != null ? DICT.ko[key] : key);
            if (params) {
                s = s.replace(/\{(\w+)\}/g, (m, k) => params[k] != null ? String(params[k]) : m);
            }
            return s;
        },
        /** data-i18n / data-i18n-attr 자동 적용 */
        applyTo(root) {
            (root || document).querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) el.textContent = this.t(key);
            });
            (root || document).querySelectorAll('[data-i18n-attr]').forEach(el => {
                el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
                    const [attr, k] = pair.split(':').map(s => s.trim());
                    if (attr && k) el.setAttribute(attr, this.t(k));
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


/* ---- 030.util.time.js (1964 bytes) ---- */
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
		
		/** durationMs → "N.N초" */
		msToSecLabel(ms) {
			if (!Number.isFinite(ms) || ms < 0) return "0.0초";
			return (ms / 1000).toFixed(1) + "초";
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


/* ---- 031.util.dom.js (1675 bytes) ---- */
// =========================================================
// 031.util.dom.js — SNW.DomUtil
// Layer 1 (유틸) — SNW.C 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
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


/* ---- 033.util.template.js (6918 bytes) ---- */
// =========================================================
// 033.util.template.js — SNW.Tpl (페이지 HTML 템플릿)
// Layer 1 (유틸) — SNW.C, SNW.DomUtil 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// tagged template → HTMLElement
	function tpl(strings, ...vals) {
		return SNW.DomUtil.html(strings, ...vals);
	}
	
	SNW.Tpl = {
		tpl,
		
		// =====================================================
		// Dashboard (L1 MVP 확정판)
		//  - data-slot 계약: badge / cur-wind / gauge / power / presets / intensity / sensors
		// =====================================================
		dashboard() {
			return tpl`
                <div class="snw-dashboard">
                    <section class="snw-card snw-card--state">
                        <h2 data-i18n="dashboard.realtimeState">실시간 상태</h2>
                        <div data-slot="badge" class="snw-state-badge"></div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.currentWind">현재 풍속</span>
                            <b data-slot="cur-wind">-</b>
                            <span data-i18n="unit.windSpeed">m/s</span>
                        </div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.targetWind">목표 풍속</span>
                            <b data-slot="target-wind">-</b>
                            <span data-i18n="unit.windSpeed">m/s</span>
                        </div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.phase">Phase</span>
                            <b data-slot="phase">-</b>
                        </div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.pwmOutput">PWM</span>
                            <span data-slot="gauge"></span>
                        </div>
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
                        <h2 data-i18n="dashboard.presetTitle">프리셋 선택</h2>
                        <div data-slot="presets"></div>
                    </section>

                    <section class="snw-card snw-card--slider">
                        <h2 data-i18n="dashboard.intensityTitle">강도 조절</h2>
                        <div data-slot="intensity"></div>
                    </section>
                </div>`;
		},
		
		// =====================================================
		// Chart (stub, Phase 5)
		// =====================================================
		chart() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="chart.title">실시간 물리 차트</h2>
                    <div class="snw-chart-toolbar">
                        <select data-slot="range">
                            <option value="5"   data-i18n="chart.range5">5초</option>
                            <option value="30"  data-i18n="chart.range30">30초</option>
                            <option value="120" selected data-i18n="chart.range120">120초</option>
                        </select>
                        <button data-action="export" data-i18n="chart.export">CSV</button>
                    </div>
                    <div data-slot="chart" class="snw-chart-area"></div>
                </section>`;
		},
		
		// =====================================================
		// Settings (stub)
		// =====================================================
		settings() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="system.title">시스템 설정</h2>
                    <div data-slot="form-log"></div>
                    <div data-slot="form-api"></div>
                    <div class="snw-form-actions">
                        <button data-action="save"   class="snw-btn snw-btn-primary" data-i18n="system.save">저장</button>
                        <button data-action="reload" class="snw-btn"                 data-i18n="system.reload">재로드</button>
                    </div>
                </section>`;
		},
		
		// =====================================================
		// 나머지 페이지 (stub, Phase 5)
		// =====================================================
		schedule() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="scheduler.title">스케줄 예약</h2>
                    <div data-slot="list"></div>
                </section>`;
		},
		profiles() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="profile.title">사용자 프로필</h2>
                    <div data-slot="list"></div>
                </section>`;
		},
		sensors() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="sensor.title">센서 및 모션</h2>
                    <div data-slot="sensors"></div>
                </section>`;
		},
		network() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="network.title">네트워크 및 시간</h2>
                    <div data-slot="form"></div>
                </section>`;
		},
		logs() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="log.title">시스템 로그</h2>
                    <div data-slot="log"></div>
                </section>`;
		},
		diagnostics() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="diag.title">시스템 진단</h2>
                    <div data-slot="panel"></div>
                </section>`;
		},
		firmware() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="firmware.title">펌웨어 관리</h2>
                    <div data-slot="form"></div>
                </section>`;
		},
		ai() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="ai.title">AI 어시스턴트</h2>
                    <div data-slot="chat"></div>
                </section>`;
		},
		info() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.info">정보</h2>
                    <div data-slot="panel"></div>
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


/* ---- 040.api.js (9504 bytes) ---- */
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
	SNW.Api = {
		// --- 메타 ---
		version() { return _fetch(SNW.CFG.API.version); },
		diag() { return _fetch(SNW.CFG.API.diag); },
		
		// --- 상태 ---
		getState() { return _fetch(SNW.CFG.API.state); },
		getMetrics() { return _fetch(SNW.CFG.API.metrics); },
		getSummary() { return _fetch(SNW.CFG.API.controlSummary); },
		
		// --- 제어 (v0201) ---
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
		
		// --- 시뮬레이션 ---
		patchSim(patch) {
			return _fetch(SNW.CFG.API.simulation, { method: 'POST', body: { sim: patch } });
		},
		getSim() { return _fetch(SNW.CFG.API.simulation); },
		getSimState() { return _fetch(SNW.CFG.API.simState); },
		
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
	};
	
})(window.SNW);


/* ---- 050.ws.js (4736 bytes) ---- */
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


/* ---- 070.router.js (6110 bytes) ---- */
// =========================================================
// 070.router.js — SNW.Router (해시 기반 SPA 라우터)
// Layer 2 (서비스) — Layer 0~1 참조
//  - ROUTES 정의 (12 페이지)
//  - hashchange 감지 → dispatch
//  - 이전 페이지 unmount → 새 페이지 mount
//  - 사용자 레벨 필터
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// =====================================================
	// 라우트 정의
	//  - path: 해시 경로
	//  - page: SNW.Page 클래스 키 (capitalize 후 매칭)
	//  - level: 최소 사용자 레벨
	// =====================================================
	const ROUTES = {
		'/dashboard': { page: 'dashboard', level: 'L1' },
		'/chart': { page: 'chart', level: 'L2' },
		'/schedule': { page: 'schedule', level: 'L2' },
		'/profiles': { page: 'profiles', level: 'L2' },
		'/sensors': { page: 'sensors', level: 'L2' },
		'/settings': { page: 'settings', level: 'L3' },
		'/network': { page: 'network', level: 'L3' },
		'/logs': { page: 'logs', level: 'L3' },
		'/diagnostics': { page: 'diagnostics', level: 'L4' },
		'/firmware': { page: 'firmware', level: 'L4' },
		'/ai': { page: 'ai', level: 'L4' },
		'/info': { page: 'info', level: 'L1' }
	};
	
	// =====================================================
	// 내부 상태
	// =====================================================
	let currentPage = null; // SNW.Page.* 인스턴스
	let currentPath = null;
	
	function capitalize(s) {
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
		main.appendChild(SNW.DomUtil.html`<div class="snw-loading" data-i18n="common.loading">Loading...</div>`);
		SNW.I18n.applyTo(main);
	}
	
	function _showError(main, msg) {
		if (!main) return;
		main.innerHTML = '';
		main.appendChild(SNW.DomUtil.html`<div class="snw-error">${msg}</div>`);
	}
	
	// =====================================================
	// dispatch (해시 경로 → 페이지 마운트)
	// =====================================================
	async function dispatch() {
		const path = parseHash();
		if (path === currentPath) return;
		
		const route = ROUTES[path];
		
		// 사용자 레벨 검사
		if (!SNW.LevelUtil.atLeast(route.level)) {
			SNW.ToastUtil.warn(SNW.I18n.t('msg.accessDenied'));
			location.hash = '/dashboard';
			return;
		}
		
		// 이전 페이지 정리
		if (currentPage && typeof currentPage.unmount === 'function') {
			try { currentPage.unmount(); }
			catch (e) { SNW.LogUtil.error('[Router] unmount 실패', e); }
		}
		currentPage = null;
		currentPath = null;
		
		const main = _clearMain();
		_showLoading(main);
		
		// 페이지 클래스 결정
		const PageClass = (SNW.Page && SNW.Page[capitalize(route.page)]) || null;
		if (!PageClass) {
			SNW.LogUtil.warn(`[Router] 페이지 미정의: SNW.Page.${capitalize(route.page)}`);
			_showError(main, `Page not implemented: ${route.page}`);
			return;
		}
		
		try {
			currentPage = new PageClass(main);
			currentPath = path;
			await currentPage.mount();
			// 사이드바 활성 표시
			document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
				a.classList.toggle('is-active', a.getAttribute('data-route') === path);
			});
		} catch (e) {
			SNW.ErrorHandler.handle(e, `page.${route.page}`);
			_showError(main, SNW.I18n.t('msg.unknown'));
		}
	}
	
	// =====================================================
	// nav 메뉴 렌더링
	// =====================================================
	function renderNavMenu() {
		const nav = document.getElementById('nav-menu');
		if (!nav) return;
		nav.innerHTML = '';
		
		const items = [
			{ path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
			{ path: '/chart', labelKey: 'nav.chart', icon: '📈', minLevel: 'L2' },
			{ path: '/schedule', labelKey: 'nav.schedule', icon: '📅', minLevel: 'L2' },
			{ path: '/profiles', labelKey: 'nav.profiles', icon: '👤', minLevel: 'L2' },
			{ path: '/sensors', labelKey: 'nav.sensors', icon: '🌡', minLevel: 'L2' },
			{ path: '/settings', labelKey: 'nav.settings', icon: '⚙', minLevel: 'L3' },
			{ path: '/network', labelKey: 'nav.network', icon: '📶', minLevel: 'L3' },
			{ path: '/logs', labelKey: 'nav.logs', icon: '📜', minLevel: 'L3' },
			{ path: '/diagnostics', labelKey: 'nav.diagnostics', icon: '🔧', minLevel: 'L4' },
			{ path: '/firmware', labelKey: 'nav.firmware', icon: '💾', minLevel: 'L4' },
			{ path: '/ai', labelKey: 'nav.ai', icon: '🤖', minLevel: 'L4' },
			{ path: '/info', labelKey: 'nav.info', icon: 'ℹ' }
		];
		
		items.forEach(it => {
			if (it.minLevel && !SNW.LevelUtil.atLeast(it.minLevel)) return;
			const a = SNW.DomUtil.html`
                <a href="#${it.path}" data-route="${it.path}">
                    <span class="snw-nav-icon">${it.icon}</span>
                    <span>${SNW.I18n.t(it.labelKey)}</span>
                </a>`;
			nav.appendChild(a);
		});
	}
	
	// =====================================================
	// SNW.Router (public)
	// =====================================================
	SNW.Router = {
		ROUTES,
		
		init() {
			// hashchange 감지
			window.addEventListener('hashchange', dispatch);
			
			// 사이드바 토글
			const btnMenu = document.getElementById('btn-menu');
			const sidebar = document.getElementById('snw-sidebar');
			if (btnMenu && sidebar) {
				btnMenu.addEventListener('click', () => {
					sidebar.hidden = !sidebar.hidden;
				});
			}
			
			// nav 렌더링 + 언어 변경 시 재렌더
			renderNavMenu();
			document.addEventListener('snw:langchange', renderNavMenu);
			
			// 최초 디스패치
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


/* ---- 110.ui.slider.js (3133 bytes) ---- */
// =========================================================
// 110.ui.slider.js — SNW.UI.slider (디바운스 슬라이더)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - 드래그 중 값 표시, 종료 시 디바운스 후 onChange
//  - 외부 set() 호출 시 (사용자 조작 중 아닐 때) 동기화
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * 슬라이더
     * @param {object} opts
     *   root       : HTMLElement
     *   min        : number (기본 0)
     *   max        : number (기본 100)
     *   value      : number (기본 50)
     *   label      : string
     *   unit       : string
     *   onChange   : (value:number) => void (디바운스 후)
     *   debounceMs : number (기본 SNW.C.DEBOUNCE_MS.SLIDER)
     * @returns {{set: function(number), get: function():number}}
     */
    SNW.UI.slider = function (opts) {
        const {
            root,
            min = 0, max = 100, value = 50,
            label = '', unit = '',
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
            </div>`);

        const input = root.querySelector('[data-input]');
        const valEl = root.querySelector('[data-val]');

        let dragging = false;

        input.addEventListener('input', () => {
            dragging = true;
            if (valEl) valEl.textContent = input.value;
        });

        input.addEventListener('change', () => {
            dragging = false;
            debounced(Number(input.value));
        });

        // 터치/포인터 종료 감지
        input.addEventListener('pointerup',    () => { dragging = false; });
        input.addEventListener('pointercancel',() => { dragging = false; });

        return {
            set(v) {
                if (dragging) return;    // 사용자 조작 중에는 무시
                const n = Math.max(min, Math.min(max, Number(v) || 0));
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


/* ---- 130.ui.form.js (12161 bytes) ---- */
// =========================================================
// 130.ui.form.js — SNW.UI.form + presetGrid + sensorCards + logViewer
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    // =====================================================
    // 1) SNW.UI.form (스키마 기반 폼)
    //  - schema: [{ key, labelKey, type, min?, max?, options?, placeholder? }]
    //  - type: 'text' | 'number' | 'bool' | 'select' | 'password'
    // =====================================================
    SNW.UI.form = function (opts) {
        const {
            root,
            schema = [],
            value  = {},
            onSave
        } = opts || {};

        if (!root) return { getValue: () => ({}), setValue: () => {}, setError: () => {} };

        const state = Object.assign({}, value);
        const inputs = {};

        function render() {
            root.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'snw-form';

            schema.forEach(f => {
                const label = SNW.I18n.t(f.labelKey);
                const cur   = state[f.key];

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
                        f.placeholder ? `placeholder="${SNW.DomUtil.escape(f.placeholder)}"` : ''
                    ].join(' ');
                    inputEl = SNW.DomUtil.html`
                        <div class="snw-form-row">
                            <label>${label}</label>
                            <input type="${t}" data-key="${f.key}" value="${cur != null ? cur : ''}" ${extra} />
                        </div>`;
                }
                wrap.appendChild(inputEl);

                // input 참조
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

            // Save 버튼 (선택)
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

    // =====================================================
    // 2) SNW.UI.presetGrid (10 프리셋 카드 그리드)
    // =====================================================
    SNW.UI.presetGrid = function (opts) {
        const {
            root,
            items = [],
            selected = '',
            onSelect
        } = opts || {};

        if (!root) return { setItems: () => {}, setSelected: () => {} };

        let curSelected = selected;
        let curItems    = items.slice();

        function render() {
            root.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'snw-preset-grid';

            curItems.forEach((it, i) => {
                const name = it.name || SNW.I18n.t('preset.' + it.code) || it.code;
                const card = SNW.DomUtil.html`
                    <button type="button"
                            class="snw-preset-card ${it.code === curSelected ? 'is-selected' : ''}"
                            data-code="${it.code}">
                        <span class="snw-preset-card__idx">${i + 1}</span>
                        <span class="snw-preset-card__name">${name}</span>
                    </button>`;
                grid.appendChild(card);
            });

            root.appendChild(grid);
        }

        render();

        // 이벤트 위임
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
            setItems(list) { curItems = list.slice(); render(); },
            setSelected(code) {
                if (code === curSelected) return;
                curSelected = code || '';
                render();
            }
        };
    };

    // =====================================================
    // 3) SNW.UI.sensorCards (온도/습도/PIR)
    // =====================================================
    SNW.UI.sensorCards = function (root) {
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
        const humEl  = root.querySelector('[data-hum]');
        const motEl  = root.querySelector('[data-motion]');

        return {
            set({ tempC, humidity, motionActive } = {}) {
                if (tempC != null && Number.isFinite(tempC))
                    tempEl.textContent = `${tempC.toFixed(1)}${SNW.I18n.t('unit.celsius')}`;
                if (humidity != null && Number.isFinite(humidity))
                    humEl.textContent = `${humidity.toFixed(0)}${SNW.I18n.t('unit.humidity')}`;
                if (motionActive != null) {
                    motEl.textContent = motionActive
                        ? SNW.I18n.t('dashboard.motionDetected')
                        : SNW.I18n.t('dashboard.motionAbsent');
                    motEl.classList.toggle('is-on',  !!motionActive);
                    motEl.classList.toggle('is-off', !motionActive);
                }
            }
        };
    };

    // =====================================================
    // 4) SNW.UI.logViewer (로그 목록)
    // =====================================================
    SNW.UI.logViewer = function (opts) {
        const {
            root,
            maxLines = SNW.CFG.UI.LOG_MAX_LINES
        } = opts || {};

        if (!root) return { append: () => {}, clear: () => {}, setFilter: () => {} };

        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`<div class="snw-log-viewer" data-body></div>`);
        const body = root.querySelector('[data-body]');

        let filterLevel = 0;   // 0 = 전체

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
                // { ts, lv, msg }
                if (!entry) return;
                if (filterLevel !== 0 && entry.lv !== filterLevel) return;
                const row = SNW.DomUtil.html`
                    <div class="snw-log-row ${_levelClass(entry.lv)}">
                        <span class="snw-log-ts">${SNW.TimeUtil.msToSecLabel(entry.ts || 0)}</span>
                        <span class="snw-log-lv">${(SNW.C.LOG_LEVEL_META[entry.lv] || {}).code || '?'}</span>
                        <span class="snw-log-msg">${entry.msg || ''}</span>
                    </div>`;
                body.appendChild(row);
                _trim();
                body.scrollTop = body.scrollHeight;
            },
            clear() { body.innerHTML = ''; },
            setFilter(lv) {
                filterLevel = Number(lv) || 0;
                // 기존 행 필터링 (단순화: 재구성 없이 hide)
                Array.from(body.children).forEach(ch => {
                    if (filterLevel === 0) {
                        ch.style.display = '';
                    } else {
                        const lvStr = (SNW.C.LOG_LEVEL_META[filterLevel] || {}).code || '';
                        ch.style.display = ch.textContent.includes(lvStr) ? '' : 'none';
                    }
                });
            }
        };
    };

})(window.SNW);


/* ===== LAYER 2 ===== */

/* ---- 200.page.dashboard.js (11751 bytes) ---- */
// =========================================================
// 200.page.dashboard.js — SNW.Page.Dashboard (L1 MVP)
// Layer 4 (페이지 로직) — Layer 0~3 참조
//  - mount(): 템플릿 삽입, 컴포넌트 마운트, Store 구독
//  - unmount(): 구독/타이머 정리
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Dashboard = class Dashboard {
        constructor(container) {
            this.el = container;
            this._unsubs  = [];
            this._wsUnsubs = [];
            this._timers  = [];
            this.components = {};
            this._active = true;
        }

        // -------------------------------------------------
        // mount
        // -------------------------------------------------
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.dashboard());
            SNW.I18n.applyTo(this.el);

            // 초기 데이터 병렬 로드
            try {
                const [stateData, profileData] = await Promise.all([
                    SNW.Api.getState(),
                    SNW.Api.listWindProfiles().catch(() => null)
                ]);
                if (!this._active) return;
                this._applyInitialState(stateData);
                if (profileData) this._applyPresetList(profileData);
            } catch (e) {
                if (!this._active) return;
                SNW.LogUtil.warn('[Dashboard] 초기 로드 실패', e);
            }

            this._mountComponents();
            this._bindStore();
            this._startClock();

            SNW.LogUtil.info('[Dashboard] mount 완료');
        }

        // -------------------------------------------------
        // unmount
        // -------------------------------------------------
        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
            this._timers.forEach(id => { clearInterval(id); clearTimeout(id); });
            this._unsubs = [];
            this._wsUnsubs = [];
            this._timers = [];
            // 차트 정리
            if (this.components.chart && this.components.chart.destroy) {
                try { this.components.chart.destroy(); } catch {}
            }
        }

        // -------------------------------------------------
        // 초기 데이터
        // -------------------------------------------------
        _applyInitialState(data) {
            if (!data) return;
            const ctl = data.control || null;
            const sim = data.sim || null;
            SNW.Store.set({
                control:    ctl,
                sim:        sim,
                time:       ctl && ctl.time,
                system:     ctl && ctl.system,
                fsmState:   (ctl && ctl.stateCode  != null) ? ctl.stateCode  : 0,
                fsmReason:  (ctl && ctl.reasonCode != null) ? ctl.reasonCode : 0,
                lastUpdateMs: Date.now()
            });
        }

        _applyPresetList(profileData) {
            const presets = (profileData && profileData.windDict && profileData.windDict.presets) || [];
            const order   = SNW.C.PRESET_DISPLAY_ORDER;

            // order 기준 정렬 (없는 코드는 뒤로)
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

            if (this.components.presets) {
                this.components.presets.setItems(items);
            }
        }

        // -------------------------------------------------
        // 컴포넌트 마운트
        // -------------------------------------------------
        _mountComponents() {
            const q = sel => this.el.querySelector(sel);

            // FSM 배지
            this.components.badge = SNW.UI.stateBadge(q('[data-slot="badge"]'));

            // PWM 게이지
            this.components.gauge = SNW.UI.gauge(q('[data-slot="gauge"]'));

            // 센서 카드
            this.components.sensors = SNW.UI.sensorCards(q('[data-slot="sensors"]'));

            // 전원 토글
            this.components.toggle = SNW.UI.toggle({
                root: q('[data-slot="power"]'),
                on: false,
                onToggle: (next) => this._onPowerToggle(next)
            });

            // 강도 슬라이더
            this.components.slider = SNW.UI.slider({
                root: q('[data-slot="intensity"]'),
                min: 0, max: 100, value: SNW.CFG.SIM_DEFAULT.intensity,
                label: SNW.I18n.t('dashboard.intensityLabel'),
                unit:  SNW.I18n.t('unit.percent'),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: (v) => this._onIntensityChange(v)
            });

            // 프리셋 그리드 (초기 빈 상태)
            this.components.presets = SNW.UI.presetGrid({
                root: q('[data-slot="presets"]'),
                items: [],
                selected: '',
                onSelect: (code) => this._onPresetSelect(code)
            });
        }

        // -------------------------------------------------
        // Store 구독
        // -------------------------------------------------
        _bindStore() {
            const s = SNW.Store;

            this._unsubs.push(
                // FSM 상태 배지
                s.watch('fsmState', (code) => {
                    if (!this._active) return;
                    this.components.badge.set(code, s.get().fsmReason);
                }),
                s.watch('fsmReason', (reason) => {
                    if (!this._active) return;
                    this.components.badge.set(s.get().fsmState, reason);
                }),

                // 시뮬레이션 (풍속/PWM/프리셋/슬라이더)
                s.watch('sim', (sim) => {
                    if (!this._active || !sim) return;

                    // 현재 풍속
                    const curWind = this.el.querySelector('[data-slot="cur-wind"]');
                    if (curWind) curWind.textContent = (sim.windSpeed != null ? sim.windSpeed.toFixed(1) : '-');

                    // 목표 풍속
                    const tgtWind = this.el.querySelector('[data-slot="target-wind"]');
                    if (tgtWind) tgtWind.textContent = (sim.targetWind != null ? sim.targetWind.toFixed(1) : '-');

                    // Phase
                    const phaseEl = this.el.querySelector('[data-slot="phase"]');
                    if (phaseEl) {
                        const meta = SNW.C.WIND_PHASE_META[sim.phase] || SNW.C.WIND_PHASE_META.NORMAL;
                        phaseEl.textContent = SNW.I18n.t(meta.labelKey);
                    }

                    // PWM 게이지
                    this.components.gauge.set(sim.pwmDuty != null ? sim.pwmDuty : 0);

                    // 슬라이더
                    if (sim.intensity != null) this.components.slider.set(sim.intensity);

                    // 프리셋 강조
                    if (sim.presetCode) this.components.presets.setSelected(sim.presetCode);
                }),

                // 컨트롤 (전원/센서)
                s.watch('control', (ctl) => {
                    if (!this._active || !ctl) return;

                    this.components.toggle.set(!!ctl.active);

                    if (ctl.sensor) {
                        this.components.sensors.set({
                            tempC:        ctl.sensor.tempC,
                            humidity:     ctl.sensor.humidity,
                            motionActive: ctl.sensor.motionActive
                        });
                    }
                })
            );
        }

        // -------------------------------------------------
        // 헤더 시계 (1초 주기)
        // -------------------------------------------------
        _startClock() {
            const clockEl = document.getElementById('header-clock');
            if (!clockEl) return;
            const id = SNW.TimeUtil.startClock(clockEl, () => {
                const t = SNW.Store.get().time || {};
                return { hour: t.hour != null ? t.hour : -1, min: t.min != null ? t.min : -1 };
            });
            this._timers.push(id);
        }

        // -------------------------------------------------
        // 사용자 액션 (낙관적 UI + 실패 롤백)
        // -------------------------------------------------
        async _onPowerToggle(next) {
            const prevCtl = SNW.Store.get().control;
            const prevActive = prevCtl ? !!prevCtl.active : false;

            // 낙관적 갱신
            SNW.Store.set({
                control: Object.assign({}, prevCtl || {}, { active: !!next })
            });

            try {
                if (next) {
                    const intensity = SNW.Store.get().sim && SNW.Store.get().sim.intensity != null
                        ? SNW.Store.get().sim.intensity
                        : SNW.CFG.SIM_DEFAULT.intensity;
                    await SNW.Api.overrideFixed(intensity, 0, true);
                } else {
                    await SNW.Api.overrideClear();
                }
            } catch (e) {
                // 롤백
                SNW.Store.set({
                    control: Object.assign({}, SNW.Store.get().control || {}, { active: prevActive })
                });
                this.components.toggle.set(prevActive);
                SNW.ErrorHandler.handle(e, 'dashboard.power');
            }
        }

        async _onIntensityChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim ? prevSim.intensity : null;

            // 낙관적 갱신
            SNW.Store.set({
                sim: Object.assign({}, prevSim || {}, { intensity: v })
            });

            try {
                const res = await SNW.Api.patchSim({ intensity: v });
                if (res && res.updated === false) {
                    SNW.ToastUtil.info(SNW.I18n.t('msg.noChange'));
                }
            } catch (e) {
                // 롤백
                SNW.Store.set({
                    sim: Object.assign({}, SNW.Store.get().sim || {}, { intensity: prevVal })
                });
                this.components.slider.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.intensity');
            }
        }

        async _onPresetSelect(code) {
            const prevSim = SNW.Store.get().sim;
            const prevCode = prevSim ? prevSim.presetCode : '';

            // 낙관적 갱신
            SNW.Store.set({
                sim: Object.assign({}, prevSim || {}, { presetCode: code })
            });

            try {
                await SNW.Api.patchSim({ presetCode: code });
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                // 롤백
                SNW.Store.set({
                    sim: Object.assign({}, SNW.Store.get().sim || {}, { presetCode: prevCode })
                });
                this.components.presets.setSelected(prevCode);
                SNW.ErrorHandler.handle(e, 'dashboard.preset');
            }
        }
    };

})(window.SNW);


/* ---- 210.page.chart.js (5630 bytes) ---- */
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
			
			// 차트 초기화
			const chartSlot = this.el.querySelector('[data-slot="chart"]');
			this.chart = SNW.UI.chart({
				root: chartSlot,
				maxPoints: 120,
				series: SNW.CFG.UI.MINI_CHART_SERIES
			});
			
			// 초기 데이터 (풀 덤프)
			try {
				const simState = await SNW.Api.getSimState();
				if (this._active) this._applyInitial(simState);
			} catch (e) {
				SNW.LogUtil.warn('[Chart] 초기 sim state 실패', e);
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
		_onWsChart(data) {
			if (!data) return;
			const sim = data.sim || {};
			
			// full dump (배열)
			if (Array.isArray(data.chart)) {
				this._buffer = data.chart.map(e => ({
					t: e.t != null ? e.t : Date.now(),
					windSpeed: e.wind != null ? e.wind : 0,
					targetWind: e.targetWind != null ? e.targetWind : 0,
					pwmDuty: e.pwm != null ? e.pwm : 0
				}));
				this._redrawRange();
				return;
			}
			
			// diffOnly (최신 1개)
			this._pushPoint({
				t: Date.now(),
				windSpeed: sim.windSpeed != null ? sim.windSpeed : 0,
				targetWind: sim.targetWind != null ? sim.targetWind : 0,
				pwmDuty: sim.pwmDuty != null ? sim.pwmDuty : 0
			});
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


/* ---- 220.page.schedule.js (6832 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 220.page.schedule.js
 * 모듈     : SNW.Page.Schedule
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 8 스케줄 목록 조회 / 활성 토글 / 삭제
 *  - 신규 추가 (기본값) → POST /schedules
 *  - 세그먼트 편집은 v0201 MVP 범위 외 (Phase 5-b 확장)
 * 제약     : schId/segId 서버 발급 (요청 무시)
 *            schNo/segNo 사용자 지정 가능
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Schedule = class Schedule {
		constructor(container) {
			this.el = container;
			this._unsubs = [];
			this._timers = [];
			this._active = true;
			this._schedules = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.schedule());
			SNW.I18n.applyTo(this.el);
			
			await this._load();
			
			SNW.DomUtil.delegate(this.el, '[data-action="add-schedule"]', 'click', () => this._onAdd());
			SNW.DomUtil.delegate(this.el, '[data-action="del-schedule"]', 'click', (e, el) => {
				const id = Number(el.getAttribute('data-id'));
				if (id) this._onDelete(id);
			});
			SNW.DomUtil.delegate(this.el, '[data-action="toggle-schedule"]', 'click', (e, el) => {
				const id = Number(el.getAttribute('data-id'));
				const next = el.checked;
				if (id) this._onToggle(id, next);
			});
			
			SNW.LogUtil.info('[Schedule] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._unsubs.forEach(fn => { try { fn(); } catch {} });
			this._timers.forEach(id => clearTimeout(id));
			this._unsubs = [];
			this._timers = [];
		}
		
		// -------------------------------------------------
		// 목록 로드 + 렌더
		// -------------------------------------------------
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
			
			listSlot.innerHTML = '';
			
			// 헤더 (추가 버튼)
			const toolbar = SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary"
                            data-action="add-schedule" data-i18n="common.add">추가</button>
                </div>`;
			listSlot.appendChild(toolbar);
			
			if (!this._schedules.length) {
				listSlot.appendChild(SNW.DomUtil.html`
                    <div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				SNW.I18n.applyTo(listSlot);
				return;
			}
			
			const wrap = document.createElement('div');
			wrap.className = 'snw-schedule-list';
			
			this._schedules.forEach(s => {
				const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
				const daysStr = (s.period && s.period.days) ?
					s.period.days.map((on, i) => on ? dayLabels[i] : '·').join(' ') :
					'-';
				
				const timeStr = (s.period && s.period.startTime && s.period.endTime) ?
					`${s.period.startTime} ~ ${s.period.endTime}` :
					'-';
				
				const card = SNW.DomUtil.html`
                    <div class="snw-schedule-item ${s.enabled ? 'is-enabled' : 'is-disabled'}"
                         data-id="${s.schId}">
                        <div class="snw-schedule-head">
                            <label class="snw-switch">
                                <input type="checkbox" data-action="toggle-schedule"
                                       data-id="${s.schId}" ${s.enabled ? 'checked' : ''} />
                                <span class="snw-switch__slider"></span>
                            </label>
                            <span class="snw-schedule-name">${s.name || ('#' + s.schNo)}</span>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger"
                                    data-action="del-schedule" data-id="${s.schId}"
                                    title="delete">🗑</button>
                        </div>
                        <div class="snw-schedule-meta">
                            <span class="snw-schedule-days">${daysStr}</span>
                            <span class="snw-schedule-time">${timeStr}</span>
                        </div>
                        <div class="snw-schedule-segcount">
                            ${(s.segCount || 0)} segments
                        </div>
                    </div>`;
				wrap.appendChild(card);
			});
			
			listSlot.appendChild(wrap);
			SNW.I18n.applyTo(listSlot);
		}
		
		// -------------------------------------------------
		// 신규 추가 (기본값 스케줄)
		// -------------------------------------------------
		async _onAdd() {
			const maxNo = this._schedules.reduce(
				(m, s) => Math.max(m, s.schNo || 0), 0);
			const nextNo = maxNo + 10;
			
			const body = {
				schedule: {
					schNo: nextNo,
					name: `New Schedule ${nextNo}`,
					enabled: true,
					repeatSegments: true,
					repeatCount: 1,
					period: {
						enabled: true,
						days: [1, 1, 1, 1, 1, 1, 1],
						startTime: '08:00',
						endTime: '20:00'
					},
					segments: [{
						segNo: 10,
						onMinutes: 20,
						offMinutes: 10,
						mode: SNW.C.SEG_MODE.PRESET,
						presetCode: SNW.C.PRESET_CODE.OCEAN,
						styleCode: SNW.C.STYLE_CODE.BALANCE,
						adjust: {}
					}],
					autoOff: {
						timer: { enabled: false, minutes: 0 },
						offTime: { enabled: false, time: '00:00' },
						offTemp: { enabled: false, temp: 0.0 }
					},
					motion: { pir: { enabled: true, holdSec: 120 } }
				}
			};
			
			try {
				await SNW.Api.addSchedule(body);
				SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
				await this._load();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'schedule.add');
			}
		}
		
		async _onDelete(schId) {
			if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
			try {
				await SNW.Api.deleteSchedule(schId);
				SNW.ToastUtil.success(SNW.I18n.t('common.success'));
				await this._load();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'schedule.delete');
			}
		}
		
		async _onToggle(schId, next) {
			const target = this._schedules.find(s => s.schId === schId);
			if (!target) return;
			
			// 낙관적 갱신 (전체 schedule PUT 필요)
			const body = { schedule: Object.assign({}, target, { enabled: !!next }) };
			try {
				await SNW.Api.updateSchedule(schId, body);
				target.enabled = !!next;
				this._renderList();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'schedule.toggle');
				// 롤백 (재로드)
				await this._load();
			}
		}
	};
	
})(window.SNW);


/* ---- 230.page.profiles.js (5380 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 230.page.profiles.js
 * 모듈     : SNW.Page.Profiles
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 6 프로필 목록 조회
 *  - 원클릭 시작 (/control/profile/select)
 *  - 정지 (/control/profile/stop)
 *  - 삭제
 *  - 활성 프로필 강조 (control.profile.profileNo 참조)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Profiles = class Profiles {
		constructor(container) {
			this.el = container;
			this._unsubs = [];
			this._active = true;
			this._profiles = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.profiles());
			SNW.I18n.applyTo(this.el);
			
			await this._load();
			
			SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => {
				const no = Number(el.getAttribute('data-no'));
				if (no) this._onStart(no);
			});
			SNW.DomUtil.delegate(this.el, '[data-action="stop-profile"]', 'click', () => {
				this._onStop();
			});
			SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => {
				const id = Number(el.getAttribute('data-id'));
				if (id) this._onDelete(id);
			});
			
			// 활성 프로필 Store 구독
			const unsub = SNW.Store.watch('control', (ctl) => {
				if (!this._active || !ctl) return;
				const activeNo = ctl.profile && ctl.profile.profileNo;
				this._highlightActive(activeNo);
			});
			this._unsubs.push(unsub);
			
			SNW.LogUtil.info('[Profiles] mount 완료');
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
				SNW.ErrorHandler.handle(e, 'profiles.load');
			}
		}
		
		_renderList() {
			const listSlot = this.el.querySelector('[data-slot="list"]');
			if (!listSlot) return;
			
			listSlot.innerHTML = '';
			
			if (!this._profiles.length) {
				listSlot.appendChild(SNW.DomUtil.html`
                    <div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				SNW.I18n.applyTo(listSlot);
				return;
			}
			
			const wrap = document.createElement('div');
			wrap.className = 'snw-profile-list';
			
			this._profiles.forEach(p => {
				const disabled = !p.enabled;
				const card = SNW.DomUtil.html`
                    <div class="snw-profile-item ${disabled ? 'is-disabled' : ''}"
                         data-profile-no="${p.profileNo}">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${p.profileNo}</span>
                            <span class="snw-profile-name">${p.name || ''}</span>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger"
                                    data-action="del-profile" data-id="${p.profileId}"
                                    title="delete">🗑</button>
                        </div>
                        <div class="snw-profile-segcount">${p.segCount || 0} segments</div>
                        <div class="snw-profile-actions">
                            <button type="button" class="snw-btn snw-btn-primary"
                                    data-action="start-profile" data-no="${p.profileNo}"
                                    ${disabled ? 'disabled' : ''}
                                    data-i18n="profile.start">시작</button>
                        </div>
                    </div>`;
				wrap.appendChild(card);
			});
			
			listSlot.appendChild(wrap);
			
			// 정지 버튼 (전역 1개)
			const stopBtn = SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn"
                            data-action="stop-profile" data-i18n="profile.stop">정지</button>
                </div>`;
			listSlot.insertBefore(stopBtn, wrap);
			
			SNW.I18n.applyTo(listSlot);
			
			// 현재 활성 프로필 강조
			const ctl = SNW.Store.get().control;
			const activeNo = ctl && ctl.profile && ctl.profile.profileNo;
			if (activeNo) this._highlightActive(activeNo);
		}
		
		_highlightActive(activeNo) {
			this.el.querySelectorAll('.snw-profile-item').forEach(el => {
				const no = Number(el.getAttribute('data-profile-no'));
				el.classList.toggle('is-active', no === activeNo);
			});
		}
		
		async _onStart(profileNo) {
			try {
				await SNW.Api.selectProfile(profileNo);
				SNW.ToastUtil.success(SNW.I18n.t('profile.start'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.start');
			}
		}
		
		async _onStop() {
			try {
				await SNW.Api.stopProfile();
				SNW.ToastUtil.success(SNW.I18n.t('profile.stop'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.stop');
			}
		}
		
		async _onDelete(id) {
			if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
			try {
				await SNW.Api.deleteProfile(id);
				SNW.ToastUtil.success(SNW.I18n.t('common.success'));
				await this._load();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.delete');
			}
		}
	};
	
})(window.SNW);


/* ---- 240.page.settings.js (4833 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 240.page.settings.js
 * 모듈     : SNW.Page.Settings
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 로그 레벨 / API Key 편집 (스키마 폼)
 *  - Save → Reload 순서 강제 (SNW.CfgFlow.patchAndApply 사용)
 *  - Reload 폴링 (pendingReload → false)
 * 의존성   : SNW.UI.form, SNW.Api, SNW.ConfigFlow(v0202 예정)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Settings = class Settings {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._timers = [];
			this._formLog = null;
			this._formApi = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.settings());
			SNW.I18n.applyTo(this.el);
			
			await this._loadSystem();
			
			// Save 버튼
			SNW.DomUtil.delegate(this.el, '[data-action="save"]', 'click', () => this._onSave());
			// Reload 버튼
			SNW.DomUtil.delegate(this.el, '[data-action="reload"]', 'click', () => this._onReload());
			
			SNW.LogUtil.info('[Settings] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._timers.forEach(id => clearTimeout(id));
			this._timers = [];
		}
		
		async _loadSystem() {
			try {
				const data = await SNW.Api.getSystem();
				if (!this._active) return;
				
				const sys = (data && data.system) || {};
				const logCfg = (sys.system && sys.system.logging) || {};
				const sec = sys.security || {};
				
				this._formLog = SNW.UI.form({
					root: this.el.querySelector('[data-slot="form-log"]'),
					schema: [
						{
							key: 'level',
							labelKey: 'system.logLevel',
							type: 'select',
							options: [
								{ value: 'NONE', labelKey: 'log.none' },
								{ value: 'ERROR', labelKey: 'log.error' },
								{ value: 'WARN', labelKey: 'log.warn' },
								{ value: 'INFO', labelKey: 'log.info' },
								{ value: 'DEBUG', labelKey: 'log.debug' }
							]
						},
						{ key: 'maxEntries', labelKey: 'log.level', type: 'number', min: 50, max: 500 }
					],
					value: {
						level: logCfg.level || 'INFO',
						maxEntries: logCfg.maxEntries || 300
					}
				});
				
				this._formApi = SNW.UI.form({
					root: this.el.querySelector('[data-slot="form-api"]'),
					schema: [
						{ key: 'apiKey', labelKey: 'system.apiKey', type: 'password' },
						{ key: 'geminiApiKey', labelKey: 'system.geminiKey', type: 'password' }
					],
					value: {
						apiKey: sec.apiKey || '',
						geminiApiKey: sec.geminiApiKey || ''
					}
				});
				
				SNW.I18n.applyTo(this.el);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'settings.loadSystem');
			}
		}
		
		// -------------------------------------------------
		// Save → Reload 순서 (Settings은 명시적 저장)
		// -------------------------------------------------
		async _onSave() {
			if (!this._formLog || !this._formApi) return;
			
			const logVal = this._formLog.getValue();
			const apiVal = this._formApi.getValue();
			
			const patch = {
				system: {
					logging: {
						level: logVal.level,
						maxEntries: Number(logVal.maxEntries)
					}
				},
				security: {
					apiKey: apiVal.apiKey || '',
					geminiApiKey: apiVal.geminiApiKey || ''
				}
			};
			
			try {
				// 1) patch (메모리만)
				await SNW.Api.patchSystem(patch);
				// 2) save (디스크)
				await SNW.Api.saveConfig();
				// 3) reload (런타임 재적용)
				await SNW.Api.reload();
				
				// 4) reload 완료 폴링
				const ok = await this._waitReloadComplete();
				if (ok) {
					SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess'));
					// API Key가 변경되었으면 localStorage도 갱신
					if (apiVal.apiKey) SNW.Api.setApiKey(apiVal.apiKey);
				} else {
					SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
				}
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'settings.save');
			}
		}
		
		async _onReload() {
			try {
				await SNW.Api.reload();
				const ok = await this._waitReloadComplete();
				if (ok) SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess'));
				else SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'settings.reload');
			}
		}
		
		async _waitReloadComplete() {
			const start = Date.now();
			const timeout = SNW.C.RELOAD.POLL_TIMEOUT_MS;
			const interval = SNW.C.RELOAD.POLL_INTERVAL_MS;
			
			while (Date.now() - start < timeout) {
				if (!this._active) return false;
				try {
					const st = await SNW.Api.getState();
					const ctl = st.control || {};
					if (ctl.pendingReload === false) {
						return ctl.lastReloadOk !== false;
					}
				} catch {}
				await new Promise(r => setTimeout(r, interval));
			}
			return false;
		}
	};
	
})(window.SNW);


/* ---- 250.page.diagnostics.js (4666 bytes) ---- */
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
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Diagnostics = class Diagnostics {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._timers = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.diagnostics());
			SNW.I18n.applyTo(this.el);
			
			await this._refresh();
			
			// 5초 자동 갱신
			const id = setInterval(() => {
				if (!this._active) return;
				this._refresh();
			}, 5000);
			this._timers.push(id);
			
			SNW.LogUtil.info('[Diagnostics] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._timers.forEach(id => clearInterval(id));
			this._timers = [];
		}
		
		async _refresh() {
			const slot = this.el.querySelector('[data-slot="panel"]');
			if (!slot) return;
			
			try {
				const [state, diag, dirty] = await Promise.all([
					SNW.Api.getState().catch(() => null),
					SNW.Api.diag().catch(() => null),
					SNW.Api.getConfigDirty().catch(() => null)
				]);
				if (!this._active) return;
				
				const ctl = (state && state.control) || {};
				const sim = (state && state.sim) || {};
				const dg = diag || {};
				const dr = dirty || {};
				const rt = (state && state.runtime) || {};
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-diag-panel">
                        <h3>FSM</h3>
                        <div class="snw-kv"><span>state</span><b>${ctl.state || '-'}</b></div>
                        <div class="snw-kv"><span>reason</span><b>${ctl.reason || '-'}</b></div>
                        <div class="snw-kv"><span>stateCode</span><b>${ctl.stateCode != null ? ctl.stateCode : '-'}</b></div>
                        <div class="snw-kv"><span>reasonCode</span><b>${ctl.reasonCode != null ? ctl.reasonCode : '-'}</b></div>
                        <div class="snw-kv"><span>runSource</span><b>${ctl.runSource != null ? ctl.runSource : '-'}</b></div>

                        <h3>System</h3>
                        <div class="snw-kv"><span>Heap</span><b>${dg.heap != null ? dg.heap + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Used</span><b>${dg.fs_used != null ? dg.fs_used + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Total</span><b>${dg.fs_total != null ? dg.fs_total + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>Uptime</span><b>${ctl.system && ctl.system.uptimeMs != null ? SNW.TimeUtil.msToSecLabel(ctl.system.uptimeMs) : '-'}</b></div>

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

                        <h3>Runtime (NVS)</h3>
                        <div class="snw-kv"><span>runMode</span><b>${rt.runMode != null ? rt.runMode : '-'}</b></div>
                        <div class="snw-kv"><span>lastScheduleNo</span><b>${rt.lastScheduleNo != null ? rt.lastScheduleNo : '-'}</b></div>
                        <div class="snw-kv"><span>lastUserProfileNo</span><b>${rt.lastUserProfileNo != null ? rt.lastUserProfileNo : '-'}</b></div>
                    </div>`);
			} catch (e) {
				SNW.LogUtil.warn('[Diagnostics] refresh 실패', e);
			}
		}
	};
	
})(window.SNW);


/* ---- 260.page.firmware.js (4805 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 260.page.firmware.js
 * 모듈     : SNW.Page.Firmware
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 현재 버전 조회 (GET /version)
 *  - OTA 확인 (GET /system/firmware/check)
 *  - OTA 업로드 (POST /fwUpdate, XHR 진행률)
 *  - LittleFS 파일 업로드 (POST /fileUpload)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Firmware = class Firmware {
		constructor(container) {
			this.el = container;
			this._active = true;
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
		
		unmount() { this._active = false; }
		
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
                        <div class="snw-kv"><span>Current</span><b>${ver.fw || '-'}</b></div>
                        <div class="snw-kv"><span>Status</span><b>${ck.status || '-'}</b></div>
                        <div class="snw-kv"><span>Latest</span><b>${ck.latest_version || '-'}</b></div>

                        <h3>OTA 업데이트</h3>
                        <input type="file" accept=".bin" data-slot="fw-file" />
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="upload-fw">업로드</button>
                        <div class="snw-progress" data-slot="fw-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-fw-fill></div></div>
                            <span data-fw-label>0%</span>
                        </div>

                        <h3>파일 업로드 (LittleFS)</h3>
                        <input type="file" data-slot="file-file" />
                        <button type="button" class="snw-btn" data-action="upload-file">업로드</button>
                        <div class="snw-progress" data-slot="file-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-file-fill></div></div>
                            <span data-file-label>0%</span>
                        </div>
                    </div>`);
				SNW.I18n.applyTo(slot);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.version');
			}
		}
		
		async _onUploadFw() {
			const inp = this.el.querySelector('[data-slot="fw-file"]');
			if (!inp || !inp.files || !inp.files[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="fw-progress"]');
			const fill = this.el.querySelector('[data-fw-fill]');
			const label = this.el.querySelector('[data-fw-label]');
			if (progBox) progBox.style.display = '';
			
			try {
				await SNW.Api.uploadFirmware(file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
				SNW.ToastUtil.success('OTA OK (재시작)');
				// 서버가 자동 재시작
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.upload');
			}
		}
		
		async _onUploadFile() {
			const inp = this.el.querySelector('[data-slot="file-file"]');
			if (!inp || !inp.files || !inp.files[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="file-progress"]');
			const fill = this.el.querySelector('[data-file-fill]');
			const label = this.el.querySelector('[data-file-label]');
			if (progBox) progBox.style.display = '';
			
			try {
				await SNW.Api.uploadFile(file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
				SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.file');
			}
		}
	};
	
})(window.SNW);


/* ---- 270.page.network.js (6073 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 270.page.network.js
 * 모듈     : SNW.Page.Network
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - Wi-Fi 상태 조회 (mode/ssid/ip/rssi)
 *  - Wi-Fi 스캔 (주변 AP 목록)
 *  - NTP 설정 (서버/시간대/주기)
 *  - Save → Reload 순서 강제
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Network = class Network {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._timers = [];
			this._formTime = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.network());
			SNW.I18n.applyTo(this.el);
			
			// 상태 + 스캔 병렬 로드 (스캔은 실패 허용)
			await Promise.all([
				this._loadState(),
				this._loadSystemTime()
			]);
			
			SNW.DomUtil.delegate(this.el, '[data-action="scan"]', 'click', () => this._onScan());
			SNW.DomUtil.delegate(this.el, '[data-action="time-save"]', 'click', () => this._onSaveTime());
			
			SNW.LogUtil.info('[Network] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._timers.forEach(id => clearTimeout(id));
			this._timers = [];
		}
		
		async _loadState() {
			const slot = this.el.querySelector('[data-slot="form"]');
			if (!slot) return;
			
			let state = {};
			try {
				const data = await SNW.Api.getWifiState();
				state = (data && data.wifi && data.wifi.state) || {};
			} catch (e) {
				SNW.LogUtil.warn('[Network] wifi state 로드 실패', e);
			}
			
			if (!this._active) return;
			
			slot.innerHTML = '';
			slot.appendChild(SNW.DomUtil.html`
                <div class="snw-network-state">
                    <div class="snw-kv">
                        <span data-i18n="network.wifiMode">Wi-Fi 모드</span>
                        <b>${state.mode_name || '-'}</b>
                    </div>
                    <div class="snw-kv">
                        <span data-i18n="network.ssid">SSID</span>
                        <b>${state.ssid || '-'}</b>
                    </div>
                    <div class="snw-kv">
                        <span data-i18n="network.ip">IP</span>
                        <b>${state.ip || '-'}</b>
                    </div>
                    <div class="snw-kv">
                        <span data-i18n="network.rssi">RSSI</span>
                        <b>${state.rssi != null ? state.rssi + ' dBm' : '-'}</b>
                    </div>
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn" data-action="scan"
                                data-i18n="network.scan">Wi-Fi 스캔</button>
                    </div>
                    <div data-slot="scan-result" class="snw-scan-result"></div>
                </div>`);
			SNW.I18n.applyTo(slot);
		}
		
		async _loadSystemTime() {
			try {
				const data = await SNW.Api.getSystem();
				if (!this._active) return;
				const sys = (data && data.system && data.system.timeCfg) || {};
				
				this._formTime = SNW.UI.form({
					root: this.el.querySelector('[data-slot="form"]'),
					schema: [
						{ key: 'ntpServer', labelKey: 'network.ntpServer', type: 'text' },
						{ key: 'timezone', labelKey: 'network.timezone', type: 'text' },
						{ key: 'syncIntervalMin', labelKey: 'network.syncInterval', type: 'number', min: 5, max: 1440 }
					],
					value: {
						ntpServer: sys.ntpServer || 'pool.ntp.org',
						timezone: sys.timezone || 'Asia/Seoul',
						syncIntervalMin: sys.syncIntervalMin || 60
					}
				});
				
				// 저장 버튼 (form 내부에 별도)
				this.el.querySelector('[data-slot="form"]').appendChild(SNW.DomUtil.html`
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="time-save" data-i18n="system.save">저장</button>
                    </div>`);
				SNW.I18n.applyTo(this.el);
			} catch (e) {
				SNW.LogUtil.warn('[Network] time config 로드 실패', e);
			}
		}
		
		async _onScan() {
			const resultSlot = this.el.querySelector('[data-slot="scan-result"]');
			if (!resultSlot) return;
			resultSlot.innerHTML = '';
			resultSlot.appendChild(SNW.DomUtil.html`
                <div class="snw-loading" data-i18n="common.loading">Loading...</div>`);
			
			try {
				const data = await SNW.Api.scanWifi();
				if (!this._active) return;
				const scan = (data && data.wifi && data.wifi.scan) || [];
				
				resultSlot.innerHTML = '';
				if (!scan.length) {
					resultSlot.appendChild(SNW.DomUtil.html`
                        <div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				} else {
					const list = document.createElement('div');
					list.className = 'snw-wifi-list';
					scan.sort((a, b) => (b.rssi || -999) - (a.rssi || -999)).forEach(ap => {
						list.appendChild(SNW.DomUtil.html`
                            <div class="snw-wifi-item">
                                <span class="snw-wifi-ssid">${ap.ssid || '-'}</span>
                                <span class="snw-wifi-enc">${ap.enc || ''}</span>
                                <span class="snw-wifi-rssi">${ap.rssi != null ? ap.rssi + ' dBm' : ''}</span>
                            </div>`);
					});
					resultSlot.appendChild(list);
				}
				SNW.I18n.applyTo(resultSlot);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'network.scan');
			}
		}
		
		async _onSaveTime() {
			if (!this._formTime) return;
			const v = this._formTime.getValue();
			
			const patch = {
				timeCfg: {
					ntpServer: v.ntpServer,
					timezone: v.timezone,
					syncIntervalMin: Number(v.syncIntervalMin)
				}
			};
			
			try {
				await SNW.Api.patchSystem(patch);
				await SNW.Api.saveConfig();
				await SNW.Api.reload();
				SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'network.saveTime');
			}
		}
	};
	
})(window.SNW);


/* ---- 280.page.logs.js (4010 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 280.page.logs.js
 * 모듈     : SNW.Page.Logs
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - /api/v001/logs 초기 256개 로드
 *  - WS /ws/log 실시간 스트림 구독
 *  - 레벨 필터 (NONE/ERROR/WARN/INFO/DEBUG)
 *  - 지우기 / 내보내기
 * ------------------------------------------------------
 */
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
			
			// 로그 뷰어 마운트
			this._viewer = SNW.UI.logViewer({
				root: this.el.querySelector('[data-slot="log"]')
			});
			
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
			
			// 필터 select (스키마 없이 직접)
			const filterEl = this.el.querySelector('[data-slot="log"]');
			if (filterEl) {
				filterEl.insertAdjacentElement('beforebegin', SNW.DomUtil.html`
                    <div class="snw-toolbar">
                        <select data-slot="log-filter">
                            <option value="0" data-i18n="log.filter">전체</option>
                            <option value="1">ERROR</option>
                            <option value="2">WARN</option>
                            <option value="3">INFO</option>
                            <option value="4">DEBUG</option>
                        </select>
                        <button type="button" data-action="log-clear" class="snw-btn"
                                data-i18n="log.clear">지우기</button>
                        <button type="button" data-action="log-export" class="snw-btn"
                                data-i18n="log.export">내보내기</button>
                    </div>`);
				SNW.I18n.applyTo(this.el);
				
				const sel = this.el.querySelector('[data-slot="log-filter"]');
				if (sel) {
					sel.addEventListener('change', () => {
						this._viewer && this._viewer.setFilter(Number(sel.value) || 0);
					});
				}
			}
			
			SNW.DomUtil.delegate(this.el, '[data-action="log-clear"]', 'click', () => {
				this._viewer && this._viewer.clear();
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


/* ---- 290.page.ai.js (3917 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 290.page.ai.js
 * 모듈     : SNW.Page.AI
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - Gemini 자연어 채팅 (POST /ai/gemini)
 *  - Rate limit 3초 (서버 + 클라이언트)
 *  - 요청 최대 8KB / 응답 최대 4KB
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	const MAX_MSG_LEN = 4000;
	
	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = []; // [{role, text}]
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);
			
			const slot = this.el.querySelector('[data-slot="chat"]');
			slot.innerHTML = '';
			slot.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-chat">
                    <div class="snw-ai-messages" data-slot="messages"></div>
                    <div class="snw-ai-input">
                        <textarea data-slot="input" rows="3"
                                  placeholder="${SNW.I18n.t('ai.placeholder')}"
                                  maxlength="${MAX_MSG_LEN}"></textarea>
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="send" data-i18n="ai.send">전송</button>
                    </div>
                </div>`);
			SNW.I18n.applyTo(slot);
			
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
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
				// Gemini API 요청 형식 (contents 배열)
				const body = {
					contents: [{
						parts: [{ text: msg }]
					}]
				};
				const res = await SNW.Api.gemini(body);
				if (!this._active) return;
				
				// 응답 파싱 (Gemini 표준)
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

/* ---- 300.page.info.js (2313 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명   : 300.page.info.js
 * 모듈     : SNW.Page.Info
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 버전 정보 (GET /version)
 *  - 시스템 정보 (GET /diag)
 *  - 매뉴얼 링크 안내
 * ------------------------------------------------------
 */
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
				const [v, d] = await Promise.all([
					SNW.Api.version().catch(() => null),
					SNW.Api.diag().catch(() => null)
				]);
				if (!this._active) return;
				
				const ver = v || {};
				const diag = d || {};
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-info-panel">
                        <h3>Version</h3>
                        <div class="snw-kv"><span>fw</span><b>${ver.fw || '-'}</b></div>
                        <div class="snw-kv"><span>control</span><b>${ver.control || '-'}</b></div>
                        <div class="snw-kv"><span>config</span><b>${ver.config || '-'}</b></div>
                        <div class="snw-kv"><span>api</span><b>${ver.api || '-'}</b></div>
                        <div class="snw-kv"><span>simul</span><b>${ver.simul || '-'}</b></div>
                        <h3>System</h3>
                        <div class="snw-kv"><span>Heap Free</span><b>${diag.heap != null ? diag.heap + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Used</span><b>${diag.fs_used != null ? diag.fs_used + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Total</span><b>${diag.fs_total != null ? diag.fs_total + ' B' : '-'}</b></div>
                    </div>`);
			} catch (e) {
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`<div class="snw-error">${SNW.I18n.t('msg.unknown')}</div>`);
			}
			
			SNW.LogUtil.info('[Info] mount 완료');
		}
		
		unmount() {
			this._active = false;
		}
	};
	
})(window.SNW);


/* ===== LAYER 9 ===== */

/* ---- 999.app.js (3254 bytes) ---- */
// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// Layer 5 — Layer 0~4 참조
//  - DOMContentLoaded 시 초기화 순서 실행
//  - 언어 토글, WS/Store 시작, 라우터 초기화
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// =====================================================
	// 연결 상태 표시 (Header dot + Footer)
	// =====================================================
	function _bindConnectionStatus() {
		const dot = document.getElementById('conn-status');
		const footerStat = document.getElementById('footer-status');
		if (!dot && !footerStat) return;
		
		const render = (conn) => {
			const cls = 'snw-status-dot snw-status-dot--' + conn;
			if (dot) {
				dot.className = cls;
				dot.title = SNW.I18n.t('footer.' + conn);
			}
			if (footerStat) {
				footerStat.textContent = SNW.I18n.t('footer.' + conn);
			}
		};
		
		SNW.Store.watch('connection', render);
		render(SNW.Store.get().connection);
	}
	
	// =====================================================
	// 마지막 업데이트 시각 표시
	// =====================================================
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
	
	// =====================================================
	// 언어 토글 버튼
	// =====================================================
	function _bindLangToggle() {
		const btn = document.getElementById('btn-lang');
		if (!btn) return;
		btn.addEventListener('click', () => {
			const cur = SNW.I18n.getLang();
			SNW.I18n.setLang(cur === 'ko' ? 'en' : 'ko');
			// 페이지 재적용 (data-i18n)
			SNW.I18n.applyTo(document);
			// nav 메뉴 재렌더 (Router가 snw:langchange 이벤트 구독)
		});
	}
	
	// =====================================================
	// 부트스트랩 (DOMContentLoaded)
	// =====================================================
	document.addEventListener('DOMContentLoaded', async () => {
		try {
			// 1) i18n 초기 적용
			SNW.I18n.applyTo(document);
			
			// 2) 사용자 레벨 필터
			if (typeof SNW.LevelUtil !== 'undefined' && SNW.LevelUtil.applyTo) {
				SNW.LevelUtil.applyTo(document.body);
			}
			
			// 3) 연결 상태 표시
			_bindConnectionStatus();
			_bindLastUpdate();
			
			// 4) WS + Store 브리지
			SNW.WsManager.initByLevel();
			SNW.StoreBridge.start();
			
			// 5) 언어 토글
			_bindLangToggle();
			
			// 6) 라우터 초기화 (해시 기반 페이지 마운트)
			SNW.Router.init();
			
			SNW.LogUtil.info('App bootstrap complete');
		} catch (e) {
			SNW.LogUtil.error('bootstrap failed', e);
			const main = document.getElementById('snw-main');
			if (main) {
				main.innerHTML = '';
				main.appendChild(SNW.DomUtil.html`<div class="snw-error">${SNW.I18n.t('msg.unknown')}</div>`);
			}
		}
	});
	
})(window.SNW);

