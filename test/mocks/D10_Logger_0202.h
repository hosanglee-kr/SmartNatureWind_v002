#pragma once
#include <stdint.h>

typedef enum : uint8_t {
    EN_L10_LOG_NONE  = 0,
    EN_L10_LOG_ERROR = 1,
    EN_L10_LOG_WARN  = 2,
    EN_L10_LOG_INFO  = 3,
    EN_L10_LOG_DEBUG = 4
} EN_L10_LogLevel_t;

class CL_D10_Logger {
public:
    static inline void log(EN_L10_LogLevel_t level, const char* fmt, ...) {}
};
