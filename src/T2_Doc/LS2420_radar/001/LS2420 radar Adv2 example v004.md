
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

// ============================================================================
// 전역 상수 (constexpr)
// ============================================================================

// 하드웨어 UART 핀 (ESP32 기본값, 필요시 변경)
constexpr int G_RX_PIN = 16;   // ESP32의 기본 RX2 핀
constexpr int G_TX_PIN = 17;   // ESP32의 기본 TX2 핀

// 히스테리시스 여유폭 (cm)
constexpr int G_HYST_MARGIN_CM = 5;

// 이동 평균 필터 크기
constexpr int G_FILTER_SIZE = 5;

// 상태 출력 주기 (ms)
constexpr unsigned long G_STATUS_PRINT_INTERVAL_MS = 5000;

// FreeRTOS 태스크 설정
constexpr int G_TASK_STACK_SIZE = 4096;
constexpr UBaseType_t G_TASK_PRIORITY = 1;
constexpr TickType_t G_TASK_FREQUENCY_MS = 20;   // 20ms = 50Hz



// ZONE 열거형
enum EM_ZONE_t : uint8_t {
    E_ZONE_CLOSE         = 0,         
    E_ZONE_MIDDLE,                       
	E_ZONE_FAR,
	E_ZONE_COUNT
};

// Zone 개수
constexpr uint8_t G_ZONE_COUNT = static_cast<uint8_t>(E_ZONE_COUNT);

/*
EM_ZONE_t::E_ZONE_CLOSE 
EM_ZONE_t::E_ZONE_MIDDLE           
EM_ZONE_t::E_ZONE_FAR
EM_ZONE_t::E_ZONE_COUNT
*/

// ============================================================================
// 구조체: 감지 영역 (명명규칙 ST_..._t)
// ============================================================================

struct ST_DetectionZone_t {
    int minDistance;
    int maxDistance;
    const char* name;      // String 대신 const char* 사용 (힙 할당 제거)
    bool isActive;
    unsigned long lastDetection;
};

// ============================================================================
// 클래스 선언
// ============================================================================

class CL_LD2420Radar {
public:
    CL_LD2420Radar();
    ~CL_LD2420Radar();

    // 초기화 및 시작
    bool init(HardwareSerial& p_serial);
    void run();   // loop()에서 호출 (태스크 생성 후 상태 출력)
    
    // Zone 범위 설정 (index: 0~2)
    bool setZoneRange(uint8_t p_index, int p_minDist, int p_maxDist);
    
    // 전체 감지 범위 설정
    bool setDistanceRange(int p_minDist, int p_maxDist);
    
    bool setUpdateInterval(unsigned long p_updateInterval_ms);


    // 상태 출력
    void printZoneInfo() const;
    void printDetailedStatus() const;

private:
    // ---------- private 멤버 변수 ( _ 접두사 ) ----------
    HardwareSerial* _pSerial;          // 사용할 UART 포인터
    LD2420          _radar;            // LD2420 라이브러리 객체
    mutable  SemaphoreHandle_t _mutex;          // Zone 배열 보호용 뮤텍스
    
    
    int _minRange;   // 전체 감지 최소 거리 (기본 0)
    int _maxRange;   // 전체 감지 최대 거리 (기본 400)
    
    unsigned long _updateInterval_ms;
    

    // Zone 배열
    ST_DetectionZone_t _zones[E_ZONE_COUNT];

    // 이동 평균 필터
    int   _distanceFilter[G_FILTER_SIZE];
    int   _filterIndex;
    bool  _isFilterFull;

    // 상태 출력 타이머
    unsigned long _lastStatusPrint;

    // FreeRTOS 태스크 핸들
    TaskHandle_t _taskHandle;
    bool         _taskCreated;

