#pragma once
#include "FreeRTOS.h"

inline SemaphoreHandle_t xSemaphoreCreateRecursiveMutex() {
    return (SemaphoreHandle_t)1;
}

inline int xSemaphoreTakeRecursive(SemaphoreHandle_t handle, TickType_t timeout) {
    return 1;
}

inline int xSemaphoreGiveRecursive(SemaphoreHandle_t handle) {
    return 1;
}
