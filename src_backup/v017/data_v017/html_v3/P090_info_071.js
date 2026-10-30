/*
 * ------------------------------------------------------
 * 소스명 : P090_info_071.js
 * 모듈명 : Smart Nature Wind Help & Info Controller (v071)
 * ------------------------------------------------------
 * 기능 요약:
 * - /api/v001/version 호출하여 펌웨어 / 모듈 버전 표시
 * - 공통 함수(apiFetch 등) 사용
 * - API Key: localStorage["snw_api_key"] (공통)
 * ------------------------------------------------------
 */

(() => {
    "use strict";
    
    const elFwVer = () => document.getElementById("fwVersionInfo");
    const elCtlVer = () => document.getElementById("ctlVersionInfo");
    const elCfgVer = () => document.getElementById("cfgVersionInfo");
    
    /**
     * /api/v001/version → 펌웨어 / 모듈 버전 표시
     */
    async function loadVersionInfo() {
        const data = await apiFetch(SNW_API.API_HTTP_VERSION, { method: "GET" }, true);
        
        if (!data || typeof data !== "object") {
            if (elFwVer()) elFwVer().textContent = "연결 불가";
            if (elCtlVer()) elCtlVer().textContent = "연결 불가";
            if (elCfgVer()) elCfgVer().textContent = "연결 불가";
            return;
        }
        
        if (elFwVer()) elFwVer().textContent = data.fw || "N/A";
        if (elCtlVer()) elCtlVer().textContent = data.control || "N/A";
        if (elCfgVer()) elCfgVer().textContent = data.config || "N/A";
    }
    
    document.addEventListener("DOMContentLoaded", () => {
        loadVersionInfo();
    });
})();
