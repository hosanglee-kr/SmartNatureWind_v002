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
    
})(window.SNW);