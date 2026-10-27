// =========================================================
// 230.page.profiles.js — SNW.Page.Profiles
// Layer 4 (페이지 로직)
// [O-16] 활성 프로필 표시 + start/stop 토글
// [FIX] HTML 태그 텍스트 노출 버그 수정 (innerHTML + escape 조합)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Profiles = class Profiles {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._unsubs = [];
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.profiles());
            SNW.I18n.applyTo(this.el);
            await this._load();

            // [O-16] control 구독 → 활성 상태 실시간 갱신
            const unsub = SNW.Store.watch('control', () => {
                if (this._active) this._renderList();
            });
            this._unsubs.push(unsub);

            SNW.DomUtil.delegate(this.el, '[data-action="add-profile"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-profile"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onEdit(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onDelete(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => {
                const no = Number(el.getAttribute('data-no'));
                if (no) this._onStart(no);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="stop-profile"]', 'click', () => this._onStop());
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
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.load');
            }
        }

        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;

            const activeNo = SNW.Store.get().control?.profile?.profileNo;

            listSlot.innerHTML = `
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-profile">
                        ${SNW.I18n.t('profiles.add')}
                    </button>
                </div>
            `;

            const wrap = document.createElement('div');
            wrap.className = 'snw-profile-list';

            if (this._profiles.length === 0) {
                wrap.innerHTML = `<div class="snw-empty">${SNW.I18n.t('common.noData')}</div>`;
            }

            this._profiles.forEach(p => {
                const isActive   = (p.profileNo === activeNo);
                const isDisabled = !p.enabled;
                const safeName   = SNW.DomUtil.escape(p.name);

                // [FIX] DomUtil.html 대신 innerHTML 사용 (태그 렌더링 보장 + 이름만 escape)
                const item = document.createElement('div');
                item.className = `snw-profile-item ${isDisabled ? 'is-disabled' : ''} ${isActive ? 'is-active' : ''}`;
                
                item.innerHTML = `
                    <div class="snw-profile-head">
                        <span class="snw-profile-no">#${p.profileNo}</span>
                        <span class="snw-profile-name">${safeName}</span>
                        ${isActive ? `<span class="snw-badge snw-badge--green">${SNW.I18n.t('profile.active')}</span>` : ''}
                        <button class="snw-btn-icon" data-action="edit-profile" data-id="${p.profileId}">✏️</button>
                        <button class="snw-btn-icon" data-action="del-profile" data-id="${p.profileId}">🗑</button>
                    </div>
                    <div class="snw-profile-actions" style="margin-top:8px;">
                        ${isActive
                            ? `<button class="snw-btn" data-action="stop-profile">
                                   ⏹ ${SNW.I18n.t('common.stop')}
                               </button>`
                            : `<button class="snw-btn snw-btn-primary"
                                       data-action="start-profile"
                                       data-no="${p.profileNo}"
                                       ${isDisabled ? 'disabled' : ''}>
                                   ▶ ${SNW.I18n.t('common.start')}
                               </button>`
                        }
                    </div>
                `;
                wrap.appendChild(item);
            });

            listSlot.appendChild(wrap);
        }

        _onAdd() { this._openEditor(null); }
        _onEdit(id) { this._openEditor(this._profiles.find(p => p.profileId === id)); }

        async _openEditor(target) {
            const isEdit = !!target;
            const maxNo = this._profiles.reduce((m, x) => Math.max(m, x.profileNo || 0), 0);
            const p = target || {
                profileId: 0, profileNo: maxNo + 10, name: 'New Profile', enabled: true,
                repeatSegments: false, repeatCount: 0,
                segments: [{
                    segNo: 10, onMinutes: 20, offMinutes: 0, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {}, fixedSpeed: 0
                }],
                autoOff: {
                    timer:   { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 }
                },
                motion: { pir: { enabled: false, holdSec: 0 } }
            };

            const content = document.createElement('div');

            content.innerHTML = `
                <div class="snw-form">
                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secBasic')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row">
                                <label>${SNW.I18n.t('profiles.name')}</label>
                                <input type="text" id="prof-name" value="${SNW.DomUtil.escape(p.name)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;">${SNW.I18n.t('profiles.no')}
                                    <input type="number" id="prof-no" value="${p.profileNo}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('profiles.enabled')}
                                    <input type="checkbox" id="prof-enabled" ${p.enabled ? 'checked' : ''}>
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;margin-top:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.segmentRepeat')}
                                    <input type="checkbox" id="prof-repeat" ${p.repeatSegments ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.repeatCount')}
                                    <input type="number" id="prof-repeat-count" min="0" value="${p.repeatCount}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>
            
                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secSegments')}</summary>
                        <div class="snw-accordion__content">
                            <div id="prof-segs" style="display:flex;flex-direction:column;"></div>
                            <button type="button" class="snw-btn snw-btn-primary" id="btn-add-prof-seg" style="margin-top:12px; width:100%;">
                                + ${SNW.I18n.t('profiles.addSegmentBtn')}
                            </button>
                        </div>
                    </details>
            
                    <details class="snw-accordion">
                        <summary>${SNW.I18n.t('schedule.secSmart')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row" style="display:flex;gap:8px; margin-top:8px;">
                                <label style="flex:1;">${SNW.I18n.t('profiles.autoOffTimer')}
                                    <input type="number" id="prof-ao-timer" min="0" value="${p.autoOff?.timer?.minutes || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.scheduledOff')}
                                    <input type="checkbox" id="prof-ao-offtime-en" ${p.autoOff?.offTime?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('schedule.endTime')}
                                    <input type="time" id="prof-ao-offtime" value="${p.autoOff?.offTime?.time || '00:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.tempOff')}
                                    <input type="checkbox" id="prof-ao-offtemp-en" ${p.autoOff?.offTemp?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('dashboard.temp')}(°C)
                                    <input type="number" step="0.1" id="prof-ao-offtemp" value="${p.autoOff?.offTemp?.temp || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('sensors.pirEnabled')}
                                    <input type="checkbox" id="prof-pir-en" ${p.motion?.pir?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('sensors.pirHoldSec')}
                                    <input type="number" id="prof-pir-hold" min="0" value="${p.motion?.pir?.holdSec || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>
                </div>`;
    
            const segContainer = content.querySelector('#prof-segs');
            const currentSegs = JSON.parse(JSON.stringify(p.segments || []));

            // =========================================================
            // 세그먼트 삭제 Undo 지원
            // =========================================================
            const _removeWithUndo = (idx) => {
                if (currentSegs.length <= 1) {
                    SNW.ToastUtil.warn(SNW.I18n.t('validate.segmentMin'));
                    return;
                }
                const removed = currentSegs.splice(idx, 1)[0];
                renderSegs(currentSegs);

                const host = document.getElementById('toast-host');
                if (host) {
                    const t = document.createElement('div');
                    t.className = 'snw-toast snw-toast--warn';
                    t.style.cssText = 'display:flex;align-items:center;gap:12px;';
                    t.innerHTML = `
                        <span style="flex:1;">${SNW.I18n.t('segment.deleted')}</span>
                        <button type="button" style="background:none;border:none;color:var(--snw-primary);cursor:pointer;font-weight:600;text-decoration:underline;padding:0;font-size:13px;">
                            ${SNW.I18n.t('common.undo')}
                        </button>`;
                    t.querySelector('button').onclick = () => {
                        currentSegs.splice(idx, 0, removed);
                        renderSegs(currentSegs);
                        t.remove();
                    };
                    host.appendChild(t);
                    setTimeout(() => {
                        t.classList.add('snw-toast--out');
                        setTimeout(() => t.remove(), 300);
                    }, 5000);
                }
            };

            const renderSegs = (segs) => {
                segContainer.innerHTML = '';
                segs.forEach((seg, idx) => {
                    const segDiv = document.createElement('div');
                    segDiv.className = 'snw-seg-card';
                    segDiv.innerHTML = `
                        <div class="snw-seg-header">
                            <span class="snw-seg-title">${SNW.I18n.t('scheduler.segment')} ${idx + 1}</span>
                            <button type="button" class="snw-btn-icon" data-remove-seg="${idx}" style="color:var(--snw-error);">🗑</button>
                        </div>
                        <div class="snw-seg-grid">
                            <label>On(분)
                                <input type="number" class="seg-on" min="0" max="1440" value="${seg.onMinutes}">
                            </label>
                            <label>Off(분)
                                <input type="number" class="seg-off" min="0" max="1440" value="${seg.offMinutes}">
                            </label>
                            <label style="grid-column: span 2;">모드
                                <select class="seg-mode">
                                    <option value="PRESET" ${seg.mode === 'PRESET' ? 'selected' : ''}>프리셋</option>
                                    <option value="FIXED"  ${seg.mode === 'FIXED'  ? 'selected' : ''}>고정풍속</option>
                                </select>
                            </label>
                            <div class="snw-seg-preset-area" style="display: ${seg.mode === 'PRESET' ? 'grid' : 'none'};">
                                <label>프리셋
                                    <input type="text" class="seg-preset" value="${SNW.DomUtil.escape(seg.presetCode || '')}">
                                </label>
                                <label>스타일
                                    <input type="text" class="seg-style" value="${SNW.DomUtil.escape(seg.styleCode || '')}">
                                </label>
                            </div>
                            <div class="snw-seg-fixed-area" style="display: ${seg.mode === 'FIXED' ? 'block' : 'none'};">
                                <label>고정 풍속(%)
                                    <input type="number" class="seg-fixed" min="0" max="100" value="${seg.fixedSpeed || 0}">
                                </label>
                            </div>
                        </div>`;

                    const modeSel = segDiv.querySelector('.seg-mode');
                    const presetArea = segDiv.querySelector('.snw-seg-preset-area');
                    const fixedArea = segDiv.querySelector('.snw-seg-fixed-area');

                    modeSel.addEventListener('change', (e) => {
                        const isPreset = e.target.value === 'PRESET';
                        presetArea.style.display = isPreset ? 'grid' : 'none';
                        fixedArea.style.display  = isPreset ? 'none' : 'block';
                    });

                    segDiv.querySelector('[data-remove-seg]').addEventListener('click', () => _removeWithUndo(idx));
                    segContainer.appendChild(segDiv);
                });
            };
            renderSegs(currentSegs);

            content.querySelector('#btn-add-prof-seg').addEventListener('click', () => {
                currentSegs.push({
                    segNo: currentSegs.length * 10 + 10,
                    onMinutes: 20, offMinutes: 0, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    adjust: {}, fixedSpeed: 0
                });
                renderSegs(currentSegs);
            });

            SNW.UI.modal(
                isEdit ? SNW.I18n.t('common.edit') : SNW.I18n.t('profiles.add'),
                content,
                async () => {
                    const nameEl = content.querySelector('#prof-name');
                    nameEl.classList.remove('is-error');
                    if (!nameEl.value.trim()) {
                        nameEl.classList.add('is-error');
                        SNW.ToastUtil.error(SNW.I18n.t('validate.required', { field: SNW.I18n.t('profiles.name') }));
                        return false;
                    }

                    const newSegs = [];
                    segContainer.querySelectorAll('.seg-mode').forEach((modeEl, idx) => {
                        const on   = Number(segContainer.querySelectorAll('.seg-on')[idx].value);
                        const off  = Number(segContainer.querySelectorAll('.seg-off')[idx].value);
                        const mode = modeEl.value;
                        const seg = { segNo: idx * 10 + 10, onMinutes: on, offMinutes: off, mode };
                        if (mode === 'PRESET') {
                            seg.presetCode = segContainer.querySelectorAll('.seg-preset')[idx].value;
                            seg.styleCode  = segContainer.querySelectorAll('.seg-style')[idx].value;
                        } else {
                            seg.fixedSpeed = Number(segContainer.querySelectorAll('.seg-fixed')[idx].value);
                        }
                        newSegs.push(seg);
                    });

                    const body = {
                        profile: {
                            profileNo: Number(content.querySelector('#prof-no').value),
                            name: nameEl.value,
                            enabled: content.querySelector('#prof-enabled').checked,
                            repeatSegments: content.querySelector('#prof-repeat').checked,
                            repeatCount: Number(content.querySelector('#prof-repeat-count').value),
                            segments: newSegs,
                            autoOff: {
                                timer: {
                                    enabled: Number(content.querySelector('#prof-ao-timer').value) > 0,
                                    minutes: Number(content.querySelector('#prof-ao-timer').value)
                                },
                                offTime: {
                                    enabled: content.querySelector('#prof-ao-offtime-en').checked,
                                    time: content.querySelector('#prof-ao-offtime').value
                                },
                                offTemp: {
                                    enabled: content.querySelector('#prof-ao-offtemp-en').checked,
                                    temp: Number(content.querySelector('#prof-ao-offtemp').value)
                                }
                            },
                            motion: {
                                pir: {
                                    enabled: content.querySelector('#prof-pir-en').checked,
                                    holdSec: Number(content.querySelector('#prof-pir-hold').value)
                                }
                            }
                        }
                    };

                    try {
                        if (isEdit) await SNW.Api.updateProfile(p.profileId, body);
                        else        await SNW.Api.addProfile(body);
                        await SNW.Api.saveConfig();
                        SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                        await this._load();
                        return true;
                    } catch (e) {
                        SNW.ErrorHandler.handle(e, 'profile.save');
                        return false;
                    }
                },
                null,
                { width: '520px' }
            );
        }

        async _onDelete(id) {
            if (!confirm(SNW.I18n.t('msg.deleteConfirm'))) return;
            try {
                await SNW.Api.deleteProfile(id);
                await SNW.Api.saveConfig();
                await this._load();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.delete');
            }
        }

        async _onStart(profileNo) {
            try {
                await SNW.Api.selectProfile(profileNo);
                SNW.ToastUtil.success(SNW.I18n.t('dashboard.modeSwitchedProfile'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.start');
            }
        }

        async _onStop() {
            try {
                await SNW.Api.stopProfile();
                SNW.ToastUtil.success(SNW.I18n.t('msg.success'));
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'profile.stop');
            }
        }
    };
})(window.SNW);