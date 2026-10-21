/* ---- 200.page.sensors.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Sensors = class Sensors {
        constructor(container) { this.el = container; this._active = true; }
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.sensors());
            SNW.I18n.applyTo(this.el);

            // DHT22 / PIR 설정 폼
            const data = await SNW.Api.getSystem().catch(()=> ({}));
            const hw = data.hw || {};
            const pir = hw.pir || { enabled:true, pin:13, debounceSec:5, holdSec:120 };
            const dht = hw.tempHum || { enabled:true, type:"DHT22", pin:17, intervalSec:30 };

            const formSchema = [
                { key: 'pirEnabled', labelKey: 'sensor.pir', type: 'bool' },
                { key: 'pirPin', labelKey: 'Pin', type: 'number' },
                { key: 'pirHold', labelKey: 'sensor.holdSec', type: 'number' },
                { key: 'dhtEnabled', labelKey: 'sensor.dht22', type: 'bool' },
                { key: 'dhtPin', labelKey: 'Pin', type: 'number' },
                { key: 'dhtInterval', labelKey: 'sensor.intervalSec', type: 'number' }
            ];
            const formValues = {
                pirEnabled: pir.enabled, pirPin: pir.pin, pirHold: pir.holdSec,
                dhtEnabled: dht.enabled, dhtPin: dht.pin, dhtInterval: dht.intervalSec
            };

            const form = SNW.UI.form({
                root: this.el.querySelector('[data-slot="sensors"]'),
                schema: formSchema,
                value: formValues,
                onSave: async (val) => {
                    try {
                        await SNW.Api.patchSystem({ 
                            hw: { 
                                pir: { enabled: val.pirEnabled, pin: Number(val.pirPin), holdSec: Number(val.pirHold) },
                                tempHum: { enabled: val.dhtEnabled, pin: Number(val.dhtPin), intervalSec: Number(val.dhtInterval) }
                            } 
                        });
                        SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                    } catch(e) { SNW.ErrorHandler.handle(e, 'sensors.save'); }
                }
            });

            // PIR 피드 테스트 버튼 추가
            const toolbar = SNW.DomUtil.html`<div class="snw-toolbar" style="margin-top:16px"><button type="button" class="snw-btn snw-btn-primary" data-action="feed-pir" data-i18n="sensor.pirFeed">PIR 피드 테스트</button></div>`;
            this.el.querySelector('[data-slot="sensors"]').appendChild(toolbar);
            
            SNW.DomUtil.delegate(this.el, '[data-action="feed-pir"]', 'click', async () => {
                try {
                    await SNW.Api.feedPir(true);
                    SNW.ToastUtil.success('PIR 신호 전송 완료');
                } catch(e) { SNW.ErrorHandler.handle(e, 'sensors.feed'); }
            });
            SNW.I18n.applyTo(this.el);
        }
        unmount(){ this._active = false; }
    };
})(window.SNW);
