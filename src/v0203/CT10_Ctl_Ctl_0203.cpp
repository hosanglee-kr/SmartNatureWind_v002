/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_Ctl_0203.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager (Core)
 * ------------------------------------------------------
 * [E-2.4] 파일 분할 (4분할)
 *  - 유지: singleton wrappers, begin, setMotion, reloadAll,
 *          applyMotionSimConfigToSim, tickLoop, A-2 위임 메서드 3종
 *  - 이관:
 *    · Seg: tickOverride/tickUserProfile/tickSchedule/tickSegmentSequence/
 *           applySegmentOn/Off/updateRunCtx* (CT10_Ctl_Ctl_Seg_0203.cpp)
 *    · Ovr: startOverrideFixed/Preset/applyManualResolved/stopOverride
 *           (CT10_Ctl_Ctl_Ovr_0203.cpp)
 *    · Mode: setProfileMode/startUserProfileByNo/stopUserProfile
 *           (CT10_Ctl_Ctl_Mode_0203.cpp)
 * ------------------------------------------------------
 * [주의]
 * - AutoOff 초기화/체크/Motion/TimeInvalid 등은 CT10_Ctl_Basic_0203.cpp 유지
 * - runCtx snapshot helpers는 Seg 파일 (applySegmentOn/Off에서만 사용)
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"

#include "A40_Com_Utils_0203.h" // A40_ComFunc / CL_A40_MutexGuard_Semaphore
#include "N10_NvsManager_0203.h"
#include "CT10_Monitor_0203.h"

// 외부 전역(프로젝트 기존 전역 PWM)
extern CL_P10_PWM g_P10_pwm;

// --------------------------------------------------
// Singleton wrappers
// --------------------------------------------------
bool CL_CT10_ControlManager::begin() {
    instance().begin(g_P10_pwm);
    return true;
}

void CL_CT10_ControlManager::tick() {
    instance().tickLoop();
    instance().updatePendingScheduleInfo();
}

void CL_CT10_ControlManager::setMode(bool p_profileMode) {
    instance().setProfileMode(p_profileMode);
}

bool CL_CT10_ControlManager::setActiveUserProfile(uint16_t p_profileNo) {
    return instance().startUserProfileByNo(p_profileNo);
}

void CL_CT10_ControlManager::applyManual(const ST_A20_ResolvedWind_t& p_wind) {
    instance().applyManualResolved(p_wind, 0);
}

void CL_CT10_ControlManager::clearManual() {
    instance().stopOverride();
}

// --------------------------------------------------
// reloadAll (F-05 loopTask 위임 실행)
// --------------------------------------------------
bool CL_CT10_ControlManager::reloadAll() {
    // [A-min] 새 root를 로컬에 로드 (기존 g_A20_config_root는 손대지 않음)
    ST_A20_ConfigRoot_t v_new;
    bool                v_ok = CL_C10_ConfigManager::loadAll(v_new);
    if (!v_ok) {
        CL_C10_ConfigManager::freeAll(v_new);
        s_lastReloadOk.store(false, std::memory_order_release);
        return false;
    }

    // CT10 mutex 하에서 swap (CT10 reader와 배타)
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_C10_ConfigManager::freeAll(v_new);
        s_lastReloadOk.store(false, std::memory_order_release);
        return false;
    }

    // CT10 mutex + root swap mutex
    portENTER_CRITICAL(&CL_C10_ConfigManager::s_rootSwapMux);
    ST_A20_ConfigRoot_t v_old = g_A20_config_root;
    g_A20_config_root         = v_new;
    portEXIT_CRITICAL(&CL_C10_ConfigManager::s_rootSwapMux);

    // CT10 멤버 초기화
    CL_CT10_ControlManager& v_inst = instance();

    v_inst.runSource        = EN_CT10_RUN_NONE;
    v_inst.curScheduleIndex = -1;
    v_inst.curProfileIndex  = -1;
    v_inst.useProfileMode   = false;

    memset(&v_inst.overrideState, 0, sizeof(v_inst.overrideState));
    memset(&v_inst.autoOffRt, 0, sizeof(v_inst.autoOffRt));
    memset(&v_inst.scheduleSegRt, 0, sizeof(v_inst.scheduleSegRt));
    memset(&v_inst.profileSegRt, 0, sizeof(v_inst.profileSegRt));
    memset(&v_inst.runCtx, 0, sizeof(v_inst.runCtx));

    // [A-2] 영속 필드 리셋
    v_inst._persistOffTimeLastYday = -1;

    // [B-2] AutoOff 래치 리셋
    v_inst._autoOffLatched = false;

    // [C-3] N10 런타임 상태 리셋
    CL_N10_NvsManager::resetRuntime();

    v_inst.scheduleSegRt.index = -1;
    v_inst.profileSegRt.index  = -1;

    // runCtx 기본 상태(SSOT)
    v_inst.runCtx.state             = EN_CT10_STATE_IDLE;
    v_inst.runCtx.reason            = EN_CT10_REASON_NONE;
    v_inst.runCtx.lastDecisionMs    = millis();
    v_inst.runCtx.lastStateChangeMs = v_inst.runCtx.lastDecisionMs;

    v_inst.sim.stop();

    v_inst.markDirty("state");
    v_inst.markDirty("metrics");

    // [I-3] pending motion.sim apply 리셋
    v_inst._pendingMotionSimApply.store(false, std::memory_order_release);

    // [A-min] CT10 mutex 해제 후 구버전 root 해제 (E-1 지연 free)
    v_guard.unlock();
    CL_C10_ConfigManager::queuePendingFree(v_old);

    s_lastReloadOk.store(true, std::memory_order_release);
    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] reloadAll done (lastReloadOk=true)");
    return true;
}

