// =========================================================
// 290.page.ai.js — SNW.Page.AI
// Layer 4 (페이지 로직: AI 스튜디오, 2-turn REST 제어 & Gemini Live Voice)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
	'use strict';

	const MAX_MSG_LEN = 4000;

	SNW.Page.AI = class AI {
		constructor(container) {
			this.el = container;
			this._active = true;
			this._history = [];
			this._isListening = false;
			this._currentMode = 'rest'; // 'rest' | 'live'
			this._liveCostStatus = null;
		}

		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.ai());
			SNW.I18n.applyTo(this.el);

			const slot = this.el.querySelector('[data-slot="chat"]');
			const examplePlaceholder = SNW.I18n.t('ai.placeholder');

			slot.innerHTML = `
                <div class="snw-ai-chat">
                    <div class="snw-ai-header">
                        <div style="display:flex;gap:6px;align-items:center;">
                            <div class="snw-btn-group" role="group">
                                <button type="button" class="snw-btn snw-btn--sm snw-btn--primary" data-mode-btn="rest">
                                    ${SNW.I18n.t('ai.modeRest')}
                                </button>
                                <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-mode-btn="live">
                                    ${SNW.I18n.t('ai.modeLive')}
                                </button>
                            </div>
                            <span class="snw-badge snw-badge--info" data-slot="cost-badge" style="display:none;font-size:0.75rem;"></span>
                        </div>
                        <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-action="clear-history">
                            ${SNW.I18n.t('ai.clearHistory')}
                        </button>
                    </div>

                    <!-- REST Chat View -->
                    <div class="snw-ai-rest-view" data-view="rest">
                        <div class="snw-ai-messages" data-slot="messages"></div>
                        <div class="snw-ai-examples">
						    <button type="button" class="snw-btn snw-btn--sm" data-example="바다 바람 틀어줘">🌊 바다 바람</button>
						    <button type="button" class="snw-btn snw-btn--sm" data-example="30분 후 꺼줘">⏱ 30분 후 끄기</button>
						    <button type="button" class="snw-btn snw-btn--sm" data-example="스케줄대로 해줘">📅 스케줄 복귀</button>
						    <button type="button" class="snw-btn snw-btn--sm" data-example="${SNW.I18n.t('ai.example1')}">🌤 날씨 추천</button>
						</div>
                        <div class="snw-ai-input">
                        	<textarea data-slot="input" rows="1" style="flex:1; resize:none; max-height:120px; overflow-y:auto;"
							          placeholder="${SNW.DomUtil.escape(examplePlaceholder)}"
							          maxlength="${MAX_MSG_LEN}"></textarea>
                            <button type="button" class="snw-btn snw-btn--secondary" data-action="voice" title="음성 입력">
                                🎤
                            </button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="send">
                                ${SNW.I18n.t('ai.send')}
                            </button>
                        </div>
                    </div>

                    <!-- Live Voice View -->
                    <div class="snw-ai-live-view" data-view="live">
                        <div class="snw-live-orb-container">
                            <div class="snw-live-orb" data-slot="live-orb"></div>
                        </div>
                        <div class="snw-live-status-text" data-slot="live-status">
                            ${SNW.I18n.t('ai.liveStart')}
                        </div>
                        <div class="snw-live-transcript" data-slot="live-transcript"></div>
                        <div class="snw-live-actions-log" data-slot="live-actions"></div>
                        <div>
                            <button type="button" class="snw-btn snw-btn--lg snw-btn-primary" data-action="live-toggle" style="min-width:160px;">
                                ${SNW.I18n.t('ai.liveStart')}
                            </button>
                        </div>
                    </div>
                </div>`;

			// 이전 대화 이력 로드
			if (SNW.AIClient) {
				this._history = SNW.AIClient.loadHistory();
				this._renderHistory();
			}

			// 모드 전환 버튼 바인딩
			SNW.DomUtil.delegate(this.el, '[data-mode-btn]', 'click', (e, btn) => {
				const mode = btn.getAttribute('data-mode-btn');
				this._switchMode(mode);
			});

			// 이벤트 위임
			SNW.DomUtil.delegate(this.el, '[data-action="send"]', 'click', () => this._onSend());
			SNW.DomUtil.delegate(this.el, '[data-action="voice"]', 'click', () => this._onVoiceToggle());
			SNW.DomUtil.delegate(this.el, '[data-action="clear-history"]', 'click', () => this._onClearHistory());
			SNW.DomUtil.delegate(this.el, '[data-action="live-toggle"]', 'click', () => this._onLiveToggle());

			// 예시 버튼 클릭
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
				
				// [NEW] 입력 내용에 따른 높이 자동 확장
				inp.addEventListener('input', () => {
					inp.style.height = 'auto';
					inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
				});
			}

			// 초기 비용 상태 로드
			this._loadCostStatus();

			SNW.LogUtil.info('[AI] mount 완료');
		}

		unmount() {
			this._active = false;
			if (SNW.AIVoice) {
				SNW.AIVoice.stopListening();
				SNW.AIVoice.stopSpeaking();
			}
			if (SNW.AiLive && SNW.AiLive.isConnected()) {
				SNW.AiLive.stopSession();
			}
		}

		async _loadCostStatus() {
			try {
				if (SNW.Api && SNW.Api.getAiCostStatus) {
					const now = new Date();
					const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
					const res = await SNW.Api.getAiCostStatus(today);
					this._updateCostBadge(res);
				}
			} catch (e) {
				console.warn('[AI] Failed to load cost status:', e);
			}
		}

		_updateCostBadge(costData) {
			if (!costData) return;
			this._liveCostStatus = costData;
			const badge = this.el.querySelector('[data-slot="cost-badge"]');
			if (!badge) return;

			const usedMin = Math.round((costData.audioSec || 0) / 60);
			const capMin = Math.round((costData.capSec || 1800) / 60);
			const cost = ((costData.estCostUsdX1000 || 0) / 1000).toFixed(3);

			badge.style.display = 'inline-block';
			badge.textContent = SNW.I18n.t('ai.liveCost', { min: usedMin, cap: capMin, cost });

			badge.classList.remove('snw-badge--info', 'snw-badge--warn', 'snw-badge--danger');
			if (costData.level === 'cap') {
				badge.classList.add('snw-badge--danger');
			} else if (costData.level === 'warn') {
				badge.classList.add('snw-badge--warn');
			} else {
				badge.classList.add('snw-badge--info');
			}
		}

		_switchMode(mode) {
			if (this._currentMode === mode) return;

			// Live 실행 중 다른 모드로 전환 시 Live 중단
			if (this._currentMode === 'live' && SNW.AiLive && SNW.AiLive.isConnected()) {
				SNW.AiLive.stopSession();
			}

			this._currentMode = mode;

			const restBtn = this.el.querySelector('[data-mode-btn="rest"]');
			const liveBtn = this.el.querySelector('[data-mode-btn="live"]');
			const restView = this.el.querySelector('[data-view="rest"]');
			const liveView = this.el.querySelector('[data-view="live"]');

			if (mode === 'live') {
				if (restBtn) restBtn.className = 'snw-btn snw-btn--sm snw-btn--ghost';
				if (liveBtn) liveBtn.className = 'snw-btn snw-btn--sm snw-btn--primary';
				if (restView) restView.style.display = 'none';
				if (liveView) liveView.style.display = 'block';
			} else {
				if (restBtn) restBtn.className = 'snw-btn snw-btn--sm snw-btn--primary';
				if (liveBtn) liveBtn.className = 'snw-btn snw-btn--sm snw-btn--ghost';
				if (restView) restView.style.display = 'block';
				if (liveView) liveView.style.display = 'none';
			}
		}

		async _onLiveToggle() {
			if (!SNW.AiLive || !SNW.AiLive.isSupported()) {
				if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('ai.voiceNotSupported'));
				return;
			}

			const liveBtn = this.el.querySelector('[data-action="live-toggle"]');
			const orb = this.el.querySelector('[data-slot="live-orb"]');
			const statusText = this.el.querySelector('[data-slot="live-status"]');
			const transcriptBox = this.el.querySelector('[data-slot="live-transcript"]');
			const actionsLog = this.el.querySelector('[data-slot="live-actions"]');

			if (SNW.AiLive.isConnected() || SNW.AiLive.isConnecting()) {
				SNW.AiLive.stopSession();
				if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
				if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
				if (orb) {
					orb.style.transform = 'scale(1)';
					orb.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)';
				}
				return;
			}

			// 상한 사전 검사
			if (this._liveCostStatus && this._liveCostStatus.level === 'cap') {
				if (SNW.ToastUtil) SNW.ToastUtil.error(SNW.I18n.t('ai.dailyCapReached'));
				this._switchMode('rest');
				return;
			}

			if (statusText) statusText.textContent = SNW.I18n.t('ai.liveConnecting');
			if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStop');

			try {
				await SNW.AiLive.startSession({
					onStateChange: (state) => {
						if (!this._active) return;
						if (state === 'connected' || state === 'listening') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveConnected');
							if (orb) orb.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
						} else if (state === 'speaking') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveSpeaking');
							if (orb) orb.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
						} else if (state === 'executing') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.actionDone');
						} else if (state === 'idle' || state === 'closed') {
							if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
							if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
							if (orb) {
								orb.style.transform = 'scale(1)';
								orb.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
								orb.style.boxShadow = '0 0 20px rgba(59,130,246,0.5)';
							}
						}
					},
					onText: (text, isComplete) => {
						if (!transcriptBox) return;
						if (text) {
							transcriptBox.textContent += text;
							transcriptBox.scrollTop = transcriptBox.scrollHeight;
						}
						if (isComplete) {
							transcriptBox.textContent += '\n';
						}
					},
					onToolCall: (name, args, res) => {
						if (!actionsLog) return;
						const item = document.createElement('div');
						item.textContent = `✓ ${name}: ${JSON.stringify(res || {})}`;
						actionsLog.appendChild(item);
					},
					onVolume: (level) => {
						if (!orb) return;
						const scale = 1.0 + level * 0.45;
						const blur = 20 + level * 30;
						orb.style.transform = `scale(${scale.toFixed(2)})`;
						orb.style.boxShadow = `0 0 ${blur.toFixed(0)}px rgba(59,130,246,0.8)`;
					},
					onCostUpdate: (costData) => {
						this._updateCostBadge(costData);
					},
					onError: (err) => {
						if (SNW.ToastUtil) SNW.ToastUtil.error(err.message || 'Live Voice error');
					}
				});
			} catch (e) {
				if (statusText) statusText.textContent = SNW.I18n.t('ai.liveStart');
				if (liveBtn) liveBtn.textContent = SNW.I18n.t('ai.liveStart');
				if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || 'Live connection failed');
			}
		}

		_renderHistory() {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap || !this._history) return;
			wrap.innerHTML = '';
			for (const item of this._history) {
				this._appendMessage(item.role, item.text, false);
			}
		}

		_onClearHistory() {
			if (SNW.AIClient) {
				SNW.AIClient.clearHistory();
			}
			this._history = [];
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (wrap) wrap.innerHTML = '';
			if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('ai.clearHistory'));
		}

		async _onVoiceToggle() {
			if (!SNW.AIVoice || !SNW.AIVoice.isSTTSupported()) {
				if (SNW.ToastUtil) SNW.ToastUtil.warn(SNW.I18n.t('ai.voiceNotSupported'));
				return;
			}

			const vBtn = this.el.querySelector('[data-action="voice"]');
			if (this._isListening) {
				SNW.AIVoice.stopListening();
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');
				return;
			}

			this._isListening = true;
			if (vBtn) vBtn.classList.add('snw-btn--active');
			if (SNW.ToastUtil) SNW.ToastUtil.info(SNW.I18n.t('ai.voiceListening'));

			try {
				const res = await SNW.AIVoice.startListening();
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');

				if (res && res.transcript) {
					const inp = this.el.querySelector('[data-slot="input"]');
					if (inp) {
						inp.value = res.transcript;
						this._onSend(true); // 음성 모드로 전송
					}
				}
			} catch (err) {
				this._isListening = false;
				if (vBtn) vBtn.classList.remove('snw-btn--active');
				if (SNW.ToastUtil) SNW.ToastUtil.error(SNW.I18n.t('ai.micError'));
			}
		}

		async _onSend(isVoiceMode = false) {
			const inp = this.el.querySelector('[data-slot="input"]');
			const msg = (inp && inp.value || '').trim();
			if (!msg) return;
			inp.value = '';

			this._appendMessage('user', msg, true);
			this._appendMessage('assistant', SNW.I18n.t('ai.thinking'), false);

			try {
				let resText = '';
				let speechHint = '';
				let actions = [];

				if (SNW.AIClient) {
					const res = await SNW.AIClient.send(msg, this._history, {
						lang: (SNW.I18n && SNW.I18n.getLang ? SNW.I18n.getLang() : 'ko'),
						voiceMode: isVoiceMode
					});
					if (!this._active) return;

					if (res) {
						resText = res.text || '';
						speechHint = res._speechHint || resText;
						actions = res.actions || [];
					}
				} else {
					// 폴백
					const res = await SNW.Api.gemini({ message: msg });
					if (!this._active) return;
					resText = (res && res.text) || '(no response)';
				}

				if (!resText) resText = '(no response)';

				this._replaceLastAssistant(resText, actions);

				// 대화 이력 업데이트 및 저장
				this._history.push({ role: 'assistant', text: resText });
				if (SNW.AIClient) {
					SNW.AIClient.saveHistory(this._history);
				}

				// TTS 음성 출력
				if (speechHint && SNW.AIVoice && SNW.AIVoice.isTTSSupported()) {
					SNW.AIVoice.speak(speechHint);
				}

			} catch (e) {
				this._replaceLastAssistant('[ERROR] ' + (e.message || 'failed'), []);
				SNW.ErrorHandler.handle(e, 'ai.send');
			}
		}

		_appendMessage(role, text, saveToHistory = false) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const cls = role === 'user' ? 'is-user' : 'is-assistant';
			wrap.appendChild(SNW.DomUtil.html`
                <div class="snw-ai-msg ${cls}">
                    <div class="snw-ai-bubble">${text}</div>
                </div>`);
			wrap.scrollTop = wrap.scrollHeight;

			if (saveToHistory) {
				this._history.push({ role, text });
				if (SNW.AIClient) {
					SNW.AIClient.saveHistory(this._history);
				}
			}
		}

		_replaceLastAssistant(text, actions = []) {
			const wrap = this.el.querySelector('[data-slot="messages"]');
			if (!wrap) return;
			const list = wrap.querySelectorAll('.snw-ai-msg.is-assistant');
			const last = list[list.length - 1];
			if (last) {
				const bubble = last.querySelector('.snw-ai-bubble');
				if (bubble) {
					let actionHtml = '';
					if (actions && actions.length > 0) {
						actionHtml = `<div class="snw-ai-actions" style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.2);font-size:0.85em;color:#4ade80;">`;
						for (const a of actions) {
							actionHtml += `<div>✓ ${SNW.DomUtil.escape(a.name)}: ${SNW.DomUtil.escape(a.result)}</div>`;
						}
						actionHtml += `</div>`;
					}
					bubble.innerHTML = `${SNW.DomUtil.escape(text)}${actionHtml}`;
				}
			}
			wrap.scrollTop = wrap.scrollHeight;
		}
	};
})(window.SNW);
