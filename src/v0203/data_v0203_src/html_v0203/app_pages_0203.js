
/* ---- 200.page.dashboard.js (61612 bytes) ---- */
// =========================================================
// 200.page.dashboard.js — 홈 (Stage 5 UX 완성형)
// Layer 4 (페이지 로직)
//  - 9종 원터치 시나리오 (3×3 그리드, is-running 토글)
//  - Now Playing & 이퀄라이저 (AUTO 배지, ENV_PAUSED 연동)
//  - AUTOOFF_STOPPED 야간 리포트 + 1클릭 복구
//  - 일반 선풍기 Snap & 플레이리스트
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
            this._presetRendered = false;
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
            if (this._autoComfortTickId) {
                clearInterval(this._autoComfortTickId);
                this._autoComfortTickId = null;
            }
            this._unsubs.forEach(fn => { try { fn(); } catch { } });
            this._unsubs = [];
            if (this._eq) this._eq.stop();
            this._eq = null;
            this._slider = null;
        }

        // =========================================================
        // 레이아웃 (3탭 구조: 제어 / 환경 / 프리셋)
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
                        <!-- ⓪ AUTOOFF_STOPPED 야간 리포트 + 1클릭 복구 슬롯 -->
                        <div data-slot="autooff-report" style="margin-bottom:12px;" hidden></div>

                        <!-- ① 시나리오 원터치 9종 (3×3 그리드, Stage 5 신규) -->
                        <section class="snw-card snw-card--scenarios">
                            <h2 style="font-size:14px;font-weight:600;margin-bottom:12px;">
                                ⚡ ${SNW.I18n.t('home.oneTouchStart')}
                            </h2>
                            <div class="snw-scenario-grid" data-slot="scenarios">
                                ${this._renderScenarioGrid()}
                            </div>
                        </section>

                        <!-- ② Now Playing + 이퀄라이저 -->
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

                        <!-- ③ 일반 선풍기 (Snap + Haptic) -->
                        <section class="snw-card snw-card--fan">
                            <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🌀 ${SNW.I18n.t('home.normalFan')}</h2>
                            <div data-slot="slider"></div>
                        </section>

                        <!-- ④ 재생할 플레이리스트 -->
                        <section class="snw-card snw-card--playlist">
                            <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🎵 ${SNW.I18n.t('home.playlist')}</h2>
                            <div data-slot="playlist-grid" class="snw-playlist-grid">
                                <div class="snw-empty" style="color:var(--snw-text-dim,#8b949e);">${SNW.I18n.t('common.loading')}</div>
                            </div>
                        </section>
                    </div>

                    <!-- 탭 2: 환경 (Environment) -->
                    <div data-dash-content="env" role="tabpanel" style="display:none;">
                        <!-- Context 추천 -->
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
                            <!-- Comfort 자동 모드 UI 슬롯 -->
                            <div class="snw-auto-comfort-box" data-slot="auto-comfort-box" style="margin-top:14px;padding:12px;background:var(--snw-surface-2);border:1px solid var(--snw-border);border-radius:8px;"></div>
                        </section>

                        <!-- 센서 모니터링 상세 요약 -->
                        <section class="snw-card">
                            <h2 style="font-size:16px;margin-bottom:12px;font-weight:600;">🌡️ ${SNW.I18n.t('dashboard.sensorTitle')}</h2>
                            <div data-slot="sensors-summary">
                                <p style="font-size:13px;color:var(--snw-text-dim);margin:0 0 10px 0;">온도, 습도, PIR 재실 센서의 실시간 상세 파형을 확인할 수 있습니다.</p>
                            </div>
                            <a href="#/monitor/sensors" class="snw-btn snw-btn--sm" style="display:inline-block;">${SNW.I18n.t('common.details')} →</a>
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

            // [Stage 5] 시나리오 원터치 이벤트 위임 & 롱프레스 지원
            let pressTimer = null;
            let longPressed = false;

            SNW.DomUtil.delegate(this.el, '[data-scenario]', 'mousedown', (e, btn) => {
                longPressed = false;
                const key = btn.getAttribute('data-scenario');
                if (key === 'autoSelect' || key === 'sleep') {
                    pressTimer = setTimeout(() => {
                        longPressed = true;
                        this._onScenarioClick(key, true);
                    }, 650);
                }
            });

            SNW.DomUtil.delegate(this.el, '[data-scenario]', 'mouseup', (e, btn) => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            });

            SNW.DomUtil.delegate(this.el, '[data-scenario]', 'click', (e, btn) => {
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
                if (longPressed) {
                    longPressed = false;
                    return;
                }
                const key = btn.getAttribute('data-scenario');
                this._onScenarioClick(key, false);
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

        // ═══════════════════════════════════════════════════════════
        // [Stage 5] 시나리오 원터치 9종 (3×3)
        // ═══════════════════════════════════════════════════════════
        _renderScenarioGrid() {
            const t = (k) => SNW.I18n.t(k);
            const scenarios = [
                { key: 'sleep',      color: 'lavender', type: 'autoSelect', profileNo: 10 },
                { key: 'office',     color: 'mint',     type: 'playlist',   profileNo: 20 },
                { key: 'study',      color: 'mint',     type: 'playlist',   profileNo: 30 },
                { key: 'rest',       color: 'emerald',  type: 'playlist',   profileNo: 40 },
                { key: 'exercise',   color: 'amber',    type: 'playlist',   profileNo: 50 },
                { key: 'baby',       color: 'paleblue', type: 'playlist',   profileNo: 80 },
                { key: 'pet',        color: 'paleblue', type: 'playlist',   profileNo: 70 },
                { key: 'autoFull',   color: 'cyan',     type: 'autoFull' },
                { key: 'autoSelect', color: 'cyan',     type: 'autoSelect' },
            ];

            return scenarios.map(s => {
                const fullText = t('home.scenario.' + s.key);
                const parts = fullText.split(' ');
                const icon = parts[0] || '✨';
                const name = parts.slice(1).join(' ') || fullText;
                return `
                <button type="button" class="snw-scenario-card snw-scenario-card--${s.color}"
                        data-scenario="${s.key}">
                    <span class="snw-scenario-card__icon">${icon}</span>
                    <span class="snw-scenario-card__name">${name}</span>
                    <span class="snw-scenario-card__meta">${t('home.scenario.' + s.key + 'Meta')}</span>
                </button>`;
            }).join('');
        }

        // [Stage 5] 현재 가동 중인 시나리오에 is-running 클래스 반영
        _updateScenarioRunning() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const s = store.session;
            const ctl = store.control || {};
            const isPausedOrBlocked = (ctl.stateCode === 5); // AUTOOFF_STOPPED
            const isActive = s && (s.state === 'ACTIVE' || s.state === 2) && !isPausedOrBlocked;

            const cards = this.el.querySelectorAll('[data-scenario]');
            cards.forEach(card => card.classList.remove('is-running'));

            if (!isActive) return;

            const typeName = s.typeName || (['NONE', 'PLAYLIST', 'PRESET', 'FIXED', 'AUTO_FULL', 'AUTO_SELECT'][Number(s.type)] || String(s.type || ''));

            let runningKey = null;
            if (typeName === 'AUTO_FULL' || s.type === 4) {
                runningKey = 'autoFull';
            } else if (typeName === 'AUTO_SELECT' || s.type === 5) {
                // sleep 베이스인지 여부 확인
                if (s.styleCode === 'SLEEP' || s.profileNo === 10) {
                    runningKey = 'sleep';
                } else {
                    runningKey = 'autoSelect';
                }
            } else if (typeName === 'PLAYLIST' || s.type === 1) {
                const pNo = Number(s.profileNo || 0);
                if (pNo === 10) runningKey = 'sleep';
                else if (pNo === 20) runningKey = 'office';
                else if (pNo === 30) runningKey = 'study';
                else if (pNo === 40) runningKey = 'rest';
                else if (pNo === 50) runningKey = 'exercise';
                else if (pNo === 70) runningKey = 'pet';
                else if (pNo === 80) runningKey = 'baby';
            }

            if (runningKey) {
                const activeCard = this.el.querySelector(`[data-scenario="${runningKey}"]`);
                if (activeCard) activeCard.classList.add('is-running');
            }
        }

        async _onScenarioClick(key, forceDialog = false) {
            // [is-running 토글 지원] 이미 실행 중인 카드를 다시 누르면 정지
            const targetBtn = this.el.querySelector(`[data-scenario="${key}"]`);
            if (targetBtn && targetBtn.classList.contains('is-running')) {
                try {
                    await SNW.Api.stopSession();
                    if (SNW.Haptic) SNW.Haptic.stop();
                    if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('common.stopSession') || '세션 정지');
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '정지 실패');
                }
                return;
            }

            const skipConfirm = localStorage.getItem('snw_skip_scenario_confirm') === '1';

            // ── AUTO_FULL 시나리오 ──
            if (key === 'autoFull') {
                if (!skipConfirm) {
                    const ok = await this._showAutoFullConfirm();
                    if (!ok) return;
                }
                try {
                    await SNW.Api.startSession({
                        type: 'AUTO_FULL',
                        payload: {}
                    });
                    if (SNW.Haptic) SNW.Haptic.stepChange();
                    if (SNW.ToastUtil) SNW.ToastUtil.success(SNW.I18n.t('session.autoFull'));
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '시작 실패');
                }
                return;
            }

            // ── AUTO_SELECT 시나리오 (sleep 또는 autoSelect) ──
            if (key === 'autoSelect' || key === 'sleep') {
                let base = null;
                const saved = localStorage.getItem('snw.lastAutoSelectBase');
                if (saved && !forceDialog) {
                    try { base = JSON.parse(saved); } catch (e) { }
                }

                if (!base || forceDialog) {
                    base = await this._showAutoSelectDialog(key === 'sleep');
                    if (!base) return;
                    try { localStorage.setItem('snw.lastAutoSelectBase', JSON.stringify(base)); } catch (e) { }
                }

                try {
                    await SNW.Api.startSession({
                        type: 'AUTO_SELECT',
                        payload: base
                    });
                    if (SNW.Haptic) SNW.Haptic.stepChange();
                    const title = (key === 'sleep') ? SNW.I18n.t('home.scenario.sleep') : SNW.I18n.t('session.autoSelect');
                    if (SNW.ToastUtil) SNW.ToastUtil.success(title);
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '시작 실패');
                }
                return;
            }

            // ── 일반 시나리오 (PLAYLIST / PRESET: office, study, rest, exercise, pet=70, baby=80) ──
            if (!skipConfirm) {
                const ok = await this._showScenarioConfirm(key);
                if (!ok) return;
            }

            try {
                if (['office', 'study', 'rest', 'exercise', 'pet', 'baby'].includes(key)) {
                    const profileNoMap = { office: 20, study: 30, rest: 40, exercise: 50, pet: 70, baby: 80 };
                    const profileNo = profileNoMap[key];
                    const pData = await SNW.Api.listProfiles();
                    const pRoot = (pData && pData.userProfiles) ? pData.userProfiles : pData;
                    const profs = (pRoot && pRoot.profiles) || [];
                    const prof = profs.find(p => p.profileNo === profileNo);
                    if (prof) {
                        await SNW.Api.startPlaylist(prof.profileId);
                    } else {
                        // 기본 프리셋으로 fallback 실행
                        const defaultPresetMap = { office: 'COUNTRY_BREEZE', study: 'FOREST_CANOPY', rest: 'OCEAN', exercise: 'MOUNTAIN', pet: 'COUNTRY_BREEZE', baby: 'OCEAN' };
                        const presetCode = defaultPresetMap[key] || 'OCEAN';
                        await SNW.Api.startPreset(presetCode, 'BALANCE');
                    }
                }
                if (SNW.Haptic) SNW.Haptic.stepChange();
                if (SNW.ToastUtil) SNW.ToastUtil.success(SNW.I18n.t('msg.playSuccess') || '재생 시작');
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '시작 실패');
            }
        }

        _showScenarioConfirm(key) {
            const t = (k) => SNW.I18n.t(k);
            return new Promise(resolve => {
                const content = document.createElement('div');
                content.innerHTML = `
                    <p>${t('home.scenario.' + key)} 모드로 시작할까요?</p>
                    <label style="display:flex;align-items:center;gap:8px;margin-top:16px;font-size:12px;">
                        <input type="checkbox" data-skip>
                        <span>${t('home.scenario.skipConfirm')}</span>
                    </label>
                `;
                SNW.UI.modal(
                    t('home.scenario.' + key),
                    content,
                    async () => {
                        if (content.querySelector('[data-skip]').checked) {
                            localStorage.setItem('snw_skip_scenario_confirm', '1');
                        }
                        resolve(true);
                        return true;
                    },
                    () => { resolve(false); },
                    { okLabel: t('common.start') || '시작', cancelLabel: t('common.cancel') || '취소' }
                );
            });
        }

        _showAutoFullConfirm() {
            const t = (k) => SNW.I18n.t(k);
            return new Promise(resolve => {
                const content = document.createElement('div');
                content.innerHTML = `
                    <p style="font-weight:600;margin-bottom:12px;">${t('session.autoFull')}</p>
                    <ul style="list-style:none;padding:0;margin:0 0 16px;font-size:13px;line-height:1.8;">
                        <li>${t('session.autoFullHint1')}</li>
                        <li>${t('session.autoFullHint2')}</li>
                        <li>${t('session.autoFullHint3')}</li>
                        <li>${t('session.autoFullHint4')}</li>
                    </ul>
                    <label style="display:flex;align-items:center;gap:8px;font-size:12px;">
                        <input type="checkbox" data-skip>
                        <span>${t('home.scenario.skipConfirm')}</span>
                    </label>
                `;
                SNW.UI.modal(
                    t('session.autoFull'),
                    content,
                    async () => {
                        if (content.querySelector('[data-skip]').checked) {
                            localStorage.setItem('snw_skip_scenario_confirm', '1');
                        }
                        resolve(true);
                        return true;
                    },
                    () => { resolve(false); },
                    { okLabel: t('common.start') || '시작', cancelLabel: t('common.cancel') || '취소' }
                );
            });
        }

        async _showAutoSelectDialog(isSleepMode = false) {
            const t = (k) => SNW.I18n.t(k);
            // 프로파일 목록 로드
            let profiles = [];
            try {
                const pData = await SNW.Api.listProfiles();
                const pRoot = (pData && pData.userProfiles) ? pData.userProfiles : pData;
                profiles = (pRoot && pRoot.profiles) || [];
            } catch (e) {}

            const hasProfiles = profiles.length > 0;

            return new Promise(resolve => {
                const content = document.createElement('div');
                content.innerHTML = `
                    <p style="font-weight:600;margin-bottom:12px;">${t('session.autoSelectPrompt')}</p>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <label style="display:flex;align-items:center;gap:8px;">
                            <input type="radio" name="autoSelectBase" value="PRESET" checked>
                            <span>${t('session.autoSelectPreset')}</span>
                            <select data-preset-select style="margin-left:auto;padding:4px 8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                <option value="OCEAN" ${isSleepMode ? 'selected' : ''}>🌊 OCEAN</option>
                                <option value="COUNTRY_BREEZE">🏡 COUNTRY</option>
                                <option value="FOREST_CANOPY">🌲 FOREST</option>
                                <option value="MOUNTAIN">🏔 MOUNTAIN</option>
                            </select>
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;${hasProfiles ? '' : 'opacity:0.5;'}">
                            <input type="radio" name="autoSelectBase" value="PLAYLIST" ${hasProfiles ? '' : 'disabled'}>
                            <span>${t('session.autoSelectPlaylist')}</span>
                            <select data-profile-select ${hasProfiles ? '' : 'disabled'} style="margin-left:auto;padding:4px 8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                ${hasProfiles
                                    ? profiles.map(p => `<option value="${p.profileId}">${SNW.DomUtil ? SNW.DomUtil.escape(p.name) : p.name}</option>`).join('')
                                    : '<option value="">프로파일 없음</option>'}
                            </select>
                        </label>
                        ${hasProfiles ? '' : `
                            <p style="font-size:11px;color:var(--snw-warn,#d29922);">
                                ⚠️ PLAYLIST를 선택하려면 먼저 Wind Studio에서 프로파일을 만들어주세요.
                            </p>
                        `}
                    </div>
                    <p style="margin-top:16px;font-size:11px;color:var(--snw-text-dim);line-height:1.6;">
                        ${t('session.autoSelectHint')}
                    </p>
                `;

                SNW.UI.modal(
                    t('session.autoSelect'),
                    content,
                    async () => {
                        const baseTypeEl = content.querySelector('input[name="autoSelectBase"]:checked');
                        if (!baseTypeEl) return false;
                        const baseType = baseTypeEl.value;

                        if (baseType === 'PRESET') {
                            const presetCode = content.querySelector('[data-preset-select]').value;
                            resolve({ baseType: 'PRESET', presetCode, styleCode: isSleepMode ? 'SLEEP' : 'BALANCE' });
                        } else {
                            if (!hasProfiles) {
                                if (SNW.ToastUtil) SNW.ToastUtil.warn('프로파일이 없습니다. Wind Studio에서 먼저 만들어주세요.');
                                return false;
                            }
                            const profileIdStr = content.querySelector('[data-profile-select]').value;
                            const profileId = Number(profileIdStr);
                            if (!profileId || profileId <= 0) {
                                if (SNW.ToastUtil) SNW.ToastUtil.warn('유효한 프로파일을 선택하세요.');
                                return false;
                            }
                            resolve({ baseType: 'PLAYLIST', profileId });
                        }
                        return true;
                    },
                    () => { resolve(null); },
                    { okLabel: t('common.start') || '시작', cancelLabel: t('common.cancel') || '취소' }
                );
            });
        }

        // =========================================================
        // Store 구독
        // =========================================================
        _bindStore() {
            if (!SNW.Store || typeof SNW.Store.watch !== 'function') return;

            this._unsubs.push(
                SNW.Store.watch('session', () => {
                    this._renderNowPlaying();
                    this._renderAutoComfortStatus();
                    this._updateScenarioRunning();
                }),
                SNW.Store.watch('sim', () => this._onSimUpdate()),
                SNW.Store.watch('control', () => {
                    this._onControlUpdate();
                    this._renderNowPlaying();
                    this._renderAutoComfortStatus();
                    this._renderAutoOffReport();
                    this._updateScenarioRunning();
                }),
                SNW.Store.watch('autoComfortEnabled', () => this._renderAutoComfortStatus())
            );
            // 초기 렌더
            this._renderNowPlaying();
            this._renderAutoOffReport();
            this._updateScenarioRunning();
        }

        // =========================================================
        // [Stage 5] AUTOOFF_STOPPED 야간 리포트 + 1클릭 복구
        // =========================================================
        _renderAutoOffReport() {
            const reportSlot = this.el.querySelector('[data-slot="autooff-report"]');
            if (!reportSlot) return;

            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const ctl = store.control || {};
            const isAutoOff = (ctl.stateCode === 5); // AUTOOFF_STOPPED

            if (!isAutoOff) {
                reportSlot.hidden = true;
                reportSlot.innerHTML = '';
                return;
            }

            const reason = ctl.stopReason || 0;
            let reasonDesc = '타이머 또는 야간 자동 정지 규칙에 의해 정지되었습니다.';
            if (reason === 12) reasonDesc = '야간 실내 온도가 너무 낮아져 안전을 위해 자동 정지되었습니다. (감기 방지)';
            else if (reason === 13) reasonDesc = '야간 불쾌지수가 낮아져 완전 정지되었습니다.';
            else if (reason === 1) reasonDesc = '설정된 타이머 만료로 정지되었습니다.';
            else if (reason === 2) reasonDesc = '설정된 예약 시각 도달로 정지되었습니다.';

            reportSlot.hidden = false;
            reportSlot.innerHTML = `
                <div class="snw-autooff-report">
                    <div class="snw-autooff-report__info">
                        <strong>⏹ 야간 자동 정지 리포트</strong>
                        <span class="snw-autooff-report__desc">${reasonDesc}</span>
                    </div>
                    <button type="button" class="snw-btn snw-btn--sm snw-btn-primary" data-action="ack-restore" style="white-space:nowrap;">
                        ▶ 1클릭 복구
                    </button>
                </div>`;

            const btnAck = reportSlot.querySelector('[data-action="ack-restore"]');
            if (btnAck) {
                btnAck.onclick = async () => {
                    try {
                        if (SNW.Api && typeof SNW.Api.ackEvent === 'function') {
                            await SNW.Api.ackEvent();
                        }
                        if (SNW.ToastUtil) SNW.ToastUtil.success('정지 상태가 해제되었습니다');
                        reportSlot.hidden = true;
                    } catch (e) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '복구 실패');
                    }
                };
            }
        }

        // =========================================================
        // Now Playing 렌더
        // =========================================================
        _renderNowPlaying() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const s = store.session;
            const ctl = store.control || {};
            const titleEl = this.el.querySelector('[data-slot="np-title"]');
            const subEl = this.el.querySelector('[data-slot="np-sub"]');
            const btnPause = this.el.querySelector('[data-action="pause"]');
            const btnStop = this.el.querySelector('[data-action="stop"]');
            const btnTimerQuick = this.el.querySelector('[data-action="timer-quick"]');
            if (!titleEl) return;

            const typeName = s ? (s.typeName || (['NONE', 'PLAYLIST', 'PRESET', 'FIXED', 'AUTO_FULL', 'AUTO_SELECT'][Number(s.type)] || String(s.type || 'NONE'))) : 'NONE';
            const isActive = s && typeName !== 'NONE' && s.active !== false && s.state !== 'COMPLETED';

            // [Stage 5] ENV_PAUSED(7) 상태 감지
            const isEnvPaused = (ctl.stateCode === 7);

            if (isEnvPaused) {
                const pauseReason = ctl.pauseReason || 0;
                let reasonText = SNW.I18n.t('fsm.pauseReasonTempLow');
                if (pauseReason === 1) reasonText = SNW.I18n.t('fsm.pauseReasonMotion');
                else if (pauseReason === 3) reasonText = SNW.I18n.t('fsm.pauseReasonDiLow');

                titleEl.textContent = `⏸ ${SNW.I18n.t('fsm.envPaused')}`;
                subEl.textContent = `${reasonText} · 대기 중`;

                if (btnPause) {
                    btnPause.hidden = false;
                    btnPause.textContent = '▶';
                }
                if (btnStop) btnStop.hidden = false;
                if (btnTimerQuick) btnTimerQuick.hidden = true;
                this._eq?.renderStatic();
                this._eq?.stop();
                return;
            }

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

            if (typeName === 'AUTO_FULL' || s.type === 4) {
                title = SNW.I18n.t('session.autoFull');
                sub = isPaused ? '일시정지' : (s.autoSwitchReason ? `✨ ${s.autoSwitchReason}` : '실시간 100% 자율 제어');
            } else if (typeName === 'AUTO_SELECT' || s.type === 5) {
                title = SNW.I18n.t('session.autoSelect');
                sub = isPaused ? '일시정지' : (s.autoSwitchReason ? `🎯 ${s.autoSwitchReason}` : '바람 기준 고정 · 자동 세기 조절');
            } else if (typeName === 'PLAYLIST') {
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
            let triggerIcon = isManual ? '✋' : '⏰';
            if (typeName === 'AUTO_FULL' || s.type === 4) triggerIcon = '✨';
            else if (typeName === 'AUTO_SELECT' || s.type === 5) triggerIcon = '🎯';

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
        // sim 업데이트 → 이퀄라이저 push (stateCode 4 제거, 7 반영)
        // =========================================================
        _onSimUpdate() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const sim = store.sim;
            if (!sim) return;

            const s = store.session;
            const ctl = store.control;

            // [Phase3 N-1 / Stage 5] stateCode === 7(ENV_PAUSED) 및 5(AUTOOFF_STOPPED) 차단
            const typeNum = s ? Number(s.type) : 0;
            const isPausedOrBlocked = (ctl && (ctl.stateCode === 7 || ctl.stateCode === 5));
            const isActive = (typeNum > 0) && (s.state === 'ACTIVE' || s.state === 2) && !isPausedOrBlocked;

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
                    grid.innerHTML = `<div class="snw-empty" style="color:var(--snw-text-dim,#8b949e);padding:16px 0;">작곡한 프로필이 없습니다.<br><a href="#/wind/studio" style="color:var(--snw-primary,#4a9eff);text-decoration:none;font-weight:600;display:inline-block;margin-top:8px;">🎨 Studio에서 작곡하기</a></div>`;
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
            const ctl = store.control || {};
            // ENV_PAUSED(7) 상태일 때는 resumeSession 호출
            if (ctl.stateCode === 7) {
                try {
                    await SNW.Api.resumeSession();
                    if (SNW.Haptic) SNW.Haptic.success();
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '재개 실패');
                }
                return;
            }
            if (!s) return;
            try {
                if (s.state === 'PAUSED' || s.state === 1) {
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
        // 3탭 전환 및 영구 저장
        // =========================================================
        _switchDashTab(tab) {
            const validTabs = ['control', 'env', 'preset'];
            const targetTab = validTabs.includes(tab) ? tab : 'control';
            this.el.querySelectorAll('[data-dash-tab]').forEach(b => {
                const isActive = b.getAttribute('data-dash-tab') === targetTab;
                b.classList.toggle('is-active', isActive);
                b.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
            this.el.querySelectorAll('[data-dash-content]').forEach(c => {
                c.style.display = (c.getAttribute('data-dash-content') === targetTab) ? 'block' : 'none';
            });
            localStorage.setItem('snw.dashboard.tab', targetTab);

            if (targetTab === 'preset' && !this._presetRendered) {
                this._renderStyleSelector();
                this._renderPresetGrid();
                this._presetRendered = true;
            }
        }

        // =========================================================
        // 퀵 타이머 다이얼로그
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
            if (choice === null) return;
            const min = Math.round(Number(choice));
            if (!Number.isFinite(min) || min <= 0) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('timer.invalidInput'));
                return;
            }
            if (min > 480) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('timer.maxRange'));
                return;
            }
            if (SNW.TimerManager) {
                SNW.TimerManager.start(min);
                if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('timer.quickStarted', { min }));
            }
        }

        // =========================================================
        // Style Selector 5종 렌더러
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
        // 10대 자연풍 프리셋 그리드 렌더러
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
        // Comfort 자동 모드 UI 초기화
        // =========================================================
        _initAutoComfort() {
            const slot = this.el.querySelector('[data-slot="auto-comfort-box"]');
            if (!slot) return;
            if (slot.children.length > 0) return;

            slot.innerHTML = `
                <div class="snw-auto-comfort-header" style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <strong style="font-size:14px;color:var(--snw-text);">🔄 ${SNW.I18n.t('comfort.autoTitle')}</strong>
                        <p style="margin:4px 0 0 0;font-size:12px;color:var(--snw-text-dim);">${SNW.I18n.t('comfort.autoDesc')}</p>
                    </div>
                    <label class="snw-switch" style="position:relative;display:inline-block;width:44px;height:24px;">
                        <input type="checkbox" id="chk-auto-comfort">
                        <span class="snw-switch__slider"></span>
                    </label>
                </div>
                <div class="snw-auto-comfort__status" id="auto-comfort-status-text" role="status" aria-live="polite"></div>`;

            const chk = slot.querySelector('#chk-auto-comfort');
            let userInteracted = false;

            if (SNW.Api && typeof SNW.Api.getAutoComfortStatus === 'function') {
                SNW.Api.getAutoComfortStatus().then(res => {
                    if (!res || userInteracted) return;
                    chk.checked = !!res.autoComfort;
                    if (SNW.Store) SNW.Store.set({ autoComfortEnabled: !!res.autoComfort });
                    this._renderAutoComfortStatus();
                    this._startAutoComfortTick();
                }).catch(() => {});
            }

            chk.addEventListener('change', async () => {
                userInteracted = true;
                const targetState = chk.checked;
                if (targetState) {
                    if (!confirm(SNW.I18n.t('comfort.autoConfirmOn'))) {
                        chk.checked = false;
                        return;
                    }
                }
                try {
                    if (SNW.Api && typeof SNW.Api.setAutoComfort === 'function') {
                        await SNW.Api.setAutoComfort(targetState);
                        if (SNW.Store) SNW.Store.set({ autoComfortEnabled: targetState });
                        if (SNW.ToastUtil) SNW.ToastUtil.info(targetState ? SNW.I18n.t('comfort.autoOn') : SNW.I18n.t('comfort.autoOff'));
                        this._renderAutoComfortStatus();
                        this._startAutoComfortTick();
                    }
                } catch (e) {
                    chk.checked = !targetState;
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || SNW.I18n.t('common.error'));
                }
            });
        }

        // =========================================================
        // Comfort 5상태 매트릭스 렌더러
        // =========================================================
        _renderAutoComfortStatus() {
            const el = this.el.querySelector('#auto-comfort-status-text');
            if (!el) return;

            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            if (!store.autoComfortEnabled) {
                el.className = 'snw-auto-comfort__status';
                el.textContent = SNW.I18n.t('comfort.autoOff');
                return;
            }

            const ctl = store.control || {};
            const session = store.session || {};
            const isAutoOffLatched = (ctl.stateCode === 5);
            const isSessionActive = (session.state === 'ACTIVE' && session.active);
            const isAutoSession = isSessionActive && session.trigger === 3;
            const isManualSession = isSessionActive && !isAutoSession;

            if (isAutoOffLatched) {
                el.className = 'snw-auto-comfort__status is-suspended';
                el.innerHTML = `${SNW.I18n.t('comfort.statusSuspended')}
                    <button type="button" class="snw-auto-comfort__status-action" data-action="resume-auto">
                        ${SNW.I18n.t('comfort.statusResumeBtn')}
                    </button>`;
                const btn = el.querySelector('[data-action="resume-auto"]');
                if (btn) btn.onclick = () => this._onResumeAutoComfort();
                return;
            }
            if (isAutoSession) {
                el.className = 'snw-auto-comfort__status is-running';
                el.innerHTML = SNW.I18n.t('comfort.statusRunning', {
                    preset: session.presetCode || '', style: session.styleCode || ''
                });
                return;
            }
            if (isManualSession) {
                el.className = 'snw-auto-comfort__status is-user-priority';
                el.innerHTML = SNW.I18n.t('comfort.statusUserPriority');
                return;
            }
            el.className = 'snw-auto-comfort__status is-waiting';
            const remainMs = this._calcRemainMs();
            el.innerHTML = SNW.I18n.t('comfort.statusWaiting', { remain: this._fmtRemainText(remainMs) });
        }

        async _onResumeAutoComfort() {
            try {
                if (SNW.Api && typeof SNW.Api.ackEvent === 'function') {
                    await SNW.Api.ackEvent();
                }
                if (SNW.ToastUtil) SNW.ToastUtil.success(SNW.I18n.t('comfort.autoResumed'));
                this._renderAutoComfortStatus();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || SNW.I18n.t('common.error'));
            }
        }

        _startAutoComfortTick() {
            if (this._autoComfortTickId) clearInterval(this._autoComfortTickId);
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            if (!store.autoComfortEnabled) return;
            this._autoComfortTickId = setInterval(() => {
                if (!this._active) return;
                this._renderAutoComfortStatus();
            }, 5000);
        }

        _calcRemainMs() {
            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const system = store.system || {};
            const serverUptimeMs = system.uptimeMs || 0;
            const lastEvalMs = store.autoComfortLastEvalMs || 0;
            const intervalMs = 5 * 60 * 1000;
            if (serverUptimeMs === 0) return intervalMs;
            return Math.max(0, intervalMs - Math.max(0, serverUptimeMs - lastEvalMs));
        }

        _fmtRemainText(ms) {
            const totalSec = Math.ceil(ms / 1000);
            return `${Math.floor(totalSec / 60)}분 ${totalSec % 60}초`;
        }
    };
})(window.SNW);


