#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_0202.h
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind 제어 통합 Manager
 * ------------------------------------------------------
 * [Batch A-2] 캡슐화 위임 메서드
 *  - motion/sim → private (직접 접근 금지)
 *  - feedPIR / patchSimFromJson / exportSimJson 공개 위임
 * [Batch D-1] consumeAllDirty()
 *  - 4개 dirty 플래그를 mutex 1회로 배치 소비
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <string.h>
#include <time.h>
#include <atomic>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "A20_Const_0202.h"
#include "C10_Config_0202.h"
#include "D10_Logger_0202.h"
#include "M10_MotionLogic_0202.h"
#include "P10_PWM_ctrl_0202.h"
#include "S10_Simul_0202.h"
#include "S20_WindSolver_0202.h"
#include "TM10_TimeMg_0202.h"

// ------------------------------------------------------
// 런타임 상태 구조체
// ------------------------------------------------------
typedef enum : uint8_t {
    EN_CT10_RUN_NONE         = 0,
    EN_CT10_RUN_SCHEDULE     = 1,
    EN_CT10_RUN_USER_PROFILE = 2
} EN_CT10_run_source_t;

typedef enum : uint8_t {
    EN_CT10_STATE_IDLE            = 0,
    EN_CT10_STATE_OVERRIDE        = 1,
    EN_CT10_STATE_PROFILE_RUN     = 2,
    EN_CT10_STATE_SCHEDULE_RUN    = 3,
    EN_CT10_STATE_MOTION_BLOCKED  = 4,
    EN_CT10_STATE_AUTOOFF_STOPPED = 5,
    EN_CT10_STATE_TIME_INVALID    = 6
} EN_CT10_state_t;

typedef enum : uint8_t {
    EN_CT10_REASON_NONE                = 0,
    EN_CT10_REASON_OVERRIDE_ACTIVE     = 1,
    EN_CT10_REASON_PROFILE_MODE        = 2,
    EN_CT10_REASON_USER_PROFILE_ACTIVE = 3,
    EN_CT10_REASON_SCHEDULE_ACTIVE     = 4,
    EN_CT10_REASON_NO_ACTIVE_SCHEDULE  = 5,
    EN_CT10_REASON_NO_SCHEDULES        = 6,
    EN_CT10_REASON_TIME_NOT_VALID      = 7,
    EN_CT10_REASON_MOTION_NO_PRESENCE  = 8,
    EN_CT10_REASON_AUTOOFF_TIMER       = 9,
    EN_CT10_REASON_AUTOOFF_TIME        = 10,
    EN_CT10_REASON_AUTOOFF_TEMP        = 11
} EN_CT10_reason_t;

typedef struct {
    EN_CT10_state_t  nextState;
    EN_CT10_reason_t reason;
    EN_CT10_run_source_t nextRunSource;
    int8_t               nextScheduleIndex;
    int8_t               nextProfileIndex;
    bool wantSimStop;
    bool wantResetSegRt;
    bool wantResetAutoOff;
} ST_CT10_Decision_t;

typedef struct {
    EN_CT10_state_t  state;
    EN_CT10_reason_t reason;
    uint32_t lastDecisionMs;
    uint32_t lastStateChangeMs;
    uint32_t stateHoldUntilMs;
    bool     stateAckRequired;
    uint8_t  activeSchId;
    uint16_t activeSchNo;
    uint8_t  activeSegId;
    uint16_t activeSegNo;
    uint16_t activeProfileNo;
} ST_CT10_RunContext_t;

typedef struct {
    bool                  active;
    bool                  useFixed;
    bool                  resolvedApplied;
    unsigned long         endMs;
    float                 fixedPercent;
    ST_A20_ResolvedWind_t resolved;
} ST_CT10_Override_t;

typedef struct {
    int8_t        index;
    bool          onPhase;
    unsigned long phaseStartMs;
    uint8_t       loopCount;
} ST_CT10_SegmentRuntime_t;

typedef struct {
    bool          timerArmed;
    unsigned long timerStartMs;
    uint32_t      timerMinutes;
    bool          offTimeEnabled;
    uint16_t      offTimeMinutes;
    int16_t       offTimeLastYday;
    int16_t       offTimeLastMin;
    bool          offTempEnabled;
    float         offTemp;
} ST_CT10_AutoOffRuntime_t;

const char* CT10_stateToString(EN_CT10_state_t p_s);
const char* CT10_reasonToString(EN_CT10_reason_t p_r);

