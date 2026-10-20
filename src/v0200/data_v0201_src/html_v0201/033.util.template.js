// =========================================================
// 033.util.template.js — SNW.Tpl (페이지 HTML 템플릿)
// Layer 1 (유틸) — SNW.C, SNW.DomUtil 참조
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// tagged template → HTMLElement
	function tpl(strings, ...vals) {
		return SNW.DomUtil.html(strings, ...vals);
	}
	
	SNW.Tpl = {
		tpl,
		
		// =====================================================
		// Dashboard (L1 MVP 확정판)
		//  - data-slot 계약: badge / cur-wind / gauge / power / presets / intensity / sensors
		// =====================================================
		dashboard() {
			return tpl`
                <div class="snw-dashboard">
                    <section class="snw-card snw-card--state">
                        <h2 data-i18n="dashboard.realtimeState">실시간 상태</h2>
                        <div data-slot="badge" class="snw-state-badge"></div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.currentWind">현재 풍속</span>
                            <b data-slot="cur-wind">-</b>
                            <span data-i18n="unit.windSpeed">m/s</span>
                        </div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.targetWind">목표 풍속</span>
                            <b data-slot="target-wind">-</b>
                            <span data-i18n="unit.windSpeed">m/s</span>
                        </div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.phase">Phase</span>
                            <b data-slot="phase">-</b>
                        </div>
                        <div class="snw-kv">
                            <span data-i18n="dashboard.pwmOutput">PWM</span>
                            <span data-slot="gauge"></span>
                        </div>
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
		
		// =====================================================
		// Chart (stub, Phase 5)
		// =====================================================
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
		
		// =====================================================
		// Settings (stub)
		// =====================================================
		settings() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="system.title">시스템 설정</h2>
                    <div data-slot="form-log"></div>
                    <div data-slot="form-api"></div>
                    <div class="snw-form-actions">
                        <button data-action="save"   class="snw-btn snw-btn-primary" data-i18n="system.save">저장</button>
                        <button data-action="reload" class="snw-btn"                 data-i18n="system.reload">재로드</button>
                    </div>
                </section>`;
		},
		
		// =====================================================
		// 나머지 페이지 (stub, Phase 5)
		// =====================================================
		schedule() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="scheduler.title">스케줄 예약</h2>
                    <div data-slot="list"></div>
                </section>`;
		},
		profiles() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="profile.title">사용자 프로필</h2>
                    <div data-slot="list"></div>
                </section>`;
		},
		sensors() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="sensor.title">센서 및 모션</h2>
                    <div data-slot="sensors"></div>
                </section>`;
		},
		network() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="network.title">네트워크 및 시간</h2>
                    <div data-slot="form"></div>
                </section>`;
		},
		logs() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="log.title">시스템 로그</h2>
                    <div data-slot="log"></div>
                </section>`;
		},
		diagnostics() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="diag.title">시스템 진단</h2>
                    <div data-slot="panel"></div>
                </section>`;
		},
		firmware() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="firmware.title">펌웨어 관리</h2>
                    <div data-slot="form"></div>
                </section>`;
		},
		ai() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="ai.title">AI 어시스턴트</h2>
                    <div data-slot="chat"></div>
                </section>`;
		},
		info() {
			return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.info">정보</h2>
                    <div data-slot="panel"></div>
                </section>`;
		}
	};
	
})(window.SNW);
