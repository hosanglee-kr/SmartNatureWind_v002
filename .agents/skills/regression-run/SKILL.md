---
name: regression-run
description: "v0203 회귀 테스트 실행. TEST_PLAN L1~L11 레이어별 항목, 릴리스 차단 필수 세트, e2e_stage8_4.py 디바이스 자동화 및 e2e_ui_browser_check_0203.cjs 웹 UI Playwright 자동화. 사용자가 '회귀 돌려', 'T-1 검증', '릴리스 게이트', 'UI 점검' 등을 요청할 때 사용."
---

# 회귀 테스트 실행

## 1. 프론트엔드 / 웹 UI Playwright E2E 점검
PC 데스크톱(1280x800) 및 안드로이드 모바일(412x915) 환경에서 반응형 레이아웃, 3탭 전환, 드로어 인터랙션, 터치 타깃, 콘솔 에러를 점검합니다.

```bash
# Node.js 직접 실행
node test/e2e_ui_browser_check_0203.cjs

# 또는 윈도우 원클릭 스크립트
test\run_ui_check_0203.bat
```
- **결과 산출물**: `test/reports_ui/screenshot_desktop.png`, `test/reports_ui/screenshot_mobile.png`
- **합격 판정 기준**: 21개 세부 점검 항목 100% PASS 및 브라우저 콘솔 에러 0건

## 2. 하드웨어 / 디바이스 통신 E2E 회귀 테스트
실제 ESP32 하드웨어 보드가 네트워크에 연결되어 있을 때 T-114 ~ T-120 (Stage 8 AI 및 핵심 REST API) 7대 시나리오를 일괄 점검합니다.

```bash
python test/e2e_stage8_4.py <DEVICE_IP>
```

## 3. CBD 계약 문서 검증 게이트
```bash
python src/v0203/tools_0203/commit_contracts_0203.py --dry-run --strict
```
