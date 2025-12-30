/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Schedule_043.cpp
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager - Schedule/UserProfiles/WindProfile
 * ------------------------------------------------------
 * 기능 요약:
 *  - Schedules / UserProfiles / WindProfileDict Load/Save
 *  - 위 섹션들의 JSON Export / Patch
 *  - Schedule / UserProfiles / WindProfile CRUD
 * ------------------------------------------------------
 * [구현 규칙]
 *  - 항상 소스 시작 주석 체계 유지
 *  - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 *  - JsonDocument 단일 타입만 사용
 *  - createNestedArray/Object/containsKey 사용 금지
 *  - memset + strlcpy 기반 안전 초기화
 *  - 주석/필드명은 JSON 구조와 동일하게 유지
 *  - 모듈별 헤더(h) + 목적물별 cpp 분리 구성 (Core/System/Schedule)
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

#include <new>
#include "C10_Config_041.h"

// ------------------------------------------------------
// Schedule ID 정책
//  - schId: 사용자 입력 불가(무시), 자동 발급
//  - 시작값: 10, 증가: 10
//  - schNo: 사용자 입력(중복 불가), 동일번호 중복 시 오류
// ------------------------------------------------------
#ifndef G_C10_SCH_ID_START
#	define G_C10_SCH_ID_START 10
#endif
#ifndef G_C10_SCH_ID_STEP
#	define G_C10_SCH_ID_STEP 10
#endif

// =====================================================
// 내부 Helper
// =====================================================
static uint16_t C10_nextScheduleId(const ST_A20_SchedulesRoot_t& p_root) {
	uint16_t v_max = 0;
	for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
		if (p_root.items[v_i].schId > v_max) v_max = p_root.items[v_i].schId;
	}
	if (v_max < (uint16_t)G_C10_SCH_ID_START) return (uint16_t)G_C10_SCH_ID_START;
	// overflow 방어 (uint16_t)
	uint32_t v_next = (uint32_t)v_max + (uint32_t)G_C10_SCH_ID_STEP;
	if (v_next > 65535u) return (uint16_t)G_C10_SCH_ID_START;
	return (uint16_t)v_next;
}

static bool C10_isScheduleNoDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint16_t p_schNo, uint16_t p_excludeSchId) {
	for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
		const ST_A20_ScheduleItem_t& v_s = p_root.items[v_i];
		if (v_s.schId == p_excludeSchId) continue;
		if (v_s.schNo == p_schNo) return true;
	}
	return false;
}

static bool C10_isScheduleNoDuplicatedInList(const ST_A20_SchedulesRoot_t& p_root) {
	for (uint8_t v_i = 0; v_i < p_root.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
		for (uint8_t v_j = (uint8_t)(v_i + 1); v_j < p_root.count && v_j < A20_Const::MAX_SCHEDULES; v_j++) {
			if (p_root.items[v_i].schNo == p_root.items[v_j].schNo) return true;
		}
	}
	return false;
}

// =====================================================
// 내부 Helper: Schedule / UserProfile / WindPreset 디코더
//  - JSON 키는 camelCase 기준
//  - schId는 사용자 입력 불가: fromJson에서는 읽지 않음(호출자가 강제 설정)
// =====================================================
static void C10_fromJson_ScheduleItem(const JsonObjectConst& p_js, ST_A20_ScheduleItem_t& p_s, bool p_keepExistingId = true) {
	// schId: 사용자 입력 무시(keepExistingId=true이면 유지)
	if (!p_keepExistingId) {
		p_s.schId = 0;
	}

	// schNo: 사용자 입력(중복 검증은 상위에서)
	p_s.schNo = p_js["schNo"] | 0;

	strlcpy(p_s.name, p_js["name"] | "", sizeof(p_s.name));
	p_s.enabled = p_js["enabled"] | true;

	p_s.repeatSegments = p_js["repeatSegments"] | true;
	p_s.repeatCount    = p_js["repeatCount"] | 0;

	// period
	for (uint8_t v_d = 0; v_d < 7; v_d++) {
		p_s.period.days[v_d] = p_js["period"]["days"][v_d] | 1;
	}
	strlcpy(p_s.period.startTime, p_js["period"]["startTime"] | "00:00", sizeof(p_s.period.startTime));
	strlcpy(p_s.period.endTime, p_js["period"]["endTime"] | "23:59", sizeof(p_s.period.endTime));

	// segments
	p_s.segCount = 0;
	if (p_js["segments"].is<JsonArrayConst>()) {
		JsonArrayConst v_segArr = p_js["segments"].as<JsonArrayConst>();
		for (JsonObjectConst jseg : v_segArr) {
			if (p_s.segCount >= A20_Const::MAX_SEGMENTS_PER_SCHEDULE) break;

			ST_A20_ScheduleSegment_t& sg = p_s.segments[p_s.segCount++];

			sg.segId      = jseg["segId"] | 0;
			sg.segNo      = jseg["segNo"] | 0;
			sg.onMinutes  = jseg["onMinutes"] | 10;
			sg.offMinutes = jseg["offMinutes"] | 0;

			const char* v_mode = jseg["mode"] | "PRESET";
			sg.mode            = A20_modeFromString(v_mode);

			strlcpy(sg.presetCode, jseg["presetCode"] | "", sizeof(sg.presetCode));
			strlcpy(sg.styleCode,  jseg["styleCode"]  | "", sizeof(sg.styleCode));

			memset(&sg.adjust, 0, sizeof(sg.adjust));
			if (jseg["adjust"].is<JsonObjectConst>()) {
				JsonObjectConst adj                = jseg["adjust"].as<JsonObjectConst>();
				sg.adjust.windIntensity            = adj["windIntensity"] | 0.0f;
				sg.adjust.windVariability          = adj["windVariability"] | 0.0f;
				sg.adjust.gustFrequency            = adj["gustFrequency"] | 0.0f;
				sg.adjust.fanLimit                 = adj["fanLimit"] | 0.0f;
				sg.adjust.minFan                   = adj["minFan"] | 0.0f;
				sg.adjust.turbulenceLengthScale    = adj["turbulenceLengthScale"] | 0.0f;     // camelCase
				sg.adjust.turbulenceIntensitySigma = adj["turbulenceIntensitySigma"] | 0.0f;  // camelCase
			}

			sg.fixedSpeed = jseg["fixedSpeed"] | 0.0f; // camelCase
		}
	}

	// autoOff
	memset(&p_s.autoOff, 0, sizeof(p_s.autoOff));
	if (p_js["autoOff"].is<JsonObjectConst>()) {
		JsonObjectConst ao          = p_js["autoOff"].as<JsonObjectConst>();
		p_s.autoOff.timer.enabled   = ao["timer"]["enabled"] | false;
		p_s.autoOff.timer.minutes   = ao["timer"]["minutes"] | 0;
		p_s.autoOff.offTime.enabled = ao["offTime"]["enabled"] | false;
		strlcpy(p_s.autoOff.offTime.time, ao["offTime"]["time"] | "", sizeof(p_s.autoOff.offTime.time));
		p_s.autoOff.offTemp.enabled = ao["offTemp"]["enabled"] | false;
		p_s.autoOff.offTemp.temp    = ao["offTemp"]["temp"] | 0.0f;
	}

	// motion
	p_s.motion.pir.enabled       = p_js["motion"]["pir"]["enabled"] | false;
	p_s.motion.pir.holdSec       = p_js["motion"]["pir"]["holdSec"] | 0;
	p_s.motion.ble.enabled       = p_js["motion"]["ble"]["enabled"] | false;
	p_s.motion.ble.rssiThreshold = p_js["motion"]["ble"]["rssiThreshold"] | -70; // camelCase
	p_s.motion.ble.holdSec       = p_js["motion"]["ble"]["holdSec"] | 0;
}

