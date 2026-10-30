#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_070.h
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Configuration Manager
 * ------------------------------------------------------
* 기능 요약:
*  - Smart Nature Wind 전체 설정(JSON 기반) 관리 매니저
*  - 설정 파일 단위 분리 관리 (system / wifi / motion / schedules / userProfiles / windDict / nvsSpec / webPage)
*  - 구조체 ↔ JSON 직렬화 및 역직렬화 (ArduinoJson v7 전용)
*  - 파일 백업(.bak) / 복구 / 공장초기화(factoryResetFromDefault) 지원
*  - PATCH 기반 부분 업데이트(patchConfigFromJson) 지원
*  - Lazy-Load 하이브리드 구성 (필요 섹션만 동적 로드)
*  - Wi-Fi 등 재초기화 판단 로직 확장 가능
*
* [Policy] 주요 운영 정책 요약
*  - g_A20_config_root 원자 접근:
*    * getRootSnapshot()으로 8개 포인터를 portMUX critical section에서 캡처
*    * reloadAll의 swap과 상호 배타 (s_rootSwapMux)
*  - 지연 free (E-1):
*    * reloadAll은 즉시 freeAll 대신 queuePendingFree()로 큐 등록
*    * processPendingFree()가 grace(3초) 경과 후 실제 free
*    * W10 GET이 v_snap 캡처 후 toJson 실행 사이의 UAF 방지
*    * 큐 슬롯: 2개 (연속 reload 대비), oldest 즉시 free fallback
*  - Mutex:
*    * s_recursiveMutex: 모든 load/save/free/patch 경로 보호
*    * 재귀 mutex (setXxx→begin, freeAll 재진입 등)
*  - Dirty Flag:
*    * s_dirtyflagSpinlock (portMUX) 기반 원자 read/clear
*    * saveDirtyConfigs()가 dirty 섹션만 저장

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

#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "A20_Const_070.h"  // ST_A20_ConfigRoot_t, ST_A20_* 구조체, 상수 정의
#include "D10_Logger_070.h" // CL_D10_Logger, EN_L10_LOG_*

// ------------------------------------------------------
// [C10] NoOverlap 검증 정책 플래그
//  - FAIL_ON_OVERLAP : 겹치면 실패 반환(save 중단)
//  - WARN_ONLY       : 겹쳐도 계속 진행(로그만)
//  - SKIP_DISABLED   : disabled schedule은 검사 제외(기본 on 권장)
// ------------------------------------------------------
typedef enum : uint8_t {
    EN_C10_OVL_FAIL_ON_OVERLAP = 0,
    EN_C10_OVL_WARN_ONLY       = 1,
    EN_C10_OVL_SKIP_DISABLED   = 2,
} EN_C10_NoOverlapPolicy_t;

// ------------------------------------------------------
// [C10] 검증 결과 (운영 점검/로그용)
// ------------------------------------------------------
typedef struct {
    bool     ok;           // FAIL 정책이면 overlap 발견 시 false
    uint16_t overlapCount; // 발견된 overlap 개수(대략)
    uint16_t checkedCount; // 검사한 schedule count
} ST_C10_NoOverlapResult_t;

// 전역 Config Root (Core cpp에서 정의)
extern ST_A20_ConfigRoot_t g_A20_config_root;

// ------------------------------------------------------
// C10 Config Manager Class
// ------------------------------------------------------
class CL_C10_ConfigManager {
  public:
    static bool begin();

    // =====================================================
    // 1. 전체 관리 (Load/Free/Save)
    // =====================================================
    static const ST_A20_cfg_jsonFile_t& getCfgJsonFileMap() { return s_cfgJsonFileMap; }

    static bool loadAll(ST_A20_ConfigRoot_t& p_root);
    static bool freeLazySection(const char* p_section, ST_A20_ConfigRoot_t& p_root);
    static void freeAll(ST_A20_ConfigRoot_t& p_root);
    
