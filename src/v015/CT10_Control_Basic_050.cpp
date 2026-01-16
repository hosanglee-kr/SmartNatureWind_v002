/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_Basic_050.cpp
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

/*
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
*/


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
// autoOff check
// --------------------------------------------------
bool CL_CT10_ControlManager::checkAutoOff() {
    // --------------------------------------------------
    // 기능:
    //  - AutoOff 조건을 검사하여 “정지해야 하면 true”
    //  - timer: millis 기반 경과 시간
    //  - offTime: 로컬 시간(분) 기반
    //  - offTemp: 온도 센서 기반
    //
    // TM10 정책:
    //  - offTime은 TM10::getLocalTime() 성공 시에만 평가
    //  - Wi-Fi down이어도 time이 sane이면 평가 가능(완화 정책)
    //
    // 운영 방어:
    //  - offTime은 ">= 지정분" 정책을 쓰면, 이후 매 분마다 계속 참이 되어
    //    제어 루프가 반복 정지될 수 있음
    //  - 따라서 "하루 1회 트리거"로 방어 (yday 기반)
    // --------------------------------------------------
    if (!autoOffRt.timerArmed && !autoOffRt.offTimeEnabled && !autoOffRt.offTempEnabled) return false;

    unsigned long v_nowMs = millis();

    // --------------------------------------------------
    // 1) timer (millis 기반)
    // --------------------------------------------------
    if (autoOffRt.timerArmed && autoOffRt.timerMinutes > 0) {
        uint32_t v_elapsedMin = (v_nowMs - autoOffRt.timerStartMs) / 60000UL;
        if (v_elapsedMin >= autoOffRt.timerMinutes) {
            CL_D10_Logger::log(EN_L10_LOG_INFO,
                               "[CT10] AutoOff(timer %lu min) triggered",
                               (unsigned long)autoOffRt.timerMinutes);
            return true;
        }
    }

    // --------------------------------------------------
    // 2) offTime (로컬 시간 기반)
    // --------------------------------------------------
    if (autoOffRt.offTimeEnabled) {
        // 하루 1회 트리거 방어: 마지막 트리거의 yday 저장
        // tm_yday: 0..365 (연도 내 일수)
        static int16_t s_lastTriggeredYday = -1;

        struct tm v_tm;
        if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
            // 시간 유효하지 않으면 offTime은 스킵(운영 안전)
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] AutoOff(offTime) skipped: time invalid (TM10)");
        } else {
            uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;
            int16_t  v_yday   = (int16_t)v_tm.tm_yday;

            // 이미 오늘(offTime) 트리거가 발생했다면 재트리거 방지
            if (s_lastTriggeredYday == v_yday) {
                // no-op
            } else {
                // 정책: 지정 시각 “도달 시부터” 트리거 (>=)
                if (v_curMin >= autoOffRt.offTimeMinutes) {
                    s_lastTriggeredYday = v_yday;

                    CL_D10_Logger::log(EN_L10_LOG_INFO,
                                       "[CT10] AutoOff(time %u) triggered (cur=%u yday=%d)",
                                       (unsigned)autoOffRt.offTimeMinutes,
                                       (unsigned)v_curMin,
                                       (int)v_yday);
                    return true;
                }
            }
        }
    }

    // --------------------------------------------------
    // 3) offTemp (센서 기반)
    // --------------------------------------------------
    if (autoOffRt.offTempEnabled) {
        float v_curTemp = getCurrentTemperatureMock();
        if (v_curTemp >= autoOffRt.offTemp) {
            CL_D10_Logger::log(EN_L10_LOG_INFO,
                               "[CT10] AutoOff(temp %.1fC >= %.1fC) triggered",
                               v_curTemp,
                               autoOffRt.offTemp);
            return true;
        }
    }

    return false;
}

/*
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
*/

