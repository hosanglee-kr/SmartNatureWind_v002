#include "CT10_Monitor_0202.h"
#include <esp_heap_caps.h>
#include <time.h>
#include <LittleFS.h>
#include <FS.h>
#include "A40_Com_Utils_0202.h"
#include "D10_Logger_0202.h"

// Warm 용량
static constexpr uint16_t WIND_CAP   = 3600; // 1시간 @ 1초
static constexpr uint8_t  STATE_CAP  = 200;
static constexpr uint8_t  CONFIG_CAP = 200;
static constexpr uint8_t  SENSOR_CAP = 120; // 1시간 @ 30초
static constexpr uint8_t  SYSTEM_CAP = 200;

// 정적 정의
ST_MON_WindRaw_t*     CL_MON_Monitor::s_wind         = nullptr;
ST_MON_StateEvent_t*  CL_MON_Monitor::s_state        = nullptr;
ST_MON_ConfigEvent_t* CL_MON_Monitor::s_config       = nullptr;
ST_MON_SensorRaw_t*   CL_MON_Monitor::s_sensor       = nullptr;
ST_MON_SystemEvent_t* CL_MON_Monitor::s_system       = nullptr;
bool                  CL_MON_Monitor::s_enabled      = false;
SemaphoreHandle_t     CL_MON_Monitor::s_monitorMutex = nullptr;

uint16_t CL_MON_Monitor::s_windHead = 0, CL_MON_Monitor::s_windCount = 0;
uint8_t  CL_MON_Monitor::s_stateHead = 0, CL_MON_Monitor::s_stateCount = 0;
uint8_t  CL_MON_Monitor::s_configHead = 0, CL_MON_Monitor::s_configCount = 0;
uint8_t  CL_MON_Monitor::s_sensorHead = 0, CL_MON_Monitor::s_sensorCount = 0;
uint8_t  CL_MON_Monitor::s_systemHead = 0, CL_MON_Monitor::s_systemCount = 0;

uint32_t CL_MON_Monitor::s_lastWindMs = 0, CL_MON_Monitor::s_lastSensorMs = 0;
uint32_t CL_MON_Monitor::s_lastFlushMs = 0;

uint8_t CL_MON_Monitor::s_prevState = 255, CL_MON_Monitor::s_prevReason = 255;
uint8_t CL_MON_Monitor::s_prevSchId = 255, CL_MON_Monitor::s_prevSegNo = 255, CL_MON_Monitor::s_prevProfileNo = 255;
float CL_MON_Monitor::s_prevIntensity = -1, CL_MON_Monitor::s_prevVariability = -1, CL_MON_Monitor::s_prevGustFreq = -1;
uint8_t CL_MON_Monitor::s_prevPreset = 255, CL_MON_Monitor::s_prevStyle = 255;

CL_MON_Monitor::ST_COLD_Aggregator CL_MON_Monitor::s_agg = {};

template <typename T>
static T* _allocPsram(size_t p_n) {
    T* p = (T*)heap_caps_malloc(p_n * sizeof(T), MALLOC_CAP_SPIRAM);
    if (p) memset(p, 0, p_n * sizeof(T));
    return p;
}

bool CL_MON_Monitor::begin() {
    if (s_enabled) return true;

    s_wind   = _allocPsram<ST_MON_WindRaw_t>(WIND_CAP);
    s_state  = _allocPsram<ST_MON_StateEvent_t>(STATE_CAP);
    s_config = _allocPsram<ST_MON_ConfigEvent_t>(CONFIG_CAP);
    s_sensor = _allocPsram<ST_MON_SensorRaw_t>(SENSOR_CAP);
    s_system = _allocPsram<ST_MON_SystemEvent_t>(SYSTEM_CAP);

    if (!s_wind || !s_state || !s_config || !s_sensor || !s_system) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[MON] PSRAM alloc failed");
        return false;
    }

    s_windHead = s_stateHead = s_configHead = s_sensorHead = s_systemHead = 0;
    s_windCount = s_stateCount = s_configCount = s_sensorCount = s_systemCount = 0;
    s_lastWindMs = s_lastSensorMs = 0;
    s_prevState                   = 255;
    if (!s_monitorMutex) {
        s_monitorMutex = xSemaphoreCreateRecursiveMutex();
    }

    // [MON-D] LittleFS 모니터 디렉토리 + 파일 헤더 보장
    if (!LittleFS.exists("/lfs")) LittleFS.mkdir("/lfs");
    if (!LittleFS.exists("/lfs/monitor")) LittleFS.mkdir("/lfs/monitor");

    _writeHeader(PATH_WIND, sizeof(ST_MON_Wind5Min_t), COLD_WIND_CAP);
    _writeHeader(PATH_STATE, sizeof(ST_MON_StateEvent_t), COLD_STATE_CAP);
    _writeHeader(PATH_CONFIG, sizeof(ST_MON_ConfigEvent_t), COLD_CONFIG_CAP);
    _writeHeader(PATH_SENSOR, sizeof(ST_MON_Sensor5Min_t), COLD_SENSOR_CAP);
    _writeHeader(PATH_SYSTEM, sizeof(ST_MON_SystemEvent_t), COLD_SYSTEM_CAP);

    memset(&s_agg, 0, sizeof(s_agg));
    s_agg.windMin = 65535;
    s_agg.tempMin = 32767;
    s_agg.tempMax = -32768;
    s_lastFlushMs = millis();

    s_enabled = true;

    CL_D10_Logger::log(EN_L10_LOG_INFO,
        "[MON] begin: Warm PSRAM + Cold LittleFS initialized successfully");
        return true;
}

