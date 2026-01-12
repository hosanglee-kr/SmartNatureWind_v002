/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_Basic_042.cpp
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

#include "CT10_Control_042.h"
#include <DHT.h>

// --------------------------------------------------
// 내부 유틸: localtime 유효성 체크 + thread-safe 변환
// --------------------------------------------------
static bool CT10_localtimeSafe(time_t p_t, struct tm& p_outTm) {
	memset(&p_outTm, 0, sizeof(p_outTm));

	// time()이 0 또는 너무 작은 값이면(부팅 직후/미동기) 스킵
	if (p_t <= 0) return false;

	// localtime_r 사용(FreeRTOS/멀티스레드 안정)
	struct tm* v_ret = localtime_r(&p_t, &p_outTm);
	if (!v_ret) return false;

	// 대략적인 “시간 동기화 됨” 판단(정책: 2020년 이후만 유효)
	// tm_year: 1900 기준
	if (p_outTm.tm_year < (2020 - 1900)) return false;

	return true;
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
		autoOffRt.offTimeMinutes = parseHHMMtoMin(p_up.autoOff.offTime.time);
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
		autoOffRt.offTimeMinutes = parseHHMMtoMin(p_s.autoOff.offTime.time);
	}
	if (p_s.autoOff.offTemp.enabled) {
		autoOffRt.offTempEnabled = true;
		autoOffRt.offTemp        = p_s.autoOff.offTemp.temp;
	}
}

// --------------------------------------------------
// autoOff check
// --------------------------------------------------
bool CL_CT10_ControlManager::checkAutoOff() {
	if (!autoOffRt.timerArmed && !autoOffRt.offTimeEnabled && !autoOffRt.offTempEnabled) return false;

	unsigned long v_nowMs = millis();

	// 1) timer
	if (autoOffRt.timerArmed && autoOffRt.timerMinutes > 0) {
		uint32_t v_elapsedMin = (v_nowMs - autoOffRt.timerStartMs) / 60000UL;
		if (v_elapsedMin >= autoOffRt.timerMinutes) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(timer %lu min) triggered",
			                   (unsigned long)autoOffRt.timerMinutes);
			return true;
		}
	}

	// 2) offTime (RTC)
	// - localtime_r 사용
	// - 시간 미동기 상태면 스킵
	// - 같은 "분"에서 반복 트리거 방지(로그/반복 동작 방어)
	if (autoOffRt.offTimeEnabled) {
		static int32_t s_lastTriggeredMinute = -1;

		time_t v_t = time(nullptr);
		struct tm v_tm;
		if (!CT10_localtimeSafe(v_t, v_tm)) {
			CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] AutoOff(offTime) skipped: time not synced");
		} else {
			uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

			// 동일 분 내 재트리거 방지
			if ((int32_t)v_curMin == s_lastTriggeredMinute) {
				// no-op
			} else {
				// 정책: 지정 시각 "도달 시"부터 트리거(>=)
				if (v_curMin >= autoOffRt.offTimeMinutes) {
					s_lastTriggeredMinute = (int32_t)v_curMin;
					CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(time %u) triggered",
					                   (unsigned)autoOffRt.offTimeMinutes);
					return true;
				}
			}
		}
	}

	// 3) offTemp (센서 연동)
	if (autoOffRt.offTempEnabled) {
		float v_curTemp = getCurrentTemperatureMock();
		if (v_curTemp >= autoOffRt.offTemp) {
			CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(temp %.1fC >= %.1fC) triggered",
			                   v_curTemp, autoOffRt.offTemp);
			return true;
		}
	}

	return false;
}

// --------------------------------------------------
// helpers
// --------------------------------------------------
uint16_t CL_CT10_ControlManager::parseHHMMtoMin(const char* p_time) {
	// expected: "HH:MM" (H:MM도 허용)
	if (!p_time || p_time[0] == '\0') return 0;

	const char* v_colon = strchr(p_time, ':');
	if (!v_colon) {
		// "HHMM" 같은 포맷은 지원하지 않음(의도치 않은 atoi 파싱 방지)
		return 0;
	}

	// hh
	char v_hhBuf[4];
	memset(v_hhBuf, 0, sizeof(v_hhBuf));
	size_t v_hhLen = (size_t)(v_colon - p_time);
	if (v_hhLen == 0 || v_hhLen >= sizeof(v_hhBuf)) return 0;
	memcpy(v_hhBuf, p_time, v_hhLen);

	// mm
	const char* v_mmStr = v_colon + 1;
	if (!v_mmStr || strlen(v_mmStr) == 0) return 0;

	int v_hh = atoi(v_hhBuf);
	int v_mm = atoi(v_mmStr);

	if (v_hh < 0) v_hh = 0;
	if (v_hh > 23) v_hh = 23;
	if (v_mm < 0) v_mm = 0;
	if (v_mm > 59) v_mm = 59;

	return (uint16_t)(v_hh * 60 + v_mm);
}

float CL_CT10_ControlManager::getCurrentTemperatureMock() {
	// 운영 방어:
	// - system 설정 포인터 null 방어
	// - 센서 비활성 시 고정 fallback
	// - DHT는 2초 주기 읽기
	static DHT* s_dht          = nullptr;
	static uint8_t  s_dhtPin   = 0;
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
// find active schedule
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg) {
	if (p_cfg.count == 0) return -1;

	time_t v_now = time(nullptr);
	struct tm v_tm;
	if (!CT10_localtimeSafe(v_now, v_tm)) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: time not synced");
		return -1;
	}

	// Arduino: 0=Sun, Config: 0=Mon => 보정
	uint8_t v_wday = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
	uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

	for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
		const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];

		if (!v_s.enabled) continue;

		// days 체크
		if (v_wday >= 7 || !v_s.period.days[v_wday]) continue;

		uint16_t v_startMin = parseHHMMtoMin(v_s.period.startTime);
		uint16_t v_endMin   = parseHHMMtoMin(v_s.period.endTime);

		if (v_startMin == v_endMin) {
			// start==end 이면 "항상 OFF"로 취급(필요 시 정책 변경 가능)
			continue;
		}

		if (v_startMin < v_endMin) {
			if (v_curMin >= v_startMin && v_curMin < v_endMin) return v_i;
		} else {
			// cross midnight
			if (v_curMin >= v_startMin || v_curMin < v_endMin) return v_i;
		}
	}

	return -1;
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

