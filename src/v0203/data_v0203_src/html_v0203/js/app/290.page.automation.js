// =========================================================
// app/290.page.automation.js — 공용 탭 컨테이너
// Layer 4 (Panel)
//  - /wind/* : 4탭 (studio / simulation / playlist / presets)
//  - /automation/* : 3탭 (schedule / timer / rules)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    const TABS_WIND = [
        { key: 'studio',     label: '🎨 Studio' },
        { key: 'simulation', label: '🎮 체험실' },
        { key: 'playlist',   label: '🎵 Playlist' },
        { key: 'presets',    label: '🌿 프리셋' },
    ];
    const TABS_AUTO = [
        { key: 'schedule', label: '⏰ 스케줄' },
        { key: 'timer',    label: '⏱️ 타이머' },
        { key: 'rules',    label: '📐 규칙' },
    ];

    SNW.Page.Automation = class Automation {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this._active = true;
            this._panels = {};
            // params.tab이 wind 세트인지 automation 세트인지 판별
            const windKeys = ['studio', 'simulation', 'playlist', 'presets'];
            const isWind = windKeys.includes(params.tab || 'studio');
            this.mode = isWind ? 'wind' : 'automation';
            const validTabs = isWind ? TABS_WIND : TABS_AUTO;
            this.currentTab = validTabs.find(t => t.key === params.tab)?.key || validTabs[0].key;
            this.tabs = validTabs;
        }

        async mount() {
            const t = this.tabs;
            this.el.innerHTML = `
                <div class="snw-automation">
                    <div class="snw-tabs snw-automation__tabs" style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--snw-border,#2f3844);padding-bottom:8px;overflow-x:auto;">
                        ${t.map(tb => `
                            <button type="button" class="snw-tab-btn ${tb.key === this.currentTab ? 'is-active' : ''}" data-tab="${tb.key}">
                                ${tb.label}
                            </button>
                        `).join('')}
                    </div>
                    <div class="snw-automation__content" data-slot="panel"></div>
                </div>`;

            this.el.querySelectorAll('.snw-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.getAttribute('data-tab');
                    if (tab !== this.currentTab) {
                        const base = (this.mode === 'wind') ? '/wind' : '/automation';
                        SNW.Router.navigate(`${base}/${tab}`);
                    }
                });
            });

            await this._mountTab(this.currentTab);
        }

        unmount() {
            this._active = false;
            Object.values(this._panels).forEach(p => {
                if (p && typeof p.unmount === 'function') p.unmount();
            });
            this._panels = {};
        }

        async _mountTab(tab) {
            const prev = this._panels[this.currentTab];
            if (prev && prev !== this._panels[tab] && typeof prev.unmount === 'function') {
                prev.unmount();
            }

            const slot = this.el.querySelector('[data-slot="panel"]');
            if (!slot) return;
            slot.innerHTML = '';

            // 탭 → 클래스 매핑
            const panelMap = {
                studio:     SNW.Studio,
                simulation: SNW.Page.Simulation,
                playlist:   SNW.Playlist,
                presets:    SNW.Page.Windprofile,
                schedule:   SNW.SchedulePanel,
                timer:      SNW.TimerPanel,
                rules:      SNW.Page.Rules,
            };

            const PanelClass = panelMap[tab];
            if (!PanelClass) {
                slot.innerHTML = `<div class="snw-empty">${SNW.DomUtil ? SNW.DomUtil.escape(tab) : tab} 준비 중</div>`;
                return;
            }

            const panel = new PanelClass(slot, this.params);
            this._panels[tab] = panel;
            this.currentTab = tab;
            await panel.mount();
        }
    };
})(window.SNW);
