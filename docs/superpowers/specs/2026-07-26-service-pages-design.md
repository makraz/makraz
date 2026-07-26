# Dedicated Service Pages — Design

**Date:** 2026-07-26
**Status:** approved (design); implementation plan not yet written

## Goal

Give every service its own page. `/services` stays the hub listing all services; clicking any of them navigates to a page with substantially more information about that service.

Today `/services` names 17 services across three pillars as plain, unlinked text. Nothing is clickable and nothing goes deeper.

## Decisions

| Decision | Choice |
|---|---|
| Granularity | Both levels — 3 pillar pages **and** 17 leaf pages |
| Copy | Drafted in full for all pages in `fr`/`en`/`ar`; no placeholder markers |
| Leaf sections | intro → problem → what's included → how we work → case study → engagement → FAQ → related → CTA |
| Pricing | Engagement model and cost drivers, **never** figures |
| Case study | Shown only where a real project matches; section absent otherwise |
| `/services` hub | Existing layout kept; line items and pillar headings become links |
| Header nav | Unchanged — no dropdown |
| Content model | Astro content collection, one markdown file per service per locale |

## Routes

Flat namespace: slugs are unique across pillars and leaves, so a single dynamic route
`src/pages/[lang]/services/[slug].astro` serves both kinds. No nesting.

French slugs in all three locales, consistent with the existing `/a-propos` and `/mentions-legales`.

```
/{lang}/services                            hub (existing page)
/{lang}/services/developpement              pillar 01
/{lang}/services/design                     pillar 02
/{lang}/services/communication              pillar 03
/{lang}/services/<leaf-slug>                17 leaves
```

### Slug map

**Développement** (`developpement`, number `01`, 8 leaves)

| Slug | Source key |
|---|---|
| `applications-web-saas` | `services.d1_t` |
| `applications-mobiles` | `services.d2_t` |
| `sites-internet` | `services.d3_t` |
| `e-commerce` | `services.d4_t` |
| `mvp-lancement-rapide` | `services.d5_t` |
| `api-integrations` | `services.d6_t` |
| `devops-cloud` | `services.d7_t` |
| `maintenance-optimisation` | `services.d8_t` |

**Design** (`design`, number `02`, 3 leaves)

| Slug | Source key |
|---|---|
| `ux-ui-design` | `services.g1_t` |
| `branding-identite` | `services.g2_t` |
| `motion-contenu-visuel` | `services.g3_t` |

**Communication** (`communication`, number `03`, 6 leaves)

| Slug | Source key |
|---|---|
| `referencement-naturel-seo` | `services.c1_t` |
| `publicite-en-ligne-sea` | `services.c2_t` |
| `reseaux-sociaux` | `services.c3_t` |
| `strategie-digitale` | `services.c4_t` |
| `contenu-copywriting` | `services.c5_t` |
| `conseil-accompagnement` | `services.c6_t` |

20 slugs × 3 locales = **60 prerendered pages**. `@astrojs/sitemap` picks them up with no config change.

## Content model

New collection in `src/content.config.ts`, following the existing `caseStudies` / `blog` pattern:

```
src/content/services/<slug>.<lang>.md
```

Schema:

| Field | Type | Notes |
|---|---|---|
| `slug` | string | matches filename stem before the locale |
| `lang` | `'fr' \| 'en' \| 'ar'` | |
| `kind` | `'pillar' \| 'leaf'` | |
| `pillar` | string | leaf → parent slug; pillar → its own slug |
| `order` | number | ordering within the pillar (pillars: among themselves) |
| `number` | string, optional | `"01"`/`"02"`/`"03"`, pillars only |
| `title` | string | H1 |
| `lead` | string | lead paragraph under the H1 |
| `included` | `{title, description}[]` | 4–6 entries; leaves only |
| `steps` | `{title, description}[]` | 3–4 entries; leaves only |
| `engagement` | `{model, drivers}` | pricing signal; no figures |
| `faq` | `{q, a}[]` | 2–3 entries |
| `project` | enum, optional | `farblieferant` \| `phpmorocco` \| `marrakechphp` |
| body | markdown | the "Le problème" prose, 2 paragraphs |

`included` and `steps` are required on leaves and absent on pillars; the schema enforces this with a
discriminated check rather than leaving both optional for every page.

### Helper

`src/lib/services.ts` owns all taxonomy logic so the route template stays thin:

- `getServices(lang)` — all entries for a locale
- `getService(lang, slug)` — one entry or `undefined`
- `getChildren(lang, pillarSlug)` — leaves of a pillar, in `order`
- `getSiblings(lang, slug)` — same-pillar leaves excluding the current one
- `getPillars(lang)` — the three pillars in `order`

