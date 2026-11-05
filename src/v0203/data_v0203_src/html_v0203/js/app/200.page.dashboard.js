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
