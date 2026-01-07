// ======================================================
// 소스명 : A40_Com_Func_051.h
// 모듈명 : Smart Nature Wind - Common Utilities (Full)
// ======================================================
#pragma once

#include <Arduino.h>
#include <string.h>
#include <strings.h>

#include <FS.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include <memory> // std::shared_ptr
#include <new>    // std::nothrow

#include "A20_Const_Const_044.h"
#include "D10_Logger_040.h"

// ======================================================
// [A40 공통 로그 정책]
// ======================================================
// - 공통함수 내부 로그에 "호출자 함수명" 출력
// - 호출자가 __func__ 를 전달하도록 매크로 제공
// - caller 미전달 시 "?" 표시
// ======================================================

static inline const char* _A40__callerOrUnknown(const char* p_callerFunc) {
    return (p_callerFunc && p_callerFunc[0]) ? p_callerFunc : "?";
}

// ======================================================
// 공통 로그 매크로
// ======================================================
#define A40_LOGE(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] " _fmt, __func__, ##__VA_ARGS__)
#define A40_LOGW(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_WARN,  "[A40][%s] " _fmt, __func__, ##__VA_ARGS__)
#define A40_LOGI(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_INFO,  "[A40][%s] " _fmt, __func__, ##__VA_ARGS__)
#define A40_LOGD(_fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[A40][%s] " _fmt, __func__, ##__VA_ARGS__)

#define A40_LOGE_C(_caller, _fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] " _fmt, _A40__callerOrUnknown((_caller)), ##__VA_ARGS__)
#define A40_LOGW_C(_caller, _fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_WARN,  "[A40][%s] " _fmt, _A40__callerOrUnknown((_caller)), ##__VA_ARGS__)
#define A40_LOGI_C(_caller, _fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_INFO,  "[A40][%s] " _fmt, _A40__callerOrUnknown((_caller)), ##__VA_ARGS__)
#define A40_LOGD_C(_caller, _fmt, ...) \
    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[A40][%s] " _fmt, _A40__callerOrUnknown((_caller)), ##__VA_ARGS__)

// ======================================================
// 1) 공용 헬퍼
// ======================================================
namespace A40_ComFunc {

template <typename T>
inline constexpr T clampVal(T p_value, T p_lowValue, T p_highValue) {
    return (p_value < p_lowValue) ? p_lowValue : (p_value > p_highValue) ? p_highValue : p_value;
}

// -------------------------
// 문자열 유틸
// -------------------------
inline size_t copyStr2Buffer_safe(
    char* p_dst,
    const char* p_src,
    size_t p_n,
    const char* p_callerFunc = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_dst || p_n == 0) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] copyStr2Buffer_safe: invalid dst/size", v_caller);
        return 0;
    }

    if (!p_src) {
        p_dst[0] = '\0';
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] copyStr2Buffer_safe: src is null", v_caller);
        return 0;
    }

    return strlcpy(p_dst, p_src, p_n);
}

inline std::shared_ptr<char[]> cloneStr2SharedStr_safe(
    const char* p_src,
    const char* p_callerFunc = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_src) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] cloneStr2SharedStr_safe: src is null", v_caller);
        return nullptr;
    }

    const size_t v_len = strlen(p_src) + 1;
    std::shared_ptr<char[]> v_buf(new (std::nothrow) char[v_len], std::default_delete<char[]>());

    if (!v_buf) {
        CL_D10_Logger::log(
            EN_L10_LOG_ERROR,
            "[A40][%s] cloneStr2SharedStr_safe: alloc failed (%u bytes)",
            v_caller,
            (unsigned)v_len);
        return nullptr;
    }

    strlcpy(v_buf.get(), p_src, v_len);
    return v_buf;
}

// -------------------------
// Random
// -------------------------
inline float getRandom01() {
    return static_cast<float>(esp_random()) /
           (static_cast<float>(UINT32_MAX) + 1.0f);
}

