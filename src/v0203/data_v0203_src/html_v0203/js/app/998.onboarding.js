// =========================================================
// 998.onboarding.js — 첫 방문 온보딩 (4단계)
// =========================================================
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';

    const LS_KEY = 'snw.onboarded';

    SNW.Onboarding = {
        async start() {
            // 이미 완료
            if (localStorage.getItem(LS_KEY) === '1') return;

            // =========================================================
            // 1) 언어
            // =========================================================
            const lang = await this._stepLang();
            if (lang && SNW.I18n && typeof SNW.I18n.setLang === 'function') {
                SNW.I18n.setLang(lang);
            }

            // =========================================================
            // 2) WiFi 안내 (이미 연결됨 가정)
            // =========================================================
            await this._stepWifi();
            await new Promise(r => setTimeout(r, 300));

            // =========================================================
            // 3) 첫 바람 선택 (큐레이션 3개)
            // =========================================================
            const choice = await this._stepFirstBreeze();

            // =========================================================
            // 4) 지금 시작?
            // =========================================================
            if (choice) {
                const startNow = await this._stepStartNow(choice);
                if (startNow && SNW.Api) {
                    try {
                        if (typeof SNW.Api.startPreset === 'function') {
                            await SNW.Api.startPreset(choice.presetCode, choice.styleCode);
                        } else if (typeof SNW.Api.startSession === 'function') {
                            await SNW.Api.startSession('PRESET', {
                                presetCode: choice.presetCode,
                                styleCode: choice.styleCode,
                            });
                        }
                    } catch (e) {
                        if (SNW.LogUtil && typeof SNW.LogUtil.warn === 'function') {
                            SNW.LogUtil.warn('onboarding start failed', e);
                        }
                    }
                }
            }

            // 완료
            localStorage.setItem(LS_KEY, '1');
        },

        // =========================================================
        // 1) 언어 선택
        // =========================================================
        _stepLang() {
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">🌿</div>
                <h2>Smart Nature Wind</h2>
                <p class="snw-onboarding-desc">
                    자연의 바람을 그대로 담은 스마트 선풍기<br>
                    A smart fan that recreates nature's breeze
                </p>
                <div class="snw-onboarding-choices">
                    <button type="button" class="snw-onboarding-choice" data-lang="ko">
                        <span class="snw-onboarding-choice__icon">🇰🇷</span>
                        <span>한국어</span>
                    </button>
                    <button type="button" class="snw-onboarding-choice" data-lang="en">
                        <span class="snw-onboarding-choice__icon">🇬🇧</span>
                        <span>English</span>
                    </button>
                </div>
            `;

            return new Promise(resolve => {
                let modalRef = null;
                content.querySelectorAll('[data-lang]').forEach(btn => {
                    btn.onclick = () => {
                        resolve(btn.getAttribute('data-lang'));
                        if (modalRef && typeof modalRef.close === 'function') {
                            modalRef.close();
                        }
                    };
                });
                modalRef = SNW.UI.modal('환영합니다 / Welcome', content, null, null,
                    { hideOk: true, hideCancel: true, width: '440px' });
            });
        },

        // =========================================================
        // 2) WiFi 안내
        // =========================================================
        _stepWifi() {
            const t = (k, fb) => (SNW.I18n && typeof SNW.I18n.t === 'function' ? SNW.I18n.t(k) : fb);
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">📶</div>
                <h2>${t('onboarding.wifiTitle', 'Wi-Fi 연결 안내')}</h2>
                <p class="snw-onboarding-desc">
                    ${t('onboarding.wifiDesc', 'NatureWind AP에 연결되었거나 홈 Wi-Fi에 정상 연결되었습니다.')}
                </p>
                <div class="snw-onboarding-info">
                    <div><b>SSID:</b> NatureWind</div>
                    <div><b>Password:</b> 2540</div>
                    <div><b>URL:</b> http://192.168.4.1</div>
                </div>
            `;

            return new Promise(resolve => {
                SNW.UI.modal(
                    t('onboarding.step2', '단계 2: 네트워크 안내'),
                    content,
                    () => { resolve(); return true; },
                    null,
                    { okLabel: t('onboarding.connected', '확인 완료'), hideCancel: true, width: '440px' }
                );
            });
        },

        // =========================================================
        // 3) 첫 바람 선택
        // =========================================================
        _stepFirstBreeze() {
            const t = (k, fb) => (SNW.I18n && typeof SNW.I18n.t === 'function' ? SNW.I18n.t(k) : fb);
            const choices = [
                {
                    presetCode: 'OCEAN', styleCode: 'BALANCE',
                    icon: '🌊',
                    title: t('onboarding.breeze.ocean', '시원한 바닷바람'),
                    desc: t('onboarding.breeze.oceanDesc', '탁 트인 해안가의 상쾌하고 청량한 리듬'),
                },
                {
                    presetCode: 'FOREST_CANOPY', styleCode: 'RELAX',
                    icon: '🌲',
                    title: t('onboarding.breeze.forest', '숲속 산들바람'),
                    desc: t('onboarding.breeze.forestDesc', '나뭇잎을 부드럽게 스치는 편안한 휴식'),
                },
                {
                    presetCode: 'MOUNTAIN', styleCode: 'ACTIVE',
                    icon: '🏔️',
                    title: t('onboarding.breeze.mountain', '고산 능선바람'),
                    desc: t('onboarding.breeze.mountainDesc', '역동적이고 강력한 피톤치드 에너자이징'),
                },
            ];

            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">🍃</div>
                <h2>${t('onboarding.firstBreezeTitle', '처음 만나는 바람')}</h2>
                <p class="snw-onboarding-desc">${t('onboarding.firstBreezeDesc', '원하시는 기분의 자연 바람을 선택해보세요.')}</p>
                <div class="snw-onboarding-breeze-choices">
                    ${choices.map((c, i) => `
                        <button type="button" class="snw-breeze-choice" data-idx="${i}">
                            <div class="snw-breeze-choice__icon">${c.icon}</div>
                            <div class="snw-breeze-choice__title">${c.title}</div>
                            <div class="snw-breeze-choice__desc">${c.desc}</div>
                        </button>
                    `).join('')}
                </div>
            `;

            return new Promise(resolve => {
                let modalRef = null;
                content.querySelectorAll('[data-idx]').forEach(btn => {
                    btn.onclick = () => {
                        const idx = Number(btn.getAttribute('data-idx'));
                        resolve(choices[idx]);
                        if (modalRef && typeof modalRef.close === 'function') {
                            modalRef.close();
                        }
                    };
                });
                modalRef = SNW.UI.modal(
                    t('onboarding.step3', '단계 3: 첫 바람 선택'),
                    content, null, null,
                    { hideOk: true, hideCancel: true, width: '480px' }
                );
            });
        },

        // =========================================================
        // 4) 지금 시작?
        // =========================================================
        _stepStartNow(choice) {
            const t = (k, fb, vars) => {
                if (SNW.I18n && typeof SNW.I18n.t === 'function') {
                    return SNW.I18n.t(k, vars);
                }
                return fb;
            };
            const content = document.createElement('div');
            content.className = 'snw-onboarding-step';
            content.innerHTML = `
                <div class="snw-onboarding-hero">${choice.icon || '🍃'}</div>
                <h2>${t('onboarding.startNowTitle', '바람 시작하기')}</h2>
                <p class="snw-onboarding-desc">
                    ${t('onboarding.startNowDesc', `선택하신 '${choice.title}'을(를) 지금 즉시 재생할까요?`, { name: choice.title })}
                </p>
            `;

            return new Promise(resolve => {
                SNW.UI.modal(
                    t('onboarding.step4', '단계 4: 시작 확인'),
                    content,
                    () => { resolve(true); return true; },
                    () => { resolve(false); },
                    {
                        okLabel: t('onboarding.startNow', '지금 시작'),
                        cancelLabel: t('onboarding.later', '나중에'),
                        width: '400px',
                    }
                );
            });
        },
    };
})(window.SNW);

