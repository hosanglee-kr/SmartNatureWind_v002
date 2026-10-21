/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Routes_0202.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Routes (Core)
 * ------------------------------------------------------
 * 기능 요약:
 * - 정적 멤버 정의 (s_server, s_control, s_upFile, WebSocket 5종)
 * - 시스템 설정 런타임 반영 (applySystemRuntimeFromConfig)
 * - 라우트 초기화 (begin: 전체 도메인 순차 호출)
 *
 * [E-2.2.1] 파일 분리 (Routes 6분할)
 *  - 유지: 정적 멤버 정의, applySystemRuntimeFromConfig, begin()
 *  - 이관: 27개 route*() + _w10_compareSemVer → 5개 도메인 파일
 *  - 정적 멤버 정의는 이 파일에서만 (다중 정의 링커 오류 방지)
 *  - _w10_compareSemVer는 Network 파일로 이동 (routeFirmwareCheck와 함께 배치)
 * ------------------------------------------------------
 */

#include "W10_Web_0202.h"

// ======================================================
// [E-2.2.1] 정적 멤버 정의 (이 파일에 유일, 다중 정의 금지)
// ======================================================
AsyncWebServer*         CL_W10_WebAPI::s_server  = nullptr;
CL_CT10_ControlManager* CL_W10_WebAPI::s_control = nullptr;
File                    CL_W10_WebAPI::s_upFile;

// ======================================================
// WebSocket 인스턴스 (파일 스코프, 정적 포인터로 연결)
// ======================================================
AsyncWebSocket s_wsLogs(W10_Const::WS_API_LOG);
AsyncWebSocket s_wsState(W10_Const::WS_API_STATE);
AsyncWebSocket s_wsChart(W10_Const::WS_API_CHART);
AsyncWebSocket s_wsMetrics(W10_Const::WS_API_METRICS);
AsyncWebSocket s_wsSummary(W10_Const::WS_API_SUMMARY);

AsyncWebSocket* CL_W10_WebAPI::s_wsServerState   = &s_wsState;
AsyncWebSocket* CL_W10_WebAPI::s_wsServerLogs    = &s_wsLogs;
AsyncWebSocket* CL_W10_WebAPI::s_wsServerChart   = &s_wsChart;
AsyncWebSocket* CL_W10_WebAPI::s_wsServerMetrics = &s_wsMetrics;
AsyncWebSocket* CL_W10_WebAPI::s_wsServerSummary = &s_wsSummary;

// ======================================================
// [F-05] 시스템 설정 런타임 반영 (Logger level, hostname)
//  - W10 라우트 + A00_run pending reload 완료 후 호출
// ======================================================
void CL_W10_WebAPI::applySystemRuntimeFromConfig(const ST_A20_SystemConfig_t& p_sys) {
    // 1) Logger level
    EN_L10_LogLevel_t v_lv = EN_L10_LOG_INFO;
    const char* v_lvStr = p_sys.system.logging.level;

    if (v_lvStr && v_lvStr[0]) {
        if      (strcasecmp(v_lvStr, "NONE")  == 0) v_lv = EN_L10_LOG_NONE;
        else if (strcasecmp(v_lvStr, "ERROR") == 0) v_lv = EN_L10_LOG_ERROR;
        else if (strcasecmp(v_lvStr, "WARN")  == 0) v_lv = EN_L10_LOG_WARN;
        else if (strcasecmp(v_lvStr, "INFO")  == 0) v_lv = EN_L10_LOG_INFO;
        else if (strcasecmp(v_lvStr, "DEBUG") == 0) v_lv = EN_L10_LOG_DEBUG;
    }

    EN_L10_LogLevel_t v_oldLv = CL_D10_Logger::getLevel();
    if (v_oldLv != v_lv) {
        CL_D10_Logger::setLevel(v_lv);
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[W10] Log level changed: %d -> %d",
                           (int)v_oldLv, (int)v_lv);
    }

    // 2) Hostname (WiFi 재연결 시 반영)
    if (p_sys.meta.deviceName[0] != '\0') {
        WiFi.setHostname(p_sys.meta.deviceName);
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[W10] Hostname set: %s (재연결 후 반영)",
                           p_sys.meta.deviceName);
    }
}

// ======================================================
// 라우트 초기화 (전체 도메인 순차 호출)
//  - 분리된 5개 파일의 register 함수들을 호출
// ======================================================
void CL_W10_WebAPI::begin(AsyncWebServer& p_server, CL_CT10_ControlManager& p_control) {
    s_server  = &p_server;
    s_control = &p_control;

    // 1. 시스템 정보 및 상태 (W10_Web_Routes_System_0202.cpp)
    routeVersion();
    routeState();
    routeSystem();
    routeDiag();
    routeScan();
    routeWifiState();
    routeAuthTest();
    routeWifiConfig();
    routeTimeSet();
    routeFirmwareCheck();

    // 2. 설정 및 제어 (W10_Web_Routes_Control_0202.cpp)
    routeMotion();
    routeSimulation();
    routeSimState();
    routeControl();
    routeControlSummary();

    // 3. 설정 관리 (W10_Web_Routes_Config_0202.cpp)
    routeConfigDirtySave();
    routeConfigInit();
    routeReload();

    // 4~6. CRUD (W10_Web_Routes_CRUD_0202.cpp)
    routeWindProfile();
    routeWindProfileID();
    routeSchedules();
    routeSchedulesID();
    routeUserProfiles();
    routeUserProfilesID();
    routeUserProfilesPatch();

    // 7. 모니터링 및 로깅 (System)
    routeMetrics();
    routeLogs();

    // 7-1. AI 프록시 (W10_Web_Gemini_0202.cpp)
    routeGeminiProxy();

    // 8. 피드/Static/Upload/OTA/WS
    routeMotionFeed();      // Control
    routeStaticAssets();    // W10_Web_Static_0202.cpp
    routeUpload();          // W10_Web_Upload_0202.cpp
    routeUpdate();          // W10_Web_Upload_0202.cpp
    routeWebSocket();       // W10_Web_WS_0202.cpp

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WebAPI initialized (v0202)");
}
