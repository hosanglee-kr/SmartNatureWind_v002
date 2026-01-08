#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : S10_Simul_041.h
 * 모듈약어 : S10
 * 모듈명 : Smart Nature Wind 풍속 시뮬레이션 Manager
 * ------------------------------------------------------
 * 기능 요약:
 * - 자연풍 시뮬레이션 핵심 엔진 (Phase / 난류 / 돌풍 / 열기포 / 관성)
 * - PWM 제어기(CL_P10_PWM)와 연동하여 실시간 풍속을 PWM Duty로 변환
 * - C10 해석 결과(ST_A20_ResolvedWind_t) 기반 파라미터 적용
 * - PresetCode + StyleCode 기반 풍속 특성(범위·확률·스펙트럼) 자동 세팅
 * - Von Kármán 스펙트럼 난류 모델 + Phase별 풍속 재생성 로직
 * - 돌풍(Gust), 열기포(Thermal Bubble), 자연감 지터(Jitter) 확률적 발생
 * - 최근 60초 풍속 이력 순환 버퍼(history) 및 평균 캐시 관리
 * - 최근 120초 Chart 버퍼(1Hz 샘플링) 관리 및 JSON 직렬화 지원
 * - diffOnly 모드 지원 (WebSocket/REST 효율 전송)
 * - Phase 변화 또는 급격한 풍속 변화 시 실시간 WebSocket 브로드캐스트
 * - C10_ControlManager 및 W10_WebAPI와 완전 호환 구조
 * ------------------------------------------------------
 * [구현 규칙]
 * - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 * - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 * - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 * - JsonDocument 단일 타입만 사용
 * - createNestedArray/Object/containsKey 사용 금지
 * - memset + strlcpy 기반 안전 초기화
 * - 주석/필드명은 JSON 구조와 동일하게 유지
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 * - 전역 상수,매크로      : G_모듈약어_ 접두사
 * - 전역 변수             : g_모듈약어_ 접두사
 * - 전역 함수             : 모듈약어_ 접두사
 * - type                  : T_모듈약어_ 접두사
 * - typedef               : _t  접미사
 * - enum 상수             : EN_모듈약어_ 접두사
 * - 구조체                : ST_모듈약어_ 접미사
 * - 클래스명              : CL_모듈약어_ 접미사
 * - 클래스 private 멤버   : _ 접두사
 * - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 * - 클래스 정적 멤버      : s_ 접두사
 * - 함수 로컬 변수        : v_ 접두사
 * - 함수 인자             : p_ 접두사
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <string.h>

#include <cmath>
#include <deque>

#include "A20_Const_044.h"
#include "C10_Config_042.h"
#include "D10_Logger_040.h"
#include "P10_PWM_ctrl_040.h"


#include "S10_Simul_Const_040.h"

// ------------------------------------------------------
// S10 -> CT10 Dirty bridge (forward decl only)
// ------------------------------------------------------
extern void CT10_markDirtyFromSim(const char* p_key);



// ======================================================
// CL_S10_Simulation
// ======================================================
class CL_S10_Simulation {
  public:
	// ------------------ 상태/파라미터 ------------------
	bool				 active				 = false;
	bool				 fanPowerEnabled	 = true;

	float				 currentWindSpeed	 = 3.6f;
	float				 targetWindSpeed	 = 3.6f;

	char				 presetCode[24]		 = { 0 };
	char				 styleCode[24]		 = { 0 };

	// C10 해석 결과 기반 파라미터
	float				 userIntensity		 = 70.0f;  // (0~100)
	float				 userVariability	 = 50.0f;  // (0~100)
	float				 userGustFreq		 = 45.0f;  // (0~100)
	float				 minFanPct			 = 10.0f;  // (0~100)
	float				 fanLimitPct		 = 90.0f;  // (0~100)

	float				 turbLenScale		 = 40.0f;
	float				 turbSigma			 = 0.5f;
	float				 thermalStrength	 = 2.0f;
	float				 thermalRadius		 = 18.0f;

	// Phase 상태
	EN_A20_WindPhase_t	 phase				 = EN_A20_WIND_PHASE_NORMAL;
	float				 phaseStartSec		 = 0.0f;	// [s]
	float				 phaseDurationSec	 = 120.0f;	// [s]
	float				 phaseMinWind		 = 2.0f;
	float				 phaseMaxWind		 = 6.0f;

