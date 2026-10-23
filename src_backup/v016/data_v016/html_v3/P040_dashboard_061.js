/*
 * ------------------------------------------------------
 * 소스명 : P040_dashboard_061.js
 * 모듈명 : Smart Nature Wind Dashboard UI Controller
 * ------------------------------------------------------
 * 기능 요약:
 * - /ws/state WebSocket을 통한 실시간 풍속/PWM/상태 업데이트
 * - /ws/log WebSocket을 통한 실시간 로그 메시지 출력
 * - /api/control/profile/select 및 /api/control/profile/stop 으로 시뮬레이션 제어
 * - /api/state를 이용한 초기 상태 로드
 * - P000_common_060.js 의 showToast / 메뉴 로직과 공존
 * ------------------------------------------------------
 */


/* P040_dashboard_060.js – 공통 유틸리티 적용 최종본 */
(() => {
  "use strict";

  // ──────────────────────────────────────────────
  // DOM 요소 (공통 $ 함수 사용)
  // ──────────────────────────────────────────────
  const elWindSpeed   = $("#currentWindSpeed");
  const elPWMDuty     = $("#currentPWMDuty");
  const elSimState    = $("#simState");
  const elNetworkInfo = $("#networkInfo");
  const elLogConsole  = $("#logConsole");

  // ──────────────────────────────────────────────
  // 상태 반영 함수
  // ──────────────────────────────────────────────
  function applyStateJson(data) {
    if (!data) return;
    const sim  = data.sim || data.motion || data.state || {};
    const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : data.wifi || {};
    const simActive = sim.active !== undefined ? sim.active : sim.simActive;
    const wind = sim.wind !== undefined ? sim.wind : sim.wind_ms;
    const pwm  = sim.pwm  !== undefined ? sim.pwm  : sim.pwm_val;
    text(elWindSpeed, Number(wind || 0).toFixed(2));
    text(elPWMDuty, String(Math.round(Number(pwm || 0))));
    let stateText = "STOPPED", stateClass = "stopped";
    if (simActive === true || simActive === 1 || simActive === "on" || simActive === "ACTIVE") {
      stateText = "RUNNING"; stateClass = "running";
    }
    if (elSimState) {
      elSimState.className = `large-value status-text ${stateClass}`;
      elSimState.textContent = stateText;
    }
    const modeName = wifi.mode_name || wifi.mode || "-";
    const ip = wifi.ip || wifi.ip_address || "-";
    text(elNetworkInfo, `${modeName} | ${ip}`);
  }

  // ──────────────────────────────────────────────
  // 로그 레벨 매핑 (숫자 ↔ 문자열)
  // ──────────────────────────────────────────────
  function logLevelToString(lv) {
    if (typeof lv === "string") {
      const u = lv.toUpperCase();
      if (u === "ERROR" || u === "ERR") return { class: "log-error", text: "ERROR" };
      if (u === "WARN" || u === "WARNING") return { class: "log-warn", text: "WARN" };
      return { class: "log-info", text: "INFO" };
    }
    if (lv === 1) return { class: "log-error", text: "ERROR" };
    if (lv === 2) return { class: "log-warn",  text: "WARN" };
    return { class: "log-info", text: "INFO" };
  }

  function appendLog(record) {
    if (!elLogConsole || !record) return;
    const { ts, lv, msg } = record;
    if (!msg) return;
    const el = document.createElement("div");
    el.className = "log-message";
    const { class: levelClass, text: levelText } = logLevelToString(lv);
    const timeStr = new Date(ts || Date.now()).toLocaleTimeString();
    el.innerHTML = `<span class="${levelClass}">[${timeStr}] [${levelText}]</span> ${msg}`;
    elLogConsole.appendChild(el);
    while (elLogConsole.children.length > 50) elLogConsole.removeChild(elLogConsole.firstChild);
    elLogConsole.scrollTop = elLogConsole.scrollHeight;
  }

  // ──────────────────────────────────────────────
  // 초기 상태 로드 (공통 apiFetch 사용, silent)
  // ──────────────────────────────────────────────
  async function refreshInitialState() {
    const state = await apiFetch(SNW_API.API_HTTP_STATE, { method: "GET" }, true);
    if (state) {
      applyStateJson(state);
      appendLog({ ts: Date.now(), lv: 3, msg: "초기 상태 로드 완료." });
    } else {
      if (!getApiKey()) notify("API Key가 비어 있습니다. System 페이지에서 설정하세요.", "warn");
    }
  }

  // ──────────────────────────────────────────────
  // WebSocket (공통 buildWsUrl 사용)
  // ──────────────────────────────────────────────
  function initWsState() {
    const url = buildWsUrl(SNW_API.WS_API_STATE);
    let ws;
    try { ws = new WebSocket(url); } catch (e) {
      appendLog({ ts: Date.now(), lv: 1, msg: `WS State 연결 실패: ${e.message}` });
      return;
    }
    ws.onopen = () => appendLog({ ts: Date.now(), lv: 3, msg: "WS State 연결 성공." });
    ws.onmessage = (e) => {
      try { applyStateJson(JSON.parse(e.data)); } catch (err) {
        appendLog({ ts: Date.now(), lv: 1, msg: `WS State 파싱 오류: ${err.message}` });
      }
    };
    ws.onclose = () => {
      appendLog({ ts: Date.now(), lv: 2, msg: "WS State 연결 끊김. 5초 후 재연결." });
      setTimeout(initWsState, 5000);
    };
    ws.onerror = (e) => appendLog({ ts: Date.now(), lv: 1, msg: `WS State 오류: ${e.message || e}` });
  }

  function initWsLog() {
    const url = buildWsUrl(SNW_API.WS_API_LOG);
    let ws;
    try { ws = new WebSocket(url); } catch (e) {
      appendLog({ ts: Date.now(), lv: 1, msg: `WS Log 연결 실패: ${e.message}` });
      return;
    }
    ws.onopen = () => appendLog({ ts: Date.now(), lv: 3, msg: "WS Log 연결 성공." });
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        appendLog({ ts: data.ts || data.t, lv: data.lv ?? data.level, msg: data.msg || data.message });
      } catch {
        appendLog({ ts: Date.now(), lv: 3, msg: e.data });
      }
    };
    ws.onclose = () => {
      appendLog({ ts: Date.now(), lv: 2, msg: "WS Log 연결 끊김. 5초 후 재연결." });
      setTimeout(initWsLog, 5000);
    };
    ws.onerror = (e) => appendLog({ ts: Date.now(), lv: 1, msg: `WS Log 오류: ${e.message || e}` });
  }

  // ──────────────────────────────────────────────
  // 버튼 이벤트 (공통 apiFetch 사용)
  // ──────────────────────────────────────────────
  function bindEvents() {
    $("#btnStartSim")?.addEventListener("click", async () => {
      await apiFetch(SNW_API.API_HTTP_CTL_PROF_SEL, {
        method: "POST",
        body: JSON.stringify({ id: 1 })
      }, false, "시뮬레이션 시작");
    });

    $("#btnStopSim")?.addEventListener("click", async () => {
      await apiFetch(SNW_API.API_HTTP_CTL_PROF_STOP, {
        method: "POST",
        body: JSON.stringify({})
      }, false, "시뮬레이션 중지");
    });

    $("#btnDiag")?.addEventListener("click", async () => {
      const diag = await apiFetch(SNW_API.API_HTTP_DIAG, { method: "GET" }, true);
      if (diag) {
        appendLog({
          ts: Date.now(),
          lv: 3,
          msg: `[Diag] Heap: ${diag.heap} bytes, FS: ${diag.fs_used}/${diag.fs_total}`
        });
      }
    });

    $("#btnClearLog")?.addEventListener("click", () => {
      if (elLogConsole) elLogConsole.innerHTML = "";
      appendLog({ ts: Date.now(), lv: 3, msg: "로그 콘솔이 지워졌습니다." });
    });
  }

  // ──────────────────────────────────────────────
  // 초기화
  // ──────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    refreshInitialState();
    initWsState();
    initWsLog();
  });
})();