/*
 * ------------------------------------------------------
 * 소스명   : 240.page.settings.js
 * 모듈     : SNW.Page.Settings
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 로그 레벨 / API Key 편집 (스키마 폼)
 *  - Save → Reload 순서 강제 (SNW.CfgFlow.patchAndApply 사용)
 *  - Reload 폴링 (pendingReload → false)
 * 의존성   : SNW.UI.form, SNW.Api, SNW.ConfigFlow(v0202 예정)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Settings = class Settings {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._timers = [];
			this._formLog = null;
			this._formApi = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.settings());
			SNW.I18n.applyTo(this.el);
			
			await this._loadSystem();
			
			// Save 버튼
			SNW.DomUtil.delegate(this.el, '[data-action="save"]', 'click', () => this._onSave());
			// Reload 버튼
			SNW.DomUtil.delegate(this.el, '[data-action="reload"]', 'click', () => this._onReload());
			
			SNW.LogUtil.info('[Settings] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._timers.forEach(id => clearTimeout(id));
			this._timers = [];
		}
		
		async _loadSystem() {
			try {
				const data = await SNW.Api.getSystem();
				if (!this._active) return;
				
				const sys = (data && data.system) || {};
				const logCfg = (sys.system && sys.system.logging) || {};
				const sec = sys.security || {};
				
				this._formLog = SNW.UI.form({
					root: this.el.querySelector('[data-slot="form-log"]'),
					schema: [
						{
							key: 'level',
							labelKey: 'system.logLevel',
							type: 'select',
							options: [
								{ value: 'NONE', labelKey: 'log.none' },
								{ value: 'ERROR', labelKey: 'log.error' },
								{ value: 'WARN', labelKey: 'log.warn' },
								{ value: 'INFO', labelKey: 'log.info' },
								{ value: 'DEBUG', labelKey: 'log.debug' }
							]
						},
						{ key: 'maxEntries', labelKey: 'log.level', type: 'number', min: 50, max: 500 }
					],
					value: {
						level: logCfg.level || 'INFO',
						maxEntries: logCfg.maxEntries || 300
					}
				});
				
				this._formApi = SNW.UI.form({
					root: this.el.querySelector('[data-slot="form-api"]'),
					schema: [
						{ key: 'apiKey', labelKey: 'system.apiKey', type: 'password' },
						{ key: 'geminiApiKey', labelKey: 'system.geminiKey', type: 'password' }
					],
					value: {
						apiKey: sec.apiKey || '',
						geminiApiKey: sec.geminiApiKey || ''
					}
				});
				
				SNW.I18n.applyTo(this.el);
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'settings.loadSystem');
			}
		}
		
		// -------------------------------------------------
		// Save → Reload 순서 (Settings은 명시적 저장)
		// -------------------------------------------------
		async _onSave() {
			if (!this._formLog || !this._formApi) return;
			
			const logVal = this._formLog.getValue();
			const apiVal = this._formApi.getValue();
			
			const patch = {
				system: {
					logging: {
						level: logVal.level,
						maxEntries: Number(logVal.maxEntries)
					}
				},
				security: {
					apiKey: apiVal.apiKey || '',
					geminiApiKey: apiVal.geminiApiKey || ''
				}
			};
			
			try {
				// 1) patch (메모리만)
				await SNW.Api.patchSystem(patch);
				// 2) save (디스크)
				await SNW.Api.saveConfig();
				// 3) reload (런타임 재적용)
				await SNW.Api.reload();
				
				// 4) reload 완료 폴링
				const ok = await this._waitReloadComplete();
				if (ok) {
					SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess'));
					// API Key가 변경되었으면 localStorage도 갱신
					if (apiVal.apiKey) SNW.Api.setApiKey(apiVal.apiKey);
				} else {
					SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
				}
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'settings.save');
			}
		}
		
		async _onReload() {
			try {
				await SNW.Api.reload();
				const ok = await this._waitReloadComplete();
				if (ok) SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess'));
				else SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'settings.reload');
			}
		}
		
		async _waitReloadComplete() {
			const start = Date.now();
			const timeout = SNW.C.RELOAD.POLL_TIMEOUT_MS;
			const interval = SNW.C.RELOAD.POLL_INTERVAL_MS;
			
			while (Date.now() - start < timeout) {
				if (!this._active) return false;
				try {
					const st = await SNW.Api.getState();
					const ctl = st.control || {};
					if (ctl.pendingReload === false) {
						return ctl.lastReloadOk !== false;
					}
				} catch {}
				await new Promise(r => setTimeout(r, interval));
			}
			return false;
		}
	};
	
})(window.SNW);
