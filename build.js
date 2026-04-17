const nunjucks = require('nunjucks');
const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { globSync } = require('glob');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ============================================
// Configuration
// ============================================
// Brand & domein constants. Tijdens rebrand-fase 3 via env-vars:
//   BRAND_NAME=PCD CareHub
//   BRAND_DOMAIN=pcdcarehub.com
//   SITE_URL=https://pcdcarehub.com
// Defaults wijzen op oude waardes — gedrag onveranderd tot env wordt gezet.
const BRAND_NAME = process.env.BRAND_NAME || 'PCD CareHub';
const BRAND_DOMAIN = process.env.BRAND_DOMAIN || 'pcdinvestmentpartners.com';
const SITE_URL = process.env.SITE_URL || `https://${BRAND_DOMAIN}`;
const LANGUAGES = [
  { code: 'nl', hreflang: 'nl', label: 'Nederlands', prefix: '', rootPath: '', ogLocale: 'nl_NL' },
  { code: 'en', hreflang: 'en', label: 'English', prefix: '/en', rootPath: '../', ogLocale: 'en_US' },
  { code: 'es', hreflang: 'es', label: 'Español', prefix: '/es', rootPath: '../', ogLocale: 'es_ES' },
  { code: 'pt-br', hreflang: 'pt-BR', label: 'Português (BR)', prefix: '/pt-br', rootPath: '../', ogLocale: 'pt_BR' },
];
const DEFAULT_LANG = 'nl';
const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

// ============================================
// 1. Clean dist/
// ============================================
console.log('Cleaning dist/...');
fs.emptyDirSync(DIST);

// ============================================
// 2. Copy static assets
// ============================================
console.log('Copying static assets...');
fs.copySync(path.join(__dirname, 'assets'), path.join(DIST, 'assets'));
fs.copySync(path.join(__dirname, 'css'), path.join(DIST, 'css'));
fs.copySync(path.join(__dirname, 'js'), path.join(DIST, 'js'));

// Build Tailwind CSS
console.log('Building Tailwind CSS...');
execSync('npx tailwindcss -i src/css/tailwind-input.css -o dist/css/tailwind.css --minify', {
  cwd: __dirname,
  stdio: 'inherit',
});

// Minify custom.css (strip comments and excess whitespace)
const customCssPath = path.join(DIST, 'css', 'custom.css');
if (fs.existsSync(customCssPath)) {
  let css = fs.readFileSync(customCssPath, 'utf8');
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');        // strip block comments
  css = css.replace(/\s*\n\s*/g, '\n');               // collapse whitespace around newlines
  css = css.replace(/\n{2,}/g, '\n');                  // collapse multiple newlines
  css = css.replace(/;\s*}/g, '}');                    // remove last semicolons before }
  fs.writeFileSync(customCssPath, css.trim());
  console.log('Minified custom.css');
}

// Minify main.js (strip comments and excess whitespace)
const mainJsPath = path.join(DIST, 'js', 'main.js');
if (fs.existsSync(mainJsPath)) {
  let js = fs.readFileSync(mainJsPath, 'utf8');
  js = js.replace(/\/\*[\s\S]*?\*\//g, '');           // strip block comments
  js = js.replace(/^\s*\/\/.*$/gm, '');                 // strip full-line comments only (safe for URLs)
  js = js.replace(/\s*\n\s*/g, '\n');                  // collapse whitespace
  js = js.replace(/\n{2,}/g, '\n');                    // collapse multiple newlines
  fs.writeFileSync(mainJsPath, js.trim());
  console.log('Minified main.js');
}

// NOTE: carehub-simulatie.html is confidential (intern gebruik) — deliberately excluded from public build
const staticFiles = ['CNAME', '.nojekyll', 'google9bcc3954f46db140.html'];
for (const file of staticFiles) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copySync(src, path.join(DIST, file));
  }
}

// ============================================
// 3. Configure Nunjucks
// ============================================
const env = nunjucks.configure(path.join(SRC, 'templates'), {
  autoescape: true,
  noCache: true,
  throwOnUndefined: false,
});

