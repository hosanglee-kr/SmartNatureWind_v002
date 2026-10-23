// =========================================================
// 110.ui.slider.js — SNW.UI.slider (디바운스 슬라이더)
// Layer 3 (UI 컴포넌트) — Layer 0~2 참조
//  - 드래그 중 값 표시, 종료 시 디바운스 후 onChange
//  - 외부 set() 호출 시 (사용자 조작 중 아닐 때) 동기화
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    SNW.UI = SNW.UI || {};

    /**
     * 슬라이더
     * @param {object} opts
     *   root       : HTMLElement
     *   min        : number (기본 0)
     *   max        : number (기본 100)
     *   value      : number (기본 50)
     *   label      : string
     *   unit       : string
     *   onChange   : (value:number) => void (디바운스 후)
     *   debounceMs : number (기본 SNW.C.DEBOUNCE_MS.SLIDER)
     * @returns {{set: function(number), get: function():number}}
     */
    SNW.UI.slider = function (opts) {
        const {
            root,
            min = 0, max = 100, value = 50,
            label = '', unit = '',
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
            </div>`);

        const input = root.querySelector('[data-input]');
        const valEl = root.querySelector('[data-val]');

        let dragging = false;

        input.addEventListener('input', () => {
            dragging = true;
            if (valEl) valEl.textContent = input.value;
        });

        input.addEventListener('change', () => {
            dragging = false;
            debounced(Number(input.value));
        });

        // 터치/포인터 종료 감지
        input.addEventListener('pointerup',    () => { dragging = false; });
        input.addEventListener('pointercancel',() => { dragging = false; });

        return {
            set(v) {
                if (dragging) return;    // 사용자 조작 중에는 무시
                const n = Math.max(min, Math.min(max, Number(v) || 0));
                input.value = String(n);
                if (valEl) valEl.textContent = String(n);
            },
            get() { return Number(input.value); }
        };
    };

})(window.SNW);
