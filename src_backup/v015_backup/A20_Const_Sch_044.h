 // 소스명 : A20_Const_Sch_044.h

#pragma once
#include <Arduino.h>

#include "A20_Const_Const_044.h"

// 0=Continuous / 1=Schedule
typedef enum : uint8_t {
    EN_A20_CONTROL_RUN_CONTINUE = 0,
    EN_A20_CONTROL_RUN_SCHEDULE = 1,
} EN_A20_control_runMode_t;

// 바람 단계(참고용)
typedef enum : uint8_t {
    EN_A20_WEATHER_PHASE_CALM = 0,
    EN_A20_WEATHER_PHASE_NORMAL,
    EN_A20_WEATHER_PHASE_STRONG,
    EN_A20_WEATHER_PHASE_COUNT,
} EN_A20_WindPhase_t;

inline constexpr const char* g_A20_WEATHER_PHASE_NAMES_Arr[EN_A20_WEATHER_PHASE_COUNT] = {
    "CALM",
    "NORMAL",
    "STRONG",
};



// 프리셋 (레거시/참고용: 신규 sim은 문자열 preset 사용)
typedef enum : uint8_t {
    EN_A20_PRESET_OFF           = 0,
    EN_A20_PRESET_COUNTRY       = 1,
    EN_A20_PRESET_MEDITERRANEAN = 2,
    EN_A20_PRESET_OCEAN         = 3,
    EN_A20_PRESET_MOUNTAIN      = 4,
    EN_A20_PRESET_PLAINS        = 5,
    EN_A20_PRESET_HARBOR_BREEZE = 6,
    EN_A20_PRESET_FOREST_CANOPY = 7,
    EN_A20_PRESET_URBAN_SUNSET  = 8,
    EN_A20_PRESET_TROPICAL_RAIN = 9,
    EN_A20_PRESET_DESERT_NIGHT  = 10,
    EN_A20_PRESET_COUNT
} EN_A20_PresetMode_t;

// 프리셋 코드 배열 정의 (문자열 상수)  (참고용)
inline constexpr const char* g_A20_PRESET_CODES[EN_A20_PRESET_COUNT] = {
    "OFF",
    "COUNTRY",
    "MEDITERRANEAN",
    "OCEAN",
    "MOUNTAIN",
    "PLAINS",
    "HARBOR_BREEZE",
    "FOREST_CANOPY",
    "URBAN_SUNSET",
    "TROPICAL_RAIN",
    "DESERT_NIGHT",
};

inline constexpr const char* g_A20_PRESET_MODE_NAMES_Arr[EN_A20_PRESET_COUNT] = {
    "Off",
    "Country",
    "Mediterranean",
    "Ocean",
    "Mountain",
    "Plains",
    "Harbor Breeze",
    "Forest Canopy",
    "Urban Sunset",
    "Tropical Rain",
    "Desert Night",
};



/* ======================================================
 * Enum/Code: Segment Mode
 * ====================================================== */
typedef enum : uint8_t {
    EN_A20_SEG_MODE_PRESET = 0,
    EN_A20_SEG_MODE_FIXED  = 1,
    EN_A20_SEG_MODE_COUNT
} EN_A20_segment_mode_t;

/* ======================================================
 * Segment Mode <-> String 매핑 유틸
 * ====================================================== */
inline constexpr const char* g_A20_SEG_MODE_NAMES[EN_A20_SEG_MODE_COUNT] = {
	"PRESET", "FIXED"
};



/* ======================================================
 * Wind Dict (cfg_windDict_xxx.json) : camelCase 정합
 * ====================================================== */
typedef struct {
    float windIntensity;
    float gustFrequency;
    float windVariability;
    float fanLimit;
    float minFan;
    float turbulenceLengthScale;
    float turbulenceIntensitySigma;
    float thermalBubbleStrength;
    float thermalBubbleRadius;

    float baseMinWind;
    float baseMaxWind;
    float gustProbBase;
    float gustStrengthMax;
    float thermalFreqBase;
} ST_A20_WindBase_t;

typedef struct {
    char              code[A20_Const::MAX_CODE_LEN];
    char              name[A20_Const::MAX_NAME_LEN];
    ST_A20_WindBase_t base;
} ST_A20_PresetEntry_t;

typedef struct {
    float intensityFactor;
    float variabilityFactor;
    float gustFactor;
    float thermalFactor;
} ST_A20_StyleFactors_t;

typedef struct {
    char                  code[A20_Const::MAX_CODE_LEN];
    char                  name[A20_Const::MAX_NAME_LEN];
    ST_A20_StyleFactors_t factors;
} ST_A20_StyleEntry_t;

typedef struct {
    uint8_t              presetCount = 0;
    uint8_t              styleCount  = 0;
    ST_A20_PresetEntry_t presets[EN_A20_PRESET_COUNT];			// presets[A20_Const::WIND_PRESETS_MAX];
    ST_A20_StyleEntry_t  styles[EN_A20_WEATHER_PHASE_COUNT];	// styles[A20_Const::WIND_STYLES_MAX];

} ST_A20_WindProfileDict_t;


typedef struct {
    struct {
        bool     enabled = false;
        uint32_t minutes = 0;
    } timer;
    struct {
        bool enabled = false;
        char time[6] = {0};
    } offTime; // "HH:MM"
    struct {
        bool  enabled = false;
        float temp    = 0.0f;
    } offTemp;
} ST_A20_AutoOff_t;


