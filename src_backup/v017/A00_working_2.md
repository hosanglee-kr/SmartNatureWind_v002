P050 Chart Crosshair + Context Overlay (동기화 크로스헤어)

개요:

· 모든 8개 차트 동기화 크로스헤어 — 하나 hover 시 전부 세로선 표시
· 상단 플로팅 오버레이에 그 시각의 컨텍스트 요약
· 데이터 소스: 차트 버퍼 자체 (백엔드 무변경)
· 이벤트 마커와 공존 (마커 근처면 마커 tooltip 우선)
· requestAnimationFrame 스로틀링 (성능 최적)

변경 파일 3개:

# 파일 상태
1 P050_chart_t3_071.html 🔄 오버레이 div 1개
2 P050_chart_t3_071.css 🔄 파일 끝 append
3 P050_chart_t3_071.js 🔄 5곳 수정 + 신규 플러그인

---

📄 1. P050_chart_t3_071.html — 오버레이 div

<body> 바로 뒤, <header> 앞에 삽입:

```html
<!-- Chart Crosshair Context Overlay -->
<div id="chartContextOverlay" class="chart-context-overlay" style="display:none;">
    <div class="cco-row cco-time" id="ccoTime">--:--:--</div>
    <div class="cco-row"><span class="cco-lb">💨 풍속</span><span id="ccoWind">-</span> <span class="cco-sep">·</span> <span class="cco-lb">PWM</span><span id="ccoPwm">-</span></div>
    <div class="cco-row"><span class="cco-lb">🎨 프리셋</span><span id="ccoPreset">-</span> <span class="cco-sep">·</span> <span class="cco-lb">스타일</span><span id="ccoStyle">-</span></div>
    <div class="cco-row"><span class="cco-lb">⚡</span><span id="ccoEvents">-</span></div>
    <div class="cco-row cco-ev-row" id="ccoEventRow" style="display:none;">
        <span class="cco-lb">📍 이벤트</span><span id="ccoEventMsg">-</span>
    </div>
</div>
```

---

📄 2. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* Chart Crosshair Context Overlay                              */
/* ============================================================ */

.chart-context-overlay {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1500;
    min-width: 260px;
    max-width: 340px;
    background: rgba(44, 62, 80, 0.94);
    color: #ecf0f1;
    border-radius: 10px;
    padding: 12px 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    font-size: 0.85em;
    line-height: 1.5;
    pointer-events: none;
    backdrop-filter: blur(4px);
    animation: ccoFadeIn 0.15s ease-out;
    border-left: 4px solid #3498db;
}

@keyframes ccoFadeIn {
    from { opacity: 0; transform: translateX(6px); }
    to   { opacity: 1; transform: translateX(0); }
}

.chart-context-overlay .cco-row {
    margin-bottom: 3px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: baseline;
}

.chart-context-overlay .cco-row:last-child {
    margin-bottom: 0;
}

.chart-context-overlay .cco-time {
    font-family: ui-monospace, monospace;
    font-size: 1.05em;
    font-weight: 700;
    color: #3498db;
    border-bottom: 1px solid rgba(236,240,241,0.15);
    padding-bottom: 5px;
    margin-bottom: 8px;
}

.chart-context-overlay .cco-lb {
    color: #95a5a6;
    font-size: 0.9em;
    flex-shrink: 0;
}

.chart-context-overlay .cco-sep {
    color: #566573;
    margin: 0 2px;
}

.chart-context-overlay .cco-ev-row {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dotted rgba(236,240,241,0.15);
}

.chart-context-overlay #ccoEventMsg {
    color: #f39c12;
    font-weight: 600;
}

/* 반응형: 모바일에서는 상단 중앙으로 */
@media (max-width: 768px) {
    .chart-context-overlay {
        top: auto;
        bottom: 20px;
        right: 20px;
        left: 20px;
        max-width: none;
        min-width: 0;
    }
}
```

---

📄 3. P050_chart_t3_071.js — 5곳 수정

3-1. 크로스헤어 상태 + 플러그인 (신규)

eventMarkerPlugin 정의 바로 아래에 삽입:

```javascript
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
                  document.getElementById("chartContextOverlay").style.display = "none";
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
```

3-2. initChart() — crosshair hover 자동 부착

Before:

```javascript
  const initChart = (ctx, config) => {
    if (!ctx) return null;
    const c = new Chart(ctx, config);
    charts.push(c);
    attachMarkerHover(c);   // [기존] hover tooltip 리스너
    return c;
  };
```

After:

```javascript
  const initChart = (ctx, config) => {
    if (!ctx) return null;
    const c = new Chart(ctx, config);
    charts.push(c);
    attachMarkerHover(c);      // [기존] 이벤트 마커 tooltip
    attachCrosshairHover(c);   // [신규] 동기화 크로스헤어
    return c;
  };
