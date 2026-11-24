# `A40_Com_Utils_IO_0203.cpp` 상세 Spec

## 1. 파일 역할 요약
`A40_Com_Utils_0203.h`에 선언된 `namespace A40_IO`의 **원자적 JSON 파일 저장/로드(임시 파일 `.tmp` + 백업 `.bak` 2중 보호)** 및 **24시간 `"HH:MM"` 시각 파싱** 기능을 구현합니다.

## 2. 내부 헬퍼 (`anonymous namespace`)
- **`_buildPathWithSuffix(p_dst, p_dstSize, p_path, p_suffix, p_caller)`**: 원본 경로에 `.tmp` 또는 `.bak` 접미사를 안전하게 결합 (`A40_Const::LEN_PATH` 초과 시 에러 로깅 후 `false`).
- **`_parseJsonFileToDoc(p_path, p_doc, p_isBackup, p_caller)`**: LittleFS에서 파일을 열어 `deserializeJson` 수행. 실패 시 메인/백업 구분하여 `EN_L10_LOG_ERROR` 로깅.

## 3. 공개 API (`namespace A40_IO`)
| 함수 | 동작 및 안전 정책 |
|---|---|
| `Load_File2JsonDoc_V21(p_path, p_doc, p_useBackup, p_caller)` | 1) 메인 파일 로드 및 JSON 파싱 시도.<br>2) 실패 시 `p_useBackup == true`이면 `.bak` 파일에서 복구 로드.<br>3) 백업 복구 성공 시 메인 파일로 자동 복원 시도. |
| `Save_JsonDoc2File_V21(p_path, p_doc, p_useBackup, p_pretty, p_caller)` | 1) `.tmp` 임시 파일에 먼저 `serializeJson` / `serializeJsonPretty` 기록.<br>2) `p_useBackup == true`이면 기존 메인 파일을 `.bak`으로 백업.<br>3) `.tmp`를 메인 파일로 원자적 교체(rename)하여 쓰기 도중 전원 차단 시 데이터 손상 방지. |
| `A40_parseHHMMtoMin_24h(p_time)` | `"HH:MM"` 형식 문자열을 분 단위(`0 ~ 1439`) `uint16_t`로 변환. 유효하지 않은 형식이면 기본값/폴백 반환. |

## 4. 외부 의존성 / 특이사항
- **파일시스템**: `LittleFS` 직접 사용.
- **로깅**: `CL_D10_Logger` (`A40_LOGE_C` 등 호출자 태그 유지).
- **동시성**: LittleFS 파일 접근 시 호출자 측에서 파일시스템/설정 뮤텍스를 획득한 상태로 호출해야 합니다.
