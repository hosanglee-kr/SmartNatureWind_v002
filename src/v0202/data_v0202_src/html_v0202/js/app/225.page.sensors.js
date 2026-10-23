/* ---- 225.page.sensors.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Sensors = class Sensors {
        constructor(container) { this.el = container; this._active = true; this._unsubs = []; }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.sensors());
            
            const unsub = SNW.Store.watch('control', ctl => {
                if (!this._active || !ctl || !ctl.sensor) return;
                const s = ctl.sensor;
                const set = (sel, val) => { const el = this.el.querySelector(sel); if (el) el.textContent = val; };
                set('[data-slot="sensor-temp"]', s.tempC != null ? s.tempC.toFixed(1) + '°C' : '-');
                set('[data-slot="sensor-hum"]', s.humidity != null ? s.humidity.toFixed(0) + '%' : '-');
                set('[data-slot="sensor-motion"]', s.motionActive ? '감지됨' : '없음');
            });
            this._unsubs.push(unsub);

            try {
                const data = await SNW.Api.getMotion();
                const m = (data && data.motion) || {};
                const pir = m.pir || { enabled: true, holdSec: 120 };
                const formSlot = this.el.querySelector('[data-slot="motion-config"]');
                if (formSlot) {
                    formSlot.innerHTML = `
                        <div class="snw-form-row" style="flex-direction:row;align-items:center;gap:8px;margin-bottom:8px;">
                            <input type="checkbox" id="m-pir-en" ${pir.enabled ? 'checked' : ''}>
                            <label for="m-pir-en" style="margin:0;">PIR 감지 활성화</label>
                        </div>
                        <div class="snw-form-row" style="margin-bottom:8px;">
                            <label>PIR Hold (초)</label>
                            <input type="number" id="m-pir-hold" value="${pir.holdSec}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        </div>
                        <div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="save-motion">모션 설정 저장</button></div>
                    `;
                }
            } catch(e) { console.error(e); }

            SNW.DomUtil.delegate(this.el, '[data-action="feed-pir"]', 'click', async () => {
                try { await SNW.Api.feedPir(true); SNW.ToastUtil.success('PIR 신호 전송'); } catch(e) { SNW.ErrorHandler.handle(e, 'sensors.pir'); }
            });
            SNW.DomUtil.delegate(this.el, '[data-action="save-motion"]', 'click', async () => {
                const en = this.el.querySelector('#m-pir-en').checked;
                const hold = Number(this.el.querySelector('#m-pir-hold').value);
                try {
                    await SNW.Api.patchMotion({ motion: { pir: { enabled: en, holdSec: hold } } });
                    await SNW.Api.saveConfig();
                    SNW.ToastUtil.success('모션 설정 저장됨');
                } catch(e) { SNW.ErrorHandler.handle(e, 'sensors.motion'); }
            });
        }
        unmount(){ this._active = false; this._unsubs.forEach(fn => fn()); }
    };
})(window.SNW);
