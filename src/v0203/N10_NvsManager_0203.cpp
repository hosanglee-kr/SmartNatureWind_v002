/*
 * ------------------------------------------------------
 * 소스명 : N10_NvsManager_0203.cpp
 * 모듈약어 : N10
 * 모듈명 : Smart Nature Wind NVS Runtime Manager (v0203)
 * ------------------------------------------------------
 * [Batch B-5] NVS 키 리터럴 22곳 → G_N10_KEY_* 상수 교체
 * ------------------------------------------------------
 */

#include "N10_NvsManager_0203.h"
#include "A40_Com_Utils_0203.h"
#include <nvs.h>
#include <nvs_flash.h>

// ------------------------------------------------------
// 정적 멤버 정의
// ------------------------------------------------------
Preferences			  CL_N10_NvsManager::s_prefs;
bool				  CL_N10_NvsManager::s_initialized = false;
ST_N10_RuntimeState_t CL_N10_NvsManager::s_state;
ST_N10_AIDailyUsage_t CL_N10_NvsManager::s_aiUsage;
ST_N10_DirtyFlags_t	  CL_N10_NvsManager::s_dirty	  = { false };
uint32_t			  CL_N10_NvsManager::s_lastSaveMs = 0;

SemaphoreHandle_t     CL_N10_NvsManager::s_mutex = nullptr;

// ==================================================
// 초기화 / 종료
// ==================================================
bool CL_N10_NvsManager::begin() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[N10] %s: Mutex busy", __func__);
        return false;
    }

	if (s_initialized)
		return true;

	if (!s_prefs.begin(G_N10_NS_RUNTIME, false)) {
		s_initialized = false;
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[N10] NVS begin failed (ns=%s)", G_N10_NS_RUNTIME);
		return false;
	}

	memset(&s_state, 0, sizeof(s_state));
	memset(&s_aiUsage, 0, sizeof(s_aiUsage));
	memset(&s_dirty, 0, sizeof(s_dirty));

	s_state.lastScheduleNo	  = -1;
	s_state.lastUserProfileNo = -1;

	loadRuntimeFromNvs();

	s_lastSaveMs  = millis();
	s_initialized = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[N10] Runtime Manager initialized");
	return true;
}

void CL_N10_NvsManager::end() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	flush(true);
	s_prefs.end();
	s_initialized = false;
}

void CL_N10_NvsManager::clearAll() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	s_prefs.begin(G_N10_NS_RUNTIME, false);
	s_prefs.clear();
	s_prefs.end();

	CL_D10_Logger::log(EN_L10_LOG_WARN, "[N10] NVS cleared (factory reset)");
}

// ==================================================
// Dirty 플래그 관리
// ==================================================
void CL_N10_NvsManager::markDirty(const char* p_key, bool p_flag) {
	if (!p_key || !p_key[0]) return;

	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (strcasecmp(p_key, "runtime") == 0)
		s_dirty.runtime = p_flag;
}

void CL_N10_NvsManager::flushIfNeeded() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) return;

	uint32_t v_now = millis();
	if (v_now - s_lastSaveMs < G_N10_SAVE_INTERVAL_MS) return;

	bool v_saved = false;

	if (s_dirty.runtime) {
		flush(false);
		v_saved = true;
	}

	if (v_saved) {
		s_lastSaveMs = v_now;
		CL_D10_Logger::log(EN_L10_LOG_INFO, "[N10] Dirty flushed ");
	}
}

// ==================================================
// Getter / JSON Export
// ==================================================
ST_N10_RuntimeState_t CL_N10_NvsManager::getState() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        ST_N10_RuntimeState_t v_empty{};
        v_empty.lastScheduleNo    = -1;
        v_empty.lastUserProfileNo = -1;
        return v_empty;
    }
    return s_state;
}

