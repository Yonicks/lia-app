/**
 * Ad-hoc visual-check helper (not part of the app runtime).
 * Usage: node tools/screenshot.js <outfile.png> [width] [height] [--wait=selector] [--js="expr"]
 */
const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const [, , outfile, widthArg, heightArg, ...rest] = process.argv;
  const width = Number(widthArg) || 390;
  const height = Number(heightArg) || 844;
  const jsArg = rest.find(a => a.startsWith('--js='));
  const js = jsArg ? jsArg.slice(5) : null;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height } });
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(String(err)));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  // dismiss the start gate (also unlocks audio) unless caller wants the gate itself
  const gateBtn = await page.$('#gateBtn');
  if (gateBtn && !rest.includes('--keep-gate')) {
    await gateBtn.click();
    await page.waitForTimeout(300);
  }
  if (js) {
    await page.evaluate(js);
    await page.waitForTimeout(250);
  }
  await page.screenshot({ path: path.resolve(outfile), fullPage: false });
  await browser.close();

  if (consoleErrors.length) {
    console.log('CONSOLE ERRORS:');
    consoleErrors.forEach(e => console.log(' -', e));
  } else {
    console.log('no console errors');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
