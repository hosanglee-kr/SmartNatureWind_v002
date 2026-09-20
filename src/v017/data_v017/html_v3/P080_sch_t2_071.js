/*
 * ------------------------------------------------------
 * 소스명 : P080_schedules_t2_071.js
 * 모듈명 : Smart Nature Wind Schedule Manager Controller
 * ------------------------------------------------------
 * 기능 요약:
 * - /api/v001/schedules (GET/POST/PUT/DELETE) : C10 풀 구조 기반 CRUD
 * - /api/v001/windProfile (GET) : presets/styles 로드 → 세그먼트에서 선택
 * - /api/v001/config/dirty · /config/save 연동
 * - Gemini AI (P030 통합) : 이름 제안 + 조정 최적화
 * - API Key: localStorage["snw_api_key"]
 * ------------------------------------------------------
 */

(() => {
  "use strict";

  // ======================= 1. 상수 =======================
  const API_BASE            = "/api/v001";
  const API_SCHEDULES       = `${API_BASE}/schedules`;
  const API_WIND_PROFILE    = `${API_BASE}/windProfile`;
  const API_CONFIG_DIRTY    = `${API_BASE}/config/dirty`;
  const API_CONFIG_SAVE     = `${API_BASE}/config/save`;
  const API_GEMINI_PROXY    = `${API_BASE}/ai/gemini`;

  const API_KEY_STORAGE_KEY = "snw_api_key";

  // [C-1] 요일 매핑: 0=월, 1=화, ..., 5=토, 6=일
  const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const getApiKey = () => {
    try { return localStorage.getItem(API_KEY_STORAGE_KEY) || ""; } catch { return ""; }
  };

  const setLoading = (flag) => {
    const el = $("#loadingOverlay");
    if (el) el.style.display = flag ? "flex" : "none";
  };

  const toast = (msg, type = "info") => {
    if (typeof window.showToast === "function") window.showToast(msg, type);
    else console.log(`[TOAST-${type}]`, msg);
  };

  async function fetchApi(url, method = "GET", body = null, desc = "") {
    setLoading(true);
    try {
      const opt = { method, headers: { Accept: "application/json" } };
      const apiKey = getApiKey();
      if (apiKey) opt.headers["X-API-Key"] = apiKey;

      if (body) {
        opt.headers["Content-Type"] = "application/json";
        opt.body = JSON.stringify(body);
      }

      const resp = await fetch(url, opt);
      const text = await resp.text();

      if (resp.status === 401) {
        toast(`[401] ${desc || "작업"} 실패: 인증 필요`, "err");
        throw new Error("Unauthorized");
      }
      if (!resp.ok) {
        toast(`${desc || "작업"} 실패: ${text || resp.status}`, "err");
        throw new Error(text || String(resp.status));
      }
      if (desc && method !== "GET") toast(`${desc} 성공`, "ok");

      if (!text) return null;
      try { return JSON.parse(text); } catch { return text; }
    } catch (e) {
      if (e.message !== "Unauthorized") {
        console.error(e);
        if (desc) toast(`${desc} 실패: ${e.message}`, "err");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  // [C-1] 요일 → 텍스트 (0=월 ~ 6=일)
  const formatDaysFromBoolArray = (days) => {
    if (!Array.isArray(days) || days.length !== 7) return "-";

    const onIndices = [];
    for (let i = 0; i < 7; i++) if (days[i]) onIndices.push(i);

    if (onIndices.length === 0) return "미사용";
    if (onIndices.length === 7) return "매일";

    const isWeekdays = onIndices.length === 5 &&
      onIndices[0] === 0 && onIndices[1] === 1 && onIndices[2] === 2 &&
      onIndices[3] === 3 && onIndices[4] === 4;
    if (isWeekdays) return "주중(월-금)";

    const isWeekend = onIndices.length === 2 &&
      onIndices.includes(5) && onIndices.includes(6);
    if (isWeekend) return "주말(토,일)";

    return onIndices.map((d) => DAY_LABELS[d]).join(", ");
  };

  const formatTimeRange = (start, end) => {
    if (!start && !end) return "-";
    return `${start || "??:??"} ~ ${end || "??:??"}`;
  };

  const summarizeSegments = (segments) => {
    if (!Array.isArray(segments) || segments.length === 0) return "-";
    const first = segments[0];
    const mode = first.mode || "PRESET";
    if (mode === "FIXED") {
      return `FIXED ${first.fixedSpeed ?? 0}% 포함, 총 ${segments.length}개`;
    }
    const preset = first.presetCode || "PRESET";
    const style  = first.styleCode || "";
    return `${preset}${style ? "/" + style : ""} 포함, 총 ${segments.length}개`;
  };

  // ======================= 2. 상태 =======================
  let currentSchedules = [];
  let windPresets = [];
  let windStyles  = [];
  let configDirty = false;

  // ======================= 3. Config Dirty =======================
  function setDirtyStatus(isDirty) {
    configDirty = !!isDirty;
    const btn = $("#btnSaveAllConfig");
    if (!btn) return;
    if (configDirty) {
      btn.style.backgroundColor = "#dc2626";
      btn.style.color = "#ffffff";
      btn.textContent = "⚠️ 전체 설정 저장 (스케줄 변경 미저장)";
    } else {
      btn.style.backgroundColor = "";
      btn.style.color = "";
      btn.textContent = "전체 설정 저장";
    }
  }

  async function pollConfigDirty() {
    try {
      const apiKey = getApiKey();
      const resp = await fetch(API_CONFIG_DIRTY, {
        headers: { Accept: "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) },
      });
      if (resp.ok) {
        const j = await resp.json();
        setDirtyStatus(!!j.schedules);
      }
    } catch (e) {
      console.warn("[Schedule] config dirty 조회 실패:", e.message);
    } finally {
      setTimeout(pollConfigDirty, 5000);
    }
  }

  async function saveAllConfig() {
    if (!configDirty) {
      toast("저장할 변경 사항이 없습니다.", "warn");
      return;
    }
    const res = await fetchApi(API_CONFIG_SAVE, "POST", {}, "전체 설정 파일 저장");
    if (res !== null) {
      setDirtyStatus(false);
      await loadSchedules();
    }
  }

  // ======================= 4. WindDict 로드 =======================
  // [C-7] 응답 경로: data.windDict (기존 windProfile → windDict)
  async function loadWindDict() {
    const data = await fetchApi(API_WIND_PROFILE, "GET", null, "");
    if (!data || !data.windDict) {
      windPresets = [];
      windStyles  = [];
      return;
    }
    const wp = data.windDict;
    windPresets = Array.isArray(wp.presets) ? wp.presets : [];
    windStyles  = Array.isArray(wp.styles)  ? wp.styles  : [];
  }

  // ======================= 5. 스케줄 목록 =======================
  async function loadSchedules() {
    const data = await fetchApi(API_SCHEDULES, "GET", null, "");
    const noMsg = $("#noScheduleMessage");

    if (data && Array.isArray(data.schedules)) {
      currentSchedules = data.schedules;
    } else {
      currentSchedules = [];
    }
    renderScheduleList(currentSchedules);
    if (noMsg) noMsg.style.display = currentSchedules.length === 0 ? "block" : "none";
  }

  function renderScheduleList(schedules) {
    const tbody = $("#scheduleListBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    schedules.forEach((s) => {
      const tr = document.createElement("tr");
      tr.dataset.schId = s.schId;

      const period = s.period || {};
      const days = Array.isArray(period.days) ? period.days : [1,1,1,1,1,1,1];

      const enabled = !!s.enabled;
      const statusClass = enabled ? "on" : "off";
      const statusText  = enabled ? "사용 중" : "비활성";

      const timeText   = formatTimeRange(period.startTime, period.endTime);
      const daysText   = formatDaysFromBoolArray(days);
      const segSummary = summarizeSegments(s.segments);

      tr.innerHTML = `
        <td>${s.schId ?? "-"}</td>
        <td>${s.schNo ?? "-"}</td>
        <td><strong>${s.name || "-"}</strong></td>
        <td class="text-mono">${timeText}</td>
        <td>${daysText}</td>
        <td>${segSummary}</td>
        <td><span class="schedule-status-label ${statusClass}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-small btn-edit" data-id="${s.schId}">수정</button>
            <button class="btn btn-small btn-err btn-delete" data-id="${s.schId}">삭제</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ======================= 6. 모달 =======================
  function resetPeriodDaysUI() {
    $$("#periodDays label").forEach((lab) => lab.classList.remove("checked"));
    $$("#periodDays input[type='checkbox']").forEach((el) => (el.checked = false));
  }

  function applyPeriodDaysUI(days) {
    resetPeriodDaysUI();
    if (!Array.isArray(days) || days.length !== 7) return;
    $$("#periodDays input[type='checkbox']").forEach((input) => {
      const idx = Number(input.dataset.index);
      if (!Number.isNaN(idx) && days[idx]) {
        input.checked = true;
        const label = input.closest("label");
        if (label) label.classList.add("checked");
      }
    });
  }

  function renderSegmentsInModal(segments) {
    const tbody = $("#segmentListBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const segs = Array.isArray(segments) ? segments : [];
    segs.forEach((seg, idx) => addSegmentRow(seg, true));
  }

  // [C-5][C-6] adjust camelCase 9필드, fixedSpeed camelCase
  function addSegmentRow(seg = null, appendToEnd = true) {
    const tbody = $("#segmentListBody");
    if (!tbody) return;

    const row = document.createElement("tr");
    row.className = "segment-row";

    const segId  = seg?.segId  ?? 0;
    const segNo  = seg?.segNo  ?? 10;
    const onMin  = seg?.onMinutes  ?? 10;
    const offMin = seg?.offMinutes ?? 0;
    const mode   = seg?.mode || "PRESET";
    const presetCode = seg?.presetCode || "";
    const styleCode  = seg?.styleCode  || "";
    const fixedSpeed = seg?.fixedSpeed ?? 0.0;

    const adj = seg?.adjust || {};
    const adjWind       = adj.windIntensity            ?? 0.0;
    const adjVar        = adj.windVariability          ?? 0.0;
    const adjGust       = adj.gustFrequency            ?? 0.0;
    const adjFanLimit   = adj.fanLimit                 ?? 0.0;
    const adjMinFan     = adj.minFan                   ?? 0.0;
    const adjTurbL      = adj.turbulenceLengthScale    ?? 0.0;
    const adjTurbSigma  = adj.turbulenceIntensitySigma ?? 0.0;
    const adjThermStr   = adj.thermalBubbleStrength    ?? 0.0;
    const adjThermRad   = adj.thermalBubbleRadius      ?? 0.0;

    const presetOptions = [
      `<option value="">(없음)</option>`,
      ...windPresets.map(p =>
        `<option value="${p.code}" ${p.code === presetCode ? "selected" : ""}>${p.code} - ${p.name}</option>`
      ),
    ].join("");

    const styleOptions = [
      `<option value="">(없음)</option>`,
      ...windStyles.map(s =>
        `<option value="${s.code}" ${s.code === styleCode ? "selected" : ""}>${s.code} - ${s.name}</option>`
      ),
    ].join("");

    row.innerHTML = `
      <td class="text-mono" style="font-size:0.75em;">${segId || "auto"}</td>
      <td><input type="number" class="seg-no" min="0" step="1" value="${segNo}" /></td>
      <td><input type="number" class="seg-on-min" min="0" step="1" value="${onMin}" /></td>
      <td><input type="number" class="seg-off-min" min="0" step="1" value="${offMin}" /></td>
      <td>
        <select class="seg-mode">
          <option value="PRESET" ${mode === "PRESET" ? "selected" : ""}>PRESET</option>
          <option value="FIXED"  ${mode === "FIXED"  ? "selected" : ""}>FIXED</option>
        </select>
      </td>
      <td><select class="seg-preset">${presetOptions}</select></td>
      <td><select class="seg-style">${styleOptions}</select></td>
      <td><input type="number" class="seg-fixed-speed" step="0.1" value="${fixedSpeed}" /></td>
      <td>
        <div class="grid grid-3">
          <input type="number" class="seg-adj-wind"    step="0.1" placeholder="강도" value="${adjWind}" />
          <input type="number" class="seg-adj-var"     step="0.1" placeholder="변동" value="${adjVar}" />
          <input type="number" class="seg-adj-gust"    step="0.1" placeholder="돌풍" value="${adjGust}" />
        </div>
        <div class="grid grid-2">
          <input type="number" class="seg-adj-fanlimit" step="0.1" placeholder="제한" value="${adjFanLimit}" />
          <input type="number" class="seg-adj-minfan"   step="0.1" placeholder="최소" value="${adjMinFan}" />
        </div>
      </td>
      <td>
        <div class="grid grid-3">
          <input type="number" class="seg-adj-turbl"    step="0.1" placeholder="L" value="${adjTurbL}" />
          <input type="number" class="seg-adj-turbs"    step="0.1" placeholder="σ" value="${adjTurbSigma}" />
          <input type="number" class="seg-adj-thermstr" step="0.1" placeholder="열세기" value="${adjThermStr}" />
        </div>
        <div class="grid grid-1">
          <input type="number" class="seg-adj-thermrad" step="0.1" placeholder="열반경" value="${adjThermRad}" />
        </div>
      </td>
      <td>
        <button type="button" class="btn btn-small btn-ai-adjust" title="AI 조정">🤖</button>
        <button type="button" class="btn btn-small btn-err btn-del-seg">삭제</button>
      </td>
    `;

    if (appendToEnd) tbody.appendChild(row);
    else tbody.insertBefore(row, tbody.firstChild);
  }

  function openModal(schedule = null) {
    const modal = $("#scheduleModal");
    const form  = $("#scheduleForm");
    if (!modal || !form) return;

    form.reset();
    resetPeriodDaysUI();
    $("#segmentListBody").innerHTML = "";

    if (schedule) {
      $("#modalTitle").textContent = `스케줄 수정: ${schedule.name}`;
      $("#scheduleId").value = schedule.schId ?? "";
      $("#schNo").value      = schedule.schNo ?? "";
      $("#scheduleName").value = schedule.name || "";
      $("#isEnabled").checked  = !!schedule.enabled;
      $("#repeatSegments").checked = schedule.repeatSegments ?? true;
      $("#repeatCount").value = schedule.repeatCount ?? 1;

      const period = schedule.period || {};
      $("#periodStart").value = period.startTime || "08:00";
      $("#periodEnd").value   = period.endTime   || "23:00";
      applyPeriodDaysUI(Array.isArray(period.days) ? period.days : [1,1,1,1,1,1,1]);

      const ao      = schedule.autoOff || {};
      const timer   = ao.timer   || {};
      const offTime = ao.offTime || {};
      const offTemp = ao.offTemp || {};

      $("#autoOffTimerEnabled").checked = timer.enabled ?? false;
      $("#autoOffTimerMinutes").value   = timer.minutes ?? 0;
      $("#autoOffTimeEnabled").checked  = offTime.enabled ?? false;
      $("#autoOffTime").value           = offTime.time || "00:00";
      $("#autoOffTempEnabled").checked  = offTemp.enabled ?? false;
      $("#autoOffTemp").value           = offTemp.temp ?? 0;

      const motion = schedule.motion || {};
      const pir = motion.pir || {};
      $("#pirEnabled").checked = pir.enabled ?? false;
      $("#pirHoldSec").value   = pir.holdSec ?? 0;

      renderSegmentsInModal(schedule.segments || []);
    } else {
      $("#modalTitle").textContent = "새 스케줄 생성";
      $("#scheduleId").value = "";
      $("#schNo").value = "";
      $("#scheduleName").value = "";
      $("#isEnabled").checked = true;
      $("#repeatSegments").checked = true;
      $("#repeatCount").value = 1;
      $("#periodStart").value = "08:00";
      $("#periodEnd").value = "23:00";
      applyPeriodDaysUI([1,1,1,1,1,1,1]);

      $("#autoOffTimerEnabled").checked = false;
      $("#autoOffTimerMinutes").value = 0;
      $("#autoOffTimeEnabled").checked = false;
      $("#autoOffTime").value = "00:00";
      $("#autoOffTempEnabled").checked = false;
      $("#autoOffTemp").value = 0;

      $("#pirEnabled").checked = true;
      $("#pirHoldSec").value = 120;

      addSegmentRow({
        segId: 0, segNo: 10, onMinutes: 20, offMinutes: 10,
        mode: "PRESET", presetCode: "", styleCode: "", fixedSpeed: 0,
        adjust: {
          windIntensity: 0, windVariability: 0, gustFrequency: 0,
          fanLimit: 0, minFan: 0,
          turbulenceLengthScale: 0, turbulenceIntensitySigma: 0,
          thermalBubbleStrength: 0, thermalBubbleRadius: 0,
        },
      }, true);
    }

    modal.style.display = "flex";
  }

  function closeModal() {
    const modal = $("#scheduleModal");
    if (modal) modal.style.display = "none";
  }

  // ======================= 7. 폼 → 객체 =======================
  function buildDaysFromUI() {
    const days = [0,0,0,0,0,0,0];
    $$("#periodDays input[type='checkbox']").forEach((input) => {
      const idx = Number(input.dataset.index);
      if (!Number.isNaN(idx) && idx >= 0 && idx < 7) days[idx] = input.checked ? 1 : 0;
    });
    return days;
  }

  // [C-5] adjust camelCase 9필드
  function buildSegmentsFromUI() {
    const segments = [];
    $$("#segmentListBody .segment-row").forEach((row, idx) => {
      const getVal = (sel) => row.querySelector(sel)?.value ?? "";

      segments.push({
        segId:     0,
        segNo:     Number(getVal(".seg-no")) || (idx + 1) * 10,
        onMinutes: Number(getVal(".seg-on-min")) || 0,
        offMinutes: Number(getVal(".seg-off-min")) || 0,
        mode:      getVal(".seg-mode") || "PRESET",
        presetCode: getVal(".seg-preset") || "",
        styleCode:  getVal(".seg-style") || "",
        fixedSpeed: Number(getVal(".seg-fixed-speed")) || 0,
        adjust: {
          windIntensity:            Number(getVal(".seg-adj-wind"))      || 0,
          windVariability:          Number(getVal(".seg-adj-var"))       || 0,
          gustFrequency:            Number(getVal(".seg-adj-gust"))      || 0,
          fanLimit:                 Number(getVal(".seg-adj-fanlimit"))  || 0,
          minFan:                   Number(getVal(".seg-adj-minfan"))    || 0,
          turbulenceLengthScale:    Number(getVal(".seg-adj-turbl"))     || 0,
          turbulenceIntensitySigma: Number(getVal(".seg-adj-turbs"))     || 0,
          thermalBubbleStrength:    Number(getVal(".seg-adj-thermstr"))  || 0,
          thermalBubbleRadius:      Number(getVal(".seg-adj-thermrad"))  || 0,
        },
      });
    });
    return segments;
  }

  function buildScheduleFromForm() {
    const schIdRaw = $("#scheduleId").value;
    const schId = schIdRaw ? Number(schIdRaw) : 0;

    return {
      schId,
      schNo: Number($("#schNo").value) || 0,
      name: $("#scheduleName").value.trim(),
      enabled: $("#isEnabled").checked,
      repeatSegments: $("#repeatSegments").checked,
      repeatCount: Number($("#repeatCount").value) || 0,
      period: {
        days: buildDaysFromUI(),
        startTime: $("#periodStart").value || "00:00",
        endTime:   $("#periodEnd").value   || "23:59",
      },
      segments: buildSegmentsFromUI(),
      autoOff: {
        timer:   { enabled: $("#autoOffTimerEnabled").checked, minutes: Number($("#autoOffTimerMinutes").value) || 0 },
        offTime: { enabled: $("#autoOffTimeEnabled").checked,  time: $("#autoOffTime").value || "00:00" },
        offTemp: { enabled: $("#autoOffTempEnabled").checked,  temp: Number($("#autoOffTemp").value) || 0 },
      },
      motion: {
        pir: { enabled: $("#pirEnabled").checked, holdSec: Number($("#pirHoldSec").value) || 0 },
      },
    };
  }

  // ======================= 8. CRUD =======================
  // [C-3] PUT 경로는 schId / [C-4] payload {schedule} 래핑
  async function saveSchedule(event) {
    event.preventDefault();

    const schedule = buildScheduleFromForm();
    if (!schedule.name) { toast("스케줄 이름을 입력해주세요.", "err"); return; }
    if (!Array.isArray(schedule.segments) || schedule.segments.length === 0) {
      toast("최소 1개 이상의 세그먼트를 추가해주세요.", "err"); return;
    }

    const isUpdate = !!schedule.schId;
    let url = API_SCHEDULES;
    let method = "POST";
    let desc = "새 스케줄 생성";

    if (isUpdate) {
      url = `${API_SCHEDULES}/${schedule.schId}`;
      method = "PUT";
      desc = `스케줄 ${schedule.schId} 수정`;
    }

    const payload = { schedule };
    const result = await fetchApi(url, method, payload, desc);
    if (result !== null) {
      setDirtyStatus(true);
      closeModal();
      await loadSchedules();
    }
  }

  async function deleteSchedule(schId, name) {
    const result = await fetchApi(`${API_SCHEDULES}/${schId}`, "DELETE", null, `스케줄 ${name} 삭제`);
    if (result !== null) {
      setDirtyStatus(true);
      await loadSchedules();
    }
  }

  async function handleScheduleActions(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const schId = target.dataset.id;
    if (!schId) return;

    const schedule = currentSchedules.find((s) => String(s.schId) === String(schId));
    if (!schedule) return;

    if (target.classList.contains("btn-edit")) {
      openModal(schedule);
    } else if (target.classList.contains("btn-delete")) {
      if (confirm(`정말로 스케줄 [${schedule.name} (ID: ${schedule.schId})] 을(를) 삭제하시겠습니까?`)) {
        await deleteSchedule(schedule.schId, schedule.name);
      }
    }
  }

  // ======================= 9. Gemini AI (P030 통합) =======================
  async function callGemini(prompt, systemInstruction = "", responseSchema = null) {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    if (responseSchema) {
      body.generationConfig.responseMimeType = "application/json";
      body.generationConfig.responseSchema = responseSchema;
    }

    const resp = await fetchApi(API_GEMINI_PROXY, { method: "POST", body: JSON.stringify(body) }, false, "");
    return resp?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  async function handleSuggestName() {
    const nameInput = $("#scheduleName");
    if (!nameInput) return;

    const item = buildScheduleFromForm();

    const dayString = item.period.days
      .map((d, i) => (d === 1 ? DAY_LABELS[i] : ""))
      .filter(Boolean)
      .join(", ") || "매일";

    const segmentString = item.segments.map(seg =>
      `${seg.onMinutes}분 ${seg.mode === "PRESET"
        ? (windPresets.find(p => p.code === seg.presetCode)?.name || seg.presetCode || "프리셋")
        : (seg.fixedSpeed + "%")}`
    ).join(" → ");

    const systemPrompt = "당신은 스마트 윈드 스케줄 시스템의 마케팅 전문가입니다. 제공된 설정 데이터를 기반으로 매력적이고, 직관적이며, 창의적인 스케줄 이름(4~10단어 이내)을 한국어로만 한 개 제안합니다. 다른 설명이나 인사말 없이 이름만 제공하세요.";

    const userQuery = `
스케줄 설정을 분석하여 이름을 제안해 주세요.
- 동작 시간대: ${item.period.startTime} ~ ${item.period.endTime}
- 동작 요일: ${dayString}
- 자동 종료: ${item.autoOff.timer.enabled ? `${item.autoOff.timer.minutes}분 후 종료` : "비활성"}
- 동작 단계: ${segmentString || "단계 없음"}

이름을 제안하세요:`;

    showLoading();
    try {
      const suggested = await callGemini(userQuery, systemPrompt);
      if (suggested) {
        const clean = suggested.trim().replace(/^['"“‘”’\s]+/, '').replace(/['"“‘”’\s]+$/, '');
        nameInput.value = clean;
        toast(`AI 추천 이름: ${clean}`, "ok");
      }
    } catch (e) {
      toast(`이름 추천 실패: ${e.message}`, "err");
    } finally {
      hideLoading();
    }
  }

  async function handleOptimizeAdjust(button) {
    const row = button.closest(".segment-row");
    if (!row) return;

    const mode = row.querySelector(".seg-mode")?.value;
    if (mode !== "PRESET") {
      toast("프리셋 모드일 때만 AI 최적화를 사용할 수 있습니다.", "warn");
      return;
    }

    const userPrompt = window.prompt("원하는 바람의 느낌을 짧게 설명하세요.\n(예: 더 부드럽고 약하게 / 더 강하고 역동적으로)");
    if (!userPrompt || !userPrompt.trim()) return;

    const presetCode = row.querySelector(".seg-preset")?.value || "";
    const presetName = windPresets.find(p => p.code === presetCode)?.name || presetCode || "(없음)";

    const systemPrompt = `당신은 스마트 윈드 시스템의 바람 엔지니어입니다. 사용자가 묘사한 바람의 느낌을 현실화하기 위해 필요한 'windIntensity' (강도)와 'windVariability' (변동성)의 조정값(Adjustment Value)을 JSON 형태로만 정확히 계산해 제공합니다.
조정값은 -1.0에서 +1.0 사이의 float(소수점 첫째 자리까지) 값이어야 합니다.`;

    const userQuery = `
현재 프리셋: ${presetName} (${presetCode})
사용자 요구사항: "${userPrompt}"

windIntensity와 windVariability를 조정하여 JSON으로 출력하십시오.`;

    showLoading();
    try {
      const responseSchema = {
        type: "OBJECT",
        properties: {
          windIntensity:   { type: "NUMBER" },
          windVariability: { type: "NUMBER" },
        },
        propertyOrdering: ["windIntensity", "windVariability"],
      };

      const jsonText = await callGemini(userQuery, systemPrompt, responseSchema);
      if (!jsonText) throw new Error("AI 응답 없음");

      const adj = JSON.parse(jsonText);
      const iV = Math.max(-1, Math.min(1, Math.round((adj.windIntensity   ?? 0) * 10) / 10));
      const vV = Math.max(-1, Math.min(1, Math.round((adj.windVariability ?? 0) * 10) / 10));

      const iInput = row.querySelector(".seg-adj-wind");
      const vInput = row.querySelector(".seg-adj-var");
      if (iInput) iInput.value = iV.toFixed(1);
      if (vInput) vInput.value = vV.toFixed(1);

      toast(`AI 조정 완료 — 강도 ${iV.toFixed(1)}, 변동 ${vV.toFixed(1)}`, "ok");
    } catch (e) {
      toast(`AI 조정 실패: ${e.message}`, "err");
    } finally {
      hideLoading();
    }
  }

  // ======================= 10. 이벤트 =======================
  function bindEvents() {
    $("#btnCreateNew")?.addEventListener("click", () => openModal(null));
    $("#btnRefreshList")?.addEventListener("click", loadSchedules);
    $("#btnSaveAllConfig")?.addEventListener("click", saveAllConfig);
    $("#btnSuggestName")?.addEventListener("click", handleSuggestName);

    $("#btnCloseModal")?.addEventListener("click", closeModal);
    $("#btnCancelModal")?.addEventListener("click", closeModal);
    $("#scheduleForm")?.addEventListener("submit", saveSchedule);
    $("#scheduleListBody")?.addEventListener("click", handleScheduleActions);

    const periodDays = $("#periodDays");
    if (periodDays) {
      periodDays.addEventListener("change", (e) => {
        const input = e.target.closest("input[type='checkbox']");
        if (!input) return;
        const label = input.closest("label");
        if (label) label.classList.toggle("checked", input.checked);
      });
    }

    $("#btnAddSegment")?.addEventListener("click", () => addSegmentRow(null, true));

    // 세그먼트 삭제/AI 조정 (이벤트 위임)
    $("#segmentListBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".btn-del-seg");
      if (del) {
        const row = del.closest(".segment-row");
        if (row && row.parentNode) row.parentNode.removeChild(row);
        return;
      }
      const aiBtn = e.target.closest(".btn-ai-adjust");
      if (aiBtn) {
        handleOptimizeAdjust(aiBtn);
        return;
      }
    });
  }

  // ======================= 11. 초기화 =======================
  document.addEventListener("DOMContentLoaded", async () => {
    if (!getApiKey()) {
      toast("API Key가 비어 있습니다. 메인 설정 페이지에서 먼저 설정해 주세요.", "warn");
    }
    bindEvents();
    await loadWindDict();
    await loadSchedules();
    pollConfigDirty();
  });
})();
