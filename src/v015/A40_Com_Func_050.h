// 소스명 : A40_Com_Func_050.h
#pragma once

#include <Arduino.h>
#include <string.h>
#include <strings.h>

#include <FS.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include <memory> // std::shared_ptr, std::default_delete
#include <new>    // std::nothrow

#include "A20_Const_Const_044.h"
#include "D10_Logger_040.h"

// ======================================================
// [A40 공통 로그 정책 보완]
// ------------------------------------------------------
// ✅ 요구사항: 공통함수 내부에서 CL_D10_Logger 출력 시,
//            "공용함수를 호출한 함수명(Caller Function)"이 로그에 찍혀야 함.
//
// ⚠️ C/C++ 한계:
//  - 공통 함수 내부에서 "호출자 함수명"을 자동으로 얻는 표준 방법은 없습니다.
//  - 따라서, 호출자가 __func__ 를 공통함수에 전달하도록 설계합니다.
//
// ✅ 적용 방식(운영 실수 방지):
//  1) 공통함수는 마지막 인자로 const char* p_callerFunc 를 받는 오버로드를 제공
//  2) 매크로(A40_IO_LOAD/A40_IO_SAVE 등)로 __func__ 전달을 강제/간편화
//  3) 기존 API(기존 시그니처)도 유지하되, callerFunc 미전달 시 "?"로 표시
//
// 사용 권장:
//  - A40_IO_LOAD(path, doc, useBackup)
//  - A40_IO_SAVE(path, doc, useBackup)
//  - A40_COPY_STR(dst, src, n)
//  - A40_CLONE_STR(src)
// ======================================================

// ------------------------------------------------------
// 공통: caller func 문자열 방어
// ------------------------------------------------------
static inline const char* _A40__callerOrUnknown(const char* p_callerFunc) {
    return (p_callerFunc && p_callerFunc[0]) ? p_callerFunc : "?";
}

// ======================================================
// 공통: A40 로그 wrapper (caller 포함)
//  - ⚠️ 주의: 아래 매크로는 "A40 공용함수 내부"에서 호출될 때 __func__는
//    "공용함수명"이 됩니다. 따라서 '호출자'를 찍고 싶다면 p_callerFunc 기반 로그를 사용하세요.
//  - 본 파일에서는 혼동 방지를 위해, 내부에서는 주로 CL_D10_Logger::log + p_callerFunc 사용.
// ======================================================
#define A40_LOGE(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] " _fmt, _A40__callerOrUnknown(__func__), ##__VA_ARGS__)
#define A40_LOGW(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] " _fmt, _A40__callerOrUnknown(__func__), ##__VA_ARGS__)
#define A40_LOGI(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[A40][%s] " _fmt, _A40__callerOrUnknown(__func__), ##__VA_ARGS__)
#define A40_LOGD(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[A40][%s] " _fmt, _A40__callerOrUnknown(__func__), ##__VA_ARGS__)

// ======================================================
// 1) 공용 헬퍼
// ======================================================
namespace A40_ComFunc {

// 입력된 값이 특정 범위(최솟값과 최댓값)를 벗어나지 않도록 제한
template <typename T>
inline constexpr T clampVal(T p_value, T p_lowValue, T p_highValue) {
    return (p_value < p_lowValue) ? p_lowValue : (p_value > p_highValue) ? p_highValue : p_value;
}

/**
 * @brief 안전한 문자열 복사 함수 (Null 및 Overflow 방지)
 * @param p_dst 복사될 목적지 버퍼
 * @param p_src 원본 문자열
 * @param p_n 목적지 버퍼의 전체 크기 (sizeof(dst))
 * @return size_t 복사하려 했던 원본 문자열의 길이
 */

inline size_t copyStr2Buffer_safe(char* p_dst, const char* p_src, size_t p_n) {
    // 기존 API 유지(Caller 미전달 -> 로그에 '?' 찍힘)
    if (!p_dst || p_n == 0) {
        return 0;
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][?] copyStr2Buffer_safe: invalid dst or size");
    }

    if (!p_src) {
        p_dst[0] = '\0';
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][?] copyStr2Buffer_safe: src is null");
        return 0;
    }

    return strlcpy(p_dst, p_src, p_n);
}