inline float getRandomRange(float p_min, float p_max) {
    if (p_min >= p_max) return p_min;
    return p_min + getRandom01() * (p_max - p_min);
}

// ======================================================
// JSON Helper (containsKey 금지 정책)
// ======================================================
static inline const char* Json_getStr(JsonObjectConst p_obj, const char* p_key, const char* p_defaultVal) {
    if (p_obj.isNull()) return p_defaultVal;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull() || !v.is<const char*>()) return p_defaultVal;
    const char* s = v.as<const char*>();
    return (s && s[0]) ? s : p_defaultVal;
}

template <typename T>
static inline T Json_getNum(JsonObjectConst p_obj, const char* p_key, T p_defaultVal) {
    if (p_obj.isNull()) return p_defaultVal;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull() || !v.is<T>()) return p_defaultVal;
    return v.as<T>();
}

static inline bool Json_getBool(JsonObjectConst p_obj, const char* p_key, bool p_defaultVal) {
    if (p_obj.isNull()) return p_defaultVal;
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull() || !v.is<bool>()) return p_defaultVal;
    return v.as<bool>();
}

static inline JsonArrayConst Json_getArr(JsonObjectConst p_obj, const char* p_key) {
    if (p_obj.isNull()) return JsonArrayConst();
    JsonVariantConst v = p_obj[p_key];
    if (v.isNull() || !v.is<JsonArrayConst>()) return JsonArrayConst();
    return v.as<JsonArrayConst>();
}

static inline JsonObjectConst Json_pickRootObject(JsonDocument& p_doc, const char* p_wrapKey) {
    JsonObjectConst v = p_doc[p_wrapKey].as<JsonObjectConst>();
    return v.isNull() ? p_doc.as<JsonObjectConst>() : v;
}

static inline JsonObjectConst Json_pickRootObject(const JsonDocument& p_doc, const char* p_wrapKey) {
    JsonObjectConst v = p_doc[p_wrapKey].as<JsonObjectConst>();
    return v.isNull() ? p_doc.as<JsonObjectConst>() : v;
}




// ------------------------------------------------------
// Json_copyStr (Silent-safe)
//  - JSON에서 문자열 추출 후 dst에 복사
//  - key 없음/타입불일치/null/빈문자열 => defaultVal 사용
//  - dst는 항상 0으로 초기화(찌꺼기 방지)
//  - 로그는 "복사 실패(인자 문제)" 같은 케이스만 (필요 시)
// ------------------------------------------------------
static inline bool Json_copyStr(
    JsonObjectConst p_obj,
    const char*     p_key,
    char*           p_dst,
    size_t          p_dstSize,
    const char*     p_defaultVal = "",
    const char*     p_callerFunc = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    // dst 안전성
    if (!p_dst || p_dstSize == 0) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStr: invalid dst/size", v_caller);
        return false;
    }

    // 항상 찌꺼기 제거
    memset(p_dst, 0, p_dstSize);

    // key 안전성
    if (!p_key || !p_key[0]) {
        // key 자체가 비정상인 경우만 경고 (운영에서도 유의미)
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStr: invalid key", v_caller);
        // default로 채움
        const char* v_def = (p_defaultVal ? p_defaultVal : "");
        strlcpy(p_dst, v_def, p_dstSize);
        return false;
    }

    // 기존 공통함수 활용 (조용한 기본 정책)
    const char* v_src = A40_ComFunc::Json_getStr(p_obj, p_key, p_defaultVal ? p_defaultVal : "");
    // Json_getStr가 빈문자열 방어까지 해서 반환하므로 그대로 복사
    strlcpy(p_dst, (v_src ? v_src : ""), p_dstSize);
    return true;
}