static void C10_fromJson_UserProfile(const JsonObjectConst& p_jp, ST_A20_UserProfileItem_t& p_up) {
	p_up.profileId = p_jp["profileId"] | 0;
	p_up.profileNo = p_jp["profileNo"] | 0;
	strlcpy(p_up.name, p_jp["name"] | "", sizeof(p_up.name));
	p_up.enabled = p_jp["enabled"] | true;

	p_up.repeatSegments = p_jp["repeatSegments"] | true;
	p_up.repeatCount    = p_jp["repeatCount"] | 0;

	// segments
	p_up.segCount = 0;
	if (p_jp["segments"].is<JsonArrayConst>()) {
		JsonArrayConst v_sArr = p_jp["segments"].as<JsonArrayConst>();
		for (JsonObjectConst jseg : v_sArr) {
			if (p_up.segCount >= A20_Const::MAX_SEGMENTS_PER_PROFILE) break;

			ST_A20_UserProfileSegment_t& sg = p_up.segments[p_up.segCount++];

			sg.segId      = jseg["segId"] | 0;
			sg.segNo      = jseg["segNo"] | 0;
			sg.onMinutes  = jseg["onMinutes"] | 10;
			sg.offMinutes = jseg["offMinutes"] | 0;

			const char* v_mode = jseg["mode"] | "PRESET";
			sg.mode            = A20_modeFromString(v_mode);

			strlcpy(sg.presetCode, jseg["presetCode"] | "", sizeof(sg.presetCode));
			strlcpy(sg.styleCode,  jseg["styleCode"]  | "", sizeof(sg.styleCode));

			memset(&sg.adjust, 0, sizeof(sg.adjust));
			if (jseg["adjust"].is<JsonObjectConst>()) {
				JsonObjectConst adj                = jseg["adjust"].as<JsonObjectConst>();
				sg.adjust.windIntensity            = adj["windIntensity"] | 0.0f;
				sg.adjust.windVariability          = adj["windVariability"] | 0.0f;
				sg.adjust.gustFrequency            = adj["gustFrequency"] | 0.0f;
				sg.adjust.fanLimit                 = adj["fanLimit"] | 0.0f;
				sg.adjust.minFan                   = adj["minFan"] | 0.0f;
				sg.adjust.turbulenceLengthScale    = adj["turbulenceLengthScale"] | 0.0f;     // camelCase
				sg.adjust.turbulenceIntensitySigma = adj["turbulenceIntensitySigma"] | 0.0f;  // camelCase
			}

			sg.fixedSpeed = jseg["fixedSpeed"] | 0.0f; // camelCase
		}
	}

	// autoOff
	memset(&p_up.autoOff, 0, sizeof(p_up.autoOff));
	if (p_jp["autoOff"].is<JsonObjectConst>()) {
		JsonObjectConst ao           = p_jp["autoOff"].as<JsonObjectConst>();
		p_up.autoOff.timer.enabled   = ao["timer"]["enabled"] | false;
		p_up.autoOff.timer.minutes   = ao["timer"]["minutes"] | 0;
		p_up.autoOff.offTime.enabled = ao["offTime"]["enabled"] | false;
		strlcpy(p_up.autoOff.offTime.time, ao["offTime"]["time"] | "", sizeof(p_up.autoOff.offTime.time));
		p_up.autoOff.offTemp.enabled = ao["offTemp"]["enabled"] | false;
		p_up.autoOff.offTemp.temp    = ao["offTemp"]["temp"] | 0.0f;
	}

	// motion
	p_up.motion.pir.enabled       = p_jp["motion"]["pir"]["enabled"] | false;
	p_up.motion.pir.holdSec       = p_jp["motion"]["pir"]["holdSec"] | 0;
	p_up.motion.ble.enabled       = p_jp["motion"]["ble"]["enabled"] | false;
	p_up.motion.ble.rssiThreshold = p_jp["motion"]["ble"]["rssiThreshold"] | -70; // camelCase
	p_up.motion.ble.holdSec       = p_jp["motion"]["ble"]["holdSec"] | 0;
}

static void C10_fromJson_WindPreset(const JsonObjectConst& p_js, ST_A20_PresetEntry_t& p_p) {
	strlcpy(p_p.name, p_js["name"] | "", sizeof(p_p.name));
	strlcpy(p_p.code, p_js["code"] | "", sizeof(p_p.code));

	JsonObjectConst v_b = p_js["base"].as<JsonObjectConst>();

	p_p.base.windIntensity            = v_b["windIntensity"] | 70.0f;
	p_p.base.gustFrequency            = v_b["gustFrequency"] | 40.0f;
	p_p.base.windVariability          = v_b["windVariability"] | 50.0f;
	p_p.base.fanLimit                 = v_b["fanLimit"] | 95.0f;
	p_p.base.minFan                   = v_b["minFan"] | 10.0f;
	p_p.base.turbulenceLengthScale    = v_b["turbulenceLengthScale"] | 40.0f;      // camelCase
	p_p.base.turbulenceIntensitySigma = v_b["turbulenceIntensitySigma"] | 0.5f;    // camelCase
	p_p.base.thermalBubbleStrength    = v_b["thermalBubbleStrength"] | 2.0f;       // camelCase
	p_p.base.thermalBubbleRadius      = v_b["thermalBubbleRadius"] | 18.0f;        // camelCase

	p_p.base.baseMinWind      = v_b["baseMinWind"] | 1.8f;       // camelCase
	p_p.base.baseMaxWind      = v_b["baseMaxWind"] | 5.5f;       // camelCase
	p_p.base.gustProbBase     = v_b["gustProbBase"] | 0.040f;    // camelCase
	p_p.base.gustStrengthMax  = v_b["gustStrengthMax"] | 2.10f;  // camelCase
	p_p.base.thermalFreqBase  = v_b["thermalFreqBase"] | 0.022f; // camelCase
}

