/* ---- 998.offline_0203.js ---- */
window.SNW = window.SNW || {};
(function (SNW) {
    'use strict';
    if (!window.SNW_OFFLINE) return;

    let WORKING_JSON_BASE = null;
    const JSON_BASE_CANDIDATES = ['../json/', '/json/', '../../json/', './json/', '/src/v0203/data_v0203_src/json/'];
    const FILE_MAP = {
        system: 'cfg_system_0203.json',
        wifi: 'cfg_wifi_0203.json',
        motion: 'cfg_motion_0203.json',
        nvsSpec: 'cfg_nvsSpec_0203.json',
        schedules: 'cfg_schedules_0203.json',
        userProfiles: 'cfg_userProfile_0203.json',
        windDict: 'cfg_windDict_0203.json',
        webPage: 'cfg_pages_0203.json'
    };

    // 기본 캐시 데이터: 998.offline_data_0203.js에서 로드된 SNW.OFFLINE_DEFAULT_CACHE 참조
    const DEFAULT_CACHE = (SNW && SNW.OFFLINE_DEFAULT_CACHE) || {};

    // 캐시 객체 초기화: LocalStorage에 사용자가 수정한 내용이 있으면 우선 로드, 없으면 DEFAULT_CACHE 사용
    const cache = {};
    for (const [key, defaultVal] of Object.entries(DEFAULT_CACHE)) {
        const saved = localStorage.getItem('snw.offline.' + key);
        if (saved) {
            try { cache[key] = JSON.parse(saved); continue; } catch (e) { }
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
            pauseReason: 0,
            triggerRt: {},
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
            lastReloadOk: true,
            session: {
                active: true,
                type: 1,
                typeName: 'PLAYLIST',
                trigger: 1,
                state: 'ACTIVE',                                   // [6.3 N-13]
                profileId: 1,
                profileNo: 1,
                profileName: '숙면 자연풍 (오프라인)',
                currentStep: 1,
                totalSteps: 3,
                stepRemainSec: 540,
                currentStepStartMs: Date.now(),                 // [6.4 신규]
                currentStepDurationMs: 540000,                     // [6.4 신규]
                loopCount: 0,
                pausedAccumMs: 0
            }
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
            } catch (e) { }
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
            try { localStorage.setItem('snw.offline.' + key, JSON.stringify(cache[key])); } catch (e) { }
        }
    }

    function ensureApi() {
        if (!SNW.Api) SNW.Api = {
            ApiError: class extends Error {
                constructor(status) {
                    super('Error');
                    this.status = status;
                }
            }
        };
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
        A.version = async () => ({ fw: 'FW_Ver_2.0.3', control: 'CT10_Ctl_0203', config: 'C10_Config_0203', api: 'W10_Web_0203', simul: 'S10_Simul_0203' });
        A.checkFw = async () => ({ status: 'latest', current_version: 'FW_Ver_2.0.3', latest_version: 'FW_Ver_2.0.3' });
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
            runtime.control.state = 'OVERRIDE';
            runtime.control.stateCode = 1;
            runtime.control.reason = 'OVERRIDE_ACTIVE';
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
            runtime.control.reason = 'NONE';
            runtime.control.reasonCode = 0;
            if (SNW.Store) SNW.Store.set({ control: runtime.control, sim: runtime.sim, fsmState: 0, fsmReason: 0 });
            return { result: 'ok' };
        };
        // ======================================================
        // [Phase6 6.1 N-12] resolvePreset 재작성
        //  - 이전: target.params.* (C++/JSON 모두 factors 사용 → 항상 undefined)
        //  - 이후: target.factors.* + 스타일 factors 곱연산 (S20 미러)
        //  - REFRESH/WAVE는 실존하지 않는 스타일 → ACTIVE/RELAX로 매핑
        // ======================================================
        function resolvePreset(presetCode, styleCode) {
            const presets = (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.presets) || [];
            const styles = (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.styles) || [];

            const target = presets.find(p => p.code === presetCode);
            const pf = target?.factors || {};

            let intensity = pf.windIntensity ?? 50;
            let variability = pf.windVariability ?? 40;
            let gustFreq = pf.gustFrequency ?? 30;

            // [S20 미러] 스타일 factor 적용 (곱연산)
            const sf = (styles.find(s => s.code === styleCode)?.factors) || {
                intensityFactor: 1, variabilityFactor: 1, gustFactor: 1,
            };
            intensity = Math.max(0, Math.min(100, Math.round(intensity * (sf.intensityFactor ?? 1))));
            variability = Math.max(0, Math.min(100, Math.round(variability * (sf.variabilityFactor ?? 1))));
            gustFreq = Math.max(0, Math.min(100, Math.round(gustFreq * (sf.gustFactor ?? 1))));

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
        // ======================================================
        // [N-3] Deprecated: 온라인 patchSim과 동일 시맨틱으로 통일
        // ======================================================
        A.overrideParams = async (b) => {
            const ovr = { enabled: true };
            if (b && b.windIntensity != null) ovr.windIntensity = b.windIntensity;
            if (b && b.windVariability != null) ovr.windVariability = b.windVariability;
            if (b && b.gustFrequency != null) ovr.gustFrequency = b.gustFrequency;
            return A.patchSim({ override: ovr });
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
        A.selectProfile = async (id) => {
            runtime.control.profileMode = true;
            runtime.control.state = 'PROFILE_RUN';
            runtime.control.stateCode = 2;
            runtime.control.profile.profileNo = id;
            runtime.control.profile.name = (cache.userProfiles.userProfiles.profiles.find(p => p.profileNo === id) || {}).name || ''; return { result: 'ok' };
        };
        A.stopProfile = async () => {
            runtime.control.state = 'IDLE';
            runtime.control.stateCode = 0;
            runtime.control.profile.profileNo = 0; return { result: 'ok' };
        };

        // Session (Stage 3 신규)
        // ======================================================
        // [Phase6 6.3 N-13] sessionStart 재작성
        //  - state: 'RUNNING' → 'ACTIVE' (C++ 스펙)
        //  - physics 반영: intensity/variability/gustFreq
        //  - PLAYLIST: profile 조회 → profileName/steps/stepDuration 설정
        //  - PRESET: resolvePreset → sim 반영
        //  - FIXED: percent → intensity 반영
        //  - sim.active = true (stopSession 이후 복귀 대응)
        // ======================================================
        A.startSession = async (optsOrType, payloadArg, triggerArg) => {
            let type, payload, trigger;
            if (typeof optsOrType === 'object' && optsOrType !== null) {
                type = optsOrType.type;
                payload = optsOrType.payload || {};
                trigger = optsOrType.trigger;
            } else {
                type = optsOrType;
                payload = payloadArg || {};
                trigger = triggerArg;
            }
            if (!trigger) {
                if (type === 'AUTO_FULL')        trigger = 'MANUAL_AUTO_FULL';
                else if (type === 'AUTO_SELECT') trigger = 'MANUAL_AUTO_SELECT';
                else                             trigger = 'MANUAL';
            }

            const isPlaylist = (type === 'PLAYLIST' || type === 1);
            const isPreset = (type === 'PRESET' || type === 2);
            const isFixed = (type === 'FIXED' || type === 3);
            const isAutoFull = (type === 'AUTO_FULL' || type === 4);
            const isAutoSelect = (type === 'AUTO_SELECT' || type === 5);
            const now = Date.now();

            // ─────────── ① physics 반영 ───────────
            runtime.sim.active = true;
            runtime.control.active = true;

            if (isPreset) {
                const pc = (payload && payload.presetCode) || 'OCEAN';
                const sc = (payload && payload.styleCode) || 'BALANCE';
                const r = resolvePreset(pc, sc);
                runtime.sim.presetCode = pc;
                runtime.sim.styleCode = sc;
                runtime.sim.intensity = r.intensity;
                runtime.sim.variability = r.variability;
                runtime.sim.gustFreq = r.gustFreq;
            } else if (isFixed) {
                const pct = (payload && payload.percent) || 50;
                runtime.sim.intensity = Math.max(0, Math.min(100, pct));
                runtime.sim.variability = 0;
                runtime.sim.gustFreq = 0;
            } else if (isAutoFull) {
                runtime.sim.presetCode = 'FOREST_CANOPY';
                runtime.sim.styleCode = 'BALANCE';
                const r = resolvePreset('FOREST_CANOPY', 'BALANCE');
                runtime.sim.intensity = r.intensity;
                runtime.sim.variability = r.variability;
                runtime.sim.gustFreq = r.gustFreq;
            } else if (isAutoSelect) {
                if (payload.baseType === 'PRESET') {
                    const pc = payload.presetCode || 'OCEAN';
                    runtime.sim.presetCode = pc;
                    runtime.sim.styleCode = 'BALANCE';
                    const r = resolvePreset(pc, 'BALANCE');
                    runtime.sim.intensity = r.intensity;
                    runtime.sim.variability = r.variability;
                    runtime.sim.gustFreq = r.gustFreq;
                }
            }

            // ─────────── ② 세션 컨텍스트 ───────────
            let profileId = 0;
            let profileNo = 0;
            let profileName = '';
            let totalSteps = 1;
            let stepDurationMs = 20 * 60000;   // 기본 20분

            if (isPlaylist && payload && payload.profileId) {
                profileId = payload.profileId;
                const profiles = (cache.userProfiles?.userProfiles?.profiles) || [];
                const profile = profiles.find(p => p.profileId === profileId);
                if (profile) {
                    profileNo = profile.profileNo || profileId;
                    profileName = profile.name || '';
                    const steps = profile.steps || profile.segments || [];
                    totalSteps = steps.length || 1;
                    if (steps.length > 0) {
                        const s0 = steps[0];
                        const durMin = s0.durationMin
                            ?? ((s0.onMinutes || 20) + (s0.offMinutes || 0));
                        stepDurationMs = (durMin || 20) * 60000;
                    }
                }
            }

            let sessionTypeNum = 1;
            if (isPlaylist) sessionTypeNum = 1;
            else if (isPreset) sessionTypeNum = 2;
            else if (isFixed) sessionTypeNum = 3;
            else if (isAutoFull) sessionTypeNum = 4;
            else if (isAutoSelect) sessionTypeNum = 5;

            runtime.control.session = {
                active: true,
                type: sessionTypeNum,
                typeName: isPlaylist ? 'PLAYLIST' : (isPreset ? 'PRESET' : (isFixed ? 'FIXED' : (isAutoFull ? 'AUTO_FULL' : 'AUTO_SELECT'))),
                trigger: trigger.startsWith('SCHEDULE') ? 2 : 1,
                triggerName: trigger,
                state: 'ACTIVE',                                    // [6.3 N-13]
                profileId, profileNo, profileName,
                presetCode: (payload && payload.presetCode) || (isAutoFull ? 'FOREST_CANOPY' : 'OCEAN'),
                styleCode: (payload && payload.styleCode) || 'BALANCE',
                percent: (payload && payload.percent) || 50,
                currentStep: 1,
                totalSteps,
                stepRemainSec: Math.floor(stepDurationMs / 1000),
                currentStepStartMs: now,                             // [6.3 신규]
                currentStepDurationMs: stepDurationMs,                 // [6.3 신규]
                loopCount: 0,
                pausedAccumMs: 0,
                rule: payload.rule || {},
            };

            if (SNW.Store) {
                SNW.Store.set({
                    control: runtime.control,
                    sim: runtime.sim,
                    session: runtime.control.session,
                    lastUpdateMs: now,
                });
            }

            return { ok: true, result: 'session_started' };
        };
        A.sessionStart = A.startSession;
        A.patchSessionRule = async (rule) => {
            if (runtime.control.session) {
                runtime.control.session.rule = rule;
            }
            return { ok: true, result: 'rule_patched' };
        };
        A.startPlaylist = async (profileId) => A.startSession({ type: 'PLAYLIST', payload: { profileId } });
        A.startPreset = async (p, s) => A.startSession({ type: 'PRESET', payload: { presetCode: p, styleCode: s } });
        A.startFixed = async (percent) => A.startSession({ type: 'FIXED', payload: { percent } });

        // ======================================================
        // [Phase6 6.3b] pause/resume/stop — sim.active 동기 + 상태값 정합
        // ======================================================
        A.pauseSession = async () => {
            const sess = runtime.control.session;
            if (sess && sess.state === 'ACTIVE') {
                sess.state = 'PAUSED';
                sess.pausedAtMs = Date.now();
                runtime.sim.active = false;      // 물리 정지
            }
            if (SNW.Store) SNW.Store.set({
                control: runtime.control, sim: runtime.sim, session: sess,
                lastUpdateMs: Date.now(),
            });
            return { ok: true, result: 'session_paused' };
        };

        A.resumeSession = async () => {
            const sess = runtime.control.session;
            if (sess && sess.state === 'PAUSED') {
                // step 시계 시프트 (일시정지 시간만큼)
                const pausedMs = Date.now() - (sess.pausedAtMs || Date.now());
                if (sess.currentStepStartMs) {
                    sess.currentStepStartMs += pausedMs;
                }
                sess.pausedAccumMs = (sess.pausedAccumMs || 0) + pausedMs;
                sess.state = 'ACTIVE';
                sess.pausedAtMs = 0;
                runtime.sim.active = true;       // 물리 재개
            }
            if (SNW.Store) SNW.Store.set({
                control: runtime.control, sim: runtime.sim, session: sess,
                lastUpdateMs: Date.now(),
            });
            return { ok: true, result: 'session_resumed' };
        };

        A.stopSession = async () => {
            const sess = runtime.control.session;
            if (sess) {
                sess.active = false;
                sess.state = 'COMPLETED';
            }
            runtime.sim.active = false;
            runtime.control.active = false;
            runtime.control.state = 'IDLE';
            runtime.control.stateCode = 0;
            runtime.control.reason = 'NONE';
            runtime.control.reasonCode = 0;

            if (SNW.Store) SNW.Store.set({
                control: runtime.control, sim: runtime.sim, session: sess,
                fsmState: 0, fsmReason: 0,
                lastUpdateMs: Date.now(),
            });
            return { ok: true, result: 'session_stopped' };
        };

        A.getCurrentSession = async () => (runtime.control.session || { active: false, type: 0 });
        A.setScheduleOverride = async (override) => {
            runtime.control.manualOverrideSchedule = !!override;
            return { ok: true, override: !!override };
        };
        A.getComfort = async () => ({
            di: 71.5,
            level: 1,
            levelText: "약간 덥네요",
            tempC: 25.5,
            humidity: 60.0,
            recommend: {
                profileId: 1,
                presetCode: "COUNTRY_BREEZE",
                styleCode: "BALANCE"
            }
        });
        let _offlineAutoComfort = false;
        A.setAutoComfort = async (enabled) => {
            _offlineAutoComfort = !!enabled;
            return { success: true, autoComfort: _offlineAutoComfort, remainSec: 300 };
        };
        A.getAutoComfortStatus = async () => ({
            autoComfort: _offlineAutoComfort,
            remainSec: 300
        });
        A.getMonitorTimeline = async (since = 0) => ({
            events: [
                { t: Math.floor(Date.now() / 1000) - 300, eventType: 2, sessionType: 1, trigger: 1, stepIdx: 0, totalSteps: 3, profileNo: 1, schNo: 0, label: "재생 시작" },
                { t: Math.floor(Date.now() / 1000) - 120, eventType: 1, sessionType: 1, trigger: 1, stepIdx: 1, totalSteps: 3, profileNo: 1, schNo: 0, label: "Step 전환" },
            ]
        });
        A.getSessionSummary = async (from = 0, to = 0) => ({
            totalEvents: 2,
            sessionStarts: 1,
            sessionEnds: 0,
            stepChanges: 1
        });
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

        // ======================================================
        // [Stage 8] AI Mock 핸들러 (오프라인 시뮬레이션)
        // ======================================================
        let s_mockAudioSec = 45;
        let s_mockTurns = 2;
        let s_mockCostX1000 = 14;

        A.gemini = async (body) => {
            const msg = (body && body.message || '').trim();
            const actions = [];
            let text = '네, 요청하신 작업을 처리했습니다.';
            let hint = '완료했습니다.';

            if (msg.includes('바다') || msg.includes('시원')) {
                await A.sessionStart('PRESET', { presetCode: 'OCEAN', styleCode: 'BALANCE' });
                actions.push({ name: 'start_preset', args: { presetCode: 'OCEAN' }, result: 'ok' });
                text = '시원한 바다 바람을 틀어드렸습니다.';
                hint = '바다 바람을 틀어드렸습니다.';
            } else if (msg.includes('꺼') || msg.includes('정지') || msg.includes('중지')) {
                await A.stopSession();
                actions.push({ name: 'stop_session', args: {}, result: 'ok' });
                text = '바람을 껐습니다.';
                hint = '바람을 껐습니다.';
            } else if (msg.includes('스케줄') || msg.includes('일정')) {
                runtime.control.manualOverrideSchedule = false;
                actions.push({ name: 'release_manual_to_schedule', args: {}, result: 'ok' });
                text = '스케줄 자동 실행 모드로 전환했습니다.';
                hint = '스케줄 자동 실행으로 돌아갑니다.';
            } else if (msg.includes('분') || msg.includes('시간') || msg.includes('타이머')) {
                actions.push({ name: 'set_timer', args: { minutes: 30 }, result: 'ok' });
                text = '30분 타이머를 설정했습니다.';
                hint = '30분 후 자동으로 꺼드릴게요.';
            } else {
                text = `"${msg}"에 맞춰 쾌적한 자연풍을 설정했습니다.`;
                hint = '바람 설정을 완료했습니다.';
            }

            return {
                ok: true,
                text,
                _speechHint: hint,
                _lang: body.lang || 'ko',
                actions,
                session: runtime.control.session
            };
        };

        A.executeAiAction = async (name, args) => {
            if (name === 'stop_session') {
                await A.stopSession();
                return { ok: true, name, result: 'ok' };
            }
            if (name === 'start_preset') {
                await A.sessionStart('PRESET', { presetCode: args?.presetCode || 'OCEAN', styleCode: args?.styleCode || 'BALANCE' });
                return { ok: true, name, result: 'ok' };
            }
            if (name === 'set_fan_speed') {
                await A.overrideFixed(args?.speed || 50);
                return { ok: true, name, result: 'ok' };
            }
            return { ok: true, name, result: 'ok', session: runtime.control.session };
        };

        A.getAiLiveToken = async () => ({
            token: 'mock-offline-token-12345',
            wsUrl: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
            voiceName: 'Aoede',
            audioSec: s_mockAudioSec,
            capSec: 1800,
            remainingSec: 1800 - s_mockAudioSec,
            level: 'normal'
        });

        A.callAiLiveFunction = async (body) => {
            const calls = body?.functionCalls || [];
            const responses = calls.map(c => ({
                id: c.id || 'call_0',
                name: c.name,
                response: { result: 'ok', success: true }
            }));
            return { functionResponses: responses };
        };

        A.getAiLiveConfig = async () => ({
            voiceName: 'Aoede',
            systemInstruction: 'You are Smart Nature Wind AI Assistant (Offline Mock).',
            tools: []
        });

        A.getAiCostStatus = async () => ({
            resetDate: new Date().toISOString().slice(0, 10),
            audioSec: s_mockAudioSec,
            turnCount: s_mockTurns,
            estCostUsdX1000: s_mockCostX1000,
            capSec: 1800,
            remainingSec: 1800 - s_mockAudioSec,
            level: s_mockAudioSec >= 1800 ? 'cap' : (s_mockAudioSec >= 1500 ? 'warn' : 'normal')
        });

        A.reportAiUsage = async (body) => {
            s_mockAudioSec += (body?.audioSec || 0);
            s_mockTurns += (body?.turnCount || 0);
            s_mockCostX1000 += (body?.costUsdX1000 || 0);
            return A.getAiCostStatus();
        };

        A.resetAiCost = async () => {
            s_mockAudioSec = 0;
            s_mockTurns = 0;
            s_mockCostX1000 = 0;
            return { success: true };
        };

        A.uploadFile = async () => { throw new SNW.Api.ApiError(503); };
        A.uploadFirmware = async () => { throw new SNW.Api.ApiError(503); };

        // ======================================================
        // [Phase4 ADR-2] body unwrap: {profile|schedule: {...}} 또는 root 모두 수용
        //  - C++는 p_doc["profile"] ?? root 폴백 처리
        //  - offline은 이전에 b.profile / b.schedule만 봐서
        //    Studio(291) / SchedulePanel(293)의 root body가 유실됨
        // ======================================================
        const _unwrap = (b, key) => (b && b[key]) ? b[key] : (b || {});

        // CRUD
        A.addSchedule = async (b) => {
            const body = _unwrap(b, 'schedule');
            const list = cache.schedules.schedules || [];
            const maxId = list.reduce((m, s) => Math.max(m, s.schId || 0), 0);
            const id = maxId + 1;
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
            }, body);
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
            const body = _unwrap(b, 'schedule');
            const list = cache.schedules.schedules || [];
            const idx = list.findIndex(s => s.schId === id);
            if (idx >= 0) Object.assign(list[idx], body);
            persistCache('schedules');
            return { updated: true };
        };
        A.addProfile = async (b) => {
            const body = _unwrap(b, 'profile');
            const list = (cache.userProfiles && cache.userProfiles.userProfiles && cache.userProfiles.userProfiles.profiles) || [];
            const maxId = list.reduce((m, p) => Math.max(m, p.profileId || 0), 0);
            const id = maxId + 1;
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
            }, body);
            if (Array.isArray(newProf.steps)) newProf.segCount = newProf.steps.length;
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
            const body = _unwrap(b, 'profile');
            const list = (cache.userProfiles && cache.userProfiles.userProfiles && cache.userProfiles.userProfiles.profiles) || [];
            const idx = list.findIndex(p => p.profileId === id);
            if (idx >= 0) {
                Object.assign(list[idx], body);
                if (Array.isArray(body.steps)) list[idx].segCount = body.steps.length;
            }
            persistCache('userProfiles');
            return { updated: true };
        };

        A.addWindProfile = async (b) => {
            const body = _unwrap(b, 'preset');
            const list = (cache.windDict && cache.windDict.windDict && cache.windDict.windDict.presets) || [];
            list.push(Object.assign({ idx: list.length }, body));
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
            SNW.WsManager.initByLevel = () => { };
            SNW.WsManager.get = (ch) => {
                const subs = wsSubscribers[ch] || (wsSubscribers[ch] = new Set());
                return {
                    onMessage: (cb) => {
                        subs.add(cb);
                        return () => subs.delete(cb);
                    },
                    onOpen: (cb) => { if (typeof cb === 'function') setTimeout(cb, 0); return () => { }; },
                    onClose: () => () => { },
                    send: () => true
                };
            };
        }
    }

    // ======================================================
    // [Phase6 6.5 N-28] startSimulator 확장
    //  - sim 물리 엔진 + 세션 step 진행 동시 갱신
    //  - 세션 step 진행은 sim.active와 독립 (paused여도 stepRemainSec 갱신 필요)
    //    → 다만 PAUSED 상태에서는 step 시계 정지 (resumeSession에서 시프트)
    // ======================================================
    function startSimulator() {
        if (window._snw_sim_timer) return;
        window._snw_sim_timer = setInterval(() => {
            if (!runtime.sim.active && !runtime.control.session?.active) return;

            // ─────────── ① 세션 step 진행 (N-28) ───────────
            const sess = runtime.control.session;
            if (sess && sess.active && sess.state === 'ACTIVE') {
                // Lazy init (구 데이터 호환)
                if (!sess.currentStepStartMs || !sess.currentStepDurationMs) {
                    sess.currentStepStartMs = Date.now();
                    sess.currentStepDurationMs = (sess.stepRemainSec || 540) * 1000;
                }

                const elapsed = Date.now() - sess.currentStepStartMs;
                const remainMs = Math.max(0, sess.currentStepDurationMs - elapsed);
                sess.stepRemainSec = Math.floor(remainMs / 1000);

                if (remainMs <= 0) {
                    // Step 전환
                    if (sess.currentStep < sess.totalSteps) {
                        sess.currentStep++;
                    } else {
                        sess.loopCount = (sess.loopCount || 0) + 1;
                        sess.currentStep = 1;
                    }
                    sess.currentStepStartMs = Date.now();

                    // 프로필에서 다음 step duration 조회
                    let nextDurMin = 20;
                    const profiles = (cache.userProfiles?.userProfiles?.profiles) || [];
                    const profile = profiles.find(p => p.profileId === sess.profileId);
                    if (profile) {
                        const steps = profile.steps || profile.segments || [];
                        if (steps.length > 0) {
                            const step = steps[Math.min(sess.currentStep - 1, steps.length - 1)];
                            nextDurMin = step.durationMin
                                ?? ((step.onMinutes || 20) + (step.offMinutes || 0));
                        }
                    }
                    sess.currentStepDurationMs = (nextDurMin || 20) * 60000;
                    sess.stepRemainSec = Math.floor(sess.currentStepDurationMs / 1000);
                }
            }

            // ─────────── ② 물리 시뮬레이션 ───────────
            if (runtime.sim.active) {
                const intensity = runtime.sim.intensity != null ? runtime.sim.intensity : 50;
                const variability = runtime.sim.variability != null ? runtime.sim.variability : 40;

                const baseSpeed = Math.max(0.4, intensity * 0.055);
                const varAmp = variability * 0.025;

                runtime.sim.targetWind = Number(baseSpeed.toFixed(1));
                runtime.sim.windSpeed = Math.max(0.2,
                    Number((baseSpeed + (Math.random() - 0.5) * varAmp).toFixed(1)));
                runtime.sim.pwmDuty = Math.min(100, Math.max(15,
                    Math.round(runtime.sim.windSpeed * 12 + 10)));

                runtime.control.sensor.tempC = Number((24 + Math.sin(Date.now() / 60000) * 1.5).toFixed(1));
                runtime.control.sensor.humidity = Math.round(55 + Math.cos(Date.now() / 90000) * 5);
                runtime.control.sensor.motionActive = (Math.floor(Date.now() / 20000) % 2) === 0;

                const chartPoint = {
                    t: Date.now(),
                    wind: runtime.sim.windSpeed,
                    targetWind: runtime.sim.targetWind,
                    pwm: runtime.sim.pwmDuty,
                    gust: 0,
                    thermal: 0,
                };
                runtime.chart.push(chartPoint);
                if (runtime.chart.length > 120) runtime.chart.shift();

                if (wsSubscribers.chart) {
                    wsSubscribers.chart.forEach(fn => { try { fn(chartPoint); } catch (e) { } });
                }
            }

            // ─────────── ③ 상태 브로드캐스트 (sim 또는 session 변경 시) ───────────
            if (wsSubscribers.state) {
                const stateData = {
                    control: runtime.control,
                    sim: runtime.sim,
                    runtime: runtime.runtime,
                };
                wsSubscribers.state.forEach(fn => { try { fn(stateData); } catch (e) { } });
            }

            if (SNW.Store) {
                SNW.Store.set({
                    control: runtime.control,
                    sim: runtime.sim,
                    session: runtime.control.session,
                    connection: 'online',
                    lastUpdateMs: Date.now(),
                });
            }
        }, 1000);
    }

    function exportBackup() {
        const backupData = {
            version: '2.0.3',
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

    // ======================================================
    // [Phase6 6.2 N-11] applyScenario 재작성
    //  - 프리셋 코드: SLEEP/FOREST → OCEAN/FOREST_CANOPY (windDict 실존)
    //  - 스타일 코드: REFRESH → ACTIVE (존재 코드)
    //  - resolvePreset 활용 → 프리셋별 실제 강도 반영
    //  - PIR_BLOCK/AUTOOFF는 sim.active=false (팬 정지) + control.active=false
    // ======================================================
    function applyScenario(type) {
        const scenarios = {
            NATURAL: {
                preset: 'FOREST_CANOPY', style: 'BALANCE',
                state: 'SCHEDULE_RUN', stateCode: 3,
                reason: 'SCHEDULE_ACTIVE', reasonCode: 4,
                active: true, motionActive: true,
            },
            SLEEP: {
                preset: 'OCEAN', style: 'SLEEP',
                state: 'SCHEDULE_RUN', stateCode: 3,
                reason: 'SCHEDULE_ACTIVE', reasonCode: 4,
                active: true, motionActive: true,
                override: { intensity: 30, variability: 15, gustFreq: 0 },
            },
            GALE: {
                preset: 'OCEAN', style: 'ACTIVE',
                state: 'SCHEDULE_RUN', stateCode: 3,
                reason: 'SCHEDULE_ACTIVE', reasonCode: 4,
                active: true, motionActive: true,
                override: { intensity: 85, variability: 70, gustFreq: 75 },
            },
            PIR_BLOCK: {
                state: 'ENV_PAUSED', stateCode: 7,
                reason: 'ENV_PAUSED', reasonCode: 12,
                pauseReason: 3,
                active: false, motionActive: false,
            },
            AUTOOFF: {
                state: 'AUTOOFF_STOPPED', stateCode: 5,
                reason: 'AUTOOFF_TIMER', reasonCode: 9,
                active: false,
            },
        };

        const cfg = scenarios[type] || scenarios.NATURAL;

        // ① 프리셋/스타일 적용 (NATURAL 계열만)
        if (cfg.preset) {
            runtime.sim.presetCode = cfg.preset;
            runtime.sim.styleCode = cfg.style;

            const r = resolvePreset(cfg.preset, cfg.style);
            runtime.sim.intensity = cfg.override?.intensity ?? r.intensity;
            runtime.sim.variability = cfg.override?.variability ?? r.variability;
            runtime.sim.gustFreq = cfg.override?.gustFreq ?? r.gustFreq;
        }

        // ② 실행/제어 상태
        runtime.sim.active = cfg.active;
        runtime.control.active = cfg.active;
        runtime.control.state = cfg.state;
        runtime.control.stateCode = cfg.stateCode;
        if (cfg.reason) {
            runtime.control.reason = cfg.reason;
            runtime.control.reasonCode = cfg.reasonCode;
        }
        if (cfg.motionActive !== undefined) {
            runtime.control.sensor.motionActive = cfg.motionActive;
        }

        // ③ Store 브로드캐스트
        if (SNW.Store) {
            SNW.Store.set({
                control: runtime.control,
                sim: runtime.sim,
                fsmState: runtime.control.stateCode,
                fsmReason: runtime.control.reasonCode,
                lastUpdateMs: Date.now(),
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

        // ======================================================
        // [Phase6 6.6 N-14] 삽입 위치 수정
        //  - 이전: #app.firstChild → .snw-app grid row 1 점유
        //          (grid-template-rows: 56px 1fr 40px → toolbar가 56px 점유)
        //          → header/main/footer가 아래로 밀림 (레이아웃 완전 붕괴)
        //  - 이후: document.body.firstChild → app 앞에 flow 정상 삽입
        //          (body는 grid 아님, toolbar는 자연스럽게 상단 배치)
        //  - 툴바 position: relative 유지 → 스크롤 시 함께 사라짐
        //    (dev/demo 도구 특성상 sticky 불필요)
        // ======================================================
        document.body.insertBefore(bar, document.body.firstChild);

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
            // ======================================================
            // [API 재정의 필수 시점 - 유일한 시점]
            //  1) 998.offline_0203.js (현재 파일)는 index.html document.write로 로드
            //  2) P010_bundle_0203.js의 040.api.js가 Object.assign으로 _fetch 기반
            //     메서드를 정의 (오프라인 분기 있으나 POST 상태 변경 누락)
            //  3) DOMContentLoaded에서 ensureApi()를 재실행 → 오프라인 mock으로 재덮어씀
            //
            //  ※ SNW_BOOT은 이 DOMContentLoaded 이후에 실행되므로,
            //    ensureApi()는 이 지점 1회로 충분 (SNW_BOOT 내부 호출 제거).
            //  ※ 모든 페이지 mount 전에 완료 보장 (SNW_BOOT이 SNW.Offline.ready await).
            // ======================================================
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