/*
 * ------------------------------------------------------
 * 소스명 : 999b.ai-sheet.js
 * 모듈약어 : SNW.AISheet
 * 모듈명 : Smart Nature Wind Global Floating AI Voice Sheet (FAB)
 * ------------------------------------------------------
 * 기능 요약:
 *  - 어느 화면에서나 AI 음성 제어를 호출할 수 있는 전역 플로팅 액션 버튼 (FAB)
 *  - 슬라이드업 바텀 시트 오버레이 (REST 자연어 제어 & Gemini Live 실시간 음성)
 *  - 빠른 실행 칩 (Quick chips), 실시간 발화 상태, 도구 실행 피드백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _initialized = false;
	let _visible = false;
	let _mode = 'rest'; // 'rest' | 'live'
	let _fabEl = null;
	let _sheetEl = null;
	let _history = [];

	const AISheet = {
		init() {
			if (_initialized) return;
			_initialized = true;

			_mode = localStorage.getItem('snw.ai.mode') || 'rest';

			this._renderFAB();
			this._renderSheet();
			this._bindEvents();

			// 옵션 웨이크워드 연동
			if (SNW.AIVoice && SNW.AIVoice.isSTTSupported()) {
				SNW.AIVoice.startWakeDetection({
					onWake: () => {
						this.open();
						if (SNW.Toast) SNW.Toast.show(SNW.I18n ? SNW.I18n.t('ai.voiceListening') : 'Listening...', 'info');
					}
				});
			}

			SNW.LogUtil ? SNW.LogUtil.info('[AISheet] Global AI FAB sheet initialized') : console.log('[AISheet] Initialized');
		},

		_renderFAB() {
			_fabEl = document.createElement('button');
			_fabEl.type = 'button';
			_fabEl.className = 'snw-ai-fab';
			_fabEl.setAttribute('aria-label', 'AI Assistant');
			_fabEl.innerHTML = '🎙️';
			_fabEl.style.cssText = `
				position: fixed;
				bottom: var(--snw-fab-bottom, 76px);
				right: 20px;
				width: 54px;
				height: 54px;
				border-radius: 50%;
				background: linear-gradient(135deg, #3b82f6, #8b5cf6);
				color: #ffffff;
				border: none;
				box-shadow: 0 4px 14px rgba(0,0,0,0.3), 0 0 10px rgba(59,130,246,0.5);
				font-size: 24px;
				cursor: pointer;
				z-index: var(--snw-z-fab, 990);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: bottom 0.25s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
			`;

			_fabEl.addEventListener('mouseenter', () => {
				_fabEl.style.transform = 'scale(1.08)';
			});
			_fabEl.addEventListener('mouseleave', () => {
				_fabEl.style.transform = 'scale(1)';
			});
			_fabEl.addEventListener('click', () => {
				this.toggle();
			});

			document.body.appendChild(_fabEl);
		},

		_renderSheet() {
			_sheetEl = document.createElement('div');
			_sheetEl.className = 'snw-ai-sheet-container';
			_sheetEl.style.cssText = `
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0,0,0,0.5);
				backdrop-filter: blur(4px);
				z-index: var(--snw-z-modal, 1100);
				display: none;
				opacity: 0;
				transition: opacity 0.25s ease;
				justify-content: center;
				align-items: flex-end;
			`;

			const placeholderText = SNW.I18n ? SNW.I18n.t('ai.placeholder') : 'Ask anything...';
			const sendText = SNW.I18n ? SNW.I18n.t('ai.send') : 'Send';
			const titleText = SNW.I18n ? SNW.I18n.t('ai.title') : 'AI Assistant';

			_sheetEl.innerHTML = `
				<div class="snw-ai-sheet" style="
					width: 100%;
					max-width: 600px;
					max-height: 82vh;
					background: var(--snw-surface, #1e293b);
					border-top-left-radius: 20px;
					border-top-right-radius: 20px;
					box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
					display: flex;
					flex-direction: column;
					padding: 16px;
					transform: translateY(100%);
					transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
				">
					<!-- Header -->
					<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
						<div style="display:flex;align-items:center;gap:8px;">
							<span style="font-size:1.2rem;font-weight:700;">✨ ${titleText}</span>
							<span class="snw-badge snw-badge--info" data-slot="sheet-cost" style="display:none;font-size:0.75rem;"></span>
						</div>
						<button type="button" class="snw-btn snw-btn--ghost snw-btn--sm" data-action="sheet-close" style="font-size:1.2rem;line-height:1;padding:4px 8px;">✕</button>
					</div>

					<!-- Quick Chips -->
					<div style="display:flex;gap:6px;overflow-x:auto;padding:10px 0;scrollbar-width:none;">
						<button type="button" class="snw-btn snw-btn--sm" data-quick="바다 바람 틀어줘">바다 바람</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="30분 후 꺼줘">30분 후 꺼줘</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="스케줄대로 해줘">스케줄 복귀</button>
						<button type="button" class="snw-btn snw-btn--sm" data-quick="팬 정지">정지</button>
					</div>

					<!-- Messages List -->
					<div data-slot="sheet-messages" style="flex:1;overflow-y:auto;min-height:180px;max-height:360px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;padding-right:4px;"></div>

					<!-- Input Bar -->
					<div style="display:flex;gap:8px;align-items:center;">
						<input type="text" data-slot="sheet-input" placeholder="${placeholderText}" style="flex:1;padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.2);color:#fff;outline:none;" />
						<button type="button" class="snw-btn snw-btn--secondary" data-action="sheet-mic" title="음성 입력 (클릭 시에만 마이크가 활성화됩니다)" style="border-radius:12px;padding:10px 14px;">🎤</button>
						<button type="button" class="snw-btn snw-btn--primary" data-action="sheet-send" style="border-radius:12px;padding:10px 16px;">${sendText}</button>
					</div>
				</div>
			`;

			document.body.appendChild(_sheetEl);
		},

		_bindEvents() {
			// 바깥 영역 클릭 시 닫기
			_sheetEl.addEventListener('click', (e) => {
				if (e.target === _sheetEl) this.close();
			});

			const closeBtn = _sheetEl.querySelector('[data-action="sheet-close"]');
			if (closeBtn) closeBtn.addEventListener('click', () => this.close());

			const sendBtn = _sheetEl.querySelector('[data-action="sheet-send"]');
			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			const micBtn = _sheetEl.querySelector('[data-action="sheet-mic"]');

			if (sendBtn) sendBtn.addEventListener('click', () => this._onSend());
			if (inputEl) {
				inputEl.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						this._onSend();
					}
				});
			}

			if (micBtn) {
				micBtn.addEventListener('click', () => this._onVoiceInput());
			}

			// 퀵 칩 이벤트
			const chips = _sheetEl.querySelectorAll('[data-quick]');
			chips.forEach(chip => {
				chip.addEventListener('click', () => {
					const val = chip.getAttribute('data-quick');
					if (inputEl) {
						inputEl.value = val;
						this._onSend();
					}
				});
			});
		},

		open() {
			if (_visible) return;
			_visible = true;
			_sheetEl.style.display = 'flex';
			requestAnimationFrame(() => {
				_sheetEl.style.opacity = '1';
				const inner = _sheetEl.querySelector('.snw-ai-sheet');
				if (inner) inner.style.transform = 'translateY(0)';
			});

			if (SNW.AIClient) {
				_history = SNW.AIClient.loadHistory();
				this._renderMessages();
			}

			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			if (inputEl) setTimeout(() => inputEl.focus(), 300);
		},

		close() {
			if (!_visible) return;
			_visible = false;
			_sheetEl.style.opacity = '0';
			const inner = _sheetEl.querySelector('.snw-ai-sheet');
			if (inner) inner.style.transform = 'translateY(100%)';
			setTimeout(() => {
				if (!_visible) _sheetEl.style.display = 'none';
			}, 300);
		},

		toggle() {
			if (_visible) this.close();
			else this.open();
		},

		_renderMessages() {
			const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
			if (!box) return;
			box.innerHTML = '';
			const recent = _history.slice(-10);
			for (const m of recent) {
				this._appendBubble(m.role, m.text);
			}
			box.scrollTop = box.scrollHeight;
		},

		_appendBubble(role, text) {
			const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
			if (!box) return;

			const bubble = document.createElement('div');
			const isUser = (role === 'user');
			bubble.style.cssText = `
				align-self: ${isUser ? 'flex-end' : 'flex-start'};
				max-width: 82%;
				padding: 8px 12px;
				border-radius: 12px;
				font-size: 0.92rem;
				line-height: 1.4;
				background: ${isUser ? '#3b82f6' : 'rgba(255,255,255,0.08)'};
				color: #fff;
				word-break: break-word;
			`;
			bubble.textContent = text;
			box.appendChild(bubble);
			box.scrollTop = box.scrollHeight;
		},

		async _onSend() {
			const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
			const msg = (inputEl && inputEl.value || '').trim();
			if (!msg) return;
			inputEl.value = '';

			this._appendBubble('user', msg);
			_history.push({ role: 'user', text: msg });
			if (SNW.AIClient) SNW.AIClient.saveHistory(_history);

			this._appendBubble('assistant', '🤔 ...');

			try {
				let reply = '';
				let hint = '';
				let actions = [];

				if (SNW.AIClient) {
					const res = await SNW.AIClient.send(msg, _history, {
						lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
						voiceMode: false
					});
					reply = (res && res.text) || '(no response)';
					hint = (res && res._speechHint) || reply;
					actions = (res && res.actions) || [];
				} else if (SNW.Api && SNW.Api.gemini) {
					const res = await SNW.Api.gemini({ message: msg });
					reply = (res && res.text) || '(no response)';
				}

				this._updateLastBubble(reply, actions);
				_history.push({ role: 'assistant', text: reply });
				if (SNW.AIClient) SNW.AIClient.saveHistory(_history);

				// TTS 발화
				if (hint && SNW.AIVoice && SNW.AIVoice.isTTSSupported()) {
					SNW.AIVoice.speak(hint);
				}
			} catch (e) {
				this._updateLastBubble('❌ ' + (e.message || 'Error'));
			}
		},

		_updateLastBubble(text, actions = []) {
			const box = _sheetEl.querySelector('[data-slot="sheet-messages"]');
			if (!box) return;
			const bubbles = box.querySelectorAll('div');
			const last = bubbles[bubbles.length - 1];
			if (last) {
				let actionStr = '';
				if (actions && actions.length > 0) {
					actionStr = '\n' + actions.map(a => `✓ ${a.name}: ${a.result}`).join('\n');
				}
				last.textContent = text + actionStr;
			}
			box.scrollTop = box.scrollHeight;
		},

		async _onVoiceInput() {
			if (!SNW.AIVoice || !SNW.AIVoice.isSTTSupported()) {
				if (SNW.Toast) SNW.Toast.show('Voice input not supported', 'warn');
				return;
			}

			const micBtn = _sheetEl.querySelector('[data-action="sheet-mic"]');
			if (micBtn) micBtn.style.background = '#ef4444';

			try {
				const res = await SNW.AIVoice.startListening();
				if (micBtn) micBtn.style.background = '';
				if (res && res.transcript) {
					const inputEl = _sheetEl.querySelector('[data-slot="sheet-input"]');
					if (inputEl) {
						inputEl.value = res.transcript;
						this._onSend();
					}
				}
			} catch (e) {
				if (micBtn) micBtn.style.background = '';
			}
		}
	};

	SNW.AISheet = AISheet;

	// 앱 부팅 시 자동 초기화
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => AISheet.init());
	} else {
		AISheet.init();
	}

})(window, window.SNW);

