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
            stopEq();
            return;
        }
        barEl.root.hidden = false;

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
        tick();
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
        const type = parseType(s.type);
        if (type === 1) {
            location.hash = '/profiles';
        } else if (type === 2) {
            location.hash = '/dashboard';
        } else if (type === 3) {
            location.hash = '/dashboard';
        }
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

