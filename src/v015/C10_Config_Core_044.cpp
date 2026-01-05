/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Core_044.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - Core
 * ------------------------------------------------------
 * 기능 요약:
 *  - 전체 Config Root 로드/해제/저장 관리
 *  - LittleFS 기반 JSON I/O (A40_IO::Load/Save) + .bak 자동 복구
 *  - Dirty Flag 기반 saveDirtyConfigs / saveAll
 *  - 전체 JSON Export(toJson_All)
 *  - 공장 초기화(factoryResetFromDefault)
 *  - cfg_jsonFile.json(=10_cfg_jsonFile.json) 기반 섹션 파일 경로 매핑 로드
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 체계 유지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 모듈별 헤더(h) + 목적물별 cpp 분리 구성 (Core/System/Schedule)
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <FS.h>
#include <LittleFS.h>

#include "C10_Config_042.h"
// #include "A40_Com_Func_047.h"   // A40_IO, CL_A40_MutexGuard_Semaphore

// ------------------------------------------------------
// 전역 Config Root 정의
// ------------------------------------------------------
ST_A20_ConfigRoot_t g_A20_config_root = {};

// ------------------------------------------------------
// 정적 멤버 정의
// ------------------------------------------------------
bool CL_C10_ConfigManager::_dirty_system       = false;
bool CL_C10_ConfigManager::_dirty_wifi         = false;
bool CL_C10_ConfigManager::_dirty_motion       = false;
bool CL_C10_ConfigManager::_dirty_schedules    = false;
bool CL_C10_ConfigManager::_dirty_userProfiles = false;
bool CL_C10_ConfigManager::_dirty_windDict     = false;
bool CL_C10_ConfigManager::_dirty_nvsSpec      = false;
bool CL_C10_ConfigManager::_dirty_webPage      = false;

// cfg_jsonFile.json 매핑 초기값 (비어있는 상태)
ST_A20_cfg_jsonFile_t CL_C10_ConfigManager::s_cfgJsonFileMap{};

// Mutex
SemaphoreHandle_t CL_C10_ConfigManager::s_configMutex_v2 = nullptr;

// =====================================================
// 내부 유틸: 섹션 new 할당 헬퍼(메모리 부족 방어)
// =====================================================
template <typename T>
static bool C10_allocSection(T*& p_ptr, const char* p_name) {
    if (p_ptr) return true;
    T* v_new = new (std::nothrow) T();
    if (!v_new) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadAll: new failed (%s) - out of memory", p_name);
        return false;
    }
    p_ptr = v_new;
    return true;
}

