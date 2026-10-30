/*
 * ------------------------------------------------------
 * 소스명 : P050_chart_t3_071.js
 * 모듈명 : Smart Nature Wind Chart Monitor (T3, v010)
 * ------------------------------------------------------
 * [v010 T3 확장]
 *  - windDict 로드 → 프리셋/스타일 이름 매핑
 *  - 요약 카드 (프리셋/스타일/제어/센서)
 *  - Set vs Applied 비교 테이블
 *  - 8개 차트:
 *    1) 풍속 / PWM
 *    2) Target vs Actual 풍속 (신규)
 *    3) Preset & Style 이력 (신규, 라벨 Y축)
 *    4) 핵심 매개변수
 *    5) 난류 / 열기포
 *    6) 이벤트
 *    7) 타이밍
 *    8) 센서 온/습도 (신규)
 *  - 이벤트 히스토리 & 1시간 통계 대시보드
 *  - 차트 위 이벤트 마커 (Chart.js 플러그인, 세로선)
 *  - 마커 hover 툴팁 & 호버 강조
 *  - 마커 클릭 ↔ 이벤트 리스트 상호 참조 (Active 지속, Flash 애니메이션, 스크롤)
 * ------------------------------------------------------
 * 의존: P000_common_071.js (SNW), P001_comm_API_071.js (SNW_API)
 * ------------------------------------------------------
 */

