/*
 * ------------------------------------------------------
 * 소스명 : S10_Simul_IO_0202.cpp
 * 모듈약어 : S10
 * 모듈명 : Smart Nature Wind 풍속 시뮬레이션 Manager (IO)
 * ------------------------------------------------------
 * 기능 요약:
 * - toJson / toChartJson / patchFromJson
 * - 최근 풍속 이력 관리 (순환 버퍼)
 *
 * [Batch D-5] toChartJson 힙 할당 제거
 *  - std::vector<ST_ChartEntry> → static 고정 배열 (CHART_CAPACITY)
 *  - <vector> include 제거
 *  - 안전성: toChartJson은 loopTask 전용, _recursiveMutex 보유 하에서만 채움
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <freertos/semphr.h>
#include <cstring>
#include <cstdio>
// [D-5] <vector> 제거 (toChartJson 고정 배열 전환)

#include "A20_Const_0202.h"
#include "A40_Com_Utils_0202.h"
#include "A22_Com_Lookup_0202.h"
#include "C10_Config_0202.h"
#include "D10_Logger_0202.h"
#include "P10_PWM_ctrl_0202.h"
#include "S10_Simul_0202.h"

// ------------------------------------------------------
// 정적 멤버 정의
// ------------------------------------------------------
CL_S10_Simulation::ST_ChartEntry CL_S10_Simulation::s_chartBuffer[CL_S10_Simulation::CHART_CAPACITY];
uint8_t                          CL_S10_Simulation::s_chartHead            = 0;
uint8_t                          CL_S10_Simulation::s_chartCount           = 0;
unsigned long                    CL_S10_Simulation::s_lastChartLogMs       = 0;
unsigned long                    CL_S10_Simulation::s_lastChartSampleMs    = 0;

// ==================================================
// toJson
// ==================================================
void CL_S10_Simulation::toJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_MutxGuard(_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);

    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[S10] %s: Mutex timeout", __func__);
        return;
    }

    JsonObject v_objSim = p_doc["sim"].to<JsonObject>();

    v_objSim["active"]          = active;
    v_objSim["fanPowerEnabled"] = fanPowerEnabled;

    v_objSim["phase"] = (phase < EN_A20_WIND_PHASE_COUNT) ? G_A20_WindPhase_Arr[(uint8_t)phase].code
                                                          : G_A20_WindPhase_Arr[(uint8_t)EN_A20_WIND_PHASE_NORMAL].code;

    v_objSim["windSpeed"]  = currentWindSpeed;
    v_objSim["targetWind"] = targetWindSpeed;

    v_objSim["gustActive"]    = gustActive;
    v_objSim["thermalActive"] = thermalActive;

    v_objSim["pwmDuty"] = _pwm ? _pwm->P10_getDutyPercent() : 0.0f;

    v_objSim["presetCode"] = presetCode;
    v_objSim["styleCode"]  = styleCode;

    v_objSim["intensity"]   = userIntensity;
    v_objSim["variability"] = userVariability;
    v_objSim["gustFreq"]    = userGustFreq;

    v_objSim["fanLimit"] = fanLimitPct;
    v_objSim["minFan"]   = minFanPct;

    v_objSim["turbSigma"]    = turbSigma;
    v_objSim["turbLenScale"] = turbLenScale;

    v_objSim["thermalStrength"] = thermalStrength;
    v_objSim["thermalRadius"]   = thermalRadius;

    v_objSim["baseMinWind"]     = baseMinWind;
    v_objSim["baseMaxWind"]     = baseMaxWind;
    v_objSim["gustProbBase"]    = gustProbBase;
    v_objSim["gustStrengthMax"] = gustStrengthMax;
    v_objSim["thermalFreqBase"] = thermalFreqBase;
}

// ==================================================
// [D-5] toChartJson (고정 static 배열)
// ==================================================
void CL_S10_Simulation::toChartJson(JsonDocument& p_doc, bool p_diffOnly) {
    unsigned long v_nowMs = _tickNowMs;
    if (v_nowMs == 0UL) {
        v_nowMs = millis();
    }

    // 스냅샷 필드
    EN_A20_WindPhase_t v_phase           = EN_A20_WIND_PHASE_NORMAL;
    float              v_avg             = 0.0f;
    bool               v_gust            = false;
    bool               v_therm           = false;
    uint8_t            v_samp            = 0;
    uint8_t            v_presetIdx       = 0;
    float              v_intensity       = 0.0f;
    float              v_variability     = 0.0f;
    float              v_gustFreq        = 0.0f;
    float              v_fanLimit        = 0.0f;
    float              v_minFan          = 0.0f;
    float              v_turbSigma       = 0.0f;
    float              v_turbLenScale    = 0.0f;
    float              v_thermalStr      = 0.0f;
    float              v_thermalRad      = 0.0f;
    uint16_t           v_simInterval     = 100;
    uint16_t           v_gustInterval    = 500;
    uint16_t           v_thermalInterval = 2000;

    // ==================================================
    // [D-5] 힙 할당 제거: std::vector → static 배열
    //  - CHART_CAPACITY(120) × ~40B = 4.8KB .bss
    //  - toChartJson은 loopTask 전용 (CT10::exportChartJson 경유)
    //  - _recursiveMutex 보유 하에서 채우고, 락 해제 후 읽음
    // ==================================================
    static ST_ChartEntry s_snapshot[CHART_CAPACITY];
    uint8_t v_snapCount = 0;

    {
        CL_A40_MutexGuard_Semaphore v_MutxGuard(_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
        if (!v_MutxGuard.isAcquired()) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[S10] %s: Mutex timeout", __func__);
            return;
        }

        v_phase        = phase;
        v_avg          = _getAvgWindFast();
        v_gust         = gustActive;
        v_therm        = thermalActive;
        v_samp         = historyCount;
        v_intensity    = userIntensity;
        v_variability  = userVariability;
        v_gustFreq     = userGustFreq;
        v_fanLimit     = fanLimitPct;
        v_minFan       = minFanPct;
        v_turbSigma    = turbSigma;
        v_turbLenScale = turbLenScale;
        v_thermalStr   = thermalStrength;
        v_thermalRad   = thermalRadius;

        for (uint8_t i = 0; i < (uint8_t)EN_A20_WINDPRESET_COUNT; i++) {
            if (strcasecmp(presetCode, G_A20_WindPreset_Arr[i].code) == 0) {
                v_presetIdx = i;
                break;
            }
        }

        if (g_A20_config_root.motion) {
            v_simInterval     = g_A20_config_root.motion->timing.simIntervalMs;
            v_gustInterval    = g_A20_config_root.motion->timing.gustIntervalMs;
            v_thermalInterval = g_A20_config_root.motion->timing.thermalIntervalMs;
        }

        // empty guard
        if (s_chartCount == 0) {
            return;
        }

        // Full Dump 전송 간격 제한
        if (!p_diffOnly) {
            const unsigned long v_elapsedMs = (v_nowMs >= s_lastChartSampleMs) ? (v_nowMs - s_lastChartSampleMs) : 0UL;
            if (v_elapsedMs < G_S10_CHART_FULL_MIN_MS) {
                return;
            }
            s_lastChartSampleMs = v_nowMs;
        }

        if (p_diffOnly) {
            uint8_t v_lastIdx = (s_chartHead == 0) ? (CHART_CAPACITY - 1) : (s_chartHead - 1);
            s_snapshot[0] = s_chartBuffer[v_lastIdx];
            v_snapCount   = 1;
        } else {
            uint8_t v_start = (s_chartCount < CHART_CAPACITY) ? 0 : s_chartHead;
            for (uint8_t v_i = 0; v_i < s_chartCount; v_i++) {
                uint8_t v_idx = (uint8_t)((v_start + v_i) % CHART_CAPACITY);
                s_snapshot[v_i] = s_chartBuffer[v_idx];
            }
            v_snapCount = s_chartCount;
        }
    } // 락 해제

    // JSON 생성 (락 밖)
    JsonArray v_arr = p_doc["chart"].to<JsonArray>();

    for (uint8_t v_i = 0; v_i < v_snapCount; v_i++) {
        const ST_ChartEntry& v_e  = s_snapshot[v_i];
        JsonObject           v_jo = v_arr.add<JsonObject>();

        v_jo["t"]           = (uint64_t)v_e.timestamp;
        v_jo["wind"]        = v_e.wind_speed;
        v_jo["targetWind"]  = v_e.target_wind;
        v_jo["pwm"]         = v_e.pwm_duty;
        v_jo["intensity"]   = v_intensity;
        v_jo["variability"] = v_variability;
        v_jo["gustFreq"]    = v_gustFreq;
        v_jo["fanLimit"]    = v_fanLimit;
        v_jo["minFan"]      = v_minFan;
        v_jo["turb_sig"]    = v_turbSigma;
        v_jo["turb_len"]    = v_turbLenScale;
        v_jo["therm_str"]   = v_thermalStr;
        v_jo["therm_rad"]   = v_thermalRad;
        v_jo["gust"]        = v_e.gust_active ? 1 : 0;
        v_jo["thermal"]     = v_e.thermal_active ? 1 : 0;
        v_jo["preset"]      = v_presetIdx;
        v_jo["sim_int"]     = v_simInterval;
        v_jo["gust_int"]    = v_gustInterval;
        v_jo["thermal_int"] = v_thermalInterval;
    }
}

// ==================================================
// patchFromJson
// ==================================================
bool CL_S10_Simulation::patchFromJson(const JsonDocument& p_doc) {
    bool v_changed           = false;
    bool v_needPresetReapply = false;
    bool v_needPhaseReset    = false;

    CL_A40_MutexGuard_Semaphore v_MutxGuard(_recursiveMutex, G_A40_MUTEX_TIMEOUT_100, __func__);

    if (!v_MutxGuard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[S10] %s: Mutex timeout", __func__);
        return false;
    }

    JsonObjectConst v_sim = p_doc["sim"].as<JsonObjectConst>();
    if (v_sim.isNull()) {
        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[S10] patchFromJson failed: 'sim' object not found.");
        return false;
    }

    if (!v_sim["presetCode"].isNull() && v_sim["presetCode"].is<const char*>()) {
        const char* v_new = v_sim["presetCode"].as<const char*>();
        if (v_new && v_new[0] && strcasecmp(v_new, presetCode) != 0) {
            memset(presetCode, 0, sizeof(presetCode));
            strlcpy(presetCode, v_new, sizeof(presetCode));
            v_changed           = true;
            v_needPresetReapply = true;
            v_needPhaseReset    = true;
        }
    }

    if (!v_sim["styleCode"].isNull() && v_sim["styleCode"].is<const char*>()) {
        const char* v_new = v_sim["styleCode"].as<const char*>();
        if (v_new && v_new[0] && strcasecmp(v_new, styleCode) != 0) {
            memset(styleCode, 0, sizeof(styleCode));
            strlcpy(styleCode, v_new, sizeof(styleCode));
            v_changed = true;
        }
    }

    if (!v_sim["fanPowerEnabled"].isNull()) {
        const bool v_new = v_sim["fanPowerEnabled"].as<bool>();
        if (v_new != fanPowerEnabled) {
            fanPowerEnabled = v_new;
            v_changed       = true;
        }
    }

    if (!v_sim["intensity"].isNull()) {
        const float v_new = constrain(v_sim["intensity"].as<float>(), 0.0f, 100.0f);
        if (v_new != userIntensity) {
            userIntensity = v_new;
            v_changed     = true;
        }
    }

    if (!v_sim["variability"].isNull()) {
        const float v_new = constrain(v_sim["variability"].as<float>(), 0.0f, 100.0f);
        if (v_new != userVariability) {
            userVariability       = v_new;
            const float v_varNorm = userVariability / 100.0f;
            windChangeRate        = constrain(0.10f + v_varNorm * 0.20f, 0.06f, 0.34f);
            v_changed             = true;
        }
    }

    if (!v_sim["gustFreq"].isNull()) {
        const float v_new = constrain(v_sim["gustFreq"].as<float>(), 0.0f, 100.0f);
        if (v_new != userGustFreq) {
            userGustFreq = v_new;
            v_changed    = true;
        }
    }

    bool  v_minOrLimitChanged = false;
    float v_limit             = fanLimitPct;
    float v_min               = minFanPct;

    if (!v_sim["fanLimit"].isNull()) {
        const float v_new = constrain(v_sim["fanLimit"].as<float>(), 0.0f, 100.0f);
        if (v_new != v_limit) {
            v_limit             = v_new;
            v_minOrLimitChanged = true;
        }
    }

    if (!v_sim["minFan"].isNull()) {
        const float v_new = constrain(v_sim["minFan"].as<float>(), 0.0f, 100.0f);
        if (v_new != v_min) {
            v_min               = v_new;
            v_minOrLimitChanged = true;
        }
    }

    if (v_minOrLimitChanged) {
        if (v_min > v_limit) {
            v_min = v_limit;
        }
        if (v_limit != fanLimitPct || v_min != minFanPct) {
            fanLimitPct = v_limit;
            minFanPct   = v_min;
            v_changed   = true;
        }
    }

    if (!v_sim["turbLenScale"].isNull()) {
        const float v_new = max(1.0f, v_sim["turbLenScale"].as<float>());
        if (v_new != turbLenScale) {
            turbLenScale = v_new;
            v_changed    = true;
        }
    }

    if (!v_sim["turbSigma"].isNull()) {
        const float v_new = max(0.0f, v_sim["turbSigma"].as<float>());
        if (v_new != turbSigma) {
            turbSigma = v_new;
            v_changed = true;
        }
    }

    if (!v_sim["thermalStrength"].isNull()) {
        const float v_new = max(1.0f, v_sim["thermalStrength"].as<float>());
        if (v_new != thermalStrength) {
            thermalStrength = v_new;
            v_changed       = true;
        }
    }

    if (!v_sim["thermalRadius"].isNull()) {
        const float v_new = max(0.0f, v_sim["thermalRadius"].as<float>());
        if (v_new != thermalRadius) {
            thermalRadius = v_new;
            v_changed     = true;
        }
    }

    if (v_needPresetReapply) {
        applyPresetCore(presetCode);
    }
    if (v_needPhaseReset) {
        if (_tickNowMs == 0UL) {
            _tickNowMs  = millis();
            _tickNowSec = (float)_tickNowMs / 1000.0f;
        }
        initPhaseFromBase();
    }

    if (v_changed) {
        CL_D10_Logger::log(EN_L10_LOG_INFO,
                           "[S10] patchFromJson applied. preset=%s style=%s intensity=%.1f var=%.1f gust=%.1f "
                           "fanLimit=%.1f minFan=%.1f turbSigma=%.2f",
                           presetCode,
                           styleCode,
                           userIntensity,
                           userVariability,
                           userGustFreq,
                           fanLimitPct,
                           minFanPct,
                           turbSigma);
    }

    return v_changed;
}

// --------------------------------------------------
// 최근 풍속 이력 관리
// --------------------------------------------------
void CL_S10_Simulation::_updateWindHistory(float p_speed) {
    if (historyCount < HISTORY_SIZE) {
        history[historyIndex] = p_speed;
        historyIndex          = (uint8_t)((historyIndex + 1u) % HISTORY_SIZE);
        historyCount++;
        sumWindHistory += p_speed;
        avgWindCached   = sumWindHistory / (float)historyCount;
    } else {
        float v_old = history[historyIndex];
        history[historyIndex] = p_speed;
        historyIndex          = (uint8_t)((historyIndex + 1u) % HISTORY_SIZE);
        sumWindHistory += (p_speed - v_old);
        avgWindCached   = sumWindHistory / (float)HISTORY_SIZE;
    }
}

float CL_S10_Simulation::_getAvgWindFast() const {
    return (historyCount > 0) ? avgWindCached : currentWindSpeed;
}
