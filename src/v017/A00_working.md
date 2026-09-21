Round 4-A + 4-B 진행 (7건, #11 제외)

📋 진행 항목

# 항목 파일
1 프리셋 설명 툴팁 P010 HTML/JS
3 API Key 상태 배지 P010 HTML/JS
4 저장 상태 통합 배지 P010 HTML/JS
6 에러 메시지 사용자화 P000_common_070.js
7 로그 레벨 필터 P010 HTML/JS
9 설정 다운로드 P100 HTML/JS
13 펌웨어 업데이트 배지 P010 HTML/JS

---

📄 1. P000_common_070.js — apiFetch 함수 교체

기존 apiFetch 함수를 다음으로 전체 교체:

```js
/**
 * 공통 fetch 래퍼 (v2 — 사용자 친화적 에러 메시지)
 * @param {string} url - API URL
 * @param {object} [options] - fetch 옵션 (method, body 등)
 * @param {boolean} [silent=false] - true면 성공/실패 토스트 표시 안 함
 * @param {string} [desc=""] - 동작 설명 (토스트에 표시)
 */
async function apiFetch(url, options = {}, silent = false, desc = "") {
    showLoading();
    try {
        const headers = new Headers(options.headers || {});
        headers.set("Accept", "application/json");
        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }
        const apiKey = getApiKey();
        if (apiKey) headers.set("X-API-Key", apiKey);

        // 네트워크 레벨 오류 분리
        let resp;
        try {
            resp = await fetch(url, { ...options, headers });
        } catch (networkErr) {
            console.error("[apiFetch] network error:", networkErr);
            if (!silent) notify(`네트워크 연결을 확인하세요. (${desc || "요청"})`, "err");
            return null;
        }

        const text = await resp.text();

        // ─── HTTP 상태별 사용자 메시지 ───
        if (resp.status === 401) {
            if (!silent) notify(`${desc || "요청"} 실패: 인증이 필요합니다. (API Key를 확인하세요)`, "err");
            throw new Error("Unauthorized");
        }
        if (resp.status === 403) {
            if (!silent) notify(`${desc || "요청"} 실패: 접근 권한이 없습니다.`, "err");
            throw new Error("Forbidden");
        }
        if (resp.status === 404) {
            if (!silent) notify(`${desc || "요청"} 실패: 요청한 기능을 찾을 수 없습니다.`, "err");
            throw new Error("Not Found");
        }
        if (resp.status === 413) {
            if (!silent) notify(`${desc || "요청"} 실패: 파일 크기가 너무 큽니다.`, "err");
            throw new Error("Payload Too Large");
        }
        if (resp.status === 429) {
            if (!silent) notify(`${desc || "요청"} 실패: 너무 자주 요청했습니다. 잠시 후 다시 시도하세요.`, "err");
            throw new Error("Rate Limited");
        }
        if (resp.status >= 500) {
            if (!silent) notify(`${desc || "요청"} 실패: 서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.`, "err");
            throw new Error("Server Error " + resp.status);
        }
        if (!resp.ok) {
            // 기타 4xx — 서버가 보낸 error 필드 사용 시도
            let userMsg = "";
            try {
                const parsed = JSON.parse(text);
                userMsg = parsed.error || parsed.message || "";
            } catch {}
            const displayMsg = userMsg ? `: ${userMsg}` : "";
            if (!silent) notify(`${desc || "요청"} 실패${displayMsg}`, "err");
            throw new Error(text || String(resp.status));
        }

        if (desc && !silent) notify(`${desc} 성공`, "ok");
        try { return text ? JSON.parse(text) : null; } catch { return text; }
    } catch (e) {
        // 이미 위에서 개별 메시지 처리된 케이스는 중복 표시 방지
        const quiet = ["Unauthorized", "Forbidden", "Not Found", "Payload Too Large", "Rate Limited"];
        const isServerErr = e.message && e.message.startsWith("Server Error");
        if (!silent && !quiet.includes(e.message) && !isServerErr) {
            notify(`${desc || "요청"} 실패: ${e.message}`, "err");
        }
        return null;
    } finally {
        hideLoading();
    }
}
```

---

📄 2. P010_main_071.html — 완성본

```html
<!-- P010_main_071.html -->

<!doctype html>
<html lang="ko">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<title>🌿 Smart Nature Wind 관리자</title>

	<link rel="stylesheet" href="./P000_common_070.css">
	<link rel="stylesheet" href="./P010_main_071.css">
</head>

<body>
	<nav class="nav-bar">
		<div class="nav-container">
			<a class="nav-logo" href="/html_v3/P010_main_071.html">Smart Nature Wind</a>
			<ul class="nav-menu" id="navMenu"></ul>
		</div>
	</nav>

	<div class="wrap">
		<h1>
			Smart Nature Wind - Main
			<span class="info-label info" id="fwVer">FW …</span>
			<a id="apiKeyBadge" href="/P100_settings_071.html" class="info-label err" style="display:none; text-decoration:none;">🔑 API Key 미설정</a>
			<a id="fwUpdateBadge" href="/P100_settings_071.html" class="info-label warn" style="display:none; text-decoration:none;">⬆️ 새 펌웨어</a>
		</h1>

		<div class="grid">

			<!-- 1. 상태 -->
			<section class="card col-12">
				<div class="row middle">
					<div class="section-title">상태</div>
					<div class="right">
						<span id="saveStatusBadge" class="info-label info">저장됨</span>
						<span id="overrideBadge" class="info-label warn" style="display:none;">🟡 임시 적용 중 — 저장 안 됨</span>
						<span id="timeBadge" class="info-label err" style="display:none;">시간 미동기</span>
						<button class="btn" id="btnRefresh">상태 새로고침</button>
					</div>
				</div>

				<div class="grid">
					<div class="col-6">
						<div class="row tight"><div><label>시뮬 상태</label><span id="simActive" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>Phase</label><span id="phase" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>풍속(m/s)</label><span id="wind" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>PWM</label><span id="pwm" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>제어 상태</label><span id="controlState" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>실행 대상</label><span id="runTarget" class="info-label info">-</span></div></div>
					</div>
					<div class="col-6">
						<div class="row tight"><div><label>Wi-Fi 모드</label><span id="wifiMode" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>SSID</label><span id="curSsid" class="info-label info">-</span></div></div>
						<div class="row tight"><div><label>IP</label><span id="ip" class="info-label info">-</span></div></div>
					</div>
				</div>
			</section>

			<!-- 2. 프로파일 실행 -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">🎯 프로파일 실행</strong>
					<div class="right">
						<span id="profileRunStatus" class="info-label info">비활성</span>
					</div>
				</div>
				<p class="muted">
					저장된 유저 프로파일을 즉시 실행합니다. 실행 중에는 스케줄보다 우선 적용됩니다.
				</p>
				<div class="grid">
					<div class="col-6">
						<label>프로파일 선택</label>
						<select id="profileSelect"></select>
					</div>
					<div class="col-6" style="justify-content:flex-end; display:flex; align-items:flex-end; gap:8px;">
						<button class="btn ok" id="btnProfileRun">▶️ 실행</button>
						<button class="btn err" id="btnProfileStop">⏹️ 중지</button>
					</div>
				</div>
			</section>

			<!-- 3. 풍속 설정 -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">풍속 설정</strong>
					<div class="right">
						<span id="overrideStatus" class="info-label info">비활성</span>
					</div>
				</div>

				<div class="grid">
					<div class="col-4">
						<label>프리셋 <span class="muted">(선택 시 값 자동 채움)</span></label>
						<select id="preset"></select>
						<div id="presetDesc" class="preset-desc muted"></div>
					</div>
					<div class="col-4">
						<label>스타일</label>
						<select id="style"></select>
					</div>
					<div class="col-4">
						<label>팬 전원</label>
						<label class="row tight" style="align-items:center; gap:8px;">
							<input type="checkbox" id="fanPowerEnabled" checked>
							<span>On (해제 시 즉시 정지)</span>
						</label>
					</div>
				</div>

				<div class="grid" style="margin-top:16px;">
					<div class="col-6"><label>강도 (intensity %)</label><input type="number" id="intensity" min="0" max="100" step="0.01"></div>
					<div class="col-6"><label>돌풍 빈도 (gust_freq %)</label><input type="number" id="gust_freq" min="0" max="100" step="0.01"></div>
					<div class="col-6"><label>가변성 (variability %)</label><input type="number" id="variability" min="0" max="100" step="0.01"></div>
					<div class="col-6"><label>팬 최대 (fanLimit %)</label><input type="number" id="fanLimit" min="0" max="100" step="0.01"></div>
					<div class="col-6"><label>팬 최소 (minFan %)</label><input type="number" id="minFan" min="0" max="100" step="0.01"></div>
					<div class="col-6"><label>난류 길이 스케일 (turb_len)</label><input type="number" id="turb_len" min="1" max="200" step="0.01"></div>
					<div class="col-6"><label>난류 시그마 (turb_sig)</label><input type="number" id="turb_sig" min="0" max="5" step="0.01"></div>
					<div class="col-6"><label>열기포 세기 (therm_str)</label><input type="number" id="therm_str" min="1" max="5" step="0.01"></div>
					<div class="col-6"><label>열기포 반경 (therm_rad)</label><input type="number" id="therm_rad" min="0" max="100" step="0.01"></div>
				</div>

				<!-- 임시 적용 -->
				<div style="margin-top:20px; padding-top:16px; border-top:1px dashed #e0e6ed;">
					<div class="row middle" style="margin-bottom:10px;">
						<strong>🎬 임시 적용 (저장 안 됨)</strong>
					</div>
					<p class="muted" style="margin-bottom:12px;">
						현재 폼 값을 선풍기에 즉시 반영합니다. 마음에 들면 "저장" 버튼을 누르세요.
					</p>
					<div class="grid">
						<div class="col-4">
							<label>실행 시간 (초, 0=기본 20분)</label>
							<input type="number" id="overrideSeconds" min="0" step="10" value="300">
						</div>
						<div class="col-4">
							<label>&nbsp;</label>
							<label class="row tight" style="align-items:center; gap:8px;">
								<input type="checkbox" id="overrideForever">
								<span>무제한 (중지까지)</span>
							</label>
						</div>
						<div class="col-4" style="justify-content:flex-end; display:flex; align-items:flex-end; gap:8px;">
							<button class="btn ok" id="btnApplyTemp">🎬 임시 적용</button>
							<button class="btn err" id="btnStopTemp">⏹️ 중지</button>
						</div>
					</div>
				</div>

				<!-- 저장 -->
				<div class="row middle" style="margin-top:20px; padding-top:16px; border-top:1px solid #e0e6ed;">
					<div></div>
					<div class="right" style="display:flex; gap:8px; flex-wrap:wrap;">
						<button class="btn ok" id="btnSaveSim">💾 풍속 설정 저장</button>
						<button class="btn warn" id="btnSaveAllConfig" style="background:#eab308;color:#fff;">저장되지 않음</button>
						<button class="btn err" id="btnConfigInit">시스템 전체 초기화</button>
					</div>
				</div>
			</section>

			<!-- 4. 타이밍 -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">타이밍 (TIMING)</strong>
					<div class="right"><button class="btn ok" id="btnSaveTiming">타이밍 (메모리 패치)</button></div>
				</div>
				<div class="grid">
					<div class="col-4"><label>시뮬 간격(ms)</label><input type="number" id="sim_int" min="10" step="1"></div>
					<div class="col-4"><label>돌풍 체크(ms)</label><input type="number" id="gust_int" min="10" step="1"></div>
					<div class="col-4"><label>열기포 체크(ms)</label><input type="number" id="thermal_int" min="10" step="1"></div>
				</div>
			</section>

			<!-- 5. Wi-Fi (AP) -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">Wi-Fi (AP 설정)</strong>
					<div class="right"><button class="btn ok" id="btnSaveWifiAP">AP (메모리 패치)</button></div>
				</div>
				<div class="grid">
					<div class="col-4">
						<label>Wi-Fi 모드</label>
						<select id="wifi_mode">
							<option value="0">AP</option>
							<option value="1">STA</option>
							<option value="2">AP+STA</option>
						</select>
					</div>
					<div class="col-4"><label>AP SSID</label><input id="ap_ssid"></div>
					<div class="col-4"><label>AP Password</label><input id="ap_password" type="password"></div>
				</div>
			</section>

			<!-- 6. Wi-Fi (STA) -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">Wi-Fi (STA 목록)</strong>
					<div class="right">
						<button class="btn" id="btnScan">스캔</button>
						<button class="btn ok" id="btnSaveWifiSTA">STA 목록 (메모리 패치)</button>
					</div>
				</div>
				<div class="grid">
					<div class="col-12"><div class="list" id="staList"></div></div>
					<div class="col-12">
						<div class="row tight">
							<select id="scanList" class="fill"></select>
							<input id="scanPass" type="password" placeholder="선택 SSID 비밀번호">
							<button class="btn" id="btnUseScan">추가</button>
						</div>
					</div>
				</div>
			</section>

			<!-- 7. PWM 하드웨어 -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">PWM 하드웨어</strong>
					<div class="right"><button class="btn ok" id="btnSavePWM">PWM (메모리 패치)</button></div>
				</div>
				<div class="grid">
					<div class="col-3"><label>PWM GPIO</label><input type="number" id="pwm_pin" min="0" max="48"></div>
					<div class="col-3"><label>채널</label><input type="number" id="pwm_channel" min="0" max="7"></div>
					<div class="col-3"><label>주파수(Hz)</label><input type="number" id="pwm_freq" min="25000" max="40000" step="500"></div>
					<div class="col-3"><label>해상도(bits)</label><input type="number" id="pwm_res" min="8" max="16"></div>
				</div>
			</section>

			<!-- 8. 보안(API Key) -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">보안(API Key)</strong>
					<div class="right"><button class="btn ok" id="btnSaveApiKey">API Key 저장</button></div>
				</div>
				<div class="grid">
					<div class="col-12">
						<input id="apiKeyInput" type="password" placeholder="Key 입력 또는 새 Key 설정">
						<p class="muted">브라우저 로컬에 저장됨, 요청 시 X-API-Key 헤더로 전송됩니다.</p>
					</div>
				</div>
			</section>

			<!-- 9. 파일 업로드 / OTA -->
			<section class="card col-12">
				<strong class="section-title">파일 업로드 / 펌웨어 OTA</strong>
				<div class="grid">
					<div class="col-6">
						<label>정적 파일 업로드</label>
						<div class="row tight">
							<input type="file" id="fileUpload">
							<button class="btn ok" id="btnUploadStatic">업로드</button>
						</div>
						<div id="uploadMsg" class="muted" style="margin-top:8px;"></div>
					</div>
					<div class="col-6">
						<label>펌웨어 OTA 업데이트</label>
						<div class="row tight">
							<input type="file" id="fileOTA">
							<button class="btn ok" id="btnUploadOTA">업데이트</button>
						</div>
						<div id="otaMsg" class="muted" style="margin-top:8px;"></div>
					</div>
				</div>
			</section>

			<!-- 10. 로그 콘솔 -->
			<section class="card col-12">
				<div class="row middle">
					<strong class="section-title">실시간 로그 콘솔 (/ws/log)</strong>
					<div class="right">
						<div class="log-filter-group">
							<button class="btn btn-small active" data-log-filter="all">전체</button>
							<button class="btn btn-small" data-log-filter="warn">WARN+</button>
							<button class="btn btn-small" data-log-filter="err">ERROR</button>
						</div>
						<button class="btn" id="btnClearLog">로그 지우기</button>
					</div>
				</div>
				<div id="logConsole" class="log-view">로그 로딩 중...</div>
			</section>

		</div>

		<hr class="hr" />
		<p class="muted">© 2540.kr SmartNatureWind</p>
	</div>

	<div id="loadingOverlay" style="display:none;"><div class="spinner"></div></div>
	<div id="toastContainer"></div>

	<script src="./P000_common_070.js" defer></script>
	<script src="./P001_API_070.js" defer></script>
	<script src="./P010_main_071.js" defer></script>
</body>
</html>
```

HTML 변경 5곳:

· 상단 배지 2개 (apiKeyBadge, fwUpdateBadge)
· 상태 카드에 saveStatusBadge
· 프리셋 select 아래 presetDesc
· 로그 콘솔 위 필터 버튼 3개
· 로그 콘솔 <pre> → <div class="log-view">

---

📄 3. P010_main_071.css — 파일 끝에 추가

```css
/* ======================= Round 4: 신규 UI ======================= */

/* 프리셋 설명 툴팁 (#1) */
.preset-desc {
  margin-top: 6px;
  padding: 6px 10px;
  background-color: #f7f9fb;
  border-left: 3px solid #3498db;
  border-radius: 4px;
  font-size: 0.85em;
  line-height: 1.4;
  color: #4a637a;
  min-height: 1.2em;
}
.preset-desc:empty { display: none; }

/* 로그 콘솔 (필터 대응, #7) */
.log-view {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 12px 15px;
  border-radius: 8px;
  max-height: 400px;
  min-height: 100px;
  overflow-y: auto;
  font-size: 0.85em;
  line-height: 1.5;
  font-family: monospace;
  white-space: pre-wrap;
}

.log-line {
  padding: 2px 0;
  border-bottom: 1px dotted rgba(236, 240, 241, 0.1);
}
.log-line:last-child { border-bottom: none; }

.log-line[data-level="1"] { color: #e74c3c; font-weight: 600; }  /* ERROR */
.log-line[data-level="2"] { color: #f1c40f; }                     /* WARN */
.log-line[data-level="3"] { color: #ecf0f1; }                     /* INFO */
.log-line[data-level="4"] { color: #95a5a6; }                     /* DEBUG */

.log-filter-group {
  display: inline-flex;
  gap: 4px;
  margin-right: 8px;
}
.log-filter-group .btn.active {
  background-color: #3498db;
  color: #fff;
  border-color: #2980b9;
}

/* 저장 상태 배지 (#4) */
#saveStatusBadge {
  margin-right: 6px;
}
```

---

📄 4. P010_main_071.js — 완성본

```js
/* P010_main_071.js
 * ------------------------------------------------------
 * 모듈명 : Smart Nature Wind Main UI Logic (v025)
 * ------------------------------------------------------
 * [v025] Round 4-A/B 반영
 *  - #1 프리셋 설명 툴팁
 *  - #3 API Key 상태 배지
 *  - #4 저장 상태 통합 배지
 *  - #7 로그 레벨 필터
 *  - #13 펌웨어 업데이트 배지
 * ------------------------------------------------------
 */

/* ==============================
 * 1. DOM 참조
 * ============================== */
const elFwVer        = () => document.getElementById("fwVer");
const elSimActive    = () => document.getElementById("simActive");
const elPhase        = () => document.getElementById("phase");
const elWind         = () => document.getElementById("wind");
const elPwm          = () => document.getElementById("pwm");
const elWifiMode     = () => document.getElementById("wifiMode");
const elCurSsid      = () => document.getElementById("curSsid");
const elIp           = () => document.getElementById("ip");

const elControlState = () => document.getElementById("controlState");
const elRunTarget    = () => document.getElementById("runTarget");

// [v025] 신규
const elApiKeyBadge     = () => document.getElementById("apiKeyBadge");
const elFwUpdateBadge   = () => document.getElementById("fwUpdateBadge");
const elSaveStatusBadge = () => document.getElementById("saveStatusBadge");
const elPresetDesc      = () => document.getElementById("presetDesc");
const elLogView         = () => document.getElementById("logConsole");

// 프로파일 실행
const elProfileSelect    = () => document.getElementById("profileSelect");
const elProfileRunStatus = () => document.getElementById("profileRunStatus");

const elOverrideBadge  = () => document.getElementById("overrideBadge");
const elTimeBadge      = () => document.getElementById("timeBadge");
const elOverrideStatus = () => document.getElementById("overrideStatus");
const elOverrideSeconds = () => document.getElementById("overrideSeconds");
const elOverrideForever = () => document.getElementById("overrideForever");

const elPreset       = () => document.getElementById("preset");
const elStyle        = () => document.getElementById("style");
const elFanPower     = () => document.getElementById("fanPowerEnabled");
const elIntensity    = () => document.getElementById("intensity");
const elGustFreq     = () => document.getElementById("gust_freq");
const elVariability  = () => document.getElementById("variability");
const elFanLimit     = () => document.getElementById("fanLimit");
const elMinFan       = () => document.getElementById("minFan");
const elTurbLen      = () => document.getElementById("turb_len");
const elTurbSig      = () => document.getElementById("turb_sig");
const elThermStr     = () => document.getElementById("therm_str");
const elThermRad     = () => document.getElementById("therm_rad");

const elSimInt       = () => document.getElementById("sim_int");
const elGustInt      = () => document.getElementById("gust_int");
const elThermalInt   = () => document.getElementById("thermal_int");

const elWifiModeSel  = () => document.getElementById("wifi_mode");
const elApSsid       = () => document.getElementById("ap_ssid");
const elApPass       = () => document.getElementById("ap_password");
const elStaList      = () => document.getElementById("staList");
const elScanList     = () => document.getElementById("scanList");
const elScanPass     = () => document.getElementById("scanPass");

const elPwmPin       = () => document.getElementById("pwm_pin");
const elPwmChannel   = () => document.getElementById("pwm_channel");
const elPwmFreq      = () => document.getElementById("pwm_freq");
const elPwmRes       = () => document.getElementById("pwm_res");

const elApiKeyInput  = () => document.getElementById("apiKeyInput");
const elUpload       = () => document.getElementById("fileUpload");
const elUploadMsg    = () => document.getElementById("uploadMsg");
const elOTA          = () => document.getElementById("fileOTA");
const elOtaMsg       = () => document.getElementById("otaMsg");
const elBtnSaveAll   = () => document.getElementById("btnSaveAllConfig");

/* ==============================
 * 2. 전역 상태
 * ============================== */
let g_configDirty     = false;
let g_staList         = [];
let g_wsLog           = null;
let g_wsState         = null;
let g_wifiStateTimer  = null;
let g_windDictPresets = [];
let g_windDictStyles  = [];
let g_overrideActive  = false;

// 프로파일 실행
let g_userProfiles    = [];
let g_activeProfileNo = 0;

// 로그 필터
let g_logFilter = "all";   // "all" | "warn" | "err"

/* ==============================
 * 3. Dirty / 상태 배지
 * ============================== */
function updateDirtyButton() {
	const btn = elBtnSaveAll();
	if (!btn) return;
	if (g_configDirty) {
		btn.textContent = "변경 있음 - 전체 Config 저장";
		btn.classList.add("warn");
		btn.style.background = "#eab308";
		btn.style.color = "#fff";
	} else {
		btn.textContent = "저장 완료";
		btn.classList.remove("warn");
		btn.style.background = "#2ecc71";
		btn.style.color = "#fff";
	}
	_updateSaveStatusBadge();
}

function markDirty() {
	g_configDirty = true;
	updateDirtyButton();
	_updateSaveAttention();
}

// [v025 #4] 저장 상태 통합 배지
function _updateSaveStatusBadge() {
	const el = elSaveStatusBadge();
	if (!el) return;

	if (g_overrideActive && g_configDirty) {
		el.textContent = "🟡 임시 실행 중 — 저장 안 됨";
		el.className = "info-label err";
	} else if (g_configDirty) {
		el.textContent = "📝 변경 있음 (저장 필요)";
		el.className = "info-label warn";
	} else if (g_overrideActive) {
		el.textContent = "🎬 임시 실행 중";
		el.className = "info-label warn";
	} else {
		el.textContent = "✅ 저장됨";
		el.className = "info-label ok";
	}
}

// [Q3-b] override + dirty 시 저장 버튼 강조
function _updateSaveAttention() {
	const btnSaveSim = document.getElementById("btnSaveSim");
	if (!btnSaveSim) return;
	const needAttention = g_overrideActive && g_configDirty;
	btnSaveSim.classList.toggle("btn-attention", needAttention);
}

/* ==============================
 * 3-1. [v025 #3] API Key 배지
 * ============================== */
function updateApiKeyBadge() {
	const badge = elApiKeyBadge();
	if (!badge) return;
	const hasKey = !!getApiKey();
	badge.style.display = hasKey ? "none" : "inline-block";
}

/* ==============================
 * 3-2. [v025 #13] 펌웨어 업데이트 배지
 * ============================== */
async function checkFirmwareUpdate() {
	const badge = elFwUpdateBadge();
	if (!badge) return;
	const data = await apiFetch(SNW_API.API_HTTP_FW_CHECK, { method: "GET" }, true);
	if (data && data.status === "available") {
		badge.textContent = `⬆️ 새 펌웨어 (${data.latest_version || "?"})`;
		badge.style.display = "inline-block";
	}
}

/* ==============================
 * 3-3. [v025 #1] 프리셋 설명
 * ============================== */
function updatePresetDescription() {
	const el = elPresetDesc();
	if (!el) return;

	const presetCode = elPreset() ? elPreset().value : "";
	if (!presetCode) { el.textContent = ""; return; }

	const preset = g_windDictPresets.find((p) => p.code === presetCode);
	if (!preset) { el.textContent = ""; return; }

	const pf = preset.factors || {};
	const name = preset.name || preset.label || presetCode;
	const desc = `${name} — 강도 ${_r2(pf.windIntensity)} · 변동 ${_r2(pf.windVariability)} · 돌풍 ${_r2(pf.gustFrequency)} · 팬상한 ${_r2(pf.fanLimit)}`;

	el.textContent = desc;
}

/* ==============================
 * 4. 초기 데이터 로딩
 * ============================== */
async function loadFwVersion() {
	const data = await apiFetch(SNW_API.API_HTTP_VERSION, { method: "GET" }, true);
	let v = "…";
	if (typeof data === "string") v = data;
	else if (data && (data.version || data.fw || data.fw_version)) {
		v = data.version || data.fw || data.fw_version;
	}
	const el = elFwVer();
	if (el) el.textContent = v;
}

function _applySimToUi(sim, control) {
	const simActive = sim.active;
	const elA = elSimActive();
	if (elA) {
		if (simActive === true || simActive === 1 || simActive === "on") {
			elA.textContent = "ACTIVE";
			elA.classList.remove("err");
			elA.classList.add("ok");
		} else {
			elA.textContent = "IDLE";
			elA.classList.remove("ok");
			elA.classList.add("err");
		}
	}

	const elP = elPhase();
	if (elP) elP.textContent = sim.phase != null ? String(sim.phase) : "-";

	const elW = elWind();
	if (elW) elW.textContent = sim.windSpeed != null ? String(sim.windSpeed) : "-";

	const elPw = elPwm();
	if (elPw) elPw.textContent = sim.pwmDuty != null ? String(sim.pwmDuty) : "-";

	// 폼 자동 동기화 (dirty 아닐 때만)
	if (!g_configDirty) {
		if (elPreset() && sim.presetCode) elPreset().value = sim.presetCode;
		if (elStyle() && sim.styleCode)   elStyle().value  = sim.styleCode;
		if (elFanPower() && sim.fanPowerEnabled !== undefined) elFanPower().checked = !!sim.fanPowerEnabled;
	}

	// override 배지 / 상태
	const ov = (control && control.override) ? control.override : null;
	const ovActive = !!(ov && ov.active);
	g_overrideActive = ovActive;

	const ovBadge = elOverrideBadge();
	if (ovBadge) ovBadge.style.display = ovActive ? "inline-block" : "none";

	const ovStatus = elOverrideStatus();
	if (ovStatus) {
		if (ovActive) {
			const mode = ov.useFixed ? `fixed ${ov.fixedPercent ?? "?"}%` : `preset ${ov.presetCode || ""}`;
			const remain = ov.remainSec > 0 ? ` (${ov.remainSec}s)` : " (무제한)";
			ovStatus.textContent = `🟡 ${mode}${remain}`;
			ovStatus.className = "info-label warn";
		} else {
			ovStatus.textContent = "비활성";
			ovStatus.className = "info-label info";
		}
	}

	// 제어 상태
	{
		const stateCode = control.stateCode;
		const stateStr  = control.state || "-";

		const elCS = elControlState();
		if (elCS) {
			elCS.textContent = stateStr;
			switch (stateCode) {
				case 0:  elCS.className = "info-label info";   break;
				case 1:  elCS.className = "info-label warn";   break;
				case 2:
				case 3:  elCS.className = "info-label ok";     break;
				case 4:  elCS.className = "info-label info";   break;
				case 5:
				case 6:  elCS.className = "info-label err";    break;
				default: elCS.className = "info-label info";   break;
			}
		}
	}

	// 실행 대상
	{
		const sch  = control.schedule   || {};
		const prof = control.profile    || {};

		let target = "없음";

		if (ov && ov.active) {
			if (ov.useFixed) target = `Override: 고정 ${ov.fixedPercent ?? 0}%`;
			else             target = `Override: ${ov.presetCode || "-"}`;
		} else if (sch.fromRunSource && sch.name) {
			target = `스케줄: ${sch.name}`;
			if (sch.schNo) target += ` (#${sch.schNo})`;
		} else if (prof.fromRunSource && prof.name) {
			target = `프로파일: ${prof.name}`;
			if (prof.profileNo) target += ` (#${prof.profileNo})`;
		}

		const elRT = elRunTarget();
		if (elRT) elRT.textContent = target;
	}

	// 프로파일 실행 상태
	{
		const prof   = (control && control.profile) ? control.profile : {};
		const active = !!prof.fromRunSource;
		g_activeProfileNo = active ? (Number(prof.profileNo) || 0) : 0;

		const elPS = elProfileRunStatus();
		if (elPS) {
			if (active) {
				elPS.textContent = `🟢 실행 중: ${prof.name || "#" + prof.profileNo}`;
				elPS.className = "info-label warn";
			} else {
				elPS.textContent = "비활성";
				elPS.className = "info-label info";
			}
		}

		if (!g_configDirty && elProfileSelect() && active && prof.profileNo) {
			elProfileSelect().value = prof.profileNo;
		}
	}

	// time 배지
	const tm = (control && control.time) ? control.time : null;
	const timeValid = tm ? !!tm.valid : true;
	const tb = elTimeBadge();
	if (tb) tb.style.display = timeValid ? "none" : "inline-block";

	// 저장 상태 배지 갱신
	_updateSaveStatusBadge();
	_updateSaveAttention();
}

