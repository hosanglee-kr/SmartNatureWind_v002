/*
 * ------------------------------------------------------
 * 소스명   : 030.util.level.js
 * 모듈     : SNW.LevelUtil
 * 레이어   : Layer 1 (유틸) — 030~034와 동일 계층
 * 기능 요약:
 *  - 사용자 레벨 (L1~L4) 조회/설정
 *  - data-min-level 속성 자동 필터
 *  - localStorage 기반 유지
 * 의존성   : SNW.C, SNW.CFG
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
(function (SNW) {
	'use strict';

	SNW.LevelUtil = {
		LEVELS: SNW.C.LEVEL.ORDER,

		current() {
			try {
				const v = localStorage.getItem(SNW.CFG.LS_KEY.LEVEL);
				return this.LEVELS.includes(v) ? v : SNW.CFG.DEFAULT_LEVEL;
			} catch { return SNW.CFG.DEFAULT_LEVEL; }
		},

		set(level, opts = {}) {
			if (!this.LEVELS.includes(level)) return;
			try { localStorage.setItem(SNW.CFG.LS_KEY.LEVEL, level); } catch { }
			const reload = (opts.reload !== false);
			if (reload) {
				location.reload();
			} else {
				this.applyTo(document);
				document.dispatchEvent(new CustomEvent('snw:levelchange', { detail: { level } }));
			}
		},

		atLeast(minLevel) {
			const cur = this.current();
			return this.LEVELS.indexOf(cur) >= this.LEVELS.indexOf(minLevel);
		},

		/** data-min-level 요소 자동 표시/숨김 (클래스 토글로 원본 flex/grid 보존) */
		applyTo(root) {
			const cur = this.current();
			(root || document).querySelectorAll('[data-min-level]').forEach(el => {
				const min = el.getAttribute('data-min-level');
				const show = this.LEVELS.indexOf(cur) >= this.LEVELS.indexOf(min);
				el.classList.toggle('snw-hidden-by-level', !show);
				el.setAttribute('aria-hidden', show ? 'false' : 'true');
			});
		}
	};

})(window.SNW);
