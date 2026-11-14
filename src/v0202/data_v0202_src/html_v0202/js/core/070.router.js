// =========================================================
// 070.router.js — SNW.Router (해시 SPA 라우터)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    
    const ROUTES = {
        '/dashboard':   { page:'dashboard',   level:'L1' },
        '/chart':       { page:'chart',       level:'L2' },
        '/schedule':    { page:'schedule',    level:'L2' },
        '/profiles':    { page:'profiles',    level:'L2' },
        '/sensors':     { page:'sensors',     level:'L2' },
        '/simulation':  { page:'simulation',  level:'L2' },
        '/windprofile': { page:'windprofile', level:'L3' },
        '/settings':    { page:'settings',    level:'L3' },
        '/network':     { page:'network',     level:'L3' },
        '/logs':        { page:'logs',        level:'L3' },
        '/diagnostics': { page:'diagnostics', level:'L4' },
        '/firmware':    { page:'firmware',    level:'L4' },
        '/ai':          { page:'ai',          level:'L4' },
        '/info':        { page:'info',        level:'L1' }
    };
    
    const NAV_GROUPS = [
        {
            key: 'nav.groupControl',
            items: [
                { path:'/dashboard',   key:'nav.dashboard',   icon:'📊', minLevel:'L1' },
                { path:'/chart',       key:'nav.chart',       icon:'📈', minLevel:'L2' },
                { path:'/schedule',    key:'nav.schedule',    icon:'📅', minLevel:'L2' },
                { path:'/profiles',    key:'nav.profiles',    icon:'👤', minLevel:'L2' },
                { path:'/sensors',     key:'nav.sensors',     icon:'🌡', minLevel:'L2' }
            ]
        },
        {
            key: 'nav.groupSettings',
            items: [
                { path:'/simulation',  key:'nav.simulation',  icon:'🌊', minLevel:'L2' },
                { path:'/windprofile', key:'nav.windprofile', icon:'🌬', minLevel:'L3' },
                { path:'/settings',    key:'nav.settings',    icon:'⚙',  minLevel:'L3' },
                { path:'/network',     key:'nav.network',     icon:'📶', minLevel:'L3' }
            ]
        },
        {
            key: 'nav.groupSystem',
            items: [
                { path:'/logs',        key:'nav.logs',        icon:'📜', minLevel:'L3' },
                { path:'/diagnostics', key:'nav.diagnostics', icon:'🔧', minLevel:'L4' },
                { path:'/firmware',    key:'nav.firmware',    icon:'💾', minLevel:'L4' },
                { path:'/ai',          key:'nav.ai',          icon:'🤖', minLevel:'L4' },
                { path:'/info',        key:'nav.info',        icon:'ℹ',  minLevel:'L1' }
            ]
        }
    ];
    
    let currentPage = null;
    let currentPath = null;
    let _dispatching = false;
    
    function capitalize(s) {
        if (s === 'ai') return 'AI';
        if (s === 'windprofile') return 'Windprofile';
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
        main.appendChild(SNW.DomUtil.html`<div class="snw-loading">${SNW.I18n.t('common.loading')}</div>`);
    }
    function _showError(main, msg) {
        if (!main) return;
        main.innerHTML = '';
        main.appendChild(SNW.DomUtil.html`<div class="snw-error">${msg}</div>`);
    }

    // 페이지 이동 시 사이드바 닫기 (오직 클래스만 제거)
    function _closeSidebarOnMobile() {
        document.body.classList.remove('snw-sidebar-open');
    }

    async function dispatch() {
        if (_dispatching) return;

        const path = parseHash();
        if (path === currentPath) return;

        _dispatching = true;
        try {
            _closeSidebarOnMobile();

            const route = ROUTES[path];
            if (!SNW.LevelUtil.atLeast(route.level)) {
                SNW.ToastUtil.warn(SNW.I18n.t('msg.accessDenied'));
                location.hash = '/dashboard';
                return;
            }
            
            if (currentPage && typeof currentPage.unmount === 'function') {
                try {
                    const canLeave = currentPage.unmount();
                    if (canLeave === false) {
                        location.hash = currentPath;
                        return;
                    }
                } catch (e) {
                    SNW.LogUtil.error('[router] unmount failed', e);
                }
            }
            
            if (SNW.Banner) SNW.Banner.hide();
            
            currentPage = null;
            currentPath = null;
            const main = _clearMain();
            _showLoading(main);
            
            const PageClass = (SNW.Page && SNW.Page[capitalize(route.page)]) || null;
            if (!PageClass) {
                _showError(main, `Page not implemented: ${route.page}`);
                return;
            }

            currentPage = new PageClass(main);
            currentPath = path;
            await currentPage.mount();
            
            document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
                a.classList.toggle('is-active', a.getAttribute('data-route') === path);
            });
            
            // 하단 탭 바 active 동기화 추가
            document.querySelectorAll('.snw-bottom-nav__item').forEach(a => {
                a.classList.toggle('is-active', a.getAttribute('data-route') === path);
            });

        } catch (e) {
            SNW.ErrorHandler.handle(e, `page.${ROUTES[parseHash()]?.page || 'unknown'}`);
            _showError(document.getElementById('snw-main'), SNW.I18n.t('msg.unknown'));
        } finally {
            _dispatching = false;
            if (parseHash() !== currentPath) setTimeout(dispatch, 0);
        }
    }
    
    function renderNavMenu() {
        const nav = document.getElementById('nav-menu');
        if (!nav) return;
        nav.innerHTML = '';
        
        NAV_GROUPS.forEach(group => {
            const visibleItems = group.items.filter(it => SNW.LevelUtil.atLeast(it.minLevel));
            if (visibleItems.length === 0) return;
            
            const section = document.createElement('div');
            section.className = 'snw-nav-group';
            
            const header = document.createElement('div');
            header.className = 'snw-nav-group__title';
            header.textContent = SNW.I18n.t(group.key);
            section.appendChild(header);
            
            visibleItems.forEach(it => {
                const label = SNW.I18n.t(it.key);
                const a = SNW.DomUtil.html`
                    <a href="#${it.path}" data-route="${it.path}">
                        <span class="snw-nav-icon">${it.icon}</span>
                        <span data-i18n="${it.key}">${label}</span>
                    </a>`;
                a.addEventListener('click', _closeSidebarOnMobile);
                section.appendChild(a);
            });
            
            nav.appendChild(section);
        });
    }

    SNW.Router = {
        ROUTES,
        init() {
            window.addEventListener('hashchange', dispatch);
            document.addEventListener('snw:langchange', renderNavMenu);
            
            // ⚠️ 사이드바 제어는 999.app.js에서 전담
            // 라우터에서는 절대 건드리지 않음
            
            renderNavMenu();
            dispatch();
        },
        navigate(path) { location.hash = path; },
        current() { return currentPath; }
    };
})(window.SNW);
