#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : M10_MotionLogic_070.h
 * 모듈약어 : M10
 * 모듈명 : Smart Nature Wind Motion Logic Manager
 * ------------------------------------------------------
 * 기능 요약
 *  - PIR 센서 근접 감지 통합 제어
 *  - holdSec 기반 유지 로직 (최근 감지 후 일정시간 활성 유지)
 *  - BLE 신호는 외부 스캐너에서 RSSI 업데이트만 전달받음
 *  - CT10_ControlManager에서 tick() 호출 및 상태 조회
 *  - JSON 직렬화(toJson) 수행 (설정값은 g_A20_config_root.motion 참조)
 *  - 상태 변화 시 콜백(OnChange) 제공 (CT10 등에서 WebSocket diffOnly 활용 가능)
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 *  - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *   - 전역 상수,매크로      : G_모듈약어_ 접두사
 *   - 전역 변수             : g_모듈약어_ 접두사
 *   - 전역 함수             : 모듈약어_ 접두사
 *   - type                  : T_모듈약어_ 접두사
 *   - typedef               : _t  접미사
 *   - enum 상수             : EN_모듈약어_ 접두사
 *   - 구조체                : ST_모듈약어_ 접두사
 *   - 클래스명              : CL_모듈약어_ 접두사
 *   - 클래스 private 멤버   : _ 접두사
 *   - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 *   - 클래스 정적 멤버      : s_ 접두사
 *   - 함수 로컬 변수        : v_ 접두사
 *   - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <string.h>

#include "A20_Const_070.h"
#include "D10_Logger_070.h"

// ------------------------------------------------------
// 구조체 정의
// ------------------------------------------------------
typedef struct {
	uint32_t lastDetected_ms;
	bool	 active;
} ST_M10_PIR_rt_t;

typedef struct {
	uint32_t lastDetected_ms;
	bool	 active;
	int16_t	 last_rssi;
} ST_M10_BLE_rt_t;

typedef struct {
	bool	 active;
	bool	 pirActive;
	uint32_t lastChange_ms;
} ST_M10_MotionState_t;

// 전역 인스턴스 포인터 선언
extern CL_M10_MotionLogic* g_M10_motionLogic;

// 콜백 타입 (상태 변경 시 통지용)
//  - CT10 등에서 등록하여 diffOnly WebSocket 브로드캐스트 등에 활용
typedef void (*T_M10_OnChangeCallback_t)(const ST_M10_MotionState_t& p_state);

// ------------------------------------------------------
// CL_M10_MotionLogic
// ------------------------------------------------------
class CL_M10_MotionLogic {
  public:
	// [추가됨] 정적 초기화 함수 (A00/Main 진입용)
	// --------------------------------------------------
	static void M10_begin() {
		static CL_M10_MotionLogic s_instance;
		g_M10_motionLogic = &s_instance;
		CL_D10_Logger::log(EN_L10_LOG_INFO, "[M10] MotionLogic initialized");
	}

	CL_M10_MotionLogic() {
		memset(&_pir, 0, sizeof(_pir));

		memset(&_state, 0, sizeof(_state));
		_onChange = nullptr;
	}

	// --------------------------------------------------
	// [추가됨] PIR 감지 상태 전달 (웹/MQTT 용)
	// --------------------------------------------------
	/*
	 * @brief 외부 소스로부터 PIR 감지 상태를 전달받아 처리합니다.
	 * @param p_detected 감지 여부 (true일 경우 notifyPIRDetected() 호출)
	 */
	void feedPIR(bool p_detected) {
		if (p_detected) {
			notifyPIRDetected();
		}
	}

	// --------------------------------------------------
	// PIR 감지 이벤트
	// --------------------------------------------------
	void notifyPIRDetected() {
		if (!g_A20_config_root.motion || !g_A20_config_root.motion->pir.enabled)
			return;
		_pir.lastDetected_ms = millis();
		_pir.active			 = true;
	}


	// --------------------------------------------------
	// tick 루프 (CT10에서 주기 호출)
	// --------------------------------------------------
	void tick() {
		if (!g_A20_config_root.motion)
			return;
		const auto& v_cfg = *g_A20_config_root.motion;
		uint32_t	v_now = millis();

		// PIR timeout
		if (v_cfg.pir.enabled && _pir.active) {
			uint32_t v_pirElapsed = v_now - _pir.lastDetected_ms;
			if (v_pirElapsed > v_cfg.pir.holdSec * 1000UL) {
				_pir.active = false;
			}
		} else if (!v_cfg.pir.enabled) {
			_pir.active = false;
		}


		// 상태 변화 감지
		bool v_activeNew = (_pir.active);
		bool v_pirActive = _pir.active;
		

		if (v_activeNew != _state.active || v_pirActive != _state.pirActive) {
			_state.active		 = v_activeNew;
			_state.pirActive	 = v_pirActive;

			_state.lastChange_ms = v_now;

			CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[M10] motionActive=%d (PIR=%d)", (int)_state.active, (int)_state.pirActive);

			// 외부 연동용 콜백 (CT10 등에서 diffOnly 푸시 활용)
			if (_onChange) {
				_onChange(_state);
			}
		}
	}

	// --------------------------------------------------
	// 상태 직렬화
	// --------------------------------------------------
	void toJson(JsonDocument& p_doc) const {
		if (!g_A20_config_root.motion)
			return;
		const auto& v_cfg = *g_A20_config_root.motion;

		JsonObject v_o	 = p_doc["motion"].to<JsonObject>();
		v_o["active"]	 = isActive();
		v_o["pirActive"] = _state.pirActive;
		
		
		// Todo: pirHold json key명 변수명과 일치 필요
		v_o["pirHold"]	 = v_cfg.pir.holdSec;
		

		unsigned long v_now		= millis();
		uint32_t	  v_lastSec = (_state.lastChange_ms == 0) ? 0 : (uint32_t)((v_now - _state.lastChange_ms) / 1000UL);
		v_o["lastActiveSec"]	= v_lastSec;

		// 남은 hold 시간 (초 단위)
		uint32_t v_pirRemain = 0;
		

		if (v_cfg.pir.enabled && _pir.active) {
			uint32_t v_pirElapsed = v_now - _pir.lastDetected_ms;
			if (v_pirElapsed < v_cfg.pir.holdSec * 1000UL) {
				v_pirRemain = (v_cfg.pir.holdSec * 1000UL - v_pirElapsed) / 1000UL;
			}
		}


		v_o["pirHoldRemain"] = v_pirRemain;

	}

	// --------------------------------------------------
	// 외부에서 활성여부 확인
	// --------------------------------------------------
	bool isActive() const {
		unsigned long v_now	 = millis();
		// holdSec 로직은 외부 config 사용 (예: g_A20_config_root.motion)
		uint16_t	  v_hold = 0;
		if (g_A20_config_root.motion) {
			v_hold = (uint16_t)g_A20_config_root.motion->pir.holdSec;
		}
		if (_state.pirActive)
	
			return true;
		if (v_hold > 0 && (v_now - _state.lastChange_ms) < (v_hold * 1000UL))
			return true;
		return false;
	}

	// --------------------------------------------------
	// 상태 변경 콜백 등록
	//  - CT10 등에서 등록하여 상태 변경 시 diffOnly 브로드캐스트 트리거
	// --------------------------------------------------
	void setOnChangeCallback(T_M10_OnChangeCallback_t p_cb) {
		_onChange = p_cb;
	}

  private:
	ST_M10_PIR_rt_t			 _pir;

	ST_M10_MotionState_t	 _state;
	T_M10_OnChangeCallback_t _onChange;
};
