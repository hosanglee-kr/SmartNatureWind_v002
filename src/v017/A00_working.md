최종 검토 — 백엔드 + 프론트 정합성

✅ 반영 확인

항목 상태
S10_Simul_070.h — uint64_t timestamp ✅
S10_Simul_Core_070.cpp — S10_millis2EpochMs() ✅
S10_Simul_Core_070.cpp — 차트 샘플링 epoch 전환 ✅
P050_chart_t2_071.js — buildWsUrl 사용 ✅
P050_chart_t2_071.js — data.chart 경로 ✅
P050_chart_t2_071.js — Number(r.t) 직접 사용 ✅
P050_chart_t2_071.html — P001_API_070.js 로드 ✅
cfg_pages_070.json — P020 폐기, P050 _071 ✅

---

🔴 Critical — 데이터 누적 vs 교체

문제

백엔드 CT10_WS_trySendOne_v03 (chart 채널):

```cpp
CL_CT10_ControlManager::instance().exportChartJson(s_doc_chart, true);  // diffOnly=true
```

S10_Simul_IO_070.cpp toChartJson(p_diffOnly=true):

```cpp
if (p_diffOnly) {
    // 최신 1개만 전송
    uint8_t v_lastIdx = ...;
    v_entries.reserve(1);
    v_entries.push_back(s_chartBuffer[v_lastIdx]);
}
```

→ WS는 매번 "가장 최신 1개" 만 전송

프론트 processChartRecords:

```js
chartWind.data.datasets[0].data = toXY("wind");  // ← REPLACE!
```

결과: 매 메시지마다 차트 데이터가 1개 포인트로 덮어써짐. 누적 안 됨. 차트가 점 1개만 표시되고 히스토리 사라짐.

원인

P020/P050 모두 "full dump replacement" 패턴으로 작성됨. 백엔드 정책(diffOnly=true)과 불일치.

수정 — Append 방식으로 전환

P050_chart_t2_071.js의 processChartRecords 함수 전체 교체:

```js
// ======================= WS 데이터 → 차트 반영 =======================
// [diffOnly 대응] 백엔드는 매 tick마다 최신 1개만 전송
//  → 프론트는 append + max 120개 유지
const MAX_CHART_POINTS = 120;   // S10 CHART_CAPACITY와 동일

function _appendDataset(dataset, recs, key, transform) {
    if (!Array.isArray(dataset) || !Array.isArray(recs)) return;

    for (const r of recs) {
        const x = Number(r.t) || 0;
        if (!x) continue;

        let y = r[key];
        if (transform) y = transform(y);

        // 중복 timestamp 방지 (동일 t 는 마지막 값으로 교체)
        const last = dataset[dataset.length - 1];
        if (last && last.x === x) {
            last.y = y;
        } else {
            dataset.push({ x, y });
        }
    }

    // cap
    if (dataset.length > MAX_CHART_POINTS) {
        dataset.splice(0, dataset.length - MAX_CHART_POINTS);
    }
}

function processChartRecords(recs) {
    if (!Array.isArray(recs) || recs.length === 0) return;

    // 1) 풍속 / PWM
    _appendDataset(chartWind.data.datasets[0].data, recs, "wind");
    _appendDataset(chartWind.data.datasets[1].data, recs, "pwm");

    // 2) 핵심 파라미터
    _appendDataset(chartParam.data.datasets[0].data, recs, "intensity");
    _appendDataset(chartParam.data.datasets[1].data, recs, "variability");
    _appendDataset(chartParam.data.datasets[2].data, recs, "fanLimit");
    _appendDataset(chartParam.data.datasets[3].data, recs, "minFan");

    // 3) 난류/열기포
    _appendDataset(chartTurbThermSig.data.datasets[0].data, recs, "turb_sig");
    _appendDataset(chartTurbThermSig.data.datasets[1].data, recs, "turb_len");
    _appendDataset(chartTurbThermSig.data.datasets[2].data, recs, "therm_str");
    _appendDataset(chartTurbThermSig.data.datasets[3].data, recs, "therm_rad");

    // 4) 이벤트 (0/1)
    _appendDataset(chartEvent.data.datasets[0].data, recs, "gust",    (v) => v ? 1 : 0);
    _appendDataset(chartEvent.data.datasets[1].data, recs, "thermal", (v) => v ? 1 : 0);

    // 5) 프리셋 인덱스
    _appendDataset(chartPreset.data.datasets[0].data, recs, "preset");

    // 6) 타이밍
    _appendDataset(chartTiming.data.datasets[0].data, recs, "sim_int");
    _appendDataset(chartTiming.data.datasets[1].data, recs, "gust_int");
    _appendDataset(chartTiming.data.datasets[2].data, recs, "thermal_int");

    charts.forEach((c) => c.update("none"));

    const last = recs[recs.length - 1];
    if (refreshLabel && last?.t) {
        const ts = new Date(Number(last.t)).toLocaleTimeString();
        refreshLabel.textContent = `🕒 WS 업데이트: ${ts} (샘플 ${recs.length}개)`;
    }
}
```

