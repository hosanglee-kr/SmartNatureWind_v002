/*
 * ------------------------------------------------------
 * 소스명   : 260.page.firmware.js
 * 모듈     : SNW.Page.Firmware
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 현재 버전 조회 (GET /version)
 *  - OTA 확인 (GET /system/firmware/check)
 *  - OTA 업로드 (POST /fwUpdate, XHR 진행률)
 *  - LittleFS 파일 업로드 (POST /fileUpload)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Firmware = class Firmware {
		constructor(container) {
			this.el = container;
			this._active = true;
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
		
		unmount() { this._active = false; }
		
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
                        <div class="snw-kv"><span>Current</span><b>${ver.fw || '-'}</b></div>
                        <div class="snw-kv"><span>Status</span><b>${ck.status || '-'}</b></div>
                        <div class="snw-kv"><span>Latest</span><b>${ck.latest_version || '-'}</b></div>

                        <h3>OTA 업데이트</h3>
                        <input type="file" accept=".bin" data-slot="fw-file" />
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="upload-fw">업로드</button>
                        <div class="snw-progress" data-slot="fw-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-fw-fill></div></div>
                            <span data-fw-label>0%</span>
                        </div>

                        <h3>파일 업로드 (LittleFS)</h3>
                        <input type="file" data-slot="file-file" />
                        <button type="button" class="snw-btn" data-action="upload-file">업로드</button>
                        <div class="snw-progress" data-slot="file-progress" style="display:none">
                            <div class="snw-progress__bar"><div class="snw-progress__fill" data-file-fill></div></div>
                            <span data-file-label>0%</span>
                        </div>
                    </div>`);
				SNW.I18n.applyTo(slot);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.version');
			}
		}
		
		async _onUploadFw() {
			const inp = this.el.querySelector('[data-slot="fw-file"]');
			if (!inp || !inp.files || !inp.files[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="fw-progress"]');
			const fill = this.el.querySelector('[data-fw-fill]');
			const label = this.el.querySelector('[data-fw-label]');
			if (progBox) progBox.style.display = '';
			
			try {
				await SNW.Api.uploadFirmware(file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
				SNW.ToastUtil.success('OTA OK (재시작)');
				// 서버가 자동 재시작
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.upload');
			}
		}
		
		async _onUploadFile() {
			const inp = this.el.querySelector('[data-slot="file-file"]');
			if (!inp || !inp.files || !inp.files[0]) {
				SNW.ToastUtil.warn(SNW.I18n.t('common.noData'));
				return;
			}
			const file = inp.files[0];
			
			const progBox = this.el.querySelector('[data-slot="file-progress"]');
			const fill = this.el.querySelector('[data-file-fill]');
			const label = this.el.querySelector('[data-file-label]');
			if (progBox) progBox.style.display = '';
			
			try {
				await SNW.Api.uploadFile(file, (pct) => {
					if (fill) fill.style.width = (pct * 100).toFixed(0) + '%';
					if (label) label.textContent = (pct * 100).toFixed(0) + '%';
				});
				SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'firmware.file');
			}
		}
	};
	
})(window.SNW);