// --------------------------------------------------
// begin (실제 초기화)
// --------------------------------------------------
void CL_CT10_ControlManager::begin(CL_P10_PWM& p_pwm) {
    pwm = &p_pwm;

    memset(&overrideState, 0, sizeof(overrideState));
    memset(&scheduleSegRt, 0, sizeof(scheduleSegRt));
    memset(&profileSegRt, 0, sizeof(profileSegRt));
    memset(&autoOffRt, 0, sizeof(autoOffRt));
    memset(&runCtx, 0, sizeof(runCtx));

    scheduleSegRt.index = -1;
    profileSegRt.index  = -1;

    // segment rt 초기 진입 안정화
    uint32_t v_now             = (uint32_t)millis();
    scheduleSegRt.onPhase      = true;
    scheduleSegRt.phaseStartMs = v_now;
    scheduleSegRt.loopCount    = 0;

    profileSegRt.onPhase      = true;
    profileSegRt.phaseStartMs = v_now;
    profileSegRt.loopCount    = 0;

    autoOffRt.offTimeLastYday = -1;
    autoOffRt.offTimeLastMin  = -1;

    useProfileMode    = false;
    runSource         = EN_CT10_RUN_NONE;
    curScheduleIndex  = -1;
    curProfileIndex   = -1;
    lastTickMs        = 0;
    lastMetricsPushMs = 0;

    runCtx.state             = EN_CT10_STATE_IDLE;
    runCtx.reason            = EN_CT10_REASON_NONE;
    runCtx.lastDecisionMs    = v_now;
    runCtx.lastStateChangeMs = v_now;

    runCtx.stateHoldUntilMs = 0;
    runCtx.stateAckRequired = false;

    runCtx.activeSchId     = 0;
    runCtx.activeSchNo     = 0;
    runCtx.activeSegId     = 0;
    runCtx.activeSegNo     = 0;
    runCtx.activeProfileNo = 0;

    // [I-3] pending motion.sim apply 리셋
    _pendingMotionSimApply.store(false, std::memory_order_release);

    // [Stage 10] Comfort 자동 모드 NVS 복원
    s_autoComfortEnabled    = CL_N10_NvsManager::isAutoComfort();
    s_autoComfortLastEvalMs = 0;

    sim.begin(p_pwm);

    active = true;

    markDirty("state");
    markDirty("metrics");
    markDirty("summary");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] begin()");
}

void CL_CT10_ControlManager::setMotion(CL_M10_MotionLogic* p_motion) {
    motion = p_motion;
}

