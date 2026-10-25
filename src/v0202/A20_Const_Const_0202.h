// 소스명 : A20_Const_Const_0202.h

#pragma once
#include <Arduino.h>

namespace A20_Const {

	// ======================================================
	// [B-1] 펌웨어 버전 (SSOT)
	//  - FW_VERSION        : 표시용 (Prefix 유지)
	//  - FW_VERSION_SEMVER : 비교용 (SemVer x.y.z, routeFirmwareCheck)
	//  - D-2 정책: 파일 접미사 _0201 ↔ SemVer 2.0.0 동기
	// ======================================================
	constexpr char FW_VERSION[]    				= "FW_Ver_2.0.2";	// 표시용
	constexpr char FW_VERSION_SEMVER[] 			= "2.0.2";			// 비교용
	constexpr char CFG_JSON_FILE[] 				= "/json/10_cfg_jsonFile.json";

	// ======================================================
	// [B-1] 모듈별 버전 (Web API 응답용) - SSOT: 파일명 접미사 _0201과 동기
	// ======================================================
	constexpr char VER_CONTROL[] 				= "CT10_Ctl_0202";
	constexpr char VER_CONFIG[]  				= "C10_Config_0202";
	constexpr char VER_API[]     				= "W10_Web_0202";
	constexpr char VER_SIMUL[]   				= "S10_Simul_0202";

	// ======================================================
	// [B-1] 기본 프리셋/스타일 (WindDict 초기화 및 Segment 기본값)
	//  - 하드코딩 문자열("OCEAN" 등) 대체
	// ======================================================
	constexpr char DEFAULT_PRESET_CODE[] 		= "OCEAN";
	constexpr char DEFAULT_PRESET_NAME[] 		= "Ocean Breeze";
	constexpr char DEFAULT_STYLE_CODE[]  		= "BALANCE";
	constexpr char DEFAULT_STYLE_NAME[]  		= "Balance";

	// ======================================================
	// [P3] JSON 파일 version 필드 (SSOT)
	//  - 파일 접미사 _0200과 동기
	//  - saveSchedules 등 save 함수가 10_cfg_jsonFile.json 매핑과 함께 참조
	//  - reset default(A20_resetXxxDefault)는 이 상수를 사용하지 않음
	//    (메모리 초기화만 수행, 파일 저장은 saveXxx 함수 담당)
	// ======================================================
	constexpr char G_JSON_VERSION[] 			= "0202";

	// ======================================================
	// [C-4] A00 메인 루프 상수
	// ======================================================
	constexpr uint32_t G_A00_WDT_TIMEOUT_SEC	= 10;	// [sec] Task WDT 타임아웃
	constexpr uint32_t G_A00_LOOP_DELAY_MS		= 10;	// [ms]  A00_run 주기 지연

	// ======================================================
	// [C-4] 시간 sanity 상수 (TM10/S10/WF10 공용)
	//  - 2023-11-15 = 1700000000 (SNTP sync 유효 기준)
	// ======================================================
	constexpr uint32_t G_TIME_EPOCH_SANE_MIN	= 1700000000UL;	// [epoch sec]
	constexpr int	   G_TIME_YEAR_MIN			= 2023;
	constexpr int	   G_TIME_YEAR_MAX			= 2099;

	// ======================================================
	// [E-3] 부트 시퀀스 지연 상수 (main.cpp)
	// ======================================================
	constexpr uint32_t G_A00_SERIAL_INIT_DELAY_MS	= 1500;	// [ms] Serial.begin 후 대기
	constexpr uint32_t G_A00_USB_CDC_POLL_MS		= 100;	// [ms] USB CDC 연결 폴링
	constexpr uint32_t G_A00_USB_CDC_TIMEOUT_MS	= 3000;	// [C-1] CDC 동기화 타임아웃 (미연결 시 부팅 계속)

	// 문자열 및 배열 길이 정의
	constexpr uint8_t LEN_NAME   				= 64;
	constexpr uint8_t LEN_PATH   				= 160;
	constexpr uint8_t LEN_SSID   				= 32;
	constexpr uint8_t LEN_PASS   				= 32;
	constexpr uint8_t LEN_PRESET 				= 32;
	constexpr uint8_t LEN_ALIAS  				= 32;
	constexpr uint8_t LEN_TIME   				= 8;
	constexpr uint8_t LEN_LEVEL  				= 16;

	// 배열 개수
	// [E-3] MAX_BLE_DEVICES 제거 (BLE 코드 부재)
	constexpr uint8_t MAX_STA_NETWORKS 			= 5;

	// [E-3] WIND_PRESETS_MAX / WIND_STYLES_MAX 주석 제거 (실사용 없음)
	//  - 실사용: EN_A20_WINDPRESET_COUNT / EN_A20_WINDSTYLE_COUNT (enum 자동 카운트)

	// 배열 개수 제한
	constexpr uint8_t MAX_SCHEDULES             = 8;
	constexpr uint8_t MAX_SEGMENTS_PER_SCHEDULE = 8;
	constexpr uint8_t MAX_USER_PROFILES         = 6;
	constexpr uint8_t MAX_SEGMENTS_PER_PROFILE  = 8;

	// 문자열 길이 제한
	constexpr size_t MAX_NAME_LEN 				= 32;
	constexpr size_t MAX_CODE_LEN 				= 24;

	// NVS Spec 상수(배열 제한)
	constexpr uint8_t MAX_NVS_ENTRIES     		= 32;
	constexpr uint8_t LEN_NVS_KEY         		= 32;
	constexpr uint8_t LEN_NVS_TYPE        		= 16;
	constexpr uint8_t LEN_NVS_DEFAULT_STR 		= 64;
	constexpr uint8_t LEN_NVS_NAMESPACE   		= 16;

	// WebPage 상수(배열 제한)
	constexpr uint8_t MAX_PAGES         		= 24;
	constexpr uint8_t MAX_PAGE_ASSETS   		= 8;
	constexpr uint8_t MAX_REDIRECTS     		= 32;
	constexpr uint8_t MAX_COMMON_ASSETS 		= 16;

	constexpr uint8_t LEN_URI   				= 96;
	constexpr uint8_t LEN_LABEL 				= 32;

} // namespace A20_Const
