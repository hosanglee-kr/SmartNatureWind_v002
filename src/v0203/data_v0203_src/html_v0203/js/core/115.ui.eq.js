// =========================================================
// 115.ui.eq.js — 이퀄라이저 (실시간 파형 애니메이션)
// Layer 1 (UI 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * 이퀄라이저 (Canvas 2D)
     * @param {HTMLElement} container
     * @param {Object} opts { bars, fps, maxWind, bufferSize }
     * @returns {{ push(windSpeed), start(), stop(), clear(), renderStatic() }}
     */
    SNW.UI.equalizer = function(container, opts = {}) {
        const {
            bars       = 20,
            fps        = 60,
            maxWind    = 11.0,       // 최대 풍속 (m/s)
            bufferSize = 30,         // 로컬 버퍼 (WS 간격 × 30 ≈ 24초)
        } = opts;

        if (!container) {
            return { push: () => {}, start: () => {}, stop: () => {}, clear: () => {}, renderStatic: () => {} };
        }

        // 캔버스 초기화
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'snw-eq-canvas';
        canvas.setAttribute('aria-label', '풍속 그래프');
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        // DPR (고해상도)
        let dpr = window.devicePixelRatio || 1;
        let cw = 0, ch = 0;

        // 로컬 링 버퍼
        const buffer = new Array(bufferSize).fill(0);

        // 애니메이션 상태
        let running = false;
        let rafId = null;
        let lastTs = 0;

        // prefers-reduced-motion
        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // =========================================================
        // 리사이즈
        // =========================================================
        function resize() {
            const rect = container.getBoundingClientRect();
            cw = Math.max(60, Math.floor(rect.width || container.clientWidth || 300));
            ch = Math.max(40, Math.floor(rect.height || container.clientHeight || 60));

            canvas.width  = Math.floor(cw * dpr);
            canvas.height = Math.floor(ch * dpr);
            canvas.style.width  = cw + 'px';
            canvas.style.height = ch + 'px';

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            render();
        }

        // =========================================================
        // 렌더
        // =========================================================
        function render() {
            ctx.clearRect(0, 0, cw, ch);

            const barW = cw / bars;
            const gap = Math.max(1, barW * 0.15);
            const actualW = barW - gap;

            // 최근 bufferSize 값을 bars 개수로 다운샘플
            const step = Math.max(1, Math.floor(bufferSize / bars));
            for (let i = 0; i < bars; i++) {
                const srcIdx = Math.min(bufferSize - 1, i * step + Math.floor(step / 2));
                const v = buffer[srcIdx] || 0;

                // 정규화
                const ratio = Math.min(1, Math.max(0, v / maxWind));
                const bh = Math.max(2, ratio * (ch - 4));

                // 색상 매핑
                let color;
                if (v > 6)      color = '#f0883e';   // 강함 (주황)
                else if (v > 3) color = '#3fb950';   // 보통 (초록)
                else            color = '#4a9eff';   // 잔잔 (파랑)

                ctx.fillStyle = color;
                const x = i * barW + gap / 2;
                const y = ch - bh;
                // 둥근 막대 (roundRect 미지원 브라우저 대응)
                if (typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(x, y, actualW, bh, 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(x, y, actualW, bh);
                }
            }
        }

        // =========================================================
        // 애니메이션 루프
        // =========================================================
        function tick(ts) {
            if (!running) return;

            const frameInterval = reduceMotion ? 500 : Math.floor(1000 / fps);
            if (ts - lastTs >= frameInterval) {
                lastTs = ts;
                render();
            }
            rafId = requestAnimationFrame(tick);
        }

        // =========================================================
        // ResizeObserver
        // =========================================================
        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(resize);
            ro.observe(container);
        } else {
            window.addEventListener('resize', resize);
        }

        // 초기 렌더
        requestAnimationFrame(resize);

        // =========================================================
        // Public API
        // =========================================================
        return {
            /** 새 풍속 값 push (WS state에서 호출) */
            push(windSpeed) {
                buffer.shift();
                buffer.push(Math.max(0, Number(windSpeed) || 0));
                if (!running) render();   // 정지 시 즉시 렌더
            },

            start() {
                if (running) return;
                if (reduceMotion) {
                    // reduced-motion: 애니메이션 없이 push 시 렌더만
                    running = true;
                    return;
                }
                running = true;
                rafId = requestAnimationFrame(tick);
            },

            stop() {
                running = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },

            clear() {
                buffer.fill(0);
                render();
            },

            /** 정지 상태용 — 회색 라인 */
            renderStatic() {
                ctx.clearRect(0, 0, cw, ch);
                ctx.strokeStyle = '#59636e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(4, ch / 2);
                ctx.lineTo(cw - 4, ch / 2);
                ctx.stroke();
            },
        };
    };
})(window.SNW);

