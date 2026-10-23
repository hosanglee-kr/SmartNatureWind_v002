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
/* ---- 240.page.settings.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Settings = class Settings {
        constructor(container) { this.el = container; this._active = true; }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.settings());
            SNW.I18n.applyTo(this.el);
            await this._loadSystem();

            SNW.DomUtil.delegate(this.el, '[data-action="save"]', 'click', () => this._onSave());
            SNW.DomUtil.delegate(this.el, '[data-action="factory-reset"]', 'click', () => this._onFactoryReset());
        }
        unmount(){ this._active = false; }

        async _loadSystem() {
            try {
                const data = await SNW.Api.getSystem();
                const sys = (data && data.system) || {};
                const hw = sys.hw || {};
                const logCfg = (sys.system && sys.system.logging) || {};
                const sec = sys.security || {};
                
                // 1. 로그/보안
                this.el.querySelector('[data-slot="form-log"]').innerHTML = `
                    <div class="snw-form-row"><label>Log Level</label>
                        <select id="log-level" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            <option value="INFO" ${logCfg.level==='INFO'?'selected':''}>INFO</option>
                            <option value="DEBUG" ${logCfg.level==='DEBUG'?'selected':''}>DEBUG</option>
                            <option value="WARN" ${logCfg.level==='WARN'?'selected':''}>WARN</option>
                            <option value="ERROR" ${logCfg.level==='ERROR'?'selected':''}>ERROR</option>
                        </select>
                    </div>
                    <div class="snw-form-row"><label>API Key</label><input type="password" id="api-key" value="${sec.apiKey || ''}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Gemini API Key</label><input type="password" id="gemini-key" value="${sec.geminiApiKey || ''}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                `;

                // 2. 하드웨어 (모든 세부 항목)
                const pwm = hw.fanPwm || {};
                const curve = hw.fanConfig || {};
                const pir = hw.pir || {};
                const dht = hw.tempHum || {};
                const led = hw.led || {};

                this.el.querySelector('[data-slot="form-hw"]').innerHTML = `
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Fan PWM</h3>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-pwm-pin" value="${pwm.pin || 6}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Frequency (Hz)</label><input type="number" id="hw-pwm-freq" value="${pwm.freq || 25000}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Fan Curve (%)</h3>
                    <div class="snw-form-row"><label>Start (시동)</label><input type="number" id="hw-fan-start" value="${curve.startPercentMin || 18}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Comfort Min (편안 시작)</label><input type="number" id="hw-fan-cmin" value="${curve.comfortPercentMin || 22}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Comfort Max (편안 끝)</label><input type="number" id="hw-fan-cmax" value="${curve.comfortPercentMax || 65}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Hard Max (최대)</label><input type="number" id="hw-fan-hmax" value="${curve.hardPercentMax || 90}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">PIR Sensor</h3>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-pir-pin" value="${pir.pin || 13}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Hold (sec)</label><input type="number" id="hw-pir-hold" value="${pir.holdSec || 120}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>

                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">DHT22 Sensor</h3>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-dht-pin" value="${dht.pin || 17}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Interval (sec)</label><input type="number" id="hw-dht-int" value="${dht.intervalSec || 30}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Status LED</h3>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-led-pin" value="${led.pin || 48}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Brightness (0~255)</label><input type="number" id="hw-led-bright" value="${led.defaultBrightness || 20}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                `;
            } catch (e) { console.error(e); }
        }
        
        async _onSave() {
            const patch = {
                system: { logging: { level: this.el.querySelector('#log-level').value } },
                security: {
                    apiKey: this.el.querySelector('#api-key').value,
                    geminiApiKey: this.el.querySelector('#gemini-key').value
                },
                hw: {
                    fanPwm: {
                        pin: Number(this.el.querySelector('#hw-pwm-pin').value),
                        freq: Number(this.el.querySelector('#hw-pwm-freq').value)
                    },
                    fanConfig: {
                        startPercentMin: Number(this.el.querySelector('#hw-fan-start').value),
                        comfortPercentMin: Number(this.el.querySelector('#hw-fan-cmin').value),
                        comfortPercentMax: Number(this.el.querySelector('#hw-fan-cmax').value),
                        hardPercentMax: Number(this.el.querySelector('#hw-fan-hmax').value)
                    },
                    pir: {
                        pin: Number(this.el.querySelector('#hw-pir-pin').value),
                        holdSec: Number(this.el.querySelector('#hw-pir-hold').value)
                    },
                    tempHum: {
                        pin: Number(this.el.querySelector('#hw-dht-pin').value),
                        intervalSec: Number(this.el.querySelector('#hw-dht-int').value)
                    },
                    led: {
                        pin: Number(this.el.querySelector('#hw-led-pin').value),
                        defaultBrightness: Number(this.el.querySelector('#hw-led-bright').value)
                    }
                }
            };
            try {
                await SNW.Api.patchSystem(patch);
                await SNW.Api.saveConfig();
                await SNW.Api.reload(); // [복구] reload 추가
                const ok = await this._waitReloadComplete(); // [복구] 대기
                if (ok) SNW.ToastUtil.success(SNW.I18n.t('msg.reloadSuccess'));
                else SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadFail'));
            } catch (e) { SNW.ErrorHandler.handle(e, 'settings.save'); }
        }
        
        async _waitReloadComplete() {
            if (window.SNW_OFFLINE) return true; // 오프라인 즉시 완료
            const start = Date.now();
            const timeout = SNW.C.RELOAD.POLL_TIMEOUT_MS;
            const interval = SNW.C.RELOAD.POLL_INTERVAL_MS;
            while (Date.now() - start < timeout) {
                if (!this._active) return false;
                try {
                    const st = await SNW.Api.getState();
                    const ctl = st.control || {};
                    if (ctl.pendingReload === false) return ctl.lastReloadOk !== false;
                } catch {}
                await new Promise(r => setTimeout(r, interval));
            }
            return false;
        }

        async _onFactoryReset() {
            const content = document.createElement('div');
            content.textContent = '정말 공장 초기화 하시겠습니까? 모든 설정이 삭제됩니다.';
            content.style.cssText = 'color:var(--snw-error);padding:12px 0;';
            SNW.UI.modal('⚠️ 경고', content, async () => {
                try {
                    await SNW.Api.factoryReset();
                    SNW.ToastUtil.success('기기가 재시작됩니다...');
                    return true;
                } catch(e) { return false; }
            });
        }
    };
})(window.SNW);

