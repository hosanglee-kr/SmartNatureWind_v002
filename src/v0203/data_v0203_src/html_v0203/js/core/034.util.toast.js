// =========================================================
// 034.util.toast.js — ToastUtil, ErrorHandler, DebounceUtil
// Layer 1 (유틸) — SNW.C, SNW.CFG, SNW.LogUtil 참조
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // =====================================================
    // ToastUtil
    // =====================================================
    SNW.ToastUtil = {
        _host: null,

        _ensure() {
            if (SNW.ToastUtil._host) return SNW.ToastUtil._host;
            SNW.ToastUtil._host = document.getElementById('toast-host');
            if (!SNW.ToastUtil._host) {
                SNW.ToastUtil._host = document.createElement('div');
                SNW.ToastUtil._host.id = 'toast-host';
                SNW.ToastUtil._host.className = 'snw-toast-host';
                document.body.appendChild(SNW.ToastUtil._host);
            }
            return SNW.ToastUtil._host;
        },

        show(msg, type = 'info', ms = null) {
            const host = SNW.ToastUtil._ensure();
            const duration = ms ?? (SNW.CFG?.UI?.TOAST_DEFAULT_MS ?? 3000);

            const t = document.createElement('div');
            t.className = `snw-toast snw-toast--${type}`;
            t.textContent = String(msg);
            host.appendChild(t);

            setTimeout(() => t.classList.add('snw-toast--out'), Math.max(0, duration - 300));
            setTimeout(() => t.remove(), duration);
        },

        success(m, t = SNW.CFG.UI.TOAST_SUCCESS_MS) { SNW.ToastUtil.show(m, 'success', t); },
        warn(m, t = SNW.CFG.UI.TOAST_DEFAULT_MS) { SNW.ToastUtil.show(m, 'warn', t); },
        error(m, t = SNW.CFG.UI.TOAST_ERROR_MS) { SNW.ToastUtil.show(m, 'error', t); },
        info(m, t = SNW.CFG.UI.TOAST_DEFAULT_MS) { SNW.ToastUtil.show(m, 'info', t); }
    };

    // =====================================================
    // DebounceUtil (슬라이더/검색 공용)
    // =====================================================
    SNW.DebounceUtil = {
        debounce(fn, waitMs) {
            let timer = null;
            return function (...args) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    timer = null;
                    fn.apply(this, args);
                }, waitMs);
            };
        },
        throttle(fn, maxWaitMs) {
            let last = 0, timer = null;
            return function (...args) {
                const now = Date.now();
                const remain = maxWaitMs - (now - last);
                if (remain <= 0) {
                    last = now;
                    fn.apply(this, args);
                } else if (!timer) {
                    timer = setTimeout(() => {
                        last = Date.now();
                        timer = null;
                        fn.apply(this, args);
                    }, remain);
                }
            };
        }
    };

    // =====================================================
    // ErrorHandler (표준 에러 처리)
    // =====================================================
    SNW.ErrorHandler = {
        handle(err, context = 'unknown') {
            SNW.LogUtil.error(`[${context}]`, err);

            if (!err) {
                SNW.ToastUtil.error(SNW.I18n.t('msg.unknown'));
                return;
            }

            // ApiError 판정 (SNW.Api.ApiError)
            if (typeof err.status === 'number') {
                switch (err.status) {
                    case 0:
                        SNW.ToastUtil.error(SNW.I18n.t('msg.networkError'));
                        break;
                    case SNW.C.HTTP.UNAUTHORIZED:
                        SNW.ToastUtil.error(SNW.I18n.t('msg.apiKeyRequired'));
                        break;
                    case SNW.C.HTTP.CONFLICT:
                        SNW.ToastUtil.warn(SNW.I18n.t('msg.reloadPending'));
                        break;
                    case SNW.C.HTTP.TIMEOUT:
                        SNW.ToastUtil.warn(SNW.I18n.t('msg.timeout'));
                        break;
                    case SNW.C.HTTP.SERVER_ERROR:
                        SNW.ToastUtil.error(SNW.I18n.t('msg.unknown') + ': ' + (err.message || '500'));
                        break;
                    default:
                        SNW.ToastUtil.error(err.message || SNW.I18n.t('msg.unknown'));
                }
                return;
            }

            // 네트워크 오류 (fetch 실패)
            if (err.name === 'TypeError' || err.message === 'network') {
                SNW.ToastUtil.error(SNW.I18n.t('msg.networkError'));
                return;
            }

            SNW.ToastUtil.error(err.message || SNW.I18n.t('msg.unknown'));
        },

        /** async 함수 래퍼 */
        wrap(fn, context = 'unknown') {
            return async (...args) => {
                try { return await fn(...args); }
                catch (e) { this.handle(e, context); throw e; }
            };
        }
    };

})(window.SNW);
