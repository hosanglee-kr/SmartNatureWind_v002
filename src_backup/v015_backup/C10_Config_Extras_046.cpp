/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Extras_046.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - Extras (NvsSpec/WebPage)
 * ------------------------------------------------------
 * 기능 요약:
 *  - NvsSpec / WebPage 설정 Load/Save
 *  - NvsSpec / WebPage 설정 JSON Patch 적용
 *  - NvsSpec / WebPage 설정 JSON Export
 *  - camelCase only (snake_case fallback 제거)
 *  - WebPage는 루트형(JSON root: pages/reDirect/assets) 저장/로드/패치/익스포트 (옵션 B 확정)
 *  - NvsSpec는 랩핑(nvsSpec) 또는 루트형 모두 로드/패치 허용 (저장은 nvsSpec 랩핑 유지)
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 *  - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 변수명은 가능한 해석 가능하게
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - namespace 명        : 모듈약어_ 접두사
 *   - namespace 내 상수    : 모둘약어 접두시 미사용
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사 , 버전 제거
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include "C10_Config_042.h"
// #include "A40_Com_Func_052.h"

// =====================================================
// 2-x. 목적물별 Load 구현 (NvsSpec / WebPage)
//  - 핵심수정 반영:
//    (A) mutex 보호
//    (B) A20_resetxxxDefault로 "기본값" 먼저 채운 뒤 파일 값을 오버레이
// =====================================================
bool CL_C10_ConfigManager::loadNvsSpecConfig(ST_A20_NvsSpecConfig_t& p_cfg) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument v_doc;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.nvsSpec[0] != '\0') {
        v_cfgJsonPath = s_cfgJsonFileMap.nvsSpec;
    } else {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadNvsSpecConfig: s_cfgJsonFileMap.nvsSpec is empty");
        return false;
    }

    // ✅ 기본값 선반영(운영 안전)
    A20_resetNvsSpecDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, v_doc, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadNvsSpecConfig: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    // {"nvsSpec":{...}} 또는 루트 자체 {...} 지원
    JsonObjectConst j_root = A40_ComFunc::Json_pickRootObject(v_doc, "nvsSpec");
    if (j_root.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadNvsSpecConfig: root object invalid");
        return false;
    }

    // namespaceName: JSON key "namespace"
    {
        // key가 존재할 때만 반영(없으면 defaults 유지)
        JsonVariantConst v_nsVar = j_root["namespace"];
        if (!v_nsVar.isNull()) {
            A40_ComFunc::Json_copyStr(j_root,
                                      "namespace",
                                      p_cfg.namespaceName,
                                      sizeof(p_cfg.namespaceName),
                                      (p_cfg.namespaceName[0] ? p_cfg.namespaceName : "SNW"),
                                      __func__);
        }
    }

    // entries[]
    {
        JsonArrayConst j_entries = A40_ComFunc::Json_getArr(j_root, "entries");
        if (j_entries.isNull()) {
            // 파일이 비었거나 키가 없으면 "기본값 유지"
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadNvsSpecConfig: missing 'entries' (keep defaults)");
            return true;
        }

        // 정책: 파일 entries가 존재하면 "전체 교체"
        memset(p_cfg.entries, 0, sizeof(p_cfg.entries));
        p_cfg.entryCount = 0;

        for (JsonObjectConst j_e : j_entries) {
            if (p_cfg.entryCount >= A20_Const::MAX_NVS_ENTRIES) break;

            ST_A20_NvsEntry_t& v_ent = p_cfg.entries[p_cfg.entryCount];
            memset(&v_ent, 0, sizeof(v_ent));

            // key는 필수
            bool v_keyOk = A40_ComFunc::Json_copyStrReq(j_e, "key", v_ent.key, sizeof(v_ent.key), "", __func__);
            if (!v_keyOk || v_ent.key[0] == '\0') continue;

            // type/defaultValue는 옵션(없으면 빈 문자열)
            A40_ComFunc::Json_copyStr(j_e, "type", v_ent.type, sizeof(v_ent.type), "", __func__);
            A40_ComFunc::Json_copyStr(j_e, "defaultValue", v_ent.defaultValue, sizeof(v_ent.defaultValue), "", __func__);

            p_cfg.entryCount++;
        }
    }

    return true;
}

