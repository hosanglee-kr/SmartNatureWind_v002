/*
 * ------------------------------------------------------
 * 소스명 : TM10_TimeManager_001.cpp
 * 모듈 약어 : TM10
 * 모듈명 : Smart Nature Wind Time Manager (SNTP callback 기반, 운영급)
 * ------------------------------------------------------
 * 구현 파일 요약:
 *  - SNTP 서버/주기 설정 및 콜백 등록
 *  - 콜백에서 동기화 성공 판정(긴 폴링 없음)
 *  - fallback 서버 순환 + 백오프 재시도
 *  - time()/localtime_r NULL 방어 포함한 유효성 체크
 * ------------------------------------------------------
 */

#include "TM10_TimeManager_001.h"

// -----------------------------
// Static members
// -----------------------------
volatile bool	 CL_TM10_TimeManager::s_timeSynced		  = false;
volatile uint32_t CL_TM10_TimeManager::s_lastSyncMs	  = 0;

bool			 CL_TM10_TimeManager::s_wifiConnected	  = false;
uint32_t		 CL_TM10_TimeManager::s_wifiUpMs			  = 0;

char			 CL_TM10_TimeManager::s_servers[G_TM10_SNTPSERVERS_MAX][64];
uint8_t			 CL_TM10_TimeManager::s_serverCount		  = 0;
uint8_t			 CL_TM10_TimeManager::s_activeServerIdx	  = 0;

uint32_t		 CL_TM10_TimeManager::s_nextRetryMs		  = G_TM10_RETRY_FIRST_MS;
uint32_t		 CL_TM10_TimeManager::s_lastRetryAttemptMs = 0;

// -----------------------------
// Public
// -----------------------------
bool CL_TM10_TimeManager::isTimeSynced() {
	return (bool)s_timeSynced;
}

uint32_t CL_TM10_TimeManager::getLastSyncMs() {
	return (uint32_t)s_lastSyncMs;
}

const char* CL_TM10_TimeManager::getActiveServer() {
	if (s_serverCount == 0) return "";
	if (s_activeServerIdx >= s_serverCount) return s_servers[0];
	return s_servers[s_activeServerIdx];
}

void CL_TM10_TimeManager::onWiFiConnected(const ST_A20_SystemConfig_t& p_cfg_system) {
	s_wifiConnected = true;
	s_wifiUpMs	  = millis();

	// 동기화 상태는 “유효성 검사”로 재확정
	s_timeSynced = _isTimeSane();
	if (s_timeSynced) {
		s_lastSyncMs = millis();
		CL_D10_Logger::log(EN_L10_LOG_INFO, "[TM10] WiFiConnected: time already sane. lastSyncMs=%lu", (unsigned long)s_lastSyncMs);
	} else {
		CL_D10_Logger::log(EN_L10_LOG_INFO, "[TM10] WiFiConnected: time not synced yet. Will rely on SNTP callback.");
	}

	// 재시도 정책 초기화
	s_nextRetryMs		   = G_TM10_RETRY_FIRST_MS;
	s_lastRetryAttemptMs   = 0;
	s_activeServerIdx	   = 0;

	applyTimeConfigFromSystem(p_cfg_system);
}

void CL_TM10_TimeManager::onWiFiDisconnected() {
	s_wifiConnected = false;
	s_timeSynced	= false;	// 운영 관점: Wi-Fi 끊김 후 “보장 상태” 해제
	CL_D10_Logger::log(EN_L10_LOG_WARN, "[TM10] WiFiDisconnected: mark timeSynced=false (will resync on reconnect)");
}