async function loadStateOnce() {
	const data = await apiFetch(SNW_API.API_HTTP_STATE, { method: "GET" }, true);
	if (!data) return;
	_applySimToUi(data.sim || {}, data.control || {});
}

async function loadConfig() {
	showLoading();
	try {
		const [cfg, motionData] = await Promise.all([
			apiFetch(SNW_API.API_HTTP_CONFIG, { method: "GET" }, true),
			apiFetch(SNW_API.API_HTTP_MOTION, { method: "GET" }, true)
		]);

		if (!cfg) return;

		if (cfg.wifi) {
			if (elWifiModeSel()) elWifiModeSel().value = cfg.wifi.wifiMode ?? 0;
			if (elApSsid()) elApSsid().value = cfg.wifi.ap ? cfg.wifi.ap.ssid || "" : "";
			if (elApPass()) elApPass().value = cfg.wifi.ap ? cfg.wifi.ap.pass || "" : "";

			g_staList = [];
			if (Array.isArray(cfg.wifi.sta)) {
				cfg.wifi.sta.forEach((item) => {
					if (item && item.ssid) g_staList.push({ ssid: item.ssid, pass: item.pass || "" });
				});
			}
			renderStaList();
		}

		if (cfg.hw && cfg.hw.fanPwm) {
			if (elPwmPin())     elPwmPin().value     = cfg.hw.fanPwm.pin ?? "";
			if (elPwmChannel()) elPwmChannel().value = cfg.hw.fanPwm.channel ?? "";
			if (elPwmFreq())    elPwmFreq().value    = cfg.hw.fanPwm.freq ?? "";
			if (elPwmRes())     elPwmRes().value     = cfg.hw.fanPwm.res ?? "";
		}

		loadPresetsFromConfig(cfg);

		const sim = (motionData && motionData.motion && motionData.motion.sim) ? motionData.motion.sim : {};
		if (elIntensity())   elIntensity().value   = sim.intensity ?? "";
		if (elVariability()) elVariability().value = sim.variability ?? "";
		if (elGustFreq())    elGustFreq().value    = sim.gustFreq ?? "";
		if (elFanLimit())    elFanLimit().value    = sim.fanLimit ?? "";
		if (elMinFan())      elMinFan().value      = sim.minFan ?? "";
		if (elTurbLen())     elTurbLen().value     = sim.turbLenScale ?? "";
		if (elTurbSig())     elTurbSig().value     = sim.turbSigma ?? "";
		if (elThermStr())    elThermStr().value    = sim.thermalStrength ?? "";
		if (elThermRad())    elThermRad().value    = sim.thermalRadius ?? "";

		if (elPreset() && sim.presetCode) elPreset().value = sim.presetCode;
		if (elStyle() && sim.styleCode)   elStyle().value  = sim.styleCode;
		if (elFanPower() && sim.fanPowerEnabled !== undefined) elFanPower().checked = !!sim.fanPowerEnabled;

		const timing = (cfg.motion && cfg.motion.timing) ? cfg.motion.timing : cfg.timing;
		if (timing) {
			if (elSimInt())     elSimInt().value     = timing.simIntervalMs ?? "";
			if (elGustInt())    elGustInt().value    = timing.gustIntervalMs ?? "";
			if (elThermalInt()) elThermalInt().value = timing.thermalIntervalMs ?? "";
		}

		if (cfg.security && cfg.security.apiKey && !getApiKey()) {
			setApiKey(cfg.security.apiKey);
			if (elApiKeyInput()) elApiKeyInput().value = cfg.security.apiKey;
			updateApiKeyBadge();
		}

		g_configDirty = false;
		updateDirtyButton();
		updatePresetDescription();
	} finally {
		hideLoading();
	}
}