bool CL_C10_ConfigManager::loadWebPageConfig(ST_A20_WebPageConfig_t& p_cfg) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonDocument v_doc;

    const char* v_cfgJsonPath = nullptr;
    if (s_cfgJsonFileMap.webPage[0] != '\0') {
        v_cfgJsonPath = s_cfgJsonFileMap.webPage;
    } else {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWebPageConfig: s_cfgJsonFileMap.webPage is empty");
        return false;
    }

    // ✅ 기본값 선반영(운영 안전)
    A20_resetWebPageDefault(p_cfg);

    if (!A40_IO::Load_File2JsonDoc_V21(v_cfgJsonPath, v_doc, true, __func__)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWebPageConfig: Load_File2JsonDoc_V21 failed (%s)", v_cfgJsonPath);
        return false;
    }

    // ✅ WebPage는 루트형 확정
    JsonObjectConst j_root = v_doc.as<JsonObjectConst>();
    if (j_root.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWebPageConfig: root object invalid");
        return false;
    }

    // pages[] (파일에 있으면 전체 교체)
    {
        JsonArrayConst j_pages = A40_ComFunc::Json_getArr(j_root, "pages");
        if (!j_pages.isNull()) {
            memset(p_cfg.pages, 0, sizeof(p_cfg.pages));
            p_cfg.pageCount = 0;

            for (JsonObjectConst j_p : j_pages) {
                if (p_cfg.pageCount >= A20_Const::MAX_PAGES) break;

                ST_A20_PageItem_t& v_p = p_cfg.pages[p_cfg.pageCount];
                memset(&v_p, 0, sizeof(v_p));

                // uri/path는 필수
                bool v_uriOk  = A40_ComFunc::Json_copyStrReq(j_p, "uri", v_p.uri, sizeof(v_p.uri), "", __func__);
                bool v_pathOk = A40_ComFunc::Json_copyStrReq(j_p, "path", v_p.path, sizeof(v_p.path), "", __func__);
                if (!v_uriOk || !v_pathOk || v_p.uri[0] == '\0' || v_p.path[0] == '\0') {
                    continue;
                }

                // label은 옵션
                A40_ComFunc::Json_copyStr(j_p, "label", v_p.label, sizeof(v_p.label), "", __func__);

                v_p.enable = A40_ComFunc::Json_getBool(j_p, "enable", true);
                v_p.isMain = A40_ComFunc::Json_getBool(j_p, "isMain", false);
                v_p.order  = A40_ComFunc::Json_getNum<uint16_t>(j_p, "order", 0);

                // pageAssets[]
                v_p.pageAssetCount      = 0;
                JsonArrayConst j_assets = A40_ComFunc::Json_getArr(j_p, "pageAssets");
                if (!j_assets.isNull()) {
                    for (JsonObjectConst j_a : j_assets) {
                        if (v_p.pageAssetCount >= A20_Const::MAX_PAGE_ASSETS) break;

                        ST_A20_PageAsset_t& v_a = v_p.pageAssets[v_p.pageAssetCount];
                        memset(&v_a, 0, sizeof(v_a));

                        bool v_aUriOk = A40_ComFunc::Json_copyStrReq(j_a, "uri", v_a.uri, sizeof(v_a.uri), "", __func__);
                        bool v_aPathOk =
                            A40_ComFunc::Json_copyStrReq(j_a, "path", v_a.path, sizeof(v_a.path), "", __func__);
                        if (!v_aUriOk || !v_aPathOk || v_a.uri[0] == '\0' || v_a.path[0] == '\0') {
                            continue;
                        }

                        v_p.pageAssetCount++;
                    }
                }

                p_cfg.pageCount++;
            }
        } else {
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadWebPageConfig: missing 'pages' (keep defaults)");
        }
    }

    // reDirect[] (파일에 있으면 전체 교체)
    {
        JsonArrayConst j_red = A40_ComFunc::Json_getArr(j_root, "reDirect");
        if (!j_red.isNull()) {
            memset(p_cfg.reDirect, 0, sizeof(p_cfg.reDirect));
            p_cfg.reDirectCount = 0;

            for (JsonObjectConst j_r : j_red) {
                if (p_cfg.reDirectCount >= A20_Const::MAX_REDIRECTS) break;

                ST_A20_ReDirectItem_t& v_r = p_cfg.reDirect[p_cfg.reDirectCount];
                memset(&v_r, 0, sizeof(v_r));

                bool v_fromOk =
                    A40_ComFunc::Json_copyStrReq(j_r, "uriFrom", v_r.uriFrom, sizeof(v_r.uriFrom), "", __func__);
                bool v_toOk = A40_ComFunc::Json_copyStrReq(j_r, "uriTo", v_r.uriTo, sizeof(v_r.uriTo), "", __func__);
                if (!v_fromOk || !v_toOk || v_r.uriFrom[0] == '\0' || v_r.uriTo[0] == '\0') {
                    continue;
                }

                p_cfg.reDirectCount++;
            }
        }
    }

    // assets[] (파일에 있으면 전체 교체)
    {
        JsonArrayConst j_cas = A40_ComFunc::Json_getArr(j_root, "assets");
        if (!j_cas.isNull()) {
            memset(p_cfg.assets, 0, sizeof(p_cfg.assets));
            p_cfg.assetCount = 0;

            for (JsonObjectConst j_c : j_cas) {
                if (p_cfg.assetCount >= A20_Const::MAX_COMMON_ASSETS) break;

                ST_A20_CommonAsset_t& v_c = p_cfg.assets[p_cfg.assetCount];
                memset(&v_c, 0, sizeof(v_c));

                bool v_uriOk  = A40_ComFunc::Json_copyStrReq(j_c, "uri", v_c.uri, sizeof(v_c.uri), "", __func__);
                bool v_pathOk = A40_ComFunc::Json_copyStrReq(j_c, "path", v_c.path, sizeof(v_c.path), "", __func__);
                if (!v_uriOk || !v_pathOk || v_c.uri[0] == '\0' || v_c.path[0] == '\0') {
                    continue;
                }

                v_c.isCommon = A40_ComFunc::Json_getBool(j_c, "isCommon", false);

                p_cfg.assetCount++;
            }
        }
    }

    return true;
}

