// =========================================================
// 245.page.simulation.js — SNW.Page.Simulation (SIM-6 재설계)
// 파라미터 덤프 → 바람 체험실
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
    (function (SNW) {
        'use strict';
        SNW.Page.Simulation = class Simulation {
            constructor(container) {
                this.el = container;
                this._active = true;
                this._mode = 'preview';
            }

            async mount() {
                this.el.innerHTML = '';
                this._renderShell();
                await this._loadPresets();
                this._bindEvents();
            }
            unmount() { this._active = false; }

                _renderShell() {
                    this.el.innerHTML = `
                <section class="snw-card">
                    <h2>🎮 바람 체험실</h2>
                    <div class="snw-tabs" style="margin-bottom:12px;display:flex;gap:4px;">
                        <button type="button" class="snw-tab-btn is-active" data-mode="preview">🎬 가상 체험</button>
                        <button type="button" class="snw-tab-btn" data-mode="real">🔊 실제 체험</button>
                    </div>
                    <div data-slot="content"></div>
                    <details class="snw-accordion" style="margin-top:16px;">
                        <summary style="cursor:pointer;font-weight:600;padding:6px 0;">⚙️ 고급 파라미터 (개발자용)</summary>
                        <div class="snw-accordion__content" data-slot="advanced" style="padding:12px;background:var(--snw-surface);border-radius:6px;margin-top:8px;"></div>
                    </details>
                </section>`;
                }

        async _loadPresets() {
                    try {
                const data = await SNW.Api.listWindProfiles();
                const presets = data?.windDict?.presets || [];
                const styles  = data?.windDict?.styles  || [];
                SNW.Store.set({ _presetsCache: presets, _stylesCache: styles });

                    const sim = SNW.Store.get().sim || {};
                    const content = this.el.querySelector('[data-slot="content"]');
                    content.innerHTML = `
                    <h3 style="margin-bottom:8px;">프리셋 선택</h3>
                    <div id="sim-presets" class="snw-preset-grid" style="margin-bottom:16px;display:grid;grid-template-columns:repeat(5, 1fr);gap:6px;"></div>
                    <h3 style="margin-bottom:8px;">스타일 선택</h3>
                    <div id="sim-styles" class="snw-style-selector" style="margin-bottom:16px;display:flex;gap:6px;"></div>
                    <canvas data-pv-canvas width="600" height="200"
                            style="width:100%;height:200px;background:var(--snw-bg-2);border-radius:6px;margin-bottom:8px;"></canvas>
                    <div data-pv-info style="font-size:12px;color:var(--snw-text-dim);margin-bottom:12px;"></div>
                    <button type="button" class="snw-btn snw-btn-primary" data-action="apply"
                            style="width:100%;padding:10px;font-weight:bold;">이 설정 적용</button>`;

                    const presetGrid = content.querySelector('#sim-presets');
                    presets.forEach(p => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'snw-preset-card' + (p.code === (sim.presetCode || 'OCEAN') ? ' is-selected' : '');
                        btn.dataset.code = p.code;
                        btn.innerHTML = `<span class="snw-preset-card__name">${SNW.I18n.t('preset.' + p.code) || p.name}</span>`;
                        btn.onclick = () => {
                            presetGrid.querySelectorAll('.snw-preset-card').forEach(c => c.classList.remove('is-selected'));
                            btn.classList.add('is-selected');
                            this._updatePreview();
                        };
                        presetGrid.appendChild(btn);
                    });

                    const styleTabs = content.querySelector('#sim-styles');
                    styles.forEach(s => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'snw-style-btn' + (s.code === (sim.styleCode || 'BALANCE') ? ' is-active' : '');
                        btn.dataset.style = s.code;
                        btn.textContent = SNW.I18n.t('style.' + s.code) || s.code;
                        btn.onclick = () => {
                            styleTabs.querySelectorAll('.snw-style-btn').forEach(b => b.classList.remove('is-active'));
                            btn.classList.add('is-active');
                            this._updatePreview();
                        };
                        styleTabs.appendChild(btn);
                    });

                    // [Phase5 5.3] async 메서드 호출 (fire-and-forget)
                    this._updatePreview();
                    this._renderAdvanced();
                } catch (e) { SNW.LogUtil.warn('[Sim] load 실패', e); }
            }

        // ======================================================
        // [Phase5 5.3] async 전환 (ADR-5: generate 반환 Promise)
        //  - 기존: sync 호출 → preview가 Promise → preview.points undefined
        //  - 이후: await → 실제 파형 데이터 사용
        // ======================================================
        async _updatePreview() {
            const pc = this.el.querySelector('#sim-presets .is-selected')?.dataset.code || 'OCEAN';
            const sc = this.el.querySelector('#sim-styles .is-active')?.dataset.style || 'BALANCE';

            if (!SNW.Preview || typeof SNW.Preview.generate !== 'function') return;

            let pv = null;
            try {
                pv = await SNW.Preview.generate(pc, sc, null);
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Sim] preview fail', e);
                return;
            }
            if (!pv) return;

            const cv = this.el.querySelector('[data-pv-canvas]');
            if (cv && typeof SNW.Preview._animate === 'function') {
                SNW.Preview._animate(cv, pv.points);
            }

            const f = SNW.Preview.toFeelings(pv.intensity, pv.variability, pv.gustFreq);
            const infoEl = this.el.querySelector('[data-pv-info]');
            if (infoEl) {
                infoEl.innerHTML = `
                    평균 <b>${pv.avg} m/s</b> ·
                    시원함 ${'●'.repeat(f.coolness)}${'○'.repeat(5 - f.coolness)} ·
                    부드러움 ${'●'.repeat(f.smoothness)}${'○'.repeat(5 - f.smoothness)} ·
                    역동성 ${'●'.repeat(f.dynamism)}${'○'.repeat(5 - f.dynamism)}`;
            }
        }

        // ======================================================
        // [Phase5 5.3] motion 소스 수정
        //  - 이전: data?.motion?.motion (data=windDict → 항상 undefined)
        //  - 이후: SNW.Api.getMotion() 비동기 fetch
        // ======================================================
        async _renderAdvanced() {
            const slot = this.el.querySelector('[data-slot="advanced"]');
            if (!slot) return;

            let motion = {};
            try {
                const data = await SNW.Api.getMotion();
                motion = (data && data.motion) || {};
            } catch (e) {
                if (SNW.LogUtil) SNW.LogUtil.warn('[Sim] motion fetch fail', e);
            }

            const t = motion.timing || {};
            const s = motion.sim || {};
            slot.innerHTML = `
                <div class="snw-form-row" style="margin-bottom:8px;"><label>Sim Interval (ms)</label>
                    <input type="number" id="sim-interval" value="${t.simIntervalMs ?? 500}"
                           style="padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);width:100%;border-radius:4px;"></div>
                <div class="snw-form-row" style="margin-bottom:8px;"><label>Gust Interval (ms)</label>
                    <input type="number" id="sim-gust-interval" value="${t.gustIntervalMs ?? 2000}"
                           style="padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);width:100%;border-radius:4px;"></div>
                <div class="snw-form-row" style="margin-bottom:8px;"><label>Turb Sigma</label>
                    <input type="number" step="0.01" id="sim-turbsigma" value="${s.turbSigma ?? 0.5}"
                           style="padding:6px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);width:100%;border-radius:4px;"></div>
                <button type="button" class="snw-btn" data-action="save-adv" style="margin-top:8px;">고급 저장</button>`;
        }

        _bindEvents() {
                                this.el.querySelectorAll('[data-mode]').forEach(btn => {
                                    btn.onclick = () => {
                                        this._mode = btn.dataset.mode;
                                        this.el.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('is-active', b === btn));
                                        SNW.ToastUtil.info(this._mode === 'preview' ? '🎬 미리보기 모드' : '🔊 실제 체험 모드');
                                    };
                                });
                                this.el.addEventListener('click', async (e) => {
                                    const act = e.target.closest('[data-action]');
                                    if (!act) return;
                                    if (act.dataset.action === 'apply') await this._onApply();
                                    if (act.dataset.action === 'save-adv') await this._onSaveAdv();
                                });
                            }

        async _onApply() {
                                const pc = this.el.querySelector('#sim-presets .is-selected')?.dataset.code || 'OCEAN';
                                const sc = this.el.querySelector('#sim-styles .is-active')?.dataset.style || 'BALANCE';
                                try {
                                    if (this._mode === 'real') {
                                        await SNW.Api.overridePreset({ presetCode: pc, styleCode: sc, durationSec: 30 });
                                        SNW.ToastUtil.success('실제 30초 체험 시작');
                                    } else {
                                        await SNW.Api.patchSim({
                                            presetCode: pc, styleCode: sc,
                                            override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 }
                                        });
                                        SNW.ToastUtil.success('설정 적용 완료');
                                    }
                        } catch(e) { SNW.ErrorHandler.handle(e, 'sim.apply'); }
                    }

        async _onSaveAdv() {
                        const q = s => this.el.querySelector(s);
                        try {
                            await SNW.Api.patchMotion({
                                motion: {
                                    timing: {
                                        simIntervalMs: Number(q('#sim-interval').value),
                                        gustIntervalMs: Number(q('#sim-gust-interval').value)
                                    },
                                    sim: { turbSigma: Number(q('#sim-turbsigma').value) }
                                }
                            });
                            await SNW.Api.saveConfig();
                        SNW.ToastUtil.success('고급 설정 저장');
                    } catch(e) { SNW.ErrorHandler.handle(e, 'sim.adv'); }
                }
            };
        }) (window.SNW);