// ============================================
// 4. Load i18n strings
// ============================================
console.log('Loading i18n strings...');
const i18nStrings = {};
for (const lang of LANGUAGES) {
  const filePath = path.join(SRC, 'i18n', `${lang.code}.json`);
  if (fs.existsSync(filePath)) {
    i18nStrings[lang.code] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    console.warn(`  Warning: No i18n file for ${lang.code}, falling back to ${DEFAULT_LANG}`);
    i18nStrings[lang.code] = i18nStrings[DEFAULT_LANG];
  }
}

// ============================================
// 4b. Load slug translations
// ============================================
console.log('Loading slug translations...');
const slugMap = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n', 'slugs.json'), 'utf8'));

function getSlugForLang(pageName, langCode) {
  if (langCode === DEFAULT_LANG) return pageName;
  if (slugMap[pageName] && slugMap[pageName][langCode]) {
    return slugMap[pageName][langCode];
  }
  return pageName;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// 5. Discover all NL pages (master list)
// ============================================
const nlPages = globSync('*.njk', { cwd: path.join(SRC, 'pages', DEFAULT_LANG) })
  .map(f => f.replace('.njk', ''));

console.log(`Found ${nlPages.length} pages to build.`);

// ============================================
// 6. Helper: Extract structured_data block
// ============================================
function extractStructuredData(content) {
  const blockStart = '{% block structured_data %}';
  const blockEnd = '{% endblock %}';

  const startIdx = content.indexOf(blockStart);
  if (startIdx === -1) {
    return { mainContent: content, structuredData: '' };
  }

  // Find the LAST {% endblock %} (the one that closes structured_data)
  const afterStart = content.substring(startIdx + blockStart.length);
  const endIdx = afterStart.lastIndexOf(blockEnd);

  if (endIdx === -1) {
    return { mainContent: content, structuredData: '' };
  }

  const mainContent = content.substring(0, startIdx).trim();
  const structuredData = afterStart.substring(0, endIdx).trim();

  return { mainContent, structuredData };
}

// ============================================
// 7. Build all pages
// ============================================
const sitemapEntries = [];
let totalPages = 0;

for (const lang of LANGUAGES) {
  console.log(`\nBuilding ${lang.code.toUpperCase()} pages...`);

  for (const pageName of nlPages) {
    // Check if translated version exists; fall back to NL
    let pageFile = path.join(SRC, 'pages', lang.code, `${pageName}.njk`);
    let usingFallback = false;
    if (!fs.existsSync(pageFile)) {
      pageFile = path.join(SRC, 'pages', DEFAULT_LANG, `${pageName}.njk`);
      usingFallback = true;
    }

    // Parse frontmatter + content
    const raw = fs.readFileSync(pageFile, 'utf8');
    const { data: frontmatter, content: rawContent } = matter(raw);

    // Extract structured data block from content
    const { mainContent, structuredData } = extractStructuredData(rawContent);

    // Determine output path
    const slug = frontmatter.slug !== undefined ? frontmatter.slug : pageName;
    const isIndex = slug === '' || slug === 'index';
    const translatedSlug = getSlugForLang(pageName, lang.code);

    let outputFile, canonicalPath;
    if (lang.code === DEFAULT_LANG) {
      outputFile = isIndex ? 'index.html' : `${pageName}.html`;
      canonicalPath = isIndex ? '/' : `/${pageName}`;
    } else {
      outputFile = path.join(lang.code, isIndex ? 'index.html' : `${translatedSlug}.html`);
      canonicalPath = isIndex ? `${lang.prefix}/` : `${lang.prefix}/${translatedSlug}`;
    }

    // Build hreflang alternatives (only include languages where page actually exists)
    const availableLanguages = LANGUAGES
      .filter(altLang => {
        const altFile = path.join(SRC, 'pages', altLang.code, `${pageName}.njk`);
        return fs.existsSync(altFile);
      })
      .map(altLang => {
        const altSlug = getSlugForLang(pageName, altLang.code);
        return {
          hreflang: altLang.hreflang,
          url: `${SITE_URL}${altLang.code === DEFAULT_LANG
            ? (isIndex ? '/' : `/${pageName}`)
            : (isIndex ? `${altLang.prefix}/` : `${altLang.prefix}/${altSlug}`)}`,
        };
      });

    // Build language switcher URLs
    const languageSwitchUrls = LANGUAGES.map(altLang => {
      const altSlug = getSlugForLang(pageName, altLang.code);
      return {
        code: altLang.code,
        hreflang: altLang.hreflang,
        label: altLang.label,
        url: altLang.code === DEFAULT_LANG
          ? (isIndex ? '/' : `/${pageName}`)
          : (isIndex ? `${altLang.prefix}/` : `${altLang.prefix}/${altSlug}`),
      };
    });

    // Build og_image with full URL
    const ogImage = frontmatter.og_image
      ? `${SITE_URL}/${frontmatter.og_image}`
      : `${SITE_URL}/assets/logo/pcd-logo-design-blauw-transparant-500x500.png`;

    // Template variables
    const templateVars = {
      t: i18nStrings[lang.code],
      lang: lang.code,
      langPrefix: lang.prefix,
      rootPath: lang.rootPath,
      canonical: `${SITE_URL}${canonicalPath}`,
      availableLanguages,
      languageSwitchUrls,
      currentLangLabel: lang.label,
      pageName,
      title: frontmatter.title || '',
      description: frontmatter.description || '',
      og_image: ogImage,
      og_locale: lang.ogLocale,
      noindex: frontmatter.noindex || usingFallback,
      og_type: frontmatter.og_type || 'website',
    };

    // Render page content (may contain Nunjucks variables like {{ rootPath }}, {{ langPrefix }})
    const renderedContent = nunjucks.renderString(mainContent, templateVars);
    const renderedStructuredData = structuredData
      ? nunjucks.renderString(structuredData, templateVars)
      : '';

    // Render full page through layout
    const html = env.render('layouts/page.njk', {
      ...templateVars,
      content: renderedContent,
      structured_data: renderedStructuredData,
    });

    // Post-process: replace Dutch slugs with translated slugs in internal links
    let finalHtml = html;
    if (lang.code !== DEFAULT_LANG) {
      for (const [dutchSlug, translations] of Object.entries(slugMap)) {
        const translated = translations[lang.code];
        if (translated && translated !== dutchSlug) {
          // Replace href="[prefix]/[dutch-slug]" with translated slug
          finalHtml = finalHtml.replace(
            new RegExp(`(href=["']${escapeRegex(lang.prefix)}/)${escapeRegex(dutchSlug)}(?=["'#?])`, 'g'),
            `$1${translated}`
          );
        }
      }
    }

    // Write output
    const outputPath = path.join(DIST, outputFile);
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, finalHtml);
    totalPages++;

    if (usingFallback && lang.code !== DEFAULT_LANG) {
      // Still generate the page with NL content but target language UI
    }

    // Track for sitemap (skip 404, noindex, and fallback pages)
    if (pageName !== '404' && !frontmatter.noindex && !usingFallback) {
      sitemapEntries.push({
        url: `${SITE_URL}${canonicalPath}`,
        lang: lang.code,
        lastmod: fs.statSync(pageFile).mtime.toISOString().split('T')[0],
        pageName,
        isIndex,
      });
    }
  }
}