/**
 * @brief 안전한 문자열 복사 함수 (Caller 전달 버전)
 * @param p_callerFunc 호출자 함수명(__func__ 전달)
 */
inline size_t copyStr2Buffer_safe(char* p_dst, const char* p_src, size_t p_n, const char* p_callerFunc) {
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_dst || p_n == 0) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] copyStr2Buffer_safe: invalid dst or size", v_caller);
        return 0;
    }

    if (!p_src) {
        p_dst[0] = '\0';
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] copyStr2Buffer_safe: src is null", v_caller);
        return 0;
    }

    return strlcpy(p_dst, p_src, p_n);
}

/**
 * @brief 공유 가능한 안전한 C-String 복사본을 생성합니다. (AsyncWebServer 람다 캡처 전용)
 * @details
 *  - shared_ptr<char[]> + default_delete<char[]> 사용으로 new[] 해제 안정성 보장
 *  - 메모리 부족 시 nullptr 반환 + 로그 기록
 * @param p_src 복사할 원본 문자열 포인터
 * @return std::shared_ptr<char[]> 관리되는 문자열 (할당 실패 시 nullptr)
 */
inline std::shared_ptr<char[]> cloneStr2SharedStr_safe(const char* p_src) {
    // 기존 API 유지(Caller 미전달 -> 로그에 '?' 찍힘)
    if (!p_src) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][?] cloneStr2SharedStr_safe: Input p_src is null");
        return nullptr;
    }

    const size_t v_len = strlen(p_src) + 1; // include '\0'

    std::shared_ptr<char[]> v_buf(new (std::nothrow) char[v_len], std::default_delete<char[]>());

    if (!v_buf) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[A40][?] cloneStr2SharedStr_safe: Heap allocation failed! (Required: %u bytes)",
                           (unsigned)v_len);
        return nullptr;
    }

    strlcpy(v_buf.get(), p_src, v_len);
    return v_buf;
}

/**
 * @brief cloneStr2SharedStr_safe (Caller 전달 버전)
 */
inline std::shared_ptr<char[]> cloneStr2SharedStr_safe(const char* p_src, const char* p_callerFunc) {
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_src) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] cloneStr2SharedStr_safe: Input p_src is null", v_caller);
        return nullptr;
    }

    const size_t v_len = strlen(p_src) + 1; // include '\0'

    std::shared_ptr<char[]> v_buf(new (std::nothrow) char[v_len], std::default_delete<char[]>());

    if (!v_buf) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[A40][%s] cloneStr2SharedStr_safe: Heap allocation failed! (Required: %u bytes)",
                           v_caller,
                           (unsigned)v_len);
        return nullptr;
    }

    strlcpy(v_buf.get(), p_src, v_len);
    return v_buf;
}

inline float getRandom01() {
    // [0, 1) 범위. 1.0f가 나오지 않도록 +1 처리
    return static_cast<float>(esp_random()) / (static_cast<float>(UINT32_MAX) + 1.0f);
}

inline float getRandomRange(float p_min, float p_max) {
    if (p_min >= p_max) return p_min;
    return p_min + (getRandom01() * (p_max - p_min));
}

// ======================================================
// 1-1) 공용 JSON Helper (containsKey 금지 준수)
//  - JsonVariantConst null 체크 방식
//  - 랩핑 루트 선택 지원
// ======================================================
static inline const char* Json_getStr(JsonObjectConst p_obj, const char* p_key, const char* p_def) {
    if (p_obj.isNull()) return p_def;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return p_def;
    const char* s = v.as<const char*>();
    return (s && s[0]) ? s : p_def;
}

template <typename T>
static inline T Json_getNum(JsonObjectConst p_obj, const char* p_key, T p_def) {
    if (p_obj.isNull()) return p_def;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return p_def;
    return v.as<T>();
}

static inline bool Json_getBool(JsonObjectConst p_obj, const char* p_key, bool p_def) {
    if (p_obj.isNull()) return p_def;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return p_def;
    return v.as<bool>();
}

static inline JsonArrayConst Json_getArr(JsonObjectConst p_obj, const char* p_key) {
    if (p_obj.isNull()) return JsonArrayConst();
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) return JsonArrayConst();
    return v.as<JsonArrayConst>();
}

