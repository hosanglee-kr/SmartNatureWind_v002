 // 소스명 : A40_Com_Func_046.h

#pragma once

#include <Arduino.h>
#include <string.h>
#include <strings.h>

#include <FS.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include "A20_Const_Const_044.h"
#include "D10_Logger_040.h"

// ======================================================
// 1) 공용 헬퍼
// ======================================================

// 입력된 값이 특정 범위(최솟값과 최댓값)를 벗어나지 않도록 제한
template <typename T>
inline constexpr T A20_clampVal(T p_v, T p_lo, T p_hi) {
    return (p_v < p_lo) ? p_lo : (p_v > p_hi) ? p_hi : p_v;
}


/**
 * @brief 안전한 문자열 복사 함수 (Null 및 Overflow 방지)
 * @return size_t 복사하려 했던 원본 문자열의 길이
 */
inline size_t A20_safe_strlcpy(char* p_dst, const char* p_src, size_t p_n) {
    // 1. 목적지가 유효하지 않으면 0 반환
    if (!p_dst || p_n == 0) return 0;

    // 2. 원본이 유효하지 않으면 목적지를 빈 문자열로 만들고 0 반환
    if (!p_src) {
        p_dst[0] = '\0';
        return 0;
    }

    // 3. 실제 복사 수행 후 원본 길이 반환
    return strlcpy(p_dst, p_src, p_n);
}

inline float A20_getRandom01() {
    return (float)esp_random() / (float)UINT32_MAX;
}

inline float A20_randRange(float p_min, float p_max) {
    return p_min + (A20_getRandom01() * (p_max - p_min));
}


// // ------------------------------------------------------
// // ------------------------------------------------------

/**
 * @brief JSON 파일을 읽어 JsonDocument에 담습니다. (백업 복구 지원)
 * @param p_path 파일 경로
 * @param p_doc 담을 JsonDocument 객체
 * @param p_useBackup 백업 파일(.bak) 사용 여부
 * @return 성공 시 true
 */

inline bool A20_Load_File2JsonDoc(const char* p_path, JsonDocument& p_doc, bool p_useBackup = true) {
    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Load failed: Invalid path");
        return false;
    }

    char v_bakPath[A20_Const::LEN_PATH + 5];
    if (p_useBackup) snprintf(v_bakPath, sizeof(v_bakPath), "%s.bak", p_path);

    // 1. 메인 파일 부재 시 복구 시도
    if (!LittleFS.exists(p_path) && p_useBackup) {
        if (LittleFS.exists(v_bakPath)) {
            if (LittleFS.rename(v_bakPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO] Main missing. Restored from .bak: %s", p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Restore rename failed: %s", p_path);
            }
        } else {
            // 백업도 없는 경우 (최초 실행 시 발생 가능하므로 INFO 또는 DEBUG 권장)
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[IO] No file & No backup: %s", p_path);
        }
    }

    // 2. 파일 파싱 람다
    auto parseFile = [&](const char* path, bool isBackup) -> bool {
        File f = LittleFS.open(path, "r");
        if (!f) return false;

        DeserializationError err = deserializeJson(p_doc, f);
        f.close();

        if (err != DeserializationError::Ok) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] %s Parse error: %s (%s)",
                               isBackup ? "Bak" : "Main", err.c_str(), path);
            return false;
        }
        return true;
    };

    // 메인 파일 파싱 시도
    if (parseFile(p_path, false)) return true;

    // 3. 메인 파싱 실패 시 백업으로 최종 복구 시도
    if (p_useBackup && LittleFS.exists(v_bakPath)) {
        p_doc.clear();
        if (parseFile(v_bakPath, true)) {
            LittleFS.remove(p_path);
            if (LittleFS.rename(v_bakPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO] Recovered from valid backup: %s", p_path);
                return true;
            }
        }
    }

    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Critical: All load attempts failed: %s", p_path);
    return false;
}

/**
 * @brief JsonDocument 내용을 파일로 저장합니다. (트랜잭션 백업 지원)
 * @param p_path 파일 경로
 * @param p_doc 저장할 JsonDocument 객체
 * @param p_useBackup 백업 파일(.bak) 생성 여부
 */