// --------------------------------------------------
// config → S10 runtime 반영 (F-06 위임 실행)
// --------------------------------------------------
void CL_CT10_ControlManager::applyMotionSimConfigToSim() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    if (!g_A20_config_root.motion) return;

    const ST_A20_MotSimCfg_t& v_src = g_A20_config_root.motion->sim;

    sim.userIntensity   = A40_ComFunc::clampVal<float>(v_src.intensity, 0.0f, 100.0f);
    sim.userVariability = A40_ComFunc::clampVal<float>(v_src.variability, 0.0f, 100.0f);
    sim.userGustFreq    = A40_ComFunc::clampVal<float>(v_src.gustFreq, 0.0f, 100.0f);
    sim.fanLimitPct     = A40_ComFunc::clampVal<float>(v_src.fanLimit, 0.0f, 100.0f);
    sim.minFanPct       = A40_ComFunc::clampVal<float>(v_src.minFan, 0.0f, 100.0f);
    sim.turbSigma       = v_src.turbSigma;
    sim.turbLenScale    = v_src.turbLenScale;
    sim.thermalStrength = v_src.thermalStrength;
    sim.thermalRadius   = v_src.thermalRadius;
    sim.fanPowerEnabled = v_src.fanPowerEnabled;

    if (v_src.presetCode[0]) {
        memset(sim.presetCode, 0, sizeof(sim.presetCode));
        strlcpy(sim.presetCode, v_src.presetCode, sizeof(sim.presetCode));
    }

    sim.reapplyPresetCore();

    if (v_src.styleCode[0]) {
        memset(sim.styleCode, 0, sizeof(sim.styleCode));
        strlcpy(sim.styleCode, v_src.styleCode, sizeof(sim.styleCode));
    }

    CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] S10 runtime updated from motion.sim (intensity=%.1f)", sim.userIntensity);
}

// --------------------------------------------------
// tickLoop (메인 제어 루프)
// --------------------------------------------------
void CL_CT10_ControlManager::tickLoop() {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] %s: Mutex busy", __func__);
        return;
    }

    // [F-06] Deferred: pending motion.sim apply
    if (_pendingMotionSimApply.exchange(false, std::memory_order_acq_rel)) {
        applyMotionSimConfigToSim();
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] MotionSim apply consumed (loopTask)");
    }

    if (!active || !pwm) return;

    unsigned long v_nowMs = millis();
    if (v_nowMs - lastTickMs < S_TICK_MIN_INTERVAL_MS) return;
    lastTickMs = v_nowMs;

    // [Stage 8 신규] AI set_timer 연동 런타임 AutoOff 만료 검사
    if (_session.runtimeAutoOffMin > 0 && _session.type != EN_CT10_SESSION_NONE && _session.state == EN_SESSION_ACTIVE) {
        if (v_nowMs - _session.runtimeAutoOffStartMs >= (_session.runtimeAutoOffMin * 60000UL)) {
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Runtime AutoOff expired (%u min)", (unsigned)_session.runtimeAutoOffMin);
            _session.runtimeAutoOffMin     = 0;
            _session.runtimeAutoOffStartMs = 0;
            _autoOffLatched                = true;
            runCtx.reason                  = EN_CT10_REASON_AUTOOFF_TIMER;
            stopSession();

            // [Stage 10.1 갭 1-A] 타이머 만료 시 Comfort 자동 모드 영구 해제
            setAutoComfort(false);
            return;
        }
    }

    // [Stage 10 Phase 3] Comfort 자동 모드 주기 평가 호출
    tickAutoComfort();

    // 0) 이벤트 상태 hold/ack 유지
    if (!overrideState.active && shouldHoldEventState()) {
        maybePushMetricsDirty();
        return;
    }

    // 1) Decide + Apply (SSOT)
    ST_CT10_Decision_t v_d = decideRunSource();
    applyDecision(v_d);

    // 2) Execute by decided state
    if (runCtx.state == EN_CT10_STATE_OVERRIDE) {
        if (tickOverride()) {
            sim.tick();
        }
        maybePushMetricsDirty();
        return;
    }

    if (runCtx.state == EN_CT10_STATE_PROFILE_RUN) {
        if (tickUserProfile()) {
            sim.tick();
        } else if (sim.active) {
            sim.stop();
        }
        maybePushMetricsDirty();
        return;
    }

    if (runCtx.state == EN_CT10_STATE_SCHEDULE_RUN) {
        if (tickSchedule()) {
            sim.tick();
        } else if (sim.active) {
            sim.stop();
        }
        maybePushMetricsDirty();
        return;
    }

    if (sim.active) sim.stop();
    maybePushMetricsDirty();
}

