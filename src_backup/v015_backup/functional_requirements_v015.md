# 🌿 Smart Nature Wind v015 기능 요구사항 명세서

## 1. 개요
본 문서는 `Smart Nature Wind v015` 프로젝트의 기능 요구사항을 상세히 정의합니다. 본 프로젝트는 ESP32 기반의 스마트 자연풍 시뮬레이터로, 다양한 환경 요소를 반영한 정교한 바람 물리 모델을 제공하며 웹 기반 제어 인터페이스를 통합합니다.

---

## 2. 백엔드 (Backend - ESP32 / C++)

### 2.1 설정 관리 (Configuration Management - `CL_C10_ConfigManager`)
- **JSON 기반 저장 체계**: 모든 설정은 LittleFS 내 `/json` 디렉토리에 분리된 JSON 파일로 저장됩니다.
- **중앙 맵핑 시스템**: `10_cfg_jsonFile.json`을 통해 각 섹션(System, WiFi, Motion 등)의 설정 파일 경로를 동적으로 참조합니다.
- **백업 및 복구**: 설정 저장 시 기존 파일을 `.bak`으로 백업하며, 로드 실패 시 자동 복구 메커니즘을 가동합니다.
- **스레드 안전성**: Recursive Mutex를 사용하여 멀티태스킹 환경에서 설정 데이터 접근의 일관성을 보장합니다.
- **동적 파칭(Patching)**: 부분적인 JSON 업데이트를 통해 세부 설정 항목만 변경하고 저장하는 기능을 지원합니다.

### 2.2 자연풍 시뮬레이션 (Simulation - `CL_S10_Simulation`)
- **물리 모델**: Von Kármán 난류 모델(12-band 근사)을 사용하여 실제 자연풍의 확률적인 변동성을 구현합니다.
- **상태 관리**: `CALM`, `NORMAL`, `STRONG` 3단계 상태 전환 확률 모델을 적용합니다.
- **특수 이벤트**: 돌풍(Gust) 및 열기포(Thermal Bubble) 모델을 통해 불규칙한 바람 변화를 시뮬레이션합니다.
- **프리셋 시스템**: `WindDict` 설정을 기반으로 `COUNTRY_BREEZE`, `OCEAN`, `MOUNTAIN` 등 다양한 테마의 풍속 파라미터를 동적으로 로드합니다.
- **자동 보정**: 사용자의 강도/변동성 조정값과 프리셋 기본값을 결합하여 최종 시뮬레이션 파라미터를 생성합니다.

### 2.3 웹 서버 및 API (Web Server / API)
- **AsyncWebServer**: 비동기 웹 서버를 통해 정적 파일 서빙 및 REST API 요청을 처리합니다.
- **RESTful API**: `/api/config/*`, `/api/status` 등 다양한 엔드포인트를 제공합니다.
- **WebSocket**: 시뮬레이션 상태 및 실시간 모니터링 데이터를 브로드캐스트합니다.
- **인증**: API Key 기반 헤더 인증을 지원하여 보안을 강화합니다.

### 2.4 하드웨어 제어 (Hardware Control)
- **PWM 제어**: 팬 속도를 0~100% 범위에서 정밀하게 제어합니다. (Phase/Frequency 설정 가능)
- **센서 연동**: PIR 센서를 통한 모션 감지 및 BLE 비콘 RSSI 기반 재실 감지 기능을 제공합니다.
- **NVS(Non-Volatile Storage)**: 중요 시스템 변수 및 상태값은 Flash Memory의 NVS 영역에 안전하게 보관합니다.

---

## 3. 프론트엔드 (Frontend - WebUI / HTML / JS)

### 3.1 사용자 인터페이스 (User Interface)
- **메인 대시보드**: 실시간 풍속, 현재 모드, 팬 상태를 시각화합니다.
- **동적 자산 로딩**: 페이지별 필요한 JS/CSS를 독립적으로 서빙하여 초기 로딩 속도를 최적화합니다.
- **반응형 디자인**: 모바일 및 데스크탑 브라우저 모두에서 쾌적한 사용 환경을 제공합니다.

### 3.2 주요 기능 페이지
- **메인 제어**: 모드 전환(Preset/Fixed), 풍속 강도 및 변동성 실시간 조정.
- **스케줄 관리**: 요일별/기간별 작동 스케줄 설정 및 세그먼트 기반 세부 동작 정의.
- **사용자 프로필**: 개인화된 바람 설정을 저장하고 불러오는 기능.
- **시스템 설정**: 네트워크(WiFi), 하드웨어 핀 맵핑, 로그 레벨, 보안 설정 관리.

### 3.3 통신 및 동기화
- **실시간 데이터 바인딩**: WebSocket을 통해 백엔드 상태 변화를 즉각적으로 화면에 반영합니다.
- **설정 직렬화**: 복잡한 설정 객체를 JSON 형태로 변환하여 REST API를 통해 백엔드와 주고받습니다.
- **Dirty Flag 검사**: 변경된 설정 항목만 선택적으로 저장 요청하여 네트워크 부하를 최소화합니다.

---

## 4. 데이터 규격 (Data Specification)

### 4.1 JSON 명명 규칙
- **CamelCase**: 모든 JSON 키는 `camelCase`를 준수합니다 (예: `baseMinWind`, `simIntervalMs`).
- **Backward Compatibility**: 기존 `snake_case` 데이터와의 호환성을 위해 백엔드 파서에서 대체 키 조회를 지원합니다.

### 4.2 주요 설정 필드 (v015 신규 파라미터 포함)
- **Wind Preset**:
    - `baseMinWind`, `baseMaxWind`: 기본 풍속 최소/최대값 [m/s]
    - `gustProbBase`: 돌풍 발생 초당 확률 λ
    - `gustStrengthMax`: 돌풍 최대 배율
    - `thermalFreqBase`: 열기포 발생 초당 확률 λ
- **Motion Timing**:
    - `simIntervalMs`: 시뮬레이션 갱신 주기
    - `gustIntervalMs`: 돌풍 발생 평가 주기
    - `thermalIntervalMs`: 열기포 발생 평가 주기
