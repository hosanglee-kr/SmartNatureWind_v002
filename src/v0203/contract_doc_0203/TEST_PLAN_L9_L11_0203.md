# TEST_PLAN_L9_L11_0203.md — Stage 회귀 (L9~L11)

> **범위**: T-114 ~ T-152 (Stage 8 AI/Live, 통합 감사 28건, Stage 9 UI/UX).
> **원본 §번호 유지**: §3.5~§3.7 원본 번호 그대로.
> **참조**: 개요/환경/사전 준비/매트릭스/릴리스 게이트는 [`TEST_PLAN_0203.md`](TEST_PLAN_0203.md).
> **자동화**: `python test/e2e_stage8_4.py <DEVICE_IP>` (Stage 8 7건).
> 이 파일은 `src/v0203/tools_0203/split_test_plan_0203.py`가 생성합니다.

## 🔍 AI 빠른 참조 (이 파일)

| 서브섹션 | 범위 | 필수 |
|---|---|---|
| §3.5 Stage 8 | T-114 ~ T-120 | **7/7** |
| §3.6 통합 감사 | T-121 ~ T-148 | **P0 5/5 (T-121~T-125) + P1 10/10 (T-126~T-135)** |
| §3.7 Stage 9 UI | T-149 ~ T-152 | **4/4** |

