// =========================================================
// 116.ui.sparkline.js — 경량 SVG Sparkline
// Layer 1 (UI 코어 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * Sparkline 렌더러
     * @param {HTMLElement} container
     * @param {Object} opts { width, height, color, baseline }
     * @returns {{render(points), clear()}}
     */
    SNW.UI.sparkline = function(container, opts = {}) {
        const {
            width  = 200,
            height = 40,
            color  = '#4a9eff',
            baseline = null,   // 0이면 바닥에 선
        } = opts;

        if (!container) return { render: () => {}, clear: () => {} };

        // SVG 요소 초기화
        container.innerHTML = '';
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.cssText = 'width:100%;height:100%;display:block;';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);

        if (baseline !== null) {
            const bl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            bl.setAttribute('x1', '0');
            bl.setAttribute('x2', String(width));
            bl.setAttribute('y1', String(height - baseline * height));
            bl.setAttribute('y2', String(height - baseline * height));
            bl.setAttribute('stroke', 'rgba(139,148,158,0.2)');
            bl.setAttribute('stroke-width', '1');
            svg.insertBefore(bl, path);
        }

        container.appendChild(svg);

        return {
            render(points) {
                if (!points || points.length < 2) {
                    path.setAttribute('d', '');
                    return;
                }

                // 값 범위 계산
                let minV = Infinity, maxV = -Infinity;
                points.forEach(p => {
                    const v = (typeof p === 'number') ? p : (p.wind || 0);
                    if (v < minV) minV = v;
                    if (v > maxV) maxV = v;
                });
                if (maxV <= minV) maxV = minV + 1;

                // Padding
                const padY = 2;
                const innerH = height - padY * 2;

                // path 생성
                const n = points.length;
                const stepX = width / (n - 1);
                let d = '';
                points.forEach((p, i) => {
                    const v = (typeof p === 'number') ? p : (p.wind || 0);
                    const x = i * stepX;
                    const y = padY + innerH - ((v - minV) / (maxV - minV)) * innerH;
                    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
                });
                path.setAttribute('d', d.trim());
            },
            clear() {
                path.setAttribute('d', '');
            }
        };
    };
})(window.SNW);

