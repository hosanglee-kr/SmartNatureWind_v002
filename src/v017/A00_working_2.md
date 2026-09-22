P085 프로필 편집 UX 확장 검토

먼저 진단 → 개선안 → 진행 옵션 순으로 제시합니다.

---

📊 1. P085 현재 상태 진단

현재 편집 UI 구조

```
[프로필 목록 테이블]
  ↓ 클릭
[편집 모달]
  ├── 기본 정보 (이름/번호/반복)
  ├── 세그먼트 목록 (테이블 10 컬럼)
  ├── AutoOff (타이머/시간/온도)
  └── Motion (PIR)
```

사용자가 실제로 겪는 불편

# 상황 현재 UX 사용자 반응
1 세그먼트 순서 바꾸고 싶음 삭제 → 재입력 😤 "왜 이렇게 불편해"
2 비슷한 세그먼트 추가 모든 필드 수동 재입력 😩 "복사 붙여넣기 안 되나?"
3 조정값 최적화 직접 숫자 조정 🤔 "얼마로 해야 하지?"
4 프리셋 의미 코드만 보임 (OCEAN) 😐 "이게 뭐지?"
5 저장 전 확인 없음 (저장 후 실행 필요) 😨 "실행해봐야 아나?"
6 실행 중 편집 경고 팝업만 😕 "언제 반영되지?"

---

🎯 2. 개선안 매트릭스

# 항목 소요 효과 우선순위
1 세그먼트 순서 변경 (↑↓) 30분 🔥🔥🔥 🔴
2 세그먼트 복제 (📋) 20분 🔥🔥🔥 🔴
3 AI 조정 버튼 (P080 이식) 40분 🔥🔥 🟠
4 프리셋 설명 툴팁 25분 🔥🔥 🟠
5 미리보기 패널 (실행 시뮬) 60분 🔥🔥🔥 🟡
6 실시간 편집 반영 표시 45분 🔥 🟡

---

🔨 3. 세부 구현안

🔴 우선순위 1: 세그먼트 순서 변경 + 복제

개념:

· 각 세그먼트 행 우측에 ↑ ↓ 📋 버튼 추가
· 테이블 DOM 순서만 이동 (배열 인덱스 = 실행 순서)
· 복제 시 모든 필드 그대로 복사 (segNo만 자동 증가)

변경:

· P085_userProfiles_t2_071.js — addSegmentRow() 확장 + 새 함수 2개

Before (현재 행 액션 열):

```html
<td>
  <button type="button" class="btn btn-small btn-err btn-del-seg">삭제</button>
</td>
```

After:

```html
<td class="seg-actions">
  <button type="button" class="btn btn-small btn-move-up"   title="위로 이동">↑</button>
  <button type="button" class="btn btn-small btn-move-down" title="아래로 이동">↓</button>
  <button type="button" class="btn btn-small btn-dup-seg"   title="세그먼트 복제">📋</button>
  <button type="button" class="btn btn-small btn-err btn-del-seg" title="삭제">🗑</button>
</td>
```

새 함수:

```javascript
// 순서 변경
function moveSegment(row, direction) {
    const tbody = row.parentNode;
    const rows = Array.from(tbody.querySelectorAll(".segment-row"));
    const idx = rows.indexOf(row);
    if (direction === "up"   && idx > 0)                tbody.insertBefore(row, rows[idx - 1]);
    if (direction === "down" && idx < rows.length - 1)  tbody.insertBefore(rows[idx + 1], row);
    renumberSegNos();   // segNo 자동 재정렬 (10, 20, 30, ...)
}

// 복제
function duplicateSegment(row) {
    const tbody = row.parentNode;
    const clone = row.cloneNode(true);

    // 이벤트 리스너 재바인딩 (cloneNode는 리스너 복사 안 함)
    bindSegmentRowEvents(clone);

    // segNo 자동 증가 (기존 max + 10)
    const newSegNo = _suggestNextSegNo();
    const segNoInput = clone.querySelector(".seg-no");
    if (segNoInput) segNoInput.value = newSegNo;

    // segId는 서버 발급이므로 0으로 초기화 (표시용)
    const idCell = clone.querySelector("td:first-child");
    if (idCell) idCell.textContent = "auto";

    // 원본 바로 아래에 삽입
    row.parentNode.insertBefore(clone, row.nextSibling);
}

// segNo 재정렬
function renumberSegNos() {
    const rows = document.querySelectorAll("#segmentsBody .segment-row");
    rows.forEach((row, idx) => {
        const segNoInput = row.querySelector(".seg-no");
        if (segNoInput) segNoInput.value = (idx + 1) * 10;
    });
}
```

체크:

· 서버 저장 시 buildSegmentsFromUI()가 DOM 순서대로 배열 구성 → 실행 순서 반영
· segNo 재정렬은 사용자 편의 (서버는 배열 순서 사용)

---

🟠 우선순위 2: AI 조정 + 프리셋 설명

2-1. AI 조정 (P080 이식)

Before (세그먼트 액션):

```html
<button type="button" class="btn btn-small btn-del-seg">삭제</button>
```

After:

```html
<button type="button" class="btn btn-small btn-ai-adjust" title="AI 조정">🤖</button>
<button type="button" class="btn btn-small btn-del-seg">삭제</button>
```

새 함수 (P080과 동일):

```javascript
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

    const systemPrompt =
        "당신은 스마트 윈드 시스템의 바람 엔지니어입니다. 사용자가 묘사한 바람의 느낌을 현실화하기 위해 " +
        "필요한 'windIntensity'와 'windVariability'의 조정값을 JSON으로만 반환합니다. " +
        "조정값은 -1.0에서 +1.0 사이의 float(소수점 첫째 자리)입니다.";

    const userQuery =
        `현재 프리셋: ${presetName} (${presetCode})\n` +
        `사용자 요구: "${userPrompt}"\n\n` +
        `windIntensity와 windVariability를 조정하여 JSON으로 출력하십시오.`;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            windIntensity:   { type: "NUMBER" },
            windVariability: { type: "NUMBER" },
        },
        propertyOrdering: ["windIntensity", "windVariability"],
    };

    showLoading();
    try {
        const apiKey = getApiKey();
        const resp = await fetch(SNW_API.API_HTTP_GEMINI_PROXY, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    temperature: 0.7, maxOutputTokens: 512,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AI 응답 없음");

        const adj = JSON.parse(text);
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
```

2-2. 프리셋 설명 툴팁

세그먼트 테이블 헤더 옆에 범례 추가 + 행 hover 시 표시:

테이블 상단 (.segment-list-container 위):

