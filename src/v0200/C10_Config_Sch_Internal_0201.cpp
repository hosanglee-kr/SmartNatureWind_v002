#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_Sch_Internal_0201.h
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - Schedule (Internal)
 * ------------------------------------------------------
 * [E-2.3] C10_Config_Sch_0201.cpp → 5파일 분할 시 internal helper 공유
 *  - Util_0201.cpp에서 정의, LoadSave/CRUD/JSON_0201.cpp에서 참조
 *  - 외부 모듈은 이 헤더 include 금지 (C10_Config_0201.h만 사용)
 *  - Dead code 제거: C10_nextSegId_u8, C10_isSegIdDuplicatedInSchedule,
 *                    C10_isSegNoDuplicatedInSchedule, C10_nextSegNo_u16_byStep
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>

#include "C10_Config_0201.h"    // ST_A20_ScheduleItem_t 등 (A20_Const_0201.h 경유)
#include "A20_Const_0201.h"

// ------------------------------------------------------
// Helper declarations (defined in C10_Config_Sch_Util_0201.cpp)
// ------------------------------------------------------
uint8_t C10_nextScheduleId_u8(const ST_A20_SchedulesRoot_t& p_root);

bool C10_isSchIdDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint8_t p_schId, uint8_t p_excludeIndex);
bool C10_isSchNoDuplicated(const ST_A20_SchedulesRoot_t& p_root, uint16_t p_schNo, uint8_t p_excludeIndex);

// JSON → struct decode (LoadSave / patch / add / update 공통)
bool C10_fromJson_ScheduleItem(const JsonObjectConst& p_js,
                               ST_A20_ScheduleItem_t& p_s,
                               bool                   p_allowIdRead,
                               bool                   p_forceSchIdKeep,
                               bool                   p_forceReissueSegId,
                               const char*            p_callerForLog);

// segId 재발급 + segNo 필수/중복 검증
bool C10_reissueSegIdsAndValidateSegNos(ST_A20_ScheduleItem_t& p_s, const char* p_callerForLog);

// File Load 검증 (schId/schNo/segId/segNo 필수/0금지/중복/범위)
bool C10_validateSchedulesLoaded(const ST_A20_SchedulesRoot_t& p_root, const char* p_callerForLog);

// Save 직전 최종 검증 (C10_validateSchedulesLoaded 위임)
bool C10_validateSchedulesBeforeSave(const ST_A20_SchedulesRoot_t& p_cfg, const char* p_callerForLog);

// cross-midnight 분해 요일별 시간 구간 겹침 검증
bool C10_validateNoOverlapByDay(const ST_A20_SchedulesRoot_t& p_root,
                                bool                          p_failOnOverlap,
                                const char*                   p_callerFunc);

// schNo desc 정렬 (tie: schId desc)
void C10_sortSchedulesBySchNoDesc(ST_A20_SchedulesRoot_t& p_root);