// ======================================================
// [A-2] 캡슐화 위임 메서드 (W10 async_tcp 전용)
// ======================================================
bool CL_CT10_ControlManager::feedPIR(bool p_detected) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] feedPIR: Mutex busy");
        return false;
    }
    if (!motion) return false;
    motion->feedPIR(p_detected);
    return true;
}

bool CL_CT10_ControlManager::patchSimFromJson(const JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) {
        CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[CT10] patchSimFromJson: Mutex busy");
        return false;
    }
    return sim.patchFromJson(p_doc);
}

void CL_CT10_ControlManager::exportSimJson(JsonDocument& p_doc) {
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;
    sim.toJson(p_doc);
}

// ======================================================
// [v0203 신규] Session 엔진 진입점 (start/stop/pause/resume)
// ======================================================
// ======================================================
// [Phase3 N-1] Session 엔진 (ADR-1 위임 모델)
// ======================================================
bool CL_CT10_ControlManager::startSession(EN_CT10_session_type_t p_type,
                                          EN_CT10_trigger_t      p_trigger,
                                          const JsonDocument&    p_payloadDoc) {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    // ① 기존 세션/실행 상태 정리 (멱등)
    if (self._session.type != EN_CT10_SESSION_NONE) {
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] startSession: replacing existing (type=%u)", (unsigned)self._session.type);
        self.stopSession();
    } else if (self.overrideState.active || self.runSource != EN_CT10_RUN_NONE) {
        self.sim.stop();
        if (self.pwm) self.pwm->setDutyPercent(0.0f);
        if (self.overrideState.active) self.stopOverride();
        if (self.runSource == EN_CT10_RUN_USER_PROFILE) self.stopUserProfile();
    }

    // ② 타입별 위임 실행
    bool v_ok = false;

    switch (p_type) {
        case EN_CT10_SESSION_PLAYLIST: {
            uint16_t v_profileId = A40_ComFunc::Json_getNum<uint16_t>(p_payloadDoc.as<JsonObjectConst>(), "profileId", 0);
            if (v_profileId == 0 || v_profileId > 255) {
                CL_D10_Logger::log(EN_L10_LOG_WARN,
                                   "[CT10] startSession(PLAYLIST): invalid profileId=%u",
                                   (unsigned)v_profileId);
                return false;
            }

            if (!g_A20_config_root.userProfiles) return false;
            auto& v_profiles = *g_A20_config_root.userProfiles;

            const ST_A20_UserProfileItem_t* v_profPtr = nullptr;
            for (uint8_t v_i = 0; v_i < v_profiles.count; v_i++) {
                if (v_profiles.items[v_i].profileId == (uint8_t)v_profileId) {
                    v_profPtr = &v_profiles.items[v_i];
                    break;
                }
            }
            if (!v_profPtr || !v_profPtr->enabled || v_profPtr->segCount == 0) {
                CL_D10_Logger::log(EN_L10_LOG_WARN,
                                   "[CT10] startSession(PLAYLIST): profile unavailable (id=%u)",
                                   (unsigned)v_profileId);
                return false;
            }

            v_ok = self.startUserProfileByNo(v_profPtr->profileNo);
            if (v_ok) {
                self.setProfileMode(true); // schedule 배제

                self._session.payload.playlist.profileId = (uint8_t)v_profileId;
                self._session.payload.playlist.profileNo = v_profPtr->profileNo;
                A40_ComFunc::copyStr2Buffer_safe(self._session.payload.playlist.profileName,
                                                 v_profPtr->name,
                                                 sizeof(self._session.payload.playlist.profileName));
                self._session.payload.playlist.totalSteps         = v_profPtr->segCount;
                self._session.payload.playlist.currentStepIdx     = 0;
                self._session.payload.playlist.currentStepStartMs = millis();
                self._session.payload.playlist.currentStepDurationMs =
                    (uint32_t)v_profPtr->segments[0].durationMin * 60000UL;
            }
            break;
        }

        case EN_CT10_SESSION_PRESET: {
            JsonObjectConst p  = p_payloadDoc.as<JsonObjectConst>();
            const char*     pc = A40_ComFunc::Json_getStr(p, "presetCode", A20_Const::DEFAULT_PRESET_CODE);
            const char*     sc = A40_ComFunc::Json_getStr(p, "styleCode", A20_Const::DEFAULT_STYLE_CODE);
            if (!pc || !pc[0] || !sc || !sc[0]) return false;

            ST_A20_SegmentOverride_t v_ovr;
            memset(&v_ovr, 0, sizeof(v_ovr));
            v_ovr.enabled         = false;
            v_ovr.windIntensity   = -1.0f;
            v_ovr.windVariability = -1.0f;
            v_ovr.gustFrequency   = -1.0f;

            if (p["override"].is<JsonObjectConst>()) {
                JsonObjectConst ovr = p["override"].as<JsonObjectConst>();
                v_ovr.enabled       = ovr["enabled"] | false;
                if (ovr["windIntensity"].is<float>()) v_ovr.windIntensity = ovr["windIntensity"].as<float>();
                if (ovr["windVariability"].is<float>()) v_ovr.windVariability = ovr["windVariability"].as<float>();
                if (ovr["gustFrequency"].is<float>()) v_ovr.gustFrequency = ovr["gustFrequency"].as<float>();
            }

            self.startOverridePreset(pc, sc, &v_ovr, 0, true); // forever
            v_ok = self.overrideState.active;

            if (v_ok) {
                A40_ComFunc::copyStr2Buffer_safe(self._session.payload.preset.presetCode,
                                                 pc,
                                                 sizeof(self._session.payload.preset.presetCode));
                A40_ComFunc::copyStr2Buffer_safe(self._session.payload.preset.styleCode,
                                                 sc,
                                                 sizeof(self._session.payload.preset.styleCode));
                self._session.payload.preset.override = v_ovr;
            }
            break;
        }

        case EN_CT10_SESSION_FIXED: {
            float v_pct = A40_ComFunc::Json_getNum<float>(p_payloadDoc.as<JsonObjectConst>(), "percent", 50.0f);
            if (v_pct < 0.0f) v_pct = 0.0f;
            if (v_pct > 100.0f) v_pct = 100.0f;

            self.startOverrideFixed(v_pct, 0, true); // forever
            v_ok = self.overrideState.active;

            if (v_ok) self._session.payload.fixed.percent = v_pct;
            break;
        }

        default:
            return false;
    }

    if (!v_ok) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] startSession: delegation failed (type=%u)", (unsigned)p_type);
        return false;
    }

    // ③ 세션 메타 세팅 (mirror layer)
    self._session.type          = p_type;
    self._session.trigger       = p_trigger;
    self._session.state         = EN_SESSION_ACTIVE;
    self._session.startedAt     = millis();
    self._session.pausedAccumMs = 0;
    self._session.pausedAtMs    = 0;

    // ④ NVS 세션 영속화
    if (p_type == EN_CT10_SESSION_PLAYLIST && p_trigger == EN_CT10_TRIGGER_MANUAL) {
        CL_N10_NvsManager::setManualSession(self._session.payload.playlist.profileNo, true);
    } else {
        CL_N10_NvsManager::setManualSession(0, false);
    }

    // ⑤ Dirty + Monitor
    self.markDirty("state");
    self.markDirty("metrics");
    self.markDirty("summary");

    const char* v_label = (p_type == EN_CT10_SESSION_PLAYLIST) ? "재생 시작"
                          : (p_type == EN_CT10_SESSION_PRESET) ? "프리셋 재생"
                                                               : "일반 선풍기";
    CL_MON_Monitor::pushSessionEvent(EN_MON_EVENT_SESSION_START,
                                     v_label,
                                     (uint8_t)p_type,
                                     (uint8_t)p_trigger,
                                     0,
                                     0,
                                     self._session.payload.playlist.profileNo,
                                     0);

    CL_D10_Logger::log(EN_L10_LOG_INFO,
                       "[CT10] startSession: type=%u trigger=%u (delegated)",
                       (unsigned)p_type,
                       (unsigned)p_trigger);
    return true;
}

