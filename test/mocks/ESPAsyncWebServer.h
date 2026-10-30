#pragma once
class AsyncWebServer {};
class AsyncWebSocket {};
class AsyncWebSocketClient {};
class AsyncWebServerRequest {};
enum AwsEventType {
    WS_EVT_CONNECT,
    WS_EVT_DISCONNECT,
    WS_EVT_PONG,
    WS_EVT_ERROR,
    WS_EVT_DATA
};
