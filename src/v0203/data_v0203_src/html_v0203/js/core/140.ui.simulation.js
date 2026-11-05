// =========================================================
// 140.ui.simulation.js — Simulation 모달 (5축 레이더 + A/B 비교)
// Layer 3 (UI 시뮬레이션 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
SNW.UI = SNW.UI || {};
(function(SNW) {
    'use strict';

    /**
     * Simulation 모달
     * @param {Object} config {
     *   mode: 'single' | 'ab',
     *   a: { presetCode, styleCode, override },  // 필수
     *   b: { presetCode, styleCode, override },  // mode='ab'일 때
     *   onApply: (chosenConfig) => void,         // "적용" 버튼
     * }
     */
    SNW.UI.simulationModal = async function(config) {
        if (!config || !config.a) return null;
        if (SNW.Preview && typeof SNW.Preview.init === 'function') {
            await SNW.Preview.init();
        }

        // =========================================================
        // A 파형 생성
        // =========================================================
        const waveA = await SNW.Preview.generateStep({
            type: 'PRESET',
            presetCode: config.a.presetCode || 'OCEAN',
            styleCode:  config.a.styleCode  || 'BALANCE',
            override:   config.a.override || { enabled: false },
        });

        const feelingsA = SNW.Preview.toFeelings(
            waveA.intensity, waveA.variability, waveA.gustFreq);

        // =========================================================
        // B 파형 생성 (A/B 모드)
        // =========================================================
        let waveB = null, feelingsB = null;
        if (config.mode === 'ab' && config.b) {
            waveB = await SNW.Preview.generateStep({
                type: 'PRESET',
                presetCode: config.b.presetCode || 'COUNTRY_BREEZE',
                styleCode:  config.b.styleCode  || 'RELAX',
                override:   config.b.override || { enabled: false },
            });
            feelingsB = SNW.Preview.toFeelings(
                waveB.intensity, waveB.variability, waveB.gustFreq);
        }

        // =========================================================
        // DOM
        // =========================================================
        const content = document.createElement('div');
        content.className = 'snw-sim';
        content.innerHTML = `
            <div class="snw-sim__tabs" style="display:flex;gap:6px;margin-bottom:12px;">
                <button type="button" class="snw-tab-btn ${config.mode !== 'ab' ? 'is-active' : ''}" data-mode="single">🎬 단일 미리보기</button>
                <button type="button" class="snw-tab-btn ${config.mode === 'ab' ? 'is-active' : ''}" data-mode="ab">⚖ A/B 비교</button>
            </div>

            <div class="snw-sim__wave-section" data-slot="wave-a">
                <div class="snw-sim__wave-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;font-weight:600;">
                    <span class="snw-sim__badge" style="padding:2px 8px;border-radius:4px;background:rgba(74,158,255,0.15);color:var(--snw-primary,#4a9eff);">${config.mode === 'ab' ? 'A' : '설정'}</span>
                    <span>${SNW.DomUtil ? SNW.DomUtil.escape(config.a.presetCode + ' · ' + config.a.styleCode) : ''}</span>
                </div>
                <canvas class="snw-sim__canvas" data-slot="canvas-a" width="600" height="160" style="width:100%;height:160px;background:var(--snw-surface-2,#12161c);border-radius:var(--snw-radius,8px);display:block;"></canvas>
                <div class="snw-sim__meta" data-slot="meta-a" style="display:flex;justify-content:space-around;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-top:6px;"></div>
            </div>

            <div class="snw-sim__wave-section" data-slot="wave-b" ${config.mode !== 'ab' ? 'style="display:none;margin-top:12px;"' : 'style="margin-top:12px;"'}>
                <div class="snw-sim__wave-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:13px;font-weight:600;">
                    <span class="snw-sim__badge snw-sim__badge--b" style="padding:2px 8px;border-radius:4px;background:rgba(240,136,62,0.15);color:#f0883e;">B</span>
                    <span>${config.b ? (SNW.DomUtil ? SNW.DomUtil.escape(config.b.presetCode + ' · ' + config.b.styleCode) : '') : '-'}</span>
                </div>
                <canvas class="snw-sim__canvas" data-slot="canvas-b" width="600" height="160" style="width:100%;height:160px;background:var(--snw-surface-2,#12161c);border-radius:var(--snw-radius,8px);display:block;"></canvas>
                <div class="snw-sim__meta" data-slot="meta-b" style="display:flex;justify-content:space-around;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-top:6px;"></div>
            </div>

            <div class="snw-sim__feelings" style="margin-top:16px;">
                <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">감성 레이더 (Feelings)</h3>
                <div class="snw-sim__radar-wrap" style="text-align:center;">
                    <canvas class="snw-sim__radar" data-slot="radar" width="280" height="280" style="width:280px;height:280px;"></canvas>
                </div>
                <div class="snw-sim__feelings-legend" data-slot="legend" style="display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:12px;"></div>
            </div>

            <div class="snw-sim__actions" style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
                <button type="button" class="snw-btn" data-action="close" style="padding:8px 16px;">닫기</button>
                ${config.mode === 'ab'
                    ? `<button type="button" class="snw-btn" data-action="apply-b" style="padding:8px 16px;">B로 적용</button>
                       <button type="button" class="snw-btn snw-btn-primary" data-action="apply-a" style="padding:8px 16px;">A로 적용</button>`
                    : `<button type="button" class="snw-btn snw-btn-primary" data-action="apply-a" style="padding:8px 16px;">✓ 이 설정 적용</button>`}
            </div>
        `;

        // =========================================================
        // 파형 애니메이션
        // =========================================================
        const canvasA = content.querySelector('[data-slot="canvas-a"]');
        const canvasB = content.querySelector('[data-slot="canvas-b"]');
        const radar   = content.querySelector('[data-slot="radar"]');

        animateWave(canvasA, waveA.points, '#4a9eff');
        if (waveB) animateWave(canvasB, waveB.points, '#f0883e');

        // =========================================================
        // 메타 표시
        // =========================================================
        renderMeta(content.querySelector('[data-slot="meta-a"]'), waveA);
        if (waveB) renderMeta(content.querySelector('[data-slot="meta-b"]'), waveB);

        // =========================================================
        // 5축 레이더
        // =========================================================
        drawRadar(radar, feelingsA, feelingsB);

        // 범례
        const legend = content.querySelector('[data-slot="legend"]');
        legend.innerHTML = `
            <div class="snw-sim__legend-item" style="display:flex;align-items:center;gap:4px;">
                <span class="snw-sim__legend-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4a9eff"></span>
                ${config.mode === 'ab' ? 'A' : '현재'}
            </div>
            ${config.mode === 'ab' ? `
                <div class="snw-sim__legend-item" style="display:flex;align-items:center;gap:4px;">
                    <span class="snw-sim__legend-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f0883e"></span>
                    B
                </div>
            ` : ''}
        `;

        // =========================================================
        // 액션
        // =========================================================
        let resolved = false;
        let promiseResolve;

        const promise = new Promise(res => { promiseResolve = res; });

        let modalRef = null;
        const close = (chosen) => {
            if (resolved) return;
            resolved = true;
            if (modalRef && typeof modalRef.close === 'function') modalRef.close();
            promiseResolve(chosen);
        };

        modalRef = SNW.UI.modal(
            '🎬 바람 스튜디오 (Simulation)', content,
            null,
            () => { close(null); },                    // [Phase5 5.4 N-19] onCancel → Promise resolve(null)
            { hideOk: true, hideCancel: true, width: '560px' }
        );

        const btnClose = content.querySelector('[data-action="close"]');
        const btnApplyA = content.querySelector('[data-action="apply-a"]');
        const btnApplyB = content.querySelector('[data-action="apply-b"]');

        if (btnClose) btnClose.onclick = () => close(null);
        if (btnApplyA) btnApplyA.onclick = () => close(config.a);
        if (btnApplyB) btnApplyB.onclick = () => close(config.b);

        // 탭 전환 (A/B)
        content.querySelectorAll('[data-mode]').forEach(btn => {
            btn.onclick = () => {
                const mode = btn.getAttribute('data-mode');
                content.querySelectorAll('[data-mode]').forEach(b =>
                    b.classList.toggle('is-active', b === btn));
                const wb = content.querySelector('[data-slot="wave-b"]');
                if (wb) wb.style.display = (mode === 'ab') ? 'block' : 'none';

                drawRadar(radar, feelingsA, (mode === 'ab') ? feelingsB : null);
            };
        });

        return promise;
    };

    // =========================================================
    // 내부: 파형 애니메이션
    // =========================================================
    function animateWave(canvas, points, color) {
        if (!canvas || !points || points.length === 0) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        let minV = Infinity, maxV = -Infinity;
        points.forEach(p => {
            if (p.wind < minV) minV = p.wind;
            if (p.wind > maxV) maxV = p.wind;
        });
        if (maxV <= minV) maxV = minV + 1;

        let drawn = 0;
        const step = 3;

        const drawNext = () => {
            if (drawn >= points.length || !canvas.isConnected) return;

            ctx.clearRect(0, 0, w, h);

            // 그리드
            ctx.strokeStyle = 'rgba(139,148,158,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = (h / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // 파형
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i <= drawn; i++) {
                const p = points[i];
                const x = (i / (points.length - 1)) * w;
                const y = h - ((p.wind - minV) / (maxV - minV)) * (h - 20) - 10;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();

            // 돌풍 마커
            for (let i = 0; i <= drawn; i++) {
                if (!points[i].gust) continue;
                const x = (i / (points.length - 1)) * w;
                const y = h - ((points[i].wind - minV) / (maxV - minV)) * (h - 20) - 10;
                ctx.fillStyle = 'rgba(240,136,62,0.9)';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            drawn += step;
            setTimeout(drawNext, 20);
        };
        drawNext();
    }

    // =========================================================
    // 내부: 메타 표시
    // =========================================================
    function renderMeta(el, wave) {
        if (!el || !wave) return;
        el.innerHTML = `
            <div>평균 <b>${wave.avg ? wave.avg.toFixed(1) : 0} m/s</b></div>
            <div>강도 <b>${Math.round(wave.intensity || 0)}%</b></div>
            <div>변동성 <b>${Math.round(wave.variability || 0)}%</b></div>
            <div>돌풍 <b>${Math.round(wave.gustFreq || 0)}%</b></div>
        `;
    }

    // =========================================================
    // 내부: 5축 레이더
    // =========================================================
    function drawRadar(canvas, fA, fB) {
        if (!canvas || !fA) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(w, h) / 2 - 36;

        ctx.clearRect(0, 0, w, h);

        const axes = [
            { key: 'coolness',   label: '시원함',   angle: -Math.PI / 2 },
            { key: 'freshness',  label: '청량감',   angle: -Math.PI / 2 + Math.PI * 2 / 5 },
            { key: 'dynamism',   label: '역동성',   angle: -Math.PI / 2 + Math.PI * 4 / 5 },
            { key: 'smoothness', label: '부드러움', angle: -Math.PI / 2 + Math.PI * 6 / 5 },
            { key: 'calmness',   label: '차분함',   angle: -Math.PI / 2 + Math.PI * 8 / 5 },
        ];

        // 그리드 (5단계 원)
        ctx.strokeStyle = 'rgba(139,148,158,0.15)';
        ctx.lineWidth = 1;
        for (let ring = 1; ring <= 5; ring++) {
            const r = (ring / 5) * maxR;
            ctx.beginPath();
            axes.forEach((axis, i) => {
                const x = cx + Math.cos(axis.angle) * r;
                const y = cy + Math.sin(axis.angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        // 축
        ctx.strokeStyle = 'rgba(139,148,158,0.3)';
        axes.forEach(axis => {
            const x = cx + Math.cos(axis.angle) * maxR;
            const y = cy + Math.sin(axis.angle) * maxR;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
        });

        // 라벨
        ctx.fillStyle = '#8b949e';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        axes.forEach(axis => {
            const x = cx + Math.cos(axis.angle) * (maxR + 18);
            const y = cy + Math.sin(axis.angle) * (maxR + 18);
            ctx.fillText(axis.label, x, y);
        });

        // A 폴리곤
        drawPolygon(ctx, cx, cy, maxR, axes, fA, 'rgba(74,158,255,0.35)', 'rgba(74,158,255,1)');

        // B 폴리곤
        if (fB) {
            drawPolygon(ctx, cx, cy, maxR, axes, fB, 'rgba(240,136,62,0.25)', 'rgba(240,136,62,1)');
        }

        // 중심점
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPolygon(ctx, cx, cy, maxR, axes, feelings, fillColor, strokeColor) {
        ctx.beginPath();
        axes.forEach((axis, i) => {
            const val = feelings[axis.key] || 0;
            const r = (val / 5) * maxR;
            const x = cx + Math.cos(axis.angle) * r;
            const y = cy + Math.sin(axis.angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
})(window.SNW);

