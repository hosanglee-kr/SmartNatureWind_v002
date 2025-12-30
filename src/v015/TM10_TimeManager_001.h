#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : TM10_TimeManager_001.h
 * 모듈 약어 : TM10
 * 모듈명 : Smart Nature Wind Time Manager (TZ/NTP Apply + Sync) (v001)
 * ------------------------------------------------------
 * 기능 요약:
 *  - system.time 설정(TZ, NTP 서버, syncIntervalMin)을 런타임에 반영
 *  - NTP 동기화 폴링 + 시간 유효성 판단 + localtime_r() null 방어
 *  - WF10 등 다른 모듈은 "트리거/상태"만 담당하고, 시간 책임은 TM10으로 분리
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 *  - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 변수명은 가능한 해석 가능하게
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - namespace 명        : 모듈약어_ 접두사
 *   - namespace 내 상수    : 모둘약어 접두시 미사용
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사 , 버전 제거
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <time.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "A20_Const_043.h"
#include "C10_Config_041.h"
#include "D10_Logger_040.h"

#ifndef G_TM10_MUTEX_TIMEOUT
#	define G_TM10_MUTEX_TIMEOUT pdMS_TO_TICKS(100)
#endif

class CL_TM10_TimeManager {
  public:
	// 상태(필요시 외부 조회)
	static bool     s_timeSynced;
	static uint32_t s_lastSyncMs;

	// 초기화(옵션)
	static void begin() {
		if (s_timeMutex == nullptr) {
			s_timeMutex = xSemaphoreCreateMutex();
			if (!s_timeMutex) {
				CL_D10_Logger::log(EN_L10_LOG_ERROR, "[TM10] Mutex create failed");
			}
		}
	}

	/**
	 * @brief system.time 설정을 기준으로 TZ/NTP/주기 설정을 런타임에 반영 + 즉시 동기화 시도(최대 5초)
	 */
	static void applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_cfg) {
		_beginIfNeeded();

		CL_D10_Logger::log(EN_L10_LOG_INFO,
		                   "[TM10] Apply time config: ntp=%s, tz=%s, interval=%u min",
		                   p_cfg.time.ntpServer,
		                   p_cfg.time.timezone,
		                   (unsigned int)p_cfg.time.syncIntervalMin);

		// TZ/NTP 설정 적용
		setenv("TZ", p_cfg.time.timezone, 1);
		tzset();
		configTime(0, 0, p_cfg.time.ntpServer);

		// 즉시 동기화 시도(최대 5초)
		uint32_t v_start = millis();
		bool v_ok = false;

		while (millis() - v_start < 5000) {
			time_t v_now = time(nullptr);
			if (_isValidEpoch(v_now)) {
				struct tm v_tm;
				if (_localtimeSafe(v_now, &v_tm)) {
					v_ok = true;
					break;
				}
			}
			delay(250);
		}

		_mutexAcquire();
		s_timeSynced = v_ok;
		if (v_ok) s_lastSyncMs = millis();
		_mutexRelease();

		CL_D10_Logger::log(v_ok ? EN_L10_LOG_INFO : EN_L10_LOG_WARN,
		                   v_ok ? "[TM10] Time sync OK after apply" : "[TM10] Time sync not yet complete after apply (non-fatal)");
	}

	/**
	 * @brief NTP 동기화를 필요 시 수행(주기 기반). Wi-Fi 연결 여부는 호출자가 보장(또는 p_wifiConnected로 전달).
	 * @param p_wifiConnected STA 연결 여부(외부에서 전달)
	 */
	static void syncTimeIfNeeded(bool p_wifiConnected,
	                             const ST_A20_SystemConfig_t& p_cfg_system,
	                             uint32_t p_interval_ms = 21600000UL) {
		_beginIfNeeded();

		if (!p_wifiConnected) return;

		_mutexAcquire();
		uint32_t v_nowMs = millis();
		if (s_timeSynced && (v_nowMs - s_lastSyncMs < p_interval_ms)) {
			_mutexRelease();
			return;
		}
		_mutexRelease();

		// TZ/NTP 재적용(안전하게 매번 적용)
		setenv("TZ", p_cfg_system.time.timezone, 1);
		tzset();
		configTime(0, 0, p_cfg_system.time.ntpServer);

		// 최대 10초 폴링
		uint32_t v_start = millis();
		while (millis() - v_start < 10000) {
			time_t v_now = time(nullptr);
			if (_isValidEpoch(v_now)) {
				struct tm v_tm;
				if (_localtimeSafe(v_now, &v_tm)) {
					_mutexAcquire();
					s_timeSynced = true;
					s_lastSyncMs = millis();
					_mutexRelease();
					CL_D10_Logger::log(EN_L10_LOG_INFO, "[TM10] NTP Sync OK");
					return;
				}
			}
			delay(250);
		}

		_mutexAcquire();
		s_timeSynced = false;
		_mutexRelease();

		CL_D10_Logger::log(EN_L10_LOG_WARN, "[TM10] NTP Timeout");
	}

  private:
	static SemaphoreHandle_t s_timeMutex;

	static void _beginIfNeeded() {
		if (s_timeMutex == nullptr) begin();
	}

	static bool _isValidEpoch(time_t p_t) {
		// 기존 기준 유지(2023-11-15 이후)
		return (p_t > (time_t)1700000000);
	}

	static bool _localtimeSafe(time_t p_t, struct tm* p_out) {
		if (p_out == nullptr) return false;
		memset(p_out, 0, sizeof(struct tm));

		struct tm* v_ret = localtime_r(&p_t, p_out);
		if (v_ret == nullptr) return false;

		// sanity(대략 2020 이상)
		if (p_out->tm_year < 120) return false;
		return true;
	}

	static void _mutexAcquire() {
		if (s_timeMutex == nullptr) return;
		xSemaphoreTake(s_timeMutex, G_TM10_MUTEX_TIMEOUT);
	}
	static void _mutexRelease() {
		if (s_timeMutex == nullptr) return;
		xSemaphoreGive(s_timeMutex);
	}
};

// ---- static members ----
bool              CL_TM10_TimeManager::s_timeSynced  = false;
uint32_t          CL_TM10_TimeManager::s_lastSyncMs  = 0;
SemaphoreHandle_t CL_TM10_TimeManager::s_timeMutex   = nullptr;

// --------------------------------------------------
// (호환) 전역 함수 래퍼: 기존 WF10_applyTimeConfigFromSystem 이관용
// --------------------------------------------------
static inline void TM10_applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_cfg) {
	CL_TM10_TimeManager::applyTimeConfigFromSystem(p_cfg);
}

