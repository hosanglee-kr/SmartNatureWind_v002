/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Static_0202.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Static Assets & Menu
 * ------------------------------------------------------
 * 기능 요약:
 * - LittleFS JSON에서 웹 페이지/자산/리다이렉트 로드
 * - pages[].order 기준 정렬 메뉴
 * - 각 페이지의 pageAssets 배열로 HTML별 전용 CSS/JS 라우팅
 * - assets[]로 공통 정적 자산 라우팅
 * - /api/v1/menu API
 *
 * [Batch D-2] W10_registerStaticRoute: .gz 경로 등록 시 사전 계산
 *  - 이전: 매 요청마다 String(v_file) + ".gz" = 2회 할당
 *  - 이후: 등록 시 1회 계산 후 shared_ptr 캡처 → 요청 시 0회
 *
 * [Batch D-3] W10_registerGzipServe: String 할당 최소화
 *  - url() 참조 (copy 없음)
 *  - .gz 경로는 스택 버퍼(128B) 사용 → 힙 할당 0회
 * ------------------------------------------------------
 */

#include <ArduinoJson.h>
#include <LittleFS.h>
#include <string.h>

#include <algorithm>

#include "W10_Web_0202.h"
#include "A40_Com_Utils_0202.h"
#include "W10_Web_Const_0202.h"

// ------------------------------------------------------
// CL_W10_WebAPI 정적 멤버 정의
// ------------------------------------------------------
CL_W10_WebAPI::ST_W10_MenuState_t CL_W10_WebAPI::s_menu_state;

// ------------------------------------------------------
// 헬퍼
// ------------------------------------------------------
const char* CL_W10_WebAPI::W10_guessMime(const char* p_path) {
    if (!p_path) return "application/octet-stream";

    if (strstr(p_path, ".html")) return "text/html; charset=utf-8";
    if (strstr(p_path, ".css")) return "text/css; charset=utf-8";
    if (strstr(p_path, ".js")) return "application/javascript; charset=utf-8";
    if (strstr(p_path, ".json")) return "application/json; charset=utf-8";
    if (strstr(p_path, ".svg")) return "image/svg+xml";
    if (strstr(p_path, ".png")) return "image/png";
    if (strstr(p_path, ".jpg") || strstr(p_path, ".jpeg")) return "image/jpeg";
    if (strstr(p_path, ".ico")) return "image/x-icon";
    if (strstr(p_path, ".woff2")) return "font/woff2";
    if (strstr(p_path, ".txt")) return "text/plain; charset=utf-8";

    return "application/octet-stream";
}

bool CL_W10_WebAPI::W10_loadPagesJson(JsonDocument& p_doc, uint16_t& p_page_count, uint16_t& p_asset_count) {
    p_page_count  = 0;
    p_asset_count = 0;

    const auto& v_cfgJsonPath = CL_C10_ConfigManager::getCfgJsonFileMap();

    File v_file = LittleFS.open(v_cfgJsonPath.webPage, "r");
    if (!v_file) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Failed to open pages JSON: %s", v_cfgJsonPath.webPage);
        return false;
    }

    DeserializationError v_err = deserializeJson(p_doc, v_file);
    v_file.close();
    if (v_err) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Pages JSON deserialize failed: %s", v_err.c_str());
        return false;
    }

    if (!p_doc.is<JsonObject>()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Pages JSON root is not a valid object.");
        return false;
    }

    JsonObjectConst j_root = p_doc.as<JsonObjectConst>();

    JsonArrayConst v_pages_array  = j_root["pages"].as<JsonArrayConst>();
    JsonArrayConst v_assets_array = j_root["assets"].as<JsonArrayConst>();

    if (v_pages_array.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] 'pages' array missing or invalid in JSON root.");
        return false;
    }

    p_page_count  = (uint16_t)v_pages_array.size();
    p_asset_count = v_assets_array.isNull() ? 0 : (uint16_t)v_assets_array.size();

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] JSON loaded (Pages: %u, Assets: %u)", p_page_count, p_asset_count);
    return true;
}

