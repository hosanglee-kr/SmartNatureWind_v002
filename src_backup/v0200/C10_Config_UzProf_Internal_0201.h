#pragma once
/*
 * ------------------------------------------------------
 * 소스명 : C10_Config_UzProf_Internal_0201.h
 * 모듈 약어 : C10
 * 모듈명 : Smart Nature Wind Config Manager - UserProfiles (Internal)
 * ------------------------------------------------------
 * [E-2.6] C10_Config_UzProf_0201.cpp → 4파일 분할 시 internal helper 공유
 *  - 외부 모듈은 이 헤더 include 금지 (C10_Config_0201.h만 사용)
 * ------------------------------------------------------
 */

#include <Arduino.h>
#include <ArduinoJson.h>

#include "C10_Config_0201.h"
#include "A20_Const_0201.h"

// =====================================================
// [FIX] UzProf ID/NO 정책 매크로 (분할 파일 공유)
// =====================================================
#ifndef G_C10_PROFILE_ID_START
# define G_C10_PROFILE_ID_START 1
#endif
#ifndef G_C10_PROFILE_ID_STEP
# define G_C10_PROFILE_ID_STEP 1
#endif
#ifndef G_C10_PROFILE_SEG_ID_START
# define G_C10_PROFILE_SEG_ID_START 1
#endif
#ifndef G_C10_PROFILE_SEG_ID_STEP
# define G_C10_PROFILE_SEG_ID_STEP 1
#endif


// ------------------------------------------------------
// Helper declarations (C10_Config_UzProf_Util_0201.cpp 정의)
// ------------------------------------------------------
uint8_t  C10_nextProfileId_u8(const ST_A20_UserProfilesRoot_t& p_root);

bool C10_isProfileIdDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint8_t p_id, uint8_t p_excludeIndex);
bool C10_isProfileNoDuplicated(const ST_A20_UserProfilesRoot_t& p_root, uint16_t p_no, uint8_t p_excludeIndex);

bool C10_fromJson_UserProfileItem(const JsonObjectConst& p_jp,
                                  ST_A20_UserProfileItem_t& p_up,
                                  bool p_allowIdRead,
                                  bool p_forceProfileIdKeep,
                                  bool p_forceReissueSegId,
                                  const char* p_callerForLog);

bool C10_reissueProfileSegIdsAndValidateSegNos(ST_A20_UserProfileItem_t& p_up, const char* p_callerForLog);

bool C10_validateUserProfilesLoaded(const ST_A20_UserProfilesRoot_t& p_root, const char* p_callerForLog);
bool C10_validateUserProfilesBeforeSave(const ST_A20_UserProfilesRoot_t& p_cfg, const char* p_callerForLog);