/* ---- 210.page.chart.js (12863 bytes) ---- */
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
(function (SNW) {
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
				overlayChk.addEventListener('change', async () => {
					this._showOverlay = overlayChk.checked;
					if (this._showOverlay) {
						await this._ensurePreviewBuffer();
					}
					this._drawOverlay();
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
						t: (e.t != null) ? e.t : Date.now(),
						windSpeed: (e.wind != null) ? e.wind : 0,
						targetWind: (e.targetWind != null) ? e.targetWind : 0,
						pwmDuty: (e.pwm != null) ? e.pwm : 0
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
			this._unsubs.forEach(fn => { try { fn(); } catch { } });
			this._wsUnsubs.forEach(fn => { try { fn(); } catch { } });
			this._timers.forEach(id => clearInterval(id));
			if (this.chart && this.chart.destroy) {
				try { this.chart.destroy(); } catch { }
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
				SNW.Api.getChartHistory().then(async hist => {
					if (hist?.chart?.length) {
						this._buffer = hist.chart.map(e => ({
							t: e.t || Date.now(),
							windSpeed: e.wind || 0,
							targetWind: e.targetWind || 0,
							pwmDuty: e.pwm || 0
						}));
						this._redrawRange();
						if (this._showOverlay) {
							await this._ensurePreviewBuffer();
							this._drawOverlay();
						}
					}
				}).catch(() => { });
			} else {
				// 예상: 현재 프리셋 × 스타일로 생성
				// [Phase5 5.5] ADR-5 이후 generate는 async → IIFE로 fire-and-forget
				const sim = SNW.Store.get().sim || {};
				if (SNW.Preview && typeof SNW.Preview.generate === 'function') {
					(async () => {
						try {
							const preview = await SNW.Preview.generate(
								sim.presetCode || 'OCEAN',
								sim.styleCode || 'BALANCE',
								null
							);
							if (preview && preview.points && this._active) {
								this._buffer = preview.points.map(p => ({
									t: p.t,
									windSpeed: p.wind,
									targetWind: p.avg,
									pwmDuty: 0,
								}));
								this._redrawRange();
							}
						} catch (e) {
							if (SNW.LogUtil) SNW.LogUtil.warn('[Chart] preview fail', e);
						}
					})();
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
						t: (e.t != null) ? e.t : Date.now(),
						windSpeed: (e.wind != null) ? e.wind : 0,
						targetWind: (e.targetWind != null) ? e.targetWind : 0,
						pwmDuty: (e.pwm != null) ? e.pwm : 0,
						gust: (e.gust != null) ? e.gust : 0,
						thermal: (e.thermal != null) ? e.thermal : 0
					});
					return;
				}
				// 2개 이상 = full dump (이력 교체)
				this._buffer = data.chart.map(e => ({
					t: (e.t != null) ? e.t : Date.now(),
					windSpeed: (e.wind != null) ? e.wind : 0,
					targetWind: (e.targetWind != null) ? e.targetWind : 0,
					pwmDuty: (e.pwm != null) ? e.pwm : 0
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
			a.download = `snw_chart_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);

			SNW.ToastUtil.success(SNW.I18n.t('common.success'));
		}

		// ======================================================
		// [Phase5 5.5] 예상 파형 오버레이 (ADR-5 이후 신규)
		//
		//  [설계]
		//   - 차트 캔버스 위에 반투명 캔버스를 절대 위치로 삽입
		//   - 실측 데이터(_buffer)의 min/max 범위에 예상 파형을 매핑
		//   - 점선 + 돌풍 마커로 시각 구분
		//   - _showOverlay=false면 즉시 제거
		// ======================================================
		async _ensurePreviewBuffer() {
			if (this._previewBuffer) return;
			if (!SNW.Preview || typeof SNW.Preview.generate !== 'function') return;

			const sim = SNW.Store.get().sim || {};
			try {
				const wave = await SNW.Preview.generate(
					sim.presetCode || 'OCEAN',
					sim.styleCode || 'BALANCE',
					null
				);
				if (wave && wave.points) this._previewBuffer = wave.points;
			} catch (e) {
				if (SNW.LogUtil) SNW.LogUtil.warn('[Chart] overlay preview fail', e);
			}
		}

		_drawOverlay() {
			// 기존 오버레이 제거
			const existing = this.el.querySelector('.snw-overlay-canvas');
			if (existing) existing.remove();

			// 조건 확인
			if (!this._showOverlay) return;
			if (!this._previewBuffer) return;
			if (this._activeTab !== 'live') return;   // 예상 탭에서는 이미 실측이 예상이므로 오버레이 불필요
			if (!this._buffer || this._buffer.length < 2) return;

			const chartSlot = this.el.querySelector('[data-slot="chart"]');
			if (!chartSlot) return;

			if (getComputedStyle(chartSlot).position === 'static') {
				chartSlot.style.position = 'relative';
			}

			const ovl = document.createElement('canvas');
			ovl.className = 'snw-overlay-canvas';
			ovl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
			chartSlot.appendChild(ovl);

			requestAnimationFrame(() => {
				const rect = chartSlot.getBoundingClientRect();
				if (rect.width < 10 || rect.height < 10) return;
				if (!ovl.isConnected) return;

				ovl.width = Math.floor(rect.width);
				ovl.height = Math.floor(rect.height);

				// 실측 + 예상 통합 min/max
				let mn = Infinity, mx = -Infinity;
				this._buffer.forEach(p => {
					const v = Number(p.windSpeed);
					if (!Number.isFinite(v)) return;
					if (v < mn) mn = v;
					if (v > mx) mx = v;
				});
				this._previewBuffer.forEach(p => {
					const v = Number(p.wind);
					if (!Number.isFinite(v)) return;
					if (v < mn) mn = v;
					if (v > mx) mx = v;
				});
				if (!Number.isFinite(mn) || !Number.isFinite(mx) || mx <= mn) return;

				const ctx = ovl.getContext('2d');
				const pad = 6;
				const innerH = ovl.height - pad * 2;
				const n = this._previewBuffer.length;
				if (n < 2) return;

				// 점선 오버레이
				ctx.strokeStyle = 'rgba(240,136,62,0.75)';
				ctx.lineWidth = 1.5;
				ctx.setLineDash([5, 4]);
				ctx.beginPath();
				for (let i = 0; i < n; i++) {
					const x = (i / (n - 1)) * ovl.width;
					const y = pad + ((mx - this._previewBuffer[i].wind) / (mx - mn)) * innerH;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.stroke();
				ctx.setLineDash([]);
			});
		}
	};

})(window.SNW);

/* ---- 225.page.sensors.js (4538 bytes) ---- */
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
            
            // [Stage 5] 모션 설정은 /automation/rules로 이관
            //  - PIR 테스트 피드만 이 화면에 유지

            // [m2 수정] 이관 안내 표시
            const formSlot = this.el.querySelector('[data-slot="motion-config"]');
            if (formSlot) {
                formSlot.innerHTML = `
                    <div class="snw-empty" style="font-size:12px;color:var(--snw-text-dim,#8b949e);padding:12px;line-height:1.8;">
                        ⚙ PIR <b>유지시간(holdSec)</b> 및 세션 규칙은
                        <a href="#/automation/rules" style="color:var(--snw-primary,#4a9eff);text-decoration:underline;">자동화 → 규칙</a>
                        에서 설정합니다.<br>
                        🔧 PIR <b>핀/디바운스</b>는
                        <a href="#/settings/hardware" style="color:var(--snw-primary,#4a9eff);text-decoration:underline;">설정 → 하드웨어</a>
                        에서 설정합니다.
                    </div>`;
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
            

        }
        
        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
        }
    };
})(window.SNW);


/* ---- 240.page.settings.js (41368 bytes) ---- */
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
                
                // [BUGFIX] API 응답은 루트 flat 구조 {meta, system:{logging,webSocket}, hw, security, timeCfg}
                //  - 이전: data.system 이 ST_A20_SystemConfig_t 전체라고 오판 → 모든 하위 필드가 defaults로 fallback
                //  - 이후: 루트(data)에서 직접 추출 (오프라인 mock / C++ toJson_System 모두 동일 shape)
                const sys = data || {};
                const hw = sys.hw || {};
                const logCfg = (sys.system && sys.system.logging) || {};
                const ws = (sys.system && sys.system.webSocket) || {};
                const sec = sys.security || {};
                const meta = sys.meta || {};

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
                    <h3 class="snw-form-section">${T('settings.secUiMode')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.uiLevel')}</label>
                        <select id="ui-level" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:6px;">
                            <option value="L1" ${SNW.LevelUtil.current() === 'L1' ? 'selected' : ''}>${T('settings.levelL1')}</option>
                            <option value="L2" ${SNW.LevelUtil.current() === 'L2' ? 'selected' : ''}>${T('settings.levelL2')}</option>
                            <option value="L3" ${SNW.LevelUtil.current() === 'L3' ? 'selected' : ''}>${T('settings.levelL3')}</option>
                            <option value="L4" ${SNW.LevelUtil.current() === 'L4' ? 'selected' : ''}>${T('settings.levelL4')}</option>
                        </select>
                        <small class="snw-form-row__hint" style="display:block;margin-top:4px;color:var(--snw-text-dim);font-size:12px;">${T('settings.uiLevelHint')}</small>
                    </div>

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

                    <!-- [Stage 5 + m1 수정] 시스템 정보 (기존 300.page.info.js 완전 흡수) -->
                    <h3 class="snw-form-section" style="margin-top:16px;">시스템 정보</h3>

                    <h4 style="font-size:12px;color:var(--snw-text-dim,#8b949e);margin:8px 0 4px;">Version</h4>
                    <div class="snw-kv"><span>Firmware</span><b data-slot="sys-fw">-</b></div>
                    <div class="snw-kv"><span>Control</span><b data-slot="sys-ctl">-</b></div>
                    <div class="snw-kv"><span>Config</span><b data-slot="sys-cfg">-</b></div>
                    <div class="snw-kv"><span>API</span><b data-slot="sys-api">-</b></div>
                    <div class="snw-kv"><span>Simul</span><b data-slot="sys-sim">-</b></div>

                    <h4 style="font-size:12px;color:var(--snw-text-dim,#8b949e);margin:8px 0 4px;">Device</h4>
                    <div class="snw-kv"><span>Hostname</span><b data-slot="sys-host">-</b></div>
                    <div class="snw-kv"><span>MAC</span><b data-slot="sys-mac">-</b></div>
                    <div class="snw-kv"><span>IP</span><b data-slot="sys-ip">-</b></div>
                    <div class="snw-kv"><span>Uptime</span><b data-slot="sys-uptime">-</b></div>

                    <h4 style="font-size:12px;color:var(--snw-text-dim,#8b949e);margin:8px 0 4px;">Storage</h4>
                    <div class="snw-kv"><span>Heap Free</span><b data-slot="sys-heap">-</b></div>
                    <div class="snw-kv"><span>FS Used</span><b data-slot="sys-fs-used">-</b></div>
                    <div class="snw-kv"><span>FS Total</span><b data-slot="sys-fs-total">-</b></div>

                    <div style="margin-top:12px;">
                        <button type="button" class="snw-btn snw-btn--sm" data-action="replay-onboarding">🌿 시작 가이드 다시 보기</button>
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

                // [Stage 5 + m1 수정] 시스템 정보 로드 (완전 흡수)
                try {
                    const [v, d, wifi] = await Promise.all([
                        SNW.Api.version ? SNW.Api.version().catch(() => null) : null,
                        SNW.Api.diag ? SNW.Api.diag().catch(() => null) : null,
                        SNW.Api.getWifiState ? SNW.Api.getWifiState().catch(() => null) : null,
                    ]);
                    const state = (wifi && wifi.wifi && wifi.wifi.state) || {};
                    const sys = SNW.Store.get().system || {};
                    const uptimeSec = sys.uptimeMs ? Math.floor(sys.uptimeMs / 1000) : 0;
                    const uptimeStr = uptimeSec > 3600
                        ? `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`
                        : `${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`;

                    const setKV = (slot, val) => {
                        const el = this.el.querySelector(`[data-slot="${slot}"]`);
                        if (el) el.textContent = val;
                    };

                    // Version 5종
                    setKV('sys-fw',  (v && v.fw)      || '-');
                    setKV('sys-ctl', (v && v.control) || '-');
                    setKV('sys-cfg', (v && v.config)  || '-');
                    setKV('sys-api', (v && v.api)     || '-');
                    setKV('sys-sim', (v && v.simul)   || '-');

                    // Device 4종
                    setKV('sys-host', state.hostname || '-');
                    setKV('sys-mac',  state.mac      || '-');
                    setKV('sys-ip',   state.ip       || '-');
                    setKV('sys-uptime', uptimeStr);

                    // Storage 3종
                    setKV('sys-heap', d && d.heap != null ? d.heap + ' B' : '-');
                    setKV('sys-fs-used',  d && d.fs_used  != null ? d.fs_used + ' B'  : '-');
                    setKV('sys-fs-total', d && d.fs_total != null ? d.fs_total + ' B' : '-');
                } catch (e) {}

                // 온보딩 재실행
                const btnReplay = this.el.querySelector('[data-action="replay-onboarding"]');
                if (btnReplay) {
                    btnReplay.onclick = () => {
                        localStorage.removeItem('snw.onboarded');
                        if (SNW.Onboarding && typeof SNW.Onboarding.start === 'function') {
                            SNW.Onboarding.start();
                        }
                    };
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

            // [Stage 10] 인터페이스 모드 저장 (FE 로컬스토리지)
            const uiLevelEl = q('#ui-level');
            if (uiLevelEl && uiLevelEl.value !== SNW.LevelUtil.current()) {
                try {
                    localStorage.setItem((SNW.CFG && SNW.CFG.LS_KEY && SNW.CFG.LS_KEY.LEVEL) || 'snw.level', uiLevelEl.value);
                    SNW.ToastUtil.info(SNW.I18n.t('settings.uiLevelSaved'));
                    setTimeout(() => location.reload(), 2500);
                } catch (e) {
                    SNW.LogUtil.warn('[Settings] UI level save failed', e);
                }
            }

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


/* ---- 245.page.simulation.js (12340 bytes) ---- */
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

                    // [Phase5 5.3] async 메서드 호출 (fire-and-forget)
                    this._updatePreview();
                    this._renderAdvanced();
                } catch (e) { SNW.LogUtil.warn('[Sim] load 실패', e); }
            }

        // ======================================================
        // [Phase5 5.3] async 전환 (ADR-5: generate 반환 Promise)
        //  - 기존: sync 호출 → preview가 Promise → preview.points undefined
        //  - 이후: await → 실제 파형 데이터 사용
        // ======================================================
        async _updatePreview() {
            const pc = this.el.querySelector('#sim-presets .is-selected')?.dataset.code || 'OCEAN';
            const sc = this.el.querySelector('#sim-styles .is-active')?.dataset.style || 'BALANCE';

            if (!SNW.Preview || typeof SNW.Preview.generate !== 'function') return;

            let pv = null;
            try {
                pv = await SNW.Preview.generate(pc, sc, null);
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Sim] preview fail', e);
                return;
            }
            if (!pv) return;

            const cv = this.el.querySelector('[data-pv-canvas]');
            if (cv && typeof SNW.Preview._animate === 'function') {
                SNW.Preview._animate(cv, pv.points);
            }

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

        // ======================================================
        // [Phase5 5.3] motion 소스 수정
        //  - 이전: data?.motion?.motion (data=windDict → 항상 undefined)
        //  - 이후: SNW.Api.getMotion() 비동기 fetch
        // ======================================================
        async _renderAdvanced() {
            const slot = this.el.querySelector('[data-slot="advanced"]');
            if (!slot) return;

            let motion = {};
            try {
                const data = await SNW.Api.getMotion();
                motion = (data && data.motion) || {};
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Sim] motion fetch fail', e);
            }

            const t = motion.timing || {};
            const s = motion.sim || {};
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


/* ---- 250.page.diagnostics.js (6519 bytes) ---- */
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
                    <div class="snw-kv"><span>state</span><b>${ctl.state || '-'} (${ctl.stateCode ?? '-'})</b></div>
                    <div class="snw-kv"><span>reason</span><b>${ctl.reason || '-'} (${ctl.reasonCode ?? '-'})</b></div>
                    <div class="snw-kv"><span>pauseReason</span><b>${ctl.pauseReason ?? '-'}</b></div>
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


/* ---- 260.page.monitor.js (19858 bytes) ---- */
// =========================================================
// 260.page.monitor.js — SNW.Page.Monitor (Stage 7 히스토리 + 실시간 EQ)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Monitor = class Monitor {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._currentTab = 'live';
            this._unsubs = [];
            this._liveEq = null;
            this._retroRange = '24h';
        }

        async mount() {
            this.el.innerHTML = '';
            this._render();
            this._bindStore();
            await this._loadLiveData();

            // 탭 초기화
            this._switchTab(this._currentTab);
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
            if (this._liveEq && typeof this._liveEq.stop === 'function') {
                this._liveEq.stop();
            }
        }

        _render() {
            this.el.innerHTML = `
                <div class="snw-monitor">
                    <div class="snw-tabs">
                        <button type="button" class="snw-tab-btn is-active" data-tab="live">📊 실시간</button>
                        <button type="button" class="snw-tab-btn" data-tab="retro">🎬 히스토리</button>
                    </div>
                    <div data-tab-content="live"></div>
                    <div data-tab-content="retro" style="display:none;"></div>
                </div>`;

            this.el.querySelectorAll('[data-tab]').forEach(btn => {
                btn.onclick = () => this._switchTab(btn.getAttribute('data-tab'));
            });
        }

        _switchTab(tab) {
            this._currentTab = tab;
            this.el.querySelectorAll('[data-tab]').forEach(b =>
                b.classList.toggle('is-active', b.getAttribute('data-tab') === tab));
            this.el.querySelectorAll('[data-tab-content]').forEach(c => {
                c.style.display = (c.getAttribute('data-tab-content') === tab) ? 'block' : 'none';
            });

            if (tab === 'live')  this._renderLive();
            if (tab === 'retro') this._renderRetro();
        }

        // =========================================================
        // 라이브 탭
        // =========================================================
        _renderLive() {
            const slot = this.el.querySelector('[data-tab-content="live"]');
            if (!slot) return;
            slot.innerHTML = `
                <div class="snw-card">
                    <h2>📊 실시간 풍속</h2>
                    <div data-slot="live-eq" class="snw-monitor__eq" style="height:100px;"></div>
                    <div class="snw-monitor__live-info" data-slot="live-info"></div>
                </div>
                <div class="snw-card">
                    <h2>🌡️ 센서</h2>
                    <div class="snw-monitor__sensors" data-slot="live-sensors"></div>
                </div>`;

            if (this._liveEq && typeof this._liveEq.stop === 'function') {
                this._liveEq.stop();
                this._liveEq = null;
            }
            const eqSlot = slot.querySelector('[data-slot="live-eq"]');
            if (eqSlot && SNW.UI && typeof SNW.UI.equalizer === 'function') {
                this._liveEq = SNW.UI.equalizer(eqSlot, { bars: 40, fps: 30, maxWind: 11 });
                this._liveEq.start();
            }
            this._onLiveUpdate();
        }

        _onLiveUpdate() {
            const storeData = (SNW.Store && typeof SNW.Store.get === 'function') ? SNW.Store.get() : {};
            const ctl = storeData.control;
            const sim = storeData.sim;
            const session = storeData.session;

            if (this._liveEq && sim) {
                this._liveEq.push(sim.windSpeed || 0);
            }

            const infoEl = this.el.querySelector('[data-slot="live-info"]');
            const typeName = session ? (session.typeName || (['NONE','PLAYLIST','PRESET','FIXED'][Number(session.type)] || String(session.type || 'NONE'))) : 'NONE';
            const isActive = Boolean(session && typeName !== 'NONE' && session.active !== false && session.state !== 'COMPLETED');

            if (infoEl && isActive) {
                let title = '';
                if (typeName === 'PLAYLIST') title = session.profileName || session.name || `프로필 #${session.profileNo || session.profileId || ''}`;
                else if (typeName === 'PRESET') title = `${session.presetCode || ''} · ${session.styleCode || ''}`;
                else {
                    const spd = (session.percent != null) ? session.percent : (session.fixedSpeed != null ? session.fixedSpeed : (session.speed || 0));
                    title = `일반 선풍기 ${Math.round(spd)}%`;
                }

                const isManual = (session.trigger === 1 || session.trigger === 'MANUAL' || session.triggerName === 'MANUAL');
                infoEl.innerHTML = `
                    <div class="snw-monitor__live-row">
                        <span>${isManual ? '✋' : '⏰'} ${SNW.DomUtil.escape(title)}</span>
                    </div>
                    ${typeName === 'PLAYLIST' ? `
                        <div class="snw-monitor__live-row">
                            <span>Step ${session.currentStep || session.stepNo || 1}/${session.totalSteps || 1}</span>
                            <span>${this._fmtTime(session.stepRemainSec || session.remainSec || 0)}</span>
                        </div>` : ''}
                `;
            } else if (infoEl) {
                infoEl.innerHTML = '<div class="snw-empty">세션 없음</div>';
            }

            const sensorsEl = this.el.querySelector('[data-slot="live-sensors"]');
            if (sensorsEl && ctl && ctl.sensor) {
                const s = ctl.sensor;
                sensorsEl.innerHTML = `
                    <div class="snw-sensor-row">
                        <span>🌡️ 온도</span><b>${(s.tempC || 0).toFixed(1)}°C</b>
                    </div>
                    <div class="snw-sensor-row">
                        <span>💧 습도</span><b>${Math.round(s.humidity || 0)}%</b>
                    </div>
                    <div class="snw-sensor-row">
                        <span>👤 재실</span><b>${s.motionActive ? '감지' : '부재'}</b>
                    </div>
                `;
            }
        }

        // =========================================================
        // 히스토리 탭 (기존 회고)
        // =========================================================
        async _renderRetro() {
            const slot = this.el.querySelector('[data-tab-content="retro"]');
            if (!slot) return;
            
            slot.innerHTML = `
                <div class="snw-card">
                    <h2>🎬 세션 히스토리</h2>
                    <div class="snw-toolbar" style="margin-bottom:12px;">
                        <select data-slot="retro-range">
                            <option value="1h">최근 1시간</option>
                            <option value="24h" selected>최근 24시간</option>
                            <option value="7d">최근 7일</option>
                        </select>
                        <button type="button" class="snw-btn" data-action="refresh">🔄</button>
                    </div>
                    <div data-slot="retro-content"></div>
                </div>`;
            
            const refreshBtn = slot.querySelector('[data-action="refresh"]');
            if (refreshBtn) refreshBtn.onclick = () => this._loadRetro();
            const rangeSelect = slot.querySelector('[data-slot="retro-range"]');
            if (rangeSelect) rangeSelect.onchange = () => this._loadRetro();
            
            await this._loadRetro();
        }
        
        async _loadRetro() {
            const slot = this.el.querySelector('[data-slot="retro-content"]');
            if (!slot) return;

            const rangeEl = this.el.querySelector('[data-slot="retro-range"]');
            const range = rangeEl ? rangeEl.value : '24h';

            const now = Math.floor(Date.now() / 1000);
            const durMap = { '1h': 3600, '24h': 86400, '7d': 604800 };
            const since = now - (durMap[range] || 86400);

            slot.innerHTML = '<div class="snw-loading" style="min-height:150px;">로딩 중...</div>';
            
            try {
                const getTlFn = (SNW.Api && (SNW.Api.getTimeline || SNW.Api.getMonitorTimeline)) ?
                    (SNW.Api.getTimeline || SNW.Api.getMonitorTimeline).bind(SNW.Api) : () => Promise.resolve({ events: [] });
                const getSumFn = (SNW.Api && SNW.Api.getSessionSummary) ?
                    SNW.Api.getSessionSummary.bind(SNW.Api) : () => Promise.resolve(null);

                const [timeline, summary] = await Promise.all([
                    getTlFn(since).catch(() => ({ events: [] })),
                    getSumFn(since, now).catch(() => null),
                ]);

                if (!this._active) return;

                slot.innerHTML = '';
                slot.appendChild(this._renderSummary(summary));
                slot.appendChild(this._renderTimeline(timeline, range));
                slot.appendChild(this._renderEventList(timeline, range));
            } catch (e) {
                slot.innerHTML = '<div class="snw-error">히스토리 데이터 로드 실패</div>';
            }
        }

        // ======================================================
        // 요약 카드
        // ======================================================
        _renderSummary(summary) {
            const div = document.createElement('div');
            div.className = 'snw-retro-summary';

            if (!summary) {
                div.innerHTML = '<div class="snw-empty">세션 데이터 없음</div>';
                return div;
            }

            let stats = summary.stats || null;

            if (!stats) {
                const starts = Number(summary.sessionStarts || 0);
                const total  = Number(summary.totalEvents   || 0);

                if (total === 0 && starts === 0) {
                    div.innerHTML = '<div class="snw-empty">세션 데이터 없음</div>';
                    return div;
                }

                stats = {
                    totalSessions:  starts,
                    totalActiveSec: 0,
                    avgWindSpeed:   0,
                    maxWindSpeed:   0,
                    avgTempC:       0,
                    presenceRatio:  0,
                    _legacy:        true,
                };
            }

            div.innerHTML = `
                <div class="snw-retro-summary__title">세션 요약</div>
                <div class="snw-retro-summary__grid">
                    <div><span>총 세션</span><b>${stats.totalSessions || 0}회</b></div>
                    <div><span>총 가동</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : this._fmtDuration(stats.totalActiveSec || 0)
                    }</b></div>
                    <div><span>평균 풍속</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.avgWindSpeed || 0).toFixed(1) + ' m/s'
                    }</b></div>
                    <div><span>최고 풍속</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.maxWindSpeed || 0).toFixed(1) + ' m/s'
                    }</b></div>
                    <div><span>평균 온도</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.avgTempC || 0).toFixed(1) + '°C'
                    }</b></div>
                    <div><span>재실 비율</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : Math.round((stats.presenceRatio || 0) * 100) + '%'
                    }</b></div>
                </div>
                ${stats._legacy
                    ? `<div style="font-size:11px;color:var(--snw-text-dim);margin-top:8px;">
                        ※ 상세 통계는 서버 업데이트 후 제공됩니다.
                    </div>`
                    : ''}
            `;
            return div;
        }

        // ======================================================
        // 타임라인: 마커 겹침 방지 (엇갈림 배치) 적용
        // ======================================================
        _renderTimeline(timeline, range = '24h') {
            const div = document.createElement('div');
            div.className = 'snw-retro-timeline';

            if (!timeline || !timeline.events || timeline.events.length === 0) {
                div.innerHTML = '<div class="snw-empty">이벤트 없음</div>';
                return div;
            }

            const events = timeline.events;
            const fromTs = (timeline.from != null) ? timeline.from : (events[0]?.t ?? 0);
            const toTs   = (timeline.to != null) ? timeline.to : (events[events.length - 1]?.t ?? Math.floor(Date.now() / 1000));

            const normalized = { ...timeline, from: fromTs, to: toTs, events };
            const fromLabel = this._fmtAxisTime(fromTs, range);
            const toLabel   = this._fmtAxisTime(toTs, range);

            let lastPos = -10;
            let lane = 0;

            const markersHtml = events.map(e => {
                const rawPos = ((e.t - fromTs) / Math.max(1, toTs - fromTs)) * 100;
                const pos = Math.min(98, Math.max(2, rawPos));
                
                // 이전 마커와 5% 이내로 가까우면 위/아래 위치 교차
                if (pos - lastPos < 5) {
                    lane = lane === 0 ? 1 : 0;
                } else {
                    lane = 0;
                }
                lastPos = pos;

                return this._eventMarker(e, normalized, range, pos, lane);
            }).join('');

            div.innerHTML = `
                <div class="snw-retro-timeline__title">이벤트 타임라인</div>
                <div class="snw-retro-timeline__container">
                    <div class="snw-retro-timeline__bar">
                        ${markersHtml}
                    </div>
                    <div class="snw-retro-timeline__axis">
                        <span>${fromLabel}</span>
                        <span>${toLabel}</span>
                    </div>
                </div>
            `;
            return div;
        }

        _eventMarker(e, timeline, range = '24h', pos = 0, lane = 0) {
            const icon = {
                0: '⚪', 1: '➡️', 2: '▶', 3: '⏹',
                4: '✋', 5: '🌙', 6: '⏸', 7: '▶',
            }[e.eventType] || '•';

            const color = {
                0: '#59636e', 1: '#4a9eff', 2: '#3fb950', 3: '#8b949e',
                4: '#d29922', 5: '#f0883e', 6: '#d29922', 7: '#3fb950',
            }[e.eventType] || '#59636e';

            const timeLabel = this._fmtAxisTime(e.t, range);
            const laneClass = lane === 1 ? 'snw-retro-marker--bottom' : '';

            return `
                <div class="snw-retro-marker ${laneClass}" style="left:${pos}%;background:${color};" title="${timeLabel} · ${SNW.DomUtil.escape(e.label || '')}">
                    <span>${icon}</span>
                </div>
            `;
        }

        _renderEventList(timeline, range = '24h') {
            const div = document.createElement('div');
            div.className = 'snw-retro-events';

            if (!timeline || !timeline.events || timeline.events.length === 0) {
                return div;
            }

            const events = timeline.events.slice(-30).reverse();
            div.innerHTML = `
                <div class="snw-retro-events__title">이벤트 목록 (최근 30개)</div>
                ${events.map(e => `
                    <div class="snw-retro-event-row">
                        <span class="snw-retro-event-row__time">${this._fmtAxisTime(e.t, range)}</span>
                        <span class="snw-retro-event-row__icon">${
                            2 === e.eventType ? '▶' :
                            3 === e.eventType ? '⏹' :
                            1 === e.eventType ? '➡️' :
                            4 === e.eventType ? '✋' :
                            5 === e.eventType ? '🌙' :
                            6 === e.eventType ? '⏸' :
                            7 === e.eventType ? '▶' : '•'
                        }</span>
                        <span class="snw-retro-event-row__label">${SNW.DomUtil.escape(e.label || '')}</span>
                    </div>
                `).join('')}
            `;
            return div;
        }

        // =========================================================
        // 유틸리티
        // =========================================================
        _bindStore() {
            if (SNW.Store && typeof SNW.Store.subscribe === 'function') {
                this._unsubs.push(
                    SNW.Store.subscribe(() => {
                        if (this._active && this._currentTab === 'live') {
                            this._onLiveUpdate();
                        }
                    })
                );
            }
        }

        _fmtTime(sec) {
            if (!sec || sec < 0) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${String(s).padStart(2, '0')}`;
        }

        _fmtDuration(sec) {
            if (!sec) return '0분';
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }

        _fmtAxisTime(epoch, range) {
            if (!epoch || epoch <= 0) return '--:--';
            const d = new Date(epoch * 1000);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');

            if (range === '7d') {
                return `${mm}/${dd} ${hh}:${min}`;
            }
            return `${hh}:${min}`;
        }

        async _loadLiveData() {
            try {
                if (SNW.Api && typeof SNW.Api.getState === 'function') {
                    const st = await SNW.Api.getState();
                    if (st && SNW.Store && typeof SNW.Store.set === 'function') {
                        SNW.Store.set({
                            control: st.control,
                            sim: st.sim,
                            session: st.control?.session,
                        });
                    }
                }
            } catch (e) {
                if (SNW.LogUtil && typeof SNW.LogUtil.warn === 'function') {
                    SNW.LogUtil.warn('monitor load failed', e);
                }
            }
        }
    };
})(window.SNW);


/* ---- 270.page.network.js (20507 bytes) ---- */
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

                // [Stage 5] WebSocket 통신 설정 흡수
                try {
                    const wsConf = data?.system?.webSocket || {};
                    const wsChArr = wsConf.wsChConfig || [
                        { chIdx: 0, chName: 'state',   chIntervalMs: 800,  priority: 0 },
                        { chIdx: 1, chName: 'metrics', chIntervalMs: 1500, priority: 1 },
                        { chIdx: 2, chName: 'chart',   chIntervalMs: 1200, priority: 2 },
                        { chIdx: 3, chName: 'summary', chIntervalMs: 1500, priority: 3 },
                    ];
                    const wsEtc = wsConf.wsEtcConfig || {};

                    slot.innerHTML += `
                        <details style="margin-top:16px;border:1px dashed var(--snw-border,#2f3844);border-radius:6px;padding:12px;">
                            <summary style="cursor:pointer;font-weight:600;font-size:13px;">
                                ⚙ 고급 WebSocket 통신 설정
                            </summary>
                            <div style="margin-top:12px;">
                                ${wsChArr.map((ch, i) => `
                                    <div style="display:grid;grid-template-columns:80px 1fr 1fr;gap:8px;margin-bottom:6px;font-size:12px;">
                                        <span style="color:var(--snw-text-dim,#8b949e);">${ch.chName || 'ch' + i}</span>
                                        <input type="number" data-ws-itv="${i}" value="${ch.chIntervalMs}" placeholder="interval(ms)"
                                               style="padding:4px 8px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);color:var(--snw-text,#e6edf3);border-radius:4px;">
                                        <input type="number" data-ws-prio="${i}" value="${ch.priority}" placeholder="priority"
                                               style="padding:4px 8px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);color:var(--snw-text,#e6edf3);border-radius:4px;">
                                    </div>
                                `).join('')}
                                <div class="snw-form-row" style="margin-top:8px;">
                                    <label>Chart Large Bytes</label>
                                    <input type="number" data-ws-chartlarge value="${wsEtc.chartLargeBytes || 3500}"
                                           style="padding:4px 8px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);color:var(--snw-text,#e6edf3);border-radius:4px;">
                                </div>
                                <button type="button" class="snw-btn snw-btn--sm" data-action="save-ws" style="margin-top:8px;">WebSocket 설정 저장</button>
                            </div>
                        </details>
                    `;

                    // 저장 버튼
                    const btnSaveWs = slot.querySelector('[data-action="save-ws"]');
                    if (btnSaveWs) {
                        btnSaveWs.onclick = async () => {
                            const newChArr = wsChArr.map((ch, i) => ({
                                chIdx: ch.chIdx,
                                chName: ch.chName,
                                chIntervalMs: Number(slot.querySelector(`[data-ws-itv="${i}"]`).value),
                                priority: Number(slot.querySelector(`[data-ws-prio="${i}"]`).value),
                            }));
                            const newEtc = {
                                ...wsEtc,
                                chartLargeBytes: Number(slot.querySelector('[data-ws-chartlarge]').value),
                            };
                            try {
                                await SNW.Api.patchSystem({ system: { webSocket: { wsChConfig: newChArr, wsEtcConfig: newEtc } } });
                                await SNW.Api.saveConfig();
                                if (SNW.ToastUtil) SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                            } catch (e) {
                                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
                            }
                        };
                    }
                } catch (e) {}
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

/* ---- 290.page.ai.js (16877 bytes) ---- */
// =========================================================
// 290.page.ai.js — SNW.Page.AI
// Layer 4 (페이지 로직: AI 스튜디오, 2-turn REST 제어 & Gemini Live Voice)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
	'use strict';

	const MAX_MSG_LEN = 4000;

	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = [];
			this._isListening = false;
			this._currentMode = 'rest'; // 'rest' | 'live'
			this._liveCostStatus = null;
		}

		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);

			const slot = this.el.querySelector('[data-slot="chat"]');
			const examplePlaceholder = SNW.I18n.t('ai.placeholder');

			slot.innerHTML = `
                <div class="snw-ai-chat">
                    <div class="snw-ai-header">
                        <div style="display:flex;gap:6px;align-items:center;">
                            <div class="snw-btn-group" role="group">
                                <button type="button" class="snw-btn snw-btn--sm snw-btn--primary" data-mode-btn="rest">
                                    ${SNW.I18n.t('ai.modeRest')}
                                </button>
                                <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-mode-btn="live">
                                    ${SNW.I18n.t('ai.modeLive')}
                                </button>
                            </div>
                            <span class="snw-badge snw-badge--info" data-slot="cost-badge" style="display:none;font-size:0.75rem;"></span>
                        </div>
                        <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-action="clear-history">
                            ${SNW.I18n.t('ai.clearHistory')}
                        </button>
                    </div>

                    <!-- REST Chat View -->
                    <div class="snw-ai-rest-view" data-view="rest">
                        <div class="snw-ai-messages" data-slot="messages"></div>
                        <div class="snw-ai-examples">
						    <button type="button" class="snw-btn snw-btn--sm" data-example="바다 바람 틀어줘">🌊 바다 바람</button>
						    <button type="button" class="snw-btn snw-btn--sm" data-example="30분 후 꺼줘">⏱ 30분 후 끄기</button>
						    <button type="button" class="snw-btn snw-btn--sm" data-example="스케줄대로 해줘">📅 스케줄 복귀</button>
						    <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example1')}">🌤 날씨 추천</button>
						</div>
                        <div class="snw-ai-input">
                        	<textarea data-slot="input" rows="1" style="flex:1; resize:none; max-height:120px; overflow-y:auto;"
							          placeholder="${SNW.DomUtil.escape(examplePlaceholder)}"
							          maxlength="${MAX_MSG_LEN}"></textarea>
                            <button type="button" class="snw-btn snw-btn--secondary" data-action="voice" title="음성 입력">
                                🎤
                            </button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="send">
                                ${SNW.I18n.t('ai.send')}
                            </button>
                        </div>
                    </div>

                    <!-- Live Voice View -->
                    <div class="snw-ai-live-view" data-view="live">
                        <div class="snw-live-orb-container">
                            <div class="snw-live-orb" data-slot="live-orb"></div>
                        </div>
                        <div class="snw-live-status-text" data-slot="live-status">
                            ${SNW.I18n.t('ai.liveStart')}
                        </div>
                        <div class="snw-live-transcript" data-slot="live-transcript"></div>
                        <div class="snw-live-actions-log" data-slot="live-actions"></div>
                        <div>
                            <button type="button" class="snw-btn snw-btn--lg snw-btn-primary" data-action="live-toggle" style="min-width:160px;">
                                ${SNW.I18n.t('ai.liveStart')}
                            </button>
                        </div>
                    </div>
                </div>`;

			// 이전 대화 이력 로드
			if (SNW.AIClient) {
				this._history = SNW.AIClient.loadHistory();
				this._renderHistory();
			}

			// 모드 전환 버튼 바인딩
			SNW.DomUtil.delegate(this.el, '[data-mode-btn]', 'click', (e, btn) => {
				const mode = btn.getAttribute('data-mode-btn');
				this._switchMode(mode);
			});

			// 이벤트 위임
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
			SNW.DomUtil.delegate(this.el, '[data-action="voice"]', 'click', () => this._onVoiceToggle());
			SNW.DomUtil.delegate(this.el, '[data-action="clear-history"]', 'click', () => this._onClearHistory());
			SNW.DomUtil.delegate(this.el, '[data-action="live-toggle"]', 'click', () => this._onLiveToggle());

			// 예시 버튼 클릭
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
				
				// [NEW] 입력 내용에 따른 높이 자동 확장
				inp.addEventListener('input', () => {
					inp.style.height = 'auto';
					inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
				});
			}

			// 초기 비용 상태 로드
			this._loadCostStatus();

			SNW.LogUtil.info('[AI] mount 완료');
		}

		unmount() {
			this._active = false;
			if (SNW.AIVoice) {
				SNW.AIVoice.stopListening();
				SNW.AIVoice.stopSpeaking();
			}
			if (SNW.AiLive && SNW.AiLive.isConnected()) {
				SNW.AiLive.stopSession();
			}
		}

		async _loadCostStatus() {
			try {
				if (SNW.Api && SNW.Api.getAiCostStatus) {
					const now = new Date();
					const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
					const res = await SNW.Api.getAiCostStatus(today);
					this._updateCostBadge(res);
				}
			} catch (e) {
				console.warn('[AI] Failed to load cost status:', e);
			}
		}

		_updateCostBadge(costData) {
			if (!costData) return;
			this._liveCostStatus = costData;
			const badge = this.el.querySelector('[data-slot="cost-badge"]');
			if (!badge) return;

			const usedMin = Math.round((costData.audioSec || 0) / 60);
			const capMin = Math.round((costData.capSec || 1800) / 60);
			const cost = ((costData.estCostUsdX1000 || 0) / 1000).toFixed(3);

			badge.style.display = 'inline-block';
			badge.textContent = SNW.I18n.t('ai.liveCost', { min: usedMin, cap: capMin, cost });

			badge.classList.remove('snw-badge--info', 'snw-badge--warn', 'snw-badge--danger');
			if (costData.level === 'cap') {
				badge.classList.add('snw-badge--danger');
			} else if (costData.level === 'warn') {
				badge.classList.add('snw-badge--warn');
			} else {
				badge.classList.add('snw-badge--info');
			}
		}

		_switchMode(mode) {
			if (this._currentMode === mode) return;

			// Live 실행 중 다른 모드로 전환 시 Live 중단
			if (this._currentMode === 'live' && SNW.AiLive && SNW.AiLive.isConnected()) {
				SNW.AiLive.stopSession();
			}

			this._currentMode = mode;

			const restBtn = this.el.querySelector('[data-mode-btn="rest"]');
			const liveBtn = this.el.querySelector('[data-mode-btn="live"]');
			const restView = this.el.querySelector('[data-view="rest"]');
			const liveView = this.el.querySelector('[data-view="live"]');

			if (mode === 'live') {
				if (restBtn) restBtn.className = 'snw-btn snw-btn--sm snw-btn--ghost';
				if (liveBtn) liveBtn.className = 'snw-btn snw-btn--sm snw-btn--primary';
				if (restView) restView.style.display = 'none';
				if (liveView) liveView.style.display = 'block';
			} else {
				if (restBtn) restBtn.className = 'snw-btn snw-btn--sm snw-btn--primary';
				if (liveBtn) liveBtn.className = 'snw-btn snw-btn--sm snw-btn--ghost';
				if (restView) restView.style.display = 'block';
				if (liveView) liveView.style.display = 'none';
			}
		}

		async _onLiveToggle() {
			if (!SNW.AiLive || !SNW.AiLive.isSupported()) {
				if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('ai.voiceNotSupported'));
				return;
			}

			const liveBtn = this.el.querySelector('[data-action="live-toggle"]');
			const orb = this.el.querySelector('[data-slot="live-orb"]');
			const statusText = this.el.querySelector('[data-slot="live-status"]');
			const transcriptBox = this.el.querySelector('[data-slot="live-transcript"]');
			const actionsLog = this.el.querySelector('[data-slot="live-actions"]');

			if (SNW.AiLive.isConnected() || SNW.AiLive.isConnecting()) {
				SNW.AiLive.stopSession();
				if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
				if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
				if (orb) {
					orb.style.transform = 'scale(1)';
					orb.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)';
				}
				return;
			}

			// 상한 사전 검사
			if (this._liveCostStatus && this._liveCostStatus.level === 'cap') {
				if (SNW.ToastUtil) SNW.ToastUtil.error(SNW.I18n.t('ai.dailyCapReached'));
				this._switchMode('rest');
				return;
			}

			if (statusText) statusText.textContent = SNW.I18n.t('ai.liveConnecting');
			if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStop');

			try {
				await SNW.AiLive.startSession({
					onStateChange: (state) => {
						if (!this._active) return;
						if (state === 'connected' || state === 'listening') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveConnected');
							if (orb) orb.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
						} else if (state === 'speaking') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveSpeaking');
							if (orb) orb.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
						} else if (state === 'executing') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.actionDone');
						} else if (state === 'idle' || state === 'closed') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
							if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
							if (orb) {
								orb.style.transform = 'scale(1)';
								orb.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
								orb.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)';
							}
						}
					},
					onText: (text, isComplete) => {
						if (!transcriptBox) return;
						if (text) {
							transcriptBox.textContent += text;
							transcriptBox.scrollTop = transcriptBox.scrollHeight;
						}
						if (isComplete) {
							transcriptBox.textContent += '\n';
						}
					},
					onToolCall: (name, args, res) => {
						if (!actionsLog) return;
						const item = document.createElement('div');
						item.textContent = `✓ ${name}: ${JSON.stringify(res || {})}`;
						actionsLog.appendChild(item);
					},
					onVolume: (level) => {
						if (!orb) return;
						const scale = 1.0 + level * 0.45;
						const blur = 20 + level * 30;
						orb.style.transform = `scale(${scale.toFixed(2)})`;
						orb.style.boxShadow = `0 0 ${blur.toFixed(0)}px rgba(59,130,246,0.8)`;
					},
					onCostUpdate: (costData) => {
						this._updateCostBadge(costData);
					},
					onError: (err) => {
						if (SNW.ToastUtil) SNW.ToastUtil.error(err.message || 'Live Voice error');
					}
				});
			} catch (e) {
				if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
				if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
				if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || 'Live connection failed');
			}
		}

		_renderHistory() {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap || !this._history) return;
			wrap.innerHTML = '';
			for (const item of this._history) {
				this._appendMessage(item.role, item.text, false);
			}
		}

		_onClearHistory() {
			if (SNW.AIClient) {
				SNW.AIClient.clearHistory();
			}
			this._history = [];
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (wrap) wrap.innerHTML = '';
			if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('ai.clearHistory'));
		}

		async _onVoiceToggle() {
			if (!SNW.AIVoice || !SNW.AIVoice.isSTTSupported()) {
				if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('ai.voiceNotSupported'));
				return;
			}

			const vBtn = this.el.querySelector('[data-action="voice"]');
			if (this._isListening) {
				SNW.AIVoice.stopListening();
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');
				return;
			}

			this._isListening = true;
			if (vBtn) vBtn.classList.add('snw-btn--active');
			if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('ai.voiceListening'));

			try {
				const res = await SNW.AIVoice.startListening();
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');

				if (res && res.transcript) {
					const inp = this.el.querySelector('[data-slot="input"]');
					if (inp) {
						inp.value = res.transcript;
						this._onSend(true); // 음성 모드로 전송
					}
				}
			} catch (err) {
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');
				if (SNW.ToastUtil) SNW.ToastUtil.error(SNW.I18n.t('ai.micError'));
			}
		}

		async _onSend(isVoiceMode = false) {
			const inp = this.el.querySelector('[data-slot="input"]');
			const msg = (inp && inp.value || '').trim();
			if (!msg) return;
			inp.value = '';

			this._appendMessage('user', msg, true);
			this._appendMessage('assistant', SNW.I18n.t('ai.thinking'), false);

			try {
				let resText = '';
				let speechHint = '';
				let actions = [];

				if (SNW.AIClient) {
					const res = await SNW.AIClient.send(msg, this._history, {
						lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
						voiceMode: isVoiceMode
					});
					if (!this._active) return;

					if (res) {
						resText = res.text || '';
						speechHint = res._speechHint || resText;
						actions = res.actions || [];
					}
				} else {
					// 폴백
					const res = await SNW.Api.gemini({ message: msg });
					if (!this._active) return;
					resText = (res && res.text) || '(no response)';
				}

				if (!resText) resText = '(no response)';

				this._replaceLastAssistant(resText, actions);

				// 대화 이력 업데이트 및 저장
				this._history.push({ role: 'assistant', text: resText });
				if (SNW.AIClient) {
					SNW.AIClient.saveHistory(this._history);
				}

				// TTS 음성 출력
				if (speechHint && SNW.AIVoice && SNW.AIVoice.isTTSSupported()) {
					SNW.AIVoice.speak(speechHint);
				}

			} catch (e) {
				this._replaceLastAssistant('[ERROR] ' + (e.message || 'failed'), []);
				SNW.ErrorHandler.handle(e, 'ai.send');
			}
		}

		_appendMessage(role, text, saveToHistory = false) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const cls = role === 'user' ? 'is-user' : 'is-assistant';
			wrap.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-msg ${cls}">
                    <div class="snw-ai-bubble">${text}</div>
                </div>`);
			wrap.scrollTop = wrap.scrollHeight;

			if (saveToHistory) {
				this._history.push({ role, text });
				if (SNW.AIClient) {
					SNW.AIClient.saveHistory(this._history);
				}
			}
		}

		_replaceLastAssistant(text, actions = []) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const list = wrap.querySelectorAll('.snw-ai-msg.is-assistant');
			const last = list[list.length - 1];
			if (last) {
				const bubble = last.querySelector('.snw-ai-bubble');
				if (bubble) {
					let actionHtml = '';
					if (actions && actions.length > 0) {
						actionHtml = `<div class="snw-ai-actions" style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.2);font-size:0.85em;color:#4ade80;">`;
						for (const a of actions) {
							actionHtml += `<div>✓ ${SNW.DomUtil.escape(a.name)}: ${SNW.DomUtil.escape(a.result)}</div>`;
						}
						actionHtml += `</div>`;
					}
					bubble.innerHTML = `${SNW.DomUtil.escape(text)}${actionHtml}`;
				}
			}
			wrap.scrollTop = wrap.scrollHeight;
		}
	};
})(window.SNW);


