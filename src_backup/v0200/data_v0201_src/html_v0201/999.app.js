// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// Layer 5 — Layer 0~4 참조
//  - DOMContentLoaded 시 초기화 순서 실행
//  - 언어 토글, WS/Store 시작, 라우터 초기화
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// =====================================================
	// 연결 상태 표시 (Header dot + Footer)
	// =====================================================
	function _bindConnectionStatus() {
		const dot = document.getElementById('conn-status');
		const footerStat = document.getElementById('footer-status');
		if (!dot && !footerStat) return;
		
		const render = (conn) => {
			const cls = 'snw-status-dot snw-status-dot--' + conn;
			if (dot) {
				dot.className = cls;
				dot.title = SNW.I18n.t('footer.' + conn);
			}
			if (footerStat) {
				footerStat.textContent = SNW.I18n.t('footer.' + conn);
			}
		};
		
		SNW.Store.watch('connection', render);
		render(SNW.Store.get().connection);
	}
	
	// =====================================================
	// 마지막 업데이트 시각 표시
	// =====================================================
	function _bindLastUpdate() {
		const el = document.getElementById('footer-lastUpdate');
		if (!el) return;
		const render = (ms) => {
			if (!ms) { el.textContent = '-'; return; }
			const sec = Math.round((Date.now() - ms) / 1000);
			el.textContent = sec < 1 ? '0.0s' : `${sec}s`;
		};
		SNW.Store.watch('lastUpdateMs', render);
		setInterval(() => render(SNW.Store.get().lastUpdateMs), 1000);
	}
	
	// =====================================================
	// 언어 토글 버튼
	// =====================================================
	function _bindLangToggle() {
		const btn = document.getElementById('btn-lang');
		if (!btn) return;
		btn.addEventListener('click', () => {
			const cur = SNW.I18n.getLang();
			SNW.I18n.setLang(cur === 'ko' ? 'en' : 'ko');
			// 페이지 재적용 (data-i18n)
			SNW.I18n.applyTo(document);
			// nav 메뉴 재렌더 (Router가 snw:langchange 이벤트 구독)
		});
	}
	
	// =====================================================
	// 부트스트랩 (DOMContentLoaded)
	// =====================================================
	document.addEventListener('DOMContentLoaded', async () => {
		try {
			// 1) i18n 초기 적용
			SNW.I18n.applyTo(document);
			
			// 2) 사용자 레벨 필터
			if (typeof SNW.LevelUtil !== 'undefined' && SNW.LevelUtil.applyTo) {
				SNW.LevelUtil.applyTo(document.body);
			}
			
			// 3) 연결 상태 표시
			_bindConnectionStatus();
			_bindLastUpdate();
			
			// 4) WS + Store 브리지
			SNW.WsManager.initByLevel();
			SNW.StoreBridge.start();
			
			// 5) 언어 토글
			_bindLangToggle();
			
			// 6) 라우터 초기화 (해시 기반 페이지 마운트)
			SNW.Router.init();
			
			SNW.LogUtil.info('App bootstrap complete');
		} catch (e) {
			SNW.LogUtil.error('bootstrap failed', e);
			const main = document.getElementById('snw-main');
			if (main) {
				main.innerHTML = '';
				main.appendChild(SNW.DomUtil.html`<div class="snw-error">${SNW.I18n.t('msg.unknown')}</div>`);
			}
		}
	});
	
})(window.SNW);