// ------------------------------------------------------
// Json_copyStr_LogPolicy (copyStr2Buffer_safe log policy)
//  - JSON에서 문자열 추출 후 dst에 복사
//  - src null / dst 문제 등은 copyStr2Buffer_safe 정책으로 로그 남김
//  - dst는 항상 0으로 초기화(찌꺼기 방지)
//  - key가 없거나 타입 불일치면 defaultVal로 대체 (여기서는 "src null"이 아님)
// ------------------------------------------------------
static inline bool Json_copyStr_LogPolicy(
    JsonObjectConst p_obj,
    const char*     p_key,
    char*           p_dst,
    size_t          p_dstSize,
    const char*     p_defaultVal = "",
    const char*     p_callerFunc = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_dst || p_dstSize == 0) {
        // copyStr2Buffer_safe도 로그를 찍지만, 여기서도 명시적으로 찍어도 됨
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStr_LogPolicy: invalid dst/size", v_caller);
        return false;
    }

    // 항상 찌꺼기 제거
    memset(p_dst, 0, p_dstSize);

    if (!p_key || !p_key[0]) {
        // key 자체 비정상 -> 강경 정책에서도 경고
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStr_LogPolicy: invalid key", v_caller);
        // default 복사도 log policy로 처리
        A40_ComFunc::copyStr2Buffer_safe(p_dst, (p_defaultVal ? p_defaultVal : ""), p_dstSize, v_caller);
        return false;
    }

    // JSON에서 문자열 후보를 얻되, "없으면 default"는 정상 흐름으로 간주
    // (즉, src가 null이 되지 않게 default를 주입)
    const char* v_src = A40_ComFunc::Json_getStr(p_obj, p_key, p_defaultVal ? p_defaultVal : "");

    // copyStr2Buffer_safe는 src==null 등을 로그로 남김.
    // 여기서는 v_src가 null일 가능성을 최소화했지만, 그래도 방어.
    size_t v_copied = A40_ComFunc::copyStr2Buffer_safe(p_dst, (v_src ? v_src : ""), p_dstSize, v_caller);
    return (v_copied > 0);
}

// ------------------------------------------------------
// Json_copyStrReq (Required-key policy)
//  - "필수 키" 용도: 키가 없거나 타입이 문자열이 아니거나 빈 문자열이면 경고 로그
//  - fallback(defaultVal)로는 채우되, 반환값은 false로 처리(=입력 JSON이 요구사항 불만족)
//  - dst는 항상 memset(0)으로 초기화(찌꺼기 방지)
//  - 기존 공통함수(Json_getStr, copyStr2Buffer_safe) 활용
// ------------------------------------------------------

static inline bool Json_copyStrReq(
    JsonObjectConst p_obj,
    const char*     p_key,
    char*           p_dst,
    size_t          p_dstSize,
    const char*     p_defaultVal = "",
    const char*     p_callerFunc = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_callerFunc);

    if (!p_dst || p_dstSize == 0) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStrReq: invalid dst/size", v_caller);
        return false;
    }

    // 항상 찌꺼기 제거
    memset(p_dst, 0, p_dstSize);

    if (!p_key || !p_key[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] Json_copyStrReq: invalid key", v_caller);
        A40_ComFunc::copyStr2Buffer_safe(p_dst, (p_defaultVal ? p_defaultVal : ""), p_dstSize, v_caller);
        return false;
    }

    // containsKey 금지 -> JsonVariantConst 기반 필수성 체크
    if (p_obj.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStrReq: obj is null (key=%s)", v_caller, p_key);
        A40_ComFunc::copyStr2Buffer_safe(p_dst, (p_defaultVal ? p_defaultVal : ""), p_dstSize, v_caller);
        return false;
    }

    JsonVariantConst v = p_obj[p_key];
    if (v.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStrReq: missing key=%s", v_caller, p_key);
        A40_ComFunc::copyStr2Buffer_safe(p_dst, (p_defaultVal ? p_defaultVal : ""), p_dstSize, v_caller);
        return false;
    }

    if (!v.is<const char*>()) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStrReq: type mismatch (key=%s)", v_caller, p_key);
        A40_ComFunc::copyStr2Buffer_safe(p_dst, (p_defaultVal ? p_defaultVal : ""), p_dstSize, v_caller);
        return false;
    }

    const char* v_src = v.as<const char*>();
    if (!v_src || !v_src[0]) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Json_copyStrReq: empty string (key=%s)", v_caller, p_key);
        A40_ComFunc::copyStr2Buffer_safe(p_dst, (p_defaultVal ? p_defaultVal : ""), p_dstSize, v_caller);
        return false;
    }

    // 정상: 요구사항 충족
    A40_ComFunc::copyStr2Buffer_safe(p_dst, v_src, p_dstSize, v_caller);
    return true;
}


} // namespace A40_ComFunc


