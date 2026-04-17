#!/usr/bin/env node
/**
 * One-shot migration: light-mode .njk pages → dark-mode (aurora aesthetic).
 * Run: node migrate-dark.js <lang>
 * Example: node migrate-dark.js nl
 *
 * Targets token substitutions only. Does NOT touch homepage (already redesigned)
 * or structural layout. Safe to re-run idempotent (most patterns already converted stay put).
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const lang = process.argv[2];
if (!lang) {
  console.error('Usage: node migrate-dark.js <lang>');
  process.exit(1);
}

const SKIP_FILES = new Set(['index.njk']); // homepage already done per language

// Substitutions are applied in order. Each is a [regex, replacement] pair.
// Use word boundaries so we don't accidentally catch sub-matches.
const rules = [
  // Section-level light backgrounds → remove (body is dark navy-950)
  [/\bbg-white\b(?=[^"]*rounded)/g, 'bg-white/[0.04] border border-white/10'], // cards: give them glass-like fill
  [/\bbg-white\b/g, ''], // remaining = section backgrounds, just strip
  [/\bbg-brand-light\b/g, ''],
  [/\bbg-navy-900\b/g, ''],
  [/\bbg-navy-800\b/g, 'bg-white/[0.04] border border-white/10'],
  [/\bbg-navy-700\b/g, 'bg-white/[0.06]'],
  [/\bbg-gray-50\b/g, 'bg-white/[0.03]'],
  [/\bbg-gray-100\b/g, 'bg-white/[0.05]'],

  // Text colors → white scale
  [/\btext-navy-900\b/g, 'text-white'],
  [/\btext-navy-800\b/g, 'text-white/90'],
  [/\btext-navy-700\b/g, 'text-white/80'],
  [/\btext-gray-900\b/g, 'text-white'],
  [/\btext-gray-800\b/g, 'text-white/90'],
  [/\btext-gray-700\b/g, 'text-white/75'],
  [/\btext-gray-600\b/g, 'text-white/65'],
  [/\btext-gray-500\b/g, 'text-white/50'],
  [/\btext-gray-400\b/g, 'text-white/40'],

  // Borders → white/opacity
  [/\bborder-gray-100\b/g, 'border-white/10'],
  [/\bborder-gray-200\b/g, 'border-white/10'],
  [/\bborder-gray-300\b/g, 'border-white/15'],

  // Hover bg
  [/\bhover:bg-gray-50\b/g, 'hover:bg-white/[0.05]'],
  [/\bhover:bg-gray-100\b/g, 'hover:bg-white/[0.08]'],
  [/\bhover:bg-brand-light\b/g, 'hover:bg-white/[0.06]'],

  // Shadows → drop (invisible or wrong on dark)
  [/\bshadow-sm\b/g, ''],
  [/\bshadow-md\b/g, ''],
  [/\bshadow-lg\b/g, ''],
  [/\bshadow-xl\b/g, ''],
  [/\bshadow-2xl\b/g, ''],

  // Placeholders
  [/\bplaceholder-gray-400\b/g, 'placeholder-white/30'],
  [/\bplaceholder-gray-500\b/g, 'placeholder-white/40'],

  // Brand-blue link text becomes brand-blue-light for contrast on dark
  [/\btext-brand-blue\b(?!-)/g, 'text-brand-blue-light'],
  [/\bhover:text-brand-blue-dark\b/g, 'hover:text-white'],
  [/\bhover:text-brand-blue\b(?!-)/g, 'hover:text-white'],

  // Input/textarea bg (kept on forms)
  [/\bborder-gray-300\b/g, 'border-white/15'],

  // Whitespace cleanup: only inside class="..." attributes (safe — won't touch YAML)
  [/class="([^"]*)"/g, (_m, inner) => `class="${inner.replace(/\s+/g, ' ').trim()}"`],
];

const dir = path.join(__dirname, 'src', 'pages', lang);
if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`);
  process.exit(1);
}

const files = glob.sync('*.njk', { cwd: dir });
let totalReplacements = 0;
let filesChanged = 0;

for (const f of files) {
  if (SKIP_FILES.has(f)) continue;
  const full = path.join(dir, f);
  let src = fs.readFileSync(full, 'utf8');
  const original = src;
  let fileReplacements = 0;
  for (const [re, rep] of rules) {
    const before = src;
    src = src.replace(re, rep);
    if (src !== before) fileReplacements++;
  }
  if (src !== original) {
    fs.writeFileSync(full, src, 'utf8');
    filesChanged++;
    totalReplacements += fileReplacements;
    console.log(`  ${f} (${fileReplacements} rule-matches)`);
  }
}

console.log(`\nDone. ${filesChanged}/${files.length} files changed in ${lang}/. ${totalReplacements} rule-hits.`);
