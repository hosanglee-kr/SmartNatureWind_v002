// 소스명 : A40_Com_Func_047.h

#pragma once

#include <Arduino.h>
#include <string.h>
#include <strings.h>

#include <FS.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

#include <memory>   // std::shared_ptr, std::default_delete
#include <new>      // std::nothrow

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
    inline size_t copyStr2Buffer_safe(char* p_dst, const char* p_src, size_t p_n) {
        if (!p_dst || p_n == 0) return 0;

        if (!p_src) {
            p_dst[0] = '\0';
            return 0;
        }

        return strlcpy(p_dst, p_src, p_n);
    }

    /**
     * @brief 공유 가능한 안전한 C-String 복사본을 생성합니다. (AsyncWebServer 람다 캡처 전용)
     * @details
     *  - shared_ptr<char[]> + default_delete<char[]> 사용으로 new[] 해제 안정성 보장
     *  - 메모리 부족 시 nullptr 반환 + 로그 기록
     * @param p_src 복사할 원본 문자열 포인터
     * @return std::shared_ptr<char[]> 관리되는 문자열 (할당 실패 시 nullptr)
     */
    inline std::shared_ptr<char[]> cloneStr2SharedStr_safe(const char* p_src) {
        if (!p_src) {
            CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40] cloneStr2SharedStr_safe: Input p_src is null");
            return nullptr;
        }

        const size_t v_len = strlen(p_src) + 1; // include '\0'

        std::shared_ptr<char[]> v_buf(
            new (std::nothrow) char[v_len],
            std::default_delete<char[]>()
        );

        if (!v_buf) {
            CL_D10_Logger::log(EN_L10_LOG_ERROR,
                               "[A40] cloneStr2SharedStr_safe: Heap allocation failed! (Required: %u bytes)",
                               (unsigned)v_len);
            return nullptr;
        }

        // 마지막 바이트 '\0' 보장
        strlcpy(v_buf.get(), p_src, v_len);
        return v_buf;
    }

    inline float getRandom01() {
        // [0, 1) 범위. 1.0f가 나오지 않도록 +1 처리
        return static_cast<float>(esp_random()) / (static_cast<float>(UINT32_MAX) + 1.0f);
    }

    inline float getRandomRange(float p_min, float p_max) {
        if (p_min >= p_max) return p_min;
        return p_min + (getRandom01() * (p_max - p_min));
    }
} // namespace A40_ComFunc


/**
 * @brief FreeRTOS Recursive Mutex 전용 가드 (자동 지연 초기화 포함)
 * @details
 * 1) 생성자에서 뮤텍스가 nullptr인 경우 자동 생성 (Lazy Init)
 * 2) Spinlock(critical section)으로 초기화 Race Condition 방지
 * 3) RAII: scope 종료 시 unlock()
 * 4) 명시적 acquire/unlock 제공 (ms 기반, portMAX_DELAY 혼선 방지)
 */
class CL_A40_MutexGuard_Semaphore {
  public:
    /**
     * @param p_mutex   원본 SemaphoreHandle_t 참조 (외부 static 변수 등)
     * @param p_timeout ctor에서 초기 lock 획득 대기 시간(tick)
     */
    CL_A40_MutexGuard_Semaphore(SemaphoreHandle_t& p_mutex,
                                TickType_t p_timeout = pdMS_TO_TICKS(100))
        : _mutexPtr(&p_mutex) {

        // 1) 뮤텍스 지연 초기화 (Race Condition 방지)
        if (*_mutexPtr == nullptr) {
            static portMUX_TYPE v_initMux = portMUX_INITIALIZER_UNLOCKED;
            portENTER_CRITICAL(&v_initMux);
            if (*_mutexPtr == nullptr) {
                *_mutexPtr = xSemaphoreCreateRecursiveMutex();
                if (*_mutexPtr == nullptr) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40] CreateRecursiveMutex failed");
                }
            }
            portEXIT_CRITICAL(&v_initMux);
        }

        // 2) 초기 Lock 획득 시도
        if (*_mutexPtr != nullptr) {
            _acquired = (xSemaphoreTakeRecursive(*_mutexPtr, p_timeout) == pdTRUE);
            if (!_acquired) {
                CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40] Mutex acquire timeout (ctor)");
            }
        }
    }

    ~CL_A40_MutexGuard_Semaphore() {
        unlock();
    }

    /**
     * @brief ms 기반 명시적 뮤텍스 획득
     * @param p_timeoutMs UINT32_MAX이면 portMAX_DELAY로 대기
     * @return true 획득 성공, false 실패
     */
    bool acquire(uint32_t p_timeoutMs = UINT32_MAX) {
        if (_acquired) return true;
        if (!_mutexPtr || *_mutexPtr == nullptr) return false;

        const TickType_t v_ticks = (p_timeoutMs == UINT32_MAX) ? portMAX_DELAY : pdMS_TO_TICKS(p_timeoutMs);

        if (xSemaphoreTakeRecursive(*_mutexPtr, v_ticks) == pdTRUE) {
            _acquired = true;
            return true;
        }

        CL_D10_Logger::log(EN_L10_LOG_WARN, "[A40] Mutex acquire timeout (acquire)");
        return false;
    }

    /**
     * @brief 명시적 뮤텍스 해제
     */
    void unlock() {
        if (!_acquired) return;
        if (!_mutexPtr || *_mutexPtr == nullptr) return;

        if (xSemaphoreGiveRecursive(*_mutexPtr) == pdTRUE) {
            _acquired = false;
            return;
        }

        CL_D10_Logger::log(EN_L10_LOG_ERROR, "[A40] Mutex unlock failed");
        // 실패 시 _acquired는 true 유지 (실제로 락이 유지됐을 가능성)
    }

    /**
     * @brief 현재 락 획득 여부 확인
     */
    bool isAcquired() const { return _acquired; }

  private:
    CL_A40_MutexGuard_Semaphore(const CL_A40_MutexGuard_Semaphore&) = delete;
    CL_A40_MutexGuard_Semaphore& operator=(const CL_A40_MutexGuard_Semaphore&) = delete;

    SemaphoreHandle_t* _mutexPtr = nullptr; // 원본 핸들 주소 (Lazy Init 반영용)
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
    CL_A40_muxGuard_Critical(const CL_A40_muxGuard_Critical&) = delete;
    CL_A40_muxGuard_Critical& operator=(const CL_A40_muxGuard_Critical&) = delete;

    /**
     * @param p_mux 원본 portMUX_TYPE의 주소
     */
    explicit CL_A40_muxGuard_Critical(portMUX_TYPE* p_mux) : _mux(p_mux) {
        if (_mux) {
            portENTER_CRITICAL(_mux);
        }
    }

    ~CL_A40_muxGuard_Critical() {
        if (_mux) {
            portEXIT_CRITICAL(_mux);
        }
    }

  private:
    portMUX_TYPE* _mux = nullptr;
};
