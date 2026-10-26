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
                if (profileData) this._applyPresetList(profileData);
            } catch (e) {
                if (this._active) SNW.LogUtil.warn('[Dashboard] 초기 로드 실패', e);
            }
            
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
            this.components.slider = SNW.UI.slider({
                root: q('[data-slot="intensity"]'),
                min: 0, max: 100,
                value: SNW.CFG.SIM_DEFAULT.intensity,
                label: SNW.I18n.t('dashboard.intensityLabel'),
                unit: '%',
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: v => this._onIntensityChange(v)
            });
            this.components.presets = SNW.UI.presetGrid({
                root: q('[data-slot="presets"]'),
                items: [], selected: '',
                onSelect: code => this._onPresetSelect(code)
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
                    if (sim.intensity != null) this.components.slider.set(sim.intensity);
                    if (sim.presetCode) this.components.presets.setSelected(sim.presetCode);
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
        _updateBanner(ctl) {
            if (!SNW.Banner) return;
            
            if (ctl.stateCode === 5 /* AUTOOFF_STOPPED */) {
                SNW.Banner.update('autooff', {
                    id: 'autooff',
                    level: 'warn',
                    text: SNW.I18n.t('banner.autoOff', { reason: ctl.reason || '-' }),
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
        
        // =========================================================
        // [O-6] 프리셋 적용 — WS 확인
        // =========================================================
        async _onPresetSelect(code) {
            const prevSim = SNW.Store.get().sim;
            const prevCode = prevSim?.presetCode;
            
            this._pendingPreset = code;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { presetCode: code }) });
            
            const card = this.el.querySelector(`[data-code="${code}"]`);
            if (card) card.classList.add('is-applying');
            
            try {
                await SNW.Api.patchSim({ presetCode: code });
                
                // 3초 타임아웃
                this._timers.push(setTimeout(() => {
                    if (this._pendingPreset === code) {
                        SNW.ToastUtil.warn(SNW.I18n.t('preset.delayed'));
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
