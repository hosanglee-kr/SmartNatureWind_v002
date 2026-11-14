// =========================================================
// 117.ui.haptic.js — 햅틱 래퍼 (지원 감지 + 폴백)
// Layer 1 (UI 유틸)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.Haptic = {
        /** 지원 여부 */
        isSupported() {
            return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
        },

        /** 지원 시 실행, 미지원 시 무음 통과 */
        _vibrate(pattern) {
            if (!this.isSupported()) return false;
            try {
                return navigator.vibrate(pattern);
            } catch {
                return false;
            }
        },

        // =========================================================
        // 프리셋 패턴 (의도별)
        // =========================================================

        /** 단계 Snap (가벼운 톡) — 10ms */
        snap() {
            return this._vibrate(10);
        },

        /** ON/OFF (확실한 톡) — 30ms */
        toggle() {
            return this._vibrate(30);
        },

        /** Step 전환 (이중 리듬) — 10-20-10 */
        stepChange() {
            return this._vibrate([10, 20, 10]);
        },

        /** 저장/성공 (짧고 명확) — 20ms */
        success() {
            return this._vibrate(20);
        },

        /** 오류 (긴 진동) — 100ms */
        error() {
            return this._vibrate(100);
        },

        /** 경고 (이중 짧은) — 15-30-15 */
        warn() {
            return this._vibrate([15, 30, 15]);
        },

        /** 정지 (긴 단일) — 50ms */
        stop() {
            return this._vibrate(50);
        },
    };
})(window.SNW);

