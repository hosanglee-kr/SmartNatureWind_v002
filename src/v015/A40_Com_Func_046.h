 // 소스명 : A40_Com_Func_046.h

#pragma once

#include <Arduino.h>
#include <string.h>
#include <strings.h>

#include <FS.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include <memory>

#include "A20_Const_Const_044.h"
#include "D10_Logger_040.h"

// ======================================================
// 1) 공용 헬퍼
// ======================================================


namespace A40_ComFunc {

	// 입력된 값이 특정 범위(최솟값과 최댓값)를 벗어나지 않도록 제한
	template <typename T>
	inline constexpr T clampVal(T p_value, T p_lowValue, T p_highValue) {
		return (p_value < p_lowValue) ? p_lowValue : (p_value > p_highValue) ? p_highValue : p_value;
	}


	/**
     * @brief 안전한 문자열 복사 함수 (Null 및 Overflow 방지)
     * @param p_dst 복사될 목적지 버퍼
     * @param p_src 원본 문자열
     * @param p_n 목적지 버퍼의 전체 크기 (sizeof(dst))
     * @return size_t 복사하려 했던 원본 문자열의 길이
     */

	// strlcpy
	inline size_t copyStr2Buffer_safe(char* p_dst, const char* p_src, size_t p_n) {
		// 1. 목적지가 유효하지 않으면 0 반환
		if (!p_dst || p_n == 0) return 0;

		// 2. 원본이 유효하지 않으면 목적지를 빈 문자열로 만들고 0 반환
		if (!p_src) {
			p_dst[0] = '\0';
			return 0;
		}

		// 3. 실제 복사 수행 후 원본 길이 반환
		return strlcpy(p_dst, p_src, p_n);
	}


	/**
	 * @brief 공유 가능한 안전한 C-String 복사본을 생성합니다. (AsyncWebServer 람다 캡처 전용)
	 * * @details
	 * 1. 일반적인 `unique_ptr`은 복사가 불가능하여 웹 서버의 람다(Lambda) 캡처 시 소유권 이전 문제(Move)가 발생합니다.
	 * 2. 이 함수는 `shared_ptr`을 반환하여, 등록된 웹 라우트 핸들러가 메모리를 안전하게 공유하게 합니다.
	 * 3. 참조 카운팅(Reference Counting) 방식을 통해, 해당 문자열을 사용하는 모든 라우트가 파괴될 때 메모리가 자동 해제됩니다.
	 * 4. `delete[]`를 수동으로 호출할 필요가 없어 메모리 누수(Memory Leak)를 원천 차단합니다.
	 * * @param p_src 복사할 원본 문자열 포인터
	 * @return std::shared_ptr<char[]> 관리되는 문자열 (할당 실패 시 nullptr)
	 */
	// makeSharedStr
	inline std::shared_ptr<char[]> cloneStr2SharedStr_safe(const char* p_src) {
		// 1. 원본 문자열 유효성 검사
		if (!p_src) {
			CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40] cloneStr2SharedStr_safe: Input p_src is null");
			return nullptr;
		}

		// 2. 널 종료 문자(\0)를 포함한 필요한 길이 계산
		size_t v_len = strlen(p_src) + 1;

		// 3. 배열 형태의 shared_ptr 할당 (C++17 표준 지원)
		// std::nothrow를 사용하여 메모리 부족 시 예외 대신 nullptr을 반환하도록 유도
		std::shared_ptr<char[]> v_buf(new (std::nothrow) char[v_len]);

		if (v_buf) {
			// 4. 안전한 문자열 복사 (마지막 바이트 \0 보장)
			strlcpy(v_buf.get(), p_src, v_len);
		} else {
			// 5. 메모리 할당 실패 로깅 (디버깅 시 결정적 단서 제공)
			CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40] cloneStr2SharedStr_safe: Heap allocation failed! (Required: %u bytes)", v_len);
		}

		return v_buf;
	}

	inline float getRandom01() {
		//return (float)esp_random() / (float)UINT32_MAX;
		return static_cast<float>(esp_random()) / (static_cast<float>(UINT32_MAX) + 1.0f);
	}

	inline float getRandomRange(float p_min, float p_max) {
		if (p_min >= p_max) return p_min;
        return p_min + (getRandom01() * (p_max - p_min));
		//return p_min + (A40_ComFunc::getRandom01() * (p_max - p_min));
	}
}

// // ------------------------------------------------------



