/*
 * ------------------------------------------------------
 * 소스명   : 270.page.network.js
 * 모듈     : SNW.Page.Network
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - Wi-Fi 상태 조회 (모드/SSID/IP/RSSI/MAC/Hostname/Connected)
 *  - Wi-Fi 스캔 및 접속 모달
 *  - NTP 설정 (서버/시간대/주기)
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Network = class Network {
        constructor(container) { this.el = container; this._active = true; this._formTime = null; }
        async mount() {
            this.el.innerHTML = ''; this.el.appendChild(SNW.Tpl.network()); SNW.I18n.applyTo(this.el);
            await Promise.all([this._loadState(), this._loadSystemTime()]);
            SNW.DomUtil.delegate(this.el, '[data-action="scan"]', 'click', () => this._onScan());
            SNW.DomUtil.delegate(this.el, '[data-action="time-save"]', 'click', () => this._onSaveTime());
        }
        unmount(){ this._active = false; }

        async _loadState() {
            const slot = this.el.querySelector('[data-slot="form"]'); if (!slot) return;
            let state = {};
            try { const data = await SNW.Api.getWifiState(); state = (data && data.wifi && data.wifi.state) || {}; } catch {}
            if (!this._active) return;
            slot.innerHTML = '';
            slot.appendChild(SNW.DomUtil.html`
                <div class="snw-network-state">
                    <div class="snw-kv"><span data-i18n="network.wifiMode">Wi-Fi 모드</span><b>${state.mode_name || '-'}</b></div>
                    <div class="snw-kv"><span data-i18n="network.ssid">SSID</span><b>${state.ssid || '-'}</b></div>
                    <div class="snw-kv"><span data-i18n="network.ip">IP</span><b>${state.ip || '-'}</b></div>
                    <div class="snw-kv"><span data-i18n="network.rssi">RSSI</span><b>${state.rssi != null ? state.rssi + ' dBm' : '-'}</b></div>
                    <!-- [신규] 세부 정보 -->
                    <div class="snw-kv"><span>MAC</span><b>${state.mac || '-'}</b></div>
                    <div class="snw-kv"><span>Hostname</span><b>${state.hostname || '-'}</b></div>
                    <div class="snw-kv"><span>Connected</span><b>${state.connected ? 'YES' : 'NO'}</b></div>
                    <div class="snw-toolbar"><button type="button" class="snw-btn" data-action="scan" data-i18n="network.scan">Wi-Fi 스캔</button></div>
                    <div data-slot="scan-result" class="snw-scan-result"></div>
                </div>`);
            SNW.I18n.applyTo(slot);
        }

        async _loadSystemTime() {
            try {
                const data = await SNW.Api.getSystem();
                if (!this._active) return;
                const sys = (data && data.system && data.system.timeCfg) || {};
                this._formTime = SNW.UI.form({ root:this.el.querySelector('[data-slot="form"]'),
                    schema:[
                        { key:'ntpServer', labelKey:'network.ntpServer', type:'text' },
                        { key:'timezone', labelKey:'network.timezone', type:'text' },
                        { key:'syncIntervalMin', labelKey:'network.syncInterval', type:'number', min:5, max:1440 }
                    ],
                    value:{ ntpServer:sys.ntpServer || 'pool.ntp.org', timezone:sys.timezone || 'Asia/Seoul', syncIntervalMin:sys.syncIntervalMin || 60 } });
                this.el.querySelector('[data-slot="form"]').appendChild(SNW.DomUtil.html`<div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="time-save" data-i18n="system.save">저장</button></div>`);
                SNW.I18n.applyTo(this.el);
            } catch (e) { SNW.LogUtil.warn('[Network] time config 로드 실패', e); }
        }

        async _onScan() {
            const resultSlot = this.el.querySelector('[data-slot="scan-result"]'); if (!resultSlot) return;
            resultSlot.innerHTML = ''; resultSlot.appendChild(SNW.DomUtil.html`<div class="snw-loading" data-i18n="common.loading">Loading...</div>`);
            try {
                const data = await SNW.Api.scanWifi(); if (!this._active) return;
                const scan = (data && data.wifi && data.wifi.scan) || [];
                resultSlot.innerHTML = '';
                if (!scan.length) resultSlot.appendChild(SNW.DomUtil.html`<div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
                else {
                    const list = document.createElement('div'); list.className = 'snw-wifi-list';
                    scan.sort((a, b) => (b.rssi || -999) - (a.rssi || -999)).forEach(ap => {
                        const item = SNW.DomUtil.html`<div class="snw-wifi-item" style="cursor:pointer;"><span class="snw-wifi-ssid">${ap.ssid || '-'}</span><span class="snw-wifi-enc">${ap.enc || ''}</span><span class="snw-wifi-rssi">${ap.rssi != null ? ap.rssi + ' dBm' : ''}</span></div>`;
                        
                        // [신규] Wi-Fi 클릭 시 설정 모달
                        item.addEventListener('click', () => this._onWifiSelect(ap));
                        list.appendChild(item);
                    });
                    resultSlot.appendChild(list);
                }
                SNW.I18n.applyTo(resultSlot);
            } catch (e) { SNW.ErrorHandler.handle(e, 'network.scan'); }
        }

        // [신규] Wi-Fi 설정 모달
        _onWifiSelect(ap) {
            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">SSID
                    <input type="text" id="wifi-ssid" value="${SNW.DomUtil.escape(ap.ssid || '')}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">Password
                    <input type="password" id="wifi-pass" value="" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
            `;
            SNW.UI.modal('Wi-Fi 연결', inputDiv, async () => {
                const ssid = inputDiv.querySelector('#wifi-ssid').value;
                const pass = inputDiv.querySelector('#wifi-pass').value;
                if (!ssid) { SNW.ToastUtil.warn('SSID를 입력하세요.'); return false; }
                try {
                    const cfg = await SNW.Api.getWifiConfig();
                    const wifi = cfg.wifi || {};
                    if (!wifi.sta) wifi.sta = [];
                    // 중복 제거
                    wifi.sta = wifi.sta.filter(s => s.ssid !== ssid);
                    wifi.sta.push({ ssid, pass });
                    await SNW.Api.patchWifi({ wifi });
                    SNW.ToastUtil.success('Wi-Fi 설정이 저장되었습니다.');
                    return true;
                } catch(e) { 
                    SNW.ErrorHandler.handle(e, 'network.wifiSave');
                    return false; 
                }
            });
        }

        async _onSaveTime() {
            if (!this._formTime) return;
            const v = this._formTime.getValue();
            const patch = { timeCfg:{ ntpServer:v.ntpServer, timezone:v.timezone, syncIntervalMin:Number(v.syncIntervalMin) } };
            try { await SNW.Api.patchSystem(patch); await SNW.Api.saveConfig(); await SNW.Api.reload(); SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess')); }
            catch (e) { SNW.ErrorHandler.handle(e, 'network.saveTime'); }
        }
    };
})(window.SNW);