// =====================================================
// 2-1. 목적물별 Load 구현 (Schedules/UserProfiles/WindProfileDict)
//  - 단독 호출(섹션 lazy-load) 대비: resetxxxdefault 적용
// =====================================================
bool CL_C10_ConfigManager::loadSchedules(ST_A20_SchedulesRoot_t& p_cfg) {
	JsonDocument d;

	const char* v_cfgJsonPath = nullptr;
	if (s_cfgJsonFileMap.schedules[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.schedules;

	if (!v_cfgJsonPath) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: s_cfgJsonFileMap.schedules empty");
		return false;
	}

	// 단독 호출 대비 기본값
	A20_resetSchedulesDefault(p_cfg);

	if (!ioLoadJson(v_cfgJsonPath, d)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: ioLoadJson failed (%s)", v_cfgJsonPath);
		return false;
	}

	JsonArrayConst arr = d["schedules"].as<JsonArrayConst>();
	p_cfg.count        = 0;

	if (arr.isNull()) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadSchedules: missing 'schedules' array (empty)");
		return true; // 정책: 빈/누락은 empty로 허용
	}

	// schId는 파일에 들어있어도 신뢰하지 않음(정책상 사용자입력 불가)
	// 로드시에는 저장된 schId를 그대로 유지하는 대신, 일관성을 위해 재발급(10,20,...)도 가능하지만
	// 여기서는 "파일에 있는 값은 내부데이터"로 보고 유지하지 않고 재발급합니다.
	uint16_t v_id = (uint16_t)G_C10_SCH_ID_START;

	for (JsonObjectConst js : arr) {
		if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

		ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
		memset(&s, 0, sizeof(s));
		s.schId = v_id;

		C10_fromJson_ScheduleItem(js, s, true);

		p_cfg.count++;
		v_id = (uint16_t)((uint32_t)v_id + (uint32_t)G_C10_SCH_ID_STEP);
	}

	// schNo 중복 체크(파일이 잘못된 경우)
	if (C10_isScheduleNoDuplicatedInList(p_cfg)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadSchedules: duplicated schNo detected. Load rejected.");
		// 정책: 중복이면 실패 처리
		A20_resetSchedulesDefault(p_cfg);
		return false;
	}

	return true;
}

bool CL_C10_ConfigManager::loadUserProfiles(ST_A20_UserProfilesRoot_t& p_cfg) {
	JsonDocument d;

	const char* v_cfgJsonPath = nullptr;
	if (s_cfgJsonFileMap.userProfiles[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.userProfiles;

	if (!v_cfgJsonPath) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadUserProfiles: s_cfgJsonFileMap.userProfiles empty");
		return false;
	}

	// 단독 호출 대비 기본값
	A20_resetUserProfilesDefault(p_cfg);

	if (!ioLoadJson(v_cfgJsonPath, d)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadUserProfiles: ioLoadJson failed (%s)", v_cfgJsonPath);
		return false;
	}

	JsonArrayConst arr = d["userProfiles"]["profiles"].as<JsonArrayConst>();
	p_cfg.count        = 0;

	if (arr.isNull()) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadUserProfiles: missing 'userProfiles.profiles' (empty)");
		return true;
	}

	for (JsonObjectConst jp : arr) {
		if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

		ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count++];
		memset(&up, 0, sizeof(up));
		C10_fromJson_UserProfile(jp, up);
	}

	return true;
}

bool CL_C10_ConfigManager::loadWindProfileDict(ST_A20_WindProfileDict_t& p_dict) {
	JsonDocument d;

	const char* v_cfgJsonPath = nullptr;
	if (s_cfgJsonFileMap.windDict[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.windDict;

	if (!v_cfgJsonPath) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWindProfileDict: s_cfgJsonFileMap.windDict empty");
		return false;
	}

	// 단독 호출 대비 기본값
	A20_resetWindProfileDictDefault(p_dict);

	if (!ioLoadJson(v_cfgJsonPath, d)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] loadWindProfileDict: ioLoadJson failed (%s)", v_cfgJsonPath);
		return false;
	}

	JsonObjectConst j = d["windDict"].as<JsonObjectConst>();
	if (j.isNull()) {
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[C10] loadWindProfileDict: missing 'windDict' (empty)");
		p_dict.presetCount = 0;
		p_dict.styleCount  = 0;
		return true;
	}

	p_dict.presetCount = 0;
	if (j["presets"].is<JsonArrayConst>()) {
		JsonArrayConst v_arr = j["presets"].as<JsonArrayConst>();
		for (JsonObjectConst v_js : v_arr) {
			if (p_dict.presetCount >= 16) break; // TODO: A20_Const 상수로 교체 권장
			ST_A20_PresetEntry_t& v_p = p_dict.presets[p_dict.presetCount++];
			memset(&v_p, 0, sizeof(v_p));
			C10_fromJson_WindPreset(v_js, v_p);
		}
	}

	p_dict.styleCount = 0;
	if (j["styles"].is<JsonArrayConst>()) {
		JsonArrayConst v_arr = j["styles"].as<JsonArrayConst>();
		for (JsonObjectConst v_js : v_arr) {
			if (p_dict.styleCount >= 16) break; // TODO: A20_Const 상수로 교체 권장

			ST_A20_StyleEntry_t& v_s = p_dict.styles[p_dict.styleCount++];
			memset(&v_s, 0, sizeof(v_s));

			strlcpy(v_s.name, v_js["name"] | "", sizeof(v_s.name));
			strlcpy(v_s.code, v_js["code"] | "", sizeof(v_s.code));

			JsonObjectConst v_f          = v_js["factors"].as<JsonObjectConst>();
			v_s.factors.intensityFactor   = v_f["intensityFactor"] | 1.0f;   // camelCase
			v_s.factors.variabilityFactor = v_f["variabilityFactor"] | 1.0f; // camelCase
			v_s.factors.gustFactor        = v_f["gustFactor"] | 1.0f;        // camelCase
			v_s.factors.thermalFactor     = v_f["thermalFactor"] | 1.0f;     // camelCase
		}
	}

	return true;
}

