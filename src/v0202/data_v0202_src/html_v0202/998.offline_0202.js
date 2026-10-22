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
    
    const cache = {
        system: { system: { logging: { level: "INFO" } }, hw: { fanPwm: { pin: 6, channel: 0, freq: 25000, res: 10 }, fanConfig: { startPercentMin: 18, comfortPercentMin: 22, comfortPercentMax: 65, hardPercentMax: 90 }, pir: { enabled: true, pin: 13, debounceSec: 5, holdSec: 120 }, tempHum: { enabled: true, type: "DHT22", pin: 17, intervalSec: 30 } } },
        wifi: { wifi: { wifiMode: 2, ap: { ssid: "NatureWind", pass: "2540" }, sta: [{ ssid: "MyWiFi", pass: "12345678" }] } },
        motion: null, nvsSpec: null,
        schedules: { schedules: [
            { schId: 1, schNo: 10, name: "Morning Breeze", enabled: true, segCount: 2, period: { days: [1,1,1,1,1,0,0], startTime: "08:00", endTime: "12:00" } },
            { schId: 2, schNo: 20, name: "Evening Relax", enabled: false, segCount: 1, period: { days: [1,1,1,1,1,1,1], startTime: "19:00", endTime: "22:00" } }
        ]},
        userProfiles: { userProfiles: { profiles: [
            { profileId: 1, profileNo: 10, name: "수면 모드", enabled: true, segCount: 3 },
            { profileId: 2, profileNo: 20, name: "집중 모드", enabled: true, segCount: 1 }
        ]}},
        windDict: { windDict: { presets: [
            { idx: 0, code: "OCEAN", name: "Ocean Breeze", factors: { windIntensity: 70, gustFrequency: 50, windVariability: 55, fanLimit: 95, minFan: 12 } },
            { idx: 1, code: "COUNTRY_BREEZE", name: "Country Breeze", factors: { windIntensity: 55, gustFrequency: 30, windVariability: 40, fanLimit: 90, minFan: 10 } },
            { idx: 2, code: "MEDITERRANEAN", name: "Mediterranean", factors: { windIntensity: 65, gustFrequency: 38, windVariability: 50, fanLimit: 92, minFan: 10 } },
            { idx: 3, code: "MOUNTAIN", name: "Mountain", factors: { windIntensity: 80, gustFrequency: 55, windVariability: 65, fanLimit: 96, minFan: 14 } }
        ], styles: [] } },
        webPage: null
    };

    const runtime = {
        control: {
            active: true, state: 'SCHEDULE_RUN', stateCode: 3, reason: 'SCHEDULE_ACTIVE', reasonCode: 4,
            time: { valid: true, hour: 10, min: 30, wday: 2 },
            sensor: { tempC: 24.5, humidity: 55, motionActive: true },
            event: { ackRequired: false, holdUntilMs: 0, holdRemainMs: 0 },
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

        // GET 스텁
        A.getState = async () => ({ control: runtime.control, sim: runtime.sim, runtime: runtime.runtime });
        A.getSim = async () => ({ sim: runtime.sim });
        A.getSimState = async () => ({ sim: runtime.sim, control: runtime.control });
        A.getSystem = async () => cache.system;
        A.listSchedules = async () => cache.schedules;
        A.listProfiles = async () => cache.userProfiles;
        A.listWindProfiles = async () => cache.windDict;
        A.getWifiConfig = async () => cache.wifi;
        A.getWifiState = async () => ({ wifi: { state: { mode: 2, mode_name:'AP+STA (Offline)', status:'CONNECTED', ssid:'(offline)', ip:'0.0.0.0', mac:'00:00:00:00:00:00', rssi:-50, hostname:'offline', connected:false, timeSynced:false, reconnectAttempts:0 } } });
        A.getLogs = async () => ({ logs: [{ ts:0, lv:3, msg:'[Offline] mode active' }] });
        A.diag = async () => ({ heap:1024, fs_used:100, fs_total:200 });
        A.version = async () => ({ fw:'FW_Ver_2.0.2', control:'CT10_Ctl_0202', config:'C10_Config_0202', api:'W10_Web_0202', simul:'S10_Simul_0202' });
        A.checkFw = async () => ({ status:'latest', current_version:'FW_Ver_2.0.2', latest_version:'FW_Ver_2.0.2' });
        A.getConfigDirty = async () => ({ system:false, wifi:false, motion:false, schedules:false, userProfiles:false, windDict:false, nvsSpec:false, webPage:false });
        
        // [신규] 누락된 스텁 보완
        A.getMetrics = async () => ({ metrics: {} });
        A.getSummary = async () => ({ summary: {} });
        A.getConfigAll = async () => (cache);
        A.getMotion = async () => cache.motion || { motion: {} };
        
        // 쓰기 스텁
        A.overrideFixed = async () => { runtime.sim.active = true; runtime.control.active = true; return { result:'ok' }; };
        A.overrideClear = async () => { runtime.sim.active = false; runtime.control.active = false; return { result:'ok' }; };
        A.overridePreset = async (b) => { runtime.sim.presetCode = b.presetCode; runtime.sim.active = true; return { result:'ok' }; };
        A.patchSim = async (p) => { Object.assign(runtime.sim, p); return { updated:true }; };
        A.patchMotion = async () => ({ updated:true });
        A.patchSystem = async (b) => { 
            if (b.hw && cache.system) Object.assign(cache.system.hw, b.hw);
            if (b.system && cache.system) Object.assign(cache.system.system, b.system);
            return { updated:true }; 
        };
        A.patchWifi = async (b) => { if (b.wifi && cache.wifi) Object.assign(cache.wifi.wifi, b.wifi); return { updated:true }; };
        A.saveConfig = async () => ({ result:'saved' });
        A.reload = async () => ({ result:'queued' });
        A.ackEvent = async () => { runtime.control.event.ackRequired = false; return { result:'ok' }; };
        A.feedPir = async (fired) => { runtime.control.sensor.motionActive = !!fired; return { fed:true }; };
        A.selectProfile = async (id) => { runtime.control.state = 'PROFILE_RUN'; runtime.sim.active = true; return { result:'ok' }; };
        A.stopProfile = async () => { runtime.control.state = 'IDLE'; runtime.sim.active = false; return { result:'ok' }; };
        A.scanWifi = async () => ({ wifi: { scan: [
            { ssid: "TestWiFi1", rssi: -45, enc: "WPA2", chan: 6, bssid: "AA:BB:CC:DD:EE:01" },
            { ssid: "TestWiFi2", rssi: -70, enc: "OPEN", chan: 11, bssid: "AA:BB:CC:DD:EE:02" }
        ] } });
        A.setTime = async () => ({ updated:true });
        A.factoryReset = async () => ({ factory:true });
        A.gemini = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFile = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFirmware = async () => { throw new SNW.Api.ApiError(503); };
        
        // CRUD
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
        A.addWindProfile = async (b) => {
            const list = cache.windDict.windDict.presets || [];
            const id = list.length;
            list.push(Object.assign({ idx:id }, b.preset || {}));
            return { result:'created', id };
        };
        A.deleteWindProfile = async (id) => {
            cache.windDict.windDict.presets = cache.windDict.windDict.presets.filter((p, i) => i !== id);
            return { deleted:true };
        };
        A.updateWindProfile = async (id, b) => {
            const list = cache.windDict.windDict.presets;
            if (list[id]) Object.assign(list[id], b.preset || {});
            return { updated:true };
        };
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