// ======================================================
// [B-5] Accept-Encoding 파서 (RFC 7231 q-value 지원)
//  - 이전: indexOf("gzip") → "gzip;q=0" 오탐지
//  - 이후: 토큰별 파싱 + q 값 검사 (q=0은 거부, 없으면 1.0)
// ======================================================
static bool W10_acceptsGzip(AsyncWebServerRequest* r) {
    if (!r || !r->hasHeader("Accept-Encoding")) return false;

    String v_ae = r->getHeader("Accept-Encoding")->value();
    v_ae.toLowerCase();

    int v_start = 0;
    while (v_start < (int)v_ae.length()) {
        int v_end = v_ae.indexOf(',', v_start);
        if (v_end < 0) v_end = v_ae.length();

        String v_token = v_ae.substring(v_start, v_end);
        v_token.trim();

        // 토큰은 "<coding>" 또는 "<coding>;q=<float>"
        String v_coding = v_token;
        int    v_semi   = v_token.indexOf(';');
        if (v_semi >= 0) v_coding = v_token.substring(0, v_semi);
        v_coding.trim();

        // gzip 또는 * 매칭
        if (v_coding == "gzip" || v_coding == "*") {
            // q 값 확인
            int v_qpos = v_token.indexOf("q=");
            if (v_qpos < 0) return true;   // q 없으면 기본 1.0 → 허용
            float v_qval = v_token.substring(v_qpos + 2).toFloat();
            return v_qval > 0.0f;          // q=0 → 거부
        }

        v_start = v_end + 1;
    }
    return false;
}

// ======================================================
// [D-2] W10_registerStaticRoute: .gz 경로 등록 시 사전 계산
// ======================================================
void CL_W10_WebAPI::W10_registerStaticRoute(const char* p_uri, const char* p_file, const char* p_mime) {
    if (!p_uri || !p_file || !p_mime) return;

    auto v_uri  = A40_ComFunc::cloneStr2SharedStr_safe(p_uri);
    auto v_file = A40_ComFunc::cloneStr2SharedStr_safe(p_file);
    auto v_mime = A40_ComFunc::cloneStr2SharedStr_safe(p_mime);

    // [D-2] .gz 경로 등록 시점 사전 계산 (per-request 할당 제거)
    String v_gzPathString = String(p_file) + ".gz";
    auto   v_gz_file      = A40_ComFunc::cloneStr2SharedStr_safe(v_gzPathString.c_str());

    if (!v_uri || !v_file || !v_mime || !v_gz_file) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Route alloc failed: %s", p_uri);
        return;
    }

    s_server->on(v_uri.get(), HTTP_GET, [v_file, v_gz_file, v_mime](AsyncWebServerRequest* r) {
        // [B-5] RFC 7231 준수 gzip 판정
        if (W10_acceptsGzip(r) && LittleFS.exists(v_gz_file.get())) {
            auto* v_resp = r->beginResponse(LittleFS, v_gz_file.get(), v_mime.get());
            v_resp->addHeader("Content-Encoding", "gzip");
            v_resp->addHeader("Vary", "Accept-Encoding");
            CL_W10_WebAPI::_applyHeaders(v_resp, false);
            r->send(v_resp);
            return;
        }

        if (LittleFS.exists(v_file.get())) {
            auto* v_resp = r->beginResponse(LittleFS, v_file.get(), v_mime.get());
            v_resp->addHeader("Vary", "Accept-Encoding");
            CL_W10_WebAPI::_applyHeaders(v_resp, false);
            r->send(v_resp);
            return;
        }

        String v_msg  = "/* missing:" + String(v_file.get()) + " */";
        auto*  v_resp = r->beginResponse(200, v_mime.get(), v_msg);
        CL_W10_WebAPI::_applyHeaders(v_resp, true);
        r->send(v_resp);
    });
}