function loadPresetsFromConfig(cfg) {
	const sel = elPreset();
	if (sel) {
		sel.innerHTML = "";
		let presets = [];
		if (cfg.windDict && Array.isArray(cfg.windDict.presets)) presets = cfg.windDict.presets;
		else if (cfg.motion && Array.isArray(cfg.motion.presets)) presets = cfg.motion.presets;

		g_windDictPresets = presets;

		if (!presets.length) {
			const opt = document.createElement("option");
			opt.value = "";
			opt.textContent = "(프리셋 없음)";
			sel.appendChild(opt);
		} else {
			presets.forEach((p, idx) => {
				const opt = document.createElement("option");
				opt.value = p.code || p.id || String(idx);
				opt.textContent = p.name || p.label || p.code || `Preset ${idx + 1}`;
				sel.appendChild(opt);
			});
		}
	}

	const styleSel = elStyle();
	if (styleSel) {
		styleSel.innerHTML = "";
		let styles = [];
		if (cfg.windDict && Array.isArray(cfg.windDict.styles)) styles = cfg.windDict.styles;

		g_windDictStyles = styles;

		if (!styles.length) {
			const opt = document.createElement("option");
			opt.value = "BALANCE";
			opt.textContent = "BALANCE";
			styleSel.appendChild(opt);
		} else {
			styles.forEach((s, idx) => {
				const opt = document.createElement("option");
				opt.value = s.code || String(idx);
				opt.textContent = s.name || s.code || `Style ${idx + 1}`;
				styleSel.appendChild(opt);
			});
		}
	}
}

