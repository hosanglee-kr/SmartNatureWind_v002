#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : CT10_Monitor_0202.h
 * 모듈약어 : MON (CT10 서브)
 * 모듈명 : Smart Nature Wind — 모니터링 이력 관리자 (Phase 1: Warm + Phase 2: Cold)
 * ------------------------------------------------------
 * [Phase 1 범위]
 *  - PSRAM Warm buffer만 (1시간 1초 원본)
 * [Phase 2 범위]
 *  - Cold LittleFS 5파일 (7일/30일 보관, 1시간 배치 flush)
 *  - [MON-4] 5분 평균 집계 및 Pre-allocation
 *  - [MON-5] 지난 이벤트 통합 7일 조회 및 CSV 다운로드
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <stdint.h>
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "A40_Com_Utils_0202.h"

// ======================================================
// 스냅샷 (CT10이 매 tick 제공)
// ======================================================
typedef struct {
    uint8_t  state;
    uint8_t  reason;
    uint8_t  activeSchId;
    uint16_t activeSegNo;
    uint8_t  activeProfileNo;

    float   windSpeed;
    float   targetWind;
    float   pwmDuty;
    float   intensity;
    float   variability;
    float   gustFreq;
    uint8_t presetIdx;
    uint8_t styleIdx;
    bool    gustActive;
    bool    thermalActive;

    bool overrideActive;

    bool     autoOffTimerArmed;
    uint32_t autoOffTimerMinutes;

    float tempC;
    float humidity;
    bool  motionActive;
} ST_MON_Snapshot_t;

