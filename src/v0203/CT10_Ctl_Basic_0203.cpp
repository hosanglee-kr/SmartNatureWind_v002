/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Basic_0203.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (Misc)
 * ------------------------------------------------------
 * [Phase 2] checkTriggers() 기반 Pause/Stop 이원화
 *  - initAutoOffFrom* → initRuleFrom* 대체
 *  - checkAutoOff → checkTriggers (pauseMask 기반)
 *  - onAutoOffTriggered/onMotionBlocked → onTriggerStop/onTriggerPause
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"

#include "A40_Com_Utils_0203.h"
#include "N10_NvsManager_0203.h"

#include <DHT.h>

// ==================================================
// DHT 센서 공유 캐시 (기존 유지)
// ==================================================
namespace {
struct ST_CT10_DhtCache {
    DHT*     dht        = nullptr;
    int16_t  pin        = -1;
    uint32_t lastReadMs = 0;
    float    temp       = 24.0f;
    float    hum        = 55.0f;
};
ST_CT10_DhtCache s_dhtCache;

void _ct10_readDhtIfNeeded() {
    if (!g_A20_config_root.system) return;

    const auto& conf = g_A20_config_root.system->hw.tempHum;
    if (!conf.enabled) return;

    int16_t v_pin = (conf.pin > 0) ? (int16_t)conf.pin : 4;

    if (!s_dhtCache.dht) {
        s_dhtCache.pin = v_pin;
        s_dhtCache.dht = new DHT(s_dhtCache.pin, DHT22);
        s_dhtCache.dht->begin();
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] DHT22 init on pin %d", s_dhtCache.pin);
    } else if (s_dhtCache.pin != v_pin) {
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] DHT pin changed (%d->%d). Recommend reboot to apply safely.",
                           s_dhtCache.pin, v_pin);
    }

    uint32_t v_now = millis();
    if (v_now - s_dhtCache.lastReadMs < 2000UL) return;
    s_dhtCache.lastReadMs = v_now;

    float v_t = s_dhtCache.dht ? s_dhtCache.dht->readTemperature() : NAN;
    float v_h = s_dhtCache.dht ? s_dhtCache.dht->readHumidity() : NAN;

    if (isnan(v_t)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT temperature read failed");
    } else {
        s_dhtCache.temp = v_t;
    }
    if (isnan(v_h)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT humidity read failed");
    } else {
        s_dhtCache.hum = v_h;
    }
}
} // namespace

// --------------------------------------------------
// override remain sec
// --------------------------------------------------
uint32_t CL_CT10_ControlManager::calcOverrideRemainSec() const {
    if (!overrideState.active || overrideState.endMs == 0) return 0;
    unsigned long v_nowMs = millis();
    if (overrideState.endMs <= v_nowMs) return 0;
    return (uint32_t)((overrideState.endMs - v_nowMs) / 1000UL);
}

// ═══════════════════════════════════════════════════════════
// [Phase 2] 공통 헬퍼: _session.rule → triggerRt 적용 + 히스테리시스 평가
// ═══════════════════════════════════════════════════════════
void CL_CT10_ControlManager::applyRuleToTriggerRt(const ST_A20_TriggerRule_t& p_rule) {
    triggerRt = {};
    _persistOffTimeLastYday = -1;
    _session.rule = p_rule;

    triggerRt.timerArmed     = _session.rule.timer.enabled;
    triggerRt.timerStartMs   = millis();
    triggerRt.timerMinutes   = _session.rule.timer.minutes;
    triggerRt.offTimeEnabled = _session.rule.offTime.enabled;
    triggerRt.offTimeMinutes = A40_parseHHMMtoMin_24h(_session.rule.offTime.time);

    struct tm tmv{};
    if (CL_TM10_TimeManager::getLocalTime(tmv)) {
        triggerRt.startYday = (int16_t)tmv.tm_yday;
        triggerRt.startMin  = (int16_t)(tmv.tm_hour * 60 + tmv.tm_min);
        triggerRt.offTimeCrossMidnight = (triggerRt.offTimeMinutes <= triggerRt.startMin);
    }
}

