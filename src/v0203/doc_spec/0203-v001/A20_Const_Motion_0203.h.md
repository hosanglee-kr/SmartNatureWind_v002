# `A20_Const_Motion_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: A20_Const_Motion_0203.h



MOTION 설정 구조체 정의 및 시뮬레이션 파라미터 (cfg_motion_xxx.json) 를 camelCase 정합하여 영구 저장/복원용 데이터 모델링을 수행합니다.

### 💾 구조체 및 타입 정의 (Structs & Types)
*   **ST_A20_MotPirCfg_t**: MOTION 활성화 (`enabled`) 및 홀드 시간 (`holdSec`) 설정.
*   **ST_A20_MotTiming_t**: 시뮬레이션 (`simIntervalMs`), 돌풍 (`gustIntervalMs`), 열 (`thermalIntervalMs`) 간격 정의.
*   **ST_A20_MotSimCfg_t**: [NEW] 시뮬레이션 파라미터 (presetCode, styleCode, fanPowerEnabled 등 13 개 변수) 로 재부팅 시 소실 방지 및 부팅 복원용 데이터.
*   **ST_A20_MotionConfig_t**: 위 세 구조체를 포함하는 상위 설정 컨테이너.


### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

*   **구조체 정의 (Struct Definition)**: JSON 파싱 결과와 C++ 내부 로직을 연결하는 데이터 포맷팅 역할 수행.
*   **영구 저장/복원 동작**: `ST_A20_MotSimCfg_t` 내 변수들이 config 파일에 저장되어 재부팅 시에도 설정이 유지되도록 보장합니다.


### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **외부 의존성**: `A20_Const::MAX_CODE_LEN` (상수 정의), `A20_Const_MotionConfig_t` (상위 헤더 포함).
*   **공유 상태/락**: 본 파일은 순수 데이터 구조체 정의이며, 함수 구현이 없어 공유 상태 관리나 락(Mutex) 관련 로직은 없습니다.
