// =========================================================
// core/150.ui.rule_editor.js — 규칙 편집기 (Pause/Stop 이원화)
// Layer 3 (UI Component) — 전역 재사용
// 의존: SNW.DomUtil, SNW.I18n, SNW.UI.modal
// =========================================================
window.SNW = window.SNW || {};
SNW.UI = SNW.UI || {};
(function (SNW) {
    'use strict';

    const DEFAULT_RULE = {
        timer:        { enabled: false, minutes: 0 },
        offTime:      { enabled: false, time: '00:00' },
        tempLow:      { enabled: false, mode: 'PAUSE', threshold: 22.0, hysteresis: 0.5 },
        diLow:        { enabled: false, mode: 'PAUSE', threshold: 65.0, hysteresis: 3.0 },
        pirPause:     { enabled: false, holdSec: 120 },
        smartComfort: { enabled: false, intervalMin: 5, level: 2 },
    };

    // ── 원클릭 추천 템플릿 3종 ──
    const TEMPLATES = {
        deepSleep: {
            labelKey: 'rule.template.deepSleep',
            rule: {
                timer:    { enabled: true, minutes: 480 },
                offTime:  { enabled: true, time: '06:00' },
                tempLow:  { enabled: true, mode: 'STOP',  threshold: 23.0, hysteresis: 0.0 },
                diLow:    { enabled: false, mode: 'PAUSE', threshold: 65.0, hysteresis: 3.0 },
                pirPause: { enabled: true, holdSec: 600 },
                smartComfort: { enabled: true, intervalMin: 5, level: 2 },
            },
        },
        babySafe: {
            labelKey: 'rule.template.babySafe',
            rule: {
                timer:    { enabled: false, minutes: 0 },
                offTime:  { enabled: false, time: '00:00' },
                tempLow:  { enabled: true, mode: 'STOP',  threshold: 24.0, hysteresis: 0.0 },
                diLow:    { enabled: true, mode: 'STOP',  threshold: 68.0, hysteresis: 0.0 },
                pirPause: { enabled: true, holdSec: 300 },
                smartComfort: { enabled: true, intervalMin: 5, level: 2 },
            },
        },
        officeFocus: {
            labelKey: 'rule.template.officeFocus',
            rule: {
                timer:    { enabled: true, minutes: 120 },
                offTime:  { enabled: false, time: '00:00' },
                tempLow:  { enabled: false, mode: 'PAUSE', threshold: 22.0, hysteresis: 0.5 },
                diLow:    { enabled: true, mode: 'PAUSE', threshold: 70.0, hysteresis: 3.0 },
                pirPause: { enabled: true, holdSec: 180 },
                smartComfort: { enabled: false, intervalMin: 5, level: 2 },
            },
        },
    };

    function _esc(v) {
        return SNW.DomUtil ? SNW.DomUtil.escape(v) : String(v);
    }

    function _nz(v, fb) {
        return (v === null || v === undefined) ? fb : v;
    }

    function _renderRuleForm(rule) {
        const t = (k) => (SNW.I18n ? SNW.I18n.t(k) : k);
        const r = rule || DEFAULT_RULE;

        return `
        <div class="snw-rule-editor">
            <div class="snw-rule-templates">
                ${Object.entries(TEMPLATES).map(([k, v]) => `
                    <button type="button" class="snw-btn snw-btn--sm" data-rule-template="${k}">
                        ${t(v.labelKey)}
                    </button>
                `).join('')}
            </div>

            <fieldset class="snw-rule-section" data-section="pause">
                <legend>${t('rule.sectionPause')}</legend>

                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="pirPause.enabled" ${r.pirPause.enabled ? 'checked' : ''}> ${t('rule.pir.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="0" max="3600" step="10" data-rule="pirPause.holdSec" value="${_nz(r.pirPause.holdSec, 120)}" class="snw-input-sm">
                        <span class="snw-rule-unit">${t('unit.seconds')}</span>
                    </div>
                </div>

                <div class="snw-rule-row snw-rule-row--stack">
                    <label><input type="checkbox" data-rule="tempLow.enabled" ${r.tempLow.enabled ? 'checked' : ''}> ${t('rule.tempLow.enabled')}</label>
                    <div class="snw-rule-mode">
                        <label><input type="radio" name="tempLowMode" value="PAUSE" ${r.tempLow.mode === 'PAUSE' ? 'checked' : ''}> ${t('rule.modePause')}</label>
                        <label><input type="radio" name="tempLowMode" value="STOP"  ${r.tempLow.mode === 'STOP'  ? 'checked' : ''}> ${t('rule.modeStop')}</label>
                    </div>
                    <div class="snw-rule-inputs">
                        <span>${t('rule.threshold')}</span>
                        <input type="number" step="0.5" min="10" max="35" data-rule="tempLow.threshold" value="${_nz(r.tempLow.threshold, 22.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">°C</span>
                        <span class="snw-rule-hint" data-rule-hint="tempLow">${t('rule.hysteresis')}</span>
                        <input type="number" step="0.5" min="0" max="10" data-rule="tempLow.hysteresis" value="${_nz(r.tempLow.hysteresis, 0.5)}" class="snw-input-sm">
                        <span class="snw-rule-unit">°C</span>
                    </div>
                </div>

                <div class="snw-rule-row snw-rule-row--stack">
                    <label><input type="checkbox" data-rule="diLow.enabled" ${r.diLow.enabled ? 'checked' : ''}> ${t('rule.diLow.enabled')}</label>
                    <div class="snw-rule-mode">
                        <label><input type="radio" name="diLowMode" value="PAUSE" ${r.diLow.mode === 'PAUSE' ? 'checked' : ''}> ${t('rule.modePause')}</label>
                        <label><input type="radio" name="diLowMode" value="STOP"  ${r.diLow.mode === 'STOP'  ? 'checked' : ''}> ${t('rule.modeStop')}</label>
                    </div>
                    <div class="snw-rule-inputs">
                        <span>${t('rule.threshold')}</span>
                        <input type="number" step="1" min="0" max="100" data-rule="diLow.threshold" value="${_nz(r.diLow.threshold, 65.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">DI</span>
                        <span class="snw-rule-hint">${t('rule.hysteresis')}</span>
                        <input type="number" step="1" min="0" max="20" data-rule="diLow.hysteresis" value="${_nz(r.diLow.hysteresis, 3.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">DI</span>
                    </div>
                </div>
            </fieldset>

            <fieldset class="snw-rule-section" data-section="stop">
                <legend>${t('rule.sectionStop')}</legend>
                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="timer.enabled" ${r.timer.enabled ? 'checked' : ''}> ${t('rule.timer.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="1" max="1440" step="10" data-rule="timer.minutes" value="${_nz(r.timer.minutes, 0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">${t('rule.timer.suffix')}</span>
                    </div>
                </div>
                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="offTime.enabled" ${r.offTime.enabled ? 'checked' : ''}> ${t('rule.offTime.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="time" data-rule="offTime.time" value="${_nz(r.offTime.time, '00:00')}" class="snw-input-sm">
                        <span class="snw-rule-unit">${t('rule.offTime.suffix')}</span>
                    </div>
                </div>
            </fieldset>

            <fieldset class="snw-rule-section" data-section="comfort">
                <legend>${t('rule.sectionComfort')}</legend>
                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="smartComfort.enabled" ${r.smartComfort.enabled ? 'checked' : ''}> ${t('rule.smartComfort.interval')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="1" max="60" data-rule="smartComfort.intervalMin" value="${_nz(r.smartComfort.intervalMin, 5)}" class="snw-input-sm">
                        <span class="snw-rule-unit">min</span>
                    </div>
                </div>
            </fieldset>

            <div class="snw-rule-tips">
                <p>💡 ${t('rule.tipModes')}</p>
                <p>👶 ${t('rule.tipBabySafe')}</p>
            </div>
        </div>`;
    }

    function _getPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
    }

    function _setPath(obj, path, val) {
        const parts = path.split('.');
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = val;
    }

    // =========================================================
    // Public: SNW.UI.ruleEditor.showModal(rule, opts) → Promise<rule|null>
    // =========================================================
    SNW.UI.ruleEditor = {
        /**
         * @param {Object} initRule — 초기 규칙 (없으면 기본값)
         * @param {Object} opts     — { title?: string }
         * @returns {Promise<Object|null>}
         */
        showModal(initRule, opts) {
            const title = (opts && opts.title) || (SNW.I18n ? SNW.I18n.t('rule.title') : '규칙');

            // 깊은 복사
            const working = JSON.parse(JSON.stringify(
                Object.assign({}, DEFAULT_RULE, initRule || {})
            ));
            // 각 서브 객체 보장
            for (const k of Object.keys(DEFAULT_RULE)) {
                if (!working[k]) working[k] = JSON.parse(JSON.stringify(DEFAULT_RULE[k]));
            }

            const content = document.createElement('div');
            content.innerHTML = _renderRuleForm(working);

            // 템플릿 클릭
            content.querySelectorAll('[data-rule-template]').forEach(btn => {
                btn.onclick = () => {
                    const key = btn.getAttribute('data-rule-template');
                    const tpl = TEMPLATES[key];
                    if (!tpl) return;
                    Object.assign(working, JSON.parse(JSON.stringify(tpl.rule)));
                    content.innerHTML = _renderRuleForm(working);
                    _rebind();
                };
            });

            function _rebind() {
                // 템플릿 재바인딩
                content.querySelectorAll('[data-rule-template]').forEach(btn => {
                    btn.onclick = () => {
                        const key = btn.getAttribute('data-rule-template');
                        const tpl = TEMPLATES[key];
                        if (!tpl) return;
                        Object.assign(working, JSON.parse(JSON.stringify(tpl.rule)));
                        content.innerHTML = _renderRuleForm(working);
                        _rebind();
                    };
                });

                // 필드 변경 → working 갱신
                content.querySelectorAll('[data-rule]').forEach(el => {
                    const handler = () => {
                        const path = el.getAttribute('data-rule');
                        if (el.type === 'checkbox') {
                            _setPath(working, path, el.checked);
                        } else if (el.type === 'number') {
                            _setPath(working, path, Number(el.value) || 0);
                        } else {
                            _setPath(working, path, el.value);
                        }
                    };
                    el.addEventListener('change', handler);
                    el.addEventListener('input', handler);
                });

                // mode 라디오
                ['tempLowMode', 'diLowMode'].forEach(name => {
                    const arr = content.querySelectorAll(`input[name="${name}"]`);
                    const key = name === 'tempLowMode' ? 'tempLow.mode' : 'diLow.mode';
                    arr.forEach(radio => {
                        radio.addEventListener('change', () => {
                            if (radio.checked) _setPath(working, key, radio.value);
                        });
                    });
                });
            }
            _rebind();

            // 검증
            function _validate() {
                const errs = [];
                if (working.tempLow.mode === 'PAUSE' && working.tempLow.enabled &&
                    (working.tempLow.hysteresis < 0.5)) {
                    errs.push(SNW.I18n.t('rule.validate.hysteresisTemp'));
                }
                if (working.diLow.mode === 'PAUSE' && working.diLow.enabled &&
                    (working.diLow.hysteresis < 3.0)) {
                    errs.push(SNW.I18n.t('rule.validate.hysteresisDi'));
                }
                return errs;
            }

            return new Promise(resolve => {
                let modalRef = SNW.UI.modal(
                    title, content,
                    async () => {
                        const errs = _validate();
                        if (errs.length > 0) {
                            if (SNW.ToastUtil) SNW.ToastUtil.warn(errs.join(' / '));
                            return false;
                        }
                        resolve(working);
                        return true;
                    },
                    () => { resolve(null); },
                    { width: '520px' }
                );
            });
        },

        DEFAULT_RULE,
        TEMPLATES,
    };
})(window.SNW);

