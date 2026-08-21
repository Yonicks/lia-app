/**
 * Copy the PWA files Capacitor needs into ./www (webDir).
 * The Android project cannot use the repo root as webDir — it would
 * try to copy android/ into itself.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const ENTRIES = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icons',
  'splash',
  'assets',
];

function rm(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copy(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

rm(WWW);
fs.mkdirSync(WWW, { recursive: true });
for (const name of ENTRIES) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) continue;
  copy(src, path.join(WWW, name));
}
console.log('www ready for Capacitor');