```

3-3. hideMarkerTooltip() — crosshair 중복 렌더 방지 (선택, 무해)

수정 없음. 이미 charts.forEach(c => c && c.update("none")) 호출이 있어 함께 반영됨.

3-4. 이벤트 마커 플러그인 — 크로스헤어와 우선순위 정리

eventMarkerPlugin.afterDatasetsDraw() 내 상단 부분에 1줄 추가:

Before:

```javascript
      afterDatasetsDraw(chart) {
          if (!eventMarkersEnabled) return;
          if (!eventHistory.length) return;
```

After:

```javascript
      afterDatasetsDraw(chart) {
          if (!eventMarkersEnabled) return;
          if (!eventHistory.length) return;
          // 크로스헤어가 활성 중이면 마커는 hover/active 강조만 유지
          // (일반 마커는 그대로 그림 — 시각적 계층 유지)
```

(선택 사항이라 실제 코드 추가는 없어도 무방. 이 항목은 무시해도 됨.)

3-5. beforeunload — 오버레이 정리

기존 beforeunload 핸들러에 1줄 추가:

Before:

```javascript
    window.addEventListener("beforeunload", () => {
      if (statePollTimer) clearTimeout(statePollTimer);
      if (ws) try { ws.close(); } catch {}
      if (_markerTooltipEl && _markerTooltipEl.parentNode) {
          _markerTooltipEl.parentNode.removeChild(_markerTooltipEl);
      }
    });
```

After:

```javascript
    window.addEventListener("beforeunload", () => {
      if (statePollTimer) clearTimeout(statePollTimer);
      if (ws) try { ws.close(); } catch {}
      if (_markerTooltipEl && _markerTooltipEl.parentNode) {
          _markerTooltipEl.parentNode.removeChild(_markerTooltipEl);
      }
      if (_overlayHideTimer) clearTimeout(_overlayHideTimer);
    });
```

---

🔧 적용 순서

1. P050_chart_t3_071.html — <body> 최상단에 overlay div 삽입
2. P050_chart_t3_071.css — 파일 끝 append
3. P050_chart_t3_071.js — 5곳 수정 (실질 4곳 + 선택)
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 크로스헤어 기본 동작

1. 페이지 로드 → 8개 차트 렌더
2. 아무 차트 위에 마우스 이동
3. 기대:
   · 모든 8개 차트에 빨간 세로 점선이 동시 표시
   · 상단 삼각형 인디케이터
   · 우측 상단에 컨텍스트 오버레이 표시

B. 오버레이 내용

오버레이 예시:

```
┌─────────────────────────────┐
│ 14:32:15                    │
│ 💨 풍속 3.24 m/s · PWM 65.4% │
│ 🎨 프리셋 🌊 해변 바람 · 스타일 ⚖️ Balance │
│ ⚡ 🔥 돌풍 ·                │
│ 📍 이벤트 🎬 Override 시작  │
└─────────────────────────────┘
```

C. 동기화 정확성

1. 여러 차트 중 하나 hover
2. 기대: 모든 차트의 세로선이 동일한 X 위치 (시간축 공유)

D. 이벤트 마커 우선순위

1. 마커 근처 hover
2. 기대:
   · 크로스헤어 숨김
   · 이벤트 마커 tooltip만 표시 (기존 로직)
3. 마커에서 멀어짐
4. 기대: 크로스헤어 재등장

E. 이벤트 근처 hover

1. 마커로부터 3초 이내 위치 hover
2. 기대: 오버레이 하단에 "📍 이벤트 ..." 행 표시

F. 차트 이탈

1. 차트 밖으로 마우스 이동
2. 기대: 200ms 후 크로스헤어 + 오버레이 사라짐

G. ESC 키

1. 크로스헤어 활성 중 ESC
2. 기대: 즉시 숨김

H. 성능

1. 개발자 도구 Performance 탭
2. 마우스 빠르게 흔들기
3. 기대:
   · 60fps 유지 (requestAnimationFrame 스로틀)
   · 각 차트 update("none") 호출 확인

I. 모바일

1. 375px 뷰포트
2. 기대:
   · 오버레이가 하단으로 이동
   · 크로스헤어는 정상 동작 (터치 없음 → 표시 안됨)
   · 데스크톱 재방문 시 정상

J. 차트 접힘 상태

1. 차트 하나 접기 (헤더 클릭)
2. 다른 차트 hover
3. 기대: 접힌 차트는 크로스헤어 미표시 (canvas 숨김)

---

📊 사용자 경험

상황 이전 이후 (크로스헤어)
"이 시점 정확한 값은?" 눈대중 📌 정확한 숫자
"여러 차트 상관관계?" 각각 hover 📌 동시 표시
"돌풍 시점의 프리셋은?" 기억 📌 오버레이 표시
"이상 구간 데이터?" 스크린샷 📌 시각+값+이벤트 통합

실 사용 시나리오

시나리오 1: 상관관계 분석

자연풍에서 돌풍 발생 시 풍속이 얼마나 튀는지 확인.
차트 위 마우스 이동 → 오버레이 "3.24 m/s · PWM 65.4% · 🔥 돌풍" 한눈에.

시나리오 2: 이벤트 시점 정밀 확인

저녁 8시 AutoOff 정확히 언제? 마커 근처 hover → 오버레이 하단 "🛑 AutoOff로 정지" 표시.

시나리오 3: 프리셋 전환 효과

해변 바람 → 사막의 밤 전환 후 풍속 변화. 크로스헤어로 양쪽 비교.

시나리오 4: 이상 시점 스크린샷

문제 시점에서 크로스헤어 고정 → 8개 차트 모두 표시된 상태로 스크린샷 → 문서화.

---

🚀 다음 단계

P050 크로스헤어 완료. 남은 선택:

· (A) 크로스헤어 데이터 CSV export (현재 hover 시각 ±10초 데이터)
· (B) Round 3 검증 매뉴얼 작성
· (C) P050 요약 카드에 "실행 컨텍스트" 히스토리 미니맵
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.




P050 요약 카드 — 실행 컨텍스트 히스토리 미니맵

개요:

· 요약 카드 하단에 최근 30분 타임라인 추가
· 프리셋 이력 = 컬러 블록 (10색 팔레트)
· 이벤트 마커 = 상단 도트 (ERR/WARN/INFO 색상)
· 클릭 시 → 차트 크로스헤어 자동 이동 (기존 crosshair 연동)
· 실시간 갱신 (WS + state 폴링 시 자동)

변경 파일 3개:

# 파일 상태
1 P050_chart_t3_071.html 🔄 요약 카드 확장
2 P050_chart_t3_071.css 🔄 파일 끝 append
3 P050_chart_t3_071.js 🔄 신규 함수 3개 + 초기화

---

📄 1. P050_chart_t3_071.html — 요약 카드 확장

기존 .summary-card 섹션 내부, </div> (summary-grid 닫힘) 바로 뒤에 삽입:

Before:

```html
<section class="card summary-card col-12">
    <div class="summary-grid">
        <!-- ... 4개 summary-item ... -->
    </div>
</section>
```

After:

```html
<section class="card summary-card col-12">
    <div class="summary-grid">
        <!-- ... 기존 4개 item 유지 ... -->
    </div>

    <!-- ═══════════════════════════════════════════════════ -->
    <!-- 실행 컨텍스트 히스토리 미니맵 (신규) -->
    <!-- ═══════════════════════════════════════════════════ -->
    <div class="context-minimap-wrapper">
        <div class="cmm-header">
            <span class="cmm-label">🕒 실행 컨텍스트 (최근 30분)</span>
            <span class="cmm-hint">블록 클릭 = 차트 크로스헤어 이동</span>
        </div>

        <div class="cmm-timeline" id="cmmTimeline">
            <div class="cmm-empty">데이터 수집 중...</div>
        </div>

        <div class="cmm-axis">
            <span>-30분</span>
            <span>-20분</span>
            <span>-10분</span>
            <span>현재</span>
        </div>
    </div>
</section>
```

---

📄 2. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 실행 컨텍스트 히스토리 미니맵                                */
/* ============================================================ */

.context-minimap-wrapper {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px dotted #d6e2ed;
}

.cmm-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
    flex-wrap: wrap;
    gap: 6px;
}

.cmm-label {
    font-size: 0.85em;
    font-weight: 700;
    color: #4a637a;
}

.cmm-hint {
    font-size: 0.75em;
    color: #95a5a6;
    font-family: ui-monospace, monospace;
}

/* ── 타임라인 (블록 + 이벤트 도트) ── */
.cmm-timeline {
    position: relative;
    height: 34px;
    background: #ecf0f1;
    border-radius: 6px;
    overflow: hidden;
    cursor: crosshair;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
    user-select: none;
    transition: box-shadow 0.15s;
}

.cmm-timeline:hover {
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.12), 0 0 0 2px rgba(52,152,219,0.15);
}

.cmm-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #95a5a6;
    font-size: 0.82em;
}

/* ── 프리셋 블록 ── */
.cmm-block {
    position: absolute;
    top: 0;
    bottom: 0;
    border-right: 1px solid rgba(255,255,255,0.35);
    transition: filter 0.12s;
    cursor: pointer;
    min-width: 1px;
}

.cmm-block:last-child {
    border-right: none;
}

.cmm-block:hover {
    filter: brightness(1.18);
    z-index: 2;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.6);
}

/* ── 이벤트 도트 ── */
.cmm-event-dot {
    position: absolute;
    top: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1.5px solid #ffffff;
    box-shadow: 0 0 4px rgba(0,0,0,0.35);
    pointer-events: none;
    z-index: 3;
    transform: translateX(-50%);
}

/* ── 시간축 ── */
.cmm-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 0.7em;
    color: #95a5a6;
    font-family: ui-monospace, monospace;
    padding: 0 2px;
}

/* ── 하단 프리셋 범례 (선택: 컬러 매핑 안내) ── */
.cmm-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 8px;
    font-size: 0.75em;
    color: #566573;
}

.cmm-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.cmm-legend-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
```

---

📄 3. P050_chart_t3_071.js — 3곳 수정

3-1. 프리셋 컬러 팔레트 + 미니맵 상수 (신규)

파일 상단, DEFAULT_STYLE_NAMES 바로 아래에 삽입:

```javascript
  // ============================================================
  // 실행 컨텍스트 미니맵 상수
  // ============================================================
  const CMM_WINDOW_MS  = 30 * 60 * 1000;   // 30분 윈도우
  const CMM_UPDATE_MIN = 2000;              // 최소 갱신 간격 (ms)
  let   _cmmLastRender = 0;

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
```

3-2. 미니맵 빌드/렌더 함수 (신규)

pollState() 함수 바로 위에 삽입:

```javascript
  // ============================================================
  // 실행 컨텍스트 미니맵
  // ============================================================
  function buildContextSegments() {
      const now = Date.now();
      const minTs = now - CMM_WINDOW_MS;

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
      const minTs = now - CMM_WINDOW_MS;
      const total = now - minTs;

      const segments = buildContextSegments();

      if (!segments.length) {
          el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
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
                           title="[${ts}] ${escapeHtml(e.msg)}">
                      </div>`;
          }).join("");

      el.innerHTML = blocksHtml + eventsHtml;
  }

  function scheduleMinimapUpdate() {
      const now = Date.now();
      if (now - _cmmLastRender < CMM_UPDATE_MIN) return;
      _cmmLastRender = now;
      renderContextMinimap();
  }
```

3-3. applyStateToUi() — 미니맵 갱신 트리거

함수 끝부분, compareTimestamp 갱신 직후에 1줄 추가:

Before:

```javascript
    // 비교 테이블 timestamp
    const tsEl = document.getElementById("compareTimestamp");
    if (tsEl) {
      tsEl.textContent = `마지막 갱신: ${new Date().toLocaleTimeString("ko-KR", { hour12: false })}`;
    }
```

After:

```javascript
    // 비교 테이블 timestamp
    const tsEl = document.getElementById("compareTimestamp");
    if (tsEl) {
      tsEl.textContent = `마지막 갱신: ${new Date().toLocaleTimeString("ko-KR", { hour12: false })}`;
    }

    // [신규] 실행 컨텍스트 미니맵 갱신 (스로틀됨)
    scheduleMinimapUpdate();
```

3-4. bindEvents() — 미니맵 클릭 → 크로스헤어 이동

btnToggleMarkers 리스너 아래에 삽입:

```javascript
    // 실행 컨텍스트 미니맵 클릭 → 크로스헤어 이동
    document.getElementById("cmmTimeline")?.addEventListener("click", (e) => {
        const block = e.target.closest(".cmm-block");
        if (!block) return;

        const ts = Number(block.dataset.ts);
        if (!Number.isFinite(ts)) return;

        // 크로스헤어 설정
        _crosshairTs = ts;
        _scheduleCrosshairRender();
        _renderCrosshairOverlay(ts);

        // 차트 섹션으로 스크롤
        document.querySelector(".chart-section")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        if (window.showToast) {
            const t = new Date(ts).toLocaleTimeString("ko-KR", { hour12: false });
            window.showToast(`차트 시각 이동: ${t}`, "info");
        }
    });
```

3-5. initWebSocket 콜백 — WS 수신 시 미니맵 갱신

ws.onmessage 핸들러 내 processChartRecords(data.chart); 바로 아래:

```javascript
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
      }
    };
```

3-6. DOMContentLoaded — 초기 렌더

console.log("[ChartT3] init complete"); 바로 위:

```javascript
    // 실행 컨텍스트 미니맵 초기 렌더
    renderContextMinimap();

    // 30초마다 강제 재렌더 (윈도우 슬라이딩)
    setInterval(renderContextMinimap, 30000);
