/*
 * ------------------------------------------------------
 * 소스명 : P010_main_wifi_071.js
 * 모듈명 : Main UI - Wi-Fi / PWM
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core;
const Wf = SNW.P010.wifi = {};

// ============================================================
// 1) 상태 조회 (폴링)
// ============================================================
Wf.loadWifiStateOnce = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_WIFI_STATE, "", true);
    if (!data) return;
    const wifi = (data.wifi && data.wifi.state) ? data.wifi.state : {};
    if (C.el.wifiMode()) C.el.wifiMode().textContent = (wifi.mode_name || wifi.mode || "-").toString();
    if (C.el.curSsid())  C.el.curSsid().textContent  = wifi.ssid || "-";
    if (C.el.ip())       C.el.ip().textContent       = wifi.ip || "-";
};

// ============================================================
// 2) 스캔
// ============================================================
Wf.scanWifi = async () => {
    const data = await SNW.api.get(SNW_API.API_HTTP_WIFI_SCAN, "", true);
    const list = (data && data.wifi && data.wifi.scan) ? data.wifi.scan : data || [];
    Wf.renderScanList(list);
    SNW.toast("Wi-Fi 스캔 완료", "ok");
};

Wf.renderScanList = (networks) => {
    const sel = C.el.scanList();
    if (!sel) return;
    sel.innerHTML = "";
    if (!networks || networks.length === 0) {
        const opt = document.createElement("option");
        opt.value = ""; opt.textContent = "검색된 네트워크가 없습니다.";
        sel.appendChild(opt);
        return;
    }
    networks.forEach((ap) => {
        const opt = document.createElement("option");
        opt.value = ap.ssid || "";
        const rssi = ap.rssi != null ? ` (RSSI ${ap.rssi})` : "";
        opt.textContent = (ap.ssid || "") + rssi;
        sel.appendChild(opt);
    });
};

// ============================================================
// 3) STA 목록 렌더링 / 추가
// ============================================================
Wf.renderStaList = () => {
    const container = C.el.staList();
    if (!container) return;
    container.innerHTML = "";

    const list = C.state.staList;
    if (!list || list.length === 0) {
        const div = document.createElement("div");
        div.className = "muted";
        div.textContent = "등록된 STA 네트워크가 없습니다.";
        container.appendChild(div);
        return;
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["SSID", "Password", "액션"].forEach((txt) => {
        const th = document.createElement("th");
        th.textContent = txt;
        trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    list.forEach((item, idx) => {
        const tr = document.createElement("tr");

        const tdSsid = document.createElement("td");
        tdSsid.textContent = item.ssid || "";
        tr.appendChild(tdSsid);

        const tdPass = document.createElement("td");
        tdPass.textContent = item.pass ? "********" : "";
        tr.appendChild(tdPass);

        const tdAct = document.createElement("td");
        tdAct.style.textAlign = "right";
        const btnDel = document.createElement("button");
        btnDel.className = "btn btn-small err";
        btnDel.textContent = "삭제";
        btnDel.addEventListener("click", () => {
            C.state.staList.splice(idx, 1);
            Wf.renderStaList();
            C.markDirty();
        });
        tdAct.appendChild(btnDel);
        tr.appendChild(tdAct);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
};

Wf.addStaFromScan = () => {
    const sel = C.el.scanList();
    const passInput = C.el.scanPass();
    if (!sel) return;
    const ssid = sel.value || "";
    if (!ssid) { SNW.toast("추가할 SSID를 선택하세요.", "warn"); return; }
    const pass = passInput ? passInput.value : "";
    if (C.state.staList.some((s) => s.ssid === ssid)) {
        SNW.toast("이미 등록된 SSID입니다.", "warn");
        return;
    }
    C.state.staList.push({ ssid, pass });
    Wf.renderStaList();
    C.markDirty();
    if (passInput) passInput.value = "";
};

// ============================================================
// 4) 저장
// ============================================================
Wf.saveWifiApPatch = async () => {
    const body = {
        wifi: {
            wifiMode: Number(C.el.wifiModeSel().value || 0),
            ap: { ssid: C.el.apSsid().value || "", pass: C.el.apPass().value || "" },
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_WIFI_CONFIG, body, "Wi-Fi AP 설정");
    C.markDirty();
};

Wf.saveWifiStaPatch = async () => {
    const body = {
        wifi: {
            sta: C.state.staList.map((item) => ({ ssid: item.ssid, pass: item.pass || "" })),
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_WIFI_CONFIG, body, "Wi-Fi STA 목록");
    C.markDirty();
};

Wf.savePwmPatch = async () => {
    const body = {
        hw: {
            fanPwm: {
                pin:     Number(C.el.pwmPin().value || 0),
                channel: Number(C.el.pwmChannel().value || 0),
                freq:    Number(C.el.pwmFreq().value || 0),
                res:     Number(C.el.pwmRes().value || 0),
            },
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_SYSTEM, body, "PWM 하드웨어");
    C.markDirty();
};

})();
