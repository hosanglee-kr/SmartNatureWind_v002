/*
 * ------------------------------------------------------
 * 소스명 : P080_sch_t2_071.js
 * 모듈명 : Smart Nature Wind Schedule Manager Controller
 * ------------------------------------------------------
 * 기능 요약:
 * - /api/v001/schedules CRUD
 * - /api/v001/windProfile (presets/styles)
 * - config dirty/save
 * - Gemini AI (이름 제안 + 조정 최적화)
 * - [A] schNo/segNo 자동 제안 + 사전 검증
 * - [B] mode별 필드 조건부 표시 + Overlap 사전 검증
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

  const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

  // ======================= 2. 요일/시간 유틸 =======================
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

  // [A] schNo 자동 제안 (기존 최대값 + 10)
  function _suggestNextSchNo() {
    if (!currentSchedules.length) return 10;
    const maxNo = Math.max(...currentSchedules.map(s => Number(s.schNo) || 0), 0);
    return Math.floor(maxNo / 10 + 1) * 10;
  }

  // [A] segNo 자동 제안 (현재 DOM 기준)
  function _suggestNextSegNo() {
    const rows = SNW.$$("#segmentListBody .segment-row");
    let maxNo = 0;
    rows.forEach(r => {
      const n = Number(r.querySelector(".seg-no")?.value) || 0;
      if (n > maxNo) maxNo = n;
    });
    return maxNo + 10;
  }

  // [B] Overlap 사전 검증 (요일 + 시간)
  function checkOverlap(schedule) {
    const parseMin = (hhmm) => {
      if (!hhmm || !hhmm.includes(":")) return 0;
      const [h, m] = hhmm.split(":").map(Number);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };

    const newStart = parseMin(schedule.period.startTime);
    const newEnd   = parseMin(schedule.period.endTime);

    // start==end → 백엔드 정책: 항상 OFF 로 간주 → 검사 스킵
    if (newStart === newEnd) return [];

    const conflicts = [];
    for (const s of currentSchedules) {
      if (String(s.schId) === String(schedule.schId)) continue;
      if (!s.enabled || !schedule.enabled) continue;

      const sDays = s.period?.days;
      if (!Array.isArray(sDays) || sDays.length !== 7) continue;

      const dayOverlap = schedule.period.days.some((d, i) => d && sDays[i]);
      if (!dayOverlap) continue;

      const sStart = parseMin(s.period.startTime);
      const sEnd   = parseMin(s.period.endTime);
      if (sStart === sEnd) continue;

      // half-open [start, end) 비교 (cross-midnight 단순 처리)
      if (newStart < sEnd && sStart < newEnd) {
        conflicts.push(s);
      }
    }
    return conflicts;
  }

  // ======================= 3. 상태 =======================
  let currentSchedules = [];
  let windPresets = [];
  let windStyles  = [];
  let configDirty = false;

  // ======================= 4. Config Dirty =======================
  function setDirtyStatus(isDirty) {
    configDirty = !!isDirty;
    const btn = SNW.$("#btnSaveAllConfig");
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
      const apiKey = SNW.getApiKey();
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
      SNW.toast("저장할 변경 사항이 없습니다.", "warn");
      return;
    }
    const res = await SNW.api.post(API_CONFIG_SAVE, {}, "전체 설정 파일 저장");
    if (res !== null) {
      setDirtyStatus(false);
      await loadSchedules();
    }
  }

  // ======================= 5. WindDict =======================
  async function loadWindDict() {
    const data = await SNW.api.get(API_WIND_PROFILE, "");
    if (!data || !data.windDict) {
      windPresets = [];
      windStyles  = [];
      return;
    }
    windPresets = Array.isArray(data.windDict.presets) ? data.windDict.presets : [];
    windStyles  = Array.isArray(data.windDict.styles)  ? data.windDict.styles  : [];
  }

  // ======================= 6. 스케줄 목록 =======================
  async function loadSchedules() {
    const data = await SNW.api.get(API_SCHEDULES, "");
    const noMsg = SNW.$("#noScheduleMessage");

    currentSchedules = (data && Array.isArray(data.schedules)) ? data.schedules : [];
    renderScheduleList(currentSchedules);
    renderSchedulePreview();   // [Round 4-C #12]
    if (noMsg) noMsg.style.display = currentSchedules.length === 0 ? "block" : "none";
  }

  function renderScheduleList(schedules) {
    const tbody = SNW.$("#scheduleListBody");
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

  // ======================= 7. 모달 =======================
  function resetPeriodDaysUI() {
    SNW.$$("#periodDays label").forEach((lab) => lab.classList.remove("checked"));
    SNW.$$("#periodDays input[type='checkbox']").forEach((el) => (el.checked = false));
  }

  function applyPeriodDaysUI(days) {
    resetPeriodDaysUI();
    if (!Array.isArray(days) || days.length !== 7) return;
    SNW.$$("#periodDays input[type='checkbox']").forEach((input) => {
      const idx = Number(input.dataset.index);
      if (!Number.isNaN(idx) && days[idx]) {
        input.checked = true;
        const label = input.closest("label");
        if (label) label.classList.add("checked");
      }
    });
  }

  // [B] mode별 필드 상태 적용
  function applySegmentModeState(row) {
    const mode = row.querySelector(".seg-mode")?.value || "PRESET";
    const isPreset = mode === "PRESET";

    row.querySelector(".seg-preset")?.toggleAttribute("disabled", !isPreset);
    row.querySelector(".seg-style")?.toggleAttribute("disabled", !isPreset);
    row.querySelectorAll("[class^='seg-adj-']").forEach(el => el.toggleAttribute("disabled", !isPreset));
    row.querySelector(".seg-fixed-speed")?.toggleAttribute("disabled", isPreset);

    row.classList.toggle("mode-preset", isPreset);
    row.classList.toggle("mode-fixed", !isPreset);
  }

  function renderSegmentsInModal(segments) {
    const tbody = SNW.$("#segmentListBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const segs = Array.isArray(segments) ? segments : [];
    segs.forEach((seg) => addSegmentRow(seg, true));
  }

  // [A] segNo 자동 제안 / [B] mode 조건부
  function addSegmentRow(seg = null, appendToEnd = true) {
    const tbody = SNW.$("#segmentListBody");
    if (!tbody) return;

    const row = document.createElement("tr");
    row.className = "segment-row";

    const segId  = seg?.segId  ?? 0;
    const segNo  = seg?.segNo  ?? _suggestNextSegNo();
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

    // [B] mode change 리스너
    row.querySelector(".seg-mode").addEventListener("change", () => applySegmentModeState(row));

    if (appendToEnd) tbody.appendChild(row);
    else tbody.insertBefore(row, tbody.firstChild);

    // 초기 상태 반영
    applySegmentModeState(row);
  }

  function openModal(schedule = null) {
    const modal = SNW.$("#scheduleModal");
    const form  = SNW.$("#scheduleForm");
    if (!modal || !form) return;

    form.reset();
    resetPeriodDaysUI();
    SNW.$("#segmentListBody").innerHTML = "";

    if (schedule) {
      SNW.$("#modalTitle").textContent = `스케줄 수정: ${schedule.name}`;
      SNW.$("#scheduleId").value = schedule.schId ?? "";
      SNW.$("#schNo").value      = schedule.schNo ?? "";
      SNW.$("#scheduleName").value = schedule.name || "";
      SNW.$("#isEnabled").checked  = !!schedule.enabled;
      SNW.$("#repeatSegments").checked = schedule.repeatSegments ?? true;
      SNW.$("#repeatCount").value = schedule.repeatCount ?? 1;

      const period = schedule.period || {};
      SNW.$("#periodStart").value = period.startTime || "08:00";
      SNW.$("#periodEnd").value   = period.endTime   || "23:00";
      applyPeriodDaysUI(Array.isArray(period.days) ? period.days : [1,1,1,1,1,1,1]);

      const ao      = schedule.autoOff || {};
      const timer   = ao.timer   || {};
      const offTime = ao.offTime || {};
      const offTemp = ao.offTemp || {};

      SNW.$("#autoOffTimerEnabled").checked = timer.enabled ?? false;
      SNW.$("#autoOffTimerMinutes").value   = timer.minutes ?? 0;
      SNW.$("#autoOffTimeEnabled").checked  = offTime.enabled ?? false;
      SNW.$("#autoOffTime").value           = offTime.time || "00:00";
      SNW.$("#autoOffTempEnabled").checked  = offTemp.enabled ?? false;
      SNW.$("#autoOffTemp").value           = offTemp.temp ?? 0;

      const motion = schedule.motion || {};
      const pir = motion.pir || {};
      SNW.$("#pirEnabled").checked = pir.enabled ?? false;
      SNW.$("#pirHoldSec").value   = pir.holdSec ?? 0;

      renderSegmentsInModal(schedule.segments || []);
    } else {
      SNW.$("#modalTitle").textContent = "새 스케줄 생성";
      SNW.$("#scheduleId").value = "";
      // [A] schNo 자동 제안
      SNW.$("#schNo").value = _suggestNextSchNo();
      SNW.$("#scheduleName").value = "";
      SNW.$("#isEnabled").checked = true;
      SNW.$("#repeatSegments").checked = true;
      SNW.$("#repeatCount").value = 1;
      SNW.$("#periodStart").value = "08:00";
      SNW.$("#periodEnd").value = "23:00";
      applyPeriodDaysUI([1,1,1,1,1,1,1]);

      SNW.$("#autoOffTimerEnabled").checked = false;
      SNW.$("#autoOffTimerMinutes").value = 0;
      SNW.$("#autoOffTimeEnabled").checked = false;
      SNW.$("#autoOffTime").value = "00:00";
      SNW.$("#autoOffTempEnabled").checked = false;
      SNW.$("#autoOffTemp").value = 0;

      SNW.$("#pirEnabled").checked = true;
      SNW.$("#pirHoldSec").value = 120;

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
    const modal = SNW.$("#scheduleModal");
    if (modal) modal.style.display = "none";
  }

  // ======================= 8. 폼 → 객체 =======================
  function buildDaysFromUI() {
    const days = [0,0,0,0,0,0,0];
    SNW.$$("#periodDays input[type='checkbox']").forEach((input) => {
      const idx = Number(input.dataset.index);
      if (!Number.isNaN(idx) && idx >= 0 && idx < 7) days[idx] = input.checked ? 1 : 0;
    });
    return days;
  }

  function buildSegmentsFromUI() {
    const segments = [];
    SNW.$$("#segmentListBody .segment-row").forEach((row, idx) => {
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
    const schIdRaw = SNW.$("#scheduleId").value;
    const schId = schIdRaw ? Number(schIdRaw) : 0;

    return {
      schId,
      schNo: Number(SNW.$("#schNo").value) || 0,
      name: SNW.$("#scheduleName").value.trim(),
      enabled: SNW.$("#isEnabled").checked,
      repeatSegments: SNW.$("#repeatSegments").checked,
      repeatCount: Number(SNW.$("#repeatCount").value) || 0,
      period: {
        days: buildDaysFromUI(),
        startTime: SNW.$("#periodStart").value || "00:00",
        endTime:   SNW.$("#periodEnd").value   || "23:59",
      },
      segments: buildSegmentsFromUI(),
      autoOff: {
        timer:   { enabled: SNW.$("#autoOffTimerEnabled").checked, minutes: Number(SNW.$("#autoOffTimerMinutes").value) || 0 },
        offTime: { enabled: SNW.$("#autoOffTimeEnabled").checked,  time: SNW.$("#autoOffTime").value || "00:00" },
        offTemp: { enabled: SNW.$("#autoOffTempEnabled").checked,  temp: Number(SNW.$("#autoOffTemp").value) || 0 },
      },
      motion: {
        pir: { enabled: SNW.$("#pirEnabled").checked, holdSec: Number(SNW.$("#pirHoldSec").value) || 0 },
      },
    };
  }

  // ======================= 9. CRUD =======================
  // [A] schNo 사전 검증 + [A] segNo 중복 + [B] Overlap
  async function saveSchedule(event) {
    event.preventDefault();

    const schedule = buildScheduleFromForm();

    // 이름
    if (!schedule.name) { SNW.toast("스케줄 이름을 입력해주세요.", "err"); return; }

    // [A] schNo 검증
    if (!schedule.schNo || schedule.schNo <= 0) {
      SNW.toast("스케줄 번호(schNo)를 입력하세요 (0 초과).", "err");
      return;
    }
    const dupNo = currentSchedules.find(s =>
      Number(s.schNo) === schedule.schNo && String(s.schId) !== String(schedule.schId)
    );
    if (dupNo) {
      SNW.toast(`schNo ${schedule.schNo}은(는) "${dupNo.name}" 에서 사용 중입니다.`, "err");
      return;
    }

    // 세그먼트 존재
    if (!Array.isArray(schedule.segments) || schedule.segments.length === 0) {
      SNW.toast("최소 1개 이상의 세그먼트를 추가해주세요.", "err"); return;
    }

    // [A] segNo 중복/0 검증
    const segNos = schedule.segments.map(s => s.segNo);
    if (segNos.some(n => !n || n <= 0)) {
      SNW.toast("세그먼트 번호(segNo)는 0보다 커야 합니다.", "err");
      return;
    }
    const segSet = new Set(segNos);
    if (segSet.size !== segNos.length) {
      SNW.toast("세그먼트 번호(segNo)가 중복됩니다.", "err");
      return;
    }

    // [B] Overlap 검증 (경고만, 저장 진행)
    const conflicts = checkOverlap(schedule);
    if (conflicts.length > 0) {
      const list = conflicts.map(c => `"${c.name}" (${c.period.startTime}~${c.period.endTime})`).join(", ");
      SNW.toast(`⚠️ 시간 겹침: ${list}`, "warn");
      // 저장은 계속 (백엔드 정책 warn-only)
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
    const result = (method === "POST")
      ? await SNW.api.post(url, payload, desc)
      : await SNW.api.put(url, payload, desc);

    if (result !== null) {
      setDirtyStatus(true);
      closeModal();
      await loadSchedules();
    }
  }

  async function deleteSchedule(schId, name) {
    const result = await SNW.api.del(`${API_SCHEDULES}/${schId}`, `스케줄 ${name} 삭제`);
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

  // ======================= 10. Gemini AI =======================
  async function callGemini(prompt, systemInstruction = "", responseSchema = null) {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (responseSchema) {
      body.generationConfig.responseMimeType = "application/json";
      body.generationConfig.responseSchema = responseSchema;
    }
    const resp = await SNW.api.post(API_GEMINI_PROXY, body, "", true);
    return resp?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  async function handleSuggestName() {
    const nameInput = SNW.$("#scheduleName");
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

    SNW.loading.show();
    try {
      const suggested = await callGemini(userQuery, systemPrompt);
      if (suggested) {
        const clean = suggested.trim().replace(/^['"“‘”’\s]+/, '').replace(/['"“‘”’\s]+$/, '');
        nameInput.value = clean;
        SNW.toast(`AI 추천 이름: ${clean}`, "ok");
      }
    } catch (e) {
      SNW.toast(`이름 추천 실패: ${e.message}`, "err");
    } finally {
      SNW.loading.hide();
    }
  }

  async function handleOptimizeAdjust(button) {
    const row = button.closest(".segment-row");
    if (!row) return;

    const mode = row.querySelector(".seg-mode")?.value;
    if (mode !== "PRESET") {
      SNW.toast("프리셋 모드일 때만 AI 최적화를 사용할 수 있습니다.", "warn");
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

    SNW.loading.show();
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

      SNW.toast(`AI 조정 완료 — 강도 ${iV.toFixed(1)}, 변동 ${vV.toFixed(1)}`, "ok");
    } catch (e) {
      SNW.toast(`AI 조정 실패: ${e.message}`, "err");
    } finally {
      SNW.loading.hide();
    }
  }
  
 // ======================= 10-1. 스케줄 미리보기 (#12) =======================

function computeUpcomingActivations(limit = 5) {
	const now = new Date();
	const DAY_MS = 86400000;
	const events = [];
	
	for (const s of currentSchedules) {
		if (!s.enabled) continue;
		const days = s.period?.days;
		if (!Array.isArray(days) || days.length !== 7) continue;
		
		const startTime = s.period.startTime || "00:00";
		const endTime = s.period.endTime || "23:59";
		const [sh, sm] = startTime.split(":").map(Number);
		const startMin = (sh || 0) * 60 + (sm || 0);
		
		// 향후 7일 내 첫 발생 시각 탐색
		for (let d = 0; d < 7; d++) {
			const probe = new Date(now.getTime() + d * DAY_MS);
			// Config days[]: 0=Mon..6=Sun  /  JS getDay(): 0=Sun..6=Sat
			const jsDay = probe.getDay();
			const cfgDay = (jsDay === 0) ? 6 : (jsDay - 1);
			if (!days[cfgDay]) continue;
			
			const startDate = new Date(probe);
			startDate.setHours(sh || 0, sm || 0, 0, 0);
			
			if (startDate.getTime() > now.getTime()) {
				events.push({
					ts: startDate.getTime(),
					schId: s.schId,
					schNo: s.schNo,
					name: s.name,
					startTime,
					endTime
				});
				break;
			}
		}
	}
	
	events.sort((a, b) => a.ts - b.ts);
	return events.slice(0, limit);
}

function renderSchedulePreview() {
	const el = document.getElementById("schedulePreviewList");
	if (!el) return;
	
	const list = computeUpcomingActivations(5);
	if (!list.length) {
		el.innerHTML = '<div class="muted">예정된 스케줄 없음</div>';
		return;
	}
	
	const now = Date.now();
	el.innerHTML = list.map((e) => {
		const diffMin = Math.round((e.ts - now) / 60000);
		let when;
		if (diffMin < 1) when = "곧 시작";
		else if (diffMin < 60) when = `${diffMin}분 후`;
		else if (diffMin < 1440) when = `${Math.round(diffMin / 60)}시간 후`;
		else when = `${Math.round(diffMin / 1440)}일 후`;
		
		const d = new Date(e.ts);
		const pad = (n) => String(n).padStart(2, "0");
		const tsStr = `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
		
		return `<div class="preview-line">
            <span class="pv-time">${tsStr}</span>
            <span class="pv-name">${e.name || "#" + e.schNo} <span class="muted">(${e.startTime}~${e.endTime})</span></span>
            <span class="pv-when">${when}</span>
        </div>`;
	}).join("");
}


  // ======================= 11. 이벤트 =======================
  function bindEvents() {
    SNW.$("#btnCreateNew")?.addEventListener("click", () => openModal(null));
    SNW.$("#btnRefreshList")?.addEventListener("click", loadSchedules);
    SNW.$("#btnRefreshPreview")?.addEventListener("click", renderSchedulePreview);
    SNW.$("#btnSaveAllConfig")?.addEventListener("click", saveAllConfig);
    SNW.$("#btnSuggestName")?.addEventListener("click", handleSuggestName);

    SNW.$("#btnCloseModal")?.addEventListener("click", closeModal);
    SNW.$("#btnCancelModal")?.addEventListener("click", closeModal);
    SNW.$("#scheduleForm")?.addEventListener("submit", saveSchedule);
    SNW.$("#scheduleListBody")?.addEventListener("click", handleScheduleActions);

    const periodDays = SNW.$("#periodDays");
    if (periodDays) {
      periodDays.addEventListener("change", (e) => {
        const input = e.target.closest("input[type='checkbox']");
        if (!input) return;
        const label = input.closest("label");
        if (label) label.classList.toggle("checked", input.checked);
      });
    }

    SNW.$("#btnAddSegment")?.addEventListener("click", () => addSegmentRow(null, true));

    SNW.$("#segmentListBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".btn-del-seg");
      if (del) {
        const row = del.closest(".segment-row");
        if (row && row.parentNode) row.parentNode.removeChild(row);
        return;
      }
      const aiBtn = e.target.closest(".btn-ai-adjust");
      if (aiBtn) { handleOptimizeAdjust(aiBtn); return; }
    });
  }

  // ======================= 12. 초기화 =======================
  document.addEventListener("DOMContentLoaded", async () => {
    if (!SNW.getApiKey()) {
      SNW.toast("API Key가 비어 있습니다. 메인 설정 페이지에서 먼저 설정해 주세요.", "warn");
    }
    bindEvents();
    await loadWindDict();
    await loadSchedules();
    pollConfigDirty();
  });
})();
