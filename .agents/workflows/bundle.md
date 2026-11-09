# 프론트엔드 번들 + Gzip

## 단계
1. FE 소스 수정 (`data_v0203_src/html_v0203/`)
2. `python src/v0203/tools_0203/check_i18n.py --strict` (선택, pio_gzip 내부에서 자동)
3. `python src/v0203/tools_0203/pio_gzip_0203.py`
4. `pio run -e esp32-s3-n16r8 -j 12 --target uploadfs`

## 검증