/* ==============================
 * 5. 프리셋/스타일 자동 채움
 * ============================== */
function _r2(v) {
	const n = Number(v);
	return isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function onPresetOrStyleChanged() {
	const presetCode = elPreset() ? elPreset().value : "";
	const styleCode  = elStyle()  ? elStyle().value  : "";
	if (!presetCode) { updatePresetDescription(); return; }

	const preset = g_windDictPresets.find((p) => p.code === presetCode);
	if (!preset || !preset.factors) { updatePresetDescription(); return; }

	const style = g_windDictStyles.find((s) => s.code === styleCode) || {};
	const sf = style.factors || {};
	const pf = preset.factors;

	const intV  = _r2((pf.windIntensity ?? 0)      * (sf.intensityFactor    ?? 1.0));
	const varV  = _r2((pf.windVariability ?? 0)    * (sf.variabilityFactor  ?? 1.0));
	const gustV = _r2((pf.gustFrequency ?? 0)      * (sf.gustFactor         ?? 1.0));
	const flV   = _r2(pf.fanLimit ?? 0);
	const minV  = _r2(pf.minFan ?? 0);
	const tlV   = _r2(pf.turbulenceLengthScale ?? 0);
	const tsV   = _r2(pf.turbulenceIntensitySigma ?? 0);
	const thBV  = _r2((pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor   ?? 1.0));
	const thRV  = _r2(pf.thermalBubbleRadius ?? 0);

	if (elIntensity())   elIntensity().value   = intV;
	if (elVariability()) elVariability().value = varV;
	if (elGustFreq())    elGustFreq().value    = gustV;
	if (elFanLimit())    elFanLimit().value    = flV;
	if (elMinFan())      elMinFan().value      = minV;
	if (elTurbLen())     elTurbLen().value     = tlV;
	if (elTurbSig())     elTurbSig().value     = tsV;
	if (elThermStr())    elThermStr().value    = thBV;
	if (elThermRad())    elThermRad().value    = thRV;

	updatePresetDescription();
	markDirty();
}

/* ==============================
 * 6. 임시 적용
 * ============================== */
async function applyTempPreset() {
	const presetCode = elPreset() ? elPreset().value : "";
	const styleCode  = elStyle()  ? elStyle().value  : "BALANCE";
	const forever    = elOverrideForever() ? elOverrideForever().checked : false;
	const sec        = forever ? 0 : parseInt(elOverrideSeconds() ? elOverrideSeconds().value || "300" : "300", 10);

	if (!presetCode) {
		notify("프리셋을 선택하세요.", "warn");
		return;
	}

	const preset = g_windDictPresets.find((p) => p.code === presetCode);
	if (!preset || !preset.factors) {
		notify("프리셋 정보를 불러올 수 없습니다.", "err");
		return;
	}

	const style = g_windDictStyles.find((s) => s.code === styleCode) || {};
	const sf = style.factors || {};
	const pf = preset.factors;

	const baseInt  = (pf.windIntensity ?? 0)      * (sf.intensityFactor   ?? 1.0);
	const baseVar  = (pf.windVariability ?? 0)    * (sf.variabilityFactor ?? 1.0);
	const baseGust = (pf.gustFrequency ?? 0)      * (sf.gustFactor        ?? 1.0);
	const baseFL   = pf.fanLimit ?? 0;
	const baseMin  = pf.minFan ?? 0;
	const baseTL   = pf.turbulenceLengthScale ?? 0;
	const baseTS   = pf.turbulenceIntensitySigma ?? 0;
	const baseThB  = (pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor  ?? 1.0);
	const baseThR  = pf.thermalBubbleRadius ?? 0;

	const adj = {
		windIntensity:            (Number(elIntensity()   && elIntensity().value)   || 0) - baseInt,
		windVariability:          (Number(elVariability() && elVariability().value) || 0) - baseVar,
		gustFrequency:            (Number(elGustFreq()    && elGustFreq().value)    || 0) - baseGust,
		fanLimit:                 (Number(elFanLimit()    && elFanLimit().value)    || 0) - baseFL,
		minFan:                   (Number(elMinFan()      && elMinFan().value)      || 0) - baseMin,
		turbulenceLengthScale:    (Number(elTurbLen()     && elTurbLen().value)     || 0) - baseTL,
		turbulenceIntensitySigma: (Number(elTurbSig()     && elTurbSig().value)     || 0) - baseTS,
		thermalBubbleStrength:    (Number(elThermStr()    && elThermStr().value)    || 0) - baseThB,
		thermalBubbleRadius:      (Number(elThermRad()    && elThermRad().value)    || 0) - baseThR
	};

	const body = { presetCode, styleCode, durationSec: sec, forever, adjust: adj };

	await apiFetch(SNW_API.API_HTTP_CTL_OVR_PRESET, {
		method: "POST",
		body: JSON.stringify(body)
	}, false, "임시 적용");

	setTimeout(loadStateOnce, 300);
}

async function stopTemp() {
	await apiFetch(SNW_API.API_HTTP_CTL_OVR_CLEAR, { method: "POST" }, false, "임시 적용 중지");
	setTimeout(loadStateOnce, 300);
}

/* ==============================
 * 7. 저장
 * ============================== */
async function saveMotionPatch() {
	const motionBody = {
		motion: {
			sim: {
				presetCode:      elPreset() ? elPreset().value : null,
				styleCode:       elStyle()  ? elStyle().value  : null,
				fanPowerEnabled: elFanPower() ? elFanPower().checked : true,
				intensity:       Number(elIntensity()   && elIntensity().value)   || 0,
				variability:     Number(elVariability() && elVariability().value) || 0,
				gustFreq:        Number(elGustFreq()    && elGustFreq().value)    || 0,
				fanLimit:        Number(elFanLimit()    && elFanLimit().value)    || 0,
				minFan:          Number(elMinFan()      && elMinFan().value)      || 0,
				turbLenScale:    Number(elTurbLen()     && elTurbLen().value)     || 0,
				turbSigma:       Number(elTurbSig()     && elTurbSig().value)     || 0,
				thermalStrength: Number(elThermStr()    && elThermStr().value)    || 0,
				thermalRadius:   Number(elThermRad()    && elThermRad().value)    || 0
			}
		}
	};

	await apiFetch(SNW_API.API_HTTP_MOTION, { method: "POST", body: JSON.stringify(motionBody) }, false, "풍속 설정");
	await apiFetch(SNW_API.API_HTTP_CONFIG_SAVE, { method: "POST", body: JSON.stringify({}) }, true, "");

	if (g_overrideActive) {
		await apiFetch(SNW_API.API_HTTP_CTL_OVR_CLEAR, { method: "POST" }, true, "");
	}

	g_configDirty = false;
	updateDirtyButton();
	notify("풍속 설정이 저장되었습니다.", "ok");
	setTimeout(loadStateOnce, 300);
}

async function saveTimingPatch() {
	const body = { motion: { timing: {
		simIntervalMs:     Number(elSimInt().value || 0),
		gustIntervalMs:    Number(elGustInt().value || 0),
		thermalIntervalMs: Number(elThermalInt().value || 0)
	}}};
	await apiFetch(SNW_API.API_HTTP_MOTION, { method: "POST", body: JSON.stringify(body) }, false, "타이밍 설정");
	markDirty();
}

async function saveWifiApPatch() {
	const body = { wifi: {
		wifiMode: Number(elWifiModeSel().value || 0),
		ap: { ssid: elApSsid().value || "", pass: elApPass().value || "" }
	}};
	await apiFetch(SNW_API.API_HTTP_WIFI_CONFIG, { method: "POST", body: JSON.stringify(body) }, false, "Wi-Fi AP 설정");
	markDirty();
}

async function saveWifiStaPatch() {
	const body = { wifi: { sta: g_staList.map((item) => ({ ssid: item.ssid, pass: item.pass || "" })) }};
	await apiFetch(SNW_API.API_HTTP_WIFI_CONFIG, { method: "POST", body: JSON.stringify(body) }, false, "Wi-Fi STA 목록");
	markDirty();
}

async function savePwmPatch() {
	const body = { hw: { fanPwm: {
		pin:     Number(elPwmPin().value || 0),
		channel: Number(elPwmChannel().value || 0),
		freq:    Number(elPwmFreq().value || 0),
		res:     Number(elPwmRes().value || 0)
	}}};
	await apiFetch(SNW_API.API_HTTP_SYSTEM, { method: "POST", body: JSON.stringify(body) }, false, "PWM 하드웨어");
	markDirty();
}

/* ==============================
 * 8. 전체 저장 / 초기화
 * ============================== */
async function saveAllConfig() {
	if (!g_configDirty) { notify("변경 사항이 없습니다.", "info"); return; }
	if (!confirm("현재까지의 메모리 변경 내용을 모두 저장하시겠습니까?")) return;

	await apiFetch(SNW_API.API_HTTP_CONFIG_SAVE, { method: "POST", body: JSON.stringify({ save_all: true }) }, false, "전체 Config 저장");
	g_configDirty = false;
	updateDirtyButton();
}

async function factoryReset() {
	if (!confirm("⚠️ 모든 설정을 기본값으로 초기화합니다.\n진행하시겠습니까?")) return;
	await apiFetch(SNW_API.API_HTTP_CONFIG_INIT, { method: "POST", body: JSON.stringify({ factory: true }) }, false, "Factory Reset");
	await loadConfig();
	await loadStateOnce();
}

/* ==============================
 * 9. Wi-Fi / STA
 * ============================== */
async function scanWifi() {
	const data = await apiFetch(SNW_API.API_HTTP_WIFI_SCAN, { method: "GET" }, true);
	const list = (data && data.wifi && data.wifi.scan) ? data.wifi.scan : data || [];
	renderScanList(list);
	notify("Wi-Fi 스캔 완료", "ok");
}

async function loadWifiStateOnce() {
	const data = await apiFetch(SNW_API.API_HTTP_WIFI_STATE, { method: "GET" }, true);
	if (!data) return;
	const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : {};
	if (elWifiMode()) elWifiMode().textContent = (wifi.mode_name || wifi.mode || "-").toString();
	if (elCurSsid())  elCurSsid().textContent  = wifi.ssid || "-";
	if (elIp())       elIp().textContent       = wifi.ip || "-";
}

/* ==============================
 * 9-1. 프로파일 목록 로드
 * ============================== */
async function loadUserProfiles() {
	const data = await apiFetch(SNW_API.API_HTTP_USER_PROFILES, { method: "GET" }, true);
	let profiles = [];
	if (data && data.userProfiles && Array.isArray(data.userProfiles.profiles)) profiles = data.userProfiles.profiles;
	g_userProfiles = profiles;

	const sel = elProfileSelect();
	if (!sel) return;
	sel.innerHTML = "";

	if (!profiles.length) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "(프로파일 없음)";
		sel.appendChild(opt);
		return;
	}

	profiles.forEach((p) => {
		const opt = document.createElement("option");
		opt.value = p.profileNo;
		const off = (p.enabled !== false) ? "" : " (OFF)";
		opt.textContent = `${p.name || "이름없음"} (#${p.profileNo})${off}`;
		sel.appendChild(opt);
	});

	if (g_activeProfileNo > 0 && sel.querySelector(`option[value="${g_activeProfileNo}"]`)) sel.value = g_activeProfileNo;
}