    // ---------- private 멤버 함수 ( _ 접두사 ) ----------
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

// ============================================================================
// 전역 인스턴스 포인터 (static 멤버에서 접근용)
// ============================================================================
static CL_LD2420Radar* g_pManager = nullptr;

// ============================================================================
// 생성자 / 소멸자
// ============================================================================

CL_LD2420Radar::CL_LD2420Radar()
    : _pSerial(nullptr)
    , _mutex(nullptr)
    , _filterIndex(0)
    , _isFilterFull(false)
    , _lastStatusPrint(0)
    , _taskHandle(nullptr)
    , _taskCreated(false)
    , _minRange(0)      // 기본값
    , _maxRange(400)    // 기본값
    , _updateInterval_ms(50)
{
    
    // Zone 초기화
    _zones[E_ZONE_CLOSE] = {0, 0, "Close Range", false, 0};
    _zones[E_ZONE_MIDDLE] = {0, 0, "Medium Range", false, 0};
    _zones[E_ZONE_FAR] = {0, 0, "Far Range", false, 0};



    _initFilter();

    // 전역 포인터 설정 (static 콜백에서 사용)
    g_pManager = this;
}

CL_LD2420Radar::~CL_LD2420Radar() {
    if (_taskHandle != nullptr) {
        vTaskDelete(_taskHandle);
    }
    if (_mutex != nullptr) {
        vSemaphoreDelete(_mutex);
    }
    g_pManager = nullptr;
}

// ============================================================================
// 초기화
// ============================================================================

bool CL_LD2420Radar::init(HardwareSerial& p_serial) {
    _pSerial = &p_serial;

    // 1. UART 초기화 (115200 baud)
    _pSerial->begin(115200, SERIAL_8N1, G_RX_PIN, G_TX_PIN);

    // 2. LD2420 센서 초기화
    if (!_radar.begin(*_pSerial)) {
        return false;
    }
    
    

    // Zone 기본값
    _zones[E_ZONE_CLOSE] = {0, 50, "Close Range", false, 0};
    _zones[E_ZONE_MIDDLE] = {51, 150, "Medium Range", false, 0};
    _zones[E_ZONE_FAR] = {151, 300, "Far Range", false, 0};

    // _zones[0] = {0, 50, "Close Range", false, 0};
    // _zones[1] = {51, 150, "Medium Range", false, 0};
    // _zones[2] = {151, 300, "Far Range", false, 0};


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
            Serial.println("✅ Radar Task created");
        } else {
            Serial.println("❌ Failed to create Radar Task");
        }
    }

    return true;
}

// ============================================================================
// run() : loop에서 호출, 태스크 생성 및 상태 출력
// ============================================================================

void CL_LD2420Radar::run() {
    
    // 5초마다 상태 출력 (루프에서 실행)
    if (millis() - _lastStatusPrint > G_STATUS_PRINT_INTERVAL_MS) {
        printDetailedStatus();
        _lastStatusPrint = millis();
    }
    

    vTaskDelay(pdMS_TO_TICKS(10)); 
}


// ============================================================================
// Zone 업데이트 (히스테리시스 적용)
// ============================================================================

void CL_LD2420Radar::_updateZones() {
    bool v_isDetecting = _radar.isDetecting();
    int  v_currentDist = _radar.getDistance();

    // 뮤텍스 획득
    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        for (int v_i = 0; v_i < E_ZONE_COUNT; v_i++) {
            bool v_wasActive = _zones[v_i].isActive;
            int  v_min = _zones[v_i].minDistance;
            int  v_max = _zones[v_i].maxDistance;

            if (v_isDetecting) {
                if (v_wasActive) {
                    // 히스테리시스 이탈 조건
                    bool v_exit = (v_currentDist > (v_max + G_HYST_MARGIN_CM)) ||
                                  (v_currentDist < (v_min - G_HYST_MARGIN_CM));
                    _zones[v_i].isActive = !v_exit;
                } else {
                    // 진입 조건 (히스테리시스 없이 경계값 사용)
                    if (v_currentDist >= v_min && v_currentDist <= v_max) {
                        _zones[v_i].isActive = true;
                        _zones[v_i].lastDetection = millis();
                        Serial.printf("🎯 Zone activated: %s (%d cm)\n",
                                      _zones[v_i].name, v_currentDist);
                    }
                }
            } else {
                _zones[v_i].isActive = false;
            }

            if (_zones[v_i].isActive) {
                _zones[v_i].lastDetection = millis();
            }
        }
        xSemaphoreGive(_mutex);
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
    Serial.printf("📡 Raw: %d cm, Filtered: %d cm\n", p_distance, v_filtered);
}