inline bool A20_Save_JsonDoc2File(const char* p_path, const JsonDocument& p_doc, bool p_useBackup = true) {
    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Save failed: Invalid path");
        return false;
    }

    char v_bakPath[A20_Const::LEN_PATH + 5];
    if (p_useBackup) snprintf(v_bakPath, sizeof(v_bakPath), "%s.bak", p_path);

    bool v_hadMain = LittleFS.exists(p_path);

    // 1. 기존 파일을 백업으로 전환
    if (v_hadMain && p_useBackup) {
        if (LittleFS.exists(v_bakPath)) LittleFS.remove(v_bakPath);
        if (!LittleFS.rename(p_path, v_bakPath)) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Save failed: Cannot create .bak for %s", p_path);
            return false;
        }
    }

    // 2. 새 파일 쓰기
    File f = LittleFS.open(p_path, "w");
    if (!f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Save failed: File open error %s", p_path);
        if (v_hadMain && p_useBackup) {
            LittleFS.rename(v_bakPath, p_path); // 원본 롤백
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[IO] Rollback performed for %s", p_path);
        }
        return false;
    }

    size_t bytes = serializeJsonPretty(p_doc, f);
    f.close();

    // 3. 쓰기 결과 검증
    if (bytes == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Save failed: Zero bytes written %s", p_path);
        LittleFS.remove(p_path);
        if (v_hadMain && p_useBackup) {
            LittleFS.rename(v_bakPath, p_path); // 원본 롤백
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[IO] Rollback performed for %s", p_path);
        }
        return false;
    }

    // 성공 시 별도의 로그를 남기지 않거나 DEBUG 레벨 권장 (성공 로그가 너무 많으면 Flash 수명 및 시리얼 부하 증가)
    return true;
}

// // ------------------------------------------------------
// // ------------------------------------------------------


#include <memory>

/**
 * @brief 공유 가능한 안전한 C-String 복사본을 생성합니다. (AsyncWebServer 람다 캡처 전용)
 * * @details
 * 1. 일반적인 `unique_ptr`은 복사가 불가능하여 웹 서버의 람다(Lambda) 캡처 시 소유권 이전 문제(Move)가 발생합니다.
 * 2. 이 함수는 `shared_ptr`을 반환하여, 등록된 웹 라우트 핸들러가 메모리를 안전하게 공유하게 합니다.
 * 3. 참조 카운팅(Reference Counting) 방식을 통해, 해당 문자열을 사용하는 모든 라우트가 파괴될 때 메모리가 자동 해제됩니다.
 * 4. `delete[]`를 수동으로 호출할 필요가 없어 메모리 누수(Memory Leak)를 원천 차단합니다.
 * * @param p_src 복사할 원본 문자열 포인터
 * @return std::shared_ptr<char[]> 관리되는 문자열 (할당 실패 시 nullptr)
 */
inline std::shared_ptr<char[]> A20_makeSharedStr(const char* p_src) {
    // 1. 원본 문자열 유효성 검사
    if (!p_src) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A20] makeSharedStr: Input p_src is null");
        return nullptr;
    }

    // 2. 널 종료 문자(\0)를 포함한 필요한 길이 계산
    size_t v_len = strlen(p_src) + 1;

    // 3. 배열 형태의 shared_ptr 할당 (C++17 표준 지원)
    // std::nothrow를 사용하여 메모리 부족 시 예외 대신 nullptr을 반환하도록 유도
    std::shared_ptr<char[]> v_buf(new (std::nothrow) char[v_len]);

    if (v_buf) {
        // 4. 안전한 문자열 복사 (마지막 바이트 \0 보장)
        strlcpy(v_buf.get(), p_src, v_len);
    } else {
        // 5. 메모리 할당 실패 로깅 (디버깅 시 결정적 단서 제공)
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20] makeSharedStr: Heap allocation failed! (Required: %u bytes)", v_len);
    }

    return v_buf;
}

// // ------------------------------------------------------
// // ------------------------------------------------------


/**
 * @brief FreeRTOS Recursive Mutex 전용 가드 (자동 지연 초기화 포함)
 * @details
 * 1. 생성자에서 뮤텍스가 nullptr인 경우 자동으로 생성합니다.
 * 2. Spinlock을 사용하여 초기화 과정의 Race Condition을 방지합니다.
 * 지연 초기화 및 명시적 acquire/unlock 기능을 제공합니다.
 */

