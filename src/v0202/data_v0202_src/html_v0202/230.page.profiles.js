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
			this._unsubs = [];
			this._active = true;
			this._profiles = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.profiles());
			SNW.I18n.applyTo(this.el);
			
			await this._load();
			
			// 이벤트 위임 등록 (시작, 정지, 삭제, 추가)
			SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => {
				const no = Number(el.getAttribute('data-no'));
				if (no) this._onStart(no);
			});
			SNW.DomUtil.delegate(this.el, '[data-action="stop-profile"]', 'click', () => this._onStop());
			SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => {
				const id = Number(el.getAttribute('data-id'));
				if (id) this._onDelete(id);
			});
			// [추가] 프로필 추가 버튼 이벤트
			SNW.DomUtil.delegate(this.el, '[data-action="add-profile"]', 'click', () => this._onAdd());
			
			// Store 감시 (활성 프로필 하이라이트용)
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
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.load');
			}
		}
		
		_renderList() {
			const listSlot = this.el.querySelector('[data-slot="list"]');
			if (!listSlot) return;
			
			listSlot.innerHTML = '';
			
			// 상단 툴바 (정지 버튼 + 추가 버튼)
			const toolbar = SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn" data-action="stop-profile" data-i18n="profile.stop">정지</button>
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-profile" data-i18n="common.add">추가</button>
                </div>`;
			listSlot.appendChild(toolbar);
			
			if (!this._profiles.length) {
				listSlot.appendChild(SNW.DomUtil.html`<div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				SNW.I18n.applyTo(listSlot);
				return;
			}
			
			const wrap = document.createElement('div');
			wrap.className = 'snw-profile-list';
			
			this._profiles.forEach(p => {
				const disabled = !p.enabled;
				wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-profile-item ${disabled ? 'is-disabled' : ''}" data-profile-no="${p.profileNo}">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${p.profileNo}</span>
                            <span class="snw-profile-name">${p.name || ''}</span>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger" data-action="del-profile" data-id="${p.profileId}">🗑</button>
                        </div>
                        <div class="snw-profile-segcount">${p.segCount || 0} segments</div>
                        <div class="snw-profile-actions">
                            <button type="button" class="snw-btn snw-btn-primary" data-action="start-profile" data-no="${p.profileNo}" ${disabled ? 'disabled' : ''} data-i18n="profile.start">시작</button>
                        </div>
                    </div>`);
			});
			
			listSlot.appendChild(wrap);
			SNW.I18n.applyTo(listSlot);
			
			// 현재 활성 프로필이 있으면 하이라이트
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
			try {
				await SNW.Api.selectProfile(profileNo);
				SNW.ToastUtil.success(SNW.I18n.t('profile.start'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.start');
			}
		}
		
		async _onStop() {
			try {
				await SNW.Api.stopProfile();
				SNW.ToastUtil.success(SNW.I18n.t('profile.stop'));
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.stop');
			}
		}
		
		async _onDelete(id) {
			if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
			try {
				await SNW.Api.deleteProfile(id);
				SNW.ToastUtil.success(SNW.I18n.t('common.success'));
				await this._load();
			} catch (e) {
				SNW.ErrorHandler.handle(e, 'profiles.delete');
			}
		}
		
		// [신규] 프로필 추가 모달
		async _onAdd() {
			// 가장 큰 profileNo 찾기 (자동 증가용)
			const maxNo = this._profiles.reduce((m, p) => Math.max(m, p.profileNo || 0), 0);
			const nextNo = maxNo + 10;
			
			const inputDiv = document.createElement('div');
			inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">
                    프로필 이름
                    <input type="text" id="prof-name" value="New Profile ${nextNo}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">
                    프로필 번호 (No)
                    <input type="number" id="prof-no" value="${nextNo}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
            `;
			
			SNW.UI.modal('프로필 추가', inputDiv, async () => {
				const name = inputDiv.querySelector('#prof-name').value;
				const profileNo = Number(inputDiv.querySelector('#prof-no').value);
				
				if (!name || !profileNo) {
					SNW.ToastUtil.warn('이름과 번호를 입력하세요.');
					return false;
				}
				
				const body = {
					profile: {
						profileNo: profileNo,
						name: name,
						enabled: true,
						repeatSegments: false,
						repeatCount: 0,
						segments: [],
						autoOff: { timer: { enabled: false }, offTime: { enabled: false }, offTemp: { enabled: false } },
						motion: { pir: { enabled: false } }
					}
				};
				
				try {
					await SNW.Api.addProfile(body);
					SNW.ToastUtil.success(SNW.I18n.t('msg.saveSuccess'));
					await this._load();
					return true;
				} catch (e) {
					SNW.ErrorHandler.handle(e, 'profiles.add');
					return false;
				}
			});
		}
	};
})(window.SNW);
