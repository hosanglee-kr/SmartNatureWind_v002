/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_Basic_052.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, Misc)
 * ------------------------------------------------------
 * 기능 요약:
 * - AutoOff 초기화/체크, Motion 체크, Schedule 활성 인덱스 계산
 * - Dirty 플래그 관리, override remain 계산, preset/style 이름 조회 유틸
 *
 * ------------------------------------------------------
 * [운영 정책/보완 사항 반영]
 * 1) cross-midnight(자정 넘어감) 스케줄의 0시 이후 구간은 days[어제]로 판단
 * 2) start==end 는 "항상 OFF" 정책으로 통일
 * 3) checkAutoOff(offTime) 재트리거 방지:
 *    - 전역 static 제거 -> autoOffRt 런타임 필드로 관리
 *    - "같은 day + 같은 minute"일 때만 재트리거 방지(하루 1회 보장)
 * 4) shouldHoldEventState():
 *    - 어떤 상태든 hold 금지 -> 이벤트 상태(AUTOOFF_STOPPED / TIME_INVALID)에서만 hold
 * 5) ackEventState():
 *    - ACK 대상은 AUTOOFF_STOPPED만
 *    - MOTION_BLOCKED는 센서 입력으로 자동 해제/재진입 정책
 * 6) onAutoOffTriggered():
 *    - runSource/curIndex는 종료(=NONE)하되
 *    - runCtx snapshot은 유지(단, segId/segNo만 0으로) -> UI에 "마지막 실행 대상 + 멈춘 이유" 표시
 * 7) 시간 불능:
 *    - tick에서 TM10::isTimeValid() 선체크 후 onTimeInvalid() 이벤트 상태로 전환 권장
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

#include "CT10_Control_050.h"
#include <DHT.h>
#include <new> // std::nothrow

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

    // ✅ offTime 재트리거 방지 런타임 초기화
    autoOffRt.offTimeLastTrigYday   = -1;
    autoOffRt.offTimeLastTrigMinute = -1;

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

    // ✅ offTime 재트리거 방지 런타임 초기화
    autoOffRt.offTimeLastTrigYday   = -1;
    autoOffRt.offTimeLastTrigMinute = -1;

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
// - ACK 대상은 AUTOOFF_STOPPED만
// - MOTION_BLOCKED는 센서 입력으로 자동 해제/재진입(ACK 비권장)
// --------------------------------------------------
void CL_CT10_ControlManager::ackEventState() {
    if (runCtx.state != EN_CT10_STATE_AUTOOFF_STOPPED) {
        // 정책: AutoOff 이벤트만 ACK 허용
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] ackEventState ignored (state=%u)", (unsigned)runCtx.state);
        return;
    }

    runCtx.stateAckRequired = false;
    runCtx.stateHoldUntilMs = 0;

    markDirty("state");
    markDirty("summary");
}

// --------------------------------------------------
// [CT10] 이벤트 상태(AUTOOFF/TIME_INVALID 등) hold/ack 유지 판단
// - true 반환 시: "이번 tick은 상태 유지 우선"
// --------------------------------------------------
bool CL_CT10_ControlManager::shouldHoldEventState() const {
    // ✅ 이벤트 상태에서만 hold 정책 적용
    bool v_isEventState =
        (runCtx.state == EN_CT10_STATE_AUTOOFF_STOPPED) ||
        (runCtx.state == EN_CT10_STATE_TIME_INVALID);

    if (!v_isEventState) {
        return false;
    }

    uint32_t v_now = (uint32_t)millis();

    // ACK 요구 상태면: ack 전까지 유지
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
// [CT10] Time Invalid 이벤트 상태 전환(SSOT: tick에서 호출)
// - 시간 불능이면 스케줄 판정을 못하므로 UI에 명확히 표시
// - runSource/인덱스는 유지(시간 복구 시 자동 재개 가능)
// --------------------------------------------------
void CL_CT10_ControlManager::onTimeInvalid(EN_CT10_reason_t p_reason /*= EN_CT10_REASON_TIME_NOT_VALID*/) {
    if (sim.active) sim.stop();

    uint32_t v_now = (uint32_t)millis();

    if (runCtx.state != EN_CT10_STATE_TIME_INVALID) {
        runCtx.state             = EN_CT10_STATE_TIME_INVALID;
        runCtx.reason            = p_reason;
        runCtx.lastStateChangeMs = v_now;
    } else {
        runCtx.reason = p_reason;
    }
    runCtx.lastDecisionMs = v_now;

    // hold 최소 2초(시간 복구/불능이 순간적으로 튀는 경우 UI/로그 안정화)
    runCtx.stateHoldUntilMs = v_now + 2000UL;
    runCtx.stateAckRequired = false;

    // snapshot 유지(마지막 실행 대상 + 멈춘 이유)
    // seg는 "현재 phase"를 강제로 바꾸지 않음(운영 정책)
    // 필요시 updateRunCtxOnSegmentOff()를 tick에서 호출하도록 조정 가능

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] TIME_INVALID (reason=%u, hold=2000ms)", (unsigned)p_reason);
}