// =====================================================
// 2-2. 목적물별 Save 구현 (Schedules/UserProfiles/WindProfileDict)
// =====================================================
bool CL_C10_ConfigManager::saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg) {
	JsonDocument d;

	for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
		const ST_A20_ScheduleItem_t& s = p_cfg.items[v_i];

		// JsonObject를 명확히 생성
		JsonObject js = d["schedules"][v_i].to<JsonObject>();

		// schId는 내부 정책값이지만 파일에 저장은 가능(리커버리/디버깅 목적)
		js["schId"]          = s.schId;
		js["schNo"]          = s.schNo;
		js["name"]           = s.name;
		js["enabled"]        = s.enabled;
		js["repeatSegments"] = s.repeatSegments;
		js["repeatCount"]    = s.repeatCount;

		for (uint8_t v_d = 0; v_d < 7; v_d++) {
			js["period"]["days"][v_d] = s.period.days[v_d];
		}
		js["period"]["startTime"] = s.period.startTime;
		js["period"]["endTime"]   = s.period.endTime;

		for (uint8_t v_k = 0; v_k < s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
			const ST_A20_ScheduleSegment_t& sg = s.segments[v_k];
			JsonObject jseg = js["segments"][v_k].to<JsonObject>();

			jseg["segId"]      = sg.segId;
			jseg["segNo"]      = sg.segNo;
			jseg["onMinutes"]  = sg.onMinutes;
			jseg["offMinutes"] = sg.offMinutes;

			jseg["mode"]       = A20_modeToString(sg.mode);
			jseg["presetCode"] = sg.presetCode;
			jseg["styleCode"]  = sg.styleCode;

			JsonObject adj = jseg["adjust"].to<JsonObject>();
			adj["windIntensity"]            = sg.adjust.windIntensity;
			adj["windVariability"]          = sg.adjust.windVariability;
			adj["gustFrequency"]            = sg.adjust.gustFrequency;
			adj["fanLimit"]                 = sg.adjust.fanLimit;
			adj["minFan"]                   = sg.adjust.minFan;
			adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;     // camelCase
			adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;  // camelCase

			jseg["fixedSpeed"] = sg.fixedSpeed; // camelCase
		}

		JsonObject ao = js["autoOff"].to<JsonObject>();
		ao["timer"]["enabled"]     = s.autoOff.timer.enabled;
		ao["timer"]["minutes"]     = s.autoOff.timer.minutes;
		ao["offTime"]["enabled"]   = s.autoOff.offTime.enabled;
		ao["offTime"]["time"]      = s.autoOff.offTime.time;
		ao["offTemp"]["enabled"]   = s.autoOff.offTemp.enabled;
		ao["offTemp"]["temp"]      = s.autoOff.offTemp.temp;

		js["motion"]["pir"]["enabled"]       = s.motion.pir.enabled;
		js["motion"]["pir"]["holdSec"]       = s.motion.pir.holdSec;
		js["motion"]["ble"]["enabled"]       = s.motion.ble.enabled;
		js["motion"]["ble"]["rssiThreshold"] = s.motion.ble.rssiThreshold; // camelCase
		js["motion"]["ble"]["holdSec"]       = s.motion.ble.holdSec;
	}

	return ioSaveJson(s_cfgJsonFileMap.schedules, d);
}

bool CL_C10_ConfigManager::saveUserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg) {
	JsonDocument d;

	for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
		const ST_A20_UserProfileItem_t& up = p_cfg.items[v_i];
		JsonObject jp = d["userProfiles"]["profiles"][v_i].to<JsonObject>();

		jp["profileId"]      = up.profileId;
		jp["profileNo"]      = up.profileNo;
		jp["name"]           = up.name;
		jp["enabled"]        = up.enabled;
		jp["repeatSegments"] = up.repeatSegments;
		jp["repeatCount"]    = up.repeatCount;

		for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_k++) {
			const ST_A20_UserProfileSegment_t& sg = up.segments[v_k];
			JsonObject jseg = jp["segments"][v_k].to<JsonObject>();

			jseg["segId"]      = sg.segId;
			jseg["segNo"]      = sg.segNo;
			jseg["onMinutes"]  = sg.onMinutes;
			jseg["offMinutes"] = sg.offMinutes;

			jseg["mode"]       = A20_modeToString(sg.mode);
			jseg["presetCode"] = sg.presetCode;
			jseg["styleCode"]  = sg.styleCode;

			JsonObject adj = jseg["adjust"].to<JsonObject>();
			adj["windIntensity"]            = sg.adjust.windIntensity;
			adj["windVariability"]          = sg.adjust.windVariability;
			adj["gustFrequency"]            = sg.adjust.gustFrequency;
			adj["fanLimit"]                 = sg.adjust.fanLimit;
			adj["minFan"]                   = sg.adjust.minFan;
			adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;     // camelCase
			adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;  // camelCase

			jseg["fixedSpeed"] = sg.fixedSpeed; // camelCase
		}

		JsonObject ao = jp["autoOff"].to<JsonObject>();
		ao["timer"]["enabled"]     = up.autoOff.timer.enabled;
		ao["timer"]["minutes"]     = up.autoOff.timer.minutes;
		ao["offTime"]["enabled"]   = up.autoOff.offTime.enabled;
		ao["offTime"]["time"]      = up.autoOff.offTime.time;
		ao["offTemp"]["enabled"]   = up.autoOff.offTemp.enabled;
		ao["offTemp"]["temp"]      = up.autoOff.offTemp.temp;

		jp["motion"]["pir"]["enabled"]       = up.motion.pir.enabled;
		jp["motion"]["pir"]["holdSec"]       = up.motion.pir.holdSec;
		jp["motion"]["ble"]["enabled"]       = up.motion.ble.enabled;
		jp["motion"]["ble"]["rssiThreshold"] = up.motion.ble.rssiThreshold; // camelCase
		jp["motion"]["ble"]["holdSec"]       = up.motion.ble.holdSec;
	}

	return ioSaveJson(s_cfgJsonFileMap.userProfiles, d);
}