void CL_MON_Monitor::_writeHeader(const char* p_path, uint16_t p_entrySize, uint32_t p_capacity) {
    if (LittleFS.exists(p_path)) {
        ST_MON_FileHeader_t h;
        if (_readHeader(p_path, h) && h.magic == 0x4D4E5731u && h.entry_size == p_entrySize) {
            return;
        }
    }
    File f = LittleFS.open(p_path, "w");
    if (!f) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[MON] header open fail: %s", p_path);
        return;
    }
    ST_MON_FileHeader_t h = {};
    h.magic               = 0x4D4E5731u; // "MNW1"
    h.version             = 1;
    h.entry_size          = p_entrySize;
    h.capacity            = p_capacity;

    if (p_capacity > 0 && p_entrySize > 0) {
        size_t totalDataSize = sizeof(h) + (size_t)p_capacity * p_entrySize;
        f.seek(totalDataSize - 1);
        f.write((uint8_t)0);
    }
    f.seek(0);
    f.write((const uint8_t*)&h, sizeof(h));
    f.close();
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[MON] Cold file created: %s (cap=%u)", p_path, p_capacity);
}

bool CL_MON_Monitor::_readHeader(const char* p_path, ST_MON_FileHeader_t& p_h) {
    File f = LittleFS.open(p_path, "r");
    if (!f) return false;
    size_t n = f.read((uint8_t*)&p_h, sizeof(p_h));
    f.close();
    return n == sizeof(p_h);
}

void CL_MON_Monitor::_nowEpoch(uint32_t& p_out) {
    time_t t = time(nullptr);
    if ((uint32_t)t > 1700000000UL) {
        p_out = (uint32_t)t;
    } else {
        p_out = (uint32_t)(millis() / 1000);
    }
}

void CL_MON_Monitor::tick(const ST_MON_Snapshot_t& p) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    if (!s_enabled) return;
    uint32_t now = millis();

    // 1초 wind 캡처
    if (now - s_lastWindMs >= 1000) {
        s_lastWindMs = now;
        _captureWind(p);
        _aggregateWind(s_wind[(s_windHead + WIND_CAP - 1) % WIND_CAP]);
    }

    // 30초 sensor 캡처
    if (now - s_lastSensorMs >= 30000) {
        s_lastSensorMs = now;
        _captureSensor(p);
        _aggregateSensor(s_sensor[(s_sensorHead + SENSOR_CAP - 1) % SENSOR_CAP]);
    }

    // 이벤트 즉시 캡처
    _captureStateChange(p);
    _captureConfigChanges(p);

    // [MON-D] 1시간 배치 flush (3600초)
    if (now - s_lastFlushMs >= 3600000UL) {
        s_lastFlushMs = now;
        flushCold();
    }
}

void CL_MON_Monitor::_captureWind(const ST_MON_Snapshot_t& p) {
    ST_MON_WindRaw_t& e = s_wind[s_windHead];
    _nowEpoch(e.t);
    e.wind_x10   = (uint16_t)(p.windSpeed * 10.0f);
    e.target_x10 = (uint16_t)(p.targetWind * 10.0f);
    e.pwm_x10    = (uint16_t)(p.pwmDuty * 10.0f);
    e.preset_idx = p.presetIdx;
    e.flags      = (p.gustActive ? 0x01 : 0) | (p.thermalActive ? 0x02 : 0);

    s_windHead = (s_windHead + 1) % WIND_CAP;
    if (s_windCount < WIND_CAP) s_windCount++;
}

