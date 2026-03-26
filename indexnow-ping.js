#!/usr/bin/env node
/**
 * IndexNow ping script — notifies Bing, Yandex, and other search engines
 * about new or updated URLs on pcdinvestmentpartners.com.
 *
 * Usage:
 *   node indexnow-ping.js              # ping all URLs from sitemap
 *   node indexnow-ping.js --changed    # ping only URLs changed in last git commit
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SITE_URL = 'https://pcdinvestmentpartners.com';
const KEY = fs.readFileSync(path.join(__dirname, 'src', 'indexnow-key.txt'), 'utf8').trim();
const SITEMAP = path.join(__dirname, 'dist', 'sitemap.xml');

function extractUrlsFromSitemap() {
  const xml = fs.readFileSync(SITEMAP, 'utf8');
  const urls = [];
  const re = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  // Deduplicate (sitemap has hreflang refs that repeat URLs)
  return [...new Set(urls)];
}

function getChangedUrls() {
  const { execSync } = require('child_process');
  try {
    const diff = execSync('git diff --name-only HEAD~1 HEAD -- src/pages/', { encoding: 'utf8' });
    const files = diff.trim().split('\n').filter(Boolean);

    // Map source files to sitemap URLs
    const allUrls = extractUrlsFromSitemap();
    const changedUrls = [];

    for (const file of files) {
      // Extract page slug from file path: src/pages/nl/index.njk -> index
      const match = file.match(/src\/pages\/([^/]+)\/(.+)\.njk$/);
      if (!match) continue;
      const [, lang, pageName] = match;

      // Find matching URLs in sitemap
      for (const url of allUrls) {
        if (pageName === 'index') {
          if (url === `${SITE_URL}/` || url === `${SITE_URL}/${lang}/`) {
            changedUrls.push(url);
          }
        } else if (url.includes(pageName) || url.includes(pageName.replace(/\./g, '-'))) {
          changedUrls.push(url);
        }
      }
    }

    return [...new Set(changedUrls)];
  } catch {
    console.log('Could not determine changed files, falling back to all URLs');
    return extractUrlsFromSitemap();
  }
}

function pingIndexNow(urls) {
  if (urls.length === 0) {
    console.log('No URLs to submit.');
    return;
  }

  // IndexNow accepts max 10,000 URLs per request
  const batch = urls.slice(0, 10000);

  const payload = JSON.stringify({
    host: 'pcdinvestmentpartners.com',
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: batch
  });

  const options = {
    hostname: 'api.indexnow.org',
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 202) {
        console.log(`IndexNow: ${batch.length} URLs submitted successfully (${res.statusCode})`);
      } else {
        console.error(`IndexNow error: ${res.statusCode} ${body}`);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`IndexNow request failed: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

// Main
const changedOnly = process.argv.includes('--changed');
const urls = changedOnly ? getChangedUrls() : extractUrlsFromSitemap();

console.log(`IndexNow: submitting ${urls.length} URLs${changedOnly ? ' (changed only)' : ' (all)'}...`);
pingIndexNow(urls);