void CL_TM10_TimeManager::tick(bool p_wifiConnected, const ST_A20_SystemConfig_t* p_cfg_system) {
	// Wi-Fi 상태 외부 값과 내부 값이 다르면 내부 갱신
	if (p_wifiConnected != s_wifiConnected) {
		s_wifiConnected = p_wifiConnected;
		if (s_wifiConnected) {
			s_wifiUpMs = millis();
		}
	}

	if (!s_wifiConnected) return;
	if (p_cfg_system == nullptr) return;

	// 콜백이 오지 않거나, 시간이 계속 invalid 인 상황 감시
	if (!s_timeSynced) {
		uint32_t v_now = millis();

		// 최초 연결 후 10분 이상 미동기화 → fallback 포함 재시도
		if ((v_now - s_wifiUpMs) >= G_TM10_RETRY_FIRST_MS) {
			// 백오프 체크
			if (s_lastRetryAttemptMs == 0 || (v_now - s_lastRetryAttemptMs) >= s_nextRetryMs) {
				s_lastRetryAttemptMs = v_now;

				// fallback 서버 순환
				if (s_serverCount > 0) {
					s_activeServerIdx++;
					if (s_activeServerIdx >= s_serverCount) s_activeServerIdx = 0;
				}

				CL_D10_Logger::log(EN_L10_LOG_WARN,
					"[TM10] Time not synced for long. Retry with server idx=%u (%s), backoff=%lu ms",
					(unsigned int)s_activeServerIdx,
					getActiveServer(),
					(unsigned long)s_nextRetryMs);

				applyTimeConfigFromSystem(*p_cfg_system);

				// 백오프 증가(최대 제한)
				uint32_t v_next = s_nextRetryMs * 2UL;
				s_nextRetryMs = (v_next > G_TM10_RETRY_MAX_MS) ? G_TM10_RETRY_MAX_MS : v_next;
			}
		}
	} else {
		// synced 상태에서도 드물게 time이 깨질 수 있으니, 아주 가볍게 재확인(운영 안전)
		if (!_isTimeSane()) {
			s_timeSynced = false;
			CL_D10_Logger::log(EN_L10_LOG_WARN, "[TM10] Time sanity lost. Mark timeSynced=false and wait for resync.");
		}
	}
}

void CL_TM10_TimeManager::applyTimeConfigFromSystem(const ST_A20_SystemConfig_t& p_cfg_system) {
	// TZ 적용(콜백 기반이라도 TZ는 즉시 반영되어야 함)
	if (p_cfg_system.time.timezone[0] != '\0') {
		setenv("TZ", p_cfg_system.time.timezone, 1);
		tzset();
	} else {
		// 빈 값이면 운영 기본(Asia/Seoul)
		setenv("TZ", "Asia/Seoul", 1);
		tzset();
	}

	// 서버 목록 구성(1차: config / 2,3차: 고정 fallback)
	_buildServerList(p_cfg_system);

	// syncIntervalMin (0이면 6시간)
	uint32_t v_interval_ms = (uint32_t)p_cfg_system.time.syncIntervalMin * 60000UL;
	if (v_interval_ms == 0) v_interval_ms = 21600000UL;

	// SNTP 적용(콜백 기반, 폴링 없음)
	_applySntpConfig(v_interval_ms);

	CL_D10_Logger::log(EN_L10_LOG_INFO,
		"[TM10] applyTimeConfig: tz=%s, intervalMin=%u, servers=%u, active=%u(%s)",
		p_cfg_system.time.timezone,
		(unsigned int)p_cfg_system.time.syncIntervalMin,
		(unsigned int)s_serverCount,
		(unsigned int)s_activeServerIdx,
		getActiveServer());
}

// -----------------------------
// Private: SNTP 콜백
// -----------------------------
void CL_TM10_TimeManager::_onSntpTimeSync(struct timeval*) {
	// 콜백에서 “유효성” 판단(블로킹 금지)
	bool v_ok = _isTimeSane();
	if (v_ok) {
		s_timeSynced = true;
		s_lastSyncMs = millis();
		CL_D10_Logger::log(EN_L10_LOG_INFO, "[TM10] SNTP sync callback OK (server=%s)", getActiveServer());
	} else {
		// 콜백이 와도 값이 이상하면 false 유지
		s_timeSynced = false;
		CL_D10_Logger::log(EN_L10_LOG_WARN, "[TM10] SNTP sync callback but time not sane yet (server=%s)", getActiveServer());
	}
}

// -----------------------------
// Private: helpers
// -----------------------------
bool CL_TM10_TimeManager::_isTimeSane() {
	time_t v_now = time(nullptr);
	if (v_now < (time_t)G_TM10_TIME_VALID_EPOCH_MIN) return false;

	struct tm v_tm;
	memset(&v_tm, 0, sizeof(v_tm));

	// ✅ localtime_r NULL 방어(요구사항 반영)
	if (localtime_r(&v_now, &v_tm) == nullptr) return false;

	// 연도 sanity(운영용)
	int v_year = v_tm.tm_year + 1900;
	if (v_year < 2023 || v_year > 2099) return false;

	return true;
}

