// =========================================================
// core/070.router.js — Fresh Start 라우터
// Layer 2 (Service) — Alias/리다이렉트 완전 배제
// 화이트리스트 외 → /home 렌더링 (URL 유지, location.hash 재대입 없음)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // [Phase 1] Fresh Start — 이전 URL 완전 폐기
    //  - ROUTES 화이트리스트 외 모든 해시 → '/home' fallback
    //  - location.hash 재대입 최소화 (접근 거부만 예외)
    //  - 뒤로가기 히스토리 오염 0
    // ═══════════════════════════════════════════════════════════
    const ROUTES = {
        // ─── L1 일상 (홈 3탭) ───
        '/home':                    { page: 'Dashboard', params: { tab: 'control' }, level: 'L1' },
        '/home/control':            { page: 'Dashboard', params: { tab: 'control' }, level: 'L1' },
        '/home/env':                { page: 'Dashboard', params: { tab: 'env' },     level: 'L1' },
        '/home/preset':             { page: 'Dashboard', params: { tab: 'preset' },  level: 'L1' },

        // ─── L2 바람 만들기 (4탭) ───
        '/wind':                    { page: 'Automation', params: { tab: 'studio' },     level: 'L2' },
        '/wind/studio':             { page: 'Automation', params: { tab: 'studio' },     level: 'L2' },
        '/wind/simulation':         { page: 'Automation', params: { tab: 'simulation' }, level: 'L2' },
        '/wind/playlist':           { page: 'Automation', params: { tab: 'playlist' },   level: 'L2' },
        '/wind/presets':            { page: 'Windprofile', level: 'L3' },

        // ─── L2 자동화 (3탭) ───
        '/automation':              { page: 'Automation', params: { tab: 'schedule' }, level: 'L2' },
        '/automation/schedule':     { page: 'Automation', params: { tab: 'schedule' }, level: 'L2' },
        '/automation/timer':        { page: 'Automation', params: { tab: 'timer' },    level: 'L2' },
        '/automation/rules':        { page: 'Automation', params: { tab: 'rules' },    level: 'L2' },

        // ─── L2 AI ───
        '/ai':                      { page: 'AI', level: 'L2' },

        // ─── L2 모니터 (4탭) ───
        '/monitor':                 { page: 'Monitor', level: 'L2' },
        '/monitor/chart':           { page: 'Chart',   level: 'L2' },
        '/monitor/sensors':         { page: 'Sensors', level: 'L2' },
        '/monitor/history':         { page: 'Monitor', level: 'L2' },
        '/monitor/logs':            { page: 'Logs',    level: 'L3' },

        // ─── L3 설정 (5탭) ───
        '/settings':                { page: 'Settings',    params: { tab: 'general' },  level: 'L2' },
        '/settings/general':        { page: 'Settings',    params: { tab: 'general' },  level: 'L2' },
        '/settings/network':        { page: 'Network',     params: { tab: 'network' },  level: 'L3' },
        '/settings/hardware':       { page: 'Settings',    params: { tab: 'hardware' }, level: 'L2' },
        '/settings/firmware':       { page: 'Firmware',                                 level: 'L4' },
        '/settings/diagnostics':    { page: 'Diagnostics',                              level: 'L4' },
    };

    // ─── 사이드바 그룹 (3개 최상위 그룹) ───
    const NAV_GROUPS = [
        {
            key: 'nav.groupDaily',
            items: [
                { path: '/home', key: 'nav.home', icon: '🏠', minLevel: 'L1' },
            ]
        },
        {
            key: 'nav.groupControl',
            items: [
                { path: '/wind',       key: 'nav.wind',       icon: '🌬️', minLevel: 'L2' },
                { path: '/automation', key: 'nav.automation', icon: '⚙️', minLevel: 'L2' },
                { path: '/ai',         key: 'nav.ai',         icon: '✨', minLevel: 'L2' },
                { path: '/monitor',    key: 'nav.monitor',    icon: '📊', minLevel: 'L2' },
            ]
        },
        {
            key: 'nav.groupSystem',
            items: [
                { path: '/settings', key: 'nav.settings', icon: '🔧', minLevel: 'L2' },
            ]
        },
    ];

    let currentPage = null;
    let currentPath = null;
    let _dispatching = false;

    function capitalize(s) {
        if (s === 'ai') return 'AI';
        if (s === 'windprofile') return 'Windprofile';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // ═══════════════════════════════════════════════════════════
    // Fresh Start: 화이트리스트 외 → '/home' (URL 유지)
    // ═══════════════════════════════════════════════════════════
    function parseHash() {
        const raw = location.hash.replace(/^#/, '').split('?')[0] || '/home';
        return ROUTES[raw] ? raw : '/home';
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

    function _closeSidebarOnMobile() {
        if (window.innerWidth < 1024) {
            document.body.classList.remove('snw-sidebar-open');
        }
    }

    async function dispatch() {
        if (_dispatching) return;

        const path = parseHash();
        const originalHash = location.hash.replace(/^#/, '').split('?')[0] || '/home';

        if (originalHash === currentPath) return;

        _dispatching = true;
        try {
            _closeSidebarOnMobile();

            const route = ROUTES[path];
            if (!SNW.LevelUtil.atLeast(route.level)) {
                SNW.ToastUtil.warn(SNW.I18n.t('msg.accessDenied'));
                // 접근 거부만 예외적으로 리다이렉트
                location.hash = '/home';
                return;
            }

            if (currentPage && typeof currentPage.unmount === 'function') {
                try {
                    const canLeave = currentPage.unmount();
                    if (canLeave === false) return;
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

            const params = Object.assign({}, route.params || {});
            const qIdx = location.hash.indexOf('?');
            if (qIdx >= 0) {
                const qs = new URLSearchParams(location.hash.slice(qIdx + 1));
                for (const [k, v] of qs.entries()) params[k] = v;
            }

            currentPage = new PageClass(main, params);
            currentPath = originalHash;   // ★ 원본 해시 기준 (Fresh Start)
            await currentPage.mount();

            // 사이드바 active 동기화
            document.querySelectorAll('#nav-menu a[data-route]').forEach(a => {
                const ar = a.getAttribute('data-route');
                a.classList.toggle('is-active', path.startsWith(ar));
            });
            // 하단 탭 active 동기화
            document.querySelectorAll('.snw-bottom-nav__item').forEach(a => {
                const ar = a.getAttribute('data-route');
                a.classList.toggle('is-active', path.startsWith(ar));
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
            renderNavMenu();
            dispatch();
        },
        navigate(path) { location.hash = path; },
        current() { return currentPath; }
    };
})(window.SNW);
