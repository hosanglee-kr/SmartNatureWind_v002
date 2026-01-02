 // 소스명 : A40_Com_Func2_046.h

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



/**
 * @brief JSON 파일을 읽어 JsonDocument에 담습니다. (백업 복구 지원)
 * @param p_path 파일 경로
 * @param p_doc 담을 JsonDocument 객체
 * @param p_useBackup 백업 파일(.bak) 사용 여부
 * @return 성공 시 true
 */

inline bool A20_Load_File2JsonDoc_V1(const char* p_path, JsonDocument& p_doc, bool p_useBackup = true) {
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
inline bool A20_Save_JsonDoc2File_V1(const char* p_path, const JsonDocument& p_doc, bool p_useBackup = true) {
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



// ------------------------------------------------------
// 내부 유틸(로컬 상수)
// ------------------------------------------------------
#ifndef G_A20_IO_COPY_BUF_BYTES
	#define G_A20_IO_COPY_BUF_BYTES 512u
#endif

#ifndef G_A20_IO_MIN_VALID_JSON_LEN
	#define G_A20_IO_MIN_VALID_JSON_LEN 6u
#endif

// ------------------------------------------------------
// 내부 유틸(로컬 함수)
// ------------------------------------------------------
static inline void A20__buildSuffixPath(char* p_out, size_t p_outSize, const char* p_path, const char* p_suffix) {
	if (!p_out || p_outSize == 0) return;
	memset(p_out, 0, p_outSize);

	if (!p_path) p_path = "";
	if (!p_suffix) p_suffix = "";

	// snprintf는 overflow 시 잘리므로, outSize는 넉넉히 확보 필요
	snprintf(p_out, p_outSize, "%s%s", p_path, p_suffix);
}

static inline bool A20__fileCopy(const char* p_src, const char* p_dst, bool p_overwrite) {
	if (!p_src || !p_src[0] || !p_dst || !p_dst[0]) return false;

	if (!LittleFS.exists(p_src)) return false;
	if (LittleFS.exists(p_dst)) {
		if (!p_overwrite) return false;
		LittleFS.remove(p_dst);
	}

	File v_in = LittleFS.open(p_src, "r");
	if (!v_in) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] copy open src fail: %s", p_src);
		return false;
	}

	File v_out = LittleFS.open(p_dst, "w");
	if (!v_out) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] copy open dst fail: %s", p_dst);
		v_in.close();
		return false;
	}

	uint8_t v_buf[G_A20_IO_COPY_BUF_BYTES];
	size_t v_total = 0;

	while (true) {
		size_t v_n = v_in.read(v_buf, sizeof(v_buf));
		if (v_n == 0) break;

		size_t v_w = v_out.write(v_buf, v_n);
		if (v_w != v_n) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] copy write fail: %s -> %s", p_src, p_dst);
			v_out.close();
			v_in.close();
			LittleFS.remove(p_dst);
			return false;
		}
		v_total += v_w;
	}

	v_out.close();
	v_in.close();

	if (v_total == 0) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] copy fail: zero bytes (%s -> %s)", p_src, p_dst);
		LittleFS.remove(p_dst);
		return false;
	}
	return true;
}

static inline bool A20__writeStringToFile(const char* p_path, const String& p_data) {
	if (!p_path || !p_path[0]) return false;

	File v_f = LittleFS.open(p_path, "w");
	if (!v_f) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] open write fail: %s", p_path);
		return false;
	}
	size_t v_w = v_f.print(p_data);
	v_f.close();

	if (v_w == 0) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] write zero bytes: %s", p_path);
		LittleFS.remove(p_path);
		return false;
	}
	return true;
}

static inline bool A20__readFileToJsonDoc(const char* p_path, JsonDocument& p_doc, bool p_isBackup) {
	if (!p_path || !p_path[0]) return false;

	File v_f = LittleFS.open(p_path, "r");
	if (!v_f) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[A20][IO] %s open read fail: %s", p_isBackup ? "Bak" : "Main", p_path);
		return false;
	}

	p_doc.clear();
	DeserializationError v_err = deserializeJson(p_doc, v_f);
	v_f.close();

	if (v_err != DeserializationError::Ok) {
		CL_D10_Logger::log(
			EN_L10_LOG_ERROR,
			"[A20][IO] %s parse error: %s (%s)",
			p_isBackup ? "Bak" : "Main",
			v_err.c_str(),
			p_path
		);
		p_doc.clear();
		return false;
	}
	return true;
}

