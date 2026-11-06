/*
 * ------------------------------------------------------
 * 소스명 : 147b.audio.playback.js
 * 모듈약어 : SNW.AudioPlayback
 * 모듈명 : Smart Nature Wind Audio Output & PCM24 Stream Player (Barge-in Support)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Gemini Live 24kHz PCM16 모노 스트리밍 큐 재생
 *  - 실시간 스케줄링 (끊김 없는 Seamless 재생)
 *  - Barge-in(끼어들기) 발생 시 즉시 큐 비우기 및 중단 (flush)
 *  - 재생 상태 콜백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _audioCtx = null;
	let _nextPlayTime = 0;
	let _scheduledSources = [];
	let _isPlaying = false;
	let _onStateChange = null;

	function base64ToArrayBuffer(base64) {
		const binaryString = window.atob(base64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	function pcm16ToFloat32(arrayBuffer) {
		const int16Array = new Int16Array(arrayBuffer);
		const float32Array = new Float32Array(int16Array.length);
		for (let i = 0; i < int16Array.length; i++) {
			float32Array[i] = int16Array[i] / 32768.0;
		}
		return float32Array;
	}

	const AudioPlayback = {
		init({ onStateChange } = {}) {
			_onStateChange = onStateChange || null;
		},

		_ensureAudioContext() {
			if (!_audioCtx || _audioCtx.state === 'closed') {
				const AudioContextClass = window.AudioContext || window.webkitAudioContext;
				_audioCtx = new AudioContextClass({ sampleRate: 24000 });
			}
			if (_audioCtx.state === 'suspended') {
				_audioCtx.resume();
			}
			return _audioCtx;
		},

		isPlaying() {
			return _isPlaying;
		},

		_setPlaying(val) {
			if (_isPlaying !== val) {
				_isPlaying = val;
				if (_onStateChange) _onStateChange(_isPlaying);
			}
		},

		enqueueBase64Pcm(base64Data) {
			if (!base64Data) return;
			try {
				const buffer = base64ToArrayBuffer(base64Data);
				this.enqueueArrayBuffer(buffer);
			} catch (e) {
				console.warn('[AudioPlayback] Failed to decode base64 audio:', e);
			}
		},

		enqueueArrayBuffer(arrayBuffer) {
			const ctx = this._ensureAudioContext();
			const float32Data = pcm16ToFloat32(arrayBuffer);

			const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
			audioBuffer.getChannelData(0).set(float32Data);

			const source = ctx.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(ctx.destination);

			const now = ctx.currentTime;
			const startTime = Math.max(now, _nextPlayTime);
			source.start(startTime);
			_nextPlayTime = startTime + audioBuffer.duration;

			_scheduledSources.push(source);
			this._setPlaying(true);

			source.onended = () => {
				const idx = _scheduledSources.indexOf(source);
				if (idx !== -1) {
					_scheduledSources.splice(idx, 1);
				}
				if (_scheduledSources.length === 0 && ctx.currentTime >= _nextPlayTime) {
					this._setPlaying(false);
				}
			};
		},

		// Barge-in 발생 시 현재 재생 중인 모든 버퍼 즉시 중단 및 큐 초기화
		flush() {
			for (const src of _scheduledSources) {
				try {
					src.stop();
					src.disconnect();
				} catch (_) {}
			}
			_scheduledSources = [];
			if (_audioCtx) {
				_nextPlayTime = _audioCtx.currentTime;
			} else {
				_nextPlayTime = 0;
			}
			this._setPlaying(false);
		},

		close() {
			this.flush();
			if (_audioCtx) {
				try { _audioCtx.close(); } catch (_) {}
				_audioCtx = null;
			}
			this._setPlaying(false);
		}
	};

	SNW.AudioPlayback = AudioPlayback;

})(window, window.SNW);