bool CL_CT10_ControlManager::startPlaylistManual(uint8_t p_profileId) {
    JsonDocument d;
    d["profileId"] = p_profileId;
    return startSession(EN_CT10_SESSION_PLAYLIST, EN_CT10_TRIGGER_MANUAL, d);
}

bool CL_CT10_ControlManager::startPresetManual(const char* p_presetCode, const char* p_styleCode) {
    JsonDocument d;
    d["presetCode"] = p_presetCode;
    d["styleCode"]  = p_styleCode;
    return startSession(EN_CT10_SESSION_PRESET, EN_CT10_TRIGGER_MANUAL, d);
}

bool CL_CT10_ControlManager::startFixedManual(float p_percent) {
    JsonDocument d;
    d["percent"] = p_percent;
    return startSession(EN_CT10_SESSION_FIXED, EN_CT10_TRIGGER_MANUAL, d);
}

// ======================================================
// [Phase3 N-1] pauseSession — 실행 상태 백업 + 물리 정지
// ======================================================
bool CL_CT10_ControlManager::pauseSession() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    if (self._session.type == EN_CT10_SESSION_NONE) return false;
    if (self._session.state != EN_SESSION_ACTIVE) return false;

    // ① 실행 컨텍스트 백업 (resumeSession에서 복원)
    self._pausedExec.valid        = true;
    self._pausedExec.runSource    = self.runSource;
    self._pausedExec.profileIndex = self.curProfileIndex;
    self._pausedExec.override     = self.overrideState;
    self._pausedExec.profileSegRt = self.profileSegRt;
    self._pausedExec.autoOffRt    = self.autoOffRt;

    // ② 물리 정지
    self.sim.stop();
    if (self.pwm) self.pwm->setDutyPercent(0.0f);

    // ③ 실행 상태 해제 (decideRunSource → IDLE 자연 판정)
    memset(&self.overrideState, 0, sizeof(self.overrideState));
    self.runSource       = EN_CT10_RUN_NONE;
    self.curProfileIndex = -1;
    memset(&self.profileSegRt, 0, sizeof(self.profileSegRt));
    self.profileSegRt.index = -1;

    // ④ 세션 상태
    self._session.state      = EN_SESSION_PAUSED;
    self._session.pausedAtMs = millis();

    self.markDirty("state");
    self.markDirty("metrics");

    CL_MON_Monitor::pushSessionEvent(EN_MON_EVENT_PAUSE,
                                     "일시정지",
                                     (uint8_t)self._session.type,
                                     (uint8_t)self._session.trigger,
                                     self._session.payload.playlist.currentStepIdx,
                                     self._session.payload.playlist.totalSteps,
                                     0,
                                     0);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] pauseSession()");
    return true;
}

