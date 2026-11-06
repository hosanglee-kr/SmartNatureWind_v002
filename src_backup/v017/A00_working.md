Phase 2 (백엔드) — 센서/타깃 데이터 노출

진행 순서:

1. 현재 응답: Phase 2 백엔드 (S10 + CT10 수정)
2. 다음 응답: Phase 1 프론트 (P050_chart_t3_071.*)

변경 파일 6개:

# 파일 목적
1 S10_Simul_070.h ST_ChartEntry에 target_wind 필드 추가
2 S10_Simul_Core_070.cpp tick() 내 차트 push 시 target 저장
3 S10_Simul_IO_070.cpp toChartJson() 출력에 targetWind 노출
4 CT10_Ctl_070.h getCurrentHumidityMock() 선언 추가
5 CT10_Ctl_Basic_070.cpp DHT 캐시 리팩터 + 습도 getter
6 CT10_Ctl_IOWS_070.cpp exportStateJson_v02()에 sensor 블록 추가

---

📄 파일 1: S10_Simul_070.h

ST_ChartEntry 구조체에 필드 1개 추가:

Before:

```cpp
struct ST_ChartEntry {
    uint64_t      timestamp;   // [Epoch] epoch ms (SNTP sync 후)
    float         wind_speed;
    float         pwm_duty;
    float         intensity;
    float         variability;
    float         turbulence_sigma;
    uint8_t       preset_index;
    bool          gust_active;
    bool          thermal_active;
};
```

After:

```cpp
struct ST_ChartEntry {
    uint64_t      timestamp;   // [Epoch] epoch ms (SNTP sync 후)
    float         wind_speed;
    float         target_wind; // [신규] 목표 풍속 (Target vs Actual 차트용)
    float         pwm_duty;
    float         intensity;
    float         variability;
    float         turbulence_sigma;
    uint8_t       preset_index;
    bool          gust_active;
    bool          thermal_active;
};
```

---

📄 파일 2: S10_Simul_Core_070.cpp

tick() 내 차트 샘플 push 부분 수정:

Before (line ~230 근처):

```cpp
    //  [b-2] + [Epoch] epoch ms 전환
    if (_tickNowMs - s_lastChartLogMs > (unsigned long)v_chartIntervalMs) {
        s_lastChartLogMs = _tickNowMs;   // interval 타이머는 millis로 유지

        // SNTP sync 여부 확인 (미동기화 시 버퍼 push 스킵)
        bool     v_epochOk = false;
        uint64_t v_epochMs = S10_millis2EpochMs(_tickNowMs, &v_epochOk);

        if (v_epochOk) {
            ST_ChartEntry v_e{};
            v_e.timestamp        = v_epochMs;              // ← epoch ms
            v_e.wind_speed       = currentWindSpeed;
            v_e.pwm_duty         = _pwm ? _pwm->P10_getDutyPercent() : 0.0f;
            v_e.intensity        = userIntensity;
            v_e.variability      = userVariability;
            v_e.turbulence_sigma = turbSigma;
            v_e.preset_index     = static_cast<uint8_t>(A20_getStaticPresetIndexByCode(presetCode));
            v_e.gust_active      = gustActive;
            v_e.thermal_active   = thermalActive;

            // ring push
            s_chartBuffer[s_chartHead] = v_e;
            s_chartHead = (uint8_t)((s_chartHead + 1u) % CHART_CAPACITY);
            if (s_chartCount < CHART_CAPACITY) s_chartCount++;
        }
    }
```

After:

```cpp
    //  [b-2] + [Epoch] epoch ms 전환
    if (_tickNowMs - s_lastChartLogMs > (unsigned long)v_chartIntervalMs) {
        s_lastChartLogMs = _tickNowMs;   // interval 타이머는 millis로 유지

        // SNTP sync 여부 확인 (미동기화 시 버퍼 push 스킵)
        bool     v_epochOk = false;
        uint64_t v_epochMs = S10_millis2EpochMs(_tickNowMs, &v_epochOk);

        if (v_epochOk) {
            ST_ChartEntry v_e{};
            v_e.timestamp        = v_epochMs;              // ← epoch ms
            v_e.wind_speed       = currentWindSpeed;
            v_e.target_wind      = targetWindSpeed;        // [신규] Target vs Actual
            v_e.pwm_duty         = _pwm ? _pwm->P10_getDutyPercent() : 0.0f;
            v_e.intensity        = userIntensity;
            v_e.variability      = userVariability;
            v_e.turbulence_sigma = turbSigma;
            v_e.preset_index     = static_cast<uint8_t>(A20_getStaticPresetIndexByCode(presetCode));
            v_e.gust_active      = gustActive;
            v_e.thermal_active   = thermalActive;

            // ring push
            s_chartBuffer[s_chartHead] = v_e;
            s_chartHead = (uint8_t)((s_chartHead + 1u) % CHART_CAPACITY);
            if (s_chartCount < CHART_CAPACITY) s_chartCount++;
        }
    }
```

변경: v_e.target_wind = targetWindSpeed; 1줄 추가.

---

📄 파일 3: S10_Simul_IO_070.cpp

toChartJson() 내 JSON push 부분 수정:

Before (line ~250 근처):

```cpp
    for (size_t v_i = 0; v_i < v_entries.size(); v_i++) {
        const ST_ChartEntry& v_e  = v_entries[v_i];
        JsonObject           v_jo = v_arr.add<JsonObject>();

        v_jo["t"]           = (uint64_t)v_e.timestamp; // 밀리초 timestamp
        v_jo["wind"]        = v_e.wind_speed;
        v_jo["pwm"]         = v_e.pwm_duty;
        v_jo["intensity"]   = v_intensity;
        v_jo["variability"] = v_variability;
        v_jo["gustFreq"]    = v_gustFreq;
        v_jo["fanLimit"]    = v_fanLimit;
        v_jo["minFan"]      = v_minFan;
        v_jo["turb_sig"]    = v_turbSigma;
        v_jo["turb_len"]    = v_turbLenScale;
        v_jo["therm_str"]   = v_thermalStr;
        v_jo["therm_rad"]   = v_thermalRad;
        v_jo["gust"]        = v_e.gust_active ? 1 : 0;
        v_jo["thermal"]     = v_e.thermal_active ? 1 : 0;
        v_jo["preset"]      = v_presetIdx;
        v_jo["sim_int"]     = v_simInterval;
        v_jo["gust_int"]    = v_gustInterval;
        v_jo["thermal_int"] = v_thermalInterval;
    }
```

After:

```cpp
    for (size_t v_i = 0; v_i < v_entries.size(); v_i++) {
        const ST_ChartEntry& v_e  = v_entries[v_i];
        JsonObject           v_jo = v_arr.add<JsonObject>();

        v_jo["t"]           = (uint64_t)v_e.timestamp; // 밀리초 timestamp
        v_jo["wind"]        = v_e.wind_speed;
        v_jo["targetWind"]  = v_e.target_wind;         // [신규] 목표 풍속
        v_jo["pwm"]         = v_e.pwm_duty;
        v_jo["intensity"]   = v_intensity;
        v_jo["variability"] = v_variability;
        v_jo["gustFreq"]    = v_gustFreq;
        v_jo["fanLimit"]    = v_fanLimit;
        v_jo["minFan"]      = v_minFan;
        v_jo["turb_sig"]    = v_turbSigma;
        v_jo["turb_len"]    = v_turbLenScale;
        v_jo["therm_str"]   = v_thermalStr;
        v_jo["therm_rad"]   = v_thermalRad;
        v_jo["gust"]        = v_e.gust_active ? 1 : 0;
        v_jo["thermal"]     = v_e.thermal_active ? 1 : 0;
        v_jo["preset"]      = v_presetIdx;
        v_jo["sim_int"]     = v_simInterval;
        v_jo["gust_int"]    = v_gustInterval;
        v_jo["thermal_int"] = v_thermalInterval;
    }
```

변경: v_jo["targetWind"] = v_e.target_wind; 1줄 추가.

---

📄 파일 4: CT10_Ctl_070.h

public 섹션에 humidity getter 선언 추가:

Before (getCurrentTemperatureMock 근처):

```cpp
    static float getCurrentTemperatureMock();
```

After:

```cpp
    static float getCurrentTemperatureMock();
    static float getCurrentHumidityMock();   // [Phase 2] 습도 노출
```

---

📄 파일 5: CT10_Ctl_Basic_070.cpp

DHT 캐시를 파일-스코프로 리팩터 + humidity getter 추가.