// =====================================================
// cfg_jsonFile.json 로드
//  - 파일명: A20_Const::CFG_JSON_FILE (10_cfg_jsonFile.json)
//  - JSON 구조(최신): { "configJsonFile": { system,wifi,motion,nvsSpec,schedules,userProfiles,windDict,webPage } }
// =====================================================
bool CL_C10_ConfigManager::_loadCfgJsonFile() {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument v_doc;

    // 공통함수 직접 호출 (thin wrapper 사용 금지)
    if (!A40_IO::Load_File2JsonDoc_V21(A20_Const::CFG_JSON_FILE, v_doc, true)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] Failed to load cfg json map: %s", A20_Const::CFG_JSON_FILE);
        return false; // 옵션 A: 로드 실패시 에러로 종료
    }

    JsonObjectConst v_root = v_doc["configJsonFile"].as<JsonObjectConst>();
    if (v_root.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] Invalid cfg json map: missing 'configJsonFile'");
        return false;
    }

    auto loadStr = [&](char* p_dst, const char* p_key, size_t p_size) {
        if (!p_dst || p_size == 0) return;
        if (v_root[p_key].is<const char*>()) {
            const char* v_val = v_root[p_key].as<const char*>();
            memset(p_dst, 0, p_size);
            strlcpy(p_dst, (v_val ? v_val : ""), p_size);
        } else {
            p_dst[0] = '\0';
        }
    };

    loadStr(s_cfgJsonFileMap.system, "system", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.wifi, "wifi", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.motion, "motion", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.nvsSpec, "nvsSpec", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.schedules, "schedules", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.userProfiles, "userProfiles", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.windDict, "windDict", A20_Const::LEN_PATH);
    loadStr(s_cfgJsonFileMap.webPage, "webPage", A20_Const::LEN_PATH);

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[C10] cfg_jsonFile loaded: system=%s wifi=%s motion=%s nvsSpec=%s schedules=%s userProfiles=%s windDict=%s webPage=%s",
                       s_cfgJsonFileMap.system,
                       s_cfgJsonFileMap.wifi,
                       s_cfgJsonFileMap.motion,
                       s_cfgJsonFileMap.nvsSpec,
                       s_cfgJsonFileMap.schedules,
                       s_cfgJsonFileMap.userProfiles,
                       s_cfgJsonFileMap.windDict,
                       s_cfgJsonFileMap.webPage);

    // 최소 경로 검증(옵션 A): 필수 섹션 파일 경로가 비어있으면 실패 처리
    if (s_cfgJsonFileMap.system[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: system path");
        return false;
    }
    if (s_cfgJsonFileMap.wifi[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: wifi path");
        return false;
    }
    if (s_cfgJsonFileMap.motion[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: motion path");
        return false;
    }
    if (s_cfgJsonFileMap.schedules[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: schedules path");
        return false;
    }
    if (s_cfgJsonFileMap.userProfiles[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: userProfiles path");
        return false;
    }
    if (s_cfgJsonFileMap.windDict[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: windDict path");
        return false;
    }
    if (s_cfgJsonFileMap.nvsSpec[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: nvsSpec path");
        return false;
    }
    if (s_cfgJsonFileMap.webPage[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] cfg_jsonFile missing: webPage path");
        return false;
    }

    return true;
}

// =====================================================
// 1. 전체 관리 (Load/Free/Save)
// =====================================================
//
// 핵심수정 포인트 반영:
// (2) loadAll()에서 new 실패(메모리 부족) 방어
// (4) toJson_All()는 mutex 없이 읽는데, 경쟁 조건 가능 -> (Core에서) read시 mutex 보호 옵션 제공
// (3) saveDirtyConfigs() 로그가 “항상 All saved”로 찍힘 -> 실제 저장 결과 기반 로그 개선
// =====================================================
bool CL_C10_ConfigManager::loadAll(ST_A20_ConfigRoot_t& p_root) {
    bool v_ok = true;

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    // 0) cfg_jsonFile.json 먼저 로드 (옵션 A)
    if (!_loadCfgJsonFile()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: cfg_jsonFile load failed.", __func__);
        return false;
    }

    // 1) 섹션 객체 확보 (없으면 생성) - ✅ new 실패 방어
    if (!C10_allocSection(p_root.system, "system")) v_ok = false;
    if (!C10_allocSection(p_root.wifi, "wifi")) v_ok = false;
    if (!C10_allocSection(p_root.motion, "motion")) v_ok = false;
    if (!C10_allocSection(p_root.nvsSpec, "nvsSpec")) v_ok = false;
    if (!C10_allocSection(p_root.windDict, "windDict")) v_ok = false;
    if (!C10_allocSection(p_root.schedules, "schedules")) v_ok = false;
    if (!C10_allocSection(p_root.userProfiles, "userProfiles")) v_ok = false;
    if (!C10_allocSection(p_root.webPage, "webPage")) v_ok = false;

    // 메모리 부족이면 확보된 것만 정리 후 종료(누수 방지)
    if (!v_ok) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadAll: section allocation failed. Free allocated sections.");
        freeAll(p_root);
        return false;
    }

    // 2) 기본값 초기화
    //    - load 단계에서 "memset" 대신 A20_resetXxxDefault로 기본 안전값을 먼저 채움
    //    - 파일 로드 실패/부분 누락에도 시스템이 최소 동작 가능한 기본값 유지
    A20_resetSystemDefault(*p_root.system);
    A20_resetWifiDefault(*p_root.wifi);
    A20_resetMotionDefault(*p_root.motion);
    A20_resetNvsSpecDefault(*p_root.nvsSpec);
    A20_resetWindDictDefault(*p_root.windDict);
    A20_resetSchedulesDefault(*p_root.schedules);
    A20_resetUserProfilesDefault(*p_root.userProfiles);
    A20_resetWebPageDefault(*p_root.webPage);

    // 3) 실제 파일 로드 (섹션별 loadXxx 안에서 s_cfgJsonFileMap 사용)
    //    - loadXxx는 "기본값 -> 파일 오버레이" 구조가 바람직
    if (!loadSystemConfig(*p_root.system)) v_ok = false;
    if (!loadWifiConfig(*p_root.wifi)) v_ok = false;
    if (!loadMotionConfig(*p_root.motion)) v_ok = false;
    if (!loadNvsSpecConfig(*p_root.nvsSpec)) v_ok = false;
    if (!loadWindDict(*p_root.windDict)) v_ok = false;
    if (!loadSchedules(*p_root.schedules)) v_ok = false;
    if (!loadUserProfiles(*p_root.userProfiles)) v_ok = false;
    if (!loadWebPageConfig(*p_root.webPage)) v_ok = false;

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Config loaded (all sections, result=%d)", v_ok ? 1 : 0);
    return v_ok;
}

bool CL_C10_ConfigManager::freeLazySection(const char* p_section, ST_A20_ConfigRoot_t& p_root) {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__ );
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (!p_section) return false;

    if (strcmp(p_section, "wifi") == 0) {
        if (p_root.wifi) { delete p_root.wifi; p_root.wifi = nullptr; }
        return true;
    }
    if (strcmp(p_section, "motion") == 0) {
        if (p_root.motion) { delete p_root.motion; p_root.motion = nullptr; }
        return true;
    }
    if (strcmp(p_section, "nvsSpec") == 0) {
        if (p_root.nvsSpec) { delete p_root.nvsSpec; p_root.nvsSpec = nullptr; }
        return true;
    }
    if (strcmp(p_section, "schedules") == 0) {
        if (p_root.schedules) { delete p_root.schedules; p_root.schedules = nullptr; }
        return true;
    }
    if (strcmp(p_section, "userProfiles") == 0) {
        if (p_root.userProfiles) { delete p_root.userProfiles; p_root.userProfiles = nullptr; }
        return true;
    }
    if (strcmp(p_section, "windDict") == 0) {
        if (p_root.windDict) { delete p_root.windDict; p_root.windDict = nullptr; }
        return true;
    }
    if (strcmp(p_section, "webPage") == 0) {
        if (p_root.webPage) { delete p_root.webPage; p_root.webPage = nullptr; }
        return true;
    }

    return false;
}

void CL_C10_ConfigManager::freeAll(ST_A20_ConfigRoot_t& p_root) {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    if (p_root.system) { delete p_root.system; p_root.system = nullptr; }
    if (p_root.wifi) { delete p_root.wifi; p_root.wifi = nullptr; }
    if (p_root.motion) { delete p_root.motion; p_root.motion = nullptr; }
    if (p_root.nvsSpec) { delete p_root.nvsSpec; p_root.nvsSpec = nullptr; }
    if (p_root.windDict) { delete p_root.windDict; p_root.windDict = nullptr; }
    if (p_root.schedules) { delete p_root.schedules; p_root.schedules = nullptr; }
    if (p_root.userProfiles) { delete p_root.userProfiles; p_root.userProfiles = nullptr; }
    if (p_root.webPage) { delete p_root.webPage; p_root.webPage = nullptr; }

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] All config objects freed");
}

// -----------------------------------------------------
// Dirty Config 저장
//  - 실제로 저장된 섹션 수/실패 수 기반으로 로그 출력
// -----------------------------------------------------
void CL_C10_ConfigManager::saveDirtyConfigs() {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    uint8_t v_attempt = 0;
    uint8_t v_saved   = 0;
    uint8_t v_failed  = 0;

    // ✅ thin wrapper(전역 함수) 금지 조건이 있으므로:
    //    - 여기서 말하는 "thin wrapper"는 IO 래퍼 금지로 이해했고,
    //      save 함수 포인터용 람다는 기존 기능 유지 위해 그대로 둡니다(기능 축소 방지).
    auto trySave = [&](bool& p_dirty, const char* p_name, bool (*p_saveFn)(const void*), const void* p_obj) {
        if (!p_dirty || !p_obj) return;
        v_attempt++;

        bool v_ok = p_saveFn(p_obj);
        if (v_ok) {
            p_dirty = false;
            v_saved++;
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] dirty-save ok: %s", p_name);
        } else {
            v_failed++;
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] dirty-save failed: %s", p_name);
        }
    };

    static auto saveSystem_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveSystemConfig(*reinterpret_cast<const ST_A20_SystemConfig_t*>(p));
    };
    static auto saveWifi_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveWifiConfig(*reinterpret_cast<const ST_A20_WifiConfig_t*>(p));
    };
    static auto saveMotion_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveMotionConfig(*reinterpret_cast<const ST_A20_MotionConfig_t*>(p));
    };
    static auto saveNvs_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveNvsSpecConfig(*reinterpret_cast<const ST_A20_NvsSpecConfig_t*>(p));
    };
    static auto saveSchedules_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveSchedules(*reinterpret_cast<const ST_A20_SchedulesRoot_t*>(p));
    };
    static auto saveUserProfiles_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveUserProfiles(*reinterpret_cast<const ST_A20_UserProfilesRoot_t*>(p));
    };
    static auto saveWind_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveWindDict(*reinterpret_cast<const ST_A20_WindDict_t*>(p));
    };
    static auto saveWeb_wrap = [](const void* p) -> bool {
        return CL_C10_ConfigManager::saveWebPageConfig(*reinterpret_cast<const ST_A20_WebPageConfig_t*>(p));
    };

    trySave(_dirty_system, "system", saveSystem_wrap, g_A20_config_root.system);
    trySave(_dirty_wifi, "wifi", saveWifi_wrap, g_A20_config_root.wifi);
    trySave(_dirty_motion, "motion", saveMotion_wrap, g_A20_config_root.motion);
    trySave(_dirty_nvsSpec, "nvsSpec", saveNvs_wrap, g_A20_config_root.nvsSpec);
    trySave(_dirty_schedules, "schedules", saveSchedules_wrap, g_A20_config_root.schedules);
    trySave(_dirty_userProfiles, "userProfiles", saveUserProfiles_wrap, g_A20_config_root.userProfiles);
    trySave(_dirty_windDict, "windDict", saveWind_wrap, g_A20_config_root.windDict);
    trySave(_dirty_webPage, "webPage", saveWeb_wrap, g_A20_config_root.webPage);

    if (v_attempt == 0) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] saveDirtyConfigs: nothing to save (no dirty flags).");
    } else if (v_failed == 0) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] saveDirtyConfigs: saved=%u/%u (all ok)", v_saved, v_attempt);
    } else {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] saveDirtyConfigs: saved=%u failed=%u attempted=%u", v_saved, v_failed, v_attempt);
    }
}

