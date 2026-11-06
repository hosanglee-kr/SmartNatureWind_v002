/*
 * ------------------------------------------------------
 * 소스명 : P010_main_preset_071.js
 * 모듈명 : Main UI - Preset (프리셋/즐겨찾기/최근/AI)
 * ------------------------------------------------------
 */

(() => {
"use strict";

SNW.P010 = SNW.P010 || {};
const C = SNW.P010.core;
const P = SNW.P010.preset = {};

// ============================================================
// 1) 즐겨찾기
// ============================================================
P.getFavPresets = () => SNW.store.get(SNW.KEY.FAV_PRESETS, []);
P.setFavPresets = (list) => SNW.store.set(SNW.KEY.FAV_PRESETS, list);
P.isFavPreset   = (code) => !!code && P.getFavPresets().includes(code);

P.updateFavButton = () => {
    const btn = document.getElementById("btnFavPreset");
    if (!btn) return;
    const code = C.el.preset() ? C.el.preset().value : "";
    const fav  = P.isFavPreset(code);
    btn.textContent = fav ? "★" : "☆";
    btn.classList.toggle("is-fav", fav);
    btn.title = fav ? "즐겨찾기 해제" : "즐겨찾기 추가";
};

P.toggleFavPreset = () => {
    const code = C.el.preset() ? C.el.preset().value : "";
    if (!code) { SNW.toast("프리셋을 선택하세요.", "warn"); return; }

    let fav = P.getFavPresets();
    const wasFav = fav.includes(code);
    if (wasFav) fav = fav.filter((c) => c !== code);
    else        fav.unshift(code);
    P.setFavPresets(fav);

    if (C.state.lastCfgSnapshot) {
        const keep = code;
        P.loadPresetsFromConfig(C.state.lastCfgSnapshot);
        if (C.el.preset()) C.el.preset().value = keep;
    }
    P.updateFavButton();
    SNW.toast(wasFav ? `⭐ ${code} 즐겨찾기 해제` : `⭐ ${code} 즐겨찾기 추가`, "ok");
};

// ============================================================
// 2) 최근 사용
// ============================================================
const RECENT_MAX = 5;

P.getRecentPresets = () => SNW.store.get(SNW.KEY.RECENT_PRESETS, []);
P.setRecentPresets = (list) => SNW.store.set(SNW.KEY.RECENT_PRESETS, list);

P.pushRecentPreset = (code) => {
    if (!code) return;
    let recent = P.getRecentPresets();
    recent = recent.filter(c => c !== code);
    recent.unshift(code);
    if (recent.length > RECENT_MAX) recent.length = RECENT_MAX;
    P.setRecentPresets(recent);
};

// ============================================================
// 3) 프리셋 select 렌더링 (optgroup 3단)
// ============================================================
P.loadPresetsFromConfig = (cfg) => {
    C.state.lastCfgSnapshot = cfg;

    // -------- Preset --------
    const sel = C.el.preset();
    if (sel) {
        sel.innerHTML = "";
        let presets = [];
        if (cfg.windDict && Array.isArray(cfg.windDict.presets)) presets = cfg.windDict.presets;
        else if (cfg.motion && Array.isArray(cfg.motion.presets)) presets = cfg.motion.presets;

        C.state.windDictPresets = presets;

        if (!presets.length) {
            const opt = document.createElement("option");
            opt.value = ""; opt.textContent = "(프리셋 없음)";
            sel.appendChild(opt);
        } else {
            const favs = P.getFavPresets();
            const favSet = new Set(favs);
            const recents = P.getRecentPresets();

            const favList = favs.map(c => presets.find(p => p.code === c)).filter(Boolean);
            const recentList = recents.filter(c => !favSet.has(c))
                                      .map(c => presets.find(p => p.code === c)).filter(Boolean);
            const excludeSet = new Set([...favs, ...recents]);
            const restList = presets.filter(p => !excludeSet.has(p.code));

            const addGroup = (label, list) => {
                if (!list.length) return;
                const grp = document.createElement("optgroup");
                grp.label = label;
                list.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p.code || p.id || "";
                    opt.textContent = p.name || p.label || p.code || "";
                    grp.appendChild(opt);
                });
                sel.appendChild(grp);
            };
            addGroup("⭐ 즐겨찾기", favList);
            addGroup("🕘 최근 사용", recentList);
            addGroup("전체", restList);
        }
        P.updateFavButton();
    }

    // -------- Style --------
    const styleSel = C.el.style();
    if (styleSel) {
        styleSel.innerHTML = "";
        let styles = [];
        if (cfg.windDict && Array.isArray(cfg.windDict.styles)) styles = cfg.windDict.styles;
        C.state.windDictStyles = styles;

        if (!styles.length) {
            const opt = document.createElement("option");
            opt.value = "BALANCE"; opt.textContent = "BALANCE";
            styleSel.appendChild(opt);
        } else {
            styles.forEach((s, idx) => {
                const opt = document.createElement("option");
                opt.value = s.code || String(idx);
                opt.textContent = s.name || s.code || `Style ${idx + 1}`;
                styleSel.appendChild(opt);
            });
        }
    }
};

