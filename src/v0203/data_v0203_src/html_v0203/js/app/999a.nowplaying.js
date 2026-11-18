// =========================================================
// 999a.nowplaying.js — 전역 Now Playing Bar (Stage 5 UX 완성형)
// Layer 3 (애플리케이션 전역 컴포넌트)
//  - ENV_PAUSED 3초 호흡 애니메이션 + [▶ 지금 재개]
//  - AUTO 배지 (✨ / 🎯) + 실시간 환경 센서(온도/DI) 배지
//  - 로컬 TimerManager + 서버 triggerRt 통합 최단 종료 시각 표기
//  - autoSwitchReason 1줄 병기
//  - btnStop 상시 노출 (ENV_PAUSED 중에도 완전 정지 허용)
//  - 상세 확장 모달 양방향 자동/수동 토글 및 실시간 세션 감시
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
        autoBadge: null,
        btnPause: null,
        btnStop: null,
        _eqAnimId: null,
        _eqBuffer: [],
    };

    let _initialized = false;
    let _pauseBreathingId = null;
    let _pauseBreathingPhase = 0;

    function $(sel, root) { return (root || document).querySelector(sel); }

    const SCENARIO_BY_PROFILE_NO = {
        10: 'sleep',
        20: 'office',
        30: 'study',
        40: 'rest',
        50: 'exercise',
        70: 'pet',
        80: 'baby'
    };
    const DEFAULT_PROFILE_NAMES = new Set([
        '수면모드', '집중모드', '휴식모드', '환기모드', '활동모드', '반려동물 케어', '아기/유아 케어'
    ]);

    function getProfileDisplayName(s) {
        if (!s) return '';
        const pNo = Number(s.profileNo || 0);
        const rawName = s.profileName || s.name || '';
        const scenarioKey = SCENARIO_BY_PROFILE_NO[pNo];
        if (scenarioKey && (!rawName || DEFAULT_PROFILE_NAMES.has(rawName))) {
            const full = SNW.I18n.t('home.scenario.' + scenarioKey);
            const parts = full.split(' ');
            const base = (parts.length > 1 ? parts.slice(1).join(' ') : full).trim();
            const lang = (SNW.I18n.getLang && SNW.I18n.getLang()) || 'ko';
            return lang === 'ko' ? `${base}모드` : `${base} Mode`;
        }
        return rawName || (pNo ? `프로필 #${pNo}` : '');
    }

    function getSession() {
        return (SNW.Store && SNW.Store.get) ? SNW.Store.get().session : null;
    }

    function parseType(t) {
        if (typeof t === 'number') return t;
        const m = { NONE: 0, PLAYLIST: 1, PRESET: 2, FIXED: 3, AUTO_FULL: 4, AUTO_SELECT: 5 };
        return m[t] != null ? m[t] : 0;
    }

    function isSessionVisible() {
        const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
        const ctl = store.control;
        if (ctl && ctl.stateCode === 5) return false; // AUTOOFF_STOPPED 시 Bar 숨김 (야간 리포트 전담)
        if (ctl && ctl.stateCode === 7) return true;  // ENV_PAUSED(7) 시 Bar 상시 노출

        const s = store.session;
        if (!s) return false;
        if (s.state === 'COMPLETED') return false;
        const type = parseType(s.type);
        return (type !== 0 && s.active !== false);
    }

    function formatTime(sec) {
        if (!sec || sec < 0) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    // [Stage 5] ENV_PAUSED 3초 주기 호흡 애니메이션
    function startPauseBreathing() {
        if (_pauseBreathingId || !barEl.eq) return;
        stopEq();
        const ctx = barEl.eq.getContext('2d');
        const w = barEl.eq.width;
        const h = barEl.eq.height;

        const tick = () => {
            if (!_pauseBreathingId) return;
            // ~3초 주기 (60fps 기준 약 0.035 rad/frame)
            _pauseBreathingPhase = (_pauseBreathingPhase + 0.035) % (Math.PI * 2);
            const alpha = 0.25 + 0.65 * Math.abs(Math.sin(_pauseBreathingPhase));

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = `rgba(210, 153, 34, ${alpha})`;
            // 중앙 호흡 수평 바
            ctx.fillRect(w * 0.15, h / 2 - 1.5, w * 0.7, 3);

            _pauseBreathingId = requestAnimationFrame(tick);
        };
        _pauseBreathingId = requestAnimationFrame(tick);
    }

    function stopPauseBreathing() {
        if (_pauseBreathingId) {
            cancelAnimationFrame(_pauseBreathingId);
            _pauseBreathingId = null;
        }
    }

    // =========================================================
    // 렌더링
    // =========================================================
    function render() {
        if (!barEl.root) return;

        const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
        const s = store.session;
        const ctl = store.control;
        const isEnvPaused = (ctl && ctl.stateCode === 7);

        if (!isSessionVisible()) {
            barEl.root.hidden = true;
            document.body.classList.remove('has-nowplaying');
            stopEq();
            stopPauseBreathing();
            return;
        }

        barEl.root.hidden = false;
        document.body.classList.add('has-nowplaying');

        // ─── [Stage 5] 1. ENV_PAUSED 상태 처리 ───
        if (isEnvPaused) {
            stopEq();
            startPauseBreathing();

            const pauseReason = ctl.pauseReason || 0;
            const cur = ctl.sensor || {};
            const rule = (ctl.session && ctl.session.rule) || (s && s.rule) || {};
            const curTemp = (cur.tempC != null) ? Number(cur.tempC).toFixed(1) : '--';
            const curDi = (ctl.triggerRt && ctl.triggerRt.lastCheckDI != null)
                ? Number(ctl.triggerRt.lastCheckDI).toFixed(0) : '--';

            let subText = '';
            if (pauseReason === 1) {
                subText = SNW.I18n.t('fsm.pauseResumeHint.motion');
            } else if (pauseReason === 2) {
                const tl = rule.tempLow || {};
                const resumeTh = (tl.threshold != null && tl.hysteresis != null)
                    ? (Number(tl.threshold) + Number(tl.hysteresis)).toFixed(1) : '--';
                subText = SNW.I18n.t('fsm.pauseResumeHint.temp', { cur: curTemp, resume: resumeTh });
            } else if (pauseReason === 3) {
                const dl = rule.diLow || {};
                const resumeDi = (dl.threshold != null && dl.hysteresis != null)
                    ? (Number(dl.threshold) + Number(dl.hysteresis)).toFixed(0) : '--';
                subText = SNW.I18n.t('fsm.pauseResumeHint.di', { cur: curDi, resume: resumeDi });
            } else {
                subText = SNW.I18n.t('fsm.envPaused');
            }

            barEl.title.textContent = SNW.I18n.t('fsm.envPaused');
            barEl.step.textContent = subText;
            barEl.time.textContent = '';

            // [▶ 지금 재개] 버튼 노출
            barEl.btnPause.hidden = false;
            barEl.btnPause.textContent = '▶';
            barEl.btnPause.title = '지금 재개';
            barEl.btnPause.setAttribute('aria-label', '지금 재개');

            // btnStop 상시 노출 (ENV_PAUSED 중에도 완전 정지 허용)
            barEl.btnStop.hidden = false;

            if (barEl.pending) barEl.pending.hidden = true;
            if (barEl.timerBadge) barEl.timerBadge.hidden = true;
            if (barEl.autoBadge) barEl.autoBadge.hidden = true;
            return;
        }

        // 정상 세션 상태: 호흡 정지
        stopPauseBreathing();

        const type = s ? parseType(s.type) : 0;
        const typeName = s ? (s.typeName || (['NONE', 'PLAYLIST', 'PRESET', 'FIXED', 'AUTO_FULL', 'AUTO_SELECT'][type] || 'NONE')) : 'NONE';
        const stateStr = (typeof s.state === 'string') ? (s.state === 'RUNNING' ? 'ACTIVE' : s.state) : (s.state === 1 ? 'PAUSED' : 'ACTIVE');
        const isPaused = (stateStr === 'PAUSED');

        // ─── 2. 타이틀 & AUTO 배지 ───
        const isManual = (s.trigger === 1 || s.trigger === 'MANUAL' || s.triggerName === 'MANUAL');
        const triggerIcon = isManual ? '✋' : '⏰';
        let title = '';
        if (typeName === 'AUTO_FULL' || type === 4) {
            const af = SNW.I18n.t('session.autoFull');
            title = af.startsWith('✨') ? af : `✨ ${af}`;
        } else if (typeName === 'AUTO_SELECT' || type === 5) {
            const baseLabel = getProfileDisplayName(s) || (s.presetCode ? SNW.I18n.t('preset.' + s.presetCode) : '');
            if (baseLabel) {
                title = `🎯 ${baseLabel} ${SNW.I18n.t('session.autoSelectSuffix')}`;
            } else {
                const as = SNW.I18n.t('session.autoSelect');
                title = as.startsWith('🎯') ? as : `🎯 ${as}`;
            }
        } else if (type === 1) {
            const pTitle = getProfileDisplayName(s) || '플레이리스트';
            title = `${triggerIcon} ${pTitle}`;
        } else if (type === 2) {
            title = `${triggerIcon} ${s.presetCode || '자연풍'} · ${s.styleCode || '표준'}`;
        } else if (type === 3) {
            const fixedPct = s.percent ?? s.fixedPercent ?? s.fixedSpeed ?? (ctl && ctl.override && ctl.override.fixedPercent) ?? 0;
            title = `${triggerIcon} 일반 선풍기 (${Math.round(fixedPct)}%)`;
        } else {
            title = '재생 중';
        }
        barEl.title.textContent = title;

        // ─── 3. 서브 정보 & 최단 종료 시각 단일 표기 (로컬 TimerManager + 서버 triggerRt 통합) ───
        let subReason = s.autoSwitchReason ? ` · ${s.autoSwitchReason}` : '';
        const timerStatus = (SNW.TimerManager && typeof SNW.TimerManager.getStatus === 'function')
            ? SNW.TimerManager.getStatus()
            : null;
        const tr = ctl && ctl.triggerRt;
        const uptimeMs = ctl && ctl.system && ctl.system.uptimeMs;

        let serverTimerRemainSec = null;
        if (tr && tr.timerArmed && tr.timerMinutes > 0 && uptimeMs > 0) {
            const totalMs = Number(tr.timerMinutes) * 60000;
            const pausedMs = Number(tr.pausedAccumMs || 0);
            const elapsedMs = Math.max(0, Number(uptimeMs) - Number(tr.timerStartMs || 0) - pausedMs);
            serverTimerRemainSec = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
        }

        let shortestSec = null;
        const activeTimerSec = (timerStatus && timerStatus.active && timerStatus.remainSec > 0)
            ? timerStatus.remainSec
            : serverTimerRemainSec;
        if (activeTimerSec && activeTimerSec > 0) {
            shortestSec = activeTimerSec;
        }
        if (type === 1 && s.stepRemainSec && s.stepRemainSec > 0) {
            if (shortestSec == null || s.stepRemainSec < shortestSec) {
                shortestSec = s.stepRemainSec;
            }
        }

        if (type === 1) {
            barEl.step.textContent = `Step ${s.currentStep || 1}/${s.totalSteps || 1}${subReason}`;
            barEl.time.textContent = isPaused
                ? `일시정지 (${formatTime(shortestSec)})`
                : (shortestSec > 0 ? formatTime(shortestSec) : '가동 중');
        } else if (type === 3) {
            const fixedPct = s.percent ?? s.fixedPercent ?? s.fixedSpeed ?? (ctl && ctl.override && ctl.override.fixedPercent) ?? 0;
            barEl.step.textContent = `${Math.round(fixedPct)}%${subReason}`;
            barEl.time.textContent = isPaused ? '일시정지' : (shortestSec > 0 ? formatTime(shortestSec) : '가동 중');
        } else {
            const defaultSub = (typeName === 'AUTO_FULL' || type === 4)
                ? '실시간 100% 자율 제어'
                : ((typeName === 'AUTO_SELECT' || type === 5) ? '바람 기준 고정 · 자동 세기 조절' : '');
            barEl.step.textContent = s.autoSwitchReason || defaultSub;
            barEl.time.textContent = isPaused ? '일시정지' : (shortestSec > 0 ? formatTime(shortestSec) : '가동 중');
        }

        // ─── 4. 일시정지 / 재개 버튼 & btnStop 상시 노출 ───
        barEl.btnPause.textContent = isPaused ? '▶' : '⏸';
        barEl.btnPause.setAttribute('aria-label', isPaused ? '재개' : '일시정지');
        barEl.btnPause.hidden = false;
        barEl.btnStop.hidden = false; // [Stage 5] btnStop 상시 노출

        // ─── 5. Pending Schedule 충돌 배지 ───
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

        // ─── 6. Timer 배지 (로컬 또는 서버 하드웨어 타이머 활성 시) ───
        if (barEl.timerBadge && activeTimerSec && activeTimerSec > 0) {
            barEl.timerBadge.hidden = false;
            const min = Math.ceil(activeTimerSec / 60);
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

        // ─── 7. Auto Comfort & 실시간 환경 센서 배지 ───
        if (barEl.autoBadge) {
            const isAuto = !!store.autoComfortEnabled || (s && (s.trigger === 3 || s.triggerName === 'AUTO_COMFORT' || type === 4 || type === 5));
            barEl.autoBadge.hidden = !isAuto;
            if (isAuto) {
                const sen = (ctl && ctl.sensor) || {};
                const tempStr = (sen.tempC != null) ? `${Number(sen.tempC).toFixed(0)}°C` : '';
                const diVal = (tr && tr.lastCheckDI != null) ? Number(tr.lastCheckDI).toFixed(0) : '';
                const spanEl = barEl.autoBadge.querySelector('span');
                if (spanEl) {
                    if ((typeName === 'AUTO_FULL' || type === 4) && tempStr) {
                        spanEl.textContent = diVal ? `🌡 ${tempStr} · DI ${diVal}` : `🌡 ${tempStr}`;
                    } else if ((typeName === 'AUTO_SELECT' || type === 5) && tempStr) {
                        spanEl.textContent = `🌡 ${tempStr}`;
                    } else {
                        spanEl.textContent = '🌱 자동';
                    }
                }
            }
        }

        // ─── 8. EQ 애니메이션 ───
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
        const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
        const ctl = store.control;

        // [Stage 5] ENV_PAUSED(7) 상태일 때 [▶ 지금 재개] 연동
        if (ctl && ctl.stateCode === 7) {
            try {
                await SNW.Api.resumeSession();
                if (SNW.ToastUtil) SNW.ToastUtil.success('바람이 재개되었습니다.');
            } catch (err) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(err.message || '재개 실패');
            }
            return;
        }

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
        const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
        const ctl = store.control;
        if (!s && (!ctl || ctl.stateCode !== 7)) return;
        showNowPlayingDetailsModal(s || {});
    }

    // =========================================================
    // 초기화
    // =========================================================
    function init() {
        if (_initialized) return;
        barEl.root = document.getElementById('now-playing-bar');
        if (!barEl.root) return;
        _initialized = true;

        barEl.eq = $('.snw-nowplaying__eq', barEl.root);
        barEl.title = $('.snw-nowplaying__title', barEl.root);
        barEl.step = $('[data-slot="np-step"]', barEl.root);
        barEl.time = $('[data-slot="np-time"]', barEl.root);
        barEl.pending = $('[data-slot="np-pending"]', barEl.root);
        barEl.timerBadge = $('[data-slot="np-timer"]', barEl.root);
        barEl.timerVal = $('[data-slot="np-timer-val"]', barEl.root);
        barEl.autoBadge = $('[data-slot="np-auto-badge"]', barEl.root);
        barEl.btnPause = $('[data-action="pause"]', barEl.root);
        barEl.btnStop = $('[data-action="stop"]', barEl.root);

        if (barEl.btnPause) barEl.btnPause.addEventListener('click', onPauseOrResume);
        if (barEl.btnStop) barEl.btnStop.addEventListener('click', onStop);

        const leftEl = $('[data-action="expand"]', barEl.root);
        if (leftEl) leftEl.addEventListener('click', onExpand);

        // 모바일 한 손 스와이프 제스처 (좌: 일시정지/재개, 우: 즉시 정지)
        let touchStartX = 0;
        barEl.root.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
        }, { passive: true });
        barEl.root.addEventListener('touchend', (e) => {
            if (!e.changedTouches || !e.changedTouches[0]) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (dx > 70) {
                if (SNW.Haptic) SNW.Haptic.stop();
                onStop();
            } else if (dx < -70) {
                if (SNW.Haptic) SNW.Haptic.snap();
                onPauseOrResume();
            }
        }, { passive: true });

        // Store 구독
        if (SNW.Store && typeof SNW.Store.subscribe === 'function') {
            SNW.Store.subscribe(() => render());
        }
        document.addEventListener('snw:timerchange', () => render());
        render();
        SNW.LogUtil.info('[NowPlaying] Bar initialized');
    }

    // =========================================================
    // Now Playing 상세 확장 모달
    // =========================================================
    function showNowPlayingDetailsModal(s) {
        if (!SNW.UI || !SNW.UI.modal) return;
        const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
        const ctl = store.control;
        const isEnvPaused = (ctl && ctl.stateCode === 7);

        const type = parseType(s.type);
        const typeName = s.typeName || (['NONE', 'PLAYLIST', 'PRESET', 'FIXED', 'AUTO_FULL', 'AUTO_SELECT'][type] || 'NONE');
        const stateStr = (typeof s.state === 'string') ? (s.state === 'RUNNING' ? 'ACTIVE' : s.state) : (s.state === 1 ? 'PAUSED' : 'ACTIVE');
        const isPaused = isEnvPaused || (stateStr === 'PAUSED');

        let title = '';
        let typeBadge = '';
        if (typeName === 'AUTO_FULL' || type === 4) {
            title = SNW.I18n.t('session.autoFull');
            typeBadge = '✨ AI 스마트 쾌적 (100% 자율)';
        } else if (typeName === 'AUTO_SELECT' || type === 5) {
            const baseLabel = s.profileName || (s.presetCode ? SNW.I18n.t('preset.' + s.presetCode) : '');
            title = baseLabel ? `${baseLabel} (맞춤Auto)` : SNW.I18n.t('session.autoSelect');
            typeBadge = '🎯 취향 맞춤 Auto';
        } else if (type === 1) {
            title = s.profileName || (s.profileNo ? `프로필 #${s.profileNo}` : '플레이리스트');
            typeBadge = '🎵 맞춤 바람 (플레이리스트)';
        } else if (type === 2) {
            title = `${s.presetCode || '자연풍'} · ${s.styleCode || '표준'}`;
            typeBadge = '🌿 자연풍 프리셋';
        } else if (type === 3) {
            const fixedPct = s.percent ?? s.fixedPercent ?? s.fixedSpeed ?? (ctl && ctl.override && ctl.override.fixedPercent) ?? 0;
            title = `일반 선풍기 (${Math.round(fixedPct)}%)`;
            typeBadge = '🌀 고정 풍속';
        } else {
            title = '재생 중인 바람';
            typeBadge = '🍃 세션';
        }

        const remainSec = s.stepRemainSec || 0;
        const timeStr = isEnvPaused
            ? '환경 조건 회복 대기 중'
            : (isPaused
                ? `일시정지 (${formatTime(remainSec)})`
                : (remainSec > 0 ? `${formatTime(remainSec)} 남음` : '연속 가동 중'));

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
                            ${isEnvPaused ? '⏸ 환경 일시정지' : (isPaused ? '⏸ 일시정지' : '▶ 재생 중')}
                        </span>
                        <span>·</span>
                        <span>${timeStr}</span>
                    </div>
                </div>

                <button type="button" class="snw-btn snw-btn--full" id="np-btn-timer-link" style="justify-content:center;background:${timerActive ? 'rgba(78,168,222,0.15)' : 'var(--snw-surface-2,#12161c)'};border:1px solid ${timerActive ? 'var(--snw-info,#4ea8de)' : 'var(--snw-border,#2f3844)'};color:${timerActive ? 'var(--snw-info,#4ea8de)' : 'var(--snw-text,#e6edf3)'};">
                    ${timerText} ➔
                </button>

                <button type="button" class="snw-btn snw-btn--full" id="np-btn-rule-link" style="justify-content:center;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);color:var(--snw-text,#e6edf3);">
                    ⚙ 규칙 보기 ➔
                </button>

                ${(typeName === 'AUTO_FULL' || type === 4) ? `
                <div style="display:flex;gap:8px;">
                    <button type="button" class="snw-btn" id="np-btn-comfort-info" style="flex:1;">✨ 쾌적 분석 보기</button>
                    <button type="button" class="snw-btn" id="np-btn-manual-switch" style="flex:1;">🎨 수동 전환</button>
                </div>` : ''}

                ${(typeName === 'AUTO_SELECT' || type === 5 || type === 1 || type === 2) ? `
                <button type="button" class="snw-btn snw-btn--full" id="np-btn-select-switch" style="justify-content:center;">
                    🎯 맞춤 세기 자동/수동 전환
                </button>` : ''}
            </div>
        `;

        let watchId = null;
        const cleanupWatch = () => {
            if (watchId) {
                clearInterval(watchId);
                watchId = null;
            }
        };

        const modalRef = SNW.UI.modal(
            '🍃 바람 세션 상세',
            content,
            async () => {
                cleanupWatch();
                await onPauseOrResume();
                return true;
            },
            () => {
                cleanupWatch();
                return true;
            },
            {
                okLabel: isEnvPaused ? '▶ 지금 재개 (1시간 유예)' : (isPaused ? '▶ 재개' : '⏸ 일시정지'),
                cancelLabel: (SNW.I18n && SNW.I18n.t) ? SNW.I18n.t('common.close') : '닫기',
                width: '380px'
            }
        );

        // 본문 하단에 독립된 세션 정지 버튼 추가
        const stopBtn = document.createElement('button');
        stopBtn.type = 'button';
        stopBtn.className = 'snw-btn snw-btn--full';
        stopBtn.style.cssText = 'margin-top:10px;justify-content:center;background:rgba(248,81,73,0.15);color:var(--snw-error,#f85149);border:1px solid var(--snw-error,#f85149);';
        stopBtn.textContent = `⏹ ${(SNW.I18n && SNW.I18n.t) ? SNW.I18n.t('common.stopSession') : '세션 정지'}`;
        stopBtn.onclick = async () => {
            cleanupWatch();
            if (modalRef && typeof modalRef.close === 'function') modalRef.close();
            await onStop();
        };
        content.appendChild(stopBtn);

        const timerBtn = content.querySelector('#np-btn-timer-link');
        if (timerBtn) {
            timerBtn.onclick = () => {
                cleanupWatch();
                if (modalRef && typeof modalRef.close === 'function') modalRef.close();
                location.hash = '/automation/timer';
            };
        }

        const ruleBtn = content.querySelector('#np-btn-rule-link');
        if (ruleBtn) {
            ruleBtn.onclick = async () => {
                cleanupWatch();
                if (modalRef && typeof modalRef.close === 'function') modalRef.close();
                if (SNW.UI && SNW.UI.ruleEditor) {
                    const st = SNW.Store ? SNW.Store.get() : {};
                    const curRule = (st.control && st.control.session && st.control.session.rule) || s.rule || {};
                    await SNW.UI.ruleEditor.showModal(curRule, { allowApplySession: true });
                }
            };
        }

        const btnComfort = content.querySelector('#np-btn-comfort-info');
        if (btnComfort) {
            btnComfort.onclick = () => {
                cleanupWatch();
                if (modalRef && typeof modalRef.close === 'function') modalRef.close();
                location.hash = '/home/env';
            };
        }

        const btnManualSwitch = content.querySelector('#np-btn-manual-switch');
        if (btnManualSwitch) {
            btnManualSwitch.onclick = async () => {
                cleanupWatch();
                if (modalRef && typeof modalRef.close === 'function') modalRef.close();
                const sim = (SNW.Store && SNW.Store.get().sim) || {};
                await SNW.Api.startPreset(sim.presetCode || 'OCEAN', sim.styleCode || 'BALANCE');
                if (SNW.ToastUtil) SNW.ToastUtil.info('수동 제어로 전환되었습니다');
            };
        }

        const btnSelectSwitch = content.querySelector('#np-btn-select-switch');
        if (btnSelectSwitch) {
            btnSelectSwitch.onclick = async () => {
                cleanupWatch();
                if (modalRef && typeof modalRef.close === 'function') modalRef.close();
                const sim = (SNW.Store && SNW.Store.get().sim) || {};
                const isCurrentlyAuto = (typeName === 'AUTO_SELECT' || type === 5);
                if (isCurrentlyAuto) {
                    await SNW.Api.startPreset(s.presetCode || sim.presetCode || 'OCEAN', s.styleCode || sim.styleCode || 'BALANCE');
                    if (SNW.ToastUtil) SNW.ToastUtil.info('수동 세기 제어로 전환되었습니다');
                } else {
                    await SNW.Api.startSession({
                        type: 'AUTO_SELECT',
                        payload: { baseType: 'PRESET', presetCode: s.presetCode || sim.presetCode || 'OCEAN' }
                    });
                    if (SNW.ToastUtil) SNW.ToastUtil.success('취향 맞춤 Auto로 전환되었습니다');
                }
            };
        }

        // 모달 오픈 중 세션 종료 시 자동 닫힘 감시 (1초 주기)
        watchId = setInterval(() => {
            if (!content.isConnected) {
                cleanupWatch();
                return;
            }
            if (!isSessionVisible() && modalRef && typeof modalRef.close === 'function') {
                cleanupWatch();
                modalRef.close();
            }
        }, 1000);
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

    SNW.NowPlaying = {
        init,
        render,
        getSession,
        getProfileDisplayName
    };

    // 번들(999.app.js 이후 알파벳 순 실행) 포함 환경에서 초기화 누락 방지
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
    } else {
        init();
    }

})(window.SNW);

