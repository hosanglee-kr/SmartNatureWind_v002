/* P030_sch_t1_062.js – 공통 유틸리티 통합 완성본 (전체 구현) */

/* P030_sch_t1_061.js – 백엔드 API 통합형 스케줄 관리 */
(() => {
  "use strict";

  // ──────────────────────────────────────────────
  // 1. 상수 (P001_API_061.js 의존)
  // ──────────────────────────────────────────────
  const API_SCHEDULES = SNW_API.API_HTTP_SCHEDULES;

  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

  // ──────────────────────────────────────────────
  // 2. 전역 상태
  // ──────────────────────────────────────────────
  let g_scheduleData = [];       // 전체 목록 캐시
  let g_editingId = null;       // 현재 편집 중인 스케줄 id (없으면 null)

  // ──────────────────────────────────────────────
  // 3. API 요청 래퍼 (공통 apiFetch 사용)
  // ──────────────────────────────────────────────
  async function loadSchedules() {
    const data = await apiFetch(API_SCHEDULES, { method: "GET" }, true);
    if (data && Array.isArray(data)) {
      g_scheduleData = data;
      renderScheduleList();
    } else {
      g_scheduleData = [];
      renderScheduleList();
    }
  }

  async function saveSchedule(item, isNew) {
    const url = isNew ? API_SCHEDULES : `${API_SCHEDULES}/${item.id}`;
    const method = isNew ? "POST" : "PUT";
    return await apiFetch(url, { method, body: JSON.stringify(item) }, false, "스케줄 저장");
  }

  async function deleteScheduleById(id) {
    await apiFetch(`${API_SCHEDULES}/${id}`, { method: "DELETE" }, false, "스케줄 삭제");
    await loadSchedules();
  }

  // ──────────────────────────────────────────────
  // 4. UI 렌더링
  // ──────────────────────────────────────────────
  function renderScheduleList() {
    const container = $("#scheduleListContainer");
    const placeholder = $("#listPlaceholder");
    if (!container) return;

    container.innerHTML = "";
    if (g_scheduleData.length === 0) {
      if (placeholder) placeholder.style.display = "block";
      $("#scheduleCount").textContent = "0";
      return;
    }
    if (placeholder) placeholder.style.display = "none";

    g_scheduleData.forEach((item) => {
      const daysActive = item.period?.days
        ?.map((d, i) => (d === 1 ? DAY_NAMES[i] : ""))
        .filter(Boolean)
        .join(", ") || "매일";

      const enabledClass = item.enabled ? "ok" : "err";
      const enabledText = item.enabled ? "활성" : "비활성";

      const div = document.createElement("div");
      div.className = "schedule-item";
      div.innerHTML = `
        <div style="flex-grow:1;">
          <span class="schedule-item-title">${item.name}</span>
          <div class="schedule-item-detail">
            ${item.period?.enabled ? `🕒 ${item.period.startTime} ~ ${item.period.endTime} | 🗓️ ${daysActive}` : "🕒 24시간"}
          </div>
        </div>
        <span class="info-label ${enabledClass}">${enabledText}</span>
      `;
      div.addEventListener("click", () => editSchedule(item));
      container.appendChild(div);
    });

    $("#scheduleCount").textContent = g_scheduleData.length;
  }

  function renderDaySelectors(days = [1,1,1,1,1,1,1]) {
    const container = $("#daySelectorsDetail");
    if (!container) return;
    container.innerHTML = "";
    DAY_NAMES.forEach((day, i) => {
      const checked = days[i] === 1;
      const div = document.createElement("div");
      div.innerHTML = `
        <label>
          <input type="checkbox" data-day="${i}" ${checked ? "checked" : ""}>
          <span>${day}</span>
        </label>
      `;
      container.appendChild(div);
    });
  }

  function renderSegments(segments) {
    const container = $("#segmentListDetail");
    if (!container) return;
    container.innerHTML = "";
    segments.forEach((seg, idx) => {
      const card = document.createElement("div");
      card.className = "segment-card";
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="row middle">
          <strong>Step ${idx + 1}</strong>
          <div class="space-x-2">
            <button class="btn btn-small" data-action="up" ${idx === 0 ? "disabled" : ""}>▲</button>
            <button class="btn btn-small" data-action="down" ${idx === segments.length - 1 ? "disabled" : ""}>▼</button>
            <button class="btn btn-small err" data-action="delete">삭제</button>
          </div>
        </div>
        <div class="grid mt-4">
          <div class="col-4">
            <label>작동 시간 (분)</label>
            <input type="number" data-key="onMinutes" min="1" value="${seg.onMinutes}">
          </div>
          <div class="col-4">
            <label>모드</label>
            <select data-key="mode">
              <option value="PRESET" ${seg.mode === "PRESET" ? "selected" : ""}>프리셋</option>
              <option value="FIXED" ${seg.mode === "FIXED" ? "selected" : ""}>고정 속도</option>
            </select>
          </div>
          <div class="col-4">
            <div data-mode="PRESET" style="display:${seg.mode === "PRESET" ? "block" : "none"}">
              <label>프리셋</label>
              <select data-key="presetCode">
                <option value="OCEAN" ${seg.presetCode === "OCEAN" ? "selected" : ""}>바다</option>
                <option value="MOUNTAIN" ${seg.presetCode === "MOUNTAIN" ? "selected" : ""}>산</option>
                <option value="FOREST" ${seg.presetCode === "FOREST" ? "selected" : ""}>숲</option>
              </select>
              <div class="mt-4">
                <label>강도 (${seg.adjust?.windIntensity?.toFixed(1) || 0})</label>
                <input type="range" data-key="adjust.windIntensity" min="-1" max="1" step="0.1" value="${seg.adjust?.windIntensity || 0}">
              </div>
              <div>
                <label>변동성 (${seg.adjust?.windVariability?.toFixed(1) || 0})</label>
                <input type="range" data-key="adjust.windVariability" min="-1" max="1" step="0.1" value="${seg.adjust?.windVariability || 0}">
              </div>
            </div>
            <div data-mode="FIXED" style="display:${seg.mode === "FIXED" ? "block" : "none"}">
              <label>고정 속도 (%)</label>
              <input type="number" data-key="fixedSpeed" min="0" max="100" value="${seg.fixedSpeed || 0}">
            </div>
          </div>
        </div>
      `;

      // 모드 전환
      card.querySelector("[data-key='mode']").addEventListener("change", (e) => {
        const isPreset = e.target.value === "PRESET";
        card.querySelector("[data-mode='PRESET']").style.display = isPreset ? "block" : "none";
        card.querySelector("[data-mode='FIXED']").style.display = isPreset ? "none" : "block";
      });

      container.appendChild(card);
    });
  }

  // ──────────────────────────────────────────────
  // 5. 데이터 수집
  // ──────────────────────────────────────────────
  function collectFormData() {
    const item = {
      id: g_editingId,  // null for new
      name: $("#scheduleNameDetail").value.trim(),
      enabled: $("#scheduleEnabledDetail").checked,
      period: {
        enabled: $("#periodEnabledDetail").checked,
        startTime: $("#startTimeDetail").value,
        endTime: $("#endTimeDetail").value,
        days: Array.from(document.querySelectorAll("#daySelectorsDetail input[type='checkbox']")).map(cb => cb.checked ? 1 : 0)
      },
      segments: Array.from(document.querySelectorAll("#segmentListDetail .segment-card")).map((card, idx) => ({
        segNo: idx + 1,
        onMinutes: Number(card.querySelector("[data-key='onMinutes']").value) || 1,
        mode: card.querySelector("[data-key='mode']").value,
        presetCode: card.querySelector("[data-key='mode']").value === "PRESET" ? card.querySelector("[data-key='presetCode']").value : "OCEAN",
        fixedSpeed: card.querySelector("[data-key='mode']").value === "FIXED" ? Number(card.querySelector("[data-key='fixedSpeed']").value) : 0,
        adjust: {
          windIntensity: Math.max(-1, Math.min(1, Number(card.querySelector("[data-key='adjust.windIntensity']").value) || 0)),
          windVariability: Math.max(-1, Math.min(1, Number(card.querySelector("[data-key='adjust.windVariability']").value) || 0))
        }
      })),
      autoOff: {
        timer: {
          enabled: $("#autoOffTimerEnabledDetail").checked,
          minutes: Number($("#autoOffTimerMinutesDetail").value) || 0
        },
        offTime: {
          enabled: $("#autoOffOffTimeEnabledDetail").checked,
          time: $("#autoOffOffTimeDetail").value
        },
        offTemp: {
          enabled: $("#autoOffOffTempEnabledDetail").checked,
          temp: Number($("#autoOffOffTempDetail").value) || 0
        }
      },
      motion: {
        pir: {
          enabled: $("#motionPirEnabledDetail").checked,
          holdSec: Number($("#motionPirHoldSecDetail").value) || 0
        },
        ble: {
          enabled: $("#motionBleEnabledDetail").checked,
          rssiThreshold: Number($("#motionBleRssiThresholdDetail").value) || -70,
          holdSec: Number($("#motionBleHoldSecDetail").value) || 0
        }
      }
    };

    if (!item.period.enabled) {
      item.period.startTime = "00:00";
      item.period.endTime = "23:59";
      item.period.days = [1,1,1,1,1,1,1];
    }

    return item;
  }

  // ──────────────────────────────────────────────
  // 6. 편집/저장/삭제
  // ──────────────────────────────────────────────
  function showDetail(item) {
    $("#scheduleListSection").classList.add("hidden");
    $("#scheduleDetailSection").classList.remove("hidden");

    g_editingId = item.id || null;
    $("#detailTitle").textContent = item.id ? `ID: ${item.id}` : "새 항목";
    $("#btnDeleteSchedule").classList.toggle("hidden", !item.id);

    $("#scheduleNameDetail").value = item.name || "";
    $("#scheduleEnabledDetail").checked = item.enabled !== false;

    const period = item.period || { enabled: false, startTime: "08:00", endTime: "18:00", days: [1,1,1,1,1,0,0] };
    $("#periodEnabledDetail").checked = period.enabled;
    $("#startTimeDetail").value = period.startTime || "08:00";
    $("#endTimeDetail").value = period.endTime || "18:00";
    renderDaySelectors(period.days);
    togglePeriodVisibility();

    renderSegments(item.segments || []);

    const autoOff = item.autoOff || {};
    $("#autoOffTimerEnabledDetail").checked = autoOff.timer?.enabled || false;
    $("#autoOffTimerMinutesDetail").value = autoOff.timer?.minutes || 0;
    $("#autoOffOffTimeEnabledDetail").checked = autoOff.offTime?.enabled || false;
    $("#autoOffOffTimeDetail").value = autoOff.offTime?.time || "23:59";
    $("#autoOffOffTempEnabledDetail").checked = autoOff.offTemp?.enabled || false;
    $("#autoOffOffTempDetail").value = autoOff.offTemp?.temp || 0;

    const motion = item.motion || {};
    $("#motionPirEnabledDetail").checked = motion.pir?.enabled || false;
    $("#motionPirHoldSecDetail").value = motion.pir?.holdSec || 0;
    $("#motionBleEnabledDetail").checked = motion.ble?.enabled || false;
    $("#motionBleRssiThresholdDetail").value = motion.ble?.rssiThreshold || -70;
    $("#motionBleHoldSecDetail").value = motion.ble?.holdSec || 0;

    toggleAutoOffVisibility();
    toggleMotionVisibility();
  }

  async function saveHandler() {
    const item = collectFormData();
    if (!item.name) { notify("이름을 입력하세요.", "warn"); return; }
    if (item.segments.length === 0) { notify("최소 1개의 단계가 필요합니다.", "warn"); return; }

    const isNew = !item.id;
    const saved = await saveSchedule(item, isNew);
    if (saved) {
      if (isNew && saved.id) item.id = saved.id;
      await loadSchedules();
      cancelEdit();
    }
  }

  async function deleteHandler() {
    if (!g_editingId) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteScheduleById(g_editingId);
    cancelEdit();
  }

  function cancelEdit() {
    $("#scheduleDetailSection").classList.add("hidden");
    $("#scheduleListSection").classList.remove("hidden");
    g_editingId = null;
  }

  function editSchedule(item) {
    showDetail(item);
  }

  function addNewSchedule() {
    showDetail({
      name: "새 스케줄",
      enabled: true,
      period: { enabled: true, startTime: "08:00", endTime: "18:00", days: [1,1,1,1,1,0,0] },
      segments: [{ segNo: 1, onMinutes: 60, mode: "PRESET", presetCode: "OCEAN", adjust: { windIntensity: 0, windVariability: 0 }, fixedSpeed: 0 }],
      autoOff: { timer: { enabled: false, minutes: 0 }, offTime: { enabled: false, time: "23:59" }, offTemp: { enabled: false, temp: 0 } },
      motion: { pir: { enabled: true, holdSec: 120 }, ble: { enabled: false, rssiThreshold: -70, holdSec: 0 } }
    });
  }

  // ──────────────────────────────────────────────
  // 7. 토글 가시성
  // ──────────────────────────────────────────────
  function togglePeriodVisibility() {
    const enabled = $("#periodEnabledDetail").checked;
    $("#periodSettingsContainer").classList.toggle("hidden", !enabled);
  }

  function toggleAutoOffVisibility() {
    document.querySelectorAll(".autooff-group").forEach(g => g.classList.add("hidden"));
    if ($("#autoOffTimerEnabledDetail").checked) document.querySelector(".timer-group")?.classList.remove("hidden");
    if ($("#autoOffOffTimeEnabledDetail").checked) document.querySelector(".offtime-group")?.classList.remove("hidden");
    if ($("#autoOffOffTempEnabledDetail").checked) document.querySelector(".offtemp-group")?.classList.remove("hidden");
  }

  function toggleMotionVisibility() {
    document.querySelectorAll(".motion-group.pir-group").forEach(g => g.classList.toggle("hidden", !$("#motionPirEnabledDetail").checked));
    document.querySelectorAll(".motion-group.ble-group").forEach(g => g.classList.toggle("hidden", !$("#motionBleEnabledDetail").checked));
  }

  // ──────────────────────────────────────────────
  // 8. 세그먼트 추가/이동/삭제
  // ──────────────────────────────────────────────
  function addSegment() {
    const cards = document.querySelectorAll("#segmentListDetail .segment-card");
    const newSegNo = cards.length + 1;
    const newSeg = { segNo: newSegNo, onMinutes: 60, mode: "PRESET", presetCode: "OCEAN", adjust: { windIntensity: 0, windVariability: 0 }, fixedSpeed: 0 };
    const currentSegments = Array.from(cards).map((_, i) => collectSegmentData(i));
    currentSegments.push(newSeg);
    renderSegments(currentSegments);
  }

  function collectSegmentData(index) {
    const card = document.querySelectorAll("#segmentListDetail .segment-card")[index];
    if (!card) return null;
    return {
      segNo: index + 1,
      onMinutes: Number(card.querySelector("[data-key='onMinutes']").value) || 1,
      mode: card.querySelector("[data-key='mode']").value,
      presetCode: card.querySelector("[data-key='mode']").value === "PRESET" ? card.querySelector("[data-key='presetCode']").value : "OCEAN",
      fixedSpeed: card.querySelector("[data-key='mode']").value === "FIXED" ? Number(card.querySelector("[data-key='fixedSpeed']").value) : 0,
      adjust: {
        windIntensity: Math.max(-1, Math.min(1, Number(card.querySelector("[data-key='adjust.windIntensity']").value) || 0)),
        windVariability: Math.max(-1, Math.min(1, Number(card.querySelector("[data-key='adjust.windVariability']").value) || 0))
      }
    };
  }

  function handleSegmentAction(action, index) {
    const currentSegments = Array.from(document.querySelectorAll("#segmentListDetail .segment-card")).map((_, i) => collectSegmentData(i));
    let updated = [...currentSegments];

    if (action === "delete") {
      if (updated.length <= 1) { notify("최소 1개 단계는 유지해야 합니다.", "warn"); return; }
      updated.splice(index, 1);
    } else if (action === "up" && index > 0) {
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    } else if (action === "down" && index < updated.length - 1) {
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    }

    updated.forEach((seg, i) => seg.segNo = i + 1);
    renderSegments(updated);
  }

  // ──────────────────────────────────────────────
  // 9. 이벤트 바인딩
  // ──────────────────────────────────────────────
  function bindEvents() {
    $("#btnAddNewSchedule").addEventListener("click", addNewSchedule);
    $("#btnSaveDetail").addEventListener("click", saveHandler);
    $("#btnDeleteSchedule").addEventListener("click", deleteHandler);
    $("#btnCancelEdit").addEventListener("click", cancelEdit);
    $("#btnAddSegmentDetail").addEventListener("click", addSegment);

    // 토글
    $("#periodEnabledDetail").addEventListener("change", togglePeriodVisibility);
    ["autoOffTimerEnabledDetail", "autoOffOffTimeEnabledDetail", "autoOffOffTempEnabledDetail"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", toggleAutoOffVisibility);
    });
    ["motionPirEnabledDetail", "motionBleEnabledDetail"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", toggleMotionVisibility);
    });

    // 세그먼트 액션 위임
    $("#segmentListDetail").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const card = btn.closest(".segment-card");
      if (!card) return;
      const idx = Number(card.dataset.index);
      handleSegmentAction(btn.dataset.action, idx);
    });
  }

  // ──────────────────────────────────────────────
  // 10. 초기화
  // ──────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await loadSchedules();
  });
})();
