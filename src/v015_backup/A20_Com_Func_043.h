 // 소스명 : A20_Com_Func_043.h

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


// inline void A20_safe_strlcpy(char* p_dst, const char* p_src, size_t p_n) {
//     if (!p_dst || p_n == 0) return;
//     if (!p_src) {
//         p_dst[0] = '\0';
//         return;
//     }
//     strlcpy(p_dst, p_src, p_n);
// }

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


























// /**
//  * @brief JSON 파일을 읽어 JsonDocument에 담습니다. (백업 복구 지원)
//  * @param p_path 파일 경로
//  * @param p_doc 담을 JsonDocument 객체
//  * @param p_useBackup 백업 파일(.bak) 사용 여부
//  * @return 성공 시 true
//  */
// bool A20_Load_File2JsonDoc(const char* p_path, JsonDocument& p_doc, bool p_useBackup = true) {
//     if (!p_path || !p_path[0]) return false;

//     char v_bakPath[A20_Const::LEN_PATH + 5];
//     if (p_useBackup) snprintf(v_bakPath, sizeof(v_bakPath), "%s.bak", p_path);

//     // 1. 메인 파일이 없고 백업 사용 시 복구 시도
//     if (!LittleFS.exists(p_path) && p_useBackup) {
//         if (LittleFS.exists(v_bakPath)) {
//             if (LittleFS.rename(v_bakPath, p_path)) {
//                 CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO] Restored from .bak: %s", p_path);
//             }
//         }
//     }

//     // 2. 파일 열기 및 파싱 (람다를 사용하여 자원 자동 관리)
//     auto parseFile = [&](const char* path) -> bool {
//         File f = LittleFS.open(path, "r");
//         if (!f) return false;
//         DeserializationError err = deserializeJson(p_doc, f);
//         f.close();
//         return (err == DeserializationError::Ok);
//     };

//     // 메인 파일 시도
//     if (parseFile(p_path)) return true;

//     // 3. 메인 실패 시 백업 파일로 최종 시도
//     if (p_useBackup && LittleFS.exists(v_bakPath)) {
//         p_doc.clear();
//         if (parseFile(v_bakPath)) {
//             // 백업이 유효하면 메인으로 복원
//             LittleFS.remove(p_path);
//             LittleFS.rename(v_bakPath, p_path);
//             CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO] Backup used and restored: %s", p_path);
//             return true;
//         }
//     }

//     CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Load failed: %s", p_path);
//     return false;
// }

// /**
//  * @brief JsonDocument 내용을 파일로 저장합니다. (트랜잭션 백업 지원)
//  * @param p_path 파일 경로
//  * @param p_doc 저장할 JsonDocument 객체
//  * @param p_useBackup 백업 파일(.bak) 생성 여부
//  */
// bool A20_Save_JsonDoc2File(const char* p_path, const JsonDocument& p_doc, bool p_useBackup = true) {
//     if (!p_path || !p_path[0]) return false;

//     char v_bakPath[A20_Const::LEN_PATH + 5];
//     if (p_useBackup) snprintf(v_bakPath, sizeof(v_bakPath), "%s.bak", p_path);

//     bool v_hadMain = LittleFS.exists(p_path);

//     // 1. 기존 파일을 백업으로 전환
//     if (v_hadMain && p_useBackup) {
//         if (LittleFS.exists(v_bakPath)) LittleFS.remove(v_bakPath);
//         if (!LittleFS.rename(p_path, v_bakPath)) {
//             CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO] Backup creation failed");
//             return false;
//         }
//     }

//     // 2. 새 파일 쓰기
//     File f = LittleFS.open(p_path, "w");
//     if (!f) {
//         if (v_hadMain && p_useBackup) LittleFS.rename(v_bakPath, p_path); // 롤백
//         return false;
//     }

//     size_t bytes = serializeJsonPretty(p_doc, f);
//     f.close();

//     // 3. 쓰기 검증
//     if (bytes == 0) {
//         LittleFS.remove(p_path);
//         if (v_hadMain && p_useBackup) LittleFS.rename(v_bakPath, p_path); // 롤백
//         return false;
//     }

//     return true;
// }