// ============================================================
// 4) 프리셋 설명
// ============================================================
P.updatePresetDescription = () => {
    const el = C.el.presetDesc();
    if (!el) return;
    const code = C.el.preset() ? C.el.preset().value : "";
    if (!code) { el.textContent = ""; return; }

    const preset = C.state.windDictPresets.find(p => p.code === code);
    if (!preset) { el.textContent = ""; return; }

    const pf = preset.factors || {};
    const name = preset.name || preset.label || code;
    el.textContent = `${name} — 강도 ${C.r2(pf.windIntensity)} · 변동 ${C.r2(pf.windVariability)} · 돌풍 ${C.r2(pf.gustFrequency)} · 팬상한 ${C.r2(pf.fanLimit)}`;
};

// ============================================================
// 5) 프리셋/스타일 변경 → 값 자동 채움
// ============================================================
P.onPresetOrStyleChanged = () => {
    const presetCode = C.el.preset() ? C.el.preset().value : "";
    const styleCode  = C.el.style()  ? C.el.style().value  : "";
    if (!presetCode) { P.updatePresetDescription(); return; }

    P.pushRecentPreset(presetCode);

    const preset = C.state.windDictPresets.find(p => p.code === presetCode);
    if (!preset || !preset.factors) { P.updatePresetDescription(); return; }

    const style = C.state.windDictStyles.find(s => s.code === styleCode) || {};
    const sf = style.factors || {};
    const pf = preset.factors;

    const r2 = C.r2;
    const intV  = r2((pf.windIntensity ?? 0)      * (sf.intensityFactor    ?? 1.0));
    const varV  = r2((pf.windVariability ?? 0)    * (sf.variabilityFactor  ?? 1.0));
    const gustV = r2((pf.gustFrequency ?? 0)      * (sf.gustFactor         ?? 1.0));
    const flV   = r2(pf.fanLimit ?? 0);
    const minV  = r2(pf.minFan ?? 0);
    const tlV   = r2(pf.turbulenceLengthScale ?? 0);
    const tsV   = r2(pf.turbulenceIntensitySigma ?? 0);
    const thBV  = r2((pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor   ?? 1.0));
    const thRV  = r2(pf.thermalBubbleRadius ?? 0);

    if (C.el.intensity())   C.el.intensity().value   = intV;
    if (C.el.variability()) C.el.variability().value = varV;
    if (C.el.gustFreq())    C.el.gustFreq().value    = gustV;
    if (C.el.fanLimit())    C.el.fanLimit().value    = flV;
    if (C.el.minFan())      C.el.minFan().value      = minV;
    if (C.el.turbLen())     C.el.turbLen().value     = tlV;
    if (C.el.turbSig())     C.el.turbSig().value     = tsV;
    if (C.el.thermStr())    C.el.thermStr().value    = thBV;
    if (C.el.thermRad())    C.el.thermRad().value    = thRV;

    P.updatePresetDescription();
    C.markDirty();
};

