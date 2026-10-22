/*
 * ------------------------------------------------------
 * 소스명   : 240.page.settings.js
 * 모듈     : SNW.Page.Settings
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 로그 레벨 / API Key / 하드웨어 팬 PWM 편집 (스키마 폼)
 *  - Save → Reload 순서 강제
 *  - 공장 초기화 (POST /control/factoryReset)
 *  - Reload 폴링 (오프라인 시 즉시 반환)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Settings = class Settings {
        constructor(container) { 
            this.el = container; 
            this._active = true; 
            this._timers = []; 
            this._formLog = null; 
            this._formApi = null;
            this._formHw = null;
        }
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.settings());
            SNW.I18n.applyTo(this.el);
            await this._loadSystem();
            SNW.DomUtil.delegate(this.el, '[data-action="save"]', 'click', () => this._onSave());
            SNW.DomUtil.delegate(this.el, '[data-action="reload"]', 'click', () => this._onReload());
            SNW.DomUtil.delegate(this.el, '[data-action="factory-reset"]', 'click', () => this._onFactoryReset());
        }
        unmount(){ this._active = false; this._timers.forEach(id => clearTimeout(id)); this._timers = []; }

        async _loadSystem() {
            try {
                const data = await SNW.Api.getSystem();
                if (!this._active) return;
                const sys = (data && data.system) || {};
                const logCfg = (sys.system && sys.system.logging) || {};
                const sec = sys.security || {};
                const hw = sys.hw || {};
                
                this._formLog = SNW.UI.form({ root:this.el.querySelector('[data-slot="form-log"]'),
                    schema:[
                        { key:'level', labelKey:'system.logLevel', type:'select', options:[{value:'NONE',labelKey:'log.none'},{value:'ERROR',labelKey:'log.error'},{value:'WARN',labelKey:'log.warn'},{value:'INFO',labelKey:'log.info'},{value:'DEBUG',labelKey:'log.debug'}] },
                        { key:'maxEntries', labelKey:'log.level', type:'number', min:50, max:500 }
                    ], value:{ level:logCfg.level || 'INFO', maxEntries:logCfg.maxEntries || 300 } });
                
                this._formApi = SNW.UI.form({ root:this.el.querySelector('[data-slot="form-api"]'),
                    schema:[{ key:'apiKey', labelKey:'system.apiKey', type:'password' }, { key:'geminiApiKey', labelKey:'system.geminiKey', type:'password' }],
                    value:{ apiKey:sec.apiKey || '', geminiApiKey:sec.geminiApiKey || '' } });

                // [신규] 하드웨어(팬 PWM) 설정 폼
                const fanPwm = hw.fanPwm || { pin: 6, channel: 0, freq: 25000, res: 10 };
                const fanCfg = hw.fanConfig || { startPercentMin: 18, comfortPercentMin: 22, comfortPercentMax: 65, hardPercentMax: 90 };
                this._formHw = SNW.UI.form({ root:this.el.querySelector('[data-slot="form-hw"]'),
                    schema:[
                        { key:'fanPin', labelKey:'Fan PWM Pin', type:'number' },
                        { key:'fanFreq', labelKey:'Fan Frequency (Hz)', type:'number' },
                        { key:'fanStart', labelKey:'Start % (시동)', type:'number' },
                        { key:'fanComfortMin', labelKey:'Comfort Min % (편안)', type:'number' },
                        { key:'fanComfortMax', labelKey:'Comfort Max % (편안)', type:'number' },
                        { key:'fanHardMax', labelKey:'Hard Max % (최대)', type:'number' }
                    ], value:{
                        fanPin: fanPwm.pin, fanFreq: fanPwm.freq,
                        fanStart: fanCfg.startPercentMin, fanComfortMin: fanCfg.comfortPercentMin,
                        fanComfortMax: fanCfg.comfortPercentMax, fanHardMax: fanCfg.hardPercentMax
                    } });

                SNW.I18n.applyTo(this.el);
            } catch (e) { SNW.ErrorHandler.handle(e, 'settings.loadSystem'); }
        }

        async _onSave() {
            if (!this._formLog || !this._formApi || !this._formHw) return;
            const logVal = this._formLog.getValue(); 
            const apiVal = this._formApi.getValue();
            const hwVal = this._formHw.getValue();
            
            const patch = { 
                system:{ logging:{ level:logVal.level, maxEntries:Number(logVal.maxEntries) } }, 
                security:{ apiKey:apiVal.apiKey || '', geminiApiKey:apiVal.geminiApiKey || '' },
                hw: {
                    fanPwm: { pin: Number(hwVal.fanPin), freq: Number(hwVal.fanFreq) },
                    fanConfig: {
                        startPercentMin: Number(hwVal.fanStart),
                        comfortPercentMin: Number(hwVal.fanComfortMin),
                        comfortPercentMax: Number(hwVal.fanComfortMax),
                        hardPercentMax: Number(hwVal.fanHardMax)
                    }
                }
            };
            try {
                await SNW.Api.patchSystem(patch);
                await SNW.Api.saveConfig();
                await SNW.Api.reload();
                const ok = await this._waitReloadComplete();
                if (ok) { SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess')); if (apiVal.apiKey) SNW.Api.setApiKey(apiVal.apiKey); }
                else SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
            } catch (e) { SNW.ErrorHandler.handle(e, 'settings.save'); }
        }

        async _onReload() {
            try {
                await SNW.Api.reload();
                const ok = await this._waitReloadComplete();
                if (ok) SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess')); else SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
            } catch (e) { SNW.ErrorHandler.handle(e, 'settings.reload'); }
        }

        // [신규] 공장 초기화
        async _onFactoryReset() {
            const content = document.createElement('div');
            content.textContent = '정말 공장 초기화 하시겠습니까? 모든 설정이 삭제되고 기기가 재시작됩니다.';
            content.style.cssText = 'color:var(--snw-error);padding:12px 0;';
            SNW.UI.modal('⚠️ 공장 초기화', content, async () => {
                try {
                    await SNW.Api.factoryReset();
                    SNW.ToastUtil.success('기기가 재시작됩니다...');
                    return true;
                } catch(e) {
                    SNW.ErrorHandler.handle(e, 'settings.factoryReset');
                    return false;
                }
            });
        }

        async _waitReloadComplete() {
            // [추가] 오프라인 모드에서는 대기 없이 즉시 완료 처리
            if (window.SNW_OFFLINE) return true;

            const start = Date.now(); const timeout = SNW.C.RELOAD.POLL_TIMEOUT_MS; const interval = SNW.C.RELOAD.POLL_INTERVAL_MS;
            while (Date.now() - start < timeout) {
                if (!this._active) return false;
                try { const st = await SNW.Api.getState(); const ctl = st.control || {}; if (ctl.pendingReload === false) return ctl.lastReloadOk !== false; } catch {}
                await new Promise(r => setTimeout(r, interval));
            }
            return false;
        }
    };
})(window.SNW);
