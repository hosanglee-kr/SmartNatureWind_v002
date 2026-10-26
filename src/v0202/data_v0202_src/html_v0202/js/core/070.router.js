// =========================================================
// 070.router.js — SNW.Router (해시 기반 SPA 라우터)
// Layer 2 (서비스) — Layer 0~1 참조
//  - ROUTES 정의 (12 페이지)
//  - hashchange 감지 → dispatch
//  - 이전 페이지 unmount → 새 페이지 mount
//  - 사용자 레벨 필터
// =========================================================
/* ---- 070.router.js ---- */
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
    
    let currentPage = null;
    let currentPath = null;
    let _dispatching = false;   // [C-5] 재진입 가드
    
    // 페이지명 → 클래스명 매핑 (특수 케이스 처리)
    function capitalize(s) {
        // 특수 케이스: 'ai'는 모두 대문자 'AI'
        if (s === 'ai') return 'AI';
        // 특수 케이스: 'windprofile'은 첫 글자만 대문자
        if (s === 'windprofile') return 'Windprofile';
        // 기본: 첫 글자만 대문자
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function parseHash() { const raw = location.hash.replace(/^#/, '') || '/dashboard'; return ROUTES[raw] ? raw : '/dashboard'; }
    function _clearMain() { const main = document.getElementById('snw-main'); if (!main) return null; main.innerHTML = ''; return main; }
    function _showLoading(main) { if (!main) return; main.appendChild(SNW.DomUtil.html`<div class="snw-loading">Loading...</div>`); }
    function _showError(main, msg) { if (!main) return; main.innerHTML = ''; main.appendChild(SNW.DomUtil.html`<div class="snw-error">${msg}</div>`); }

    function _closeSidebarOnMobile() {
        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('snw-sidebar');
            if (sidebar) sidebar.hidden = true;
        }
    }

    async function dispatch() {
        // [C-5] 이전 dispatch가 mount() await 중이면 재진입 차단
        //  - 이전: 빠른 페이지 전환 시 unmount()가 정리 못하는 고아 watcher/timer 잔존
        //  - 이후: 직렬화 + 종료 후 해시 재확인
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
            if (currentPage && typeof currentPage.unmount === 'function') { try { currentPage.unmount(); } catch {} }
            currentPage = null; currentPath = null;
            const main = _clearMain();
            _showLoading(main);
            const PageClass = (SNW.Page && SNW.Page[capitalize(route.page)]) || null;
            if (!PageClass) { _showError(main, `Page not implemented: ${route.page}`); return; }
    
            currentPage = new PageClass(main);
            currentPath = path;
            await currentPage.mount();
            document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
                a.classList.toggle('is-active', a.getAttribute('data-route') === path);
            });
        } catch (e) {
            SNW.ErrorHandler.handle(e, `page.${ROUTES[parseHash()]?.page || 'unknown'}`);
            _showError(document.getElementById('snw-main'), SNW.I18n.t('msg.unknown'));
        } finally {
            _dispatching = false;
            // [C-5] await 중 해시가 바뀌었으면 재디스패치
            if (parseHash() !== currentPath) setTimeout(dispatch, 0);
        }
    }
    
    function renderNavMenu() {
        const nav = document.getElementById('nav-menu');
        if (!nav) return;
        nav.innerHTML = '';
        
        const items = [
            { path:'/dashboard',   key:'nav.dashboard',   label:'대시보드',   icon:'📊' },
            { path:'/chart',       key:'nav.chart',       label:'실시간 차트', icon:'📈', minLevel:'L2' },
            { path:'/schedule',    key:'nav.schedule',    label:'스케줄',     icon:'📅', minLevel:'L2' },
            { path:'/profiles',    key:'nav.profiles',    label:'프로필',     icon:'👤', minLevel:'L2' },
            { path:'/sensors',     key:'nav.sensors',     label:'센서',       icon:'🌡', minLevel:'L2' },
            { path:'/simulation',  key:'nav.simulation',  label:'시뮬레이션', icon:'🌊', minLevel:'L2' },
            { path:'/windprofile', key:'nav.windprofile', label:'바람 프리셋', icon:'🌬', minLevel:'L3' },
            { path:'/settings',    key:'nav.settings',    label:'설정',       icon:'⚙',  minLevel:'L3' },
            { path:'/network',     key:'nav.network',     label:'네트워크',   icon:'📶', minLevel:'L3' },
            { path:'/logs',        key:'nav.logs',        label:'로그',       icon:'📜', minLevel:'L3' },
            { path:'/diagnostics', key:'nav.diagnostics', label:'진단',       icon:'🔧', minLevel:'L4' },
            { path:'/firmware',    key:'nav.firmware',    label:'펌웨어',     icon:'💾', minLevel:'L4' },
            { path:'/ai',          key:'nav.ai',          label:'AI',         icon:'🤖', minLevel:'L4' },
            { path:'/info',        key:'nav.info',        label:'정보',       icon:'ℹ' }
        ];
        
        items.forEach(it => {
            if (it.minLevel && !SNW.LevelUtil.atLeast(it.minLevel)) return;
            const label = SNW.I18n ? SNW.I18n.t(it.key) : it.label;
            const a = SNW.DomUtil.html`<a href="#${it.path}" data-route="${it.path}"><span class="snw-nav-icon">${it.icon}</span><span data-i18n="${it.key}">${label}</span></a>`;
            a.addEventListener('click', _closeSidebarOnMobile);
            nav.appendChild(a);
        });
    }

    SNW.Router = {
        ROUTES,
        init() {
            window.addEventListener('hashchange', dispatch);
            document.addEventListener('snw:langchange', renderNavMenu);
            const btnMenu = document.getElementById('btn-menu');
            const sidebar = document.getElementById('snw-sidebar');
            if (btnMenu && sidebar) {
                btnMenu.addEventListener('click', () => { sidebar.hidden = !sidebar.hidden; });
                const main = document.getElementById('snw-main');
                if (main) main.addEventListener('click', () => { if (!sidebar.hidden && window.innerWidth < 1024) sidebar.hidden = true; });
            }
            renderNavMenu();
            dispatch();
        },
        navigate(path){ location.hash = path; },
        current(){ return currentPath; }
    };
})(window.SNW);
