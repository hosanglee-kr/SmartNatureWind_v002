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
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Diagnostics = class Diagnostics {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._timers = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.diagnostics());
			SNW.I18n.applyTo(this.el);
			
			await this._refresh();
			
			// 5초 자동 갱신
			const id = setInterval(() => {
				if (!this._active) return;
				this._refresh();
			}, 5000);
			this._timers.push(id);
			
			SNW.LogUtil.info('[Diagnostics] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._timers.forEach(id => clearInterval(id));
			this._timers = [];
		}
		
		async _refresh() {
			const slot = this.el.querySelector('[data-slot="panel"]');
			if (!slot) return;
			
			try {
				const [state, diag, dirty] = await Promise.all([
					SNW.Api.getState().catch(() => null),
					SNW.Api.diag().catch(() => null),
					SNW.Api.getConfigDirty().catch(() => null)
				]);
				if (!this._active) return;
				
				const ctl = (state && state.control) || {};
				const sim = (state && state.sim) || {};
				const dg = diag || {};
				const dr = dirty || {};
				const rt = (state && state.runtime) || {};
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-diag-panel">
                        <h3>FSM</h3>
                        <div class="snw-kv"><span>state</span><b>${ctl.state || '-'}</b></div>
                        <div class="snw-kv"><span>reason</span><b>${ctl.reason || '-'}</b></div>
                        <div class="snw-kv"><span>stateCode</span><b>${ctl.stateCode != null ? ctl.stateCode : '-'}</b></div>
                        <div class="snw-kv"><span>reasonCode</span><b>${ctl.reasonCode != null ? ctl.reasonCode : '-'}</b></div>
                        <div class="snw-kv"><span>runSource</span><b>${ctl.runSource != null ? ctl.runSource : '-'}</b></div>

                        <h3>System</h3>
                        <div class="snw-kv"><span>Heap</span><b>${dg.heap != null ? dg.heap + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Used</span><b>${dg.fs_used != null ? dg.fs_used + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Total</span><b>${dg.fs_total != null ? dg.fs_total + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>Uptime</span><b>${ctl.system && ctl.system.uptimeMs != null ? SNW.TimeUtil.msToSecLabel(ctl.system.uptimeMs) : '-'}</b></div>

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

                        <h3>Runtime (NVS)</h3>
                        <div class="snw-kv"><span>runMode</span><b>${rt.runMode != null ? rt.runMode : '-'}</b></div>
                        <div class="snw-kv"><span>lastScheduleNo</span><b>${rt.lastScheduleNo != null ? rt.lastScheduleNo : '-'}</b></div>
                        <div class="snw-kv"><span>lastUserProfileNo</span><b>${rt.lastUserProfileNo != null ? rt.lastUserProfileNo : '-'}</b></div>
                    </div>`);
			} catch (e) {
				SNW.LogUtil.warn('[Diagnostics] refresh 실패', e);
			}
		}
	};
	
})(window.SNW);
