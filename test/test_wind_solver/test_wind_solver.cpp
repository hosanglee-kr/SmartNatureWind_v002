#include <unity.h>
#include <stdint.h>
#include <string.h>

#include "A20_Const_Const_0202.h"
#include "A20_Const_Sch_0202.h"
#include "A22_Com_Lookup_0202.h"
#include "S20_WindSolver_0202.h"

static ST_A20_WindDict_t s_testDict;

void setUp(void) {
    memset(&s_testDict, 0, sizeof(s_testDict));

    // Preset 1: OCEAN
    s_testDict.presetCount = 1;
    strlcpy(s_testDict.presets[0].code, "OCEAN", sizeof(s_testDict.presets[0].code));
    strlcpy(s_testDict.presets[0].name, "Ocean Breeze", sizeof(s_testDict.presets[0].name));
    s_testDict.presets[0].factors.windIntensity = 40.0f;
    s_testDict.presets[0].factors.windVariability = 20.0f;
    s_testDict.presets[0].factors.gustFrequency = 15.0f;
    s_testDict.presets[0].factors.fanLimit = 80.0f;
    s_testDict.presets[0].factors.minFan = 20.0f;
    s_testDict.presets[0].factors.turbulenceLengthScale = 2.0f;
    s_testDict.presets[0].factors.turbulenceIntensitySigma = 0.5f;
    s_testDict.presets[0].factors.thermalBubbleStrength = 1.0f;
    s_testDict.presets[0].factors.thermalBubbleRadius = 2.0f;

    // Style 1: STRONG
    s_testDict.styleCount = 1;
    strlcpy(s_testDict.styles[0].code, "STRONG", sizeof(s_testDict.styles[0].code));
    strlcpy(s_testDict.styles[0].name, "Strong Wind", sizeof(s_testDict.styles[0].name));
    s_testDict.styles[0].factors.intensityFactor = 1.5f;
    s_testDict.styles[0].factors.variabilityFactor = 1.2f;
    s_testDict.styles[0].factors.gustFactor = 2.0f;
    s_testDict.styles[0].factors.thermalFactor = 1.0f;
}

void tearDown(void) {}

// Case 1: 유효한 Preset + Style 적용 검증
void test_resolveWindParams_valid_preset_and_style(void) {
    ST_A20_ResolvedWind_t out;
    bool success = S20_resolveWindParams(s_testDict, "OCEAN", "STRONG", nullptr, out);

    TEST_ASSERT_TRUE(success);
    TEST_ASSERT_TRUE(out.valid);
    TEST_ASSERT_EQUAL_STRING("OCEAN", out.presetCode);
    TEST_ASSERT_EQUAL_STRING("STRONG", out.styleCode);

    // 40.0 * 1.5 = 60.0
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 60.0f, out.windIntensity);
    // 20.0 * 1.2 = 24.0
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 24.0f, out.windVariability);
    // 15.0 * 2.0 = 30.0
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 30.0f, out.gustFrequency);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 80.0f, out.fanLimit);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 20.0f, out.minFan);
}

// Case 2: 존재하지 않는 Preset 코드 입력 시 안전 실패 검증
void test_resolveWindParams_invalid_preset(void) {
    ST_A20_ResolvedWind_t out;
    bool success = S20_resolveWindParams(s_testDict, "UNKNOWN_PRESET", "STRONG", nullptr, out);

    TEST_ASSERT_FALSE(success);
    TEST_ASSERT_FALSE(out.valid);
}

// Case 3: Style 없이 기본 Preset만 적용 검증
void test_resolveWindParams_no_style(void) {
    ST_A20_ResolvedWind_t out;
    bool success = S20_resolveWindParams(s_testDict, "OCEAN", nullptr, nullptr, out);

    TEST_ASSERT_TRUE(success);
    TEST_ASSERT_TRUE(out.valid);
    // Style 미지정 시 원래 Preset 기본값 유지 (40.0)
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 40.0f, out.windIntensity);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 20.0f, out.windVariability);
}

// Case 4: AdjustDelta 적용 및 FanLimit / MinFan 경계값 보정 검증
void test_resolveWindParams_adjust_and_clamping(void) {
    ST_A20_AdjustDelta_t adj;
    memset(&adj, 0, sizeof(adj));
    adj.windIntensity = 50.0f; // 40.0 + 50.0 = 90.0
    adj.fanLimit = -40.0f;     // 80.0 - 40.0 = 40.0
    adj.minFan = 30.0f;        // 20.0 + 30.0 = 50.0 -> minFan(50) > fanLimit(40) => minFan은 40으로 보정되어야 함!

    ST_A20_ResolvedWind_t out;
    bool success = S20_resolveWindParams(s_testDict, "OCEAN", nullptr, &adj, out);

    TEST_ASSERT_TRUE(success);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 90.0f, out.windIntensity);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 40.0f, out.fanLimit);
    // 핵심 비즈니스 룰: minFan <= fanLimit 강제 보정 검증
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 40.0f, out.minFan);
}

int main(int argc, char **argv) {
    UNITY_BEGIN();
    RUN_TEST(test_resolveWindParams_valid_preset_and_style);
    RUN_TEST(test_resolveWindParams_invalid_preset);
    RUN_TEST(test_resolveWindParams_no_style);
    RUN_TEST(test_resolveWindParams_adjust_and_clamping);
    return UNITY_END();
}