	// Preset 기반 범위/확률 (applyPresetCore에서 설정됨)
	float				 baseMinWind		 = 1.8f;
	float				 baseMaxWind		 = 5.5f;

	// -------------------- 중요: 확률 의미 정규화 --------------------
	// gustProbBase / thermalFreqBase는 "Tick당 확률"이 아니라,
	// "초당 발생률(rate, 1/sec)"로 정의한다.
	// - 구현부에서는 평가 간격(dtSec)에 따라
	//   P = 1 - exp(-ratePerSec * dtSec) 로 자동 보정해야 한다.
	float				 gustProbBase		 = 0.040f;	// [1/sec] 돌풍 기본 발생률(초당)
	float				 gustStrengthMax	 = 2.1f;	// [-]     돌풍 최대 강도 배율
	float				 thermalFreqBase	 = 0.022f;	// [1/sec] 열기포 기본 발생률(초당)
	// ----------------------------------------------------------------

	// 난류(스펙트럼) 상태
	float				 spectralEnergyBuf	 = 0.0f;
	float				 spectralPhaseAcc	 = 0.0f;
	float				 turbTimeScale		 = 5.0f;

	// 돌풍 상태
	bool				 gustActive			 = false;
	float				 gustStartSec		 = 0.0f;  // [s]
	float				 gustDuration		 = 3.0f;  // [s]
	float				 gustIntensity		 = 1.0f;
	unsigned long		 lastGustCheckMs	 = 0;

	// 열기포 상태
	bool				 thermalActive		 = false;
	float				 thermalStartSec	 = 0.0f;  // [s]
	float				 thermalDuration	 = 8.0f;  // [s]
	float				 thermalContribution = 0.0f;
	unsigned long		 lastThermalCheckMs	 = 0;

	// 관성/업데이트
	float				 windChangeRate		 = 0.12f;
	float				 windMomentum		 = 0.0f;
	unsigned long		 lastUpdateMs		 = 0;

	// 최근 풍속 샘플 저장
	static const uint8_t HISTORY_SIZE		 = 60;	// [sample] 1Hz 기준 60초
	float				 history[HISTORY_SIZE];
	uint8_t				 historyIndex  = 0;
	uint8_t				 historyCount  = 0;
	float				 avgWindCached = 0.0f;

	struct ST_ChartEntry {
		unsigned long timestamp;
		float		  wind_speed;
		float		  pwm_duty;
		float		  intensity;
		float		  variability;
		float		  turbulence_sigma;
		uint8_t		  preset_index;
		bool		  gust_active;
		bool		  thermal_active;
	};
	static std::deque<ST_ChartEntry> s_chartBuffer;
	static unsigned long			 s_lastChartLogMs;
	static unsigned long			 s_lastChartSampleMs;

  public:
	void begin(CL_P10_PWM& p_pwm);
	void stop();
	void resetDefaults();

	void tick();
	void applyResolvedWind(const ST_A20_ResolvedWind_t& p_resolved);

	bool patchFromJson(const JsonDocument& p_doc);

	void toJson(JsonDocument& p_doc);
	void toChartJson(JsonDocument& p_doc, bool p_diffOnly = false);

  private:

	CL_P10_PWM*				  	_pwm		  		= nullptr;

	const ST_A20_FanConfig_t* 	_fanCfgSnap 		= nullptr;

	SemaphoreHandle_t 			_recursiveMutex 	= nullptr;
	portMUX_TYPE			  	_flagSpinlock	  	= portMUX_INITIALIZER_UNLOCKED; // _flagMutex

	unsigned long			  	_tickNowMs  	= 0;
	float					  	_tickNowSec 	= 0.0f;

	void applyFan(float p_pct);
	void applyPresetCore(const char* p_code);
	void initPhaseFromBase();
	void updatePhase();
	void calcTurb(float p_dt);
	void calcThermalEnvelope();
	void updateGust();
	void updateThermal();
	void generateTarget();

	void _updateWindHistory(float p_speed);
	float _getAvgWindFast() const;
};
