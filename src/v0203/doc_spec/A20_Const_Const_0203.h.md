# `A20_Const_Const_0203.h` 상세 Spec

# A20_Const_Const_0203.h Spec 문서

## 1. 파일 역할 요약
`A20_Const` 네임스페이스 내의 전역 상수(SSOT)를 정의하여 펌웨어 버전, JSON 파일 매핑, 시간 설정, Wi-Fi/NTP/Gemini API 경로 및 부트 시퀀스 지연 시간을 일관성 있게 관리합니다.

## 2. 주요 클래스/구조체/열거형
*   **클래스/구조체**: 없음 (전부 `constexpr` 상수 정의)
*   **네임스페이스**: `A20_Const`
    *   모듈별 버전 (`VER_CONTROL`, `VER_CONFIG`, `VER_API`, `VER_SIMUL`)
    *   기본 프리셋/스타일 코드 및 이름 (`DEFAULT_PRESET_CODE`, `DEFAULT_STYLE_CODE`)
    *   JSON 파일 버전 필드 (`G_JSON_VERSION`)

## 3. 주요 상수 및 동작
*   **버전 관리**: `FW_VERSION` (표시용), `FW_VERSION_SEMVER` (비교용) 을 통해 라우트 체크 (`routeFirmwareCheck`) 로직 지원.
*   **파일 매핑**: `/json/10_cfg_jsonFile.json` 경로 및 버전 필드 동기화.
*   **시간 설정**: NTP 서버 (`kr.pool.ntp.org`, Fallback), 타임존 (`Asia/Seoul`), 에포크 sanity 범위 (2023~2099) 정의.
*   **Gemini API**: `generativelanguage.googleapis.com` 호스트, REST URL 및 WebSocket Live URL 정의.
*   **Wi-Fi/AP 설정**: Recovery AP (`NatureWind_Recovery`), IP/Subnet 마스크, 최대 연결 수 (4) 정의.
*   **부트 시퀀스**: Serial 초기화 지연 (1500ms), USB CDC 폴링/타임아웃 (3000ms) 등 하드코딩된 대기 시간 제거.
*   **배열 제한**: 스케줄 (8), 섹먼트 (8), 사용자 프로필 (6), 스텝 (8) 등 데이터 구조 크기 정의.

## 4. 외부 의존성 / 공유 상태 / 락 특이사항
*   **외부 의존성**: `<Arduino.h>` 포함.
*   **공유 상태**: 전역 상수 (`constexpr`) 로만 사용되며, 런타임에 변경되지 않는 읽기 전용 데이터입니다.
*   **락 (Mutex)**: 해당 파일에는 락 관련 로직이 없으며, 모든 값은 컴파일 시점에 결정됩니다.