bool CL_TM10_TimeManager::_sameStr(const char* p_a, const char* p_b) {
	if (!p_a || !p_b) return false;
	return (strcmp(p_a, p_b) == 0);
}

void CL_TM10_TimeManager::_buildServerList(const ST_A20_SystemConfig_t& p_cfg_system) {
	// 초기화
	memset(s_servers, 0, sizeof(s_servers));
	s_serverCount = 0;

	// 1) 1차: config의 ntpServer
	const char* v_primary = p_cfg_system.time.ntpServer;
	if (v_primary && v_primary[0]) {
		strlcpy(s_servers[s_serverCount++], v_primary, sizeof(s_servers[0]));
	}

	// 2) 2차/3차: 고정 fallback (요구사항)
	//    - pool.ntp.org 를 primary로 쓰는 경우도 흔하므로, google/cloudflare로 보강
	const char* v_f2 = "time.google.com";
	const char* v_f3 = "time.cloudflare.com";

	// 중복 방지
	if (s_serverCount < G_TM10_SNTPSERVERS_MAX) {
		bool v_dup = false;
		for (uint8_t i = 0; i < s_serverCount; i++) {
			if (_sameStr(s_servers[i], v_f2)) { v_dup = true; break; }
		}
		if (!v_dup) strlcpy(s_servers[s_serverCount++], v_f2, sizeof(s_servers[0]));
	}

	if (s_serverCount < G_TM10_SNTPSERVERS_MAX) {
		bool v_dup = false;
		for (uint8_t i = 0; i < s_serverCount; i++) {
			if (_sameStr(s_servers[i], v_f3)) { v_dup = true; break; }
		}
		if (!v_dup) strlcpy(s_servers[s_serverCount++], v_f3, sizeof(s_servers[0]));
	}

	// 3) 아무것도 없으면 pool.ntp.org 기본
	if (s_serverCount == 0) {
		strlcpy(s_servers[s_serverCount++], "pool.ntp.org", sizeof(s_servers[0]));
	}

	// active idx 범위 보정
	if (s_activeServerIdx >= s_serverCount) s_activeServerIdx = 0;
}

void CL_TM10_TimeManager::_applySntpConfig(uint32_t p_syncIntervalMs) {
	// SNTP 재설정(운영 안정)
	sntp_stop();

	sntp_setoperatingmode(SNTP_OPMODE_POLL);

	// 서버 설정(최대 3개). active는 0번으로 두고, 실패 시 우리가 “server list를 재구성 + 재init” 형태로 회전
	// 즉, 여기서는 s_activeServerIdx를 0번 서버로 “매핑”하기 위해
	// (active idx 서버를 0번에 두고 나머지를 순서대로 채움)
	char v_tmp[G_TM10_SNTPSERVERS_MAX][64];
	memset(v_tmp, 0, sizeof(v_tmp));

	// 0: active
	strlcpy(v_tmp[0], getActiveServer(), sizeof(v_tmp[0]));

	// 나머지: active 제외하고 순서대로
	uint8_t v_w = 1;
	for (uint8_t i = 0; i < s_serverCount && v_w < G_TM10_SNTPSERVERS_MAX; i++) {
		if (i == s_activeServerIdx) continue;
		if (s_servers[i][0] == '\0') continue;
		strlcpy(v_tmp[v_w++], s_servers[i], sizeof(v_tmp[0]));
	}

	// set servername
	for (uint8_t i = 0; i < G_TM10_SNTPSERVERS_MAX; i++) {
		if (v_tmp[i][0] == '\0') break;
		sntp_setservername(i, v_tmp[i]);
	}

	// 주기 설정(ESP-IDF)
	sntp_set_sync_interval(p_syncIntervalMs);

	// 콜백 등록(요구사항: 콜백만 사용, 긴 폴링 없음)
	sntp_set_time_sync_notification_cb(_onSntpTimeSync);

	// 즉시 init
	sntp_init();
}
