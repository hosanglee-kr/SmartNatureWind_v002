// =========================================================
// 120.ui.chart.js — SNW.UI.chart (Canvas 2D)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - mini/full 통합 (maxPoints로 결정)
//  - 시리즈: { key, color, labelKey, unitKey? }
//  - push(point), clear(), setMaxPoints(), destroy()
//  - devicePixelRatio 대응 (선명한 렌더)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * 차트
     * @param {object} opts
     *   root       : HTMLElement
     *   maxPoints  : number (기본 SNW.CFG.UI.MINI_CHART_POINTS = 120)
     *   series     : [{ key, color, labelKey }]
     *   yMin, yMax : number (고정 범위, 미지정 시 자동)
     * @returns {{push, clear, setMaxPoints, destroy}}
     */
    SNW.UI.chart = function (opts) {
        const {
            root,
            maxPoints = SNW.CFG.UI.MINI_CHART_POINTS,
            series = SNW.CFG.UI.MINI_CHART_SERIES,
            yMin = null,
            yMax = null
        } = opts || {};

        if (!root) return { push: () => { }, clear: () => { }, setMaxPoints: () => { }, destroy: () => { } };

        root.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'snw-chart-canvas';
        root.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // DPR 대응
        let dpr = window.devicePixelRatio || 1;
        let cw = 0, ch = 0;

        const buffers = {};
        series.forEach(s => { buffers[s.key] = []; });

        let curMaxPoints = maxPoints;

        function resize() {
            const rect = root.getBoundingClientRect();
            cw = Math.max(200, Math.floor(rect.width || root.clientWidth || 800));
            ch = Math.max(80, Math.floor(rect.height || root.clientHeight || 200));
            canvas.width = Math.floor(cw * dpr);
            canvas.height = Math.floor(ch * dpr);
            canvas.style.width = cw + 'px';
            canvas.style.height = ch + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        }

        function push(point) {
            series.forEach(s => {
                const arr = buffers[s.key];
                const v = (point && point[s.key]);
                arr.push({ x: (point && point.t) || Date.now(), y: v });
                if (arr.length > curMaxPoints) arr.shift();
            });
            draw();
        }

        function clear() {
            series.forEach(s => { buffers[s.key] = []; });
            gustExpanded = false;
            draw();
        }

        function _drawSeries(arr, color) {
            if (arr.length < 2) return;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < arr.length; i++) {
                const p = arr[i];
                const x = (i / (curMaxPoints - 1)) * cw;
                const y = ch - p.py;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        let hoverIdx = -1;
        let gustExpanded = false;

        function updateHover(clientX) {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width) return;
            const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
            hoverIdx = Math.round((relX / rect.width) * (curMaxPoints - 1));
            draw();
        }
        canvas.addEventListener('pointermove', (e) => updateHover(e.clientX));
        canvas.addEventListener('pointerdown', (e) => updateHover(e.clientX));
        canvas.addEventListener('pointerleave', () => { hoverIdx = -1; draw(); });

        function draw() {
            ctx.clearRect(0, 0, cw, ch);

            // 돌풍(>8.0 m/s) 감지 시 12.0 m/s 계단 확장, 기본 0.0~8.0 m/s 고정
            let maxWindVal = 0;
            ['windSpeed', 'targetWind'].forEach(k => {
                (buffers[k] || []).forEach(p => {
                    if (Number.isFinite(p.y) && p.y > maxWindVal) maxWindVal = p.y;
                });
            });
            if (maxWindVal > 8.0) gustExpanded = true;
            const windMin = (yMin != null) ? yMin : 0.0;
            const windMax = (yMax != null) ? yMax : (gustExpanded ? 12.0 : 8.0);

            const padL = 34, padR = 38, padT = 16, padB = 24;
            const innerW = Math.max(40, cw - padL - padR);
            const innerH = Math.max(40, ch - padT - padB);
            const yRange = Math.max(1, windMax - windMin);

            // 좌측 Y축 정량 눈금(2.0 m/s 단위) & 우측 PWM(0~100%) 라벨
            ctx.font = '10px monospace';
            ctx.fillStyle = '#8b949e';
            const stepUnit = 2.0;
            for (let v = windMin; v <= windMax + 0.01; v += stepUnit) {
                const ratio = (v - windMin) / yRange;
                const y = padT + innerH - ratio * innerH;
                ctx.strokeStyle = 'rgba(139,148,158,0.14)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + innerW, y); ctx.stroke();

                ctx.textAlign = 'right';
                ctx.fillText(v.toFixed(1), padL - 4, y + 3);

                ctx.textAlign = 'left';
                ctx.fillText(Math.round(ratio * 100) + '%', padL + innerW + 4, y + 3);
            }

            // 3대 기준 보조선 (2.0 / 5.0 / 7.0 m/s)
            [
                { v: 2.0, color: 'rgba(45,212,191,0.45)' },
                { v: 5.0, color: 'rgba(63,185,80,0.45)' },
                { v: 7.0, color: 'rgba(240,136,62,0.55)' }
            ].forEach(ref => {
                if (ref.v > windMax) return;
                const y = padT + innerH - ((ref.v - windMin) / yRange) * innerH;
                ctx.save();
                ctx.strokeStyle = ref.color;
                ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + innerW, y); ctx.stroke();
                ctx.restore();
            });

            // 시리즈별 축 분리 렌더링 (pwmDuty: 우측 0~100%, 풍속: 좌측 windMin~windMax)
            series.forEach(s => {
                const isPwm = (s.key === 'pwmDuty');
                const arr = buffers[s.key] || [];
                if (arr.length < 2) return;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.beginPath();
                arr.forEach((p, i) => {
                    const val = Number.isFinite(p.y) ? p.y : 0;
                    const ratio = isPwm ? (val / 100) : ((val - windMin) / yRange);
                    const x = padL + (i / (curMaxPoints - 1)) * innerW;
                    const y = padT + innerH - Math.max(0, Math.min(1, ratio)) * innerH;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();
            });

            // 하단 X축 시간 라벨 (좌/중/우)
            const wArr = buffers.windSpeed || [];
            if (wArr.length >= 2) {
                const fmtTime = (ts) => {
                    if (!Number.isFinite(ts) || ts < 1e11) return '';
                    const d = new Date(ts);
                    return d.toTimeString().slice(0, 8);
                };
                ctx.fillStyle = '#8b949e';
                ctx.font = '10px monospace';
                const yLbl = padT + innerH + 15;
                const tStart = fmtTime(wArr[0].x);
                const tMid = fmtTime(wArr[Math.floor(wArr.length / 2)].x);
                const tEnd = fmtTime(wArr[wArr.length - 1].x);
                if (tStart) {
                    ctx.textAlign = 'left';
                    ctx.fillText(tStart, padL, yLbl);
                }
                if (tMid && wArr.length >= 10) {
                    const midX = padL + (Math.floor(wArr.length / 2) / (curMaxPoints - 1)) * innerW;
                    ctx.textAlign = 'center';
                    ctx.fillText(tMid, midX, yLbl);
                }
                if (tEnd) {
                    const endX = padL + ((wArr.length - 1) / (curMaxPoints - 1)) * innerW;
                    ctx.textAlign = 'right';
                    ctx.fillText(tEnd, Math.max(padL + 50, endX), yLbl);
                }
            }

            // 모바일/데스크톱 터치 십자선 (Crosshair Tooltip)
            if (hoverIdx >= 0 && hoverIdx < wArr.length) {
                const x = padL + (hoverIdx / (curMaxPoints - 1)) * innerW;
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.setLineDash([2, 2]);
                ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + innerH); ctx.stroke();
                ctx.restore();

                const wVal = (wArr[hoverIdx]?.y ?? 0).toFixed(2);
                const pVal = Math.round((buffers.pwmDuty?.[hoverIdx]?.y) ?? 0);
                const label = `${wVal} m/s · PWM ${pVal}%`;
                const boxW = 132, boxH = 22;
                const bx = Math.min(padL + innerW - boxW, Math.max(padL, x - boxW / 2));
                ctx.fillStyle = 'rgba(15,20,25,0.9)';
                ctx.fillRect(bx, padT, boxW, boxH);
                ctx.strokeStyle = '#4a9eff';
                ctx.strokeRect(bx, padT, boxW, boxH);
                ctx.fillStyle = '#e6edf3';
                ctx.textAlign = 'center';
                ctx.fillText(label, bx + boxW / 2, padT + 14);
            }
        }

        // 리사이즈 옵저버 (없으면 window resize)
        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(resize);
            ro.observe(root);
        } else {
            window.addEventListener('resize', resize);
        }

        // 최초 렌더
        requestAnimationFrame(resize);

        return {
            push,
            clear,
            setMaxPoints(n) {
                curMaxPoints = Math.max(10, Number(n) || 120);
                series.forEach(s => {
                    const arr = buffers[s.key];
                    while (arr.length > curMaxPoints) arr.shift();
                });
                draw();
            },
            destroy() {
                if (ro) ro.disconnect();
                else window.removeEventListener('resize', resize);
                root.innerHTML = '';
            }
        };
    };

})(window.SNW);
