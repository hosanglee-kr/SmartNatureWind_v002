// =========================================================
// 031.util.dom.js — SNW.DomUtil (PATCHED)
//  - 원본의 DomUtil 재할당 → 단일 리터럴로 통합
//  - tooltip()을 리터럴 첫 메서드로 이동
//  - 중복 'use strict'; 제거
//  - tooltip 내부 참조를 this.escape()로 방어
// Layer 1 (유틸) — SNW.C 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.DomUtil = {
		// [U-B6] 용어 툴팁
		tooltip(term, definition) {
			return `<span class="snw-term" title="${this.escape(definition)}" style="cursor:help;border-bottom:1px dashed var(--snw-text-dim);">${this.escape(term)}</span>`;
		},
		
		/** 안전 textContent */
		text(el, v) {
			if (el) el.textContent = (v == null) ? '' : String(v);
		},
		
		/** 안전 class 토글 */
		toggleClass(el, cls, on) {
			if (el) el.classList.toggle(cls, !!on);
		},
		
		/** data-* 기반 이벤트 위임 */
		delegate(root, selector, event, handler) {
			root.addEventListener(event, (e) => {
				const t = e.target.closest(selector);
				if (t && root.contains(t)) handler(e, t);
			});
		},
		
		/** HTML escape */
		escape(s) {
			return String(s).replace(/[&<>"']/g,
				c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [c]));
		},
		
		/** HTML 템플릿 → Element (비문자열·배열·객체 포함 escape, raw()만 opt-in 허용) */
		html(strings, ...vals) {
			const div = document.createElement('div');
			div.innerHTML = strings.reduce((acc, s, i) => {
				const v = vals[i];
				let safe;
				if (v == null) {
					safe = '';
				} else if (typeof v === 'string') {
					safe = this.escape(v);
				} else if (typeof v === 'number' || typeof v === 'boolean') {
					safe = String(v);
				} else if (v && typeof v === 'object' && typeof v.__raw === 'string') {
					safe = v.__raw;
				} else {
					safe = this.escape(String(v));
				}
				return acc + s + (i < vals.length ? safe : '');
			}, '').trim();
			return div.firstElementChild;
		},

		/** 명시적 pre-escaped HTML 삽입용 opt-in 헬퍼 */
		raw(str) {
			return { __raw: String(str) };
		},
		
		/** 반응형 뷰포트 클래스 */
		applyResponsiveClass(el) {
			const apply = () => {
				const w = window.innerWidth;
				el.classList.toggle('snw-mobile', w < 768);
				el.classList.toggle('snw-tablet', w >= 768 && w < 1024);
				el.classList.toggle('snw-desktop', w >= 1024);
			};
			apply();
			window.addEventListener('resize', apply);
		}
	};
	
})(window.SNW);