void CL_LD2420Radar::_onStateChange(LD2420_DetectionState p_oldState,
                                        LD2420_DetectionState p_newState) {
    const char* v_old = _stateToString(p_oldState);
    const char* v_new = _stateToString(p_newState);
    Serial.printf("🔄 State change: %s → %s\n", v_old, v_new);

    if (p_newState == LD2420_NO_DETECTION) {
        if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
            for (int v_i = 0; v_i < E_ZONE_COUNT; v_i++) {
                _zones[v_i].isActive = false;
            }
            xSemaphoreGive(_mutex);
        }
        Serial.println("🔄 All zones cleared");
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
            Serial.printf("📊 Data rate: %.1f Hz\n", v_rate);
        }
        v_lastCheck = v_now;
    }
}

// ============================================================================
// static 콜백 (LD2420 라이브러리 요구 형식)
// ============================================================================

void CL_LD2420Radar::_onDetectionEvent(int p_distance) {
    if (g_pManager != nullptr) {
        g_pManager->_onDetection(p_distance);
    }
}

void CL_LD2420Radar::_onStateChangeEvent(LD2420_DetectionState p_oldState,
                                              LD2420_DetectionState p_newState) {
    if (g_pManager != nullptr) {
        g_pManager->_onStateChange(p_oldState, p_newState);
    }
}

void CL_LD2420Radar::_onDataUpdateEvent(LD2420_Data p_data) {
    if (g_pManager != nullptr) {
        g_pManager->_onDataUpdate(p_data);
    }
}


bool CL_LD2420Radar::setZoneRange(uint8_t p_index, int p_minDist, int p_maxDist) {
    
    if (p_index >= E_ZONE_COUNT) {
        Serial.printf("❌ Invalid zone index: %d\n", p_index);
        return false;
    }
    if (p_minDist > p_maxDist) {
        Serial.printf("❌ minDist(%d) > maxDist(%d)\n", p_minDist, p_maxDist);
        return false;
    }

    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        _zones[p_index].minDistance = p_minDist;
        _zones[p_index].maxDistance = p_maxDist;
        xSemaphoreGive(_mutex);
        Serial.printf("✅ Zone %d (%s) range set to %d-%d cm\n",
                      p_index, _zones[p_index].name, p_minDist, p_maxDist);
        return true;
    }
    return false;
}

// 전체 감지 범위 설정
bool CL_LD2420Radar::setDistanceRange(int p_minDist, int p_maxDist) {
    if (p_minDist > p_maxDist) {
        Serial.printf("❌ Invalid range: min(%d) > max(%d)\n", p_minDist, p_maxDist);
        return false;
    }
    
    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        _minRange = p_minDist;
        _maxRange = p_maxDist;
        _radar.setDistanceRange(p_minDist, p_maxDist);
        xSemaphoreGive(_mutex);
        Serial.printf("✅ Radar range set to %d-%d cm\n", p_minDist, p_maxDist);
        return true;
    }
    return false;
}

// 갱신주기 설정
bool CL_LD2420Radar::setUpdateInterval(unsigned long p_updateInterval_ms) {
    if (p_updateInterval_ms == 0) {
        Serial.printf("❌ Invalid UpdateInterval: (%d) \n", p_updateInterval_ms);
        return false;
    }
    if (xSemaphoreTake(_mutex, portMAX_DELAY) == pdTRUE) {
        _updateInterval_ms = p_updateInterval_ms;
        _radar.setUpdateInterval(_updateInterval_ms);
        xSemaphoreGive(_mutex);
        Serial.printf("✅ updateInterval set to %d ms\n", _updateInterval_ms);
        return true;
    }
    return false;
}





// ============================================================================
// FreeRTOS 태스크 (static)
// ============================================================================

