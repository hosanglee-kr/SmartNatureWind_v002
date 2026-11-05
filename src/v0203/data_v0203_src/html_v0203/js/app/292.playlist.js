// =========================================================
// 292.playlist.js — Wind Playlist (재생 목록)
// Layer 3 (Playlist 패널 컴포넌트)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    SNW.Playlist = class Playlist {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._profiles = [];
            this._schedules = [];
        }

        async mount() {
            this.el.innerHTML = '<div class="snw-loading">로딩 중...</div>';

            if (SNW.Preview) await SNW.Preview.init();

            try {
                const [profData, schData] = await Promise.all([
                    SNW.Api.listProfiles(),
                    SNW.Api.listSchedules ? SNW.Api.listSchedules().catch(() => null) : null,
                ]);
                const pRoot = (profData && profData.userProfiles) ? profData.userProfiles : profData;
                this._profiles = (pRoot && pRoot.profiles) || [];

                const sRoot = (schData && schData.schedules) ? schData.schedules : schData;
                this._schedules = (sRoot && sRoot.schedules) ? sRoot.schedules : (Array.isArray(sRoot) ? sRoot : []);
            } catch (e) {
                if (SNW.ToastUtil) SNW.ToastUtil.error('데이터 로드 실패');
            }

            await this._render();
        }

        unmount() { this._active = false; }

        async _render() {
            if (this._profiles.length === 0) {
                this.el.innerHTML = `
                    <div class="snw-card" style="background:var(--snw-surface,#1a2028);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:32px;text-align:center;">
                        <div class="snw-empty">
                            <p style="color:var(--snw-text-dim,#8b949e);margin-bottom:16px;">아직 작곡한 프로필이 없습니다.</p>
                            <button type="button" class="snw-btn snw-btn-primary" data-action="new" style="padding:10px 20px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-weight:600;">
                                🎨 Studio에서 작곡하기
                            </button>
                        </div>
                    </div>`;
                this.el.querySelector('[data-action="new"]').onclick = () => {
                    SNW.Router.navigate('/automation/studio');
                };
                return;
            }

            this.el.innerHTML = `
                <div class="snw-playlist">
                    <div class="snw-playlist__header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                        <span style="font-size:14px;color:var(--snw-text-dim,#8b949e);">${this._profiles.length}개의 프로필</span>
                        <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="new" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:13px;font-weight:600;">
                            + 새로 작곡
                        </button>
                    </div>
                    <div class="snw-playlist__list" data-slot="list" style="display:flex;flex-direction:column;gap:12px;"></div>
                </div>`;

            this.el.querySelector('[data-action="new"]').onclick = () => {
                SNW.Router.navigate('/automation/studio');
            };

            const listSlot = this.el.querySelector('[data-slot="list"]');
            for (let i = 0; i < this._profiles.length; i++) {
                const card = await this._renderCard(this._profiles[i]);
                listSlot.appendChild(card);
            }
        }

        async _renderCard(profile) {
            const pId = profile.profileId || profile.profileNo;
            const refCount = this._schedules.filter(s => s.profileId === pId).length;

            const card = document.createElement('div');
            card.className = 'snw-playlist-item';
            card.style.cssText = 'background:var(--snw-surface-2,#232b36);border:1px solid var(--snw-border,#2f3844);border-radius:var(--snw-radius,8px);padding:14px;display:flex;flex-direction:column;gap:10px;';
            card.innerHTML = `
                <div class="snw-playlist-item__main" style="display:flex;flex-direction:column;gap:6px;">
                    <div class="snw-playlist-item__head" style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="snw-playlist-item__name" style="font-weight:600;font-size:15px;color:var(--snw-text,#e6edf3);">📋 ${SNW.DomUtil ? SNW.DomUtil.escape(profile.name) : profile.name}</span>
                        <span class="snw-playlist-item__meta" style="font-size:12px;color:var(--snw-text-dim,#8b949e);">${profile.stepCount || (profile.steps ? profile.steps.length : 0)} Step · ${this._fmtTotal(profile)}</span>
                    </div>
                    <div class="snw-playlist-item__sparkline" data-slot="spark" style="height:44px;margin:4px 0;"></div>
                    <div class="snw-playlist-item__refs" style="font-size:11px;color:var(--snw-text-faint,#6e7a87);">
                        ${refCount > 0
                            ? `<span style="color:var(--snw-warn,#d29922);">⏰ 스케줄 ${refCount}개에서 사용 중</span>`
                            : `<span class="snw-playlist-item__noref">스케줄 미참조</span>`}
                    </div>
                </div>
                <div class="snw-playlist-item__actions" style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
                    <button type="button" class="snw-btn snw-btn-primary snw-btn--sm" data-action="play" style="padding:6px 14px;background:var(--snw-primary,#4a9eff);color:#fff;border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;font-weight:600;">▶ 재생</button>
                    <button type="button" class="snw-btn snw-btn--sm" data-action="edit" style="padding:6px 12px;background:var(--snw-surface-3,#2f3844);color:var(--snw-text,#e6edf3);border:none;border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">✏️ 편집</button>
                    <button type="button" class="snw-btn snw-btn--sm snw-btn--danger" data-action="delete" style="padding:6px 12px;background:rgba(248,81,73,0.15);color:var(--snw-error,#f85149);border:1px solid rgba(248,81,73,0.3);border-radius:var(--snw-radius-sm,4px);cursor:pointer;font-size:12px;">🗑</button>
                </div>
            `;

            // Sparkline 렌더링
            if (SNW.Preview && SNW.UI && typeof SNW.UI.sparkline === 'function') {
                (async () => {
                    const wave = await SNW.Preview.generatePlaylistWaveform(profile.steps || []);
                    if (wave && wave.points) {
                        const sl = SNW.UI.sparkline(
                            card.querySelector('[data-slot="spark"]'),
                            { color: '#4a9eff', baseline: 0 });
                        sl.render(wave.points);
                    }
                })();
            }

            // 액션 바인딩
            card.querySelector('[data-action="play"]').onclick = async () => {
                try {
                    await SNW.Api.startPlaylist(pId);
                    if (SNW.ToastUtil) SNW.ToastUtil.success(`▶ ${profile.name} 재생 시작`);
                    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '재생 실패');
                }
            };

            card.querySelector('[data-action="edit"]').onclick = () => {
                SNW.Router.navigate(`/automation/studio?edit=${pId}`);
            };

            card.querySelector('[data-action="delete"]').onclick = async () => {
                if (refCount > 0) {
                    if (!confirm(`이 프로필은 스케줄 ${refCount}개에서 참조 중입니다.\n삭제하면 해당 스케줄이 비활성화됩니다. 계속하시겠습니까?`)) {
                        return;
                    }
                } else {
                    if (!confirm('정말 삭제하시겠습니까?')) return;
                }
                try {
                    await SNW.Api.deleteProfile(pId);
                    if (SNW.ToastUtil) SNW.ToastUtil.success('삭제 완료');
                    await this.mount();
                } catch (e) {
                    if (SNW.ToastUtil) SNW.ToastUtil.error(e.message || '삭제 실패');
                }
            };

            return card;
        }

        _fmtTotal(profile) {
            if (!profile.steps) return '0분';
            let total = 0;
            for (const s of profile.steps) total += Number(s.durationMin) || 0;
            if (profile.repeatSegments && profile.repeatCount > 0) {
                total *= profile.repeatCount;
            }
            const h = Math.floor(total / 60);
            const m = total % 60;
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }
    };

    // =========================================================
    // 타이머 placeholder (Stage 7 예정)
    // =========================================================
    // SNW.SchedulePanel은 293.schedule_panel.js에서 구현

    SNW.TimerPanel = class TimerPanel {
        constructor(el) { this.el = el; }
        async mount() {
            this.el.innerHTML = '<div class="snw-empty" style="text-align:center;padding:32px;color:var(--snw-text-dim,#8b949e);">Stage 7에서 구현됩니다</div>';
        }
        unmount() {}
    };
})(window.SNW);

