#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : N10_NvsManager_0203.h
 * 모듈약어 : N10
 * 모듈명 : Smart Nature Wind NVS Runtime Manager (v0203)
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

#include "A20_Const_0203.h"
#include "C10_Config_0203.h"
#include "D10_Logger_0203.h"

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
	// [v0203 신규] Manual Session 영속화
	bool	 manualActive;
	int16_t	 manualProfileNo;
	bool	 manualOvrSchedule;
} ST_N10_RuntimeState_t;

// [v0203 신규 Phase 2] AI 일일 사용량 구조체
typedef struct {
	char	 resetDate[12];       // "YYYY-MM-DD"
	uint32_t audioSec;           // 오늘 누적 오디오 초 (상한 1800초 = 30분)
	uint16_t turnCount;          // 오늘 누적 Live 턴 수
	uint32_t estCostUsdX1000;    // 추정 비용 ($ * 1000)
} ST_N10_AIDailyUsage_t;

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
	// [v0203 신규] Session NVS 키
	static constexpr const char* G_N10_KEY_MANUAL_ACTIVE    = "man_active";   // uint8(bool)
	static constexpr const char* G_N10_KEY_MANUAL_PROFILE   = "man_prof";     // int16
	static constexpr const char* G_N10_KEY_MANUAL_OVR_SCH   = "man_ovr_sch";  // uint8(bool)

	// [v0203 신규 Phase 2] AI 일일 사용량 NVS 키 (<= 15 byte)
	static constexpr const char* G_N10_KEY_AI_RESET_DATE = "ai_rst_dt";
	static constexpr const char* G_N10_KEY_AI_AUDIO_SEC  = "ai_a_s";
	static constexpr const char* G_N10_KEY_AI_TURN_COUNT = "ai_t_c";
	static constexpr const char* G_N10_KEY_AI_COST       = "ai_cos";

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
	// [v0203 신규] Session 영속화 메서드
	static void    setManualSession(int16_t p_profileNo, bool p_active);
	static int16_t getManualProfileNo();
	static bool    isManualActive();
	static void    setManualOvrSchedule(bool p_ovr);
	static bool    isManualOvrSchedule();
	static bool    getManualOverrideSchedule() { return isManualOvrSchedule(); }
	static void    setManualOverrideSchedule(bool p_ovr) { setManualOvrSchedule(p_ovr); }

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

	// ==================================================
	// [Phase 2] AI 일일 사용량 관리 API
	// ==================================================
	static ST_N10_AIDailyUsage_t getAIDailyUsage();
	static bool addAIAudioUsage(uint32_t p_sec, uint16_t p_turns, uint32_t p_costUsdX1000);
	static bool resetAIDailyUsageIfNeeded(const char* p_todayDate);
	static void forceResetAIDailyUsage(const char* p_todayDate);

  private:
	static Preferences			 s_prefs;
	static bool					 s_initialized;
	static ST_N10_RuntimeState_t s_state;
	static ST_N10_AIDailyUsage_t s_aiUsage;
	static ST_N10_DirtyFlags_t	 s_dirty;
	static uint32_t				 s_lastSaveMs;

	// 재귀 뮤텍스 (lazy-init)
	static SemaphoreHandle_t s_mutex;

	static void loadRuntimeFromNvs();
	static void flush(bool p_force);
	static void saveAIDailyUsageInternal();
};
