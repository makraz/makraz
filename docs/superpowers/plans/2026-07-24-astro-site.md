# makraz.com Production Astro Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the makraz.com design handoff (9 prototype pages, trilingual FR/EN/AR) as a production, statically-prerendered Astro site on Cloudflare Pages with a single server route for the contact form.

**Architecture:** Astro 5 at the repo root with the `@astrojs/cloudflare` adapter; every page prerendered via `[lang]` dynamic routes over `fr|en|ar`; one API route (`/api/contact`, `prerender = false`) validates + Turnstile-verifies + sends mail via Resend. Tailwind v4 carries the handoff design tokens. Blog articles and the case study are content collections.

**Tech Stack:** Astro 5, @astrojs/cloudflare, Tailwind CSS v4 (`@tailwindcss/vite`), @astrojs/sitemap, Resend API, Cloudflare Turnstile, Vitest, Playwright, cheerio (dev-only, i18n extraction).

**Spec:** `docs/superpowers/specs/2026-07-24-astro-site-design.md`. **Visual source of truth:** `design_handoff_makraz_website/` — open the `.dc.html` files in a browser next to your dev server; the recreation must be pixel-perfect.

## Global Constraints

- Copy is lifted **verbatim** from the prototypes in all three languages; `[à compléter]` / `[to validate]` placeholders are preserved, never invented around.
- Design tokens (exact values, from the handoff README): ink `#0a0a0a`, page bg `#fdfdfd`, alt sections/cards `#ffffff`, secondary text `#555555`, muted `#6b6b6b`/`#8a8a8a`, borders `#ececec` (light) / `#d8d8d8` (inputs/buttons) / `#262626` (on dark), on-dark text `#ffffff`/`#d4d4d4`/`#a3a3a3`/`#737373`; radii: pills `999px`, cards `20px`, large media `24px`, inputs `12px`; container `max-width:1240px` + `32px` side padding; sections `88–110px` vertical padding; header `72px` sticky, `rgba(253,253,253,.92)` + `backdrop-filter:blur(12px)`.
- Type: Instrument Sans 400/500/600/700 (Google Fonts); Arabic pages use IBM Plex Sans Arabic and `letter-spacing: 0`. H1 `clamp(44px,6.5vw,88px)` ls `-0.035em`; H2 `clamp(34px,3.6vw,50px)` ls `-0.03em`; sub-H2 `clamp(30px,3vw,42px)`; kicker `12px` uppercase ls `.24em` `#8a8a8a` w600. `text-wrap: balance` on headlines, `text-wrap: pretty` on paragraphs. Selection black bg / white text.
- Use Tailwind **logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `text-start`…) everywhere so `/ar/` mirrors automatically — never `ml-`/`mr-`/`pl-`/`pr-`/`text-left`.
- Locales: `fr`, `en`, `ar`; URLs `/fr/…`, `/en/…`, `/ar/…` with **French slugs in all locales**; `/` redirects to `/fr/`.
- Client JS is limited to: mobile burger toggle, contact-form enhancement, Turnstile widget. Everything else is static HTML + CSS.
- Secrets `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` come from Cloudflare env (`locals.runtime.env`) — never committed, never in `import.meta.env` client code. Only `PUBLIC_TURNSTILE_SITE_KEY` is public.
- Node 22+. Git commit messages: single line, no body, no co-author trailers.
- Every task ends with `npm run build` passing (after Task 1 exists) and a commit.

---

### Task 1: Scaffold Astro project at repo root

**Files:**
- Delete: root-level `Home.dc.html`, `Services.dc.html`, `Portfolio.dc.html`, `About.dc.html`, `Contact.dc.html`, `Blog.dc.html`, `Article.dc.html`, `CaseFarblieferant.dc.html`, `Legal.dc.html`, `support.js`, `image-slot.js` (reference copies remain in `design_handoff_makraz_website/`)
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/pages/index.astro` (placeholder), `public/_redirects`
- Keep untouched: `assets/`, `uploads/`, `design_handoff_makraz_website/`, `docs/`

**Interfaces:**
- Produces: a building Astro project; `npm run dev|build|preview|check` scripts; `astro.config.mjs` with `site`, cloudflare adapter, sitemap, tailwind vite plugin.

- [ ] **Step 1: Remove duplicate prototypes from the root**

```bash
git rm Home.dc.html Services.dc.html Portfolio.dc.html About.dc.html Contact.dc.html Blog.dc.html Article.dc.html CaseFarblieferant.dc.html Legal.dc.html support.js image-slot.js
git commit -m "Remove root prototype duplicates, design reference stays in design_handoff_makraz_website"
```

- [ ] **Step 2: Scaffold Astro into the existing directory**

`npm create astro` refuses non-empty dirs interactively; scaffold in a temp dir and move the pieces:

```bash
cd /Users/hamza/Workspace/makraz.com
npm create astro@latest .astro-tmp -- --template minimal --no-git --no-install --yes
rsync -a --ignore-existing .astro-tmp/ ./
rm -rf .astro-tmp
npm install
```

- [ ] **Step 3: Add integrations**

```bash
npx astro add cloudflare sitemap --yes
npm install tailwindcss @tailwindcss/vite
npm install -D wrangler
```

- [ ] **Step 4: Write `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://makraz.com',
  output: 'static',
  adapter: cloudflare(),
  trailingSlash: 'never',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr', en: 'en', ar: 'ar' } },
    }),
  ],
  redirects: { '/': '/fr' },
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 5: Write `public/_redirects`** (edge-level redirect on Cloudflare; the config redirect covers dev/preview)

```
/ /fr 302
```

- [ ] **Step 6: Ensure `.gitignore` covers Astro**

```
node_modules/
dist/
.astro/
.wrangler/
.dev.vars
```

- [ ] **Step 7: Replace `src/pages/index.astro` placeholder content**

```astro
---
// Redirect target for '/' is generated by the `redirects` config; this file
// only exists so the build has a root page until Task 6 replaces it.
---
<meta charset="utf-8" />
```

Note: with `redirects: { '/': '/fr' }`, Astro generates the root redirect page itself and a root `index.astro` would conflict — if `astro build` reports a route collision, delete `src/pages/index.astro` entirely and rely on the config redirect. Verify which happens and keep the variant that builds.

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: `Complete!` with dist/ output, no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Astro 5 with cloudflare adapter, tailwind v4, sitemap"
```

---

### Task 2: Design tokens and global stylesheet

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: Tailwind theme tokens usable as utilities: colors `ink`, `paper`, `card`, `ink-soft` (#2e2e2e), `txt-2` (#555555), `txt-3` (#6b6b6b), `txt-4` (#8a8a8a), `line` (#ececec), `line-mid` (#d8d8d8), `line-dark` (#262626), `ondark-1` (#d4d4d4), `ondark-2` (#a3a3a3), `ondark-3` (#737373); radii `pill`, `card`, `media`, `input`; fonts `sans`, `arabic`. Component classes: `.mk-container`, `.mk-section`, `.text-h1`, `.text-h2`, `.text-h2-sub`, `.text-kicker`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-ondark`.

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import 'tailwindcss';

