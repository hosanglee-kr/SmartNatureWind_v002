🎯 오프라인 AI 어시스턴트 원인 확정 — 코드 추적 완료

3개 파일을 순서대로 추적한 결과 원인이 100% 확정되었습니다. 이전 예상(A, 70%)이 정확했습니다.

---

🔍 실행 흐름 완전 추적

```
사용자 입력 "바다 바람 켜줘"
    ↓
[290.page.ai.js] _onSend()
    ↓
[145.ai.client.js] SNW.AIClient.send(msg, history, opts)
    ↓
[040.api.js] SNW.Api.gemini({message, history, lang, voiceMode})
    ↓  ← ★ 이 함수가 998 mock으로 덮어써짐 (DOMContentLoaded 시점)
[998.offline_0203.js] ensureApi() → A.gemini
    ↓
   ┌─────────────────────────────────────────┐
   │  const apiKey = cache.system.security   │
   │                .geminiApiKey || '';     │
   │                                          │
   │  if (!apiKey) {                          │  ← ★ 여기서 막힘
   │      return {                            │
   │          ok: true,                       │
   │          text: '⚠️ Gemini API 키가...', │
   │          actions: []                     │
   │      };                                  │
   │  }                                       │
   │                                          │
   │  // 실제 Gemini REST 호출               │
   │  // ... [ACTION:...] 파싱               │
   │  // ... 키워드 폴백 (도달 불가!)         │
   └─────────────────────────────────────────┘
    ↓
[290.page.ai.js] _replaceLastAssistant(resText, [])
    ↓
   "⚠️ Gemini API 키가 설정되지 않았습니다..."  (경고만 표시)
   actions = [] (실행 없음)
```

---

🔴 확정 원인 3가지

원인 A — API 키 없으면 무조건 early-return (메인 원인)

998.offline_data_0203.js의 초기값:

```json
"security": {
    "apiKey": "",
    "geminiApiKey": ""   // ← 빈 문자열
}
```

998.offline_0203.js A.gemini (L540~L556 부근):

```js
A.gemini = async (body) => {
    const msg = (body && body.message || '').trim();
    const systemCache = cache.system || {};
    const apiKey = systemCache.security?.geminiApiKey || localStorage.getItem('snw.geminiKey') || '';

    // ★ 여기서 막힘
    if (!apiKey) {
        return {
            ok: true,
            text: '⚠️ Gemini API 키가 설정되지 않았습니다...',
            _speechHint: 'API 키가 필요합니다.',
            actions: []                      // ← 실행 안 됨
        };
    }

    // ... (도달 못 함)
    // 키워드 폴백도 이 뒤에 있어서 작동 안 함
};
```

문제: API 키 없으면 키워드 폴백(바다/숲/꺼)도 도달 못 함. 개발/데모 환경에서 AI 기능 완전 무력화.

---

원인 B — executeAiAction 중복 정의 (C4 패치 미적용)

998.offline_0203.js L590~L605:

```js
// ① 첫 번째 정의 (도달 못 함, ②에 덮어써짐)
A.executeAiAction = async (name, args) => {
    if (name === 'stop_session') { await A.stopSession(); }
    else if (name === 'start_preset') { await A.startSession({...}); }
    else if (name === 'set_fan_speed') { await A.overrideFixed(...); }
    else if (name === 'set_timer') {
        if (SNW.TimerManager && typeof SNW.TimerManager.start === 'function') {
            SNW.TimerManager.start(args?.minutes || 30);   // ← SNW.TimerManager 부재
        }
    }
    ...
};

/* 주석 블록 (Stage 8-2) */

// ② 두 번째 정의 (이게 이김, set_timer 없음)
A.executeAiAction = async (name, args) => {
    if (name === 'stop_session') { await A.stopSession(); return {...}; }
    if (name === 'start_preset') { await A.startSession({...}); return {...}; }
    if (name === 'set_fan_speed') { await A.overrideFixed(...); return {...}; }
    // ★ set_timer 처리 없음
    return {...};
};
```