void CL_MON_Monitor::_captureSensor(const ST_MON_Snapshot_t& p) {
    ST_MON_SensorRaw_t& e = s_sensor[s_sensorHead];
    _nowEpoch(e.t);
    e.temp_x10   = (int16_t)(p.tempC * 10.0f);
    e.humidity   = (uint8_t)(p.humidity);
    e.motion     = p.motionActive ? 1 : 0;
    s_sensorHead = (s_sensorHead + 1) % SENSOR_CAP;
    if (s_sensorCount < SENSOR_CAP) s_sensorCount++;
}

void CL_MON_Monitor::_captureStateChange(const ST_MON_Snapshot_t& p) {
    if (p.state == s_prevState && p.reason == s_prevReason && p.activeSchId == s_prevSchId &&
        p.activeSegNo == s_prevSegNo && p.activeProfileNo == s_prevProfileNo)
        return;

    ST_MON_StateEvent_t& e = s_state[s_stateHead];
    _nowEpoch(e.t);
    e.prevState       = (s_prevState == 255) ? p.state : s_prevState;
    e.newState        = p.state;
    e.reason          = p.reason;
    e.activeSchId     = p.activeSchId;
    e.activeSegNo     = p.activeSegNo;
    e.activeProfileNo = p.activeProfileNo;
    e.preset_idx      = p.presetIdx;
    e.style_idx       = p.styleIdx;
    e.intensity       = (uint8_t)p.intensity;
    e.variability     = (uint8_t)p.variability;
    e.gustFreq        = (uint8_t)p.gustFreq;

    s_stateHead = (s_stateHead + 1) % STATE_CAP;
    if (s_stateCount < STATE_CAP) s_stateCount++;

    s_prevState     = p.state;
    s_prevReason    = p.reason;
    s_prevSchId     = p.activeSchId;
    s_prevSegNo     = p.activeSegNo;
    s_prevProfileNo = p.activeProfileNo;
}

void CL_MON_Monitor::_captureConfigChanges(const ST_MON_Snapshot_t& p) {
    auto rec = [](uint8_t type, uint8_t oldV, uint8_t newV, uint8_t src) {
        ST_MON_ConfigEvent_t& e = s_config[s_configHead];
        CL_MON_Monitor::_nowEpoch(e.t);
        e.type       = type;
        e.old_val    = oldV;
        e.new_val    = newV;
        e.source     = src;
        s_configHead = (s_configHead + 1) % CONFIG_CAP;
        if (s_configCount < CONFIG_CAP) s_configCount++;
    };

    if (s_prevIntensity >= 0 && fabsf(p.intensity - s_prevIntensity) >= 1.0f) {
        rec(2, (uint8_t)s_prevIntensity, (uint8_t)p.intensity, 0);
    }
    if (s_prevVariability >= 0 && fabsf(p.variability - s_prevVariability) >= 1.0f) {
        rec(3, (uint8_t)s_prevVariability, (uint8_t)p.variability, 0);
    }
    if (s_prevGustFreq >= 0 && fabsf(p.gustFreq - s_prevGustFreq) >= 1.0f) {
        rec(4, (uint8_t)s_prevGustFreq, (uint8_t)p.gustFreq, 0);
    }
    if (s_prevPreset != 255 && p.presetIdx != s_prevPreset) {
        rec(0, s_prevPreset, p.presetIdx, 0);
    }
    if (s_prevStyle != 255 && p.styleIdx != s_prevStyle) {
        rec(1, s_prevStyle, p.styleIdx, 0);
    }

    s_prevIntensity   = p.intensity;
    s_prevVariability = p.variability;
    s_prevGustFreq    = p.gustFreq;
    s_prevPreset      = p.presetIdx;
    s_prevStyle       = p.styleIdx;
}

void CL_MON_Monitor::_pushSystemEvent(uint8_t type, uint8_t p1, uint16_t p2) {
    ST_MON_SystemEvent_t& e = s_system[s_systemHead];
    _nowEpoch(e.t);
    e.type       = type;
    e.param1     = p1;
    e.param2     = p2;
    s_systemHead = (s_systemHead + 1) % SYSTEM_CAP;
    if (s_systemCount < SYSTEM_CAP) s_systemCount++;
}