class CL_A40_MutexGuard_Semaphore {
	public:
		/**
		 * @param p_mutex 원본 SemaphoreHandle_t의 참조 (외부 static 변수 등)
		 * @param p_timeout 락 획득 대기 시간
		 */
		CL_A40_MutexGuard_Semaphore(SemaphoreHandle_t& p_mutex, TickType_t p_timeout = pdMS_TO_TICKS(100))
			: _mutexPtr(&p_mutex) {

			// 1. 뮤텍스 지연 초기화 (Race Condition 방지)
			if (*_mutexPtr == nullptr) {
				static portMUX_TYPE v_initMux = portMUX_INITIALIZER_UNLOCKED;
				portENTER_CRITICAL(&v_initMux);
				if (*_mutexPtr == nullptr) {
					*_mutexPtr = xSemaphoreCreateRecursiveMutex();
				}
				portEXIT_CRITICAL(&v_initMux);
			}

			// 2. 초기 Lock 획득 시도
			if (*_mutexPtr != nullptr) {
				_acquired = (xSemaphoreTakeRecursive(*_mutexPtr, p_timeout) == pdTRUE);
			}
		}

		/**
		 * @brief 소멸자: 객체 소멸 시 자동으로 락을 해제합니다.
		 */
		~CL_A40_MutexGuard_Semaphore() {
			unlock();
		}

		/**
		 * @brief 명시적 뮤텍스 획득
		 * @param p_timeoutMs 획득 대기 시간 (ms)
		 * @return true 획득 성공, false 실패
		 */
		bool acquire(uint32_t p_timeoutMs = portMAX_DELAY) {
			if (_acquired) return true; // 이미 획득 상태인 경우

			if (_mutexPtr && *_mutexPtr != nullptr) {
				if (xSemaphoreTakeRecursive(*_mutexPtr, pdMS_TO_TICKS(p_timeoutMs)) == pdTRUE) {
					_acquired = true;
				}
			}
			return _acquired;
		}

		/**
		 * @brief 명시적 뮤텍스 해제
		 */
		void unlock() {
			if (_acquired && _mutexPtr && *_mutexPtr != nullptr) {
				if (xSemaphoreGiveRecursive(*_mutexPtr) == pdTRUE) {
					_acquired = false;
				}
			}
		}

		/**
		 * @brief 현재 락 획득 여부 확인
		 */
		bool isAcquired() const { return _acquired; }

	private:
		// 복사 및 대입 방지
		CL_A40_MutexGuard_Semaphore(const CL_A40_MutexGuard_Semaphore&) = delete;
		CL_A40_MutexGuard_Semaphore& operator=(const CL_A40_MutexGuard_Semaphore&) = delete;

		SemaphoreHandle_t* _mutexPtr; // 원본 핸들의 주소 보관 (Lazy Init 반영용)
		bool _acquired = false;
};



/**
 * @brief ESP32 Critical Section (Spinlock) 가드
 * @details
 * - 인터럽트를 금지하고 공유 자원을 보호합니다.
 * - 복사 생성 및 대입을 금지하여 안정성을 확보했습니다.
 */
class CL_A40_muxGuard_Critical {
	public:
		// 복사 및 대입 금지 (Safety)
		CL_A40_muxGuard_Critical(const CL_A40_muxGuard_Critical&) = delete;
		CL_A40_muxGuard_Critical& operator=(const CL_A40_muxGuard_Critical&) = delete;

		/**
		 * @param p_mux 원본 portMUX_TYPE의 주소
		 */
		CL_A40_muxGuard_Critical(portMUX_TYPE* p_mux) : _mux(p_mux) {
			if (_mux) {
				// portMUX는 구조체이므로 생성 시점에 이미 메모리가 할당되어 있어야 합니다.
				// (만약 동적 할당된 포인터가 nullptr라면 진입하지 않음)
				portENTER_CRITICAL(_mux);
			}
		}

		~CL_A40_muxGuard_Critical() {
			if (_mux) {
				portEXIT_CRITICAL(_mux);
			}
		}

