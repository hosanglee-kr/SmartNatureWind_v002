# `A40_Com_Utils_0203.h` 상세 Spec

## 1. 파일 역할 요약
v0203 전역에서 공통으로 사용하는 **로깅 매크로, 안전 문자열/메모리 유틸리티, ArduinoJson 헬퍼, FreeRTOS Mutex/Critical Section RAII 가드, 원자적 Dirty 플래그 연산, LittleFS JSON I/O 선언**을 제공하는 공통 유틸리티 헤더입니다.

## 2. 로깅 매크로 (`CL_D10_Logger` 래퍼)
- 기본 매크로: `A40_LOGE`, `A40_LOGW`, `A40_LOGI`, `A40_LOGD` (`[A40][__func__]` 태그 자동 삽입)
- 호출자 지정 매크로: `A40_LOGE_C`, `A40_LOGW_C`, `A40_LOGI_C`, `A40_LOGD_C` (`_A40__callerOrUnknown(p_callerFunc)` 사용)

## 3. `namespace A40_ComFunc` — 공통 유틸리티
| 함수 / 템플릿 | 역할 |
|---|---|
| `clampVal(val, low, high)` | `constexpr` 범위 제한 |
| `copyStr2Buffer_safe(dst, src, n, caller)` | 버퍼 오버플로 방지 안전 문자열 복사 (`strlcpy` 기반) |
| `cloneStr2SharedStr_safe(src, caller)` | `std::shared_ptr<char[]>` 안전 문자열 복제 |
| `getRandom01()`, `getRandomRange(min, max)` | 난수 생성 (`[0,1]`, `[min,max]`) |
| `Json_getStr / Json_getNum / Json_getBool / Json_getArr` | `JsonObjectConst` 기본값 폴백 안전 추출 |
| `Json_pickRootObject(doc, wrapKey)` | 래핑 키(`wrapKey`) 유무에 따른 루트 `JsonObjectConst` 선택 |
| `Json_ensureObject(v)` | `JsonVariant`를 `JsonObject`로 안전 변환 |
| `Json_copyStr / Json_copyStr_LogPolicy / Json_copyStrReq` | JSON 문자열 필드 복사 및 누락/정책 로깅 |
| `Json_removeKey(doc, key)` | `JsonDocument` 키 안전 삭제 |
| `freeObject(ptr, caller)`, `freeArray(ptr, caller)` | `delete` / `delete[]` 후 `nullptr` 초기화 |
| `Dirty_setAtomic / Dirty_clearAtomic / Dirty_readAtomic` | `portMUX_TYPE` 스핀락 기반 원자적 Dirty 플래그 조작 |

## 4. 동시성 RAII 가드 클래스
- **`CL_A40_MutexGuard_Semaphore`**: FreeRTOS `SemaphoreHandle_t`를 생성자에서 `xSemaphoreTake`하고 소멸자에서 `xSemaphoreGive`하는 RAII 락 가드 (타임아웃 및 획득 성공 여부 `isLocked()` 지원).
- **`CL_A40_MuxGuard_Critical`**: `portMUX_TYPE` 스핀락을 생성자에서 `portENTER_CRITICAL`하고 소멸자에서 `portEXIT_CRITICAL`하는 임계 구역 RAII 가드.

## 5. `namespace A40_IO` — JSON 파일 I/O 선언 (구현: `A40_Com_Utils_IO_0203.cpp`)
- `Load_File2JsonDoc_V21(p_path, p_doc, p_useBackup, p_caller)`
- `Save_JsonDoc2File_V21(p_path, p_doc, p_useBackup, p_pretty, p_caller)`
- `uint16_t A40_parseHHMMtoMin_24h(const char* p_time)`
