const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2], base = 'http://localhost:4321';
  const b = await chromium.launch();
  const d = await b.newContext({ viewport: { width: 1280, height: 1000 } });
  const p = await d.newPage();
  for (const [path, name, scroll] of [['/', 'd_home', 0], ['/', 'd_home2', 900], ['/1xbet/apk/', 'd_apk', 0]]) {
    await p.goto(base + path, { waitUntil: 'networkidle' }); await p.evaluate((y) => window.scrollTo(0, y), scroll); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${name}.png` });
  }
  const m = await b.newContext({ ...devices['Pixel 5'] , deviceScaleFactor: 1});
  const q = await m.newPage();
  for (const [path, name, scroll] of [['/', 'm_home', 1100], ['/1xbet/', 'm_review', 0]]) {
    await q.goto(base + path, { waitUntil: 'networkidle' }); await q.evaluate((y) => window.scrollTo(0, y), scroll); await q.waitForTimeout(300);
    await q.screenshot({ path: `${out}/${name}.png` });
    console.log(path, 'overflow', await q.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  }
  await b.close();
})();
