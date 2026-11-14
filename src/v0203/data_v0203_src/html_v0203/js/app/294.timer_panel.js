// =========================================================
// 294.timer_panel.js — 자동화 세션 자동 종료 타이머 (TimerPanel)
// Layer 3 (페이지 컴포넌트) & 전역 TimerManager
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
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

            // [P1-7] Comfort 자동 모드 영구 해제
            try {
                if (SNW.Api && typeof SNW.Api.getAutoComfortStatus === 'function') {
                    const status = await SNW.Api.getAutoComfortStatus();
                    if (status && status.autoComfort) {
                        await SNW.Api.setAutoComfort(false);
                        if (SNW.Store) SNW.Store.set({ autoComfortEnabled: false });
                        if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('timer.autoComfortOff'));
                    }
                }
            } catch (e) {
                console.warn('[TimerManager] AutoComfort reset failed:', e);
            }

            // 세션 정지 (P2-12: dead code 제거)
            try {
                if (SNW.Api && typeof SNW.Api.stopSession === 'function') {
                    await SNW.Api.stopSession();
                }
            } catch (err) {
                console.error('[TimerManager] Session stop error on expire:', err);
            }
            if (SNW.ToastUtil && typeof SNW.ToastUtil.info === 'function') {
                SNW.ToastUtil.info(SNW.I18n.t('timer.expired'));
            }
        },

        async start(minutes) {
            const min = Math.round(Number(minutes));
            if (!Number.isFinite(min) || min <= 0 || min > 480) {
                this.cancel(true);
                return;
            }

            this.init();
            this._active = true;
            this._durationMin = min;
            this._targetEndMs = Date.now() + (min * 60 * 1000);

            // [Option A] ESP32 백엔드에 하드웨어 타이머 등록
            try {
                if (SNW.Api && typeof SNW.Api.setControlTimer === 'function') {
                    await SNW.Api.setControlTimer(min);
                } else if (SNW.Api && typeof SNW.Api.executeAiAction === 'function') {
                    await SNW.Api.executeAiAction('set_timer', { minutes: min });
                }
            } catch (e) {
                console.warn('[TimerManager] Backend sync failed:', e);
                if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('timer.backendSyncFailed'));
            }

            try {
                localStorage.setItem(LS_TIMER_KEY, JSON.stringify({
                    targetEndMs: this._targetEndMs,
                    durationMin: this._durationMin
                }));
            } catch (e) { }

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
            } catch (e) { }

            if (wasActive && SNW.Api && typeof SNW.Api.cancelControlTimer === 'function') {
                SNW.Api.cancelControlTimer().catch(() => { });
            }

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
            const st = SNW.Store ? SNW.Store.get() : null;
            const sess = st ? (st.session || (st.control && st.control.session)) : null;
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

