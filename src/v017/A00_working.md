while (v_client.connected() || v_client.available()) {
    if (millis() - v_startMs > (unsigned long)G_W10_GEMINI_TIMEOUT) { ... }

    if (!v_client.available()) continue;

    // [P1-2 강화] 라인 단위 읽기 (하드 캡)
    char v_lineBuf[512];
    size_t v_n = v_client.readBytesUntil('\n', v_lineBuf, sizeof(v_lineBuf) - 1);
    v_lineBuf[v_n] = '\0';

    if (!v_headersDone) {
        // 헤더 파싱 (v_lineBuf 사용)
        ...
    } else {
        // 응답 본문 처리 (v_avail 로직 동일)
        ...
    }
}