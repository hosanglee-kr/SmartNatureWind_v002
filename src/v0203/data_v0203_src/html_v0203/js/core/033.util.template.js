// =========================================================
// 033.util.template.js — SNW.Tpl (페이지 HTML 템플릿)
// Layer 1 (유틸) — SNW.C, SNW.DomUtil 참조
// [P2-8] 분리된 페이지별 템플릿 구현 위치:
//  - Dashboard: 200.page.dashboard.js
//  - Settings / Monitor / AI: 240/260/290.page.*.js
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
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
        
        // =========================================================
        // 1. Dashboard (바람 스타일 선택 UI 추가됨)
        // =========================================================
        // 2. Chart
        // =========================================================
        chart() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="chart.title">실시간 물리 차트</h2>
                    <div class="snw-tabs" style="margin-bottom:12px;display:flex;gap:4px;">
                        <button type="button" class="snw-tab-btn is-active"
                                data-chart-tab="live">📊 <span data-i18n="chart.tab.live">실제 작동 중</span></button>
                        <button type="button" class="snw-tab-btn"
                                data-chart-tab="preview">🎬 <span data-i18n="chart.tab.preview">예상 파형</span></button>
                    </div>
                    <div class="snw-chart-toolbar">
                        <select data-slot="range">
                            <option value="5" data-i18n="chart.range5s">5초</option>
                            <option value="30" data-i18n="chart.range30s">30초</option>
                            <option value="120" selected data-i18n="chart.range120s">120초</option>
                        </select>
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;margin-left:8px;cursor:pointer;">
                            <input type="checkbox" data-chart-overlay>
                            <span data-i18n="chart.overlay">예상 오버레이</span>
                        </label>
                        <button data-action="export" data-i18n="chart.exportCsv">CSV</button>
                    </div>
                    <div data-slot="banner" style="display:none;padding:6px 12px;background:var(--snw-surface-2);border-radius:4px;margin-bottom:8px;font-size:12px;"></div>
                    <div data-slot="chart" class="snw-chart-area"></div>
                </section>`;
        },
        
        // =========================================================
        // 3. Settings (form-container 슬롯 추가됨)
        // =========================================================
        settings() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="settings.title">시스템 설정</h2>
                    
                    <!-- 탭 및 폼 콘텐츠가 이곳에 동적 삽입됨 -->
                    <div data-slot="form-container"></div>
                    
                    <!-- 하단 Sticky 저장 바 (240.page.settings.js에서 채움) -->
                    <div data-slot="action-bar"></div>
                </section>`;
        },
        
        // =========================================================
        // 4. Simulation
        // =========================================================
        simulation() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.simulation">시뮬레이션 상세 설정</h2>
                    <div data-slot="form" class="snw-form" data-i18n="common.loading">로딩 중...</div>
                </section>`;
        },
        
        // =========================================================
        // 5. Schedule
        // =========================================================
        // 7. Network
        // =========================================================
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
        
        // =========================================================
        // 8. Sensors
        // =========================================================
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
        
        // =========================================================
        // 9. Diagnostics
        // =========================================================
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
        
        // =========================================================
        // 10. Logs
        // =========================================================
        logs() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="nav.logs">시스템 로그</h2>
                    <div data-slot="log"></div>
                </section>`;
        },
        
        // =========================================================
        // 11. Firmware
        // =========================================================
        firmware() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="firmware.title">펌웨어 관리</h2>
                    <div data-slot="form"></div>
                </section>`;
        },
        
        // =========================================================
        // 12. AI
        // =========================================================
        ai() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="ai.title">AI 어시스턴트</h2>
                    <div data-slot="chat"></div>
                </section>`;
        },
        
        // =========================================================
        // =========================================================
        // 14. WindProfile
        // =========================================================
        windprofile() {
            return tpl`
                <section class="snw-card">
                    <h2 data-i18n="windprofile.title">바람 프리셋 관리</h2>
                    <div data-slot="list"></div>
                </section>`;
        }
    };
})(window.SNW);
