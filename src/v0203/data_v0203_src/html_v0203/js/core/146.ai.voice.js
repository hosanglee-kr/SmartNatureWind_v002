// =========================================================
// 146.ai.voice.js — SNW.AIVoice
// Layer 3 (음성 입력 STT & 음성 합성 TTS)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
	'use strict';

	let _currentRecognition = null;
	let _wakeRecognition = null;

	SNW.AIVoice = {
		isSTTSupported() {
			return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
		},

		isTTSSupported() {
			return ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
		},

		detectLang(text) {
			if (!text) return 'ko-KR';
			const koMatches = text.match(/[가-힣]/g) || [];
			const cleanLen = text.replace(/\s/g, '').length;
			if (cleanLen === 0) return 'ko-KR';
			return (koMatches.length / cleanLen > 0.2) ? 'ko-KR' : 'en-US';
		},

		startListening(opts = {}) {
			return new Promise((resolve, reject) => {
				if (!this.isSTTSupported()) {
					return reject(new Error('STT_NOT_SUPPORTED'));
				}

				this.stopListening();

				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				const rec = new SpeechRecognition();
				_currentRecognition = rec;

				rec.lang = opts.lang || 'ko-KR';
				rec.continuous = false;
				rec.interimResults = false;
				rec.maxAlternatives = 1;

				let finished = false;

				rec.onresult = (e) => {
					finished = true;
					const transcript = (e.results && e.results[0] && e.results[0][0])
						? e.results[0][0].transcript
						: '';
					resolve({ transcript });
				};

				rec.onerror = (e) => {
					finished = true;
					reject(new Error(e.error || 'STT_ERROR'));
				};

				rec.onend = () => {
					_currentRecognition = null;
					if (!finished) {
						resolve({ transcript: '' });
					}
				};

				try {
					rec.start();
				} catch (err) {
					reject(err);
				}
			});
		},

		stopListening() {
			if (_currentRecognition) {
				try { _currentRecognition.abort(); } catch { }
				_currentRecognition = null;
			}
		},

		speak(text, opts = {}) {
			if (!this.isTTSSupported() || !text) return;

			this.stopSpeaking();

			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = opts.lang || this.detectLang(text);
			utter.rate = opts.rate || 1.0;
			utter.pitch = opts.pitch || 1.0;

			// 최적 보이스 탐색
			try {
				const voices = window.speechSynthesis.getVoices() || [];
				const langPrefix = utter.lang.substring(0, 2);
				const matchedVoice = voices.find(v => v.lang.startsWith(langPrefix));
				if (matchedVoice) utter.voice = matchedVoice;
			} catch { }

			window.speechSynthesis.speak(utter);
		},

		stopSpeaking() {
			if (this.isTTSSupported()) {
				try { window.speechSynthesis.cancel(); } catch { }
			}
		},

		// =====================================================
		// 웨이크워드 감지 (옵션: "헤이 윈드", "hey wind")
		// =====================================================
		startWakeDetection(opts = {}) {
			if (!this.isSTTSupported()) return false;
			this.stopWakeDetection();

			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			const rec = new SpeechRecognition();
			_wakeRecognition = rec;

			rec.continuous = true;
			rec.interimResults = true;
			rec.lang = opts.lang || 'ko-KR';

			const wakeKeywords = ['헤이 윈드', '헤이윈드', '헤이 wind', 'hey wind', 'hi wind'];
			let isCooldown = false;

			rec.onresult = (e) => {
				if (isCooldown) return;
				for (let i = e.resultIndex; i < e.results.length; i++) {
					const transcript = (e.results[i][0].transcript || '').toLowerCase();
					const matched = wakeKeywords.some(w => transcript.includes(w));
					if (matched) {
						isCooldown = true;
						if (opts.onWake) opts.onWake();
						setTimeout(() => { isCooldown = false; }, 4000);
						break;
					}
				}
			};

			rec.onerror = (e) => {
				if (e.error !== 'no-speech' && opts.onError) opts.onError(e);
			};

			rec.onend = () => {
				if (_wakeRecognition === rec) {
					try { rec.start(); } catch { }
				}
			};

			try {
				rec.start();
				return true;
			} catch (err) {
				return false;
			}
		},

		stopWakeDetection() {
			if (_wakeRecognition) {
				const rec = _wakeRecognition;
				_wakeRecognition = null;
				try { rec.abort(); } catch { }
			}
		}
	};
})(window.SNW);