bool CL_C10_ConfigManager::saveWindProfileDict(const ST_A20_WindProfileDict_t& p_cfg) {
	JsonDocument d;

	// presets
	for (uint8_t v_i = 0; v_i < p_cfg.presetCount; v_i++) {
		const ST_A20_PresetEntry_t& v_p = p_cfg.presets[v_i];
		JsonObject v_js = d["windDict"]["presets"][v_i].to<JsonObject>();

		v_js["name"] = v_p.name;
		v_js["code"] = v_p.code;

		JsonObject v_b = v_js["base"].to<JsonObject>();
		v_b["windIntensity"]            = v_p.base.windIntensity;
		v_b["gustFrequency"]            = v_p.base.gustFrequency;
		v_b["windVariability"]          = v_p.base.windVariability;
		v_b["fanLimit"]                 = v_p.base.fanLimit;
		v_b["minFan"]                   = v_p.base.minFan;
		v_b["turbulenceLengthScale"]    = v_p.base.turbulenceLengthScale;     // camelCase
		v_b["turbulenceIntensitySigma"] = v_p.base.turbulenceIntensitySigma;  // camelCase
		v_b["thermalBubbleStrength"]    = v_p.base.thermalBubbleStrength;     // camelCase
		v_b["thermalBubbleRadius"]      = v_p.base.thermalBubbleRadius;       // camelCase

		v_b["baseMinWind"]     = v_p.base.baseMinWind;      // camelCase
		v_b["baseMaxWind"]     = v_p.base.baseMaxWind;      // camelCase
		v_b["gustProbBase"]    = v_p.base.gustProbBase;     // camelCase
		v_b["gustStrengthMax"] = v_p.base.gustStrengthMax;  // camelCase
		v_b["thermalFreqBase"] = v_p.base.thermalFreqBase;  // camelCase
	}

	// styles
	for (uint8_t v_i = 0; v_i < p_cfg.styleCount; v_i++) {
		const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];
		JsonObject v_js = d["windDict"]["styles"][v_i].to<JsonObject>();

		v_js["name"] = v_s.name;
		v_js["code"] = v_s.code;

		JsonObject v_f = v_js["factors"].to<JsonObject>();
		v_f["intensityFactor"]   = v_s.factors.intensityFactor;   // camelCase
		v_f["variabilityFactor"] = v_s.factors.variabilityFactor; // camelCase
		v_f["gustFactor"]        = v_s.factors.gustFactor;        // camelCase
		v_f["thermalFactor"]     = v_s.factors.thermalFactor;     // camelCase
	}

	return ioSaveJson(s_cfgJsonFileMap.windDict, d);
}

// =====================================================
// 3. JSON Export (Schedules/UserProfiles/WindProfileDict)
// =====================================================
void CL_C10_ConfigManager::toJson_Schedules(const ST_A20_SchedulesRoot_t& p_cfg, JsonDocument& d) {
	for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_SCHEDULES; v_i++) {
		const ST_A20_ScheduleItem_t& s = p_cfg.items[v_i];
		JsonObject js = d["schedules"][v_i].to<JsonObject>();

		js["schId"]          = s.schId;
		js["schNo"]          = s.schNo;
		js["name"]           = s.name;
		js["enabled"]        = s.enabled;
		js["repeatSegments"] = s.repeatSegments;
		js["repeatCount"]    = s.repeatCount;

		for (uint8_t v_d = 0; v_d < 7; v_d++) {
			js["period"]["days"][v_d] = s.period.days[v_d];
		}
		js["period"]["startTime"] = s.period.startTime;
		js["period"]["endTime"]   = s.period.endTime;

		for (uint8_t v_k = 0; v_k < s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
			const ST_A20_ScheduleSegment_t& sg = s.segments[v_k];
			JsonObject jseg = js["segments"][v_k].to<JsonObject>();

			jseg["segId"]      = sg.segId;
			jseg["segNo"]      = sg.segNo;
			jseg["onMinutes"]  = sg.onMinutes;
			jseg["offMinutes"] = sg.offMinutes;
			jseg["mode"]       = A20_modeToString(sg.mode);
			jseg["presetCode"] = sg.presetCode;
			jseg["styleCode"]  = sg.styleCode;

			JsonObject adj = jseg["adjust"].to<JsonObject>();
			adj["windIntensity"]            = sg.adjust.windIntensity;
			adj["windVariability"]          = sg.adjust.windVariability;
			adj["gustFrequency"]            = sg.adjust.gustFrequency;
			adj["fanLimit"]                 = sg.adjust.fanLimit;
			adj["minFan"]                   = sg.adjust.minFan;
			adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;     // camelCase
			adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;  // camelCase

			jseg["fixedSpeed"] = sg.fixedSpeed; // camelCase
		}

		JsonObject ao = js["autoOff"].to<JsonObject>();
		ao["timer"]["enabled"]     = s.autoOff.timer.enabled;
		ao["timer"]["minutes"]     = s.autoOff.timer.minutes;
		ao["offTime"]["enabled"]   = s.autoOff.offTime.enabled;
		ao["offTime"]["time"]      = s.autoOff.offTime.time;
		ao["offTemp"]["enabled"]   = s.autoOff.offTemp.enabled;
		ao["offTemp"]["temp"]      = s.autoOff.offTemp.temp;

		js["motion"]["pir"]["enabled"]       = s.motion.pir.enabled;
		js["motion"]["pir"]["holdSec"]       = s.motion.pir.holdSec;
		js["motion"]["ble"]["enabled"]       = s.motion.ble.enabled;
		js["motion"]["ble"]["rssiThreshold"] = s.motion.ble.rssiThreshold; // camelCase
		js["motion"]["ble"]["holdSec"]       = s.motion.ble.holdSec;
	}
}

void CL_C10_ConfigManager::toJson_UserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg, JsonDocument& d) {
	for (uint8_t v_i = 0; v_i < p_cfg.count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
		const ST_A20_UserProfileItem_t& up = p_cfg.items[v_i];
		JsonObject jp = d["userProfiles"]["profiles"][v_i].to<JsonObject>();

		jp["profileId"]      = up.profileId;
		jp["profileNo"]      = up.profileNo;
		jp["name"]           = up.name;
		jp["enabled"]        = up.enabled;
		jp["repeatSegments"] = up.repeatSegments;
		jp["repeatCount"]    = up.repeatCount;

		for (uint8_t v_k = 0; v_k < up.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_PROFILE; v_k++) {
			const ST_A20_UserProfileSegment_t& sg = up.segments[v_k];
			JsonObject jseg = jp["segments"][v_k].to<JsonObject>();

			jseg["segId"]      = sg.segId;
			jseg["segNo"]      = sg.segNo;
			jseg["onMinutes"]  = sg.onMinutes;
			jseg["offMinutes"] = sg.offMinutes;
			jseg["mode"]       = A20_modeToString(sg.mode);
			jseg["presetCode"] = sg.presetCode;
			jseg["styleCode"]  = sg.styleCode;

			JsonObject adj = jseg["adjust"].to<JsonObject>();
			adj["windIntensity"]            = sg.adjust.windIntensity;
			adj["windVariability"]          = sg.adjust.windVariability;
			adj["gustFrequency"]            = sg.adjust.gustFrequency;
			adj["fanLimit"]                 = sg.adjust.fanLimit;
			adj["minFan"]                   = sg.adjust.minFan;
			adj["turbulenceLengthScale"]    = sg.adjust.turbulenceLengthScale;     // camelCase
			adj["turbulenceIntensitySigma"] = sg.adjust.turbulenceIntensitySigma;  // camelCase

			jseg["fixedSpeed"] = sg.fixedSpeed; // camelCase
		}

		JsonObject ao = jp["autoOff"].to<JsonObject>();
		ao["timer"]["enabled"]     = up.autoOff.timer.enabled;
		ao["timer"]["minutes"]     = up.autoOff.timer.minutes;
		ao["offTime"]["enabled"]   = up.autoOff.offTime.enabled;
		ao["offTime"]["time"]      = up.autoOff.offTime.time;
		ao["offTemp"]["enabled"]   = up.autoOff.offTemp.enabled;
		ao["offTemp"]["temp"]      = up.autoOff.offTemp.temp;

		jp["motion"]["pir"]["enabled"]       = up.motion.pir.enabled;
		jp["motion"]["pir"]["holdSec"]       = up.motion.pir.holdSec;
		jp["motion"]["ble"]["enabled"]       = up.motion.ble.enabled;
		jp["motion"]["ble"]["rssiThreshold"] = up.motion.ble.rssiThreshold; // camelCase
		jp["motion"]["ble"]["holdSec"]       = up.motion.ble.holdSec;
	}
}