/**
 * @brief FreeRTOS Recursive Mutex 전용 가드 (자동 지연 초기화 포함)
 * @details
 * 1. 생성자에서 뮤텍스가 nullptr인 경우 자동으로 생성합니다.
 * 2. Spinlock을 사용하여 초기화 과정의 Race Condition을 방지합니다.
 * 지연 초기화 및 명시적 acquire/unlock 기능을 제공합니다.
 */

class CL_A40_MutexGuard_Semaphore {
	public:
		/**
		 * @param p_mutex 원본 SemaphoreHandle_t의 참조 (외부 static 변수 등)
		 * @param p_timeout 락 획득 대기 시간
		 */
		CL_A40_MutexGuard_Semaphore(SemaphoreHandle_t& p_mutex, TickType_t p_timeout = pdMS_TO_TICKS(100))
			: _mutexPtr(&p_mutex) {

			// 1. 뮤텍스 지연 초기화 (Race Condition 방지)
			if (*_mutexPtr == nullptr) {
				static portMUX_TYPE v_initMux = portMUX_INITIALIZER_UNLOCKED;
				portENTER_CRITICAL(&v_initMux);
				if (*_mutexPtr == nullptr) {
					*_mutexPtr = xSemaphoreCreateRecursiveMutex();
				}
				portEXIT_CRITICAL(&v_initMux);
			}

			// 2. 초기 Lock 획득 시도
			if (*_mutexPtr != nullptr) {
				_acquired = (xSemaphoreTakeRecursive(*_mutexPtr, p_timeout) == pdTRUE);
			}
		}

		/**
		 * @brief 소멸자: 객체 소멸 시 자동으로 락을 해제합니다.
		 */
		~CL_A40_MutexGuard_Semaphore() {
			unlock();
		}

		/**
		 * @brief 명시적 뮤텍스 획득
		 * @param p_timeoutMs 획득 대기 시간 (ms)
		 * @return true 획득 성공, false 실패
		 */
		bool acquire(uint32_t p_timeoutMs = portMAX_DELAY) {
			if (_acquired) return true; // 이미 획득 상태인 경우

			if (_mutexPtr && *_mutexPtr != nullptr) {
				if (xSemaphoreTakeRecursive(*_mutexPtr, pdMS_TO_TICKS(p_timeoutMs)) == pdTRUE) {
					_acquired = true;
				}
			}
			return _acquired;
		}

		/**
		 * @brief 명시적 뮤텍스 해제
		 */
		void unlock() {
			if (_acquired && _mutexPtr && *_mutexPtr != nullptr) {
				if (xSemaphoreGiveRecursive(*_mutexPtr) == pdTRUE) {
					_acquired = false;
				}
			}
		}

		/**
		 * @brief 현재 락 획득 여부 확인
		 */
		bool isAcquired() const { return _acquired; }

	private:
		// 복사 및 대입 방지
		CL_A40_MutexGuard_Semaphore(const CL_A40_MutexGuard_Semaphore&) = delete;
		CL_A40_MutexGuard_Semaphore& operator=(const CL_A40_MutexGuard_Semaphore&) = delete;

		SemaphoreHandle_t* _mutexPtr; // 원본 핸들의 주소 보관 (Lazy Init 반영용)
		bool _acquired = false;
};



/**
 * @brief ESP32 Critical Section (Spinlock) 가드
 * @details
 * - 인터럽트를 금지하고 공유 자원을 보호합니다.
 * - 복사 생성 및 대입을 금지하여 안정성을 확보했습니다.
 */
class CL_A40_muxGuard_Critical {
	public:
		// 복사 및 대입 금지 (Safety)
		CL_A40_muxGuard_Critical(const CL_A40_muxGuard_Critical&) = delete;
		CL_A40_muxGuard_Critical& operator=(const CL_A40_muxGuard_Critical&) = delete;

		/**
		 * @param p_mux 원본 portMUX_TYPE의 주소
		 */
		CL_A40_muxGuard_Critical(portMUX_TYPE* p_mux) : _mux(p_mux) {
			if (_mux) {
				// portMUX는 구조체이므로 생성 시점에 이미 메모리가 할당되어 있어야 합니다.
				// (만약 동적 할당된 포인터가 nullptr라면 진입하지 않음)
				portENTER_CRITICAL(_mux);
			}
		}

		~CL_A40_muxGuard_Critical() {
			if (_mux) {
				portEXIT_CRITICAL(_mux);
			}
		}

	private:
		portMUX_TYPE* _mux;
};