```

---

🔧 적용 순서

1. P050_chart_t3_071.html — 요약 카드에 미니맵 섹션 삽입
2. P050_chart_t3_071.css — 파일 끝 append
3. P050_chart_t3_071.js — 6곳 수정
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 초기 상태 (데이터 수집 중)

1. 페이지 로드 직후
2. 기대: 타임라인에 "데이터 수집 중..." 표시
3. WS + state 폴링 2~3회 후 블록 표시

B. 프리셋 블록 표시

1. 자연풍 모드에서 프리셋 A로 20분 → 프리셋 B로 10분
2. 기대:
   · 타임라인 좌측 2/3: 프리셋 A 색상
   · 타임라인 우측 1/3: 프리셋 B 색상
   · 각 블록 hover → title에 "프리셋명 (CODE) · 시작시각 · 지속시간"

C. 이벤트 도트

1. AutoOff 트리거 → 이벤트 발생
2. 기대:
   · 해당 시각 위치에 빨간 도트 (ERR = level 1)
   · Override 시작 → 파란 도트 (INFO)
   · 돌풍 발생 → 파란 도트 다수

D. 클릭 → 크로스헤어 이동

1. 블록 클릭
2. 기대:
   · 차트 섹션으로 부드럽게 스크롤
   · 모든 차트에 크로스헤어 표시 (해당 시각)
   · 우측 상단 컨텍스트 오버레이 표시
   · 토스트: "차트 시각 이동: 14:32:15"
3. ESC 키 → 크로스헤어 해제

E. 색상 매칭

1. 프리셋 10종 순차 실행
2. 기대: 각기 다른 색상 블록 (자연풍 테마 색과 대응)

프리셋 색상
시골 🟢 초록 (#27ae60)
지중해성 🔵 파랑 (#3498db)
해변 🔵 진파랑 (#2980b9)
산 ⚪ 회색 (#7f8c8d)
대평원 🟠 주황 (#e67e22)
항구 🔷 청록 (#16a085)
숲 🟢 연두 (#2ecc71)
도시 석양 🔴 빨강 (#e74c3c)
열대 소나기 🟣 보라 (#9b59b6)
사막의 밤 ⚫ 네이비 (#34495e)

F. 윈도우 슬라이딩

1. 5분 후 → 타임라인 좌측 1/6 부분이 새로운 블록으로 대체
2. 기대: 오래된 블록 자연스럽게 사라짐

G. 빈 데이터

1. chartPresetStyle 데이터 2개 미만
2. 기대: "데이터 수집 중..." 유지

H. 성능

1. 개발자 도구 Performance
2. WS 수신 시 → scheduleMinimapUpdate 스로틀 확인
3. 기대: 2초에 1회 이상 DOM 재생성 안 함

I. 이벤트 도트 밀집 구간

1. 자연풍 30분 대기 (돌풍 다수)
2. 기대:
   · 도트 다수 표시
   · 겹쳐도 각 도트 title은 개별 확인 가능

J. 모바일

1. 375px 뷰포트
2. 기대:
   · 타임라인 높이 34px 유지
   · 클릭 영역 정상
   · 시간축 4개 라벨 유지

---

📊 사용자 경험

상황 이전 이후 (미니맵)
"오늘 프리셋 어떻게 바뀌었지?" 기억 의존 📊 30분 타임라인
"언제 Override 했지?" 이벤트 리스트 스크롤 📍 도트 + 클릭
"이 시간대 무슨 바람?" 마커 hover 🎨 색상 블록 즉시 인지
"프리셋 전환 패턴?" 추정 📊 시각적 블록 길이
"AutoOff 몇 번?" 통계 카운트 📍 도트 밀도

실 사용 시나리오

시나리오 1: 하루 리듬 확인

저녁에 돌아와서 요약 카드 확인.
타임라인에 "🌾 시골 → 🌊 해변 → 🌌 사막의 밤 → 🛑" 흐름이 색상으로 한눈에.
스케줄이 예상대로 작동했는지 즉시 판단.

시나리오 2: 문제 구간 특정

팬이 이상하게 작동한 시점. 미니맵에서 빨간 도트 발견 → 클릭 → 차트 이동 → 해당 시각 상태 확인.

시나리오 3: 프리셋 선호도 분석

하루 동안 어떤 프리셋을 가장 오래 썼는지. 블록 폭으로 즉시 판단.

시나리오 4: 스케줄 검증

평일 오전 9시에 항구 바람 시작 확인. 미니맵에서 정확히 9시 위치에 색상 전환 확인.

---

🚀 다음 단계

P050 요약 카드 미니맵 완료. 남은 선택:

· (A) 미니맵 시간 윈도우 토글 (30분 / 1시간 / 3시간)
· (B) Round 3 검증 매뉴얼 작성
· (C) P010 메인에도 동일 미니맵 이식
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.



Part A (P050 윈도우 토글) + Part C (P010 이식)

---

📄 Part A — P050 미니맵 시간 윈도우 토글

변경 파일 3개: P050_chart_t3_071.html / .css / .js

---

📄 A-1. P050_chart_t3_071.html — 토글 버튼 + axis id

① .cmm-header 확장

Before:

```html
<div class="cmm-header">
    <span class="cmm-label">🕒 실행 컨텍스트 (최근 30분)</span>
    <span class="cmm-hint">블록 클릭 = 차트 크로스헤어 이동</span>
</div>
```

After:

```html
<div class="cmm-header">
    <span class="cmm-label" id="cmmLabel">🕒 실행 컨텍스트</span>
    <div class="cmm-right">
        <div class="cmm-window-toggle">
            <button class="btn btn-small active" data-cmm-window="30">30분</button>
            <button class="btn btn-small"        data-cmm-window="60">1시간</button>
            <button class="btn btn-small"        data-cmm-window="180">3시간</button>
        </div>
        <span class="cmm-hint">블록 클릭 = 차트 이동</span>
    </div>
</div>
```

② .cmm-axis id 부여

Before:

```html
<div class="cmm-axis">
    <span>-30분</span>
    <span>-20분</span>
    <span>-10분</span>
    <span>현재</span>
</div>
```

After:

```html
<div class="cmm-axis" id="cmmAxis">
    <span>-30분</span>
    <span>-20분</span>
    <span>-10분</span>
    <span>현재</span>
</div>
```

---

📄 A-2. P050_chart_t3_071.css — 파일 끝 append

```css
/* ============================================================ */
/* 미니맵 윈도우 토글                                            */
/* ============================================================ */

.cmm-header .cmm-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.cmm-window-toggle {
    display: inline-flex;
    gap: 3px;
    background: #f1f4f8;
    padding: 2px;
    border-radius: 6px;
    border: 1px solid #d6e2ed;
}

.cmm-window-toggle .btn-small {
    padding: 3px 10px;
    font-size: 0.78em;
    line-height: 1.2;
    border-radius: 4px;
    background: transparent;
    color: #566573;
    border: none;
    transition: all 0.15s;
}

.cmm-window-toggle .btn-small:hover {
    background: #e1ecf4;
    color: #2980b9;
}

.cmm-window-toggle .btn-small.active {
    background: #3498db;
    color: #fff;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(52,152,219,0.35);
}

@media (max-width: 600px) {
    .cmm-header {
        flex-direction: column;
        align-items: flex-start;
    }
    .cmm-header .cmm-right {
        width: 100%;
        justify-content: space-between;
        margin-top: 4px;
    }
    .cmm-header .cmm-hint {
        font-size: 0.7em;
    }
}
```

---

📄 A-3. P050_chart_t3_071.js — 3곳 수정

3-1. 상수 → 변수 전환

Before:

```javascript
  const CMM_WINDOW_MS  = 30 * 60 * 1000;   // 30분 윈도우
  const CMM_UPDATE_MIN = 2000;              // 최소 갱신 간격 (ms)
  let   _cmmLastRender = 0;
```

After:

```javascript
  const CMM_WINDOW_KEY = "snw_cmm_window";       // localStorage 키
  const CMM_UPDATE_MIN = 2000;                    // 최소 갱신 간격 (ms)
  let   _cmmLastRender = 0;

  // 시간 윈도우 (분) — localStorage 로드, 기본 30분
  let   _cmmWindowMin = Number(SNW.store.get(CMM_WINDOW_KEY, 30));
  if (![30, 60, 180].includes(_cmmWindowMin)) _cmmWindowMin = 30;

  function _cmmWindowMs() {
      return _cmmWindowMin * 60 * 1000;
  }
