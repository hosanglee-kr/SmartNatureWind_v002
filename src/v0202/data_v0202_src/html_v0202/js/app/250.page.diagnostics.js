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
                try { await SNW.Api.saveConfig(); SNW.ToastUtil.success('Dirty 저장 완료'); this._refresh(); } catch(e) { SNW.ErrorHandler.handle(e, 'diag.save'); }
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
                    <div class="snw-kv"><span>state</span><b>${ctl.state || '-'}</b></div>
                    <div class="snw-kv"><span>reason</span><b>${ctl.reason || '-'}</b></div>
                    <div class="snw-kv"><span>runSource</span><b>${ctl.runSource ?? '-'}</b></div>
                    <div class="snw-kv"><span>profileMode</span><b>${ctl.profileMode ? 'ON' : 'OFF'}</b></div>
                    
                    <h3>Metrics (실시간)</h3>
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
                SNW.UI.modal('전체 설정 JSON', content, async () => true);
            } catch(e) { SNW.ToastUtil.error('설정 조회 실패'); }
        }
    };
})(window.SNW);