**사전 준비**: [`TEST_PLAN_0203.md §3`](TEST_PLAN_0203.md#3-검증-환경-및-공통-사전-준비) 참조.

---

### 3.5 Stage 8 AI 제어 및 Gemini Live 실시간 음성 회귀 (T-114 ~ T-120)

> **자동화 E2E 스크립트 제공**: `python test/e2e_stage8_4.py <DEVICE_IP>`를 실행하면 T-114 ~ T-120 7대 시나리오가 일괄 자동 검증됩니다.

#### T-114. REST 2-turn 대화 및 프록시 스트리밍 (`/api/v001/ai/gemini`)
**목적**: Google Gemini REST API 2-turn 프록시 호출, Strict 시스템 프롬프트(캐시 30s) 주입 및 답변 생성 검증.
**합격 판정**:
- [ ] 자연어 입력 ("선풍기 켜줘") 시 200 OK 응답 및 텍스트 반환
- [ ] 요청 크기 8KB 초과 시 413 Payload Too Large 차단
- [ ] 분당 10회 초과 시 429 Too Many Requests 제한

#### T-115. 15종 위험 시스템 제어 명령 원천 차단
**목적**: 재부팅, 와이파이 재설정, 공장 초기화, 파일시스템 포맷 등 15종 파괴 명령 차단 검증.
**합격 판정**:
- [ ] `/api/v001/ai/execute-action` 에 `system_reboot` 또는 `factory_reset` 전달 시 400 Bad Request 차단
- [ ] FSM 상태 및 기기 작동 영향 0건 유지

#### T-116. Live 임시 토큰 발급 및 30분 상한(403) 가드레일
**목적**: Gemini Live 연결 전 토큰 검증, 세션당 30분(1800초) 상한 도달 시 403 Forbidden 반환 검증.
**합격 판정**:
- [ ] 정상 상태에서 `/api/v001/ai/live-token` POST 시 `token` 및 `limitSec: 1800` 반환
- [ ] 일일 비용 한도($0.50) 초과 상태에서 요청 시 403 Forbidden 반환

#### T-117. 12대 안전 Tool Calling 위임 브리지 및 FSM 반영
**목적**: Gemini 도구 호출(`turn_on`, `start_preset`, `add_schedule`, `get_environment` 등)이 CT10 공개 함수를 통해 FSM에 안전하게 반영되는지 검증.
**합격 판정**:
- [ ] `turn_on` 도구 실행 시 팬 가동 및 `/state` 에 ACTIVE 상태 반영
- [ ] `start_preset` 실행 시 지정된 presetCode/styleCode로 바람 전환
- [ ] `get_environment` 실행 시 현재 DHT 온습도 및 DI 지수 정상 반환

#### T-118. NVS 4키 일일 사용량 누적 및 자정 자동 리셋
**목적**: Gemini Live 세션 사용 시간 및 비용이 NVS(`ai_rst_dt`, `ai_a_s`, `ai_t_c`, `ai_cos`)에 기록되고 자정 리셋되는지 검증.
**합격 판정**:
- [ ] `/api/v001/ai/usage` 호출 후 `/api/v001/ai/cost-status` 에서 누적 초 및 비용 반영 확인
- [ ] `/api/v001/ai/cost-reset` 호출 시 당일 누적치 0으로 리셋

#### T-119. AudioWorklet 16k 송신 / 24k PCM16 저지연 재생 및 Barge-in Flush
**목적**: 마이크 PCM16 인라인 Worklet 캡처 및 수신 오디오 큐 재생, 사용자 끼어들기 시 즉시 Flush 검증.
**합격 판정**:
- [ ] AudioWorklet 16kHz PCM16 오디오 청크 정상 생성 및 WebSocket 전송
- [ ] 24kHz PCM16 청크 수신 시 스피커 정상 재생 및 Audio Orb 펄스 시각화
- [ ] 사용자가 말하기 시작할 때 `playback.flush()` 호출되어 이전 답변 재생 즉시 중단

#### T-120. 오프라인 모드 AI Mock 인터셉터 동작
**목적**: ESP32 기기가 없는 로컬 브라우저 환경에서 `998.offline_0203.js` AI Mock 인터셉터 동작 검증.
**합격 판정**:
- [ ] 오프라인 모드에서 AI Studio 및 AI Sheet 진입 시 가상 응답 정상 수신
- [ ] 가상 도구 실행 시 대시보드 상태 및 차트 정상 연동

---

---

### 3.6 통합 감사 회귀 (T-121 ~ T-148)

> **기준**: 2026-11-07 통합 감사 리포트 (백엔드 14건 + 프론트엔드 14건)  
> **자동화 E2E 스크립트**: `test/audit_28/run_all.sh`

#### 3.6.1 P0 회귀 (5건) — 릴리스 차단 필수

##### T-121. [BE-P0-1] factoryReset 후 SPA 자산 서빙 정상화
**대응 이슈**: `A23_Com_ResetCfg_0203.h::A20_resetWebPageDefault` — SPA 미반영 (`/html_v3/` 하드코딩)  
**위반 문서**: SPEC §5.4.4  
**합격 판정**:
- [ ] 재부팅 3회 후 모두 200 OK
- [ ] `cfg_pages_0203.json` `path` 필드가 `/html_v0203/*` 계열
- [ ] `pageAssets[]`에 `P010_bundle_0203.js` 존재

##### T-122. [BE-P0-2] AI `add_profile` CRUD 검증 우회 차단
**대응 이슈**: `CT10_Ctl_AIAction_0203.cpp::executeAddProfile` — 검증 우회  
**위반 문서**: CONTRACT §7.15 AI-2  
**합격 판정**:
- [ ] 신규 profileNo > 기존 max (자동 발급 준수)
- [ ] 재부팅 후 프로필 개수 유지
- [ ] 중복 및 검증 실패 로그 0건

##### T-123. [BE-P0-3] T-async `startOverridePreset` mutex 보호
**대응 이슈**: `CT10_Ctl_Ctl_Ovr_0203.cpp::startOverridePreset` — `g_A20_config_root` mutex 없이 참조  
**위반 문서**: CONTRACT §3.1 B-2  
**합격 판정**:
- [ ] reload + AI 10회 반복 시 크래시/WDT 0건
- [ ] 정적 검사(`g_A20_config_root.windDict` 직접 접근) 0건
- [ ] uptime 연속 증가

##### T-124. [FE-P0-1] AI 비용 배지 표시 정상화
**대응 이슈**: `290.page.ai.js`, `999b.ai-sheet.js` — `SNW.API` 대문자 오타  
**위반 문서**: SPEC §5.1.4.4  
**합격 판정**:
- [ ] 콘솔 에러 0건
- [ ] `[data-slot="cost-badge"]` 정상 표시
- [ ] "오늘 Live" 텍스트 및 비용 정보 정상 출력

##### T-125. [FE-P0-2] AI Live 함수 경로 정합성
**대응 이슈**: SPEC vs 코드 vs 프론트 3자 표류  
**위반 문서**: SPEC §5.1.4.1  
**합격 판정**:
- [ ] `/ai/live-function` 200 OK (배포 경로 동작)
- [ ] `/ai/live-func` 404 (폐기 경로)
- [ ] SPEC §5.1.4.1 표에 `/ai/live-function` 반영

#### 3.6.2 P1 회귀 (10건) — 릴리스 전 필수

| ID | 대응 이슈 | 위반 문서 | 합격 판정 요약 |
|:---:|---|---|---|
| **T-126** | BE-P1-1 TTS 매핑 8/10 오매핑 | SPEC §7.15 AI-5 | 10/10 프리셋이 한글 이름 반환 (영문 코드 노출 0건) |
| **T-127** | BE-P1-2 begin 실패 시 조기 return | FLOW §10, SPEC §6.1 B-11 | C10 실패 시 Recovery AP 폴백 부팅 및 웹 접속 가능 |
| **T-128** | BE-P1-3 부팅 시 로그 레벨 무시 | F-4, FLOW §1 | 재부팅 후 사용자 설정 로그 레벨(DEBUG 등) 유지 |
| **T-129** | BE-P1-4 Monitor strict aliasing UB | C++ 표준 규격 | struct 포인터 캐스팅 제거 및 타입 안전 epochT 정합 |
| **T-130** | BE-P1-5 T-loop WS send 블로킹 | BUDGET §2, CONTRACT §6 | 클라이언트 0 가드 추가로 T-loop 블로킹 방지 |
| **T-131** | BE-P1-6 add_schedule profileId 미검증 | FLOW §4.2 | 존재하지 않는 profileId 스케줄 추가 시 안전 거부 |
| **T-132** | FE-P1-1 i18n currentLang undefined | i18n 계약 | `SNW.I18n.getLang()` 호출로 언어별 올바른 응답 생성 |
| **T-133** | FE-P1-2 오프라인 FSM 명칭 오류 | STATE §2.1 C++ SSOT | OVERRIDE/OVERRIDE_ACTIVE 등 C++ 유효 상태 반환 |
| **T-134** | FE-P1-3 NowPlaying EQ RAF 재개 | UI UX 안정성 | pause 후 100ms 이내 EQ 애니메이션 정지 |
| **T-135** | FE-P1-4 오프라인 브로드캐스트 중지 | UX/리소스 절약 | 세션 stop 후 오프라인 WebSocket 브로드캐스트 중지 |

#### 3.6.3 P2 회귀 (13건) — 후속 정리

| ID | 대응 이슈 | 검증 방식 | 합격 판정 |
|:---:|---|---|---|
| **T-136** | main.cpp 매직넘버 | `G_A00_*` 상수 교체 | `delay(1000)` 매직넘버 0건 |
| **T-137** | ADR-2 레거시 필드 격리 | FSM 브릿지 미러 격리 | `ST_A20_Step_t` steps[] 단일 규격 정합 |
| **T-138** | dead code no-op 정리 | `C10_reissueSegIdsAndValidateSegNos` | 인라인 안전 브릿지 배치 |
| **T-139** | ST_A20_ScheduleSegment_t 오버로드 | 독립 struct 유지 | FSM 함수 오버로드 충돌 방지 |
| **T-140** | initAutoOffFromSchedule 서식 | 인덴트 및 중괄호 정돈 | `_persistOffTimeLastYday` 리셋 보장 |
| **T-141** | check_i18n.py dead code | 대칭성 로직 전면 개편 | ko/en 510개 키 100% 대칭 검증 |
| **T-142** | G_MAX_REQUEST_BODY 3자 표류 | 12KB 통일 | C++, SPEC, README 12KB 일치 |
| **T-143** | AI Rate Limit 정의 표류 | 5초 간격 통일 | 코드 5초 간격과 SPEC 5초 동기화 |
| **T-144** | NowPlaying 4px 겹침 | 높이 60px 통일 | 모바일 탭바와 NowPlaying 겹침 0px |
| **T-145** | _components.css 모듈 가이드 | 모듈 주석 가이드 보강 | 파일 가독성 및 유지보수성 확보 |
| **T-146** | i18n gate 정책 확인 | CI Gate 연동 | `check_i18n.py --strict` staging 통과 |
| **T-147** | AISheet 웨이크워드 프라이버시 | 툴팁 프라이버시 보강 | 상시 활성 안내 및 사용자 인지 보장 |
| **T-148** | addWindProfile unwrap 누락 | `_unwrap(b, 'preset')` 표준 적용 | ADR-2 단일 객체 파싱 준수 |

#### 3.6.4 L10 회귀 매트릭스

| 그룹 | 테스트 항목 | 예상 소요 | 판정 기준 |
|:---|---|:---:|:---:|
| **L10 P0** | T-121 ~ T-125 (5건) | 40분 | **5/5 필수 통과** |
| **L10 P1** | T-126 ~ T-135 (10건) | 90분 | **10/10 필수 통과** |
| **L10 P2** | T-136 ~ T-148 (13건) | 90분 | **13/13 검증 완료** |

---

---

## 3.7 Stage 9 — 웹 UI/UX 레이아웃 표준화 및 인터랙션 회귀 (T-149 ~ T-152)

### T-149. [UI-5/ADR-9] 모바일 하단 뷰포트 레이아웃 스택 및 FAB/Toast 동적 부상 검증

**목적**: 모바일 뷰포트(< 768px)에서 Bottom Nav(60px), Now Playing Bar(48px), AI Floating FAB(54px), Toast 메시지가 세션 활성화/비활성화 시 겹침 없이 동적으로 부상/복귀하는지 검증.

**대응 계약**: CONTRACT §7.17 UI-5, SPEC §5.4.2.1, ADR-9  
**검증 절차**:
```javascript
// 브라우저 DevTools (375x667 모바일 에뮬레이션)
// 1. 대기 상태 (세션 없음) 레이아웃 스택 검증
console.assert(!document.body.classList.contains('has-nowplaying'), 'has-nowplaying 미설정 확인');
const fab = document.querySelector('.snw-ai-fab');
const fabBottomIdle = getComputedStyle(document.documentElement).getPropertyValue('--snw-fab-bottom').trim();
console.assert(fabBottomIdle === '76px', '대기 상태 FAB bottom 76px 확인');

// 2. 바람 세션 시작 (Now Playing Bar 활성화)
// 대시보드에서 프리셋 또는 전원 ON 실행
await SNW.Api.overridePreset('OCEAN');
// WebSocket 수신 후 body.has-nowplaying 클래스 부여 확인
console.assert(document.body.classList.contains('has-nowplaying'), 'has-nowplaying 자동 부여 확인');

// 3. 동적 부상 좌표 검증
const npBar = document.querySelector('.snw-nowplaying');
const npRect = npBar.getBoundingClientRect();
const navBar = document.querySelector('.snw-bottom-nav');
const navRect = navBar.getBoundingClientRect();

// Now Playing Bar가 Bottom Nav 바로 위(bottom: 60px)에 정확히 밀착하는지 확인
console.assert(Math.abs(npRect.bottom - navRect.top) < 2, 'Now Playing Bar가 Bottom Nav 상단에 밀착');

// FAB 및 Toast의 동적 부상 위치 확인 (76px -> 124px)
const fabBottomActive = getComputedStyle(document.body).getPropertyValue('--snw-fab-bottom').trim();
console.assert(fabBottomActive === '124px', '세션 중 FAB bottom 124px 동적 부상 확인');

// 4. 세션 정지 시 원래 위치 복귀 확인
await SNW.Api.stopSession();
console.assert(!document.body.classList.contains('has-nowplaying'), 'has-nowplaying 해제 확인');
```

**합격 판정**:
- [ ] 세션 비활성 시 FAB/Toast가 Bottom Nav 상단(bottom: 76px)에 안정적으로 배치
- [ ] 세션 활성화 시 `body.has-nowplaying` 토글 및 FAB/Toast가 124px 위치로 부드럽게 부상(transition: bottom 0.25s)
- [ ] z-index 스택 순서(Nav 90 < NowPlaying 95 < FAB 990 < Modal/Overlay 1100 < Toast 1200) 준수로 조작 차단 0건

---

### T-150. [UI-6] 메인 콘텐츠 스크롤 하단 여백 연동 및 UI 가림 해소 검증

**목적**: 본문 컨테이너(`.snw-main`)의 `padding-bottom`이 세션 가동 시 80px에서 128px로 동적 확장되어 스케줄, 로그, 프로필 화면의 최하단 컨트롤이 하단 바에 가려지지 않는지 검증.

**대응 계약**: CONTRACT §7.17 UI-6, SPEC §5.4.2.1  
**검증 절차**:
```javascript
// 브라우저 콘솔 (#schedule 또는 #logs 페이지 진입)
location.hash = '#/schedule';
const mainEl = document.querySelector('.snw-main');

// 1. 대기 상태 확인
console.assert(getComputedStyle(mainEl).paddingBottom === '80px', '대기 시 하단 패딩 80px');

// 2. 세션 시작 후 패딩 확장 확인
await SNW.Api.overridePreset('VALLEY');
console.assert(getComputedStyle(mainEl).paddingBottom === '128px', '세션 가동 시 하단 패딩 128px 동적 확장');

// 3. 최하단 스크롤 후 최하단 버튼 클릭 가시성 확인
window.scrollTo(0, document.body.scrollHeight);
const lastCard = document.querySelector('.snw-card:last-child');
const lastRect = lastCard.getBoundingClientRect();
const npBar = document.querySelector('.snw-nowplaying');
const npRect = npBar.getBoundingClientRect();
console.assert(lastRect.bottom <= npRect.top, '최하단 요소가 Now Playing Bar에 가려지지 않음');
```

**합격 판정**:
- [ ] 세션 가동 시 `.snw-main` 하단 패딩이 128px로 즉각 전환
- [ ] 긴 리스트(로그 100건, 스케줄 다건 등) 스크롤 끝단까지 스크롤 시 모든 액션 버튼이 온전히 노출되어 클릭 가능

---

### T-151. [UI-7] 바람 스타일 5종 탭 44px 모바일 터치 접근성 및 래핑 검증

**목적**: 대시보드의 바람 스타일 5종(NATURAL, SLEEP, REFRESH, STORM, SILENT) 탭 버튼이 모바일 터치 최소 높이 규격(44px)을 충족하고 좁은 뷰포트에서 자연스럽게 래핑되는지 검증.

**대응 계약**: CONTRACT §7.17 UI-7, SPEC §5.4.2  
**검증 절차**:
```javascript
// 브라우저 콘솔 (#dashboard 진입, 뷰포트 360x640)
location.hash = '#/dashboard';
const styleButtons = document.querySelectorAll('.snw-style-btn');
console.assert(styleButtons.length === 5, '스타일 버튼 5개 렌더링 확인');

styleButtons.forEach(btn => {
    const rect = btn.getBoundingClientRect();
    console.assert(rect.height >= 44, `버튼 높이 44px 이상 만족: ${rect.height}px`);
});

// 버튼 터치 이벤트 및 스타일 전환 API 호출 확인
styleButtons[1].click(); // SLEEP 클릭
// 네트워크 요청 POST /api/v001/control/override 또는 simulation 확인
```

**합격 판정**:
- [ ] 5종 버튼의 렌더링 높이가 모두 44px 이상 (`min-height: 44px`)
- [ ] 360px 이하 좁은 화면에서도 텍스트가 잘리지 않고 버튼 간격(gap: 8px)을 유지하며 flex 래핑
- [ ] 탭 클릭 시 활성화 클래스(`.active`) 정상 토글 및 백엔드 파라미터 연동 성공

---

### T-152. [UI-8] Now Playing Bar 상세 확장 모달 및 Studio Override 원복 액션 검증

**목적**: Now Playing Bar 우측 확장 아이콘(`[⤢]`) 클릭 시 상세 제어 모달 오픈 및 Wind Studio의 슬라이더 Override 수동 변경 시 `[수동 튜닝됨]` 배지 노출과 `[↺ 기본값 원복]` 버튼 동작 검증.

**대응 계약**: CONTRACT §7.17 UI-8, UserManual §4 / §11.2 / §11.3  
**검증 절차**:
```javascript
// 1. Now Playing Bar 상세 모달 검증
// 세션 활성화 상태에서 Bar의 우측 확장 버튼 또는 Bar 클릭
const expandBtn = document.querySelector('.snw-nowplaying__expand') || document.querySelector('.snw-nowplaying');
expandBtn.click();

// 모달 오픈 확인
const modal = document.querySelector('.snw-modal');
console.assert(modal !== null, 'Now Playing 상세 제어 모달 표시 확인');
console.assert(modal.querySelector('.snw-nowplaying-modal__controls') !== null, '모달 내 제어 버튼 노출');

// 모달 닫기
document.querySelector('.snw-modal-close').click();

// 2. Wind Studio Override 배지 및 원복 버튼 검증 (#profiles -> Studio 탭 또는 #simulation)
location.hash = '#/profiles';
// Studio 슬라이더 임의 조작 (강도 85%)
const intensitySlider = document.querySelector('#studio-intensity');
if (intensitySlider) {
    intensitySlider.value = 85;
    intensitySlider.dispatchEvent(new Event('input'));
    
    // [수동 튜닝됨] 뱃지 및 [↺ 기본값 원복] 버튼 표시 확인
    const badge = document.querySelector('.snw-override-badge');
    console.assert(badge && !badge.classList.contains('hidden'), '수동 튜닝됨 뱃지 표시 확인');
    const resetBtn = document.querySelector('.snw-override-reset-btn');
    console.assert(resetBtn && !resetBtn.classList.contains('hidden'), '기본값 원복 버튼 노출 확인');
    
    // 원복 버튼 클릭
    resetBtn.click();
    console.assert(intensitySlider.value != 85, '기본 프리셋 강도로 복귀 확인');
    console.assert(badge.classList.contains('hidden'), '뱃지 자동 숨김 확인');
}
```

**합격 판정**:
- [ ] Now Playing Bar 확장 클릭 시 500ms 이내에 상세 재생 제어 모달이 부드럽게 오픈되고 정상 닫힘
- [ ] Wind Studio 슬라이더 수동 조작 시 `[수동 튜닝됨]` 배지와 `[↺ 기본값 원복]` 버튼이 즉각 활성화
- [ ] 원복 버튼 클릭 시 현재 활성 프리셋의 기준 물리 파라미터로 즉시 환원되고 배지가 숨김 처리됨

---


---

---

## 개정 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-11-09 | v1.0 | TEST_PLAN_0203.md에서 L9~L11 분할 (T-114~T-152). `src/v0203/tools_0203/split_test_plan_0203.py` 자동 생성 | Antigravity AI |
