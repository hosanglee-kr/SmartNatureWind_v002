/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Comfort_0203.cpp
 * 모듈 약어 : CT10
 * 모듈명 : Smart Nature Wind Control Manager - Comfort & Recommendation
 * ------------------------------------------------------
 * 기능 요약:
 * - 일본 기상청 표준 DI(Discomfort Index, 불쾌지수) 실시간 산출
 * - 온·습도 센서 기반 4단계 쾌적도 판정 및 추천 바람 설정 매칭
 * - 추천 프리셋(Preset/Style) 및 매칭되는 사용자 프로필(ProfileId) 추천
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"
#include "A20_Const_0203.h"
#include "A40_Com_Utils_0203.h"
#include "N10_NvsManager_0203.h"
#include "D10_Logger_0203.h"
#include <math.h>
#include <strings.h>

// =========================================================
// DI (Discomfort Index) - 일본 기상청 표준 수식
// DI = 0.81T + 0.01H(0.99T - 14.3) + 46.3
// =========================================================
float CL_CT10_ControlManager::getDiscomfortIndex() {
    float v_t = getCurrentTemperatureMock();
    float v_h = getCurrentHumidityMock();

    // 센서 이상치 방어 클램프
    if (isnan(v_t) || v_t < -20.0f) v_t = 24.0f; // 기본 안전값 24도
    if (v_t > 60.0f) v_t = 60.0f;
    if (isnan(v_h) || v_h < 0.0f) v_h = 50.0f; // 기본 안전값 50%
    if (v_h > 100.0f) v_h = 100.0f;

    float v_di = 0.81f * v_t + 0.01f * v_h * (0.99f * v_t - 14.3f) + 46.3f;

    // 0~100 클램프
    if (v_di < 0.0f) v_di = 0.0f;
    if (v_di > 100.0f) v_di = 100.0f;

    return v_di;
}

// =========================================================
// Comfort Level
// 0=쾌적 (<68) 1=약간 (68~75) 2=불쾌 (75~80) 3=매우 (>80)
// =========================================================
uint8_t CL_CT10_ControlManager::getComfortLevel() {
    float v_di = getDiscomfortIndex();
    if (v_di < 68.0f) return 0;
    if (v_di < 75.0f) return 1;
    if (v_di < 80.0f) return 2;
    return 3;
}

// =========================================================
// 추천 Preset/Style (프로필이 없거나 직접 프리셋 구동 시 폴백)
// =========================================================
const char* CL_CT10_ControlManager::getRecommendedPresetCode() {
    switch (getComfortLevel()) {
        case 0:
            return "FOREST_CANOPY"; // 쾌적: 부드러운 숲속
        case 1:
            return "COUNTRY_BREEZE"; // 약간 더움: 표준 산들바람
        case 2:
            return "OCEAN"; // 불쾌: 시원한 바닷바람
        default:
            return "MOUNTAIN"; // 매우 불쾌: 강력한 계곡풍
    }
}

const char* CL_CT10_ControlManager::getRecommendedStyleCode() {
    switch (getComfortLevel()) {
        case 0:
            return "RELAX";
        case 1:
            return "BALANCE";
        case 2:
            return "ACTIVE";
        default:
            return "ACTIVE";
    }
}

// =========================================================
// 추천 Profile ID (기존 사용자 프로필 중 조건에 부합하는 프로필 검색)
// - 프로필의 Step 중 하나라도 추천 preset+style과 매칭되면 그 프로필 추천
// - 없으면 0 반환 (프론트엔드에서 PRESET Session으로 직접 재생)
// =========================================================
uint8_t CL_CT10_ControlManager::getRecommendedProfileId() {
    if (!g_A20_config_root.userProfiles) return 0;

    const char* v_targetPreset = getRecommendedPresetCode();
    const char* v_targetStyle  = getRecommendedStyleCode();

    for (uint8_t v_i = 0; v_i < g_A20_config_root.userProfiles->count && v_i < A20_Const::MAX_USER_PROFILES; v_i++) {
        const auto& v_prof = g_A20_config_root.userProfiles->items[v_i];
        if (!v_prof.enabled) continue;

        for (uint8_t v_s = 0; v_s < v_prof.segCount && v_s < A20_Const::MAX_STEPS_PER_PROFILE; v_s++) {
            const auto& v_step = v_prof.segments[v_s];
            if (v_step.type != EN_A20_STEP_TYPE_PRESET) continue;

            if (strcasecmp(v_step.presetCode, v_targetPreset) == 0 && strcasecmp(v_step.styleCode, v_targetStyle) == 0) {
                return v_prof.profileId;
            }
        }
    }
    return 0; // 매칭 프로필 없음
}

// =========================================================
// [Stage 10 Phase 3] Comfort 자동 모드 상태 변수 및 구현
// =========================================================
bool     CL_CT10_ControlManager::s_autoComfortEnabled    = false;
uint32_t CL_CT10_ControlManager::s_autoComfortLastEvalMs = 0;

void CL_CT10_ControlManager::setAutoComfort(bool p_enabled) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    if (s_autoComfortEnabled == p_enabled) return;
    s_autoComfortEnabled    = p_enabled;
    s_autoComfortLastEvalMs = 0; // 활성화 시 즉시 평가 준비

    // NVS 영구 저장 (CONTRACT §5.1 순서: s_stateMutex -> N10::s_mutex)
    CL_N10_NvsManager::setAutoComfort(p_enabled);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoComfort set to: %s", p_enabled ? "ON" : "OFF");
}

bool CL_CT10_ControlManager::isAutoComfortEnabled() {
    return s_autoComfortEnabled;
}

uint32_t CL_CT10_ControlManager::getAutoComfortRemainSec() {
    if (!s_autoComfortEnabled) return 0;
    uint32_t v_elapsed = millis() - s_autoComfortLastEvalMs;
    if (v_elapsed >= AUTO_COMFORT_INTERVAL_MS) return 0;
    return (AUTO_COMFORT_INTERVAL_MS - v_elapsed) / 1000;
}

void CL_CT10_ControlManager::tickAutoComfort() {
    if (!s_autoComfortEnabled) return;

    const uint32_t v_now = millis();
    if (v_now - s_autoComfortLastEvalMs < AUTO_COMFORT_INTERVAL_MS) return;
    s_autoComfortLastEvalMs = v_now;

    // 1. AutoOff 래치 활성 시 자동 기동 차단
    if (instance().runCtx.state == EN_CT10_STATE_AUTOOFF_STOPPED || instance()._autoOffLatched) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoComfort: skip (AutoOff latched)");
        return;
    }

    // 2. 이미 세션이 활성 가동 중이면 사용자 의도 우선
    if (instance().isSessionActive()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] AutoComfort: skip (Session already active)");
        return;
    }

    // 3. 실내 환경 기반 추천 프리셋 산출 및 세션 시작
    const char* v_recPreset = getRecommendedPresetCode();
    const char* v_recStyle  = getRecommendedStyleCode();

    if (v_recPreset && strlen(v_recPreset) > 0) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoComfort 5m eval -> startPreset: %s (%s)", v_recPreset, v_recStyle);
        startPresetManual(v_recPreset, v_recStyle);

        // [Stage 10.1 갭 3-A] 자동 기동 세션임을 명시하여 FE의 is-running 표출 보장
        instance()._session.trigger = EN_CT10_TRIGGER_AUTO_COMFORT;
    }
}
