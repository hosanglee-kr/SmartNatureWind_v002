
/* ---- 100.ui.badge.js (2046 bytes) ---- */
// =========================================================
// 100.ui.badge.js — SNW.UI.stateBadge (FSM 상태 배지)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - CT10 7-State FSM 매핑
//  - set(code, reason) 인터페이스
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	// =====================================================
	// FSM 메타 조회 (SNW.C + SNW.I18n 조합)
	// =====================================================
	function getStateMeta(code) {
		const meta = SNW.C.FSM_STATE_META[code] || SNW.C.FSM_STATE_META[0];
		return {
			code: meta.code,
			icon: meta.icon,
			color: meta.color,
			label: SNW.I18n.t(meta.labelKey),
			l1: meta.l1
		};
	}
	
	function getReasonMeta(code) {
		const meta = SNW.C.FSM_REASON_META[code] || SNW.C.FSM_REASON_META[0];
		return {
			code: meta.code,
			label: SNW.I18n.t(meta.labelKey)
		};
	}
	
	/**
	 * 상태 배지 마운트
	 * @param {HTMLElement} container
	 * @returns {{set: function(number, number)}}
	 */
	SNW.UI.stateBadge = function(container) {
		if (!container) return { set: () => {} };
		
		let curState = 0;
		let curReason = 0;
		
		const render = () => {
			const st = getStateMeta(curState);
			const rs = getReasonMeta(curReason);
			
			container.innerHTML = '';
			container.appendChild(SNW.DomUtil.html`
                <span class="snw-badge snw-badge--${st.color}" title="${rs.label}" data-state="${st.code}">
                    <span class="snw-badge__icon">${st.icon}</span>
                    <span class="snw-badge__label">${st.label}</span>
                </span>`);
		};
		
		render();
		
		return {
			set(code, reason) {
				curState = (code != null) ? code : 0;
				curReason = (reason != null) ? reason : 0;
				render();
			}
		};
	};
	
	// 참고: FsmUtil 별도 네임스페이스가 필요한 경우 이 파일에서 함께 노출
	SNW.FsmUtil = {
		getState: getStateMeta,
		getReason: getReasonMeta
	};
	
})(window.SNW);


/* ---- 101.ui.toggle.js (1840 bytes) ---- */
// =========================================================
// 101.ui.toggle.js — SNW.UI.toggle (On/Off 대형 토글)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - 낙관적 UI 지원 (set()으로 외부 동기화)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	/**
	 * On/Off 토글
	 * @param {object} opts
	 *   root     : HTMLElement
	 *   on       : boolean (초기 상태)
	 *   onToggle : (next:boolean) => void
	 *   onLabel  : string (기본 = I18n 'dashboard.powerOn')
	 *   offLabel : string (기본 = I18n 'dashboard.powerOff')
	 * @returns {{set: function(boolean)}}
	 */
	SNW.UI.toggle = function(opts) {
		const {
			root,
			on = false,
			onToggle,
			onLabel = SNW.I18n.t('dashboard.powerOn'),
			offLabel = SNW.I18n.t('dashboard.powerOff')
		} = opts || {};
		
		if (!root) return { set: () => {} };
		
		let state = !!on;
		
		const render = () => {
			root.innerHTML = '';
			const btn = SNW.DomUtil.html`
                <button class="snw-toggle ${state ? 'is-on' : 'is-off'}" type="button"
                        aria-pressed="${state ? 'true' : 'false'}">
                    <span class="snw-toggle__icon">${state ? '⏹' : '▶'}</span>
                    <span class="snw-toggle__label">${state ? offLabel : onLabel}</span>
                </button>`;
			btn.addEventListener('click', () => {
				const next = !state;
				state = next;
				render();
				if (typeof onToggle === 'function') {
					try { onToggle(next); }
					catch (e) { SNW.LogUtil.error('[toggle] onToggle 실패', e); }
				}
			});
			root.appendChild(btn);
		};
		
		render();
		
		return {
			set(next) {
				const v = !!next;
				if (v === state) return;
				state = v;
				render();
			}
		};
	};
	
})(window.SNW);


/* ---- 102.ui.gauge.js (1255 bytes) ---- */
// =========================================================
// 102.ui.gauge.js — SNW.UI.gauge (PWM 0~100 게이지)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	SNW.UI = SNW.UI || {};
	
	/**
	 * PWM 게이지
	 * @param {HTMLElement} root
	 * @returns {{set: function(number), get: function():number}}
	 */
	SNW.UI.gauge = function(root) {
		if (!root) return { set: () => {}, get: () => 0 };
		
		root.innerHTML = '';
		root.appendChild(SNW.DomUtil.html`
            <div class="snw-gauge">
                <div class="snw-gauge__bar">
                    <div class="snw-gauge__fill" data-fill style="width:0%"></div>
                </div>
                <span class="snw-gauge__label" data-label>0%</span>
            </div>`);
		
		const fill = root.querySelector('[data-fill]');
		const label = root.querySelector('[data-label]');
		let cur = 0;
		
		return {
			set(pct) {
				const p = Math.max(0, Math.min(100, Number(pct) || 0));
				cur = p;
				if (fill) fill.style.width = p.toFixed(1) + '%';
				if (label) label.textContent = p.toFixed(0) + '%';
			},
			get() { return cur; }
		};
	};
	
})(window.SNW);