/*
// --------------------------------------------------
// helpers
// --------------------------------------------------
// --------------------------------------------------
// helpers
// --------------------------------------------------
// [교체 버전] "HH:MM" → minutes (0..1440)
// - "24:00" 을 유효로 인정하여 1440 반환
// - "24:xx"(xx!=00)는 비정상으로 보고 0 반환(운영 안전)
// - 공백/이상문자 방어(최소한의 방어만)
// - ":" 없는 "HHMM" 포맷은 미지원(0 반환)

uint16_t CL_CT10_ControlManager::parseHHMMtoMin(const char* p_time) {
	// expected: "HH:MM" (H:MM도 허용)
	if (!p_time || p_time[0] == '\0') return 0;

	// 앞 공백 스킵
	while (*p_time == ' ' || *p_time == '\t' || *p_time == '\r' || *p_time == '\n') p_time++;
	if (p_time[0] == '\0') return 0;

	const char* v_colon = strchr(p_time, ':');
	if (!v_colon) {
		// "HHMM" 같은 포맷은 지원하지 않음(의도치 않은 atoi 파싱 방지)
		return 0;
	}

	// hh 파싱 버퍼
	char v_hhBuf[4];
	memset(v_hhBuf, 0, sizeof(v_hhBuf));
	size_t v_hhLen = (size_t)(v_colon - p_time);
	if (v_hhLen == 0 || v_hhLen >= sizeof(v_hhBuf)) return 0;

	// hh 부분 복사
	memcpy(v_hhBuf, p_time, v_hhLen);

	// mm 문자열
	const char* v_mmStr = v_colon + 1;
	if (!v_mmStr || v_mmStr[0] == '\0') return 0;

	// 뒤 공백/개행 제거를 위해 mm 복사 버퍼 사용(최대 2~3자리 + null)
	char v_mmBuf[4];
	memset(v_mmBuf, 0, sizeof(v_mmBuf));

	// mm은 최대 2자리까지만 유효 처리(그 이상은 앞 2자리만 보지 않고 "잘못된 포맷"으로 처리)
	// 운영 안전을 위해 엄격하게
	size_t v_mmLen = strlen(v_mmStr);
	// 뒤 공백 제거
	while (v_mmLen > 0) {
		char c = v_mmStr[v_mmLen - 1];
		if (c == ' ' || c == '\t' || c == '\r' || c == '\n') v_mmLen--;
		else break;
	}
	if (v_mmLen == 0 || v_mmLen > 2) return 0;

	memcpy(v_mmBuf, v_mmStr, v_mmLen);

	int v_hh = atoi(v_hhBuf);
	int v_mm = atoi(v_mmBuf);

	// 숫자 범위 기본 방어
	if (v_hh < 0) v_hh = 0;
	if (v_mm < 0) v_mm = 0;

	// ✅ 24:00 허용 (1440)
	if (v_hh == 24) {
		if (v_mm == 0) return 1440;
		// 24:xx는 허용하지 않음(운영 혼선 방지)
		return 0;
	}

	// 일반 케이스 clamp
	if (v_hh > 23) v_hh = 23;
	if (v_mm > 59) v_mm = 59;

	return (uint16_t)(v_hh * 60 + v_mm);
}

*/
/*
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
*/

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