// ======================================================
// [Phase3 N-1] resumeSession — 백업 복원 + Smart Resume
// ======================================================
bool CL_CT10_ControlManager::resumeSession() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    if (self._session.type == EN_CT10_SESSION_NONE) return false;
    if (self._session.state != EN_SESSION_PAUSED) return false;
    if (!self._pausedExec.valid) return false;

    // ① 일시정지 시간 누적
    uint32_t v_pauseDuration     = millis() - self._session.pausedAtMs;
    self._session.pausedAccumMs += v_pauseDuration;
    self._session.pausedAtMs     = 0;

    // ② 실행 컨텍스트 복원
    self.runSource       = self._pausedExec.runSource;
    self.curProfileIndex = self._pausedExec.profileIndex;
    self.overrideState   = self._pausedExec.override;
    self.profileSegRt    = self._pausedExec.profileSegRt;
    self.autoOffRt       = self._pausedExec.autoOffRt;

    // ③ Smart Resume 정책
    if (self._session.type == EN_CT10_SESSION_PLAYLIST) {
        if (v_pauseDuration > S_PAUSE_STEP_RESET_MS) {
            self.profileSegRt.index                           = -1;
            self.profileSegRt.phaseStartMs                    = millis();
            self.profileSegRt.loopCount                       = 0;
            self._session.payload.playlist.currentStepIdx     = 0;
            self._session.payload.playlist.currentStepStartMs = millis();
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] resumeSession: >30min → restart from Step 1");
        } else if (v_pauseDuration > S_PAUSE_CONTINUE_MS) {
            self.profileSegRt.phaseStartMs                    = millis();
            self._session.payload.playlist.currentStepStartMs = millis();
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] resumeSession: 5~30min → step phase reset");
        } else {
            self.profileSegRt.phaseStartMs                    += v_pauseDuration;
            self._session.payload.playlist.currentStepStartMs += v_pauseDuration;
            CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] resumeSession: <5min → continuous resume");
        }
    }

    self._session.state    = EN_SESSION_ACTIVE;
    self._pausedExec.valid = false;

    self.markDirty("state");

    CL_MON_Monitor::pushSessionEvent(EN_MON_EVENT_RESUME,
                                     "재개",
                                     (uint8_t)self._session.type,
                                     (uint8_t)self._session.trigger,
                                     self._session.payload.playlist.currentStepIdx,
                                     self._session.payload.playlist.totalSteps,
                                     0,
                                     0);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] resumeSession()");
    return true;
}