void CL_C10_ConfigManager::toJson_WindProfileDict(const ST_A20_WindProfileDict_t& p_cfg, JsonDocument& d) {
	for (uint8_t v_i = 0; v_i < p_cfg.presetCount; v_i++) {
		const ST_A20_PresetEntry_t& v_p = p_cfg.presets[v_i];
		JsonObject v_js = d["windDict"]["presets"][v_i].to<JsonObject>();

		v_js["name"] = v_p.name;
		v_js["code"] = v_p.code;

		JsonObject v_b = v_js["base"].to<JsonObject>();
		v_b["windIntensity"]            = v_p.base.windIntensity;
		v_b["gustFrequency"]            = v_p.base.gustFrequency;
		v_b["windVariability"]          = v_p.base.windVariability;
		v_b["fanLimit"]                 = v_p.base.fanLimit;
		v_b["minFan"]                   = v_p.base.minFan;
		v_b["turbulenceLengthScale"]    = v_p.base.turbulenceLengthScale;     // camelCase
		v_b["turbulenceIntensitySigma"] = v_p.base.turbulenceIntensitySigma;  // camelCase
		v_b["thermalBubbleStrength"]    = v_p.base.thermalBubbleStrength;     // camelCase
		v_b["thermalBubbleRadius"]      = v_p.base.thermalBubbleRadius;       // camelCase

		v_b["baseMinWind"]     = v_p.base.baseMinWind;      // camelCase
		v_b["baseMaxWind"]     = v_p.base.baseMaxWind;      // camelCase
		v_b["gustProbBase"]    = v_p.base.gustProbBase;     // camelCase
		v_b["gustStrengthMax"] = v_p.base.gustStrengthMax;  // camelCase
		v_b["thermalFreqBase"] = v_p.base.thermalFreqBase;  // camelCase
	}

	for (uint8_t v_i = 0; v_i < p_cfg.styleCount; v_i++) {
		const ST_A20_StyleEntry_t& v_s = p_cfg.styles[v_i];
		JsonObject v_js = d["windDict"]["styles"][v_i].to<JsonObject>();

		v_js["name"] = v_s.name;
		v_js["code"] = v_s.code;

		JsonObject v_f = v_js["factors"].to<JsonObject>();
		v_f["intensityFactor"]   = v_s.factors.intensityFactor;   // camelCase
		v_f["variabilityFactor"] = v_s.factors.variabilityFactor; // camelCase
		v_f["gustFactor"]        = v_s.factors.gustFactor;        // camelCase
		v_f["thermalFactor"]     = v_s.factors.thermalFactor;     // camelCase
	}
}

// =====================================================
// 4. JSON Patch (Schedules/UserProfiles/WindProfileDict)
//  - windProfile → windDict 통일( fallback 미적용 )
//  - schedules PUT: schId는 자동 재발급(10,20,...) / schNo 중복이면 실패
// =====================================================
bool CL_C10_ConfigManager::patchSchedulesFromJson(ST_A20_SchedulesRoot_t& p_cfg, const JsonDocument& p_patch) {
	C10_MUTEX_ACQUIRE_BOOL();

	JsonArrayConst arr = p_patch["schedules"].as<JsonArrayConst>();
	if (arr.isNull()) {
		C10_MUTEX_RELEASE();
		return false;
	}

	A20_resetSchedulesDefault(p_cfg);
	p_cfg.count = 0;

	uint16_t v_id = (uint16_t)G_C10_SCH_ID_START;

	for (JsonObjectConst js : arr) {
		if (p_cfg.count >= A20_Const::MAX_SCHEDULES) break;

		ST_A20_ScheduleItem_t& s = p_cfg.items[p_cfg.count];
		memset(&s, 0, sizeof(s));

		// schId 자동 발급
		s.schId = v_id;

		// schNo는 입력값 사용(중복 검증은 완료 후)
		C10_fromJson_ScheduleItem(js, s, true);

		p_cfg.count++;
		v_id = (uint16_t)((uint32_t)v_id + (uint32_t)G_C10_SCH_ID_STEP);
	}

	// schNo 중복 체크
	if (C10_isScheduleNoDuplicatedInList(p_cfg)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] Schedules patched: duplicated schNo. Rejected.");
		C10_MUTEX_RELEASE();
		return false;
	}

	_dirty_schedules = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedules patched (PUT). Dirty=true");

	C10_MUTEX_RELEASE();
	return true;
}

bool CL_C10_ConfigManager::patchUserProfilesFromJson(ST_A20_UserProfilesRoot_t& p_cfg, const JsonDocument& p_patch) {
	C10_MUTEX_ACQUIRE_BOOL();

	JsonArrayConst arr = p_patch["userProfiles"]["profiles"].as<JsonArrayConst>();
	if (arr.isNull()) {
		C10_MUTEX_RELEASE();
		return false;
	}

	A20_resetUserProfilesDefault(p_cfg);
	p_cfg.count = 0;

	for (JsonObjectConst jp : arr) {
		if (p_cfg.count >= A20_Const::MAX_USER_PROFILES) break;

		ST_A20_UserProfileItem_t& up = p_cfg.items[p_cfg.count++];
		memset(&up, 0, sizeof(up));
		C10_fromJson_UserProfile(jp, up);
	}

	_dirty_userProfiles = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfiles patched (PUT). Dirty=true");

	C10_MUTEX_RELEASE();
	return true;
}

