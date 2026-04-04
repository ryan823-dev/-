const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000';
const CRED = { email: 'admin@tdpaint.com', password: 'Tdpaint2026!' };

(async () => {
  console.log('=== VertaX Error Diagnosis ===');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const fails = [];
  const cerrs = [];

  page.on('response', r => {
    if (r.status() >= 400) {
      fails.push({ url: r.url(), status: r.status() });
    }
  });
  page.on('console', m => {
    if (m.type() === 'error') cerrs.push(m.text().substring(0, 300));
  });

  try {
    // Phase 1: raw API test
    console.log('\n--- Phase 1: API Endpoints ---');
    for (const ep of ['/api/auth/session', '/api/auth/providers', '/api/auth/csrf', '/api/check-env']) {
      try {
        const r = await page.request.get(TARGET_URL + ep);
        const ct = r.headers()['content-type'] || '';
        const txt = (await r.text()).substring(0, 200);
        console.log((r.status() >= 400 ? 'FAIL' : ' OK ') + ' ' + r.status() + ' ' + ep + ' [' + ct.split(';')[0] + ']');
        if (r.status() >= 400) console.log('     ' + txt);
      } catch (e) {
        console.log(' ERR ' + ep + ' ' + e.message);
      }
    }

    // Phase 2: Login
    console.log('\n--- Phase 2: Login ---');
    await page.goto(TARGET_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"], input[name="email"]').first().fill(CRED.email);
    await page.locator('input[type="password"], input[name="password"]').first().fill(CRED.password);
    fails.length = 0;
    cerrs.length = 0;
    await page.locator('button[type="submit"]').first().click();
    try {
      await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 20000 });
      console.log(' OK  Login success -> ' + new URL(page.url()).pathname);
    } catch (e) {
      console.log('FAIL Login did not redirect');
    }
    if (fails.length > 0) {
      console.log('     Login errors (' + fails.length + '):');
      fails.forEach(f => console.log('       ' + f.status + ' ' + f.url));
    }

    // Phase 3: Session after login
    console.log('\n--- Phase 3: Session After Login ---');
    try {
      const r = await page.request.get(TARGET_URL + '/api/auth/session');
      const ct = r.headers()['content-type'] || '';
      const body = await r.text();
      console.log(' Status: ' + r.status() + ', CT: ' + ct.split(';')[0]);
      if (ct.includes('json')) {
        const j = JSON.parse(body);
        console.log(' User: ' + (j.user?.email || 'none'));
        console.log(' Tenant: ' + (j.user?.tenantId || 'none'));
        console.log(' Role: ' + (j.user?.role || 'none'));
      } else {
        console.log(' Non-JSON: ' + body.substring(0, 150));
      }
    } catch (e) {
      console.log(' ERR ' + e.message);
    }

    // Phase 4: Per-page diagnosis
    console.log('\n--- Phase 4: Per-Page Errors ---');
    const routes = [
      ['/customer/home', 'Decision Center'],
      ['/customer/radar', 'Radar Home'],
      ['/customer/radar/candidates', 'Candidates'],
      ['/customer/radar/prospects', 'Prospects'],
      ['/customer/knowledge/assets', 'Knowledge Assets'],
      ['/customer/knowledge/evidence', 'Knowledge Evidence'],
      ['/customer/marketing', 'Marketing Home'],
      ['/customer/marketing/contents', 'Marketing Contents'],
      ['/customer/social', 'Social Home'],
      ['/tower', 'Tower Admin'],
    ];

    for (const [path, name] of routes) {
      fails.length = 0;
      cerrs.length = 0;
      await page.goto(TARGET_URL + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(5000);

      const tag = fails.length === 0 ? ' OK ' : 'FAIL';
      console.log('\n' + tag + ' ' + name + ' (' + path + ') - ' + fails.length + ' errors, ' + cerrs.length + ' console errors');
      if (fails.length > 0) {
        const uniq = {};
        fails.forEach(f => {
          const k = f.status + ' ' + new URL(f.url).pathname;
          uniq[k] = (uniq[k] || 0) + 1;
        });
        Object.entries(uniq).forEach(([k, c]) => {
          console.log('     ' + k + (c > 1 ? ' (x' + c + ')' : ''));
        });
      }
      if (cerrs.length > 0) {
        const uq = [...new Set(cerrs.map(e => e.substring(0, 120)))];
        uq.slice(0, 3).forEach(e => console.log('     [console] ' + e));
      }
    }

    console.log('\n=== Diagnosis Complete ===');
  } catch (e) {
    console.error('FATAL: ' + e.message);
  } finally {
    await browser.close();
  }
})();
