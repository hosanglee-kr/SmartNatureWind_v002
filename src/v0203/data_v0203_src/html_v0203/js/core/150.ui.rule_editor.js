// =========================================================
// core/150.ui.rule_editor.js — 규칙 편집기 (Pause/Stop 이원화)
// Layer 3 (UI Component) — 전역 재사용
// 의존: SNW.DomUtil, SNW.I18n, SNW.UI.modal, SNW.Api
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

    function _nz(v, fb) {
        return (v === null || v === undefined) ? fb : v;
    }

    function _calcPreview(r) {
        const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
        const ctl = store.control || {};
        const sensor = ctl.sensor || {};
        const curTemp = sensor.tempC != null ? Number(sensor.tempC) : null;
        const curDi = (ctl.triggerRt && ctl.triggerRt.lastCheckDI != null)
            ? Number(ctl.triggerRt.lastCheckDI) : null;

        let status = 'NORMAL';
        let detail = '현재 환경에서 정상 가동됩니다.';

        if (r.tempLow && r.tempLow.enabled && curTemp != null) {
            const th = Number(r.tempLow.threshold);
            const hy = Number(r.tempLow.hysteresis || 0);
            if (curTemp <= th) {
                status = (r.tempLow.mode === 'STOP') ? 'STOP' : 'PAUSE';
                detail = `온도(${curTemp.toFixed(1)}°C) ≤ 임계(${th.toFixed(1)}°C) → ${r.tempLow.mode === 'STOP' ? '완전 정지' : '일시정지'}`;
            } else if (r.tempLow.mode === 'PAUSE' && curTemp < th + hy) {
                status = 'WAITING';
                detail = `온도(${curTemp.toFixed(1)}°C) < 재개임계(${(th + hy).toFixed(1)}°C) → 재개 대기`;
            }
        }

        if (status === 'NORMAL' && r.diLow && r.diLow.enabled && curDi != null) {
            const th = Number(r.diLow.threshold);
            const hy = Number(r.diLow.hysteresis || 0);
            if (curDi <= th) {
                status = (r.diLow.mode === 'STOP') ? 'STOP' : 'PAUSE';
                detail = `불쾌지수(${curDi.toFixed(0)}) ≤ 임계(${th}) → ${r.diLow.mode === 'STOP' ? '완전 정지' : '일시정지'}`;
            } else if (r.diLow.mode === 'PAUSE' && curDi < th + hy) {
                status = 'WAITING';
                detail = `불쾌지수(${curDi.toFixed(0)}) < 재개임계(${(th + hy).toFixed(0)}) → 재개 대기`;
            }
        }

        return { status, detail, curTemp, curDi };
    }

    function _renderRuleForm(rule, showSessionOption = false) {
        const t = (k) => (SNW.I18n ? SNW.I18n.t(k) : k);
        const r = rule || DEFAULT_RULE;
        const prev = _calcPreview(r);

        const statusBadge = (prev.status === 'NORMAL')
            ? '<span class="snw-badge snw-badge--success">🟢 정상 가동</span>'
            : (prev.status === 'PAUSE' || prev.status === 'WAITING')
                ? '<span class="snw-badge snw-badge--warn">⏸ 일시정지 예정</span>'
                : '<span class="snw-badge snw-badge--error">⏹ 완전 정지 예정</span>';

        return `
        <div class="snw-rule-editor">
            <!-- 템플릿 3종 바로가기 -->
            <div class="snw-rule-templates">
                ${Object.entries(TEMPLATES).map(([k, v]) => `
                    <button type="button" class="snw-btn snw-btn--sm" data-rule-template="${k}">
                        ${t(v.labelKey)}
                    </button>
                `).join('')}
            </div>

            <!-- 실시간 환경 판정 미리보기 -->
            <div class="snw-rule-preview" style="padding:10px 12px;background:var(--snw-surface);border:1px solid var(--snw-border);border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                <div>
                    <b>실시간 환경 판정:</b> ${statusBadge}
                    <div style="font-size:11px;color:var(--snw-text-dim);margin-top:2px;" data-slot="preview-detail">${prev.detail}</div>
                </div>
                <div style="text-align:right;font-size:11px;color:var(--snw-text-faint);">
                    ${prev.curTemp != null ? `실내 ${prev.curTemp.toFixed(1)}°C` : ''}
                    ${prev.curDi != null ? ` / DI ${prev.curDi.toFixed(0)}` : ''}
                </div>
            </div>

            <fieldset class="snw-rule-section" data-section="pause">
                <legend>${t('rule.sectionPause')}</legend>

                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="pirPause.enabled" ${r.pirPause.enabled ? 'checked' : ''}> ${t('rule.pir.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="0" max="3600" step="10" data-rule="pirPause.holdSec" value="${_nz(r.pirPause.holdSec, 120)}" class="snw-input-sm">
                        <span class="snw-rule-unit">초 후 멈춤</span>
                    </div>
                </div>

                <div class="snw-rule-row snw-rule-row--stack">
                    <label><input type="checkbox" data-rule="tempLow.enabled" ${r.tempLow.enabled ? 'checked' : ''}> ${t('rule.tempLow.enabled')}</label>
                    <div class="snw-rule-mode">
                        <label><input type="radio" name="tempLowMode" value="PAUSE" ${r.tempLow.mode === 'PAUSE' ? 'checked' : ''}> ${t('rule.tempLow.modePause')}</label>
                        <label><input type="radio" name="tempLowMode" value="STOP"  ${r.tempLow.mode === 'STOP'  ? 'checked' : ''}> ${t('rule.tempLow.modeStop')}</label>
                    </div>
                    <div class="snw-rule-inputs">
                        <span>${t('rule.tempLow.threshold')}</span>
                        <input type="number" step="0.5" min="10" max="35" data-rule="tempLow.threshold" value="${_nz(r.tempLow.threshold, 22.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">°C</span>
                        <span class="snw-rule-hint" data-rule-hint="tempLow">${t('rule.tempLow.hysteresis')}</span>
                        <input type="number" step="0.5" min="0" max="10" data-rule="tempLow.hysteresis" value="${_nz(r.tempLow.hysteresis, 0.5)}" class="snw-input-sm">
                        <span class="snw-rule-unit">°C</span>
                    </div>
                </div>

                <div class="snw-rule-row snw-rule-row--stack">
                    <label><input type="checkbox" data-rule="diLow.enabled" ${r.diLow.enabled ? 'checked' : ''}> ${t('rule.diLow.enabled')}</label>
                    <div class="snw-rule-mode">
                        <label><input type="radio" name="diLowMode" value="PAUSE" ${r.diLow.mode === 'PAUSE' ? 'checked' : ''}> ${t('rule.tempLow.modePause')}</label>
                        <label><input type="radio" name="diLowMode" value="STOP"  ${r.diLow.mode === 'STOP'  ? 'checked' : ''}> ${t('rule.tempLow.modeStop')}</label>
                    </div>
                    <div class="snw-rule-inputs">
                        <span>${t('rule.tempLow.threshold')}</span>
                        <input type="number" step="1" min="0" max="100" data-rule="diLow.threshold" value="${_nz(r.diLow.threshold, 65.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">DI</span>
                        <span class="snw-rule-hint">${t('rule.tempLow.hysteresis')}</span>
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
                        <span class="snw-rule-unit">분 주기</span>
                    </div>
                </div>
            </fieldset>

            ${showSessionOption ? `
            <!-- 가동 중 세션 즉시 적용 옵션 (PATCH /session/rule) -->
            <div style="padding:8px 12px;background:rgba(46,196,182,0.1);border:1px solid rgba(46,196,182,0.3);border-radius:6px;font-size:12px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" data-apply-session checked>
                    <span>⚡ 현재 가동 중인 세션에 이 규칙 즉시 적용 (PATCH /session/rule)</span>
                </label>
            </div>` : ''}

            <div class="snw-rule-tips">
                <p>💡 ${t('rule.tipModes')}</p>
                <p>👶 ${t('rule.tipBabySafe')}</p>
            </div>
        </div>`;
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
         * @param {Object} opts     — { title?: string, allowApplySession?: boolean }
         * @returns {Promise<Object|null>}
         */
        showModal(initRule, opts) {
            const title = (opts && opts.title) || (SNW.I18n ? SNW.I18n.t('rule.title') : '규칙 편집');

            // 깊은 복사
            const working = JSON.parse(JSON.stringify(
                Object.assign({}, DEFAULT_RULE, initRule || {})
            ));
            for (const k of Object.keys(DEFAULT_RULE)) {
                if (!working[k]) working[k] = JSON.parse(JSON.stringify(DEFAULT_RULE[k]));
            }

            const store = (SNW.Store && SNW.Store.get) ? SNW.Store.get() : {};
            const sessionActive = store.session && (store.session.state === 'ACTIVE' || store.session.active);
            const showSessionOption = (opts && opts.allowApplySession !== false) && sessionActive;

            const content = document.createElement('div');
            content.innerHTML = _renderRuleForm(working, showSessionOption);

            function _rebind() {
                // 템플릿 재바인딩
                content.querySelectorAll('[data-rule-template]').forEach(btn => {
                    btn.onclick = () => {
                        const key = btn.getAttribute('data-rule-template');
                        const tpl = TEMPLATES[key];
                        if (!tpl) return;
                        Object.assign(working, JSON.parse(JSON.stringify(tpl.rule)));
                        content.innerHTML = _renderRuleForm(working, showSessionOption);
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
                        // 미리보기 갱신
                        const prev = _calcPreview(working);
                        const detailEl = content.querySelector('[data-slot="preview-detail"]');
                        if (detailEl) detailEl.textContent = prev.detail;
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
                            if (radio.checked) {
                                _setPath(working, key, radio.value);
                                const prev = _calcPreview(working);
                                const detailEl = content.querySelector('[data-slot="preview-detail"]');
                                if (detailEl) detailEl.textContent = prev.detail;
                            }
                        });
                    });
                });
            }
            _rebind();

            // 검증
            function _validate() {
                const errs = [];
                if (working.tempLow && working.tempLow.mode === 'PAUSE' && working.tempLow.enabled &&
                    (Number(working.tempLow.hysteresis) < 0.5)) {
                    errs.push(SNW.I18n.t('rule.validate.hysteresisTemp'));
                }
                if (working.diLow && working.diLow.mode === 'PAUSE' && working.diLow.enabled &&
                    (Number(working.diLow.hysteresis) < 3.0)) {
                    errs.push(SNW.I18n.t('rule.validate.hysteresisDi'));
                }
                return errs;
            }

            return new Promise(resolve => {
                SNW.UI.modal(
                    title, content,
                    async () => {
                        const errs = _validate();
                        if (errs.length > 0) {
                            if (SNW.ToastUtil) SNW.ToastUtil.warn(errs.join(' / '));
                            return false;
                        }

                        // 가동 중 세션 즉시 적용 체크 시 PATCH /session/rule 호출
                        const chkApply = content.querySelector('[data-apply-session]');
                        if (chkApply && chkApply.checked) {
                            try {
                                if (SNW.Api && typeof SNW.Api.patchSessionRule === 'function') {
                                    await SNW.Api.patchSessionRule(working);
                                    if (SNW.ToastUtil) SNW.ToastUtil.info('현재 세션에 규칙이 즉시 적용되었습니다');
                                }
                            } catch (e) {
                                if (SNW.ToastUtil) SNW.ToastUtil.warn('현재 세션 규칙 적용 실패: ' + (e.message || ''));
                            }
                        }

                        resolve(working);
                        return true;
                    },
                    () => { resolve(null); },
                    { width: '540px' }
                );
            });
        },

        DEFAULT_RULE,
        TEMPLATES,
    };
})(window.SNW);
