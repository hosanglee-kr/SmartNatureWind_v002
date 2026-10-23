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
            SNW.DomUtil.delegate(this.el, '[data-action="test-api"]', 'click', () => this._onTestApi());
        }
        unmount(){ this._active = false; }

        async _loadSystem() {
            try {
                const data = await SNW.Api.getSystem();
                const sys = (data && data.system) || {};
                const hw = sys.hw || {};
                const logCfg = (sys.system && sys.system.logging) || {};
                const ws = (sys.system && sys.system.webSocket) || {};
                const sec = sys.security || {};
                const meta = sys.meta || {};
                
                // 1. Meta + Logging + Security
                this.el.querySelector('[data-slot="form-log"]').innerHTML = `
                    <div class="snw-form-row"><label>Device Name</label><input type="text" id="meta-deviceName" value="${meta.deviceName || 'SmartNatureWind'}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Log Level</label>
                        <select id="log-level" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            <option value="INFO" ${logCfg.level==='INFO'?'selected':''}>INFO</option>
                            <option value="DEBUG" ${logCfg.level==='DEBUG'?'selected':''}>DEBUG</option>
                            <option value="WARN" ${logCfg.level==='WARN'?'selected':''}>WARN</option>
                            <option value="ERROR" ${logCfg.level==='ERROR'?'selected':''}>ERROR</option>
                        </select>
                    </div>
                    <div class="snw-form-row"><label>Log Max Entries</label><input type="number" id="log-maxEntries" value="${logCfg.maxEntries || 300}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>API Key</label><input type="password" id="api-key" value="${sec.apiKey || ''}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Gemini API Key</label><input type="password" id="gemini-key" value="${sec.geminiApiKey || ''}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-toolbar"><button type="button" class="snw-btn" data-action="test-api">API Key 테스트</button></div>
                `;

                // 2. WebSocket 채널 설정
                const wsCh = ws.wsChConfig || [];
                const wsEtc = ws.wsEtcConfig || {};
                let wsHtml = `<h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">WebSocket 채널 설정</h3>`;
                wsCh.forEach((ch, idx) => {
                    wsHtml += `
                        <div style="display:flex;gap:8px;margin-bottom:4px;align-items:center;font-size:12px;">
                            <span style="width:70px;color:var(--snw-text-dim);">${ch.chName || 'ch'+idx}</span>
                            <input type="number" value="${ch.chIntervalMs}" placeholder="Interval(ms)" style="flex:1;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);" data-ws-itv="${idx}">
                            <input type="number" value="${ch.priority}" placeholder="Priority" style="flex:1;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);" data-ws-prio="${idx}">
                        </div>
                    `;
                });
                wsHtml += `
                    <div class="snw-form-row"><label>Chart Large Bytes</label><input type="number" id="ws-chartLarge" value="${wsEtc.chartLargeBytes || 3500}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Chart Throttle Mul</label><input type="number" id="ws-chartThrottle" value="${wsEtc.chartThrottleMul || 2}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>WS Cleanup (ms)</label><input type="number" id="ws-cleanup" value="${wsEtc.wsCleanupMs || 10000}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                `;
                this.el.querySelector('[data-slot="form-ws"]').innerHTML = wsHtml;

                // 3. 하드웨어 (모든 필드)
                const pwm = hw.fanPwm || {};
                const curve = hw.fanConfig || {};
                const pir = hw.pir || {};
                const dht = hw.tempHum || {};
                const led = hw.led || {};

                this.el.querySelector('[data-slot="form-hw"]').innerHTML = `
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Fan PWM</h3>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-pwm-pin" value="${pwm.pin || 6}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Channel</label><input type="number" id="hw-pwm-ch" value="${pwm.channel ?? 0}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Frequency (Hz)</label><input type="number" id="hw-pwm-freq" value="${pwm.freq || 25000}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Resolution (bits)</label><input type="number" id="hw-pwm-res" value="${pwm.res ?? 10}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Fan Curve (%)</h3>
                    <div class="snw-form-row"><label>Start</label><input type="number" id="hw-fan-start" value="${curve.startPercentMin || 18}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Comfort Min</label><input type="number" id="hw-fan-cmin" value="${curve.comfortPercentMin || 22}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Comfort Max</label><input type="number" id="hw-fan-cmax" value="${curve.comfortPercentMax || 65}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Hard Max</label><input type="number" id="hw-fan-hmax" value="${curve.hardPercentMax || 90}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">PIR Sensor</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-pir-enabled" ${pir.enabled?'checked':''}> <label for="hw-pir-enabled" style="margin:0;">Enabled</label>
                    </div>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-pir-pin" value="${pir.pin || 13}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Debounce (sec)</label><input type="number" id="hw-pir-debounce" value="${pir.debounceSec || 5}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Hold (sec)</label><input type="number" id="hw-pir-hold" value="${pir.holdSec || 120}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>

                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">DHT22 Sensor</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-dht-enabled" ${dht.enabled?'checked':''}> <label for="hw-dht-enabled" style="margin:0;">Enabled</label>
                    </div>
                    <div class="snw-form-row"><label>Type</label><input type="text" id="hw-dht-type" value="${dht.type || 'DHT22'}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-dht-pin" value="${dht.pin || 17}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Interval (sec)</label><input type="number" id="hw-dht-int" value="${dht.intervalSec || 30}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Status LED</h3>
                    <div class="snw-form-row"><label>Pin</label><input type="number" id="hw-led-pin" value="${led.pin || 48}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Num Pixels</label><input type="number" id="hw-led-num" value="${led.numPixels || 1}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Brightness (0~255)</label><input type="number" id="hw-led-bright" value="${led.defaultBrightness || 20}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                `;
            } catch (e) { console.error(e); }
        }

        async _onSave() {
            const q = sel => this.el.querySelector(sel);
            const wsChArr = [];
            this.el.querySelectorAll('[data-ws-itv]').forEach(el => {
                const idx = Number(el.getAttribute('data-ws-itv'));
                const prio = Number(q(`[data-ws-prio="${idx}"]`).value);
                wsChArr.push({ chIdx: idx, chIntervalMs: Number(el.value), priority: prio });
            });

            const patch = {
                meta: { deviceName: q('#meta-deviceName').value },
                system: { 
                    logging: { level: q('#log-level').value, maxEntries: Number(q('#log-maxEntries').value) },
                    webSocket: {
                        wsChConfig: wsChArr,
                        wsEtcConfig: {
                            chartLargeBytes: Number(q('#ws-chartLarge').value),
                            chartThrottleMul: Number(q('#ws-chartThrottle').value),
                            wsCleanupMs: Number(q('#ws-cleanup').value)
                        }
                    }
                },
                security: { apiKey: q('#api-key').value, geminiApiKey: q('#gemini-key').value },
                hw: {
                    fanPwm: { pin: Number(q('#hw-pwm-pin').value), channel: Number(q('#hw-pwm-ch').value), freq: Number(q('#hw-pwm-freq').value), res: Number(q('#hw-pwm-res').value) },
                    fanConfig: {
                        startPercentMin: Number(q('#hw-fan-start').value),
                        comfortPercentMin: Number(q('#hw-fan-cmin').value),
                        comfortPercentMax: Number(q('#hw-fan-cmax').value),
                        hardPercentMax: Number(q('#hw-fan-hmax').value)
                    },
                    pir: { enabled: q('#hw-pir-enabled').checked, pin: Number(q('#hw-pir-pin').value), debounceSec: Number(q('#hw-pir-debounce').value), holdSec: Number(q('#hw-pir-hold').value) },
                    tempHum: { enabled: q('#hw-dht-enabled').checked, type: q('#hw-dht-type').value, pin: Number(q('#hw-dht-pin').value), intervalSec: Number(q('#hw-dht-int').value) },
                    led: { pin: Number(q('#hw-led-pin').value), numPixels: Number(q('#hw-led-num').value), defaultBrightness: Number(q('#hw-led-bright').value) }
                }
            };
            try {
                await SNW.Api.patchSystem(patch);
                await SNW.Api.saveConfig();
                if (!window.SNW_OFFLINE) await SNW.Api.reload();
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch(e) { SNW.ErrorHandler.handle(e, 'settings.save'); }
        }

        async _onTestApi() {
            try {
                const res = await SNW.Api.getState();
                SNW.ToastUtil.success('API Key 검증 성공');
            } catch(e) { SNW.ToastUtil.error('API Key 검증 실패: ' + (e.message || 'HTTP 401')); }
        }

        async _onFactoryReset() {
            const content = document.createElement('div');
            content.textContent = '정말 공장 초기화 하시겠습니까? 모든 설정이 삭제됩니다.';
            content.style.cssText = 'color:var(--snw-error);padding:12px 0;';
            SNW.UI.modal('⚠️ 경고', content, async () => {
                try { await SNW.Api.factoryReset(); SNW.ToastUtil.success('기기가 재시작됩니다...'); return true; } catch(e) { return false; }
            });
        }
    };
})(window.SNW);