```

3-2. buildContextSegments() / renderContextMinimap() — _cmmWindowMs() 사용

buildContextSegments() 내:

```javascript
  function buildContextSegments() {
      const now = Date.now();
      const minTs = now - _cmmWindowMs();   // ← 함수 호출로 변경
      // ...
```

renderContextMinimap() 내:

```javascript
  function renderContextMinimap() {
      const el = document.getElementById("cmmTimeline");
      if (!el) return;

      const now = Date.now();
      const minTs = now - _cmmWindowMs();   // ← 함수 호출로 변경
      const total = now - minTs;
      // ...
```

renderContextMinimap() 끝에 axis 라벨 동적 갱신 추가:

기존 함수 끝:

```javascript
      el.innerHTML = blocksHtml + eventsHtml;
  }
```

After:

```javascript
      el.innerHTML = blocksHtml + eventsHtml;

      // [신규] 시간축 라벨 동적 갱신
      _updateCmmAxisLabels();

      // [신규] 헤더 라벨 갱신
      const labelEl = document.getElementById("cmmLabel");
      if (labelEl) {
          const w = _cmmWindowMin;
          const wStr = (w < 60) ? `${w}분` : `${w / 60}시간`;
          labelEl.textContent = `🕒 실행 컨텍스트 (최근 ${wStr})`;
      }
  }

  function _updateCmmAxisLabels() {
      const el = document.getElementById("cmmAxis");
      if (!el) return;

      const w = _cmmWindowMin;
      const labels = [];

      // 4개 라벨: -w, -2/3w, -1/3w, 현재
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
```

3-3. bindEvents() — 토글 이벤트

btnToggleMarkers 리스너 아래에 삽입:

```javascript
    // 미니맵 시간 윈도우 토글
    document.querySelectorAll("[data-cmm-window]").forEach((btn) => {
        // 초기 active 상태 반영
        const w = Number(btn.dataset.cmmWindow);
        btn.classList.toggle("active", w === _cmmWindowMin);

        btn.addEventListener("click", () => {
            const newW = Number(btn.dataset.cmmWindow);
            if (![30, 60, 180].includes(newW)) return;
            if (newW === _cmmWindowMin) return;

            _cmmWindowMin = newW;
            SNW.store.set(CMM_WINDOW_KEY, newW);

            // active 상태 갱신
            document.querySelectorAll("[data-cmm-window]").forEach((b) => {
                b.classList.toggle("active", Number(b.dataset.cmmWindow) === newW);
            });

            // 강제 재렌더
            _cmmLastRender = 0;
            renderContextMinimap();

            if (window.showToast) {
                const wStr = (newW < 60) ? `${newW}분` : `${newW / 60}시간`;
                window.showToast(`미니맵 윈도우: ${wStr}`, "info");
            }
        });
    });
```

3-4. DOMContentLoaded — 초기 렌더에 토글 상태 반영

기존 renderContextMinimap(); 호출 유지 → 내부에서 axis 라벨까지 자동 갱신됨.

---

✅ P050 검증

시나리오 기대
페이지 로드 30분 기본, 버튼 "30분" active
"1시간" 클릭 라벨 "최근 1시간", 블록 밀도 절반, axis "-1시간 / -40분 / -20분 / 현재"
"3시간" 클릭 라벨 "최근 3시간", axis "-3시간 / -2시간 / -1시간 / 현재"
F5 새로고침 선택된 윈도우 유지
localStorage snw_cmm_window = 60 (또는 180)
블록 클릭 크로스헤어 이동 (기존 동작 유지)

---

📄 Part C — P010 메인에 미니맵 이식

차이점:

· P010은 chart 버퍼가 없음 → 프리셋 이력은 로컬 버퍼에 직접 기록
· WS state 수신 시 프리셋 변경 감지 → 버퍼 push
· 이벤트 히스토리는 P010에 이미 존재 → 도트 재사용
· 윈도우 토글 동일하게 지원

변경 파일 3개: P010_main_071.html / .css / .js

---

📄 C-1. P010_main_071.html — 새 섹션

<!-- 2-1. 최근 이벤트 히스토리 (#14) --> 섹션 바로 위에 삽입:

```html
<!-- 2-0. 실행 컨텍스트 미니맵 (신규) -->
<section class="card col-12">
    <div class="row middle">
        <strong class="section-title" id="cmmLabel">🕒 실행 컨텍스트</strong>
        <div class="right tight">
            <div class="cmm-window-toggle">
                <button class="btn btn-small active" data-cmm-window="30">30분</button>
                <button class="btn btn-small"        data-cmm-window="60">1시간</button>
                <button class="btn btn-small"        data-cmm-window="180">3시간</button>
            </div>
        </div>
    </div>

    <div class="cmm-timeline" id="cmmTimeline">
        <div class="cmm-empty">데이터 수집 중...</div>
    </div>

    <div class="cmm-axis" id="cmmAxis">
        <span>-30분</span>
        <span>-20분</span>
        <span>-10분</span>
        <span>현재</span>
    </div>

    <p class="muted cmm-note">
        ※ 프리셋 변경 이력은 페이지 로드 이후부터 수집됩니다.
    </p>
</section>
```

---

📄 C-2. P010_main_071.css — 파일 끝 append

```css
/* ============================================================ */
/* 실행 컨텍스트 미니맵 (P010)                                  */
/* ============================================================ */

.cmm-window-toggle {
    display: inline-flex;
    gap: 3px;
    background: #f1f4f8;
    padding: 2px;
    border-radius: 6px;
    border: 1px solid #d6e2ed;
}

.cmm-window-toggle .btn-small {
    padding: 3px 10px;
    font-size: 0.78em;
    line-height: 1.2;
    border-radius: 4px;
    background: transparent;
    color: #566573;
    border: none;
    transition: all 0.15s;
}
.cmm-window-toggle .btn-small:hover {
    background: #e1ecf4;
    color: #2980b9;
}
.cmm-window-toggle .btn-small.active {
    background: #3498db;
    color: #fff;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(52,152,219,0.35);
}

/* ── 타임라인 ── */
.cmm-timeline {
    position: relative;
    height: 34px;
    background: #ecf0f1;
    border-radius: 6px;
    overflow: hidden;
    cursor: crosshair;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
    user-select: none;
    margin-top: 10px;
    transition: box-shadow 0.15s;
}
.cmm-timeline:hover {
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.12), 0 0 0 2px rgba(52,152,219,0.15);
}
.cmm-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #95a5a6;
    font-size: 0.82em;
}

/* ── 프리셋 블록 ── */
.cmm-block {
    position: absolute;
    top: 0;
    bottom: 0;
    border-right: 1px solid rgba(255,255,255,0.35);
    transition: filter 0.12s;
    cursor: pointer;
    min-width: 1px;
}
.cmm-block:last-child { border-right: none; }
.cmm-block:hover {
    filter: brightness(1.18);
    z-index: 2;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.6);
}

/* ── 이벤트 도트 ── */
.cmm-event-dot {
    position: absolute;
    top: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1.5px solid #ffffff;
    box-shadow: 0 0 4px rgba(0,0,0,0.35);
    pointer-events: none;
    z-index: 3;
    transform: translateX(-50%);
}

/* ── 시간축 ── */
.cmm-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 0.7em;
    color: #95a5a6;
    font-family: ui-monospace, monospace;
    padding: 0 2px;
}

.cmm-note {
    margin-top: 8px;
    font-size: 0.78em;
    text-align: right;
}

/* ── 모바일 ── */
@media (max-width: 600px) {
    .cmm-window-toggle .btn-small {
        padding: 2px 7px;
        font-size: 0.72em;
    }
}
```

---

📄 C-3. P010_main_071.js — 로컬 프리셋 이력 버퍼 + 미니맵

3-1. 상수/버퍼 (신규) — P010_core.js에 삽입

SNW.P010.core 정의 내부, C.state 바로 아래에 삽입:

```javascript
// ============================================================
// 실행 컨텍스트 미니맵 (P010 로컬 추적)
// ============================================================
const CMM_WINDOW_KEY = "snw_cmm_window";
const CMM_HISTORY_MAX = 300;    // 프리셋 이력 최대 개수

let   _cmmWindowMin = Number(SNW.store.get(CMM_WINDOW_KEY, 30));
if (![30, 60, 180].includes(_cmmWindowMin)) _cmmWindowMin = 30;

C.state.presetHistory = [];     // [{ ts, code, name }]

// 프리셋 10색 팔레트
C.PRESET_COLORS = [
    "#27ae60", "#3498db", "#2980b9", "#7f8c8d", "#e67e22",
    "#16a085", "#2ecc71", "#e74c3c", "#9b59b6", "#34495e",
];

C.EVENT_DOT_COLORS = {
    1: "#e74c3c",   // ERR
    2: "#f39c12",   // WARN
    3: "#3498db",   // INFO
    4: "#95a5a6",   // DEBUG
};

C._cmmWindowMs = () => _cmmWindowMin * 60 * 1000;
C._getCmmWindowMin = () => _cmmWindowMin;
C._setCmmWindowMin = (v) => { _cmmWindowMin = v; };

// ── 프리셋 이력 기록 ──
C.recordPresetHistory = (code) => {
    if (!code) return;
    const hist = C.state.presetHistory;
    const last = hist[hist.length - 1];
    if (last && last.code === code) return;   // 변경 없음 → 무시

    const preset = C.state.windDictPresets.find(p => p.code === code);
    hist.push({
        ts: Date.now(),
        code: code,
        name: preset ? (preset.name || code) : code,
    });
    if (hist.length > CMM_HISTORY_MAX) hist.shift();

    // 즉시 렌더 트리거 (P010_misc에서 처리)
    if (SNW.P010.misc && SNW.P010.misc.scheduleMinimapUpdate) {
        SNW.P010.misc.scheduleMinimapUpdate();
    }
};