Pure functions over collection data: unit-testable without rendering a page.

### Project mapping

Only genuine matches. Anything not listed has no case-study section:

| Service | Project |
|---|---|
| `e-commerce` | `farblieferant` (case study page exists) |
| `sites-internet` | `phpmorocco` (portfolio entry) |
| `reseaux-sociaux` | `marrakechphp` (portfolio entry) |

Rationale: the site has one published case study and two portfolio entries. Mapping all 17 services to
one of them would imply experience those projects do not evidence.

## Page anatomy

### Leaf page

```
Back-link "← Tous les services"
Kicker (pillar name) · H1 (title) · lead
Le problème                markdown body, 2 paragraphs
Ce qui est inclus          `included[]`, 260px/1fr row grid (existing pattern)
Comment nous travaillons   `steps[]`, numbered in SectionIntro's style
Étude de cas               only when `project` is set — card with the existing screenshot asset
Investissement             `engagement.model` + `engagement.drivers` + link to /contact
Questions fréquentes       `faq[]`, contact-page FAQ styling
Services liés              `getSiblings()` grid
CTA band                   existing CtaBand component
```

### Pillar page

Same skeleton without `included` / `steps`, plus a grid of child services with one-line descriptions.
It functions as a category landing page, not a copy of the hub.

### Hub page (`/services`)

Layout unchanged. Line-item titles link to leaves; pillar headings link to pillar pages. No other edits.

## Components

Only one new component: `ServiceCard.astro` for the sibling and child grids. Everything else reuses
`SectionIntro`, `Kicker`, `Screenshot`, `CtaBand`, the `260px_1fr` row grid and the existing FAQ pattern.
No new design tokens, no new visual language.

## Copy

All 60 files drafted, grounded in the existing one-line descriptions, MAKRAZ's positioning (a decade of
software engineering across Switzerland, Italy and Dubai, now based in Marrakech; B2B; "built to last")
and the three real projects.

- Each "Le problème" starts from a distinct, concrete failure mode — MVPs rewritten in year two, a mobile
  app that stalls in store review, SEO retrofitted after launch — not a paraphrase of the service name.
  This is what keeps 17 pages from reading as filler.
- `engagement.model` states how the work is engaged: scoped fixed-price, monthly retainer, or day rate,
  whichever genuinely fits that service. `engagement.drivers` names what moves the estimate. **No figures.**
- No `[à valider]` / `[to confirm]` / `[à compléter]` markers.
- New UI strings (section headings, back-link, "Services liés", FAQ heading) go into the three i18n
  dictionaries under a `service.*` namespace and into `MANUAL_KEYS` in `scripts/extract-i18n.mjs`, so
  `npm run extract:i18n` cannot drop them.
- SEO title/description per page come from the collection (`title`, `lead`), not from new `seo.*` keys.

## Verification

**Unit tests** — `tests/services.test.ts`:

1. Every slug exists in all three locales (parity, mirroring the i18n test's guarantee)
2. Every leaf's `pillar` resolves to an existing pillar — no orphans
3. Pillars have exactly 8 / 3 / 6 children, returned in `order`
4. `getSiblings()` excludes the current page and never crosses pillars
5. Every `project` value resolves to a real portfolio or case-study target
6. No leaf ships an empty `included`, `steps`, `faq` or `engagement`; no pillar ships an empty `faq` or
   `engagement` (pillars legitimately have no `included`/`steps`)

**Build assertions:** 60 service routes generated; zero `_image?href` URLs in output; sitemap includes
the new pages.

**E2E** — extending `e2e/smoke.spec.ts`: hub → leaf navigation; a leaf renders in all three locales;
`/ar` leaves are RTL; sibling links resolve; the CTA reaches `/contact`.

**Manual sweep:** built output under `wrangler dev` — one pillar and two leaves at desktop and mobile
widths in `fr` and `ar`, focusing on the RTL numbered steps and the sibling grid.

## Order of work

1. Schema, helper and unit tests (TDD — the helper's contract is defined before any copy exists)
2. Route template plus 2–3 fully written services, to validate the layout
3. **Review checkpoint:** user reviews those pages before the remaining copy is written
4. Remaining service files (14 leaves + 3 pillars × 3 locales)
5. Hub page linking
6. E2E tests, full verification, deploy

## Out of scope

- Header dropdown or mega-menu
- Pricing figures
- New case study pages for PHPMorocco or MarrakechPHP
- Any redesign of the existing `/services` layout
