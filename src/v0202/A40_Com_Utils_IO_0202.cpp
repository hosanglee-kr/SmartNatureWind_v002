/*
 * ------------------------------------------------------
 * 소스명 : A40_Com_Utils_IO_0202.cpp
 * 모듈 약어 : A40
 * 모듈명 : Smart Nature Wind - Common IO Utilities
 * ------------------------------------------------------
 * 기능 요약:
 *  - LittleFS 기반 JSON 설정 파일의 안전한 입출력 및 파싱 (A40_IO)
 *  - 원자적(Atomic) 파일 저장 및 2중 백업(.bak / .bak.old) 자동 롤백/복구
 *  - 24시간 형식 시간 문자열("HH:MM") 분(minute) 단위 안전 파싱 (A40_parseHHMMtoMin_24h)
 * ------------------------------------------------------
 * [Policy] 주요 운영 정책 요약:
 *  1. 원자적(Atomic) 쓰기:
 *     - 저장 시 임시 파일(.tmp)에 우선 직렬화 완료 후 rename 방식으로 교체하여 쓰기 도중 전원 차단 시 손상 방지.
 *  2. 2중 백업 복구 계층:
 *     - 로드 시 메인 파일이 없거나 JSON 파싱 실패 시, .bak 확인 및 복구 시도, 실패 시 .bak.old까지 순차 복구.
 *     - 백업 복구 성공 시 메인 파일로 자동 복원(rename)하여 영속성 확보.
 *  3. 로깅 태그 일관성:
 *     - 모든 IO 로그는 `[A40][%s]` 태그 형식을 준수하여 호출자(Caller) 추적성 및 모듈 식별성을 보장.
 *  4. 버퍼 및 메모리 안정성:
 *     - 경로 조합 시 A20_Const::LEN_PATH 기반 정적 버퍼 크기 검증 및 snprintf 오버플로우 사전 차단.
 *     - 동적 힙 할당 없이 안전한 스택 메모리 내에서 경로 버퍼 처리.
 *  5. 24시간 형식 파싱 정책:
 *     - "HH:MM" 형태의 문자열에서 선행/후행 공백 트림 처리.
 *     - 00:00 ~ 23:59(0~1439분) 및 24:00(1440분) 경계값 지원, 비정상 포맷 시 0 반환.
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <LittleFS.h>
#include <string.h>
#include <strings.h>
#include <stdlib.h>

#include "A40_Com_Utils_0202.h" // A40_IO namespace, A40_ComFunc 헬퍼 참조
#include "A20_Const_Const_0202.h"
#include "D10_Logger_0202.h"

// ======================================================
// private helper (파일 스코프 static)
// ======================================================
namespace {

const char* _io_callerOrUnknown(const char* p_caller) {
    return (p_caller && p_caller[0]) ? p_caller : "?";
}

bool _buildPathWithSuffix(char* p_dst, size_t p_dstSize, const char* p_path, const char* p_suffix, const char* p_caller) {
    const char* v_caller = _io_callerOrUnknown(p_caller);

    if (!p_dst || p_dstSize == 0 || !p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] invalid path buffer", v_caller);
        return false;
    }

    int v_n = snprintf(p_dst, p_dstSize, "%s%s", p_path, p_suffix ? p_suffix : "");
    if (v_n < 0 || (size_t)v_n >= p_dstSize) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] path overflow: %s", v_caller, p_path);
        return false;
    }
    return true;
}

bool _parseJsonFileToDoc(const char* p_path, JsonDocument& p_doc, bool p_isBackup, const char* p_caller) {
    const char* v_caller = _io_callerOrUnknown(p_caller);
    File        v_file   = LittleFS.open(p_path, "r");
    if (!v_file) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] open failed: %s", v_caller, p_path);
        return false;
    }

    DeserializationError v_err = deserializeJson(p_doc, v_file);
    v_file.close();

    if (v_err) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[A40][%s] %s parse error: %s (%s)",
                           v_caller,
                           p_isBackup ? "bak" : "main",
                           v_err.c_str(),
                           p_path);
        return false;
    }
    return true;
}

} // namespace

// ======================================================
// A40_IO::Load_File2JsonDoc_V21
// ======================================================
namespace A40_IO {

bool Load_File2JsonDoc_V21(const char* p_path, JsonDocument& p_doc, bool p_useBackup, const char* p_caller) {
    const char* v_caller = _io_callerOrUnknown(p_caller);

    if (!p_path || !p_path[0]) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] invalid path", v_caller);
        return false;
    }

    char v_bakPath[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(v_bakPath, sizeof(v_bakPath), p_path, ".bak", v_caller)) return false;

    char       v_bakOldPath[A20_Const::LEN_PATH + 12];
    const bool v_haveBakOld = _buildPathWithSuffix(v_bakOldPath, sizeof(v_bakOldPath), p_path, ".bak.old", v_caller);

    // (1) p_path 미존재 → bak → bak.old
    if (!LittleFS.exists(p_path)) {
        if (p_useBackup && LittleFS.exists(v_bakPath)) {
            p_doc.clear();
            if (_parseJsonFileToDoc(v_bakPath, p_doc, true, v_caller)) {
                if (LittleFS.rename(v_bakPath, p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] restored from bak: %s", v_caller, p_path);
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] restore rename failed: %s -> %s", v_caller, v_bakPath, p_path);
                }
                return true;
            }
        }

        if (p_useBackup && v_haveBakOld && LittleFS.exists(v_bakOldPath)) {
            p_doc.clear();
            if (_parseJsonFileToDoc(v_bakOldPath, p_doc, true, v_caller)) {
                if (LittleFS.rename(v_bakOldPath, p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] restored from bak.old: %s", v_caller, p_path);
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[A40][%s] restore from bak.old failed: %s -> %s",
                                       v_caller,
                                       v_bakOldPath,
                                       p_path);
                }
                return true;
            }
        }

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[A40][%s] file not found: %s", v_caller, p_path);
        return false;
    }

    // (2) 정상 파싱
    p_doc.clear();
    if (_parseJsonFileToDoc(p_path, p_doc, false, v_caller)) return true;

    // (3) 손상 → bak → bak.old
    if (p_useBackup && LittleFS.exists(v_bakPath)) {
        p_doc.clear();
        if (_parseJsonFileToDoc(v_bakPath, p_doc, true, v_caller)) {
            if (!LittleFS.remove(p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] main remove failed (continue): %s", v_caller, p_path);
            }
            if (LittleFS.rename(v_bakPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] recovered from bak: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] recover rename failed: %s -> %s", v_caller, v_bakPath, p_path);
            }
            return true;
        }
    }

    if (p_useBackup && v_haveBakOld && LittleFS.exists(v_bakOldPath)) {
        p_doc.clear();
        if (_parseJsonFileToDoc(v_bakOldPath, p_doc, true, v_caller)) {
            if (!LittleFS.remove(p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] main remove failed (continue): %s", v_caller, p_path);
            }
            if (LittleFS.rename(v_bakOldPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] recovered from bak.old: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[A40][%s] recover rename failed (bak.old): %s -> %s",
                                   v_caller,
                                   v_bakOldPath,
                                   p_path);
            }
            return true;
        }
    }

    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] load failed: %s", v_caller, p_path);
    return false;
}

// ======================================================
// A40_IO::Save_JsonDoc2File_V21 (.tmp atomic + .bak 이중화)
// ======================================================
bool Save_JsonDoc2File_V21(const char* p_path, const JsonDocument& p_doc, bool p_useBackup, bool p_pretty, const char* p_caller) {
    const char* v_caller = _io_callerOrUnknown(p_caller);

    char v_bakPath[A20_Const::LEN_PATH + 8];
    char v_tmpPath[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(v_bakPath, sizeof(v_bakPath), p_path, ".bak", v_caller)) return false;
    if (!_buildPathWithSuffix(v_tmpPath, sizeof(v_tmpPath), p_path, ".tmp", v_caller)) return false;

    if (LittleFS.exists(v_tmpPath)) LittleFS.remove(v_tmpPath);

    File v_file = LittleFS.open(v_tmpPath, "w");
    if (!v_file) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] tmp open failed: %s", v_caller, v_tmpPath);
        return false;
    }

    size_t v_bytes = p_pretty ? serializeJsonPretty(p_doc, v_file) : serializeJson(p_doc, v_file);
    v_file.close();

    if (v_bytes == 0) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] write failed: %s", v_caller, v_tmpPath);
        LittleFS.remove(v_tmpPath);
        return false;
    }

    char v_bakOldPath[A20_Const::LEN_PATH + 12];
    bool v_haveBakOld = _buildPathWithSuffix(v_bakOldPath, sizeof(v_bakOldPath), p_path, ".bak.old", v_caller);

    if (LittleFS.exists(p_path)) {
        if (p_useBackup) {
            // bak → bak.old (이중화)
            if (v_haveBakOld && LittleFS.exists(v_bakPath)) {
                if (LittleFS.exists(v_bakOldPath)) LittleFS.remove(v_bakOldPath);
                if (!LittleFS.rename(v_bakPath, v_bakOldPath)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] bak→bak.old rename failed: %s", v_caller, v_bakPath);
                    v_haveBakOld = false;
                }
            }

            if (!LittleFS.rename(p_path, v_bakPath)) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] rename p_path→bak failed: %s", v_caller, p_path);
                LittleFS.remove(v_tmpPath);
                if (v_haveBakOld && LittleFS.exists(v_bakOldPath)) LittleFS.remove(v_bakOldPath);
                return false;
            }
        } else {
            if (!LittleFS.remove(p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] remove p_path failed: %s (continue)", v_caller, p_path);
            }
        }
    }

    if (!LittleFS.rename(v_tmpPath, p_path)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] rename tmp→p_path failed: %s", v_caller, p_path);

        if (p_useBackup && LittleFS.exists(v_bakPath)) {
            if (LittleFS.rename(v_bakPath, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40][%s] restored from bak: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40][%s] recovery rename failed: %s → %s", v_caller, v_bakPath, p_path);
            }
        }
        LittleFS.remove(v_tmpPath);
        if (v_haveBakOld && LittleFS.exists(v_bakOldPath)) LittleFS.remove(v_bakOldPath);
        return false;
    }

    if (v_haveBakOld && LittleFS.exists(v_bakOldPath)) LittleFS.remove(v_bakOldPath);
    return true;
}

} // namespace A40_IO

// ======================================================
// A40_parseHHMMtoMin_24h (extern 승격: static → global)
// ======================================================
uint16_t A40_parseHHMMtoMin_24h(const char* p_time) {
    if (!p_time || p_time[0] == '\0') return 0;

    while (*p_time == ' ' || *p_time == '\t' || *p_time == '\r' || *p_time == '\n') p_time++;
    if (p_time[0] == '\0') return 0;

    const char* v_colon = strchr(p_time, ':');
    if (!v_colon) return 0;

    char v_hhBuf[4];
    memset(v_hhBuf, 0, sizeof(v_hhBuf));
    size_t v_hhLen = (size_t)(v_colon - p_time);
    if (v_hhLen == 0 || v_hhLen >= sizeof(v_hhBuf)) return 0;
    memcpy(v_hhBuf, p_time, v_hhLen);

    const char* v_mmStr = v_colon + 1;
    if (!v_mmStr || v_mmStr[0] == '\0') return 0;

    char v_mmBuf[4];
    memset(v_mmBuf, 0, sizeof(v_mmBuf));

    size_t v_mmLen = strlen(v_mmStr);
    while (v_mmLen > 0) {
        char v_c = v_mmStr[v_mmLen - 1];
        if (v_c == ' ' || v_c == '\t' || v_c == '\r' || v_c == '\n')
            v_mmLen--;
        else
            break;
    }
    if (v_mmLen == 0 || v_mmLen > 2) return 0;
    memcpy(v_mmBuf, v_mmStr, v_mmLen);

    int v_hh = atoi(v_hhBuf);
    int v_mm = atoi(v_mmBuf);

    if (v_hh < 0) v_hh = 0;
    if (v_mm < 0) v_mm = 0;

    if (v_hh == 24) {
        if (v_mm == 0) return 1440;
        return 0;
    }

    if (v_hh > 23) v_hh = 23;
    if (v_mm > 59) v_mm = 59;

    return (uint16_t)(v_hh * 60 + v_mm);
}