// ======================================================
// [D-3] W10_registerGzipServe: String 할당 최소화
// ======================================================
void CL_W10_WebAPI::W10_registerGzipServe() {
    // v0201 대응
    s_server->on("^\\/(html_v0202)\\/.+", HTTP_GET, [](AsyncWebServerRequest* r) {
        String v_url = r->url();
        char v_gzPath[192];
        int  v_n = snprintf(v_gzPath, sizeof(v_gzPath), "%s.gz", v_url.c_str());
        if (v_n < 0 || v_n >= (int)sizeof(v_gzPath)) {
            r->send(414, "text/plain; charset=utf-8", "URI too long");
            return;
        }
        const char* v_mime = W10_guessMime(v_url.c_str());

        // [B-5] RFC 7231 준수
        if (W10_acceptsGzip(r) && LittleFS.exists(v_gzPath)) {
            auto* v_resp = r->beginResponse(LittleFS, v_gzPath, v_mime);
            v_resp->addHeader("Content-Encoding", "gzip");
            v_resp->addHeader("Vary", "Accept-Encoding");
            _applyHeaders(v_resp, false);
            r->send(v_resp);
            return;
        }
        if (LittleFS.exists(v_url)) {
            auto* v_resp = r->beginResponse(LittleFS, v_url, v_mime);
            v_resp->addHeader("Vary", "Accept-Encoding");
            _applyHeaders(v_resp, false);
            r->send(v_resp);
            return;
        }
        r->send(404, "text/plain; charset=utf-8", "not found: " + v_url);
    });

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[W10] Gzip static serve registered (%s/*)",
                       W10_Const::PATH_STATIC_HTML);
}

// ------------------------------------------------------
// 메뉴 Web API 구현
// ------------------------------------------------------
void CL_W10_WebAPI::W10_getMenuJson(AsyncWebServerRequest* r) {
    JsonDocument v_doc_out;
    JsonArray    v_array_out = v_doc_out.to<JsonArray>();

    for (const auto& v_entry : s_menu_state.pages_sorted) {
        JsonObject v_item = v_array_out.add<JsonObject>();
        v_item["label"]   = v_entry.label;
        v_item["path"]    = v_entry.path;
        v_item["uri"]     = v_entry.uri;
        v_item["order"]   = v_entry.order;
        v_item["isMain"]  = v_entry.isMain;
        v_item["enable"]  = v_entry.enable;
    }

    sendJson(r, v_doc_out);
}

// ------------------------------------------------------
// 정적 자산 라우팅 등록
// ------------------------------------------------------
void CL_W10_WebAPI::routeStaticAssets() {
    s_menu_state.pages_sorted.clear();
    s_menu_state.main_path = "";

    JsonDocument v_doc;
    uint16_t     v_page_count  = 0;
    uint16_t     v_asset_count = 0;

    // [N-2] 정적 폴더 라우트를 JSON 로드 이전에 등록
    W10_registerGzipServe();

    if (!W10_loadPagesJson(v_doc, v_page_count, v_asset_count)) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[W10] Failed to load pages JSON. Static folder routing is active, menu/routes skipped.");
        return;
    }

    JsonObjectConst j_root = v_doc.as<JsonObjectConst>();
    if (j_root.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Invalid root object after load.");
        return;
    }

    JsonArrayConst v_pages_array    = j_root["pages"].as<JsonArrayConst>();
    JsonArrayConst v_assets_array   = j_root["assets"].as<JsonArrayConst>();
    JsonArrayConst v_redirect_array = j_root["reDirect"].as<JsonArrayConst>();

    if (!v_pages_array.isNull()) {
        for (JsonObjectConst v_page : v_pages_array) {
            ST_W10_PageEntry_t v_entry{};

            v_entry.order  = v_page["order"].as<int>();
            v_entry.uri    = v_page["uri"].as<String>();
            v_entry.path   = v_page["path"].as<String>();
            v_entry.label  = v_page["label"].as<String>();
            v_entry.isMain = v_page["isMain"] | false;

            bool v_enable = true;
            if (!v_page["enable"].isNull()) {
                v_enable = v_page["enable"].as<bool>();
            }
            v_entry.enable = v_enable;

            s_menu_state.pages_sorted.push_back(v_entry);

            if (v_entry.isMain && s_menu_state.main_path.isEmpty()) {
                if (!v_entry.path.isEmpty()) {
                    s_menu_state.main_path = v_entry.path;
                }
            }

            const char* v_uri_key  = v_entry.uri.c_str();
            const char* v_path_key = v_entry.path.c_str();

            if (!v_uri_key || !v_path_key || strlen(v_path_key) == 0) continue;

            const char* v_mime_html = "text/html; charset=utf-8";

            if (strlen(v_uri_key) > 0) {
                W10_registerStaticRoute(v_uri_key, v_path_key, v_mime_html);
            }

            JsonArrayConst v_page_assets = v_page["pageAssets"].as<JsonArrayConst>();
            if (!v_page_assets.isNull()) {
                for (JsonObjectConst v_asset : v_page_assets) {
                    const char* v_a_uri  = v_asset["uri"].as<const char*>();
                    const char* v_a_path = v_asset["path"].as<const char*>();

                    if (!v_a_uri || !v_a_path || strlen(v_a_uri) == 0 || strlen(v_a_path) == 0) continue;

                    const char* v_mime = W10_guessMime(v_a_path);

                    if (strcmp(v_a_uri, v_a_path) != 0) {
                        W10_registerStaticRoute(v_a_uri, v_a_path, v_mime);
                    }
                }
            }
        }

        std::sort(s_menu_state.pages_sorted.begin(),
                  s_menu_state.pages_sorted.end(),
                  [](const ST_W10_PageEntry_t& a, const ST_W10_PageEntry_t& b) { return a.order < b.order; });
    }

    if (!v_assets_array.isNull()) {
        for (JsonObjectConst v_asset : v_assets_array) {
            const char* v_uri_key  = v_asset["uri"].as<const char*>();
            const char* v_path_key = v_asset["path"].as<const char*>();

            if (!v_uri_key || !v_path_key || strlen(v_uri_key) == 0 || strlen(v_path_key) == 0) continue;

            const char* v_mime = W10_guessMime(v_path_key);

            if (strcmp(v_uri_key, v_path_key) != 0) {
                W10_registerStaticRoute(v_uri_key, v_path_key, v_mime);
            }
        }
    }

    bool v_root_redirect_defined = false;
    if (!v_redirect_array.isNull()) {
        for (JsonObjectConst v_redir : v_redirect_array) {
            const char* v_from = v_redir["uriFrom"].as<const char*>();
            const char* v_to   = v_redir["uriTo"].as<const char*>();

            if (!v_from || !v_to) continue;

            if (strcmp(v_from, "/") == 0) v_root_redirect_defined = true;

            auto v_from_sp = A40_ComFunc::cloneStr2SharedStr_safe(v_from);
            auto v_to_sp   = A40_ComFunc::cloneStr2SharedStr_safe(v_to);

            if (!v_from_sp || !v_to_sp) continue;

            s_server->on(v_from_sp.get(), HTTP_GET, [v_to_sp](AsyncWebServerRequest* r) { r->redirect(v_to_sp.get()); });
        }
    }

    // [N-3] root fallback (무한 리다이렉트 방지)
    if (!v_root_redirect_defined) {
        String v_root_path = s_menu_state.main_path;

        s_server->on("/", HTTP_GET, [v_root_path](AsyncWebServerRequest* r) {
            String v_default_html = String(W10_Const::PATH_STATIC_HTML) + W10_Const::PATH_STATIC_INDEX_HTML;

            if (!v_root_path.isEmpty()) {
                v_default_html = v_root_path.c_str();
            }

            if (LittleFS.exists(v_default_html) || LittleFS.exists(v_default_html + ".gz")) {
                r->redirect(v_default_html);
            } else {
                String v_msg = "main page not found: " + v_default_html + "\nCheck cfg_pages JSON and "
                             + String(W10_Const::PATH_STATIC_HTML) + " files.";
                r->send(404, "text/plain; charset=utf-8", v_msg);
            }
        });
    }

    s_server->on(W10_Const::HTTP_API_MENU, HTTP_GET, W10_getMenuJson);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Web routing initialized (Pages: %u, Assets: %u)", v_page_count, v_asset_count);
}