/* ==============================
 * 9-2. 프로파일 실행/중지
 * ============================== */
async function runSelectedProfile() {
	const sel = elProfileSelect();
	if (!sel) return;
	const no = Number(sel.value);
	if (!no || no <= 0) { notify("실행할 프로파일을 선택하세요.", "warn"); return; }

	const target = g_userProfiles.find((p) => Number(p.profileNo) === no);
	if (target && target.enabled === false) {
		notify(`프로파일 "${target.name}"은(는) 비활성 상태입니다.`, "warn");
		return;
	}

	const result = await apiFetch(SNW_API.API_HTTP_CTL_PROF_SEL, { method: "POST", body: JSON.stringify({ id: no }) }, false, `프로파일 #${no} 실행`);
	if (result) setTimeout(loadStateOnce, 300);
}

async function stopActiveProfile() {
	const result = await apiFetch(SNW_API.API_HTTP_CTL_PROF_STOP, { method: "POST" }, false, "프로파일 중지");
	if (result) setTimeout(loadStateOnce, 300);
}

function renderStaList() {
	const container = elStaList();
	if (!container) return;
	container.innerHTML = "";
	if (!g_staList || g_staList.length === 0) {
		const div = document.createElement("div");
		div.className = "muted";
		div.textContent = "등록된 STA 네트워크가 없습니다.";
		container.appendChild(div);
		return;
	}
	const table = document.createElement("table");
	const thead = document.createElement("thead");
	const trh = document.createElement("tr");
	["SSID", "Password", "액션"].forEach((txt) => {
		const th = document.createElement("th");
		th.textContent = txt;
		trh.appendChild(th);
	});
	thead.appendChild(trh);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	g_staList.forEach((item, idx) => {
		const tr = document.createElement("tr");
		const tdSsid = document.createElement("td");
		tdSsid.textContent = item.ssid || "";
		tr.appendChild(tdSsid);
		const tdPass = document.createElement("td");
		tdPass.textContent = item.pass ? "********" : "";
		tr.appendChild(tdPass);
		const tdAct = document.createElement("td");
		tdAct.style.textAlign = "right";
		const btnDel = document.createElement("button");
		btnDel.className = "btn btn-small err";
		btnDel.textContent = "삭제";
		btnDel.addEventListener("click", () => {
			g_staList.splice(idx, 1);
			renderStaList();
			markDirty();
		});
		tdAct.appendChild(btnDel);
		tr.appendChild(tdAct);
		tbody.appendChild(tr);
	});
	table.appendChild(tbody);
	container.appendChild(table);
}