void CL_MON_Monitor::_aggregateWind(const ST_MON_WindRaw_t& p_e) {
    uint32_t bucket = (p_e.t / 300) * 300;
    if (s_agg.bucketStart == 0) s_agg.bucketStart = bucket;
    if (bucket != s_agg.bucketStart) {
        s_agg.windSum     = 0;
        s_agg.pwmSum      = 0;
        s_agg.windMin     = 65535;
        s_agg.windMax     = 0;
        s_agg.windCnt     = 0;
        s_agg.gustCnt     = 0;
        s_agg.thermalCnt  = 0;
        s_agg.bucketStart = bucket;
    }
    s_agg.windSum += p_e.wind_x10;
    s_agg.pwmSum  += p_e.pwm_x10;
    if (p_e.wind_x10 < s_agg.windMin) s_agg.windMin = p_e.wind_x10;
    if (p_e.wind_x10 > s_agg.windMax) s_agg.windMax = p_e.wind_x10;
    if (p_e.flags & 0x01) s_agg.gustCnt++;
    if (p_e.flags & 0x02) s_agg.thermalCnt++;
    s_agg.presetIdx = p_e.preset_idx;
    s_agg.windCnt++;
}

void CL_MON_Monitor::_aggregateSensor(const ST_MON_SensorRaw_t& p_e) {
    s_agg.sensorSum += (uint32_t)(p_e.temp_x10 + 1000);
    s_agg.sensorCnt++;
    if (p_e.temp_x10 < s_agg.tempMin) s_agg.tempMin = p_e.temp_x10;
    if (p_e.temp_x10 > s_agg.tempMax) s_agg.tempMax = p_e.temp_x10;
    s_agg.humSum += p_e.humidity;
    if (p_e.motion) s_agg.motionCnt++;
}

void CL_MON_Monitor::flushCold() {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    if (!s_enabled) return;
    if (s_agg.windCnt == 0 && s_agg.sensorCnt == 0) return;

    if (s_agg.windCnt > 0) {
        ST_MON_Wind5Min_t w = {};
        w.t                 = s_agg.bucketStart;
        w.avg_x10           = s_agg.windSum / s_agg.windCnt;
        w.min_x10           = s_agg.windMin;
        w.max_x10           = s_agg.windMax;
        w.pwm_avg_x10       = s_agg.pwmSum / s_agg.windCnt;
        w.preset_idx        = s_agg.presetIdx;
        w.gust_count        = (uint8_t)s_agg.gustCnt;
        w.thermal_count     = (uint8_t)s_agg.thermalCnt;
        _appendFile(PATH_WIND, &w, sizeof(w), COLD_WIND_CAP);
    }

    if (s_agg.sensorCnt > 0) {
        ST_MON_Sensor5Min_t s = {};
        s.t                   = s_agg.bucketStart;
        int32_t avg           = (int32_t)(s_agg.sensorSum / s_agg.sensorCnt) - 1000;
        s.temp_avg_x10        = (int16_t)avg;
        s.temp_min_x10        = s_agg.tempMin;
        s.temp_max_x10        = s_agg.tempMax;
        s.hum_avg             = (uint8_t)(s_agg.humSum / s_agg.sensorCnt);
        s.motion_ratio        = (uint8_t)((s_agg.motionCnt * 255) / s_agg.sensorCnt);
        _appendFile(PATH_SENSOR, &s, sizeof(s), COLD_SENSOR_CAP);
    }

    for (uint8_t i = 0; i < s_stateCount; i++) {
        uint8_t                    idx = (s_stateHead + STATE_CAP - s_stateCount + i) % STATE_CAP;
        const ST_MON_StateEvent_t& e   = s_state[idx];
        if (e.t <= s_agg.lastStateEpochFlushed) continue;
        _appendFile(PATH_STATE, &e, sizeof(e), COLD_STATE_CAP);
    }
    if (s_stateCount > 0) {
        s_agg.lastStateEpochFlushed = s_state[(s_stateHead + STATE_CAP - 1) % STATE_CAP].t;
    }

    for (uint8_t i = 0; i < s_configCount; i++) {
        uint8_t                     idx = (s_configHead + CONFIG_CAP - s_configCount + i) % CONFIG_CAP;
        const ST_MON_ConfigEvent_t& e   = s_config[idx];
        if (e.t <= s_agg.lastConfigEpochFlushed) continue;
        _appendFile(PATH_CONFIG, &e, sizeof(e), COLD_CONFIG_CAP);
    }
    if (s_configCount > 0) {
        s_agg.lastConfigEpochFlushed = s_config[(s_configHead + CONFIG_CAP - 1) % CONFIG_CAP].t;
    }

    for (uint8_t i = 0; i < s_systemCount; i++) {
        uint8_t                     idx = (s_systemHead + SYSTEM_CAP - s_systemCount + i) % SYSTEM_CAP;
        const ST_MON_SystemEvent_t& e   = s_system[idx];
        if (e.t <= s_agg.lastSystemEpochFlushed) continue;
        _appendFile(PATH_SYSTEM, &e, sizeof(e), COLD_SYSTEM_CAP);
    }
    if (s_systemCount > 0) {
        s_agg.lastSystemEpochFlushed = s_system[(s_systemHead + SYSTEM_CAP - 1) % SYSTEM_CAP].t;
    }

    memset(&s_agg, 0, sizeof(s_agg));
    s_agg.windMin = 65535;
    s_agg.tempMin = 32767;
    s_agg.tempMax = -32768;

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[MON] Cold flush done (wind=%u state=%u config=%u sensor=%u system=%u)",
                       s_windCount,
                       s_stateCount,
                       s_configCount,
                       s_sensorCount,
                       s_systemCount);
}

