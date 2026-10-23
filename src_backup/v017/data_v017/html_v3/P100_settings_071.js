/*
 * ------------------------------------------------------
 * 소스명 : P100_settings_071.js
 * 모듈명 : Smart Nature Wind System Settings Controller
 * ------------------------------------------------------
 * 기능 요약:
 * - /api/v001/* 시스템 설정 조회/저장
 * - API Key 관리 (P000_common과 저장소 통일)
 * - 하드웨어/네트워크/시간/WebSocket 정책 설정
 * - 진단/로그/펌웨어 확인
 * ------------------------------------------------------
 */

(() => {
    "use strict";

    // ======================= 1. 데이터 로드 =======================

    async function loadSystemInfo() {
        // 1) 버전
        const ver = await SNW.api.get("/api/v001/version", "");
        if (ver && ver.fw) SNW.$("#fwVersion").textContent = ver.fw;

        // 2) 진단 [C-7]
        const diag = await SNW.api.get("/api/v001/diag", "");
        if (diag) {
            if (diag.heap != null) {
                SNW.$("#heapFree").textContent = (diag.heap / 1024).toFixed(1) + " KB";
            }
            if (diag.fs_used != null && diag.fs_total != null) {
                SNW.$("#fsUsed").textContent =
                    (diag.fs_used / 1024).toFixed(0) + " / " + (diag.fs_total / 1024).toFixed(0) + " KB";
            }
        }

        // 3) WiFi 상태 [C-6]
        const wifiData = await SNW.api.get("/api/v001/wifi/state", "");
        if (wifiData && wifiData.wifi && wifiData.wifi.state) {
            const w = wifiData.wifi.state;
            SNW.$("#netMode").textContent   = w.mode_name || "-";
            SNW.$("#ipAddress").textContent = w.ip || "-";
            SNW.$("#wifiSsid").textContent  = w.ssid || "-";
        }

        // 4) 시스템 설정
        const sys = await SNW.api.get("/api/v001/system", "");
        if (sys) {
            // 일반
            if (sys.meta && SNW.$("#deviceName")) SNW.$("#deviceName").value = sys.meta.deviceName || "";
            if (sys.meta && SNW.$("#lastUpdate")) SNW.$("#lastUpdate").textContent = sys.meta.lastUpdate || "-";
            if (sys.system && sys.system.logging && SNW.$("#logLevel")) {
                SNW.$("#logLevel").value = sys.system.logging.level || "INFO";
            }

            // 팬 커브
            if (sys.hw && sys.hw.fanConfig) {
                if (SNW.$("#startPercentMin"))   SNW.$("#startPercentMin").value   = sys.hw.fanConfig.startPercentMin;
                if (SNW.$("#comfortPercentMin")) SNW.$("#comfortPercentMin").value = sys.hw.fanConfig.comfortPercentMin;
                if (SNW.$("#comfortPercentMax")) SNW.$("#comfortPercentMax").value = sys.hw.fanConfig.comfortPercentMax;
                if (SNW.$("#hardPercentMax"))    SNW.$("#hardPercentMax").value    = sys.hw.fanConfig.hardPercentMax;
            }

            // 하드웨어
            if (sys.hw) {
                if (sys.hw.fanPwm) {
                    if (SNW.$("#hwFanPin"))     SNW.$("#hwFanPin").value     = sys.hw.fanPwm.pin;
                    if (SNW.$("#hwFanChannel")) SNW.$("#hwFanChannel").value = sys.hw.fanPwm.channel;
                    if (SNW.$("#hwFanFreq"))    SNW.$("#hwFanFreq").value    = sys.hw.fanPwm.freq;
                    if (SNW.$("#hwFanRes"))     SNW.$("#hwFanRes").value     = sys.hw.fanPwm.res;
                }
                if (sys.hw.pir) {
                    if (SNW.$("#hwPirEnabled"))  SNW.$("#hwPirEnabled").checked = !!sys.hw.pir.enabled;
                    if (SNW.$("#hwPirPin"))      SNW.$("#hwPirPin").value       = sys.hw.pir.pin;
                    if (SNW.$("#hwPirDebounce")) SNW.$("#hwPirDebounce").value  = sys.hw.pir.debounceSec;
                    if (SNW.$("#hwPirHold"))     SNW.$("#hwPirHold").value      = sys.hw.pir.holdSec;
                }
                if (sys.hw.tempHum) {
                    if (SNW.$("#hwThEnabled"))  SNW.$("#hwThEnabled").checked = !!sys.hw.tempHum.enabled;
                    if (SNW.$("#hwThPin"))      SNW.$("#hwThPin").value       = sys.hw.tempHum.pin;
                    if (SNW.$("#hwThType"))     SNW.$("#hwThType").value      = sys.hw.tempHum.type || "DHT22";
                    if (SNW.$("#hwThInterval")) SNW.$("#hwThInterval").value  = sys.hw.tempHum.intervalSec;
                }
                if (sys.hw.led) {
                    if (SNW.$("#hwLedPin"))        SNW.$("#hwLedPin").value        = sys.hw.led.pin;
                    if (SNW.$("#hwLedNumPixels"))  SNW.$("#hwLedNumPixels").value  = sys.hw.led.numPixels;
                    if (SNW.$("#hwLedBrightness")) SNW.$("#hwLedBrightness").value = sys.hw.led.defaultBrightness;
                }
            }

            // 시간 [C-2]
            if (sys.timeCfg) {
                if (SNW.$("#ntpServer"))        SNW.$("#ntpServer").value        = sys.timeCfg.ntpServer || "pool.ntp.org";
                if (SNW.$("#timezoneOffset"))   SNW.$("#timezoneOffset").value   = sys.timeCfg.timezone || "Asia/Seoul";
                if (SNW.$("#syncIntervalMin"))  SNW.$("#syncIntervalMin").value  = sys.timeCfg.syncIntervalMin || 60;
            }

            // WebSocket 정책 [D-6]
            if (sys.system && sys.system.webSocket) {
                const ws = sys.system.webSocket;
                if (Array.isArray(ws.wsChConfig)) {
                    const chIdMap = ["State", "Metrics", "Chart", "Summary"];
                    ws.wsChConfig.forEach(ch => {
                        const name = chIdMap[ch.chIdx];
                        if (!name) return;
                        const itv  = document.getElementById(`wsCh${name}Interval`);
                        const prio = document.getElementById(`wsCh${name}Priority`);
                        if (itv)  itv.value  = ch.chIntervalMs;
                        if (prio) prio.value = ch.priority;
                    });
                }
                if (ws.wsEtcConfig) {
                    if (SNW.$("#wsChartLargeBytes"))  SNW.$("#wsChartLargeBytes").value  = ws.wsEtcConfig.chartLargeBytes;
                    if (SNW.$("#wsChartThrottleMul")) SNW.$("#wsChartThrottleMul").value = ws.wsEtcConfig.chartThrottleMul;
                    if (SNW.$("#wsCleanupMs"))        SNW.$("#wsCleanupMs").value        = ws.wsEtcConfig.wsCleanupMs;
                }
            }
            
            // Security
            if (sys.security) {
                if (SNW.$("#geminiApiKey") && sys.security.geminiApiKey) {
                    SNW.$("#geminiApiKey").value = sys.security.geminiApiKey;
                }
            }
        }

        // 5) Motion (런타임 PIR + timing)
        const motion = await SNW.api.get("/api/v001/motion", "");
        if (motion && motion.motion) {
            if (motion.motion.pir) {
                if (SNW.$("#motionPirEnabled")) SNW.$("#motionPirEnabled").checked = !!motion.motion.pir.enabled;
                if (SNW.$("#motionPirHold"))    SNW.$("#motionPirHold").value      = motion.motion.pir.holdSec;
            }
            if (motion.motion.timing) {
                if (SNW.$("#motionSimInterval"))     SNW.$("#motionSimInterval").value     = motion.motion.timing.simIntervalMs;
                if (SNW.$("#motionGustInterval"))    SNW.$("#motionGustInterval").value    = motion.motion.timing.gustIntervalMs;
                if (SNW.$("#motionThermalInterval")) SNW.$("#motionThermalInterval").value = motion.motion.timing.thermalIntervalMs;
            }
        }

        // 6) Dirty 상태
        const dirty = await SNW.api.get("/api/v001/config/dirty", "");
        if (dirty) {
            const hasDirty = dirty.system || dirty.wifi || dirty.motion ||
                             dirty.schedules || dirty.userProfiles || dirty.windDict ||
                             dirty.nvsSpec || dirty.webPage;
            const statusEl = SNW.$("#configDirtyStatus");
            if (statusEl) {
                statusEl.textContent = hasDirty ? "📝 변경됨 (저장 필요)" : "✅ 저장됨";
                statusEl.className = hasDirty ? "info-label warn" : "info-label ok";
            }
        }

        // 7) API Key 상태
        const st = SNW.$("#apiKeyStatus");
        if (st) {
            const hasKey = !!SNW.getApiKey();
            st.textContent = hasKey ? "저장됨 (확인 필요)" : "설정 필요";
            st.className = hasKey ? "info-label warn" : "info-label err";
        }
        
        await checkAuth();
        await loadLogs();
    }

    // 로그 [C-8]
    async function loadLogs() {
        const viewer = SNW.$("#logViewer");
        if (!viewer) return;

        const data = await SNW.api.get("/api/v001/logs", "");
        if (data && Array.isArray(data.logs)) {
            viewer.textContent = data.logs
                .map(l => {
                    const ts = l.ts != null ? l.ts : "?";
                    const lv = l.lv != null ? l.lv : "?";
                    const msg = l.msg != null ? l.msg : "";
                    return `[${ts}] L${lv} ${msg}`;
                })
                .join("\n");
            viewer.scrollTop = viewer.scrollHeight;
        } else {
            viewer.textContent = "로그를 불러올 수 없습니다.";
        }
    }

    // ======================= 2. API Key =======================

    function openApiKeyModal() {
        const el = SNW.$("#newApiKey");
        if (el) el.value = SNW.getApiKey();
        const m = SNW.$("#apiKeyModal");
        if (m) m.style.display = "flex";
    }

    function closeApiKeyModal() {
        const m = SNW.$("#apiKeyModal");
        if (m) m.style.display = "none";
    }

    async function saveApiKey(event) {
        event.preventDefault();
        const newKey = SNW.$("#newApiKey").value.trim();
        SNW.setApiKey(newKey);
        SNW.toast(newKey ? "API Key가 저장되었습니다." : "API Key가 삭제되었습니다.", newKey ? "ok" : "warn");
        closeApiKeyModal();
        await checkAuth();
    }

    // [C-5] /auth/test 응답은 {"result":"authorized"} / {"result":"unauthorized"}
    async function checkAuth() {
        const result = await SNW.api.get("/api/v001/auth/test", "");
        const statusEl = SNW.$("#apiKeyStatus");
        if (!statusEl) return;

        if (result && result.result === "authorized") {
            statusEl.textContent = "✅ 인증 성공";
            statusEl.className = "info-label ok";
        } else if (SNW.getApiKey()) {
            statusEl.textContent = "인증 실패 (키 만료/오류)";
            statusEl.className = "info-label err";
        } else {
            statusEl.textContent = "설정 필요";
            statusEl.className = "info-label warn";
        }
    }

    // ======================= 3. 장치 제어 =======================

    async function handleDeviceControl(event) {
        const target = event.target;
        let url = "", confirmMsg = "", successMsg = "";

        if (target.id === "btnConfigSave") {
            url = "/api/v001/config/save";
            confirmMsg = "현재 설정값들을 장치 메모리에 영구 저장하시겠습니까?";
            successMsg = "설정 파일 저장 성공";
        } else if (target.id === "btnReboot") {
            url = "/api/v001/control/reboot";
            confirmMsg = "장치를 재부팅하시겠습니까? (연결이 끊어집니다)";
            successMsg = "장치 재부팅 요청됨. 잠시 후 다시 접속해 주세요.";
        } else if (target.id === "btnFactoryReset") {
            url = "/api/v001/control/factoryReset";
            confirmMsg = "경고: 모든 설정을 공장 초기화하고 재부팅하시겠습니까? 되돌릴 수 없습니다.";
            successMsg = "공장 초기화 요청됨. 장치가 재부팅됩니다.";
        } else {
            return;
        }

        if (!confirm(confirmMsg)) return;

        const result = await SNW.api.post(url, null, target.textContent.trim());
        if (result) {
            SNW.toast(successMsg, "warn");
            if (target.id === "btnReboot" || target.id === "btnFactoryReset") {
                setTimeout(() => window.location.reload(), 5000);
            } else if (target.id === "btnConfigSave") {
                await loadSystemInfo();
            }
        }
    }

    // ======================= 4. 설정 저장 =======================

    // 네트워크 설정 저장 [C-4]
    async function saveNetworkSettings(event) {
        event.preventDefault();
        const ssid = SNW.$("#networkSsid").value.trim();
        const password = SNW.$("#networkPassword").value;
        const mode = parseInt(SNW.$("#networkMode").value, 10);

        if (!ssid && (mode === 1 || mode === 2)) {
            SNW.toast("STA 모드 설정 시 SSID는 필수입니다.", "err");
            return;
        }

        const payload = { wifi: { wifiMode: mode } };

        if (mode === 1 || mode === 2) {
            payload.wifi.sta = [{ ssid, pass: password }];
        }
        if (mode === 0 || mode === 2) {
            payload.wifi.ap = { ssid, pass: password };
        }

        const result = await SNW.api.post("/api/v001/wifi/config", payload, "네트워크 설정 저장");

        if (result) {
            SNW.toast("네트워크 설정이 저장되었습니다. 재접속을 시도합니다.", "warn");
            closeNetworkSetupModal();
            setTimeout(() => window.location.reload(), 5000);
        }
    }

    // 시간 설정 저장 [C-2 + C-3]
    async function saveTimeSettings(event) {
        event.preventDefault();
        const ntpServer = SNW.$("#ntpServer").value.trim();
        const timezone = SNW.$("#timezoneOffset").value;
        const syncIntervalMin = parseInt(SNW.$("#syncIntervalMin").value, 10) || 60;

        if (!ntpServer || !timezone) {
            SNW.toast("유효한 NTP 서버 주소와 시간대를 입력하세요.", "err");
            return;
        }

        // [C-2] 백엔드는 timeCfg 키 사용
        const body = {
            timeCfg: {
                ntpServer: ntpServer,
                timezone: timezone,
                syncIntervalMin: syncIntervalMin
            }
        };

        // [C-3] TM10 런타임 반영을 위해 /system/time/set 사용
        const result = await SNW.api.post("/api/v001/system/time/set", body, "시간 설정 저장");

        if (result) {
            SNW.toast("시간 설정이 저장되고 적용되었습니다.", "ok");
            closeTimeSetupModal();
            await loadSystemInfo();
        }
    }

    // 일반 설정 저장
    async function saveGeneralSettings(event) {
        event.preventDefault();
        const deviceName = SNW.$("#deviceName").value.trim();
        const logLevel = SNW.$("#logLevel").value;

        const body = {
            meta: { deviceName },
            system: { logging: { level: logLevel } }
        };

        const result = await SNW.api.post("/api/v001/system", body, "일반 설정 저장");
        if (result) {
            SNW.toast("일반 설정이 저장되었습니다. (런타임 반영은 재부팅 후)", "warn");
            await loadSystemInfo();
        }
    }
    
    // Gemini API Key 저장
    async function saveGeminiApiKey() {
        const key = SNW.$("#geminiApiKey").value.trim();
        
        const body = {
            security: { geminiApiKey: key }
        };
        
        const result = await SNW.api.post("/api/v001/system", body, "Gemini Key 저장");
        if (result) {
            SNW.toast("Gemini API Key가 저장되었습니다.", "ok");
            await loadSystemInfo();
        }
    }
    
    // [v025 #9] 설정 백업 다운로드
    async function downloadConfigBackup() {
        const data = await SNW.api.get("/api/v001/config", "설정 백업");
        if (!data) return;
        
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            
            const ts = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const filename = `snw_config_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}.json`;
            
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            SNW.toast(`설정 다운로드 완료: ${filename}`, "ok");
        } catch (e) {
            SNW.toast(`다운로드 실패: ${e.message}`, "err");
        }
    }

    // 팬 커브 저장
    async function saveFanConfig(event) {
        event.preventDefault();
        const body = {
            hw: {
                fanConfig: {
                    startPercentMin:   parseInt(SNW.$("#startPercentMin").value, 10),
                    comfortPercentMin: parseInt(SNW.$("#comfortPercentMin").value, 10),
                    comfortPercentMax: parseInt(SNW.$("#comfortPercentMax").value, 10),
                    hardPercentMax:    parseInt(SNW.$("#hardPercentMax").value, 10)
                }
            }
        };

        const result = await SNW.api.post("/api/v001/system", body, "팬 설정 저장");
        if (result) {
            SNW.toast("팬 제어 한계 설정이 적용되었습니다.", "ok");
            await loadSystemInfo();
        }
    }

    // 하드웨어 설정 저장 [C-9 BLE 제거 + LED 추가]
    async function saveHwSettings(event) {
        event.preventDefault();
        const body = {
            hw: {
                fanPwm: {
                    pin:     parseInt(SNW.$("#hwFanPin").value, 10),
                    channel: parseInt(SNW.$("#hwFanChannel").value, 10),
                    freq:    parseInt(SNW.$("#hwFanFreq").value, 10),
                    res:     parseInt(SNW.$("#hwFanRes").value, 10)
                },
                pir: {
                    enabled:     SNW.$("#hwPirEnabled").checked,
                    pin:         parseInt(SNW.$("#hwPirPin").value, 10),
                    debounceSec: parseInt(SNW.$("#hwPirDebounce").value, 10),
                    holdSec:     parseInt(SNW.$("#hwPirHold").value, 10)
                },
                tempHum: {
                    enabled:     SNW.$("#hwThEnabled").checked,
                    pin:         parseInt(SNW.$("#hwThPin").value, 10),
                    type:        SNW.$("#hwThType").value,
                    intervalSec: parseInt(SNW.$("#hwThInterval").value, 10)
                },
                led: {
                    pin:               parseInt(SNW.$("#hwLedPin").value, 10),
                    numPixels:         parseInt(SNW.$("#hwLedNumPixels").value, 10),
                    defaultBrightness: parseInt(SNW.$("#hwLedBrightness").value, 10)
                }
            }
        };

        const result = await SNW.api.post("/api/v001/system", body, "하드웨어 설정 저장");
        if (result) {
            SNW.toast("하드웨어 설정이 저장되었습니다. (핀 변경 시 재부팅 권장)", "warn");
            await loadSystemInfo();
        }
    }

    // Motion 저장
    async function saveMotionSettings(event) {
        event.preventDefault();
        const body = {
            motion: {
                pir: {
                    enabled: SNW.$("#motionPirEnabled").checked,
                    holdSec: parseInt(SNW.$("#motionPirHold").value, 10)
                },
                timing: {
                    simIntervalMs:     parseInt(SNW.$("#motionSimInterval").value, 10),
                    gustIntervalMs:    parseInt(SNW.$("#motionGustInterval").value, 10),
                    thermalIntervalMs: parseInt(SNW.$("#motionThermalInterval").value, 10)
                }
            }
        };

        const result = await SNW.api.post("/api/v001/motion", body, "Motion 설정 저장");
        if (result) {
            SNW.toast("Motion 설정이 저장되었습니다.", "ok");
            await loadSystemInfo();
        }
    }

    // WebSocket 정책 저장 [D-6]
    async function saveWsConfig(event) {
        event.preventDefault();

        const wsChConfig = [
            {
                chIdx: 0,
                chIntervalMs: parseInt(SNW.$("#wsChStateInterval").value, 10),
                priority:     parseInt(SNW.$("#wsChStatePriority").value, 10)
            },
            {
                chIdx: 1,
                chIntervalMs: parseInt(SNW.$("#wsChMetricsInterval").value, 10),
                priority:     parseInt(SNW.$("#wsChMetricsPriority").value, 10)
            },
            {
                chIdx: 2,
                chIntervalMs: parseInt(SNW.$("#wsChChartInterval").value, 10),
                priority:     parseInt(SNW.$("#wsChChartPriority").value, 10)
            },
            {
                chIdx: 3,
                chIntervalMs: parseInt(SNW.$("#wsChSummaryInterval").value, 10),
                priority:     parseInt(SNW.$("#wsChSummaryPriority").value, 10)
            }
        ];

        const body = {
            system: {
                webSocket: {
                    wsChConfig: wsChConfig,
                    wsEtcConfig: {
                        chartLargeBytes:  parseInt(SNW.$("#wsChartLargeBytes").value, 10),
                        chartThrottleMul: parseInt(SNW.$("#wsChartThrottleMul").value, 10),
                        wsCleanupMs:      parseInt(SNW.$("#wsCleanupMs").value, 10)
                    }
                }
            }
        };

        const result = await SNW.api.post("/api/v001/system", body, "WebSocket 정책 저장");
        if (result) {
            SNW.toast("WebSocket 정책이 저장되었습니다. (3초 내 반영)", "ok");
            await loadSystemInfo();
        }
    }

    // WiFi 스캔
    async function scanWifi() {
        const listEl = SNW.$("#wifiList");
        const resultsEl = SNW.$("#wifiScanResults");
        if (!listEl || !resultsEl) return;

        listEl.innerHTML = "<li>검색 중...</li>";
        resultsEl.style.display = "block";

        const data = await SNW.api.get("/api/v001/wifi/scan", "WiFi 검색");
        if (data && data.wifi && data.wifi.scan) {
            listEl.innerHTML = "";
            if (data.wifi.scan.length === 0) {
                listEl.innerHTML = "<li>찾은 네트워크가 없습니다.</li>";
            } else {
                data.wifi.scan.forEach(net => {
                    const li = document.createElement("li");
                    li.innerHTML = `<span>${net.ssid || ""}</span> <span class="rssi-label">${net.rssi || "?"} dBm</span>`;
                    li.onclick = () => {
                        const s = SNW.$("#networkSsid");
                        if (s) s.value = net.ssid || "";
                        resultsEl.style.display = "none";
                    };
                    listEl.appendChild(li);
                });
            }
        } else {
            listEl.innerHTML = "<li>스캔 실패</li>";
        }
    }

    // 설정 재로드
    async function reloadConfig() {
        if (!confirm("파일 시스템에서 설정을 다시 로드하시겠습니까? (저장하지 않은 변경사항은 사라집니다)")) return;

        const result = await SNW.api.post("/api/v001/reload", null, "설정 새로고침");
        if (result) {
            SNW.toast("설정이 다시 로드되었습니다.", "ok");
            await loadSystemInfo();
        }
    }

    // 펌웨어 확인
    async function checkFirmwareUpdate() {
        SNW.toast("펌웨어 업데이트 서버 확인 중...", "info");
        const data = await SNW.api.get("/api/v001/system/firmware/check", "");

        if (data && data.status === "available") {
            SNW.toast(`새 펌웨어 ${data.latest_version} 이 확인되었습니다.`, "warn");
        } else if (data && data.status === "latest") {
            SNW.toast(`현재 최신 버전(${data.current_version})입니다.`, "ok");
        } else {
            SNW.toast("펌웨어 업데이트 정보를 가져오지 못했습니다.", "err");
        }
    }

    // ======================= 5. 모달 =======================

    function openNetworkSetupModal() {
        const m = SNW.$("#networkModal");
        if (m) m.style.display = "flex";
    }
    function closeNetworkSetupModal() {
        const m = SNW.$("#networkModal");
        if (m) m.style.display = "none";
        const r = SNW.$("#wifiScanResults");
        if (r) r.style.display = "none";
    }

    function openTimeSetupModal() {
        const m = SNW.$("#timeModal");
        if (m) m.style.display = "flex";
    }
    function closeTimeSetupModal() {
        const m = SNW.$("#timeModal");
        if (m) m.style.display = "none";
    }

    // ======================= 6. 이벤트 바인딩 =======================

    function bindEvents() {
        // API Key
        SNW.$("#btnSetApiKey")?.addEventListener("click", openApiKeyModal);
        SNW.$("#btnCheckAuth")?.addEventListener("click", checkAuth);
        SNW.$("#apiKeyForm")?.addEventListener("submit", saveApiKey);
        SNW.$("#btnCloseApiKeyModal")?.addEventListener("click", closeApiKeyModal);
        SNW.$("#btnCancelApiKeyModal")?.addEventListener("click", closeApiKeyModal);
        
        // Gemini Key
        SNW.$("#btnSaveGeminiKey")?.addEventListener("click", saveGeminiApiKey);

        // 장치 제어
        SNW.$("#btnConfigSave")?.addEventListener("click", handleDeviceControl);
        SNW.$("#btnReboot")?.addEventListener("click", handleDeviceControl);
        SNW.$("#btnFactoryReset")?.addEventListener("click", handleDeviceControl);
        SNW.$("#btnReloadConfig")?.addEventListener("click", reloadConfig);

        // 정보
        SNW.$("#btnCheckUpdate")?.addEventListener("click", checkFirmwareUpdate);
        SNW.$("#btnRefreshInfo")?.addEventListener("click", loadSystemInfo);
        SNW.$("#btnDownloadConfig")?.addEventListener("click", downloadConfigBackup);
        SNW.$("#btnRefreshLogs")?.addEventListener("click", loadLogs);

        // 폼
        SNW.$("#generalSystemForm")?.addEventListener("submit", saveGeneralSettings);
        SNW.$("#fanConfigForm")?.addEventListener("submit", saveFanConfig);
        SNW.$("#hwConfigForm")?.addEventListener("submit", saveHwSettings);
        SNW.$("#motionForm")?.addEventListener("submit", saveMotionSettings);
        SNW.$("#wsConfigForm")?.addEventListener("submit", saveWsConfig);

        // 모달
        SNW.$("#btnNetworkSetup")?.addEventListener("click", openNetworkSetupModal);
        SNW.$("#networkForm")?.addEventListener("submit", saveNetworkSettings);
        SNW.$("#btnCloseNetworkModal")?.addEventListener("click", closeNetworkSetupModal);
        SNW.$("#btnCancelNetworkModal")?.addEventListener("click", closeNetworkSetupModal);
        SNW.$("#btnWifiScan")?.addEventListener("click", scanWifi);

        SNW.$("#btnTimeSetup")?.addEventListener("click", openTimeSetupModal);
        SNW.$("#timeForm")?.addEventListener("submit", saveTimeSettings);
        SNW.$("#btnCloseTimeModal")?.addEventListener("click", closeTimeSetupModal);
        SNW.$("#btnCancelTimeModal")?.addEventListener("click", closeTimeSetupModal);
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindEvents();
        loadSystemInfo();
    });

})();