bool CL_C10_ConfigManager::patchWindProfileDictFromJson(ST_A20_WindProfileDict_t& p_cfg, const JsonDocument& p_patch) {
	C10_MUTEX_ACQUIRE_BOOL();

	// ✅ windDict로 통일( fallback 미적용 )
	JsonObjectConst j = p_patch["windDict"].as<JsonObjectConst>();
	if (j.isNull()) {
		C10_MUTEX_RELEASE();
		return false;
	}

	A20_resetWindProfileDictDefault(p_cfg);

	p_cfg.presetCount = 0;
	if (j["presets"].is<JsonArrayConst>()) {
		JsonArrayConst v_arr = j["presets"].as<JsonArrayConst>();
		for (JsonObjectConst v_js : v_arr) {
			if (p_cfg.presetCount >= 16) break; // TODO: A20_Const 상수로 교체 권장
			ST_A20_PresetEntry_t& v_p = p_cfg.presets[p_cfg.presetCount++];
			memset(&v_p, 0, sizeof(v_p));
			C10_fromJson_WindPreset(v_js, v_p);
		}
	}

	p_cfg.styleCount = 0;
	if (j["styles"].is<JsonArrayConst>()) {
		JsonArrayConst v_arr = j["styles"].as<JsonArrayConst>();
		for (JsonObjectConst v_js : v_arr) {
			if (p_cfg.styleCount >= 16) break; // TODO: A20_Const 상수로 교체 권장

			ST_A20_StyleEntry_t& v_s = p_cfg.styles[p_cfg.styleCount++];
			memset(&v_s, 0, sizeof(v_s));

			strlcpy(v_s.name, v_js["name"] | "", sizeof(v_s.name));
			strlcpy(v_s.code, v_js["code"] | "", sizeof(v_s.code));

			JsonObjectConst v_f          = v_js["factors"].as<JsonObjectConst>();
			v_s.factors.intensityFactor   = v_f["intensityFactor"] | 1.0f;   // camelCase
			v_s.factors.variabilityFactor = v_f["variabilityFactor"] | 1.0f; // camelCase
			v_s.factors.gustFactor        = v_f["gustFactor"] | 1.0f;        // camelCase
			v_s.factors.thermalFactor     = v_f["thermalFactor"] | 1.0f;     // camelCase
		}
	}

	_dirty_windProfile = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindProfileDict patched (PUT). Dirty=true");

	C10_MUTEX_RELEASE();
	return true;
}

// =====================================================
// 5. CRUD - Schedules / UserProfiles / WindProfile
//  (g_A20_config_root를 대상으로 동작)
//  - new 실패 방어(nothrow)
//  - schId 자동발급, schNo 중복 시 오류
// =====================================================

// ---------- Schedule CRUD ----------
int CL_C10_ConfigManager::addScheduleFromJson(const JsonDocument& p_doc) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.schedules) {
		g_A20_config_root.schedules = new (std::nothrow) ST_A20_SchedulesRoot_t();
		if (!g_A20_config_root.schedules) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: new failed (out of memory)");
			C10_MUTEX_RELEASE();
			return -1;
		}
		A20_resetSchedulesDefault(*g_A20_config_root.schedules);
	}

	ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

	if (v_root.count >= A20_Const::MAX_SCHEDULES) {
		C10_MUTEX_RELEASE();
		return -1;
	}

	JsonObjectConst js =
	    p_doc["schedule"].is<JsonObjectConst>() ? p_doc["schedule"].as<JsonObjectConst>() : p_doc.as<JsonObjectConst>();

	// 입력 schNo 확인(중복 불가)
	uint16_t v_schNo = js["schNo"] | 0;
	if (C10_isScheduleNoDuplicated(v_root, v_schNo, 0)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: duplicated schNo=%u", (unsigned)v_schNo);
		C10_MUTEX_RELEASE();
		return -2; // 중복 오류
	}

	ST_A20_ScheduleItem_t& s = v_root.items[v_root.count];
	memset(&s, 0, sizeof(s));

	// schId 자동발급
	s.schId = C10_nextScheduleId(v_root);

	// schNo 포함 나머지 파싱(schId는 유지)
	C10_fromJson_ScheduleItem(js, s, true);

	// 방어: 혹시 schNo가 0으로 들어오면 그대로 허용(정책 외라면 여기서 막을 수 있음)
	// if (s.schNo == 0) ...

	int v_index = v_root.count;
	v_root.count++;

	_dirty_schedules = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule added (index=%d, schId=%u, schNo=%u)",
	                   v_index, (unsigned)s.schId, (unsigned)s.schNo);

	C10_MUTEX_RELEASE();
	return v_index;
}

bool CL_C10_ConfigManager::updateScheduleFromJson(uint16_t p_id, const JsonDocument& p_patch) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.schedules) {
		C10_MUTEX_RELEASE();
		return false;
	}

	ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

	int v_idx = -1;
	for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
		if (v_root.items[v_i].schId == p_id) {
			v_idx = (int)v_i;
			break;
		}
	}
	if (v_idx < 0) {
		C10_MUTEX_RELEASE();
		return false;
	}

	JsonObjectConst js =
	    p_patch["schedule"].is<JsonObjectConst>() ? p_patch["schedule"].as<JsonObjectConst>() : p_patch.as<JsonObjectConst>();

	// schNo 중복 체크(변경될 수 있으므로)
	uint16_t v_newSchNo = js["schNo"] | v_root.items[(uint8_t)v_idx].schNo;
	if (C10_isScheduleNoDuplicated(v_root, v_newSchNo, p_id)) {
		CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] updateSchedule: duplicated schNo=%u (schId=%u)",
		                   (unsigned)v_newSchNo, (unsigned)p_id);
		C10_MUTEX_RELEASE();
		return false;
	}

	// schId 유지
	uint16_t v_keepId = v_root.items[(uint8_t)v_idx].schId;

	// overwrite
	C10_fromJson_ScheduleItem(js, v_root.items[(uint8_t)v_idx], true);
	v_root.items[(uint8_t)v_idx].schId = v_keepId;

	_dirty_schedules = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule updated (schId=%u, index=%d, schNo=%u)",
	                   (unsigned)p_id, v_idx, (unsigned)v_root.items[(uint8_t)v_idx].schNo);

	C10_MUTEX_RELEASE();
	return true;
}

