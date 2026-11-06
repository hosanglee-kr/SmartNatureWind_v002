/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_WS_070.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API - Integrated WebSocket & Broadcast (v029)
 * ------------------------------------------------------
 * 기능 요약:
 * - WebSocket 엔드포인트(/logs, /state, /chart, /metrics) 설정 및 이벤트 핸들링 구현.
 * - WebSocket 연결 시 초기 상태 및 메트릭스 데이터 전송 기능 구현.
 * - WebSocket을 통한 상태, 메트릭, 차트 데이터 브로드캐스팅 유틸리티(_broadcast) 구현.
 * - 로거 모듈(CL_D10_Logger)과 WebSocket 연결.
 * ------------------------------------------------------
 * [구현 규칙]
 * - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 * - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 * - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 * - JsonDocument 단일 타입만 사용
 * - createNestedArray/Object/containsKey 사용 금지
 * - memset + strlcpy 기반 안전 초기화
 * - 주석/필드명은 JSON 구조와 동일하게 유지
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 * - 전역 상수,매크로      : G_모듈약어_ 접두사
 * - 전역 변수             : g_모듈약어_ 접두사
 * - 전역 함수             : 모듈약어_ 접두사
 * - type                  : T_모듈약어_ 접두사
 * - typedef               : _t  접미사
 * - enum 상수             : EN_모듈약어_ 접두사
 * - 구조체                : ST_모듈약어_ 접두사
 * - 클래스명              : CL_모듈약어_ 클래스명
 * - 클래스 private 멤버   : _ 접두사
 * - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 * - 클래스 정적 멤버      : s_ 접두사
 * ------------------------------------------------------
 */

#include "W10_Web_070.h"

// --------------------------------------------------
// [WS 인증] 핸드셰이크 단계 쿼리 파라미터 apiKey 검사
//  - ESPAsyncWebServer 3.12.1: AsyncWebSocketClient::request() 부재
//  - handleHandshake()가 유일하게 AsyncWebServerRequest* 접근 가능
//  - 반환 false → 연결 거부 (서버가 401 상당 응답 후 종료)
//  - API Key 미설정 시 통과 (개발/개방 모드)
// --------------------------------------------------
static bool _wsHandshakeAuth(AsyncWebServerRequest* p_request) {
    if (!p_request) return false;

    // 1) API Key 미설정 → 개방 모드
    const char* v_key = nullptr;
    if (g_A20_config_root.system && g_A20_config_root.system->security.apiKey[0] != '\0') {
        v_key = g_A20_config_root.system->security.apiKey;
    }
    if (!v_key || v_key[0] == '\0') return true;

    // 2) 쿼리 파라미터 apiKey
    if (!p_request->hasParam("apiKey")) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[W10][WS] handshake reject: missing apiKey (uri=%s)",
                           p_request->url().c_str());
        return false;
    }

    const String& v_val = p_request->getParam("apiKey")->value();
    if (v_val != v_key) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[W10][WS] handshake reject: invalid apiKey (uri=%s)",
                           p_request->url().c_str());
        return false;
    }

    return true;
}


// --------------------------------------------------
// 브로드캐스트 유틸리티
// --------------------------------------------------
void CL_W10_WebAPI::_broadcast(AsyncWebSocket* p_ws, JsonDocument& p_doc, bool p_diffOnly) {
    if (!p_ws) return;

    uint32_t v_cnt = p_ws->count();
    if (v_cnt == 0) return;

    String v_json;
    serializeJson(p_doc, v_json);

    if (p_diffOnly && v_json.length() <= 5) return;

    //  textAll() 대신 client별 전송 (queue 폭주 방지)
    // 포인터를 직접 다루는 가장 안전한 방법
    for (uint32_t i = 0; i < v_cnt; i++) {
        AsyncWebSocketClient* c = p_ws->client(i);
        if (!c) continue;

        if (c->status() == WS_CONNECTED) {
            if (c->canSend()) {
                c->text(v_json);
            }
        }
    }
}

// --------------------------------------------------
// WS cleanup tick (권장)
// --------------------------------------------------
void CL_W10_WebAPI::wsCleanupTick() {
    if (s_wsServerState) s_wsServerState->cleanupClients();
    if (s_wsServerMetrics) s_wsServerMetrics->cleanupClients();
    if (s_wsServerChart) s_wsServerChart->cleanupClients();
    if (s_wsServerSummary) s_wsServerSummary->cleanupClients();
    if (s_wsServerLogs) s_wsServerLogs->cleanupClients();
}

