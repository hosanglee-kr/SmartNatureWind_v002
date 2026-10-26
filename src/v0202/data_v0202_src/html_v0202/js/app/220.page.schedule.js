/*
 * ------------------------------------------------------
 * 소스명   : 220.page.schedule.js
 * 모듈     : SNW.Page.Schedule
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 8 스케줄 목록 조회 / 활성 토글 / 삭제
 *  - 신규 추가 (기본값) → POST /schedules
 *  - 세그먼트 편집은 v0202 MVP 범위 외 (Phase 5-b 확장)
 * 제약     : schId/segId 서버 발급 (요청 무시)
 *            schNo/segNo 사용자 지정 가능
 * ------------------------------------------------------
 */
/* ---- 220.page.schedule.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';
    
    SNW.Page.Schedule = class Schedule {
        constructor(container) { this.el = container;
            this._active = true;
            this._schedules = []; }
        
        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.schedule());
            await this._load();
            SNW.DomUtil.delegate(this.el, '[data-action="add-schedule"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="edit-schedule"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (id) this._onEdit(id); });
            SNW.DomUtil.delegate(this.el, '[data-action="del-schedule"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (id) this._onDelete(id); });
            SNW.DomUtil.delegate(this.el, '[data-action="toggle-schedule"]', 'click', (e, el) => { const id = Number(el.getAttribute('data-id')); if (id) this._onToggle(id, el.checked); });
        }
        unmount() { this._active = false; }
        
        async _load() {
            try { const data = await SNW.Api.listSchedules(); if (!this._active) return;
                this._schedules = (data && data.schedules) || [];
                this._renderList(); } catch (e) {}
        }
        
        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;
            const tAdd = SNW.I18n ? SNW.I18n.t('schedule.add') : '스케줄 추가';
            const tSegment = SNW.I18n ? SNW.I18n.t('scheduler.segment') : '세그먼트';
            const dayLabels = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'].map(k => SNW.I18n ? SNW.I18n.t(k) : k);

            listSlot.innerHTML = `<div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="add-schedule">${tAdd}</button></div>`;
            const wrap = document.createElement('div');
            wrap.className = 'snw-schedule-list';
            
            this._schedules.forEach(s => {
                const daysStr = s.period.days.map((on, i) => on ? dayLabels[i] : '·').join('');
                const segStr = (s.segments || []).map(sg => `[${sg.mode}] ${sg.onMinutes}m/${sg.offMinutes}m`).join(' | ');
                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-schedule-item ${s.enabled ? 'is-enabled' : 'is-disabled'}">
                        <div class="snw-schedule-head">
                            <label class="snw-switch"><input type="checkbox" data-action="toggle-schedule" data-id="${s.schId}" ${s.enabled ? 'checked' : ''}><span class="snw-switch__slider"></span></label>
                            <span class="snw-schedule-name">${s.name} (#${s.schNo})</span>
                            <button class="snw-btn-icon" data-action="edit-schedule" data-id="${s.schId}">✏️</button>
                            <button class="snw-btn-icon" data-action="del-schedule" data-id="${s.schId}">🗑</button>
                        </div>
                        <div class="snw-schedule-meta">${daysStr} ${s.period.startTime}~${s.period.endTime} (Repeat: ${s.repeatSegments ? s.repeatCount : 'Off'})</div>
                        <div class="snw-schedule-details" style="font-size:11px;color:var(--snw-text-dim);margin-top:4px;">${tSegment}: ${segStr}</div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
        }
        
        _onAdd() { this._openEditor(null); }
        _onEdit(id) { this._openEditor(this._schedules.find(s => s.schId === id)); }
        
        async _openEditor(target) {
            const isEdit = !!target;
            const s = target || { schId: 0, schNo: (this._schedules.reduce((m, s) => Math.max(m, s.schNo || 0), 0) + 10), name: 'New Schedule', enabled: true, repeatSegments: true, repeatCount: 1, period: { enabled: true, days: [1, 1, 1, 1, 1, 1, 1], startTime: '08:00', endTime: '20:00' }, segments: [{ segNo: 10, onMinutes: 20, offMinutes: 10, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {}, fixedSpeed: 0 }], autoOff: { timer: { enabled: false, minutes: 0 }, offTime: { enabled: false, time: '00:00' }, offTemp: { enabled: false, temp: 0 } }, motion: { pir: { enabled: false, holdSec: 0 } } };
            
            const content = document.createElement('div');
            const tName = SNW.I18n ? SNW.I18n.t('schedule.name') : '이름';
            const tStart = SNW.I18n ? SNW.I18n.t('schedule.startTime') : '시작';
            const tEnd = SNW.I18n ? SNW.I18n.t('schedule.endTime') : '종료';
            const tDay = SNW.I18n ? SNW.I18n.t('scheduler.day') : '요일';
            const dayLabels = ['days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat', 'days.sun'].map(k => SNW.I18n ? SNW.I18n.t(k) : k);

            let daysHtml = `<div class="snw-form-row"><label>${tDay}</label><div id="sch-days" style="display:flex;gap:4px;">`;
            dayLabels.forEach((d, i) => {
                daysHtml += `<label style="font-size:12px;"><input type="checkbox" data-day="${i}" ${s.period.days[i] ? 'checked' : ''}> ${d}</label>`;
            });
            daysHtml += `</div></div>`;

            content.innerHTML = `
                <div class="snw-form">
                    <div class="snw-form-row"><label>${tName}</label><input type="text" id="sch-name" value="${s.name}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;">${tStart}<input type="time" id="sch-start" value="${s.period.startTime}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                        <label style="flex:1;">${tEnd}<input type="time" id="sch-end" value="${s.period.endTime}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    ${daysHtml}
                    <div class="snw-form-row" style="display:flex;gap:8px;margin-top:8px;">
                        <label style="flex:1;font-size:12px;">${SNW.I18n ? SNW.I18n.t('schedule.segmentRepeat') : '세그먼트 반복'}
                            <input type="checkbox" id="sch-repeat" ${s.repeatSegments ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;font-size:12px;">${SNW.I18n ? SNW.I18n.t('schedule.repeatCount') : '반복 횟수 (0=무한)'}
                            <input type="number" id="sch-repeat-count" value="${s.repeatCount}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                        </label>
                    </div>
                    
                    <h3 style="margin-top:12px;font-size:14px;">${SNW.I18n ? SNW.I18n.t('schedule.segmentsTitle') : '세그먼트 (구간별 제어)'}</h3>
                    <div id="sch-segs" style="display:flex;flex-direction:column;gap:8px;"></div>
                    <button type="button" class="snw-btn" id="btn-add-seg" style="margin-top:8px;">${SNW.I18n ? SNW.I18n.t('schedule.addSegmentBtn') : '+ 세그먼트 추가'}</button>
                    
                    <h3 style="margin-top:12px;font-size:14px;">AutoOff & PIR</h3>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;">${SNW.I18n ? SNW.I18n.t('profiles.autoOffTimer') : '타이머(분)'}<input type="number" id="sch-ao-timer" value="${s.autoOff.timer.minutes}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;font-size:12px;">${SNW.I18n ? SNW.I18n.t('scheduler.scheduledOff') : '예약 종료'}
                            <input type="checkbox" id="sch-ao-offtime-en" ${s.autoOff.offTime.enabled ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;">${tEnd}<input type="time" id="sch-ao-offtime" value="${s.autoOff.offTime.time || '00:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;font-size:12px;">${SNW.I18n ? SNW.I18n.t('scheduler.tempOff') : '온도 종료'}
                            <input type="checkbox" id="sch-ao-offtemp-en" ${s.autoOff.offTemp.enabled ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;">${SNW.I18n ? SNW.I18n.t('dashboard.temp') : '온도'}(°C)<input type="number" step="0.1" id="sch-ao-offtemp" value="${s.autoOff.offTemp.temp || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                    <div class="snw-form-row" style="display:flex;gap:8px;">
                        <label style="flex:1;font-size:12px;">${SNW.I18n ? SNW.I18n.t('sensors.pirEnabled') : 'PIR 사용'}
                            <input type="checkbox" id="sch-pir-en" ${s.motion.pir.enabled ? 'checked' : ''}>
                        </label>
                        <label style="flex:1;">${SNW.I18n ? SNW.I18n.t('sensors.pirHoldSec') : 'PIR Hold(초)'}<input type="number" id="sch-pir-hold" value="${s.motion.pir.holdSec}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></label>
                    </div>
                </div>`;
            
            const segContainer = content.querySelector('#sch-segs');
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
                    segDiv.querySelector('[data-remove-seg]').addEventListener('click', () => { segs.splice(idx, 1);
                        renderSegs(segs); });
                    segContainer.appendChild(segDiv);
                });
            };
            const currentSegs = JSON.parse(JSON.stringify(s.segments));
            renderSegs(currentSegs);
            
            content.querySelector('#btn-add-seg').addEventListener('click', () => {
                currentSegs.push({ segNo: currentSegs.length * 10 + 10, onMinutes: 20, offMinutes: 10, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {}, fixedSpeed: 0 });
                renderSegs(currentSegs);
            });
            
            SNW.UI.modal(isEdit ? (SNW.I18n ? SNW.I18n.t('common.edit') : '스케줄 편집') : (SNW.I18n ? SNW.I18n.t('schedule.add') : '스케줄 추가'), content, async () => {
                const days = Array.from(content.querySelectorAll('[data-day]')).map(cb => cb.checked ? 1 : 0);
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
                    schedule: {
                        schNo: s.schNo,
                        name: content.querySelector('#sch-name').value,
                        enabled: s.enabled,
                        repeatSegments: content.querySelector('#sch-repeat').checked,
                        repeatCount: Number(content.querySelector('#sch-repeat-count').value),
                        period: { enabled: true, days, startTime: content.querySelector('#sch-start').value, endTime: content.querySelector('#sch-end').value },
                        segments: newSegs,
                        autoOff: {
                            timer: { enabled: Number(content.querySelector('#sch-ao-timer').value) > 0, minutes: Number(content.querySelector('#sch-ao-timer').value) },
                            offTime: { enabled: content.querySelector('#sch-ao-offtime-en').checked, time: content.querySelector('#sch-ao-offtime').value },
                            offTemp: { enabled: content.querySelector('#sch-ao-offtemp-en').checked, temp: Number(content.querySelector('#sch-ao-offtemp').value) }
                        },
                        motion: { pir: { enabled: content.querySelector('#sch-pir-en').checked, holdSec: Number(content.querySelector('#sch-pir-hold').value) } }
                    }
                };
                
                try {
                    if (isEdit) await SNW.Api.updateSchedule(s.schId, body);
                    else await SNW.Api.addSchedule(body);
                    await SNW.Api.saveConfig();
                    SNW.ToastUtil.success(SNW.I18n ? SNW.I18n.t('msg.saveSuccess') : '저장되었습니다.');
                    await this._load();
                    return true;
                } catch (e) { SNW.ErrorHandler.handle(e, 'schedule.save'); return false; }
            });
        }
        
        async _onDelete(id) {
            if (!confirm(SNW.I18n ? SNW.I18n.t('msg.deleteConfirm') : '삭제하시겠습니까?')) return;
            try { await SNW.Api.deleteSchedule(id);
                await SNW.Api.saveConfig();
                await this._load(); } catch (e) {}
        }
        async _onToggle(id, next) {
            const target = this._schedules.find(s => s.schId === id);
            if (!target) return;
            target.enabled = !!next;
            try { await SNW.Api.updateSchedule(id, { schedule: target });
                this._renderList(); } catch (e) {}
        }
    };
})(window.SNW);