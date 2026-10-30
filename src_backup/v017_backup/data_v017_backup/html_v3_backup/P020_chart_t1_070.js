/*
 * ------------------------------------------------------
 * 소스명 : P020_chart_t1_070.js
 * 모듈명 : Smart Nature Wind Chart/Simulation UI Controller (v029, Backend 029 정합)
 * ------------------------------------------------------
 * 기능 요약:
 * - /ws/chart WebSocket을 통한 실시간 차트 데이터 모니터링
 * - /api/config 기반 초기 설정/프리셋 로딩 (Main 페이지와 동일 구조)
 * - /api/config/motion, /api/config/timing 메모리 패치
 * - /api/config/save 전체 저장 (Flash Flush) + Dirty 상태 버튼 표시
 * - /api/config/init Factory Reset
 * - API Key: Main 페이지와 동일 키("snw_api_key") 사용
 * ------------------------------------------------------
 */

(() => {
	"use strict";

	/* ==============================
	 * 1. 공통 유틸리티 및 전역 상수
	 *    (P000_common_070.js + P001_API_070.js 의존)
	 * ============================== */
	// $, text, apiFetch, buildWsUrl, getApiKey, notify, showLoading, hideLoading
	// SNW_API.API_HTTP_*

	/* ==============================
	 * 2. 전역 상태
	 * ============================== */
	let g_config = {};
	let g_presets = [];
	let paused = false;
	let configDirty = false;

	const refreshLabel = document.getElementById("refreshInfo");

	// 프리셋 한글 표시 매핑
	const presetNameMap = {
		COUNTRY: "들판",
		MEDITERRANEAN: "지중해",
		OCEAN: "바다",
		MOUNTAIN: "산바람",
		PLAINS: "평야",
		FOREST_CANOPY: "숲속",
		HARBOR_BREEZE: "항구바람",
		URBAN_SUNSET: "도심석양",
		TROPICAL_RAIN: "열대우림",
		DESERT_NIGHT: "사막밤"
	};
	const displayPresetName = (n) => presetNameMap[n] || n;

	/* ==============================
	 * 3. Dirty 상태 버튼 UI
	 * ============================== */
	function setDirtyStatus(isDirty) {
		configDirty = isDirty;
		const btn = $("#btnSaveAllConfig");
		if (!btn) return;

		if (isDirty) {
			btn.classList.add("warn");
			btn.style.backgroundColor = "#dc2626";
			btn.style.color = "#fff";
			btn.textContent = "⚠️ 전체 Config 저장 (미저장)";
		} else {
			btn.classList.remove("warn");
			btn.style.backgroundColor = "#2ecc71";
			btn.style.color = "#fff";
			btn.textContent = "✅ 전체 Config 저장 완료";
		}
	}

	/* ==============================
	 * 4. 초기화 (DOMContentLoaded)
	 * ============================== */
	document.addEventListener("DOMContentLoaded", () => {
		bindEvents();
		loadConfigAndFillUI();
		initChartWebSocket();
	});

	function bindEvents() {
		$("#btnPreviewPreset")?.addEventListener("click", previewPreset);
		$("#btnSaveSim")?.addEventListener("click", saveSim);
		$("#btnSaveTiming")?.addEventListener("click", saveTiming);
		$("#btnConfigInit")?.addEventListener("click", saveConfigInit);
		$("#btnSaveAllConfig")?.addEventListener("click", saveAllConfig);

		$("#btnPause")?.addEventListener("click", () => (paused = true));
		$("#btnResume")?.addEventListener("click", () => (paused = false));
		$("#btnResetZoomAll")?.addEventListener("click", resetAllChartsZoom);

		document.querySelectorAll(".btn-toggle").forEach((btn) => {
			btn.addEventListener("click", toggleChartContent);
		});
	}

	/* ==============================
	 * 5. /api/config 로딩 → UI 반영
	 * ============================== */
	async function loadConfigAndFillUI() {
		showLoading();
		const cfg = await apiFetch(SNW_API.API_HTTP_CONFIG, { method: "GET" }, true);
		if (!cfg) {
			hideLoading();
			notify("설정 상태 로딩 실패", "err");
			return;
		}
		g_config = cfg;

		// ---- 프리셋 목록 ----
		let presets = [];
		if (cfg.motion && Array.isArray(cfg.motion.presets)) {
			presets = cfg.motion.presets;
		} else if (Array.isArray(cfg.windProfiles)) {
			presets = cfg.windProfiles;
		}
		g_presets = presets;

		const selPreset = $("#preset");
		if (selPreset) {
			selPreset.innerHTML = "";
			if (!presets || presets.length === 0) {
				const opt = document.createElement("option");
				opt.value = "";
				opt.textContent = "(프리셋 없음)";
				selPreset.appendChild(opt);
			} else {
				presets.forEach((p, idx) => {
					const opt = document.createElement("option");
					const value = p.id ?? p.code ?? p.name ?? String(idx);
					const label = p.label || p.name || displayPresetName(p.code || value);
					opt.value = value;
					opt.textContent = label;
					selPreset.appendChild(opt);
				});
			}
		}

		// ---- Motion / Wind ----
		let motion = null;
		if (cfg.motion && cfg.motion.current) motion = cfg.motion.current;
		else if (cfg.motion && cfg.motion.active) motion = cfg.motion.active;
		else if (cfg.control && cfg.control.wind) motion = cfg.control.wind;

		if (motion) {
			if ($("#intensity")) $("#intensity").value = motion.intensity ?? "";
			if ($("#gust_freq")) $("#gust_freq").value = motion.gust_freq ?? "";
			if ($("#variability")) $("#variability").value = motion.variability ?? "";
			if ($("#fanLimit")) $("#fanLimit").value = motion.fanLimit ?? "";
			if ($("#minFan")) $("#minFan").value = motion.minFan ?? "";
			if ($("#turb_len")) $("#turb_len").value = motion.turb_len ?? "";
			if ($("#turb_sig")) $("#turb_sig").value = motion.turb_sig ?? "";
			if ($("#therm_str")) $("#therm_str").value = motion.therm_str ?? "";
			if ($("#therm_rad")) $("#therm_rad").value = motion.therm_rad ?? "";

			if ($("#preset") && motion.preset_id != null) {
				const id = motion.preset_id;
				if ($("#preset").querySelector(`option[value="${id}"]`)) {
					$("#preset").value = id;
				}
			}
		}

		// ---- Timing ----
		const timing = (cfg.motion && cfg.motion.timing) ? cfg.motion.timing : cfg.timing;
		if (timing) {
			if ($("#sim_int")) $("#sim_int").value = timing.simIntervalMs ?? "";
			if ($("#gust_int")) $("#gust_int").value = timing.gustIntervalMs ?? "";
			if ($("#thermal_int")) $("#thermal_int").value = timing.thermalIntervalMs ?? "";
		}

		setDirtyStatus(false);
		notify("설정 상태 로딩 완료", "ok");
		hideLoading();
	}

	/* ==============================
	 * 6. 저장 및 초기화 (공통 apiFetch 사용)
	 * ============================== */
	function previewPreset() {
		const sel = $("#preset");
		if (!sel) return;
		notify(`"${displayPresetName(sel.value)}" 미리보기 적용`, "info");
	}

	async function saveSim() {
		const body = {
			intensity: Number($("#intensity")?.value || 0),
			gustFreq: Number($("#gust_freq")?.value || 0),
			variability: Number($("#variability")?.value || 0),
			fanLimit: Number($("#fanLimit")?.value || 0),
			minFan: Number($("#minFan")?.value || 0),
			turbLenScale: Number($("#turb_len")?.value || 0),
			turbSigma: Number($("#turb_sig")?.value || 0),
			thermalBubbleStrength: Number($("#therm_str")?.value || 0),
			thermalBubbleRadius: Number($("#therm_rad")?.value || 0),
			presetCode: $("#preset") ? ($("#preset").value || null) : null
		};

		await apiFetch(SNW_API.API_HTTP_SIMULATION, {
			method: "POST",
			body: JSON.stringify(body)
		}, false, "시뮬(모션) 설정");

		setDirtyStatus(true);
	}

	async function saveTiming() {
		const body = {
			timing: {
				simIntervalMs: Number($("#sim_int")?.value || 0),
				gustIntervalMs: Number($("#gust_int")?.value || 0),
				thermalIntervalMs: Number($("#thermal_int")?.value || 0)
			}
		};

		await apiFetch(SNW_API.API_HTTP_MOTION, {
			method: "POST",
			body: JSON.stringify(body)
		}, false, "타이밍 설정");

		setDirtyStatus(true);
	}

	async function saveConfigInit() {
		if (!confirm("⚠️ 모든 설정을 기본값으로 초기화합니다.\n진행하시겠습니까?")) return;

		await apiFetch(SNW_API.API_HTTP_CONFIG_INIT, {
			method: "POST",
			body: JSON.stringify({ factory: true })
		}, false, "시스템 전체 초기화");

		await loadConfigAndFillUI();
	}

	async function saveAllConfig() {
		if (!configDirty) {
			notify("저장할 변경 사항이 없습니다.", "info");
			return;
		}
		if (!confirm("현재까지의 메모리 변경 내용을 모두 Flash에 저장하시겠습니까?")) return;

		await apiFetch(SNW_API.API_HTTP_CONFIG_SAVE, {
			method: "POST",
			body: JSON.stringify({ save_all: true })
		}, false, "전체 Config 저장");

		setDirtyStatus(false);
	}

	/* ==============================
	 * 7. 차트 토글 / 초기화
	 * ============================== */
	function toggleChartContent(e) {
		const btn = e.currentTarget;
		const container = btn.closest(".chart-container");
		if (!container) return;
		const content = container.querySelector(".chart-content");
		if (!content) return;

		if (content.style.display === "none") {
			content.style.display = "block";
			btn.textContent = "▲";
		} else {
			content.style.display = "none";
			btn.textContent = "▼";
		}
	}

	const charts = [];

	function initChart(ctx, config) {
		if (!ctx) return null;
		const chart = new Chart(ctx, config);
		charts.push(chart);
		return chart;
	}

	const chartOptionsBase = {
		animation: false,
		parsing: false,
		normalized: true,
		plugins: {
			legend: { position: "bottom" },
			zoom: {
				zoom: { wheel: { enabled: true }, mode: "x" },
				pan: { enabled: true, mode: "x" }
			}
		},
		scales: {
			x: {
				type: "time",
				time: { unit: "second", displayFormats: { second: 'HH:mm:ss' } },
				adapters: { date: { locale: 'ko-KR' } },
				ticks: { autoSkip: true, maxRotation: 0 }
			}
		}
	};

	const toXY = (arr, key) =>
		arr.map((e) => ({
			x: typeof e.t === 'number' ? e.t : new Date(e.t).getTime(),
			y: e[key]
		}));

	// 캔버스 참조
	const ctxWind = $("#chartWind");
	const ctxParam = $("#chartParams");
	const ctxTurbThermSig = $("#chartTurbThermSig");
	const ctxEvent = $("#chartEvents");
	const ctxPreset = $("#chartPreset");
	const ctxTiming = $("#chartTiming");

	const chartWind = initChart(ctxWind, {
		type: "line",
		data: {
			datasets: [
				{ label: "풍속 (m/s)", yAxisID: "yWind", borderColor: "#2196f3", data: [], tension: 0.3 },
				{ label: "PWM Duty (%)", yAxisID: "yPWM", borderColor: "#ff6384", data: [], tension: 0.3 }
			]
		},
		options: {
			...chartOptionsBase,
			scales: {
				...chartOptionsBase.scales,
				yWind: { position: "left", min: 0, max: 20 },
				yPWM: { position: "right", min: 0, max: 100, grid: { drawOnChartArea: false } }
			}
		}
	});

	const chartParam = initChart(ctxParam, {
		type: "line",
		data: {
			datasets: [
				{ label: "강도(Intensity)", borderColor: "#4caf50", data: [] },
				{ label: "가변성(Variability)", borderColor: "#ff9800", data: [] },
				{ label: "팬 최대(Fan Limit)", borderColor: "#00bcd4", data: [] },
				{ label: "팬 최소(Min Fan)", borderColor: "#e91e63", data: [] }
			]
		},
		options: {
			...chartOptionsBase,
			plugins: { ...chartOptionsBase.plugins, legend: { position: "bottom" } }
		}
	});

	const chartTurbThermSig = initChart(ctxTurbThermSig, {
		type: "line",
		data: {
			datasets: [
				{ label: "난류 시그마(Turb Sig)", yAxisID: "ySig", borderColor: "#9c27b0", data: [], tension: 0.3 },
				{ label: "난류 길이(Turb Len)", yAxisID: "yLen", borderColor: "#795548", data: [], tension: 0.3 },
				{ label: "열기포 세기(Therm Str)", yAxisID: "ySig", borderColor: "#8bc34a", data: [], tension: 0.3, borderDash: [5, 5] },
				{ label: "열기포 반경(Therm Rad)", yAxisID: "yLen", borderColor: "#ffc107", data: [], tension: 0.3, borderDash: [5, 5] }
			]
		},
		options: {
			...chartOptionsBase,
			scales: {
				...chartOptionsBase.scales,
				ySig: { position: "left", min: 0, max: 5 },
				yLen: { position: "right", min: 0, max: 200, grid: { drawOnChartArea: false } }
			}
		}
	});

	const chartEvent = initChart(ctxEvent, {
		type: "line",
		data: {
			datasets: [
				{ label: "돌풍(Gust)", borderColor: "#f44336", data: [], stepped: true },
				{ label: "열기포(Thermal)", borderColor: "#03a9f4", data: [], stepped: true }
			]
		},
		options: {
			...chartOptionsBase,
			scales: {
				...chartOptionsBase.scales,
				y: { min: 0, max: 1 }
			}
		}
	});

	const chartPreset = initChart(ctxPreset, {
		type: "line",
		data: {
			datasets: [
				{ label: "Preset Index", borderColor: "#607d8b", data: [], stepped: true }
			]
		},
		options: {
			...chartOptionsBase,
			scales: {
				...chartOptionsBase.scales,
				y: { min: 0 }
			}
		}
	});

	const chartTiming = initChart(ctxTiming, {
		type: "line",
		data: {
			datasets: [
				{ label: "Sim Interval (ms)", borderColor: "#9e9e9e", data: [], tension: 0.3 },
				{ label: "돌풍 간격(Gust Interval) (ms)", borderColor: "#e0e0e0", data: [], tension: 0.3 },
				{ label: "열기포 체크 간격(Thermal Interval)", borderColor: "#bdbdbd", data: [], tension: 0.3 }
			]
		},
		options: {
			...chartOptionsBase,
			scales: {
				...chartOptionsBase.scales,
				y: { min: 0 }
			}
		}
	});

	function resetAllChartsZoom() {
		charts.forEach((c) => c && c.resetZoom && c.resetZoom());
	}

	/* ==============================
	 * 8. WebSocket /ws/chart → 차트 갱신
	 * ============================== */
	function processChartData(recs) {
		if (!recs || !Array.isArray(recs) || !recs.length) {
			// if (!recs || !recs.length) {
			if (refreshLabel) refreshLabel.textContent = "WS 데이터 없음";
			return;
		}

		if (chartWind) {
			chartWind.data.datasets[0].data = toXY(recs, "wind");
			chartWind.data.datasets[1].data = toXY(recs, "pwm");
		}
		if (chartParam) {
			chartParam.data.datasets[0].data = toXY(recs, "intensity");
			chartParam.data.datasets[1].data = toXY(recs, "variability");
			chartParam.data.datasets[2].data = toXY(recs, "fanLimit");
			chartParam.data.datasets[3].data = toXY(recs, "minFan");
		}
		if (chartTurbThermSig) {
			chartTurbThermSig.data.datasets[0].data = toXY(recs, "turb_sig");
			chartTurbThermSig.data.datasets[1].data = toXY(recs, "turb_len");
			chartTurbThermSig.data.datasets[2].data = toXY(recs, "therm_str");
			chartTurbThermSig.data.datasets[3].data = toXY(recs, "therm_rad");
		}
		if (chartEvent) {
			chartEvent.data.datasets[0].data = toXY(recs, "gust").map((v) => ({ x: v.x, y: v.y ? 1 : 0 }));
			chartEvent.data.datasets[1].data = toXY(recs, "thermal").map((v) => ({ x: v.x, y: v.y ? 1 : 0 }));
		}
		if (chartPreset) {
			chartPreset.data.datasets[0].data = toXY(recs, "preset");
		}
		if (chartTiming) {
			chartTiming.data.datasets[0].data = toXY(recs, "sim_int");
			chartTiming.data.datasets[1].data = toXY(recs, "gust_int");
			chartTiming.data.datasets[2].data = toXY(recs, "thermal_int");
		}

		charts.forEach((c) => c && c.update("none"));

		const last = new Date(recs[recs.length - 1].t);
		if (refreshLabel) {
			refreshLabel.textContent = `🕒 WS 업데이트: ${last.toLocaleTimeString()} (데이터 ${recs.length}개)`;
		}
	}

	function initChartWebSocket() {
		let ws = null;

		function connect() {
			const url = buildWsUrl(SNW_API.WS_API_CHART);
			ws = new WebSocket(url);

			ws.onopen = () => {
				notify("WebSocket /ws/chart 연결 성공", "ok");
				if (refreshLabel) refreshLabel.textContent = "✅ 실시간 차트 데이터 수신 중...";
			};

			ws.onmessage = (event) => {
				if (paused) return;
				try {
					const data = JSON.parse(event.data);

					// toChartJson이 평면 배열 {chart: [...]}를 반환하므로
					if (Array.isArray(data.chart)) {
						processChartData(data.chart);
					}

					// if (data.chart && Array.isArray(data.chart)) {
					//   processChartData(data.chart);
					// }

				} catch (e) {
					console.warn("[ChartT1] WS 데이터 파싱 오류:", e);
					notify("WS 데이터 파싱 오류", "err");
				}
			};

			ws.onclose = () => {
				notify("WebSocket /ws/chart 연결 끊김, 5초 후 재연결", "warn");
				if (refreshLabel) refreshLabel.textContent = "❌ WS 연결 끊김. 재연결 시도 중...";
				setTimeout(connect, 5000);
			};

			ws.onerror = (e) => console.error("[ChartT1] WebSocket 오류:", e);
		}

		connect();
	}
})();
