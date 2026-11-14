 // 소스명 : A20_Com_Func_044.h

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
 * @brief FreeRTOS Recursive Mutex 전용 가드
 * @details 스코프를 벗어나면 자동으로 Mutex를 반환합니다.
 */

class A20_MutexGuard {
	public:
		A20_MutexGuard(SemaphoreHandle_t p_mutex, TickType_t p_timeout = pdMS_TO_TICKS(100))
			: _mutex(p_mutex) {
			if (_mutex) {
				_acquired = (xSemaphoreTakeRecursive(_mutex, p_timeout) == pdTRUE);
			}
		}
		~A20_MutexGuard() {
			if (_mutex && _acquired) {
				xSemaphoreGiveRecursive(_mutex);
			}
		}
		bool isAcquired() const { return _acquired; }

	private:
		SemaphoreHandle_t _mutex;
		bool _acquired = false;
};

/**
 * @brief ESP32 Critical Section (Spinlock) 가드
 * @details 인터럽트를 일시 중지하고 짧은 데이터 접근을 보호합니다.
 */
class A20_CriticalGuard {
	public:
		A20_CriticalGuard(portMUX_TYPE* p_mux) : _mux(p_mux) {
			if (_mux) portENTER_CRITICAL(_mux);
		}

		~A20_CriticalGuard() {
			if (_mux) portEXIT_CRITICAL(_mux);
		}

	private:
		portMUX_TYPE* _mux;
};

/*
/// 적용 예시
void CL_C10_ConfigManager::freeLazySection(const char* p_section, ST_A20_ConfigRoot_t& p_root) {
    if (!p_section) return;

    // 가드 선언: 함수 종료 시(어떤 return을 만나든) 자동 해제
    A20_MutexGuard v_guard(s_configMutex, G_C10_MUTEX_TIMEOUT);
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
        A20_CriticalGuard v_lock(&_simMutex);

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
