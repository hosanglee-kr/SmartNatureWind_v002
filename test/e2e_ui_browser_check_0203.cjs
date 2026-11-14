/**
 * ============================================================================
 * 파일명   : e2e_ui_browser_check_0203.cjs
 * 위치     : test/e2e_ui_browser_check_0203.cjs
 * 버전     : v0203 (Stage 10)
 * 목적     : PC(데스크톱 대화면) 및 안드로이드(모바일 반응형) 브라우저 환경에서
 *            Playwright 헤드리스 브라우저 엔진을 구동하여 렌더링, 레이아웃 규약,
 *            대시보드 3탭 전환 및 인터랙션, 터치 타깃, 콘솔 에러를 정밀 점검하는 도구.
 * 
 * 사용법   : node test/e2e_ui_browser_check_0203.cjs [--port 8899] [--headless]
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Playwright 모듈 로드 (로컬 -> 글로벌 npm root -> Windows 표준 순서)
let playwright;
try {
    playwright = require('playwright');
} catch {
    try {
        const globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
        playwright = require(path.join(globalRoot, 'playwright'));
    } catch {
        const fallbackPath = 'C:/Users/A003comlhsd/AppData/Roaming/npm/node_modules/playwright';
        if (fs.existsSync(fallbackPath)) {
            playwright = require(fallbackPath);
        } else {
            console.error('[ERROR] Playwright 패키지를 찾을 수 없습니다. (npm i -g playwright 실행 필요)');
            process.exit(1);
        }
    }
}
const { chromium, devices } = playwright;

// 경로 설정
const REPO_ROOT = path.resolve(__dirname, '..');
const HTML_DIR  = path.join(REPO_ROOT, 'src/v0203/data_v0203_src/html_v0203');
const DIST_HTML_DIR = path.join(REPO_ROOT, 'src/v0203/data_v0203/html_v0203');
const JSON_DIR  = path.join(REPO_ROOT, 'src/v0203/data_v0203_src/json');
const REPORT_DIR= path.join(__dirname, 'reports_ui');

// 2. 경량 임베디드 정적 웹 서버 (LittleFS 시뮬레이션)
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
            let isGzip = false;
            let effectiveExt = '';

            if (uri.startsWith('/json/')) {
                filePath = path.join(JSON_DIR, uri.replace('/json/', ''));
            } else {
                if (uri === '/' || uri === '') uri = '/index.html';
                filePath = path.join(HTML_DIR, uri);
                
                // .gz 요청 처리 (LittleFS / Nginx 시뮬레이션)
                if (!fs.existsSync(filePath) && uri.endsWith('.gz')) {
                    const uncompressedPath = path.join(HTML_DIR, uri.slice(0, -3));
                    const distGzPath = path.join(DIST_HTML_DIR, uri);
                    if (fs.existsSync(uncompressedPath)) {
                        filePath = uncompressedPath;
                    } else if (fs.existsSync(distGzPath)) {
                        filePath = distGzPath;
                        isGzip = true;
                    }
                } else if (fs.existsSync(filePath) && uri.endsWith('.gz')) {
                    isGzip = true;
                }
            }

            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found: ' + uri);
                return;
            }

            const cleanPath = isGzip ? filePath.slice(0, -3) : filePath;
            const ext = path.extname(cleanPath);
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            const headers = { 'Content-Type': contentType };
            if (isGzip) {
                headers['Content-Encoding'] = 'gzip';
            }

            res.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(res);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`[Server] 포트 ${initialPort} 사용 중, ${initialPort + 1}로 재시도...`);
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

// 3. 메인 E2E 검증 러너
async function runE2EUIInspection() {
    console.log('================================================================');
    console.log(' 🌐 Smart Nature Wind v0203 — PC & 안드로이드 브라우저 UI 정밀 점검');
    console.log('================================================================');

    fs.mkdirSync(REPORT_DIR, { recursive: true });

    const { server, port } = await startStaticServer(8899);
    console.log(`[Server] 정적 서버 기동 완료: http://127.0.0.1:${port}`);

    const browser = await chromium.launch({ headless: true });
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;

    function record(name, pass, detail = '') {
        totalChecks++;
        if (pass) {
            passedChecks++;
            console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
        } else {
            failedChecks++;
            console.log(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
        }
    }

    try {
        // -------------------------------------------------------------
        // [검증 1] PC 데스크톱 대화면 환경 (Viewport: 1280 × 800)
        // -------------------------------------------------------------
        console.log('\n🖥️  [1] PC 데스크톱 환경 점검 (1280 × 800, ADR-10 영구 사이드바)');
        console.log('----------------------------------------------------------------');

        const deskCtx = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
        });
        const deskPage = await deskCtx.newPage();
        await deskPage.addInitScript(() => {
            localStorage.setItem('snw.onboarded', '1');
            localStorage.setItem('snw.level', 'L2');
        });

        const deskErrors = [];
        deskPage.on('console', msg => { if (msg.type() === 'error') deskErrors.push(msg.text()); });
        deskPage.on('pageerror', err => deskErrors.push(err.message));

        await deskPage.goto(`http://127.0.0.1:${port}/index.html?offline=1`, { waitUntil: 'networkidle' });
        await deskPage.waitForTimeout(600);

        // 1-1) ADR-10 데스크톱 영구 사이드바 상시 노출 & 햄버거 메뉴 은닉
        const deskSidebar = await deskPage.locator('#snw-sidebar').isVisible();
        record('ADR-10 데스크톱 사이드바 상시 2열 고정', deskSidebar);

        const deskBtnMenu = await deskPage.locator('#btn-menu').isVisible();
        record('데스크톱 햄버거 메뉴 은닉 (display: none)', !deskBtnMenu);

        // 1-2) 하단 모바일 탭 바 은닉
        const deskBottomNav = await deskPage.locator('#mobile-bottom-nav').isVisible();
        record('하단 모바일 탭 바 은닉 (display: none)', !deskBottomNav);

        // 1-3) 대시보드 3탭 버튼 및 9종 시나리오 그리드
        const scenarioCards = await deskPage.locator('.snw-scenario-card').count();
        record('홈 9종(3×3) 원터치 시나리오 카드 렌더링', scenarioCards === 9, `${scenarioCards}/9개`);

        const tabsCount = await deskPage.locator('[data-dash-tab]').count();
        record('대시보드 3탭 버튼 존재 (제어/환경/프리셋)', tabsCount === 3, `${tabsCount}/3개`);

        const isCtrlActive = await deskPage.locator('[data-dash-tab="control"]').getAttribute('class');
        record('기본 활성 탭 [🎛️ 제어]', (isCtrlActive || '').includes('is-active'));

        const quickTimerBtn = await deskPage.locator('[data-action="timer-quick"]').count();
        record('Now Playing 인라인 ⏱️ 퀵 타이머 버튼 탑재', quickTimerBtn > 0);

        // 1-4) [🌡️ 환경] 탭 전환 및 Comfort 자동 모드 UI 점검
        await deskPage.click('[data-dash-tab="env"]');
        await deskPage.waitForTimeout(300);
        const isEnvVisible = await deskPage.locator('[data-dash-content="env"]').isVisible();
        const hasAutoComfortBox = await deskPage.locator('[data-slot="auto-comfort-box"]').isVisible();
        record('[환경] 탭 전환 및 Comfort 자동모드 토글 박스 표시', isEnvVisible && hasAutoComfortBox);

        // 1-5) [🌿 프리셋] 탭 전환 및 10대 자연풍 프리셋 그리드 지연 렌더링
        await deskPage.click('[data-dash-tab="preset"]');
        await deskPage.waitForTimeout(400);
        const isPresetVisible = await deskPage.locator('[data-dash-content="preset"]').isVisible();
        const presetCards = await deskPage.locator('[data-slot="presets"] .snw-playlist-card, [data-slot="presets"] .snw-preset-btn, [data-slot="presets"] button').count();
        record('[프리셋] 탭 전환 및 프리셋 그리드 렌더링', isPresetVisible && presetCards >= 8, `${presetCards}개 카드`);

        // 1-6) 사이드바 라우터 전환 시 사이드바 상시 유지 확인
        await deskPage.click('#snw-sidebar a[href="#/ai"]');
        await deskPage.waitForTimeout(300);
        const isAiPage = deskPage.url().includes('#/ai');
        const isSidebarStillThere = await deskPage.locator('#snw-sidebar').isVisible();
        record('페이지 이동 후에도 데스크톱 사이드바 유지 (영구 고정)', isAiPage && isSidebarStillThere);

        // 복귀 및 스크린샷 (Fresh Start #/home)
        await deskPage.click('#snw-sidebar a[href="#/home"]');
        await deskPage.waitForTimeout(300);

        record('PC 콘솔 에러 0건 (Clean)', deskErrors.length === 0, `${deskErrors.length}건`);
        const deskScreenshotPath = path.join(REPORT_DIR, 'screenshot_desktop.png');
        await deskPage.screenshot({ path: deskScreenshotPath });
        console.log(`  📸 데스크톱 스크린샷: ${deskScreenshotPath}`);

        // -------------------------------------------------------------
        // [검증 2] 안드로이드 모바일 환경 (Pixel 7 / 412 × 915 Touch)
        // -------------------------------------------------------------
        console.log('\n📱  [2] 안드로이드 모바일 환경 점검 (Pixel 7, 412 × 915, 터치 네비게이션)');
        console.log('----------------------------------------------------------------');

        const mobCtx = await browser.newContext({
            ...devices['Pixel 7'],
            viewport: { width: 412, height: 915 }
        });
        const mobPage = await mobCtx.newPage();
        await mobPage.addInitScript(() => {
            localStorage.setItem('snw.onboarded', '1');
            localStorage.setItem('snw.level', 'L2');
        });

        const mobErrors = [];
        mobPage.on('console', msg => { if (msg.type() === 'error') mobErrors.push(msg.text()); });
        mobPage.on('pageerror', err => mobErrors.push(err.message));

        await mobPage.goto(`http://127.0.0.1:${port}/index.html?offline=1`, { waitUntil: 'networkidle' });
        await mobPage.waitForTimeout(600);

        // 2-1) 모바일 하단 5개 탭 바 (Material Design 표준)
        const mobBottomNav = await mobPage.locator('#mobile-bottom-nav').isVisible();
        const mobNavCount = await mobPage.locator('#mobile-bottom-nav .snw-bottom-nav__item').count();
        record('모바일 하단 탭 바 표시 및 5개 탭 표준 규격', mobBottomNav && mobNavCount === 5, `${mobNavCount}/5개`);

        const navBox = await mobPage.locator('#mobile-bottom-nav').boundingBox();
        const navHeightOk = navBox && navBox.height >= 50;
        record('하단 탭 바 터치 권장 높이 확보 (>= 50px)', navHeightOk, navBox ? `${Math.round(navBox.height)}px` : 'N/A');

        // 2-2) 상단 햄버거 메뉴 토글 및 오버레이 드로어
        const btnMenuMob = mobPage.locator('#btn-menu');
        const isMenuVisible = await btnMenuMob.isVisible();
        record('모바일 상단 햄버거 버튼(☰) 노출', isMenuVisible);

        if (isMenuVisible) {
            await btnMenuMob.click();
            await mobPage.waitForTimeout(300);
            const isDrawerOpen = await mobPage.evaluate(() => document.body.classList.contains('snw-sidebar-open'));
            record('햄버거 터치 시 사이드바 드로어 오픈 (body.snw-sidebar-open)', isDrawerOpen);

            await btnMenuMob.click();
            await mobPage.waitForTimeout(300);
            const isDrawerClosed = await mobPage.evaluate(() => !document.body.classList.contains('snw-sidebar-open'));
            record('햄버거 재터치 시 사이드바 드로어 정상 닫힘', isDrawerClosed);
        }

        // 2-3) 모바일 대시보드 3탭 전환 터치 인터랙션
        await mobPage.click('[data-dash-tab="env"]');
        await mobPage.waitForTimeout(300);
        const isMobEnvVisible = await mobPage.locator('[data-dash-content="env"]').isVisible();
        record('모바일 [환경] 탭 터치 전환', isMobEnvVisible);

        await mobPage.click('[data-dash-tab="preset"]');
        await mobPage.waitForTimeout(300);
        const isMobPresetVisible = await mobPage.locator('[data-dash-content="preset"]').isVisible();
        record('모바일 [프리셋] 탭 터치 전환', isMobPresetVisible);

        // 2-4) 하단 탭 바 원터치 페이지 라우팅 검증 (Fresh Start 5개 탭)
        await mobPage.click('#mobile-bottom-nav a[href="#/wind"]');
        await mobPage.waitForTimeout(300);
        const isWindRouted = mobPage.url().includes('#/wind');
        record('하단 탭 [🌬️ 바람] 원터치 이동', isWindRouted);

        await mobPage.click('#mobile-bottom-nav a[href="#/automation"]');
        await mobPage.waitForTimeout(300);
        const isAutoRouted = mobPage.url().includes('#/automation');
        record('하단 탭 [⚙️ 자동화] 원터치 이동', isAutoRouted);

        await mobPage.click('#mobile-bottom-nav a[href="#/monitor"]');
        await mobPage.waitForTimeout(300);
        const isMonitorRouted = mobPage.url().includes('#/monitor');
        record('하단 탭 [📊 모니터] 원터치 이동', isMonitorRouted);

        await mobPage.click('#mobile-bottom-nav a[href="#/settings"]');
        await mobPage.waitForTimeout(300);
        const isSettingsRouted = mobPage.url().includes('#/settings');
        record('하단 탭 [🔧 설정] 원터치 이동', isSettingsRouted);

        await mobPage.click('#mobile-bottom-nav a[href="#/home"]');
        await mobPage.waitForTimeout(300);
        const isHomeRouted = mobPage.url().includes('#/home');
        record('하단 탭 [🏠 홈] 원터치 복귀', isHomeRouted);

        record('안드로이드 모바일 콘솔 에러 0건 (Clean)', mobErrors.length === 0, `${mobErrors.length}건`);
        const mobScreenshotPath = path.join(REPORT_DIR, 'screenshot_mobile.png');
        await mobPage.screenshot({ path: mobScreenshotPath });
        console.log(`  📸 모바일 스크린샷: ${mobScreenshotPath}`);

    } catch (err) {
        console.error('\n[ERROR] 테스트 실행 중 오류 발생:', err);
        failedChecks++;
    } finally {
        await browser.close();
        server.close();
    }

    console.log('\n================================================================');
    console.log(` 🏁 정밀 점검 결과: 총 ${totalChecks}건 중 ${passedChecks}건 통과, ${failedChecks}건 실패`);
    console.log('================================================================');

    if (failedChecks > 0) {
        console.error('❌ 일부 UI 점검 항목이 실패하였습니다.');
        process.exit(1);
    } else {
        console.log('🎉 모든 PC 및 안드로이드 브라우저 UI 점검 항목을 100% 통과하였습니다!');
        process.exit(0);
    }
}

runE2EUIInspection();