/*
// --------------------------------------------------
// find active schedule
// --------------------------------------------------
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

int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg) {
    // --------------------------------------------------
    // 기능:
    //  - 현재 로컬 시간 기준으로 활성 스케줄 후보들을 찾고,
    //  - 겹침이 있을 수 있으므로 "schNo가 가장 큰 스케줄"을 선택한다.
    //
    // 정책:
    //  - 스케줄 겹침 허용
    //  - 우선순위 = schNo 큰 것
    //  - tie-breaker:
    //      1) schNo 동일이면 schId 큰 것(안정적/결정적 선택)
    //      2) 그래도 동일이면 더 뒤 인덱스(마지막 매치)로 선택 (결정성 확보)
    //
    // 시간:
    //  - TM10::getLocalTime() 성공 시에만 시간 기반 평가
    //  - 실패 시 -1(스케줄 미적용)
    //
    // 자정 넘어감:
    //  - start < end : same-day
    //  - start > end : cross-midnight (예: 23:00~07:00)
    // --------------------------------------------------
    if (p_cfg.count == 0) return -1;

    struct tm v_tm;
    if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: time invalid (TM10)");
        return -1;
    }

    // Arduino tm_wday: 0=Sun..6=Sat
    // Config days: [0]=Mon..[6]=Sun
    uint8_t  v_wday   = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

    int    v_bestIdx  = -1;
    int16_t v_bestNo  = INT16_MIN;
    int16_t v_bestId  = INT16_MIN;

    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
        if (!v_s.enabled) continue;

        // 요일 체크
        if (v_wday >= 7 || !v_s.period.days[v_wday]) continue;

        uint16_t v_startMin = A40_parseHHMMtoMin_24h(v_s.period.startTime);
        uint16_t v_endMin   = A40_parseHHMMtoMin_24h(v_s.period.endTime);

        // start==end 정책: 비활성(항상 OFF)
        if (v_startMin == v_endMin) continue;

        // 활성 여부 판정
        bool v_active = false;
        if (v_startMin < v_endMin) {
            // same-day
            v_active = (v_curMin >= v_startMin && v_curMin < v_endMin);
        } else {
            // cross-midnight
            v_active = (v_curMin >= v_startMin || v_curMin < v_endMin);
        }
        if (!v_active) continue;

        // 우선순위 비교: schNo 큰 것 우선
        // schNo 타입이 uint16_t라면 안전하게 int로 캐스팅
        int16_t v_no = (int16_t)v_s.schNo;
        int16_t v_id = (int16_t)v_s.schId;

        bool v_take = false;
        if (v_bestIdx < 0) {
            v_take = true;
        } else if (v_no > v_bestNo) {
            v_take = true;
        } else if (v_no == v_bestNo) {
            // tie-breaker: schId 큰 것
            if (v_id > v_bestId) v_take = true;
            else if (v_id == v_bestId) {
                // 마지막 tie-breaker: 더 뒤 인덱스를 선택해도 됨(결정성)
                v_take = true;
            }
        }

        if (v_take) {
            v_bestIdx = v_i;
            v_bestNo  = v_no;
            v_bestId  = v_id;
        }
    }

    return v_bestIdx;
}
*/

/*
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg) {
    // --------------------------------------------------
    // 기능:
    //  - 현재 로컬 시간 기준으로 "활성 스케줄 1개"를 찾는다.
    //  - 자정 넘어감(cross-midnight) 구간 지원
    //  - 시간 미동기/유효하지 않으면 스케줄 동작을 멈춘다(운영 안전)
    //
    // TM10 정책:
    //  - TM10::getLocalTime()이 성공해야만 시간 기반 제어 수행
    //  - Wi-Fi down이어도 time이 sane이면 진행 가능(완화 정책)
    // --------------------------------------------------
    if (p_cfg.count == 0) return -1;

    struct tm v_tm;
    if (!CL_TM10_TimeManager::getLocalTime(v_tm)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: time invalid (TM10)");
        return -1;
    }

    // Arduino tm_wday: 0=Sun..6=Sat
    // Config days: [0]=Mon..[6]=Sun (기존 정책 유지)
    uint8_t v_wday = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);

    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

    // --------------------------------------------------
    // 운영 정책(우선순위):
    //  - “겹침 없음”이 C10에서 보장된다는 전제면, 첫 매치 반환 OK
    //  - 향후 “schNo 큰 것 우선” 정책이 도입되면:
    //      1) 매치 후보 중 schNo 최댓값 선택
    //      2) 또는 저장 시 겹침을 막아 단일 매치만 허용
    //
    // 지금 구현은 "첫 매치 반환" (겹침 금지 전제)
    // --------------------------------------------------
    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];

        if (!v_s.enabled) continue;

        // days 체크
        if (v_wday >= 7 || !v_s.period.days[v_wday]) continue;

        uint16_t v_startMin = parseHHMMtoMin(v_s.period.startTime);
        uint16_t v_endMin   = parseHHMMtoMin(v_s.period.endTime);

        if (v_startMin == v_endMin) {
            // 정책: start==end 이면 비활성(항상 OFF 취급)
            continue;
        }

        if (v_startMin < v_endMin) {
            // same-day window
            if (v_curMin >= v_startMin && v_curMin < v_endMin) return v_i;
        } else {
            // cross-midnight window
            // 예: 23:00~07:00
            if (v_curMin >= v_startMin || v_curMin < v_endMin) return v_i;
        }
    }

    return -1;
}
*/