// ============================================================
// 6) 임시 적용
// ============================================================
P.applyTempPreset = async () => {
    const presetCode = C.el.preset() ? C.el.preset().value : "";
    const styleCode  = C.el.style()  ? C.el.style().value  : "BALANCE";
    const forever    = C.el.overrideForever() ? C.el.overrideForever().checked : false;
    const sec        = forever ? 0 : parseInt(C.el.overrideSeconds() ? C.el.overrideSeconds().value || "300" : "300", 10);

    if (!presetCode) { SNW.toast("프리셋을 선택하세요.", "warn"); return; }

    P.pushRecentPreset(presetCode);

    const preset = C.state.windDictPresets.find(p => p.code === presetCode);
    if (!preset || !preset.factors) { SNW.toast("프리셋 정보를 불러올 수 없습니다.", "err"); return; }

    const style = C.state.windDictStyles.find(s => s.code === styleCode) || {};
    const sf = style.factors || {};
    const pf = preset.factors;

    const baseInt  = (pf.windIntensity ?? 0)      * (sf.intensityFactor   ?? 1.0);
    const baseVar  = (pf.windVariability ?? 0)    * (sf.variabilityFactor ?? 1.0);
    const baseGust = (pf.gustFrequency ?? 0)      * (sf.gustFactor        ?? 1.0);
    const baseFL   = pf.fanLimit ?? 0;
    const baseMin  = pf.minFan ?? 0;
    const baseTL   = pf.turbulenceLengthScale ?? 0;
    const baseTS   = pf.turbulenceIntensitySigma ?? 0;
    const baseThB  = (pf.thermalBubbleStrength ?? 0) * (sf.thermalFactor  ?? 1.0);
    const baseThR  = pf.thermalBubbleRadius ?? 0;

    const num = (fn) => (Number(fn && fn().value) || 0);
    const adj = {
        windIntensity:            num(C.el.intensity)   - baseInt,
        windVariability:          num(C.el.variability) - baseVar,
        gustFrequency:            num(C.el.gustFreq)    - baseGust,
        fanLimit:                 num(C.el.fanLimit)    - baseFL,
        minFan:                   num(C.el.minFan)      - baseMin,
        turbulenceLengthScale:    num(C.el.turbLen)     - baseTL,
        turbulenceIntensitySigma: num(C.el.turbSig)     - baseTS,
        thermalBubbleStrength:    num(C.el.thermStr)    - baseThB,
        thermalBubbleRadius:      num(C.el.thermRad)    - baseThR,
    };

    const body = { presetCode, styleCode, durationSec: sec, forever, adjust: adj };
    await SNW.api.post(SNW_API.API_HTTP_CTL_OVR_PRESET, body, "임시 적용");
    setTimeout(C.loadStateOnce, 300);
};

P.stopTemp = async () => {
    await SNW.api.post(SNW_API.API_HTTP_CTL_OVR_CLEAR, null, "임시 적용 중지");
    setTimeout(C.loadStateOnce, 300);
};

// ============================================================
// 7) 저장
// ============================================================
P.saveMotionPatch = async () => {
    const num = (fn) => (Number(fn && fn().value) || 0);
    const motionBody = {
        motion: {
            sim: {
                presetCode:      C.el.preset() ? C.el.preset().value : null,
                styleCode:       C.el.style()  ? C.el.style().value  : null,
                fanPowerEnabled: C.el.fanPower() ? C.el.fanPower().checked : true,
                intensity:       num(C.el.intensity),
                variability:     num(C.el.variability),
                gustFreq:        num(C.el.gustFreq),
                fanLimit:        num(C.el.fanLimit),
                minFan:          num(C.el.minFan),
                turbLenScale:    num(C.el.turbLen),
                turbSigma:       num(C.el.turbSig),
                thermalStrength: num(C.el.thermStr),
                thermalRadius:   num(C.el.thermRad),
            },
        },
    };

    await SNW.api.post(SNW_API.API_HTTP_MOTION, motionBody, "풍속 설정");
    await SNW.api.post(SNW_API.API_HTTP_CONFIG_SAVE, {}, "", true);

    if (C.state.overrideActive) {
        await SNW.api.post(SNW_API.API_HTTP_CTL_OVR_CLEAR, null, "", true);
    }

    C.state.configDirty = false;
    C.updateDirtyButton();
    SNW.toast("풍속 설정이 저장되었습니다.", "ok");
    setTimeout(C.loadStateOnce, 300);
};

