// =========================================================
// 230.page.profiles.js — 프로필 페이지 (단일 규격 일원화 파사드)
// Layer 3 (페이지 컴포넌트)
// [v0203 단일 규격] #/automation/playlist 패널(SNW.Playlist)로 위임
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Profiles = class Profiles {
            constructor(container, params = {}) {
                this.container = container;
                this.params = params;
                this.panel = null;
            }

        async mount() {
                if (!this.container) return;
                // 자동화 Playlist 패널로 위임
                if (SNW.Playlist) {
                    this.panel = new SNW.Playlist(this.container, this.params);
                    await this.panel.mount();
                } else if (SNW.Router && typeof SNW.Router.navigate === 'function') {
                    SNW.Router.navigate('/automation/playlist');
                }
            }

            unmount() {
                    if (this.panel && typeof this.panel.unmount === 'function') {
                        this.panel.unmount();
                        this.panel = null;
                    }
                }
            };
        })(window.SNW);