/* ---- 290.page.automation.js (4285 bytes) ---- */
// =========================================================
// app/290.page.automation.js — 공용 탭 컨테이너
// Layer 4 (Panel)
//  - /wind/* : 4탭 (studio / simulation / playlist / presets)
//  - /automation/* : 3탭 (schedule / timer / rules)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    const TABS_WIND = [
        { key: 'studio',     label: '🎨 Studio' },
        { key: 'simulation', label: '🎮 체험실' },
        { key: 'playlist',   label: '🎵 Playlist' },
        { key: 'presets',    label: '🌿 프리셋' },
    ];
    const TABS_AUTO = [
        { key: 'schedule', label: '⏰ 스케줄' },
        { key: 'timer',    label: '⏱️ 타이머' },
        { key: 'rules',    label: '📐 규칙' },
    ];

    SNW.Page.Automation = class Automation {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this._active = true;
            this._panels = {};
            // params.tab이 wind 세트인지 automation 세트인지 판별
            const windKeys = ['studio', 'simulation', 'playlist', 'presets'];
            const isWind = windKeys.includes(params.tab || 'studio');
            this.mode = isWind ? 'wind' : 'automation';
            const validTabs = isWind ? TABS_WIND : TABS_AUTO;
            this.currentTab = validTabs.find(t => t.key === params.tab)?.key || validTabs[0].key;
            this.tabs = validTabs;
        }

        async mount() {
            const t = this.tabs;
            this.el.innerHTML = `
                <div class="snw-automation">
                    <div class="snw-tabs snw-automation__tabs" style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--snw-border,#2f3844);padding-bottom:8px;overflow-x:auto;">
                        ${t.map(tb => `
                            <button type="button" class="snw-tab-btn ${tb.key === this.currentTab ? 'is-active' : ''}" data-tab="${tb.key}">
                                ${tb.label}
                            </button>
                        `).join('')}
                    </div>
                    <div class="snw-automation__content" data-slot="panel"></div>
                </div>`;

            this.el.querySelectorAll('.snw-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.getAttribute('data-tab');
                    if (tab !== this.currentTab) {
                        const base = (this.mode === 'wind') ? '/wind' : '/automation';
                        SNW.Router.navigate(`${base}/${tab}`);
                    }
                });
            });

            await this._mountTab(this.currentTab);
        }

        unmount() {
            this._active = false;
            Object.values(this._panels).forEach(p => {
                if (p && typeof p.unmount === 'function') p.unmount();
            });
            this._panels = {};
        }

        async _mountTab(tab) {
            const prev = this._panels[this.currentTab];
            if (prev && prev !== this._panels[tab] && typeof prev.unmount === 'function') {
                prev.unmount();
            }

            const slot = this.el.querySelector('[data-slot="panel"]');
            if (!slot) return;
            slot.innerHTML = '';

            // 탭 → 클래스 매핑
            const panelMap = {
                studio:     SNW.Studio,
                simulation: SNW.Page.Simulation,
                playlist:   SNW.Playlist,
                presets:    SNW.Page.Windprofile,
                schedule:   SNW.SchedulePanel,
                timer:      SNW.TimerPanel,
                rules:      SNW.Page.Rules,
            };

            const PanelClass = panelMap[tab];
            if (!PanelClass) {
                slot.innerHTML = `<div class="snw-empty">${SNW.DomUtil ? SNW.DomUtil.escape(tab) : tab} 준비 중</div>`;
                return;
            }

            const panel = new PanelClass(slot, this.params);
            this._panels[tab] = panel;
            this.currentTab = tab;
            await panel.mount();
        }
    };
})(window.SNW);