/* ---- 110.ui.slider.js (9241 bytes) ---- */
// =========================================================
// 110.ui.slider.js — SNW.UI.slider
// Layer 3 (UI 컴포넌트)
// [O-2] 낙관적 잠금 (dragging + pending 보호)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    
    SNW.UI = SNW.UI || {};
    
    SNW.UI.slider = function(opts) {
        const {
            root,
            min = 0,
            max = 100,
            value = 50,
            label = '',
            unit = '',
            feedbackFn = null,
            onChange,
            debounceMs = SNW.C.DEBOUNCE_MS.SLIDER
        } = opts || {};
        
        if (!root) return { set: () => {}, get: () => value };
        
        const debounced = SNW.DebounceUtil.debounce((v) => {
            if (typeof onChange === 'function') {
                try { onChange(v); }
                catch (e) { SNW.LogUtil.error('[slider] onChange 실패', e); }
            }
        }, debounceMs);
        
        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`
            <div class="snw-slider">
                <div class="snw-slider__head">
                    <span class="snw-slider__label">${label}</span>
                    <span class="snw-slider__value">
                        <span data-val>${value}</span><span class="snw-slider__unit">${unit}</span>
                    </span>
                </div>
                <input type="range" class="snw-slider__input"
                       min="${min}" max="${max}" value="${value}" data-input />
                <div class="snw-slider__feedback" data-feedback style="margin-top:4px;font-size:11px;color:var(--snw-text-dim);display:none;"></div>
            </div>`);
        
        const input = root.querySelector('[data-input]');
        const valEl = root.querySelector('[data-val]');
        const fbEl  = root.querySelector('[data-feedback]');
        
        const updateFeedback = (val) => {
            if (typeof feedbackFn === 'function' && fbEl) {
                const fb = feedbackFn(Number(val));
                if (fb) {
                    fbEl.style.display = 'block';
                    fbEl.innerHTML = `
                        <div style="font-weight:600;color:var(--snw-primary);">${SNW.DomUtil.escape(fb.title || '')}</div>
                        <div style="font-size:10.5px;color:var(--snw-text-dim);margin-top:2px;">${SNW.DomUtil.escape(fb.desc || '')}</div>
                    `;
                } else {
                    fbEl.style.display = 'none';
                }
            }
        };

        updateFeedback(value);
        
        let dragging = false;
        
        input.addEventListener('input', () => {
            dragging = true;
            if (valEl) valEl.textContent = input.value;
            updateFeedback(input.value);
        });
        
        input.addEventListener('change', () => {
            dragging = false;
            updateFeedback(input.value);
            debounced(Number(input.value));
        });
        
        input.addEventListener('pointerup', () => { dragging = false; });
        input.addEventListener('pointercancel', () => { dragging = false; });
        
        return {
            set(v) {
                // [O-2] 사용자 조작 중 무시
                if (dragging) return;
                const n = Math.max(min, Math.min(max, Number(v) || 0));
                updateFeedback(n);
                // 현재 표시 값과 같으면 스킵 (불필요한 재렌더 방지)
                if (Number(input.value) === n) return;
                input.value = String(n);
                if (valEl) valEl.textContent = String(n);
            },
            get() { return Number(input.value); }
        };
    };
    

    // =========================================================
    // [Stage 6] Snap 슬라이더 (일반 선풍기용 + Haptic 연동)
    // =========================================================
    SNW.UI.snapSlider = function(container, opts = {}) {
        const {
            min        = 0,
            max        = 100,
            value      = 0,
            snapPoints = [0, 20, 40, 60, 80, 100],
            snapRadius = 8,
            label      = '',
            format     = (v) => `${v}%`,
            onChange   = null,
        } = opts;

        if (!container) return { set: () => {}, get: () => value };

        container.innerHTML = `
            <div class="snw-snapslider">
                <div class="snw-snapslider__head">
                    <span class="snw-snapslider__label">${SNW.DomUtil ? SNW.DomUtil.escape(label) : label}</span>
                    <span class="snw-snapslider__value" data-slot="val">${format(value)}</span>
                </div>
                <div class="snw-snapslider__track-wrap">
                    <input type="range"
                           class="snw-snapslider__input"
                           min="${min}" max="${max}" step="1"
                           value="${value}"
                           data-slot="input">
                    <div class="snw-snapslider__ticks">
                        ${snapPoints.map(p =>
                            `<span class="snw-snapslider__tick"
                                   style="left:${((p - min) / (max - min) * 100).toFixed(1)}%"></span>`
                        ).join('')}
                    </div>
                </div>
                <div class="snw-snapslider__stops">
                    ${snapPoints.map(p =>
                        `<button type="button"
                                 class="snw-snapslider__stop"
                                 data-snap="${p}">${format(p)}</button>`
                    ).join('')}
                </div>
            </div>`;

        const input   = container.querySelector('[data-slot="input"]');
        const valEl   = container.querySelector('[data-slot="val"]');
        const stopEls = container.querySelectorAll('[data-snap]');

        let currentValue = Number(value) || 0;
        let dragging = false;
        let lastSnapFired = currentValue;

        function snapToNearest(raw) {
            const v = Number(raw);
            if (!snapPoints || snapPoints.length === 0) return v;

            let nearest = snapPoints[0];
            let minDist = Math.abs(nearest - v);
            for (const p of snapPoints) {
                const d = Math.abs(p - v);
                if (d < minDist) { minDist = d; nearest = p; }
            }
            if (minDist <= snapRadius) return nearest;
            return v;
        }

        function updateUI(v) {
            if (valEl) valEl.textContent = format(v);
            stopEls.forEach(el => {
                const sp = Number(el.getAttribute('data-snap'));
                el.classList.toggle('is-active', sp === v);
            });
        }

        input.addEventListener('input', () => {
            dragging = true;
            const raw = Number(input.value);
            if (valEl) valEl.textContent = format(raw);
        });

        function finalize() {
            if (!dragging) return;
            dragging = false;

            const raw = Number(input.value);
            const snapped = snapToNearest(raw);

            if (snapped !== raw) {
                input.value = snapped;
            }

            if (snapped !== lastSnapFired) {
                if (snapPoints.includes(snapped)) {
                    if (SNW.Haptic && typeof SNW.Haptic.snap === 'function') SNW.Haptic.snap();
                }
                lastSnapFired = snapped;
            }

            currentValue = snapped;
            updateUI(snapped);

            if (typeof onChange === 'function') {
                try { onChange(snapped); } catch (e) { if (SNW.LogUtil) SNW.LogUtil.error(e); }
            }
        }

        input.addEventListener('pointerup', finalize);
        input.addEventListener('pointercancel', finalize);
        input.addEventListener('touchend', finalize);
        input.addEventListener('change', () => {
            if (!dragging) finalize();
        });

        stopEls.forEach(el => {
            el.addEventListener('click', () => {
                const target = Number(el.getAttribute('data-snap'));
                if (target === currentValue) return;

                currentValue = target;
                input.value = target;
                lastSnapFired = target;
                updateUI(target);

                if (snapPoints.includes(target)) {
                    if (SNW.Haptic && typeof SNW.Haptic.snap === 'function') SNW.Haptic.snap();
                }

                if (typeof onChange === 'function') {
                    try { onChange(target); } catch (e) { if (SNW.LogUtil) SNW.LogUtil.error(e); }
                }
            });
        });

        updateUI(currentValue);

        return {
            set(v) {
                const n = Math.max(min, Math.min(max, Number(v) || 0));
                if (n === currentValue) return;
                currentValue = n;
                input.value = n;
                updateUI(n);
            },
            get() { return currentValue; },
        };
    };

})(window.SNW);

/* ---- 115.ui.eq.js (6552 bytes) ---- */
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



/* ---- 116.ui.sparkline.js (3395 bytes) ---- */
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



/* ---- 117.ui.haptic.js (1786 bytes) ---- */
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