변경 요약:

· data = toXY(...) → _appendDataset(...) 로 교체
· 120개 상한 (MAX_CHART_POINTS)
· 중복 t 방지 (동일 ms 재수신 시 마지막 값 유지)

---

🟡 관찰 (선택)

관찰 1. 초기 페이지 진입 시 히스토리 없음

백엔드 (W10_Web_WS_070.cpp):

```cpp
s_wsServerChart->onEvent([](...) {
    if (type == WS_EVT_CONNECT) {
        // 초기 state 전송 없음 (chart는 tick마다 diffOnly)
    }
});
```

결과: 페이지 열면 빈 차트에서 시작. 매 초 1개씩 누적되어 120초 후 완전 채워짐.

선택 개선 (백엔드):

```cpp
// WS_EVT_CONNECT 시 full dump 1회 전송
if (type == WS_EVT_CONNECT) {
    JsonDocument v_doc;
    s_control->exportChartJson(v_doc, false);   // ← diffOnly=false
    String v_json;
    serializeJson(v_doc, v_json);
    client->text(v_json);
}
```

주의: diffOnly=false는 G_S10_CHART_FULL_MIN_MS=10초 스로틀 있음. 연결 직후엔 스킵될 수 있음.

결론: 현재 상태 유지 권장 (관찰만, 스코프 외).

---

관찰 2. _tickNowSec 사용

S10_Simul_Core_070.cpp:

```cpp
_tickNowSec = (float)_tickNowMs / 1000.0f;
```

차트 샘플링에는 _tickNowMs만 사용. _tickNowSec은 다른 곳(phase, gust 등)에서 사용 중 → 문제 없음.

---

관찰 3. 시간 표시 포맷

```js
new Date(Number(last.t)).toLocaleTimeString()
```

· epoch ms → 로컬 시간 표시
· 사용자 브라우저 타임존 기준
· ESP32가 UTC epoch 반환하므로 사용자 로컬 시간으로 자동 변환 ✅

---

관찰 4. Chart.js time axis (Luxon)

```js
scales: {
    x: {
        type: "time",
        time: { unit: "second" }
    }
}
```

· Luxon adapter가 epoch ms를 자동 파싱
· x축 라벨: "HH:mm:ss" (로컬) ✅

---

📋 최종 조치 요약

# 조치 위치 소요
1 processChartRecords append 방식 전환 P050_chart_t2_071.js 10분
2 MAX_CHART_POINTS=120 상수 동일 -
3 중복 timestamp 방지 동일 -

나머지는 정확히 반영됨.

---

🎯 배포 후 검증

1. epoch ms

```
1. SNTP sync 확인 (시리얼: [TM10] SNTP synced OK)
2. 차트 페이지 열기
3. 개발자도구 → Network → WS → /ws/chart
4. 메시지 확인:
   {"chart":[{"t":1726900000123,"wind":3.2,...}]}
   ← 13자리 숫자 (epoch ms)
5. Chart x축: "14:23:20" 형식 (로컬 시간)
```

2. 데이터 누적

```
1. 페이지 열고 30초 대기
2. 차트에 30개 포인트 누적 표시
3. 120초 후 상한 도달 (계속 유지)
4. 시리얼 로그 폭주 없음
```

3. WS 재연결

```
1. WiFi 일시 차단
2. 시리얼: [W10] WS /chart 연결 끊김
3. 프론트: "❌ WS 연결 끊김" + 5초 후 재연결
4. WiFi 복구 후 자동 재개
```

4. 일시정지/재개

```
1. ⏸ 클릭 → 새 데이터 무시
2. ▶ 클릭 → 다시 append
3. 기존 데이터 유지 확인
```

---

📌 다음 단계

조치 1 반영 후 (10분 소요) → 배포 검증.

남은 페이지:

· P040 (Dashboard)
· P060 (Sim Details)
· P090 (Info/Help)
· R3-P010-Prof (D-1c 나머지: P010에 프로파일 실행)

어떻게 진행할까요?

· (A) 조치 1 즉시 반영 → 배포 검증
· (B) R3-P060 (Sim Details) 먼저 점검
· (C) R3-P040 (Dashboard) 점검
· (D) 다른 이슈