/* ---- 291.studio.js (33457 bytes) ---- */
// =========================================================
// 291.studio.js — Wind Design Studio (작곡)
// Layer 3 (Studio 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // =========================================================
    // Step 편집기 (내부)
    // =========================================================
    class StepEditor {
        constructor(step, index, onChange, onDelete, onMoveUp, onMoveDown) {
            this.step = JSON.parse(JSON.stringify(step || this._defaultStep()));
            this.index = index;
            this.onChange = onChange;
            this.onDelete = onDelete;
            this.onMoveUp = onMoveUp;
            this.onMoveDown = onMoveDown;
            this.el = null;
            this._sparkline = null;
            this._debounceTimer = null;
        }

        _defaultStep() {
            return {
                stepNo: 1,
                durationMin: 20,
                type: 'PRESET',
                presetCode: 'OCEAN',
                styleCode: 'BALANCE',
                fixedSpeed: 0,
                override: {
                    enabled: false,
                    windIntensity: -1,
                    windVariability: -1,
                    gustFrequency: -1,
                },
            };
        }

        render() {
            const s = this.step;
            const isPreset = s.type === 'PRESET';
            const isFixed = s.type === 'FIXED';
            const isRest = s.type === 'REST';
            const ovr = s.override || { enabled: false };

            const el = document.createElement('div');
            el.className = 'snw-step-card';
            el.innerHTML = `
                <div class="snw-step-card__header">
                    <span class="snw-step-card__title">Step ${this.index + 1}</span>
                    <div class="snw-step-card__actions">
                        <button type="button" class="snw-icon-btn" data-action="up"   title="위로" ${this.index === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="snw-icon-btn" data-action="down" title="아래로">▼</button>
                        <button type="button" class="snw-icon-btn" data-action="sim-step" title="예상 파형 시뮬레이션">🎬</button>
                        <button type="button" class="snw-icon-btn snw-icon-btn--danger" data-action="delete" title="삭제">🗑</button>
                    </div>
                </div>

                <!-- 2열 그리드 -->
                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>타입</span>
                        <select data-field="type">
                            <option value="PRESET" ${isPreset ? 'selected' : ''}>프리셋 재생</option>
                            <option value="FIXED"  ${isFixed ? 'selected' : ''}>고정 풍속</option>
                            <option value="REST"   ${isRest ? 'selected' : ''}>휴지 (정지)</option>
                        </select>
                    </label>

                    <label class="snw-step-field">
                        <span>지속</span>
                        <div class="snw-step-field__row">
                            <input type="number" data-field="durationMin" min="1" max="1440" value="${s.durationMin || 20}">
                            <span class="snw-step-field__unit">분</span>
                        </div>
                    </label>
                </div>

                ${isPreset ? `
                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>프리셋</span>
                        <select data-field="presetCode">
                            ${this._presetOptions(s.presetCode)}
                        </select>
                    </label>
                    <label class="snw-step-field">
                        <span>스타일</span>
                        <select data-field="styleCode">
                            ${this._styleOptions(s.styleCode)}
                        </select>
                    </label>
                </div>` : ''}

                ${isFixed ? `
                <div class="snw-step-card__grid">
                    <label class="snw-step-field snw-step-field--full">
                        <span>고정 풍속 <b data-slot="fixed-label">${s.fixedSpeed || 50}%</b></span>
                        <input type="range" data-field="fixedSpeed" min="0" max="100" step="5" value="${s.fixedSpeed || 50}">
                    </label>
                </div>` : ''}

                ${isPreset ? `
                <!-- 물리 세부 조정 (Override) -->
                <details class="snw-step-card__override" ${ovr.enabled ? 'open' : ''}>
                    <summary style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:4px 0; list-style:none; outline:none;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <!-- pointer-events:none으로 클릭 시 summary 이벤트를 유도 -->
                            <input type="checkbox" data-field="overrideEnabled" ${ovr.enabled ? 'checked' : ''} style="pointer-events:none;">
                            <span>⚙ 물리 세부 조정 (Override)</span>
                        </div>
                        ${ovr.enabled ? `<span class="snw-badge snw-badge--warn" style="font-size:10px;padding:2px 6px;">수동 튜닝됨</span>` : ''}
                    </summary>
                    <div class="snw-step-card__override-body">
                        <div style="display:flex;justify-content:flex-end;margin-bottom:6px;">
                            <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-action="reset-ovr" style="font-size:11px;padding:2px 8px;" title="선택한 프리셋의 기본 물리 파라미터로 되돌립니다">
                                ↺ 기본값 원복
                            </button>
                        </div>
                        <label class="snw-step-field snw-step-field--full">
                            <span>바람 세기 (강도) <b data-slot="ovr-int-label">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b></span>
                            <input type="range" data-field="ovrIntensity" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>강약 변화폭 (변동성) <small style="color:var(--snw-text-dim);">[잔잔함 ↔ 역동적]</small> <b data-slot="ovr-var-label">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b></span>
                            <input type="range" data-field="ovrVariability" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>산들바람 빈도 (열기포/돌풍) <b data-slot="ovr-gust-label">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}%</b></span>
                            <input type="range" data-field="ovrGust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}">
                        </label>
                    </div>
                </details>` : ''}

                <div class="snw-step-card__sparkline" data-slot="sparkline"></div>
                <div class="snw-step-card__sparkline-meta" data-slot="sparkline-meta"></div>
            `;

            this.el = el;

            // 이벤트 바인딩
            const btnDel = el.querySelector('[data-action="delete"]');
            if (btnDel) btnDel.onclick = () => this.onDelete(this.index);
            const btnUp = el.querySelector('[data-action="up"]');
            if (btnUp) btnUp.onclick = () => this.onMoveUp(this.index);
            const btnDown = el.querySelector('[data-action="down"]');
            if (btnDown) btnDown.onclick = () => this.onMoveDown(this.index);
            const btnSim = el.querySelector('[data-action="sim-step"]');
            if (btnSim) {
                btnSim.onclick = async () => {
                    if (SNW.UI && typeof SNW.UI.simulationModal === 'function') {
                        await SNW.UI.simulationModal({
                            mode: 'single',
                            a: {
                                presetCode: this.step.presetCode || 'OCEAN',
                                styleCode: this.step.styleCode || 'BALANCE',
                                override: this.step.override,
                            },
                        });
                    }
                };
            }

            const btnResetOvr = el.querySelector('[data-action="reset-ovr"]');
            if (btnResetOvr) {
                btnResetOvr.onclick = () => this._resetOverrideToDefaults(el);
            }

            el.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => this._onFieldChange(el, input));
                input.addEventListener('change', () => this._onFieldChange(el, input));
            });

            // [추가] details 태그 열고 닫을 때 체크박스 상태 동기화
            const detailsEl = el.querySelector('.snw-step-card__override');
            if (detailsEl) {
                detailsEl.addEventListener('toggle', () => {
                    const chk = el.querySelector('[data-field="overrideEnabled"]');
                    if (chk && chk.checked !== detailsEl.open) {
                        chk.checked = detailsEl.open;
                        chk.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }

            // Sparkline 초기화
            if (SNW.UI && typeof SNW.UI.sparkline === 'function') {
                this._sparkline = SNW.UI.sparkline(
                    el.querySelector('[data-slot="sparkline"]'),
                    { color: '#4a9eff', baseline: 0 });
                this._updateSparkline();
            }

            return el;
        }

        _presetOptions(current) {
            const presets = (SNW.Studio._windDict && SNW.Studio._windDict.presets) || [];
            return presets.map(p =>
                `<option value="${p.code}" ${p.code === current ? 'selected' : ''}>${SNW.DomUtil ? SNW.DomUtil.escape(p.name || p.code) : p.code}</option>`
            ).join('');
        }

        _styleOptions(current) {
            const styles = (SNW.Studio._windDict && SNW.Studio._windDict.styles) || [];
            return styles.map(s =>
                `<option value="${s.code}" ${s.code === current ? 'selected' : ''}>${SNW.DomUtil ? SNW.DomUtil.escape(s.name || s.code) : s.code}</option>`
            ).join('');
        }

        _onFieldChange(el, input) {
            const field = input.getAttribute('data-field');
            const val = (input.type === 'checkbox') ? input.checked : input.value;

            if (!this.step.override) {
                this.step.override = { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 };
            }

            switch (field) {
                case 'type':
                    this.step.type = val;
                    if (val === 'PRESET' && !this.step.presetCode) this.step.presetCode = 'OCEAN';
                    if (val === 'PRESET' && !this.step.styleCode) this.step.styleCode = 'BALANCE';
                    this._rerender();
                    return;
                case 'durationMin':
                    this.step.durationMin = Math.max(1, Math.min(1440, Number(val) || 1));
                    break;
                case 'presetCode':
                    this.step.presetCode = val;
                    break;
                case 'styleCode':
                    this.step.styleCode = val;
                    break;
                case 'fixedSpeed':
                    this.step.fixedSpeed = Number(val) || 0;
                    const lbl = el.querySelector('[data-slot="fixed-label"]');
                    if (lbl) lbl.textContent = this.step.fixedSpeed + '%';
                    break;
                case 'overrideEnabled':
                    this.step.override.enabled = !!val;
                    if (val) {
                        if (this.step.override.windIntensity < 0) this.step.override.windIntensity = 70;
                        if (this.step.override.windVariability < 0) this.step.override.windVariability = 50;
                        if (this.step.override.gustFrequency < 0) this.step.override.gustFrequency = 45;
                    }
                    // 체크박스 상태에 맞춰 details 열고 닫기
                    const detailsEl = el.querySelector('.snw-step-card__override');
                    if (detailsEl) detailsEl.open = !!val;
                    break;
                case 'ovrIntensity':
                    this.step.override.windIntensity = Number(val);
                    this.step.override.enabled = true;
                    const chkInt = el.querySelector('[data-field="overrideEnabled"]');
                    if (chkInt) chkInt.checked = true;
                    const lInt = el.querySelector('[data-slot="ovr-int-label"]');
                    if (lInt) lInt.textContent = val + '%';
                    break;
                case 'ovrVariability':
                    this.step.override.windVariability = Number(val);
                    this.step.override.enabled = true;
                    const chkVar = el.querySelector('[data-field="overrideEnabled"]');
                    if (chkVar) chkVar.checked = true;
                    const lVar = el.querySelector('[data-slot="ovr-var-label"]');
                    if (lVar) lVar.textContent = val + '%';
                    break;
                case 'ovrGust':
                    this.step.override.gustFrequency = Number(val);
                    this.step.override.enabled = true;
                    const chkGust = el.querySelector('[data-field="overrideEnabled"]');
                    if (chkGust) chkGust.checked = true;
                    const lGust = el.querySelector('[data-slot="ovr-gust-label"]');
                    if (lGust) lGust.textContent = val + '%';
                    break;
            }

            this.onChange(this.index, this.step);
            this._scheduleSparklineUpdate();
        }

        _rerender() {
            const newEl = this.render();
            if (this.el && this.el.parentNode) {
                this.el.parentNode.replaceChild(newEl, this.el);
            }
            this.onChange(this.index, this.step);
        }

        _scheduleSparklineUpdate() {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this._updateSparkline(), 250);
        }

        async _updateSparkline() {
            if (!this._sparkline || !SNW.Preview) return;
            const wave = await SNW.Preview.generateStep(this.step);
            if (wave && wave.points) {
                this._sparkline.render(wave.points);
                const meta = this.el.querySelector('[data-slot="sparkline-meta"]');
                if (meta) {
                    meta.textContent = wave.avg > 0
                        ? `예상 평균 ${wave.avg} m/s · 강도 ${Math.round(wave.intensity)}%`
                        : '완전 휴지 (0 m/s)';
                }
            }
        }

        _resetOverrideToDefaults(el) {
            const presets = (SNW.Studio._windDict && SNW.Studio._windDict.presets) || [];
            const target = presets.find(p => p.code === this.step.presetCode) || {};
            const factors = target.factors || {};

            const defInt = (factors.windIntensity != null) ? factors.windIntensity : 70;
            const defVar = (factors.windVariability != null) ? factors.windVariability : 50;
            const defGust = (factors.gustFrequency != null) ? factors.gustFrequency : 45;

            if (!this.step.override) {
                this.step.override = { enabled: true };
            }
            this.step.override.windIntensity = defInt;
            this.step.override.windVariability = defVar;
            this.step.override.gustFrequency = defGust;

            const inputInt = el.querySelector('[data-field="ovrIntensity"]');
            const inputVar = el.querySelector('[data-field="ovrVariability"]');
            const inputGust = el.querySelector('[data-field="ovrGust"]');
            const lblInt = el.querySelector('[data-slot="ovr-int-label"]');
            const lblVar = el.querySelector('[data-slot="ovr-var-label"]');
            const lblGust = el.querySelector('[data-slot="ovr-gust-label"]');

            if (inputInt) inputInt.value = defInt;
            if (inputVar) inputVar.value = defVar;
            if (inputGust) inputGust.value = defGust;
            if (lblInt) lblInt.textContent = `${defInt}%`;
            if (lblVar) lblVar.textContent = `${defVar}%`;
            if (lblGust) lblGust.textContent = `${defGust}%`;

            this._scheduleSparklineUpdate();
            this.onChange(this.index, this.step);
            if (SNW.ToastUtil) SNW.ToastUtil.info('프리셋 기본값으로 복원되었습니다.');
        }

        getStep() { return this.step; }
    }

    // =========================================================
    // Studio 페이지
    // =========================================================
    SNW.Studio = class Studio {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this._active = true;
            this._steps = [];
            this._stepEditors = [];
            this._profileId = null;
            this._profileNo = 0;
            this._name = '';
            this._repeat = false;
            this._repeatCount = 0;
            this._currentRule = null; // [Stage 5] 규칙
        }

        static _windDict = null;

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">Studio 로딩 중...</div>';

            if (!SNW.Studio._windDict) {
                try {
                    const data = await SNW.Api.getWindDict();
                    SNW.Studio._windDict = data || { presets: [], styles: [] };
                    if (SNW.Preview) await SNW.Preview.init();
                } catch (e) {
                    this.el.innerHTML = '<div class="snw-error">WindDict 로드 실패</div>';
                    return;
                }
            }

            const editId = (this.params && this.params.edit) ? parseInt(this.params.edit, 10) : null;

            if (editId) {
                await this._loadProfile(editId);
            } else {
                this._resetNewProfile();
            }

            this._render();
        }

        unmount() {
            this._active = false;
        }

        _resetNewProfile() {
            this._profileId = null;
            this._profileNo = Math.floor(Date.now() / 1000) % 65535;
            this._name = '새 프로필';
            this._repeat = false;
            this._repeatCount = 0;
            this._steps = [this._defaultStep()];
            this._currentRule = null;
        }

        async _loadProfile(profileId) {
            try {
                const data = await SNW.Api.listProfiles();
                const root = (data && data.userProfiles) ? data.userProfiles : data;
                const profiles = (root && root.profiles) || [];
                const target = profiles.find(p => (p.profileId === profileId || p.profileNo === profileId));
                if (!target) {
                    if (SNW.ToastUtil) SNW.ToastUtil.warn('프로필을 찾을 수 없습니다.');
                    this._resetNewProfile();
                    return;
                }
                this._profileId = target.profileId || target.profileNo;
                this._profileNo = target.profileNo;
                this._name = target.name;
                this._repeat = !!target.repeatSegments;
                this._repeatCount = target.repeatCount || 0;
                this._steps = (target.steps && target.steps.length > 0) ? target.steps : [this._defaultStep()];
                this._currentRule = target.rule || null;
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('프로필 로드 실패');
                this._resetNewProfile();
            }
        }

        _defaultStep() {
            return {
                stepNo: 1, durationMin: 20, type: 'PRESET',
                presetCode: 'OCEAN', styleCode: 'BALANCE', fixedSpeed: 0,
                override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 },
            };
        }

        _render() {
            const isEdit = !!this._profileId;

            this.el.innerHTML = `
                <div class="snw-studio">
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:16px;">
                        <h2 style="font-size:18px;margin-bottom:12px;color:var(--snw-text,#e6edf3);">${isEdit ? '프로필 편집' : '새 프로필 작곡'}</h2>

                        <div class="snw-form">
                            <div class="snw-form-row" style="margin-bottom:12px;">
                                <label style="display:block;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-bottom:4px;">프로필 이름</label>
                                <input type="text" data-field="name" value="${SNW.DomUtil ? SNW.DomUtil.escape(this._name) : this._name}" maxlength="32" style="width:100%;padding:8px 10px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);">
                            </div>
                            
                            <div class="snw-form-row snw-form-row--inline" style="margin-bottom:16px;">
                                <label class="snw-step-checkbox" style="margin:0;">
                                    <input type="checkbox" data-field="repeat" ${this._repeat ? 'checked' : ''}>
                                    <span>반복</span>
                                </label>
                                <input type="number" data-field="repeatCount" min="0" max="99" value="${this._repeatCount}" placeholder="0" 
                                       style="width:70px;padding:6px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);text-align:center;">
                                <span class="snw-form-hint" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">회 (0=무한)</span>
                            </div>
                        </div>

                        <h3 class="snw-form-section" style="font-size:14px;color:var(--snw-primary,#4a9eff);margin:16px 0 10px;">Step 시퀀스</h3>
                        <div data-slot="steps"></div>

                        <button type="button" class="snw-btn snw-btn--add-step" data-action="add-step">
                            + Step 추가 (최대 8개)
                        </button>

                        <!-- [Stage 5] 스마트 쾌적 & 자동 정지 규칙 -->
                        <details class="snw-studio-rules" style="margin-top:20px;border:1px dashed var(--snw-border,#2f3844);border-radius:8px;padding:12px;background:var(--snw-surface-2,#232b36);">
                            <summary style="cursor:pointer;font-weight:600;font-size:14px;color:var(--snw-text,#e6edf3);">
                                ⚙ 스마트 쾌적 & 자동 정지 규칙
                            </summary>
                            <div data-slot="rule-summary" style="margin-top:12px;font-size:12px;color:var(--snw-text-dim,#8b949e);">
                                로딩 중...
                            </div>
                            <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" style="margin-top:8px;">
                                규칙 편집 →
                            </button>
                        </details>
                    </div>

                    <!-- 하단 액션 바 -->
                    <div class="snw-studio__bar">
                        <button type="button" class="snw-btn" data-action="preview-all" style="padding:8px 16px;background:rgba(74,158,255,0.1);color:var(--snw-primary,#4a9eff);border:1px solid var(--snw-primary,#4a9eff);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">🎬 미리보기</button>
                        <div style="display:flex; gap:8px;">
                            <button type="button" class="snw-btn" data-action="cancel" style="padding:8px 16px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;">취소</button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="save" style="padding:8px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                ${isEdit ? '업데이트' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>`;

            // 폼 바인딩
            this.el.querySelector('[data-field="name"]').addEventListener('input', e => {
                this._name = e.target.value;
            });
            this.el.querySelector('[data-field="repeat"]').addEventListener('change', e => {
                this._repeat = e.target.checked;
            });
            this.el.querySelector('[data-field="repeatCount"]').addEventListener('input', e => {
                this._repeatCount = Math.max(0, parseInt(e.target.value, 10) || 0);
            });

            // 액션 바인딩
            this.el.querySelector('[data-action="add-step"]').onclick = () => this._onAddStep();
            this.el.querySelector('[data-action="cancel"]').onclick = () => this._onCancel();
            this.el.querySelector('[data-action="save"]').onclick = () => this._onSave();
            const btnPreviewAll = this.el.querySelector('[data-action="preview-all"]');
            if (btnPreviewAll) {
                btnPreviewAll.onclick = async () => {
                    const firstPreset = this._steps.find(s => s.type === 'PRESET');
                    if (!firstPreset) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('PRESET Step이 없어 시뮬레이션을 생성할 수 없습니다');
                        return;
                    }
                    if (SNW.UI && typeof SNW.UI.simulationModal === 'function') {
                        await SNW.UI.simulationModal({
                            mode: 'single',
                            a: {
                                presetCode: firstPreset.presetCode || 'OCEAN',
                                styleCode: firstPreset.styleCode || 'BALANCE',
                                override: firstPreset.override,
                            },
                        });
                    }
                };
            }

            // [Stage 5] 규칙 편집 진입점
            const _updateRuleSummary = () => {
                const ruleSummaryEl = this.el.querySelector('[data-slot="rule-summary"]');
                if (!ruleSummaryEl) return;
                const r = this._currentRule || {};
                const items = [];
                if (r.timer?.enabled)     items.push(`⏱️${r.timer.minutes}m`);
                if (r.offTime?.enabled)   items.push(`⏰${r.offTime.time}`);
                if (r.tempLow?.enabled)   items.push(`🌡️${r.tempLow.mode}`);
                if (r.diLow?.enabled)     items.push(`☀️${r.diLow.mode}`);
                if (r.pirPause?.enabled)  items.push(`👤${r.pirPause.holdSec}s`);
                if (r.smartComfort?.enabled) items.push(`✨auto`);
                ruleSummaryEl.textContent = items.length > 0 ? items.join(' · ') : '규칙 미설정 (클릭하여 추가)';
            };
            _updateRuleSummary();

            const btnEditRule = this.el.querySelector('[data-action="edit-rule"]');
            if (btnEditRule) {
                btnEditRule.onclick = async () => {
                    if (!SNW.UI.ruleEditor) return;
                    const newRule = await SNW.UI.ruleEditor.showModal(this._currentRule);
                    if (!newRule) return;
                    this._currentRule = newRule;
                    _updateRuleSummary();
                };
            }

            this._renderSteps();
        }

        _renderSteps() {
            const slot = this.el.querySelector('[data-slot="steps"]');
            if (!slot) return;
            slot.innerHTML = '';

            this._stepEditors = [];

            this._steps.forEach((step, idx) => {
                const editor = new StepEditor(
                    step, idx,
                    (i, s) => { this._steps[i] = s; },
                    (i) => this._onDeleteStep(i),
                    (i) => this._onMoveStep(i, -1),
                    (i) => this._onMoveStep(i, 1),
                );
                const stepEl = editor.render();
                slot.appendChild(stepEl);
                this._stepEditors.push(editor);
            });
        }

        _onAddStep() {
            if (this._steps.length >= 8) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn('Step은 최대 8개까지 추가 가능합니다.');
                return;
            }
            this._steps.push(this._defaultStep());
            this._renderSteps();
        }

        _onDeleteStep(idx) {
            if (this._steps.length <= 1) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn('최소 1개의 Step이 필요합니다.');
                return;
            }
            this._steps.splice(idx, 1);
            this._steps.forEach((s, i) => { s.stepNo = i + 1; });
            this._renderSteps();
        }

        _onMoveStep(idx, dir) {
            const target = idx + dir;
            if (target < 0 || target >= this._steps.length) return;
            const tmp = this._steps[idx];
            this._steps[idx] = this._steps[target];
            this._steps[target] = tmp;
            this._steps.forEach((s, i) => { s.stepNo = i + 1; });
            this._renderSteps();
        }

        async _onSave() {
            if (!this._name.trim()) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('프로필 이름을 입력하세요.');
                return;
            }
            if (this._steps.length === 0) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('최소 1개의 Step이 필요합니다.');
                return;
            }
            for (const s of this._steps) {
                if (s.durationMin < 1 || s.durationMin > 1440) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error('Step 지속 시간은 1~1440분이어야 합니다.');
                    return;
                }
            }

            const profile = {
                profileNo: this._profileNo,
                name: this._name.trim(),
                enabled: true,
                repeatSegments: this._repeat,
                repeatCount: this._repeatCount,
                stepCount: this._steps.length,
                steps: this._steps,
                rule: this._currentRule,
            };

            try {
                let savedId = this._profileId;
                if (this._profileId) {
                    await SNW.Api.updateProfile(this._profileId, profile);
                } else {
                    const res = await SNW.Api.addProfile(profile);
                    if (res && (res.id || res.profileId || res.profileNo)) {
                        savedId = res.id || res.profileId || res.profileNo;
                    }
                }
                if (SNW.ToastUtil) SNW.ToastUtil.success(this._profileId ? '업데이트 완료' : '저장 완료');
                const targetProfId = savedId;
                setTimeout(() => {
                    if (targetProfId && confirm('지금 이 프로필을 재생해 보시겠어요?')) {
                        if (SNW.Api && typeof SNW.Api.startPlaylist === 'function') {
                            SNW.Api.startPlaylist(targetProfId);
                        }
                    }
                }, 400);
                SNW.Router.navigate('/wind/playlist');
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
            }
        }

        _onCancel() {
            if (confirm('편집 내용을 버리시겠습니까?')) {
                SNW.Router.navigate('/wind/playlist');
            }
        }
    };
})(window.SNW);


