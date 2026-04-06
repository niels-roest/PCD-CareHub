# PCD Investment Partners — Static Website

Multi-language static site (Nunjucks → static HTML, GitHub Pages). NL is master language; also en, es, pt-br.

**Build:** `node build.js` → `dist/` **Deploy:** push to `main` → GitHub Actions

## Tech Stack
Nunjucks, gray-matter, Tailwind CSS, vanilla JS, no frameworks, no SSR.
Pages in `src/pages/{lang}/`, templates in `src/templates/`, i18n in `src/i18n/`.

## Rules
1. Always run `node build.js` before considering work complete — must have zero errors
2. NL content is master — use `{{ langPrefix }}` for all internal links, `{{ rootPath }}` for assets
3. Content in Dutch, no emojis, professional tone, human-first (zorgverhaal first, tech as support)
4. Conventional commits in English: `feat:`, `fix:`, `content:`, `seo:`, `chore:`
5. One logical change per commit

## Do NOT change (unless explicitly asked)
`build.js`, `src/templates/base.njk`, `src/templates/layouts/page.njk`,
`src/templates/partials/header.njk`, `src/templates/partials/footer.njk`,
`.github/workflows/`, `CNAME`, `.nojekyll`, `indexnow-ping.js`, `carehub-simulatie.html`

## Detail Files
- Build pipeline, frontmatter, template vars, i18n, structured data → `docs/build-system.md`
- Brand colors, content guidelines, JS/CSS features, images, SEO → `docs/content-design.md`
- New page, content update, image, verification checklists → `docs/checklists.md`
- Company info, team members → `docs/company-info.md`
