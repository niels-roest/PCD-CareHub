#!/usr/bin/env node
/**
 * Adds gradient-text accents to H1 (first) and H2 (last) on each page.
 * Rhythm: top accent + bottom accent = 2 subtle aurora highlights per page.
 * Run: node add-gradient-titles.js <lang>
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const lang = process.argv[2];
if (!lang) {
  console.error('Usage: node add-gradient-titles.js <lang>');
  process.exit(1);
}

const SKIP_FILES = new Set(['index.njk']); // homepage already has custom gradient

const dir = path.join(__dirname, 'src', 'pages', lang);
if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`);
  process.exit(1);
}

function gradientizeLastWord(text) {
  // Skip if already styled
  if (/gradient-text|<span|<strong/.test(text)) return null;
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return null;
  const last = words[words.length - 1];
  // Preserve trailing punctuation (.?!:,)
  const puncMatch = last.match(/^(.+?)([.?!:,]+)$/);
  const lastCore = puncMatch ? puncMatch[1] : last;
  const lastPunc = puncMatch ? puncMatch[2] : '';
  if (!lastCore) return null;
  const prefix = words.slice(0, -1).join(' ');
  return `${prefix} <span class="gradient-text">${lastCore}</span>${lastPunc}`;
}

const files = glob.sync('*.njk', { cwd: dir });
let changedH1 = 0;
let changedH2 = 0;

for (const f of files) {
  if (SKIP_FILES.has(f)) continue;
  const full = path.join(dir, f);
  let src = fs.readFileSync(full, 'utf8');
  let fileChanged = false;

  // --- H1: first occurrence, last word gradient ---
  let h1Done = false;
  src = src.replace(/<h1([^>]*)>\s*([^<]+?)\s*<\/h1>/, (m, attrs, text) => {
    if (h1Done) return m;
    const replaced = gradientizeLastWord(text);
    if (!replaced) return m;
    h1Done = true;
    fileChanged = true;
    changedH1++;
    return `<h1${attrs}>${replaced}</h1>`;
  });

  // --- H2: LAST occurrence on page, last word gradient (usually CTA section) ---
  const h2Regex = /<h2([^>]*)>\s*([^<]+?)\s*<\/h2>/g;
  const matches = [...src.matchAll(h2Regex)];
  // Iterate backward; replace the LAST H2 that is gradientizable
  for (let i = matches.length - 1; i >= 0; i--) {
    const [match, attrs, text] = matches[i];
    const replaced = gradientizeLastWord(text);
    if (!replaced) continue;
    const replacement = `<h2${attrs}>${replaced}</h2>`;
    const idx = src.lastIndexOf(match);
    src = src.slice(0, idx) + replacement + src.slice(idx + match.length);
    changedH2++;
    fileChanged = true;
    break;
  }

  if (fileChanged) {
    fs.writeFileSync(full, src, 'utf8');
    console.log(`  ${f}`);
  }
}

console.log(`\nDone in ${lang}/: ${changedH1} H1s + ${changedH2} H2s gradient-ized.`);