// ======================================================
// 2) Mutex Guard (Recursive Mutex, RAII, Lazy Init)
// ======================================================
#ifndef G_A40_MUTEX_TIMEOUT_100
#define G_A40_MUTEX_TIMEOUT_100 pdMS_TO_TICKS(100)
#endif

class CL_A40_MutexGuard_Semaphore {
  public:
    explicit CL_A40_MutexGuard_Semaphore(
        SemaphoreHandle_t& p_mutex,
        TickType_t p_timeout,
        const char* p_caller)
        : _mutexPtr(&p_mutex),
          _caller(_A40__callerOrUnknown(p_caller))
    {
        _internalInitAndTake(p_timeout);
    }

    ~CL_A40_MutexGuard_Semaphore() {
        unlock();
    }

    bool acquireTicks(TickType_t p_timeoutTicks) {
        if (_acquired) return true;
        if (!_mutexPtr || !*_mutexPtr) return false;

        if (xSemaphoreTakeRecursive(*_mutexPtr, p_timeoutTicks) == pdTRUE) {
            _acquired = true;
            return true;
        }

        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[A40][%s] Mutex acquire timeout (ticks=%u)",
                           _caller,
                           (unsigned)p_timeoutTicks);
        return false;
    }

    bool acquireMs(uint32_t p_timeoutMs = UINT32_MAX) {
        if (_acquired || !_mutexPtr || !*_mutexPtr) return _acquired;
        TickType_t v_ticks =
            (p_timeoutMs == UINT32_MAX) ? portMAX_DELAY : pdMS_TO_TICKS(p_timeoutMs);

        if (xSemaphoreTakeRecursive(*_mutexPtr, v_ticks) == pdTRUE) {
            _acquired = true;
            return true;
        }

        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] Mutex acquire timeout", _caller);
        return false;
    }

    void unlock() {
        if (!_acquired || !_mutexPtr || !*_mutexPtr) return;
        if (xSemaphoreGiveRecursive(*_mutexPtr) == pdTRUE) {
            _acquired = false;
        } else {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] Mutex unlock failed", _caller);
        }
    }

    bool isAcquired() const { return _acquired; }

  private:
    void _internalInitAndTake(TickType_t p_timeout) {
        if (!_mutexPtr) return;

        if (*_mutexPtr == nullptr) {
            static portMUX_TYPE s_initMux = portMUX_INITIALIZER_UNLOCKED;
            portENTER_CRITICAL(&s_initMux);
            if (*_mutexPtr == nullptr) {
                *_mutexPtr = xSemaphoreCreateRecursiveMutex();
                if (*_mutexPtr == nullptr) {
                    CL_D10_Logger::log(
                        EN_L10_LOG_ERROR,
                        "[A40][%s] CreateRecursiveMutex failed",
                        _caller);
                }
            }
            portEXIT_CRITICAL(&s_initMux);
        }

        if (*_mutexPtr &&
            xSemaphoreTakeRecursive(*_mutexPtr, p_timeout) == pdTRUE) {
            _acquired = true;
        }
    }

    SemaphoreHandle_t* _mutexPtr = nullptr;
    const char* _caller = "?";
    bool _acquired = false;
};