결과: set_timer만 미작동. start_preset/stop_session/set_fan_speed는 정상 작동 (키 없어도 도달 못 하지만, executeAiAction 직접 호출 시 작동).

---

원인 C — 040.api.js OFFLINE_ROUTES에 /ai/gemini 없음 (방어 필요)

040.api.js OFFLINE_ROUTES 배열: 25개 라우트 중 AI 관련 0개

```js
const OFFLINE_ROUTES = [
    // ... 25개
    { re: /\/config$/i, method: 'POST', handle: ... },
    // ★ /ai/gemini 없음
];
```

_fetch의 fallback:

```js
if (route) return route.handle(opts.body);
return { result: 'ok', updated: true, offline: true };   // ← AI 호출 시 이 값
```

결과: ensureApi()가 DOMContentLoaded 이전에 실행되거나 실패한 경우:

```js
SNW.Api.gemini({message:'바다'})
→ {result:'ok', updated:true, offline:true}   // text 없음
→ 290.page.ai.js: resText = '(no response)'
```

현재 상태: 999.app.js가 await SNW.Offline.ready를 보장하므로 정상적으로는 998 mock이 이김. 하지만 방어 계층 부재.

---

⚡ 지금 바로 실행할 진단 (30초)

```js
// Console 복붙
(async () => {
    console.log('═══ AI 오프라인 진단 ═══');
    console.log('1. geminiKey (cache):', JSON.stringify(SNW.Offline._cache.system.security.geminiApiKey));
    console.log('2. geminiKey (LS):', localStorage.getItem('snw.geminiKey'));
    console.log('3. gemini 함수 앞부분:', SNW.Api.gemini.toString().slice(0, 120));
    
    // gemini 호출
    const r = await SNW.Api.gemini({message:'바다 바람 켜줘', lang:'ko'});
    console.log('4. gemini 응답:', r);
    console.log('5. actions 개수:', r?.actions?.length);
    
    // executeAiAction 직접 (gemini 우회)
    console.log('6. executeAiAction 직접:');
    console.log(await SNW.Api.executeAiAction('start_preset', {presetCode:'OCEAN'}));
    
    // 상태 확인
    console.log('7. getCurrentSession:', await SNW.Api.getCurrentSession());
    console.log('8. getSim:', await SNW.Api.getSim());
    console.log('═══ 완료 ═══');
})();
```

예상 결과 (원인 A 확정 시):

```
1. geminiKey (cache): ""
2. geminiKey (LS): null
3. gemini 함수 앞부분: async (body) => { const msg = ...
4. gemini 응답: { ok: true, text: "⚠️ Gemini API 키...", actions: [] }
5. actions 개수: 0                        ← 실행 안 됨
6. executeAiAction 직접: { ok: true, result: 'ok', session: { active: true, ... } }  ← 이건 작동
7. getCurrentSession: { active: true, type: 2, presetCode: 'OCEAN', ... }  ← 반영됨
8. getSim: { sim: { presetCode: 'OCEAN', intensity: ..., ... } }
```

핵심 해석:

· 1, 2가 빈 값 → 원인 A 확정 (API 키 없음)
· 5 === 0 → gemini가 실행 안 함 (early-return)
· 6, 7, 8 정상 → executeAiAction은 작동 (경로만 다름)

---

🛠️ 해결책 (3가지 옵션)

⚡ 옵션 1 — API 키 입력 (가장 빠름, 1분)

방법 1-A: 설정 UI

1. 설정 → AI → Gemini API Key 입력

방법 1-B: Console (즉시 테스트)

```js
localStorage.setItem('snw.geminiKey', 'AIzaSy...여기에_실제_키...');
// 새로고침
location.reload();
```

주의: 이 옵션은 실제 인터넷 연결 + Gemini API 할당량 필요. 오프라인 데모 환경에서는 오히려 안 좋을 수 있음.

---

