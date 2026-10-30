// =========================================================
// 260.page.monitor.js — SNW.Page.Monitor (MON-C + MON-E + MON-F)
// 4 레이어: 상태 타임라인 / 풍속·PWM / 이벤트 / 현재 설정 + 지난 이벤트 7일
// =========================================================
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
    (function (SNW) {
        'use strict';

        SNW.Page.Monitor = class Monitor {
            constructor(container) {
                this.el = container;
                this._active = true;
                this._range = '5m';
                this._unsubs = [];
                this._timers = [];
                this._stateColors = {
                    0: '#59636e', 1: '#4a9eff', 2: '#3fb950', 3: '#2dd4bf',
                    4: '#d29922', 5: '#f0883e', 6: '#f85149'
                };
            }

            async mount() {
                this.el.innerHTML = '';
                this._renderShell();
                await this._refresh();
                SNW.WsManager.get('state')?.onMessage(() => {
                    if (this._active) this._refresh();
                });

                // 탭 전환 (실시간 vs 지난 이벤트)
                this.el.querySelectorAll('[data-tab]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const tab = btn.getAttribute('data-tab');
                        this.el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('is-active', b === btn));
                        this.el.querySelectorAll('[data-tab-content]').forEach(c => {
                            c.style.display = c.getAttribute('data-tab-content') === tab ? 'block' : 'none';
                        });
                        if (tab === 'past') this._loadPastEvents();
                    });
                });

                // 시간 범위 버튼
                this.el.querySelectorAll('[data-range]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this._range = btn.getAttribute('data-range');
                        this.el.querySelectorAll('[data-range]').forEach(b =>
                            b.classList.toggle('is-active', b === btn));
                        this._refresh();
                    });
                });

                // 새로고침 버튼
                const refreshBtn = this.el.querySelector('[data-action="refresh"]');
                if (refreshBtn) refreshBtn.onclick = () => this._refresh();

                // CSV 다운로드 버튼
                const csvBtn = this.el.querySelector('[data-action="csv"]');
                if (csvBtn) {
                    csvBtn.onclick = () => {
                        const url = `${SNW.CFG.API.monitor}/export?type=wind&range=${this._range}&format=csv`;
                        window.open(url, '_blank');
                    };
                }

                // 지난 이벤트 새로고침
                const pastRefreshBtn = this.el.querySelector('[data-action="past-refresh"]');
                if (pastRefreshBtn) pastRefreshBtn.onclick = () => this._loadPastEvents();
            }

            unmount() { this._active = false; this._timers.forEach(id => clearInterval(id)); }

            _renderShell() {
                this.el.innerHTML = `
                <section class="snw-card">
                    <h2>🎛 선풍기 모니터링</h2>
                    <div class="snw-tabs" style="margin-bottom:12px;display:flex;gap:4px;">
                        <button type="button" class="snw-tab-btn is-active" data-tab="live">📊 실시간</button>
                        <button type="button" class="snw-tab-btn" data-tab="past">📅 지난 이벤트 (7일)</button>
                    </div>
                    <div data-tab-content="live">
                        <div class="snw-toolbar" style="gap:4px;display:flex;align-items:center;">
                            <button type="button" class="snw-tab-btn is-active" data-range="5m">⏱ 5분</button>
                            <button type="button" class="snw-tab-btn" data-range="30m">⏱ 30분</button>
                            <button type="button" class="snw-tab-btn" data-range="1h">⏱ 1시간</button>
                            <span style="flex:1;"></span>
                            <button type="button" class="snw-btn" data-action="refresh">🔄</button>
                            <button type="button" class="snw-btn" data-action="csv">📥 CSV</button>
                        </div>
                        <h3 style="margin-top:16px;">📊 상태 타임라인</h3>
                        <div data-slot="timeline" style="position:relative;height:32px;background:var(--snw-bg-2);border-radius:4px;margin-bottom:16px;overflow:hidden;"></div>
                        <h3>🌬 풍속 / PWM</h3>
                        <div data-slot="wind" style="height:200px;background:var(--snw-bg-2);border-radius:4px;margin-bottom:16px;"></div>
                        <h3>📌 이벤트</h3>
                        <div data-slot="events" style="max-height:240px;overflow-y:auto;background:var(--snw-bg-2);border-radius:4px;padding:8px;font-size:12px;"></div>
                        <h3 style="margin-top:16px;">🎛 현재 설정</h3>
                        <div data-slot="current" style="background:var(--snw-surface-2);padding:12px;border-radius:4px;font-size:13px;"></div>
                    </div>
                    <div data-tab-content="past" style="display:none;">
                        <div class="snw-toolbar" style="display:flex;gap:8px;align-items:center;">
                            <label style="font-size:12px;">조회 기간:</label>
                            <select id="past-days" style="padding:4px 8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                <option value="1">1일</option>
                                <option value="3">3일</option>
                                <option value="7" selected>7일</option>
                            </select>
                            <label style="font-size:12px;margin-left:4px;">유형:</label>
                            <select id="past-kind" style="padding:4px 8px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                                <option value="all">전체</option>
                                <option value="state">상태</option>
                                <option value="config">설정</option>
                                <option value="system">시스템</option>
                            </select>
                            <button type="button" class="snw-btn" data-action="past-refresh">🔄</button>
                        </div>
                        <div data-slot="past-events" style="max-height:500px;overflow-y:auto;background:var(--snw-bg-2);border-radius:4px;padding:8px;font-size:12px;margin-top:8px;"></div>
                    </div>
                </section>`;
            }

            async _refresh() {
                try {
                    const [wind, state, config, system, current] = await Promise.all([
                        SNW.Api.getMonitor('wind', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getMonitor('state', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getMonitor('config', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getMonitor('system', this._range).catch(() => ({ data: [] })),
                        SNW.Api.getState().catch(() => ({}))
                    ]);
                    if (!this._active) return;
                    this._renderTimeline(state?.data || []);
                    this._renderWindChart(wind?.data || []);
                    this._renderEvents(state?.data || [], config?.data || [], system?.data || []);
                    this._renderCurrent(current?.control, current?.sim);
                } catch (e) {
                    SNW.LogUtil.warn('[Monitor] refresh 실패', e);
                }
            }

            async _loadPastEvents() {
                const days = Number(this.el.querySelector('#past-days')?.value || 7);
                try {
                    const data = await SNW.Api.getPastEvents(days);
                    const slot = this.el.querySelector('[data-slot="past-events"]');
                    if (!slot) return;
                    const events = (data?.events || []).sort((a, b) => b.t - a.t);
                    if (!events.length) {
                        slot.innerHTML = '<div style="color:var(--snw-text-dim);padding:8px;">이벤트 없음</div>';
                        return;
                    }
                    const groups = {};
                    events.forEach(e => {
                        const d = new Date(e.t * 1000).toLocaleDateString('ko-KR');
                        (groups[d] = groups[d] || []).push(e);
                    });
                    slot.innerHTML = Object.entries(groups).map(([date, list]) => `
                    <div style="padding:8px;border-bottom:1px solid var(--snw-border);font-weight:600;">📅 ${date}</div>
                    ${list.map(e => {
                        const time = new Date(e.t * 1000).toLocaleTimeString('ko-KR', { hour12: false });
                        let icon = '•', text = '';
                        if (e.kind === 'state') {
                            icon = e.new === 3 ? '🟢' : e.new === 5 ? '🛑' : e.new === 4 ? '🟡' : '⚪';
                            text = `<b>${SNW.FsmUtil.getState(e.new).label}</b>`;
                        } else if (e.kind === 'config') {
                            icon = '⚙️';
                            const keys = ['프리셋', '스타일', '강도', '변동', '돌풍'];
                            text = `<b>${keys[e.type] || '설정'}</b> ${e.old} → ${e.new}`;
                        } else {
                            icon = '⚠️';
                            text = `<b>시스템</b> type=${e.type}`;
                        }
                        return `<div style="display:flex;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.05);">
                            <span style="color:var(--snw-text-faint);font-family:monospace;min-width:70px;">${time}</span>
                            <span>${icon}</span><span>${text}</span>
                        </div>`;
                    }).join('')}
                `).join('');
                } catch (e) { SNW.LogUtil.warn('[Monitor] past events 실패', e); }
            }

            _renderTimeline(events) {
                const slot = this.el.querySelector('[data-slot="timeline"]');
                if (!slot || !events.length) {
                    if (slot) slot.innerHTML = '<div style="padding:8px;font-size:12px;color:var(--snw-text-dim);">이벤트 없음</div>';
                    return;
                }
                const first = events[0].t, last = events[events.length - 1].t;
                const total = Math.max(1, last - first);
                slot.innerHTML = '';
                events.forEach((e, i) => {
                    const next = i + 1 < events.length ? events[i + 1].t : last;
                    const left = ((e.t - first) / total) * 100;
                    const width = Math.max(0.5, ((next - e.t) / total) * 100);
                    const div = document.createElement('div');
                    div.style.cssText = `position:absolute;left:${left}%;width:${width}%;height:100%;background:${this._stateColors[e.new] || '#555'};`;
                    div.title = `${SNW.FsmUtil.getState(e.new).label} (${new Date(e.t * 1000).toLocaleTimeString()})`;
                    slot.appendChild(div);
                });
                slot.style.position = 'relative';
                slot.style.overflow = 'hidden';
            }

            _renderWindChart(points) {
                const slot = this.el.querySelector('[data-slot="wind"]');
                if (!slot || !points.length) {
                    if (slot) slot.innerHTML = '<div style="padding:8px;font-size:12px;color:var(--snw-text-dim);">데이터 없음</div>';
                    return;
                }
                slot.innerHTML = '';
                const cv = document.createElement('canvas');
                cv.width = slot.clientWidth || 600;
                cv.height = 200;
                cv.style.width = '100%'; cv.style.height = '100%';
                slot.appendChild(cv);
                const ctx = cv.getContext('2d');
                const w = cv.width, h = cv.height;
                const values = points.map(p => p.avg);
                const min = Math.min(...values), max = Math.max(...values);
                const range = Math.max(1, max - min);

                // grid
                ctx.strokeStyle = 'rgba(139,148,158,0.15)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = (h / 4) * i;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                }

                // line
                ctx.strokeStyle = '#4a9eff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                points.forEach((p, i) => {
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.avg - min) / range) * (h - 20) - 10;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // gust markers
                points.forEach((p, i) => {
                    if (!p.gust) return;
                    const x = (i / (points.length - 1)) * w;
                    const y = h - ((p.avg - min) / range) * (h - 20) - 10;
                    ctx.fillStyle = 'rgba(240,136,62,0.9)';
                    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
                });
            }

            _renderEvents(states, configs, systems) {
                const slot = this.el.querySelector('[data-slot="events"]');
                if (!slot) return;
                const merged = [
                    ...states.map(e => ({ t: e.t, kind: 'state', e })),
                    ...configs.map(e => ({ t: e.t, kind: 'config', e })),
                    ...systems.map(e => ({ t: e.t, kind: 'system', e }))
                ].sort((a, b) => b.t - a.t).slice(0, 50);

                if (!merged.length) {
                    slot.innerHTML = '<div style="color:var(--snw-text-dim);">이벤트 없음</div>';
                    return;
                }

                slot.innerHTML = merged.map(({ kind, e }) => {
                    const time = new Date(e.t * 1000).toLocaleTimeString('ko-KR', { hour12: false });
                    let icon = '•', text = '';
                    if (kind === 'state') {
                        icon = e.new === 3 ? '🟢' : e.new === 5 ? '🛑' : e.new === 4 ? '🟡' : '⚪';
                        text = `<b>${SNW.FsmUtil.getState(e.new).label}</b>`;
                        if (e.new === 3) text += ` (${e.preset || '?'} · segNo ${e.segNo})`;
                    } else if (kind === 'config') {
                        icon = '⚙️';
                        const keys = ['프리셋', '스타일', '강도', '변동', '돌풍'];
                        text = `<b>${keys[e.type] || '설정'}</b> ${e.old} → ${e.new}`;
                    } else if (kind === 'system') {
                        icon = '⚠️';
                        text = `<b>시스템 이벤트</b> (type=${e.type})`;
                    }
                    return `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--snw-border);">
                    <span style="color:var(--snw-text-faint);font-family:monospace;">${time}</span>
                    <span>${icon}</span>
                    <span>${text}</span>
                </div>`;
                }).join('');
            }

            _renderCurrent(ctl, sim) {
                const slot = this.el.querySelector('[data-slot="current"]');
                if (!slot || !ctl) return;
                const stateMeta = SNW.FsmUtil.getState(ctl.stateCode || 0);
                slot.innerHTML = `
                <div><b>상태:</b> ${stateMeta.icon} ${stateMeta.label} · <i>${SNW.FsmUtil.getReason(ctl.reasonCode || 0).label}</i></div>
                <div style="margin-top:4px;"><b>프리셋:</b> ${sim?.presetCode || '-'} · <b>스타일:</b> ${sim?.styleCode || '-'}</div>
                <div style="margin-top:4px;"><b>강도:</b> ${Math.round(sim?.intensity || 0)}% · <b>변동:</b> ${Math.round(sim?.variability || 0)}% · <b>돌풍:</b> ${Math.round(sim?.gustFreq || 0)}%</div>
                <div style="margin-top:4px;"><b>현재:</b> ${(sim?.windSpeed || 0).toFixed(1)} m/s · PWM ${(sim?.pwmDuty || 0).toFixed(0)}%</div>
            `;
            }
        };
    })(window.SNW);
