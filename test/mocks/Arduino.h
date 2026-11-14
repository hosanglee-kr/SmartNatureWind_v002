#pragma once
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <algorithm>

typedef bool boolean;
typedef uint8_t byte;

#ifndef constrain
#define constrain(amt, low, high) ((amt) < (low) ? (low) : ((amt) > (high) ? (high) : (amt)))
#endif

#ifndef min
#define min(a, b) std::min(a, b)
#endif

#ifndef max
#define max(a, b) std::max(a, b)
#endif

inline unsigned long millis(void) {
    return 0;
}

#ifndef strlcpy
inline size_t strlcpy(char *dst, const char *src, size_t siz) {
    char *d = dst;
    const char *s = src;
    size_t n = siz;
    if (n != 0) {
        while (--n != 0) {
            if ((*d++ = *s++) == '\0')
                break;
        }
    }
    if (n == 0) {
        if (siz != 0)
            *d = '\0';
        while (*s++)
            ;
    }
    return (s - src - 1);
}
#endif

#include <stdio.h>
#include <stdarg.h>

class Print {
public:
    virtual size_t write(uint8_t) { return 1; }
    inline int printf(const char *format, ...) {
        va_list arg;
        va_start(arg, format);
        int res = vprintf(format, arg);
        va_end(arg);
        return res;
    }
};

class HardwareSerial : public Print {};
inline HardwareSerial Serial;

class ESPClass {
public:
    inline uint32_t getFreeHeap() { return 100000; }
};
inline ESPClass ESP;


