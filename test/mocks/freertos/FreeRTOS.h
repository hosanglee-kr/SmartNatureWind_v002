#pragma once
#include <stdint.h>

typedef void* SemaphoreHandle_t;
typedef uint32_t TickType_t;

#define portMAX_DELAY 0xFFFFFFFF
#define portENTER_CRITICAL(mux)
#define portEXIT_CRITICAL(mux)

typedef int portMUX_TYPE;
#define portMUX_INITIALIZER_UNLOCKED 0
