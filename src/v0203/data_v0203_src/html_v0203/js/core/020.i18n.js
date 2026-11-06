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
