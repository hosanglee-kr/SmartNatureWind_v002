/*
 * ------------------------------------------------------
 * 소스명 : CT10_Control_WS_044.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (v026, WS Scheduler)
 * ------------------------------------------------------
 * 기능 요약:
 * - Dirty 기반 WS 브로드캐스트 스케줄러 (state/metrics/chart/summary)
 * - 전송 스로틀 + pending 플래그 (필수/즉효)
 * - priority 정책 기반 우선순위 전송
 * - payload 크기 측정(measureJson) → chart 대형이면 자동 강스로틀
 * - W10 cleanupClients 주기 호출(권장)
 * - W10 setWsIntervals(setter)로 CT10 policy.itv 반영(통합)
 * - (v044) A20_Const_WS_040 구조(wsChConfig/wsEtcConfig) 연동 반영
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

#include "CT10_Control_041.h"
#include "A20_Const_WS_040.h"

// --------------------------------------------------
// S10 → CT10 Dirty 브리지
// --------------------------------------------------
void CT10_markDirtyFromSim(const char* p_key) {
	if (!p_key || !p_key[0]) return;
	CL_CT10_ControlManager::instance().markDirty(p_key);
}

// --------------------------------------------------
// Broker 함수 포인터 (CT10_WS_setBrokers에서 주입)
// --------------------------------------------------
static void (*s_bcast_state)(JsonDocument&, bool)   = nullptr;
static void (*s_bcast_metrics)(JsonDocument&, bool) = nullptr;
static void (*s_bcast_chart)(JsonDocument&, bool)   = nullptr;
static void (*s_bcast_summary)(JsonDocument&, bool) = nullptr;
static void (*s_ws_cleanup)()                       = nullptr;
static void (*s_setIntervals)(const uint16_t p_itvMs[EN_A20_WS_CH_COUNT]) = nullptr;

// --------------------------------------------------
// 내부 상태
// --------------------------------------------------
static uint32_t s_lastSendMs[EN_A20_WS_CH_COUNT] = {0, 0, 0, 0};
static bool     s_pending[EN_A20_WS_CH_COUNT]    = {false, false, false, false};

static uint32_t s_lastCleanupMs     = 0;
static uint32_t s_lastPolicyApplyMs = 0; // 런타임 정책 재적용 가드

// 기본 인터벌(ms) (fallback) - 실제는 system.webSocket 정책으로 덮어씀
static uint16_t s_itvMs[EN_A20_WS_CH_COUNT] = {
	G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_STATE].chDefaultIntervalMs,
	G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_METRICS].chDefaultIntervalMs,
	G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_CHART].chDefaultIntervalMs,
	G_A20_WS_CH_Base_Arr[EN_A20_WS_CH_SUMMARY].chDefaultIntervalMs
};

// priority order (0~3 채널 인덱스)
static uint8_t s_prio[EN_A20_WS_CH_COUNT] = {
	(uint8_t)EN_A20_WS_CH_STATE,
	(uint8_t)EN_A20_WS_CH_METRICS,
	(uint8_t)EN_A20_WS_CH_CHART,
	(uint8_t)EN_A20_WS_CH_SUMMARY
};

// chart payload 기반 강스로틀 정책
static uint16_t s_chartLargeBytes  = G_A20_WS_ETC_DEFAULT_CONFIG.chartLargeBytes;
static uint8_t  s_chartThrottleMul = G_A20_WS_ETC_DEFAULT_CONFIG.chartThrottleMul;
static uint32_t s_chartLastPayload = 0;

// cleanupClients 호출 주기
static uint16_t s_cleanupMs = G_A20_WS_ETC_DEFAULT_CONFIG.wsCleanupMs;

// intervals 변경 감지(중복 setWsIntervals 방지)
static uint16_t s_lastAppliedItv[EN_A20_WS_CH_COUNT] = {0, 0, 0, 0};

static bool CT10_WS_intervalsChanged() {
	for (uint8_t i = 0; i < (uint8_t)EN_A20_WS_CH_COUNT; i++) {
		if (s_lastAppliedItv[i] != s_itvMs[i]) return true;
	}
	return false;
}

// --------------------------------------------------
// 브로커 주입 API
// --------------------------------------------------
void CT10_WS_setBrokers(
	void (*p_state)(JsonDocument&, bool),
	void (*p_metrics)(JsonDocument&, bool),
	void (*p_chart)(JsonDocument&, bool),
	void (*p_summary)(JsonDocument&, bool),
	void (*p_cleanup)(),
	void (*p_setIntervalsFn)(const uint16_t p_itvMs[EN_A20_WS_CH_COUNT])
) {
	s_bcast_state   = p_state;
	s_bcast_metrics = p_metrics;
	s_bcast_chart   = p_chart;
	s_bcast_summary = p_summary;
	s_ws_cleanup    = p_cleanup;
	s_setIntervals  = p_setIntervalsFn;
}

// --------------------------------------------------
// priority 정규화: 중복 제거 + 누락 채움(운영급 방어)
// --------------------------------------------------
static void CT10_WS_normalizePriority(
	const uint8_t p_in[EN_A20_WS_CH_COUNT],
	uint8_t       p_out[EN_A20_WS_CH_COUNT]
) {
	bool    v_used[EN_A20_WS_CH_COUNT] = {false, false, false, false};
	uint8_t v_w                        = 0;

	// 1) 유효 + 미사용만 순서 유지
	for (uint8_t i = 0; i < (uint8_t)EN_A20_WS_CH_COUNT && v_w < (uint8_t)EN_A20_WS_CH_COUNT; i++) {
		uint8_t ch = p_in[i];
		if (ch >= (uint8_t)EN_A20_WS_CH_COUNT) continue;
		if (v_used[ch]) continue;
		p_out[v_w++] = ch;
		v_used[ch]   = true;
	}

	// 2) 누락 채우기
	for (uint8_t ch = 0; ch < (uint8_t)EN_A20_WS_CH_COUNT && v_w < (uint8_t)EN_A20_WS_CH_COUNT; ch++) {
		if (!v_used[ch]) {
			p_out[v_w++] = ch;
			v_used[ch]   = true;
		}
	}
}

// --------------------------------------------------
// (v044) policy 로드: system.webSocket(wsChConfig/wsEtcConfig) → s_itvMs / s_prio / chart / cleanup
// --------------------------------------------------
static void CT10_WS_applyPolicyFromSystem() {
	if (!g_A20_config_root.system) return;

	const ST_A20_SystemConfig_t&    v_sys = *g_A20_config_root.system;
	const ST_A20_WebSocketConfig_t& v_ws  = v_sys.system.webSocket;

	// ---------------------------
	// 1) intervals: wsChConfig[].chIntervalMs
	// ---------------------------
	for (uint8_t i = 0; i < (uint8_t)EN_A20_WS_CH_COUNT; i++) {
		const ST_A20_WS_CH_CONFIG_t& v_ch = v_ws.wsChConfig[i];

		// chIdx 방어: 잘못 들어오면 "배열 인덱스 i"를 우선 사용
		uint8_t v_idx = (uint8_t)v_ch.chIdx;
		if (v_idx >= (uint8_t)EN_A20_WS_CH_COUNT) {
			v_idx = i;
		}

		if (v_ch.chIntervalMs > 0) {
			s_itvMs[v_idx] = v_ch.chIntervalMs;
		}
	}

	// ---------------------------
	// 2) priority: wsChConfig[].priority 기반으로 정렬 → normalize
	//    - priority 값이 중복/누락/이상이어도 deterministic 하게 정렬
	// ---------------------------
	{
		uint8_t v_idxArr[EN_A20_WS_CH_COUNT] = {
			(uint8_t)EN_A20_WS_CH_STATE,
			(uint8_t)EN_A20_WS_CH_METRICS,
			(uint8_t)EN_A20_WS_CH_CHART,
			(uint8_t)EN_A20_WS_CH_SUMMARY
		};

		// 간단 stable sort (N=4)
		for (uint8_t a = 0; a < (uint8_t)EN_A20_WS_CH_COUNT; a++) {
			for (uint8_t b = a + 1; b < (uint8_t)EN_A20_WS_CH_COUNT; b++) {
				const uint8_t ia = v_idxArr[a];
				const uint8_t ib = v_idxArr[b];

				// wsChConfig는 "인덱스=채널"로 관리되는 전제
				const uint8_t pa = v_ws.wsChConfig[ia].priority;
				const uint8_t pb = v_ws.wsChConfig[ib].priority;

				// priority 오름차순, tie면 채널 인덱스 오름차순(결정적)
				if (pb < pa || (pb == pa && ib < ia)) {
					uint8_t t   = v_idxArr[a];
					v_idxArr[a] = v_idxArr[b];
					v_idxArr[b] = t;
				}
			}
		}

		CT10_WS_normalizePriority(v_idxArr, s_prio);
	}

	// ---------------------------
	// 3) etc: wsEtcConfig
	// ---------------------------
	if (v_ws.wsEtcConfig.chartLargeBytes > 0) s_chartLargeBytes = v_ws.wsEtcConfig.chartLargeBytes;
	if (v_ws.wsEtcConfig.chartThrottleMul > 0) s_chartThrottleMul = v_ws.wsEtcConfig.chartThrottleMul;
	if (v_ws.wsEtcConfig.wsCleanupMs > 0) s_cleanupMs = v_ws.wsEtcConfig.wsCleanupMs;

	// ---------------------------
	// 4) W10 interval setter 통합 (변경 시에만)
	// ---------------------------
	if (CT10_WS_intervalsChanged() && s_setIntervals) {
		s_setIntervals(s_itvMs);
		for (uint8_t i = 0; i < (uint8_t)EN_A20_WS_CH_COUNT; i++) {
			s_lastAppliedItv[i] = s_itvMs[i];
		}

		CL_D10_Logger::log(
			EN_L10_LOG_INFO,
			"[CT10][WS] policy applied: itv(%u/%u/%u/%u) prio(%u,%u,%u,%u) chart(%u,mul=%u) cleanup=%u",
			(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_STATE],
			(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_METRICS],
			(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_CHART],
			(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_SUMMARY],
			(unsigned)s_prio[0], (unsigned)s_prio[1], (unsigned)s_prio[2], (unsigned)s_prio[3],
			(unsigned)s_chartLargeBytes, (unsigned)s_chartThrottleMul,
			(unsigned)s_cleanupMs
		);
	}
}

// --------------------------------------------------
// begin/tick
// --------------------------------------------------
void CT10_WS_begin() {
	CT10_WS_applyPolicyFromSystem();

	for (uint8_t i = 0; i < (uint8_t)EN_A20_WS_CH_COUNT; i++) {
		s_lastSendMs[i] = 0;
		s_pending[i]    = false;
		s_lastAppliedItv[i] = s_itvMs[i];
	}

	s_lastCleanupMs     = 0;
	s_lastPolicyApplyMs = millis();
	s_chartLastPayload  = 0;

	CL_D10_Logger::log(
		EN_L10_LOG_INFO,
		"[CT10][WS] Scheduler begin: itv(state=%u metrics=%u chart=%u summary=%u) cleanup=%u",
		(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_STATE],
		(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_METRICS],
		(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_CHART],
		(unsigned)s_itvMs[(uint8_t)EN_A20_WS_CH_SUMMARY],
		(unsigned)s_cleanupMs
	);
}

// --------------------------------------------------
// 채널별 dirty 소비 → pending 적립
// --------------------------------------------------
static void CT10_WS_collectPending(CL_CT10_ControlManager& p_ctrl) {
	if (p_ctrl.consumeDirtyState())   s_pending[(uint8_t)EN_A20_WS_CH_STATE]   = true;
	if (p_ctrl.consumeDirtyMetrics()) s_pending[(uint8_t)EN_A20_WS_CH_METRICS] = true;
	if (p_ctrl.consumeDirtyChart())   s_pending[(uint8_t)EN_A20_WS_CH_CHART]   = true;
	if (p_ctrl.consumeDirtySummary()) s_pending[(uint8_t)EN_A20_WS_CH_SUMMARY] = true;
}

// --------------------------------------------------
// payload 크기 측정
// --------------------------------------------------
static uint32_t CT10_WS_measurePayloadBytes(JsonDocument& p_doc) {
	return (uint32_t)measureJson(p_doc);
}

// --------------------------------------------------
// 채널 1회 전송 시도 (스로틀 + pending 해소)
// --------------------------------------------------
static bool CT10_WS_trySendOne(uint8_t p_ch, uint32_t p_nowMs) {
	if (p_ch >= (uint8_t)EN_A20_WS_CH_COUNT) return false;
	if (!s_pending[p_ch]) return false;

	uint16_t v_itv = s_itvMs[p_ch];

	// chart는 payload 크기에 따라 추가 스로틀
	if (p_ch == (uint8_t)EN_A20_WS_CH_CHART && s_chartLastPayload >= s_chartLargeBytes) {
		uint32_t v_mul = (s_chartThrottleMul > 0) ? (uint32_t)s_chartThrottleMul : 2UL;
		v_itv = (uint16_t)((uint32_t)v_itv * v_mul);
	}

	if (p_nowMs - s_lastSendMs[p_ch] < v_itv) return false;

	JsonDocument v_doc;

	if (p_ch == (uint8_t)EN_A20_WS_CH_STATE) {
		CL_CT10_ControlManager::toJson(v_doc);
		if (s_bcast_state) s_bcast_state(v_doc, true);
	} else if (p_ch == (uint8_t)EN_A20_WS_CH_METRICS) {
		CL_CT10_ControlManager::toMetricsJson(v_doc);
		if (s_bcast_metrics) s_bcast_metrics(v_doc, true);
	} else if (p_ch == (uint8_t)EN_A20_WS_CH_CHART) {
		CL_CT10_ControlManager::toChartJson(v_doc, true);
		s_chartLastPayload = CT10_WS_measurePayloadBytes(v_doc);
		if (s_bcast_chart) s_bcast_chart(v_doc, true);
	} else { // summary
		CL_CT10_ControlManager::toSummaryJson(v_doc);
		if (s_bcast_summary) s_bcast_summary(v_doc, true);
	}

	s_lastSendMs[p_ch] = p_nowMs;
	s_pending[p_ch]    = false;
	return true;
}

// --------------------------------------------------
// tick
// --------------------------------------------------
void CT10_WS_tick() {
	// broker 미바인딩 (필수 4채널 브로드캐스트가 준비되지 않으면 스케줄러 비활성)
	if (!s_bcast_state || !s_bcast_metrics || !s_bcast_chart || !s_bcast_summary) {
		return;
	}

	uint32_t v_nowMs = millis();

	// (권장) 정책 변경 반영: 3초마다 1회 재적용 (가벼운 복사)
	if (v_nowMs - s_lastPolicyApplyMs >= 3000UL) {
		s_lastPolicyApplyMs = v_nowMs;
		CT10_WS_applyPolicyFromSystem();
	}

	// 1) dirty → pending 적립
	CL_CT10_ControlManager& v_ctrl = CL_CT10_ControlManager::instance();
	CT10_WS_collectPending(v_ctrl);

	// 2) 우선순위대로 "최대 1개"만 전송
	for (uint8_t i = 0; i < (uint8_t)EN_A20_WS_CH_COUNT; i++) {
		uint8_t v_ch = s_prio[i];
		if (CT10_WS_trySendOne(v_ch, v_nowMs)) break;
	}

	// 3) cleanupClients 주기 호출
	if (s_ws_cleanup && (v_nowMs - s_lastCleanupMs >= (uint32_t)s_cleanupMs)) {
		s_lastCleanupMs = v_nowMs;
		s_ws_cleanup();
	}
}