// ======================================================
// [Phase3 N-1] stopSession — 전체 실행 상태 리셋 (멱등)
// ======================================================
bool CL_CT10_ControlManager::stopSession() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    // 멱등: 이미 완전 정지 상태면 no-op
    if (self._session.type == EN_CT10_SESSION_NONE && !self.overrideState.active && self.runSource == EN_CT10_RUN_NONE) {
        return false;
    }

    // ① 물리 정지
    self.sim.stop();
    if (self.pwm) self.pwm->setDutyPercent(0.0f);

    // ② 위임 경로 정리 (재귀 mutex → 안전)
    if (self.overrideState.active) self.stopOverride();
    if (self.runSource == EN_CT10_RUN_USER_PROFILE) self.stopUserProfile();

    // ③ 실행 상태 전체 리셋
    memset(&self.overrideState, 0, sizeof(self.overrideState));
    self.runSource       = EN_CT10_RUN_NONE;
    self.curProfileIndex = -1;
    memset(&self.profileSegRt, 0, sizeof(self.profileSegRt));
    self.profileSegRt.index = -1;

    // ④ 세션 리셋
    EN_CT10_session_type_t v_oldType   = self._session.type;
    EN_CT10_trigger_t      v_oldTrg    = self._session.trigger;
    uint16_t               v_oldProfNo = self._session.payload.playlist.profileNo;

    memset(&self._session, 0, sizeof(self._session));
    self._session.type  = EN_CT10_SESSION_NONE;
    self._session.state = EN_SESSION_COMPLETED;

    self._pausedExec.valid = false;

    // ⑤ NVS 해제
    CL_N10_NvsManager::setManualSession(0, false);
    if (CL_N10_NvsManager::isManualOvrSchedule()) {
        CL_N10_NvsManager::setManualOvrSchedule(false);
        CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] Manual override released on stop");
    }

    self.markDirty("state");
    self.markDirty("metrics");
    self.markDirty("summary");

    CL_MON_Monitor::pushSessionEvent(EN_MON_EVENT_SESSION_END, "세션 종료", (uint8_t)v_oldType, (uint8_t)v_oldTrg, 0, 0, v_oldProfNo, 0);

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] stopSession()");
    return true;
}

// ======================================================
// [Stage 8 신규] AI set_timer 연동 런타임 AutoOff 제어
// ======================================================
bool CL_CT10_ControlManager::setSessionAutoOff(uint32_t p_minutes) {
    if (p_minutes == 0 || p_minutes > 1440) return false;
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;

    self._session.runtimeAutoOffStartMs = millis();
    self._session.runtimeAutoOffMin     = p_minutes;
    self.markDirty("state");
    self.markDirty("metrics");

    CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] setSessionAutoOff(%u min)", (unsigned)p_minutes);
    return true;
}

void CL_CT10_ControlManager::clearSessionAutoOff() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return;

    self._session.runtimeAutoOffStartMs = 0;
    self._session.runtimeAutoOffMin     = 0;
    self.markDirty("state");
    self.markDirty("metrics");
}

uint32_t CL_CT10_ControlManager::getSessionAutoOffRemainSec() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return 0;
    if (self._session.runtimeAutoOffMin == 0) return 0;

    uint32_t v_elapsedSec = (millis() - self._session.runtimeAutoOffStartMs) / 1000;
    uint32_t v_totalSec   = self._session.runtimeAutoOffMin * 60;
    return (v_elapsedSec < v_totalSec) ? (v_totalSec - v_elapsedSec) : 0;
}

uint16_t CL_CT10_ControlManager::getTimerDurationMin() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return 0;
    return self._session.runtimeAutoOffMin;
}

