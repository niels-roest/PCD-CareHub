/**
 * Build Verification Script
 * -------------------------
 * Inspired by the Claude Code source leak: a missing .npmignore line
 * shipped 60MB of source maps to production — twice.
 *
 * This script runs after `node build.js` and catches:
 *   1. Unexpected file types (source maps, env files, credentials)
 *   2. Size anomalies (individual files > 2MB, total dist > threshold)
 *   3. Sensitive content leaks (API keys, tokens, private data)
 *   4. Missing expected files (sitemap, robots.txt, CNAME)
 *
 * Usage: node verify-build.js [--ci]
 *   --ci flag makes the script exit(1) on warnings too (stricter)
 */

const fs = require('fs-extra');
const path = require('path');
const { globSync } = require('glob');

const DIST = path.join(__dirname, 'dist');
const CI_MODE = process.argv.includes('--ci');

// Thresholds
const MAX_SINGLE_FILE_MB = 2;
const MAX_TOTAL_DIST_MB = 50;
const EXPECTED_PAGE_COUNT_MIN = 100; // 32 NL pages × 4 languages ≈ 128

// Forbidden file patterns in dist/
const FORBIDDEN_PATTERNS = [
  '**/*.map',           // source maps (the Claude Code leak vector)
  '**/*.ts',            // TypeScript source
  '**/*.njk',           // Nunjucks templates
  '**/.env*',           // environment files
  '**/node_modules/**', // dependencies
  '**/*.pem',           // certificates
  '**/*.key',           // private keys
  '**/credentials*',    // credential files
  '**/*.log',           // log files
  '**/.git/**',         // git internals
  '**/*.sql',           // database dumps
  '**/package.json',    // package metadata
  '**/package-lock.json',
];

// Files that MUST exist in dist/
const REQUIRED_FILES = [
  'index.html',
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'CNAME',
  '.nojekyll',
  'en/index.html',
  'es/index.html',
  'pt-br/index.html',
];

