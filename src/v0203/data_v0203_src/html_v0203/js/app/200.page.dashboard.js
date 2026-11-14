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
