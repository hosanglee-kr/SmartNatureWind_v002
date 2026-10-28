/* ---- 998.offline_0202.js ---- */
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    if (!window.SNW_OFFLINE) return;
    
    let WORKING_JSON_BASE = null;
    const JSON_BASE_CANDIDATES = ['../json/', '/json/', '../../json/', './json/', '/src/v0202/data_v0202_src/json/'];
    const FILE_MAP = {
        system: 'cfg_system_0202.json',
        wifi: 'cfg_wifi_0202.json',
        motion: 'cfg_motion_0202.json',
        nvsSpec: 'cfg_nvsSpec_0202.json',
        schedules: 'cfg_schedules_0202.json',
        userProfiles: 'cfg_userProfile_0202.json',
        windDict: 'cfg_windDict_0202.json',
        webPage: 'cfg_pages_0202.json'
    };
    
        // 기본 캐시 데이터: 998.offline_data_0202.js에서 로드된 SNW.OFFLINE_DEFAULT_CACHE 참조
    const DEFAULT_CACHE = (SNW && SNW.OFFLINE_DEFAULT_CACHE) || {};
    
    // 캐시 객체 초기화: LocalStorage에 사용자가 수정한 내용이 있으면 우선 로드, 없으면 DEFAULT_CACHE 사용
    const cache = {};
    for (const [key, defaultVal] of Object.entries(DEFAULT_CACHE)) {
        const saved = localStorage.getItem('snw.offline.' + key);
        if (saved) {
            try { cache[key] = JSON.parse(saved); continue; } catch(e) {}
        }
        cache[key] = defaultVal ? JSON.parse(JSON.stringify(defaultVal)) : null;
    }
    
    const runtime = {
        control: {
            active: true,
            profileMode: false,
            state: 'SCHEDULE_RUN',
            stateCode: 3,
            reason: 'SCHEDULE_ACTIVE',
            reasonCode: 4,
            runSource: 1,
            time: { valid: true, hour: 10, min: 30, wday: 2 },
            sensor: { tempC: 24.5, humidity: 55, motionActive: true },
            event: { ackRequired: false, holdUntilMs: 0, holdRemainMs: 0 },
            system: { uptimeMs: 1000, epochNowMs: 0 },
            schedule: { index: 0, schId: 1, schNo: 10, name: '아침 바람 (Morning Breeze)', fromRunSource: true },
            profile: { index: -1, profileNo: 0, name: '', fromRunSource: false },
            autoOffRt: { timerArmed: true, timerStartMs: 0, timerMinutes: 180, offTimeEnabled: false, offTimeMinutes: 0, offTempEnabled: false, offTemp: 0 },
            segment: { segId: 0, segNo: 0, scheduleRt: { index: -1, onPhase: false, phaseStartMs: 0, loopCount: 0 }, profileRt: { index: -1, onPhase: false, phaseStartMs: 0, loopCount: 0 } },
            override: { active: false, useFixed: false, remainSec: 0, fixedPercent: 0, presetCode: '', styleCode: '' },
            dirty: { state: false, metrics: false, chart: false, summary: false },
            pendingReload: false,
            lastReloadOk: true
        },
        sim: {
            active: true,
            phase: 'NORMAL',
            windSpeed: 4.5,
            targetWind: 5.0,
            pwmDuty: 55.0,
            presetCode: 'OCEAN',
            styleCode: 'BALANCE',
            intensity: 70,
            variability: 50,
            gustFreq: 45,
            fanLimit: 90,
            minFan: 10,
            turbSigma: 0.5,
            turbLenScale: 40,
            thermalStrength: 2,
            thermalRadius: 18,
            gustActive: false,
            thermalActive: false,
            fanPowerEnabled: true
        },
        runtime: { runMode: 1, runSource: 2, lastScheduleNo: 10, lastUserProfileNo: -1 },
        chart: Array.from({ length: 20 }).map((_, i) => ({
            t: Date.now() - (20 - i) * 1000,
            wind: 3 + Math.random() * 3,
            targetWind: 5.0,
            pwm: 40 + Math.random() * 20,
            gust: 0,
            thermal: 0
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
                    if (k === 'system' && data.system) cache.system = data;
                    if (k === 'wifi' && data.wifi) cache.wifi = data;
                    if (k === 'motion' && data.motion) cache.motion = data;
                    if (k === 'schedules' && data.schedules) cache.schedules = data;
                    if (k === 'userProfiles' && data.userProfiles) cache.userProfiles = data;
                    if (k === 'windDict' && data.windDict) cache.windDict = data;
                }
            } catch (e) { console.error('[Offline] JSON parse error', f, e); }
        }));
    }
    
    function persistCache(key) {
        if (cache[key]) {
            try { localStorage.setItem('snw.offline.' + key, JSON.stringify(cache[key])); } catch (e) {}
        }
    }

    function ensureApi() {
        if (!SNW.Api) SNW.Api = { ApiError: class extends Error { constructor(status) { super('Error');
                    this.status = status; } } };
        const A = SNW.Api;
        
        // GET
        A.getState = async () => ({ control: runtime.control, sim: runtime.sim, runtime: runtime.runtime });
        A.getSim = async () => ({ sim: runtime.sim });
        A.getSimState = async () => ({ sim: runtime.sim, control: runtime.control });
        A.getSystem = async () => cache.system;
        A.getMotion = async () => cache.motion;
        A.listSchedules = async () => cache.schedules;
        A.listProfiles = async () => cache.userProfiles;
        A.listWindProfiles = async () => cache.windDict;
        A.getWifiConfig = async () => cache.wifi;
        A.getWifiState = async () => ({ wifi: { state: { mode: 2, mode_name: 'AP+STA (Offline)', status: 'CONNECTED', ssid: '(offline)', ip: '192.168.4.1', mac: 'AA:BB:CC:DD:EE:FF', rssi: -50, hostname: 'naturewind-offline', connected: false, timeSynced: false, reconnectAttempts: 0 } } });
        A.getLogs = async () => ({ logs: [{ ts: 0, lv: 3, msg: '[Offline] mode active' }] });
        A.diag = async () => ({ heap: 120000, fs_used: 160000, fs_total: 1000000 });
        A.version = async () => ({ fw: 'FW_Ver_2.0.2', control: 'CT10_Ctl_0202', config: 'C10_Config_0202', api: 'W10_Web_0202', simul: 'S10_Simul_0202' });
        A.checkFw = async () => ({ status: 'latest', current_version: 'FW_Ver_2.0.2', latest_version: 'FW_Ver_2.0.2' });
        A.getConfigDirty = async () => ({ system: false, wifi: false, motion: false, schedules: false, userProfiles: false, windDict: false, nvsSpec: false, webPage: false });
        A.getConfigAll = async () => (cache);
        A.getMetrics = async () => ({
            metrics: {
                active: true,
                runSource: 1,
                useProfileMode: false,
                overrideActive: false,
                overrideRemain: 0,
                simActive: true,
                simPhase: 'NORMAL',
                simWind: 4.5,
                autoOffTimerArmed: true,
                autoOffTimerMinutes: 180,
                stateCode: 3,
                reasonCode: 4,
                holdUntilMs: 0,
                holdRemainMs: 0
            }
        });
        A.getSummary = async () => ({
            summary: {
                state: 'SCHEDULE_RUN',
                reason: 'SCHEDULE_ACTIVE',
                schNo: 10,
                segNo: 0,
                phase: 'NORMAL',
                wind: 4.5,
                target: 5.0,
                pwmDuty: 55,
                override: false,
                useProfile: false
            }
        });
        
        // PUT/POST
        A.overrideFixed = async (percent) => {
            runtime.sim.active = true;
            runtime.control.active = true;
            runtime.control.state = 'OVERRIDE_HOLD';
            runtime.control.stateCode = 1;
            runtime.control.reason = 'MANUAL_OVERRIDE';
            runtime.control.reasonCode = 1;
            if (percent != null) {
                runtime.sim.intensity = percent;
            }
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, fsmState: 1, fsmReason: 1 });
            return { result: 'ok' };
        };
        A.overrideClear = async () => {
            runtime.sim.active = false;
            runtime.control.active = false;
            runtime.control.state = 'IDLE';
            runtime.control.stateCode = 0;
            runtime.control.reason = 'POWER_OFF';
            runtime.control.reasonCode = 0;
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, fsmState: 0, fsmReason: 0 });
            return { result: 'ok' };
        };
        function resolvePreset(presetCode, styleCode) {
            const presets = (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.presets) || [];
            const target = presets.find(p => p.code === presetCode);
            let intensity = target?.params?.windIntensity ?? 50;
            let variability = target?.params?.windVariability ?? 40;
            let gustFreq = target?.params?.gustFrequency ?? 30;

            const style = styleCode || runtime.sim.styleCode || 'BALANCE';
            if (style === 'REFRESH') {
                intensity = Math.min(100, Math.round(intensity * 1.1));
                variability = Math.min(100, variability + 15);
                gustFreq = Math.min(100, gustFreq + 15);
            } else if (style === 'WAVE') {
                variability = Math.min(100, variability + 20);
                gustFreq = Math.min(100, gustFreq + 10);
            } else if (style === 'SLEEP') {
                intensity = Math.min(intensity, 30);
                variability = 15;
                gustFreq = 5;
            }
            return { intensity, variability, gustFreq };
        }

        A.overridePreset = async (b) => {
            runtime.sim.active = true;
            runtime.control.active = true;
            if (b.presetCode) {
                runtime.sim.presetCode = b.presetCode;
                const r = resolvePreset(b.presetCode, b.styleCode || runtime.sim.styleCode);
                runtime.sim.intensity = r.intensity;
                runtime.sim.variability = r.variability;
                runtime.sim.gustFreq = r.gustFreq;
            }
            if (b.styleCode) runtime.sim.styleCode = b.styleCode;
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, lastUpdateMs: Date.now() });
            return { result: 'ok' };
        };
        A.overrideParams = async (b) => {
            if (b) {
                if (b.windIntensity != null) runtime.sim.intensity = b.windIntensity;
                if (b.windVariability != null) runtime.sim.variability = b.windVariability;
                if (b.gustFrequency != null) runtime.sim.gustFreq = b.gustFrequency;
            }
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, lastUpdateMs: Date.now() });
            return { result: 'ok', updated: true };
        };

        A.patchSim = async (p) => {
            if (p.presetCode || p.styleCode) {
                const code = p.presetCode || runtime.sim.presetCode || 'FOREST';
                const style = p.styleCode || runtime.sim.styleCode || 'BALANCE';
                const r = resolvePreset(code, style);
                runtime.sim.presetCode = code;
                runtime.sim.styleCode = style;
                runtime.sim.intensity = (p.intensity != null) ? p.intensity : r.intensity;
                runtime.sim.variability = (p.variability != null) ? p.variability : r.variability;
                runtime.sim.gustFreq = (p.gustFreq != null) ? p.gustFreq : r.gustFreq;
            }
            Object.assign(runtime.sim, p);
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, lastUpdateMs: Date.now() });
            return { updated: true };
        };

        A.patchMotion = async (b) => {
            if (b.motion) {
                if (b.motion.pir) Object.assign(cache.motion.motion.pir, b.motion.pir);
                if (b.motion.timing) Object.assign(cache.motion.motion.timing, b.motion.timing);
                if (b.motion.sim) Object.assign(cache.motion.motion.sim, b.motion.sim);
            }
            return { updated: true };
        };
        A.patchSystem = async (b) => {
            if (b.meta && cache.system) Object.assign(cache.system.meta, b.meta);
            if (b.hw && cache.system) Object.assign(cache.system.hw, b.hw);
            if (b.system && cache.system) {
                if (b.system.logging) Object.assign(cache.system.system.logging, b.system.logging);
                if (b.system.webSocket) {
                    if (b.system.webSocket.wsChConfig) cache.system.system.webSocket.wsChConfig = b.system.webSocket.wsChConfig;
                    if (b.system.webSocket.wsEtcConfig) Object.assign(cache.system.system.webSocket.wsEtcConfig, b.system.webSocket.wsEtcConfig);
                }
            }
            if (b.security && cache.system) Object.assign(cache.system.security, b.security);
            if (b.timeCfg && cache.system) Object.assign(cache.system.timeCfg, b.timeCfg);
            return { updated: true };
        };
        A.patchWifi = async (b) => {
            if (b.wifi && cache.wifi) {
                if (b.wifi.wifiMode !== undefined) cache.wifi.wifi.wifiMode = b.wifi.wifiMode;
                if (b.wifi.ap) cache.wifi.wifi.ap = b.wifi.ap;
                if (b.wifi.sta) cache.wifi.wifi.sta = b.wifi.sta;
            }
            return { updated: true };
        };
        A.saveConfig = async () => ({ result: 'saved' });
        A.reload = async () => ({ result: 'queued' });
        A.ackEvent = async () => { runtime.control.event.ackRequired = false; return { result: 'ok' }; };
        A.feedPir = async (fired) => { runtime.control.sensor.motionActive = !!fired; return { fed: true }; };
        A.selectProfile = async (id) => { runtime.control.profileMode = true;
            runtime.control.state = 'PROFILE_RUN';
            runtime.control.stateCode = 2;
            runtime.control.profile.profileNo = id;
            runtime.control.profile.name = (cache.userProfiles.userProfiles.profiles.find(p => p.profileNo === id) || {}).name || ''; return { result: 'ok' }; };
        A.stopProfile = async () => { runtime.control.state = 'IDLE';
            runtime.control.stateCode = 0;
            runtime.control.profile.profileNo = 0; return { result: 'ok' }; };
        A.scanWifi = async () => ({
            wifi: {
                scan: [
                    { ssid: "TestWiFi1", rssi: -45, enc: "WPA2", chan: 6, bssid: "AA:BB:CC:DD:EE:01" },
                    { ssid: "TestWiFi2", rssi: -70, enc: "OPEN", chan: 11, bssid: "AA:BB:CC:DD:EE:02" }
                ]
            }
        });
        A.setTime = async () => ({ updated: true });
        A.factoryReset = async () => ({ factory: true });
        A.gemini = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFile = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFirmware = async () => { throw new SNW.Api.ApiError(503); };
        
        // CRUD
        A.addSchedule = async (b) => {
            const list = cache.schedules.schedules || [];
            const id = list.length + 1;
            const newSch = Object.assign({
                schId: id,
                enabled: true,
                segCount: 1,
                period: { days: [1, 1, 1, 1, 1, 1, 1], startTime: "08:00", endTime: "20:00" },
                segments: [{
                    order: 1,
                    mode: 'PRESET',
                    presetCode: 'OCEAN',
                    style: 'BALANCE',
                    onMinutes: 30,
                    offMinutes: 0,
                    override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 }
                }],
                autoOff: {},
                motion: {}
            }, b.schedule || {});
            list.push(newSch);
            persistCache('schedules');
            return { result: 'created', id };
        };
        A.deleteSchedule = async (id) => { 
            cache.schedules.schedules = (cache.schedules.schedules || []).filter(s => s.schId !== id); 
            persistCache('schedules');
            return { deleted: true }; 
        };
        A.updateSchedule = async (id, b) => {
            const list = cache.schedules.schedules || [];
            const idx = list.findIndex(s => s.schId === id);
            if (idx >= 0) Object.assign(list[idx], b.schedule || {});
            persistCache('schedules');
            return { updated: true };
        };
        A.addProfile = async (b) => {
            const list = (cache.userProfiles && cache.userProfiles.userProfiles && cache.userProfiles.userProfiles.profiles) || [];
            const id = list.length + 1;
            const newProf = Object.assign({
                profileId: id,
                enabled: true,
                segCount: 1,
                segments: [{
                    order: 1,
                    mode: 'PRESET',
                    presetCode: 'OCEAN',
                    style: 'BALANCE',
                    onMinutes: 60,
                    offMinutes: 0,
                    override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 }
                }],
                autoOff: {},
                motion: {}
            }, b.profile || {});
            list.push(newProf);
            persistCache('userProfiles');
            return { result: 'created', id };
        };
        A.deleteProfile = async (id) => { 
            if (cache.userProfiles && cache.userProfiles.userProfiles && cache.userProfiles.userProfiles.profiles) {
                cache.userProfiles.userProfiles.profiles = cache.userProfiles.userProfiles.profiles.filter(p => p.profileId !== id); 
                persistCache('userProfiles');
            }
            return { deleted: true }; 
        };
        A.updateProfile = async (id, b) => {
            const list = (cache.userProfiles && cache.userProfiles.userProfiles && cache.userProfiles.userProfiles.profiles) || [];
            const idx = list.findIndex(p => p.profileId === id);
            if (idx >= 0) Object.assign(list[idx], b.profile || {});
            persistCache('userProfiles');
            return { updated: true };
        };
        A.addWindProfile = async (b) => {
            const list = (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.presets) || [];
            list.push(Object.assign({ idx: list.length }, b.preset || {}));
            persistCache('windDict');
            return { result: 'created', id: list.length - 1 };
        };
        A.deleteWindProfile = async (id) => { 
            if (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.presets) {
                cache.windDict.windDict.presets = cache.windDict.windDict.presets.filter((p, i) => i !== id); 
                persistCache('windDict');
            }
            return { deleted: true }; 
        };
        A.updateWindProfile = async (id, b) => {
            const list = (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.presets) || [];
            if (list[id]) Object.assign(list[id], b.preset || {});
            persistCache('windDict');
            return { updated: true };
        };
    }
    
    const wsSubscribers = {
        state: new Set(),
        chart: new Set(),
        metrics: new Set(),
        diag: new Set(),
        log: new Set()
    };

    function stubWs() {
        if (SNW.WsManager) {
            SNW.WsManager.initByLevel = () => {};
            SNW.WsManager.get = (ch) => {
                const subs = wsSubscribers[ch] || (wsSubscribers[ch] = new Set());
                return {
                    onMessage: (cb) => {
                        subs.add(cb);
                        return () => subs.delete(cb);
                    },
                    onOpen: (cb) => { if (typeof cb === 'function') setTimeout(cb, 0); return () => {}; },
                    onClose: () => () => {},
                    send: () => true
                };
            };
        }
    }
    
    function startSimulator() {
        if (window._snw_sim_timer) return;
        window._snw_sim_timer = setInterval(() => {
            if (!runtime.sim.active) return;
            const intensity = runtime.sim.intensity != null ? runtime.sim.intensity : 50;
            const variability = runtime.sim.variability != null ? runtime.sim.variability : 40;
            const baseSpeed = Math.max(0.4, intensity * 0.055);
            const varAmp = variability * 0.025;
            runtime.sim.targetWind = Number(baseSpeed.toFixed(1));
            runtime.sim.windSpeed = Math.max(0.2, Number((baseSpeed + (Math.random() - 0.5) * varAmp).toFixed(1)));
            runtime.sim.pwmDuty = Math.min(100, Math.max(15, Math.round(runtime.sim.windSpeed * 12 + 10)));
            runtime.control.sensor.tempC = Number((24 + Math.sin(Date.now() / 60000) * 1.5).toFixed(1));
            runtime.control.sensor.humidity = Math.round(55 + Math.cos(Date.now() / 90000) * 5);
            runtime.control.sensor.motionActive = (Math.floor(Date.now() / 20000) % 2) === 0;
            
            const chartPoint = {
                t: Date.now(),
                wind: runtime.sim.windSpeed,
                targetWind: runtime.sim.targetWind,
                pwm: runtime.sim.pwmDuty,
                gust: 0,
                thermal: 0
            };
            runtime.chart.push(chartPoint);
            if (runtime.chart.length > 120) runtime.chart.shift();
            
            // WS 에뮬레이션 브로드캐스트
            if (wsSubscribers.chart) {
                wsSubscribers.chart.forEach(fn => { try { fn(chartPoint); } catch (e) {} });
            }
            if (wsSubscribers.state) {
                const stateData = { control: runtime.control, sim: runtime.sim, runtime: runtime.runtime };
                wsSubscribers.state.forEach(fn => { try { fn(stateData); } catch (e) {} });
            }
            
            if (SNW.Store) {
                SNW.Store.set({
                    control: runtime.control,
                    sim: runtime.sim,
                    connection: 'online',
                    lastUpdateMs: Date.now()
                });
            }
        }, 1000);
    }
    
    function exportBackup() {
        const backupData = {
            version: '2.0.2',
            exportedAt: new Date().toISOString(),
            cache: cache
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snw_offline_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return backupData;
    }

    function importBackup(jsonString) {
        try {
            const data = (typeof jsonString === 'string') ? JSON.parse(jsonString) : jsonString;
            if (data && data.cache) {
                for (const [k, v] of Object.entries(data.cache)) {
                    cache[k] = v;
                    persistCache(k);
                }
                alert('오프라인 설정이 성공적으로 복원되었습니다.');
                location.reload();
                return true;
            }
        } catch (e) {
            console.error('Import failed', e);
            alert('유효하지 않은 백업 형식입니다: ' + e.message);
        }
        return false;
    }

    function applyScenario(type) {
        if (type === 'SLEEP') {
            runtime.sim.presetCode = 'SLEEP';
            runtime.sim.styleCode = 'SLEEP';
            runtime.sim.intensity = 30;
            runtime.sim.variability = 15;
            runtime.sim.gustFreq = 0;
            runtime.control.active = true;
            runtime.control.stateCode = 3;
            runtime.control.sensor.motionActive = true;
        } else if (type === 'GALE') {
            runtime.sim.presetCode = 'OCEAN';
            runtime.sim.styleCode = 'REFRESH';
            runtime.sim.intensity = 85;
            runtime.sim.variability = 70;
            runtime.sim.gustFreq = 75;
            runtime.control.active = true;
            runtime.control.stateCode = 3;
            runtime.control.sensor.motionActive = true;
        } else if (type === 'PIR_BLOCK') {
            runtime.control.sensor.motionActive = false;
            runtime.control.state = 'MOTION_BLOCKED';
            runtime.control.stateCode = 4;
            runtime.control.reason = 'MOTION_TIMEOUT';
            runtime.control.reasonCode = 2;
        } else if (type === 'AUTOOFF') {
            runtime.control.active = false;
            runtime.control.state = 'AUTOOFF_STOPPED';
            runtime.control.stateCode = 5;
            runtime.control.reason = 'AUTOOFF_TIMER';
            runtime.control.reasonCode = 3;
        } else { // NATURAL
            runtime.sim.presetCode = 'FOREST';
            runtime.sim.styleCode = 'BALANCE';
            runtime.sim.intensity = 55;
            runtime.sim.variability = 40;
            runtime.sim.gustFreq = 30;
            runtime.control.active = true;
            runtime.control.stateCode = 3;
            runtime.control.state = 'SCHEDULE_RUN';
            runtime.control.sensor.motionActive = true;
        }
        if (SNW.Store) {
            SNW.Store.set({
                control: runtime.control,
                sim: runtime.sim,
                fsmState: runtime.control.stateCode,
                fsmReason: runtime.control.reasonCode,
                lastUpdateMs: Date.now()
            });
        }
    }

    function renderOfflineToolbar() {
        if (document.getElementById('snw-offline-toolbar')) return;
        const bar = document.createElement('div');
        bar.id = 'snw-offline-toolbar';
        bar.className = 'snw-offline-toolbar';
        bar.style.cssText = `
            background: #151b23; color: #e6edf3; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border-bottom: 1px solid #30363d; z-index: 900; position: relative; width: 100%; transition: all 0.2s ease;
        `;

        const isMobile = (window.innerWidth <= 767);
        let isCollapsed = isMobile || (localStorage.getItem('snw.offline.toolbar_collapsed') === '1');

        function updateLayout() {
            if (isCollapsed) {
                bar.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:3px 12px; height:24px; cursor:pointer;" id="snw-toolbar-toggle-area">
                        <span style="display:inline-flex; align-items:center; gap:6px;">
                            <span style="background:#238636; color:#fff; padding:1px 6px; border-radius:10px; font-weight:bold; font-size:10px;">🌿 OFFLINE DEMO</span>
                            <span style="color:#8b949e; font-size:10px;">가상 모드 (클릭하여 펼치기)</span>
                        </span>
                        <button id="btn-toggle-toolbar" style="background:transparent; color:#58a6ff; border:none; cursor:pointer; font-size:10px; padding:0 4px;">펼치기 ▼</button>
                    </div>
                `;
                bar.querySelector('#snw-toolbar-toggle-area').onclick = () => {
                    isCollapsed = false;
                    localStorage.setItem('snw.offline.toolbar_collapsed', '0');
                    updateLayout();
                };
            } else {
                bar.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; padding:6px 12px;">
                        <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                            <span style="background:#238636; color:#fff; padding:2px 6px; border-radius:10px; font-weight:bold; font-size:10px;">🌿 OFFLINE</span>
                            <label style="color:#8b949e; font-size:11px;">시나리오:
                                <select id="snw-offline-scenario" style="background:#21262d; color:#e6edf3; border:1px solid #30363d; border-radius:4px; padding:2px 4px; font-size:11px; margin-left:3px;">
                                    <option value="NATURAL">자연 산들바람 (기본)</option>
                                    <option value="SLEEP">취침/수면풍 (약풍 30%)</option>
                                    <option value="GALE">바닷바람/돌풍 (강풍 85%)</option>
                                    <option value="PIR_BLOCK">모션 감지 차단 (PIR=OFF)</option>
                                    <option value="AUTOOFF">자동 종료 래치 (AutoOff)</option>
                                </select>
                            </label>
                        </div>
                        <div style="display:flex; align-items:center; gap:4px;">
                            <button id="btn-offline-export" style="background:#21262d; color:#58a6ff; border:1px solid #30363d; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:10px;">📥 백업</button>
                            <button id="btn-offline-import" style="background:#21262d; color:#58a6ff; border:1px solid #30363d; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:10px;">📤 복원</button>
                            <button id="btn-offline-reset" style="background:#21262d; color:#f85149; border:1px solid #30363d; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:10px;">🔄 리셋</button>
                            <button id="btn-collapse-toolbar" style="background:transparent; color:#8b949e; border:none; cursor:pointer; font-size:10px; padding:0 4px; margin-left:4px;" title="접기">접기 ▲</button>
                            <input type="file" id="offline-import-file" accept=".json" style="display:none;" />
                        </div>
                    </div>
                `;
                bar.querySelector('#snw-offline-scenario').onchange = (e) => applyScenario(e.target.value);
                bar.querySelector('#btn-offline-export').onclick = () => exportBackup();
                const fileInput = bar.querySelector('#offline-import-file');
                bar.querySelector('#btn-offline-import').onclick = () => fileInput.click();
                fileInput.onchange = (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => importBackup(ev.target.result);
                    reader.readAsText(file, 'utf-8');
                };
                bar.querySelector('#btn-offline-reset').onclick = () => {
                    if (confirm('오프라인 로컬 저장소를 모두 초기화하시겠습니까?')) {
                        Object.keys(localStorage).forEach(k => {
                            if (k.startsWith('snw.offline.')) localStorage.removeItem(k);
                        });
                        location.reload();
                    }
                };
                bar.querySelector('#btn-collapse-toolbar').onclick = () => {
                    isCollapsed = true;
                    localStorage.setItem('snw.offline.toolbar_collapsed', '1');
                    updateLayout();
                };
            }
        }

        updateLayout();
        const app = document.getElementById('app') || document.body;
        app.insertBefore(bar, app.firstChild);

        // 모바일 하단 탭 바(60px)와 본문 겹침 방지 여백 보장
        if (isMobile) {
            const main = document.getElementById('snw-main');
            if (main) main.style.paddingBottom = '80px';
        }
    }

    SNW.Offline = Object.assign(SNW.Offline || {}, {
        ready: null,
        _cache: cache,
        _runtime: runtime,
        isReady: () => true,
        ensureApi,
        stubWs,
        persistCache,
        exportBackup,
        importBackup,
        applyScenario
    });
    
    SNW.Offline.ready = (async () => {
        ensureApi();
        await loadAll();
        stubWs();
        startSimulator();
        
        let waitCount = 0;
        while (!SNW.LevelUtil && waitCount < 40) {
            await new Promise(r => setTimeout(r, 50));
            waitCount++;
        }
        if (SNW.LevelUtil) {
            SNW.LevelUtil.current = () => 'L4';
            SNW.LevelUtil.atLeast = () => true;
        }
        console.log('[Offline] 준비 완료 - 모든 필드 반환');
    })();

    // 브라우저 DOM 준비 완료 시 번들 덮어쓰기 방어 및 L4 고정, 툴바 렌더링
    if (typeof window !== 'undefined') {
        try { localStorage.setItem('snw.level', 'L4'); } catch (e) {}
        window.addEventListener('DOMContentLoaded', () => {
            ensureApi();
            stubWs();
            if (SNW.LevelUtil) {
                SNW.LevelUtil.current = () => 'L4';
                SNW.LevelUtil.atLeast = () => true;
            }
            renderOfflineToolbar();
        });
    }
})(window.SNW);