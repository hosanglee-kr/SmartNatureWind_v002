// 소스명 : A20_Const_Sch_046.h
#pragma once
#include <Arduino.h>
#include <strings.h> // strcasecmp

#include "A20_Const_Const_044.h"

/* ======================================================
 * Control Run Mode
 *  - 0=Continuous / 1=Schedule
 * ====================================================== */
typedef enum : uint8_t {
    EN_A20_CONTROL_RUN_CONTINUE = 0,
    EN_A20_CONTROL_RUN_SCHEDULE = 1,
} EN_A20_control_runMode_t;


/* ======================================================
 * Wind Phase (참고용)
 * ====================================================== */
typedef enum : uint8_t {
    EN_A20_WIND_PHASE_CALM = 0,
    EN_A20_WIND_PHASE_NORMAL,
    EN_A20_WIND_PHASE_STRONG,
    EN_A20_WIND_PHASE_COUNT,
} EN_A20_WindPhase_t;

typedef struct {
    const EN_A20_WindPhase_t idx;
    const char*              code;
    const char*              name;
} ST_A20_WindPhase_t;

inline constexpr ST_A20_WindPhase_t G_A20_WindPhase_Arr[EN_A20_WIND_PHASE_COUNT] = {
    { EN_A20_WIND_PHASE_CALM,   "CALM",   "Calm" },
    { EN_A20_WIND_PHASE_NORMAL, "NORMAL", "Normal" },
    { EN_A20_WIND_PHASE_STRONG, "STRONG", "Strong" },
};


/* ======================================================
 * Wind Preset (레거시/참고용)
 *  - 신규 sim은 문자열 preset 사용
 * ====================================================== */
typedef enum : uint8_t {
    EN_A20_WINDPRESET_OCEAN          = 0,
    EN_A20_WINDPRESET_COUNTRY_BREEZE = 1,
    EN_A20_WINDPRESET_MEDITERRANEAN  = 2,
    EN_A20_WINDPRESET_MOUNTAIN       = 3,
    EN_A20_WINDPRESET_PLAINS         = 4,
    EN_A20_WINDPRESET_HARBOR_BREEZE  = 5,
    EN_A20_WINDPRESET_FOREST_CANOPY  = 6,
    EN_A20_WINDPRESET_URBAN_SUNSET   = 7,
    EN_A20_WINDPRESET_TROPICAL_RAIN  = 8,
    EN_A20_WINDPRESET_DESERT_NIGHT   = 9,
    EN_A20_WINDPRESET_COUNT
} EN_A20_WindPreset_t;

typedef struct {
    EN_A20_WindPreset_t       idx;
    const char*               code;
    const char*               name;
} ST_A20_WindPreset_t;

inline constexpr ST_A20_WindPreset_t G_A20_WindPreset_Arr[EN_A20_WINDPRESET_COUNT] = {
    { EN_A20_WINDPRESET_OCEAN,          "OCEAN",          "Ocean"          },
    { EN_A20_WINDPRESET_COUNTRY_BREEZE, "COUNTRY_BREEZE", "Country Breeze" },
    { EN_A20_WINDPRESET_MEDITERRANEAN,  "MEDITERRANEAN",  "Mediterranean"  },
    { EN_A20_WINDPRESET_MOUNTAIN,       "MOUNTAIN",       "Mountain"       },
    { EN_A20_WINDPRESET_PLAINS,         "PLAINS",         "Plains"         },
    { EN_A20_WINDPRESET_HARBOR_BREEZE,  "HARBOR_BREEZE",  "Harbor Breeze"  },
    { EN_A20_WINDPRESET_FOREST_CANOPY,  "FOREST_CANOPY",  "Forest Canopy"  },
    { EN_A20_WINDPRESET_URBAN_SUNSET,   "URBAN_SUNSET",   "Urban Sunset"   },
    { EN_A20_WINDPRESET_TROPICAL_RAIN,  "TROPICAL_RAIN",  "Tropical Rain"  },
    { EN_A20_WINDPRESET_DESERT_NIGHT,   "DESERT_NIGHT",   "Desert Night"   },
};


/* ======================================================
 * Wind Style
 * ====================================================== */
typedef enum : uint8_t {
    EN_A20_WINDSTYLE_BALANCE = 0,
    EN_A20_WINDSTYLE_ACTIVE  = 1,
    EN_A20_WINDSTYLE_FOCUS   = 2,
    EN_A20_WINDSTYLE_RELAX   = 3,
    EN_A20_WINDSTYLE_SLEEP   = 4,
    EN_A20_WINDSTYLE_COUNT
} EN_A20_WindStyle_t;

typedef struct {
    const EN_A20_WindStyle_t idx;
    const char*              code;
    const char*              name;
} ST_A20_WindStyles_t;

inline constexpr ST_A20_WindStyles_t G_A20_WindStyle_Arr[EN_A20_WINDSTYLE_COUNT] = {
    { EN_A20_WINDSTYLE_BALANCE, "BALANCE", "Balance" },
    { EN_A20_WINDSTYLE_ACTIVE,  "ACTIVE",  "Active"  },
    { EN_A20_WINDSTYLE_FOCUS,   "FOCUS",   "Focus"   },
    { EN_A20_WINDSTYLE_RELAX,   "RELAX",   "Relax"   },
    { EN_A20_WINDSTYLE_SLEEP,   "SLEEP",   "Sleep"   },
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
} ST_A20_WindPresetFactors_t;

typedef struct {
    char                      code[A20_Const::MAX_CODE_LEN];
    char                      name[A20_Const::MAX_NAME_LEN];
    ST_A20_WindPresetFactors_t factors;
} ST_A20_PresetEntry_t;

