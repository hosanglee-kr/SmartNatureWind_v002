# `A40_Com_Utils_IO_0203.cpp` 상세 Spec

### 파일 역할 요약 (1~2줄)

`A40_IO::Save_File2JsonDoc_V21.cpp`는 ESP32-S3 C++17 임베디드 시스템에서 데이터를 저장하고 로드하는 라이브러리입니다. 이 파일은 원자적 파일 저장 및 2중 백업 기능을 제공합니다.

### 주요 운영 정책 요약

1. **저장 시 임시 파일(.tmp)에 우선 직렬화 후 교체하여 쓰기 도중 전원 차단 시 손상 방지**
2. **로드 시 메인 파일이 없거나 JSON 파싱 실패 시 메인 파일을 복구**
3. **로그 태그 형식을 준수하여 호출자 정보를 로깅**
4. **버퍼 및 메모리 안정성: "HH:MM" 형태의 문자열에서 센트(minute) 단위 안의 시간 정보를 저장하고, 백업 파일은 자동 복구**

### 주요 함수

1. `Save_File2JsonDoc_V21`
2. `_parseJsonFileToDoc`
3. `_buildPathWithSuffix`

### 주요 변수 및 상수

- `A40_Const::LEN_PATH` : 경로 길이
- `EN_L10_LOG_ERROR` : 에러 로깅 태그
- `p_path` : 파일 경로
- `p_suffix` : 백업 파일 접미어
- `v_caller` : 호출자 이름

### 주요 구조체 및 클래스

- `CL_D10_Logger` : 로깅 클래스