function renderScanList(networks) {
	const sel = elScanList();
	if (!sel) return;
	sel.innerHTML = "";
	if (!networks || networks.length === 0) {
		const opt = document.createElement("option");
		opt.value = "";
		opt.textContent = "검색된 네트워크가 없습니다.";
		sel.appendChild(opt);
		return;
	}
	networks.forEach((ap) => {
		const opt = document.createElement("option");
		opt.value = ap.ssid || "";
		const rssi = ap.rssi != null ? ` (RSSI ${ap.rssi})` : "";
		opt.textContent = (ap.ssid || "") + rssi;
		sel.appendChild(opt);
	});
}

function addStaFromScan() {
	const sel = elScanList();
	const passInput = elScanPass();
	if (!sel) return;
	const ssid = sel.value || "";
	if (!ssid) { notify("추가할 SSID를 선택하세요.", "warn"); return; }
	const pass = passInput ? passInput.value : "";
	if (g_staList.some((s) => s.ssid === ssid)) { notify("이미 등록된 SSID입니다.", "warn"); return; }
	g_staList.push({ ssid, pass });
	renderStaList();
	markDirty();
	if (passInput) passInput.value = "";
}

/* ==============================
 * 10. API Key / 업로드
 * ============================== */
function applyApiKeyFromInput() {
	const input = elApiKeyInput();
	if (!input) return;
	setApiKey(input.value.trim());
	updateApiKeyBadge();
	notify("API Key가 브라우저에 저장되었습니다.", "ok");
}