bool CL_MON_Monitor::_appendFile(const char* p_path, const void* p_entry, uint16_t p_entrySize, uint32_t p_capacity) {
    ST_MON_FileHeader_t h;
    if (!_readHeader(p_path, h)) return false;
    if (h.entry_size != p_entrySize) return false;

    uint32_t writePos = h.head;
    size_t   offset   = sizeof(h) + writePos * p_entrySize;

    File f = LittleFS.open(p_path, "r+");
    if (!f) return false;
    f.seek(offset);
    size_t written = f.write((const uint8_t*)p_entry, p_entrySize);

    if (written != p_entrySize) {
        f.close();
        return false;
    }

    h.head = (h.head + 1) % h.capacity;
    if (h.count < h.capacity) h.count++;
    if (h.first_epoch == 0) h.first_epoch = ((const ST_MON_Wind5Min_t*)p_entry)->t;
    h.last_epoch = ((const ST_MON_Wind5Min_t*)p_entry)->t;
    f.seek(0);
    f.write((const uint8_t*)&h, sizeof(h));
    f.close();
    return true;
}

static int _rangeToIntervalSec(const char* p_range) {
    if (!p_range) return 1;
    if (strcmp(p_range, "5m") == 0) return 1;
    if (strcmp(p_range, "30m") == 0) return 5;
    if (strcmp(p_range, "1h") == 0) return 30;
    return 1;
}

static uint32_t _rangeToSec(const char* p_range) {
    if (!p_range) return 300;
    if (strcmp(p_range, "5m") == 0) return 300;
    if (strcmp(p_range, "30m") == 0) return 1800;
    if (strcmp(p_range, "1h") == 0) return 3600;
    return 300;
}

