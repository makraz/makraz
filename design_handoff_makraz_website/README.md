# Handoff: MAKRAZ SARLAU Website (makraz.com)

## Overview
Complete 5-page marketing website for MAKRAZ SARLAU, a digital agency in Marrakech (development, design, communication). Pages: Home, Services, Portfolio, À propos (About), Contact. French is the primary language with a working EN toggle. Premium black & white aesthetic built around the company's monochrome logo.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to ship directly. The task is to **recreate these designs in the target environment**. No environment exists yet for makraz.com; recommended: a static-first framework with SSR/SSG for SEO (Next.js or Astro), deployed with proper meta tags, sitemap, and hreflang (fr/en). The `.dc.html` files open in a browser for reference but contain a proprietary runtime — treat them as visual/behavioral specs.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final unless the client says otherwise. Recreate pixel-perfectly.

## Global Design Tokens
- Background: `#fdfdfd` (page), `#ffffff` (alternating sections, cards)
- Ink: `#0a0a0a` (text, buttons, dark sections)
- Secondary text: `#555555`; muted: `#6b6b6b`, `#8a8a8a`
- Borders: `#ececec` (light), `#d8d8d8` (inputs/buttons), `#262626` (on dark)
- On-dark text: `#ffffff`, `#d4d4d4`, `#a3a3a3`, `#737373`
- Font: **Instrument Sans** (Google Fonts), weights 400/500/600/700; fallback 'Helvetica Neue', Helvetica, Arial
- Type scale: H1 clamp(44–88px, ~5.5–6.5vw), section H2 clamp(34px, 3.6vw, 50px), sub-H2 clamp(30px, 3vw, 42px), body 15–20px, kickers 12px uppercase letter-spacing .24em color #8a8a8a weight 600
- Headline letter-spacing: -0.035em (H1), -0.03em (H2); `text-wrap: balance` on headlines, `pretty` on paragraphs
- Radius: pills `999px` (buttons), cards `20px`, large media `24px`, inputs `12px`
- Container: max-width 1240px, 32px side padding
- Section padding: 88–110px vertical
- Selection color: black bg / white text

