/*
 * ------------------------------------------------------
 * 소스명   : 230.page.profiles.js
 * 모듈     : SNW.Page.Profiles
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 6 프로필 목록 조회
 *  - 원클릭 시작 (/control/profile/select)
 *  - 정지 (/control/profile/stop)
 *  - 삭제
 *  - 활성 프로필 강조 (control.profile.profileNo 참조)
 * ------------------------------------------------------
 */
/* ---- 230.page.profiles.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    
    SNW.Page.Profiles = class Profiles {
        constructor(container) { 
            this.el = container; 
            this._unsubs = []; 
            this._active = true; 
            this._profiles = []; 
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.profiles());
            SNW.I18n.applyTo(this.el);
            await this._load();

            SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => { 
                const no = Number(el.getAttribute('data-no')); 
                if (no) this._onStart(no); 
            });
            SNW.DomUtil.delegate(this.el, '[data-action="stop-profile"]', 'click', () => this._onStop());
            SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => { 
                const id = Number(el.getAttribute('data-id')); 
                if (id) this._onDelete(id); 
            });
            SNW.DomUtil.delegate(this.el, '[data-action="add-profile"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-profile"]', 'click', (e, el) => { 
                const id = Number(el.getAttribute('data-id')); 
                if (id) this._onEdit(id); 
            });

            const unsub = SNW.Store.watch('control', ctl => {
                if (!this._active || !ctl) return;
                const activeNo = ctl.profile && ctl.profile.profileNo;
                this._highlightActive(activeNo);
            });
            this._unsubs.push(unsub);
        }

        unmount() { 
            this._active = false; 
            this._unsubs.forEach(fn => { try { fn(); } catch {} }); 
            this._unsubs = []; 
        }

        async _load() {
            try { 
                const data = await SNW.Api.listProfiles(); 
                if (!this._active) return; 
                this._profiles = (data && data.userProfiles && data.userProfiles.profiles) || []; 
                this._renderList(); 
            } catch (e) { SNW.ErrorHandler.handle(e, 'profiles.load'); }
        }

        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]'); 
            if (!listSlot) return;
            
            listSlot.innerHTML = '';
            listSlot.appendChild(SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn" data-action="stop-profile" data-i18n="profile.stop">정지</button>
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-profile" data-i18n="common.add">추가</button>
                </div>`);

            if (!this._profiles.length) { 
                listSlot.appendChild(SNW.DomUtil.html`<div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`); 
                return; 
            }

            const wrap = document.createElement('div'); 
            wrap.className = 'snw-profile-list';
            
            this._profiles.forEach(p => {
                const disabled = !p.enabled;
                
                let segStr = '-';
                if (p.segments && p.segments.length) {
                    segStr = p.segments.map(sg => `[${sg.mode}] On:${sg.onMinutes}m/Off:${sg.offMinutes}m`).join(' | ');
                }
                let aoStr = 'AutoOff: 없음';
                if (p.autoOff) {
                    const ao = p.autoOff; 
                    const parts = [];
                    if (ao.timer && ao.timer.enabled) parts.push(`타이머 ${ao.timer.minutes}분`);
                    if (ao.offTime && ao.offTime.enabled) parts.push(`종료 ${ao.offTime.time}`);
                    if (ao.offTemp && ao.offTemp.enabled) parts.push(`온도 ${ao.offTemp.temp}°C`);
                    if (parts.length) aoStr = `AutoOff: ${parts.join(', ')}`;
                }
                let pirStr = 'PIR: 없음';
                if (p.motion && p.motion.pir) {
                    pirStr = `PIR: ${p.motion.pir.enabled ? '켜짐' : '꺼짐'} (Hold: ${p.motion.pir.holdSec || 0}s)`;
                }

                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-profile-item ${disabled ? 'is-disabled' : ''}" data-profile-no="${p.profileNo}">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${p.profileNo}</span>
                            <span class="snw-profile-name">${p.name || ''}</span>
                            <button type="button" class="snw-btn-icon" data-action="edit-profile" data-id="${p.profileId}" title="편집">✏️</button>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger" data-action="del-profile" data-id="${p.profileId}">🗑</button>
                        </div>
                        <div class="snw-profile-segcount">${p.segCount || 0} segments</div>
                        <div class="snw-profile-details" style="font-size:11px;color:var(--snw-text-dim);margin-top:8px;border-top:1px solid var(--snw-border);padding-top:4px;">
                            <div>세그먼트: ${segStr}</div>
                            <div>${aoStr}</div>
                            <div>${pirStr}</div>
                        </div>
                        <div class="snw-profile-actions">
                            <button type="button" class="snw-btn snw-btn-primary" data-action="start-profile" data-no="${p.profileNo}" ${disabled ? 'disabled' : ''} data-i18n="profile.start">시작</button>
                        </div>
                    </div>`);
            });
            
            listSlot.appendChild(wrap);
            SNW.I18n.applyTo(listSlot);

            const ctl = SNW.Store.get().control;
            const activeNo = ctl && ctl.profile && ctl.profile.profileNo;
            if (activeNo) this._highlightActive(activeNo);
        }

        _highlightActive(activeNo) {
            this.el.querySelectorAll('.snw-profile-item').forEach(el => {
                const no = Number(el.getAttribute('data-profile-no'));
                el.classList.toggle('is-active', no === activeNo);
            });
        }

        async _onStart(profileNo) { 
            try { await SNW.Api.selectProfile(profileNo); SNW.ToastUtil.success(SNW.I18n.t('profile.start')); } catch (e) {} 
        }
        async _onStop() { 
            try { await SNW.Api.stopProfile(); SNW.ToastUtil.success(SNW.I18n.t('profile.stop')); } catch (e) {} 
        }

        async _onDelete(id) {
            if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
            try { await SNW.Api.deleteProfile(id); await this._load(); } catch (e) {}
        }

        async _onAdd() {
            const maxNo = this._profiles.reduce((m, p) => Math.max(m, p.profileNo || 0), 0);
            const nextNo = maxNo + 10;

            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">프로필 이름
                    <input type="text" id="prof-name" value="New Profile ${nextNo}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">프로필 번호 (No)
                    <input type="number" id="prof-no" value="${nextNo}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <h3 style="margin-top:12px;font-size:14px;">세그먼트 (On/Off)</h3>
                <div class="snw-form-row"><label>On (분)</label><input type="number" id="prof-on" value="30" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>Off (분)</label><input type="number" id="prof-off" value="10" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <h3 style="margin-top:12px;font-size:14px;">AutoOff</h3>
                <div class="snw-form-row"><label>타이머 (분, 0=비활성)</label><input type="number" id="prof-ao-timer" value="0" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>PIR Hold (초)</label><input type="number" id="prof-pir-hold" value="120" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
            `;

            SNW.UI.modal('프로필 추가', inputDiv, async () => {
                const name = inputDiv.querySelector('#prof-name').value;
                const profileNo = Number(inputDiv.querySelector('#prof-no').value);
                const onMin = Number(inputDiv.querySelector('#prof-on').value);
                const offMin = Number(inputDiv.querySelector('#prof-off').value);
                const aoTimer = Number(inputDiv.querySelector('#prof-ao-timer').value);
                const pirHold = Number(inputDiv.querySelector('#prof-pir-hold').value);

                const body = { 
                    profile: { 
                        profileNo, name, enabled: true, 
                        segments: [{ segNo: 10, onMinutes: onMin, offMinutes: offMin, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {} }],
                        autoOff: { timer: { enabled: aoTimer > 0, minutes: aoTimer }, offTime: { enabled: false }, offTemp: { enabled: false } },
                        motion: { pir: { enabled: true, holdSec: pirHold } } 
                    } 
                };

                try { await SNW.Api.addProfile(body); SNW.ToastUtil.success('추가됨'); await this._load(); return true; } catch (e) { return false; }
            });
        }

        async _onEdit(id) {
            const target = this._profiles.find(p => p.profileId === id);
            if (!target) return;

            const seg = (target.segments && target.segments[0]) || {};
            const aoTimer = (target.autoOff && target.autoOff.timer && target.autoOff.timer.enabled) ? target.autoOff.timer.minutes : 0;
            const pirHold = (target.motion && target.motion.pir) ? target.motion.pir.holdSec : 120;

            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">프로필 이름
                    <input type="text" id="prof-name" value="${SNW.DomUtil.escape(target.name || '')}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">프로필 번호 (No)
                    <input type="number" id="prof-no" value="${target.profileNo}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <h3 style="margin-top:12px;font-size:14px;">세그먼트 (On/Off)</h3>
                <div class="snw-form-row"><label>On (분)</label><input type="number" id="prof-on" value="${seg.onMinutes || 30}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>Off (분)</label><input type="number" id="prof-off" value="${seg.offMinutes || 10}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <h3 style="margin-top:12px;font-size:14px;">AutoOff / PIR</h3>
                <div class="snw-form-row"><label>타이머 (분, 0=비활성)</label><input type="number" id="prof-ao-timer" value="${aoTimer}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>PIR Hold (초)</label><input type="number" id="prof-pir-hold" value="${pirHold}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
            `;

            SNW.UI.modal('프로필 편집', inputDiv, async () => {
                const name = inputDiv.querySelector('#prof-name').value;
                const profileNo = Number(inputDiv.querySelector('#prof-no').value);
                const onMin = Number(inputDiv.querySelector('#prof-on').value);
                const offMin = Number(inputDiv.querySelector('#prof-off').value);
                const aoTimer = Number(inputDiv.querySelector('#prof-ao-timer').value);
                const pirHold = Number(inputDiv.querySelector('#prof-pir-hold').value);

                const updatedData = JSON.parse(JSON.stringify(target));
                updatedData.name = name;
                updatedData.profileNo = profileNo;
                updatedData.segments = [{ segNo: 10, onMinutes: onMin, offMinutes: offMin, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {} }];
                updatedData.autoOff = { timer: { enabled: aoTimer > 0, minutes: aoTimer }, offTime: { enabled: false }, offTemp: { enabled: false } };
                updatedData.motion = { pir: { enabled: true, holdSec: pirHold } };

                try { await SNW.Api.updateProfile(id, { profile: updatedData }); SNW.ToastUtil.success('수정됨'); await this._load(); return true; } catch (e) { return false; }
            });
        }
    };
})(window.SNW);