void CL_MON_Monitor::queryWind(const char* p_range, JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    int      itv      = _rangeToIntervalSec(p_range);
    uint32_t rangeSec = _rangeToSec(p_range);
    uint32_t nowEpoch;
    _nowEpoch(nowEpoch);
    uint32_t fromEpoch = (nowEpoch > rangeSec) ? (nowEpoch - rangeSec) : 0;

    JsonObject r  = p_doc.to<JsonObject>();
    r["type"]     = "wind";
    r["range"]    = p_range ? p_range : "5m";
    r["source"]   = "warm";
    r["interval"] = itv;
    r["unit"]     = "0.1m/s";

    JsonArray arr       = r["data"].to<JsonArray>();
    int       pointsOut = 0;

    if (itv == 1) {
        for (uint16_t i = 0; i < s_windCount; i++) {
            uint16_t                idx = (s_windHead + WIND_CAP - s_windCount + i) % WIND_CAP;
            const ST_MON_WindRaw_t& e   = s_wind[idx];
            if (fromEpoch > 0 && e.t < fromEpoch) continue;
            JsonObject o = arr.add<JsonObject>();
            o["t"]       = e.t;
            o["avg"]     = e.wind_x10;
            o["min"]     = e.wind_x10;
            o["max"]     = e.wind_x10;
            o["pwm_avg"] = e.pwm_x10;
            o["preset"]  = e.preset_idx;
            o["gust"]    = (e.flags & 0x01) ? 1 : 0;
            o["thermal"] = (e.flags & 0x02) ? 1 : 0;
            pointsOut++;
        }
    } else {
        int64_t  bucketT = 0;
        uint32_t sum     = 0;
        uint32_t sumPwm  = 0;
        uint16_t minW = 65535, maxW = 0;
        uint16_t cnt     = 0;
        uint16_t gustCnt = 0, thermalCnt = 0;
        uint8_t  curPreset = 0;

        for (uint16_t i = 0; i < s_windCount; i++) {
            uint16_t                idx = (s_windHead + WIND_CAP - s_windCount + i) % WIND_CAP;
            const ST_MON_WindRaw_t& e   = s_wind[idx];
            if (fromEpoch > 0 && e.t < fromEpoch) continue;

            int64_t thisBucket = (e.t / itv) * itv;
            if (bucketT == 0) bucketT = thisBucket;
            if (thisBucket != bucketT) {
                if (cnt > 0) {
                    JsonObject o = arr.add<JsonObject>();
                    o["t"]       = (uint32_t)bucketT;
                    o["avg"]     = (uint16_t)(sum / cnt);
                    o["min"]     = minW;
                    o["max"]     = maxW;
                    o["pwm_avg"] = (uint16_t)(sumPwm / cnt);
                    o["preset"]  = curPreset;
                    o["gust"]    = gustCnt;
                    o["thermal"] = thermalCnt;
                    pointsOut++;
                }
                bucketT    = thisBucket;
                sum        = 0;
                sumPwm     = 0;
                minW       = 65535;
                maxW       = 0;
                cnt        = 0;
                gustCnt    = 0;
                thermalCnt = 0;
            }
            sum    += e.wind_x10;
            sumPwm += e.pwm_x10;
            if (e.wind_x10 < minW) minW = e.wind_x10;
            if (e.wind_x10 > maxW) maxW = e.wind_x10;
            if (e.flags & 0x01) gustCnt++;
            if (e.flags & 0x02) thermalCnt++;
            curPreset = e.preset_idx;
            cnt++;
        }
        if (cnt > 0) {
            JsonObject o = arr.add<JsonObject>();
            o["t"]       = (uint32_t)bucketT;
            o["avg"]     = (uint16_t)(sum / cnt);
            o["min"]     = minW;
            o["max"]     = maxW;
            o["pwm_avg"] = (uint16_t)(sumPwm / cnt);
            o["preset"]  = curPreset;
            o["gust"]    = gustCnt;
            o["thermal"] = thermalCnt;
            pointsOut++;
        }
    }
    r["count"] = pointsOut;
}

void CL_MON_Monitor::queryState(const char* p_range, JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    uint32_t rangeSec = _rangeToSec(p_range);
    uint32_t nowEpoch;
    _nowEpoch(nowEpoch);
    uint32_t fromEpoch = (nowEpoch > rangeSec) ? (nowEpoch - rangeSec) : 0;

    JsonObject r = p_doc.to<JsonObject>();
    r["type"]    = "state";
    r["range"]   = p_range ? p_range : "5m";
    r["source"]  = "warm";

    JsonArray arr = r["data"].to<JsonArray>();
    int       n   = 0;
    for (uint8_t i = 0; i < s_stateCount; i++) {
        uint8_t                    idx = (s_stateHead + STATE_CAP - s_stateCount + i) % STATE_CAP;
        const ST_MON_StateEvent_t& e   = s_state[idx];
        if (fromEpoch > 0 && e.t < fromEpoch) continue;
        JsonObject o     = arr.add<JsonObject>();
        o["t"]           = e.t;
        o["prev"]        = e.prevState;
        o["new"]         = e.newState;
        o["reason"]      = e.reason;
        o["schId"]       = e.activeSchId;
        o["segNo"]       = e.activeSegNo;
        o["profileNo"]   = e.activeProfileNo;
        o["preset"]      = e.preset_idx;
        o["style"]       = e.style_idx;
        o["intensity"]   = e.intensity;
        o["variability"] = e.variability;
        o["gust"]        = e.gustFreq;
        n++;
    }
    r["count"] = n;
}

