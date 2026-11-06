/*
 * ------------------------------------------------------
 * 소스명 : CT10_Ctl_AIPrompt_0203.cpp
 * 모듈약어 : CT10
 * 모듈명 : Smart Nature Wind AI System Prompt & Speech Hint Builder
 * ------------------------------------------------------
 * 기능 요약:
 *  - 25단어 이내 TTS 친화형 시스템 지시 프롬프트 생성 (CT10_AI::buildAIPromptStrict)
 *  - 도구 실행 후 로컬 음성 폴백 문구 생성 (CT10_AI::buildSpeechHint)
 *  - 30초 프롬프트 캐시 및 세션 해시 검증
 * ------------------------------------------------------
 * [구현 규칙]
 *  - ArduinoJson v7 단일 JsonDocument 규격 준수
 *  - memset + strlcpy 기반 안전 버퍼 관리
 *  - CL_D10_Logger 표준 로깅
 * ------------------------------------------------------
 */

#include "CT10_Ctl_0203.h"
#include "D10_Logger_0203.h"

namespace {
    // 프롬프트 캐시
    static String   s_cachedPrompt;
    static uint32_t s_cachedPromptMs    = 0;
    static uint32_t s_cachedSessionHash = 0;

    // 세션 상태 간이 해시 계산
    uint32_t computeSessionHash() {
        ST_CT10_SessionContext_t v_ctx = CL_CT10_ControlManager::getSessionSnapshot();
        uint32_t v_h = 2166136261u;
        v_h = (v_h ^ (uint32_t)v_ctx.type) * 16777619u;
        v_h = (v_h ^ (uint32_t)v_ctx.state) * 16777619u;
        v_h = (v_h ^ (uint32_t)v_ctx.payload.playlist.profileNo) * 16777619u;
        return v_h;
    }

    // 프리셋 코드 한글 변환
    const char* presetCodeToKorean(const char* p_code) {
        if (!p_code || !p_code[0]) return "바람";
        if (strcmp(p_code, "OCEAN") == 0)          return "바다 바람";
        if (strcmp(p_code, "VALLEY_BREEZE") == 0)  return "계곡 바람";
        if (strcmp(p_code, "FOREST_RUSTLE") == 0)  return "숲 바람";
        if (strcmp(p_code, "MOUNTAIN_GALE") == 0)  return "산들바람";
        if (strcmp(p_code, "SPRING_BREEZE") == 0)  return "봄바람";
        if (strcmp(p_code, "SUMMER_SQUALL") == 0)  return "소나기 바람";
        if (strcmp(p_code, "AUTUMN_CHILL") == 0)   return "가을바람";
        if (strcmp(p_code, "WINTER_BLIZZARD") == 0)return "겨울바람";
        if (strcmp(p_code, "LAKE_RIPPLE") == 0)    return "호숫가 바람";
        if (strcmp(p_code, "DESERT_NIGHT") == 0)   return "사막 밤바람";
        return p_code;
    }
}

namespace CT10_AI {