// ============================================
// 8. Generate sitemap.xml
// ============================================
console.log('\nGenerating sitemap.xml...');

// Group pages by pageName to build proper alternates
const pageGroups = {};
for (const entry of sitemapEntries) {
  if (!pageGroups[entry.pageName]) {
    pageGroups[entry.pageName] = [];
  }
  pageGroups[entry.pageName].push(entry);
}

let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
sitemapXml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

// Sort: homepage (index) first, then alphabetically
const sortedPageNames = Object.keys(pageGroups).sort((a, b) => {
  if (a === 'index') return -1;
  if (b === 'index') return 1;
  return a.localeCompare(b);
});

for (const pageName of sortedPageNames) {
  const entries = pageGroups[pageName];
  for (const entry of entries) {
    sitemapXml += '    <url>\n';
    sitemapXml += `        <loc>${entry.url}</loc>\n`;
    sitemapXml += `        <lastmod>${entry.lastmod}</lastmod>\n`;

    // Add hreflang alternates
    for (const altEntry of entries) {
      const altLang = LANGUAGES.find(l => l.code === altEntry.lang);
      sitemapXml += `        <xhtml:link rel="alternate" hreflang="${altLang.hreflang}" href="${altEntry.url}"/>\n`;
    }
    // x-default points to NL version
    const nlEntry = entries.find(e => e.lang === DEFAULT_LANG);
    if (nlEntry) {
      sitemapXml += `        <xhtml:link rel="alternate" hreflang="x-default" href="${nlEntry.url}"/>\n`;
    }

    sitemapXml += '    </url>\n';
  }
}