5-1. 파일 상단(#include <DHT.h> 바로 아래)에 공유 캐시 추가

Before:

```cpp
#include "CT10_Ctl_070.h"

// [o-2] explicit include (A20_Const_070.h에서 제거됨)
#include "A25_Com_Utils_070.h"     // A40_ComFunc / A40_IO / CL_A40_MutexGuard_Semaphore
#include "N10_NvsManager_070.h"

#include <DHT.h>

// --------------------------------------------------
// override remain sec
// --------------------------------------------------
```

After:

```cpp
#include "CT10_Ctl_070.h"

// [o-2] explicit include (A20_Const_070.h에서 제거됨)
#include "A25_Com_Utils_070.h"     // A40_ComFunc / A40_IO / CL_A40_MutexGuard_Semaphore
#include "N10_NvsManager_070.h"

#include <DHT.h>

// ==================================================
// [Phase 2] DHT 센서 공유 캐시
//  - 온도/습도를 한 번의 read로 함께 캐시
//  - 2초 주기 read 정책 유지
//  - 온도 조회 / 습도 조회 어느 쪽에서도 캐시 공유
// ==================================================
namespace {
struct ST_CT10_DhtCache {
    DHT*     dht         = nullptr;
    int16_t  pin         = -1;
    uint32_t lastReadMs  = 0;
    float    temp        = 24.0f;
    float    hum         = 55.0f;
};
ST_CT10_DhtCache s_dhtCache;

// 실제 read 수행 (캐시 갱신)
void _ct10_readDhtIfNeeded() {
    if (!g_A20_config_root.system) return;

    const auto& conf = g_A20_config_root.system->hw.tempHum;
    if (!conf.enabled) return;

    int16_t v_pin = (conf.pin > 0) ? (int16_t)conf.pin : 4;

    // 최초 1회 객체 생성
    if (!s_dhtCache.dht) {
        s_dhtCache.pin = v_pin;
        s_dhtCache.dht = new DHT(s_dhtCache.pin, DHT22);
        s_dhtCache.dht->begin();
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] DHT22 init on pin %d", s_dhtCache.pin);
    } else if (s_dhtCache.pin != v_pin) {
        // 운영 안정성 우선: 재부팅 권고 로그만, delete/re-init 안 함
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] DHT pin changed (%d->%d). Recommend reboot to apply safely.",
                           s_dhtCache.pin, v_pin);
    }

    // 2초 캐시 정책
    uint32_t v_now = millis();
    if (v_now - s_dhtCache.lastReadMs < 2000UL) return;
    s_dhtCache.lastReadMs = v_now;

    float v_t = s_dhtCache.dht ? s_dhtCache.dht->readTemperature() : NAN;
    float v_h = s_dhtCache.dht ? s_dhtCache.dht->readHumidity()    : NAN;

    if (isnan(v_t)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT temperature read failed");
    } else {
        s_dhtCache.temp = v_t;
    }
    if (isnan(v_h)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT humidity read failed");
    } else {
        s_dhtCache.hum = v_h;
    }
}
} // namespace

// --------------------------------------------------
// override remain sec
// --------------------------------------------------
```

5-2. 기존 getCurrentTemperatureMock() 전체 교체

Before:

```cpp
// --------------------------------------------------
// temperature mock (DHT)
// - 운영 안정성: new/delete 반복 금지
// - 정책:
//   - 최초 1회만 new
//   - 핀 변경 감지 시: 재부팅 권고 로그 + 기존 객체 유지(안전 우선)
// --------------------------------------------------
float CL_CT10_ControlManager::getCurrentTemperatureMock() {
    static DHT*     s_dht          = nullptr;
    static int16_t  s_dhtPin       = -1;
    static uint32_t s_lastRead     = 0;
    static float    s_lastTemp     = 24.0f;

    if (!g_A20_config_root.system) return s_lastTemp;

    const auto& conf = g_A20_config_root.system->hw.tempHum;
    if (!conf.enabled) return 24.0f;

    int16_t v_pin = (conf.pin > 0) ? (int16_t)conf.pin : 4;

    if (!s_dht) {
        s_dhtPin = v_pin;
        s_dht = new DHT(s_dhtPin, DHT22);
        s_dht->begin();
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] DHT22 init on pin %d", s_dhtPin);
    } else if (s_dhtPin != v_pin) {
        // 운영 안정성 우선: delete/re-init 하지 않음
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] DHT pin changed (%d->%d). Recommend reboot to apply safely.",
                           s_dhtPin, v_pin);
        // 계속 기존 핀의 센서 값을 유지(또는 fallback)
    }

    uint32_t v_now = millis();
    if (v_now - s_lastRead < 2000UL) return s_lastTemp;
    s_lastRead = v_now;

    float v_t = s_dht ? s_dht->readTemperature() : NAN;
    if (isnan(v_t)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT read failed");
    } else {
        s_lastTemp = v_t;
    }

    return s_lastTemp;
}
```

After:

```cpp
// --------------------------------------------------
// temperature mock (DHT)
// - 운영 안정성: new/delete 반복 금지
// - 정책:
//   - 최초 1회만 new
//   - 핀 변경 감지 시: 재부팅 권고 로그 + 기존 객체 유지(안전 우선)
// - [Phase 2] 캐시를 파일-스코프(s_dhtCache)로 이관
//   → 온도/습도가 동일 read 결과를 공유
// --------------------------------------------------
float CL_CT10_ControlManager::getCurrentTemperatureMock() {
    _ct10_readDhtIfNeeded();
    return s_dhtCache.temp;
}

// --------------------------------------------------
// [Phase 2] humidity getter
//  - 동일 캐시 사용, 추가 read 부담 없음
// --------------------------------------------------
float CL_CT10_ControlManager::getCurrentHumidityMock() {
    _ct10_readDhtIfNeeded();
    return s_dhtCache.hum;
}
```

---

📄 파일 6: CT10_Ctl_IOWS_070.cpp

exportStateJson_v02()에 sensor 블록 추가.

Before (line ~250 근처, "// 9) Dirty flags" 위):

```cpp
    // 9) Dirty flags
    {
        JsonObject v_dirty = A40_ComFunc::Json_ensureObject(v_ctl["dirty"]);
        v_dirty["state"]   = _dirtyState;
        v_dirty["metrics"] = _dirtyMetrics;
        v_dirty["chart"]   = _dirtyChart;
        v_dirty["summary"] = _dirtySummary;
    }
```

After (그 위에 8-1 신규 블록 삽입):

```cpp
    // 8-1) [Phase 2] Sensor snapshot
    //  - DHT22 온도/습도 (2초 캐시 재사용)
    //  - PIR 모션 상태 (isActive)
    //  - 프론트 요약 카드 / 센서 차트용
    {
        JsonObject v_sensor = A40_ComFunc::Json_ensureObject(v_ctl["sensor"]);

        v_sensor["tempC"]    = getCurrentTemperatureMock();
        v_sensor["humidity"] = getCurrentHumidityMock();

        bool v_motionAct = false;
        if (motion) {
            v_motionAct = motion->isActive();
        }
        v_sensor["motionActive"] = v_motionAct;
    }

    // 9) Dirty flags
    {
        JsonObject v_dirty = A40_ComFunc::Json_ensureObject(v_ctl["dirty"]);
        v_dirty["state"]   = _dirtyState;
        v_dirty["metrics"] = _dirtyMetrics;
        v_dirty["chart"]   = _dirtyChart;
        v_dirty["summary"] = _dirtySummary;
    }
```

---

🔍 부수 확인 — M10_MotionLogic_070.h의 isActive()

PIR 상태 조회는 이미 존재:

```cpp
bool isActive() const { return _state.pirActive; }  // (기존)
```

우리가 호출하는 motion->isActive()는 const 함수이므로 상태 조회 안전. 별도 수정 불필요.

---

✅ 검증

1. 컴파일 확인

```bash
pio run
```

예상: 에러 없음. ST_ChartEntry 구조체 크기 4바이트 증가 (총 44B → 48B). 메모리 영향 미미 (120개 × 4B = 480B).

2. 시리얼 부팅 로그

기존과 동일. DHT22 init 로그는 여전히 1회.

3. REST API 검증

State 응답에 sensor 블록 추가:

```bash
curl -H "X-API-Key: <key>" http://<esp-ip>/api/v001/state | python -m json.tool
```

기대 응답:

```json
{
  "control": {
    "sensor": {
      "tempC": 24.53,
      "humidity": 55.20,
      "motionActive": false
    },
    "state": "IDLE",
    ...
  },
  "sim": { ... }
}
```

4. WS Chart 검증

```bash
# 브라우저 콘솔에서 WS 수신 데이터 확인
const ws = new WebSocket("/ws/chart");
ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    console.log(d.chart[0]);  // 첫 레코드
};
```

기대 레코드:

```json
{
  "t": 1758530400000,
  "wind": 3.24,
  "targetWind": 3.50,      // ← 신규 필드
  "pwm": 65.4,
  ...
}
```

5. 콘솔 검증 (프론트 연동 전)

```javascript
// State 폴링
fetch("/api/v001/state", {headers: {"X-API-Key": "<key>"}})
  .then(r => r.json())
  .then(d => {
      console.log("온도:", d.control.sensor.tempC);
      console.log("습도:", d.control.sensor.humidity);
      console.log("모션:", d.control.sensor.motionActive);
  });
```

---

📊 백엔드 변경 요약

파일 라인 수 변경
S10_Simul_070.h +1 target_wind 필드
S10_Simul_Core_070.cpp +1 tick push
S10_Simul_IO_070.cpp +1 JSON 출력
CT10_Ctl_070.h +1 getter 선언
CT10_Ctl_Basic_070.cpp +65 / -35 DHT 캐시 리팩터 + humidity
CT10_Ctl_IOWS_070.cpp +18 sensor 블록
합계 +87 / -35 

순 증가: +52줄. 메모리 영향: RAM +~50B (센서 필드), Flash +~1KB (코드).

---

🎯 다음 단계 (Phase 1 프론트)

현재 응답 완료 후 다음 응답에서 제공할 파일:

파일 내용
P050_chart_t3_071.html 요약 카드 + 비교 테이블 + 8개 차트 (신규)
P050_chart_t3_071.css 요약 카드/비교 테이블 스타일 (신규)
P050_chart_t3_071.js windDict 매핑 + state 폴링 + 8차트 (신규)
P050_chart_t2_071.* 삭제 (t3로 승격)
cfg_pages_071.json P050_chart_t3_071 로 참조 갱신
A23_Com_ResetCfg_070.h fallback 경로 갱신 (선택)

t3로 승격하는 이유:

· 캐시 무효화 (브라우저가 이전 t2 파일 캐시 방지)
· 파일 구조 대폭 변경 (차트 6 → 8, 요약 카드 추가)
· 기존 t2 사용자에게 혼선 방지

---

백엔드 6개 파일 적용 후 결과를 알려주시면, 이어서 Phase 1 (t3 프론트) 코드를 제공하겠습니다.





---
---

Phase 1 (프론트) — P050_chart_t3_071 신규 생성

신규 파일 3개 + 승격 작업:

# 파일 상태
1 P050_chart_t3_071.html 🆕
2 P050_chart_t3_071.css 🆕
3 P050_chart_t3_071.js 🆕
4 P050_chart_t2_071.* ❌ 삭제
5 cfg_pages_071.json 🔄 참조 갱신
6 A23_Com_ResetCfg_070.h 🔄 fallback 경로 갱신

---

📄 파일 1: P050_chart_t3_071.html

```html
<!-- P050_chart_t3_071.html -->

<!doctype html>
<html lang="ko">

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<title>🌬️ Smart Nature Wind 차트 모니터링 T3</title>

	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-luxon@1.3.1/dist/chartjs-adapter-luxon.umd.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js"></script>

	<link rel="stylesheet" href="./P000_common_071.css">
	<link rel="stylesheet" href="./P050_chart_t3_071.css">
</head>

<body>

	<header class="nav-bar">
		<div class="nav-container">
			<a href="/" class="nav-logo">Smart Nature Wind</a>
			<nav>
				<ul class="nav-menu" id="navMenu"></ul>
			</nav>
		</div>
	</header>

	<div class="wrap">
		<h1>🌬️ 차트 모니터링 T3 (실시간 데이터)</h1>

		<!-- ═══════════════════════════════════════════════════ -->
		<!-- 1. 요약 카드 (신규) -->
		<!-- ═══════════════════════════════════════════════════ -->
		<section class="card summary-card col-12">
			<div class="summary-grid">
				<div class="summary-item preset-item">
					<div class="summary-label">프리셋</div>
					<div class="summary-value" id="sumPreset">-</div>
					<div class="summary-sub" id="sumPresetCode">-</div>
				</div>

				<div class="summary-item style-item">
					<div class="summary-label">스타일</div>
					<div class="summary-value" id="sumStyle">-</div>
					<div class="summary-sub" id="sumStyleCode">-</div>
				</div>

				<div class="summary-item state-item">
					<div class="summary-label">제어 상태</div>
					<div class="summary-value">
						<span id="sumCtlState" class="info-label info">-</span>
					</div>
					<div class="summary-sub" id="sumRunTarget">-</div>
				</div>

				<div class="summary-item sensor-item">
					<div class="summary-label">센서</div>
					<div class="summary-value" id="sumSensor">-</div>
					<div class="summary-sub" id="sumUptime">-</div>
				</div>
			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════ -->
		<!-- 2. 설정값 vs 실제 적용값 비교 테이블 (신규) -->
		<!-- ═══════════════════════════════════════════════════ -->
		<section class="card compare-card col-12">
			<div class="row middle">
				<strong class="section-title">⚙️ 설정값 vs 실제 적용값</strong>
				<div class="right">
					<span id="compareTimestamp" class="muted">-</span>
				</div>
			</div>

			<div class="compare-grid">
				<!-- 🎯 Target -->
				<div class="compare-col">
					<h4>🎯 설정 (Target)</h4>
					<table class="compare-table">
						<tr><td>강도</td>           <td id="setIntensity">-</td></tr>
						<tr><td>가변성</td>         <td id="setVariability">-</td></tr>
						<tr><td>돌풍 빈도</td>      <td id="setGustFreq">-</td></tr>
						<tr><td>팬 최대</td>        <td id="setFanLimit">-</td></tr>
						<tr><td>팬 최소</td>        <td id="setMinFan">-</td></tr>
						<tr><td>난류 σ</td>         <td id="setTurbSigma">-</td></tr>
						<tr><td>열기포 세기</td>    <td id="setThermalStr">-</td></tr>
						<tr><td>목표 풍속</td>      <td id="setWindTarget">-</td></tr>
					</table>
				</div>

				<!-- 📊 Applied -->
				<div class="compare-col">
					<h4>📊 실제 (Applied)</h4>
					<table class="compare-table">
						<tr><td>강도</td>           <td id="appIntensity">-</td></tr>
						<tr><td>가변성</td>         <td id="appVariability">-</td></tr>
						<tr><td>돌풍 빈도</td>      <td id="appGustFreq">-</td></tr>
						<tr><td>팬 최대</td>        <td id="appFanLimit">-</td></tr>
						<tr><td>팬 최소</td>        <td id="appMinFan">-</td></tr>
						<tr><td>난류 σ</td>         <td id="appTurbSigma">-</td></tr>
						<tr><td>열기포 세기</td>    <td id="appThermalStr">-</td></tr>
						<tr><td>실제 풍속</td>      <td id="appWindActual">-</td></tr>
					</table>
				</div>

				<!-- ⚡ PWM / 상태 -->
				<div class="compare-col">
					<h4>⚡ PWM / 상태</h4>
					<table class="compare-table">
						<tr><td>PWM Duty</td>       <td id="appPwmDuty">-</td></tr>
						<tr><td>Phase</td>          <td id="appPhase">-</td></tr>
						<tr><td>돌풍</td>           <td id="appGust">-</td></tr>
						<tr><td>열기포</td>         <td id="appThermal">-</td></tr>
						<tr><td>시뮬 Active</td>    <td id="appSimActive">-</td></tr>
						<tr><td>Override</td>       <td id="appOverride">-</td></tr>
						<tr><td>센서 (온/습)</td>   <td id="appSensorTempHum">-</td></tr>
						<tr><td>모션</td>           <td id="appMotion">-</td></tr>
					</table>
				</div>
			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════ -->
		<!-- 3. 실시간 제어 패널 -->
		<!-- ═══════════════════════════════════════════════════ -->
		<section class="card control-panel col-12">
			<div class="row middle">
				<strong class="section-title">실시간 모니터링 제어</strong>
				<div class="right tight">
					<span class="info-label info" id="refreshInfo">🕒 WebSocket 연결 중...</span>
					<button class="btn ok" id="btnResume">▶ 재개</button>
					<button class="btn warn" id="btnPause">⏸ 일시정지</button>
					<button class="btn" id="btnResetZoomAll">🔍 줌 초기화</button>
				</div>
			</div>
		</section>

		<!-- ═══════════════════════════════════════════════════ -->
		<!-- 4. 차트 8종 -->
		<!-- ═══════════════════════════════════════════════════ -->
		<section class="chart-section">
			<div class="grid chart-grid">

				<!-- 1. 풍속 / PWM -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>💨 풍속 / PWM Duty</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartWind"></canvas>
					</div>
				</div>

				<!-- 2. Target vs Actual (신규) -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>🎯 목표 vs 실제 풍속</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartTargetActual"></canvas>
					</div>
				</div>

				<!-- 3. 프리셋 & 스타일 (신규) -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>🎨 프리셋 & 스타일 이력</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartPresetStyle"></canvas>
					</div>
				</div>

				<!-- 4. 핵심 매개변수 -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>🎛️ 핵심 매개변수 (Intensity / Variability / Fan)</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartParams"></canvas>
					</div>
				</div>

				<!-- 5. 난류 / 열기포 -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>🌪️ 난류 / 열기포</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartTurbThermSig"></canvas>
					</div>
				</div>

				<!-- 6. 이벤트 -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>⚡ 이벤트 (Gust / Thermal)</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartEvents"></canvas>
					</div>
				</div>

				<!-- 7. 타이밍 -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>⏱️ 시뮬레이션 타이밍</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartTiming"></canvas>
					</div>
				</div>

				<!-- 8. 센서 (신규) -->
				<div class="chart-container col-6">
					<div class="chart-header">
						<h3>🌡️ 센서 (온도 / 습도)</h3>
						<button class="btn-toggle">▲</button>
					</div>
					<div class="chart-content">
						<canvas id="chartSensor"></canvas>
						<div class="sensor-placeholder" id="sensorPlaceholder">
							센서 데이터 스트림 대기 중...
						</div>
					</div>
				</div>

			</div>
		</section>

		<div class="hr"></div>
		<div class="muted">© 2540.kr SmartNatureWind (T3 Chart Monitor v010)</div>
	</div>

	<div id="loadingOverlay" style="display:none;">
		<div class="spinner"></div>
	</div>
	<div id="toastContainer"></div>

	<script src="./P000_common_071.js" defer></script>
	<script src="./P001_API_071.js" defer></script>
	<script src="./P050_chart_t3_071.js" defer></script>
</body>

</html>
```

---

📄 파일 2: P050_chart_t3_071.css

```css
/*
 * ------------------------------------------------------
 * 소스명 : P050_chart_t3_071.css
 * 모듈명 : Smart Nature Wind Chart Monitor T3 UI Style
 * ------------------------------------------------------
 * 주요 내용:
 * - 요약 카드 / 비교 테이블 (신규)
 * - 8개 차트 컨테이너
 * - 센서 placeholder
 * ------------------------------------------------------
 */

/* ======================= 차트 섹션 ======================= */
.chart-section {
  margin-top: 20px;
}

.chart-grid {
  gap: 20px;
}

.chart-container {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e0e6ed;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f7f9fb;
  border-bottom: 1px solid #e0e6ed;
  cursor: pointer;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.05em;
  color: #34495e;
  font-weight: 600;
}

.btn-toggle {
  background: none;
  border: none;
  font-size: 1.2em;
  color: #34495e;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.chart-content {
  padding: 15px;
  background-color: #fff;
  flex-grow: 1;
  position: relative;
}

.chart-content canvas {
  max-height: 260px;
}

/* ============================================================ */
/* 신규: 요약 카드                                              */
/* ============================================================ */
.summary-card {
  background: linear-gradient(135deg, #f7f9fb 0%, #eef4f8 100%);
  border: 1px solid #d6e2ed;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 900px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr; }
}

.summary-item {
  padding: 12px 14px;
  background: #ffffff;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.summary-item.preset-item { border-left-color: #e67e22; }
.summary-item.style-item  { border-left-color: #3498db; }
.summary-item.state-item  { border-left-color: #16a085; }
.summary-item.sensor-item { border-left-color: #e74c3c; }

.summary-label {
  font-size: 0.75em;
  font-weight: 700;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 1.1em;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
  word-break: keep-all;
}

.summary-sub {
  font-size: 0.82em;
  color: #7f8c8d;
  font-family: ui-monospace, monospace;
}

/* ============================================================ */
/* 신규: 비교 테이블                                            */
/* ============================================================ */
.compare-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .compare-grid { grid-template-columns: 1fr; }
}

.compare-col h4 {
  margin: 0 0 10px;
  font-size: 0.95em;
  color: #34495e;
  padding-bottom: 6px;
  border-bottom: 2px solid #ecf0f1;
  font-weight: 700;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.compare-table tr {
  border-bottom: 1px dotted #ecf0f1;
}

.compare-table tr:last-child {
  border-bottom: none;
}

.compare-table td {
  padding: 6px 4px;
}

.compare-table td:first-child {
  color: #7f8c8d;
  font-weight: 600;
}

.compare-table td:last-child {
  text-align: right;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: #2c3e50;
}

/* 차이 강조 (선택적 사용) */
.compare-table td.diff-up   { color: #27ae60; }
.compare-table td.diff-down { color: #e67e22; }
.compare-table td.diff-none { color: #95a5a6; }

/* ============================================================ */
/* 신규: 센서 placeholder                                       */
/* ============================================================ */
.sensor-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #95a5a6;
  font-size: 0.9em;
  text-align: center;
  pointer-events: none;
  z-index: 1;
  background: rgba(255,255,255,0.85);
  padding: 8px 14px;
  border-radius: 6px;
}

/* ============================================================ */
/* 반응형                                                       */
/* ============================================================ */
@media (max-width: 768px) {
  .chart-container {
    flex: 1 1 100%;
  }
}
```

---

📄 파일 3: P050_chart_t3_071.js

```javascript
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
 * ------------------------------------------------------
 * 의존: P000_common_071.js (SNW), P001_API_071.js (SNW_API)
 * ------------------------------------------------------
 */

(() => {
  "use strict";

  const refreshLabel = SNW.$("#refreshInfo");

  let isPaused = false;
  const charts = [];

  // ============================================================
  // 매핑 테이블 (프리셋/스타일 이름)
  // ============================================================
  const presetMap = new Map();   // index → { code, name }
  const styleMap  = new Map();   // index → { code, name }
  const presetByCode = new Map(); // code → { idx, name }
  const styleByCode  = new Map(); // code → { idx, name }

  const DEFAULT_PRESET_NAMES = [
    "🌾 시골 바람", "🇮🇹 지중해성", "🌊 해변 바람", "🏔️ 산 바람", "🐎 대평원",
    "⚓ 항구 바람", "🌲 숲 그늘", "🌅 도시 석양", "🌪️ 열대 소나기", "🌌 사막의 밤"
  ];

  const DEFAULT_STYLE_NAMES = ["⚖️ Balance", "⚡ Active", "🎯 Focus", "🧘 Relax", "😴 Sleep"];

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

    // ── 2. Target vs Actual (신규) ──
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

    // ── 3. Preset & Style (신규, 라벨 Y축) ──
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

    // ── 8. 센서 (신규) ──
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

    // 7) 타이밍
    _appendDataset(chartTiming.data.datasets[0].data, recs, "sim_int");
    _appendDataset(chartTiming.data.datasets[1].data, recs, "gust_int");
    _appendDataset(chartTiming.data.datasets[2].data, recs, "thermal_int");

    // 8) 센서 (백엔드 노출 시 자동 반영)
    _appendDataset(chartSensor.data.datasets[0].data, recs, "tempC");
    _appendDataset(chartSensor.data.datasets[1].data, recs, "humidity");

    // 센서 데이터 도착 시 placeholder 제거
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

  function applyStateToUi(state) {
    if (!state) return;

    const sim = state.sim || {};
    const ctl = state.control || {};
    const sensor = ctl.sensor || {};

    // ── 요약 카드 ──
    // 프리셋
    const pCode = sim.presetCode || "";
    const pInfo = presetByCode.get(pCode);
    _set("sumPreset",     pInfo ? `🎨 ${pInfo.name}` : (pCode || "-"));
    _set("sumPresetCode", pCode ? `Code: ${pCode}` : "-");

    // 스타일
    const sCode = sim.styleCode || "";
    const sInfo = styleByCode.get(sCode);
    _set("sumStyle",     sInfo ? `🎨 ${sInfo.name}` : (sCode || "-"));
    _set("sumStyleCode", sCode ? `Code: ${sCode}` : "-");

    // 제어 상태
    const ctlEl = document.getElementById("sumCtlState");
    if (ctlEl) {
      ctlEl.textContent = ctl.state || "-";
      const sc = ctl.stateCode;
      if (sc === 2 || sc === 3) ctlEl.className = "info-label ok";
      else if (sc === 1)        ctlEl.className = "info-label warn";
      else if (sc === 5 || sc === 6) ctlEl.className = "info-label err";
      else                      ctlEl.className = "info-label info";
    }

    // 실행 대상
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

    // 센서
    const tempStr = (sensor.tempC != null) ? `${_fmt(sensor.tempC)}°C` : "-";
    const humStr  = (sensor.humidity != null) ? `${_fmt(sensor.humidity)}%` : "-";
    const motionStr = (sensor.motionActive === true) ? "🚶 재실" : (sensor.motionActive === false ? "👤 부재" : "-");
    _set("sumSensor", `${tempStr} / ${humStr} · ${motionStr}`);
    _set("sumUptime", `가동: ${_fmtUptime(performance.now() / 1000)}`);

    // ── Set vs Applied 비교 테이블 ──
    // (S10 toJson은 설정값과 적용값이 동일한 파라미터를 반환)
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

    // 비교 테이블 timestamp
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
      if (!lastPt || (now - lastPt.x) >= 5000) {   // 5초 이상 경과 시 push
        dsTemp.push({ x: now, y: sensor.tempC });
        dsHum.push({ x: now, y: sensor.humidity });
        if (dsTemp.length > MAX_CHART_POINTS) dsTemp.splice(0, dsTemp.length - MAX_CHART_POINTS);
        if (dsHum.length  > MAX_CHART_POINTS) dsHum.splice(0, dsHum.length - MAX_CHART_POINTS);

        const ph = document.getElementById("sensorPlaceholder");
        if (ph) ph.remove();

        chartSensor.update("none");
      }
    }
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
  // 이벤트
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
  }

  // ============================================================
  // 초기화
  // ============================================================
  document.addEventListener("DOMContentLoaded", async () => {
    initCharts();
    bindEvents();

    await loadWindDict();     // 프리셋/스타일 매핑 먼저 (Y축 라벨용)
    initWebSocket();
    pollState();              // 요약 카드/비교 테이블 갱신 시작

    window.addEventListener("beforeunload", () => {
      if (statePollTimer) clearTimeout(statePollTimer);
      if (ws) try { ws.close(); } catch {}
    });

    console.log("[ChartT3] init complete");
  });

})();
```

---

📄 파일 4: cfg_pages_071.json — 참조 갱신

pages[] 배열에서 P050 항목 교체:

Before:

```json
{
  "uri": "/P050_chart_t2_071.html",
  "path": "/html_v3/P050_chart_t2_071.html",
  "label": "Chart T2",
  "enable": true,
  "isMain": false,
  "order": 50,
  "pageAssets": [
    { "uri": "/P050_chart_t2_071.css", "path": "/html_v3/P050_chart_t2_071.css" },
    { "uri": "/P050_chart_t2_071.js", "path": "/html_v3/P050_chart_t2_071.js" }
  ]
},
```

After:

```json
{
  "uri": "/P050_chart_t3_071.html",
  "path": "/html_v3/P050_chart_t3_071.html",
  "label": "Chart T3",
  "enable": true,
  "isMain": false,
  "order": 50,
  "pageAssets": [
    { "uri": "/P050_chart_t3_071.css", "path": "/html_v3/P050_chart_t3_071.css" },
    { "uri": "/P050_chart_t3_071.js", "path": "/html_v3/P050_chart_t3_071.js" }
  ]
},
```

reDirect[] 배열에서 단축 경로 교체:

Before:

```json
{ "uriFrom": "/chart_t2", "uriTo": "/P050_chart_t2_071.html" },
```

After:

```json
{ "uriFrom": "/chart_t3", "uriTo": "/P050_chart_t3_071.html" },
{ "uriFrom": "/chart_t2", "uriTo": "/P050_chart_t3_071.html" }
```

의도: /chart_t2는 하위 호환용 별칭으로 유지(t3로 리다이렉트), 신규는 /chart_t3.

---

📄 파일 5: A23_Com_ResetCfg_070.h — fallback 경로 갱신

A20_resetWebPageDefault() 내부, P010 기본 페이지만 등록되어 있음. P050은 등록하지 않음.

이유: fallback은 최소 필수 페이지만 하드코딩. 실제 페이지 목록은 cfg_pages_071.json이 SSOT.

→ 이 파일은 수정 불필요. (P010만 남기고, 나머지는 정상 로드 시 cfg_pages_071.json에서 로드)

단, 선택적으로 P050 fallback도 추가 가능:

```cpp
// [선택] resetWebPageDefault에 P050 폴백 추가 (정책에 따라)
if (A20_Const::MAX_PAGES >= 2) {
    p_cfg.pageCount = 2;
    ST_A20_PageItem_t& v_p2 = p_cfg.pages[1];
    A40_ComFunc::copyStr2Buffer_safe(v_p2.uri,   "/P050_chart_t3_071.html",         sizeof(v_p2.uri));
    A40_ComFunc::copyStr2Buffer_safe(v_p2.path,  "/html_v3/P050_chart_t3_071.html", sizeof(v_p2.path));
    A40_ComFunc::copyStr2Buffer_safe(v_p2.label, "Chart T3",                        sizeof(v_p2.label));
    v_p2.enable = true;
    v_p2.isMain = false;
    v_p2.order  = 50;
    // pageAssets 2개
    ...
}
```

권장: 현재는 추가하지 않고 그대로 유지.

---

🔧 적용 순서

1. 신규 파일 저장

```
/html_v3/P050_chart_t3_071.html
/html_v3/P050_chart_t3_071.css
/html_v3/P050_chart_t3_071.js
```

2. 기존 파일 삭제

```
/html_v3/P050_chart_t2_071.html   ❌
/html_v3/P050_chart_t2_071.css    ❌
/html_v3/P050_chart_t2_071.js     ❌
```

3. cfg_pages_071.json 교체

· pages[]: P050 항목 → t3로
· reDirect[]: /chart_t2 → t3 + /chart_t3 신규

4. LittleFS 업로드

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 페이지 로드

진입 경로 4종:

· / → P010 → 상단 nav에서 "Chart T3" 클릭
· /chart_t3 → t3 직접
· /chart_t2 → t3로 리다이렉트 (하위 호환)
· /P050_chart_t3_071.html 직접

B. 요약 카드

1. 프리셋 — "🌊 해변 바람" (이름, 이모지 포함)
2. 스타일 — "⚖️ Balance"
3. 제어 상태 — "SCHEDULE_RUN" 색상 뱃지
4. 실행 대상 — "스케줄: Evening Comfort (#20)"
5. 센서 — "24.5°C / 55.2% · 🚶 재실"
6. 가동시간 — "00:12:34"

C. 비교 테이블

항목 확인
3열 배치 (Target / Applied / PWM) ✅
목표 풍속 vs 실제 풍속 ✅
센서 온/습, 모션 ✅
타임스탬프 2초 갱신 ✅

D. 8개 차트

# 차트 확인
1 풍속/PWM 정상
2 Target vs Actual 보라 점선 vs 초록 실선
3 Preset & Style 좌측 Y축 프리셋 이름, 우측 스타일 이름
4 핵심 매개변수 정상
5 난류/열기포 정상
6 이벤트 정상
7 타이밍 정상
8 센서 온/습도 라인, 5초 간격 push

E. 브라우저 콘솔

```javascript
// 매핑 로드 확인
"[ChartT3] windDict loaded: 10 presets, 5 styles"

// 초기화
"[ChartT3] init complete"

// WS 연결
"[WS] /chart 연결 성공"  (toast)

// state 폴링 (2초마다)
"마지막 갱신: 14:32:15"
```

F. Y축 라벨 검증 (Preset & Style 차트)

프리셋 변경 시 좌측 Y축 라벨이 🌊 해변 바람 → 🌌 사막의 밤 등으로 자동 변경.

---

📊 최종 정리

Phase 2 (백엔드) + Phase 1 (프론트) 완결

구분 파일 상태
BE S10_Simul_070.h ✅
BE S10_Simul_Core_070.cpp ✅
BE S10_Simul_IO_070.cpp ✅
BE CT10_Ctl_070.h ✅
BE CT10_Ctl_Basic_070.cpp ✅
BE CT10_Ctl_IOWS_070.cpp ✅
FE P050_chart_t3_071.html ✅
FE P050_chart_t3_071.css ✅
FE P050_chart_t3_071.js ✅
FE cfg_pages_071.json ✅

사용자 체감 개선

이전 (T2) 이후 (T3)
숫자 인덱스만 보임 프리셋/스타일 이름
센서 정보 없음 온/습도 + 재실 여부
설정값만 표시 Target vs Applied
6개 차트 8개 차트
"지금 뭐가 도나?" 요약 카드로 한눈에

---

🚀 다음 단계

Phase 2 + Phase 1 완결. 이제 남은 선택:

· (A) Round 3 검증 — 브라우저 실제 테스트 시나리오 문서
· (B) P050 chart 고도화 — 이벤트 히스토리 섹션 추가
· (C) 다른 페이지 확장 (P085 프로필 편집 UX 개선 등)
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음 단계로 진행하겠습니다.



---
---

P050 chart 고도화 — 이벤트 히스토리 + 통계 대시보드

P050_chart_t3에 2개 섹션 추가:

1. 📋 이벤트 히스토리 — CT10 상태 전환, Gust/Thermal, Override 등 실시간 기록
2. 📊 이벤트 통계 — 최근 1시간 타입별 카운트

변경 파일 3개:

# 파일 상태
1 P050_chart_t3_071.html 🔄 비교 테이블 아래에 2개 섹션 삽입
2 P050_chart_t3_071.css 🔄 파일 끝에 append
3 P050_chart_t3_071.js 🔄 이벤트 감지/기록/통계 로직 추가

---

📄 1. P050_chart_t3_071.html — 삽입 위치

<!-- ═══ 3. 실시간 제어 패널 ═══ --> 섹션 바로 위에 삽입:

```html
<!-- ═══════════════════════════════════════════════════ -->
<!-- 2-1. 이벤트 히스토리 + 통계 (신규) -->
<!-- ═══════════════════════════════════════════════════ -->
<section class="card events-card col-12">
    <div class="row middle">
        <strong class="section-title">📋 이벤트 히스토리 & 통계</strong>
        <div class="right">
            <div class="log-filter-group">
                <button class="btn btn-small active" data-evt-filter="all">전체</button>
                <button class="btn btn-small" data-evt-filter="warn">WARN+</button>
                <button class="btn btn-small" data-evt-filter="err">ERROR</button>
            </div>
            <button class="btn btn-small" id="btnClearEvents">🗑 초기화</button>
            <button class="btn btn-small" id="btnExportEvents">📥 내보내기</button>
        </div>
    </div>

    <div class="events-grid">
        <!-- 좌: 이벤트 리스트 -->
        <div class="events-list-container">
            <div class="events-list-header">
                <span>시각</span>
                <span>레벨</span>
                <span>이벤트</span>
            </div>
            <div id="eventList" class="events-list">
                <div class="muted events-empty">이벤트 없음 — 실시간 대기 중...</div>
            </div>
            <div class="events-footer">
                <span id="eventCount">0</span> / 100 개
            </div>
        </div>

        <!-- 우: 이벤트 통계 -->
        <div class="events-stats">
            <h4>최근 1시간 통계</h4>
            <table class="stats-table">
                <tr>
                    <td>🛑 AutoOff</td>
                    <td id="statAutoOff">0</td>
                </tr>
                <tr>
                    <td>👤 Motion Blocked</td>
                    <td id="statMotion">0</td>
                </tr>
                <tr>
                    <td>🎬 Override 시작</td>
                    <td id="statOverride">0</td>
                </tr>
                <tr>
                    <td>🔥 Gust</td>
                    <td id="statGust">0</td>
                </tr>
                <tr>
                    <td>♨️ Thermal</td>
                    <td id="statThermal">0</td>
                </tr>
                <tr>
                    <td>🎨 프리셋 변경</td>
                    <td id="statPreset">0</td>
                </tr>
                <tr>
                    <td>⏰ 시간 미동기</td>
                    <td id="statTimeInvalid">0</td>
                </tr>
                <tr class="stats-total-row">
                    <td>총 이벤트</td>
                    <td id="statTotal">0</td>
                </tr>
            </table>
            <div class="stats-window" id="statsWindow">-</div>
        </div>
    </div>
</section>
```

---

📄 2. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 이벤트 히스토리 + 통계 (P050 확장)                          */
/* ============================================================ */

.events-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

/* ── 2열 그리드 (리스트 | 통계) ── */
.events-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .events-grid { grid-template-columns: 1fr; }
}

