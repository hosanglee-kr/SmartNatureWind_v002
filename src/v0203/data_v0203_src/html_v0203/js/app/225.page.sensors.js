// =========================================================
// 225.page.sensors.js — SNW.Page.Sensors
// Layer 4 (페이지 로직)
// [O-13] PIR 테스트 피드백 (2초 내 실제 감지 확인 + flash)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';
    
    SNW.Page.Sensors = class Sensors {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._unsubs = [];
        }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.sensors());
            SNW.I18n.applyTo(this.el);
            
            // 센서 카드 실시간 갱신
            const unsub = SNW.Store.watch('control', ctl => {
                if (!this._active || !ctl || !ctl.sensor) return;
                const s = ctl.sensor;
                const set = (sel, val) => {
                    const el = this.el.querySelector(sel);
                    if (el) el.textContent = val;
                };
                set('[data-slot="sensor-temp"]', s.tempC != null ? s.tempC.toFixed(1) + SNW.I18n.t('unit.celsius') : '--');
                set('[data-slot="sensor-hum"]', s.humidity != null ? s.humidity.toFixed(0) + SNW.I18n.t('unit.humidity') : '--');
                set('[data-slot="sensor-motion"]',
                    s.motionActive ?
                    SNW.I18n.t('dashboard.motionDetected') :
                    SNW.I18n.t('dashboard.motionAbsent'));
            });
            this._unsubs.push(unsub);
            
            // [Stage 5] 모션 설정은 /automation/rules로 이관
            //  - PIR 테스트 피드만 이 화면에 유지

            // [m2 수정] 이관 안내 표시
            const formSlot = this.el.querySelector('[data-slot="motion-config"]');
            if (formSlot) {
                formSlot.innerHTML = `
                    <div class="snw-empty" style="font-size:12px;color:var(--snw-text-dim,#8b949e);padding:12px;line-height:1.8;">
                        ⚙ PIR <b>유지시간(holdSec)</b> 및 세션 규칙은
                        <a href="#/automation/rules" style="color:var(--snw-primary,#4a9eff);text-decoration:underline;">자동화 → 규칙</a>
                        에서 설정합니다.<br>
                        🔧 PIR <b>핀/디바운스</b>는
                        <a href="#/settings/hardware" style="color:var(--snw-primary,#4a9eff);text-decoration:underline;">설정 → 하드웨어</a>
                        에서 설정합니다.
                    </div>`;
            }
            
            // =========================================================
            // [O-13] PIR 피드 — 실제 감지 확인 + 시각 피드백
            // =========================================================
            SNW.DomUtil.delegate(this.el, '[data-action="feed-pir"]', 'click', async (e, btn) => {
                btn.disabled = true;
                try {
                    await SNW.Api.feedPir(true);
                    SNW.ToastUtil.info(SNW.I18n.t('sensors.feedPirSuccess'));
                    
                    // 1.5초 후 실제 감지 확인
                    setTimeout(() => {
                        const ctl = SNW.Store.get().control;
                        const isDetected = ctl?.sensor?.motionActive === true;
                        if (isDetected) {
                            SNW.ToastUtil.success(SNW.I18n.t('pir.testSuccess'));
                            const card = this.el.querySelector('[data-slot="sensor-motion"]')?.closest('.snw-sensor-card');
                            if (card) {
                                card.classList.add('is-detecting');
                                setTimeout(() => card.classList.remove('is-detecting'), 2000);
                            }
                        } else {
                            SNW.ToastUtil.error(SNW.I18n.t('pir.testFail'));
                        }
                        btn.disabled = false;
                    }, 1500);
                } catch (err) {
                    btn.disabled = false;
                    SNW.ErrorHandler.handle(err, 'sensors.pir');
                }
            });
            

        }
        
        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
        }
    };
})(window.SNW);
