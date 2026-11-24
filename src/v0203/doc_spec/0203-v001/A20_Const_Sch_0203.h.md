# `A20_Const_Sch_0203.h` 상세 Spec

### 파일 역할 요약

`A20_Const.h`는 ESP32-S3 C++17 임베디드 시스템에서 사용되는 상수 및 구조체를 정의합니다. 이 파일은 다음과 같은 주요 구성 요소를 포함하고 있습니다:

- **상수 선언**: 다양한 상태, 설정 및 규칙을 나타내는 상수입니다.
- **구조체 정의**: 각 상수에 대한 구조체가 정의되어 있으며, 필요한 데이터를 저장합니다.
- **함수 정의**: 특정 기능을 수행하는 함수들이 정의되어 있습니다.

### 주요 클래스/구조체/열거형

1. **상수 선언**:
   - `EN_A20_control_runMode_t`: 컨트롤 모드를 나타내는 열거형입니다.
   - `EN_A20_WindPhase_t`, `ST_A20_WindPhase_t`: 바람 상태를 나타내는 열거형과 구조체입니다.
   - `EN_A20_WindPreset_t`, `ST_A20_WindPreset_t`: 바람 설정을 나타내는 열거형과 구조체입니다.
   - `EN_A20_WindStyle_t`, `ST_A20_WindStyles_t`: 바람 스타일을 나타내는 열거형과 구조체입니다.
   - `ST_A20_PresetEntry_t`, `ST_A20_StyleEntry_t`, `ST_A20_WindDict_t`: 바람 설정 및 스타일 정보를 저장하는 구조체입니다.
   - `EN_A20_step_type_t`, `ST_A20_StepType_t`: 단계 유형을 나타내는 열거형과 구조체입니다.
   - `EN_A20_segment_mode_t`, `ST_A20_SegmentMode_t`: 세그먼트 모드를 나타내는 열거형과 구조체입니다.
   - `ST_A20_ThresholdRule_t`, `ST_A20_Pir_t`, `ST_A20_TriggerSmartComfort_t`: 규칙 및 PIR 정보를 저장하는 구조체입니다.

2. **구조체 정의**:
   - `ST_A20_WindPresetFactors_t`: 바람 설정에 대한 다양한 파라미터를 저장하는 구조체입니다.
   - `ST_A20_StyleFactors_t`: 바람 스타일에 대한 다양한 파라미터를 저장하는 구조체입니다.

3. **함수 정의**:
   - `G_A20_WindPhase_Arr`, `G_A20_WindPreset_Arr`, `G_A20_WindStyle_Arr`, `G_A20_StepType_Arr`, `G_A20_SegmentMode_Arr`: 각 열거형의 배열을 정의합니다.

### 주요 함수/메서드 및 동작

- **상수 선언**:
  - 모든 상수는 `constexpr`로 선언되어, 컴파일 시간에 계산됩니다.
  
- **구조체 정의**:
  - 각 구조체는 필요한 데이터를 저장합니다. 예를 들어, `ST_A20_WindPresetFactors_t`는 바람 설정에 대한 다양한 파라미터를 저장하며, `ST_A20_StyleEntry_t`는 바람 스타일 정보를 저장합니다.

- **함수 정의**:
  - 모든 함수는 필요한 기능을 수행합니다. 예를 들어, `G_A20_WindPhase_Arr`, `G_A20_WindPreset_Arr`, `G_A20_WindStyle_Arr`는 각 열거형의 배열을 정의하며, `G_A20_StepType_Arr`, `G_A20_SegmentMode_Arr`는 각 열거형의 배열을 정의합니다.

### 외부 의존성 / 공유 상태 / 락(Mutex 등) 특이사항

- **외부 의존성**: 이 파일은 Arduino.h를 포함하고 있습니다.
- **공유 상태**: 모든 구조체와 함수는 공유 상태를 사용하지 않습니다. 각각의 데이터는 필요한 시점에만 접근됩니다.
- **락(Mutex 등)**: 이 파일에서는 락을 사용하지 않습니다.

이 파일은 ESP32-S3 C++17 임베디드 시스템에서 바람 설정 및 스타일 관리에 필요한 상수, 구조체, 함수를 정의하고 있습니다.
