/* P030_sch_t1_061.js – 공통 유틸리티 통합 완성본 (전체 구현) */
(() => {
  "use strict";

  // ──────────────────────────────────────────────
  // 1. 전역 설정 (HTML에서 주입)
  //    window.SNW_CONFIG = {
  //      firebase: { apiKey: "...", authDomain: "...", ... },
  //      geminiApiKey: "...",
  //      geminiModel: "gemini-2.5-flash-preview-09-2025",
  //      appId: "default-app-id"
  //    };
  // ──────────────────────────────────────────────
  const CONFIG = window.SNW_CONFIG || {};
  const GEMINI_MODEL = CONFIG.geminiModel || "gemini-2.5-flash-preview-09-2025";
  const GEMINI_API_KEY = CONFIG.geminiApiKey || "";
  const APP_ID = CONFIG.appId || "default-app-id";
  const FIREBASE_CONFIG = CONFIG.firebase || null;
  const INITIAL_AUTH_TOKEN = CONFIG.initialAuthToken || null;

  const GEMINI_API_URL = GEMINI_API_KEY
    ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    : null;

  // ──────────────────────────────────────────────
  // 2. 공통 유틸리티 (P000_common_060.js 의존)
  //    $, text, showLoading, hideLoading, notify 등
  //    showToast는 대시보드/메인과 충돌을 피하기 위해 사용하지 않음
  // ──────────────────────────────────────────────

  // 내부 전용 토스트 (공통 showToast와 이름 충돌 방지)
  const showScheduleToast = (msg, type = "ok") => {
    const cont = document.getElementById("toastContainer");
    if (!cont) return;
    const div = document.createElement("div");
    div.className = `toast toast-${type}`;
    div.textContent = msg;
    cont.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  };

  // 공통 로딩 함수 사용 (showLoading, hideLoading)

  // ──────────────────────────────────────────────
  // 3. 모의 프리셋 목록 (Firestore 미연동 시 fallback)
  // ──────────────────────────────────────────────
  const g_presets = [
    { code: "OCEAN", name: "바다의 숨결" },
    { code: "MOUNTAIN", name: "산들바람" },
    { code: "FOREST", name: "숲의 아침" },
    { code: "TURBULENCE", name: "강풍" }
  ];

  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  const SCHEDULE_DOC_PATH = `/artifacts/${APP_ID}/public/data/scheduleConfig/windSchedules`;

  // ──────────────────────────────────────────────
  // 4. 전역 상태
  // ──────────────────────────────────────────────
  let g_scheduleData = [];
  let g_editingItemIndex = -1;

  // Firebase 객체
  let app, db, auth;
  let userId = null;
  let isAuthReady = false;

  // ──────────────────────────────────────────────
  // 5. Gemini API 호출
  // ──────────────────────────────────────────────
  async function fetchGemini(payload, maxRetries = 3) {
    if (!GEMINI_API_URL) {
      throw new Error("Gemini API 키가 설정되지 않았습니다.");
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const result = await response.json();
          const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return { text, result };
          throw new Error("Gemini 응답 내용이 비어 있습니다.");
        } else if (response.status === 429 && attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          const errorBody = await response.json();
          throw new Error(`API 오류: ${response.status} - ${errorBody.error?.message || response.statusText}`);
        }
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
      }
    }
    return null;
  }

  // ──────────────────────────────────────────────
  // 6. LLM 기능: 스케줄 이름 제안
  // ──────────────────────────────────────────────
  async function handleSuggestName() {
    if (!isAuthReady || g_editingItemIndex < 0) return;
    const currentItem = collectScheduleDetailData(g_scheduleData[g_editingItemIndex]);

    const dayString = currentItem.period.days.map((d, i) => d === 1 ? DAY_NAMES[i] : '').filter(Boolean).join(', ');
    const segmentString = currentItem.segments.map(seg =>
      `${seg.onMinutes}분 작동 (${seg.mode === 'PRESET' ? seg.presetCode : seg.fixed_speed + '%'})`
    ).join(' -> ');

    const systemPrompt = "당신은 스마트 윈드 스케줄 시스템의 마케팅 전문가입니다. 제공된 설정 데이터를 기반으로 매력적이고, 직관적이며, 창의적인 스케줄 이름(4~10단어 이내)을 한국어로만 한 개 제안합니다. 다른 설명이나 인사말 없이 이름만 제공하세요.";
    const userQuery = `
        스케줄 설정을 분석하여 이름을 제안해 주세요.
        - 동작 시간대: ${currentItem.period.enabled ? `${currentItem.period.startTime} ~ ${currentItem.period.endTime}` : '24시간'}
        - 동작 요일: ${dayString || '매일'}
        - 자동 종료: ${currentItem.autoOff.timer.enabled ? `${currentItem.autoOff.timer.minutes}분 후 타이머 종료` : '비활성'}
        - 동작 단계 시퀀스: ${segmentString || '단계 없음'}

        이름을 제안하세요:
    `;

    const btn = document.getElementById("btnSuggestName");
    const input = document.getElementById("scheduleNameDetail");
    if (!btn || !input) return;

    showLoading();
    try {
      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      };

      const response = await fetchGemini(payload);
      const suggestedName = response.text.trim().replace(/^['"“‘”’\s]+/, '').replace(/['"“‘”’\s]+$/, '');

      input.value = suggestedName;
      showScheduleToast(`새 이름: ${suggestedName}`, "ok");
    } catch (error) {
      showScheduleToast(`이름 추천 실패: ${error.message}`, "err");
      console.error("Name Suggestion Error:", error);
    } finally {
      hideLoading();
    }
  }

  // ──────────────────────────────────────────────
  // 7. LLM 기능: 프리셋 조정 최적화
  // ──────────────────────────────────────────────
  async function handleOptimizeAdjust(button) {
    const index = Number(button.dataset.index);
    const card = button.closest('.segment-card');
    if (!isAuthReady || g_editingItemIndex < 0 || !card || isNaN(index)) return;

    const promptTextarea = card.querySelector('[data-key="adjust_prompt"]');
    const userPrompt = promptTextarea?.value.trim();
    if (!userPrompt) {
      return showScheduleToast("원하는 바람의 느낌을 텍스트로 설명해주세요.", "warn");
    }

    const currentSeg = collectSegmentData(card, index + 1);
    if (currentSeg.mode !== 'PRESET') {
      return showScheduleToast("Preset 모드일 때만 조정값을 최적화할 수 있습니다.", "warn");
    }

    const currentPresetCode = currentSeg.presetCode || 'OCEAN';
    const currentPreset = g_presets.find(p => p.code === currentPresetCode)?.name || '기본 프리셋';

    const statusDiv = card.querySelector('.llm-adjust-status');
    if (!statusDiv) return;

    showLoading();
    statusDiv.classList.remove('hidden');

    try {
      const systemPrompt = `당신은 스마트 윈드 시스템의 바람 엔지니어입니다. 사용자가 묘사한 바람의 느낌을 현실화하기 위해 필요한 'windIntensity' (강도)와 'windVariability' (변동성)의 조정값(Adjustment Value)을 JSON 형태로만 정확히 계산해 제공합니다.
        조정값은 -1.0에서 +1.0 사이의 float(소수점 첫째 자리까지) 값이어야 합니다.
        사용자 설명에 따라 이 두 값만 변경하며, 다른 필드를 추가하거나 변경하지 마십시오.`;

      const userQuery = `
            현재 프리셋: ${currentPreset} (${currentPresetCode})
            사용자 요구사항 (어떻게 조정하고 싶나요?): "${userPrompt}"

            요구사항을 충족시키기 위해 wind_intensity와 wind_variability를 조정(Adjustment)하여 JSON으로 출력하십시오.
        `;

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              "windIntensity": { "type": "NUMBER" },
              "windVariability": { "type": "NUMBER" }
            },
            "propertyOrdering": ["windIntensity", "windVariability"]
          }
        }
      };

      const response = await fetchGemini(payload);
      const jsonText = response.text;
      const adjustedValues = JSON.parse(jsonText);

      if (adjustedValues.windIntensity !== undefined && adjustedValues.windVariability !== undefined) {
        let intensity = Math.max(-1.0, Math.min(1.0, Math.round(adjustedValues.windIntensity * 10) / 10));
        let variability = Math.max(-1.0, Math.min(1.0, Math.round(adjustedValues.windVariability * 10) / 10));

        const intensityInput = card.querySelector('[data-key="adjust.windIntensity"]');
        const variabilityInput = card.querySelector('[data-key="adjust.windVariability"]');
        const intensityRange = card.querySelector('[data-key="adjust.wind_intensity_range"]');
        const variabilityRange = card.querySelector('[data-key="adjust.wind_variability_range"]');

        if (intensityInput) intensityInput.value = intensity.toFixed(1);
        if (intensityRange) intensityRange.value = intensity.toFixed(1);
        if (variabilityInput) variabilityInput.value = variability.toFixed(1);
        if (variabilityRange) variabilityRange.value = variability.toFixed(1);

        showScheduleToast(`조정값 최적화 완료! 강도: ${intensity.toFixed(1)}, 변동성: ${variability.toFixed(1)}`, "ok");
      } else {
        throw new Error("LLM이 필요한 조정값을 반환하지 않았습니다.");
      }
    } catch (error) {
      showScheduleToast(`조정값 최적화 실패: ${error.message}`, "err");
      console.error("Adjustment Optimization Error:", error);
    } finally {
      statusDiv.classList.add('hidden');
      hideLoading();
    }
  }

  // ──────────────────────────────────────────────
  // 8. Firebase 초기화
  // ──────────────────────────────────────────────
  async function initializeFirebase() {
    if (!FIREBASE_CONFIG || Object.keys(FIREBASE_CONFIG).length === 0) {
      showScheduleToast("Firebase 설정이 정의되지 않았습니다. Mock 데이터로 로드합니다.", "warn");
      loadMockData();
      return;
    }

    try {
      app = firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      auth = firebase.auth();
      firebase.firestore.setLogLevel('debug');

      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      const handleAuth = async () => {
        try {
          if (INITIAL_AUTH_TOKEN) {
            await auth.signInWithCustomToken(INITIAL_AUTH_TOKEN);
          } else {
            await auth.signInAnonymously();
          }
        } catch (e) {
          console.error("Initial Auth Error:", e);
          showScheduleToast(`초기 인증 실패: ${e.message}`, "err");
          await auth.signInAnonymously();
        }
      };

      auth.onAuthStateChanged((user) => {
        const authStatus = document.getElementById("authStatus");
        if (!authStatus) return;

        let statusText;
        const btnAddNewSchedule = document.getElementById("btnAddNewSchedule");
        const authDot = document.querySelector(".auth-dot");

        if (user) {
          userId = user.uid;
          isAuthReady = true;
          statusText = "✅ 인증 완료";
          if (authDot) {
            authDot.style.backgroundColor = '#10b981';
            authDot.classList.remove('pulse');
          }
          if (btnAddNewSchedule) btnAddNewSchedule.disabled = false;
          loadDataListener();
        } else {
          userId = 'unknown';
          isAuthReady = false;
          statusText = "❌ 인증 실패";
          if (authDot) {
            authDot.style.backgroundColor = '#dc2626';
            authDot.classList.remove('pulse');
          }
          if (btnAddNewSchedule) btnAddNewSchedule.disabled = true;
        }

        authStatus.querySelector('span').nextSibling.textContent = ` ${statusText}`;
        document.getElementById("displayUserId")?.textContent = userId;
      });

      await handleAuth();
    } catch (e) {
      showScheduleToast(`Firebase 초기화 오류: ${e.message}`, "err");
      console.error("Firebase Init Error:", e);
      const authStatus = document.getElementById("authStatus");
      const authDot = document.querySelector(".auth-dot");
      if (authStatus) {
        if (authDot) {
          authDot.style.backgroundColor = '#dc2626';
          authDot.classList.remove('pulse');
        }
        authStatus.querySelector('span').nextSibling.textContent = ` ❌ 초기화 오류`;
      }
      loadMockData();
    }
  }

  function loadMockData() {
    showScheduleToast("Mock 데이터로 로드 중...", "warn");
    g_scheduleData = [
      { schNo: 1, name: "오피스 주간 기본", enabled: true, period: { enabled: true, startTime: "09:00", endTime: "18:00", days: [1, 1, 1, 1, 1, 0, 0] }, segments: [{ segNo: 1, onMinutes: 60, mode: "PRESET", presetCode: "FOREST", adjust: { windIntensity: 0.5, windVariability: 0.2 }, fixed_speed: 0 }], autoOff: { timer: { enabled: false, minutes: 0 }, offtime: { enabled: false, time: "23:59" }, offtemp: { enabled: true, temp: 18.0 } }, motion: { pir: { enabled: true, holdSec: 120 }, ble: { enabled: false, rssi_threshold: -70, holdSec: 0 } } },
      { schNo: 2, name: "새벽 청정", enabled: false, period: { enabled: false, startTime: "00:00", endTime: "23:59", days: [1, 1, 1, 1, 1, 1, 1] }, segments: [{ segNo: 1, onMinutes: 180, mode: "PRESET", presetCode: "OCEAN", adjust: { windIntensity: -0.8, windVariability: 0.0 }, fixed_speed: 0 }], autoOff: { timer: { enabled: true, minutes: 30 }, offtime: { enabled: false, time: "23:59" }, offtemp: { enabled: false, temp: 0.0 } }, motion: { pir: { enabled: false, holdSec: 0 }, ble: { enabled: true, rssi_threshold: -65, holdSec: 300 } } }
    ];
    document.getElementById("displayUserId").textContent = "MOCK_USER";

    const authStatus = document.getElementById("authStatus");
    const authDot = document.querySelector(".auth-dot");
    if (authStatus) {
      if (authDot) {
        authDot.style.backgroundColor = '#f59e0b';
        authDot.classList.remove('pulse');
      }
      authStatus.querySelector('span').nextSibling.textContent = ` MOCK 데이터 로드`;
    }

    isAuthReady = true;
    const btnAdd = document.getElementById("btnAddNewSchedule");
    if (btnAdd) btnAdd.disabled = false;
    renderScheduleList();
  }

  // ──────────────────────────────────────────────
  // 9. Firestore 데이터 저장/로드
  // ──────────────────────────────────────────────
  async function saveSchedulesToFirestore() {
    if (!db || !isAuthReady || !userId || userId === 'unknown') {
      showScheduleToast("데이터베이스 연결이 불안정합니다. (Mock 저장)", "warn");
      renderScheduleList();
      return;
    }

    showLoading();
    try {
      const docRef = db.collection('artifacts').doc(SCHEDULE_DOC_PATH.split('/').pop());
      await docRef.set({ schedules: g_scheduleData });
      showScheduleToast("스케줄 데이터 저장 완료", "ok");
    } catch (e) {
      showScheduleToast(`스케줄 저장 실패: ${e.message}`, "err");
      console.error("Firestore Save Error:", e);
    } finally {
      hideLoading();
    }
  }

  function loadDataListener() {
    if (!db || !isAuthReady || !userId || userId === 'unknown') return;

    hideLoading();
    const placeholder = document.getElementById("listPlaceholder");
    const docRef = db.collection('artifacts').doc(SCHEDULE_DOC_PATH.split('/').pop());

    docRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        g_scheduleData = Array.isArray(data.schedules) ? data.schedules : [];
        renderScheduleList();
      } else {
        g_scheduleData = [];
        renderScheduleList();
        showScheduleToast("스케줄 문서가 존재하지 않아 새로 생성됩니다.", "warn");
      }
      if (placeholder) {
        placeholder.textContent = g_scheduleData.length === 0
          ? "등록된 스케줄이 없습니다. 새로운 스케줄을 추가하세요."
          : "스케줄 목록이 로드되었습니다.";
      }
    }, (error) => {
      showScheduleToast(`실시간 업데이트 오류: ${error.message}`, "err");
      if (placeholder) placeholder.textContent = "데이터 로드 중 오류 발생.";
      console.error("Snapshot Error:", error);
    });
  }

  // ──────────────────────────────────────────────
  // 10. UI 렌더링 함수들 (공통 $ 대신 document.getElementById 사용)
  // ──────────────────────────────────────────────

  function renderScheduleList() {
    const container = document.getElementById("scheduleListContainer");
    const placeholder = document.getElementById("listPlaceholder");
    if (!container) return;

    container.innerHTML = '';
    if (placeholder) {
      placeholder.style.display = g_scheduleData.length === 0 ? 'block' : 'none';
    }

    g_scheduleData.forEach((item, index) => {
      const daysActive = item.period.days.map((d, i) => d === 1 ? DAY_NAMES[i] : '').filter(Boolean).join(', ');
      const statusClass = item.enabled ? 'text-green-500 font-bold' : 'text-gray-500';
      const statusText = item.enabled ? '활성' : '비활성';

      const div = document.createElement('div');
      div.className = 'schedule-item';
      div.dataset.index = index;
      div.innerHTML = `
        <div style="flex-grow: 1;">
          <span class="schedule-item-title">[${item.schNo}] ${item.name}</span>
          <div class="schedule-item-detail">
            ${item.period.enabled
              ? `🕒 ${item.period.startTime} ~ ${item.period.endTime} | 🗓️ ${daysActive || '매일'}`
              : '🕒 24시간 동작'}
          </div>
        </div>
        <div class="${statusClass}">${statusText}</div>
      `;
      div.addEventListener('click', () => editSchedule(index));
      container.appendChild(div);
    });

    document.getElementById("scheduleCount").textContent = g_scheduleData.length;
  }

  function renderDaySelectors(days) {
    const container = document.getElementById("daySelectorsDetail");
    if (!container) return;
    container.innerHTML = '';

    DAY_NAMES.forEach((day, index) => {
      const isChecked = days[index] === 1;
      const div = document.createElement('div');
      div.className = 'day-toggle-item';
      div.innerHTML = `
        <label>
          <input type="checkbox" data-day-code="${index}" ${isChecked ? 'checked' : ''}>
          <span>${day}</span>
        </label>
      `;
      container.appendChild(div);
    });
  }

  function renderSegment(segment, index, container, totalSegments) {
    const card = document.createElement('div');
    card.className = 'segment-card';
    card.dataset.index = index;

    const isPreset = segment.mode === 'PRESET';
    const presetOptions = g_presets.map(p =>
      `<option value="${p.code}" ${segment.presetCode === p.code ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    card.innerHTML = `
      <div class="segment-control-buttons">
        <button type="button" class="btn btn-gray" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" data-action="up" ${index === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="btn btn-gray" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" data-action="down" ${index === totalSegments - 1 ? 'disabled' : ''}>▼</button>
        <button type="button" class="btn btn-red" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" data-action="delete">삭제</button>
      </div>

      <h4 class="segment-step-title">Step ${segment.segNo}</h4>

      <div class="grid-container md-grid-cols-4 gap-4" style="margin-top: 1rem;">
        <div class="md-col-span-1">
          <label class="form-label">작동 시간 (분)</label>
          <input type="number" data-key="onMinutes" min="1" class="input-style" value="${segment.onMinutes}">
        </div>
        <div class="md-col-span-1">
          <label class="form-label">동작 모드</label>
          <select data-key="mode" class="input-style">
            <option value="PRESET" ${isPreset ? 'selected' : ''}>프리셋</option>
            <option value="FIXED" ${!isPreset ? 'selected' : ''}>고정 속도</option>
          </select>
        </div>

        <div class="md-col-span-2">
          <div data-mode="PRESET" style="display: ${isPreset ? 'block' : 'none'};">
            <label class="form-label">프리셋 선택</label>
            <select data-key="presetCode" class="input-style">
              ${presetOptions}
            </select>
            <div class="segment-preset-group">
              <h5 class="segment-preset-h5">AI 미세 조정</h5>
              <textarea data-key="adjust_prompt" class="segment-adjust-textarea" rows="2" placeholder="예: 좀 더 부드럽고 약하게 불어오도록 조정해 줘."></textarea>
              <div class="flex justify-between items-center" style="margin-top: 0.5rem;">
                <button type="button" class="btn btn-purple btnOptimizeAdjust" data-index="${index}" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
                  🚀 AI 최적화
                </button>
                <div class="llm-adjust-status hidden">최적화 중...</div>
              </div>

              <div class="segment-adjust-group">
                <label class="form-label segment-adjust-label">강도 조정 (${segment.adjust.windIntensity.toFixed(1)})</label>
                <input type="range" data-key="adjust.wind_intensity_range" min="-1.0" max="1.0" step="0.1" value="${segment.adjust.windIntensity.toFixed(1)}">
                <input type="number" data-key="adjust.windIntensity" min="-1.0" max="1.0" step="0.1" value="${segment.adjust.windIntensity.toFixed(1)}" class="input-style segment-adjust-input">
              </div>
              <div class="segment-adjust-group mt-075">
                <label class="form-label segment-adjust-label">변동성 조정 (${segment.adjust.windVariability.toFixed(1)})</label>
                <input type="range" data-key="adjust.wind_variability_range" min="-1.0" max="1.0" step="0.1" value="${segment.adjust.windVariability.toFixed(1)}">
                <input type="number" data-key="adjust.windVariability" min="-1.0" max="1.0" step="0.1" value="${segment.adjust.windVariability.toFixed(1)}" class="input-style segment-adjust-input">
              </div>
            </div>
          </div>

          <div data-mode="FIXED" style="display: ${!isPreset ? 'block' : 'none'};">
            <label class="form-label">고정 속도 (%)</label>
            <input type="number" data-key="fixed_speed" min="0" max="100" class="input-style" value="${segment.fixed_speed}">
          </div>
        </div>
      </div>
    `;

    // 모드 전환 이벤트
    card.querySelector('[data-key="mode"]').addEventListener('change', (e) => {
      const isPresetNow = e.target.value === 'PRESET';
      card.querySelector('[data-mode="PRESET"]').style.display = isPresetNow ? 'block' : 'none';
      card.querySelector('[data-mode="FIXED"]').style.display = !isPresetNow ? 'block' : 'none';
    });

    // 슬라이더/숫자 동기화
    card.querySelectorAll('input[type="range"]').forEach(range => {
      const key = range.dataset.key;
      const numericKey = key.replace('_range', '');
      const numericInput = card.querySelector(`[data-key="${numericKey}"]`);

      range.addEventListener('input', () => {
        if (numericInput) numericInput.value = range.value;
        const label = range.previousElementSibling;
        if (label) label.textContent = label.textContent.split('(')[0].trim() + ` (${Number(range.value).toFixed(1)})`;
      });

      if (numericInput) {
        numericInput.addEventListener('input', () => {
          const value = Number(numericInput.value);
          if (!isNaN(value)) {
            range.value = value;
            const label = range.previousElementSibling?.previousElementSibling;
            if (label) label.textContent = label.textContent.split('(')[0].trim() + ` (${value.toFixed(1)})`;
          }
        });
      }
    });

    card.querySelector('.btnOptimizeAdjust')?.addEventListener('click', (e) => handleOptimizeAdjust(e.target));

    container.appendChild(card);
  }

  function renderSegmentList(segments) {
    const container = document.getElementById("segmentListDetail");
    if (!container) return;
    container.innerHTML = '';
    const total = segments.length;
    segments.forEach((seg, i) => renderSegment(seg, i, container, total));

    container.querySelectorAll('.segment-card').forEach((card, i) => {
      const upBtn = card.querySelector('[data-action="up"]');
      const downBtn = card.querySelector('[data-action="down"]');
      if (upBtn) upBtn.disabled = i === 0;
      if (downBtn) downBtn.disabled = segments.length === 0 || i === segments.length - 1;
    });
  }

  // ──────────────────────────────────────────────
  // 11. 데이터 수집 및 UI 제어
  // ──────────────────────────────────────────────

  function collectScheduleDetailData(initialItem) {
    const item = JSON.parse(JSON.stringify(initialItem));
    if (!item.period) item.period = { enabled: true, startTime: "00:00", endTime: "23:59", days: [1,1,1,1,1,1,1] };
    if (!item.autoOff) item.autoOff = { timer: { enabled: false, minutes: 0 }, offtime: { enabled: false, time: "23:59" }, offtemp: { enabled: false, temp: 0.0 } };
    if (!item.motion) item.motion = { pir: { enabled: false, holdSec: 0 }, ble: { enabled: false, rssi_threshold: -70, holdSec: 0 } };

    item.schNo = Number(document.getElementById("schNoDetail").value) || 1;
    item.name = document.getElementById("scheduleNameDetail").value.trim();
    item.enabled = document.getElementById("scheduleEnabledDetail").checked;

    item.period.enabled = document.getElementById("periodEnabledDetail").checked;
    if (item.period.enabled) {
      item.period.startTime = document.getElementById("startTimeDetail").value;
      item.period.endTime = document.getElementById("endTimeDetail").value;
      const dayInputs = document.querySelectorAll('#daySelectorsDetail input[type="checkbox"]');
      item.period.days = Array.from(dayInputs).map(input => input.checked ? 1 : 0);
    }

    item.segments = Array.from(document.querySelectorAll('#segmentListDetail .segment-card')).map((card, i) => collectSegmentData(card, i + 1));

    item.autoOff.timer.enabled = document.getElementById("autoOffTimerEnabledDetail").checked;
    item.autoOff.timer.minutes = item.autoOff.timer.enabled ? Number(document.getElementById("autoOffTimerMinutesDetail").value) : 0;

    item.autoOff.offtime.enabled = document.getElementById("autoOffOffTimeEnabledDetail").checked;
    item.autoOff.offtime.time = item.autoOff.offtime.enabled ? document.getElementById("autoOffOffTimeDetail").value : "23:59";

    item.autoOff.offtemp.enabled = document.getElementById("autoOffOffTempEnabledDetail").checked;
    item.autoOff.offtemp.temp = item.autoOff.offtemp.enabled ? Number(document.getElementById("autoOffOffTempDetail").value) : 0.0;

    item.motion.pir.enabled = document.getElementById("motionPirEnabledDetail").checked;
    item.motion.pir.holdSec = item.motion.pir.enabled ? Number(document.getElementById("motionPirHoldSecDetail").value) : 0;

    item.motion.ble.enabled = document.getElementById("motionBleEnabledDetail").checked;
    item.motion.ble.rssi_threshold = item.motion.ble.enabled ? Number(document.getElementById("motionBleRssiThresholdDetail").value) : -70;
    item.motion.ble.holdSec = item.motion.ble.enabled ? Number(document.getElementById("motionBleHoldSecDetail").value) : 0;

    return item;
  }

  function collectSegmentData(card, segNo) {
    const mode = card.querySelector('[data-key="mode"]').value;
    return {
      segNo,
      onMinutes: Number(card.querySelector('[data-key="onMinutes"]').value) || 1,
      mode,
      presetCode: mode === 'PRESET' ? card.querySelector('[data-key="presetCode"]').value : "OCEAN",
      fixed_speed: mode === 'FIXED' ? Number(card.querySelector('[data-key="fixed_speed"]').value) : 0,
      adjust: {
        windIntensity: Math.max(-1, Math.min(1, Number(card.querySelector('[data-key="adjust.windIntensity"]').value) || 0)),
        windVariability: Math.max(-1, Math.min(1, Number(card.querySelector('[data-key="adjust.windVariability"]').value) || 0))
      }
    };
  }

  function toggleVisibility() {
    const periodEnabled = document.getElementById("periodEnabledDetail").checked;
    document.getElementById("periodSettingsContainer").classList.toggle('hidden', !periodEnabled);

    document.querySelectorAll('.autooff-group').forEach(group => group.style.display = 'none');
    if (document.getElementById("autoOffTimerEnabledDetail").checked) document.querySelector(".timer-group").style.display = 'flex';
    if (document.getElementById("autoOffOffTimeEnabledDetail").checked) document.querySelector(".offtime-group").style.display = 'flex';
    if (document.getElementById("autoOffOffTempEnabledDetail").checked) document.querySelector(".offtemp-group").style.display = 'flex';

    document.querySelectorAll('.motion-group.pir-group').forEach(group => group.style.display = document.getElementById("motionPirEnabledDetail").checked ? 'block' : 'none');
    document.querySelectorAll('.motion-group.ble-group').forEach(group => group.style.display = document.getElementById("motionBleEnabledDetail").checked ? 'block' : 'none');
  }

  function showDetailView(initialItem, isNew) {
    document.getElementById("scheduleListSection").classList.add('hidden');
    document.getElementById("scheduleDetailSection").classList.remove('hidden');

    document.getElementById("detailTitle").textContent = isNew ? '새 항목' : initialItem.schNo;
    document.getElementById("btnDeleteSchedule").classList.toggle('hidden', isNew);

    document.getElementById("schNoDetail").value = initialItem.schNo;
    document.getElementById("scheduleNameDetail").value = initialItem.name;
    document.getElementById("scheduleEnabledDetail").checked = initialItem.enabled;

    document.getElementById("periodEnabledDetail").checked = initialItem.period.enabled;
    document.getElementById("startTimeDetail").value = initialItem.period.startTime;
    document.getElementById("endTimeDetail").value = initialItem.period.endTime;
    renderDaySelectors(initialItem.period.days);

    renderSegmentList(initialItem.segments);

    document.getElementById("autoOffTimerEnabledDetail").checked = initialItem.autoOff.timer.enabled;
    document.getElementById("autoOffTimerMinutesDetail").value = initialItem.autoOff.timer.minutes;
    document.getElementById("autoOffOffTimeEnabledDetail").checked = initialItem.autoOff.offtime.enabled;
    document.getElementById("autoOffOffTimeDetail").value = initialItem.autoOff.offtime.time;
    document.getElementById("autoOffOffTempEnabledDetail").checked = initialItem.autoOff.offtemp.enabled;
    document.getElementById("autoOffOffTempDetail").value = initialItem.autoOff.offtemp.temp;

    document.getElementById("motionPirEnabledDetail").checked = initialItem.motion.pir.enabled;
    document.getElementById("motionPirHoldSecDetail").value = initialItem.motion.pir.holdSec;
    document.getElementById("motionBleEnabledDetail").checked = initialItem.motion.ble.enabled;
    document.getElementById("motionBleRssiThresholdDetail").value = initialItem.motion.ble.rssi_threshold;
    document.getElementById("motionBleHoldSecDetail").value = initialItem.motion.ble.holdSec;

    toggleVisibility();
  }

  function editSchedule(index) {
    g_editingItemIndex = index;
    const item = g_scheduleData[index];
    showDetailView(item, false);
  }

  function addNewSchedule() {
    g_editingItemIndex = -1;
    const schNos = g_scheduleData.map(s => s.schNo).filter(n => !isNaN(n));
    const newSchNo = schNos.length > 0 ? Math.max(...schNos) + 1 : 1;

    const newItem = {
      schNo: newSchNo,
      name: `새 스케줄 ${newSchNo}`,
      enabled: true,
      period: { enabled: true, startTime: "08:00", endTime: "18:00", days: [1, 1, 1, 1, 1, 0, 0] },
      segments: [
        { segNo: 1, onMinutes: 60, mode: "PRESET", presetCode: "OCEAN", adjust: { windIntensity: 0.0, windVariability: 0.0 }, fixed_speed: 0 }
      ],
      autoOff: { timer: { enabled: false, minutes: 0 }, offtime: { enabled: false, time: "23:59" }, offtemp: { enabled: false, temp: 0.0 } },
      motion: { pir: { enabled: true, holdSec: 120 }, ble: { enabled: false, rssi_threshold: -70, holdSec: 0 } }
    };

    showDetailView(newItem, true);
  }

  function saveScheduleDetail() {
    const currentItem = collectScheduleDetailData(g_editingItemIndex === -1 ? {} : g_scheduleData[g_editingItemIndex]);

    const isDuplicate = g_scheduleData.some((item, idx) =>
      item.schNo === currentItem.schNo && idx !== g_editingItemIndex
    );
    if (isDuplicate) {
      return showScheduleToast("스케줄 번호(schNo)가 중복됩니다.", "err");
    }

    if (currentItem.segments.length === 0) {
      return showScheduleToast("최소한 1개의 동작 단계(Step)를 추가해야 합니다.", "err");
    }

    if (g_editingItemIndex === -1) {
      g_scheduleData.push(currentItem);
    } else {
      g_scheduleData[g_editingItemIndex] = currentItem;
    }

    g_scheduleData.sort((a, b) => a.schNo - b.schNo);
    saveSchedulesToFirestore();
    cancelEdit();
  }

  function deleteSchedule() {
    if (g_editingItemIndex === -1 || !confirm("정말로 이 스케줄을 삭제하시겠습니까?")) return;
    g_scheduleData.splice(g_editingItemIndex, 1);
    saveSchedulesToFirestore();
    showScheduleToast("스케줄이 삭제되었습니다.", "ok");
    cancelEdit();
  }

  function cancelEdit() {
    g_editingItemIndex = -1;
    document.getElementById("scheduleDetailSection").classList.add('hidden');
    document.getElementById("scheduleListSection").classList.remove('hidden');
    renderScheduleList();
  }

  // ──────────────────────────────────────────────
  // 12. 이벤트 리스너 등록
  // ──────────────────────────────────────────────
  function setupEventListeners() {
    document.getElementById("btnAddNewSchedule")?.addEventListener('click', addNewSchedule);
    document.getElementById("btnRefresh")?.addEventListener('click', () => loadDataListener() || loadMockData());
    document.getElementById("btnCancelEdit")?.addEventListener('click', cancelEdit);
    document.getElementById("btnSaveDetail")?.addEventListener('click', saveScheduleDetail);
    document.getElementById("btnDeleteSchedule")?.addEventListener('click', deleteSchedule);
    document.getElementById("btnSuggestName")?.addEventListener('click', handleSuggestName);

    document.getElementById("periodEnabledDetail")?.addEventListener('change', toggleVisibility);
    document.getElementById("autoOffTimerEnabledDetail")?.addEventListener('change', toggleVisibility);
    document.getElementById("autoOffOffTimeEnabledDetail")?.addEventListener('change', toggleVisibility);
    document.getElementById("autoOffOffTempEnabledDetail")?.addEventListener('change', toggleVisibility);
    document.getElementById("motionPirEnabledDetail")?.addEventListener('change', toggleVisibility);
    document.getElementById("motionBleEnabledDetail")?.addEventListener('change', toggleVisibility);

    document.getElementById("btnAddSegmentDetail")?.addEventListener('click', () => {
      const container = document.getElementById("segmentListDetail");
      const segmentsFromUI = Array.from(container.querySelectorAll('.segment-card')).map((c, i) => collectSegmentData(c, i + 1));
      const newSegNo = segmentsFromUI.length + 1;
      const newSegment = {
        segNo: newSegNo,
        onMinutes: 60,
        mode: "PRESET",
        presetCode: "OCEAN",
        adjust: { windIntensity: 0.0, windVariability: 0.0 },
        fixed_speed: 0
      };
      segmentsFromUI.push(newSegment);
      if (g_editingItemIndex !== -1) {
        g_scheduleData[g_editingItemIndex].segments = segmentsFromUI;
      }
      renderSegmentList(segmentsFromUI);
    });

    // Segment 이동/삭제 (이벤트 위임)
    document.getElementById("scheduleDetailSection")?.addEventListener('click', (e) => {
      const target = e.target;
      if (target.dataset.action === 'up' || target.dataset.action === 'down' || target.dataset.action === 'delete') {
        const card = target.closest('.segment-card');
        const index = Number(card.dataset.index);
        if (isNaN(index)) return;

        const segments = Array.from(document.querySelectorAll('#segmentListDetail .segment-card')).map((c, i) => collectSegmentData(c, i + 1));
        let shouldUpdate = false;

        if (target.dataset.action === 'delete') {
          if (segments.length <= 1) return showScheduleToast("최소 1개의 단계는 유지해야 합니다.", "err");
          segments.splice(index, 1);
          shouldUpdate = true;
        } else if (target.dataset.action === 'up' && index > 0) {
          [segments[index], segments[index - 1]] = [segments[index - 1], segments[index]];
          shouldUpdate = true;
        } else if (target.dataset.action === 'down' && index < segments.length - 1) {
          [segments[index], segments[index + 1]] = [segments[index + 1], segments[index]];
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          segments.forEach((seg, i) => seg.segNo = i + 1);
          if (g_editingItemIndex !== -1) {
            g_scheduleData[g_editingItemIndex].segments = segments;
          }
          renderSegmentList(segments);
        }
      }
    });
  }

  // ──────────────────────────────────────────────
  // 13. 초기화
  // ──────────────────────────────────────────────
  initializeFirebase();
  setupEventListeners();
})();