/* ======================================================
 * 공통: Motion, AutoOff  (userProfiles/schedules 공통) : camelCase 정합
 * ====================================================== */
typedef struct {
    bool    enabled = false;
    int32_t holdSec = 0;
} ST_A20_PIR_t;

typedef struct {
    bool    enabled       = false;
    int32_t rssiThreshold = -70;
    int32_t holdSec       = 0;
} ST_A20_BLE_t;

typedef struct {
    ST_A20_PIR_t pir;
    ST_A20_BLE_t ble;
} ST_A20_Motion_t;



/* ======================================================
 * Segment 조정(Adjust) : camelCase 정합
 *  - JSON에서는 adjust.windIntensity / windVariability 등 사용
 *  - 모든 값은 "베이스에서 델타" (상대 변화, 단위 동일)
 * ====================================================== */
typedef struct {
    float windIntensity            = 0.0f;
    float gustFrequency            = 0.0f;
    float windVariability          = 0.0f;
    float fanLimit                 = 0.0f;
    float minFan                   = 0.0f;
    float turbulenceLengthScale    = 0.0f;
    float turbulenceIntensitySigma = 0.0f;
    float thermalBubbleStrength    = 0.0f;
    float thermalBubbleRadius      = 0.0f;
} ST_A20_AdjustDelta_t;

/* ======================================================
 * Schedule JSON 구조 : camelCase 정합
 * ====================================================== */
typedef struct {
    uint8_t days[7]      = {1, 1, 1, 1, 1, 1, 1};
    char    startTime[6] = {0};
    char    endTime[6]   = {0};
} ST_A20_SchedulePeriod_t;

typedef struct {
    uint8_t  segId      = 0;
    uint16_t segNo      = 0;
    uint16_t onMinutes  = 0;
    uint16_t offMinutes = 0;

    EN_A20_segment_mode_t mode = EN_A20_SEG_MODE_PRESET;

    char                 presetCode[A20_Const::MAX_CODE_LEN] = {0};
    char                 styleCode[A20_Const::MAX_CODE_LEN]  = {0};
    ST_A20_AdjustDelta_t adjust;

    float fixedSpeed = 0.0f;
} ST_A20_ScheduleSegment_t;

typedef struct {
    uint8_t  schId                         = 0;
    uint16_t schNo                         = 0;
    char     name[A20_Const::MAX_NAME_LEN] = {0};
    bool     enabled                       = true;

    ST_A20_SchedulePeriod_t  period;
    uint8_t                  segCount = 0;
    ST_A20_ScheduleSegment_t segments[A20_Const::MAX_SEGMENTS_PER_SCHEDULE];

    bool    repeatSegments = true;
    uint8_t repeatCount    = 0;

	ST_A20_AutoOff_t 		autoOff;
    ST_A20_Motion_t     	motion;
} ST_A20_ScheduleItem_t;

typedef struct {
    uint8_t               count = 0;
    ST_A20_ScheduleItem_t items[A20_Const::MAX_SCHEDULES];
} ST_A20_SchedulesRoot_t;

/* ======================================================
 * UserProfiles JSON 구조 : camelCase 정합
 * ====================================================== */
typedef struct {
    uint8_t  segId      = 0;
    uint16_t segNo      = 0;
    uint16_t onMinutes  = 0;
    uint16_t offMinutes = 0;

    EN_A20_segment_mode_t mode = EN_A20_SEG_MODE_PRESET;

    char                 presetCode[A20_Const::MAX_CODE_LEN] = {0};
    char                 styleCode[A20_Const::MAX_CODE_LEN]  = {0};
    ST_A20_AdjustDelta_t adjust;

    float fixedSpeed = 0.0f;
} ST_A20_UserProfileSegment_t;

typedef struct {
    uint8_t profileId                     = 0;
    uint8_t profileNo                     = 0;
    char    name[A20_Const::MAX_NAME_LEN] = {0};
    bool    enabled                       = true;

    bool    repeatSegments = true;
    uint8_t repeatCount    = 0;

    uint8_t                     segCount = 0;
    ST_A20_UserProfileSegment_t segments[A20_Const::MAX_SEGMENTS_PER_PROFILE];

    ST_A20_AutoOff_t autoOff;
    ST_A20_Motion_t  motion;
} ST_A20_UserProfileItem_t;

typedef struct {
    uint8_t                  count = 0;
    ST_A20_UserProfileItem_t items[A20_Const::MAX_USER_PROFILES];
} ST_A20_UserProfilesRoot_t;

/* ======================================================
 * 시뮬레이션에 전달할 "해석된 파라미터" : camelCase 정합
 * ====================================================== */
typedef struct {
    char presetCode[A20_Const::MAX_CODE_LEN];
    char styleCode[A20_Const::MAX_CODE_LEN];

    bool  valid      = false;
    bool  fixedMode  = false;
    float fixedSpeed = 0.0f;

    float windIntensity            = 0.0f;
    float gustFrequency            = 0.0f;
    float windVariability          = 0.0f;
    float fanLimit                 = 0.0f;
    float minFan                   = 0.0f;
    float turbulenceLengthScale    = 0.0f;
    float turbulenceIntensitySigma = 0.0f;
    float thermalBubbleStrength    = 0.0f;
    float thermalBubbleRadius      = 0.0f;

    float baseMinWind     = 0.0f;
    float baseMaxWind     = 0.0f;
    float gustProbBase    = 0.0f;
    float gustStrengthMax = 0.0f;
    float thermalFreqBase = 0.0f;
} ST_A20_ResolvedWind_t;