// 랩핑 키가 있으면 우선 사용, 없으면 루트 자체를 사용
static inline JsonObjectConst Json_pickRootObject(JsonDocument& p_doc, const char* p_wrapKey) {
    JsonObjectConst v_wrapped = p_doc[p_wrapKey].as<JsonObjectConst>();
    if (!v_wrapped.isNull()) return v_wrapped;
    return p_doc.as<JsonObjectConst>();
}

} // namespace A40_ComFunc

// ======================================================
// 2) Mutex Guard (caller 주입)
// ======================================================

#ifndef G_A40_MUTEX_TIMEOUT_100
# define G_A40_MUTEX_TIMEOUT_100 pdMS_TO_TICKS(100)
#endif

#ifndef G_A40_MUTEX_TIMEOUT_0
# define G_A40_MUTEX_TIMEOUT_0 pdMS_TO_TICKS(0)
#endif

/**
 * @class CL_A40_MutexGuard_Semaphore
 * @brief FreeRTOS Recursive Mutex 가드 (Lazy Init + RAII)
 *
 * - ctor에서 mutex가 nullptr이면 자동 생성 (Race Condition 방지: critical section)
 * - ctor에서 take 시도
 * - dtor에서 자동 unlock
 * - acquire()로 추가 대기 가능
 *
 * @note p_mutex는 반드시 "SemaphoreHandle_t 변수 자체"를 참조로 전달해야 합니다.
 *       (SemaphoreHandle_t* 포인터를 넘기면 컴파일/동작이 꼬입니다)
 */
class CL_A40_MutexGuard_Semaphore {
  public:
    /**
     * @param p_mutex     원본 핸들 참조 (SemaphoreHandle_t 변수)
     * @param p_timeout   대기 시간 (Tick)
     * @param p_caller    호출자 함수명 (매크로로 __func__ 주입 권장)
     */
    explicit CL_A40_MutexGuard_Semaphore(SemaphoreHandle_t& p_mutex, TickType_t p_timeout, const char* p_caller)
        : _mutexPtr(&p_mutex), _caller(_A40__callerOrUnknown(p_caller)) {
        _internalInitAndTake(p_timeout);
    }

    ~CL_A40_MutexGuard_Semaphore() { unlock(); }

    /**
     * @brief 명시적 뮤텍스 획득 (추가 대기가 필요한 경우)
     * @param p_timeoutMs 대기 시간 (ms). UINT32_MAX이면 portMAX_DELAY로 대기
     * @return true 성공, false 실패
     */
    bool acquire(uint32_t p_timeoutMs = UINT32_MAX) {
        if (_acquired) return true;
        if (!_mutexPtr || (*_mutexPtr == nullptr)) return false;

        const TickType_t v_ticks = (p_timeoutMs == UINT32_MAX) ? portMAX_DELAY : pdMS_TO_TICKS(p_timeoutMs);

        if (xSemaphoreTakeRecursive(*_mutexPtr, v_ticks) == pdTRUE) {
            _acquired = true;
            return true;
        }

        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Mutex acquire timeout (manual)", _caller);
        return false;
    }

