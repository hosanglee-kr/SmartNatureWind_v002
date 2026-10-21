// =========================================================
// 101.ui.toggle.js — SNW.UI.toggle (On/Off 대형 토글)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - 낙관적 UI 지원 (set()으로 외부 동기화)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	/**
	 * On/Off 토글
	 * @param {object} opts
	 *   root     : HTMLElement
	 *   on       : boolean (초기 상태)
	 *   onToggle : (next:boolean) => void
	 *   onLabel  : string (기본 = I18n 'dashboard.powerOn')
	 *   offLabel : string (기본 = I18n 'dashboard.powerOff')
	 * @returns {{set: function(boolean)}}
	 */
	SNW.UI.toggle = function(opts) {
		const {
			root,
			on = false,
			onToggle,
			onLabel = SNW.I18n.t('dashboard.powerOn'),
			offLabel = SNW.I18n.t('dashboard.powerOff')
		} = opts || {};
		
		if (!root) return { set: () => {} };
		
		let state = !!on;
		
		const render = () => {
			root.innerHTML = '';
			const btn = SNW.DomUtil.html`
                <button class="snw-toggle ${state ? 'is-on' : 'is-off'}" type="button"
                        aria-pressed="${state ? 'true' : 'false'}">
                    <span class="snw-toggle__icon">${state ? '⏹' : '▶'}</span>
                    <span class="snw-toggle__label">${state ? offLabel : onLabel}</span>
                </button>`;
			btn.addEventListener('click', () => {
				const next = !state;
				state = next;
				render();
				if (typeof onToggle === 'function') {
					try { onToggle(next); }
					catch (e) { SNW.LogUtil.error('[toggle] onToggle 실패', e); }
				}
			});
			root.appendChild(btn);
		};
		
		render();
		
		return {
			set(next) {
				const v = !!next;
				if (v === state) return;
				state = v;
				render();
			}
		};
	};
	
})(window.SNW);