// --------------------------------------------------
// [CT10] AutoOff 발생 처리(이벤트성 상태 전환 + hold/ack)
// - runSource/curIndex는 종료(운영 정책)
// - runCtx snapshot은 유지(단, segId/segNo만 0으로) => UI가 "마지막 실행 대상 + 멈춘 이유" 표시 가능
// --------------------------------------------------
void CL_CT10_ControlManager::onAutoOffTriggered(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    // 실행 소스 종료(운영 정책)
    runSource        = EN_CT10_RUN_NONE;
    curScheduleIndex = -1;
    curProfileIndex  = -1;

    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;

    // AutoOff 런타임은 클리어(다음 시작 시 initAutoOffFromXXX에서 재설정)
    memset(&autoOffRt, 0, sizeof(autoOffRt));
    autoOffRt.offTimeLastTrigYday   = -1;
    autoOffRt.offTimeLastTrigMinute = -1;

    uint32_t v_now = (uint32_t)millis();

    runCtx.state             = EN_CT10_STATE_AUTOOFF_STOPPED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    // ✅ hold: 3초 (필요 시 상수화)
    runCtx.stateHoldUntilMs  = v_now + 3000UL;

    // ✅ ACK 정책: AutoOff는 UI에서 확인 후 재개 UX가 자연스러움
    runCtx.stateAckRequired  = true;

    // ✅ snapshot 유지(마지막 대상 유지), seg만 0으로 (현재 phase 종료 표시)
    runCtx.activeSegId = 0;
    runCtx.activeSegNo = 0;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff STOPPED (reason=%u, hold=3000ms, ack=1)", (unsigned)p_reason);
}

// --------------------------------------------------
// autoOff check (Reason 반환 버전)
// - true 반환 시 p_reasonOrNull에 AUTOOFF_* reason 세팅
// - timer/offTime/offTemp 중 "최초로 만족한 조건"을 원인으로 반환
// - offTime 재트리거 방지:
//    * 전역 static 금지 -> autoOffRt.offTimeLastTrigYday / Minute 사용
//    * "같은 day + 같은 minute"일 때만 재트리거 방지(하루 1회 보장)
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

    // 2) offTime (TM10 기반)
    // - “현재 분 >= offTimeMinutes”면 트리거
    // - 하루 1회 정책: same yday + same minute이면 재트리거 방지
    if (autoOffRt.offTimeEnabled) {
        struct tm v_tm;
        memset(&v_tm, 0, sizeof(v_tm));

        if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] AutoOff(offTime) skipped: local time not available");
        } else {
            uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min;
            int16_t  v_yday   = (int16_t)v_tm.tm_yday;

            // 재트리거 방지: 같은 day+minute이면 skip
            if (autoOffRt.offTimeLastTrigYday == v_yday &&
                autoOffRt.offTimeLastTrigMinute == (int16_t)v_curMin) {
                // same minute same day -> do nothing
            } else {
                if (v_curMin >= autoOffRt.offTimeMinutes) {
                    autoOffRt.offTimeLastTrigYday   = v_yday;
                    autoOffRt.offTimeLastTrigMinute = (int16_t)v_curMin;

                    if (p_reasonOrNull) *p_reasonOrNull = EN_CT10_REASON_AUTOOFF_TIME;

                    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(time %u) triggered (yday=%d curMin=%u)",
                                       (unsigned)autoOffRt.offTimeMinutes, (int)v_yday, (unsigned)v_curMin);
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
// Temperature read (mock + DHT)
// - pin 변경 필요: 핀 변경 시 delete/new 재초기화 허용
// - 문제가 되면: "핀 변경 시 재부팅" 운영 정책도 대안
// --------------------------------------------------
float CL_CT10_ControlManager::getCurrentTemperatureMock() {
    static DHT*      s_dht          = nullptr;
    static int16_t   s_dhtPin       = 0;
    static uint32_t  s_lastRead     = 0;
    static float     s_lastTemp     = 24.0f; // Default fallback

    // 1) Config Check
    if (!g_A20_config_root.system) return s_lastTemp;

    const auto& conf = g_A20_config_root.system->hw.tempHum;
    if (!conf.enabled) return 24.0f;

    // 2) Pin 결정(0이면 무효 -> 기본 4)
    int16_t v_pin = (conf.pin > 0) ? (int16_t)conf.pin : 4;

    // 3) Init/Re-init if needed (핀 변경 시 재초기화)
    if (!s_dht || s_dhtPin != v_pin) {
        if (s_dht) {
            delete s_dht;
            s_dht = nullptr;
        }
        s_dhtPin = v_pin;

        // 현재 구현은 DHT22 고정(정책 유지)
        s_dht = new (std::nothrow) DHT(s_dhtPin, DHT22);
        if (!s_dht) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR, "[CT10] DHT alloc failed");
            return s_lastTemp;
        }

        s_dht->begin();
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] DHT22 init on pin %d", s_dhtPin);
    }

    // 4) Read Interval (DHT는 2초 주기)
    uint32_t v_now = millis();
    if (v_now - s_lastRead < 2000UL) return s_lastTemp;
    s_lastRead = v_now;

    // 5) Read Temperature
    float v_t = s_dht->readTemperature();
    if (isnan(v_t)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] DHT read failed");
    } else {
        s_lastTemp = v_t;
    }

    return s_lastTemp;
}