/* ---- 292.playlist.js (11197 bytes) ---- */
// =========================================================
// 292.playlist.js — Wind Playlist (재생 목록)
// Layer 3 (Playlist 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.Playlist = class Playlist {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._schedules = [];
        }

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">로딩 중...</div>';

            if (SNW.Preview) await SNW.Preview.init();

            try {
                const [profData, schData] = await Promise.all([
                    SNW.Api.listProfiles(),
                    SNW.Api.listSchedules ? SNW.Api.listSchedules().catch(() => null) : null,
                ]);
                const pRoot = (profData && profData.userProfiles) ? profData.userProfiles : profData;
                this._profiles = (pRoot && pRoot.profiles) || [];

                const sRoot = (schData && schData.schedules) ? schData.schedules : schData;
                this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('데이터 로드 실패');
            }

            await this._render();
        }

        unmount() { this._active = false; }

        async _render() {
            if (this._profiles.length === 0) {
                this.el.innerHTML = `
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:32px;text-align:center;">
                        <div class="snw-empty">
                            <p style="color:var(--snw-text-dim,#8b949e);margin-bottom:16px;">아직 작곡한 프로필이 없습니다.</p>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="new" style="padding:10px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                🎨 Studio에서 작곡하기
                            </button>
                        </div>
                    </div>`;
                this.el.querySelector('[data-action="new"]').onclick = () => {
                    SNW.Router.navigate('/automation/studio');
                };
                return;
            }

            this.el.innerHTML = `
                <div class="snw-playlist">
                    <div class="snw-playlist__header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                        <span style="font-size:14px;color:var(--snw-text-dim,#8b949e);">${this._profiles.length}개의 프로필</span>
                        <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="new" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:13px;font-weight:600;">
                            + 새로 작곡
                        </button>
                    </div>
                    <div class="snw-playlist__list" data-slot="list" style="display:flex;flex-direction:column;gap:12px;"></div>
                </div>`;

            this.el.querySelector('[data-action="new"]').onclick = () => {
                SNW.Router.navigate('/automation/studio');
            };

            const listSlot = this.el.querySelector('[data-slot="list"]');
            for (let i = 0; i < this._profiles.length; i++) {
                const card = await this._renderCard(this._profiles[i]);
                listSlot.appendChild(card);
            }
        }

        async _renderCard(profile) {
            const pId = profile.profileId || profile.profileNo;
            const refCount = this._schedules.filter(s => s.profileId === pId).length;

            const card = document.createElement('div');
            card.className = 'snw-playlist-item';
            card.style.cssText = 'background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:14px;display:flex;flex-direction:column;gap:10px;';
            card.innerHTML = `
                <div class="snw-playlist-item__main" style="display:flex;flex-direction:column;gap:6px;">
                    <div class="snw-playlist-item__head" style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="snw-playlist-item__name" style="font-weight:600;font-size:15px;color:var(--snw-text,#e6edf3);">📋 ${SNW.DomUtil ? SNW.DomUtil.escape(profile.name) : profile.name}</span>
                        <span class="snw-playlist-item__meta" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">${profile.stepCount || (profile.steps ? profile.steps.length : 0)} Step · ${this._fmtTotal(profile)}</span>
                    </div>
                    
                    <div class="snw-playlist-item__sparkline" data-slot="spark" style="height:100px; margin:8px 0; border-radius:8px; padding:8px;"></div>
      
                    <div class="snw-playlist-item__refs" style="font-size:11px;color:var(--snw-text-faint,#6e7a87);">
                        ${refCount > 0
                    ? `<span style="color:var(--snw-warn,#d29922);">⏰ 스케줄 ${refCount}개에서 사용 중</span>`
                    : `<span class="snw-playlist-item__noref">스케줄 미참조</span>`}
                    </div>
                </div>
                <div class="snw-playlist-item__actions" style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
                    <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="play" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;font-weight:600;">▶ 재생</button>
                    <button type="button" class="snw-btn snw-btn--sm" data-action="rule" style="padding:6px 12px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">⚙ 규칙</button>
                    <button type="button" class="snw-btn snw-btn--sm" data-action="edit" style="padding:6px 12px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">✏️ 편집</button>
                    <button type="button" class="snw-btn snw-btn--sm snw-btn--danger" data-action="delete" style="padding:6px 12px;background:rgba(248,81,73,0.15);color:var(--snw-error,#f85149);border:1px solid rgba(248,81,73,0.3);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">🗑</button>
                </div>
            `;

            // Sparkline 렌더링
            if (SNW.Preview && SNW.UI && typeof SNW.UI.sparkline === 'function') {
                (async () => {
                    const wave = await SNW.Preview.generatePlaylistWaveform(profile.steps || []);
                    if (wave && wave.points) {
                        const sl = SNW.UI.sparkline(
                            card.querySelector('[data-slot="spark"]'),
                            { color: '#4a9eff', baseline: 0 });
                        sl.render(wave.points);
                    }
                })();
            }

            // 액션 바인딩
            card.querySelector('[data-action="play"]').onclick = async () => {
                try {
                    await SNW.Api.startPlaylist(pId);
                    if (SNW.ToastUtil) SNW.ToastUtil.success(`▶ ${profile.name} 재생 시작`);
                    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '재생 실패');
                }
            };

            const ruleBtn = card.querySelector('[data-action="rule"]');
            if (ruleBtn) {
                ruleBtn.onclick = async () => {
                    if (!SNW.UI || !SNW.UI.ruleEditor) return;
                    const updated = await SNW.UI.ruleEditor.showModal(profile.rule || {}, {
                        title: `${profile.name || '바람'} 규칙`,
                    });
                    if (updated) {
                        try {
                            profile.rule = updated;
                            await SNW.Api.updateProfile(pId, profile);
                            await SNW.Api.saveConfig();
                            if (SNW.ToastUtil) SNW.ToastUtil.success('규칙 저장 완료');
                            await this.mount();
                        } catch (e) {
                            if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '규칙 저장 실패');
                        }
                    }
                };
            }

            card.querySelector('[data-action="edit"]').onclick = () => {
                SNW.Router.navigate(`/wind/studio?edit=${pId}`);
            };

            card.querySelector('[data-action="delete"]').onclick = async () => {
                if (refCount > 0) {
                    if (!confirm(`이 프로필은 스케줄 ${refCount}개에서 참조 중입니다.\n삭제하면 해당 스케줄이 비활성화됩니다. 계속하시겠습니까?`)) {
                        return;
                    }
                } else {
                    if (!confirm('정말 삭제하시겠습니까?')) return;
                }
                try {
                    await SNW.Api.deleteProfile(pId);
                    if (SNW.ToastUtil) SNW.ToastUtil.success('삭제 완료');
                    await this.mount();
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '삭제 실패');
                }
            };

            return card;
        }


        _fmtTotal(profile) {
            // [ADR-2] steps[] canonical + legacy segments[] fallback
            const steps = (profile.steps && profile.steps.length > 0) ?
                profile.steps :
                (profile.segments || []);
            if (!steps.length) return '0분';

            let total = 0;
            for (const s of steps) {
                const dur = (s.durationMin != null) ?
                    Number(s.durationMin) :
                    (Number(s.onMinutes || 0) + Number(s.offMinutes || 0));
                total += dur || 0;
            }

            if (profile.repeatSegments && profile.repeatCount > 0) {
                total *= profile.repeatCount;
            }
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };
})(window.SNW);



