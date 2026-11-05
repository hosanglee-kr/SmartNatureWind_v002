// =========================================================
// 260.page.monitor.js — SNW.Page.Monitor (Stage 7 회고 + 실시간 EQ)
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
    'use strict';

    SNW.Page.Monitor = class Monitor {
        constructor(container) {
            this.el = container;
            this._active = true;
            this._currentTab = 'live';
            this._unsubs = [];
            this._liveEq = null;
            this._retroRange = '24h';
        }

        async mount() {
            this.el.innerHTML = '';
            this._render();
            this._bindStore();
            await this._loadLiveData();

            // 라이브 이퀄라이저 초기화
            const liveEqSlot = this.el.querySelector('[data-slot="live-eq"]');
            if (liveEqSlot && SNW.UI && typeof SNW.UI.equalizer === 'function') {
                this._liveEq = SNW.UI.equalizer(liveEqSlot, { bars: 40, fps: 30, maxWind: 11 });
            }

            // 탭 초기화
            this._switchTab(this._currentTab);
        }

        unmount() {
            this._active = false;
            this._unsubs.forEach(fn => { try { fn(); } catch {} });
            this._unsubs = [];
            if (this._liveEq && typeof this._liveEq.stop === 'function') {
                this._liveEq.stop();
            }
        }

        _render() {
            this.el.innerHTML = `
                <div class="snw-monitor">
                    <div class="snw-tabs">
                        <button type="button" class="snw-tab-btn is-active" data-tab="live">📊 실시간</button>
                        <button type="button" class="snw-tab-btn" data-tab="retro">🎬 회고</button>
                    </div>
                    <div data-tab-content="live"></div>
                    <div data-tab-content="retro" style="display:none;"></div>
                </div>`;

            this.el.querySelectorAll('[data-tab]').forEach(btn => {
                btn.onclick = () => this._switchTab(btn.getAttribute('data-tab'));
            });
        }

        _switchTab(tab) {
            this._currentTab = tab;
            this.el.querySelectorAll('[data-tab]').forEach(b =>
                b.classList.toggle('is-active', b.getAttribute('data-tab') === tab));
            this.el.querySelectorAll('[data-tab-content]').forEach(c => {
                c.style.display = (c.getAttribute('data-tab-content') === tab) ? 'block' : 'none';
            });

            if (tab === 'live')  this._renderLive();
            if (tab === 'retro') this._renderRetro();
        }

        // =========================================================
        // 라이브 탭
        // =========================================================
        _renderLive() {
            const slot = this.el.querySelector('[data-tab-content="live"]');
            if (!slot) return;
            slot.innerHTML = `
                <div class="snw-card">
                    <h2>📊 실시간 풍속</h2>
                    <div data-slot="live-eq" class="snw-monitor__eq" style="height:100px;"></div>
                    <div class="snw-monitor__live-info" data-slot="live-info"></div>
                </div>
                <div class="snw-card">
                    <h2>🌡️ 센서</h2>
                    <div class="snw-monitor__sensors" data-slot="live-sensors"></div>
                </div>`;

            // 이퀄라이저 재초기화
            const eqSlot = slot.querySelector('[data-slot="live-eq"]');
            if (eqSlot && SNW.UI && typeof SNW.UI.equalizer === 'function') {
                this._liveEq = SNW.UI.equalizer(eqSlot, { bars: 40, fps: 30, maxWind: 11 });
                this._liveEq.start();
            }
            this._onLiveUpdate();
        }

        _onLiveUpdate() {
            const storeData = (SNW.Store && typeof SNW.Store.get === 'function') ? SNW.Store.get() : {};
            const ctl = storeData.control;
            const sim = storeData.sim;
            const session = storeData.session;

            if (this._liveEq && sim) {
                this._liveEq.push(sim.windSpeed || 0);
            }

            const infoEl = this.el.querySelector('[data-slot="live-info"]');
            if (infoEl && session && session.type !== 'NONE') {
                let title = '';
                if (session.type === 'PLAYLIST') title = session.profileName;
                else if (session.type === 'PRESET') title = `${session.presetCode} · ${session.styleCode}`;
                else title = `일반 선풍기 ${Math.round(session.percent || 0)}%`;

                infoEl.innerHTML = `
                    <div class="snw-monitor__live-row">
                        <span>${session.trigger === 'MANUAL' ? '✋' : '⏰'} ${SNW.DomUtil.escape(title)}</span>
                    </div>
                    ${session.type === 'PLAYLIST' ? `
                        <div class="snw-monitor__live-row">
                            <span>Step ${session.currentStep}/${session.totalSteps}</span>
                            <span>${this._fmtTime(session.stepRemainSec || 0)}</span>
                        </div>` : ''}
                `;
            } else if (infoEl) {
                infoEl.innerHTML = '<div class="snw-empty">세션 없음</div>';
            }

            const sensorsEl = this.el.querySelector('[data-slot="live-sensors"]');
            if (sensorsEl && ctl && ctl.sensor) {
                const s = ctl.sensor;
                sensorsEl.innerHTML = `
                    <div class="snw-sensor-row">
                        <span>🌡️ 온도</span><b>${(s.tempC || 0).toFixed(1)}°C</b>
                    </div>
                    <div class="snw-sensor-row">
                        <span>💧 습도</span><b>${Math.round(s.humidity || 0)}%</b>
                    </div>
                    <div class="snw-sensor-row">
                        <span>👤 재실</span><b>${s.motionActive ? '감지' : '부재'}</b>
                    </div>
                `;
            }
        }

        // =========================================================
        // 회고 탭
        // =========================================================
        async _renderRetro() {
            const slot = this.el.querySelector('[data-tab-content="retro"]');
            if (!slot) return;
            slot.innerHTML = `
                <div class="snw-card">
                    <h2>🎬 세션 회고</h2>
                    <div class="snw-toolbar" style="margin-bottom:12px;">
                        <select data-slot="retro-range">
                            <option value="1h">최근 1시간</option>
                            <option value="24h" selected>최근 24시간</option>
                            <option value="7d">최근 7일</option>
                        </select>
                        <button type="button" class="snw-btn" data-action="refresh">🔄</button>
                    </div>
                    <div data-slot="retro-content" class="snw-loading">로딩 중...</div>
                </div>`;

            const refreshBtn = slot.querySelector('[data-action="refresh"]');
            if (refreshBtn) refreshBtn.onclick = () => this._loadRetro();
            const rangeSelect = slot.querySelector('[data-slot="retro-range"]');
            if (rangeSelect) rangeSelect.onchange = () => this._loadRetro();

            await this._loadRetro();
        }

        async _loadRetro() {
            const slot = this.el.querySelector('[data-slot="retro-content"]');
            if (!slot) return;

            const rangeEl = this.el.querySelector('[data-slot="retro-range"]');
            const range = rangeEl ? rangeEl.value : '24h';

            const now = Math.floor(Date.now() / 1000);
            const durMap = { '1h': 3600, '24h': 86400, '7d': 604800 };
            const since = now - (durMap[range] || 86400);

            slot.innerHTML = '<div class="snw-loading">로딩 중...</div>';   // [Phase5 5.9] 로딩 표시

            try {
                const getTlFn = (SNW.Api && (SNW.Api.getTimeline || SNW.Api.getMonitorTimeline)) ?
                    (SNW.Api.getTimeline || SNW.Api.getMonitorTimeline).bind(SNW.Api) : () => Promise.resolve({ events: [] });
                const getSumFn = (SNW.Api && SNW.Api.getSessionSummary) ?
                    SNW.Api.getSessionSummary.bind(SNW.Api) : () => Promise.resolve(null);

                const [timeline, summary] = await Promise.all([
                    getTlFn(since).catch(() => ({ events: [] })),
                    getSumFn(since, now).catch(() => null),
                ]);

                if (!this._active) return;

                slot.innerHTML = '';
                slot.appendChild(this._renderSummary(summary));
                slot.appendChild(this._renderTimeline(timeline));
                slot.appendChild(this._renderEventList(timeline));
            } catch (e) {
                slot.innerHTML = '<div class="snw-error">회고 데이터 로드 실패</div>';
            }
        }

        // ======================================================
        // [Phase5 5.9] 이중 스키마 수용
        //  - 신 스키마: summary.stats.{totalSessions, totalActiveSec, ...}
        //  - 구 스키마: {totalEvents, sessionStarts, sessionEnds, stepChanges}
        //  - 후자는 C++ querySessionSummary() 현 구현과 일치
        //  - 구 스키마에서는 파생 가능한 필드만 표시
        // ======================================================
        _renderSummary(summary) {
            const div = document.createElement('div');
            div.className = 'snw-retro-summary';

            if (!summary) {
                div.innerHTML = '<div class="snw-empty">세션 데이터 없음</div>';
                return div;
            }

            // 신 스키마 우선, 없으면 구 스키마에서 파생
            let stats = summary.stats || null;

            if (!stats) {
                const starts = Number(summary.sessionStarts || 0);
                const ends   = Number(summary.sessionEnds   || 0);
                const total  = Number(summary.totalEvents   || 0);

                if (total === 0 && starts === 0) {
                    div.innerHTML = '<div class="snw-empty">세션 데이터 없음</div>';
                    return div;
                }

                stats = {
                    totalSessions:  starts,
                    totalActiveSec: 0,    // 구 스키마에 시간 필드 없음
                    avgWindSpeed:   0,
                    maxWindSpeed:   0,
                    avgTempC:       0,
                    presenceRatio:  0,
                    _legacy:        true,
                };
            }

            div.innerHTML = `
                <div class="snw-retro-summary__title">세션 요약</div>
                <div class="snw-retro-summary__grid">
                    <div><span>총 세션</span><b>${stats.totalSessions || 0}회</b></div>
                    <div><span>총 가동</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : this._fmtDuration(stats.totalActiveSec || 0)
                    }</b></div>
                    <div><span>평균 풍속</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.avgWindSpeed || 0).toFixed(1) + ' m/s'
                    }</b></div>
                    <div><span>최고 풍속</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.maxWindSpeed || 0).toFixed(1) + ' m/s'
                    }</b></div>
                    <div><span>평균 온도</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : (stats.avgTempC || 0).toFixed(1) + '°C'
                    }</b></div>
                    <div><span>재실 비율</span><b>${
                        stats._legacy
                            ? `<span style="color:var(--snw-text-dim);font-size:11px;">N/A</span>`
                            : Math.round((stats.presenceRatio || 0) * 100) + '%'
                    }</b></div>
                </div>
                ${stats._legacy
                    ? `<div style="font-size:11px;color:var(--snw-text-dim);margin-top:8px;">
                        ※ 상세 통계는 서버 업데이트 후 제공됩니다.
                    </div>`
                    : ''}
            `;
            return div;
        }

        // ======================================================
        // [Phase5 5.9] timeline.from/to 폴백
        //  - C++ queryTimeline()은 from/to를 반환하지 않음
        //  - events의 첫/마지막 t로 자동 계산
        // ======================================================
        _renderTimeline(timeline) {
            const div = document.createElement('div');
            div.className = 'snw-retro-timeline';

            if (!timeline || !timeline.events || timeline.events.length === 0) {
                div.innerHTML = '<div class="snw-empty">이벤트 없음</div>';
                return div;
            }

            const events = timeline.events;
            // from/to 폴백 (C++ 응답에 없는 경우 계산)
            const fromTs = (timeline.from != null)
                ? timeline.from
                : (events[0]?.t ?? 0);
            const toTs   = (timeline.to != null)
                ? timeline.to
                : (events[events.length - 1]?.t ?? Math.floor(Date.now() / 1000));

            const normalized = { ...timeline, from: fromTs, to: toTs, events };

            div.innerHTML = `
                <div class="snw-retro-timeline__title">이벤트 타임라인</div>
                <div class="snw-retro-timeline__bar">
                    ${events.map(e => this._eventMarker(e, normalized)).join('')}
                </div>
            `;
            return div;
        }

        _eventMarker(e, timeline) {
            const start = timeline.from || 0;
            const end   = timeline.to   || Math.floor(Date.now() / 1000);
            const span  = Math.max(1, end - start);
            const pos   = Math.min(100, Math.max(0, ((e.t - start) / span) * 100));

            const icon = {
                0: '⚪',   // STATE_CHANGE
                1: '➡️',   // STEP_CHANGE
                2: '▶',    // SESSION_START
                3: '⏹',    // SESSION_END
                4: '✋',   // MANUAL_OVERRIDE
                5: '🌙',   // AUTOOFF
                6: '⏸',    // PAUSE
                7: '▶',    // RESUME
            }[e.eventType] || '•';

            const color = {
                0: '#59636e',
                1: '#4a9eff',
                2: '#3fb950',
                3: '#8b949e',
                4: '#d29922',
                5: '#f0883e',
                6: '#d29922',
                7: '#3fb950',
            }[e.eventType] || '#59636e';

            return `
                <div class="snw-retro-marker" style="left:${pos}%;background:${color};" title="${this._fmtTimeOfDay(e.t)} · ${SNW.DomUtil.escape(e.label || '')}">
                    <span>${icon}</span>
                </div>
            `;
        }

        _renderEventList(timeline) {
            const div = document.createElement('div');
            div.className = 'snw-retro-events';

            if (!timeline || !timeline.events || timeline.events.length === 0) {
                return div;
            }

            const events = timeline.events.slice(-30).reverse();
            div.innerHTML = `
                <div class="snw-retro-events__title">이벤트 목록 (최근 30개)</div>
                ${events.map(e => `
                    <div class="snw-retro-event-row">
                        <span class="snw-retro-event-row__time">${this._fmtTimeOfDay(e.t)}</span>
                        <span class="snw-retro-event-row__icon">${
                            2 === e.eventType ? '▶' :
                            3 === e.eventType ? '⏹' :
                            1 === e.eventType ? '➡️' :
                            4 === e.eventType ? '✋' :
                            5 === e.eventType ? '🌙' :
                            6 === e.eventType ? '⏸' :
                            7 === e.eventType ? '▶' : '•'
                        }</span>
                        <span class="snw-retro-event-row__label">${SNW.DomUtil.escape(e.label || '')}</span>
                    </div>
                `).join('')}
            `;
            return div;
        }

        // =========================================================
        // Store
        // =========================================================
        _bindStore() {
            if (SNW.Store && typeof SNW.Store.subscribe === 'function') {
                this._unsubs.push(
                    SNW.Store.subscribe(() => {
                        if (this._active && this._currentTab === 'live') {
                            this._onLiveUpdate();
                        }
                    })
                );
            }
        }

        _fmtTime(sec) {
            if (!sec || sec < 0) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${String(s).padStart(2, '0')}`;
        }

        _fmtDuration(sec) {
            if (!sec) return '0분';
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
        }

        _fmtTimeOfDay(epoch) {
            const d = new Date(epoch * 1000);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        async _loadLiveData() {
            try {
                if (SNW.Api && typeof SNW.Api.getState === 'function') {
                    const st = await SNW.Api.getState();
                    if (st && SNW.Store && typeof SNW.Store.set === 'function') {
                        SNW.Store.set({
                            control: st.control,
                            sim: st.sim,
                            session: st.control?.session,
                        });
                    }
                }
            } catch (e) {
                if (SNW.LogUtil && typeof SNW.LogUtil.warn === 'function') {
                    SNW.LogUtil.warn('monitor load failed', e);
                }
            }
        }
    };
})(window.SNW);