// 현재 Dirty 상태 조회
void CL_C10_ConfigManager::getDirtyStatus(JsonDocument& p_doc) {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    p_doc["system"]       = _dirty_system;
    p_doc["wifi"]         = _dirty_wifi;
    p_doc["motion"]       = _dirty_motion;
    p_doc["nvsSpec"]      = _dirty_nvsSpec;
    p_doc["schedules"]    = _dirty_schedules;
    p_doc["userProfiles"] = _dirty_userProfiles;
    p_doc["windDict"]     = _dirty_windDict;
    p_doc["webPage"]      = _dirty_webPage;
}

void CL_C10_ConfigManager::saveAll(const ST_A20_ConfigRoot_t& p_root) {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    if (p_root.system) saveSystemConfig(*p_root.system);
    if (p_root.wifi) saveWifiConfig(*p_root.wifi);
    if (p_root.motion) saveMotionConfig(*p_root.motion);
    if (p_root.nvsSpec) saveNvsSpecConfig(*p_root.nvsSpec);
    if (p_root.schedules) saveSchedules(*p_root.schedules);
    if (p_root.userProfiles) saveUserProfiles(*p_root.userProfiles);
    if (p_root.windDict) saveWindDict(*p_root.windDict);
    if (p_root.webPage) saveWebPageConfig(*p_root.webPage);
}

