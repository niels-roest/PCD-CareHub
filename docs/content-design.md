# Content & Design Reference

## Brand Colors (Tailwind custom config)
```
navy-900: #0a1628    navy-800: #0f1f3d    navy-700: #152a4a    navy-600: #1a3558
brand-blue: #046bd2  brand-blue-dark: #045cb4  brand-light: #f4f6f8
```

## Content Guidelines
- All content in **Dutch** (NL is master language)
- Primary keywords: digitale zorg, zorg digitalisering, zorgtechnologie, CareHub, ECD integratie, interoperabiliteit
- Tone: professional, authoritative, accessible
- No emojis unless explicitly requested
- Human-first: zorgverhaal bovenaan, tech als onderbouwing, nooit AI-frameworks als headline

## Insight Article Pages
- **Layout:** Narrow `max-w-3xl` centered column, 3-5 h2 sections, alternating `bg-white`/`bg-brand-light`
- **Components:** Hero with breadcrumb + category pill, article meta, stat callout boxes, related insights (2 cards), CTA
- **Breadcrumb:** Home > Insights > Article Title
- **Nav active state:** "Insights" link gets `border-b-2 border-brand-blue`
- **Filename pattern:** `insight-{slug}.njk` in `src/pages/{lang}/`

## Images
- Content images in `assets/images/` as `.webp`
- Responsive variants: `{name}-480w.webp`, `{name}-768w.webp` (build.js auto-generates srcset)
- All images: descriptive Dutch `alt` text, `width`, `height` attributes
- Below-fold: `loading="lazy"` + `decoding="async"`, hero images: `loading="eager"`

## JavaScript Features (js/main.js)
- `handleHeaderScroll()` — Sticky header with `.scrolled` class at 50px
- Mobile hamburger menu with `.open` class toggle
- FAQ accordion (`.faq-trigger`/`.faq-content`, `.active` class)
- `IntersectionObserver` for `.fade-in-up` scroll animations (threshold 0.1)
- `animateCounter()` for `.stat-counter[data-target]` elements (2s ease-out cubic)
- Smooth scroll for anchor links (offset for fixed header)

## CSS Architecture (css/custom.css)
- CSS custom properties for brand colors
- `.fade-in-up` animation (opacity 0→1, translateY 30px→0)
- FAQ accordion transitions (max-height, icon rotation 45deg)
- Card hover effects, breadcrumb styles, print stylesheet
- `prefers-reduced-motion` support

## SEO (every page via partials/head.njk)
- Unique `<title>` and `<meta name="description">`
- `<link rel="canonical">` and hreflang alternates
- Full Open Graph + Twitter Card tags
- `<meta name="robots" content="index, follow">` (except noindex pages)
