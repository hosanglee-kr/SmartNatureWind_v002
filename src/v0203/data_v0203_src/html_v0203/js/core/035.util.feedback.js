// =========================================================
// 035.util.feedback.js — SNW.Feedback (정량적 물리 피드백 헬퍼)
// Layer 1 (유틸) — 0203_007 설계 기반
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    function _clamp(val, min = 0, max = 100) {
        const n = Number(val);
        if (!Number.isFinite(n)) return min;
        return Math.max(min, Math.min(max, n));
    }

    function _tr(key, params) {
        return (SNW.I18n && typeof SNW.I18n.t === 'function') ? SNW.I18n.t(key, params) : key;
    }

    SNW.Feedback = {
        /**
         * 바람 강도 (Intensity 0~100%) 실시간 정량 가이드
         */
        getIntensityGuide(val) {
            const v = _clamp(val);
            if (v <= 0) {
                return { title: _tr('feedback.intensity.off.title'), desc: _tr('feedback.intensity.off.desc') };
            }
            if (v <= 30) {
                const speed = (0.5 + (v / 30) * 1.0).toFixed(1);
                return { title: _tr('feedback.intensity.gentle.title', { speed }), desc: _tr('feedback.intensity.gentle.desc') };
            }
            if (v <= 70) {
                const speed = (1.5 + ((v - 30) / 40) * 2.0).toFixed(1);
                return { title: _tr('feedback.intensity.natural.title', { speed }), desc: _tr('feedback.intensity.natural.desc') };
            }
            const speed = (3.5 + ((v - 70) / 30) * 2.0).toFixed(1);
            return { title: _tr('feedback.intensity.strong.title', { speed }), desc: _tr('feedback.intensity.strong.desc') };
        },

        /**
         * 바람 변동성 (Variability 0~100%) 실시간 정량 가이드
         */
        getVariabilityGuide(val) {
            const v = _clamp(val);
            if (v <= 30) {
                return { title: _tr('feedback.variability.low.title'), desc: _tr('feedback.variability.low.desc') };
            }
            if (v <= 70) {
                return { title: _tr('feedback.variability.mid.title'), desc: _tr('feedback.variability.mid.desc') };
            }
            return { title: _tr('feedback.variability.high.title'), desc: _tr('feedback.variability.high.desc') };
        },

        /**
         * 돌풍 빈도 (Gust Frequency 0~100%) 실시간 정량 가이드
         */
        getGustGuide(val) {
            const v = _clamp(val);
            if (v <= 0) {
                return { title: _tr('feedback.gust.none.title'), desc: _tr('feedback.gust.none.desc') };
            }
            if (v <= 20) {
                return { title: _tr('feedback.gust.low.title'), desc: _tr('feedback.gust.low.desc') };
            }
            if (v <= 60) {
                return { title: _tr('feedback.gust.mid.title'), desc: _tr('feedback.gust.mid.desc') };
            }
            return { title: _tr('feedback.gust.high.title'), desc: _tr('feedback.gust.high.desc') };
        }
    };
})(window.SNW);
