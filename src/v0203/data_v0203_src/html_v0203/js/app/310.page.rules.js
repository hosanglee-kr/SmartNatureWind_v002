// =========================================================
// app/310.page.rules.js — 규칙 관리 페이지 (자동화 탭)
// Layer 4 (Page) — 프로파일/스케줄 규칙 통합 관리
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Rules = class Rules {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._schedules = [];
        }

        async mount() {
            this.el.innerHTML = `
                <section class="snw-card">
                    <h2 data-i18n="rule.title">⚙ 규칙 관리</h2>
                    <div class="snw-rules-sections" data-slot="sections">
                        <div class="snw-loading">로딩 중...</div>
                    </div>
                </section>`;
            SNW.I18n.applyTo(this.el);

            await this._load();
            this._render();

            // 이벤트 위임
            SNW.DomUtil.delegate(this.el, '[data-action="edit-rule"]', 'click', (e, btn) => {
                const scope = btn.getAttribute('data-scope');
                const idx = Number(btn.getAttribute('data-idx'));
                this._onEditRule(scope, idx);
            });
        }

        unmount() { this._active = false; }

        async _load() {
            try {
                const [pData, sData] = await Promise.all([
                    SNW.Api.listProfiles ? SNW.Api.listProfiles() : null,
                    SNW.Api.listSchedules ? SNW.Api.listSchedules() : null,
                ]);
                const pRoot = (pData && pData.userProfiles) ? pData.userProfiles : pData;
                this._profiles = (pRoot && pRoot.profiles) || [];
                const sRoot = (sData && sData.schedules) ? sData.schedules : sData;
                this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Rules] load fail', e);
            }
        }

        _ruleSummary(rule) {
            if (!rule) return '미설정';
            const items = [];
            if (rule.timer && rule.timer.enabled)     items.push(`⏱️${rule.timer.minutes}m`);
            if (rule.offTime && rule.offTime.enabled) items.push(`⏰${rule.offTime.time}`);
            if (rule.tempLow && rule.tempLow.enabled) items.push(`🌡️${rule.tempLow.mode}`);
            if (rule.diLow && rule.diLow.enabled)     items.push(`☀️${rule.diLow.mode}`);
            if (rule.pirPause && rule.pirPause.enabled) items.push(`👤${rule.pirPause.holdSec}s`);
            if (rule.smartComfort && rule.smartComfort.enabled) items.push(`✨auto`);
            return items.length > 0 ? items.join(' · ') : '미설정';
        }

        _render() {
            const slot = this.el.querySelector('[data-slot="sections"]');
            if (!slot) return;

            const t = (k) => (SNW.I18n ? SNW.I18n.t(k) : k);
            const esc = (v) => (SNW.DomUtil ? SNW.DomUtil.escape(v) : String(v));

            slot.innerHTML = `
                <div class="snw-rules-section">
                    <h3>${t('auto.rules.profileSection')}</h3>
                    ${this._profiles.length === 0
                        ? '<div class="snw-empty">프로파일 없음</div>'
                        : this._profiles.map((p, i) => `
                            <div class="snw-rules-item">
                                <div class="snw-rules-item__name">📋 ${esc(p.name)}</div>
                                <div class="snw-rules-item__summary">${this._ruleSummary(p.rule)}</div>
                                <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" data-scope="profile" data-idx="${i}">편집 →</button>
                            </div>
                        `).join('')}
                </div>

                <div class="snw-rules-section">
                    <h3>${t('auto.rules.scheduleSection')}</h3>
                    ${this._schedules.length === 0
                        ? '<div class="snw-empty">스케줄 없음</div>'
                        : this._schedules.map((s, i) => `
                            <div class="snw-rules-item">
                                <div class="snw-rules-item__name">📅 ${esc(s.name)}</div>
                                <div class="snw-rules-item__summary">
                                    ${s.ruleOverride
                                        ? this._ruleSummary(s.rule)
                                        : t('auto.rules.inheritHint')}
                                </div>
                                <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" data-scope="schedule" data-idx="${i}">편집 →</button>
                            </div>
                        `).join('')}
                </div>
            `;
        }

        async _onEditRule(scope, idx) {
            let current = null;
            let saveFn = null;

            if (scope === 'profile') {
                const p = this._profiles[idx];
                current = p.rule;
                saveFn = async (newRule) => {
                    p.rule = newRule;
                    if (SNW.Api && SNW.Api.updateProfile) {
                        await SNW.Api.updateProfile(p.profileId, { profile: p });
                        await SNW.Api.saveConfig();
                    }
                };
            } else if (scope === 'schedule') {
                const s = this._schedules[idx];
                current = s.rule;
                saveFn = async (newRule) => {
                    s.ruleOverride = true;
                    s.rule = newRule;
                    if (SNW.Api && SNW.Api.updateSchedule) {
                        await SNW.Api.updateSchedule(s.schId, s);
                        await SNW.Api.saveConfig();
                    }
                };
            }

            if (!SNW.UI.ruleEditor) return;

            const newRule = await SNW.UI.ruleEditor.showModal(current);
            if (!newRule) return;

            try {
                await saveFn(newRule);
                if (SNW.ToastUtil) SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                await this._load();
                this._render();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
            }
        }
    };
})(window.SNW);