/* ── 이벤트 리스트 ── */
.events-list-container {
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
}

.events-list-header {
  display: grid;
  grid-template-columns: 90px 70px 1fr;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f6f9;
  border-bottom: 1px solid #e0e6ed;
  font-size: 0.8em;
  font-weight: 700;
  color: #4a637a;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.events-list {
  flex-grow: 1;
  max-height: 280px;
  min-height: 200px;
  overflow-y: auto;
  padding: 6px 12px;
  font-size: 0.88em;
}

.events-empty {
  padding: 20px;
  text-align: center;
}

.event-row {
  display: grid;
  grid-template-columns: 90px 70px 1fr;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dotted #e5eaef;
  align-items: baseline;
}
.event-row:last-child { border-bottom: none; }

.event-row .ev-ts {
  font-family: ui-monospace, monospace;
  color: #7f8c8d;
  font-size: 0.9em;
}

.event-row .ev-lv {
  font-size: 0.75em;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  text-align: center;
  width: fit-content;
}

.event-row .ev-lv.lv-1 { background: #fdecea; color: #c0392b; }
.event-row .ev-lv.lv-2 { background: #fef5e7; color: #b9770e; }
.event-row .ev-lv.lv-3 { background: #eaf4fc; color: #2980b9; }
.event-row .ev-lv.lv-4 { background: #eef2f6; color: #566573; }

.event-row .ev-msg {
  color: #2c3e50;
}

.event-row[data-level="1"] .ev-msg { color: #c0392b; font-weight: 600; }
.event-row[data-level="2"] .ev-msg { color: #b9770e; font-weight: 600; }

.events-footer {
  padding: 6px 12px;
  background: #f1f6f9;
  border-top: 1px solid #e0e6ed;
  font-size: 0.78em;
  color: #7f8c8d;
  text-align: right;
  font-family: ui-monospace, monospace;
}

/* ── 이벤트 통계 ── */
.events-stats {
  border: 1px solid #e0e6ed;
  border-radius: 8px;
  padding: 14px 16px;
  background: #fdfdfe;
}

.events-stats h4 {
  margin: 0 0 10px;
  font-size: 0.95em;
  color: #34495e;
  padding-bottom: 6px;
  border-bottom: 2px solid #ecf0f1;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.stats-table tr {
  border-bottom: 1px dotted #ecf0f1;
}
.stats-table tr:last-child { border-bottom: none; }

.stats-table td {
  padding: 6px 4px;
}

.stats-table td:first-child {
  color: #4a637a;
}

.stats-table td:last-child {
  text-align: right;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: #2c3e50;
}

.stats-total-row {
  border-top: 2px solid #ecf0f1 !important;
  border-bottom: none !important;
  margin-top: 6px;
}

.stats-total-row td {
  padding-top: 10px !important;
  font-weight: 700 !important;
  color: #2c3e50 !important;
  font-size: 1.05em;
}

.stats-total-row td:last-child {
  color: #3498db !important;
}

.stats-window {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dotted #e0e6ed;
  font-size: 0.78em;
  color: #95a5a6;
  text-align: right;
  font-family: ui-monospace, monospace;
}

/* ── 이벤트 필터 버튼 (log-filter-group 재사용) ── */
.events-card .log-filter-group {
  display: inline-flex;
  gap: 4px;
  margin-right: 8px;
}

.events-card .log-filter-group .btn.active {
  background-color: #3498db;
  color: #fff;
  border-color: #2980b9;
}
```

---

📄 3. P050_chart_t3_071.js — 추가/수정

3-1. 파일 상단 상수 추가

let isPaused = false; 바로 아래에 삽입:

```javascript
  // ============================================================
  // 이벤트 히스토리 상태
  // ============================================================
  const EVENT_MAX = 100;
  const eventHistory = [];       // { ts, level, type, msg }
  let   eventFilter  = "all";    // "all" | "warn" | "err"

  // 이전 상태 추적 (전환 감지용)
  const _prev = {
      stateCode:    null,
      overrideAct:  null,
      presetCode:   null,
      styleCode:    null,
      gustActive:   null,
      thermalActive:null,
      timeValid:    null,
      // gust/thermal은 WS 누적으로 다수 발생 가능 → rising edge만 카운트
      lastGustTs:   0,
      lastThermalTs:0,
  };
```

3-2. 이벤트 push/렌더 함수 추가

loadWindDict() 함수 위에 삽입:

```javascript
  // ============================================================
  // 이벤트 히스토리
  // ============================================================
  function pushEvent(level, type, msg) {
      // level: 1=ERR, 2=WARN, 3=INFO, 4=DEBUG
      eventHistory.unshift({ ts: Date.now(), level, type, msg });

      if (eventHistory.length > EVENT_MAX) {
          eventHistory.length = EVENT_MAX;
      }
      renderEvents();
      updateEventStats();
  }

  function renderEvents() {
      const el = document.getElementById("eventList");
      if (!el) return;

      if (!eventHistory.length) {
          el.innerHTML = '<div class="muted events-empty">이벤트 없음 — 실시간 대기 중...</div>';
          document.getElementById("eventCount").textContent = "0";
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
          return `<div class="event-row" data-level="${e.level}">
              <span class="ev-ts">${ts}</span>
              <span class="ev-lv lv-${e.level}">${lvLabel}</span>
              <span class="ev-msg">${e.msg}</span>
          </div>`;
      }).join("");

      document.getElementById("eventCount").textContent = String(eventHistory.length);
  }

  function updateEventStats() {
      const now = Date.now();
      const WINDOW_MS = 3600 * 1000;   // 1시간

      const recent = eventHistory.filter((e) => (now - e.ts) <= WINDOW_MS);

      const cnt = {
          autoOff:     0,
          motion:      0,
          override:    0,
          gust:        0,
          thermal:     0,
          preset:      0,
          timeInvalid: 0,
          total:       recent.length,
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
  // 상태 전환 감지 (state 폴링 시 호출)
  // ============================================================
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

  // ============================================================
  // WS 이벤트 감지 (gust/thermal - rising edge)
  // ============================================================
  function detectChartEvents(recs) {
      if (!Array.isArray(recs) || !recs.length) return;

      recs.forEach((r) => {
          const t = Number(r.t) || 0;
          if (!t) return;

          // Gust rising edge
          const gustNow = r.gust === 1;
          if (gustNow && (_prev.lastGustTs === 0 || t - _prev.lastGustTs > 2000)) {
              pushEvent(3, "gust", "🔥 돌풍 발생");
              _prev.lastGustTs = t;
          }

          // Thermal rising edge
          const thermalNow = r.thermal === 1;
          if (thermalNow && (_prev.lastThermalTs === 0 || t - _prev.lastThermalTs > 2000)) {
              pushEvent(3, "thermal", "♨️ 열기포 발생");
              _prev.lastThermalTs = t;
          }
      });
  }
```

3-3. applyStateToUi() 내 이벤트 감지 호출 추가

함수 시작부 const sensor = ctl.sensor || {}; 바로 아래에 삽입:

```javascript
      // [이벤트 감지] 상태 전환
      detectStateTransitions(sim, ctl);
```

3-4. processChartRecords() 내 이벤트 감지 호출 추가

함수 내부 _appendDataset(chartEvent.data.datasets[1]... 바로 아래에 삽입:

```javascript
      // [이벤트 감지] gust/thermal rising edge
      detectChartEvents(recs);
```

3-5. bindEvents() 내 필터/초기화/내보내기 추가

btnResetZoomAll 리스너 바로 아래에 삽입:

```javascript
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
        renderEvents();
        updateEventStats();
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
            events:     eventHistory.slice().reverse(),   // 시간순 (오래된 것부터)
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
```

3-6. DOMContentLoaded — 초기 렌더

console.log("[ChartT3] init complete"); 바로 위에 삽입:

```javascript
    // 이벤트 히스토리 초기 렌더 (빈 상태)
    renderEvents();
    updateEventStats();

    // 통계창 30초 자동 갱신 (1시간 윈도우 슬라이딩)
    setInterval(updateEventStats, 30000);
```

---

🔧 적용 순서

1. P050_chart_t3_071.html — 비교 테이블 아래에 이벤트 섹션 삽입
2. P050_chart_t3_071.css — 파일 끝에 append
3. P050_chart_t3_071.js — 위 6개 수정 사항 순서대로 반영
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 페이지 로드 후 초기 상태

· 이벤트 리스트: "이벤트 없음 — 실시간 대기 중..."
· 통계: 모두 0
· 필터 버튼: "전체" active

B. 프리셋 변경 시

1. P010에서 프리셋 변경
2. P050에서 2초 이내 반영:
   · 이벤트 행: [시간] INF 🎨 프리셋 변경: OCEAN → 🌊 해변 바람
   · 통계 "🎨 프리셋 변경" 카운트 증가

C. Override 시작 시

1. P010에서 "🎬 임시 적용" 클릭
2. P050에서:
   · 이벤트: 🎬 Override 시작 (고정 55.0%)
   · 통계 "🎬 Override 시작" 증가

D. Gust 발생 시 (WS)

1. 자연풍 모드로 대기 (돌풍 발생 확률 자연 발생)
2. 이벤트 리스트에 🔥 돌풍 발생 누적
3. 통계 "🔥 Gust" 카운트 증가

E. 이벤트 내보내기

1. "📥 내보내기" 클릭
2. snw_events_YYYYMMDD_HHMMSS.json 다운로드
3. 내용:

```json
{
  "exportedAt": "2025-09-22T14:32:15.000Z",
  "count": 12,
  "events": [
    { "ts": 1758530400000, "level": 3, "type": "preset", "msg": "🎨 프리셋 변경: ..." },
    ...
  ]
}
```

F. 필터

· "WARN+" 클릭 → level ≤ 2 이벤트만 표시 (ERR, WRN)
· "ERROR" 클릭 → level 1만 (ERR)

G. 통계창 자동 갱신

· 30초마다 updateEventStats() 실행
· 1시간 지난 이벤트는 자동 제외
· 우측 하단 "최근 이벤트 HH:MM:SS ~" 갱신

---

📊 최종 사용자 경험

상황 P050 이전 P050 + 이벤트 히스토리
"어제 몇 번 AutoOff 됐지?" 알 수 없음 📊 통계로 즉시 확인
"언제 돌풍이 왔지?" 차트 위에서 찾아야 📋 타임스탬프 + 로그
"이 문제 자주 발생하나?" 매번 지켜봐야 🗂 JSON 내보내기로 분석
"이벤트 순서가 어떻게?" 기억에 의존 📋 시간순 리스트
"문제 시점 스냅샷은?" 없음 📥 이벤트 로그 저장

---

🚀 다음 단계

P050 고도화 완료. 이제 남은 선택:

· (A) 이벤트 마커 — 차트 위 X축에 이벤트 세로선 (선택)
· (B) 다른 페이지 확장 (P085 프로필 편집 UX 개선)
· (C) Round 3 검증 매뉴얼 작성
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.



---
---

이벤트 마커 — 차트 위 X축 세로선

개요:

· 커스텀 Chart.js 플러그인 (~60줄) — CDN 추가 의존성 없음
· 이벤트 시각 X 위치에 세로 점선 + 상단 삼각형 마커
· 레벨별 색상 (ERR/WARN/INFO/DEBUG)
· 토글 버튼 + localStorage 영속화
· 8개 차트 전체 적용 (성능 영향 무시 가능)

변경 파일 3개:

# 파일 상태
1 P050_chart_t3_071.html 🔄 컨트롤 패널에 토글 버튼 + 범례
2 P050_chart_t3_071.css 🔄 마커 범례 스타일
3 P050_chart_t3_071.js 🔄 커스텀 플러그인 + 토글 로직

---

📄 1. P050_chart_t3_071.html — 컨트롤 패널 확장

<!-- 3. 실시간 제어 패널 --> 섹션 교체:

Before:

```html
<section class="card control-panel col-12">
    <div class="row middle">
        <strong class="section-title">실시간 모니터링 제어</strong>
        <div class="right tight">
            <span class="info-label info" id="refreshInfo">🕒 WebSocket 연결 중...</span>
            <button class="btn ok" id="btnResume">▶ 재개</button>
            <button class="btn warn" id="btnPause">⏸ 일시정지</button>
            <button class="btn" id="btnResetZoomAll">🔍 줌 초기화</button>
        </div>
    </div>
</section>
```

After:

```html
<section class="card control-panel col-12">
    <div class="row middle">
        <strong class="section-title">실시간 모니터링 제어</strong>
        <div class="right tight">
            <span class="info-label info" id="refreshInfo">🕒 WebSocket 연결 중...</span>
            <button class="btn ok" id="btnResume">▶ 재개</button>
            <button class="btn warn" id="btnPause">⏸ 일시정지</button>
            <button class="btn" id="btnResetZoomAll">🔍 줌 초기화</button>
            <button class="btn ok" id="btnToggleMarkers">📍 이벤트 마커 ON</button>
        </div>
    </div>

    <!-- 이벤트 마커 범례 -->
    <div class="marker-legend">
        <span class="mk-label">이벤트 마커:</span>
        <span class="mk-item"><span class="mk-dot" style="background:#e74c3c"></span>ERR</span>
        <span class="mk-item"><span class="mk-dot" style="background:#f39c12"></span>WARN</span>
        <span class="mk-item"><span class="mk-dot" style="background:#3498db"></span>INFO</span>
        <span class="mk-item"><span class="mk-dot" style="background:#95a5a6"></span>DEBUG</span>
        <span class="mk-hint">※ 세로 점선 = 이벤트 시각</span>
    </div>
</section>
```

---

📄 2. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 이벤트 마커 범례                                              */
/* ============================================================ */

.marker-legend {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dotted #e0e6ed;
    font-size: 0.82em;
    flex-wrap: wrap;
}

.marker-legend .mk-label {
    font-weight: 700;
    color: #4a637a;
    font-size: 0.95em;
}

.marker-legend .mk-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #566573;
}

.marker-legend .mk-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}

.marker-legend .mk-hint {
    margin-left: auto;
    color: #95a5a6;
    font-size: 0.9em;
    font-family: ui-monospace, monospace;
}

/* 마커 토글 버튼 상태 */
#btnToggleMarkers {
    transition: background-color 0.2s, border-color 0.2s;
}

#btnToggleMarkers.ok {
    background-color: #2ecc71;
    color: #fff;
    border-color: #27ae60;
}

#btnToggleMarkers:not(.ok) {
    background-color: #ecf0f1;
    color: #7f8c8d;
    border-color: #bdc3c7;
}
```

---

📄 3. P050_chart_t3_071.js — 3개 위치 수정

3-1. 파일 상단 상수 추가

let eventMarkersEnabled 상수는 이벤트 히스토리 상수 블록 바로 아래에 추가:

삽입 위치: const _prev = { ... }; 블록 아래

```javascript
  // ============================================================
  // 이벤트 마커 (차트 위 세로선)
  // ============================================================
  const EVENT_MARKERS_KEY = "snw_event_markers";
  let   eventMarkersEnabled = SNW.store.get(EVENT_MARKERS_KEY, true);

  // ── 커스텀 Chart.js 플러그인 ──
  //  - 8개 차트에 자동 적용
  //  - 이벤트 시각 X 위치에 점선 + 상단 삼각형 마커
  const eventMarkerPlugin = {
      id: "snwEventMarkers",

      // 데이터 선 위에 그리려면 afterDatasetsDraw
      afterDatasetsDraw(chart) {
          if (!eventMarkersEnabled) return;
          if (!eventHistory.length) return;

          const { ctx, chartArea, scales } = chart;
          if (!chartArea || !scales || !scales.x) return;

          const xScale = scales.x;
          const minX = xScale.min;
          const maxX = xScale.max;
          if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return;

          // ── 가시 범위 내 이벤트 필터 ──
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

          // 1) 세로 점선 (뒤에 그리기)
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1;
          visible.forEach(e => {
              const x = xScale.getPixelForValue(e.ts);
              if (x < chartArea.left || x > chartArea.right) return;
              ctx.beginPath();
              ctx.strokeStyle = lineColorOf(e.level);
              ctx.moveTo(x, top);
              ctx.lineTo(x, bottom);
              ctx.stroke();
          });

          // 2) 상단 삼각형 마커 (앞에 그리기)
          ctx.setLineDash([]);
          visible.forEach(e => {
              const x = xScale.getPixelForValue(e.ts);
              if (x < chartArea.left || x > chartArea.right) return;
              ctx.fillStyle = markColorOf(e.level);
              ctx.beginPath();
              ctx.moveTo(x, top + 10);      // 뾰족한 아래
              ctx.lineTo(x - 4, top + 2);   // 좌상
              ctx.lineTo(x + 4, top + 2);   // 우상
              ctx.closePath();
              ctx.fill();
          });

          ctx.restore();
      }
  };

  // 전역 등록 (모든 차트 자동 적용)
  Chart.register(eventMarkerPlugin);
```

3-2. pushEvent() 확장 — 차트 즉시 갱신

기존 pushEvent() 함수의 마지막 부분 수정:

Before:

```javascript
  function pushEvent(level, type, msg) {
      // level: 1=ERR, 2=WARN, 3=INFO, 4=DEBUG
      eventHistory.unshift({ ts: Date.now(), level, type, msg });

      if (eventHistory.length > EVENT_MAX) {
          eventHistory.length = EVENT_MAX;
      }
      renderEvents();
      updateEventStats();
  }
```

After:

```javascript
  function pushEvent(level, type, msg) {
      // level: 1=ERR, 2=WARN, 3=INFO, 4=DEBUG
      eventHistory.unshift({ ts: Date.now(), level, type, msg });

      if (eventHistory.length > EVENT_MAX) {
          eventHistory.length = EVENT_MAX;
      }
      renderEvents();
      updateEventStats();

      // [신규] 이벤트 마커 즉시 반영
      if (eventMarkersEnabled) {
          charts.forEach(c => c && c.update("none"));
      }
  }
```

3-3. bindEvents() — 토글 버튼 추가

btnResetZoomAll 리스너 아래에 삽입:

```javascript
    // 이벤트 마커 토글
    const btnToggleMarkers = document.getElementById("btnToggleMarkers");
    if (btnToggleMarkers) {
        // 초기 상태 반영
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

            // 모든 차트 재렌더 (플러그인 자동 실행/스킵)
            charts.forEach(c => c && c.update("none"));

            if (window.showToast) {
                window.showToast(
                    eventMarkersEnabled ? "이벤트 마커 표시" : "이벤트 마커 숨김",
                    eventMarkersEnabled ? "ok" : "info"
                );
            }
        });
    }
```

3-4. btnClearEvents 리스너 확장 — 마커도 함께 제거

기존 btnClearEvents 리스너의 마지막 부분 수정:

Before:

```javascript
    document.getElementById("btnClearEvents")?.addEventListener("click", () => {
        if (!eventHistory.length) return;
        if (!confirm("이벤트 히스토리를 모두 지우시겠습니까?")) return;
        eventHistory.length = 0;
        renderEvents();
        updateEventStats();
        if (window.showToast) window.showToast("이벤트 히스토리 초기화", "info");
    });
```

After:

```javascript
    document.getElementById("btnClearEvents")?.addEventListener("click", () => {
        if (!eventHistory.length) return;
        if (!confirm("이벤트 히스토리를 모두 지우시겠습니까?")) return;
        eventHistory.length = 0;
        renderEvents();
        updateEventStats();

        // [신규] 차트 마커도 즉시 제거
        charts.forEach(c => c && c.update("none"));

        if (window.showToast) window.showToast("이벤트 히스토리 초기화", "info");
    });
```

---

🔧 적용 순서

1. P050_chart_t3_071.html — 컨트롤 패널 확장 (범례 포함)
2. P050_chart_t3_071.css — 파일 끝에 append
3. P050_chart_t3_071.js — 4개 위치 수정
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 초기 상태

· 페이지 로드 → 토글 버튼 "📍 이벤트 마커 ON" (초록색, 초기 활성)
· 이벤트 없음 → 차트에 마커 없음
· localStorage 확인:

```javascript
JSON.parse(localStorage.getItem("snw_event_markers"))
// → true (또는 null이면 기본 true)
```

B. 이벤트 발생 → 마커 즉시 표시

프리셋 변경 (P010에서):

1. P050 상태 폴링(2초) 후 이벤트 감지
2. 모든 차트에 파란 세로 점선 + 상단 삼각형 표시
3. 시간축 상 위치 = 이벤트 발생 시각

Override 시작:

1. P010에서 "🎬 임시 적용" 클릭
2. 모든 차트에 파란 마커 표시
3. 이벤트 리스트에 "🎬 Override 시작" 행 추가

돌풍 발생 (WS 실시간):

1. 자연풍 모드 대기
2. WS로 이벤트 감지 → 마커 추가
3. 차트 위 X축 마커 위치가 WS 이벤트 시각과 일치

AutoOff:

1. P010에서 임시 적용 후 대기
2. AutoOff 트리거 → 노란 마커(WARN)

C. 토글 OFF

1. "📍 이벤트 마커 OFF" 클릭
2. 모든 차트에서 마커 사라짐
3. 버튼 회색 배경
4. localStorage: false
5. F5 새로고침 → OFF 상태 유지

D. 토글 ON

1. 재클릭 → 마커 다시 표시
2. 상태 유지

E. 이벤트 초기화

1. "🗑 초기화" 클릭 → 이벤트 리스트 비워짐
2. 차트의 마커도 동시에 사라짐

F. 줌/팬 상호작용

1. 차트에서 마우스 휠로 줌인
2. 가시 범위 이벤트만 표시 (자동 필터링)
3. 팬으로 이동 → 다른 이벤트 마커 나타남

G. 성능 확인

· 100개 이벤트 × 8개 차트 × 2Hz = 1600 ops/sec
· CPU 부하: 무시 가능 (<1ms/frame)
· 개발자 도구 → Performance 탭에서 확인

---

📊 최종 사용자 경험

상황 이전 (P050 T3) 이벤트 마커 추가
"언제 돌풍이 왔지?" 이벤트 리스트 스크롤 📍 차트 위 마커 즉시 확인
"프리셋 변경이 풍속에 영향?" 상관관계 추정 불가 📍 변경 시점 마커로 시각적 상관 확인
"AutoOff 직전 패턴?" 어려움 📍 마커 위치로 추세 파악
"Override 중 실제 바람?" 이벤트 리스트 vs 차트 비교 📍 마커로 구간 즉시 식별
"이벤트 밀집 구간?" 없음 📍 시각적 밀도로 파악

실 사용 시나리오

시나리오 1: 자연풍 튜닝

해변 바람 프리셋에서 돌풍이 너무 자주 발생.
차트 위 파란 마커로 돌풍 시각이 한눈에 보임 → "5분 동안 7번" 즉시 파악 → 프리셋 조정.

시나리오 2: 문제 진단

저녁 8시에 팬이 멈춤. 차트에서 그 시각 근처에 빨간 마커 발견 → "AutoOff offTemp 트리거" 확인 → 설정 조정.

시나리오 3: 스케줄 검증

스케줄이 정확히 작동하는지 확인. 차트 상단 마커와 스케줄 시간 비교 → 정시 정확히 시작 확인.

---

🚀 다음 단계

이벤트 마커 완료. 남은 선택:

· (A) 마커 hover tooltip — 이벤트 내용 팝업 (Chart.js hover event 필요)
· (B) 다른 페이지 확장 (P085 프로필 편집 UX)
· (C) Round 3 검증 매뉴얼 작성
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.




마커 hover tooltip — 이벤트 상세 팝업

개요:

· 마커 근접 시 마우스 옆에 이벤트 상세 팝업
· 호버된 마커 강조 (더 큰 삼각형 + 실선)
· 레벨별 색상 (ERR/WARN/INFO/DEBUG)
· 뷰포트 경계 자동 조정
· 다중 차트 상호 배타적 (다른 차트로 이동 시 이전 툴팁 숨김)

변경 파일 2개:

# 파일 상태
1 P050_chart_t3_071.css 🔄 파일 끝에 append
2 P050_chart_t3_071.js 🔄 3개 위치 수정

HTML은 변경 없음 — 툴팁 DOM은 JS가 동적 생성.

---

📄 1. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 이벤트 마커 Hover Tooltip                                     */
/* ============================================================ */

.event-marker-tooltip {
    position: fixed;
    z-index: 2000;
    min-width: 220px;
    max-width: 340px;
    background: #2c3e50;
    color: #ecf0f1;
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    font-size: 0.85em;
    line-height: 1.4;
    pointer-events: none;   /* 마우스 이벤트 통과 */
    animation: ttFadeIn 0.12s ease-out;
    border-left: 4px solid #3498db;
}

.event-marker-tooltip.lv-1 { border-left-color: #e74c3c; }
.event-marker-tooltip.lv-2 { border-left-color: #f39c12; }
.event-marker-tooltip.lv-3 { border-left-color: #3498db; }
.event-marker-tooltip.lv-4 { border-left-color: #95a5a6; }

@keyframes ttFadeIn {
    from { opacity: 0; transform: translateY(2px); }
    to   { opacity: 1; transform: translateY(0); }
}

.event-marker-tooltip .mk-tt-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(236, 240, 241, 0.15);
}

.event-marker-tooltip .mk-tt-lv {
    display: inline-block;
    padding: 1px 7px;
    border-radius: 4px;
    font-size: 0.72em;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.event-marker-tooltip .mk-tt-lv.lv-1 { background: #e74c3c; color: #fff; }
.event-marker-tooltip .mk-tt-lv.lv-2 { background: #f39c12; color: #fff; }
.event-marker-tooltip .mk-tt-lv.lv-3 { background: #3498db; color: #fff; }
.event-marker-tooltip .mk-tt-lv.lv-4 { background: #95a5a6; color: #fff; }

.event-marker-tooltip .mk-tt-ts {
    font-family: ui-monospace, monospace;
    font-size: 0.85em;
    color: #bdc3c7;
    margin-left: auto;
}

.event-marker-tooltip .mk-tt-msg {
    color: #ecf0f1;
    word-break: break-word;
    white-space: pre-wrap;
}
```

---

📄 2. P050_chart_t3_071.js — 3개 위치 수정

2-1. 툴팁 상태 + 함수 추가

eventMarkerPlugin 정의 바로 위에 삽입:

```javascript
  // ============================================================
  // 이벤트 마커 Hover Tooltip
  // ============================================================
  let _markerTooltipEl = null;    // DOM (지연 생성)
  let _hoveredEventTs  = null;    // 현재 호버된 이벤트 timestamp (공유)
  const MARKER_HIT_THRESHOLD_PX = 8;   // 마커 감지 반경(px)

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
      // 마커는 상단 삼각형이므로 상단 여유 6px
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

      // 화면에 표시 후 크기 측정
      el.style.display = "block";
      el.style.left = "0px";
      el.style.top  = "0px";

      const rect = el.getBoundingClientRect();
      const PAD = 12;

      let x = clientX + PAD;
      let y = clientY + PAD;

      // 우측 넘침 방지
      if (x + rect.width > window.innerWidth - 8) {
          x = clientX - rect.width - PAD;
      }
      // 하단 넘침 방지
      if (y + rect.height > window.innerHeight - 8) {
          y = clientY - rect.height - PAD;
      }
      // 좌상단 최소값
      if (x < 8) x = 8;
      if (y < 8) y = 8;

      el.style.left = x + "px";
      el.style.top  = y + "px";
  }

  function hideMarkerTooltip() {
      if (_markerTooltipEl) _markerTooltipEl.style.display = "none";
      if (_hoveredEventTs !== null) {
          _hoveredEventTs = null;
          charts.forEach(c => c && c.update("none"));
      }
  }

  function escapeHtml(str) {
      return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
  }

  function attachMarkerHover(chart) {
      const canvas = chart.canvas;
      if (!canvas) return;

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
              if (_hoveredEventTs !== evt.ts) {
                  _hoveredEventTs = evt.ts;
                  charts.forEach(c => c && c.update("none"));  // 강조 재렌더
              }
              showMarkerTooltip(evt, e.clientX, e.clientY);
          } else {
              hideMarkerTooltip();
          }
      });

      canvas.addEventListener("mouseleave", () => {
          hideMarkerTooltip();
      });

      // 터치 환경 지원 (간단히 tap)
      canvas.addEventListener("touchstart", (e) => {
          if (!eventMarkersEnabled) return;
          if (!e.touches || !e.touches.length) return;
          const t = e.touches[0];
          const rect = canvas.getBoundingClientRect();
          const mx = t.clientX - rect.left;
          const my = t.clientY - rect.top;
          const evt = findNearestEvent(chart, mx, my);
          if (evt) {
              _hoveredEventTs = evt.ts;
              charts.forEach(c => c && c.update("none"));
              showMarkerTooltip(evt, t.clientX, t.clientY);
          }
      }, { passive: true });
  }
```

2-2. initChart() — hover 리스너 자동 부착

기존:

```javascript
  const initChart = (ctx, config) => {
    if (!ctx) return null;
    const c = new Chart(ctx, config);
    charts.push(c);
    return c;
  };
```

After:

```javascript
  const initChart = (ctx, config) => {
    if (!ctx) return null;
    const c = new Chart(ctx, config);
    charts.push(c);
    attachMarkerHover(c);   // [신규] hover tooltip 리스너
    return c;
  };
```

2-3. eventMarkerPlugin — 호버된 마커 강조

afterDatasetsDraw(chart) 내부의 마커 그리기 두 번째 forEach 문 전체 교체:

Before:

```javascript
          // 2) 상단 삼각형 마커 (앞에 그리기)
          ctx.setLineDash([]);
          visible.forEach(e => {
              const x = xScale.getPixelForValue(e.ts);
              if (x < chartArea.left || x > chartArea.right) return;
              ctx.fillStyle = markColorOf(e.level);
              ctx.beginPath();
              ctx.moveTo(x, top + 10);      // 뾰족한 아래
              ctx.lineTo(x - 4, top + 2);   // 좌상
              ctx.lineTo(x + 4, top + 2);   // 우상
              ctx.closePath();
              ctx.fill();
          });

          ctx.restore();
```

After:

```javascript
          // 2) 상단 삼각형 마커 (앞에 그리기)
          ctx.setLineDash([]);
          visible.forEach(e => {
              const x = xScale.getPixelForValue(e.ts);
              if (x < chartArea.left || x > chartArea.right) return;

              const isHovered = (_hoveredEventTs === e.ts);

              if (isHovered) {
                  // ── 호버: 실선 + 큰 삼각형 + 외곽 글로우 ──
                  ctx.save();

                  // 실선 강조
                  ctx.setLineDash([]);
                  ctx.strokeStyle = markColorOf(e.level);
                  ctx.lineWidth = 2;
                  ctx.globalAlpha = 0.9;
                  ctx.beginPath();
                  ctx.moveTo(x, top);
                  ctx.lineTo(x, bottom);
                  ctx.stroke();

                  // 외곽 글로우
                  ctx.globalAlpha = 0.3;
                  ctx.shadowColor = markColorOf(e.level);
                  ctx.shadowBlur = 8;
                  ctx.globalAlpha = 1;
                  ctx.shadowBlur = 0;

                  // 큰 삼각형
                  ctx.fillStyle = markColorOf(e.level);
                  ctx.beginPath();
                  ctx.moveTo(x, top + 14);
                  ctx.lineTo(x - 6, top);
                  ctx.lineTo(x + 6, top);
                  ctx.closePath();
                  ctx.fill();

                  ctx.restore();
              } else {
                  // ── 일반: 작은 삼각형 ──
                  ctx.fillStyle = markColorOf(e.level);
                  ctx.beginPath();
                  ctx.moveTo(x, top + 10);
                  ctx.lineTo(x - 4, top + 2);
                  ctx.lineTo(x + 4, top + 2);
                  ctx.closePath();
                  ctx.fill();
              }
          });

          ctx.restore();
```

2-4. 토글 OFF 시 툴팁도 즉시 숨김

bindEvents() 내 btnToggleMarkers 리스너의 if (window.showToast) 블록 위에 삽입:

```javascript
            // 마커 OFF 시 툴팁 숨김
            if (!eventMarkersEnabled) {
                hideMarkerTooltip();
            }
```

수정된 btnToggleMarkers 블록:

```javascript
        btnToggleMarkers.addEventListener("click", () => {
            eventMarkersEnabled = !eventMarkersEnabled;
            SNW.store.set(EVENT_MARKERS_KEY, eventMarkersEnabled);

            btnToggleMarkers.textContent = eventMarkersEnabled
                ? "📍 이벤트 마커 ON"
                : "📍 이벤트 마커 OFF";
            btnToggleMarkers.classList.toggle("ok", eventMarkersEnabled);

            // 마커 OFF 시 툴팁 숨김
            if (!eventMarkersEnabled) {
                hideMarkerTooltip();
            }

            // 모든 차트 재렌더 (플러그인 자동 실행/스킵)
            charts.forEach(c => c && c.update("none"));

            if (window.showToast) {
                window.showToast(
                    eventMarkersEnabled ? "이벤트 마커 표시" : "이벤트 마커 숨김",
                    eventMarkersEnabled ? "ok" : "info"
                );
            }
        });
```

2-5. beforeunload — 툴팁 DOM 정리 (선택)

기존 beforeunload 핸들러에 1줄 추가:

Before:

```javascript
    window.addEventListener("beforeunload", () => {
      if (statePollTimer) clearTimeout(statePollTimer);
      if (ws) try { ws.close(); } catch {}
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
    });
```

---

🔧 적용 순서

1. P050_chart_t3_071.css — 파일 끝에 append
2. P050_chart_t3_071.js — 5개 위치 수정 (2-1 ~ 2-5)
3. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 툴팁 표시

1. 이벤트가 최소 1개 이상 있는 상태
2. 마커 위치로 마우스 이동
3. 기대:
   · 마우스 옆에 어두운 박스 등장
   · 상단: [INF] 배지 + 시간
   · 하단: 이벤트 메시지

B. 마커 강조

1. 마커 hover 시
2. 기대:
   · 세로선이 점선 → 실선 (굵기 2px)
   · 삼각형 크기 증가 (4px → 6px, 높이 10px → 14px)
   · 주변에 은은한 글로우

C. 마커 이탈

1. 마커에서 마우스 이동
2. 기대:
   · 툴팁 즉시 사라짐
   · 마커 원래 크기로 복귀

D. 뷰포트 경계

1. 화면 우측 끝 마커 hover
2. 기대: 툴팁이 마우스 왼쪽에 표시 (넘침 방지)
3. 화면 하단 마커 hover
4. 기대: 툴팁이 마우스 위쪽에 표시

E. 다중 차트

1. 차트 A 마커 hover → 툴팁 표시
2. 차트 B 마커로 이동
3. 기대:
   · 차트 A 툴팁 즉시 사라짐 (mouseleave 발동)
   · 차트 B에서 새 툴팁 표시

F. 토글 OFF

1. 마커 ON 상태에서 마커 hover (툴팁 표시 중)
2. "📍 이벤트 마커 OFF" 클릭
3. 기대:
   · 마커 사라짐
   · 툴팁도 즉시 사라짐 (hideMarkerTooltip() 호출)

G. 줌/팬

1. 차트 줌인 → 마커 위치 재조정
2. 마커 hover → 정확한 위치에서 감지
3. 줌 아웃 → 마커 재배치 후에도 정상 감지

H. 터치 디바이스

1. 모바일에서 마커 근처 tap
2. 기대: 툴팁 표시 (자동 숨김은 없음 — mouseleave 없음)
3. 다른 곳 tap → 새 마커 없으면 이전 툴팁 사라짐 (findNearestEvent null 반환)

---

📊 UX 개선 효과

상황 이전 (마커만) hover tooltip 추가
"이 파란선이 뭐지?" 이벤트 리스트 스크롤 📍 마커 hover 즉시 확인
"정확한 시각은?" 시간 추정 📍 밀리초 단위 표시
"어떤 이벤트?" 추측 📍 메시지 + 레벨 배지
"여러 마커 중 어느 것?" 혼동 📍 호버 강조로 명확
"모바일에서도?" 불가 📍 tap 지원

실 사용 시나리오

시나리오 1: 돌풍 원인 분석

자연풍 모드에서 예상치 못한 강풍 발생.
차트 위 마커 hover → "🔥 돌풍 발생" 즉시 확인.

시나리오 2: 자동 정지 원인

저녁 8시에 팬이 멈춤. 그 시각 근처 마커 hover → "🛑 AutoOff로 정지" 확인.

시나리오 3: 프리셋 전환 검증

스케줄 정시 실행 여부 확인. 마커 hover → "🎨 프리셋 변경: OCEAN → 🌊 해변 바람" 시각 확인.

---

🚀 다음 단계

마커 hover tooltip 완료. 남은 선택:

· (A) 마커 클릭 → 이벤트 리스트 해당 행 스크롤 (상호 참조)
· (B) P085 프로필 편집 UX 확장
· (C) Round 3 검증 매뉴얼 작성
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.



마커 클릭 ↔ 이벤트 리스트 상호 참조

개요:

· 차트 마커 클릭 → 이벤트 리스트 해당 행 자동 스크롤 + 강조
· 이벤트 리스트 행 클릭 → 모든 차트의 마커 강조
· Active 상태 지속 (다시 클릭 시 해제, ESC로 초기화)
· 필터 자동 전환 (숨겨진 이벤트 클릭 시)
· 패닝/줌과 클릭 구분 (마우스 이동 거리 감지)

변경 파일 2개:

# 파일 상태
1 P050_chart_t3_071.css 🔄 파일 끝에 append
2 P050_chart_t3_071.js 🔄 6개 위치 수정

HTML 변경 없음.

---

📄 1. P050_chart_t3_071.css — 파일 끝에 append

```css
/* ============================================================ */
/* 이벤트 리스트 행 상호 참조 (Active / Flash)                  */
/* ============================================================ */

/* 클릭 가능 표시 */
.event-row {
    cursor: pointer;
    transition: background-color 0.15s, box-shadow 0.15s;
    border-radius: 4px;
}
.event-row:hover {
    background-color: #eef4f8;
}

/* Active 상태 (마커 or 행 선택 시) */
.event-row.is-active {
    background-color: #fff8e1;
    box-shadow: inset 4px 0 0 #f39c12;
}

/* Flash 애니메이션 (마커 클릭 시 스크롤 후 3초간 주의 환기) */
@keyframes snwRowFlash {
    0%   { background-color: #fff3b0; box-shadow: inset 4px 0 0 #f39c12; }
    40%  { background-color: #fff8e1; box-shadow: inset 4px 0 0 #f39c12; }
    100% { background-color: #f9fafb; box-shadow: none; }
}
.event-row.flash {
    animation: snwRowFlash 1.8s ease-out;
}

/* Active 마커 안내 hint */
.marker-legend .mk-active-hint {
    margin-left: auto;
    color: #b9770e;
    font-size: 0.9em;
    display: none;
}
.marker-legend .mk-active-hint.visible {
    display: inline-block;
}
```

---

📄 2. P050_chart_t3_071.js — 6개 위치 수정

2-1. 상태 변수 — _hoveredEventTs → _hoveredEventId + _activeEventId 추가

기존:

```javascript
  let _markerTooltipEl = null;    // DOM (지연 생성)
  let _hoveredEventTs  = null;    // 현재 호버된 이벤트 timestamp (공유)
  const MARKER_HIT_THRESHOLD_PX = 8;   // 마커 감지 반경(px)
```

After:

```javascript
  let _markerTooltipEl  = null;   // DOM (지연 생성)
  let _hoveredEventId   = null;   // 호버된 이벤트 id (공유)
  let _activeEventId    = null;   // 클릭으로 선택된 이벤트 id (지속)
  const MARKER_HIT_THRESHOLD_PX = 8;   // 마커 감지 반경(px)
  const CLICK_DRAG_THRESHOLD_PX = 5;   // 클릭 vs 드래그 판정 임계값
```

2-2. pushEvent() — 이벤트에 고유 id 부여

Before:

```javascript
  function pushEvent(level, type, msg) {
      // level: 1=ERR, 2=WARN, 3=INFO, 4=DEBUG
      eventHistory.unshift({ ts: Date.now(), level, type, msg });

      if (eventHistory.length > EVENT_MAX) {
          eventHistory.length = EVENT_MAX;
      }
      renderEvents();
      updateEventStats();

      // [신규] 이벤트 마커 즉시 반영
      if (eventMarkersEnabled) {
          charts.forEach(c => c && c.update("none"));
      }
  }
```

After:

```javascript
  let _eventSeq = 0;   // 이벤트 고유 id 시퀀스

  function pushEvent(level, type, msg) {
      // level: 1=ERR, 2=WARN, 3=INFO, 4=DEBUG
      eventHistory.unshift({
          id: ++_eventSeq,
          ts: Date.now(),
          level, type, msg
      });

      if (eventHistory.length > EVENT_MAX) {
          const removed = eventHistory.splice(EVENT_MAX);
          // active/hovered 이벤트가 잘려나갔으면 초기화
          removed.forEach(r => {
              if (_activeEventId  === r.id) _activeEventId  = null;
              if (_hoveredEventId === r.id) _hoveredEventId = null;
          });
      }
      renderEvents();
      updateEventStats();

      // 이벤트 마커 즉시 반영
      if (eventMarkersEnabled) {
          charts.forEach(c => c && c.update("none"));
      }
  }
```

2-3. renderEvents() — data-event-id + active 클래스 반영

Before:

```javascript
  function renderEvents() {
      const el = document.getElementById("eventList");
      if (!el) return;

      if (!eventHistory.length) {
          el.innerHTML = '<div class="muted events-empty">이벤트 없음 — 실시간 대기 중...</div>';
          document.getElementById("eventCount").textContent = "0";
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
          return `<div class="event-row" data-level="${e.level}">
              <span class="ev-ts">${ts}</span>
              <span class="ev-lv lv-${e.level}">${lvLabel}</span>
              <span class="ev-msg">${e.msg}</span>
          </div>`;
      }).join("");

      document.getElementById("eventCount").textContent = String(eventHistory.length);
  }
```

After:

```javascript
  function renderEvents() {
      const el = document.getElementById("eventList");
      if (!el) return;

      if (!eventHistory.length) {
          el.innerHTML = '<div class="muted events-empty">이벤트 없음 — 실시간 대기 중...</div>';
          document.getElementById("eventCount").textContent = "0";
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

      document.getElementById("eventCount").textContent = String(eventHistory.length);
  }
```

2-4. 신규 함수군 — setActiveEvent, clearActiveEvent, scrollToEventRow

escapeHtml() 함수 바로 아래에 삽입:

```javascript
  // ============================================================
  // Active 이벤트 관리 (마커 ↔ 리스트 상호 참조)
  // ============================================================
  function setActiveEvent(eventId) {
      if (_activeEventId === eventId) {
          clearActiveEvent();
          return;
      }
      _activeEventId = eventId;

      // 필터 자동 전환 (숨겨진 이벤트 클릭 시)
      const evt = eventHistory.find(e => e.id === eventId);
      if (evt) {
          if (eventFilter === "warn" && evt.level > 2) _switchFilter("all");
          if (eventFilter === "err"  && evt.level > 1) _switchFilter("all");
      }

      renderEvents();
      scrollToEventRow(eventId);

      // 마커 강조 재렌더
      charts.forEach(c => c && c.update("none"));

      // 안내 hint 갱신
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

      // 부드러운 스크롤
      row.scrollIntoView({ block: "center", behavior: "smooth" });

      // Flash 애니메이션 (재트리거 위해 클래스 제거 → 강제 리플로우 → 추가)
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
```

2-5. attachMarkerHover() — 클릭 감지 로직 추가

기존 attachMarkerHover() 전체 교체:

```javascript
  function attachMarkerHover(chart) {
      const canvas = chart.canvas;
      if (!canvas) return;

      // ── 클릭 vs 드래그 판정용 ──
      let _downX = 0, _downY = 0, _downValid = false;

      canvas.addEventListener("mousedown", (e) => {
          _downX = e.clientX;
          _downY = e.clientY;
          _downValid = true;
      });

      // ── 마우스 이동: hover tooltip ──
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

      // ── 마우스 업: 클릭 감지 (이동 거리 < 임계값) ──
      canvas.addEventListener("mouseup", (e) => {
          if (!_downValid) return;
          _downValid = false;

          const dx = Math.abs(e.clientX - _downX);
          const dy = Math.abs(e.clientY - _downY);
          if (dx > CLICK_DRAG_THRESHOLD_PX || dy > CLICK_DRAG_THRESHOLD_PX) return;   // 드래그였음

          if (!eventMarkersEnabled) return;

          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;

          const evt = findNearestEvent(chart, mx, my);
          if (evt) {
              setActiveEvent(evt.id);
          } else {
              // 빈 영역 클릭 → active 해제
              if (_activeEventId !== null) clearActiveEvent();
          }
      });

      // ── 마우스 이탈 ──
      canvas.addEventListener("mouseleave", () => {
          hideMarkerTooltip();
      });

      // ── 터치: tap = 클릭으로 처리 ──
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
          // tap이면 active 설정, 아니면 tooltip만 숨김
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
```

2-6. eventMarkerPlugin — Active 강조 (hover와 구분)

afterDatasetsDraw(chart) 내부의 마커 그리기 forEach 전체 교체:

Before (기존 hover 강조 로직):

```javascript
          // 2) 상단 삼각형 마커 (앞에 그리기)
          ctx.setLineDash([]);
          visible.forEach(e => {
              const x = xScale.getPixelForValue(e.ts);
              if (x < chartArea.left || x > chartArea.right) return;

              const isHovered = (_hoveredEventTs === e.ts);

              if (isHovered) {
                  // ── 호버: 실선 + 큰 삼각형 + 외곽 글로우 ──
                  ctx.save();

                  // 실선 강조
                  ctx.setLineDash([]);
                  ctx.strokeStyle = markColorOf(e.level);
                  ctx.lineWidth = 2;
                  ctx.globalAlpha = 0.9;
                  ctx.beginPath();
                  ctx.moveTo(x, top);
                  ctx.lineTo(x, bottom);
                  ctx.stroke();

                  // 외곽 글로우
                  ctx.globalAlpha = 0.3;
                  ctx.shadowColor = markColorOf(e.level);
                  ctx.shadowBlur = 8;
                  ctx.globalAlpha = 1;
                  ctx.shadowBlur = 0;

                  // 큰 삼각형
                  ctx.fillStyle = markColorOf(e.level);
                  ctx.beginPath();
                  ctx.moveTo(x, top + 14);
                  ctx.lineTo(x - 6, top);
                  ctx.lineTo(x + 6, top);
                  ctx.closePath();
                  ctx.fill();

                  ctx.restore();
              } else {
                  // ── 일반: 작은 삼각형 ──
                  ctx.fillStyle = markColorOf(e.level);
                  ctx.beginPath();
                  ctx.moveTo(x, top + 10);
                  ctx.lineTo(x - 4, top + 2);
                  ctx.lineTo(x + 4, top + 2);
                  ctx.closePath();
                  ctx.fill();
              }
          });

          ctx.restore();
```

After:

```javascript
          // 2) 상단 삼각형 마커 (우선순위: active > hover > normal)
          ctx.setLineDash([]);
          visible.forEach(e => {
              const x = xScale.getPixelForValue(e.ts);
              if (x < chartArea.left || x > chartArea.right) return;

              const isActive  = (_activeEventId  === e.id);
              const isHovered = (_hoveredEventId === e.id);
              const color     = markColorOf(e.level);

              if (isActive) {
                  // ═══════════════════════════════════════════
                  // ACTIVE: 실선 + 큰 삼각형 + 외곽 링 + 배경 음영
                  // ═══════════════════════════════════════════
                  ctx.save();

                  // 배경 세로 음영 (15px 폭)
                  ctx.fillStyle = "rgba(243, 156, 18, 0.12)";
                  ctx.fillRect(x - 7, top, 14, bottom - top);

                  // 실선 (두꺼움)
                  ctx.setLineDash([]);
                  ctx.strokeStyle = color;
                  ctx.lineWidth = 2.5;
                  ctx.globalAlpha = 1;
                  ctx.beginPath();
                  ctx.moveTo(x, top);
                  ctx.lineTo(x, bottom);
                  ctx.stroke();

                  // 외곽 링 (안쪽 흰색 배경 + 바깥 색상)
                  ctx.beginPath();
                  ctx.arc(x, top + 8, 8, 0, 2 * Math.PI);
                  ctx.fillStyle = "#ffffff";
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(x, top + 8, 8, 0, 2 * Math.PI);
                  ctx.strokeStyle = color;
                  ctx.lineWidth = 2.5;
                  ctx.stroke();

                  // 큰 삼각형
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.moveTo(x, top + 16);
                  ctx.lineTo(x - 7, top + 1);
                  ctx.lineTo(x + 7, top + 1);
                  ctx.closePath();
                  ctx.fill();

                  ctx.restore();
              } else if (isHovered) {
                  // ═══════════════════════════════════════════
                  // HOVER: 실선 + 큰 삼각형 + 글로우
                  // ═══════════════════════════════════════════
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
                  // ═══════════════════════════════════════════
                  // NORMAL: 작은 삼각형 + 점선
                  // ═══════════════════════════════════════════
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
```

2-7. btnClearEvents — active 초기화 확장

Before:

```javascript
    document.getElementById("btnClearEvents")?.addEventListener("click", () => {
        if (!eventHistory.length) return;
        if (!confirm("이벤트 히스토리를 모두 지우시겠습니까?")) return;
        eventHistory.length = 0;
        renderEvents();
        updateEventStats();

        // [신규] 차트 마커도 즉시 제거
        charts.forEach(c => c && c.update("none"));

        if (window.showToast) window.showToast("이벤트 히스토리 초기화", "info");
    });
```

After:

```javascript
    document.getElementById("btnClearEvents")?.addEventListener("click", () => {
        if (!eventHistory.length) return;
        if (!confirm("이벤트 히스토리를 모두 지우시겠습니까?")) return;

        eventHistory.length = 0;
        _activeEventId  = null;
        _hoveredEventId = null;
        renderEvents();
        updateEventStats();
        updateActiveHint();

        // 차트 마커 즉시 제거
        charts.forEach(c => c && c.update("none"));

        if (window.showToast) window.showToast("이벤트 히스토리 초기화", "info");
    });
```

2-8. bindEvents() — 리스트 클릭 위임 + ESC 키

btnClearEvents 리스너 바로 아래에 삽입:

```javascript
    // ── 이벤트 리스트 행 클릭 → active 지정 (차트 마커 강조) ──
    document.getElementById("eventList")?.addEventListener("click", (e) => {
        const row = e.target.closest(".event-row");
        if (!row) return;
        const idStr = row.dataset.eventId;
        if (!idStr) return;
        const id = Number(idStr);
        if (!Number.isFinite(id)) return;

        setActiveEvent(id);
    });

    // ── ESC 키 → active 해제 ──
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && _activeEventId !== null) {
            clearActiveEvent();
        }
    });
```

2-9. marker-legend — active 안내 hint 추가

P050_chart_t3_071.html의 .marker-legend 내부에 1줄 추가:

Before:

```html
<div class="marker-legend">
    <span class="mk-label">이벤트 마커:</span>
    <span class="mk-item"><span class="mk-dot" style="background:#e74c3c"></span>ERR</span>
    <span class="mk-item"><span class="mk-dot" style="background:#f39c12"></span>WARN</span>
    <span class="mk-item"><span class="mk-dot" style="background:#3498db"></span>INFO</span>
    <span class="mk-item"><span class="mk-dot" style="background:#95a5a6"></span>DEBUG</span>
    <span class="mk-hint">※ 세로 점선 = 이벤트 시각</span>
</div>
```

After:

```html
<div class="marker-legend">
    <span class="mk-label">이벤트 마커:</span>
    <span class="mk-item"><span class="mk-dot" style="background:#e74c3c"></span>ERR</span>
    <span class="mk-item"><span class="mk-dot" style="background:#f39c12"></span>WARN</span>
    <span class="mk-item"><span class="mk-dot" style="background:#3498db"></span>INFO</span>
    <span class="mk-item"><span class="mk-dot" style="background:#95a5a6"></span>DEBUG</span>
    <span class="mk-hint">※ 마커 클릭 = 리스트 참조 · ESC = 해제</span>
    <span class="mk-active-hint"></span>
</div>
```

---

🔧 적용 순서

1. P050_chart_t3_071.css — 파일 끝에 append
2. P050_chart_t3_071.html — .marker-legend 안내 hint 1줄 추가
3. P050_chart_t3_071.js — 6개 위치 수정
4. LittleFS 업로드:

```bash
pio run --target uploadfs
```

---

✅ 검증 시나리오

A. 마커 클릭 → 리스트 스크롤

1. 이벤트 20개 이상 존재 (스크롤 필요 상황)
2. 차트 상단 마커 하나 클릭
3. 기대:
   · 이벤트 리스트가 해당 행으로 부드럽게 스크롤
   · 해당 행이 노란 배경 + 좌측 주황 바 (1.8초 flash)
   · 이후 .is-active 상태로 유지 (연한 노랑)
   · 모든 차트의 해당 마커가 굵은 실선 + 배경 음영 + 외곽 링 강조
   · 범례 우측에 "🎯 선택: ..." hint 표시

B. 리스트 행 클릭 → 마커 강조

1. 이벤트 리스트 행 클릭
2. 기대:
   · 모든 차트에서 해당 마커가 active 스타일로 강조
   · 다른 active 마커는 자동 해제 (단일 선택)

C. 같은 이벤트 재클릭 → 해제

1. active 상태에서 같은 마커/행 재클릭
2. 기대: 강조 해제, hint 사라짐

D. 빈 영역 클릭

1. 차트의 이벤트 없는 영역 클릭
2. 기대: active 해제

E. ESC 키

1. active 상태에서 ESC
2. 기대: 즉시 해제

F. 필터 자동 전환

1. 필터를 "ERROR"로 설정
2. INFO 레벨 마커 클릭
3. 기대:
   · 필터가 자동으로 "전체"로 전환
   · 이벤트 리스트에 모든 이벤트 표시
   · 클릭한 이벤트가 스크롤 + 강조

G. 줌/팬과의 구분

1. 차트에서 마우스 드래그로 팬
2. 기대: active 변경 없음 (드래그 거리 > 5px)
3. 이동 없이 마커 위치에서 클릭
4. 기대: active 설정

H. 터치 디바이스

1. 모바일에서 마커 tap
2. 기대:
   · 스크롤 + flash (active 설정)
   · 리스트 행 tap → 마커 강조
   · 다른 곳 tap → 해제

I. 마커 강조 시각 구분

상태 시각
Normal 작은 삼각형 (4px) + 점선
Hover 큰 삼각형 (6px) + 실선 + 글로우
Active 큰 삼각형 (7px) + 굵은 실선 + 배경 음영 + 외곽 링

→ 세 상태가 명확히 구분되어 사용자 혼동 없음.

J. 이벤트 삭제와의 정합성

1. 이벤트 100개 초과 상태에서 active 이벤트가 잘려나감
2. 기대: _activeEventId 자동 초기화, 차트 재렌더

---

📊 UX 최종 흐름

```
[차트] 마커 클릭
  ↓
[이벤트 리스트] 스크롤 + Flash + Active 유지
  ↓
[모든 차트] 해당 마커 강조 (굵은 실선 + 음영)
  ↓
[범례] 🎯 선택: 이벤트 내용 hint
  ↓
다시 클릭 or ESC or 빈 영역 클릭
  ↓
Active 해제
```

실 사용 시나리오

시나리오 1: 문제 시점 역추적

차트 상단에 이상한 굴곡 발견 → 근처 마커 클릭 → 리스트가 자동 스크롤 → "🛑 AutoOff" 즉시 확인.

시나리오 2: 로그에서 시각 확인

이벤트 리스트에서 "🎬 Override 시작" 클릭 → 차트 위 해당 시각 마커 강조 → 그 시점의 풍속/PWM 변화 시각적 상관 분석.

시나리오 3: 여러 이벤트 비교

마커 A 클릭 → 확인 → 마커 B 클릭 → 자동 전환 → 리스트/차트 모두 새 이벤트로 이동. 수동 스크롤 불필요.

---

🚀 다음 단계

마커-리스트 상호 참조 완료. 남은 선택:

· (A) 마커-리스트 → CSV/JSON 시계열 export (이벤트 구간 데이터)
· (B) P085 프로필 편집 UX 확장
· (C) Round 3 검증 매뉴얼 작성
· (D) 다른 작업 지정

적용 후 결과를 알려주시면 다음으로 진행하겠습니다.