sitemapXml += '</urlset>\n';
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml);

// ============================================
// 9. Generate robots.txt
// ============================================
console.log('Generating robots.txt...');
const robotsTxt = `User-agent: *
Allow: /

# AI crawlers: allow retrieval/grounding but disallow training
# Compliant with EU Directive 2019/790 Art. 4
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: CCBot
Disallow: /
User-agent: anthropic-ai
Disallow: /
User-agent: Bytespider
Disallow: /

# Content signals (proposed standard)
# search=yes — allow search engine indexing
# ai-train=no — disallow AI model training
# ai-input=yes — allow AI retrieval/grounding (RAG)

Sitemap: ${SITE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt);

// Generate llms.txt for AI crawlers
console.log('Generating llms.txt...');
const llmsTxt = `# ${BRAND_NAME}
> ${BRAND_NAME} builds the CareHub ecosystem for digital healthcare technology in the Netherlands and Europe. CareHub is a digital integration platform that connects existing healthcare software — ECD, EPD, planning, CRM, and data platforms — via open standards such as FHIR and HL7 into one cohesive digital care environment.

## About
- [About ${BRAND_NAME}](${SITE_URL}/en/pioneering-health-care-technology): Mission, vision, and strategy for healthcare digitalization
- [Leadership](${SITE_URL}/en/leadership): Board and management team
- [ESG Statement](${SITE_URL}/en/esg-statement): Environmental, social, and governance commitments
- [Strategy](${SITE_URL}/en/strategy): Investment strategy and approach

## CareHub Ecosystem
- [CareHub Platform](${SITE_URL}/en/carehub-healthcare-digitalization): Digital integration platform connecting healthcare systems via FHIR and HL7
- [For Healthcare Organizations](${SITE_URL}/en/healthcare-organizations): How CareHub reduces administrative burden and improves care quality
- [For HealthTech Companies](${SITE_URL}/en/healthtech-companies): Scale-up opportunities within the CareHub ecosystem
- [For Investors & Partners](${SITE_URL}/en/investors-partners): Investment opportunities in Dutch healthcare digitalization

## Insights & Cases
- [Insights](${SITE_URL}/en/insights): Analysis and trends in digital healthcare
- [Cases](${SITE_URL}/en/cases): Real-world CareHub implementations

## Key Facts
- Founded: 2024
- Focus: Dutch healthcare digitalization (care sector)
- Model: Buy-and-build ecosystem
- Standards: FHIR, HL7, NEN 7510, ISO 27001, AVG/GDPR compliant
- Area: Netherlands and Europe
- Languages: Dutch, English, Spanish, Portuguese (Brazil)