// --------------------------------------------------
// WebSocket 초기화 및 라우팅
// --------------------------------------------------

void CL_W10_WebAPI::routeWebSocket() {
    // 운영급 방어: 서버/핸들러 미초기화 시 크래시 방지
    if (!s_server) return;
    if (!s_wsServerLogs || !s_wsServerState || !s_wsServerChart || !s_wsServerSummary || !s_wsServerMetrics) return;

    // [WS 인증] 핸드셰이크 단계에서 쿼리 apiKey 검증
    //  - ESPAsyncWebServer 3.12.1: request() 부재 → handleHandshake 유일
    //  - 각 WS 인스턴스에 공통 정책 적용 (개별 onEvent 수정 불필요)
    // ─────────────────────────────────────────────
    s_wsServerLogs   ->handleHandshake(_wsHandshakeAuth);
    s_wsServerState  ->handleHandshake(_wsHandshakeAuth);
    s_wsServerChart  ->handleHandshake(_wsHandshakeAuth);
    s_wsServerSummary->handleHandshake(_wsHandshakeAuth);
    s_wsServerMetrics->handleHandshake(_wsHandshakeAuth);


    // 로그 WS
    s_wsServerLogs->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
        if (!client) return;
        if (type == WS_EVT_CONNECT) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /logs connected (id=%u)", client->id());
        }
    });
    s_server->addHandler(s_wsServerLogs);

    // 상태 WS
    s_wsServerState->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
        if (!client) return;
        if (type == WS_EVT_CONNECT) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /state connected (id=%u)", client->id());
            
            String v_json;
            if (s_control) {
                JsonDocument v_doc;
                s_control->exportStateJson_v02(v_doc);
                serializeJson(v_doc, v_json);
            } else {
                v_json = "{}";
            }
            client->text(v_json);
        }
    });
    s_server->addHandler(s_wsServerState);

    // 차트 WS
    s_wsServerChart->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
        if (!client) return;
        if (type == WS_EVT_CONNECT) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /chart connected (id=%u)", client->id());
        }
    });
    s_server->addHandler(s_wsServerChart);

    // 요약 WS
    s_wsServerSummary->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
        if (!client) return;
        if (type == WS_EVT_CONNECT) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /summary connected (id=%u)", client->id());

            String v_json;

            if (s_control) {
                JsonDocument v_doc;
                s_control->exportSummaryJson(v_doc);
                serializeJson(v_doc, v_json);
            } else { v_json = "{}"; }

            client->text(v_json);
        }
    });
    s_server->addHandler(s_wsServerSummary);

    // 메트릭 WS
    s_wsServerMetrics->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
        if (!client) return;
        if (type == WS_EVT_CONNECT) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /metrics connected (id=%u)", client->id());

            String v_json;

            if (s_control) {
                JsonDocument v_doc;
                s_control->exportMetricsJson(v_doc);
                serializeJson(v_doc, v_json);
            } else { v_json = "{}"; }

            client->text(v_json);
        }
    });
    s_server->addHandler(s_wsServerMetrics);

    // Logger에 WebSocket 연결
    CL_D10_Logger::attachWebSocket(s_wsServerLogs);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WebSocket routes initialized (v029)");
}

// --------------------------------------------------
// 상태 브로드캐스트
// --------------------------------------------------
void CL_W10_WebAPI::broadcastState(JsonDocument& p_doc, bool p_diffOnly) {
    _broadcast(s_wsServerState, p_doc, p_diffOnly);
}

// --------------------------------------------------
// 메트릭 브로드캐스트
// --------------------------------------------------
void CL_W10_WebAPI::broadcastMetrics(JsonDocument& p_doc, bool p_diffOnly) {
    _broadcast(s_wsServerMetrics, p_doc, p_diffOnly);
}

// --------------------------------------------------
// 차트 브로드캐스트
// --------------------------------------------------
void CL_W10_WebAPI::broadcastChart(JsonDocument& p_doc, bool p_diffOnly) {
    _broadcast(s_wsServerChart, p_doc, p_diffOnly);
}

// --------------------------------------------------
// 요약 브로드캐스트
// --------------------------------------------------
void CL_W10_WebAPI::broadcastSummary(JsonDocument& p_doc, bool p_diffOnly) {
    _broadcast(s_wsServerSummary, p_doc, p_diffOnly);
}