// ======================================================
// 3) Critical Section Guard
// ======================================================
class CL_A40_muxGuard_Critical {
  public:
    explicit CL_A40_muxGuard_Critical(portMUX_TYPE* p_flagSpinlock) : _flagSpinlock(p_flagSpinlock) {
        if (_flagSpinlock) portENTER_CRITICAL(_flagSpinlock);
    }
    ~CL_A40_muxGuard_Critical() {
        if (_flagSpinlock) portEXIT_CRITICAL(_flagSpinlock);
    }
  private:
    portMUX_TYPE* _flagSpinlock = nullptr;
};

// ======================================================
// 4) Dirty Flag Atomic Helper (mux 인자 주입)
// ======================================================
namespace A40_ComFunc {

static inline void Dirty_setAtomic(bool& p_flag, portMUX_TYPE& p_flagSpinlock) {
    CL_A40_muxGuard_Critical g(&p_flagSpinlock);
    p_flag = true;
}

static inline void Dirty_clearAtomic(bool& p_flag, portMUX_TYPE& p_flagSpinlock) {
    CL_A40_muxGuard_Critical g(&p_flagSpinlock);
    p_flag = false;
}

static inline bool Dirty_readAtomic(const bool& p_flag, portMUX_TYPE& p_flagSpinlock) {
    CL_A40_muxGuard_Critical g(&p_flagSpinlock);
    return p_flag;
}

} // namespace A40_ComFunc

// ======================================================
// 5) IO Utility (LittleFS + JSON + .bak Recovery)
// ======================================================
namespace A40_IO {

// 내부 유틸
static inline bool _buildPathWithSuffix(
    char* p_dst, size_t p_dstSize,
    const char* p_path, const char* p_suffix,
    const char* p_caller)
{
    const char* v = _A40__callerOrUnknown(p_caller);

    if (!p_dst || p_dstSize == 0 || !p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] invalid path buffer", v);
        return false;
    }

    int n = snprintf(p_dst, p_dstSize, "%s%s", p_path, p_suffix ? p_suffix : "");
    if (n < 0 || (size_t)n >= p_dstSize) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] path overflow: %s", v, p_path);
        return false;
    }
    return true;
}

static inline bool _parseJsonFileToDoc(
    const char* p_path, JsonDocument& p_doc,
    bool p_isBackup, const char* p_caller)
{
    const char* v = _A40__callerOrUnknown(p_caller);
    File f = LittleFS.open(p_path, "r");
    if (!f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] open failed: %s", v, p_path);
        return false;
    }

    DeserializationError err = deserializeJson(p_doc, f);
    f.close();

    if (err) {
        CL_D10_Logger::log(
            EN_L10_LOG_ERROR,
            "[IO][%s] %s parse error: %s (%s)",
            v, p_isBackup ? "bak" : "main", err.c_str(), p_path);
        return false;
    }
    return true;
}