## Contact
- Website: ${SITE_URL}
- LinkedIn: https://www.linkedin.com/company/pcd-investment-partners/
`;
fs.writeFileSync(path.join(DIST, 'llms.txt'), llmsTxt);

// ============================================
// 10. Responsive srcset for content images
// ============================================
console.log('\nAdding responsive srcset to images...');

const RESPONSIVE_WIDTHS = [480, 768];
let srcsetCount = 0;

const allHtmlFiles = globSync('**/*.html', { cwd: DIST });
for (const htmlFile of allHtmlFiles) {
  const htmlPath = path.join(DIST, htmlFile);
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Determine rootPath for this file (subdir files use "../")
  const depth = htmlFile.split('/').length - 1;
  const rootPrefix = depth > 0 ? '../'.repeat(depth) : '';

  html = html.replace(/<img\b([^>]*?)>/g, (match, attrs) => {
    // Skip if already has srcset or is a small image (team photos, logos)
    if (/srcset\s*=/.test(attrs)) return match;
    if (/team-|partner-|pcd-logo-|logo\//.test(attrs)) return match;

    const srcMatch = attrs.match(/src=["']([^"']*?)["']/);
    if (!srcMatch) return match;
    const src = srcMatch[1];

    // Only process assets/images/*.webp
    if (!src.includes('assets/images/') || !src.endsWith('.webp')) return match;

    // Get filename relative to dist
    const relativeSrc = src.replace(rootPrefix, '');
    const baseName = path.basename(relativeSrc, '.webp');
    const dirName = path.dirname(relativeSrc);

    // Skip already-resized variants
    if (/-\d+w$/.test(baseName)) return match;

    // Check which responsive variants exist
    const srcsetParts = [];
    for (const w of RESPONSIVE_WIDTHS) {
      const variantFile = path.join(DIST, dirName, `${baseName}-${w}w.webp`);
      if (fs.existsSync(variantFile)) {
        const variantSrc = `${src.replace(baseName + '.webp', baseName + '-' + w + 'w.webp')}`;
        srcsetParts.push(`${variantSrc} ${w}w`);
      }
    }

    // Add original as largest srcset entry
    if (srcsetParts.length === 0) return match;

    // Get original width from the file
    const origFile = path.join(DIST, relativeSrc);
    if (fs.existsSync(origFile)) {
      srcsetParts.push(`${src} 1024w`);
    }

    const srcsetAttr = ` srcset="${srcsetParts.join(', ')}" sizes="(max-width: 640px) 480px, (max-width: 1024px) 768px, 1024px"`;
    srcsetCount++;
    return `<img${attrs}${srcsetAttr}>`;
  });

  // Add decoding="async" to lazy-loaded images that don't already have it
  html = html.replace(/<img\b([^>]*loading="lazy"[^>]*)>/g, (match, attrs) => {
    if (/decoding\s*=/.test(attrs)) return match;
    return match.replace('loading="lazy"', 'loading="lazy" decoding="async"');
  });

  fs.writeFileSync(htmlPath, html);
}

console.log(`  Added srcset to ${srcsetCount} images across ${allHtmlFiles.length} files`);

// ============================================
// 11. Cache-busting: hash CSS/JS filenames
// ============================================
console.log('\nAdding content hashes to CSS/JS...');

const assetsToHash = [
  { dir: 'css', file: 'tailwind.css' },
  { dir: 'css', file: 'custom.css' },
  { dir: 'js', file: 'main.js' },
];

const hashMap = {}; // original filename → hashed filename

for (const asset of assetsToHash) {
  const filePath = path.join(DIST, asset.dir, asset.file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  const ext = path.extname(asset.file);
  const base = path.basename(asset.file, ext);
  const hashedName = `${base}.${hash}${ext}`;

  fs.renameSync(filePath, path.join(DIST, asset.dir, hashedName));
  hashMap[`${asset.dir}/${asset.file}`] = `${asset.dir}/${hashedName}`;
  console.log(`  ${asset.dir}/${asset.file} → ${asset.dir}/${hashedName}`);
}

// Replace references in all generated HTML files
const htmlFiles = globSync('**/*.html', { cwd: DIST });
for (const htmlFile of htmlFiles) {
  const htmlPath = path.join(DIST, htmlFile);
  let html = fs.readFileSync(htmlPath, 'utf8');
  let changed = false;

  for (const [original, hashed] of Object.entries(hashMap)) {
    if (html.includes(original)) {
      html = html.split(original).join(hashed);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(htmlPath, html);
  }
}

console.log(`  Updated ${htmlFiles.length} HTML files with hashed asset references`);

// ============================================
// 12. IndexNow key verification file
// ============================================
console.log('Creating IndexNow key file...');
const indexNowKey = fs.readFileSync(path.join(SRC, 'indexnow-key.txt'), 'utf8').trim();
fs.writeFileSync(path.join(DIST, `${indexNowKey}.txt`), indexNowKey);
console.log(`  Created ${indexNowKey}.txt for IndexNow protocol`);

// ============================================
// 13. Generate llms-full.txt and markdown mirrors
// ============================================
console.log('\nGenerating llms-full.txt and markdown mirrors...');

// Lightweight HTML-to-markdown converter
function htmlToMarkdown(html) {
  let md = html;
  // Remove script, style, nav, svg, and structured_data blocks
  md = md.replace(/<script[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[\s\S]*?<\/style>/gi, '');
  md = md.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  md = md.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  // Convert headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `# ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `## ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  // Convert links (preserve href)
  md = md.replace(/<a\s[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim();
    if (!cleanText) return '';
    // Make relative URLs absolute
    const url = href.startsWith('/') ? `${SITE_URL}${href}` : href;
    return `[${cleanText}](${url})`;
  });
  // Convert strong/em
  md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, c) => `**${c.replace(/<[^>]+>/g, '').trim()}**`);
  md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, c) => `*${c.replace(/<[^>]+>/g, '').trim()}*`);
  // Convert list items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${c.replace(/<[^>]+>/g, '').trim()}\n`);
  // Convert paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => `${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  // Convert time elements
  md = md.replace(/<time[^>]*>([\s\S]*?)<\/time>/gi, (_, c) => c.trim());
  // Strip all remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  md = md.replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&');
  md = md.replace(/&ldquo;/g, '\u201C').replace(/&rdquo;/g, '\u201D').replace(/&lsquo;/g, '\u2018').replace(/&rsquo;/g, '\u2019');
  md = md.replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/&eacute;/g, 'é');
  md = md.replace(/&euml;/g, 'ë').replace(/&iuml;/g, 'ï').replace(/&uacute;/g, 'ú');
  md = md.replace(/&oacute;/g, 'ó').replace(/&aacute;/g, 'á').replace(/&iacute;/g, 'í');
  md = md.replace(/&ntilde;/g, 'ñ').replace(/&ccedil;/g, 'ç').replace(/&atilde;/g, 'ã');
  md = md.replace(/&otilde;/g, 'õ').replace(/&ecirc;/g, 'ê').replace(/&agrave;/g, 'à');
  md = md.replace(/&Eacute;/g, 'É').replace(/&Atilde;/g, 'Ã').replace(/&Ccedil;/g, 'Ç');
  md = md.replace(/&Oacute;/g, 'Ó').replace(/&#\d+;/g, '');
  // Clean up whitespace
  md = md.replace(/[ \t]+/g, ' ');
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();
  return md;
}

