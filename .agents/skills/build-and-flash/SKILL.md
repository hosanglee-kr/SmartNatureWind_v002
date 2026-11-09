---
name: build-and-flash
description: "v0203 펌웨어 및 LittleFS 파일시스템 빌드/플래시. PlatformIO -j 12 병렬 빌드, 링크 무결성 검증, 잔존 참조 grep, 리소스 예산 확인 포함."
---

# 빌드 + 플래시

## 펌웨어 빌드 및 업로드

```bash
# 기본 타깃 (ESP32-S3 Zero - 4MB Flash / 2MB PSRAM)
pio run -e esp32-s3-zero -j 12
pio run -e esp32-s3-zero -j 12 --target upload

# 서브 타깃 (ESP32-C3 Zero - 4MB Flash / No PSRAM)
pio run -e esp32-c3-zero -j 12
pio run -e esp32-c3-zero -j 12 --target upload

# 대형 보드 참조 (ESP32-S3-N16R8 - 16MB Flash / 8MB PSRAM)
pio run -e esp32-s3-n16r8 -j 12
```

## 파일시스템 (LittleFS)

```bash
# 기본 타깃
pio run -e esp32-s3-zero -j 12 --target uploadfs

# C3 타깃
pio run -e esp32-c3-zero -j 12 --target uploadfs
```

> ⚠️ `pio run --target upload` (펌웨어만 업로드) 시 프론트엔드 번들/Gzip은 갱신되지 않습니다.
> FE 정적 자산 변경 후에는 반드시 `uploadfs`를 실행해야 합니다.

## 링크 무결성 검증

```bash
pio run -e esp32-s3-zero 2>&1 | grep -iE "undefined|multiple"
# 기대: 0건
```

## 잔존 참조 검증

```bash
grep -rn "_0203\." src/v0203/*.h src/v0203/*.cpp | grep -v "\.md\|data_v0203"
# 기대: 0건
```

## B-2 화이트리스트 위반 검증

```bash
grep -rn "g_A20_config_root\." src/v0203/W10_Web_Routes_*_0203.cpp | grep -v "getRootSnapshot"
# 기대: 0건
```

## A-2 캡슐화 위반 검증

```bash
grep -rn "s_control->sim\.\|s_control->motion->" src/v0203/*.cpp
# 기대: 0건
```