P.saveTimingPatch = async () => {
    const body = {
        motion: {
            timing: {
                simIntervalMs:     Number(C.el.simInt().value || 0),
                gustIntervalMs:    Number(C.el.gustInt().value || 0),
                thermalIntervalMs: Number(C.el.thermalInt().value || 0),
            },
        },
    };
    await SNW.api.post(SNW_API.API_HTTP_MOTION, body, "타이밍 설정");
    C.markDirty();
};

// ============================================================
// 8) AI 프리셋 추천
// ============================================================
P.handleAiPresetRecommend = async () => {
    if (!C.state.windDictPresets.length) {
        SNW.toast("프리셋 목록이 비어있습니다.", "warn");
        return;
    }

    const userPrompt = window.prompt(
        "어떤 바람을 원하시나요?\n" +
        "(예: 지금 좀 더 시원하게 / 잠잘 때 조용하고 약하게 / 집중이 잘 되는 바람)"
    );
    if (!userPrompt || !userPrompt.trim()) return;

    const presetCatalog = C.state.windDictPresets.map((p) => {
        const f = p.factors || {};
        return `- ${p.code} (${p.name}): 강도 ${C.r2(f.windIntensity)} · 변동 ${C.r2(f.windVariability)} · 돌풍 ${C.r2(f.gustFrequency)} · 팬상한 ${C.r2(f.fanLimit)}`;
    }).join("\n");

    const systemPrompt =
        "당신은 스마트 자연풍 시스템의 바람 엔지니어입니다. " +
        "사용자의 자연어 요청을 분석해 가장 적합한 presetCode·styleCode·조정값을 선택합니다. " +
        "styleCode는 BALANCE/ACTIVE/FOCUS/RELAX/SLEEP 중 하나여야 합니다. " +
        "windIntensity·windVariability 조정값은 -30~+30 정수입니다. " +
        "다른 설명 없이 JSON만 반환합니다.";

    const userQuery =
        `사용 가능한 프리셋:\n${presetCatalog}\n\n` +
        `사용자 요청: "${userPrompt.trim()}"\n\n` +
        `위 프리셋 중 가장 적합한 것을 선택하고 JSON으로 반환하세요.`;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            presetCode: { type: "STRING" },
            styleCode: { type: "STRING" },
            windIntensity: { type: "NUMBER" },
            windVariability: { type: "NUMBER" },
            reason: { type: "STRING" },
        },
        propertyOrdering: ["presetCode", "styleCode", "windIntensity", "windVariability", "reason"],
    };

    const reqBody = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    };

    SNW.loading.show();
    try {
        const apiKey = SNW.getApiKey();
        const resp = await fetch(SNW_API.API_HTTP_GEMINI_PROXY, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { "X-API-Key": apiKey } : {}),
            },
            body: JSON.stringify(reqBody),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AI 응답 없음");

        const rec = JSON.parse(text);

        if (rec.presetCode && C.state.windDictPresets.some(p => p.code === rec.presetCode)) {
            if (C.el.preset()) C.el.preset().value = rec.presetCode;
            if (rec.styleCode && C.el.style() &&
                C.state.windDictStyles.some(s => s.code === rec.styleCode)) {
                C.el.style().value = rec.styleCode;
            }

            P.onPresetOrStyleChanged();

            if (C.el.intensity() && Number.isFinite(rec.windIntensity)) {
                const cur = Number(C.el.intensity().value) || 0;
                C.el.intensity().value = Math.max(0, Math.min(100, cur + rec.windIntensity));
            }
            if (C.el.variability() && Number.isFinite(rec.windVariability)) {
                const cur = Number(C.el.variability().value) || 0;
                C.el.variability().value = Math.max(0, Math.min(100, cur + rec.windVariability));
            }

            C.markDirty();
            P.updateFavButton();
            SNW.toast(`🤖 AI 추천: ${rec.presetCode} — ${rec.reason || ""}`, "ok");
        } else {
            SNW.toast("AI가 유효한 프리셋을 반환하지 않았습니다.", "warn");
        }
    } catch (e) {
        SNW.toast(`AI 추천 실패: ${e.message}`, "err");
    } finally {
        SNW.loading.hide();
    }
};

})();
