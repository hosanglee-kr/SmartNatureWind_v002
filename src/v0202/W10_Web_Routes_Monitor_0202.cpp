#include "W10_Web_0202.h"
#include "CT10_Monitor_0202.h"

void CL_W10_WebAPI::routeMonitor() {
    // 1. /api/v001/monitor (기본 실시간 쿼리)
    s_server->on(W10_Const::HTTP_API_MONITOR, HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        if (!CL_MON_Monitor::isEnabled()) {
            p_request->send(503, "application/json", "{\"error\":\"monitor not enabled\"}");
            return;
        }

        const char* type  = p_request->hasParam("type") ? p_request->getParam("type")->value().c_str() : "wind";
        const char* range = p_request->hasParam("range") ? p_request->getParam("range")->value().c_str() : "5m";

        JsonDocument v_doc;
        if (strcmp(type, "wind") == 0)
            CL_MON_Monitor::queryWind(range, v_doc);
        else if (strcmp(type, "state") == 0)
            CL_MON_Monitor::queryState(range, v_doc);
        else if (strcmp(type, "config") == 0)
            CL_MON_Monitor::queryConfig(range, v_doc);
        else if (strcmp(type, "sensor") == 0)
            CL_MON_Monitor::querySensor(range, v_doc);
        else if (strcmp(type, "system") == 0)
            CL_MON_Monitor::querySystem(range, v_doc);
        else {
            p_request->send(400, "application/json", "{\"error\":\"invalid type\"}");
            return;
        }

        sendJson(p_request, v_doc);
    });

    // 2. [MON-E] GET /api/v001/monitor/events?days=7
    s_server->on((String(W10_Const::HTTP_API_MONITOR) + "/events").c_str(), HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        uint8_t days = 7;
        if (p_request->hasParam("days")) days = (uint8_t)p_request->getParam("days")->value().toInt();
        JsonDocument v_doc;
        CL_MON_Monitor::queryPastEvents(days, v_doc);
        sendJson(p_request, v_doc);
    });

    // 3. [MON-F] GET /api/v001/monitor/export?type=wind&range=30m&format=csv[&all=1]
    s_server->on((String(W10_Const::HTTP_API_MONITOR) + "/export").c_str(), HTTP_GET, [](AsyncWebServerRequest* p_request) {
        if (!checkApiKey(p_request)) {
            p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
            return;
        }
        const char* type  = p_request->hasParam("type") ? p_request->getParam("type")->value().c_str() : "wind";
        const char* range = p_request->hasParam("range") ? p_request->getParam("range")->value().c_str() : "30m";
        bool        all   = p_request->hasParam("all") && p_request->getParam("all")->value() == "1";

        String csv;
        CL_MON_Monitor::exportCsv(type, range, all, csv);

        auto*  resp     = p_request->beginResponse(200, "text/csv; charset=utf-8", csv);
        String filename = String(type) + "_" + (all ? "all" : range) + ".csv";
        resp->addHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        p_request->send(resp);
    });
}
