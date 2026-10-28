// =========================================================
// 999.app.js — 부트스트랩 (최종 로드)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    // [P0-5] 모달
    SNW.UI = SNW.UI || {};
    SNW.UI.modal = function (title, contentEl, onConfirm, onCancel, opts) {
        opts = opts || {};
        let overlay = document.getElementById('snw-modal-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'snw-modal-overlay';
            overlay.className = 'snw-modal-overlay';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = '';
        overlay.style.display = 'flex';
        overlay.classList.remove('is-open');
        
        const box = document.createElement('div');
        box.className = 'snw-modal-box';
        if (opts.width) box.style.maxWidth = opts.width;
        
        const h = document.createElement('h3');
        h.className = 'snw-modal-title';
        h.textContent = title;
        box.appendChild(h);
        
        const body = document.createElement('div');
        body.className = 'snw-modal-body';
        if (contentEl) body.appendChild(contentEl);
        box.appendChild(body);
        
        let closed = false;
        const close = (confirmed) => {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', _onEsc);
            overlay.classList.remove('is-open');
            setTimeout(() => {
                overlay.innerHTML = '';
                overlay.style.display = 'none';
                if (!confirmed && typeof onCancel === 'function') {
                    try { onCancel(); } catch (e) {}
                }
            }, 150);
        };
        
        const _onEsc = (e) => { if (e.key === 'Escape') close(false); };
        document.addEventListener('keydown', _onEsc);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
        
        const actions = document.createElement('div');
        actions.className = 'snw-modal-actions';
        
        if (!opts.hideCancel) {
            const btnCancel = document.createElement('button');
            btnCancel.className = 'snw-btn';
            btnCancel.textContent = opts.cancelLabel || SNW.I18n.t('common.cancel');
            btnCancel.onclick = () => close(false);
            actions.appendChild(btnCancel);
        }
        
        if (!opts.hideOk) {
            const btnOk = document.createElement('button');
            btnOk.className = 'snw-btn snw-btn-primary';
            btnOk.textContent = opts.okLabel || SNW.I18n.t('common.ok');
            btnOk.onclick = async () => {
                if (typeof onConfirm !== 'function') { close(true); return; }
                btnOk.disabled = true;
                try {
                    const ok = await onConfirm();
                    if (ok !== false) close(true);
                } catch (e) {} finally { btnOk.disabled = false; }
            };
            actions.appendChild(btnOk);
        }
        box.appendChild(actions);
        overlay.appendChild(box);
        requestAnimationFrame(() => overlay.classList.add('is-open'));
        return { close: () => close(false) };
    };

    // [O-1/O-5/O-17] 배너
    SNW.Banner = {
        _current: null,
        show(config) {
            this.hide();
            const host = document.getElementById('snw-main');
            if (!host) return;
            const banner = document.createElement('div');
            banner.className = `snw-banner snw-banner--${config.level || 'info'}`;
            banner.dataset.bannerId = config.id || '';
            const text = document.createElement('span');
            text.className = 'snw-banner__text';
            text.textContent = config.text;
            banner.appendChild(text);
            (config.actions || []).forEach(act => {
                const btn = document.createElement('button');
                btn.className = 'snw-btn snw-btn--sm';
                btn.textContent = act.label;
                btn.onclick = act.onClick;
                banner.appendChild(btn);
            });
            host.insertBefore(banner, host.firstChild);
            this._current = banner;
        },
        hide() { if (this._current) { this._current.remove(); this._current = null; } },
        update(id, config) {
            if (this._current && this._current.dataset.bannerId === id) {
                const t = this._current.querySelector('.snw-banner__text');
                if (t && config.text) t.textContent = config.text;
            } else { this.show(config); }
        }
    };

    // [O-10] 업로드 매니저
    SNW.UploadManager = {
        _tasks: {},
        start(taskId, kind, file, onProgress) {
            if (this._tasks[taskId]) return Promise.reject(new Error('Already in progress'));
            const task = { id: taskId, kind, filename: file.name, progress: 0, status: 'uploading' };
            this._tasks[taskId] = task;
            this._renderHeaderIndicator();
            const apiMethod = kind === 'firmware' ? 'uploadFirmware' : 'uploadFile';
            const promise = SNW.Api[apiMethod](file, (pct) => {
                task.progress = pct;
                if (onProgress) onProgress(pct);
                this._renderHeaderIndicator();
            }).then(res => {
                task.status = 'done';
                SNW.ToastUtil.success(kind === 'firmware' ? SNW.I18n.t('firmware.otaSuccess') : SNW.I18n.t('msg.saveSuccess'));
                setTimeout(() => this._remove(taskId), 3000);
                return res;
            }).catch(err => {
                task.status = 'error';
                SNW.ErrorHandler.handle(err, `upload.${kind}`);
                setTimeout(() => this._remove(taskId), 5000);
                throw err;
            });
            task.promise = promise;
            return promise;
        },
        isUploading() { return Object.values(this._tasks).some(t => t.status === 'uploading'); },
        _remove(taskId) { delete this._tasks[taskId]; this._renderHeaderIndicator(); },
        _renderHeaderIndicator() {
            const tasks = Object.values(this._tasks).filter(t => t.status === 'uploading');
            let indicator = document.getElementById('upload-indicator');
            if (tasks.length === 0) { if (indicator) indicator.remove(); return; }
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'upload-indicator';
                indicator.className = 'snw-upload-indicator';
                document.body.appendChild(indicator);
            }
            const task = tasks[0];
            indicator.innerHTML = `
                <div class="snw-upload-indicator__label">
                    ${SNW.DomUtil ? SNW.DomUtil.escape(task.filename) : task.filename} (${Math.round(task.progress * 100)}%)
                </div>
                <div class="snw-upload-indicator__bar"><div style="width:${task.progress * 100}%"></div></div>
            `;
        }
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
        btn.onclick = () => {
            const cur = SNW.I18n.getLang();
            SNW.I18n.setLang(cur === 'ko' ? 'en' : 'ko');
            SNW.I18n.applyTo(document);
        };
    }

    // =========================================================
    // [최종] 사이드바 완벽 제어
    //  - hidden 속성 사용 안 함 (CSS !important 충돌 방지)
    //  - 인라인 스타일 강제 초기화
    //  - ESC / 외부 클릭 / 오버레이 클릭 모두 지원
    // =========================================================
    function _bindSidebarToggle() {
        const btn = document.getElementById('btn-menu');
        const sidebar = document.getElementById('snw-sidebar');
        const overlay = document.getElementById('snw-sidebar-overlay');
        if (!btn || !sidebar) return;

        // ★ 인라인 스타일 강제 초기화 (P010 번들의 hidden/display 간섭 무력화)
        sidebar.removeAttribute('hidden');
        sidebar.style.display = '';

        // 1. ☰ 버튼 토글
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebar.style.display = '';   // 인라인 스타일 재차 초기화
            document.body.classList.toggle('snw-sidebar-open');
        };

        // 2. 오버레이 클릭/터치 닫기
        if (overlay) {
            const closeOverlay = (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.body.classList.remove('snw-sidebar-open');
            };
            overlay.onclick = closeOverlay;
            overlay.ontouchstart = closeOverlay;
        }

        // 3. 사이드바 내부 링크 클릭 시 닫기
        sidebar.onclick = (e) => {
            if (e.target.closest('a')) {
                document.body.classList.remove('snw-sidebar-open');
            }
        };

        // 4. 외부 영역 클릭 시 닫기 (데스크톱 + 오버레이 안 보이는 환경 보완)
        document.addEventListener('click', (e) => {
            if (!document.body.classList.contains('snw-sidebar-open')) return;
            if (sidebar.contains(e.target)) return;
            if (btn.contains(e.target)) return;
            document.body.classList.remove('snw-sidebar-open');
        });

        // 5. ESC 키 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('snw-sidebar-open')) {
                document.body.classList.remove('snw-sidebar-open');
            }
        });
    }

    window.SNW_BOOT = async function() {
        if (window.SNW_BOOT_CALLED) return;
        window.SNW_BOOT_CALLED = true;
        
        try {
            if (window.SNW_OFFLINE) {
                let waitCount = 0;
                while ((!SNW.Offline || !SNW.Offline.ready) && waitCount < 60) {
                    await new Promise(r => setTimeout(r, 50));
                    waitCount++;
                }
                if (SNW.Offline) {
                    if (SNW.Offline.ready) await SNW.Offline.ready;
                    if (typeof SNW.Offline.ensureApi === 'function') SNW.Offline.ensureApi();
                    if (typeof SNW.Offline.stubWs === 'function') SNW.Offline.stubWs();
                }
                if (typeof SNW.LevelUtil !== 'undefined') {
                    SNW.LevelUtil.current = () => 'L4';
                    SNW.LevelUtil.atLeast = () => true;
                }
            }
            
            SNW.I18n.applyTo(document);
            if (typeof SNW.LevelUtil !== 'undefined' && SNW.LevelUtil.applyTo) {
                SNW.LevelUtil.applyTo(document.body);
            }
            
            _bindConnectionStatus();
            _bindLastUpdate();
            _bindSidebarToggle(); 
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
