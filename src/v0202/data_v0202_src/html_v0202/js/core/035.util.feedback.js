// =========================================================
// 035.util.feedback.js — SNW.Feedback (정량적 물리 피드백 헬퍼)
// Layer 1 (유틸) — 0202_007 설계 기반
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.Feedback = {
        /**
         * 바람 강도 (Intensity 0~100%) 실시간 정량 가이드
         */
        getIntensityGuide(val) {
            const isEn = (SNW.I18n && SNW.I18n.getLang() === 'en');
            const v = Number(val) || 0;
            if (v <= 0) {
                return {
                    title: isEn ? '0.0 m/s · Fan Stopped' : '0.0 m/s · 팬 정지',
                    desc: isEn ? 'Fan motor is in standby mode.' : '팬 모터가 대기 상태입니다.'
                };
            }
            if (v <= 30) {
                const speed = (0.5 + (v / 30) * 1.0).toFixed(1);
                return {
                    title: isEn ? `Approx ${speed} m/s (Gentle / Sleep)` : `체감 약 ${speed} m/s (초미풍 · 수면풍)`,
                    desc: isEn
                        ? 'Gentle breeze comparable to fanning (ideal for sleep or infants, quiet <25dB)'
                        : '부채질 수준의 고요한 미풍 (수면 시 또는 영유아에 적합, 저소음 <25dB)'
                };
            }
            if (v <= 70) {
                const speed = (1.5 + ((v - 30) / 40) * 2.0).toFixed(1);
                return {
                    title: isEn ? `Approx ${speed} m/s (Natural Breeze · Stage 1-2)` : `체감 약 ${speed} m/s (표준 자연풍 · 1~2단)`,
                    desc: isEn
                        ? 'Pleasant fluttering breeze (most comfortable for daily living and relaxation)'
                        : '나뭇잎이 살랑거리는 기분 좋은 산들바람 (일상 생활 및 휴식에 가장 쾌적)'
                };
            }
            const speed = (3.5 + ((v - 70) / 30) * 2.0).toFixed(1);
            return {
                title: isEn ? `Approx ${speed} m/s (Strong Wind · Stage 3-4)` : `체감 약 ${speed} m/s (강풍 · 급속 환기 3~4단)`,
                desc: isEn
                    ? 'Cool open-window breeze (ideal after workouts or quick cooling)'
                    : '창문을 열었을 때 부는 시원한 야외 바람 (운동 직후나 빠른 환기에 적합)'
            };
        },

        /**
         * 바람 변동성 (Variability 0~100%) 실시간 정량 가이드
         */
        getVariabilityGuide(val) {
            const isEn = (SNW.I18n && SNW.I18n.getLang() === 'en');
            const v = Number(val) || 0;
            if (v <= 30) {
                return {
                    title: isEn ? 'Transition ~10-15s (Delta <10%)' : '풍속 전환 약 10~15초 소요 (변화폭 <10%)',
                    desc: isEn
                        ? 'Wind changes very slowly, maintaining a smooth and steady flow.'
                        : '바람 세기가 천천히 바뀌어 체감상 거의 일정하고 부드럽습니다.'
                };
            }
            if (v <= 70) {
                return {
                    title: isEn ? 'Transition ~5-8s (Delta ±30%)' : '풍속 전환 약 5~8초 소요 (변화폭 ±30%)',
                    desc: isEn
                        ? 'Rhythmic fluctuation like a forest breeze every 5-8s.'
                        : '숲속 바람처럼 5~8초 간격으로 오르내리며 자연스러운 리듬감을 줍니다.'
                };
            }
            return {
                title: isEn ? 'Transition ~2-4s (Delta up to ±60%)' : '풍속 전환 약 2~4초 소요 (변화폭 최대 ±60%)',
                desc: isEn
                    ? 'Rapid 2-4s velocity changes creating dynamic coastal or valley winds.'
                    : '2~3초 만에 풍속이 급격히 전환되어 계곡이나 해변처럼 역동적입니다.'
            };
        },

        /**
         * 돌풍 빈도 (Gust Frequency 0~100%) 실시간 정량 가이드
         */
        getGustGuide(val) {
            const isEn = (SNW.I18n && SNW.I18n.getLang() === 'en');
            const v = Number(val) || 0;
            if (v <= 0) {
                return {
                    title: isEn ? 'No Gust (Base flow only)' : '돌풍 없음 (기본 기류만 유지)',
                    desc: isEn
                        ? 'Maintains gentle airflow without sudden gusts.'
                        : '돌풍 없이 평온한 기류만 부드럽게 유지됩니다.'
                };
            }
            if (v <= 20) {
                return {
                    title: isEn ? 'Inflow every ~60-120s (1-2 min)' : '약 60~120초(1~2분)에 1회 유입',
                    desc: isEn
                        ? 'Rare gentle gusts suitable for sleep or quiet focus.'
                        : '가벼운 돌풍이 드물게 지나가 수면이나 독서에 방해되지 않습니다.'
                };
            }
            if (v <= 60) {
                return {
                    title: isEn ? 'Inflow every ~30-50s (Peak ×1.5~2.0)' : '약 30~50초에 1회 유입 (순간 풍속 ×1.5~2.0배)',
                    desc: isEn
                        ? 'Refreshing bursts every 30-50s relieving stuffiness.'
                        : '30~45초마다 시원한 바람이 훅 불어와 답답함을 해소해 줍니다.'
                };
            }
            return {
                title: isEn ? 'Inflow every ~15-25s (Peak up to ×2.5)' : '약 15~25초에 1회 유입 (순간 풍속 최대 ×2.5배)',
                desc: isEn
                    ? 'Frequent energetic gusts giving an invigorating hilltop sensation.'
                    : '15~20초마다 강력한 돌풍이 연속 유입되어 야외 언덕에 있는 듯 상쾌합니다.'
            };
        }
    };
})(window.SNW);