static inline bool A20__atomicReplace(const char* p_tmp, const char* p_main, const char* p_old) {
	// tmp -> main 원자 교체(최대한)
	// 1) main 존재 시 main -> old
	// 2) tmp -> main
	// 3) 성공 시 old 삭제
	// 4) 실패 시 old -> main 롤백
	if (!p_tmp || !p_tmp[0] || !p_main || !p_main[0] || !p_old || !p_old[0]) return false;

	const bool v_hasMain = LittleFS.exists(p_main);

	if (v_hasMain) {
		LittleFS.remove(p_old);
		if (!LittleFS.rename(p_main, p_old)) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] atomic: main->old rename fail: %s", p_main);
			return false;
		}
	}

	// tmp -> main
	LittleFS.remove(p_main);
	if (!LittleFS.rename(p_tmp, p_main)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] atomic: tmp->main rename fail: %s", p_main);

		// rollback
		if (v_hasMain && LittleFS.exists(p_old)) {
			LittleFS.remove(p_main);
			if (!LittleFS.rename(p_old, p_main)) {
				CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] atomic: rollback old->main FAIL: %s", p_main);
			} else {
				CL_D10_Logger::log(EN_L10_LOG_WARN, "[A20][IO] atomic: rollback old->main OK: %s", p_main);
			}
		}
		LittleFS.remove(p_tmp);
		return false;
	}

	// success: old 정리
	if (v_hasMain) {
		LittleFS.remove(p_old);
	}
	return true;
}

// ------------------------------------------------------
// 운영급 JSON Load/Save API
// ------------------------------------------------------

/**
 * @brief JSON 파일을 읽어 JsonDocument에 담습니다. (백업 복구 지원, 백업 유지 정책)
 * @param p_path 파일 경로
 * @param p_doc 담을 JsonDocument 객체
 * @param p_useBackup 백업 파일(.bak) 사용 여부
 * @return 성공 시 true
 */
inline bool A20_Load_File2JsonDoc_V2(const char* p_path, JsonDocument& p_doc, bool p_useBackup = true) {
	if (!p_path || !p_path[0]) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] load fail: invalid path");
		return false;
	}

	char v_bakPath[A20_Const::LEN_PATH + 8];
	char v_tmpPath[A20_Const::LEN_PATH + 8];
	char v_oldPath[A20_Const::LEN_PATH + 8];

	A20__buildSuffixPath(v_bakPath, sizeof(v_bakPath), p_path, ".bak");
	A20__buildSuffixPath(v_tmpPath, sizeof(v_tmpPath), p_path, ".tmp");
	A20__buildSuffixPath(v_oldPath, sizeof(v_oldPath), p_path, ".old");

	// 0) main 없으면 bak에서 "복구 생성" (bak 유지: copy 방식)
	if (!LittleFS.exists(p_path) && p_useBackup && LittleFS.exists(v_bakPath)) {
		// tmp에 bak 복사 -> tmp를 main으로 atomic replace (main 없으므로 old는 무시되지만 함수 통일)
		LittleFS.remove(v_tmpPath);
		if (A20__fileCopy(v_bakPath, v_tmpPath, true)) {
			// main이 없을 때 atomicReplace는 old 사용하지 않지만, 동일 경로로 호출
			if (A20__atomicReplace(v_tmpPath, p_path, v_oldPath)) {
				CL_D10_Logger::log(EN_L10_LOG_WARN, "[A20][IO] main missing. restored from .bak (bak kept): %s", p_path);
			} else {
				CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] restore from .bak failed: %s", p_path);
			}
		}
	}

	// 1) main 파싱 우선
	if (LittleFS.exists(p_path)) {
		if (A20__readFileToJsonDoc(p_path, p_doc, false)) {
			return true;
		}
	}

	// 2) main 실패/부재 -> bak 파싱
	if (p_useBackup && LittleFS.exists(v_bakPath)) {
		if (A20__readFileToJsonDoc(v_bakPath, p_doc, true)) {
			// 3) bak 유효하면 main을 안전 복구(옵션): bak -> tmp -> atomic replace (bak 유지)
			LittleFS.remove(v_tmpPath);
			if (A20__fileCopy(v_bakPath, v_tmpPath, true)) {
				if (A20__atomicReplace(v_tmpPath, p_path, v_oldPath)) {
					CL_D10_Logger::log(EN_L10_LOG_WARN, "[A20][IO] recovered from valid .bak (bak kept): %s", p_path);
				} else {
					CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] recover writeback fail (doc ok): %s", p_path);
				}
			}
			return true;
		}
	}

	CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] load critical: all attempts failed: %s", p_path);
	p_doc.clear();
	return false;
}