static void evalLowPauseHysteresis(const ST_A20_ThresholdRule_t& p_rule,
                                   float p_val, float& r_lastVal,
                                   bool& r_paused, uint8_t& r_mask, uint8_t p_bit) {
    if (!p_rule.enabled || p_rule.mode != EN_A20_RULE_MODE_PAUSE) {
        r_paused = false;
        r_mask &= ~p_bit;
        return;
    }
    r_lastVal = p_val;
    if (p_val < p_rule.threshold) {
        r_paused = true;
        r_mask |= p_bit;
    } else if (p_val >= p_rule.threshold + p_rule.hysteresis) {
        r_paused = false;
        r_mask &= ~p_bit;
    }
}

bool CL_CT10_ControlManager::evalLowPauseHysteresis(bool p_curPaused, float p_val, float p_thr, float p_hys) {
    if (p_curPaused) {
        return (p_val < (p_thr + p_hys));
    } else {
        return (p_val < p_thr);
    }
}

void CL_CT10_ControlManager::initRuleFromProfile(const ST_A20_UserProfileItem_t& p_up) {
    applyRuleToTriggerRt(p_up.rule);
}

void CL_CT10_ControlManager::initRuleFromSchedule(const ST_A20_ScheduleItem_t& p_s) {
    ST_A20_TriggerRule_t v_rule{};
    if (p_s.ruleOverride) {
        v_rule = p_s.rule;
    } else if (g_A20_config_root.userProfiles) {
        auto& profs = *g_A20_config_root.userProfiles;
        bool found = false;
        for (uint8_t i = 0; i < profs.count; ++i) {
            if (profs.items[i].profileId == p_s.profileId) {
                v_rule = profs.items[i].rule;
                found = true;
                break;
            }
        }
        if (!found) {
            // [C2 수정] 상속 실패 시 기본값 (임계값 0 flapping 방지)
            A20_resetTriggerRuleDefault(v_rule);
            CL_D10_Logger::log(EN_L10_LOG_WARN,
                "[CT10] initRuleFromSchedule: profileId=%u not found, use default rule",
                (unsigned)p_s.profileId);
        }
    } else {
        // [C2 수정] userProfiles 없을 때도 기본값
        A20_resetTriggerRuleDefault(v_rule);
    }
    applyRuleToTriggerRt(v_rule);
}

void CL_CT10_ControlManager::initRuleFromPayload(const ST_A20_TriggerRule_t& p_rule) {
    applyRuleToTriggerRt(p_rule);
}