async function uploadFile(endpoint, file, msgEl, successMsg, errorMsg) {
	if (!file) { notify("파일을 선택하세요.", "warn"); return; }
	const apiKey = getApiKey();
	const formData = new FormData();
	formData.append("file", file, file.name);
	showLoading();
	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: apiKey ? { "X-API-Key": apiKey } : {},
			body: formData
		});
		const text = await res.text();
		if (!res.ok) throw new Error(`HTTP ${res.status} / ${text}`);
		if (msgEl) msgEl.textContent = text || successMsg;
		notify(successMsg, "ok");
	} catch (e) {
		console.error("[Main] uploadFile failed:", e.message);
		if (msgEl) msgEl.textContent = e.message;
		notify(errorMsg + ": " + e.message, "err");
	} finally {
		hideLoading();
	}
}

function handleStaticUpload() {
	const f = elUpload() ? elUpload().files[0] : null;
	uploadFile(SNW_API.API_HTTP_FILE_UPLOAD, f, elUploadMsg(), "정적 파일 업로드 완료", "정적 파일 업로드 실패");
}

function handleOtaUpload() {
	const f = elOTA() ? elOTA().files[0] : null;
	uploadFile(SNW_API.API_HTTP_FW_UPDATE, f, elOtaMsg(), "OTA 업데이트 전송 완료", "OTA 업데이트 실패");
}

/* ==============================
 * 11. 초기 로그 / WebSocket
 * ============================== */
// [v025 #7] 로그 라인 append (data-level 부여)
function _appendLogLine(ts, lv, msg) {
	const el = elLogView();
	if (!el) return;

	// 초기 placeholder("로그 로딩 중...") 제거
	if (el.textContent.trim() === "로그 로딩 중...") el.textContent = "";

	const level = Number.isFinite(Number(lv)) ? Number(lv) : 3;

	const line = document.createElement("div");
	line.className = "log-line";
	line.dataset.level = String(level);

	const tsStr = (typeof ts === "number" && ts > 0)
		? new Date(ts).toLocaleTimeString()
		: (typeof ts === "string" ? ts : "");

	line.textContent = `${tsStr ? "[" + tsStr + "] " : ""}${msg}`;

	// 필터 적용
	const visible = g_logFilter === "all"
		|| (g_logFilter === "warn" && level <= 2)
		|| (g_logFilter === "err"  && level <= 1);
	if (!visible) line.style.display = "none";

	el.appendChild(line);

	// 최대 300줄 유지
	while (el.children.length > 300) el.removeChild(el.firstChild);

	// 스크롤 (필터 걸린 라인도 스크롤 위치는 최하단)
	el.scrollTop = el.scrollHeight;
}

// [v025 #7] 로그 필터 적용
function _applyLogFilter() {
	const el = elLogView();
	if (!el) return;

	Array.from(el.children).forEach((line) => {
		const level = Number(line.dataset.level || 3);
		let visible = true;
		if (g_logFilter === "warn") visible = level <= 2;
		else if (g_logFilter === "err") visible = level <= 1;

		line.style.display = visible ? "" : "none";
	});
}

async function loadLogsOnce() {
	const el = elLogView();
	if (!el) return;
	const data = await apiFetch(SNW_API.API_HTTP_LOGS, { method: "GET" }, true);
	if (data && Array.isArray(data.logs)) {
		el.textContent = "";
		data.logs.forEach((l) => {
			_appendLogLine(l.ts, l.lv, l.msg || "");
		});
		if (!el.children.length) el.textContent = "";
	} else {
		el.textContent = "";
	}
}

function initWebSocketLog() {
	try {
		const url = buildWsUrl(SNW_API.WS_API_LOG);
		const ws = new WebSocket(url);
		g_wsLog = ws;

		ws.onopen = () => {
			_appendLogLine(Date.now(), 3, "[WS] 로그 스트림 연결됨.");
		};
		ws.onmessage = (ev) => {
			// 서버 broadcastLog 형식: {ts, lv, msg}
			try {
				const rec = JSON.parse(ev.data);
				if (rec && (rec.msg || rec.message)) {
					_appendLogLine(rec.ts || rec.t, rec.lv ?? rec.level ?? 3, rec.msg || rec.message);
				} else {
					_appendLogLine(Date.now(), 3, ev.data);
				}
			} catch {
				_appendLogLine(Date.now(), 3, ev.data);
			}
		};
		ws.onclose = () => console.log("[WS-LOG] disconnected");
		ws.onerror = (err) => console.error("[WS-LOG] error:", err);
	} catch (e) {
		console.error("[WS-LOG] init failed:", e.message);
	}
}

function clearLogConsole() {
	const el = elLogView();
	if (el) el.textContent = "";
}

function initWebSocketState() {
	try {
		const url = buildWsUrl(SNW_API.WS_API_STATE);
		const ws = new WebSocket(url);
		g_wsState = ws;
		ws.onopen = () => console.log("[WS-STATE] connected");
		ws.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				_applySimToUi(data.sim || {}, data.control || {});
			} catch (e) {
				console.warn("[WS-STATE] invalid JSON:", ev.data);
			}
		};
		ws.onclose = () => console.log("[WS-STATE] disconnected");
		ws.onerror = (err) => console.error("[WS-STATE] error:", err);
	} catch (e) {
		console.error("[WS-STATE] init failed:", e.message);
	}
}

/* ==============================
 * 12. 이벤트 바인딩
 * ============================== */