    // [1] S4/S6: 강화 시스템 프롬프트 빌더
    String buildAIPromptStrict(const char* p_lang, bool p_voiceMode) {
        uint32_t v_now  = millis();
        uint32_t v_hash = computeSessionHash();

        if (s_cachedPrompt.length() > 0 &&
            (v_now - s_cachedPromptMs < 30000UL) &&
            (v_hash == s_cachedSessionHash)) {
            return s_cachedPrompt;
        }

        String v_p;
        v_p.reserve(1024);

        v_p += "You are 'Wind', the AI controller for Smart Nature Wind fan.\n";
        v_p += "Use provided function calls to control the fan.\n\n";

        v_p += "[STRICT CONSTRAINTS]\n";
        v_p += "- Keep response UNDER 25 WORDS. Concise, polite, natural for TTS.\n";
        v_p += "- NEVER mention code, JSON keys, function names, or hardware internals.\n";
        v_p += "- NEVER execute reboot, factory reset, OTA or firmware update.\n";

        if (p_lang && strcmp(p_lang, "en") == 0) {
            v_p += "- Respond in ENGLISH ONLY.\n";
        } else {
            v_p += "- 반드시 한국어로만 답변하세요.\n";
        }

        if (p_voiceMode) {
            v_p += "- Voice interaction mode: Reply in ONE short sentence under 15 words.\n";
        }

        // 현재 세션 상태 주입
        ST_CT10_SessionContext_t v_session = CL_CT10_ControlManager::getSessionSnapshot();
        v_p += "\n[CURRENT FAN STATE]\n";
        if (v_session.type == EN_CT10_SESSION_NONE || v_session.state == EN_SESSION_COMPLETED) {
            v_p += "Fan is currently STOPPED/IDLE.\n";
        } else {
            v_p += "Fan is RUNNING. State: ";
            v_p += (v_session.state == EN_SESSION_PAUSED) ? "PAUSED" : "ACTIVE";
            if (v_session.type == EN_CT10_SESSION_FIXED) {
                v_p += ", Mode: Fixed PWM (";
                v_p += String((int)v_session.payload.fixed.percent);
                v_p += "%).\n";
            } else if (v_session.type == EN_CT10_SESSION_PRESET) {
                v_p += ", Preset: ";
                v_p += v_session.payload.preset.presetCode;
                v_p += " / Style: ";
                v_p += v_session.payload.preset.styleCode;
                v_p += ".\n";
            } else if (v_session.type == EN_CT10_SESSION_PLAYLIST) {
                v_p += ", Profile: ";
                v_p += v_session.payload.playlist.profileName;
                v_p += " (Step ";
                v_p += String(v_session.payload.playlist.currentStepIdx + 1);
                v_p += "/";
                v_p += String(v_session.payload.playlist.totalSteps);
                v_p += ").\n";
            }
            if (v_session.runtimeAutoOffMin > 0) {
                uint32_t v_rem = CL_CT10_ControlManager::getSessionAutoOffRemainSec();
                v_p += "Auto-off timer active: ";
                v_p += String(v_rem / 60);
                v_p += " minutes remaining.\n";
            }
        }

        v_p += "\n[MAPPING RULES]\n";
        v_p += "- '꺼줘'/'멈춰' -> stop_session\n";
        v_p += "- '잠깐 멈춰'/'일시정지' -> pause_session\n";
        v_p += "- '다시 켜'/'계속해' -> resume_session\n";
        v_p += "- 'N단'/'N%로 틀어' -> start_fixed\n";
        v_p += "- '바다바람'/'자연풍' -> start_preset\n";
        v_p += "- 'N분 뒤 꺼줘' -> set_timer\n";
        v_p += "- '스케줄대로 해' -> release_manual_to_schedule\n";
        v_p += "- '프로필 만들어줘' -> add_profile\n";

        s_cachedPrompt      = v_p;
        s_cachedPromptMs    = v_now;
        s_cachedSessionHash = v_hash;

        return s_cachedPrompt;
    }

    // [2] S2: 로컬 음성 폴백 힌트 (2-turn 실패 시 백엔드가 음성 문구 생성)
    String buildSpeechHint(const char* p_fn, JsonObjectConst p_args, bool p_ok) {
        if (!p_ok) {
            return "명령을 실행하지 못했습니다.";
        }
        if (!p_fn) return "완료했습니다.";

        if (strcmp(p_fn, "stop_session") == 0) {
            return "선풍기를 껐습니다.";
        }
        if (strcmp(p_fn, "pause_session") == 0) {
            return "선풍기를 일시 정지했습니다.";
        }
        if (strcmp(p_fn, "resume_session") == 0) {
            return "선풍기를 다시 가동합니다.";
        }
        if (strcmp(p_fn, "set_timer") == 0) {
            int v_m = p_args["minutes"] | 0;
            if (v_m > 0) {
                return String(v_m) + "분 후에 자동으로 꺼드릴게요.";
            }
            return "자동 꺼짐 타이머를 설정했습니다.";
        }
        if (strcmp(p_fn, "start_fixed") == 0) {
            int v_pct = p_args["percent"] | 50;
            const char* v_stage = (v_pct <= 20) ? "1단" :
                                  (v_pct <= 40) ? "2단" :
                                  (v_pct <= 60) ? "3단" :
                                  (v_pct <= 80) ? "4단" : "5단";
            return String(v_stage) + " 바람으로 가동합니다.";
        }
        if (strcmp(p_fn, "start_preset") == 0) {
            const char* v_preset = p_args["presetCode"] | "";
            return String(presetCodeToKorean(v_preset)) + "을 틀어드릴게요.";
        }
        if (strcmp(p_fn, "start_playlist") == 0) {
            const char* v_name = p_args["profileName"] | "바람 프로필";
            return String(v_name) + "을 재생합니다.";
        }
        if (strcmp(p_fn, "add_profile") == 0) {
            const char* v_name = p_args["name"] | "새 프로필";
            return String(v_name) + " 프로필을 만들었습니다.";
        }
        if (strcmp(p_fn, "add_schedule") == 0) {
            return "스케줄을 등록했습니다.";
        }
        if (strcmp(p_fn, "release_manual_to_schedule") == 0) {
            return "스케줄 자동 실행으로 돌아갑니다.";
        }
        if (strcmp(p_fn, "get_status") == 0) {
            return "현재 상태를 확인했습니다.";
        }
        if (strcmp(p_fn, "list_profiles") == 0) {
            return "프로필 목록입니다.";
        }
        return "명령을 완료했습니다.";
    }
}

