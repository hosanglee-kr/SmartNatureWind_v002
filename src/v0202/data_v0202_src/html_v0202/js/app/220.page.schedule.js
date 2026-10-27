// =========================================================
// 220.page.schedule.js — SNW.Page.Schedule
// Layer 4 (페이지 로직)
// [O-7] 클라이언트 검증 (필드별 에러 표시 + 첫 오류로 스크롤)
// [O-8] 세그먼트 삭제 Undo 토스트
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
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
            SNW.DomUtil.delegate(this.el, '[data-action="edit-schedule"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onEdit(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="del-schedule"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onDelete(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="toggle-schedule"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (id) this._onToggle(id, el.checked);
            });
        }

        unmount() { this._active = false; }

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
            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const tAdd = t('schedule.add', '스케줄 추가');
            const tSegment = t('scheduler.segment', '세그먼트');
            const dayKeys = ['days.mon','days.tue','days.wed','days.thu','days.fri','days.sat','days.sun'];
            const dayLabels = dayKeys.map(k => t(k, k));

            listSlot.innerHTML = `
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-schedule">${tAdd}</button>
                </div>
            `;
            const wrap = document.createElement('div');
            wrap.className = 'snw-schedule-list';

            this._schedules.forEach(s => {
                const days = s.period?.days || [0,0,0,0,0,0,0];
                const daysStr = days.map((on, i) => on ? dayLabels[i] : '·').join('');
                const segStr = (s.segments || [])
                    .map(sg => `[${sg.mode}] ${sg.onMinutes}m/${sg.offMinutes}m`)
                    .join(' | ');
                const timeRange = `${s.period?.startTime || '--:--'}~${s.period?.endTime || '--:--'}`;
                const repeatLabel = s.repeatSegments ? `${s.repeatCount}회` : 'Off';

                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-schedule-item ${s.enabled ? 'is-enabled' : 'is-disabled'}">
                        <div class="snw-schedule-head">
                            <label class="snw-switch">
                                <input type="checkbox" data-action="toggle-schedule" data-id="${s.schId}" ${s.enabled ? 'checked' : ''}>
                                <span class="snw-switch__slider"></span>
                            </label>
                            <span class="snw-schedule-name">${SNW.DomUtil.escape(s.name)} (#${s.schNo})</span>
                            <button class="snw-btn-icon" data-action="edit-schedule" data-id="${s.schId}">✏️</button>
                            <button class="snw-btn-icon" data-action="del-schedule" data-id="${s.schId}">🗑</button>
                        </div>
                        <div class="snw-schedule-meta">${daysStr} ${timeRange} (Repeat: ${repeatLabel})</div>
                        <div class="snw-schedule-details" style="font-size:11px;color:var(--snw-text-dim);margin-top:4px;">
                            ${tSegment}: ${segStr}
                        </div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
        }

        _onAdd() { this._openEditor(null); }
        _onEdit(id) { this._openEditor(this._schedules.find(s => s.schId === id)); }

        async _openEditor(target) {
            const isEdit = !!target;
            const maxSchNo = this._schedules.reduce((m, s) => Math.max(m, s.schNo || 0), 0);
            const s = target || {
                schId: 0, schNo: maxSchNo + 10, name: 'New Schedule', enabled: true,
                repeatSegments: true, repeatCount: 1,
                period: { enabled: true, days: [1,1,1,1,1,1,1], startTime: '08:00', endTime: '20:00' },
                segments: [{
                    segNo: 10, onMinutes: 20, offMinutes: 10, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE', adjust: {}, fixedSpeed: 0
                }],
                autoOff: {
                    timer:   { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 }
                },
                motion: { pir: { enabled: false, holdSec: 0 } }
            };

            const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const dayKeys = ['days.mon','days.tue','days.wed','days.thu','days.fri','days.sat','days.sun'];

            const content = document.createElement('div');
            let daysHtml = `<div class="snw-form-row"><label>${t('scheduler.day', '요일')}</label><div style="display:flex;gap:4px;">`;
            dayKeys.forEach((k, i) => {
                daysHtml += `<label style="font-size:12px;">
                    <input type="checkbox" data-day="${i}" ${(s.period?.days||[])[i] ? 'checked' : ''}>
                    ${t(k, k)}
                </label>`;
            });
            daysHtml += `</div></div>`;
            
            content.innerHTML = `
                <div class="snw-form">
                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secBasic')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row">
                                <label>${SNW.I18n.t('schedule.name')}</label>
                                <input type="text" id="sch-name" value="${SNW.DomUtil.escape(s.name)}" style="padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;">${SNW.I18n.t('schedule.startTime')}
                                    <input type="time" id="sch-start" value="${s.period?.startTime || '08:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('schedule.endTime')}
                                    <input type="time" id="sch-end" value="${s.period?.endTime || '20:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            ${daysHtml}
                            <div class="snw-form-row" style="display:flex;gap:8px;margin-top:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.segmentRepeat')}
                                    <input type="checkbox" id="sch-repeat" ${s.repeatSegments ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('schedule.repeatCount')}
                                    <input type="number" id="sch-repeat-count" min="0" value="${s.repeatCount}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>

                    <details class="snw-accordion" open>
                        <summary>${SNW.I18n.t('schedule.secSegments')}</summary>
                        <div class="snw-accordion__content">
                            <div id="sch-segs" style="display:flex;flex-direction:column;gap:8px;"></div>
                            <button type="button" class="snw-btn" id="btn-add-seg" style="margin-top:8px;">
                                ${SNW.I18n.t('schedule.addSegmentBtn')}
                            </button>
                        </div>
                    </details>

                    <details class="snw-accordion">
                        <summary>${SNW.I18n.t('schedule.secSmart')}</summary>
                        <div class="snw-accordion__content">
                            <div class="snw-form-row" style="display:flex;gap:8px; margin-top:8px;">
                                <label style="flex:1;">${SNW.I18n.t('profiles.autoOffTimer')}
                                    <input type="number" id="sch-ao-timer" min="0" value="${s.autoOff?.timer?.minutes || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.scheduledOff')}
                                    <input type="checkbox" id="sch-ao-offtime-en" ${s.autoOff?.offTime?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('schedule.endTime')}
                                    <input type="time" id="sch-ao-offtime" value="${s.autoOff?.offTime?.time || '00:00'}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('scheduler.tempOff')}
                                    <input type="checkbox" id="sch-ao-offtemp-en" ${s.autoOff?.offTemp?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('dashboard.temp')}(°C)
                                    <input type="number" step="0.1" id="sch-ao-offtemp" value="${s.autoOff?.offTemp?.temp || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                            <div class="snw-form-row" style="display:flex;gap:8px;">
                                <label style="flex:1;font-size:12px;">${SNW.I18n.t('sensors.pirEnabled')}
                                    <input type="checkbox" id="sch-pir-en" ${s.motion?.pir?.enabled ? 'checked' : ''}>
                                </label>
                                <label style="flex:1;">${SNW.I18n.t('sensors.pirHoldSec')}
                                    <input type="number" id="sch-pir-hold" min="0" value="${s.motion?.pir?.holdSec || 0}" style="width:100%;padding:8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                    </details>
                </div>`;

            const segContainer = content.querySelector('#sch-segs');
            const currentSegs = JSON.parse(JSON.stringify(s.segments || []));

            // =========================================================
            // [O-8] 세그먼트 삭제 Undo
            // =========================================================
            const _removeWithUndo = (idx) => {
                if (currentSegs.length <= 1) {
                    SNW.ToastUtil.warn(SNW.I18n.t('validate.segmentMin'));
                    return;
                }
                const removed = currentSegs.splice(idx, 1)[0];
                renderSegs(currentSegs);

                // Undo 토스트 (일반 ToastUtil로 처리 — 커스텀 버튼 삽입)
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
                    segDiv.style.cssText = 'padding:8px;border:1px solid var(--snw-border);border-radius:4px;';
                    segDiv.innerHTML = `
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <b style="font-size:12px;">${t('scheduler.segment', '세그먼트')} ${idx+1}</b>
                            <button type="button" class="snw-btn-icon" data-remove-seg="${idx}">🗑</button>
                        </div>
                        <div style="display:flex;gap:4px;margin-bottom:4px;">
                            <label style="flex:1;">On(분)
                                <input type="number" class="seg-on" min="0" max="1440" value="${seg.onMinutes}"
                                       style="width:100%;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="flex:1;">Off(분)
                                <input type="number" class="seg-off" min="0" max="1440" value="${seg.offMinutes}"
                                       style="width:100%;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                        </div>
                        <div style="display:flex;gap:4px;margin-bottom:4px;">
                            <label style="flex:1;">모드
                                <select class="seg-mode"
                                        style="width:100%;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                    <option value="PRESET" ${seg.mode === 'PRESET' ? 'selected' : ''}>프리셋</option>
                                    <option value="FIXED"  ${seg.mode === 'FIXED'  ? 'selected' : ''}>고정풍속</option>
                                </select>
                            </label>
                        </div>
                        <div class="seg-preset-area" style="display:${seg.mode === 'PRESET' ? 'block' : 'none'};">
                            <div style="display:flex;gap:4px;">
                                <label style="flex:1;">프리셋
                                    <input type="text" class="seg-preset" value="${SNW.DomUtil.escape(seg.presetCode || '')}"
                                           style="width:100%;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                                <label style="flex:1;">스타일
                                    <input type="text" class="seg-style" value="${SNW.DomUtil.escape(seg.styleCode || '')}"
                                           style="width:100%;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>
                        <div class="seg-fixed-area" style="display:${seg.mode === 'FIXED' ? 'block' : 'none'};">
                            <label>고정 풍속(%)
                                <input type="number" class="seg-fixed" min="0" max="100" value="${seg.fixedSpeed || 0}"
                                       style="width:100%;padding:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                        </div>`;

                    segDiv.querySelector('.seg-mode').addEventListener('change', (e) => {
                        segDiv.querySelector('.seg-preset-area').style.display = e.target.value === 'PRESET' ? 'block' : 'none';
                        segDiv.querySelector('.seg-fixed-area').style.display  = e.target.value === 'FIXED'  ? 'block' : 'none';
                    });
                    segDiv.querySelector('[data-remove-seg]').addEventListener('click', () => _removeWithUndo(idx));
                    segContainer.appendChild(segDiv);
                });
            };
            renderSegs(currentSegs);

            content.querySelector('#btn-add-seg').addEventListener('click', () => {
                currentSegs.push({
                    segNo: currentSegs.length * 10 + 10,
                    onMinutes: 20, offMinutes: 10, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    adjust: {}, fixedSpeed: 0
                });
                renderSegs(currentSegs);
            });

            // =========================================================
            // 저장 — [O-7] 필드별 검증
            // =========================================================
            SNW.UI.modal(
                isEdit ? t('common.edit', '편집') : t('schedule.add', '스케줄 추가'),
                content,
                async () => {
                    const nameEl  = content.querySelector('#sch-name');
                    const startEl = content.querySelector('#sch-start');
                    const endEl   = content.querySelector('#sch-end');

                    // 필드 초기화
                    [nameEl, startEl, endEl].forEach(el => el.classList.remove('is-error'));

                    const errors = [];
                    if (!nameEl.value.trim()) {
                        nameEl.classList.add('is-error');
                        errors.push({ el: nameEl, msg: SNW.I18n.t('validate.required', { field: t('schedule.name', '이름') }) });
                    }
                    if (startEl.value >= endEl.value) {
                        endEl.classList.add('is-error');
                        errors.push({ el: endEl, msg: SNW.I18n.t('validate.timeOrder') });
                    }

                    const onInputs  = segContainer.querySelectorAll('.seg-on');
                    const offInputs = segContainer.querySelectorAll('.seg-off');
                    onInputs.forEach((el, i) => {
                        el.classList.remove('is-error');
                        const v = Number(el.value);
                        if (isNaN(v) || v < 0 || v > 1440) {
                            el.classList.add('is-error');
                            errors.push({ el, msg: `세그먼트 ${i+1} On: 0~1440분` });
                        }
                    });
                    offInputs.forEach((el, i) => {
                        el.classList.remove('is-error');
                        const v = Number(el.value);
                        if (isNaN(v) || v < 0 || v > 1440) {
                            el.classList.add('is-error');
                            errors.push({ el, msg: `세그먼트 ${i+1} Off: 0~1440분` });
                        }
                    });

                    if (errors.length) {
                        SNW.ToastUtil.error(SNW.I18n.t('validate.multiErrors', { count: errors.length }));
                        const first = content.querySelector('.is-error');
                        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return false;
                    }

                    // body 구성
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

                    const days = Array.from(content.querySelectorAll('[data-day]')).map(cb => cb.checked ? 1 : 0);

                    const body = {
                        schedule: {
                            schNo: s.schNo,
                            name: nameEl.value,
                            enabled: s.enabled,
                            repeatSegments: content.querySelector('#sch-repeat').checked,
                            repeatCount: Number(content.querySelector('#sch-repeat-count').value),
                            period: {
                                enabled: true, days,
                                startTime: startEl.value, endTime: endEl.value
                            },
                            segments: newSegs,
                            autoOff: {
                                timer: {
                                    enabled: Number(content.querySelector('#sch-ao-timer').value) > 0,
                                    minutes: Number(content.querySelector('#sch-ao-timer').value)
                                },
                                offTime: {
                                    enabled: content.querySelector('#sch-ao-offtime-en').checked,
                                    time: content.querySelector('#sch-ao-offtime').value
                                },
                                offTemp: {
                                    enabled: content.querySelector('#sch-ao-offtemp-en').checked,
                                    temp: Number(content.querySelector('#sch-ao-offtemp').value)
                                }
                            },
                            motion: {
                                pir: {
                                    enabled: content.querySelector('#sch-pir-en').checked,
                                    holdSec: Number(content.querySelector('#sch-pir-hold').value)
                                }
                            }
                        }
                    };

                    try {
                        if (isEdit) await SNW.Api.updateSchedule(s.schId, body);
                        else        await SNW.Api.addSchedule(body);
                        await SNW.Api.saveConfig();
                        SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
                        await this._load();
                        return true;
                    } catch (e) {
                        SNW.ErrorHandler.handle(e, 'schedule.save');
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
                await SNW.Api.deleteSchedule(id);
                await SNW.Api.saveConfig();
                await this._load();
            } catch (e) {
                SNW.ErrorHandler.handle(e, 'schedule.delete');
            }
        }

        async _onToggle(id, next) {
            const target = this._schedules.find(s => s.schId === id);
            if (!target) return;
            const prevEnabled = target.enabled;
            target.enabled = !!next;
            try {
                await SNW.Api.updateSchedule(id, { schedule: target });
                this._renderList();
            } catch (e) {
                target.enabled = prevEnabled;
                this._renderList();
                SNW.ErrorHandler.handle(e, 'schedule.toggle');
            }
        }
    };
})(window.SNW);
