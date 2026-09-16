P1-3 M10 MotionLogic mutex — 바로 진행

요청한 게 아니라 제가 헷갈리게 썼습니다. 파일은 이미 처음에 받았으니 바로 diff 드립니다. 아래 그대로 반영만 하시면 됩니다.

---

문제 요약

M10_MotionLogic_070.h의 상태(_pir, _state)에 mutex 없이 접근:

· feedPIR / notifyPIRDetected — HTTP (async_tcp)
· tick / isActive — CT10 tick (loopTask)
· toJson — HTTP (async_tcp)

→ async_tcp ↔ loopTask 데이터 레이스.

---

수정 diff — M10_MotionLogic_070.h 단일 파일

1) 상단 include 1줄 추가

```cpp
// BEFORE
#include <Arduino.h>
#include <ArduinoJson.h>
#include <string.h>

#include "A20_Const_070.h"
#include "D10_Logger_070.h"

// AFTER
#include <Arduino.h>
#include <ArduinoJson.h>
#include <string.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>

#include "A20_Const_070.h"
#include "D10_Logger_070.h"
#include "A25_Com_Utils_070.h"   // [P1-3] CL_A40_MutexGuard_Semaphore

```

2) 클래스 private 멤버 1개 추가

```cpp
  private:
	ST_M10_PIR_rt_t			 _pir;

	ST_M10_MotionState_t	 _state;
	T_M10_OnChangeCallback_t _onChange;

	// [P1-3] 상태 보호용 재귀 뮤텍스
	//  - async_tcp(feedPIR/toJson) ↔ loopTask(tick/isActive) race 방지
	//  - Lazy-init: CL_A40_MutexGuard_Semaphore가 최초 진입 시 생성
	//  - recursive: feedPIR → notifyPIRDetected 중첩
	inline static SemaphoreHandle_t s_stateMutex = nullptr;
```

3) 5개 함수 guard 삽입

3-1. feedPIR

```cpp
	void feedPIR(bool p_detected) {
		if (p_detected) {
			notifyPIRDetected();   // notifyPIRDetected가 guard 보유 → 재귀 OK
		}
	}
```

변경 없음 (notifyPIRDetected가 guard 담당).

3-2. notifyPIRDetected

```cpp
	void notifyPIRDetected() {
		// [P1-3]
		CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
		if (!v_guard.isAcquired()) return;

		if (!g_A20_config_root.motion || !g_A20_config_root.motion->pir.enabled)
			return;
		_pir.lastDetected_ms = millis();
		_pir.active			 = true;
	}
```

3-3. tick

```cpp
	void tick() {
		// [P1-3]
		CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
		if (!v_guard.isAcquired()) return;

		if (!g_A20_config_root.motion)
			return;
		const auto& v_cfg = *g_A20_config_root.motion;
		uint32_t	v_now = millis();

		// PIR timeout
		if (v_cfg.pir.enabled && _pir.active) {
			uint32_t v_pirElapsed = v_now - _pir.lastDetected_ms;
			if (v_pirElapsed > v_cfg.pir.holdSec * 1000UL) {
				_pir.active = false;
			}
		} else if (!v_cfg.pir.enabled) {
			_pir.active = false;
		}

		// 상태 변화 감지
		bool v_activeNew = (_pir.active);
		bool v_pirActive = _pir.active;

		if (v_activeNew != _state.active || v_pirActive != _state.pirActive) {
			_state.active		 = v_activeNew;
			_state.pirActive	 = v_pirActive;
			_state.lastChange_ms = v_now;

			CL_D10_Logger::log(EN_L10_LOG_DEBUG, "[M10] motionActive=%d (PIR=%d)", (int)_state.active, (int)_state.pirActive);

			if (_onChange) {
				_onChange(_state);
			}
		}
	}
```

3-4. toJson (const)

