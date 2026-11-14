// =========================================================
// 060.store.js — SNW.Store + SNW.StoreBridge
// Layer 2 (서비스) — Layer 0~1 참조
//  - 경량 Observable Store (watch/subscribe)
//  - WS state 채널 → Store 자동 브리지
// =========================================================
window.SNW = window.SNW || {};
(function (SNW) {
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
		session: null, // [v0203 Stage 3] Session 스냅샷

		// [Stage 10 P0-4] Comfort 자동 모드
		autoComfortEnabled: false,
		autoComfortLastEvalMs: 0,

		// [Stage 10.1 Option A] 하드웨어 타이머 상태
		hardwareTimerActive: false,
		hardwareTimerRemainSec: 0,

		// 파생 상태
		lastUpdateMs: 0,
		connection: 'offline', // 'online' | 'offline' | 'polling'
		fsmState: 0,
		fsmReason: 0,

		// 사용자 컨텍스트
		level: (SNW.LevelUtil && SNW.LevelUtil.current) ? SNW.LevelUtil.current() : 'L1'
	});

	// =====================================================
	// 세션 정규화 헬퍼 (R-1)
	// =====================================================
	const SESSION_TYPE_NAMES = ['NONE', 'PLAYLIST', 'PRESET', 'FIXED'];
	const SESSION_TRIGGER_NAMES = ['NONE', 'MANUAL', 'SCHEDULE', 'AUTO_COMFORT'];

	function normalizeSession(s) {
		if (!s || typeof s !== 'object') {
			return {
				type: 0,
				typeName: 'NONE',
				trigger: 0,
				triggerName: 'NONE',
				state: 'IDLE',
				active: false,
				name: '',
				presetCode: '',
				styleCode: '',
				elapsedSec: 0,
				remainSec: 0,
				totalSec: 0
			};
		}

		let typeNum = 0;
		let typeName = 'NONE';
		if (typeof s.type === 'number') {
			typeNum = s.type;
			typeName = SESSION_TYPE_NAMES[typeNum] || (s.typeName || 'NONE');
		} else if (typeof s.type === 'string') {
			typeName = s.type.toUpperCase();
			typeNum = SESSION_TYPE_NAMES.indexOf(typeName);
			if (typeNum < 0) typeNum = 0;
		} else if (s.typeName) {
			typeName = String(s.typeName).toUpperCase();
			typeNum = SESSION_TYPE_NAMES.indexOf(typeName);
			if (typeNum < 0) typeNum = 0;
		}

		let trigNum = 0;
		let trigName = 'NONE';
		if (typeof s.trigger === 'number') {
			trigNum = s.trigger;
			trigName = SESSION_TRIGGER_NAMES[trigNum] || 'NONE';
		} else if (typeof s.trigger === 'string') {
			trigName = s.trigger.toUpperCase();
			trigNum = SESSION_TRIGGER_NAMES.indexOf(trigName);
			if (trigNum < 0) trigNum = 0;
		}

		let stateStr = 'IDLE';
		if (typeof s.state === 'string') {
			stateStr = (s.state.toUpperCase() === 'RUNNING') ? 'ACTIVE' : s.state.toUpperCase();
		} else if (typeof s.state === 'number') {
			stateStr = (s.state === 1) ? 'PAUSED' : ((s.state === 2) ? 'COMPLETED' : 'ACTIVE');
		}

		const activeBool = Boolean(s.active && typeName !== 'NONE' && stateStr !== 'COMPLETED');

		return Object.assign({}, s, {
			type: typeNum,
			typeName: typeName,
			trigger: trigNum,
			triggerName: trigName,
			state: stateStr,
			active: activeBool
		});
	}

	// =====================================================
	// StoreBridge (WS → Store)
	// =====================================================
	SNW.StoreBridge = {
		_started: false,
		_unsubs: [],
		normalizeSession: normalizeSession,

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
					patch.session = normalizeSession(ctl.session); // [v0203 R-1] 정규화 적용
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
