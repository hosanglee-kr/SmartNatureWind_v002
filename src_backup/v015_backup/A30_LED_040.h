// 소스명 : A30_LED_040.h

#pragma once
#include <Arduino.h>



#include <Arduino.h>
#include <Adafruit_NeoPixel.h>


inline constexpr const uint8_t 	G_A30_RGBLED_PIN 					= 48;
inline constexpr const uint16_t G_A30_RGBLED_NUMS   				= 1;

inline constexpr const uint8_t 	G_A30_RGBLED_DEFAULT_BRIGHTNESS   	= 20;

/**
 * @brief ESP32 내장 RGB LED(NeoPixel) 제어 클래스
 * Wi-Fi 상태에 따라 색상 및 점멸 속도를 변경합니다.
 */
class CL_A30_LED {
  private:
    // 상수 정의
    // static constexpr uint8_t DEFAULT_BRIGHTNESS = 20;

    // 멤버 변수
    Adafruit_NeoPixel 	_pixel;
    const uint8_t     	_pin;
    const uint16_t    	_numPixels;

    uint32_t 			_lastLedMs 	= 0;
    bool     			_ledState  	= false;

  public:
    /**
     * @param pin LED 연결 핀 (기본값: 48)
     * @param num LED 개수 (기본값: 1)
     */
    CL_A30_LED(uint8_t p_pin = G_A30_RGBLED_PIN, uint16_t p_num = G_A30_RGBLED_NUMS)
        : _pin(p_pin), _numPixels(p_num), _pixel(p_num, p_pin, NEO_GRB + NEO_KHZ800) {}

		// CL_A30_LED(uint8_t p_pin = 48, uint16_t p_num = 1)
    //     : _pin(p_pin), _numPixels(p_num), _pixel(p_num, p_pin, NEO_GRB + NEO_KHZ800) {}

    /**
     * @brief LED 초기화
     * @param brightness 밝기 설정 (0~255)
     */
    void begin(uint8_t p_brightness = G_A30_RGBLED_DEFAULT_BRIGHTNESS) {
        _pixel.begin();
        _pixel.setBrightness(p_brightness);
        _pixel.show(); // 초기 상태 끔
    }

    /**
     * @brief 주기적 LED 갱신 로직 (Non-blocking)
     * @param p_now 현재 millis() 값
     */
    void run(uint32_t p_now) {
        // 1. Wi-Fi 상태 확인 (외부 클래스 참조)
        // Note: CL_WF10_WiFiManager 클래스가 정의되어 있어야 합니다.
        bool isConnected = CL_WF10_WiFiManager::isStaConnected();

        // 2. 상태에 따른 간격 설정 (연결됨: 1000ms, 연결 안 됨: 500ms)
        uint32_t interval = isConnected ? 1000 : 500;

        // 3. 타이머 체크
        if (p_now - _lastLedMs >= interval) {
            _lastLedMs = p_now;
            _ledState  = !_ledState; // 상태 반전

            if (_ledState) {
                if (isConnected) {
                    // Wi-Fi 연결됨: 녹색 (Green)
                    _pixel.setPixelColor(0, _pixel.Color(0, 255, 0));
                } else {
                    // Wi-Fi 연결 안 됨: 빨간색 (Red)
                    _pixel.setPixelColor(0, _pixel.Color(255, 0, 0));
                }
            } else {
                // LED 끄기
                _pixel.clear();
            }

            _pixel.show();
        }
    }

    // 필요 시 색상을 수동으로 변경하기 위한 헬퍼 함수
    void setColor(uint8_t r, uint8_t g, uint8_t b) {
        _pixel.setPixelColor(0, _pixel.Color(r, g, b));
        _pixel.show();
    }

	// 필요 시 색상을 수동으로 변경하기 위한 헬퍼 함수
    void setBrightness(uint8_t p_brightness) {
        _pixel.setBrightness(p_brightness);
        _pixel.show(); // 초기 상태 끔
    }
};




// 전역 인스턴스 선언 (선택 사항)
// 외부에서 접근하기 쉽도록 전역 객체를 하나 생성해 둡니다.
// CL_A30_LED g_A00_ledControl(48, 1);

//////////////////////////////

// #include <Adafruit_NeoPixel.h>
// constexpr int G_A00_RGBLED_PIN 		= 48; // RGB LED (ESP32 보드용)
// //constexpr int G_A00_LED_PIN = 38; // 내장 LED (ESP32 보드용)

// #define G_A00_RGBLED_PIXELS_NUMS   	1

// Adafruit_NeoPixel g_A00_rgbLED(G_A00_RGBLED_PIXELS_NUMS, G_A00_RGBLED_PIN, NEO_GRB + NEO_KHZ800);

// // void A00_LED_init();
// // void A00_LED_run(uint32_t p_now);

// void A00_LED_init(){
// 	g_A00_rgbLED.begin();
// 	g_A00_rgbLED.setBrightness(20);

//     //pinMode(G_A00_LED_PIN, OUTPUT);
//     // digitalWrite(G_A00_LED_PIN, LOW);

// }

// void A00_LED_run(uint32_t p_now){
// 	static uint32_t v_lastLedMs     = 0;
// 	static bool v_ledState = false; // LED 켜짐/꺼짐 상태 저장

// 		// 1. Wi-Fi 상태에 따라 깜빡임 주기 결정
//     // 연결됨: 1000ms (1초), 연결 안 됨: 500ms
//     bool isConnected = CL_WF10_WiFiManager::isStaConnected();
//     uint32_t v_interval = isConnected ? 1000 : 500;

//     // 2. 타이머 체크
//     if (p_now - v_lastLedMs >= v_interval) {
//         v_lastLedMs = p_now;
//         v_ledState = !v_ledState; // 상태 반전 (Toggle)

//         if (v_ledState) {
//             // LED 켜기 (상태에 따른 색상 지정)
//             if (isConnected) {
//                 // 연결됨: 녹색 (Green)
//                 g_A00_rgbLED.setPixelColor(0, g_A00_rgbLED.Color(0, 255, 0));
//             } else {
//                 // 연결 안 됨: 빨간색 (Red)
//                 g_A00_rgbLED.setPixelColor(0, g_A00_rgbLED.Color(255, 0, 0));
//             }
//         } else {
//             // LED 끄기
//             g_A00_rgbLED.clear();
//         }

//         // 실제 LED에 적용
//         g_A00_rgbLED.show();

//         // digitalWrite(G_A00_LED_PIN, CL_WF10_WiFiManager::isStaConnected() ? HIGH : LOW);
//     }

// }
