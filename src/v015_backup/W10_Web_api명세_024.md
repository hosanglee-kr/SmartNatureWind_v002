# W10_Web_api명세_v029.md

본 문서는 **Smart Nature Wind (v015)** 프로젝트의 **Web API v029** 사양을 정의합니다. 모든 API는 `X-API-Key` 헤더를 통한 인증을 지원하며(설정 시), 응답은 기본적으로 `application/json; charset=utf-8` 형식을 따릅니다.

---

### 🌐 1. 시스템 및 버전 (System & Version)

* **API:** `/api/version`
* **메서드:** GET
* **기능:** 장치의 현재 펌웨어 버전 및 빌드 정보를 조회
* **소스:** `W10_Web_Routes_050.cpp` (`routeVersion`)
* **응답:**
  ```json
  {
    "module": "SmartNatureWind",
    "fw": "FW_Ver_1.0.0",
    "control": "CT10_ControlManager_024",
    "config": "C10_ConfigManager_029",
    "api": "W10_WebAPI_029"
  }
  ```

---

* **API:** `/api/system`
* **메서드:** GET / POST
* **기능:** 장치의 시스템 설정(이름, 로깅, HW 핀, 보안 키, 시간 등) 조회 및 업데이트
* **소스:** `W10_Web_Routes_050.cpp` (`routeSystem`)
* **POST 요청:** `{"system": {...}}` (PATCH 방식)
* **응답:** `{"updated": true/false}`

---

* **API:** `/api/config/init`
* **메서드:** POST
* **기능:** 모든 설정을 기본값으로 초기화하고 재부팅 (Factory Reset)
* **소스:** `W10_Web_Routes_050.cpp` (`routeConfigInit`)
* **응답:** `{"factory": true}`

---

### 📡 2. 네트워크 및 상태 (Network & Diagnostics)

* **API:** `/api/state`
* **메서드:** GET
* **기능:** 장치의 실시간 제어 상태, 센서 값, 모션 감지 상채 조회
* **소스:** `W10_Web_Routes_050.cpp` (`routeState`)
* **응답:** `{"active": true, "useProfileMode": false, "runSource": 0, ...}`

---

* **API:** `/api/scan`
* **메서드:** GET
* **기능:** 주변 Wi-Fi 네트워크 목록 스캔
* **소스:** `W10_Web_Routes_050.cpp` (`routeScan`)
* **응답:** `{"wifi": {"scan": [{"ssid": "...", "rssi": -60, ...}]}}`

---

* **API:** `/api/network/wifi/config`
* **메서드:** POST
* **기능:** Wi-Fi 연결 설정을 업데이트하고 재연결 시도
* **소스:** `W10_Web_Routes_050.cpp` (`routeWifiConfig`)
* **주의:** 기존 `/api/wifi` 경로는 현재 비활성화(v029) 상태이며 본 경로를 사용합니다.

---

* **API:** `/api/diag`
* **메서드:** GET
* **기능:** 힙 메모리, 업타임 등 시스템 진단 정보 조회

---

### 💨 3. 제어 및 프로파일 (Control & Profiles)

* **API:** `/api/control/summary`
* **메서드:** GET
* **기능:** 현재 활성화된 제어 요약 및 메트릭스 정보 통합 조회
* **소스:** `W10_Web_Routes_050.cpp` (`routeControlSummary`)

---

* **API:** `/api/control/override/fixed`
* **메서드:** POST
* **기능:** 지정된 시간 동안 고정 속도(%)로 팬 구동
* **요청 파라미터(Body):** `percent` (0.0~1.0), `seconds` (초)

---

* **API:** `/api/control/override/preset`
* **메서드:** POST
* **기능:** 특정 Preset/Style과 미세 조정(Adjust) 값을 적용하여 오버라이드
* **요청(JSON):**
  ```json
  {
    "presetCode": "OCEAN",
    "styleCode": "BALANCE",
    "durationSec": 60,
    "adjust": { "windIntensity": 10.0, "fanLimit": -5.0 }
  }
  ```

---

* **API:** `/api/windProfile` (GET/POST) | `/api/windProfile/{id}` (PUT/DELETE)
* **기능:** 바람 프리셋/스타일 딕셔너리 관리 (CRUD)

---

* **API:** `/api/user_profiles` | `/api/schedules`
* **기능:** 사용자 프로파일 및 스케줄 관리 (CRUD 지원)

---

### 🚶 4. 모션 및 시뮬레이션 (Motion & Simulation)

* **API:** `/api/motion`
* **메서드:** GET / POST
* **기능:** PIR/BLE 기반 모션 감지 설정 조회 및 업데이트

---

* **API:** `/api/simulation` (GET/POST) | `/api/sim/state` (GET)
* **기능:** 물리 엔진 시뮬레이션 설정 및 가상 센서 상태 조회

---

### ⏫ 5. 업로드 및 업데이트 (Upload & OTA)

* **API:** `/upload` / `/update`
* **메서드:** POST (Multipart)
* **기능:** LittleFS 파일 업로드 및 펌웨어 무선 업데이트(OTA)

---

### 💬 6. WebSocket 엔드포인트

| URI | 기능 요약 |
|-----|-----------|
| `/ws/state` | 실시간 상태 및 센서 데이터 브로드캐스트 |
| `/ws/log` | 시스템 실시간 로그 출력 |
| `/ws/chart` | 바람 물리 데이터 및 차트용 정보 |
| `/ws/metrics` | 성능 지표 (CPU, 메모리 등) |
