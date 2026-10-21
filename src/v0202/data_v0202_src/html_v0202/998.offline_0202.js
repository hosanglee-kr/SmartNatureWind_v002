/* ---- 998.offline_0202.js ---- */
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    if (!window.SNW_OFFLINE) return;

    let WORKING_JSON_BASE = null;
    const JSON_BASE_CANDIDATES = ['/json/', '../../json/', '../json/', '/src/v0202/data_v0202_src/json/'];
    const FILE_MAP = {
        system:'cfg_system_0202.json', wifi:'cfg_wifi_0202.json', motion:'cfg_motion_0202.json',
        nvsSpec:'cfg_nvsSpec_0202.json', schedules:'cfg_schedules_0202.json',
        userProfiles:'cfg_userProfile_0202.json', windDict:'cfg_windDict_0202.json', webPage:'cfg_pages_0202.json'
    };
    
    // [폴백 데이터] JSON 로드 실패 시 사용할 기본 UI 뼈대 데이터
    const cache = {
        system: { system: { logging: { level: "INFO" } }, hw: { fanPwm: { pin: 6 }, fanConfig: { startPercentMin: 18 }, pir: { enabled: true, pin: 13, holdSec: 120 }, tempHum: { enabled: true, type: "DHT22", pin: 17, intervalSec: 30 } } },
        wifi: { wifi: { wifiMode: 2, ap: { ssid: "NatureWind" }, sta: [] } },
        motion: null, nvsSpec: null,
        schedules: { schedules: [
            { schId: 1, schNo: 10, name: "Morning Breeze", enabled: true, segCount: 2, period: { days: [1,1,1,1,1,0,0], startTime: "08:00", endTime: "12:00" } },
            { schId: 2, schNo: 20, name: "Evening Relax", enabled: false, segCount: 1, period: { days: [1,1,1,1,1,1,1], startTime: "19:00", endTime: "22:00" } }
        ]},
        userProfiles: { userProfiles: { profiles: [
            { profileId: 1, profileNo: 10, name: "수면 모드", enabled: true, segCount: 3 },
            { profileId: 2, profileNo: 20, name: "집중 모드", enabled: true, segCount: 1 }
        ]}},
        windDict: { windDict: { presets: [{ code: "OCEAN", name: "Ocean" }, { code: "FOREST_CANOPY", name: "Forest" }] } },
        webPage: null
    };

    const runtime = {
        control: {
            active: true, state: 'SCHEDULE_RUN', stateCode: 3, reason: 'SCHEDULE_ACTIVE', reasonCode: 4,
            time: { valid: true, hour: 10, min: 30, wday: 2 },
            sensor: { tempC: 24.5, humidity: 55, motionActive: true },
            system: { uptimeMs: 1000, epochNowMs: 0 },
            profile: { profileNo: 10 }, segment: {}, override: {}
        },
        sim: {
            active: true, phase: 'NORMAL', windSpeed: 4.5, targetWind: 5.0, pwmDuty: 55.0,
            presetCode: 'OCEAN', styleCode: 'BALANCE', intensity: 70, variability: 50,
            gustFreq: 45, fanLimit: 90, minFan: 10, turbSigma: 0.5, turbLenScale: 40,
            thermalStrength: 2, thermalRadius: 18, gustActive: false, thermalActive: false, fanPowerEnabled: true
        },
        runtime: { runMode: 1, runSource: 2, lastScheduleNo: 1, lastUserProfileNo: -1 },
        chart: Array.from({ length: 20 }).map((_, i) => ({
            t: Date.now() - (20 - i) * 1000, wind: 3 + Math.random() * 3,
            targetWind: 5.0, pwm: 40 + Math.random() * 20, gust: 0, thermal: 0
        }))
    };

    SNW.Offline = { ready: null, _cache: cache, _runtime: runtime, isReady: () => true };

    async function loadAll() {
        for (const base of JSON_BASE_CANDIDATES) {
            try {
                const res = await fetch(base + FILE_MAP.system);
                if (res.ok) { WORKING_JSON_BASE = base; break; }
            } catch (e) {}
        }
        if (!WORKING_JSON_BASE) return;
        console.log('[Offline] JSON 경로:', WORKING_JSON_BASE);
        
        await Promise.all(Object.entries(FILE_MAP).map(async ([k, f]) => {
            try { 
                const r = await fetch(WORKING_JSON_BASE + f); 
                if (r.ok) {
                    const data = await r.json();
                    if (data.system) cache.system = data;
                    if (data.wifi) cache.wifi = data;
                    if (data.schedules) cache.schedules = data;
                    if (data.userProfiles) cache.userProfiles = data;
                    if (data.windDict) cache.windDict = data;
                }
            } catch(e) {}
        }));
        if (cache.motion?.motion?.sim) Object.assign(runtime.sim, cache.motion.motion.sim);
    }

    function ensureApi() {
        if (!SNW.Api) SNW.Api = { ApiError: class extends Error { constructor(status) { super('Error'); this.status = status; } } };
        const A = SNW.Api;

        A.getState = async () => ({ control: runtime.control, sim: runtime.sim, runtime: runtime.runtime });
        A.getSim = async () => ({ sim: runtime.sim });
        A.getSystem = async () => cache.system;
        A.listSchedules = async () => cache.schedules;
        A.listProfiles = async () => cache.userProfiles;
        A.listWindProfiles = async () => cache.windDict;
        A.getWifiConfig = async () => cache.wifi;
        A.getLogs = async () => ({ logs: [{ ts:0, lv:3, msg:'[Offline] mode' }] });
        A.diag = async () => ({ heap:1024, fs_used:100, fs_total:200 });
        A.version = async () => ({ fw:'FW_Ver_2.0.2', control:'CT10_Ctl_0202' });
        A.getWifiState = async () => ({ wifi: { state: { mode_name:'OFFLINE', ssid:'(offline)', ip:'0.0.0.0', rssi:-50 } } });
        A.checkFw = async () => ({ status:'latest', current_version:'FW_Ver_2.0.2' });
        A.getConfigDirty = async () => ({ system:false, wifi:false, motion:false });
        
        A.overrideFixed = async () => ({ result:'ok' });
        A.overrideClear = async () => ({ result:'ok' });
        A.patchSim = async () => ({ updated:true });
        A.patchSystem = async () => ({ updated:true });
        A.patchWifi = async () => ({ updated:true });
        A.patchMotion = async () => ({ updated:true });
        A.saveConfig = async () => ({ result:'saved' });
        A.reload = async () => ({ result:'queued' });
        A.ackEvent = async () => ({ result:'ok' });
        A.selectProfile = async () => ({ result:'ok' });
        A.stopProfile = async () => ({ result:'ok' });
        A.scanWifi = async () => ({ wifi: { scan: [{ ssid: "TestWiFi1", rssi: -45, enc: "WPA2" }, { ssid: "TestWiFi2", rssi: -70, enc: "OPEN" }] } });
        
        // 가상 CRUD
        A.addSchedule = async (b) => {
            const list = cache.schedules.schedules || [];
            const id = list.length + 1;
            list.push(Object.assign({ schId:id, enabled:true, segCount: 1, period: {days:[1,1,1,1,1,1,1], startTime:"08:00", endTime:"20:00"} }, b.schedule || {}));
            return { result:'created', id };
        };
        A.deleteSchedule = async (id) => {
            cache.schedules.schedules = cache.schedules.schedules.filter(s => s.schId !== id);
            return { deleted:true };
        };
        A.updateSchedule = async (id, b) => {
            const idx = cache.schedules.schedules.findIndex(s => s.schId === id);
            if (idx >= 0) Object.assign(cache.schedules.schedules[idx], b.schedule || {});
            return { updated:true };
        };
        A.addProfile = async (b) => {
            const list = cache.userProfiles.userProfiles.profiles || [];
            const id = list.length + 1;
            list.push(Object.assign({ profileId:id, enabled:true, segCount: 1 }, b.profile || {}));
            return { result:'created', id };
        };
        A.deleteProfile = async (id) => {
            cache.userProfiles.userProfiles.profiles = cache.userProfiles.userProfiles.profiles.filter(p => p.profileId !== id);
            return { deleted:true };
        };
        A.updateProfile = async (id, b) => {
            const list = cache.userProfiles.userProfiles.profiles;
            const idx = list.findIndex(p => p.profileId === id);
            if (idx >= 0) Object.assign(list[idx], b.profile || {});
            return { updated:true };
        };
        A.gemini = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFile = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFirmware = async () => { throw new SNW.Api.ApiError(503); };
    }

    function stubWs() {
        if (SNW.WsManager) {
            SNW.WsManager.initByLevel = () => {};
            SNW.WsManager.get = () => ({ onMessage: () => () => {}, onOpen: () => () => {}, onClose: () => () => {} });
        }
    }

    function startSimulator() {
        setInterval(() => {
            if (!runtime.sim.active) return;
            runtime.sim.windSpeed = 3 + Math.random() * 4;
            runtime.sim.pwmDuty = runtime.sim.windSpeed * 10 + 10;
            runtime.chart.push({ t: Date.now(), wind: runtime.sim.windSpeed, targetWind: 5.0, pwm: runtime.sim.pwmDuty, gust: 0, thermal: 0 });
            if (runtime.chart.length > 120) runtime.chart.shift();
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, connection: 'online' });
        }, 1000);
    }

    SNW.Offline.ready = (async () => {
        ensureApi();
        await loadAll();
        stubWs();
        startSimulator();
        
        // L4 권한 강제 부여
        let waitCount = 0;
        while (!SNW.LevelUtil && waitCount < 40) { await new Promise(r => setTimeout(r, 50)); waitCount++; }
        if (SNW.LevelUtil) {
            SNW.LevelUtil.current = () => 'L4';
            SNW.LevelUtil.atLeast = (lvl) => true;
            console.log('[Offline] L4 권한 강제 부여');
        }
        console.log('[Offline] 준비 완료');
    })();
})(window.SNW);
