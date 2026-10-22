// =========================================================
// 200.page.dashboard.js — SNW.Page.Dashboard (L1 MVP)
// Layer 4 (페이지 로직) — Layer 0~3 참조
//  - mount(): 템플릿 삽입, 컴포넌트 마운트, Store 구독
//  - unmount(): 구독/타이머 정리
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Dashboard = class Dashboard {
        constructor(container) {
            this.el = container;
            this._unsubs  = [];
            this._wsUnsubs = [];
            this._timers  = [];
            this.components = {};
            this._active = true;
            this._autoOffModalShown = false;
        }

        // -------------------------------------------------
        // mount
        // -------------------------------------------------
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.dashboard());
            SNW.I18n.applyTo(this.el);

            // 초기 데이터 병렬 로드
            try {
                const [stateData, profileData] = await Promise.all([
                    SNW.Api.getState(),
                    SNW.Api.listWindProfiles().catch(() => null)
                ]);
                if (!this._active) return;
                this._applyInitialState(stateData);
                if (profileData) this._applyPresetList(profileData);
            } catch (e) {
                if (!this._active) return;
                SNW.LogUtil.warn('[Dashboard] 초기 로드 실패', e);
            }

            this._mountComponents();
            this._bindStore();
            this._startClock();

            SNW.LogUtil.info('[Dashboard] mount 완료');
        }

        // -------------------------------------------------
        // unmount
        // -------------------------------------------------
        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
            this._timers.forEach(id => { clearInterval(id); clearTimeout(id); });
            this._unsubs = [];
            this._wsUnsubs = [];
            this._timers = [];
            // 차트 정리
            if (this.components.chart && this.components.chart.destroy) {
                try { this.components.chart.destroy(); } catch {}
            }
        }

        // -------------------------------------------------
        // 초기 데이터
        // -------------------------------------------------
        _applyInitialState(data) {
            if (!data) return;
            const ctl = data.control || null;
            const sim = data.sim || null;
            SNW.Store.set({
                control:    ctl,
                sim:        sim,
                time:       ctl && ctl.time,
                system:     ctl && ctl.system,
                fsmState:   (ctl && ctl.stateCode  != null) ? ctl.stateCode  : 0,
                fsmReason:  (ctl && ctl.reasonCode != null) ? ctl.reasonCode : 0,
                lastUpdateMs: Date.now()
            });
        }

        _applyPresetList(profileData) {
            const presets = (profileData && profileData.windDict && profileData.windDict.presets) || [];
            const order   = SNW.C.PRESET_DISPLAY_ORDER;

            // order 기준 정렬 (없는 코드는 뒤로)
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

            if (this.components.presets) {
                this.components.presets.setItems(items);
            }
        }

        // -------------------------------------------------
        // 컴포넌트 마운트
        // -------------------------------------------------
        _mountComponents() {
            const q = sel => this.el.querySelector(sel);

            // FSM 배지
            this.components.badge = SNW.UI.stateBadge(q('[data-slot="badge"]'));

            // PWM 게이지
            this.components.gauge = SNW.UI.gauge(q('[data-slot="gauge"]'));

            // 센서 카드
            this.components.sensors = SNW.UI.sensorCards(q('[data-slot="sensors"]'));

            // 전원 토글
            this.components.toggle = SNW.UI.toggle({
                root: q('[data-slot="power"]'),
                on: false,
                onToggle: (next) => this._onPowerToggle(next)
            });

            // 강도 슬라이더
            this.components.slider = SNW.UI.slider({
                root: q('[data-slot="intensity"]'),
                min: 0, max: 100, value: SNW.CFG.SIM_DEFAULT.intensity,
                label: SNW.I18n.t('dashboard.intensityLabel'),
                unit:  SNW.I18n.t('unit.percent'),
                debounceMs: SNW.C.DEBOUNCE_MS.SLIDER,
                onChange: (v) => this._onIntensityChange(v)
            });

            // 프리셋 그리드 (초기 빈 상태)
            this.components.presets = SNW.UI.presetGrid({
                root: q('[data-slot="presets"]'),
                items: [],
                selected: '',
                onSelect: (code) => this._onPresetSelect(code)
            });
        }

        // -------------------------------------------------
        // Store 구독
        // -------------------------------------------------
        _bindStore() {
            const s = SNW.Store;

            this._unsubs.push(
                // FSM 상태 배지
                s.watch('fsmState', (code) => {
                    if (!this._active) return;
                    this.components.badge.set(code, s.get().fsmReason);
                }),
                s.watch('fsmReason', (reason) => {
                    if (!this._active) return;
                    this.components.badge.set(s.get().fsmState, reason);
                }),

                // 시뮬레이션 (풍속/PWM/프리셋/슬라이더)
                s.watch('sim', (sim) => {
                    if (!this._active || !sim) return;

                    // 현재 풍속
                    const curWind = this.el.querySelector('[data-slot="cur-wind"]');
                    if (curWind) curWind.textContent = (sim.windSpeed != null ? sim.windSpeed.toFixed(1) : '-');

                    // 목표 풍속
                    const tgtWind = this.el.querySelector('[data-slot="target-wind"]');
                    if (tgtWind) tgtWind.textContent = (sim.targetWind != null ? sim.targetWind.toFixed(1) : '-');

                    // Phase
                    const phaseEl = this.el.querySelector('[data-slot="phase"]');
                    if (phaseEl) {
                        const meta = SNW.C.WIND_PHASE_META[sim.phase] || SNW.C.WIND_PHASE_META.NORMAL;
                        phaseEl.textContent = SNW.I18n.t(meta.labelKey);
                    }

                    // PWM 게이지
                    this.components.gauge.set(sim.pwmDuty != null ? sim.pwmDuty : 0);

                    // 슬라이더
                    if (sim.intensity != null) this.components.slider.set(sim.intensity);

                    // 프리셋 강조
                    if (sim.presetCode) this.components.presets.setSelected(sim.presetCode);
                }),

                // 컨트롤 (전원/센서)
                s.watch('control', (ctl) => {
                    if (!this._active || !ctl) return;

                    this.components.toggle.set(!!ctl.active);

                    if (ctl.sensor) {
                        this.components.sensors.set({
                            tempC:        ctl.sensor.tempC,
                            humidity:     ctl.sensor.humidity,
                            motionActive: ctl.sensor.motionActive
                        });
                    }

                    // [신규] AutoOff 이벤트 팝업
                    if (ctl.event && ctl.event.ackRequired && !this._autoOffModalShown) {
                        this._autoOffModalShown = true;
                        const msg = SNW.I18n.t('autoOff.recover') || '자동 꺼짐 상태입니다. 다시 켜시겠습니까?';
                        const content = document.createElement('div');
                        content.textContent = msg;
                        content.style.cssText = 'padding:12px 0;color:var(--snw-text);font-size:14px;';
                        SNW.UI.modal(SNW.I18n.t('autoOff.ack') || '알림', content, async () => {
                            try { await SNW.Api.ackEvent(); } catch(e) {}
                            this._autoOffModalShown = false;
                            return true;
                        });
                    } else if (!ctl.event || !ctl.event.ackRequired) {
                        this._autoOffModalShown = false;
                    }
                })
            );
        }

        // -------------------------------------------------
        // 헤더 시계 (1초 주기)
        // -------------------------------------------------
        _startClock() {
            const clockEl = document.getElementById('header-clock');
            if (!clockEl) return;
            const id = SNW.TimeUtil.startClock(clockEl, () => {
                const t = SNW.Store.get().time || {};
                return { hour: t.hour != null ? t.hour : -1, min: t.min != null ? t.min : -1 };
            });
            this._timers.push(id);
        }

        // -------------------------------------------------
        // 사용자 액션 (낙관적 UI + 실패 롤백)
        // -------------------------------------------------
        async _onPowerToggle(next) {
            const prevCtl = SNW.Store.get().control;
            const prevActive = prevCtl ? !!prevCtl.active : false;

            // 낙관적 갱신
            SNW.Store.set({
                control: Object.assign({}, prevCtl || {}, { active: !!next })
            });

            try {
                if (next) {
                    const intensity = SNW.Store.get().sim && SNW.Store.get().sim.intensity != null
                        ? SNW.Store.get().sim.intensity
                        : SNW.CFG.SIM_DEFAULT.intensity;
                    await SNW.Api.overrideFixed(intensity, 0, true);
                } else {
                    await SNW.Api.overrideClear();
                }
            } catch (e) {
                // 롤백
                SNW.Store.set({
                    control: Object.assign({}, SNW.Store.get().control || {}, { active: prevActive })
                });
                this.components.toggle.set(prevActive);
                SNW.ErrorHandler.handle(e, 'dashboard.power');
            }
        }

        async _onIntensityChange(v) {
            const prevSim = SNW.Store.get().sim;
            const prevVal = prevSim ? prevSim.intensity : null;

            // 낙관적 갱신
            SNW.Store.set({
                sim: Object.assign({}, prevSim || {}, { intensity: v })
            });

            try {
                const res = await SNW.Api.patchSim({ intensity: v });
                if (res && res.updated === false) {
                    SNW.ToastUtil.info(SNW.I18n.t('msg.noChange'));
                }
            } catch (e) {
                // 롤백
                SNW.Store.set({
                    sim: Object.assign({}, SNW.Store.get().sim || {}, { intensity: prevVal })
                });
                this.components.slider.set(prevVal);
                SNW.ErrorHandler.handle(e, 'dashboard.intensity');
            }
        }

        async _onPresetSelect(code) {
            const prevSim = SNW.Store.get().sim;
            const prevCode = prevSim ? prevSim.presetCode : '';

            // 낙관적 갱신
            SNW.Store.set({
                sim: Object.assign({}, prevSim || {}, { presetCode: code })
            });

            try {
                await SNW.Api.patchSim({ presetCode: code });
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                // 롤백
                SNW.Store.set({
                    sim: Object.assign({}, SNW.Store.get().sim || {}, { presetCode: prevCode })
                });
                this.components.presets.setSelected(prevCode);
                SNW.ErrorHandler.handle(e, 'dashboard.preset');
            }
        }
    };

})(window.SNW);