// Load
inline bool Load_File2JsonDoc_V21(
    const char* p_path,
    JsonDocument& p_doc,
    bool p_useBackup,
    const char* p_caller = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_caller);

    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] invalid path", v_caller);
        return false;
    }

    char bak[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(bak, sizeof(bak), p_path, ".bak", v_caller)) return false;

    if (!LittleFS.exists(p_path)) {
        if (p_useBackup && LittleFS.exists(bak)) {
            p_doc.clear();
            if (_parseJsonFileToDoc(bak, p_doc, true, v_caller)) {
                // rename 실패 체크/로그 보강 (정책 유지: doc 유효면 true)
                if (LittleFS.rename(bak, p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] restored from bak: %s", v_caller, p_path);
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] restore rename failed: %s -> %s", v_caller, bak, p_path);
                    // doc은 유효하므로 true 반환(운영 정책)
                }
                // LittleFS.rename(bak, p_path);
                // CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] restored from bak: %s", v_caller, p_path);
                return true;
            }
        }
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[IO][%s] file not found: %s", v_caller, p_path);
        return false;
    }

    p_doc.clear();
    if (_parseJsonFileToDoc(p_path, p_doc, false, v_caller)) {
        return true;
    }

    if (p_useBackup && LittleFS.exists(bak)) {
        p_doc.clear();
        if (_parseJsonFileToDoc(bak, p_doc, true, v_caller)) {
            if (!LittleFS.remove(p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] main remove failed (continue): %s", v_caller, p_path);
            }
            if (LittleFS.rename(bak, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] recovered from bak: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] recover rename failed: %s -> %s", v_caller, bak, p_path);
                // doc은 유효하므로 true 반환(운영 정책)
            }
            // LittleFS.remove(p_path);
            // LittleFS.rename(bak, p_path);
            //CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] recovered from bak: %s", v_caller, p_path);
            return true;
        }
    }

    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] load failed: %s", v_caller, p_path);
    return false;
}

// Save
inline bool Save_JsonDoc2File_V21(
    const char* p_path,
    const JsonDocument& p_doc,
    bool p_useBackup,
    bool p_pretty = true,
    const char* p_caller = nullptr)
{
    const char* v_caller = _A40__callerOrUnknown(p_caller);

    char bak[A20_Const::LEN_PATH + 8];
    char tmp[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(bak, sizeof(bak), p_path, ".bak", v_caller)) return false;
    if (!_buildPathWithSuffix(tmp, sizeof(tmp), p_path, ".tmp", v_caller)) return false;

    if (LittleFS.exists(tmp)) LittleFS.remove(tmp);

    File f = LittleFS.open(tmp, "w");
    if (!f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] tmp open failed: %s", v_caller, tmp);
        return false;
    }

    size_t bytes = p_pretty ? serializeJsonPretty(p_doc, f) : serializeJson(p_doc, f);
    f.close();

    if (bytes == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] write failed: %s", v_caller, tmp);
        LittleFS.remove(tmp);
        return false;
    }

    if (LittleFS.exists(p_path) && p_useBackup) {
        LittleFS.remove(bak);
        LittleFS.rename(p_path, bak);
    } else if (LittleFS.exists(p_path)) {
        LittleFS.remove(p_path);
    }

    if (!LittleFS.rename(tmp, p_path)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] rename failed: %s", v_caller, p_path);
        if (p_useBackup && LittleFS.exists(bak)) {
            LittleFS.rename(bak, p_path);
        }
        return false;
    }

    return true;
}

} // namespace A40_IO


/*

// 권장 매크로 (caller 주입 강제)
#define A40_MUTEX_GUARD(_name, _mutex, _timeout) \
    CL_A40_MutexGuard_Semaphore _name((_mutex), (_timeout), __func__)
#define A40_MUTEX_GUARD_DEFAULT(_name, _mutex) \
    CL_A40_MutexGuard_Semaphore _name((_mutex), G_A40_MUTEX_TIMEOUT_100, __func__)



// ======================================================
// 권장 호출 매크로 (caller 자동 주입)
// ======================================================
#define A40_COPY_STR(dst, src, n) \
    A40_ComFunc::copyStr2Buffer_safe((dst), (src), (n), __func__)

#define A40_CLONE_STR(src) \
    A40_ComFunc::cloneStr2SharedStr_safe((src), __func__)

#define A40_IO_LOAD(path, doc, useBackup) \
    A40_IO::Load_File2JsonDoc_V21((path), (doc), (useBackup), __func__)

#define A40_IO_SAVE(path, doc, useBackup) \
    A40_IO::Save_JsonDoc2File_V21((path), (doc), (useBackup), true, __func__)

#define A40_IO_SAVE_MIN(path, doc, useBackup) \
    A40_IO::Save_JsonDoc2File_V21((path), (doc), (useBackup), false, __func__)

*/
