// =========================================================
// 290.page.automation.js — 자동화 페이지 (Studio/Playlist/스케줄/타이머)
// Layer 3 (페이지 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Automation = class Automation {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this.currentTab = params.tab || 'studio';
            this._active = true;
            this._panels = {};
        }

        async mount() {
            this.el.innerHTML = `
                <div class="snw-automation">
                    <div class="snw-tabs snw-automation__tabs" style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--snw-border,#2f3844);padding-bottom:8px;overflow-x:auto;">
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'studio'   ? 'is-active' : ''}" data-tab="studio">🎨 Studio</button>
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'playlist' ? 'is-active' : ''}" data-tab="playlist">🎵 Playlist</button>
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'schedule' ? 'is-active' : ''}" data-tab="schedule">⏰ 스케줄</button>
                        <button type="button" class="snw-tab-btn ${this.currentTab === 'timer'    ? 'is-active' : ''}" data-tab="timer">⏱️ 타이머</button>
                    </div>
                    <div class="snw-automation__content" data-slot="panel"></div>
                </div>`;

            // 탭 클릭
            this.el.querySelectorAll('.snw-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.getAttribute('data-tab');
                    if (tab !== this.currentTab) {
                        SNW.Router.navigate(`/automation/${tab}`);
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
            // 이전 탭 정리
            const prev = this._panels[this.currentTab];
            if (prev && prev !== this._panels[tab] && typeof prev.unmount === 'function') {
                prev.unmount();
            }

            const slot = this.el.querySelector('[data-slot="panel"]');
            if (!slot) return;
            slot.innerHTML = '';

            const PanelClass = {
                studio:   SNW.Studio,
                playlist: SNW.Playlist,
                schedule: SNW.SchedulePanel,
                timer:    SNW.TimerPanel,
            }[tab];

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