// ═══════════════════════════════════════════════════════════
// [Phase 2] 통합 트리거 검사 (Pause / Stop 이원화)
//  - 반환: true = Stop 또는 Pause 진입 필요
//          false = 모든 조건 정상 (재개 가능)
//  - 우선순위: Stop > Pause
// ═══════════════════════════════════════════════════════════
bool CL_CT10_ControlManager::checkTriggers(EN_CT10_pause_t* p_pauseOut,
                                           EN_CT10_reason_t* p_stopOut) {
    if (p_pauseOut) *p_pauseOut = EN_CT10_PAUSE_NONE;
    if (p_stopOut)  *p_stopOut  = EN_CT10_REASON_NONE;

    const ST_A20_TriggerRule_t& r = _session.rule;
    uint32_t now = millis();

    // ═══════════ 1) STOP 검사 (최우선) ═══════════

    // 1-A. Timer (Pause 누적 시간 보정)
    if (triggerRt.timerArmed && triggerRt.timerMinutes > 0) {
        uint32_t livePausedMs = triggerRt.pausedAccumMs +
            (triggerRt.pauseStartedMs ? (now - triggerRt.pauseStartedMs) : 0UL);
        uint32_t netElapsedMs = (now - triggerRt.timerStartMs > livePausedMs)
                              ? (now - triggerRt.timerStartMs - livePausedMs) : 0UL;
        if (netElapsedMs / 60000UL >= triggerRt.timerMinutes) {
            if (p_stopOut) *p_stopOut = EN_CT10_REASON_AUTOOFF_TIMER;
            CL_D10_Logger::log(EN_L10_LOG_INFO,
                "[CT10] STOP: Timer %u min expired", (unsigned)triggerRt.timerMinutes);
            return true;
        }
    }

    // 1-B. OffTime (자정 넘김 지원)
    if (triggerRt.offTimeEnabled) {
        struct tm tmv;
        memset(&tmv, 0, sizeof(tmv));
        if (CL_TM10_TimeManager::getLocalTime(tmv)) {
            int16_t  yday   = (int16_t)tmv.tm_yday;
            uint16_t curMin = (uint16_t)((uint16_t)tmv.tm_hour * 60U + (uint16_t)tmv.tm_min);
            bool dayReached = triggerRt.offTimeCrossMidnight
                            ? (yday != triggerRt.startYday)
                            : true;
            if (dayReached && curMin >= triggerRt.offTimeMinutes && _persistOffTimeLastYday != yday) {
                _persistOffTimeLastYday = yday;
                triggerRt.offTimeLastYday = yday;
                triggerRt.offTimeLastMin  = (int16_t)curMin;
                if (p_stopOut) *p_stopOut = EN_CT10_REASON_AUTOOFF_TIME;
                return true;
            }
        }
    }

    // ═══════════ 2) 환경 센서 1초 게이트 ═══════════
    bool doEnvCheck = (now - triggerRt.lastEnvCheckMs >= 1000UL) ||
                      (triggerRt.lastEnvCheckMs == 0);

    // 2-A. TempLow STOP (1초 게이트 무관, DHT 캐시 사용)
    if (r.tempLow.enabled && r.tempLow.mode == EN_A20_RULE_MODE_STOP) {
        float t = getCurrentTemperatureMock();
        if (t < r.tempLow.threshold) {
            if (p_stopOut) *p_stopOut = EN_CT10_REASON_TEMP_LOW_STOP;
            CL_D10_Logger::log(EN_L10_LOG_INFO,
                "[CT10] STOP: tempLow %.2f < %.2f", t, r.tempLow.threshold);
            return true;
        }
    }

    // 2-B. DiLow STOP (1초 게이트 무관)
    if (r.diLow.enabled && r.diLow.mode == EN_A20_RULE_MODE_STOP) {
        float di = getDiscomfortIndex();
        if (di < r.diLow.threshold) {
            if (p_stopOut) *p_stopOut = EN_CT10_REASON_DI_LOW_STOP;
            return true;
        }
    }

    // ═══════════ 3) PAUSE 비트마스크 갱신 (수동 재개 1시간 유예 시 스킵) ═══════════
    if (triggerRt.pauseBypassUntilMs > 0 && (int32_t)(now - triggerRt.pauseBypassUntilMs) < 0) {
        triggerRt.pauseMask = 0;
        return false; // STOP 조건(1~2번)은 위에서 이미 감시됨
    }
    triggerRt.pauseBypassUntilMs = 0;

    // 3-A. PIR (M10 getLastDetectedMs() 기반 규칙별 holdSec 평가 + 시작 유예 graceActive)
    if (r.pirPause.enabled && motion != nullptr) {
        uint32_t holdMs = (uint32_t)r.pirPause.holdSec * 1000UL;
        uint32_t lastDet = motion->getLastDetectedMs();
        bool graceActive = (_session.startedAt > 0) && ((now - _session.startedAt) < holdMs);
        bool absent = (lastDet == 0) || ((now - lastDet) >= holdMs);
        if (!graceActive && absent) {
            triggerRt.pauseMask |= CT10_PAUSE_MASK_MOTION;
        } else {
            triggerRt.pauseMask &= ~CT10_PAUSE_MASK_MOTION;
        }
    } else {
        triggerRt.pauseMask &= ~CT10_PAUSE_MASK_MOTION;
    }

    // 3-B/C. 온도/DI (1초 게이트 내 공통 히스테리시스 평가)
    if (doEnvCheck) {
        triggerRt.lastEnvCheckMs = now;
        evalLowPauseHysteresis(r.tempLow, getCurrentTemperatureMock(),
                               triggerRt.lastCheckTempC, triggerRt.tempPaused,
                               triggerRt.pauseMask, CT10_PAUSE_MASK_TEMP);
        evalLowPauseHysteresis(r.diLow, getDiscomfortIndex(),
                               triggerRt.lastCheckDI, triggerRt.diPaused,
                               triggerRt.pauseMask, CT10_PAUSE_MASK_DI);
    }

    // ═══════════ 4) Pause 결과 판정 ═══════════
    if (triggerRt.pauseMask != 0) {
        if (p_pauseOut) {
            if      (triggerRt.pauseMask & CT10_PAUSE_MASK_MOTION) *p_pauseOut = EN_CT10_PAUSE_MOTION;
            else if (triggerRt.pauseMask & CT10_PAUSE_MASK_TEMP)   *p_pauseOut = EN_CT10_PAUSE_TEMP_LOW;
            else if (triggerRt.pauseMask & CT10_PAUSE_MASK_DI)     *p_pauseOut = EN_CT10_PAUSE_DI_LOW;
        }
        return true;
    }

    return false;
}

