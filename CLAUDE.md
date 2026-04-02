# PCD Investment Partners — Static Website

## Project Overview
Multi-language static website for **PCD Investment Partners**, a Dutch healthcare technology company building the CareHub ecosystem for digital care in the Netherlands and Europe. Built with Nunjucks templates, compiled to static HTML for GitHub Pages deployment.

**Live domain:** pcdinvestmentpartners.com
**GitHub repo:** niels-roest/pcdinvestmentpartners
**Language:** Dutch (nl) is the master language; also available in en, es, pt-br

## Tech Stack
- **Nunjucks** — Templating engine for all pages
- **gray-matter** — YAML frontmatter parsing per page
- **Tailwind CSS** — Built from `src/css/tailwind-input.css` → `dist/css/tailwind.css` (minified)
- **Vanilla JavaScript** — Single IIFE in `js/main.js`, deferred loading
- **Inter font** — Via Google Fonts with preconnect
- **Build pipeline** — `node build.js` → `dist/` (12 steps, see Build System section)
- **4 languages** — nl (master), en, es, pt-br via i18n JSON files + slug translations
- **No frameworks, no React, no SSR** — Compiles to pure static HTML

## Project Structure
```
/
├── build.js                              # 12-step build pipeline → dist/
├── indexnow-ping.js                      # SEO: ping IndexNow after deploy
├── package.json                          # deps: nunjucks, gray-matter, fs-extra, glob, tailwindcss
├── tailwind.config.js                    # Tailwind config (brand colors, fonts)
├── src/
│   ├── pages/
│   │   ├── nl/                           # 32 master pages (.njk)
│   │   ├── en/                           # 30 English translations
│   │   ├── es/                           # 30 Spanish translations
│   │   └── pt-br/                        # 30 Portuguese translations
│   ├── templates/
│   │   ├── base.njk                      # HTML skeleton (<html>, <head>, <body>)
│   │   ├── layouts/
│   │   │   └── page.njk                  # Main page layout (receives content + structured_data)
│   │   └── partials/
│   │       ├── head.njk                  # <head> meta tags, CSS, preconnects
│   │       ├── header.njk                # Site header + navigation
│   │       ├── footer.njk                # Site footer
│   │       ├── cookie-consent.njk        # Cookie consent banner
│   │       ├── language-switcher.njk     # Desktop language switcher
│   │       ├── language-switcher-mobile.njk
│   │       └── structured-data-org.njk   # Organization JSON-LD (included on all pages)
│   ├── i18n/
│   │   ├── nl.json                       # Dutch UI strings (nav, footer, buttons, etc.)
│   │   ├── en.json                       # English UI strings
│   │   ├── es.json                       # Spanish UI strings
│   │   ├── pt-br.json                    # Portuguese UI strings
│   │   └── slugs.json                    # URL slug translations per page
│   └── css/
│       └── tailwind-input.css            # Tailwind @import + custom directives
├── assets/                               # Images, logos, favicons (copied to dist/)
│   ├── logo/                             # pcd-logo.png, square logo for OG images
│   ├── favicon/                          # apple-touch-icon, favicon-32x32, favicon-192x192
│   └── images/                           # ~50 content images (webp + responsive variants)
├── css/custom.css                        # Supplementary CSS (custom properties, animations)
├── js/main.js                            # All JavaScript (IIFE: header scroll, FAQ, counters, etc.)
├── CNAME                                 # Custom domain for GitHub Pages
├── carehub-simulatie.html                # Confidential strategic simulation (noindex)
├── dist/                                 # Build output (gitignored)
└── .github/
    └── workflows/
        └── deploy.yml                    # GitHub Pages deployment on push to main
```

## Build System

### Pipeline (`node build.js` — 12 steps)
1. Clean `dist/`
2. Copy static assets (`assets/`, `css/`, `js/`)
3. Build Tailwind CSS (`src/css/tailwind-input.css` → `dist/css/tailwind.css`, minified)
4. Minify `custom.css` and `main.js` (strip comments, collapse whitespace)
5. Copy static files (`CNAME`, `.nojekyll`, `carehub-simulatie.html`, etc.)
6. Configure Nunjucks (`src/templates/`)
7. Load i18n strings (`src/i18n/{lang}.json`)
8. Load slug translations (`src/i18n/slugs.json`)
9. Build all pages: for each language × each NL page → render Nunjucks → write HTML to `dist/`
10. Generate `sitemap.xml` with hreflang alternates
11. Generate `robots.txt` + `llms.txt`
12. Post-process: add responsive `srcset` to images + cache-bust CSS/JS filenames (SHA-256 hash)

