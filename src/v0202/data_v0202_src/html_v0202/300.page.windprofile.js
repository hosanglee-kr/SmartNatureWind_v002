/*
 * ------------------------------------------------------
 * 소스명   : 300.page.windprofile.js
 * 모듈     : SNW.Page.Windprofile
 * 레이어   : Layer 4 (페이지 로직)
 * 기능 요약:
 *  - 바람 프리셋 관리 (WindProfile CRUD)
 *  - 프리셋 목록 표시 / 추가 / 수정 / 삭제
 * ------------------------------------------------------
 */
/* ---- 300.page.windprofile.js ---- */
window.SNW = window.SNW || {};
SNW.Page = SNW.Page || {};
(function (SNW) {
    'use strict';
    
    SNW.Page.Windprofile = class Windprofile {
        constructor(container) { 
            this.el = container; 
            this._active = true; 
            this._presets = []; 
        }

        async mount() {
            this.el.innerHTML = '';
            this.el.appendChild(SNW.Tpl.windprofile());
            SNW.I18n.applyTo(this.el);
            await this._load();
            
            SNW.DomUtil.delegate(this.el, '[data-action="add-preset"]', 'click', () => this._onAdd());
            SNW.DomUtil.delegate(this.el, '[data-action="del-preset"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (!isNaN(id)) this._onDelete(id);
            });
            SNW.DomUtil.delegate(this.el, '[data-action="edit-preset"]', 'click', (e, el) => {
                const id = Number(el.getAttribute('data-id'));
                if (!isNaN(id)) this._onEdit(id);
            });
        }
        unmount(){ this._active = false; }

        async _load() {
            try {
                const data = await SNW.Api.listWindProfiles();
                if (!this._active) return;
                this._presets = (data && data.windDict && data.windDict.presets) || [];
                this._renderList();
            } catch(e) { SNW.ErrorHandler.handle(e, 'windprofile.load'); }
        }

        _renderList() {
            const listSlot = this.el.querySelector('[data-slot="list"]');
            if (!listSlot) return;
            listSlot.innerHTML = '';
            
            listSlot.appendChild(SNW.DomUtil.html`
                <div class="snw-toolbar">
                    <button type="button" class="snw-btn snw-btn-primary" data-action="add-preset" data-i18n="common.add">프리셋 추가</button>
                </div>`);

            if (!this._presets.length) {
                listSlot.appendChild(SNW.DomUtil.html`<div class="snw-empty" data-i18n="common.noData">데이터 없음</div>`);
                SNW.I18n.applyTo(listSlot);
                return;
            }

            const wrap = document.createElement('div');
            wrap.className = 'snw-profile-list'; 
            
            this._presets.forEach((p, idx) => {
                const f = p.factors || {};
                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-profile-item">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${idx}</span>
                            <span class="snw-profile-name">${p.name || p.code || ''}</span>
                            <span style="font-size:11px;color:var(--snw-text-faint);">(${p.code || ''})</span>
                            <button type="button" class="snw-btn-icon" data-action="edit-preset" data-id="${idx}" title="편집">✏️</button>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger" data-action="del-preset" data-id="${idx}" title="삭제">🗑</button>
                        </div>
                        <!-- 모든 팩터 상세 표시 -->
                        <div class="snw-schedule-meta" style="font-size:11px;color:var(--snw-text-dim);margin-top:6px;flex-wrap:wrap;display:flex;gap:8px;">
                            <span>강도: ${f.windIntensity ?? '-'}%</span>
                            <span>변동성: ${f.windVariability ?? '-'}%</span>
                            <span>돌풍: ${f.gustFrequency ?? '-'}%</span>
                            <span>팬한계: ${f.fanLimit ?? '-'}%</span>
                            <span>최소팬: ${f.minFan ?? '-'}%</span>
                            <span>난류크기: ${f.turbulenceLengthScale ?? '-'}</span>
                            <span>난류강도: ${f.turbulenceIntensitySigma ?? '-'}</span>
                            <span>열기포강도: ${f.thermalBubbleStrength ?? '-'}</span>
                            <span>열기포반경: ${f.thermalBubbleRadius ?? '-'}</span>
                            <span>기본최소풍속: ${f.baseMinWind ?? '-'}m/s</span>
                            <span>기본최대풍속: ${f.baseMaxWind ?? '-'}m/s</span>
                        </div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
            SNW.I18n.applyTo(listSlot);
        }

        async _onAdd() {
            const inputDiv = this._buildPresetForm({ name:'New Preset', code:'CUSTOM', factors:{} });
            SNW.UI.modal('프리셋 추가', inputDiv, async () => {
                const body = this._readPresetForm(inputDiv);
                if (!body) return false;
                try { 
                    await SNW.Api.addWindProfile({ preset: body }); 
                    SNW.ToastUtil.success('추가됨'); 
                    await this._load(); 
                    return true; 
                } catch(e) { SNW.ErrorHandler.handle(e, 'windprofile.add'); return false; }
            });
        }

        async _onEdit(id) {
            const target = this._presets[id];
            if (!target) return;
            const inputDiv = this._buildPresetForm(target);
            SNW.UI.modal('프리셋 편집', inputDiv, async () => {
                const body = this._readPresetForm(inputDiv);
                if (!body) return false;
                body.code = target.code; // 코드는 변경 불가 유지
                try { 
                    await SNW.Api.updateWindProfile(id, { preset: body }); 
                    SNW.ToastUtil.success('수정됨'); 
                    await this._load(); 
                    return true; 
                } catch(e) { SNW.ErrorHandler.handle(e, 'windprofile.edit'); return false; }
            });
        }

        _buildPresetForm(p) {
            const f = p.factors || {};
            const div = document.createElement('div');
            div.innerHTML = `
                        <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">이름
                            <input type="text" id="wp-name" value="${SNW.DomUtil.escape(p.name || '')}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                        </label>
                        <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">코드 (영문 대문자)
                            <input type="text" id="wp-code" value="${SNW.DomUtil.escape(p.code || '')}" ${p.code?'disabled':''} style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                        </label>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">강도 (%)
                                <input type="number" id="wp-intensity" value="${f.windIntensity ?? 70}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                            </label>
                            <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">변동성 (%)
                                <input type="number" id="wp-variability" value="${f.windVariability ?? 50}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                            </label>
                            <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">돌풍 빈도 (%)
                                <input type="number" id="wp-gust" value="${f.gustFrequency ?? 45}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                            </label>
                            <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">팬 한계 (%)
                                <input type="number" id="wp-fanlimit" value="${f.fanLimit ?? 90}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                            </label>
                            <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">최소 팬 (%)
                                <input type="number" id="wp-minfan" value="${f.minFan ?? 10}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                            </label>
                        </div>
                    `;
            return div;
        }

        _readPresetForm(div) {
            const name = div.querySelector('#wp-name').value;
            const code = div.querySelector('#wp-code').value.toUpperCase();
            if (!name || !code) { SNW.ToastUtil.warn('이름과 코드를 입력하세요.'); return null; }
            return {
                name, code,
                factors: {
                    windIntensity: Number(div.querySelector('#wp-intensity').value),
                    windVariability: Number(div.querySelector('#wp-variability').value),
                    gustFrequency: Number(div.querySelector('#wp-gust').value),
                    fanLimit: Number(div.querySelector('#wp-fanlimit').value), // 대소문자 수정
                    minFan: Number(div.querySelector('#wp-minfan').value)      // 최소팬 필드 추가
                }
            };
        }

        async _onDelete(id) {
            if (!confirm(SNW.I18n.t('common.delete') + '?')) return;
            try { 
                await SNW.Api.deleteWindProfile(id); 
                SNW.ToastUtil.success('삭제됨'); 
                await this._load(); 
            } catch(e) { SNW.ErrorHandler.handle(e, 'windprofile.delete'); }
        }
    };
})(window.SNW);

