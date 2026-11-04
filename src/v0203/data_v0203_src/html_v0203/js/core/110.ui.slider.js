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