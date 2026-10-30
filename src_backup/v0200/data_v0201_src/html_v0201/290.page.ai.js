/*
 * ------------------------------------------------------
 * 소스명   : 290.page.ai.js
 * 모듈     : SNW.Page.AI
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - Gemini 자연어 채팅 (POST /ai/gemini)
 *  - Rate limit 3초 (서버 + 클라이언트)
 *  - 요청 최대 8KB / 응답 최대 4KB
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	const MAX_MSG_LEN = 4000;
	
	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = []; // [{role, text}]
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);
			
			const slot = this.el.querySelector('[data-slot="chat"]');
			slot.innerHTML = '';
			slot.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-chat">
                    <div class="snw-ai-messages" data-slot="messages"></div>
                    <div class="snw-ai-input">
                        <textarea data-slot="input" rows="3"
                                  placeholder="${SNW.I18n.t('ai.placeholder')}"
                                  maxlength="${MAX_MSG_LEN}"></textarea>
                        <button type="button" class="snw-btn snw-btn-primary"
                                data-action="send" data-i18n="ai.send">전송</button>
                    </div>
                </div>`);
			SNW.I18n.applyTo(slot);
			
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
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
				// Gemini API 요청 형식 (contents 배열)
				const body = {
					contents: [{
						parts: [{ text: msg }]
					}]
				};
				const res = await SNW.Api.gemini(body);
				if (!this._active) return;
				
				// 응답 파싱 (Gemini 표준)
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