bool CL_CT10_ControlManager::isPauseResumed() {
    return (runCtx.state == EN_CT10_STATE_ENV_PAUSED && triggerRt.pauseMask == 0);
}

// ═══════════════════════════════════════════════════════════
// Stop 진입 처리
// ═══════════════════════════════════════════════════════════
void CL_CT10_ControlManager::onTriggerStop(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();
    runSource        = EN_CT10_RUN_NONE;
    curScheduleIndex = -1;
    curProfileIndex  = -1;
    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;

    uint32_t v_now = (uint32_t)millis();
    runCtx.state             = EN_CT10_STATE_AUTOOFF_STOPPED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;
    runCtx.stateHoldUntilMs  = v_now + S_EVENT_HOLD_MS;
    runCtx.stateAckRequired  = false;
    runCtx.activeSegId       = 0;
    runCtx.activeSegNo       = 0;

    _autoOffLatched = true;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO,
        "[CT10] STOP triggered (reason=%u, latched=true)", (unsigned)p_reason);
}

// ═══════════════════════════════════════════════════════════
// Pause 진입 처리
// ═══════════════════════════════════════════════════════════
void CL_CT10_ControlManager::onTriggerPause(EN_CT10_pause_t p_pause) {
    if (sim.active) sim.stop();
    uint32_t v_now = (uint32_t)millis();
    runCtx.state             = EN_CT10_STATE_ENV_PAUSED;
    runCtx.pauseReason       = p_pause;
    runCtx.pauseSinceMs      = v_now;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    markDirty("state");
    markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO,
        "[CT10] PAUSE entered (reason=%u)", (unsigned)p_pause);
}

// --------------------------------------------------
// 이벤트 상태 ACK
// --------------------------------------------------
void CL_CT10_ControlManager::ackEventState() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED) return;

    runCtx.stateAckRequired = false;
    runCtx.stateHoldUntilMs = 0;
    _autoOffLatched         = false;

    markDirty("state");
    markDirty("summary");
}

// --------------------------------------------------
// 이벤트 상태 hold/ack 유지 판단
// --------------------------------------------------
bool CL_CT10_ControlManager::shouldHoldEventState() const {
    if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED &&
        runCtx.state != EN_CT10_STATE_TIME_INVALID) {
        return false;
    }
    uint32_t v_now = (uint32_t)millis();
    if (runCtx.stateAckRequired) return true;
    if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) return true;
    return false;
}

