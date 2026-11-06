/*
 * ------------------------------------------------------
 * 소스명   : 270.page.network.js
 * 모듈     : SNW.Page.Network
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - Wi-Fi 상태 조회 (mode/ssid/ip/rssi)
 *  - Wi-Fi 스캔 (주변 AP 목록)
 *  - NTP 설정 (서버/시간대/주기)
 *  - Save → Reload 순서 강제
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Network = class Network {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._timers = [];
			this._formTime = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.network());
			SNW.I18n.applyTo(this.el);
			
			// 상태 + 스캔 병렬 로드 (스캔은 실패 허용)
			await Promise.all([
				this._loadState(),
				this._loadSystemTime()
			]);
			
			SNW.DomUtil.delegate(this.el, '[data-action="scan"]', 'click', () => this._onScan());
			SNW.DomUtil.delegate(this.el, '[data-action="time-save"]', 'click', () => this._onSaveTime());
			
			SNW.LogUtil.info('[Network] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._timers.forEach(id => clearTimeout(id));
			this._timers = [];
		}
		
		async _loadState() {
			const slot = this.el.querySelector('[data-slot="form"]');
			if (!slot) return;
			
			let state = {};
			try {
				const data = await SNW.Api.getWifiState();
				state = (data && data.wifi && data.wifi.state) || {};
			} catch (e) {
				SNW.LogUtil.warn('[Network] wifi state 로드 실패', e);
			}
			
			if (!this._active) return;
			
			slot.innerHTML = '';
			slot.appendChild(SNW.DomUtil.html`
                <div class="snw-network-state">
                    <div class="snw-kv">
                        <span data-i18n="network.wifiMode">Wi-Fi 모드</span>
                        <b>${state.mode_name || '-'}</b>
                    </div>
                    <div class="snw-kv">
                        <span data-i18n="network.ssid">SSID</span>
                        <b>${state.ssid || '-'}</b>
                    </div>
                    <div class="snw-kv">
                        <span data-i18n="network.ip">IP</span>
                        <b>${state.ip || '-'}</b>
                    </div>
                    <div class="snw-kv">
                        <span data-i18n="network.rssi">RSSI</span>
                        <b>${state.rssi != null ? state.rssi + ' dBm' : '-'}</b>
                    </div>
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn" data-action="scan"
                                data-i18n="network.scan">Wi-Fi 스캔</button>
                    </div>
                    <div data-slot="scan-result" class="snw-scan-result"></div>
                </div>`);
			SNW.I18n.applyTo(slot);
		}
		
		async _loadSystemTime() {
			try {
				const data = await SNW.Api.getSystem();
				if (!this._active) return;
				const sys = (data && data.system && data.system.timeCfg) || {};
				
				this._formTime = SNW.UI.form({
					root: this.el.querySelector('[data-slot="form"]'),
					schema: [
						{ key: 'ntpServer', labelKey: 'network.ntpServer', type: 'text' },
						{ key: 'timezone', labelKey: 'network.timezone', type: 'text' },
						{ key: 'syncIntervalMin', labelKey: 'network.syncInterval', type: 'number', min: 5, max: 1440 }
					],
					value: {
						ntpServer: sys.ntpServer || 'pool.ntp.org',
						timezone: sys.timezone || 'Asia/Seoul',
						syncIntervalMin: sys.syncIntervalMin || 60
					}
				});
				
				// 저장 버튼 (form 내부에 별도)
				this.el.querySelector('[data-slot="form"]').appendChild(SNW.DomUtil.html`
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="time-save" data-i18n="system.save">저장</button>
                    </div>`);
				SNW.I18n.applyTo(this.el);
			} catch (e) {
				SNW.LogUtil.warn('[Network] time config 로드 실패', e);
			}
		}
		
		async _onScan() {
			const resultSlot = this.el.querySelector('[data-slot="scan-result"]');
			if (!resultSlot) return;
			resultSlot.innerHTML = '';
			resultSlot.appendChild(SNW.DomUtil.html`
                <div class="snw-loading" data-i18n="common.loading">Loading...</div>`);
			
			try {
				const data = await SNW.Api.scanWifi();
				if (!this._active) return;
				const scan = (data && data.wifi && data.wifi.scan) || [];
				
				resultSlot.innerHTML = '';
				if (!scan.length) {
					resultSlot.appendChild(SNW.DomUtil.html`
                        <div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				} else {
					const list = document.createElement('div');
					list.className = 'snw-wifi-list';
					scan.sort((a, b) => (b.rssi || -999) - (a.rssi || -999)).forEach(ap => {
						list.appendChild(SNW.DomUtil.html`
                            <div class="snw-wifi-item">
                                <span class="snw-wifi-ssid">${ap.ssid || '-'}</span>
                                <span class="snw-wifi-enc">${ap.enc || ''}</span>
                                <span class="snw-wifi-rssi">${ap.rssi != null ? ap.rssi + ' dBm' : ''}</span>
                            </div>`);
					});
					resultSlot.appendChild(list);
				}
				SNW.I18n.applyTo(resultSlot);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'network.scan');
			}
		}
		
		async _onSaveTime() {
			if (!this._formTime) return;
			const v = this._formTime.getValue();
			
			const patch = {
				timeCfg: {
					ntpServer: v.ntpServer,
					timezone: v.timezone,
					syncIntervalMin: Number(v.syncIntervalMin)
				}
			};
			
			try {
				await SNW.Api.patchSystem(patch);
				await SNW.Api.saveConfig();
				await SNW.Api.reload();
				SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'network.saveTime');
			}
		}
	};
	
})(window.SNW);
