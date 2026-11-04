// =========================================================
// 270.page.network.js — SNW.Page.Network
// Layer 4 (페이지 로직)
// [O-14] Wi-Fi 스캔 → 명시적 연결 모달 (즉시 추가 금지)
// =========================================================
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
            SNW.I18n.applyTo(this.el);

            try { await this._loadWifiState(); }   catch (e) {}
            try { await this._loadWifiConfig(); } catch (e) {}
            try { await this._loadSystemTime(); } catch (e) {}

            SNW.DomUtil.delegate(this.el, '[data-action="scan"]',       'click', () => this._onScan());
            SNW.DomUtil.delegate(this.el, '[data-action="time-save"]',  'click', () => this._onSaveTime());
            SNW.DomUtil.delegate(this.el, '[data-action="wifi-save"]',  'click', () => this._onSaveWifi());
            SNW.DomUtil.delegate(this.el, '[data-action="add-sta"]',    'click', () => this._onAddSta());
            SNW.DomUtil.delegate(this.el, '[data-action="del-sta"]',    'click', (e, el) => this._onDeleteSta(Number(el.getAttribute('data-idx'))));
        }

        unmount() { this._active = false; }

        async _loadWifiState() {
            let state = {};
            try {
                const data = await SNW.Api.getWifiState();
                state = (data && data.wifi && data.wifi.state) || {};
            } catch {}

            const slot = this.el.querySelector('[data-slot="wifi-state"]');
            if (!slot) return;

            const esc = SNW.DomUtil.escape;
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;

            slot.innerHTML = `
                <div class="snw-kv"><span>${t('network.wifiMode', 'Wi-Fi 모드')}</span><b>${esc(state.mode_name || '-')}</b></div>
                <div class="snw-kv"><span>${t('network.status', '연결 상태')}</span><b>${esc(state.status || '-')}</b></div>
                <div class="snw-kv"><span>SSID</span><b>${esc(state.ssid || '-')}</b></div>
                <div class="snw-kv"><span>${t('network.ip', 'IP 주소')}</span><b>${esc(state.ip || '-')}</b></div>
                <div class="snw-kv"><span>RSSI</span><b>${state.rssi != null ? state.rssi + ' dBm' : '-'}</b></div>
                <div class="snw-kv"><span>${t('network.mac', 'MAC 주소')}</span><b>${esc(state.mac || '-')}</b></div>
                <div class="snw-kv"><span>Hostname</span><b>${esc(state.hostname || '-')}</b></div>
                <div class="snw-kv"><span>${t('network.timeSynced', '시간 동기화')}</span>
                    <b>${state.timeSynced ? t('network.synced', '완료') : t('network.notSynced', '미완료')}</b></div>
                <div class="snw-kv"><span>Re-connect</span><b>${state.reconnectAttempts ?? 0}</b></div>
            `;
        }

        async _loadWifiConfig() {
            try {
                const data = await SNW.Api.getWifiConfig();
                this._wifiConfig = (data && data.wifi) ? data.wifi : { wifiMode: 2, ap: { ssid: '', pass: '' }, sta: [] };
                if (!this._wifiConfig.sta) this._wifiConfig.sta = [];
                if (!this._wifiConfig.ap)  this._wifiConfig.ap  = { ssid: '', pass: '' };
                this._renderWifiConfigForm();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'network.loadWifi');
            }
        }

        _renderWifiConfigForm() {
            const slot = this.el.querySelector('[data-slot="wifi-config"]');
            if (!slot || !this._wifiConfig) return;

            const mode = this._wifiConfig.wifiMode;
            const ap   = this._wifiConfig.ap;
            const sta  = this._wifiConfig.sta;

            let html = `
                <div class="snw-form-row">
                    <label>${SNW.I18n.t('network.wifiMode')}</label>
                    <select id="wifi-mode" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        <option value="0" ${mode === 0 ? 'selected' : ''}>AP Only</option>
                        <option value="1" ${mode === 1 ? 'selected' : ''}>STA Only</option>
                        <option value="2" ${mode === 2 ? 'selected' : ''}>AP + STA</option>
                    </select>
                </div>
                <h4 style="margin-top:12px;color:var(--snw-text-dim);">${SNW.I18n.t('network.apSettings')}</h4>
                <div class="snw-form-row">
                    <label>AP SSID</label>
                    <input type="text" id="ap-ssid" value="${SNW.DomUtil.escape(ap.ssid)}"
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>
                <div class="snw-form-row">
                    <label>AP Password</label>
                    <input type="password" id="ap-pass" value="${SNW.DomUtil.escape(ap.pass)}"
                           autocomplete="off" data-lpignore="true" data-1p-ignore="true"
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>

                <h4 style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;color:var(--snw-text-dim);">
                    <span>${SNW.I18n.t('network.staSettings')} (${sta.length})</span>
                    <button type="button" class="snw-btn" data-action="add-sta"
                            style="padding:4px 8px;font-size:11px;">+ ${SNW.I18n.t('common.add')}</button>
                </h4>
                <div id="sta-list">`;

            if (sta.length === 0) {
                html += `<div style="font-size:12px;color:var(--snw-text-dim);padding:8px;">${SNW.I18n.t('network.noStaNotice')}</div>`;
            } else {
                sta.forEach((s, idx) => {
                    html += `
                        <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
                            <input type="text" value="${SNW.DomUtil.escape(s.ssid)}" placeholder="SSID"
                                   style="flex:1;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"
                                   data-sta-ssid="${idx}">
                            <input type="password" value="${SNW.DomUtil.escape(s.pass)}" placeholder="Password"
                                   autocomplete="off" data-lpignore="true" data-1p-ignore="true"
                                   style="flex:1;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"
                                   data-sta-pass="${idx}">
                            <button type="button" class="snw-btn" data-action="del-sta" data-idx="${idx}"
                                    style="padding:8px;color:var(--snw-error);">🗑</button>
                        </div>`;
                });
            }

            html += `</div>
                <div class="snw-toolbar" style="margin-top:12px;">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="wifi-save">${SNW.I18n.t('network.saveWifi')}</button>
                    <button type="button" class="snw-btn" data-action="scan">${SNW.I18n.t('network.scanWifi')}</button>
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
            const mode   = Number(this.el.querySelector('#wifi-mode').value);
            const apSsid = this.el.querySelector('#ap-ssid').value;
            const apPass = this.el.querySelector('#ap-pass').value;

            const newSta = [];
            this.el.querySelectorAll('[data-sta-ssid]').forEach(el => {
                const idx  = el.getAttribute('data-sta-ssid');
                const ssid = el.value.trim();
                const passEl = this.el.querySelector(`[data-sta-pass="${idx}"]`);
                const pass = passEl ? passEl.value : '';
                if (ssid) newSta.push({ ssid, pass });
            });

            const patch = { wifi: { wifiMode: mode, ap: { ssid: apSsid, pass: apPass }, sta: newSta } };
            try {
                await SNW.Api.patchWifi(patch);
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'network.saveWifi');
            }
        }

        async _loadSystemTime() {
            try {
                const data = await SNW.Api.getSystem();
                const sys = (data && data.system && data.system.timeCfg) || {};
                const slot = this.el.querySelector('[data-slot="time-config"]');
                if (!slot) return;
                slot.innerHTML = `
                    <div class="snw-form-row">
                        <label>NTP Server</label>
                        <input type="text" id="ntp-server" value="${SNW.DomUtil.escape(sys.ntpServer || 'pool.ntp.org')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>Timezone</label>
                        <input type="text" id="timezone" value="${SNW.DomUtil.escape(sys.timezone || 'Asia/Seoul')}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-form-row">
                        <label>Sync Interval (min)</label>
                        <input type="number" id="sync-interval" min="1" max="1440" value="${sys.syncIntervalMin || 60}"
                               style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                    </div>
                    <div class="snw-toolbar">
                        <button type="button" class="snw-btn snw-btn-primary" data-action="time-save">${SNW.I18n.t('network.saveTime')}</button>
                    </div>
                `;
            } catch (e) {
                SNW.LogUtil.warn('[Network] time config load 실패', e);
            }
        }

        async _onSaveTime() {
            const ntp  = this.el.querySelector('#ntp-server').value.trim();
            const tz   = this.el.querySelector('#timezone').value.trim();
            const sync = Number(this.el.querySelector('#sync-interval').value);

            if (!ntp) {
                SNW.ToastUtil.error(SNW.I18n.t('validate.required', { field: 'NTP Server' }));
                return;
            }
            if (isNaN(sync) || sync < 1 || sync > 1440) {
                SNW.ToastUtil.error(SNW.I18n.t('validate.range', { field: 'Sync Interval', min: 1, max: 1440 }));
                return;
            }

            try {
                await SNW.Api.patchSystem({ timeCfg: { ntpServer: ntp, timezone: tz, syncIntervalMin: sync } });
                await SNW.Api.saveConfig();
                SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'network.saveTime');
            }
        }

        // =========================================================
        // [O-14] 스캔 결과 — 명시적 연결 버튼
        // =========================================================
        async _onScan() {
            const resultSlot = this.el.querySelector('[data-slot="scan-result"]');
            if (!resultSlot) return;

            resultSlot.innerHTML = `<div style="font-size:12px;padding:8px;">${SNW.I18n.t('common.loading')}</div>`;

            try {
                const data = await SNW.Api.scanWifi();
                const scan = (data && data.wifi && data.wifi.scan) || [];
                resultSlot.innerHTML = '';

                if (!scan.length) {
                    resultSlot.innerHTML = `<div style="font-size:12px;color:var(--snw-text-dim);padding:8px;">${SNW.I18n.t('common.noData')}</div>`;
                    return;
                }

                scan.forEach(ap => {
                    const item = document.createElement('div');
                    item.className = 'snw-wifi-item';
                    item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--snw-surface-2);margin-bottom:4px;border-radius:4px;';
                    item.innerHTML = `
                        <div>
                            <div style="font-size:13px;">${SNW.DomUtil.escape(ap.ssid)}</div>
                            <div style="font-size:11px;color:var(--snw-text-dim);">${ap.rssi} dBm · ${SNW.DomUtil.escape(ap.enc || '-')}</div>
                        </div>
                        <button type="button" class="snw-btn snw-btn--sm">
                            ${SNW.I18n.t('network.connect')}
                        </button>`;
                    item.querySelector('button').onclick = () => this._onConnectSsid(ap.ssid);
                    resultSlot.appendChild(item);
                });
            } catch (e) {
                resultSlot.innerHTML = `<div style="color:var(--snw-error);padding:8px;">${SNW.I18n.t('common.error')}</div>`;
            }
        }

        // [O-14] 연결 모달 — 명시적 비밀번호 입력
        _onConnectSsid(ssid) {
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="snw-form-row">
                    <label>SSID</label>
                    <input type="text" value="${SNW.DomUtil.escape(ssid)}" readonly
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>
                <div class="snw-form-row">
                    <label>Password (8자 이상)</label>
                    <input type="password" id="connect-pass" minlength="8"
                           autocomplete="off" data-lpignore="true" data-1p-ignore="true"
                           style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                </div>
            `;

            SNW.UI.modal(
                SNW.I18n.t('network.connect'),
                content,
                async () => {
                    const pass = content.querySelector('#connect-pass').value;
                    if (pass.length < 8) {
                        SNW.ToastUtil.error('비밀번호는 8자 이상이어야 합니다');
                        return false;
                    }

                    // 중복 확인
                    const idx = this._wifiConfig.sta.findIndex(s => s.ssid === ssid);
                    if (idx >= 0) this._wifiConfig.sta[idx].pass = pass;
                    else this._wifiConfig.sta.push({ ssid, pass });

                    this._renderWifiConfigForm();
                    SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                    return true;
                }
            );
        }
    };
})(window.SNW);
