#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : P10_PWM_ctrl_0202.h
 * 모듈약어 : P10
 * 모듈명 : Smart Nature Wind PWM 제어 Manager (v0202)
 * ------------------------------------------------------
 * [Batch F-9] applyFanConfigCurve 3구간 분할 상수화
 *  - G_P10_CURVE_SPLIT1/SPLIT2, G_P10_CURVE_SPAN1/SPAN2
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <string.h>

#include "A20_Const_0202.h"
#include "D10_Logger_0202.h"
#include "A40_Com_Utils_0202.h"

typedef struct {
	bool	 initialized;
	bool	 enabled;
	int16_t	 pin;
	uint8_t	 channel;
	uint32_t freq;
	uint8_t	 resolutionBits;
	uint32_t maxDuty;
	float	 dutyPercent;
} ST_P10_PWMState_t;

class CL_P10_PWM {
  public:
	// ======================================================
	// [Batch F-9] Fan Config Curve 상수
	//  - 3구간 커브: [0, S1) → s / [S1, S2) → c2 / [S2, 1.0] → h
	// ======================================================
	static constexpr float G_P10_CURVE_ZERO_THRESHOLD = 0.0001f;
	static constexpr float G_P10_CURVE_SPLIT1         = 0.33f;
	static constexpr float G_P10_CURVE_SPLIT2         = 0.66f;
	static constexpr float G_P10_CURVE_SPAN1          = 0.33f;
	static constexpr float G_P10_CURVE_SPAN2          = 0.34f;

	CL_P10_PWM() {
		memset(&_state, 0, sizeof(_state));
		_state.pin			  = 0;
		_state.channel		  = 0;
		_state.freq			  = 0;
		_state.resolutionBits = 0;
		_state.maxDuty		  = 0;
		_state.dutyPercent	  = 0.0f;
		_state.initialized	  = false;
		_state.enabled		  = false;
	}

	void begin(const ST_A20_SystemConfig_t& p_cfg) {
		memset(&_state, 0, sizeof(_state));
		_state.pin			  = p_cfg.hw.fanPwm.pin;
		_state.channel		  = (uint8_t)p_cfg.hw.fanPwm.channel;
		_state.freq			  = p_cfg.hw.fanPwm.freq;
		_state.resolutionBits = (uint8_t)p_cfg.hw.fanPwm.res;
		_state.dutyPercent	  = 0.0f;
		_state.enabled		  = true;
		_state.initialized	  = false;

		if (_state.pin < 0) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[P10] invalid fan pin=%d", (int16_t)_state.pin);
			return;
		}

#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
		bool v_ok1 = ledcAttach((uint8_t)_state.pin, _state.freq, _state.resolutionBits);
		if (!v_ok1) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[P10] ledcAttach failed pin=%d freq=%lu res=%u",
				(int16_t)_state.pin, (unsigned long)_state.freq, (unsigned)_state.resolutionBits);
			return;
		}
#else
		bool v_ok1 = ledcSetup(_state.channel, _state.freq, _state.resolutionBits);
		if (!v_ok1) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[P10] ledcSetup failed ch=%u freq=%lu res=%u",
				(unsigned)_state.channel, (unsigned long)_state.freq, (unsigned)_state.resolutionBits);
			return;
		}
		ledcAttachPin(_state.pin, _state.channel);
