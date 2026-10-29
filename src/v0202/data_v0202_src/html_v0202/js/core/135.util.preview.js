// =========================================================
// 135.util.preview.js — SNW.Preview (가상 미리보기 엔진 + 정성 라벨)
// Layer 1 (유틸) — 998.offline의 resolvePreset 재활용
// [SIM-2] 30초 파형 시뮬레이션 (프론트 간이 엔진, ±10% 오차 명시)
// [SIM-8] "느낌" 5점 정성 라벨 (시원함/부드러움/역동성)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.Preview = {
        // ---------------------------------------------
        // [SIM-2] 30초 파형 시뮬레이션
        //  - preset × style factor 계산 (백엔드 S20 미러)
        //  - 100ms 해상도로 300개 포인트 생성
        // ---------------------------------------------
        generate(presetCode, styleCode, override) {
            const presets = SNW.Store.get()._presetsCache || [];
            const styles = SNW.Store.get()._stylesCache || [];
            const p = presets.find(x => x.code === presetCode);
            const s = styles.find(x => x.code === (styleCode || 'BALANCE'));
            if (!p || !s) return null;

            const pf = p.factors || {};
            const sf = s.factors || {};
            const ov = override || { enabled: false };

            const mul = (base, f, ovr) => {
                if (ov.enabled && ovr != null && ovr >= 0) return ovr;
                return (base ?? 50) * (f ?? 1);
            };

            const intensity = Math.max(0, Math.min(100,
                mul(pf.windIntensity, sf.intensityFactor, ov.windIntensity)));
            const variability = Math.max(0, Math.min(100,
                mul(pf.windVariability, sf.variabilityFactor, ov.windVariability)));
            const gustFreq = Math.max(0, Math.min(100,
                mul(pf.gustFrequency, sf.gustFactor, ov.gustFrequency)));

            const baseMin = pf.baseMinWind ?? 1.8;
            const baseMax = pf.baseMaxWind ?? 5.5;
            const avg = baseMin + (baseMax - baseMin) * (intensity / 100);
            const turbAmp = (variability / 100) * (baseMax - baseMin) * 0.3;
            const gustProb = (gustFreq / 100) * 0.03;  // 100ms당 3% × gustFreq%
            const gustMul = pf.gustStrengthMax ?? 2.0;

            const points = [];
            let gustActive = false;
            let gustRemain = 0;

            for (let i = 0; i < 300; i++) {  // 30초 × 10Hz
                const t = i * 100;
                // 난류 (sin 합성, 3개 주파수)
                const turb = Math.sin(t * 0.002) * turbAmp * 0.5
                    + Math.sin(t * 0.0071) * turbAmp * 0.3
                    + Math.sin(t * 0.0137) * turbAmp * 0.2;

                // 돌풍 발생
                if (!gustActive && Math.random() < gustProb) {
                    gustActive = true;
                    gustRemain = 5 + Math.floor(Math.random() * 20);  // 0.5~2.5초
                }

                let gustBoost = 0;
                if (gustActive) {
                    gustBoost = avg * (gustMul - 1) * 0.7;
                    if (--gustRemain <= 0) gustActive = false;
                }

                const wind = Math.max(0.2, Math.min(11.0, avg + turb + gustBoost));
                points.push({
                    t,
                    wind: Number(wind.toFixed(2)),
                    avg: Number(avg.toFixed(2)),
                    gust: gustBoost > 0,
                    intensity, variability, gustFreq
                });
            }
            return { points, avg, intensity, variability, gustFreq };
        },

        // ---------------------------------------------
        // [SIM-8] 정성 라벨 (시원함/부드러움/역동성 0~5)
        // ---------------------------------------------
        toFeelings(intensity, variability, gustFreq) {
            const clamp = v => Math.max(0, Math.min(5, Math.round(v)));
            return {
                coolness: clamp(intensity / 20),                    // 시원함
                smoothness: clamp(5 - variability / 20),             // 부드러움 (변동성 반비례)
                dynamism: clamp((variability + gustFreq) / 40),    // 역동성
                calmness: clamp(5 - (intensity + gustFreq) / 40)   // 차분함
            };
        },

        // ---------------------------------------------
        // 라벨 → i18n 문자열
        // ---------------------------------------------
        labelFor(key) {
            return SNW.I18n.t('preview.feel.' + key);
        },
        // ---------------------------------------------
        // [SIM-5] 세그먼트 미리보기 (세그먼트의 preset/style/override로 파형)
        // ---------------------------------------------
        segmentPreview(segment) {
            if (!segment) return null;
            if (segment.mode === 'FIXED') {
                const speed = Number(segment.fixedSpeed) || 0;
                const points = [];
                for (let i = 0; i < 300; i++) {
                    points.push({
                        t: i * 100, wind: speed / 10, avg: speed / 10, gust: false,
                        intensity: speed, variability: 0, gustFreq: 0
                    });
                }
                return { points, avg: speed / 10, intensity: speed, variability: 0, gustFreq: 0, fixedMode: true };
            }
            const ovr = segment.override || { enabled: false };
            return this.generate(
                segment.presetCode || 'OCEAN',
                segment.styleCode  || 'BALANCE',
                ovr.enabled ? ovr : null
            );
        },

        showModal(segData) {
            const pv = this.segmentPreview(segData);
            if (!pv) return;
            const content = document.createElement('div');
            content.innerHTML = `
                <canvas data-seg-pv width="500" height="160"
                        style="width:100%;background:var(--snw-bg-2);border-radius:6px;"></canvas>
                <div style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);">
                    🎬 예상 파형 (±10% 오차) ·
                    <b>${segData.mode === 'FIXED' ? '고정 ' + segData.fixedSpeed + '%' : (segData.presetCode || 'OCEAN') + ' · ' + (segData.styleCode || 'BALANCE')}</b>
                </div>
                <div style="margin-top:8px;font-size:12px;color:var(--snw-text-dim);">
                    평균 ${pv.avg} m/s · 강도 ${Math.round(pv.intensity)}% ·
                    변동 ${Math.round(pv.variability)}% · 돌풍 ${Math.round(pv.gustFreq)}%
                </div>
            `;
            SNW.UI.modal('🎬 세그먼트 미리보기', content, () => true, null,
                         { okLabel: '닫기', hideCancel: true, width: '540px' });
            this._animate(content.querySelector('[data-seg-pv]'), pv.points);
        },

        _animate(canvas, points) {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            let min = Infinity, max = -Infinity;
            points.forEach(p => { if (p.wind < min) min = p.wind; if (p.wind > max) max = p.wind; });
            if (max <= min) max = min + 1;
            let drawn = 0;
            const drawNext = () => {
                if (drawn >= points.length || !canvas.isConnected) return;
                ctx.clearRect(0, 0, w, h);
                ctx.strokeStyle = 'rgba(139,148,158,0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = (h / 4) * i;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(74,158,255,1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= drawn; i++) {
                    const p = points[i];
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.wind - min) / (max - min)) * (h - 20) - 10;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
                for (let i = 0; i <= drawn; i++) {
                    if (!points[i].gust) continue;
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((points[i].wind - min) / (max - min)) * (h - 20) - 10;
                    ctx.fillStyle = 'rgba(240,136,62,0.9)';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                drawn += 3;
                setTimeout(drawNext, 30);
            };
            drawNext();
        },

    };
})(window.SNW);

