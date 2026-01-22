/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Basic_053.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, Misc)
 * ------------------------------------------------------
 * 기능 요약:
 * - AutoOff 초기화/체크, Motion 체크, Schedule 활성 인덱스 계산
 * - Dirty 플래그 관리, override remain 계산, preset/style 이름 조회 유틸
 *
 * [정책 업데이트 요약]
 * - cross-midnight(자정 넘어감) 요일 처리:
 *    - [start, 24:00) 구간: days[오늘]
 *    - [00:00, end) 구간 : days[어제]
 * - start==end: 24시간 활성(하루 종일)
 * - AutoOff offTime 재트리거 방지:
 *    - 전역 static 제거
 *    - autoOffRt에 (lastYday,lastMin)로 “같은 day+minute” 재트리거만 방지
 * - hold/ack 정책:
 *    - hold은 AUTOOFF_STOPPED / TIME_INVALID 에서만 적용
 *    - ACK 대상은 AUTOOFF_STOPPED만 (MOTION_BLOCKED는 센서 입력으로 자동 해제/재진입)
 *
 * ------------------------------------------------------
 * [구현 규칙]
 * - 주석 구조, 네이밍 규칙, ArduinoJson v7 단일 문서 정책 준수
 * - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 * - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 * - JsonDocument 단일 타입만 사용
 * - createNestedArray/Object/containsKey 사용 금지
 * - memset + strlcpy 기반 안전 초기화
 * - 주석/필드명은 JSON 구조와 동일하게 유지
 *
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 * - 전역 상수,매크로      : G_모듈약어_ 접두사
 * - 전역 변수             : g_모듈약어_ 접두사
 * - 전역 함수             : 모듈약어_ 접두사
 * - type                  : T_모듈약어_ 접두사
 * - typedef               : _t  접미사
 * - enum 상수             : EN_모듈약어_ 접두사
 * - 구조체                : ST_모듈약어_ 접두사
 * - 클래스명              : CL_모듈약어_ 접두사
 * - 클래스 private 멤버   : _ 접두사
 * - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 * - 클래스 정적 멤버      : s_ 접두사
 * - 함수 로컬 변수        : v_ 접두사
 * - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include "CT10_Ctl_051.h"
#include <DHT.h>

// --------------------------------------------------
// override remain sec
// --------------------------------------------------
uint32_t CL_CT10_ControlManager::calcOverrideRemainSec() const {
    if (!overrideState.active || overrideState.endMs == 0) return 0;

    unsigned long v_nowMs = millis();
    if (overrideState.endMs <= v_nowMs) return 0;

    return (uint32_t)((overrideState.endMs - v_nowMs) / 1000UL);
}

// --------------------------------------------------
// autoOff init
// --------------------------------------------------
void CL_CT10_ControlManager::initAutoOffFromUserProfile(const ST_A20_UserProfileItem_t& p_up) {
    memset(&autoOffRt, 0, sizeof(autoOffRt));

    // offTime 재트리거 방지 런타임 초기화
    autoOffRt.offTimeLastYday = -1;
    autoOffRt.offTimeLastMin  = -1;

    if (p_up.autoOff.timer.enabled) {
        autoOffRt.timerArmed   = true;
        autoOffRt.timerStartMs = millis();
        autoOffRt.timerMinutes = p_up.autoOff.timer.minutes;
    }
    if (p_up.autoOff.offTime.enabled) {
        autoOffRt.offTimeEnabled = true;
        autoOffRt.offTimeMinutes = A40_parseHHMMtoMin_24h(p_up.autoOff.offTime.time);
    }
    if (p_up.autoOff.offTemp.enabled) {
        autoOffRt.offTempEnabled = true;
        autoOffRt.offTemp        = p_up.autoOff.offTemp.temp;
    }
}

void CL_CT10_ControlManager::initAutoOffFromSchedule(const ST_A20_ScheduleItem_t& p_s) {
    memset(&autoOffRt, 0, sizeof(autoOffRt));

    // offTime 재트리거 방지 런타임 초기화
    autoOffRt.offTimeLastYday = -1;
    autoOffRt.offTimeLastMin  = -1;

    if (p_s.autoOff.timer.enabled) {
        autoOffRt.timerArmed   = true;
        autoOffRt.timerStartMs = millis();
        autoOffRt.timerMinutes = p_s.autoOff.timer.minutes;
    }
    if (p_s.autoOff.offTime.enabled) {
        autoOffRt.offTimeEnabled = true;
        autoOffRt.offTimeMinutes = A40_parseHHMMtoMin_24h(p_s.autoOff.offTime.time);
    }
    if (p_s.autoOff.offTemp.enabled) {
        autoOffRt.offTempEnabled = true;
        autoOffRt.offTemp        = p_s.autoOff.offTemp.temp;
    }
}

