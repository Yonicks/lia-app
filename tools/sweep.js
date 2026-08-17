/**
 * Ad-hoc sweep: visit every view with console-error capture. Not part of app runtime.
 */
const { chromium } = require('playwright');

const VIEWS = [
  ['home', "view='home';"],
  ['category-animals', "activeCat='animals';view='category';"],
  ['cards-flashcards', "activeCat='animals';view='cards';cardIdx=0;"],
  ['quiz', "activeCat='animals';view='quiz';"],
  ['memory', "activeCat='food';view='memory';"],
  ['missing', "activeCat='home';view='missing';"],
  ['match', "activeCat='family';view='match';"],
  ['speech', "activeCat='animals';view='speech';"],
  ['bubbles', "activeCat='outside';view='bubbles';"],
  ['sounds', "activeCat='animals';view='sounds';"],
  ['count', "activeCat='numbers';view='count';"],
  ['sort', "activeCat='colors';view='sort';"],
  ['focus', "activeCat='animals';view='focus';"],
  ['cloze', "activeCat='animals';view='cloze';"],
  ['temptation', "activeCat='animals';view='temptation';"],
  ['receptive', "activeCat='animals';view='receptive';"],
  ['pairs', "activeCat='animals';view='pairs';"],
  ['combine', "activeCat='animals';view='combine';"],
  ['games-menu', "view='games';"],
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = {};
  page.on('console', msg => { if (msg.type() === 'error') (errors['_current'] = errors['_current'] || []).push(msg.text()); });
  page.on('pageerror', err => (errors['_current'] = errors['_current'] || []).push(String(err)));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const gateBtn = await page.$('#gateBtn');
  if (gateBtn) { await gateBtn.click(); await page.waitForTimeout(200); }

  for (const [name, js] of VIEWS) {
    errors['_current'] = [];
    try {
      await page.evaluate(js + ' try{game=null;render();}catch(e){window.__err=String(e);}');
      await page.waitForTimeout(150);
      const jsErr = await page.evaluate(() => window.__err || null);
      if (jsErr) errors['_current'].push('render threw: ' + jsErr);
    } catch (e) {
      errors['_current'].push('evaluate failed: ' + e.message);
    }
    errors[name] = errors['_current'];
  }
  delete errors['_current'];
  await browser.close();

  let anyError = false;
  for (const [name, errs] of Object.entries(errors)) {
    if (errs.length) {
      anyError = true;
      console.log(`[${name}]`);
      errs.forEach(e => console.log('  -', e));
    }
  }
  if (!anyError) console.log('All views clean, no console errors.');
}
main().catch(e => { console.error(e); process.exit(1); });
