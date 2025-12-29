/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_WS_051.cpp
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

#include "W10_Web_050.h"

// --------------------------------------------------
// 브로드캐스트 유틸리티
// --------------------------------------------------
void CL_W10_WebAPI::_broadcast(AsyncWebSocket* p_ws, JsonDocument& p_doc, bool p_diffOnly) {
    if (!p_ws || !p_ws->count()) return;

    String v_json;
    serializeJson(p_doc, v_json);

    if (p_diffOnly && v_json.length() <= 5) return;

    // ✅ textAll() 대신 client별 전송 (queue 폭주 방지)
    /*
    getClients()가 사용 불가한 버전이면, 라이브러리 버전에 맞게:
    for (AsyncWebSocketClient* c = p_ws->client(i); ... ) 형태로 교체해야 합니다.
    (현재 ESPAsyncWebServer 버전에 따라 API가 조금씩 다릅니다)

    */
    for (auto* c : p_ws->getClients()) {
        if (!c) continue;

        // canSend() false면 해당 client skip (큐 누적 방지)
        if (!c->canSend()) {
            // 필요 시 관찰 로그(빈도 제한 권장)
            // CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[W10] WS skip (id=%u) canSend=false", c->id());
            continue;
        }

        c->text(v_json);
    }
}

/*
void CL_W10_WebAPI::_broadcast(AsyncWebSocket* p_ws, Jso
nDocument& p_doc, bool p_diffOnly) {
	if (!p_ws || !p_ws->count())
		return;

	String v_json;
	serializeJson(p_doc, v_json);

	if (!p_diffOnly || v_json.length() > 5) {
		p_ws->textAll(v_json);
	}
}
*/

// --------------------------------------------------
// WS cleanup tick (권장)
// --------------------------------------------------
void CL_W10_WebAPI::wsCleanupTick() {
    if (s_wsServerState)   s_wsServerState->cleanupClients();
    if (s_wsServerMetrics) s_wsServerMetrics->cleanupClients();
    if (s_wsServerChart)   s_wsServerChart->cleanupClients();
    if (s_wsServerSummary) s_wsServerSummary->cleanupClients();
    if (s_wsServerLogs)    s_wsServerLogs->cleanupClients();
}

static uint16_t s_wsItvMs[4] = { 800, 1500, 1200, 1500 };

void CL_W10_WebAPI::setWsIntervals(const uint16_t p_itvMs[4]) {
    if (!p_itvMs) return;
    for (uint8_t i = 0; i < 4; i++) {
        // 0 방지(최소 50ms 같은 하한 적용 가능)
        s_wsItvMs[i] = (p_itvMs[i] > 0) ? p_itvMs[i] : s_wsItvMs[i];
    }
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS intervals set: state=%u metrics=%u chart=%u summary=%u",
                       (unsigned)s_wsItvMs[0], (unsigned)s_wsItvMs[1], (unsigned)s_wsItvMs[2], (unsigned)s_wsItvMs[3]);
}


// --------------------------------------------------
// WebSocket 초기화 및 라우팅
// --------------------------------------------------
void CL_W10_WebAPI::routeWebSocket() {
	// 로그 WS
	s_wsServerLogs->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
		if (type == WS_EVT_CONNECT) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /logs connected (id=%u)", client->id());
		}
	});
	s_server->addHandler(s_wsServerLogs);

	// 상태 WS
	s_wsServerState->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
		if (type == WS_EVT_CONNECT) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /state connected (id=%u)", client->id());
			JsonDocument v_doc;
			if (s_control) {
				s_control->toJson(v_doc);
			}
			String v_json;
			serializeJson(v_doc, v_json);
			client->text(v_json);
		}
	});
	s_server->addHandler(s_wsServerState);

	// 차트 WS
	s_wsServerChart->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
		if (type == WS_EVT_CONNECT) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /chart connected (id=%u)", client->id());
		}
	});
	s_server->addHandler(s_wsServerChart);

	// 요약 WS
	s_wsServerSummary->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
		if (type == WS_EVT_CONNECT) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /summary connected (id=%u)", client->id());
			if (s_control) {
				JsonDocument v_doc;
				s_control->toSummaryJson(v_doc);
				String v_json;
				serializeJson(v_doc, v_json);
				client->text(v_json);
			}
		}
	});
	s_server->addHandler(s_wsServerSummary);

	// 메트릭 WS
	s_wsServerMetrics->onEvent([](AsyncWebSocket*, AsyncWebSocketClient* client, AwsEventType type, void*, uint8_t*, size_t) {
		if (type == WS_EVT_CONNECT) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] WS /metrics connected (id=%u)", client->id());
			if (s_control) {
				JsonDocument v_doc;
				s_control->toMetricsJson(v_doc);
				String v_json;
				serializeJson(v_doc, v_json);
				client->text(v_json);
			}
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