#endif

		if (_state.resolutionBits >= 1 && _state.resolutionBits <= 20) {
			_state.maxDuty = (1UL << _state.resolutionBits) - 1UL;
		} else {
			_state.maxDuty = 1023;
		}

		_setRawDuty(0);
		_state.initialized = true;

		CL_D10_Logger::log(EN_L10_LOG_INFO, "[P10] begin pin=%d ch=%u freq=%lu res=%u",
			(int16_t)_state.pin, (unsigned)_state.channel,
			(unsigned long)_state.freq, (unsigned)_state.resolutionBits);
	}

	void setEnabled(bool p_enabled) {
		_state.enabled = p_enabled;
		if (!_state.initialized) return;

		if (!p_enabled) {
			_state.dutyPercent = 0.0f;
			_setRawDuty(0);
		}
	}

	bool isEnabled() const { return _state.enabled; }
	bool isInitialized() const { return _state.initialized; }

	float applyFanConfigCurve(const ST_A20_FanConfig_t* p_cfg, float p_req01, float p_minFan01, float p_maxFan01) {
		float v_req = A40_ComFunc::clampVal<float>(p_req01, 0.0f, 1.0f);

		if (v_req <= 0.0f) return 0.0f;

		float v_min = A40_ComFunc::clampVal<float>(p_minFan01, 0.0f, 1.0f);
		float v_max = A40_ComFunc::clampVal<float>(p_maxFan01, 0.0f, 1.0f);
		if (v_max < v_min) v_max = v_min;

		if (!p_cfg) {
			float v_out = v_req;
			if (v_out < v_min) v_out = v_min;
			if (v_out > v_max) v_out = v_max;
			return v_out;
		}

		float s	 = A40_ComFunc::clampVal<float>(p_cfg->startPercentMin / 100.0f, 0.0f, 1.0f);
		float c1 = A40_ComFunc::clampVal<float>(p_cfg->comfortPercentMin / 100.0f, 0.0f, 1.0f);
		float c2 = A40_ComFunc::clampVal<float>(p_cfg->comfortPercentMax / 100.0f, 0.0f, 1.0f);
		float h	 = A40_ComFunc::clampVal<float>(p_cfg->hardPercentMax / 100.0f, 0.0f, 1.0f);

		if (c1 < s) c1 = s;
		if (c2 < c1) c2 = c1;
		if (h < c2) h = c2;

		if (s < v_min) s = v_min;
		if (h > v_max) h = v_max;
		if (c1 < s) c1 = s;
		if (c2 > h) c2 = h;

		// [F-9] 3구간 커브 상수화
		float v_out = 0.0f;

		if (v_req <= G_P10_CURVE_ZERO_THRESHOLD) {
			v_out = 0.0f;
		} else if (v_req < G_P10_CURVE_SPLIT1) {
			float v_t = v_req / G_P10_CURVE_SPLIT1;
			v_out	  = s * v_t;
		} else if (v_req < G_P10_CURVE_SPLIT2) {
			float v_t = (v_req - G_P10_CURVE_SPLIT1) / G_P10_CURVE_SPAN1;
			v_out	  = s + (c2 - s) * v_t;
		} else {
			float v_t = (v_req - G_P10_CURVE_SPLIT2) / G_P10_CURVE_SPAN2;
			v_out	  = c2 + (h - c2) * v_t;
		}

		if (v_out < v_min) v_out = v_min;
		if (v_out > v_max) v_out = v_max;

		return v_out;
	}

	void setDutyPercent(float p_percent) {
		if (!_state.initialized) return;

		if (!_state.enabled) {
			_state.dutyPercent = 0.0f;
			_setRawDuty(0);
			return;
		}

		if (p_percent < 0.0f) p_percent = 0.0f;
		if (p_percent > 100.0f) p_percent = 100.0f;
		_state.dutyPercent = p_percent;

		float v_ratio = p_percent / 100.0f;
		if (v_ratio < 0.0f) v_ratio = 0.0f;
		if (v_ratio > 1.0f) v_ratio = 1.0f;

		uint32_t v_raw = (uint32_t)(v_ratio * (float)_state.maxDuty + 0.5f);
		if (v_raw > _state.maxDuty) v_raw = _state.maxDuty;

		_setRawDuty(v_raw);
	}

	float getDutyPercent() const { return _state.dutyPercent; }
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
	uint32_t getRawDuty() const { return (_state.initialized) ? ledcRead((uint8_t)_state.pin) : 0; }
#else
	uint32_t getRawDuty() const { return (_state.initialized) ? ledcRead(_state.channel) : 0; }
#endif

	// 호환용 래퍼
	void P10_begin(const ST_A20_SystemConfig_t& p_cfg) { begin(p_cfg); }
	void P10_setEnabled(bool p_enabled) { setEnabled(p_enabled); }
	bool P10_isEnabled() const { return isEnabled(); }
	bool P10_isInitialized() const { return isInitialized(); }
	void P10_setDutyPercent(float p_percent) { setDutyPercent(p_percent); }
	float P10_getDutyPercent() const { return getDutyPercent(); }
	uint32_t P10_getRawDuty() const { return getRawDuty(); }

  private:
	ST_P10_PWMState_t _state;

	void _setRawDuty(uint32_t p_raw) {
		if (!_state.initialized) return;
		if (p_raw > _state.maxDuty) p_raw = _state.maxDuty;
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
		ledcWrite((uint8_t)_state.pin, p_raw);
#else
		ledcWrite(_state.channel, p_raw);
#endif
	}
};

extern CL_P10_PWM g_P10_pwm;
