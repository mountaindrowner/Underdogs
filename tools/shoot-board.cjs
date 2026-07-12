// Drive the built app into a Free Play match and screenshot the board diorama.
// Usage: node tools/shoot-board.cjs <scene> <port> <out.png>
const { chromium } = require('playwright');
(async () => {
  const [scene = 'elah', port = '4319', out = `/tmp/board_${scene}.png`] = process.argv.slice(2);
  const exe = process.env.CHROMIUM_BIN;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.goto(`http://localhost:${port}/?scene=${scene}`, { waitUntil: 'networkidle' });
  const wait = (ms) => page.waitForTimeout(ms);
  await page.mouse.click(720, 405); await wait(900);            // Title: tap to begin
  await page.getByText('Free Play', { exact: false }).first().click(); await wait(500);
  await page.getByText('Enter the Pit', { exact: false }).first().click(); await wait(4200);
  await page.screenshot({ path: out });
  console.log('shot', scene, '->', out);
  await browser.close();
})();
