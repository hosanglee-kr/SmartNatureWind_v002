/*
 * ------------------------------------------------------
 * 소스명 : 147a.audio.capture.js
 * 모듈약어 : SNW.AudioCapture
 * 모듈명 : Smart Nature Wind Audio Input & PCM16 Streamer (Live AEC)
 * ------------------------------------------------------
 * 기능 요약:
 *  - 마이크 캡처 (AEC/노이즈 캔슬레이션/자동 게인)
 *  - 인라인 Blob URL 기반 AudioWorklet (단일 번들 404 방지)
 *  - 16kHz, 16-bit PCM 모노 인코딩 및 base64 스트리밍
 *  - 실시간 볼륨 메터링 (UI 애니메이션 연동)
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _audioCtx = null;
	let _mediaStream = null;
	let _sourceNode = null;
	let _workletNode = null;
	let _analyserNode = null;
	let _animId = null;
	let _isCapturing = false;

	// 인라인 AudioWorklet 소스 (Float32 -> Int16 변환)
	const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.bufferSize = 2048; // ~128ms at 16kHz
		this.buffer = new Int16Array(this.bufferSize);
		this.offset = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		if (!input || !input[0]) return true;
		const channel = input[0];

		for (let i = 0; i < channel.length; i++) {
			// Float32 [-1.0, 1.0] -> Int16 [-32768, 32767]
			let s = Math.max(-1, Math.min(1, channel[i]));
			this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

			if (this.offset >= this.bufferSize) {
				this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
				this.buffer = new Int16Array(this.bufferSize);
				this.offset = 0;
			}
		}
		return true;
	}
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

	function arrayBufferToBase64(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}

	const AudioCapture = {
		isSupported() {
			return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.AudioContext);
		},

		isCapturing() {
			return _isCapturing;
		},

		async start({ onChunk, onVolume, onError } = {}) {
			if (_isCapturing) return true;
			if (!this.isSupported()) {
				const err = new Error('Audio recording not supported in this browser');
				if (onError) onError(err);
				throw err;
			}

			try {
				// 1. 마이크 스트림 획득 (AEC 활성화)
				_mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: {
						channelCount: 1,
						sampleRate: 16000,
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					},
					video: false
				});

				// 2. 16kHz AudioContext 생성
				const AudioContextClass = window.AudioContext || window.webkitAudioContext;
				_audioCtx = new AudioContextClass({ sampleRate: 16000 });
				if (_audioCtx.state === 'suspended') {
					await _audioCtx.resume();
				}

				// 3. 인라인 Blob URL 기반 AudioWorklet 등록
				const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
				const workletUrl = URL.createObjectURL(blob);
				try {
					await _audioCtx.audioWorklet.addModule(workletUrl);
				} finally {
					URL.revokeObjectURL(workletUrl);
				}

				// 4. 노드 연결
				_sourceNode = _audioCtx.createMediaStreamSource(_mediaStream);
				_workletNode = new AudioWorkletNode(_audioCtx, 'pcm-capture-processor');

				// 볼륨 분석기
				_analyserNode = _audioCtx.createAnalyser();
				_analyserNode.fftSize = 256;
				_sourceNode.connect(_analyserNode);
				_sourceNode.connect(_workletNode);

				// 5. PCM 청크 수신 이벤트
				_workletNode.port.onmessage = (event) => {
					if (!_isCapturing) return;
					const pcmBuffer = event.data; // ArrayBuffer (Int16)
					const base64Pcm = arrayBufferToBase64(pcmBuffer);
					if (onChunk) {
						onChunk(base64Pcm, pcmBuffer);
					}
				};

				// 6. 실시간 볼륨 미터링 루프
				if (onVolume) {
					const pcmData = new Uint8Array(_analyserNode.frequencyBinCount);
					const updateMeter = () => {
						if (!_isCapturing) return;
						_analyserNode.getByteFrequencyData(pcmData);
						let sum = 0;
						for (let i = 0; i < pcmData.length; i++) {
							sum += pcmData[i];
						}
						const avg = sum / pcmData.length;
						const norm = Math.min(1.0, avg / 128.0);
						onVolume(norm);
						_animId = requestAnimationFrame(updateMeter);
					};
					_animId = requestAnimationFrame(updateMeter);
				}

				_isCapturing = true;
				return true;
			} catch (e) {
				this.stop();
				if (onError) onError(e);
				throw e;
			}
		},

		stop() {
			_isCapturing = false;

			if (_animId) {
				cancelAnimationFrame(_animId);
				_animId = null;
			}

			if (_workletNode) {
				try {
					_workletNode.port.onmessage = null;
					_workletNode.disconnect();
				} catch (_) {}
				_workletNode = null;
			}

			if (_analyserNode) {
				try { _analyserNode.disconnect(); } catch (_) {}
				_analyserNode = null;
			}

			if (_sourceNode) {
				try { _sourceNode.disconnect(); } catch (_) {}
				_sourceNode = null;
			}

			if (_mediaStream) {
				try {
					_mediaStream.getTracks().forEach(t => t.stop());
				} catch (_) {}
				_mediaStream = null;
			}

			if (_audioCtx) {
				try {
					_audioCtx.close();
				} catch (_) {}
				_audioCtx = null;
			}
		}
	};

	SNW.AudioCapture = AudioCapture;

})(window, window.SNW);

