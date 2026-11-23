# `S20_WindSolver_0203.h` 상세 Spec

## ⚙️ 시스템 스펙 요약: S20_WindSolver_0203.h

**10종 자연풍 프리셋 × 5종 바람 스타일 × 사용자 오버라이드(고정/배수)**를 단일 물리 파라미터 구조체(`ST_A20_ResolvedWind_t`)로 해석·결합하는 헤더 전용 솔버(`S20_resolveWindParams`)입니다.

### 💾 구조체 및 타입 정의 (Structs & Types)

*   **`ST_A20_WindDict_t` / `ST_A20_PresetEntry_t` / `ST_A20_StyleEntry_t`**
    *   **설명:** 10종 프리셋과 5종 스타일의 기저 풍속, 난류, 돌풍 배수를 담는 바람 사전 구조체입니다.
    *   **사용처:** `S20_resolveWindParams()`에서 프리셋/스타일 인덱스를 조회하고 배수를 곱하는 데 사용됩니다.
*   **`ST_A20_ResolvedWind_t`**
    *   **설명:** 최종 해석된 물리 파라미터(강도, 변동성, 돌풍, 최소/최대 풍속 클램프)를 담는 출력 구조체입니다.
    *   **사용처:** `CL_S10_Simulation::applyResolvedWind()`로 전달되어 실제 팬 물리 엔진을 구동합니다.

### 🛠️ 함수 정의 및 시그니처 (Functions & Signatures)

| 함수명 | 반환 타입 | 주요 기능 | 핵심 로직/특징 |
| :--- | :--- | :--- | :--- |
| **`S20_resolveWindParams`** | `inline bool` | 프리셋 코드, 스타일 코드, 선택적 오버라이드를 결합해 `ST_A20_ResolvedWind_t`를 산출합니다. | 1. `A22_Com_Lookup_0203.h`로 프리셋(`v_pi`)과 스타일(`v_si`)을 조회합니다. <br>2. 스타일 배수(Intensity/Variability/Gust)와 오버라이드 값을 적용한 뒤 `clampVal<float>(..., 0.0f, 100.0f)`로 안전 범위를 보장합니다. |

### 📚 포함 헤더 및 외부 의존성 (Includes & Dependencies)

*   **`"A20_Const_0203.h"`**:
    *   `ST_A20_WindDict_t`, `ST_A20_ResolvedWind_t` 등 바람 사전·해석 구조체 정의를 제공합니다.
*   **`"A40_Com_Utils_0203.h"`**:
    *   `A40_ComFunc::clampVal<float>` 범위 보정에 사용됩니다.
*   **`"A22_Com_Lookup_0203.h"`**:
    *   프리셋·스타일 코드 문자열을 인덱스로 변환하는 룩업 함수를 제공합니다.