// --------------------------------------------------
// CT10: findActiveScheduleIndex (overlap policy selectable)
// --------------------------------------------------
// [정책]
// 1) 활성 스케줄이 여러 개(겹침)인 경우: schNo가 "큰" 스케줄 우선(운영 정책)
// 2) 시간 구간 판정: [start, end)  (end 시각은 포함하지 않음)
// 3) start==end: 항상 OFF(매치 안 함) 정책으로 통일
// 4) 자정 넘어감(cross-midnight: start > end)일 때 days 처리:
//    - v_curMin >= start  구간([start, 24:00))은 days[오늘]로 판단
//    - v_curMin <  end    구간([00:00, end))은 days[어제]로 판단
//
// * p_allowOverlap=true  : 겹침 허용 → 매치 후보 중 schNo 최댓값 선택
// * p_allowOverlap=false : 겹침 금지 신뢰 → "첫 매치" 즉시 반환(최적화)
//   - 전제: C10 저장 시 schNo desc 정렬 저장이면 첫 매치가 곧 최우선
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg, bool p_allowOverlap /*= true*/) {
    if (p_cfg.count == 0) return -1;

    // TM10 기준: 로컬 시간 확보
    struct tm v_tm;
    memset(&v_tm, 0, sizeof(v_tm));
    if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: local time not available");
        return -1;
    }

    // 요일/분 계산
    // - tm_wday: 0=Sun..6=Sat
    // - Config days[]: 0=Mon..6=Sun
    uint8_t  v_today = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
    uint8_t  v_yday  = (uint8_t)((v_today + 6) % 7);
    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min;

    auto CT10_matchSchedule = [&](const ST_A20_ScheduleItem_t& p_s) -> bool {
        if (!p_s.enabled) return false;

        uint16_t v_startMin = A40_parseHHMMtoMin_24h(p_s.period.startTime);
        uint16_t v_endMin   = A40_parseHHMMtoMin_24h(p_s.period.endTime);

        // start==end : 항상 OFF
        if (v_startMin == v_endMin) return false;

        if (v_startMin < v_endMin) {
            // same-day window: [start, end)
            if (v_curMin < v_startMin || v_curMin >= v_endMin) return false;

            // 요일은 오늘 기준
            if (v_today >= 7 || !p_s.period.days[v_today]) return false;
            return true;
        } else {
            // cross-midnight: [start,1440) U [0,end)
            if (v_curMin >= v_startMin) {
                // 오늘 밤 구간 -> days[오늘]
                if (v_today >= 7 || !p_s.period.days[v_today]) return false;
                return true;
            } else if (v_curMin < v_endMin) {
                // 자정 이후 구간 -> days[어제]
                if (v_yday >= 7 || !p_s.period.days[v_yday]) return false;
                return true;
            }
            return false;
        }
    };

    // (A) 겹침 금지 신뢰: 첫 매치 즉시 반환
    if (!p_allowOverlap) {
        for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
            const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
            if (CT10_matchSchedule(v_s)) {
                return v_i;
            }
        }
        return -1;
    }

    // (B) 겹침 허용: schNo 최댓값 선택
    int      v_bestIdx = -1;
    uint16_t v_bestNo  = 0;

    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
        if (!CT10_matchSchedule(v_s)) continue;

        if (v_bestIdx < 0 || v_s.schNo > v_bestNo) {
            v_bestIdx = v_i;
            v_bestNo  = v_s.schNo;
        }
    }

    return v_bestIdx;
}

// --------------------------------------------------
// [CT10] Motion Block 발생 처리(이벤트성 상태 전환)
// - 정책: motion blocked일 땐 sim.stop()만 하고, runSource는 유지(=presence 복귀 시 자동 재개)
// - ACK 비권장: 센서 입력으로 자동 해제/재진입
// --------------------------------------------------
void CL_CT10_ControlManager::onMotionBlocked(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    runCtx.state             = EN_CT10_STATE_MOTION_BLOCKED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = millis();
    runCtx.lastStateChangeMs = runCtx.lastDecisionMs;

    // 실행 소스/active sch/profile 정보는 유지(재개 UX)
    // seg snapshot도 유지 가능(운영 디버깅에 유리)

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