/* ---- 120.ui.chart.js (5705 bytes) ---- */
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

        if (!root) return { push: () => {}, clear: () => {}, setMaxPoints: () => {}, destroy: () => {} };

        root.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.className = 'snw-chart-canvas';
        root.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // DPR 대응
        let dpr = window.devicePixelRatio || 1;
        let cw  = 0, ch = 0;

        const buffers = {};
        series.forEach(s => { buffers[s.key] = []; });

        let curMaxPoints = maxPoints;

        function resize() {
            const rect = root.getBoundingClientRect();
            cw = Math.max(200, Math.floor(rect.width  || root.clientWidth  || 800));
            ch = Math.max(80,  Math.floor(rect.height || root.clientHeight || 200));
            canvas.width  = Math.floor(cw * dpr);
            canvas.height = Math.floor(ch * dpr);
            canvas.style.width  = cw + 'px';
            canvas.style.height = ch + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        }

        function push(point) {
            series.forEach(s => {
                const arr = buffers[s.key];
                const v   = (point && point[s.key]);
                arr.push({ x: (point && point.t) || Date.now(), y: v });
                if (arr.length > curMaxPoints) arr.shift();
            });
            draw();
        }

        function clear() {
            series.forEach(s => { buffers[s.key] = []; });
            draw();
        }

        function _drawSeries(arr, color) {
            if (arr.length < 2) return;
            ctx.strokeStyle = color;
            ctx.lineWidth   = 2;
            ctx.lineJoin    = 'round';
            ctx.beginPath();
            for (let i = 0; i < arr.length; i++) {
                const p = arr[i];
                const x = (i / (curMaxPoints - 1)) * cw;
                const y = ch - p.py;
                if (i === 0) ctx.moveTo(x, y);
                else         ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        function draw() {
            ctx.clearRect(0, 0, cw, ch);

            // 범위 계산 (모든 시리즈 통합)
            let dataMin = Infinity, dataMax = -Infinity;
            series.forEach(s => {
                buffers[s.key].forEach(p => {
                    if (!Number.isFinite(p.y)) return;
                    if (p.y < dataMin) dataMin = p.y;
                    if (p.y > dataMax) dataMax = p.y;
                });
            });
            if (yMin != null) dataMin = yMin;
            if (yMax != null) dataMax = yMax;
            if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;
            if (dataMax <= dataMin) dataMax = dataMin + 1;

            const pad = 6;
            const yRange = dataMax - dataMin;
            const innerH = ch - pad * 2;

            // Y축 그리드 (5줄)
            ctx.strokeStyle = 'rgba(139,148,158,0.15)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = pad + (innerH / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(cw, y);
                ctx.stroke();
            }

            // 각 시리즈 픽셀 좌표 미리 계산
            series.forEach(s => {
                buffers[s.key].forEach(p => {
                    if (!Number.isFinite(p.y)) { p.py = 0; return; }
                    p.py = pad + ((p.y - dataMin) / yRange) * innerH;
                });
            });

            // 라인 렌더
            series.forEach(s => _drawSeries(buffers[s.key], s.color));
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


/* ---- 130.ui.form.js (17381 bytes) ---- */
// =========================================================
// 130.ui.form.js — SNW.UI.form + presetGrid + sensorCards + logViewer
// Layer 3 (UI 컴포넌트)
// [O-12] logViewer 스마트 스크롤 (사용자 스크롤 보호)
// [B-8] 로그 필터 정확 매칭 (기존 유지)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    
    SNW.UI = SNW.UI || {};
    
    // =========================================================
    // 1) SNW.UI.form (스키마 기반 폼)
    // =========================================================
    SNW.UI.form = function(opts) {
        const { root, schema = [], value = {}, onSave } = opts || {};
        if (!root) return { getValue: () => ({}), setValue: () => {}, setError: () => {} };
        
        const state = Object.assign({}, value);
        const inputs = {};
        
        function render() {
            root.innerHTML = '';
            const wrap = document.createElement('div');
            wrap.className = 'snw-form';
            
            schema.forEach(f => {
                const label = SNW.I18n.t(f.labelKey);
                const cur = state[f.key];
                let inputEl;
                
                if (f.type === 'bool') {
                    inputEl = SNW.DomUtil.html`
                        <label class="snw-form-row snw-form-row--bool">
                            <input type="checkbox" data-key="${f.key}" ${cur ? 'checked' : ''} />
                            <span>${label}</span>
                        </label>`;
                } else if (f.type === 'select') {
                    const optsHtml = (f.options || []).map(o => {
                        const v = (typeof o === 'object') ? o.value : o;
                        const l = (typeof o === 'object') ? SNW.I18n.t(o.labelKey) : o;
                        return `<option value="${SNW.DomUtil.escape(v)}" ${v === cur ? 'selected' : ''}>${SNW.DomUtil.escape(l)}</option>`;
                    }).join('');
                    inputEl = SNW.DomUtil.html`
                        <div class="snw-form-row">
                            <label>${label}</label>
                            <select data-key="${f.key}">${optsHtml}</select>
                        </div>`;
                } else {
                    const t = (f.type === 'number') ? 'number' : (f.type === 'password' ? 'password' : 'text');
                    const extra = [
                        f.min != null ? `min="${f.min}"` : '',
                        f.max != null ? `max="${f.max}"` : '',
                        f.step != null ? `step="${f.step}"` : '',
                        f.placeholder ? `placeholder="${SNW.DomUtil.escape(f.placeholder)}"` : '',
                        f.type === 'password' ? 'autocomplete="off" data-lpignore="true" data-1p-ignore="true"' : ''
                    ].join(' ');
                    inputEl = SNW.DomUtil.html`
                        <div class="snw-form-row">
                            <label>${label}</label>
                            <input type="${t}" data-key="${f.key}" value="${cur != null ? cur : ''}" ${extra} />
                        </div>`;
                }
                wrap.appendChild(inputEl);
                
                const inputNode = inputEl.matches('[data-key]') ? inputEl : inputEl.querySelector('[data-key]');
                if (inputNode) {
                    inputs[f.key] = { el: inputNode, type: f.type };
                    if (f.type === 'bool') {
                        inputNode.addEventListener('change', () => { state[f.key] = inputNode.checked; });
                    } else if (f.type === 'number') {
                        inputNode.addEventListener('input', () => {
                            const v = inputNode.value === '' ? null : Number(inputNode.value);
                            state[f.key] = v;
                        });
                    } else {
                        inputNode.addEventListener('input', () => { state[f.key] = inputNode.value; });
                    }
                }
            });
            
            if (typeof onSave === 'function') {
                const btn = SNW.DomUtil.html`
                    <button type="button" class="snw-btn snw-btn-primary" data-action="form-save">
                        ${SNW.I18n.t('common.save')}
                    </button>`;
                btn.addEventListener('click', () => {
                    try { onSave(state); }
                    catch (e) { SNW.ErrorHandler.handle(e, 'form.onSave'); }
                });
                wrap.appendChild(btn);
            }
            
            root.appendChild(wrap);
        }
        
        render();
        
        return {
            getValue() { return Object.assign({}, state); },
            setValue(patch) {
                Object.assign(state, patch);
                Object.keys(patch).forEach(k => {
                    const ref = inputs[k];
                    if (!ref) return;
                    if (ref.type === 'bool') ref.el.checked = !!state[k];
                    else if (state[k] != null) ref.el.value = String(state[k]);
                });
            },
            setError(key, msg) {
                const ref = inputs[key];
                if (!ref) return;
                ref.el.classList.toggle('is-error', !!msg);
                ref.el.title = msg || '';
            },
            refresh() { render(); }
        };
    };
    
    // =========================================================
    // 2) SNW.UI.presetGrid
    // =========================================================
    SNW.UI.presetGrid = function(opts) {
        const { root, items = [], selected = '', onSelect, onPreview, onTrial } = opts || {};
        if (!root) return { setItems: () => {}, setSelected: () => {} };
        
        let curSelected = selected;
        let curItems = items.slice();
        
        // [U-010] cfg_windDict_0203.json 10개 프리셋 코드와 1:1 매칭
        const PRESET_ICONS = {
            OCEAN:          '🌊',
            COUNTRY_BREEZE: '🏡',
            MEDITERRANEAN:  '🏖',
            MOUNTAIN:       '🏔',
            PLAINS:         '🌾',
            HARBOR_BREEZE:  '⚓',
            FOREST_CANOPY:  '🌲',
            URBAN_SUNSET:   '🌆',
            TROPICAL_RAIN:  '🌴',
            DESERT_NIGHT:   '🌙'
        };

        function _drawSpark(canvas, points) {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            let min = Infinity, max = -Infinity;
            points.forEach(p => { if (p.wind < min) min = p.wind; if (p.wind > max) max = p.wind; });
            if (max <= min) max = min + 1;
            ctx.strokeStyle = 'rgba(74,158,255,0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            points.forEach((p, i) => {
                const x = (i / (points.length - 1)) * w;
                const y = h - ((p.wind - min) / (max - min)) * (h - 2) - 1;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();
        }
        
        function render() {
            root.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'snw-preset-grid';
            
            curItems.forEach((it, i) => {
                const name = (SNW.I18n && SNW.I18n.hasKey('preset.' + it.code))
                    ? SNW.I18n.t('preset.' + it.code)
                    : (it.name || it.code);
                const icon = PRESET_ICONS[it.code] || '🍃';

                // [SIM-1] hover 미니 파형 (canvas) + 미리보기 버튼
                const card = document.createElement('button');
                card.type = 'button';
                card.className = `snw-preset-card ${it.code === curSelected ? 'is-selected' : ''}`;
                card.setAttribute('data-code', it.code);
                card.innerHTML = `
                    <span class="snw-preset-card__icon">${icon}</span>
                    <span class="snw-preset-card__name">${name}</span>
                    <span class="snw-preset-card__actions" style="position:absolute;top:2px;right:2px;display:flex;gap:3px;">
                        <span class="snw-preset-card__preview" title="미리보기" style="font-size:11px;opacity:0.75;">🎬</span>
                        <span class="snw-preset-card__trial"   title="실제 체험" style="font-size:11px;opacity:0.75;">🔊</span>
                    </span>
                    <canvas class="snw-preset-card__spark" width="60" height="20" style="display:none;"></canvas>`;

                const prevBtn = card.querySelector('.snw-preset-card__preview');
                if (prevBtn) {
                    prevBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof onPreview === 'function') onPreview(it.code);
                    };
                }
                const trialBtn = card.querySelector('.snw-preset-card__trial');
                if (trialBtn) {
                    trialBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof onTrial === 'function') onTrial(it.code);
                    };
                }

                card.addEventListener('mouseenter', async () => {
                    const cv = card.querySelector('.snw-preset-card__spark');
                    if (!cv) return;
                    if (cv.dataset.drawn === '1') { cv.style.display = 'block'; return; }

                    const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
                    if (SNW.Preview && typeof SNW.Preview.generate === 'function') {
                        try {
                            const preview = await SNW.Preview.generate(it.code, styleCode, null);
                            if (preview && preview.points) {
                                _drawSpark(cv, preview.points);
                                cv.dataset.drawn = '1';
                                cv.style.display = 'block';
                            }
                        } catch (e) {
                            if (SNW.LogUtil) SNW.LogUtil.warn('[presetGrid] preview fail', e);
                        }
                    }
                });
                card.addEventListener('mouseleave', () => {
                    const cv = card.querySelector('.snw-preset-card__spark');
                    if (cv) cv.style.display = 'none';
                });

                grid.appendChild(card);
            });
            
            root.appendChild(grid);
        }
        
        render();
        
        SNW.DomUtil.delegate(root, '.snw-preset-card', 'click', (e, el) => {
            const code = el.getAttribute('data-code');
            if (!code || code === curSelected) return;
            curSelected = code;
            render();
            if (typeof onSelect === 'function') {
                try { onSelect(code); }
                catch (e) { SNW.ErrorHandler.handle(e, 'presetGrid.onSelect'); }
            }
        });
        
        return {
            setItems(list) { curItems = list.slice();
                render(); },
            setSelected(code) {
                if (code === curSelected) return;
                curSelected = code || '';
                render();
            }
        };
    };
    
    // =========================================================
    // 3) SNW.UI.sensorCards
    // =========================================================
    SNW.UI.sensorCards = function(root) {
        if (!root) return { set: () => {} };
        
        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`
            <div class="snw-sensor-cards">
                <div class="snw-sensor-card">
                    <span class="snw-sensor-card__icon">🌡</span>
                    <span class="snw-sensor-card__label">${SNW.I18n.t('dashboard.temp')}</span>
                    <span class="snw-sensor-card__val" data-temp>--</span>
                </div>
                <div class="snw-sensor-card">
                    <span class="snw-sensor-card__icon">💧</span>
                    <span class="snw-sensor-card__label">${SNW.I18n.t('dashboard.humidity')}</span>
                    <span class="snw-sensor-card__val" data-hum>--</span>
                </div>
                <div class="snw-sensor-card">
                    <span class="snw-sensor-card__icon">👤</span>
                    <span class="snw-sensor-card__label">${SNW.I18n.t('dashboard.motion')}</span>
                    <span class="snw-sensor-card__val" data-motion>--</span>
                </div>
            </div>`);
        
        const tempEl = root.querySelector('[data-temp]');
        const humEl = root.querySelector('[data-hum]');
        const motEl = root.querySelector('[data-motion]');
        
        return {
            set({ tempC, humidity, motionActive } = {}) {
                if (tempC != null && Number.isFinite(tempC))
                    tempEl.textContent = `${tempC.toFixed(1)}${SNW.I18n.t('unit.celsius')}`;
                if (humidity != null && Number.isFinite(humidity))
                    humEl.textContent = `${humidity.toFixed(0)}${SNW.I18n.t('unit.humidity')}`;
                if (motionActive != null) {
                    motEl.textContent = motionActive ?
                        SNW.I18n.t('dashboard.motionDetected') :
                        SNW.I18n.t('dashboard.motionAbsent');
                    motEl.classList.toggle('is-on', !!motionActive);
                    motEl.classList.toggle('is-off', !motionActive);
                }
            }
        };
    };
    
    // =========================================================
    // 4) [O-12] SNW.UI.logViewer — 스마트 스크롤
    // =========================================================
    SNW.UI.logViewer = function(opts) {
        const { root, maxLines = SNW.CFG.UI.LOG_MAX_LINES } = opts || {};
        if (!root) return { append: () => {}, clear: () => {}, setFilter: () => {} };
        
        root.innerHTML = '';
        root.appendChild(SNW.DomUtil.html`<div class="snw-log-viewer" data-body></div>`);
        const body = root.querySelector('[data-body]');
        
        let filterLevel = 0;
        let _jumpBtn = null;
        
        const _isAtBottom = () => (body.scrollHeight - body.scrollTop - body.clientHeight) < 30;
        
        const _showJumpButton = () => {
            if (_jumpBtn) return;
            _jumpBtn = document.createElement('button');
            _jumpBtn.className = 'snw-log-jump-bottom';
            _jumpBtn.textContent = '▼ 최신';
            _jumpBtn.onclick = () => {
                body.scrollTop = body.scrollHeight;
                _hideJumpButton();
            };
            root.appendChild(_jumpBtn);
        };
        const _hideJumpButton = () => {
            if (_jumpBtn) { _jumpBtn.remove();
                _jumpBtn = null; }
        };
        
        body.addEventListener('scroll', () => {
            if (_isAtBottom()) _hideJumpButton();
        });
        
        function _levelClass(lv) {
            const meta = SNW.C.LOG_LEVEL_META[lv] || SNW.C.LOG_LEVEL_META[3];
            return 'snw-log-' + meta.color;
        }
        
        function _trim() {
            while (body.children.length > maxLines) {
                body.removeChild(body.firstElementChild);
            }
        }
        
        return {
            append(entry) {
                if (!entry) return;
                if (filterLevel !== 0 && entry.lv !== filterLevel) return;
                
                const wasAtBottom = _isAtBottom();
                
                const row = SNW.DomUtil.html`
                    <div class="snw-log-row ${_levelClass(entry.lv)}">
                        <span class="snw-log-ts">${SNW.TimeUtil.msToSecLabel(entry.ts || 0)}</span>
                        <span class="snw-log-lv">${(SNW.C.LOG_LEVEL_META[entry.lv] || {}).code || '?'}</span>
                        <span class="snw-log-msg">${entry.msg || ''}</span>
                    </div>`;
                body.appendChild(row);
                _trim();
                
                // [O-12] 스마트 스크롤
                if (wasAtBottom) {
                    body.scrollTop = body.scrollHeight;
                } else {
                    _showJumpButton();
                }
            },
            clear() { body.innerHTML = '';
                _hideJumpButton(); },
            setFilter(lv) {
                filterLevel = Number(lv) || 0;
                Array.from(body.children).forEach(ch => {
                    if (filterLevel === 0) {
                        ch.style.display = '';
                    } else {
                        const lvEl = ch.querySelector('.snw-log-lv');
                        const lvStr = (SNW.C.LOG_LEVEL_META[filterLevel] || {}).code || '';
                        ch.style.display = (lvEl && lvEl.textContent.trim() === lvStr) ? '' : 'none';
                    }
                });
            }
        };
    };
    
})(window.SNW);

