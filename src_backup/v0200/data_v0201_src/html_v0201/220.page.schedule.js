/*
 * ------------------------------------------------------
 * 소스명   : 220.page.schedule.js
 * 모듈     : SNW.Page.Schedule
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 8 스케줄 목록 조회 / 활성 토글 / 삭제
 *  - 신규 추가 (기본값) → POST /schedules
 *  - 세그먼트 편집은 v0201 MVP 범위 외 (Phase 5-b 확장)
 * 제약     : schId/segId 서버 발급 (요청 무시)
 *            schNo/segNo 사용자 지정 가능
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Schedule = class Schedule {
		constructor(container) {
			this.el = container;
			this._unsubs = [];
			this._timers = [];
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
			
			SNW.LogUtil.info('[Schedule] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._unsubs.forEach(fn => { try { fn(); } catch {} });
			this._timers.forEach(id => clearTimeout(id));
			this._unsubs = [];
			this._timers = [];
		}
		
		// -------------------------------------------------
		// 목록 로드 + 렌더
		// -------------------------------------------------
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
			
			// 헤더 (추가 버튼)
			const toolbar = SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary"
                            data-action="add-schedule" data-i18n="common.add">추가</button>
                </div>`;
			listSlot.appendChild(toolbar);
			
			if (!this._schedules.length) {
				listSlot.appendChild(SNW.DomUtil.html`
                    <div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				SNW.I18n.applyTo(listSlot);
				return;
			}
			
			const wrap = document.createElement('div');
			wrap.className = 'snw-schedule-list';
			
			this._schedules.forEach(s => {
				const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
				const daysStr = (s.period && s.period.days) ?
					s.period.days.map((on, i) => on ? dayLabels[i] : '·').join(' ') :
					'-';
				
				const timeStr = (s.period && s.period.startTime && s.period.endTime) ?
					`${s.period.startTime} ~ ${s.period.endTime}` :
					'-';
				
				const card = SNW.DomUtil.html`
                    <div class="snw-schedule-item ${s.enabled ? 'is-enabled' : 'is-disabled'}"
                         data-id="${s.schId}">
                        <div class="snw-schedule-head">
                            <label class="snw-switch">
                                <input type="checkbox" data-action="toggle-schedule"
                                       data-id="${s.schId}" ${s.enabled ? 'checked' : ''} />
                                <span class="snw-switch__slider"></span>
                            </label>
                            <span class="snw-schedule-name">${s.name || ('#' + s.schNo)}</span>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger"
                                    data-action="del-schedule" data-id="${s.schId}"
                                    title="delete">🗑</button>
                        </div>
                        <div class="snw-schedule-meta">
                            <span class="snw-schedule-days">${daysStr}</span>
                            <span class="snw-schedule-time">${timeStr}</span>
                        </div>
                        <div class="snw-schedule-segcount">
                            ${(s.segCount || 0)} segments
                        </div>
                    </div>`;
				wrap.appendChild(card);
			});
			
			listSlot.appendChild(wrap);
			SNW.I18n.applyTo(listSlot);
		}
		
		// -------------------------------------------------
		// 신규 추가 (기본값 스케줄)
		// -------------------------------------------------
		async _onAdd() {
			const maxNo = this._schedules.reduce(
				(m, s) => Math.max(m, s.schNo || 0), 0);
			const nextNo = maxNo + 10;
			
			const body = {
				schedule: {
					schNo: nextNo,
					name: `New Schedule ${nextNo}`,
					enabled: true,
					repeatSegments: true,
					repeatCount: 1,
					period: {
						enabled: true,
						days: [1, 1, 1, 1, 1, 1, 1],
						startTime: '08:00',
						endTime: '20:00'
					},
					segments: [{
						segNo: 10,
						onMinutes: 20,
						offMinutes: 10,
						mode: SNW.C.SEG_MODE.PRESET,
						presetCode: SNW.C.PRESET_CODE.OCEAN,
						styleCode: SNW.C.STYLE_CODE.BALANCE,
						adjust: {}
					}],
					autoOff: {
						timer: { enabled: false, minutes: 0 },
						offTime: { enabled: false, time: '00:00' },
						offTemp: { enabled: false, temp: 0.0 }
					},
					motion: { pir: { enabled: true, holdSec: 120 } }
				}
			};
			
			try {
				await SNW.Api.addSchedule(body);
				SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
				await this._load();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'schedule.add');
			}
		}
		
		async _onDelete(schId) {
			if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
			try {
				await SNW.Api.deleteSchedule(schId);
				SNW.ToastUtil.success(SNW.I18n.t('common.success'));
				await this._load();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'schedule.delete');
			}
		}
		
		async _onToggle(schId, next) {
			const target = this._schedules.find(s => s.schId === schId);
			if (!target) return;
			
			// 낙관적 갱신 (전체 schedule PUT 필요)
			const body = { schedule: Object.assign({}, target, { enabled: !!next }) };
			try {
				await SNW.Api.updateSchedule(schId, body);
				target.enabled = !!next;
				this._renderList();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'schedule.toggle');
				// 롤백 (재로드)
				await this._load();
			}
		}
	};
	
})(window.SNW);