```html
<div class="preset-hint" id="presetHint">
    <span class="muted">프리셋 위에 마우스 올리면 설명 표시</span>
</div>
```

행의 preset select에 mouseover 이벤트:

```javascript
function bindPresetHint(row) {
    const sel = row.querySelector(".seg-preset");
    if (!sel) return;
    sel.addEventListener("mouseenter", () => {
        const code = sel.value;
        if (!code) return;
        const preset = windPresets.find(p => p.code === code);
        const hint = document.getElementById("presetHint");
        if (preset && hint) {
            const f = preset.factors || {};
            hint.innerHTML = `<strong>${preset.name || code}</strong> — 강도 ${f.windIntensity} · 변동 ${f.windVariability} · 돌풍 ${f.gustFrequency}`;
        }
    });
    sel.addEventListener("mouseleave", () => {
        const hint = document.getElementById("presetHint");
        if (hint) hint.innerHTML = '<span class="muted">프리셋 위에 마우스 올리면 설명 표시</span>';
    });
}
```

---

🟡 우선순위 3: 미리보기 + 실행 중 편집

3-1. 미리보기 패널

모달 하단에 "실행 미리보기" 섹션:

```html
<section class="card section-block preview-block">
    <h3 class="section-subtitle">👁 실행 미리보기</h3>
    <div class="preview-timeline">
        <div class="preview-info">
            <span class="pv-duration">총 예상 소요: <strong id="pvDuration">-</strong></span>
            <span class="pv-segments">세그먼트: <strong id="pvSegCount">-</strong>개</span>
        </div>
        <div id="pvTimelineViz" class="preview-timeline-viz">
            <!-- 세그먼트별 시각적 바 -->
        </div>
    </div>
</section>
```

시각화 로직:

· 각 세그먼트를 가로 바로 표현 (폭 = onMinutes 비율)
· Off 구간은 회색, On 구간은 프리셋 색상
· 클릭 시 해당 세그먼트로 스크롤

3-2. 실행 중 편집 반영 표시

상단에 배지:

```html
<span id="liveEditBadge" class="info-label warn" style="display:none;">
    🟢 실행 중 편집 — 저장 시 다음 사이클부터 반영
</span>
```

모달 열릴 때 해당 프로필이 실행 중이면 자동 표시.

---

🛣️ 진행 옵션

옵션 범위 소요 사용자 체감
(B1) 🔴 순서변경 + 복제만 50분 ⭐⭐⭐
(B2) B1 + 🟠 AI + 툴팁 2시간 ⭐⭐⭐⭐
(B3) B2 + 🟡 미리보기 + 실행중 편집 3.5시간 ⭐⭐⭐⭐⭐

각 옵션의 사용자 체감:

· B1 — "아, 세그먼트 편하게 다룰 수 있네" (즉시 만족)
· B2 — "AI도 있고 프리셋 뜻도 알겠다" (정보 접근성↑)
· B3 — "저장 전에 어떻게 실행될지 보이고, 실행 중 변경도 명확" (신뢰성↑)

---

🚀 추천

B2 권장 — 편집 UX의 80% 커버, 2시간 소요.

B3는 미리보기 시각화가 가장 임팩트 있지만, 실제 사용 시 자주 열어보는 기능은 아닐 수 있음. 데이터 관점에서 프로필 구조가 단순하면 B2로 충분.

---

어떤 옵션으로 진행할까요?

· (B1) 순서변경+복제만 즉시 적용
· (B2) B1 + AI + 툴팁
· (B3) B2 + 미리보기 + 실행중 편집


P085 프로필 편집 UX 확장 (B2 + B3)

총 5개 기능:

# 기능 우선순위
1 세그먼트 순서 변경 (↑↓) 🔴
2 세그먼트 복제 (📋) 🔴
3 AI 조정 (🤖) 🟠
4 프리셋 설명 툴팁 🟠
5 실행 미리보기 + 실행 중 편집 배지 🟡

변경 파일 3개:

# 파일 상태
1 P085_userProfiles_t2_071.html 🔄 3곳 삽입
2 P085_userProfiles_t2_071.css 🔄 파일 끝 append
3 P085_userProfiles_t2_071.js 🔄 6곳 수정 + 신규 함수 8개

---

📄 1. P085_userProfiles_t2_071.html — 3곳 삽입

1-1. 세그먼트 테이블 상단에 프리셋 힌트

<div class="segment-list-container"> 바로 위에 삽입:

```html
<div class="preset-hint" id="presetHint">
    <span class="muted">💡 프리셋에 마우스를 올리면 설명이 표시됩니다.</span>
</div>
```

1-2. 모달 상단에 실행 중 편집 배지

<form id="profileForm"> 바로 아래, <section class="card section-block"> 위에 삽입:

```html
<div id="liveEditBadge" class="live-edit-badge" style="display:none;">
    🟢 실행 중 — 저장 시 다음 사이클부터 반영됩니다
</div>
```

1-3. 실행 미리보기 섹션 (Motion 섹션 뒤)

</section> (모션 감지 섹션 종료) 바로 뒤, <div class="modal-actions"> 바로 위에 삽입:

```html
<section class="card section-block preview-block">
    <h3 class="section-subtitle">👁 실행 미리보기</h3>

    <div class="preview-info">
        <span class="pv-item">⏱ 총 소요: <strong id="pvDuration">-</strong></span>
        <span class="pv-item">📊 세그먼트: <strong id="pvSegCount">-</strong>개</span>
        <span class="pv-item">🔁 반복: <strong id="pvRepeat">-</strong></span>
    </div>

    <div id="pvTimelineViz" class="preview-timeline-viz">
        <div class="muted" style="padding: 20px; text-align:center;">
            세그먼트가 없습니다.
        </div>
    </div>

    <p class="muted pv-note">
        ※ 실제 실행 시간은 각 세그먼트의 ON/OFF 시간과 반복 횟수에 따라 결정됩니다.
    </p>
</section>
```

---

📄 2. P085_userProfiles_t2_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 세그먼트 액션 버튼 (순서/복제/AI/삭제)                       */
/* ============================================================ */

.segment-row .seg-actions {
    display: flex;
    gap: 3px;
    justify-content: center;
    flex-wrap: nowrap;
}

.segment-row .seg-actions .btn-small {
    padding: 3px 6px;
    font-size: 0.8em;
    line-height: 1;
    min-width: 24px;
}

.segment-row .btn-move-up,
.segment-row .btn-move-down {
    background-color: #eef2f6;
    color: #4a637a;
    border-color: #d0d7de;
}
.segment-row .btn-move-up:hover:not(:disabled),
.segment-row .btn-move-down:hover:not(:disabled) {
    background-color: #d9e4ec;
}