// --------------------------------------------------
// [CT10] 이벤트 상태 ACK (UI에서 호출)
// - ACK 대상: AUTOOFF_STOPPED만
// --------------------------------------------------
void CL_CT10_ControlManager::ackEventState() {
    if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED) {
        // 정책: MotionBlocked/TimeInvalid는 ACK로 해제하지 않음
        return;
    }

    runCtx.stateAckRequired = false;
    runCtx.stateHoldUntilMs = 0;

    // ACK 시 즉시 IDLE로 강제하지 않고 다음 tick에서 자연 결정
    markDirty("state");
    markDirty("summary");
}

// --------------------------------------------------
// [CT10] 이벤트 상태 hold/ack 유지 판단
// - hold 적용 상태: AUTOOFF_STOPPED / TIME_INVALID 만
// --------------------------------------------------
bool CL_CT10_ControlManager::shouldHoldEventState() const {
    if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED &&
        runCtx.state != EN_CT10_STATE_TIME_INVALID) {
        return false;
    }

    uint32_t v_now = (uint32_t)millis();

    // ACK 요구 상태면 ack 전까지 유지
    if (runCtx.stateAckRequired) {
        return true;
    }

    // hold 시간 안이면 유지
    if (runCtx.stateHoldUntilMs != 0 && v_now < runCtx.stateHoldUntilMs) {
        return true;
    }

    return false;
}

// --------------------------------------------------
// [CT10] TIME_INVALID 이벤트 상태 전환(SSOT)
// - tickLoop()에서 schedule 진입 전에 선체크하여 호출하는 것을 권장
// - 정책: 실행 소스는 종료(=NONE), UI엔 마지막 snapshot은 유지(단 seg는 0)
// --------------------------------------------------
void CL_CT10_ControlManager::onTimeInvalid(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    // 실행 소스 종료(운영 정책)
    runSource        = EN_CT10_RUN_NONE;
    curScheduleIndex = -1;
    curProfileIndex  = -1;

    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;

    uint32_t v_now = (uint32_t)millis();

    runCtx.state             = EN_CT10_STATE_TIME_INVALID;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    // 최소 hold: 3초
    runCtx.stateHoldUntilMs  = v_now + 3000UL;
    runCtx.stateAckRequired  = false;

    // snapshot 유지(단 seg는 0으로 리셋해서 “지금은 off/정지” 표현에 도움)
    runCtx.activeSegId = 0;
    runCtx.activeSegNo = 0;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] TIME_INVALID (reason=%u, hold=3000ms)", (unsigned)p_reason);
}

// --------------------------------------------------
// [CT10] AutoOff 발생 처리(이벤트성 상태 전환 + hold/ack)
// - 정책:
//   - 실행 소스(runSource/curIndex)는 종료
//   - runCtx snapshot은 유지(“마지막 실행 대상 + 멈춘 이유” 표시)
//   - 단 seg는 0으로(현재는 off/정지 상태를 UI가 표현 가능)
// --------------------------------------------------
void CL_CT10_ControlManager::onAutoOffTriggered(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    // 실행 소스 종료(운영 정책)
    runSource        = EN_CT10_RUN_NONE;
    curScheduleIndex = -1;
    curProfileIndex  = -1;

    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;

    // autoOffRt는 소거(재진입 시 initAutoOff에서 다시 설정)
    memset(&autoOffRt, 0, sizeof(autoOffRt));
    autoOffRt.offTimeLastYday = -1;
    autoOffRt.offTimeLastMin  = -1;

    uint32_t v_now = (uint32_t)millis();

    runCtx.state             = EN_CT10_STATE_AUTOOFF_STOPPED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    // 최소 hold: 3초
    runCtx.stateHoldUntilMs  = v_now + 3000UL;

    // ACK 정책: 기본 false (원하면 true로 바꿔서 UI 확인 후 해제 가능)
    runCtx.stateAckRequired  = false;

    // snapshot 유지(단 seg는 0)
    runCtx.activeSegId = 0;
    runCtx.activeSegNo = 0;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff STOPPED (reason=%u, hold=3000ms)", (unsigned)p_reason);
}

