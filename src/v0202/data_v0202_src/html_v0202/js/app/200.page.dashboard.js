// =========================================================
// 200.page.dashboard.js — SNW.Page.Dashboard (L1 MVP)
// Layer 4 (페이지 로직) — Layer 0~3 참조
//  - mount(): 템플릿 삽입, 컴포넌트 마운트, Store 구독
//  - unmount(): 구독/타이머 정리
// =========================================================
/* ---- 200.page.dashboard.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Dashboard = class Dashboard {
        constructor(container) {
            this.el = container;
            this._unsubs = []; this._wsUnsubs = []; this._timers = [];
            this.components = {};
            this._active = true;
            this._autoOffModalShown = false;
        }
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.dashboard());
            SNW.I18n.applyTo(this.el);
            try {
                const [stateData, profileData] = await Promise.all([SNW.Api.getState(), SNW.Api.listWindProfiles().catch(() => null)]);
                if (!this._active) return;
                this._applyInitialState(stateData);
                if (profileData) this._applyPresetList(profileData);
            } catch (e) { if (this._active) SNW.LogUtil.warn('[Dashboard] 초기 로드 실패', e); }
            this._mountComponents();
            this._bindStore();
            this._startClock();
        }
        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
            this._timers.forEach(id => { clearInterval(id); clearTimeout(id); });
            this._unsubs = []; this._wsUnsubs = []; this._timers = [];
        }
        _applyInitialState(data) {
            if (!data) return;
            const ctl = data.control || null, sim = data.sim || null;
            SNW.Store.set({ control:ctl, sim, time:ctl && ctl.time, system:ctl && ctl.system,
                fsmState:(ctl && ctl.stateCode != null) ? ctl.stateCode : 0,
                fsmReason:(ctl && ctl.reasonCode != null) ? ctl.reasonCode : 0,
                lastUpdateMs: Date.now() });
        }
        _applyPresetList(profileData) {
            const presets = (profileData && profileData.windDict && profileData.windDict.presets) || [];
            const order = SNW.C.PRESET_DISPLAY_ORDER;
            const indexed = presets.map(p => ({ p, i: order.indexOf(p.code) }));
            indexed.sort((a, b) => { const ai = a.i < 0 ? 9999 : a.i; const bi = b.i < 0 ? 9999 : b.i; return ai - bi; });
            const items = indexed.map(({ p }) => ({ code:p.code, name: SNW.I18n.t('preset.' + p.code) || p.name || p.code }));
            if (this.components.presets) this.components.presets.setItems(items);
        }
        _mountComponents() {
            const q = sel => this.el.querySelector(sel);
            this.components.badge   = SNW.UI.stateBadge(q('[data-slot="badge"]'));
            this.components.gauge   = SNW.UI.gauge(q('[data-slot="gauge"]'));
            this.components.sensors = SNW.UI.sensorCards(q('[data-slot="sensors"]'));
            this.components.toggle  = SNW.UI.toggle({ root:q('[data-slot="power"]'), on:false, onToggle: next => this._onPowerToggle(next) });
            this.components.slider  = SNW.UI.slider({ root:q('[data-slot="intensity"]'), min:0, max:100, value: SNW.CFG.SIM_DEFAULT.intensity, label: SNW.I18n.t('dashboard.intensityLabel'), unit: SNW.I18n.t('unit.percent'), debounceMs: SNW.C.DEBOUNCE_MS.SLIDER, onChange: v => this._onIntensityChange(v) });
            this.components.presets = SNW.UI.presetGrid({ root:q('[data-slot="presets"]'), items:[], selected:'', onSelect: code => this._onPresetSelect(code) });
        }
        _bindStore() {
            const s = SNW.Store;
            this._unsubs.push(
                s.watch('fsmState', code => { if (this._active) this.components.badge.set(code, s.get().fsmReason); }),
                s.watch('fsmReason', reason => { if (this._active) this.components.badge.set(s.get().fsmState, reason); }),
                s.watch('sim', sim => {
                    if (!this._active || !sim) return;
                    const curWind = this.el.querySelector('[data-slot="cur-wind"]');
                    if (curWind) curWind.textContent = (sim.windSpeed != null ? sim.windSpeed.toFixed(1) : '-');
                    const tgtWind = this.el.querySelector('[data-slot="target-wind"]');
                    if (tgtWind) tgtWind.textContent = (sim.targetWind != null ? sim.targetWind.toFixed(1) : '-');
                    const phaseEl = this.el.querySelector('[data-slot="phase"]');
                    if (phaseEl) { const meta = SNW.C.WIND_PHASE_META[sim.phase] || SNW.C.WIND_PHASE_META.NORMAL; phaseEl.textContent = SNW.I18n.t(meta.labelKey); }
                    this.components.gauge.set(sim.pwmDuty != null ? sim.pwmDuty : 0);
                    if (sim.intensity != null) this.components.slider.set(sim.intensity);
                    if (sim.presetCode) this.components.presets.setSelected(sim.presetCode);
                }),
                s.watch('control', ctl => {
                    if (!this._active || !ctl) return;
                    this.components.toggle.set(!!ctl.active);
                    if (ctl.sensor) this.components.sensors.set({ tempC:ctl.sensor.tempC, humidity:ctl.sensor.humidity, motionActive:ctl.sensor.motionActive });
                    
                    // [추가] 스케줄/프로필 이름 및 AutoOff 남은 시간 표시
                    const schName = ctl.schedule && ctl.schedule.name ? ctl.schedule.name : '-';
                    const profName = ctl.profile && ctl.profile.name ? ctl.profile.name : '-';
                    const schEl = this.el.querySelector('[data-slot="sch-name"]'); if (schEl) schEl.textContent = schName;
                    const profEl = this.el.querySelector('[data-slot="prof-name"]'); if (profEl) profEl.textContent = profName;
                    
                    let autoOffStr = '비활성';
                    if (ctl.autoOffRt) {
                        if (ctl.autoOffRt.timerArmed) autoOffStr = `타이머 (${ctl.autoOffRt.timerMinutes}분)`;
                        else if (ctl.autoOffRt.offTimeEnabled) autoOffStr = `예약 종료 (${ctl.autoOffRt.offTimeMinutes}분)`;
                        else if (ctl.autoOffRt.offTempEnabled) autoOffStr = `온도 (${ctl.autoOffRt.offTemp}°C)`;
                    }
                    const aoEl = this.el.querySelector('[data-slot="autooff"]'); if (aoEl) aoEl.textContent = autoOffStr;

                    // AutoOff 팝업
                    if (ctl.event && ctl.event.ackRequired && !this._autoOffModalShown) {
                        this._autoOffModalShown = true;
                        const msg = SNW.I18n.t('autoOff.recover') || '자동 꺼짐 상태입니다. 다시 켜시겠습니까?';
                        const content = document.createElement('div'); content.textContent = msg;
                        SNW.UI.modal(SNW.I18n.t('autoOff.ack') || '알림', content, async () => {
                            try { await SNW.Api.ackEvent(); } catch(e) {}
                            this._autoOffModalShown = false; return true;
                        });
                    } else if (!ctl.event || !ctl.event.ackRequired) {
                        this._autoOffModalShown = false;
                    }
                })
            );
        }
        _startClock() {
            const clockEl = document.getElementById('header-clock');
            if (!clockEl) return;
            const id = SNW.TimeUtil.startClock(clockEl, () => {
                const t = SNW.Store.get().time || {};
                return { hour: t.hour != null ? t.hour : -1, min: t.min != null ? t.min : -1 };
            });
            this._timers.push(id);
        }
        async _onPowerToggle(next) {
            const prevCtl = SNW.Store.get().control;
            const prevActive = prevCtl ? !!prevCtl.active : false;
            SNW.Store.set({ control: Object.assign({}, prevCtl || {}, { active: !!next }) });
            try {
                if (next) {
                    const intensity = SNW.Store.get().sim && SNW.Store.get().sim.intensity != null ? SNW.Store.get().sim.intensity : SNW.CFG.SIM_DEFAULT.intensity;
                    await SNW.Api.overrideFixed(intensity, 0, true);
                } else {
                    await SNW.Api.overrideClear();
                }
            } catch (e) {
                SNW.Store.set({ control: Object.assign({}, SNW.Store.get().control || {}, { active: prevActive }) });
                this.components.toggle.set(prevActive);
                SNW.ErrorHandler.handle(e, 'dashboard.power');
            }
        }
        async _onIntensityChange(v) {
            const prevSim = SNW.Store.get().sim; const prevVal = prevSim ? prevSim.intensity : null;
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { intensity: v }) });
            try {
                const res = await SNW.Api.patchSim({ intensity: v });
                if (res && res.updated === false) SNW.ToastUtil.info(SNW.I18n.t('msg.noChange'));
            } catch (e) {
                SNW.Store.set({ sim: Object.assign({}, SNW.Store.get().sim || {}, { intensity: prevVal }) });
                this.components.slider.set(prevVal); SNW.ErrorHandler.handle(e, 'dashboard.intensity');
            }
        }
        async _onPresetSelect(code) {
            const prevSim = SNW.Store.get().sim; const prevCode = prevSim ? prevSim.presetCode : '';
            SNW.Store.set({ sim: Object.assign({}, prevSim || {}, { presetCode: code }) });
            try {
                await SNW.Api.patchSim({ presetCode: code });
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                SNW.Store.set({ sim: Object.assign({}, SNW.Store.get().sim || {}, { presetCode: prevCode }) });
                this.components.presets.setSelected(prevCode); SNW.ErrorHandler.handle(e, 'dashboard.preset');
            }
        }
    };
})(window.SNW);