bool CL_CT10_ControlManager::isSessionActive() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    return self._session.type != EN_CT10_SESSION_NONE && self._session.state == EN_SESSION_ACTIVE;
}

bool CL_CT10_ControlManager::isSessionPaused() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    if (!v_guard.isAcquired()) return false;
    return self._session.state == EN_SESSION_PAUSED;
}

ST_CT10_SessionContext_t CL_CT10_ControlManager::getSessionSnapshot() {
    auto&                       self = instance();
    CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
    ST_CT10_SessionContext_t    v_empty = {};
    if (!v_guard.isAcquired()) return v_empty;
    return self._session;
}

void CL_CT10_ControlManager::updatePendingScheduleInfo() {
    runCtx.pendingScheduleActive = false;
    runCtx.pendingSchId          = 0;
    runCtx.pendingSchNo          = 0;
    runCtx.pendingProfileNo      = 0;
    runCtx.pendingRemainMin      = 0;
    memset(runCtx.pendingSchName, 0, sizeof(runCtx.pendingSchName));
    memset(runCtx.pendingSchStart, 0, sizeof(runCtx.pendingSchStart));

    // Manual Session 중일 때만 연산
    if (_session.type == EN_CT10_SESSION_NONE) return;
    if (_session.trigger != EN_CT10_TRIGGER_MANUAL) return;
    if (!g_A20_config_root.schedules) return;

    auto&     cfg = *g_A20_config_root.schedules;
    struct tm tm;
    if (!CL_TM10_TimeManager::getLocalTime(tm)) return;

    uint8_t  today  = (tm.tm_wday == 0) ? 6 : (uint8_t)(tm.tm_wday - 1);
    uint16_t curMin = (uint16_t)tm.tm_hour * 60 + tm.tm_min;

    uint16_t nearest    = 0xFFFF;
    int      nearestIdx = -1;

    for (uint8_t i = 0; i < cfg.count; i++) {
        const auto& s = cfg.items[i];
        if (!s.enabled || s.profileId == 0) continue;

        uint16_t start = A40_parseHHMMtoMin_24h(s.period.startTime);
        uint16_t end   = A40_parseHHMMtoMin_24h(s.period.endTime);

        bool isActive = false;
        if (start == end) {
            isActive = s.period.days[today];
        } else if (start < end) {
            if (s.period.days[today]) isActive = (curMin >= start && curMin < end);
        } else {
            if (curMin >= start)
                isActive = s.period.days[today];
            else if (curMin < end)
                isActive = s.period.days[today == 0 ? 6 : today - 1];
        }

        if (isActive) {
            runCtx.pendingScheduleActive = true;
            runCtx.pendingSchId          = s.schId;
            runCtx.pendingSchNo          = s.schNo;
            A40_ComFunc::copyStr2Buffer_safe(runCtx.pendingSchName, s.name, sizeof(runCtx.pendingSchName));
            A40_ComFunc::copyStr2Buffer_safe(runCtx.pendingSchStart, s.period.startTime, sizeof(runCtx.pendingSchStart));
            runCtx.pendingRemainMin = 0;
            runCtx.pendingProfileNo = (uint8_t)s.profileId;
            return;
        }

        if (!s.period.days[today]) continue;
        if (start <= curMin) continue;
        uint16_t remain = start - curMin;
        if (remain < nearest) {
            nearest    = remain;
            nearestIdx = i;
        }
    }

    if (nearestIdx >= 0 && nearest <= 60) {
        const auto& s                = cfg.items[nearestIdx];
        runCtx.pendingScheduleActive = true;
        runCtx.pendingSchId          = s.schId;
        runCtx.pendingSchNo          = s.schNo;
        runCtx.pendingRemainMin      = nearest;
        A40_ComFunc::copyStr2Buffer_safe(runCtx.pendingSchName, s.name, sizeof(runCtx.pendingSchName));
        A40_ComFunc::copyStr2Buffer_safe(runCtx.pendingSchStart, s.period.startTime, sizeof(runCtx.pendingSchStart));
        runCtx.pendingProfileNo = (uint8_t)s.profileId;
    }

    runCtx.manualOverrideSchedule = CL_N10_NvsManager::isManualOvrSchedule();
}