// --------------------------------------------------
// autoOff check (Reason 반환 버전)
// - timer/offTime/offTemp 중 “최초로 만족한 조건”을 reason으로 반환
// - offTime 재트리거 방지:
//   - (tm_yday + minute) 동일할 때만 재트리거 방지
// --------------------------------------------------
bool CL_CT10_ControlManager::checkAutoOff(EN_CT10_reason_t* p_reasonOrNull /*=nullptr*/) {
    if (p_reasonOrNull) {
        *p_reasonOrNull = EN_CT10_REASON_NONE;
    }

    if (!autoOffRt.timerArmed && !autoOffRt.offTimeEnabled && !autoOffRt.offTempEnabled) return false;

    unsigned long v_nowMs = millis();

    // 1) timer
    if (autoOffRt.timerArmed && autoOffRt.timerMinutes > 0) {
        uint32_t v_elapsedMin = (v_nowMs - autoOffRt.timerStartMs) / 60000UL;
        if (v_elapsedMin >= autoOffRt.timerMinutes) {
            if (p_reasonOrNull) *p_reasonOrNull = EN_CT10_REASON_AUTOOFF_TIMER;
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(timer %lu min) triggered",
                               (unsigned long)autoOffRt.timerMinutes);
            return true;
        }
    }

    // 2) offTime (TM10)
    if (autoOffRt.offTimeEnabled) {
        struct tm v_tm;
        memset(&v_tm, 0, sizeof(v_tm));

        if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
            // 시간 불능이면 여기서 트리거하지 않음(상위 tick에서 TIME_INVALID로 처리 권장)
        } else {
            int16_t  v_yday   = (int16_t)v_tm.tm_yday;
            int16_t  v_curMin = (int16_t)((uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min);

            // 정책: 같은 (yday + minute)일 때만 재트리거 방지
            bool v_already = (autoOffRt.offTimeLastYday == v_yday && autoOffRt.offTimeLastMin == v_curMin);

            if (!v_already) {
                if ((uint16_t)v_curMin >= autoOffRt.offTimeMinutes) {
                    autoOffRt.offTimeLastYday = v_yday;
                    autoOffRt.offTimeLastMin  = v_curMin;

                    if (p_reasonOrNull) *p_reasonOrNull = EN_CT10_REASON_AUTOOFF_TIME;

                    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(time %u) triggered",
                                       (unsigned)autoOffRt.offTimeMinutes);
                    return true;
                }
            }
        }
    }

    // 3) offTemp
    if (autoOffRt.offTempEnabled) {
        float v_curTemp = getCurrentTemperatureMock();
        if (v_curTemp >= autoOffRt.offTemp) {
            if (p_reasonOrNull) *p_reasonOrNull = EN_CT10_REASON_AUTOOFF_TEMP;
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(temp %.1fC >= %.1fC) triggered",
                               v_curTemp, autoOffRt.offTemp);
            return true;
        }
    }

    return false;
}

// --------------------------------------------------
// temperature mock (DHT)
// - 운영 안정성: new/delete 반복 금지
// - 정책:
//   - 최초 1회만 new
//   - 핀 변경 감지 시: 재부팅 권고 로그 + 기존 객체 유지(안전 우선)
// --------------------------------------------------
float CL_CT10_ControlManager::getCurrentTemperatureMock() {
    static DHT*     s_dht          = nullptr;
    static int16_t  s_dhtPin       = -1;
    static uint32_t s_lastRead     = 0;
    static float    s_lastTemp     = 24.0f;

    if (!g_A20_config_root.system) return s_lastTemp;

    const auto& conf = g_A20_config_root.system->hw.tempHum;
    if (!conf.enabled) return 24.0f;

    int16_t v_pin = (conf.pin > 0) ? (int16_t)conf.pin : 4;

    if (!s_dht) {
        s_dhtPin = v_pin;
        s_dht = new DHT(s_dhtPin, DHT22);
        s_dht->begin();
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] DHT22 init on pin %d", s_dhtPin);
    } else if (s_dhtPin != v_pin) {
        // 운영 안정성 우선: delete/re-init 하지 않음
        CL_D10_Logger::log(EN_L10_LOG_WARN,
                           "[CT10] DHT pin changed (%d->%d). Recommend reboot to apply safely.",
                           s_dhtPin, v_pin);
        // 계속 기존 핀의 센서 값을 유지(또는 fallback)
    }

    uint32_t v_now = millis();
    if (v_now - s_lastRead < 2000UL) return s_lastTemp;
    s_lastRead = v_now;

    float v_t = s_dht ? s_dht->readTemperature() : NAN;
    if (isnan(v_t)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT read failed");
    } else {
        s_lastTemp = v_t;
    }

    return s_lastTemp;
}

