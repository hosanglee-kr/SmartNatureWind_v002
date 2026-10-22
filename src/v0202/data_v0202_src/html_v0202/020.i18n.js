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
            'nav.windprofile': '바람 프리셋 관리',
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
            'nav.windprofile': 'Wind Presets',
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
