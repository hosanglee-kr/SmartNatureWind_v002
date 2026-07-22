

## LS2420 radar Adv2 example v008.md




---

https://github.com/cyrixninja/LD2420/blob/main/examples/AdvancedUsage/AdvancedUsage.ino

LD2420 Adv 에  
   "+ " FreeRTOS,  Hysteresis 추가
   "+ " 객채지향

## 파일 구성

```
LD2420Radar_001.hpp   - 클래스 선언, 상수, 구조체
LD2420Radar_001.cpp   - 클래스 멤버 함수 구현
main.cpp          - 전역 인스턴스, init, run 호출
```

---

## LD2420Radar_001.hpp


```cpp

#pragma once

#include <Arduino.h>
#include <HardwareSerial.h>
#include "LD2420.h"
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/semphr.h>
#include <cstring>  // memcpy 사용을 위해 추가
#include <cstdarg>  // va_list 사용을 위해 추가
#include <atomic>    //
#include <array>
#include <functional>   // std::function 사용을 위해 추가

// ============================================================================
// 전역 상수 (constexpr)
// ============================================================================

// 하드웨어 UART 핀 (ESP32 기본값, 필요시 변경)
constexpr int           G_RX_PIN = 16;   // ESP32의 기본 RX2 핀
constexpr int           G_TX_PIN = 17;   // ESP32의 기본 TX2 핀

// 히스테리시스 여유폭 (cm)
constexpr int           G_HYST_MARGIN_CM = 5;

// 이동 평균 필터 크기
constexpr int           G_FILTER_SIZE = 5;

// 상태 출력 주기 (ms)
constexpr unsigned long G_STATUS_PRINT_INTERVAL_MS = 5000;

// FreeRTOS 태스크 설정
constexpr int           G_TASK_STACK_SIZE = 4096;
constexpr UBaseType_t   G_TASK_PRIORITY = 2;
constexpr TickType_t    G_TASK_FREQUENCY_MS = 20;   // 20ms = 50Hz


// ZONE 열거형
enum EM_ZONE_t : uint8_t {
    E_ZONE_CLOSE         = 0,         
    E_ZONE_MIDDLE,                       
	E_ZONE_FAR,
	E_ZONE_FARTHER,
	E_ZONE_OUTOFRANGE
};

constexpr int       G_RANGE_MIN_DEFAULT = 0;
constexpr int       G_RANGE_MAX_DEFAULT = 500;


// 실제 감지 영역 개수 (OUTOFRANGE 제외)
static constexpr int G_ZONE_ACTUAL_COUNT = E_ZONE_FARTHER + 1;  // 4


// ============================================================================
// 구조체: 감지 영역 (명명규칙 ST_..._t)
// ============================================================================

struct ST_DetectionZone_t {
    int           minDistance;
    int           maxDistance;
    const char*   name;      // String 대신 const char* 사용 (힙 할당 제거)
    bool          isActive;
    unsigned long lastDetection;
};

// 클래스 내부에서 DEFAULT_ZONES를 static constexpr로 변경
static constexpr std::array<ST_DetectionZone_t, G_ZONE_ACTUAL_COUNT> G_DEFAULT_ZONE_ARR = {{
    {0,   50,  "Close Range",  false, 0},
    {51,  150, "Medium Range", false, 0},
    {151, 300, "Far Range",    false, 0},
    {301, 500, "Farther",      false, 0}
}};



// 변화된 존 정보를 저장할 구조체
struct ST_ZoneChange_t {
    uint8_t index;
    bool    active;
};

// ============================================================================
// 클래스 선언
// ============================================================================


class CL_LD2420Radar {
public:
    
    static CL_LD2420Radar& getInstance() {
        static CL_LD2420Radar instance;
        return instance;
    }

    // 초기화 및 시작
    bool     init(HardwareSerial& p_serial);
    
    void     run();   // loop()에서 호출 (태스크 생성 후 상태 출력)
    
    // 존 상태 변화 콜백 등록
    void      onZoneChange(std::function<void(uint8_t zoneIndex, bool isActive, int distance)> callback);

    // Zone 범위 설정 (index: 0~2)
    bool      setZoneRange(uint8_t p_index, int p_minDist, int p_maxDist);
    
    // 전체 감지 범위 설정
    bool      setDistanceRange(int p_minDist, int p_maxDist);
    
    bool      setUpdateInterval(unsigned long p_updateInterval_ms);
    
    int       getCurrentDistance() const { return _currentDistance.load(); }
    EM_ZONE_t getCurrentZone()     const { return _currentZoneIndex.load(); }
    
    int       getZoneMinDist(uint8_t p_index) const;
    int       getZoneMaxDist(uint8_t p_index) const;

    
    // 상태 출력
    void      printZoneInfo() const;
    void      printDetailedStatus() const;

private:
    CL_LD2420Radar();
    CL_LD2420Radar(const CL_LD2420Radar&) = delete;
    ~CL_LD2420Radar();
    
    bool            _initialized;   // 포기화 여부
    
    
    // ---------- private 멤버 변수 ( _ 접두사 ) ----------
    HardwareSerial* _pSerial;          // 사용할 UART 포인터
    LD2420          _radar;            // LD2420 라이브러리 객체
    mutable SemaphoreHandle_t _mutex;          // Zone 배열 보호용 뮤텍스
    mutable SemaphoreHandle_t _callbackMutex;   // 콜백 보호용 뮤텍스
    static SemaphoreHandle_t  _printMutex;  // UART 출력 보호용 정적 뮤텍스 추가
    
    int _minRange;   // 전체 감지 최소 거리 (기본 0)
    int _maxRange;   // 전체 감지 최대 거리 (기본 400)
    
    unsigned long _updateInterval_ms;
    
    std::atomic<int>       _currentDistance{0};                     
    std::atomic<EM_ZONE_t> _currentZoneIndex{E_ZONE_OUTOFRANGE};   
    
    // Zone 배열
    ST_DetectionZone_t _zones[G_ZONE_ACTUAL_COUNT];
    
    
    // 이동 평균 필터
    int   _distanceFilter[G_FILTER_SIZE];
    int   _filterIndex;
    bool  _isFilterFull;

    // FreeRTOS 태스크 핸들
    TaskHandle_t _taskHandle;
    bool         _taskCreated;

    // ---------- private 멤버 함수 ( _ 접두사 ) ----------
    
    std::function<void(uint8_t, bool, int)> _zoneChangeCallback;  // 외부 콜백 저장
    
    // 콜백 핸들러 (내부 처리)
    void _onDetection(int p_distance);
    void _onStateChange(LD2420_DetectionState p_oldState, LD2420_DetectionState p_newState);
    void _onDataUpdate(const LD2420_Data& p_data);

    // 필터 관련
    void _initFilter();
    int  _addToFilter(int p_newValue);

    // Zone 업데이트 (히스테리시스 적용)
    void _updateZones();
    
    

    // 유틸리티
    static void _safePrintf(const char* p_format, ...); // 스레드 안전 출력 함수 추가

    const char* _stateToString(LD2420_DetectionState p_state) const;

    // ---------- static 멤버 (콜백 및 태스크 함수) ----------
    static void _onDetectionEvent(int p_distance);
    static void _onStateChangeEvent(LD2420_DetectionState p_oldState, LD2420_DetectionState p_newState);
    static void _onDataUpdateEvent(LD2420_Data p_data);
    static void _radarTask(void* pvParameters);
};

```