// =====================================================
// 2-x. 목적물별 Save 구현 (NvsSpec / WebPage)
//  - 핵심수정 반영:
//    (A) mutex 보호
//    (B) path empty 방어 + 명확 로그
// =====================================================
bool CL_C10_ConfigManager::saveNvsSpecConfig(const ST_A20_NvsSpecConfig_t& p_cfg) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.nvsSpec[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveNvsSpecConfig: path empty (cfg map not loaded?)");
        return false;
    }

    JsonDocument v_doc;

    // 루트 래핑: nvsSpec
    JsonObject v_root = v_doc["nvsSpec"].to<JsonObject>();

    v_root["namespace"] = p_cfg.namespaceName;

    JsonArray v_arr = v_root["entries"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.entryCount && v_i < A20_Const::MAX_NVS_ENTRIES; v_i++) {
        const ST_A20_NvsEntry_t& v_e = p_cfg.entries[v_i];
        if (v_e.key[0] == '\0') continue;

        JsonObject v_o      = v_arr.add<JsonObject>();
        v_o["key"]          = v_e.key;
        v_o["type"]         = v_e.type;
        v_o["defaultValue"] = v_e.defaultValue;
    }

    bool v_ok = A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.nvsSpec, v_doc, true, true, __func__);
    return v_ok;
}