	private:
		portMUX_TYPE* _mux;
};



/*
/// 적용 예시
void CL_C10_ConfigManager::freeLazySection(const char* p_section, ST_A20_ConfigRoot_t& p_root) {
    if (!p_section) return;

    // 가드 선언: 함수 종료 시(어떤 return을 만나든) 자동 해제
    CL_A40_MutexGuard_Semaphore v_guard(s_configMutex, G_C10_MUTEX_TIMEOUT);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] freeLazySection: Mutex timeout");
        return;
    }

    // 이제 자유롭게 return을 사용해도 됩니다.
    if (strcmp(p_section, "wifi") == 0) {
        if (p_root.wifi) { delete p_root.wifi; p_root.wifi = nullptr; }
        return;
    }
    if (strcmp(p_section, "motion") == 0) {
        if (p_root.motion) { delete p_root.motion; p_root.motion = nullptr; }
        return;
    }
    // ... 나머지 섹션 생략 ...
}

void CL_S10_Simulation::toChartJson(JsonDocument& p_doc, bool p_diffOnly) {
    // ... (전처리 생략) ...

    std::vector<ST_ChartEntry> v_entries;

    // (A) 스냅샷 구간만 스코프로 묶음
    {
        CL_A40_muxGuard_Critical v_lock(&_simMutex);

        v_phase = phase;
        v_avg   = _getAvgWindFast();
        // ... 값 복사 로직 ...

        if (p_diffOnly) {
            v_entries.push_back(s_chartBuffer.back());
        } else {
            v_entries = s_chartBuffer; // 벡터 복사
        }
    } // 여기서 portEXIT_CRITICAL 자동 호출

    // (B) 락 없이 안전하게 JSON 생성
    // ... 나머지 JSON 생성 로직 ...
}


*/

// // ------------------------------------------------------
// // ------------------------------------------------------


///// 소스명 : C10_Config_System_045.cpp


// // =====================================================
// // 내부 Helper: 단일 key 전용 (fallback 금지)
// //  - containsKey 사용 금지 -> JsonVariantConst null 체크 기반
// // =====================================================
// static const char* C10_getStr1(JsonObjectConst p_obj, const char* p_k1, const char* p_def) {
//     if (p_obj.isNull()) return p_def;

//     JsonVariantConst v1 = p_obj[p_k1];
//     if (v1.isNull()) return p_def;

//     const char* s = v1.as<const char*>();
//     return (s && s[0]) ? s : p_def;
// }

// template <typename T>
// static T C10_getNum1(JsonObjectConst p_obj, const char* p_k1, T p_def) {
//     if (p_obj.isNull()) return p_def;

//     JsonVariantConst v1 = p_obj[p_k1];
//     if (v1.isNull()) return p_def;

//     return (T)(v1.as<T>());
// }

// static bool C10_getBool1(JsonObjectConst p_obj, const char* p_k1, bool p_def) {
//     if (p_obj.isNull()) return p_def;

//     JsonVariantConst v1 = p_obj[p_k1];
//     if (v1.isNull()) return p_def;

//     return v1.as<bool>();
// }







/////////////// 소스명 : C10_Config_Extras_042.cpp
namespace A40 {

    class CL_A40_JsonUtil {
    public:
        /**
         * @brief 안전하게 문자열을 추출하여 버퍼에 복사합니다.
         */
        static void getString(JsonObjectConst p_obj, const char* p_key, char* p_dest, size_t p_destSize, const char* p_def = "") {
            if (p_obj.isNull() || !p_dest) return;

            const char* v_val = p_def;
            if (p_obj[p_key].is<const char*>()) {
                v_val = p_obj[p_key].as<const char*>();
            }

            if (v_val) {
                strlcpy(p_dest, v_val, p_destSize);
            } else {
                strlcpy(p_dest, p_def, p_destSize);
            }
        }

        /**
         * @brief 숫자형 데이터를 안전하게 가져옵니다.
         */
        template <typename T>
        static T getNumber(JsonObjectConst p_obj, const char* p_key, T p_def) {
            if (p_obj.isNull() || !p_obj[p_key].is<T>()) return p_def;
            return p_obj[p_key].as<T>();
        }

