#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : TM10_TimeManager_001.h
 * 모듈 약어 : TM10
 * 모듈명 : Smart Nature Wind Time Manager (SNTP callback 기반, 운영급)
 * ------------------------------------------------------
 * 기능 요약:
 *  - Wi-Fi 연결 이벤트 기반으로 SNTP 시간 동기화 설정/관리
 *  - 콜백 기반 동기화 완료 처리(긴 블로킹 폴링 없음)
 *  - NTP 서버 fallback(1차/2차/3차) 자동 순환 및 백오프 재시도
 *  - 시간 유효성 검증(time()/localtime_r NULL 방어 포함)
 *  - 런타임 tick() 감시로 “장시간 미동기화” 상황 자동 복구
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
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include <esp_sntp.h>

#include "A20_Const_043.h"
#include "D10_Logger_040.h"

// ------------------------------------------------------
// 운영 파라미터 (상수)
// ------------------------------------------------------
#ifndef G_TM10_TIME_VALID_EPOCH_MIN
// 2023-11-15 이후(운영 기준 최소 epoch)
#	define G_TM10_TIME_VALID_EPOCH_MIN 1700000000
#endif

#ifndef G_TM10_RETRY_FIRST_MS
// 최초 미동기화 재시도 시작: 10분
#	define G_TM10_RETRY_FIRST_MS (10UL * 60UL * 1000UL)
#endif

#ifndef G_TM10_RETRY_MAX_MS
// 재시도 백오프 최대: 60분
#	define G_TM10_RETRY_MAX_MS (60UL * 60UL * 1000UL)
#endif

#ifndef G_TM10_SNTPSERVERS_MAX
// SNTP 서버 최대(ESP-IDF 기본은 3이 일반적)
#	define G_TM10_SNTPSERVERS_MAX 3
#endif

// ------------------------------------------------------
// Time Manager
// ------------------------------------------------------
class CL_TM10_TimeManager {
  public:
	// 상태 조회
	static bool isTimeSynced();
	static uint32_t getLastSyncMs();
	static const char* getActiveServer();

	// Wi-Fi 이벤트 연동
	static void onWiFiConnected(const ST_A20_SystemConfig_t& p_cfg_system);
	static void onWiFiDisconnected();

	// 런타임 감시(메인 루프에서 가볍게 호출)
	static void tick(bool p_wifiConnected, const ST_A20_SystemConfig_t* p_cfg_system);

	// (외부에서 시간 설정 변경 즉시 반영 요청 시)
	static void applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_cfg_system);

  private:
	// SNTP 콜백
	static void _onSntpTimeSync(struct timeval* p_tv);

	// 내부 헬퍼
	static bool _isTimeSane();
	static void _buildServerList(const ST_A20_SystemConfig_t& p_cfg_system);
	static void _applySntpConfig(uint32_t p_syncIntervalMs);

	static bool _sameStr(const char* p_a, const char* p_b);

  private:
	// 상태
	static volatile bool	  s_timeSynced;
	static volatile uint32_t s_lastSyncMs;

	static bool			  s_wifiConnected;
	static uint32_t		  s_wifiUpMs;

	// 서버 목록/인덱스
	static char			  s_servers[G_TM10_SNTPSERVERS_MAX][64];
	static uint8_t		  s_serverCount;
	static uint8_t		  s_activeServerIdx;

	// 재시도 정책
	static uint32_t		  s_nextRetryMs;	  // 다음 재시도까지 대기(백오프)
	static uint32_t		  s_lastRetryAttemptMs;
};

