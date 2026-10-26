// =========================================================
// 033.util.template.js — SNW.Tpl (페이지 HTML 템플릿)
// Layer 1 (유틸) — SNW.C, SNW.DomUtil 참조
// =========================================================
/* ---- 033.util.template.js ---- */
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    function tpl(strings, ...vals) {
        const el = SNW.DomUtil.html(strings, ...vals);
        if (SNW.I18n && SNW.I18n.applyTo) {
            SNW.I18n.applyTo(el);
        }
        return el;
    }
    
    SNW.Tpl = {
        tpl,
        
        dashboard() {
            return tpl`
                <div class="snw-dashboard">
                    <!-- 작동 모드 제어 카드 -->
                    <section class="snw-card snw-card--mode" style="grid-column: 1 / -1; margin-bottom: 16px;">
                        <h2 data-i18n="dashboard.modeTitle">작동 모드 설정</h2>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                            <span style="font-size:15px; font-weight:bold; color:var(--snw-primary);" data-slot="current-mode-text">-</span>
                            <label class="snw-switch" style="transform: scale(1.2);">
                                <input type="checkbox" id="mode-switch">
                                <span class="snw-switch__slider"></span>
                            </label>
                        </div>
                        <div style="font-size:12px; color:var(--snw-text-dim);">
                            <span style="margin-right:12px;" data-i18n="dashboard.modeSchedule">◻ 스케줄 자동 모드</span>
                            <span data-i18n="dashboard.modeProfile">◼ 프로필 수동 모드</span>
                        </div>
                    </section>
        
                    <section class="snw-card snw-card--state">
                        <h2 data-i18n="dashboard.realtimeState">실시간 상태</h2>
                        <div data-slot="badge" class="snw-state-badge"></div>
                        <div class="snw-kv"><span data-i18n="dashboard.currentWind">현재 풍속</span><b data-slot="cur-wind">-</b><span data-i18n="unit.windSpeed">m/s</span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.targetWind">목표 풍속</span><b data-slot="target-wind">-</b><span data-i18n="unit.windSpeed">m/s</span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.phase">Phase</span><b data-slot="phase">-</b></div>
                        <div class="snw-kv"><span data-i18n="dashboard.pwm">PWM</span><span data-slot="gauge"></span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.sch">스케줄</span><b data-slot="sch-name">-</b></div>
                        <div class="snw-kv"><span data-i18n="dashboard.prof">프로필</span><b data-slot="prof-name">-</b></div>
                        <div class="snw-kv"><span>AutoOff</span><b data-slot="autooff">-</b></div>
                    </section>
                    <section class="snw-card snw-card--power">
                        <h2 data-i18n="dashboard.powerTitle">전원 제어</h2>
                        <div data-slot="power" class="snw-power-slot"></div>
                    </section>
                    <section class="snw-card snw-card--sensor">
                        <h2 data-i18n="dashboard.sensorTitle">센서</h2>
                        <div data-slot="sensors"></div>
                    </section>
                    <section class="snw-card snw-card--preset">
                        <h2 data-i18n="dashboard.presetTitle">프리셋 선택</h2>
                        <div data-slot="presets"></div>
                    </section>
                    <section class="snw-card snw-card--slider">
                        <h2 data-i18n="dashboard.intensityTitle">강도 조절</h2>
                        <div data-slot="intensity"></div>
                    </section>
                </div>`;
        },
        chart() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="chart.title">실시간 물리 차트</h2>
                    <div class="snw-chart-toolbar">
                        <select data-slot="range">
                            <option value="5" data-i18n="chart.range5s">5초</option>
                            <option value="30" data-i18n="chart.range30s">30초</option>
                            <option value="120" selected data-i18n="chart.range120s">120초</option>
                        </select>
                        <button data-action="export" data-i18n="chart.exportCsv">CSV</button>
                    </div>
                    <div data-slot="chart" class="snw-chart-area"></div>
                </section>`;
        },
        settings() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="settings.title">시스템 설정</h2>
                    
                    <h3>Meta / Logging / Security</h3>
                    <div data-slot="form-log"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;" data-i18n="settings.wsChannel">WebSocket 채널</h3>
                    <div data-slot="form-ws"></div>
                    
                    <h3 style="margin-top:12px;border-bottom:1px solid var(--snw-border);padding-bottom:4px;" data-i18n="settings.hardware">Hardware (PWM / Fan / PIR / DHT / LED)</h3>
                    <div data-slot="form-hw"></div>
                    
                    <div class="snw-form-actions" style="justify-content:space-between;align-items:center;display:flex;margin-top:16px;">
                        <div>
                            <button data-action="save"   class="snw-btn snw-btn-primary" data-i18n="settings.save">저장</button>
                            <button data-action="reload" class="snw-btn" data-i18n="settings.reload">재로드</button>
                        </div>
                        <button data-action="factory-reset" class="snw-btn" style="background:rgba(248,81,73,0.1);color:var(--snw-error);" data-i18n="settings.factoryReset">공장 초기화</button>
                    </div>
                </section>`;
        },
        simulation() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.simulation">시뮬레이션 상세 설정</h2>
                    <div data-slot="form" class="snw-form" data-i18n="common.loading">로딩 중...</div>
                </section>`;
        },
        schedule() {
            return tpl`<section class="snw-card"><h2 data-i18n="scheduler.title">스케줄 예약</h2><div data-slot="list"></div></section>`;
        },
        profiles() {
            return tpl`<section class="snw-card"><h2 data-i18n="profile.title">사용자 프로필</h2><div data-slot="list"></div></section>`;
        },
        network() {
            return tpl`
            <div style="display:flex;flex-direction:column;gap:16px;">
                <section class="snw-card">
                    <h2 data-i18n="network.title">네트워크 상태</h2>
                    <div data-slot="wifi-state"></div>
                </section>
                <section class="snw-card">
                    <h2 data-i18n="network.wifiConfig">Wi-Fi 설정 (AP / STA)</h2>
                    <div data-slot="wifi-config" class="snw-form"></div>
                </section>
                <section class="snw-card">
                    <h2 data-i18n="network.timeConfig">시간 설정</h2>
                    <div data-slot="time-config" class="snw-form"></div>
                </section>
            </div>`;
        },
        sensors() {
            return tpl`
            <div style="display:flex;flex-direction:column;gap:16px;">
                <section class="snw-card">
                    <h2 data-i18n="sensors.title">실시간 센서 상태</h2>
                    <div class="snw-sensor-cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
                        <div class="snw-sensor-card"><span style="font-size:24px;">🌡</span><span style="font-size:10px;" data-i18n="sensors.temp">온도</span><span class="snw-sensor-card__val" data-slot="sensor-temp">--</span></div>
                        <div class="snw-sensor-card"><span style="font-size:24px;">💧</span><span style="font-size:10px;" data-i18n="sensors.hum">습도</span><span class="snw-sensor-card__val" data-slot="sensor-hum">--</span></div>
                        <div class="snw-sensor-card"><span style="font-size:24px;">👤</span><span style="font-size:10px;" data-i18n="sensors.motion">인체감지</span><span class="snw-sensor-card__val" data-slot="sensor-motion">--</span></div>
                    </div>
                    <div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="feed-pir" data-i18n="sensors.feedPir">PIR 강제 감지 테스트</button></div>
                </section>
                <section class="snw-card">
                    <h2 data-i18n="sensors.motionConfig">모션 로직 설정 (cfg_motion)</h2>
                    <div data-slot="motion-config" class="snw-form"></div>
                </section>
            </div>`;
        },
        diagnostics() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="diagnostics.title">시스템 진단 및 메트릭</h2>
                    <div data-slot="panel"></div>
                    <div class="snw-toolbar" style="margin-top:16px;display:flex;gap:8px;">
                        <button type="button" class="snw-btn" data-action="show-config" data-i18n="diagnostics.allJson">전체 설정 JSON</button>
                        <button type="button" class="snw-btn snw-btn-primary" data-action="save-dirty" data-i18n="diagnostics.saveDirty">Dirty 설정 저장</button>
                    </div>
                </section>`;
        },
        logs() {
            return tpl`<section class="snw-card"><h2 data-i18n="nav.logs">시스템 로그</h2><div data-slot="log"></div></section>`;
        },
        firmware() {
            return tpl`<section class="snw-card"><h2 data-i18n="firmware.title">펌웨어 관리</h2><div data-slot="form"></div></section>`;
        },
        ai() {
            return tpl`<section class="snw-card"><h2 data-i18n="ai.title">AI 어시스턴트</h2><div data-slot="chat"></div></section>`;
        },
        info() {
            return tpl`<section class="snw-card"><h2 data-i18n="nav.info">정보</h2><div data-slot="panel"></div></section>`;
        },
        windprofile() {
            return tpl`<section class="snw-card"><h2 data-i18n="windprofile.title">바람 프리셋 관리</h2><div data-slot="list"></div></section>`;
        }
    };
})(window.SNW);
