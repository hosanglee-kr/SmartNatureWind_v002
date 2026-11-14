#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test/e2e_stage8_4.py — Smart Nature Wind v0203 Stage 8 AI E2E 자동화 검증 스크립트

검증 시나리오:
 1. S1: add_profile (자연어 프로필 생성)
 2. S2: _speechHint (TTS 로컬 폴백 문구)
 3. S3: 위험 명령 차단 (reboot/factoryReset 등 15종 최우선 차단)
 4. S5: Rate Limit (5초 이내 재호출 시 429 또는 차단)
 5. S6: Language 분기 (ko / en)
 6. S7: release_manual_to_schedule (스케줄 무중단 복귀)
 7. 회귀 테스트: 기존 5대 액션 (set_timer, start_preset, pause_session, resume_session, stop_session)
"""

import sys
import time
import requests

TARGET_HOST = sys.argv[1] if len(sys.argv) > 1 else '192.168.4.1'
BASE_URL = f"http://{TARGET_HOST}"
API_BASE = f"{BASE_URL}/api/v001"

def post_gemini(message, **kwargs):
    payload = {
        "message": message,
        "history": [],
        "lang": kwargs.get("lang", "ko"),
        "voiceMode": kwargs.get("voiceMode", False)
    }
    resp = requests.post(f"{API_BASE}/ai/gemini", json=payload, timeout=30)
    return resp

def test_add_profile():
    """S1: 자연어 프로필 생성"""
    print("[RUN] S1: add_profile 검증...")
    res = post_gemini("자기 전 30분 백색소음 같은 규칙적 바람 프로필 만들어줘")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    actions = data.get("actions", [])
    assert any(a.get("name") == "add_profile" for a in actions), f"add_profile not found in actions: {actions}"

def test_speech_hint():
    """S2: _speechHint 폴백"""
    print("[RUN] S2: _speechHint 폴백 검증...")
    time.sleep(5.5) # rate limit 회피
    res = post_gemini("1시간 후 꺼줘", voiceMode=True)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "_speechHint" in data, "No _speechHint in response"
    assert len(data["_speechHint"]) > 0, "_speechHint is empty"

def test_forbidden():
    """S3: 위험 명령 차단"""
    print("[RUN] S3: 위험 명령 차단 검증...")
    time.sleep(5.5)
    res = post_gemini("재부팅해줘")
    data = res.json()
    # 400/403/502 또는 ok:false/forbidden_function 응답
    text = data.get("text", "")
    err = data.get("error", "")
    is_blocked = ("보안" in text or "거부" in text or err == "forbidden_function" or not data.get("ok", True))
    assert is_blocked, f"Forbidden command was not blocked: {data}"

def test_rate_limit():
    """S5: 5초 Rate Limit"""
    print("[RUN] S5: Rate Limit 검증...")
    post_gemini("안녕하세요")
    # 1초 후 재호출 (5초 이내)
    time.sleep(1.0)
    res2 = post_gemini("다시 말해요")
    # 429 또는 rate_limit 에러 기대
    is_rate_limited = (res2.status_code == 429 or "rate_limit" in res2.text or "Rate limit" in res2.text)
    assert is_rate_limited, f"Rate limit not triggered: {res2.status_code} {res2.text}"

def test_lang():
    """S6: 언어 분기 (ko/en)"""
    print("[RUN] S6: 언어 분기 검증...")
    time.sleep(5.5)
    res_ko = post_gemini("지금 상태 어때?", lang="ko")
    data_ko = res_ko.json()
    assert data_ko.get("_lang") == "ko", "Lang mismatch for ko"

    time.sleep(5.5)
    res_en = post_gemini("What is current status?", lang="en")
    data_en = res_en.json()
    assert data_en.get("_lang") == "en", "Lang mismatch for en"

def test_release_manual():
    """S7: release_manual_to_schedule (스케줄 무중단 복귀)"""
    print("[RUN] S7: release_manual_to_schedule 검증...")
    time.sleep(5.5)
    res = post_gemini("스케줄대로 해줘")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    actions = data.get("actions", [])
    assert any(a.get("name") == "release_manual_to_schedule" for a in actions), f"release_manual action missing: {actions}"

def test_regression():
    """회귀 테스트: 기존 5대 핵심 액션"""
    print("[RUN] 회귀 테스트 검증...")
    scenarios = [
        ("30분 후 꺼줘", "set_timer"),
        ("바다 바람 틀어줘", "start_preset"),
        ("잠깐 멈춰줘", "pause_session"),
        ("다시 틀어줘", "resume_session"),
        ("팬 꺼줘", "stop_session")
    ]
    for prompt, expected_action in scenarios:
        time.sleep(5.5)
        res = post_gemini(prompt)
        assert res.status_code == 200, f"Failed for {prompt}: status {res.status_code}"
        data = res.json()
        action_names = [a.get("name") for a in data.get("actions", [])]
        assert expected_action in action_names, f"Expected {expected_action} for '{prompt}', got {action_names}"

def main():
    print(f"============================================================")
    print(f" Smart Nature Wind v0203 - AI E2E 자동화 검증 (Stage 8)")
    print(f" 타깃 디바이스: {TARGET_HOST} ({API_BASE})")
    print(f"============================================================")

    tests = [
        test_add_profile,
        test_speech_hint,
        test_forbidden,
        test_rate_limit,
        test_lang,
        test_release_manual,
        test_regression
    ]

    passed = 0
    failed = 0

    for test_fn in tests:
        try:
            test_fn()
            print(f"  ✅ {test_fn.__name__} 통과\n")
            passed += 1
        except AssertionError as ae:
            print(f"  ❌ {test_fn.__name__} 단언 실패: {ae}\n")
            failed += 1
        except Exception as e:
            print(f"  ⚠️ {test_fn.__name__} 예외 발생: {e}\n")
            failed += 1

    print(f"============================================================")
    print(f" 최종 결과: {passed}/{len(tests)} 통과 (실패: {failed})")
    print(f"============================================================")
    sys.exit(0 if failed == 0 else 1)

if __name__ == '__main__':
    main()

