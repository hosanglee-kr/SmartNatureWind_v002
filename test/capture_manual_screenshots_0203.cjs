/**
 * capture_manual_screenshots_0203.cjs
 * 안드로이드 크롬(Pixel 7, 412x915 터치) 환경에서 사용자 매뉴얼 삽입용
 * 전체 화면 및 개별 기능 영역 클로즈업 캡처 자동 생성 도구
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let playwright;
try {
    playwright = require('playwright');
} catch {
    try {
        const globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
        playwright = require(path.join(globalRoot, 'playwright'));
    } catch {
        const fallbackPath = 'C:/Users/A003comlhsd/AppData/Roaming/npm/node_modules/playwright';
        playwright = require(fallbackPath);
    }
}
const { chromium, devices } = playwright;

const REPO_ROOT = path.resolve(__dirname, '..');
const HTML_DIR  = path.join(REPO_ROOT, 'src/v0203/data_v0203_src/html_v0203');
const JSON_DIR  = path.join(REPO_ROOT, 'src/v0203/data_v0203_src/json');
const IMG_DIR   = path.join(REPO_ROOT, 'src/v0203/User_Manual_0203/images');

fs.mkdirSync(IMG_DIR, { recursive: true });

function startStaticServer(initialPort = 8899) {
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js':   'application/javascript; charset=utf-8',
        '.css':  'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png':  'image/png',
        '.svg':  'image/svg+xml',
        '.ico':  'image/x-icon'
    };

    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            let uri = req.url.split('?')[0];
            let filePath = '';

            if (uri.startsWith('/json/')) {
                filePath = path.join(JSON_DIR, uri.replace('/json/', ''));
            } else {
                if (uri === '/' || uri === '') uri = '/index.html';
                filePath = path.join(HTML_DIR, uri);
            }

            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found: ' + uri);
                return;
            }

            const ext = path.extname(filePath);
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(startStaticServer(initialPort + 1));
            } else {
                reject(err);
            }
        });

        server.listen(initialPort, '127.0.0.1', () => {
            resolve({ server, port: initialPort });
        });
    });
}

async function captureAll() {
    console.log('🚀 사용자 매뉴얼용 안드로이드 크롬 캡처 (전체 화면 & 개별 기능 영역) 시작...');
    const { server, port } = await startStaticServer(8899);
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        ...devices['Pixel 7'],
        viewport: { width: 412, height: 915 }
    });

    const page = await context.newPage();
    await page.addInitScript(() => {
        localStorage.setItem('snw.onboarded', '1');
        localStorage.setItem('snw.level', 'L2');
    });

    const baseUrl = `http://127.0.0.1:${port}/index.html?offline=1`;

    try {
        // =========================================================
        // [1] 대시보드 관련 (전체 및 개별 영역)
        // =========================================================
        console.log('📸 1. 대시보드 제어 탭...');
        await page.goto(`${baseUrl}#/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '01_dashboard_main.png') });

        // 일반 선풍기 슬라이더 영역 클로즈업
        console.log('📸 16. 일반 선풍기 슬라이더 조작 영역...');
        try {
            const fanCard = page.locator('.snw-card--fan');
            if (await fanCard.isVisible()) {
                await fanCard.screenshot({ path: path.join(IMG_DIR, '16_fan_slider.png') });
            }
        } catch(e) { console.warn('16 err:', e.message); }

        // 2. 대시보드 환경 탭
        console.log('📸 2. 대시보드 환경 탭...');
        await page.click('[data-dash-tab="env"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(IMG_DIR, '02_dashboard_env.png') });

        // 실내 쾌적도 카드 클로즈업
        console.log('📸 13. 실내 쾌적도 추천 카드 클로즈업...');
        try {
            const comfortCard = page.locator('[data-slot="comfort-card"]');
            if (await comfortCard.isVisible()) {
                await comfortCard.screenshot({ path: path.join(IMG_DIR, '13_comfort_card.png') });
            }
        } catch(e) { console.warn('13 err:', e.message); }

        // 3. 대시보드 프리셋 탭
        console.log('📸 3. 대시보드 프리셋 탭...');
        await page.click('[data-dash-tab="preset"]');
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(IMG_DIR, '03_dashboard_preset.png') });

        // 바람 스타일 5종 탭 클로즈업
        console.log('📸 14. 바람 스타일 5종 탭 클로즈업...');
        try {
            const styleCard = page.locator('.snw-card--style');
            if (await styleCard.isVisible()) {
                await styleCard.screenshot({ path: path.join(IMG_DIR, '14_style_selector.png') });
            }
        } catch(e) { console.warn('14 err:', e.message); }

        // 10대 자연풍 프리셋 그리드 클로즈업
        console.log('📸 15. 10대 자연풍 프리셋 그리드 클로즈업...');
        try {
            const presetGrid = page.locator('.snw-card--preset');
            if (await presetGrid.isVisible()) {
                await presetGrid.screenshot({ path: path.join(IMG_DIR, '15_preset_grid.png') });
            }
        } catch(e) { console.warn('15 err:', e.message); }

        // 프리셋 카드 하나 클릭하여 세션 가동시키기 (NowPlaying Bar 활성화)
        console.log('🎵 세션 가동 (Now Playing Bar 활성화)...');
        try {
            const firstPreset = page.locator('[data-slot="presets"] button').first();
            if (await firstPreset.isVisible()) {
                await firstPreset.click();
                await page.waitForTimeout(600);
            }

            // Now Playing Bar 클로즈업
            console.log('📸 11. Now Playing Bar 클로즈업...');
            const npBar = page.locator('#now-playing-bar');
            if (await npBar.isVisible()) {
                await npBar.screenshot({ path: path.join(IMG_DIR, '11_nowplaying_bar.png') });

                // Now Playing Bar 확장 클릭 -> 세션 상세 확장 모달
                console.log('📸 12. 세션 상세 확장 모달...');
                await page.click('.snw-nowplaying__left');
                await page.waitForTimeout(600);
                await page.screenshot({ path: path.join(IMG_DIR, '12_nowplaying_modal.png') });

                // 모달 닫기
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
            }
        } catch(e) { console.warn('NP err:', e.message); }

        // 4. 사이드바 드로어 오픈
        console.log('📸 4. 사이드바 드로어...');
        try {
            await page.click('#btn-menu');
            await page.waitForTimeout(400);
            await page.screenshot({ path: path.join(IMG_DIR, '04_sidebar_drawer.png') });
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
        } catch(e) { console.warn('4 err:', e.message); }

        // =========================================================
        // [2] 자동화 메뉴 (스튜디오, 플레이리스트, 스케줄러, 타이머)
        // =========================================================
        console.log('📸 5. Wind Studio 작곡기...');
        await page.goto(`${baseUrl}#/automation/studio`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '05_wind_studio.png') });

        // 스튜디오 스텝 카드 클로즈업
        console.log('📸 17. 스튜디오 개별 스텝 카드 클로즈업...');
        try {
            const stepCard = page.locator('.snw-step-card').first();
            if (await stepCard.isVisible()) {
                await stepCard.screenshot({ path: path.join(IMG_DIR, '17_studio_step_card.png') });

                // 물리 세부조정 Override 열린 상태 클로즈업
                console.log('📸 18. 스튜디오 Override 세부조정 클로즈업...');
                const overrideSummary = stepCard.locator('.snw-step-card__override summary');
                if (await overrideSummary.isVisible()) {
                    await overrideSummary.click();
                    await page.waitForTimeout(300);
                    const overrideBlock = stepCard.locator('.snw-step-card__override');
                    await overrideBlock.screenshot({ path: path.join(IMG_DIR, '18_studio_override.png') });
                }
            }
        } catch(e) { console.warn('Studio step err:', e.message); }

        // 재생 목록 (Playlist)
        console.log('📸 6. Playlist 재생 목록...');
        await page.goto(`${baseUrl}#/automation/playlist`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '06_playlist.png') });

        // 주간 스케줄러 (Schedule)
        console.log('📸 19. 주간 스케줄러 설정 패널...');
        await page.goto(`${baseUrl}#/automation/schedule`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '19_weekly_schedule.png') });

        // 세션 타이머
        console.log('📸 7. 세션 타이머 패널...');
        await page.goto(`${baseUrl}#/automation/timer`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '07_timer.png') });

        // =========================================================
        // [3] AI 어시스턴트 & 플로팅 바텀시트
        // =========================================================
        console.log('📸 8. Gemini AI Studio...');
        await page.goto(`${baseUrl}#/ai`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '08_ai_assistant.png') });

        // 대시보드로 돌아가서 플로팅 마이크 FAB 클릭 -> AI 바텀시트
        console.log('📸 20. 플로팅 마이크 FAB 바텀시트...');
        try {
            await page.goto(`${baseUrl}#/dashboard`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(600);
            const aiFab = page.locator('.snw-ai-fab');
            if (await aiFab.isVisible()) {
                await aiFab.click();
                await page.waitForTimeout(600);
                await page.screenshot({ path: path.join(IMG_DIR, '20_ai_fab_sheet.png') });
                
                // 바텀시트 확실하게 닫기
                await page.evaluate(() => {
                    if (window.SNW && window.SNW.AiSheet && typeof window.SNW.AiSheet.close === 'function') {
                        window.SNW.AiSheet.close();
                    }
                    const container = document.querySelector('.snw-ai-sheet-container');
                    if (container) container.remove();
                });
                await page.waitForTimeout(300);
            }
        } catch(e) { console.warn('20 err:', e.message); }

        // =========================================================
        // [4] 차트, 모니터, 설정, 진단, 로그
        // =========================================================
        console.log('📸 9. 실시간 물리 시뮬레이션 차트...');
        await page.goto(`${baseUrl}#/chart`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(IMG_DIR, '09_chart.png') });

        console.log('📸 10. 모니터 히스토리 타임라인...');
        try {
            await page.goto(`${baseUrl}#/monitor`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(600);
            const retroTab = page.locator('[data-tab="retro"]');
            if (await retroTab.isVisible()) {
                await retroTab.click({ force: true });
                await page.waitForTimeout(600);
            }
            await page.screenshot({ path: path.join(IMG_DIR, '10_monitor_history.png') });
        } catch(e) { console.warn('10 err:', e.message); }

        console.log('📸 21. 시스템 및 네트워크 설정...');
        try {
            await page.goto(`${baseUrl}#/settings`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.screenshot({ path: path.join(IMG_DIR, '21_settings_page.png') });
        } catch(e) { console.warn('21 err:', e.message); }

        console.log('📸 22. 시스템 자가 진단...');
        try {
            await page.goto(`${baseUrl}#/diagnostics`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.screenshot({ path: path.join(IMG_DIR, '22_diagnostics_page.png') });
        } catch(e) { console.warn('22 err:', e.message); }

        console.log('📸 23. 실시간 시스템 동작 로그...');
        try {
            await page.goto(`${baseUrl}#/logs`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(800);
            await page.screenshot({ path: path.join(IMG_DIR, '23_logs_page.png') });
        } catch(e) { console.warn('23 err:', e.message); }

        console.log('🎉 총 23종 안드로이드 크롬 전체 및 개별 영역 화면 캡처 완료!');
    } catch (e) {
        console.error('캡처 중 오류 발생:', e);
    } finally {
        await browser.close();
        server.close();
    }
}

captureAll();