// Build llms-full.txt from EN pages (international audience)
let llmsFullSections = [];
llmsFullSections.push(`# ${BRAND_NAME} — Full Content`);
llmsFullSections.push(`> ${BRAND_NAME} builds the CareHub ecosystem for digital healthcare technology in the Netherlands and Europe. CareHub is a digital integration platform that connects existing healthcare software — ECD, EPD, planning, CRM, and data platforms — via open standards such as FHIR and HL7 into one cohesive digital care environment.\n`);

let mdMirrorCount = 0;

// Generate markdown mirrors for all HTML pages (all languages)
const distHtmlFiles = globSync('**/*.html', { cwd: DIST });
for (const htmlFile of distHtmlFiles) {
  if (htmlFile.includes('404') || htmlFile === 'google9bcc3954f46db140.html' || htmlFile === 'carehub-simulatie.html') continue;

  const htmlPath = path.join(DIST, htmlFile);
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // Extract description from meta
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const description = descMatch ? descMatch[1] : '';

  // Extract main content (between header and footer)
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || html.match(/<\/header>([\s\S]*?)<footer/i);
  const mainHtml = mainMatch ? mainMatch[1] : html;

  const markdown = `---\ntitle: "${title}"\ndescription: "${description}"\nurl: ${SITE_URL}/${htmlFile.replace(/\.html$/, '').replace(/\/index$/, '/')}\n---\n\n${htmlToMarkdown(mainHtml)}`;

  // Write .md mirror alongside .html
  const mdPath = htmlPath.replace(/\.html$/, '.md');
  fs.writeFileSync(mdPath, markdown);
  mdMirrorCount++;

  // Collect EN pages for llms-full.txt
  const isEnPage = htmlFile.startsWith('en/') || htmlFile === 'index.html';
  if (isEnPage && htmlFile !== 'en/index.html') {
    const slug = htmlFile.replace(/\.html$/, '').replace(/^en\//, '');
    const pageUrl = htmlFile === 'index.html'
      ? `${SITE_URL}/`
      : `${SITE_URL}/en/${slug}`;
    const mdContent = htmlToMarkdown(mainHtml);
    if (mdContent.length > 100) { // Skip near-empty pages
      llmsFullSections.push(`\n---\n\n## ${title}\n\nURL: ${pageUrl}\n\n${mdContent}`);
    }
  }
}

// Write llms-full.txt
const llmsFullContent = llmsFullSections.join('\n');
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), llmsFullContent);
console.log(`  Generated llms-full.txt (${Math.round(llmsFullContent.length / 1024)}KB)`);
console.log(`  Generated ${mdMirrorCount} markdown mirrors`);

// ============================================
// Done
// ============================================
console.log(`\nBuild complete! ${totalPages} pages generated in dist/`);