// ── 프리셋 컬러 조회 ──
C.getPresetColor = (code) => {
    const idx = C.state.windDictPresets.findIndex(p => p.code === code);
    const safeIdx = (idx >= 0) ? idx : 0;
    return C.PRESET_COLORS[safeIdx % C.PRESET_COLORS.length];
};
```

3-2. _applySimToUi() — 프리셋 이력 기록 훅

P010_core.js의 _applySimToUi() 함수 내, 폼 동기화 부분 바로 아래에 삽입:

Before:

```javascript
    // 폼 동기화 (dirty 아닐 때)
    if (!C.state.configDirty) {
        if (C.el.preset() && sim.presetCode) C.el.preset().value = sim.presetCode;
        if (C.el.style()  && sim.styleCode)  C.el.style().value  = sim.styleCode;
        if (C.el.fanPower() && sim.fanPowerEnabled !== undefined) C.el.fanPower().checked = !!sim.fanPowerEnabled;
    }
```

After:

```javascript
    // 폼 동기화 (dirty 아닐 때)
    if (!C.state.configDirty) {
        if (C.el.preset() && sim.presetCode) C.el.preset().value = sim.presetCode;
        if (C.el.style()  && sim.styleCode)  C.el.style().value  = sim.styleCode;
        if (C.el.fanPower() && sim.fanPowerEnabled !== undefined) C.el.fanPower().checked = !!sim.fanPowerEnabled;
    }

    // [신규] 프리셋 이력 기록 (변경 시점만 push됨)
    if (sim.presetCode) {
        C.recordPresetHistory(sim.presetCode);
    }
```

3-3. 미니맵 렌더 함수 — P010_misc.js에 추가

P010_misc.js 상단의 M.renderEventHistory 아래에 삽입:

```javascript
// ============================================================
// 실행 컨텍스트 미니맵 렌더
// ============================================================
const CMM_UPDATE_MIN = 2000;
let   _cmmLastRender = 0;

M.scheduleMinimapUpdate = () => {
    const now = Date.now();
    if (now - _cmmLastRender < CMM_UPDATE_MIN) return;
    _cmmLastRender = now;
    M.renderContextMinimap();
};

M.renderContextMinimap = () => {
    const el = document.getElementById("cmmTimeline");
    if (!el) return;

    const now = Date.now();
    const windowMs = C._cmmWindowMs();
    const minTs = now - windowMs;
    const total = now - minTs;

    const hist = C.state.presetHistory || [];

    // ── 이력 없음 ──
    if (hist.length === 0) {
        el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
        M._updateCmmAxisLabels();
        M._updateCmmLabel();
        return;
    }

    // ── 세그먼트 생성 (윈도우 내) ──
    // hist는 변경 시점만 저장 → 각 세그먼트는 [ts_i, ts_{i+1}) 구간
    const visible = hist.filter(h => h.ts <= now);   // 미래 데이터 없음

    const segments = [];
    for (let i = 0; i < visible.length; i++) {
        const start = Math.max(visible[i].ts, minTs);
        const end = (i + 1 < visible.length) ? visible[i + 1].ts : now;
        const clippedEnd = Math.min(end, now);
        if (clippedEnd <= start) continue;   // 윈도우 밖
        segments.push({
            start,
            end: clippedEnd,
            code: visible[i].code,
            name: visible[i].name,
        });
    }

    if (segments.length === 0) {
        el.innerHTML = '<div class="cmm-empty">현재 윈도우 내 이력 없음</div>';
        M._updateCmmAxisLabels();
        M._updateCmmLabel();
        return;
    }

    // ── 블록 HTML ──
    const blocksHtml = segments.map((seg) => {
        const left  = ((seg.start - minTs) / total) * 100;
        const width = ((seg.end - seg.start) / total) * 100;
        const color = C.getPresetColor(seg.code);
        const durMin = Math.max(1, Math.round((seg.end - seg.start) / 60000));
        const startStr = new Date(seg.start).toLocaleTimeString("ko-KR", { hour12: false });
        return `<div class="cmm-block"
                     style="left:${left.toFixed(3)}%; width:${Math.max(width, 0.15).toFixed(3)}%; background:${color};"
                     data-ts="${Math.floor((seg.start + seg.end) / 2)}"
                     title="${seg.name} (${seg.code}) · ${startStr} · ${durMin}분">
                </div>`;
    }).join("");

    // ── 이벤트 도트 (P010 이벤트 히스토리 재사용) ──
    const eventsHtml = (C.state.eventHistory || [])
        .filter(e => e.ts >= minTs && e.ts <= now)
        .map((e) => {
            const left = ((e.ts - minTs) / total) * 100;
            const color = C.EVENT_DOT_COLORS[e.level] || C.EVENT_DOT_COLORS[3];
            const ts = new Date(e.ts).toLocaleTimeString("ko-KR", { hour12: false });
            return `<div class="cmm-event-dot"
                         style="left:${left.toFixed(3)}%; background:${color};"
                         title="[${ts}] ${M._escapeHtml(e.msg)}">
                    </div>`;
        }).join("");

    el.innerHTML = blocksHtml + eventsHtml;

    M._updateCmmAxisLabels();
    M._updateCmmLabel();
};

M._updateCmmLabel = () => {
    const el = document.getElementById("cmmLabel");
    if (!el) return;
    const w = C._getCmmWindowMin();
    const wStr = (w < 60) ? `${w}분` : `${w / 60}시간`;
    el.textContent = `🕒 실행 컨텍스트 (최근 ${wStr})`;
};

M._updateCmmAxisLabels = () => {
    const el = document.getElementById("cmmAxis");
    if (!el) return;
    const w = C._getCmmWindowMin();
    const marks = [w, Math.round(w * 2 / 3), Math.round(w * 1 / 3), 0];
    const labels = marks.map((m) => {
        if (m === 0) return "현재";
        if (m < 60) return `-${m}분`;
        const h = m / 60;
        return Number.isInteger(h) ? `-${h}시간` : `-${m}분`;
    });
    el.innerHTML = labels.map(t => `<span>${t}</span>`).join("");
};

M._escapeHtml = (str) => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

// ============================================================
// 미니맵 클릭 → (P010은 크로스헤어가 없으므로 시각 안내만)
// ============================================================
M.initMinimapClick = () => {
    document.getElementById("cmmTimeline")?.addEventListener("click", (e) => {
        const block = e.target.closest(".cmm-block");
        if (!block) return;
        const ts = Number(block.dataset.ts);
        if (!Number.isFinite(ts)) return;
        const t = new Date(ts).toLocaleTimeString("ko-KR", { hour12: false });
        SNW.toast(`해당 시각: ${t}`, "info");
    });
};
```

3-4. bindEvents() — 윈도우 토글 이벤트

P010_main_071.js의 bindEvents() 내 btnClearEvents 리스너 아래에 삽입:

```javascript
    // 실행 컨텍스트 미니맵 토글
    document.querySelectorAll("[data-cmm-window]").forEach((btn) => {
        const w = Number(btn.dataset.cmmWindow);
        btn.classList.toggle("active", w === C._getCmmWindowMin());

        btn.addEventListener("click", () => {
            const newW = Number(btn.dataset.cmmWindow);
            if (![30, 60, 180].includes(newW)) return;
            if (newW === C._getCmmWindowMin()) return;

            C._setCmmWindowMin(newW);
            SNW.store.set("snw_cmm_window", newW);

            document.querySelectorAll("[data-cmm-window]").forEach((b) => {
                b.classList.toggle("active", Number(b.dataset.cmmWindow) === newW);
            });

            M._cmmLastRender = 0;
            M.renderContextMinimap();

            const wStr = (newW < 60) ? `${newW}분` : `${newW / 60}시간`;
            SNW.toast(`미니맵 윈도우: ${wStr}`, "info");
        });
    });
```

3-5. DOMContentLoaded — 초기화

P010_main_071.js의 DOMContentLoaded 내 renderEventHistory(); 아래에 삽입:

```javascript
    // 실행 컨텍스트 미니맵 초기화
    M.renderContextMinimap();
    M.initMinimapClick();

    // 30초마다 재렌더 (윈도우 슬라이딩 반영)
    setInterval(() => {
        M._cmmLastRender = 0;
        M.renderContextMinimap();
    }, 30000);