```cpp
	void toJson(JsonDocument& p_doc) const {
		// [P1-3] const 메서드에서 static mutex 접근 → 문제 없음
		CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
		if (!v_guard.isAcquired()) return;

		if (!g_A20_config_root.motion)
			return;
		const auto& v_cfg = *g_A20_config_root.motion;

		JsonObject v_o	 = p_doc["motion"].to<JsonObject>();
		v_o["active"]	 = isActive();
		v_o["pirActive"] = _state.pirActive;

		v_o["pirHold"]	 = v_cfg.pir.holdSec;

		unsigned long v_now		= millis();
		uint32_t	  v_lastSec = (_state.lastChange_ms == 0) ? 0 : (uint32_t)((v_now - _state.lastChange_ms) / 1000UL);
		v_o["lastActiveSec"]	= v_lastSec;

		uint32_t v_pirRemain = 0;
		if (v_cfg.pir.enabled && _pir.active) {
			uint32_t v_pirElapsed = v_now - _pir.lastDetected_ms;
			if (v_pirElapsed < v_cfg.pir.holdSec * 1000UL) {
				v_pirRemain = (v_cfg.pir.holdSec * 1000UL - v_pirElapsed) / 1000UL;
			}
		}
		v_o["pirHoldRemain"] = v_pirRemain;
	}
```

주의: toJson이 isActive() 호출 → 재귀 mutex 필수. CL_A40_MutexGuard_Semaphore가 이미 재귀라 안전.

3-5. isActive (const)

```cpp
	bool isActive() const {
		// [P1-3] 재귀 mutex (toJson에서 호출되는 경로 대응)
		CL_A40_MutexGuard_Semaphore v_guard(s_stateMutex, G_A40_MUTEX_TIMEOUT_100, __func__);
		if (!v_guard.isAcquired()) return false;

		unsigned long v_now	 = millis();
		uint16_t	  v_hold = 0;
		if (g_A20_config_root.motion) {
			v_hold = (uint16_t)g_A20_config_root.motion->pir.holdSec;
		}
		if (_state.pirActive)
			return true;
		if (v_hold > 0 && (v_now - _state.lastChange_ms) < (v_hold * 1000UL))
			return true;
		return false;
	}
```

3-6. setOnChangeCallback — 변경 없음

_onChange 포인터 대입은 원자적 (4B), 실질적 race 없음.

---

안전성 확인

항목 확인
재귀 필요 ✅ (toJson → isActive, feedPIR → notifyPIRDetected)
const 메서드에서 static mutex ✅ 정적 멤버는 인스턴스 무관, 참조 전달 정상
Lazy-init ✅ CL_A40_MutexGuard_Semaphore 내장 (portMUX double-check)
_onChange 콜백 안 mutex 재진입 ✅ recursive
CT10이 motion->isActive() 호출 ✅ CT10 mutex 보유 중 → M10 mutex 획득 (순서: CT10 → M10, 역순 없음)

데드락 없음: CT10 → M10 단방향.

---

검증 체크리스트

# 항목 기대
1 컴파일 에러 0
2 grep "CL_A40_MutexGuard_Semaphore" M10_MotionLogic_070.h 4건 (notifyPIRDetected/tick/toJson/isActive)
3 POST /api/v001/motion/pir/feed 중 GET /api/v001/state 정상 응답, 일관성
4 PIR 감지 → hold 시간 경과 정상 해제
5 부하 (PIR feed + 상태 폴링 5초) 크래시 없음
6 mutex timeout 로그 0건 (정상 동작)
7 _onChange 콜백 (등록 시) 재귀 호출 정상

---

적용 후

컴파일 결과 알려주시면 P1-3 완결 → 신규 리뷰 라운드 마무리.

남은 항목:

· P2-1 업로드 파일명 검증 (선택)
· P2-2 spectralPhaseAcc (선택)
· 관찰-1 (Gemini 스택 static 승격, 선택)
· WF10 async_tcp starvation (별도 설계)

어느 것 이어서 진행할지 알려주세요.