---

## LD2420Radar_001.cpp


```cpp
#include "LD2420Radar_001.hpp"


SemaphoreHandle_t CL_LD2420Radar::_printMutex = nullptr; // 정적 뮤텍스 초기화

// ============================================================================
// 생성자 / 소멸자
// ============================================================================

CL_LD2420Radar::CL_LD2420Radar()
    : _pSerial(nullptr)
    , _initialized(false)
    , _mutex(nullptr)
    , _callbackMutex(nullptr)
    , _filterIndex(0)
    , _isFilterFull(false)
    , _taskHandle(nullptr)
    , _taskCreated(false)
    , _minRange(G_RANGE_MIN_DEFAULT)      // 기본값
    , _maxRange(G_RANGE_MAX_DEFAULT)    // 기본값
    , _updateInterval_ms(50)
{
    
    // Zone 초기화 (constexpr 기본값 복사)
    memcpy(_zones, G_DEFAULT_ZONE_ARR.data(), sizeof(_zones));
    
    _initFilter();

}

CL_LD2420Radar::~CL_LD2420Radar() {
    if (_taskHandle != nullptr) {
        vTaskDelete(_taskHandle);
    }
    if (_mutex != nullptr) {
        vSemaphoreDelete(_mutex);
    }
    
    if (_callbackMutex != nullptr) {
        vSemaphoreDelete(_callbackMutex);
    }
    
    if (_printMutex != nullptr) {
        vSemaphoreDelete(_printMutex);
        _printMutex = nullptr;
    }

}

// ============================================================================
// 초기화
// ============================================================================

bool CL_LD2420Radar::init(HardwareSerial& p_serial) {
    if (_initialized) {
        _safePrintf("Already initialized\n");
        return true;   // 이미 초기화 성공 상태라면 true 반환
    }
    
    _pSerial = &p_serial;

    // 1. UART 초기화 (115200 baud)
    _pSerial->begin(115200, SERIAL_8N1, G_RX_PIN, G_TX_PIN);

    // 2. LD2420 센서 초기화
    if (!_radar.begin(*_pSerial)) {
        return false;
    }
    
    
    // 3. 센서 설정
    _radar.setDistanceRange(_minRange, _maxRange);
    _radar.setUpdateInterval(_updateInterval_ms);   // 50ms

    // 4. 콜백 등록 (static 함수)
    _radar.onDetection(_onDetectionEvent);
    _radar.onStateChange(_onStateChangeEvent);
    _radar.onDataUpdate(_onDataUpdateEvent);

    // 5. 뮤텍스 생성
    if (_mutex == nullptr) {
        _mutex = xSemaphoreCreateMutex();
        if (_mutex == nullptr) return false;
    }
    
    if (_callbackMutex == nullptr) {
        _callbackMutex = xSemaphoreCreateMutex();
        if (_callbackMutex == nullptr) return false;
    }
    
    if (_printMutex == nullptr) {
        _printMutex = xSemaphoreCreateMutex();
        if (_printMutex == nullptr) return false;
    }
    
    // 태스크가 아직 생성되지 않았다면 생성
    if (!_taskCreated) {
        BaseType_t v_result = xTaskCreatePinnedToCore(
            _radarTask,
            "RadarTask",
            G_TASK_STACK_SIZE,
            this,                // this를 파라미터로 전달
            G_TASK_PRIORITY,
            &_taskHandle,
            tskNO_AFFINITY       // ESP32-C3 호환
        );
        if (v_result == pdPASS) {
            _taskCreated = true;
            _initialized = true;
            _safePrintf("Radar Task created \n");
        } else {
            _safePrintf("Failed to create Radar Task \n");
            
            return false;
        }
    }
    
    

    return true;
}

// ============================================================================
// run() : loop에서 호출, 태스크 생성 및 상태 출력
// ============================================================================

void CL_LD2420Radar::run() {
    vTaskDelay(pdMS_TO_TICKS(10)); 
}

void CL_LD2420Radar::onZoneChange(std::function<void(uint8_t, bool, int)> callback) {
    if (xSemaphoreTake(_callbackMutex, portMAX_DELAY) == pdTRUE) {
        _zoneChangeCallback = callback;
        xSemaphoreGive(_callbackMutex);
    }
}



// ============================================================================
// Zone 업데이트 (히스테리시스 적용)
// ============================================================================
void CL_LD2420Radar::_updateZones() {
    bool v_isDetecting = _radar.isDetecting();
    int  v_currentDist = _currentDistance.load(std::memory_order_relaxed);

    
    ST_ZoneChange_t v_changes[G_ZONE_ACTUAL_COUNT];
    int changeCount = 0;

    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        for (int v_i = 0; v_i < G_ZONE_ACTUAL_COUNT; v_i++) {
            bool v_wasActive = _zones[v_i].isActive;
            int  v_min = _zones[v_i].minDistance;
            int  v_max = _zones[v_i].maxDistance;

            if (v_isDetecting) {
                if (v_wasActive) {
                    bool v_exit = (v_currentDist > (v_max + G_HYST_MARGIN_CM)) ||
                                  (v_currentDist < (v_min - G_HYST_MARGIN_CM));
                    _zones[v_i].isActive = !v_exit;
                } else {
                    if (v_currentDist >= (v_min - G_HYST_MARGIN_CM) && 
                        v_currentDist <= (v_max + G_HYST_MARGIN_CM)) {
                        _zones[v_i].isActive = true;
                        _zones[v_i].lastDetection = millis();
                        _safePrintf("Zone activated: %s (%d cm)\n",
                                      _zones[v_i].name, v_currentDist);
                    }
                }
            } else {
                _zones[v_i].isActive = false;
            }

            if (_zones[v_i].isActive) {
                _zones[v_i].lastDetection = millis();
            }

            // 상태 변화가 있으면 기록 (콜백 호출용)
            if (_zones[v_i].isActive != v_wasActive) {
                v_changes[changeCount].index  = v_i;
                v_changes[changeCount].active = _zones[v_i].isActive;
                changeCount++;
            }
        }

        // 현재 존 인덱스 갱신
        _currentZoneIndex = E_ZONE_OUTOFRANGE;
        if (!v_isDetecting) {
            _currentDistance.store(-1, std::memory_order_relaxed);
        }
        if (v_isDetecting) {
            for (int i = 0; i < G_ZONE_ACTUAL_COUNT; i++) {
                if (_zones[i].isActive) {
                    _currentZoneIndex.store(static_cast<EM_ZONE_t>(i), std::memory_order_relaxed);
                    break;
                }
            }
        }
        xSemaphoreGive(_mutex);
    }

    // 뮤텍스 밖에서 콜백 호출 (등록된 콜백이 있으면)
    // 뮤텍스 밖에서 콜백 호출 전에 안전하게 복사
    std::function<void(uint8_t, bool, int)> callbackCopy;
    if (xSemaphoreTake(_callbackMutex, 0) == pdTRUE) {   // 논블로킹 시도
        callbackCopy = _zoneChangeCallback;
        xSemaphoreGive(_callbackMutex);
    }
    
    if (callbackCopy) {
        for (int i = 0; i < changeCount; i++) {
            callbackCopy(v_changes[i].index, v_changes[i].active, v_currentDist);
        }
    }
}


// ============================================================================
// 필터 함수
// ============================================================================

void CL_LD2420Radar::_initFilter() {
    for (int v_i = 0; v_i < G_FILTER_SIZE; v_i++) {
        _distanceFilter[v_i] = 0;
    }
    _filterIndex = 0;
    _isFilterFull = false;
}

int CL_LD2420Radar::_addToFilter(int p_newValue) {
    _distanceFilter[_filterIndex] = p_newValue;
    _filterIndex = (_filterIndex + 1) % G_FILTER_SIZE;
    if (!_isFilterFull && _filterIndex == 0) {
        _isFilterFull = true;
    }

    int v_sum = 0;
    int v_count = _isFilterFull ? G_FILTER_SIZE : _filterIndex;
    for (int v_i = 0; v_i < v_count; v_i++) {
        v_sum += _distanceFilter[v_i];
    }
    return (v_count > 0) ? (v_sum / v_count) : 0;
}

// ============================================================================
// 콜백 핸들러 (내부)
// ============================================================================

void CL_LD2420Radar::_onDetection(int p_distance) {
    int v_filtered = _addToFilter(p_distance);
    
    _currentDistance.store(v_filtered, std::memory_order_relaxed);

    // 로그 출력 간격 제한 (200ms)
    static unsigned long lastPrint = 0;
    if (millis() - lastPrint > 200) {
        _safePrintf("Raw: %d cm, Filtered: %d cm\n", p_distance, v_filtered);
        lastPrint = millis();
    }
}

void CL_LD2420Radar::_onStateChange(LD2420_DetectionState p_oldState,
                                    LD2420_DetectionState p_newState) {
    const char* v_old = _stateToString(p_oldState);
    const char* v_new = _stateToString(p_newState);
    _safePrintf("State change: %s → %s\n", v_old, v_new);

    if (p_newState == LD2420_NO_DETECTION) {
        // 콜백 호출을 위해 비활성화될 존들을 기록

        ST_ZoneChange_t v_changes[G_ZONE_ACTUAL_COUNT];
        int changeCount = 0;

        if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
            for (int v_i = 0; v_i < G_ZONE_ACTUAL_COUNT; v_i++) {
                if (_zones[v_i].isActive) {
                    v_changes[changeCount].index = v_i;
                    v_changes[changeCount].active = false;
                    changeCount++;
                }
                _zones[v_i].isActive = false;
            }
            _currentDistance.store(-1, std::memory_order_relaxed);
            _currentZoneIndex.store(E_ZONE_OUTOFRANGE, std::memory_order_relaxed);
            xSemaphoreGive(_mutex);
        }


        // 뮤텍스 밖에서 콜백 호출 전에 안전하게 복사
        std::function<void(uint8_t, bool, int)> callbackCopy;
        if (xSemaphoreTake(_callbackMutex, 0) == pdTRUE) {   // 논블로킹
            callbackCopy = _zoneChangeCallback;
            xSemaphoreGive(_callbackMutex);
        }
        
        if (callbackCopy) {
            for (int i = 0; i < changeCount; i++) {
                callbackCopy(v_changes[i].index, false, -1);  // distance = -1
            }
        }

        _safePrintf("All zones cleared \n");
    }
}


void CL_LD2420Radar::_onDataUpdate(const LD2420_Data& p_data) {
    (void)p_data; 
    
    static unsigned long v_counter = 0;
    v_counter++;
    if (v_counter % 100 == 0) {
        static unsigned long v_lastCheck = 0;
        unsigned long v_now = millis();
        if (v_lastCheck > 0) {
            float v_rate = 100000.0f / (v_now - v_lastCheck);
            _safePrintf("Data rate: %.1f Hz\n", v_rate);
        }
        v_lastCheck = v_now;
    }
}

// ============================================================================
// static 콜백 (LD2420 라이브러리 요구 형식)
// ============================================================================
void CL_LD2420Radar::_onDetectionEvent(int p_distance) {
    getInstance()._onDetection(p_distance);
}


void CL_LD2420Radar::_onStateChangeEvent(LD2420_DetectionState p_oldState,
                                              LD2420_DetectionState p_newState) {
    getInstance()._onStateChange(p_oldState, p_newState);
}

void CL_LD2420Radar::_onDataUpdateEvent(LD2420_Data p_data) {
    getInstance()._onDataUpdate(p_data);
}


bool CL_LD2420Radar::setZoneRange(uint8_t p_index, int p_minDist, int p_maxDist) {
    
    if (p_index >= G_ZONE_ACTUAL_COUNT) {
        _safePrintf("Invalid zone index: %d\n", p_index);
        return false;
    }
    if (p_minDist > p_maxDist) {
        _safePrintf("minDist(%d) > maxDist(%d)\n", p_minDist, p_maxDist);
        return false;
    }

    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        _zones[p_index].minDistance = p_minDist;
        _zones[p_index].maxDistance = p_maxDist;
        xSemaphoreGive(_mutex);
        _safePrintf("Zone %d (%s) range set to %d-%d cm\n",
                      p_index, _zones[p_index].name, p_minDist, p_maxDist);
        return true;
    }
    return false;
}

int CL_LD2420Radar::getZoneMinDist(uint8_t p_index) const {
    if (p_index >= G_ZONE_ACTUAL_COUNT) return 0;
    int v_val = 0;
    if (xSemaphoreTake(_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        v_val = _zones[p_index].minDistance;
        xSemaphoreGive(_mutex);
    }
    return v_val;
}

int CL_LD2420Radar::getZoneMaxDist(uint8_t p_index) const {
    if (p_index >= G_ZONE_ACTUAL_COUNT) return 0;
    int v_val = 0;
    if (xSemaphoreTake(_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        v_val = _zones[p_index].maxDistance;
        xSemaphoreGive(_mutex);
    }
    return v_val;
}


// 전체 감지 범위 설정
bool CL_LD2420Radar::setDistanceRange(int p_minDist, int p_maxDist) {
    if (p_minDist > p_maxDist) {
        _safePrintf("Invalid range: min(%d) > max(%d)\n", p_minDist, p_maxDist);
        return false;
    }
    
    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        _minRange = p_minDist;
        _maxRange = p_maxDist;
        _radar.setDistanceRange(p_minDist, p_maxDist);
        xSemaphoreGive(_mutex);
        _safePrintf("Radar range set to %d-%d cm\n", p_minDist, p_maxDist);
        return true;
    }
    return false;
}

// 갱신주기 설정
bool CL_LD2420Radar::setUpdateInterval(unsigned long p_updateInterval_ms) {
    if (p_updateInterval_ms == 0) {
        _safePrintf("Invalid UpdateInterval: (%lu) \n", p_updateInterval_ms);
        return false;
    }
    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        _updateInterval_ms = p_updateInterval_ms;
        _radar.setUpdateInterval(_updateInterval_ms);
        xSemaphoreGive(_mutex);
        _safePrintf("updateInterval set to %lu ms\n", _updateInterval_ms);
        return true;
    }
    return false;
}


// ============================================================================
// FreeRTOS 태스크 (static)
// ============================================================================
void CL_LD2420Radar::_radarTask(void* pvParameters) {
    CL_LD2420Radar*  v_this     = static_cast<CL_LD2420Radar*>(pvParameters);
    TickType_t       v_lastWake = xTaskGetTickCount();
    const TickType_t v_freq     = pdMS_TO_TICKS(G_TASK_FREQUENCY_MS);

    unsigned long    v_lastPrint = 0;   // 상태 출력 타이머 (ms)

    while (1) {
        v_this->_radar.update();
        v_this->_updateZones();

        // 5초마다 상세 상태 출력 (레이더 태스크 내에서만 안전하게 접근)
        unsigned long v_now = millis();
        if (v_now - v_lastPrint >= 5000) {
            v_this->printDetailedStatus();
            v_lastPrint = v_now;
        }

        vTaskDelayUntil(&v_lastWake, v_freq);
    }
}



// ============================================================================
// 스레드 안전 출력 유틸리티 (추가)
// ============================================================================
void CL_LD2420Radar::_safePrintf(const char* p_format, ...) {
    if (_printMutex != nullptr) {
        if (xSemaphoreTake(_printMutex, portMAX_DELAY) == pdTRUE) {
            va_list v_args;
            va_start(v_args, p_format);
            char v_buffer[256];
            vsnprintf(v_buffer, sizeof(v_buffer), p_format, v_args);
            Serial.print(v_buffer);
            va_end(v_args);
            xSemaphoreGive(_printMutex);
        }
    }
}

// ============================================================================
// 상태 출력 함수
// ============================================================================

const char* CL_LD2420Radar::_stateToString(LD2420_DetectionState p_state) const {
    switch (p_state) {
        case LD2420_NO_DETECTION:     return "No Detection";
        case LD2420_DETECTION_ACTIVE: return "Active Detection";
        case LD2420_DETECTION_LOST:   return "Detection Lost";
        default:                      return "Unknown";
    }
}

void CL_LD2420Radar::printZoneInfo() const {
    _safePrintf("\n=== Detection Zones (with Hysteresis) ===\n");
    for (int v_i = 0; v_i < G_ZONE_ACTUAL_COUNT; v_i++) {
        _safePrintf("%s: %d-%d cm (Hyst: ±%d cm)\n",
                      _zones[v_i].name,
                      _zones[v_i].minDistance,
                      _zones[v_i].maxDistance,
                      G_HYST_MARGIN_CM);
    }
    _safePrintf("===========================================\n");
}

void CL_LD2420Radar::printDetailedStatus() const {
    _safePrintf("\n--- Detailed Status ---\n");

    // 뮤텍스 획득 (전체 출력 보호)
    if (xSemaphoreTake(_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        _safePrintf("Target detected: %s\n", _radar.isDetecting() ? "Yes" : "No");
        _safePrintf("Distance: %d cm\n", _radar.getDistance());
        _safePrintf("State: %s\n", _stateToString(_radar.getState()));
        _safePrintf("Data valid: %s\n", _radar.isDataValid() ? "Yes" : "No");
        _safePrintf("Last update: %lu ms ago\n", _radar.getLastUpdateTime());

        _safePrintf("Zone Status (Hysteresis applied):\n");
        for (int v_i = 0; v_i < G_ZONE_ACTUAL_COUNT; v_i++) {
            _safePrintf("  %s: %s",
                          _zones[v_i].name,
                          _zones[v_i].isActive ? "ACTIVE" : "Inactive");
            if (_zones[v_i].isActive) {
                _safePrintf(" (%lu ms ago)", millis() - _zones[v_i].lastDetection);
            }
            _safePrintf("\n");
        }
        
        
        _safePrintf("Current Distance: %d cm\n", _currentDistance);
        _safePrintf("Current Zone: ");
        
        // _currentZoneIndex를 로컬 변수로 원자적 읽기
        EM_ZONE_t v_zone = _currentZoneIndex.load();
        if (v_zone < G_ZONE_ACTUAL_COUNT) {
            _safePrintf("%s\n", _zones[v_zone].name);
        } else if (v_zone == E_ZONE_OUTOFRANGE) {
            _safePrintf("Out of Range\n");
        } else {
            _safePrintf("None\n");
        }

        
        xSemaphoreGive(_mutex);
    } else {
        _safePrintf("  (Failed to acquire mutex)\n");
    }
    _safePrintf("-----------------------\n");
}


```


