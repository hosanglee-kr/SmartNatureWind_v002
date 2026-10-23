// =========================================================
// 060.store.js — SNW.Store + SNW.StoreBridge
// Layer 2 (서비스) — Layer 0~1 참조
//  - 경량 Observable Store (watch/subscribe)
//  - WS state 채널 → Store 자동 브리지
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
	'use strict';
	
	// =====================================================
	// Store (Observable)
	// =====================================================
	class Store {
		constructor(initial) {
			this._state = Object.assign({}, initial);
			this._subs = new Set();
		}
		
		get() { return this._state; }
		
		subscribe(fn) {
			this._subs.add(fn);
			return () => this._subs.delete(fn);
		}
		
		/** patch(얕은 병합) 후 구독자 알림 */
		set(patch) {
			const prev = this._state;
			this._state = Object.assign({}, prev, patch);
			this._subs.forEach(fn => {
				try { fn(this._state, prev); }
				catch (e) { SNW.LogUtil.error('[Store]', e); }
			});
		}
		
		/** 특정 키만 관찰 */
		watch(key, fn) {
			let last = this._state[key];
			return this.subscribe((s) => {
				if (s[key] !== last) {
					const prev = last;
					last = s[key];
					fn(s[key], prev);
				}
			});
		}
	}
	
	// =====================================================
	// 전역 싱글톤 Store
	// =====================================================
	SNW.Store = new Store({
		// 서버 상태
		control: null, // /state.control
		sim: null, // /state.sim
		time: null, // control.time
		system: null, // control.system (uptimeMs/epochNowMs)
		
		// 파생 상태
		lastUpdateMs: 0,
		connection: 'offline', // 'online' | 'offline' | 'polling'
		fsmState: 0,
		fsmReason: 0,
		
		// 사용자 컨텍스트
		level: (SNW.LevelUtil && SNW.LevelUtil.current) ? SNW.LevelUtil.current() : 'L1'
	});
	
	// =====================================================
	// StoreBridge (WS → Store)
	// =====================================================
	SNW.StoreBridge = {
		_started: false,
		_unsubs: [],
		
		start() {
			if (this._started) return;
			this._started = true;
			
			const wsState = SNW.WsManager.get('state');
			if (!wsState) {
				SNW.LogUtil.warn('[StoreBridge] state 채널 없음');
				return;
			}
			
			const unsubMsg = wsState.onMessage((data) => {
				const ctl = (data && data.control) || null;
				const sim = (data && data.sim) || null;
				
				const patch = {
					lastUpdateMs: Date.now(),
					connection: 'online'
				};
				
				if (ctl) {
					patch.control = ctl;
					patch.time = ctl.time || null;
					patch.system = ctl.system || null;
					patch.fsmState = (ctl.stateCode != null) ? ctl.stateCode : 0;
					patch.fsmReason = (ctl.reasonCode != null) ? ctl.reasonCode : 0;
				}
				if (sim) {
					patch.sim = sim;
				}
				
				SNW.Store.set(patch);
			});
			
			wsState.onOpen(() => {
				SNW.Store.set({ connection: 'online' });
			});
			
			wsState.onClose(() => {
				SNW.Store.set({ connection: 'offline' });
			});
			
			this._unsubs.push(unsubMsg);
		},
		
		stop() {
			this._unsubs.forEach(fn => fn());
			this._unsubs = [];
			this._started = false;
		}
	};
	
})(window.SNW);