    // [E-1] 지연 free (W10 reader UAF 방지)
    //  - reloadAll의 즉시 free 대신 큐에 등록
    //  - processPendingFree()가 grace(3초) 경과 후 실제 free
    //  - 대상: W10 GET이 v_snap 캡처 후 toJson 실행 중 reloadAll로 인한 dangling
    //  - 부팅 복원 없으므로 재부팅 시 잔존 큐 소실 (leak 무해)
    // --------------------------------------------------
    static void queuePendingFree(const ST_A20_ConfigRoot_t& p_old);
    static void processPendingFree();
    

    static bool factoryResetFromDefault();

    // =====================================================
    // 2. 목적물별 Load/Save
    // =====================================================
    static bool loadSystemConfig(ST_A20_SystemConfig_t& p_cfg);
    static bool loadWifiConfig(ST_A20_WifiConfig_t& p_cfg);
    static bool loadMotionConfig(ST_A20_MotionConfig_t& p_cfg);

    static bool loadSchedules(ST_A20_SchedulesRoot_t& p_cfg);
    static bool loadUserProfiles(ST_A20_UserProfilesRoot_t& p_cfg);
    static bool loadWindDict(ST_A20_WindDict_t& p_cfg);

    static bool loadNvsSpecConfig(ST_A20_NvsSpecConfig_t& p_cfg);
    static bool loadWebPageConfig(ST_A20_WebPageConfig_t& p_cfg);

    static bool saveSystemConfig(const ST_A20_SystemConfig_t& p_cfg);
    static bool saveWifiConfig(const ST_A20_WifiConfig_t& p_cfg);
    static bool saveMotionConfig(const ST_A20_MotionConfig_t& p_cfg);

