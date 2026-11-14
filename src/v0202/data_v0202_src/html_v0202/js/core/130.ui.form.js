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
        
        // [U-010] cfg_windDict_0202.json 10개 프리셋 코드와 1:1 매칭
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

                card.addEventListener('mouseenter', () => {
                    const cv = card.querySelector('.snw-preset-card__spark');
                    if (!cv) return;
                    if (cv.dataset.drawn === '1') { cv.style.display = 'block'; return; }
                    const styleCode = SNW.Store.get().sim?.styleCode || 'BALANCE';
                    if (SNW.Preview && SNW.Preview.generate) {
                        const preview = SNW.Preview.generate(it.code, styleCode, null);
                        if (preview && preview.points) {
                            _drawSpark(cv, preview.points);
                            cv.dataset.drawn = '1';
                            cv.style.display = 'block';
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