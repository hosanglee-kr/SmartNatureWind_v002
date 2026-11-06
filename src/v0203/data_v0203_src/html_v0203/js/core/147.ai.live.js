/*
 * ------------------------------------------------------
 * 소스명 : 147.ai.live.js
 * 모듈약어 : SNW.AiLive
 * 모듈명 : Smart Nature Wind Gemini Live Voice Client (Bidi WS & Guardrails)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Gemini Live Bi-directional WebSocket 연결 관리
 *  - 16kHz 마이크 스트리밍 / 24kHz 스피커 재생 큐 통합
 *  - Barge-in(인터럽션) 실시간 처리
 *  - 12개 ESP32 스마트 바람 제어 도구 브리지 실행
 *  - 30초 주기 사용량(오디오 초, 비용) 측정 및 NVS 동기화
 *  - 일일 30분 상한 도달 시 안전 종료 및 REST 폴백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _ws = null;
	let _isConnected = false;
	let _isConnecting = false;
	let _sessionStartTime = 0;
	let _lastReportTime = 0;
	let _usageIntervalId = null;

	let _callbacks = {
		onStateChange: null, // (state, details)
		onText: null,        // (text, isComplete)
		onToolCall: null,    // (name, args, result)
		onVolume: null,      // (level 0..1)
		onError: null,       // (err)
		onCostUpdate: null   // (costStatus)
	};

	function getTodayDateStr() {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const AiLive = {
		isSupported() {
			return !!(window.WebSocket && SNW.AudioCapture && SNW.AudioCapture.isSupported());
		},

		isConnected() {
			return _isConnected;
		},

		isConnecting() {
			return _isConnecting;
		},

		async startSession(callbacks = {}) {
			if (_isConnected || _isConnecting) return;
			_callbacks = Object.assign(_callbacks, callbacks);

			_isConnecting = true;
			this._emitState('connecting');

			const todayDate = getTodayDateStr();

			try {
				// 1. 일일 30분 가드레일 토큰 획득
				const tokenRes = await SNW.API.getAiLiveToken(todayDate);
				if (tokenRes.level === 'cap' || (tokenRes.remainingSec !== undefined && tokenRes.remainingSec <= 0)) {
					const msg = tokenRes.error || (SNW.I18n ? SNW.I18n.t('ai.dailyCapReached') : 'Daily Live limit reached (30 min)');
					throw new Error(msg);
				}

				if (callbacks.onCostUpdate) {
					callbacks.onCostUpdate(tokenRes);
				}

				// 2. 초기 Live WS 설정 조회 (엄격 프롬프트 및 도구 선언)
				const cfgRes = await SNW.API.getAiLiveConfig();
				const token = tokenRes.token;
				const wsUrl = `${tokenRes.wsUrl || 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'}?key=${token}`;

				// 3. AudioPlayback 초기화
				if (SNW.AudioPlayback) {
					SNW.AudioPlayback.init({
						onStateChange: (isPlaying) => {
							this._emitState(isPlaying ? 'speaking' : 'listening');
						}
					});
				}

				// 4. WebSocket 연결
				_ws = new WebSocket(wsUrl);

				_ws.onopen = async () => {
					_isConnected = true;
					_isConnecting = false;
					_sessionStartTime = Date.now();
					_lastReportTime = _sessionStartTime;

					// 초기 setup 메시지 전송
					this._sendSetup(cfgRes, tokenRes.voiceName);

					// 마이크 캡처 시작
					await this._startMicCapture();

					// 30초 주기 사용량 보고 타이머 시작
					this._startUsageReporting();

					this._emitState('connected');
				};

				_ws.onmessage = async (event) => {
					await this._handleMessage(event.data);
				};

				_ws.onerror = (e) => {
					console.error('[AiLive] WebSocket error:', e);
					if (_callbacks.onError) _callbacks.onError(new Error('WebSocket connection error'));
				};

				_ws.onclose = (event) => {
					this._handleClose(event);
				};

			} catch (err) {
				_isConnecting = false;
				this.stopSession();
				if (_callbacks.onError) {
					_callbacks.onError(err);
				}
				this._emitState('idle');
				throw err;
			}
		},

		_sendSetup(cfgRes, voiceName) {
			const setupMsg = {
				setup: {
					model: 'models/gemini-2.0-flash-exp',
					generationConfig: {
						responseModalities: ['AUDIO'],
						speechConfig: {
							voiceConfig: {
								prebuiltVoiceConfig: {
									voiceName: voiceName || 'Aoede'
								}
							}
						}
					},
					systemInstruction: {
						parts: [{ text: (cfgRes && cfgRes.systemInstruction) || 'You are SmartNatureWind voice controller.' }]
					},
					tools: (cfgRes && cfgRes.tools) || []
				}
			};
			_ws.send(JSON.stringify(setupMsg));
		},

		async _startMicCapture() {
			if (!SNW.AudioCapture) return;
			await SNW.AudioCapture.start({
				onChunk: (base64Pcm) => {
					if (!_isConnected || !_ws || _ws.readyState !== WebSocket.OPEN) return;
					const chunkMsg = {
						realtimeInput: {
							mediaChunks: [
								{
									mimeType: 'audio/pcm;rate=16000',
									data: base64Pcm
								}
							]
						}
					};
					_ws.send(JSON.stringify(chunkMsg));
				},
				onVolume: (level) => {
					if (_callbacks.onVolume) {
						_callbacks.onVolume(level);
					}
				},
				onError: (err) => {
					console.error('[AiLive] AudioCapture error:', err);
					if (_callbacks.onError) _callbacks.onError(err);
				}
			});
		},

		async _handleMessage(data) {
			let msg = null;
			try {
				if (typeof data === 'string') {
					msg = JSON.parse(data);
				} else if (data instanceof Blob) {
					const text = await data.text();
					msg = JSON.parse(text);
				}
			} catch (e) {
				console.warn('[AiLive] JSON parse error:', e);
				return;
			}

			if (!msg) return;

			// 1. 모델 발화 파트 처리 (오디오/텍스트)
			if (msg.serverContent) {
				const sc = msg.serverContent;

				// Barge-in 인터럽트 수신 시 스피커 즉시 중단
				if (sc.interrupted) {
					if (SNW.AudioPlayback) {
						SNW.AudioPlayback.flush();
					}
					this._emitState('interrupted');
				}

				if (sc.modelTurn && sc.modelTurn.parts) {
					for (const part of sc.modelTurn.parts) {
						// 24kHz 오디오 청크
						if (part.inlineData && part.inlineData.data) {
							if (SNW.AudioPlayback) {
								SNW.AudioPlayback.enqueueBase64Pcm(part.inlineData.data);
							}
						}
						// 텍스트 청크
						if (part.text && _callbacks.onText) {
							_callbacks.onText(part.text, false);
						}
					}
				}

				if (sc.turnComplete && _callbacks.onText) {
					_callbacks.onText('', true);
				}
			}

			// 2. Tool Call (도구 실행) 처리
			if (msg.toolCall) {
				this._handleToolCall(msg.toolCall);
			}
		},

		async _handleToolCall(toolCall) {
			this._emitState('executing');
			try {
				const calls = toolCall.functionCalls || [];
				// ESP32 백엔드 브리지 호출
				const bridgeRes = await SNW.API.callAiLiveFunction({ functionCalls: calls });
				const responses = (bridgeRes && bridgeRes.functionResponses) || [];

				if (_callbacks.onToolCall) {
					for (let i = 0; i < calls.length; i++) {
						const c = calls[i];
						const r = responses[i] ? responses[i].response : null;
						_callbacks.onToolCall(c.name, c.args, r);
					}
				}

				// Live WebSocket으로 응답 전송
				if (_isConnected && _ws && _ws.readyState === WebSocket.OPEN) {
					const replyMsg = {
						toolResponse: {
							functionResponses: responses
						}
					};
					_ws.send(JSON.stringify(replyMsg));
				}
			} catch (e) {
				console.error('[AiLive] Tool execution error:', e);
			}
		},

		_startUsageReporting() {
			this._stopUsageReporting();
			_usageIntervalId = setInterval(() => {
				this._reportUsageDelta();
			}, 30000); // 30초 주기
		},

		_stopUsageReporting() {
			if (_usageIntervalId) {
				clearInterval(_usageIntervalId);
				_usageIntervalId = null;
			}
		},

		async _reportUsageDelta() {
			if (!_sessionStartTime) return;
			const now = Date.now();
			const elapsedSec = Math.round((now - _lastReportTime) / 1000);
			if (elapsedSec <= 0) return;

			_lastReportTime = now;
			const todayDate = getTodayDateStr();

			// 오디오 1초당 비용 추정 ($0.0003/sec -> x1000: 0.3)
			const estCostX1000 = Math.round(elapsedSec * 0.3);

			try {
				const res = await SNW.API.reportAiUsage({
					todayDate,
					audioSec: elapsedSec,
					turnCount: 0,
					costUsdX1000: estCostX1000
				});

				if (_callbacks.onCostUpdate) {
					_callbacks.onCostUpdate(res);
				}

				// 상한 도달 시 자동 종료
				if (res && res.level === 'cap') {
					const msg = SNW.I18n ? SNW.I18n.t('ai.dailyCapReached') : 'Daily Live audio limit reached (30 min)';
					if (_callbacks.onError) _callbacks.onError(new Error(msg));
					this.stopSession();
				}
			} catch (e) {
				console.warn('[AiLive] Failed to report usage:', e);
			}
		},

		_handleClose(event) {
			_isConnected = false;
			_isConnecting = false;
			this._stopUsageReporting();
			this._reportUsageDelta(); // 남은 사용량 최종 보고

			if (SNW.AudioCapture) SNW.AudioCapture.stop();
			if (SNW.AudioPlayback) SNW.AudioPlayback.flush();

			this._emitState('closed');
		},

		stopSession() {
			_isConnecting = false;
			if (_isConnected && _ws) {
				try {
					_ws.close();
				} catch (_) {}
			}
			_ws = null;
			_isConnected = false;

			this._stopUsageReporting();
			this._reportUsageDelta();

			if (SNW.AudioCapture) SNW.AudioCapture.stop();
			if (SNW.AudioPlayback) SNW.AudioPlayback.close();

			this._emitState('idle');
		},

		_emitState(state, details) {
			if (_callbacks.onStateChange) {
				_callbacks.onStateChange(state, details);
			}
		}
	};

	SNW.AiLive = AiLive;

})(window, window.SNW);

