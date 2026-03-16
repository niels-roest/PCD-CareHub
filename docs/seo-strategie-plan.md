# SEO Strategisch Plan — pcdinvestmentpartners.com

**Datum**: 13 maart 2026
**Status**: Alle 10 SEO audits afgerond

---

## Huidige staat

| Metric | Waarde |
|--------|--------|
| Pagina's | 120 (30 uniek x 4 talen) |
| Sitemap URLs | 112 (geïndexeerd) |
| Lighthouse Score | 99/100 |
| Technical SEO | 88/100 |
| E-E-A-T | Sterk (bronvermeldingen, auteurspagina, bios, case studies) |
| GEO | Geoptimaliseerd (llms.txt, AI crawlers, definitie-patronen, vraag-headings) |
| Schema | Organization, Article, BreadcrumbList, Person, WebSite, DefinedTermSet |
| Hreflang | 4 talen (NL, EN, ES, PT-BR), correct geïmplementeerd |
| Content | 6 insights, 3 cases, 2 vergelijkingspagina's, glossary (25 termen) |

---

## Afgeronde SEO audits (10/10)

| # | Audit | Score | Resultaat |
|---|-------|-------|-----------|
| 1 | `/seo-content` | ✅ | E-E-A-T, bronvermeldingen, case depth, key takeaways |
| 2 | `/seo-hreflang` | ✅ | Fallback-fix, 4 talen correct, x-default |
| 3 | `/seo-schema` | ✅ | Entity linking, ContactPage, Person schema |
| 4 | `/seo-geo` | ✅ | llms.txt, AI crawlers, definitie-patronen (3 fasen) |
| 5 | `/seo-images` | ✅ | fetchpriority, decoding="async", 33 orphans verwijderd (-736KB) |
| 6 | `/seo-page` | ✅ | Title tags <65 chars, CareHub keyword-first, email uit JSON-LD |
| 7 | `/seo-competitor-pages` | ✅ | 2 vergelijkingspagina's in 4 talen (8 bestanden) |
| 8 | `/seo-sitemap` | ✅ | Statische sitemap verwijderd, terms vertaald, 109→112 URLs |
| 9 | `/seo-technical` | ✅ | CSP meta tag, Referrer-Policy, footer touch targets |
| 10 | `/seo-programmatic` | ✅ | Clean — geen issues, handgeschreven content |

---

## Strategische aanbevelingen

### Fase 1: Content groei (Q2 2026)

**Nieuwe insights** (4 suggesties):
- Wegiz implementatie — verplichte elektronische gegevensuitwisseling in de zorg
- NEN 7510 compliance — informatiebeveiliging in de zorg
- EHDS impact — European Health Data Space en wat het betekent voor Nederlandse zorgtech
- AI in GGZ — concrete toepassingen en verantwoord gebruik

**Case studies** (wanneer beschikbaar):
- 1-2 nieuwe cases toevoegen uit CareHub portfolio
- Bestaande cases verdiepen met actuele resultaatcijfers

**Glossary uitbreiding**:
- Van ~25 naar 40+ termen
- Nieuwe termen: Wegiz, EHDS, NEN 7510, SMART on FHIR, OAuth 2.0, etc.

### Fase 2: Authority building (Q2-Q3 2026)

**LinkedIn thought leadership**:
- Maandelijks 2-3 LinkedIn posts die linken naar insights
- Niels als auteur — versterkt E-E-A-T signalen

**Externe publicaties**:
- Gastartikelen op zorg-vakbladen (Skipr, Zorgvisie, ICT&health)
- Spreekbeurten op zorgtech-conferenties (e-healthweek, Zorg & ICT)

**Wikipedia/Wikidata**:
- Wikipedia-vermelding voor PCD Investment Partners
- Wikidata Q-nummers zijn al aanwezig (bedrijf + 6 teamleden)

### Fase 3: Monitoring & iteratie (doorlopend)

**Google Search Console**:
- Wekelijks indexering en CTR monitoren
- Coverage issues direct oplossen

**Content refresh**:
- Kwartaal review van bestaande insights (actualiteit bronvermeldingen)
- Jaarlijks privacy/cookie policy updaten

**Sitemap**:
- Automatisch herbouwd bij elke deploy (build.js)
- IndexNow key aanwezig voor snellere indexering

---

## Wat NIET doen

- **Geen bulk AI-content** — scaled content abuse risico (Google enforcement 2025)
- **Geen Cloudflare proxy** — performance regressie (TBT 0ms → 1.550ms)
- **Geen programmatic SEO opschalen** — 120 pagina's is perfect voor dit type site
- **Geen keyword stuffing** — CareHub-first strategie werkt, niet forceren
- **Geen pagina's zonder echte waarde** — elke pagina moet standalone waardevol zijn

---

## Technische status

### Geïmplementeerd
- ✅ Self-hosted Inter font (44KB woff2, font-display: swap)
- ✅ Content hash cache-busting op CSS/JS
- ✅ Responsive srcset (480w/768w) op alle content images
- ✅ fetchpriority="high" op hero images
- ✅ decoding="async" op lazy-loaded images
- ✅ CSP meta tag (XSS-bescherming)
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Cookie consent → GA alleen na expliciete toestemming
- ✅ Email spam-preventie (JS obfuscation + HTML entities)
- ✅ AI crawler management (robots.txt + llms.txt)
- ✅ IndexNow protocol key

### Niet fixbaar (platform-limitatie GitHub Pages)
- ❌ HSTS header
- ❌ X-Frame-Options header
- ❌ X-Content-Type-Options header
- ❌ Permissions-Policy header

*Deze headers vereisen Cloudflare proxy of ander hostingplatform. Voor een statische site zonder login/formulieren is het risico verwaarloosbaar.*

---

## Conclusie

De technische SEO is volledig afgerond. Alle 10 audits zijn doorlopen, alle fixbare issues zijn opgelost. De site scoort 99/100 op Lighthouse, heeft correcte hreflang, uitgebreide schema markup, GEO-optimalisatie, en security headers via meta tags.

**De volgende groei komt uit content en authority**, niet uit meer technische optimalisaties:
1. Meer insights en case studies schrijven
2. Externe vermeldingen en backlinks opbouwen
3. Thought leadership via LinkedIn en vakbladen