```

---

🔧 적용 순서

Part A (P050)

1. P050_chart_t3_071.html — 토글 버튼 + axis id
2. P050_chart_t3_071.css — append
3. P050_chart_t3_071.js — 상수→변수 + axis 갱신 + 토글 이벤트

Part C (P010)

4. P010_main_071.html — 새 섹션 삽입
5. P010_main_071.css — append
6. P010_core.js — 이력 버퍼 + 훅
7. P010_misc.js — 렌더 함수
8. P010_main_071.js — 토글 이벤트 + 초기화

공통

9. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 통합 검증 시나리오

A. P050 윈도우 토글

동작 기대
초기 로드 "30분" active, 30분 데이터 표시
"1시간" 클릭 축 라벨 "−1시간/−40분/−20분/현재", 1시간 데이터
"3시간" 클릭 축 "−3시간/−2시간/−1시간/현재"
F5 선택 유지 (localStorage)
클릭 시 토스트 표시

B. P010 미니맵

동작 기대
페이지 로드 "데이터 수집 중..."
프리셋 선택 후 대기 블록 표시 (해당 프리셋 색상)
프리셋 변경 기존 블록 종료 + 새 블록 시작
Override 시작 파란 이벤트 도트
AutoOff 빨간 도트
블록 클릭 토스트 "해당 시각: 14:32:15"
윈도우 토글 동일 (30/60/180)

C. 상호 운용성

시나리오 기대
P010에서 프리셋 A → B → A 순차 변경 타임라인에 3개 블록
P050과 P010 동시 열기 두 페이지 모두 미니맵 정상 (P050은 chart 데이터, P010은 로컬 버퍼)
localStorage 공유 두 페이지가 snw_cmm_window 공유

D. 페이지 로드 이후 데이터 없음

· 새 페이지 로드 직후 → "데이터 수집 중..."
· 첫 프리셋 수신 → 1개 블록 (전체 폭)

E. 이력 부족

· 프리셋 변경 1번만 → 블록 1개 (그 시점부터 현재까지)
· 그 이전 시간은 빈 배경

---

📊 사용자 경험 (P050 + P010 통합)

상황 P050 P010
프리셋 이력 확인 ✅ 차트 데이터 기반 ✅ 로컬 버퍼 기반
이벤트 시각화 ✅ WS + 이벤트 ✅ 이벤트
윈도우 토글 ✅ 30/60/180 ✅ 30/60/180
크로스헤어 이동 ✅ 클릭 → 차트 ❌ 토스트만
데이터 소스 S10 chart 버퍼 로컬 이력

P050 = 분석용 (차트 + 이력)
P010 = 관제용 (상태 + 이력)

두 페이지가 동일한 UI 언어로 실행 컨텍스트를 보여줌.

---

🚀 다음 단계

Part A + C 완료. 남은 선택:

· (A) P010 미니맵 클릭 → 해당 시각 이벤트 강조 (cross-link)
· (B) Round 3 검증 매뉴얼 작성
· (C) P010 요약 카드에 프리셋 이력 통계 (총 사용 시간 top 3)
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.



Part A (미니맵 클릭 → 이벤트 강조) + Part C (프리셋 이력 통계)

개요:

· Part A: P010 미니맵 블록 클릭 시 → 해당 시각 ±10초 이벤트를 이벤트 리스트에서 자동 스크롤 + 플래시
· Part C: 요약 카드에 프리셋별 사용 시간 Top 3 (오늘 / 30분 / 1시간 / 3시간 윈도우 연동)

변경 파일 3개:

# 파일 상태
1 P010_main_071.html 🔄 통계 카드 추가
2 P010_main_071.css 🔄 파일 끝 append
3 P010_misc.js 🔄 신규 함수 3개
4 P010_main_071.js 🔄 이벤트 바인딩 확장 + 초기화

---

📄 Part A — 미니맵 클릭 → 이벤트 리스트 강조

📄 A-1. P010_misc.js — 클릭 핸들러 확장

M.initMinimapClick 함수 전체 교체:

Before:

```javascript
M.initMinimapClick = () => {
    document.getElementById("cmmTimeline")?.addEventListener("click", (e) => {
        const block = e.target.closest(".cmm-block");
        if (!block) return;
        const ts = Number(block.dataset.ts);
        if (!Number.isFinite(ts)) return;
        const t = new Date(ts).toLocaleTimeString("ko-KR", { hour12: false });
        SNW.toast(`해당 시각: ${t}`, "info");
    });
};
```

After:

```javascript
M.initMinimapClick = () => {
    document.getElementById("cmmTimeline")?.addEventListener("click", (e) => {
        const block = e.target.closest(".cmm-block");
        if (!block) return;
        const ts = Number(block.dataset.ts);
        if (!Number.isFinite(ts)) return;

        const t = new Date(ts).toLocaleTimeString("ko-KR", { hour12: false });

        // [신규] 해당 시각 ±10초 이벤트를 이벤트 리스트에서 강조
        const hitEvent = M._findNearestEvent(ts, 10000);   // ±10초

        if (hitEvent) {
            // 이벤트 히스토리 섹션으로 스크롤
            document.getElementById("eventHistory")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            // 500ms 후 (스크롤 완료 시점) 이벤트 행 강조
            setTimeout(() => {
                M._highlightEventRow(hitEvent);
            }, 400);

            SNW.toast(`📌 ${t} · 이벤트: ${hitEvent.msg.substring(0, 30)}`, "info");
        } else {
            // 근처 이벤트 없음 → 프리셋 정보만 토스트
            const durMin = Number(block.title.match(/(\d+)분/)?.[1]) || 0;
            SNW.toast(`🕐 ${t} · ${durMin}분 구간 (근처 이벤트 없음)`, "info");
        }
    });
};

// ═══════════════════════════════════════════════════════════
// 이벤트 조회 + 강조 헬퍼
// ═══════════════════════════════════════════════════════════
M._findNearestEvent = (ts, toleranceMs = 10000) => {
    const hist = C.state.eventHistory || [];
    if (!hist.length) return null;

    let best = null;
    let bestD = toleranceMs;
    hist.forEach((e) => {
        const d = Math.abs(e.ts - ts);
        if (d < bestD) { bestD = d; best = e; }
    });
    return best;
};

M._highlightEventRow = (evt) => {
    if (!evt || !evt.ts) return;

    // 이벤트 리스트의 각 행을 순회하며 매칭
    const rows = document.querySelectorAll("#eventHistory .event-line");
    if (!rows.length) return;

    // 이벤트 리스트는 renderEventHistory()가 재생성됨
    // 기존 행에는 ts가 없으므로, index 기반 매칭
    // → 이벤트 히스토리 배열은 최신이 앞(index 0)
    const idx = C.state.eventHistory.indexOf(evt);
    if (idx < 0 || idx >= rows.length) return;

    const target = rows[idx];
    if (!target) return;

    // 이전 강조 제거
    document.querySelectorAll("#eventHistory .event-line.evt-highlight")
        .forEach(r => r.classList.remove("evt-highlight"));

    // 강조 적용
    target.classList.add("evt-highlight");

    // 3초 후 자동 제거
    setTimeout(() => {
        target.classList.remove("evt-highlight");
    }, 3000);
};
```

📄 A-2. P010_main_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 이벤트 리스트 강조 (미니맵 클릭 시)                          */
/* ============================================================ */

.event-line.evt-highlight {
    background-color: #fff8e1;
    box-shadow: inset 4px 0 0 #f39c12;
    animation: evtHighlightPulse 1.5s ease-out 2;
    border-radius: 4px;
}

@keyframes evtHighlightPulse {
    0%   { background-color: #ffe082; box-shadow: inset 4px 0 0 #e67e22; }
    50%  { background-color: #fff3b0; box-shadow: inset 4px 0 0 #f39c12; }
    100% { background-color: #fff8e1; box-shadow: inset 4px 0 0 #f39c12; }
}
```

---

📄 Part C — 프리셋 이력 통계 (Top 3)

📄 C-1. P010_main_071.html — 통계 카드 삽입

<!-- 2-0. 실행 컨텍스트 미니맵 (신규) --> 섹션 바로 뒤에 삽입:

```html
<!-- 2-0-1. 프리셋 이력 통계 (신규) -->
<section class="card col-12">
    <div class="row middle">
        <strong class="section-title">📊 프리셋 사용 통계</strong>
        <div class="right tight">
            <span id="cmmStatWindow" class="info-label info">최근 30분</span>
        </div>
    </div>

    <div class="cmm-stats-grid" id="cmmStatsGrid">
        <div class="cmm-stat-empty">데이터 수집 중...</div>
    </div>
</section>
```

📄 C-2. P010_main_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 프리셋 이력 통계                                              */
/* ============================================================ */

.cmm-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 10px;
}

@media (max-width: 600px) {
    .cmm-stats-grid { grid-template-columns: 1fr; }
}

.cmm-stat-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
    color: #95a5a6;
    font-size: 0.85em;
}

.cmm-stat-card {
    padding: 12px 14px;
    background: #ffffff;
    border-radius: 8px;
    border-left: 5px solid #3498db;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: transform 0.15s, box-shadow 0.15s;
}

.cmm-stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}

.cmm-stat-rank {
    display: inline-block;
    font-size: 0.75em;
    font-weight: 700;
    color: #ffffff;
    background: #34495e;
    padding: 1px 7px;
    border-radius: 10px;
    margin-bottom: 6px;
}

