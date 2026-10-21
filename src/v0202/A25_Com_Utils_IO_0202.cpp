/*
 * ------------------------------------------------------
 * 소스명 : A25_Com_Utils_IO_0202.cpp
 * 모듈명 : Smart Nature Wind - Common IO Utilities
 * ------------------------------------------------------
 * [E-2.5] A25_Com_Utils_0202.h에서 이관
 *  - A40_IO::Load_File2JsonDoc_V21 (JSON 파일 로드 + .bak 복구)
 *  - A40_IO::Save_JsonDoc2File_V21 (원자적 .tmp + .bak 저장)
 *  - _buildPathWithSuffix, _parseJsonFileToDoc (private helper → static)
 *  - A40_parseHHMMtoMin_24h ("HH:MM" → 분 변환, static → extern)
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <LittleFS.h>
#include <string.h>
#include <strings.h>
#include <stdlib.h>

#include "A25_Com_Utils_0202.h"    // A40_IO namespace, A40_ComFunc 헬퍼 참조
#include "A20_Const_Const_0202.h"
#include "D10_Logger_0202.h"

// ======================================================
// private helper (파일 스코프 static)
// ======================================================
namespace {

const char* _io_callerOrUnknown(const char* p_caller) {
    return (p_caller && p_caller[0]) ? p_caller : "?";
}

bool _buildPathWithSuffix(char* p_dst, size_t p_dstSize, const char* p_path,
                          const char* p_suffix, const char* p_caller) {
    const char* v = _io_callerOrUnknown(p_caller);

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

bool _parseJsonFileToDoc(const char* p_path, JsonDocument& p_doc,
                         bool p_isBackup, const char* p_caller) {
    const char* v = _io_callerOrUnknown(p_caller);
    File        f = LittleFS.open(p_path, "r");
    if (!f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] open failed: %s", v, p_path);
        return false;
    }

    DeserializationError err = deserializeJson(p_doc, f);
    f.close();

    if (err) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] %s parse error: %s (%s)",
                           v, p_isBackup ? "bak" : "main", err.c_str(), p_path);
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
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] invalid path", v_caller);
        return false;
    }

    char bak[A20_Const::LEN_PATH + 8];
    if (!_buildPathWithSuffix(bak, sizeof(bak), p_path, ".bak", v_caller)) return false;

    char bakOld[A20_Const::LEN_PATH + 12];
    const bool v_haveBakOld = _buildPathWithSuffix(bakOld, sizeof(bakOld), p_path, ".bak.old", v_caller);

    // (1) p_path 미존재 → bak → bak.old
    if (!LittleFS.exists(p_path)) {
        if (p_useBackup && LittleFS.exists(bak)) {
            p_doc.clear();
            if (_parseJsonFileToDoc(bak, p_doc, true, v_caller)) {
                if (LittleFS.rename(bak, p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] restored from bak: %s", v_caller, p_path);
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] restore rename failed: %s -> %s", v_caller, bak, p_path);
                }
                return true;
            }
        }

        if (p_useBackup && v_haveBakOld && LittleFS.exists(bakOld)) {
            p_doc.clear();
            if (_parseJsonFileToDoc(bakOld, p_doc, true, v_caller)) {
                if (LittleFS.rename(bakOld, p_path)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] restored from bak.old: %s", v_caller, p_path);
                } else {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                       "[IO][%s] restore from bak.old failed: %s -> %s",
                                       v_caller, bakOld, p_path);
                }
                return true;
            }
        }

        CL_D10_Logger::log(EN_L10_LOG_INFO, "[IO][%s] file not found: %s", v_caller, p_path);
        return false;
    }

    // (2) 정상 파싱
    p_doc.clear();
    if (_parseJsonFileToDoc(p_path, p_doc, false, v_caller)) return true;

    // (3) 손상 → bak → bak.old
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
            }
            return true;
        }
    }

    if (p_useBackup && v_haveBakOld && LittleFS.exists(bakOld)) {
        p_doc.clear();
        if (_parseJsonFileToDoc(bakOld, p_doc, true, v_caller)) {
            if (!LittleFS.remove(p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] main remove failed (continue): %s", v_caller, p_path);
            }
            if (LittleFS.rename(bakOld, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] recovered from bak.old: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR,
                                   "[IO][%s] recover rename failed (bak.old): %s -> %s",
                                   v_caller, bakOld, p_path);
            }
            return true;
        }
    }

    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] load failed: %s", v_caller, p_path);
    return false;
}

// ======================================================
// A40_IO::Save_JsonDoc2File_V21 (.tmp atomic + .bak 이중화)
// ======================================================
bool Save_JsonDoc2File_V21(const char* p_path, const JsonDocument& p_doc, bool p_useBackup,
                           bool p_pretty, const char* p_caller) {
    const char* v_caller = _io_callerOrUnknown(p_caller);

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

    char bakOld[A20_Const::LEN_PATH + 12];
    bool v_haveBakOld = _buildPathWithSuffix(bakOld, sizeof(bakOld), p_path, ".bak.old", v_caller);

    if (LittleFS.exists(p_path)) {
        if (p_useBackup) {
            // bak → bak.old (이중화)
            if (v_haveBakOld && LittleFS.exists(bak)) {
                if (LittleFS.exists(bakOld)) LittleFS.remove(bakOld);
                if (!LittleFS.rename(bak, bakOld)) {
                    CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] bak→bak.old rename failed: %s", v_caller, bak);
                    v_haveBakOld = false;
                }
            }

            if (!LittleFS.rename(p_path, bak)) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] rename p_path→bak failed: %s", v_caller, p_path);
                LittleFS.remove(tmp);
                if (v_haveBakOld && LittleFS.exists(bakOld)) LittleFS.remove(bakOld);
                return false;
            }
        } else {
            if (!LittleFS.remove(p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] remove p_path failed: %s (continue)", v_caller, p_path);
            }
        }
    }

    if (!LittleFS.rename(tmp, p_path)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] rename tmp→p_path failed: %s", v_caller, p_path);

        if (p_useBackup && LittleFS.exists(bak)) {
            if (LittleFS.rename(bak, p_path)) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[IO][%s] restored from bak: %s", v_caller, p_path);
            } else {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[IO][%s] recovery rename failed: %s → %s", v_caller, bak, p_path);
            }
        }
        LittleFS.remove(tmp);
        if (v_haveBakOld && LittleFS.exists(bakOld)) LittleFS.remove(bakOld);
        return false;
    }

    if (v_haveBakOld && LittleFS.exists(bakOld)) LittleFS.remove(bakOld);
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
        char c = v_mmStr[v_mmLen - 1];
        if (c == ' ' || c == '\t' || c == '\r' || c == '\n') v_mmLen--;
        else break;
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
