// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// Layer 5 — Layer 0~4 참조
//  - DOMContentLoaded 시 초기화 순서 실행
//  - 언어 토글, WS/Store 시작, 라우터 초기화
// =========================================================

window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    // [추가] 전역 팝업(모달) 컴포넌트
    SNW.UI = SNW.UI || {};
    SNW.UI.modal = function (title, contentEl, onConfirm) {
        let overlay = document.getElementById('snw-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'snw-modal-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = '';
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--snw-surface);border-radius:8px;padding:20px;min-width:300px;max-width:90%;';
        const h = document.createElement('h3');
        h.textContent = title;
        h.style.marginTop = '0';
        box.appendChild(h);
        box.appendChild(contentEl);
        
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px;';
        const btnCancel = document.createElement('button');
        btnCancel.className = 'snw-btn'; btnCancel.textContent = SNW.I18n.t('common.cancel');
        btnCancel.onclick = () => overlay.remove();
        const btnOk = document.createElement('button');
        btnOk.className = 'snw-btn snw-btn-primary'; btnOk.textContent = SNW.I18n.t('common.ok');
        btnOk.onclick = async () => {
            const ok = await onConfirm();
            if (ok !== false) overlay.remove();
        };
        actions.appendChild(btnCancel);
        actions.appendChild(btnOk);
        box.appendChild(actions);
        overlay.appendChild(box);
    };

    function _bindConnectionStatus() {
        const dot = document.getElementById('conn-status');
        const footerStat = document.getElementById('footer-status');
        if (!dot && !footerStat) return;
        const render = (conn) => {
            if (dot) { dot.className = 'snw-status-dot snw-status-dot--' + conn; dot.title = SNW.I18n.t('footer.' + conn); }
            if (footerStat) footerStat.textContent = SNW.I18n.t('footer.' + conn);
        };
        SNW.Store.watch('connection', render);
        render(SNW.Store.get().connection);
    }
    
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
    
    function _bindLangToggle() {
        const btn = document.getElementById('btn-lang');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const cur = SNW.I18n.getLang();
            SNW.I18n.setLang(cur === 'ko' ? 'en' : 'ko');
            SNW.I18n.applyTo(document);
        });
    }

    window.SNW_BOOT = async function() {
        if (window.SNW_BOOT_CALLED) return;
        window.SNW_BOOT_CALLED = true;
        
        try {
            if (window.SNW_OFFLINE && SNW.Offline && SNW.Offline.ready) {
                await SNW.Offline.ready;
            }
            
            SNW.I18n.applyTo(document);
            if (typeof SNW.LevelUtil !== 'undefined' && SNW.LevelUtil.applyTo) SNW.LevelUtil.applyTo(document.body);
            
            _bindConnectionStatus();
            _bindLastUpdate();
            SNW.WsManager.initByLevel();
            SNW.StoreBridge.start();
            _bindLangToggle();
            SNW.Router.init();
            SNW.LogUtil.info('App bootstrap complete');
        } catch (e) {
            SNW.LogUtil.error('bootstrap failed', e);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { window.SNW_BOOT(); });
    } else {
        window.SNW_BOOT();
    }
})(window.SNW);
