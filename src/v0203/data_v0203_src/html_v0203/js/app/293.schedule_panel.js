// =========================================================
// 293.schedule_panel.js — Schedule 편집 (Profile 참조만)
// Layer 3 (Schedule 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.SchedulePanel = class SchedulePanel {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._schedules = [];
            this._profiles = [];
        }

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">로딩 중...</div>';
            await this._load();
            this._render();
        }

        unmount() { this._active = false; }

        async _load() {
            try {
                const [schData, profData] = await Promise.all([
                    SNW.Api.listSchedules ? SNW.Api.listSchedules() : null,
                    SNW.Api.listProfiles ? SNW.Api.listProfiles() : null,
                ]);

                if (schData) {
                    const sRoot = schData.schedules ? schData.schedules : schData;
                    this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
                } else {
                    this._schedules = [];
                }

                if (profData) {
                    const pRoot = profData.userProfiles ? profData.userProfiles : profData;
                    this._profiles = (pRoot && pRoot.profiles) ? pRoot.profiles : (Array.isArray(pRoot) ? pRoot : []);
                } else {
                    this._profiles = [];
                }
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('스케줄 로드 실패');
            }
        }

        _render() {
            // 참조 가능한 프로필이 없으면 안내
            if (this._profiles.length === 0) {
                this.el.innerHTML = `
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:32px;text-align:center;">
                        <div class="snw-empty">
                            <p style="color:var(--snw-text-dim,#8b949e);margin-bottom:16px;">먼저 프로필을 작곡해야 스케줄을 만들 수 있습니다.</p>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="to-studio" style="padding:10px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                🎨 Studio에서 작곡하기
                            </button>
                        </div>
                    </div>`;
                const btn = this.el.querySelector('[data-action="to-studio"]');
                if (btn) {
                    btn.onclick = () => {
                        SNW.Router.navigate('/wind/studio');
                    };
                }
                return;
            }

            this.el.innerHTML = `
                <div class="snw-schedule">
                    <div class="snw-schedule__header">
                        <span>${this._schedules.length}개 스케줄</span>
                        <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="add" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                            + 새 스케줄
                        </button>
                    </div>

                    <div class="snw-schedule__list" data-slot="list"></div>

                    <div class="snw-schedule__note">
                        💡 스케줄은 <b>플레이리스트를 자동 재생</b>합니다.
                        Step 편집은 Studio 탭에서 하세요.
                    </div>
                </div>`;

            const addBtn = this.el.querySelector('[data-action="add"]');
            if (addBtn) addBtn.onclick = () => this._openEditor(null);

            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;

            if (this._schedules.length === 0) {
                listSlot.innerHTML = '<div class="snw-empty" style="text-align:center;padding:32px;color:var(--snw-text-dim,#8b949e);">아직 스케줄이 없습니다</div>';
                return;
            }

            this._schedules.forEach(sch => {
                listSlot.appendChild(this._renderScheduleCard(sch));
            });
        }

        _renderScheduleCard(sch) {
            const card = document.createElement('div');
            card.className = 'snw-schedule-item' + (sch.enabled ? '' : ' is-disabled');

            const profile = this._profiles.find(p => p.profileId === sch.profileId);
            const profileName = profile ? profile.name : '(삭제된 프로필)';
            const profileMissing = !profile;

            const days = (sch.period && sch.period.days) || [0,0,0,0,0,0,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
            const daysStr = days.map((d, i) => d ? dayNames[i] : '·').join(' ');

            const startTime = (sch.period && sch.period.startTime) || '00:00';
            const endTime   = (sch.period && sch.period.endTime)   || '23:59';

            card.innerHTML = `
                <div class="snw-schedule-item__head">
                    <label class="snw-switch">
                        <input type="checkbox" data-action="toggle" ${sch.enabled ? 'checked' : ''}>
                        <span class="snw-switch__slider"></span>
                    </label>
                    <span class="snw-schedule-item__name">${SNW.DomUtil ? SNW.DomUtil.escape(sch.name) : sch.name}</span>
                    <button type="button" class="snw-icon-btn" data-action="edit" title="편집">✏️</button>
                    <button type="button" class="snw-icon-btn snw-icon-btn--danger" data-action="delete" title="삭제">🗑</button>
                </div>
                <div class="snw-schedule-item__time">
                    ⏰ ${startTime} ~ ${endTime}
                </div>
                <div class="snw-schedule-item__days">${daysStr}</div>
                <div class="snw-schedule-item__ref ${profileMissing ? 'is-missing' : ''}">
                    🎵 ${SNW.DomUtil ? SNW.DomUtil.escape(profileName) : profileName}
                </div>`;

            // 액션 바인딩
            const toggleInput = card.querySelector('[data-action="toggle"]');
            if (toggleInput) {
                toggleInput.addEventListener('change', async (e) => {
                    await this._onToggle(sch, e.target.checked);
                });
            }

            const editBtn = card.querySelector('[data-action="edit"]');
            if (editBtn) editBtn.onclick = () => this._openEditor(sch);

            const delBtn = card.querySelector('[data-action="delete"]');
            if (delBtn) delBtn.onclick = () => this._onDelete(sch);

            return card;
        }

        _openEditor(sch) {
            const isEdit = !!sch;
            let isSimpleMode = isEdit ? (sch.name && sch.name.startsWith('[간단]')) : true;
            let editedRule = (isEdit && sch.rule) ? JSON.parse(JSON.stringify(sch.rule)) : null;
            const isCustom = isEdit && sch.ruleOverride === true;
            const days = sch ? ((sch.period && sch.period.days) || [0,0,0,0,0,0,0]) : [0,1,1,1,1,1,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

            const PRESETS = [
                { code: 'OCEAN', name: '바다 바람 (OCEAN)' },
                { code: 'COUNTRY_BREEZE', name: '산들바람 (COUNTRY_BREEZE)' },
                { code: 'MEDITERRANEAN', name: '지중해 (MEDITERRANEAN)' },
                { code: 'MOUNTAIN', name: '고산 계곡 (MOUNTAIN)' },
                { code: 'PLAINS', name: '들판 바람 (PLAINS)' },
                { code: 'HARBOR_BREEZE', name: '항구 바람 (HARBOR_BREEZE)' },
                { code: 'FOREST_CANOPY', name: '숲속 그늘 (FOREST_CANOPY)' },
                { code: 'URBAN_SUNSET', name: '도시 노을 (URBAN_SUNSET)' },
                { code: 'TROPICAL_RAIN', name: '열대 우림 (TROPICAL_RAIN)' },
                { code: 'DESERT_NIGHT', name: '사막 밤 (DESERT_NIGHT)' },
            ];

            const STYLES = [
                { code: 'BALANCE', name: '⚖️ 균형 (BALANCE)' },
                { code: 'ACTIVE',  name: '⚡ 활력 (ACTIVE)' },
                { code: 'FOCUS',   name: '🎯 집중 (FOCUS)' },
                { code: 'RELAX',   name: '🍃 휴식 (RELAX)' },
                { code: 'SLEEP',   name: '🌙 수면 (SLEEP)' },
            ];

            const content = document.createElement('div');
            content.className = 'snw-schedule-editor';
            content.innerHTML = `
                <div class="snw-form">
                    <!-- [Stage 10] 모드 토글 (간단 / 고급) -->
                    <div class="snw-mode-toggle" style="display:flex;gap:8px;margin-bottom:14px;">
                        <button type="button" class="snw-btn ${isSimpleMode ? 'snw-btn-primary' : ''}" data-mode="simple" style="flex:1;">
                            ⚡ ${SNW.I18n.t('schedule.modeSimple')}
                        </button>
                        <button type="button" class="snw-btn ${!isSimpleMode ? 'snw-btn-primary' : ''}" data-mode="advanced" style="flex:1;">
                            🎼 ${SNW.I18n.t('schedule.modeAdvanced')}
                        </button>
                    </div>

                    <div class="snw-form-row" style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">스케줄 이름</label>
                        <input type="text" data-field="name" maxlength="32" class="snw-input"
                               style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit ? (SNW.DomUtil ? SNW.DomUtil.escape(sch.name) : sch.name) : '새 스케줄'}">
                    </div>

                    <div class="snw-form-row" style="margin-bottom:12px;">
                        <label style="display:block;margin-bottom:6px;font-weight:600;font-size:13px;">요일</label>
                        <div class="snw-day-picker">
                            ${dayNames.map((d, i) =>
                                `<label class="snw-day-chip ${days[i] ? 'is-active' : ''}">
                                    <input type="checkbox" data-day="${i}" ${days[i] ? 'checked' : ''}>
                                    <span>${d}</span>
                                </label>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="snw-form-row snw-form-row--inline" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                        <label style="font-weight:600;font-size:13px;">시작</label>
                        <input type="time" data-field="startTime" class="snw-input"
                               style="padding:6px 10px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit && sch.period ? sch.period.startTime : '08:00'}">
                        <label style="font-weight:600;font-size:13px;">종료</label>
                        <input type="time" data-field="endTime" class="snw-input"
                               style="padding:6px 10px;background:var(--snw-surface-2,#12161c);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius-sm,4px);color:var(--snw-text,#e6edf3);"
                               value="${isEdit && sch.period ? sch.period.endTime : '20:00'}">
                    </div>

                    <!-- 간단 모드 컨테이너 -->
                    <div id="simple-mode-section" style="display:${isSimpleMode ? 'block' : 'none'};background:var(--snw-surface-2,#12161c);padding:12px;border-radius:6px;margin-bottom:12px;">
                        <div class="snw-form-row" style="margin-bottom:10px;">
                            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">바람 프리셋 선택</label>
                            <select id="simple-preset-select" style="width:100%;padding:8px;background:var(--snw-surface-1,#1f242c);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                ${PRESETS.map(p => `<option value="${p.code}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="snw-form-row">
                            <label style="display:block;margin-bottom:4px;font-weight:600;font-size:13px;">바람 스타일 선택</label>
                            <select id="simple-style-select" style="width:100%;padding:8px;background:var(--snw-surface-1,#1f242c);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                ${STYLES.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- 고급 모드 컨테이너 -->
                    <div id="advanced-mode-section" style="display:${!isSimpleMode ? 'block' : 'none'};">
                        <h3 class="snw-form-section" style="font-size:14px;margin:16px 0 8px 0;font-weight:600;">🎵 실행할 플레이리스트</h3>
                        <div class="snw-profile-picker">
                            ${this._profiles.map(p => `
                                <label class="snw-profile-radio ${isEdit && sch.profileId === p.profileId ? 'is-selected' : ''}">
                                    <input type="radio" name="profile" value="${p.profileId}"
                                           ${isEdit && sch.profileId === p.profileId ? 'checked' : ''}>
                                    <div class="snw-profile-radio__content">
                                        <div class="snw-profile-radio__name">📋 ${SNW.DomUtil ? SNW.DomUtil.escape(p.name) : p.name}</div>
                                        <div class="snw-profile-radio__meta">
                                            ${p.stepCount || (p.steps ? p.steps.length : 0)}개 Step · ${this._fmtTotal(p)}
                                        </div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>

                        <div class="snw-schedule-editor__hint" style="margin-top:12px;">
                            💡 새 프로필은 <b>Studio 탭</b>에서 작곡 후 선택할 수 있습니다.
                        </div>
                    </div>

                    <!-- [Stage 5] 규칙 상속/커스텀 -->
                    <div style="margin-top:16px;padding:12px;background:var(--snw-surface-2,#12161c);border-radius:6px;">
                        <div style="font-weight:600;font-size:13px;margin-bottom:8px;">⚙ 자동 정지 규칙</div>
                        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                            <input type="radio" name="ruleMode" value="inherit" ${!isCustom ? 'checked' : ''}>
                            <span>${SNW.I18n.t('auto.rules.inheritHint')} (프로파일 규칙 사용)</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:6px;cursor:pointer;">
                            <input type="radio" name="ruleMode" value="custom" ${isCustom ? 'checked' : ''}>
                            <span>${SNW.I18n.t('auto.rules.customHint')} (스케줄 자체 규칙)</span>
                        </label>
                        <div id="custom-rule-action" style="margin-top:8px;display:${isCustom ? 'block' : 'none'};">
                            <button type="button" class="snw-btn snw-btn--sm" data-action="edit-rule" style="padding:4px 10px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                                ⚙ 커스텀 규칙 편집
                            </button>
                        </div>
                    </div>
                </div>`;

            // 모드 토글 이벤트
            const btnSimple = content.querySelector('[data-mode="simple"]');
            const btnAdvanced = content.querySelector('[data-mode="advanced"]');
            const secSimple = content.querySelector('#simple-mode-section');
            const secAdvanced = content.querySelector('#advanced-mode-section');

            btnSimple.onclick = () => {
                isSimpleMode = true;
                btnSimple.classList.add('snw-btn-primary');
                btnAdvanced.classList.remove('snw-btn-primary');
                secSimple.style.display = 'block';
                secAdvanced.style.display = 'none';
            };
            btnAdvanced.onclick = () => {
                isSimpleMode = false;
                btnAdvanced.classList.add('snw-btn-primary');
                btnSimple.classList.remove('snw-btn-primary');
                secSimple.style.display = 'none';
                secAdvanced.style.display = 'block';
            };

            // 요일 칩 토글
            content.querySelectorAll('.snw-day-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const input = chip.querySelector('input');
                    input.checked = !input.checked;
                    chip.classList.toggle('is-active', input.checked);
                });
            });

            // 프로필 라디오 선택 표시
            content.querySelectorAll('.snw-profile-radio').forEach(radio => {
                radio.addEventListener('click', (e) => {
                    if (e.target.tagName === 'INPUT') return;
                    const input = radio.querySelector('input');
                    input.checked = true;
                    content.querySelectorAll('.snw-profile-radio').forEach(r =>
                        r.classList.toggle('is-selected', r === radio));
                });
            });

            // 규칙 상속/커스텀 라디오 및 편집기 바인딩
            const ruleRadios = content.querySelectorAll('input[name="ruleMode"]');
            const customRuleAction = content.querySelector('#custom-rule-action');
            const btnEditRule = content.querySelector('[data-action="edit-rule"]');

            ruleRadios.forEach(r => {
                r.addEventListener('change', () => {
                    const custom = content.querySelector('input[name="ruleMode"]:checked')?.value === 'custom';
                    if (customRuleAction) customRuleAction.style.display = custom ? 'block' : 'none';
                });
            });

            if (btnEditRule) {
                btnEditRule.onclick = async () => {
                    if (!SNW.UI || !SNW.UI.ruleEditor) return;
                    const res = await SNW.UI.ruleEditor.showModal(editedRule || {}, {
                        title: '스케줄 커스텀 규칙',
                    });
                    if (res) {
                        editedRule = res;
                        if (SNW.ToastUtil) SNW.ToastUtil.info('커스텀 규칙이 설정되었습니다 (스케줄 저장 시 반영)');
                    }
                };
            }

            SNW.UI.modal(
                isEdit ? '스케줄 편집' : '새 스케줄',
                content,
                async () => {
                    const nameEl  = content.querySelector('[data-field="name"]');
                    const startEl = content.querySelector('[data-field="startTime"]');
                    const endEl   = content.querySelector('[data-field="endTime"]');

                    if (!nameEl.value.trim()) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('이름을 입력하세요');
                        return false;
                    }
                    if (startEl.value === endEl.value) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('시작 시각과 종료 시각이 같을 수 없습니다');
                        return false;
                    }

                    let profileId = 0;
                    if (isSimpleMode) {
                        const selPreset = content.querySelector('#simple-preset-select').value;
                        const selStyle = content.querySelector('#simple-style-select').value;
                        
                        // [Stage 10] 간단 모드 단일 Step 프로필 자동 생성
                        const autoProfile = {
                            profileNo: (Date.now() % 65530) + 1,
                            name: `[간단] ${selPreset}`,
                            enabled: true,
                            repeatSegments: false,
                            repeatCount: 0,
                            steps: [{
                                stepNo: 10,
                                durationMin: 120,
                                type: 'PRESET',
                                presetCode: selPreset,
                                styleCode: selStyle,
                                override: { enabled: false }
                            }],
                            autoOff: { timer: { enabled: false }, offTime: { enabled: false }, offTemp: { enabled: false } },
                            motion: { pir: { enabled: false } }
                        };
                        try {
                            if (SNW.Api && typeof SNW.Api.addProfile === 'function') {
                                const pRes = await SNW.Api.addProfile(autoProfile);
                                profileId = (pRes && pRes.profileId) ? pRes.profileId : autoProfile.profileNo;
                            }
                        } catch (pe) {
                            SNW.LogUtil.warn('[Schedule] Auto profile create fallback', pe);
                            profileId = autoProfile.profileNo;
                        }
                    } else {
                        const selectedRadio = content.querySelector('input[name="profile"]:checked');
                        if (!selectedRadio) {
                            if (SNW.ToastUtil) SNW.ToastUtil.error('실행할 플레이리스트를 선택하세요');
                            return false;
                        }
                        profileId = Number(selectedRadio.value);
                    }

                    const schNo = isEdit ? sch.schNo : (Date.now() % 65535) + 1;
                    const ruleOverride = content.querySelector('input[name="ruleMode"]:checked')?.value === 'custom';
                    const schedule = {
                        schNo,
                        name: nameEl.value.trim(),
                        enabled: isEdit ? sch.enabled : true,
                        period: {
                            days: Array.from(content.querySelectorAll('[data-day]')).map(cb => cb.checked ? 1 : 0),
                            startTime: startEl.value,
                            endTime: endEl.value,
                        },
                        profileId,
                        ruleOverride,
                        rule: editedRule || (isEdit && sch.rule ? sch.rule : {}),
                    };

                    try {
                        if (isEdit) {
                            await SNW.Api.updateSchedule(sch.schId, schedule);
                        } else {
                            await SNW.Api.addSchedule(schedule);
                        }
                        if (SNW.ToastUtil) SNW.ToastUtil.success(isEdit ? '스케줄 업데이트' : SNW.I18n.t('schedule.simpleSaved'));
                        await this.mount();
                        return true;
                    } catch (e) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '저장 실패');
                        return false;
                    }
                },
                null,
                { width: '480px' }
            );
        }

        async _onToggle(sch, enabled) {
            const newSch = { ...sch, enabled };
            try {
                await SNW.Api.updateSchedule(sch.schId, newSch);
                sch.enabled = enabled;
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '토글 실패');
                await this.mount();
            }
        }

        async _onDelete(sch) {
            if (!confirm(`"${sch.name}" 스케줄을 삭제하시겠습니까?`)) return;
            try {
                await SNW.Api.deleteSchedule(sch.schId);
                if (SNW.ToastUtil) SNW.ToastUtil.success('삭제 완료');
                await this.mount();
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '삭제 실패');
            }
        }

        _fmtTotal(profile) {
            if (!profile.steps) return '0분';
            let total = 0;
            for (const s of profile.steps) total += Number(s.durationMin) || 0;
            if (profile.repeatSegments && profile.repeatCount > 0) total *= profile.repeatCount;
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };
})(window.SNW);