@theme {
  --color-ink: #0a0a0a;
  --color-ink-soft: #2e2e2e;
  --color-paper: #fdfdfd;
  --color-card: #ffffff;
  --color-txt-2: #555555;
  --color-txt-3: #6b6b6b;
  --color-txt-4: #8a8a8a;
  --color-line: #ececec;
  --color-line-mid: #d8d8d8;
  --color-line-dark: #262626;
  --color-ondark-1: #d4d4d4;
  --color-ondark-2: #a3a3a3;
  --color-ondark-3: #737373;

  --radius-pill: 999px;
  --radius-card: 20px;
  --radius-media: 24px;
  --radius-input: 12px;

  --font-sans: 'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-arabic: 'IBM Plex Sans Arabic', 'Instrument Sans', sans-serif;
}

@layer base {
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: var(--color-ink); color: #ffffff; }
  h1, h2, h3 { text-wrap: balance; }
  p { text-wrap: pretty; }
  html[lang='ar'] body,
  html[lang='ar'] input,
  html[lang='ar'] textarea,
  html[lang='ar'] button { font-family: var(--font-arabic); }
  html[lang='ar'] * { letter-spacing: 0 !important; }
}

@layer components {
  .mk-container { max-width: 1240px; margin-inline: auto; padding-inline: 32px; }
  .mk-section { padding-block: 96px; }

  .text-h1 { font-size: clamp(44px, 6.5vw, 88px); line-height: 1.02; letter-spacing: -0.035em; font-weight: 700; }
  .text-h2 { font-size: clamp(34px, 3.6vw, 50px); line-height: 1.08; letter-spacing: -0.03em; font-weight: 700; }
  .text-h2-sub { font-size: clamp(30px, 3vw, 42px); line-height: 1.1; letter-spacing: -0.03em; font-weight: 700; }
  .text-kicker { font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--color-txt-4); font-weight: 600; }

  .btn { display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-pill); font-weight: 600; text-decoration: none; cursor: pointer; transition: background-color .15s, border-color .15s, color .15s; }
  .btn-primary { background: var(--color-ink); color: #ffffff; padding: 17px 32px; font-size: 16px; }
  .btn-primary:hover { background: var(--color-ink-soft); color: #ffffff; }
  .btn-ghost { border: 1px solid var(--color-line-mid); color: var(--color-ink); padding: 16px 31px; font-size: 16px; }
  .btn-ghost:hover { border-color: var(--color-ink); }
  .btn-ondark { background: #ffffff; color: var(--color-ink); padding: 17px 32px; font-size: 16px; }
  .btn-ondark:hover { background: #e2e2e2; }
}
```

- [ ] **Step 2: Verify the stylesheet compiles**

Temporarily import it from `src/pages/index.astro` (or the redirect variant kept in Task 1 — if no root page exists, create `src/pages/_smoke.astro` importing it, check, then delete):

Run: `npm run build`
Expected: builds clean; generated CSS contains `.text-h1` and `--color-ink`.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "Add Tailwind v4 theme with handoff design tokens"
```

---

### Task 3: i18n dictionaries extracted from the prototypes

**Files:**
- Create: `scripts/extract-i18n.mjs`, `src/i18n/fr.json`, `src/i18n/en.json`, `src/i18n/ar.json`, `src/i18n/index.ts`, `tests/i18n.test.ts`
- Modify: `package.json` (scripts + vitest + cheerio devDeps)

**Interfaces:**
- Produces: `locales: readonly ['fr','en','ar']`, `type Locale`, `isLocale(x: string): x is Locale`, `t(lang: Locale, key: string): string` (falls back to FR, throws on unknown key), `dir(lang: Locale): 'ltr' | 'rtl'`, `nextLocale(lang: Locale): Locale` (fr→en→ar→fr), `localePath(lang: Locale, path: string): string` (e.g. `localePath('en','/services')` → `/en/services`). Dictionary keys are `<page>.<protoKey>` (`home.hero_title`) plus hoisted `common.<protoKey>` for nav/toggle/footer keys.

- [ ] **Step 1: Install dev deps and add scripts**

```bash
npm install -D cheerio vitest
npm pkg set scripts.extract:i18n="node scripts/extract-i18n.mjs" scripts.test="vitest run"
```

- [ ] **Step 2: Write `scripts/extract-i18n.mjs`**

FR strings are the text content of `[data-i18n]` elements; EN/AR are the `const EN = {…}` / `const AR = {…}` object literals inside each prototype's `script[data-dc-script]`. Keys listed in `COMMON` are hoisted from Home into `common.*` and must match on every page (script throws otherwise).

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';

const SRC = 'design_handoff_makraz_website';
const PAGES = {
  home: 'Home.dc.html', services: 'Services.dc.html', portfolio: 'Portfolio.dc.html',
  about: 'About.dc.html', contact: 'Contact.dc.html', blog: 'Blog.dc.html',
  article: 'Article.dc.html', case_farblieferant: 'CaseFarblieferant.dc.html', legal: 'Legal.dc.html',
};
const COMMON_RE = /^(nav_|toggle$|foot_|footer_)/;

function extractDict(scriptText, name) {
  const start = scriptText.indexOf(`const ${name} = {`);
  if (start === -1) return {};
  let i = scriptText.indexOf('{', start), depth = 0;
  for (let j = i; j < scriptText.length; j++) {
    if (scriptText[j] === '{') depth++;
    if (scriptText[j] === '}') { depth--; if (depth === 0) return new Function(`return ${scriptText.slice(i, j + 1)}`)(); }
  }
  throw new Error(`Unbalanced ${name} object`);
}

const out = { fr: {}, en: {}, ar: {} };
for (const [page, file] of Object.entries(PAGES)) {
  const html = readFileSync(`${SRC}/${file}`, 'utf8');
  const $ = load(html);
  const script = $('script[data-dc-script]').text();
  const en = extractDict(script, 'EN');
  const ar = extractDict(script, 'AR');
  $('[data-i18n]').each((_, el) => {
    const k = $(el).attr('data-i18n');
    const frVal = $(el).text().trim();
    const ns = COMMON_RE.test(k) ? 'common' : page;
    const key = `${ns}.${k}`;
    for (const [lang, dict] of [['fr', { [k]: frVal }], ['en', en], ['ar', ar]]) {
      const val = dict[k];
      if (val == null) { if (lang !== 'fr') console.warn(`MISSING ${lang} ${page}.${k}`); continue; }
      if (out[lang][key] != null && out[lang][key] !== val)
        throw new Error(`Conflict for ${key} (${lang}) between pages`);
      out[lang][key] = val;
    }
  });
}
mkdirSync('src/i18n', { recursive: true });
for (const lang of ['fr', 'en', 'ar'])
  writeFileSync(`src/i18n/${lang}.json`, JSON.stringify(out[lang], null, 2) + '\n');
console.log(`fr:${Object.keys(out.fr).length} en:${Object.keys(out.en).length} ar:${Object.keys(out.ar).length} keys`);
```

- [ ] **Step 3: Run the extraction**

Run: `npm run extract:i18n`
Expected: three JSON files written; ~450–530 keys per language; investigate every `MISSING`/`Conflict` line by opening the prototype — if a genuinely page-specific key matches `COMMON_RE`, narrow the regex rather than ignoring the conflict. Spot-check: `home.hero_title` in `fr.json` is `Des produits digitaux construits pour durer.`; `common.nav_about` exists in all three files; `ar.json` values are Arabic script.

- [ ] **Step 4: Write `src/i18n/index.ts`**

```ts
import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';

export const locales = ['fr', 'en', 'ar'] as const;
export type Locale = (typeof locales)[number];

const dicts: Record<Locale, Record<string, string>> = { fr, en, ar };

export function isLocale(x: string): x is Locale {
  return (locales as readonly string[]).includes(x);
}

export function t(lang: Locale, key: string): string {
  const v = dicts[lang][key] ?? dicts.fr[key];
  if (v == null) throw new Error(`Missing i18n key: ${key}`);
  return v;
}

export function dir(lang: Locale): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function nextLocale(lang: Locale): Locale {
  return ({ fr: 'en', en: 'ar', ar: 'fr' } as const)[lang];
}

export function localePath(lang: Locale, path: string): string {
  return `/${lang}${path === '/' ? '' : path}`;
}
```

- [ ] **Step 5: Write the failing test `tests/i18n.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { dir, isLocale, locales, localePath, nextLocale, t } from '../src/i18n';

describe('i18n', () => {
  it('exposes the three locales', () => expect(locales).toEqual(['fr', 'en', 'ar']));
  it('translates a known key in each language', () => {
    for (const lang of locales) expect(t(lang, 'common.nav_contact')).toBeTruthy();
  });
  it('falls back to FR for a key missing in EN, throws on unknown', () => {
    expect(() => t('en', 'nope.nope')).toThrow(/Missing i18n key/);
  });
  it('dir is rtl only for ar', () => {
    expect(dir('ar')).toBe('rtl');
    expect(dir('fr')).toBe('ltr');
  });
  it('nextLocale cycles fr→en→ar→fr', () => {
    expect(nextLocale('fr')).toBe('en');
    expect(nextLocale('en')).toBe('ar');
    expect(nextLocale('ar')).toBe('fr');
  });
  it('localePath prefixes and handles root', () => {
    expect(localePath('en', '/services')).toBe('/en/services');
    expect(localePath('fr', '/')).toBe('/fr');
  });
  it('isLocale guards', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('de')).toBe(false);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all i18n tests PASS (if Step 4 preceded correctly; if you wrote the test first it fails with module-not-found — either order is fine as long as it ends green).

- [ ] **Step 7: Commit**

```bash
git add scripts/extract-i18n.mjs src/i18n tests/i18n.test.ts package.json package-lock.json
git commit -m "Extract trilingual dictionaries from prototypes and add i18n helpers"
```

---

### Task 4: Base layout, Header, Footer, CTA band

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/CtaBand.astro`
- Copy: `design_handoff_makraz_website/assets/{favicon.png,og-image.png}` → `public/`; `design_handoff_makraz_website/assets/{logo-black.png,logo-white.png}` → `src/assets/`

**Interfaces:**
- Consumes: `t`, `dir`, `nextLocale`, `localePath`, `locales`, `Locale` from `src/i18n`.
- Produces: `<Base lang={Locale} path={string} title={string} description={string} active={'home'|'services'|'portfolio'|'blog'|'about'|'contact'|null}>` — renders `<html lang dir>`, fonts, SEO/OG/canonical/hreflang, Header, slot, CtaBand, Footer. `path` is the locale-less path of the current page (`'/services'`, `'/'`) used for hreflang + the language switcher. `<CtaBand lang page>` reads `<page>.cta_title|cta_sub|cta_btn` keys (falls back to `home.*` via explicit prop `page="home"` on pages without their own CTA keys — check each page's extracted keys).

- [ ] **Step 1: Copy assets**

```bash
mkdir -p src/assets
cp design_handoff_makraz_website/assets/favicon.png design_handoff_makraz_website/assets/og-image.png public/
cp design_handoff_makraz_website/assets/logo-black.png design_handoff_makraz_website/assets/logo-white.png src/assets/
```

- [ ] **Step 2: Write `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import { dir, locales, localePath, t, type Locale } from '../i18n';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import CtaBand from '../components/CtaBand.astro';

interface Props {
  lang: Locale;
  path: string; // locale-less, e.g. '/services'
  title: string;
  description: string;
  active: 'home' | 'services' | 'portfolio' | 'blog' | 'about' | 'contact' | null;
  ctaPage?: string; // namespace for CtaBand keys, default 'home'
  hideCta?: boolean;
}
const { lang, path, title, description, active, ctaPage = 'home', hideCta = false } = Astro.props;
const canonical = new URL(localePath(lang, path), Astro.site);
---
<!doctype html>
<html lang={lang} dir={dir(lang)}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {locales.map((l) => (
      <link rel="alternate" hreflang={l} href={new URL(localePath(l, path), Astro.site)} />
    ))}
    <link rel="alternate" hreflang="x-default" href={new URL(localePath('fr', path), Astro.site)} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={new URL('/og-image.png', Astro.site)} />
    <meta property="og:url" content={canonical} />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    {lang === 'ar' && (
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
    )}
    <slot name="head" />
  </head>
  <body>
    <Header {lang} {path} {active} />
    <slot />
    {!hideCta && <CtaBand {lang} page={ctaPage} />}
    <Footer {lang} />
  </body>
</html>
```

- [ ] **Step 3: Write `src/components/Header.astro`**

Recreate the prototype header exactly (`design_handoff_makraz_website/Home.dc.html:44-74`): sticky 72px, blur, logo 34px + wordmark ls .18em, nav 15px/500 with active 2px black underline, language pill, burger, black pill CTA. The language pill links to `localePath(nextLocale(lang), path)` and shows `t(lang,'common.toggle')`. Mobile menu is a hidden `<nav id="mk-mobile-menu" hidden>` toggled by an inline script:

```astro
---
import { localePath, nextLocale, t, type Locale } from '../i18n';
import logoBlack from '../assets/logo-black.png';

interface Props { lang: Locale; path: string; active: string | null }
const { lang, path, active } = Astro.props;
const links = [
  ['home', '/', 'common.nav_home'],
  ['services', '/services', 'common.nav_services'],
  ['portfolio', '/portfolio', 'common.nav_portfolio'],
  ['blog', '/blog', 'common.nav_blog'],
  ['about', '/a-propos', 'common.nav_about'],
  ['contact', '/contact', 'common.nav_contact'],
] as const;
---
<header class="sticky top-0 z-50 border-b border-line bg-[rgba(253,253,253,.92)] backdrop-blur-[12px]">
  <div class="mk-container flex h-[72px] items-center justify-between gap-6">
    <a href={localePath(lang, '/')} class="flex items-center gap-3">
      <img src={logoBlack.src} alt="MAKRAZ" class="h-[34px] w-[34px] object-contain" />
      <span class="text-[16px] font-bold tracking-[.18em]">MAKRAZ</span>
    </a>
    <nav class="mk-nav flex items-center gap-9 text-[15px] font-medium max-[900px]:hidden">
      {links.map(([key, href, label]) => (
        <a
          href={localePath(lang, href)}
          class:list={[
            'whitespace-nowrap py-1',
            active === key ? 'border-b-2 border-ink' : 'text-txt-3 hover:text-ink',
          ]}
        >{t(lang, label)}</a>
      ))}
    </nav>
    <div class="flex items-center gap-[18px]">
      <a
        href={localePath(nextLocale(lang), path)}
        class="rounded-pill border border-line-mid px-[14px] py-[7px] text-[13px] font-semibold tracking-[.06em] hover:border-ink"
      >{t(lang, 'common.toggle')}</a>
      <button
        id="mk-burger"
        aria-label="Menu"
        aria-expanded="false"
        aria-controls="mk-mobile-menu"
        class="hidden rounded-pill border border-line-mid px-[14px] py-[7px] text-[15px] leading-none max-[900px]:inline-flex"
      >☰</button>
      <a
        href={localePath(lang, '/contact')}
        class="btn bg-ink px-[22px] py-[11px] text-[14px] text-white hover:bg-ink-soft max-[900px]:hidden"
      >{t(lang, 'common.nav_cta')}</a>
    </div>
  </div>
  <nav id="mk-mobile-menu" hidden class="flex flex-col border-t border-line px-8 pb-4 pt-2 text-[16px] font-semibold">
    {links.map(([, href, label]) => (
      <a href={localePath(lang, href)} class="py-3">{t(lang, label)}</a>
    ))}
  </nav>
</header>
<script>
  const burger = document.getElementById('mk-burger');
  const menu = document.getElementById('mk-mobile-menu');
  burger?.addEventListener('click', () => {
    const open = menu!.toggleAttribute('hidden');
    burger.setAttribute('aria-expanded', String(!open));
  });
</script>
```

- [ ] **Step 4: Write `src/components/CtaBand.astro` and `src/components/Footer.astro`**

Port from any prototype's black CTA band + footer markup (e.g. `Home.dc.html`, the `#0a0a0a` sections before `</x-dc>`): CtaBand = centered white logo 44px, `text-h2` white headline `t(lang, \`${page}.cta_title\`)`, sub `t(lang, \`${page}.cta_sub\`)` in `ondark-2`, `.btn-ondark` button linking to `localePath(lang,'/contact')`. Footer = 3-column grid (brand block with white logo 30px + wordmark + description `#a3a3a3`; Navigation column reusing the same 6 links; Contact column with `mailto:contact@makraz.com`, `tel:+212661764392`, address link `https://share.google/WllPHd9fKnFBdVmS0`), bottom bar `© 2026 MAKRAZ SARLAU` / `t(lang,'common.foot_built')` 13px `ondark-3`, plus the Legal page link `localePath(lang,'/mentions-legales')`. Use the exact footer i18n keys found in `src/i18n/fr.json` (all `common.foot*` / `common.footer*` keys — check the extracted file, don't guess).

- [ ] **Step 5: Smoke-render the layout**

Point the Task 1 placeholder page (or a temporary `src/pages/[lang]/index.astro` with `getStaticPaths` over locales rendering `<Base>` with an empty slot) at the layout.

Run: `npm run build`
Expected: builds; `dist/fr/index.html` contains the header nav, hreflang trio, CTA band, and footer.

- [ ] **Step 6: Commit**

```bash
git add src/layouts src/components src/assets public/favicon.png public/og-image.png
git commit -m "Add base layout with SEO/hreflang plus header, footer, CTA band"
```

---

### Task 5: Shared UI components

**Files:**
- Create: `src/components/Kicker.astro`, `src/components/ImagePlaceholder.astro`, `src/components/SectionIntro.astro`

**Interfaces:**
- Produces: `<Kicker>text</Kicker>` (kicker style + 28px bottom margin variant via `class` passthrough); `<ImagePlaceholder ratio="4/3"|"16/11"|"1/1" label={string} radius="card"|"media" />` (grey `#f3f3f3` slot with centered muted label — stands in for missing portfolio/team photos); `<SectionIntro lang number title …>` sticky 340px intro column used by Services/About (`position: sticky; top: 104px` with `max-[900px]:static`).

- [ ] **Step 1: Write the three components**

`Kicker.astro`:

```astro
---
const { class: className = '' } = Astro.props;
---
<div class:list={['text-kicker', className]}><slot /></div>
```

`ImagePlaceholder.astro`:

```astro
---
interface Props { ratio?: string; label?: string; radius?: 'card' | 'media'; class?: string }
const { ratio = '4/3', label = 'Image à venir', radius = 'card', class: className = '' } = Astro.props;
---
<div
  class:list={[
    'flex items-center justify-center bg-[#f3f3f3] text-[13px] text-txt-4',
    radius === 'media' ? 'rounded-media' : 'rounded-card',
    className,
  ]}
  style={`aspect-ratio: ${ratio};`}
>{label}</div>
```

`SectionIntro.astro`:

```astro
---
interface Props { number?: string; title: string; class?: string }
const { number, title, class: className = '' } = Astro.props;
---
<div class:list={['mk-sticky w-[340px] shrink-0 self-start sticky top-[104px] max-[900px]:static max-[900px]:w-auto', className]}>
  {number && <div class="text-kicker mb-4">{number}</div>}
  <h2 class="text-h2 m-0">{title}</h2>
  <slot />
</div>
```

- [ ] **Step 2: Verify build, commit**

Run: `npm run build` — Expected: clean.

```bash
git add src/components
git commit -m "Add shared kicker, image placeholder, sticky section intro components"
```

---

### Task 6: Home page (all locales) + root redirect + JSON-LD

**Files:**
- Create: `src/pages/[lang]/index.astro`
- Delete: `src/pages/index.astro` placeholder if Task 1 kept it and the config redirect works (verify per Task 1 Step 7 note)

**Interfaces:**
- Consumes: `Base`, `Kicker`, `ImagePlaceholder`, i18n helpers.
- Produces: `/fr`, `/en`, `/ar` home pages. Establishes the `getStaticPaths` pattern every later page copies:

```astro
---
import Base from '../../layouts/Base.astro';
import { locales, t, type Locale } from '../../i18n';

export function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}
const lang = Astro.params.lang as Locale;
---
```

- [ ] **Step 1: Build the page section by section**

Source: `design_handoff_makraz_website/Home.dc.html` (open it in a browser as the visual reference) and the handoff README "Home" spec. Sections in order, all copy via `t(lang, 'home.<key>')` using the keys present in `src/i18n/fr.json`:

1. **Hero** (`mk-container`, pt-110px pb-90px): `<Kicker>` `home.hero_kicker`, `<h1 class="text-h1 max-w-[14ch]">` `home.hero_title`, sub-paragraph 20px `txt-2` max-w-56ch, `.btn-primary` → contact + `.btn-ghost` → portfolio; stats row: 3 columns with top border `line`, each stat number 40px/700 + label. Example markup for the hero head (pattern for everything below):

```astro
<section class="mk-container pb-[90px] pt-[110px]">
  <Kicker class="mb-7">{t(lang, 'home.hero_kicker')}</Kicker>
  <h1 class="text-h1 m-0 max-w-[14ch]">{t(lang, 'home.hero_title')}</h1>
  <p class="mb-11 mt-8 max-w-[56ch] text-[20px] leading-[1.6] text-txt-2">{t(lang, 'home.hero_sub')}</p>
  <div class="flex flex-wrap items-center gap-4">
    <a href={localePath(lang, '/contact')} class="btn btn-primary">{t(lang, 'home.hero_cta1')}</a>
    <a href={localePath(lang, '/portfolio')} class="btn btn-ghost">{t(lang, 'home.hero_cta2')}</a>
  </div>
  <!-- stats row: port from prototype -->
</section>
```

2. **Pillars** (white bg section): H2 + 3 cards (border `line`, `rounded-card`, p-[40px_36px], `hover:border-ink`), each 01/02/03 number, title, description, 3 dash-prefixed items; link to services.
3. **Selected work**: 3 `ImagePlaceholder ratio="4/3"` cards + name 19px/700 + tag 14px `txt-4`; link to portfolio.
4. **Process**: 5 columns (`grid-cols-5`, `max-[900px]:grid-cols-2`, `max-[560px]:grid-cols-1`), each with 2px black top border, number, 19px/700 title, 14px description.
5. **Audience**: 2×2 grid with hairline dividers (`divide` borders per prototype), 4 cells.
6. **Testimonials**: 3 draft quotes + anonymous role labels (keys `home.tm1_q`…`home.tm3_a`).

Port each section by reading the prototype's inline styles and mapping them 1:1 to Tailwind utilities/logical properties; keep every `data-i18n` key. Do not restyle, "improve", or reorder anything.

- [ ] **Step 2: Add JSON-LD Organization to the head slot**

```astro
<script slot="head" type="application/ld+json" set:html={JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MAKRAZ SARLAU',
  url: 'https://makraz.com',
  logo: 'https://makraz.com/og-image.png',
  email: 'contact@makraz.com',
  telephone: '+212661764392',
  address: { '@type': 'PostalAddress', addressLocality: 'Marrakech', addressCountry: 'MA', streetAddress: "Centre d'affaires Itrane" },
})} />
```

- [ ] **Step 3: Visual check against the prototype**

Run: `npm run dev`, open `http://localhost:4321/fr` next to `design_handoff_makraz_website/Home.dc.html` in the browser. Compare hero, cards, spacing, hovers at desktop and ≤900px. Check `/ar` renders RTL with Arabic copy.

- [ ] **Step 4: Build and commit**

Run: `npm run build` — Expected: `dist/fr/index.html`, `dist/en/index.html`, `dist/ar/index.html` all emitted.

```bash
git add -A
git commit -m "Add trilingual home page with JSON-LD and root redirect"
```

---

### Task 7: Services page

**Files:**
- Create: `src/pages/[lang]/services.astro`

**Interfaces:**
- Consumes: `Base`, `Kicker`, `SectionIntro`, i18n. Same `getStaticPaths` pattern as Task 6.

- [ ] **Step 1: Build the page**

Source: `design_handoff_makraz_website/Services.dc.html` + README "Services" spec. Hero, then three catalog sections alternating `bg-card`/`bg-paper`, each: flex row (`max-[900px]:flex-col`) of `<SectionIntro number title>` + right-hand list where each row is `grid grid-cols-[260px_1fr] max-[900px]:grid-cols-1` with `py-[26px]` and `border-b border-line` hairlines — Développement (8 rows), Design (3 rows), Communication (6 rows). All copy `t(lang, 'services.<key>')`. Title/description per `Base` props from `services.*` meta keys (check extracted JSON for the page's `<title>`/description equivalents; if the prototypes didn't tag them with data-i18n, take them from each prototype's `<title>`/`<meta name="description">` verbatim and hardcode per-lang in a small object in the frontmatter).

- [ ] **Step 2: Visual check** — dev server vs `Services.dc.html`, desktop + mobile + `/ar`. Sticky intro column must stick at desktop and go static ≤900px.

- [ ] **Step 3: Build and commit**

```bash
git add src/pages
git commit -m "Add trilingual services page"
```

---

### Task 8: Portfolio page + case-study content collection + Farblieferant page

**Files:**
- Create: `src/content.config.ts`, `src/content/case-studies/farblieferant.{fr,en,ar}.md`, `src/pages/[lang]/portfolio.astro`, `src/pages/[lang]/portfolio/farblieferant.astro`

**Interfaces:**
- Produces: `caseStudies` collection with schema `{ project: string, lang: enum(fr|en|ar), kicker: string, stack: string[], results: { value: string, label: string }[] }` and markdown body = context/solution sections. Entry id convention: `<slug>.<lang>`.

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
  schema: z.object({
    project: z.string(),
    lang: z.enum(['fr', 'en', 'ar']),
    kicker: z.string(),
    stack: z.array(z.string()),
    results: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['fr', 'en', 'ar']),
    slug: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    authorRole: z.string(),
  }),
});

export const collections = { caseStudies, blog };
```

(The `blog` collection is consumed in Task 11.)

- [ ] **Step 2: Transcribe the case study**

From `design_handoff_makraz_website/CaseFarblieferant.dc.html` (use `src/i18n/*.json` `case_farblieferant.*` keys as the transcription source — they were extracted in Task 3): create `farblieferant.fr.md`, `.en.md`, `.ar.md` with frontmatter per the schema and the context/solution copy as markdown body under `## <context heading>` / `## <solution heading>` using the exact extracted strings, `[à compléter]` placeholders included. Remove the `case_farblieferant.*` namespace usage from i18n at render time — the page reads the collection, not `t()` (nav/CTA still via `t()`).

- [ ] **Step 3: Build `portfolio.astro`**

Source: `Portfolio.dc.html` + README "Portfolio" spec. Hero + 3 featured case studies, alternating 2-col layouts `grid-cols-[1.25fr_1fr]` (swap order on alternates with `order` utilities), `ImagePlaceholder ratio="16/11" radius="media"`, kicker + `text-h2` name + paragraph + 3 dash services + external link (farblieferant.de, phpmorocco.ma, marrakechphp.ma, `target="_blank" rel="noopener"`), and the "Lire l'étude de cas" link on Farblieferant → `localePath(lang, '/portfolio/farblieferant')`. Copy via `t(lang, 'portfolio.<key>')`.

- [ ] **Step 4: Build `portfolio/farblieferant.astro`**

```astro
---
import { getCollection } from 'astro:content';
import { render } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import { locales, type Locale } from '../../../i18n';

export async function getStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}
const lang = Astro.params.lang as Locale;
const entries = await getCollection('caseStudies', (e) => e.data.lang === lang && e.id.startsWith('farblieferant'));
const entry = entries[0];
const { Content } = await render(entry);
---
```

Layout per the prototype: kicker/H2 hero, prose body (`Content`), stack chips (pill borders), results metrics grid. Match `CaseFarblieferant.dc.html` visually.

- [ ] **Step 5: Visual check + build + commit**

Run: `npm run build` — Expected: `/…/portfolio` and `/…/portfolio/farblieferant` ×3 locales in dist.

```bash
git add -A
git commit -m "Add portfolio page and Farblieferant case study via content collection"
```

---

### Task 9: About page

**Files:**
- Create: `src/pages/[lang]/a-propos.astro`

- [ ] **Step 1: Build the page**

Source: `About.dc.html` + README "À propos" spec. Hero; "Le parcours" (SectionIntro + 4 timeline rows: Suisse, Italie, Dubaï, Marrakech/MAKRAZ, hairline dividers); "Nos valeurs" 2×2 cards; "L'équipe" (280px square `ImagePlaceholder ratio="1/1"` + name + "Fondateur — Ingénieur logiciel" + bio). Copy via `t(lang, 'about.<key>')`.

- [ ] **Step 2: Visual check vs prototype (desktop/mobile/ar), build, commit**

```bash
git add src/pages
git commit -m "Add trilingual about page"
```

---

### Task 10: Contact page UI + FAQ (form UI only, no backend yet)

**Files:**
- Create: `src/pages/[lang]/contact.astro`, `src/components/ContactForm.astro`

**Interfaces:**
- Produces: `<ContactForm lang siteKey>` — `<form method="POST" action="/api/contact">` with fields `name`, `email`, `company`, `message`, hidden `lang`, Turnstile widget div, honeypot field `website` (visually hidden, must stay empty), submit `.btn-primary w-full`. Status messages rendered as three hidden elements `#form-sent`, `#form-error` (shown via `:target` for the no-JS redirect flow and via the enhancement script for fetch). The API contract this form targets (Task 12 implements it): POST JSON or form-encoded `{name, email, company?, message, lang, 'cf-turnstile-response', website?}` → `200 {ok:true}` | `400 {ok:false, errors: Record<string,string>}` | `500 {ok:false, error:string}`; non-JS form posts get `303` redirects to `/{lang}/contact#form-sent` or `#form-error`.

- [ ] **Step 1: Build the page**

Source: `Contact.dc.html` + README "Contact" spec. Two columns `grid-cols-[1fr_1.1fr] gap-20 max-[900px]:grid-cols-1`. Left: H1, response-within-24h paragraph, stacked contact rows (label `txt-4` 14px start, value 17px/600 end, hairline dividers): Email, WhatsApp (`https://wa.me/212661764392`), Téléphone (`tel:+212661764392`), Bureau (link `https://share.google/WllPHd9fKnFBdVmS0`), Langues FR·EN·AR. Right: form card (`bg-card border border-line rounded-media p-12 max-[900px]:p-7`). Below: FAQ section, 6 native `<details>`/`<summary>` items (keys `contact.faq*`).

- [ ] **Step 2: Write `ContactForm.astro`**

```astro
---
import { localePath, t, type Locale } from '../i18n';
interface Props { lang: Locale }
const { lang } = Astro.props;
const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
---
<form id="mk-contact" method="POST" action="/api/contact" class="grid gap-5">
  <input type="hidden" name="lang" value={lang} />
  <p class="hidden" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off" /></p>
  <div class="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
    <label class="grid gap-2 text-[14px] font-semibold">
      {t(lang, 'contact.f_name')}
      <input name="name" required class="rounded-input border border-line-mid px-4 py-3 text-[16px] focus:border-ink focus:outline-none" />
    </label>
    <label class="grid gap-2 text-[14px] font-semibold">
      {t(lang, 'contact.f_email')}
      <input name="email" type="email" required class="rounded-input border border-line-mid px-4 py-3 text-[16px] focus:border-ink focus:outline-none" />
    </label>
  </div>
  <label class="grid gap-2 text-[14px] font-semibold">
    {t(lang, 'contact.f_company')}
    <input name="company" class="rounded-input border border-line-mid px-4 py-3 text-[16px] focus:border-ink focus:outline-none" />
  </label>
  <label class="grid gap-2 text-[14px] font-semibold">
    {t(lang, 'contact.f_message')}
    <textarea name="message" required rows="6" class="rounded-input border border-line-mid px-4 py-3 text-[16px] focus:border-ink focus:outline-none"></textarea>
  </label>
  {siteKey && <div class="cf-turnstile" data-sitekey={siteKey}></div>}
  <button type="submit" class="btn btn-primary w-full">{t(lang, 'contact.f_send')}</button>
  <p id="form-sending" hidden class="m-0 text-[14px] text-txt-3">{t(lang, 'contact.f_sending')}</p>
  <p id="form-sent" class="mk-status m-0 text-[14px] font-semibold">{t(lang, 'contact.f_sent')}</p>
  <p id="form-error" class="mk-status m-0 text-[14px] font-semibold">{t(lang, 'contact.f_error')}</p>
</form>
{siteKey && <script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>}
<style>
  .mk-status { display: none; }
  .mk-status:target { display: block; }
  .mk-status.show { display: block; }
</style>
<script>
  const form = document.getElementById('mk-contact') as HTMLFormElement;
  const show = (id: string) => {
    for (const el of form.querySelectorAll('.mk-status, #form-sending')) el.classList.remove('show');
    document.getElementById(id)?.classList.add('show');
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('form-sending')?.removeAttribute('hidden');
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await r.json();
      document.getElementById('form-sending')?.setAttribute('hidden', '');
      show(data.ok ? 'form-sent' : 'form-error');
      if (data.ok) form.reset();
    } catch {
      document.getElementById('form-sending')?.setAttribute('hidden', '');
      show('form-error');
    }
  });
</script>
```

Note the exact `contact.f_*` key names must be taken from `src/i18n/fr.json` (the extraction preserves the prototype's key names — adjust the snippet's keys to the real ones, e.g. if the prototype used `form_name` use `contact.form_name`).

- [ ] **Step 3: Visual check, build, commit**

The form will 404 on submit until Task 12 — expected at this stage.

```bash
git add -A
git commit -m "Add trilingual contact page with form UI and FAQ"
```

---

### Task 11: Blog collection, blog index, article page

**Files:**
- Create: `src/content/blog/choisir-agence.{fr,en,ar}.md` (slug: take the real article slug from the prototype's title — keep one French slug for all langs), `src/pages/[lang]/blog/index.astro`, `src/pages/[lang]/blog/[slug].astro`

**Interfaces:**
- Consumes: `blog` collection from Task 8's `content.config.ts` (`title, description, lang, slug, date, author, authorRole`).
- Produces: `/…/blog` index (post 1 card links to the article; posts 2–3 are "À venir" cards, no links) and `/…/blog/<slug>` article pages.

- [ ] **Step 1: Transcribe the article**

From `Article.dc.html` (via the extracted `article.*` keys): frontmatter (title, description, date from prototype, author "Hamza Makraz", authorRole from prototype) + full body per language as markdown (headings/paragraphs in prototype order). This is the sample draft article — transcribe verbatim, it's flagged for later review.

- [ ] **Step 2: Build `blog/index.astro`**

Source: `Blog.dc.html`. Hero + 3 post cards: card 1 from the collection (`getCollection('blog', e => e.data.lang === lang)`, link `localePath(lang, \`/blog/${e.data.slug}\`)`); cards 2–3 static "À venir" from `t(lang, 'blog.<key>')` keys, no anchor.

- [ ] **Step 3: Build `blog/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import { locales, type Locale } from '../../../i18n';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { lang: post.data.lang, slug: post.data.slug },
    props: { post },
  }));
}
const { post } = Astro.props;
const lang = Astro.params.lang as Locale;
const { Content } = await render(post);
---
```

Article layout per `Article.dc.html`: kicker (date), H1, author block, prose body (style the markdown: 17–18px body, 1.7 line-height, `txt-2`… match prototype), back-to-blog link. `path` prop for Base: `` `/blog/${post.data.slug}` ``.

- [ ] **Step 4: Visual check, build, commit**

Run: `npm run build` — Expected: blog index + 1 article ×3 locales.

```bash
git add -A
git commit -m "Add blog index and article pages via content collection"
```

---

### Task 12: Contact API route (TDD)

**Files:**
- Create: `src/lib/contact.ts`, `tests/contact.test.ts`, `src/pages/api/contact.ts`, `.dev.vars.example`

**Interfaces:**
- Consumes: form contract from Task 10.
- Produces: `src/lib/contact.ts` exporting:
  - `parseSubmission(data: FormData | Record<string, unknown>): Submission` where `type Submission = { name: string; email: string; company: string; message: string; lang: 'fr'|'en'|'ar'; turnstileToken: string; honeypot: string }` (missing fields become `''`, lang defaults `'fr'`)
  - `validate(s: Submission): Record<string, string>` (empty object = valid; checks name/message non-empty, email matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, honeypot empty)
  - `verifyTurnstile(token: string, secret: string, ip: string | null, fetchImpl?: typeof fetch): Promise<boolean>` (POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify`)
  - `sendViaResend(s: Submission, apiKey: string, fetchImpl?: typeof fetch): Promise<boolean>` (POST `https://api.resend.com/emails`, from `MAKRAZ Site <site@makraz.com>`, to `contact@makraz.com`, `reply_to` visitor email, subject `` `Contact makraz.com — ${s.name}` ``, text body with all fields)

- [ ] **Step 1: Write the failing tests `tests/contact.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest';
import { parseSubmission, sendViaResend, validate, verifyTurnstile } from '../src/lib/contact';

const valid = {
  name: 'Jane', email: 'jane@example.com', company: '', message: 'Bonjour',
  lang: 'fr' as const, turnstileToken: 'tok', honeypot: '',
};

describe('parseSubmission', () => {
  it('reads FormData fields including turnstile + honeypot', () => {
    const fd = new FormData();
    fd.set('name', 'Jane'); fd.set('email', 'jane@example.com');
    fd.set('message', 'Bonjour'); fd.set('lang', 'ar');
    fd.set('cf-turnstile-response', 'tok'); fd.set('website', '');
    const s = parseSubmission(fd);
    expect(s).toMatchObject({ name: 'Jane', lang: 'ar', turnstileToken: 'tok', honeypot: '' });
  });
  it('defaults missing fields to empty string and lang to fr', () => {
    const s = parseSubmission({});
    expect(s).toMatchObject({ name: '', email: '', message: '', lang: 'fr' });
  });
});

describe('validate', () => {
  it('accepts a valid submission', () => expect(validate(valid)).toEqual({}));
  it('rejects missing name, bad email, empty message', () => {
    const errors = validate({ ...valid, name: '', email: 'nope', message: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
  });
  it('rejects filled honeypot', () => {
    expect(validate({ ...valid, honeypot: 'spam' })).toHaveProperty('honeypot');
  });
});

describe('verifyTurnstile', () => {
  it('returns true on success:true', async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
    await expect(verifyTurnstile('tok', 'secret', '1.2.3.4', f)).resolves.toBe(true);
    const body = f.mock.calls[0][1].body as URLSearchParams;
    expect(body.get('secret')).toBe('secret');
    expect(body.get('response')).toBe('tok');
  });
  it('returns false on success:false or fetch failure', async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false })));
    await expect(verifyTurnstile('tok', 'secret', null, f)).resolves.toBe(false);
    const boom = vi.fn().mockRejectedValue(new Error('net'));
    await expect(verifyTurnstile('tok', 'secret', null, boom)).resolves.toBe(false);
  });
});

describe('sendViaResend', () => {
  it('POSTs to resend with auth header and reply_to', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(sendViaResend(valid, 'key123', f)).resolves.toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer key123');
    expect(JSON.parse(init.body).reply_to).toBe('jane@example.com');
  });
  it('returns false on non-2xx', async () => {
    const f = vi.fn().mockResolvedValue(new Response('err', { status: 500 }));
    await expect(sendViaResend(valid, 'key123', f)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../src/lib/contact`.

- [ ] **Step 3: Implement `src/lib/contact.ts`**

```ts
export const langs = ['fr', 'en', 'ar'] as const;
export type Lang = (typeof langs)[number];

export type Submission = {
  name: string; email: string; company: string; message: string;
  lang: Lang; turnstileToken: string; honeypot: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(data: FormData | Record<string, unknown>, key: string): string {
  const v = data instanceof FormData ? data.get(key) : data[key];
  return typeof v === 'string' ? v.trim() : '';
}

export function parseSubmission(data: FormData | Record<string, unknown>): Submission {
  const rawLang = field(data, 'lang');
  return {
    name: field(data, 'name'),
    email: field(data, 'email'),
    company: field(data, 'company'),
    message: field(data, 'message'),
    lang: (langs as readonly string[]).includes(rawLang) ? (rawLang as Lang) : 'fr',
    turnstileToken: field(data, 'cf-turnstile-response'),
    honeypot: field(data, 'website'),
  };
}

export function validate(s: Submission): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!s.name) errors.name = 'required';
  if (!EMAIL_RE.test(s.email)) errors.email = 'invalid';
  if (!s.message) errors.message = 'required';
  if (s.honeypot) errors.honeypot = 'spam';
  return errors;
}

export async function verifyTurnstile(
  token: string, secret: string, ip: string | null, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const r = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await r.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function sendViaResend(
  s: Submission, apiKey: string, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const r = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'MAKRAZ Site <site@makraz.com>',
        to: ['contact@makraz.com'],
        reply_to: s.email,
        subject: `Contact makraz.com — ${s.name}`,
        text: `Nom: ${s.name}\nEmail: ${s.email}\nSociété: ${s.company || '—'}\nLangue: ${s.lang}\n\n${s.message}`,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Write the API route `src/pages/api/contact.ts`**

```ts
export const prerender = false;

import type { APIRoute } from 'astro';
import { parseSubmission, sendViaResend, validate, verifyTurnstile } from '../../lib/contact';

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const env = locals.runtime.env as { RESEND_API_KEY: string; TURNSTILE_SECRET_KEY: string };
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  const s = parseSubmission(await request.formData());
  const back = (frag: 'form-sent' | 'form-error') => redirect(`/${s.lang}/contact#${frag}`, 303);

  const errors = validate(s);
  if (Object.keys(errors).length) return wantsJson ? json({ ok: false, errors }, 400) : back('form-error');

  const ip = request.headers.get('cf-connecting-ip');
  if (!(await verifyTurnstile(s.turnstileToken, env.TURNSTILE_SECRET_KEY, ip)))
    return wantsJson ? json({ ok: false, error: 'turnstile' }, 400) : back('form-error');

  if (!(await sendViaResend(s, env.RESEND_API_KEY)))
    return wantsJson ? json({ ok: false, error: 'send' }, 500) : back('form-error');

  return wantsJson ? json({ ok: true }, 200) : back('form-sent');
};
```

If `locals.runtime` is untyped, add to `src/env.d.ts`:

```ts
type Runtime = import('@astrojs/cloudflare').Runtime<{ RESEND_API_KEY: string; TURNSTILE_SECRET_KEY: string }>;
declare namespace App {
  interface Locals extends Runtime {}
}
```

- [ ] **Step 6: Write `.dev.vars.example`** (local dev secrets template; `.dev.vars` is gitignored)

```
RESEND_API_KEY=re_xxx
TURNSTILE_SECRET_KEY=0x_xxx
```

- [ ] **Step 7: Build and verify the route is server-rendered**

Run: `npm run build`
Expected: build output lists `/api/contact` as a server (on-demand) route, `_worker.js` emitted.

- [ ] **Step 8: Commit**

```bash
git add src/lib src/pages/api tests/contact.test.ts src/env.d.ts .dev.vars.example
git commit -m "Add contact API route with validation, Turnstile and Resend"
```

---

### Task 13: Legal page + robots.txt

**Files:**
- Create: `src/pages/[lang]/mentions-legales.astro`, `public/robots.txt`

- [ ] **Step 1: Build the page**

Source: `Legal.dc.html` (trilingual since handoff v3; French version prevails — the prototype states this). Sections: mentions légales (éditeur, RC/ICE/IF `[à compléter]` placeholders, hosting provider placeholder) + politique de confidentialité (loi 09-08 + RGPD). Copy via `t(lang, 'legal.<key>')`. `hideCta` on Base if the prototype has no CTA band (check the prototype's footer area).

- [ ] **Step 2: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://makraz.com/sitemap-index.xml
```

- [ ] **Step 3: Build, verify sitemap**

Run: `npm run build && ls dist/sitemap*`
Expected: `sitemap-index.xml` + sitemap parts exist and contain `/fr/`, `/en/`, `/ar/` URLs with `xhtml:link` alternates.

- [ ] **Step 4: Commit**

```bash
git add src/pages public/robots.txt
git commit -m "Add trilingual legal page and robots.txt"
```

---

### Task 14: Playwright smoke tests

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`
- Modify: `package.json` (script `test:e2e`)

- [ ] **Step 1: Install**

```bash
npm install -D @playwright/test
npx playwright install chromium
npm pkg set scripts.test:e2e="playwright test"
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/fr',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: 'http://localhost:4321' },
});
```

(`astro preview` with the cloudflare adapter runs `wrangler pages dev` — wrangler was installed in Task 1. If the preview port differs, read it from the command output and align `url`/`baseURL`.)

- [ ] **Step 3: Write `e2e/smoke.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

const langs = ['fr', 'en', 'ar'] as const;
const paths = ['', '/services', '/portfolio', '/portfolio/farblieferant', '/a-propos', '/contact', '/blog', '/mentions-legales'];

for (const lang of langs) {
  for (const path of paths) {
    test(`renders /${lang}${path}`, async ({ page }) => {
      const res = await page.goto(`/${lang}${path}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  }
}

test('root redirects to /fr', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/fr\/?$/);
});

test('arabic pages are RTL with arabic font override', async ({ page }) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('language switcher cycles fr → en on the same page', async ({ page }) => {
  await page.goto('/fr/services');
  await page.locator('header a[href="/en/services"]').click();
  await expect(page).toHaveURL(/\/en\/services$/);
});

test('blog article renders', async ({ page }) => {
  await page.goto('/fr/blog');
  const article = page.locator('main a[href*="/fr/blog/"], a[href*="/fr/blog/"]').first();
  await article.click();
  await expect(page.locator('h1')).toBeVisible();
});

test('contact form success path (mocked endpoint)', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.goto('/fr/contact');
  await page.fill('input[name="name"]', 'Test');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Bonjour');
  await page.click('#mk-contact button[type="submit"]');
  await expect(page.locator('#form-sent')).toBeVisible();
});

test('contact form error path (mocked endpoint)', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false,"error":"send"}' }),
  );
  await page.goto('/fr/contact');
  await page.fill('input[name="name"]', 'Test');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Bonjour');
  await page.click('#mk-contact button[type="submit"]');
  await expect(page.locator('#form-error')).toBeVisible();
});
```

- [ ] **Step 4: Run the suite**

Run: `npm run test:e2e`
Expected: all tests PASS (26 page renders + behavior tests). Fix any failures in the pages, not by loosening tests.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json
git commit -m "Add Playwright smoke tests for all pages, locales, form and RTL"
```

---

### Task 15: Deployment docs + final verification

**Files:**
- Create: `README.md` (repo root)

- [ ] **Step 1: Write `README.md`**

Cover exactly:
- Project intro (production site for makraz.com, built from `design_handoff_makraz_website/` designs; spec + plan under `docs/superpowers/`).
- Commands: `npm run dev`, `build`, `preview`, `test`, `test:e2e`, `extract:i18n` (regenerates `src/i18n/*.json` from the prototypes — rerun only if the design reference changes).
- **Cloudflare Pages setup (one-time, manual):** create Pages project connected to this repo, branch `main`, build command `npm run build`, output `dist`; add env vars `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` (production secrets) and `PUBLIC_TURNSTILE_SITE_KEY` (build-time public); custom domain makraz.com + www redirect.
- **Resend setup:** create API key, verify makraz.com domain (SPF/DKIM DNS records shown in Resend dashboard); sender `site@makraz.com`.
- **Turnstile setup:** create widget for makraz.com in the Cloudflare dashboard, copy site key (public env) + secret key.
- Local dev secrets: copy `.dev.vars.example` → `.dev.vars`.
- Content gaps awaiting client input: portfolio screenshots + founder photo (replace `ImagePlaceholder` usages), real testimonials (`home.tm*` keys), case-study `[à compléter]` metrics, legal RC/ICE/IF + host, blog article review.

- [ ] **Step 2: Full verification pass**

Run: `npx astro check && npm test && npm run build && npm run test:e2e`
Expected: everything green.

- [ ] **Step 3: Final visual sweep**

Open every built page next to its prototype (9 pages, spot-check EN + AR variants; mobile width 390px and desktop 1440px). Fix discrepancies found; re-run build.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Add README with deployment and setup documentation"
```