typedef struct {
    float intensityFactor;
    float variabilityFactor;
    float gustFactor;
    float thermalFactor;
} ST_A20_StyleFactors_t;

typedef struct {
    char                code[A20_Const::MAX_CODE_LEN];
    char                name[A20_Const::MAX_NAME_LEN];
    ST_A20_StyleFactors_t factors;
} ST_A20_StyleEntry_t;

typedef struct {
    uint8_t              presetCount = 0;
    uint8_t              styleCount  = 0;
    ST_A20_PresetEntry_t presets[EN_A20_WINDPRESET_COUNT];
    ST_A20_StyleEntry_t  styles[EN_A20_WINDSTYLE_COUNT];
} ST_A20_WindDict_t;


/* ======================================================
 * Enum/Code: Segment Mode
 * ====================================================== */
typedef enum : uint8_t {
    EN_A20_SEG_MODE_PRESET = 0,
    EN_A20_SEG_MODE_FIXED  = 1,
    EN_A20_SEG_MODE_COUNT
} EN_A20_segment_mode_t;

typedef struct {
    const EN_A20_segment_mode_t idx;
    const char*                 code;
    const char*                 name;
} ST_A20_SegmentMode_t;

inline constexpr ST_A20_SegmentMode_t G_A20_SegmentMode_Arr[EN_A20_SEG_MODE_COUNT] = {
    { EN_A20_SEG_MODE_PRESET, "PRESET", "Preset" },
    { EN_A20_SEG_MODE_FIXED,  "FIXED",  "Fixed"  },
};


/* ======================================================
 * AutoOff : camelCase 정합
 * ====================================================== */
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
 * Motion (userProfiles/schedules 공통) : camelCase 정합
 * ====================================================== */
typedef struct {
    bool    enabled = false;
    int16_t holdSec = 0;
} ST_A20_PIR_t;

typedef struct {
    bool    enabled       = false;
    int32_t rssiThreshold = -70;
    int16_t holdSec       = 0;
} ST_A20_BLE_t;

typedef struct {
    ST_A20_PIR_t pir;
    ST_A20_BLE_t ble;
} ST_A20_Motion_t;


/* ======================================================
 * Segment Adjust Delta : camelCase 정합
 *  - 베이스 대비 델타 (상대 변화)
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
    uint8_t             segId      = 0;
    uint16_t            segNo      = 0;
    uint16_t            onMinutes  = 0;
    uint16_t            offMinutes = 0;

    EN_A20_segment_mode_t mode = EN_A20_SEG_MODE_PRESET;

    char                presetCode[A20_Const::MAX_CODE_LEN] = {0};
    char                styleCode[A20_Const::MAX_CODE_LEN]  = {0};
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

    ST_A20_AutoOff_t autoOff;
    ST_A20_Motion_t  motion;
} ST_A20_ScheduleItem_t;

typedef struct {
    uint8_t               count = 0;
    ST_A20_ScheduleItem_t items[A20_Const::MAX_SCHEDULES];
} ST_A20_SchedulesRoot_t;


/* ======================================================
 * UserProfiles JSON 구조 : camelCase 정합
 * ====================================================== */
typedef struct {
    uint8_t             segId      = 0;
    uint16_t            segNo      = 0;
    uint16_t            onMinutes  = 0;
    uint16_t            offMinutes = 0;

    EN_A20_segment_mode_t mode = EN_A20_SEG_MODE_PRESET;

    char                presetCode[A20_Const::MAX_CODE_LEN] = {0};
    char                styleCode[A20_Const::MAX_CODE_LEN]  = {0};
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

    uint8_t                    segCount = 0;
    ST_A20_UserProfileSegment_t segments[A20_Const::MAX_SEGMENTS_PER_PROFILE];

    ST_A20_AutoOff_t autoOff;
    ST_A20_Motion_t  motion;
} ST_A20_UserProfileItem_t;

typedef struct {
    uint8_t                  count = 0;
    ST_A20_UserProfileItem_t items[A20_Const::MAX_USER_PROFILES];
} ST_A20_UserProfilesRoot_t;


/* ======================================================
 * 시뮬레이션에 전달할 해석된 파라미터 : camelCase 정합
 * ====================================================== */
typedef struct {
    char presetCode[A20_Const::MAX_CODE_LEN] = {0}};
    char styleCode[A20_Const::MAX_CODE_LEN] ={0}};

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


/* ======================================================
 * Compile-time consistency checks (운영급)
 * ====================================================== */
static_assert((sizeof(G_A20_WindPhase_Arr) / sizeof(G_A20_WindPhase_Arr[0])) == EN_A20_WIND_PHASE_COUNT,
              "G_A20_WindPhase_Arr size mismatch with EN_A20_WIND_PHASE_COUNT");

static_assert((sizeof(G_A20_WindPreset_Arr) / sizeof(G_A20_WindPreset_Arr[0])) == EN_A20_WINDPRESET_COUNT,
              "G_A20_WindPreset_Arr size mismatch with EN_A20_WINDPRESET_COUNT");

static_assert((sizeof(G_A20_WindStyle_Arr) / sizeof(G_A20_WindStyle_Arr[0])) == EN_A20_WINDSTYLE_COUNT,
              "G_A20_WindStyle_Arr size mismatch with EN_A20_WINDSTYLE_COUNT");

static_assert((sizeof(G_A20_SegmentMode_Arr) / sizeof(G_A20_SegmentMode_Arr[0])) == EN_A20_SEG_MODE_COUNT,
              "G_A20_SegmentMode_Arr size mismatch with EN_A20_SEG_MODE_COUNT");