/**
 * @brief JsonDocument 내용을 파일로 저장합니다. (트랜잭션 + 백업 + 롤백 지원)
 * @param p_path 파일 경로
 * @param p_doc 저장할 JsonDocument 객체
 * @param p_useBackup 백업 파일(.bak) 생성 여부
 * @param p_pretty Pretty 출력 여부(기본 true)
 * @param p_verifyReadback 저장 후 재파싱 검증 여부(기본 false, 운영에서 필요한 경우만)
 * @return 성공 시 true
 */
inline bool A20_Save_JsonDoc2File_V2(const char* p_path,
								 const JsonDocument& p_doc,
								 bool p_useBackup = true,
								 bool p_pretty = true,
								 bool p_verifyReadback = false) {
	if (!p_path || !p_path[0]) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] save fail: invalid path");
		return false;
	}

	char v_bakPath[A20_Const::LEN_PATH + 8];
	char v_tmpPath[A20_Const::LEN_PATH + 8];
	char v_oldPath[A20_Const::LEN_PATH + 8];

	A20__buildSuffixPath(v_bakPath, sizeof(v_bakPath), p_path, ".bak");
	A20__buildSuffixPath(v_tmpPath, sizeof(v_tmpPath), p_path, ".tmp");
	A20__buildSuffixPath(v_oldPath, sizeof(v_oldPath), p_path, ".old");

	// 1) tmp에 먼저 serialize (원자성 핵심)
	LittleFS.remove(v_tmpPath);

	// (출력 방식 선택) - pretty는 디버깅 유리, compact는 플래시/대역폭 유리
	String v_json;
	if (p_pretty) serializeJsonPretty(p_doc, v_json);
	else serializeJson(p_doc, v_json);

	if (v_json.length() < (int)G_A20_IO_MIN_VALID_JSON_LEN) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] save fail: json too small (%d) %s", (int)v_json.length(), p_path);
		return false;
	}

	if (!A20__writeStringToFile(v_tmpPath, v_json)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] save fail: tmp write fail %s", p_path);
		return false;
	}

	// 2) (옵션) readback 검증: tmp 재파싱 확인
	if (p_verifyReadback) {
		JsonDocument v_verify;
		if (!A20__readFileToJsonDoc(v_tmpPath, v_verify, false)) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] save fail: tmp readback parse fail %s", p_path);
			LittleFS.remove(v_tmpPath);
			return false;
		}
	}

	// 3) (옵션) 기존 main -> .bak (정책: 항상 1개 이전본 유지)
	if (p_useBackup && LittleFS.exists(p_path)) {
		LittleFS.remove(v_bakPath);
		// rename이 가장 빠르지만, 실패 시 main 유지가 중요하므로 copy로 안전하게(백업 유지 목적)
		if (!A20__fileCopy(p_path, v_bakPath, true)) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] save fail: cannot create .bak %s", p_path);
			LittleFS.remove(v_tmpPath);
			return false;
		}
	}

	// 4) tmp -> main 원자 교체(rollback 포함)
	if (!A20__atomicReplace(v_tmpPath, p_path, v_oldPath)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A20][IO] save fail: atomic replace fail %s", p_path);
		LittleFS.remove(v_tmpPath);
		return false;
	}

	// 성공: 성공 로그는 과도하면 플래시/시리얼 부하 ↑ (필요시 DEBUG로)
	return true;
}




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







