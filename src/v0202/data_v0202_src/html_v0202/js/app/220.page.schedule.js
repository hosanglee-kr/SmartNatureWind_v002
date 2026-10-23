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
(function (SNW) {
    'use strict';
    
    SNW.Page.Schedule = class Schedule {
        constructor(container) { 
            this.el = container; 
            this._active = true; 
            this._schedules = []; 
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.schedule());
            SNW.I18n.applyTo(this.el);
            await this._load();

            SNW.DomUtil.delegate(this.el, '[data-action="add-schedule"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="del-schedule"]', 'click', (e, el) => { 
                const id = Number(el.getAttribute('data-id')); 
                if (id) this._onDelete(id); 
            });
            SNW.DomUtil.delegate(this.el, '[data-action="toggle-schedule"]', 'click', (e, el) => { 
                const id = Number(el.getAttribute('data-id')); 
                const next = el.checked; 
                if (id) this._onToggle(id, next); 
            });
            SNW.DomUtil.delegate(this.el, '[data-action="edit-schedule"]', 'click', (e, el) => { 
                const id = Number(el.getAttribute('data-id')); 
                if (id) this._onEdit(id); 
            });
        }

        unmount() { 
            this._active = false; 
        }

        async _load() {
            try { 
                const data = await SNW.Api.listSchedules(); 
                if (!this._active) return; 
                this._schedules = (data && data.schedules) || []; 
                this._renderList(); 
            } catch (e) { 
                SNW.ErrorHandler.handle(e, 'schedule.load'); 
            }
        }

        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;
            
            listSlot.innerHTML = '';
            listSlot.appendChild(SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-schedule" data-i18n="common.add">추가</button>
                </div>`);

            if (!this._schedules.length) { 
                listSlot.appendChild(SNW.DomUtil.html`<div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`); 
                SNW.I18n.applyTo(listSlot); 
                return; 
            }

            const wrap = document.createElement('div');
            wrap.className = 'snw-schedule-list';
            
            this._schedules.forEach(s => {
                const dayLabels = ['월','화','수','목','금','토','일'];
                const daysStr = (s.period && s.period.days) ? s.period.days.map((on, i) => on ? dayLabels[i] : '·').join(' ') : '-';
                const timeStr = (s.period && s.period.startTime && s.period.endTime) ? `${s.period.startTime} ~ ${s.period.endTime}` : '-';
                
                let segStr = '-';
                if (s.segments && s.segments.length) {
                    segStr = s.segments.map(sg => `[${sg.mode}] On:${sg.onMinutes}m/Off:${sg.offMinutes}m`).join(' | ');
                }
                let aoStr = 'AutoOff: 없음';
                if (s.autoOff) {
                    const ao = s.autoOff;
                    const parts = [];
                    if (ao.timer && ao.timer.enabled) parts.push(`타이머 ${ao.timer.minutes}분`);
                    if (ao.offTime && ao.offTime.enabled) parts.push(`종료 ${ao.offTime.time}`);
                    if (ao.offTemp && ao.offTemp.enabled) parts.push(`온도 ${ao.offTemp.temp}°C`);
                    if (parts.length) aoStr = `AutoOff: ${parts.join(', ')}`;
                }
                let pirStr = 'PIR: 없음';
                if (s.motion && s.motion.pir) {
                    pirStr = `PIR: ${s.motion.pir.enabled ? '켜짐' : '꺼짐'} (Hold: ${s.motion.pir.holdSec || 0}s)`;
                }

                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-schedule-item ${s.enabled ? 'is-enabled' : 'is-disabled'}" data-id="${s.schId}">
                        <div class="snw-schedule-head">
                            <label class="snw-switch">
                                <input type="checkbox" data-action="toggle-schedule" data-id="${s.schId}" ${s.enabled ? 'checked' : ''} />
                                <span class="snw-switch__slider"></span>
                            </label>
                            <span class="snw-schedule-name">${s.name || ('#' + s.schNo)}</span>
                            <button type="button" class="snw-btn-icon" data-action="edit-schedule" data-id="${s.schId}" title="편집">✏️</button>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger" data-action="del-schedule" data-id="${s.schId}" title="삭제">🗑</button>
                        </div>
                        <div class="snw-schedule-meta">
                            <span class="snw-schedule-days">${daysStr}</span>
                            <span class="snw-schedule-time">${timeStr}</span>
                        </div>
                        <div class="snw-schedule-details" style="font-size:11px;color:var(--snw-text-dim);margin-top:8px;border-top:1px solid var(--snw-border);padding-top:4px;">
                            <div>세그먼트: ${segStr}</div>
                            <div>${aoStr}</div>
                            <div>${pirStr}</div>
                        </div>
                    </div>`);
            });
            
            listSlot.appendChild(wrap);
            SNW.I18n.applyTo(listSlot);
        }

        async _onAdd() {
            const maxNo = this._schedules.reduce((m, s) => Math.max(m, s.schNo || 0), 0);
            const nextNo = maxNo + 10;

            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">스케줄 이름
                    <input type="text" id="sch-name" value="New Schedule ${nextNo}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <div style="display:flex;gap:8px;">
                    <label style="flex:1;display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">시작 시간
                        <input type="time" id="sch-start" value="08:00" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                    </label>
                    <label style="flex:1;display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">종료 시간
                        <input type="time" id="sch-end" value="20:00" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                    </label>
                </div>
                <h3 style="margin-top:12px;font-size:14px;">세그먼트 (On/Off)</h3>
                <div class="snw-form-row"><label>On (분)</label><input type="number" id="sch-on" value="20" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>Off (분)</label><input type="number" id="sch-off" value="10" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <h3 style="margin-top:12px;font-size:14px;">AutoOff</h3>
                <div class="snw-form-row"><label>타이머 (분)</label><input type="number" id="sch-ao-timer" value="0" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>PIR Hold (초)</label><input type="number" id="sch-pir-hold" value="120" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
            `;

            SNW.UI.modal('스케줄 추가', inputDiv, async () => {
                const name = inputDiv.querySelector('#sch-name').value;
                const start = inputDiv.querySelector('#sch-start').value;
                const end = inputDiv.querySelector('#sch-end').value;
                const onMin = Number(inputDiv.querySelector('#sch-on').value);
                const offMin = Number(inputDiv.querySelector('#sch-off').value);
                const aoTimer = Number(inputDiv.querySelector('#sch-ao-timer').value);
                const pirHold = Number(inputDiv.querySelector('#sch-pir-hold').value);

                const body = { 
                    schedule: { 
                        schNo: nextNo, name: name, enabled: true, 
                        period: { enabled: true, days: [1,1,1,1,1,1,1], startTime: start, endTime: end },
                        segments: [{ segNo: 10, onMinutes: onMin, offMinutes: offMin, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {} }],
                        autoOff: { timer: { enabled: aoTimer > 0, minutes: aoTimer }, offTime: { enabled: false }, offTemp: { enabled: false } },
                        motion: { pir: { enabled: true, holdSec: pirHold } } 
                    } 
                };

                try { await SNW.Api.addSchedule(body); SNW.ToastUtil.success('추가됨'); await this._load(); return true; } catch (e) { return false; }
            });
        }

        async _onEdit(schId) {
            const target = this._schedules.find(s => s.schId === schId);
            if (!target) return;

            const seg = (target.segments && target.segments[0]) || {};
            const aoTimer = (target.autoOff && target.autoOff.timer && target.autoOff.timer.enabled) ? target.autoOff.timer.minutes : 0;
            const pirHold = (target.motion && target.motion.pir) ? target.motion.pir.holdSec : 120;

            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">스케줄 이름
                    <input type="text" id="sch-name" value="${SNW.DomUtil.escape(target.name || '')}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <div style="display:flex;gap:8px;">
                    <label style="flex:1;display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">시작 시간
                        <input type="time" id="sch-start" value="${target.period?.startTime || '08:00'}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                    </label>
                    <label style="flex:1;display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">종료 시간
                        <input type="time" id="sch-end" value="${target.period?.endTime || '20:00'}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                    </label>
                </div>
                <h3 style="margin-top:12px;font-size:14px;">세그먼트 (On/Off)</h3>
                <div class="snw-form-row"><label>On (분)</label><input type="number" id="sch-on" value="${seg.onMinutes || 20}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>Off (분)</label><input type="number" id="sch-off" value="${seg.offMinutes || 10}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <h3 style="margin-top:12px;font-size:14px;">AutoOff / PIR</h3>
                <div class="snw-form-row"><label>타이머 (분, 0=비활성)</label><input type="number" id="sch-ao-timer" value="${aoTimer}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
                <div class="snw-form-row"><label>PIR Hold (초)</label><input type="number" id="sch-pir-hold" value="${pirHold}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);"></div>
            `;

            SNW.UI.modal('스케줄 편집', inputDiv, async () => {
                const name = inputDiv.querySelector('#sch-name').value;
                const start = inputDiv.querySelector('#sch-start').value;
                const end = inputDiv.querySelector('#sch-end').value;
                const onMin = Number(inputDiv.querySelector('#sch-on').value);
                const offMin = Number(inputDiv.querySelector('#sch-off').value);
                const aoTimer = Number(inputDiv.querySelector('#sch-ao-timer').value);
                const pirHold = Number(inputDiv.querySelector('#sch-pir-hold').value);

                const updatedData = JSON.parse(JSON.stringify(target));
                updatedData.name = name;
                updatedData.period.startTime = start;
                updatedData.period.endTime = end;
                updatedData.segments = [{ segNo: 10, onMinutes: onMin, offMinutes: offMin, mode: 'PRESET', presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {} }];
                updatedData.autoOff = { timer: { enabled: aoTimer > 0, minutes: aoTimer }, offTime: { enabled: false }, offTemp: { enabled: false } };
                updatedData.motion = { pir: { enabled: true, holdSec: pirHold } };

                try { await SNW.Api.updateSchedule(schId, { schedule: updatedData }); SNW.ToastUtil.success('수정됨'); await this._load(); return true; } catch (e) { return false; }
            });
        }

        async _onDelete(schId) {
            if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
            try { await SNW.Api.deleteSchedule(schId); await this._load(); } catch (e) {}
        }

        async _onToggle(schId, next) {
            const target = this._schedules.find(s => s.schId === schId); 
            if (!target) return;
            target.enabled = !!next;
            try { await SNW.Api.updateSchedule(schId, { schedule: target }); this._renderList(); } catch (e) { await this._load(); }
        }
    };
})(window.SNW);