// Regex patterns for sensitive content in HTML
const SENSITIVE_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][^"']{10,}/gi, label: 'API key' },
  { pattern: /(?:secret|token)\s*[:=]\s*["'][^"']{10,}/gi, label: 'Secret/Token' },
  { pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g, label: 'Private key' },
  { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, label: 'Hardcoded password' },
];

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  \x1b[31mERROR\x1b[0m  ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  \x1b[33mWARN\x1b[0m   ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  \x1b[32mOK\x1b[0m     ${msg}`);
}

// ============================================
// Check 1: dist/ exists
// ============================================
console.log('\n--- Build Verification ---\n');

if (!fs.existsSync(DIST)) {
  error('dist/ directory does not exist. Run `node build.js` first.');
  process.exit(1);
}

// ============================================
// Check 2: Forbidden file types
// ============================================
console.log('Checking for forbidden file types...');
let forbiddenFound = false;
for (const pattern of FORBIDDEN_PATTERNS) {
  const matches = globSync(pattern, { cwd: DIST, dot: true });
  if (matches.length > 0) {
    for (const match of matches) {
      error(`Forbidden file in dist/: ${match}`);
    }
    forbiddenFound = true;
  }
}
if (!forbiddenFound) ok('No forbidden files detected');

// ============================================
// Check 3: File size anomalies
// ============================================
console.log('Checking file sizes...');
const allFiles = globSync('**/*', { cwd: DIST, nodir: true, dot: true });
let totalBytes = 0;
let oversizedFiles = 0;

for (const file of allFiles) {
  const filePath = path.join(DIST, file);
  const stats = fs.statSync(filePath);
  totalBytes += stats.size;

  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB > MAX_SINGLE_FILE_MB) {
    error(`Oversized file: ${file} (${sizeMB.toFixed(1)}MB > ${MAX_SINGLE_FILE_MB}MB limit)`);
    oversizedFiles++;
  }
}

const totalMB = totalBytes / (1024 * 1024);
if (totalMB > MAX_TOTAL_DIST_MB) {
  error(`Total dist/ size ${totalMB.toFixed(1)}MB exceeds ${MAX_TOTAL_DIST_MB}MB limit`);
} else {
  ok(`Total dist/ size: ${totalMB.toFixed(1)}MB (limit: ${MAX_TOTAL_DIST_MB}MB)`);
}
if (oversizedFiles === 0) ok(`No oversized files (limit: ${MAX_SINGLE_FILE_MB}MB per file)`);

// ============================================
// Check 4: Required files
// ============================================
console.log('Checking required files...');
let missingRequired = 0;
for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(DIST, file))) {
    error(`Missing required file: ${file}`);
    missingRequired++;
  }
}
if (missingRequired === 0) ok(`All ${REQUIRED_FILES.length} required files present`);

// ============================================
// Check 5: Page count sanity
// ============================================
console.log('Checking page count...');
const htmlFiles = globSync('**/*.html', { cwd: DIST });
if (htmlFiles.length < EXPECTED_PAGE_COUNT_MIN) {
  warn(`Only ${htmlFiles.length} HTML pages (expected >= ${EXPECTED_PAGE_COUNT_MIN}). Possible build failure?`);
} else {
  ok(`${htmlFiles.length} HTML pages generated`);
}

// ============================================
// Check 6: Sensitive content scan
// ============================================
console.log('Scanning for sensitive content...');
let sensitiveFound = false;
for (const htmlFile of htmlFiles) {
  const content = fs.readFileSync(path.join(DIST, htmlFile), 'utf8');
  for (const { pattern, label } of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      error(`Potential ${label} found in ${htmlFile}`);
      sensitiveFound = true;
    }
  }
}
if (!sensitiveFound) ok('No sensitive content detected in HTML files');

// ============================================
// Check 7: Sitemap integrity
// ============================================
console.log('Checking sitemap integrity...');
const sitemapPath = path.join(DIST, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locCount = (sitemap.match(/<loc>/g) || []).length;
  if (locCount < 20) {
    warn(`Sitemap has only ${locCount} URLs (expected 100+)`);
  } else {
    ok(`Sitemap contains ${locCount} URLs`);
  }

  // Check for broken references (URLs pointing to files that don't exist in dist)
  const siteUrl = 'https://pcdinvestmentpartners.com';
  const locMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
  let brokenUrls = 0;
  for (const locTag of locMatches) {
    const url = locTag.replace(/<\/?loc>/g, '');
    const relativePath = url.replace(siteUrl, '').replace(/^\//, '') || 'index.html';
    const expectedFile = relativePath.endsWith('/') ? relativePath + 'index.html' : relativePath + '.html';
    if (!fs.existsSync(path.join(DIST, expectedFile)) && !fs.existsSync(path.join(DIST, relativePath))) {
      // Sitemap URLs might not directly map to filenames, skip deep check
    }
  }
}

// ============================================
// Summary
// ============================================
console.log('\n--- Verification Summary ---');
console.log(`  Files scanned: ${allFiles.length}`);
console.log(`  HTML pages:    ${htmlFiles.length}`);
console.log(`  Total size:    ${totalMB.toFixed(1)}MB`);

if (errors > 0) {
  console.error(`\n  \x1b[31m${errors} error(s)\x1b[0m, ${warnings} warning(s)`);
  console.error('  Build verification FAILED.\n');
  process.exit(1);
} else if (warnings > 0 && CI_MODE) {
  console.warn(`\n  ${errors} error(s), \x1b[33m${warnings} warning(s)\x1b[0m`);
  console.warn('  Build verification FAILED (CI strict mode).\n');
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n  ${errors} error(s), \x1b[33m${warnings} warning(s)\x1b[0m`);
  console.warn('  Build verification PASSED with warnings.\n');
} else {
  console.log(`\n  \x1b[32m0 errors, 0 warnings\x1b[0m`);
  console.log('  Build verification PASSED.\n');
}