function bindEvents() {
	const btnRefresh = document.getElementById("btnRefresh");
	if (btnRefresh) btnRefresh.addEventListener("click", () => {
		loadStateOnce();
		loadWifiStateOnce();
	});

	const btnProfileRun = document.getElementById("btnProfileRun");
	if (btnProfileRun) btnProfileRun.addEventListener("click", runSelectedProfile);

	const btnProfileStop = document.getElementById("btnProfileStop");
	if (btnProfileStop) btnProfileStop.addEventListener("click", stopActiveProfile);

	if (elPreset()) elPreset().addEventListener("change", onPresetOrStyleChanged);
	if (elStyle())  elStyle().addEventListener("change", onPresetOrStyleChanged);

	const btnApplyTemp = document.getElementById("btnApplyTemp");
	if (btnApplyTemp) btnApplyTemp.addEventListener("click", applyTempPreset);

	const btnStopTemp = document.getElementById("btnStopTemp");
	if (btnStopTemp) btnStopTemp.addEventListener("click", stopTemp);

	const btnSaveSim = document.getElementById("btnSaveSim");
	if (btnSaveSim) btnSaveSim.addEventListener("click", saveMotionPatch);

	if (elBtnSaveAll()) elBtnSaveAll().addEventListener("click", saveAllConfig);

	const btnConfigInit = document.getElementById("btnConfigInit");
	if (btnConfigInit) btnConfigInit.addEventListener("click", factoryReset);

	const btnSaveTiming = document.getElementById("btnSaveTiming");
	if (btnSaveTiming) btnSaveTiming.addEventListener("click", saveTimingPatch);

	const btnSaveWifiAP = document.getElementById("btnSaveWifiAP");
	if (btnSaveWifiAP) btnSaveWifiAP.addEventListener("click", saveWifiApPatch);

	const btnSaveWifiSTA = document.getElementById("btnSaveWifiSTA");
	if (btnSaveWifiSTA) btnSaveWifiSTA.addEventListener("click", saveWifiStaPatch);

	const btnSavePWM = document.getElementById("btnSavePWM");
	if (btnSavePWM) btnSavePWM.addEventListener("click", savePwmPatch);

	const btnScan = document.getElementById("btnScan");
	if (btnScan) btnScan.addEventListener("click", scanWifi);

	const btnUseScan = document.getElementById("btnUseScan");
	if (btnUseScan) btnUseScan.addEventListener("click", addStaFromScan);

	const btnSaveApiKey = document.getElementById("btnSaveApiKey");
	if (btnSaveApiKey) btnSaveApiKey.addEventListener("click", applyApiKeyFromInput);

	const btnUploadStatic = document.getElementById("btnUploadStatic");
	if (btnUploadStatic) btnUploadStatic.addEventListener("click", handleStaticUpload);

	const btnUploadOTA = document.getElementById("btnUploadOTA");
	if (btnUploadOTA) btnUploadOTA.addEventListener("click", handleOtaUpload);

	const btnClearLog = document.getElementById("btnClearLog");
	if (btnClearLog) btnClearLog.addEventListener("click", clearLogConsole);

	// [v025 #7] 로그 필터 버튼
	document.querySelectorAll("[data-log-filter]").forEach((btn) => {
		btn.addEventListener("click", () => {
			document.querySelectorAll("[data-log-filter]").forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			g_logFilter = btn.dataset.logFilter || "all";
			_applyLogFilter();
		});
	});

	if (elFanPower()) elFanPower().addEventListener("change", markDirty);

	const inputSelectors = [
		"#intensity", "#gust_freq", "#variability", "#fanLimit", "#minFan",
		"#turb_len", "#turb_sig", "#therm_str", "#therm_rad",
		"#sim_int", "#gust_int", "#thermal_int",
		"#wifi_mode", "#ap_ssid", "#ap_password",
		"#pwm_pin", "#pwm_channel", "#pwm_freq", "#pwm_res"
	];
	inputSelectors.forEach((sel) => {
		const el = document.querySelector(sel);
		if (el) {
			el.addEventListener("change", markDirty);
			el.addEventListener("input", markDirty);
		}
	});
}

/* ==============================
 * 13. 초기화
 * ============================== */
document.addEventListener("DOMContentLoaded", async () => {
	const key = getApiKey();
	if (elApiKeyInput()) elApiKeyInput().value = key;

	updateDirtyButton();
	updateApiKeyBadge();     // [v025 #3]
	_updateSaveStatusBadge(); // [v025 #4]
	bindEvents();

	await loadLogsOnce();
	initWebSocketLog();
	initWebSocketState();

	await loadFwVersion();
	await loadConfig();
	await loadUserProfiles();
	await loadStateOnce();
	await loadWifiStateOnce();

	checkFirmwareUpdate();   // [v025 #13] 비동기, 결과 대기 안 함

	if (g_wifiStateTimer) clearInterval(g_wifiStateTimer);
	g_wifiStateTimer = setInterval(loadWifiStateOnce, 30000);

	window.addEventListener("beforeunload", () => {
		if (g_wifiStateTimer) {
			clearInterval(g_wifiStateTimer);
			g_wifiStateTimer = null;
		}
	});
});
```

---

📄 5. P100_settings_071.html — 시스템 정보 카드에 다운로드 버튼 추가

수정 위치: "ℹ️ 시스템 정보 및 진단" 카드의 .actions 블록

```html
<div class="actions">
    <button class="btn" id="btnCheckUpdate">⬆️ 펌웨어 확인</button>
    <button class="btn" id="btnDownloadConfig">📥 설정 다운로드</button>
    <button class="btn" id="btnRefreshInfo">🔄 갱신</button>
</div>
```

---

📄 6. P100_settings_071.js — 다운로드 함수 추가 + 이벤트

함수 추가 (saveGeminiApiKey 함수 뒤):

```js
// [v025 #9] 설정 백업 다운로드
async function downloadConfigBackup() {
    const data = await fetchApi("/api/v001/config", "GET", null, "설정 백업");
    if (!data) return;

    try {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json;charset=utf-8" });
        const url  = URL.createObjectURL(blob);

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

        showToast(`설정 다운로드 완료: ${filename}`, "ok");
    } catch (e) {
        showToast(`다운로드 실패: ${e.message}`, "err");
    }
}
```

이벤트 바인딩 (bindEvents 내, btnRefreshInfo 근처):

```js
$("#btnDownloadConfig")?.addEventListener("click", downloadConfigBackup);
```

---

✅ 검증 시나리오

#1 프리셋 설명

```
1. P010 프리셋 select 변경
2. 아래 presetDesc에 "Ocean Breeze — 강도 70 · 변동 50 · 돌풍 45 · 팬상한 95" 표시
```

#3 API Key 배지

```
1. 브라우저 localStorage.clear()
2. P010 로드 → 상단에 "🔑 API Key 미설정" 빨강 배지
3. 클릭 → P100_settings_071.html 이동
4. API Key 저장 후 P010 복귀 → 배지 사라짐
```

#4 저장 상태 통합 배지

```
1. 초기 → "✅ 저장됨" 초록
2. 강도 변경 → "📝 변경 있음 (저장 필요)" 노랑
3. 임시 적용 중 + dirty → "🟡 임시 실행 중 — 저장 안 됨" 빨강
4. 저장 후 → "✅ 저장됨" 초록
```

#6 에러 메시지

```
1. 백엔드 다운 시 → "네트워크 연결을 확인하세요."
2. API Key 오류 → "인증이 필요합니다."
3. 없는 경로 → "요청한 기능을 찾을 수 없습니다."
4. 500 → "서버 오류가 발생했습니다."
```

#7 로그 필터

```
1. 로그 여러 개 누적
2. [WARN+] 클릭 → INFO 로그 숨김
3. [ERROR] 클릭 → WARN, INFO 숨김
4. [전체] 복귀
```

#9 설정 다운로드

```
1. P100 → "📥 설정 다운로드"
2. 브라우저 다운로드 폴더 → snw_config_YYYYMMDD_HHMM.json
3. 열어서 전체 config JSON 확인
```

#13 펌웨어 배지

```
1. 백엔드 firmware check status=available 시
2. P010 상단에 "⬆️ 새 펌웨어 (V1.0.1)" 노랑 배지
3. 클릭 → P100 이동
```

---

📋 파일별 변경 요약

파일 변경
P000_common_070.js apiFetch 함수 전체 교체
P010_main_071.html 5곳 추가 (배지 2, 설명 1, 로그필터 1, 로그구조 변경)
P010_main_071.css 파일 끝에 ~50줄 추가
P010_main_071.js 전면 재작성 (v025)
P100_settings_071.html 버튼 1개 추가
P100_settings_071.js 함수 1개 + 이벤트 1줄 추가

총 6개 파일 수정.

---

📌 다음 단계

배포 후 시나리오 검증 권장. 이슈 있으면 알려주세요.
