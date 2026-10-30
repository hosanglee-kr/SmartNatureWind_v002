// =========================================================
// 070.router.js — SNW.Router (해시 기반 SPA 라우터)
// Layer 2 (서비스) — Layer 0~1 참조
//  - ROUTES 정의 (12 페이지)
//  - hashchange 감지 → dispatch
//  - 이전 페이지 unmount → 새 페이지 mount
//  - 사용자 레벨 필터
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// =====================================================
	// 라우트 정의
	//  - path: 해시 경로
	//  - page: SNW.Page 클래스 키 (capitalize 후 매칭)
	//  - level: 최소 사용자 레벨
	// =====================================================
	const ROUTES = {
		'/dashboard': { page: 'dashboard', level: 'L1' },
		'/chart': { page: 'chart', level: 'L2' },
		'/schedule': { page: 'schedule', level: 'L2' },
		'/profiles': { page: 'profiles', level: 'L2' },
		'/sensors': { page: 'sensors', level: 'L2' },
		'/settings': { page: 'settings', level: 'L3' },
		'/network': { page: 'network', level: 'L3' },
		'/logs': { page: 'logs', level: 'L3' },
		'/diagnostics': { page: 'diagnostics', level: 'L4' },
		'/firmware': { page: 'firmware', level: 'L4' },
		'/ai': { page: 'ai', level: 'L4' },
		'/info': { page: 'info', level: 'L1' }
	};
	
	// =====================================================
	// 내부 상태
	// =====================================================
	let currentPage = null; // SNW.Page.* 인스턴스
	let currentPath = null;
	
	function capitalize(s) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
	
	function parseHash() {
		const raw = location.hash.replace(/^#/, '') || '/dashboard';
		return ROUTES[raw] ? raw : '/dashboard';
	}
	
	function _clearMain() {
		const main = document.getElementById('snw-main');
		if (!main) return null;
		main.innerHTML = '';
		return main;
	}
	
	function _showLoading(main) {
		if (!main) return;
		main.appendChild(SNW.DomUtil.html`<div class="snw-loading" data-i18n="common.loading">Loading...</div>`);
		SNW.I18n.applyTo(main);
	}
	
	function _showError(main, msg) {
		if (!main) return;
		main.innerHTML = '';
		main.appendChild(SNW.DomUtil.html`<div class="snw-error">${msg}</div>`);
	}
	
	// =====================================================
	// dispatch (해시 경로 → 페이지 마운트)
	// =====================================================
	async function dispatch() {
		const path = parseHash();
		if (path === currentPath) return;
		
		const route = ROUTES[path];
		
		// 사용자 레벨 검사
		if (!SNW.LevelUtil.atLeast(route.level)) {
			SNW.ToastUtil.warn(SNW.I18n.t('msg.accessDenied'));
			location.hash = '/dashboard';
			return;
		}
		
		// 이전 페이지 정리
		if (currentPage && typeof currentPage.unmount === 'function') {
			try { currentPage.unmount(); }
			catch (e) { SNW.LogUtil.error('[Router] unmount 실패', e); }
		}
		currentPage = null;
		currentPath = null;
		
		const main = _clearMain();
		_showLoading(main);
		
		// 페이지 클래스 결정
		const PageClass = (SNW.Page && SNW.Page[capitalize(route.page)]) || null;
		if (!PageClass) {
			SNW.LogUtil.warn(`[Router] 페이지 미정의: SNW.Page.${capitalize(route.page)}`);
			_showError(main, `Page not implemented: ${route.page}`);
			return;
		}
		
		try {
			currentPage = new PageClass(main);
			currentPath = path;
			await currentPage.mount();
			// 사이드바 활성 표시
			document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
				a.classList.toggle('is-active', a.getAttribute('data-route') === path);
			});
		} catch (e) {
			SNW.ErrorHandler.handle(e, `page.${route.page}`);
			_showError(main, SNW.I18n.t('msg.unknown'));
		}
	}
	
	// =====================================================
	// nav 메뉴 렌더링
	// =====================================================
	function renderNavMenu() {
		const nav = document.getElementById('nav-menu');
		if (!nav) return;
		nav.innerHTML = '';
		
		const items = [
			{ path: '/dashboard', labelKey: 'nav.dashboard', icon: '📊' },
			{ path: '/chart', labelKey: 'nav.chart', icon: '📈', minLevel: 'L2' },
			{ path: '/schedule', labelKey: 'nav.schedule', icon: '📅', minLevel: 'L2' },
			{ path: '/profiles', labelKey: 'nav.profiles', icon: '👤', minLevel: 'L2' },
			{ path: '/sensors', labelKey: 'nav.sensors', icon: '🌡', minLevel: 'L2' },
			{ path: '/settings', labelKey: 'nav.settings', icon: '⚙', minLevel: 'L3' },
			{ path: '/network', labelKey: 'nav.network', icon: '📶', minLevel: 'L3' },
			{ path: '/logs', labelKey: 'nav.logs', icon: '📜', minLevel: 'L3' },
			{ path: '/diagnostics', labelKey: 'nav.diagnostics', icon: '🔧', minLevel: 'L4' },
			{ path: '/firmware', labelKey: 'nav.firmware', icon: '💾', minLevel: 'L4' },
			{ path: '/ai', labelKey: 'nav.ai', icon: '🤖', minLevel: 'L4' },
			{ path: '/info', labelKey: 'nav.info', icon: 'ℹ' }
		];
		
		items.forEach(it => {
			if (it.minLevel && !SNW.LevelUtil.atLeast(it.minLevel)) return;
			const a = SNW.DomUtil.html`
                <a href="#${it.path}" data-route="${it.path}">
                    <span class="snw-nav-icon">${it.icon}</span>
                    <span>${SNW.I18n.t(it.labelKey)}</span>
                </a>`;
			nav.appendChild(a);
		});
	}
	
	// =====================================================
	// SNW.Router (public)
	// =====================================================
	SNW.Router = {
		ROUTES,
		
		init() {
			// hashchange 감지
			window.addEventListener('hashchange', dispatch);
			
			// 사이드바 토글
			const btnMenu = document.getElementById('btn-menu');
			const sidebar = document.getElementById('snw-sidebar');
			if (btnMenu && sidebar) {
				btnMenu.addEventListener('click', () => {
					sidebar.hidden = !sidebar.hidden;
				});
			}
			
			// nav 렌더링 + 언어 변경 시 재렌더
			renderNavMenu();
			document.addEventListener('snw:langchange', renderNavMenu);
			
			// 최초 디스패치
			dispatch();
		},
		
		navigate(path) { location.hash = path; },
		current() { return currentPath; }
	};
	
})(window.SNW);
