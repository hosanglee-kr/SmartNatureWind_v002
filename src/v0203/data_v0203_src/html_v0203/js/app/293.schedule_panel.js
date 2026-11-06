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
                        SNW.Router.navigate('/automation/studio');
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
            const days = sch ? ((sch.period && sch.period.days) || [0,0,0,0,0,0,0]) : [0,1,1,1,1,1,0];
            const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

            const content = document.createElement('div');
            content.className = 'snw-schedule-editor';
            content.innerHTML = `
                <div class="snw-form">
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
                </div>`;

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

            SNW.UI.modal(
                isEdit ? '스케줄 편집' : '새 스케줄',
                content,
                async () => {
                    const nameEl  = content.querySelector('[data-field="name"]');
                    const startEl = content.querySelector('[data-field="startTime"]');
                    const endEl   = content.querySelector('[data-field="endTime"]');
                    const selectedRadio = content.querySelector('input[name="profile"]:checked');

                    // 검증
                    if (!nameEl.value.trim()) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('이름을 입력하세요');
                        return false;
                    }
                    if (!selectedRadio) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('실행할 플레이리스트를 선택하세요');
                        return false;
                    }
                    if (startEl.value >= endEl.value) {
                        if (SNW.ToastUtil) SNW.ToastUtil.error('종료 시각이 시작 시각보다 빨라야 합니다');
                        return false;
                    }

                    const profileId = Number(selectedRadio.value);
                    const schNo = isEdit
                        ? sch.schNo
                        : (Date.now() % 65535) + 1;

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
                    };

                    try {
                        if (isEdit) {
                            await SNW.Api.updateSchedule(sch.schId, schedule);
                        } else {
                            await SNW.Api.addSchedule(schedule);
                        }
                        if (SNW.ToastUtil) SNW.ToastUtil.success(isEdit ? '스케줄 업데이트' : '스케줄 생성');
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
            if (profile.repeat && profile.repeatCount > 0) total *= profile.repeatCount;
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };
})(window.SNW);