void CL_N10_NvsManager::toJson(JsonDocument& p_doc) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	JsonObject o		   = p_doc["runtime"].to<JsonObject>();
	o["runMode"]		   = s_state.runMode;
	o["runSource"]		   = s_state.runSource;
	o["lastScheduleNo"]	   = s_state.lastScheduleNo;
	o["lastUserProfileNo"] = s_state.lastUserProfileNo;

	JsonObject ov		   = o["override"].to<JsonObject>();
	ov["enabled"]		   = s_state.overrideEnabled;
	ov["mode"]			   = s_state.overrideMode;
	ov["fixedPercent"]	   = s_state.overrideFixedPercent;
	ov["presetCode"]	   = s_state.overridePresetCode;
	ov["styleCode"]		   = s_state.overrideStyleCode;
}

// ==================================================
// 주기 Flush (loop용)
// ==================================================
void CL_N10_NvsManager::tick() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) return;
	if (!s_dirty.runtime) return;

	uint32_t v_now = millis();
	if (v_now - s_lastSaveMs < G_N10_SAVE_INTERVAL_MS) return;

	flush(false);
}

// ==================================================
// Setter API
// ==================================================
void CL_N10_NvsManager::setRunMode(uint8_t p_mode, uint8_t p_source) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	if (s_state.runMode == p_mode && s_state.runSource == p_source) return;
	s_state.runMode	  = p_mode;
	s_state.runSource = p_source;
	s_dirty.runtime	  = true;
}

void CL_N10_NvsManager::setLastSchedule(int16_t p_schNo) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	if (s_state.lastScheduleNo == p_schNo) return;
	s_state.lastScheduleNo = p_schNo;
	s_dirty.runtime		   = true;
}

void CL_N10_NvsManager::setLastUserProfile(int16_t p_profileNo) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	if (s_state.lastUserProfileNo == p_profileNo) return;
	s_state.lastUserProfileNo = p_profileNo;
	s_dirty.runtime			  = true;
}

void CL_N10_NvsManager::setOverrideFixed(bool p_enabled, float p_percent) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	s_state.overrideEnabled		  = p_enabled;
	s_state.overrideMode		  = p_enabled ? 1 : 0;
	s_state.overrideFixedPercent  = p_enabled ? p_percent : 0.0f;
	s_state.overridePresetCode[0] = '\0';
	s_state.overrideStyleCode[0]  = '\0';
	s_dirty.runtime				  = true;
}

void CL_N10_NvsManager::setOverridePreset(bool p_enabled, const char* p_presetCode, const char* p_styleCode) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	s_state.overrideEnabled		 = p_enabled;
	s_state.overrideMode		 = p_enabled ? 2 : 0;
	s_state.overrideFixedPercent = 0.0f;

	if (p_enabled) {
		strlcpy(s_state.overridePresetCode, p_presetCode ? p_presetCode : "", sizeof(s_state.overridePresetCode));
		strlcpy(s_state.overrideStyleCode, p_styleCode ? p_styleCode : "", sizeof(s_state.overrideStyleCode));
	} else {
		s_state.overridePresetCode[0] = '\0';
		s_state.overrideStyleCode[0]  = '\0';
	}
	s_dirty.runtime = true;
}

void CL_N10_NvsManager::clearOverride() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	if (!s_state.overrideEnabled && s_state.overrideMode == 0) return;

	s_state.overrideEnabled		  = false;
	s_state.overrideMode		  = 0;
	s_state.overrideFixedPercent  = 0.0f;
	s_state.overridePresetCode[0] = '\0';
	s_state.overrideStyleCode[0]  = '\0';
	s_dirty.runtime				  = true;
}

void CL_N10_NvsManager::setManualSession(int16_t p_profileNo, bool p_active) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (!s_initialized) begin();
    s_state.manualProfileNo = p_profileNo;
    s_state.manualActive    = p_active;
    s_dirty.runtime         = true;
}

int16_t CL_N10_NvsManager::getManualProfileNo() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return 0;
    return s_state.manualProfileNo;
}

bool CL_N10_NvsManager::isManualActive() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    return s_state.manualActive;
}