/* ---- 135.util.preview.js (11356 bytes) ---- */
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


/* ---- 140.ui.simulation.js (16087 bytes) ---- */
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



/* ---- 145.ai.client.js (1920 bytes) ---- */
// =========================================================
// 145.ai.client.js — SNW.AIClient
// Layer 3 (코어 UI / AI 통신 클라이언트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';

	const CACHE_MAX = 20;
	const HISTORY_MAX = 20;
	const STORAGE_KEY = 'snw.ai.history';

	const _cache = new Map();
	let _pendingPromise = null;

	SNW.AIClient = {
		loadHistory() {
			try {
				const s = localStorage.getItem(STORAGE_KEY);
				return s ? JSON.parse(s).slice(-HISTORY_MAX) : [];
			} catch {
				return [];
			}
		},

		saveHistory(hist) {
			try {
				if (!Array.isArray(hist)) return;
				localStorage.setItem(STORAGE_KEY, JSON.stringify(hist.slice(-HISTORY_MAX)));
			} catch {}
		},

		clearHistory() {
			try {
				localStorage.removeItem(STORAGE_KEY);
				_cache.clear();
			} catch {}
		},

		async send(message, history = [], opts = {}) {
			const text = (message || '').trim();
			if (!text) return null;

			const lang = opts.lang || 'ko';
			const voiceMode = !!opts.voiceMode;
			const cacheKey = `${text}|${history.length}|${lang}|${voiceMode ? 'v' : 't'}`;

			if (_cache.has(cacheKey)) {
				const entry = _cache.get(cacheKey);
				if (Date.now() - entry.ts < 60000) {
					return entry.data;
				}
				_cache.delete(cacheKey);
			}

			if (_pendingPromise) return _pendingPromise;

			_pendingPromise = (async () => {
				try {
					const body = {
						message: text,
						history: history.slice(-6),
						lang: lang,
						voiceMode: voiceMode
					};
					const res = await SNW.Api.gemini(body);

					_cache.set(cacheKey, { ts: Date.now(), data: res });
					if (_cache.size > CACHE_MAX) {
						const firstKey = _cache.keys().next().value;
						_cache.delete(firstKey);
					}
					return res;
				} finally {
					_pendingPromise = null;
				}
			})();

			return _pendingPromise;
		}
	};
})(window.SNW);



/* ---- 146.ai.voice.js (4330 bytes) ---- */
// =========================================================
// 146.ai.voice.js — SNW.AIVoice
// Layer 3 (음성 입력 STT & 음성 합성 TTS)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
	'use strict';

	let _currentRecognition = null;
	let _wakeRecognition = null;

	SNW.AIVoice = {
		isSTTSupported() {
			return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
		},

		isTTSSupported() {
			return ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
		},

		detectLang(text) {
			if (!text) return 'ko-KR';
			const koMatches = text.match(/[가-힣]/g) || [];
			const cleanLen = text.replace(/\s/g, '').length;
			if (cleanLen === 0) return 'ko-KR';
			return (koMatches.length / cleanLen > 0.2) ? 'ko-KR' : 'en-US';
		},

		startListening(opts = {}) {
			return new Promise((resolve, reject) => {
				if (!this.isSTTSupported()) {
					return reject(new Error('STT_NOT_SUPPORTED'));
				}

				this.stopListening();

				const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
				const rec = new SpeechRecognition();
				_currentRecognition = rec;

				rec.lang = opts.lang || 'ko-KR';
				rec.continuous = false;
				rec.interimResults = false;
				rec.maxAlternatives = 1;

				let finished = false;

				rec.onresult = (e) => {
					finished = true;
					const transcript = (e.results && e.results[0] && e.results[0][0])
						? e.results[0][0].transcript
						: '';
					resolve({ transcript });
				};

				rec.onerror = (e) => {
					finished = true;
					reject(new Error(e.error || 'STT_ERROR'));
				};

				rec.onend = () => {
					_currentRecognition = null;
					if (!finished) {
						resolve({ transcript: '' });
					}
				};

				try {
					rec.start();
				} catch (err) {
					reject(err);
				}
			});
		},

		stopListening() {
			if (_currentRecognition) {
				try { _currentRecognition.abort(); } catch { }
				_currentRecognition = null;
			}
		},

		speak(text, opts = {}) {
			if (!this.isTTSSupported() || !text) return;

			this.stopSpeaking();

			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = opts.lang || this.detectLang(text);
			utter.rate = opts.rate || 1.0;
			utter.pitch = opts.pitch || 1.0;

			// 최적 보이스 탐색
			try {
				const voices = window.speechSynthesis.getVoices() || [];
				const langPrefix = utter.lang.substring(0, 2);
				const matchedVoice = voices.find(v => v.lang.startsWith(langPrefix));
				if (matchedVoice) utter.voice = matchedVoice;
			} catch { }

			window.speechSynthesis.speak(utter);
		},

		stopSpeaking() {
			if (this.isTTSSupported()) {
				try { window.speechSynthesis.cancel(); } catch { }
			}
		},

		// =====================================================
		// 웨이크워드 감지 (옵션: "헤이 윈드", "hey wind")
		// =====================================================
		startWakeDetection(opts = {}) {
			if (!this.isSTTSupported()) return false;
			this.stopWakeDetection();

			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			const rec = new SpeechRecognition();
			_wakeRecognition = rec;

			rec.continuous = true;
			rec.interimResults = true;
			rec.lang = opts.lang || 'ko-KR';

			const wakeKeywords = ['헤이 윈드', '헤이윈드', '헤이 wind', 'hey wind', 'hi wind'];
			let isCooldown = false;

			rec.onresult = (e) => {
				if (isCooldown) return;
				for (let i = e.resultIndex; i < e.results.length; i++) {
					const transcript = (e.results[i][0].transcript || '').toLowerCase();
					const matched = wakeKeywords.some(w => transcript.includes(w));
					if (matched) {
						isCooldown = true;
						if (opts.onWake) opts.onWake();
						setTimeout(() => { isCooldown = false; }, 4000);
						break;
					}
				}
			};

			rec.onerror = (e) => {
				if (e.error !== 'no-speech' && opts.onError) opts.onError(e);
			};

			rec.onend = () => {
				if (_wakeRecognition === rec) {
					try { rec.start(); } catch { }
				}
			};

			try {
				rec.start();
				return true;
			} catch (err) {
				return false;
			}
		},

		stopWakeDetection() {
			if (_wakeRecognition) {
				const rec = _wakeRecognition;
				_wakeRecognition = null;
				try { rec.abort(); } catch { }
			}
		}
	};
})(window.SNW);



