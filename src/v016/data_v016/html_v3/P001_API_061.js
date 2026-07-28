
/**
 * P001_API_061.js
 * Smart Nature Wind - REST API Constants (전역 객체 버전)
 * 백엔드 W10_Web_Const_060.h와 동기화됨
 * 사용: SNW_API.API_HTTP_STATE 등으로 접근
 */
window.SNW_API = (() => {
 const BASE = "/api/v001";
 const WS = "/ws";
 
 return {
  // 기본 prefix
  API_HTTP_BASE: BASE,
  API_WS_BASE: WS,
  
  // 시스템 정보 및 상태
  get API_HTTP_VERSION() { return `${BASE}/version`; },
  get API_HTTP_STATE() { return `${BASE}/state`; },
  get API_HTTP_SYSTEM() { return `${BASE}/system`; },
  get API_HTTP_WIFI_SCAN() { return `${BASE}/wifi/scan`; },
  get API_HTTP_WIFI_CONFIG() { return `${BASE}/wifi/config`; },
  get API_HTTP_DIAG() { return `${BASE}/diag`; },
  get API_HTTP_AUTH_TEST() { return `${BASE}/auth/test`; },
  get API_HTTP_TIME_SET() { return `${BASE}/system/time/set`; },
  get API_HTTP_FW_CHECK() { return `${BASE}/system/firmware/check`; },
  
  // 설정 및 실시간 제어
  get API_HTTP_MOTION() { return `${BASE}/motion`; },
  get API_HTTP_SIMULATION() { return `${BASE}/simulation`; },
  get API_HTTP_SIM_STATE() { return `${BASE}/sim/state`; },
  get API_HTTP_CONTROL_SUMMARY() { return `${BASE}/control/summary`; },
  
  // 설정 관리
  get API_HTTP_CONFIG() { return `${BASE}/config`; },
  get API_HTTP_CONFIG_SAVE() { return `${BASE}/config/save`; },
  get API_HTTP_CONFIG_DIRTY() { return `${BASE}/config/dirty`; },
  get API_HTTP_CONFIG_INIT() { return `${BASE}/config/init`; },
  get API_HTTP_RELOAD() { return `${BASE}/reload`; },
  
  // CRUD
  get API_HTTP_WIND_PROFILE() { return `${BASE}/windProfile`; },
  get API_HTTP_SCHEDULES() { return `${BASE}/schedules`; },
  get API_HTTP_USER_PROFILES() { return `${BASE}/user_profiles`; },
  get API_HTTP_USER_PROFILES_PATCH() { return `${BASE}/user_profiles/patch`; },
  
  // 하드웨어 직접 제어
  get API_HTTP_CTL_REBOOT() { return `${BASE}/control/reboot`; },
  get API_HTTP_CTL_FACTORY() { return `${BASE}/control/factoryReset`; },
  get API_HTTP_CTL_PROF_SEL() { return `${BASE}/control/profile/select`; },
  get API_HTTP_CTL_PROF_STOP() { return `${BASE}/control/profile/stop`; },
  get API_HTTP_CTL_OVR_FIXED() { return `${BASE}/control/override/fixed`; },
  get API_HTTP_CTL_OVR_PRESET() { return `${BASE}/control/override/preset`; },
  get API_HTTP_CTL_OVR_CLEAR() { return `${BASE}/control/override/clear`; },
  
  // 데이터 피드 및 메트릭
  get API_HTTP_FEED_PIR() { return `${BASE}/motion/pir/feed`; },
  get API_HTTP_FEED_BLE() { return `${BASE}/motion/ble/feed`; },
  get API_HTTP_METRICS() { return `${BASE}/metrics`; },
  get API_HTTP_LOGS() { return `${BASE}/logs`; },
  
  // 파일 및 업데이트
  get API_HTTP_FILE_UPLOAD() { return `${BASE}/fileUpload`; },
  get API_HTTP_FW_UPDATE() { return `${BASE}/fwUpdate`; },
  
  // 웹 메뉴
  get API_HTTP_MENU() { return `${BASE}/menu`; },
  
  // WebSocket 엔드포인트
  get WS_API_LOG() { return `${WS}/log`; },
  get WS_API_STATE() { return `${WS}/state`; },
  get WS_API_CHART() { return `${WS}/chart`; },
  get WS_API_METRICS() { return `${WS}/metrics`; },
  get WS_API_SUMMARY() { return `${WS}/summary`; }
 };
})();