void CL_N10_NvsManager::setManualOvrSchedule(bool p_ovr) {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (!s_initialized) begin();
    s_state.manualOvrSchedule = p_ovr;
    s_dirty.runtime           = true;
}

bool CL_N10_NvsManager::isManualOvrSchedule() {
    CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    return s_state.manualOvrSchedule;
}

void CL_N10_NvsManager::resetRuntime() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) begin();
	memset(&s_state, 0, sizeof(s_state));
	s_state.lastScheduleNo	  = -1;
	s_state.lastUserProfileNo = -1;
	s_dirty.runtime			  = true;
	flush(true);

	CL_D10_Logger::log(EN_L10_LOG_WARN, "[N10] Runtime state reset");
}

void CL_N10_NvsManager::setAutoComfort(bool p_enabled) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (s_state.autoComfortEnabled != p_enabled) {
		s_state.autoComfortEnabled = p_enabled;
		s_dirty.runtime = true;
	}
}

bool CL_N10_NvsManager::isAutoComfort() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
	return s_state.autoComfortEnabled;
}

// --------------------------------------------------
// 내부: NVS 로드/저장 (B-5 상수 교체)
// --------------------------------------------------
void CL_N10_NvsManager::loadRuntimeFromNvs() {
	s_state.runMode				 = s_prefs.getUChar(G_N10_KEY_RUN_MODE, 0);
	s_state.runSource			 = s_prefs.getUChar(G_N10_KEY_RUN_SOURCE, 0);
	s_state.lastScheduleNo		 = s_prefs.getShort(G_N10_KEY_LAST_SCHEDULE, -1);
	s_state.lastUserProfileNo	 = s_prefs.getShort(G_N10_KEY_LAST_PROFILE, -1);

	s_state.manualActive          = s_prefs.getUChar(G_N10_KEY_MANUAL_ACTIVE, 0) != 0;
	s_state.manualProfileNo       = s_prefs.getShort(G_N10_KEY_MANUAL_PROFILE, 0);
	s_state.manualOvrSchedule     = s_prefs.getUChar(G_N10_KEY_MANUAL_OVR_SCH, 0) != 0;
	s_state.autoComfortEnabled    = s_prefs.getUChar(G_N10_KEY_AUTO_COMFORT, 0) != 0;

	s_state.overrideEnabled		 = s_prefs.getUChar(G_N10_KEY_OVERRIDE_ENABLED, 0) != 0;
	s_state.overrideMode		 = s_prefs.getUChar(G_N10_KEY_OVERRIDE_MODE, 0);
	s_state.overrideFixedPercent = s_prefs.getFloat(G_N10_KEY_OVERRIDE_FIXED, 0.0f);

	char v_buf[24];
	memset(v_buf, 0, sizeof(v_buf));
	s_prefs.getString(G_N10_KEY_OVERRIDE_PRESET, v_buf, sizeof(v_buf));
	strlcpy(s_state.overridePresetCode, v_buf, sizeof(s_state.overridePresetCode));
	memset(v_buf, 0, sizeof(v_buf));
	s_prefs.getString(G_N10_KEY_OVERRIDE_STYLE, v_buf, sizeof(v_buf));
	strlcpy(s_state.overrideStyleCode, v_buf, sizeof(s_state.overrideStyleCode));

	// [Phase 2] AI 일일 사용량 로드
	memset(s_aiUsage.resetDate, 0, sizeof(s_aiUsage.resetDate));
	s_prefs.getString(G_N10_KEY_AI_RESET_DATE, s_aiUsage.resetDate, sizeof(s_aiUsage.resetDate));
	s_aiUsage.audioSec        = s_prefs.getUInt(G_N10_KEY_AI_AUDIO_SEC, 0);
	s_aiUsage.turnCount       = s_prefs.getUShort(G_N10_KEY_AI_TURN_COUNT, 0);
	s_aiUsage.estCostUsdX1000 = s_prefs.getUInt(G_N10_KEY_AI_COST, 0);

	s_dirty.runtime = false;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[N10] Load runtime: mode=%u src=%u sch=%d up=%d ovr_en=%d",
		s_state.runMode, s_state.runSource, (int)s_state.lastScheduleNo, (int)s_state.lastUserProfileNo,
		(int)s_state.overrideEnabled);
}