/* ---- 293.schedule_panel.js (26282 bytes) ---- */
// =========================================================
// 293.schedule_panel.js — Schedule 편집 (Profile 참조만)
// Layer 3 (Schedule 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.SchedulePanel = class SchedulePanel {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._schedules = [];
            this._profiles = [];
        }

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">로딩 중...</div>';
            await this._load();
            this._render();
        }

        unmount() { this._active = false; }

        async _load() {
            try {
                const [schData, profData] = await Promise.all([
                    SNW.Api.listSchedules ? SNW.Api.listSchedules() : null,
                    SNW.Api.listProfiles ? SNW.Api.listProfiles() : null,
                ]);

                if (schData) {
                    const sRoot = schData.schedules ? schData.schedules : schData;
                    this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
                } else {
                    this._schedules = [];
                }

                if (profData) {
                    const pRoot = profData.userProfiles ? profData.userProfiles : profData;
                    this._profiles = (pRoot && pRoot.profiles) ? pRoot.profiles : (Array.isArray(pRoot) ? pRoot : []);
                } else {
                    this._profiles = [];
                }
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('스케줄 로드 실패');
            }
        }

        _render() {
            // 참조 가능한 프로필이 없으면 안내
            if (this._profiles.length === 0) {
                this.el.innerHTML = `
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:32px;text-align:center;">
                        <div class="snw-empty">
                            <p style="color:var(--snw-text-dim,#8b949e);margin-bottom:16px;">먼저 프로필을 작곡해야 스케줄을 만들 수 있습니다.</p>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="to-studio" style="padding:10px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                🎨 Studio에서 작곡하기
                            </button>
                        </div>
                    </div>`;
                const btn = this.el.querySelector('[data-action="to-studio"]');
                if (btn) {
                    btn.onclick = () => {
                        SNW.Router.navigate('/wind/studio');
                    };
                }
                return;
            }

            this.el.innerHTML = `
                <div class="snw-schedule">
                    <div class="snw-schedule__header">
                        <span>${this._schedules.length}개 스케줄</span>
                        <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="add" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                            + 새 스케줄
                        </button>
                    </div>

                    <div class="snw-schedule__list" data-slot="list"></div>

                    <div class="snw-schedule__note">
                        💡 스케줄은 <b>플레이리스트를 자동 재생</b>합니다.
                        Step 편집은 Studio 탭에서 하세요.
                    </div>
                </div>`;

            const addBtn = this.el.querySelector('[data-action="add"]');
            if (addBtn) addBtn.onclick = () => this._openEditor(null);

            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;

            if (this._schedules.length === 0) {
                listSlot.innerHTML = '<div class="snw-empty" style="text-align:center;padding:32px;color:var(--snw-text-dim,#8b949e);">아직 스케줄이 없습니다</div>';
                return;
            }

            this._schedules.forEach(sch => {
                listSlot.appendChild(this._renderScheduleCard(sch));
            });
        }

        _renderScheduleCard(sch) {
            const card = document.createElement('div');
            card.className = 'snw-schedule-item' + (sch.enabled ? '' : ' is-disabled');

            const profile = this._profiles.find(p => p.profileId === sch.profileId);
            const profileName = profile ? profile.name : '(삭제된 프로필)';
            const profileMissing = !profile;

            const days = (sch.period && sch.period.days) || [0,0,0,0,0,0,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
            const daysStr = days.map((d, i) => d ? dayNames[i] : '·').join(' ');

            const startTime = (sch.period && sch.period.startTime) || '00:00';
            const endTime   = (sch.period && sch.period.endTime)   || '23:59';

            card.innerHTML = `
                <div class="snw-schedule-item__head">
                    <label class="snw-switch">
                        <input type="checkbox" data-action="toggle" ${sch.enabled ? 'checked' : ''}>
                        <span class="snw-switch__slider"></span>
                    </label>
                    <span class="snw-schedule-item__name">${SNW.DomUtil ? SNW.DomUtil.escape(sch.name) : sch.name}</span>
                    <button type="button" class="snw-icon-btn" data-action="edit" title="편집">✏️</button>
                    <button type="button" class="snw-icon-btn snw-icon-btn--danger" data-action="delete" title="삭제">🗑</button>
                </div>
                <div class="snw-schedule-item__time">
                    ⏰ ${startTime} ~ ${endTime}
                </div>
                <div class="snw-schedule-item__days">${daysStr}</div>
                <div class="snw-schedule-item__ref ${profileMissing ? 'is-missing' : ''}">
                    🎵 ${SNW.DomUtil ? SNW.DomUtil.escape(profileName) : profileName}
                </div>`;

            // 액션 바인딩
            const toggleInput = card.querySelector('[data-action="toggle"]');
            if (toggleInput) {
                toggleInput.addEventListener('change', async (e) => {
                    await this._onToggle(sch, e.target.checked);
                });
            }

            const editBtn = card.querySelector('[data-action="edit"]');
            if (editBtn) editBtn.onclick = () => this._openEditor(sch);

            const delBtn = card.querySelector('[data-action="delete"]');
            if (delBtn) delBtn.onclick = () => this._onDelete(sch);

            return card;
        }

        _openEditor(sch) {
            const isEdit = !!sch;
            let isSimpleMode = isEdit ? (sch.name && sch.name.startsWith('[간단]')) : true;
            let editedRule = (isEdit && sch.rule) ? JSON.parse(JSON.stringify(sch.rule)) : null;
            const isCustom = isEdit && sch.ruleOverride === true;
            const days = sch ? ((sch.period && sch.period.days) || [0,0,0,0,0,0,0]) : [0,1,1,1,1,1,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

            const PRESETS = [
                { code: 'OCEAN', name: '바다 바람 (OCEAN)' },
                { code: 'COUNTRY_BREEZE', name: '산들바람 (COUNTRY_BREEZE)' },
                { code: 'MEDITERRANEAN', name: '지중해 (MEDITERRANEAN)' },
                { code: 'MOUNTAIN', name: '고산 계곡 (MOUNTAIN)' },
                { code: 'PLAINS', name: '들판 바람 (PLAINS)' },
                { code: 'HARBOR_BREEZE', name: '항구 바람 (HARBOR_BREEZE)' },
                { code: 'FOREST_CANOPY', name: '숲속 그늘 (FOREST_CANOPY)' },
                { code: 'URBAN_SUNSET', name: '도시 노을 (URBAN_SUNSET)' },
                { code: 'TROPICAL_RAIN', name: '열대 우림 (TROPICAL_RAIN)' },
                { code: 'DESERT_NIGHT', name: '사막 밤 (DESERT_NIGHT)' },
            ];

            const STYLES = [
                { code: 'BALANCE', name: '⚖️ 균형 (BALANCE)' },
                { code: 'ACTIVE',  name: '⚡ 활력 (ACTIVE)' },
                { code: 'FOCUS',   name: '🎯 집중 (FOCUS)' },
                { code: 'RELAX',   name: '🍃 휴식 (RELAX)' },
                { code: 'SLEEP',   name: '🌙 수면 (SLEEP)' },
            ];

            const content = document.createElement('div');
            content.className = 'snw-schedule-editor';
            content.innerHTML = `
                <div class="snw-form">
                    <!-- [Stage 10] 모드 토글 (간단 / 고급) -->
                    <div class="snw-mode-toggle" style="display:flex;gap:8px;margin-bottom:14px;">
                        <button type="button" class="snw-btn ${isSimpleMode ? 'snw-btn-primary' : ''}" data-mode="simple" style="flex:1;">
                            ⚡ ${SNW.I18n.t('schedule.modeSimple')}
                        </button>
                        <button type="button" class="snw-btn ${!isSimpleMode ? 'snw-btn-primary' : ''}" data-mode="advanced" style="flex:1;">
                            🎼 ${SNW.I18n.t('schedule.modeAdvanced')}
                        </button>
                    </div>

                    <div class="snw-form-row" style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">스케줄 이름</label>
                        <input type="text" data-field="name" maxlength="32" class="snw-input"
                               style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit ? (SNW.DomUtil ? SNW.DomUtil.escape(sch.name) : sch.name) : '새 스케줄'}">
                    </div>

                    <div class="snw-form-row" style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;">요일</label>
                        <div class="snw-day-picker">
                            ${dayNames.map((d, i) =>
                                `<label class="snw-day-chip ${days[i] ? 'is-active' : ''}">
                                    <input type="checkbox" data-day="${i}" ${days[i] ? 'checked' : ''}>
                                    <span>${d}</span>
                                </label>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="snw-form-row snw-form-row--inline" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                        <label style="font-weight:600;font-size:13px;">시작</label>
                        <input type="time" data-field="startTime" class="snw-input"
                               style="padding:6px 10px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit && sch.period ? sch.period.startTime : '08:00'}">
                        <label style="font-weight:600;font-size:13px;">종료</label>
                        <input type="time" data-field="endTime" class="snw-input"
                               style="padding:6px 10px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit && sch.period ? sch.period.endTime : '20:00'}">
                    </div>

                    <!-- 간단 모드 컨테이너 -->
                    <div id="simple-mode-section" style="display:${isSimpleMode ? 'block' : 'none'};background:var(--snw-surface-2,#12161c);padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div class="snw-form-row" style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">바람 프리셋 선택</label>
                            <select id="simple-preset-select" style="width:100%;padding:8px;background:var(--snw-surface-1,#1f242c);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                ${PRESETS.map(p => `<option value="${p.code}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="snw-form-row">
                            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">바람 스타일 선택</label>
                            <select id="simple-style-select" style="width:100%;padding:8px;background:var(--snw-surface-1,#1f242c);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                ${STYLES.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- 고급 모드 컨테이너 -->
                    <div id="advanced-mode-section" style="display:${!isSimpleMode ? 'block' : 'none'};">
                        <h3 class="snw-form-section" style="font-size:14px;margin:16px 0 8px 0;font-weight:600;">🎵 실행할 플레이리스트</h3>
                        <div class="snw-profile-picker">
                            ${this._profiles.map(p => `
                                <label class="snw-profile-radio ${isEdit && sch.profileId === p.profileId ? 'is-selected' : ''}">
                                    <input type="radio" name="profile" value="${p.profileId}"
                                           ${isEdit && sch.profileId === p.profileId ? 'checked' : ''}>
                                    <div class="snw-profile-radio__content">
                                        <div class="snw-profile-radio__name">📋 ${SNW.DomUtil ? SNW.DomUtil.escape(p.name) : p.name}</div>
                                        <div class="snw-profile-radio__meta">
                                            ${p.stepCount || (p.steps ? p.steps.length : 0)}개 Step · ${this._fmtTotal(p)}
                                        </div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>

                        <div class="snw-schedule-editor__hint" style="margin-top:12px;">
                            💡 새 프로필은 <b>Studio 탭</b>에서 작곡 후 선택할 수 있습니다.
                        </div>
                    </div>

                    <!-- [Stage 5] 규칙 상속/커스텀 -->
                    <div style="margin-top:16px;padding:12px;background:var(--snw-surface-2,#12161c);border-radius:6px;">
                        <div style="font-weight:600;font-size:13px;margin-bottom:8px;">⚙ 자동 정지 규칙</div>
                        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                            <input type="radio" name="ruleMode" value="inherit" ${!isCustom ? 'checked' : ''}>
                            <span>${SNW.I18n.t('auto.rules.inheritHint')} (프로파일 규칙 사용)</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:6px;cursor:pointer;">
                            <input type="radio" name="ruleMode" value="custom" ${isCustom ? 'checked' : ''}>
                            <span>${SNW.I18n.t('auto.rules.customHint')} (스케줄 자체 규칙)</span>
                        </label>
                        <div id="custom-rule-action" style="margin-top:8px;display:${isCustom ? 'block' : 'none'};">
                            <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" style="padding:4px 10px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                                ⚙ 커스텀 규칙 편집
                            </button>
                        </div>
                    </div>
                </div>`;

            // 모드 토글 이벤트
            const btnSimple = content.querySelector('[data-mode="simple"]');
            const btnAdvanced = content.querySelector('[data-mode="advanced"]');
            const secSimple = content.querySelector('#simple-mode-section');
            const secAdvanced = content.querySelector('#advanced-mode-section');

            btnSimple.onclick = () => {
                isSimpleMode = true;
                btnSimple.classList.add('snw-btn-primary');
                btnAdvanced.classList.remove('snw-btn-primary');
                secSimple.style.display = 'block';
                secAdvanced.style.display = 'none';
            };
            btnAdvanced.onclick = () => {
                isSimpleMode = false;
                btnAdvanced.classList.add('snw-btn-primary');
                btnSimple.classList.remove('snw-btn-primary');
                secSimple.style.display = 'none';
                secAdvanced.style.display = 'block';
            };

            // 요일 칩 토글
            content.querySelectorAll('.snw-day-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const input = chip.querySelector('input');
                    input.checked = !input.checked;
                    chip.classList.toggle('is-active', input.checked);
                });
            });

            // 프로필 라디오 선택 표시
            content.querySelectorAll('.snw-profile-radio').forEach(radio => {
                radio.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const input = radio.querySelector('input');
                    input.checked = true;
                    content.querySelectorAll('.snw-profile-radio').forEach(r =>
                        r.classList.toggle('is-selected', r === radio));
                });
            });

            // 규칙 상속/커스텀 라디오 및 편집기 바인딩
            const ruleRadios = content.querySelectorAll('input[name="ruleMode"]');
            const customRuleAction = content.querySelector('#custom-rule-action');
            const btnEditRule = content.querySelector('[data-action="edit-rule"]');

            ruleRadios.forEach(r => {
                r.addEventListener('change', () => {
                    const custom = content.querySelector('input[name="ruleMode"]:checked')?.value === 'custom';
                    if (customRuleAction) customRuleAction.style.display = custom ? 'block' : 'none';
                });
            });

            if (btnEditRule) {
                btnEditRule.onclick = async () => {
                    if (!SNW.UI || !SNW.UI.ruleEditor) return;
                    const res = await SNW.UI.ruleEditor.showModal(editedRule || {}, {
                        title: '스케줄 커스텀 규칙',
                    });
                    if (res) {
                        editedRule = res;
                        if (SNW.ToastUtil) SNW.ToastUtil.info('커스텀 규칙이 설정되었습니다 (스케줄 저장 시 반영)');
                    }
                };
            }

            SNW.UI.modal(
                isEdit ? '스케줄 편집' : '새 스케줄',
                content,
                async () => {
                    const nameEl  = content.querySelector('[data-field="name"]');
                    const startEl = content.querySelector('[data-field="startTime"]');
                    const endEl   = content.querySelector('[data-field="endTime"]');

                    if (!nameEl.value.trim()) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('이름을 입력하세요');
                        return false;
                    }
                    if (startEl.value === endEl.value) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('시작 시각과 종료 시각이 같을 수 없습니다');
                        return false;
                    }

                    let profileId = 0;
                    if (isSimpleMode) {
                        const selPreset = content.querySelector('#simple-preset-select').value;
                        const selStyle = content.querySelector('#simple-style-select').value;
                        
                        // [Stage 10] 간단 모드 단일 Step 프로필 자동 생성
                        const autoProfile = {
                            profileNo: (Date.now() % 65530) + 1,
                            name: `[간단] ${selPreset}`,
                            enabled: true,
                            repeatSegments: false,
                            repeatCount: 0,
                            steps: [{
                                stepNo: 10,
                                durationMin: 120,
                                type: 'PRESET',
                                presetCode: selPreset,
                                styleCode: selStyle,
                                override: { enabled: false }
                            }],
                            autoOff: { timer: { enabled: false }, offTime: { enabled: false }, offTemp: { enabled: false } },
                            motion: { pir: { enabled: false } }
                        };
                        try {
                            if (SNW.Api && typeof SNW.Api.addProfile === 'function') {
                                const pRes = await SNW.Api.addProfile(autoProfile);
                                profileId = (pRes && pRes.profileId) ? pRes.profileId : autoProfile.profileNo;
                            }
                        } catch (pe) {
                            SNW.LogUtil.warn('[Schedule] Auto profile create fallback', pe);
                            profileId = autoProfile.profileNo;
                        }
                    } else {
                        const selectedRadio = content.querySelector('input[name="profile"]:checked');
                        if (!selectedRadio) {
                            if (SNW.ToastUtil) SNW.ToastUtil.error('실행할 플레이리스트를 선택하세요');
                            return false;
                        }
                        profileId = Number(selectedRadio.value);
                    }

                    const schNo = isEdit ? sch.schNo : (Date.now() % 65535) + 1;
                    const ruleOverride = content.querySelector('input[name="ruleMode"]:checked')?.value === 'custom';
                    const schedule = {
                        schNo,
                        name: nameEl.value.trim(),
                        enabled: isEdit ? sch.enabled : true,
                        period: {
                            days: Array.from(content.querySelectorAll('[data-day]')).map(cb => cb.checked ? 1 : 0),
                            startTime: startEl.value,
                            endTime: endEl.value,
                        },
                        profileId,
                        ruleOverride,
                        rule: editedRule || (isEdit && sch.rule ? sch.rule : {}),
                    };

                    try {
                        if (isEdit) {
                            await SNW.Api.updateSchedule(sch.schId, schedule);
                        } else {
                            await SNW.Api.addSchedule(schedule);
                        }
                        if (SNW.ToastUtil) SNW.ToastUtil.success(isEdit ? '스케줄 업데이트' : SNW.I18n.t('schedule.simpleSaved'));
                        await this.mount();
                        return true;
                    } catch (e) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
                        return false;
                    }
                },
                null,
                { width: '480px' }
            );
        }

        async _onToggle(sch, enabled) {
            const newSch = { ...sch, enabled };
            try {
                await SNW.Api.updateSchedule(sch.schId, newSch);
                sch.enabled = enabled;
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '토글 실패');
                await this.mount();
            }
        }

        async _onDelete(sch) {
            if (!confirm(`"${sch.name}" 스케줄을 삭제하시겠습니까?`)) return;
            try {
                await SNW.Api.deleteSchedule(sch.schId);
                if (SNW.ToastUtil) SNW.ToastUtil.success('삭제 완료');
                await this.mount();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '삭제 실패');
            }
        }

        _fmtTotal(profile) {
            if (!profile.steps) return '0분';
            let total = 0;
            for (const s of profile.steps) total += Number(s.durationMin) || 0;
            if (profile.repeatSegments && profile.repeatCount > 0) total *= profile.repeatCount;
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };
})(window.SNW);



