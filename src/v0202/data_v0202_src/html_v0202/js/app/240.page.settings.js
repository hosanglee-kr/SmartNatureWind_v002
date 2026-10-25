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
 *
 * [Batch B-3] XSS 방어 (모든 사용자 제어 문자열 escape)
 * [NEW-C1]   `||` → `nz` (0값 보존: pin=0, brightness=0, holdSec=0)
 * [NEW-C2]   dht.type 이스케이프 (XSS)
 * [NEW-U1]   API Key 프리필 제거 (DOM 노출 차단, placeholder 안내)
 * [NEW-U2]   API Key 삭제 체크박스 (clearApiKey/clearGeminiApiKey)
 * [NEW-U3]   wsChConfig 빈 배열 시 기본 4채널 복원 + chName 베이스라인 유지
 * [NEW-U4]   문자열 "false" 방어 (asBool)
 * [FIX]      `data-action="reload"` dead 버튼 활성화
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    // =====================================================
    // [NEW-C1] null/undefined만 폴백 (0, '', false는 보존)
    // =====================================================
    function nz(v, fallback) {
        return (v === null || v === undefined) ? fallback : v;
    }

    // =====================================================
    // [NEW-U4] 명시적 bool 판정 ("false" 문자열 방어)
    // =====================================================
    function asBool(v) {
        return v === true || v === 1 || v === '1' || v === 'true';
    }

    SNW.Page.Settings = class Settings {
        constructor(container) {
            this.el = container;
            this._active = true;
            // [NEW-U3] 저장 시 chName 복원용 베이스라인
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

        // =====================================================
        // _loadSystem : GET /api/v001/system → 폼 렌더
        // =====================================================
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

                // [NEW-U1] API Key는 실제 값을 DOM에 넣지 않음. 상태 배지만 표시.
                const apiKeySet    = typeof sec.apiKey       === 'string' && sec.apiKey.length       > 0;
                const geminiKeySet = typeof sec.geminiApiKey === 'string' && sec.geminiApiKey.length > 0;

                // ---------- 1. Meta + Logging + Security ----------
                const logSlot = this.el.querySelector('[data-slot="form-log"]');
                if (!logSlot) return;
                logSlot.innerHTML = `
                    <div class="snw-form-row"><label>Device Name</label>
                        <input type="text" id="meta-deviceName" value="${esc(nz(meta.deviceName, 'SmartNatureWind'))}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Log Level</label>
                        <select id="log-level" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            <option value="INFO"  ${logCfg.level === 'INFO'  ? 'selected' : ''}>INFO</option>
                            <option value="DEBUG" ${logCfg.level === 'DEBUG' ? 'selected' : ''}>DEBUG</option>
                            <option value="WARN"  ${logCfg.level === 'WARN'  ? 'selected' : ''}>WARN</option>
                            <option value="ERROR" ${logCfg.level === 'ERROR' ? 'selected' : ''}>ERROR</option>
                        </select>
                    </div>
                    <div class="snw-form-row"><label>Log Max Entries</label>
                        <input type="number" id="log-maxEntries" value="${nz(logCfg.maxEntries, 300)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>

                    <div class="snw-form-row">
                        <label>API Key ${apiKeySet
                            ? '<span style="color:var(--snw-success);font-size:11px;">(설정됨)</span>'
                            : '<span style="color:var(--snw-text-dim);font-size:11px;">(미설정)</span>'}</label>
                        <input type="password" id="api-key" value="" autocomplete="new-password"
                               placeholder="${apiKeySet ? '변경하려면 새 키 입력 (빈칸=유지)' : '키 입력'}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <label style="font-size:11px;margin-top:4px;">
                            <input type="checkbox" id="clear-api-key">
                            <span style="color:var(--snw-error);">API Key 삭제</span>
                        </label>
                    </div>

                    <div class="snw-form-row">
                        <label>Gemini API Key ${geminiKeySet
                            ? '<span style="color:var(--snw-success);font-size:11px;">(설정됨)</span>'
                            : '<span style="color:var(--snw-text-dim);font-size:11px;">(미설정)</span>'}</label>
                        <input type="password" id="gemini-key" value="" autocomplete="new-password"
                               placeholder="${geminiKeySet ? '변경하려면 새 키 입력 (빈칸=유지)' : '키 입력'}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <label style="font-size:11px;margin-top:4px;">
                            <input type="checkbox" id="clear-gemini-key">
                            <span style="color:var(--snw-error);">Gemini 키 삭제</span>
                        </label>
                    </div>

                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn" data-action="test-api">API Key 테스트</button>
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

                // [NEW-U3] 저장 시 chName 복원용 베이스라인
                this._wsChBaseline = wsCh.map((ch, i) => ({
                    chIdx:  (ch.chIdx != null) ? ch.chIdx : i,
                    chName: ch.chName || ('ch' + i)
                }));

                const wsEtc = ws.wsEtcConfig || {};
                let wsHtml = `<h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">WebSocket 채널 설정</h3>`;
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
                    <div class="snw-form-row"><label>Chart Large Bytes</label>
                        <input type="number" id="ws-chartLarge" value="${nz(wsEtc.chartLargeBytes, 3500)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Chart Throttle Mul</label>
                        <input type="number" id="ws-chartThrottle" value="${nz(wsEtc.chartThrottleMul, 2)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>WS Cleanup (ms)</label>
                        <input type="number" id="ws-cleanup" value="${nz(wsEtc.wsCleanupMs, 10000)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                `;
                const wsSlot = this.el.querySelector('[data-slot="form-ws"]');
                if (wsSlot) wsSlot.innerHTML = wsHtml;

                // ---------- 3. 하드웨어 ----------
                const pwm   = hw.fanPwm    || {};
                const curve = hw.fanConfig || {};
                const pir   = hw.pir       || {};
                const dht   = hw.tempHum   || {};
                const led   = hw.led       || {};

                const hwSlot = this.el.querySelector('[data-slot="form-hw"]');
                if (!hwSlot) return;
                hwSlot.innerHTML = `
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Fan PWM</h3>
                    <div class="snw-form-row"><label>Pin</label>
                        <input type="number" id="hw-pwm-pin" value="${nz(pwm.pin, 6)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Channel</label>
                        <input type="number" id="hw-pwm-ch" value="${nz(pwm.channel, 0)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Frequency (Hz)</label>
                        <input type="number" id="hw-pwm-freq" value="${nz(pwm.freq, 25000)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Resolution (bits)</label>
                        <input type="number" id="hw-pwm-res" value="${nz(pwm.res, 10)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>

                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Fan Curve (%)</h3>
                    <div class="snw-form-row"><label>Start</label>
                        <input type="number" id="hw-fan-start" value="${nz(curve.startPercentMin, 18)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Comfort Min</label>
                        <input type="number" id="hw-fan-cmin" value="${nz(curve.comfortPercentMin, 22)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Comfort Max</label>
                        <input type="number" id="hw-fan-cmax" value="${nz(curve.comfortPercentMax, 65)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Hard Max</label>
                        <input type="number" id="hw-fan-hmax" value="${nz(curve.hardPercentMax, 90)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>

                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">PIR Sensor</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-pir-enabled" ${asBool(pir.enabled) ? 'checked' : ''}>
                        <label for="hw-pir-enabled" style="margin:0;">Enabled</label>
                    </div>
                    <div class="snw-form-row"><label>Pin</label>
                        <input type="number" id="hw-pir-pin" value="${nz(pir.pin, 13)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Debounce (sec)</label>
                        <input type="number" id="hw-pir-debounce" value="${nz(pir.debounceSec, 5)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Hold (sec)</label>
                        <input type="number" id="hw-pir-hold" value="${nz(pir.holdSec, 120)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>

                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">DHT22 Sensor</h3>
                    <div class="snw-form-row" style="flex-direction:row;gap:8px;align-items:center;">
                        <input type="checkbox" id="hw-dht-enabled" ${asBool(dht.enabled) ? 'checked' : ''}>
                        <label for="hw-dht-enabled" style="margin:0;">Enabled</label>
                    </div>
                    <div class="snw-form-row"><label>Type</label>
                        <input type="text" id="hw-dht-type" value="${esc(nz(dht.type, 'DHT22'))}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Pin</label>
                        <input type="number" id="hw-dht-pin" value="${nz(dht.pin, 17)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Interval (sec)</label>
                        <input type="number" id="hw-dht-int" value="${nz(dht.intervalSec, 30)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>

                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;">Status LED</h3>
                    <div class="snw-form-row"><label>Pin</label>
                        <input type="number" id="hw-led-pin" value="${nz(led.pin, 48)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Num Pixels</label>
                        <input type="number" id="hw-led-num" value="${nz(led.numPixels, 1)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row"><label>Brightness (0~255)</label>
                        <input type="number" id="hw-led-bright" value="${nz(led.defaultBrightness, 20)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                `;
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.load');
            }
        }

        // =====================================================
        // _onSave : POST /system → /config/save → /reload
        // =====================================================
        async _onSave() {
            const q = sel => this.el.querySelector(sel);

            // [NEW-U1/U2] API Key 처리:
            //   체크박스 → 삭제(clearApiKey=true)
            //   값 입력   → 변경(apiKey=값)
            //   빈 필드+미체크 → 미변경(키 미포함)
            const apiKeyVal      = q('#api-key')         ? q('#api-key').value.trim()      : '';
            const geminiKeyVal   = q('#gemini-key')      ? q('#gemini-key').value.trim()   : '';
            const clearApiKey    = q('#clear-api-key')   ? q('#clear-api-key').checked     : false;
            const clearGeminiKey = q('#clear-gemini-key')? q('#clear-gemini-key').checked  : false;

            const securityPatch = {};
            if (clearApiKey)              securityPatch.clearApiKey = true;
            else if (apiKeyVal.length)    securityPatch.apiKey = apiKeyVal;

            if (clearGeminiKey)           securityPatch.clearGeminiApiKey = true;
            else if (geminiKeyVal.length) securityPatch.geminiApiKey = geminiKeyVal;

            // ---------- WS 채널 수집 ----------
            const wsChArr = [];
            const seenIdx = new Set();
            this.el.querySelectorAll('[data-ws-itv]').forEach(el => {
                const idx    = Number(el.getAttribute('data-ws-itv'));
                const prioEl = q(`[data-ws-prio="${idx}"]`);

                // [NEW-U3] chName은 베이스라인에서 복원 (사용자 입력 필드 아님)
                const base   = this._wsChBaseline.find(b => b.chIdx === idx) || { chName: 'ch' + idx };

                seenIdx.add(idx);
                wsChArr.push({
                    chIdx:        idx,
                    chName:       base.chName || ('ch' + idx),
                    chIntervalMs: Number(el.value) || 0,
                    priority:     prioEl ? Number(prioEl.value) : 0
                });
            });
            // [NEW-U3] baseline에 있으나 DOM에서 누락된 채널은 기본값으로 복원
            this._wsChBaseline.forEach(b => {
                if (!seenIdx.has(b.chIdx)) {
                    wsChArr.push({
                        chIdx:        b.chIdx,
                        chName:       b.chName,
                        chIntervalMs: 1000,
                        priority:     0
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
                // [NEW-U1/U2] 빈 객체 `{}` → 백엔드 무시 (변경 없음)
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
                if (!window.SNW_OFFLINE) await SNW.Api.reload();
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));

                // [NEW-U1] 저장 후 재조회로 "(설정됨)" 배지 등 상태 갱신
                await this._loadSystem();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.save');
            }
        }

        // =====================================================
        // _onReload : [FIX] dead 버튼 활성화
        //  - POST /reload → 202 → 2초 후 lastReloadOk 확인
        // =====================================================
        async _onReload() {
            try {
                if (window.SNW_OFFLINE) {
                    SNW.ToastUtil.info('오프라인 모드에서는 reload가 즉시 반환됩니다.');
                    return;
                }
                const res = await SNW.Api.reload();
                SNW.ToastUtil.success('재로드 요청됨: ' + ((res && res.result) || 'queued'));

                // F-05: pendingReload 폴링 → lastReloadOk 확인
                setTimeout(async () => {
                    try {
                        const st = await SNW.Api.getState();
                        const ctl = (st && st.control) || {};
                        if (ctl.pendingReload === true) {
                            SNW.ToastUtil.info('재로드 진행 중...');
                        } else if (ctl.lastReloadOk === false) {
                            SNW.ToastUtil.error('재로드 실패 (lastReloadOk=false)');
                        } else {
                            SNW.ToastUtil.success('재로드 완료');
                        }
                    } catch { /* 폴링 실패 무시 */ }
                }, 2000);
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'settings.reload');
            }
        }

        // =====================================================
        // _onTestApi : 현재 저장된 API Key로 GET /state 시도
        // =====================================================
        async _onTestApi() {
            try {
                await SNW.Api.getState();
                SNW.ToastUtil.success('API Key 검증 성공');
            } catch (e) {
                SNW.ToastUtil.error('API Key 검증 실패: ' + (e.message || 'HTTP 401'));
            }
        }

        // =====================================================
        // _onFactoryReset
        // =====================================================
        async _onFactoryReset() {
            const content = document.createElement('div');
            content.textContent = '정말 공장 초기화 하시겠습니까? 모든 설정이 삭제됩니다.';
            content.style.cssText = 'color:var(--snw-error);padding:12px 0;';

            SNW.UI.modal('⚠️ 경고', content, async () => {
                try {
                    await SNW.Api.factoryReset();
                    SNW.ToastUtil.success('기기가 재시작됩니다...');
                    return true;
                } catch (e) {
                    return false;
                }
            });
        }
    };
})(window.SNW);
