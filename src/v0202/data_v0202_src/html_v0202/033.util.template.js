// =========================================================
// 033.util.template.js — SNW.Tpl (페이지 HTML 템플릿)
// Layer 1 (유틸) — SNW.C, SNW.DomUtil 참조
// =========================================================
/* ---- 033.util.template.js ---- */
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    function tpl(strings, ...vals) { return SNW.DomUtil.html(strings, ...vals); }
    
    SNW.Tpl = {
        tpl,
        dashboard() {
            return tpl`
                <div class="snw-dashboard">
                    <section class="snw-card snw-card--state">
                        <h2 data-i18n="dashboard.realtimeState">실시간 상태</h2>
                        <div data-slot="badge" class="snw-state-badge"></div>
                        <div class="snw-kv"><span data-i18n="dashboard.currentWind">현재 풍속</span><b data-slot="cur-wind">-</b><span data-i18n="unit.windSpeed">m/s</span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.targetWind">목표 풍속</span><b data-slot="target-wind">-</b><span data-i18n="unit.windSpeed">m/s</span></div>
                        <div class="snw-kv"><span data-i18n="dashboard.phase">Phase</span><b data-slot="phase">-</b></div>
                        <div class="snw-kv"><span data-i18n="dashboard.pwmOutput">PWM</span><span data-slot="gauge"></span></div>
                        <div class="snw-kv"><span>스케줄</span><b data-slot="sch-name">-</b></div>
                        <div class="snw-kv"><span>프로필</span><b data-slot="prof-name">-</b></div>
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
                            <option value="5"   data-i18n="chart.range5">5초</option>
                            <option value="30"  data-i18n="chart.range30">30초</option>
                            <option value="120" selected data-i18n="chart.range120">120초</option>
                        </select>
                        <button data-action="export" data-i18n="chart.export">CSV</button>
                    </div>
                    <div data-slot="chart" class="snw-chart-area"></div>
                </section>`;
        },
        settings() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="system.title">시스템 설정</h2>
                    <h3>Logging & Security</h3>
                    <div data-slot="form-log"></div>
                    <div data-slot="form-api"></div>
                    <h3>Hardware (PWM / Fan)</h3>
                    <div data-slot="form-hw"></div>
                    <div class="snw-form-actions" style="justify-content:space-between;align-items:center;display:flex;">
                        <div>
                            <button data-action="save"   class="snw-btn snw-btn-primary" data-i18n="system.save">저장</button>
                            <button data-action="reload" class="snw-btn" data-i18n="system.reload">재로드</button>
                        </div>
                        <button data-action="factory-reset" class="snw-btn snw-btn-icon--danger" style="background:rgba(248,81,73,0.1);color:var(--snw-error);" data-i18n="system.factoryReset">공장 초기화</button>
                    </div>
                </section>`;
        },
        
        schedule() {
            return tpl`<section class="snw-card"><h2 data-i18n="scheduler.title">스케줄 예약</h2><div data-slot="list"></div></section>`;
        },
        profiles() {
            return tpl`<section class="snw-card"><h2 data-i18n="profile.title">사용자 프로필</h2><div data-slot="list"></div></section>`;
        },
        windprofile() {
            return tpl`<section class="snw-card"><h2 data-i18n="nav.windprofile">바람 프리셋 관리</h2><div data-slot="list"></div></section>`;
        },
    
        network() {
            return tpl`
            <section class="snw-card">
                <h2 data-i18n="network.title">네트워크 상태</h2>
                <div data-slot="wifi-state"></div>
            </section>
            <section class="snw-card">
                <h2>Wi-Fi 설정</h2>
                <div data-slot="wifi-config" class="snw-form"></div>
            </section>
            <section class="snw-card">
                <h2>시간 설정</h2>
                <div data-slot="time-config" class="snw-form"></div>
            </section>`;
        },
        sensors() {
            return tpl`
            <div class="snw-dashboard" style="grid-template-columns:1fr;">
                <section class="snw-card">
                    <h2>실시간 센서 상태</h2>
                    <div class="snw-sensor-cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
                        <div class="snw-sensor-card"><span class="snw-sensor-card__icon">🌡</span><span class="snw-sensor-card__label">온도</span><span class="snw-sensor-card__val" data-slot="sensor-temp">--</span></div>
                        <div class="snw-sensor-card"><span class="snw-sensor-card__icon">💧</span><span class="snw-sensor-card__label">습도</span><span class="snw-sensor-card__val" data-slot="sensor-hum">--</span></div>
                        <div class="snw-sensor-card"><span class="snw-sensor-card__icon">👤</span><span class="snw-sensor-card__label">인체감지</span><span class="snw-sensor-card__val" data-slot="sensor-motion">--</span></div>
                    </div>
                    <div class="snw-toolbar"><button type="button" class="snw-btn snw-btn-primary" data-action="feed-pir">PIR 강제 감지 테스트</button></div>
                </section>
                <section class="snw-card">
                    <h2>모션 로직 설정 (cfg_motion)</h2>
                    <div data-slot="motion-config" class="snw-form"></div>
                </section>
            </div>`;
        },
    
        logs() {
            return tpl`<section class="snw-card"><h2 data-i18n="log.title">시스템 로그</h2><div data-slot="log"></div></section>`;
        },
        diagnostics() {
            return tpl`<section class="snw-card"><h2 data-i18n="diag.title">시스템 진단</h2><div data-slot="panel"></div></section>`;
        },
        firmware() {
            return tpl`<section class="snw-card"><h2 data-i18n="firmware.title">펌웨어 관리</h2><div data-slot="form"></div></section>`;
        },
        ai() {
            return tpl`<section class="snw-card"><h2 data-i18n="ai.title">AI 어시스턴트</h2><div data-slot="chat"></div></section>`;
        },
        info() {
            return tpl`<section class="snw-card"><h2 data-i18n="nav.info">정보</h2><div data-slot="panel"></div></section>`;
        }
    };
})(window.SNW);
