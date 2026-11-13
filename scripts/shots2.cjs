const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2], base = 'http://localhost:4321';
  const b = await chromium.launch();
  const d = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  const p = await d.newPage();
  for (const [path, name, scroll] of [['/', 'd_top', 0], ['/bonus-paris-sportifs/', 'd_bonus', 1900], ['/applications-paris-sportifs/', 'd_apps', 0]]) {
    await p.goto(base + path, { waitUntil: 'networkidle' }); await p.evaluate((y) => window.scrollTo(0, y), scroll); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${name}.png` });
  }
  const m = await b.newContext({ ...devices['Pixel 5'], deviceScaleFactor: 1 });
  const q = await m.newPage();
  for (const [path, name, scroll] of [['/paris-sportifs-orange-money/', 'm_om', 520], ['/1xbet/apk/', 'm_apk', 0]]) {
    await q.goto(base + path, { waitUntil: 'networkidle' }); await q.evaluate((y) => window.scrollTo(0, y), scroll); await q.waitForTimeout(300);
    await q.screenshot({ path: `${out}/${name}.png` });
    console.log(path, 'overflow', await q.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  }
  for (const path of ['/', '/1xbet/', '/1xbet/apk/', '/1xbet/code-promo/', '/1xbet/inscription/', '/applications-paris-sportifs/', '/paris-sportifs-orange-money/', '/bonus-paris-sportifs/', '/methodologie/']) {
    const r = await q.goto(base + path); const t = await q.title(); const n = await q.$$eval('.op-card', (e) => e.length);
    const broken = await q.$$eval('img', (imgs) => imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')));
    console.log(r.status(), path, '|', t, '| cards', n, '| broken imgs', broken.length ? broken.join(',') : 0);
  }
  await b.close();
})();
