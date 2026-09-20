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

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    // [C-1] P000_common_070.js와 저장소 키 통일
    const KEY_API = "snw_api_key";
    const getKey = () => { try { return localStorage.getItem(KEY_API) || ""; } catch { return ""; } };
    const setKey = (key) => {
        try {
            if (key) localStorage.setItem(KEY_API, key);
            else localStorage.removeItem(KEY_API);
        } catch {}
    };

    const setLoading = (flag) => {
        const el = $("#loadingOverlay");
        if (el) el.style.display = flag ? "flex" : "none";
    };

    // ======================= 1. 공통 fetch =======================
    async function fetchApi(url, method = "GET", body = null, desc = "작업") {
        setLoading(true);
        const opt = { method, headers: {} };
        const k = getKey();
        if (k) opt.headers["X-API-Key"] = k;

        if (body) {
            opt.body = JSON.stringify(body);
            opt.headers["Content-Type"] = "application/json";
        }

        try {
            const resp = await fetch(url, opt);
            if (resp.status === 401) {
                showToast(`[401] ${desc} 실패: 인증 실패 (API Key 확인 필요)`, "err");
                const st = $("#apiKeyStatus");
                if (st) {
                    st.textContent = "인증 실패";
                    st.className = "info-label err";
                }
                throw new Error("Unauthorized");
            }
            if (!resp.ok) {
                const txt = await resp.text();
                showToast(`${desc} 실패: ${txt || resp.status}`, "err");
                throw new Error(txt || String(resp.status));
            }
            if (method !== "GET" && desc) showToast(`${desc} 성공`, "ok");

            const txt = await resp.text();
            try { return txt ? JSON.parse(txt) : null; } catch { return txt; }
        } catch (e) {
            if (e.message !== "Unauthorized") console.error(`[P100] ${desc} error:`, e);
            return null;
        } finally {
            setLoading(false);
        }
    }

    // ======================= 2. 데이터 로드 =======================

    async function loadSystemInfo() {
        // 1) 버전
        const ver = await fetchApi("/api/v001/version", "GET", null, "");
        if (ver && ver.fw) $("#fwVersion").textContent = ver.fw;

        // 2) 진단 [C-7]
        const diag = await fetchApi("/api/v001/diag", "GET", null, "");
        if (diag) {
            if (diag.heap != null) {
                $("#heapFree").textContent = (diag.heap / 1024).toFixed(1) + " KB";
            }
            if (diag.fs_used != null && diag.fs_total != null) {
                $("#fsUsed").textContent =
                    (diag.fs_used / 1024).toFixed(0) + " / " + (diag.fs_total / 1024).toFixed(0) + " KB";
            }
        }

        // 3) WiFi 상태 [C-6]
        const wifiData = await fetchApi("/api/v001/wifi/state", "GET", null, "");
        if (wifiData && wifiData.wifi && wifiData.wifi.state) {
            const w = wifiData.wifi.state;
            $("#netMode").textContent   = w.mode_name || "-";
            $("#ipAddress").textContent = w.ip || "-";
            $("#wifiSsid").textContent  = w.ssid || "-";
        }

        // 4) 시스템 설정
        const sys = await fetchApi("/api/v001/system", "GET", null, "");
        if (sys) {
            // 일반
            if (sys.meta && $("#deviceName")) $("#deviceName").value = sys.meta.deviceName || "";
            if (sys.meta && $("#lastUpdate")) $("#lastUpdate").textContent = sys.meta.lastUpdate || "-";
            if (sys.system && sys.system.logging && $("#logLevel")) {
                $("#logLevel").value = sys.system.logging.level || "INFO";
            }

            // 팬 커브
            if (sys.hw && sys.hw.fanConfig) {
                if ($("#startPercentMin"))   $("#startPercentMin").value   = sys.hw.fanConfig.startPercentMin;
                if ($("#comfortPercentMin")) $("#comfortPercentMin").value = sys.hw.fanConfig.comfortPercentMin;
                if ($("#comfortPercentMax")) $("#comfortPercentMax").value = sys.hw.fanConfig.comfortPercentMax;
                if ($("#hardPercentMax"))    $("#hardPercentMax").value    = sys.hw.fanConfig.hardPercentMax;
            }

            // 하드웨어
            if (sys.hw) {
                if (sys.hw.fanPwm) {
                    if ($("#hwFanPin"))     $("#hwFanPin").value     = sys.hw.fanPwm.pin;
                    if ($("#hwFanChannel")) $("#hwFanChannel").value = sys.hw.fanPwm.channel;
                    if ($("#hwFanFreq"))    $("#hwFanFreq").value    = sys.hw.fanPwm.freq;
                    if ($("#hwFanRes"))     $("#hwFanRes").value     = sys.hw.fanPwm.res;
                }
                if (sys.hw.pir) {
                    if ($("#hwPirEnabled"))  $("#hwPirEnabled").checked = !!sys.hw.pir.enabled;
                    if ($("#hwPirPin"))      $("#hwPirPin").value       = sys.hw.pir.pin;
                    if ($("#hwPirDebounce")) $("#hwPirDebounce").value  = sys.hw.pir.debounceSec;
                    if ($("#hwPirHold"))     $("#hwPirHold").value      = sys.hw.pir.holdSec;
                }
                if (sys.hw.tempHum) {
                    if ($("#hwThEnabled"))  $("#hwThEnabled").checked = !!sys.hw.tempHum.enabled;
                    if ($("#hwThPin"))      $("#hwThPin").value       = sys.hw.tempHum.pin;
                    if ($("#hwThType"))     $("#hwThType").value      = sys.hw.tempHum.type || "DHT22";
                    if ($("#hwThInterval")) $("#hwThInterval").value  = sys.hw.tempHum.intervalSec;
                }
                if (sys.hw.led) {
                    if ($("#hwLedPin"))        $("#hwLedPin").value        = sys.hw.led.pin;
                    if ($("#hwLedNumPixels"))  $("#hwLedNumPixels").value  = sys.hw.led.numPixels;
                    if ($("#hwLedBrightness")) $("#hwLedBrightness").value = sys.hw.led.defaultBrightness;
                }
            }

            // 시간 [C-2]
            if (sys.timeCfg) {
                if ($("#ntpServer"))        $("#ntpServer").value        = sys.timeCfg.ntpServer || "pool.ntp.org";
                if ($("#timezoneOffset"))   $("#timezoneOffset").value   = sys.timeCfg.timezone || "Asia/Seoul";
                if ($("#syncIntervalMin"))  $("#syncIntervalMin").value  = sys.timeCfg.syncIntervalMin || 60;
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
                    if ($("#wsChartLargeBytes"))  $("#wsChartLargeBytes").value  = ws.wsEtcConfig.chartLargeBytes;
                    if ($("#wsChartThrottleMul")) $("#wsChartThrottleMul").value = ws.wsEtcConfig.chartThrottleMul;
                    if ($("#wsCleanupMs"))        $("#wsCleanupMs").value        = ws.wsEtcConfig.wsCleanupMs;
                }
            }
            
            // Security
            if (sys.security) {
                if ($("#geminiApiKey") && sys.security.geminiApiKey) {
                    $("#geminiApiKey").value = sys.security.geminiApiKey;
                }
            }

        }

        // 5) Motion (런타임 PIR + timing)
        const motion = await fetchApi("/api/v001/motion", "GET", null, "");
        if (motion && motion.motion) {
            if (motion.motion.pir) {
                if ($("#motionPirEnabled")) $("#motionPirEnabled").checked = !!motion.motion.pir.enabled;
                if ($("#motionPirHold"))    $("#motionPirHold").value      = motion.motion.pir.holdSec;
            }
            if (motion.motion.timing) {
                if ($("#motionSimInterval"))     $("#motionSimInterval").value     = motion.motion.timing.simIntervalMs;
                if ($("#motionGustInterval"))    $("#motionGustInterval").value    = motion.motion.timing.gustIntervalMs;
                if ($("#motionThermalInterval")) $("#motionThermalInterval").value = motion.motion.timing.thermalIntervalMs;
            }
        }

        // 6) Dirty 상태
        const dirty = await fetchApi("/api/v001/config/dirty", "GET", null, "");
        if (dirty) {
            const hasDirty = dirty.system || dirty.wifi || dirty.motion ||
                             dirty.schedules || dirty.userProfiles || dirty.windDict ||
                             dirty.nvsSpec || dirty.webPage;
            const statusEl = $("#configDirtyStatus");
            if (statusEl) {
                statusEl.textContent = hasDirty ? "📝 변경됨 (저장 필요)" : "✅ 저장됨";
                statusEl.className = hasDirty ? "info-label warn" : "info-label ok";
            }
        }

        // 7) API Key 상태
        const st = $("#apiKeyStatus");
        if (st) {
            st.textContent = getKey() ? "저장됨 (확인 필요)" : "설정 필요";
            st.className = getKey() ? "info-label warn" : "info-label err";
        }
        
        await checkAuth();
        await loadLogs();
    }

    // 로그 [C-8]
    async function loadLogs() {
        const viewer = $("#logViewer");
        if (!viewer) return;

        const data = await fetchApi("/api/v001/logs", "GET", null, "");
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

    // ======================= 3. API Key =======================

    function openApiKeyModal() {
        const el = $("#newApiKey");
        if (el) el.value = getKey();
        const m = $("#apiKeyModal");
        if (m) m.style.display = "flex";
    }

    function closeApiKeyModal() {
        const m = $("#apiKeyModal");
        if (m) m.style.display = "none";
    }

    async function saveApiKey(event) {
        event.preventDefault();
        const newKey = $("#newApiKey").value.trim();
        setKey(newKey);
        showToast(newKey ? "API Key가 저장되었습니다." : "API Key가 삭제되었습니다.", newKey ? "ok" : "warn");
        closeApiKeyModal();
        await checkAuth();
    }

    // [C-5] /auth/test 응답은 {"result":"authorized"} / {"result":"unauthorized"}
    async function checkAuth() {
        const result = await fetchApi("/api/v001/auth/test", "GET", null, "");
        const statusEl = $("#apiKeyStatus");
        if (!statusEl) return;

        if (result && result.result === "authorized") {
            statusEl.textContent = "✅ 인증 성공";
            statusEl.className = "info-label ok";
        } else if (getKey()) {
            statusEl.textContent = "인증 실패 (키 만료/오류)";
            statusEl.className = "info-label err";
        } else {
            statusEl.textContent = "설정 필요";
            statusEl.className = "info-label warn";
        }
    }

    // ======================= 4. 장치 제어 =======================

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

        const result = await fetchApi(url, "POST", null, target.textContent.trim());
        if (result) {
            showToast(successMsg, "warn");
            if (target.id === "btnReboot" || target.id === "btnFactoryReset") {
                setTimeout(() => window.location.reload(), 5000);
            } else if (target.id === "btnConfigSave") {
                await loadSystemInfo();
            }
        }
    }

    // ======================= 5. 설정 저장 =======================

    // 네트워크 설정 저장 [C-4]
    async function saveNetworkSettings(event) {
        event.preventDefault();
        const ssid = $("#networkSsid").value.trim();
        const password = $("#networkPassword").value;
        const mode = parseInt($("#networkMode").value, 10);

        if (!ssid && (mode === 1 || mode === 2)) {
            showToast("STA 모드 설정 시 SSID는 필수입니다.", "err");
            return;
        }

        const payload = { wifi: { wifiMode: mode } };

        if (mode === 1 || mode === 2) {
            payload.wifi.sta = [{ ssid, pass: password }];
        }
        if (mode === 0 || mode === 2) {
            payload.wifi.ap = { ssid, pass: password };
        }

        const result = await fetchApi("/api/v001/wifi/config", "POST", payload, "네트워크 설정 저장");

        if (result) {
            showToast("네트워크 설정이 저장되었습니다. 재접속을 시도합니다.", "warn");
            closeNetworkSetupModal();
            setTimeout(() => window.location.reload(), 5000);
        }
    }

    // 시간 설정 저장 [C-2 + C-3]
    async function saveTimeSettings(event) {
        event.preventDefault();
        const ntpServer = $("#ntpServer").value.trim();
        const timezone = $("#timezoneOffset").value;
        const syncIntervalMin = parseInt($("#syncIntervalMin").value, 10) || 60;

        if (!ntpServer || !timezone) {
            showToast("유효한 NTP 서버 주소와 시간대를 입력하세요.", "err");
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
        const result = await fetchApi("/api/v001/system/time/set", "POST", body, "시간 설정 저장");

        if (result) {
            showToast("시간 설정이 저장되고 적용되었습니다.", "ok");
            closeTimeSetupModal();
            await loadSystemInfo();
        }
    }

    // 일반 설정 저장
    async function saveGeneralSettings(event) {
        event.preventDefault();
        const deviceName = $("#deviceName").value.trim();
        const logLevel = $("#logLevel").value;

        const body = {
            meta: { deviceName },
            system: { logging: { level: logLevel } }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "일반 설정 저장");
        if (result) {
            showToast("일반 설정이 저장되었습니다. (런타임 반영은 재부팅 후)", "warn");
            await loadSystemInfo();
        }
    }
    
    // Gemini API Key 저장
    async function saveGeminiApiKey() {
        const key = $("#geminiApiKey").value.trim();
        
        const body = {
            security: { geminiApiKey: key }
        };
        
        const result = await fetchApi("/api/v001/system", "POST", body, "Gemini Key 저장");
        if (result) {
            showToast("Gemini API Key가 저장되었습니다.", "ok");
            await loadSystemInfo();
        }
    }


    // 팬 커브 저장
    async function saveFanConfig(event) {
        event.preventDefault();
        const body = {
            hw: {
                fanConfig: {
                    startPercentMin:   parseInt($("#startPercentMin").value, 10),
                    comfortPercentMin: parseInt($("#comfortPercentMin").value, 10),
                    comfortPercentMax: parseInt($("#comfortPercentMax").value, 10),
                    hardPercentMax:    parseInt($("#hardPercentMax").value, 10)
                }
            }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "팬 설정 저장");
        if (result) {
            showToast("팬 제어 한계 설정이 적용되었습니다.", "ok");
            await loadSystemInfo();
        }
    }

    // 하드웨어 설정 저장 [C-9 BLE 제거 + LED 추가]
    async function saveHwSettings(event) {
        event.preventDefault();
        const body = {
            hw: {
                fanPwm: {
                    pin:     parseInt($("#hwFanPin").value, 10),
                    channel: parseInt($("#hwFanChannel").value, 10),
                    freq:    parseInt($("#hwFanFreq").value, 10),
                    res:     parseInt($("#hwFanRes").value, 10)
                },
                pir: {
                    enabled:     $("#hwPirEnabled").checked,
                    pin:         parseInt($("#hwPirPin").value, 10),
                    debounceSec: parseInt($("#hwPirDebounce").value, 10),
                    holdSec:     parseInt($("#hwPirHold").value, 10)
                },
                tempHum: {
                    enabled:     $("#hwThEnabled").checked,
                    pin:         parseInt($("#hwThPin").value, 10),
                    type:        $("#hwThType").value,
                    intervalSec: parseInt($("#hwThInterval").value, 10)
                },
                led: {
                    pin:               parseInt($("#hwLedPin").value, 10),
                    numPixels:         parseInt($("#hwLedNumPixels").value, 10),
                    defaultBrightness: parseInt($("#hwLedBrightness").value, 10)
                }
            }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "하드웨어 설정 저장");
        if (result) {
            showToast("하드웨어 설정이 저장되었습니다. (핀 변경 시 재부팅 권장)", "warn");
            await loadSystemInfo();
        }
    }

    // Motion 저장
    async function saveMotionSettings(event) {
        event.preventDefault();
        const body = {
            motion: {
                pir: {
                    enabled: $("#motionPirEnabled").checked,
                    holdSec: parseInt($("#motionPirHold").value, 10)
                },
                timing: {
                    simIntervalMs:     parseInt($("#motionSimInterval").value, 10),
                    gustIntervalMs:    parseInt($("#motionGustInterval").value, 10),
                    thermalIntervalMs: parseInt($("#motionThermalInterval").value, 10)
                }
            }
        };

        const result = await fetchApi("/api/v001/motion", "POST", body, "Motion 설정 저장");
        if (result) {
            showToast("Motion 설정이 저장되었습니다.", "ok");
            await loadSystemInfo();
        }
    }

    // WebSocket 정책 저장 [D-6]
    async function saveWsConfig(event) {
        event.preventDefault();

        const wsChConfig = [
            {
                chIdx: 0,
                chIntervalMs: parseInt($("#wsChStateInterval").value, 10),
                priority:     parseInt($("#wsChStatePriority").value, 10)
            },
            {
                chIdx: 1,
                chIntervalMs: parseInt($("#wsChMetricsInterval").value, 10),
                priority:     parseInt($("#wsChMetricsPriority").value, 10)
            },
            {
                chIdx: 2,
                chIntervalMs: parseInt($("#wsChChartInterval").value, 10),
                priority:     parseInt($("#wsChChartPriority").value, 10)
            },
            {
                chIdx: 3,
                chIntervalMs: parseInt($("#wsChSummaryInterval").value, 10),
                priority:     parseInt($("#wsChSummaryPriority").value, 10)
            }
        ];

        const body = {
            system: {
                webSocket: {
                    wsChConfig: wsChConfig,
                    wsEtcConfig: {
                        chartLargeBytes:  parseInt($("#wsChartLargeBytes").value, 10),
                        chartThrottleMul: parseInt($("#wsChartThrottleMul").value, 10),
                        wsCleanupMs:      parseInt($("#wsCleanupMs").value, 10)
                    }
                }
            }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "WebSocket 정책 저장");
        if (result) {
            showToast("WebSocket 정책이 저장되었습니다. (3초 내 반영)", "ok");
            await loadSystemInfo();
        }
    }

    // WiFi 스캔
    async function scanWifi() {
        const listEl = $("#wifiList");
        const resultsEl = $("#wifiScanResults");
        if (!listEl || !resultsEl) return;

        listEl.innerHTML = "<li>검색 중...</li>";
        resultsEl.style.display = "block";

        const data = await fetchApi("/api/v001/wifi/scan", "GET", null, "WiFi 검색");
        if (data && data.wifi && data.wifi.scan) {
            listEl.innerHTML = "";
            if (data.wifi.scan.length === 0) {
                listEl.innerHTML = "<li>찾은 네트워크가 없습니다.</li>";
            } else {
                data.wifi.scan.forEach(net => {
                    const li = document.createElement("li");
                    li.innerHTML = `<span>${net.ssid || ""}</span> <span class="rssi-label">${net.rssi || "?"} dBm</span>`;
                    li.onclick = () => {
                        const s = $("#networkSsid");
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

        const result = await fetchApi("/api/v001/reload", "POST", null, "설정 새로고침");
        if (result) {
            showToast("설정이 다시 로드되었습니다.", "ok");
            await loadSystemInfo();
        }
    }

    // 펌웨어 확인
    async function checkFirmwareUpdate() {
        showToast("펌웨어 업데이트 서버 확인 중...", "info");
        const data = await fetchApi("/api/v001/system/firmware/check", "GET", null, "");

        if (data && data.status === "available") {
            showToast(`새 펌웨어 ${data.latest_version} 이 확인되었습니다.`, "warn");
        } else if (data && data.status === "latest") {
            showToast(`현재 최신 버전(${data.current_version})입니다.`, "ok");
        } else {
            showToast("펌웨어 업데이트 정보를 가져오지 못했습니다.", "err");
        }
    }

    // ======================= 6. 모달 =======================

    function openNetworkSetupModal() {
        const m = $("#networkModal");
        if (m) m.style.display = "flex";
    }
    function closeNetworkSetupModal() {
        const m = $("#networkModal");
        if (m) m.style.display = "none";
        const r = $("#wifiScanResults");
        if (r) r.style.display = "none";
    }

    function openTimeSetupModal() {
        const m = $("#timeModal");
        if (m) m.style.display = "flex";
    }
    function closeTimeSetupModal() {
        const m = $("#timeModal");
        if (m) m.style.display = "none";
    }

    // ======================= 7. 이벤트 바인딩 =======================

    function bindEvents() {
        // API Key
        $("#btnSetApiKey")?.addEventListener("click", openApiKeyModal);
        $("#btnCheckAuth")?.addEventListener("click", checkAuth);
        $("#apiKeyForm")?.addEventListener("submit", saveApiKey);
        $("#btnCloseApiKeyModal")?.addEventListener("click", closeApiKeyModal);
        $("#btnCancelApiKeyModal")?.addEventListener("click", closeApiKeyModal);
        
        // Gemini Key
        $("#btnSaveGeminiKey")?.addEventListener("click", saveGeminiApiKey);

        // 장치 제어
        $("#btnConfigSave")?.addEventListener("click", handleDeviceControl);
        $("#btnReboot")?.addEventListener("click", handleDeviceControl);
        $("#btnFactoryReset")?.addEventListener("click", handleDeviceControl);
        $("#btnReloadConfig")?.addEventListener("click", reloadConfig);

        // 정보
        $("#btnCheckUpdate")?.addEventListener("click", checkFirmwareUpdate);
        $("#btnRefreshInfo")?.addEventListener("click", loadSystemInfo);
        $("#btnRefreshLogs")?.addEventListener("click", loadLogs);

        // 폼
        $("#generalSystemForm")?.addEventListener("submit", saveGeneralSettings);
        $("#fanConfigForm")?.addEventListener("submit", saveFanConfig);
        $("#hwConfigForm")?.addEventListener("submit", saveHwSettings);
        $("#motionForm")?.addEventListener("submit", saveMotionSettings);
        $("#wsConfigForm")?.addEventListener("submit", saveWsConfig);

        // 모달
        $("#btnNetworkSetup")?.addEventListener("click", openNetworkSetupModal);
        $("#networkForm")?.addEventListener("submit", saveNetworkSettings);
        $("#btnCloseNetworkModal")?.addEventListener("click", closeNetworkSetupModal);
        $("#btnCancelNetworkModal")?.addEventListener("click", closeNetworkSetupModal);
        $("#btnWifiScan")?.addEventListener("click", scanWifi);

        $("#btnTimeSetup")?.addEventListener("click", openTimeSetupModal);
        $("#timeForm")?.addEventListener("submit", saveTimeSettings);
        $("#btnCloseTimeModal")?.addEventListener("click", closeTimeSetupModal);
        $("#btnCancelTimeModal")?.addEventListener("click", closeTimeSetupModal);
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindEvents();
        loadSystemInfo();
    });

})();
