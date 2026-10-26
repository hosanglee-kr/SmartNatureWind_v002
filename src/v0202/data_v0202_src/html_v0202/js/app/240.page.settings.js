// =========================================================
// 240.page.settings.js — SNW.Page.Settings
// Layer 4 (페이지 로직)
// [P0-2] 섹션 헤더 i18n, [P0-3] Sticky 저장 바
// [O-4] 자동 재적용, [O-9] 공장 초기화 강화, [O-11] API Key 보안
// [O-18] 범위 힌트 + 클라이언트 검증
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    function nz(v, fallback) {
        return (v === null || v === undefined) ? fallback : v;
    }

    function asBool(v) {
        return v === true || v === 1 || v === '1' || v === 'true';
    }

    SNW.Page.Settings = class Settings {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._wsChBaseline = [];
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.settings());
            SNW.I18n.applyTo(this.el);

            await this._loadSystem();
            if (!this._active) return;

            SNW.DomUtil.delegate(this.el, '[data-action="save"]',          'click', () => this._onSave());
            SNW.DomUtil.delegate(this.el, '[data-action="reload"]',        'click', () => this._onReload());
            SNW.DomUtil.delegate(this.el, '[data-action="test-api"]',      'click', () => this._onTestApi());
            SNW.DomUtil.delegate(this.el, '[data-action="factory-reset"]', 'click', () => this._onFactoryReset());
        }

        unmount() { this._active = false; }

        // =========================================================
        // _loadSystem : 폼 렌더
        // =========================================================
        async _loadSystem() {
            try {
                const data = await SNW.Api.getSystem();
                if (!this._active) return;

                const sys    = (data && data.system) || {};
                const hw     = sys.hw || {};
                const logCfg = (sys.system && sys.system.logging) || {};
                const ws     = (sys.system && sys.system.webSocket) || {};
                const sec    = sys.security || {};
                const meta   = sys.meta || {};

                const esc = SNW.DomUtil.escape;
                const T = SNW.I18n.t.bind(SNW.I18n);

                const apiKeySet    = typeof sec.apiKey       === 'string' && sec.apiKey.length       > 0;
                const geminiKeySet = typeof sec.geminiApiKey === 'string' && sec.geminiApiKey.length > 0;

                // ---------- 1. Meta + Logging + Security ----------
                const logSlot = this.el.querySelector('[data-slot="form-log"]');
                if (!logSlot) return;
                logSlot.innerHTML = `
                    <h3 class="snw-form-section">${T('settings.secMeta')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldDeviceName')}</label>
                        <input type="text" id="meta-deviceName" value="${esc(nz(meta.deviceName, 'SmartNatureWind'))}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldLogLevel')}</label>
                        <select id="log-level" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            <option value="INFO"  ${logCfg.level === 'INFO'  ? 'selected' : ''}>INFO</option>
                            <option value="DEBUG" ${logCfg.level === 'DEBUG' ? 'selected' : ''}>DEBUG</option>
                            <option value="WARN"  ${logCfg.level === 'WARN'  ? 'selected' : ''}>WARN</option>
                            <option value="ERROR" ${logCfg.level === 'ERROR' ? 'selected' : ''}>ERROR</option>
                        </select>
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldLogMax')}</label>
                        <input type="number" id="log-maxEntries" min="10" max="1000"
                               value="${nz(logCfg.maxEntries, 300)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <small class="snw-form-row__hint">${T('settings.fieldRange', {min:10, max:1000})}</small>
                    </div>

                    <div class="snw-form-row">
                        <label>API Key ${apiKeySet
                            ? `<span style="color:var(--snw-success);font-size:11px;">${T('settings.configured')}</span>`
                            : `<span style="color:var(--snw-text-dim);font-size:11px;">${T('settings.notConfigured')}</span>`}</label>
                        <input type="password" id="api-key" value=""
                               autocomplete="off"
                               data-lpignore="true"
                               data-1p-ignore="true"
                               spellcheck="false"
                               placeholder="${apiKeySet ? T('settings.keyPlaceholderChange') : T('settings.keyPlaceholderInput')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <label style="font-size:11px;margin-top:4px;">
                            <input type="checkbox" id="clear-api-key">
                            <span style="color:var(--snw-error);">${T('settings.deleteApiKey')}</span>
                        </label>
                    </div>

                    <div class="snw-form-row">
                        <label>Gemini API Key ${geminiKeySet
                            ? `<span style="color:var(--snw-success);font-size:11px;">${T('settings.configured')}</span>`
                            : `<span style="color:var(--snw-text-dim);font-size:11px;">${T('settings.notConfigured')}</span>`}</label>
                        <input type="password" id="gemini-key" value=""
                               autocomplete="off"
                               data-lpignore="true"
                               data-1p-ignore="true"
                               spellcheck="false"
                               placeholder="${geminiKeySet ? T('settings.keyPlaceholderChange') : T('settings.keyPlaceholderInput')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <label style="font-size:11px;margin-top:4px;">
                            <input type="checkbox" id="clear-gemini-key">
                            <span style="color:var(--snw-error);">${T('settings.deleteGeminiKey')}</span>
                        </label>
                    </div>

                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn" data-action="test-api">${T('settings.testApiKey')}</button>
                    </div>
                `;

                // ---------- 2. WebSocket 채널 ----------
                const wsCh = (Array.isArray(ws.wsChConfig) && ws.wsChConfig.length > 0)
                    ? ws.wsChConfig
                    : [
                        { chIdx: 0, chName: 'state',   chIntervalMs: 800,  priority: 0 },
                        { chIdx: 1, chName: 'metrics', chIntervalMs: 1500, priority: 1 },
                        { chIdx: 2, chName: 'chart',   chIntervalMs: 1200, priority: 2 },
                        { chIdx: 3, chName: 'summary', chIntervalMs: 1500, priority: 3 }
                    ];

                this._wsChBaseline = wsCh.map((ch, i) => ({
                    chIdx:  (ch.chIdx != null) ? ch.chIdx : i,
                    chName: ch.chName || ('ch' + i)
                }));

                const wsEtc = ws.wsEtcConfig || {};
                let wsHtml = `<h3 class="snw-form-section">${T('settings.wsChannelConfig')}</h3>`;
                wsCh.forEach((ch, idx) => {
                    wsHtml += `
                        <div style="display:flex;gap:8px;margin-bottom:4px;align-items:center;font-size:12px;">
                            <span style="width:70px;color:var(--snw-text-dim);">${esc(ch.chName || ('ch' + idx))}</span>
                            <input type="number" value="${nz(ch.chIntervalMs, 1000)}" placeholder="Interval(ms)"
                                   style="flex:1;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"
                                   data-ws-itv="${idx}">
                            <input type="number" value="${nz(ch.priority, 0)}" placeholder="Priority"
                                   style="flex:1;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"
                                   data-ws-prio="${idx}">
                        </div>
                    `;
                });
                wsHtml += `
                    <div class="snw-form-row">
                        <label>Chart Large Bytes</label>
                        <input type="number" id="ws-chartLarge" value="${nz(wsEtc.chartLargeBytes, 3500)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>Chart Throttle Mul</label>
                        <input type="number" id="ws-chartThrottle" value="${nz(wsEtc.chartThrottleMul, 2)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>WS Cleanup (ms)</label>
                        <input type="number" id="ws-cleanup" value="${nz(wsEtc.wsCleanupMs, 10000)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                `;
                const wsSlot = this.el.querySelector('[data-slot="form-ws"]');
                if (wsSlot) wsSlot.innerHTML = wsHtml;

                // ---------- 3. 하드웨어 (P0-2 + O-18) ----------
                const pwm   = hw.fanPwm    || {};
                const curve = hw.fanConfig || {};
                const pir   = hw.pir       || {};
                const dht   = hw.tempHum   || {};
                const led   = hw.led       || {};

                const hwSlot = this.el.querySelector('[data-slot="form-hw"]');
                if (!hwSlot) return;

                const _rangeHint = (min, max, rec) => {
                    const range = T('settings.fieldRange', { min, max });
                    return rec
                        ? `<small class="snw-form-row__hint">${range} · ${T('settings.fieldRecommended', { range: rec })}</small>`
                        : `<small class="snw-form-row__hint">${range}</small>`;
                };

                hwSlot.innerHTML = `
                    <h3 class="snw-form-section">${T('settings.secFanPwm')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinPwm')}</label>
                        <input type="number" id="hw-pwm-pin" min="0" max="48" value="${nz(pwm.pin, 6)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldChannel')}</label>
                        <input type="number" id="hw-pwm-ch" min="0" max="15" value="${nz(pwm.channel, 0)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 15)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldFreq')}</label>
                        <input type="number" id="hw-pwm-freq" min="1000" max="80000" value="${nz(pwm.freq, 25000)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1000, 80000, '20000~30000')}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldRes')}</label>
                        <input type="number" id="hw-pwm-res" min="1" max="16" value="${nz(pwm.res, 10)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1, 16, '8~12')}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secFanCurve')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldStart')}</label>
                        <input type="number" id="hw-fan-start" min="0" max="100" value="${nz(curve.startPercentMin, 18)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100, '15~25')}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldComfortMin')}</label>
                        <input type="number" id="hw-fan-cmin" min="0" max="100" value="${nz(curve.comfortPercentMin, 22)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldComfortMax')}</label>
                        <input type="number" id="hw-fan-cmax" min="0" max="100" value="${nz(curve.comfortPercentMax, 65)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldHardMax')}</label>
                        <input type="number" id="hw-fan-hmax" min="0" max="100" value="${nz(curve.hardPercentMax, 90)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 100)}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secPir')}</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-pir-enabled" ${asBool(pir.enabled) ? 'checked' : ''}>
                        <label for="hw-pir-enabled" style="margin:0;">${T('settings.fieldEnabled')}</label>
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinPir')}</label>
                        <input type="number" id="hw-pir-pin" min="0" max="48" value="${nz(pir.pin, 13)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldDebounce')}</label>
                        <input type="number" id="hw-pir-debounce" min="0" max="60" value="${nz(pir.debounceSec, 5)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 60)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldHold')}</label>
                        <input type="number" id="hw-pir-hold" min="0" max="3600" value="${nz(pir.holdSec, 120)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 3600, '60~300')}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secDht')}</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-dht-enabled" ${asBool(dht.enabled) ? 'checked' : ''}>
                        <label for="hw-dht-enabled" style="margin:0;">${T('settings.fieldEnabled')}</label>
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldType')}</label>
                        <input type="text" id="hw-dht-type" value="${esc(nz(dht.type, 'DHT22'))}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinDht')}</label>
                        <input type="number" id="hw-dht-pin" min="0" max="48" value="${nz(dht.pin, 17)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldInterval')}</label>
                        <input type="number" id="hw-dht-int" min="1" max="3600" value="${nz(dht.intervalSec, 30)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1, 3600, '10~60')}
                    </div>

                    <h3 class="snw-form-section">${T('settings.secLed')}</h3>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldPinLed')}</label>
                        <input type="number" id="hw-led-pin" min="0" max="48" value="${nz(led.pin, 48)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 48)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldNumPixels')}</label>
                        <input type="number" id="hw-led-num" min="1" max="16" value="${nz(led.numPixels, 1)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(1, 16)}
                    </div>
                    <div class="snw-form-row">
                        <label>${T('settings.fieldBrightness')}</label>
                        <input type="number" id="hw-led-bright" min="0" max="255" value="${nz(led.defaultBrightness, 20)}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        ${_rangeHint(0, 255, '20~80')}
                    </div>
                `;

                // [P0-3] Sticky action bar
                const actionBar = this.el.querySelector('[data-slot="action-bar"]');
                if (actionBar) {
                    actionBar.innerHTML = `
                        <div class="snw-form-sticky">
                            <label class="snw-form-row--bool" style="flex:1;margin:0;">
                                <input type="checkbox" id="save-and-reload" checked>
                                <span>${T('settings.saveAndReload')}</span>
                            </label>
                            <button type="button" class="snw-btn" data-action="reload">${T('settings.reload')}</button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="save">${T('settings.save')}</button>
                        </div>
                        <div class="snw-form-sticky-spacer"></div>
                    `;
                }
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.load');
            }
        }

        // =========================================================
        // [O-4][O-18] 저장 — 클라이언트 검증 + 자동 재적용
        // =========================================================
        async _onSave() {
            const q = sel => this.el.querySelector(sel);

            // [O-18] 범위 검증
            const validations = [
                { sel: '#hw-pwm-pin',     min: 0,    max: 48,    field: 'PWM Pin' },
                { sel: '#hw-pwm-freq',    min: 1000, max: 80000, field: 'Frequency' },
                { sel: '#hw-pwm-res',     min: 1,    max: 16,    field: 'Resolution' },
                { sel: '#hw-led-pin',     min: 0,    max: 48,    field: 'LED Pin' },
                { sel: '#hw-led-bright',  min: 0,    max: 255,   field: 'Brightness' },
                { sel: '#hw-led-num',     min: 1,    max: 16,    field: 'Num Pixels' },
                { sel: '#hw-pir-hold',    min: 0,    max: 3600,  field: 'PIR Hold' },
                { sel: '#hw-dht-int',     min: 1,    max: 3600,  field: 'DHT Interval' }
            ];
            let hasError = false;
            validations.forEach(v => {
                const el = q(v.sel);
                if (!el) return;
                const val = Number(el.value);
                if (isNaN(val) || val < v.min || val > v.max) {
                    el.classList.add('is-error');
                    hasError = true;
                } else {
                    el.classList.remove('is-error');
                }
            });
            if (hasError) {
                SNW.ToastUtil.error(SNW.I18n.t('validate.multiErrors', { count: validations.length }));
                const firstErr = this.el.querySelector('.is-error');
                if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            // API Key 처리
            const apiKeyVal      = q('#api-key')         ? q('#api-key').value.trim()      : '';
            const geminiKeyVal   = q('#gemini-key')      ? q('#gemini-key').value.trim()   : '';
            const clearApiKey    = q('#clear-api-key')   ? q('#clear-api-key').checked     : false;
            const clearGeminiKey = q('#clear-gemini-key')? q('#clear-gemini-key').checked  : false;

            const securityPatch = {};
            if (clearApiKey)              securityPatch.clearApiKey = true;
            else if (apiKeyVal.length)    securityPatch.apiKey = apiKeyVal;
            if (clearGeminiKey)           securityPatch.clearGeminiApiKey = true;
            else if (geminiKeyVal.length) securityPatch.geminiApiKey = geminiKeyVal;

            // WS 채널 수집
            const wsChArr = [];
            const seenIdx = new Set();
            this.el.querySelectorAll('[data-ws-itv]').forEach(el => {
                const idx    = Number(el.getAttribute('data-ws-itv'));
                const prioEl = q(`[data-ws-prio="${idx}"]`);
                const base   = this._wsChBaseline.find(b => b.chIdx === idx) || { chName: 'ch' + idx };
                seenIdx.add(idx);
                wsChArr.push({
                    chIdx:        idx,
                    chName:       base.chName || ('ch' + idx),
                    chIntervalMs: Number(el.value) || 0,
                    priority:     prioEl ? Number(prioEl.value) : 0
                });
            });
            this._wsChBaseline.forEach(b => {
                if (!seenIdx.has(b.chIdx)) {
                    wsChArr.push({
                        chIdx: b.chIdx, chName: b.chName,
                        chIntervalMs: 1000, priority: 0
                    });
                }
            });
            wsChArr.sort((a, b) => a.chIdx - b.chIdx);

            const patch = {
                meta: { deviceName: q('#meta-deviceName').value },
                system: {
                    logging: {
                        level:      q('#log-level').value,
                        maxEntries: Number(q('#log-maxEntries').value)
                    },
                    webSocket: {
                        wsChConfig: wsChArr,
                        wsEtcConfig: {
                            chartLargeBytes:  Number(q('#ws-chartLarge').value),
                            chartThrottleMul: Number(q('#ws-chartThrottle').value),
                            wsCleanupMs:      Number(q('#ws-cleanup').value)
                        }
                    }
                },
                security: securityPatch,
                hw: {
                    fanPwm: {
                        pin:     Number(q('#hw-pwm-pin').value),
                        channel: Number(q('#hw-pwm-ch').value),
                        freq:    Number(q('#hw-pwm-freq').value),
                        res:     Number(q('#hw-pwm-res').value)
                    },
                    fanConfig: {
                        startPercentMin:   Number(q('#hw-fan-start').value),
                        comfortPercentMin: Number(q('#hw-fan-cmin').value),
                        comfortPercentMax: Number(q('#hw-fan-cmax').value),
                        hardPercentMax:    Number(q('#hw-fan-hmax').value)
                    },
                    pir: {
                        enabled:     q('#hw-pir-enabled').checked,
                        pin:         Number(q('#hw-pir-pin').value),
                        debounceSec: Number(q('#hw-pir-debounce').value),
                        holdSec:     Number(q('#hw-pir-hold').value)
                    },
                    tempHum: {
                        enabled:     q('#hw-dht-enabled').checked,
                        type:        q('#hw-dht-type').value,
                        pin:         Number(q('#hw-dht-pin').value),
                        intervalSec: Number(q('#hw-dht-int').value)
                    },
                    led: {
                        pin:               Number(q('#hw-led-pin').value),
                        numPixels:         Number(q('#hw-led-num').value),
                        defaultBrightness: Number(q('#hw-led-bright').value)
                    }
                }
            };

            try {
                await SNW.Api.patchSystem(patch);
                await SNW.Api.saveConfig();

                // [O-4] 자동 재적용
                const autoReload = q('#save-and-reload') ? q('#save-and-reload').checked : false;
                if (autoReload && !window.SNW_OFFLINE) {
                    await SNW.Api.reload();
                    SNW.ToastUtil.success(SNW.I18n.t('msg.saveAndReloadSuccess'));
                } else {
                    SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                }

                await this._loadSystem();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.save');
            }
        }

        // =========================================================
        // [O-4] 재적용 — dirty 경고
        // =========================================================
        async _onReload() {
            try {
                const dirty = await SNW.Api.getConfigDirty().catch(() => null);
                const hasDirty = dirty && Object.values(dirty).some(v => v === true);
                if (hasDirty) {
                    const content = document.createElement('div');
                    content.textContent = SNW.I18n.t('settings.dirtyWarning');
                    content.style.cssText = 'padding: 8px 0; color: var(--snw-warn);';
                    SNW.UI.modal(
                        SNW.I18n.t('common.warning'),
                        content,
                        () => { this._doReload(); return true; },
                        null
                    );
                    return;
                }
                await this._doReload();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.reload');
            }
        }

        async _doReload() {
            if (window.SNW_OFFLINE) {
                SNW.ToastUtil.info(SNW.I18n.t('settings.offlineReloadNotice'));
                return;
            }
            try {
                const res = await SNW.Api.reload();
                SNW.ToastUtil.success(SNW.I18n.t('settings.reloadRequested', { status: (res && res.result) || 'queued' }));
                setTimeout(async () => {
                    try {
                        const st = await SNW.Api.getState();
                        const ctl = (st && st.control) || {};
                        if (ctl.pendingReload === true) {
                            SNW.ToastUtil.info(SNW.I18n.t('settings.reloadInProgress'));
                        } else if (ctl.lastReloadOk === false) {
                            SNW.ToastUtil.error(SNW.I18n.t('settings.reloadFailed'));
                        } else {
                            SNW.ToastUtil.success(SNW.I18n.t('settings.reloadComplete'));
                        }
                    } catch { /* ignore */ }
                }, 2000);
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.reload');
            }
        }

        async _onTestApi() {
            try {
                await SNW.Api.getState();
                SNW.ToastUtil.success(SNW.I18n.t('settings.testApiSuccess'));
            } catch (e) {
                SNW.ToastUtil.error(SNW.I18n.t('settings.testApiFail', { msg: e.message || 'HTTP 401' }));
            }
        }

        // =========================================================
        // [O-9] 공장 초기화 강화
        // =========================================================
        async _onFactoryReset() {
            const content = document.createElement('div');
            content.innerHTML = `
                <p style="color:var(--snw-error); margin-bottom:12px;">
                    <strong>${SNW.I18n.t('settings.factoryResetItems')}</strong>
                </p>
                <ul style="margin: 0 0 16px 20px; color: var(--snw-text-dim);">
                    <li>Wi-Fi 설정 (AP: <b>NatureWind</b> / <b>2540</b>)</li>
                    <li>스케줄, 프로필, 프리셋</li>
                    <li>API Key</li>
                </ul>
                <p style="margin-bottom:8px; color: var(--snw-warn);">
                    <strong>${SNW.I18n.t('reconnect.body')}</strong>
                </p>
                <input type="text" id="confirm-word"
                       placeholder="${SNW.I18n.t('settings.factoryResetConfirmWord')}"
                       style="width:100%; padding:8px; background:var(--snw-surface-2); border:1px solid var(--snw-border); color:var(--snw-text);">
            `;

            SNW.UI.modal(
                SNW.I18n.t('settings.factoryResetTitle'),
                content,
                async () => {
                    const word = content.querySelector('#confirm-word').value.trim();
                    if (word !== SNW.I18n.t('settings.factoryResetWord')) {
                        SNW.ToastUtil.warn(SNW.I18n.t('settings.factoryResetConfirmWord'));
                        return false;
                    }
                    try {
                        await SNW.Api.factoryReset();
                        SNW.ToastUtil.success(SNW.I18n.t('settings.factoryResetSuccess'), 8000);
                        return true;
                    } catch (e) {
                        return false;
                    }
                },
                null,
                { okLabel: SNW.I18n.t('settings.factoryReset'), width: '440px' }
            );
        }
    };
})(window.SNW);
