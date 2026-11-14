# 빌드 + 플래시

## 펌웨어 빌드 및 업로드

```bash
# 기본 타깃 (ESP32-S3 Zero)
pio run -e esp32-s3-zero -j 12
pio run -e esp32-s3-zero -j 12 --target upload

# 서브 타깃 (ESP32-C3 Zero)
pio run -e esp32-c3-zero -j 12
pio run -e esp32-c3-zero -j 12 --target upload
```

## 파일시스템 업로드

```bash
pio run -e esp32-s3-zero -j 12 --target uploadfs
```
