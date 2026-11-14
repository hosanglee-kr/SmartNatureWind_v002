#!/usr/bin/env python3
"""
Phase 2 회귀 자동화 — T-158 ~ T-168
사용: python test/e2e_phase2.py <DEVICE_IP>
"""
import sys
import time
import json
import urllib.request
import urllib.error

IP = sys.argv[1] if len(sys.argv) > 1 else '192.168.4.1'
BASE = f'http://{IP}/api/v001'
PASS = 0
FAIL = 0


def req(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode('utf-8') if body is not None else None
    headers = {'Content-Type': 'application/json'} if data is not None else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=5) as resp:
        raw = resp.read().decode('utf-8')
        return resp.status, json.loads(raw) if raw else {}


def check(name, cond, detail=''):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f'[PASS] {name}')
    else:
        FAIL += 1
        print(f'[FAIL] {name} {detail}')


def get_state():
    _, st = req('GET', '/state')
    return st


def test_t158_pir_pause_resume():
    """T-158: ENV_PAUSED 진입/해제 (PIR)"""
    req('POST', '/session/start', {
        'type': 'PRESET',
        'payload': {
            'presetCode': 'OCEAN',
            'rule': {'pirPause': {'enabled': True, 'holdSec': 5}}
        }
    })
    time.sleep(6)
    st = get_state()
    ctrl = st.get('control', {})
    check('T-158a ENV_PAUSED 진입', ctrl.get('stateCode') == 7 and ctrl.get('pauseReason') == 1, ctrl)

    req('POST', '/motion/pir/feed', {'pir': True})
    time.sleep(2)
    st2 = get_state()
    check('T-158b PIR 재실 자동 재개', st2.get('control', {}).get('stateCode') != 7, st2.get('control'))
    req('POST', '/session/stop', {})


def test_t159_t162_env_placeholders():
    """T-159~T-162: TempLow/DiLow PAUSE/STOP (센서/모의 환경 확인)"""
    st = get_state()
    ctrl = st.get('control', {})
    has_trigger_rt = 'triggerRt' in ctrl
    check('T-159~T-162 triggerRt 필드 노출', has_trigger_rt, list(ctrl.keys()))


def test_t163_auto_full():
    """T-163: AUTO_FULL 세션 시작 및 trigger 강제 매핑"""
    req('POST', '/session/start', {'type': 'AUTO_FULL', 'payload': {}})
    time.sleep(1)
    sess = get_state().get('control', {}).get('session', {})
    check('T-163 AUTO_FULL type=4, trigger=4', sess.get('type') == 4 and sess.get('trigger') == 4, sess)
    req('POST', '/session/stop', {})


def test_t164_auto_select_preset():
    """T-164: AUTO_SELECT (PRESET base)"""
    req('POST', '/session/start', {
        'type': 'AUTO_SELECT',
        'payload': {'baseType': 'PRESET', 'presetCode': 'OCEAN'}
    })
    time.sleep(1)
    ctrl = get_state().get('control', {})
    sess = ctrl.get('session', {})
    ovr = ctrl.get('override', {})
    check('T-164 AUTO_SELECT PRESET', sess.get('type') == 5 and ovr.get('presetCode') == 'OCEAN', ctrl)
    req('POST', '/session/stop', {})


def test_t165_auto_select_playlist():
    """T-165: AUTO_SELECT (PLAYLIST base)"""
    req('POST', '/session/start', {
        'type': 'AUTO_SELECT',
        'payload': {'baseType': 'PLAYLIST', 'profileId': 1}
    })
    time.sleep(1)
    sess = get_state().get('control', {}).get('session', {})
    check('T-165 AUTO_SELECT PLAYLIST', sess.get('type') == 5, sess)
    req('POST', '/session/stop', {})


def test_t166_auto_manual_override():
    """T-166: AUTO 중 사용자 수동 개입 -> trigger=MANUAL(1)"""
    req('POST', '/session/start', {'type': 'AUTO_FULL', 'payload': {}})
    time.sleep(1)
    req('POST', '/control/override/fixed?percent=60')
    time.sleep(1)
    sess = get_state().get('control', {}).get('session', {})
    check('T-166 AUTO 중 수동 개입', sess.get('trigger') == 1 and sess.get('type') == 3, sess)
    req('POST', '/session/stop', {})


def test_t167_pir_grace_and_resume_bypass():
    """T-167: PIR 시작 직후 유예 & 수동 재개 1시간 유예"""
    req('POST', '/session/start', {
        'type': 'PRESET',
        'payload': {
            'presetCode': 'OCEAN',
            'rule': {'pirPause': {'enabled': True, 'holdSec': 10}}
        }
    })
    time.sleep(2)
    ctrl1 = get_state().get('control', {})
    check('T-167a 시작 직후 유예(stateCode!=7)', ctrl1.get('stateCode') != 7, ctrl1)
    time.sleep(10)
    req('POST', '/session/resume', {})
    time.sleep(1)
    ctrl2 = get_state().get('control', {})
    check('T-167b 수동 재개 유예(stateCode!=7)', ctrl2.get('stateCode') != 7, ctrl2)
    req('POST', '/session/stop', {})


def test_t168_patch_session_rule():
    """T-168: PATCH /api/v001/session/rule 실시간 규칙 갱신"""
    req('POST', '/session/start', {
        'type': 'PRESET',
        'payload': {
            'presetCode': 'OCEAN',
            'rule': {'timer': {'enabled': True, 'minutes': 60}}
        }
    })
    time.sleep(1)
    rt1 = get_state().get('control', {}).get('triggerRt', {})
    t_start = rt1.get('timerStartMs')
    code, _ = req('PATCH', '/session/rule', {
        'timer': {'enabled': True, 'minutes': 120}
    })
    time.sleep(1)
    rt2 = get_state().get('control', {}).get('triggerRt', {})
    check('T-168 PATCH /session/rule', code == 200 and rt2.get('timerStartMs') == t_start and rt2.get('timerMinutes') == 120, rt2)
    req('POST', '/session/stop', {})


def main():
    print(f'=== Phase 2 E2E Regression ({IP}) ===')
    for fn in [
        test_t158_pir_pause_resume,
        test_t159_t162_env_placeholders,
        test_t163_auto_full,
        test_t164_auto_select_preset,
        test_t165_auto_select_playlist,
        test_t166_auto_manual_override,
        test_t167_pir_grace_and_resume_bypass,
        test_t168_patch_session_rule,
    ]:
        try:
            fn()
        except Exception as e:
            global FAIL
            FAIL += 1
            print(f'[ERROR] {fn.__name__}: {e}')
    print(f'=== Result: PASS={PASS}, FAIL={FAIL} ===')
    sys.exit(0 if FAIL == 0 else 1)


if __name__ == '__main__':
    main()

