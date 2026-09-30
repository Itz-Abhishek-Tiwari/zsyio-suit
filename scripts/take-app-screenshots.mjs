import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT_DIR = process.cwd();

const APPS = [
  {
    name: 'admin',
    port: 3003,
    pages: [
      { name: '01-dashboard', path: '/' },
      { name: '02-users', path: '/users' },
      { name: '03-teams', path: '/teams' },
      { name: '04-roles', path: '/roles' },
    ],
  },
  {
    name: 'hrms',
    port: 3002,
    pages: [
      { name: '01-dashboard', path: '/' },
      { name: '02-directory', path: '/directory' },
      { name: '03-leaves', path: '/leaves' },
      { name: '04-holidays', path: '/holidays' },
      { name: '05-timeline', path: '/timeline' },
      { name: '06-admin', path: '/admin' },
    ],
  },
  {
    name: 'notes',
    port: 3001,
    pages: [
      { name: '01-dashboard', path: '/' },
      { name: '02-notes', path: '/notes' },
    ],
  },
  {
    name: 'pms',
    port: 3000,
    pages: [
      { name: '01-dashboard', path: '/' },
      { name: '02-tasks', path: '/tasks' },
      { name: '03-clients', path: '/clients' },
      { name: '04-products', path: '/products' },
      { name: '05-reports', path: '/reports' },
    ],
  },
  {
    name: 'sales',
    port: 3005,
    pages: [
      { name: '01-dashboard', path: '/' },
      { name: '02-leads', path: '/leads' },
      { name: '03-kanban', path: '/kanban' },
      { name: '04-activities', path: '/activities' },
    ],
  },
];

async function captureAll() {
  console.log('🚀 Starting screenshot capture for all 5 Zsyio applications at 90% zoom...\n');

  for (const app of APPS) {
    const rootTargetDir = path.join(ROOT_DIR, 'screenshots', app.name);
    const appTargetDir = path.join(ROOT_DIR, 'apps', app.name, 'screenshots');
    fs.mkdirSync(rootTargetDir, { recursive: true });
    fs.mkdirSync(appTargetDir, { recursive: true });

    const userProfileDir = path.join(ROOT_DIR, `.chrome-profile-${app.name}-${Date.now()}`);

    console.log(`\n========================================`);
    console.log(`📱 APP: ${app.name.toUpperCase()} (port: ${app.port})`);
    console.log(`========================================`);

    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir: userProfileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1440,960',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1.5 });

      // 1. Login flow
      const loginUrl = `http://127.0.0.1:${app.port}/login`;
      console.log(`🔑 Navigating to login: ${loginUrl}`);
      await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 20000 });

      // Check if login form is present
      const emailInput = await page.$('#corporateEmail');
      if (emailInput) {
        console.log(`   Entering admin credentials...`);
        await page.click('#corporateEmail');
        await page.type('#corporateEmail', 'admin', { delay: 20 });

        await page.click('#auth-password');
        await page.type('#auth-password', 'password', { delay: 20 });

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
          page.click('button[type="submit"]'),
        ]);
        await new Promise((r) => setTimeout(r, 2500));
        console.log(`   ✅ Logged in. Current URL: ${page.url()}`);
      } else {
        console.log(`   Already authenticated or no login form needed.`);
      }

      // 2. Capture each page
      for (const targetPage of app.pages) {
        const fullUrl = `http://127.0.0.1:${app.port}${targetPage.path}`;
        console.log(`📸 Capturing ${targetPage.name}: ${fullUrl}`);

        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 20000 });
        } catch (e) {
          console.log(`   Warning on navigation: ${e.message}`);
        }

        // Apply 90% zoom as requested by user
        await page.evaluate(() => {
          document.body.style.zoom = '90%';
        });

        // Allow animations and data rendering to finish
        await new Promise((r) => setTimeout(r, 2000));

        const fileName = `${targetPage.name}.png`;
        const rootPath = path.join(rootTargetDir, fileName);
        const appPath = path.join(appTargetDir, fileName);

        await page.screenshot({ path: rootPath, fullPage: false });
        fs.copyFileSync(rootPath, appPath);

        const stats = fs.statSync(rootPath);
        console.log(`   Saved: ${fileName} (${Math.round(stats.size / 1024)} KB)`);
      }
    } catch (err) {
      console.error(`❌ Error capturing ${app.name}:`, err);
    } finally {
      await browser.close();
      try {
        fs.rmSync(userProfileDir, { recursive: true, force: true });
      } catch {}
    }
  }

  console.log(`\n🎉 All screenshots captured and saved to screenshots/ and apps/<app>/screenshots/ !`);
}

captureAll().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
