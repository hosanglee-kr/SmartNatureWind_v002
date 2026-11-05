// =========================================================
// 291.studio.js — Wind Design Studio (작곡)
// Layer 3 (Studio 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
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
            const isFixed  = s.type === 'FIXED';
            const isRest   = s.type === 'REST';
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

                <div class="snw-step-card__grid">
                    <label class="snw-step-field">
                        <span>타입</span>
                        <select data-field="type">
                            <option value="PRESET" ${isPreset ? 'selected' : ''}>프리셋 재생</option>
                            <option value="FIXED"  ${isFixed  ? 'selected' : ''}>고정 풍속</option>
                            <option value="REST"   ${isRest   ? 'selected' : ''}>휴지 (정지)</option>
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
                <details class="snw-step-card__override" ${ovr.enabled ? 'open' : ''}>
                    <summary>
                        <label class="snw-step-checkbox" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                            <input type="checkbox" data-field="overrideEnabled" ${ovr.enabled ? 'checked' : ''}>
                            <span>⚙ 물리 세부 조정 (Override)</span>
                        </label>
                    </summary>
                    <div class="snw-step-card__override-body">
                        <label class="snw-step-field snw-step-field--full">
                            <span>강도 <b data-slot="ovr-int-label">${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}%</b></span>
                            <input type="range" data-field="ovrIntensity" min="0" max="100" value="${ovr.windIntensity >= 0 ? ovr.windIntensity : 70}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>변동성 <b data-slot="ovr-var-label">${ovr.windVariability >= 0 ? ovr.windVariability : 50}%</b></span>
                            <input type="range" data-field="ovrVariability" min="0" max="100" value="${ovr.windVariability >= 0 ? ovr.windVariability : 50}">
                        </label>
                        <label class="snw-step-field snw-step-field--full">
                            <span>돌풍 <b data-slot="ovr-gust-label">${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}%</b></span>
                            <input type="range" data-field="ovrGust" min="0" max="100" value="${ovr.gustFrequency >= 0 ? ovr.gustFrequency : 45}">
                        </label>
                    </div>
                </details>` : ''}

                <div class="snw-step-card__sparkline" data-slot="sparkline" style="height:40px;margin-top:10px;"></div>
                <div class="snw-step-card__sparkline-meta" data-slot="sparkline-meta" style="font-size:11px;color:var(--snw-text-dim,#8b949e);margin-top:4px;"></div>
            `;

            this.el = el;

            // 이벤트
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
                                styleCode:  this.step.styleCode  || 'BALANCE',
                                override:   this.step.override,
                            },
                        });
                    }
                };
            }

            el.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input',  () => this._onFieldChange(el, input));
                input.addEventListener('change', () => this._onFieldChange(el, input));
            });

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
                    if (val === 'PRESET' && !this.step.styleCode)  this.step.styleCode  = 'BALANCE';
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
                        if (this.step.override.windIntensity < 0)   this.step.override.windIntensity = 70;
                        if (this.step.override.windVariability < 0) this.step.override.windVariability = 50;
                        if (this.step.override.gustFrequency < 0)   this.step.override.gustFrequency = 45;
                    }
                    break;
                case 'ovrIntensity':
                    this.step.override.windIntensity = Number(val);
                    const lInt = el.querySelector('[data-slot="ovr-int-label"]');
                    if (lInt) lInt.textContent = val + '%';
                    break;
                case 'ovrVariability':
                    this.step.override.windVariability = Number(val);
                    const lVar = el.querySelector('[data-slot="ovr-var-label"]');
                    if (lVar) lVar.textContent = val + '%';
                    break;
                case 'ovrGust':
                    this.step.override.gustFrequency = Number(val);
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
            this._profileId = null;    // edit mode
            this._profileNo = 0;
            this._name = '';
            this._repeat = false;
            this._repeatCount = 0;
        }

        static _windDict = null;

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">Studio 로딩 중...</div>';

            // windDict 로드
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

            // URL query 또는 params에서 edit ID 확인
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
                            <div class="snw-form-row snw-form-row--inline" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                                <label class="snw-step-checkbox" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                                    <input type="checkbox" data-field="repeat" ${this._repeat ? 'checked' : ''}>
                                    <span>반복</span>
                                </label>
                                <input type="number" data-field="repeatCount" min="0" max="99" value="${this._repeatCount}" placeholder="0=무한" style="width:80px;padding:6px;background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);">
                                <span class="snw-form-hint" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">회 (0=무한)</span>
                            </div>
                        </div>

                        <h3 class="snw-form-section" style="font-size:14px;color:var(--snw-primary,#4a9eff);margin:16px 0 10px;">Step 시퀀스</h3>
                        <div data-slot="steps"></div>

                        <button type="button" class="snw-btn snw-btn--add-step" data-action="add-step" style="width:100%;padding:10px;margin-top:10px;background:var(--snw-surface-2,#232b36);border:1px dashed var(--snw-border,#2f3844);color:var(--snw-text,#e6edf3);border-radius:var(--snw-radius-sm,4px);cursor:pointer;">
                            + Step 추가 (최대 8개)
                        </button>
                    </div>

                    <div class="snw-studio__bar">
                        <button type="button" class="snw-btn" data-action="preview-all" style="padding:8px 16px;background:var(--snw-surface-2,#232b36);color:var(--snw-primary,#4a9eff);border:1px solid var(--snw-primary,#4a9eff);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">🎬 시나리오 체험</button>
                        <button type="button" class="snw-btn" data-action="cancel" style="padding:8px 16px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;">취소</button>
                        <button type="button" class="snw-btn snw-btn-primary" data-action="save" style="padding:8px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                            ${isEdit ? '업데이트' : '저장'}
                        </button>
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
            this.el.querySelector('[data-action="cancel"]').onclick   = () => this._onCancel();
            this.el.querySelector('[data-action="save"]').onclick     = () => this._onSave();
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
                                styleCode:  firstPreset.styleCode  || 'BALANCE',
                                override:   firstPreset.override,
                            },
                        });
                    }
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
                autoOff: {
                    timer:   { enabled: false, minutes: 0 },
                    offTime: { enabled: false, time: '00:00' },
                    offTemp: { enabled: false, temp: 0 },
                },
                motion: { pir: { enabled: true, holdSec: 120 } },
            };

            try {
                if (this._profileId) {
                    await SNW.Api.updateProfile(this._profileId, profile);
                } else {
                    await SNW.Api.addProfile(profile);
                }
                if (SNW.ToastUtil) SNW.ToastUtil.success(this._profileId ? '업데이트 완료' : '저장 완료');
                const targetProfId = this._profileId;
                setTimeout(() => {
                    if (targetProfId && confirm('지금 이 프로필을 재생해 보시겠어요?')) {
                        if (SNW.Api && typeof SNW.Api.startPlaylist === 'function') {
                            SNW.Api.startPlaylist(targetProfId);
                        }
                    }
                }, 400);
                SNW.Router.navigate('/automation/playlist');
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
            }
        }

        _onCancel() {
            if (confirm('편집 내용을 버리시겠습니까?')) {
                SNW.Router.navigate('/automation/playlist');
            }
        }
    };
})(window.SNW);

