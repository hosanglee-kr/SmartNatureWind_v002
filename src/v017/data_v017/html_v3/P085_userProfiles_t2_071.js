/*
 * ------------------------------------------------------
 * 소스명 : P085_userProfiles_t2_071.js
 * 모듈명 : Smart Nature Wind User Profile Manager Controller
 * ------------------------------------------------------
 * - /api/v001/user_profiles CRUD
 * - /api/v001/windProfile (presets/styles)
 * - /api/v001/control/profile/select · stop (실행/중지)
 * - /api/v001/state 30초 폴링 (실행 중 프로파일 표시)
 * - API Key: localStorage["snw_api_key"]
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

  const API_KEY_STORAGE_KEY = "snw_api_key";
  const MAX_PROFILES        = 6;
  const MAX_SEGMENTS        = 8;
  const STATE_POLL_MS       = 30000;

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
    const rows = $$("#segmentsBody .segment-row");
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
    const btn = $("#btnSaveAllConfig");
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
      const apiKey = getApiKey();
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
      toast("저장할 변경 사항이 없습니다.", "warn");
      return;
    }
    const res = await fetchApi(API_CONFIG_SAVE, "POST", {}, "전체 설정 파일 저장");
    if (res !== null) {
      setDirtyStatus(false);
      await loadUserProfiles();
    }
  }

  // ======================= 6. WindDict =======================
  async function loadWindDict() {
    const data = await fetchApi(API_WIND_PROFILE, "GET", null, "");
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
      const data = await fetchApi(API_STATE, "GET", null, "");
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
    const badge = $("#activeProfileBadge");
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
    const el = $("#profileCount");
    if (!el) return;
    el.textContent = `${currentProfiles.length}/${MAX_PROFILES}`;
    el.className = currentProfiles.length >= MAX_PROFILES
      ? "info-label err"
      : "info-label info";
  }

  // ======================= 8. 목록 =======================
  async function loadUserProfiles() {
    const data = await fetchApi(API_USER_PROFILES, "GET", null, "");
    const noMsg = $("#noProfileMessage");

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
    const tbody = $("#profileListBody");
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
    const tbody = $("#segmentsBody");
    if (!tbody) return;

    const currentCount = tbody.querySelectorAll(".segment-row").length;
    if (!seg && currentCount >= MAX_SEGMENTS) {
      toast(`세그먼트는 최대 ${MAX_SEGMENTS}개까지 추가 가능합니다.`, "warn");
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
      <td>
        <button type="button" class="btn btn-small btn-err btn-del-seg">삭제</button>
      </td>
    `;

    row.querySelector(".seg-mode").addEventListener("change", () => applySegmentModeState(row));

    if (appendToEnd) tbody.appendChild(row);
    else tbody.insertBefore(row, tbody.firstChild);

    applySegmentModeState(row);
  }

  function openModal(profile = null) {
    const modal = $("#profileModal");
    const form  = $("#profileForm");
    if (!modal || !form) return;

    form.reset();
    $("#segmentsBody").innerHTML = "";

    if (profile) {
      $("#modalTitle").textContent = `프로파일 수정: ${profile.name}`;
      $("#profileId").value   = profile.profileId ?? "";
      $("#profileNo").value   = profile.profileNo ?? "";
      $("#profileName").value = profile.name || "";
      $("#profileEnabled").checked = profile.enabled !== false;
      $("#repeatSegments").checked = profile.repeatSegments !== false;
      $("#repeatCount").value = profile.repeatCount ?? 1;

      const ao = profile.autoOff || {};
      const timer   = ao.timer   || {};
      const offTime = ao.offTime || {};
      const offTemp = ao.offTemp || {};

      $("#autoOffTimerEnabled").checked    = timer.enabled ?? false;
      $("#autoOffTimerMinutes").value      = timer.minutes ?? 0;
      $("#autoOffOffTimeEnabled").checked  = offTime.enabled ?? false;
      $("#autoOffOffTimeTime").value       = offTime.time || "00:00";
      $("#autoOffOffTempEnabled").checked  = offTemp.enabled ?? false;
      $("#autoOffOffTempTemp").value       = offTemp.temp ?? 0;

      const pir = profile.motion?.pir || {};
      $("#motionPirEnabled").checked = pir.enabled ?? false;
      $("#motionPirHold").value      = pir.holdSec ?? 0;

      const segs = Array.isArray(profile.segments) ? profile.segments : [];
      segs.forEach((s) => addSegmentRow(s, true));
    } else {
      $("#modalTitle").textContent = "새 프로파일 생성";
      $("#profileId").value   = "";
      $("#profileNo").value   = _suggestNextProfileNo();
      $("#profileName").value = "";
      $("#profileEnabled").checked = true;
      $("#repeatSegments").checked = true;
      $("#repeatCount").value = 1;

      $("#autoOffTimerEnabled").checked   = false;
      $("#autoOffTimerMinutes").value     = 0;
      $("#autoOffOffTimeEnabled").checked = false;
      $("#autoOffOffTimeTime").value      = "00:00";
      $("#autoOffOffTempEnabled").checked = false;
      $("#autoOffOffTempTemp").value      = 0;

      $("#motionPirEnabled").checked = false;
      $("#motionPirHold").value      = 0;

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
    const modal = $("#profileModal");
    if (modal) modal.style.display = "none";
  }

  // ======================= 10. 폼 → 객체 =======================
  function buildSegmentsFromUI() {
    const segments = [];
    $$("#segmentsBody .segment-row").forEach((row, idx) => {
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
    const idRaw = $("#profileId").value;
    const profileId = idRaw ? Number(idRaw) : 0;

    return {
      profileId,
      profileNo: Number($("#profileNo").value) || 0,
      name: $("#profileName").value.trim(),
      enabled: $("#profileEnabled").checked,
      repeatSegments: $("#repeatSegments").checked,
      repeatCount: Number($("#repeatCount").value) || 0,
      segments: buildSegmentsFromUI(),
      autoOff: {
        timer:   { enabled: $("#autoOffTimerEnabled").checked,    minutes: Number($("#autoOffTimerMinutes").value) || 0 },
        offTime: { enabled: $("#autoOffOffTimeEnabled").checked,  time: $("#autoOffOffTimeTime").value || "00:00" },
        offTemp: { enabled: $("#autoOffOffTempEnabled").checked,  temp: Number($("#autoOffOffTempTemp").value) || 0 },
      },
      motion: {
        pir: {
          enabled: $("#motionPirEnabled").checked,
          holdSec: Number($("#motionPirHold").value) || 0,
        },
      },
    };
  }

  // ======================= 11. CRUD =======================
  async function saveProfile(event) {
    event.preventDefault();

    const profile = buildProfileFromForm();

    if (!profile.name) { toast("프로파일 이름을 입력하세요.", "err"); return; }

    if (!profile.profileNo || profile.profileNo <= 0) {
      toast("프로파일 번호(profileNo)를 입력하세요 (0 초과).", "err");
      return;
    }
    const dupNo = currentProfiles.find(p =>
      Number(p.profileNo) === profile.profileNo &&
      String(p.profileId) !== String(profile.profileId)
    );
    if (dupNo) {
      toast(`profileNo ${profile.profileNo}은(는) "${dupNo.name}"에서 사용 중입니다.`, "err");
      return;
    }

    if (!profile.segments.length) {
      toast("최소 1개 이상의 세그먼트가 필요합니다.", "err");
      return;
    }

    const segNos = profile.segments.map(s => s.segNo);
    if (segNos.some(n => !n || n <= 0)) {
      toast("세그먼트 번호(segNo)는 0보다 커야 합니다.", "err");
      return;
    }
    if (new Set(segNos).size !== segNos.length) {
      toast("세그먼트 번호(segNo)가 중복됩니다.", "err");
      return;
    }

    const isUpdate = !!profile.profileId;
    let url = API_USER_PROFILES;
    let method = "POST";
    let desc = "새 프로파일 생성";

    if (isUpdate) {
      url = `${API_USER_PROFILES}/${profile.profileId}`;
      method = "PUT";
      desc = `프로파일 ${profile.profileId} 수정`;
    }

    const result = await fetchApi(url, method, { profile }, desc);
    if (result !== null) {
      setDirtyStatus(true);
      closeModal();
      await loadUserProfiles();
    }
  }

  async function deleteProfile(profileId, name) {
    if (!confirm(`프로파일 [${name} (ID: ${profileId})] 을(를) 삭제하시겠습니까?`)) return;
    const result = await fetchApi(`${API_USER_PROFILES}/${profileId}`, "DELETE", null, `프로파일 ${name} 삭제`);
    if (result !== null) {
      setDirtyStatus(true);
      await loadUserProfiles();
    }
  }

  // [필수 1] 실행/중지
  async function runProfile(profileNo) {
    const result = await fetchApi(
      API_PROF_SELECT, "POST",
      { id: Number(profileNo) },
      `프로파일 #${profileNo} 실행`
    );
    if (result) {
      // 즉시 상태 갱신
      await pollActiveProfile();
    }
  }

  async function stopProfile() {
    const result = await fetchApi(API_PROF_STOP, "POST", null, "프로파일 중지");
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
        toast("실행 중인 프로파일은 삭제 전에 먼저 중지하세요.", "warn");
        return;
      }
      await deleteProfile(profile.profileId, profile.name);
    }
  }

  // ======================= 12. 이벤트 =======================
  function bindEvents() {
    $("#btnCreateNewProfile")?.addEventListener("click", () => {
      // [필수 3] 최대 개수 방어
      if (currentProfiles.length >= MAX_PROFILES) {
        toast(`프로파일은 최대 ${MAX_PROFILES}개까지 생성 가능합니다.`, "warn");
        return;
      }
      openModal(null);
    });

    $("#btnRefreshList")?.addEventListener("click", loadUserProfiles);
    $("#btnSaveAllConfig")?.addEventListener("click", saveAllConfig);

    $("#btnCloseModal")?.addEventListener("click", closeModal);
    $("#btnCancelModal")?.addEventListener("click", closeModal);
    $("#profileForm")?.addEventListener("submit", saveProfile);

    $("#profileListBody")?.addEventListener("click", handleProfileActions);

    $("#btnAddSegment")?.addEventListener("click", () => addSegmentRow(null, true));

    $("#segmentsBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".btn-del-seg");
      if (del) {
        const row = del.closest(".segment-row");
        if (row && row.parentNode) row.parentNode.removeChild(row);
      }
    });
  }

  // ======================= 13. 초기화 =======================
  document.addEventListener("DOMContentLoaded", async () => {
    if (!getApiKey()) {
      toast("API Key가 비어 있습니다. 메인 설정 페이지에서 먼저 설정해 주세요.", "warn");
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
				toast(`편집 대상 프로파일(ID ${editId})을 찾을 수 없습니다.`, "warn");
			}
		}

  });
})();