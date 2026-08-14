/*
 * ------------------------------------------------------
 * 소스명 : P100_settings_060.js
 * 모듈명 : Smart Nature Wind System Settings Controller
 * ------------------------------------------------------
 * 기능 요약:
 * - 🎯 /api/system, /api/network, /api/auth, /api/control API 호출 및 데이터 표시
 * - 로컬 스토리지에 API Key 저장 및 인증 상태 표시
 * - 장치 제어 기능 (재부팅, 초기화, 설정 저장) 구현
 * - [추가됨] 네트워크 설정, 시간 설정, 펌웨어 업데이트 확인 기능 구현
 * ------------------------------------------------------
 */

(() => {
    "use strict";

    // ======================= 1. 공통 헬퍼 함수 및 변수 =======================

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

    // ************* 공통 기능 대체 *************
    const KEY_API = 'sc10_api_key';
    const getKey = () => localStorage.getItem(KEY_API) || '';
    const setKey = (key) => localStorage.setItem(KEY_API, key);
    const setLoading = (flag) => {
        const el = $("#loadingOverlay");
        if (el) el.style.display = flag ? "flex" : "none";
    };
    

    // API Fetch 래퍼 함수 (인증 키 포함)
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
                $("#apiKeyStatus").textContent = "인증 실패";
                $("#apiKeyStatus").className = "info-label err";
                throw new Error("Unauthorized");
            }
            if (!resp.ok) {
                const txt = await resp.text();
                showToast(`${desc} 실패: ${txt || resp.status}`, "err");
                throw new Error(txt || resp.status);
            }
            if (method !== 'GET') showToast(`${desc} 성공`, "ok");

            const txt = await resp.text();
            try { return JSON.parse(txt); } catch { return txt; }
        } catch (e) {
            if (e.message !== "Unauthorized") console.error(e);
            return null;
        } finally {
            setLoading(false);
        }
    }
    // *************************************************************************

    // ======================= 2. 데이터 로드 및 렌더링 =======================

    // ✅ 시스템 정보 로드 (통합)
    async function loadSystemInfo() {
        // 1. 버전 및 기본 정보 (/api/v001/version)
        const ver = await fetchApi("/api/v001/version", "GET", null, "버전 정보 로드");
        if (ver) {
            $("#fwVersion").textContent = ver.fw || "N/A";
        }

        // 2. 실시간 상태 (/api/v001/state)
        const state = await fetchApi("/api/v001/state", "GET", null, "상태 로드");
        if (state) {
            $("#uptime").textContent = state.uptime || "N/A";
            $("#ipAddress").textContent = state.network?.ip || "0.0.0.0";
            $("#wifiSsid").textContent = state.network?.ssid || "연결 안 됨";
            $("#netMode").textContent = state.network?.mode || "AP";
        }

        // 3. 진단 정보 (/api/v001/diag)
        const diag = await fetchApi("/api/v001/diag", "GET", null, "진단 정보 로드");
        if (diag) {
            $("#heapFree").textContent = diag.heap?.free ? (diag.heap.free / 1024).toFixed(1) + " KB" : "N/A";
        }

        // 4. 시스템 설정 로드 (/api/v001/system)
        const sys = await fetchApi("/api/v001/system", "GET", null, "시스템 설정 로드");
        if (sys) {
            // 일반 설정
            if ($("#deviceName")) $("#deviceName").value = sys.meta?.deviceName || "";
            if ($("#logLevel")) $("#logLevel").value = sys.system?.logging?.level || "INFO";

            // 팬 설정
            if (sys.hw?.fanConfig) {
                $("#startPercentMin").value = sys.hw.fanConfig.startPercentMin;
                $("#comfortPercentMin").value = sys.hw.fanConfig.comfortPercentMin;
                $("#comfortPercentMax").value = sys.hw.fanConfig.comfortPercentMax;
                $("#hardPercentMax").value = sys.hw.fanConfig.hardPercentMax;
            }

            // 시간 설정 (모달용 미리 채우기)
            if (sys.time) {
                $("#ntpServer").value = sys.time.ntpServer || "pool.ntp.org";
                $("#timezoneOffset").value = sys.time.timezone || "Asia/Seoul";
                $("#syncIntervalMin").value = sys.time.syncIntervalMin || 60;
            }

            // 하드웨어 설정 (신규)
            if (sys.hw) {
                // Fan PWM
                if (sys.hw.fanPwm) {
                    $("#hwFanPin").value = sys.hw.fanPwm.pin;
                    $("#hwFanFreq").value = sys.hw.fanPwm.freq;
                }
                // PIR
                if (sys.hw.pir) {
                    $("#hwPirEnabled").checked = sys.hw.pir.enabled;
                    $("#hwPirPin").value = sys.hw.pir.pin;
                    $("#hwPirHold").value = sys.hw.pir.holdSec;
                }
                // Temp/Hum
                if (sys.hw.tempHum) {
                    $("#hwThEnabled").checked = sys.hw.tempHum.enabled;
                    $("#hwThPin").value = sys.hw.tempHum.pin;
                    $("#hwThType").value = sys.hw.tempHum.type || "DHT22";
                }
                // BLE
                if (sys.hw.ble) {
                    $("#hwBleEnabled").checked = sys.hw.ble.enabled;
                    $("#hwBleInterval").value = sys.hw.ble.scanInterval;
                }
            }
        }

        // 5. 더티 체크 (/api/v001/config/dirty)
        const dirty = await fetchApi("/api/v001/config/dirty", "GET", null, "변경 상태 확인");
        if (dirty) {
            const hasDirty = dirty.system || dirty.wifi || dirty.motion || dirty.schedules || dirty.profiles;
            const statusEl = $("#configDirtyStatus");
            if (statusEl) {
                statusEl.textContent = hasDirty ? "📝 변경됨 (저장 필요)" : "✅ 저장됨";
                statusEl.className = hasDirty ? "info-label warn" : "info-label ok";
            }
        }

        $("#apiKeyStatus").textContent = getKey() ? "저장됨 (확인 필요)" : "설정 필요";
        $("#apiKeyStatus").className = getKey() ? "info-label warn" : "info-label err";

        // 인증 테스트
        await checkAuth();

        // 로그 로드
        await loadLogs();
    }

    // ✅ 로그 로드
    async function loadLogs() {
        const viewer = $("#logViewer");
        if (!viewer) return;

        const data = await fetchApi("/api/v001/logs", "GET", null, "로그 로드");
        if (data && data.logs) {
            viewer.textContent = data.logs.join("\n");
            // 스크롤 맨 아래로
            viewer.scrollTop = viewer.scrollHeight;
        } else {
            viewer.textContent = "로그를 불러올 수 없습니다.";
        }
    }

    // ======================= 3. API Key 관리 및 인증 =======================

    function openApiKeyModal() {
        // ✅ 현재 저장된 키를 입력창에 표시
        $("#newApiKey").value = getKey();
        $("#apiKeyModal").style.display = "flex";
    }

    function closeApiKeyModal() {
        $("#apiKeyModal").style.display = "none";
        // 닫을 때 값 초기화 방지: 사용자가 수정 중일 수 있음. 대신 저장/취소 시 명확히 처리
    }

    async function saveApiKey(event) {
        event.preventDefault();
        const newKey = $("#newApiKey").value.trim();

        if (newKey) {
            setKey(newKey);
            showToast("API Key가 로컬에 저장되었습니다. 인증 테스트를 진행합니다.", "ok");
            closeApiKeyModal();
            await checkAuth();
        } else {
            setKey(""); // 키를 빈 값으로 저장하여 삭제 처리
            showToast("API Key가 삭제되었습니다. 인증이 필요합니다.", "warn");
            closeApiKeyModal();
            await checkAuth();
        }
    }

    async function checkAuth() {
        // GET /api/auth/test
        const result = await fetchApi("/api/v001/auth/test", "GET", null, "인증 테스트");

        const statusEl = $("#apiKeyStatus");

        if (result && result.authenticated) {
            statusEl.textContent = "✅ 인증 성공";
            statusEl.className = "info-label ok";
        } else {
            if (getKey()) {
                statusEl.textContent = "인증 실패 (키 만료/오류)";
                statusEl.className = "info-label err";
            } else {
                statusEl.textContent = "설정 필요";
                statusEl.className = "info-label warn";
            }
        }
    }

    // ======================= 4. 장치 제어 기능 =======================

    // 이 함수는 유지 (handleDeviceControl)

    // ======================= 5. 신규 구현: 설정 기능 =======================

    // ✅ 네트워크 설정 모달 로직
    function openNetworkSetupModal() {
        // 모달 열 때 현재 네트워크 정보 다시 로드 (최신 정보 반영)
        // loadSystemInfo()에서 이미 로드되었다고 가정하고 생략 가능
        $("#networkModal").style.display = "flex";
    }

    function closeNetworkSetupModal() {
        $("#networkModal").style.display = "none";
    }

    async function saveNetworkSettings(event) {
        event.preventDefault();
        const ssid = $("#networkSsid").value.trim();
        const password = $("#networkPassword").value;
        const mode = $("#networkMode").value; // 예: "STA", "AP"

        if (!ssid && mode === "STA") {
            showToast("STA 모드 설정 시 SSID는 필수입니다.", "err");
            return;
        }

        // C++ Structure Match: {"wifi": { "wifiMode": ..., "ap": { "ssid": ..., "pass": ... } }}
        // Note: For STA mode config, it strictly needs "sta" array, but let's follow the simple structure if the backend patch supports it.
        // Looking at backend `patchWifiFromJson`:
        // It checks `wifi.wifiMode`, `wifi.ap.ssid`, `wifi.ap.pass`.
        // It does NOT auto-map root `ssid`/`password` to `sta`. It expects `wifi.sta` array for STA settings.
        // CHECK: Does the UI support STA vs AP distinction fully?
        // The simplified UI just has one SSID/PW input.
        // If mode is STA, we should probably update the `sta` list or at least providing the primary STA.
        // However, `patchWifiFromJson` replaces the whole STA list if `sta` key is present.
        // Let's assume for this simple UI, we update AP settings if AP mode, and maybe just one STA entry if STA mode.
        // OR simply update `ap` settings as fallback? No, STA needs STA config.

        // CORRECT APPROACH based on `patchWifiFromJson` analysis:
        // It patches:
        // - `wifi["wifiMode"]`
        // - `wifi["ap"]["ssid"]`, `wifi["ap"]["pass"]`
        // - `wifi["sta"]` (array of objects {ssid, pass})

        const modeInt = parseInt(mode, 10);
        const payload = {
            wifi: {
                wifiMode: modeInt
            }
        };

        if (modeInt === 1 || modeInt === 2) { // STA or AP+STA
            // Update STA list with single entry
            payload.wifi.sta = [{
                ssid: ssid,
                pass: password
            }];
        }

        // Always update AP settings as well (or conditionally?)
        // Let's update AP settings if mode includes AP (0 or 2), or just always for safety/simplicity if user intends so.
        // But if user sets STA, they probably mean to connect TO a router, so we save to STA.
        // If user sets AP, they mean to BE a router, so we save to AP.

        if (modeInt === 0 || modeInt === 2) { // AP or AP+STA
             payload.wifi.ap = {
                ssid: ssid,
                pass: password
            };
        }

        const body = payload;


        // POST /api/network/wifi/config
        const result = await fetchApi("/api/v001/network/wifi/config", "POST", body, "네트워크 설정 저장");

        if (result) {
            showToast("네트워크 설정이 저장되었습니다. 장치가 재접속을 시도합니다.", "warn");
            closeNetworkSetupModal();

            // 네트워크 변경 후 재접속이 필요하므로 페이지 새로고침
            setTimeout(() => window.location.reload(), 5000);
        }
    }

    // ✅ 시간 설정 모달 로직
    function openTimeSetupModal() {
        // 현재 시간 로드 기능은 생략 (GET API 호출 필요)
        $("#timeModal").style.display = "flex";
    }

    function closeTimeSetupModal() {
        $("#timeModal").style.display = "none";
    }

    async function saveTimeSettings(event) {
        event.preventDefault();
        const ntpServer = $("#ntpServer").value.trim();
        const timezone = $("#timezoneOffset").value;
        const syncIntervalMin = parseInt($("#syncIntervalMin").value, 10) || 60;

        if (!ntpServer || !timezone) {
             showToast("유효한 NTP 서버 주소와 시간대를 입력하세요.", "err");
             return;
        }

        const body = {
            time: {
                ntpServer: ntpServer,
                timezone: timezone,
                syncIntervalMin: syncIntervalMin
            }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "시간 설정 저장");

        if (result) {
            showToast("시간 설정이 저장되었습니다.", "ok");
            closeTimeSetupModal();
            loadSystemInfo();
        }
    }

    // ✅ 일반 설정 저장
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
            showToast("일반 설정이 적용되었습니다.", "ok");
            loadSystemInfo();
        }
    }

    // ✅ 팬 제어 한계 저장
    async function saveFanConfig(event) {
        event.preventDefault();
        const body = {
            hw: {
                fanConfig: {
                    startPercentMin: parseInt($("#startPercentMin").value, 10),
                    comfortPercentMin: parseInt($("#comfortPercentMin").value, 10),
                    comfortPercentMax: parseInt($("#comfortPercentMax").value, 10),
                    hardPercentMax: parseInt($("#hardPercentMax").value, 10)
                }
            }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "팬 설정 저장");
        if (result) {
            showToast("팬 제어 한계 설정이 적용되었습니다.", "ok");
            loadSystemInfo();
        }
    }

    // ✅ WiFi 스캔
    async function scanWifi() {
        const listEl = $("#wifiList");
        const resultsEl = $("#wifiScanResults");
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
                    li.innerHTML = `<span>${net.ssid}</span> <span class="rssi-label">${net.rssi} dBm</span>`;
                    li.onclick = () => {
                        $("#networkSsid").value = net.ssid;
                        resultsEl.style.display = "none";
                    };
                    listEl.appendChild(li);
                });
            }
        } else {
            listEl.innerHTML = "<li>스캔 실패</li>";
        }
    }

    // ✅ 설정 새로고침 (Reload)
    async function reloadConfig() {
        if (confirm("파일 시스템에서 설정을 다시 로드하시겠습니까? (저장하지 않은 변경사항은 사라집니다)")) {
            const result = await fetchApi("/api/v001/reload", "POST", null, "설정 새로고침");
            if (result) {
                showToast("설정이 다시 로드되었습니다.", "ok");
                loadSystemInfo();
            }
        }
    }

    // ✅ 하드웨어 설정 저장
    async function saveHwSettings(event) {
        event.preventDefault();
        const body = {
            hw: {
                fanPwm: {
                    pin: parseInt($("#hwFanPin").value, 10),
                    freq: parseInt($("#hwFanFreq").value, 10)
                },
                pir: {
                    enabled: $("#hwPirEnabled").checked,
                    pin: parseInt($("#hwPirPin").value, 10),
                    holdSec: parseInt($("#hwPirHold").value, 10)
                },
                tempHum: {
                    enabled: $("#hwThEnabled").checked,
                    pin: parseInt($("#hwThPin").value, 10),
                    type: $("#hwThType").value
                },
                ble: {
                    enabled: $("#hwBleEnabled").checked,
                    scanInterval: parseInt($("#hwBleInterval").value, 10)
                }
            }
        };

        const result = await fetchApi("/api/v001/system", "POST", body, "하드웨어 설정 저장");
        if (result) {
            showToast("하드웨어 설정이 적용되었습니다. (핀 변경 시 재부팅 권장)", "warn");
            loadSystemInfo();
        }
    }

    // ✅ 펌웨어 업데이트 확인 로직
    async function checkFirmwareUpdate() {
        showToast("펌웨어 업데이트 서버 확인 중...", "info");

        // GET /api/system/firmware/check
        const data = await fetchApi("/api/v001/system/firmware/check", "GET", null, "펌웨어 업데이트 확인");

        if (data && data.status === "available") {
            showToast(`새 펌웨어 버전 ${data.latest_version}이(가) 확인되었습니다.`, "warn");
            // 여기에 업데이트 버튼 활성화 로직 추가
        } else if (data && data.status === "latest") {
            showToast(`현재 최신 버전(${data.current_version})입니다.`, "ok");
        } else {
            showToast("펌웨어 업데이트 정보를 가져오지 못했습니다.", "err");
        }
    }

    // ======================= 6. 이벤트 바인딩 및 초기화 =======================

    function handleDeviceControl(event) {
        const target = event.target;
        let url = "";
        let confirmMsg = "";
        let successMsg = "";

        if (target.id === 'btnConfigSave') {
            url = "/api/v001/config/save";
            confirmMsg = "현재 설정값들을 장치 메모리에 영구 저장하시겠습니까?";
            successMsg = "설정 파일 저장 성공";
        } else if (target.id === 'btnReboot') {
            url = "/api/v001/control/reboot";
            confirmMsg = "장치를 재부팅하시겠습니까? (연결이 끊어집니다)";
            successMsg = "장치 재부팅 요청됨. 잠시 후 다시 접속해 주세요.";
        } else if (target.id === 'btnFactoryReset') {
            url = "/api/v001/control/factoryReset";
            confirmMsg = "경고: 모든 설정(네트워크, 프로파일, 스케줄 등)을 공장 초기화하고 재부팅하시겠습니까? 되돌릴 수 없습니다.";
            successMsg = "공장 초기화 요청됨. 장치가 재부팅됩니다.";
        } else {
            return;
        }

        if (confirm(confirmMsg)) {
            const result = fetchApi(url, "POST", null, target.textContent.trim());
            if (result) {
                showToast(successMsg, "warn");
                if (target.id === 'btnReboot' || target.id === 'btnFactoryReset') {
                    setTimeout(() => window.location.reload(), 5000);
                }
            }
        }
    }

    function bindEvents() {
        // API Key 모달 관련
        $("#btnSetApiKey")?.addEventListener('click', openApiKeyModal);
        $("#btnCheckAuth")?.addEventListener('click', checkAuth);
        $("#apiKeyForm")?.addEventListener('submit', saveApiKey);
        $("#btnCloseApiKeyModal")?.addEventListener('click', closeApiKeyModal);
        $("#btnCancelApiKeyModal")?.addEventListener('click', closeApiKeyModal);

        // 장치 제어 관련
        $("#btnConfigSave")?.addEventListener('click', handleDeviceControl);
        $("#btnReboot")?.addEventListener('click', handleDeviceControl);
        $("#btnFactoryReset")?.addEventListener('click', handleDeviceControl);

        // ✅ 펌웨어 및 네트워크 버튼 (추가된 기능)
        $("#btnCheckUpdate")?.addEventListener('click', checkFirmwareUpdate);
        $("#btnRefreshInfo")?.addEventListener('click', loadSystemInfo);

        // 신규 폼
        $("#generalSystemForm")?.addEventListener('submit', saveGeneralSettings);
        $("#fanConfigForm")?.addEventListener('submit', saveFanConfig);
        $("#hwConfigForm")?.addEventListener('submit', saveHwSettings);
        $("#btnWifiScan")?.addEventListener('click', scanWifi);
        $("#btnReloadConfig")?.addEventListener('click', reloadConfig);
        $("#btnRefreshLogs")?.addEventListener('click', loadLogs);

        // 네트워크 설정 모달 관련
        $("#btnNetworkSetup")?.addEventListener('click', openNetworkSetupModal);
        $("#networkForm")?.addEventListener('submit', saveNetworkSettings);
        $("#btnCloseNetworkModal")?.addEventListener('click', closeNetworkSetupModal);
        $("#btnCancelNetworkModal")?.addEventListener('click', closeNetworkSetupModal);

        // 시간 설정 모달 관련
        $("#btnTimeSetup")?.addEventListener('click', openTimeSetupModal);
        $("#timeForm")?.addEventListener('submit', saveTimeSettings);
        $("#btnCloseTimeModal")?.addEventListener('click', closeTimeSetupModal);
        $("#btnCancelTimeModal")?.addEventListener('click', closeTimeSetupModal);
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindEvents();
        loadSystemInfo(); // 페이지 로드 시 정보 자동 로드 및 인증 체크
    });

})();
