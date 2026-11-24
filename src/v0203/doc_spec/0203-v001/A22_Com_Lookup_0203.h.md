# `A22_Com_Lookup_0203.h` 상세 Spec

## 1. 파일 역할 요약
`A20_Const_*_0203.h`에 정의된 **바람 프리셋(`WindPreset`), 바람 스타일(`WindStyle`), 세그먼트 모드(`SegmentMode`), 스텝 타입(`StepType`)**의 문자열 코드 ↔ 열거형/구조체 포인터/인덱스 상호 변환을 수행하는 헤더 전용 `inline` 룩업 유틸리티입니다.

## 2. 주요 열거형 및 참조 구조체
- `EN_A20_step_type_t`: 스텝 타입 (`PRESET`, `FIXED`, `REST`)
- `EN_A20_segment_mode_t`: 세그먼트 동작 모드
- `ST_A20_WindDict_t`: 런타임 바람 사전 (`presets[]`, `styles[]`)
- `ST_A20_WindPreset_t` / `ST_A20_WindStyles_t` / `ST_A20_SegmentMode_t`: 정적 프리셋·스타일·모드 메타데이터 구조체

## 3. 주요 `inline` 함수 및 동작

| 함수 시그니처 | 역할 및 동작 |
|---|---|
| `EN_A20_step_type_t A20_stepTypeFromString(const char* p_str)` | 문자열(`"PRESET"`, `"FIXED"`, `"REST"` 등)을 `EN_A20_step_type_t`로 변환 (대소문자 무시, 기본값 폴백) |
| `const char* A20_stepTypeToString(EN_A20_step_type_t p_type)` | `EN_A20_step_type_t` 열거형을 문자열로 변환 |
| `EN_A20_segment_mode_t A20_modeFromString(const char* p_str)` | 세그먼트 모드 문자열을 `EN_A20_segment_mode_t`로 변환 |
| `const char* A20_modeToString(EN_A20_segment_mode_t p_mode)` | `EN_A20_segment_mode_t`를 문자열로 변환 |
| `int8_t A20_getStaticPresetIndexByCode(const char* p_code)` | 정적 프리셋 배열에서 `code` 일치 인덱스 반환 (없으면 `-1`) |
| `const char* A20_getPresetNameByCode(const char* p_code)` | 프리셋 `code`에 해당하는 표시 이름 반환 |
| `int16_t A20_findPresetIndexByCode(const ST_A20_WindDict_t& p_dict, const char* p_code)` | 런타임 `ST_A20_WindDict_t` 내 프리셋 인덱스 검색 (없으면 `-1`) |
| `int16_t A20_findStyleIndexByCode(const ST_A20_WindDict_t& p_dict, const char* p_code)` | 런타임 `ST_A20_WindDict_t` 내 스타일 인덱스 검색 (없으면 `-1`) |
| `const ST_A20_WindPreset_t* A20_findPresetByCode(const char* p_code)` | 정적 프리셋 구조체 포인터 반환 (없으면 `nullptr`) |
| `const ST_A20_WindStyles_t* A20_findStyleByCode(const char* p_code)` | 정적 스타일 구조체 포인터 반환 (없으면 `nullptr`) |
| `const ST_A20_SegmentMode_t* A20_findSegModeByCode(const char* p_code)` | 정적 세그먼트 모드 구조체 포인터 반환 (없으면 `nullptr`) |

## 4. 외부 의존성 / 특이사항
- **의존성**: `A20_Const_0203.h` (정적 배열 `G_A20_WindPreset_Arr`, `G_A20_WindStyle_Arr` 등), `strcasecmp` (대소문자 무시 비교).
- **스레드 안전성**: 읽기 전용 정적 테이블 또는 호출자가 전달한 `const` 참조만 조회하므로 별도 락 없이 재진입(Reentrant) 가능합니다.