### Page frontmatter (gray-matter YAML)
Every `.njk` page starts with frontmatter:
```yaml
---
title: "Page Title | PCD"            # <title> tag (70-90 chars)
description: "Meta description"       # <meta name="description"> (140-160 chars)
og_image: "assets/logo/..."          # Open Graph image path (relative to root)
slug: "page-slug"                    # URL slug (empty string = index/homepage)
og_type: "website"                   # or "article" for insights/cases
noindex: false                       # true for confidential pages
---
```

### Template variables available in .njk files
- `{{ t.nav.ecosystem }}` — i18n string from `{lang}.json` (nested object access)
- `{{ langPrefix }}` — language URL prefix: `""` for nl, `"/en"` for en, etc.
- `{{ rootPath }}` — relative path to root: `""` for nl, `"../"` for other languages
- `{{ canonical }}` — full canonical URL (e.g., `https://pcdinvestmentpartners.com/insights`)
- `{{ title }}`, `{{ description }}`, `{{ og_image }}` — from frontmatter
- `{{ availableLanguages }}` — array of `{ hreflang, url }` for hreflang tags
- `{{ languageSwitchUrls }}` — array of `{ code, hreflang, label, url }` for language switcher
- `{{ pageName }}` — filename without extension (e.g., `insight-mensgerichte-ai-healthcare`)
- `{{ lang }}` — current language code (nl, en, es, pt-br)

### i18n system
- **NL is the master language.** If a page doesn't exist in another language, build.js falls back to NL content with that language's UI strings
- **URL slugs** are translated via `src/i18n/slugs.json` (e.g., `leiderschap` → `leadership` in EN)
- **Internal links** in non-NL pages are automatically rewritten to use translated slugs during build
- **Hreflang alternates** are auto-generated per page (only for languages where the page file exists)

### Structured data
Pages can include a `{% block structured_data %}...{% endblock %}` block with JSON-LD. This is extracted and rendered separately by build.js, then injected into `<head>`.

## Brand Colors (Tailwind custom config)
```
navy-900: #0a1628    navy-800: #0f1f3d    navy-700: #152a4a    navy-600: #1a3558
brand-blue: #046bd2  brand-blue-dark: #045cb4  brand-light: #f4f6f8
```

## SEO Implementation
Every page includes (via `partials/head.njk`):
- Unique `<title>` and `<meta name="description">`
- `<link rel="canonical">` and `<link rel="alternate" hreflang="...">`
- Full Open Graph + Twitter Card tags
- `<meta name="robots" content="index, follow">` (except noindex pages)
- Skip-to-content link for accessibility

## JSON-LD Structured Data
| Schema | Pages |
|--------|-------|
| Organization | All pages (via `partials/structured-data-org.njk`) |
| WebSite + SearchAction | index only |
| BreadcrumbList | All subpages |
| FAQPage | index, carehub, zorgorganisaties, zorgtech, investeerders |
| Article | 3 case pages + 6 insight pages |
| HowTo | zorgtech-softwarebedrijven, investeerders-partners |
| SpeakableSpecification | index, carehub, 3 case pages |

## JavaScript Features (js/main.js)
- `handleHeaderScroll()` — Sticky header with `.scrolled` class at 50px
- Mobile hamburger menu with `.open` class toggle
- Mobile dropdown accordion (close-others-on-open)
- FAQ accordion (one-open-at-a-time, `.active` class, `.faq-trigger`/`.faq-content`)
- `IntersectionObserver` for `.fade-in-up` scroll animations (threshold 0.1)
- `animateCounter()` for `.stat-counter[data-target]` elements (2s ease-out cubic)
- Smooth scroll for anchor links (offset for fixed header)

## CSS Architecture (css/custom.css)
- CSS custom properties for brand colors
- Header scroll effect, dropdown animations
- `.fade-in-up` animation (opacity 0→1, translateY 30px→0)
- FAQ accordion transitions (max-height, icon rotation 45deg)
- Card hover effects, breadcrumb styles, print stylesheet
- `prefers-reduced-motion` support