// -----------------------------------------------------
// 3. All Config → JSON Export
//  - 경쟁조건 방지: Core에서 mutex로 보호
// -----------------------------------------------------
void CL_C10_ConfigManager::toJson_All(const ST_A20_ConfigRoot_t& p,
                                     JsonDocument&              p_doc,
                                     bool                       p_includeSystem,
                                     bool                       p_includeWifi,
                                     bool                       p_includeMotion,
                                     bool                       p_includeNvsSpec,
                                     bool                       p_includeSchedules,
                                     bool                       p_includeUserProfiles,
                                     bool                       p_includeWindDict,
                                     bool                       p_includeWebPage) {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    if (p_includeSystem && p.system) toJson_System(*p.system, p_doc);
    if (p_includeWifi && p.wifi) toJson_Wifi(*p.wifi, p_doc);
    if (p_includeMotion && p.motion) toJson_Motion(*p.motion, p_doc);
    if (p_includeNvsSpec && p.nvsSpec) toJson_NvsSpec(*p.nvsSpec, p_doc);
    if (p_includeSchedules && p.schedules) toJson_Schedules(*p.schedules, p_doc);
    if (p_includeUserProfiles && p.userProfiles) toJson_UserProfiles(*p.userProfiles, p_doc);
    if (p_includeWindDict && p.windDict) toJson_WindDict(*p.windDict, p_doc);
    if (p_includeWebPage && p.webPage) toJson_WebPage(*p.webPage, p_doc);

    CL_D10_Logger::log(EN_L10_LOG_DEBUG,
                       "[C10] Config export -> JSON (sys=%d wifi=%d motion=%d nvs=%d sch=%d up=%d wind=%d web=%d)",
                       p_includeSystem ? 1 : 0,
                       p_includeWifi ? 1 : 0,
                       p_includeMotion ? 1 : 0,
                       p_includeNvsSpec ? 1 : 0,
                       p_includeSchedules ? 1 : 0,
                       p_includeUserProfiles ? 1 : 0,
                       p_includeWindDict ? 1 : 0,
                       p_includeWebPage ? 1 : 0);
}