    static bool saveSchedules(const ST_A20_SchedulesRoot_t& p_cfg, bool p_failOnOverlap = false);
    static bool saveUserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg);
    static bool saveWindDict(const ST_A20_WindDict_t& p_cfg);

    static bool saveNvsSpecConfig(const ST_A20_NvsSpecConfig_t& p_cfg);
    static bool saveWebPageConfig(const ST_A20_WebPageConfig_t& p_cfg);

    static bool saveDirtyConfigs();
    static void getDirtyStatus(JsonDocument& p_doc);
    static bool saveAll(const ST_A20_ConfigRoot_t& p_root);

    // =====================================================
    // 3. JSON Export
    // =====================================================
    static void toJson_All(const ST_A20_ConfigRoot_t& p,
                           JsonDocument&              p_doc,
                           bool                       p_includeSystem       = true,
                           bool                       p_includeWifi         = true,
                           bool                       p_includeMotion       = true,
                           bool                       p_includeNvsSpec      = true,
                           bool                       p_includeSchedules    = true,
                           bool                       p_includeUserProfiles = true,
                           bool                       p_includeWindDict     = true,
                           bool                       p_includeWebPage      = true);

    static void toJson_System(const ST_A20_SystemConfig_t& p_cfg, JsonDocument& p_doc);
    static void toJson_Wifi(const ST_A20_WifiConfig_t& p_cfg, JsonDocument& p_doc);
    static void toJson_Motion(const ST_A20_MotionConfig_t& p_cfg, JsonDocument& p_doc);

    static void toJson_Schedules(const ST_A20_SchedulesRoot_t& p_cfg, JsonDocument& p_doc);
    static void toJson_UserProfiles(const ST_A20_UserProfilesRoot_t& p_cfg, JsonDocument& p_doc);
    static void toJson_WindDict(const ST_A20_WindDict_t& p_cfg, JsonDocument& p_doc);

    static void toJson_NvsSpec(const ST_A20_NvsSpecConfig_t& p_cfg, JsonDocument& p_doc);
    static void toJson_WebPage(const ST_A20_WebPageConfig_t& p_cfg, JsonDocument& p_doc);

    // =====================================================
    // 4. JSON Patch (System/Wifi/Motion/Schedules/UserProfiles/WindDict/NvsSpec/WebPage)
    // =====================================================
    static bool patchSystemFromJson(ST_A20_SystemConfig_t& p_config, const JsonDocument& p_patch);
    static bool patchWifiFromJson(ST_A20_WifiConfig_t& p_config, const JsonDocument& p_patch);
    static bool patchMotionFromJson(ST_A20_MotionConfig_t& p_config, const JsonDocument& p_patch);

    static bool patchSchedulesFromJson(ST_A20_SchedulesRoot_t& p_cfg, const JsonDocument& p_patch);
    static bool patchUserProfilesFromJson(ST_A20_UserProfilesRoot_t& p_cfg, const JsonDocument& p_patch);
    static bool patchWindDictFromJson(ST_A20_WindDict_t& p_cfg, const JsonDocument& p_patch);

    static bool patchNvsSpecFromJson(ST_A20_NvsSpecConfig_t& p_cfg, const JsonDocument& p_patch);
    static bool patchWebPageFromJson(ST_A20_WebPageConfig_t& p_cfg, const JsonDocument& p_patch);

    // =====================================================
    // 5. CRUD - Schedules, UserProfiles, windDict
    //    (전역 g_A20_config_root를 대상으로 동작)
    // =====================================================
    static int  addScheduleFromJson(const JsonDocument& p_doc);
    static bool updateScheduleFromJson(uint16_t p_id, const JsonDocument& p_patch);
    static bool deleteSchedule(uint16_t p_id);

    static int  addUserProfilesFromJson(const JsonDocument& p_doc);
    static bool updateUserProfilesFromJson(uint16_t p_id, const JsonDocument& p_patch);
    static bool deleteUserProfiles(uint16_t p_id);

    static int  addWindProfileFromJson(const JsonDocument& p_doc);
    static bool updateWindProfileFromJson(uint16_t p_id, const JsonDocument& p_patch);
    static bool deleteWindProfile(uint16_t p_id);
    
    // [A-mid] g_A20_config_root 원자 스냅샷
    //  - 8개 포인터를 portMUX critical section으로 원자 캡처
    //  - reloadAll의 swap과 상호 배타
    //  - W10 read 경로에서 사용 (dangling은 별도)
    static void getRootSnapshot(ST_A20_ConfigRoot_t& p_out);
    static portMUX_TYPE s_rootSwapMux;

  private:
    // Dirty Flag
    static bool _dirty_system;
    static bool _dirty_wifi;
    static bool _dirty_motion;
    static bool _dirty_schedules;
    static bool _dirty_userProfiles;
    static bool _dirty_windDict;
    static bool _dirty_nvsSpec;
    static bool _dirty_webPage;

    // Dirty 보호용 mux (클래스 소유)
    static portMUX_TYPE s_dirtyflagSpinlock; // 	s_dirtyMux --> s_dirtyflagSpinlock

    // Mutex
    static SemaphoreHandle_t s_recursiveMutex; // s_configMutex_v2 --> s_recursiveMutex

    // cfg_jsonFile.json 매핑
    static ST_A20_cfg_jsonFile_t s_cfgJsonFileMap;
    
    // [E-1] pending free 큐 (2슬롯, 연속 reload 대비)
    static constexpr uint8_t  PENDING_FREE_SLOTS    = 2;
    static constexpr uint32_t PENDING_FREE_GRACE_MS = 3000;   // 3초 유예
    static ST_A20_ConfigRoot_t s_pendingFree[PENDING_FREE_SLOTS];
    static uint32_t            s_pendingFreeMs[PENDING_FREE_SLOTS];
    static uint8_t             s_pendingFreeCount;
    
    // [F-1] pending 큐 보호용 portMUX (recursive mutex 실패 시 leak 방지)
    //  - freeAll은 critical section 밖에서 실행 (오래 걸림)
    //  - 8-byte 포인터 배열 + 카운터 + timestamp만 critical 보호
    static portMUX_TYPE s_pendingFreeMux;

    // cfg_jsonFile.json 로더
    static bool _loadCfgJsonFile();
};