void CL_N10_NvsManager::flush(bool p_force) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

	if (!s_initialized) return;
	if (!p_force && !s_dirty.runtime) return;

    // ======================================================
    // [B-1] 단일 nvs_commit: 11회 → 1회 (100ms → ~10ms)
    //  - 이전: s_prefs.putXxx() × 11 = 개별 commit 11회
    //  - 이후: nvs_set_* × 11 + nvs_commit × 1
    //  - 근거: BUDGET §2 N10::tick < 100μs (flush 시 200~500μs) 목표 준수
    // [B-7] nvs_set_* / nvs_commit 반환값 검사 → 실패 시 dirty 유지 재시도
    // ======================================================
    nvs_handle_t v_handle;
    esp_err_t    v_openErr = nvs_open(G_N10_NS_RUNTIME, NVS_READWRITE, &v_handle);
    if (v_openErr != ESP_OK) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[N10] nvs_open failed: %d", (int)v_openErr);
        return;   // dirty 유지 → 다음 tick 재시도
    }

    bool v_setFail = false;
    if (nvs_set_u8  (v_handle, G_N10_KEY_RUN_MODE,         s_state.runMode)                                 != ESP_OK) v_setFail = true;
    if (nvs_set_u8  (v_handle, G_N10_KEY_RUN_SOURCE,       s_state.runSource)                               != ESP_OK) v_setFail = true;
    if (nvs_set_i16 (v_handle, G_N10_KEY_LAST_SCHEDULE,    s_state.lastScheduleNo)                          != ESP_OK) v_setFail = true;
    if (nvs_set_i16 (v_handle, G_N10_KEY_LAST_PROFILE,     s_state.lastUserProfileNo)                       != ESP_OK) v_setFail = true;
    if (nvs_set_u8  (v_handle, G_N10_KEY_OVERRIDE_ENABLED, s_state.overrideEnabled ? 1 : 0)                 != ESP_OK) v_setFail = true;
    if (nvs_set_u8  (v_handle, G_N10_KEY_OVERRIDE_MODE,    s_state.overrideMode)                            != ESP_OK) v_setFail = true;
    if (nvs_set_blob(v_handle, G_N10_KEY_OVERRIDE_FIXED,   &s_state.overrideFixedPercent, sizeof(float))    != ESP_OK) v_setFail = true;
    if (nvs_set_str (v_handle, G_N10_KEY_OVERRIDE_PRESET,  s_state.overridePresetCode)                      != ESP_OK) v_setFail = true;
    if (nvs_set_str (v_handle, G_N10_KEY_OVERRIDE_STYLE,   s_state.overrideStyleCode)                       != ESP_OK) v_setFail = true;
    if (nvs_set_u8  (v_handle, G_N10_KEY_MANUAL_ACTIVE,    s_state.manualActive ? 1 : 0)                     != ESP_OK) v_setFail = true;
    if (nvs_set_i16 (v_handle, G_N10_KEY_MANUAL_PROFILE,   s_state.manualProfileNo)                         != ESP_OK) v_setFail = true;
    if (nvs_set_u8  (v_handle, G_N10_KEY_MANUAL_OVR_SCH,   s_state.manualOvrSchedule ? 1 : 0)               != ESP_OK) v_setFail = true;
    if (nvs_set_u8  (v_handle, G_N10_KEY_AUTO_COMFORT,     s_state.autoComfortEnabled ? 1 : 0)              != ESP_OK) v_setFail = true;

    esp_err_t v_commitErr = nvs_commit(v_handle);
    nvs_close(v_handle);

    if (v_setFail || v_commitErr != ESP_OK) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR,
                           "[N10] NVS flush failed (set=%d commit=%d)",
                           v_setFail ? 1 : 0, (int)v_commitErr);
        return;   // dirty 유지 → 다음 tick 재시도
    }

	s_dirty.runtime = false;
	s_lastSaveMs	= millis();

	CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[N10] Runtime flushed (single commit)");
}