---

## main.cpp

```cpp

// FastLED 인터럽트 허용 설정 (UART 데이터 수신 누락 방지용, 반드시 FastLED.h 인클루드 전에 정의)
#define  FASTLED_ALLOW_INTERRUPTS 1
#include <FastLED.h>

#include "LD2420Radar_001.hpp"

// ============================================================================
// 전역 상수 (하드웨어 설정, 변경 가능)
// ============================================================================

constexpr int G_UART_BAUD_RATE = 115200;
constexpr int G_LED_PIN        = 5;
constexpr int G_NUM_LEDS       = 1;
constexpr int G_MOTOR_PIN      = 18;
constexpr int G_LED_UPDATE_MS  = 10;

// ============================================================================
// Zone별 제어 파라미터 구조체
// ============================================================================
struct ST_ZoneControl_t {
    CRGB color;
    int  blinkFast_ms;
    int  blinkSlow_ms;
    int  motorSpeedFast;
    int  motorSpeedSlow;
};

// LED 및 모터 제어 설정 배열
constexpr ST_ZoneControl_t G_ZONE_CONTROLS_ARR[G_ZONE_ACTUAL_COUNT] = {
    { CRGB::Red,   100, 300,  255, 150 },   // Close
    { CRGB::Orange,200, 500,  200, 100 },   // Middle
    { CRGB::Green, 400, 800,  150, 80  },   // Far
    { CRGB::Blue,  600, 1000, 120, 60  }    // Farther
};

// ============================================================================
// 전역 변수 (g_ 접두사)
// ============================================================================
CRGB              g_leds[G_NUM_LEDS];
TaskHandle_t      g_taskHandleLED = nullptr;
SemaphoreHandle_t g_stateMutex = nullptr;

// 콜백과 태스크 간 공유 상태
struct ST_RadarState_t {
    int       distance;
    bool      zoneChanged;
};

ST_RadarState_t g_radarState = { -1, false };

// ============================================================================
// 유틸리티 함수: 거리 비율 계산
// ============================================================================
float fDistanceRatio(int p_distance, int p_minDist, int p_maxDist) {
    if (p_distance <= p_minDist) return 0.0f;
    if (p_distance >= p_maxDist) return 1.0f;
    return static_cast<float>(p_distance - p_minDist) / (p_maxDist - p_minDist);
}

// ============================================================================
// LED / 모터 제어 FreeRTOS 태스크
// ============================================================================

void vLEDMotorTask(void* pvParameters) {
    (void)pvParameters;
    
    TickType_t       v_lastWake = xTaskGetTickCount();
    const TickType_t v_period   = pdMS_TO_TICKS(G_LED_UPDATE_MS);

    unsigned long    v_lastBlinkToggle = 0;
    bool             v_ledOn = false;

    CL_LD2420Radar&  v_radar = CL_LD2420Radar::getInstance();

    while (1) {
        ST_RadarState_t v_state;
        
        if (xSemaphoreTake(g_stateMutex, portMAX_DELAY) == pdTRUE) {
            v_state = g_radarState;
            g_radarState.zoneChanged = false;
            xSemaphoreGive(g_stateMutex);
        }

        // 현재 활성 존을 radar 객체로부터 직접 읽음 (lock-free)
        EM_ZONE_t v_zone = v_radar.getCurrentZone();
        int       v_idx  = static_cast<int>(v_zone);

        if (v_zone == E_ZONE_OUTOFRANGE || v_state.distance < 0 || v_idx < 0 || v_idx >= G_ZONE_ACTUAL_COUNT) {
            FastLED.clear();
            FastLED.show();
            analogWrite(G_MOTOR_PIN, 0);
            v_ledOn = false;
            vTaskDelayUntil(&v_lastWake, v_period);
            continue;
        }

        // 존의 실제 거리 범위를 읽어와 비율 계산
        int v_minDist = v_radar.getZoneMinDist(v_idx);
        int v_maxDist = v_radar.getZoneMaxDist(v_idx);
        float v_t = fDistanceRatio(v_state.distance, v_minDist, v_maxDist);

        int v_blinkPeriod = G_ZONE_CONTROLS_ARR[v_idx].blinkFast_ms +
            static_cast<int>((G_ZONE_CONTROLS_ARR[v_idx].blinkSlow_ms - G_ZONE_CONTROLS_ARR[v_idx].blinkFast_ms) * v_t);

        int v_motorSpeed = G_ZONE_CONTROLS_ARR[v_idx].motorSpeedFast +
            static_cast<int>((G_ZONE_CONTROLS_ARR[v_idx].motorSpeedSlow - G_ZONE_CONTROLS_ARR[v_idx].motorSpeedFast) * v_t);
        analogWrite(G_MOTOR_PIN, v_motorSpeed);

        unsigned long v_now = millis();
        if (v_now - v_lastBlinkToggle >= static_cast<unsigned long>(v_blinkPeriod / 2)) {
            v_ledOn = !v_ledOn;
            v_lastBlinkToggle = v_now;
        }

        if (v_ledOn) {
            g_leds[0] = G_ZONE_CONTROLS_ARR[v_idx].color;
        } else {
            g_leds[0] = CRGB::Black;
        }
        FastLED.show();

        vTaskDelayUntil(&v_lastWake, v_period);
    }
}

// ============================================================================
// Zone 변화 콜백
// ============================================================================
void vZoneChangeHandler(uint8_t p_zoneIndex, bool p_isActive, int p_distance) {
    (void)p_zoneIndex;   // 사용하지 않음 (존은 radar 객체에서 직접 읽을 것임)
    (void)p_isActive;
    if (xSemaphoreTake(g_stateMutex, portMAX_DELAY) == pdTRUE) {
        g_radarState.distance = p_distance;   // -1이면 미감지
        g_radarState.zoneChanged = true;
        xSemaphoreGive(g_stateMutex);
    }
}

// ============================================================================
// setup
// ============================================================================
void setup() {
    Serial.begin(G_UART_BAUD_RATE);
    while (!Serial) delay(10);
    Serial.println("=== LD2420 + FreeRTOS + FastLED + Motor (Refactored) ===");

    FastLED.addLeds<WS2812, G_LED_PIN, GRB>(g_leds, G_NUM_LEDS);
    FastLED.setBrightness(50);
    FastLED.clear();
    FastLED.show();

    pinMode(G_MOTOR_PIN, OUTPUT);
    analogWrite(G_MOTOR_PIN, 0);

    g_stateMutex = xSemaphoreCreateMutex();

    xTaskCreate(
        vLEDMotorTask,
        "LEDMotorTask",
        2048,
        nullptr,
        1,
        &g_taskHandleLED
    );

    CL_LD2420Radar& v_radar = CL_LD2420Radar::getInstance();
    v_radar.onZoneChange(vZoneChangeHandler);

    if (v_radar.init(Serial2)) {
        Serial.println("✓ LD2420 initialized");
    } else {
        Serial.println("❌ LD2420 init failed");
        while (1) delay(1000);
    }

    v_radar.setZoneRange(E_ZONE_CLOSE,     0,  50);
    v_radar.setZoneRange(E_ZONE_MIDDLE,   51, 150);
    v_radar.setZoneRange(E_ZONE_FAR,     151, 300);
    v_radar.setZoneRange(E_ZONE_FARTHER, 301, 500);
    
    v_radar.setDistanceRange(0, 500);

    v_radar.printZoneInfo();
    Serial.println("Setup complete. Monitoring...\n");
}

// ============================================================================
// loop
// ============================================================================
void loop() {
    vTaskDelay(pdMS_TO_TICKS(1000));
}


```


