// =========================================================
// 135.util.preview.js — 물리 파형 미리보기 (S20 미러)
// Layer 1 (유틸리티 엔진)
// - 실제 팬 미가동, 클라이언트에서 물리 파형 시뮬레이션
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    // 캐시 (한 번 로드 후 재사용)
    let _windDict = null;
    let _loading = null;

    async function ensureWindDict() {
        if (_windDict) return _windDict;
        if (_loading) return _loading;
        _loading = SNW.Api.getWindDict().then(d => {
            _windDict = d || { presets: [], styles: [] };
            return _windDict;
        }).catch(() => {
            _windDict = { presets: [], styles: [] };
            return _windDict;
        });
        return _loading;
    }

    function findPreset(code) {
        if (!_windDict || !_windDict.presets) return null;
        return _windDict.presets.find(p => p.code === code) || null;
    }

    function findStyle(code) {
        if (!_windDict || !_windDict.styles) return null;
        return _windDict.styles.find(s => s.code === code) || null;
    }

    // =========================================================
    // 물리 파라미터 계산 (S20 미러)
    // =========================================================
    function resolveParams(presetCode, styleCode, override) {
        const preset = findPreset(presetCode);
        const style = findStyle(styleCode || 'BALANCE');
        if (!preset) return null;

        const pf = preset.factors || {};
        const sf = style ? style.factors : { intensityFactor: 1, variabilityFactor: 1, gustFactor: 1 };
        const ov = override || { enabled: false };

        // 강도
        let intensity = (pf.windIntensity || 50) * (sf.intensityFactor || 1);
        if (ov.enabled && ov.windIntensity >= 0) intensity = ov.windIntensity;
        intensity = Math.max(0, Math.min(100, intensity));

        // 변동성
        let variability = (pf.windVariability || 40) * (sf.variabilityFactor || 1);
        if (ov.enabled && ov.windVariability >= 0) variability = ov.windVariability;
        variability = Math.max(0, Math.min(100, variability));

        // 돌풍
        let gustFreq = (pf.gustFrequency || 30) * (sf.gustFactor || 1);
        if (ov.enabled && ov.gustFrequency >= 0) gustFreq = ov.gustFrequency;
        gustFreq = Math.max(0, Math.min(100, gustFreq));

        // 물리 파라미터
        const baseMin = pf.baseMinWind || 1.0;
        const baseMax = pf.baseMaxWind || 5.0;
        const turbSigma = pf.turbulenceIntensitySigma || 0.5;
        const thermalStr = pf.thermalBubbleStrength || 2.0;

        return { intensity, variability, gustFreq, baseMin, baseMax, turbSigma, thermalStr };
    }

    // =========================================================
    // 30초 파형 생성 (100ms × 300 샘플)
    // =========================================================
    function generateWaveform(params) {
        if (!params) return null;

        const { intensity, variability, gustFreq, baseMin, baseMax, turbSigma } = params;

        // 평균 풍속 (강도 기반)
        const avg = baseMin + (baseMax - baseMin) * (intensity / 100);

        // 난류 진폭 (변동성 기반)
        const turbAmp = (variability / 100) * (baseMax - baseMin) * turbSigma;

        // 돌풍 확률 (100ms당)
        const gustProb = (gustFreq / 100) * 0.02;
        const gustMul  = 1.8;

        const points = [];
        let gustRemain = 0;

        for (let i = 0; i < 300; i++) {
            const t = i * 100;  // ms

            // 다중 사인파 난류
            const turb =
                Math.sin(t * 0.0015) * turbAmp * 0.5 +
                Math.sin(t * 0.0053) * turbAmp * 0.3 +
                Math.sin(t * 0.0121) * turbAmp * 0.2;

            // 돌풍
            let gustBoost = 0;
            if (gustRemain > 0) {
                gustBoost = avg * (gustMul - 1) * 0.6;
                gustRemain--;
            } else if (Math.random() < gustProb) {
                gustRemain = 5 + Math.floor(Math.random() * 15);
            }

            const wind = Math.max(0.2, Math.min(11.0, avg + turb + gustBoost));

            points.push({
                t,
                wind: Number(wind.toFixed(2)),
                gust: gustBoost > 0,
            });
        }

        return { points, avg: Number(avg.toFixed(2)), intensity, variability, gustFreq };
    }

    // =========================================================
    // Public API
    // =========================================================
    SNW.Preview = {
        async init() {
            await ensureWindDict();
        },

        /**
         * 단일 Step의 예상 파형
         * @param {Object} step ST_A20_Step_t
         * @returns {Promise<{points, avg, intensity, variability, gustFreq} | null>}
         */
        async generateStep(step) {
            await ensureWindDict();

            if (!step) return null;

            // REST: 완전 정지
            if (step.type === 'REST') {
                const points = [];
                for (let i = 0; i < 300; i++) {
                    points.push({ t: i * 100, wind: 0, gust: false });
                }
                return { points, avg: 0, intensity: 0, variability: 0, gustFreq: 0 };
            }

            // FIXED: 고정 PWM
            if (step.type === 'FIXED') {
                const speed = Number(step.fixedSpeed) || 0;
                const windEquivalent = (speed / 100) * 8;   // PWM% → m/s 근사
                const points = [];
                for (let i = 0; i < 300; i++) {
                    points.push({ t: i * 100, wind: windEquivalent, gust: false });
                }
                return { points, avg: Number(windEquivalent.toFixed(2)), intensity: speed, variability: 0, gustFreq: 0 };
            }

            // PRESET: 물리 시뮬레이션
            const params = resolveParams(
                step.presetCode || 'OCEAN',
                step.styleCode  || 'BALANCE',
                step.override);
            if (!params) return null;

            return generateWaveform(params);
        },

        /**
         * 여러 Step을 연결한 Playlist 전체 파형 (30초 압축)
         * @param {Array} steps
         * @returns {Promise<{points}>}
         */
        async generatePlaylistWaveform(steps) {
            await ensureWindDict();

            if (!steps || steps.length === 0) return null;

            const total = 300;
            const perStep = Math.floor(total / steps.length);
            const allPoints = [];

            for (let i = 0; i < steps.length; i++) {
                const wave = await this.generateStep(steps[i]);
                if (!wave) continue;

                // 각 Step 파형을 perStep 샘플로 다운샘플
                const stepSamples = Math.min(perStep, wave.points.length);
                for (let j = 0; j < stepSamples; j++) {
                    const idx = Math.floor((j / stepSamples) * wave.points.length);
                    allPoints.push(wave.points[idx]);
                }
            }

            // 시간 재부여
            allPoints.forEach((p, i) => { p.t = i * 100; });

            return { points: allPoints };
        },

        /**
         * 5축 감성 레이더
         */
        toFeelings(intensity, variability, gustFreq) {
            const clamp = v => Math.max(0, Math.min(5, Math.round(v)));
            return {
                coolness:   clamp(intensity / 20),                    // 시원함
                smoothness: clamp(5 - variability / 20),              // 부드러움
                dynamism:   clamp((variability + gustFreq) / 40),     // 역동성
                calmness:   clamp(5 - (intensity + gustFreq) / 40),   // 차분함
                freshness:  clamp((intensity + gustFreq) / 40),       // 청량감
            };
        },

        // =========================================================
        // [ADR-5] 파사드 API (Studio / Schedule / Simulation 통합)
        // =========================================================
        async showModal(config) {
            if (!SNW.UI || typeof SNW.UI.simulationModal !== 'function') {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Preview] simulationModal 미로드');
                return null;
            }

            const isSegmentForm = config && config.presetCode && !config.a && !config.mode;
            const normalized = isSegmentForm
                ? {
                    mode: 'single',
                    a: {
                        presetCode: config.presetCode || 'OCEAN',
                        styleCode:  config.styleCode  || 'BALANCE',
                        override:   config.override   || { enabled: false },
                    },
                }
                : config;

            return SNW.UI.simulationModal(normalized);
        },

        async generate(presetCode, styleCode, override) {
            return this.generateStep({
                type:       'PRESET',
                presetCode: presetCode || 'OCEAN',
                styleCode:  styleCode  || 'BALANCE',
                override:   override   || { enabled: false },
            });
        },

        _animate(canvas, points) {
            if (!canvas || !points || points.length === 0) return;

            const ctx = canvas.getContext('2d');
            const w   = canvas.width;
            const h   = canvas.height;

            let minV = Infinity, maxV = -Infinity;
            for (const p of points) {
                const v = Number(p.wind) || 0;
                if (v < minV) minV = v;
                if (v > maxV) maxV = v;
            }
            if (!Number.isFinite(minV) || !Number.isFinite(maxV) || maxV <= minV) {
                minV = 0; maxV = 1;
            }

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(139,148,158,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = (h / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            const pad = 10;
            const innerH = h - pad * 2;
            const n = points.length;

            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const x = (i / (n - 1)) * w;
                const y = pad + (h - pad * 2) - ((points[i].wind - minV) / (maxV - minV)) * innerH;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = 'rgba(240,136,62,0.9)';
            for (let i = 0; i < n; i++) {
                if (!points[i].gust) continue;
                const x = (i / (n - 1)) * w;
                const y = pad + (h - pad * 2) - ((points[i].wind - minV) / (maxV - minV)) * innerH;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        },
    };
})(window.SNW);