.segment-row .btn-move-up:disabled,
.segment-row .btn-move-down:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.segment-row .btn-dup-seg {
    background-color: #e8f5e9;
    color: #27ae60;
    border-color: #a5d6a7;
}
.segment-row .btn-dup-seg:hover {
    background-color: #c8e6c9;
}

.segment-row .btn-ai-adjust {
    background-color: #e3f2fd;
    color: #1976d2;
    border-color: #90caf9;
}
.segment-row .btn-ai-adjust:hover {
    background-color: #bbdefb;
}

/* ============================================================ */
/* 프리셋 힌트                                                   */
/* ============================================================ */

.preset-hint {
    margin: 8px 0 10px;
    padding: 8px 12px;
    background-color: #f7f9fb;
    border-left: 3px solid #3498db;
    border-radius: 4px;
    font-size: 0.85em;
    line-height: 1.4;
    color: #4a637a;
    min-height: 2.2em;
    transition: background-color 0.2s;
}

.preset-hint.active {
    background-color: #eaf4fc;
    border-left-color: #2980b9;
}

/* ============================================================ */
/* 실행 중 편집 배지                                             */
/* ============================================================ */

.live-edit-badge {
    margin-bottom: 14px;
    padding: 10px 14px;
    background-color: #fff8e1;
    border-left: 4px solid #f39c12;
    border-radius: 6px;
    color: #b9770e;
    font-weight: 600;
    font-size: 0.9em;
    animation: liveEditPulse 2s ease-in-out infinite;
}