## Images
- Content images in `assets/images/` as `.webp`
- Responsive variants: `{name}-480w.webp`, `{name}-768w.webp` (build.js auto-generates srcset)
- Team headshots: circular crops with transparent backgrounds
- All images have descriptive Dutch `alt` text and `width`/`height` attributes
- Below-fold: `loading="lazy"` + `decoding="async"`, hero images: `loading="eager"`

## Key Contacts & Company Info
- **Company:** PCD Investment Partners
- **Address:** Lijndonk 4, Breda, Nederland
- **Phone:** +31 6 53 85 27 53
- **Contact person:** Patrick Dinkela (Co-Founder, COO & Vice-Chairman)
- **LinkedIn:** linkedin.com/company/pcd-investment-partners/
- **Founded:** 2024

## Team Members (leiderschap page)
1. Frans van den Berg — CEO & Board Member
2. Patrick Dinkela — Co-Founder, COO & Vice-Chairman
3. Coby Dinkela — Co-Founder & CCO
4. Niels Roest — Chief AI & Innovation Officer (CAIO)
5. Frank van Antwerpen — CFO
6. Kevin de Rooij — Legal Director

## Content Guidelines
- All content in **Dutch** (NL is master language)
- Primary keywords: digitale zorg, zorg digitalisering, zorgtechnologie, CareHub, ECD integratie, interoperabiliteit
- Tone: professional, authoritative, accessible
- No emojis unless explicitly requested

## Insight Article Pages
Insight/blog pages follow a consistent template:
- **Layout:** Narrow `max-w-3xl` centered column, 3-5 h2 sections, alternating `bg-white`/`bg-brand-light`
- **Components:** Hero with breadcrumb + category pill, article meta, stat callout boxes, related insights (2 cards), CTA
- **Breadcrumb:** Home > Insights > Article Title
- **Nav active state:** "Insights" link gets `border-b-2 border-brand-blue`
- **Filename pattern:** `insight-{slug}.njk` in `src/pages/{lang}/`

## Deployment
- **GitHub Pages** via `.github/workflows/deploy.yml`
- Push to `main` → `npm ci` → `node build.js` → upload `dist/` → deploy → IndexNow ping
- All internal links use `{{ langPrefix }}` for language-aware paths
- No server-side dependencies

---

## Autonomous Operation Guidelines

### Verification — always before considering work complete
- Run `npm ci && node build.js` — must complete without errors
- Check that new/changed pages appear in `dist/`
- For new pages: verify all requested language versions built correctly
- For content changes: spot-check the output HTML in `dist/`

### What NOT to change (unless explicitly asked)
- `build.js` — core build pipeline
- `src/templates/base.njk` — HTML skeleton
- `src/templates/layouts/page.njk` — page layout
- `src/templates/partials/header.njk`, `footer.njk` — shared navigation
- `.github/workflows/` — CI/CD pipelines
- `CNAME`, `.nojekyll`, `indexnow-ping.js`
- `carehub-simulatie.html` — confidential strategic document

### New page checklist
1. Create `src/pages/nl/{slug}.njk` with frontmatter (`title`, `description`, `slug`, `og_image`, `og_type`)
2. Follow the structure of an existing similar page exactly (insight → copy an insight, case → copy a case)
3. Use `{{ langPrefix }}` for all internal links, `{{ rootPath }}` for asset paths
4. Include a `{% block structured_data %}` with appropriate JSON-LD
5. Add translated versions in `src/pages/en/`, `src/pages/es/`, `src/pages/pt-br/` if requested
6. Add slug translations to `src/i18n/slugs.json`
7. Update the relevant overview page (`insights.njk` or `cases.njk`) with a card for the new page
8. Run `node build.js` — verify all languages build, check `dist/sitemap.xml` includes new URLs

### Content update checklist
1. Edit the correct language file(s) in `src/pages/{lang}/`
2. If navigation text changes: update `src/i18n/{lang}.json`
3. If a slug changes: update `src/i18n/slugs.json`
4. Run `node build.js` to verify

### Image guidelines
- Place images in `assets/images/` as `.webp`
- Create responsive variants: `{name}-480w.webp` and `{name}-768w.webp` (build.js auto-generates srcset)
- All images must have: descriptive Dutch `alt` text, `width`, `height` attributes
- Below-fold images: `loading="lazy"`, hero images: `loading="eager"`

### Commit conventions
- Conventional commits: `feat:`, `fix:`, `content:`, `seo:`, `chore:`
- Commit messages in English
- One logical change per commit