    // @brief 명시적 뮤텍스 해제
    void unlock() {
        if (!_acquired) return;
        if (!_mutexPtr || (*_mutexPtr == nullptr)) return;

        if (xSemaphoreGiveRecursive(*_mutexPtr) == pdTRUE) {
            _acquired = false;
        } else {
            // give 실패면 실제 락이 유지됐을 수 있으므로 _acquired는 true 유지 (운영 안전)
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] Mutex unlock failed", _caller);
        }
    }

    // @brief 현재 락 점유 상태

    bool isAcquired() const { return _acquired; }

  private:
    CL_A40_MutexGuard_Semaphore(const CL_A40_MutexGuard_Semaphore&)            = delete;
    CL_A40_MutexGuard_Semaphore& operator=(const CL_A40_MutexGuard_Semaphore&) = delete;

    // @brief 내부: Lazy Init + Take (ctor 전용)
    void _internalInitAndTake(TickType_t p_timeout) {
        if (!_mutexPtr) return;

        // 1) Lazy init (Double-Checked Locking)
        if (*_mutexPtr == nullptr) {
            static portMUX_TYPE v_initMux = portMUX_INITIALIZER_UNLOCKED;
            portENTER_CRITICAL(&v_initMux);
            if (*_mutexPtr == nullptr) {
                *_mutexPtr = xSemaphoreCreateRecursiveMutex();
                if (*_mutexPtr == nullptr) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] CreateRecursiveMutex failed", _caller);
                }
            }
            portEXIT_CRITICAL(&v_initMux);
        }

        // 2) Take
        if (*_mutexPtr != nullptr) {
            if (xSemaphoreTakeRecursive(*_mutexPtr, p_timeout) == pdTRUE) {
                _acquired = true;
            } else {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Mutex acquire timeout (ctor)", _caller);
            }
        }
    }

    SemaphoreHandle_t* _mutexPtr = nullptr; // 원본 핸들 주소 (Lazy Init 반영)
    const char*        _caller   = "?";
    bool               _acquired = false;
};

// ======================================================
// 2-1) Critical Section Guard
// ======================================================
/**
 * @brief ESP32 Critical Section (Spinlock) 가드
 * @details
 * - 인터럽트를 금지하고 공유 자원을 보호합니다.
 * - 복사 생성 및 대입을 금지하여 안정성을 확보했습니다.
 */

class CL_A40_muxGuard_Critical {
  public:
    CL_A40_muxGuard_Critical(const CL_A40_muxGuard_Critical&)            = delete;
    CL_A40_muxGuard_Critical& operator=(const CL_A40_muxGuard_Critical&) = delete;

    // @param p_mux 원본 portMUX_TYPE의 주소
    explicit CL_A40_muxGuard_Critical(portMUX_TYPE* p_mux) : _mux(p_mux) {
        if (_mux) {
            portENTER_CRITICAL(_mux);
        }
    }

    ~CL_A40_muxGuard_Critical() {
        if (_mux) {
            portEXIT_CRITICAL(_mux);
        }
    }

  private:
    portMUX_TYPE* _mux = nullptr;
};

// ======================================================
// 1-2) Dirty Flag Atomic Helper (mux 인자 주입 방식)
//  - "공통 1개 mux" 금지 정책 준수
//  - 실수 방지 강화: RAII(CL_A40_muxGuard_Critical) 사용
// ======================================================
namespace A40_ComFunc {

static inline void Dirty_setAtomic(bool& p_flag, portMUX_TYPE& p_mux) {
    CL_A40_muxGuard_Critical v_guard(&p_mux);
    p_flag = true;
}

static inline void Dirty_clearAtomic(bool& p_flag, portMUX_TYPE& p_mux) {
    CL_A40_muxGuard_Critical v_guard(&p_mux);
    p_flag = false;
}

static inline bool Dirty_readAtomic(const bool& p_flag, portMUX_TYPE& p_mux) {
    CL_A40_muxGuard_Critical v_guard(&p_mux);
    return p_flag;
}

} // namespace A40_ComFunc

// ======================================================
// 2) IO 유틸 (LittleFS JSON + .bak 자동 복구)
//  - callerFunc 전달 버전(로그에 호출자 함수명 표시)
//  - 기존 API 유지(호환) + 권장 매크로 제공
// ======================================================
namespace A40_IO {

static inline bool _buildPathWithSuffix(
    char* p_dst, size_t p_dstSize, const char* p_path, const char* p_suffix, const char* p_callerFunc) {
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_dst || p_dstSize == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Path build failed: invalid dst/size", v_caller);
        return false;
    }

    memset(p_dst, 0, p_dstSize);
    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Path build failed: invalid base path", v_caller);
        return false;
    }

    int v_n = snprintf(p_dst, p_dstSize, "%s%s", p_path, (p_suffix ? p_suffix : ""));
    if (v_n < 0 || (size_t)v_n >= p_dstSize) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[IO][%s] Path overflow: base=%s suffix=%s",
                           v_caller,
                           p_path,
                           (p_suffix ? p_suffix : ""));
        p_dst[0] = '\0';
        return false;
    }
    return true;
}

