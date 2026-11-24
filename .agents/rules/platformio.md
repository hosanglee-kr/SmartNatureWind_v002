# PlatformIO 빌드 및 디버깅 규칙

## 1. 실행 환경
- **실행 파일**: `pio`가 PATH에 없으면 `C:\Users\A003comlhsd\.platformio\penv\Scripts\pio.exe`를 사용한다.
- **샌드박스**: PlatformIO는 워크스페이스 외부(`%USERPROFILE%\.platformio\`)의 툴체인·라이브러리에 접근하므로, `pio` 명령은 반드시 `BypassSandbox: true`로 실행한다.

## 2. 기본 빌드 / 업로드 명령
- **빌드**: `pio run -e esp32-s3-zero -j 12`
- **펌웨어 업로드**: `pio run -e esp32-s3-zero -j 12 --target upload`
- **LittleFS 업로드**: `pio run -e esp32-s3-zero -j 12 --target uploadfs`

## 3. CLI 디버깅 및 안전 규칙
- **비대화형 디버깅**: GUI 버튼 대신 터미널에서 `pio debug --interface=gdb -x gdbinit.txt` 형태로 배치 실행해 로그를 수집한다.
- **포트 점유 충돌 방지**: `pio device monitor`가 실행 중이면 `upload` 또는 `pio debug` 실행 시 `PermissionError`가 발생하므로, 반드시 기존 모니터 프로세스를 종료한 뒤 실행한다.
- **빌드 모드 원복**: 디버깅용 `build_type = debug`(`-O0`)를 사용한 경우, 디버깅 완료 후 릴리즈 빌드(`-O2` 또는 `-Os`)로 복구하여 최종 검증한다.
