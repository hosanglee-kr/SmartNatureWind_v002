// =========================================================
// 220.page.schedule.js — 스케줄 페이지 (단일 규격 일원화 파사드)
// Layer 3 (페이지 컴포넌트)
// [v0203 단일 규격] #/automation/schedule 패널(SNW.SchedulePanel)로 위임
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';

    SNW.Page.Schedule = class Schedule {
            constructor(container, params = {}) {
                this.container = container;
                this.params = params;
                this.panel = null;
            }

        async mount() {
                    if (!this.container) return;
                    // 자동화 스케줄 패널로 위임
                    if (SNW.SchedulePanel) {
                        this.panel = new SNW.SchedulePanel(this.container, this.params);
                        await this.panel.mount();
                    } else if (SNW.Router && typeof SNW.Router.navigate === 'function') {
                        SNW.Router.navigate('/automation/schedule');
                    }
                }

                        unmount() {
                            if (this.panel && typeof this.panel.unmount === 'function') {
                                this.panel.unmount();
                                this.panel = null;
                            }
                        }
                    };
                }) (window.SNW);
