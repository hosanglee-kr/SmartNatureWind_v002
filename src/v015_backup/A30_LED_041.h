// 소스명 : A30_LED_041.h
#pragma once

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

// 클래스 내부에서 사용할 기본 상수
inline constexpr const uint8_t  G_A30_RGBLED_PIN                = 48;
inline constexpr const uint16_t G_A30_RGBLED_NUMS               = 1;
inline constexpr const uint8_t  G_A30_RGBLED_DEFAULT_BRIGHTNESS = 20;

/**
 * @brief 독립형 RGB LED 제어 클래스
 * 외부 모듈에 의존하지 않고 점멸 로직을 스스로 관리합니다.
 */
class CL_A30_LED {
private:
    Adafruit_NeoPixel 	_pixel;
    const uint8_t     	_pin;
    const uint16_t    	_numPixels;

    uint32_t 			_lastLedMs = 0;    // 내부 타이머
    bool     			_ledState  = false; // 현재 점멸 상태 (On/Off)

public:
    /**
     * @brief 생성자
     */
    CL_A30_LED(uint8_t p_pin = G_A30_RGBLED_PIN, uint16_t p_num = G_A30_RGBLED_NUMS)
        : _pin(p_pin), _numPixels(p_num), _pixel(p_num, p_pin, NEO_GRB + NEO_KHZ800) {}

    /**
     * @brief 초기화
     */
    void begin(uint8_t p_brightness = G_A30_RGBLED_DEFAULT_BRIGHTNESS) {
        _pixel.begin();
        _pixel.setBrightness(p_brightness);
        _pixel.clear();
        _pixel.show();
    }

    /**
     * @brief LED 상태 업데이트 (Non-blocking)
     * @param p_isConnected 현재 연결 상태 (외부에서 주입)
     */
    void run(bool p_isConnected) {
        // 1. 내부에서 직접 현재 시간 참조 (독립성 확보)
        uint32_t v_now = millis();

        // 2. 상태에 따른 점멸 간격 설정
        uint32_t v_interval = p_isConnected ? 1000 : 500;

        // 3. 타이머 체크
        if (v_now - _lastLedMs >= v_interval) {
            _lastLedMs = v_now;
            _ledState  = !_ledState;

            if (_ledState) {
                // 켜짐: 연결 시 Green, 미연결 시 Red
                uint32_t v_color = p_isConnected ? _pixel.Color(0, 255, 0) : _pixel.Color(255, 0, 0);
                _pixel.setPixelColor(0, v_color);
            } else {
                // 꺼짐
                _pixel.clear();
            }
            _pixel.show();
        }
    }

    /**
     * @brief 밝기 수동 설정
     */
    void setBrightness(uint8_t p_brightness) {
        _pixel.setBrightness(p_brightness);
        _pixel.show();
    }

    /**
     * @brief 특정 색상 상시 점등
     */
    void setColor(uint8_t r, uint8_t g, uint8_t b) {
        _pixel.setPixelColor(0, _pixel.Color(r, g, b));
        _pixel.show();
    }
};