/*
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg) {
	if (p_cfg.count == 0) return -1;

	// 1) 현재 시각 확보 (RTC/동기화 확인)
	time_t v_now = time(nullptr);
	struct tm v_tm;
	if (!CT10_localtimeSafe(v_now, v_tm)) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: time not synced");
		return -1;
	}

	// 2) 요일 변환
	// - tm_wday: 0=Sun..6=Sat
	// - Config(days): 0=Mon..6=Sun
	uint8_t v_wdayToday = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
	uint8_t v_wdayPrev  = (v_wdayToday == 0) ? 6 : (uint8_t)(v_wdayToday - 1);

	// 3) 현재 분(0..1439)
	uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

	// 4) 후보 중 "schNo가 가장 큰" 활성 스케줄 선택
	int	  v_bestIdx  = -1;
	uint16_t v_bestSchNo = 0;

	for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
		const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];

		// enabled
		if (!v_s.enabled) continue;

		// start/end 파싱
		uint16_t v_startMin = parseHHMMtoMin(v_s.period.startTime);
		uint16_t v_endMin   = parseHHMMtoMin(v_s.period.endTime);

		// days 배열 방어
		// (A20 구조상 7개로 고정이지만, 안전 차원)
		if (v_wdayToday >= 7 || v_wdayPrev >= 7) continue;

		bool v_active = false;

		// 4-1) start==end: 24시간 활성(권장)
		// - 오늘 요일만 체크(일반적인 의미: "이 요일에 항상 실행")
		if (v_startMin == v_endMin) {
			if (v_s.period.days[v_wdayToday]) {
				v_active = true;
			}
		}
		// 4-2) same-day window: start < end => [start, end)
		else if (v_startMin < v_endMin) {
			if (v_s.period.days[v_wdayToday]) {
				if (v_curMin >= v_startMin && v_curMin < v_endMin) {
					v_active = true;
				}
			}
		}
		// 4-3) overnight window: start > end
		// - [start, 24:00): today day
		// - [00:00, end):  prev day  (자정 이후는 '전날 스케줄 연장' 개념)
		else {
			if (v_curMin >= v_startMin) {
				// today part
				if (v_s.period.days[v_wdayToday]) {
					v_active = true;
				}
			} else if (v_curMin < v_endMin) {
				// after-midnight part
				if (v_s.period.days[v_wdayPrev]) {
					v_active = true;
				}
			}
		}

		if (!v_active) continue;

		// 5) 우선순위: schNo가 큰 것이 우선
		// - tie(동일 schNo)일 때는 "먼저 나온 것" 유지(필요 시 v_i 비교 정책 변경 가능)
		if (v_bestIdx < 0 || v_s.schNo > v_bestSchNo) {
			v_bestIdx	= v_i;
			v_bestSchNo = v_s.schNo;
		}
	}

	// (선택) 디버그 로그: 활성 스케줄 선택
	// if (v_bestIdx >= 0) {
	// 	CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] ActiveSchedule idx=%d schNo=%u curMin=%u wdayToday=%u",
	// 	                   v_bestIdx, (unsigned)v_bestSchNo, (unsigned)v_curMin, (unsigned)v_wdayToday);
	// }

	return v_bestIdx;
}
*/

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

