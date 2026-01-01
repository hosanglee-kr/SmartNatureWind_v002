 // 소스명 : A20_Const_Const_044.h

#pragma once
#include <Arduino.h>

namespace A20_Const {

	// 펌웨어/파일버전
	constexpr char FW_VERSION[]    = "FW_Ver_1.0.0";
	constexpr char CFG_JSON_FILE[] = "/json/10_cfg_jsonFile.json";

	// 모듈별 버전 (Web API 응답용)
	constexpr char VER_CONTROL[] = "CT10_ControlManager_026";
	constexpr char VER_CONFIG[]  = "C10_ConfigManager_041";
	constexpr char VER_API[]     = "W10_WebAPI_050";
	constexpr char VER_SIMUL[]   = "S10_Simul_040";

	// 문자열 및 배열 길이 정의
	constexpr uint8_t LEN_NAME   = 64;
	constexpr uint8_t LEN_PATH   = 160;
	constexpr uint8_t LEN_SSID   = 32;
	constexpr uint8_t LEN_PASS   = 32;
	constexpr uint8_t LEN_PRESET = 32;
	constexpr uint8_t LEN_ALIAS  = 32;
	constexpr uint8_t LEN_TIME   = 8;
	constexpr uint8_t LEN_LEVEL  = 16;

	// 배열 개수
	constexpr uint8_t MAX_BLE_DEVICES  = 8;
	constexpr uint8_t MAX_STA_NETWORKS = 5;

	constexpr uint8_t WIND_PRESETS_MAX = 16;
	constexpr uint8_t WIND_STYLES_MAX  = 16;

	// 배열 개수 제한
	constexpr uint8_t MAX_SCHEDULES             = 8;
	constexpr uint8_t MAX_SEGMENTS_PER_SCHEDULE = 8;
	constexpr uint8_t MAX_USER_PROFILES         = 6; // 최신 스펙: 6개
	constexpr uint8_t MAX_SEGMENTS_PER_PROFILE  = 8;

	// 문자열 길이 제한
	constexpr size_t MAX_NAME_LEN = 32;
	constexpr size_t MAX_CODE_LEN = 24;

	// NVS Spec 상수(배열 제한)
	constexpr uint8_t MAX_NVS_ENTRIES     = 32;
	constexpr uint8_t LEN_NVS_KEY         = 32;
	constexpr uint8_t LEN_NVS_TYPE        = 16;
	constexpr uint8_t LEN_NVS_DEFAULT_STR = 64;
	constexpr uint8_t LEN_NVS_NAMESPACE   = 16;

	// WebPage 상수(배열 제한)
	constexpr uint8_t MAX_PAGES         = 24;
	constexpr uint8_t MAX_PAGE_ASSETS   = 8;
	constexpr uint8_t MAX_REDIRECTS     = 32;
	constexpr uint8_t MAX_COMMON_ASSETS = 16;

	constexpr uint8_t LEN_URI   = 96;
	constexpr uint8_t LEN_LABEL = 32;

} // namespace A20_Const
