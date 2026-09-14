# Checklists

## New Page Checklist
1. Create `src/pages/nl/{slug}.njk` with frontmatter (`title`, `description`, `slug`, `og_image`, `og_type`)
2. Follow the structure of an existing similar page exactly (insight → copy an insight, case → copy a case)
3. Use `{{ langPrefix }}` for all internal links, `{{ rootPath }}` for asset paths
4. Include `{% block structured_data %}` with appropriate JSON-LD
5. Add translated versions in `src/pages/en/`, `src/pages/es/`, `src/pages/pt-br/` if requested
6. Add slug translations to `src/i18n/slugs.json`
7. Update the relevant overview page (`insights.njk` or `cases.njk`) with a card for the new page
8. Run `node build.js` — verify all languages build, check `dist/sitemap.xml` includes new URLs

## Content Update Checklist
1. Edit the correct language file(s) in `src/pages/{lang}/`
2. If navigation text changes: update `src/i18n/{lang}.json`
3. If a slug changes: update `src/i18n/slugs.json`
4. Run `node build.js` to verify

## Image Checklist
- Place in `assets/images/` as `.webp`
- Create responsive variants: `{name}-480w.webp` and `{name}-768w.webp`
- Add descriptive Dutch `alt` text, `width`, `height` attributes
- Below-fold: `loading="lazy"`, hero: `loading="eager"`

## Verification (before considering work complete)
- Run `node build.js` — must complete without errors
- Check new/changed pages appear in `dist/`
- For new pages: verify all requested language versions built correctly
- For content changes: spot-check output HTML in `dist/`
