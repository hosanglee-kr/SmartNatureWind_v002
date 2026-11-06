/* P030_sch_t1_070.js – 백엔드 API + Gemini AI 통합 완성본 */
(() => {
  "use strict";

  // ──────────────────────────────────────────────
  // 1. 상수 (P001_API_061.js 의존)
  // ──────────────────────────────────────────────
  const API_SCHEDULES      = SNW_API.API_HTTP_SCHEDULES;
  const API_GEMINI_PROXY   = SNW_API.API_HTTP_GEMINI_PROXY;

  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];

  // 프리셋 목록 (Gemini 결과 파싱 및 UI 표시용)
  const PRESETS = [
    { code: "OCEAN",          name: "바다의 숨결" },
    { code: "COUNTRY_BREEZE", name: "시골 바람" },
    { code: "MEDITERRANEAN",  name: "지중해" },
    { code: "MOUNTAIN",       name: "산바람" },
    { code: "PLAINS",         name: "평야" },
    { code: "HARBOR_BREEZE",  name: "항구바람" },
    { code: "FOREST_CANOPY",  name: "숲속" },
    { code: "URBAN_SUNSET",   name: "도심석양" },
    { code: "TROPICAL_RAIN",  name: "열대우림" },
    { code: "DESERT_NIGHT",   name: "사막밤" }
  ];

  // ──────────────────────────────────────────────
  // 2. 전역 상태
  // ──────────────────────────────────────────────
  let g_scheduleData = [];
  let g_editingId = null;

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
  // 4. Gemini AI 호출 (공통 함수)
  // ──────────────────────────────────────────────
  async function callGemini(prompt, systemInstruction = "", responseSchema = null) {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512
      }
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (responseSchema) {
      body.generationConfig.responseMimeType = "application/json";
      body.generationConfig.responseSchema = responseSchema;
    }

    const resp = await apiFetch(API_GEMINI_PROXY, {
      method: "POST",
      body: JSON.stringify(body)
    }, false, "AI 요청");

    return resp?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  // ──────────────────────────────────────────────
  // 5. AI 기능: 스케줄 이름 제안
  // ──────────────────────────────────────────────
  async function handleSuggestName() {
    const nameInput = $("#scheduleNameDetail");
    if (!nameInput) return;

    // 현재 입력된 폼 데이터 수집
    const currentItem = collectFormData();

    const dayString = currentItem.period.days
      .map((d, i) => (d === 1 ? DAY_NAMES[i] : ''))
      .filter(Boolean)
      .join(', ') || '매일';

    const segmentString = currentItem.segments.map(seg =>
      `${seg.onMinutes}분 ${seg.mode === 'PRESET' ? PRESETS.find(p => p.code === seg.presetCode)?.name || seg.presetCode : seg.fixedSpeed + '%'}`
    ).join(' → ');

    const systemPrompt = "당신은 스마트 윈드 스케줄 시스템의 마케팅 전문가입니다. 제공된 설정 데이터를 기반으로 매력적이고, 직관적이며, 창의적인 스케줄 이름(4~10단어 이내)을 한국어로만 한 개 제안합니다. 다른 설명이나 인사말 없이 이름만 제공하세요.";

    const userQuery = `
스케줄 설정을 분석하여 이름을 제안해 주세요.
- 동작 시간대: ${currentItem.period.enabled ? `${currentItem.period.startTime} ~ ${currentItem.period.endTime}` : '24시간'}
- 동작 요일: ${dayString}
- 자동 종료: ${currentItem.autoOff.timer.enabled ? `${currentItem.autoOff.timer.minutes}분 후 타이머 종료` : '비활성'}
- 동작 단계: ${segmentString || '단계 없음'}

이름을 제안하세요:`;

    showLoading();
    try {
      const suggestedName = await callGemini(userQuery, systemPrompt);
      if (suggestedName) {
        const cleanName = suggestedName.trim().replace(/^['"“‘”’\s]+/, '').replace(/['"“‘”’\s]+$/, '');
        nameInput.value = cleanName;
        notify(`AI 추천 이름: ${cleanName}`, "ok");
      }
    } catch (e) {
      notify(`이름 추천 실패: ${e.message}`, "err");
    } finally {
      hideLoading();
    }
  }

  // ──────────────────────────────────────────────
  // 6. AI 기능: 프리셋 조정 최적화
  // ──────────────────────────────────────────────
  async function handleOptimizeAdjust(button) {
    const card = button.closest('.segment-card');
    if (!card) return;

    const promptTextarea = card.querySelector('[data-key="adjust_prompt"]');
    const userPrompt = promptTextarea?.value?.trim();
    if (!userPrompt) {
      notify("원하는 바람의 느낌을 텍스트로 설명해주세요.", "warn");
      return;
    }

    const mode = card.querySelector('[data-key="mode"]').value;
    if (mode !== 'PRESET') {
      notify("Preset 모드일 때만 AI 최적화를 사용할 수 있습니다.", "warn");
      return;
    }

    const currentPresetCode = card.querySelector('[data-key="presetCode"]').value;
    const currentPreset = PRESETS.find(p => p.code === currentPresetCode)?.name || currentPresetCode;

    const statusDiv = card.querySelector('.llm-adjust-status');
    if (statusDiv) statusDiv.classList.remove('hidden');

    const systemPrompt = `당신은 스마트 윈드 시스템의 바람 엔지니어입니다. 사용자가 묘사한 바람의 느낌을 현실화하기 위해 필요한 'windIntensity' (강도)와 'windVariability' (변동성)의 조정값(Adjustment Value)을 JSON 형태로만 정확히 계산해 제공합니다.
조정값은 -1.0에서 +1.0 사이의 float(소수점 첫째 자리까지) 값이어야 합니다.
사용자 설명에 따라 이 두 값만 변경하며, 다른 필드를 추가하거나 변경하지 마십시오.`;

    const userQuery = `
현재 프리셋: ${currentPreset} (${currentPresetCode})
사용자 요구사항 (어떻게 조정하고 싶나요?): "${userPrompt}"

요구사항을 충족시키기 위해 windIntensity와 windVariability를 조정(Adjustment)하여 JSON으로 출력하십시오.`;

    showLoading();
    try {
      const responseSchema = {
        type: "OBJECT",
        properties: {
          "windIntensity": { "type": "NUMBER" },
          "windVariability": { "type": "NUMBER" }
        },
        propertyOrdering: ["windIntensity", "windVariability"]
      };

      const jsonText = await callGemini(userQuery, systemPrompt, responseSchema);
      if (!jsonText) throw new Error("AI 응답 없음");

      const adjustedValues = JSON.parse(jsonText);

      if (adjustedValues.windIntensity !== undefined && adjustedValues.windVariability !== undefined) {
        let intensity = Math.max(-1.0, Math.min(1.0, Math.round(adjustedValues.windIntensity * 10) / 10));
        let variability = Math.max(-1.0, Math.min(1.0, Math.round(adjustedValues.windVariability * 10) / 10));

        const intensityInput = card.querySelector('[data-key="adjust.windIntensity"]');
        const variabilityInput = card.querySelector('[data-key="adjust.windVariability"]');

        if (intensityInput) intensityInput.value = intensity.toFixed(1);
        if (variabilityInput) variabilityInput.value = variability.toFixed(1);

        // 슬라이더도 동기화
        const intensityRange = card.querySelector('[data-key="adjust.windIntensity_range"]');
        const variabilityRange = card.querySelector('[data-key="adjust.windVariability_range"]');
        if (intensityRange) intensityRange.value = intensity.toFixed(1);
        if (variabilityRange) variabilityRange.value = variability.toFixed(1);

        notify(`AI 최적화 완료! 강도: ${intensity.toFixed(1)}, 변동성: ${variability.toFixed(1)}`, "ok");
      } else {
        throw new Error("AI가 필요한 조정값을 반환하지 않았습니다.");
      }
    } catch (e) {
      notify(`조정값 최적화 실패: ${e.message}`, "err");
    } finally {
      if (statusDiv) statusDiv.classList.add('hidden');
      hideLoading();
    }
  }

  // ──────────────────────────────────────────────
  // 7. UI 렌더링
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

      const isPreset = seg.mode === "PRESET";
      const presetOptions = PRESETS.map(p =>
        `<option value="${p.code}" ${seg.presetCode === p.code ? 'selected' : ''}>${p.name}</option>`
      ).join('');

      card.innerHTML = `
        <div class="segment-control-buttons">
          <button class="btn btn-small" data-action="up" ${idx === 0 ? "disabled" : ""}>▲</button>
          <button class="btn btn-small" data-action="down" ${idx === segments.length - 1 ? "disabled" : ""}>▼</button>
          <button class="btn btn-small err" data-action="delete">삭제</button>
        </div>
        <h4 class="segment-step-title">Step ${seg.segNo}</h4>
        <div class="grid mt-4">
          <div class="col-4">
            <label>작동 시간 (분)</label>
            <input type="number" data-key="onMinutes" min="1" value="${seg.onMinutes}">
          </div>
          <div class="col-4">
            <label>모드</label>
            <select data-key="mode">
              <option value="PRESET" ${isPreset ? "selected" : ""}>프리셋</option>
              <option value="FIXED" ${!isPreset ? "selected" : ""}>고정 속도</option>
            </select>
          </div>
          <div class="col-4">
            <div data-mode="PRESET" style="display:${isPreset ? "block" : "none"}">
              <label>프리셋</label>
              <select data-key="presetCode">${presetOptions}</select>
              <div class="segment-preset-group">
                <h5>🤖 AI 미세 조정</h5>
                <textarea data-key="adjust_prompt" class="segment-adjust-textarea" rows="2" placeholder="예: 좀 더 부드럽고 약하게 불어오도록 조정해 줘."></textarea>
                <div class="row middle mt-4">
                  <button class="btn btn-purple btnOptimizeAdjust" data-index="${idx}">🚀 AI 최적화</button>
                  <span class="llm-adjust-status hidden">⏳ 최적화 중...</span>
                </div>
                <div class="mt-4">
                  <label>강도 (${seg.adjust?.windIntensity?.toFixed(1) || 0})</label>
                  <input type="range" data-key="adjust.windIntensity_range" min="-1" max="1" step="0.1" value="${seg.adjust?.windIntensity || 0}">
                  <input type="number" data-key="adjust.windIntensity" min="-1" max="1" step="0.1" value="${seg.adjust?.windIntensity || 0}" class="input-style">
                </div>
                <div>
                  <label>변동성 (${seg.adjust?.windVariability?.toFixed(1) || 0})</label>
                  <input type="range" data-key="adjust.windVariability_range" min="-1" max="1" step="0.1" value="${seg.adjust?.windVariability || 0}">
                  <input type="number" data-key="adjust.windVariability" min="-1" max="1" step="0.1" value="${seg.adjust?.windVariability || 0}" class="input-style">
                </div>
              </div>
            </div>
            <div data-mode="FIXED" style="display:${!isPreset ? "block" : "none"}">
              <label>고정 속도 (%)</label>
              <input type="number" data-key="fixedSpeed" min="0" max="100" value="${seg.fixedSpeed || 0}">
            </div>
          </div>
        </div>
      `;

      // 모드 전환
      card.querySelector("[data-key='mode']").addEventListener("change", (e) => {
        const isPresetNow = e.target.value === "PRESET";
        card.querySelector("[data-mode='PRESET']").style.display = isPresetNow ? "block" : "none";
        card.querySelector("[data-mode='FIXED']").style.display = isPresetNow ? "none" : "block";
      });

      // 슬라이더-숫자 동기화
      card.querySelectorAll('input[type="range"]').forEach(range => {
        const numericInput = card.querySelector(`[data-key="${range.dataset.key.replace('_range', '')}"]`);
        range.addEventListener('input', () => {
          if (numericInput) numericInput.value = Number(range.value).toFixed(1);
          const label = range.closest('div').querySelector('label');
          if (label) {
            const base = label.textContent.split('(')[0].trim();
            label.textContent = `${base} (${Number(range.value).toFixed(1)})`;
          }
        });
        if (numericInput) {
          numericInput.addEventListener('input', () => {
            range.value = Number(numericInput.value);
          });
        }
      });

      // AI 최적화 버튼
      card.querySelector('.btnOptimizeAdjust')?.addEventListener('click', function() {
        handleOptimizeAdjust(this);
      });

      container.appendChild(card);
    });
  }

  // ──────────────────────────────────────────────
  // 8. 데이터 수집
  // ──────────────────────────────────────────────
  function collectFormData() {
    const item = {
      id: g_editingId,
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
  // 9. 편집/저장/삭제
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
  // 10. 토글 가시성
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
  // 11. 세그먼트 추가/이동/삭제
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
  // 12. 이벤트 바인딩
  // ──────────────────────────────────────────────
  function bindEvents() {
    $("#btnAddNewSchedule").addEventListener("click", addNewSchedule);
    $("#btnSaveDetail").addEventListener("click", saveHandler);
    $("#btnDeleteSchedule").addEventListener("click", deleteHandler);
    $("#btnCancelEdit").addEventListener("click", cancelEdit);
    $("#btnAddSegmentDetail").addEventListener("click", addSegment);
    $("#btnSuggestName")?.addEventListener("click", handleSuggestName);

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
  // 13. 초기화
  // ──────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await loadSchedules();
  });
})();