void CT10_WS_begin();
void CT10_WS_tick();
void CT10_markDirtyFromSim(const char* p_key);

void CT10_WS_setBrokers(void (*p_state)(JsonDocument&, bool),
                        void (*p_metrics)(JsonDocument&, bool),
                        void (*p_chart)(JsonDocument&, bool),
                        void (*p_summary)(JsonDocument&, bool),
                        void (*p_cleanup)());

// ======================================================
// CL_CT10_ControlManager
// ======================================================
class CL_CT10_ControlManager {
  public:
    static CL_CT10_ControlManager& instance();
    static bool begin();
    static void tick();

    static void setMode(bool p_profileMode);
    static bool setActiveUserProfile(uint16_t p_profileNo);

    static void applyManual(const ST_A20_ResolvedWind_t& p_wind);
    static void clearManual();

    static bool reloadAll();

    // ======================================================
    // [F-05] Pending reload (atomic CAS)
    // ======================================================
    static bool requestReload() {
        bool v_expected = false;
        return s_pendingReload.compare_exchange_strong(
            v_expected, true,
            std::memory_order_acq_rel,
            std::memory_order_acquire);
    }
    static bool consumePendingReload() {
        return s_pendingReload.exchange(false, std::memory_order_acq_rel);
    }

    // [I-1] pending reload 상태 조회
    static bool isReloadPending() {
        return s_pendingReload.load(std::memory_order_acquire);
    }

    // [B-N-1] 마지막 reloadAll 결과
    static bool isLastReloadOk() {
        return s_lastReloadOk.load(std::memory_order_acquire);
    }

    // [F-06] Motion.sim 재적용 위임
    void requestMotionSimApply() {
        _pendingMotionSimApply.store(true, std::memory_order_release);
        CL_D10_Logger::log(EN_L10_LOG_DEBUG,
                           "[CT10] MotionSim apply requested (deferred)");
    }

    // ======================================================
    // [A-2] 캡슐화 위임 메서드 (W10 async_tcp 전용)
    //  - s_stateMutex 경유 → 내부 M10/S10 mutex 순차 획득
    //  - CONTRACT_0200.md §5 락 순서 준수 (CT10 → M10/S10)
    // ======================================================
    bool feedPIR(bool p_detected);
    bool patchSimFromJson(const JsonDocument& p_doc);
    void exportSimJson(JsonDocument& p_doc);

    static inline void ackEvent() { instance().ackEventState(); }

  public:
    void begin(CL_P10_PWM& p_pwm);
    void setMotion(CL_M10_MotionLogic* p_motion);

    void exportStateJson_v02(JsonDocument& p_doc);
    void exportChartJson(JsonDocument& p_doc, bool p_diffOnly);
    void exportSummaryJson(JsonDocument& p_doc);
    void exportMetricsJson(JsonDocument& p_doc);

    void setProfileMode(bool p_profileMode);
    bool startUserProfileByNo(uint16_t p_profileNo);
    void stopUserProfile();

    void startOverrideFixed(float p_percent, uint32_t p_seconds, bool p_forever = false);
    void startOverridePreset(const char*                     p_presetCode,
                             const char*                     p_styleCode,
                             const ST_A20_SegmentOverride_t* p_override,
                             uint32_t                        p_seconds,
                             bool                            p_forever = false);
    void applyManualResolved(const ST_A20_ResolvedWind_t& p_wind, uint32_t p_seconds, bool p_forever = false);
    void stopOverride();

    void tickLoop();

    // Dirty 플래그
    void markDirty(const char* p_key);
    bool consumeDirtyState();
    bool consumeDirtyMetrics();
    bool consumeDirtyChart();
    bool consumeDirtySummary();

    // ======================================================
    // [Batch D-1] 배치 소비 (WS 스케줄러 전용)
    //  - 4개 dirty 플래그를 mutex 1회로 원자 소비
    //  - bit0=state, bit1=metrics, bit2=chart, bit3=summary
    // ======================================================
    uint8_t consumeAllDirty();

  public:
    // --------------------------------------------------
    // 런타임 상태 (public 멤버, 기존 호환성 유지)
    // --------------------------------------------------
    bool active         = false;
    bool useProfileMode = false;

    EN_CT10_run_source_t runSource = EN_CT10_RUN_NONE;

    int8_t curScheduleIndex = -1;
    int8_t curProfileIndex  = -1;

