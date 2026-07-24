# makraz.com

Production site for [makraz.com](https://makraz.com), built with Astro on Cloudflare Pages/Workers. Visual and copy source of truth is `design_handoff_makraz_website/` (static HTML prototypes); the spec and implementation plan live under `docs/superpowers/` (`specs/`, `plans/`).

## Stack

- **Astro 7.1.3** with `@astrojs/cloudflare` 14.1.4, `output: 'static'`.
- Build produces a static client bundle at `dist/client/` and a server bundle (contact API route) at `dist/server/`; the root `wrangler.jsonc` wires both together for `wrangler dev`/`wrangler deploy`.
- Tailwind CSS 4 via `@tailwindcss/vite`.
- `@astrojs/sitemap` for the sitemap, locale-aware (`fr`/`en`/`ar`).
- Content collections: `src/content/blog/` (one article, `fr`/`en`/`ar`, shared slug via `generateId` in `content.config.ts`) and `src/content/case-studies/` (Farblieferant case study, same 3-locale pattern).

## Routes and i18n

Every page exists in three locales — `/fr`, `/en`, `/ar` — with French slugs used throughout (e.g. `/fr/a-propos`). The root `/` redirects to `/fr`. Arabic pages render right-to-left. Translation strings live in `src/i18n/*.json`, namespaced per page plus a shared `common.*` namespace.

## Contact form / API

`src/pages/api/contact.ts` sends form submissions via Resend and verifies Cloudflare Turnstile. Secrets are read at runtime via `import { env } from 'cloudflare:workers'` (not `import.meta.env`), matching how Cloudflare Pages/Workers inject bindings and secrets in production.

## Commands

```bash
npm run dev         # local dev server
npm run build        # astro build -> dist/client + dist/server
npm run preview      # wrangler-backed preview of the built output
npm run check        # astro check (TypeScript + template diagnostics)
npm test             # vitest run (unit/integration tests, excludes e2e/)
npm run test:e2e     # playwright test (builds + starts preview itself, pinned to port 4331)
npm run extract:i18n # regenerate src/i18n/*.json from design_handoff_makraz_website/ prototypes
```

`extract:i18n` (`scripts/extract-i18n.mjs`) only needs to be rerun if the design reference HTML changes. Hand-maintained translation keys that don't come from the prototypes are preserved across regeneration via the `MANUAL_KEYS` overlay in that script.

## Local development secrets

Copy `.dev.vars.example` to `.dev.vars` and fill in real values:

```bash
cp .dev.vars.example .dev.vars
```

Contains `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `PUBLIC_TURNSTILE_SITE_KEY`. `.dev.vars` is git-ignored and must never be committed.

## One-time manual setup (production)

### Cloudflare Pages

1. Create a Cloudflare Pages project connected to this repository.
2. Production branch: `main`.
3. Build command: `npm run build`. Output directory: `dist`.
4. Add environment variables:
   - `RESEND_API_KEY` (secret, production)
   - `TURNSTILE_SECRET_KEY` (secret, production)
   - `PUBLIC_TURNSTILE_SITE_KEY` (public, build-time)
5. Attach the custom domain `makraz.com` and configure a `www` redirect to the apex.

### Resend

1. Create an API key in the Resend dashboard, use it as `RESEND_API_KEY`.
2. Verify the `makraz.com` domain (add the SPF/DKIM DNS records shown in the Resend dashboard).
3. Sender address used by the contact form: `site@makraz.com`.

### Turnstile

1. Create a Turnstile widget for `makraz.com` in the Cloudflare dashboard.
2. Copy the site key into `PUBLIC_TURNSTILE_SITE_KEY` (public) and the secret key into `TURNSTILE_SECRET_KEY` (secret).

## Content gaps awaiting client input

The site builds and deploys cleanly, but the following content is still placeholder pending material from the client:

- **Portfolio screenshots and founder photo** — currently `ImagePlaceholder` slots; swap in real images once supplied.
- **Real testimonials** — `home.tm*` translation keys currently hold placeholder quotes.
- **Case study metrics** — the Farblieferant case study has `[à compléter]` markers where real performance numbers are needed.
- **Legal information** — RC/ICE/IF registration numbers and the hosting provider name are placeholders in the legal notice page.
- **Blog article review** — the existing article needs a content/editorial pass from the client before publishing.
- **EN/AR page titles and meta descriptions** — currently the French copy verbatim for all three locales; need proper translations.

## Testing

- `npm test` runs 19 Vitest tests (unit/integration, excludes `e2e/`).
- `npm run test:e2e` runs 30 Playwright tests; it builds the site and starts `wrangler`/`astro preview` itself on port 4331, so no separate server needs to be running first.