// -----------------------------------------------------
// 8. Factory Reset 구현
//  - default 파일 있으면 섹션별 추출 저장
//  - 없으면 A20_resetToDefault + saveAll
//  - thread-safe: mutex 보호
// -----------------------------------------------------
bool CL_C10_ConfigManager::factoryResetFromDefault() {

    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_configMutex_v2, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    bool v_fileFound = false;

#ifdef CFG_DEFAULT_FILE_EXISTS
    JsonDocument v_def;

    // 공통함수 직접 호출 (thin wrapper 사용 금지)
    if (A40_IO::Load_File2JsonDoc_V21(A20_Const::CFG_DEFAULT_FILE, v_def, true)) {
        v_fileFound = true;

        // cfg_jsonFile 매핑이 비어있을 경우를 대비해 재로드 시도
        if (s_cfgJsonFileMap.system[0] == '\0') {
            if (!_loadCfgJsonFile()) {
                CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] factoryReset: cfg_jsonFile load failed.");
                return false;
            }
        }

        // 1) system
        if (v_def["system"].is<JsonObjectConst>()) {
            JsonDocument v_doc;
            v_doc["system"] = v_def["system"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.system, v_doc, true);
        }

        // 2) wifi
        if (v_def["wifi"].is<JsonObjectConst>()) {
            JsonDocument v_doc;
            v_doc["wifi"] = v_def["wifi"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.wifi, v_doc, true);
        }

        // 3) motion
        if (v_def["motion"].is<JsonObjectConst>()) {
            JsonDocument v_doc;
            v_doc["motion"] = v_def["motion"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.motion, v_doc, true);
        }

        // 4) nvsSpec
        if (v_def["nvsSpec"].is<JsonObjectConst>()) {
            JsonDocument v_doc;
            v_doc["nvsSpec"] = v_def["nvsSpec"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.nvsSpec, v_doc, true);
        }

        // 5) windDict (legacy: windProfile)
        if (v_def["windDict"].is<JsonObjectConst>() || v_def["windProfile"].is<JsonObjectConst>()) {
            JsonDocument v_doc;
            v_doc["windDict"] = v_def["windDict"].is<JsonObjectConst>() ? v_def["windDict"] : v_def["windProfile"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.windDict, v_doc, true);
        }

        // 6) schedules (object/array 모두 허용)
        if (v_def["schedules"].is<JsonObjectConst>() || v_def["schedules"].is<JsonArrayConst>()) {
            JsonDocument v_doc;
            v_doc["schedules"] = v_def["schedules"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.schedules, v_doc, true);
        }

        // 7) userProfiles
        if (v_def["userProfiles"].is<JsonObjectConst>()) {
            JsonDocument v_doc;
            v_doc["userProfiles"] = v_def["userProfiles"];
            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.userProfiles, v_doc, true);
        }

        // 8) webPage (pages/reDirect/assets or webPage object)
        if (v_def["pages"].is<JsonArrayConst>() || v_def["webPage"].is<JsonObjectConst>()) {
            JsonDocument v_doc;

            // ✅ 운영급: 저장 포맷을 "webPage" 루트키로 통일
            if (v_def["webPage"].is<JsonObjectConst>()) {
                v_doc["webPage"] = v_def["webPage"];
            } else {
                JsonObject v_web = v_doc["webPage"].to<JsonObject>();
                v_web["pages"]    = v_def["pages"];
                v_web["reDirect"] = v_def["reDirect"];
                v_web["assets"]   = v_def["assets"];
            }

            A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.webPage, v_doc, true);
        }

        CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] Factory Reset: Restored from default master file.");
    }
#endif

    if (!v_fileFound) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Factory Reset: Using hardcoded defaults in C++.");
        A20_resetToDefault(g_A20_config_root);
        saveAll(g_A20_config_root);
    }

    return true;
}