    ST_CT10_SegmentRuntime_t scheduleSegRt;
    ST_CT10_SegmentRuntime_t profileSegRt;

    ST_CT10_Override_t       overrideState;
    ST_CT10_AutoOffRuntime_t autoOffRt;

    CL_P10_PWM*         pwm    = nullptr;

    unsigned long lastTickMs        = 0;
    unsigned long lastMetricsPushMs = 0;

  private:
    // ======================================================
    // [Batch A-2] 내부 상태 캡슐화
    //  - 외부(async_tcp)는 feedPIR / patchSimFromJson / exportSimJson 위임 필수
    // ======================================================
    CL_M10_MotionLogic* motion = nullptr;
    CL_S10_Simulation   sim;

    // --------------------------------------------------
    // 내부 상수
    // --------------------------------------------------
    static constexpr uint32_t S_TICK_MIN_INTERVAL_MS     = 40UL;
    static constexpr uint32_t S_METRICS_PUSH_INTERVAL_MS = 1500UL;
    static constexpr uint32_t S_EVENT_HOLD_MS            = 3000UL;
    static constexpr uint32_t S_OVERRIDE_DEFAULT_SEC     = 1200UL;

    // [F-05] pending reload flag
    inline static std::atomic<bool> s_pendingReload{false};

    // [B-N-1] 마지막 reloadAll 결과
    inline static std::atomic<bool> s_lastReloadOk{true};

    // [F-06] pending motion.sim apply flag
    std::atomic<bool> _pendingMotionSimApply{false};

    // [B-1b] 상태 일관성 보호용 재귀 뮤텍스
    static SemaphoreHandle_t s_stateMutex;

  private:
    bool _dirtyState   = false;
    bool _dirtyMetrics = false;
    bool _dirtyChart   = false;
    bool _dirtySummary = false;

    ST_CT10_RunContext_t runCtx;

    // [A-2] offTime 재트리거 방지
    int16_t _persistOffTimeLastYday = -1;

    // [B-2] AutoOff 래치
    bool _autoOffLatched = false;

  private:
    uint32_t calcOverrideRemainSec() const;

    bool tickOverride();
    bool tickUserProfile();
    bool tickSchedule();

    bool tickSegmentSequence(bool                      p_repeat,
                             uint8_t                   p_repeatCount,
                             ST_A20_ScheduleSegment_t* p_segs,
                             uint8_t                   p_count,
                             ST_CT10_SegmentRuntime_t& p_rt);
    bool tickSegmentSequence(bool                         p_repeat,
                             uint8_t                      p_repeatCount,
                             ST_A20_UserProfileSegment_t* p_segs,
                             uint8_t                      p_count,
                             ST_CT10_SegmentRuntime_t&    p_rt);

    void applySegmentOn(const ST_A20_ScheduleSegment_t& p_seg);
    void applySegmentOn(const ST_A20_UserProfileSegment_t& p_seg);
    void applySegmentOff();

    void initAutoOffFromUserProfile(const ST_A20_UserProfileItem_t& p_up);
    void initAutoOffFromSchedule(const ST_A20_ScheduleItem_t& p_s);

    void ackEventState();
    void onAutoOffTriggered(EN_CT10_reason_t p_reason);
    bool checkAutoOff(EN_CT10_reason_t* p_reasonOrNull = nullptr);

    static float getCurrentTemperatureMock();
    static float getCurrentHumidityMock();

    int findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg, bool p_allowOverlap = true);

    bool shouldHoldEventState() const;
    bool isMotionBlocked(const ST_A20_Motion_t& p_motionCfg);
    void onMotionBlocked(EN_CT10_reason_t p_reason);

    void maybePushMetricsDirty();

    // [I-4] private 캡슐화
    void applyMotionSimConfigToSim();

    const char* findPresetNameByCode(const char* p_code) const;
    const char* findStyleNameByCode(const char* p_code) const;

    void updateRunCtxOnSegmentOn_Schedule(const ST_A20_ScheduleItem_t& p_s, const ST_A20_ScheduleSegment_t& p_seg);
    void updateRunCtxOnSegmentOn_Profile(const ST_A20_UserProfileItem_t& p_p, const ST_A20_UserProfileSegment_t& p_seg);
    void updateRunCtxOnSegmentOff();

  private:
    ST_CT10_Decision_t decideRunSource();
    void               applyDecision(const ST_CT10_Decision_t& p_d);

  private:
    CL_CT10_ControlManager() = default;
};