.cmm-stat-card.rank-1 .cmm-stat-rank { background: #d4a017; }
.cmm-stat-card.rank-2 .cmm-stat-rank { background: #7f8c8d; }
.cmm-stat-card.rank-3 .cmm-stat-rank { background: #b87333; }

.cmm-stat-name {
    font-size: 1.05em;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 4px;
    word-break: keep-all;
}

.cmm-stat-code {
    font-family: ui-monospace, monospace;
    font-size: 0.8em;
    color: #7f8c8d;
    margin-bottom: 8px;
}

.cmm-stat-bar-wrap {
    height: 6px;
    background: #ecf0f1;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
}

.cmm-stat-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease-out;
}

.cmm-stat-duration {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.8em;
}

.cmm-stat-duration .dur-value {
    font-weight: 700;
    color: #2c3e50;
    font-family: ui-monospace, monospace;
}

.cmm-stat-duration .dur-pct {
    color: #95a5a6;
    font-family: ui-monospace, monospace;
}
```

📄 C-3. P010_misc.js — 통계 계산/렌더 함수

M._highlightEventRow 함수 바로 아래에 삽입:

```javascript
// ============================================================
// 프리셋 이력 통계 (Top 3)
// ============================================================
M.renderPresetStats = () => {
    const el = document.getElementById("cmmStatsGrid");
    const winEl = document.getElementById("cmmStatWindow");
    if (!el) return;

    const now = Date.now();
    const windowMs = C._cmmWindowMs();
    const minTs = now - windowMs;

    // 윈도우 라벨 갱신
    if (winEl) {
        const w = C._getCmmWindowMin();
        const wStr = (w < 60) ? `최근 ${w}분` : `최근 ${w / 60}시간`;
        winEl.textContent = wStr;
    }

    const hist = C.state.presetHistory || [];
    if (hist.length === 0) {
        el.innerHTML = '<div class="cmm-stat-empty">데이터 수집 중...</div>';
        return;
    }

    // ── 각 프리셋별 사용 시간 누적 ──
    const durations = {};   // code → ms
    for (let i = 0; i < hist.length; i++) {
        const start = Math.max(hist[i].ts, minTs);
        const end = (i + 1 < hist.length) ? Math.min(hist[i + 1].ts, now) : now;
        if (end <= start) continue;
        const code = hist[i].code;
        durations[code] = (durations[code] || 0) + (end - start);
    }

    // ── Top 3 정렬 ──
    const entries = Object.entries(durations)
        .map(([code, ms]) => {
            const preset = C.state.windDictPresets.find(p => p.code === code);
            return {
                code,
                ms,
                name: preset ? (preset.name || code) : code,
                color: C.getPresetColor(code),
            };
        })
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 3);

    if (entries.length === 0) {
        el.innerHTML = '<div class="cmm-stat-empty">현재 윈도우 내 이력 없음</div>';
        return;
    }

    const totalMs = entries.reduce((s, e) => s + e.ms, 0);
    const maxMs = entries[0].ms;
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
};
```

📄 C-4. P010_misc.js — renderContextMinimap()에서 통계도 함께 갱신

M.renderContextMinimap() 함수 끝부분(M._updateCmmLabel(); 호출 뒤) 수정:

Before:

```javascript
    el.innerHTML = blocksHtml + eventsHtml;

    M._updateCmmAxisLabels();
    M._updateCmmLabel();
};
```

After:

```javascript
    el.innerHTML = blocksHtml + eventsHtml;

    M._updateCmmAxisLabels();
    M._updateCmmLabel();
    M.renderPresetStats();   // [신규] 통계도 함께 갱신
};
```

또한 renderContextMinimap()의 조기 return 경로 3곳에도 통계 갱신 추가:

경로 1 (이력 없음):

```javascript
    if (hist.length === 0) {
        el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
        M._updateCmmAxisLabels();
        M._updateCmmLabel();
        M.renderPresetStats();   // [신규]
        return;
    }
```

경로 2 (세그먼트 없음):

```javascript
    if (segments.length === 0) {
        el.innerHTML = '<div class="cmm-empty">현재 윈도우 내 이력 없음</div>';
        M._updateCmmAxisLabels();
        M._updateCmmLabel();
        M.renderPresetStats();   // [신규]
        return;
    }
```

📄 C-5. P010_main_071.js — DOMContentLoaded 확장

M.renderContextMinimap(); 아래에 1줄 추가:

Before:

```javascript
    // 실행 컨텍스트 미니맵 초기화
    M.renderContextMinimap();
    M.initMinimapClick();

    // 30초마다 재렌더 (윈도우 슬라이딩 반영)
    setInterval(() => {
        M._cmmLastRender = 0;
        M.renderContextMinimap();
    }, 30000);
```

After:

```javascript
    // 실행 컨텍스트 미니맵 초기화
    M.renderContextMinimap();
    M.initMinimapClick();

    // 프리셋 통계 초기 렌더
    M.renderPresetStats();

    // 30초마다 재렌더 (윈도우 슬라이딩 반영)
    setInterval(() => {
        M._cmmLastRender = 0;
        M.renderContextMinimap();
        M.renderPresetStats();
    }, 30000);
```

---

🔧 적용 순서

Part A (미니맵 클릭 → 이벤트 강조)

1. P010_misc.js — initMinimapClick 교체 + 헬퍼 2개 추가
2. P010_main_071.css — .evt-highlight 스타일 append

Part C (프리셋 통계)

3. P010_main_071.html — 통계 카드 섹션 삽입
4. P010_main_071.css — 통계 카드 스타일 append
5. P010_misc.js — renderPresetStats 함수 + renderContextMinimap 확장
6. P010_main_071.js — 초기 렌더 추가

공통

7. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

Part A

# 시나리오 기대
1 미니맵 블록 클릭 (이벤트 근처) 이벤트 히스토리 섹션으로 스크롤 + 해당 행 플래시 (2회 pulse, 노랑 배경)
2 미니맵 블록 클릭 (이벤트 없음) 토스트만 (프리셋 구간 안내)
3 다른 블록 연속 클릭 이전 하이라이트 자동 해제 → 새 하이라이트
4 3초 후 하이라이트 자동 해제
5 이벤트 리스트가 빈 경우 근처 이벤트 없음 → 토스트만

Part C

# 시나리오 기대
1 초기 (이력 없음) "데이터 수집 중..."
2 프리셋 A → B → A 순차 사용 Top 3: A (60%), B (40%)
3 30분 윈도우 최근 30분만 집계
4 "1시간" 토글 1시간 데이터로 재집계
5 프리셋 4종 이상 사용 상위 3개만 표시
6 카드 hover 살짝 떠오름 (translateY -1px)
7 순위 🥇 금색, 🥈 은색, 🥉 동색
8 진행 바 1위 기준 상대 너비 (1위 = 100%)
9 퍼센트 Top 3 합계 기준 백분율

통합 시나리오

시나리오: 하루 마무리

1. 저녁에 P010 접속
2. 통계 카드: 🥇 해변 바람 45분 (55%) · 🥈 숲 그늘 25분 (30%) · 🥉 사막의 밤 12분 (15%)
3. 미니맵: 파랑(해변) → 초록(숲) → 네이비(사막) 블록 순서 확인
4. 빨간 도트: 저녁 6시 근처 (AutoOff 발생)
5. 빨간 도트 근처 블록 클릭:
   · 이벤트 히스토리로 자동 스크롤
   · "🛑 AutoOff로 정지" 행 강조 (노란 배경 + 주황 바 + pulse)
6. "1시간" 토글:
   · 통계 카드가 최근 1시간 기준으로 재집계

---

📊 사용자 경험 통합

상황 이전 Part A 추가 Part C 추가
"이 시각 무슨 이벤트?" 미니맵 블록만 📌 이벤트 자동 강조 —
"오늘 뭐 많이 썼지?" 없음 — 🥇🥈🥉 즉시 확인
"프리셋 사용 비율?" 없음 — 📊 % + 진행 바
"문제 시점 특정?" 수동 스크롤 📌 자동 이동 + 플래시 —
"윈도우별 비교?" 토글 (30/60/180) — ✅ 통계도 자동 재집계

P010 = 완전한 실행 관제 대시보드

---

🚀 다음 단계

Part A + C 완료. 남은 선택:

· (A) P050에도 프리셋 통계 이식 (동일 UI, chart 데이터 기반)
· (B) Round 3 검증 매뉴얼 작성
· (C) 프리셋 이력 데이터 CSV export
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.


P050 미니맵 — 프리셋 사용 통계 이식

개요:

· P010과 동일한 UI (🥇🥈🥉 Top 3 카드)
· 데이터 소스: chartPresetStyle 차트 버퍼 (백엔드 무변경)
· 미니맵 바로 아래 통합 배치
· 윈도우 토글 (30분 / 1시간 / 3시간) 연동 → 통계도 자동 재집계

변경 파일 3개:

# 파일 상태
1 P050_chart_t3_071.html 🔄 요약 카드에 통계 wrapper 추가
2 P050_chart_t3_071.css 🔄 파일 끝 append
3 P050_chart_t3_071.js 🔄 renderPresetStats() 신규 + 호출 연결

---

📄 1. P050_chart_t3_071.html — 요약 카드 확장

.cmm-axis 바로 뒤, .context-minimap-wrapper 닫힘 태그 앞에 삽입:

Before:

```html
        <div class="cmm-axis" id="cmmAxis">
            <span>-30분</span>
            <span>-20분</span>
            <span>-10분</span>
            <span>현재</span>
        </div>
    </div>
</section>
```

After:

```html
        <div class="cmm-axis" id="cmmAxis">
            <span>-30분</span>
            <span>-20분</span>
            <span>-10분</span>
            <span>현재</span>
        </div>

        <!-- ═══════════════════════════════════════════════════ -->
        <!-- 프리셋 사용 통계 (신규) -->
        <!-- ═══════════════════════════════════════════════════ -->
        <div class="cmm-stats-wrapper">
            <div class="cmm-stats-header">
                <span class="cmm-label">📊 프리셋 사용 통계</span>
                <span id="cmmStatWindow" class="info-label info">최근 30분</span>
            </div>
            <div class="cmm-stats-grid" id="cmmStatsGrid">
                <div class="cmm-stat-empty">데이터 수집 중...</div>
            </div>
        </div>
    </div>
