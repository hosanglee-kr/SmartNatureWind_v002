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
            wrap.className = 'snw-profile-list'; // CSS 재사용
            
            this._presets.forEach((p, idx) => {
                const f = p.factors || {};
                wrap.appendChild(SNW.DomUtil.html`
                    <div class="snw-profile-item" data-idx="${idx}">
                        <div class="snw-profile-head">
                            <span class="snw-profile-no">#${idx}</span>
                            <span class="snw-profile-name">${p.name || p.code || ''}</span>
                            <span style="font-size:11px;color:var(--snw-text-faint);">(${p.code || ''})</span>
                            <button type="button" class="snw-btn-icon" data-action="edit-preset" data-id="${idx}" title="편집">✏️</button>
                            <button type="button" class="snw-btn-icon snw-btn-icon--danger" data-action="del-preset" data-id="${idx}" title="삭제">🗑</button>
                        </div>
                        <div class="snw-schedule-meta" style="font-size:11px;color:var(--snw-text-dim);margin-top:6px;flex-wrap:wrap;display:flex;gap:8px;">
                            <span>강도: ${f.windIntensity ?? '-'}%</span>
                            <span>변동성: ${f.windVariability ?? '-'}%</span>
                            <span>돌풍: ${f.gustFrequency ?? '-'}%</span>
                            <span>팬한계: ${f.fanLimit ?? '-'}%</span>
                            <span>최소팬: ${f.minFan ?? '-'}%</span>
                        </div>
                    </div>`);
            });
            listSlot.appendChild(wrap);
            SNW.I18n.applyTo(listSlot);
        }

        // [신규] 프리셋 추가 모달
        async _onAdd() {
            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">이름
                    <input type="text" id="wp-name" value="New Preset" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">코드 (영문 대문자)
                    <input type="text" id="wp-code" value="CUSTOM" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">강도 (0~100)
                    <input type="number" id="wp-intensity" value="70" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">변동성 (0~100)
                    <input type="number" id="wp-variability" value="50" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
            `;
            SNW.UI.modal('프리셋 추가', inputDiv, async () => {
                const name = inputDiv.querySelector('#wp-name').value;
                const code = inputDiv.querySelector('#wp-code').value.toUpperCase();
                const intensity = Number(inputDiv.querySelector('#wp-intensity').value);
                const variability = Number(inputDiv.querySelector('#wp-variability').value);
                if (!name || !code) { SNW.ToastUtil.warn('이름과 코드를 입력하세요.'); return false; }
                
                const body = { preset: { 
                    name, code, 
                    factors: { windIntensity: intensity, windVariability: variability, gustFrequency: 45, fanLimit: 90, minFan: 10 } 
                }};
                try { 
                    await SNW.Api.addWindProfile(body); 
                    SNW.ToastUtil.success('추가됨'); 
                    await this._load(); 
                    return true; 
                } catch(e) { SNW.ErrorHandler.handle(e, 'windprofile.add'); return false; }
            });
        }

        // [신규] 프리셋 편집 모달
        async _onEdit(id) {
            const target = this._presets[id];
            if (!target) return;
            const f = target.factors || {};
            const inputDiv = document.createElement('div');
            inputDiv.innerHTML = `
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">이름
                    <input type="text" id="wp-name" value="${SNW.DomUtil.escape(target.name || '')}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">강도 (0~100)
                    <input type="number" id="wp-intensity" value="${f.windIntensity ?? 70}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--snw-text-dim);">변동성 (0~100)
                    <input type="number" id="wp-variability" value="${f.windVariability ?? 50}" style="width:100%;padding:8px;margin-top:4px;background:var(--snw-surface-2);border:1px solid var(--snw-border);color:var(--snw-text);border-radius:4px;">
                </label>
            `;
            SNW.UI.modal('프리셋 편집', inputDiv, async () => {
                const name = inputDiv.querySelector('#wp-name').value;
                const intensity = Number(inputDiv.querySelector('#wp-intensity').value);
                const variability = Number(inputDiv.querySelector('#wp-variability').value);
                if (!name) { SNW.ToastUtil.warn('이름을 입력하세요.'); return false; }
                
                const body = { preset: { 
                    ...target, name,
                    factors: { ...f, windIntensity: intensity, windVariability: variability }
                }};
                try { 
                    await SNW.Api.updateWindProfile(id, body); 
                    SNW.ToastUtil.success('수정됨'); 
                    await this._load(); 
                    return true; 
                } catch(e) { SNW.ErrorHandler.handle(e, 'windprofile.edit'); return false; }
            });
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