// ======================================================
// 데이터 엔트리 (Warm PSRAM)
// ======================================================
    typedef struct { // 16B
        uint32_t t;
        uint16_t wind_x10;
        uint16_t target_x10;
        uint16_t pwm_x10;
        uint8_t  preset_idx;
        uint8_t  flags; // bit0=gust, bit1=thermal
        uint8_t  _pad[2];
    } ST_MON_WindRaw_t;

        typedef struct { // 20B
            uint32_t t;
            uint8_t  prevState, newState, reason;
            uint8_t  activeSchId;
            uint16_t activeSegNo;
            uint8_t  activeProfileNo;
            uint8_t  preset_idx, style_idx;
            uint8_t  intensity, variability, gustFreq;
            uint8_t  _pad[3];
        } ST_MON_StateEvent_t;

            typedef struct { // 12B
                uint32_t t;
                uint8_t  type;
                uint8_t  old_val, new_val, source;
                uint8_t  _pad[4];
            } ST_MON_ConfigEvent_t;

                typedef struct { // 8B
                    uint32_t t;
                    int16_t  temp_x10;
                    uint8_t  humidity, motion;
                } ST_MON_SensorRaw_t;

                    typedef struct { // 12B
                        uint32_t t;
                        uint8_t  type;
                        uint8_t  param1;
                        uint16_t param2;
                        uint8_t  _pad[4];
                    } ST_MON_SystemEvent_t;

                    // ======================================================
                    // [MON-D] Cold (LittleFS) 파일 구조체
                    // ======================================================
                    typedef struct {      // 64B 파일 헤더
                        uint32_t magic;   // "MNW1"
                        uint16_t version; // 1
                        uint16_t entry_size;
                        uint32_t capacity;
                        uint32_t head;
                        uint32_t count;
                        uint32_t first_epoch;
                        uint32_t last_epoch;
                        uint8_t  _pad[38];
                    } ST_MON_FileHeader_t;

                    typedef struct { // 16B Cold 5분 평균 wind
                        uint32_t t;
                        uint16_t avg_x10, min_x10, max_x10, pwm_avg_x10;
                        uint8_t  preset_idx;
                        uint8_t  gust_count;
                        uint8_t  thermal_count;
                        uint8_t  _pad;
                    } ST_MON_Wind5Min_t;

                    typedef struct { // 16B Cold 5분 평균 sensor
                        uint32_t t;
                        int16_t  temp_avg_x10, temp_min_x10, temp_max_x10;
                        uint8_t  hum_avg, motion_ratio;
                        uint8_t  _pad[2];
                    } ST_MON_Sensor5Min_t;

                    // ======================================================
                    // Monitor Manager
                    // ======================================================
                    class CL_MON_Monitor {
                      public:
                        static bool begin();
                        static bool isEnabled() { return s_enabled; }

                        static void tick(const ST_MON_Snapshot_t& p_snap);
                        static void flushCold(); // [MON-D] 1시간 배치 (loop에서 호출)
                        static void queryPastEvents(uint8_t p_days, JsonDocument& p_doc); // [MON-E]
                        static void exportCsv(const char* p_type, const char* p_range, bool p_all, String& p_out); // [MON-F]

                        // API 조회용 (Warm)
                        static void queryWind(const char* p_range, JsonDocument& p_doc);
                        static void queryState(const char* p_range, JsonDocument& p_doc);
                        static void queryConfig(const char* p_range, JsonDocument& p_doc);
                        static void querySensor(const char* p_range, JsonDocument& p_doc);
                        static void querySystem(const char* p_range, JsonDocument& p_doc);

                      private:
                        static ST_MON_WindRaw_t*     s_wind;
                        static ST_MON_StateEvent_t*  s_state;
                        static ST_MON_ConfigEvent_t* s_config;
                        static ST_MON_SensorRaw_t*   s_sensor;
                        static ST_MON_SystemEvent_t* s_system;
                        static bool                  s_enabled;
                        static SemaphoreHandle_t     s_monitorMutex;

                        static uint16_t s_windHead, s_windCount;
                        static uint8_t  s_stateHead, s_stateCount;
                        static uint8_t  s_configHead, s_configCount;
                        static uint8_t  s_sensorHead, s_sensorCount;
                        static uint8_t  s_systemHead, s_systemCount;

                        static uint32_t s_lastWindMs;
                        static uint32_t s_lastSensorMs;
                        static uint32_t s_lastFlushMs;

                        static uint8_t s_prevState, s_prevReason;
                        static uint8_t s_prevSchId, s_prevSegNo, s_prevProfileNo;
                        static float   s_prevIntensity, s_prevVariability, s_prevGustFreq;
                        static uint8_t s_prevPreset, s_prevStyle;

                        // Cold LittleFS 파일 경로
                        static constexpr const char* PATH_WIND   = "/lfs/monitor/wind_history.bin";
                        static constexpr const char* PATH_STATE  = "/lfs/monitor/state_history.bin";
                        static constexpr const char* PATH_CONFIG = "/lfs/monitor/config_history.bin";
                        static constexpr const char* PATH_SENSOR = "/lfs/monitor/sensor_history.bin";
                        static constexpr const char* PATH_SYSTEM = "/lfs/monitor/system_history.bin";

                        // Cold 용량
                        static constexpr uint32_t COLD_WIND_CAP   = 2016; // 7일 × 12/시간
                        static constexpr uint32_t COLD_STATE_CAP  = 1680;
                        static constexpr uint32_t COLD_CONFIG_CAP = 600; // 30일
                        static constexpr uint32_t COLD_SENSOR_CAP = 2016;
                        static constexpr uint32_t COLD_SYSTEM_CAP = 150;

                        struct ST_COLD_Aggregator {
                            uint32_t bucketStart;
                            uint32_t windSum, pwmSum;
                            uint16_t windMin, windMax, windCnt;
                            uint8_t  gustCnt, thermalCnt, presetIdx;
                            uint32_t sensorSum, sensorCnt;
                            int16_t  tempMin, tempMax;
                            uint8_t  humSum;
                            uint8_t  motionCnt;

                            uint32_t lastStateEpochFlushed;
                            uint32_t lastConfigEpochFlushed;
                            uint32_t lastSystemEpochFlushed;
                        };
                        static ST_COLD_Aggregator s_agg;

                        static void _captureWind(const ST_MON_Snapshot_t& p);
                        static void _captureSensor(const ST_MON_Snapshot_t& p);
                        static void _captureStateChange(const ST_MON_Snapshot_t& p);
                        static void _captureConfigChanges(const ST_MON_Snapshot_t& p);
                        static void _pushSystemEvent(uint8_t type, uint8_t p1, uint16_t p2);
                        static void _nowEpoch(uint32_t& p_out);

                        static void _aggregateWind(const ST_MON_WindRaw_t& p_e);
                        static void _aggregateSensor(const ST_MON_SensorRaw_t& p_e);
                        static void _writeHeader(const char* p_path, uint16_t p_entrySize, uint32_t p_capacity);
                        static bool _appendFile(const char* p_path, const void* p_entry, uint16_t p_entrySize, uint32_t p_capacity);
                        static bool _readHeader(const char* p_path, ST_MON_FileHeader_t& p_h);
                    };
