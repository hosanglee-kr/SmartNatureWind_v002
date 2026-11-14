// =========================================================
// 291.studio.js — Wind Design Studio (작곡)
// Layer 3 (Studio 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';

    // =========================================================
    // Step 편집기 (내부)
    // =========================================================
    class StepEditor {
        constructor(step, index, onChange, onDelete, onMoveUp, onMoveDown) {
            this.step = JSON.parse(JSON.stringify(step || this._defaultStep()));
            this.index = index;
            this.onChange = onChange;
            this.onDelete = onDelete;
            this.onMoveUp = onMoveUp;
            this.onMoveDown = onMoveDown;
            this.el = null;
            this._sparkline = null;
            this._debounceTimer = null;
        }

        _defaultStep() {
            return {
                stepNo: 1,
                durationMin: 20,
                type: 'PRESET',
                presetCode: 'OCEAN',
                styleCode: 'BALANCE',
                fixedSpeed: 0,
                override: {
                    enabled: false,
                    windIntensity: -1,
                    windVariability: -1,
                    gustFrequency: -1,
                },
            };
        }

        render() {
            const s = this.step;
            const isPreset = s.type === 'PRESET';
            const isFixed = s.type === 'FIXED';
            const isRest = s.type === 'REST';
            const ovr = s.override || { enabled: false };

            const el = document.createElement('div');
            el.className = 'snw-step-card';
            el.innerHTML = `
                <div class="snw-step-card__header">
                    <span class="snw-step-card__title">Step ${this.index + 1}</span>
                    <div class="snw-step-card__actions">
                        <button type="button" class="snw-icon-btn" data-action="up"   title="위로" ${this.index === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="snw-icon-btn" data-action="down" title="아래로">▼</button>
                        <button type="button" class="snw-icon-btn" data-action="sim-step" title="예상 파형 시뮬레이션">🎬</button>
                        <button type="button" class="snw-icon-btn snw-icon-btn--danger" data-action="delete" title="삭제">🗑</button>
                    </div>
                </div>

                <!-- 2열 그리드 -->
                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>타입</span>
                        <select data-field="type">
                            <option value="PRESET" ${isPreset ? 'selected' : ''}>프리셋 재생</option>
                            <option value="FIXED"  ${isFixed ? 'selected' : ''}>고정 풍속</option>
                            <option value="REST"   ${isRest ? 'selected' : ''}>휴지 (정지)</option>
                        </select>
                    </label>

                    <label class="snw-step-field">
                        <span>지속</span>
                        <div class="snw-step-field__row">
                            <input type="number" data-field="durationMin" min="1" max="1440" value="${s.durationMin || 20}">
                            <span class="snw-step-field__unit">분</span>
                        </div>
                    </label>
                </div>

                ${isPreset ? `
                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>프리셋</span>
                        <select data-field="presetCode">
                            ${this._presetOptions(s.presetCode)}
                        </select>
                    </label>
                    <label class="snw-step-field">
                        <span>스타일</span>
                        <select data-field="styleCode">
                            ${this._styleOptions(s.styleCode)}
                        </select>
                    </label>
                </div>` : ''}

                ${isFixed ? `
                <div class="snw-step-card__grid">
                    <label class="snw-step-field snw-step-field--full">
                        <span>고정 풍속 <b data-slot="fixed-label">${s.fixedSpeed || 50}%</b></span>
                        <input type="range" data-field="fixedSpeed" min="0" max="100" step="5" value="${s.fixedSpeed || 50}">
                    </label>
                </div>` : ''}

                ${isPreset ? `
                <!-- 물리 세부 조정 (Override) -->
                <details class="snw-step-card__override" ${ovr.enabled ? 'open' : ''}>
                    <summary style="display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:4px 0; list-style:none; outline:none;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <!-- pointer-events:none으로 클릭 시 summary 이벤트를 유도 -->
                            <input type="checkbox" data-field="overrideEnabled" ${ovr.enabled ? 'checked' : ''} style="pointer-events:none;">
                            <span>⚙ 물리 세부 조정 (Override)</span>
                        </div>
                        ${ovr.enabled ? `<span class="snw-badge snw-badge--warn" style="font-size:10px;padding:2px 6px;">수동 튜닝됨</span>` : ''}
                    </summary>
                    <div class="snw-step-card__override-body">
                        <div style="display:flex;justify-content:flex-end;margin-bottom:6px;">
                            <button type="button" class="snw-btn snw-btn--sm snw-btn--ghost" data-action="reset-ovr" style="font-size:11px;padding:2px 8px;" title="선택한 프리셋의 기본 물리 파라미터로 되돌립니다">
                                ↺ 기본값 원복
                            </button>
                        </div>
                        <label class="snw-step-field snw-step-field--full">
                            <span>바람 세기 (강도) <b data-slot="ovr-int-label">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b></span>
                            <input type="range" data-field="ovrIntensity" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>강약 변화폭 (변동성) <small style="color:var(--snw-text-dim);">[잔잔함 ↔ 역동적]</small> <b data-slot="ovr-var-label">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b></span>
                            <input type="range" data-field="ovrVariability" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>산들바람 빈도 (열기포/돌풍) <b data-slot="ovr-gust-label">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}%</b></span>
                            <input type="range" data-field="ovrGust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}">
                        </label>
                    </div>
                </details>` : ''}

                <div class="snw-step-card__sparkline" data-slot="sparkline"></div>
                <div class="snw-step-card__sparkline-meta" data-slot="sparkline-meta"></div>
            `;

            this.el = el;

            // 이벤트 바인딩
            const btnDel = el.querySelector('[data-action="delete"]');
            if (btnDel) btnDel.onclick = () => this.onDelete(this.index);
            const btnUp = el.querySelector('[data-action="up"]');
            if (btnUp) btnUp.onclick = () => this.onMoveUp(this.index);
            const btnDown = el.querySelector('[data-action="down"]');
            if (btnDown) btnDown.onclick = () => this.onMoveDown(this.index);
            const btnSim = el.querySelector('[data-action="sim-step"]');
            if (btnSim) {
                btnSim.onclick = async () => {
                    if (SNW.UI && typeof SNW.UI.simulationModal === 'function') {
                        await SNW.UI.simulationModal({
                            mode: 'single',
                            a: {
                                presetCode: this.step.presetCode || 'OCEAN',
                                styleCode: this.step.styleCode || 'BALANCE',
                                override: this.step.override,
                            },
                        });
                    }
                };
            }

            const btnResetOvr = el.querySelector('[data-action="reset-ovr"]');
            if (btnResetOvr) {
                btnResetOvr.onclick = () => this._resetOverrideToDefaults(el);
            }

            el.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => this._onFieldChange(el, input));
                input.addEventListener('change', () => this._onFieldChange(el, input));
            });

            // [추가] details 태그 열고 닫을 때 체크박스 상태 동기화
            const detailsEl = el.querySelector('.snw-step-card__override');
            if (detailsEl) {
                detailsEl.addEventListener('toggle', () => {
                    const chk = el.querySelector('[data-field="overrideEnabled"]');
                    if (chk && chk.checked !== detailsEl.open) {
                        chk.checked = detailsEl.open;
                        chk.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }

            // Sparkline 초기화
            if (SNW.UI && typeof SNW.UI.sparkline === 'function') {
                this._sparkline = SNW.UI.sparkline(
                    el.querySelector('[data-slot="sparkline"]'),
                    { color: '#4a9eff', baseline: 0 });
                this._updateSparkline();
            }

            return el;
        }

        _presetOptions(current) {
            const presets = (SNW.Studio._windDict && SNW.Studio._windDict.presets) || [];
            return presets.map(p =>
                `<option value="${p.code}" ${p.code === current ? 'selected' : ''}>${SNW.DomUtil ? SNW.DomUtil.escape(p.name || p.code) : p.code}</option>`
            ).join('');
        }

        _styleOptions(current) {
            const styles = (SNW.Studio._windDict && SNW.Studio._windDict.styles) || [];
            return styles.map(s =>
                `<option value="${s.code}" ${s.code === current ? 'selected' : ''}>${SNW.DomUtil ? SNW.DomUtil.escape(s.name || s.code) : s.code}</option>`
            ).join('');
        }

        _onFieldChange(el, input) {
            const field = input.getAttribute('data-field');
            const val = (input.type === 'checkbox') ? input.checked : input.value;

            if (!this.step.override) {
                this.step.override = { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 };
            }

            switch (field) {
                case 'type':
                    this.step.type = val;
                    if (val === 'PRESET' && !this.step.presetCode) this.step.presetCode = 'OCEAN';
                    if (val === 'PRESET' && !this.step.styleCode) this.step.styleCode = 'BALANCE';
                    this._rerender();
                    return;
                case 'durationMin':
                    this.step.durationMin = Math.max(1, Math.min(1440, Number(val) || 1));
                    break;
                case 'presetCode':
                    this.step.presetCode = val;
                    break;
                case 'styleCode':
                    this.step.styleCode = val;
                    break;
                case 'fixedSpeed':
                    this.step.fixedSpeed = Number(val) || 0;
                    const lbl = el.querySelector('[data-slot="fixed-label"]');
                    if (lbl) lbl.textContent = this.step.fixedSpeed + '%';
                    break;
                case 'overrideEnabled':
                    this.step.override.enabled = !!val;
                    if (val) {
                        if (this.step.override.windIntensity < 0) this.step.override.windIntensity = 70;
                        if (this.step.override.windVariability < 0) this.step.override.windVariability = 50;
                        if (this.step.override.gustFrequency < 0) this.step.override.gustFrequency = 45;
                    }
                    // 체크박스 상태에 맞춰 details 열고 닫기
                    const detailsEl = el.querySelector('.snw-step-card__override');
                    if (detailsEl) detailsEl.open = !!val;
                    break;
                case 'ovrIntensity':
                    this.step.override.windIntensity = Number(val);
                    this.step.override.enabled = true;
                    const chkInt = el.querySelector('[data-field="overrideEnabled"]');
                    if (chkInt) chkInt.checked = true;
                    const lInt = el.querySelector('[data-slot="ovr-int-label"]');
                    if (lInt) lInt.textContent = val + '%';
                    break;
                case 'ovrVariability':
                    this.step.override.windVariability = Number(val);
                    this.step.override.enabled = true;
                    const chkVar = el.querySelector('[data-field="overrideEnabled"]');
                    if (chkVar) chkVar.checked = true;
                    const lVar = el.querySelector('[data-slot="ovr-var-label"]');
                    if (lVar) lVar.textContent = val + '%';
                    break;
                case 'ovrGust':
                    this.step.override.gustFrequency = Number(val);
                    this.step.override.enabled = true;
                    const chkGust = el.querySelector('[data-field="overrideEnabled"]');
                    if (chkGust) chkGust.checked = true;
                    const lGust = el.querySelector('[data-slot="ovr-gust-label"]');
                    if (lGust) lGust.textContent = val + '%';
                    break;
            }

            this.onChange(this.index, this.step);
            this._scheduleSparklineUpdate();
        }

        _rerender() {
            const newEl = this.render();
            if (this.el && this.el.parentNode) {
                this.el.parentNode.replaceChild(newEl, this.el);
            }
            this.onChange(this.index, this.step);
        }

        _scheduleSparklineUpdate() {
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this._updateSparkline(), 250);
        }

        async _updateSparkline() {
            if (!this._sparkline || !SNW.Preview) return;
            const wave = await SNW.Preview.generateStep(this.step);
            if (wave && wave.points) {
                this._sparkline.render(wave.points);
                const meta = this.el.querySelector('[data-slot="sparkline-meta"]');
                if (meta) {
                    meta.textContent = wave.avg > 0
                        ? `예상 평균 ${wave.avg} m/s · 강도 ${Math.round(wave.intensity)}%`
                        : '완전 휴지 (0 m/s)';
                }
            }
        }

        _resetOverrideToDefaults(el) {
            const presets = (SNW.Studio._windDict && SNW.Studio._windDict.presets) || [];
            const target = presets.find(p => p.code === this.step.presetCode) || {};
            const factors = target.factors || {};

            const defInt = (factors.windIntensity != null) ? factors.windIntensity : 70;
            const defVar = (factors.windVariability != null) ? factors.windVariability : 50;
            const defGust = (factors.gustFrequency != null) ? factors.gustFrequency : 45;

            if (!this.step.override) {
                this.step.override = { enabled: true };
            }
            this.step.override.windIntensity = defInt;
            this.step.override.windVariability = defVar;
            this.step.override.gustFrequency = defGust;

            const inputInt = el.querySelector('[data-field="ovrIntensity"]');
            const inputVar = el.querySelector('[data-field="ovrVariability"]');
            const inputGust = el.querySelector('[data-field="ovrGust"]');
            const lblInt = el.querySelector('[data-slot="ovr-int-label"]');
            const lblVar = el.querySelector('[data-slot="ovr-var-label"]');
            const lblGust = el.querySelector('[data-slot="ovr-gust-label"]');

            if (inputInt) inputInt.value = defInt;
            if (inputVar) inputVar.value = defVar;
            if (inputGust) inputGust.value = defGust;
            if (lblInt) lblInt.textContent = `${defInt}%`;
            if (lblVar) lblVar.textContent = `${defVar}%`;
            if (lblGust) lblGust.textContent = `${defGust}%`;

            this._scheduleSparklineUpdate();
            this.onChange(this.index, this.step);
            if (SNW.ToastUtil) SNW.ToastUtil.info('프리셋 기본값으로 복원되었습니다.');
        }

        getStep() { return this.step; }
    }

    // =========================================================
    // Studio 페이지
    // =========================================================
    SNW.Studio = class Studio {
        constructor(container, params = {}) {
            this.el = container;
            this.params = params;
            this._active = true;
            this._steps = [];
            this._stepEditors = [];
            this._profileId = null;
            this._profileNo = 0;
            this._name = '';
            this._repeat = false;
            this._repeatCount = 0;
            this._currentRule = null; // [Stage 5] 규칙
        }

        static _windDict = null;

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">Studio 로딩 중...</div>';

            if (!SNW.Studio._windDict) {
                try {
                    const data = await SNW.Api.getWindDict();
                    SNW.Studio._windDict = data || { presets: [], styles: [] };
                    if (SNW.Preview) await SNW.Preview.init();
                } catch (e) {
                    this.el.innerHTML = '<div class="snw-error">WindDict 로드 실패</div>';
                    return;
                }
            }

            const editId = (this.params && this.params.edit) ? parseInt(this.params.edit, 10) : null;

            if (editId) {
                await this._loadProfile(editId);
            } else {
                this._resetNewProfile();
            }

            this._render();
        }

        unmount() {
            this._active = false;
        }

        _resetNewProfile() {
            this._profileId = null;
            this._profileNo = Math.floor(Date.now() / 1000) % 65535;
            this._name = '새 프로필';
            this._repeat = false;
            this._repeatCount = 0;
            this._steps = [this._defaultStep()];
            this._currentRule = null;
        }

        async _loadProfile(profileId) {
            try {
                const data = await SNW.Api.listProfiles();
                const root = (data && data.userProfiles) ? data.userProfiles : data;
                const profiles = (root && root.profiles) || [];
                const target = profiles.find(p => (p.profileId === profileId || p.profileNo === profileId));
                if (!target) {
                    if (SNW.ToastUtil) SNW.ToastUtil.warn('프로필을 찾을 수 없습니다.');
                    this._resetNewProfile();
                    return;
                }
                this._profileId = target.profileId || target.profileNo;
                this._profileNo = target.profileNo;
                this._name = target.name;
                this._repeat = !!target.repeatSegments;
                this._repeatCount = target.repeatCount || 0;
                this._steps = (target.steps && target.steps.length > 0) ? target.steps : [this._defaultStep()];
                this._currentRule = target.rule || null;
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('프로필 로드 실패');
                this._resetNewProfile();
            }
        }

        _defaultStep() {
            return {
                stepNo: 1, durationMin: 20, type: 'PRESET',
                presetCode: 'OCEAN', styleCode: 'BALANCE', fixedSpeed: 0,
                override: { enabled: false, windIntensity: -1, windVariability: -1, gustFrequency: -1 },
            };
        }

        _render() {
            const isEdit = !!this._profileId;

            this.el.innerHTML = `
                <div class="snw-studio">
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:16px;">
                        <h2 style="font-size:18px;margin-bottom:12px;color:var(--snw-text,#e6edf3);">${isEdit ? '프로필 편집' : '새 프로필 작곡'}</h2>

                        <div class="snw-form">
                            <div class="snw-form-row" style="margin-bottom:12px;">
                                <label style="display:block;font-size:12px;color:var(--snw-text-dim,#8b949e);margin-bottom:4px;">프로필 이름</label>
                                <input type="text" data-field="name" value="${SNW.DomUtil ? SNW.DomUtil.escape(this._name) : this._name}" maxlength="32" style="width:100%;padding:8px 10px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);">
                            </div>
                            
                            <div class="snw-form-row snw-form-row--inline" style="margin-bottom:16px;">
                                <label class="snw-step-checkbox" style="margin:0;">
                                    <input type="checkbox" data-field="repeat" ${this._repeat ? 'checked' : ''}>
                                    <span>반복</span>
                                </label>
                                <input type="number" data-field="repeatCount" min="0" max="99" value="${this._repeatCount}" placeholder="0" 
                                       style="width:70px;padding:6px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);text-align:center;">
                                <span class="snw-form-hint" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">회 (0=무한)</span>
                            </div>
                        </div>

                        <h3 class="snw-form-section" style="font-size:14px;color:var(--snw-primary,#4a9eff);margin:16px 0 10px;">Step 시퀀스</h3>
                        <div data-slot="steps"></div>

                        <button type="button" class="snw-btn snw-btn--add-step" data-action="add-step">
                            + Step 추가 (최대 8개)
                        </button>

                        <!-- [Stage 5] 스마트 쾌적 & 자동 정지 규칙 -->
                        <details class="snw-studio-rules" style="margin-top:20px;border:1px dashed var(--snw-border,#2f3844);border-radius:8px;padding:12px;background:var(--snw-surface-2,#232b36);">
                            <summary style="cursor:pointer;font-weight:600;font-size:14px;color:var(--snw-text,#e6edf3);">
                                ⚙ 스마트 쾌적 & 자동 정지 규칙
                            </summary>
                            <div data-slot="rule-summary" style="margin-top:12px;font-size:12px;color:var(--snw-text-dim,#8b949e);">
                                로딩 중...
                            </div>
                            <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" style="margin-top:8px;">
                                규칙 편집 →
                            </button>
                        </details>
                    </div>

                    <!-- 하단 액션 바 -->
                    <div class="snw-studio__bar">
                        <button type="button" class="snw-btn" data-action="preview-all" style="padding:8px 16px;background:rgba(74,158,255,0.1);color:var(--snw-primary,#4a9eff);border:1px solid var(--snw-primary,#4a9eff);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">🎬 미리보기</button>
                        <div style="display:flex; gap:8px;">
                            <button type="button" class="snw-btn" data-action="cancel" style="padding:8px 16px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;">취소</button>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="save" style="padding:8px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                ${isEdit ? '업데이트' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>`;

            // 폼 바인딩
            this.el.querySelector('[data-field="name"]').addEventListener('input', e => {
                this._name = e.target.value;
            });
            this.el.querySelector('[data-field="repeat"]').addEventListener('change', e => {
                this._repeat = e.target.checked;
            });
            this.el.querySelector('[data-field="repeatCount"]').addEventListener('input', e => {
                this._repeatCount = Math.max(0, parseInt(e.target.value, 10) || 0);
            });

            // 액션 바인딩
            this.el.querySelector('[data-action="add-step"]').onclick = () => this._onAddStep();
            this.el.querySelector('[data-action="cancel"]').onclick = () => this._onCancel();
            this.el.querySelector('[data-action="save"]').onclick = () => this._onSave();
            const btnPreviewAll = this.el.querySelector('[data-action="preview-all"]');
            if (btnPreviewAll) {
                btnPreviewAll.onclick = async () => {
                    const firstPreset = this._steps.find(s => s.type === 'PRESET');
                    if (!firstPreset) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('PRESET Step이 없어 시뮬레이션을 생성할 수 없습니다');
                        return;
                    }
                    if (SNW.UI && typeof SNW.UI.simulationModal === 'function') {
                        await SNW.UI.simulationModal({
                            mode: 'single',
                            a: {
                                presetCode: firstPreset.presetCode || 'OCEAN',
                                styleCode: firstPreset.styleCode || 'BALANCE',
                                override: firstPreset.override,
                            },
                        });
                    }
                };
            }

            // [Stage 5] 규칙 편집 진입점
            const _updateRuleSummary = () => {
                const ruleSummaryEl = this.el.querySelector('[data-slot="rule-summary"]');
                if (!ruleSummaryEl) return;
                const r = this._currentRule || {};
                const items = [];
                if (r.timer?.enabled)     items.push(`⏱️${r.timer.minutes}m`);
                if (r.offTime?.enabled)   items.push(`⏰${r.offTime.time}`);
                if (r.tempLow?.enabled)   items.push(`🌡️${r.tempLow.mode}`);
                if (r.diLow?.enabled)     items.push(`☀️${r.diLow.mode}`);
                if (r.pirPause?.enabled)  items.push(`👤${r.pirPause.holdSec}s`);
                if (r.smartComfort?.enabled) items.push(`✨auto`);
                ruleSummaryEl.textContent = items.length > 0 ? items.join(' · ') : '규칙 미설정 (클릭하여 추가)';
            };
            _updateRuleSummary();

            const btnEditRule = this.el.querySelector('[data-action="edit-rule"]');
            if (btnEditRule) {
                btnEditRule.onclick = async () => {
                    if (!SNW.UI.ruleEditor) return;
                    const newRule = await SNW.UI.ruleEditor.showModal(this._currentRule);
                    if (!newRule) return;
                    this._currentRule = newRule;
                    _updateRuleSummary();
                };
            }

            this._renderSteps();
        }

        _renderSteps() {
            const slot = this.el.querySelector('[data-slot="steps"]');
            if (!slot) return;
            slot.innerHTML = '';

            this._stepEditors = [];

            this._steps.forEach((step, idx) => {
                const editor = new StepEditor(
                    step, idx,
                    (i, s) => { this._steps[i] = s; },
                    (i) => this._onDeleteStep(i),
                    (i) => this._onMoveStep(i, -1),
                    (i) => this._onMoveStep(i, 1),
                );
                const stepEl = editor.render();
                slot.appendChild(stepEl);
                this._stepEditors.push(editor);
            });
        }

        _onAddStep() {
            if (this._steps.length >= 8) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn('Step은 최대 8개까지 추가 가능합니다.');
                return;
            }
            this._steps.push(this._defaultStep());
            this._renderSteps();
        }

        _onDeleteStep(idx) {
            if (this._steps.length <= 1) {
                if (SNW.ToastUtil) SNW.ToastUtil.warn('최소 1개의 Step이 필요합니다.');
                return;
            }
            this._steps.splice(idx, 1);
            this._steps.forEach((s, i) => { s.stepNo = i + 1; });
            this._renderSteps();
        }

        _onMoveStep(idx, dir) {
            const target = idx + dir;
            if (target < 0 || target >= this._steps.length) return;
            const tmp = this._steps[idx];
            this._steps[idx] = this._steps[target];
            this._steps[target] = tmp;
            this._steps.forEach((s, i) => { s.stepNo = i + 1; });
            this._renderSteps();
        }

        async _onSave() {
            if (!this._name.trim()) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('프로필 이름을 입력하세요.');
                return;
            }
            if (this._steps.length === 0) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('최소 1개의 Step이 필요합니다.');
                return;
            }
            for (const s of this._steps) {
                if (s.durationMin < 1 || s.durationMin > 1440) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error('Step 지속 시간은 1~1440분이어야 합니다.');
                    return;
                }
            }

            const profile = {
                profileNo: this._profileNo,
                name: this._name.trim(),
                enabled: true,
                repeatSegments: this._repeat,
                repeatCount: this._repeatCount,
                stepCount: this._steps.length,
                steps: this._steps,
                rule: this._currentRule,
            };

            try {
                let savedId = this._profileId;
                if (this._profileId) {
                    await SNW.Api.updateProfile(this._profileId, profile);
                } else {
                    const res = await SNW.Api.addProfile(profile);
                    if (res && (res.id || res.profileId || res.profileNo)) {
                        savedId = res.id || res.profileId || res.profileNo;
                    }
                }
                if (SNW.ToastUtil) SNW.ToastUtil.success(this._profileId ? '업데이트 완료' : '저장 완료');
                const targetProfId = savedId;
                setTimeout(() => {
                    if (targetProfId && confirm('지금 이 프로필을 재생해 보시겠어요?')) {
                        if (SNW.Api && typeof SNW.Api.startPlaylist === 'function') {
                            SNW.Api.startPlaylist(targetProfId);
                        }
                    }
                }, 400);
                SNW.Router.navigate('/wind/playlist');
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
            }
        }

        _onCancel() {
            if (confirm('편집 내용을 버리시겠습니까?')) {
                SNW.Router.navigate('/wind/playlist');
            }
        }
    };
})(window.SNW);