/* ---- 147.ai.live.js (9572 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 147.ai.live.js
 * 모듈약어 : SNW.AiLive
 * 모듈명 : Smart Nature Wind Gemini Live Voice Client (Bidi WS & Guardrails)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Gemini Live Bi-directional WebSocket 연결 관리
 *  - 16kHz 마이크 스트리밍 / 24kHz 스피커 재생 큐 통합
 *  - Barge-in(인터럽션) 실시간 처리
 *  - 12개 ESP32 스마트 바람 제어 도구 브리지 실행
 *  - 30초 주기 사용량(오디오 초, 비용) 측정 및 NVS 동기화
 *  - 일일 30분 상한 도달 시 안전 종료 및 REST 폴백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _ws = null;
	let _isConnected = false;
	let _isConnecting = false;
	let _sessionStartTime = 0;
	let _lastReportTime = 0;
	let _usageIntervalId = null;

	let _callbacks = {
		onStateChange: null, // (state, details)
		onText: null,        // (text, isComplete)
		onToolCall: null,    // (name, args, result)
		onVolume: null,      // (level 0..1)
		onError: null,       // (err)
		onCostUpdate: null   // (costStatus)
	};

	function getTodayDateStr() {
		const now = new Date();
		const y = now.getFullYear();
		const m = String(now.getMonth() + 1).padStart(2, '0');
		const d = String(now.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	const AiLive = {
		isSupported() {
			return !!(window.WebSocket && SNW.AudioCapture && SNW.AudioCapture.isSupported());
		},

		isConnected() {
			return _isConnected;
		},

		isConnecting() {
			return _isConnecting;
		},

		async startSession(callbacks = {}) {
			if (_isConnected || _isConnecting) return;
			_callbacks = Object.assign(_callbacks, callbacks);

			_isConnecting = true;
			this._emitState('connecting');

			const todayDate = getTodayDateStr();

			try {
				// 1. 일일 30분 가드레일 토큰 획득
				const tokenRes = await SNW.Api.getAiLiveToken(todayDate);
				if (tokenRes.level === 'cap' || (tokenRes.remainingSec !== undefined && tokenRes.remainingSec <= 0)) {
					const msg = tokenRes.error || (SNW.I18n ? SNW.I18n.t('ai.dailyCapReached') : 'Daily Live limit reached (30 min)');
					throw new Error(msg);
				}

				if (callbacks.onCostUpdate) {
					callbacks.onCostUpdate(tokenRes);
				}

				// 2. 초기 Live WS 설정 조회 (엄격 프롬프트 및 도구 선언)
				const cfgRes = await SNW.Api.getAiLiveConfig();
				const token = tokenRes.token;
				const wsUrl = `${tokenRes.wsUrl || 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent'}?key=${token}`;

				// 3. AudioPlayback 초기화
				if (SNW.AudioPlayback) {
					SNW.AudioPlayback.init({
						onStateChange: (isPlaying) => {
							this._emitState(isPlaying ? 'speaking' : 'listening');
						}
					});
				}

				// 4. WebSocket 연결
				_ws = new WebSocket(wsUrl);

				_ws.onopen = async () => {
					_isConnected = true;
					_isConnecting = false;
					_sessionStartTime = Date.now();
					_lastReportTime = _sessionStartTime;

					// 초기 setup 메시지 전송
					this._sendSetup(cfgRes, tokenRes.voiceName);

					// 마이크 캡처 시작
					await this._startMicCapture();

					// 30초 주기 사용량 보고 타이머 시작
					this._startUsageReporting();

					this._emitState('connected');
				};

				_ws.onmessage = async (event) => {
					await this._handleMessage(event.data);
				};

				_ws.onerror = (e) => {
					console.error('[AiLive] WebSocket error:', e);
					if (_callbacks.onError) _callbacks.onError(new Error('WebSocket connection error'));
				};

				_ws.onclose = (event) => {
					this._handleClose(event);
				};

			} catch (err) {
				_isConnecting = false;
				this.stopSession();
				if (_callbacks.onError) {
					_callbacks.onError(err);
				}
				this._emitState('idle');
				throw err;
			}
		},

		_sendSetup(cfgRes, voiceName) {
			const setupMsg = {
				setup: {
					model: 'models/gemini-2.0-flash-exp',
					generationConfig: {
						responseModalities: ['AUDIO'],
						speechConfig: {
							voiceConfig: {
								prebuiltVoiceConfig: {
									voiceName: voiceName || 'Aoede'
								}
							}
						}
					},
					systemInstruction: {
						parts: [{ text: (cfgRes && cfgRes.systemInstruction) || 'You are SmartNatureWind voice controller.' }]
					},
					tools: (cfgRes && cfgRes.tools) || []
				}
			};
			_ws.send(JSON.stringify(setupMsg));
		},

		async _startMicCapture() {
			if (!SNW.AudioCapture) return;
			await SNW.AudioCapture.start({
				onChunk: (base64Pcm) => {
					if (!_isConnected || !_ws || _ws.readyState !== WebSocket.OPEN) return;
					const chunkMsg = {
						realtimeInput: {
							mediaChunks: [
								{
									mimeType: 'audio/pcm;rate=16000',
									data: base64Pcm
								}
							]
						}
					};
					_ws.send(JSON.stringify(chunkMsg));
				},
				onVolume: (level) => {
					if (_callbacks.onVolume) {
						_callbacks.onVolume(level);
					}
				},
				onError: (err) => {
					console.error('[AiLive] AudioCapture error:', err);
					if (_callbacks.onError) _callbacks.onError(err);
				}
			});
		},

		async _handleMessage(data) {
			let msg = null;
			try {
				if (typeof data === 'string') {
					msg = JSON.parse(data);
				} else if (data instanceof Blob) {
					const text = await data.text();
					msg = JSON.parse(text);
				}
			} catch (e) {
				console.warn('[AiLive] JSON parse error:', e);
				return;
			}

			if (!msg) return;

			// 1. 모델 발화 파트 처리 (오디오/텍스트)
			if (msg.serverContent) {
				const sc = msg.serverContent;

				// Barge-in 인터럽트 수신 시 스피커 즉시 중단
				if (sc.interrupted) {
					if (SNW.AudioPlayback) {
						SNW.AudioPlayback.flush();
					}
					this._emitState('interrupted');
				}

				if (sc.modelTurn && sc.modelTurn.parts) {
					for (const part of sc.modelTurn.parts) {
						// 24kHz 오디오 청크
						if (part.inlineData && part.inlineData.data) {
							if (SNW.AudioPlayback) {
								SNW.AudioPlayback.enqueueBase64Pcm(part.inlineData.data);
							}
						}
						// 텍스트 청크
						if (part.text && _callbacks.onText) {
							_callbacks.onText(part.text, false);
						}
					}
				}

				if (sc.turnComplete && _callbacks.onText) {
					_callbacks.onText('', true);
				}
			}

			// 2. Tool Call (도구 실행) 처리
			if (msg.toolCall) {
				this._handleToolCall(msg.toolCall);
			}
		},

		async _handleToolCall(toolCall) {
			this._emitState('executing');
			try {
				const calls = toolCall.functionCalls || [];
				// ESP32 백엔드 브리지 호출
				const bridgeRes = await SNW.Api.callAiLiveFunction({ functionCalls: calls });
				const responses = (bridgeRes && bridgeRes.functionResponses) || [];

				if (_callbacks.onToolCall) {
					for (let i = 0; i < calls.length; i++) {
						const c = calls[i];
						const r = responses[i] ? responses[i].response : null;
						_callbacks.onToolCall(c.name, c.args, r);
					}
				}

				// Live WebSocket으로 응답 전송
				if (_isConnected && _ws && _ws.readyState === WebSocket.OPEN) {
					const replyMsg = {
						toolResponse: {
							functionResponses: responses
						}
					};
					_ws.send(JSON.stringify(replyMsg));
				}
			} catch (e) {
				console.error('[AiLive] Tool execution error:', e);
			}
		},

		_startUsageReporting() {
			this._stopUsageReporting();
			_usageIntervalId = setInterval(() => {
				this._reportUsageDelta();
			}, 30000); // 30초 주기
		},

		_stopUsageReporting() {
			if (_usageIntervalId) {
				clearInterval(_usageIntervalId);
				_usageIntervalId = null;
			}
		},

		async _reportUsageDelta() {
			if (!_sessionStartTime) return;
			const now = Date.now();
			const elapsedSec = Math.round((now - _lastReportTime) / 1000);
			if (elapsedSec <= 0) return;

			_lastReportTime = now;
			const todayDate = getTodayDateStr();

			// 오디오 1초당 비용 추정 ($0.0003/sec -> x1000: 0.3)
			const estCostX1000 = Math.round(elapsedSec * 0.3);

			try {
				const res = await SNW.Api.reportAiUsage({
					todayDate,
					audioSec: elapsedSec,
					turnCount: 0,
					costUsdX1000: estCostX1000
				});

				if (_callbacks.onCostUpdate) {
					_callbacks.onCostUpdate(res);
				}

				// 상한 도달 시 자동 종료
				if (res && res.level === 'cap') {
					const msg = SNW.I18n ? SNW.I18n.t('ai.dailyCapReached') : 'Daily Live audio limit reached (30 min)';
					if (_callbacks.onError) _callbacks.onError(new Error(msg));
					this.stopSession();
				}
			} catch (e) {
				console.warn('[AiLive] Failed to report usage:', e);
			}
		},

		_handleClose(event) {
			_isConnected = false;
			_isConnecting = false;
			this._stopUsageReporting();
			this._reportUsageDelta(); // 남은 사용량 최종 보고

			if (SNW.AudioCapture) SNW.AudioCapture.stop();
			if (SNW.AudioPlayback) SNW.AudioPlayback.flush();

			this._emitState('closed');
		},

		stopSession() {
			_isConnecting = false;
			if (_isConnected && _ws) {
				try {
					_ws.close();
				} catch (_) {}
			}
			_ws = null;
			_isConnected = false;

			this._stopUsageReporting();
			this._reportUsageDelta();

			if (SNW.AudioCapture) SNW.AudioCapture.stop();
			if (SNW.AudioPlayback) SNW.AudioPlayback.close();

			this._emitState('idle');
		},

		_emitState(state, details) {
			if (_callbacks.onStateChange) {
				_callbacks.onStateChange(state, details);
			}
		}
	};

	SNW.AiLive = AiLive;

})(window, window.SNW);



/* ---- 147a.audio.capture.js (5508 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 147a.audio.capture.js
 * 모듈약어 : SNW.AudioCapture
 * 모듈명 : Smart Nature Wind Audio Input & PCM16 Streamer (Live AEC)
 * ------------------------------------------------------
 * 기능 요약:
 *  - 마이크 캡처 (AEC/노이즈 캔슬레이션/자동 게인)
 *  - 인라인 Blob URL 기반 AudioWorklet (단일 번들 404 방지)
 *  - 16kHz, 16-bit PCM 모노 인코딩 및 base64 스트리밍
 *  - 실시간 볼륨 메터링 (UI 애니메이션 연동)
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _audioCtx = null;
	let _mediaStream = null;
	let _sourceNode = null;
	let _workletNode = null;
	let _analyserNode = null;
	let _animId = null;
	let _isCapturing = false;

	// 인라인 AudioWorklet 소스 (Float32 -> Int16 변환)
	const WORKLET_CODE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.bufferSize = 2048; // ~128ms at 16kHz
		this.buffer = new Int16Array(this.bufferSize);
		this.offset = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		if (!input || !input[0]) return true;
		const channel = input[0];

		for (let i = 0; i < channel.length; i++) {
			// Float32 [-1.0, 1.0] -> Int16 [-32768, 32767]
			let s = Math.max(-1, Math.min(1, channel[i]));
			this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

			if (this.offset >= this.bufferSize) {
				this.port.postMessage(this.buffer.buffer, [this.buffer.buffer]);
				this.buffer = new Int16Array(this.bufferSize);
				this.offset = 0;
			}
		}
		return true;
	}
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`;

	function arrayBufferToBase64(buffer) {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	}

	const AudioCapture = {
		isSupported() {
			return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.AudioContext);
		},

		isCapturing() {
			return _isCapturing;
		},

		async start({ onChunk, onVolume, onError } = {}) {
			if (_isCapturing) return true;
			if (!this.isSupported()) {
				const err = new Error('Audio recording not supported in this browser');
				if (onError) onError(err);
				throw err;
			}

			try {
				// 1. 마이크 스트림 획득 (AEC 활성화)
				_mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: {
						channelCount: 1,
						sampleRate: 16000,
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					},
					video: false
				});

				// 2. 16kHz AudioContext 생성
				const AudioContextClass = window.AudioContext || window.webkitAudioContext;
				_audioCtx = new AudioContextClass({ sampleRate: 16000 });
				if (_audioCtx.state === 'suspended') {
					await _audioCtx.resume();
				}

				// 3. 인라인 Blob URL 기반 AudioWorklet 등록
				const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
				const workletUrl = URL.createObjectURL(blob);
				try {
					await _audioCtx.audioWorklet.addModule(workletUrl);
				} finally {
					URL.revokeObjectURL(workletUrl);
				}

				// 4. 노드 연결
				_sourceNode = _audioCtx.createMediaStreamSource(_mediaStream);
				_workletNode = new AudioWorkletNode(_audioCtx, 'pcm-capture-processor');

				// 볼륨 분석기
				_analyserNode = _audioCtx.createAnalyser();
				_analyserNode.fftSize = 256;
				_sourceNode.connect(_analyserNode);
				_sourceNode.connect(_workletNode);

				// 5. PCM 청크 수신 이벤트
				_workletNode.port.onmessage = (event) => {
					if (!_isCapturing) return;
					const pcmBuffer = event.data; // ArrayBuffer (Int16)
					const base64Pcm = arrayBufferToBase64(pcmBuffer);
					if (onChunk) {
						onChunk(base64Pcm, pcmBuffer);
					}
				};

				// 6. 실시간 볼륨 미터링 루프
				if (onVolume) {
					const pcmData = new Uint8Array(_analyserNode.frequencyBinCount);
					const updateMeter = () => {
						if (!_isCapturing) return;
						_analyserNode.getByteFrequencyData(pcmData);
						let sum = 0;
						for (let i = 0; i < pcmData.length; i++) {
							sum += pcmData[i];
						}
						const avg = sum / pcmData.length;
						const norm = Math.min(1.0, avg / 128.0);
						onVolume(norm);
						_animId = requestAnimationFrame(updateMeter);
					};
					_animId = requestAnimationFrame(updateMeter);
				}

				_isCapturing = true;
				return true;
			} catch (e) {
				this.stop();
				if (onError) onError(e);
				throw e;
			}
		},

		stop() {
			_isCapturing = false;

			if (_animId) {
				cancelAnimationFrame(_animId);
				_animId = null;
			}

			if (_workletNode) {
				try {
					_workletNode.port.onmessage = null;
					_workletNode.disconnect();
				} catch (_) {}
				_workletNode = null;
			}

			if (_analyserNode) {
				try { _analyserNode.disconnect(); } catch (_) {}
				_analyserNode = null;
			}

			if (_sourceNode) {
				try { _sourceNode.disconnect(); } catch (_) {}
				_sourceNode = null;
			}

			if (_mediaStream) {
				try {
					_mediaStream.getTracks().forEach(t => t.stop());
				} catch (_) {}
				_mediaStream = null;
			}

			if (_audioCtx) {
				try {
					_audioCtx.close();
				} catch (_) {}
				_audioCtx = null;
			}
		}
	};

	SNW.AudioCapture = AudioCapture;

})(window, window.SNW);



/* ---- 147b.audio.playback.js (3677 bytes) ---- */
/*
 * ------------------------------------------------------
 * 소스명 : 147b.audio.playback.js
 * 모듈약어 : SNW.AudioPlayback
 * 모듈명 : Smart Nature Wind Audio Output & PCM24 Stream Player (Barge-in Support)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Gemini Live 24kHz PCM16 모노 스트리밍 큐 재생
 *  - 실시간 스케줄링 (끊김 없는 Seamless 재생)
 *  - Barge-in(끼어들기) 발생 시 즉시 큐 비우기 및 중단 (flush)
 *  - 재생 상태 콜백
 * ------------------------------------------------------
 */