bool CL_C10_ConfigManager::saveWebPageConfig(const ST_A20_WebPageConfig_t& p_cfg) {
    // Mutex 가드 생성 (함수 종료 시 자동 해제 보장)
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    if (s_cfgJsonFileMap.webPage[0] == '\0') {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] saveWebPageConfig: path empty (cfg map not loaded?)");
        return false;
    }

    JsonDocument v_doc;

    // ✅ 루트형 저장: pages / reDirect / assets

    // pages[]
    JsonArray v_pages = v_doc["pages"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.pageCount && v_i < A20_Const::MAX_PAGES; v_i++) {
        const ST_A20_PageItem_t& v_p = p_cfg.pages[v_i];
        if (v_p.uri[0] == '\0' || v_p.path[0] == '\0') continue;

        JsonObject v_po = v_pages.add<JsonObject>();
        v_po["uri"]     = v_p.uri;
        v_po["path"]    = v_p.path;
        v_po["label"]   = v_p.label;
        v_po["enable"]  = v_p.enable;
        v_po["isMain"]  = v_p.isMain;
        v_po["order"]   = v_p.order;

        JsonArray v_pa = v_po["pageAssets"].to<JsonArray>();
        for (uint8_t v_j = 0; v_j < v_p.pageAssetCount && v_j < A20_Const::MAX_PAGE_ASSETS; v_j++) {
            const ST_A20_PageAsset_t& v_a = v_p.pageAssets[v_j];
            if (v_a.uri[0] == '\0' || v_a.path[0] == '\0') continue;

            JsonObject v_ao = v_pa.add<JsonObject>();
            v_ao["uri"]     = v_a.uri;
            v_ao["path"]    = v_a.path;
        }
    }

    // reDirect[]
    JsonArray v_red = v_doc["reDirect"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.reDirectCount && v_i < A20_Const::MAX_REDIRECTS; v_i++) {
        const ST_A20_ReDirectItem_t& v_r = p_cfg.reDirect[v_i];
        if (v_r.uriFrom[0] == '\0' || v_r.uriTo[0] == '\0') continue;

        JsonObject v_ro = v_red.add<JsonObject>();
        v_ro["uriFrom"] = v_r.uriFrom;
        v_ro["uriTo"]   = v_r.uriTo;
    }

    // assets[]
    JsonArray v_as = v_doc["assets"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.assetCount && v_i < A20_Const::MAX_COMMON_ASSETS; v_i++) {
        const ST_A20_CommonAsset_t& v_c = p_cfg.assets[v_i];
        if (v_c.uri[0] == '\0' || v_c.path[0] == '\0') continue;

        JsonObject v_co  = v_as.add<JsonObject>();
        v_co["uri"]      = v_c.uri;
        v_co["path"]     = v_c.path;
        v_co["isCommon"] = v_c.isCommon;
    }

    bool v_ok = A40_IO::Save_JsonDoc2File_V21(s_cfgJsonFileMap.webPage, v_doc, true, true, __func__);
    return v_ok;
}