        /**
         * @brief 불리언 데이터를 안전하게 가져옵니다.
         */
        static bool getBool(JsonObjectConst p_obj, const char* p_key, bool p_def) {
            if (p_obj.isNull() || !p_obj[p_key].is<bool>()) return p_def;
            return p_obj[p_key].as<bool>();
        }

        /**
         * @brief 특정 키의 객체를 찾거나, 없으면 루트를 반환합니다 (C10_pickRootObject 로직 공통화).
         */
        static JsonObjectConst getWrappedOrRoot(const JsonDocument& p_doc, const char* p_wrapKey) {
            if (p_doc[p_wrapKey].is<JsonObjectConst>()) {
                return p_doc[p_wrapKey].as<JsonObjectConst>();
            }
            return p_doc.as<JsonObjectConst>();
        }

        /**
         * @brief JSON Array 안전 획득
         */
        static JsonArrayConst getArray(JsonObjectConst p_obj, const char* p_key) {
            if (p_obj.isNull()) return JsonArrayConst();
            return p_obj[p_key].as<JsonArrayConst>();
        }
    };

}

////////////////////////////////////////////////


/**
 * @brief JSON 문자열 추출 (V7 스타일: containsKey 없이 Variant 유효성으로 체크)
 */
static const char* A40_jsonObj_getStr2(JsonObjectConst p_obj, const char* p_key, const char* p_def) {
    // 1. 키(key) 존재 여부 및 데이터 추출 시도
    JsonVariantConst v = p_obj[p_key];

    // 2. 타입 검사 (JSON에 해당 키가 있고, 그 값이 문자열 타입인가?)
    if (v.is<const char*>()) {
        const char* s = v.as<const char*>();

        // 3. 실질적 데이터 검증 (핵심 로직)
        // (s && s[0] != '\0') : 포인터가 NULL이 아니고, 첫 번째 문자가 NULL 종료 문자(\0)가 아님
        return (s && s[0] != '\0') ? s : p_def;
    }

    // 4. 타입이 다르거나 키가 없는 경우 미리 정의된 '기본값' 반환
    return p_def;
}


static const char* A40_jsonObj_getStr(JsonObjectConst p_obj, const char* p_key, const char* p_def) {
    JsonVariantConst v = p_obj[p_key]; // 키가 없으면 유효하지 않은 Variant 반환
    if (v.is<const char*>()) {
        const char* s = v.as<const char*>();
        return (s != nullptr) ? s : p_def;
    }
    return p_def;
}

/**
 * @brief JSON 숫자 추출 (템플릿 활용)
 */
template <typename T>
static T A40_jsonObj_getNum(JsonObjectConst p_obj, const char* p_key, T p_def) {
    JsonVariantConst v = p_obj[p_key];
    return v.is<T>() ? v.as<T>() : p_def;
}

/**
 * @brief JSON 불리언 추출 (문자열 "true"/"false" 호환성 유지)
 */
static bool A40_jsonObj_getBool(JsonObjectConst p_obj, const char* p_key, bool p_def) {
    JsonVariantConst v = p_obj[p_key];
    if (v.is<bool>()) return v.as<bool>();
    if (v.is<int>())  return v.as<int>() != 0;

    if (v.is<const char*>()) {
        const char* s = v.as<const char*>();
        if (s) {
            if (strcasecmp(s, "true") == 0) return true;
            if (strcasecmp(s, "false") == 0) return false;
        }
    }
    return p_def;
}


/**
 * @brief JSON 배열 추출 (Safe Iterator 보장)
 */
static JsonArrayConst A40_jsonObj_getArray(JsonObjectConst p_obj, const char* p_key) {
    JsonVariantConst v = p_obj[p_key];
    return v.is<JsonArrayConst>() ? v.as<JsonArrayConst>() : JsonArrayConst();
}

/**
 * @brief 문자열 복사 유틸리티 (규칙 준수: memset + strlcpy 기반 안전 초기화)
 */

