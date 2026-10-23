/*
 * ------------------------------------------------------
 * 소스명   : 210.page.chart.js
 * 모듈     : SNW.Page.Chart
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 실시간 물리 차트 (120초 풀 뷰)
 *  - WS /ws/chart 구독 → SNW.UI.chart.push()
 *  - 시간축 범위 선택 (5/30/120초)
 *  - CSV 내보내기 (현재 버퍼)
 * 의존성   : SNW.C, SNW.CFG, SNW.I18n, SNW.DomUtil, SNW.Tpl,
 *            SNW.UI.chart, SNW.WsManager, SNW.Store, SNW.Api
 * ------------------------------------------------------
 */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function(SNW) {
	'use strict';
	
	SNW.Page.Chart = class Chart {
		constructor(container) {
			this.el = container;
			this._unsubs = [];
			this._wsUnsubs = [];
			this._timers = [];
			this._active = true;
			this._rangeSec = 120;
			this._buffer = []; // CSV/재렌더용 원본 버퍼 (최대 120)
			this.chart = null;
		}
		
		async mount() {
			this.el.innerHTML = '';
			this.el.appendChild(SNW.Tpl.chart());
			SNW.I18n.applyTo(this.el);
			
			// 차트 초기화
			const chartSlot = this.el.querySelector('[data-slot="chart"]');
			this.chart = SNW.UI.chart({
				root: chartSlot,
				maxPoints: 120,
				series: SNW.CFG.UI.MINI_CHART_SERIES
			});
			
			// 초기 데이터 (풀 덤프)
			try {
				const simState = await SNW.Api.getSimState();
				if (this._active) this._applyInitial(simState);
			} catch (e) {
				SNW.LogUtil.warn('[Chart] 초기 sim state 실패', e);
			}
			
			// WS chart 구독
			const wsChart = SNW.WsManager.get('chart');
			if (wsChart) {
				const unsub = wsChart.onMessage((data) => {
					if (!this._active) return;
					this._onWsChart(data);
				});
				this._wsUnsubs.push(unsub);
			}
			
			// 범위 선택
			const rangeSel = this.el.querySelector('[data-slot="range"]');
			if (rangeSel) {
				rangeSel.value = String(this._rangeSec);
				rangeSel.addEventListener('change', () => {
					this._rangeSec = Number(rangeSel.value) || 120;
					this._redrawRange();
				});
			}
			
			// CSV 내보내기
			SNW.DomUtil.delegate(this.el, '[data-action="export"]', 'click', () => {
				this._exportCsv();
			});
			
			SNW.LogUtil.info('[Chart] mount 완료');
		}
		
		unmount() {
			this._active = false;
			this._unsubs.forEach(fn => { try { fn(); } catch {} });
			this._wsUnsubs.forEach(fn => { try { fn(); } catch {} });
			this._timers.forEach(id => clearInterval(id));
			if (this.chart && this.chart.destroy) {
				try { this.chart.destroy(); } catch {}
			}
			this._unsubs = [];
			this._wsUnsubs = [];
			this._timers = [];
		}
		
		// -------------------------------------------------
		// 초기 데이터 (S10 → sim state)
		// -------------------------------------------------
		_applyInitial(simState) {
			if (!simState || !simState.sim) return;
			const sim = simState.sim;
			// 초기 1포인트 push (풍속/목표/PWM)
			this._pushPoint({
				t: Date.now(),
				windSpeed: sim.windSpeed != null ? sim.windSpeed : 0,
				targetWind: sim.targetWind != null ? sim.targetWind : 0,
				pwmDuty: sim.pwmDuty != null ? sim.pwmDuty : 0
			});
		}
		
		// -------------------------------------------------
		// WS chart 수신
		//  - diffOnly: { sim: { windSpeed, targetWind, pwmDuty, ... } }
		//  - full dump: { chart: [...], sim: {...} }
		// -------------------------------------------------
		_onWsChart(data) {
			if (!data) return;
			const sim = data.sim || {};
			
			// full dump (배열)
			if (Array.isArray(data.chart)) {
				this._buffer = data.chart.map(e => ({
					t: e.t != null ? e.t : Date.now(),
					windSpeed: e.wind != null ? e.wind : 0,
					targetWind: e.targetWind != null ? e.targetWind : 0,
					pwmDuty: e.pwm != null ? e.pwm : 0
				}));
				this._redrawRange();
				return;
			}
			
			// diffOnly (최신 1개)
			this._pushPoint({
				t: Date.now(),
				windSpeed: sim.windSpeed != null ? sim.windSpeed : 0,
				targetWind: sim.targetWind != null ? sim.targetWind : 0,
				pwmDuty: sim.pwmDuty != null ? sim.pwmDuty : 0
			});
		}
		
		_pushPoint(pt) {
			this._buffer.push(pt);
			if (this._buffer.length > 120) this._buffer.shift();
			if (this.chart) this.chart.push(pt);
		}
		
		// -------------------------------------------------
		// 범위 변경 시 재렌더 (버퍼에서 잘라냄)
		// -------------------------------------------------
		_redrawRange() {
			if (!this.chart) return;
			this.chart.clear();
			this.chart.setMaxPoints(this._rangeSec);
			const start = Math.max(0, this._buffer.length - this._rangeSec);
			for (let i = start; i < this._buffer.length; i++) {
				this.chart.push(this._buffer[i]);
			}
		}
		
		// -------------------------------------------------
		// CSV 내보내기 (현재 buffer)
		// -------------------------------------------------
		_exportCsv() {
			if (!this._buffer.length) {
				SNW.ToastUtil.info(SNW.I18n.t('common.noData'));
				return;
			}
			const header = 'timestamp,windSpeed,targetWind,pwmDuty\n';
			const rows = this._buffer.map(r => [
				SNW.TimeUtil.epochToTimeStr(r.t),
				r.windSpeed.toFixed(3),
				r.targetWind.toFixed(3),
				r.pwmDuty.toFixed(1)
			].join(',')).join('\n');
			
			const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `snw_chart_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			
			SNW.ToastUtil.success(SNW.I18n.t('common.success'));
		}
	};
	
})(window.SNW);
