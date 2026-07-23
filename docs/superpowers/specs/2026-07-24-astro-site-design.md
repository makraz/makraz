# makraz.com — Production Astro Site: Design Spec

**Date:** 2026-07-24
**Source of truth for visuals:** `design_handoff_makraz_website/` (README + `.dc.html` prototypes). High-fidelity: recreate pixel-perfectly. Copy in FR/EN/AR is lifted verbatim from the prototypes, `[à compléter]` placeholders preserved.

## Decisions

| Decision | Choice |
|---|---|
| Framework | Astro (latest v5) |
| Hosting | Cloudflare Pages, git-connected to `main` |
| Architecture | `@astrojs/cloudflare` adapter; all pages prerendered; single server route `src/pages/api/contact.ts` (`prerender = false`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), handoff tokens in `@theme` |
| i18n URLs | All prefixed: `/fr/`, `/en/`, `/ar/`; root `/` redirects to `/fr/`; French slugs across locales (e.g. `/en/a-propos`) |
| Scope | All 9 pages: Home, Services, Portfolio, About, Contact, Blog index, Article, Case study (Farblieferant), Legal |
| Contact form | Cloudflare Pages Function (Astro API route) → Resend API → contact@makraz.com; Turnstile spam protection |
| Repo layout | Astro project at repo root; duplicate root-level `.dc.html` prototypes and `support.js`/`image-slot.js` removed (reference copy stays in `design_handoff_makraz_website/`) |

## Project structure

```
astro.config.mjs              # cloudflare adapter, site: https://makraz.com, sitemap integration
src/
  styles/global.css           # Tailwind v4 @theme tokens + base styles
  i18n/
    fr.json  en.json  ar.json # dictionaries extracted from prototype scripts
    index.ts                  # locales list, t() helper, dir() helper
  layouts/Base.astro          # <html lang dir>, fonts, SEO/OG/hreflang/canonical, Header, Footer, CtaBand slot
  components/                 # Header, Footer, CtaBand, Button, Kicker, ProjectCard, ValueCard, StatItem, FaqItem, ImagePlaceholder
  content/                    # content collections: blog posts + case studies, markdown per language
  pages/
    index.astro               # redirect / → /fr/
    api/contact.ts            # the only server route
    [lang]/
      index.astro  services.astro  portfolio.astro  a-propos.astro
      contact.astro  blog/index.astro  blog/[slug].astro
      portfolio/farblieferant.astro  mentions-legales.astro
public/                       # favicon, og-image, robots.txt
design_handoff_makraz_website/  # design reference, excluded from build
```

## Routing & i18n

- `[lang]` pages use `getStaticPaths()` over `['fr','en','ar']` — 3 static builds per page, no runtime i18n.
- Dictionaries: one JSON per language, keys matching the prototypes' `data-i18n` keys where practical. `t(lang, key)` typed helper.
- Arabic: `dir="rtl"` on `<html>`, IBM Plex Sans Arabic font, `letter-spacing: 0` override. Use Tailwind logical properties (`ms-/me-/ps-/pe-/text-start`) everywhere so layouts mirror automatically.
- Language switcher in header cycles FR → EN → AR by linking to the equivalent page in the next locale. URL is the state; no localStorage.
- Root `/` serves a redirect to `/fr/` (also `x-default` hreflang target).
- Blog articles and case studies are content collections (markdown per language) with a shared frontmatter schema (title, description, date, lang, slug); pages 2–3 of the blog remain "À venir" cards, not routes.

## Styling

- Tailwind v4 `@theme` in `global.css`: ink `#0a0a0a`, paper `#fdfdfd`, white sections `#ffffff`, text secondary `#555555` / muted `#6b6b6b`, `#8a8a8a`, borders `#ececec`/`#d8d8d8`/`#262626`, on-dark text shades, radii (pill 999px, card 20px, media 24px, input 12px), Instrument Sans + IBM Plex Sans Arabic font stacks.
- Custom utilities for the type scale: H1 `clamp(44px,6.5vw,88px)` ls -0.035em, H2 `clamp(34px,3.6vw,50px)` ls -0.03em, sub-H2 `clamp(30px,3vw,42px)`, kicker 12px uppercase ls .24em #8a8a8a w600. `text-wrap: balance` on headlines, `pretty` on paragraphs. Selection: black bg / white text.
- Layout: container max-w 1240px / 32px side padding; section padding 88–110px vertical; sticky 72px header with `rgba(253,253,253,.92)` + blur(12px); dark sections `#0a0a0a`.
- Responsive per handoff: ≤900px nav/CTA hidden + burger menu, grids collapse to 1 col (process grid 2 col ≤900px, 1 col ≤560px), sticky intro columns become static.
- Interactions: CSS-only hovers (nav #6b6b6b→ink, primary button →#2e2e2e, ghost border→black, cards border→black, footer links #d4d4d4→white); smooth scroll. Only client JS: burger toggle (~10 lines inline) and contact form enhancement.

## Contact form

- Progressive enhancement: `<form method="POST" action="/api/contact">` works without JS; small script adds inline sending/sent/error status in the page language.
- API route: validate (name, email, message required; email format) → verify Turnstile token → send via Resend (to contact@makraz.com, Reply-To visitor) → JSON response.
- Errors: 400 with per-field localized messages; 500 with localized fallback ("write us directly at contact@makraz.com").
- Secrets `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` in Cloudflare Pages env vars; public Turnstile site key in a public env var. Never committed.

## SEO

- Per-page title/meta description per language (from prototypes), OG tags + `og-image.png`, canonical, hreflang fr/en/ar + `x-default` → `/fr/`.
- `@astrojs/sitemap` with i18n config; `robots.txt`.
- JSON-LD `Organization` on home (name, logo, address Centre d'affaires Itrane Marrakech, phone +212 6 61 76 43 92, email contact@makraz.com).

## Deployment

- Cloudflare Pages git integration: push to `main` → build (`astro build`) → deploy; PR preview URLs.
- One-time manual steps (documented in repo README): custom domain + www redirect, Resend domain DNS verification, Turnstile site/secret keys, Pages env vars.

## Testing

- Gate: `astro check` + `astro build` pass.
- Vitest: contact API handler unit tests (validation, Turnstile mock, Resend mock).
- Playwright smoke: all 9 pages × 3 locales render, nav links resolve, `/ar/` has `dir="rtl"`, form submit against mocked endpoint.
- Visual fidelity: manual side-by-side screenshots (prototype vs build) during implementation.

## Known content gaps (carried from handoff, not blockers)

Portfolio descriptions are assumptions; testimonials are drafts; case-study context/metrics carry `[à compléter]`; Legal page RC/ICE/IF + hosting provider placeholders; real project screenshots and founder photo pending — `ImagePlaceholder` slots until supplied.