bool CL_C10_ConfigManager::deleteSchedule(uint16_t p_id) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.schedules) {
		C10_MUTEX_RELEASE();
		return false;
	}

	ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;

	int v_idx = -1;
	for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
		if (v_root.items[v_i].schId == p_id) {
			v_idx = (int)v_i;
			break;
		}
	}
	if (v_idx < 0) {
		C10_MUTEX_RELEASE();
		return false;
	}

	for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count; v_i++) {
		v_root.items[v_i - 1] = v_root.items[v_i];
	}
	if (v_root.count > 0) v_root.count--;

	_dirty_schedules = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] Schedule deleted (schId=%u, index=%d)", (unsigned)p_id, v_idx);

	C10_MUTEX_RELEASE();
	return true;
}

// ---------- UserProfiles CRUD ----------
int CL_C10_ConfigManager::addUserProfilesFromJson(const JsonDocument& p_doc) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.userProfiles) {
		g_A20_config_root.userProfiles = new (std::nothrow) ST_A20_UserProfilesRoot_t();
		if (!g_A20_config_root.userProfiles) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addUserProfile: new failed (out of memory)");
			C10_MUTEX_RELEASE();
			return -1;
		}
		A20_resetUserProfilesDefault(*g_A20_config_root.userProfiles);
	}

	ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

	if (v_root.count >= A20_Const::MAX_USER_PROFILES) {
		C10_MUTEX_RELEASE();
		return -1;
	}

	JsonObjectConst jp =
	    p_doc["profile"].is<JsonObjectConst>() ? p_doc["profile"].as<JsonObjectConst>() : p_doc.as<JsonObjectConst>();

	ST_A20_UserProfileItem_t& up = v_root.items[v_root.count];
	memset(&up, 0, sizeof(up));
	C10_fromJson_UserProfile(jp, up);

	int v_index = v_root.count;
	v_root.count++;

	_dirty_userProfiles = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile added (index=%d)", v_index);

	C10_MUTEX_RELEASE();
	return v_index;
}

bool CL_C10_ConfigManager::updateUserProfilesFromJson(uint16_t p_id, const JsonDocument& p_patch) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.userProfiles) {
		C10_MUTEX_RELEASE();
		return false;
	}

	ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

	int v_idx = -1;
	for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
		if (v_root.items[v_i].profileId == p_id) {
			v_idx = (int)v_i;
			break;
		}
	}
	if (v_idx < 0) {
		C10_MUTEX_RELEASE();
		return false;
	}

	JsonObjectConst jp =
	    p_patch["profile"].is<JsonObjectConst>() ? p_patch["profile"].as<JsonObjectConst>() : p_patch.as<JsonObjectConst>();

	C10_fromJson_UserProfile(jp, v_root.items[(uint8_t)v_idx]);

	_dirty_userProfiles = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile updated (id=%u, index=%d)", (unsigned)p_id, v_idx);

	C10_MUTEX_RELEASE();
	return true;
}

bool CL_C10_ConfigManager::deleteUserProfiles(uint16_t p_id) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.userProfiles) {
		C10_MUTEX_RELEASE();
		return false;
	}

	ST_A20_UserProfilesRoot_t& v_root = *g_A20_config_root.userProfiles;

	int v_idx = -1;
	for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
		if (v_root.items[v_i].profileId == p_id) {
			v_idx = (int)v_i;
			break;
		}
	}
	if (v_idx < 0) {
		C10_MUTEX_RELEASE();
		return false;
	}

	for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count; v_i++) {
		v_root.items[v_i - 1] = v_root.items[v_i];
	}
	if (v_root.count > 0) v_root.count--;

	_dirty_userProfiles = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] UserProfile deleted (id=%u, index=%d)", (unsigned)p_id, v_idx);

	C10_MUTEX_RELEASE();
	return true;
}

// ---------- WindProfile CRUD (Preset 중심) ----------
int CL_C10_ConfigManager::addWindProfileFromJson(const JsonDocument& p_doc) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.windDict) {
		g_A20_config_root.windDict = new (std::nothrow) ST_A20_WindProfileDict_t();
		if (!g_A20_config_root.windDict) {
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addWindPreset: new failed (out of memory)");
			C10_MUTEX_RELEASE();
			return -1;
		}
		A20_resetWindProfileDictDefault(*g_A20_config_root.windDict);
	}

	ST_A20_WindProfileDict_t& v_root = *g_A20_config_root.windDict;

	if (v_root.presetCount >= 16) { // TODO: A20_Const 상수로 교체 권장
		C10_MUTEX_RELEASE();
		return -1;
	}

	JsonObjectConst v_js =
	    p_doc["preset"].is<JsonObjectConst>() ? p_doc["preset"].as<JsonObjectConst>() : p_doc.as<JsonObjectConst>();

	ST_A20_PresetEntry_t& v_p = v_root.presets[v_root.presetCount];
	memset(&v_p, 0, sizeof(v_p));
	C10_fromJson_WindPreset(v_js, v_p);

	int v_index = v_root.presetCount;
	v_root.presetCount++;

	_dirty_windProfile = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset added (index=%d)", v_index);

	C10_MUTEX_RELEASE();
	return v_index;
}

bool CL_C10_ConfigManager::updateWindProfileFromJson(uint16_t p_id, const JsonDocument& p_patch) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.windDict) {
		C10_MUTEX_RELEASE();
		return false;
	}

	ST_A20_WindProfileDict_t& v_root = *g_A20_config_root.windDict;

	if (p_id >= v_root.presetCount) {
		C10_MUTEX_RELEASE();
		return false;
	}

	JsonObjectConst v_js =
	    p_patch["preset"].is<JsonObjectConst>() ? p_patch["preset"].as<JsonObjectConst>() : p_patch.as<JsonObjectConst>();

	C10_fromJson_WindPreset(v_js, v_root.presets[p_id]);

	_dirty_windProfile = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset updated (index=%u)", (unsigned)p_id);

	C10_MUTEX_RELEASE();
	return true;
}

bool CL_C10_ConfigManager::deleteWindProfile(uint16_t p_id) {
	C10_MUTEX_ACQUIRE_BOOL();

	if (!g_A20_config_root.windDict) {
		C10_MUTEX_RELEASE();
		return false;
	}

	ST_A20_WindProfileDict_t& v_root = *g_A20_config_root.windDict;

	if (p_id >= v_root.presetCount) {
		C10_MUTEX_RELEASE();
		return false;
	}

	for (uint8_t v_i = (uint8_t)p_id + 1; v_i < v_root.presetCount; v_i++) {
		v_root.presets[v_i - 1] = v_root.presets[v_i];
	}
	if (v_root.presetCount > 0) v_root.presetCount--;

	_dirty_windProfile = true;
	CL_D10_Logger::log(EN_L10_LOG_INFO, "[C10] WindPreset deleted (index=%u)", (unsigned)p_id);

	C10_MUTEX_RELEASE();
	return true;
}