// --------------------------------------------------
// CT10: findActiveScheduleIndex (overlap policy selectable)
// - start==end: 24시간 활성(하루 종일)
// - cross-midnight days 정책:
//   - [start, 24:00) : days[오늘]
//   - [00:00, end)   : days[어제]
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg, bool p_allowOverlap /*= true*/) {
    if (p_cfg.count == 0) return -1;

    struct tm v_tm;
    memset(&v_tm, 0, sizeof(v_tm));
    if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
        // tickLoop에서 TIME_INVALID 처리 권장
        return -1;
    }

    // tm_wday: 0=Sun..6=Sat
    // Config days[]: 0=Mon..6=Sun
    uint8_t  v_today = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
    uint8_t  v_yday  = (v_today == 0) ? 6 : (uint8_t)(v_today - 1);
    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min;

    // 겹침 금지 신뢰(최적화): 첫 매치 즉시 반환
    if (!p_allowOverlap) {
        for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
            const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
            if (!v_s.enabled) continue;

            uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
            uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

            // ✅ start==end: 24시간 활성(하루 종일) - 오늘 요일만 체크
            if (v_startMin == v_endMin) {
                if (v_s.period.days[v_today]) return v_i;
                continue;
            }

            if (v_startMin < v_endMin) {
                // same-day window: 오늘 요일 체크
                if (!v_s.period.days[v_today]) continue;
                if (v_curMin >= v_startMin && v_curMin < v_endMin) return v_i;
            } else {
                // cross-midnight
                if (v_curMin >= v_startMin) {
                    // [start, 24:00): 오늘 요일
                    if (!v_s.period.days[v_today]) continue;
                    return v_i;
                } else if (v_curMin < v_endMin) {
                    // [00:00, end): 어제 요일
                    if (!v_s.period.days[v_yday]) continue;
                    return v_i;
                }
            }
        }
        return -1;
    }

    // 겹침 허용: schNo 최댓값 선택
    int      v_bestIdx = -1;
    uint16_t v_bestNo  = 0;

    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
        if (!v_s.enabled) continue;

        uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
        uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

        bool v_match = false;

        if (v_startMin == v_endMin) {
            // 24시간 활성: 오늘 요일만 체크
            v_match = v_s.period.days[v_today];
        } else if (v_startMin < v_endMin) {
            // same-day: 오늘 요일
            if (v_s.period.days[v_today]) {
                v_match = (v_curMin >= v_startMin && v_curMin < v_endMin);
            }
        } else {
            // cross-midnight
            if (v_curMin >= v_startMin) {
                // [start, 24:00): 오늘 요일
                v_match = v_s.period.days[v_today];
            } else if (v_curMin < v_endMin) {
                // [00:00, end): 어제 요일
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
// [CT10] Motion Block 발생 처리(이벤트성 상태 전환)
// - 정책: MotionBlocked는 ACK/hold 대상 아님(센서 입력으로 자동 해제/재진입)
// --------------------------------------------------
void CL_CT10_ControlManager::onMotionBlocked(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    runCtx.state             = EN_CT10_STATE_MOTION_BLOCKED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = millis();
    runCtx.lastStateChangeMs = runCtx.lastDecisionMs;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] MOTION_BLOCKED (reason=%u)", (unsigned)p_reason);
}

// --------------------------------------------------
// motion check
// --------------------------------------------------
bool CL_CT10_ControlManager::isMotionBlocked(const ST_A20_Motion_t& p_motionCfg) {
    if (!motion) return false;
    if (!p_motionCfg.pir.enabled && !p_motionCfg.ble.enabled) return false;

    bool v_presenceActive = motion->isActive();
    if (!v_presenceActive) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] Motion blocked (no presence)");
        return true;
    }
    return false;
}

// --------------------------------------------------
// preset/style name lookup (log 개선용)
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