</section>
```

---

📄 2. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 프리셋 사용 통계 (P050)                                      */
/* ============================================================ */

.cmm-stats-wrapper {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px dotted #d6e2ed;
}

.cmm-stats-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 6px;
}

.cmm-stats-header .cmm-label {
    font-size: 0.85em;
    font-weight: 700;
    color: #4a637a;
}

.cmm-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

@media (max-width: 600px) {
    .cmm-stats-grid { grid-template-columns: 1fr; }
}

.cmm-stat-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 20px;
    color: #95a5a6;
    font-size: 0.85em;
}

.cmm-stat-card {
    padding: 12px 14px;
    background: #ffffff;
    border-radius: 8px;
    border-left: 5px solid #3498db;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: transform 0.15s, box-shadow 0.15s;
}

.cmm-stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}

.cmm-stat-rank {
    display: inline-block;
    font-size: 0.75em;
    font-weight: 700;
    color: #ffffff;
    background: #34495e;
    padding: 1px 7px;
    border-radius: 10px;
    margin-bottom: 6px;
}

.cmm-stat-card.rank-1 .cmm-stat-rank { background: #d4a017; }
.cmm-stat-card.rank-2 .cmm-stat-rank { background: #7f8c8d; }
.cmm-stat-card.rank-3 .cmm-stat-rank { background: #b87333; }

.cmm-stat-name {
    font-size: 1.05em;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 4px;
    word-break: keep-all;
}

.cmm-stat-code {
    font-family: ui-monospace, monospace;
    font-size: 0.8em;
    color: #7f8c8d;
    margin-bottom: 8px;
}

.cmm-stat-bar-wrap {
    height: 6px;
    background: #ecf0f1;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
}

.cmm-stat-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease-out;
}

.cmm-stat-duration {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 0.8em;
}

.cmm-stat-duration .dur-value {
    font-weight: 700;
    color: #2c3e50;
    font-family: ui-monospace, monospace;
}

.cmm-stat-duration .dur-pct {
    color: #95a5a6;
    font-family: ui-monospace, monospace;
}
```

---

📄 3. P050_chart_t3_071.js — 신규 함수 + 호출 연결

3-1. renderPresetStats() 신규 함수

renderContextMinimap() 함수 바로 아래에 삽입:

```javascript
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

      // 세그먼트 재사용 (미니맵과 동일 계산)
      const segments = buildContextSegments();
      if (!segments.length) {
          el.innerHTML = '<div class="cmm-stat-empty">데이터 수집 중...</div>';
          return;
      }

      // ── 프리셋별 누적 시간 ──
      const durations = {};   // code → ms
      segments.forEach((seg) => {
          const p = presetMap.get(seg.presetIdx);
          if (!p) return;
          const code = p.code || `#${seg.presetIdx}`;
          durations[code] = (durations[code] || 0) + (seg.end - seg.start);
      });

      // ── Top 3 정렬 ──
      const entries = Object.entries(durations)
          .map(([code, ms]) => {
              const idx = [...presetMap.entries()].find(([, v]) => v.code === code)?.[0];
              const p = presetMap.get(idx);
              return {
                  code,
                  ms,
                  name: p ? (p.name || code) : code,
                  color: PRESET_COLORS[idx % PRESET_COLORS.length] || "#607d8b",
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
```

3-2. renderContextMinimap() — 통계 갱신 연결

함수 내 el.innerHTML = blocksHtml + eventsHtml; 다음 라인에 추가:

Before:

```javascript
      el.innerHTML = blocksHtml + eventsHtml;
  }
```

After:

```javascript
      el.innerHTML = blocksHtml + eventsHtml;

      // [신규] 통계도 함께 갱신
      renderPresetStats();
  }
```

조기 return 경로 3곳에도 통계 갱신 추가:

경로 1 (윈도우 내 데이터 없음):

```javascript
      if (!segments.length) {
          el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
          renderPresetStats();   // [신규]
          return;
      }
```

경로 2 (원래 renderContextMinimap 시작부):

```javascript
  function renderContextMinimap() {
      const el = document.getElementById("cmmTimeline");
      if (!el) return;

      const now = Date.now();
      const minTs = now - _cmmWindowMs();
      const total = now - minTs;

      const segments = buildContextSegments();

      if (!segments.length) {
          el.innerHTML = '<div class="cmm-empty">데이터 수집 중...</div>';
          renderPresetStats();   // [신규]
          return;
      }
      // ...
```

3-3. 윈도우 토글 이벤트 — 통계 재갱신

bindEvents() 내 data-cmm-window 클릭 핸들러 수정:

Before:

```javascript
            // 강제 재렌더
            _cmmLastRender = 0;
            renderContextMinimap();
```

After:

```javascript
            // 강제 재렌더 (미니맵 + 통계)
            _cmmLastRender = 0;
            renderContextMinimap();
            renderPresetStats();
```

3-4. DOMContentLoaded — 초기 렌더

renderContextMinimap(); 호출 아래에 1줄 추가:

Before:

```javascript
    // 실행 컨텍스트 미니맵 초기 렌더
    renderContextMinimap();

    // 30초마다 강제 재렌더 (윈도우 슬라이딩)
    setInterval(renderContextMinimap, 30000);
```

After:

```javascript
    // 실행 컨텍스트 미니맵 초기 렌더
    renderContextMinimap();

    // 프리셋 통계 초기 렌더
    renderPresetStats();

    // 30초마다 강제 재렌더 (윈도우 슬라이딩 + 통계)
    setInterval(() => {
        _cmmLastRender = 0;
        renderContextMinimap();
        renderPresetStats();
    }, 30000);
```

---

🔧 적용 순서

1. P050_chart_t3_071.html — 요약 카드에 통계 wrapper 삽입
2. P050_chart_t3_071.css — 파일 끝 append
3. P050_chart_t3_071.js — 4곳 수정 (신규 함수 + 호출 4개)
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 초기 상태

1. 페이지 로드 직후
2. 기대:
   · 통계 카드: "데이터 수집 중..."
   · 윈도우 라벨: "최근 30분"

B. 프리셋 이력 누적 → 통계 카드

1. 자연풍 30분 대기 (프리셋 A → B → A 자동 전환)
2. 기대:
   · 🥇 프리셋 A (60%) — 금색 랭크
   · 🥈 프리셋 B (40%) — 은색 랭크
   · 진행 바: A = 100%, B = 67%
   · 지속 시간: "18분" / "12분"

C. 윈도우 토글

클릭 기대
"1시간" 라벨 "최근 1시간", 통계 재집계
"3시간" 라벨 "최근 3시간", 블록 수 증가
"30분" 축소

D. 진행 바 상대 너비

1위 = 100%, 2위 = (2위 시간 / 1위 시간) × 100%
→ 시각적으로 명확한 순위 비교

E. 카드 hover

· 살짝 떠오름 (translateY -1px)
· 그림자 증가

F. 빈 데이터

1. 프리셋 이력 없음
2. 기대: "데이터 수집 중..." 또는 "현재 윈도우 내 이력 없음"

G. 다수 프리셋 (4종 이상)

1. 프리셋 5종 순차 사용
2. 기대: 상위 3개만 표시, 나머지 무시

H. 미니맵과 정합성

1. 미니맵 상의 프리셋 색상과 통계 카드 좌측 border 색상 동일
2. 미니맵 상에서 해당 프리셋 블록 폭과 통계 지속 시간 비례 관계

I. 성능

1. WS 수신 시 스로틀 확인
2. renderPresetStats가 2초에 1회 이상 DOM 재생성 안 함

---

📊 사용자 경험 (P050)

상황 이전 (미니맵만) 이후 (+통계)
"뭐 오래 썼지?" 블록 폭 비교 (대략) 🥇 정확한 시간 + %
"프리셋 비율?" 시각적 추정 📊 명확한 숫자
"윈도우별 변화?" 토글 → 시각 변화 토글 → 시간 + % 자동 재집계
"오늘 세션 요약?" 스크린샷 즉시 카드 3장
"프리셋 우선순위?" 없음 🥇🥈🥉 명시

실 사용 시나리오

시나리오 1: 하루 마무리 리뷰

저녁에 P050 접속. 통계 카드 즉시 확인.
🥇 해변 바람 45분 (55%) · 🥈 숲 그늘 25분 (30%) · 🥉 사막의 밤 12분 (15%)
"오늘 해변 바람 위주로 썼구나" → 다음날 다른 프리셋 시도.

시나리오 2: 프리셋 튜닝 검증

새 프리셋 추가 후 30분 관찰. 통계에서 순위 확인 → 프리셋별 인기도 파악.

시나리오 3: 문제 구간 분석

특정 시간대 이상 동작. 토글로 "3시간" → 통계에서 그 시간대 프리셋 확인 → 차트와 대조.

시나리오 4: 스케줄 검증

스케줄 실행 후 P050 접속. 통계에 예상한 프리셋들이 정확히 순위에 있는지 확인.

---

🚀 다음 단계

P050 + P010 미니맵/통계 통합 완료. 남은 선택:

· (A) 통계 데이터 CSV export (프리셋 이력 전체)
· (B) Round 3 검증 매뉴얼 작성
· (C) P085 프로필 실행 이력 통계 (어떤 프로필을 많이 썼는가)
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.