void CL_MON_Monitor::queryConfig(const char* p_range, JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    uint32_t rangeSec = _rangeToSec(p_range);
    uint32_t nowEpoch;
    _nowEpoch(nowEpoch);
    uint32_t fromEpoch = (nowEpoch > rangeSec) ? (nowEpoch - rangeSec) : 0;

    JsonObject r = p_doc.to<JsonObject>();
    r["type"]    = "config";
    r["range"]   = p_range ? p_range : "5m";

    JsonArray arr = r["data"].to<JsonArray>();
    int       n   = 0;
    for (uint8_t i = 0; i < s_configCount; i++) {
        uint8_t                     idx = (s_configHead + CONFIG_CAP - s_configCount + i) % CONFIG_CAP;
        const ST_MON_ConfigEvent_t& e   = s_config[idx];
        if (fromEpoch > 0 && e.t < fromEpoch) continue;
        JsonObject o = arr.add<JsonObject>();
        o["t"]       = e.t;
        o["type"]    = e.type;
        o["old"]     = e.old_val;
        o["new"]     = e.new_val;
        o["source"]  = e.source;
        n++;
    }
    r["count"] = n;
}

void CL_MON_Monitor::querySensor(const char* p_range, JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    uint32_t rangeSec = _rangeToSec(p_range);
    uint32_t nowEpoch;
    _nowEpoch(nowEpoch);
    uint32_t fromEpoch = (nowEpoch > rangeSec) ? (nowEpoch - rangeSec) : 0;

    JsonObject r = p_doc.to<JsonObject>();
    r["type"]    = "sensor";
    r["range"]   = p_range ? p_range : "5m";
    r["source"]  = "warm";

    JsonArray arr = r["data"].to<JsonArray>();
    int       n   = 0;
    for (uint8_t i = 0; i < s_sensorCount; i++) {
        uint8_t                   idx = (s_sensorHead + SENSOR_CAP - s_sensorCount + i) % SENSOR_CAP;
        const ST_MON_SensorRaw_t& e   = s_sensor[idx];
        if (fromEpoch > 0 && e.t < fromEpoch) continue;
        JsonObject o      = arr.add<JsonObject>();
        o["t"]            = e.t;
        o["temp_avg"]     = e.temp_x10;
        o["temp_min"]     = e.temp_x10;
        o["temp_max"]     = e.temp_x10;
        o["hum_avg"]      = e.humidity;
        o["motion_ratio"] = e.motion ? 255 : 0;
        n++;
    }
    r["count"] = n;
}

void CL_MON_Monitor::querySystem(const char* p_range, JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    uint32_t rangeSec = _rangeToSec(p_range);
    uint32_t nowEpoch;
    _nowEpoch(nowEpoch);
    uint32_t fromEpoch = (nowEpoch > rangeSec) ? (nowEpoch - rangeSec) : 0;

    JsonObject r = p_doc.to<JsonObject>();
    r["type"]    = "system";
    r["range"]   = p_range ? p_range : "5m";

    JsonArray arr = r["data"].to<JsonArray>();
    int       n   = 0;
    for (uint8_t i = 0; i < s_systemCount; i++) {
        uint8_t                     idx = (s_systemHead + SYSTEM_CAP - s_systemCount + i) % SYSTEM_CAP;
        const ST_MON_SystemEvent_t& e   = s_system[idx];
        if (fromEpoch > 0 && e.t < fromEpoch) continue;
        JsonObject o = arr.add<JsonObject>();
        o["t"]       = e.t;
        o["type"]    = e.type;
        o["param1"]  = e.param1;
        o["param2"]  = e.param2;
        n++;
    }
    r["count"] = n;
}

