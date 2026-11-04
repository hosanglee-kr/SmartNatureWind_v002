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
        },
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
