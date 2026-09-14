# Build System Reference

## Pipeline (`node build.js` — 12 steps)
1. Clean `dist/`
2. Copy static assets (`assets/`, `css/`, `js/`)
3. Build Tailwind CSS (`src/css/tailwind-input.css` → `dist/css/tailwind.css`, minified)
4. Minify `custom.css` and `main.js`
5. Copy static files (`CNAME`, `.nojekyll`, `carehub-simulatie.html`, etc.)
6. Configure Nunjucks (`src/templates/`)
7. Load i18n strings (`src/i18n/{lang}.json`)
8. Load slug translations (`src/i18n/slugs.json`)
9. Build all pages: for each language × each NL page → render Nunjucks → write HTML to `dist/`
10. Generate `sitemap.xml` with hreflang alternates
11. Generate `robots.txt` + `llms.txt`
12. Post-process: add responsive `srcset` to images + cache-bust CSS/JS filenames (SHA-256 hash)

## Page Frontmatter (gray-matter YAML)
```yaml
---
title: "Page Title | PCD"            # <title> tag (70-90 chars)
description: "Meta description"       # 140-160 chars
og_image: "assets/logo/..."          # Open Graph image path
slug: "page-slug"                    # empty string = homepage
og_type: "website"                   # or "article" for insights/cases
noindex: false                       # true for confidential pages
---
```

## Template Variables in .njk Files
- `{{ t.nav.ecosystem }}` — i18n string from `{lang}.json`
- `{{ langPrefix }}` — `""` for nl, `"/en"` for en, etc. — use for ALL internal links
- `{{ rootPath }}` — `""` for nl, `"../"` for other languages — use for asset paths
- `{{ canonical }}` — full canonical URL
- `{{ title }}`, `{{ description }}`, `{{ og_image }}` — from frontmatter
- `{{ availableLanguages }}` — array of `{ hreflang, url }` for hreflang tags
- `{{ languageSwitchUrls }}` — array of `{ code, hreflang, label, url }`
- `{{ pageName }}` — filename without extension
- `{{ lang }}` — current language code (nl, en, es, pt-br)

## i18n System
- **NL is master language.** Missing translations fall back to NL content + target UI strings
- **URL slugs** translated via `src/i18n/slugs.json` (e.g., `leiderschap` → `leadership`)
- **Internal links** in non-NL pages are automatically rewritten to translated slugs during build
- **Hreflang alternates** auto-generated per page (only for languages with an existing page file)

## Structured Data
Pages use `{% block structured_data %}...{% endblock %}` with JSON-LD. Build.js extracts and injects into `<head>`.

| Schema | Pages |
|--------|-------|
| Organization | All pages (via `partials/structured-data-org.njk`) |
| WebSite + SearchAction | index only |
| BreadcrumbList | All subpages |
| FAQPage | index, carehub, zorgorganisaties, zorgtech, investeerders |
| Article | 3 case pages + 6 insight pages |
| HowTo | zorgtech-softwarebedrijven, investeerders-partners |
| SpeakableSpecification | index, carehub, 3 case pages |
