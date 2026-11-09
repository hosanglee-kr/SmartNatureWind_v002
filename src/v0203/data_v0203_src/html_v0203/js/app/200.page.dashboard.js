// =========================================================
// 200.page.dashboard.js — 홈 (Stage 6 감성 UX 완성형)
// Layer 4 (페이지 로직)
// 4대 섹션: ① Now Playing & 이퀄라이저 ② 플레이리스트 ③ Context 추천 ④ 일반 선풍기 Snap
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
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
            this._unsubs.forEach(fn => { try { fn(); } catch { } });
            this._unsubs = [];
            if (this._eq) this._eq.stop();
            this._eq = null;
            this._slider = null;
        }

        // =========================================================
        // =========================================================
        // 레이아웃 ([Stage 10] 3탭 구조: 제어 / 환경 / 프리셋)
        // =========================================================
        _render() {
            this.el.innerHTML = `
                <div class="snw-dashboard">
                    <!-- 3탭 헤더 (WCAG 2.1 AA role="tablist") -->
                    <div class="snw-tabs snw-dashboard__tabs" role="tablist" data-slot="dash-tabs" style="display:flex;gap:6px;margin-bottom:14px;">
                        <button type="button" class="snw-tab-btn is-active" role="tab" aria-selected="true" data-dash-tab="control">
                            🎛️ ${SNW.I18n.t('dashboard.tabControl')}
                        </button>
                        <button type="button" class="snw-tab-btn" role="tab" aria-selected="false" data-dash-tab="env">
                            🌡️ ${SNW.I18n.t('dashboard.tabEnv')}
                        </button>
                        <button type="button" class="snw-tab-btn" role="tab" aria-selected="false" data-dash-tab="preset">
                            🌿 ${SNW.I18n.t('dashboard.tabPreset')}
                        </button>
                    </div>

                    <!-- 탭 1: 제어 (Control) -->
                    <div data-dash-content="control" role="tabpanel" style="display:block;">
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
                                    <button type="button" class="snw-btn" data-action="timer-quick" title="타이머" hidden>⏱️</button>
                                </div>
                            </div>
                        </section>

                        <!-- ② 일반 선풍기 (Snap + Haptic) -->
                        <section class="snw-card snw-card--fan">
                            <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🌀 ${SNW.I18n.t('home.normalFan')}</h2>
                            <div data-slot="slider"></div>
                        </section>

                        <!-- ③ 재생할 플레이리스트 -->
                        <section class="snw-card snw-card--playlist">
                            <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🎵 ${SNW.I18n.t('home.playlist')}</h2>
                            <div data-slot="playlist-grid" class="snw-playlist-grid">
                                <div class="snw-empty" style="color:var(--snw-text-dim,#8b949e);">${SNW.I18n.t('common.loading')}</div>
                            </div>
                        </section>
                    </div>

                    <!-- 탭 2: 환경 (Environment) -->
                    <div data-dash-content="env" role="tabpanel" style="display:none;">
                        <!-- Context 추천 (Stage 6) -->
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
                                    ▶ 지금 추천 바람 재생
                                </button>
                            </div>
                            <!-- [Phase 5] Comfort 자동 모드 UI 슬롯 -->
                            <div class="snw-auto-comfort-box" data-slot="auto-comfort-box" style="margin-top:14px;padding:12px;background:var(--snw-surface-2);border:1px solid var(--snw-border);border-radius:8px;"></div>
                        </section>

                        <!-- 센서 모니터링 상세 요약 -->
                        <section class="snw-card">
                            <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🌡️ ${SNW.I18n.t('dashboard.sensorTitle')}</h2>
                            <div data-slot="sensors-summary">
                                <p style="font-size:13px;color:var(--snw-text-dim);margin:0 0 10px 0;">온도, 습도, PIR 재실 센서의 실시간 상세 파형을 확인할 수 있습니다.</p>
                            </div>
                            <a href="#/sensors" class="snw-btn snw-btn--sm" style="display:inline-block;">${SNW.I18n.t('common.details')} →</a>
                        </section>
                    </div>

                    <!-- 탭 3: 프리셋 (Presets) -->
                    <div data-dash-content="preset" role="tabpanel" style="display:none;">
                        <!-- 스타일 선택기 -->
                        <section class="snw-card snw-card--style">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <h2 style="margin:0; font-size:14px; font-weight:600;">${SNW.I18n.t('dashboard.styleTitle')}</h2>
                                <span style="font-size:11px; color:var(--snw-text-dim);">${SNW.I18n.t('dashboard.styleHint')}</span>
                            </div>
                            <div class="snw-style-selector" id="style-selector" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
                        </section>

                        <!-- 10대 자연풍 프리셋 그리드 -->
                        <section class="snw-card snw-card--preset">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <h2 style="margin:0; font-size:14px; font-weight:600;">${SNW.I18n.t('dashboard.presetTitle')}</h2>
                                <span style="font-size:11px; color:var(--snw-text-dim);">${SNW.I18n.t('dashboard.presetHint')}</span>
                            </div>
                            <div data-slot="presets"></div>
                        </section>
                    </div>
                </div>`;

            // 탭 이벤트 바인딩
            this.el.querySelectorAll('[data-dash-tab]').forEach(btn => {
                btn.addEventListener('click', () => this._switchDashTab(btn.getAttribute('data-dash-tab')));
            });

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
            const btnStop = this.el.querySelector('[data-action="stop"]');
            const btnTimerQuick = this.el.querySelector('[data-action="timer-quick"]');
            if (btnPause) btnPause.onclick = () => this._onPauseToggle();
            if (btnStop) btnStop.onclick = () => this._onStop();
            if (btnTimerQuick) btnTimerQuick.onclick = () => this._onQuickTimer();

            // Context 재생 버튼
            const btnRec = this.el.querySelector('[data-action="play-recommend"]');
            if (btnRec) {
                btnRec.onclick = () => this._onPlayRecommendation();
            }

            // Comfort 자동 모드 UI 초기화
            this._initAutoComfort();

            // 저장된 탭 복원
            const savedTab = localStorage.getItem('snw.dashboard.tab') || 'control';
            this._switchDashTab(savedTab);
        }

        // =========================================================
        // Store 구독
        // =========================================================
        _bindStore() {
            if (!SNW.Store || typeof SNW.Store.watch !== 'function') return;

            this._unsubs.push(
                SNW.Store.watch('session', () => this._renderNowPlaying()),
                SNW.Store.watch('sim', () => this._onSimUpdate()),
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
            const subEl = this.el.querySelector('[data-slot="np-sub"]');
            const btnPause = this.el.querySelector('[data-action="pause"]');
            const btnStop = this.el.querySelector('[data-action="stop"]');
            const btnTimerQuick = this.el.querySelector('[data-action="timer-quick"]');
            if (!titleEl) return;

            const typeName = s ? (s.typeName || (['NONE', 'PLAYLIST', 'PRESET', 'FIXED'][Number(s.type)] || String(s.type || 'NONE'))) : 'NONE';
            const isActive = s && typeName !== 'NONE' && s.active !== false && s.state !== 'COMPLETED';

            if (!isActive) {
                titleEl.textContent = '꺼짐';
                subEl.textContent = '세션 없음';
                if (btnPause) btnPause.hidden = true;
                if (btnStop) btnStop.hidden = true;
                if (btnTimerQuick) btnTimerQuick.hidden = true;
                this._eq?.renderStatic();
                this._eq?.stop();
                this._slider?.set(0);
                return;
            }

            const isPaused = s.state === 'PAUSED' || s.state === 1;
            let title = '', sub = '';

            if (typeName === 'PLAYLIST') {
                title = s.profileName || s.name || `프로필 #${s.profileNo || s.profileId || ''}`;
                const remain = this._fmtRemain(s.stepRemainSec || s.remainSec || 0);
                sub = `Step ${s.currentStep || s.stepNo || 1}/${s.totalSteps || 1} · ${remain}`;
            } else if (typeName === 'PRESET') {
                title = `${s.presetCode || ''} · ${s.styleCode || ''}`;
                sub = isPaused ? '일시정지' : '재생 중';
            } else if (typeName === 'FIXED') {
                const spd = (s.percent != null) ? s.percent : (s.fixedSpeed != null ? s.fixedSpeed : (s.speed || 0));
                title = `일반 선풍기 ${Math.round(spd)}%`;
                sub = isPaused ? '일시정지' : '재생 중';
                if (this._slider) this._slider.set(spd);
            }

            const isManual = (s.trigger === 1 || s.trigger === 'MANUAL' || s.triggerName === 'MANUAL');
            const triggerIcon = isManual ? '✋' : '⏰';
            titleEl.textContent = `${triggerIcon} ${title}`;
            subEl.textContent = isPaused ? `⏸ ${sub}` : sub;

            if (btnPause) {
                btnPause.hidden = false;
                btnPause.textContent = isPaused ? '▶' : '⏸';
            }
            if (btnStop) {
                btnStop.hidden = false;
            }
            if (btnTimerQuick) {
                btnTimerQuick.hidden = false;
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
            const typeNum = s ? Number(s.type) : 0;
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
            const envEl = this.el.querySelector('[data-slot="comfort-env"]');
            const levelEl = this.el.querySelector('[data-slot="comfort-level"]');
            const recEl = this.el.querySelector('[data-slot="comfort-recommend"]');
            const playBtn = this.el.querySelector('[data-action="play-recommend"]');
            if (!envEl) return;

            const emoji = ['🟢', '🟡', '🟠', '🔴'][ctx.level] || '⚪';
            const tempStr = (ctx.tempC != null) ? ctx.tempC.toFixed(1) : '--';
            const humStr = (ctx.humidity != null) ? ctx.humidity.toFixed(0) : '--';

            envEl.textContent = `🌡️ ${tempStr}°C  💧 ${humStr}%`;
            levelEl.textContent = `${emoji} ${ctx.levelText || ''}`;
            levelEl.className = `snw-comfort__level snw-comfort__level--${ctx.level}`;

            // 추천 표시
            const rec = ctx.recommend || {};
            const esc = (txt) => (SNW.DomUtil ? SNW.DomUtil.escape(txt) : txt);
            if (rec.profileId > 0) {
                recEl.innerHTML = `💡 현재 날씨엔 "<b>프로필 #${esc(String(rec.profileId))}</b>"이 가장 쾌적합니다`;
                if (playBtn) playBtn.disabled = false;
            } else if (rec.presetCode) {
                recEl.innerHTML = `💡 현재 날씨엔 "<b>${esc(String(rec.presetCode))} · ${esc(String(rec.styleCode || ''))}</b>" 바람을 추천합니다`;
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

        // =========================================================
        // [Stage 10] 3탭 전환 및 영구 저장
        // =========================================================
        _switchDashTab(tab) {
            this.el.querySelectorAll('[data-dash-tab]').forEach(b => {
                const isActive = b.getAttribute('data-dash-tab') === tab;
                b.classList.toggle('is-active', isActive);
                b.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            this.el.querySelectorAll('[data-dash-content]').forEach(c => {
                c.style.display = (c.getAttribute('data-dash-content') === tab) ? 'block' : 'none';
            });
            localStorage.setItem('snw.dashboard.tab', tab);

            if (tab === 'preset' && !this._presetRendered) {
                this._renderStyleSelector();
                this._renderPresetGrid();
                this._presetRendered = true;
            }
        }

        // =========================================================
        // [Stage 10] 퀵 타이머 다이얼로그
        // =========================================================
        _onQuickTimer() {
            const cur = (SNW.TimerManager && SNW.TimerManager.getStatus) ? SNW.TimerManager.getStatus() : null;
            if (cur && cur.active) {
                if (confirm(SNW.I18n.t('timer.cancel') + '?')) {
                    SNW.TimerManager.cancel(true);
                }
                return;
            }
            const choice = prompt(SNW.I18n.t('timer.quickPrompt'), '30');
            const min = Number(choice);
            if (min > 0 && SNW.TimerManager) {
                SNW.TimerManager.start(min);
                if (SNW.ToastUtil) SNW.ToastUtil.info(`${min}분 타이머가 시작되었습니다.`);
            }
        }

        // =========================================================
        // [Stage 10] Style Selector 5종 렌더러
        // =========================================================
        _renderStyleSelector() {
            const wrap = this.el.querySelector('#style-selector');
            if (!wrap) return;
            const STYLES = [
                { code: 'BALANCE', icon: '⚖️', label: '균형' },
                { code: 'ACTIVE',  icon: '⚡', label: '활력' },
                { code: 'FOCUS',   icon: '🎯', label: '집중' },
                { code: 'RELAX',   icon: '🍃', label: '휴식' },
                { code: 'SLEEP',   icon: '🌙', label: '수면' },
            ];
            const sim = (SNW.Store && SNW.Store.get) ? (SNW.Store.get().sim || {}) : {};
            const cur = sim.styleCode || 'BALANCE';

            wrap.innerHTML = STYLES.map(s => `
                <button type="button" class="snw-btn snw-btn--sm ${s.code === cur ? 'snw-btn-primary' : ''}" data-style="${s.code}">
                    ${s.icon} ${s.label}
                </button>
            `).join('');

            wrap.querySelectorAll('[data-style]').forEach(btn => {
                btn.onclick = async () => {
                    const styleCode = btn.getAttribute('data-style');
                    wrap.querySelectorAll('[data-style]').forEach(b => b.classList.toggle('snw-btn-primary', b === btn));
                    try {
                        if (SNW.Api && typeof SNW.Api.patchSim === 'function') {
                            await SNW.Api.patchSim({ styleCode });
                            if (SNW.Haptic) SNW.Haptic.snap();
                        }
                    } catch (e) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error(e.message);
                    }
                };
            });
        }

        // =========================================================
        // [Stage 10] 10대 자연풍 프리셋 그리드 렌더러
        // =========================================================
        _renderPresetGrid() {
            const wrap = this.el.querySelector('[data-slot="presets"]');
            if (!wrap) return;

            const PRESETS = [
                { code: 'OCEAN', icon: '🌊', name: '바다 바람' },
                { code: 'COUNTRY_BREEZE', icon: '🏡', name: '산들바람' },
                { code: 'MEDITERRANEAN', icon: '🏖️', name: '지중해' },
                { code: 'MOUNTAIN', icon: '🏔️', name: '고산 계곡' },
                { code: 'PLAINS', icon: '🌾', name: '들판 바람' },
                { code: 'HARBOR_BREEZE', icon: '⚓', name: '항구 바람' },
                { code: 'FOREST_CANOPY', icon: '🌲', name: '숲속 그늘' },
                { code: 'URBAN_SUNSET', icon: '🌆', name: '도시 노을' },
                { code: 'TROPICAL_RAIN', icon: '🌴', name: '열대 우림' },
                { code: 'DESERT_NIGHT', icon: '🌙', name: '사막 밤' },
            ];

            const sim = (SNW.Store && SNW.Store.get) ? (SNW.Store.get().sim || {}) : {};
            const cur = sim.presetCode || 'OCEAN';

            wrap.innerHTML = `
                <div class="snw-preset-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
                    ${PRESETS.map(p => `
                        <button type="button" class="snw-btn ${p.code === cur ? 'snw-btn-primary' : ''}" data-preset="${p.code}" style="text-align:left;padding:10px;">
                            <span style="font-size:18px;margin-right:6px;">${p.icon}</span>
                            <strong>${p.name}</strong>
                        </button>
                    `).join('')}
                </div>`;

            wrap.querySelectorAll('[data-preset]').forEach(btn => {
                btn.onclick = async () => {
                    const presetCode = btn.getAttribute('data-preset');
                    wrap.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('snw-btn-primary', b === btn));
                    try {
                        const curStyle = (SNW.Store && SNW.Store.get && SNW.Store.get().sim && SNW.Store.get().sim.styleCode) || 'BALANCE';
                        if (SNW.Api && typeof SNW.Api.startPreset === 'function') {
                            await SNW.Api.startPreset(presetCode, curStyle);
                            if (SNW.Haptic) SNW.Haptic.stepChange();
                            if (SNW.ToastUtil) SNW.ToastUtil.success(`${presetCode} 재생 시작`);
                        }
                    } catch (e) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error(e.message);
                    }
                };
            });
        }

        // =========================================================
        // [Stage 10 Phase 5] Comfort 자동 모드 UI 초기화
        // =========================================================
        _initAutoComfort() {
            const slot = this.el.querySelector('[data-slot="auto-comfort-box"]');
            if (!slot) return;

            slot.innerHTML = `
                <div class="snw-auto-comfort-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong style="font-size:14px;color:var(--snw-text);">🔄 ${SNW.I18n.t('comfort.autoTitle')}</strong>
                        <p style="margin:4px 0 0 0;font-size:12px;color:var(--snw-text-dim);">${SNW.I18n.t('comfort.autoDesc')}</p>
                    </div>
                    <label class="snw-switch" style="position:relative;display:inline-block;width:44px;height:24px;">
                        <input type="checkbox" id="chk-auto-comfort">
                        <span class="snw-slider-switch round"></span>
                    </label>
                </div>
                <div class="snw-auto-comfort-status" id="auto-comfort-status-text" style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);"></div>`;

            const chk = slot.querySelector('#chk-auto-comfort');
            const statusText = slot.querySelector('#auto-comfort-status-text');

            if (SNW.Api && typeof SNW.Api.getAutoComfortStatus === 'function') {
                SNW.Api.getAutoComfortStatus().then(res => {
                    if (!res) return;
                    chk.checked = !!res.autoComfort;
                    this._updateAutoComfortStatusText(statusText, res.autoComfort, res.remainSec);
                }).catch(() => {});
            }

            chk.addEventListener('change', async () => {
                const targetState = chk.checked;
                if (targetState) {
                    if (!confirm(SNW.I18n.t('comfort.autoConfirmOn'))) {
                        chk.checked = false;
                        return;
                    }
                }
                try {
                    if (SNW.Api && typeof SNW.Api.setAutoComfort === 'function') {
                        const res = await SNW.Api.setAutoComfort(targetState);
                        if (SNW.ToastUtil) SNW.ToastUtil.info(targetState ? SNW.I18n.t('comfort.autoOn') : SNW.I18n.t('comfort.autoOff'));
                        this._updateAutoComfortStatusText(statusText, targetState, res ? res.remainSec : 300);
                    }
                } catch (e) {
                    chk.checked = !targetState;
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message);
                }
            });
        }

        _updateAutoComfortStatusText(el, enabled, remainSec) {
            if (!el) return;
            if (!enabled) {
                el.textContent = SNW.I18n.t('comfort.autoOff');
                return;
            }
            const min = Math.floor((remainSec || 0) / 60);
            const sec = (remainSec || 0) % 60;
            el.innerHTML = `<span class="snw-badge snw-badge--auto" style="background:rgba(40,167,69,0.15);color:#28a745;padding:2px 6px;border-radius:4px;font-weight:600;">${SNW.I18n.t('comfort.autoBadge')}</span> ${SNW.I18n.t('comfort.nextEval')} ${min}분 ${sec}초`;
        }
    };
})(window.SNW);