static inline bool _parseJsonFileToDoc(const char* p_path, JsonDocument& p_doc, bool p_isBackupTag, const char* p_callerFunc) {
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    File v_f = LittleFS.open(p_path, "r");
    if (!v_f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] %s open failed: %s", v_caller, p_isBackupTag ? "Bak" : "Main", p_path);
        return false;
    }

    DeserializationError v_err = deserializeJson(p_doc, v_f);
    v_f.close();

    if (v_err) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[IO][%s] %s parse error: %s (%s)",
                           v_caller,
                           p_isBackupTag ? "Bak" : "Main",
                           v_err.c_str(),
                           p_path);
        return false;
    }
    return true;
}

/**
 * @brief Load_File2JsonDoc_V21 (Caller 전달 버전)
 */
inline bool Load_File2JsonDoc_V21(const char* p_path, JsonDocument& p_doc, bool p_useBackup, const char* p_callerFunc) {
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Load failed: Invalid path", v_caller);
        return false;
    }

    char v_bakPath[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(v_bakPath, sizeof(v_bakPath), p_path, ".bak", v_caller)) {
        return false;
    }

    // 0) main이 없을 때: bak를 "먼저 파싱 성공 확인" 후 main으로 복구
    if (!LittleFS.exists(p_path)) {
        if (p_useBackup && LittleFS.exists(v_bakPath)) {
            p_doc.clear();
            if (_parseJsonFileToDoc(v_bakPath, p_doc, true, v_caller)) {
                if (LittleFS.rename(v_bakPath, p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] Main missing. Restored from valid .bak: %s", v_caller, p_path);
                    return true;
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Restore rename failed: %s -> %s", v_caller, v_bakPath, p_path);
                    // doc은 유효. 파일 복구만 실패.
                    return true;
                }
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Backup exists but invalid: %s", v_caller, v_bakPath);
                return false;
            }
        } else {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[IO][%s] No file%s: %s", v_caller, p_useBackup ? " & No backup" : "", p_path);
            return false;
        }
    }

    // 1) main 로드 시도
    p_doc.clear();
    if (_parseJsonFileToDoc(p_path, p_doc, false, v_caller)) {
        return true;
    }

    // 2) main 파싱 실패 -> bak 최종 시도
    if (p_useBackup && LittleFS.exists(v_bakPath)) {
        p_doc.clear();
        if (_parseJsonFileToDoc(v_bakPath, p_doc, true, v_caller)) {
            if (LittleFS.exists(p_path)) {
                LittleFS.remove(p_path);
            }
            if (LittleFS.rename(v_bakPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] Recovered from valid backup: %s", v_caller, p_path);
                return true;
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Backup rename->main failed: %s -> %s", v_caller, v_bakPath, p_path);
                // doc은 유효. 파일 복구만 실패.
                return true;
            }
        }
    }

    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Critical: All load attempts failed: %s", v_caller, p_path);
    return false;
}

/**
 * @brief 파일 -> JsonDocument 로드 (main 우선, 실패 시 .bak로 복구/복원)
 * @note  - p_useBackup=false면 .bak 관련 경로/복구 동작을 하지 않습니다.
 *        - 최초 실행으로 main/bak 둘 다 없을 수 있으므로 false 반환 + INFO 로그.
 */
inline bool Load_File2JsonDoc_V21(const char* p_path, JsonDocument& p_doc, bool p_useBackup = true) {
    // 기존 API 유지: callerFunc 모름
    return Load_File2JsonDoc_V21(p_path, p_doc, p_useBackup, "?");
}

/**
 * @brief JsonDocument -> 파일 저장 (tmp -> main, 옵션: main->bak)
 * @note  - 전원차단/중간쓰기 대비: tmp에 먼저 기록 후 rename으로 반영
 *        - p_useBackup=true면 기존 main을 .bak으로 보관
 */

/**
 * @brief Save_JsonDoc2File_V21 (Caller 전달 버전)
 */
