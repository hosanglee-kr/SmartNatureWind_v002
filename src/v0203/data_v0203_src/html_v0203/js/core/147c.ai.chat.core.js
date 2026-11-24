// =========================================================
// 147c.ai.chat.core.js — AI 대화 공용 코어 (REST/Live)
// Layer 3 (AI 공용 로직)
// - 290.page.ai.js (풀스크린 L2)와 999b.ai-sheet.js (FAB)가 공유
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    const MAX_MSG_LEN = 4000;

    class AIChatCore {
        constructor(opts = {}) {
            this._history = [];
            this._mode = opts.mode || 'rest';  // 'rest' | 'live'
            this._isLiveConnected = false;
            this._isListening = false;
            this._liveCostStatus = null;
            
            // UI 콜백
            this._onStateChange = opts.onStateChange || (() => {});
            this._onMessage     = opts.onMessage     || (() => {});
            this._onToolCall    = opts.onToolCall    || (() => {});
            this._onCostUpdate  = opts.onCostUpdate  || (() => {});
            this._onError       = opts.onError       || (() => {});
            
            // 저장된 이력 로드
            if (SNW.AIClient && typeof SNW.AIClient.loadHistory === 'function') {
                this._history = SNW.AIClient.loadHistory() || [];
            }
        }

        getHistory() {
            return this._history;
        }

        async send(text, opts = {}) {
            const msg = (text || '').trim();
            if (!msg) return null;
            if (msg.length > MAX_MSG_LEN) {
                const err = new Error(`Message exceeds maximum length (${MAX_MSG_LEN})`);
                this._onError(err);
                throw err;
            }

            const userEntry = {
                role: 'user',
                text: msg,
                timestamp: Date.now()
            };
            this._history.push(userEntry);
            this._onMessage(userEntry);

            try {
                this._onStateChange({ busy: true });
                let replyText = '(응답 없음)';
                let toolCalls = [];
                
                // [147c.ai.chat.core.js] AIChatCore.send() 내부 API 호출 교체 (라인 56~62 부근)
                if (SNW.AIClient && typeof SNW.AIClient.send === 'function') {
                    const res = await SNW.AIClient.send(msg, this._history.slice(0, -1), {
                        lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
                        voiceMode: this._mode === 'live'
                    });
                    if (res && res.text) replyText = res.text;
                    if (res && res.actions) toolCalls = res.actions;
                } else {
                    replyText = 'AI 클라이언트를 초기화할 수 없습니다.';
                }

                const modelEntry = {
                    role: 'model',
                    text: replyText,
                    timestamp: Date.now(),
                    toolCalls: toolCalls
                };
                this._history.push(modelEntry);
                this._onMessage(modelEntry);

                if (SNW.AIClient && typeof SNW.AIClient.saveHistory === 'function') {
                    SNW.AIClient.saveHistory(this._history);
                }
                return modelEntry;
            } catch (err) {
                this._onError(err);
                throw err;
            } finally {
                this._onStateChange({ busy: false });
            }
        }

        clearHistory() {
            this._history = [];
            if (SNW.AIClient && typeof SNW.AIClient.clearHistory === 'function') {
                SNW.AIClient.clearHistory();
            }
            this._onStateChange({ cleared: true });
        }
    }

    SNW.AIChatCore = AIChatCore;
})(window.SNW);
