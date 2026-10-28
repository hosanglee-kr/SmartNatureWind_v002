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
                    presetCode: 'HARBOR_BREEZE', styleCode: 'BALANCE',
                    override: { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 45 },
                    fixedSpeed: 0
                }],
                autoOff: {
                    timer:   { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 }
               const t = (k, fb) => SNW.I18n ? SNW.I18n.t(k) : fb;
            const dayKeys = ['days.mon','days.tue','days.wed','days.thu','days.fri','days.sat','days.sun'];

            const PRESET_CODES = [
                'OCEAN', 'COUNTRY_BREEZE', 'MEDITERRANEAN', 'MOUNTAIN', 'PLAINS',
                'HARBOR_BREEZE', 'FOREST_CANOPY', 'URBAN_SUNSET', 'TROPICAL_RAIN', 'DESERT_NIGHT'
            ];

            const STYLE_CODES = ['BALANCE', 'ACTIVE', 'FOCUS', 'RELAX', 'SLEEP'];

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

                    <details class="snw-accordion" open id="details-segs">
                        <summary id="sch-seg-summary" style="cursor:pointer;font-weight:600;">${SNW.I18n.t('schedule.secSegments')}</summary>
                        <div class="snw-accordion__content">
                            <div id="sch-segs" style="display:flex;flex-direction:column;gap:12px;"></div>
                            <button type="button" class="snw-btn snw-btn-secondary" id="btn-add-seg" style="margin-top:12px; width:100%; border: 1px dashed var(--snw-primary); color: var(--snw-primary); background: transparent;">
                                + ${SNW.I18n.t('schedule.addSegmentBtn')}
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

            // 조건부 비활성화 바인딩
            const bindConditionals = () => {
                const pairs = [
                    { chk: '#sch-ao-offtime-en', target: '#sch-ao-offtime' },
                    { chk: '#sch-ao-offtemp-en', target: '#sch-ao-offtemp' },
                    { chk: '#sch-pir-en', target: '#sch-pir-hold' }
                ];
                pairs.forEach(({ chk, target }) => {
                    const chkEl = content.querySelector(chk);
                    const tgtEl = content.querySelector(target);
                    if (chkEl && tgtEl) {
                        const update = () => {
                            tgtEl.disabled = !chkEl.checked;
                            tgtEl.style.opacity = chkEl.checked ? '1' : '0.4';
                        };
                        chkEl.addEventListener('change', update);
                        update();
                    }
                });
            };
            bindConditionals();

            const segContainer = content.querySelector('#sch-segs');
            const currentSegs = JSON.parse(JSON.stringify(s.segments || []));

            const updateSummaryText = () => {
                const sumEl = content.querySelector('#sch-seg-summary');
                if (!sumEl) return;
                if (!currentSegs.length) {
                    sumEl.textContent = `${t('schedule.secSegments', '세그먼트')} (0)`;
                    return;
                }
                const parts = currentSegs.map((sg, i) => {
                    if (sg.mode === 'FIXED') return `${i+1}:${t('segment.modeFixed', '고정')}(${sg.fixedSpeed || 0}%) ${sg.onMinutes}m/${sg.offMinutes}m`;
                    const pName = t('preset.' + sg.presetCode, sg.presetCode);
                    return `${i+1}:${pName} ${sg.onMinutes}m/${sg.offMinutes}m`;
                });
                sumEl.textContent = `${t('segment.summaryPrefix', '세그먼트')} (${currentSegs.length}) · ${parts.join(' → ')}`;
            };

            const _moveSeg = (idx, dir) => {
                const targetIdx = idx + dir;
                if (targetIdx < 0 || targetIdx >= currentSegs.length) return;
                const temp = currentSegs[idx];
                currentSegs[idx] = currentSegs[targetIdx];
                currentSegs[targetIdx] = temp;
                currentSegs.forEach((sg, i) => { sg.segNo = (i + 1) * 10; });
                renderSegs(currentSegs);
            };

            const _removeWithUndo = (idx) => {
                if (currentSegs.length <= 1) {
                    SNW.ToastUtil.warn(SNW.I18n.t('validate.segmentMin'));
                    return;
                }
                const removed = currentSegs.splice(idx, 1)[0];
                renderSegs(currentSegs);

                const host = document.getElementById('toast-host');
                if (host) {
                    const tEl = document.createElement('div');
                    tEl.className = 'snw-toast snw-toast--warn';
                    tEl.style.cssText = 'display:flex;align-items:center;gap:12px;';
                    tEl.innerHTML = `
                        <span style="flex:1;">${SNW.I18n.t('segment.deleted')}</span>
                        <button type="button" style="background:none;border:none;color:var(--snw-primary);cursor:pointer;font-weight:600;text-decoration:underline;padding:0;font-size:13px;">
                            ${SNW.I18n.t('common.undo')}
                        </button>`;
                    tEl.querySelector('button').onclick = () => {
                        currentSegs.splice(idx, 0, removed);
                        renderSegs(currentSegs);
                        tEl.remove();
                    };
                    host.appendChild(tEl);
                    setTimeout(() => {
                        tEl.classList.add('snw-toast--out');
                        setTimeout(() => tEl.remove(), 300);
                    }, 5000);
                }
            };

            const renderSegs = (segs) => {
                segContainer.innerHTML = '';
                segs.forEach((seg, idx) => {
                    const ovr = seg.override || { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 };
                    const segDiv = document.createElement('div');
                    segDiv.className = 'snw-seg-card';
                    segDiv.style.cssText = 'background:var(--snw-surface);border:1px solid var(--snw-border);border-radius:8px;padding:12px;';
                    
                    segDiv.innerHTML = `
                        <div class="snw-seg-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                            <span class="snw-seg-title" style="font-weight:bold;color:var(--snw-primary);">${t('scheduler.segment', '세그먼트')} ${idx + 1}</span>
                            <div style="display:flex;align-items:center;gap:4px;">
                                <button type="button" class="snw-btn-icon btn-move-up" data-move-up="${idx}" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="${t('segment.moveUp', '위로')}">▲</button>
                                <button type="button" class="snw-btn-icon btn-move-down" data-move-down="${idx}" ${idx === segs.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="${t('segment.moveDown', '아래로')}">▼</button>
                                <button type="button" class="snw-btn-icon btn-del-seg" data-remove-seg="${idx}" style="color:var(--snw-error);" title="${t('common.delete', '삭제')}">🗑</button>
                            </div>
                        </div>
                        <div class="snw-seg-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <label style="font-size:12px;">${t('segment.onMinutes', '작동 시간(분)')}
                                <input type="number" class="seg-on" min="0" max="1440" value="${seg.onMinutes}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="font-size:12px;">${t('segment.offMinutes', '정지 시간(분)')}
                                <input type="number" class="seg-off" min="0" max="1440" value="${seg.offMinutes}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                            </label>
                            <label style="grid-column: span 2; font-size:12px;">${t('segment.mode', '모드')}
                                <select class="seg-mode" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                    <option value="PRESET" ${seg.mode === 'PRESET' ? 'selected' : ''}>${t('segment.modePreset', '프리셋 모드')}</option>
                                    <option value="FIXED"  ${seg.mode === 'FIXED'  ? 'selected' : ''}>${t('segment.modeFixed', '고정풍속 모드')}</option>
                                </select>
                            </label>
                            <div class="snw-seg-preset-area" style="grid-column: span 2; display: ${seg.mode === 'PRESET' ? 'grid' : 'none'}; grid-template-columns:1fr 1fr; gap:8px;">
                                <label style="font-size:12px;">${t('segment.presetSelect', '프리셋 선택')}
                                    <select class="seg-preset" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                        ${PRESET_CODES.map(c => `<option value="${c}" ${seg.presetCode === c ? 'selected' : ''}>${c} (${t('preset.' + c, c)})</option>`).join('')}
                                    </select>
                                </label>
                                <label style="font-size:12px;">${t('segment.styleSelect', '스타일 선택')}
                                    <select class="seg-style" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                        ${STYLE_CODES.map(c => `<option value="${c}" ${seg.styleCode === c ? 'selected' : ''}>${c} (${t('style.' + c, c)})</option>`).join('')}
                                    </select>
                                </label>
                                <details class="snw-accordion snw-seg-override" style="grid-column: span 2; margin-top:4px; border: 1px dashed var(--snw-border); border-radius: 6px; padding: 6px 10px;">
                                    <summary style="font-size:11.5px; font-weight:600; color:var(--snw-primary); cursor:pointer;">
                                        ${t('segment.overrideTitle', '⚙️ 고급 물리 설정 (Override 직접 지정)')}
                                    </summary>
                                    <div class="snw-accordion__content" style="padding-top:8px;">
                                        <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;margin-bottom:8px;cursor:pointer;">
                                            <input type="checkbox" class="seg-ovr-en" ${ovr.enabled ? 'checked' : ''}>
                                            <span>${t('segment.overrideDesc', '이 세그먼트에서 바람 세부 설정 직접 지정 (Override)')}</span>
                                        </label>
                                        <div class="seg-ovr-fields" style="${ovr.enabled ? '' : 'display:none;opacity:0.5;'}">
                                            <div class="snw-form-row" style="margin-bottom:8px;">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideIntensity', '바람 강도 (%)')}</label>
                                                    <b class="val-int-txt">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-int" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}" style="width:100%;">
                                                <div class="fb-int-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                            <div class="snw-form-row" style="margin-bottom:8px;">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideVariability', '바람 변동성 (%)')}</label>
                                                    <b class="val-var-txt">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-var" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}" style="width:100%;">
                                                <div class="fb-var-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                            <div class="snw-form-row">
                                                <div style="display:flex;justify-content:space-between;font-size:11px;">
                                                    <label>${t('segment.overrideGust', '돌풍 빈도 (%)')}</label>
                                                    <b class="val-gust-txt">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 40}%</b>
                                                </div>
                                                <input type="range" class="seg-ovr-gust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 40}" style="width:100%;">
                                                <div class="fb-gust-txt" style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                            <div class="snw-seg-fixed-area" style="grid-column: span 2; display: ${seg.mode === 'FIXED' ? 'block' : 'none'};">
                                <label style="font-size:12px;">${t('segment.fixedSpeed', '고정 풍속(%)')}
                                    <input type="number" class="seg-fixed" min="0" max="100" value="${seg.fixedSpeed || 0}" style="width:100%;padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);">
                                </label>
                            </div>
                        </div>`;

                    // 모드 전환 바인딩
                    const modeSel = segDiv.querySelector('.seg-mode');
                    const presetArea = segDiv.querySelector('.snw-seg-preset-area');
                    const fixedArea = segDiv.querySelector('.snw-seg-fixed-area');
                    modeSel.addEventListener('change', (e) => {
                        const isPreset = e.target.value === 'PRESET';
                        presetArea.style.display = isPreset ? 'grid' : 'none';
                        fixedArea.style.display  = isPreset ? 'none' : 'block';
                        updateSummaryText();
                    });

                    // Override 토글 및 실시간 뱃지 연동
                    const ovrEn = segDiv.querySelector('.seg-ovr-en');
                    const ovrFields = segDiv.querySelector('.seg-ovr-fields');
                    ovrEn.addEventListener('change', () => {
                        ovrFields.style.display = ovrEn.checked ? 'block' : 'none';
                    });

                    const bindRange = (rangeSel, txtSel, fbSel, guideFn) => {
                        const rEl = segDiv.querySelector(rangeSel);
                        const tEl = segDiv.querySelector(txtSel);
                        const fEl = segDiv.querySelector(fbSel);
                        if (!rEl) return;
                        const sync = () => {
                            if (tEl) tEl.textContent = `${rEl.value}%`;
                            if (fEl && guideFn) {
                                const g = guideFn(Number(rEl.value));
                                fEl.textContent = g ? `▶ ${g.title}` : '';
                            }
                        };
                        rEl.addEventListener('input', sync);
                        sync();
                    };

                    bindRange('.seg-ovr-int',  '.val-int-txt',  '.fb-int-txt',  val => SNW.Feedback?.getIntensityGuide(val));
                    bindRange('.seg-ovr-var',  '.val-var-txt',  '.fb-var-txt',  val => SNW.Feedback?.getVariabilityGuide(val));
                    bindRange('.seg-ovr-gust', '.val-gust-txt', '.fb-gust-txt', val => SNW.Feedback?.getGustGuide(val));

                    // 순서 이동 및 삭제 버튼 바인딩
                    const upBtn = segDiv.querySelector('.btn-move-up');
                    const downBtn = segDiv.querySelector('.btn-move-down');
                    if (upBtn) upBtn.onclick = () => _moveSeg(idx, -1);
                    if (downBtn) downBtn.onclick = () => _moveSeg(idx, 1);
                    segDiv.querySelector('.btn-del-seg').onclick = () => _removeWithUndo(idx);

                    segContainer.appendChild(segDiv);
                });
                updateSummaryText();
            };

            renderSegs(currentSegs);

            content.querySelector('#btn-add-seg').addEventListener('click', () => {
                currentSegs.push({
                    segNo: currentSegs.length * 10 + 10,
                    onMinutes: 20, offMinutes: 10, mode: 'PRESET',
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    override: { enabled: false, windIntensity: 70, windVariability: 50, gustFrequency: 40 },
                    fixedSpeed: 0
                });
                renderSegs(currentSegs);
            });

            // =========================================================
            // 저장 — [O-7] 필드별 검증 & Override 직결 수집
            // =========================================================
            SNW.UI.modal(
                isEdit ? `스케줄 수정: ${SNW.DomUtil.escape(s.name)}` : t('schedule.add', '스케줄 추가'),
                content,
                async () => {
                    const nameEl  = content.querySelector('#sch-name');
                    const startEl = content.querySelector('#sch-start');
                    const endEl   = content.querySelector('#sch-end');

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
                            errors.push({ el, msg: `세그먼트 ${i+1} 작동 시간: 0~1440분` });
                        }
                    });
                    offInputs.forEach((el, i) => {
                        el.classList.remove('is-error');
                        const v = Number(el.value);
                        if (isNaN(v) || v < 0 || v > 1440) {
                            el.classList.add('is-error');
                            errors.push({ el, msg: `세그먼트 ${i+1} 정지 시간: 0~1440분` });
                        }
                    });

                    if (errors.length) {
                        SNW.ToastUtil.error(SNW.I18n.t('validate.multiErrors', { count: errors.length }));
                        const first = content.querySelector('.is-error');
                        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return false;
                    }

                    // body 구성 (Override 직결 전송)
                    const newSegs = [];
                    segContainer.querySelectorAll('.snw-seg-card').forEach((card, idx) => {
                        const on   = Number(card.querySelector('.seg-on').value);
                        const off  = Number(card.querySelector('.seg-off').value);
                        const mode = card.querySelector('.seg-mode').value;
                        const seg = { segNo: idx * 10 + 10, onMinutes: on, offMinutes: off, mode };
                        if (mode === 'PRESET') {
                            seg.presetCode = card.querySelector('.seg-preset').value;
                            seg.styleCode  = card.querySelector('.seg-style').value;
                            const ovrEn = card.querySelector('.seg-ovr-en').checked;
                            seg.override = {
                                enabled: ovrEn,
                                windIntensity:   ovrEn ? Number(card.querySelector('.seg-ovr-int').value) : -1.0,
                                windVariability: ovrEn ? Number(card.querySelector('.seg-ovr-var').value) : -1.0,
                                gustFrequency:   ovrEn ? Number(card.querySelector('.seg-ovr-gust').value) : -1.0
                            };
                        } else {
                            seg.fixedSpeed = Number(card.querySelector('.seg-fixed').value);
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
                { width: '560px' }
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