static void A40_jsonObj_copyStr(JsonObjectConst p_obj, const char* p_key, char* p_dst, size_t p_size, const char* p_def = "") {
    if (!p_dst || p_size == 0) return;
    const char* v_val = A40_jsonObj_getStr(p_obj, p_key, p_def);

    memset(p_dst, 0, p_size);
    strlcpy(p_dst, v_val, p_size);
}

/**
 * [A40] JSON 객체 내 특정 섹션(Key)을 독립된 JsonDocument로 추출/복사
 * @param p_src   [in]  원본 소스 JSON 객체 (Read-only)
 * @param p_key   [in]  추출하고자 하는 대상 키 (예: "wifi", "system")
 * @param p_dest  [out] 추출된 데이터를 담을 목적지 JsonDocument (Deep Copy 수행)
 * @return bool         추출 성공 여부 (키가 없거나 데이터가 null이면 false)
 * * @note ArduinoJson V7의 할당 방식을 활용하여 원본 문서의 수명과 상관없이 독립적인 메모리 공간을 가진 문서를 생성
 */
static bool A40_jsonObj_exportSection(JsonObjectConst p_src, const char* p_key, JsonDocument& p_dest) {
    // 1. 원본 객체에서 해당 키에 해당하는 Variant 추출 (V7: 키가 없으면 isNull 반환)
    JsonVariantConst v = p_src[p_key];

    // 2. 유효성 검사: 대상 데이터가 존재하지 않거나 null이면 즉시 중단
    if (v.isNull()) return false;

    // 3. 목적지 문서 초기화 (이전 잔여 데이터 제거)
    p_dest.clear();

    // 4. 데이터 복제 (Deep Copy)
    // V7의 대입 연산자는 원본 Variant의 전체 구조를 p_dest 내부로 깊은 복사합니다.
    p_dest[p_key] = v;

    // 5. 결과 검증: 최종적으로 생성된 문서가 유효한지 확인 후 반환
    return !p_dest.isNull();
}


// // =====================================================
// // 내부 Helper: camelCase only
// //  - WebPage: 루트형 확정 -> pages/reDirect/assets는 문서 루트에서 직접 사용
// //  - NvsSpec: {"nvsSpec":{...}} 또는 루트형 {...} 둘 다 허용(로드/패치)
// // =====================================================
// static const char* C10_getStr(JsonObjectConst p_obj, const char* p_key, const char* p_def) {
//     if (p_obj.isNull()) return p_def;
//     if (p_obj[p_key].is<const char*>()) {
//         const char* v = p_obj[p_key].as<const char*>();
//         return v ? v : p_def;
//     }
//     return p_def;
// }

// template <typename T>
// static T C10_getNum(JsonObjectConst p_obj, const char* p_key, T p_def) {
//     if (p_obj.isNull()) return p_def;
//     if (p_obj[p_key].is<T>()) return p_obj[p_key].as<T>();
//     return p_def;
// }

// static bool C10_getBool(JsonObjectConst p_obj, const char* p_key, bool p_def) {
//     if (p_obj.isNull()) return p_def;
//     if (p_obj[p_key].is<bool>()) return p_obj[p_key].as<bool>();
//     return p_def;
// }

// static JsonArrayConst C10_getArr(JsonObjectConst p_obj, const char* p_key) {
//     if (p_obj.isNull()) return JsonArrayConst();
//     return p_obj[p_key].as<JsonArrayConst>();
// }

// // 랩핑 키가 있으면 우선 사용, 없으면 루트 자체를 사용
// static JsonObjectConst C10_pickRootObject(JsonDocument& p_doc, const char* p_wrapKey) {
//     JsonObjectConst v_wrapped = p_doc[p_wrapKey].as<JsonObjectConst>();
//     if (!v_wrapped.isNull()) return v_wrapped;
//     return p_doc.as<JsonObjectConst>();
// }





/////////////// * 소스명 : C10_Config_Core_042.cpp

// // 내부: 섹션 new 할당 헬퍼(메모리 부족 방어)
// template <typename T>
// static bool C10_allocSection(T*& p_ptr, const char* p_name) {
//     if (p_ptr) return true;
//     T* v_new = new (std::nothrow) T();
//     if (!v_new) {
//         CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadAll: new failed (%s) - out of memory", p_name);
//         return false;
//     }
//     p_ptr = v_new;
//     return true;
// }