// --------------------------------------------------
// 온습도 (DHT 캐시)
// --------------------------------------------------
float CL_CT10_ControlManager::getCurrentTemperatureMock() {
    _ct10_readDhtIfNeeded();
    return s_dhtCache.temp;
}

float CL_CT10_ControlManager::getCurrentHumidityMock() {
    _ct10_readDhtIfNeeded();
    return s_dhtCache.hum;
}

// --------------------------------------------------
// findActiveScheduleIndex (기존 유지)
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg,
                                                    bool                          p_allowOverlap) {
    if (p_cfg.count == 0) return -1;

    struct tm v_tm;
    memset(&v_tm, 0, sizeof(v_tm));
    if (!CL_TM10_TimeManager::getLocalTime(v_tm)) return -1;

    uint8_t  v_today  = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
    uint8_t  v_yday   = (v_today == 0) ? 6 : (uint8_t)(v_today - 1);
    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min;

    if (!p_allowOverlap) {
        for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
            const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
            if (!v_s.enabled) continue;

            uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
            uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

            if (v_startMin == v_endMin) {
                if (v_s.period.days[v_today]) return v_i;
                continue;
            }

            if (v_startMin < v_endMin) {
                if (!v_s.period.days[v_today]) continue;
                if (v_curMin >= v_startMin && v_curMin < v_endMin) return v_i;
            } else {
                if (v_curMin >= v_startMin) {
                    if (!v_s.period.days[v_today]) continue;
                    return v_i;
                } else if (v_curMin < v_endMin) {
                    if (!v_s.period.days[v_yday]) continue;
                    return v_i;
                }
            }
        }
        return -1;
    }

    int      v_bestIdx = -1;
    uint16_t v_bestNo  = 0;

    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
        if (!v_s.enabled) continue;

        uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
        uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

        bool v_match = false;
        if (v_startMin == v_endMin) {
            v_match = v_s.period.days[v_today];
        } else if (v_startMin < v_endMin) {
            if (v_s.period.days[v_today]) {
                v_match = (v_curMin >= v_startMin && v_curMin < v_endMin);
            }
        } else {
            if (v_curMin >= v_startMin) {
                v_match = v_s.period.days[v_today];
            } else if (v_curMin < v_endMin) {
                v_match = v_s.period.days[v_yday];
            }
        }

        if (!v_match) continue;

        if (v_bestIdx < 0 || v_s.schNo > v_bestNo) {
            v_bestIdx = v_i;
            v_bestNo  = v_s.schNo;
        }
    }

    return v_bestIdx;
}

// --------------------------------------------------
// preset/style name lookup (Clean Break: isMotionBlocked 및 deprecated 스텁 제거)
// --------------------------------------------------
const char* CL_CT10_ControlManager::findPresetNameByCode(const char* p_code) const {
    if (!g_A20_config_root.windDict || !p_code || !p_code[0]) return "";

    const ST_A20_WindDict_t& v_dict = *g_A20_config_root.windDict;
    for (uint8_t v_i = 0; v_i < v_dict.presetCount; v_i++) {
        if (strcasecmp(v_dict.presets[v_i].code, p_code) == 0) {
            return v_dict.presets[v_i].name;
        }
    }
    return "";
}

const char* CL_CT10_ControlManager::findStyleNameByCode(const char* p_code) const {
    if (!g_A20_config_root.windDict || !p_code || !p_code[0]) return "";

    const ST_A20_WindDict_t& v_dict = *g_A20_config_root.windDict;
    for (uint8_t v_i = 0; v_i < v_dict.styleCount; v_i++) {
        if (strcasecmp(v_dict.styles[v_i].code, p_code) == 0) {
            return v_dict.styles[v_i].name;
        }
    }
    return "";
}
