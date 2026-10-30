#pragma once
#include <stddef.h>
#include <stdint.h>

class Stream {
public:
    virtual int available() { return 0; }
    virtual int read() { return -1; }
    virtual size_t write(uint8_t) { return 0; }
    virtual size_t write(const uint8_t *buffer, size_t size) { return size; }
};