(function (window, SNW) {
	'use strict';

	SNW = SNW || {};
	window.SNW = SNW;

	let _audioCtx = null;
	let _nextPlayTime = 0;
	let _scheduledSources = [];
	let _isPlaying = false;
	let _onStateChange = null;

	function base64ToArrayBuffer(base64) {
		const binaryString = window.atob(base64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	function pcm16ToFloat32(arrayBuffer) {
		const int16Array = new Int16Array(arrayBuffer);
		const float32Array = new Float32Array(int16Array.length);
		for (let i = 0; i < int16Array.length; i++) {
			float32Array[i] = int16Array[i] / 32768.0;
		}
		return float32Array;
	}

	const AudioPlayback = {
		init({ onStateChange } = {}) {
			_onStateChange = onStateChange || null;
		},

		_ensureAudioContext() {
			if (!_audioCtx || _audioCtx.state === 'closed') {
				const AudioContextClass = window.AudioContext || window.webkitAudioContext;
				_audioCtx = new AudioContextClass({ sampleRate: 24000 });
			}
			if (_audioCtx.state === 'suspended') {
				_audioCtx.resume();
			}
			return _audioCtx;
		},

		isPlaying() {
			return _isPlaying;
		},

		_setPlaying(val) {
			if (_isPlaying !== val) {
				_isPlaying = val;
				if (_onStateChange) _onStateChange(_isPlaying);
			}
		},

		enqueueBase64Pcm(base64Data) {
			if (!base64Data) return;
			try {
				const buffer = base64ToArrayBuffer(base64Data);
				this.enqueueArrayBuffer(buffer);
			} catch (e) {
				console.warn('[AudioPlayback] Failed to decode base64 audio:', e);
			}
		},

		enqueueArrayBuffer(arrayBuffer) {
			const ctx = this._ensureAudioContext();
			const float32Data = pcm16ToFloat32(arrayBuffer);

			const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
			audioBuffer.getChannelData(0).set(float32Data);

			const source = ctx.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(ctx.destination);

			const now = ctx.currentTime;
			const startTime = Math.max(now, _nextPlayTime);
			source.start(startTime);
			_nextPlayTime = startTime + audioBuffer.duration;

			_scheduledSources.push(source);
			this._setPlaying(true);

			source.onended = () => {
				const idx = _scheduledSources.indexOf(source);
				if (idx !== -1) {
					_scheduledSources.splice(idx, 1);
				}
				if (_scheduledSources.length === 0 && ctx.currentTime >= _nextPlayTime) {
					this._setPlaying(false);
				}
			};
		},

		// Barge-in 발생 시 현재 재생 중인 모든 버퍼 즉시 중단 및 큐 초기화
		flush() {
			for (const src of _scheduledSources) {
				try {
					src.stop();
					src.disconnect();
				} catch (_) {}
			}
			_scheduledSources = [];
			if (_audioCtx) {
				_nextPlayTime = _audioCtx.currentTime;
			} else {
				_nextPlayTime = 0;
			}
			this._setPlaying(false);
		},

		close() {
			this.flush();
			if (_audioCtx) {
				try { _audioCtx.close(); } catch (_) {}
				_audioCtx = null;
			}
			this._setPlaying(false);
		}
	};

	SNW.AudioPlayback = AudioPlayback;

})(window, window.SNW);



/* ---- 147c.ai.chat.core.js (3515 bytes) ---- */
// =========================================================
// 147c.ai.chat.core.js — AI 대화 공용 코어 (REST/Live)
// Layer 3 (AI 공용 로직)
// - 290.page.ai.js (풀스크린 L2)와 999b.ai-sheet.js (FAB)가 공유
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    const MAX_MSG_LEN = 4000;

    class AIChatCore {
        constructor(opts = {}) {
            this._history = [];
            this._mode = opts.mode || 'rest';  // 'rest' | 'live'
            this._isLiveConnected = false;
            this._isListening = false;
            this._liveCostStatus = null;
            
            // UI 콜백
            this._onStateChange = opts.onStateChange || (() => {});
            this._onMessage     = opts.onMessage     || (() => {});
            this._onToolCall    = opts.onToolCall    || (() => {});
            this._onCostUpdate  = opts.onCostUpdate  || (() => {});
            this._onError       = opts.onError       || (() => {});
            
            // 저장된 이력 로드
            if (SNW.AIClient && typeof SNW.AIClient.loadHistory === 'function') {
                this._history = SNW.AIClient.loadHistory() || [];
            }
        }

        getHistory() {
            return this._history;
        }

        async send(text, opts = {}) {
            const msg = (text || '').trim();
            if (!msg) return null;
            if (msg.length > MAX_MSG_LEN) {
                const err = new Error(`Message exceeds maximum length (${MAX_MSG_LEN})`);
                this._onError(err);
                throw err;
            }

            const userEntry = {
                role: 'user',
                text: msg,
                timestamp: Date.now()
            };
            this._history.push(userEntry);
            this._onMessage(userEntry);

            try {
                this._onStateChange({ busy: true });
                let replyText = '(응답 없음)';
                let toolCalls = [];

                if (SNW.Api && typeof SNW.Api.postAI === 'function') {
                    const res = await SNW.Api.postAI({ prompt: msg, mode: this._mode });
                    if (res && res.reply) replyText = res.reply;
                    if (res && res.toolCalls) toolCalls = res.toolCalls;
                } else {
                    replyText = 'AI 클라이언트를 초기화할 수 없습니다.';
                }
                
                const modelEntry = {
                    role: 'model',
                    text: replyText,
                    timestamp: Date.now(),
                    toolCalls: toolCalls
                };
                this._history.push(modelEntry);
                this._onMessage(modelEntry);

                if (SNW.AIClient && typeof SNW.AIClient.saveHistory === 'function') {
                    SNW.AIClient.saveHistory(this._history);
                }
                return modelEntry;
            } catch (err) {
                this._onError(err);
                throw err;
            } finally {
                this._onStateChange({ busy: false });
            }
        }

        clearHistory() {
            this._history = [];
            if (SNW.AIClient && typeof SNW.AIClient.clearHistory === 'function') {
                SNW.AIClient.clearHistory();
            }
            this._onStateChange({ cleared: true });
        }
    }

    SNW.AIChatCore = AIChatCore;
})(window.SNW);


