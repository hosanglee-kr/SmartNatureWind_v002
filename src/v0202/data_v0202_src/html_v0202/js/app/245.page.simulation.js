/* ---- 245.page.simulation.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Simulation = class Simulation {
        constructor(container) { this.el = container; this._active = true; }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.simulation());
            await this._load();
            SNW.DomUtil.delegate(this.el, '[data-action="save-sim"]', 'click', () => this._onSave());
        }
        unmount(){ this._active = false; }

        async _load() {
            try {
                const [motionData, simData] = await Promise.all([
                    SNW.Api.getMotion(),
                    SNW.Api.getSim()
                ]);
                const m = (motionData && motionData.motion) || {};
                const t = m.timing || {};
                const s = m.sim || (simData && simData.sim) || {};
                const slot = this.el.querySelector('[data-slot="form"]');
                
                slot.innerHTML = `
                    <h3>Timing</h3>
                    <div class="snw-form-row"><label>Sim Interval (ms)</label><input type="number" id="sim-interval" value="${t.simIntervalMs ?? 500}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Gust Interval (ms)</label><input type="number" id="sim-gust-interval" value="${t.gustIntervalMs ?? 2000}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Thermal Interval (ms)</label><input type="number" id="sim-thermal-interval" value="${t.thermalIntervalMs ?? 3000}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>

                    <h3 style="margin-top:12px;">Simulation Params</h3>
                    <div class="snw-form-row"><label>Preset Code</label><input type="text" id="sim-preset" value="${SNW.DomUtil.escape(s.presetCode || 'OCEAN')}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Style Code</label><input type="text" id="sim-style" value="${SNW.DomUtil.escape(s.styleCode || 'BALANCE')}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="sim-fanpower" ${s.fanPowerEnabled ? 'checked' : ''}> <label for="sim-fanpower" style="margin:0;">Fan Power Enabled</label>
                    </div>
                    <div class="snw-form-row"><label>Intensity (0~100)</label><input type="number" id="sim-intensity" value="${s.intensity ?? 70}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Variability (0~100)</label><input type="number" id="sim-variability" value="${s.variability ?? 50}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Gust Freq (0~100)</label><input type="number" id="sim-gustfreq" value="${s.gustFreq ?? 45}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Fan Limit (%)</label><input type="number" id="sim-fanlimit" value="${s.fanLimit ?? 90}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Min Fan (%)</label><input type="number" id="sim-minfan" value="${s.minFan ?? 10}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Turb Sigma</label><input type="number" step="0.01" id="sim-turbsigma" value="${s.turbSigma ?? 0.5}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Turb Len Scale</label><input type="number" step="0.1" id="sim-turblen" value="${s.turbLenScale ?? 40}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Thermal Strength</label><input type="number" step="0.1" id="sim-thermalstr" value="${s.thermalStrength ?? 2}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Thermal Radius</label><input type="number" step="0.1" id="sim-thermalrad" value="${s.thermalRadius ?? 18}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <div class="snw-toolbar" style="margin-top:16px;">
                        <button type="button" class="snw-btn snw-btn-primary" data-action="save-sim">시뮬레이션 설정 저장</button>
                    </div>
                `;
            } catch(e) { console.error('[Simulation] load error', e); }
        }

        async _onSave() {
            const q = sel => this.el.querySelector(sel);
            const motionPatch = { motion: {
                timing: {
                    simIntervalMs: Number(q('#sim-interval').value),
                    gustIntervalMs: Number(q('#sim-gust-interval').value),
                    thermalIntervalMs: Number(q('#sim-thermal-interval').value)
                },
                sim: {
                    presetCode: q('#sim-preset').value,
                    styleCode: q('#sim-style').value,
                    fanPowerEnabled: q('#sim-fanpower').checked,
                    intensity: Number(q('#sim-intensity').value),
                    variability: Number(q('#sim-variability').value),
                    gustFreq: Number(q('#sim-gustfreq').value),
                    fanLimit: Number(q('#sim-fanlimit').value),
                    minFan: Number(q('#sim-minfan').value),
                    turbSigma: Number(q('#sim-turbsigma').value),
                    turbLenScale: Number(q('#sim-turblen').value),
                    thermalStrength: Number(q('#sim-thermalstr').value),
                    thermalRadius: Number(q('#sim-thermalrad').value)
                }
            }};
            try {
                await SNW.Api.patchMotion(motionPatch);
                await SNW.Api.patchSim(motionPatch.motion.sim);
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success('시뮬레이션 설정 저장됨');
            } catch(e) { SNW.ErrorHandler.handle(e, 'sim.save'); }
        }
    };
})(window.SNW);