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
(function(SNW) {
    'use strict';
    
    SNW.Page.Profiles = class Profiles {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
        }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.profiles());
            await this._load();
            SNW.DomUtil.delegate(this.el, '[data-action="add-profile"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-profile"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (id) this._onEdit(id); });
            SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (id) this._onDelete(id); });
            SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => { const no = Number(el.getAttribute('data-no')); if (no) this._onStart(no); });
        }
        unmount() { this._active = false; }
        
        async _load() {
            try {
                const data = await SNW.Api.listProfiles();
                if (!this._active) return;
                this._profiles = (data && data.userProfiles && data.userProfiles.profiles) || [];
                this._renderList();
            } catch (e) {}
        }
        
        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;
            listSlot.innerHTML = '<div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="add-profile">프로필 추가</button></div>';
            const wrap = document.createElement('div');
            wrap.className = 'snw-profile-list';
            
            this._profiles.forEach(p => {
                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-profile-item ${p.enabled ? '' : 'is-disabled'}">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${p.profileNo}</span>
                            <span class="snw-profile-name">${p.name}</span>
                            <button class="snw-btn-icon" data-action="edit-profile" data-id="${p.profileId}">✏️</button>
                            <button class="snw-btn-icon" data-action="del-profile" data-id="${p.profileId}">🗑</button>
                        </div>
                        <div class="snw-profile-actions" style="margin-top:8px;">
                            <button class="snw-btn snw-btn-primary" data-action="start-profile" data-no="${p.profileNo}" ${!p.enabled ? 'disabled' : ''}>▶ 시작</button>
                        </div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
        }
        
        _onAdd() { this._openEditor(null); }
        _onEdit(id) { this._openEditor(this._profiles.find(p => p.profileId === id)); }
        
        async _openEditor(target) {
            const isEdit = !!target;
            const p = target || { profileId: 0, profileNo: this._profiles.length > 0 ? Math.max(...this._profiles.map(x => x.profileNo)) + 10 : 10, name: 'New Profile', enabled: true, repeatSegments: false, repeatCount: 0, segments: [{ segNo: 10, onMinutes: 20, offMinutes: 0, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {}, fixedSpeed: 0 }], autoOff: { timer: { enabled: false, minutes: 0 }, offTime: { enabled: false, time: '00:00' }, offTemp: { enabled: false, temp: 0 } }, motion: { pir: { enabled: false, holdSec: 0 } } };
            
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="snw-form">
                    <div class="snw-form-row"><label>이름</label><input type="text" id="prof-name" value="${p.name}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;">번호 (No)<input type="number" id="prof-no" value="${p.profileNo}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                        <label style="flex:1;font-size:12px;">활성화 여부
                            <input type="checkbox" id="prof-enabled" ${p.enabled ? 'checked' : ''}>
                        </label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;margin-top:8px;">
                        <label style="flex:1;font-size:12px;">세그먼트 반복
                            <input type="checkbox" id="prof-repeat" ${p.repeatSegments ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;font-size:12px;">반복 횟수 (0=무한)
                            <input type="number" id="prof-repeat-count" value="${p.repeatCount}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        </label>
                    </div>
                    
                    <h3 style="margin-top:12px;font-size:14px;">세그먼트 (구간별 제어)</h3>
                    <div id="prof-segs" style="display:flex;flex-direction:column;gap:8px;"></div>
                    <button type="button" class="snw-btn" id="btn-add-prof-seg" style="margin-top:8px;">+ 세그먼트 추가</button>

                    <h3 style="margin-top:12px;font-size:14px;">AutoOff & PIR</h3>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;">타이머(분)<input type="number" id="prof-ao-timer" value="${p.autoOff.timer.minutes}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;font-size:12px;">예약 종료
                            <input type="checkbox" id="prof-ao-offtime-en" ${p.autoOff.offTime.enabled ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;">종료 시각<input type="time" id="prof-ao-offtime" value="${p.autoOff.offTime.time || '00:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;font-size:12px;">온도 종료
                            <input type="checkbox" id="prof-ao-offtemp-en" ${p.autoOff.offTemp.enabled ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;">온도(°C)<input type="number" step="0.1" id="prof-ao-offtemp" value="${p.autoOff.offTemp.temp || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;font-size:12px;">PIR 사용
                            <input type="checkbox" id="prof-pir-en" ${p.motion.pir.enabled ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;">PIR Hold(초)<input type="number" id="prof-pir-hold" value="${p.motion.pir.holdSec}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                </div>`;
            
            const segContainer = content.querySelector('#prof-segs');
            const renderSegs = (segs) => {
                segContainer.innerHTML = '';
                segs.forEach((seg, idx) => {
                    const segDiv = document.createElement('div');
                    segDiv.style.cssText = 'padding:8px;border:1px solid var(--snw-border);border-radius:4px;';
                    segDiv.innerHTML = `
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <b style="font-size:12px;">세그먼트 ${idx+1}</b>
                            <button type="button" class="snw-btn-icon" data-remove-seg="${idx}">🗑</button>
                        </div>
                        <div style="display:flex;gap:4px;margin-bottom:4px;">
                            <label style="flex:1;">On(분)<input type="number" class="seg-on" value="${seg.onMinutes}" style="width:100%;padding:4px;"></label>
                            <label style="flex:1;">Off(분)<input type="number" class="seg-off" value="${seg.offMinutes}" style="width:100%;padding:4px;"></label>
                        </div>
                        <div style="display:flex;gap:4px;margin-bottom:4px;">
                            <label style="flex:1;">모드
                                <select class="seg-mode" style="width:100%;padding:4px;">
                                    <option value="PRESET" ${seg.mode === 'PRESET' ? 'selected' : ''}>프리셋</option>
                                    <option value="FIXED" ${seg.mode === 'FIXED' ? 'selected' : ''}>고정풍속</option>
                                </select>
                            </label>
                        </div>
                        <div class="seg-preset-area" style="display:${seg.mode === 'PRESET' ? 'block' : 'none'};">
                            <div style="display:flex;gap:4px;">
                                <label style="flex:1;">프리셋<input type="text" class="seg-preset" value="${seg.presetCode}" style="width:100%;padding:4px;"></label>
                                <label style="flex:1;">스타일<input type="text" class="seg-style" value="${seg.styleCode}" style="width:100%;padding:4px;"></label>
                            </div>
                        </div>
                        <div class="seg-fixed-area" style="display:${seg.mode === 'FIXED' ? 'block' : 'none'};">
                            <label>고정 풍속(%)<input type="number" class="seg-fixed" value="${seg.fixedSpeed}" style="width:100%;padding:4px;"></label>
                        </div>
                    `;
                    segDiv.querySelector('.seg-mode').addEventListener('change', (e) => {
                        segDiv.querySelector('.seg-preset-area').style.display = e.target.value === 'PRESET' ? 'block' : 'none';
                        segDiv.querySelector('.seg-fixed-area').style.display = e.target.value === 'FIXED' ? 'block' : 'none';
                    });
                    segDiv.querySelector('[data-remove-seg]').addEventListener('click', () => {
                        segs.splice(idx, 1);
                        renderSegs(segs);
                    });
                    segContainer.appendChild(segDiv);
                });
            };
            const currentSegs = JSON.parse(JSON.stringify(p.segments || []));
            renderSegs(currentSegs);
            
            content.querySelector('#btn-add-prof-seg').addEventListener('click', () => {
                currentSegs.push({ segNo: currentSegs.length * 10 + 10, onMinutes: 20, offMinutes: 0, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {}, fixedSpeed: 0 });
                renderSegs(currentSegs);
            });
            
            SNW.UI.modal(isEdit ? '프로필 편집' : '프로필 추가', content, async () => {
                const newSegs = [];
                segContainer.querySelectorAll('.seg-mode').forEach((modeEl, idx) => {
                    const on = Number(segContainer.querySelectorAll('.seg-on')[idx].value);
                    const off = Number(segContainer.querySelectorAll('.seg-off')[idx].value);
                    const mode = modeEl.value;
                    const seg = { segNo: idx * 10 + 10, onMinutes: on, offMinutes: off, mode };
                    if (mode === 'PRESET') {
                        seg.presetCode = segContainer.querySelectorAll('.seg-preset')[idx].value;
                        seg.styleCode = segContainer.querySelectorAll('.seg-style')[idx].value;
                    } else {
                        seg.fixedSpeed = Number(segContainer.querySelectorAll('.seg-fixed')[idx].value);
                    }
                    newSegs.push(seg);
                });
                
                const body = {
                    profile: {
                        profileNo: Number(content.querySelector('#prof-no').value),
                        name: content.querySelector('#prof-name').value,
                        enabled: content.querySelector('#prof-enabled').checked,
                        repeatSegments: content.querySelector('#prof-repeat').checked,
                        repeatCount: Number(content.querySelector('#prof-repeat-count').value),
                        segments: newSegs,
                        autoOff: {
                            timer: { enabled: Number(content.querySelector('#prof-ao-timer').value) > 0, minutes: Number(content.querySelector('#prof-ao-timer').value) },
                            offTime: { enabled: content.querySelector('#prof-ao-offtime-en').checked, time: content.querySelector('#prof-ao-offtime').value },
                            offTemp: { enabled: content.querySelector('#prof-ao-offtemp-en').checked, temp: Number(content.querySelector('#prof-ao-offtemp').value) }
                        },
                        motion: { pir: { enabled: content.querySelector('#prof-pir-en').checked, holdSec: Number(content.querySelector('#prof-pir-hold').value) } }
                    }
                };
                
                try {
                    if (isEdit) await SNW.Api.updateProfile(p.profileId, body);
                    else await SNW.Api.addProfile(body);
                    await SNW.Api.saveConfig();
                    SNW.ToastUtil.success('저장되었습니다.');
                    await this._load();
                    return true;
                } catch (e) { SNW.ErrorHandler.handle(e, 'profile.save'); return false; }
            });
        }
        
        async _onDelete(id) {
            if (!confirm('삭제하시겠습니까?')) return;
            try {
                await SNW.Api.deleteProfile(id);
                await SNW.Api.saveConfig();
                await this._load();
            } catch (e) {}
        }
        async _onStart(profileNo) {
            try {
                await SNW.Api.selectProfile(profileNo);
                SNW.ToastUtil.success('프로필 모드 시작됨');
            } catch (e) {}
        }
    };
})(window.SNW);