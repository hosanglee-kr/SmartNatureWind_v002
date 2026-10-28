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
    
    const cache = {
        system: {
            meta: { deviceName: "SmartNatureWind", version: "FW_2.0.2" },
            system: {
                logging: { level: "INFO", maxEntries: 300 },
                webSocket: {
                    wsChConfig: [
                        { chIdx: 0, chName: 'state', chIntervalMs: 800, priority: 0 },
                        { chIdx: 1, chName: 'metrics', chIntervalMs: 1500, priority: 1 },
                        { chIdx: 2, chName: 'chart', chIntervalMs: 1200, priority: 2 },
                        { chIdx: 3, chName: 'summary', chIntervalMs: 1500, priority: 3 }
                    ],
                    wsEtcConfig: { chartLargeBytes: 3500, chartThrottleMul: 2, wsCleanupMs: 10000 }
                }
            },
            security: { apiKey: "", geminiApiKey: "" },
            timeCfg: { ntpServer: "pool.ntp.org", timezone: "Asia/Seoul", syncIntervalMin: 60 },
            hw: {
                fanPwm: { pin: 6, channel: 0, freq: 25000, res: 10 },
                fanConfig: { startPercentMin: 18, comfortPercentMin: 22, comfortPercentMax: 65, hardPercentMax: 90 },
                pir: { enabled: true, pin: 13, debounceSec: 5, holdSec: 120 },
                tempHum: { enabled: true, type: "DHT22", pin: 17, intervalSec: 30 },
                led: { pin: 48, numPixels: 1, defaultBrightness: 20 }
            }
        },
        wifi: {
            wifi: {
                wifiMode: 2,
                ap: { ssid: "NatureWind", pass: "2540" },
                sta: [
                    { ssid: "HomeWiFi_5G", pass: "12345678" },
                    { ssid: "Office_AP", pass: "admin1234" }
                ]
            }
        },
        motion: {
            motion: {
                pir: { enabled: true, holdSec: 120 },
                timing: { simIntervalMs: 500, gustIntervalMs: 2000, thermalIntervalMs: 3000 },
                sim: { presetCode: 'OCEAN', styleCode: 'BALANCE', fanPowerEnabled: true, intensity: 70, variability: 50, gustFreq: 45, fanLimit: 90, minFan: 10, turbSigma: 0.5, turbLenScale: 40, thermalStrength: 2, thermalRadius: 18 }
            }
        },
        nvsSpec: null,
        schedules: {
            schedules: [
            {
                schId: 1,
                schNo: 10,
                name: "아침 바람 (Morning Breeze)",
                enabled: true,
                segCount: 2,
                period: { days: [1, 1, 1, 1, 1, 0, 0], startTime: "08:00", endTime: "12:00" },
                segments: [
                    { order: 1, mode: 'PRESET', presetCode: 'COUNTRY_BREEZE', style: 'BALANCE', onMinutes: 20, offMinutes: 10, override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 } },
                    { order: 2, mode: 'FIXED', speed: 50, onMinutes: 15, offMinutes: 5, override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 } }
                ],
                autoOff: { timer: { enabled: true, minutes: 180 }, offTime: { enabled: false, time: '00:00' }, offTemp: { enabled: false, temp: 0 } },
                motion: { pir: { enabled: true, holdSec: 120 } }
            },
            {
                schId: 2,
                schNo: 20,
                name: "저녁 휴식 (Evening Relax)",
                enabled: false,
                segCount: 1,
                period: { days: [1, 1, 1, 1, 1, 1, 1], startTime: "19:00", endTime: "22:00" },
                segments: [
                    { order: 1, mode: 'PRESET', presetCode: 'OCEAN', style: 'RELAX', onMinutes: 30, offMinutes: 10, override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 } }
                ],
                autoOff: { timer: { enabled: false, minutes: 0 }, offTime: { enabled: true, time: '22:00' }, offTemp: { enabled: false, temp: 0 } },
                motion: { pir: { enabled: false, holdSec: 0 } }
            }]
        },
        userProfiles: {
            userProfiles: {
                profiles: [
                {
                    profileId: 1,
                    profileNo: 10,
                    name: "수면 모드 (Sleep Care)",
                    enabled: true,
                    segCount: 2,
                    segments: [
                        { order: 1, mode: 'PRESET', presetCode: 'FOREST_CANOPY', style: 'SLEEP', onMinutes: 40, offMinutes: 0, override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 } },
                        { order: 2, mode: 'PRESET', presetCode: 'DESERT_NIGHT', style: 'SLEEP', onMinutes: 120, offMinutes: 0, override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 } }
                    ],
                    autoOff: { timer: { enabled: true, minutes: 240 }, offTime: { enabled: true, time: "05:00" }, offTemp: { enabled: true, temp: 26.0 } },
                    motion: { pir: { enabled: false, holdSec: 0 } }
                },
                {
                    profileId: 2,
                    profileNo: 20,
                    name: "집중 모드 (Focus Care)",
                    enabled: true,
                    segCount: 1,
                    segments: [
                        { order: 1, mode: 'PRESET', presetCode: 'COUNTRY_BREEZE', style: 'FOCUS', onMinutes: 60, offMinutes: 0, override: { enabled: false, windIntensity: -1.0, windVariability: -1.0, gustFrequency: -1.0 } }
                    ],
                    autoOff: { timer: { enabled: true, minutes: 180 }, offTime: { enabled: false, time: '00:00' }, offTemp: { enabled: false, temp: 0 } },
                    motion: { pir: { enabled: true, holdSec: 300 } }
                }]
            }
        },
        windDict: {
            windDict: {
                presets: [
                    { idx: 0, code: "OCEAN", name: "Ocean Breeze", factors: { windIntensity: 70, gustFrequency: 50, windVariability: 55, fanLimit: 95, minFan: 12, turbulenceLengthScale: 42, turbulenceIntensitySigma: 0.55, thermalBubbleStrength: 2.2, thermalBubbleRadius: 20, baseMinWind: 1.8, baseMaxWind: 5.5 } },
                    { idx: 1, code: "COUNTRY_BREEZE", name: "Country Breeze", factors: { windIntensity: 55, gustFrequency: 30, windVariability: 40, fanLimit: 90, minFan: 10, turbulenceLengthScale: 38, turbulenceIntensitySigma: 0.4, thermalBubbleStrength: 1.8, thermalBubbleRadius: 16, baseMinWind: 0.7, baseMaxWind: 3.4 } },
                    { idx: 2, code: "MEDITERRANEAN", name: "Mediterranean", factors: { windIntensity: 65, gustFrequency: 38, windVariability: 50, fanLimit: 92, minFan: 10, turbulenceLengthScale: 35, turbulenceIntensitySigma: 0.48, thermalBubbleStrength: 1.9, thermalBubbleRadius: 18, baseMinWind: 1.6, baseMaxWind: 3.8 } },
                    { idx: 3, code: "MOUNTAIN", name: "Mountain", factors: { windIntensity: 80, gustFrequency: 55, windVariability: 65, fanLimit: 96, minFan: 14, turbulenceLengthScale: 45, turbulenceIntensitySigma: 0.65, thermalBubbleStrength: 2.5, thermalBubbleRadius: 20, baseMinWind: 2.2, baseMaxWind: 7.5 } },
                    { idx: 4, code: "PLAINS", name: "Plains", factors: { windIntensity: 85, gustFrequency: 70, windVariability: 75, fanLimit: 100, minFan: 20, turbulenceLengthScale: 50, turbulenceIntensitySigma: 0.75, thermalBubbleStrength: 2.8, thermalBubbleRadius: 22, baseMinWind: 2.5, baseMaxWind: 8.5 } },
                    { idx: 5, code: "HARBOR_BREEZE", name: "Harbor Breeze", factors: { windIntensity: 60, gustFrequency: 45, windVariability: 45, fanLimit: 90, minFan: 12, turbulenceLengthScale: 36, turbulenceIntensitySigma: 0.45, thermalBubbleStrength: 1.7, thermalBubbleRadius: 15, baseMinWind: 1.2, baseMaxWind: 4.2 } },
                    { idx: 6, code: "FOREST_CANOPY", name: "Forest Canopy", factors: { windIntensity: 50, gustFrequency: 25, windVariability: 35, fanLimit: 88, minFan: 8, turbulenceLengthScale: 32, turbulenceIntensitySigma: 0.35, thermalBubbleStrength: 1.5, thermalBubbleRadius: 12, baseMinWind: 0.5, baseMaxWind: 2.8 } },
                    { idx: 7, code: "URBAN_SUNSET", name: "Urban Sunset", factors: { windIntensity: 40, gustFrequency: 20, windVariability: 25, fanLimit: 85, minFan: 8, turbulenceLengthScale: 28, turbulenceIntensitySigma: 0.3, thermalBubbleStrength: 1.3, thermalBubbleRadius: 10, baseMinWind: 0.4, baseMaxWind: 2.2 } },
                    { idx: 8, code: "TROPICAL_RAIN", name: "Tropical Rain", factors: { windIntensity: 90, gustFrequency: 85, windVariability: 85, fanLimit: 100, minFan: 22, turbulenceLengthScale: 55, turbulenceIntensitySigma: 0.85, thermalBubbleStrength: 3.2, thermalBubbleRadius: 25, baseMinWind: 2.8, baseMaxWind: 9.5 } },
                    { idx: 9, code: "DESERT_NIGHT", name: "Desert Night", factors: { windIntensity: 45, gustFrequency: 20, windVariability: 30, fanLimit: 85, minFan: 8, turbulenceLengthScale: 30, turbulenceIntensitySigma: 0.3, thermalBubbleStrength: 1.2, thermalBubbleRadius: 10, baseMinWind: 0.9, baseMaxWind: 3.1 } }
                ],
                styles: [
                    { idx: 0, code: "BALANCE", name: "Balance", factors: { intensityFactor: 1, variabilityFactor: 1, gustFactor: 1, thermalFactor: 1 } },
                    { idx: 1, code: "ACTIVE", name: "Active", factors: { intensityFactor: 1.25, variabilityFactor: 1.2, gustFactor: 1.3, thermalFactor: 1.1 } },
                    { idx: 2, code: "FOCUS", name: "Focus", factors: { intensityFactor: 1.05, variabilityFactor: 0.8, gustFactor: 0.85, thermalFactor: 0.9 } },
                    { idx: 3, code: "RELAX", name: "Relax", factors: { intensityFactor: 0.8, variabilityFactor: 0.85, gustFactor: 0.7, thermalFactor: 1.1 } },
                    { idx: 4, code: "SLEEP", name: "Sleep", factors: { intensityFactor: 0.65, variabilityFactor: 0.6, gustFactor: 0.4, thermalFactor: 0.9 } }
                ]
            }
        },
        webPage: null
    };
    
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
            if (percent != null) {
                runtime.sim.intensity = percent;
            }
            return { result: 'ok' };
        };
        A.overrideClear = async () => {
            runtime.sim.active = false;
            runtime.control.active = false;
            return { result: 'ok' };
        };
        A.overridePreset = async (b) => {
            runtime.sim.presetCode = b.presetCode;
            runtime.sim.active = true;
            return { result: 'ok' };
        };
        A.overrideParams = async (b) => {
            if (b) {
                if (b.windIntensity != null) runtime.sim.intensity = b.windIntensity;
                if (b.windVariability != null) runtime.sim.variability = b.windVariability;
                if (b.gustFrequency != null) runtime.sim.gustFreq = b.gustFrequency;
            }
            return { result: 'ok', updated: true };
        };

        A.patchSim = async (p) => {
            if (p.styleCode) {
                runtime.sim.styleCode = p.styleCode;
                if (p.styleCode === 'SLEEP') {
                    runtime.sim.intensity = 35;
                    runtime.sim.variability = 20;
                    runtime.sim.gustFreq = 10;
                }
            }
            Object.assign(runtime.sim, p);
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
            return { result: 'created', id };
        };
        A.deleteSchedule = async (id) => { cache.schedules.schedules = cache.schedules.schedules.filter(s => s.schId !== id); return { deleted: true }; };
        A.updateSchedule = async (id, b) => {
            const idx = cache.schedules.schedules.findIndex(s => s.schId === id);
            if (idx >= 0) Object.assign(cache.schedules.schedules[idx], b.schedule || {});
            return { updated: true };
        };
        A.addProfile = async (b) => {
            const list = cache.userProfiles.userProfiles.profiles || [];
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
            return { result: 'created', id };
        };
        A.deleteProfile = async (id) => { cache.userProfiles.userProfiles.profiles = cache.userProfiles.userProfiles.profiles.filter(p => p.profileId !== id); return { deleted: true }; };
        A.updateProfile = async (id, b) => {
            const list = cache.userProfiles.userProfiles.profiles;
            const idx = list.findIndex(p => p.profileId === id);
            if (idx >= 0) Object.assign(list[idx], b.profile || {});
            return { updated: true };
        };
        A.addWindProfile = async (b) => {
            const list = cache.windDict.windDict.presets || [];
            list.push(Object.assign({ idx: list.length }, b.preset || {}));
            return { result: 'created', id: list.length - 1 };
        };
        A.deleteWindProfile = async (id) => { cache.windDict.windDict.presets = cache.windDict.windDict.presets.filter((p, i) => i !== id); return { deleted: true }; };
        A.updateWindProfile = async (id, b) => {
            const list = cache.windDict.windDict.presets;
            if (list[id]) Object.assign(list[id], b.preset || {});
            return { updated: true };
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
            runtime.chart.push({ t: Date.now(), wind: runtime.sim.windSpeed, targetWind: runtime.sim.targetWind, pwm: runtime.sim.pwmDuty, gust: 0, thermal: 0 });
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
        while (!SNW.LevelUtil && waitCount < 40) { await new Promise(r => setTimeout(r, 50));
            waitCount++; }
        if (SNW.LevelUtil) {
            SNW.LevelUtil.current = () => 'L4';
            SNW.LevelUtil.atLeast = (lvl) => true;
        }
        console.log('[Offline] 준비 완료 - 모든 필드 반환');
    })();
})(window.SNW);