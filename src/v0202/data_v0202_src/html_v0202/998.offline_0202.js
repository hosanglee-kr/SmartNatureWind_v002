/* ---- 998.offline_0202.js ---- */
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    if (!window.SNW_OFFLINE) return;

    // 1. 경로 후보군
    let WORKING_JSON_BASE = null;
    const JSON_BASE_CANDIDATES = ['/json/', '../../json/', '../json/', '/src/v0202/data_v0202_src/json/'];
    const FILE_MAP = {
        system:'cfg_system_0202.json', wifi:'cfg_wifi_0202.json', motion:'cfg_motion_0202.json',
        nvsSpec:'cfg_nvsSpec_0202.json', schedules:'cfg_schedules_0202.json',
        userProfiles:'cfg_userProfile_0202.json', windDict:'cfg_windDict_0202.json', webPage:'cfg_pages_0202.json'
    };
    const cache = { system:null, wifi:null, motion:null, nvsSpec:null, schedules:null, userProfiles:null, windDict:null, webPage:null };

    // 2. 가상 런타임
    const runtime = {
        control: {
            active:false, state:'IDLE', stateCode:0, reason:'NONE', reasonCode:0,
            time:{ valid:false, hour:-1, min:-1, wday:-1 },
            sensor:{ tempC:24, humidity:55, motionActive:false },
            system:{ uptimeMs:0, epochNowMs:0 },
            profile:{ profileNo:0 }, segment:{}, override:{}
        },
        sim: {
            active:false, phase:'NORMAL', windSpeed:3.6, targetWind:3.6, pwmDuty:0,
            presetCode:'OCEAN', styleCode:'BALANCE', intensity:70, variability:50,
            gustFreq:45, fanLimit:90, minFan:10, turbSigma:0.5, turbLenScale:40,
            thermalStrength:2, thermalRadius:18, gustActive:false, thermalActive:false, fanPowerEnabled:true
        },
        runtime: { runMode:0, runSource:0, lastScheduleNo:-1, lastUserProfileNo:-1 }
    };

    // 3. SNW.Offline 객체 선언 (isReady는 항상 true)
    SNW.Offline = {
        ready: null,
        _cache: cache,
        _runtime: runtime,
        isReady: () => true
    };

    // 4. [핵심] SNW.Api 객체 강제 생성 (없으면 새로 만듦)
    function ensureApi() {
        if (!SNW.Api) {
            // ApiError 클래스도 강제 생성
            SNW.Api = {
                ApiError: class extends Error {
                    constructor(status, data) { super((data && data.error) || 'Error'); this.status = status; this.data = data; }
                },
                setApiKey: () => {}, getApiKey: () => ''
            };
        }
        const A = SNW.Api;

        // GET 스텁
        A.getState = async () => ({ control: runtime.control, sim: runtime.sim, runtime: runtime.runtime });
        A.getSim = async () => ({ sim: runtime.sim });
        A.getSimState = async () => ({ sim: runtime.sim, control: runtime.control });
        A.getSystem = async () => ({ ...cache.system });
        A.listSchedules = async () => ({ ...cache.schedules });
        A.listProfiles = async () => ({ ...cache.userProfiles });
        A.listWindProfiles = async () => ({ ...cache.windDict });
        A.getLogs = async () => ({ logs: [{ ts:0, lv:3, msg:'[Offline] frontend-only mode' }] });
        A.diag = async () => ({ heap:0, fs_used:0, fs_total:0 });
        A.version = async () => ({ fw:'FW_Ver_2.0.2', control:'CT10_Ctl_0202', config:'C10', api:'W10', simul:'S10' });
        A.checkFw = async () => ({ status:'latest' });
        A.getConfigDirty = async () => ({ system:false, wifi:false, motion:false });
        A.getWifiState = async () => ({ wifi: { state: { mode_name:'OFFLINE' } } });

        // 쓰기 스텁
        A.overrideFixed = async () => { runtime.sim.active = true; runtime.control.active = true; return { result:'ok' }; };
        A.overrideClear = async () => { runtime.sim.active = false; runtime.control.active = false; return { result:'ok' }; };
        A.overridePreset = async () => ({ result:'ok' });
        A.patchSim = async (p) => { Object.assign(runtime.sim, p); return { updated:true }; };
        A.patchMotion = async () => ({ updated:true });
        A.patchSystem = async () => ({ updated:true });
        A.saveConfig = async () => ({ result:'saved' });
        A.reload = async () => ({ result:'queued' });
        A.ackEvent = async () => ({ result:'ok' });
        A.feedPir = async () => ({ result:'ok' });
        A.selectProfile = async () => ({ result:'ok' });
        A.stopProfile = async () => ({ result:'ok' });
        A.scanWifi = async () => ({ wifi: { scan: [] } });
        A.setTime = async () => ({ result:'ok' });
        A.factoryReset = async () => ({ factory:true });
        A.gemini = async () => { throw new SNW.Api.ApiError(503, { error:'offline' }); };
        A.uploadFile = async () => { throw new SNW.Api.ApiError(503, { error:'offline' }); };
        A.uploadFirmware = async () => { throw new SNW.Api.ApiError(503, { error:'offline' }); };
        A.addSchedule = async (b) => {
            if (!cache.schedules) cache.schedules = { schedules: [] };
            const list = cache.schedules.schedules || [];
            const id = list.length + 1;
            list.push(Object.assign({ schId:id, enabled:true }, b.schedule || {}));
            return { result:'created', id };
        };
        A.deleteSchedule = async (id) => {
            if (cache.schedules && cache.schedules.schedules) {
                cache.schedules.schedules = cache.schedules.schedules.filter(s => s.schId !== id);
            }
            return { deleted:true };
        };
        A.updateSchedule = async (id, b) => {
            if (cache.schedules && cache.schedules.schedules) {
                const list = cache.schedules.schedules;
                const idx = list.findIndex(s => s.schId === id);
                if (idx >= 0) list[idx] = Object.assign(list[idx], b.schedule || {});
            }
            return { updated:true };
        };
        A.deleteProfile = async () => ({ deleted:true });
        A.addProfile = async () => ({ result:'created', id:1 });
        A.updateProfile = async () => ({ updated:true });
    }

    // 5. JSON 로드
    async function loadAll() {
        for (const base of JSON_BASE_CANDIDATES) {
            try {
                const res = await fetch(base + FILE_MAP.system);
                if (res.ok) { WORKING_JSON_BASE = base; break; }
            } catch (e) {}
        }
        if (!WORKING_JSON_BASE) { console.error('[Offline] JSON 경로 못 찾음'); return; }
        console.log('[Offline] JSON 경로:', WORKING_JSON_BASE);
        await Promise.all(Object.entries(FILE_MAP).map(async ([k, f]) => {
            try { const r = await fetch(WORKING_JSON_BASE + f); cache[k] = await r.json(); } catch(e) {}
        }));
        if (cache.motion?.motion?.sim) Object.assign(runtime.sim, cache.motion.motion.sim);
    }

    // 6. WS 스텁
    function stubWs() {
        if (SNW.WsManager) {
            SNW.WsManager.initByLevel = () => {};
            SNW.WsManager.get = () => ({ onMessage: () => () => {}, onOpen: () => () => {}, onClose: () => () => {} });
        }
    }

    // 7. Store 주기 갱신 (가상 WS 대체)
    function startFakeWs() {
        setInterval(() => {
            if (SNW.Store) {
                SNW.Store.set({ control: runtime.control, sim: runtime.sim, connection: 'online' });
            }
        }, 500);
    }
    
    // ======================================================
	// 8. 부트스트랩 (API 강제 생성 → JSON 로드 → WS 스텁 → ready)
	// ======================================================
	SNW.Offline.ready = (async () => {
		ensureApi(); // SNW.Api가 없어도 강제로 만듦
		await loadAll();
		stubWs();
		startFakeWs();
		console.log('[Offline] API 강제 생성 완료');
		
		// [수정] SNW.LevelUtil이 로드될 때까지 대기 후 L4 권한 강제 부여
		let waitCount = 0;
		while (!SNW.LevelUtil && waitCount < 40) { // 최대 2초 대기
			await new Promise(r => setTimeout(r, 50));
			waitCount++;
		}
		
		if (SNW.LevelUtil) {
			SNW.LevelUtil.current = () => 'L4';
			SNW.LevelUtil.atLeast = (lvl) => true;
			console.log('[Offline] 모든 메뉴 접근 권한(L4) 강제 활성화');
		} else {
			console.warn('[Offline] SNW.LevelUtil을 찾을 수 없습니다.');
		}
	})();
	
	// 9. 리다이렉트 (해시 정규화) -> Router가 알아서 처리하므로 제거함
    // 9. 리다이렉트 (해시 정규화)
    /*
    setTimeout(() => {
        if (location.hash === '' || location.hash === '#') {
            location.replace(location.pathname + location.search + '#/dashboard');
        }
    }, 100);
    */
})(window.SNW);