/* ---- 294.timer_panel.js (21977 bytes) ---- */
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

/* ---- 310.page.rules.js (6615 bytes) ---- */
// =========================================================
// app/310.page.rules.js — 규칙 관리 페이지 (자동화 탭)
// Layer 4 (Page) — 프로파일/스케줄 규칙 통합 관리
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Rules = class Rules {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._schedules = [];
        }

        async mount() {
            this.el.innerHTML = `
                <section class="snw-card">
                    <h2 data-i18n="rule.title">⚙ 규칙 관리</h2>
                    <div class="snw-rules-sections" data-slot="sections">
                        <div class="snw-loading">로딩 중...</div>
                    </div>
                </section>`;
            SNW.I18n.applyTo(this.el);

            await this._load();
            this._render();

            // 이벤트 위임
            SNW.DomUtil.delegate(this.el, '[data-action="edit-rule"]', 'click', (e, btn) => {
                const scope = btn.getAttribute('data-scope');
                const idx = Number(btn.getAttribute('data-idx'));
                this._onEditRule(scope, idx);
            });
        }

        unmount() { this._active = false; }

        async _load() {
            try {
                const [pData, sData] = await Promise.all([
                    SNW.Api.listProfiles ? SNW.Api.listProfiles() : null,
                    SNW.Api.listSchedules ? SNW.Api.listSchedules() : null,
                ]);
                const pRoot = (pData && pData.userProfiles) ? pData.userProfiles : pData;
                this._profiles = (pRoot && pRoot.profiles) || [];
                const sRoot = (sData && sData.schedules) ? sData.schedules : sData;
                this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Rules] load fail', e);
            }
        }

        _ruleSummary(rule) {
            if (!rule) return '미설정';
            const items = [];
            if (rule.timer && rule.timer.enabled)     items.push(`⏱️${rule.timer.minutes}m`);
            if (rule.offTime && rule.offTime.enabled) items.push(`⏰${rule.offTime.time}`);
            if (rule.tempLow && rule.tempLow.enabled) items.push(`🌡️${rule.tempLow.mode}`);
            if (rule.diLow && rule.diLow.enabled)     items.push(`☀️${rule.diLow.mode}`);
            if (rule.pirPause && rule.pirPause.enabled) items.push(`👤${rule.pirPause.holdSec}s`);
            if (rule.smartComfort && rule.smartComfort.enabled) items.push(`✨auto`);
            return items.length > 0 ? items.join(' · ') : '미설정';
        }

        _render() {
            const slot = this.el.querySelector('[data-slot="sections"]');
            if (!slot) return;

            const t = (k) => (SNW.I18n ? SNW.I18n.t(k) : k);
            const esc = (v) => (SNW.DomUtil ? SNW.DomUtil.escape(v) : String(v));

            slot.innerHTML = `
                <div class="snw-rules-section">
                    <h3>${t('auto.rules.profileSection')}</h3>
                    ${this._profiles.length === 0
                        ? '<div class="snw-empty">프로파일 없음</div>'
                        : this._profiles.map((p, i) => `
                            <div class="snw-rules-item">
                                <div class="snw-rules-item__name">📋 ${esc(p.name)}</div>
                                <div class="snw-rules-item__summary">${this._ruleSummary(p.rule)}</div>
                                <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" data-scope="profile" data-idx="${i}">편집 →</button>
                            </div>
                        `).join('')}
                </div>

                <div class="snw-rules-section">
                    <h3>${t('auto.rules.scheduleSection')}</h3>
                    ${this._schedules.length === 0
                        ? '<div class="snw-empty">스케줄 없음</div>'
                        : this._schedules.map((s, i) => `
                            <div class="snw-rules-item">
                                <div class="snw-rules-item__name">📅 ${esc(s.name)}</div>
                                <div class="snw-rules-item__summary">
                                    ${s.ruleOverride
                                        ? this._ruleSummary(s.rule)
                                        : t('auto.rules.inheritHint')}
                                </div>
                                <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" data-scope="schedule" data-idx="${i}">편집 →</button>
                            </div>
                        `).join('')}
                </div>
            `;
        }

        async _onEditRule(scope, idx) {
            let current = null;
            let saveFn = null;

            if (scope === 'profile') {
                const p = this._profiles[idx];
                current = p.rule;
                saveFn = async (newRule) => {
                    p.rule = newRule;
                    if (SNW.Api && SNW.Api.updateProfile) {
                        await SNW.Api.updateProfile(p.profileId, { profile: p });
                        await SNW.Api.saveConfig();
                    }
                };
            } else if (scope === 'schedule') {
                const s = this._schedules[idx];
                current = s.rule;
                saveFn = async (newRule) => {
                    s.ruleOverride = true;
                    s.rule = newRule;
                    if (SNW.Api && SNW.Api.updateSchedule) {
                        await SNW.Api.updateSchedule(s.schId, s);
                        await SNW.Api.saveConfig();
                    }
                };
            }

            if (!SNW.UI.ruleEditor) return;

            const newRule = await SNW.UI.ruleEditor.showModal(current);
            if (!newRule) return;

            try {
                await saveFn(newRule);
                if (SNW.ToastUtil) SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                await this._load();
                this._render();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
            }
        }
    };
})(window.SNW);



/* ---- 998.onboarding.js (10532 bytes) ---- */
// =========================================================
// 998.onboarding.js — 첫 방문 온보딩 (4단계)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    const LS_KEY = 'snw.onboarded';

    SNW.Onboarding = {
        async start() {
            // 이미 완료
            if (localStorage.getItem(LS_KEY) === '1') return;

            // =========================================================
            // 1) 언어
            // =========================================================
            const lang = await this._stepLang();
            if (lang && SNW.I18n && typeof SNW.I18n.setLang === 'function') {
                SNW.I18n.setLang(lang);
            }

            // =========================================================
            // 2) WiFi 안내 (이미 연결됨 가정)
            // =========================================================
            await this._stepWifi();
            await new Promise(r => setTimeout(r, 300));

            // =========================================================
            // 3) 첫 바람 선택 (큐레이션 3개)
            // =========================================================
            const choice = await this._stepFirstBreeze();

            // =========================================================
            // 4) 지금 시작?
            // =========================================================
            if (choice) {
                const startNow = await this._stepStartNow(choice);
                if (startNow && SNW.Api) {
                    try {
                        if (typeof SNW.Api.startPreset === 'function') {
                            await SNW.Api.startPreset(choice.presetCode, choice.styleCode);
                        } else if (typeof SNW.Api.startSession === 'function') {
                            await SNW.Api.startSession('PRESET', {
                                presetCode: choice.presetCode,
                                styleCode: choice.styleCode,
                            });
                        }
                    } catch (e) {
                        if (SNW.LogUtil && typeof SNW.LogUtil.warn === 'function') {
                            SNW.LogUtil.warn('onboarding start failed', e);
                        }
                    }
                }
            }

            // 완료
            localStorage.setItem(LS_KEY, '1');
        },

        // =========================================================
        // 1) 언어 선택
        // =========================================================
        _stepLang() {
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">🌿</div>
                <h2>Smart Nature Wind</h2>
                <p class="snw-onboarding-desc">
                    자연의 바람을 그대로 담은 스마트 선풍기<br>
                    A smart fan that recreates nature's breeze
                </p>
                <div class="snw-onboarding-choices">
                    <button type="button" class="snw-onboarding-choice" data-lang="ko">
                        <span class="snw-onboarding-choice__icon">🇰🇷</span>
                        <span>한국어</span>
                    </button>
                    <button type="button" class="snw-onboarding-choice" data-lang="en">
                        <span class="snw-onboarding-choice__icon">🇬🇧</span>
                        <span>English</span>
                    </button>
                </div>
            `;

            return new Promise(resolve => {
                let modalRef = null;
                content.querySelectorAll('[data-lang]').forEach(btn => {
                    btn.onclick = () => {
                        resolve(btn.getAttribute('data-lang'));
                        if (modalRef && typeof modalRef.close === 'function') {
                            modalRef.close();
                        }
                    };
                });
                modalRef = SNW.UI.modal('환영합니다 / Welcome', content, null, null,
                    { hideOk: true, hideCancel: true, width: '440px' });
            });
        },

        // =========================================================
        // 2) WiFi 안내
        // =========================================================
        _stepWifi() {
            const t = (k, fb) => (SNW.I18n && typeof SNW.I18n.t === 'function' ? SNW.I18n.t(k) : fb);
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">📶</div>
                <h2>${t('onboarding.wifiTitle', 'Wi-Fi 연결 안내')}</h2>
                <p class="snw-onboarding-desc">
                    ${t('onboarding.wifiDesc', 'NatureWind AP에 연결되었거나 홈 Wi-Fi에 정상 연결되었습니다.')}
                </p>
                <div class="snw-onboarding-info">
                    <div><b>SSID:</b> NatureWind</div>
                    <div><b>Password:</b> 2540</div>
                    <div><b>URL:</b> http://192.168.4.1</div>
                </div>
            `;

            return new Promise(resolve => {
                SNW.UI.modal(
                    t('onboarding.step2', '단계 2: 네트워크 안내'),
                    content,
                    () => { resolve(); return true; },
                    null,
                    { okLabel: t('onboarding.connected', '확인 완료'), hideCancel: true, width: '440px' }
                );
            });
        },

        // =========================================================
        // 3) 첫 바람 선택
        // =========================================================
        _stepFirstBreeze() {
            const t = (k, fb) => (SNW.I18n && typeof SNW.I18n.t === 'function' ? SNW.I18n.t(k) : fb);
            const choices = [
                {
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    icon: '🌊',
                    title: t('onboarding.breeze.ocean', '시원한 바닷바람'),
                    desc: t('onboarding.breeze.oceanDesc', '탁 트인 해안가의 상쾌하고 청량한 리듬'),
                },
                {
                    presetCode: 'FOREST_CANOPY', styleCode: 'RELAX',
                    icon: '🌲',
                    title: t('onboarding.breeze.forest', '숲속 산들바람'),
                    desc: t('onboarding.breeze.forestDesc', '나뭇잎을 부드럽게 스치는 편안한 휴식'),
                },
                {
                    presetCode: 'MOUNTAIN', styleCode: 'ACTIVE',
                    icon: '🏔️',
                    title: t('onboarding.breeze.mountain', '고산 능선바람'),
                    desc: t('onboarding.breeze.mountainDesc', '역동적이고 강력한 피톤치드 에너자이징'),
                },
            ];

            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">🍃</div>
                <h2>${t('onboarding.firstBreezeTitle', '처음 만나는 바람')}</h2>
                <p class="snw-onboarding-desc">${t('onboarding.firstBreezeDesc', '원하시는 기분의 자연 바람을 선택해보세요.')}</p>
                <div class="snw-onboarding-breeze-choices">
                    ${choices.map((c, i) => `
                        <button type="button" class="snw-breeze-choice" data-idx="${i}">
                            <div class="snw-breeze-choice__icon">${c.icon}</div>
                            <div class="snw-breeze-choice__title">${c.title}</div>
                            <div class="snw-breeze-choice__desc">${c.desc}</div>
                        </button>
                    `).join('')}
                </div>
            `;

            return new Promise(resolve => {
                let modalRef = null;
                content.querySelectorAll('[data-idx]').forEach(btn => {
                    btn.onclick = () => {
                        const idx = Number(btn.getAttribute('data-idx'));
                        resolve(choices[idx]);
                        if (modalRef && typeof modalRef.close === 'function') {
                            modalRef.close();
                        }
                    };
                });
                modalRef = SNW.UI.modal(
                    t('onboarding.step3', '단계 3: 첫 바람 선택'),
                    content, null, null,
                    { hideOk: true, hideCancel: true, width: '480px' }
                );
            });
        },

        // =========================================================
        // 4) 지금 시작?
        // =========================================================
        _stepStartNow(choice) {
            const t = (k, fb, vars) => {
                if (SNW.I18n && typeof SNW.I18n.t === 'function') {
                    return SNW.I18n.t(k, vars);
                }
                return fb;
            };
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">${choice.icon || '🍃'}</div>
                <h2>${t('onboarding.startNowTitle', '바람 시작하기')}</h2>
                <p class="snw-onboarding-desc">
                    ${t('onboarding.startNowDesc', `선택하신 '${choice.title}'을(를) 지금 즉시 재생할까요?`, { name: choice.title })}
                </p>
            `;

            return new Promise(resolve => {
                SNW.UI.modal(
                    t('onboarding.step4', '단계 4: 시작 확인'),
                    content,
                    () => { resolve(true); return true; },
                    () => { resolve(false); },
                    {
                        okLabel: t('onboarding.startNow', '지금 시작'),
                        cancelLabel: t('onboarding.later', '나중에'),
                        width: '400px',
                    }
                );
            });
        },
    };
})(window.SNW);



