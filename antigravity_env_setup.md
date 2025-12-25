# 🌌 Antigravity 환경 설정 가이드

이 문서는 **Smart Nature Wind (v015)** 프로젝트의 개발 환경 및 설정을 요약한 문서입니다. Antigravity(AI 코딩 어시스턴트)와 함께 프로젝트를 효율적으로 진행하기 위한 가이드라인을 제공합니다.

---

## 🏗️ 1. 개발 환경 개요

| 항목 | 상세 내용 |
|------|-----------|
| **하드웨어** | ESP32-S3 (esp32-s3-zero / devkitc-1 기반) |
| **프레임워크** | Arduino Framework |
| **빌드 도구** | PlatformIO |
| **파일 시스템** | LittleFS (4MB Flash 제약에 최적화) |
| **현재 버전** | **v015** (standalone 통합 버전) |

---

## 📁 2. 프로젝트 소스 구조

현재 프로젝트는 `src/v015` 폴더를 중심으로 구성되어 있습니다.

- `src/main.cpp`: 메인 진입점. `v015` 모듈을 초기화하고 루프를 실행합니다.
- `src/v015/`: 실제 프로젝트 로직이 포함된 핵심 디렉토리.
  - `A00_Main_040.h`: 메인 컨트롤러 및 초기화 로직.
  - `W10_Web_...`: Web API 및 Web UI 서버 로직.
  - `S10_Simul_...`: 물리 엔진 및 바람 시뮬레이션 알고리즘.
  - `CT10_Control_...`: 장치 제어 및 상태 관리 레이어.
  - `data_v015/`: LittleFS에 업로드될 정적 자산 및 설정 파일들.

---

## ⚙️ 3. 주요 설정 (`platformio.ini`)

`platformio.ini` 파일에는 빌드 및 업로드를 위한 핵심 설정이 포함되어 있습니다.

### 핵심 빌드 플래그
- `-DARDUINO_USB_CDC_ON_BOOT=1`: USB 네이티브 포트 사용 시 디버깅 활성화.
- `-std=gnu++17`: 최신 C++ 기능을 사용하기 위한 설정.
- `-DCONFIG_BT_NIMBLE_ENABLED=1`: 메모리 효율적인 NimBLE 스택 사용.

### 소스 필터 (Source Filter)
```ini
build_src_filter =
    +<*>                ; 모든 소스 포함
    -<v014_backup/>     ; 백업 폴더 제외
    -<v015_backup/>
    -<v014/>
```
> [!IMPORTANT]
> 프로젝트 작업 시 `src/v015` 외의 다른 버전 폴더는 컴파일에서 제외되도록 설정되어 있습니다.

---

## 🛠️ 4. 빌드 및 배포 가이드

1. **컴파일/빌드**: `pio run` (또는 VS Code PlatformIO 아이콘 → Build)
2. **펌웨어 업로드**: `pio run --target upload`
3. **파일시스템(LittleFS) 업로드**: `pio run --target uploadfs`
   - UI 수정이나 초기 설정 파일(`json`) 변경 시 반드시 수행해야 합니다.
4. **시리얼 모니터**: `pio device monitor` (115200 baud)

---

## 🤖 5. Antigravity와 협업 팁

- **버전 관리**: 새로운 대규모 수정을 시작할 때는 `v016`과 같이 폴더를 복제하여 작업을 진행할 수 있습니다. 이때 `platformio.ini`의 `build_src_filter`를 업데이트해야 합니다.
- **코드 수정 시**: Antigravity에게 특정 모듈(예: "Web API 수정해줘")에 대한 작업을 요청하면, 관련성 있는 `src/v015/W10_...` 파일을 찾아 수정합니다.
- **로그 확인**: `CL_D10_Logger`를 통한 로그 출력 방식을 준수하여 디버깅 완성도를 높입니다.

---

## 🌿 제품 컨셉: 산들바람 (Smart Nature Wind)
이 프로젝트는 단순한 선풍기 제어를 넘어, 실제 대기역학(난류 모델링, 열기포 등)을 모사하여 **공간에 자연스러운 숨결**을 불어넣는 것을 목표로 합니다.
