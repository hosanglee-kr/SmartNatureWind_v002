/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_Basic_051.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, Misc)
 * ------------------------------------------------------
 * 기능 요약:
 * - AutoOff 초기화/체크, Motion 체크, Schedule 활성 인덱스 계산
 * - Dirty 플래그 관리, override remain 계산, preset/style 이름 조회 유틸
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



// --------------------------------------------------
// [CT10] runCtx snapshot helpers (최소)
// - SegmentOn/Off에서만 호출
// - schedule/profile 공통으로 "현재 구동 중 대상"을 UI에 보여주기 위한 목적
// --------------------------------------------------
static inline void CT10_resetActiveSegSnapshot(ST_CT10_RunContext_t& p_ctx) {
	p_ctx.activeSegId = 0;
	p_ctx.activeSegNo = 0;
}


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
// - AUTOOFF_STOPPED 같은 이벤트 상태를 사용자 확인 후 해제
// --------------------------------------------------
void CL_CT10_ControlManager::ackEventState() {
    runCtx.stateAckRequired = false;
    runCtx.stateHoldUntilMs = 0;

    // ACK 시점에 바로 IDLE로 돌리진 않고, 다음 tick에서 자연스럽게 결정되게 둠(최소 정책)
    markDirty("state");
    markDirty("summary");
}