/* ---- 999.app.js (15425 bytes) ---- */
// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
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

        // ======================================================
        // [N-18] 리스너 참조 보관 → close()에서 반드시 제거 (이벤트 누수 방지)
        // ======================================================
        let closed = false;
        let _onEsc = null;
        let _onOverlayClick = null;

        const close = (confirmed) => {
            if (closed) return;
            closed = true;

            if (_onEsc) document.removeEventListener('keydown', _onEsc);
            if (_onOverlayClick) overlay.removeEventListener('click', _onOverlayClick);
            _onEsc = null;
            _onOverlayClick = null;

            overlay.classList.remove('is-open');
            setTimeout(() => {
                overlay.innerHTML = '';
                overlay.style.display = 'none';
                if (!confirmed && typeof onCancel === 'function') {
                    try { onCancel(); } catch (e) { }
                }
            }, 150);
        };

        _onEsc = (e) => { if (e.key === 'Escape') close(false); };
        document.addEventListener('keydown', _onEsc);

        _onOverlayClick = (e) => { if (e.target === overlay) close(false); };
        overlay.addEventListener('click', _onOverlayClick);

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
                } catch (e) { } finally { btnOk.disabled = false; }
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
        let reconnectBanner = document.getElementById('snw-reconnect-overlay');

        const render = (conn) => {
            const isConn = (conn === 'connected');
            if (dot) {
                dot.className = 'snw-status-dot snw-status-dot--' + conn;
                dot.title = SNW.I18n.t('footer.' + conn);
            }
            if (footerStat) footerStat.textContent = SNW.I18n.t('footer.' + conn);

            // [Stage 5] wsConnected === false 재연결 오버레이
            if (!isConn && !window.SNW_OFFLINE) {
                if (!reconnectBanner) {
                    reconnectBanner = document.createElement('div');
                    reconnectBanner.id = 'snw-reconnect-overlay';
                    reconnectBanner.className = 'snw-reconnect-overlay';
                    reconnectBanner.innerHTML = `
                        <div class="snw-reconnect-box">
                            <span class="snw-spinner"></span>
                            <span>${SNW.I18n.t('reconnect.body')}</span>
                        </div>
                    `;
                    document.body.appendChild(reconnectBanner);
                }
                reconnectBanner.style.display = 'flex';
            } else {
                if (reconnectBanner) reconnectBanner.style.display = 'none';
            }
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

        // 데스크톱 환경(≥1024px)에서는 기본으로 사이드바 열림 상태 활성화 (☰ 버튼으로 언제든지 토글 가능)
        if (window.innerWidth >= 1024) {
            document.body.classList.add('snw-sidebar-open');
        }

        // 1. ☰ 버튼 토글 (모든 해상도 지원)
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

        // 3. 사이드바 내부 링크 클릭 시 닫기 (모바일/태블릿에서만)
        sidebar.onclick = (e) => {
            if (e.target.closest('a') && window.innerWidth < 1024) {
                document.body.classList.remove('snw-sidebar-open');
            }
        };

        // 4. 외부 영역 클릭 시 닫기 (모바일/태블릿에서만)
        document.addEventListener('click', (e) => {
            if (window.innerWidth >= 1024) return;
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

    window.SNW_BOOT = async function () {
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
                    // [참고] ensureApi()는 998.offline_0203.js의 DOMContentLoaded 리스너에서 실행됨.
                    //  - SNW_BOOT은 DOMContentLoaded 이후이므로 이 시점에 오프라인 mock이 이미 적용됨
                    //  - 중복 호출 제거 (040.api.js 로드 후 재정의는 DOMContentLoaded에서 보장)
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
            if (SNW.NowPlaying && typeof SNW.NowPlaying.init === 'function') {
                SNW.NowPlaying.init();
            }
            SNW.Router.init();
            SNW.LogUtil.info('App bootstrap complete');

            // [Stage 7] 첫 방문 온보딩 4단계
            setTimeout(() => {
                if (SNW.Onboarding && typeof SNW.Onboarding.start === 'function') {
                    SNW.Onboarding.start();
                }
            }, 500);
        } catch (e) {
            SNW.LogUtil.error('bootstrap failed', e);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.SNW_BOOT(); });
    } else {
        window.SNW_BOOT();
    }

    // [U-B8] 야간 자동 감광
    function _applyNightMode() {
        const h = new Date().getHours();
        const isNight = (h >= 22 || h < 6);
        document.body.classList.toggle('snw-night-mode', isNight);
    }
    _applyNightMode();
    setInterval(_applyNightMode, 60000);

})(window.SNW);


/* ---- 999a.nowplaying.js (24562 bytes) ---- */
// =========================================================
// 999a.nowplaying.js — 전역 Now Playing Bar (Stage 5 UX 완성형)
// Layer 3 (애플리케이션 전역 컴포넌트)
//  - ENV_PAUSED 3초 호흡 애니메이션 + [▶ 지금 재개]
//  - AUTO 배지 (✨ / 🎯)
//  - 최단 종료 시각 표기 + autoSwitchReason 1줄 병기
//  - btnStop 상시 노출 (ENV_PAUSED 중에도 완전 정지 허용)
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

    let _pauseBreathingId = null;
    let _pauseBreathingPhase = 0;

    function $(sel, root) { return (root || document).querySelector(sel); }

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
        // [Stage 5] ENV_PAUSED(7) 상태일 때는 세션이 pause 되어 있어도 바 상시 노출
        if (ctl && ctl.stateCode === 7) return true;

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

            barEl.title.textContent = `⏸ ${SNW.I18n.t('fsm.envPaused')}`;
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
        let title = '';
        if (typeName === 'AUTO_FULL' || type === 4) {
            title = `✨ ${SNW.I18n.t('session.autoFull')}`;
        } else if (typeName === 'AUTO_SELECT' || type === 5) {
            title = `🎯 ${SNW.I18n.t('session.autoSelect')}`;
        } else if (type === 1) {
            title = s.profileName || (s.profileNo ? `프로필 #${s.profileNo}` : '플레이리스트');
        } else if (type === 2) {
            title = `${s.presetCode || '자연풍'} · ${s.styleCode || '표준'}`;
        } else if (type === 3) {
            title = `일반 선풍기 (${Math.round(s.percent || 0)}%)`;
        } else {
            title = '재생 중';
        }
        barEl.title.textContent = title;

        // ─── 3. 서브 정보 & 최단 종료 시각 단일 표기 ───
        let subReason = s.autoSwitchReason ? ` · ${s.autoSwitchReason}` : '';

        // 최단 종료 시각 계산 (타이머 vs 스텝 종료)
        const timerStatus = (SNW.TimerManager && typeof SNW.TimerManager.getStatus === 'function')
            ? SNW.TimerManager.getStatus()
            : null;
        let shortestSec = null;
        if (timerStatus && timerStatus.active && timerStatus.remainMin > 0) {
            shortestSec = timerStatus.remainMin * 60;
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
            barEl.step.textContent = `${Math.round(s.percent || 0)}%${subReason}`;
            barEl.time.textContent = isPaused ? '일시정지' : (shortestSec > 0 ? formatTime(shortestSec) : '가동 중');
        } else {
            barEl.step.textContent = s.autoSwitchReason || '';
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

        // ─── 6. Timer 배지 ───
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

        // ─── 7. Auto Comfort 배지 ───
        if (barEl.autoBadge) {
            const isAuto = !!store.autoComfortEnabled || (s && (s.trigger === 3 || s.triggerName === 'AUTO_COMFORT' || type === 4 || type === 5));
            barEl.autoBadge.hidden = !isAuto;
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
        if (!s) return;
        showNowPlayingDetailsModal(s);
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
        barEl.autoBadge = $('[data-slot="np-auto-badge"]', barEl.root);
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

    // =========================================================
    // Now Playing 상세 확장 모달
    // =========================================================
    function showNowPlayingDetailsModal(s) {
        if (!SNW.UI || !SNW.UI.modal || !s) return;
        const type = parseType(s.type);
        const typeName = s.typeName || (['NONE', 'PLAYLIST', 'PRESET', 'FIXED', 'AUTO_FULL', 'AUTO_SELECT'][type] || 'NONE');
        const stateStr = (typeof s.state === 'string') ? (s.state === 'RUNNING' ? 'ACTIVE' : s.state) : (s.state === 1 ? 'PAUSED' : 'ACTIVE');
        const isPaused = (stateStr === 'PAUSED');

        let title = '';
        let typeBadge = '';
        if (typeName === 'AUTO_FULL' || type === 4) {
            title = SNW.I18n.t('session.autoFull');
            typeBadge = '✨ AI 스마트 쾌적 (100% 자율)';
        } else if (typeName === 'AUTO_SELECT' || type === 5) {
            title = SNW.I18n.t('session.autoSelect');
            typeBadge = '🎯 취향 맞춤 Auto';
        } else if (type === 1) {
            title = s.profileName || (s.profileNo ? `프로필 #${s.profileNo}` : '플레이리스트');
            typeBadge = '🎵 맞춤 바람 (플레이리스트)';
        } else if (type === 2) {
            title = `${s.presetCode || '자연풍'} · ${s.styleCode || '표준'}`;
            typeBadge = '🌿 자연풍 프리셋';
        } else if (type === 3) {
            title = `일반 선풍기 (${Math.round(s.percent || 0)}%)`;
            typeBadge = '🌀 고정 풍속';
        } else {
            title = '재생 중인 바람';
            typeBadge = '🍃 세션';
        }

        const remainSec = s.stepRemainSec || 0;
        const timeStr = isPaused
            ? `일시정지 (${formatTime(remainSec)})`
            : (remainSec > 0 ? `${formatTime(remainSec)} 남음` : '연속 가동 중');

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
                            ${isPaused ? '⏸ 일시정지' : '▶ 재생 중'}
                        </span>
                        <span>·</span>
                        <span>${timeStr}</span>
                    </div>
                </div>

                <button type="button" class="snw-btn snw-btn--full" id="np-btn-timer-link" style="justify-content:center;background:${timerActive ? 'rgba(78,168,222,0.15)' : 'var(--snw-surface-2,#12161c)'};border:1px solid ${timerActive ? 'var(--snw-info,#4ea8de)' : 'var(--snw-border,#2f3844)'};color:${timerActive ? 'var(--snw-info,#4ea8de)' : 'var(--snw-text,#e6edf3)'};">
                    ${timerText} ➔
                </button>
            </div>
        `;

        const modalRef = SNW.UI.modal(
            '🍃 바람 세션 상세',
            content,
            async () => {
                await onPauseOrResume();
                return true;
            },
            () => {
                return true;
            },
            {
                okLabel: isPaused ? '▶ 재개' : '⏸ 일시정지',
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
            if (modalRef && typeof modalRef.close === 'function') modalRef.close();
            await onStop();
        };
        content.appendChild(stopBtn);

        const timerBtn = content.querySelector('#np-btn-timer-link');
        if (timerBtn) {
            timerBtn.onclick = () => {
                if (modalRef && typeof modalRef.close === 'function') modalRef.close();
                location.hash = '/automation/timer';
            };
        }
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
        getSession
    };

})(window.SNW);


/* ---- 999b.ai-sheet.js (12481 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 999b.ai-sheet.js
 * 모듈약어 : SNW.AISheet
 * 모듈명 : Smart Nature Wind Global Floating AI Voice Sheet (FAB)
 * ------------------------------------------------------
 * 기능 요약:
 *  - 어느 화면에서나 AI 음성 제어를 호출할 수 있는 전역 플로팅 액션 버튼 (FAB)
 *  - 슬라이드업 바텀 시트 오버레이 (REST 자연어 제어 & Gemini Live 실시간 음성)
 *  - 빠른 실행 칩 (Quick chips), 실시간 발화 상태, 도구 실행 피드백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _initialized = false;
	let _visible = false;
	let _mode = 'rest'; // 'rest' | 'live'
	let _fabEl = null;
	let _sheetEl = null;
	let _history = [];

	const AISheet = {
		init() {
			if (_initialized) return;
			_initialized = true;

			_mode = localStorage.getItem('snw.ai.mode') || 'rest';

			this._renderFAB();
			this._renderSheet();
			this._bindEvents();

			// 옵션 웨이크워드 연동
			if (SNW.AIVoice && SNW.AIVoice.isSTTSupported()) {
				SNW.AIVoice.startWakeDetection({
					onWake: () => {
						this.open();
						if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n ? SNW.I18n.t('ai.voiceListening') : 'Listening...');
					}
				});
			}

			SNW.LogUtil ? SNW.LogUtil.info('[AISheet] Global AI FAB sheet initialized') : console.log('[AISheet] Initialized');
		},

		_renderFAB() {
			_fabEl = document.createElement('button');
			_fabEl.type = 'button';
			_fabEl.className = 'snw-ai-fab';
			_fabEl.setAttribute('aria-label', 'AI Assistant');
			_fabEl.innerHTML = '🎙️';
			_fabEl.style.cssText = `
				position: fixed;
				bottom: var(--snw-fab-bottom, 76px);
				right: 20px;
				width: 54px;
				height: 54px;
				border-radius: 50%;
				background: linear-gradient(135deg, #3b82f6, #8b5cf6);
				color: #ffffff;
				border: none;
				box-shadow: 0 4px 14px rgba(0,0,0,0.3), 0 0 10px rgba(59,130,246,0.5);
				font-size: 24px;
				cursor: pointer;
				z-index: var(--snw-z-fab, 990);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: bottom 0.25s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
			`;

			_fabEl.addEventListener('mouseenter', () => {
				_fabEl.style.transform = 'scale(1.08)';
			});
			_fabEl.addEventListener('mouseleave', () => {
				_fabEl.style.transform = 'scale(1)';
			});
			_fabEl.addEventListener('click', () => {
				this.toggle();
			});

			document.body.appendChild(_fabEl);
		},

		_renderSheet() {
			_sheetEl = document.createElement('div');
			_sheetEl.className = 'snw-ai-sheet-container';
			_sheetEl.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0,0,0,0.5);
				backdrop-filter: blur(4px);
				z-index: var(--snw-z-modal, 1100);
				display: none;
				opacity: 0;
				transition: opacity 0.25s ease;
				justify-content: center;
				align-items: flex-end;
			`;

			const esc = (txt) => (SNW.DomUtil ? SNW.DomUtil.escape(txt) : txt);
			const placeholderText = SNW.I18n ? SNW.I18n.t('ai.placeholder') : 'Ask anything...';
			const sendText = SNW.I18n ? SNW.I18n.t('ai.send') : 'Send';
			const titleText = SNW.I18n ? SNW.I18n.t('ai.title') : 'AI Assistant';

			_sheetEl.innerHTML = `
				<div class="snw-ai-sheet" style="
					width: 100%;
					max-width: 600px;
					max-height: 82vh;
					background: var(--snw-surface, #1e293b);
					border-top-left-radius: 20px;
					border-top-right-radius: 20px;
					box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
					display: flex;
					flex-direction: column;
					padding: 16px;
					transform: translateY(100%);
					transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
				">
					<!-- Header -->
					<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
						<div style="display:flex;align-items:center;gap:8px;">
							<span style="font-size:1.2rem;font-weight:700;">✨ ${esc(titleText)}</span>
							<span class="snw-badge snw-badge--info" data-slot="sheet-cost" style="display:none;font-size:0.75rem;"></span>
						</div>
						<button type="button" class="snw-btn snw-btn--ghost snw-btn--sm" data-action="sheet-close" style="font-size:1.2rem;line-height:1;padding:4px 8px;">✕</button>
					</div>

					<!-- Quick Chips -->
					<div style="display:flex;gap:6px;overflow-x:auto;padding:10px 0;scrollbar-width:none;">
						<button type="button" class="snw-btn snw-btn--sm" data-quick="바다 바람 틀어줘">바다 바람</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="30분 후 꺼줘">30분 후 꺼줘</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="스케줄대로 해줘">스케줄 복귀</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="팬 정지">정지</button>
					</div>

					<!-- Messages List -->
					<div data-slot="sheet-messages" style="flex:1;overflow-y:auto;min-height:180px;max-height:360px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;padding-right:4px;"></div>

					<!-- Input Bar -->
					<div style="display:flex;gap:8px;align-items:center;">
						<input type="text" data-slot="sheet-input" placeholder="${esc(placeholderText)}" style="flex:1;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.2);color:#fff;outline:none;" />
						<button type="button" class="snw-btn snw-btn--secondary" data-action="sheet-mic" title="음성 입력 (클릭 시에만 마이크가 활성화됩니다)" style="border-radius:12px;padding:10px 14px;">🎤</button>
						<button type="button" class="snw-btn snw-btn--primary" data-action="sheet-send" style="border-radius:12px;padding:10px 16px;">${esc(sendText)}</button>
					</div>
				</div>
			`;

			document.body.appendChild(_sheetEl);
		},

		_bindEvents() {
			// 바깥 영역 클릭 시 닫기
			_sheetEl.addEventListener('click', (e) => {
				if (e.target === _sheetEl) this.close();
			});

			const closeBtn = _sheetEl.querySelector('[data-action="sheet-close"]');
			if (closeBtn) closeBtn.addEventListener('click', () => this.close());

			const sendBtn = _sheetEl.querySelector('[data-action="sheet-send"]');
			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			const micBtn = _sheetEl.querySelector('[data-action="sheet-mic"]');

			if (sendBtn) sendBtn.addEventListener('click', () => this._onSend());
			if (inputEl) {
				inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this._onSend();
					}
				});
			}

			if (micBtn) {
				micBtn.addEventListener('click', () => this._onVoiceInput());
			}

			// 퀵 칩 이벤트
			const chips = _sheetEl.querySelectorAll('[data-quick]');
			chips.forEach(chip => {
				chip.addEventListener('click', () => {
					const val = chip.getAttribute('data-quick');
					if (inputEl) {
						inputEl.value = val;
						this._onSend();
					}
				});
			});
		},

		async open() {
				if (_visible) return;
				_visible = true;
				_sheetEl.style.display = 'flex';
				requestAnimationFrame(() => {
					_sheetEl.style.opacity = '1';
					const inner = _sheetEl.querySelector('.snw-ai-sheet');
					if (inner) inner.style.transform = 'translateY(0)';
				});

				if (SNW.AIClient) {
					_history = SNW.AIClient.loadHistory();
					this._renderMessages();
				}

				// 비용 상태 배지 갱신 (T-124 연동)
				this._loadCostBadge();

				const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
				if (inputEl) setTimeout(() => inputEl.focus(), 300);
			},

		async _loadCostBadge() {
				const costEl = _sheetEl ? _sheetEl.querySelector('[data-slot="sheet-cost"]') : null;
				if (!costEl || !SNW.Api || typeof SNW.Api.getAiCostStatus !== 'function') return;
				try {
					const status = await SNW.Api.getAiCostStatus();
					if (status) {
						const usedUsd = ((status.estCostUsdX1000 || 0) / 1000).toFixed(2);
						costEl.textContent = `$${usedUsd} / $0.50`;
						costEl.style.display = 'inline-block';
					}
				} catch (e) {
					costEl.style.display = 'none';
				}
			},

			close() {
				if (!_visible) return;
				_visible = false;
				_sheetEl.style.opacity = '0';
				const inner = _sheetEl.querySelector('.snw-ai-sheet');
				if (inner) inner.style.transform = 'translateY(100%)';
				setTimeout(() => {
					if (!_visible) _sheetEl.style.display = 'none';
				}, 300);
			},

			toggle() {
				if (_visible) this.close();
				else this.open();
			},

			_renderMessages() {
				const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
				if (!box) return;
				box.innerHTML = '';
				const recent = _history.slice(-10);
				for (const m of recent) {
					this._appendBubble(m.role, m.text);
				}
				box.scrollTop = box.scrollHeight;
			},

			_appendBubble(role, text) {
				const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
				if (!box) return;

				const bubble = document.createElement('div');
				const isUser = (role === 'user');
				bubble.style.cssText = `
				align-self: ${isUser ? 'flex-end' : 'flex-start'};
				max-width: 82%;
				padding: 8px 12px;
				border-radius: 12px;
				font-size: 0.92rem;
				line-height: 1.4;
				background: ${isUser ? '#3b82f6' : 'rgba(255,255,255,0.08)'};
				color: #fff;
				word-break: break-word;
			`;
				bubble.textContent = text;
				box.appendChild(bubble);
				box.scrollTop = box.scrollHeight;
			},

		async _onSend() {
				const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
				const msg = (inputEl && inputEl.value || '').trim();
				if (!msg) return;
				inputEl.value = '';

				this._appendBubble('user', msg);
				_history.push({ role: 'user', text: msg });
				if (SNW.AIClient) SNW.AIClient.saveHistory(_history);

				this._appendBubble('assistant', '🤔 ...');

				try {
					let reply = '';
					let hint = '';
					let actions = [];

					if (SNW.AIClient) {
						const res = await SNW.AIClient.send(msg, _history, {
							lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
							voiceMode: false
						});
						reply = (res && res.text) || '(no response)';
						hint = (res && res._speechHint) || reply;
						actions = (res && res.actions) || [];
					} else if (SNW.Api && SNW.Api.gemini) {
						const res = await SNW.Api.gemini({ message: msg });
						reply = (res && res.text) || '(no response)';
					}

					this._updateLastBubble(reply, actions);
					_history.push({ role: 'assistant', text: reply });
					if (SNW.AIClient) SNW.AIClient.saveHistory(_history);

					// 비용 배지 최신화
					this._loadCostBadge();

					// TTS 발화
					if (hint && SNW.AIVoice && SNW.AIVoice.isTTSSupported()) {
						SNW.AIVoice.speak(hint);
					}
				} catch (e) {
					this._updateLastBubble('❌ ' + (e.message || 'Error'));
				}
			},

			_updateLastBubble(text, actions = []) {
				const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
				if (!box) return;
				const bubbles = box.querySelectorAll('div');
				const last = bubbles[bubbles.length - 1];
				if (last) {
					let actionStr = '';
					if (actions && actions.length > 0) {
						actionStr = '\n' + actions.map(a => `✓ ${a.name}: ${a.result}`).join('\n');
					}
					last.textContent = text + actionStr;
				}
				box.scrollTop = box.scrollHeight;
			},

		async _onVoiceInput() {
				if (!SNW.AIVoice || !SNW.AIVoice.isSTTSupported()) {
					if (SNW.ToastUtil) SNW.ToastUtil.warn('Voice input not supported');
					return;
				}

				const micBtn = _sheetEl.querySelector('[data-action="sheet-mic"]');
				if (micBtn) micBtn.style.background = '#ef4444';

				try {
					const res = await SNW.AIVoice.startListening();
					if (micBtn) micBtn.style.background = '';
					if (res && res.transcript) {
						const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
						if (inputEl) {
							inputEl.value = res.transcript;
							this._onSend();
						}
					}
				} catch (e) {
					if (micBtn) micBtn.style.background = '';
				}
			}
		};

		SNW.AISheet = AISheet;

		// 앱 부팅 시 자동 초기화
		if(document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => AISheet.init());
} else {
	AISheet.init();
}

}) (window, window.SNW);


