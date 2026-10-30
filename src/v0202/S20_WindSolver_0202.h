#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : S20_WindSolver_0202.h
 * 모듈 약어 : S20
 * 모듈명 : Smart Nature Wind - Wind Parameter Solver
 * ------------------------------------------------------
 * 기능 요약:
 *  - WindDict 기반 프리셋/스타일/보정값을 조합하여
 *    최종 제어용 바람 파라미터(ResolvedWind) 계산
 *  - ControlManager(CT10), Simulation(S10) 등에서 공용 사용
 * ------------------------------------------------------
 * [구현 규칙]
 *  - ArduinoJson 의존 없음 (ConfigManager에서 역직렬화 완료된 구조체만 사용)
 *  - 순수 데이터 연산만 수행, 외부 상태 접근 금지
 *  - JsonDocument 생성/조작 금지
 *  - clamp 및 문자열 복사는 A20_Const_015.h의 공용 유틸 사용
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 *  - 전역 함수: S20_ 접두사
 *  - 타입: T_S20_ 접두사
 *  - 지역 변수: v_
 *  - 인자: p_
 * ------------------------------------------------------
 */

#include "A20_Const_0202.h"
#include "A40_Com_Utils_0202.h"
#include "A22_Com_Lookup_0202.h"



// ------------------------------------------------------
// Wind Profile 해석 함수
// ------------------------------------------------------

inline bool S20_resolveWindParams(const ST_A20_WindDict_t& p_dict, const char* p_presetCode, const char* p_styleCode, const ST_A20_SegmentOverride_t* p_override, ST_A20_ResolvedWind_t& p_out) {
	// 0) 출력 안전 초기화 (실패해도 안전)
	memset(&p_out, 0, sizeof(p_out));
	p_out.valid	 = false;

	// 1) preset 찾기
	int16_t v_pi = A20_findPresetIndexByCode(p_dict, p_presetCode);
	if (v_pi < 0) {
		// presetCode/styleCode는 호출자가 확인 가능하도록 최소 복사
		strlcpy(p_out.presetCode, p_presetCode ? p_presetCode : "", sizeof(p_out.presetCode));
		strlcpy(p_out.styleCode, p_styleCode ? p_styleCode : "", sizeof(p_out.styleCode));
		return false;
	}

	const ST_A20_PresetEntry_t& v_preset	   = p_dict.presets[v_pi];

	// 2) base 로드
	float						v_int  = v_preset.factors.windIntensity;
	float						v_var  = v_preset.factors.windVariability;
	float						v_gust = v_preset.factors.gustFrequency;
	float						v_fl   = v_preset.factors.fanLimit;
	float						v_min  = v_preset.factors.minFan;

	float						v_tL   = v_preset.factors.turbulenceLengthScale;
	float						v_tS   = v_preset.factors.turbulenceIntensitySigma;
	float						v_thB  = v_preset.factors.thermalBubbleStrength;
	float						v_thR  = v_preset.factors.thermalBubbleRadius;

	// 3) style factor 적용(스타일 없으면 스킵)
	if (p_styleCode && p_styleCode[0]) {
		int16_t v_si = A20_findStyleIndexByCode(p_dict, p_styleCode);
		if (v_si >= 0) {
			const ST_A20_StyleEntry_t& v_s = p_dict.styles[v_si];
			v_int *= v_s.factors.intensityFactor;
			v_var *= v_s.factors.variabilityFactor;
			v_gust *= v_s.factors.gustFactor;
			v_thB *= v_s.factors.thermalFactor;
		}
	}

	// 4) Segment Override 적용 (활성화 시 프리셋*스타일 값을 직접 덮어씀)
	if (p_override && p_override->enabled) {
		if (p_override->windIntensity >= 0.0f) {
			v_int = A40_ComFunc::clampVal<float>(p_override->windIntensity, 0.0f, 100.0f);
		}
		if (p_override->windVariability >= 0.0f) {
			v_var = A40_ComFunc::clampVal<float>(p_override->windVariability, 0.0f, 100.0f);
		}
		if (p_override->gustFrequency >= 0.0f) {
			v_gust = A40_ComFunc::clampVal<float>(p_override->gustFrequency, 0.0f, 100.0f);
		}
	}

	// 5) clamp + 관계 보정(min <= limit)
	p_out.windIntensity   = A40_ComFunc::clampVal<float>(v_int, 0.0f, 100.0f);
	p_out.windVariability = A40_ComFunc::clampVal<float>(v_var, 0.0f, 100.0f);
	p_out.gustFrequency   = A40_ComFunc::clampVal<float>(v_gust, 0.0f, 100.0f);

	float v_fl_c		   = A40_ComFunc::clampVal<float>(v_fl, 0.0f, 100.0f);
	float v_min_c		   = A40_ComFunc::clampVal<float>(v_min, 0.0f, 100.0f);
	if (v_min_c > v_fl_c)
		v_min_c = v_fl_c;

	p_out.fanLimit					 = v_fl_c;
	p_out.minFan					 = v_min_c;

	// 6) 물리 파라미터 최소 보정
	p_out.turbulenceLengthScale	 = (v_tL > 1.0f) ? v_tL : 1.0f;
	p_out.turbulenceIntensitySigma = (v_tS > 0.0f) ? v_tS : 0.0f;
	p_out.thermalBubbleStrength	 = (v_thB > 0.1f) ? v_thB : 0.1f;
	p_out.thermalBubbleRadius		 = (v_thR > 1.0f) ? v_thR : 1.0f;

	p_out.baseMinWind     = v_preset.factors.baseMinWind;
	p_out.baseMaxWind     = v_preset.factors.baseMaxWind;
	p_out.gustProbBase    = v_preset.factors.gustProbBase;
	p_out.gustStrengthMax = v_preset.factors.gustStrengthMax;
	p_out.thermalFreqBase = v_preset.factors.thermalFreqBase;

	// 7) 코드 복사
	strlcpy(p_out.presetCode, p_presetCode ? p_presetCode : "", sizeof(p_out.presetCode));
	strlcpy(p_out.styleCode, p_styleCode ? p_styleCode : "", sizeof(p_out.styleCode));

	// 8) 기본 플래그
	p_out.fixedMode	 = false;
	p_out.fixedSpeed = 0.0f;
	p_out.valid		 = true;
	return true;
}