// =====================================================
// 4-x. JSON Patch (NvsSpec / WebPage) - camelCase only
//  - NvsSpec: {"nvsSpec":{...}} 또는 루트형 patch 허용
//  - WebPage: ✅ 루트형 patch 확정 (pages/reDirect/assets가 루트에 위치)
// =====================================================
bool CL_C10_ConfigManager::patchNvsSpecFromJson(ST_A20_NvsSpecConfig_t& p_cfg, const JsonDocument& p_patch) {
    bool v_changed = false;

    // Mutex 가드 생성
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    // {"nvsSpec":{...}} 또는 루트 자체 {...}
    JsonObjectConst j_root = p_patch["nvsSpec"].as<JsonObjectConst>();
    if (j_root.isNull()) j_root = p_patch.as<JsonObjectConst>();
    if (j_root.isNull()) {
        return false;
    }

    // namespace (key가 존재할 때만 반영)
    {
        JsonVariantConst v_nsVar = j_root["namespace"];
        if (!v_nsVar.isNull()) {
            char v_nsBuf[sizeof(p_cfg.namespaceName)];
            memset(v_nsBuf, 0, sizeof(v_nsBuf));

            // 필수 수준으로 취급(키가 있는데 빈문자열/타입불일치면 경고 로그)
            bool v_ok =
                A40_ComFunc::Json_copyStrReq(j_root, "namespace", v_nsBuf, sizeof(v_nsBuf), p_cfg.namespaceName, __func__);

            if (v_ok && v_nsBuf[0] != '\0' && strcmp(v_nsBuf, p_cfg.namespaceName) != 0) {
                strlcpy(p_cfg.namespaceName, v_nsBuf, sizeof(p_cfg.namespaceName));
                v_changed = true;
            }
        }
    }

    // entries: 전체 교체 정책
    JsonArrayConst j_entries = j_root["entries"].as<JsonArrayConst>();
    if (!j_entries.isNull()) {
        memset(p_cfg.entries, 0, sizeof(p_cfg.entries));
        p_cfg.entryCount = 0;

        for (JsonObjectConst j_e : j_entries) {
            if (p_cfg.entryCount >= A20_Const::MAX_NVS_ENTRIES) break;

            ST_A20_NvsEntry_t& v_ent = p_cfg.entries[p_cfg.entryCount];
            memset(&v_ent, 0, sizeof(v_ent));

            bool v_keyOk = A40_ComFunc::Json_copyStrReq(j_e, "key", v_ent.key, sizeof(v_ent.key), "", __func__);
            if (!v_keyOk || v_ent.key[0] == '\0') continue;

            A40_ComFunc::Json_copyStr(j_e, "type", v_ent.type, sizeof(v_ent.type), "", __func__);
            A40_ComFunc::Json_copyStr(j_e, "defaultValue", v_ent.defaultValue, sizeof(v_ent.defaultValue), "", __func__);

            p_cfg.entryCount++;
        }

        v_changed = true;
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] NvsSpec entries fully replaced.");
    }

    if (v_changed) {
        // Dirty Flag 원자성
        A40_ComFunc::Dirty_setAtomic(_dirty_nvsSpec, s_dirtyflagSpinlock);
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] NvsSpec config patched. Dirty=true");
    }

    return v_changed;
}

