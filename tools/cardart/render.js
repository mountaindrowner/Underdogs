const { chromium } = require('playwright');
(async () => {
  const [html, out] = process.argv.slice(2);
  // CHROMIUM_BIN lets you point at a specific Chromium; falls back to Playwright's default.
  const exe = process.env.CHROMIUM_BIN;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto('file://' + html);
  const el = await page.$('#card');
  await el.screenshot({ path: out });
  await browser.close();
  console.log('rendered', out);
})();
