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
			
			SNW.DomUtil.delegate(this.el, '[data-action="start-profile"]', 'click', (e, el) => {
				const no = Number(el.getAttribute('data-no'));
				if (no) this._onStart(no);
			});
			SNW.DomUtil.delegate(this.el, '[data-action="stop-profile"]', 'click', () => {
				this._onStop();
			});
			SNW.DomUtil.delegate(this.el, '[data-action="del-profile"]', 'click', (e, el) => {
				const id = Number(el.getAttribute('data-id'));
				if (id) this._onDelete(id);
			});
			
			// 활성 프로필 Store 구독
			const unsub = SNW.Store.watch('control', (ctl) => {
				if (!this._active || !ctl) return;
				const activeNo = ctl.profile && ctl.profile.profileNo;
				this._highlightActive(activeNo);
			});
			this._unsubs.push(unsub);
			
			SNW.LogUtil.info('[Profiles] mount 완료');
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
			
			if (!this._profiles.length) {
				listSlot.appendChild(SNW.DomUtil.html`
                    <div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
				SNW.I18n.applyTo(listSlot);
				return;
			}
			
			const wrap = document.createElement('div');
			wrap.className = 'snw-profile-list';
			
			this._profiles.forEach(p => {
				const disabled = !p.enabled;
				const card = SNW.DomUtil.html`
                    <div class="snw-profile-item ${disabled ? 'is-disabled' : ''}"
                         data-profile-no="${p.profileNo}">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${p.profileNo}</span>
                            <span class="snw-profile-name">${p.name || ''}</span>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger"
                                    data-action="del-profile" data-id="${p.profileId}"
                                    title="delete">🗑</button>
                        </div>
                        <div class="snw-profile-segcount">${p.segCount || 0} segments</div>
                        <div class="snw-profile-actions">
                            <button type="button" class="snw-btn snw-btn-primary"
                                    data-action="start-profile" data-no="${p.profileNo}"
                                    ${disabled ? 'disabled' : ''}
                                    data-i18n="profile.start">시작</button>
                        </div>
                    </div>`;
				wrap.appendChild(card);
			});
			
			listSlot.appendChild(wrap);
			
			// 정지 버튼 (전역 1개)
			const stopBtn = SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn"
                            data-action="stop-profile" data-i18n="profile.stop">정지</button>
                </div>`;
			listSlot.insertBefore(stopBtn, wrap);
			
			SNW.I18n.applyTo(listSlot);
			
			// 현재 활성 프로필 강조
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
	};
	
})(window.SNW);
