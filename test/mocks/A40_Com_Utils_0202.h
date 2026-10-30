#pragma once
#include <algorithm>
#include <string.h>

namespace A40_ComFunc {
    template <typename T>
    inline T clampVal(T p_val, T p_min, T p_max) {
        if (p_val < p_min) return p_min;
        if (p_val > p_max) return p_max;
        return p_val;
    }
}
