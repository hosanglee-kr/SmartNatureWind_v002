// =========================================================
// 300.page.info.js — SNW.Page.Info
// Layer 4 (페이지 로직)
// [P1-16] 정보 확장 (Hostname/MAC/IP/Uptime + 매뉴얼 링크)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Info = class Info {
		constructor(container) {
			this.el = container;
			this._active = true;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.info());
			SNW.I18n.applyTo(this.el);
			
			const slot = this.el.querySelector('[data-slot="panel"]');
			
			try {
				const [v, d, wifi] = await Promise.all([
					SNW.Api.version().catch(() => null),
					SNW.Api.diag().catch(() => null),
					SNW.Api.getWifiState().catch(() => null)
				]);
				if (!this._active) return;
				
				const ver = v || {};
				const diag = d || {};
				const state = (wifi && wifi.wifi && wifi.wifi.state) || {};
				const sys = SNW.Store.get().system || {};
				const esc = SNW.DomUtil.escape;
				
				// Uptime 포맷
				const uptimeSec = sys.uptimeMs ? Math.floor(sys.uptimeMs / 1000) : 0;
				const uptimeStr = uptimeSec > 3600 ?
					`${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m` :
					`${Math.floor(uptimeSec / 60)}m ${uptimeSec % 60}s`;
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-info-panel">
                        <h3>Version</h3>
                        <div class="snw-kv"><span>fw</span><b>${esc(ver.fw || '-')}</b></div>
                        <div class="snw-kv"><span>control</span><b>${esc(ver.control || '-')}</b></div>
                        <div class="snw-kv"><span>config</span><b>${esc(ver.config || '-')}</b></div>
                        <div class="snw-kv"><span>api</span><b>${esc(ver.api || '-')}</b></div>
                        <div class="snw-kv"><span>simul</span><b>${esc(ver.simul || '-')}</b></div>

                        <h3>Device</h3>
                        <div class="snw-kv"><span>Hostname</span><b>${esc(state.hostname || '-')}</b></div>
                        <div class="snw-kv"><span>MAC</span><b>${esc(state.mac || '-')}</b></div>
                        <div class="snw-kv"><span>IP</span><b>${esc(state.ip || '-')}</b></div>
                        <div class="snw-kv"><span>Uptime</span><b>${uptimeStr}</b></div>

                        <h3>System</h3>
                        <div class="snw-kv"><span>Heap Free</span><b>${diag.heap != null ? diag.heap + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Used</span><b>${diag.fs_used != null ? diag.fs_used + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Total</span><b>${diag.fs_total != null ? diag.fs_total + ' B' : '-'}</b></div>

                        <h3>Support</h3>
                        <div style="padding: 8px 0;">
                            <a href="/UserManual_0202_001.md" target="_blank"
                               style="color: var(--snw-primary); text-decoration: underline;">
                                📖 사용자 매뉴얼 열기
                            </a>
                        </div>
                    </div>`);
			} catch (e) {
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`<div class="snw-error">${SNW.I18n.t('msg.unknown')}</div>`);
			}
			
			SNW.LogUtil.info('[Info] mount 완료');
		}
		
		unmount() { this._active = false; }
	};
})(window.SNW);