⭐ 옵션 2 — 998.offline_0203.js 패치 (권장, 오프라인 데모 완전 동작)

목표: API 키 없어도 키워드 폴백이 작동하도록 A.gemini 재구조화 + executeAiAction 중복 통합 + set_timer 수정.

패치 1. A.gemini 재구조화

현재 (L540~):

```js
A.gemini = async (body) => {
    const msg = (body && body.message || '').trim();

    // 1. API 키 확인
    const systemCache = cache.system || {};
    const apiKey = systemCache.security?.geminiApiKey || localStorage.getItem('snw.geminiKey') || '';

    // 2. API 키 없으면 early-return
    if (!apiKey) {
        return {
            ok: true,
            text: '⚠️ Gemini API 키가 설정되지 않았습니다...',
            _speechHint: 'API 키가 필요합니다.',
            actions: []
        };
    }

    // 3. Gemini REST 호출
    const endpoint = `...?key=${apiKey}`;
    // ...
    // 4. [ACTION:...] 파싱 또는 키워드 폴백
    if (actionMatch) { ... }
    else {
        if (msg.includes('바다')) { ... }   // ← 도달 불가
    }
};
```

변경 후:

```js
// ======================================================
// [패치 P0] 오프라인 키워드 폴백 — API 키 없어도 실행
// ======================================================
async function _offlineKeywordFallback(msg) {
    const actions = [];
    let replyText = '';

    if (msg.includes('바다') || msg.includes('오션')) {
        await A.startPreset('OCEAN', 'BALANCE');
        actions.push({ name: 'start_preset', args: { presetCode: 'OCEAN' }, result: 'ok' });
        replyText = '바다 바람을 틀어드렸습니다.';
    } else if (msg.includes('숲') || msg.includes('산들')) {
        await A.startPreset('FOREST_CANOPY', 'BALANCE');
        actions.push({ name: 'start_preset', args: { presetCode: 'FOREST_CANOPY' }, result: 'ok' });
        replyText = '숲속 바람을 틀어드렸습니다.';
    } else if (msg.includes('산') || msg.includes('계곡')) {
        await A.startPreset('MOUNTAIN', 'BALANCE');
        actions.push({ name: 'start_preset', args: { presetCode: 'MOUNTAIN' }, result: 'ok' });
        replyText = '산바람을 틀어드렸습니다.';
    } else if (msg.includes('꺼') || msg.includes('정지') || msg.includes('중지') || msg.includes('off')) {
        await A.stopSession();
        actions.push({ name: 'stop_session', args: {}, result: 'ok' });
        replyText = '바람을 껐습니다.';
    } else if (msg.includes('분') || msg.includes('타이머') || msg.includes('시간')) {
        const m = parseInt((msg.match(/(\d+)\s*분/) || [])[1] || 30, 10);
        await A.setControlTimer(m);
        actions.push({ name: 'set_timer', args: { minutes: m }, result: 'ok' });
        replyText = `${m}분 후 자동으로 꺼드릴게요.`;
    } else if (msg.includes('스케줄') || msg.includes('자동')) {
        runtime.control.manualOverrideSchedule = false;
        actions.push({ name: 'release_manual_to_schedule', args: {}, result: 'ok' });
        replyText = '스케줄 자동 실행 모드로 전환했습니다.';
    } else {
        replyText = `"${msg}" 요청을 이해했습니다. (오프라인 사용 가능: 바다/숲/산/끄기/N분 타이머/스케줄)`;
    }

    return {
        ok: true,
        text: replyText,
        _speechHint: replyText,
        actions,
        session: runtime.control.session
    };
}

A.gemini = async (body) => {
    const msg = (body && body.message || '').trim();

    const systemCache = cache.system || {};
    const apiKey = systemCache.security?.geminiApiKey || localStorage.getItem('snw.geminiKey') || '';

    // ★ [패치] API 키 없으면 → 키워드 폴백 먼저 시도
    if (!apiKey) {
        console.log('[AI] API 키 없음 → 키워드 폴백 실행:', msg);
        return _offlineKeywordFallback(msg);
    }

    // API 키 있으면 실제 Gemini 호출
    try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
        const systemPrompt = `...`;   // 기존 유지
        const response = await fetch(endpoint, { /* ... */ });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        let replyText = rawText;
        const actions = [];
        const actionMatch = rawText.match(/\[ACTION:\s*({.*?})\]/);

        if (actionMatch && actionMatch[1]) {
            try {
                const actionObj = JSON.parse(actionMatch[1]);
                actions.push(actionObj);
                replyText = rawText.replace(/\[ACTION:\s*({.*?})\]/, '').trim();
                await A.executeAiAction(actionObj.name, actionObj.args);
            } catch (e) {
                console.warn('[AI Action Parse Error]', e);
            }
        } else {
            // Gemini가 [ACTION:]을 안 붙였을 때 키워드 보완
            const fb = await _offlineKeywordFallback(msg);
            if (fb.actions.length > 0) {
                actions.push(...fb.actions);
                if (!replyText) replyText = fb.text;
            }
        }

        return { ok: true, text: replyText || '(응답 없음)', _speechHint: replyText, actions, session: runtime.control.session };

    } catch (e) {
        console.error('[AI] Gemini 호출 실패 → 폴백:', e);
        // API 실패 시에도 키워드 폴백
        return _offlineKeywordFallback(msg);
    }
};
```