## Layout System
- Sticky header, 72px tall, `rgba(253,253,253,.92)` + `backdrop-filter: blur(12px)`, 1px #ececec bottom border. Left: logo (34px) + "MAKRAZ" wordmark (16px, 700, letter-spacing .18em). Center: nav links (15px/500, active = 2px black bottom border, inactive #6b6b6b → black on hover). Right: EN/FR pill toggle, black pill CTA "Démarrer un projet".
- Buttons: primary = black pill, white text, 17px 32–34px padding, 16px/600, hover #2e2e2e; ghost = 1px #d8d8d8 border pill, hover border black; on dark = white pill, hover #e2e2e2.
- Dark sections (CTA band + footer): `#0a0a0a` background, centered CTA band with white logo (44px), big headline, white pill button.
- Footer: brand block (white logo 30px + wordmark + 1-line description #a3a3a3), Navigation column, Contact column (email, tel, address link), bottom bar "© 2026 MAKRAZ SARLAU" / "Construit avec rigueur, à Marrakech." (13px #737373).

## Screens
### Home (`Home.dc.html`)
1. Hero: kicker "Agence digitale — Marrakech", H1 "Des produits digitaux construits pour durer.", sub-paragraph, primary CTA "Réserver un appel découverte" + ghost "Voir nos réalisations". Stats row (3 cols, top border): "10+ ans d'ingénierie (Suisse · Italie · Dubaï)", "4 marchés (Maroc · MENA · Europe · USA)", "FR·EN·AR trilingue". Stat number 40px/700.
2. Pillars (white bg): "Trois métiers. Un seul partenaire." — 3 cards (1px #ececec border, radius 20, padding 40/36, hover border black): 01 Développement / 02 Design / 03 Communication, each with description + 3 dash-prefixed items; link "Découvrir tous nos services →".
3. Selected work: 3 project cards, 4:3 image placeholder (radius 20) + name (19px/700) + tag line (14px #8a8a8a). Link "Tout le portfolio →".
4. Process: "De la découverte à l'adoption…" — 5 columns, each 2px black top border, number, title (19px/700), description (14px).
5. Audience: 2×2 bordered grid (hairline dividers): PME marocaines & fondateurs / Clients européens / Startups & MVP / Hospitality & retail.
6. Black CTA band + footer.

### Services (`Services.dc.html`)
Hero + three catalog sections (alternating white/#fdfdfd), each a 340px sticky intro column (number, H2, paragraph) + right list of rows (`grid-template-columns: 260px 1fr`, 26px vertical padding, hairline dividers): Développement (8 rows: web/SaaS, mobile, sites, e-commerce, MVP, API, DevOps, maintenance), Design (3 rows), Communication (6 rows: SEO, SEA, réseaux sociaux, stratégie, contenu, conseil). Black CTA band + footer.

### Portfolio (`Portfolio.dc.html`)
Hero + 3 featured case studies, alternating image/text 2-column layouts (1.25fr/1fr), 16:11 image placeholder radius 24; each has kicker, H2 project name, paragraph, 3 dash services, external link (farblieferant.de, phpmorocco.ma, marrakechphp.ma). **Project descriptions are assumptions — confirm with client.** Black CTA band + footer.

### À propos (`About.dc.html`)
Hero; "Le parcours" section (sticky intro + 4 timeline rows: Suisse, Italie, Dubaï, Marrakech/MAKRAZ); "Nos valeurs" 2×2 cards (Rigueur d'ingénierie, Responsabilité de bout en bout, Transparence, Présence dans la durée); "L'équipe" section: 280px square photo placeholder + Hamza Makraz, "Fondateur — Ingénieur logiciel" + bio. Black CTA band + footer.

### Contact (`Contact.dc.html`)
Two-column (1fr / 1.1fr, 80px gap). Left: H1 "Parlons de votre projet.", paragraph (réponse sous 24 h), stacked contact rows with hairline dividers (label left #8a8a8a 14px, value right 17px/600): Email contact@makraz.com, WhatsApp +212 6 61 76 43 92 (wa.me/212661764392), Téléphone (tel:+212661764392), Bureau "Centre d'affaires Itrane, Marrakech" (links to https://share.google/WllPHd9fKnFBdVmS0), Langues FR·EN·AR. Right: form card (white, 1px border, radius 24, 48px padding): Nom + Email (2 cols), Société (optionnel), Votre projet (textarea), full-width black pill submit. Prototype submits via mailto: — **production should POST to a real endpoint (API route + email service) with validation and a success state.**

## Interactions & Behavior
- **Language toggle (FR/EN)**: pill button in header. Choice persists across pages (prototype uses localStorage key `mk-lang`). In production use proper i18n routing (`/fr`, `/en`) with hreflang. All EN strings are embedded in each page's script (dictionary objects keyed by `data-i18n` attributes) — extract them as translation files.
- Hover states: nav links #6b6b6b→#0a0a0a; buttons darken/lighten as above; cards border→black; footer links #d4d4d4→#ffffff.
- Active nav page: 2px black underline.
- Form: controlled inputs; focus = black border.

## Responsive (≤900px)
- Nav links and header CTA hidden; hamburger (☰ pill) shows a vertical menu panel under the header (16px/600 links, 12px vertical padding).
- All multi-column grids collapse to 1 column (process grid: 2 cols ≤900px, 1 col ≤560px).
- Sticky intro columns become static; audience cells lose left border, padding 28px 0; contact form card padding 28px/22px.
- Reference CSS classes in prototypes: `.mk-nav`, `.mk-burger`, `.mk-ctahead`, `.mk-grid2/3/5`, `.mk-split`, `.mk-row`, `.mk-sticky`, `.mk-cell`, `.mk-card`.

## State Management
Minimal: `lang` (fr/en, persisted), `menuOpen` (mobile), contact form fields. No data fetching.

## Assets
- `assets/logo-black.png` — logo mark, black on transparent (591×591, mark centered with padding)
- `assets/logo-white.png` — same mark in white (for dark sections)
- Portfolio/team images are **drop placeholders** — client must supply real screenshots (farblieferant.de, phpmorocco.ma, marrakechphp.ma) and a founder photo.
- Font: Instrument Sans via Google Fonts.

## Files
- `Home.dc.html`, `Services.dc.html`, `Portfolio.dc.html`, `About.dc.html`, `Contact.dc.html` — the five page designs (open in browser)
- `image-slot.js` — placeholder-image runtime used by the prototypes (not needed in production)
- `assets/` — logo files

## Production Checklist (not in prototype)
- Real form endpoint + spam protection; SEO meta/OG tags per page; sitemap + hreflang fr/en; favicon from logo; mentions légales / privacy page; analytics.

## Update — July 2026 (v2)
- **Trilingual**: the header toggle now cycles FR → EN → AR. Arabic applies `dir="rtl"` and the 'IBM Plex Sans Arabic' font (letter-spacing reset). In production, use i18n routing (/fr, /en, /ar) with hreflang and full RTL QA.
- **Testimonials** section on Home — the three quotes are DRAFTS with anonymous role labels; replace with real client quotes before launch.
- **FAQ** section on the Contact page (6 items, details/summary accordions).
- **Contact form**: posts JSON ({name, email, company, message}) to a configurable endpoint (prototype prop `formEndpoint`, e.g. Formspree); falls back to mailto: when unset. Has required-field validation and FR/EN/AR status messages (sending/sent/error). Production: real endpoint + spam protection.
- **Legal.dc.html**: mentions légales + politique de confidentialité (loi 09-08 + RGPD). Placeholders to fill: RC / ICE / IF numbers and hosting provider. Linked from every footer. French-only by design.
- **assets/favicon.png** (128px) and **assets/og-image.png** (1200×630) generated from the logo; every page now has <title>, meta description and Open Graph tags.

## Update — July 2026 (v3)
- **Blog.dc.html** (index, 3 posts — post 1 links to Article.dc.html, posts 2-3 marked "À venir") and **Article.dc.html** (sample article template with author block). Article content is an original draft to review.
- **CaseFarblieferant.dc.html**: case-study template (context / solution / stack chips / results). Context, solution, stack and metrics carry [à compléter]/[to validate] placeholders — confirm with the client. Linked from the Portfolio page ("Lire l'étude de cas"). Duplicate this file for the other two projects once content is available.
- **Legal.dc.html is now trilingual** (FR/EN/AR via the same toggle; French version prevails).
- "Blog" added to nav/footer on all pages. New pages are fully trilingual incl. article body.
