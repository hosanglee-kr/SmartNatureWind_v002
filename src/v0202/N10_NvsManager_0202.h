#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : N10_NvsManager_0202.h
 * 모듈약어 : N10
 * 모듈명 : Smart Nature Wind NVS Runtime Manager (v0202)
 * ------------------------------------------------------
 * [Batch B-4] NVS 키 상수화 (P1-7 SSOT)
 *  - cfg_nvsSpec_0200.json 과 동기 유지
 *  - 리터럴 사용 금지 (오타·중복 방지)
 *  - NVS Key 길이 제약: ≤ 15 byte
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <string.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "A20_Const_0202.h"
#include "C10_Config_0202.h"
#include "D10_Logger_0202.h"

// ------------------------------------------------------
// N10 런타임 상태 구조체
// ------------------------------------------------------
typedef struct {
	uint8_t	 runMode;			 // 0=OFF,1=SCHEDULE,2=USER_PROFILE
	uint8_t	 runSource;			 // 0=UNKNOWN,1=BUTTON,2=WEB,3=API
	int16_t	 lastScheduleNo;
	int16_t	 lastUserProfileNo;
	bool	 autoOffEnabled;
	uint32_t autoOffMinutes;
	bool	 overrideEnabled;
	uint8_t	 overrideMode;	// 0=NONE,1=FIXED,2=PRESET
	float	 overrideFixedPercent;
	char	 overridePresetCode[24];
	char	 overrideStyleCode[24];
} ST_N10_RuntimeState_t;

typedef struct {
	bool runtime;
} ST_N10_DirtyFlags_t;

// ------------------------------------------------------
// N10 NVS Manager
// ------------------------------------------------------
class CL_N10_NvsManager {
  public:
	static constexpr const char* G_N10_NS_RUNTIME		= "SNW_RUN";
	static constexpr uint32_t	 G_N10_SAVE_INTERVAL_MS = 10UL * 1000UL;

	// ======================================================
	// [Batch B-4] NVS 키 상수 (P1-7 SSOT)
	//  - cfg_nvsSpec_0200.json 과 동기 유지
	//  - NVS Key 길이 제약: ≤ 15 byte (모두 충족)
	// ======================================================
	static constexpr const char* G_N10_KEY_RUN_MODE         = "run_mode";     // uint8
	static constexpr const char* G_N10_KEY_RUN_SOURCE       = "run_src";      // uint8
	static constexpr const char* G_N10_KEY_LAST_SCHEDULE    = "sched_no";     // int16
	static constexpr const char* G_N10_KEY_LAST_PROFILE     = "uprofile_no";  // int16
	static constexpr const char* G_N10_KEY_AUTOOFF_ENABLED  = "autoOff_en";   // uint8(bool)
	static constexpr const char* G_N10_KEY_AUTOOFF_MINUTES  = "autoOff_min";  // uint32
	static constexpr const char* G_N10_KEY_OVERRIDE_ENABLED = "ovr_en";       // uint8(bool)
	static constexpr const char* G_N10_KEY_OVERRIDE_MODE    = "ovr_mode";     // uint8
	static constexpr const char* G_N10_KEY_OVERRIDE_FIXED   = "ovr_fixed";    // float
	static constexpr const char* G_N10_KEY_OVERRIDE_PRESET  = "ovr_preset";   // string
	static constexpr const char* G_N10_KEY_OVERRIDE_STYLE   = "ovr_style";    // string

  public:
	// ==================================================
	// 초기화 / 종료
	// ==================================================
	static bool begin();
	static void end();
	static void clearAll();

	// ==================================================
	// Dirty 플래그 관리
	// ==================================================
	static void markDirty(const char* p_key, bool p_flag);
	static void flushIfNeeded();

	// ==================================================
	// Getter / JSON Export
	// ==================================================
	static ST_N10_RuntimeState_t getState();
	static void toJson(JsonDocument& p_doc);

	// ==================================================
	// 주기 Flush (loop용)
	// ==================================================
	static void tick();

	// ==================================================
	// Setter API
	// ==================================================
	static void setRunMode(uint8_t p_mode, uint8_t p_source);
	static void setLastSchedule(int16_t p_schNo);
	static void setLastUserProfile(int16_t p_profileNo);
	static void setAutoOff(bool p_enabled, uint32_t p_minutes);
	static void setOverrideFixed(bool p_enabled, float p_percent);
	static void setOverridePreset(bool p_enabled, const char* p_presetCode, const char* p_styleCode);
	static void clearOverride();
	static void resetRuntime();

  private:
	static Preferences			 s_prefs;
	static bool					 s_initialized;
	static ST_N10_RuntimeState_t s_state;
	static ST_N10_DirtyFlags_t	 s_dirty;
	static uint32_t				 s_lastSaveMs;

	// 재귀 뮤텍스 (lazy-init)
	static SemaphoreHandle_t s_mutex;

	static void loadRuntimeFromNvs();
	static void flush(bool p_force);
};