// [MON-E] 지난 이벤트 (State + Config + System 통합, 7일)
void CL_MON_Monitor::queryPastEvents(uint8_t p_days, JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    if (p_days == 0 || p_days > 30) p_days = 7;

    uint32_t nowEpoch;
    _nowEpoch(nowEpoch);
    uint32_t fromEpoch = (nowEpoch > p_days * 86400UL) ? (nowEpoch - p_days * 86400UL) : 0;

    JsonObject r     = p_doc.to<JsonObject>();
    r["days"]        = p_days;
    JsonArray events = r["events"].to<JsonArray>();

    // State
    {
        ST_MON_FileHeader_t h;
        if (_readHeader(PATH_STATE, h)) {
            File f = LittleFS.open(PATH_STATE, "r");
            if (f) {
                f.seek(sizeof(h));
                for (uint32_t i = 0; i < h.count; i++) {
                    ST_MON_StateEvent_t e;
                    if (f.read((uint8_t*)&e, sizeof(e)) != sizeof(e)) break;
                    if (e.t < fromEpoch) continue;
                    JsonObject o = events.add<JsonObject>();
                    o["t"]       = e.t;
                    o["kind"]    = "state";
                    o["prev"]    = e.prevState;
                    o["new"]     = e.newState;
                    o["reason"]  = e.reason;
                    if (e.activeSchId) o["schId"] = e.activeSchId;
                    if (e.activeSegNo) o["segNo"] = e.activeSegNo;
                    if (e.activeProfileNo) o["profileNo"] = e.activeProfileNo;
                }
                f.close();
            }
        }
    }
    // Config
    {
        ST_MON_FileHeader_t h;
        if (_readHeader(PATH_CONFIG, h)) {
            File f = LittleFS.open(PATH_CONFIG, "r");
            if (f) {
                f.seek(sizeof(h));
                for (uint32_t i = 0; i < h.count; i++) {
                    ST_MON_ConfigEvent_t e;
                    if (f.read((uint8_t*)&e, sizeof(e)) != sizeof(e)) break;
                    if (e.t < fromEpoch) continue;
                    JsonObject o = events.add<JsonObject>();
                    o["t"]       = e.t;
                    o["kind"]    = "config";
                    o["type"]    = e.type;
                    o["old"]     = e.old_val;
                    o["new"]     = e.new_val;
                    o["source"]  = e.source;
                }
                f.close();
            }
        }
    }
    // System
    {
        ST_MON_FileHeader_t h;
        if (_readHeader(PATH_SYSTEM, h)) {
            File f = LittleFS.open(PATH_SYSTEM, "r");
            if (f) {
                f.seek(sizeof(h));
                for (uint32_t i = 0; i < h.count; i++) {
                    ST_MON_SystemEvent_t e;
                    if (f.read((uint8_t*)&e, sizeof(e)) != sizeof(e)) break;
                    if (e.t < fromEpoch) continue;
                    JsonObject o = events.add<JsonObject>();
                    o["t"]       = e.t;
                    o["kind"]    = "system";
                    o["type"]    = e.type;
                    o["param1"]  = e.param1;
                    o["param2"]  = e.param2;
                }
                f.close();
            }
        }
    }

    r["count"] = events.size();
}

// [MON-F] CSV 내보내기 (Pre-allocation OOM 방지)
void CL_MON_Monitor::exportCsv(const char* p_type, const char* p_range, bool p_all, String& p_out) {
    CL_A40_MutexGuard_Semaphore v_guard(s_monitorMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        p_out = "error,mutex_timeout\n";
        return;
    }
    p_out.reserve(p_all ? 32768 : 8192);
    p_out = "";

    if (strcmp(p_type, "wind") == 0) {
        p_out += "t,avg,min,max,pwm_avg,preset,gust,thermal\n";
        if (p_all) {
            ST_MON_FileHeader_t h;
            if (_readHeader(PATH_WIND, h)) {
                File f = LittleFS.open(PATH_WIND, "r");
                if (f) {
                    f.seek(sizeof(h));
                    for (uint32_t i = 0; i < h.count; i++) {
                        ST_MON_Wind5Min_t e;
                        if (f.read((uint8_t*)&e, sizeof(e)) != sizeof(e)) break;
                        p_out += String(e.t) + "," + String(e.avg_x10 / 10.0, 1) + "," + String(e.min_x10 / 10.0, 1) +
                                 "," + String(e.max_x10 / 10.0, 1) + "," + String(e.pwm_avg_x10 / 10.0, 1) + "," +
                                 String(e.preset_idx) + "," + String(e.gust_count) + "," + String(e.thermal_count) +
                                 "\n";
                    }
                    f.close();
                }
            }
        } else {
            JsonDocument doc;
            queryWind(p_range, doc);
            for (JsonObject o : doc["data"].as<JsonArray>()) {
                p_out += String(o["t"].as<uint32_t>()) + "," + String(o["avg"].as<float>() / 10.0, 1) + "," +
                         String(o["min"].as<float>() / 10.0, 1) + "," + String(o["max"].as<float>() / 10.0, 1) + "," +
                         String(o["pwm_avg"].as<float>() / 10.0, 1) + "," + String(o["preset"].as<int>()) + "," +
                         String(o["gust"].as<int>()) + "," + String(o["thermal"].as<int>()) + "\n";
            }
        }
    }
}