/* ---- 150.ui.rule_editor.js (13986 bytes) ---- */
// =========================================================
// core/150.ui.rule_editor.js — 규칙 편집기 (Pause/Stop 이원화)
// Layer 3 (UI Component) — 전역 재사용
// 의존: SNW.DomUtil, SNW.I18n, SNW.UI.modal
// =========================================================
window.SNW = window.SNW || {};
SNW.UI = SNW.UI || {};
(function (SNW) {
    'use strict';

    const DEFAULT_RULE = {
        timer:        { enabled: false, minutes: 0 },
        offTime:      { enabled: false, time: '00:00' },
        tempLow:      { enabled: false, mode: 'PAUSE', threshold: 22.0, hysteresis: 0.5 },
        diLow:        { enabled: false, mode: 'PAUSE', threshold: 65.0, hysteresis: 3.0 },
        pirPause:     { enabled: false, holdSec: 120 },
        smartComfort: { enabled: false, intervalMin: 5, level: 2 },
    };

    // ── 원클릭 추천 템플릿 3종 ──
    const TEMPLATES = {
        deepSleep: {
            labelKey: 'rule.template.deepSleep',
            rule: {
                timer:    { enabled: true, minutes: 480 },
                offTime:  { enabled: true, time: '06:00' },
                tempLow:  { enabled: true, mode: 'STOP',  threshold: 23.0, hysteresis: 0.0 },
                diLow:    { enabled: false, mode: 'PAUSE', threshold: 65.0, hysteresis: 3.0 },
                pirPause: { enabled: true, holdSec: 600 },
                smartComfort: { enabled: true, intervalMin: 5, level: 2 },
            },
        },
        babySafe: {
            labelKey: 'rule.template.babySafe',
            rule: {
                timer:    { enabled: false, minutes: 0 },
                offTime:  { enabled: false, time: '00:00' },
                tempLow:  { enabled: true, mode: 'STOP',  threshold: 24.0, hysteresis: 0.0 },
                diLow:    { enabled: true, mode: 'STOP',  threshold: 68.0, hysteresis: 0.0 },
                pirPause: { enabled: true, holdSec: 300 },
                smartComfort: { enabled: true, intervalMin: 5, level: 2 },
            },
        },
        officeFocus: {
            labelKey: 'rule.template.officeFocus',
            rule: {
                timer:    { enabled: true, minutes: 120 },
                offTime:  { enabled: false, time: '00:00' },
                tempLow:  { enabled: false, mode: 'PAUSE', threshold: 22.0, hysteresis: 0.5 },
                diLow:    { enabled: true, mode: 'PAUSE', threshold: 70.0, hysteresis: 3.0 },
                pirPause: { enabled: true, holdSec: 180 },
                smartComfort: { enabled: false, intervalMin: 5, level: 2 },
            },
        },
    };

    function _esc(v) {
        return SNW.DomUtil ? SNW.DomUtil.escape(v) : String(v);
    }

    function _nz(v, fb) {
        return (v === null || v === undefined) ? fb : v;
    }

    function _renderRuleForm(rule) {
        const t = (k) => (SNW.I18n ? SNW.I18n.t(k) : k);
        const r = rule || DEFAULT_RULE;

        return `
        <div class="snw-rule-editor">
            <div class="snw-rule-templates">
                ${Object.entries(TEMPLATES).map(([k, v]) => `
                    <button type="button" class="snw-btn snw-btn--sm" data-rule-template="${k}">
                        ${t(v.labelKey)}
                    </button>
                `).join('')}
            </div>

            <fieldset class="snw-rule-section" data-section="pause">
                <legend>${t('rule.sectionPause')}</legend>

                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="pirPause.enabled" ${r.pirPause.enabled ? 'checked' : ''}> ${t('rule.pir.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="0" max="3600" step="10" data-rule="pirPause.holdSec" value="${_nz(r.pirPause.holdSec, 120)}" class="snw-input-sm">
                        <span class="snw-rule-unit">${t('unit.seconds')}</span>
                    </div>
                </div>

                <div class="snw-rule-row snw-rule-row--stack">
                    <label><input type="checkbox" data-rule="tempLow.enabled" ${r.tempLow.enabled ? 'checked' : ''}> ${t('rule.tempLow.enabled')}</label>
                    <div class="snw-rule-mode">
                        <label><input type="radio" name="tempLowMode" value="PAUSE" ${r.tempLow.mode === 'PAUSE' ? 'checked' : ''}> ${t('rule.modePause')}</label>
                        <label><input type="radio" name="tempLowMode" value="STOP"  ${r.tempLow.mode === 'STOP'  ? 'checked' : ''}> ${t('rule.modeStop')}</label>
                    </div>
                    <div class="snw-rule-inputs">
                        <span>${t('rule.threshold')}</span>
                        <input type="number" step="0.5" min="10" max="35" data-rule="tempLow.threshold" value="${_nz(r.tempLow.threshold, 22.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">°C</span>
                        <span class="snw-rule-hint" data-rule-hint="tempLow">${t('rule.hysteresis')}</span>
                        <input type="number" step="0.5" min="0" max="10" data-rule="tempLow.hysteresis" value="${_nz(r.tempLow.hysteresis, 0.5)}" class="snw-input-sm">
                        <span class="snw-rule-unit">°C</span>
                    </div>
                </div>

                <div class="snw-rule-row snw-rule-row--stack">
                    <label><input type="checkbox" data-rule="diLow.enabled" ${r.diLow.enabled ? 'checked' : ''}> ${t('rule.diLow.enabled')}</label>
                    <div class="snw-rule-mode">
                        <label><input type="radio" name="diLowMode" value="PAUSE" ${r.diLow.mode === 'PAUSE' ? 'checked' : ''}> ${t('rule.modePause')}</label>
                        <label><input type="radio" name="diLowMode" value="STOP"  ${r.diLow.mode === 'STOP'  ? 'checked' : ''}> ${t('rule.modeStop')}</label>
                    </div>
                    <div class="snw-rule-inputs">
                        <span>${t('rule.threshold')}</span>
                        <input type="number" step="1" min="0" max="100" data-rule="diLow.threshold" value="${_nz(r.diLow.threshold, 65.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">DI</span>
                        <span class="snw-rule-hint">${t('rule.hysteresis')}</span>
                        <input type="number" step="1" min="0" max="20" data-rule="diLow.hysteresis" value="${_nz(r.diLow.hysteresis, 3.0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">DI</span>
                    </div>
                </div>
            </fieldset>

            <fieldset class="snw-rule-section" data-section="stop">
                <legend>${t('rule.sectionStop')}</legend>
                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="timer.enabled" ${r.timer.enabled ? 'checked' : ''}> ${t('rule.timer.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="1" max="1440" step="10" data-rule="timer.minutes" value="${_nz(r.timer.minutes, 0)}" class="snw-input-sm">
                        <span class="snw-rule-unit">${t('rule.timer.suffix')}</span>
                    </div>
                </div>
                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="offTime.enabled" ${r.offTime.enabled ? 'checked' : ''}> ${t('rule.offTime.enabled')}</label>
                    <div class="snw-rule-inputs">
                        <input type="time" data-rule="offTime.time" value="${_nz(r.offTime.time, '00:00')}" class="snw-input-sm">
                        <span class="snw-rule-unit">${t('rule.offTime.suffix')}</span>
                    </div>
                </div>
            </fieldset>

            <fieldset class="snw-rule-section" data-section="comfort">
                <legend>${t('rule.sectionComfort')}</legend>
                <div class="snw-rule-row">
                    <label><input type="checkbox" data-rule="smartComfort.enabled" ${r.smartComfort.enabled ? 'checked' : ''}> ${t('rule.smartComfort.interval')}</label>
                    <div class="snw-rule-inputs">
                        <input type="number" min="1" max="60" data-rule="smartComfort.intervalMin" value="${_nz(r.smartComfort.intervalMin, 5)}" class="snw-input-sm">
                        <span class="snw-rule-unit">min</span>
                    </div>
                </div>
            </fieldset>

            <div class="snw-rule-tips">
                <p>💡 ${t('rule.tipModes')}</p>
                <p>👶 ${t('rule.tipBabySafe')}</p>
            </div>
        </div>`;
    }

    function _getPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
    }

    function _setPath(obj, path, val) {
        const parts = path.split('.');
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = val;
    }

    // =========================================================
    // Public: SNW.UI.ruleEditor.showModal(rule, opts) → Promise<rule|null>
    // =========================================================
    SNW.UI.ruleEditor = {
        /**
         * @param {Object} initRule — 초기 규칙 (없으면 기본값)
         * @param {Object} opts     — { title?: string }
         * @returns {Promise<Object|null>}
         */
        showModal(initRule, opts) {
            const title = (opts && opts.title) || (SNW.I18n ? SNW.I18n.t('rule.title') : '규칙');

            // 깊은 복사
            const working = JSON.parse(JSON.stringify(
                Object.assign({}, DEFAULT_RULE, initRule || {})
            ));
            // 각 서브 객체 보장
            for (const k of Object.keys(DEFAULT_RULE)) {
                if (!working[k]) working[k] = JSON.parse(JSON.stringify(DEFAULT_RULE[k]));
            }

            const content = document.createElement('div');
            content.innerHTML = _renderRuleForm(working);

            // 템플릿 클릭
            content.querySelectorAll('[data-rule-template]').forEach(btn => {
                btn.onclick = () => {
                    const key = btn.getAttribute('data-rule-template');
                    const tpl = TEMPLATES[key];
                    if (!tpl) return;
                    Object.assign(working, JSON.parse(JSON.stringify(tpl.rule)));
                    content.innerHTML = _renderRuleForm(working);
                    _rebind();
                };
            });

            function _rebind() {
                // 템플릿 재바인딩
                content.querySelectorAll('[data-rule-template]').forEach(btn => {
                    btn.onclick = () => {
                        const key = btn.getAttribute('data-rule-template');
                        const tpl = TEMPLATES[key];
                        if (!tpl) return;
                        Object.assign(working, JSON.parse(JSON.stringify(tpl.rule)));
                        content.innerHTML = _renderRuleForm(working);
                        _rebind();
                    };
                });

                // 필드 변경 → working 갱신
                content.querySelectorAll('[data-rule]').forEach(el => {
                    const handler = () => {
                        const path = el.getAttribute('data-rule');
                        if (el.type === 'checkbox') {
                            _setPath(working, path, el.checked);
                        } else if (el.type === 'number') {
                            _setPath(working, path, Number(el.value) || 0);
                        } else {
                            _setPath(working, path, el.value);
                        }
                    };
                    el.addEventListener('change', handler);
                    el.addEventListener('input', handler);
                });

                // mode 라디오
                ['tempLowMode', 'diLowMode'].forEach(name => {
                    const arr = content.querySelectorAll(`input[name="${name}"]`);
                    const key = name === 'tempLowMode' ? 'tempLow.mode' : 'diLow.mode';
                    arr.forEach(radio => {
                        radio.addEventListener('change', () => {
                            if (radio.checked) _setPath(working, key, radio.value);
                        });
                    });
                });
            }
            _rebind();

            // 검증
            function _validate() {
                const errs = [];
                if (working.tempLow.mode === 'PAUSE' && working.tempLow.enabled &&
                    (working.tempLow.hysteresis < 0.5)) {
                    errs.push(SNW.I18n.t('rule.validate.hysteresisTemp'));
                }
                if (working.diLow.mode === 'PAUSE' && working.diLow.enabled &&
                    (working.diLow.hysteresis < 3.0)) {
                    errs.push(SNW.I18n.t('rule.validate.hysteresisDi'));
                }
                return errs;
            }

            return new Promise(resolve => {
                let modalRef = SNW.UI.modal(
                    title, content,
                    async () => {
                        const errs = _validate();
                        if (errs.length > 0) {
                            if (SNW.ToastUtil) SNW.ToastUtil.warn(errs.join(' / '));
                            return false;
                        }
                        resolve(working);
                        return true;
                    },
                    () => { resolve(null); },
                    { width: '520px' }
                );
            });
        },

        DEFAULT_RULE,
        TEMPLATES,
    };
})(window.SNW);


