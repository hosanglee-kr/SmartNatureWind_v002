// =========================================================
// 260.page.firmware.js — SNW.Page.Firmware
// Layer 4 (페이지 로직)
// [O-10] UploadManager 위임 — 페이지 이탈에도 진행률 유지
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Firmware = class Firmware {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._uploading = false;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.firmware());
			SNW.I18n.applyTo(this.el);
			
			await this._loadVersion();
			
			SNW.DomUtil.delegate(this.el, '[data-action="upload-fw"]', 'click', () => this._onUploadFw());
			SNW.DomUtil.delegate(this.el, '[data-action="upload-file"]', 'click', () => this._onUploadFile());
			
			SNW.LogUtil.info('[Firmware] mount 완료');
		}
		
		// [O-10] 페이지 이탈 방지
		unmount() {
			if (this._uploading) {
				const ok = confirm('업로드가 진행 중입니다. 페이지를 떠나시겠습니까?\n(진행률은 백그라운드로 계속 표시됩니다)');
				if (!ok) return false;
			}
			this._active = false;
			return true;
		}
		
		async _loadVersion() {
			const slot = this.el.querySelector('[data-slot="form"]');
			if (!slot) return;
			
			try {
				const [v, chk] = await Promise.all([
					SNW.Api.version().catch(() => null),
					SNW.Api.checkFw().catch(() => null)
				]);
				if (!this._active) return;
				
				const ver = v || {};
				const ck = chk || {};
				
				slot.innerHTML = '';
				slot.appendChild(SNW.DomUtil.html`
                    <div class="snw-firmware-panel">
                        <div class="snw-kv"><span>Current</span><b>${SNW.DomUtil.escape(ver.fw || '-')}</b></div>
                        <div class="snw-kv"><span>Status</span><b>${SNW.DomUtil.escape(ck.status || '-')}</b></div>
                        <div class="snw-kv"><span>Latest</span><b>${SNW.DomUtil.escape(ck.latest_version || '-')}</b></div>

                        <h3>${SNW.I18n.t('firmware.otaUpdate')}</h3>
                        <input type="file" accept=".bin" data-slot="fw-file">
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="upload-fw">${SNW.I18n.t('firmware.uploadBtn')}</button>
                        <div class="snw-progress" data-slot="fw-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-fw-fill></div></div>
                            <span data-fw-label>0%</span>
                        </div>

                        <h3>${SNW.I18n.t('firmware.fileUpload')}</h3>
                        <input type="file" data-slot="file-file">
                        <button type="button" class="snw-btn"
                                data-action="upload-file">${SNW.I18n.t('firmware.uploadBtn')}</button>
                        <div class="snw-progress" data-slot="file-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-file-fill></div></div>
                            <span data-file-label>0%</span>
                        </div>
                    </div>
                `);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.version');
			}
		}
		
		// [O-10] UploadManager 위임
		async _onUploadFw() {
			const inp = this.el.querySelector('[data-slot="fw-file"]');
			if (!inp?.files?.[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="fw-progress"]');
			const fill = this.el.querySelector('[data-fw-fill]');
			const label = this.el.querySelector('[data-fw-label]');
			if (progBox) progBox.style.display = '';
			
			this._uploading = true;
			try {
				await SNW.UploadManager.start(`firmware-${Date.now()}`, 'firmware', file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
				// UploadManager가 toast 처리
			} catch (e) {
				// UploadManager가 ErrorHandler 처리
			} finally {
				this._uploading = false;
				if (progBox) setTimeout(() => { progBox.style.display = 'none'; }, 2000);
			}
		}
		
		async _onUploadFile() {
			const inp = this.el.querySelector('[data-slot="file-file"]');
			if (!inp?.files?.[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="file-progress"]');
			const fill = this.el.querySelector('[data-file-fill]');
			const label = this.el.querySelector('[data-file-label]');
			if (progBox) progBox.style.display = '';
			
			this._uploading = true;
			try {
				await SNW.UploadManager.start(`file-${Date.now()}`, 'file', file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
			} catch (e) {
				// UploadManager가 처리
			} finally {
				this._uploading = false;
				if (progBox) setTimeout(() => { progBox.style.display = 'none'; }, 2000);
			}
		}
	};
})(window.SNW);