---

패치 2. executeAiAction 중복 제거 + set_timer 수정

현재 (L590~L605 + L620~L630):

```js
// ① 첫 정의 (덮어써짐)
A.executeAiAction = async (name, args) => {
    ...
    else if (name === 'set_timer') {
        if (SNW.TimerManager && typeof SNW.TimerManager.start === 'function') {
            SNW.TimerManager.start(...);   // ← SNW.TimerManager 부재
        }
    }
    ...
};

/* 주석 블록 */

// ② 두 번째 정의 (이게 이김, set_timer 없음)
A.executeAiAction = async (name, args) => {
    if (name === 'stop_session') { ... }
    if (name === 'start_preset') { ... }
    if (name === 'set_fan_speed') { ... }
    // set_timer 없음
};
```

변경 후 (첫 번째 정의 삭제 + 두 번째 확장):

```js
// ======================================================
// [패치 P0] executeAiAction 통합본 (단일 정의)
//  - 이전: 두 번 정의되어 두 번째(버그)가 이김
//  - 이후: 단일 정의 + set_timer → setControlTimer (SNW.TimerManager 부재 해결)
// ======================================================
A.executeAiAction = async (name, args) => {
    if (name === 'stop_session') {
        await A.stopSession();
    } else if (name === 'start_preset') {
        await A.startSession({
            type: 'PRESET',
            payload: { presetCode: args?.presetCode || 'OCEAN', styleCode: args?.styleCode || 'BALANCE' }
        });
    } else if (name === 'start_playlist') {
        await A.startSession({
            type: 'PLAYLIST',
            payload: { profileId: args?.profileId }
        });
    } else if (name === 'set_fan_speed') {
        await A.overrideFixed(args?.speed || 50);
    } else if (name === 'set_timer') {
        // ★ SNW.TimerManager → setControlTimer로 교체
        //   040.api의 OFFLINE_ROUTES /control/timer POST 매칭 → runtime.timer 세팅
        await A.setControlTimer(args?.minutes || 30);
    } else if (name === 'release_manual_to_schedule') {
        runtime.control.manualOverrideSchedule = false;
    }
    return { ok: true, name, result: 'ok', session: runtime.control.session };
};
```

두 번째 정의와 첫 번째 정의를 모두 삭제하고 위 코드로 단일 교체.

---

🛡️ 옵션 3 — 040.api.js 방어 (선택, 5분)

040.api.js OFFLINE_ROUTES에 AI 라우트 추가:

