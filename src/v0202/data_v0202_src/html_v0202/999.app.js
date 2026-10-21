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
	

	// ======================================================
	// [핵심] index.html 로더가 호출하는 전역 부트스트랩 함수
	// ======================================================
	window.SNW_BOOT = async function() {
		if (window.SNW_BOOT_CALLED) return;
		window.SNW_BOOT_CALLED = true;
		
		try {
			if (window.SNW_OFFLINE && SNW.Offline && SNW.Offline.ready) {
				await SNW.Offline.ready;
			}
			
			SNW.I18n.applyTo(document);
			if (typeof SNW.LevelUtil !== 'undefined' && SNW.LevelUtil.applyTo) {
				SNW.LevelUtil.applyTo(document.body);
			}
			
			_bindConnectionStatus();
			_bindLastUpdate();
			SNW.WsManager.initByLevel();
			SNW.StoreBridge.start();
			_bindLangToggle();
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
	};
	
	// 안전장치: DOMContentLoaded가 이미 지나갔으면 즉시 호출
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => { window.SNW_BOOT(); });
	} else {
		window.SNW_BOOT();
	}
	

})(window.SNW);