@keyframes liveEditPulse {
    0%, 100% { background-color: #fff8e1; }
    50%      { background-color: #fef3c7; }
}

/* ============================================================ */
/* 실행 미리보기                                                 */
/* ============================================================ */

.preview-block {
    background: #fbfdff;
    border: 1px solid #e0eaf5;
}

.preview-info {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #e8eef4;
    font-size: 0.9em;
}

.pv-item {
    color: #566573;
}

.pv-item strong {
    color: #2c3e50;
    font-family: ui-monospace, monospace;
}

.preview-timeline-viz {
    display: flex;
    height: 44px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
    margin-bottom: 8px;
    background: #f1f4f8;
}

.pv-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.75em;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
    transition: filter 0.15s;
    cursor: default;
    position: relative;
    min-width: 0;
}

.pv-bar:hover {
    filter: brightness(1.1);
    z-index: 1;
}

/* 세그먼트별 배경색 */
.pv-bar.pv-preset { background: linear-gradient(135deg, #3498db, #2980b9); }
.pv-bar.pv-fixed  { background: linear-gradient(135deg, #e67e22, #d35400); }
.pv-bar.pv-off    { background: linear-gradient(135deg, #95a5a6, #7f8c8d); }

/* 반복 표시용 배지 */
.pv-bar .pv-repeat-marker {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(255,255,255,0.85);
    color: #2c3e50;
    font-size: 0.7em;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 700;
}

.pv-note {
    margin-top: 8px;
    font-size: 0.78em;
    text-align: right;
}
```

---

📄 3. P085_userProfiles_t2_071.js — 6곳 수정

3-1. 상단 유틸 로딩 확인 — windPresets, windStyles 존재 확인

기존 유지 (이미 존재). 별도 수정 불필요.

3-2. addSegmentRow() — 액션 열 확장 + 이벤트 바인딩 분리

기존 addSegmentRow() 내 row.innerHTML 의 마지막 <td> 부분 교체:

Before:

```javascript
      <td>
        <button type="button" class="btn btn-small btn-err btn-del-seg">삭제</button>
      </td>
    `;

    row.querySelector(".seg-mode").addEventListener("change", () => applySegmentModeState(row));

    if (appendToEnd) tbody.appendChild(row);
    else tbody.insertBefore(row, tbody.firstChild);

    applySegmentModeState(row);
  }
```

After:

```javascript
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
  // 세그먼트 행 이벤트 바인딩 (신규/복제 공통)
  // ═══════════════════════════════════════════════════════════
  function bindSegmentRowEvents(row) {
    // 모드 변경
    row.querySelector(".seg-mode")?.addEventListener("change", () => {
      applySegmentModeState(row);
      schedulePreviewUpdate();
    });

    // 순서 변경
    row.querySelector(".btn-move-up")?.addEventListener("click", () => moveSegment(row, "up"));
    row.querySelector(".btn-move-down")?.addEventListener("click", () => moveSegment(row, "down"));

    // 복제
    row.querySelector(".btn-dup-seg")?.addEventListener("click", () => duplicateSegment(row));

    // AI 조정
    row.querySelector(".btn-ai-adjust")?.addEventListener("click", (e) => handleOptimizeAdjust(e.currentTarget));

    // 삭제는 event delegation (#segmentsBody에서 처리)
    // 프리셋 설명 힌트
    bindPresetHint(row);

    // 입력 변경 시 미리보기 갱신
    row.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", schedulePreviewUpdate);
      el.addEventListener("change", schedulePreviewUpdate);
    });
  }
```

3-3. 순서 변경 / 복제 / 재정렬 함수 (신규 4개)

applySegmentModeState() 함수 바로 위에 삽입:

```javascript
  // ═══════════════════════════════════════════════════════════
  // 순서 변경 (↑↓)
  // ═══════════════════════════════════════════════════════════
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
      return;   // 이동 없음
    }

    renumberSegNos();
    updateMoveButtonStates();
    schedulePreviewUpdate();
    markDirty?.();
  }

  // segNo 자동 재정렬 (10, 20, 30, ...)
  function renumberSegNos() {
    const rows = document.querySelectorAll("#segmentsBody .segment-row");
    rows.forEach((row, idx) => {
      const segNoInput = row.querySelector(".seg-no");
      if (segNoInput) segNoInput.value = (idx + 1) * 10;
    });
  }

  // ↑↓ 버튼 활성/비활성 상태 갱신
  function updateMoveButtonStates() {
    const rows = Array.from(document.querySelectorAll("#segmentsBody .segment-row"));
    rows.forEach((row, idx) => {
      const up   = row.querySelector(".btn-move-up");
      const down = row.querySelector(".btn-move-down");
      if (up)   up.disabled   = (idx === 0);
      if (down) down.disabled = (idx === rows.length - 1);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 세그먼트 복제
  // ═══════════════════════════════════════════════════════════
  function duplicateSegment(row) {
    const tbody = row.parentNode;
    if (!tbody) return;

    const currentCount = tbody.querySelectorAll(".segment-row").length;
    if (currentCount >= MAX_SEGMENTS) {
      toast(`세그먼트는 최대 ${MAX_SEGMENTS}개까지 추가 가능합니다.`, "warn");
      return;
    }

    const clone = row.cloneNode(true);

    // segNo 자동 증가 (기존 max + 10)
    const newSegNo = _suggestNextSegNo();
    const segNoInput = clone.querySelector(".seg-no");
    if (segNoInput) segNoInput.value = newSegNo;

    // segId는 서버 발급이므로 표시용 셀 초기화
    const idCell = clone.querySelector("td:first-child");
    if (idCell) idCell.textContent = "auto";

    // 원본 바로 아래에 삽입
    tbody.insertBefore(clone, row.nextSibling);

    // 이벤트 재바인딩 (cloneNode는 리스너 복사 안 함)
    bindSegmentRowEvents(clone);

    // 초기 mode 상태 반영
    applySegmentModeState(clone);
    updateMoveButtonStates();
    schedulePreviewUpdate();

    toast("세그먼트를 복제했습니다.", "ok");
  }
```

3-4. AI 조정 + 프리셋 힌트 (신규 2개)

_suggestNextSegNo() 함수 아래에 삽입:

```javascript
  // ═══════════════════════════════════════════════════════════
  // AI 조정 (P080 이식, P085 프리셋 변수명 적용)
  // ═══════════════════════════════════════════════════════════
  async function handleOptimizeAdjust(button) {
    const row = button.closest(".segment-row");
    if (!row) return;

    const mode = row.querySelector(".seg-mode")?.value;
    if (mode !== "PRESET") {
      toast("프리셋 모드일 때만 AI 최적화를 사용할 수 있습니다.", "warn");
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

      toast(`AI 조정 완료 — 강도 ${iV.toFixed(1)}, 변동 ${vV.toFixed(1)}`, "ok");
    } catch (e) {
      toast(`AI 조정 실패: ${e.message}`, "err");
    } finally {
      SNW.loading.hide();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 프리셋 설명 힌트
  // ═══════════════════════════════════════════════════════════
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
```

3-5. 실행 미리보기 + 실행 중 배지 (신규 3개)

openModal() 함수 바로 위에 삽입:

```javascript
  // ═══════════════════════════════════════════════════════════
  // 실행 미리보기 (Preview Timeline)
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

    // 현재 DOM 기준 세그먼트 수집
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

    // 총 시간 계산
    let totalOn = 0, totalOff = 0;
    segments.forEach((s) => { totalOn += s.onMinutes; totalOff += s.offMinutes; });

    const cycleMinutes = totalOn + totalOff;

    // 반복 배수 계산
    let effectiveCycles = 1;
    if (repeatEnabled) {
      if (repeatCount > 0) effectiveCycles = repeatCount;
      else effectiveCycles = 0;   // 무한
    }

    // 요약
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

    // 시각화
    if (!segments.length) {
      pvViz.innerHTML = '<div class="muted" style="padding:20px; text-align:center; width:100%;">세그먼트가 없습니다.</div>';
      return;
    }

    const total = segments.reduce((sum, s) => sum + s.onMinutes + s.offMinutes, 0);
    if (total === 0) {
      pvViz.innerHTML = '<div class="muted" style="padding:20px; text-align:center; width:100%;">시간 설정이 없습니다.</div>';
      return;
    }

    // 각 세그먼트 → ON 바 + OFF 바
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

    // 반복 마커 (마지막 세그먼트 ON 바에 "×N" 배지)
    let vizHtml = bars.join("");
    if (repeatEnabled && repeatCount > 1) {
      vizHtml = vizHtml.replace(
        /(<div class="pv-bar pv-(?:preset|fixed)"[^>]*>)/g,
        (match, p1, offset, str) => {
          // 마지막 ON 바만 마커 표시 (간단히 첫 매치에 삽입)
          if (str.indexOf("pv-repeat-marker") < 0 && str.lastIndexOf(p1) === offset) {
            return p1 + `<span class="pv-repeat-marker">×${repeatCount}</span>`;
          }
          return match;
        }
      );
    }

    pvViz.innerHTML = vizHtml;
  }

  // ═══════════════════════════════════════════════════════════
  // 실행 중 편집 배지
  // ═══════════════════════════════════════════════════════════
  function updateLiveEditBadge(profile) {
    const badge = document.getElementById("liveEditBadge");
    if (!badge) return;

    const isRunning = profile && Number(profile.profileNo) === activeProfileNo;
    badge.style.display = isRunning ? "block" : "none";
  }
```

3-6. openModal() — 미리보기 + live 배지 초기화

openModal() 함수 내 수정 2곳:

A. 수정 프로필일 때:

Before:

```javascript
    if (profile) {
      $("#modalTitle").textContent = `프로파일 수정: ${profile.name}`;
      // ... 세그먼트 렌더
      segs.forEach((s) => addSegmentRow(s, true));
    } else {
```

After:

```javascript
    if (profile) {
      $("#modalTitle").textContent = `프로파일 수정: ${profile.name}`;
      // ... 세그먼트 렌더
      segs.forEach((s) => addSegmentRow(s, true));
    } else {
```

함수 끝부분에 초기화 추가:

Before:

```javascript
      addSegmentRow({ /* ... */ }, true);
    }

    modal.style.display = "flex";
  }
```

After:

```javascript
      addSegmentRow({ /* ... */ }, true);
    }

    // ═══════════════════════════════════════════════════════════
    // 후처리: 미리보기, 이동 버튼 상태, live 배지, 프리셋 힌트 초기화
    // ═══════════════════════════════════════════════════════════
    updateMoveButtonStates();
    updatePreviewPanel();
    updateLiveEditBadge(profile);

    // 프리셋 힌트 초기값
    const hint = document.getElementById("presetHint");
    if (hint) {
      hint.innerHTML = '<span class="muted">💡 프리셋에 마우스를 올리면 설명이 표시됩니다.</span>';
      hint.classList.remove("active");
    }

    modal.style.display = "flex";
  }
```

3-7. bindEvents() — 삭제 위임 확장 + 반복 필드 감지

기존 #segmentsBody 클릭 핸들러 확장:

Before:

```javascript
    $("#segmentsBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".btn-del-seg");
      if (del) {
        const row = del.closest(".segment-row");
        if (row && row.parentNode) row.parentNode.removeChild(row);
      }
    });
```

After:

```javascript
    $("#segmentsBody")?.addEventListener("click", (e) => {
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

    // 반복 여부/횟수 변경 시 미리보기 갱신
    ["#repeatSegments", "#repeatCount"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.addEventListener("change", schedulePreviewUpdate);
        el.addEventListener("input",  schedulePreviewUpdate);
      }
    });
```

주의: 기존 bindEvents() 내 #segmentsBody 클릭 핸들러에서 이동/복제/AI는 행별 리스너로 처리하므로 위임에서 제외. 삭제만 위임 처리.

---

🔧 적용 순서

1. P085_userProfiles_t2_071.html — 3곳 삽입
   · 프리셋 힌트 (세그먼트 테이블 위)
   · Live edit 배지 (form 상단)
   · 미리보기 섹션 (Motion 뒤)
2. P085_userProfiles_t2_071.css — 파일 끝 append
3. P085_userProfiles_t2_071.js — 6곳 수정 + 신규 함수
   · addSegmentRow() 액션 열 교체 + bindSegmentRowEvents() 추가
   · 신규 함수 8개 삽입 (moveSegment, renumberSegNos, updateMoveButtonStates, duplicateSegment, handleOptimizeAdjust, bindPresetHint, schedulePreviewUpdate, updatePreviewPanel, updateLiveEditBadge)
   · openModal() 후처리 추가
   · bindEvents() 확장
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 순서 변경

1. 프로필 편집 모달 열기
2. 세그먼트 3개 이상
3. 두 번째 행의 ↑ 클릭
4. 기대:
   · 첫 번째 위치로 이동
   · segNo 자동 재정렬 (10, 20, 30)
   · 첫 행 ↑ 비활성, 마지막 행 ↓ 비활성
   · 미리보기 타임라인 순서 갱신

B. 복제

1. 세그먼트 행의 📋 클릭
2. 기대:
   · 바로 아래에 동일 설정 복제
   · segNo 자동 증가
   · segId = "auto"
   · 토스트: "세그먼트를 복제했습니다."
   · 미리보기 갱신

C. AI 조정

1. PRESET 모드 세그먼트의 🤖 클릭
2. prompt: "더 부드럽고 약하게"
3. 기대:
   · 강도/변동 필드 자동 채움
   · 토스트: "AI 조정 완료 — 강도 -0.3, 변동 -0.2"

D. 프리셋 힌트

1. 세그먼트의 프리셋 select에 마우스 올리기
2. 기대: 상단 힌트 영역에 "🌊 해변 바람 — 강도 70 · 변동 55 · 돌풍 50 · 팬상한 95"
3. 다른 프리셋 선택 시 즉시 갱신

E. 실행 미리보기

1. 세그먼트 3개, 각 ON/OFF 지정
2. 기대:
   · "총 소요: 2시간 30분 (3회)"
   · "세그먼트: 3개"
   · "반복: 3회"
   · 시각화 바: 파랑/주황/회색 순서대로 나열
   · 각 바 hover 시 tooltip
3. 반복 필드 변경:
   · repeatSegments 해제 → "총 소요: 50분 (1회)"
   · repeatCount 0 → "총 소요: 50분 (무한 반복)"

F. 실행 중 편집 배지

1. 프로필 "수면모드" 실행
2. 목록에서 "수정" 클릭
3. 기대:
   · 모달 상단에 노란 배지 "🟢 실행 중 — 저장 시 다음 사이클부터 반영됩니다"
   · 배지에 pulse 애니메이션
4. 다른 프로필(비실행) 편집 시 배지 숨김

G. 반응형 (모바일)

1. 375px 뷰포트
2. 세그먼트 테이블 가로 스크롤
3. 액션 버튼 4개 유지
4. 미리보기 시각화 바 정상

---

📊 사용자 체감 개선

이전 이후
세그먼트 순서 바꾸려면 삭제+재입력 ↑↓ 클릭으로 즉시 이동
유사 세그먼트 재입력 📋 복제 후 수정
조정값 감으로 설정 🤖 AI가 최적값 제안
프리셋 코드만 보임 마우스 올리면 설명
저장 전 결과 예측 불가 타임라인 미리보기
실행 중 편집 시 불안 명확한 배지 안내

---

🚀 다음 단계

B2 + B3 완료. 남은 선택:

· (A) 세그먼트 저장 시 서버 응답으로 segId 자동 표시
· (B) Round 3 검증 매뉴얼 작성
· (C) P080 스케줄에도 동일 UX 이식
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.

Part A (P085 segId 반영) + Part C (P080 이식)

---

📄 Part A — P085 저장 후 segId 자동 표시

목적: 프로필 저장 직후 서버가 발급한 실제 segId를 세그먼트 테이블에 즉시 반영.

변경 파일 1개: P085_userProfiles_t2_071.js → saveProfile() 함수 교체

saveProfile() 전체 교체

Before:

```javascript
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
```

After:

```javascript
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

    // ═══════════════════════════════════════════════════════════
    // [신규] 저장 후 서버 재조회 → 실제 segId 반영
    //  - 생성 직후: 모달 유지 + 세그먼트 재렌더(segId 표시)
    //  - 수정 직후: 기존 정책대로 모달 닫기
    // ═══════════════════════════════════════════════════════════
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

    // 모달 타이틀 갱신 (신규 → "수정: 이름")
    const title = document.getElementById("modalTitle");
    if (title) title.textContent = `프로파일 수정: ${savedProfile.name}`;

    if (isUpdate) {
      closeModal();
      SNW.toast("수정 완료", "ok");
    } else {
      SNW.toast("프로파일 생성 완료 · 세그먼트 ID 자동 반영", "ok");
    }
  }
```

검증 (Part A)

1. 신규 프로필 생성
   · 세그먼트 3개 입력 → 저장
   · 모달 유지, 세그먼트 ID 열: auto → 1, 2, 3 (서버 발급)
   · 모달 타이틀: "새 프로파일 생성" → "프로파일 수정: XXX"
2. 재저장 (수정)
   · hidden profileId 채워짐 → PUT 경로
   · 저장 후 모달 닫힘

---

📄 Part C — P080 동일 UX 이식

P080 이식 항목 (4개, AI는 기존재):

# 기능 상태
1 세그먼트 순서 변경 (↑↓) 🆕
2 세그먼트 복제 (📋) 🆕
3 AI 조정 ✅ 기존
4 프리셋 설명 툴팁 🆕
5 실행 미리보기 (period 포함) 🆕
6 실행 중 편집 배지 🆕

---

📄 C-1. P080_sch_t2_071.html — 3곳 삽입

① 프리셋 힌트 (세그먼트 테이블 위)

<div class="segment-list-container"> 바로 위:

```html
<div class="preset-hint" id="presetHint">
    <span class="muted">💡 프리셋에 마우스를 올리면 설명이 표시됩니다.</span>
</div>
```

② 실행 중 편집 배지 (form 상단)

<input type="hidden" id="scheduleId" ...> 바로 아래:

```html
<div id="liveEditBadge" class="live-edit-badge" style="display:none;">
    🟢 실행 중 — 이 스케줄이 현재 시간 조건에 부합합니다 (저장 시 다음 사이클부터 반영)
</div>
```

③ 실행 미리보기 (AutoOff/Motion 섹션 뒤)

AutoOff/Motion <section> 종료 직후, .modal-actions 위:

```html
<section class="card section-block preview-block">
    <h3 class="section-subtitle">👁 실행 미리보기</h3>

    <div class="preview-info">
        <span class="pv-item">📅 스케줄: <strong id="pvPeriod">-</strong></span>
        <span class="pv-item">⏱ 총 소요: <strong id="pvDuration">-</strong></span>
        <span class="pv-item">📊 세그먼트: <strong id="pvSegCount">-</strong>개</span>
        <span class="pv-item">🔁 반복: <strong id="pvRepeat">-</strong></span>
    </div>

    <div id="pvTimelineViz" class="preview-timeline-viz">
        <div class="muted" style="padding: 20px; text-align:center; width:100%;">
            세그먼트가 없습니다.
        </div>
    </div>

    <p class="muted pv-note">
        ※ 실제 실행 시간은 각 세그먼트의 ON/OFF 시간과 반복 횟수에 따라 결정됩니다.
    </p>
</section>
```

---

📄 C-2. P080_sch_t2_071.css — 파일 끝에 append

P085 CSS와 동일 (클래스 재사용):

```css
/* ============================================================ */
/* 세그먼트 액션 버튼 (순서/복제/삭제)                          */
/* ============================================================ */

.segment-row .seg-actions {
    display: flex;
    gap: 3px;
    justify-content: center;
    flex-wrap: nowrap;
}

.segment-row .seg-actions .btn-small {
    padding: 3px 6px;
    font-size: 0.8em;
    line-height: 1;
    min-width: 24px;
}

.segment-row .btn-move-up,
.segment-row .btn-move-down {
    background-color: #eef2f6;
    color: #4a637a;
    border-color: #d0d7de;
}
.segment-row .btn-move-up:hover:not(:disabled),
.segment-row .btn-move-down:hover:not(:disabled) {
    background-color: #d9e4ec;
}
.segment-row .btn-move-up:disabled,
.segment-row .btn-move-down:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.segment-row .btn-dup-seg {
    background-color: #e8f5e9;
    color: #27ae60;
    border-color: #a5d6a7;
}
.segment-row .btn-dup-seg:hover {
    background-color: #c8e6c9;
}

/* ============================================================ */
/* 프리셋 힌트                                                   */
/* ============================================================ */

.preset-hint {
    margin: 8px 0 10px;
    padding: 8px 12px;
    background-color: #f7f9fb;
    border-left: 3px solid #3498db;
    border-radius: 4px;
    font-size: 0.85em;
    line-height: 1.4;
    color: #4a637a;
    min-height: 2.2em;
    transition: background-color 0.2s;
}
.preset-hint.active {
    background-color: #eaf4fc;
    border-left-color: #2980b9;
}

/* ============================================================ */
/* 실행 중 편집 배지                                             */
/* ============================================================ */

.live-edit-badge {
    margin-bottom: 14px;
    padding: 10px 14px;
    background-color: #fff8e1;
    border-left: 4px solid #f39c12;
    border-radius: 6px;
    color: #b9770e;
    font-weight: 600;
    font-size: 0.9em;
    animation: liveEditPulse 2s ease-in-out infinite;
}
@keyframes liveEditPulse {
    0%, 100% { background-color: #fff8e1; }
    50%      { background-color: #fef3c7; }
}

/* ============================================================ */
/* 실행 미리보기                                                 */
/* ============================================================ */

.preview-block {
    background: #fbfdff;
    border: 1px solid #e0eaf5;
}

.preview-info {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #ffffff;
    border-radius: 6px;
    border: 1px solid #e8eef4;
    font-size: 0.9em;
}
.pv-item { color: #566573; }
.pv-item strong {
    color: #2c3e50;
    font-family: ui-monospace, monospace;
}

.preview-timeline-viz {
    display: flex;
    height: 44px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
    margin-bottom: 8px;
    background: #f1f4f8;
}
.pv-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.75em;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
    transition: filter 0.15s;
    position: relative;
    min-width: 0;
}
.pv-bar:hover { filter: brightness(1.1); z-index: 1; }

.pv-bar.pv-preset { background: linear-gradient(135deg, #3498db, #2980b9); }
.pv-bar.pv-fixed  { background: linear-gradient(135deg, #e67e22, #d35400); }
.pv-bar.pv-off    { background: linear-gradient(135deg, #95a5a6, #7f8c8d); }

.pv-bar .pv-repeat-marker {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(255,255,255,0.85);
    color: #2c3e50;
    font-size: 0.7em;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 700;
}

.pv-note {
    margin-top: 8px;
    font-size: 0.78em;
    text-align: right;
}
```

---

📄 C-3. P080_sch_t2_071.js — 6곳 수정

전제: Round 2 리팩터링이 완료되어 SNW.$, SNW.$$, SNW.toast, SNW.api.* 사용 중.

수정 ①: addSegmentRow() — 액션 열 확장 + 이벤트 분리

기존 addSegmentRow() 내 row.innerHTML 의 마지막 <td> 교체:

Before:

```javascript
      <td>
        <button type="button" class="btn btn-small btn-ai-adjust" title="AI 조정">🤖</button>
        <button type="button" class="btn btn-small btn-err btn-del-seg">삭제</button>
      </td>
    `;

    // [B] mode change 리스너
    row.querySelector(".seg-mode").addEventListener("change", () => applySegmentModeState(row));

    if (appendToEnd) tbody.appendChild(row);
    else tbody.insertBefore(row, tbody.firstChild);

    applySegmentModeState(row);
  }
```

After:

```javascript
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
  // 세그먼트 행 이벤트 바인딩 (신규/복제 공통)
  // ═══════════════════════════════════════════════════════════
  function bindSegmentRowEvents(row) {
    row.querySelector(".seg-mode")?.addEventListener("change", () => {
      applySegmentModeState(row);
      schedulePreviewUpdate();
    });

    row.querySelector(".btn-move-up")?.addEventListener("click",   () => moveSegment(row, "up"));
    row.querySelector(".btn-move-down")?.addEventListener("click", () => moveSegment(row, "down"));
    row.querySelector(".btn-dup-seg")?.addEventListener("click",   () => duplicateSegment(row));
    row.querySelector(".btn-ai-adjust")?.addEventListener("click", (e) => handleOptimizeAdjust(e.currentTarget));

    bindPresetHint(row);

    row.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input",  schedulePreviewUpdate);
      el.addEventListener("change", schedulePreviewUpdate);
    });
  }
```

수정 ②: 순서/복제 함수 (신규 4개)

applySegmentModeState() 바로 위에 삽입:

```javascript
  // ═══════════════════════════════════════════════════════════
  // 순서 변경
  // ═══════════════════════════════════════════════════════════
  function moveSegment(row, direction) {
    const tbody = row.parentNode;
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll(".segment-row"));
    const idx = rows.indexOf(row);
    if (idx < 0) return;

    if (direction === "up" && idx > 0) tbody.insertBefore(row, rows[idx - 1]);
    else if (direction === "down" && idx < rows.length - 1) tbody.insertBefore(rows[idx + 1], row);
    else return;

    renumberSegNos();
    updateMoveButtonStates();
    schedulePreviewUpdate();
  }

  function renumberSegNos() {
    const rows = document.querySelectorAll("#segmentListBody .segment-row");
    rows.forEach((row, idx) => {
      const segNoInput = row.querySelector(".seg-no");
      if (segNoInput) segNoInput.value = (idx + 1) * 10;
    });
  }

  function updateMoveButtonStates() {
    const rows = Array.from(document.querySelectorAll("#segmentListBody .segment-row"));
    rows.forEach((row, idx) => {
      const up   = row.querySelector(".btn-move-up");
      const down = row.querySelector(".btn-move-down");
      if (up)   up.disabled   = (idx === 0);
      if (down) down.disabled = (idx === rows.length - 1);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 세그먼트 복제
  // ═══════════════════════════════════════════════════════════
  function duplicateSegment(row) {
    const tbody = row.parentNode;
    if (!tbody) return;

    const currentCount = tbody.querySelectorAll(".segment-row").length;
    if (currentCount >= 8) {
      SNW.toast("세그먼트는 최대 8개까지 추가 가능합니다.", "warn");
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
```

수정 ③: 프리셋 힌트 (신규 1개)

_suggestNextSegNo() 함수 아래에 삽입:

```javascript
  function bindPresetHint(row) {
    const sel = row.querySelector(".seg-preset");
    if (!sel) return;

    const show = () => {
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

    sel.addEventListener("mouseenter", show);
    sel.addEventListener("focus", show);
    sel.addEventListener("change", show);
  }
```

수정 ④: 미리보기 + live 배지 함수 (신규 3개)

openModal() 함수 바로 위에 삽입:

```javascript
  // ═══════════════════════════════════════════════════════════
  // 실행 미리보기 (period + 세그먼트 타임라인)
  // ═══════════════════════════════════════════════════════════
  let _previewTimer = null;
  function schedulePreviewUpdate() {
    if (_previewTimer) clearTimeout(_previewTimer);
    _previewTimer = setTimeout(updatePreviewPanel, 200);
  }

  function updatePreviewPanel() {
    const pvPeriod   = document.getElementById("pvPeriod");
    const pvDuration = document.getElementById("pvDuration");
    const pvSegCount = document.getElementById("pvSegCount");
    const pvRepeat   = document.getElementById("pvRepeat");
    const pvViz      = document.getElementById("pvTimelineViz");
    if (!pvViz) return;

    // period 정보
    const startTime = document.getElementById("periodStart")?.value || "00:00";
    const endTime   = document.getElementById("periodEnd")?.value   || "23:59";
    const daysArr   = [0,0,0,0,0,0,0];
    document.querySelectorAll("#periodDays input[type='checkbox']").forEach((c) => {
      const i = Number(c.dataset.index);
      if (i >= 0 && i < 7) daysArr[i] = c.checked ? 1 : 0;
    });
    const DAYS = ["월","화","수","목","금","토","일"];
    const onDays = daysArr.map((v, i) => v ? DAYS[i] : "").filter(Boolean);
    let dayStr = "미사용";
    if (onDays.length === 7) dayStr = "매일";
    else if (onDays.length === 5 && onDays[0]==="월" && onDays[4]==="금") dayStr = "주중";
    else if (onDays.length === 2 && onDays[5]==="토" && onDays[6]==="일") dayStr = "주말";
    else if (onDays.length > 0) dayStr = onDays.join(",");

    if (pvPeriod) pvPeriod.textContent = `${dayStr} ${startTime}~${endTime}`;

    // 세그먼트 수집 (DOM)
    const rows = Array.from(document.querySelectorAll("#segmentListBody .segment-row"));
    const segments = rows.map((row) => {
      const g = (s) => row.querySelector(s)?.value ?? "";
      return {
        mode:       g(".seg-mode") || "PRESET",
        presetCode: g(".seg-preset") || "",
        onMinutes:  Number(g(".seg-on-min"))  || 0,
        offMinutes: Number(g(".seg-off-min")) || 0,
        fixedSpeed: Number(g(".seg-fixed-speed")) || 0,
      };
    });

    const repeatEnabled = document.getElementById("repeatSegments")?.checked ?? true;
    const repeatCount   = Number(document.getElementById("repeatCount")?.value) || 0;

    let totalOn = 0, totalOff = 0;
    segments.forEach((s) => { totalOn += s.onMinutes; totalOff += s.offMinutes; });
    const cycleMinutes = totalOn + totalOff;

    let effCycles = 1;
    if (repeatEnabled) effCycles = (repeatCount > 0) ? repeatCount : 0;

    const fmtMin = (m) => {
      if (m < 60) return `${m}분`;
      const h = Math.floor(m / 60);
      const r = m % 60;
      return r ? `${h}시간 ${r}분` : `${h}시간`;
    };

    if (pvDuration) {
      if (!segments.length) pvDuration.textContent = "-";
      else if (effCycles === 0) pvDuration.textContent = `${fmtMin(cycleMinutes)} (무한)`;
      else pvDuration.textContent = `${fmtMin(cycleMinutes * effCycles)} (${effCycles}회)`;
    }
    if (pvSegCount) pvSegCount.textContent = String(segments.length);
    if (pvRepeat) {
      if (!repeatEnabled) pvRepeat.textContent = "1회";
      else if (repeatCount > 0) pvRepeat.textContent = `${repeatCount}회`;
      else pvRepeat.textContent = "무한";
    }

    if (!segments.length) {
      pvViz.innerHTML = '<div class="muted" style="padding:20px;text-align:center;width:100%;">세그먼트가 없습니다.</div>';
      return;
    }
    const total = segments.reduce((sum, s) => sum + s.onMinutes + s.offMinutes, 0);
    if (total === 0) {
      pvViz.innerHTML = '<div class="muted" style="padding:20px;text-align:center;width:100%;">시간 설정이 없습니다.</div>';
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
        bars.push(`<div class="pv-bar ${cls}" style="flex:${onPct};" title="${label} · ON ${s.onMinutes}분">${label}</div>`);
      }
      if (s.offMinutes > 0) {
        bars.push(`<div class="pv-bar pv-off" style="flex:${offPct};" title="S${idx+1} OFF ${s.offMinutes}분">OFF</div>`);
      }
    });
    pvViz.innerHTML = bars.join("");
  }

  // ═══════════════════════════════════════════════════════════
  // 실행 중 편집 배지 (schedule 활성 여부 확인)
  // ═══════════════════════════════════════════════════════════
  async function checkScheduleRunning(schedule) {
    if (!schedule || !schedule.schNo) return false;
    try {
      const data = await SNW.api.get(SNW_API.API_HTTP_STATE, "", true);
      if (!data || !data.control || !data.control.schedule) return false;
      const s = data.control.schedule;
      return s.fromRunSource && Number(s.schNo) === Number(schedule.schNo);
    } catch {
      return false;
    }
  }

  function updateLiveEditBadge(isRunning) {
    const badge = document.getElementById("liveEditBadge");
    if (!badge) return;
    badge.style.display = isRunning ? "block" : "none";
  }
```

수정 ⑤: openModal() — 후처리 추가

openModal() 함수 끝부분(modal.style.display = "flex"; 직전):

Before:

```javascript
      addSegmentRow({
        segId: 0, segNo: 10, onMinutes: 20, offMinutes: 10,
        mode: "PRESET", presetCode: "", styleCode: "", fixedSpeed: 0,
        adjust: { /* ... */ },
      }, true);
    }

    modal.style.display = "flex";
  }
```

After:

```javascript
      addSegmentRow({
        segId: 0, segNo: 10, onMinutes: 20, offMinutes: 10,
        mode: "PRESET", presetCode: "", styleCode: "", fixedSpeed: 0,
        adjust: { /* ... */ },
      }, true);
    }

    // 후처리
    updateMoveButtonStates();
    updatePreviewPanel();

    // 프리셋 힌트 초기화
    const hint = document.getElementById("presetHint");
    if (hint) {
      hint.innerHTML = '<span class="muted">💡 프리셋에 마우스를 올리면 설명이 표시됩니다.</span>';
      hint.classList.remove("active");
    }

    // live 배지: 초기 숨김 → 비동기 확인
    updateLiveEditBadge(false);
    if (schedule) {
      checkScheduleRunning(schedule).then((isRunning) => {
        const m = document.getElementById("scheduleModal");
        if (m && m.style.display === "flex") {
          updateLiveEditBadge(isRunning);
        }
      });
    }

    modal.style.display = "flex";
  }
```

수정 ⑥: bindEvents() — 삭제 위임 확장 + 반복/period 감지

기존 #segmentListBody 클릭 핸들러 교체:

Before:

```javascript
    $("#segmentListBody")?.addEventListener("click", (e) => {
      const del = e.target.closest(".btn-del-seg");
      if (del) {
        const row = del.closest(".segment-row");
        if (row && row.parentNode) row.parentNode.removeChild(row);
        return;
      }
      const aiBtn = e.target.closest(".btn-ai-adjust");
      if (aiBtn) { handleOptimizeAdjust(aiBtn); return; }
    });
```

After:

```javascript
    $("#segmentListBody")?.addEventListener("click", (e) => {
      // 삭제만 위임 처리 (순서/복제/AI는 행별 리스너)
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
```

추가: 반복/period 필드 변경 시 미리보기 갱신

bindEvents() 함수 끝부분에 삽입:

```javascript
    // 반복/period 변경 → 미리보기 갱신
    [
      "#repeatSegments", "#repeatCount",
      "#periodStart", "#periodEnd"
    ].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.addEventListener("change", schedulePreviewUpdate);
        el.addEventListener("input",  schedulePreviewUpdate);
      }
    });

    // periodDays 체크박스 변경 → 미리보기 갱신
    document.getElementById("periodDays")?.addEventListener("change", schedulePreviewUpdate);
```

---

🔧 적용 순서

Part A

1. P085_userProfiles_t2_071.js — saveProfile() 함수 교체

Part C

2. P080_sch_t2_071.html — 3곳 삽입
3. P080_sch_t2_071.css — 파일 끝 append
4. P080_sch_t2_071.js — 6곳 수정

공통

5. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

Part A (P085)

# 시나리오 기대
1 신규 프로필 생성 모달 유지, 세그먼트 ID 열 실제 숫자로 갱신
2 신규 생성 후 hidden profileId 채워짐 → 재저장 시 PUT
3 기존 프로필 수정 저장 후 모달 닫힘 (기존 정책)

Part C (P080)

# 시나리오 기대
1 세그먼트 3개 + ↑ 클릭 순서 교환 + segNo 재정렬
2 📋 클릭 바로 아래 복제, segNo 자동 증가
3 프리셋 select hover 상단 힌트 갱신
4 스케줄 저장 전 미리보기 📅 주중 08:00~12:00 + ⏱ 총 소요: 1시간 45분 (1회) + 타임라인
5 활성 스케줄 편집 상단 노란 배지 표시 + pulse 애니메이션
6 시간 조건 미충족 스케줄 편집 배지 숨김
7 반복 필드 변경 미리보기 즉시 갱신
8 periodDays 체크 토글 미리보기 📅 항목 갱신

---

📊 P080 최종 사용자 경험

이전 이후
세그먼트 순서 바꾸기 = 삭제+재입력 ↑↓ 클릭
세그먼트 재입력 📋 복제
AI 조정 ✅ 기존
프리셋 코드만 보임 hover 시 설명
저장 전 결과 예측 불가 period + 타임라인 미리보기
활성 스케줄 여부 불명 🟢 실행 중 배지

P085 ↔ P080 편집 UX 완전 통일.

---

🚀 다음 단계

Part A + C 완료. 남은 선택:

· (A) P050 chart에도 세그먼트 hover → 해당 시각 차트 강조 (cross-page)
· (B) Round 3 검증 매뉴얼 작성
· (C) 다른 페이지 확장
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.