// --------------------------------------------------
// [CT10] 이벤트 상태(AUTOOFF/MOTION 등) hold/ack 유지 판단
// - true 반환 시: "이번 tick은 상태 유지 우선" (즉, 실행 로직 최소화)
// --------------------------------------------------
bool CL_CT10_ControlManager::shouldHoldEventState() const {
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
// [CT10] AutoOff 발생 처리(이벤트성 상태 전환)
// - checkAutoOff()에서 원인(reason)을 받아 AUTOOFF_STOPPED로 상태 전환
// - 최소 정책: AutoOff 발생 시 현재 실행 소스(runSource)를 종료(=NONE)로 만든다.
// --------------------------------------------------
// --------------------------------------------------
// [CT10] AutoOff 발생 처리(이벤트성 상태 전환 + hold/ack)
// --------------------------------------------------
void CL_CT10_ControlManager::onAutoOffTriggered(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    // 실행 소스 종료(운영 정책)
    runSource        = EN_CT10_RUN_NONE;
    curScheduleIndex = -1;
    curProfileIndex  = -1;

    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;
    memset(&autoOffRt, 0, sizeof(autoOffRt));

    uint32_t v_now = (uint32_t)millis();

    runCtx.state             = EN_CT10_STATE_AUTOOFF_STOPPED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    // ✅ 최소 hold: 3초 (원하면 상수화)
    runCtx.stateHoldUntilMs  = v_now + 3000UL;

    // ✅ ACK 정책(옵션): 기본 false
    runCtx.stateAckRequired  = false;

    runCtx.activeSchId = 0;
    runCtx.activeSchNo = 0;
    runCtx.activeSegId = 0;
    runCtx.activeSegNo = 0;
    runCtx.activeProfileNo = 0;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff STOPPED (reason=%u, hold=3000ms)", (unsigned)p_reason);
}


// --------------------------------------------------
// autoOff check (Reason 반환 버전)
// - true 반환 시 p_reasonOrNull에 AUTOOFF_* reason 세팅
// - 최소 패치: timer/offTime/offTemp 중 "최초로 만족한 조건"을 원인으로 반환
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

	// 2) offTime (TM10 기반으로 이미 리팩토링했다는 전제)
	// - “현재 분 >= offTimeMinutes”면 트리거
	// - 동일 분 재트리거 방지 (기존 정책 유지)
	if (autoOffRt.offTimeEnabled) {
		static int32_t s_lastTriggeredMinute = -1;

		struct tm v_tm;
		memset(&v_tm, 0, sizeof(v_tm));

		// ✅ CT10_localtimeSafe 제거 방향: TM10 기준으로만 분기
		if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
			CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] AutoOff(offTime) skipped: local time not available");
		} else {
			uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

			if ((int32_t)v_curMin != s_lastTriggeredMinute) {
				if (v_curMin >= autoOffRt.offTimeMinutes) {
					s_lastTriggeredMinute = (int32_t)v_curMin;
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



float CL_CT10_ControlManager::getCurrentTemperatureMock() {
	// 운영 방어:
	// - system 설정 포인터 null 방어
	// - 센서 비활성 시 고정 fallback
	// - DHT는 2초 주기 읽기
	static DHT* s_dht          = nullptr;
	static int16_t  s_dhtPin   = 0;
	static uint32_t s_lastRead = 0;
	static float s_lastTemp    = 24.0f;  // Default fallback

	// 1) Config Check
	if (!g_A20_config_root.system) return s_lastTemp;

	const auto& conf = g_A20_config_root.system->hw.tempHum;
	if (!conf.enabled) return 24.0f;

	// 2) Pin 결정(0이면 무효)
	int16_t v_pin = (conf.pin > 0) ? (int16_t)conf.pin : 4;

	// 3) Init/Re-init if needed (핀 변경 시 재초기화)
	if (!s_dht || s_dhtPin != v_pin) {
		if (s_dht) {
			// 라이브러리 상 delete 가능. (운영: 핀 변경은 흔치 않으나 방어)
			delete s_dht;
			s_dht = nullptr;
		}
		s_dhtPin = v_pin;

		// 현재는 type 필드를 쓰더라도, 구현은 DHT22 고정(기존 코드 정책 유지)
		s_dht = new DHT(s_dhtPin, DHT22);
		s_dht->begin();

		CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] DHT22 init on pin %d", s_dhtPin);
	}

	// 4) Read Interval
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
// find active schedule (schNo 큰 것 우선 + 자정 넘어감 + days 처리)
// --------------------------------------------------
// [정책]
// 1) 활성 스케줄이 여러 개(겹침)인 경우: schNo가 "큰" 스케줄이 우선(운영 정책)
// 2) 시간 구간 판정: [start, end)  (end 시각은 포함하지 않음)
// 3) start==end:
//    - 권장 정책: 24시간 활성(하루 종일)
//    - (만약 "항상 OFF"가 필요하면 여기만 바꾸면 됨)
// 4) 자정 넘어감(over-night: start > end)일 때 days 처리:
//    - [start, 24:00) 구간은 "오늘 요일(days[오늘])"로 판단
//    - [00:00, end) 구간은 "어제 요일(days[어제])"로 판단
//      (즉, 전날 밤에 시작한 스케줄이 자정 넘어 계속되는 것을 정상 반영)
//
// [주의]
// - A40_parseHHMMtoMin_24h()이 "24:00"을 1440으로 반환하도록 보완되면,
//   endMin==1440 케이스는 same-day window로 자연스럽게 동작한다.
// - 이 함수는 "겹침을 허용"하되, 우선순위로 1개만 선택한다.
//   (저장 시 겹침 예외 처리/차단은 별도 save 검증에서 수행 권장)

// * 정책:
//   - p_allowOverlap=true  (기본): 겹침 허용 → 매치 후보 중 schNo 최댓값 선택
//   - p_allowOverlap=false       : 겹침 금지 신뢰 → 첫 매치 즉시 반환(최적화)
// * 전제:
//   - C10 저장 시 schNo desc 정렬 저장을 수행하면,
//     p_allowOverlap=false 경로에서 "첫 매치"가 곧 우선순위 최고(schNo 최대)임.
// * 시간 의존:
//   - TM10::getLocalTime(outTm) 기반으로만 동작
// * cross-midnight 처리:
//   - start < end  : [start, end)
//   - start > end  : [start, 1440) U [0, end)
//   - start == end : 항상 OFF 취급
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg, bool p_allowOverlap /*= true*/) {
	if (p_cfg.count == 0) return -1;

	// 1) TM10 기준: 로컬 시간 확보(유효성 포함)
	struct tm v_tm;
	memset(&v_tm, 0, sizeof(v_tm));
	if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: local time not available");
		return -1;
	}

	// 2) 요일/분 계산
	// - tm_wday: 0=Sun..6=Sat
	// - Config days[]: 0=Mon..6=Sun
	uint8_t  v_wday   = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
	uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60U + (uint16_t)v_tm.tm_min;

	// --------------------------------------------------
	// (A) 겹침 금지 신뢰(최적화): 첫 매치 즉시 반환
	// --------------------------------------------------
	if (!p_allowOverlap) {
		for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
			const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
			if (!v_s.enabled) continue;

			if (v_wday >= 7 || !v_s.period.days[v_wday]) continue;

			uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
			uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

			if (v_startMin == v_endMin) continue;

			if (v_startMin < v_endMin) {
				if (v_curMin >= v_startMin && v_curMin < v_endMin) return v_i;
			} else {
				// cross-midnight
				if (v_curMin >= v_startMin || v_curMin < v_endMin) return v_i;
			}
		}
		return -1;
	}

	// --------------------------------------------------
	// (B) 겹침 허용: 매치 후보 중 schNo 최댓값 선택
	// --------------------------------------------------
	int      v_bestIdx = -1;
	uint16_t v_bestNo  = 0;

	for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
		const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
		if (!v_s.enabled) continue;

		if (v_wday >= 7 || !v_s.period.days[v_wday]) continue;

		uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
		uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

		if (v_startMin == v_endMin) continue;

		bool v_match = false;
		if (v_startMin < v_endMin) {
			v_match = (v_curMin >= v_startMin && v_curMin < v_endMin);
		} else {
			// cross-midnight
			v_match = (v_curMin >= v_startMin || v_curMin < v_endMin);
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
// - 최소 정책: motion blocked일 땐 sim.stop()만 하고, runSource는 유지(=재개 가능)
// - 즉, 스케줄/프로파일은 "살아있고", 실제 바람만 멈춘 상태
// --------------------------------------------------
void CL_CT10_ControlManager::onMotionBlocked(EN_CT10_reason_t p_reason) {
    if (sim.active) sim.stop();

    runCtx.state             = EN_CT10_STATE_MOTION_BLOCKED;
    runCtx.reason            = p_reason;
    runCtx.lastDecisionMs    = millis();
    runCtx.lastStateChangeMs = runCtx.lastDecisionMs;

    // 실행 소스/active sch/profile 정보는 유지(재개 시 UI가 이해하기 쉬움)
    // (필요하면 segId/segNo도 유지 가능)

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

