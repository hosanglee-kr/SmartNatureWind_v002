/*
 * ------------------------------------------------------
 * 소스명   : 300.page.info.js
 * 모듈     : SNW.Page.Info
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 버전 정보 (GET /version)
 *  - 시스템 정보 (GET /diag)
 *  - 매뉴얼 링크 안내
 * ------------------------------------------------------
 */
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
				const [v, d] = await Promise.all([
					SNW.Api.version().catch(() => null),
					SNW.Api.diag().catch(() => null)
				]);
				if (!this._active) return;
				
				const ver = v || {};
				const diag = d || {};
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-info-panel">
                        <h3>Version</h3>
                        <div class="snw-kv"><span>fw</span><b>${ver.fw || '-'}</b></div>
                        <div class="snw-kv"><span>control</span><b>${ver.control || '-'}</b></div>
                        <div class="snw-kv"><span>config</span><b>${ver.config || '-'}</b></div>
                        <div class="snw-kv"><span>api</span><b>${ver.api || '-'}</b></div>
                        <div class="snw-kv"><span>simul</span><b>${ver.simul || '-'}</b></div>
                        <h3>System</h3>
                        <div class="snw-kv"><span>Heap Free</span><b>${diag.heap != null ? diag.heap + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Used</span><b>${diag.fs_used != null ? diag.fs_used + ' B' : '-'}</b></div>
                        <div class="snw-kv"><span>FS Total</span><b>${diag.fs_total != null ? diag.fs_total + ' B' : '-'}</b></div>
                    </div>`);
			} catch (e) {
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`<div class="snw-error">${SNW.I18n.t('msg.unknown')}</div>`);
			}
			
			SNW.LogUtil.info('[Info] mount 완료');
		}
		
		unmount() {
			this._active = false;
		}
	};
	
})(window.SNW);