bool CL_C10_ConfigManager::patchWebPageFromJson(ST_A20_WebPageConfig_t& p_cfg, const JsonDocument& p_patch) {
    bool v_changed = false;

    // Mutex 가드 생성
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return false;
    }

    // ✅ WebPage는 루트형 patch 확정
    JsonObjectConst j_root = p_patch.as<JsonObjectConst>();
    if (j_root.isNull()) {
        return false;
    }

    // pages: 전체 교체
    JsonArrayConst j_pages = j_root["pages"].as<JsonArrayConst>();
    if (!j_pages.isNull()) {
        memset(p_cfg.pages, 0, sizeof(p_cfg.pages));
        p_cfg.pageCount = 0;

        for (JsonObjectConst j_p : j_pages) {
            if (p_cfg.pageCount >= A20_Const::MAX_PAGES) break;

            ST_A20_PageItem_t& v_p = p_cfg.pages[p_cfg.pageCount];
            memset(&v_p, 0, sizeof(v_p));

            bool v_uriOk  = A40_ComFunc::Json_copyStrReq(j_p, "uri", v_p.uri, sizeof(v_p.uri), "", __func__);
            bool v_pathOk = A40_ComFunc::Json_copyStrReq(j_p, "path", v_p.path, sizeof(v_p.path), "", __func__);
            if (!v_uriOk || !v_pathOk || v_p.uri[0] == '\0' || v_p.path[0] == '\0') continue;

            A40_ComFunc::Json_copyStr(j_p, "label", v_p.label, sizeof(v_p.label), "", __func__);

            v_p.enable = A40_ComFunc::Json_getBool(j_p, "enable", true);
            v_p.isMain = A40_ComFunc::Json_getBool(j_p, "isMain", false);
            v_p.order  = A40_ComFunc::Json_getNum<uint16_t>(j_p, "order", 0);

            v_p.pageAssetCount  = 0;
            JsonArrayConst j_pa = A40_ComFunc::Json_getArr(j_p, "pageAssets");
            if (!j_pa.isNull()) {
                for (JsonObjectConst j_a : j_pa) {
                    if (v_p.pageAssetCount >= A20_Const::MAX_PAGE_ASSETS) break;

                    ST_A20_PageAsset_t& v_a = v_p.pageAssets[v_p.pageAssetCount];
                    memset(&v_a, 0, sizeof(v_a));

                    bool v_aUriOk = A40_ComFunc::Json_copyStrReq(j_a, "uri", v_a.uri, sizeof(v_a.uri), "", __func__);
                    bool v_aPathOk = A40_ComFunc::Json_copyStrReq(j_a, "path", v_a.path, sizeof(v_a.path), "", __func__);
                    if (!v_aUriOk || !v_aPathOk || v_a.uri[0] == '\0' || v_a.path[0] == '\0') continue;

                    v_p.pageAssetCount++;
                }
            }

            p_cfg.pageCount++;
        }

        v_changed = true;
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] WebPage pages fully replaced.");
    }

    // reDirect: 전체 교체
    JsonArrayConst j_red = j_root["reDirect"].as<JsonArrayConst>();
    if (!j_red.isNull()) {
        memset(p_cfg.reDirect, 0, sizeof(p_cfg.reDirect));
        p_cfg.reDirectCount = 0;

        for (JsonObjectConst j_r : j_red) {
            if (p_cfg.reDirectCount >= A20_Const::MAX_REDIRECTS) break;

            ST_A20_ReDirectItem_t& v_r = p_cfg.reDirect[p_cfg.reDirectCount];
            memset(&v_r, 0, sizeof(v_r));

            bool v_fromOk = A40_ComFunc::Json_copyStrReq(j_r, "uriFrom", v_r.uriFrom, sizeof(v_r.uriFrom), "", __func__);
            bool v_toOk = A40_ComFunc::Json_copyStrReq(j_r, "uriTo", v_r.uriTo, sizeof(v_r.uriTo), "", __func__);
            if (!v_fromOk || !v_toOk || v_r.uriFrom[0] == '\0' || v_r.uriTo[0] == '\0') continue;

            p_cfg.reDirectCount++;
        }

        v_changed = true;
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] WebPage reDirect fully replaced.");
    }

    // assets: 전체 교체
    JsonArrayConst j_assets = j_root["assets"].as<JsonArrayConst>();
    if (!j_assets.isNull()) {
        memset(p_cfg.assets, 0, sizeof(p_cfg.assets));
        p_cfg.assetCount = 0;

        for (JsonObjectConst j_c : j_assets) {
            if (p_cfg.assetCount >= A20_Const::MAX_COMMON_ASSETS) break;

            ST_A20_CommonAsset_t& v_c = p_cfg.assets[p_cfg.assetCount];
            memset(&v_c, 0, sizeof(v_c));

            bool v_uriOk  = A40_ComFunc::Json_copyStrReq(j_c, "uri", v_c.uri, sizeof(v_c.uri), "", __func__);
            bool v_pathOk = A40_ComFunc::Json_copyStrReq(j_c, "path", v_c.path, sizeof(v_c.path), "", __func__);
            if (!v_uriOk || !v_pathOk || v_c.uri[0] == '\0' || v_c.path[0] == '\0') continue;

            v_c.isCommon = A40_ComFunc::Json_getBool(j_c, "isCommon", false);

            p_cfg.assetCount++;
        }

        v_changed = true;
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[C10] WebPage assets fully replaced.");
    }

    if (v_changed) {
        // Dirty Flag 원자성
        A40_ComFunc::Dirty_setAtomic(_dirty_webPage, s_dirtyflagSpinlock);
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WebPage config patched. Dirty=true");
    }

    return v_changed;
}

