// =========================================================
// 200.page.dashboard.js — SNW.Page.Dashboard
// Layer 4 (페이지 로직)
// [O-1] 전원 켜기 3중 함정 진단
// [O-2] 슬라이더 WS 덮어쓰기 방지 (낙관적 잠금)
// [O-3] 프로필 모달 취소 시 롤백
// [O-6] 프리셋 적용 WS 확인
// [O-15] 배너로 AutoOff/모션 표시
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Dashboard = class Dashboard {
        constructor(container) {
            this.el = container;
            this._unsubs = [];
            this._wsUnsubs = [];
            this._timers = [];
            this.components = {};
            this._active = true;
            this._pendingIntensity = null;
            this._pendingPreset = null;
            this._pendingPowerToggle = false;
        }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.dashboard());
            SNW.I18n.applyTo(this.el);
            
            // [C-2] 컴포넌트를 먼저 마운트 → 데이터 주입 순서 보장
            this._mountComponents();
            
            try {
                const [stateData, profileData] = await Promise.all([
                    SNW.Api.getState(),
                    SNW.Api.listWindProfiles().catch(() => null)
                ]);
                if (!this._active) return;
                this._applyInitialState(stateData);
                if (profileData) {
                    this._profileData = profileData;
                    this._applyPresetList(profileData);
                }
            } catch (e) {
                if (this._active) SNW.LogUtil.warn('[Dashboard] 초기 로드 실패', e);
            }
            
            const onLangChange = () => {
                if (this._active && this._profileData) {
                    this._applyPresetList(this._profileData);
                }
            };
            document.addEventListener('snw:langchange', onLangChange);
            this._unsubs.push(() => document.removeEventListener('snw:langchange', onLangChange));

            this._bindStore();
            this._bindModeSwitch();
            this._startClock();
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
            this._timers.forEach(id => { clearInterval(id); clearTimeout(id); });
            this._unsubs = [];
            this._wsUnsubs = [];
            this._timers = [];
            // [O-15] 페이지 이탈 시 배너 정리
            if (SNW.Banner) SNW.Banner.hide();
        }
        
        _applyInitialState(data) {
            if (!data) return;
            const ctl = data.control || null;
            const sim = data.sim || null;
            SNW.Store.set({
                control: ctl,
                sim,
                time: ctl && ctl.time,
                system: ctl && ctl.system,
                fsmState: (ctl && ctl.stateCode != null) ? ctl.stateCode : 0,
                fsmReason: (ctl && ctl.reasonCode != null) ? ctl.reasonCode : 0,
                lastUpdateMs: Date.now()
            });
        }
        
        _applyPresetList(profileData) {
            const presets = (profileData && profileData.windDict && profileData.windDict.presets) || [];
            const order = SNW.C.PRESET_DISPLAY_ORDER;
            const indexed = presets.map(p => ({ p, i: order.indexOf(p.code) }));
            indexed.sort((a, b) => {
                const ai = a.i < 0 ? 9999 : a.i;
                const bi = b.i < 0 ? 9999 : b.i;
                return ai - bi;
            });
            const items = indexed.map(({ p }) => ({
                code: p.code,
                name: SNW.I18n.t('preset.' + p.code) || p.name || p.code
            }));
            if (this.components.presets) this.components.presets.setItems(items);
        }
        
        _mountComponents() {
            const q = sel => this.el.querySelector(sel);
            this.components.badge = SNW.UI.stateBadge(q('[data-slot="badge"]'));
            this.components.gauge = SNW.UI.gauge(q('[data-slot="gauge"]'));
            this.components.sensors = SNW.UI.sensorCards(q('[data-slot="sensors"]'));
            this.components.toggle = SNW.UI.toggle({
                root: q('[data-slot="power"]'),
                on: false,
                onToggle: next => this._onPowerToggle(next)
            });
            this.components.sliderIntensity = SNW.UI.slider({
                root: q('[data-slot="intensity"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.intensity,
                label: SNW.I18n.t('dashboard.intensityLabel'),
                unit: '%',
                feedbackFn: val => (SNW.Feedback ? SNW.Feedback.getIntensityGuide(val) : null),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onIntensityChange(v)
            });
            this.components.sliderVariability = SNW.UI.slider({
                root: q('[data-slot="variability"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.variability,
                label: SNW.I18n.t('dashboard.variabilityLabel'),
                unit: '%',
                feedbackFn: val => (SNW.Feedback ? SNW.Feedback.getVariabilityGuide(val) : null),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onVariabilityChange(v)
            });
            this.components.sliderGust = SNW.UI.slider({
                root: q('[data-slot="gust"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.gustFreq,
                label: SNW.I18n.t('dashboard.gustLabel'),
                unit: '%',
                feedbackFn: val => (SNW.Feedback ? SNW.Feedback.getGustGuide(val) : null),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onGustChange(v)
            });
            this.components.slider = this.components.sliderIntensity;

            this.components.presets = SNW.UI.presetGrid({
                root: q('[data-slot="presets"]'),
                items: [], selected: '',
                onSelect: code => this._onPresetSelect(code),
                onPreview: code => this._onPreviewClick(code),
                onTrial: code => this._onRealTrialClick(code)
            });
            
            // 스타일 선택 이벤트 바인딩 추가
            this._bindStyleSelector();

            // [SIM-4] 프리셋 영역 A/B 비교 버튼 배치
            const presetSlot = this.el.querySelector('[data-slot="presets"]');
            if (presetSlot && presetSlot.parentElement) {
                const header = presetSlot.parentElement.querySelector('h2, .snw-card__header');
                if (header) {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'snw-btn snw-btn--sm';
                    btn.style.cssText = 'float:right;font-size:11px;padding:2px 8px;margin-top:-2px;';
                    btn.textContent = '⚖ A/B 비교';
                    btn.onclick = () => this._onCompareClick();
                    header.appendChild(btn);

                    const tourBtn = document.createElement('button');
                    tourBtn.type = 'button';
                    tourBtn.className = 'snw-btn snw-btn--sm';
                    tourBtn.style.cssText = 'float:right;font-size:11px;padding:2px 8px;margin-top:-2px;margin-right:4px;';
                    tourBtn.textContent = '🎬 투어';
                    tourBtn.onclick = () => this._onTastingTour();
                    header.appendChild(tourBtn);

                    const sleepBtn = document.createElement('button');
                    sleepBtn.type = 'button';
                    sleepBtn.className = 'snw-btn snw-btn--sm';
                    sleepBtn.style.cssText = 'float:right;font-size:11px;padding:2px 8px;margin-top:-2px;margin-right:4px;';
                    sleepBtn.textContent = '🌙 수면모드';
                    sleepBtn.onclick = () => this._onSleepMode();
                    header.appendChild(sleepBtn);
                }
            }
        }

        // [U-001/U-004] 정본은 프리셋.factors × 스타일.factors (S20 미러)
        //  - target?.params → target?.factors (JSON 실제 구조)
        //  - REFRESH/WAVE → 실제 5종(BALANCE/ACTIVE/FOCUS/RELAX/SLEEP) factor 곱
        _resolvePresetParams(presetCode, styleCode) {
            const presets = (this._profileData?.windDict?.presets) || [];
            const styles  = (this._profileData?.windDict?.styles)  || [];

            const preset = presets.find(p => p.code === presetCode);
            const style  = styles.find(s => s.code === (styleCode || 'BALANCE'));

            const pf = preset?.factors || {};
            const sf = style?.factors  || {};

            const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
            const mul   = (base, f) => (base ?? 50) * (f ?? 1);

            return {
                intensity:   clamp(mul(pf.windIntensity,   sf.intensityFactor)),
                variability: clamp(mul(pf.windVariability, sf.variabilityFactor)),
                gustFreq:    clamp(mul(pf.gustFrequency,   sf.gustFactor))
            };
        }


        // [SIM-2] 가상 미리보기 모달 (30초 파형 애니메이션)
        async _onPreviewClick(presetCode) {
            const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
            if (!SNW.Preview || !SNW.Preview.generate) {
                SNW.ToastUtil.error('미리보기 모듈 미로드');
                return;
            }
            const preview = SNW.Preview.generate(presetCode, styleCode, null);
            if (!preview) { SNW.ToastUtil.error('미리보기 생성 실패'); return; }

            const feelings = SNW.Preview.toFeelings(
                preview.intensity, preview.variability, preview.gustFreq);

            const content = document.createElement('div');
            content.innerHTML = `
                <div class="snw-preview-modal">
                    <canvas data-preview-canvas width="500" height="180" style="width:100%;background:var(--snw-bg-2);border-radius:6px;"></canvas>
                    <div style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);">
                        🎬 <b>예상 파형 (±10% 오차)</b> · 실선풍기는 가동되지 않습니다
                    </div>
                    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div>🌊 <b>${SNW.Preview.labelFor('coolness')}</b> ${this._stars(feelings.coolness)}</div>
                        <div>🎵 <b>${SNW.Preview.labelFor('smoothness')}</b> ${this._stars(feelings.smoothness)}</div>
                        <div>⚡ <b>${SNW.Preview.labelFor('dynamism')}</b> ${this._stars(feelings.dynamism)}</div>
                        <div>🍃 <b>${SNW.Preview.labelFor('calmness')}</b> ${this._stars(feelings.calmness)}</div>
                    </div>
                    <div style="margin-top:12px;font-size:12px;color:var(--snw-text-dim);">
                        평균 ${preview.avg} m/s · 강도 ${Math.round(preview.intensity)}% ·
                        변동 ${Math.round(preview.variability)}% · 돌풍 ${Math.round(preview.gustFreq)}%
                    </div>
                </div>`;

            SNW.UI.modal(
                `🎬 미리보기 — ${presetCode} + ${styleCode}`,
                content,
                () => { this._applyPresetFromPreview(presetCode); return true; },
                null,
                { okLabel: '이 설정 적용', width: '540px', cancelLabel: '닫기' }
            );

            // 애니메이션 (30초 → 3초 재생)
            const canvas = content.querySelector('[data-preview-canvas]');
            if (canvas) this._animatePreview(canvas, preview.points);
        }

        _stars(n) {
            return '●'.repeat(n) + '○'.repeat(5 - n);
        }

        _animatePreview(canvas, points) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            let min = Infinity, max = -Infinity;
            points.forEach(p => { if (p.wind < min) min = p.wind; if (p.wind > max) max = p.wind; });
            if (max <= min) max = min + 1;

            let drawn = 0;
            const drawNext = () => {
                if (drawn >= points.length || !canvas.isConnected) return;
                ctx.clearRect(0, 0, w, h);

                // 격자
                ctx.strokeStyle = 'rgba(139,148,158,0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = (h / 4) * i;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }

                // 파형
                ctx.strokeStyle = 'rgba(74,158,255,1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= drawn; i++) {
                    const p = points[i];
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.wind - min) / (max - min)) * (h - 20) - 10;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // gust 표시
                for (let i = 0; i <= drawn; i++) {
                    if (!points[i].gust) continue;
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((points[i].wind - min) / (max - min)) * (h - 20) - 10;
                    ctx.fillStyle = 'rgba(240,136,62,0.9)';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                drawn += 3;
                setTimeout(drawNext, 30);
            };
            drawNext();
        }

        async _applyPresetFromPreview(presetCode) {
            try {
                const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
                await SNW.Api.patchSim({
                    presetCode, styleCode,
                    override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 }
                });
                SNW.ToastUtil.success(SNW.I18n.t('preset.applied'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'preview.apply');
            }
        }

        _bindStyleSelector() {
            const selector = this.el.querySelector('#style-selector');
            if (!selector) return;
            
            selector.addEventListener('click', async (e) => {
                const btn = e.target.closest('.snw-style-btn');
                if (!btn) return;
                
                const newStyle = btn.getAttribute('data-style');
                const currentSim = SNW.Store.get().sim || {};
                if (currentSim.styleCode === newStyle) return;
                
                // UI 즉시 반영
                this._updateStyleUI(newStyle);
                
                // 현재 프리셋과 새 스타일에 따른 세부 파라미터 연동 계산
                const currentPreset = currentSim.presetCode || 'FOREST';
                const resolved = this._resolvePresetParams(currentPreset, newStyle);

                // 슬라이더 3종 즉시 연동
                if (this.components.sliderIntensity) this.components.sliderIntensity.set(resolved.intensity);
                if (this.components.sliderVariability) this.components.sliderVariability.set(resolved.variability);
                if (this.components.sliderGust) this.components.sliderGust.set(resolved.gustFreq);

                SNW.Store.set({
                    sim: Object.assign({}, currentSim, {
                        styleCode: newStyle,
                        intensity: resolved.intensity,
                        variability: resolved.variability,
                        gustFreq: resolved.gustFreq
                    })
                });

                try {
                    await SNW.Api.patchSim({
                        styleCode: newStyle,
                        intensity: resolved.intensity,
                        variability: resolved.variability,
                        gustFreq: resolved.gustFreq
                    });
                } catch (err) {
                    SNW.ErrorHandler.handle(err, 'dashboard.style');
                    // 실패 시 원복
                    this._updateStyleUI(currentSim.styleCode);
                }
            });
        }
        
        _updateStyleUI(styleCode) {
            this.el.querySelectorAll('.snw-style-btn').forEach(btn => {
                btn.classList.toggle('is-active', btn.getAttribute('data-style') === styleCode);
            });
        }
        
        // =========================================================
        // [O-3] 모드 스위치 — 취소 시 롤백
        // =========================================================
        _bindModeSwitch() {
            const switchEl = this.el.querySelector('#mode-switch');
            if (!switchEl) return;
            
            switchEl.addEventListener('change', async (e) => {
                const isProfileMode = e.target.checked;
                const prevMode = !isProfileMode;
                const modeEl = this.el.querySelector('[data-slot="current-mode-text"]');
                
                const updateModeText = (profileMode) => {
                    if (modeEl) modeEl.textContent = profileMode
                        ? SNW.I18n.t('dashboard.modeProfileShort')
                        : SNW.I18n.t('dashboard.modeScheduleShort');
                };
                updateModeText(isProfileMode);
                
                try {
                    if (isProfileMode) {
                        await this._promptProfileSelection();
                    } else {
                        await SNW.Api.stopProfile();
                        SNW.ToastUtil.success(SNW.I18n.t('dashboard.modeSwitchedSchedule'));
                    }
                } catch (err) {
                    switchEl.checked = prevMode;
                    updateModeText(prevMode);
                    
                    if (err.message === 'CANCELLED') return;
                    if (err.message === 'NO_PROFILES') {
                        SNW.ToastUtil.warn(SNW.I18n.t('msg.noProfilesWarn'));
                        return;
                    }
                    SNW.ErrorHandler.handle(err, 'dashboard.modeSwitch');
                }
            });
        }
        
        // [O-3] 프로필 선택 모달 — 취소 시 reject
        async _promptProfileSelection() {
            const data = await SNW.Api.listProfiles().catch(() => null);
            const profiles = (data?.userProfiles?.profiles || []).filter(p => p.enabled);
            
            if (profiles.length === 0) throw new Error('NO_PROFILES');
            
            const content = document.createElement('div');
            content.className = 'snw-profile-picker';
            
            profiles.forEach(p => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'snw-btn snw-profile-picker__item';
                btn.innerHTML = `
                    <span>${SNW.DomUtil.escape(p.name || '#' + p.profileNo)}</span>
                    <span style="color:var(--snw-primary);">${SNW.I18n.t('common.start')} ▶</span>
                `;
                btn.onclick = async () => {
                    try {
                        await SNW.Api.selectProfile(p.profileNo);
                        SNW.ToastUtil.success(SNW.I18n.t('dashboard.modeSwitchedProfile'));
                        modalRef.close();
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                };
                content.appendChild(btn);
            });
            
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
            
            const modalRef = SNW.UI.modal(
                SNW.I18n.t('dashboard.selectProfileModal'),
                content,
                null,
                () => reject(new Error('CANCELLED')),
                { hideOk: true }
            );
            
            return promise;
        }
        
        // =========================================================
        // Store 구독 — [O-1][O-2][O-6][O-15] 반영
        // =========================================================
        _bindStore() {
            const s = SNW.Store;
            
            this._unsubs.push(
                s.watch('fsmState', code => {
                    if (this._active) this.components.badge.set(code, s.get().fsmReason);
                }),
                s.watch('fsmReason', reason => {
                    if (this._active) this.components.badge.set(s.get().fsmState, reason);
                }),
                
                // [O-2][O-6] sim 구독 — 잠금 해제/프리셋 확정
                s.watch('sim', sim => {
                    if (!this._active || !sim) return;
                    
                    // [O-2] 강도 잠금
                    if (this._pendingIntensity !== null) {
                        if (Math.abs(sim.intensity - this._pendingIntensity) <= 1) {
                            this._pendingIntensity = null;
                        } else {
                            return; // 확정 전 → UI 덮어쓰기 방지
                        }
                    }
                    
                    // [O-6] 프리셋 확정
                    if (this._pendingPreset && sim.presetCode === this._pendingPreset) {
                        const card = this.el.querySelector(`[data-code="${sim.presetCode}"]`);
                        if (card) card.classList.remove('is-applying');
                        SNW.ToastUtil.success(SNW.I18n.t('preset.applied'));
                        this._pendingPreset = null;
                    }
                    
                    // UI 갱신
                    const curWind = this.el.querySelector('[data-slot="cur-wind"]');
                    if (curWind) curWind.textContent = (sim.windSpeed != null ? sim.windSpeed.toFixed(1) : '-');
                    const tgtWind = this.el.querySelector('[data-slot="target-wind"]');
                    if (tgtWind) tgtWind.textContent = (sim.targetWind != null ? sim.targetWind.toFixed(1) : '-');
                    const phaseEl = this.el.querySelector('[data-slot="phase"]');
                    if (phaseEl) {
                        const meta = SNW.C.WIND_PHASE_META[sim.phase] || SNW.C.WIND_PHASE_META.NORMAL;
                        phaseEl.textContent = SNW.I18n.t(meta.labelKey);
                    }
                    this.components.gauge.set(sim.pwmDuty != null ? sim.pwmDuty : 0);
                    if (sim.intensity != null) this.components.sliderIntensity.set(sim.intensity);
                    if (sim.variability != null) this.components.sliderVariability.set(sim.variability);
                    if (sim.gustFreq != null) this.components.sliderGust.set(sim.gustFreq);
                    if (sim.presetCode) this.components.presets.setSelected(sim.presetCode);
                    
                    if (sim.styleCode) this._updateStyleUI(sim.styleCode);
                }),
                
                // [O-1][O-15] control 구독 — 배너 갱신
                s.watch('control', ctl => {
                    if (!this._active || !ctl) return;
                    this.components.toggle.set(!!ctl.active);
                    if (ctl.sensor) {
                        this.components.sensors.set({
                            tempC: ctl.sensor.tempC,
                            humidity: ctl.sensor.humidity,
                            motionActive: ctl.sensor.motionActive
                        });
                    }
                    
                    const schName = ctl.schedule && ctl.schedule.name ? ctl.schedule.name : '-';
                    const profName = ctl.profile && ctl.profile.name ? ctl.profile.name : '-';
                    const schEl = this.el.querySelector('[data-slot="sch-name"]');
                    if (schEl) schEl.textContent = schName;
                    const profEl = this.el.querySelector('[data-slot="prof-name"]');
                    if (profEl) profEl.textContent = profName;
                    
                    let autoOffStr = '비활성';
                    if (ctl.autoOffRt) {
                        if (ctl.autoOffRt.timerArmed) autoOffStr = `타이머 (${ctl.autoOffRt.timerMinutes}분)`;
                        else if (ctl.autoOffRt.offTimeEnabled) autoOffStr = `예약 종료 (${ctl.autoOffRt.offTimeMinutes}분)`;
                        else if (ctl.autoOffRt.offTempEnabled) autoOffStr = `온도 (${ctl.autoOffRt.offTemp}°C)`;
                    }
                    const aoEl = this.el.querySelector('[data-slot="autooff"]');
                    if (aoEl) aoEl.textContent = autoOffStr;
                    
                    const isProfMode = ctl.profileMode || (ctl.runSource === 2);
                    const modeEl = this.el.querySelector('[data-slot="current-mode-text"]');
                    if (modeEl) modeEl.textContent = isProfMode
                        ? SNW.I18n.t('dashboard.modeProfileShort')
                        : SNW.I18n.t('dashboard.modeScheduleShort');
                    const switchEl = this.el.querySelector('#mode-switch');
                    if (switchEl && switchEl.checked !== isProfMode) switchEl.checked = isProfMode;
                    
                    // [O-15] AutoOff/모션 배너
                    this._updateBanner(ctl);
                })
            );
        }
        
        // [O-15] AutoOff/모션 배너 처리
        // [U-012] reasonCode → i18n 키 매핑 (AUTOOFF_TIMER → 취침 타이머 완료)
        _updateBanner(ctl) {
            if (!SNW.Banner) return;
            
            if (ctl.stateCode === 5 /* AUTOOFF_STOPPED */) {
                const reasonKey  = SNW.C.AUTOOFF_REASON_MAP ? SNW.C.AUTOOFF_REASON_MAP[ctl.reasonCode] : null;
                const reasonText = reasonKey ? SNW.I18n.t(reasonKey) : (ctl.reason || '-');
                SNW.Banner.update('autooff', {
                    id: 'autooff',
                    level: 'warn',
                    text: SNW.I18n.t('banner.autoOff', { reason: reasonText }),
                    actions: [
                        {
                            label: SNW.I18n.t('power.ackAndRestart'),
                            onClick: async () => {
                                try {
                                    await SNW.Api.ackEvent();
                                    await this._onPowerToggle(true);
                                } catch (e) { SNW.ErrorHandler.handle(e, 'dashboard.ackRestart'); }
                            }
                        },
                        {
                            label: SNW.I18n.t('power.ackOnly'),
                            onClick: async () => {
                                try {
                                    await SNW.Api.ackEvent();
                                    SNW.Banner.hide();
                                } catch (e) { SNW.ErrorHandler.handle(e, 'dashboard.ack'); }
                            }
                        }
                    ]
                });
            } else if (ctl.stateCode === 4 /* MOTION_BLOCKED */) {
                SNW.Banner.update('motion', {
                    id: 'motion',
                    level: 'warn',
                    text: SNW.I18n.t('banner.motionBlocked'),
                    actions: [{
                        label: SNW.I18n.t('power.forceOn'),
                        onClick: () => this._onPowerToggle(true)
                    }]
                });
            } else {
                SNW.Banner.hide();
            }
        }
        
        _startClock() {
            const clockEl = document.getElementById('header-clock');
            if (!clockEl) return;
            const id = SNW.TimeUtil.startClock(clockEl, () => {
                const t = SNW.Store.get().time || {};
                return {
                    hour: t.hour != null ? t.hour : -1,
                    min: t.min != null ? t.min : -1
                };
            });
            this._timers.push(id);
        }
        
        // =========================================================
        // [O-1] 전원 토글 — 진단 후 안전 실행
        // =========================================================
        async _onPowerToggle(next) {
            if (this._pendingPowerToggle) return;
            this._pendingPowerToggle = true;
            
            const prevCtl = SNW.Store.get().control || {};
            const prevActive = !!prevCtl.active;
            
            try {
                if (!next) {
                    await SNW.Api.overrideClear();
                    return;
                }
                
                // ON: 진단
                const st = await SNW.Api.getState();
                const ctl = st.control || {};
                
                // Case 1: AutoOff 래치
                if (ctl.stateCode === 5) {
                    SNW.ToastUtil.info(SNW.I18n.t('power.autoOffLatched'));
                    await SNW.Api.ackEvent();
                    await new Promise(r => setTimeout(r, 100));
                }
                
                // Case 2: 모션 블록
                if (ctl.stateCode === 4 || ctl.sensor?.motionActive === false) {
                    SNW.ToastUtil.warn(SNW.I18n.t('power.motionBlocked'));
                    this.components.toggle.set(prevActive);
                    this._pendingPowerToggle = false;
                    return;
                }
                
                // 낙관적 UI
                SNW.Store.set({ control: Object.assign({}, ctl, { active: true }) });
                
                const intensity = SNW.Store.get().sim?.intensity ?? 70;
                await SNW.Api.overrideFixed(intensity, 0, true);
                
                // 서버 실제 반영 검증
                const after = await SNW.Api.getState();
                if (after.control?.stateCode !== 1 /* OVERRIDE */) {
                    SNW.ToastUtil.error(SNW.I18n.t('power.failed', {
                        reason: after.control?.reason || 'unknown'
                    }));
                    this.components.toggle.set(prevActive);
                    SNW.Store.set({
                        control: Object.assign({}, after.control, { active: prevActive })
                    });
                }
            } catch (e) {
                this.components.toggle.set(prevActive);
                SNW.ErrorHandler.handle(e, 'dashboard.power');
            } finally {
                this._pendingPowerToggle = false;
            }
        }
        
        // =========================================================
        // [O-2] 강도 변경 — 낙관적 잠금
        // =========================================================
        async _onIntensityChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim?.intensity;
            
            this._pendingIntensity = v;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { intensity: v }) });
            
            try {
                await SNW.Api.patchSim({ intensity: v });
                // 1초 후에도 WS가 반영 안 하면 잠금 해제 (안전망)
                this._timers.push(setTimeout(() => {
                    if (this._pendingIntensity === v) this._pendingIntensity = null;
                }, 1000));
            } catch (e) {
                this._pendingIntensity = null;
                SNW.Store.set({ sim: Object.assign({}, prevSim, { intensity: prevVal }) });
                this.components.slider.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.intensity');
            }
        }

        async _onVariabilityChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim?.variability;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { variability: v }) });
            try {
                await SNW.Api.patchSim({ variability: v });
            } catch (e) {
                SNW.Store.set({ sim: Object.assign({}, prevSim, { variability: prevVal }) });
                this.components.sliderVariability.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.variability');
            }
        }

        async _onGustChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim?.gustFreq;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { gustFreq: v }) });
            try {
                await SNW.Api.patchSim({ gustFreq: v });
            } catch (e) {
                SNW.Store.set({ sim: Object.assign({}, prevSim, { gustFreq: prevVal }) });
                this.components.sliderGust.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.gust');
            }
        }
        
        // =========================================================
        // [O-6] 프리셋 적용 — WS 확인 및 세부 조정값 연동
        // =========================================================
        async _onPresetSelect(code) {
            const prevSim = SNW.Store.get().sim || {};
            const prevCode = prevSim?.presetCode;
            const currentStyle = prevSim?.styleCode || 'BALANCE';
            
            // 프리셋에 따른 세부 조정값 연동 계산
            const resolved = this._resolvePresetParams(code, currentStyle);

            this._pendingPreset = code;

            // 슬라이더 3종 즉시 연동
            if (this.components.sliderIntensity) this.components.sliderIntensity.set(resolved.intensity);
            if (this.components.sliderVariability) this.components.sliderVariability.set(resolved.variability);
            if (this.components.sliderGust) this.components.sliderGust.set(resolved.gustFreq);

            SNW.Store.set({
                sim: Object.assign({}, prevSim, {
                    presetCode: code,
                    intensity: resolved.intensity,
                    variability: resolved.variability,
                    gustFreq: resolved.gustFreq
                })
            });
            
            const card = this.el.querySelector(`[data-code="${code}"]`);
            if (card) card.classList.add('is-applying');
            
            try {
                await SNW.Api.patchSim({
                    presetCode: code,
                    styleCode: currentStyle,
                    intensity: resolved.intensity,
                    variability: resolved.variability,
                    gustFreq: resolved.gustFreq
                });
                
                // 3초 타임아웃
                this._timers.push(setTimeout(() => {
                    if (this._pendingPreset === code) {
                        this._pendingPreset = null;
                        if (card) card.classList.remove('is-applying');
                    }
                }, 3000));
            } catch (e) {
                this._pendingPreset = null;
                if (card) card.classList.remove('is-applying');
                SNW.Store.set({ sim: Object.assign({}, prevSim, { presetCode: prevCode }) });
                this.components.presets.setSelected(prevCode);
                SNW.ErrorHandler.handle(e, 'dashboard.preset');
            }
        }
    };
})(window.SNW);

