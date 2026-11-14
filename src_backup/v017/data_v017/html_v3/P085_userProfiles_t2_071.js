/*
 * ------------------------------------------------------
 * 소스명 : P085_userProfiles_t2_071.js
 * 모듈명 : Smart Nature Wind User Profile Manager Controller
 * ------------------------------------------------------
 * - /api/v001/user_profiles CRUD
 * - /api/v001/windProfile (presets/styles)
 * - /api/v001/control/profile/select · stop (실행/중지)
 * - /api/v001/state 30초 폴링 (실행 중 프로파일 표시)
 * ------------------------------------------------------
 */

(() => {
  "use strict";

  // ======================= 1. 상수 =======================
  const API_BASE          = "/api/v001";
  const API_USER_PROFILES = `${API_BASE}/user_profiles`;
  const API_WIND_PROFILE  = `${API_BASE}/windProfile`;
  const API_CONFIG_DIRTY  = `${API_BASE}/config/dirty`;
  const API_CONFIG_SAVE   = `${API_BASE}/config/save`;
  const API_STATE         = `${API_BASE}/state`;
  const API_PROF_SELECT   = `${API_BASE}/control/profile/select`;
  const API_PROF_STOP     = `${API_BASE}/control/profile/stop`;

  const MAX_PROFILES        = 6;
  const MAX_SEGMENTS        = 8;
  const STATE_POLL_MS       = 30000;

  // ======================= 2. 상태 =======================
  let currentProfiles = [];
  let windPresets = [];
  let windStyles  = [];
  let configDirty = false;
  let activeProfileNo = 0;       // 실행 중 프로파일 번호 (0=없음)
  let statePollTimer  = null;

  // ======================= 3. 자동 제안 =======================
  function _suggestNextProfileNo() {
    if (!currentProfiles.length) return 10;
    const maxNo = Math.max(...currentProfiles.map(p => Number(p.profileNo) || 0), 0);
    return Math.floor(maxNo / 10 + 1) * 10;
  }

  function _suggestNextSegNo() {
    const rows = SNW.$$("#segmentsBody .segment-row");
    let maxNo = 0;
    rows.forEach(r => {
      const n = Number(r.querySelector(".seg-no")?.value) || 0;
      if (n > maxNo) maxNo = n;
    });
    return maxNo + 10;
  }

  // ======================= 4. 요약 =======================
  function summarizeSegments(p) {
    const segs = p.segments || [];
    if (!segs.length) return "없음";
    const totalOn = segs.reduce((a, s) => a + (Number(s.onMinutes) || 0), 0);
    return `${segs.length}개 (합 ${totalOn}분)`;
  }

  function summarizeAutoOff(p) {
    const ao = p.autoOff || {};
    const parts = [];
    if (ao.timer?.enabled)   parts.push(`T ${ao.timer.minutes}분`);
    if (ao.offTime?.enabled) parts.push(`⏰ ${ao.offTime.time || "?"}`);
    if (ao.offTemp?.enabled) parts.push(`🌡 ${ao.offTemp.temp}℃`);
    return parts.length ? parts.join(" / ") : "OFF";
  }

  function summarizeMotion(p) {
    const pir = p.motion?.pir;
    if (!pir?.enabled) return "OFF";
    return `PIR ${pir.holdSec || 0}s`;
  }

  // ======================= 5. Config Dirty =======================
  function setDirtyStatus(isDirty) {
    configDirty = !!isDirty;
    const btn = SNW.$("#btnSaveAllConfig");
    if (!btn) return;
    if (configDirty) {
      btn.style.backgroundColor = "#dc2626";
      btn.style.color = "#ffffff";
      btn.textContent = "⚠️ 전체 설정 저장 (변경 미저장)";
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
        setDirtyStatus(!!j.userProfiles);
      }
    } catch (e) {
      console.warn("[UserProfiles] dirty 조회 실패:", e.message);
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
      await loadUserProfiles();
    }
  }

  // ======================= 6. WindDict =======================
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

  // ======================= 7. 실행 상태 폴링 [필수 2] =======================
  async function pollActiveProfile() {
    try {
      const data = await SNW.api.get(API_STATE, "", true);
      if (data && data.control) {
        const prof = data.control.profile || {};
        // [백엔드] fromRunSource=true일 때만 USER_PROFILE 실행 중
        const newNo = prof.fromRunSource ? (Number(prof.profileNo) || 0) : 0;

        if (newNo !== activeProfileNo) {
          activeProfileNo = newNo;
          // 상태 변경 시 목록 재렌더
          renderProfileList(currentProfiles);
          updateActiveIndicator();
        }
      }
    } catch (e) {
      console.warn("[UserProfiles] state 폴링 실패:", e.message);
    } finally {
      if (statePollTimer) clearTimeout(statePollTimer);
      statePollTimer = setTimeout(pollActiveProfile, STATE_POLL_MS);
    }
  }

  function updateActiveIndicator() {
    const badge = SNW.$("#activeProfileBadge");
    if (!badge) return;
    if (activeProfileNo > 0) {
      badge.style.display = "inline-block";
      const active = currentProfiles.find(p => Number(p.profileNo) === activeProfileNo);
      badge.textContent = `🟢 실행 중: ${active?.name || "#" + activeProfileNo}`;
    } else {
      badge.style.display = "none";
    }
  }

  function updateProfileCount() {
    const el = SNW.$("#profileCount");
    if (!el) return;
    el.textContent = `${currentProfiles.length}/${MAX_PROFILES}`;
    el.className = currentProfiles.length >= MAX_PROFILES
      ? "info-label err"
      : "info-label info";
  }

  // ======================= 8. 목록 =======================
  async function loadUserProfiles() {
    const data = await SNW.api.get(API_USER_PROFILES, "");
    const noMsg = SNW.$("#noProfileMessage");

    let profiles = [];
    if (data && data.userProfiles && Array.isArray(data.userProfiles.profiles)) {
      profiles = data.userProfiles.profiles;
    }

    currentProfiles = profiles;
    renderProfileList(profiles);
    updateProfileCount();
    updateActiveIndicator();

    if (noMsg) noMsg.style.display = profiles.length === 0 ? "block" : "none";
  }

  function renderProfileList(profiles) {
    const tbody = SNW.$("#profileListBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    profiles.forEach((p) => {
      const tr = document.createElement("tr");
      tr.dataset.profileId = p.profileId;

      const enabled = !!p.enabled;
      const isActive = Number(p.profileNo) === activeProfileNo;

      // [필수 2] 실행 중 강조
      if (isActive) tr.classList.add("active-profile");

      const statusClass = isActive ? "on" : (enabled ? "on" : "off");
      const statusText  = isActive ? "🟢 실행 중" : (enabled ? "사용" : "OFF");

      const repeatText = p.repeatSegments
        ? `반복 (${p.repeatCount || 0}회)`
        : "1회";

      // [필수 1] 실행/중지 버튼
      const runBtn = isActive
        ? `<button class="btn btn-small btn-err btn-stop" data-no="${p.profileNo}">⏹️</button>`
        : `<button class="btn btn-small btn-run" data-no="${p.profileNo}">▶️</button>`;

      tr.innerHTML = `
        <td>${p.profileId ?? "-"}</td>
        <td>${p.profileNo ?? "-"}</td>
        <td><strong>${p.name || "-"}</strong></td>
        <td>${summarizeSegments(p)}</td>
        <td>${repeatText}</td>
        <td>${summarizeAutoOff(p)}</td>
        <td>${summarizeMotion(p)}</td>
        <td><span class="schedule-status-label ${statusClass}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            ${runBtn}
            <button class="btn btn-small btn-edit" data-id="${p.profileId}">수정</button>
            <button class="btn btn-small btn-err btn-delete" data-id="${p.profileId}">삭제</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ===========================================================
  // [UX 확장] 순서 변경, 복제, AI 조정, 프리셋 힌트
  // ===========================================================
  function moveSegment(row, direction) {
    const tbody = row.parentNode;
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll(".segment-row"));
    const idx = rows.indexOf(row);
    if (idx < 0) return;

    if (direction === "up" && idx > 0) {
      tbody.insertBefore(row, rows[idx - 1]);
    } else if (direction === "down" && idx < rows.length - 1) {
      tbody.insertBefore(rows[idx + 1], row);
    } else {
      return;
    }

    renumberSegNos();
    updateMoveButtonStates();
    schedulePreviewUpdate();
    setDirtyStatus(true);
  }

  function renumberSegNos() {
    const rows = document.querySelectorAll("#segmentsBody .segment-row");
    rows.forEach((row, idx) => {
      const segNoInput = row.querySelector(".seg-no");
      if (segNoInput) segNoInput.value = (idx + 1) * 10;
    });
  }

  function updateMoveButtonStates() {
    const rows = Array.from(document.querySelectorAll("#segmentsBody .segment-row"));
    rows.forEach((row, idx) => {
      const up   = row.querySelector(".btn-move-up");
      const down = row.querySelector(".btn-move-down");
      if (up)   up.disabled   = (idx === 0);
      if (down) down.disabled = (idx === rows.length - 1);
    });
  }

  function duplicateSegment(row) {
    const tbody = row.parentNode;
    if (!tbody) return;

    const currentCount = tbody.querySelectorAll(".segment-row").length;
    if (currentCount >= MAX_SEGMENTS) {
      SNW.toast(`세그먼트는 최대 ${MAX_SEGMENTS}개까지 추가 가능합니다.`, "warn");
      return;
    }

    const clone = row.cloneNode(true);

    const newSegNo = _suggestNextSegNo();
    const segNoInput = clone.querySelector(".seg-no");
    if (segNoInput) segNoInput.value = newSegNo;

    const idCell = clone.querySelector("td:first-child");
    if (idCell) idCell.textContent = "auto";

    tbody.insertBefore(clone, row.nextSibling);

    bindSegmentRowEvents(clone);
    applySegmentModeState(clone);
    updateMoveButtonStates();
    schedulePreviewUpdate();

    SNW.toast("세그먼트를 복제했습니다.", "ok");
  }

  async function handleOptimizeAdjust(button) {
    const row = button.closest(".segment-row");
    if (!row) return;

    const mode = row.querySelector(".seg-mode")?.value;
    if (mode !== "PRESET") {
      SNW.toast("프리셋 모드일 때만 AI 최적화를 사용할 수 있습니다.", "warn");
      return;
    }

    const userPrompt = window.prompt(
      "원하는 바람의 느낌을 짧게 설명하세요.\n" +
      "(예: 더 부드럽고 약하게 / 더 강하고 역동적으로)"
    );
    if (!userPrompt || !userPrompt.trim()) return;

    const presetCode = row.querySelector(".seg-preset")?.value || "";
    const presetName = windPresets.find(p => p.code === presetCode)?.name || presetCode || "(없음)";

    const systemPrompt =
      "당신은 스마트 윈드 시스템의 바람 엔지니어입니다. 사용자가 묘사한 바람의 느낌을 현실화하기 위해 " +
      "필요한 'windIntensity'와 'windVariability'의 조정값을 JSON으로만 반환합니다. " +
      "조정값은 -1.0에서 +1.0 사이의 float(소수점 첫째 자리)입니다.";

    const userQuery =
      `현재 프리셋: ${presetName} (${presetCode})\n` +
      `사용자 요구: "${userPrompt}"\n\n` +
      `windIntensity와 windVariability를 조정하여 JSON으로 출력하십시오.`;

    const reqBody = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7, maxOutputTokens: 512,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            windIntensity:   { type: "NUMBER" },
            windVariability: { type: "NUMBER" },
          },
          propertyOrdering: ["windIntensity", "windVariability"],
        },
      },
    };

    SNW.loading.show();
    try {
      const data = await SNW.api.post(SNW_API.API_HTTP_GEMINI_PROXY, reqBody, "", true);
      if (!data) throw new Error("AI 응답 없음");

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("AI 응답 없음");

      const adj = JSON.parse(text);
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

  function bindPresetHint(row) {
    const sel = row.querySelector(".seg-preset");
    if (!sel) return;

    const showHint = () => {
      const code = sel.value;
      const hint = document.getElementById("presetHint");
      if (!hint) return;

      if (!code) {
        hint.innerHTML = '<span class="muted">💡 프리셋을 선택하세요.</span>';
        hint.classList.remove("active");
        return;
      }

      const preset = windPresets.find(p => p.code === code);
      if (preset && preset.factors) {
        const f = preset.factors;
        const r2 = (v) => Number.isFinite(Number(v)) ? Number(v).toFixed(1) : "-";
        hint.innerHTML =
          `🌊 <strong>${preset.name || code}</strong> — ` +
          `강도 ${r2(f.windIntensity)} · 변동 ${r2(f.windVariability)} · ` +
          `돌풍 ${r2(f.gustFrequency)} · 팬상한 ${r2(f.fanLimit)}`;
        hint.classList.add("active");
      } else {
        hint.innerHTML = `<span class="muted">${code} (설명 없음)</span>`;
        hint.classList.remove("active");
      }
    };

    sel.addEventListener("mouseenter", showHint);
    sel.addEventListener("focus", showHint);
    sel.addEventListener("change", showHint);
  }

  function bindSegmentRowEvents(row) {
    row.querySelector(".seg-mode")?.addEventListener("change", () => {
      applySegmentModeState(row);
      schedulePreviewUpdate();
    });

    row.querySelector(".btn-move-up")?.addEventListener("click", () => moveSegment(row, "up"));
    row.querySelector(".btn-move-down")?.addEventListener("click", () => moveSegment(row, "down"));
    row.querySelector(".btn-dup-seg")?.addEventListener("click", () => duplicateSegment(row));
    row.querySelector(".btn-ai-adjust")?.addEventListener("click", (e) => handleOptimizeAdjust(e.currentTarget));

    bindPresetHint(row);

    row.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", schedulePreviewUpdate);
      el.addEventListener("change", schedulePreviewUpdate);
    });
  }

  // ======================= 9. 모달 =======================
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

  function addSegmentRow(seg = null, appendToEnd = true) {
    const tbody = SNW.$("#segmentsBody");
    if (!tbody) return;

    const currentCount = tbody.querySelectorAll(".segment-row").length;
    if (!seg && currentCount >= MAX_SEGMENTS) {
      SNW.toast(`세그먼트는 최대 ${MAX_SEGMENTS}개까지 추가 가능합니다.`, "warn");
      return;
    }

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
      <td><input type="number" class="seg-on-min" min="0" max="1440" step="1" value="${onMin}" /></td>
      <td><input type="number" class="seg-off-min" min="0" max="1440" step="1" value="${offMin}" /></td>
      <td>
        <select class="seg-mode">
          <option value="PRESET" ${mode === "PRESET" ? "selected" : ""}>PRESET</option>
          <option value="FIXED"  ${mode === "FIXED"  ? "selected" : ""}>FIXED</option>
        </select>
      </td>
      <td><select class="seg-preset">${presetOptions}</select></td>
      <td><select class="seg-style">${styleOptions}</select></td>
      <td><input type="number" class="seg-fixed-speed" step="0.1" min="0" max="100" value="${fixedSpeed}" /></td>
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
        <div class="grid grid-2">
          <input type="number" class="seg-adj-turbl"    step="0.1" placeholder="L" value="${adjTurbL}" />
          <input type="number" class="seg-adj-turbs"    step="0.1" placeholder="σ" value="${adjTurbSigma}" />
        </div>
        <div class="grid grid-2">
          <input type="number" class="seg-adj-thermstr" step="0.1" placeholder="열세기" value="${adjThermStr}" />
          <input type="number" class="seg-adj-thermrad" step="0.1" placeholder="열반경" value="${adjThermRad}" />
        </div>
      </td>
      <td class="seg-actions">
        <button type="button" class="btn btn-small btn-move-up"   title="위로 이동">↑</button>
        <button type="button" class="btn btn-small btn-move-down" title="아래로 이동">↓</button>
        <button type="button" class="btn btn-small btn-dup-seg"   title="복제">📋</button>
        <button type="button" class="btn btn-small btn-ai-adjust" title="AI 조정">🤖</button>
        <button type="button" class="btn btn-small btn-err btn-del-seg" title="삭제">🗑</button>
      </td>
    `;

    if (appendToEnd) tbody.appendChild(row);
    else tbody.insertBefore(row, tbody.firstChild);

    bindSegmentRowEvents(row);
    applySegmentModeState(row);
  }

  // ═══════════════════════════════════════════════════════════
  // 실행 미리보기 & 실행 중 배지
  // ═══════════════════════════════════════════════════════════
  let _previewTimer = null;

  function schedulePreviewUpdate() {
    if (_previewTimer) clearTimeout(_previewTimer);
    _previewTimer = setTimeout(updatePreviewPanel, 200);
  }

  function updatePreviewPanel() {
    const pvDuration = document.getElementById("pvDuration");
    const pvSegCount = document.getElementById("pvSegCount");
    const pvRepeat   = document.getElementById("pvRepeat");
    const pvViz      = document.getElementById("pvTimelineViz");

    if (!pvViz) return;

    const rows = Array.from(document.querySelectorAll("#segmentsBody .segment-row"));
    const segments = rows.map((row) => {
      const getVal = (s) => row.querySelector(s)?.value ?? "";
      return {
        mode:       getVal(".seg-mode") || "PRESET",
        presetCode: getVal(".seg-preset") || "",
        styleCode:  getVal(".seg-style") || "",
        onMinutes:  Number(getVal(".seg-on-min"))  || 0,
        offMinutes: Number(getVal(".seg-off-min")) || 0,
        fixedSpeed: Number(getVal(".seg-fixed-speed")) || 0,
      };
    });

    const repeatEnabled = document.getElementById("repeatSegments")?.checked ?? true;
    const repeatCount   = Number(document.getElementById("repeatCount")?.value) || 0;

    let totalOn = 0, totalOff = 0;
    segments.forEach((s) => { totalOn += s.onMinutes; totalOff += s.offMinutes; });

    const cycleMinutes = totalOn + totalOff;

    let effectiveCycles = 1;
    if (repeatEnabled) {
      if (repeatCount > 0) effectiveCycles = repeatCount;
      else effectiveCycles = 0;
    }

    const fmtMin = (m) => {
      if (m < 60) return `${m}분`;
      const h = Math.floor(m / 60);
      const r = m % 60;
      return r ? `${h}시간 ${r}분` : `${h}시간`;
    };

    if (pvDuration) {
      if (!segments.length) {
        pvDuration.textContent = "-";
      } else if (effectiveCycles === 0) {
        pvDuration.textContent = `${fmtMin(cycleMinutes)} (무한 반복)`;
      } else {
        pvDuration.textContent = `${fmtMin(cycleMinutes * effectiveCycles)} (${effectiveCycles}회)`;
      }
    }
    if (pvSegCount) pvSegCount.textContent = String(segments.length);
    if (pvRepeat) {
      if (!repeatEnabled) pvRepeat.textContent = "1회";
      else if (repeatCount > 0) pvRepeat.textContent = `${repeatCount}회`;
      else pvRepeat.textContent = "무한";
    }

    if (!segments.length) {
      pvViz.innerHTML = '<div class="muted" style="padding:20px; text-align:center; width:100%;">세그먼트가 없습니다.</div>';
      return;
    }

    const total = segments.reduce((sum, s) => sum + s.onMinutes + s.offMinutes, 0);
    if (total === 0) {
      pvViz.innerHTML = '<div class="muted" style="padding:20px; text-align:center; width:100%;">시간 설정이 없습니다.</div>';
      return;
    }

    const bars = [];
    segments.forEach((s, idx) => {
      const onPct  = (s.onMinutes  / total) * 100;
      const offPct = (s.offMinutes / total) * 100;

      if (s.onMinutes > 0) {
        const label = s.mode === "FIXED"
          ? `S${idx+1} FIXED ${s.fixedSpeed}%`
          : `S${idx+1} ${s.presetCode || "PRESET"}`;
        const cls = s.mode === "FIXED" ? "pv-fixed" : "pv-preset";
        const tooltip = `${label} · ON ${s.onMinutes}분`;
        bars.push(`<div class="pv-bar ${cls}" style="flex:${onPct};" title="${tooltip}">${label}</div>`);
      }
      if (s.offMinutes > 0) {
        const tooltip = `S${idx+1} OFF ${s.offMinutes}분`;
        bars.push(`<div class="pv-bar pv-off" style="flex:${offPct};" title="${tooltip}">OFF</div>`);
      }
    });

    let vizHtml = bars.join("");
    if (repeatEnabled && repeatCount > 1) {
      vizHtml = vizHtml.replace(
        /(<div class="pv-bar pv-(?:preset|fixed)"[^>]*>)/g,
        (match, p1, offset, str) => {
          if (str.indexOf("pv-repeat-marker") < 0 && str.lastIndexOf(p1) === offset) {
            return p1 + `<span class="pv-repeat-marker">×${repeatCount}</span>`;
          }
          return match;
        }
      );
    }

    pvViz.innerHTML = vizHtml;
  }

  function updateLiveEditBadge(profile) {
    const badge = document.getElementById("liveEditBadge");
    if (!badge) return;

    const isRunning = profile && Number(profile.profileNo) === activeProfileNo;
    badge.style.display = isRunning ? "block" : "none";
  }

  function openModal(profile = null) {
    const modal = SNW.$("#profileModal");
    const form  = SNW.$("#profileForm");
    if (!modal || !form) return;

    form.reset();
    SNW.$("#segmentsBody").innerHTML = "";

    if (profile) {
      SNW.$("#modalTitle").textContent = `프로파일 수정: ${profile.name}`;
      SNW.$("#profileId").value   = profile.profileId ?? "";
      SNW.$("#profileNo").value   = profile.profileNo ?? "";
      SNW.$("#profileName").value = profile.name || "";
      SNW.$("#profileEnabled").checked = profile.enabled !== false;
      SNW.$("#repeatSegments").checked = profile.repeatSegments !== false;
      SNW.$("#repeatCount").value = profile.repeatCount ?? 1;

      const ao = profile.autoOff || {};
      const timer   = ao.timer   || {};
      const offTime = ao.offTime || {};
      const offTemp = ao.offTemp || {};

      SNW.$("#autoOffTimerEnabled").checked    = timer.enabled ?? false;
      SNW.$("#autoOffTimerMinutes").value      = timer.minutes ?? 0;
      SNW.$("#autoOffOffTimeEnabled").checked  = offTime.enabled ?? false;
      SNW.$("#autoOffOffTimeTime").value       = offTime.time || "00:00";
      SNW.$("#autoOffOffTempEnabled").checked  = offTemp.enabled ?? false;
      SNW.$("#autoOffOffTempTemp").value       = offTemp.temp ?? 0;

      const pir = profile.motion?.pir || {};
      SNW.$("#motionPirEnabled").checked = pir.enabled ?? false;
      SNW.$("#motionPirHold").value      = pir.holdSec ?? 0;

      const segs = Array.isArray(profile.segments) ? profile.segments : [];
      segs.forEach((s) => addSegmentRow(s, true));
    } else {
      SNW.$("#modalTitle").textContent = "새 프로파일 생성";
      SNW.$("#profileId").value   = "";
      SNW.$("#profileNo").value   = _suggestNextProfileNo();
      SNW.$("#profileName").value = "";
      SNW.$("#profileEnabled").checked = true;
      SNW.$("#repeatSegments").checked = true;
      SNW.$("#repeatCount").value = 1;

      SNW.$("#autoOffTimerEnabled").checked   = false;
      SNW.$("#autoOffTimerMinutes").value     = 0;
      SNW.$("#autoOffOffTimeEnabled").checked = false;
      SNW.$("#autoOffOffTimeTime").value      = "00:00";
      SNW.$("#autoOffOffTempEnabled").checked = false;
      SNW.$("#autoOffOffTempTemp").value      = 0;

      SNW.$("#motionPirEnabled").checked = false;
      SNW.$("#motionPirHold").value      = 0;

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

    updateMoveButtonStates();
    updatePreviewPanel();
    updateLiveEditBadge(profile);

    const hint = document.getElementById("presetHint");
    if (hint) {
      hint.innerHTML = '<span class="muted">💡 프리셋에 마우스를 올리면 설명이 표시됩니다.</span>';
      hint.classList.remove("active");
    }

    modal.style.display = "flex";
  }

  function closeModal() {
    const modal = SNW.$("#profileModal");
    if (modal) modal.style.display = "none";
  }

  // ======================= 10. 폼 → 객체 =======================
  function buildSegmentsFromUI() {
    const segments = [];
    SNW.$$("#segmentsBody .segment-row").forEach((row, idx) => {
      const getVal = (sel) => row.querySelector(sel)?.value ?? "";

      segments.push({
        segId: 0,
        segNo: Number(getVal(".seg-no")) || (idx + 1) * 10,
        onMinutes: Number(getVal(".seg-on-min")) || 0,
        offMinutes: Number(getVal(".seg-off-min")) || 0,
        mode: getVal(".seg-mode") || "PRESET",
        presetCode: getVal(".seg-preset") || "",
        styleCode:  getVal(".seg-style")  || "",
        fixedSpeed: Number(getVal(".seg-fixed-speed")) || 0,
        adjust: {
          windIntensity:            Number(getVal(".seg-adj-wind"))     || 0,
          windVariability:          Number(getVal(".seg-adj-var"))      || 0,
          gustFrequency:            Number(getVal(".seg-adj-gust"))     || 0,
          fanLimit:                 Number(getVal(".seg-adj-fanlimit")) || 0,
          minFan:                   Number(getVal(".seg-adj-minfan"))   || 0,
          turbulenceLengthScale:    Number(getVal(".seg-adj-turbl"))    || 0,
          turbulenceIntensitySigma: Number(getVal(".seg-adj-turbs"))    || 0,
          thermalBubbleStrength:    Number(getVal(".seg-adj-thermstr")) || 0,
          thermalBubbleRadius:      Number(getVal(".seg-adj-thermrad")) || 0,
        },
      });
    });
    return segments;
  }

  function buildProfileFromForm() {
    const idRaw = SNW.$("#profileId").value;
    const profileId = idRaw ? Number(idRaw) : 0;

    return {
      profileId,
      profileNo: Number(SNW.$("#profileNo").value) || 0,
      name: SNW.$("#profileName").value.trim(),
      enabled: SNW.$("#profileEnabled").checked,
      repeatSegments: SNW.$("#repeatSegments").checked,
      repeatCount: Number(SNW.$("#repeatCount").value) || 0,
      segments: buildSegmentsFromUI(),
      autoOff: {
        timer:   { enabled: SNW.$("#autoOffTimerEnabled").checked,    minutes: Number(SNW.$("#autoOffTimerMinutes").value) || 0 },
        offTime: { enabled: SNW.$("#autoOffOffTimeEnabled").checked,  time: SNW.$("#autoOffOffTimeTime").value || "00:00" },
        offTemp: { enabled: SNW.$("#autoOffOffTempEnabled").checked,  temp: Number(SNW.$("#autoOffOffTempTemp").value) || 0 },
      },
      motion: {
        pir: {
          enabled: SNW.$("#motionPirEnabled").checked,
          holdSec: Number(SNW.$("#motionPirHold").value) || 0,
        },
      },
    };
  }

  // ======================= 11. CRUD =======================
  async function saveProfile(event) {
    event.preventDefault();

    const profile = buildProfileFromForm();

    if (!profile.name) { SNW.toast("프로파일 이름을 입력하세요.", "err"); return; }

    if (!profile.profileNo || profile.profileNo <= 0) {
      SNW.toast("프로파일 번호(profileNo)를 입력하세요 (0 초과).", "err");
      return;
    }
    const dupNo = currentProfiles.find(p =>
      Number(p.profileNo) === profile.profileNo &&
      String(p.profileId) !== String(profile.profileId)
    );
    if (dupNo) {
      SNW.toast(`profileNo ${profile.profileNo}은(는) "${dupNo.name}"에서 사용 중입니다.`, "err");
      return;
    }

    if (!profile.segments.length) {
      SNW.toast("최소 1개 이상의 세그먼트가 필요합니다.", "err");
      return;
    }

    const segNos = profile.segments.map(s => s.segNo);
    if (segNos.some(n => !n || n <= 0)) {
      SNW.toast("세그먼트 번호(segNo)는 0보다 커야 합니다.", "err");
      return;
    }
    if (new Set(segNos).size !== segNos.length) {
      SNW.toast("세그먼트 번호(segNo)가 중복됩니다.", "err");
      return;
    }

    const isUpdate = !!profile.profileId;
    const url = isUpdate
      ? `${API_USER_PROFILES}/${profile.profileId}`
      : API_USER_PROFILES;
    const desc = isUpdate
      ? `프로파일 ${profile.profileId} 수정`
      : "새 프로파일 생성";

    const result = isUpdate
      ? await SNW.api.put(url, { profile }, desc)
      : await SNW.api.post(url, { profile }, desc);

    if (result === null) return;

    setDirtyStatus(true);

    // [신규] 저장 후 서버 재조회 → 실제 segId 반영
    await loadUserProfiles();

    const savedProfile = currentProfiles.find(p =>
      isUpdate
        ? String(p.profileId) === String(profile.profileId)
        : Number(p.profileNo) === profile.profileNo
    );

    if (!savedProfile) {
      if (isUpdate) closeModal();
      return;
    }

    // hidden profileId 갱신 (신규 생성 → PUT 경로로 재저장 가능)
    const idInput = document.getElementById("profileId");
    if (idInput) idInput.value = savedProfile.profileId;

    // 세그먼트 재렌더 (실제 segId 반영)
    const tbody = document.getElementById("segmentsBody");
    if (tbody) {
      tbody.innerHTML = "";
      (savedProfile.segments || []).forEach(seg => addSegmentRow(seg, true));
      updateMoveButtonStates();
      updatePreviewPanel();
    }

    // 모달 타이틀 갱신
    const title = document.getElementById("modalTitle");
    if (title) title.textContent = `프로파일 수정: ${savedProfile.name}`;

    if (isUpdate) {
      closeModal();
      SNW.toast("수정 완료", "ok");
    } else {
      SNW.toast("프로파일 생성 완료 · 세그먼트 ID 자동 반영", "ok");
    }
  }

  async function deleteProfile(profileId, name) {
    if (!confirm(`프로파일 [${name} (ID: ${profileId})] 을(를) 삭제하시겠습니까?`)) return;
    const result = await SNW.api.del(`${API_USER_PROFILES}/${profileId}`, `프로파일 ${name} 삭제`);
    if (result !== null) {
      setDirtyStatus(true);
      await loadUserProfiles();
    }
  }

  // [필수 1] 실행/중지
  async function runProfile(profileNo) {
    const result = await SNW.api.post(
      API_PROF_SELECT,
      { id: Number(profileNo) },
      `프로파일 #${profileNo} 실행`
    );
    if (result) {
      // 즉시 상태 갱신
      await pollActiveProfile();
    }
  }

  async function stopProfile() {
    const result = await SNW.api.post(API_PROF_STOP, null, "프로파일 중지");
    if (result) {
      await pollActiveProfile();
    }
  }

  async function handleProfileActions(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    // [필수 1] 실행
    if (target.classList.contains("btn-run")) {
      const no = target.dataset.no;
      if (no) await runProfile(no);
      return;
    }

    // [필수 1] 중지
    if (target.classList.contains("btn-stop")) {
      await stopProfile();
      return;
    }

    const profileId = target.dataset.id;
    if (!profileId) return;

    const profile = currentProfiles.find((p) => String(p.profileId) === String(profileId));
    if (!profile) return;

    if (target.classList.contains("btn-edit")) {
      // [D-4] 실행 중 편집 경고
      if (Number(profile.profileNo) === activeProfileNo) {
        if (!confirm(`프로파일 "${profile.name}"이 실행 중입니다.\n편집하시겠습니까? (변경사항은 다음 실행 시 반영됩니다)`)) return;
      }
      openModal(profile);
    } else if (target.classList.contains("btn-delete")) {
      // [필수 2] 실행 중 삭제 경고
      if (Number(profile.profileNo) === activeProfileNo) {
        SNW.toast("실행 중인 프로파일은 삭제 전에 먼저 중지하세요.", "warn");
        return;
      }
      await deleteProfile(profile.profileId, profile.name);
    }
  }

  // ======================= 12. 이벤트 =======================
  function bindEvents() {
    SNW.$("#btnCreateNewProfile")?.addEventListener("click", () => {
      // [필수 3] 최대 개수 방어
      if (currentProfiles.length >= MAX_PROFILES) {
        SNW.toast(`프로파일은 최대 ${MAX_PROFILES}개까지 생성 가능합니다.`, "warn");
        return;
      }
      openModal(null);
    });

    SNW.$("#btnRefreshList")?.addEventListener("click", loadUserProfiles);
    SNW.$("#btnSaveAllConfig")?.addEventListener("click", saveAllConfig);

    SNW.$("#btnCloseModal")?.addEventListener("click", closeModal);
    SNW.$("#btnCancelModal")?.addEventListener("click", closeModal);
    SNW.$("#profileForm")?.addEventListener("submit", saveProfile);

    SNW.$("#profileListBody")?.addEventListener("click", handleProfileActions);

    SNW.$("#btnAddSegment")?.addEventListener("click", () => addSegmentRow(null, true));

    SNW.$("#segmentsBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".btn-del-seg");
      if (del) {
        const row = del.closest(".segment-row");
        if (row && row.parentNode) {
          row.parentNode.removeChild(row);
          renumberSegNos();
          updateMoveButtonStates();
          schedulePreviewUpdate();
        }
      }
    });

    ["#repeatSegments", "#repeatCount"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.addEventListener("change", schedulePreviewUpdate);
        el.addEventListener("input",  schedulePreviewUpdate);
      }
    });
  }

  // ======================= 13. 초기화 =======================
  document.addEventListener("DOMContentLoaded", async () => {
    if (!SNW.getApiKey()) {
      SNW.toast("API Key가 비어 있습니다. 메인 설정 페이지에서 먼저 설정해 주세요.", "warn");
    }
    bindEvents();
    await loadWindDict();
    await loadUserProfiles();
    pollConfigDirty();
    pollActiveProfile();   // [필수 2] 30초 폴링 시작
    
    // [Round 4-C #11] P010에서 편집 요청(?edit=<profileId>) 수신
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      const target = currentProfiles.find((p) => String(p.profileId) === String(editId));
      if (target) {
        openModal(target);
        // URL 정리 (F5 재오픈 방지)
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        SNW.toast(`편집 대상 프로파일(ID ${editId})을 찾을 수 없습니다.`, "warn");
      }
    }
  });
})();