// =====================================================
// 3-x. JSON Export (NvsSpec / WebPage)
//  - 핵심수정 반영:
//    (A) mutex 보호(단독 호출 경로 대비)
//    (B) doc 잔재 방지: remove로 해당 키 정리 후 재생성
// =====================================================
void CL_C10_ConfigManager::toJson_NvsSpec(const ST_A20_NvsSpecConfig_t& p_cfg, JsonDocument& p_doc) {
    // Mutex 가드 생성
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    // 잔재 방지
    JsonObject v_rootTop = p_doc.as<JsonObject>();
    v_rootTop.remove("nvsSpec");

    // 루트 래핑: nvsSpec
    JsonObject v_root = p_doc["nvsSpec"].to<JsonObject>();

    v_root["namespace"] = p_cfg.namespaceName;

    JsonArray v_arr = v_root["entries"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.entryCount && v_i < A20_Const::MAX_NVS_ENTRIES; v_i++) {
        const ST_A20_NvsEntry_t& v_e = p_cfg.entries[v_i];
        if (v_e.key[0] == '\0') continue;

        JsonObject v_o      = v_arr.add<JsonObject>();
        v_o["key"]          = v_e.key;
        v_o["type"]         = v_e.type;
        v_o["defaultValue"] = v_e.defaultValue;
    }
}

void CL_C10_ConfigManager::toJson_WebPage(const ST_A20_WebPageConfig_t& p_cfg, JsonDocument& p_doc) {
    // Mutex 가드 생성
    CL_A40_MutexGuard_Semaphore v_MutxGuard(s_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: Mutex timeout", __func__);
        return;
    }

    // 잔재 방지
    JsonObject v_rootTop = p_doc.as<JsonObject>();
    v_rootTop.remove("pages");
    v_rootTop.remove("reDirect");
    v_rootTop.remove("assets");

    // ✅ 루트형 Export: pages / reDirect / assets
    JsonArray v_pages = p_doc["pages"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.pageCount && v_i < A20_Const::MAX_PAGES; v_i++) {
        const ST_A20_PageItem_t& v_p = p_cfg.pages[v_i];
        if (v_p.uri[0] == '\0' || v_p.path[0] == '\0') continue;

        JsonObject v_po = v_pages.add<JsonObject>();
        v_po["uri"]     = v_p.uri;
        v_po["path"]    = v_p.path;
        v_po["label"]   = v_p.label;
        v_po["enable"]  = v_p.enable;
        v_po["isMain"]  = v_p.isMain;
        v_po["order"]   = v_p.order;

        JsonArray v_pa = v_po["pageAssets"].to<JsonArray>();
        for (uint8_t v_j = 0; v_j < v_p.pageAssetCount && v_j < A20_Const::MAX_PAGE_ASSETS; v_j++) {
            const ST_A20_PageAsset_t& v_a = v_p.pageAssets[v_j];
            if (v_a.uri[0] == '\0' || v_a.path[0] == '\0') continue;

            JsonObject v_ao = v_pa.add<JsonObject>();
            v_ao["uri"]     = v_a.uri;
            v_ao["path"]    = v_a.path;
        }
    }

    JsonArray v_red = p_doc["reDirect"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.reDirectCount && v_i < A20_Const::MAX_REDIRECTS; v_i++) {
        const ST_A20_ReDirectItem_t& v_r = p_cfg.reDirect[v_i];
        if (v_r.uriFrom[0] == '\0' || v_r.uriTo[0] == '\0') continue;

        JsonObject v_ro = v_red.add<JsonObject>();
        v_ro["uriFrom"] = v_r.uriFrom;
        v_ro["uriTo"]   = v_r.uriTo;
    }

    JsonArray v_as = p_doc["assets"].to<JsonArray>();
    for (uint8_t v_i = 0; v_i < p_cfg.assetCount && v_i < A20_Const::MAX_COMMON_ASSETS; v_i++) {
        const ST_A20_CommonAsset_t& v_c = p_cfg.assets[v_i];
        if (v_c.uri[0] == '\0' || v_c.path[0] == '\0') continue;

        JsonObject v_co  = v_as.add<JsonObject>();
        v_co["uri"]      = v_c.uri;
        v_co["path"]     = v_c.path;
        v_co["isCommon"] = v_c.isCommon;
    }
}
