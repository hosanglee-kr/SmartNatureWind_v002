// =========================================================
// 032.util.log.js — SNW.LogUtil
// Layer 1 (유틸) — SNW.CFG 참조 (디버그 플래그)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	const PREFIX = '[SNW]';
	
	function isDebug() {
		try {
			return localStorage.getItem(SNW.CFG.LS_KEY.DEBUG) === '1';
		} catch { return false; }
	}
	
	SNW.LogUtil = {
		debug(...a) { if (isDebug()) console.debug(PREFIX, ...a); },
		info(...a) { console.info(PREFIX, ...a); },
		warn(...a) { console.warn(PREFIX, ...a); },
		error(...a) { console.error(PREFIX, ...a); }
	};
	
})(window.SNW);