// ==================================================
// [Phase 2] AI 일일 사용량 관리 API
// ==================================================
void CL_N10_NvsManager::saveAIDailyUsageInternal() {
	nvs_handle_t v_handle;
	if (nvs_open(G_N10_NS_RUNTIME, NVS_READWRITE, &v_handle) == ESP_OK) {
		nvs_set_str(v_handle, G_N10_KEY_AI_RESET_DATE, s_aiUsage.resetDate);
		nvs_set_u32(v_handle, G_N10_KEY_AI_AUDIO_SEC, s_aiUsage.audioSec);
		nvs_set_u16(v_handle, G_N10_KEY_AI_TURN_COUNT, s_aiUsage.turnCount);
		nvs_set_u32(v_handle, G_N10_KEY_AI_COST, s_aiUsage.estCostUsdX1000);
		nvs_commit(v_handle);
		nvs_close(v_handle);
	}
}

ST_N10_AIDailyUsage_t CL_N10_NvsManager::getAIDailyUsage() {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
	if (!v_guard.isAcquired()) {
		ST_N10_AIDailyUsage_t v_empty;
		memset(&v_empty, 0, sizeof(v_empty));
		return v_empty;
	}
	return s_aiUsage;
}

bool CL_N10_NvsManager::addAIAudioUsage(uint32_t p_sec, uint16_t p_turns, uint32_t p_costUsdX1000) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
	if (!v_guard.isAcquired()) return false;
	s_aiUsage.audioSec += p_sec;
	s_aiUsage.turnCount += p_turns;
	s_aiUsage.estCostUsdX1000 += p_costUsdX1000;
	saveAIDailyUsageInternal();
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[N10] AI usage updated: audioSec=%lu turns=%u costX1000=%lu",
		(unsigned long)s_aiUsage.audioSec, (unsigned int)s_aiUsage.turnCount, (unsigned long)s_aiUsage.estCostUsdX1000);
	return true;
}

bool CL_N10_NvsManager::resetAIDailyUsageIfNeeded(const char* p_todayDate) {
	if (!p_todayDate || !p_todayDate[0]) return false;
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
	if (!v_guard.isAcquired()) return false;
	if (strncmp(s_aiUsage.resetDate, p_todayDate, 10) != 0) {
		strlcpy(s_aiUsage.resetDate, p_todayDate, sizeof(s_aiUsage.resetDate));
		s_aiUsage.audioSec = 0;
		s_aiUsage.turnCount = 0;
		s_aiUsage.estCostUsdX1000 = 0;
		saveAIDailyUsageInternal();
		CL_D10_Logger::log(EN_L10_LOG_INFO, "[N10] AI daily usage reset for new date: %s", p_todayDate);
		return true;
	}
	return false;
}

void CL_N10_NvsManager::forceResetAIDailyUsage(const char* p_todayDate) {
	CL_A40_MutexGuard_Semaphore v_guard(s_mutex, G_A40_MUTEX_TIMEOUT_100, __func__);
	if (!v_guard.isAcquired()) return;
	if (p_todayDate && p_todayDate[0]) {
		strlcpy(s_aiUsage.resetDate, p_todayDate, sizeof(s_aiUsage.resetDate));
	} else {
		memset(s_aiUsage.resetDate, 0, sizeof(s_aiUsage.resetDate));
	}
	s_aiUsage.audioSec = 0;
	s_aiUsage.turnCount = 0;
	s_aiUsage.estCostUsdX1000 = 0;
	saveAIDailyUsageInternal();
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[N10] AI daily usage force reset");
}
