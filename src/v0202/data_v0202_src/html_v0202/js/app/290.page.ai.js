// =========================================================
// 290.page.ai.js — SNW.Page.AI
// Layer 4 (페이지 로직)
// [P1-14] 예시 텍스트 i18n 이관
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	const MAX_MSG_LEN = 4000;
	
	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = [];
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);
			
			const slot = this.el.querySelector('[data-slot="chat"]');
			const examplePlaceholder = SNW.I18n.t('ai.placeholder');
			
			slot.innerHTML = `
                <div class="snw-ai-chat">
                    <div class="snw-ai-messages" data-slot="messages"></div>
                    <div class="snw-ai-examples" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                        <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example1')}">${SNW.I18n.t('ai.example1')}</button>
                        <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example2')}">${SNW.I18n.t('ai.example2')}</button>
                        <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example3')}">${SNW.I18n.t('ai.example3')}</button>
                    </div>
                    <div class="snw-ai-input">
                        <textarea data-slot="input" rows="3"
                                  placeholder="${SNW.DomUtil.escape(examplePlaceholder)}"
                                  maxlength="${MAX_MSG_LEN}"></textarea>
                        <button type="button" class="snw-btn snw-btn-primary" data-action="send">
                            ${SNW.I18n.t('ai.send')}
                        </button>
                    </div>
                </div>`;
			
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
			
			// [P1-14] 예시 버튼 클릭 → textarea에 채움
			SNW.DomUtil.delegate(this.el, '[data-example]', 'click', (e, btn) => {
				const inp = this.el.querySelector('[data-slot="input"]');
				if (inp) {
					inp.value = btn.getAttribute('data-example');
					inp.focus();
				}
			});
			
			const inp = this.el.querySelector('[data-slot="input"]');
			if (inp) {
				inp.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						this._onSend();
					}
				});
			}
			
			SNW.LogUtil.info('[AI] mount 완료');
		}
		
		unmount() { this._active = false; }
		
		async _onSend() {
			const inp = this.el.querySelector('[data-slot="input"]');
			const msg = (inp && inp.value || '').trim();
			if (!msg) return;
			inp.value = '';
			
			this._appendMessage('user', msg);
			this._appendMessage('assistant', SNW.I18n.t('ai.thinking'));
			
			try {
				const body = {
					contents: [{ parts: [{ text: msg }] }]
				};
				const res = await SNW.Api.gemini(body);
				if (!this._active) return;
				
				let text = '';
				try {
					const candidates = res && res.candidates;
					if (candidates && candidates[0] && candidates[0].content &&
						candidates[0].content.parts && candidates[0].content.parts[0]) {
						text = candidates[0].content.parts[0].text || '';
					} else if (typeof res === 'string') {
						text = res;
					} else if (res && res.text) {
						text = res.text;
					}
				} catch {}
				
				if (!text) text = '(no response)';
				this._replaceLastAssistant(text);
			} catch (e) {
				this._replaceLastAssistant('[ERROR] ' + (e.message || 'failed'));
				SNW.ErrorHandler.handle(e, 'ai.send');
			}
		}
		
		_appendMessage(role, text) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const cls = role === 'user' ? 'is-user' : 'is-assistant';
			wrap.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-msg ${cls}">
                    <div class="snw-ai-bubble">${text}</div>
                </div>`);
			wrap.scrollTop = wrap.scrollHeight;
		}
		
		_replaceLastAssistant(text) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const list = wrap.querySelectorAll('.snw-ai-msg.is-assistant');
			const last = list[list.length - 1];
			if (last) {
				const bubble = last.querySelector('.snw-ai-bubble');
				if (bubble) bubble.textContent = text;
			}
			wrap.scrollTop = wrap.scrollHeight;
		}
	};
})(window.SNW);