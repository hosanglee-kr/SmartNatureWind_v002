/**
 * capture_manual_screenshots_0203.cjs
 * 안드로이드 크롬(Pixel 7, 412x915 터치) 환경에서 사용자 매뉴얼 삽입용 화면 캡처 자동 생성 도구
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
const HTML_DIR = path.join(REPO_ROOT, 'src/v0203/data_v0203_src/html_v0203');
const JSON_DIR = path.join(REPO_ROOT, 'src/v0203/data_v0203_src/json');
const IMG_DIR = path.join(REPO_ROOT, 'src/v0203/User_Manual_0203/images');

fs.mkdirSync(IMG_DIR, { recursive: true });

function startStaticServer(initialPort = 8899) {
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
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
    console.log('🚀 사용자 매뉴얼용 안드로이드 크롬 캡처 시작...');
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
        // 1. 대시보드 메인 제어 탭
        console.log('📸 1. 대시보드 제어 탭 캡처...');
        await page.goto(`${baseUrl}#/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '01_dashboard_main.png') });

        // 2. 대시보드 환경 탭 (Comfort 5상태 카드)
        console.log('📸 2. 대시보드 환경 탭 캡처...');
        await page.click('[data-dash-tab="env"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(IMG_DIR, '02_dashboard_env.png') });

        // 3. 대시보드 프리셋 탭 (10대 자연풍 그리드)
        console.log('📸 3. 대시보드 프리셋 탭 캡처...');
        await page.click('[data-dash-tab="preset"]');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(IMG_DIR, '03_dashboard_preset.png') });

        // 4. 모바일 사이드바 드로어 오픈
        console.log('📸 4. 사이드바 드로어 캡처...');
        await page.click('#btn-menu');
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(IMG_DIR, '04_sidebar_drawer.png') });
        await page.click('#btn-menu'); // 닫기
        await page.waitForTimeout(300);

        // 5. Wind Studio 작곡기
        console.log('📸 5. Wind Studio 작곡기 캡처...');
        await page.goto(`${baseUrl}#/automation/studio`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '05_wind_studio.png') });

        // 6. 재생 목록 (Playlist)
        console.log('📸 6. Playlist 재생 목록 캡처...');
        await page.goto(`${baseUrl}#/automation/playlist`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '06_playlist.png') });

        // 7. 세션 타이머
        console.log('📸 7. 세션 타이머 캡처...');
        await page.goto(`${baseUrl}#/automation/timer`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '07_timer.png') });

        // 8. AI 어시스턴트
        console.log('📸 8. Gemini AI 어시스턴트 캡처...');
        await page.goto(`${baseUrl}#/ai`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(IMG_DIR, '08_ai_assistant.png') });

        // 9. 실시간 물리 차트
        console.log('📸 9. 실시간 물리 차트 캡처...');
        await page.goto(`${baseUrl}#/chart`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(IMG_DIR, '09_chart.png') });

        // 10. 모니터 히스토리 탭
        console.log('📸 10. 모니터 히스토리 타임라인 캡처...');
        await page.goto(`${baseUrl}#/monitor`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        // 히스토리 탭 클릭
        const retroTab = page.locator('[data-tab="retro"]');
        if (await retroTab.isVisible()) {
            await retroTab.click();
            await page.waitForTimeout(600);
        }
        await page.screenshot({ path: path.join(IMG_DIR, '10_monitor_history.png') });

        console.log('🎉 10종 안드로이드 크롬 화면 캡처 완료!');
    } catch (e) {
        console.error('캡처 중 오류 발생:', e);
    } finally {
        await browser.close();
        server.close();
    }
}

captureAll();