void CL_LD2420Radar::_radarTask(void* pvParameters) {
    CL_LD2420Radar* v_this = static_cast<CL_LD2420Radar*>(pvParameters);
    TickType_t v_lastWake = xTaskGetTickCount();
    const TickType_t v_freq = pdMS_TO_TICKS(G_TASK_FREQUENCY_MS);

    while (1) {
        v_this->_radar.update();      // 센서 폴링 + 콜백 실행
        v_this->_updateZones();       // 히스테리시스 Zone 업데이트
        vTaskDelayUntil(&v_lastWake, v_freq);
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
    Serial.println("\n=== Detection Zones (with Hysteresis) ===");
    for (int v_i = 0; v_i < E_ZONE_COUNT; v_i++) {
        Serial.printf("%s: %d-%d cm (Hyst: ±%d cm)\n",
                      _zones[v_i].name,
                      _zones[v_i].minDistance,
                      _zones[v_i].maxDistance,
                      G_HYST_MARGIN_CM);
    }
    Serial.println("===========================================\n");
}

void CL_LD2420Radar::printDetailedStatus() const {
    Serial.println("\n--- Detailed Status ---");

    // 뮤텍스 획득 (전체 출력 보호)
    if (xSemaphoreTake(_mutex, pdMS_TO_TICKS(10)) == pdTRUE) {
        Serial.printf("Target detected: %s\n", _radar.isDetecting() ? "Yes" : "No");
        Serial.printf("Distance: %d cm\n", _radar.getDistance());
        Serial.printf("State: %s\n", _stateToString(_radar.getState()));
        Serial.printf("Data valid: %s\n", _radar.isDataValid() ? "Yes" : "No");
        Serial.printf("Last update: %lu ms ago\n", _radar.getLastUpdateTime());

        Serial.println("\nZone Status (Hysteresis applied):");
        for (int v_i = 0; v_i < E_ZONE_COUNT; v_i++) {
            Serial.printf("  %s: %s",
                          _zones[v_i].name,
                          _zones[v_i].isActive ? "ACTIVE" : "Inactive");
            if (_zones[v_i].isActive) {
                Serial.printf(" (%lu ms ago)", millis() - _zones[v_i].lastDetection);
            }
            Serial.println();
        }

        xSemaphoreGive(_mutex);
    } else {
        Serial.println("  (Failed to acquire mutex)");
    }
    Serial.println("-----------------------\n");
}

```

---

## main.cpp

```cpp
#include "LD2420Radar_001.hpp"

// ============================================================================
// 전역 인스턴스 (g_ 접두사)
// ============================================================================
CL_LD2420Radar g_radarManager;

// ============================================================================
// setup / loop
// ============================================================================

void setup() {
    Serial.begin(115200);
    while (!Serial) delay(10);
    Serial.println("=== LD2420 + FreeRTOS + Hysteresis (OOP) ===");

    // HardwareSerial2 사용 (ESP32 기본: RX=16, TX=17)
    // 필요시 G_RX_PIN, G_TX_PIN 재정의
    if (g_radarManager.init(Serial2)) {
        Serial.println("✓ LD2420 initialized successfully!");
    } else {
        Serial.println("❌ Failed to initialize LD2420!");
        while (1) delay(1000);
    }
    

    // Zone 0 (Close Range) 범위를 0~30cm로 변경
    g_radarManager.setZoneRange(E_ZONE_CLOSE, 0, 50);
    // Zone 1 (Medium Range) 범위를 31~100cm로 변경
    g_radarManager.setZoneRange(E_ZONE_MIDDLE, 51, 150);
    // Zone 3 (Far Range) 범위를 31~100cm로 변경
    g_radarManager.setZoneRange(E_ZONE_FAR, 151, 300);
    // 전체 감지 범위를 0~500cm로 확장
    g_radarManager.setDistanceRange(0, 500);


    g_radarManager.printZoneInfo();
    Serial.println("Setup complete. Monitoring...\n");
}

void loop() {
    g_radarManager.run();   // 태스크 생성 + 상태 출력
}
```

---

✅ 적용된 개선 사항 및 특징

항목 적용 내용
String 제거 const char* 사용으로 힙 할당 제거
출력 포맷 수정 %lu로 unsigned long 출력
하드웨어 UART HardwareSerial 사용 (SoftwareSerial 대체)
매직넘버 제거 모든 상수 constexpr로 선언
객체지향 클래스로 캡슐화, 책임 분리
명명규칙 v_, p_, _, G_, g_, ST_..._t 완벽 적용
뮤텍스 Zone 배열 동시 접근 보호
기능 완전 포함 콜백, 필터, 히스테리시스, FreeRTOS 태스크, 상태 출력 모두 유지
ESP32-C3 호환 tskNO_AFFINITY 사용

---

🔧 사용자 설정 가이드

· UART 핀 변경: LD2420Radar.hpp의 G_RX_PIN, G_TX_PIN 값을 원하는 핀 번호로 수정하세요.
· Zone 정의: LD2420Radar.cpp 생성자 내부의 _zones 배열 초기값을 조정하세요.
· 히스테리시스 폭: G_HYST_MARGIN_CM 값을 변경하세요.
· 태스크 주기: G_TASK_FREQUENCY_MS를 조정하세요 (기본 20ms).

---


