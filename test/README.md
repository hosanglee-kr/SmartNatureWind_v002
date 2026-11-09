# 🧪 SmartNatureWind v0203 — 테스트 도구 체계 (test/)

이 디렉터리는 SmartNatureWind v0203 시스템의 **백엔드/하드웨어 통신 E2E** 및 **프론트엔드/브라우저 UI E2E** 검증 도구를 제공합니다.

---

## 📁 디렉터리 구성

| 파일/폴더 | 설명 | 주요 대상 |
|---|---|---|
| `e2e_ui_browser_check_0203.cjs` | **PC 및 안드로이드 브라우저 UI/UX 자동 점검기 (Playwright)** | 데스크톱(1280x800) / 모바일(412x915) 렌더링, 3탭 전환, 드로어, 콘솔 클린 |
| `run_ui_check_0203.bat` | 윈도우 원클릭 UI 검증 실행 배치 파일 | 더블클릭 또는 cmd/powershell 실행 |
| `run_ui_check_0203.ps1` | PowerShell UI 검증 스크립트 | 파라미터(`-Port`, `-Headless`) 지원 |
| `e2e_stage8_4.py` | ESP32 실제 보드 대상 REST/WebSocket E2E 회귀 테스트 | AI 제어, Tool Calling, 오프라인 Mock 등 Stage 8 회귀 |
| `reports_ui/` | 브라우저 점검 결과 스크린샷 보관 디렉터리 | `screenshot_desktop.png`, `screenshot_mobile.png` |
| `mocks/` | ESP32 단위 테스트용 목(Mock) 헤더/소스 | 네이티브 단위 테스트 환경 |
| `test_wind_solver/` | 자연풍 수치 해석 솔버 단위 검증 스위트 | 물리 연산 정밀도 검증 |

---

## 🚀 프론트엔드/브라우저 UI 검증 실행 방법

### 방법 1: 배치 파일 (가장 간편)
```cmd
test\run_ui_check_0203.bat
```

### 방법 2: PowerShell
```powershell
.\test\run_ui_check_0203.ps1
```

### 방법 3: Node.js 직접 실행
```bash
node test/e2e_ui_browser_check_0203.cjs [--port 8899] [--headless]
```

### 점검 항목 (총 21개 세부 규약)
1. **데스크톱 (PC 1280x800)**:
   - ADR-10 영구 사이드바 2열 그리드 레이아웃 유지 (`display: flex`)
   - 데스크톱 화면에서 햄버거 메뉴 버튼 숨김 (`display: none`)
   - 데스크톱 화면에서 모바일 하단 내비게이션 바 숨김 (`display: none`)
   - 대시보드 3탭([제어], [환경], [프리셋]) 렌더링 및 클릭 인터랙션
   - [환경] 탭 내 센서 카드 및 [Comfort 자동 모드] 스위치 렌더링
   - [프리셋] 탭 내 스타일 셀렉터 및 10대 자연풍 프리셋 그리드 렌더링
   - ⏱️ 퀵 타이머 버튼 및 Now Playing Bar 표출
   - 데스크톱 콘솔 에러 0건 (Clean)
2. **모바일 (안드로이드 Pixel 7, 412x915)**:
   - 모바일 반응형 뷰포트 렌더링
   - 하단 내비게이션 바(Bottom Nav) 고정 표시
   - 사이드바 초기 오프스크린 숨김 처리
   - 헤더 햄버거 메뉴 터치 시 사이드바 드로어 오픈 (`body.snw-sidebar-open`)
   - 햄버거 메뉴 재터치 시 사이드바 정상 닫힘
   - 모바일 대시보드 3탭 원터치 전환 인터랙션
   - 하단 탭 바 원터치 페이지 라우팅 ([차트], [설정], [대시보드])
   - 안드로이드 콘솔 에러 0건 (Clean)
3. **산출물**:
   - `test/reports_ui/screenshot_desktop.png` (데스크톱 렌더링)
   - `test/reports_ui/screenshot_mobile.png` (안드로이드 모바일 렌더링)

---

## 🛠️ 백엔드/하드웨어 E2E 실행 방법 (실제 디바이스 연결 시)
```bash
python test/e2e_stage8_4.py <ESP32_IP_ADDRESS>
```
- 대상: T-114 ~ T-120 (Stage 8 AI 음성/REST API 회귀 7대 항목)

