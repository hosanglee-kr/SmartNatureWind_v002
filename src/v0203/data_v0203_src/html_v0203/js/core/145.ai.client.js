// =========================================================
// 145.ai.client.js — SNW.AIClient
// Layer 3 (코어 UI / AI 통신 클라이언트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';

	const CACHE_MAX = 20;
	const HISTORY_MAX = 20;
	const STORAGE_KEY = 'snw.ai.history';

	const _cache = new Map();
	let _pendingPromise = null;

	SNW.AIClient = {
		loadHistory() {
			try {
				const s = localStorage.getItem(STORAGE_KEY);
				return s ? JSON.parse(s).slice(-HISTORY_MAX) : [];
			} catch {
				return [];
			}
		},

		saveHistory(hist) {
			try {
				if (!Array.isArray(hist)) return;
				localStorage.setItem(STORAGE_KEY, JSON.stringify(hist.slice(-HISTORY_MAX)));
			} catch {}
		},

		clearHistory() {
			try {
				localStorage.removeItem(STORAGE_KEY);
				_cache.clear();
			} catch {}
		},

		async send(message, history = [], opts = {}) {
			const text = (message || '').trim();
			if (!text) return null;

			const lang = opts.lang || 'ko';
			const voiceMode = !!opts.voiceMode;
			const cacheKey = `${text}|${history.length}|${lang}|${voiceMode ? 'v' : 't'}`;

			if (_cache.has(cacheKey)) {
				const entry = _cache.get(cacheKey);
				if (Date.now() - entry.ts < 60000) {
					return entry.data;
				}
				_cache.delete(cacheKey);
			}

			if (_pendingPromise) return _pendingPromise;

			_pendingPromise = (async () => {
				try {
					const body = {
						message: text,
						history: history.slice(-6),
						lang: lang,
						voiceMode: voiceMode
					};
					const res = await SNW.Api.gemini(body);

					_cache.set(cacheKey, { ts: Date.now(), data: res });
					if (_cache.size > CACHE_MAX) {
						const firstKey = _cache.keys().next().value;
						_cache.delete(firstKey);
					}
					return res;
				} finally {
					_pendingPromise = null;
				}
			})();

			return _pendingPromise;
		}
	};
})(window.SNW);

