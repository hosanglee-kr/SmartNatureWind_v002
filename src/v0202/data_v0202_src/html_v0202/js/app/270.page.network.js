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
 
/* ---- 270.page.network.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    SNW.Page.Network = class Network {
        constructor(container) { 
            this.el = container; 
            this._active = true; 
            this._wifiConfig = null;
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.network());
            try { await this._loadWifiState(); } catch(e) { console.error(e); }
            try { await this._loadWifiConfig(); } catch(e) { console.error(e); }
            try { await this._loadSystemTime(); } catch(e) { console.error(e); }
            
            SNW.DomUtil.delegate(this.el, '[data-action="scan"]', 'click', () => this._onScan());
            SNW.DomUtil.delegate(this.el, '[data-action="time-save"]', 'click', () => this._onSaveTime());
            SNW.DomUtil.delegate(this.el, '[data-action="wifi-save"]', 'click', () => this._onSaveWifi());
            SNW.DomUtil.delegate(this.el, '[data-action="add-sta"]', 'click', () => this._onAddSta());
            SNW.DomUtil.delegate(this.el, '[data-action="del-sta"]', 'click', (e, el) => this._onDeleteSta(Number(el.getAttribute('data-idx'))));
        }
        unmount(){ this._active = false; }

        async _loadWifiState() {
            let state = {};
            try { const data = await SNW.Api.getWifiState(); state = (data && data.wifi && data.wifi.state) || {}; } catch {}
            const slot = this.el.querySelector('[data-slot="wifi-state"]');
            if (!slot) return;
            slot.innerHTML = `
                <div class="snw-kv"><span>Wi-Fi 모드</span><b>${state.mode_name || '-'}</b></div>
                <div class="snw-kv"><span>연결 상태</span><b>${state.status || '-'}</b></div>
                <div class="snw-kv"><span>SSID</span><b>${state.ssid || '-'}</b></div>
                <div class="snw-kv"><span>IP 주소</span><b>${state.ip || '-'}</b></div>
                <div class="snw-kv"><span>RSSI</span><b>${state.rssi != null ? state.rssi + ' dBm' : '-'}</b></div>
                <div class="snw-kv"><span>MAC 주소</span><b>${state.mac || '-'}</b></div>
                <div class="snw-kv"><span>Hostname</span><b>${state.hostname || '-'}</b></div>
                <div class="snw-kv"><span>시간 동기화</span><b>${state.timeSynced ? '완료' : '미완료'}</b></div>
                <div class="snw-kv"><span>재연결 시도</span><b>${state.reconnectAttempts ?? 0}</b></div>
            `;
        }

        async _loadWifiConfig() {
            try {
                const data = await SNW.Api.getWifiConfig();
                this._wifiConfig = (data && data.wifi) ? data.wifi : { wifiMode: 2, ap: { ssid: '', pass: '' }, sta: [] };
                if (!this._wifiConfig.sta) this._wifiConfig.sta = [];
                if (!this._wifiConfig.ap) this._wifiConfig.ap = { ssid: '', pass: '' };
                this._renderWifiConfigForm();
            } catch(e) { console.error(e); }
        }

        _renderWifiConfigForm() {
            const slot = this.el.querySelector('[data-slot="wifi-config"]');
            if (!slot || !this._wifiConfig) return;
            
            const mode = this._wifiConfig.wifiMode;
            const ap = this._wifiConfig.ap;
            const sta = this._wifiConfig.sta;

            let html = `
                <div class="snw-form-row">
                    <label>Wi-Fi 모드</label>
                    <select id="wifi-mode" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <option value="0" ${mode===0?'selected':''}>AP Only</option>
                        <option value="1" ${mode===1?'selected':''}>STA Only</option>
                        <option value="2" ${mode===2?'selected':''}>AP + STA</option>
                    </select>
                </div>
                <h4 style="margin-top:12px;color:var(--snw-text-dim);">AP 설정</h4>
                <div class="snw-form-row"><label>AP SSID</label><input type="text" id="ap-ssid" value="${SNW.DomUtil.escape(ap.ssid)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>AP Password</label><input type="password" id="ap-pass" value="${SNW.DomUtil.escape(ap.pass)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                
                <h4 style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;color:var(--snw-text-dim);">
                    <span>STA 목록 (${sta.length}개)</span>
                    <button type="button" class="snw-btn" data-action="add-sta" style="padding:4px 8px;font-size:11px;">+ 추가</button>
                </h4>
                <div id="sta-list">
            `;

            if (sta.length === 0) {
                html += `<div style="font-size:12px;color:var(--snw-text-dim);padding:8px;">저장된 Wi-Fi가 없습니다.</div>`;
            } else {
                sta.forEach((s, idx) => {
                    html += `
                        <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
                            <input type="text" value="${SNW.DomUtil.escape(s.ssid)}" placeholder="SSID" style="flex:1;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);" data-sta-ssid="${idx}">
                            <input type="text" value="${SNW.DomUtil.escape(s.pass)}" placeholder="Password" style="flex:1;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);" data-sta-pass="${idx}">
                            <button type="button" class="snw-btn" data-action="del-sta" data-idx="${idx}" style="padding:8px;color:var(--snw-error);">🗑</button>
                        </div>
                    `;
                });
            }
            
            html += `</div>
                <div class="snw-toolbar" style="margin-top:12px;">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="wifi-save">Wi-Fi 설정 저장</button>
                    <button type="button" class="snw-btn" data-action="scan">Wi-Fi 스캔</button>
                </div>
                <div data-slot="scan-result" class="snw-scan-result" style="margin-top:12px;"></div>
            `;
            slot.innerHTML = html;
        }

        _onAddSta() {
            if (!this._wifiConfig.sta) this._wifiConfig.sta = [];
            this._wifiConfig.sta.push({ ssid: '', pass: '' });
            this._renderWifiConfigForm();
        }

        _onDeleteSta(idx) {
            if (!this._wifiConfig.sta) return;
            this._wifiConfig.sta.splice(idx, 1);
            this._renderWifiConfigForm();
        }

        async _onSaveWifi() {
            const mode = Number(this.el.querySelector('#wifi-mode').value);
            const apSsid = this.el.querySelector('#ap-ssid').value;
            const apPass = this.el.querySelector('#ap-pass').value;
            
            const newSta = [];
            this.el.querySelectorAll('[data-sta-ssid]').forEach(el => {
                const idx = el.getAttribute('data-sta-ssid');
                const ssid = el.value;
                const pass = this.el.querySelector(`[data-sta-pass="${idx}"]`).value;
                if (ssid) newSta.push({ ssid, pass });
            });

            const patch = { wifi: { wifiMode: mode, ap: { ssid: apSsid, pass: apPass }, sta: newSta } };
            try {
                await SNW.Api.patchWifi(patch);
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success('Wi-Fi 설정이 저장되었습니다.');
            } catch(e) { SNW.ErrorHandler.handle(e, 'network.saveWifi'); }
        }

        async _loadSystemTime() {
            try {
                const data = await SNW.Api.getSystem();
                const sys = (data && data.system && data.system.timeCfg) || {};
                const slot = this.el.querySelector('[data-slot="time-config"]');
                if (!slot) return;
                slot.innerHTML = `
                    <div class="snw-form-row"><label>NTP Server</label><input type="text" id="ntp-server" value="${SNW.DomUtil.escape(sys.ntpServer || 'pool.ntp.org')}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Timezone</label><input type="text" id="timezone" value="${SNW.DomUtil.escape(sys.timezone || 'Asia/Seoul')}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row"><label>Sync Interval (min)</label><input type="number" id="sync-interval" value="${sys.syncIntervalMin || 60}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="time-save">시간 설정 저장</button></div>
                `;
            } catch (e) {}
        }

        async _onSaveTime() {
            const ntp = this.el.querySelector('#ntp-server').value;
            const tz = this.el.querySelector('#timezone').value;
            const sync = Number(this.el.querySelector('#sync-interval').value);
            try {
                await SNW.Api.patchSystem({ timeCfg: { ntpServer: ntp, timezone: tz, syncIntervalMin: sync } });
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success('시간 설정 저장됨');
            } catch(e) { SNW.ErrorHandler.handle(e, 'network.saveTime'); }
        }

        async _onScan() {
            const resultSlot = this.el.querySelector('[data-slot="scan-result"]'); 
            if (!resultSlot) return;
            resultSlot.innerHTML = '<div style="font-size:12px;padding:8px;">스캔 중...</div>';
            try {
                const data = await SNW.Api.scanWifi();
                const scan = (data && data.wifi && data.wifi.scan) || [];
                resultSlot.innerHTML = '';
                if (!scan.length) {
                    resultSlot.innerHTML = '<div style="font-size:12px;color:var(--snw-text-dim);padding:8px;">검색된 Wi-Fi 없음</div>';
                } else {
                    scan.forEach(ap => {
                        const item = document.createElement('div');
                        item.className = 'snw-wifi-item';
                        item.style.cssText = 'cursor:pointer;padding:8px;display:flex;justify-content:space-between;background:var(--snw-surface-2);margin-bottom:4px;border-radius:4px;';
                        item.innerHTML = `<span>${ap.ssid}</span><span>${ap.rssi} dBm (${ap.enc})</span>`;
                        item.onclick = () => {
                            this._wifiConfig.sta = this._wifiConfig.sta || [];
                            if (!this._wifiConfig.sta.find(s => s.ssid === ap.ssid)) {
                                this._wifiConfig.sta.push({ ssid: ap.ssid, pass: '' });
                            }
                            this._renderWifiConfigForm();
                            SNW.ToastUtil.success('STA 목록에 추가되었습니다.');
                        };
                        resultSlot.appendChild(item);
                    });
                }
            } catch(e) { resultSlot.innerHTML = '스캔 실패'; }
        }
    };
})(window.SNW);