(() => {
  "use strict";

  const refreshLabel = SNW.$("#refreshInfo");

  let isPaused = false;
  const charts = [];

  // ============================================================
  // 이벤트 히스토리 상태
  // ============================================================
  const EVENT_MAX = 100;
  const eventHistory = [];       // { id, ts, level, type, msg }
  let   eventFilter  = "all";    // "all" | "warn" | "err"
  let   _eventSeq    = 0;        // 고유 id 시퀀스

  // 이전 상태 추적 (전환 감지용)
  const _prev = {
    stateCode:     null,
    overrideAct:   null,
    presetCode:    null,
    styleCode:     null,
    gustActive:    null,
    thermalActive: null,
    timeValid:     null,
    lastGustTs:    0,
    lastThermalTs: 0
  };

  // ============================================================
  // 이벤트 마커 (차트 위 세로선) & 인터랙션 상태
  // ============================================================
  const EVENT_MARKERS_KEY = "snw_event_markers";
  let   eventMarkersEnabled = SNW.store.get(EVENT_MARKERS_KEY, true);

  let _markerTooltipEl  = null;   // DOM (지연 생성)
  let _hoveredEventId   = null;   // 호버된 이벤트 id
  let _activeEventId    = null;   // 클릭으로 선택된 이벤트 id
  const MARKER_HIT_THRESHOLD_PX = 8;   // 마커 감지 반경(px)
  const CLICK_DRAG_THRESHOLD_PX = 5;   // 클릭 vs 드래그 판정 임계값

  // ── 커스텀 Chart.js 플러그인 ──
  const eventMarkerPlugin = {
    id: "snwEventMarkers",

    afterDatasetsDraw(chart) {
      if (!eventMarkersEnabled) return;
      if (!eventHistory.length) return;

      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales || !scales.x) return;

      const xScale = scales.x;
      const minX = xScale.min;
      const maxX = xScale.max;
      if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return;

      // 가시 범위 내 이벤트 필터
      const visible = eventHistory.filter(e => e.ts >= minX && e.ts <= maxX);
      if (!visible.length) return;

      const top    = chartArea.top;
      const bottom = chartArea.bottom;

      const lineColorOf = (lv) => {
        switch (lv) {
          case 1: return "rgba(231, 76, 60, 0.55)";
          case 2: return "rgba(243, 156, 18, 0.50)";
          case 3: return "rgba(52, 152, 219, 0.38)";
          default:return "rgba(149, 165, 166, 0.25)";
        }
      };
      const markColorOf = (lv) => {
        switch (lv) {
          case 1: return "#e74c3c";
          case 2: return "#f39c12";
          case 3: return "#3498db";
          default:return "#95a5a6";
        }
      };

      ctx.save();

      // 1) 세로 점선
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      visible.forEach(e => {
        if (_activeEventId === e.id) return; // active는 2단계에서 따로 두껍게 그림
        const x = xScale.getPixelForValue(e.ts);
        if (x < chartArea.left || x > chartArea.right) return;
        ctx.beginPath();
        ctx.strokeStyle = lineColorOf(e.level);
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      });

      // 2) 상단 삼각형 마커 (우선순위: active > hover > normal)
      ctx.setLineDash([]);
      visible.forEach(e => {
        const x = xScale.getPixelForValue(e.ts);
        if (x < chartArea.left || x > chartArea.right) return;

        const isActive  = (_activeEventId  === e.id);
        const isHovered = (_hoveredEventId === e.id);
        const color     = markColorOf(e.level);

        if (isActive) {
          // ACTIVE: 실선 + 큰 삼각형 + 외곽 링 + 배경 음영
          ctx.save();

          ctx.fillStyle = "rgba(243, 156, 18, 0.12)";
          ctx.fillRect(x - 7, top, 14, bottom - top);

          ctx.setLineDash([]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, top + 8, 8, 0, 2 * Math.PI);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, top + 8, 8, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, top + 16);
          ctx.lineTo(x - 7, top + 1);
          ctx.lineTo(x + 7, top + 1);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        } else if (isHovered) {
          // HOVER: 실선 + 큰 삼각형 + 글로우
          ctx.save();

          ctx.setLineDash([]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom);
          ctx.stroke();

          ctx.globalAlpha = 0.3;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, top + 14);
          ctx.lineTo(x - 6, top);
          ctx.lineTo(x + 6, top);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        } else {
          // NORMAL: 작은 삼각형
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, top + 10);
          ctx.lineTo(x - 4, top + 2);
          ctx.lineTo(x + 4, top + 2);
          ctx.closePath();
          ctx.fill();
        }
      });

      ctx.restore();
    }
  };

  // 전역 등록 (모든 차트 자동 적용)
  Chart.register(eventMarkerPlugin);

  // ============================================================
  // Crosshair (동기화 세로선)
  // ============================================================
  let _crosshairTs = null;            // 현재 크로스헤어 시각 (ms)
  let _crosshairUpdatePending = false;
  let _overlayHideTimer = null;

  const crosshairPlugin = {
      id: "snwCrosshair",

      // 그리드 아래, 데이터 위
      beforeDatasetsDraw(chart) {
          if (_crosshairTs === null) return;
          const { ctx, chartArea, scales } = chart;
          if (!chartArea || !scales || !scales.x) return;

          const xScale = scales.x;
          if (!Number.isFinite(xScale.min) || !Number.isFinite(xScale.max)) return;
          if (_crosshairTs < xScale.min || _crosshairTs > xScale.max) return;

          const x = xScale.getPixelForValue(_crosshairTs);
          if (x < chartArea.left || x > chartArea.right) return;

          ctx.save();
          ctx.strokeStyle = "rgba(231, 76, 60, 0.5)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);

          ctx.beginPath();
          ctx.moveTo(x, chartArea.top);
          ctx.lineTo(x, chartArea.bottom);
          ctx.stroke();

          // 상단 삼각형 인디케이터
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(231, 76, 60, 0.75)";
          ctx.beginPath();
          ctx.moveTo(x, chartArea.top + 6);
          ctx.lineTo(x - 4, chartArea.top);
          ctx.lineTo(x + 4, chartArea.top);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
      }
  };

  Chart.register(crosshairPlugin);

  // ============================================================
  // 크로스헤어 오버레이 갱신
  // ============================================================
  function _renderCrosshairOverlay(ts) {
      const el = document.getElementById("chartContextOverlay");
      if (!el) return;

      // 시각
      const d = new Date(ts);
      const pad = (n) => String(n).padStart(2, "0");
      document.getElementById("ccoTime").textContent =
          `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      // 데이터 조회 — chartWind의 wind/pwm
      const windDs = chartWind?.data?.datasets?.[0]?.data || [];
      const pwmDs  = chartWind?.data?.datasets?.[1]?.data || [];

      const pickNearest = (ds) => {
          if (!ds.length) return null;
          let best = null, bestD = Infinity;
          for (const p of ds) {
              const dd = Math.abs(p.x - ts);
              if (dd < bestD) { bestD = dd; best = p; }
          }
          return (bestD <= 3000) ? best : null;   // ±3초 이내
      };

      const w = pickNearest(windDs);
      const p = pickNearest(pwmDs);

      document.getElementById("ccoWind").textContent = w ? `${Number(w.y).toFixed(2)} m/s` : "-";
      document.getElementById("ccoPwm").textContent  = p ? `${Number(p.y).toFixed(1)} %`    : "-";

      // 프리셋 / 스타일 (chartPresetStyle)
      const pDs = chartPresetStyle?.data?.datasets?.[0]?.data || [];
      const sDs = chartPresetStyle?.data?.datasets?.[1]?.data || [];
      const pPt = pickNearest(pDs);
      const sPt = pickNearest(sDs);

      document.getElementById("ccoPreset").textContent = pPt ? presetLabel(Math.round(pPt.y)) : "-";
      document.getElementById("ccoStyle").textContent  = sPt ? styleLabel(Math.round(sPt.y))  : "-";

      // 이벤트 상태 (gust/thermal)
      const gDs = chartEvent?.data?.datasets?.[0]?.data || [];
      const tDs = chartEvent?.data?.datasets?.[1]?.data || [];
      const gPt = pickNearest(gDs);
      const tPt = pickNearest(tDs);
      const gustOn    = gPt && gPt.y === 1;
      const thermalOn = tPt && tPt.y === 1;

      const evParts = [];
      evParts.push(gustOn    ? "🔥 돌풍" : "·");
      evParts.push(thermalOn ? "♨️ 열기포" : "·");
      document.getElementById("ccoEvents").textContent = evParts.join(" ");

      // 이벤트 마커 근처 여부 (±3초)
      const evRow   = document.getElementById("ccoEventRow");
      const evMsgEl = document.getElementById("ccoEventMsg");
      let nearestEvent = null, bestD = 3000;
      for (const e of eventHistory) {
          const dd = Math.abs(e.ts - ts);
          if (dd < bestD) { bestD = dd; nearestEvent = e; }
      }
      if (nearestEvent) {
          evRow.style.display = "flex";
          evMsgEl.textContent = nearestEvent.msg;
      } else {
          evRow.style.display = "none";
      }

      el.style.display = "block";
  }

  function _scheduleCrosshairRender() {
      if (_crosshairUpdatePending) return;
      _crosshairUpdatePending = true;
      requestAnimationFrame(() => {
          _crosshairUpdatePending = false;
          charts.forEach(c => c && c.update("none"));
      });
  }

  // ============================================================
  // 크로스헤어 hover 핸들러
  // ============================================================
  function attachCrosshairHover(chart) {
      const canvas = chart.canvas;
      if (!canvas) return;

      canvas.addEventListener("mousemove", (e) => {
          // 이벤트 마커 근처면 크로스헤어 숨김
          if (eventMarkersEnabled) {
              const rect = canvas.getBoundingClientRect();
              const mx = e.clientX - rect.left;
              const my = e.clientY - rect.top;
              const evt = findNearestEvent(chart, mx, my);
              if (evt) {
                  if (_crosshairTs !== null) {
                      _crosshairTs = null;
                      _scheduleCrosshairRender();
                  }
                  const overlay = document.getElementById("chartContextOverlay");
                  if (overlay) overlay.style.display = "none";
                  return;
              }
          }

          const { chartArea, scales } = chart;
          if (!chartArea || !scales || !scales.x) return;
          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          if (mx < chartArea.left || mx > chartArea.right) {
              _clearCrosshair();
              return;
          }

          const xValue = scales.x.getValueForPixel(mx);
          if (!Number.isFinite(xValue)) return;

          _crosshairTs = xValue;
          _scheduleCrosshairRender();
          _renderCrosshairOverlay(xValue);

          if (_overlayHideTimer) {
              clearTimeout(_overlayHideTimer);
              _overlayHideTimer = null;
          }
      });

      canvas.addEventListener("mouseleave", () => {
          _overlayHideTimer = setTimeout(() => {
              _clearCrosshair();
          }, 200);
      });
  }

  function _clearCrosshair() {
      if (_crosshairTs === null) return;
      _crosshairTs = null;
      _scheduleCrosshairRender();

      const el = document.getElementById("chartContextOverlay");
      if (el) el.style.display = "none";
  }

  // 전역: ESC 키 → 크로스헤어 강제 종료
  document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _crosshairTs !== null) {
          _clearCrosshair();
      }
  });

  // ============================================================
  // 마커 Hover / Tooltip 유틸
  // ============================================================
  function getMarkerTooltip() {
    if (_markerTooltipEl) return _markerTooltipEl;
    _markerTooltipEl = document.createElement("div");
    _markerTooltipEl.className = "event-marker-tooltip";
    _markerTooltipEl.style.display = "none";
    document.body.appendChild(_markerTooltipEl);
    return _markerTooltipEl;
  }

  function findNearestEvent(chart, mouseX, mouseY) {
    if (!eventMarkersEnabled || !eventHistory.length) return null;

    const ca = chart.chartArea;
    if (!ca) return null;
    if (mouseX < ca.left || mouseX > ca.right) return null;
    if (mouseY < ca.top - 6 || mouseY > ca.bottom) return null;

    const xScale = chart.scales && chart.scales.x;
    if (!xScale) return null;
    if (!Number.isFinite(xScale.min) || !Number.isFinite(xScale.max)) return null;

    let best = null;
    let bestDist = MARKER_HIT_THRESHOLD_PX;

    for (const e of eventHistory) {
      if (e.ts < xScale.min || e.ts > xScale.max) continue;
      const x = xScale.getPixelForValue(e.ts);
      const d = Math.abs(x - mouseX);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showMarkerTooltip(evt, clientX, clientY) {
    const el = getMarkerTooltip();
    const lvLabel = ["", "ERR", "WRN", "INF", "DBG"][evt.level] || "LOG";
    const lvClass = `lv-${evt.level}`;
    const ts = new Date(evt.ts).toLocaleString("ko-KR", { hour12: false });

    el.className = `event-marker-tooltip ${lvClass}`;
    el.innerHTML =
      `<div class="mk-tt-header">` +
        `<span class="mk-tt-lv ${lvClass}">${lvLabel}</span>` +
        `<span class="mk-tt-ts">${ts}</span>` +
      `</div>` +
      `<div class="mk-tt-msg">${escapeHtml(evt.msg)}</div>`;

    el.style.display = "block";
    el.style.left = "0px";
    el.style.top  = "0px";

    const rect = el.getBoundingClientRect();
    const PAD = 12;

    let x = clientX + PAD;
    let y = clientY + PAD;

    if (x + rect.width > window.innerWidth - 8) {
      x = clientX - rect.width - PAD;
    }
    if (y + rect.height > window.innerHeight - 8) {
      y = clientY - rect.height - PAD;
    }
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    el.style.left = x + "px";
    el.style.top  = y + "px";
  }

  function hideMarkerTooltip() {
    if (_markerTooltipEl) _markerTooltipEl.style.display = "none";
    if (_hoveredEventId !== null) {
      _hoveredEventId = null;
      charts.forEach(c => c && c.update("none"));
    }
  }

  function setActiveEvent(eventId) {
    if (_activeEventId === eventId) {
      clearActiveEvent();
      return;
    }
    _activeEventId = eventId;

    const evt = eventHistory.find(e => e.id === eventId);
    if (evt) {
      if (eventFilter === "warn" && evt.level > 2) _switchFilter("all");
      if (eventFilter === "err"  && evt.level > 1) _switchFilter("all");
    }

    renderEvents();
    scrollToEventRow(eventId);
    charts.forEach(c => c && c.update("none"));
    updateActiveHint();
  }

  function clearActiveEvent() {
    if (_activeEventId === null) return;
    _activeEventId = null;
    renderEvents();
    charts.forEach(c => c && c.update("none"));
    updateActiveHint();
  }

  function scrollToEventRow(eventId) {
    const row = document.querySelector(`.event-row[data-event-id="${eventId}"]`);
    if (!row) return;

    row.scrollIntoView({ block: "center", behavior: "smooth" });

    row.classList.remove("flash");
    void row.offsetWidth;
    row.classList.add("flash");
    setTimeout(() => row.classList.remove("flash"), 1900);
  }

  function _switchFilter(newFilter) {
    eventFilter = newFilter;
    document.querySelectorAll("[data-evt-filter]").forEach(b => {
      b.classList.toggle("active", b.dataset.evtFilter === newFilter);
    });
  }

  function updateActiveHint() {
    const hint = document.querySelector(".marker-legend .mk-active-hint");
    if (!hint) return;
    if (_activeEventId) {
      const evt = eventHistory.find(e => e.id === _activeEventId);
      hint.textContent = evt ? `🎯 선택: ${evt.msg.substring(0, 30)}` : "🎯 선택됨";
      hint.classList.add("visible");
    } else {
      hint.classList.remove("visible");
    }
  }

  function attachMarkerHover(chart) {
    const canvas = chart.canvas;
    if (!canvas) return;

    let _downX = 0, _downY = 0, _downValid = false;

    canvas.addEventListener("mousedown", (e) => {
      _downX = e.clientX;
      _downY = e.clientY;
      _downValid = true;
    });

    canvas.addEventListener("mousemove", (e) => {
      if (!eventMarkersEnabled) {
        hideMarkerTooltip();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const evt = findNearestEvent(chart, mx, my);
      if (evt) {
        if (_hoveredEventId !== evt.id) {
          _hoveredEventId = evt.id;
          charts.forEach(c => c && c.update("none"));
        }
        showMarkerTooltip(evt, e.clientX, e.clientY);
      } else {
        hideMarkerTooltip();
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (!_downValid) return;
      _downValid = false;

      const dx = Math.abs(e.clientX - _downX);
      const dy = Math.abs(e.clientY - _downY);
      if (dx > CLICK_DRAG_THRESHOLD_PX || dy > CLICK_DRAG_THRESHOLD_PX) return;

      if (!eventMarkersEnabled) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const evt = findNearestEvent(chart, mx, my);
      if (evt) {
        setActiveEvent(evt.id);
      } else {
        if (_activeEventId !== null) clearActiveEvent();
      }
    });

    canvas.addEventListener("mouseleave", () => {
      hideMarkerTooltip();
    });

    canvas.addEventListener("touchstart", (e) => {
      if (!eventMarkersEnabled) return;
      if (!e.touches || !e.touches.length) return;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const mx = t.clientX - rect.left;
      const my = t.clientY - rect.top;
      const evt = findNearestEvent(chart, mx, my);
      if (evt) {
        _hoveredEventId = evt.id;
        charts.forEach(c => c && c.update("none"));
        showMarkerTooltip(evt, t.clientX, t.clientY);
      }
    }, { passive: true });

    canvas.addEventListener("touchend", (e) => {
      if (!eventMarkersEnabled) return;
      if (e.changedTouches && e.changedTouches.length) {
        const t = e.changedTouches[0];
        const rect = canvas.getBoundingClientRect();
        const mx = t.clientX - rect.left;
        const my = t.clientY - rect.top;
        const evt = findNearestEvent(chart, mx, my);
        if (evt) setActiveEvent(evt.id);
        else if (_activeEventId !== null) clearActiveEvent();
      }
      hideMarkerTooltip();
    }, { passive: true });
  }

  // ============================================================
  // 이벤트 히스토리 관리
  // ============================================================
  function pushEvent(level, type, msg) {
    eventHistory.unshift({
      id: ++_eventSeq,
      ts: Date.now(),
      level, type, msg
    });

    if (eventHistory.length > EVENT_MAX) {
      const removed = eventHistory.splice(EVENT_MAX);
      removed.forEach(r => {
        if (_activeEventId  === r.id) _activeEventId  = null;
        if (_hoveredEventId === r.id) _hoveredEventId = null;
      });
    }
    renderEvents();
    updateEventStats();

    if (eventMarkersEnabled) {
      charts.forEach(c => c && c.update("none"));
    }
  }

  function renderEvents() {
    const el = document.getElementById("eventList");
    if (!el) return;

    if (!eventHistory.length) {
      el.innerHTML = '<div class="muted events-empty">이벤트 없음 — 실시간 대기 중...</div>';
      const cntEl = document.getElementById("eventCount");
      if (cntEl) cntEl.textContent = "0";
      return;
    }

    const filtered = eventHistory.filter((e) => {
      if (eventFilter === "warn") return e.level <= 2;
      if (eventFilter === "err")  return e.level <= 1;
      return true;
    });

    el.innerHTML = filtered.map((e) => {
      const ts = new Date(e.ts).toLocaleTimeString("ko-KR", { hour12: false });
      const lvLabel = ["", "ERR", "WRN", "INF", "DBG"][e.level] || "LOG";
      const activeCls = (_activeEventId === e.id) ? " is-active" : "";
      return `<div class="event-row${activeCls}" data-level="${e.level}" data-event-id="${e.id}">
        <span class="ev-ts">${ts}</span>
        <span class="ev-lv lv-${e.level}">${lvLabel}</span>
        <span class="ev-msg">${e.msg}</span>
      </div>`;
    }).join("");

    const cntEl = document.getElementById("eventCount");
    if (cntEl) cntEl.textContent = String(eventHistory.length);
  }

  function updateEventStats() {
    const now = Date.now();
    const WINDOW_MS = 3600 * 1000; // 1시간

    const recent = eventHistory.filter((e) => (now - e.ts) <= WINDOW_MS);

    const cnt = {
      autoOff:     0,
      motion:      0,
      override:    0,
      gust:        0,
      thermal:     0,
      preset:      0,
      timeInvalid: 0,
      total:       recent.length
    };

    recent.forEach((e) => {
      switch (e.type) {
        case "autoOff":     cnt.autoOff++;     break;
        case "motion":      cnt.motion++;      break;
        case "override":    cnt.override++;    break;
        case "gust":        cnt.gust++;        break;
        case "thermal":     cnt.thermal++;     break;
        case "preset":      cnt.preset++;      break;
        case "timeInvalid": cnt.timeInvalid++; break;
      }
    });

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };
    set("statAutoOff",     cnt.autoOff);
    set("statMotion",      cnt.motion);
    set("statOverride",    cnt.override);
    set("statGust",        cnt.gust);
    set("statThermal",     cnt.thermal);
    set("statPreset",      cnt.preset);
    set("statTimeInvalid", cnt.timeInvalid);
    set("statTotal",       cnt.total);

    const w = document.getElementById("statsWindow");
    if (w) {
      const oldest = recent.length ? new Date(Math.min(...recent.map(e => e.ts))) : null;
      w.textContent = oldest
        ? `${new Date().toLocaleTimeString("ko-KR",{hour12:false})} 기준 · 최근 이벤트 ${oldest.toLocaleTimeString("ko-KR",{hour12:false})}~`
        : "-";
    }
  }

  // ============================================================
  // 매핑 테이블 (프리셋/스타일 이름)
  // ============================================================
  const presetMap = new Map();
  const styleMap  = new Map();
  const presetByCode = new Map();
  const styleByCode  = new Map();

  const DEFAULT_PRESET_NAMES = [
    "🌾 시골 바람", "🇮🇹 지중해성", "🌊 해변 바람", "🏔️ 산 바람", "🐎 대평원",
    "⚓ 항구 바람", "🌲 숲 그늘", "🌅 도시 석양", "🌪️ 열대 소나기", "🌌 사막의 밤"
  ];

  const DEFAULT_STYLE_NAMES = ["⚖️ Balance", "⚡ Active", "🎯 Focus", "🧘 Relax", "😴 Sleep"];

  // ============================================================
  // 실행 컨텍스트 미니맵 상수
  // ============================================================
  const CMM_WINDOW_KEY = "snw_cmm_window";       // localStorage 키
  const CMM_UPDATE_MIN = 2000;                    // 최소 갱신 간격 (ms)
  let   _cmmLastRender = 0;

  // 시간 윈도우 (분) — localStorage 로드, 기본 30분
  let   _cmmWindowMin = Number(SNW.store.get(CMM_WINDOW_KEY, 30));
  if (![30, 60, 180].includes(_cmmWindowMin)) _cmmWindowMin = 30;

  function _cmmWindowMs() {
      return _cmmWindowMin * 60 * 1000;
  }

  // 프리셋 10색 팔레트 (자연풍 테마 색상과 매칭)
  const PRESET_COLORS = [
      "#27ae60",   // 0 시골 (초록)
      "#3498db",   // 1 지중해성 (파랑)
      "#2980b9",   // 2 해변 (진한 파랑)
      "#7f8c8d",   // 3 산 (회색)
      "#e67e22",   // 4 대평원 (주황)
      "#16a085",   // 5 항구 (청록)
      "#2ecc71",   // 6 숲 (연두)
      "#e74c3c",   // 7 도시 석양 (빨강)
      "#9b59b6",   // 8 열대 소나기 (보라)
      "#34495e",   // 9 사막의 밤 (네이비)
  ];

  const EVENT_DOT_COLORS = {
      1: "#e74c3c",   // ERR
      2: "#f39c12",   // WARN
      3: "#3498db",   // INFO
      4: "#95a5a6",   // DEBUG
  };

  async function loadWindDict() {
    try {
      const data = await SNW.api.get(SNW_API.API_HTTP_WIND_PROFILE, "", true);
      if (!data || !data.windDict) return;

      const presets = Array.isArray(data.windDict.presets) ? data.windDict.presets : [];
      const styles  = Array.isArray(data.windDict.styles)  ? data.windDict.styles  : [];

      presets.forEach((p, idx) => {
        presetMap.set(idx, { code: p.code, name: p.name });
        presetByCode.set(p.code, { idx, name: p.name });
      });
      styles.forEach((s, idx) => {
        styleMap.set(idx, { code: s.code, name: s.name });
        styleByCode.set(s.code, { idx, name: s.name });
      });

      console.log(`[ChartT3] windDict loaded: ${presets.length} presets, ${styles.length} styles`);
    } catch (e) {
      console.warn("[ChartT3] loadWindDict failed:", e.message);
    }
  }

  function presetLabel(idx) {
    const p = presetMap.get(idx);
    if (p) return p.name || p.code || DEFAULT_PRESET_NAMES[idx] || `#${idx}`;
    return DEFAULT_PRESET_NAMES[idx] || `#${idx}`;
  }

  function styleLabel(idx) {
    const s = styleMap.get(idx);
    if (s) return s.name || s.code || DEFAULT_STYLE_NAMES[idx] || `#${idx}`;
    return DEFAULT_STYLE_NAMES[idx] || `#${idx}`;
  }

  // ============================================================
  // Chart.js 공통 옵션
  // ============================================================
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: { x: { type: "time", time: { unit: "second" } } },
    plugins: {
      legend: { position: "bottom" },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        pan:  { enabled: true, mode: "x" }
      }
    }
  };

  const initChart = (ctx, config) => {
    if (!ctx) return null;
    const c = new Chart(ctx, config);
    charts.push(c);
    attachMarkerHover(c);
    attachCrosshairHover(c);
    return c;
  };

  // ============================================================
  // 차트 인스턴스
  // ============================================================
  let chartWind, chartTargetActual, chartPresetStyle,
      chartParam, chartTurbThermSig, chartEvent, chartTiming, chartSensor;

  function initCharts() {
    const $ = SNW.$;

    // ── 1. 풍속 / PWM ──
    chartWind = initChart($("#chartWind"), {
      type: "line",
      data: {
        datasets: [
          { label: "풍속 (m/s)",   yAxisID: "yWind", borderColor: "#2196f3", data: [], tension: 0.3, pointRadius: 0 },
          { label: "PWM Duty (%)", yAxisID: "yPWM",  borderColor: "#ff6384", data: [], tension: 0.3, pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          yWind: { position: "left",  min: 0, max: 20 },
          yPWM:  { position: "right", min: 0, max: 100, grid: { drawOnChartArea: false } }
        }
      }
    });

    // ── 2. Target vs Actual ──
    chartTargetActual = initChart($("#chartTargetActual"), {
      type: "line",
      data: {
        datasets: [
          { label: "목표 풍속", borderColor: "#9b59b6", borderDash: [6,4], data: [], tension: 0.3, pointRadius: 0 },
          { label: "실제 풍속", borderColor: "#16a085", data: [], tension: 0.3, pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          y: { min: 0, max: 15 }
        }
      }
    });

    // ── 3. Preset & Style (라벨 Y축) ──
    chartPresetStyle = initChart($("#chartPresetStyle"), {
      type: "line",
      data: {
        datasets: [
          { label: "프리셋", yAxisID: "yPreset", borderColor: "#e67e22", stepped: true, data: [], pointRadius: 0 },
          { label: "스타일", yAxisID: "yStyle",  borderColor: "#3498db", stepped: true, data: [], pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          yPreset: {
            position: "left",
            min: -0.5, max: 9.5,
            ticks: {
              stepSize: 1,
              color: "#e67e22",
              callback: function(v) {
                const i = Math.round(v);
                if (i < 0 || i > 9) return "";
                return presetLabel(i);
              }
            }
          },
          yStyle: {
            position: "right",
            min: -0.5, max: 4.5,
            grid: { drawOnChartArea: false },
            ticks: {
              stepSize: 1,
              color: "#3498db",
              callback: function(v) {
                const i = Math.round(v);
                if (i < 0 || i > 4) return "";
                return styleLabel(i);
              }
            }
          }
        }
      }
    });

    // ── 4. 핵심 매개변수 ──
    chartParam = initChart($("#chartParams"), {
      type: "line",
      data: {
        datasets: [
          { label: "강도 (Intensity %)",      borderColor: "#4caf50", data: [], pointRadius: 0 },
          { label: "가변성 (Variability %)",  borderColor: "#ff9800", data: [], pointRadius: 0 },
          { label: "팬 최대 (Fan Limit %)",   borderColor: "#00bcd4", data: [], pointRadius: 0 },
          { label: "팬 최소 (Min Fan %)",     borderColor: "#e91e63", data: [], pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: { ...baseOptions.scales, y: { min: 0, max: 200 } }
      }
    });

    // ── 5. 난류 / 열기포 ──
    chartTurbThermSig = initChart($("#chartTurbThermSig"), {
      type: "line",
      data: {
        datasets: [
          { label: "난류 σ",     yAxisID: "ySig", borderColor: "#9c27b0", data: [], tension: 0.3, pointRadius: 0 },
          { label: "난류 길이",  yAxisID: "yLen", borderColor: "#795548", data: [], tension: 0.3, pointRadius: 0 },
          { label: "열기포 세기", yAxisID: "ySig", borderColor: "#8bc34a", data: [], tension: 0.3, pointRadius: 0, borderDash: [5,5] },
          { label: "열기포 반경", yAxisID: "yLen", borderColor: "#ffc107", data: [], tension: 0.3, pointRadius: 0, borderDash: [5,5] }
        ]
      },
      options: {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          ySig: { position: "left",  min: 0, max: 5 },
          yLen: { position: "right", min: 0, max: 200, grid: { drawOnChartArea: false } }
        }
      }
    });

    // ── 6. 이벤트 ──
    chartEvent = initChart($("#chartEvents"), {
      type: "line",
      data: {
        datasets: [
          { label: "돌풍 (Gust)",    borderColor: "#f44336", stepped: true, data: [], pointRadius: 0 },
          { label: "열기포 (Thermal)", borderColor: "#03a9f4", stepped: true, data: [], pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: { ...baseOptions.scales, y: { min: 0, max: 1 } }
      }
    });

    // ── 7. 타이밍 ──
    chartTiming = initChart($("#chartTiming"), {
      type: "line",
      data: {
        datasets: [
          { label: "Sim Interval (ms)",     borderColor: "#9e9e9e", data: [], tension: 0.3, pointRadius: 0 },
          { label: "Gust Interval (ms)",    borderColor: "#bdbdbd", data: [], tension: 0.3, pointRadius: 0 },
          { label: "Thermal Interval (ms)", borderColor: "#e0e0e0", data: [], tension: 0.3, pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: { ...baseOptions.scales, y: { min: 0 } }
      }
    });

    // ── 8. 센서 ──
    chartSensor = initChart($("#chartSensor"), {
      type: "line",
      data: {
        datasets: [
          { label: "온도 (°C)", yAxisID: "yT", borderColor: "#e67e22", data: [], tension: 0.4, pointRadius: 0 },
          { label: "습도 (%)",  yAxisID: "yH", borderColor: "#3498db", data: [], tension: 0.4, pointRadius: 0 }
        ]
      },
      options: {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          yT: { position: "left",  min: 0, max: 40 },
          yH: { position: "right", min: 0, max: 100, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  // ============================================================
  // WS 데이터 → 차트 반영
  // ============================================================
  const MAX_CHART_POINTS = 120;

  function _appendDataset(dataset, recs, key, transform) {
    if (!Array.isArray(dataset) || !Array.isArray(recs)) return;
    for (const r of recs) {
      const x = Number(r.t) || 0;
      if (!x) continue;

      let y = r[key];
      if (y === undefined || y === null) continue;
      if (transform) y = transform(y);

      const last = dataset[dataset.length - 1];
      if (last && last.x === x) {
        last.y = y;
      } else {
        dataset.push({ x, y });
      }
    }
    if (dataset.length > MAX_CHART_POINTS) {
      dataset.splice(0, dataset.length - MAX_CHART_POINTS);
    }
  }

  function detectChartEvents(recs) {
    if (!Array.isArray(recs) || !recs.length) return;

    recs.forEach((r) => {
      const t = Number(r.t) || 0;
      if (!t) return;

      const gustNow = r.gust === 1;
      if (gustNow && (_prev.lastGustTs === 0 || t - _prev.lastGustTs > 2000)) {
        pushEvent(3, "gust", "🔥 돌풍 발생");
        _prev.lastGustTs = t;
      }

      const thermalNow = r.thermal === 1;
      if (thermalNow && (_prev.lastThermalTs === 0 || t - _prev.lastThermalTs > 2000)) {
        pushEvent(3, "thermal", "♨️ 열기포 발생");
        _prev.lastThermalTs = t;
      }
    });
  }

  function processChartRecords(recs) {
    if (!Array.isArray(recs) || recs.length === 0) return;

    // 1) 풍속 / PWM
    _appendDataset(chartWind.data.datasets[0].data, recs, "wind");
    _appendDataset(chartWind.data.datasets[1].data, recs, "pwm");

    // 2) Target vs Actual
    _appendDataset(chartTargetActual.data.datasets[0].data, recs, "targetWind");
    _appendDataset(chartTargetActual.data.datasets[1].data, recs, "wind");

    // 3) Preset & Style
    _appendDataset(chartPresetStyle.data.datasets[0].data, recs, "preset");
    _appendDataset(chartPresetStyle.data.datasets[1].data, recs, "styleIdx");

    // 4) 핵심 파라미터
    _appendDataset(chartParam.data.datasets[0].data, recs, "intensity");
    _appendDataset(chartParam.data.datasets[1].data, recs, "variability");
    _appendDataset(chartParam.data.datasets[2].data, recs, "fanLimit");
    _appendDataset(chartParam.data.datasets[3].data, recs, "minFan");

    // 5) 난류 / 열기포
    _appendDataset(chartTurbThermSig.data.datasets[0].data, recs, "turb_sig");
    _appendDataset(chartTurbThermSig.data.datasets[1].data, recs, "turb_len");
    _appendDataset(chartTurbThermSig.data.datasets[2].data, recs, "therm_str");
    _appendDataset(chartTurbThermSig.data.datasets[3].data, recs, "therm_rad");

    // 6) 이벤트
    _appendDataset(chartEvent.data.datasets[0].data, recs, "gust",    (v) => v ? 1 : 0);
    _appendDataset(chartEvent.data.datasets[1].data, recs, "thermal", (v) => v ? 1 : 0);

    // 이벤트 감지 (gust/thermal rising edge)
    detectChartEvents(recs);

    // 7) 타이밍
    _appendDataset(chartTiming.data.datasets[0].data, recs, "sim_int");
    _appendDataset(chartTiming.data.datasets[1].data, recs, "gust_int");
    _appendDataset(chartTiming.data.datasets[2].data, recs, "thermal_int");

    // 8) 센서
    _appendDataset(chartSensor.data.datasets[0].data, recs, "tempC");
    _appendDataset(chartSensor.data.datasets[1].data, recs, "humidity");

    if (chartSensor.data.datasets[0].data.length > 0) {
      const ph = document.getElementById("sensorPlaceholder");
      if (ph) ph.remove();
    }

    charts.forEach((c) => c && c.update("none"));

    const last = recs[recs.length - 1];
    if (refreshLabel && last?.t) {
      const ts = new Date(Number(last.t)).toLocaleTimeString("ko-KR", { hour12: false });
      refreshLabel.textContent = `🕒 WS 업데이트: ${ts} (샘플 ${recs.length}개)`;
    }
  }

  // ============================================================
  // 요약 카드 / 비교 테이블 갱신 (state API 폴링)
  // ============================================================
  const _set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const _fmt = (v, digits = 1) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(digits) : "-";
  };

  const _fmtUptime = (s) => {
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(Math.floor(s % 60)).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  function detectStateTransitions(sim, ctl) {
    const stateCode = (ctl.stateCode != null) ? ctl.stateCode : 0;
    const ovActive  = !!(ctl.override && ctl.override.active);
    const timeValid = (ctl.time && ctl.time.valid !== undefined) ? !!ctl.time.valid : null;
    const pCode     = sim.presetCode || "";
    const sCode     = sim.styleCode  || "";

    // ── CT10 상태 전환 ──
    if (_prev.stateCode !== stateCode) {
      if (_prev.stateCode !== null) {
        switch (stateCode) {
          case 5: pushEvent(2, "autoOff",     "🛑 AutoOff로 정지"); break;
          case 4: pushEvent(3, "motion",      "👤 모션 감지 없음 (Blocked)"); break;
          case 6: pushEvent(1, "timeInvalid", "⏰ 시간 미동기 상태 진입"); break;
          case 1: pushEvent(3, "override",    "🎬 Override 시작"); break;
          case 2:
          case 3: pushEvent(3, "state",       `▶️ 제어 활성 (${ctl.state || "-"})`); break;
          case 0: pushEvent(3, "state",       "✅ IDLE 로 복귀"); break;
        }
      }
      _prev.stateCode = stateCode;
    }

    // ── Override on/off ──
    if (_prev.overrideAct !== ovActive) {
      if (ovActive && ctl.override) {
        const mode = ctl.override.useFixed
          ? `고정 ${ctl.override.fixedPercent ?? "?"}%`
          : `${ctl.override.presetCode || "-"}`;
        pushEvent(3, "override", `🎬 Override 시작 (${mode})`);
      } else if (_prev.overrideAct === true) {
        pushEvent(3, "override", "🎬 Override 종료");
      }
      _prev.overrideAct = ovActive;
    }

    // ── 프리셋 변경 ──
    if (_prev.presetCode !== pCode && pCode) {
      if (_prev.presetCode) {
        const pInfo = presetByCode.get(pCode);
        const name = pInfo ? pInfo.name : pCode;
        pushEvent(3, "preset", `🎨 프리셋 변경: ${_prev.presetCode} → ${name}`);
      }
      _prev.presetCode = pCode;
    }

    // ── 스타일 변경 ──
    if (_prev.styleCode !== sCode && sCode) {
      if (_prev.styleCode) {
        const sInfo = styleByCode.get(sCode);
        const name = sInfo ? sInfo.name : sCode;
        pushEvent(3, "style", `🎨 스타일 변경: ${_prev.styleCode} → ${name}`);
      }
      _prev.styleCode = sCode;
    }

    // ── Time valid 전환 ──
    if (timeValid !== null && _prev.timeValid !== timeValid) {
      if (_prev.timeValid === false && timeValid === true) {
        pushEvent(3, "time", "⏰ 시간 동기화 완료");
      } else if (_prev.timeValid === true && timeValid === false) {
        pushEvent(2, "timeInvalid", "⏰ 시간 동기화 끊김");
      }
      _prev.timeValid = timeValid;
    }
  }

  function applyStateToUi(state) {
    if (!state) return;

    const sim = state.sim || {};
    const ctl = state.control || {};
    const sensor = ctl.sensor || {};

    // [이벤트 감지] 상태 전환
    detectStateTransitions(sim, ctl);

    // ── 요약 카드 ──
    const pCode = sim.presetCode || "";
    const pInfo = presetByCode.get(pCode);
    _set("sumPreset",     pInfo ? `🎨 ${pInfo.name}` : (pCode || "-"));
    _set("sumPresetCode", pCode ? `Code: ${pCode}` : "-");

    const sCode = sim.styleCode || "";
    const sInfo = styleByCode.get(sCode);
    _set("sumStyle",     sInfo ? `🎨 ${sInfo.name}` : (sCode || "-"));
    _set("sumStyleCode", sCode ? `Code: ${sCode}` : "-");

    const ctlEl = document.getElementById("sumCtlState");
    if (ctlEl) {
      ctlEl.textContent = ctl.state || "-";
      const sc = ctl.stateCode;
      if (sc === 2 || sc === 3) ctlEl.className = "info-label ok";
      else if (sc === 1)        ctlEl.className = "info-label warn";
      else if (sc === 5 || sc === 6) ctlEl.className = "info-label err";
      else                      ctlEl.className = "info-label info";
    }

    let target = "없음";
    if (ctl.override && ctl.override.active) {
      target = ctl.override.useFixed
        ? `Override: 고정 ${ctl.override.fixedPercent ?? "?"}%`
        : `Override: ${ctl.override.presetCode || "-"}`;
    } else if (ctl.schedule?.fromRunSource) {
      target = `스케줄: ${ctl.schedule.name || "-"}${ctl.schedule.schNo ? ` (#${ctl.schedule.schNo})` : ""}`;
    } else if (ctl.profile?.fromRunSource) {
      target = `프로파일: ${ctl.profile.name || "-"}${ctl.profile.profileNo ? ` (#${ctl.profile.profileNo})` : ""}`;
    }
    _set("sumRunTarget", target);

    const tempStr = (sensor.tempC != null) ? `${_fmt(sensor.tempC)}°C` : "-";
    const humStr  = (sensor.humidity != null) ? `${_fmt(sensor.humidity)}%` : "-";
    const motionStr = (sensor.motionActive === true) ? "🚶 재실" : (sensor.motionActive === false ? "👤 부재" : "-");
    _set("sumSensor", `${tempStr} / ${humStr} · ${motionStr}`);
    _set("sumUptime", `가동: ${_fmtUptime(performance.now() / 1000)}`);

    // ── Set vs Applied 비교 테이블 ──
    _set("setIntensity",    `${_fmt(sim.intensity)} %`);
    _set("setVariability",  `${_fmt(sim.variability)} %`);
    _set("setGustFreq",     `${_fmt(sim.gustFreq)} %`);
    _set("setFanLimit",     `${_fmt(sim.fanLimit)} %`);
    _set("setMinFan",       `${_fmt(sim.minFan)} %`);
    _set("setTurbSigma",    _fmt(sim.turbSigma, 2));
    _set("setThermalStr",   _fmt(sim.thermalStrength, 2));
    _set("setWindTarget",   `${_fmt(sim.targetWind, 2)} m/s`);

    _set("appIntensity",    `${_fmt(sim.intensity)} %`);
    _set("appVariability",  `${_fmt(sim.variability)} %`);
    _set("appGustFreq",     `${_fmt(sim.gustFreq)} %`);
    _set("appFanLimit",     `${_fmt(sim.fanLimit)} %`);
    _set("appMinFan",       `${_fmt(sim.minFan)} %`);
    _set("appTurbSigma",    _fmt(sim.turbSigma, 2));
    _set("appThermalStr",   _fmt(sim.thermalStrength, 2));
    _set("appWindActual",   `${_fmt(sim.windSpeed, 2)} m/s`);

    _set("appPwmDuty",      `${_fmt(sim.pwmDuty)} %`);
    _set("appPhase",        sim.phase || "-");
    _set("appGust",         sim.gustActive ? "🔥 발생" : "—");
    _set("appThermal",      sim.thermalActive ? "♨️ 발생" : "—");
    _set("appSimActive",    sim.active ? "✅ ON" : "⏸️ OFF");
    _set("appOverride",     ctl.override?.active
        ? (ctl.override.useFixed ? `Fixed ${ctl.override.fixedPercent ?? "?"}%` : "Preset")
        : "없음");
    _set("appSensorTempHum", `${tempStr} / ${humStr}`);
    _set("appMotion",       motionStr);

    const tsEl = document.getElementById("compareTimestamp");
    if (tsEl) {
      tsEl.textContent = `마지막 갱신: ${new Date().toLocaleTimeString("ko-KR", { hour12: false })}`;
    }

    // ── 센서 차트 실시간 push (state 폴링 2초) ──
    if (sensor.tempC != null && sensor.humidity != null) {
      const now = Date.now();
      const dsTemp = chartSensor.data.datasets[0].data;
      const dsHum  = chartSensor.data.datasets[1].data;

      const lastPt = dsTemp[dsTemp.length - 1];
      if (!lastPt || (now - lastPt.x) >= 5000) {
        dsTemp.push({ x: now, y: sensor.tempC });
        dsHum.push({ x: now, y: sensor.humidity });
        if (dsTemp.length > MAX_CHART_POINTS) dsTemp.splice(0, dsTemp.length - MAX_CHART_POINTS);
        if (dsHum.length  > MAX_CHART_POINTS) dsHum.splice(0, dsHum.length - MAX_CHART_POINTS);

        const ph = document.getElementById("sensorPlaceholder");
        if (ph) ph.remove();

        chartSensor.update("none");
      }
    }

    // [신규] 실행 컨텍스트 미니맵 갱신 (스로틀됨)
    scheduleMinimapUpdate();
  }

  // ============================================================
  // 실행 컨텍스트 미니맵
  // ============================================================
  function buildContextSegments() {
      const now = Date.now();
      const minTs = now - _cmmWindowMs();

      const pDs = chartPresetStyle?.data?.datasets?.[0]?.data || [];
      if (pDs.length < 2) return [];

      // 윈도우 내 데이터만
      const recent = pDs.filter(p => p.x >= minTs);
      if (recent.length < 2) return [];

      // 시작점: 윈도우 시작 이전 마지막 샘플로 경계 확장
      const before = pDs.filter(p => p.x < minTs);
      const first = before.length
          ? { x: minTs, y: before[before.length - 1].y }
          : recent[0];

      // 세그먼트 분할
      const segments = [];
      let curStart = minTs;
      let curPreset = Math.round(first.y);

      for (let i = 0; i < recent.length; i++) {
          const newPreset = Math.round(recent[i].y);
          if (newPreset !== curPreset) {
              segments.push({
                  start: curStart,
                  end: recent[i].x,
                  presetIdx: curPreset,
              });
              curStart = recent[i].x;
              curPreset = newPreset;
          }
      }
      // 마지막
      segments.push({
          start: curStart,
          end: now,
          presetIdx: curPreset,
      });

      return segments;
  }

  function renderContextMinimap() {
      const el = document.getElementById("cmmTimeline");
      if (!el) return;

      const now = Date.now();
      const minTs = now - _cmmWindowMs();
      const total = now - minTs;

      const segments = buildContextSegments();

      if (!segments.length) {
          el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
          renderPresetStats();
          return;
      }

      // ── 블록 생성 ──
      const blocksHtml = segments.map((seg) => {
          const left  = ((seg.start - minTs) / total) * 100;
          const width = ((seg.end - seg.start) / total) * 100;

          const preset = presetMap.get(seg.presetIdx);
          const name = preset ? preset.name : presetLabel(seg.presetIdx);
          const code = preset ? preset.code : `#${seg.presetIdx}`;
          const color = PRESET_COLORS[seg.presetIdx] || "#607d8b";

          const durMin = Math.max(1, Math.round((seg.end - seg.start) / 60000));
          const startStr = new Date(seg.start).toLocaleTimeString("ko-KR", { hour12: false });

          return `<div class="cmm-block"
                       style="left:${left.toFixed(3)}%; width:${Math.max(width, 0.15).toFixed(3)}%; background:${color};"
                       data-ts="${Math.floor((seg.start + seg.end) / 2)}"
                       title="${name} (${code}) · ${startStr} · ${durMin}분">
                  </div>`;
      }).join("");

      // ── 이벤트 도트 생성 ──
      const eventsHtml = eventHistory
          .filter(e => e.ts >= minTs && e.ts <= now)
          .map((e) => {
              const left = ((e.ts - minTs) / total) * 100;
              const color = EVENT_DOT_COLORS[e.level] || EVENT_DOT_COLORS[4];
              const ts = new Date(e.ts).toLocaleTimeString("ko-KR", { hour12: false });
              return `<div class="cmm-event-dot"
                           style="left:${left.toFixed(3)}%; background:${color};"
                           title="[${ts}] ${escapeHtml ? escapeHtml(e.msg) : e.msg}">
                      </div>`;
          }).join("");

      el.innerHTML = blocksHtml + eventsHtml;

      // 시간축 라벨 동적 갱신
      _updateCmmAxisLabels();

      // 헤더 라벨 갱신
      const labelEl = document.getElementById("cmmLabel");
      if (labelEl) {
          const w = _cmmWindowMin;
          const wStr = (w < 60) ? `${w}분` : `${w / 60}시간`;
          labelEl.textContent = `🕒 실행 컨텍스트 (최근 ${wStr})`;
      }

      // 프리셋 사용 통계 갱신
      renderPresetStats();
  }

  function _updateCmmAxisLabels() {
      const el = document.getElementById("cmmAxis");
      if (!el) return;

      const w = _cmmWindowMin;
      const labels = [];

      const marks = [w, Math.round(w * 2 / 3), Math.round(w * 1 / 3), 0];
      marks.forEach((m) => {
          if (m === 0) {
              labels.push("현재");
          } else if (m < 60) {
              labels.push(`-${m}분`);
          } else {
              const h = m / 60;
              labels.push(Number.isInteger(h) ? `-${h}시간` : `-${m}분`);
          }
      });

      el.innerHTML = labels.map(t => `<span>${t}</span>`).join("");
  }

  // ============================================================
  // 프리셋 사용 통계 (Top 3)
  //  - chartPresetStyle 데이터 기반
  //  - buildContextSegments() 재사용 → 중복 계산 없음
  // ============================================================
  function renderPresetStats() {
      const el = document.getElementById("cmmStatsGrid");
      const winEl = document.getElementById("cmmStatWindow");
      if (!el) return;

      // 윈도우 라벨
      if (winEl) {
          const w = _cmmWindowMin;
          const wStr = (w < 60) ? `최근 ${w}분` : `최근 ${w / 60}시간`;
          winEl.textContent = wStr;
      }

      // 세그먼트 재사용
      const segments = buildContextSegments();
      if (!segments.length) {
          el.innerHTML = '<div class="cmm-stat-empty">데이터 수집 중...</div>';
          return;
      }

      // 프리셋별 누적 시간
      const durations = {};   // code → ms
      segments.forEach((seg) => {
          const p = presetMap.get(seg.presetIdx);
          if (!p) return;
          const code = p.code || `#${seg.presetIdx}`;
          durations[code] = (durations[code] || 0) + (seg.end - seg.start);
      });

      // Top 3 정렬
      const entries = Object.entries(durations)
          .map(([code, ms]) => {
              const idx = [...presetMap.entries()].find(([, v]) => v.code === code)?.[0];
              const p = presetMap.get(idx);
              return {
                  code,
                  ms,
                  name: p ? (p.name || code) : code,
                  color: PRESET_COLORS[(idx !== undefined ? idx : 0) % PRESET_COLORS.length] || "#607d8b",
              };
          })
          .sort((a, b) => b.ms - a.ms)
          .slice(0, 3);

      if (!entries.length) {
          el.innerHTML = '<div class="cmm-stat-empty">현재 윈도우 내 이력 없음</div>';
          return;
      }

      const totalMs = entries.reduce((s, e) => s + e.ms, 0);
      const maxMs   = entries[0].ms;

      const fmtDur = (ms) => {
          const s = Math.floor(ms / 1000);
          if (s < 60) return `${s}초`;
          const m = Math.floor(s / 60);
          if (m < 60) return `${m}분`;
          const h = Math.floor(m / 60);
          const rm = m % 60;
          return rm ? `${h}시간 ${rm}분` : `${h}시간`;
      };

      el.innerHTML = entries.map((e, idx) => {
          const rank = idx + 1;
          const rankLabel = ["🥇", "🥈", "🥉"][idx] || `#${rank}`;
          const pctTotal = totalMs > 0 ? Math.round((e.ms / totalMs) * 100) : 0;
          const barW = Math.round((e.ms / maxMs) * 100);

          return `<div class="cmm-stat-card rank-${rank}" style="border-left-color:${e.color};">
              <span class="cmm-stat-rank">${rankLabel}</span>
              <div class="cmm-stat-name">${e.name}</div>
              <div class="cmm-stat-code">${e.code}</div>
              <div class="cmm-stat-bar-wrap">
                  <div class="cmm-stat-bar" style="width:${barW}%; background:${e.color};"></div>
              </div>
              <div class="cmm-stat-duration">
                  <span class="dur-value">${fmtDur(e.ms)}</span>
                  <span class="dur-pct">${pctTotal}%</span>
              </div>
          </div>`;
      }).join("");
  }

  function scheduleMinimapUpdate() {
      const now = Date.now();
      if (now - _cmmLastRender < CMM_UPDATE_MIN) return;
      _cmmLastRender = now;
      renderContextMinimap();
  }

  let statePollTimer = null;
  async function pollState() {
    try {
      const data = await SNW.api.get(SNW_API.API_HTTP_STATE, "", true);
      if (data) applyStateToUi(data);
    } catch (e) {
      console.warn("[ChartT3] state poll failed:", e.message);
    } finally {
      statePollTimer = setTimeout(pollState, 2000);
    }
  }

  // ============================================================
  // WebSocket
  // ============================================================
  let ws = null;
  function initWebSocket() {
    const url = SNW.buildWsUrl(SNW_API.WS_API_CHART);
    ws = new WebSocket(url);

    ws.onopen = () => {
      if (refreshLabel) refreshLabel.textContent = "✅ 실시간 차트 데이터 수신 중...";
      if (window.showToast) window.showToast("/ws/chart 연결 성공", "ok");
    };

    ws.onmessage = (event) => {
      if (isPaused) return;
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.chart)) {
          processChartRecords(data.chart);
          scheduleMinimapUpdate();   // [신규] 미니맵 스로틀 갱신
        }
      } catch (e) {
        console.error("[ChartT3] WS 파싱 오류:", e);
        if (window.showToast) window.showToast("WS 데이터 파싱 오류", "err");
      }
    };

    ws.onclose = () => {
      if (refreshLabel) refreshLabel.textContent = "❌ WS 연결 끊김. 5초 후 재연결...";
      if (window.showToast) window.showToast("/ws/chart 연결 끊김", "warn");
      setTimeout(initWebSocket, 5000);
    };

    ws.onerror = (e) => {
      console.error("[ChartT3] WebSocket 오류:", e);
      if (refreshLabel) refreshLabel.textContent = "⚠️ WS 오류 발생";
    };
  }

  // ============================================================
  // 이벤트 바인딩
  // ============================================================
  function bindEvents() {
    document.getElementById("btnPause")?.addEventListener("click", () => {
      isPaused = true;
      if (refreshLabel) refreshLabel.textContent = "⏸ 갱신 일시정지됨";
      if (window.showToast) window.showToast("차트 갱신 일시정지", "warn");
    });

    document.getElementById("btnResume")?.addEventListener("click", () => {
      isPaused = false;
      if (window.showToast) window.showToast("차트 갱신 재개", "ok");
    });

    document.getElementById("btnResetZoomAll")?.addEventListener("click", () => {
      charts.forEach((c) => c && c.resetZoom && c.resetZoom());
      if (window.showToast) window.showToast("모든 차트 줌 초기화", "ok");
    });

    // 이벤트 마커 토글
    const btnToggleMarkers = document.getElementById("btnToggleMarkers");
    if (btnToggleMarkers) {
      btnToggleMarkers.classList.toggle("ok", eventMarkersEnabled);
      btnToggleMarkers.textContent = eventMarkersEnabled
        ? "📍 이벤트 마커 ON"
        : "📍 이벤트 마커 OFF";

      btnToggleMarkers.addEventListener("click", () => {
        eventMarkersEnabled = !eventMarkersEnabled;
        SNW.store.set(EVENT_MARKERS_KEY, eventMarkersEnabled);

        btnToggleMarkers.textContent = eventMarkersEnabled
          ? "📍 이벤트 마커 ON"
          : "📍 이벤트 마커 OFF";
        btnToggleMarkers.classList.toggle("ok", eventMarkersEnabled);

        if (!eventMarkersEnabled) {
          hideMarkerTooltip();
        }

        charts.forEach(c => c && c.update("none"));

        if (window.showToast) {
          window.showToast(
            eventMarkersEnabled ? "이벤트 마커 표시" : "이벤트 마커 숨김",
            eventMarkersEnabled ? "ok" : "info"
          );
        }
      });
    }

    // 이벤트 필터
    document.querySelectorAll("[data-evt-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-evt-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        eventFilter = btn.dataset.evtFilter || "all";
        renderEvents();
      });
    });

    // 이벤트 초기화
    document.getElementById("btnClearEvents")?.addEventListener("click", () => {
      if (!eventHistory.length) return;
      if (!confirm("이벤트 히스토리를 모두 지우시겠습니까?")) return;

      eventHistory.length = 0;
      _activeEventId  = null;
      _hoveredEventId = null;
      renderEvents();
      updateEventStats();
      updateActiveHint();

      charts.forEach(c => c && c.update("none"));

      if (window.showToast) window.showToast("이벤트 히스토리 초기화", "info");
    });

    // 이벤트 내보내기 (JSON)
    document.getElementById("btnExportEvents")?.addEventListener("click", () => {
      if (!eventHistory.length) {
        if (window.showToast) window.showToast("내보낼 이벤트가 없습니다.", "warn");
        return;
      }
      const payload = {
        exportedAt: new Date().toISOString(),
        count:      eventHistory.length,
        events:     eventHistory.slice().reverse()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)],
                            { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const filename = `snw_events_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.showToast) window.showToast(`이벤트 ${eventHistory.length}개 내보내기 완료`, "ok");
    });

    // 이벤트 리스트 행 클릭 → active 지정
    document.getElementById("eventList")?.addEventListener("click", (e) => {
      const row = e.target.closest(".event-row");
      if (!row) return;
      const idStr = row.dataset.eventId;
      if (!idStr) return;
      const id = Number(idStr);
      if (!Number.isFinite(id)) return;

      setActiveEvent(id);
    });

    // ESC 키 → active 해제
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _activeEventId !== null) {
        clearActiveEvent();
      }
    });

    // 차트 접기/펼치기
    document.querySelectorAll(".chart-container").forEach((container) => {
      const header = container.querySelector(".chart-header");
      const content = container.querySelector(".chart-content");
      const btnToggle = container.querySelector(".btn-toggle");
      if (!header || !content || !btnToggle) return;

      header.addEventListener("click", () => {
        if (content.style.display === "none") {
          content.style.display = "block";
          btnToggle.textContent = "▲";
        } else {
          content.style.display = "none";
          btnToggle.textContent = "▼";
        }
      });
    });

    // 실행 컨텍스트 미니맵 클릭 → 크로스헤어 이동
    document.getElementById("cmmTimeline")?.addEventListener("click", (e) => {
        const block = e.target.closest(".cmm-block");
        if (!block) return;

        const ts = Number(block.dataset.ts);
        if (!Number.isFinite(ts)) return;

        _crosshairTs = ts;
        _scheduleCrosshairRender();
        _renderCrosshairOverlay(ts);

        document.querySelector(".chart-section, .chart-grid")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        if (window.showToast) {
            const t = new Date(ts).toLocaleTimeString("ko-KR", { hour12: false });
            window.showToast(`차트 시각 이동: ${t}`, "info");
        }
    });

    // 미니맵 시간 윈도우 토글
    document.querySelectorAll("[data-cmm-window]").forEach((btn) => {
        const w = Number(btn.dataset.cmmWindow);
        btn.classList.toggle("active", w === _cmmWindowMin);

        btn.addEventListener("click", () => {
            const newW = Number(btn.dataset.cmmWindow);
            if (![30, 60, 180].includes(newW)) return;
            if (newW === _cmmWindowMin) return;

            _cmmWindowMin = newW;
            SNW.store.set(CMM_WINDOW_KEY, newW);

            document.querySelectorAll("[data-cmm-window]").forEach((b) => {
                b.classList.toggle("active", Number(b.dataset.cmmWindow) === newW);
            });

            _cmmLastRender = 0;
            renderContextMinimap();
            renderPresetStats();

            if (window.showToast) {
                const wStr = (newW < 60) ? `${newW}분` : `${newW / 60}시간`;
                window.showToast(`미니맵 윈도우: ${wStr}`, "info");
            }
        });
    });
  }

  // ============================================================
  // 초기화
  // ============================================================
  document.addEventListener("DOMContentLoaded", async () => {
    initCharts();
    bindEvents();

    renderEvents();
    updateEventStats();
    setInterval(updateEventStats, 30000);

    await loadWindDict();
    initWebSocket();
    pollState();

    window.addEventListener("beforeunload", () => {
      if (statePollTimer) clearTimeout(statePollTimer);
      if (ws) try { ws.close(); } catch {}
      if (_markerTooltipEl && _markerTooltipEl.parentNode) {
        _markerTooltipEl.parentNode.removeChild(_markerTooltipEl);
      }
      if (_overlayHideTimer) clearTimeout(_overlayHideTimer);
    });

    // 실행 컨텍스트 미니맵 & 통계 초기 렌더
    renderContextMinimap();
    renderPresetStats();

    // 30초마다 강제 재렌더 (윈도우 슬라이딩 + 통계)
    setInterval(() => {
        _cmmLastRender = 0;
        renderContextMinimap();
        renderPresetStats();
    }, 30000);

    console.log("[ChartT3] init complete");
  });

})();