inline bool Save_JsonDoc2File_V21(const char* p_path, const JsonDocument& p_doc, bool p_useBackup, const char* p_callerFunc) {
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Save failed: Invalid path", v_caller);
        return false;
    }

    char v_bakPath[A20_Const::LEN_PATH + 8];
    char v_tmpPath[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(v_bakPath, sizeof(v_bakPath), p_path, ".bak", v_caller)) return false;
    if (!_buildPathWithSuffix(v_tmpPath, sizeof(v_tmpPath), p_path, ".tmp", v_caller)) return false;

    // 0) tmp 청소
    if (LittleFS.exists(v_tmpPath)) {
        LittleFS.remove(v_tmpPath);
    }

    // 1) tmp로 먼저 저장
    File v_f = LittleFS.open(v_tmpPath, "w");
    if (!v_f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Save failed: tmp open error %s", v_caller, v_tmpPath);
        return false;
    }

    size_t v_bytes = serializeJsonPretty(p_doc, v_f);
    v_f.close();

    if (v_bytes == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Save failed: Zero bytes written %s", v_caller, v_tmpPath);
        LittleFS.remove(v_tmpPath);
        return false;
    }

    bool v_hadMain = LittleFS.exists(p_path);

    // 2) main -> bak (옵션)
    if (v_hadMain && p_useBackup) {
        if (LittleFS.exists(v_bakPath)) {
            LittleFS.remove(v_bakPath);
        }
        if (!LittleFS.rename(p_path, v_bakPath)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Save failed: Cannot create .bak for %s", v_caller, p_path);
            LittleFS.remove(v_tmpPath);
            return false;
        }
    } else if (v_hadMain && !p_useBackup) {
        LittleFS.remove(p_path);
    }

    // 3) tmp -> main 반영
    if (!LittleFS.rename(v_tmpPath, p_path)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Save failed: tmp rename->main error %s", v_caller, p_path);

        // rollback: main이 없다면 bak 복구
        if (p_useBackup && LittleFS.exists(v_bakPath)) {
            if (LittleFS.exists(p_path)) {
                LittleFS.remove(p_path);
            }
            if (LittleFS.rename(v_bakPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] Rollback restored from .bak: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] Rollback rename failed: %s -> %s", v_caller, v_bakPath, p_path);
            }
        }

        if (LittleFS.exists(v_tmpPath)) {
            LittleFS.remove(v_tmpPath);
        }
        return false;
    }

    // bak 유지(운영급 기본값)
    return true;
}

inline bool Save_JsonDoc2File_V21(const char* p_path, const JsonDocument& p_doc, bool p_useBackup = true) {
    // 기존 API 유지: callerFunc 모름
    return Save_JsonDoc2File_V21(p_path, p_doc, p_useBackup, "?");
}

} // namespace A40_IO

// ======================================================
// ✅ 실수 방지 강화 매크로
//  - __func__ : 표준/안전 (ESP32 GCC에서 안정적)
//  - p_mutexRef는 "SemaphoreHandle_t 변수"를 넣어야 함 (포인터 금지)
// ======================================================

// 일반: 변수명/타임아웃 지정
#define CL_A40_MutexGuard(p_guardName, p_mutexRef, p_timeoutTicks) \
    CL_A40_MutexGuard_Semaphore p_guardName((p_mutexRef), (p_timeoutTicks), __func__)

// 기본 100ms
#define LOCK_GUARD_DEFAULT(p_guardName, p_mutexRef) \
    CL_A40_MutexGuard_Semaphore p_guardName((p_mutexRef), G_A40_MUTEX_TIMEOUT_100, __func__)

// ======================================================
// 3) 권장 매크로 (caller=__func__ 자동 전달)
//  - "호출자 함수명 로그"를 확실히 보장하려면 반드시 이 매크로를 사용하세요.
// ======================================================
#define A40_IO_LOAD(_path, _doc, _useBak) A40_IO::Load_File2JsonDoc_V21((_path), (_doc), (_useBak), __func__)
#define A40_IO_SAVE(_path, _doc, _useBak) A40_IO::Save_JsonDoc2File_V21((_path), (_doc), (_useBak), __func__)

#define A40_COPY_STR(_dst, _src, _n)      A40_ComFunc::copyStr2Buffer_safe((_dst), (_src), (_n), __func__)
#define A40_CLONE_STR(_src)               A40_ComFunc::cloneStr2SharedStr_safe((_src), __func__)