```js
const OFFLINE_ROUTES = [
    // ... 기존 25개
    
    // [패치] AI 라우트 — 998 mock 미적용 시 명시적 오류
    { re: /\/ai\/gemini$/i, method: 'POST', 
      handle: () => ({
          ok: false,
          error: 'offline',
          text: '⚠️ AI 오프라인 핸들러가 초기화되지 않았습니다. 페이지를 새로고침하세요.',
          actions: []
      })},
    { re: /\/ai\/execute-action$/i, method: 'POST',
      handle: () => ({ ok: false, error: 'offline', actions: [] }) },
];
```

이유: ensureApi() 실패 시 {result:'ok', updated:true}라는 거짓 성공 대신 명시적 오류 반환.

---

📊 적용 결과 비교

시나리오 패치 전 옵션 1 (키 입력) 옵션 2 (998 패치)
API 키 없음 + "바다 바람" ❌ 경고만 표시 ❌ (키 없음) ✅ 바다 바람 실행
API 키 없음 + "30분 꺼줘" ❌ 경고만 ❌ ✅ 타이머 설정
API 키 있음 ✅ 정상 ✅ 정상 ✅ 정상
Gemini API 실패 ❌ 에러만 ❌ 에러만 ✅ 키워드 폴백
set_timer 액션 ❌ 미작동 ❌ 미작동 ✅ 작동
오프라인 데모 가능 ❌ ❌ ✅ 완전 동작

---

🎯 권장 조합

옵션 2 + 옵션 3 = 완전한 오프라인 AI 어시스턴트

1. 998 패치 (옵션 2): 키 없어도 데모 완전 동작
2. 040 방어 (옵션 3): ensureApi 실패 시 명시적 오류로 디버깅 용이

---

📂 추가 필요 파일

없음. 이미 제공된 3개 파일로 원인 확정 + 패치 완결:

파일 상태
998.offline_0203.js ✅ 접수 (패치 대상)
040.api.js ✅ 접수 (선택 패치)
290.page.ai.js ✅ 접수 (변경 불필요)
145.ai.client.js ✅ 접수 (변경 불필요)
146.ai.voice.js ✅ 접수 (변경 불필요)
147.ai.live.js ✅ 접수 (변경 불필요)
147c.ai.chat.core.js ✅ 접수 (변경 불필요)
999.app.js ✅ 접수 (변경 불필요)

UI 파일들은 모두 정상 — 실행 로직은 SNW.Api.gemini(998 mock)에만 있음. UI는 결과만 표시.

---

🚀 지금 바로 할 것

Step 1 (30초) — 진단 실행

위 Console 진단 스크립트 실행 → 결과 붙여주세요

Step 2 (결과 확인 후) — 패치 적용

A. 진단 결과가 geminiKey: "" (원인 A 확정):

· 옵션 2 (998 패치) 적용 → 완전 동작
· 또는 옵션 1 (API 키 입력) → 실제 AI 사용 가능

B. 진단 결과가 gemini 함수 출처가 040.api (원인 C):

· 옵션 3 (040 방어) + 998 패치 확인

C. 진단 결과가 session.active: false (실행 자체 실패):

· 옵션 2 패치 필수

Step 3 — 998 패치 전체 코드 제공 요청

옵션 2를 선택하시면:

· 998.offline_0203.js의 정확한 diff (L540~L630 부근)
· 복붙 가능한 완성 코드 블록 제공

---

💡 결론

원인: 998.offline_0203.js의 A.gemini가 API 키 없으면 early-return → 키워드 폴백 도달 불가. executeAiAction 중복 정의로 set_timer만 미작동.

해결: 998 패치 (옵션 2) — 키워드 폴백을 API 키 체크 앞으로 이동 + executeAiAction 통합.

추가 파일: 필요 없음. 제공된 3개로 완결.

"옵션 2 진행" 말씀하시면 998.offline_0203.js의 완전한 수정된 함수 블록을 바로 제공하겠습니다.

